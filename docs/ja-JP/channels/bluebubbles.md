---
read_when:
    - BlueBubblesチャンネルの設定
    - Webhookペアリングのトラブルシューティング
    - macOSでのiMessageの設定
summary: BlueBubbles macOSサーバー経由のiMessage（REST送受信、入力中表示、リアクション、ペアリング、高度なアクション）。
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-22T04:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles（macOS REST）

ステータス: HTTP経由でBlueBubbles macOSサーバーと通信するバンドル済みPluginです。従来のimsgチャンネルと比べてAPIがより豊富でセットアップも簡単なため、**iMessage連携にはこちらを推奨**します。

## バンドル済みPlugin

現在のOpenClawリリースにはBlueBubblesがバンドルされているため、通常のパッケージ済みビルドでは別途 `openclaw plugins install` を行う必要はありません。

## 概要

- BlueBubblesヘルパーアプリ（[bluebubbles.app](https://bluebubbles.app)）を使ってmacOS上で動作します。
- 推奨/検証済み: macOS Sequoia（15）。macOS Tahoe（26）でも動作しますが、現在Tahoeでは編集機能が壊れており、グループアイコンの更新は成功と表示されても同期されない場合があります。
- OpenClawはREST API（`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`）を通じてこれと通信します。
- 受信メッセージはWebhook経由で到着し、送信返信、入力中インジケーター、既読通知、tapbackはREST呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれ、可能な場合はエージェントにも渡されます。
- ペアリング/許可リストは他のチャンネルと同じように機能します（`/channels/pairing` など）。`channels.bluebubbles.allowFrom` + ペアリングコードを使用します。
- リアクションはSlack/Telegramと同様にシステムイベントとして表面化されるため、エージェントは返信前にそれらに「言及」できます。
- 高度な機能: 編集、送信取り消し、スレッド返信、メッセージエフェクト、グループ管理。

## クイックスタート

1. MacにBlueBubblesサーバーをインストールします（手順は[bluebubbles.app/install](https://bluebubbles.app/install)を参照してください）。
2. BlueBubblesの設定でWeb APIを有効にし、パスワードを設定します。
3. `openclaw onboard` を実行してBlueBubblesを選択するか、手動で設定します:

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

4. BlueBubblesのWebhookをゲートウェイに向けます（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. ゲートウェイを起動します。Webhookハンドラーが登録され、ペアリングが開始されます。

セキュリティに関する注意:

- 必ずWebhookパスワードを設定してください。
- Webhook認証は常に必須です。OpenClawは、`channels.bluebubbles.password` に一致するpassword/guidを含まないBlueBubbles Webhookリクエストを拒否します（たとえば `?password=<password>` または `x-password`）。これはloopback/proxyトポロジーに関係ありません。
- パスワード認証は、Webhook本文全体を読み取り/解析する前にチェックされます。

## Messages.appを生かしておく（VM / ヘッドレス構成）

一部のmacOS VM / 常時稼働構成では、Messages.appが「アイドル」状態になり（アプリを開くか前面化するまで受信イベントが止まる）、問題になることがあります。簡単な回避策として、AppleScript + LaunchAgentを使って**5分ごとにMessagesをつつく**方法があります。

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
- 初回実行時にmacOSの**Automation**プロンプト（`osascript` → Messages）が表示されることがあります。LaunchAgentを実行する同じユーザーセッションで承認してください。

読み込むには:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## オンボーディング

BlueBubblesは対話型オンボーディングで利用できます:

```
openclaw onboard
```

ウィザードでは次を入力します:

- **Server URL**（必須）: BlueBubblesサーバーのアドレス（例: `http://192.168.1.100:1234`）
- **Password**（必須）: BlueBubbles Server設定のAPIパスワード
- **Webhook path**（任意）: デフォルトは `/bluebubbles-webhook`
- **DM policy**: pairing、allowlist、open、またはdisabled
- **Allow list**: 電話番号、メールアドレス、またはチャットターゲット

CLIからBlueBubblesを追加することもできます:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが返され、承認されるまでメッセージは無視されます（コードは1時間で期限切れになります）。
- 承認方法:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- ペアリングがデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)

グループ:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom` は、`allowlist` が設定されているときに、グループ内で誰がトリガーできるかを制御します。

### 連絡先名の補完（macOS、任意）

BlueBubblesのグループWebhookには、生の参加者アドレスしか含まれないことがよくあります。代わりに `GroupMembers` コンテキストにローカルの連絡先名を表示したい場合は、macOS上でローカルContacts補完を有効にできます:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` で検索を有効にします。デフォルト: `false`。
- 検索は、グループアクセス、コマンド認可、メンション制御によってメッセージの通過が許可された後にのみ実行されます。
- 名前のない電話参加者だけが補完されます。
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

### メンション制御（グループ）

BlueBubblesはグループチャットのメンション制御をサポートしており、iMessage/WhatsAppの動作に一致します:

- メンション検出には `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）を使用します。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ応答します。
- 認可された送信者からの制御コマンドはメンション制御をバイパスします。

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

### コマンド制御

- 制御コマンド（例: `/config`, `/model`）には認可が必要です。
- コマンド認可の判定には `allowFrom` と `groupAllowFrom` を使用します。
- 認可された送信者は、グループ内でメンションしなくても制御コマンドを実行できます。

### グループごとのシステムプロンプト

`channels.bluebubbles.groups.*` の各エントリは、任意の `systemPrompt` 文字列を受け付けます。この値は、そのグループでメッセージを処理するすべてのターンでエージェントのシステムプロンプトに注入されるため、エージェントのプロンプトを編集しなくても、グループごとのペルソナや振る舞いルールを設定できます:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "返信は3文以内にしてください。グループのカジュアルなトーンに合わせてください。",
        },
      },
    },
  },
}
```

キーは、BlueBubblesがグループに対して報告する `chatGuid` / `chatIdentifier` / 数値の `chatId` のいずれかに一致し、`"*"` ワイルドカードエントリを使うと、完全一致がないすべてのグループのデフォルトを設定できます（`requireMention` やグループごとのツールポリシーで使われるものと同じパターンです）。完全一致は常にワイルドカードより優先されます。DMではこのフィールドは無視されます。代わりに、エージェントレベルまたはアカウントレベルのプロンプトカスタマイズを使用してください。

#### 実例: スレッド返信とtapbackリアクション（Private API）

BlueBubbles Private APIを有効にすると、受信メッセージには短いメッセージID（例: `[[reply_to:5]]`）が付いて届き、エージェントは `action=reply` を呼び出して特定のメッセージにスレッド返信したり、`action=react` を呼び出してtapbackを付けたりできます。グループごとの `systemPrompt` は、エージェントに正しいツールを選ばせるための確実な方法です:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "このグループで返信するときは、必ずコンテキスト内の",
            "[[reply_to:N]] messageIdを使って action=reply を呼び出し、",
            "トリガーとなったメッセージの下に返信をスレッド化してください。",
            "リンクされていない新規メッセージは決して送信しないでください。",
            "",
            "短い確認応答（'ok'、'got it'、'on it'）には、",
            "テキスト返信を送る代わりに、適切なtapback絵文字",
            "（❤️、👍、😂、‼️、❓）で action=react を使ってください。",
          ].join(" "),
        },
      },
    },
  },
}
```

tapbackリアクションとスレッド返信はどちらもBlueBubbles Private APIが必要です。基盤となる仕組みについては、[高度なアクション](#advanced-actions) と [メッセージID](#message-ids-short-vs-full) を参照してください。

## ACP会話バインディング

BlueBubblesチャットは、転送レイヤーを変えずに永続的なACPワークスペースにできます。

高速なオペレーター手順:

- DMまたは許可されたグループチャット内で `/acp spawn codex --bind here` を実行します。
- 同じBlueBubbles会話内の以後のメッセージは、生成されたACPセッションにルーティングされます。
- `/new` と `/reset` は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close` はACPセッションを閉じ、バインディングを削除します。

設定済みの永続バインディングも、トップレベルの `bindings[]` エントリで `type: "acp"` および `match.channel: "bluebubbles"` を通じてサポートされます。

`match.peer.id` には、サポートされている任意のBlueBubblesターゲット形式を使えます:

- `+15555550123` や `user@example.com` のような正規化されたDMハンドル
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

共通のACPバインディング動作については、[ACP Agents](/ja-JP/tools/acp-agents) を参照してください。

## 入力中表示 + 既読通知

- **入力中インジケーター**: 応答生成の前と生成中に自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts` で制御します（デフォルト: `true`）。
- **入力中インジケーター**: OpenClawは入力開始イベントを送信します。BlueBubblesは送信時またはタイムアウト時に自動で入力中状態を解除します（DELETEによる手動停止は信頼性がありません）。

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
        reply: true, // メッセージGUIDによるスレッド返信
        sendWithEffect: true, // メッセージエフェクト（slam、loudなど）
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

- **react**: tapbackリアクションを追加/削除します（`messageId`, `emoji`, `remove`）。iMessageネイティブのtapbackセットは `love`, `like`, `dislike`, `laugh`, `emphasize`, `question` です。エージェントがこのセット外の絵文字（たとえば `👀`）を選んだ場合、リアクションツールは `love` にフォールバックするため、リクエスト全体を失敗させずにtapbackが表示されます。設定済みのackリアクションは引き続き厳密に検証され、不明な値ではエラーになります。
- **edit**: 送信済みメッセージを編集します（`messageId`, `text`）
- **unsend**: メッセージを送信取り消しします（`messageId`）
- **reply**: 特定のメッセージに返信します（`messageId`, `text`, `to`）
- **sendWithEffect**: iMessageエフェクト付きで送信します（`text`, `to`, `effectId`）
- **renameGroup**: グループチャット名を変更します（`chatGuid`, `displayName`）
- **setGroupIcon**: グループチャットのアイコン/写真を設定します（`chatGuid`, `media`）— macOS 26 Tahoeでは不安定です（APIが成功を返してもアイコンが同期されない場合があります）。
- **addParticipant**: 誰かをグループに追加します（`chatGuid`, `address`）
- **removeParticipant**: 誰かをグループから削除します（`chatGuid`, `address`）
- **leaveGroup**: グループチャットから退出します（`chatGuid`）
- **upload-file**: メディア/ファイルを送信します（`to`, `buffer`, `filename`, `asVoice`）
  - ボイスメモ: **MP3** または **CAF** 音声で `asVoice: true` を設定すると、iMessageの音声メッセージとして送信できます。BlueBubblesはボイスメモ送信時にMP3 → CAFへ変換します。
- レガシーエイリアス: `sendAttachment` も引き続き動作しますが、正式なアクション名は `upload-file` です。

### メッセージID（短縮版と完全版）

OpenClawは、トークン節約のために_短縮_メッセージID（例: `1`, `2`）を表示することがあります。

- `MessageSid` / `ReplyToId` には短縮IDが入る場合があります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全IDが入ります。
- 短縮IDはインメモリです。再起動やキャッシュ削除で失効することがあります。
- アクションは短縮版または完全版の `messageId` を受け付けますが、短縮IDが利用できなくなっている場合はエラーになります。

永続的な自動化や保存には完全IDを使用してください:

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については [設定](/ja-JP/gateway/configuration) を参照してください。

## 分割送信されるDMの統合（1回の入力内のコマンド + URL）

ユーザーがiMessageでコマンドとURLを一緒に入力した場合 — たとえば `Dump https://example.com/article` — Appleは送信を**2つの別々のWebhook配信**に分割します:

1. テキストメッセージ（`"Dump"`）。
2. OGプレビュー画像を添付したURLプレビューバルーン（`"https://..."`）。

ほとんどの環境で、2つのWebhookは約0.8〜2.0秒の間隔でOpenClawに到着します。統合しない場合、エージェントは1ターン目でコマンドだけを受け取り、返信し（多くの場合「URLを送ってください」）、2ターン目で初めてURLを見ることになります。その時点ではコマンドの文脈はすでに失われています。

`channels.bluebubbles.coalesceSameSenderDms` を使うと、DMで連続して届く同一送信者のWebhookを1つのエージェントターンに統合できます。グループチャットは引き続きメッセージ単位でキー化されるため、複数ユーザーのターン構造は保たれます。

### 有効にするタイミング

次の場合に有効にしてください:

- 1つのメッセージ内で `command + payload` を想定するSkillsを提供している（dump、paste、save、queueなど）。
- ユーザーがコマンドと一緒にURL、画像、長文コンテンツを貼り付ける。
- DMターンの待ち時間増加を許容できる（下記参照）。

次の場合は無効のままにしてください:

- 単語1つのDMトリガーに対して最小限のコマンド遅延が必要。
- すべてのフローが、後続ペイロードなしの単発コマンドである。

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

このフラグがオンで、明示的な `messages.inbound.byChannel.bluebubbles` がない場合、デバウンスウィンドウは**2500 ms**に広がります（統合なしのデフォルトは500 ms）。この広いウィンドウが必要です。Appleの0.8〜2.0秒の分割送信間隔は、より狭いデフォルトには収まりません。

ウィンドウを自分で調整するには:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // ほとんどの環境では2500 msで動作します。Macが遅い場合や
        // メモリ圧迫下にある場合は4000 msまで上げてください
        // （その場合、観測される間隔が2秒を超えることがあります）。
        bluebubbles: 2500,
      },
    },
  },
}
```

### トレードオフ

- **DM制御コマンドに遅延が追加されます。** このフラグをオンにすると、DMの制御コマンドメッセージ（`Dump`, `Save` など）は、ペイロードWebhookが来る可能性を考慮して、デバウンスウィンドウまで待ってからディスパッチされます。グループチャットのコマンドは即時ディスパッチのままです。
- **統合後の出力には上限があります** — 統合テキストは明示的な `…[truncated]` マーカー付きで4000文字まで、添付ファイルは20件まで、ソースエントリは10件までです（それを超える場合も最初と最新は保持されます）。各ソース `messageId` は引き続き受信重複排除に渡されるため、後から任意の個別イベントがMessagePollerで再生されても重複として認識されます。
- **チャンネル単位のオプトインです。** 他のチャンネル（Telegram、WhatsApp、Slack、…）には影響しません。

### シナリオとエージェントに見える内容

| ユーザーの入力                                                      | Appleの配信             | フラグオフ（デフォルト）                 | フラグオン + 2500 msウィンドウ                                      |
| ------------------------------------------------------------------- | ----------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| `Dump https://example.com`（1回送信）                               | 約1秒差の2つのWebhook   | 2つのエージェントターン: 「Dump」のみ、次にURL | 1ターン: 統合テキスト `Dump https://example.com`                     |
| `Save this 📎image.jpg caption`（添付 + テキスト）                  | 2つのWebhook            | 2ターン                                  | 1ターン: テキスト + 画像                                             |
| `/status`（単独コマンド）                                           | 1つのWebhook            | 即時ディスパッチ                         | **ウィンドウまで待ってからディスパッチ**                             |
| URL単体の貼り付け                                                   | 1つのWebhook            | 即時ディスパッチ                         | 即時ディスパッチ（バケットに1エントリしかないため）                 |
| テキスト + URLを、数分離して意図的に別メッセージで送信             | ウィンドウ外の2Webhook  | 2ターン                                  | 2ターン（間でウィンドウが期限切れになるため）                       |
| 連続フラッド（ウィンドウ内に10件超の小さなDM）                     | N個のWebhook            | Nターン                                  | 1ターン、上限付き出力（最初 + 最新、テキスト/添付上限を適用）       |

### 分割送信統合のトラブルシューティング

フラグがオンなのに分割送信がまだ2ターンで届く場合は、各レイヤーを確認してください:

1. **設定が実際に読み込まれているか。**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   次に `openclaw gateway restart` を実行します — このフラグはdebouncer-registry作成時に読み込まれます。

2. **デバウンスウィンドウが環境に対して十分広いか。** `~/Library/Logs/bluebubbles-server/main.log` にあるBlueBubblesサーバーログを確認します:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   `"Dump"` のようなテキスト送信と、その後に続く `"https://..."; Attachments:` の送信の間隔を測定してください。その間隔を十分にカバーできるように `messages.inbound.byChannel.bluebubbles` を引き上げます。

3. **セッションJSONLのタイムスタンプ ≠ Webhook到着時刻。** セッションイベントのタイムスタンプ（`~/.openclaw/agents/<id>/sessions/*.jsonl`）は、Webhook到着時刻ではなく、ゲートウェイがメッセージをエージェントに渡した時刻を表します。2つ目のメッセージが `[Queued messages while agent was busy]` と表示されるなら、2つ目のWebhookが来た時点で1ターン目がまだ実行中だったことを意味します — 統合バケットはすでにフラッシュ済みです。調整はセッションログではなくBBサーバーログを基準に行ってください。

4. **メモリ圧迫で返信ディスパッチが遅くなっている。** 小さいマシン（8 GB）では、エージェントターンが長引いて統合バケットが返信完了前にフラッシュし、その結果URLがキュー済みの2ターン目として入ることがあります。`memory_pressure` と `ps -o rss -p $(pgrep openclaw-gateway)` を確認してください。ゲートウェイが約500 MB RSSを超え、compressorが動作している場合は、他の重いプロセスを閉じるか、より大きいホストに移してください。

5. **返信引用送信は別経路です。** ユーザーが既存のURLバルーンへの**返信**として `Dump` をタップした場合（iMessageではDumpバブルに「1 Reply」バッジが表示されます）、URLは2つ目のWebhookではなく `replyToBody` にあります。統合は適用されません — これはdebouncerの問題ではなく、Skill/プロンプトの問題です。

## ブロックストリーミング

応答を1つのメッセージとして送るか、ブロック単位でストリーミングするかを制御します:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // ブロックストリーミングを有効化（デフォルトはオフ）
    },
  },
}
```

## メディア + 制限

- 受信添付ファイルはダウンロードされ、メディアキャッシュに保存されます。
- 受信・送信メディアの上限は `channels.bluebubbles.mediaMaxMb` で制御します（デフォルト: 8 MB）。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に従って分割されます（デフォルト: 4000文字）。

## 設定リファレンス

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.bluebubbles.enabled`: チャンネルを有効/無効にします。
- `channels.bluebubbles.serverUrl`: BlueBubbles REST APIのベースURL。
- `channels.bluebubbles.password`: APIパスワード。
- `channels.bluebubbles.webhookPath`: Webhookエンドポイントパス（デフォルト: `/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。
- `channels.bluebubbles.allowFrom`: DM許可リスト（ハンドル、メール、E.164番号、`chat_id:*`, `chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled`（デフォルト: `allowlist`）。
- `channels.bluebubbles.groupAllowFrom`: グループ送信者の許可リスト。
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS上で、制御通過後に名前のないグループ参加者をローカルContactsから任意で補完します。デフォルト: `false`。
- `channels.bluebubbles.groups`: グループごとの設定（`requireMention` など）。
- `channels.bluebubbles.sendReadReceipts`: 既読通知を送信します（デフォルト: `true`）。
- `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします（デフォルト: `false`。ストリーミング返信に必須）。
- `channels.bluebubbles.textChunkLimit`: 送信チャンクサイズ（文字数、デフォルト: 4000）。
- `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` 経由の送信テキスト送信に対するリクエストごとのタイムアウト（ms、デフォルト: 30000）。macOS 26環境でPrivate APIのiMessage送信がiMessage framework内で60秒以上停止する場合は引き上げてください。たとえば `45000` または `60000`。現在のところ、プローブ、チャット参照、リアクション、編集、ヘルスチェックは引き続き短い10秒デフォルトを使います。リアクションと編集まで対象を広げる対応は今後予定されています。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
- `channels.bluebubbles.chunkMode`: `length`（デフォルト）は `textChunkLimit` 超過時のみ分割します。`newline` は長さで分割する前に空行（段落境界）で分割します。
- `channels.bluebubbles.mediaMaxMb`: 受信/送信メディア上限（MB、デフォルト: 8）。
- `channels.bluebubbles.mediaLocalRoots`: 送信ローカルメディアパスに許可される絶対ローカルディレクトリの明示的な許可リスト。これを設定しない限り、ローカルパス送信はデフォルトで拒否されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.coalesceSameSenderDms`: 連続する同一送信者のDM Webhookを1つのエージェントターンに統合し、Appleのテキスト+URL分割送信を1つのメッセージとして届くようにします（デフォルト: `false`）。シナリオ、ウィンドウ調整、トレードオフについては [分割送信されるDMの統合](#coalescing-split-send-dms-command--url-in-one-composition) を参照してください。明示的な `messages.inbound.byChannel.bluebubbles` なしで有効にすると、デフォルトの受信デバウンスウィンドウは500 msから2500 msに広がります。
- `channels.bluebubbles.historyLimit`: コンテキスト用のグループメッセージ最大数（0で無効）。
- `channels.bluebubbles.dmHistoryLimit`: DM履歴上限。
- `channels.bluebubbles.actions`: 個別アクションを有効/無効にします。
- `channels.bluebubbles.accounts`: 複数アカウント設定。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（または `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`.

## アドレッシング / 配信ターゲット

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123`（グループ向け推奨）
- `chat_id:123`
- `chat_identifier:...`
- 直接ハンドル: `+15555550123`, `user@example.com`
  - 直接ハンドルに既存のDMチャットがない場合、OpenClawは `POST /api/v1/chat/new` を通じて新規作成します。これにはBlueBubbles Private APIが有効である必要があります。

### iMessageとSMSのルーティング

同じハンドルにMac上でiMessageチャットとSMSチャットの両方がある場合（たとえばiMessage登録済みだが、緑バブルのフォールバックも受信している電話番号）、OpenClawはiMessageチャットを優先し、黙ってSMSへダウングレードすることはありません。SMSチャットを強制したい場合は、明示的な `sms:` ターゲット接頭辞を使ってください（例: `sms:+15555550123`）。一致するiMessageチャットがないハンドルは、BlueBubblesが報告するチャット経由で送信されます。

## セキュリティ

- Webhookリクエストは、`guid`/`password` のクエリパラメータまたはヘッダーを `channels.bluebubbles.password` と照合して認証されます。
- APIパスワードとWebhookエンドポイントは秘密にしてください（認証情報として扱ってください）。
- BlueBubbles Webhook認証にはlocalhostバイパスはありません。Webhookトラフィックをプロキシする場合も、BlueBubblesパスワードをリクエストにエンドツーエンドで保持してください。ここでは `gateway.trustedProxies` は `channels.bluebubbles.password` の代わりになりません。参照: [Gateway security](/ja-JP/gateway/security#reverse-proxy-configuration)。
- LAN外に公開する場合は、BlueBubblesサーバーでHTTPS + ファイアウォールルールを有効にしてください。

## トラブルシューティング

- 入力中/既読イベントが動作しなくなった場合は、BlueBubbles Webhookログを確認し、ゲートウェイパスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードは1時間で期限切れになります。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションにはBlueBubbles Private API（`POST /api/v1/message/react`）が必要です。サーバーバージョンがこれを公開していることを確認してください。
- 編集/送信取り消しにはmacOS 13+と互換性のあるBlueBubblesサーバーバージョンが必要です。macOS 26（Tahoe）では、Private APIの変更により編集は現在壊れています。
- グループアイコン更新はmacOS 26（Tahoe）では不安定な場合があります。APIが成功を返しても、新しいアイコンが同期されないことがあります。
- OpenClawは、BlueBubblesサーバーのmacOSバージョンに基づいて、既知の不具合があるアクションを自動で非表示にします。macOS 26（Tahoe）でまだeditが表示される場合は、`channels.bluebubbles.actions.edit=false` で手動無効化してください。
- `coalesceSameSenderDms` を有効にしているのに分割送信（例: `Dump` + URL）がまだ2ターンで届く場合は、[分割送信統合のトラブルシューティング](#split-send-coalescing-troubleshooting) のチェックリストを参照してください。よくある原因は、デバウンスウィンドウが狭すぎること、セッションログのタイムスタンプをWebhook到着時刻と誤読していること、または返信引用送信（2つ目のWebhookではなく `replyToBody` を使う）です。
- ステータス/ヘルス情報: `openclaw status --all` または `openclaw status --deep`。

一般的なチャンネルワークフローの参照については、[Channels](/ja-JP/channels) と [Plugins](/ja-JP/tools/plugin) ガイドを参照してください。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルとハードニング
