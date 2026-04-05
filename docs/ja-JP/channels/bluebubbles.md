---
read_when:
    - BlueBubbles チャネルをセットアップするとき
    - Webhook ペアリングのトラブルシューティング
    - macOS で iMessage を設定するとき
summary: BlueBubbles macOS サーバー経由の iMessage（REST 送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-05T12:35:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed8e59a165bdfb8fd794ee2ad6e4dacd44aa02d512312c5f2fd7d15f863380bb
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

ステータス: HTTP 経由で BlueBubbles macOS サーバーと通信するバンドル済みプラグインです。従来の imsg チャネルと比べて API がより豊富でセットアップが簡単なため、**iMessage 連携にはこちらを推奨**します。

## バンドル済みプラグイン

現在の OpenClaw リリースには BlueBubbles が同梱されているため、通常のパッケージ済みビルドでは
別途 `openclaw plugins install` を実行する必要はありません。

## 概要

- BlueBubbles ヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を介して macOS 上で動作します。
- 推奨 / 検証済み: macOS Sequoia (15)。macOS Tahoe (26) でも動作しますが、現在 Tahoe では編集が壊れており、グループアイコンの更新は成功と表示されても同期されないことがあります。
- OpenClaw は REST API（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）を通じて通信します。
- 受信メッセージは Webhook 経由で到着し、送信返信、入力中インジケーター、開封通知、Tapback は REST 呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれ、可能な場合はエージェントにも渡されます。
- ペアリング / allowlist は、`channels.bluebubbles.allowFrom` + ペアリングコードを使い、他のチャネル（`/channels/pairing` など）と同じように動作します。
- リアクションは、Slack や Telegram と同様にシステムイベントとして渡されるため、エージェントは返信前にそれらに「言及」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージエフェクト、グループ管理。

## クイックスタート

1. Mac に BlueBubbles サーバーをインストールします（[bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください）。
2. BlueBubbles の設定で Web API を有効にし、パスワードを設定します。
3. `openclaw onboard` を実行して BlueBubbles を選択するか、手動で設定します。

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. BlueBubbles の Webhook を Gateway に向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. Gateway を起動します。Webhook ハンドラーが登録され、ペアリングが開始されます。

セキュリティに関する注意:

- 必ず Webhook パスワードを設定してください。
- Webhook 認証は常に必須です。OpenClaw は、BlueBubbles の Webhook リクエストに `channels.bluebubbles.password` と一致する password/guid が含まれていない限り（たとえば `?password=<password>` や `x-password`）、loopback/proxy の構成に関係なく拒否します。
- パスワード認証は、Webhook ボディ全体を読み取り / 解析する前に確認されます。

## Messages.app を生かしておく（VM / ヘッドレス環境）

一部の macOS VM / 常時稼働環境では、Messages.app が「アイドル」状態になり（アプリを開く / フォアグラウンドにするまで受信イベントが止まる）、問題になることがあります。簡単な回避策として、AppleScript + LaunchAgent を使って **5 分ごとに Messages をつつく** 方法があります。

### 1) AppleScript を保存する

以下の場所に保存します。

- `~/Scripts/poke-messages.scpt`

スクリプト例（非対話型、フォーカスを奪わない）:

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) LaunchAgent をインストールする

以下の場所に保存します。

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

注意:

- これは **300 秒ごと** と **ログイン時** に実行されます。
- 初回実行時に macOS の **Automation** プロンプト（`osascript` → Messages）が表示される場合があります。LaunchAgent を実行する同じユーザーセッションで承認してください。

読み込むには:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## オンボーディング

BlueBubbles は対話型オンボーディングで利用できます。

```
openclaw onboard
```

ウィザードが尋ねる内容:

- **Server URL**（必須）: BlueBubbles サーバーのアドレス（例: `http://192.168.1.100:1234`）
- **Password**（必須）: BlueBubbles Server 設定内の API パスワード
- **Webhook path**（任意）: デフォルトは `/bluebubbles-webhook`
- **DM policy**: pairing、allowlist、open、または disabled
- **Allow list**: 電話番号、メールアドレス、またはチャットターゲット

CLI から BlueBubbles を追加することもできます。

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが送られ、承認されるまでメッセージは無視されます（コードの有効期限は 1 時間です）。
- 承認方法:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- ペアリングはデフォルトのトークン交換です。詳細: [Pairing](/channels/pairing)

グループ:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom` は、`allowlist` 設定時にグループ内で誰がトリガーできるかを制御します。

### 連絡先名の補完（macOS、任意）

BlueBubbles のグループ Webhook には、生の参加者アドレスしか含まれないことがよくあります。`GroupMembers` コンテキストにローカルの連絡先名を表示したい場合は、macOS 上でローカル Contacts による補完を有効にできます。

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で参照を有効にします。デフォルト: `false`。
- 参照は、グループアクセス、コマンド認可、メンションゲートによってメッセージが通過可能と判断された後にのみ実行されます。
- 補完対象は、名前のない電話番号参加者のみです。
- ローカル一致が見つからない場合は、生の電話番号がフォールバックとして残ります。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### メンションゲート（グループ）

BlueBubbles はグループチャットでのメンションゲートに対応しており、iMessage / WhatsApp の動作に一致します。

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使ってメンションを検出します。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ応答します。
- 認可された送信者からの制御コマンドは、メンションゲートをバイパスします。

グループごとの設定:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // すべてのグループのデフォルト
        "iMessage;-;chat123": { requireMention: false }, // 特定グループ向けの上書き
      },
    },
  },
}
```

### コマンドゲート

- 制御コマンド（例: `/config`, `/model`）には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` が使われます。
- 認可された送信者は、グループ内でメンションしなくても制御コマンドを実行できます。

## ACP 会話バインディング

BlueBubbles のチャットは、トランスポート層を変えずに永続的な ACP ワークスペースへ変換できます。

すばやいオペレーターフロー:

- DM または許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、その同じ BlueBubbles 会話内のメッセージは、起動された ACP セッションへルーティングされます。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

設定済みの永続バインディングは、`type: "acp"` と `match.channel: "bluebubbles"` を持つトップレベルの `bindings[]` エントリーでもサポートされます。

`match.peer.id` には、サポートされている任意の BlueBubbles ターゲット形式を使えます。

- `+15555550123` や `user@example.com` のような正規化された DM ハンドル
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

安定したグループバインディングには、`chat_id:*` または `chat_identifier:*` を推奨します。

例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

共有の ACP バインディング動作については [ACP Agents](/tools/acp-agents) を参照してください。

## 入力中表示 + 開封通知

- **入力中インジケーター**: 応答生成の前および生成中に自動送信されます。
- **開封通知**: `channels.bluebubbles.sendReadReceipts` で制御されます（デフォルト: `true`）。
- **入力中インジケーター**: OpenClaw は入力開始イベントを送信します。BlueBubbles は送信時またはタイムアウト時に自動で入力中状態を解除します（DELETE による手動停止は不安定です）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 開封通知を無効化
    },
  },
}
```

## 高度なアクション

BlueBubbles は、設定で有効化されている場合に高度なメッセージアクションをサポートします。

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback（デフォルト: true）
        edit: true, // 送信済みメッセージを編集（macOS 13+、macOS 26 Tahoe では壊れている）
        unsend: true, // メッセージ送信取り消し（macOS 13+）
        reply: true, // メッセージ GUID による返信スレッド
        sendWithEffect: true, // メッセージエフェクト（slam、loud など）
        renameGroup: true, // グループチャット名を変更
        setGroupIcon: true, // グループチャットのアイコン / 写真を設定（macOS 26 Tahoe では不安定）
        addParticipant: true, // グループに参加者を追加
        removeParticipant: true, // グループから参加者を削除
        leaveGroup: true, // グループチャットから退出
        sendAttachment: true, // 添付ファイル / メディアを送信
      },
    },
  },
}
```

利用可能なアクション:

- **react**: Tapback リアクションを追加 / 削除（`messageId`, `emoji`, `remove`）
- **edit**: 送信済みメッセージを編集（`messageId`, `text`）
- **unsend**: メッセージを送信取り消し（`messageId`）
- **reply**: 特定メッセージに返信（`messageId`, `text`, `to`）
- **sendWithEffect**: iMessage エフェクト付きで送信（`text`, `to`, `effectId`）
- **renameGroup**: グループチャット名を変更（`chatGuid`, `displayName`）
- **setGroupIcon**: グループチャットのアイコン / 写真を設定（`chatGuid`, `media`）— macOS 26 Tahoe では不安定です（API は成功を返してもアイコンが同期されない場合があります）。
- **addParticipant**: グループに誰かを追加（`chatGuid`, `address`）
- **removeParticipant**: グループから誰かを削除（`chatGuid`, `address`）
- **leaveGroup**: グループチャットから退出（`chatGuid`）
- **upload-file**: メディア / ファイルを送信（`to`, `buffer`, `filename`, `asVoice`）
  - ボイスメモ: **MP3** または **CAF** 音声に `asVoice: true` を設定すると、iMessage のボイスメッセージとして送信できます。BlueBubbles はボイスメモ送信時に MP3 → CAF へ変換します。
- 旧エイリアス: `sendAttachment` も引き続き動作しますが、正式なアクション名は `upload-file` です。

### メッセージ ID（短縮版と完全版）

OpenClaw はトークン節約のために、_短縮_ メッセージ ID（例: `1`, `2`）を表示する場合があります。

- `MessageSid` / `ReplyToId` には短縮 ID が入ることがあります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全 ID が入ります。
- 短縮 ID はメモリ内だけです。再起動やキャッシュ削除で失効することがあります。
- アクションは短縮 / 完全のどちらの `messageId` も受け付けますが、短縮 ID は利用できなくなっているとエラーになります。

永続的な自動化や保存には完全 ID を使ってください。

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [Configuration](/gateway/configuration) を参照してください。

## ブロックストリーミング

応答を単一メッセージとして送るか、ブロック単位でストリーミングするかを制御します。

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // ブロックストリーミングを有効化（デフォルトではオフ）
    },
  },
}
```

## メディア + 制限

- 受信添付ファイルはダウンロードされ、メディアキャッシュに保存されます。
- 受信 / 送信メディアの上限は `channels.bluebubbles.mediaMaxMb` で制御します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit`（デフォルト: 4000 文字）で分割されます。

## 設定リファレンス

完全な設定: [Configuration](/gateway/configuration)

プロバイダーオプション:

- `channels.bluebubbles.enabled`: チャネルの有効 / 無効。
- `channels.bluebubbles.serverUrl`: BlueBubbles REST API ベース URL。
- `channels.bluebubbles.password`: API パスワード。
- `channels.bluebubbles.webhookPath`: Webhook エンドポイントパス（デフォルト: `/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
- `channels.bluebubbles.allowFrom`: DM allowlist（ハンドル、メール、E.164 番号、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom`: グループ送信者 allowlist。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS 上で、ゲート通過後に名前のないグループ参加者をローカル Contacts から任意で補完します。デフォルト: `false`。
- `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。
- `channels.bluebubbles.sendReadReceipts`: 開封通知を送信します（デフォルト: `true`）。
- `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効化します（デフォルト: `false`。ストリーミング返信に必要）。
- `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズ（文字数、デフォルト: 4000）。
- `channels.bluebubbles.chunkMode`: `length`（デフォルト）は `textChunkLimit` 超過時のみ分割します。`newline` は長さベースの分割前に空行（段落境界）で分割します。
- `channels.bluebubbles.mediaMaxMb`: 受信 / 送信メディア上限（MB、デフォルト: 8）。
- `channels.bluebubbles.mediaLocalRoots`: 送信ローカルメディアパスとして許可される絶対ローカルディレクトリの明示的 allowlist。これが設定されていない場合、ローカルパス送信はデフォルトで拒否されます。アカウント単位の上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.historyLimit`: コンテキスト用のグループメッセージ最大数（0 で無効）。
- `channels.bluebubbles.dmHistoryLimit`: DM 履歴上限。
- `channels.bluebubbles.actions`: 個別アクションの有効 / 無効。
- `channels.bluebubbles.accounts`: マルチアカウント設定。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`.

## アドレッシング / 配信ターゲット

安定したルーティングには `chat_guid` を推奨します。

- `chat_guid:iMessage;-;+15555550123`（グループに推奨）
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`, `user@example.com`
  - 直接ハンドルに既存の DM チャットがない場合、OpenClaw は `POST /api/v1/chat/new` で新規作成します。これには BlueBubbles Private API を有効にしておく必要があります。

## セキュリティ

- Webhook リクエストは、`guid` / `password` のクエリパラメータまたはヘッダーを `channels.bluebubbles.password` と比較して認証されます。
- API パスワードと Webhook エンドポイントは秘密にしてください（認証情報として扱ってください）。
- BlueBubbles の Webhook 認証には localhost バイパスはありません。Webhook トラフィックをプロキシする場合も、リクエストのエンドツーエンドで BlueBubbles パスワードを保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりになりません。[Gateway security](/gateway/security#reverse-proxy-configuration) を参照してください。
- LAN の外に公開する場合は、BlueBubbles サーバーで HTTPS + ファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中 / 開封イベントが動かなくなった場合は、BlueBubbles の Webhook ログを確認し、Gateway パスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードの有効期限は 1 時間です。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使ってください。
- リアクションには BlueBubbles private API（`POST /api/v1/message/react`）が必要です。サーバーバージョンがこれを提供していることを確認してください。
- 編集 / 送信取り消しには macOS 13+ と互換性のある BlueBubbles サーバーバージョンが必要です。macOS 26 (Tahoe) では、private API の変更により現在編集は壊れています。
- グループアイコンの更新は macOS 26 (Tahoe) で不安定な場合があります。API は成功を返しても、新しいアイコンが同期されないことがあります。
- OpenClaw は BlueBubbles サーバーの macOS バージョンに基づいて、既知の不具合があるアクションを自動的に非表示にします。macOS 26 (Tahoe) で edit がまだ表示される場合は、`channels.bluebubbles.actions.edit=false` で手動無効化してください。
- ステータス / ヘルス情報: `openclaw status --all` または `openclaw status --deep`。

一般的なチャネルワークフローの参考として、[Channels](/channels) と [Plugins](/tools/plugin) ガイドを参照してください。

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャネル
- [Pairing](/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/channels/groups) — グループチャットの動作とメンションゲート
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
