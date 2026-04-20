---
read_when:
    - 正確なフィールドレベルの設定の意味またはデフォルト値が必要な場合
    - channel、model、gateway、または tool の設定ブロックを検証している場合
summary: core OpenClaw のキー、デフォルト値、および専用サブシステム参照へのリンクのための Gateway 設定リファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-20T04:46:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22b10f1f133374cd29ef4a5ec4fb9c9938eb51184ad82e1aa2e5f6f7af58585e
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# 設定リファレンス

`~/.openclaw/openclaw.json` のコア設定リファレンスです。タスク指向の概要については、[Configuration](/ja-JP/gateway/configuration) を参照してください。

このページでは、OpenClaw の主要な設定サーフェスを扱い、サブシステムごとにより詳細な専用リファレンスがある場合はそちらへのリンクを示します。1 つのページに、すべての channel/plugin 所有のコマンドカタログや、すべての詳細な memory/QMD のノブをインライン展開することは**目的としていません**。

コード上の真実:

- `openclaw config schema` は、検証と Control UI に使用されるライブ JSON Schema を出力し、利用可能な場合は bundled/plugin/channel のメタデータもマージされます
- `config.schema.lookup` は、ドリルダウン用ツール向けに、パスでスコープされた単一のスキーマノードを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、設定ドキュメントのベースラインハッシュを現在のスキーマサーフェスに対して検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming 設定については [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の built-in + bundled コマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands)
- channel 固有のコマンドサーフェスについては各 channel/plugin ページ

設定形式は **JSON5** です（コメント + 末尾カンマ可）。すべてのフィールドは省略可能です — OpenClaw は省略時に安全なデフォルトを使用します。

---

## Channels

各 channel は、その設定セクションが存在すると自動的に起動します（`enabled: false` の場合を除く）。

### DM とグループのアクセス

すべての channel は DM ポリシーとグループポリシーをサポートします:

| DM ポリシー         | 動作                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (デフォルト) | 不明な送信者には 1 回限りのペアリングコードが送られ、owner が承認する必要があります |
| `allowlist`         | `allowFrom` 内の送信者のみ（またはペア済み allow ストア）       |
| `open`              | すべての受信 DM を許可（`allowFrom: ["*"]` が必要）             |
| `disabled`          | すべての受信 DM を無視                                          |

| グループポリシー         | 動作                                                   |
| ------------------------ | ------------------------------------------------------ |
| `allowlist` (デフォルト) | 設定済み allowlist に一致するグループのみ              |
| `open`                   | グループ allowlist をバイパス（mention-gating は引き続き適用） |
| `disabled`               | すべてのグループ/room メッセージをブロック             |

<Note>
`channels.defaults.groupPolicy` は、provider の `groupPolicy` が未設定のときのデフォルトを設定します。
ペアリングコードは 1 時間で期限切れになります。保留中の DM ペアリングリクエストは **channel ごとに 3 件**までです。
provider ブロック自体が完全に欠落している場合（`channels.<provider>` が存在しない）、ランタイムのグループポリシーは起動時警告付きで `allowlist`（フェイルクローズ）にフォールバックします。
</Note>

### Channel model のオーバーライド

特定の channel ID を model に固定するには `channels.modelByChannel` を使用します。値には `provider/model` または設定済み model エイリアスを指定できます。この channel マッピングは、session にすでに model オーバーライドがない場合（たとえば `/model` で設定されたもの）に適用されます。

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

### Channel のデフォルトと Heartbeat

provider 間で共有するグループポリシーおよび Heartbeat の動作には `channels.defaults` を使用します:

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

- `channels.defaults.groupPolicy`: provider レベルの `groupPolicy` が未設定のときのフォールバック用グループポリシー。
- `channels.defaults.contextVisibility`: すべての channel に対するデフォルトの補足コンテキスト可視性モード。値: `all`（デフォルト、引用/スレッド/履歴のすべてのコンテキストを含める）、`allowlist`（allowlist 済み送信者からのコンテキストのみ含める）、`allowlist_quote`（allowlist と同じだが、明示的な quote/reply コンテキストは保持する）。channel ごとのオーバーライド: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常な channel ステータスを Heartbeat 出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラー状態のステータスを Heartbeat 出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター形式の Heartbeat 出力を表示します。

### WhatsApp

WhatsApp は gateway の web channel（Baileys Web）経由で動作します。リンク済み session が存在すると自動的に起動します。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
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

<Accordion title="複数アカウントの WhatsApp">

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

- 送信コマンドは、`default` アカウントが存在する場合はそのアカウントをデフォルトで使用し、そうでない場合は最初に設定されたアカウント ID（ソート順）を使用します。
- オプションの `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合、このフォールバックのデフォルトアカウント選択を上書きします。
- 従来の単一アカウント Baileys auth dir は、`openclaw doctor` によって `whatsapp/default` に移行されます。
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
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
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

- Bot token: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。シンボリックリンクは拒否されます）。デフォルトアカウントについては `TELEGRAM_BOT_TOKEN` がフォールバックです。
- オプションの `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。
- 複数アカウント構成（2 つ以上のアカウント ID）では、フォールバックルーティングを避けるために明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠落または無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は、Telegram 起点の設定書き込み（supergroup ID の移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、forum topic 用の永続 ACP バインディングを設定します（`match.peer.id` では正規の `chatId:topic:topicId` を使用します）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) で共通です。
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
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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
- 明示的な Discord `token` を指定して行う直接の送信呼び出しでは、その呼び出しにその token が使用されます。アカウントの retry/policy 設定は、アクティブなランタイムスナップショットで選択されたアカウントから引き続き取得されます。
- オプションの `channels.discord.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。
- 配信先には `user:<id>`（DM）または `channel:<id>`（guild channel）を使用します。数値 ID 単体は拒否されます。
- Guild slug は小文字で、スペースは `-` に置き換えられます。channel キーには slug 化された名前（`#` なし）を使用します。guild ID を優先してください。
- bot が作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効になります。bot をメンションした bot メッセージのみ受け付けるには `allowBots: "mentions"` を使用します（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（および channel オーバーライド）は、他のユーザーまたは role をメンションしているが bot をメンションしていないメッセージを破棄します（@everyone/@here は除く）。
- `maxLinesPerMessage`（デフォルト 17）は、2000 文字未満でも縦に長いメッセージを分割します。
- `channels.discord.threadBindings` は Discord のスレッドバインドされたルーティングを制御します:
  - `enabled`: スレッドバインドされた session 機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング）に対する Discord オーバーライド
  - `idleHours`: 非アクティブ時の自動 unfocus を時間単位で指定する Discord オーバーライド（`0` で無効）
  - `maxAgeHours`: ハードな最大経過時間を時間単位で指定する Discord オーバーライド（`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` の自動スレッド作成/バインドのオプトインスイッチ
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、channel とスレッドの永続 ACP バインディングを設定します（`match.peer.id` には channel/thread id を使用します）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) で共通です。
- `channels.discord.ui.components.accentColor` は、Discord components v2 コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は、Discord voice channel での会話と、オプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClaw はさらに、復号失敗が繰り返された後に voice session から退出して再参加することで、voice receive の回復も試みます。
- `channels.discord.streaming` は正規のストリームモードキーです。従来の `streamMode` と真偽値の `streaming` は自動移行されます。
- `channels.discord.autoPresence` はランタイムの可用性を bot presence にマッピングし（healthy => online、degraded => idle、exhausted => dnd）、オプションのステータステキスト上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な name/tag マッチングを再有効化します（緊急用の互換モード）。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と approver 認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から approver を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Discord user ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: オプションの agent ID allowlist。省略するとすべての agent の承認を転送します。
  - `sessionFilter`: オプションの session キーパターン（部分文字列または regex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は approver の DM に送信し、`"channel"` は元の channel に送信し、`"both"` は両方に送信します。target に `"channel"` が含まれる場合、ボタンを使用できるのは解決済み approver のみです。
  - `cleanupAfterResolve`: `true` の場合、承認・拒否・タイムアウト後に承認 DM を削除します。

**Reaction notification モード:** `off`（なし）、`own`（bot 自身のメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージのうち `guilds.<id>.users` に含まれるもの）。

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
- Service account SecretRef（`serviceAccountRef`）もサポートされています。
- 環境変数のフォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信先には `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能な email principal マッチングを再有効化します（緊急用の互換モード）。

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
        nativeTransport: true, // use Slack native streaming API when mode=partial
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

- **Socket mode** には `botToken` と `appToken` の両方が必要です（デフォルトアカウントの環境変数フォールバックは `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** には `botToken` と `signingSecret`（ルートまたはアカウントごと）が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は平文文字列または SecretRef オブジェクトを受け付けます。
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、および HTTP mode では `signingSecretStatus` などの資格情報ごとの source/status フィールドを公開します。`configured_unavailable` は、そのアカウントが SecretRef によって設定されているが、現在の command/runtime パスでは secret 値を解決できなかったことを意味します。
- `configWrites: false` は、Slack 起点の設定書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正規の Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミング転送を制御します。従来の `streamMode`、真偽値の `streaming`、および `nativeStreaming` は自動移行されます。
- 配信先には `user:<id>`（DM）または `channel:<id>` を使用します。

**Reaction notification モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

**Thread session 分離:** `thread.historyScope` はスレッドごと（デフォルト）または channel 全体で共有されます。`thread.inheritParent` は親 channel の transcript を新しいスレッドにコピーします。

- Slack ネイティブストリーミングと Slack assistant 風の「is typing...」スレッドステータスには reply thread のターゲットが必要です。トップレベル DM はデフォルトでスレッド外のままなので、スレッド風プレビューではなく `typingReaction` または通常配信を使用します。
- `typingReaction` は、返信の実行中に受信した Slack メッセージへ一時的な reaction を追加し、完了時にそれを削除します。`"hourglass_flowing_sand"` のような Slack 絵文字ショートコードを使用してください。
- `channels.slack.execApprovals`: Slack ネイティブの exec 承認配信と approver 認可。スキーマは Discord と同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack user ID）、`agentFilter`、`sessionFilter`、および `target`（`"dm"`、`"channel"`、または `"both"`）。

| Action group | デフォルト | 備考                   |
| ------------ | ---------- | ---------------------- |
| reactions    | 有効       | reaction の追加 + 一覧 |
| messages     | 有効       | 読み取り/送信/編集/削除 |
| pins         | 有効       | ピン留め/解除/一覧      |
| memberInfo   | 有効       | メンバー情報            |
| emojiList    | 有効       | カスタム絵文字一覧      |

### Mattermost

Mattermost は Plugin として提供されます: `openclaw plugins install @openclaw/mattermost`。

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
        // リバースプロキシ/公開デプロイ用のオプションの明示 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chat mode: `oncall`（@-mention に応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` は完全な URL ではなくパスでなければなりません（例: `/api/channels/mattermost/command`）。
- `commands.callbackUrl` は OpenClaw gateway エンドポイントを解決し、Mattermost サーバーから到達可能でなければなりません。
- ネイティブ slash callback は、slash command 登録時に Mattermost から返されるコマンドごとの token で認証されます。登録に失敗した場合、または有効化されたコマンドがない場合、OpenClaw は callback を `Unauthorized: invalid command token.` で拒否します。
- プライベート/tailnet/internal の callback host では、Mattermost が `ServiceSettings.AllowedUntrustedInternalConnections` に callback host/domain を含めることを要求する場合があります。完全な URL ではなく host/domain 値を使用してください。
- `channels.mattermost.configWrites`: Mattermost 起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: channel で返信する前に `@mention` を必要にします。
- `channels.mattermost.groups.<channelId>.requireMention`: channel ごとの mention-gating オーバーライド（デフォルトには `"*"` を使用）。
- オプションの `channels.mattermost.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。

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

**Reaction notification モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` から）。

- `channels.signal.account`: channel の起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal 起点の設定書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubbles は推奨される iMessage パスです（Plugin バックで、`channels.bluebubbles` 配下に設定します）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- ここで扱うコアキーパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、BlueBubbles の会話を永続 ACP session にバインドできます。`match.peer.id` には BlueBubbles handle またはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全な BlueBubbles channel 設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

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

- オプションの `channels.imessage.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。

- Messages DB へのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャット一覧を表示するには `imsg chats --limit 20` を使用してください。
- `cliPath` は SSH ラッパーを指すことができます。SCP で添付ファイルを取得するには `remoteHost`（`host` または `user@host`）を設定します。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳格な host-key チェックを使用するため、relay host key がすでに `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage 起点の設定書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、iMessage の会話を永続 ACP session にバインドできます。`match.peer.id` には正規化された handle または明示的な chat ターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共有フィールドの意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は extension バックで、`channels.matrix` 配下に設定します。

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

- Token 認証は `accessToken` を使用します。password 認証は `userId` + `password` を使用します。
- `channels.matrix.proxy` は Matrix HTTP トラフィックを明示的な HTTP(S) proxy 経由にします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` でこれを上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` はプライベート/内部 homeserver を許可します。`proxy` とこの network オプトインは独立した制御です。
- `channels.matrix.defaultAccount` は、複数アカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで、招待された room や新しい DM 形式の招待は無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と approver 認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から approver を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Matrix user ID（例: `@owner:example.org`）。
  - `agentFilter`: オプションの agent ID allowlist。省略するとすべての agent の承認を転送します。
  - `sessionFilter`: オプションの session キーパターン（部分文字列または regex）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（元の room）、または `"both"`。
  - アカウントごとのオーバーライド: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は Matrix DM がどのように session にまとまるかを制御します: `per-user`（デフォルト）はルーティングされた peer ごとに共有し、`per-room` は各 DM room を分離します。
- Matrix のステータス probe とライブディレクトリ検索は、ランタイムトラフィックと同じ proxy ポリシーを使用します。
- 完全な Matrix 設定、ターゲティングルール、およびセットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は extension バックで、`channels.msteams` 配下に設定します。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- ここで扱うコアキーパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 設定（資格情報、webhook、DM/グループポリシー、team/channel ごとのオーバーライド）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は extension バックで、`channels.irc` 配下に設定します。

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
- オプションの `channels.irc.defaultAccount` は、設定済みアカウント ID と一致する場合、デフォルトアカウント選択を上書きします。
- 完全な IRC channel 設定（host/port/TLS/channels/allowlist/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### 複数アカウント（すべての channel）

channel ごとに複数のアカウントを実行できます（各アカウントは独自の `accountId` を持ちます）:

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

- `default` は `accountId` が省略された場合に使用されます（CLI + ルーティング）。
- 環境変数の token は **default** アカウントにのみ適用されます。
- ベース channel 設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを別の agent にルーティングするには `bindings[].match.accountId` を使用します。
- まだ単一アカウントのトップレベル channel 設定のままで `openclaw channels add`（または channel オンボーディング）を使って非 default アカウントを追加すると、OpenClaw は元のアカウントが引き続き動作するよう、まずアカウントスコープのトップレベル単一アカウント値を channel のアカウントマップへ昇格させます。ほとんどの channel ではこれらを `channels.<channel>.accounts.default` に移動します。Matrix は代わりに既存の一致する named/default ターゲットを保持できます。
- 既存の channel のみの binding（`accountId` なし）は default アカウントに引き続き一致します。アカウントスコープの binding は引き続きオプションです。
- `openclaw doctor --fix` も、各 channel に対して選ばれた昇格先アカウントにアカウントスコープのトップレベル単一アカウント値を移動することで、混在した形状を修復します。ほとんどの channel では `accounts.default` を使います。Matrix は代わりに既存の一致する named/default ターゲットを保持できます。

### その他の extension channel

多くの extension channel は `channels.<id>` として設定され、専用の channel ページに記載されています（例: Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全な channel インデックスは [Channels](/ja-JP/channels) を参照してください。

### グループチャットのメンションゲーティング

グループメッセージはデフォルトで **メンション必須** です（メタデータメンションまたは安全な regex パターン）。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

**メンションの種類:**

- **メタデータメンション**: ネイティブのプラットフォーム @-mention。WhatsApp の self-chat mode では無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` にある安全な regex パターン。無効なパターンや安全でないネスト反復は無視されます。
- メンションゲーティングは、検出が可能な場合にのみ適用されます（ネイティブメンションまたは少なくとも 1 つのパターンがある場合）。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。channel は `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効にするには `0` を設定します。

#### DM 履歴制限

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

解決順: DM ごとのオーバーライド → provider デフォルト → 制限なし（すべて保持）。

サポート対象: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### Self-chat mode

自分の番号を `allowFrom` に含めると self-chat mode が有効になります（ネイティブの @-mention を無視し、テキストパターンにのみ応答します）:

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
    native: "auto", // supported の場合はネイティブコマンドを登録
    nativeSkills: "auto", // supported の場合はネイティブ skill コマンドを登録
    text: true, // チャットメッセージ内の /commands を解析
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

- このブロックは command サーフェスを設定します。現在の built-in + bundled コマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands) を参照してください。
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot の `/bot-ping` `/bot-help` `/bot-logs`、LINE の `/card`、device-pair の `/pair`、memory の `/dreaming`、phone-control の `/phone`、Talk の `/voice` などの channel/plugin 所有コマンドは、それぞれの channel/plugin ページおよび [Slash Commands](/ja-JP/tools/slash-commands) に記載されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージでなければなりません。
- `native: "auto"` は Discord/Telegram ではネイティブコマンドを有効にし、Slack では無効のままにします。
- `nativeSkills: "auto"` は Discord/Telegram ではネイティブ skill コマンドを有効にし、Slack では無効のままにします。
- channel ごとのオーバーライド: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドをクリアします。
- ネイティブ skill 登録は `channels.<provider>.commands.nativeSkills` で channel ごとにオーバーライドできます。
- `channels.telegram.customCommands` は Telegram bot メニューに追加エントリを加えます。
- `bash: true` は host shell に対する `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config` を有効にします（`openclaw.json` を読み書きします）。gateway `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の書き込みスコープを持つ operator クライアントでも引き続き利用できます。
- `mcp: true` は `mcp.servers` 配下の OpenClaw 管理 MCP server 設定用の `/mcp` を有効にします。
- `plugins: true` は Plugin の検出、インストール、有効化/無効化の制御用の `/plugins` を有効にします。
- `channels.<provider>.configWrites` は channel ごとの設定変更を制御します（デフォルト: true）。
- 複数アカウント channel では、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）を制御します。
- `restart: false` は `/restart` と gateway restart tool のアクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、owner 専用 command/tool のための明示的な owner allowlist です。`allowFrom` とは別です。
- `ownerDisplay: "hash"` は system prompt 内の owner ID をハッシュ化します。ハッシュ化を制御するには `ownerDisplaySecret` を設定します。
- `allowFrom` は provider ごとです。設定されている場合、それが**唯一の**認可ソースになります（channel allowlist/pairing と `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていない場合に command が access-group ポリシーをバイパスできるようにします。
- コマンドドキュメントの対応:
  - built-in + bundled カタログ: [Slash Commands](/ja-JP/tools/slash-commands)
  - channel 固有の command サーフェス: [Channels](/ja-JP/channels)
  - QQ Bot コマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - pairing コマンド: [Pairing](/ja-JP/channels/pairing)
  - LINE card コマンド: [LINE](/ja-JP/channels/line)
  - memory dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## Agent のデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

system prompt の Runtime 行に表示されるオプションのリポジトリルートです。未設定の場合、OpenClaw は workspace から上位へたどって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` を設定していない agent に対する、オプションのデフォルト skill allowlist です。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを置き換える
      { id: "locked-down", skills: [] }, // skills なし
    ],
  },
}
```

- デフォルトで無制限の skills にするには `agents.defaults.skills` を省略します。
- デフォルトを継承するには `agents.list[].skills` を省略します。
- skills をなしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストはその agent の最終セットであり、デフォルトとはマージされません。

### `agents.defaults.skipBootstrap`

workspace bootstrap ファイル（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap ファイルをいつ system prompt に注入するかを制御します。デフォルト: `"always"`。

- `"continuation-skip"`: 安全な継続ターン（assistant の応答完了後）では workspace bootstrap の再注入をスキップし、prompt サイズを削減します。Heartbeat 実行と Compaction 後の再試行では引き続きコンテキストを再構築します。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰め前の workspace bootstrap ファイルごとの最大文字数です。デフォルト: `12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべての workspace bootstrap ファイルにまたがって注入される総文字数の上限です。デフォルト: `60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap コンテキストが切り詰められたときに agent に見える警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: system prompt に警告テキストを一切注入しません。
- `"once"`: 一意の切り詰めシグネチャごとに 1 回だけ警告を注入します（推奨）。
- `"always"`: 切り詰めが存在する場合、毎回の実行で警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### コンテキスト予算の所有マップ

OpenClaw には大量の prompt/context 予算が複数あり、すべてを 1 つの汎用ノブに流し込むのではなく、意図的にサブシステムごとに分割されています。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  通常の workspace bootstrap 注入。
- `agents.defaults.startupContext.*`:
  最近の `memory/*.md` ファイルを含む、1 回限りの `/new` と `/reset` の起動プレリュード。
- `skills.limits.*`:
  system prompt に注入されるコンパクトな Skills リスト。
- `agents.defaults.contextLimits.*`:
  上限付きのランタイム抜粋と、注入されるランタイム所有ブロック。
- `memory.qmd.limits.*`:
  インデックス済み memory-search スニペットと注入サイズ。

異なる予算が必要な agent が 1 つだけある場合にのみ、対応する agent ごとのオーバーライドを使用してください:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

素の `/new` と `/reset` 実行時に注入される最初のターンの起動プレリュードを制御します。

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

上限付きランタイムコンテキストサーフェスの共有デフォルトです。

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

- `memoryGetMaxChars`: 切り詰めメタデータと継続通知が追加される前の、デフォルトの `memory_get` 抜粋上限。
- `memoryGetDefaultLines`: `lines` が省略された場合のデフォルトの `memory_get` 行ウィンドウ。
- `toolResultMaxChars`: 永続化された結果とオーバーフロー回復に使用される、ライブ tool-result の上限。
- `postCompactionMaxChars`: Compaction 後の再注入時に使用される AGENTS.md 抜粋上限。

#### `agents.list[].contextLimits`

共有 `contextLimits` ノブに対する agent ごとのオーバーライドです。省略されたフィールドは `agents.defaults.contextLimits` を継承します。

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

system prompt に注入されるコンパクトな Skills リストのグローバル上限です。
これは、必要に応じて `SKILL.md` ファイルを読み込む動作には影響しません。

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

skills prompt 予算に対する agent ごとのオーバーライドです。

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

provider 呼び出し前に transcript/tool の画像ブロックで使用される、画像の長辺の最大ピクセルサイズです。
デフォルト: `1200`。

低い値は通常、スクリーンショットが多い実行で vision-token 使用量とリクエスト payload サイズを減らします。
高い値は、より多くの視覚的詳細を保持します。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

system prompt コンテキスト用のタイムゾーンです（メッセージタイムスタンプではありません）。host のタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt 内の時刻形式です。デフォルト: `auto`（OS の設定）。

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
      params: { cacheRetention: "long" }, // グローバルデフォルト provider params
      embeddedHarness: {
        runtime: "auto", // auto | pi | 登録済み harness id（例: codex）
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

- `model`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 文字列形式は primary model のみを設定します。
  - オブジェクト形式は primary と順序付きのフェイルオーバー model を設定します。
- `imageModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `image` tool パスで、その vision-model 設定として使用されます。
  - 選択された/デフォルトの model が画像入力を受け付けられない場合のフォールバックルーティングにも使用されます。
- `imageGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の画像生成機能と、将来の画像を生成するあらゆる tool/plugin サーフェスで使用されます。
  - 一般的な値: Gemini ネイティブ画像生成には `google/gemini-3.1-flash-image-preview`、fal には `fal/fal-ai/flux/dev`、OpenAI Images には `openai/gpt-image-1`。
  - provider/model を直接選択する場合は、対応する provider の auth/API key も設定してください（たとえば `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`）。
  - 省略した場合でも、`image_generate` は auth がある provider デフォルトを推測できます。まず現在のデフォルト provider を試し、次に残りの登録済み画像生成 provider を provider-id 順で試します。
- `musicGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の音楽生成機能と、built-in の `music_generate` tool で使用されます。
  - 一般的な値: `google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`、または `minimax/music-2.5+`。
  - 省略した場合でも、`music_generate` は auth がある provider デフォルトを推測できます。まず現在のデフォルト provider を試し、次に残りの登録済み音楽生成 provider を provider-id 順で試します。
  - provider/model を直接選択する場合は、対応する provider の auth/API key も設定してください。
- `videoGenerationModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - 共有の動画生成機能と、built-in の `video_generate` tool で使用されます。
  - 一般的な値: `qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`、または `qwen/wan2.7-r2v`。
  - 省略した場合でも、`video_generate` は auth がある provider デフォルトを推測できます。まず現在のデフォルト provider を試し、次に残りの登録済み動画生成 provider を provider-id 順で試します。
  - provider/model を直接選択する場合は、対応する provider の auth/API key も設定してください。
  - bundled の Qwen 動画生成 provider は、最大 1 本の出力動画、1 枚の入力画像、4 本の入力動画、10 秒の長さ、および provider レベルの `size`、`aspectRatio`、`resolution`、`audio`、`watermark` オプションをサポートします。
- `pdfModel`: 文字列（`"provider/model"`）またはオブジェクト（`{ primary, fallbacks }`）を受け付けます。
  - `pdf` tool の model ルーティングで使用されます。
  - 省略した場合、PDF tool は `imageModel` にフォールバックし、さらに解決済みの session/デフォルト model にフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` tool のデフォルト PDF サイズ上限。
- `pdfMaxPages`: `pdf` tool の抽出フォールバックモードで考慮されるデフォルトの最大ページ数。
- `verboseDefault`: agent のデフォルト verbose レベル。値: `"off"`、`"on"`、`"full"`。デフォルト: `"off"`。
- `elevatedDefault`: agent のデフォルト elevated-output レベル。値: `"off"`、`"on"`、`"ask"`、`"full"`。デフォルト: `"on"`。
- `model.primary`: 形式は `provider/model`（例: `openai/gpt-5.4`）。provider を省略した場合、OpenClaw はまずエイリアスを試し、次にその正確な model id に対する一意の configured-provider 一致を試し、それでもだめなら設定されたデフォルト provider にフォールバックします（これは非推奨の互換動作なので、明示的な `provider/model` を推奨します）。その provider が設定済みデフォルト model をもう公開していない場合、OpenClaw は古くなって削除された provider デフォルトを表面化する代わりに、最初の configured provider/model にフォールバックします。
- `models`: `/model` 用の設定済み model カタログ兼 allowlist。各エントリには `alias`（ショートカット）と `params`（provider 固有。例: `temperature`、`maxTokens`、`cacheRetention`、`context1m`）を含められます。
- `params`: すべての model に適用されるグローバルデフォルトの provider パラメータ。`agents.defaults.params` に設定します（例: `{ cacheRetention: "long" }`）。
- `params` のマージ優先順位（設定）: `agents.defaults.params`（グローバルベース）は `agents.defaults.models["provider/model"].params`（model ごと）で上書きされ、さらに `agents.list[].params`（一致する agent id）がキーごとに上書きします。詳細は [Prompt Caching](/ja-JP/reference/prompt-caching) を参照してください。
- `embeddedHarness`: デフォルトの低レベル組み込み agent ランタイムポリシー。`runtime: "auto"` を使うと、登録済み plugin harness がサポートする model を引き受けられるようにし、`runtime: "pi"` を使うと built-in の Pi harness を強制し、`runtime: "codex"` のような登録済み harness id も指定できます。自動の Pi フォールバックを無効にするには `fallback: "none"` を設定します。
- これらのフィールドを変更する config writer（たとえば `/models set`、`/models set-image`、および fallback の追加/削除コマンド）は、正規のオブジェクト形式で保存し、可能な限り既存の fallback リストを保持します。
- `maxConcurrent`: session をまたいだ agent 実行の最大並列数です（各 session 自体は引き続き直列化されます）。デフォルト: 4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` は、どの低レベル executor が組み込み agent ターンを実行するかを制御します。
ほとんどのデプロイでは、デフォルトの `{ runtime: "auto", fallback: "pi" }` のままで問題ありません。
bundled の Codex app-server harness のように、信頼できる plugin がネイティブ harness を提供する場合に使用します。

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

- `runtime`: `"auto"`、`"pi"`、または登録済み plugin harness id。bundled の Codex Plugin は `codex` を登録します。
- `fallback`: `"pi"` または `"none"`。`"pi"` は built-in の Pi harness を互換性用フォールバックとして維持します。`"none"` は、plugin harness の選択が欠落しているか未対応の場合に、黙って Pi を使うのではなく失敗させます。
- 環境変数によるオーバーライド: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` は `runtime` を上書きします。`OPENCLAW_AGENT_HARNESS_FALLBACK=none` はそのプロセスでの Pi フォールバックを無効にします。
- Codex 専用デプロイでは、`model: "codex/gpt-5.4"`、`embeddedHarness.runtime: "codex"`、`embeddedHarness.fallback: "none"` を設定してください。
- これは組み込み chat harness のみを制御します。メディア生成、vision、PDF、音楽、動画、および TTS は引き続きそれぞれの provider/model 設定を使用します。

**Built-in の短縮 alias**（model が `agents.defaults.models` にある場合のみ適用）:

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

設定した alias は常にデフォルトより優先されます。

Z.AI の GLM-4.x model は、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、自動的に thinking mode を有効にします。
Z.AI model は tool call ストリーミングのためにデフォルトで `tool_stream` を有効にします。無効にするには `agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定してください。
Anthropic Claude 4.6 model は、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` thinking を使用します。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンドです（tool call なし）。API provider が失敗したときのバックアップとして便利です。

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

- CLI バックエンドはテキスト優先です。tools は常に無効です。
- `sessionArg` が設定されている場合、session をサポートします。
- `imageArg` がファイルパスを受け付ける場合、画像のパススルーをサポートします。

### `agents.defaults.systemPromptOverride`

OpenClaw が組み立てた system prompt 全体を固定文字列で置き換えます。デフォルトレベル（`agents.defaults.systemPromptOverride`）または agent ごと（`agents.list[].systemPromptOverride`）に設定します。agent ごとの値が優先されます。空文字または空白のみの値は無視されます。制御された prompt 実験に便利です。

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

定期的な Heartbeat 実行です。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // デフォルト: true。false の場合、system prompt から Heartbeat セクションを省略
        lightContext: false, // デフォルト: false。true の場合、workspace bootstrap ファイルから HEARTBEAT.md のみ保持
        isolatedSession: false, // デフォルト: false。true の場合、各 Heartbeat を新しい session で実行（会話履歴なし）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（デフォルト）| block
        target: "none", // デフォルト: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 期間文字列（ms/s/m/h）。デフォルト: `30m`（API-key 認証）または `1h`（OAuth 認証）。無効にするには `0m` を設定します。
- `includeSystemPromptSection`: false の場合、system prompt から Heartbeat セクションを省略し、bootstrap コンテキストへの `HEARTBEAT.md` 注入をスキップします。デフォルト: `true`。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中の tool エラー警告 payload を抑制します。
- `timeoutSeconds`: 中断されるまでの Heartbeat agent ターンの最大許容秒数。未設定の場合は `agents.defaults.timeoutSeconds` を使用します。
- `directPolicy`: direct/DM 配信ポリシー。`allow`（デフォルト）は direct ターゲットへの配信を許可します。`block` は direct ターゲットへの配信を抑止し、`reason=dm-blocked` を出力します。
- `lightContext`: true の場合、Heartbeat 実行は軽量な bootstrap コンテキストを使用し、workspace bootstrap ファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は以前の会話履歴を持たない新しい session で実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンです。Heartbeat ごとの token コストを約 100K から約 2-5K token に削減します。
- agent ごと: `agents.list[].heartbeat` を設定します。いずれかの agent が `heartbeat` を定義すると、Heartbeat を実行するのは**その agent だけ**になります。
- Heartbeat は完全な agent ターンを実行します。間隔を短くすると token 消費が増えます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 登録済み compaction provider plugin の id（オプション）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom のときに使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-6", // compaction 専用のオプションの model オーバーライド
        notifyUser: true, // compaction 開始時に短い通知を送信（デフォルト: false）
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

- `mode`: `default` または `safeguard`（長い履歴向けのチャンク化要約）。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `provider`: 登録済み compaction provider plugin の id。設定されている場合、built-in の LLM 要約の代わりに、その provider の `summarize()` が呼び出されます。失敗時は built-in にフォールバックします。provider を設定すると `mode: "safeguard"` が強制されます。[Compaction](/ja-JP/concepts/compaction) を参照してください。
- `timeoutSeconds`: OpenClaw が中断するまでに 1 回の compaction 操作に許可される最大秒数。デフォルト: `900`。
- `identifierPolicy`: `strict`（デフォルト）、`off`、または `custom`。`strict` は、compaction 要約時に built-in の不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` のときに使用される、識別子保持に関するオプションのカスタムテキスト。
- `postCompactionSections`: compaction 後に再注入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。再注入を無効にするには `[]` を設定します。未設定の場合、または明示的にそのデフォルトのペアを設定した場合、従来の互換フォールバックとして古い `Every Session`/`Safety` 見出しも受け入れられます。
- `model`: compaction 要約専用のオプションの `provider/model-id` オーバーライド。メイン session では 1 つの model を維持しつつ、compaction 要約は別の model で実行したい場合に使用します。未設定の場合、compaction は session の primary model を使用します。
- `notifyUser`: `true` の場合、compaction 開始時にユーザーへ短い通知を送ります（例: 「Compacting context...」）。compaction を静かに保つため、デフォルトでは無効です。
- `memoryFlush`: 耐久的な memory を保存するための、自動 compaction 前の無言の agent ターン。workspace が読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから**古い tool 結果**を剪定します。ディスク上の session 履歴は**変更しません**。

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
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl モードの動作">

- `mode: "cache-ttl"` は剪定パスを有効にします。
- `ttl` は、最後のキャッシュタッチ後にどのくらいの間隔で再び剪定を実行できるかを制御します。
- 剪定はまず大きすぎる tool 結果を soft-trim し、その後必要に応じて古い tool 結果を hard-clear します。

**Soft-trim** は先頭 + 末尾を保持し、中間に `...` を挿入します。

**Hard-clear** は tool 結果全体をプレースホルダーで置き換えます。

注意:

- 画像ブロックは切り詰めもクリアもされません。
- ratio は文字数ベース（概算）であり、正確な token 数ではありません。
- `keepLastAssistants` より少ない assistant メッセージしか存在しない場合、剪定はスキップされます。

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

- Telegram 以外の channel では、ブロック返信を有効にするには明示的な `*.blockStreaming: true` が必要です。
- channel ごとのオーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信間のランダムな待機。`natural` = 800–2500ms。agent ごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細は [Streaming](/ja-JP/concepts/streaming) を参照してください。

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

- デフォルト: direct chat/メンションでは `instant`、メンションされていないグループチャットでは `message`。
- session ごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[Typing Indicators](/ja-JP/concepts/typing-indicators) を参照してください。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

組み込み agent 用のオプションの sandboxing です。完全なガイドは [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

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
- `ssh`: 汎用 SSH バックのリモートランタイム
- `openshell`: OpenShell ランタイム

`backend: "openshell"` が選択されている場合、ランタイム固有の設定は
`plugins.entries.openshell.config` に移動します。

**SSH backend 設定:**

- `target`: `user@host[:port]` 形式の SSH ターゲット
- `command`: SSH クライアントコマンド（デフォルト: `ssh`）
- `workspaceRoot`: スコープごとの workspace に使われる絶対リモートルート
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH に渡される既存のローカルファイル
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw がランタイム時に一時ファイルへ具現化するインライン内容または SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH の host-key ポリシーノブ

**SSH 認証の優先順位:**

- `identityData` は `identityFile` より優先されます
- `certificateData` は `certificateFile` より優先されます
- `knownHostsData` は `knownHostsFile` より優先されます
- SecretRef バックの `*Data` 値は、sandbox session が開始される前にアクティブな secrets ランタイムスナップショットから解決されます

**SSH backend の動作:**

- 作成または再作成後にリモート workspace を 1 回シードします
- その後はリモート SSH workspace を正規とみなします
- `exec`、ファイル tools、メディアパスを SSH 経由でルーティングします
- リモートでの変更を自動的に host へ同期しません
- sandbox browser コンテナをサポートしません

**Workspace アクセス:**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとの sandbox workspace
- `ro`: `/workspace` に sandbox workspace、`/agent` に agent workspace を読み取り専用でマウント
- `rw`: `/workspace` に agent workspace を読み書き可能でマウント

**Scope:**

- `session`: session ごとのコンテナ + workspace
- `agent`: agent ごとに 1 つのコンテナ + workspace（デフォルト）
- `shared`: 共有コンテナと共有 workspace（session 間分離なし）

**OpenShell Plugin 設定:**

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

**OpenShell モード:**

- `mirror`: `exec` 前にローカルからリモートへシードし、`exec` 後に同期を戻します。ローカル workspace が正規のままです
- `remote`: sandbox 作成時にリモートへ 1 回シードし、その後はリモート workspace を正規とみなします

`remote` モードでは、seed ステップ後に OpenClaw の外で行われた host ローカル編集は、自動的には sandbox に同期されません。
転送は OpenShell sandbox への SSH ですが、sandbox のライフサイクルとオプションの mirror 同期は Plugin が管理します。

**`setupCommand`** はコンテナ作成後に 1 回だけ実行されます（`sh -lc` 経由）。network egress、書き込み可能な root、root user が必要です。

**コンテナのデフォルトは `network: "none"`** です — agent に外向きアクセスが必要なら `"bridge"`（またはカスタム bridge network）に設定してください。
`"host"` はブロックされます。`"container:<id>"` は、`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を明示的に設定しない限り、デフォルトでブロックされます（緊急用）。

**受信添付ファイル** は、アクティブ workspace の `media/inbound/*` にステージングされます。

**`docker.binds`** は追加の host ディレクトリをマウントします。グローバルと agent ごとの bind はマージされます。

**Sandboxed browser**（`sandbox.browser.enabled`）: コンテナ内の Chromium + CDP。noVNC URL が system prompt に注入されます。`openclaw.json` で `browser.enabled` は不要です。
noVNC のオブザーバーアクセスはデフォルトで VNC 認証を使用し、OpenClaw は共有 URL にパスワードを露出する代わりに短命な token URL を発行します。

- `allowHostControl: false`（デフォルト）は、sandbox 化された session から host browser を対象にすることをブロックします。
- `network` のデフォルトは `openclaw-sandbox-browser`（専用の bridge network）です。グローバル bridge 接続を明示的に望む場合にのみ `bridge` に設定してください。
- `cdpSourceRange` は、CDP の ingress をコンテナ境界で CIDR 範囲（例: `172.21.0.1/32`）にオプションで制限します。
- `sandbox.browser.binds` は追加の host ディレクトリを sandbox browser コンテナのみにマウントします。設定されている場合（`[]` を含む）、browser コンテナでは `docker.binds` を置き換えます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナ host 向けに調整されています:
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
    デフォルトで有効であり、WebGL/3D の使用で必要な場合は
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - ワークフローが extension に依存する場合は、
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で extension を再有効化します。
  - `--renderer-process-limit=2` は
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更できます。Chromium の
    デフォルトの process 制限を使うには `0` を設定します。
  - さらに、`noSandbox` が有効な場合は `--no-sandbox` と `--disable-setuid-sandbox`。
  - デフォルトはコンテナ image のベースラインです。コンテナのデフォルトを変更するには、
    カスタム browser image とカスタム entrypoint を使用してください。

</Accordion>

browser sandboxing と `sandbox.docker.binds` は Docker 専用です。

image をビルド:

```bash
scripts/sandbox-setup.sh           # メイン sandbox image
scripts/sandbox-browser-setup.sh   # オプションの browser image
```

### `agents.list`（agent ごとのオーバーライド）

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
        thinkingDefault: "high", // agent ごとの thinking レベルオーバーライド
        reasoningDefault: "on", // agent ごとの reasoning 可視性オーバーライド
        fastModeDefault: false, // agent ごとの fast mode オーバーライド
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 一致する defaults.models params をキーごとに上書き
        skills: ["docs-search"], // 設定時は agents.defaults.skills を置き換える
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

- `id`: 安定した agent id（必須）。
- `default`: 複数設定されている場合は最初のものが優先されます（警告を記録）。何も設定されていない場合は、最初の list エントリがデフォルトです。
- `model`: 文字列形式は `primary` のみを上書きし、オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` はグローバル fallback を無効化）。`primary` のみを上書きする Cron ジョブでも、`fallbacks: []` を設定しない限り、デフォルトの fallback を継承します。
- `params`: `agents.defaults.models` 内の選択された model エントリにマージされる agent ごとの stream params。model カタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などの agent 固有オーバーライドに使用します。
- `skills`: オプションの agent ごとの skill allowlist。省略すると、`agents.defaults.skills` が設定されていれば agent はそれを継承します。明示的なリストはデフォルトをマージせずに置き換え、`[]` は skills なしを意味します。
- `thinkingDefault`: オプションの agent ごとのデフォルト thinking レベル（`off | minimal | low | medium | high | xhigh | adaptive`）。メッセージごとまたは session のオーバーライドが設定されていない場合、この agent では `agents.defaults.thinkingDefault` を上書きします。
- `reasoningDefault`: オプションの agent ごとのデフォルト reasoning 可視性（`on | off | stream`）。メッセージごとまたは session の reasoning オーバーライドが設定されていない場合に適用されます。
- `fastModeDefault`: オプションの agent ごとの fast mode デフォルト（`true | false`）。メッセージごとまたは session の fast-mode オーバーライドが設定されていない場合に適用されます。
- `embeddedHarness`: オプションの agent ごとの低レベル harness ポリシーオーバーライド。1 つの agent だけを Codex 専用にし、他の agent はデフォルトの Pi フォールバックを維持するには `{ runtime: "codex", fallback: "none" }` を使用します。
- `runtime`: オプションの agent ごとのランタイム記述子。agent が ACP harness session をデフォルトにすべき場合は、`type: "acp"` と `runtime.acp` のデフォルト（`agent`、`backend`、`mode`、`cwd`）を使用します。
- `identity.avatar`: workspace 相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` 用の agent id allowlist（`["*"]` = 任意、デフォルト: 同じ agent のみ）。
- Sandbox 継承ガード: 要求元 session が sandbox 化されている場合、`sessions_spawn` は sandbox なしで実行されるターゲットを拒否します。
- `subagents.requireAgentId`: true の場合、`agentId` を省略した `sessions_spawn` 呼び出しをブロックします（明示的なプロファイル選択を強制。デフォルト: false）。

---

## マルチ agent ルーティング

1 つの Gateway 内で複数の分離された agent を実行します。[Multi-Agent](/ja-JP/concepts/multi-agent) を参照してください。

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

### Binding の match フィールド

- `type`（オプション）: 通常のルーティングには `route`（type 未指定も route 扱い）、永続 ACP 会話 binding には `acp`
- `match.channel`（必須）
- `match.accountId`（オプション。`*` = 任意のアカウント、省略 = デフォルトアカウント）
- `match.peer`（オプション。`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（オプション。channel 固有）
- `acp`（オプション。`type: "acp"` の場合のみ）: `{ mode, label, cwd, backend }`

**決定的な match 順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全一致、peer/guild/team なし）
5. `match.accountId: "*"`（channel 全体）
6. デフォルト agent

各 tier 内では、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリでは、OpenClaw は正確な会話 ID（`match.channel` + account + `match.peer.id`）で解決し、上記の route binding tier 順序は使用しません。

### agent ごとのアクセスプロファイル

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

<Accordion title="読み取り専用 tools + workspace">

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
    parentForkMaxTokens: 100000, // この token 数を超える親スレッド fork はスキップ（0 で無効）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration または false
      maxDiskBytes: "500mb", // オプションのハード予算
      highWaterBytes: "400mb", // オプションのクリーンアップ目標
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // デフォルトの非アクティブ時自動 unfocus 時間（`0` で無効）
      maxAgeHours: 0, // デフォルトのハード最大経過時間（`0` で無効）
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

<Accordion title="Session フィールドの詳細">

- **`scope`**: グループチャットコンテキストに対する基本の session グループ化戦略です。
  - `per-sender`（デフォルト）: channel コンテキスト内で、各送信者が分離された session を持ちます。
  - `global`: channel コンテキスト内のすべての参加者が 1 つの session を共有します（共有コンテキストを意図する場合にのみ使用してください）。
- **`dmScope`**: DM をどのようにグループ化するかです。
  - `main`: すべての DM が main session を共有します。
  - `per-peer`: channel をまたいで送信者 id ごとに分離します。
  - `per-channel-peer`: channel + 送信者ごとに分離します（複数ユーザー inbox に推奨）。
  - `per-account-channel-peer`: account + channel + 送信者ごとに分離します（複数アカウントに推奨）。
- **`identityLinks`**: channel をまたいだ session 共有のために、正規 id を provider 接頭辞付き peer にマップします。
- **`reset`**: 主たるリセットポリシー。`daily` はローカル時刻の `atHour` にリセットし、`idle` は `idleMinutes` 後にリセットします。両方が設定されている場合は、先に期限切れになるほうが優先されます。
- **`resetByType`**: タイプごとのオーバーライド（`direct`、`group`、`thread`）。従来の `dm` は `direct` のエイリアスとして受け付けられます。
- **`parentForkMaxTokens`**: fork された thread session を作成するときに許可される親 session の `totalTokens` 上限（デフォルト `100000`）。
  - 親の `totalTokens` がこの値を超える場合、OpenClaw は親の transcript 履歴を継承する代わりに、新しい thread session を開始します。
  - このガードを無効にして常に親 fork を許可するには `0` を設定します。
- **`mainKey`**: legacy フィールドです。ランタイムは main の direct-chat バケットに常に `"main"` を使用します。
- **`agentToAgent.maxPingPongTurns`**: agent 間のやり取りにおける agent 同士の返信往復の最大ターン数です（整数、範囲: `0`–`5`）。`0` は ping-pong チェーンを無効にします。
- **`sendPolicy`**: `channel`、`chatType`（`direct|group|channel`。legacy の `dm` エイリアスあり）、`keyPrefix`、または `rawKeyPrefix` でマッチします。最初に一致した deny が優先されます。
- **`maintenance`**: session ストアのクリーンアップ + 保持制御です。
  - `mode`: `warn` は警告のみを出し、`enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリに対する経過時間のしきい値（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` 内の最大エントリ数（デフォルト `500`）。
  - `rotateBytes`: `sessions.json` がこのサイズを超えたらローテーションします（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript アーカイブの保持期間。デフォルトでは `pruneAfter` に従います。無効にするには `false` を設定します。
  - `maxDiskBytes`: オプションの sessions ディレクトリのディスク予算。`warn` モードでは警告を記録し、`enforce` モードでは最も古い artifact/session から削除します。
  - `highWaterBytes`: 予算クリーンアップ後のオプションの目標値。デフォルトは `maxDiskBytes` の `80%` です。
- **`threadBindings`**: スレッドバインドされた session 機能のグローバルデフォルトです。
  - `enabled`: マスターのデフォルトスイッチ（provider はオーバーライド可能。Discord は `channels.discord.threadBindings.enabled` を使用）
  - `idleHours`: 非アクティブ時の自動 unfocus のデフォルト時間数（`0` で無効。provider はオーバーライド可能）
  - `maxAgeHours`: ハードな最大経過時間のデフォルト時間数（`0` で無効。provider はオーバーライド可能）

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

channel/account ごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決順（最も具体的なものが優先）: account → channel → global。`""` は無効化し、カスケードも停止します。`"auto"` は `[{identity.name}]` を導出します。

**テンプレート変数:**

| Variable          | 説明                     | Example                     |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | 短い model 名            | `claude-opus-4-6`           |
| `{modelFull}`     | 完全な model 識別子      | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider 名              | `anthropic`                 |
| `{thinkingLevel}` | 現在の thinking レベル   | `high`, `low`, `off`        |
| `{identity.name}` | agent identity 名        | （`"auto"` と同じ）         |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` のエイリアスです。

### Ack reaction

- デフォルトはアクティブ agent の `identity.emoji`、それ以外の場合は `"👀"` です。無効にするには `""` を設定します。
- channel ごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順: account → channel → `messages.ackReaction` → identity フォールバック。
- スコープ: `group-mentions`（デフォルト）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: Slack、Discord、Telegram では返信後に ack を削除します。
- `messages.statusReactions.enabled`: Slack、Discord、Telegram でライフサイクル status reaction を有効にします。
  Slack と Discord では、未設定の場合、ack reaction がアクティブなとき status reaction は有効のままです。
  Telegram では、ライフサイクル status reaction を有効にするには明示的に `true` を設定してください。

### Inbound debounce

同じ送信者からの短時間のテキストのみメッセージをまとめて 1 つの agent ターンにします。メディア/添付ファイルは即座にフラッシュされます。制御コマンドは debouncing をバイパスします。

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

- `auto` はデフォルトの自動 TTS モードを制御します: `off`、`always`、`inbound`、または `tagged`。`/tts on|off` はローカル設定を上書きでき、`/tts status` は有効状態を表示します。
- `summaryModel` は自動要約用に `agents.defaults.model.primary` を上書きします。
- `modelOverrides` はデフォルトで有効です。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- API key は `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントを上書きします。解決順は config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が OpenAI 以外のエンドポイントを指している場合、OpenClaw はそれを OpenAI 互換の TTS server として扱い、model/voice の検証を緩和します。

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

- `talk.provider` は、複数の Talk provider が設定されている場合、`talk.providers` 内のキーと一致していなければなりません。
- 従来のフラットな Talk キー（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）は互換性専用であり、自動的に `talk.providers.<provider>` に移行されます。
- Voice ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `providers.*.apiKey` は平文文字列または SecretRef オブジェクトを受け付けます。
- `ELEVENLABS_API_KEY` のフォールバックは、Talk API key が設定されていない場合にのみ適用されます。
- `providers.*.voiceAliases` により、Talk ディレクティブでわかりやすい名前を使用できます。
- `silenceTimeoutMs` は、Talk mode がユーザーの無音後どのくらい待ってから transcript を送信するかを制御します。未設定の場合はプラットフォームのデフォルトの待機時間を維持します（`macOS と Android では 700 ms、iOS では 900 ms`）。

---

## Tools

### tool profile

`tools.profile` は、`tools.allow`/`tools.deny` より前にベース allowlist を設定します:

ローカルオンボーディングでは、未設定の新しいローカル設定に対して `tools.profile: "coding"` がデフォルト設定されます（既存の明示的な profile は保持されます）。

| Profile     | 含まれるもの                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` のみ                                                                                                     |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                |
| `full`      | 制限なし（未設定と同じ）                                                                                                  |

### tool group

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` は `exec` のエイリアスとして受け付けられます）                              |
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
| `group:openclaw`   | すべての built-in tools（provider Plugin は除く）                                                                       |

### `tools.allow` / `tools.deny`

グローバルな tool の allow/deny ポリシーです（deny が優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker sandbox がオフでも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定の provider または model に対して tools をさらに制限します。順序: ベース profile → provider profile → allow/deny。

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

sandbox 外での elevated exec アクセスを制御します:

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

- agent ごとのオーバーライド（`agents.list[].tools.elevated`）は、さらに制限することしかできません。
- `/elevated on|off|ask|full` は状態を session ごとに保存します。インラインディレクティブは単一メッセージに適用されます。
- elevated `exec` は sandboxing をバイパスし、設定された escape path を使用します（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）。

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

tool ループ安全チェックはデフォルトで**無効**です。検出を有効にするには `enabled: true` を設定します。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` で agent ごとに上書きできます。

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

- `historySize`: ループ分析のために保持される tool-call 履歴の最大数。
- `warningThreshold`: 警告を出す、進捗のない繰り返しパターンのしきい値。
- `criticalThreshold`: 重大なループをブロックするための、より高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進捗のない実行に対するハード停止しきい値。
- `detectors.genericRepeat`: 同じ tool/同じ引数の繰り返し呼び出しで警告します。
- `detectors.knownPollNoProgress`: 既知の poll tool（`process.poll`、`command_status` など）で進捗がない場合に警告/ブロックします。
- `detectors.pingPong`: 進捗のない交互ペアパターンで警告/ブロックします。
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

受信メディア理解（画像/音声/動画）を設定します:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // オプトイン: 完了した async 音楽/動画を channel に直接送信
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

<Accordion title="Media model エントリのフィールド">

**Provider エントリ**（`type: "provider"` または省略）:

- `provider`: API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` など）
- `model`: model id オーバーライド
- `profile` / `preferredProfile`: `auth-profiles.json` の profile 選択

**CLI エントリ**（`type: "cli"`）:

- `command`: 実行する executable
- `args`: テンプレート化された引数（`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート）

**共通フィールド:**

- `capabilities`: オプションのリスト（`image`、`audio`、`video`）。デフォルト: `openai`/`anthropic`/`minimax` → image、`google` → image+audio+video、`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとのオーバーライド。
- 失敗時は次のエントリにフォールバックします。

provider の auth は標準順に従います: `auth-profiles.json` → env vars → `models.providers.*.apiKey`。

**Async completion フィールド:**

- `asyncCompletion.directSend`: `true` の場合、完了した async `music_generate`
  および `video_generate` タスクはまず direct channel 配信を試みます。デフォルト: `false`
  （従来の requester-session wake/model-delivery パス）。

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

session tools（`sessions_list`、`sessions_history`、`sessions_send`）でどの session を対象にできるかを制御します。

デフォルト: `tree`（現在の session + そこから spawn された session。subagent など）。

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
- `tree`: 現在の session + 現在の session から spawn された session（subagent）。
- `agent`: 現在の agent id に属する任意の session（同じ agent id の下で per-sender session を実行している場合、他のユーザーを含むことがあります）。
- `all`: 任意の session。agent をまたぐターゲティングには引き続き `tools.agentToAgent` が必要です。
- Sandbox clamp: 現在の session が sandbox 化されていて、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` の場合、`tools.sessions.visibility="all"` でも visibility は `tree` に強制されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルサポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // オプトイン: インラインファイル添付を許可するには true
        maxTotalBytes: 5242880, // 全ファイル合計で 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // ファイルごとに 1 MB
        retainOnSessionKeep: false, // cleanup="keep" のときに添付ファイルを保持
      },
    },
  },
}
```

注意:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。ACP runtime はこれを拒否します。
- ファイルは子 workspace の `.openclaw/attachments/<uuid>/` に `.manifest.json` とともに具現化されます。
- 添付ファイルの内容は transcript の永続化から自動的に秘匿化されます。
- Base64 入力は、厳格な alphabet/padding チェックとデコード前サイズガードで検証されます。
- ファイル権限は、ディレクトリが `0700`、ファイルが `0600` です。
- クリーンアップは `cleanup` ポリシーに従います: `delete` は常に添付ファイルを削除し、`keep` は `retainOnSessionKeep: true` のときのみ保持します。

### `tools.experimental`

実験的な built-in tool フラグです。strict-agentic GPT-5 の自動有効化ルールが適用される場合を除き、デフォルトではオフです。

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

- `planTool`: 自明でない複数ステップ作業の追跡のための、構造化された `update_plan` tool を有効にします。
- デフォルト: `false`。ただし `agents.defaults.embeddedPi.executionContract`（または agent ごとのオーバーライド）が OpenAI または OpenAI Codex の GPT-5 ファミリー実行で `"strict-agentic"` に設定されている場合を除きます。この範囲外でも tool を強制的に有効にするには `true` を設定し、strict-agentic GPT-5 実行でも無効のままにするには `false` を設定します。
- 有効にすると、system prompt にも使用ガイダンスが追加され、model はこれを重要な作業にのみ使用し、`in_progress` のステップは常に最大 1 つまでに保ちます。

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

- `model`: spawn される sub-agent のデフォルト model。省略した場合、sub-agent は呼び出し元の model を継承します。
- `allowAgents`: 要求元 agent が独自の `subagents.allowAgents` を設定していない場合の、`sessions_spawn` 用ターゲット agent id のデフォルト allowlist（`["*"]` = 任意、デフォルト: 同じ agent のみ）。
- `runTimeoutSeconds`: tool 呼び出しで `runTimeoutSeconds` が省略された場合の、`sessions_spawn` のデフォルトタイムアウト（秒）。`0` はタイムアウトなしを意味します。
- subagent ごとの tool ポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタム provider と base URL

OpenClaw は built-in の model カタログを使用します。カスタム provider は config の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` で追加します。

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

- カスタム認証が必要な場合は `authHeader: true` + `headers` を使用してください。
- agent 設定ルートは `OPENCLAW_AGENT_DIR`（または legacy の環境変数エイリアス `PI_CODING_AGENT_DIR`）で上書きします。
- 一致する provider ID に対するマージ優先順位:
  - 空でない agent `models.json` の `baseUrl` 値が優先されます。
  - 空でない agent `apiKey` 値は、その provider が現在の config/auth-profile コンテキストで SecretRef 管理されていない場合にのみ優先されます。
  - SecretRef 管理の provider `apiKey` 値は、解決済み secret を永続化する代わりに、ソースマーカー（env ref なら `ENV_VAR_NAME`、file/exec ref なら `secretref-managed`）から再取得されます。
  - SecretRef 管理の provider header 値は、ソースマーカー（env ref なら `secretref-env:ENV_VAR_NAME`、file/exec ref なら `secretref-managed`）から再取得されます。
  - 空または欠落した agent `apiKey`/`baseUrl` は、config の `models.providers` にフォールバックします。
  - 一致する model の `contextWindow`/`maxTokens` は、明示的な config 値と暗黙のカタログ値の高いほうを使用します。
  - 一致する model の `contextTokens` は、明示的なランタイム上限が存在する場合はそれを保持します。ネイティブ model メタデータを変更せずに有効コンテキストを制限するために使用してください。
  - config で `models.json` を完全に上書きしたい場合は `models.mode: "replace"` を使用します。
  - マーカーの永続化はソースを正とします: マーカーは、解決済みランタイム secret 値ではなく、アクティブなソース config スナップショット（解決前）から書き込まれます。

### Provider フィールドの詳細

- `models.mode`: provider カタログの動作（`merge` または `replace`）。
- `models.providers`: provider id をキーとするカスタム provider マップ。
- `models.providers.*.api`: リクエストアダプタ（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など）。
- `models.providers.*.apiKey`: provider 資格情報（SecretRef/env 置換を推奨）。
- `models.providers.*.auth`: auth 戦略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` 用で、リクエストに `options.num_ctx` を注入します（デフォルト: `true`）。
- `models.providers.*.authHeader`: 必要な場合に `Authorization` ヘッダーでの資格情報送信を強制します。
- `models.providers.*.baseUrl`: 上流 API の base URL。
- `models.providers.*.headers`: proxy/tenant ルーティング用の追加の静的ヘッダー。
- `models.providers.*.request`: model-provider HTTP リクエスト用の転送オーバーライド。
  - `request.headers`: 追加ヘッダー（provider デフォルトとマージされます）。値は SecretRef を受け付けます。
  - `request.auth`: auth 戦略のオーバーライド。モード: `"provider-default"`（provider の built-in auth を使用）、`"authorization-bearer"`（`token` を使用）、`"header"`（`headerName`、`value`、オプションの `prefix` を使用）。
  - `request.proxy`: HTTP proxy のオーバーライド。モード: `"env-proxy"`（`HTTP_PROXY`/`HTTPS_PROXY` env vars を使用）、`"explicit-proxy"`（`url` を使用）。どちらのモードでもオプションの `tls` サブオブジェクトを受け付けます。
  - `request.tls`: 直接接続用の TLS オーバーライド。フィールド: `ca`、`cert`、`key`、`passphrase`（すべて SecretRef を受け付けます）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`: `true` の場合、provider HTTP fetch ガード経由で、DNS が private、CGNAT、または類似の範囲に解決される `baseUrl` への HTTPS を許可します（信頼できる self-hosted OpenAI 互換エンドポイントに対する operator のオプトイン）。WebSocket はヘッダー/TLS に同じ `request` を使用しますが、その fetch SSRF ガードは使用しません。デフォルトは `false`。
- `models.providers.*.models`: 明示的な provider model カタログエントリ。
- `models.providers.*.models.*.contextWindow`: ネイティブ model のコンテキストウィンドウメタデータ。
- `models.providers.*.models.*.contextTokens`: オプションのランタイムコンテキスト上限。model のネイティブ `contextWindow` より小さい有効コンテキスト予算にしたい場合に使用します。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。`api: "openai-completions"` で空でない非ネイティブ `baseUrl`（host が `api.openai.com` ではない）の場合、OpenClaw はランタイムでこれを `false` に強制します。空または省略された `baseUrl` はデフォルトの OpenAI 動作を維持します。
- `models.providers.*.models.*.compat.requiresStringContent`: 文字列のみを受け付ける OpenAI 互換 chat エンドポイント向けのオプションの互換性ヒント。`true` の場合、OpenClaw はリクエスト送信前に純テキストの `messages[].content` 配列を平文文字列へフラット化します。
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動検出設定のルート。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 暗黙的な検出をオン/オフします。
- `plugins.entries.amazon-bedrock.config.discovery.region`: 検出用の AWS リージョン。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ターゲットを絞った検出用のオプションの provider-id フィルター。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 検出更新のポーリング間隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 検出された model のフォールバックコンテキストウィンドウ。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 検出された model のフォールバック最大出力 token 数。

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

Cerebras には `cerebras/zai-glm-4.7` を使用し、Z.AI 直結には `zai/glm-4.7` を使用します。

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

`OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を設定します。Zen カタログには `opencode/...` 参照を使い、Go カタログには `opencode-go/...` 参照を使います。ショートカット: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`。

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

`ZAI_API_KEY` を設定します。`z.ai/*` と `z-ai/*` は受け付けられるエイリアスです。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント（デフォルト）: `https://api.z.ai/api/coding/paas/v4`
- 一般エンドポイント用には、base URL オーバーライド付きのカスタム provider を定義します。

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

中国エンドポイントには `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn` を使用します。

ネイティブ Moonshot エンドポイントは、共有 `openai-completions` 転送上でストリーミング利用互換性を通知し、OpenClaw は built-in provider id 単独ではなく、そのエンドポイント機能に基づいてこれを判断します。

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

Anthropic 互換の built-in provider です。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

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

base URL には `/v1` を含めないでください（Anthropic クライアントが付加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

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

`MINIMAX_API_KEY` を設定します。ショートカット:
`openclaw onboard --auth-choice minimax-global-api` または
`openclaw onboard --auth-choice minimax-cn-api`。
model カタログのデフォルトは M2.7 のみです。
Anthropic 互換ストリーミングパスでは、OpenClaw は明示的に `thinking` を設定しない限り、
デフォルトで MiniMax の thinking を無効にします。`/fast on` または
`params.fastMode: true` は `MiniMax-M2.7` を
`MiniMax-M2.7-highspeed` に書き換えます。

</Accordion>

<Accordion title="ローカル model（LM Studio）">

[Local Models](/ja-JP/gateway/local-models) を参照してください。要点: 十分なハードウェア上の LM Studio Responses API 経由で大きなローカル model を実行し、フォールバックのためにホスト型 model はマージしたままにしてください。

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

- `allowBundled`: bundled Skills のみを対象とするオプションの allowlist です（managed/workspace Skills には影響しません）。
- `load.extraDirs`: 追加の共有 skill ルート（最も低い優先順位）。
- `install.preferBrew`: `true` の場合、`brew` が利用可能であれば他の installer 種別にフォールバックする前に Homebrew installer を優先します。
- `install.nodeManager`: `metadata.openclaw.install` 指定に対する node installer の優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、bundled/installed であってもその skill を無効にします。
- `entries.<skillKey>.apiKey`: プライマリ env var を宣言する skill 用の簡易設定です（平文文字列または SecretRef オブジェクト）。

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

- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` から読み込まれます。
- 検出はネイティブ OpenClaw Plugin に加え、互換性のある Codex bundle と Claude bundle を受け付けます。これには manifest なしの Claude デフォルトレイアウト bundle も含まれます。
- **設定変更には gateway の再起動が必要です。**
- `allow`: オプションの allowlist（一覧にある Plugin のみ読み込まれます）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: Plugin レベルの API key 簡易フィールド（Plugin がサポートしている場合）。
- `plugins.entries.<id>.env`: Plugin スコープの env var マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、legacy の `before_agent_start` からの prompt 変更フィールドを無視します。一方で legacy の `modelOverride` と `providerOverride` は保持されます。ネイティブ Plugin hook と、サポートされる bundle 提供 hook ディレクトリに適用されます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin がバックグラウンド subagent 実行に対して実行ごとの `provider` と `model` のオーバーライドを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼された subagent オーバーライド向けの、正規 `provider/model` ターゲットのオプションの allowlist。任意の model を許可したいことを意図している場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: Plugin 定義の設定オブジェクト（利用可能な場合はネイティブ OpenClaw Plugin schema で検証されます）。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl の web-fetch provider 設定。
  - `apiKey`: Firecrawl API key（SecretRef を受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、legacy の `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` env var にフォールバックします。
  - `baseUrl`: Firecrawl API base URL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: キャッシュの最大経過時間（ミリ秒）（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: scrape リクエストのタイムアウト秒数（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search provider を有効にします。
  - `model`: 検索に使用する Grok model（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory Dreaming 設定。フェーズとしきい値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: Dreaming のマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各フル Dreaming スイープの Cron 間隔（デフォルトは `"0 3 * * *"`）。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向け設定キーではありません）。
- 完全な memory 設定は [Memory configuration reference](/ja-JP/reference/memory-config) にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効な Claude bundle Plugin は、`settings.json` から組み込み Pi デフォルトを提供することもできます。OpenClaw はそれらを生の OpenClaw 設定パッチとしてではなく、サニタイズされた agent 設定として適用します。
- `plugins.slots.memory`: アクティブな memory Plugin id を選択するか、memory Plugin を無効にするには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブな context engine Plugin id を選択します。別の engine をインストールして選択しない限り、デフォルトは `"legacy"` です。
- `plugins.installs`: `openclaw plugins update` で使用される CLI 管理のインストールメタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt` を含みます。
  - `plugins.installs.*` は管理状態として扱い、手動編集より CLI コマンドを優先してください。

[Plugins](/ja-JP/tools/plugin) を参照してください。

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼できる private-network アクセスでのみオプトイン
      // allowPrivateNetwork: true, // legacy エイリアス
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

- `evaluateEnabled: false` は `act:evaluate` と `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時は無効なので、browser ナビゲーションはデフォルトで strict のままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` は、private-network browser ナビゲーションを意図的に信頼する場合にのみ設定してください。
- strict モードでは、リモート CDP profile エンドポイント（`profiles.*.cdpUrl`）にも、到達性/検出チェック時に同じ private-network ブロックが適用されます。
- `ssrfPolicy.allowPrivateNetwork` は legacy エイリアスとして引き続きサポートされます。
- strict モードでは、明示的な例外のために `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用します。
- リモート profile は attach-only です（start/stop/reset は無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。
  provider が直接の DevTools WebSocket URL を提供する場合は WS(S) を、
  OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用してください。
- `existing-session` profile は CDP の代わりに Chrome MCP を使用し、
  選択された host 上、または接続された browser Node を通じて attach できます。
- `existing-session` profile では、Brave や Edge のような特定の
  Chromium ベース browser profile を対象にするために `userDataDir` を設定できます。
- `existing-session` profile は、現在の Chrome MCP ルート制限を維持します:
  CSS セレクターターゲティングではなく snapshot/ref ベースのアクション、
  単一ファイルのアップロード hook、dialog タイムアウトオーバーライドなし、
  `wait --load networkidle` なし、そして `responsebody`、PDF エクスポート、
  ダウンロードのインターセプト、batch アクションもありません。
- ローカル管理の `openclaw` profile は `cdpPort` と `cdpUrl` を自動割り当てします。
  明示的に `cdpUrl` を設定するのはリモート CDP の場合だけにしてください。
- 自動検出順: デフォルト browser が Chromium ベースならそれを優先 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- Control service: loopback のみ（port は `gateway.port` から導出、デフォルト `18791`）。
- `extraArgs` は、ローカル Chromium 起動に追加の起動フラグを付加します（たとえば
  `--disable-gpu`、ウィンドウサイズ指定、またはデバッグフラグ）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji、短いテキスト、画像 URL、または data URI
    },
  },
}
```

- `seamColor`: ネイティブアプリ UI chrome のアクセントカラー（Talk Mode のバブル色など）。
- `assistant`: Control UI の identity オーバーライド。アクティブ agent の identity にフォールバックします。

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
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy 用。/gateway/trusted-proxy-auth を参照
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
      // allowExternalEmbedUrls: false, // 危険: 絶対外部 http(s) 埋め込み URL を許可
      // allowedOrigins: ["https://control.example.com"], // loopback 以外の Control UI に必須
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危険な Host-header origin フォールバックモード
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
    // オプション。デフォルト false。
    allowRealIpFallback: false,
    tools: {
      // 追加の /tools/invoke HTTP deny
      deny: ["browser"],
      // デフォルトの HTTP deny リストから tool を削除
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

<Accordion title="Gateway フィールドの詳細">

- `mode`: `local`（gateway を実行）または `remote`（リモート gateway に接続）。gateway は `local` でない限り起動を拒否します。
- `port`: WS + HTTP 用の単一の多重化 port。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IP のみ）、または `custom`。
- **legacy の bind エイリアス**: `gateway.bind` には host エイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind mode の値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Docker の注意**: デフォルトの `loopback` bind は、コンテナ内で `127.0.0.1` に listen します。Docker bridge ネットワーク（`-p 18789:18789`）では、トラフィックは `eth0` に到着するため、gateway へ到達できません。`--network host` を使うか、すべてのインターフェースで listen するように `bind: "lan"`（または `customBindHost: "0.0.0.0"` を伴う `bind: "custom"`）を設定してください。
- **Auth**: デフォルトで必須です。loopback 以外の bind では gateway auth が必要です。実際には、共有 token/password または `gateway.auth.mode: "trusted-proxy"` を持つ identity-aware なリバース proxy を意味します。オンボーディングウィザードはデフォルトで token を生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRef を含む）、`gateway.auth.mode` を `token` または `password` に明示設定してください。両方が設定されていて mode が未設定の場合、起動と service の install/repair フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な no-auth モード。信頼できるローカル local loopback 構成でのみ使用してください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: auth を identity-aware なリバース proxy に委譲し、`gateway.trustedProxies` からの identity ヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードは**非 loopback** の proxy ソースを想定しています。同一 host の loopback リバース proxy は trusted-proxy auth の条件を満たしません。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の identity ヘッダーが Control UI/WebSocket auth を満たせます（`tailscale whois` で検証）。HTTP API エンドポイントはその Tailscale ヘッダー auth を使用しません。代わりに、gateway の通常の HTTP auth mode に従います。この token なしフローは gateway host が信頼されていることを前提とします。`tailscale.mode = "serve"` の場合のデフォルトは `true` です。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッターです。クライアント IP ごと、かつ auth スコープごとに適用されます（共有 secret と device-token は独立して追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` に対する失敗試行は失敗書き込み前に直列化されます。そのため、同じクライアントからの同時の不正試行は、両方が通常の不一致として通るのではなく、2 番目のリクエストでリミッターに引っかかることがあります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックも意図的に rate limit したい場合（テスト構成や厳格な proxy デプロイなど）は `false` に設定してください。
- browser 由来の WS auth 試行は、loopback 免除を無効にした状態で常にスロットリングされます（browser ベースの localhost 総当たりに対する多層防御）。
- loopback 上では、それらの browser 由来 lockout は正規化された `Origin`
  値ごとに分離されるため、ある localhost origin からの繰り返し失敗が、
  別の origin を自動的に lock out することはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback bind）または `funnel`（公開、auth 必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的な browser-origin allowlist。browser クライアントを loopback 以外の origin から受け付ける場合に必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin ポリシーに意図的に依存するデプロイ用の、危険な Host-header origin フォールバックモードを有効にします。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` でなければなりません。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼できる private-network IP への平文 `ws://` を許可するクライアント側の緊急用オーバーライドです。デフォルトでは、平文許可は loopback のみに留まります。
- `gateway.remote.token` / `.password` は remote-client の資格情報フィールドです。それ自体では gateway auth を設定しません。
- `gateway.push.apns.relay.baseUrl`: relay バック登録を gateway に公開した後、公式/TestFlight iOS ビルドが使用する外部 APNs relay のベース HTTPS URL。この URL は iOS ビルドにコンパイルされた relay URL と一致していなければなりません。
- `gateway.push.apns.relay.timeoutMs`: gateway から relay への送信タイムアウト（ミリ秒）。デフォルトは `10000`。
- relay バック登録は特定の gateway identity に委譲されます。ペアリングされた iOS app は `gateway.identity.get` を取得し、その identity を relay 登録に含め、登録スコープの send grant を gateway に転送します。別の gateway はその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記 relay 設定の一時的な env オーバーライドです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL 用の開発専用 escape hatch。本番 relay URL は HTTPS のままにしてください。
- `gateway.channelHealthCheckMinutes`: channel health-monitor の間隔（分）。health-monitor による再起動をグローバルに無効にするには `0` を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: 古い socket とみなすしきい値（分）。これは `gateway.channelHealthCheckMinutes` 以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: 1 時間のローリングウィンドウ内で、channel/account ごとに health-monitor が行える最大再起動回数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル monitor を有効のまま維持しつつ、channel ごとに health-monitor 再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウント channel 用のアカウントごとのオーバーライド。設定されている場合、channel レベルのオーバーライドより優先されます。
- ローカル gateway の呼び出しパスは、`gateway.auth.*` が未設定の場合にのみ、`gateway.remote.*` をフォールバックとして使えます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定されていて未解決の場合、解決はフェイルクローズします（remote フォールバックで覆い隠されません）。
- `trustedProxies`: TLS を終端するか、転送された client ヘッダーを注入するリバース proxy の IP。自分が管理する proxy のみを一覧に入れてください。loopback エントリは同一 host の proxy/ローカル検出構成（例: Tailscale Serve やローカル reverse proxy）では引き続き有効ですが、loopback リクエストが `gateway.auth.mode: "trusted-proxy"` の対象になるわけでは**ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに gateway は `X-Real-IP` を受け付けます。フェイルクローズ動作のためデフォルトは `false`。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加でブロックする tool 名（デフォルト deny リストを拡張）。
- `gateway.tools.allow`: デフォルトの HTTP deny リストから削除する tool 名。

</Accordion>

### OpenAI 互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses の URL 入力ハードニング:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の allowlist は未設定として扱われます。URL 取得を無効にするには
    `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用してください。
- オプションのレスポンスハードニングヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分で管理する HTTPS origin に対してのみ設定してください。詳細は [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 複数インスタンスの分離

1 台の host で、固有の port と state dir を使って複数の gateway を実行します:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev`（`~/.openclaw-dev` + port `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

[Multiple Gateways](/ja-JP/gateway/multiple-gateways) を参照してください。

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

- `enabled`: gateway リスナーで TLS 終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカル/開発用途専用として自己署名の cert/key ペアを自動生成します。
- `certPath`: TLS 証明書ファイルへのファイルシステムパス。
- `keyPath`: TLS 秘密鍵ファイルへのファイルシステムパス。権限を制限して保持してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用のオプションの CA bundle パス。

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

- `mode`: 設定編集をランタイムでどう適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常に gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まず hot reload を試し、必要なら再起動にフォールバックします。
- `debounceMs`: 設定変更を適用する前の debounce ウィンドウ（ms）（非負整数）。
- `deferralTimeoutMs`: 再起動を強制する前に、進行中の操作を待つ最大時間（ms）（デフォルト: `300000` = 5 分）。

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
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
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

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。
クエリ文字列の hook token は拒否されます。

検証と安全性に関する注意:

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と**異なっていなければなりません**。Gateway token の再利用は拒否されます。
- `hooks.path` は `/` にはできません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト payload の `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` で解決されます

<Accordion title="Mapping の詳細">

- `match.path` は `/hooks` の後ろのサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス用の payload フィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートは payload から読み取ります。
- `transform` は hook action を返す JS/TS module を指せます。
  - `transform.module` は相対パスでなければならず、`hooks.transformsDir` 内に留まります（絶対パスや traversal は拒否されます）。
- `agentId` は特定の agent へルーティングします。不明な ID はデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的ルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` がない hook agent 実行用のオプションの固定 session key。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（request + mapping）向けのオプションのプレフィックス allowlist。例: `["hook:"]`。
- `deliver: true` は最終返信を channel に送信します。`channel` のデフォルトは `last` です。
- `model` はこの hook 実行用の LLM を上書きします（model カタログが設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail 連携

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

- 設定されている場合、gateway は起動時に `gog gmail watch serve` を自動起動します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。
- Gateway と並行して別の `gog gmail watch serve` を実行しないでください。

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

- agent が編集可能な HTML/CSS/JS と A2UI を Gateway port 配下で HTTP 提供します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- loopback 以外の bind では、canvas ルートにも他の Gateway HTTP サーフェスと同様に Gateway auth（token/password/trusted-proxy）が必要です。
- Node WebView は通常 auth ヘッダーを送信しません。Node がペアリングされて接続されると、Gateway は canvas/A2UI アクセス用の Node スコープ capability URL を通知します。
- capability URL はアクティブな Node WS session にバインドされ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 配信する HTML に live-reload client を注入します。
- 空の場合はスターター `index.html` を自動作成します。
- A2UI も `/__openclaw__/a2ui/` で提供します。
- 変更には gateway の再起動が必要です。
- 大きなディレクトリや `EMFILE` エラーの場合は live reload を無効にしてください。

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

- `minimal`（デフォルト）: TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。
- hostname のデフォルトは `openclaw` です。`OPENCLAW_MDNS_HOSTNAME` で上書きします。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD zone を書き込みます。ネットワークをまたぐ discovery には、DNS サーバー（CoreDNS 推奨）+ Tailscale split DNS と組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## Environment

### `env`（インライン env vars）

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

- インライン env vars は、process env にそのキーが存在しない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` + `~/.openclaw/.env`（どちらも既存の var を上書きしません）。
- `shellEnv`: ログイン shell の profile から、期待される不足キーを取り込みます。
- 完全な優先順位は [Environment](/ja-JP/help/environment) を参照してください。

### Env var 置換

任意の config 文字列で `${VAR_NAME}` を使って env vars を参照できます:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 存在しない/空の var は config 読み込み時にエラーになります。
- リテラルの `${VAR}` には `$${VAR}` でエスケープします。
- `$include` でも動作します。

---

## Secrets

SecretRef は加算的です: 平文値も引き続き動作します。

### `SecretRef`

1 つのオブジェクト形状を使用します:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON pointer（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には、`.` や `..` のような slash 区切りパスセグメントを含めてはいけません（例: `a/../b` は拒否されます）

### サポートされる資格情報サーフェス

- 正規マトリクス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` はサポートされる `openclaw.json` の資格情報パスを対象にします。
- `auth-profiles.json` の ref もランタイム解決と監査対象に含まれます。

### Secret provider 設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // オプションの明示的 env provider
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

- `file` provider は `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue モードでは `id` は `"value"` でなければなりません）。
- `exec` provider には絶対 `command` パスが必要で、stdin/stdout 上の protocol payload を使用します。
- デフォルトでは、シンボリックリンクの command パスは拒否されます。解決後のターゲットパスを検証したうえでシンボリックリンクパスを許可するには `allowSymlinkCommand: true` を設定します。
- `trustedDirs` が設定されている場合、trusted-dir チェックは解決後のターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret ref はアクティベーション時にメモリ内スナップショットへ解決され、その後の request パスはそのスナップショットのみを読みます。
- アクティベーション中に active-surface フィルタリングが適用されます: 有効サーフェス上の未解決 ref は起動/再読み込みを失敗させ、非アクティブサーフェスは診断付きでスキップされます。

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

- agent ごとの profile は `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的資格情報モード向けに値レベルの ref（`api_key` には `keyRef`、`token` には `tokenRef`）をサポートします。
- OAuth モードの profile（`auth.profiles.<id>.mode = "oauth"`）は SecretRef バックの auth-profile 資格情報をサポートしません。
- 静的ランタイム資格情報はメモリ内の解決済みスナップショットから取得され、legacy の静的 `auth.json` エントリは発見時に除去されます。
- legacy の OAuth は `~/.openclaw/credentials/oauth.json` から取り込まれます。
- [OAuth](/ja-JP/concepts/oauth) を参照してください。
- secrets ランタイムの動作と `audit/configure/apply` ツール: [Secrets Management](/ja-JP/gateway/secrets)。

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

- `billingBackoffHours`: profile が真の請求/残高不足エラーで失敗したときの基本 backoff 時間（時間）（デフォルト: `5`）。明示的な請求テキストは `401`/`403` 応答でもここに入ることがありますが、provider 固有のテキストマッチャーは引き続きその provider にのみ適用されます（例: OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の usage-window や organization/workspace の spend-limit メッセージは、代わりに `rate_limit` パスに留まります。
- `billingBackoffHoursByProvider`: 請求 backoff 時間に対するオプションの provider ごとのオーバーライド。
- `billingMaxHours`: 請求 backoff の指数的増加の上限時間（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼の `auth_permanent` 失敗に対する基本 backoff 時間（分）（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` backoff 増加の上限分数（デフォルト: `60`）。
- `failureWindowHours`: backoff カウンタに使われるローリングウィンドウ（時間）（デフォルト: `24`）。
- `overloadedProfileRotations`: 過負荷エラー時に model fallback へ切り替える前の、同一 provider の auth-profile ローテーション最大回数（デフォルト: `1`）。`ModelNotReadyException` のような provider-busy 形状はここに入ります。
- `overloadedBackoffMs`: 過負荷 provider/profile ローテーション再試行前の固定待機時間（デフォルト: `0`）。
- `rateLimitedProfileRotations`: rate-limit エラー時に model fallback へ切り替える前の、同一 provider の auth-profile ローテーション最大回数（デフォルト: `1`）。この rate-limit バケットには `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のような provider 形状テキストも含まれます。

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

- デフォルトのログファイル: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 安定したパスにするには `logging.file` を設定してください。
- `consoleLevel` は `--verbose` で `debug` に上がります。
- `maxFileBytes`: 書き込み抑止前のログファイル最大サイズ（バイト）（正の整数、デフォルト: `524288000` = 500 MB）。本番デプロイでは外部ログローテーションを使用してください。

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

- `enabled`: 計測出力のマスタートグルです（デフォルト: `true`）。
- `flags`: ターゲットを絞ったログ出力を有効にするフラグ文字列の配列です（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: session が processing 状態のままである間に stuck-session 警告を出すための経過時間しきい値（ms）。
- `otel.enabled`: OpenTelemetry のエクスポートパイプラインを有効にします（デフォルト: `false`）。
- `otel.endpoint`: OTel エクスポート用の collector URL。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel エクスポートリクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: resource attribute 用の service 名。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、または log エクスポートを有効にします。
- `otel.sampleRate`: trace サンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期的な telemetry flush 間隔（ms）。
- `cacheTrace.enabled`: 組み込み実行用の cache trace スナップショットをログ出力します（デフォルト: `false`）。
- `cacheTrace.filePath`: cache trace JSONL の出力パス（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: cache trace 出力に何を含めるかを制御します（すべてデフォルト: `true`）。

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

- `channel`: npm/git インストール用のリリースチャネル — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: gateway 起動時に npm 更新を確認します（デフォルト: `true`）。
- `auto.enabled`: package インストール用のバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable channel の自動適用前の最小遅延時間（時間）（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable channel の追加ロールアウト分散ウィンドウ（時間）（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta channel の確認実行間隔（時間）（デフォルト: `1`、最大: `24`）。

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

- `enabled`: グローバル ACP 機能ゲートです（デフォルト: `false`）。
- `dispatch.enabled`: ACP session ターン dispatch 用の独立ゲートです（デフォルト: `true`）。ACP command を利用可能なまま実行をブロックするには `false` を設定します。
- `backend`: デフォルトの ACP ランタイム backend id（登録済み ACP ランタイム Plugin と一致している必要があります）。
- `defaultAgent`: spawn が明示的ターゲットを指定しない場合のフォールバック ACP 対象 agent id。
- `allowedAgents`: ACP ランタイム session に許可される agent id の allowlist。空の場合は追加制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP session の最大数。
- `stream.coalesceIdleMs`: ストリーミングテキスト用のアイドル flush ウィンドウ（ms）。
- `stream.maxChunkChars`: ストリーミングされるブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの繰り返し status/tool 行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は段階的にストリーミングし、`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示 tool イベントの後に可視テキストの前へ挿入する区切り文字（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影される assistant 出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影される ACP status/update 行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベント用の、タグ名から真偽値可視性オーバーライドへの記録。
- `runtime.ttlMinutes`: ACP session worker がクリーンアップ対象になるまでのアイドル TTL（分）。
- `runtime.installCommand`: ACP ランタイム環境の bootstrap 時に実行するオプションの install command。

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

- `cli.banner.taglineMode` はバナーのタグラインスタイルを制御します:
  - `"random"`（デフォルト）: ローテーションする面白い/季節のタグライン。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体を隠すには（タグラインだけでなく）、env `OPENCLAW_HIDE_BANNER=1` を設定します。

---

## ウィザード

CLI のガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）によって書き込まれるメタデータ:

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

[Agent のデフォルト](#agent-defaults) の `agents.list` identity フィールドを参照してください。

---

## Bridge（legacy、削除済み）

現在のビルドには TCP bridge は含まれていません。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーはもはや config schema の一部ではありません（削除されるまで検証は失敗します。`openclaw doctor --fix` で未知のキーを除去できます）。

<Accordion title="legacy bridge 設定（履歴参照）">

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
    webhook: "https://example.invalid/legacy", // 非推奨。保存済みの notify:true job 用フォールバック
    webhookToken: "replace-with-dedicated-token", // オプション。送信 webhook auth 用 bearer token
    sessionRetention: "24h", // duration 文字列または false
    runLog: {
      maxBytes: "2mb", // デフォルト 2_000_000 bytes
      keepLines: 2000, // デフォルト 2000
    },
  },
}
```

- `sessionRetention`: 完了した分離 cron 実行 session を `sessions.json` から剪定するまで保持する期間。アーカイブされた削除済み cron transcript のクリーンアップも制御します。デフォルト: `24h`。無効にするには `false` を設定します。
- `runLog.maxBytes`: 剪定前の実行ログファイル（`cron/runs/<jobId>.jsonl`）ごとの最大サイズ。デフォルト: `2_000_000` bytes。
- `runLog.keepLines`: 実行ログ剪定が発動したときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: cron webhook POST 配信（`delivery.mode = "webhook"`）に使われる bearer token。省略時は auth ヘッダーを送信しません。
- `webhook`: 非推奨の legacy フォールバック webhook URL（http/https）。`notify: true` をまだ持つ保存済み job に対してのみ使用されます。

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

- `maxAttempts`: 一時的エラー時の one-shot job の最大 retry 回数（デフォルト: `3`、範囲: `0`–`10`）。
- `backoffMs`: 各 retry 試行に対する backoff 遅延（ms）の配列（デフォルト: `[30000, 60000, 300000]`、1–10 エントリ）。
- `retryOn`: retry を引き起こすエラータイプ — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略すると、すべての一時的タイプを retry します。

one-shot cron job にのみ適用されます。定期 job は別の失敗処理を使用します。

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

- `enabled`: cron job の失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラート発火前の連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じ job に対する繰り返しアラート間の最小ミリ秒数（非負整数）。
- `mode`: 配信モード — `"announce"` は channel メッセージで送信し、`"webhook"` は設定された webhook に POST します。
- `accountId`: アラート配信をスコープするためのオプションの account または channel id。

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

- すべての job に共通する cron 失敗通知のデフォルト送信先です。
- `mode`: `"announce"` または `"webhook"`。十分なターゲット情報が存在する場合のデフォルトは `"announce"` です。
- `channel`: announce 配信用の channel オーバーライド。`"last"` は最後に使われた配信 channel を再利用します。
- `to`: 明示的な announce ターゲットまたは webhook URL。webhook mode では必須です。
- `accountId`: 配信用のオプションの account オーバーライド。
- job ごとの `delivery.failureDestination` はこのグローバルデフォルトを上書きします。
- グローバルにも job ごとにも failure destination が設定されていない場合、すでに `announce` 経由で配信する job は、失敗時にその primary announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、job の primary `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` job でのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs) を参照してください。分離された cron 実行は [background tasks](/ja-JP/automation/tasks) として追跡されます。

---

## Media model テンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| Variable           | 説明                                         |
| ------------------ | -------------------------------------------- |
| `{{Body}}`         | 完全な受信メッセージ本文                     |
| `{{RawBody}}`      | 生の本文（履歴/送信者ラッパーなし）          |
| `{{BodyStripped}}` | グループメンションを除去した本文             |
| `{{From}}`         | 送信者識別子                                 |
| `{{To}}`           | 送信先識別子                                 |
| `{{MessageSid}}`   | channel メッセージ id                        |
| `{{SessionId}}`    | 現在の session UUID                          |
| `{{IsNewSession}}` | 新しい session が作成されたとき `"true"`     |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL                       |
| `{{MediaPath}}`    | ローカルメディアパス                         |
| `{{MediaType}}`    | メディアタイプ（image/audio/document/…）     |
| `{{Transcript}}`   | 音声 transcript                              |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディア prompt    |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数     |
| `{{ChatType}}`     | `"direct"` または `"group"`                  |
| `{{GroupSubject}}` | グループ subject（ベストエフォート）         |
| `{{GroupMembers}}` | グループメンバーのプレビュー（ベストエフォート） |
| `{{SenderName}}`   | 送信者表示名（ベストエフォート）             |
| `{{SenderE164}}`   | 送信者電話番号（ベストエフォート）           |
| `{{Provider}}`     | provider ヒント（whatsapp、telegram、discord など） |

---

## Config include（`$include`）

config を複数ファイルに分割できます:

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

- 単一ファイル: そのオブジェクト全体を置き換えます。
- ファイル配列: 順番に deep-merge されます（後のものが前を上書き）。
- 兄弟キー: include の後でマージされます（include された値を上書き）。
- ネストした include: 最大 10 レベルまで。
- パス: include 元のファイルからの相対で解決されますが、トップレベル config ディレクトリ（`openclaw.json` の `dirname`）内に留まらなければなりません。絶対パスや `../` 形式も、その境界内に解決される場合にのみ許可されます。
- エラー: ファイル欠如、parse エラー、循環 include に対して明確なメッセージを出します。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_
