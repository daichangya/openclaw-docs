---
read_when:
    - 正確なフィールドレベルの設定セマンティクスまたはデフォルトが必要です
    - チャンネル、model、Gateway、またはtoolのconfigブロックを検証しています
summary: コアOpenClawキー、デフォルト、および専用サブシステムリファレンスへのリンクのためのGateway設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-22T04:22:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0313f47079536b93385b4e9c7680a896098ac05dce4e368d389a33e31b4649ac
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json`向けのコアconfigリファレンスです。タスク指向の概要については[Configuration](/ja-JP/gateway/configuration)を参照してください。

このページでは、OpenClawの主要なconfigサーフェスを扱い、サブシステムごとにより詳細な専用リファレンスがある場合はそこへのリンクを示します。このページは、すべてのchannel/plugin固有のコマンドカタログや、深いmemory/QMDの細かな設定項目を1ページにすべてインライン展開することは**意図していません**。

コード上の正しい情報源:

- `openclaw config schema` は、検証とControl UIで使われるライブJSON Schemaを出力します。利用可能な場合は、bundled/plugin/channelのメタデータもマージされます
- `config.schema.lookup` は、ドリルダウン用ツール向けに1つのパススコープschema nodeを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のschemaサーフェスに対してconfig-docベースラインハッシュを検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および`plugins.entries.memory-core.config.dreaming`配下のDreaming設定については[Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + bundledコマンドカタログについては[Slash Commands](/ja-JP/tools/slash-commands)
- channel固有のコマンドサーフェスについては各channel/pluginページ

Config形式は**JSON5**です（コメントと末尾カンマを許可）。すべてのフィールドは任意で、省略時はOpenClawが安全なデフォルト値を使用します。

---

## チャンネル

各channelは、そのconfigセクションが存在すると自動的に開始されます（`enabled: false`でない限り）。

### DMとグループアクセス

すべてのchannelはDMポリシーとグループポリシーをサポートします。

| DMポリシー          | 動作                                                         |
| ------------------- | ------------------------------------------------------------ |
| `pairing`（デフォルト） | 不明な送信者には一度限りのペアリングコードが発行され、ownerが承認する必要があります |
| `allowlist`         | `allowFrom`（またはペア済み許可ストア）内の送信者のみ許可されます             |
| `open`              | すべての受信DMを許可します（`allowFrom: ["*"]`が必要）                    |
| `disabled`          | すべての受信DMを無視します                                           |

| グループポリシー         | 動作                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（デフォルト） | 設定された許可リストに一致するグループのみ許可されます          |
| `open`                | グループ許可リストをバイパスします（ただしメンション必須制御は適用されます） |
| `disabled`            | すべてのグループ/roomメッセージをブロックします                         |

<Note>
`channels.defaults.groupPolicy`は、providerの`groupPolicy`が未設定のときのデフォルトを設定します。
ペアリングコードの有効期限は1時間です。保留中のDMペアリング要求は**channelごとに3件**までに制限されます。
providerブロック自体が存在しない場合（`channels.<provider>`が未定義）、ランタイムのグループポリシーは起動時警告付きで`allowlist`（fail-closed）にフォールバックします。
</Note>

### チャンネルごとのmodel上書き

特定のchannel IDをmodelに固定するには`channels.modelByChannel`を使います。値には`provider/model`または設定済みmodel aliasを指定できます。このchannelマッピングは、セッションにまだmodel上書きがない場合（たとえば`/model`で設定されていない場合）に適用されます。

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

### チャンネル共通デフォルトとHeartbeat

provider間で共有するグループポリシーとHeartbeat動作には`channels.defaults`を使います。

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

- `channels.defaults.groupPolicy`: providerレベルの`groupPolicy`が未設定のときのフォールバックグループポリシー。
- `channels.defaults.contextVisibility`: 全channel向けのデフォルト補足コンテキスト可視性モード。値: `all`（デフォルト、引用/thread/historyコンテキストをすべて含む）、`allowlist`（許可リストにある送信者のコンテキストのみ含む）、`allowlist_quote`（allowlistと同じだが明示的なquote/replyコンテキストは保持）。channelごとの上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 健全なchannelステータスをHeartbeat出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラーステータスをHeartbeat出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータ形式のHeartbeat出力を表示します。

### WhatsApp

WhatsAppはgatewayのweb channel（Baileys Web）経由で動作します。リンク済みセッションが存在すれば自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 既読マーク（self-chatモードではfalse）
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

<Accordion title="複数アカウントWhatsApp">

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

- 送信コマンドは、`default`アカウントが存在すればそれを、なければ設定済みアカウントIDのうち最初のもの（ソート順）をデフォルトにします。
- 任意の`channels.whatsapp.defaultAccount`は、設定済みアカウントIDと一致する場合、このフォールバックのデフォルトアカウント選択を上書きします。
- 旧単一アカウントBaileys auth dirは、`openclaw doctor`によって`whatsapp/default`へ移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
              systemPrompt: "話題から外れないでください。",
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
      streaming: "partial", // off | partial | block | progress（デフォルト: off。プレビュー編集のレート制限を避けるため明示的に有効化）
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

- ボットトークン: `channels.telegram.botToken`または`channels.telegram.tokenFile`（通常ファイルのみ。symlinkは拒否されます）。デフォルトアカウントでは`TELEGRAM_BOT_TOKEN`がフォールバックとして使われます。
- 任意の`channels.telegram.defaultAccount`は、設定済みアカウントIDと一致する場合、デフォルトアカウント選択を上書きします。
- 複数アカウント構成（2つ以上のアカウントID）では、フォールバックルーティングを避けるため明示的なデフォルト（`channels.telegram.defaultAccount`または`channels.telegram.accounts.default`）を設定してください。これが欠けているか無効な場合、`openclaw doctor`が警告します。
- `configWrites: false`は、Telegram起点のconfig書き込み（supergroup ID移行、`/config set|unset`）をブロックします。
- `type: "acp"`を持つトップレベルの`bindings[]`エントリは、forum topic向けの永続的なACP bindingを設定します（`match.peer.id`には正規形の`chatId:topic:topicId`を使用）。フィールドのセマンティクスは[ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)で共通です。
- Telegramのストリームプレビューは`sendMessage` + `editMessageText`を使います（ダイレクトチャットおよびグループチャットで動作）。
- リトライポリシー: [Retry policy](/ja-JP/concepts/retry)を参照してください。

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
              systemPrompt: "回答は短くしてください。",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress（progressはDiscordではpartialにマップされます）
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
        spawnSubagentSessions: false, // sessions_spawn({ thread: true })向けのオプトイン
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

- トークン: `channels.discord.token`。デフォルトアカウントでは`DISCORD_BOT_TOKEN`がフォールバックとして使われます。
- 明示的なDiscord `token`を指定する直接の送信呼び出しは、その呼び出しにそのトークンを使用します。アカウントのretry/ポリシー設定は、引き続きアクティブなruntime snapshotで選択されたアカウントから取得されます。
- 任意の`channels.discord.defaultAccount`は、設定済みアカウントIDと一致する場合、デフォルトアカウント選択を上書きします。
- 配信ターゲットには`user:<id>`（DM）または`channel:<id>`（guild channel）を使用してください。数字だけのIDは拒否されます。
- Guild slugは小文字で、空白は`-`に置き換えられます。channel keyにはslug化した名前（`#`なし）を使用します。guild IDを推奨します。
- botが作成したメッセージはデフォルトで無視されます。`allowBots: true`で有効になります。botにメンションしたbotメッセージだけを受け付けるには`allowBots: "mentions"`を使います（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびchannelごとの上書き）は、別のユーザーまたはroleにメンションしていてボットにはメンションしていないメッセージを破棄します（@everyone/@hereは除く）。
- `maxLinesPerMessage`（デフォルト17）は、2000文字未満でも縦長のメッセージを分割します。
- `channels.discord.threadBindings`は、Discordのthreadバインド型ルーティングを制御します。
  - `enabled`: threadバインドsession機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインド済み配信/ルーティング）に対するDiscord上書き
  - `idleHours`: 非アクティブ時の自動unfocusに対するDiscord上書き（時間単位、`0`で無効）
  - `maxAgeHours`: ハード最大有効期間に対するDiscord上書き（時間単位、`0`で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })`の自動thread作成/バインド向けオプトインスイッチ
- `type: "acp"`を持つトップレベルの`bindings[]`エントリは、channelおよびthread向けの永続的なACP bindingを設定します（`match.peer.id`にはchannel/thread IDを使用）。フィールドのセマンティクスは[ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)で共通です。
- `channels.discord.ui.components.accentColor`は、Discord components v2 containerのアクセントカラーを設定します。
- `channels.discord.voice`は、Discord voice channel会話と、任意の自動参加 + TTS上書きを有効にします。
- `channels.discord.voice.daveEncryption`と`channels.discord.voice.decryptionFailureTolerance`は、`@discordjs/voice`のDAVE optionにそのまま渡されます（デフォルトは`true`と`24`）。
- OpenClawは、復号失敗が繰り返された場合にvoice sessionから退出して再参加することで、voice受信の復旧も追加で試みます。
- `channels.discord.streaming`が正規のストリームモードキーです。旧来の`streamMode`および真偽値の`streaming`は自動移行されます。
- `channels.discord.autoPresence`は、ランタイム可用性をボットのプレゼンスに対応付けます（healthy => online、degraded => idle、exhausted => dnd）。任意のステータステキスト上書きも可能です。
- `channels.discord.dangerouslyAllowNameMatching`は、変更可能な名前/tag照合を再有効化します（緊急時の互換モード）。
- `channels.discord.execApprovals`: Discordネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または`"auto"`（デフォルト）。autoモードでは、`approvers`または`commands.ownerAllowFrom`から承認者を解決できる場合にexec承認が有効化されます。
  - `approvers`: exec要求を承認できるDiscord user ID。省略時は`commands.ownerAllowFrom`にフォールバックします。
  - `agentFilter`: 任意のagent ID許可リスト。省略するとすべてのagentの承認を転送します。
  - `sessionFilter`: 任意のsession keyパターン（部分文字列またはregex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者のDMに送信し、`"channel"`は元のchannelに送信し、`"both"`は両方に送信します。targetに`"channel"`が含まれる場合、ボタンを使用できるのは解決済み承認者のみです。
  - `cleanupAfterResolve`: `true`の場合、承認、拒否、またはタイムアウト後に承認DMを削除します。

**リアクション通知モード:** `off`（なし）、`own`（ボットのメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（全メッセージに対して`guilds.<id>.users`を使用）。

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
- サービスアカウントのSecretRef（`serviceAccountRef`）にも対応しています。
- envフォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT`または`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには`spaces/<spaceId>`または`users/<userId>`を使用してください。
- `channels.googlechat.dangerouslyAllowNameMatching`は、変更可能なメールprincipal照合を再有効化します（緊急時の互換モード）。

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
          systemPrompt: "回答は短くしてください。",
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
        nativeTransport: true, // mode=partialのときSlackネイティブストリーミングAPIを使用
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

- **Socket mode**には`botToken`と`appToken`の両方が必要です（デフォルトアカウントのenvフォールバックは`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode**には`botToken`に加えて`signingSecret`（ルートまたはアカウントごと）が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken`は、プレーンテキスト文字列またはSecretRef objectを受け付けます。
- Slackアカウントsnapshotは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP modeでは`signingSecretStatus`など、credentialごとのsource/statusフィールドを公開します。`configured_unavailable`は、そのアカウントがSecretRef経由で設定されているものの、現在のコマンド/runtime経路ではsecret値を解決できなかったことを意味します。
- `configWrites: false`は、Slack起点のconfig書き込みをブロックします。
- 任意の`channels.slack.defaultAccount`は、設定済みアカウントIDと一致する場合、デフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode`が正規のSlackストリームモードキーです。`channels.slack.streaming.nativeTransport`はSlackのネイティブストリーミング転送を制御します。旧来の`streamMode`、真偽値の`streaming`、および`nativeStreaming`は自動移行されます。
- 配信ターゲットには`user:<id>`（DM）または`channel:<id>`を使用してください。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist`から）。

**Thread session分離:** `thread.historyScope`はthreadごと（デフォルト）またはchannel共有です。`thread.inheritParent`は親channelのtranscriptを新しいthreadにコピーします。

- Slackネイティブストリーミングと、Slackアシスタント風の「is typing...」threadステータスには返信threadターゲットが必要です。トップレベルDMはデフォルトでthread外のままなので、thread風プレビューの代わりに`typingReaction`または通常配信を使います。
- `typingReaction`は、返信実行中に受信Slackメッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"`のようなSlack絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`: Slackネイティブのexec承認配信と承認者認可。Discordと同じschemaです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack user ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または`"both"`）。

| Action group | Default | Notes                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | リアクション + リアクション一覧 |
| messages     | enabled | 読み取り/送信/編集/削除  |
| pins         | enabled | ピン留め/解除/一覧         |
| memberInfo   | enabled | メンバー情報            |
| emojiList    | enabled | カスタム絵文字一覧        |

### Mattermost

MattermostはPluginとして提供されます: `openclaw plugins install @openclaw/mattermost`。

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
        native: true, // オプトイン
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // リバースプロキシ/公開デプロイ向けの任意の明示URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャットモード: `oncall`（@-mentionで応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガー接頭辞で始まるメッセージ）。

Mattermostネイティブコマンドが有効な場合:

- `commands.callbackPath`はフルURLではなくパスである必要があります（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl`はOpenClaw gateway endpointを解決し、Mattermost serverから到達可能である必要があります。
- ネイティブスラッシュコールバックは、スラッシュコマンド登録時にMattermostから返されるコマンドごとのトークンで認証されます。登録に失敗した場合、または有効化されたコマンドがない場合、OpenClawはコールバックを`Unauthorized: invalid command token.`で拒否します。
- private/tailnet/internalなコールバックhostでは、Mattermostで`ServiceSettings.AllowedUntrustedInternalConnections`にコールバックhost/domainを含める必要がある場合があります。フルURLではなくhost/domain値を使用してください。
- `channels.mattermost.configWrites`: Mattermost起点のconfig書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: channelで返信する前に`@mention`を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: channelごとのメンション必須制御の上書き（デフォルトには`"*"`）。
- 任意の`channels.mattermost.defaultAccount`は、設定済みアカウントIDと一致する場合、デフォルトアカウント選択を上書きします。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 任意のアカウントバインド
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

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist`から）。

- `channels.signal.account`: channelの起動先を特定のSignal account identityに固定します。
- `channels.signal.configWrites`: Signal起点のconfig書き込みを許可または拒否します。
- 任意の`channels.signal.defaultAccount`は、設定済みアカウントIDと一致する場合、デフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubblesは推奨されるiMessage経路です（Pluginバックエンド、`channels.bluebubbles`配下で設定）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // /channels/bluebubbles を参照
    },
  },
}
```

- ここで扱うコアキーパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 任意の`channels.bluebubbles.defaultAccount`は、設定済みアカウントIDと一致する場合、デフォルトアカウント選択を上書きします。
- `type: "acp"`を持つトップレベルの`bindings[]`エントリは、BlueBubbles会話を永続的なACP sessionにバインドできます。`match.peer.id`にはBlueBubbles handleまたはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共通フィールドセマンティクス: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全なBlueBubbles channel設定は[BlueBubbles](/ja-JP/channels/bluebubbles)に記載されています。

### iMessage

OpenClawは`imsg rpc`（stdio経由のJSON-RPC）を起動します。daemonやportは不要です。

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

- 任意の`channels.imessage.defaultAccount`は、設定済みアカウントIDと一致する場合、デフォルトアカウント選択を上書きします。

- Messages DBへのFull Disk Accessが必要です。
- `chat_id:<id>`ターゲットを推奨します。チャット一覧の表示には`imsg chats --limit 20`を使用してください。
- `cliPath`はSSH wrapperを指すこともできます。添付取得にSCPを使う場合は`remoteHost`（`host`または`user@host`）を設定してください。
- `attachmentRoots`と`remoteAttachmentRoots`は、受信添付パスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCPは厳格なhost-keyチェックを使用するため、中継hostのキーがすでに`~/.ssh/known_hosts`に存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage起点のconfig書き込みを許可または拒否します。
- `type: "acp"`を持つトップレベルの`bindings[]`エントリは、iMessage会話を永続的なACP sessionにバインドできます。`match.peer.id`には正規化されたhandleまたは明示的なchatターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共通フィールドセマンティクス: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH wrapperの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

MatrixはPluginバックエンドで、`channels.matrix`配下で設定します。

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

- トークン認証は`accessToken`を使い、パスワード認証は`userId` + `password`を使います。
- `channels.matrix.proxy`は、MatrixのHTTPトラフィックを明示的なHTTP(S)プロキシ経由にします。名前付きアカウントは`channels.matrix.accounts.<id>.proxy`で上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`は、private/internal homeserverを許可します。`proxy`とこのnetworkオプトインは独立した制御です。
- `channels.matrix.defaultAccount`は、複数アカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin`のデフォルトは`off`であるため、`autoJoin: "allowlist"`と`autoJoinAllowlist`、または`autoJoin: "always"`を設定するまで、招待されたroomや新しいDM形式の招待は無視されます。
- `channels.matrix.execApprovals`: Matrixネイティブのexec承認配信と承認者認可。
  - `enabled`: `true`、`false`、または`"auto"`（デフォルト）。autoモードでは、`approvers`または`commands.ownerAllowFrom`から承認者を解決できる場合にexec承認が有効化されます。
  - `approvers`: exec要求を承認できるMatrix user ID（例: `@owner:example.org`）。
  - `agentFilter`: 任意のagent ID許可リスト。省略するとすべてのagentの承認を転送します。
  - `sessionFilter`: 任意のsession keyパターン（部分文字列またはregex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（元のroom）、または`"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope`は、Matrix DMをどのようにsessionへまとめるかを制御します。`per-user`（デフォルト）はルーティングされたpeer単位で共有し、`per-room`は各DM roomを分離します。
- Matrixのstatus probeとライブdirectory lookupは、ランタイムトラフィックと同じプロキシポリシーを使います。
- 完全なMatrix設定、ターゲティングルール、セットアップ例は[Matrix](/ja-JP/channels/matrix)に記載されています。

### Microsoft Teams

Microsoft TeamsはPluginバックエンドで、`channels.msteams`配下で設定します。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // /channels/msteams を参照
    },
  },
}
```

- ここで扱うコアキーパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全なTeams設定（credential、Webhook、DM/group policy、teamごと/channelごとの上書き）は[Microsoft Teams](/ja-JP/channels/msteams)に記載されています。

### IRC

IRCはPluginバックエンドで、`channels.irc`配下で設定します。

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
- 任意の`channels.irc.defaultAccount`は、設定済みアカウントIDと一致する場合、デフォルトアカウント選択を上書きします。
- 完全なIRC channel設定（host/port/TLS/channels/allowlists/mention gating）は[IRC](/ja-JP/channels/irc)に記載されています。

### 複数アカウント（全チャンネル共通）

channelごとに複数のアカウントを実行できます（それぞれ独自の`accountId`を持ちます）。

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

- `accountId`が省略された場合は`default`が使われます（CLI + routing）。
- envトークンは**default**アカウントにのみ適用されます。
- ベースのchannel設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別のagentにルーティングするには`bindings[].match.accountId`を使います。
- `openclaw channels add`（またはchannel onboarding）で、まだ単一アカウントのトップレベルchannel configのまま非defaultアカウントを追加すると、OpenClawはまずアカウントスコープのトップレベル単一アカウント値をchannel account mapへ昇格させ、元のアカウントが引き続き動作するようにします。多くのchannelではこれらを`channels.<channel>.accounts.default`へ移動しますが、Matrixでは既存の一致する名前付き/defaultターゲットを保持できる場合があります。
- 既存のchannel専用binding（`accountId`なし）は引き続きdefaultアカウントに一致します。アカウントスコープbindingは引き続き任意です。
- `openclaw doctor --fix`も、アカウントスコープのトップレベル単一アカウント値を、そのchannel向けに選ばれた昇格先アカウントへ移動することで、混在した形状を修復します。多くのchannelでは`accounts.default`を使いますが、Matrixでは既存の一致する名前付き/defaultターゲットを保持できる場合があります。

### その他のPluginチャンネル

多くのPlugin channelは`channels.<id>`として設定され、それぞれの専用channelページに記載されています（たとえばFeishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なchannel一覧は[Channels](/ja-JP/channels)を参照してください。

### グループチャットのメンション必須制御

グループメッセージはデフォルトで**メンション必須**です（メタデータメンションまたは安全なregexパターン）。WhatsApp、Telegram、Discord、Google Chat、iMessageのグループチャットに適用されます。

**メンション種別:**

- **メタデータメンション**: ネイティブプラットフォームの@-mention。WhatsApp self-chatモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns`にある安全なregexパターン。無効なパターンや安全でないネストされた繰り返しは無視されます。
- メンション必須制御は、検出可能な場合にのみ適用されます（ネイティブメンションまたは少なくとも1つのパターンがある場合）。

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

`messages.groupChat.historyLimit`はグローバルデフォルトを設定します。channelは`channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効にするには`0`を設定してください。

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

解決順序: DMごとの上書き → providerデフォルト → 上限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### Self-chatモード

自分の番号を`allowFrom`に含めるとself-chatモードが有効になります（ネイティブ@-mentionを無視し、テキストパターンにのみ応答します）。

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

### コマンド（チャットコマンド処理）

```json5
{
  commands: {
    native: "auto", // 対応時にネイティブコマンドを登録
    nativeSkills: "auto", // 対応時にネイティブSkillsコマンドを登録
    text: true, // チャットメッセージ中の /commands を解析
    bash: false, // ! を許可（別名: /bash）
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

<Accordion title="コマンドの詳細">

- このブロックはコマンドサーフェスを設定します。現在の組み込み + bundledコマンドカタログについては[Slash Commands](/ja-JP/tools/slash-commands)を参照してください。
- このページは**configキーのリファレンス**であり、完全なコマンドカタログではありません。QQ Botの`/bot-ping` `/bot-help` `/bot-logs`、LINEの`/card`、device-pairの`/pair`、memoryの`/dreaming`、phone-controlの`/phone`、Talkの`/voice`など、channel/pluginが所有するコマンドは、それぞれのchannel/pluginページと[Slash Commands](/ja-JP/tools/slash-commands)に記載されています。
- テキストコマンドは、先頭が`/`の**単独メッセージ**である必要があります。
- `native: "auto"`は、Discord/Telegramではネイティブコマンドを有効にし、Slackでは無効のままにします。
- `nativeSkills: "auto"`は、Discord/TelegramではネイティブSkillsコマンドを有効にし、Slackでは無効のままにします。
- channelごとの上書き: `channels.discord.commands.native`（boolまたは`"auto"`）。`false`にすると以前登録したコマンドをクリアします。
- ネイティブskill登録は`channels.<provider>.commands.nativeSkills`でchannelごとに上書きできます。
- `channels.telegram.customCommands`は、Telegramボットメニューに追加エントリを加えます。
- `bash: true`は、ホストshell向けの`! <cmd>`を有効にします。`tools.elevated.enabled`と、送信者が`tools.elevated.allowFrom.<channel>`に含まれていることが必要です。
- `config: true`は`/config`を有効にします（`openclaw.json`の読み書き）。gateway `chat.send` clientでは、永続的な`/config set|unset`書き込みには`operator.admin`も必要です。読み取り専用の`/config show`は、通常のwriteスコープoperator clientでも引き続き利用できます。
- `mcp: true`は、`mcp.servers`配下のOpenClaw管理MCP server設定向けに`/mcp`を有効にします。
- `plugins: true`は、Pluginの検出、インストール、有効化/無効化制御向けに`/plugins`を有効にします。
- `channels.<provider>.configWrites`は、channelごとのconfig変更を制御します（デフォルト: true）。
- 複数アカウントchannelでは、`channels.<provider>.accounts.<id>.configWrites`も、そのアカウントを対象とする書き込み（たとえば`/allowlist --config --account <id>`や`/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false`は、`/restart`とgateway restart toolアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom`は、owner専用コマンド/tool向けの明示的なowner許可リストです。`allowFrom`とは別です。
- `ownerDisplay: "hash"`は、system prompt内のowner IDをハッシュ化します。ハッシュ化を制御するには`ownerDisplaySecret`を設定してください。
- `allowFrom`はproviderごとです。設定されている場合、それが**唯一の**認可ソースになります（channelのallowlist/ペアリングと`useAccessGroups`は無視されます）。
- `useAccessGroups: false`は、`allowFrom`が設定されていない場合に、コマンドがaccess-groupポリシーをバイパスできるようにします。
- コマンドドキュメントの対応表:
  - 組み込み + bundledカタログ: [Slash Commands](/ja-JP/tools/slash-commands)
  - channel固有のコマンドサーフェス: [Channels](/ja-JP/channels)
  - QQ Botコマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [Pairing](/ja-JP/channels/pairing)
  - LINEのcardコマンド: [LINE](/ja-JP/channels/line)
  - Memory Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

system promptのRuntime行に表示される任意のrepository rootです。未設定の場合、OpenClawはworkspaceから上方向にたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`を設定していないagent向けの、任意のデフォルトskill許可リストです。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weatherを継承
      { id: "docs", skills: ["docs-search"] }, // defaultsを置き換える
      { id: "locked-down", skills: [] }, // skillsなし
    ],
  },
}
```

- デフォルトでskillsを無制限にするには`agents.defaults.skills`を省略します。
- defaultsを継承するには`agents.list[].skills`を省略します。
- skillsなしにするには`agents.list[].skills: []`を設定します。
- 空でない`agents.list[].skills`リストは、そのagentの最終セットになります。defaultsとはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrapファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrapファイルをsystem promptへ注入するタイミングを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 完了済みassistant応答後の安全な継続ターンでは、workspace bootstrapの再注入をスキップし、promptサイズを削減します。Heartbeat実行とCompaction後の再試行では、引き続きcontext全体を再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の、workspace bootstrapファイルごとの最大文字数です。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのworkspace bootstrapファイルにわたって注入される合計最大文字数です。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap contextが切り詰められたときの、agentに見える警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: system promptに警告テキストを一切注入しません。
- `"once"`: 一意な切り詰めシグネチャごとに1回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めが存在する場合、毎回の実行で警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClawには高ボリュームのprompt/context予算が複数あり、それらは1つの汎用ノブにまとめるのではなく、サブシステムごとに意図的に分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常のworkspace bootstrap注入。
- `agents.defaults.startupContext.*`:
  1回限りの`/new`および`/reset`起動プレリュード。最近の`memory/*.md`ファイルを含みます。
- `skills.limits.*`:
  system promptに注入されるコンパクトなSkills一覧。
- `agents.defaults.contextLimits.*`:
  制限付きのruntime抜粋およびruntime所有ブロックの注入。
- `memory.qmd.limits.*`:
  インデックス化されたmemory検索スニペットと注入サイズ設定。

特定のagentだけ別の予算が必要な場合にのみ、対応するagentごとの上書きを使ってください。

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

素の`/new`および`/reset`実行時に注入される、最初のターンの起動プレリュードを制御します。

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

制限付きruntime contextサーフェス向けの共有デフォルトです。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: 切り詰めメタデータと継続通知を追加する前の、デフォルトの`memory_get`抜粋上限。
- `memoryGetDefaultLines`: `lines`が省略されたときのデフォルトの`memory_get`行ウィンドウ。
- `toolResultMaxChars`: 永続化結果とオーバーフロー回復に使われる、ライブtool結果の上限。
- `postCompactionMaxChars`: Compaction後の再注入で使われる`AGENTS.md`抜粋上限。

#### `agents.list[].contextLimits`

共有`contextLimits`ノブに対するagentごとの上書きです。省略されたフィールドは`agents.defaults.contextLimits`を継承します。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

system promptに注入されるコンパクトなSkills一覧のグローバル上限です。
これは、必要に応じて`SKILL.md`ファイルを読む動作には影響しません。

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

skills prompt予算に対するagentごとの上書きです。

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

provider呼び出し前に、transcript/toolの画像ブロックで最長辺に許容される最大ピクセルサイズです。
デフォルト: `1200`。

通常、値を小さくすると、スクリーンショットの多い実行でvision token使用量とリクエストpayloadサイズを削減できます。
値を大きくすると、より多くの視覚的詳細を保持できます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

system prompt context用のタイムゾーンです（メッセージタイムスタンプ用ではありません）。未設定時はホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt内の時刻形式です。デフォルト: `auto`（OS設定に従う）。

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
        primary: "openai/gpt-image-2",
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
      params: { cacheRetention: "long" }, // グローバルデフォルトのprovider params
      embeddedHarness: {
        runtime: "auto", // auto | pi | 登録済みharness id（例: codex）
        fallback: "pi", // pi | none
      },
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

- `model`: 文字列（`"provider/model"`）またはobject（`{ primary, fallbacks }`）を受け付けます。
  - 文字列形式はprimary modelのみを設定します。
  - object形式はprimaryに加えて順序付きfailover modelを設定します。
- `imageModel`: 文字列（`"provider/model"`）またはobject（`{ primary, fallbacks }`）を受け付けます。
  - `image` tool経路でvision-model設定として使われます。
  - 選択中/デフォルトのmodelが画像入力を受け付けられない場合のフォールバックルーティングにも使われます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはobject（`{ primary, fallbacks }`）を受け付けます。
  - 共通の画像生成機能と、将来画像を生成するtool/pluginサーフェスでも使われます。
  - 代表的な値: ネイティブGemini画像生成には`google/gemini-3.1-flash-image-preview`、falには`fal/fal-ai/flux/dev`、OpenAI Imagesには`openai/gpt-image-2`。
  - provider/modelを直接選ぶ場合は、対応するprovider auth/APIキーも設定してください（たとえば`google/*`には`GEMINI_API_KEY`または`GOOGLE_API_KEY`、`openai/*`には`OPENAI_API_KEY`、`fal/*`には`FAL_KEY`）。
  - 省略しても、`image_generate`はauth済みproviderのデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み画像生成providerをprovider-id順に試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはobject（`{ primary, fallbacks }`）を受け付けます。
  - 共通の音楽生成機能と、組み込みの`music_generate` toolで使われます。
  - 代表的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、`minimax/music-2.5+`。
  - 省略しても、`music_generate`はauth済みproviderのデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み音楽生成providerをprovider-id順に試します。
  - provider/modelを直接選ぶ場合は、対応するprovider auth/APIキーも設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはobject（`{ primary, fallbacks }`）を受け付けます。
  - 共通の動画生成機能と、組み込みの`video_generate` toolで使われます。
  - 代表的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、`qwen/wan2.7-r2v`。
  - 省略しても、`video_generate`はauth済みproviderのデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、残りの登録済み動画生成providerをprovider-id順に試します。
  - provider/modelを直接選ぶ場合は、対応するprovider auth/APIキーも設定してください。
  - 同梱のQwen動画生成providerは、最大1本の出力動画、1枚の入力画像、4本の入力動画、10秒の長さ、およびproviderレベルの`size`、`aspectRatio`、`resolution`、`audio`、`watermark`オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはobject（`{ primary, fallbacks }`）を受け付けます。
  - `pdf` toolのmodelルーティングに使われます。
  - 省略時、PDF toolは`imageModel`にフォールバックし、その後、解決済みのsession/default modelにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に`maxBytesMb`が渡されない場合の、`pdf` tool用デフォルトPDFサイズ上限。
- `pdfMaxPages`: `pdf` toolの抽出フォールバックモードで考慮するデフォルト最大ページ数。
- `verboseDefault`: agentのデフォルトverboseレベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: agentのデフォルトelevated-outputレベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は`provider/model`（例: `openai/gpt-5.4`）。providerを省略した場合、OpenClawはまずaliasを試し、次にその正確なmodel idに対する一意なconfigured-provider一致を試し、それでもなければ設定済みデフォルトproviderにフォールバックします（非推奨の互換動作なので、明示的な`provider/model`を推奨します）。そのproviderが設定済みデフォルトmodelをもう提供していない場合、OpenClawは古くなった削除済みproviderデフォルトを表示する代わりに、最初のconfigured provider/modelへフォールバックします。
- `models`: `/model`向けの設定済みmodel catalogおよびallowlist。各エントリには`alias`（ショートカット）と`params`（provider固有。たとえば`temperature`、`maxTokens`、`cacheRetention`、`context1m`）を含められます。
- `params`: すべてのmodelに適用されるグローバルデフォルトproviderパラメータ。`agents.defaults.params`で設定します（例: `{ cacheRetention: "long" }`）。
- `params`のマージ優先順位（config）: `agents.defaults.params`（グローバルベース）を`agents.defaults.models["provider/model"].params`（modelごと）が上書きし、その後`agents.list[].params`（一致するagent id）がキー単位で上書きします。詳細は[Prompt Caching](/ja-JP/reference/prompt-caching)を参照してください。
- `embeddedHarness`: デフォルトの低レベル埋め込みagent runtimeポリシー。`runtime: "auto"`を使うと、登録済みplugin harnessが対応modelを引き受けられるようになります。`runtime: "pi"`は組み込みPI harnessを強制し、`runtime: "codex"`のように登録済みharness idも指定できます。自動PIフォールバックを無効にするには`fallback: "none"`を設定します。
- これらのフィールドを変更するconfig writer（たとえば`/models set`、`/models set-image`、fallback追加/削除コマンド）は、正規のobject形式で保存し、可能な限り既存のfallbackリストを保持します。
- `maxConcurrent`: sessionをまたいだagent実行の最大並列数です（各session内は引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.embeddedHarness`

`embeddedHarness`は、埋め込みagent turnを実行する低レベルexecutorを制御します。
ほとんどのデプロイでは、デフォルトの`{ runtime: "auto", fallback: "pi" }`のままで問題ありません。
同梱のCodex app-server harnessのように、信頼できるpluginがネイティブharnessを提供する場合に使ってください。

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`、`"pi"`、または登録済みplugin harness id。同梱のCodex Pluginは`codex`を登録します。
- `fallback`: `"pi"`または`"none"`。`"pi"`は互換フォールバックとして組み込みPI harnessを維持します。`"none"`は、plugin harnessの選択が欠落または未対応の場合に、黙ってPIを使わず失敗させます。
- 環境変数による上書き: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>`は`runtime`を上書きし、`OPENCLAW_AGENT_HARNESS_FALLBACK=none`はそのprocessでPIフォールバックを無効にします。
- Codex専用デプロイでは、`model: "codex/gpt-5.4"`、`embeddedHarness.runtime: "codex"`、`embeddedHarness.fallback: "none"`を設定してください。
- これは埋め込みchat harnessのみを制御します。メディア生成、vision、PDF、音楽、動画、TTSは引き続きそれぞれのprovider/model設定を使います。

**組み込みalias短縮形**（modelが`agents.defaults.models`にある場合のみ適用）:

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

Z.AI GLM-4.x modelは、`--thinking off`を設定するか、`agents.defaults.models["zai/<model>"].params.thinking`を自分で定義しない限り、自動的にthinking modeを有効にします。
Z.AI modelは、tool callストリーミング向けにデフォルトで`tool_stream`を有効にします。無効にするには`agents.defaults.models["zai/<model>"].params.tool_stream`を`false`に設定してください。
Anthropic Claude 4.6 modelは、明示的なthinkingレベルが設定されていない場合、デフォルトでadaptive thinkingになります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行（tool callなし）向けの任意のCLI backendです。API providerが失敗したときのバックアップとして便利です。

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

- CLI backendはテキスト優先で、toolは常に無効です。
- `sessionArg`が設定されていればsessionをサポートします。
- `imageArg`がファイルパスを受け付ける場合、画像のパススルーに対応します。

### `agents.defaults.systemPromptOverride`

OpenClawが組み立てたsystem prompt全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）またはagentごと（`agents.list[].systemPromptOverride`）で設定します。agentごとの値が優先され、空文字または空白のみの値は無視されます。制御されたprompt実験に便利です。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "あなたは役立つアシスタントです。",
    },
  },
}
```

### `agents.defaults.heartbeat`

定期的なHeartbeat実行です。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0mで無効
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // デフォルト: true。falseの場合、system promptからHeartbeatセクションを省略
        lightContext: false, // デフォルト: false。trueの場合、workspace bootstrapファイルからHEARTBEAT.mdのみ保持
        isolatedSession: false, // デフォルト: false。trueの場合、各Heartbeatを新規sessionで実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト）| block
        target: "none", // デフォルト: none | 選択肢: last | whatsapp | telegram | discord | ...
        prompt: "存在する場合はHEARTBEAT.mdを読んでください...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API-key auth）または`1h`（OAuth auth）。無効にするには`0m`を設定します。
- `includeSystemPromptSection`: falseの場合、system promptからHeartbeatセクションを省略し、bootstrap contextへの`HEARTBEAT.md`注入もスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: trueの場合、Heartbeat実行中のtool error警告payloadを抑制します。
- `timeoutSeconds`: 中断されるまでのHeartbeat agent turnの最大秒数。未設定の場合は`agents.defaults.timeoutSeconds`を使用します。
- `directPolicy`: direct/DM配信ポリシー。`allow`（デフォルト）はdirect-target配信を許可します。`block`はdirect-target配信を抑止し、`reason=dm-blocked`を出力します。
- `lightContext`: trueの場合、Heartbeat実行は軽量なbootstrap contextを使い、workspace bootstrapファイルのうち`HEARTBEAT.md`のみを保持します。
- `isolatedSession`: trueの場合、各Heartbeatは以前の会話履歴なしの新規sessionで実行されます。Cronの`sessionTarget: "isolated"`と同じ分離パターンです。Heartbeatごとのtokenコストを約100Kから約2～5K tokenへ削減します。
- agentごと: `agents.list[].heartbeat`を設定します。いずれかのagentが`heartbeat`を定義すると、Heartbeatを実行するのは**そのagentだけ**になります。
- Heartbeatは完全なagent turnを実行します。短い間隔ほどtoken消費が増えます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済みCompaction provider Pluginのid（任意）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "デプロイID、チケットID、host:portペアを正確に保持してください。", // identifierPolicy=custom のときに使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // Compaction専用の任意のmodel上書き
        notifyUser: true, // Compaction開始時と完了時に短い通知を送信（デフォルト: false）
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "セッションがCompactionに近づいています。永続的な記憶を今保存してください。",
          prompt: "lasting notesがあればmemory/YYYY-MM-DD.mdに書き込み、保存するものがなければ正確なsilent token NO_REPLYで応答してください。",
        },
      },
    },
  },
}
```

- `mode`: `default`または`safeguard`（長い履歴向けのチャンク分割要約）。[Compaction](/ja-JP/concepts/compaction)を参照してください。
- `provider`: 登録済みCompaction provider Pluginのid。設定すると、組み込みのLLM要約の代わりにそのproviderの`summarize()`が呼ばれます。失敗時は組み込みへフォールバックします。providerを設定すると`mode: "safeguard"`が強制されます。[Compaction](/ja-JP/concepts/compaction)を参照してください。
- `timeoutSeconds`: OpenClawが中断するまでに1回のCompaction処理に許可される最大秒数。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または`custom`。`strict`は、Compaction要約時に組み込みの不透明識別子保持ガイダンスを先頭に付加します。
- `identifierInstructions`: `identifierPolicy=custom`のときに使う任意のカスタム識別子保持テキスト。
- `postCompactionSections`: Compaction後に再注入する任意の`AGENTS.md` H2/H3セクション名。デフォルトは`["Session Startup", "Red Lines"]`です。再注入を無効にするには`[]`を設定します。未設定、または明示的にそのデフォルトの組み合わせを設定した場合、旧来の`Every Session`/`Safety`見出しもレガシーフォールバックとして受け付けます。
- `model`: Compaction要約専用の任意の`provider/model-id`上書き。メインsessionは1つのmodelを使い続けつつ、Compaction要約だけ別のmodelで実行したい場合に使います。未設定時はCompactionはsessionのprimary modelを使います。
- `notifyUser`: `true`の場合、Compaction開始時と完了時に短い通知をユーザーへ送信します（例: 「コンテキストをCompaction中...」「Compaction完了」）。デフォルトでは無効で、Compactionを無言で行います。
- `memoryFlush`: 自動Compaction前に永続的な記憶を保存する、無言のagentic turnです。workspaceがread-onlyの場合はスキップされます。

### `agents.defaults.contextPruning`

LLMへ送る前に、メモリ上のcontextから**古いtool結果**を刈り込みます。ディスク上のsession履歴は**変更しません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 期間（ms/s/m/h）、デフォルト単位: 分
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[古いtool結果の内容をクリアしました]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttlモードの動作">

- `mode: "cache-ttl"`で刈り込みパスを有効にします。
- `ttl`は、最後のcache touch後に再び刈り込みを実行できるまでの間隔を制御します。
- 刈り込みはまず大きすぎるtool結果をsoft-trimし、その後必要に応じて古いtool結果をhard-clearします。

**Soft-trim**では、先頭 + 末尾を保持し、中間に`...`を挿入します。

**Hard-clear**では、tool結果全体をplaceholderに置き換えます。

注意:

- 画像ブロックは切り詰めもクリアもされません。
- 比率は文字数ベース（概算）であり、厳密なtoken数ではありません。
- `keepLastAssistants`個未満のassistantメッセージしか存在しない場合、刈り込みはスキップされます。

</Accordion>

動作の詳細は[Session Pruning](/ja-JP/concepts/session-pruning)を参照してください。

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（minMs/maxMsを使用）
    },
  },
}
```

- Telegram以外のchannelでは、block replyを有効にするために明示的な`*.blockStreaming: true`が必要です。
- channelごとの上書き: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとの派生設定）。Signal/Slack/Discord/Google Chatのデフォルトは`minChars: 1500`です。
- `humanDelay`: block reply間のランダムな待機。`natural` = 800〜2500ms。agentごとの上書き: `agents.list[].humanDelay`。

動作とチャンク分割の詳細は[Streaming](/ja-JP/concepts/streaming)を参照してください。

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

- デフォルト: ダイレクトチャット/メンションでは`instant`、メンションなしのグループチャットでは`message`。
- sessionごとの上書き: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators)を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

埋め込みagent向けの任意のsandbox化です。完全なガイドは[Sandboxing](/ja-JP/gateway/sandboxing)を参照してください。

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
          // SecretRef / インライン内容にも対応:
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

- `docker`: ローカルDocker runtime（デフォルト）
- `ssh`: 汎用SSHバックエンドのremote runtime
- `openshell`: OpenShell runtime

`backend: "openshell"`を選んだ場合、runtime固有設定は
`plugins.entries.openshell.config`へ移ります。

**SSH backend設定:**

- `target`: `user@host[:port]`形式のSSH target
- `command`: SSH clientコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとのworkspaceに使う絶対remote root
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSHに渡す既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClawがruntime時に一時ファイルへ実体化するインライン内容またはSecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSHのhost-keyポリシーノブ

**SSH authの優先順位:**

- `identityData`が`identityFile`より優先
- `certificateData`が`certificateFile`より優先
- `knownHostsData`が`knownHostsFile`より優先
- SecretRefバックエンドの`*Data`値は、sandbox session開始前にアクティブなsecrets runtime snapshotから解決されます

**SSH backendの動作:**

- 作成または再作成後にremote workspaceを一度だけseedする
- その後はremote SSH workspaceを正規状態として維持する
- `exec`、file tools、media pathをSSH経由でルーティングする
- remoteの変更は自動ではhostへ同期しない
- sandbox browser containerはサポートしない

**Workspace access:**

- `none`: `~/.openclaw/sandboxes`配下のスコープごとのsandbox workspace
- `ro`: `/workspace`にsandbox workspace、`/agent`にagent workspaceをread-onlyでmount
- `rw`: agent workspaceを`/workspace`にread/writeでmount

**Scope:**

- `session`: sessionごとのcontainer + workspace
- `agent`: agentごとに1つのcontainer + workspace（デフォルト）
- `shared`: 共有containerおよびworkspace（session間分離なし）

**OpenShell Plugin設定:**

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

**OpenShellモード:**

- `mirror`: 実行前にlocalからremoteへseedし、実行後に同期し戻す。local workspaceが正規状態のまま
- `remote`: sandbox作成時に一度だけremoteへseedし、その後はremote workspaceを正規状態として維持

`remote`モードでは、seed後にOpenClaw外で行われたhost側のlocal編集は、自動ではsandboxへ同期されません。
転送自体はOpenShell sandboxへのSSHですが、sandboxライフサイクルと任意のmirror同期はPluginが管理します。

**`setupCommand`**はcontainer作成後に一度だけ（`sh -lc`経由で）実行されます。network egress、書き込み可能なroot、root userが必要です。

**Containerのデフォルトは`network: "none"`**です。agentに外向きアクセスが必要な場合は`"bridge"`（またはカスタムbridge network）に設定してください。
`"host"`は禁止されています。`"container:<id>"`もデフォルトでは禁止で、
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`を明示的に設定した場合のみ許可されます（緊急時対応）。

**受信添付**は、アクティブworkspaceの`media/inbound/*`にステージングされます。

**`docker.binds`**は追加のhost directoryをmountします。グローバル設定とagentごとのbindはマージされます。

**Sandbox化されたbrowser**（`sandbox.browser.enabled`）: container内のChromium + CDP。noVNC URLがsystem promptに注入されます。`openclaw.json`で`browser.enabled`を必要としません。
noVNCのobserverアクセスはデフォルトでVNC authを使用し、OpenClawは共有URLにパスワードを露出する代わりに短命なトークンURLを発行します。

- `allowHostControl: false`（デフォルト）は、sandbox化されたsessionがhost browserを対象にすることをブロックします。
- `network`のデフォルトは`openclaw-sandbox-browser`（専用bridge network）です。グローバルbridge接続が明示的に必要な場合にのみ`bridge`へ設定してください。
- `cdpSourceRange`は、container境界でのCDP流入元をCIDR範囲に任意で制限します（例: `172.21.0.1/32`）。
- `sandbox.browser.binds`は、追加のhost directoryをsandbox browser containerのみにmountします。設定されている場合（`[]`を含む）、browser containerでは`docker.binds`の代わりにこれが使われます。
- 起動デフォルトは`scripts/sandbox-browser-entrypoint.sh`で定義されており、container host向けに調整されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT から導出>`
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
  - `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`は
    デフォルトで有効で、WebGL/3Dの使用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`で無効化できます。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`で、ワークフローが拡張機能に
    依存している場合に拡張機能を再有効化できます。
  - `--renderer-process-limit=2`は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`で変更できます。Chromiumの
    デフォルトのprocess上限を使うには`0`を設定してください。
  - さらに、`noSandbox`が有効な場合は`--no-sandbox`と`--disable-setuid-sandbox`。
  - デフォルトはcontainer imageのベースラインです。containerデフォルトを変更するには、
    カスタムbrowser imageとカスタムentrypointを使用してください。

</Accordion>

browser sandbox化と`sandbox.docker.binds`はDocker専用です。

imageをビルド:

```bash
scripts/sandbox-setup.sh           # メインsandbox image
scripts/sandbox-browser-setup.sh   # 任意のbrowser image
```

### `agents.list`（agentごとの上書き）

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
        thinkingDefault: "high", // agentごとのthinking level上書き
        reasoningDefault: "on", // agentごとのreasoning可視性上書き
        fastModeDefault: false, // agentごとのfast mode上書き
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 一致するdefaults.models paramsをキー単位で上書き
        skills: ["docs-search"], // 設定時はagents.defaults.skillsを置き換える
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

- `id`: 安定したagent ID（必須）。
- `default`: 複数設定されている場合は最初のものが優先されます（警告を記録）。どれも設定されていない場合、リストの最初のエントリがデフォルトです。
- `model`: 文字列形式は`primary`のみを上書きし、object形式`{ primary, fallbacks }`は両方を上書きします（`[]`でグローバルfallbackを無効化）。`primary`だけを上書きするCron jobは、`fallbacks: []`を設定しない限りデフォルトfallbackを継承します。
- `params`: `agents.defaults.models`内の選択されたmodelエントリにマージされるagentごとのstream paramsです。model catalog全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens`のようなagent固有の上書きに使います。
- `skills`: 任意のagentごとのskill許可リスト。省略すると、設定されていればagentは`agents.defaults.skills`を継承します。明示的なリストはdefaultsをマージせずに置き換え、`[]`はskillsなしを意味します。
- `thinkingDefault`: 任意のagentごとのデフォルトthinking level（`off | minimal | low | medium | high | xhigh | adaptive | max`）。メッセージごとまたはsessionごとの上書きがない場合、このagentの`agents.defaults.thinkingDefault`を上書きします。
- `reasoningDefault`: 任意のagentごとのデフォルトreasoning可視性（`on | off | stream`）。メッセージごとまたはsessionごとのreasoning上書きがない場合に適用されます。
- `fastModeDefault`: 任意のagentごとのfast modeデフォルト（`true | false`）。メッセージごとまたはsessionごとのfast-mode上書きがない場合に適用されます。
- `embeddedHarness`: 任意のagentごとの低レベルharnessポリシー上書き。1つのagentだけをCodex専用にし、他のagentはデフォルトのPIフォールバックを維持したい場合は`{ runtime: "codex", fallback: "none" }`を使います。
- `runtime`: 任意のagentごとのruntime descriptor。agentがデフォルトでACP harness sessionを使うべき場合は、`type: "acp"`と`runtime.acp`デフォルト（`agent`、`backend`、`mode`、`cwd`）を使います。
- `identity.avatar`: workspace相対パス、`http(s)` URL、または`data:` URI。
- `identity`はデフォルトを導出します。`ackReaction`は`emoji`から、`mentionPatterns`は`name`/`emoji`から導出されます。
- `subagents.allowAgents`: `sessions_spawn`向けのagent ID許可リスト（`["*"]` = 任意、デフォルト: 同じagentのみ）。
- Sandbox継承ガード: 要求元sessionがsandbox化されている場合、`sessions_spawn`はsandboxなしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: trueの場合、`agentId`を省略した`sessions_spawn`呼び出しをブロックします（明示的なprofile選択を強制。デフォルト: false）。

---

## マルチエージェントルーティング

1つのGateway内で複数の分離されたagentを実行します。[Multi-Agent](/ja-JP/concepts/multi-agent)を参照してください。

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

### Binding一致フィールド

- `type`（任意）: 通常ルーティング用の`route`（type未指定時のデフォルトはroute）、永続的なACP会話binding用の`acp`。
- `match.channel`（必須）
- `match.accountId`（任意。`*` = 任意のアカウント、未指定 = デフォルトアカウント）
- `match.peer`（任意。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（任意。channel固有）
- `acp`（任意。`type: "acp"`の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（厳密一致、peer/guild/teamなし）
5. `match.accountId: "*"`（channel全体）
6. デフォルトagent

各tier内では、最初に一致した`bindings`エントリが優先されます。

`type: "acp"`エントリでは、OpenClawは厳密な会話identity（`match.channel` + account + `match.peer.id`）で解決し、上記のroute binding tier順序は使いません。

### agentごとのアクセスprofile

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

<Accordion title="読み取り専用tool + workspace">

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

優先順位の詳細は[Multi-Agent Sandbox & Tools](/ja-JP/tools/multi-agent-sandbox-tools)を参照してください。

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
    parentForkMaxTokens: 100000, // このtoken数を超えると親thread forkをスキップ（0で無効）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 期間またはfalse
      maxDiskBytes: "500mb", // 任意のハード予算
      highWaterBytes: "400mb", // 任意のクリーンアップ目標
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 非アクティブ時のデフォルト自動unfocus時間（0で無効）
      maxAgeHours: 0, // デフォルトのハード最大有効期間（0で無効）
    },
    mainKey: "main", // legacy（runtimeは常に"main"を使用）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">

- **`scope`**: グループチャット文脈向けの基本sessionグルーピング戦略。
  - `per-sender`（デフォルト）: channel文脈内で送信者ごとに分離されたsessionを使います。
  - `global`: channel文脈内の全参加者が単一sessionを共有します（共有コンテキストを意図している場合のみ使用）。
- **`dmScope`**: DMをどのようにグルーピングするか。
  - `main`: すべてのDMがmain sessionを共有します。
  - `per-peer`: channelをまたいで送信者IDごとに分離します。
  - `per-channel-peer`: channel + 送信者ごとに分離します（複数ユーザーのinboxに推奨）。
  - `per-account-channel-peer`: account + channel + 送信者ごとに分離します（複数アカウントに推奨）。
- **`identityLinks`**: チャンネル横断のsession共有のために、正規IDをprovider接頭辞付きpeerへ対応付けます。
- **`reset`**: 基本resetポリシー。`daily`はローカル時刻の`atHour`でresetし、`idle`は`idleMinutes`後にresetします。両方が設定されている場合は、先に期限切れになるほうが優先されます。
- **`resetByType`**: 種別ごとの上書き（`direct`、`group`、`thread`）。旧`dm`も`direct`のaliasとして受け付けます。
- **`parentForkMaxTokens`**: forkされたthread sessionを作成するときに許可される親sessionの最大`totalTokens`（デフォルト`100000`）。
  - 親の`totalTokens`がこの値を超えている場合、OpenClawは親transcript履歴を継承せず、新しいthread sessionを開始します。
  - このガードを無効にして常に親forkを許可するには`0`を設定します。
- **`mainKey`**: legacyフィールドです。runtimeはmain direct-chat bucketに常に`"main"`を使います。
- **`agentToAgent.maxPingPongTurns`**: agent間のやり取り中に許可される返信往復ターン数の最大値（整数、範囲: `0`–`5`）。`0`はping-pong連鎖を無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`、旧`dm` aliasあり）、`keyPrefix`、または`rawKeyPrefix`で一致させます。最初のdenyが優先されます。
- **`maintenance`**: session-storeのクリーンアップ + 保持制御。
  - `mode`: `warn`は警告のみ出し、`enforce`はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れカットオフ（デフォルト`30d`）。
  - `maxEntries`: `sessions.json`内の最大エントリ数（デフォルト`500`）。
  - `rotateBytes`: `sessions.json`がこのサイズを超えたらローテーションします（デフォルト`10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript archiveの保持期間。デフォルトでは`pruneAfter`に従います。無効にするには`false`を設定します。
  - `maxDiskBytes`: 任意のsessionsディレクトリのディスク予算。`warn`モードでは警告を出し、`enforce`モードでは最も古いartifact/sessionから削除します。
  - `highWaterBytes`: 予算クリーンアップ後の任意の目標値。デフォルトは`maxDiskBytes`の`80%`です。
- **`threadBindings`**: threadバインドsession機能のグローバルデフォルト。
  - `enabled`: マスターのデフォルトスイッチ（providerは上書き可能。Discordでは`channels.discord.threadBindings.enabled`を使用）
  - `idleHours`: 非アクティブ時のデフォルト自動unfocus時間（`0`で無効。providerは上書き可能）
  - `maxAgeHours`: デフォルトのハード最大有効期間（`0`で無効。providerは上書き可能）

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
      debounceMs: 2000, // 0で無効
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 返信プレフィックス

channelごと/アカウントごとの上書き: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（最も具体的なものが優先）: account → channel → global。`""`は無効化して継承を止めます。`"auto"`は`[{identity.name}]`を導出します。

**テンプレート変数:**

| Variable          | 説明                   | 例                          |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短いmodel名            | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なmodel識別子      | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider名             | `anthropic`                 |
| `{thinkingLevel}` | 現在のthinking level   | `high`, `low`, `off`        |
| `{identity.name}` | agent identity名       | （`"auto"`と同じ）          |

変数は大文字小文字を区別しません。`{think}`は`{thinkingLevel}`のaliasです。

### 確認リアクション

- デフォルトはアクティブagentの`identity.emoji`、それがなければ`"👀"`です。無効にするには`""`を設定します。
- channelごとの上書き: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: account → channel → `messages.ackReaction` → identityフォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegramで返信後にackを削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegramでライフサイクルstatus reactionを有効にします。
  SlackとDiscordでは、未設定ならack reactionがアクティブなときにstatus reactionも有効のままになります。
  Telegramでは、ライフサイクルstatus reactionを有効にするには明示的に`true`へ設定してください。

### 受信デバウンス

同じ送信者からの短時間のテキストのみのメッセージを、1つのagent turnにまとめます。media/添付は即時フラッシュされます。制御コマンドはデバウンスをバイパスします。

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

- `auto`はデフォルトの自動TTSモードを制御します: `off`、`always`、`inbound`、`tagged`。`/tts on|off`でローカル設定を上書きでき、`/tts status`で実効状態を確認できます。
- `summaryModel`は、自動要約に対して`agents.defaults.model.primary`を上書きします。
- `modelOverrides`はデフォルトで有効です。`modelOverrides.allowProvider`のデフォルトは`false`（オプトイン）です。
- APIキーは`ELEVENLABS_API_KEY`/`XI_API_KEY`および`OPENAI_API_KEY`にフォールバックします。
- `openai.baseUrl`はOpenAI TTS endpointを上書きします。解決順序はconfig、その後`OPENAI_TTS_BASE_URL`、その後`https://api.openai.com/v1`です。
- `openai.baseUrl`がOpenAI以外のendpointを指している場合、OpenClawはそれをOpenAI互換TTS serverとして扱い、model/voice検証を緩和します。

---

## Talk

Talkモード（macOS/iOS/Android）のデフォルトです。

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

- `talk.provider`は、複数のTalk providerが設定されている場合、`talk.providers`内のキーと一致している必要があります。
- 旧来のフラットなTalkキー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性用のみで、`talk.providers.<provider>`へ自動移行されます。
- Voice IDは`ELEVENLABS_VOICE_ID`または`SAG_VOICE_ID`にフォールバックします。
- `providers.*.apiKey`は、プレーンテキスト文字列またはSecretRef objectを受け付けます。
- `ELEVENLABS_API_KEY`フォールバックは、Talk APIキーがまったく設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases`により、Talk directiveで親しみやすい名前を使えます。
- `silenceTimeoutMs`は、ユーザーが無音になってからTranscriptを送信するまでTalkモードが待機する時間を制御します。未設定の場合はプラットフォームのデフォルトの待機ウィンドウを使用します（`macOSとAndroidでは700 ms、iOSでは900 ms`）。

---

## Tools

### Tool profile

`tools.profile`は、`tools.allow`/`tools.deny`の前にベースallowlistを設定します。

ローカルのオンボーディングでは、未設定の新しいローカルconfigにデフォルトで`tools.profile: "coding"`を設定します（既存の明示的なprofileは保持されます）。

| Profile     | 含まれるもの                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status`のみ                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                |
| `full`      | 制限なし（未設定と同じ）                                                                                                  |

### Tool group

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash`は`exec`のaliasとして受け付けられます）                                      |
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
| `group:openclaw`   | すべての組み込みtool（provider Pluginは除く）                                                                           |

### `tools.allow` / `tools.deny`

グローバルなtool許可/拒否ポリシーです（denyが優先）。大文字小文字を区別せず、`*`ワイルドカードをサポートします。Docker sandboxがオフでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のproviderまたはmodelに対してtoolをさらに制限します。順序: ベースprofile → provider profile → allow/deny。

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

sandbox外でのelevated execアクセスを制御します。

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

- agentごとの上書き（`agents.list[].tools.elevated`）では、さらに制限することしかできません。
- `/elevated on|off|ask|full`はstateをsessionごとに保存します。インラインdirectiveは単一メッセージに適用されます。
- Elevated `exec`はsandbox化をバイパスし、設定されたescape path（デフォルトは`gateway`、execターゲットが`node`のときは`node`）を使います。

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

toolループ安全チェックはデフォルトで**無効**です。検出を有効にするには`enabled: true`を設定してください。
設定はグローバルに`tools.loopDetection`で定義でき、agentごとに`agents.list[].tools.loopDetection`で上書きできます。

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

- `historySize`: ループ解析用に保持する最大tool呼び出し履歴数。
- `warningThreshold`: 警告を出す、進捗のない反復パターンのしきい値。
- `criticalThreshold`: 重大なループをブロックするための、より高い反復しきい値。
- `globalCircuitBreakerThreshold`: 進捗のない実行に対するハード停止しきい値。
- `detectors.genericRepeat`: 同じtool/同じ引数の呼び出し反復に警告します。
- `detectors.knownPollNoProgress`: 既知のpoll tool（`process.poll`、`command_status`など）の進捗なしに警告/ブロックします。
- `detectors.pingPong`: 交互に繰り返す進捗なしのペアパターンに警告/ブロックします。
- `warningThreshold >= criticalThreshold`または`criticalThreshold >= globalCircuitBreakerThreshold`の場合、検証は失敗します。

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

受信media理解（画像/音声/動画）を設定します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // オプトイン: 完了した非同期music/videoを直接channelへ送信
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

<Accordion title="Media modelエントリフィールド">

**Providerエントリ**（`type: "provider"`または省略時）:

- `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq`など）
- `model`: model id上書き
- `profile` / `preferredProfile`: `auth-profiles.json`のprofile選択

**CLIエントリ**（`type: "cli"`）:

- `command`: 実行する実行ファイル
- `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}`などをサポート）

**共通フィールド:**

- `capabilities`: 任意の一覧（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗時は次のエントリへフォールバックします。

provider authは標準順序に従います: `auth-profiles.json` → env vars → `models.providers.*.apiKey`。

**非同期完了フィールド:**

- `asyncCompletion.directSend`: `true`の場合、完了した非同期`music_generate`
  と`video_generate`タスクは、まずchannelへの直接配信を試みます。デフォルト: `false`
  （legacyのrequester-session wake/model-delivery経路）。

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

session tool（`sessions_list`、`sessions_history`、`sessions_send`）でどのsessionを対象にできるかを制御します。

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
- `agent`: 現在のagent idに属する任意のsession（同じagent id配下でper-sender sessionを実行している場合、他ユーザーも含むことがあります）。
- `all`: 任意のsession。agentをまたぐターゲティングには引き続き`tools.agentToAgent`が必要です。
- Sandbox clamp: 現在のsessionがsandbox化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"`の場合、たとえ`tools.sessions.visibility="all"`でもvisibilityは`tree`に強制されます。

### `tools.sessions_spawn`

`sessions_spawn`のインライン添付サポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // オプトイン: trueにするとインラインファイル添付を許可
        maxTotalBytes: 5242880, // 全ファイル合計5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // ファイルごと1 MB
        retainOnSessionKeep: false, // cleanup="keep"のとき添付を保持
      },
    },
  },
}
```

注意:

- 添付は`runtime: "subagent"`でのみサポートされます。ACP runtimeでは拒否されます。
- ファイルは子workspace内の`.openclaw/attachments/<uuid>/`に`.manifest.json`付きで実体化されます。
- 添付内容はTranscript永続化から自動的にredactされます。
- Base64入力は、厳格なalphabet/paddingチェックとデコード前のサイズガードで検証されます。
- ファイル権限はディレクトリが`0700`、ファイルが`0600`です。
- クリーンアップは`cleanup`ポリシーに従います。`delete`は常に添付を削除し、`keep`は`retainOnSessionKeep: true`のときのみ保持します。

### `tools.experimental`

実験的な組み込みtoolフラグです。strict-agentic GPT-5自動有効化ルールが適用される場合を除き、デフォルトはoffです。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 実験的なupdate_planを有効化
    },
  },
}
```

注意:

- `planTool`: 自明でない複数ステップ作業の追跡向けに、構造化された`update_plan` toolを有効にします。
- デフォルト: `agents.defaults.embeddedPi.executionContract`（またはagentごとの上書き）がOpenAIまたはOpenAI CodexのGPT-5系実行に対して`"strict-agentic"`に設定されている場合を除き`false`です。その範囲外でもtoolを強制的に有効にするには`true`を、strict-agentic GPT-5実行でも無効のままにするには`false`を設定してください。
- 有効時は、system promptにも使用ガイダンスが追加され、modelが実質的な作業に対してのみ使用し、`in_progress`のステップを常に1つ以下に保つようにします。

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
- `allowAgents`: 要求元agentが独自の`subagents.allowAgents`を設定していない場合の、`sessions_spawn`向けターゲットagent IDデフォルトallowlist（`["*"]` = 任意。デフォルト: 同じagentのみ）。
- `runTimeoutSeconds`: tool呼び出しで`runTimeoutSeconds`が省略された場合の、`sessions_spawn`のデフォルトタイムアウト（秒）。`0`はタイムアウトなしを意味します。
- sub-agentごとのtoolポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムproviderとbase URL

OpenClawは組み込みのmodel catalogを使用します。カスタムproviderはconfigの`models.providers`または`~/.openclaw/agents/<agentId>/agent/models.json`で追加します。

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

- カスタムauthが必要な場合は`authHeader: true` + `headers`を使用します。
- agent config rootは`OPENCLAW_AGENT_DIR`（またはlegacy環境変数aliasの`PI_CODING_AGENT_DIR`）で上書きできます。
- 一致するprovider IDに対するマージ優先順位:
  - 空でないagent `models.json`の`baseUrl`値が優先されます。
  - 空でないagent `apiKey`値は、そのproviderが現在のconfig/auth-profile文脈でSecretRef管理されていない場合にのみ優先されます。
  - SecretRef管理されたprovider `apiKey`値は、解決済みsecretを永続化する代わりに、ソースマーカー（env refでは`ENV_VAR_NAME`、file/exec refでは`secretref-managed`）から更新されます。
  - SecretRef管理されたprovider header値も、ソースマーカー（env refでは`secretref-env:ENV_VAR_NAME`、file/exec refでは`secretref-managed`）から更新されます。
  - 空または欠落したagent `apiKey`/`baseUrl`は、config内の`models.providers`へフォールバックします。
  - 一致するmodelの`contextWindow`/`maxTokens`は、明示的config値と暗黙catalog値のうち大きいほうを使います。
  - 一致するmodelの`contextTokens`は、明示的なruntime capが存在する場合それを保持します。ネイティブmodelメタデータを変えずに実効contextを制限したい場合に使ってください。
  - configで`models.json`を完全に書き換えたい場合は`models.mode: "replace"`を使用します。
  - マーカーの永続化はソース優先です。マーカーは、解決済みruntime secret値からではなく、アクティブなソースconfig snapshot（解決前）から書き込まれます。

### Providerフィールドの詳細

- `models.mode`: provider catalogの動作（`merge`または`replace`）。
- `models.providers`: provider idをキーとするカスタムproviderマップ。
- `models.providers.*.api`: リクエストadapter（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai`など）。
- `models.providers.*.apiKey`: provider credential（SecretRef/env置換を推奨）。
- `models.providers.*.auth`: auth戦略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions`向けに、リクエストへ`options.num_ctx`を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に`Authorization` headerでのcredential送信を強制します。
- `models.providers.*.baseUrl`: 上流APIのbase URL。
- `models.providers.*.headers`: プロキシ/tenantルーティング向けの追加の静的header。
- `models.providers.*.request`: model-provider HTTPリクエスト向けの転送上書き。
  - `request.headers`: 追加header（providerデフォルトとマージされます）。値はSecretRefを受け付けます。
  - `request.auth`: auth戦略上書き。モード: `"provider-default"`（provider組み込みauthを使用）、`"authorization-bearer"`（`token`付き）、`"header"`（`headerName`、`value`、任意の`prefix`付き）。
  - `request.proxy`: HTTPプロキシ上書き。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` env varを使用）、`"explicit-proxy"`（`url`付き）。どちらのモードも任意の`tls`サブobjectを受け付けます。
  - `request.tls`: 直接接続向けのTLS上書き。フィールド: `ca`、`cert`、`key`、`passphrase`（すべてSecretRef対応）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`: `true`の場合、DNSがprivate、CGNAT、または類似範囲に解決される`baseUrl`へのHTTPSを、provider HTTP fetch guard経由で許可します（信頼できるセルフホストのOpenAI互換endpoint向けのoperatorオプトイン）。WebSocketはheader/TLSに同じ`request`を使いますが、そのfetch SSRFガードは使いません。デフォルト`false`。
- `models.providers.*.models`: 明示的なprovider model catalogエントリ。
- `models.providers.*.models.*.contextWindow`: ネイティブmodelのcontext windowメタデータ。
- `models.providers.*.models.*.contextTokens`: 任意のruntime context cap。modelのネイティブ`contextWindow`より小さい実効context予算を使いたい場合に使用します。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 任意の互換性ヒント。`api: "openai-completions"`かつ空でない非ネイティブ`baseUrl`（hostが`api.openai.com`ではない）の場合、OpenClawはランタイム時にこれを`false`へ強制します。空または省略された`baseUrl`では、デフォルトのOpenAI動作を維持します。
- `models.providers.*.models.*.compat.requiresStringContent`: 文字列専用のOpenAI互換chat endpoint向けの任意の互換性ヒント。`true`の場合、OpenClawは純粋なテキストの`messages[].content`配列を、リクエスト送信前にプレーン文字列へ平坦化します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock自動検出設定のルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙検出のオン/オフ。
- `plugins.entries.amazon-bedrock.config.discovery.region`: 検出に使うAWS region。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 対象を絞った検出向けの任意のprovider-idフィルタ。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出されたmodel向けのフォールバックcontext window。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出されたmodel向けのフォールバック最大出力token数。

### Providerの例

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

Cerebrasには`cerebras/zai-glm-4.7`を使い、Z.AI directには`zai/glm-4.7`を使います。

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

`OPENCODE_API_KEY`（または`OPENCODE_ZEN_API_KEY`）を設定してください。Zen catalogには`opencode/...`参照を、Go catalogには`opencode-go/...`参照を使用します。ショートカット: `openclaw onboard --auth-choice opencode-zen`または`openclaw onboard --auth-choice opencode-go`。

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

`ZAI_API_KEY`を設定してください。`z.ai/*`と`z-ai/*`は受け付けられるaliasです。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般endpoint: `https://api.z.ai/api/paas/v4`
- コーディングendpoint（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 一般endpointには、base URL上書き付きのカスタムproviderを定義してください。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
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
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

中国向けendpointでは、`baseUrl: "https://api.moonshot.cn/v1"`または`openclaw onboard --auth-choice moonshot-api-key-cn`を使用してください。

ネイティブMoonshot endpointは、共有`openai-completions`転送上でストリーミング利用互換性を公開しており、OpenClawは組み込みprovider id単体ではなくendpoint機能に基づいてこれを判定します。

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

<Accordion title="Synthetic（Anthropic互換）">

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

base URLには`/v1`を含めないでください（Anthropic clientが付加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（direct）">

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

`MINIMAX_API_KEY`を設定してください。ショートカット:
`openclaw onboard --auth-choice minimax-global-api`または
`openclaw onboard --auth-choice minimax-cn-api`。
model catalogのデフォルトはM2.7のみです。
Anthropic互換ストリーミング経路では、明示的に`thinking`を設定しない限り、
OpenClawはデフォルトでMiniMax thinkingを無効にします。`/fast on`または
`params.fastMode: true`は`MiniMax-M2.7`を
`MiniMax-M2.7-highspeed`へ書き換えます。

</Accordion>

<Accordion title="ローカルmodel（LM Studio）">

[Local Models](/ja-JP/gateway/local-models)を参照してください。要約すると、十分なハードウェア上でLM Studio Responses API経由の大きなローカルmodelを実行し、フォールバック用にホスト型modelもマージしたままにするのがおすすめです。

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // またはプレーンテキスト文字列
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: bundled Skillsのみを対象にした任意のallowlistです（managed/workspace Skillsには影響しません）。
- `load.extraDirs`: 追加の共有skillルート（優先順位は最低）。
- `install.preferBrew`: `brew`が利用可能な場合、他のinstaller種別にフォールバックする前にHomebrew installerを優先します。
- `install.nodeManager`: `metadata.openclaw.install`仕様向けのnode installer優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`は、bundled/installedであってもskillを無効にします。
- `entries.<skillKey>.apiKey`: 主要なenv varを宣言するskill向けの簡易設定（プレーンテキスト文字列またはSecretRef object）。

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

- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および`plugins.load.paths`から読み込まれます。
- 検出は、ネイティブOpenClaw Pluginに加え、互換性のあるCodex bundleとClaude bundleも受け付けます。manifestのないClaude default-layout bundleも含みます。
- **Config変更にはgatewayの再起動が必要です。**
- `allow`: 任意のallowlistです（列挙されたPluginのみ読み込み）。`deny`が優先されます。
- `plugins.entries.<id>.apiKey`: PluginレベルのAPIキー簡易フィールド（Pluginが対応している場合）。
- `plugins.entries.<id>.env`: Pluginスコープのenv varマップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false`の場合、coreは`before_prompt_build`をブロックし、legacy `before_agent_start`からのprompt変更フィールドを無視します。一方でlegacyの`modelOverride`と`providerOverride`は保持します。ネイティブPlugin hookと、対応するbundle提供hookディレクトリの両方に適用されます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このPluginがバックグラウンドsubagent実行ごとの`provider`および`model`上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたsubagent上書き向けの任意の正規`provider/model`ターゲットallowlistです。任意のmodelを許可したい場合にのみ`"*"`を使用してください。
- `plugins.entries.<id>.config`: Plugin定義のconfig object（利用可能な場合はネイティブOpenClaw Plugin schemaで検証されます）。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawlのweb-fetch provider設定。
  - `apiKey`: Firecrawl APIキー（SecretRef対応）。`plugins.entries.firecrawl.config.webSearch.apiKey`、legacyの`tools.web.fetch.firecrawl.apiKey`、または`FIRECRAWL_API_KEY` env varへフォールバックします。
  - `baseUrl`: Firecrawl APIのbase URL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページから主要コンテンツのみ抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大cache age（ミリ秒、デフォルト: `172800000` / 2日）。
  - `timeoutSeconds`: scrapeリクエストのタイムアウト秒数（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search providerを有効化します。
  - `model`: 検索に使うGrok model（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: Memory Dreaming設定。フェーズとしきい値は[Dreaming](/ja-JP/concepts/dreaming)を参照してください。
  - `enabled`: Dreaming全体のスイッチ（デフォルト`false`）。
  - `frequency`: 各完全Dreaming sweepのCron cadence（デフォルトは`"0 3 * * *"`）。
  - フェーズポリシーとしきい値は実装詳細であり、ユーザー向けconfigキーではありません。
- 完全なmemory configは[Memory configuration reference](/ja-JP/reference/memory-config)にあります。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効なClaude bundle Pluginは、`settings.json`から埋め込みPiデフォルトを提供することもできます。OpenClawはそれらを生のOpenClaw config patchではなく、サニタイズ済みagent設定として適用します。
- `plugins.slots.memory`: アクティブなmemory Plugin idを選択します。memory Pluginを無効にするには`"none"`。
- `plugins.slots.contextEngine`: アクティブなcontext engine Plugin idを選択します。別のengineをインストールして選択しない限り、デフォルトは`"legacy"`です。
- `plugins.installs`: `openclaw plugins update`が使うCLI管理のインストールメタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`を含みます。
  - `plugins.installs.*`は管理状態として扱い、手動編集よりCLIコマンドを優先してください。

[Plugins](/ja-JP/tools/plugin)を参照してください。

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼できるprivate-networkアクセスにのみオプトイン
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

- `evaluateEnabled: false`は`act:evaluate`と`wait --fn`を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`は未設定時は無効で、browserナビゲーションはデフォルトでstrictのままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`は、private-network browserナビゲーションを意図的に信頼する場合にのみ設定してください。
- strictモードでは、remote CDP profile endpoint（`profiles.*.cdpUrl`）も到達性/検出チェック中に同じprivate-networkブロック対象になります。
- `ssrfPolicy.allowPrivateNetwork`はlegacy aliasとして引き続きサポートされます。
- strictモードでは、明示的な例外に`ssrfPolicy.hostnameAllowlist`と`ssrfPolicy.allowedHostnames`を使用します。
- Remote profileはattach-onlyです（start/stop/resetは無効）。
- `profiles.*.cdpUrl`は`http://`、`https://`、`ws://`、`wss://`を受け付けます。
  providerが直接のDevTools WebSocket URLを提供する場合はWS(S)を、
  OpenClawに`/json/version`を検出させたい場合はHTTP(S)を使用してください。
- `existing-session` profileはCDPの代わりにChrome MCPを使い、
  選択したhost上または接続済みbrowser node経由でattachできます。
- `existing-session` profileでは、BraveやEdgeのような特定の
  Chromiumベースbrowser profileを対象にするために`userDataDir`を設定できます。
- `existing-session` profileは、現在のChrome MCPルート制限を維持します。
  CSS selectorターゲティングではなくsnapshot/refベースのアクション、
  単一ファイルupload hook、dialog timeout上書きなし、`wait --load networkidle`
  なし、さらに`responsebody`、PDF export、download interception、batch actionもありません。
- ローカル管理の`openclaw` profileは`cdpPort`と`cdpUrl`を自動割り当てします。
  `cdpUrl`を明示的に設定するのはremote CDPの場合だけにしてください。
- 自動検出順序: デフォルトbrowserがChromiumベースならそれ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- Control service: loopbackのみ（portは`gateway.port`から導出、デフォルト`18791`）。
- `extraArgs`は、ローカルChromium起動に追加のlaunch flagを付加します（たとえば
  `--disable-gpu`、windowサイズ指定、またはdebug flag）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji、短いテキスト、画像URL、またはdata URI
    },
  },
}
```

- `seamColor`: ネイティブapp UI chrome向けのアクセントカラーです（Talk Modeのbubble tintなど）。
- `assistant`: Control UIのidentity上書きです。アクティブagent identityにフォールバックします。

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
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy 向け。/gateway/trusted-proxy-auth を参照
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // 危険: 絶対外部http(s) embed URLを許可
      // allowedOrigins: ["https://control.example.com"], // 非loopback Control UIに必須
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危険なHost-header originフォールバックモード
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 任意。デフォルトfalse。
    allowRealIpFallback: false,
    tools: {
      // 追加の /tools/invoke HTTP deny
      deny: ["browser"],
      // デフォルトのHTTP denyリストからtoolを除外
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gatewayフィールドの詳細">

- `mode`: `local`（gatewayを実行）または`remote`（remote gatewayへ接続）。gatewayは`local`でない限り起動を拒否します。
- `port`: WS + HTTP用の単一多重化port。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IPのみ）、または`custom`。
- **旧bind alias**: `gateway.bind`にはhost alias（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind mode値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Docker注意**: デフォルトの`loopback` bindはcontainer内の`127.0.0.1`でlistenします。Docker bridge networking（`-p 18789:18789`）では、トラフィックは`eth0`に到着するため、gatewayへ到達できません。`--network host`を使うか、全interfaceでlistenするために`bind: "lan"`（または`customBindHost: "0.0.0.0"`付きの`bind: "custom"`）を設定してください。
- **Auth**: デフォルトで必須です。非loopback bindではgateway authが必要です。実際には、共有token/password、または`gateway.auth.mode: "trusted-proxy"`を使うidentity-aware reverse proxyが必要です。オンボーディングウィザードはデフォルトでtokenを生成します。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されている場合（SecretRefを含む）は、`gateway.auth.mode`を`token`または`password`へ明示設定してください。両方が設定されていてmode未設定の場合、起動とserviceのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的なno-authモードです。信頼できるlocal loopback構成でのみ使用してください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: authをidentity-aware reverse proxyへ委譲し、`gateway.trustedProxies`からのidentity headerを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照）。このモードは**非loopback**のproxyソースを前提とします。同一hostのloopback reverse proxyはtrusted-proxy authの条件を満たしません。
- `gateway.auth.allowTailscale`: `true`の場合、Tailscale Serveのidentity headerがControl UI/WebSocket authを満たせます（`tailscale whois`で検証）。HTTP API endpointではそのTailscale header authは使われず、gatewayの通常のHTTP auth modeに従います。このtoken不要フローはgateway hostが信頼されていることを前提とします。`tailscale.mode = "serve"`のときのデフォルトは`true`です。
- `gateway.auth.rateLimit`: 任意の認証失敗制限です。client IPごと、およびauth scopeごとに適用されます（共有secretとdevice-tokenは独立して追跡されます）。ブロックされた試行は`429` + `Retry-After`を返します。
  - 非同期のTailscale Serve Control UI経路では、同じ`{scope, clientIp}`に対する失敗試行は失敗書き込み前に直列化されます。そのため、同じclientからの並行した不正試行は、両方が単なる不一致として通り抜けるのではなく、2番目のリクエストで制限に達する場合があります。
  - `gateway.auth.rateLimit.exemptLoopback`のデフォルトは`true`です。localhostトラフィックも意図的にrate limitしたい場合（テスト構成や厳格なproxyデプロイなど）は`false`を設定してください。
- browser起点のWS auth試行は、常にloopback免除を無効にした状態でスロットルされます（browserベースのlocalhost総当たりへの多層防御）。
- loopback上では、それらのbrowser起点lockoutは正規化された`Origin`
  値ごとに分離されるため、あるlocalhost originからの繰り返し失敗が
  別のoriginまで自動的にlockoutすることはありません。
- `tailscale.mode`: `serve`（tailnetのみ、loopback bind）または`funnel`（公開、auth必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket接続向けの明示的なbrowser-origin allowlistです。browser clientが非loopback originから来ることを想定する場合に必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header originポリシーに意図的に依存するデプロイ向けの危険なモードで、Host-header originフォールバックを有効にします。
- `remote.transport`: `ssh`（デフォルト）または`direct`（ws/wss）。`direct`では、`remote.url`は`ws://`または`wss://`でなければなりません。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼できるprivate-network IPへの平文`ws://`を許可するclient側の緊急時上書きです。平文のデフォルトは引き続きloopback専用です。
- `gateway.remote.token` / `.password`はremote-client credentialフィールドです。これ自体でgateway authを設定するものではありません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOS buildがrelayバックエンド登録をgatewayへ公開した後に使う、外部APNs relay向けbase HTTPS URLです。このURLはiOS buildにコンパイルされたrelay URLと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: gatewayからrelayへの送信タイムアウト（ミリ秒）。デフォルトは`10000`。
- relayバックエンド登録は特定のgateway identityに委譲されます。ペアリング済みiOS appは`gateway.identity.get`を取得し、そのidentityをrelay登録に含め、登録スコープのsend grantをgatewayへ転送します。別のgatewayはその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記relay config向けの一時的なenv上書きです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL向けの開発専用escape hatchです。本番のrelay URLはHTTPSのままにしてください。
- `gateway.channelHealthCheckMinutes`: channel health-monitor間隔（分）。health-monitorによる再起動をグローバルに無効にするには`0`を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socketしきい値（分）。これは`gateway.channelHealthCheckMinutes`以上に保ってください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: channel/accountごとの、1時間のローリングウィンドウ内でのhealth-monitor再起動最大回数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルmonitorを有効のままにしつつ、health-monitor再起動をchannelごとにオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウントchannel向けのアカウントごとの上書きです。設定されている場合、channelレベル上書きより優先されます。
- local gateway呼び出し経路では、`gateway.auth.*`が未設定の場合にのみ`gateway.remote.*`をフォールバックとして使えます。
- `gateway.auth.token` / `gateway.auth.password`がSecretRefで明示設定されていて未解決の場合、解決はfail closedします（remoteフォールバックで隠されません）。
- `trustedProxies`: TLS終端または転送元client header注入を行うreverse proxyのIPです。自分が管理するproxyだけを列挙してください。loopbackエントリは、同一hostのproxy/local検出構成（たとえばTailscale Serveやlocal reverse proxy）では引き続き有効ですが、loopbackリクエストが`gateway.auth.mode: "trusted-proxy"`の対象になるわけではありません。
- `allowRealIpFallback`: `true`の場合、`X-Forwarded-For`がないときにgatewayは`X-Real-IP`を受け付けます。fail-closed動作のためデフォルトは`false`です。
- `gateway.tools.deny`: HTTP `POST /tools/invoke`で追加でブロックするtool名です（デフォルトdenyリストを拡張）。
- `gateway.tools.allow`: デフォルトHTTP denyリストからtool名を除外します。

</Accordion>

### OpenAI互換endpoint

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true`で有効化します。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力ハードニング:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空のallowlistは未設定として扱われます。URL取得を無効にするには
    `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または`gateway.http.endpoints.responses.images.allowUrl=false`を使ってください。
- 任意のresponse hardening header:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分が管理するHTTPS originに対してのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)を参照）

### 複数インスタンスの分離

1台のhost上で、固有のportとstate dirを使って複数のgatewayを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利フラグ: `--dev`（`~/.openclaw-dev` + port `19001`を使用）、`--profile <name>`（`~/.openclaw-<name>`を使用）。

[Multiple Gateways](/ja-JP/gateway/multiple-gateways)を参照してください。

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: gateway listenerでTLS終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、localの自己署名cert/keyペアを自動生成します。local/dev用途専用です。
- `certPath`: TLS certificateファイルのファイルシステムパス。
- `keyPath`: TLS private keyファイルのファイルシステムパス。権限を制限して保持してください。
- `caPath`: client検証またはカスタムtrust chain向けの任意のCA bundleパス。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: config編集をランタイムでどのように適用するかを制御します。
  - `"off"`: live編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: config変更時に常にgateway processを再起動します。
  - `"hot"`: 再起動せずprocess内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずhot reloadを試し、必要ならrestartへフォールバックします。
- `debounceMs`: config変更適用前のデバウンスウィンドウ（ms、非負整数）。
- `deferralTimeoutMs`: 進行中の処理を待ってから再起動を強制するまでの最大時間（ms、デフォルト: `300000` = 5分）。

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>`または`x-openclaw-token: <token>`。
query-stringのhook tokenは拒否されます。

検証と安全性の注意:

- `hooks.enabled=true`には空でない`hooks.token`が必要です。
- `hooks.token`は`gateway.auth.token`と**異なる**必要があります。Gateway tokenの使い回しは拒否されます。
- `hooks.path`は`/`にできません。`/hooks`のような専用subpathを使ってください。
- `hooks.allowRequestSessionKey=true`の場合は、`hooks.allowedSessionKeyPrefixes`を制限してください（たとえば`["hook:"]`）。
- mappingまたはpresetがテンプレート化された`sessionKey`を使う場合は、`hooks.allowedSessionKeyPrefixes`と`hooks.allowRequestSessionKey=true`を設定してください。静的mapping keyではこのオプトインは不要です。

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストpayloadの`sessionKey`は、`hooks.allowRequestSessionKey=true`の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings`経由で解決
  - テンプレート描画されたmappingの`sessionKey`値は外部供給値として扱われ、これも`hooks.allowRequestSessionKey=true`が必要です。

<Accordion title="Mappingの詳細">

- `match.path`は`/hooks`以降のsub-pathに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source`は、汎用パス向けにpayloadフィールドへ一致します。
- `{{messages[0].subject}}`のようなtemplateはpayloadから読み取ります。
- `transform`は、hook actionを返すJS/TS moduleを指せます。
  - `transform.module`は相対パスでなければならず、`hooks.transformsDir`内に留まる必要があります（絶対パスとpath traversalは拒否されます）。
- `agentId`は特定のagentへルーティングします。不明なIDはデフォルトへフォールバックします。
- `allowedAgentIds`: 明示的ルーティングを制限します（`*`または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な`sessionKey`がないhook agent実行向けの任意の固定session key。
- `allowRequestSessionKey`: `/hooks/agent`呼び出し元およびtemplate駆動mappingのsession keyに`sessionKey`設定を許可します（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な`sessionKey`値（request + mapping）向けの任意の接頭辞allowlistです。例: `["hook:"]`。いずれかのmappingまたはpresetがtemplate化された`sessionKey`を使う場合は必須になります。
- `deliver: true`は最終返信をchannelへ送信します。`channel`のデフォルトは`last`です。
- `model`はこのhook実行のLLMを上書きします（model catalogが設定されている場合は許可対象でなければなりません）。

</Accordion>

### Gmail連携

- 組み込みのGmail presetは`sessionKey: "hook:gmail:{{messages[0].id}}"`を使います。
- このメッセージごとのルーティングを維持する場合は、`hooks.allowRequestSessionKey: true`を設定し、`hooks.allowedSessionKeyPrefixes`をGmail namespaceに一致するよう制限してください。たとえば`["hook:", "hook:gmail:"]`です。
- `hooks.allowRequestSessionKey: false`が必要な場合は、templateデフォルトの代わりに静的な`sessionKey`でpresetを上書きしてください。

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 設定されている場合、gatewayは起動時に`gog gmail watch serve`を自動起動します。無効にするには`OPENCLAW_SKIP_GMAIL_WATCHER=1`を設定してください。
- Gatewayと並行して別の`gog gmail watch serve`を実行しないでください。

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // または OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- agentが編集可能なHTML/CSS/JSとA2UIを、Gateway port配下のHTTPで配信します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- local専用: `gateway.bind: "loopback"`（デフォルト）のままにしてください。
- 非loopback bind: canvas routeは他のGateway HTTPサーフェスと同様にGateway auth（token/password/trusted-proxy）を必要とします。
- Node WebViewは通常auth headerを送信しません。nodeがペアリングされ接続されると、Gatewayはcanvas/A2UIアクセス向けのnodeスコープcapability URLを通知します。
- Capability URLはアクティブなnode WS sessionに結び付けられ、短時間で期限切れになります。IPベースのフォールバックは使いません。
- 配信されるHTMLへlive-reload clientを注入します。
- 空の場合はstarter `index.html`を自動作成します。
- A2UIも`/__openclaw__/a2ui/`で配信します。
- 変更にはgatewayの再起動が必要です。
- 大きなディレクトリや`EMFILE`エラーではlive reloadを無効にしてください。

---

## Discovery

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（デフォルト）: TXT recordから`cliPath` + `sshPort`を省略します。
- `full`: `cliPath` + `sshPort`を含めます。
- Hostnameのデフォルトは`openclaw`です。`OPENCLAW_MDNS_HOSTNAME`で上書きします。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/`配下にunicast DNS-SD zoneを書き込みます。ネットワークをまたぐ検出には、DNS server（推奨はCoreDNS）+ Tailscale split DNSと組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env`（インラインenv var）

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- インラインenv varは、process envにそのキーがない場合にのみ適用されます。
- `.env`ファイル: CWDの`.env` + `~/.openclaw/.env`（どちらも既存varを上書きしません）。
- `shellEnv`: login shell profileから不足している想定キーを取り込みます。
- 完全な優先順位は[Environment](/ja-JP/help/environment)を参照してください。

### Env var置換

任意のconfig文字列内で`${VAR_NAME}`を使ってenv varを参照できます。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- varが欠落または空の場合、config読み込み時にエラーになります。
- リテラルの`${VAR}`にするには`$${VAR}`でエスケープします。
- `$include`でも機能します。

---

## Secrets

SecretRefは加算的です。プレーンテキスト値も引き続き使えます。

### `SecretRef`

1つのobject形状を使います。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider`パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"`のidパターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"`のid: 絶対JSON pointer（例: `"/providers/openai/apiKey"`）
- `source: "exec"`のidパターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"`のidには、`.`または`..`のslash区切りpath segmentを含めてはいけません（例: `a/../b`は拒否されます）

### 対応credentialサーフェス

- 正規の一覧: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply`は、対応する`openclaw.json`のcredential pathを対象にします。
- `auth-profiles.json`のrefも、ランタイム解決と監査対象に含まれます。

### Secret provider設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 任意の明示env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

注意:

- `file` providerは`mode: "json"`と`mode: "singleValue"`をサポートします（singleValue modeでは`id`は`"value"`でなければなりません）。
- `exec` providerは絶対`command`パスを必要とし、stdin/stdout上のprotocol payloadを使います。
- デフォルトではsymlink command pathは拒否されます。symlink pathを許可しつつ解決先target pathを検証するには`allowSymlinkCommand: true`を設定してください。
- `trustedDirs`が設定されている場合、trusted-dirチェックは解決先target pathへ適用されます。
- `exec` child環境はデフォルトで最小限です。必要な変数は`passEnv`で明示的に渡してください。
- Secret refは有効化時にインメモリsnapshotへ解決され、その後のrequest pathはそのsnapshotのみを読みます。
- アクティブサーフェスフィルタリングは有効化中に適用されます。enabledサーフェス上の未解決refは起動/再読込を失敗させ、非アクティブサーフェスはdiagnostic付きでスキップされます。

---

## Auth storage

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- agentごとのprofileは`<agentDir>/auth-profiles.json`に保存されます。
- `auth-profiles.json`は、静的credential mode向けに値レベルref（`api_key`向けの`keyRef`、`token`向けの`tokenRef`）をサポートします。
- OAuth mode profile（`auth.profiles.<id>.mode = "oauth"`）は、SecretRefバックエンドのauth-profile credentialをサポートしません。
- 静的runtime credentialはインメモリの解決済みsnapshotから取得され、legacyな静的`auth.json`エントリは見つかると消去されます。
- legacy OAuthは`~/.openclaw/credentials/oauth.json`からインポートされます。
- [OAuth](/ja-JP/concepts/oauth)を参照してください。
- secrets runtime動作と`audit/configure/apply`ツール: [Secrets Management](/ja-JP/gateway/secrets)。

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: 真の課金不足/credit不足エラーでprofileが失敗したときの基本backoff時間（時間、デフォルト: `5`）。明示的な課金文言は`401`/`403`応答でもここに分類されることがありますが、provider固有の文言matcherはそのproviderに限定されたままです（例: OpenRouterの`Key limit exceeded`）。再試行可能なHTTP `402`のusage-windowやorganization/workspaceのspend-limitメッセージは、代わりに`rate_limit`経路に残ります。
- `billingBackoffHoursByProvider`: 課金backoff時間に対する任意のproviderごとの上書き。
- `billingMaxHours`: 課金backoffの指数成長に対する上限時間（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度`auth_permanent`失敗向けの基本backoff分数（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` backoff成長に対する上限分数（デフォルト: `60`）。
- `failureWindowHours`: backoffカウンタに使うローリングウィンドウ時間（デフォルト: `24`）。
- `overloadedProfileRotations`: overloadedエラー時にmodel fallbackへ切り替える前の、同一provider auth-profile rotation最大回数（デフォルト: `1`）。`ModelNotReadyException`のようなprovider-busy形状はここに分類されます。
- `overloadedBackoffMs`: overloaded provider/profile rotationを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: rate-limitエラー時にmodel fallbackへ切り替える前の、同一provider auth-profile rotation最大回数（デフォルト: `1`）。そのrate-limit bucketには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted`のようなprovider形状の文言も含まれます。

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- デフォルトのlog file: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 安定したpathにするには`logging.file`を設定してください。
- `--verbose`時は`consoleLevel`が`debug`に上がります。
- `maxFileBytes`: 書き込みを抑止する前の最大log fileサイズ（バイト、正の整数。デフォルト: `524288000` = 500 MB）。本番デプロイでは外部log rotationを使用してください。

---

## Diagnostics

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: 計測出力全体のマスタートグルです（デフォルト: `true`）。
- `flags`: 対象を絞ったlog出力を有効にするflag文字列の配列です（`"telegram.*"`や`"*"`のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: sessionがprocessing状態のままの間にstuck-session警告を出すまでの経過しきい値（ms）。
- `otel.enabled`: OpenTelemetry export pipelineを有効にします（デフォルト: `false`）。
- `otel.endpoint`: OTel export用collector URL。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または`"grpc"`。
- `otel.headers`: OTel exportリクエストとともに送信される追加のHTTP/gRPCメタデータheader。
- `otel.serviceName`: resource attribute向けservice名。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、またはlog exportを有効にします。
- `otel.sampleRate`: trace sampling rate（`0`–`1`）。
- `otel.flushIntervalMs`: 定期telemetry flush間隔（ms）。
- `cacheTrace.enabled`: 埋め込み実行向けのcache trace snapshot記録を有効にします（デフォルト: `false`）。
- `cacheTrace.filePath`: cache trace JSONLの出力path（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace出力に何を含めるかを制御します（すべてデフォルト: `true`）。

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: npm/git install向けのrelease channel — `"stable"`、`"beta"`、または`"dev"`。
- `checkOnStart`: gateway起動時にnpm updateを確認します（デフォルト: `true`）。
- `auto.enabled`: package install向けのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable channelの自動適用までの最小遅延時間（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable channel rolloutの追加分散ウィンドウ時間（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta channelの確認実行間隔（時間、デフォルト: `1`、最大: `24`）。

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: グローバルACP機能ゲートです（デフォルト: `false`）。
- `dispatch.enabled`: ACP session turn dispatch用の独立したゲートです（デフォルト: `true`）。ACPコマンドは利用可能なまま、実行だけをブロックしたい場合は`false`に設定します。
- `backend`: デフォルトのACP runtime backend id（登録済みACP runtime Pluginと一致している必要があります）。
- `defaultAgent`: spawnで明示ターゲットが指定されない場合のフォールバックACP target agent id。
- `allowedAgents`: ACP runtime sessionで許可されるagent idのallowlistです。空の場合は追加制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできるACP sessionの最大数。
- `stream.coalesceIdleMs`: ストリームされたテキスト向けのアイドルflushウィンドウ（ms）。
- `stream.maxChunkChars`: ストリームblock projectionを分割する前の最大chunkサイズ。
- `stream.repeatSuppression`: turnごとに重複したstatus/tool行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"`は増分ストリーミング、`"final_only"`はturn終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示toolイベント後に可視テキストの前へ入れるseparator（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP turnごとに投影されるassistant出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影されるACP status/update行の最大文字数。
- `stream.tagVisibility`: ストリームイベント向けtag名からboolean可視性上書きへの記録。
- `runtime.ttlMinutes`: ACP session workerがクリーンアップ対象になるまでのアイドルTTL（分）。
- `runtime.installCommand`: ACP runtime環境のbootstrap時に実行する任意のinstall command。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode`はbanner taglineのスタイルを制御します。
  - `"random"`（デフォルト）: ローテーションする面白い/季節タグライン。
  - `"default"`: 固定の中立的タグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: taglineテキストなし（bannerのタイトル/バージョンは引き続き表示）。
- banner全体を隠すには（taglineだけでなく）、env `OPENCLAW_HIDE_BANNER=1`を設定してください。

---

## ウィザード

CLIのガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）が書き込むメタデータ:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

[Agent defaults](#agent-defaults)の`agents.list` identityフィールドを参照してください。

---

## Bridge（legacy、削除済み）

現在のbuildにはTCP bridgeは含まれていません。nodeはGateway WebSocket経由で接続します。`bridge.*`キーはもはやconfig schemaの一部ではありません（削除されるまで検証は失敗します。`openclaw doctor --fix`でunknown keyを除去できます）。

<Accordion title="legacy bridge config（履歴参照）">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // 非推奨。stored notify:true job向けのフォールバック
    webhookToken: "replace-with-dedicated-token", // 任意。送信Webhook auth向けbearer token
    sessionRetention: "24h", // 期間文字列またはfalse
    runLog: {
      maxBytes: "2mb", // デフォルト 2_000_000 バイト
      keepLines: 2000, // デフォルト 2000
    },
  },
}
```

- `sessionRetention`: 完了済みの分離Cron実行sessionを`sessions.json`から刈り込むまで保持する期間です。アーカイブされた削除済みCron transcriptのクリーンアップも制御します。デフォルト: `24h`。無効にするには`false`を設定します。
- `runLog.maxBytes`: 刈り込み前のrun logファイルごとの最大サイズ（`cron/runs/<jobId>.jsonl`）。デフォルト: `2_000_000`バイト。
- `runLog.keepLines`: run-log刈り込みが発生したときに保持する最新行数。デフォルト: `2000`。
- `webhookToken`: CronのWebhook POST配信（`delivery.mode = "webhook"`）に使うbearer tokenです。省略時はauth headerを送信しません。
- `webhook`: 非推奨のlegacyフォールバックWebhook URL（http/https）で、依然として`notify: true`を持つ保存済みjobにのみ使われます。

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: 一度きりのjobに対する一時的エラー時の最大再試行回数（デフォルト: `3`、範囲: `0`–`10`）。
- `backoffMs`: 各再試行で使うbackoff遅延の配列（ms、デフォルト: `[30000, 60000, 300000]`、1〜10エントリ）。
- `retryOn`: 再試行を発生させるエラー種別 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略するとすべての一時的種別を再試行します。

これは一度きりのCron jobにのみ適用されます。定期jobでは別の失敗処理を使います。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Cron job向け失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラート発火までの連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じjobに対する再通知アラート間の最小ミリ秒数（非負整数）。
- `mode`: 配信モード — `"announce"`はchannel messageで送信し、`"webhook"`は設定済みWebhookへPOSTします。
- `accountId`: アラート配信のスコープを限定する任意のaccountまたはchannel id。

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- 全job共通のCron失敗通知デフォルト送信先です。
- `mode`: `"announce"`または`"webhook"`。十分なtargetデータがある場合のデフォルトは`"announce"`です。
- `channel`: announce配信向けのchannel上書きです。`"last"`は最後に使った配信channelを再利用します。
- `to`: 明示的なannounce targetまたはWebhook URL。Webhook modeでは必須です。
- `accountId`: 配信向けの任意のaccount上書き。
- jobごとの`delivery.failureDestination`は、このグローバルデフォルトを上書きします。
- グローバルにもjobごとにもfailure destinationが設定されていない場合、すでに`announce`で配信するjobは、失敗時にその主要announce targetへフォールバックします。
- `delivery.failureDestination`は、jobの主要`delivery.mode`が`"webhook"`でない限り、`sessionTarget="isolated"` jobでのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs)を参照してください。分離Cron実行は[background tasks](/ja-JP/automation/tasks)として追跡されます。

---

## Media modelテンプレート変数

`tools.media.models[].args`で展開されるtemplate placeholder:

| Variable           | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完全な受信メッセージ本文                          |
| `{{RawBody}}`      | 生本文（履歴/送信者ラッパーなし）                 |
| `{{BodyStripped}}` | グループメンションを除去した本文                  |
| `{{From}}`         | 送信者識別子                                      |
| `{{To}}`           | 宛先識別子                                        |
| `{{MessageSid}}`   | Channel message id                                |
| `{{SessionId}}`    | 現在のsession UUID                                |
| `{{IsNewSession}}` | 新しいsessionが作成されたときは`"true"`           |
| `{{MediaUrl}}`     | 受信media疑似URL                                  |
| `{{MediaPath}}`    | ローカルmedia path                                |
| `{{MediaType}}`    | Media type（image/audio/document/…）              |
| `{{Transcript}}`   | 音声Transcript                                    |
| `{{Prompt}}`       | CLIエントリ向けに解決されたmedia prompt           |
| `{{MaxChars}}`     | CLIエントリ向けに解決された最大出力文字数         |
| `{{ChatType}}`     | `"direct"`または`"group"`                         |
| `{{GroupSubject}}` | グループsubject（best effort）                    |
| `{{GroupMembers}}` | グループmemberプレビュー（best effort）           |
| `{{SenderName}}`   | 送信者表示名（best effort）                       |
| `{{SenderE164}}`   | 送信者電話番号（best effort）                     |
| `{{Provider}}`     | Providerヒント（whatsapp、telegram、discordなど） |

---

## Config include（`$include`）

configを複数ファイルに分割できます。

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**マージ動作:**

- 単一ファイル: そのobject全体を置き換えます。
- ファイル配列: 順番にdeep-mergeされます（後ろが前を上書き）。
- 同階層キー: includeの後にマージされます（includeされた値を上書き）。
- ネストしたinclude: 最大10階層まで。
- パス: include元ファイルからの相対で解決されますが、トップレベルconfigディレクトリ（`openclaw.json`の`dirname`）内に留まる必要があります。絶対/`../`形式も、その境界内に解決される場合にのみ許可されます。
- エラー: 欠落ファイル、parse error、循環includeに対して明確なメッセージを出します。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_
