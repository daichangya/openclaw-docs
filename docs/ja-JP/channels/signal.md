---
read_when:
    - Signalサポートをセットアップするとき
    - Signalの送受信をデバッグするとき
summary: signal-cli（JSON-RPC + SSE）経由のSignalサポート、セットアップ経路、番号モデル
title: Signal
x-i18n:
    generated_at: "2026-04-05T12:36:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal（signal-cli）

ステータス: 外部CLI統合。GatewayはHTTP JSON-RPC + SSE経由で`signal-cli`と通信します。

## 前提条件

- サーバーにOpenClawがインストールされていること（以下のLinuxフローはUbuntu 24でテスト済み）。
- Gatewayを実行するホストで`signal-cli`が利用可能であること。
- 1回の認証SMSを受信できる電話番号（SMS登録経路の場合）。
- 登録時にSignal captcha（`signalcaptchas.org`）へアクセスするためのブラウザー。

## クイックセットアップ（初級者向け）

1. botには**別のSignal番号**を使用します（推奨）。
2. `signal-cli`をインストールします（JVMビルドを使う場合はJavaが必要です）。
3. セットアップ経路を1つ選びます。
   - **経路A（QRリンク）:** `signal-cli link -n "OpenClaw"`を実行し、Signalでスキャンします。
   - **経路B（SMS登録）:** captcha + SMS認証で専用番号を登録します。
4. OpenClawを設定してGatewayを再起動します。
5. 最初のDMを送信し、pairingを承認します（`openclaw pairing approve signal <CODE>`）。

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

| フィールド  | 説明                                                   |
| ----------- | ------------------------------------------------------ |
| `account`   | E.164形式のbot電話番号（`+15551234567`）               |
| `cliPath`   | `signal-cli`へのパス（`PATH`上にあるなら`signal-cli`） |
| `dmPolicy`  | DMアクセス方針（`pairing`推奨）                        |
| `allowFrom` | DMを許可する電話番号または`uuid:<id>`値                |

## これは何か

- `signal-cli`経由のSignalチャンネルです（埋め込みlibsignalではありません）。
- 決定的なルーティング: 返信は常にSignalへ戻ります。
- DMはagentのメインセッションを共有し、グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。

## config書き込み

デフォルトでは、Signalは`/config set|unset`によってトリガーされたconfig更新の書き込みを許可されています（`commands.config: true`が必要）。

無効化するには次を使用します。

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 番号モデル（重要）

- Gatewayは**Signalデバイス**（`signal-cli`アカウント）に接続します。
- botを**個人のSignalアカウント**で実行すると、自分自身のメッセージは無視されます（ループ保護）。
- 「自分がbotにテキストを送り、botが返信する」動作にするには、**別のbot番号**を使用してください。

## セットアップ経路A: 既存のSignalアカウントをリンクする（QR）

1. `signal-cli`をインストールします（JVMまたはネイティブビルド）。
2. botアカウントをリンクします。
   - `signal-cli link -n "OpenClaw"`を実行し、SignalでQRをスキャンします。
3. Signalを設定してGatewayを起動します。

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

マルチアカウント対応: `channels.signal.accounts`を使用すると、アカウントごとのconfigと任意の`name`を設定できます。共有パターンについては[`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels)を参照してください。

## セットアップ経路B: 専用のbot番号を登録する（SMS、Linux）

既存のSignalアプリのアカウントをリンクする代わりに、専用のbot番号を使いたい場合はこちらを使用します。

1. SMSを受信できる番号を用意します（固定電話の場合は音声認証でも可）。
   - アカウントやセッションの競合を避けるため、専用のbot番号を使用してください。
2. Gatewayホストに`signal-cli`をインストールします。

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVMビルド（`signal-cli-${VERSION}.tar.gz`）を使用する場合は、最初にJRE 25+をインストールしてください。
`signal-cli`は最新の状態に保ってください。上流では、SignalサーバーAPIの変更により古いリリースが動作しなくなる可能性があると案内しています。

3. 番号を登録して認証します。

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captchaが必要な場合:

1. `https://signalcaptchas.org/registration/generate.html`を開きます。
2. captchaを完了し、「Open Signal」から`signalcaptcha://...`リンク先をコピーします。
3. 可能であれば、ブラウザーセッションと同じ外部IPから実行してください。
4. すぐに再度登録を実行します（captchaトークンはすぐに期限切れになります）。

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClawを設定し、Gatewayを再起動して、チャンネルを確認します。

```bash
# Gatewayをuser systemdサービスとして実行している場合:
systemctl --user restart openclaw-gateway.service

# その後、確認:
openclaw doctor
openclaw channels status --probe
```

5. DM送信者をpairingします。
   - bot番号に何らかのメッセージを送信します。
   - サーバー上でコードを承認します: `openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」を避けるため、bot番号を電話の連絡先に保存します。

重要: `signal-cli`で電話番号アカウントを登録すると、その番号のメインSignalアプリセッションが認証解除される場合があります。専用のbot番号を推奨します。既存の電話アプリ構成を維持する必要がある場合は、QRリンクモードを使用してください。

上流リファレンス:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captchaフロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli`を自分で管理したい場合（JVMのコールドスタートが遅い、コンテナー初期化、共有CPUなど）、デーモンを別に実行してOpenClawからそこを参照します。

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

これにより、OpenClaw内での自動起動と起動待機がスキップされます。自動起動時に起動が遅い場合は、`channels.signal.startupTimeoutMs`を設定してください。

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 未知の送信者にはpairingコードが送られ、承認されるまでメッセージは無視されます（コードは1時間で期限切れ）。
- 承認方法:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- PairingはSignal DMのデフォルトのトークン交換です。詳細: [Pairing](/channels/pairing)
- UUIDのみの送信者（`sourceUuid`由来）は、`channels.signal.allowFrom`に`uuid:<id>`として保存されます。

グループ:

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `channels.signal.groupAllowFrom`は、`allowlist`設定時にグループ内で誰がトリガーできるかを制御します。
- `channels.signal.groups["<group-id>" | "*"]`では、`requireMention`、`tools`、`toolsBySender`を使ってグループ動作を上書きできます。
- マルチアカウント構成では、アカウントごとの上書きに`channels.signal.accounts.<id>.groups`を使用します。
- ランタイム注記: `channels.signal`が完全に欠けている場合、ランタイムはグループチェックで`groupPolicy="allowlist"`にフォールバックします（`channels.defaults.groupPolicy`が設定されていても同様です）。

## 仕組み（動作）

- `signal-cli`はデーモンとして動作し、GatewayはSSE経由でイベントを読み取ります。
- 受信メッセージは共有チャンネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループにルーティングされます。

## メディア + 制限

- 送信テキストは`channels.signal.textChunkLimit`（デフォルト4000）に分割されます。
- 任意の改行チャンク化: `channels.signal.chunkMode="newline"`を設定すると、長さで分割する前に空行（段落境界）で分割します。
- 添付ファイルをサポートします（`signal-cli`から取得したbase64）。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb`（デフォルト8）。
- メディアのダウンロードをスキップするには`channels.signal.ignoreAttachments`を使用します。
- グループ履歴コンテキストでは`channels.signal.historyLimit`（または`channels.signal.accounts.*.historyLimit`）を使用し、`messages.groupChat.historyLimit`にフォールバックします。無効にするには`0`を設定します（デフォルト50）。

## 入力中表示 + 既読通知

- **入力中インジケーター**: OpenClawは`signal-cli sendTyping`経由で入力中シグナルを送信し、返信処理中は更新を継続します。
- **既読通知**: `channels.signal.sendReadReceipts`がtrueの場合、OpenClawは許可されたDMの既読通知を転送します。
- Signal-cliはグループの既読通知を公開していません。

## リアクション（messageツール）

- `channel=signal`で`message action=react`を使用します。
- ターゲット: 送信者のE.164またはUUID（pairing出力の`uuid:<id>`を使用します。UUID単体でも動作します）。
- `messageId`は、リアクション対象メッセージのSignalタイムスタンプです。
- グループリアクションでは`targetAuthor`または`targetAuthorUuid`が必要です。

例:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

config:

- `channels.signal.actions.reactions`: リアクションアクションの有効化/無効化（デフォルトtrue）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`。
  - `off`/`ack`ではagentリアクションが無効になります（messageツールの`react`はエラーになります）。
  - `minimal`/`extensive`ではagentリアクションが有効になり、ガイダンスレベルが設定されます。
- アカウントごとの上書き: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 配信ターゲット（CLI/cron）

- DM: `signal:+15551234567`（またはプレーンなE.164）。
- UUID DM: `uuid:<id>`（またはUUID単体）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（Signalアカウントでサポートされている場合）。

## トラブルシューティング

まず次の手順を実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要に応じて、その後にDMのpairing状態を確認します。

```bash
openclaw pairing list signal
```

よくある障害:

- デーモンには到達できるが返信がない: アカウント/デーモン設定（`httpUrl`、`account`）と受信モードを確認してください。
- DMが無視される: 送信者のpairing承認待ちです。
- グループメッセージが無視される: グループ送信者/mentionゲーティングが配信をブロックしています。
- 編集後にconfig検証エラーが出る: `openclaw doctor --fix`を実行してください。
- 診断にSignalが表示されない: `channels.signal.enabled: true`を確認してください。

追加チェック:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージフロー: [/channels/troubleshooting](/channels/troubleshooting)。

## セキュリティに関する注意

- `signal-cli`はアカウントキーをローカルに保存します（通常は`~/.local/share/signal-cli/data/`）。
- サーバー移行や再構築の前にSignalアカウント状態をバックアップしてください。
- より広いDMアクセスを明示的に望まない限り、`channels.signal.dmPolicy: "pairing"`を維持してください。
- SMS認証は登録またはリカバリーフローでのみ必要ですが、番号/アカウントの制御を失うと再登録が複雑になる場合があります。

## 設定リファレンス（Signal）

完全な設定: [Configuration](/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャンネル起動の有効化/無効化。
- `channels.signal.account`: botアカウント用のE.164。
- `channels.signal.cliPath`: `signal-cli`へのパス。
- `channels.signal.httpUrl`: 完全なデーモンURL（host/portより優先）。
- `channels.signal.httpHost`, `channels.signal.httpPort`: デーモンのbind先（デフォルト127.0.0.1:8080）。
- `channels.signal.autoStart`: デーモンを自動起動（`httpUrl`未設定時のデフォルトはtrue）。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト（ms、上限120000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップ。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視。
- `channels.signal.sendReadReceipts`: 既読通知を転送。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM allowlist（E.164または`uuid:<id>`）。`open`には`"*"`が必要です。Signalにはユーザー名がないため、電話番号/UUID IDを使用してください。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループ送信者allowlist。
- `channels.signal.groups`: SignalグループID（または`"*"`）をキーにしたグループごとの上書き。サポートフィールド: `requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`: マルチアカウント構成向けの`channels.signal.groups`のアカウント別版。
- `channels.signal.historyLimit`: コンテキストに含めるグループメッセージの最大数（0で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位のDM履歴上限。ユーザー単位の上書き: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.signal.chunkMode`: `length`（デフォルト）または`newline`。長さで分割する前に空行（段落境界）で分割します。
- `channels.signal.mediaMaxMb`: 受信/送信メディア上限（MB）。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signalはネイティブmentionをサポートしません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャンネル
- [Pairing](/channels/pairing) — DM認証とpairingフロー
- [Groups](/channels/groups) — グループチャットの動作とmentionゲーティング
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
