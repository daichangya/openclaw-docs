---
read_when:
    - Signal サポートの設定
    - Signal の送受信をデバッグする
summary: '`signal-cli`（JSON-RPC + SSE）経由の Signal サポート、セットアップパス、および番号モデル'
title: Signal
x-i18n:
    generated_at: "2026-04-25T13:42:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1ff4328aae73576a78b00be3dd79e9768badfc6193843ed3c05439765ae295
    source_path: channels/signal.md
    workflow: 15
---

ステータス: 外部CLI統合。Gateway は HTTP JSON-RPC + SSE 経由で `signal-cli` と通信します。

## 前提条件

- サーバーに OpenClaw がインストールされていること（以下の Linux フローは Ubuntu 24 でテスト済み）。
- Gateway が動作するホストで `signal-cli` を利用できること。
- 1回の認証SMSを受信できる電話番号があること（SMS登録パスの場合）。
- 登録時に Signal の captcha（`signalcaptchas.org`）へアクセスできるブラウザがあること。

## クイックセットアップ（初級者向け）

1. ボットには**別の Signal 番号**を使用します（推奨）。
2. `signal-cli` をインストールします（JVM ビルドを使う場合は Java が必要）。
3. セットアップパスを1つ選びます:
   - **パス A（QR リンク）:** `signal-cli link -n "OpenClaw"` を実行し、Signal でスキャンします。
   - **パス B（SMS 登録）:** captcha + SMS 認証で専用番号を登録します。
4. OpenClaw を設定し、Gateway を再起動します。
5. 最初のDMを送信し、ペアリングを承認します（`openclaw pairing approve signal <CODE>`）。

最小構成:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

フィールドリファレンス:

| Field       | Description                                       |
| ----------- | ------------------------------------------------- |
| `account`   | E.164 形式のボット電話番号（`+15551234567`） |
| `cliPath`   | `signal-cli` へのパス（`PATH` 上にある場合は `signal-cli`） |
| `dmPolicy`  | DM アクセスポリシー（`pairing` を推奨） |
| `allowFrom` | DM を許可する電話番号または `uuid:<id>` 値 |

## これは何か

- `signal-cli` 経由の Signal チャネル（埋め込み libsignal ではありません）。
- 決定的ルーティング: 返信は常に Signal に戻ります。
- DM はエージェントのメインセッションを共有し、グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。

## 設定書き込み

デフォルトでは、Signal は `/config set|unset` によってトリガーされる設定更新の書き込みを許可します（`commands.config: true` が必要）。

無効にするには:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 番号モデル（重要）

- Gateway は**Signal デバイス**（`signal-cli` アカウント）に接続します。
- ボットを**個人の Signal アカウント**で動かしている場合、そのアカウント自身のメッセージは無視されます（ループ保護）。
- 「自分がボットにテキストを送り、ボットが返信する」運用にしたい場合は、**別のボット番号**を使用してください。

## セットアップパス A: 既存の Signal アカウントをリンクする（QR）

1. `signal-cli` をインストールします（JVM またはネイティブビルド）。
2. ボットアカウントをリンクします:
   - `signal-cli link -n "OpenClaw"` を実行し、Signal で QR をスキャンします。
3. Signal を設定して Gateway を起動します。

例:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

マルチアカウント対応: アカウントごとの設定と任意の `name` を持つ `channels.signal.accounts` を使用します。共有パターンについては [`gateway/configuration`](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## セットアップパス B: 専用ボット番号を登録する（SMS、Linux）

既存の Signal アプリのアカウントをリンクするのではなく、専用のボット番号を使いたい場合はこちらを使用します。

1. SMS を受信できる番号を用意します（固定電話の場合は音声認証も可）。
   - アカウント/セッションの競合を避けるため、専用のボット番号を使用してください。
2. Gateway ホストに `signal-cli` をインストールします:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド（`signal-cli-${VERSION}.tar.gz`）を使う場合は、先に JRE 25+ をインストールしてください。
`signal-cli` は常に最新に保ってください。Signal サーバー API の変更により、古いリリースは動作しなくなる可能性があると upstream は述べています。

3. 番号を登録して認証します:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha が必要な場合:

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. captcha を完了し、「Open Signal」から `signalcaptcha://...` のリンク先をコピーします。
3. 可能であれば、ブラウザセッションと同じ外部 IP から実行します。
4. すぐに再度登録を実行します（captcha トークンはすぐ失効します）:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、Gateway を再起動し、チャネルを確認します:

```bash
# Gateway を user systemd service として実行している場合:
systemctl --user restart openclaw-gateway.service

# 次に確認:
openclaw doctor
openclaw channels status --probe
```

5. DM 送信者をペアリングします:
   - ボット番号に任意のメッセージを送信します。
   - サーバー上でコードを承認します: `openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」を避けるため、ボット番号をスマートフォンの連絡先に保存します。

重要: `signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションが認証解除されることがあります。専用のボット番号を使うか、既存のスマートフォンアプリ構成を維持する必要がある場合は QR リンクモードを使用してください。

upstream リファレンス:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- captcha フロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli` を自分で管理したい場合（JVM のコールドスタートが遅い、コンテナ初期化、または CPU 共有など）、デーモンを別途実行し、OpenClaw をそれに向けます:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

これにより、OpenClaw 内部での自動起動と起動待機がスキップされます。自動起動時に起動が遅い場合は、`channels.signal.startupTimeoutMs` を設定してください。

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが送られ、承認されるまでメッセージは無視されます（コードの有効期限は 1 時間）。
- 承認方法:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- ペアリングは Signal DM のデフォルトのトークン交換です。詳細: [Pairing](/ja-JP/channels/pairing)
- UUID のみの送信者（`sourceUuid` 由来）は `channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ:

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `allowlist` が設定されている場合、`channels.signal.groupAllowFrom` がグループ内で誰がトリガーできるかを制御します。
- `channels.signal.groups["<group-id>" | "*"]` で、`requireMention`、`tools`、`toolsBySender` を使ってグループ動作を上書きできます。
- マルチアカウント構成では、アカウントごとの上書きに `channels.signal.accounts.<id>.groups` を使用します。
- ランタイム注記: `channels.signal` が完全に欠けている場合、ランタイムはグループチェックに対して `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されていても同様です）。

## 仕組み（動作）

- `signal-cli` はデーモンとして実行され、Gateway は SSE 経由でイベントを読み取ります。
- 受信メッセージは共有チャネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループへルーティングされます。

## メディア + 制限

- 送信テキストは `channels.signal.textChunkLimit`（デフォルト 4000）で分割されます。
- 任意の改行チャンク分割: `channels.signal.chunkMode="newline"` を設定すると、長さで分割する前に空行（段落境界）で分割します。
- 添付ファイルをサポートします（`signal-cli` から取得される base64）。
- 音声メモ添付では、`contentType` が欠けている場合に MIME のフォールバックとして `signal-cli` のファイル名を使用するため、音声文字起こしで AAC 音声メモを引き続き分類できます。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb`（デフォルト 8）。
- メディアのダウンロードをスキップするには `channels.signal.ignoreAttachments` を使用します。
- グループ履歴コンテキストは `channels.signal.historyLimit`（または `channels.signal.accounts.*.historyLimit`）を使用し、`messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します（デフォルト 50）。

## 入力中表示 + 開封確認

- **入力中インジケーター**: OpenClaw は `signal-cli sendTyping` 経由で入力中シグナルを送り、返信の実行中はそれを更新します。
- **開封確認**: `channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の開封確認を転送します。
- `signal-cli` はグループの開封確認を公開していません。

## リアクション（message tool）

- `channel=signal` を指定して `message action=react` を使用します。
- 対象: 送信者の E.164 または UUID（ペアリング出力の `uuid:<id>` を使用。素の UUID でも可）。
- `messageId` はリアクション対象メッセージの Signal タイムスタンプです。
- グループのリアクションには `targetAuthor` または `targetAuthorUuid` が必要です。

例:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定:

- `channels.signal.actions.reactions`: リアクション操作を有効/無効にします（デフォルト true）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`。
  - `off`/`ack` はエージェントのリアクションを無効にします（message tool の `react` はエラーになります）。
  - `minimal`/`extensive` はエージェントのリアクションを有効にし、ガイダンスレベルを設定します。
- アカウントごとの上書き: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 配信先（CLI/cron）

- DM: `signal:+15551234567`（またはプレーンな E.164）。
- UUID DM: `uuid:<id>`（または素の UUID）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（Signal アカウントが対応している場合）。

## トラブルシューティング

まず次の手順を実行してください:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要に応じて、その後で DM のペアリング状態を確認します:

```bash
openclaw pairing list signal
```

よくある障害:

- デーモンには接続できるが返信がない: アカウント/デーモン設定（`httpUrl`、`account`）と受信モードを確認してください。
- DM が無視される: 送信者はペアリング承認待ちです。
- グループメッセージが無視される: グループ送信者/メンションのゲーティングにより配信がブロックされています。
- 編集後に設定検証エラーが出る: `openclaw doctor --fix` を実行してください。
- 診断に Signal が表示されない: `channels.signal.enabled: true` を確認してください。

追加チェック:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージフローについては、[/channels/troubleshooting](/ja-JP/channels/troubleshooting) を参照してください。

## セキュリティ上の注意

- `signal-cli` はアカウントキーをローカルに保存します（通常は `~/.local/share/signal-cli/data/`）。
- サーバー移行や再構築の前に Signal アカウント状態をバックアップしてください。
- より広い DM アクセスを明示的に望まない限り、`channels.signal.dmPolicy: "pairing"` を維持してください。
- SMS 認証が必要なのは登録または復旧フローのみですが、番号/アカウントの制御を失うと再登録が複雑になることがあります。

## 設定リファレンス（Signal）

完全な設定: [Configuration](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャネル起動の有効/無効。
- `channels.signal.account`: ボットアカウントの E.164。
- `channels.signal.cliPath`: `signal-cli` へのパス。
- `channels.signal.httpUrl`: 完全なデーモン URL（host/port より優先）。
- `channels.signal.httpHost`、`channels.signal.httpPort`: デーモンのバインド先（デフォルトは 127.0.0.1:8080）。
- `channels.signal.autoStart`: デーモンの自動起動（`httpUrl` 未設定時のデフォルトは true）。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト（ミリ秒、上限 120000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップ。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視。
- `channels.signal.sendReadReceipts`: 開封確認を転送。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM 許可リスト（E.164 または `uuid:<id>`）。`open` では `"*"` が必要です。Signal にはユーザー名がないため、電話番号/UUID の ID を使用します。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループ送信者の許可リスト。
- `channels.signal.groups`: Signal グループ ID（または `"*"`）をキーとしたグループごとの上書き設定。対応フィールド: `requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`: マルチアカウント構成向けの、`channels.signal.groups` のアカウントごとバージョン。
- `channels.signal.historyLimit`: コンテキストとして含めるグループメッセージの最大数（`0` で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位の DM 履歴上限。ユーザーごとの上書き: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.signal.chunkMode`: `length`（デフォルト）または `newline`。長さで分割する前に空行（段落境界）で分割します。
- `channels.signal.mediaMaxMb`: 受信/送信メディア上限（MB）。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signal はネイティブメンションをサポートしません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連

- [Channels Overview](/ja-JP/channels) — 対応チャネル全体
- [Pairing](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャット動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
