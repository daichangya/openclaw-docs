---
read_when:
    - BlueBubblesチャンネルの設定
    - Webhookペアリングのトラブルシューティング
    - macOSでのiMessageの設定
summary: BlueBubbles macOSサーバー経由のiMessage（REST送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-25T13:41:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5185202d668f56e5f2e22c1858325595eea7cca754b9b3a809c886c53ae68770
    source_path: channels/bluebubbles.md
    workflow: 15
---

ステータス: HTTP経由でBlueBubbles macOSサーバーと通信するバンドル済みPlugin（REST送受信、入力中表示、リアクション、ペアリング、高度なアクション）。従来のimsgチャネルと比べてAPIがより豊富でセットアップも容易なため、**iMessage連携にはこちらを推奨**します。

## バンドル済みPlugin

現在のOpenClawリリースにはBlueBubblesが同梱されているため、通常のパッケージ済みビルドでは別途 `openclaw plugins install` を実行する必要はありません。

## 概要

- BlueBubblesヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を介してmacOS上で動作します。
- 推奨/テスト済み: macOS Sequoia (15)。macOS Tahoe (26) でも動作しますが、現時点ではTahoeで編集機能が壊れており、グループアイコンの更新は成功と表示されても同期されない場合があります。
- OpenClawはそのREST API（`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`）を通じて通信します。
- 受信メッセージはWebhook経由で届き、送信返信、入力中表示、既読通知、tapbackはREST呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれ、可能な場合はエージェントにも渡されます。
- ペアリング/許可リストは他のチャネルと同じ方法で動作します（`/channels/pairing` など）。`channels.bluebubbles.allowFrom` + ペアリングコードを使用します。
- リアクションはSlack/Telegramと同様にシステムイベントとして表面化されるため、エージェントは返信前にそれらへ「言及」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージエフェクト、グループ管理。

## クイックスタート

1. MacにBlueBubblesサーバーをインストールします（[bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください）。
2. BlueBubblesの設定でWeb APIを有効にし、パスワードを設定します。
3. `openclaw onboard` を実行してBlueBubblesを選ぶか、手動で設定します:

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

4. BlueBubblesのWebhookをGatewayへ向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. Gatewayを起動します。Webhookハンドラーが登録され、ペアリングが開始されます。

セキュリティに関する注意:

- 必ずWebhookパスワードを設定してください。
- Webhook認証は常に必須です。OpenClawは、BlueBubblesのWebhookリクエストに `channels.bluebubbles.password` と一致する password/guid が含まれていない限り拒否します（たとえば `?password=<password>` や `x-password`）。これはloopback/proxyのトポロジーに関係ありません。
- パスワード認証は、Webhook本文全体の読み取り/解析より前に確認されます。

## Messages.appを起動状態に保つ（VM / ヘッドレス構成）

一部のmacOS VM / 常時稼働構成では、Messages.appが「アイドル」状態になり（アプリを開く/前面化するまで受信イベントが止まる）、問題になることがあります。簡単な回避策は、AppleScript + LaunchAgentを使って**5分ごとにMessagesをつつく**ことです。

### 1) AppleScriptを保存する

これを次の場所に保存します:

- `~/Scripts/poke-messages.scpt`

スクリプト例（非対話型、フォーカスを奪いません）:

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

### 2) LaunchAgentをインストールする

これを次の場所に保存します:

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

- これは**300秒ごと**および**ログイン時**に実行されます。
- 初回実行時にmacOSの**Automation**プロンプト（`osascript` → Messages）が表示される場合があります。LaunchAgentを実行するのと同じユーザーセッションで許可してください。

読み込み:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## オンボーディング

BlueBubblesは対話型オンボーディングで利用できます:

```
openclaw onboard
```

ウィザードでは次を尋ねられます:

- **サーバーURL**（必須）: BlueBubblesサーバーのアドレス（例: `http://192.168.1.100:1234`）
- **パスワード**（必須）: BlueBubbles Server設定のAPIパスワード
- **Webhookパス**（任意）: デフォルトは `/bluebubbles-webhook`
- **DMポリシー**: pairing、allowlist、open、または disabled
- **許可リスト**: 電話番号、メールアドレス、またはチャットターゲット

CLI経由でBlueBubblesを追加することもできます:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが送られ、承認されるまでメッセージは無視されます（コードの有効期限は1時間です）。
- 承認方法:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- ペアリングがデフォルトのトークン交換です。詳細: [Pairing](/ja-JP/channels/pairing)

グループ:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されているときにグループ内で誰がトリガーできるかを制御します。

### 連絡先名の補完（macOS、任意）

BlueBubblesのグループWebhookには、参加者の生のアドレスしか含まれないことがよくあります。`GroupMembers` コンテキストに代わりにローカルの連絡先名を表示したい場合は、macOSでローカルContacts補完を有効にできます:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で検索を有効にします。デフォルト: `false`。
- 検索は、グループアクセス、コマンド認可、メンションゲーティングによってメッセージの通過が許可された後にのみ実行されます。
- 補完対象は、名前のない電話参加者のみです。
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

### メンションゲーティング（グループ）

BlueBubblesはグループチャット向けのメンションゲーティングをサポートしており、iMessage/WhatsAppの動作に一致します:

- メンションの検出には `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使用します。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ応答します。
- 認可された送信者からの制御コマンドはメンションゲーティングをバイパスします。

グループごとの設定:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // すべてのグループのデフォルト
        "iMessage;-;chat123": { requireMention: false }, // 特定のグループの上書き
      },
    },
  },
}
```

### コマンドゲーティング

- 制御コマンド（例: `/config`, `/model`）には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` を使用します。
- 認可された送信者は、グループ内でメンションなしでも制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` 配下の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループ内のメッセージを処理する各ターンでエージェントのシステムプロンプトに注入されるため、エージェントプロンプトを編集せずにグループごとの人格や振る舞いのルールを設定できます:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "応答は3文以内にしてください。グループのカジュアルな口調に合わせてください。",
        },
      },
    },
  },
}
```

キーは、BlueBubblesがそのグループについて報告する `chatGuid` / `chatIdentifier` / 数値の `chatId` のいずれかに一致し、 `"*"` ワイルドカードのエントリは、完全一致のないすべてのグループに対するデフォルトを提供します（`requireMention` やグループごとのツールポリシーで使われるのと同じパターンです）。完全一致は常にワイルドカードより優先されます。DMではこのフィールドは無視されます。代わりにエージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使用してください。

#### 実例: スレッド返信とtapbackリアクション（Private API）

BlueBubbles Private APIを有効にすると、受信メッセージには短いメッセージID（たとえば `[[reply_to:5]]`）が付いて届き、エージェントは `action=reply` を呼び出して特定のメッセージへのスレッド返信を行ったり、`action=react` でtapbackを付けたりできます。グループごとの `systemPrompt` は、エージェントに正しいツールを選ばせ続ける信頼できる方法です:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "このグループで返信するときは、必ずコンテキスト内の",
            "[[reply_to:N]] messageId を使って action=reply を呼び出し、応答を",
            "トリガー元メッセージの下にスレッド表示してください。新しい未リンクの",
            "メッセージは絶対に送信しないでください。",
            "",
            "短い確認応答（「了解」、「確認しました」、「対応します」）には、",
            "テキスト返信を送る代わりに、適切なtapback絵文字（❤️, 👍, 😂, ‼️, ❓）で",
            "action=react を使ってください。",
          ].join(" "),
        },
      },
    },
  },
}
```

tapbackリアクションとスレッド返信はどちらもBlueBubbles Private APIが必要です。基盤となる仕組みについては、[Advanced actions](#advanced-actions) と [Message IDs](#message-ids-short-vs-full) を参照してください。

## ACP会話バインディング

BlueBubblesチャットは、トランスポートレイヤーを変更せずに永続的なACPワークスペースにできます。

高速なオペレーターフロー:

- そのDMまたは許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 以後、その同じBlueBubbles会話内のメッセージは生成されたACPセッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close` はACPセッションを閉じ、バインディングを削除します。

設定済みの永続バインディングも、トップレベルの `bindings[]` エントリで `type: "acp"` と `match.channel: "bluebubbles"` を指定することでサポートされます。

`match.peer.id` には、サポートされている任意のBlueBubblesターゲット形式を使用できます:

- `+15555550123` や `user@example.com` のような正規化済みDMハンドル
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

共有のACPバインディング動作については [ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## 入力中表示 + 既読通知

- **入力中表示**: 応答生成の前および生成中に自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts` で制御されます（デフォルト: `true`）。
- **入力中表示**: OpenClawは入力開始イベントを送信します。BlueBubblesは送信時またはタイムアウト時に自動で入力中表示を解除します（`DELETE` による手動停止は信頼できません）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 既読通知を無効化
    },
  },
}
```

## 高度なアクション

BlueBubblesは、設定で有効にすると高度なメッセージアクションをサポートします:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback（デフォルト: true）
        edit: true, // 送信済みメッセージを編集（macOS 13+、macOS 26 Tahoeでは壊れています）
        unsend: true, // メッセージの送信取り消し（macOS 13+）
        reply: true, // メッセージGUIDによる返信スレッド
        sendWithEffect: true, // メッセージエフェクト（slam、loud など）
        renameGroup: true, // グループチャット名を変更
        setGroupIcon: true, // グループチャットのアイコン/写真を設定（macOS 26 Tahoeでは不安定）
        addParticipant: true, // グループに参加者を追加
        removeParticipant: true, // グループから参加者を削除
        leaveGroup: true, // グループチャットから退出
        sendAttachment: true, // 添付ファイル/メディアを送信
      },
    },
  },
}
```

利用可能なアクション:

- **react**: tapbackリアクションを追加/削除します（`messageId`, `emoji`, `remove`）。iMessageネイティブのtapbackセットは `love`, `like`, `dislike`, `laugh`, `emphasize`, `question` です。エージェントがそのセット外の絵文字（たとえば `👀`）を選んだ場合、リアクションツールは `love` にフォールバックするため、リクエスト全体が失敗する代わりにtapbackは表示されます。設定済みのackリアクションは引き続き厳密に検証され、不明な値ではエラーになります。
- **edit**: 送信済みメッセージを編集します（`messageId`, `text`）
- **unsend**: メッセージを送信取り消しします（`messageId`）
- **reply**: 特定のメッセージに返信します（`messageId`, `text`, `to`）
- **sendWithEffect**: iMessageエフェクト付きで送信します（`text`, `to`, `effectId`）
- **renameGroup**: グループチャット名を変更します（`chatGuid`, `displayName`）
- **setGroupIcon**: グループチャットのアイコン/写真を設定します（`chatGuid`, `media`）— macOS 26 Tahoeでは不安定です（APIは成功を返してもアイコンが同期されないことがあります）。
- **addParticipant**: グループに誰かを追加します（`chatGuid`, `address`）
- **removeParticipant**: グループから誰かを削除します（`chatGuid`, `address`）
- **leaveGroup**: グループチャットから退出します（`chatGuid`）
- **upload-file**: メディア/ファイルを送信します（`to`, `buffer`, `filename`, `asVoice`）
  - ボイスメモ: **MP3** または **CAF** 音声で `asVoice: true` を設定すると、iMessageの音声メッセージとして送信できます。BlueBubblesはボイスメモ送信時にMP3 → CAFへ変換します。
- 旧エイリアス: `sendAttachment` も引き続き動作しますが、正式なアクション名は `upload-file` です。

### Message IDs（短縮版と完全版）

OpenClawはトークン節約のため、_短縮_ メッセージID（例: `1`, `2`）を表面化することがあります。

- `MessageSid` / `ReplyToId` は短縮IDの場合があります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全IDが入ります。
- 短縮IDはインメモリです。再起動またはキャッシュ削除で失効することがあります。
- アクションは短縮または完全な `messageId` を受け付けますが、短縮IDがすでに利用できない場合はエラーになります。

永続的な自動化と保存には完全IDを使用してください:

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [Configuration](/ja-JP/gateway/configuration) を参照してください。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 分割送信されるDMの結合（1つの入力でコマンド + URL）

ユーザーがiMessageでコマンドとURLを一緒に入力した場合 — たとえば `Dump https://example.com/article` — Appleは送信を**2つの別々のWebhook配信**に分割します:

1. テキストメッセージ（`"Dump"`）。
2. URLプレビューバルーン（`"https://..."`）。OGプレビュー画像が添付されます。

多くの構成では、この2つのWebhookは約0.8〜2.0秒の間隔でOpenClawに到着します。結合しない場合、エージェントはターン1でコマンドだけを受け取り、返信し（多くの場合「URLを送ってください」）、URLを確認するのはターン2になってからです — その時点ではコマンドのコンテキストはすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` は、同じ送信者から連続して届くWebhookを1つのエージェントターンにまとめるようDMをオプトインさせます。グループチャットは引き続きメッセージ単位でキー付けされるため、複数ユーザーのターン構造は維持されます。

### 有効にするべき場合

次の場合に有効にしてください:

- `command + payload` を1つのメッセージとして前提にするSkills（dump、paste、save、queue など）を提供している。
- ユーザーがコマンドと一緒にURL、画像、長いコンテンツを貼り付ける。
- DMターンの追加レイテンシーを許容できる（後述）。

次の場合は無効のままにしてください:

- 単語1つのDMトリガーで最小レイテンシーが必要。
- すべてのフローがペイロード後続なしのワンショットコマンドである。

### 有効化

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // オプトイン（デフォルト: false）
    },
  },
}
```

このフラグがオンで、かつ明示的な `messages.inbound.byChannel.bluebubbles` がない場合、デバウンスウィンドウは **2500 ms** に広がります（非結合時のデフォルトは500 ms）。この広いウィンドウが必要です — Appleの分割送信の周期である0.8〜2.0秒は、より短いデフォルトには収まりません。

ウィンドウを自分で調整するには:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 msでほとんどの構成に対応します。Macが低速な場合
        // またはメモリ圧迫下にある場合は4000 msまで上げてください
        // （その場合、観測される間隔が2秒を超えて伸びることがあります）。
        bluebubbles: 2500,
      },
    },
  },
}
```

### トレードオフ

- **DM制御コマンドのレイテンシーが増えます。** このフラグを有効にすると、DMの制御コマンドメッセージ（`Dump`、`Save` など）は、後続のペイロードWebhookが来る可能性があるため、ディスパッチ前にデバウンスウィンドウ分だけ待つようになります。グループチャットのコマンドは引き続き即時ディスパッチされます。
- **結合出力には上限があります** — 結合テキストは4000文字で、明示的な `…[truncated]` マーカーが付きます。添付は20件まで、ソースエントリは10件までです（それを超える場合は先頭と最新を保持します）。各ソース `messageId` は引き続き受信重複排除に到達するため、後から個別イベントをMessagePollerが再送しても重複として認識されます。
- **チャネル単位のオプトインです。** 他のチャネル（Telegram、WhatsApp、Slack、…）には影響しません。

### シナリオとエージェントに見える内容

| ユーザーの入力                                                      | Appleの配信            | フラグオフ（デフォルト）               | フラグオン + 2500 msウィンドウ                                         |
| ------------------------------------------------------------------ | ---------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（1回の送信）                            | 約1秒差で2Webhook      | 2つのエージェントターン: `Dump` のみ、その後URL | 1ターン: 結合テキスト `Dump https://example.com`                        |
| `Save this 📎image.jpg caption`（添付 + テキスト）                 | 2Webhook               | 2ターン                                | 1ターン: テキスト + 画像                                                |
| `/status`（単独コマンド）                                          | 1Webhook               | 即時ディスパッチ                       | **ウィンドウまで待機してからディスパッチ**                              |
| URLのみを貼り付け                                                  | 1Webhook               | 即時ディスパッチ                       | 即時ディスパッチ（バケット内のエントリが1件だけ）                       |
| テキスト + URLを意図的に数分空けて別メッセージで送信              | ウィンドウ外で2Webhook | 2ターン                                | 2ターン（間でウィンドウが期限切れ）                                     |
| 短時間の大量送信（ウィンドウ内に小さなDMが10件超）                | N Webhook              | Nターン                                | 1ターン、上限制御あり（先頭 + 最新、テキスト/添付の上限が適用される）   |

### 分割送信結合のトラブルシューティング

フラグがオンなのに分割送信がまだ2ターンで届く場合は、各レイヤーを確認してください:

1. **設定が実際に読み込まれているか。**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   その後 `openclaw gateway restart` を実行してください — このフラグはデバウンサーレジストリ作成時に読み込まれます。

2. **デバウンスウィンドウがその構成に十分広いか。** `~/Library/Logs/bluebubbles-server/main.log` にあるBlueBubblesサーバーログを確認してください:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   `"Dump"` のようなテキストのディスパッチと、それに続く `"https://..."; Attachments:` のディスパッチの間隔を測ってください。その間隔を十分にカバーするよう `messages.inbound.byChannel.bluebubbles` を引き上げます。

3. **セッションJSONLのタイムスタンプ ≠ Webhook到着時刻。** セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Gatewayがメッセージをエージェントに渡した時刻を反映しており、**Webhookが到着した時刻ではありません**。2つ目のメッセージに `[Queued messages while agent was busy]` と付いている場合、2つ目のWebhookが届いた時点で1つ目のターンがまだ実行中だったことを意味します — 結合バケットはすでにフラッシュ済みです。ウィンドウ調整はセッションログではなくBBサーバーログを基準に行ってください。

4. **メモリ圧迫で返信ディスパッチが遅くなっている。** 小さいマシン（8 GB）では、エージェントターンに時間がかかりすぎて、返信完了前に結合バケットがフラッシュされ、URLがキューされた2ターン目として到着することがあります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。Gatewayが約500 MB RSSを超え、コンプレッサーが動いている場合は、他の重いプロセスを閉じるか、より大きなホストに移してください。

5. **返信引用送信は別経路です。** ユーザーが既存のURLバルーンに対する**返信**として `Dump` をタップした場合（iMessageでDumpの吹き出しに「1 Reply」バッジが付く）、URLは2つ目のWebhookではなく `replyToBody` に入ります。結合は適用されません — これはデバウンサーの問題ではなく、Skill/プロンプトの問題です。

## ブロックストリーミング

応答を単一メッセージとして送るか、ブロック単位でストリーミングするかを制御します:

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
- 受信・送信メディアの上限は `channels.bluebubbles.mediaMaxMb` で制御します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に従って分割されます（デフォルト: 4000文字）。

## 設定リファレンス

完全な設定: [Configuration](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.bluebubbles.enabled`: チャネルを有効/無効にします。
- `channels.bluebubbles.serverUrl`: BlueBubbles REST APIのベースURL。
- `channels.bluebubbles.password`: APIパスワード。
- `channels.bluebubbles.webhookPath`: Webhookエンドポイントパス（デフォルト: `/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
- `channels.bluebubbles.allowFrom`: DM許可リスト（ハンドル、メール、E.164番号、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom`: グループ送信者の許可リスト。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOSで、ゲーティング通過後に名前のないグループ参加者をローカルContactsから任意で補完します。デフォルト: `false`。
- `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。
- `channels.bluebubbles.sendReadReceipts`: 既読通知を送信します（デフォルト: `true`）。
- `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします（デフォルト: `false`。ストリーミング返信に必要）。
- `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズ（文字数、デフォルト: 4000）。
- `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由の送信テキスト送信に対するリクエストごとのタイムアウト（ミリ秒、デフォルト: 30000）。macOS 26環境でPrivate APIによるiMessage送信がiMessageフレームワーク内部で60秒以上停止することがある場合は、`45000` または `60000` などに引き上げてください。現時点では、プローブ、チャット検索、リアクション、編集、ヘルスチェックは引き続き短い10秒デフォルトを使用します。リアクションと編集への適用拡大は後続対応として予定されています。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`: `length`（デフォルト）は `textChunkLimit` を超えたときだけ分割します。`newline` は長さによる分割の前に空行（段落境界）で分割します。
- `channels.bluebubbles.mediaMaxMb`: 受信/送信メディアの上限（MB、デフォルト: 8）。
- `channels.bluebubbles.mediaLocalRoots`: 送信するローカルメディアパスとして許可する絶対ローカルディレクトリの明示的な許可リスト。これを設定しない限り、ローカルパス送信はデフォルトで拒否されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.coalesceSameSenderDms`: 同じ送信者から連続して届くDM Webhookを1つのエージェントターンに結合し、Appleのテキスト+URL分割送信を単一メッセージとして扱えるようにします（デフォルト: `false`）。シナリオ、ウィンドウ調整、トレードオフについては [分割送信されるDMの結合](#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。明示的な `messages.inbound.byChannel.bluebubbles` がない状態で有効にすると、デフォルトの受信デバウンスウィンドウは500 msから2500 msへ広がります。
- `channels.bluebubbles.historyLimit`: コンテキスト用のグループメッセージ最大数（0で無効）。
- `channels.bluebubbles.dmHistoryLimit`: DM履歴の上限。
- `channels.bluebubbles.actions`: 個別アクションの有効/無効。
- `channels.bluebubbles.accounts`: マルチアカウント設定。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`.

## アドレッシング / 配信ターゲット

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123`（グループでは推奨）
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`, `user@example.com`
  - 直接ハンドルに既存のDMチャットがない場合、OpenClawは `POST /api/v1/chat/new` を使って作成します。これにはBlueBubbles Private APIを有効にする必要があります。

### iMessageとSMSのルーティング

同じハンドルにMac上でiMessageチャットとSMSチャットの両方が存在する場合（たとえばiMessage登録済みだが、緑の吹き出しへのフォールバックも受信した電話番号）、OpenClawはiMessageチャットを優先し、暗黙にSMSへダウングレードすることはありません。SMSチャットを強制するには、明示的な `sms:` ターゲットプレフィックスを使用してください（例: `sms:+15555550123`）。一致するiMessageチャットがないハンドルは、BlueBubblesが報告するチャット経由で送信されます。

## セキュリティ

- Webhookリクエストは、`guid`/`password` のクエリパラメータまたはヘッダーを `channels.bluebubbles.password` と比較して認証されます。
- APIパスワードとWebhookエンドポイントは秘密にしてください（認証情報として扱ってください）。
- BlueBubblesのWebhook認証にはlocalhostバイパスはありません。Webhookトラフィックをプロキシする場合も、リクエストのエンドツーエンドでBlueBubblesパスワードを保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりになりません。[Gateway security](/ja-JP/gateway/security#reverse-proxy-configuration) を参照してください。
- BlueBubblesサーバーをLAN外へ公開する場合は、HTTPS + ファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中/既読イベントが動作しなくなった場合は、BlueBubblesのWebhookログを確認し、Gatewayパスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードの有効期限は1時間です。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションにはBlueBubbles private API（`POST /api/v1/message/react`）が必要です。サーバーバージョンがこれを公開していることを確認してください。
- 編集/送信取り消しにはmacOS 13+ と互換性のあるBlueBubblesサーバーバージョンが必要です。macOS 26（Tahoe）では、private APIの変更により編集は現在壊れています。
- グループアイコン更新はmacOS 26（Tahoe）で不安定なことがあります。APIは成功を返しても、新しいアイコンが同期されない場合があります。
- OpenClawは、BlueBubblesサーバーのmacOSバージョンに基づいて既知の不具合があるアクションを自動的に非表示にします。macOS 26（Tahoe）でなお編集が表示される場合は、`channels.bluebubbles.actions.edit=false` で手動無効化してください。
- `coalesceSameSenderDms` を有効にしているのに分割送信（例: `Dump` + URL）がまだ2ターンで届く場合は、[分割送信結合のトラブルシューティング](#split-send-coalescing-troubleshooting) チェックリストを参照してください。よくある原因は、デバウンスウィンドウが短すぎること、セッションログのタイムスタンプをWebhook到着時刻と読み違えていること、または返信引用送信（2つ目のWebhookではなく `replyToBody` を使う）です。
- ステータス/ヘルス情報については: `openclaw status --all` または `openclaw status --deep`。

一般的なチャネルワークフローについては、[Channels](/ja-JP/channels) と [Plugins](/ja-JP/tools/plugin) ガイドを参照してください。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
