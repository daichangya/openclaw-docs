---
read_when:
    - 正確なフィールド単位の設定セマンティクスやデフォルト値が必要な場合
    - チャネル、モデル、Gateway、またはツールの設定ブロックを検証している場合
summary: すべてのOpenClaw設定キー、デフォルト値、チャネル設定の完全なリファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-06T04:48:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ae6c19666f65433361e1c8b100ae710448c8aa055a60c140241a8aea09b98a5
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json` で利用可能なすべてのフィールドです。タスク指向の概要については、[Configuration](/ja-JP/gateway/configuration) を参照してください。

設定形式は **JSON5** です（コメント + 末尾カンマを許可）。すべてのフィールドは任意で、省略時はOpenClawが安全なデフォルト値を使用します。

---

## チャネル

各チャネルは、その設定セクションが存在すると自動的に開始されます（`enabled: false` の場合を除く）。

### DMおよびグループアクセス

すべてのチャネルはDMポリシーとグループポリシーをサポートします。

| DM policy           | 動作                                                           |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (default) | 未知の送信者には1回限りのペアリングコードが送られ、オーナーの承認が必要 |
| `allowlist`         | `allowFrom` 内の送信者のみ（またはペアリング済み許可ストア）            |
| `open`              | すべての受信DMを許可（`allowFrom: ["*"]` が必要）                   |
| `disabled`          | すべての受信DMを無視                                          |

| Group policy          | 動作                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | 設定済みの許可リストに一致するグループのみ              |
| `open`                | グループ許可リストをバイパス（メンションゲートは引き続き適用） |
| `disabled`            | すべてのグループ/ルームメッセージをブロック            |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定のときのデフォルト値を設定します。
ペアリングコードの有効期限は1時間です。保留中のDMペアリング要求は **チャネルごとに3件** に制限されます。
プロバイダーブロック全体が存在しない場合（`channels.<provider>` がない場合）、ランタイムのグループポリシーは起動時警告とともに `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

`channels.modelByChannel` を使用すると、特定のチャネルIDをモデルに固定できます。値には `provider/model` または設定済みのモデルエイリアスを指定できます。このチャネルマッピングは、セッションにまだモデルオーバーライドがない場合に適用されます（たとえば `/model` で設定された場合など）。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### チャネルのデフォルト値とheartbeat

`channels.defaults` を使用すると、プロバイダー間で共有されるグループポリシーとheartbeat動作を設定できます。

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が未設定のときのフォールバックグループポリシー。
- `channels.defaults.contextVisibility`: すべてのチャネルに対する補足コンテキスト可視性モードのデフォルト値。値: `all`（デフォルト、引用/スレッド/履歴コンテキストをすべて含む）、`allowlist`（許可リスト済み送信者のコンテキストのみ含む）、`allowlist_quote`（allowlist と同じだが明示的な引用/返信コンテキストは保持）。チャネルごとのオーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常なチャネルステータスをheartbeat出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラーステータスをheartbeat出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータースタイルのheartbeat出力を描画します。

### WhatsApp

WhatsApp は Gateway の web チャネル（Baileys Web）経由で動作します。リンク済みセッションが存在すると自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 既読マーク（セルフチャットモードでは false）
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="複数アカウントのWhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- 送信コマンドは、`default` アカウントが存在する場合はそれを、そうでなければ最初に設定されたアカウントID（ソート済み）をデフォルトに使用します。
- オプションの `channels.whatsapp.defaultAccount` は、設定済みアカウントIDに一致する場合、このフォールバックのデフォルトアカウント選択を上書きします。
- レガシーな単一アカウントのBaileys認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` へ移行されます。
- アカウントごとのオーバーライド: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "回答は簡潔にしてください。",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "話題から逸れないでください。",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Gitバックアップ" },
        { command: "generate", description: "画像を作成" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress （デフォルト: off。プレビュー編集のレート制限を避けるには明示的に opt in してください）
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Botトークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否）、デフォルトアカウントでは `TELEGRAM_BOT_TOKEN` がフォールバックです。
- オプションの `channels.telegram.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- 複数アカウント構成（2つ以上のアカウントID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠落または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram 起点の設定書き込み（supergroup ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック用の永続的なACPバインディングを設定します（`match.peer.id` には正規の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) で共通です。
- Telegram のストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットとグループチャットの両方で動作）。
- リトライポリシー: [Retry policy](/ja-JP/concepts/retry) を参照してください。

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "短い回答のみ。",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress （progress は Discord では partial にマップされます）
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // `sessions_spawn({ thread: true })` の opt-in
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- トークン: `channels.discord.token`。デフォルトアカウントでは `DISCORD_BOT_TOKEN` がフォールバックです。
- 明示的な Discord `token` を指定する直接送信呼び出しでは、そのトークンが呼び出しに使用されます。アカウントのリトライ/ポリシー設定は、アクティブなランタイムスナップショット内で選択されたアカウントから引き続き取得されます。
- オプションの `channels.discord.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（guild channel）を使用します。裸の数値IDは拒否されます。
- Guild slug は小文字で、スペースは `-` に置換されます。チャネルキーには slug 化された名前（`#` なし）を使用します。guild ID の使用を推奨します。
- Bot自身が投稿したメッセージはデフォルトで無視されます。`allowBots: true` で有効になります。`allowBots: "mentions"` を使うと、Botへのメンションを含むBotメッセージのみ受け付けます（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャネルオーバーライド）は、別のユーザーまたはロールに言及しているが Bot には言及していないメッセージを破棄します（@everyone/@here は除く）。
- `maxLinesPerMessage`（デフォルト17）は、2000文字未満でも行数の多いメッセージを分割します。
- `channels.discord.threadBindings` は Discord のスレッド紐付けルーティングを制御します:
  - `enabled`: スレッド紐付けセッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、および紐付けされた配信/ルーティング）用の Discord オーバーライド
  - `idleHours`: 非アクティブ時の自動 unfocus までの時間（時間単位、`0` で無効）
  - `maxAgeHours`: 強制最大継続時間（時間単位、`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` の自動スレッド作成/紐付けの opt-in スイッチ
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャネルおよびスレッド用の永続的なACPバインディングを設定します（`match.peer.id` にはチャネル/スレッドIDを使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) で共通です。
- `channels.discord.ui.components.accentColor` は、Discord components v2 コンテナーのアクセントカラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話と、オプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClaw はさらに、繰り返し復号に失敗した後に音声セッションを離脱/再参加することで、音声受信回復も試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。レガシーな `streamMode` およびブール値の `streaming` は自動移行されます。
- `channels.discord.autoPresence` は、ランタイムの可用性を Bot プレゼンスにマップし（healthy => online、degraded => idle、exhausted => dnd）、オプションでステータステキストの上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、可変な名前/タグ一致を再有効化します（緊急時のみの互換モード）。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Discord ユーザーID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: オプションのエージェントID許可リスト。省略するとすべてのエージェントの承認を転送します。
  - `sessionFilter`: オプションのセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者DMに送信、`"channel"` は元チャネルに送信、`"both"` は両方に送信します。target に `"channel"` が含まれる場合、ボタンは解決済み承認者のみが使用できます。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認DMを削除します。

**リアクション通知モード:** `off`（なし）、`own`（Botのメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（`guilds.<id>.users` 由来のすべてのメッセージ）。

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- サービスアカウントJSON: インライン（`serviceAccount`）またはファイルベース（`serviceAccountFile`）。
- サービスアカウントの SecretRef（`serviceAccountRef`）もサポートされます。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変なメール主体一致を再有効化します（緊急時のみの互換モード）。

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "短い回答のみ。",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress （プレビューモード）
      nativeStreaming: true, // streaming=partial のとき Slack ネイティブのストリーミングAPIを使用
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode** には `botToken` と `appToken` の両方が必要です（デフォルトアカウント環境変数フォールバックは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** には `botToken` と `signingSecret`（ルートまたはアカウントごと）が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP mode では `signingSecretStatus` などの資格情報ごとの source/status フィールドを公開します。`configured_unavailable` は、そのアカウントが SecretRef 経由で設定されているが、現在のコマンド/ランタイム経路では秘密値を解決できなかったことを意味します。
- `configWrites: false` は、Slack 起点の設定書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- `channels.slack.streaming` は正規のストリームモードキーです。レガシーな `streamMode` およびブール値の `streaming` は自動移行されます。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用します。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` 由来）。

**スレッドセッション分離:** `thread.historyScope` はスレッド単位（デフォルト）またはチャネル共有です。`thread.inheritParent` は親チャネルトランスクリプトを新しいスレッドにコピーします。

- `typingReaction` は、返信処理中に受信した Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`: Slack ネイティブの exec 承認配信と承認者認可。スキーマは Discord と同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack ユーザーID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| Action group | デフォルト | 注記                 |
| ------------ | ---------- | -------------------- |
| reactions    | enabled    | リアクション + 一覧取得 |
| messages     | enabled    | 読み取り/送信/編集/削除 |
| pins         | enabled    | ピン留め/解除/一覧    |
| memberInfo   | enabled    | メンバー情報          |
| emojiList    | enabled    | カスタム絵文字一覧    |

### Mattermost

Mattermost は plugin として提供されます: `openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // リバースプロキシ/公開デプロイ向けのオプションの明示URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャットモード: `oncall`（@メンション時に応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` は完全URLではなくパスでなければなりません（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能でなければなりません。
- ネイティブの slash callback は、slash command 登録時に Mattermost が返すコマンドごとのトークンで認証されます。登録に失敗した場合や有効化されたコマンドがない場合、OpenClaw は callback を `Unauthorized: invalid command token.` で拒否します。
- 非公開/tailnet/内部の callback ホストでは、Mattermost に `ServiceSettings.AllowedUntrustedInternalConnections` へ callback ホスト/ドメインを含める設定が必要な場合があります。完全URLではなくホスト/ドメイン値を使用してください。
- `channels.mattermost.configWrites`: Mattermost 起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` を要求します。
- `channels.mattermost.groups.<channelId>.requireMention`: チャネルごとのメンションゲート上書き（デフォルトは `"*"`）。
- オプションの `channels.mattermost.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // オプションのアカウントバインディング
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` 由来）。

- `channels.signal.account`: チャネル起動を特定の Signal アカウントIDに固定します。
- `channels.signal.configWrites`: Signal 起点の設定書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubbles は推奨される iMessage 経路です（plugin ベース、`channels.bluebubbles` 配下で設定）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl、password、webhookPath、グループ制御、高度なアクション:
      // /channels/bluebubbles を参照
    },
  },
}
```

- ここで扱うコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles 会話を永続的な ACP セッションに紐付けできます。`match.peer.id` には BlueBubbles の handle またはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共通のフィールド意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全な BlueBubbles チャネル設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClaw は `imsg rpc`（stdio 上の JSON-RPC）を起動します。デーモンやポートは不要です。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- オプションの `channels.imessage.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。

- Messages DB への Full Disk Access が必要です。
- `chat_id:<id>` ターゲットの使用を推奨します。チャット一覧は `imsg chats --limit 20` で確認できます。
- `cliPath` は SSH ラッパーを指すこともでき、その場合は SCP 添付取得のために `remoteHost`（`host` または `user@host`）を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は strict host-key checking を使用するため、リレーホスト鍵がすでに `~/.ssh/known_hosts` に存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage 起点の設定書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage 会話を永続的な ACP セッションに紐付けできます。`match.peer.id` には正規化済み handle または明示的チャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共通のフィールド意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH ラッパー例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は拡張機能ベースで、`channels.matrix` 配下で設定します。

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- トークン認証では `accessToken`、パスワード認証では `userId` + `password` を使用します。
- `channels.matrix.proxy` は Matrix HTTP トラフィックを明示的な HTTP(S) プロキシ経由にします。名前付きアカウントでは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.allowPrivateNetwork` は private/internal homeserver を許可します。`proxy` と `allowPrivateNetwork` は独立した制御です。
- `channels.matrix.defaultAccount` は複数アカウント構成時の優先アカウントを選択します。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Matrix ユーザーID（例: `@owner:example.org`）。
  - `agentFilter`: オプションのエージェントID許可リスト。省略するとすべてのエージェントの承認を転送します。
  - `sessionFilter`: オプションのセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（元のルーム）、または `"both"`。
  - アカウントごとのオーバーライド: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は、Matrix DM をどのようにセッションへグループ化するかを制御します: `per-user`（デフォルト）はルーティング先 peer ごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix のステータスプローブとライブディレクトリ参照は、ランタイムトラフィックと同じプロキシポリシーを使用します。
- 完全な Matrix 設定、ターゲティング規則、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は拡張機能ベースで、`channels.msteams` 配下で設定します。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、webhook、team/channel ポリシー:
      // /channels/msteams を参照
    },
  },
}
```

- ここで扱うコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 設定（資格情報、webhook、DM/グループポリシー、team/channel ごとのオーバーライド）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は拡張機能ベースで、`channels.irc` 配下で設定します。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- ここで扱うコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、設定済みアカウントIDに一致する場合、デフォルトアカウント選択を上書きします。
- 完全な IRC チャネル設定（host/port/TLS/channels/allowlists/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### 複数アカウント（すべてのチャネル）

チャネルごとに複数アカウントを実行します（それぞれ独自の `accountId` を持ちます）。

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `accountId` を省略すると `default` が使用されます（CLI + ルーティング）。
- 環境変数トークンは **default** アカウントにのみ適用されます。
- ベースチャネル設定は、アカウントごとのオーバーライドがない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用すると、各アカウントを別のエージェントへルーティングできます。
- `openclaw channels add`（またはチャネルオンボーディング）で、まだ単一アカウントのトップレベルチャネル設定のまま non-default アカウントを追加すると、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャネルのアカウントマップへ昇格させ、元のアカウントが引き続き動作するようにします。ほとんどのチャネルはそれらを `channels.<channel>.accounts.default` へ移動しますが、Matrix は既存の一致する named/default ターゲットを保持できます。
- 既存のチャネル専用バインディング（`accountId` なし）はデフォルトアカウントへの一致を維持します。アカウントスコープのバインディングは引き続き任意です。
- `openclaw doctor --fix` も混在した形を修復し、そのチャネル用に選ばれた昇格先アカウントへアカウントスコープのトップレベル単一アカウント値を移動します。ほとんどのチャネルでは `accounts.default` を使用し、Matrix は既存の一致する named/default ターゲットを保持できます。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として設定され、専用のチャネルページに記載されています（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャネル索引は [Channels](/ja-JP/channels) を参照してください。

### グループチャットのメンションゲート

グループメッセージはデフォルトで **メンション必須** です（メタデータメンションまたは安全な正規表現パターン）。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

**メンション種別:**

- **メタデータメンション**: ネイティブなプラットフォームの @-mention。WhatsApp のセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` にある安全な正規表現パターン。無効なパターンや危険な入れ子の繰り返しは無視されます。
- メンションゲートは、検出が可能な場合にのみ適用されます（ネイティブメンションまたは少なくとも1つのパターンがある場合）。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャネルでは `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効にするには `0` を設定してください。

#### DM履歴上限

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解決順: DMごとのオーバーライド → プロバイダーデフォルト → 上限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

自分の番号を `allowFrom` に含めるとセルフチャットモードが有効になります（ネイティブの @-mention を無視し、テキストパターンにのみ応答します）。

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Commands（チャットコマンド処理）

```json5
{
  commands: {
    native: "auto", // サポートされる場合はネイティブコマンドを登録
    text: true, // チャットメッセージ内の /commands を解析
    bash: false, // ! を許可（別名: /bash）
    bashForegroundMs: 2000,
    config: false, // /config を許可
    debug: false, // /debug を許可
    restart: false, // /restart + gateway restart tool を許可
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンドの詳細">

- テキストコマンドは、先頭が `/` の **単独メッセージ** でなければなりません。
- `native: "auto"` は Discord/Telegram でネイティブコマンドを有効化し、Slack では無効のままにします。
- チャネルごとに上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドをクリアします。
- `channels.telegram.customCommands` は、追加の Telegram Bot メニュー項目を追加します。
- `bash: true` は、ホストシェル向けの `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれている必要があります。
- `config: true` は `/config`（`openclaw.json` の読み書き）を有効にします。Gateway の `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の書き込み権限を持つ operator クライアントで引き続き利用可能です。
- `channels.<provider>.configWrites` は、チャネルごとの設定変更を制御します（デフォルト: true）。
- 複数アカウントチャネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象にした書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `allowFrom` はプロバイダーごとです。設定されている場合、それが **唯一の** 認可ソースとなります（チャネルの allowlist/pairing および `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に、コマンドがアクセスグループポリシーをバイパスできるようにします。

</Accordion>

---

## エージェントのデフォルト値

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示されるオプションのリポジトリルート。未設定の場合、OpenClaw は workspace から上方向へたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定しないエージェント向けの、オプションのデフォルト skill 許可リストです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // デフォルト値を置き換え
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

- デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
- デフォルト値を継承するには `agents.list[].skills` を省略します。
- Skills をなしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのエージェントの最終セットであり、デフォルト値とはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrap ファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap ファイルをシステムプロンプトへ注入するタイミングを制御します。デフォルトは `"always"` です。

- `"continuation-skip"`: 安全な継続ターン（完了済みアシスタント応答の後）では、workspace bootstrap の再注入をスキップし、プロンプトサイズを削減します。heartbeat 実行と compaction 後の再試行では引き続きコンテキストを再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の workspace bootstrap ファイルごとの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべての workspace bootstrap ファイル全体で注入される最大文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap コンテキストが切り詰められたときの、エージェント向け警告テキストを制御します。
デフォルトは `"once"` です。

- `"off"`: 警告テキストをシステムプロンプトへ決して注入しません。
- `"once"`: 一意な切り詰めシグネチャごとに一度だけ警告を注入します（推奨）。
- `"always"`: 切り詰めがあるたびに毎回警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前に transcript/tool の画像ブロックで許可される最長辺の最大ピクセルサイズ。
デフォルト: `1200`。

低い値は通常、スクリーンショット中心の実行における vision token 使用量とリクエストペイロードサイズを削減します。
高い値はより多くの視覚的詳細を保持します。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトコンテキスト用のタイムゾーン（メッセージのタイムスタンプではありません）。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式。デフォルトは `auto`（OSの設定）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // グローバルなデフォルトプロバイダーパラメータ
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 文字列形式は primary model のみを設定します。
  - オブジェクト形式は primary と順序付き failover model を設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `image` ツール経路で、その vision-model 設定として使用されます。
  - 選択済み/デフォルトモデルが画像入力を受け取れない場合のフォールバックルーティングにも使用されます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共通の画像生成 capability と、今後の画像生成を行う tool/plugin surface で使用されます。
  - 典型的な値: Gemini ネイティブ画像生成向けの `google/gemini-3.1-flash-image-preview`、fal 向けの `fal/fal-ai/flux/dev`、OpenAI Images 向けの `openai/gpt-image-1`。
  - プロバイダー/モデルを直接選択する場合は、対応するプロバイダー認証/API キーも設定してください（例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`）。
  - 省略しても、`image_generate` は認証済みプロバイダーのデフォルト値を推定できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み画像生成プロバイダーを provider-id 順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共通の音楽生成 capability と、組み込みの `music_generate` ツールで使用されます。
  - 典型的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、`minimax/music-2.5+`。
  - 省略しても、`music_generate` は認証済みプロバイダーのデフォルト値を推定できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み音楽生成プロバイダーを provider-id 順に試します。
  - プロバイダー/モデルを直接選択する場合は、対応するプロバイダー認証/API キーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共通の動画生成 capability と、組み込みの `video_generate` ツールで使用されます。
  - 典型的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、`qwen/wan2.7-r2v`。
  - 省略しても、`video_generate` は認証済みプロバイダーのデフォルト値を推定できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み動画生成プロバイダーを provider-id 順に試します。
  - プロバイダー/モデルを直接選択する場合は、対応するプロバイダー認証/API キーも設定してください。
  - バンドルされている Qwen 動画生成プロバイダーは現在、最大で出力動画 1 本、入力画像 1 枚、入力動画 4 本、長さ 10 秒、プロバイダーレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートしています。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `pdf` ツールのモデルルーティングに使用されます。
  - 省略時、PDF ツールは `imageModel`、次に解決済みセッション/デフォルトモデルへフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の `pdf` ツールのデフォルト PDF サイズ上限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバックモードで考慮するデフォルト最大ページ数。
- `verboseDefault`: エージェントのデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: エージェントのデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: `openai/gpt-5.4`）。プロバイダーを省略すると、OpenClaw はまずエイリアス、次にその正確なモデルIDに一致する一意の configured-provider、最後に設定済みデフォルトプロバイダーを試します（非推奨の互換動作なので、明示的な `provider/model` を推奨します）。そのプロバイダーが設定済みデフォルトモデルを提供しなくなった場合、OpenClaw は古くなった削除済みプロバイダーデフォルトを表面化する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。
- `models`: 設定済みモデルカタログおよび `/model` 用の許可リスト。各エントリには `alias`（ショートカット）と `params`（`temperature`、`maxTokens`、`cacheRetention`、`context1m` などのプロバイダー固有設定）を含めることができます。
- `params`: すべてのモデルに適用されるグローバルなデフォルトプロバイダーパラメータ。`agents.defaults.params` で設定します（例: `{ cacheRetention: "long" }`）。
- `params` マージ優先順位（config）: `agents.defaults.params`（グローバルベース）は、`agents.defaults.models["provider/model"].params`（モデルごと）、次に `agents.list[].params`（一致する agent id）がキー単位で上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- これらのフィールドを変更する config writer（例: `/models set`、`/models set-image`、fallback の追加/削除コマンド）は、正規のオブジェクト形式を保存し、可能な限り既存の fallback リストを保持します。
- `maxConcurrent`: セッションをまたいだ並列エージェント実行の最大数（各セッションは引き続き直列化されます）。デフォルト: 4。

**組み込みのエイリアス短縮名**（モデルが `agents.defaults.models` にある場合のみ適用）:

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトより優先されます。

Z.AI の GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に thinking mode を有効化します。
Z.AI モデルは tool call ストリーミングのために、デフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 モデルは、明示的な thinking level が設定されていない場合、デフォルトで `adaptive` thinking を使用します。

- `sessionArg` が設定されている場合にセッション対応。
- `imageArg` がファイルパスを受け付ける場合に画像パススルー対応。

### `agents.defaults.heartbeat`

定期的なheartbeat実行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        lightContext: false, // デフォルト: false。true の場合、workspace bootstrap ファイルからは HEARTBEAT.md のみ保持
        isolatedSession: false, // デフォルト: false。true の場合、各 heartbeat は新しいセッションで実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト） | block
        target: "none", // デフォルト: none | options: last | whatsapp | telegram | discord | ...
        prompt: "存在する場合は HEARTBEAT.md を読んでください...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: duration string（ms/s/m/h）。デフォルト: `30m`（API-key auth）または `1h`（OAuth auth）。無効にするには `0m` を設定します。
- `suppressToolErrorWarnings`: true の場合、heartbeat 実行中の tool error warning payload を抑制します。
- `directPolicy`: 直接/DM 配信ポリシー。`allow`（デフォルト）は direct-target 配信を許可します。`block` は direct-target 配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、heartbeat 実行では軽量な bootstrap コンテキストを使用し、workspace bootstrap ファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 heartbeat 実行は以前の会話履歴を持たない新しいセッションで動作します。cron の `sessionTarget: "isolated"` と同じ分離パターンです。heartbeat ごとのトークンコストを約 100K から約 2-5K トークンに削減します。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義している場合、**それらのエージェントだけ** が heartbeat を実行します。
- Heartbeat は完全なエージェントターンを実行するため、間隔を短くするとより多くのトークンを消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "deployment ID、ticket ID、host:port の組を正確に保持してください。", // identifierPolicy=custom のとき使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // オプションの compaction 専用モデル上書き
        notifyUser: true, // compaction 開始時に短い通知を送信（デフォルト: false）
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "セッションはまもなく compaction に入ります。永続メモリを今のうちに保存してください。",
          prompt: "lasting notes があれば memory/YYYY-MM-DD.md に書き込んでください。保存するものがなければ正確な silent token NO_REPLY で応答してください。",
        },
      },
    },
  },
}
```

- `mode`: `default` または `safeguard`（長い履歴向けの分割要約）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClaw が中断するまでに 1 回の compaction 操作へ許容される最大秒数。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は compaction 要約時に、組み込みの不透明識別子保持ガイダンスを先頭へ追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使用される、オプションのカスタム識別子保持テキスト。
- `postCompactionSections`: compaction 後に再注入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。無効にするには `[]` を設定してください。未設定、またはこのデフォルトの組を明示的に設定した場合、古い `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け付けます。
- `model`: compaction 要約専用のオプションの `provider/model-id` 上書き。メインセッションでは一方のモデルを使い、compaction 要約では別のモデルを使いたい場合に使用します。未設定の場合、compaction はセッションの primary model を使用します。
- `notifyUser`: `true` の場合、compaction 開始時に短い通知（例: 「コンテキストを圧縮しています...」）をユーザーへ送ります。デフォルトでは compaction を静かに保つため無効です。
- `memoryFlush`: 自動 compaction 前に永続メモリを保存するための無音エージェントターン。workspace が読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM へ送信する前に、メモリ内コンテキストから **古いツール結果** を刈り込みます。ディスク上のセッション履歴は **変更しません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), デフォルト単位: 分
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[古いツール結果の内容はクリアされました]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl モードの動作">

- `mode: "cache-ttl"` は pruning pass を有効にします。
- `ttl` は、最後の cache touch の後、再び pruning を実行できる頻度を制御します。
- Pruning はまず大きすぎるツール結果を soft-trim し、その後必要であれば古いツール結果を hard-clear します。

**Soft-trim** は先頭 + 末尾を保持し、中間に `...` を挿入します。

**Hard-clear** はツール結果全体を placeholder に置き換えます。

注意:

- 画像ブロックは切り詰め/クリアされません。
- 比率はトークン数ではなく文字数ベースの概算です。
- `keepLastAssistants` 個未満の assistant message しか存在しない場合、pruning はスキップされます。

</Accordion>

動作の詳細は [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### ブロックストリーミング

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（minMs/maxMs を使用）
    },
  },
}
```

- Telegram 以外のチャネルでは、ブロック返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネルごとのオーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダムな待機。`natural` = 800–2500ms。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作と chunking の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: 直接チャット/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みエージェント用のオプションの sandboxing。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRef / インライン内容もサポート:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox の詳細">

**Backend:**

- `docker`: ローカル Docker ランタイム（デフォルト）
- `ssh`: 汎用 SSH バックエンドのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` を選択した場合、ランタイム固有設定は `plugins.entries.openshell.config` へ移動します。

**SSH backend 設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとの workspace 用に使用される絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw が実行時に temp file へ実体化するインライン内容または SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH のホスト鍵ポリシー設定

**SSH 認証の優先順位:**

- `identityData` が `identityFile` に優先
- `certificateData` が `certificateFile` に優先
- `knownHostsData` が `knownHostsFile` に優先
- SecretRef ベースの `*Data` 値は、sandbox セッション開始前にアクティブな secrets runtime snapshot から解決されます

**SSH backend の動作:**

- create または recreate 後に一度だけリモート workspace を初期化
- その後、リモート SSH workspace を正として維持
- `exec`、ファイルツール、メディアパスを SSH 経由でルーティング
- リモート変更は自動的にホストへ同期されない
- sandbox browser container はサポートしない

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとの sandbox workspace
- `ro`: `/workspace` に sandbox workspace、`/agent` に agent workspace を読み取り専用でマウント
- `rw`: agent workspace を `/workspace` に読み書き可能でマウント

**Scope:**

- `session`: セッションごとの container + workspace
- `agent`: エージェントごとに 1 つの container + workspace（デフォルト）
- `shared`: 共有 container と workspace（セッション間分離なし）

**OpenShell plugin config:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // オプション
          gatewayEndpoint: "https://lab.example", // オプション
          policy: "strict", // オプションの OpenShell policy id
          providers: ["openai"], // オプション
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell mode:**

- `mirror`: exec 前にローカルからリモートへ初期化し、exec 後に同期を戻します。ローカル workspace が正として維持されます
- `remote`: sandbox 作成時に一度だけリモートを初期化し、その後リモート workspace を正として維持します

`remote` mode では、OpenClaw の外側で行われたホストローカル編集は、初期化後に自動で sandbox へ同期されません。
転送は SSH で OpenShell sandbox へ接続しますが、sandbox のライフサイクルとオプションの mirror sync は plugin が管理します。

**`setupCommand`** は container 作成後に一度だけ実行されます（`sh -lc` 経由）。ネットワーク外向き接続、書き込み可能なルート、root ユーザーが必要です。

**Container はデフォルトで `network: "none"`** です。エージェントに outbound access が必要な場合は `"bridge"`（またはカスタム bridge network）に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を明示的に設定しない限り（緊急時のみ）、デフォルトでブロックされます。

**受信添付ファイル** は、アクティブ workspace 内の `media/inbound/*` へステージされます。

**`docker.binds`** は追加のホストディレクトリをマウントします。グローバルとエージェントごとの bind はマージされます。

**Sandboxed browser**（`sandbox.browser.enabled`）: container 内の Chromium + CDP。noVNC URL がシステムプロンプトへ注入されます。`openclaw.json` の `browser.enabled` は不要です。
noVNC の observer access ではデフォルトで VNC auth を使用し、OpenClaw は共有URLにパスワードを露出する代わりに短命トークンURLを発行します。

- `allowHostControl: false`（デフォルト）は、sandboxed session からホスト browser を対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用 bridge network）です。グローバル bridge 接続を明示的に望む場合にのみ `bridge` を設定してください。
- `cdpSourceRange` は、CDP ingress を container エッジで CIDR 範囲（例: `172.21.0.1/32`）に制限できます。
- `sandbox.browser.binds` は追加のホストディレクトリを sandbox browser container のみにマウントします。設定されると（`[]` を含む）、browser container では `docker.binds` を置き換えます。
- 起動デフォルト値は `scripts/sandbox-browser-entrypoint.sh` に定義されており、container host 向けに調整されています:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`（デフォルトで有効）
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` はデフォルトで有効で、WebGL/3D 使用に必要な場合は `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効にできます。
  - ワークフローで必要な場合は `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で拡張機能を再有効化します。
  - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium のデフォルトのプロセス制限を使うには `0` を設定します。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
  - これらのデフォルト値は container image のベースラインです。container デフォルトを変更するには、カスタム browser image とカスタム entrypoint を使用してください。

</Accordion>

browser sandboxing と `sandbox.docker.binds` は現在 Docker 専用です。

イメージのビルド:

```bash
scripts/sandbox-setup.sh           # メイン sandbox イメージ
scripts/sandbox-browser-setup.sh   # オプションの browser イメージ
```

### `agents.list`（エージェントごとのオーバーライド）

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // または { primary, fallbacks }
        thinkingDefault: "high", // エージェントごとの thinking level オーバーライド
        reasoningDefault: "on", // エージェントごとの reasoning visibility オーバーライド
        fastModeDefault: false, // エージェントごとの fast mode オーバーライド
        params: { cacheRetention: "none" }, // 一致する defaults.models params をキー単位で上書き
        skills: ["docs-search"], // 設定時は agents.defaults.skills を置き換え
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: 安定したエージェントID（必須）。
- `default`: 複数設定されている場合は最初のものが優先されます（警告が記録されます）。何も設定されていない場合は list の最初のエントリがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` でグローバル fallback を無効化）。`primary` のみを上書きする cron job は、`fallbacks: []` を設定しない限り、引き続きデフォルト fallback を継承します。
- `params`: 選択された `agents.defaults.models` 内のモデルエントリの上にマージされる、エージェントごとの stream params。`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有オーバーライドに使用し、モデルカタログ全体を重複させずに済みます。
- `skills`: オプションのエージェントごとの skill 許可リスト。省略時、そのエージェントは `agents.defaults.skills` が設定されていればそれを継承します。明示的なリストはデフォルト値をマージせず置き換え、`[]` は Skills なしを意味します。
- `thinkingDefault`: オプションのエージェントごとのデフォルト thinking level（`off | minimal | low | medium | high | xhigh | adaptive`）。メッセージごとまたはセッションごとのオーバーライドが設定されていない場合、このエージェントに対して `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: オプションのエージェントごとのデフォルト reasoning visibility（`on | off | stream`）。メッセージごとまたはセッションごとの reasoning オーバーライドが設定されていない場合に適用されます。
- `fastModeDefault`: オプションのエージェントごとの fast mode デフォルト（`true | false`）。メッセージごとまたはセッションごとの fast-mode オーバーライドが設定されていない場合に適用されます。
- `runtime`: オプションのエージェントごとの runtime descriptor。エージェントがデフォルトで ACP harness session を使用すべき場合は、`type: "acp"` と `runtime.acp` のデフォルト値（`agent`、`backend`、`mode`、`cwd`）を使用します。
- `identity.avatar`: workspace 相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルト値を導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` 用のエージェントID許可リスト（`["*"]` = 何でも可、デフォルト: 同じエージェントのみ）。
- Sandbox 継承ガード: リクエスターセッションが sandboxed の場合、`sessions_spawn` は unsandboxed で実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制。デフォルト: false）。

---

## マルチエージェントルーティング

1つの Gateway 内で複数の分離されたエージェントを実行します。[Multi-Agent](/ja-JP/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### バインディング一致フィールド

- `type`（オプション）: 通常のルーティングには `route`（type が欠けている場合は route がデフォルト）、永続的な ACP 会話バインディングには `acp`
- `match.channel`（必須）
- `match.accountId`（オプション。`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（オプション。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（オプション。チャネル固有）
- `acp`（オプション。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（正確一致、peer/guild/team なし）
5. `match.accountId: "*"`（チャネル全体）
6. デフォルトエージェント

各 tier 内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリでは、OpenClaw は正確な会話ID（`match.channel` + account + `match.peer.id`）で解決し、上記の route binding tier 順序は使用しません。

### エージェントごとのアクセスプロファイル

<Accordion title="フルアクセス（sandbox なし）">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムアクセスなし（メッセージングのみ）">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細は [Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // この token 数を超えると parent-thread fork をスキップ（0 で無効）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration または false
      maxDiskBytes: "500mb", // オプションの hard budget
      highWaterBytes: "400mb", // オプションの cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // デフォルトの非アクティブ自動 unfocus 時間（0 で無効）
      maxAgeHours: 0, // デフォルトの hard max age 時間（0 で無効）
    },
    mainKey: "main", // レガシー（ランタイムは常に "main" を使用）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session フィールドの詳細">

- **`scope`**: グループチャット文脈のベースとなるセッショングループ化戦略。
  - `per-sender`（デフォルト）: チャネル文脈内で送信者ごとに分離されたセッション。
  - `global`: チャネル文脈内の全参加者で単一セッションを共有します（共有コンテキストを意図する場合にのみ使用）。
- **`dmScope`**: DM のグループ化方法。
  - `main`: すべての DM が main session を共有。
  - `per-peer`: チャネルをまたいで送信者IDごとに分離。
  - `per-channel-peer`: チャネル + 送信者ごとに分離（複数ユーザーの inbox に推奨）。
  - `per-account-channel-peer`: account + channel + sender ごとに分離（複数アカウントに推奨）。
- **`identityLinks`**: チャネル横断セッション共有のための、provider prefix 付き peer への canonical id マップ。
- **`reset`**: 主たるリセットポリシー。`daily` はローカル時刻の `atHour` にリセットし、`idle` は `idleMinutes` 後にリセットします。両方が設定されている場合、先に期限切れになる方が優先されます。
- **`resetByType`**: type ごとのオーバーライド（`direct`、`group`、`thread`）。レガシーな `dm` は `direct` の別名として受け付けます。
- **`parentForkMaxTokens`**: fork された thread session を作成するときに許可される親セッションの `totalTokens` 最大値（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClaw は親 transcript 履歴を引き継ぐ代わりに新しい thread session を開始します。
  - このガードを無効にして常に親 fork を許可するには `0` を設定します。
- **`mainKey`**: レガシーフィールド。ランタイムは現在、main direct-chat bucket に常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: agent-to-agent exchange 中の reply-back turn の最大数（整数、範囲: `0`–`5`）。`0` は ping-pong chaining を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、レガシーな `dm` は別名）、`keyPrefix`、または `rawKeyPrefix` に一致。最初の deny が優先されます。
- **`maintenance`**: session-store cleanup + retention controls。
  - `mode`: `warn` は警告のみを出し、`enforce` は cleanup を適用します。
  - `pruneAfter`: 古いエントリの経過日数しきい値（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` の最大エントリ数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたらローテーション（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archive の保持期間。デフォルトは `pruneAfter` です。無効にするには `false` を設定してください。
  - `maxDiskBytes`: セッションディレクトリのオプションのディスク予算。`warn` モードでは警告を記録し、`enforce` モードでは最も古い artifact/session から削除します。
  - `highWaterBytes`: 予算 cleanup 後のオプション目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッド紐付けセッション機能のグローバルデフォルト。
  - `enabled`: マスターのデフォルトスイッチ（プロバイダーが上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ自動 unfocus までのデフォルト時間（時間単位、`0` で無効。プロバイダーが上書き可能）
  - `maxAgeHours`: hard max age のデフォルト時間（時間単位、`0` で無効。プロバイダーが上書き可能）

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // または "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 で無効
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Response prefix

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順（最も具体的なものが優先）: account → channel → global。`""` は無効化し、カスケードも停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| Variable          | 説明                 | 例                          |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 短いモデル名         | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子   | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名       | `anthropic`                 |
| `{thinkingLevel}` | 現在の thinking level | `high`, `low`, `off`        |
| `{identity.name}` | エージェントの identity 名 | （`"auto"` と同じ）      |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` の別名です。

### Ack reaction

- デフォルトはアクティブエージェントの `identity.emoji`、それ以外は `"👀"`。無効にするには `""` を設定します。
- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順: account → channel → `messages.ackReaction` → identity fallback。
- Scope: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram で返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクル status reaction を有効にします。
  Slack と Discord では、未設定時は ack reaction が有効な場合に status reaction も有効のままです。
  Telegram では、ライフサイクル status reaction を有効にするには明示的に `true` を設定してください。

### Inbound debounce

同じ送信者からの短時間のテキスト専用メッセージをまとめて1つのエージェントターンにします。メディア/添付は即時フラッシュされます。制御コマンドは debounce をバイパスします。

### TTS（text-to-speech）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` は auto-TTS を制御します。`/tts off|always|inbound|tagged` はセッションごとに上書きします。
- `summaryModel` は、自動要約のために `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` はデフォルトで `false`（opt-in）です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS endpoint を上書きします。解決順は config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が OpenAI 以外の endpoint を指す場合、OpenClaw はそれを OpenAI 互換 TTS server とみなし、model/voice validation を緩和します。

---

## Talk

Talk mode（macOS/iOS/Android）のデフォルト値です。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` は、複数の Talk provider が設定されている場合、`talk.providers` 内のキーに一致する必要があります。
- レガシーなフラット Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性維持専用で、自動的に `talk.providers.<provider>` へ移行されます。
- Voice ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` はプレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk directives で親しみやすい名前を使用できます。
- `silenceTimeoutMs` は、ユーザーの無音後に Talk mode が transcript を送信するまで待機する時間を制御します。未設定時はプラットフォームデフォルトの pause window を維持します（`macOS と Android では 700 ms、iOS では 900 ms`）。

---

## ツール

### ツールプロファイル

`tools.profile` は、`tools.allow`/`tools.deny` より前にベースの許可リストを設定します。

ローカルオンボーディングでは、未設定の新しいローカル設定に対し、`tools.profile: "coding"` をデフォルト設定します（既存の明示的なプロファイルは保持されます）。

| Profile     | 含まれるもの                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                     |
| `full`      | 制限なし（未設定と同じ）                                                                                                      |

### ツールグループ

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` の別名として受け付けられます）                                    |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | すべての組み込みツール（provider plugin は除く）                                                                        |

### `tools.allow` / `tools.deny`

グローバルなツール許可/拒否ポリシー（deny が優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker sandbox が無効でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のプロバイダーまたはモデルに対するツールをさらに制限します。順序: ベースプロファイル → provider profile → allow/deny。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

sandbox の外での elevated exec access を制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェントごとのオーバーライド（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` は状態をセッションごとに保存します。インライン directive は単一メッセージに適用されます。
- Elevated `exec` は sandboxing をバイパスし、設定された escape path（デフォルトでは `gateway`、exec target が `node` の場合は `node`）を使用します。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全チェックは **デフォルトで無効** です。検出を有効にするには `enabled: true` を設定してください。
設定はグローバルに `tools.loopDetection` で定義でき、エージェントごとに `agents.list[].tools.loopDetection` で上書きできます。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: ループ分析のために保持する tool-call 履歴の最大数。
- `warningThreshold`: 警告を出す、繰り返しの no-progress パターンしきい値。
- `criticalThreshold`: 重大なループをブロックする、より高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: あらゆる no-progress 実行に対するハードストップしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しで警告。
- `detectors.knownPollNoProgress`: 既知の poll ツール（`process.poll`、`command_status` など）で警告/ブロック。
- `detectors.pingPong`: 交互に現れる no-progress ペアパターンで警告/ブロック。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // または BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // オプション。自動検出するには省略
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

受信メディア理解（画像/音声/動画）を設定します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: 完了した async music/video をチャネルへ直接送信
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Media モデルエントリのフィールド">

**Provider エントリ**（`type: "provider"` または省略時）:

- `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: model id オーバーライド
- `profile` / `preferredProfile`: `auth-profiles.json` の profile 選択

**CLI エントリ**（`type: "cli"`）:

- `command`: 実行する実行ファイル
- `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: オプションのリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとのオーバーライド。
- 失敗した場合は次のエントリへフォールバックします。

Provider auth は標準順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

**Async completion フィールド:**

- `asyncCompletion.directSend`: `true` の場合、完了した async `music_generate` と `video_generate` タスクは、まず直接チャネル配信を試みます。デフォルト: `false`（レガシーの requester-session wake/model-delivery path）。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

session tools（`sessions_list`、`sessions_history`、`sessions_send`）でターゲット可能なセッションを制御します。

デフォルト: `tree`（現在のセッション + そこから spawned されたセッション、たとえば subagent）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注意:

- `self`: 現在の session key のみ。
- `tree`: 現在のセッション + 現在のセッションから spawned されたセッション（subagent）。
- `agent`: 現在の agent id に属する任意のセッション（同じ agent id 配下で per-sender session を実行している場合、他のユーザーも含まれ得ます）。
- `all`: 任意のセッション。cross-agent targeting には引き続き `tools.agentToAgent` が必要です。
- Sandbox clamp: 現在のセッションが sandboxed で、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても visibility は `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付サポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: true にするとインラインファイル添付を許可
        maxTotalBytes: 5242880, // 全ファイル合計 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 1ファイルあたり 1 MB
        retainOnSessionKeep: false, // cleanup="keep" 時に添付を保持
      },
    },
  },
}
```

注意:

- 添付がサポートされるのは `runtime: "subagent"` のみです。ACP runtime では拒否されます。
- ファイルは子 workspace の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- 添付内容は transcript persistence から自動的に伏せ字化されます。
- Base64 入力は、厳格な alphabet/padding チェックと decode 前サイズガードで検証されます。
- ファイル権限はディレクトリが `0700`、ファイルが `0600` です。
- Cleanup は `cleanup` ポリシーに従います: `delete` は常に添付を削除し、`keep` は `retainOnSessionKeep: true` の場合のみ保持します。

### `tools.experimental`

実験的な組み込みツールフラグです。ランタイム固有の自動有効化規則が適用されない限り、デフォルトでは無効です。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 実験的な update_plan を有効化
    },
  },
}
```

注意:

- `planTool`: 自明でない複数ステップ作業の追跡に使う、構造化された `update_plan` ツールを有効にします。
- デフォルト: OpenAI 以外のプロバイダーでは `false`。OpenAI と OpenAI Codex の実行では自動的に有効化されます。
- 有効時、システムプロンプトにも使用ガイダンスが追加され、モデルはそれを実質的な作業にのみ使い、`in_progress` は最大1ステップまでに保ちます。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: spawned sub-agent 用のデフォルトモデル。省略時、sub-agent は呼び出し元のモデルを継承します。
- `allowAgents`: リクエスターエージェントが独自の `subagents.allowAgents` を設定していない場合の、`sessions_spawn` 用ターゲット agent id のデフォルト許可リスト（`["*"]` = 任意、デフォルト: 同じエージェントのみ）。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` を省略した場合の `sessions_spawn` のデフォルト timeout（秒）。`0` は timeout なしを意味します。
- subagent ごとのツールポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーと base URL

OpenClaw は組み込みモデルカタログを使用します。カスタムプロバイダーは config の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加します。

```json5
{
  models: {
    mode: "merge", // merge（デフォルト） | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- カスタム認証が必要な場合は `authHeader: true` + `headers` を使用してください。
- agent config root は `OPENCLAW_AGENT_DIR`（またはレガシーな環境変数別名 `PI_CODING_AGENT_DIR`）で上書きできます。
- 一致する provider ID に対するマージ優先順位:
  - 空でない agent `models.json` の `baseUrl` 値が優先されます。
  - 空でない agent `apiKey` 値は、その provider が現在の config/auth-profile context で SecretRef 管理されていない場合にのみ優先されます。
  - SecretRef 管理された provider の `apiKey` 値は、解決済みの秘密値を永続化するのではなく、source marker（env ref では `ENV_VAR_NAME`、file/exec ref では `secretref-managed`）から更新されます。
  - SecretRef 管理された provider header 値は、source marker（env ref では `secretref-env:ENV_VAR_NAME`、file/exec ref では `secretref-managed`）から更新されます。
  - 空または欠落した agent `apiKey`/`baseUrl` は、config の `models.providers` にフォールバックします。
  - 一致する model の `contextWindow`/`maxTokens` は、明示的 config 値と暗黙の catalog 値の高い方を使用します。
  - 一致する model の `contextTokens` は、明示的な runtime cap が存在する場合はそれを保持します。モデル本来の `contextWindow` を変えずに有効コンテキストを制限したい場合に使用してください。
  - config で `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使用します。
  - marker persistence は source-authoritative です: marker は解決済みランタイム秘密値からではなく、アクティブな source config snapshot（解決前）から書き込まれます。

### Provider フィールドの詳細

- `models.mode`: provider catalog 動作（`merge` または `replace`）。
- `models.providers`: provider id をキーとするカスタム provider map。
- `models.providers.*.api`: リクエストアダプター（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: provider credential（SecretRef/env substitution の使用を推奨）。
- `models.providers.*.auth`: auth strategy（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用に、リクエストへ `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に資格情報を `Authorization` ヘッダーで送るよう強制します。
- `models.providers.*.baseUrl`: 上流 API の base URL。
- `models.providers.*.headers`: proxy/tenant routing 用の追加の静的ヘッダー。
- `models.providers.*.request`: model-provider HTTP request 用の transport オーバーライド。
  - `request.headers`: 追加ヘッダー（provider デフォルトとマージ）。値には SecretRef を指定できます。
  - `request.auth`: auth strategy のオーバーライド。モード: `"provider-default"`（provider 組み込み auth を使用）、`"authorization-bearer"`（`token` を使用）、`"header"`（`headerName`、`value`、オプションの `prefix` を使用）。
  - `request.proxy`: HTTP proxy オーバーライド。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` env vars を使用）、`"explicit-proxy"`（`url` を使用）。どちらのモードでもオプションの `tls` サブオブジェクトを受け付けます。
  - `request.tls`: 直接接続用の TLS オーバーライド。フィールド: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef を受け付け）、`serverName`、`insecureSkipVerify`。
- `models.providers.*.models`: 明示的な provider model catalog entry。
- `models.providers.*.models.*.contextWindow`: モデル本来の context window メタデータ。
- `models.providers.*.models.*.contextTokens`: オプションの runtime context cap。モデル本来の `contextWindow` より小さい有効コンテキスト予算にしたい場合に使用します。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。`api: "openai-completions"` で空でない非ネイティブ `baseUrl`（ホストが `api.openai.com` ではない）の場合、OpenClaw はランタイムでこれを強制的に `false` にします。空または省略された `baseUrl` では、OpenAI のデフォルト動作を維持します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動検出設定のルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙的な discovery のオン/オフ。
- `plugins.entries.amazon-bedrock.config.discovery.region`: discovery 用の AWS リージョン。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: targeted discovery 用のオプションの provider-id filter。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: discovery refresh 用ポーリング間隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: discovered model 用のフォールバック context window。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: discovered model 用のフォールバック max output tokens。

### Provider の例

<Accordion title="Cerebras（GLM 4.6 / 4.7）">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras には `cerebras/zai-glm-4.7`、Z.AI 直結には `zai/glm-4.7` を使用します。

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zen catalog には `opencode/...` 参照、Go catalog には `opencode-go/...` 参照を使用します。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定してください。`z.ai/*` と `z-ai/*` は許容される別名です。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- General endpoint: `https://api.z.ai/api/paas/v4`
- Coding endpoint（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- General endpoint を使う場合は、base URL override を持つカスタム provider を定義してください。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

ネイティブ Moonshot endpoint は共有の `openai-completions` transport 上でのストリーミング使用互換性を示し、OpenClaw は現在、組み込み provider id 単体ではなく endpoint capability に基づいてそれを判定します。

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic 互換の組み込み provider です。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic（Anthropic 互換）">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL には `/v1` を含めないでください（Anthropic client がそれを付加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（直結）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定してください。ショートカット:
`openclaw onboard --auth-choice minimax-global-api` または
`openclaw onboard --auth-choice minimax-cn-api`。
モデルカタログは現在、M2.7 のみをデフォルトとします。
Anthropic 互換ストリーミング経路では、明示的に `thinking` を設定しない限り、OpenClaw はデフォルトで MiniMax thinking を無効にします。`/fast on` または `params.fastMode: true` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカルモデル（LM Studio）">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 十分な性能のハードウェア上で LM Studio Responses API 経由の大規模ローカルモデルを実行し、フォールバック用にホスト型モデルを merged のまま残してください。

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent