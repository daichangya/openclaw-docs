---
read_when:
    - フィールド単位で正確なconfigの意味やデフォルト値が必要
    - channel、model、Gateway、toolのconfigブロックを検証している
summary: すべてのOpenClaw configキー、デフォルト値、チャネル設定の完全リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-05T12:48:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb4c6de7955aa0c6afa2d20f12a0e3782b16ab2c1b6bf3ed0a8910be2f0a47d1
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json` で利用できるすべてのフィールドです。タスク指向の概要については [Configuration](/gateway/configuration) を参照してください。

config形式は**JSON5**です（コメントと末尾カンマを使用可能）。すべてのフィールドは任意で、省略時にはOpenClawが安全なデフォルト値を使用します。

---

## Channels

各channelは、そのconfigセクションが存在すれば自動的に開始されます（`enabled: false` を除く）。

### DMとgroupアクセス

すべてのchannelはDMポリシーとgroupポリシーをサポートします。

| DM policy           | 動作                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `pairing` (default) | 未知の送信者には1回限りのpairingコードが送られ、ownerが承認する必要があります |
| `allowlist`         | `allowFrom` 内の送信者のみを許可します（またはpair済みallowストア）          |
| `open`              | すべての受信DMを許可します（`allowFrom: ["*"]` が必要）                      |
| `disabled`          | すべての受信DMを無視します                                              |

| Group policy          | 動作                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `allowlist` (default) | 設定されたallowlistに一致するgroupのみを許可します                         |
| `open`                | group allowlistをバイパスします（mentionによるゲートは引き続き適用されます） |
| `disabled`            | すべてのgroup/roomメッセージをブロックします                               |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定のときのデフォルトを設定します。
pairingコードは1時間で期限切れになります。保留中のDM pairingリクエストは**channelごとに3件**までです。
プロバイダーブロック自体が存在しない場合（`channels.<provider>` がない場合）、ランタイムのgroup policyは起動時警告付きで `allowlist`（fail-closed）にフォールバックします。
</Note>

### Channel model overrides

`channels.modelByChannel` を使うと、特定のchannel IDをmodelに固定できます。値には `provider/model` または設定済みのmodel aliasを指定できます。このchannelマッピングは、セッションにすでにmodel overrideがない場合に適用されます（たとえば `/model` で設定された場合など）。

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

### Channel defaultsとheartbeat

プロバイダー間で共有するgroup-policyとheartbeat動作には `channels.defaults` を使います。

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

- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が未設定のときのフォールバックgroup policy。
- `channels.defaults.contextVisibility`: すべてのchannelに対する補助コンテキスト表示モードのデフォルト。値: `all`（デフォルト。引用/スレッド/履歴の全コンテキストを含む）、`allowlist`（allowlistに入っている送信者からのコンテキストのみ含む）、`allowlist_quote`（allowlistと同じですが、明示的な引用/返信コンテキストは保持）。channelごとの上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常なchannelステータスをheartbeat出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラーステータスをheartbeat出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター形式のheartbeat出力を描画します。

### WhatsApp

WhatsAppはGatewayのweb channel（Baileys Web）経由で動作します。リンク済みセッションが存在すると自動で開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks（self-chatモードではfalse）
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

<Accordion title="Multi-account WhatsApp">

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

- 送信コマンドでは、`default` アカウントが存在すればそれが使われ、なければ設定済みaccount idの先頭（ソート順）が使われます。
- 任意の `channels.whatsapp.defaultAccount` を使うと、設定済みaccount idに一致する場合にそのフォールバックのデフォルトアカウント選択を上書きできます。
- 従来の単一accountのBaileys authディレクトリは、`openclaw doctor` によって `whatsapp/default` へ移行されます。
- accountごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress（デフォルト: off。preview-editのレート制限を避けるため明示的にopt in）
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

- Bot token: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。symlinkは拒否）、デフォルトaccountには `TELEGRAM_BOT_TOKEN` をフォールバックとして使用できます。
- 任意の `channels.telegram.defaultAccount` を使うと、設定済みaccount idに一致する場合にデフォルトaccount選択を上書きできます。
- multi-account構成（2つ以上のaccount id）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠けているか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram起点のconfig書き込み（supergroup ID移行、`/config set|unset`）をブロックします。
- トップレベルの `bindings[]` エントリーで `type: "acp"` を使うと、forum topic用の永続ACP bindingを設定します（`match.peer.id` には canonicalな `chatId:topic:topicId` を使用）。フィールドの意味は [ACP Agents](/tools/acp-agents#channel-specific-settings) で共通です。
- Telegramのstream previewは `sendMessage` + `editMessageText` を使います（direct chatとgroup chatの両方で動作）。
- retryポリシー: [Retry policy](/concepts/retry) を参照してください。

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
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
      replyToMode: "off", // off | first | all
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
      streaming: "off", // off | partial | block | progress（progressはDiscord上でpartialにマップされます）
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
        spawnSubagentSessions: false, // `sessions_spawn({ thread: true })` 用のopt-in
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

- Token: `channels.discord.token`。デフォルトaccountには `DISCORD_BOT_TOKEN` をフォールバックとして使用できます。
- 明示的なDiscord `token` を与える直接送信呼び出しは、その呼び出しにそのtokenを使用します。accountのretry/ポリシー設定は、引き続きアクティブなランタイムスナップショットで選ばれたaccountから取得されます。
- 任意の `channels.discord.defaultAccount` を使うと、設定済みaccount idに一致する場合にデフォルトaccount選択を上書きできます。
- 配信先には `user:<id>`（DM）または `channel:<id>`（guild channel）を使ってください。数字だけのIDは拒否されます。
- Guild slugは小文字で、空白は `-` に置き換えられます。channel keyにはslug化した名前（`#` なし）を使います。guild IDを優先してください。
- Bot自身が書いたメッセージはデフォルトで無視されます。`allowBots: true` で有効化できます。`allowBots: "mentions"` を使うと、botをmentionしたbotメッセージのみ受け入れます（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびchannel override）は、他のユーザーやroleをmentionしていてbotをmentionしていないメッセージを破棄します（@everyone/@here は除く）。
- `maxLinesPerMessage`（デフォルト17）は、2000文字未満でも縦に長いメッセージを分割します。
- `channels.discord.threadBindings` はDiscordのthread-boundルーティングを制御します。
  - `enabled`: thread-bound session機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびbound delivery/routing）のDiscord override
  - `idleHours`: 非アクティブ時の自動unfocusのDiscord override（時間単位、`0` で無効）
  - `maxAgeHours`: ハードな最大寿命のDiscord override（時間単位、`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` の自動thread作成/binding用opt-inスイッチ
- トップレベルの `bindings[]` エントリーで `type: "acp"` を使うと、channelとthreadに対する永続ACP bindingを設定します（`match.peer.id` にchannel/thread idを使います）。フィールドの意味は [ACP Agents](/tools/acp-agents#channel-specific-settings) で共通です。
- `channels.discord.ui.components.accentColor` は、Discord components v2コンテナのアクセントカラーを設定します。
- `channels.discord.voice` はDiscord voice channel会話と、任意のauto-join + TTS overrideを有効にします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` のDAVEオプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClawは、繰り返されるdecrypt失敗の後にvoice sessionをleave/rejoinすることで、音声受信の回復も試みます。
- `channels.discord.streaming` が正規のstream modeキーです。従来の `streamMode` と真偽値の `streaming` は自動移行されます。
- `channels.discord.autoPresence` は、ランタイムの可用性をbot presenceへマップし（healthy => online、degraded => idle、exhausted => dnd）、任意のステータステキストoverrideも可能にします。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能なname/tagマッチングを再有効化します（break-glass互換モード）。
- `channels.discord.execApprovals`: Discordネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、承認者が `approvers` または `commands.ownerAllowFrom` から解決できるとexec承認が有効になります。
  - `approvers`: execリクエストを承認できるDiscord user ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: 任意のagent ID allowlist。省略するとすべてのagentの承認を転送します。
  - `sessionFilter`: 任意のsession keyパターン（部分文字列またはregex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者DMへ、`"channel"` は元のchannelへ、`"both"` は両方へ送信します。targetに `"channel"` が含まれる場合、ボタンは解決された承認者のみが使えます。
  - `cleanupAfterResolve`: `true` のとき、承認、拒否、タイムアウト後に承認DMを削除します。

**Reaction notificationモード:** `off`（なし）、`own`（botのメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（`guilds.<id>.users` に含まれるユーザーからの全メッセージ）。

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
- Service account SecretRefもサポートしています（`serviceAccountRef`）。
- envフォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信先には `spaces/<spaceId>` または `users/<userId>` を使います。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能なemail principalマッチングを再有効化します（break-glass互換モード）。

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
      replyToMode: "off", // off | first | all
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
      streaming: "partial", // off | partial | block | progress（previewモード）
      nativeStreaming: true, // streaming=partialのときSlackネイティブstreaming APIを使用
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

- **Socket mode** には `botToken` と `appToken` の両方が必要です（デフォルトaccountのenvフォールバックは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** には `botToken` と `signingSecret`（ルートまたはaccountごと）が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は平文文字列またはSecretRefオブジェクトを受け入れます。
- Slack accountスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP modeでは `signingSecretStatus` などの資格情報ごとのsource/statusフィールドを公開します。`configured_unavailable` は、そのaccountがSecretRef経由で設定されているが、現在のコマンド/ランタイム経路でsecret値を解決できなかったことを意味します。
- `configWrites: false` は、Slack起点のconfig書き込みをブロックします。
- 任意の `channels.slack.defaultAccount` を使うと、設定済みaccount idに一致する場合にデフォルトaccount選択を上書きできます。
- `channels.slack.streaming` が正規のstream modeキーです。従来の `streamMode` と真偽値の `streaming` は自動移行されます。
- 配信先には `user:<id>`（DM）または `channel:<id>` を使います。

**Reaction notificationモード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**Thread session分離:** `thread.historyScope` はthread単位（デフォルト）またはchannel共有です。`thread.inheritParent` は親channelのトランスクリプトを新しいthreadへコピーします。

- `typingReaction` は、返信処理中に受信Slackメッセージへ一時的なreactionを付け、完了時に削除します。Slack emoji shortcode（例: `"hourglass_flowing_sand"`）を使用してください。
- `channels.slack.execApprovals`: Slackネイティブのexec承認配信と承認者認可。スキーマはDiscordと同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack user ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| Action group | Default | 備考                     |
| ------------ | ------- | ------------------------ |
| reactions    | enabled | React + reaction一覧     |
| messages     | enabled | 読み取り/送信/編集/削除 |
| pins         | enabled | ピン留め/解除/一覧      |
| memberInfo   | enabled | メンバー情報            |
| emojiList    | enabled | カスタム絵文字一覧      |

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
        // reverse-proxy/public deployment向けの任意の明示URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chat mode: `oncall`（@-mentionに返信、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガーprefixで始まるメッセージ）。

Mattermostのネイティブコマンドが有効な場合:

- `commands.callbackPath` はフルURLではなくパスである必要があります（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` はOpenClaw Gateway endpointを指し、Mattermostサーバーから到達可能である必要があります。
- ネイティブslash callbackは、slash command登録時にMattermostから返されるコマンドごとのtokenで認証されます。登録に失敗した場合、またはコマンドが有効化されていない場合、OpenClawは callbackを `Unauthorized: invalid command token.` で拒否します。
- private/tailnet/internalなcallback hostでは、Mattermost側で `ServiceSettings.AllowedUntrustedInternalConnections` にcallback host/domainを含める必要がある場合があります。
  フルURLではなくhost/domain値を使ってください。
- `channels.mattermost.configWrites`: Mattermost起点のconfig書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: channelで返信する前に `@mention` を要求します。
- `channels.mattermost.groups.<channelId>.requireMention`: channelごとのmention-gating override（デフォルトには `"*"`）。
- 任意の `channels.mattermost.defaultAccount` を使うと、設定済みaccount idに一致する場合にデフォルトaccount選択を上書きできます。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 任意のaccount binding
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

- `channels.signal.account`: channel起動を特定のSignal account identityへ固定します。
- `channels.signal.configWrites`: Signal起点のconfig書き込みを許可または拒否します。
- 任意の `channels.signal.defaultAccount` を使うと、設定済みaccount idに一致する場合にデフォルトaccount選択を上書きできます。

### BlueBubbles

BlueBubblesは推奨されるiMessage経路です（pluginベースで、`channels.bluebubbles` の下で設定します）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl、password、webhookPath、group controls、advanced actions:
      // /channels/bluebubbles を参照
    },
  },
}
```

- ここで扱う主要キーパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 任意の `channels.bluebubbles.defaultAccount` を使うと、設定済みaccount idに一致する場合にデフォルトaccount選択を上書きできます。
- トップレベルの `bindings[]` エントリーで `type: "acp"` を使うと、BlueBubbles会話を永続ACP sessionにbindできます。`match.peer.id` にはBlueBubbles handleまたはtarget文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP Agents](/tools/acp-agents#channel-specific-settings)。
- BlueBubbles channelの完全な設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

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

- 任意の `channels.imessage.defaultAccount` を使うと、設定済みaccount idに一致する場合にデフォルトaccount選択を上書きできます。

- Messages DBへのFull Disk Accessが必要です。
- `chat_id:<id>` のtargetを優先してください。chat一覧は `imsg chats --limit 20` で確認できます。
- `cliPath` にはSSH wrapperを指定できます。SCPで添付を取得する場合は `remoteHost`（`host` または `user@host`）を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は、受信添付のパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCPはstrict host-key checkingを使用するため、relay host keyがすでに `~/.ssh/known_hosts` に存在している必要があります。
- `channels.imessage.configWrites`: iMessage起点のconfig書き込みを許可または拒否します。
- トップレベルの `bindings[]` エントリーで `type: "acp"` を使うと、iMessage会話を永続ACP sessionにbindできます。`match.peer.id` には正規化されたhandleまたは明示的なchat target（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP Agents](/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH wrapper例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrixはextensionベースで、`channels.matrix` の下で設定します。

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

- Token認証は `accessToken`、password認証は `userId` + `password` を使います。
- `channels.matrix.proxy` はMatrix HTTPトラフィックを明示的なHTTP(S) proxy経由にします。named accountでは `channels.matrix.accounts.<id>.proxy` で上書きできます。
- `channels.matrix.allowPrivateNetwork` はprivate/internal homeserverを許可します。`proxy` と `allowPrivateNetwork` は独立した制御です。
- `channels.matrix.defaultAccount` はmulti-account構成で優先accountを選択します。
- `channels.matrix.execApprovals`: Matrixネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。autoモードでは、承認者が `approvers` または `commands.ownerAllowFrom` から解決できるとexec承認が有効になります。
  - `approvers`: execリクエストを承認できるMatrix user ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のagent ID allowlist。省略するとすべてのagentの承認を転送します。
  - `sessionFilter`: 任意のsession keyパターン（部分文字列またはregex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（元のroom）、または `"both"`。
  - accountごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- Matrixのstatus probeとlive directory lookupは、ランタイムトラフィックと同じproxyポリシーを使います。
- Matrixの完全な設定、targetingルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teamsはextensionベースで、`channels.msteams` の下で設定します。

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

- ここで扱う主要キーパス: `channels.msteams`、`channels.msteams.configWrites`。
- Teamsの完全なconfig（資格情報、webhook、DM/group policy、team/channelごとのoverride）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRCはextensionベースで、`channels.irc` の下で設定します。

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

- ここで扱う主要キーパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 任意の `channels.irc.defaultAccount` を使うと、設定済みaccount idに一致する場合にデフォルトaccount選択を上書きできます。
- IRC channelの完全な設定（host/port/TLS/channels/allowlist/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### Multi-account（全channels共通）

channelごとに複数accountを実行できます（それぞれ独自の `accountId` を持ちます）。

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

- `accountId` を省略した場合（CLI + routing）は `default` が使われます。
- env tokenは**default** accountにのみ適用されます。
- ベースとなるchannel設定は、accountごとに上書きされない限りすべてのaccountに適用されます。
- 各accountを別のagentへルーティングするには `bindings[].match.accountId` を使います。
- `openclaw channels add`（またはchannel onboarding）でnon-default accountを追加する際に、まだ単一accountのトップレベルchannel configを使っている場合、OpenClawはまずaccountスコープ付きのトップレベル単一account値をchannel account mapへ昇格し、元のaccountが動作し続けるようにします。ほとんどのchannelではこれらを `channels.<channel>.accounts.default` へ移動します。Matrixでは既存の一致するnamed/default targetを代わりに保持できる場合があります。
- 既存のchannel-only binding（`accountId` なし）は引き続きdefault accountに一致し、accountスコープ付きbindingは任意のままです。
- `openclaw doctor --fix` も、accountスコープ付きトップレベル単一account値をそのchannelで選ばれた昇格先accountへ移動することで、混在した形を修復します。ほとんどのchannelは `accounts.default` を使います。Matrixでは既存の一致するnamed/default targetを代わりに保持できる場合があります。

### その他のextension channel

多くのextension channelは `channels.<id>` として設定され、それぞれ専用のchannelページに記載されています（たとえば Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など）。
完全なchannel一覧は [Channels](/ja-JP/channels) を参照してください。

### Group chatのmention gating

groupメッセージはデフォルトで**mention必須**です（メタデータのmentionまたは安全なregexパターン）。WhatsApp、Telegram、Discord、Google Chat、iMessageのgroup chatに適用されます。

**Mentionの種類:**

- **メタデータmention**: プラットフォームネイティブの @-mention。WhatsApp self-chatモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` の安全なregexパターン。無効なパターンや危険なネスト反復は無視されます。
- mention gatingは、検出が可能な場合（ネイティブmentionまたは少なくとも1つのパターン）にのみ強制されます。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。channelは `channels.<channel>.historyLimit`（またはaccountごと）で上書きできます。`0` で無効化します。

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

解決順: DMごとのoverride → providerデフォルト → 上限なし（すべて保持）。

対応対象: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### Self-chat mode

自分自身の番号を `allowFrom` に含めるとself-chat modeを有効にできます（ネイティブ @-mentionを無視し、テキストパターンにのみ応答します）。

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

### Commands（chat command handling）

```json5
{
  commands: {
    native: "auto", // サポートされる場合はネイティブcommandを登録
    text: true, // chatメッセージ中の /command を解析
    bash: false, // ! を許可（alias: /bash）
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

<Accordion title="Commandの詳細">

- Text commandは、先頭が `/` の**単独メッセージ**である必要があります。
- `native: "auto"` はDiscord/Telegramのネイティブcommandを有効にし、Slackでは無効のままにします。
- channelごとにoverride: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前登録されたcommandを削除します。
- `channels.telegram.customCommands` は追加のTelegram bot menuエントリーを追加します。
- `bash: true` はhost shellへの `! <cmd>` を有効にします。`tools.elevated.enabled` が必要で、送信者が `tools.elevated.allowFrom.<channel>` に含まれている必要があります。
- `config: true` は `/config` を有効にします（`openclaw.json` の読み書き）。gateway `chat.send` clientでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の書き込みスコープを持つoperator clientでも引き続き利用できます。
- `channels.<provider>.configWrites` はchannelごとのconfig変更を制御します（デフォルト: true）。
- multi-account channelでは、`channels.<provider>.accounts.<id>.configWrites` も、そのaccountを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `allowFrom` はproviderごとです。設定されている場合、それが**唯一の**認可ソースになります（channel allowlist/pairing および `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合にcommandがaccess-group policyをバイパスできるようにします。

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

システムプロンプトのRuntime行に表示される任意のrepository rootです。未設定の場合、OpenClawはworkspaceから上方向へたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していないagent向けの、任意のデフォルトskill allowlistです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // defaultsを置き換え
      { id: "locked-down", skills: [] }, // skillなし
    ],
  },
}
```

- デフォルトでskillsを無制限にするには `agents.defaults.skills` を省略します。
- defaultsを継承するには `agents.list[].skills` を省略します。
- skillなしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのagentの最終セットです。defaultsとはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrapファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効化します。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
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

すべてのworkspace bootstrapファイルにまたがって注入される合計最大文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap contextが切り詰められたときのagent可視警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: 警告テキストをシステムプロンプトへ注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに1回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めが存在するたびに毎回警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前のtranscript/tool imageブロックにおける、画像の長辺の最大ピクセルサイズ。
デフォルト: `1200`。

低い値にすると、スクリーンショットが多い実行でvision-token使用量とリクエストpayloadサイズが通常は減ります。
高い値ではより多くの視覚的詳細が保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトcontext用のtimezoneです（メッセージタイムスタンプではありません）。host timezoneへフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式。デフォルト: `auto`（OS設定）。

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
      params: { cacheRetention: "long" }, // グローバルなデフォルトprovider params
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - 文字列形式はprimary modelのみを設定します。
  - オブジェクト形式はprimaryに加えて順序付きfailover modelを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - `image` tool経路のvision-model設定として使われます。
  - 選択された/デフォルトのmodelが画像入力を受け付けられない場合のfallback routingにも使われます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - 共通の画像生成capabilityと、今後画像を生成するtool/plugin surfaceで使われます。
  - 一般的な値: Geminiネイティブ画像生成には `google/gemini-3.1-flash-image-preview`、falには `fal/fal-ai/flux/dev`、OpenAI Imagesには `openai/gpt-image-1`。
  - provider/modelを直接選ぶ場合は、対応するprovider認証/API keyも設定してください（たとえば `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`）。
  - 省略しても、`image_generate` は認証済みproviderのデフォルトを推測できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み画像生成providerをprovider-id順に試します。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - 共通の動画生成capabilityで使われます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、`qwen/wan2.7-r2v`。
  - 共通の動画生成を使う前に明示的に設定してください。`imageGenerationModel` と違い、動画生成ランタイムはまだproviderデフォルトを推測しません。
  - provider/modelを直接選ぶ場合は、対応するprovider認証/API keyも設定してください。
  - バンドルされたQwen動画生成providerは現在、最大1本の出力動画、1枚の入力画像、4本の入力動画、10秒の長さ、およびproviderレベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け入れます。
  - `pdf` toolのmodel routingに使われます。
  - 省略時は、PDF toolは `imageModel`、次に解決済みsession/default modelへフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の `pdf` tool用デフォルトPDFサイズ上限。
- `pdfMaxPages`: `pdf` toolの抽出fallback modeで考慮するデフォルト最大ページ数。
- `verboseDefault`: agentのデフォルトverboseレベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: agentのデフォルトelevated-outputレベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: `provider/model` 形式（例: `openai/gpt-5.4`）。providerを省略した場合、OpenClawはまずalias、次にそのmodel idに一意に一致するconfigured-provider、最後にconfigured default providerを試します（後方互換のための非推奨動作なので、明示的な `provider/model` を推奨します）。そのproviderが設定済みのdefault modelをもう公開していない場合、OpenClawは古い削除済みprovider defaultを表面化する代わりに、最初のconfigured provider/modelへフォールバックします。
- `models`: `/model` 用のconfigured model catalog兼allowlist。各エントリーには `alias`（shortcut）と `params`（provider固有。たとえば `temperature`、`maxTokens`、`cacheRetention`、`context1m`）を含められます。
- `params`: すべてのmodelに適用されるグローバルデフォルトprovider parameter。`agents.defaults.params` で設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（config）: `agents.defaults.params`（グローバル基底）を `agents.defaults.models["provider/model"].params`（modelごと）が上書きし、さらに `agents.list[].params`（一致するagent id）がキー単位で上書きします。詳細は [Prompt Caching](/reference/prompt-caching) を参照してください。
- これらのフィールドを書き換えるconfig writer（たとえば `/models set`、`/models set-image`、fallback add/remove command）は、正規のオブジェクト形式で保存し、可能な限り既存のfallback listを保持します。
- `maxConcurrent`: session間での並列agent実行数の最大値（各session自体は直列）。デフォルト: 4。

**組み込みalias shorthand**（modelが `agents.defaults.models` に存在する場合のみ適用）:

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

configured aliasは常にデフォルトより優先されます。

Z.AIのGLM-4.x modelは、`--thinking off` を設定するか `agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的にthinking modeを有効にします。
Z.AI modelはtool call streamingのためにデフォルトで `tool_stream` を有効にします。無効化するには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 modelは、明示的なthinking levelが設定されていない場合に `adaptive` thinkingをデフォルトとします。

### `agents.defaults.cliBackends`

テキスト専用のfallback実行（tool callなし）向けの任意のCLI backendです。API providerが失敗したときのバックアップとして便利です。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

- CLI backendはテキスト優先で、toolは常に無効です。
- `sessionArg` を設定するとsessionをサポートします。
- `imageArg` がファイルパスを受け入れる場合は画像のパススルーをサポートします。

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
        lightContext: false, // デフォルト: false。true だとworkspace bootstrap filesから HEARTBEAT.md のみ保持
        isolatedSession: false, // デフォルト: false。true だと各heartbeatを新しいsessionで実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト）| block
        target: "none", // デフォルト: none | 選択肢: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: duration文字列（ms/s/m/h）。デフォルトはAPI-key認証で `30m`、OAuth認証で `1h`。無効化するには `0m` を設定します。
- `suppressToolErrorWarnings`: trueのとき、heartbeat実行中のtool error warning payloadを抑制します。
- `directPolicy`: direct/DM配信ポリシー。`allow`（デフォルト）はdirect-target配信を許可します。`block` はdirect-target配信を抑制し、`reason=dm-blocked` を出力します。
- `lightContext`: trueのとき、heartbeat実行は軽量bootstrap contextを使い、workspace bootstrap filesから `HEARTBEAT.md` のみ保持します。
- `isolatedSession`: trueのとき、各heartbeat実行は以前の会話履歴なしの新しいsessionで行われます。cronの `sessionTarget: "isolated"` と同じ分離パターンです。heartbeatあたりのtokenコストを約100Kから約2-5Kへ減らします。
- agentごと: `agents.list[].heartbeat` を設定します。いずれかのagentが `heartbeat` を定義している場合、heartbeatを実行するのは**それらのagentのみ**です。
- heartbeatは完全なagent turnを実行するため、間隔を短くするとより多くのtokenを消費します。

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
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom で使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入無効
        model: "openrouter/anthropic/claude-sonnet-4-6", // 任意のcompaction専用model override
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

- `mode`: `default` または `safeguard`（長い履歴に対するチャンク化要約）。[Compaction](/concepts/compaction) を参照してください。
- `timeoutSeconds`: 単一のcompaction操作に許可される最大秒数。これを超えるとOpenClawはcompactionを中止します。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` はcompaction要約時に組み込みのopaque identifier保持ガイダンスを前置します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使用する任意のカスタムidentifier保持テキスト。
- `postCompactionSections`: compaction後に再注入する任意のAGENTS.md H2/H3セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。`[]` にすると再注入を無効化します。未設定か明示的にそのデフォルトペアに設定されている場合、旧来の `Every Session`/`Safety` 見出しもレガシーフォールバックとして受け入れます。
- `model`: compaction要約専用の任意の `provider/model-id` override。メインsessionは1つのmodelを使い続けつつ、compaction要約だけ別modelで実行したい場合に使用します。未設定時はsessionのprimary modelを使います。
- `notifyUser`: `true` のとき、compaction開始時にユーザーへ短い通知（たとえば「Compacting context...」）を送ります。デフォルトでは静かにcompactionを行うため無効です。
- `memoryFlush`: auto-compaction前に永続memoryを保存するためのサイレントなagent turn。workspaceがread-onlyならスキップされます。

### `agents.defaults.contextPruning`

LLMへ送る前に、メモリ内contextから**古いtool result** をpruneします。ディスク上のsession historyは**変更しません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration（ms/s/m/h）。デフォルト単位: 分
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

- `mode: "cache-ttl"` でpruningパスを有効にします。
- `ttl` は、最後のcache touch後に再びpruningを実行できるまでの間隔を制御します。
- pruningはまず大きすぎるtool resultをsoft-trimし、必要ならさらに古いtool resultをhard-clearします。

**Soft-trim** は先頭と末尾を残し、中間に `...` を挿入します。

**Hard-clear** はtool result全体をplaceholderで置き換えます。

注意:

- image blockは一切trim/clearされません。
- 比率は文字数ベースの近似であり、正確なtoken数ではありません。
- `keepLastAssistants` 未満のassistantメッセージしかない場合、pruningはスキップされます。

</Accordion>

動作の詳細は [Session Pruning](/concepts/session-pruning) を参照してください。

### Block streaming

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

- Telegram以外のchannelでは、block replyを有効にするには明示的に `*.blockStreaming: true` が必要です。
- channel override: `channels.<channel>.blockStreamingCoalesce`（およびaccountごとの同等設定）。Signal/Slack/Discord/Google Chatのデフォルトは `minChars: 1500`。
- `humanDelay`: block reply間のランダムな待機。`natural` = 800–2500ms。agentごとのoverride: `agents.list[].humanDelay`。

動作とchunkingの詳細は [Streaming](/concepts/streaming) を参照してください。

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
- sessionごとのoverride: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

embedded agent用の任意のsandboxingです。完全なガイドは [Sandboxing](/gateway/sandboxing) を参照してください。

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

<Accordion title="Sandboxの詳細">

**Backend:**

- `docker`: ローカルDockerランタイム（デフォルト）
- `ssh`: 汎用SSHベースのremote runtime
- `openshell`: OpenShell runtime

`backend: "openshell"` を選んだ場合、runtime固有設定は
`plugins.entries.openshell.config` に移ります。

**SSH backend config:**

- `target`: `user@host[:port]` 形式のSSH target
- `command`: SSH client command（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのworkspaceに使うabsoluteなremote root
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSHに渡す既存ローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClawが実行時に一時ファイルへ実体化するインライン内容またはSecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSHのhost-keyポリシー設定

**SSH authの優先順位:**

- `identityData` は `identityFile` より優先
- `certificateData` は `certificateFile` より優先
- `knownHostsData` は `knownHostsFile` より優先
- SecretRefベースの `*Data` 値は、sandbox session開始前に有効なsecrets runtime snapshotから解決されます

**SSH backendの動作:**

- createまたはrecreate後にremote workspaceを一度seedする
- その後、remote SSH workspaceを正とする
- `exec`、file tools、media pathをSSH経由でルーティングする
- remote変更をhostへ自動同期しない
- sandbox browser containerはサポートしない

**Workspace access:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのsandbox workspace
- `ro`: `/workspace` のsandbox workspaceに加え、agent workspaceを `/agent` へread-only mount
- `rw`: agent workspaceを `/workspace` にread/writeでmount

**Scope:**

- `session`: sessionごとのcontainer + workspace
- `agent`: agentごとに1つのcontainer + workspace（デフォルト）
- `shared`: 共有containerとworkspace（session間分離なし）

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
          gateway: "lab", // 任意
          gatewayEndpoint: "https://lab.example", // 任意
          policy: "strict", // 任意のOpenShell policy id
          providers: ["openai"], // 任意
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell mode:**

- `mirror`: exec前にlocalからremoteへseedし、exec後に同期し戻す。local workspaceが正となる
- `remote`: sandbox作成時に一度だけremoteへseedし、その後remote workspaceを正とする

`remote` modeでは、seed後にOpenClaw外でhost-localに加えた変更は自動同期されません。
transportはOpenShell sandboxへのSSHですが、sandbox lifecycleと任意のmirror syncはpluginが管理します。

**`setupCommand`** はcontainer作成後に1回だけ実行されます（`sh -lc` 経由）。network egress、書き込み可能root、root userが必要です。

**Containerのデフォルトは `network: "none"`** です。agentに外部アクセスが必要なら `"bridge"`（またはカスタムbridge network）へ設定してください。
`"host"` はブロックされます。`"container:<id>"` もデフォルトではブロックされますが、
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を明示的に設定した場合のみ許可されます（break-glass）。

**受信添付** は、アクティブworkspaceの `media/inbound/*` へステージされます。

**`docker.binds`** は追加のhost directoryをmountします。グローバルbindとagentごとのbindはマージされます。

**Sandboxed browser**（`sandbox.browser.enabled`）: container内のChromium + CDP。system promptへnoVNC URLが注入されます。`openclaw.json` で `browser.enabled` を有効にする必要はありません。
noVNC observer accessはデフォルトでVNC認証を使用し、OpenClawは共有URLにpasswordを露出する代わりに短命token URLを発行します。

- `allowHostControl: false`（デフォルト）は、sandboxed sessionがhost browserをtargetにすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用bridge network）です。グローバルbridge接続を明示的に望む場合のみ `bridge` に設定してください。
- `cdpSourceRange` では、container edgeでのCDP ingressをCIDR範囲（例: `172.21.0.1/32`）に制限できます。
- `sandbox.browser.binds` は追加のhost directoryをsandbox browser containerにのみmountします。設定された場合（`[]` を含む）、browser containerでは `docker.binds` を置き換えます。
- 起動時のデフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、container host向けに調整されています:
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
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu` はデフォルトで有効で、WebGL/3D用途で必要な場合は `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効にできます。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で、workflowが依存している場合に拡張機能を再有効化できます。
  - `--renderer-process-limit=2` は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。`0` にするとChromiumのデフォルト上限を使います。
  - `noSandbox` が有効な場合は、これに加えて `--no-sandbox` と `--disable-setuid-sandbox`。
  - デフォルトはcontainer imageのベースラインです。containerのデフォルトを変えたい場合は、custom browser imageとcustom entrypointを使用してください。

</Accordion>

browser sandboxingと `sandbox.docker.binds` は現在Docker専用です。

imageをbuildするには:

```bash
scripts/sandbox-setup.sh           # メインsandbox image
scripts/sandbox-browser-setup.sh   # 任意のbrowser image
```

### `agents.list`（agentごとのoverride）

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
        thinkingDefault: "high", // agentごとのthinking level override
        reasoningDefault: "on", // agentごとのreasoning visibility override
        fastModeDefault: false, // agentごとのfast mode override
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

- `id`: 安定したagent id（必須）。
- `default`: 複数設定されている場合、最初のものが勝ちます（警告を記録）。何も設定されていなければ、リストの最初のエントリーがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` でグローバルfallbackを無効化）。`primary` だけを上書きするcron jobは、`fallbacks: []` を設定しない限りデフォルトfallbackを継承します。
- `params`: 選択されたmodel entryに対して `agents.defaults.models` からマージされるagentごとのstream paramsです。`cacheRetention`、`temperature`、`maxTokens` などのagent固有overrideを、model catalog全体を複製せずに設定するのに使います。
- `skills`: 任意のagentごとのskill allowlist。省略時は、`agents.defaults.skills` が設定されていればそれを継承します。明示リストはdefaultsをマージせず置き換え、`[]` はskillなしを意味します。
- `thinkingDefault`: 任意のagentごとのデフォルトthinking level（`off | minimal | low | medium | high | xhigh | adaptive`）。メッセージごとまたはsession overrideがないとき、このagentの `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: 任意のagentごとのデフォルトreasoning visibility（`on | off | stream`）。メッセージごとまたはsessionのreasoning overrideがないときに適用されます。
- `fastModeDefault`: 任意のagentごとのデフォルトfast mode（`true | false`）。メッセージごとまたはsessionのfast-mode overrideがないときに適用されます。
- `runtime`: 任意のagentごとのruntime descriptor。agentのデフォルトをACP harness sessionにしたい場合は `type: "acp"` と `runtime.acp` defaults（`agent`、`backend`、`mode`、`cwd`）を使います。
- `identity.avatar`: workspace相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `ackReaction` は `emoji` から、`mentionPatterns` は `name`/`emoji` から。
- `subagents.allowAgents`: `sessions_spawn` 用のagent id allowlist（`["*"]` = 任意。デフォルト: 同じagentのみ）。
- Sandbox継承ガード: 要求元sessionがsandboxedの場合、`sessions_spawn` はunsandboxedで実行されるtargetを拒否します。
- `subagents.requireAgentId`: trueのとき、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なprofile選択を強制。デフォルト: false）。

---

## Multi-agent routing

1つのGateway内で複数の分離されたagentを実行します。[Multi-Agent](/concepts/multi-agent) を参照してください。

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

### Bindingのmatchフィールド

- `type`（任意）: 通常のroutingには `route`（type省略時もroute）、永続ACP conversation bindingには `acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のaccount、省略 = デフォルトaccount）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。channel固有）
- `acp`（任意。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的なmatch順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（peer/guild/teamなしの完全一致）
5. `match.accountId: "*"`（channel-wide）
6. デフォルトagent

同じtier内では、最初に一致した `bindings` エントリーが勝ちます。

`type: "acp"` エントリーでは、OpenClawは正確なconversation identity（`match.channel` + account + `match.peer.id`）で解決し、上記のroute binding tier順は使いません。

### Agentごとのaccess profile

<Accordion title="フルアクセス（sandboxなし）">

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

<Accordion title="ファイルシステムアクセスなし（messagingのみ）">

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

優先順位の詳細は [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) を参照してください。

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
      maxDiskBytes: "500mb", // 任意のハード上限
      highWaterBytes: "400mb", // 任意のcleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 非アクティブ時の自動unfocusのデフォルト（時間、`0` で無効）
      maxAgeHours: 0, // ハードな最大寿命のデフォルト（時間、`0` で無効）
    },
    mainKey: "main", // legacy（ランタイムは常に "main" を使用）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Sessionフィールドの詳細">

- **`scope`**: group-chat context用の基本session grouping戦略。
  - `per-sender`（デフォルト）: channel context内で各送信者が独立したsessionを持ちます。
  - `global`: channel context内の全参加者で1つのsessionを共有します（共有contextが意図される場合のみ使用）。
- **`dmScope`**: DMのグルーピング方法。
  - `main`: すべてのDMがmain sessionを共有。
  - `per-peer`: channelをまたいで送信者idごとに分離。
  - `per-channel-peer`: channel + 送信者ごとに分離（multi-user inboxに推奨）。
  - `per-account-channel-peer`: account + channel + 送信者ごとに分離（multi-accountに推奨）。
- **`identityLinks`**: channel横断でsession共有するため、canonical idをprovider-prefix付きpeerへマップします。
- **`reset`**: 主要なreset policy。`daily` はローカル時刻 `atHour` でresetし、`idle` は `idleMinutes` 後にresetします。両方設定されている場合、先に期限が来た方が優先されます。
- **`resetByType`**: typeごとのoverride（`direct`、`group`、`thread`）。legacyの `dm` も `direct` のaliasとして受け入れます。
- **`parentForkMaxTokens`**: forkされたthread sessionを作成するときに許可する親session `totalTokens` の最大値（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClawは親トランスクリプト履歴を継承せず、新しいthread sessionを開始します。
  - このガードを無効にして常に親forkを許可するには `0` を設定します。
- **`mainKey`**: legacyフィールド。ランタイムは現在、main direct-chat bucketに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: agent間のやり取りで許可されるreply-back turn数の最大値（整数、範囲: `0`–`5`）。`0` でping-pong連鎖を無効化します。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、legacyの `dm` aliasあり）、`keyPrefix`、または `rawKeyPrefix` でマッチします。最初のdenyが勝ちます。
- **`maintenance`**: session-storeのcleanup + 保持制御。
  - `mode`: `warn` は警告のみ、`enforce` はcleanupを適用。
  - `pruneAfter`: 古いエントリーの期限（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大エントリー数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたときにrotateします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archiveの保持期間。デフォルトは `pruneAfter`。無効化するには `false`。
  - `maxDiskBytes`: 任意のsessions directoryディスク予算。`warn` モードでは警告を記録し、`enforce` モードでは最も古いartifact/sessionから削除します。
  - `highWaterBytes`: 予算cleanup後の任意target。デフォルトは `maxDiskBytes` の `80%`。
- **`threadBindings`**: thread-bound session機能のグローバルデフォルト。
  - `enabled`: マスターのデフォルトスイッチ（providerが上書き可能。Discordは `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動unfocusのデフォルト時間（`0` で無効。providerがoverride可能）
  - `maxAgeHours`: ハードな最大寿命のデフォルト時間（`0` で無効。providerがoverride可能）

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
      debounceMs: 2000, // 0で無効
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Response prefix

channel/accountごとのoverride: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順（最も具体的なものが優先）: account → channel → global。`""` は無効化し、cascadeを止めます。`"auto"` は `[{identity.name}]` を導出します。

**Template変数:**

| Variable          | 説明                | 例                          |
| ----------------- | ------------------- | --------------------------- |
| `{model}`         | 短いmodel名         | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なmodel識別子   | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider名          | `anthropic`                 |
| `{thinkingLevel}` | 現在のthinking level | `high`, `low`, `off`        |
| `{identity.name}` | agent identity名    | （`"auto"` と同じ）         |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` のaliasです。

### Ack reaction

- デフォルトはアクティブagentの `identity.emoji`、なければ `"👀"`。無効化するには `""` を設定します。
- channelごとのoverride: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順: account → channel → `messages.ackReaction` → identity fallback。
- Scope: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegramで返信後にackを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegramでライフサイクルstatus reactionを有効にします。
  SlackとDiscordでは、未設定ならack reactionが有効なときにstatus reactionも有効のままです。
  Telegramでは、ライフサイクルstatus reactionを有効にするには明示的に `true` を設定してください。

### Inbound debounce

同じ送信者からの高速なテキストのみメッセージを1つのagent turnへまとめます。media/attachmentは即座にflushします。control commandはdebouncingをバイパスします。

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

- `auto` はauto-TTSを制御します。`/tts off|always|inbound|tagged` はsessionごとに上書きします。
- `summaryModel` はauto-summary用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（opt-in）。
- API keyは `ELEVENLABS_API_KEY`/`XI_API_KEY` と `OPENAI_API_KEY` へフォールバックします。
- `openai.baseUrl` はOpenAI TTS endpointを上書きします。解決順はconfig、次に `OPENAI_TTS_BASE_URL`、最後に `https://api.openai.com/v1`。
- `openai.baseUrl` が非OpenAI endpointを指している場合、OpenClawはそれをOpenAI互換TTS serverとして扱い、model/voice検証を緩和します。

---

## Talk

Talk mode（macOS/iOS/Android）のデフォルトです。

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

- `talk.provider` は、複数のTalk providerを設定する場合に `talk.providers` のキーと一致している必要があります。
- 従来のフラットなTalkキー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用で、自動的に `talk.providers.<provider>` へ移行されます。
- Voice IDは `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` へフォールバックします。
- `providers.*.apiKey` は平文文字列またはSecretRefオブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` のフォールバックは、Talk API keyが設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` を使うと、Talk directiveでフレンドリーな名前を使えます。
- `silenceTimeoutMs` は、Talk modeがユーザーの無音後どれだけ待ってからtranscriptを送信するかを制御します。未設定の場合はプラットフォームのデフォルト待機時間（macOSとAndroidで `700 ms`、iOSで `900 ms`）を使います。

---

## Tools

### Tool profile

`tools.profile` は、`tools.allow`/`tools.deny` より前に適用されるベースallowlistを設定します。

ローカルオンボーディングでは、未設定の場合の新しいlocal configを `tools.profile: "coding"` に設定します（既存の明示profileは保持されます）。

| Profile     | 内容                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                             |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                     |
| `full`      | 制限なし（未設定と同じ）                                                                                          |

### Tool group

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` も `exec` のaliasとして受け入れられます）                                  |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `tts`                                                                                        |
| `group:openclaw`   | すべての組み込みtool（provider pluginは除く）                                                                          |

### `tools.allow` / `tools.deny`

グローバルなtool allow/deny policyです（denyが勝ちます）。大文字小文字を区別せず、`*` wildcardをサポートします。Docker sandboxがoffでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のproviderまたはmodelに対してtoolsをさらに制限します。順序: ベースprofile → provider profile → allow/deny。

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

sandbox外でのelevated exec accessを制御します。

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

- agentごとのoverride（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はstateをsessionごとに保存し、インラインdirectiveは単一メッセージに適用されます。
- Elevated `exec` はsandboxingをバイパスし、設定されたescape path（デフォルトでは `gateway`、exec targetが `node` の場合は `node`）を使います。

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

tool-loopの安全チェックはデフォルトで**無効**です。検出を有効にするには `enabled: true` を設定します。
設定はグローバルな `tools.loopDetection` で定義でき、agentごとに `agents.list[].tools.loopDetection` でoverrideできます。

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

- `historySize`: loop解析のために保持するtool-call履歴の最大数。
- `warningThreshold`: no-progressな繰り返しパターンに対する警告閾値。
- `criticalThreshold`: 重大loopをブロックするための、より高い繰り返し閾値。
- `globalCircuitBreakerThreshold`: 任意のno-progress実行を強制停止する閾値。
- `detectors.genericRepeat`: 同じtool/同じargsの繰り返し呼び出しを警告。
- `detectors.knownPollNoProgress`: 既知のpoll tool（`process.poll`、`command_status` など）に対するno-progressを警告/ブロック。
- `detectors.pingPong`: 交互に発生するno-progress pairパターンを警告/ブロック。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証に失敗します。

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
        provider: "firecrawl", // 任意。省略時はauto-detect
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

受信media理解（image/audio/video）を設定します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
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

**Provider entry**（`type: "provider"` または省略）:

- `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: model id override
- `profile` / `preferredProfile`: `auth-profiles.json` のprofile選択

**CLI entry**（`type: "cli"`）:

- `command`: 実行する実行ファイル
- `args`: テンプレート化されたargs（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: 任意のリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: entryごとのoverride。
- 失敗時は次のentryへフォールバックします。

Provider authは標準順序に従います: `auth-profiles.json` → env vars → `models.providers.*.apiKey`。

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

session tool（`sessions_list`、`sessions_history`、`sessions_send`）でtargetにできるsessionを制御します。

デフォルト: `tree`（現在のsession + そこからspawnされたsession、たとえばsubagent）。

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

- `self`: 現在のsession keyのみ。
- `tree`: 現在のsession + 現在のsessionからspawnされたsession（subagent）。
- `agent`: 現在のagent idに属する任意のsession（同じagent id配下でper-sender sessionを使っている場合は他ユーザーを含むことがあります）。
- `all`: 任意のsession。cross-agent targetingには引き続き `tools.agentToAgent` が必要です。
- Sandbox clamp: 現在のsessionがsandboxedで、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` であってもvisibilityは `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインラインattachment supportを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: trueに設定するとインラインfile attachmentを許可
        maxTotalBytes: 5242880, // 全file合計で5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // fileごとに1 MB
        retainOnSessionKeep: false, // cleanup="keep" のときattachmentを保持
      },
    },
  },
}
```

注意:

- Attachmentは `runtime: "subagent"` の場合のみサポートされます。ACP runtimeでは拒否されます。
- Fileは子workspaceの `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに実体化されます。
- Attachment内容はtranscript persistenceから自動的にredactされます。
- Base64入力は、厳密なalphabet/paddingチェックとデコード前サイズガードで検証されます。
- File permissionはdirectoryが `0700`、fileが `0600` です。
- Cleanupは `cleanup` policyに従います: `delete` は常にattachmentを削除し、`keep` は `retainOnSessionKeep: true` のときのみ保持します。

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

- `model`: spawnされたsub-agent用のデフォルトmodel。省略時、sub-agentは呼び出し元のmodelを継承します。
- `allowAgents`: 要求元agentが自分の `subagents.allowAgents` を設定していない場合の `sessions_spawn` 向けtarget agent idデフォルトallowlist（`["*"]` = 任意。デフォルト: 同じagentのみ）。
- `runTimeoutSeconds`: tool callが `runTimeoutSeconds` を省略した場合の `sessions_spawn` デフォルトtimeout（秒）。`0` はtimeoutなしを意味します。
- subagentごとのtool policy: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムproviderとbase URL

OpenClawは組み込みmodel catalogを使います。カスタムproviderはconfig内の `models.providers`、または `~/.openclaw/agents/<agentId>/agent/models.json` 経由で追加できます。

```json5
{
  models: {
    mode: "merge", // merge（デフォルト）| replace
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

- カスタムauthが必要な場合は `authHeader: true` + `headers` を使ってください。
- agent config rootは `OPENCLAW_AGENT_DIR`（またはlegacy aliasの `PI_CODING_AGENT_DIR`）で上書きできます。
- 一致するprovider IDに対するマージ優先順位:
  - 空でないagent `models.json` の `baseUrl` が優先されます。
  - 空でないagentの `apiKey` は、そのproviderが現在のconfig/auth-profile contextでSecretRef管理されていない場合にのみ優先されます。
  - SecretRef管理のprovider `apiKey` 値は、解決済みsecretを永続化する代わりに、source marker（env refなら `ENV_VAR_NAME`、file/exec refなら `secretref-managed`）から更新されます。
  - SecretRef管理のprovider header値も、source marker（env refなら `secretref-env:ENV_VAR_NAME`、file/exec refなら `secretref-managed`）から更新されます。
  - agent側の `apiKey`/`baseUrl` が空または欠けている場合は、config内の `models.providers` にフォールバックします。
  - 一致するmodelの `contextWindow`/`maxTokens` には、明示config値と暗黙catalog値の高い方を使用します。
  - 一致するmodelの `contextTokens` は、明示的なランタイムcapがあれば保持されます。ネイティブmodel metadataを変えずに実効contextを制限したい場合に使ってください。
  - configで `models.json` を完全に書き換えたい場合は `models.mode: "replace"` を使ってください。
  - marker persistenceはsource-authoritativeです。markerは、解決済みランタイムsecret値からではなく、有効なsource config snapshot（解決前）から書き込まれます。

### Providerフィールドの詳細

- `models.mode`: provider catalogの動作（`merge` または `replace`）。
- `models.providers`: provider idをキーとするカスタムprovider map。
- `models.providers.*.api`: リクエストadapter（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: provider資格情報（SecretRef/env置換の使用を推奨）。
- `models.providers.*.auth`: auth戦略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用。リクエストへ `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に資格情報を `Authorization` headerで送るよう強制します。
- `models.providers.*.baseUrl`: 上流APIのbase URL。
- `models.providers.*.headers`: proxy/tenant routing用の追加静的header。
- `models.providers.*.request`: model-provider HTTP request用transport override。
  - `request.headers`: 追加header（provider defaultとマージ）。値はSecretRefを受け入れます。
  - `request.auth`: auth戦略override。モード: `"provider-default"`（providerの組み込みauthを使用）、`"authorization-bearer"`（`token` とともに使用）、`"header"`（`headerName`、`value`、任意の `prefix` とともに使用）。
  - `request.proxy`: HTTP proxy override。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` env varsを使用）、`"explicit-proxy"`（`url` とともに使用）。どちらのモードでも任意の `tls` サブオブジェクトを受け入れます。
  - `request.tls`: direct connection用TLS override。フィールド: `ca`、`cert`、`key`、`passphrase`（すべてSecretRef可）、`serverName`、`insecureSkipVerify`。
- `models.providers.*.models`: 明示的なprovider model catalog entry。
- `models.providers.*.models.*.contextWindow`: ネイティブmodelのcontext window metadata。
- `models.providers.*.models.*.contextTokens`: 任意のランタイムcontext cap。model本来の `contextWindow` より小さい実効context予算を使いたい場合に使用します。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。`api: "openai-completions"` で空でない非ネイティブ `baseUrl`（hostが `api.openai.com` 以外）の場合、OpenClawは実行時にこれを `false` に強制します。空または省略された `baseUrl` ではOpenAIのデフォルト動作を保持します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock auto-discovery設定のルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙discoveryのオン/オフ。
- `plugins.entries.amazon-bedrock.config.discovery.region`: discovery用AWS region。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象discovery用の任意provider-idフィルター。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: discovery refreshのpolling間隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 発見されたmodel用のfallback context window。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 発見されたmodel用のfallback max output tokens。

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

Cerebrasには `cerebras/zai-glm-4.7` を、Z.AI直結には `zai/glm-4.7` を使ってください。

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

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定してください。Zen catalogには `opencode/...`、Go catalogには `opencode-go/...` を使います。shortcut: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

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

`ZAI_API_KEY` を設定してください。`z.ai/*` と `z-ai/*` はaliasとして受け入れられます。shortcut: `openclaw onboard --auth-choice zai-api-key`。

- 一般endpoint: `https://api.z.ai/api/paas/v4`
- Coding endpoint（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 一般endpoint用には、base URL override付きのカスタムproviderを定義してください。

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

China endpointの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

ネイティブMoonshot endpointは共有 `openai-completions` transport上のstreaming usage互換性を広告しており、OpenClawは現在これを組み込みprovider idだけでなくendpoint capabilityに基づいて判定します。

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

Anthropic互換の組み込みproviderです。shortcut: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

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

base URLには `/v1` を付けないでください（Anthropic client側で追加されます）。shortcut: `openclaw onboard --auth-choice synthetic-api-key`。

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

`MINIMAX_API_KEY` を設定してください。shortcut:
`openclaw onboard --auth-choice minimax-global-api` または
`openclaw onboard --auth-choice minimax-cn-api`。
model catalogは現在M2.7のみをデフォルトとします。
Anthropic互換streaming pathでは、OpenClawは明示的に `thinking` を設定しない限りMiniMax thinkingをデフォルトで無効にします。`/fast on` または `params.fastMode: true` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="Local models (LM Studio)">

[Local Models](/gateway/local-models) を参照してください。要点: 十分な性能のハードウェア上でLM Studio Responses API経由の大きなlocal modelを動かし、fallback用にhosted modelはマージしたままにします。

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
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: bundled skillにのみ適用される任意allowlistです（managed/workspace skillには影響しません）。
- `load.extraDirs`: 追加の共有skill root（優先度は最低）。
- `install.preferBrew`: trueのとき、`brew` が利用可能なら他のinstaller kindへフォールバックする前にHomebrew installerを優先します。
- `install.nodeManager`: `metadata.openclaw.install` spec用のnode installer優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、bundled/installedであってもそのskillを無効化します。
- `entries.<skillKey>.apiKey`: そのskillが主要env varを宣言している場合の簡易API keyフィールド（対応しているskillのみ）。

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- 読み込み元: `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths`。
- DiscoveryはネイティブOpenClaw pluginに加え、互換性のあるCodex bundleとClaude bundleも受け入れます。manifestのないClaudeデフォルトレイアウトbundleも含まれます。
- **Config変更にはGateway再起動が必要です。**
- `allow`: 任意のallowlist（列挙されたpluginのみ読み込み）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: pluginレベルのAPI key簡易フィールド（pluginが対応している場合）。
- `plugins.entries.<id>.env`: pluginスコープのenv var map。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` のとき、coreは `before_prompt_build` をブロックし、legacyな `before_agent_start` からのprompt変更フィールドを無視します。ただし legacyの `modelOverride` と `providerOverride` は保持します。ネイティブplugin hookと、対応するbundle提供hook directoryの両方に適用されます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このpluginがbackground subagent実行でrunごとの `provider` と `model` overrideを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたsubagent override用の任意のcanonical `provider/model` target allowlist。意図的に任意のmodelを許可したい場合にのみ `"*"` を使ってください。
- `plugins.entries.<id>.config`: plugin定義のconfig object（ネイティブOpenClaw plugin schemaがある場合はそのschemaで検証）。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider設定。
  - `apiKey`: Firecrawl API key（SecretRef可）。`plugins.entries.firecrawl.config.webSearch.apiKey`、legacyの `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` env varへフォールバックします。
  - `baseUrl`: Firecrawl API base URL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページからmain contentのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大cache age（ミリ秒、デフォルト: `172800000` / 2日）。
  - `timeoutSeconds`: scrape request timeout（秒、デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search providerを有効化します。
  - `model`: 検索に使うGrok model（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory dreaming（experimental）設定。モードと閾値は [Dreaming](/concepts/memory-dreaming) を参照してください。
  - `mode`: dreaming cadence preset（`"off"`、`"core"`、`"rem"`、`"deep"`）。デフォルト: `"off"`。
  - `cron`: dreaming schedule用の任意cron式override。
  - `timezone`: schedule評価用timezone（`agents.defaults.userTimezone` へフォールバック）。
  - `limit`: 1サイクルでpromoteする候補の最大数。
  - `minScore`: promoteのための最小加重score閾値。
  - `minRecallCount`: 最小recall回数閾値。
  - `minUniqueQueries`: 最小distinct query回数閾値。
- 有効なClaude bundle pluginは `settings.json` から埋め込みPi defaultも提供できます。OpenClawはこれを生のOpenClaw config patchではなく、sanitizedされたagent設定として適用します。
- `plugins.slots.memory`: アクティブなmemory plugin idを選択するか、memory pluginを無効にするには `"none"`。
- `plugins.slots.contextEngine`: アクティブなcontext engine plugin idを選択します。デフォルトは、別engineをインストールして選択しない限り `"legacy"`。
- `plugins.installs`: `openclaw plugins update` で使われるCLI管理のinstall metadata。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt` を含みます。
  - `plugins.installs.*` は管理対象stateとして扱ってください。手編集よりCLI commandを優先してください。

[Plugins](/tools/plugin) を参照してください。

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // デフォルトのtrusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` は `act:evaluate` と `wait --fn` を無効化します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時に `true` がデフォルトです（trusted-network model）。
- 厳格なpublic-only browser navigationにするには `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定してください。
- strict modeでは、remote CDP profile endpoint（`profiles.*.cdpUrl`）も、到達性/discoveryチェック時に同じprivate-network blockingの対象になります。
- `ssrfPolicy.allowPrivateNetwork` はlegacy aliasとして引き続きサポートされています。
- strict modeでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使います。
- remote profileはattach-onlyです（start/stop/resetは無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け入れます。
  `/json/version` を発見させたい場合はHTTP(S)を、providerが直接DevTools WebSocket URLを返す場合はWS(S)を使ってください。
- `existing-session` profileはhost-onlyで、CDPの代わりにChrome MCPを使います。
- `existing-session` profileでは、BraveやEdgeなど特定のChromiumベースbrowser profileをtargetにするために `userDataDir` を設定できます。
- `existing-session` profileには現在のChrome MCP route制限が適用されます: CSS selector targetingではなくsnapshot/refベースのaction、単一file upload hook、dialog timeout overrideなし、`wait --load networkidle` なし、さらに `responsebody`、PDF export、download interception、batch actionもありません。
- ローカル管理の `openclaw` profileは `cdpPort` と `cdpUrl` を自動割り当てします。明示的な `cdpUrl` はremote CDPにのみ設定してください。
- Auto-detect順序: デフォルトbrowserがChromium系ならそれ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- Control service: loopbackのみ（portは `gateway.port` から導出、デフォルト `18791`）。
- `extraArgs` はローカルChromium起動に追加flagを付加します（たとえば `--disable-gpu`、windowサイズ、debug flagなど）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji、短い文字列、image URL、またはdata URI
    },
  },
}
```

- `seamColor`: ネイティブapp UIのアクセントカラー（Talk Mode bubble tintなど）。
- `assistant`: Control UIのidentity override。アクティブagent identityへフォールバックします。

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // または OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy 用。/gateway/tr