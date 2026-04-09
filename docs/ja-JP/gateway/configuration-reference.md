---
read_when:
    - 正確なフィールド単位の設定セマンティクスやデフォルト値が必要なとき
    - channel、model、gateway、またはtoolの設定ブロックを検証しているとき
summary: コアとなるOpenClawキー、デフォルト値、専用サブシステム参照へのリンクを含むGateway設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-09T01:33:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9d6d0c542b9874809491978fdcf8e1a7bb35a4873db56aa797963d03af4453c
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json` のコア設定リファレンスです。タスク指向の概要については、[Configuration](/ja-JP/gateway/configuration) を参照してください。

このページでは、主要なOpenClawの設定面を扱い、サブシステムに独自のより詳細なリファレンスがある場合はリンクを示します。このページでは、すべてのchannel/plugin所有のコマンドカタログや、すべての詳細なmemory/QMDノブを1ページにインライン展開しようとはしていません。

コード上の真実:

- `openclaw config schema` は、検証およびControl UIで使用されるライブJSON Schemaを出力し、利用可能な場合はbundled/plugin/channelメタデータがマージされます
- `config.schema.lookup` は、詳細確認用ツール向けに1つのパススコープschemaノードを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、config-docベースラインハッシュを現在のschema面に対して検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下のdreaming設定については [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + bundledコマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands)
- channel固有のコマンド面については各所有channel/pluginページ

設定形式は **JSON5** です（コメントと末尾カンマを許可）。すべてのフィールドは任意です — OpenClawは省略時に安全なデフォルト値を使います。

---

## Channels

各channelは、その設定セクションが存在すれば自動的に開始されます（`enabled: false` の場合を除く）。

### DMとグループアクセス

すべてのchannelはDMポリシーとグループポリシーをサポートします:

| DM policy           | 動作                                                           |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (default) | 未知の送信者には1回限りのペアリングコードが送られ、所有者が承認する必要があります |
| `allowlist`         | `allowFrom`（またはペア済みallowストア）内の送信者のみ           |
| `open`              | すべての受信DMを許可（`allowFrom: ["*"]` が必要）                |
| `disabled`          | すべての受信DMを無視                                           |

| Group policy          | 動作                                                     |
| --------------------- | -------------------------------------------------------- |
| `allowlist` (default) | 設定されたallowlistに一致するグループのみ                 |
| `open`                | グループallowlistをバイパス（mention-gatingは引き続き適用） |
| `disabled`            | すべてのgroup/roomメッセージをブロック                    |

<Note>
`channels.defaults.groupPolicy` は、providerの `groupPolicy` が未設定のときのデフォルトを設定します。
ペアリングコードは1時間後に期限切れになります。保留中のDMペアリング要求は **channelごとに3件** に制限されます。
providerブロック自体が完全に欠けている場合（`channels.<provider>` が存在しない場合）、実行時のgroup policyは `allowlist`（fail-closed）にフォールバックし、起動時に警告が出ます。
</Note>

### Channel modelオーバーライド

特定のchannel IDをmodelに固定するには `channels.modelByChannel` を使います。値には `provider/model` または設定済みmodel alias を指定できます。このchannelマッピングは、sessionにすでにmodelオーバーライド（たとえば `/model` で設定）がない場合に適用されます。

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

### Channelのデフォルト値とheartbeat

provider間で共有するgroup-policyとheartbeat動作には `channels.defaults` を使います:

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

- `channels.defaults.groupPolicy`: providerレベルの `groupPolicy` が未設定のときのフォールバックgroup policy。
- `channels.defaults.contextVisibility`: 全channelの補足context可視性モードのデフォルト。値: `all`（デフォルト、引用/スレッド/履歴contextをすべて含む）、`allowlist`（allowlisted senderからのcontextのみ含む）、`allowlist_quote`（allowlistと同じだが明示的なquote/reply contextを保持）。channelごとのオーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常なchannelステータスをheartbeat出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラーステータスをheartbeat出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター形式のheartbeat出力を描画します。

### WhatsApp

WhatsAppはgatewayのweb channel（Baileys Web）経由で動作します。リンク済みsessionが存在すると自動で開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (self-chat modeではfalse)
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

<Accordion title="マルチアカウントWhatsApp">

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

- 送信コマンドは、`default` アカウントが存在する場合はそれを、そうでない場合は最初に設定されたアカウントid（ソート順）をデフォルトで使用します。
- 任意の `channels.whatsapp.defaultAccount` は、設定済みアカウントidと一致する場合、このフォールバックのデフォルトアカウント選択を上書きします。
- レガシーな単一アカウントBaileys認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` へ移行されます。
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
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; preview-edit rate limitを避けるため明示的にopt in)
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

- Bot token: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。symlinkは拒否）、デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN` も使用可能です。
- 任意の `channels.telegram.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- マルチアカウント構成（2つ以上のアカウントid）では、フォールバックルーティングを避けるため明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠けているか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram起点のconfig書き込み（supergroup ID移行、`/config set|unset`）をブロックします。
- 最上位の `bindings[]` エントリーで `type: "acp"` を持つものは、forum topic向けの永続ACPバインディングを設定します（`match.peer.id` には正規の `chatId:topic:topicId` を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共通です。
- Telegramのstream previewは `sendMessage` + `editMessageText` を使用します（direct chatとgroup chatの両方で機能します）。
- Retryポリシー: [Retry policy](/ja-JP/concepts/retry) を参照してください。

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
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progressはDiscordではpartialに対応)
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
        spawnSubagentSessions: false, // sessions_spawn({ thread: true }) のopt-in
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

- Token: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` を使用します。
- 明示的なDiscord `token` を指定する直接送信呼び出しでは、その呼び出しにそのtokenを使用します。アカウントのretry/policy設定は、アクティブなruntime snapshotで選択されたアカウントから引き続き取得されます。
- 任意の `channels.discord.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- 配信先ターゲットには `user:<id>`（DM）または `channel:<id>`（guild channel）を使用します。数字のみのIDは拒否されます。
- Guild slugは小文字で、空白は `-` に置き換えられます。channelキーにはslug化された名前（`#` なし）を使用します。guild IDを優先してください。
- Bot自身が投稿したメッセージはデフォルトで無視されます。`allowBots: true` で有効化できます。botにmentionしたbotメッセージのみ受け入れるには `allowBots: "mentions"` を使用します（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびchannelオーバーライド）は、別のユーザーまたはroleにmentionしているがbotにはmentionしていないメッセージを破棄します（@everyone/@hereは除く）。
- `maxLinesPerMessage`（デフォルト17）は、2000文字未満でも行数の多いメッセージを分割します。
- `channels.discord.threadBindings` はDiscordのthread-bound routingを制御します:
  - `enabled`: thread-bound session機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびbound delivery/routing）のDiscordオーバーライド
  - `idleHours`: 非アクティブ時の自動unfocusのDiscordオーバーライド（時間単位、`0` で無効）
  - `maxAgeHours`: ハード最大期間のDiscordオーバーライド（時間単位、`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` に対する自動thread作成/バインドのopt-inスイッチ
- 最上位の `bindings[]` エントリーで `type: "acp"` を持つものは、channelおよびthread向けの永続ACPバインディングを設定します（`match.peer.id` にはchannel/thread idを使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) と共通です。
- `channels.discord.ui.components.accentColor` は、Discord components v2 containerのアクセントカラーを設定します。
- `channels.discord.voice` は、Discord voice channel会話と任意のauto-join + TTSオーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` のDAVEオプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClawはさらに、繰り返しdecrypt失敗が起きた後にvoice sessionを退出/再参加することでvoice receive recoveryも試みます。
- `channels.discord.streaming` が正規のstream modeキーです。レガシーな `streamMode` と真偽値 `streaming` は自動移行されます。
- `channels.discord.autoPresence` はruntimeの可用性をbot presenceに対応付けます（healthy => online、degraded => idle、exhausted => dnd）。任意のstatus textオーバーライドも可能です。
- `channels.discord.dangerouslyAllowNameMatching` は、可変なname/tag一致を再有効化します（緊急避難用の互換モード）。
- `channels.discord.execApprovals`: Discordネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合にexec承認が有効になります。
  - `approvers`: exec要求を承認できるDiscord user ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のagent ID allowlist。省略するとすべてのagentの承認を転送します。
  - `sessionFilter`: 任意のsession key pattern（部分文字列またはregex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者DMへ、`"channel"` は元channelへ、`"both"` は両方へ送信します。targetに `"channel"` を含む場合、ボタンは解決済み承認者のみ使用できます。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはtimeout後に承認DMを削除します。

**Reaction notificationモード:** `off`（なし）、`own`（botのメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージに対して `guilds.<id>.users` から）。

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

- Service account JSON: インライン（`serviceAccount`）またはファイルベース（`serviceAccountFile`）。
- Service account SecretRefもサポートされています（`serviceAccountRef`）。
- Envフォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信先ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、可変なemail principal一致を再有効化します（緊急避難用の互換モード）。

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
          systemPrompt: "Short answers only.",
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // mode=partialのときSlackネイティブstreaming APIを使用
      },
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

- **Socket mode** では `botToken` と `appToken` の両方が必要です（デフォルトアカウントのenvフォールバックとして `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** では `botToken` と `signingSecret`（ルートまたはアカウントごと）が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は平文文字列またはSecretRefオブジェクトを受け付けます。
- Slackアカウントsnapshotは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP modeでは `signingSecretStatus` などの資格情報ごとのsource/statusフィールドを公開します。`configured_unavailable` は、そのアカウントがSecretRefで設定されているが、現在のcommand/runtime pathではsecret値を解決できなかったことを意味します。
- `configWrites: false` はSlack起点のconfig書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` が正規のSlack stream modeキーです。`channels.slack.streaming.nativeTransport` はSlackのネイティブstreaming transportを制御します。レガシーな `streamMode`、真偽値 `streaming`、`nativeStreaming` は自動移行されます。
- 配信先ターゲットには `user:<id>`（DM）または `channel:<id>` を使用します。

**Reaction notificationモード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**Thread session isolation:** `thread.historyScope` はthread単位（デフォルト）またはchannel共有です。`thread.inheritParent` は親channelのtranscriptを新しいthreadにコピーします。

- SlackネイティブstreamingとSlack assistant風の「is typing...」thread statusにはreply thread targetが必要です。最上位DMはデフォルトでthread外のままなので、thread風previewではなく `typingReaction` または通常配信が使用されます。
- `typingReaction` は、replyの実行中に受信Slackメッセージへ一時的にreactionを追加し、完了時に削除します。`"hourglass_flowing_sand"` のようなSlack emoji shortcodeを使用してください。
- `channels.slack.execApprovals`: Slackネイティブのexec承認配信と承認者認可。schemaはDiscordと同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack user ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| Action group | Default | 注記                    |
| ------------ | ------- | ----------------------- |
| reactions    | enabled | React + reaction一覧    |
| messages     | enabled | 読み取り/送信/編集/削除 |
| pins         | enabled | Pin/unpin/list          |
| memberInfo   | enabled | Member情報              |
| emojiList    | enabled | カスタムemoji一覧       |

### Mattermost

Mattermostはpluginとして提供されます: `openclaw plugins install @openclaw/mattermost`。

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
        // reverse-proxy/publicデプロイ向けの任意の明示URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chat mode: `oncall`（@-mention時に応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガーprefixで始まるメッセージ）。

Mattermostネイティブコマンドが有効な場合:

- `commands.callbackPath` はフルURLではなくパスでなければなりません（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` はOpenClaw gateway endpointに解決され、Mattermostサーバーから到達可能である必要があります。
- ネイティブslash callbackは、slash command登録時にMattermostが返すコマンドごとのtokenで認証されます。登録に失敗した場合、または有効なコマンドがない場合、OpenClawは callbackを `Unauthorized: invalid command token.` で拒否します。
- 非公開/tailnet/internal callback hostでは、Mattermostが `ServiceSettings.AllowedUntrustedInternalConnections` にcallback host/domainを含める必要があることがあります。
  フルURLではなくhost/domain値を使用してください。
- `channels.mattermost.configWrites`: Mattermost起点のconfig書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: channel内で返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: channelごとのmention-gatingオーバーライド（デフォルトには `"*"`）。
- 任意の `channels.mattermost.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 任意のアカウントバインディング
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

**Reaction notificationモード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

- `channels.signal.account`: channelの起動先を特定のSignalアカウントidentityに固定します。
- `channels.signal.configWrites`: Signal起点のconfig書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubblesは推奨されるiMessage経路です（pluginベース、`channels.bluebubbles` 配下で設定）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl、password、webhookPath、group control、高度なaction:
      // /channels/bluebubbles を参照
    },
  },
}
```

- ここで扱うコアキーパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 任意の `channels.bluebubbles.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- 最上位の `bindings[]` エントリーで `type: "acp"` を持つものは、BlueBubbles会話を永続ACP sessionにバインドできます。`match.peer.id` にはBlueBubbles handleまたはtarget文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用してください。共通フィールド意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全なBlueBubbles channel設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClawは `imsg rpc`（stdio上のJSON-RPC）を起動します。daemonやportは不要です。

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

- 任意の `channels.imessage.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。

- Messages DBへのFull Disk Accessが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャット一覧には `imsg chats --limit 20` を使用してください。
- `cliPath` はSSH wrapperを指すことができます。SCPでattachmentを取得するには `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は受信attachmentパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCPでは厳格なhost-keyチェックを使うため、relay host keyがすでに `~/.ssh/known_hosts` に存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage起点のconfig書き込みを許可または拒否します。
- 最上位の `bindings[]` エントリーで `type: "acp"` を持つものは、iMessage会話を永続ACP sessionにバインドできます。`match.peer.id` には正規化されたhandleまたは明示的なchat target（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用してください。共通フィールド意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH wrapper例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrixはextensionベースで、`channels.matrix` 配下で設定します。

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

- Token認証は `accessToken` を使用し、password認証は `userId` + `password` を使用します。
- `channels.matrix.proxy` はMatrix HTTPトラフィックを明示的なHTTP(S) proxy経由にします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` でこれを上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はprivate/internal homeserverを許可します。`proxy` とこのnetwork opt-inは独立した制御です。
- `channels.matrix.defaultAccount` はマルチアカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、招待されたroomや新しいDM風の招待は、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrixネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合にexec承認が有効になります。
  - `approvers`: exec要求を承認できるMatrix user ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のagent ID allowlist。省略するとすべてのagentの承認を転送します。
  - `sessionFilter`: 任意のsession key pattern（部分文字列またはregex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（元room）、または `"both"`。
  - アカウントごとのオーバーライド: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` はMatrix DMがsessionへどうグループ化されるかを制御します: `per-user`（デフォルト）はroutingされたpeer単位で共有し、`per-room` は各DM roomを分離します。
- Matrix status probeとlive directory lookupはruntime trafficと同じproxy policyを使用します。
- 完全なMatrix設定、ターゲティングルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teamsはextensionベースで、`channels.msteams` 配下で設定します。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、webhook、team/channel policy:
      // /channels/msteams を参照
    },
  },
}
```

- ここで扱うコアキーパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全なTeams設定（資格情報、webhook、DM/group policy、team/channelごとのオーバーライド）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRCはextensionベースで、`channels.irc` 配下で設定します。

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

- ここで扱うコアキーパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 任意の `channels.irc.defaultAccount` は、設定済みアカウントidと一致する場合、デフォルトアカウント選択を上書きします。
- 完全なIRC channel設定（host/port/TLS/channels/allowlist/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### マルチアカウント（全channel共通）

channelごとに複数アカウント（それぞれ独自の `accountId`）を実行します:

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

- `accountId` が省略された場合、`default` が使われます（CLI + routing）。
- Env tokenは **default** アカウントにのみ適用されます。
- ベースchannel設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを異なるagentへルーティングするには `bindings[].match.accountId` を使用します。
- 単一アカウントの最上位channel configのまま `openclaw channels add`（またはchannel onboarding）で非defaultアカウントを追加すると、OpenClawは最初にアカウントスコープの最上位単一アカウント値をそのchannel account mapへ昇格し、元のアカウントが引き続き動作するようにします。ほとんどのchannelではこれらを `channels.<channel>.accounts.default` へ移動しますが、Matrixは既存の一致するnamed/default targetを保持できます。
- 既存のchannel専用binding（`accountId` なし）は引き続きdefaultアカウントに一致します。accountスコープbindingは引き続き任意です。
- `openclaw doctor --fix` も、アカウントスコープの最上位単一アカウント値をそのchannelで選ばれた昇格先アカウントへ移動することで混在形状を修復します。ほとんどのchannelは `accounts.default` を使用し、Matrixは既存の一致するnamed/default targetを保持できます。

### その他のextension channel

多くのextension channelは `channels.<id>` として設定され、専用のchannelページに記載されています（たとえば Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なchannel索引: [Channels](/ja-JP/channels)。

### グループチャットmention gating

グループメッセージはデフォルトで **mention必須** です（メタデータmentionまたは安全なregex pattern）。WhatsApp、Telegram、Discord、Google Chat、iMessageのグループチャットに適用されます。

**Mentionの種類:**

- **Metadata mentions**: ネイティブプラットフォームの @-mention。WhatsApp self-chat modeでは無視されます。
- **Text patterns**: `agents.list[].groupChat.mentionPatterns` 内の安全なregex pattern。無効なpatternや安全でない入れ子反復は無視されます。
- Mention gatingは、検出が可能な場合（ネイティブmentionまたは少なくとも1つのpatternがある場合）にのみ適用されます。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。channel側で `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効化するには `0` を設定します。

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

解決順序: DMごとのオーバーライド → providerデフォルト → 上限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### Self-chat mode

自分自身の番号を `allowFrom` に含めるとself-chat modeが有効になります（ネイティブ @-mentionを無視し、text patternにのみ応答）:

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
    nativeSkills: "auto", // サポートされる場合はネイティブskillコマンドを登録
    text: true, // チャットメッセージ内の /commands を解析
    bash: false, // ! を許可（alias: /bash）
    bashForegroundMs: 2000,
    config: false, // /config を許可
    mcp: false, // /mcp を許可
    plugins: false, // /plugins を許可
    debug: false, // /debug を許可
    restart: true, // /restart + gateway restart tool を許可
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンド詳細">

- このブロックはコマンド面を設定します。現在の組み込み + bundledコマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands) を参照してください。
- このページは **config-keyリファレンス** であり、完全なコマンドカタログではありません。QQ Botの `/bot-ping` `/bot-help` `/bot-logs`、LINEの `/card`、device-pairの `/pair`、memoryの `/dreaming`、phone-controlの `/phone`、Talkの `/voice` など、channel/plugin所有のコマンドは各channel/pluginページと [Slash Commands](/ja-JP/tools/slash-commands) に記載されています。
- Text commandは先頭に `/` が付いた **単独メッセージ** でなければなりません。
- `native: "auto"` はDiscord/Telegramではネイティブコマンドを有効にし、Slackではオフのままにします。
- `nativeSkills: "auto"` はDiscord/Telegramではネイティブskillコマンドを有効にし、Slackではオフのままにします。
- channelごとの上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドを解除します。
- `channels.<provider>.commands.nativeSkills` でネイティブskill登録をchannelごとに上書きできます。
- `channels.telegram.customCommands` は追加のTelegram bot menuエントリーを加えます。
- `bash: true` はホストshell用の `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれている必要があります。
- `config: true` は `/config` を有効にします（`openclaw.json` の読み書き）。gateway `chat.send` clientでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の書き込みスコープoperator clientでも引き続き利用できます。
- `mcp: true` は、`mcp.servers` 配下のOpenClaw管理MCP server設定に対する `/mcp` を有効にします。
- `plugins: true` は、plugin検出、インストール、有効/無効制御の `/plugins` を有効にします。
- `channels.<provider>.configWrites` はchannelごとのconfig変更を制御します（デフォルト: true）。
- マルチアカウントchannelでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` とgateway restart tool actionを無効化します。デフォルト: `true`。
- `ownerAllowFrom` はowner専用コマンド/tool用の明示的なowner allowlistです。`allowFrom` とは別です。
- `ownerDisplay: "hash"` はsystem prompt内のowner idをハッシュ化します。ハッシュ制御には `ownerDisplaySecret` を設定してください。
- `allowFrom` はproviderごとです。設定されると、これが **唯一の** 認可ソースとなります（channel allowlist/pairing と `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていないときにコマンドがaccess-groupポリシーをバイパスできるようにします。
- コマンドドキュメント対応表:
  - 組み込み + bundledカタログ: [Slash Commands](/ja-JP/tools/slash-commands)
  - channel固有のコマンド面: [Channels](/ja-JP/channels)
  - QQ Botコマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - pairingコマンド: [Pairing](/ja-JP/channels/pairing)
  - LINE cardコマンド: [LINE](/ja-JP/channels/line)
  - memory dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## Agent defaults

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

system promptのRuntime行に表示される任意のrepository rootです。未設定の場合、OpenClawはworkspaceから上方向へたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないagent向けの任意のデフォルトskill allowlistです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weatherを継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換え
      { id: "locked-down", skills: [] }, // skillなし
    ],
  },
}
```

- デフォルトで制限なしのSkillsにするには `agents.defaults.skills` を省略します。
- デフォルト値を継承するには `agents.list[].skills` を省略します。
- skillなしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` 一覧は、そのagentの最終セットです。デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrapファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効化します。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrapファイルがsystem promptに注入されるタイミングを制御します。デフォルトは `"always"` です。

- `"continuation-skip"`: 安全な継続ターン（assistantの応答完了後）ではworkspace bootstrapの再注入をスキップし、promptサイズを削減します。heartbeat実行やcompaction後の再試行では引き続きcontextを再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前のworkspace bootstrapファイルごとの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

全workspace bootstrapファイルにまたがって注入される総最大文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap contextが切り詰められたときにagentへ見える警告文を制御します。
デフォルト: `"once"`。

- `"off"`: 警告文をsystem promptへ一切注入しません。
- `"once"`: 一意の切り詰め署名ごとに1回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めが存在するたびに毎回警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

provider呼び出し前にtranscript/tool image blockで長辺に許可される最大ピクセルサイズ。
デフォルト: `1200`。

低い値は通常、vision token使用量とrequest payloadサイズを削減します。
高い値はより多くの視覚的詳細を保持します。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

system prompt context用のtimezoneです（メッセージtimestampではありません）。ホストtimezoneにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt内の時刻形式。デフォルト: `auto`（OS設定）。

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
      params: { cacheRetention: "long" }, // グローバルデフォルトprovider params
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 文字列形式はprimary modelのみを設定します。
  - オブジェクト形式はprimaryに加えて順序付きfailover modelを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `image` tool pathがvision-model設定として使用します。
  - 選択済み/デフォルトmodelがimage入力を受け付けられない場合のフォールバックroutingにも使用されます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共有image-generation capabilityと、将来のimage生成tool/plugin面で使用されます。
  - 一般的な値: Geminiネイティブimage生成には `google/gemini-3.1-flash-image-preview`、falには `fal/fal-ai/flux/dev`、OpenAI Imagesには `openai/gpt-image-1`。
  - provider/modelを直接選択する場合は、対応するprovider auth/API keyも設定してください（たとえば `google/*` なら `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` なら `OPENAI_API_KEY`、`fal/*` なら `FAL_KEY`）。
  - 省略した場合でも、`image_generate` はauth付きproviderデフォルトを推測できます。まず現在のデフォルトproviderを試し、その後残りの登録済みimage-generation providerをprovider-id順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共有music-generation capabilityと組み込み `music_generate` toolで使用されます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.5+`。
  - 省略した場合でも、`music_generate` はauth付きproviderデフォルトを推測できます。まず現在のデフォルトproviderを試し、その後残りの登録済みmusic-generation providerをprovider-id順に試します。
  - provider/modelを直接選択する場合は、対応するprovider auth/API keyも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - 共有video-generation capabilityと組み込み `video_generate` toolで使用されます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` はauth付きproviderデフォルトを推測できます。まず現在のデフォルトproviderを試し、その後残りの登録済みvideo-generation providerをprovider-id順に試します。
  - provider/modelを直接選択する場合は、対応するprovider auth/API keyも設定してください。
  - bundledのQwen video-generation providerは、最大1本の出力video、1枚の入力image、4本の入力video、10秒のduration、およびproviderレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）のいずれかを受け付けます。
  - `pdf` toolのmodel routingに使用されます。
  - 省略時、PDF toolは `imageModel` にフォールバックし、その後解決済みsession/default modelへフォールバックします。
- `pdfMaxBytesMb`: `pdf` toolで呼び出し時に `maxBytesMb` が渡されない場合のデフォルトPDFサイズ上限。
- `pdfMaxPages`: `pdf` toolの抽出フォールバックモードで考慮されるデフォルト最大ページ数。
- `verboseDefault`: agentのデフォルトverboseレベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: agentのデフォルトelevated-outputレベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: `openai/gpt-5.4`）。providerを省略すると、OpenClawはまずaliasを試し、次にその正確なmodel idに一致する一意のconfigured-provider matchを試し、その後でのみ設定済みデフォルトproviderへフォールバックします（レガシー互換動作のため非推奨なので、明示的な `provider/model` を推奨）。そのproviderが設定済みデフォルトmodelを提供しなくなった場合、OpenClawは古い削除済みproviderデフォルトを表示する代わりに、最初の設定済みprovider/modelへフォールバックします。
- `models`: 設定されたmodel catalogおよび `/model` 用allowlistです。各エントリーには `alias`（短縮名）と `params`（provider固有、たとえば `temperature`、`maxTokens`、`cacheRetention`、`context1m`）を含められます。
- `params`: すべてのmodelに適用されるグローバルデフォルトprovider parameterです。`agents.defaults.params` で設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（config）: `agents.defaults.params`（グローバルベース）は `agents.defaults.models["provider/model"].params`（modelごと）で上書きされ、その後 `agents.list[].params`（一致するagent id）がキーごとに上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- これらのフィールドを変更するconfig writer（たとえば `/models set`、`/models set-image`、fallback add/remove command）は、可能な限り既存fallback listを保持しつつ正規のobject formで保存します。
- `maxConcurrent`: sessionをまたいだ並列agent実行の最大数（各session自体は引き続き直列化されます）。デフォルト: 4。

**組み込みalias短縮形**（modelが `agents.defaults.models` にある場合のみ適用）:

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

設定したaliasは常にデフォルトより優先されます。

Z.AI GLM-4.x modelでは、`--thinking off` を設定するか `agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的にthinking modeが有効になります。
Z.AI modelではtool call streaming向けにデフォルトで `tool_stream` が有効です。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 modelでは、明示的なthinking levelが設定されていない場合、デフォルトで `adaptive` thinkingになります。

### `agents.defaults.cliBackends`

text-onlyフォールバック実行（tool callなし）向けの任意のCLI backendです。API providerが失敗したときのバックアップとして便利です。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backendはtext-firstです。toolは常に無効です。
- `sessionArg` が設定されていればsessionをサポートします。
- `imageArg` がfile pathを受け付ける場合、image pass-throughをサポートします。

### `agents.defaults.systemPromptOverride`

OpenClawが組み立てたsystem prompt全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはagentごと（`agents.list[].systemPromptOverride`）で設定します。agentごとの値が優先され、空または空白のみの値は無視されます。制御されたprompt実験に便利です。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

定期heartbeat実行です。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false でsystem promptからHeartbeatセクションを省略
        lightContext: false, // default: false; true でworkspace bootstrap fileからHEARTBEAT.mdのみ保持
        isolatedSession: false, // default: false; true で各heartbeatを新しいsessionで実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: duration文字列（ms/s/m/h）。デフォルト: `30m`（API-key認証）または `1h`（OAuth認証）。無効化するには `0m` を設定します。
- `includeSystemPromptSection`: false の場合、system promptからHeartbeatセクションを省略し、bootstrap contextへの `HEARTBEAT.md` 注入もスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、heartbeat実行中のtool error warning payloadを抑制します。
- `directPolicy`: direct/DM配信ポリシー。`allow`（デフォルト）はdirect-target配信を許可します。`block` はdirect-target配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、heartbeat実行は軽量bootstrap contextを使用し、workspace bootstrap fileから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各heartbeatは以前の会話履歴を持たない新しいsessionで実行されます。cronの `sessionTarget: "isolated"` と同じ分離パターンです。heartbeatごとのtokenコストを約100Kから約2-5K tokenへ削減します。
- agentごと: `agents.list[].heartbeat` を設定します。いずれかのagentが `heartbeat` を定義すると、heartbeatを実行するのは **それらのagentのみ** になります。
- Heartbeatは完全なagent turnを実行します — 短い間隔ほど多くのtokenを消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済みcompaction provider pluginのid（任意）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=customで使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // 任意のcompaction専用modelオーバーライド
        notifyUser: true, // compaction開始時に短い通知を送る（デフォルト: false）
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` または `safeguard`（長い履歴向けのchunked summarization）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済みcompaction provider pluginのid。設定すると、組み込みLLM summarizationの代わりにそのproviderの `summarize()` が呼ばれます。失敗時は組み込みへフォールバックします。providerを設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClawが中止するまでの単一compaction操作の最大秒数。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` はcompaction summarization時に組み込みのopaque identifier保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使う任意のカスタムidentifier保持文。
- `postCompactionSections`: compaction後に再注入する任意のAGENTS.md H2/H3セクション名。デフォルトは `["Session Startup", "Red Lines"]`。無効化するには `[]` を設定します。未設定、またはそのデフォルト組が明示設定されている場合、古い `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け付けます。
- `model`: compaction summarization専用の任意の `provider/model-id` オーバーライド。メインsessionはあるmodelを維持しつつ、compaction summaryだけ別modelで実行したい場合に使います。未設定時はcompactionはsessionのprimary modelを使用します。
- `notifyUser`: `true` の場合、compaction開始時にユーザーへ短い通知（例: 「Compacting context...」）を送信します。compactionを静かに保つため、デフォルトでは無効です。
- `memoryFlush`: 自動compaction前に永続memoryを保存するためのサイレントagentic turn。workspaceがread-onlyの場合はスキップされます。

### `agents.defaults.contextPruning`

LLMへ送信する前に、メモリ内contextから **古いtool result** を剪定します。ディスク上のsession historyは変更しません。

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
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl modeの動作">

- `mode: "cache-ttl"` でpruning passが有効になります。
- `ttl` は、最後のcache touch後に再びpruningを実行できるまでの頻度を制御します。
- Pruningは、必要に応じてまず大きすぎるtool resultをsoft-trimし、その後より古いtool resultをhard-clearします。

**Soft-trim** は先頭と末尾を保持し、中央に `...` を挿入します。

**Hard-clear** はtool result全体をplaceholderで置き換えます。

注記:

- Image blockは切り詰め/クリアされません。
- 比率はtoken数ではなく文字数ベース（概算）です。
- `keepLastAssistants` 未満のassistant messageしか存在しない場合、pruningはスキップされます。

</Accordion>

動作の詳細は [Session Pruning](/ja-JP/concepts/session-pruning) を参照してください。

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMsを使用)
    },
  },
}
```

- Telegram以外のchannelでは、block replyを有効にするには明示的な `*.blockStreaming: true` が必要です。
- Channelごとのオーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとの変種）。Signal/Slack/Discord/Google Chatのデフォルトは `minChars: 1500` です。
- `humanDelay`: block reply間のランダムな待機。`natural` = 800–2500ms。agentごとのオーバーライド: `agents.list[].humanDelay`。

動作とchunkingの詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

### Typing indicators

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

- デフォルト: direct chat/mentionでは `instant`、mentionされていないgroup chatでは `message`。
- Sessionごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みagent向けの任意のsandbox化です。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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

<Accordion title="Sandbox詳細">

**Backend:**

- `docker`: ローカルDocker runtime（デフォルト）
- `ssh`: 汎用SSHベースのremote runtime
- `openshell`: OpenShell runtime

`backend: "openshell"` を選択した場合、runtime固有設定は
`plugins.entries.openshell.config` へ移動します。

**SSH backend設定:**

- `target`: `user@host[:port]` 形式のSSH target
- `command`: SSH client command（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのworkspaceに使用する絶対remote root
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSHへ渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClawがruntime時に一時ファイルへ実体化するインライン内容またはSecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSHのhost-key policyノブ

**SSH認証の優先順位:**

- `identityData` が `identityFile` に優先
- `certificateData` が `certificateFile` に優先
- `knownHostsData` が `knownHostsFile` に優先
- SecretRefベースの `*Data` 値は、sandbox session開始前にアクティブsecrets runtime snapshotから解決されます

**SSH backendの動作:**

- 作成または再作成後にremote workspaceを1回seedする
- その後はremote SSH workspaceを正本として維持する
- `exec`、file tool、media pathをSSH経由でルーティングする
- remote変更を自動でホストへ同期しない
- sandbox browser containerをサポートしない

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのsandbox workspace
- `ro`: sandbox workspaceは `/workspace`、agent workspaceは読み取り専用で `/agent` にmount
- `rw`: agent workspaceを読み書き可能で `/workspace` にmount

**Scope:**

- `session`: sessionごとのcontainer + workspace
- `agent`: agentごとに1つのcontainer + workspace（デフォルト）
- `shared`: 共有containerおよびworkspace（session間分離なし）

**OpenShell plugin設定:**

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell mode:**

- `mirror`: exec前にlocalからremoteへseedし、exec後に同期し戻す。local workspaceが正本のままになります
- `remote`: sandbox作成時に1度だけremoteへseedし、その後はremote workspaceを正本として維持します

`remote` modeでは、OpenClaw外で行われたホストローカル編集は、seedステップ後にsandboxへ自動同期されません。
転送はOpenShell sandboxへのSSHですが、sandboxのライフサイクルと任意のmirror syncはpluginが所有します。

**`setupCommand`** はcontainer作成後に1回だけ実行されます（`sh -lc` 経由）。network egress、書き込み可能root、root userが必要です。

**Containerのデフォルトは `network: "none"`** です — agentに送信アクセスが必要なら `"bridge"`（またはカスタムbridge network）に設定してください。
`"host"` はブロックされます。`"container:<id>"` もデフォルトでブロックされますが、
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を明示設定した場合のみ許可されます（緊急避難用）。

**受信attachment** はアクティブworkspace内の `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のhost directoryをmountします。グローバルとagentごとのbindはマージされます。

**Sandboxed browser**（`sandbox.browser.enabled`）: container内のChromium + CDP。noVNC URLがsystem promptに注入されます。`openclaw.json` で `browser.enabled` を必要としません。
noVNC observer accessはデフォルトでVNC認証を使用し、OpenClawは共有URLにpasswordを露出する代わりに短命token URLを発行します。

- `allowHostControl: false`（デフォルト）は、sandboxed sessionがhost browserを対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用bridge network）です。グローバルbridge接続が明示的に必要な場合にのみ `bridge` に設定してください。
- `cdpSourceRange` は、container境界でCDP ingressをCIDR範囲（例: `172.21.0.1/32`）へ任意に制限します。
- `sandbox.browser.binds` は追加のhost directoryをsandbox browser containerのみにmountします。設定された場合（`[]` を含む）、browser containerでは `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、container host向けに調整されています:
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
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` は
    デフォルトで有効であり、WebGL/3D利用に必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、workflowがextensionに依存する場合に
    extensionを再有効化します。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromiumの
    デフォルトprocess上限を使うには `0` を設定してください。
  - 加えて、`noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
  - デフォルトはcontainer imageのベースラインです。containerデフォルトを変更するには、
    カスタムentrypointを持つ独自browser imageを使用してください。

</Accordion>

browser sandboxingと `sandbox.docker.binds` はDocker専用です。

imageのビルド:

```bash
scripts/sandbox-setup.sh           # メインsandbox image
scripts/sandbox-browser-setup.sh   # 任意のbrowser image
```

### `agents.list`（agentごとのオーバーライド）

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
        thinkingDefault: "high", // agentごとのthinking levelオーバーライド
        reasoningDefault: "on", // agentごとのreasoning visibilityオーバーライド
        fastModeDefault: false, // agentごとのfast modeオーバーライド
        params: { cacheRetention: "none" }, // 一致するdefaults.models paramsをキーごとに上書き
        skills: ["docs-search"], // 設定時はagents.defaults.skillsを置き換え
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

- `id`: 安定したagent id（必須）。
- `default`: 複数設定されている場合は最初が勝ちます（警告を記録）。どれも設定されていない場合、最初のlist entryがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、object形式 `{ primary, fallbacks }` は両方を上書きします（`[]` でグローバルfallbackを無効化）。`primary` だけを上書きするcron jobは、`fallbacks: []` を設定しない限りデフォルトfallbackを継承します。
- `params`: 選択されたmodel entryに対して `agents.defaults.models` の上にマージされるagentごとのstream params。`cacheRetention`、`temperature`、`maxTokens` などagent固有の上書きに使用し、model catalog全体の複製を避けます。
- `skills`: 任意のagentごとのskill allowlist。省略時、そのagentは設定されていれば `agents.defaults.skills` を継承します。明示listはデフォルトとマージせず置き換え、`[]` はskillなしを意味します。
- `thinkingDefault`: 任意のagentごとのデフォルトthinking level（`off | minimal | low | medium | high | xhigh | adaptive`）。message単位またはsession単位の上書きが未設定のとき、このagentに対して `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: 任意のagentごとのデフォルトreasoning visibility（`on | off | stream`）。message単位またはsession単位のreasoningオーバーライドが未設定のときに適用されます。
- `fastModeDefault`: 任意のagentごとのfast modeデフォルト（`true | false`）。message単位またはsession単位のfast-modeオーバーライドが未設定のときに適用されます。
- `runtime`: 任意のagentごとのruntime descriptor。agentがデフォルトでACP harness sessionを使うべき場合は、`type: "acp"` と `runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）を使用してください。
- `identity.avatar`: workspace相対path、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` 用agent id allowlist（`["*"]` = 任意。デフォルト: 同じagentのみ）。
- Sandbox継承ガード: 要求元sessionがsandbox化されている場合、`sessions_spawn` はsandbox化されないターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なprofile選択を強制。デフォルト: false）。

---

## マルチagent routing

1つのGateway内で複数の分離されたagentを実行します。[Multi-Agent](/ja-JP/concepts/multi-agent) を参照してください。

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

### Binding matchフィールド

- `type`（任意）: 通常のroutingには `route`（type未指定もroute扱い）、永続ACP会話bindingには `acp`
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。channel固有）
- `acp`（任意。`type: "acp"` のみ）: `{ mode, label, cwd, backend }`

**決定的なmatch順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（peer/guild/teamなしの完全一致）
5. `match.accountId: "*"`（channel全体）
6. デフォルトagent

各tier内では、最初に一致した `bindings` エントリーが勝ちます。

`type: "acp"` エントリーでは、OpenClawは正確な会話identity（`match.channel` + account + `match.peer.id`）で解決し、上記のroute binding tier順序は使用しません。

### Agentごとのaccess profile

<Accordion title="完全アクセス（sandboxなし）">

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

<Accordion title="読み取り専用tools + workspace">

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

## Session

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
    parentForkMaxTokens: 100000, // このtoken数を超える親thread forkはスキップ（0で無効）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration または false
      maxDiskBytes: "500mb", // 任意のハード予算
      highWaterBytes: "400mb", // 任意のcleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 非アクティブ時の自動unfocusデフォルト（時間単位、`0` で無効）
      maxAgeHours: 0, // ハード最大期間のデフォルト（時間単位、`0` で無効）
    },
    mainKey: "main", // レガシー（runtimeは常に "main" を使用）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Sessionフィールド詳細">

- **`scope`**: group-chat context向けの基本session grouping戦略。
  - `per-sender`（デフォルト）: channel context内で各senderごとに分離sessionを持ちます。
  - `global`: channel context内の全参加者が1つのsessionを共有します（共有contextが意図されている場合にのみ使用してください）。
- **`dmScope`**: DMのグルーピング方法。
  - `main`: すべてのDMがmain sessionを共有します。
  - `per-peer`: channelをまたいでsender idごとに分離します。
  - `per-channel-peer`: channel + senderごとに分離します（複数ユーザーinboxに推奨）。
  - `per-account-channel-peer`: account + channel + senderごとに分離します（マルチアカウントに推奨）。
- **`identityLinks`**: channel間session共有のため、provider prefix付きpeerへ正規idをマップします。
- **`reset`**: 主要resetポリシー。`daily` はローカル時刻の `atHour` にresetし、`idle` は `idleMinutes` 後にresetします。両方が設定されている場合、先に期限切れになる方が優先されます。
- **`resetByType`**: typeごとのオーバーライド（`direct`、`group`、`thread`）。レガシー `dm` は `direct` のaliasとして受け付けます。
- **`parentForkMaxTokens`**: forked thread session作成時に許可する親session `totalTokens` の最大値（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClawは親transcript historyを継承せず、新しいthread sessionを開始します。
  - このガードを無効化し、常に親forkを許可するには `0` を設定します。
- **`mainKey`**: レガシーフィールド。runtimeはmain direct-chat bucketに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: agent間やり取り中の応答往復回数の最大値（整数、範囲: `0`–`5`）。`0` はping-pong連鎖を無効化します。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`。レガシー `dm` aliasあり）、`keyPrefix`、または `rawKeyPrefix` でmatchします。最初のdenyが勝ちます。
- **`maintenance`**: session-storeのcleanup + retention制御。
  - `mode`: `warn` は警告のみ、`enforce` はcleanupを適用します。
  - `pruneAfter`: 古いentryの期限（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大entry数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたときにローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archiveの保持期間。デフォルトは `pruneAfter`。無効にするには `false` を設定します。
  - `maxDiskBytes`: 任意のsessions directoryディスク予算。`warn` modeでは警告を記録し、`enforce` modeでは最も古いartifact/sessionから削除します。
  - `highWaterBytes`: 予算cleanup後の任意target。デフォルトは `maxDiskBytes` の `80%`。
- **`threadBindings`**: thread-bound session機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ（provider側で上書き可能。Discordは `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動unfocusデフォルト（時間単位。`0` で無効。provider側で上書き可能）
  - `maxAgeHours`: ハード最大期間デフォルト（時間単位。`0` で無効。provider側で上書き可能）

</Accordion>

---

## Messages

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

channel/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順（最も具体的なものが勝つ）: account → channel → global。`""` は無効化し、cascadeを止めます。`"auto"` は `[{identity.name}]` を導出します。

**Template変数:**

| Variable          | 説明                  | 例                          |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | 短いmodel名           | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なmodel識別子      | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider名            | `anthropic`                 |
| `{thinkingLevel}` | 現在のthinking level   | `high`, `low`, `off`        |
| `{identity.name}` | Agent identity名      | (`"auto"` と同じ)            |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` のaliasです。

### Ack reaction

- デフォルトはアクティブagentの `identity.emoji`、なければ `"👀"`。無効化するには `""` を設定します。
- Channelごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順: account → channel → `messages.ackReaction` → identity fallback。
- Scope: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegramでreply後にackを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegramでライフサイクルstatus reactionを有効にします。
  SlackとDiscordでは、未設定の場合、ack reactionが有効ならstatus reactionも有効のままです。
  Telegramでは、ライフサイクルstatus reactionを有効にするには明示的に `true` を設定してください。

### Inbound debounce

同じsenderからの高速なtext-only messageを1つのagent turnにまとめます。media/attachmentは即時flushされます。control commandはdebouncingをバイパスします。

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

- `auto` はデフォルトの自動TTS modeを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は有効状態を表示します。
- `summaryModel` は自動summary用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` はデフォルトで `false`（opt-in）です。
- API keyのフォールバックは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` です。
- `openai.baseUrl` はOpenAI TTS endpointを上書きします。解決順はconfig、次に `OPENAI_TTS_BASE_URL`、最後に `https://api.openai.com/v1` です。
- `openai.baseUrl` がOpenAI以外のendpointを指す場合、OpenClawはそれをOpenAI互換TTS serverとして扱い、model/voice validationを緩和します。

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

- `talk.provider` は、複数のTalk providerが設定されている場合、`talk.providers` 内のキーと一致している必要があります。
- レガシーなフラットTalkキー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用であり、自動的に `talk.providers.<provider>` へ移行されます。
- Voice IDは `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` は平文文字列またはSecretRefオブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API keyが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk directiveでフレンドリー名を使用できます。
- `silenceTimeoutMs` は、Talk modeがユーザーの無音後どれだけ待ってからtranscriptを送信するかを制御します。未設定時はプラットフォーム既定の待機時間が維持されます（`macOSとAndroidでは700 ms、iOSでは900 ms`）。

---

## Tools

### Tool profile

`tools.profile` は `tools.allow`/`tools.deny` より前に基本allowlistを設定します:

ローカルonboardingでは、未設定の新しいローカルconfigに対してデフォルトで `tools.profile: "coding"` を設定します（既存の明示profileは保持されます）。

| Profile     | 含まれるもの                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                     |
| `full`      | 制限なし（未設定と同じ）                                                                                                      |

### Tool group

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` のaliasとして受け付けられます）                                  |
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
| `group:openclaw`   | すべての組み込みtool（provider pluginを除く）                                                                           |

### `tools.allow` / `tools.deny`

グローバルtool allow/deny policy（denyが優先）。大文字小文字を区別せず、`*` wildcardをサポートします。Docker sandboxがオフでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のproviderまたはmodelに対してtoolをさらに制限します。順序: base profile → provider profile → allow/deny。

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

sandbox外のelevated execアクセスを制御します:

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

- agentごとのオーバーライド（`agents.list[].tools.elevated`）はさらに制限することしかできません。
- `/elevated on|off|ask|full` は状態をsessionごとに保存します。インラインdirectiveは単一messageに適用されます。
- Elevated `exec` はsandboxをバイパスし、設定されたescape path（デフォルトは `gateway`、exec targetが `node` の場合は `node`）を使います。

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

tool-loop安全性チェックは **デフォルトで無効** です。有効にするには `enabled: true` を設定します。
設定はグローバルの `tools.loopDetection` で定義でき、agentごとに `agents.list[].tools.loopDetection` で上書きできます。

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

- `historySize`: loop分析用に保持する最大tool-call history数。
- `warningThreshold`: 警告用の繰り返し無進捗pattern閾値。
- `criticalThreshold`: 重大なloopをブロックするためのより高い繰り返し閾値。
- `globalCircuitBreakerThreshold`: 任意の無進捗実行に対するハード停止閾値。
- `detectors.genericRepeat`: 同じtool/同じargs呼び出しの繰り返しに警告します。
- `detectors.knownPollNoProgress`: 既知のpoll tool（`process.poll`、`command_status` など）に対する無進捗に警告/ブロックします。
- `detectors.pingPong`: 交互に発生する無進捗ペアpatternに警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、validationは失敗します。

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
        provider: "firecrawl", // 任意。自動検出するなら省略
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

受信media理解（image/audio/video）を設定します:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: 完了したasync music/videoを直接channelへ送信
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

<Accordion title="Media model entryフィールド">

**Provider entry**（`type: "provider"` または省略時）:

- `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: model idオーバーライド
- `profile` / `preferredProfile`: `auth-profiles.json` profile選択

**CLI entry**（`type: "cli"`）:

- `command`: 実行するexecutable
- `args`: template化されたargs（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: 任意の一覧（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: entryごとのオーバーライド。
- 失敗時は次のentryへフォールバックします。

Provider authは標準順序に従います: `auth-profiles.json` → env vars → `models.providers.*.apiKey`。

**Async completionフィールド:**

- `asyncCompletion.directSend`: `true` の場合、完了したasync `music_generate`
  および `video_generate` タスクは、まずdirect channel配信を試みます。デフォルト: `false`
  （レガシーのrequester-session wake/model-delivery path）。

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

session tool（`sessions_list`、`sessions_history`、`sessions_send`）でターゲットにできるsessionを制御します。

デフォルト: `tree`（現在のsession + そこからspawnされたsession。subagentなど）。

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

注記:

- `self`: 現在のsession keyのみ。
- `tree`: 現在のsession + 現在のsessionからspawnされたsession（subagent）。
- `agent`: 現在のagent idに属する任意のsession（同じagent idの下でper-sender sessionを実行している場合、他ユーザーを含むことがあります）。
- `all`: 任意のsession。cross-agent targetingには依然として `tools.agentToAgent` が必要です。
- Sandbox clamp: 現在のsessionがsandbox化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であっても可視性は `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインラインattachmentサポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: インラインfile attachmentを許可するには true
        maxTotalBytes: 5242880, // 全file合計 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // fileごと 1 MB
        retainOnSessionKeep: false, // cleanup="keep" のときattachmentを保持
      },
    },
  },
}
```

注記:

- Attachmentは `runtime: "subagent"` でのみサポートされます。ACP runtimeでは拒否されます。
- Fileは子workspaceの `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- Attachment内容はtranscript永続化から自動的にredactされます。
- Base64入力は、厳格なalphabet/paddingチェックとdecode前サイズガードで検証されます。
- File permissionはdirectoryに `0700`、fileに `0600` です。
- Cleanupは `cleanup` policyに従います: `delete` は常にattachmentを削除し、`keep` は `retainOnSessionKeep: true` の場合にのみ保持します。

### `tools.experimental`

実験的な組み込みtoolフラグです。runtime固有の自動有効化ルールが適用されない限り、デフォルトはオフです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 実験的な update_plan を有効化
    },
  },
}
```

注記:

- `planTool`: 構造化された `update_plan` toolを有効にし、単純でない複数ステップ作業の追跡に使用します。
- デフォルト: OpenAI以外のproviderでは `false`。OpenAIおよびOpenAI Codex実行では未設定時に自動有効化されます。自動有効化を無効にするには `false` を設定してください。
- 有効時、system promptにも利用ガイダンスが追加され、modelがこれを実質的な作業にのみ使い、`in_progress` のステップを最大1つに保つようにします。

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

- `model`: spawnされるsub-agent用のデフォルトmodel。省略時、sub-agentは呼び出し元のmodelを継承します。
- `allowAgents`: 要求元agentが独自の `subagents.allowAgents` を設定していない場合の `sessions_spawn` ターゲットagent idデフォルトallowlist（`["*"]` = 任意。デフォルト: 同じagentのみ）。
- `runTimeoutSeconds`: tool callで `runTimeoutSeconds` を省略した場合の `sessions_spawn` デフォルトtimeout（秒）。`0` はtimeoutなしを意味します。
- subagentごとのtool policy: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムproviderとbase URL

OpenClawは組み込みmodel catalogを使用します。カスタムproviderはconfig内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加してください。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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
- Agent config rootは `OPENCLAW_AGENT_DIR`（またはレガシー環境変数aliasの `PI_CODING_AGENT_DIR`）で上書きできます。
- 一致するprovider IDに対するマージ優先順位:
  - 空でないagent `models.json` の `baseUrl` 値が優先されます。
  - 空でないagent `apiKey` 値は、そのproviderが現在のconfig/auth-profile contextでSecretRef管理されていない場合にのみ優先されます。
  - SecretRef管理されたprovider `apiKey` 値は、解決済みsecretを永続化する代わりに、source marker（env refなら `ENV_VAR_NAME`、file/exec refなら `secretref-managed`）から更新されます。
  - SecretRef管理されたprovider header値は、source marker（env refなら `secretref-env:ENV_VAR_NAME`、file/exec refなら `secretref-managed`）から更新されます。
  - agentの `apiKey`/`baseUrl` が空または欠落している場合は、config内の `models.providers` にフォールバックします。
  - 一致するmodelの `contextWindow`/`maxTokens` には、明示config値と暗黙catalog値の高い方が使われます。
  - 一致するmodelの `contextTokens` は、明示的なruntime capが存在する場合はそれを保持します。ネイティブmodel metadataを変更せずに有効contextを制限したい場合に使用してください。
  - configで `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使ってください。
  - Marker永続化はsource-authoritativeです: markerは解決済みruntime secret値からではなく、アクティブなsource config snapshot（解決前）から書き込まれます。

### Providerフィールド詳細

- `models.mode`: provider catalogの動作（`merge` または `replace`）。
- `models.providers`: provider idをキーとするカスタムprovider map。
- `models.providers.*.api`: request adapter（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: provider資格情報（SecretRef/env substitution推奨）。
- `models.providers.*.auth`: 認証戦略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用に `options.num_ctx` をrequestへ注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に資格情報を `Authorization` headerで送るよう強制します。
- `models.providers.*.baseUrl`: 上流API base URL。
- `models.providers.*.headers`: proxy/tenant routing用の追加静的header。
- `models.providers.*.request`: model-provider HTTP request用の転送オーバーライド。
  - `request.headers`: 追加header（providerデフォルトとマージ）。値はSecretRefを受け付けます。
  - `request.auth`: 認証戦略オーバーライド。モード: `"provider-default"`（provider組み込み認証を使用）、`"authorization-bearer"`（`token` とともに使用）、`"header"`（`headerName`、`value`、任意の `prefix` とともに使用）。
  - `request.proxy`: HTTP proxyオーバーライド。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` env varsを使用）、`"explicit-proxy"`（`url` とともに使用）。両モードとも任意の `tls` サブオブジェクトを受け付けます。
  - `request.tls`: direct connection用TLSオーバーライド。フィールド: `ca`、`cert`、`key`、`passphrase`（いずれもSecretRefを受け付けます）、`serverName`、`insecureSkipVerify`。
- `models.providers.*.models`: 明示的なprovider model catalog entry。
- `models.providers.*.models.*.contextWindow`: ネイティブmodel context window metadata。
- `models.providers.*.models.*.contextTokens`: 任意のruntime context cap。modelのネイティブ `contextWindow` より小さい有効context budgetを使いたい場合に使用してください。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。`api: "openai-completions"` かつ空でない非ネイティブ `baseUrl`（hostが `api.openai.com` ではない）の場合、OpenClawはruntime時にこれを `false` に強制します。空または省略された `baseUrl` ではデフォルトのOpenAI動作が維持されます。
- `models.providers.*.models.*.compat.requiresStringContent`: string-onlyのOpenAI互換chat endpoint向けの任意互換性ヒント。`true` の場合、OpenClawは純粋なtext `messages[].content` 配列をrequest送信前に単純文字列へ平坦化します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock auto-discovery設定ルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙discoveryのオン/オフ。
- `plugins.entries.amazon-bedrock.config.discovery.region`: discovery用のAWS region。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象discovery用の任意provider-id filter。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: discovery refreshのpolling interval。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 発見されたmodel用のフォールバックcontext window。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 発見されたmodel用のフォールバック最大出力token数。

### Provider例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

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

Cerebrasには `cerebras/zai-glm-4.7`、Z.AI directには `zai/glm-4.7` を使用してください。

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

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zen catalogには `opencode/...` ref、Go catalogには `opencode-go/...` refを使用します。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

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

`ZAI_API_KEY` を設定してください。`z.ai/*` と `z-ai/*` は受け付けられるaliasです。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般endpoint: `https://api.z.ai/api/paas/v4`
- Coding endpoint（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 一般endpointを使う場合は、base URLオーバーライド付きのカスタムproviderを定義してください。

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

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

China endpointには `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn` を使用してください。

ネイティブMoonshot endpointは、共有
`openai-completions` transport上でstreaming使用互換性を提示し、OpenClawは組み込みprovider id単独ではなく
そのendpoint capabilityに基づいて処理します。

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

Anthropic互換の組み込みproviderです。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic (Anthropic互換)">

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

Base URLには `/v1` を含めないでください（Anthropic clientが付加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

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
model catalogのデフォルトはM2.7のみです。
Anthropic互換streaming pathでは、OpenClawは明示的に `thinking` を設定しない限り
デフォルトでMiniMax thinkingを無効にします。`/fast on` または
`params.fastMode: true` は `MiniMax-M2.7` を
`MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカルmodel (LM Studio)">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 十分なハードウェア上でLM Studio Responses API経由の大規模ローカルmodelを実行し、フォールバック用にhosted modelはマージしたままにしてください。

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // または平文文字列
        env: { GEMINI_API