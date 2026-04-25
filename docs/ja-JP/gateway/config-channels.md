---
read_when:
    - チャネル Plugin の設定（認証、アクセス制御、マルチアカウント）
    - チャネルごとの設定キーのトラブルシューティング
    - DM ポリシー、グループポリシー、またはメンションゲーティングを監査する場合
summary: 'チャネル設定: Slack、Discord、Telegram、WhatsApp、Matrix、iMessage などにわたるアクセス制御、ペアリング、チャネルごとのキー'
title: 設定 — チャネル
x-i18n:
    generated_at: "2026-04-25T13:46:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b7071f7cda3f7f71b464e64c2abb8e0b88326606234f0cf7778c80a7ef4b3e0
    source_path: gateway/config-channels.md
    workflow: 15
---

`channels.*` 配下のチャネルごとの設定キーです。DM とグループアクセス、
マルチアカウント構成、メンションゲーティング、そして Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage、その他の同梱チャネル Plugin 向けのチャネルごとのキーを扱います。

エージェント、Tools、Gateway ランタイム、その他のトップレベルキーについては、
[Configuration reference](/ja-JP/gateway/configuration-reference) を参照してください。

## チャネル

各チャネルは、その設定セクションが存在する場合、自動的に開始されます（`enabled: false` でない限り）。

### DM とグループアクセス

すべてのチャネルは DM ポリシーとグループポリシーをサポートします:

| DM policy | 動作 |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（デフォルト） | 不明な送信者には一度限りのペアリングコードが発行され、オーナーが承認する必要があります |
| `allowlist` | `allowFrom`（またはペアリングされた allow store）内の送信者のみ |
| `open` | すべての受信 DM を許可（`allowFrom: ["*"]` が必要） |
| `disabled` | すべての受信 DM を無視 |

| Group policy | 動作 |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（デフォルト） | 設定された Allowlist に一致するグループのみ |
| `open` | グループ Allowlist をバイパス（メンションゲーティングは引き続き適用） |
| `disabled` | すべてのグループ/ルームメッセージをブロック |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が未設定の場合のデフォルトを設定します。
ペアリングコードは1時間後に期限切れになります。保留中の DM ペアリング要求は **チャネルごとに3件** までです。
プロバイダーブロックが完全に欠けている場合（`channels.<provider>` が存在しない場合）、実行時のグループポリシーは起動警告付きで `allowlist`（fail-closed）にフォールバックします。
</Note>

### チャネルモデル上書き

特定のチャネル ID を特定モデルに固定するには `channels.modelByChannel` を使用します。値には `provider/model` または設定済みモデルエイリアスを使用できます。このチャネルマッピングは、セッションにすでにモデル上書きがない場合（たとえば `/model` で設定された場合）に適用されます。

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

### チャネルデフォルトと Heartbeat

プロバイダー間で共有するグループポリシーと Heartbeat 動作には `channels.defaults` を使用します:

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

- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が未設定の場合のフォールバックグループポリシー。
- `channels.defaults.contextVisibility`: すべてのチャネルに対するデフォルトの補足コンテキスト可視性モード。値: `all`（デフォルト、引用/スレッド/履歴の全コンテキストを含む）、`allowlist`（Allowlist 済み送信者からのコンテキストのみ含む）、`allowlist_quote`（allowlist と同じだが、明示的な引用/返信コンテキストは保持する）。チャネルごとの上書き: `channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`: 正常なチャネルステータスを Heartbeat 出力に含めます。
- `channels.defaults.heartbeat.showAlerts`: 劣化/エラーステータスを Heartbeat 出力に含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケータースタイルの Heartbeat 出力を描画します。

### WhatsApp

WhatsApp は Gateway の web チャネル（Baileys Web）を通じて動作します。リンク済みセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 青いチェック（self-chat mode では false）
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

<Accordion title="マルチアカウント WhatsApp">

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

- 送信コマンドは、`default` アカウントが存在する場合はそれを、そうでなければ最初に設定されたアカウント ID（ソート順）をデフォルトにします。
- オプションの `channels.whatsapp.defaultAccount` は、設定済みアカウント ID と一致する場合に、そのフォールバックデフォルトアカウント選択を上書きします。
- レガシー単一アカウントの Baileys auth dir は `openclaw doctor` によって `whatsapp/default` に移行されます。
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
              systemPrompt: "話題から逸れないでください。",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git バックアップ" },
        { command: "generate", description: "画像を作成" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (デフォルト: off。preview-edit のレート制限を避けるため、明示的にオプトイン)
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

- Bot トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`（通常ファイルのみ。symlink は拒否）、デフォルトアカウントでは `TELEGRAM_BOT_TOKEN` がフォールバックになります。
- オプションの `channels.telegram.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- マルチアカウント構成（2個以上のアカウント ID）では、フォールバックルーティングを避けるため、明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。これが欠けているか無効な場合、`openclaw doctor` が警告します。
- `configWrites: false` は Telegram 起点の設定書き込み（supergroup ID 移行、`/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベル `bindings[]` エントリは、フォーラムトピック向けの永続 ACP バインディングを設定します（`match.peer.id` には標準的な `chatId:topic:topicId` を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) で共通です。
- Telegram のストリームプレビューは `sendMessage` + `editMessageText` を使用します（DM とグループチャットの両方で動作）。
- リトライポリシー: [Retry policy](/ja-JP/concepts/retry) を参照。

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
      streaming: "off", // off | partial | block | progress (progress は Discord では partial にマップされます)
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
        spawnSubagentSessions: false, // sessions_spawn({ thread: true }) のオプトイン
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

- トークン: `channels.discord.token`。デフォルトアカウントでは `DISCORD_BOT_TOKEN` がフォールバックになります。
- 明示的な Discord `token` を指定する直接送信呼び出しは、その呼び出しにそのトークンを使用します。アカウントのリトライ/ポリシー設定は、引き続きアクティブなランタイムスナップショット内の選択されたアカウントから取得されます。
- オプションの `channels.discord.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>`（guild channel）を使用してください。数字だけの bare ID は拒否されます。
- Guild slug は小文字で、スペースは `-` に置き換えられます。チャネルキーは slug 化された名前（`#` なし）を使います。Guild ID を推奨します。
- Bot が作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効化されます。Bot をメンションした Bot メッセージのみを受け付けるには `allowBots: "mentions"` を使用してください（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャネル上書き）は、別のユーザーやロールにはメンションしているが Bot にはメンションしていないメッセージをドロップします（@everyone/@here は除く）。
- `maxLinesPerMessage`（デフォルト 17）は、2000文字未満でも縦に長いメッセージを分割します。
- `channels.discord.threadBindings` は Discord のスレッドバインド型ルーティングを制御します:
  - `enabled`: スレッドバインド型セッション機能（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびバインドされた配信/ルーティング）の Discord 上書き
  - `idleHours`: 非アクティブ時の自動 unfocus までの時間の Discord 上書き（時間単位。`0` で無効）
  - `maxAgeHours`: ハード最大寿命の Discord 上書き（時間単位。`0` で無効）
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` の自動スレッド作成/バインド向けオプトインスイッチ
- `type: "acp"` を持つトップレベル `bindings[]` エントリは、チャネルおよびスレッド向けの永続 ACP バインディングを設定します（`match.peer.id` には channel/thread id を使用）。フィールドの意味は [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings) で共通です。
- `channels.discord.ui.components.accentColor` は Discord components v2 コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は Discord 音声チャネル会話と、オプションの自動参加 + LLM + TTS 上書きを有効にします。
- `channels.discord.voice.model` は、Discord 音声チャネル応答に使う LLM モデルをオプションで上書きします。
- `channels.discord.voice.daveEncryption` と `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションにそのまま渡されます（デフォルトは `true` と `24`）。
- OpenClaw はさらに、繰り返し復号失敗した後に音声セッションを離脱/再参加することで音声受信の回復も試みます。
- `channels.discord.streaming` は正式なストリームモードキーです。レガシーの `streamMode` とブール値 `streaming` は自動移行されます。
- `channels.discord.autoPresence` は、ランタイムの可用性を Bot presence にマッピングします（healthy => online、degraded => idle、exhausted => dnd）。オプションでステータステキストの上書きも可能です。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/tag マッチングを再有効化します（緊急用の互換モード）。
- `channels.discord.execApprovals`: Discord ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Discord ユーザー ID。省略時は `commands.ownerAllowFrom` にフォールバックします。
  - `agentFilter`: オプションの agent ID Allowlist。省略するとすべてのエージェントの承認を転送します。
  - `sessionFilter`: オプションのセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）は承認者 DM に送信、`"channel"` は元チャネルに送信、`"both"` は両方に送信します。target に `"channel"` が含まれる場合、ボタンを使えるのは解決済みの承認者のみです。
  - `cleanupAfterResolve`: `true` の場合、承認、拒否、またはタイムアウト後に承認 DM を削除します。

**リアクション通知モード:** `off`（なし）、`own`（Bot 自身のメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（`guilds.<id>.users` 由来の、すべてのメッセージ）。

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

- サービスアカウント JSON: インライン（`serviceAccount`）またはファイルベース（`serviceAccountFile`）。
- サービスアカウント SecretRef（`serviceAccountRef`）もサポートされます。
- 環境変数フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用してください。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能なメール principal マッチングを再有効化します（緊急用の互換モード）。

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
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // mode=partial のとき Slack ネイティブストリーミング API を使用
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
- Slack アカウントスナップショットは、`botTokenSource`、`botTokenStatus`、`appTokenStatus`、HTTP mode では `signingSecretStatus` など、認証情報ごとの source/status フィールドを公開します。`configured_unavailable` は、そのアカウントが SecretRef 経由で設定されているが、現在のコマンド/ランタイムパスでは secret 値を解決できなかったことを意味します。
- `configWrites: false` は Slack 起点の設定書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `channels.slack.streaming.mode` は正式な Slack ストリームモードキーです。`channels.slack.streaming.nativeTransport` は Slack のネイティブストリーミング転送を制御します。レガシーの `streamMode`、ブール値 `streaming`、`nativeStreaming` は自動移行されます。
- 配信ターゲットには `user:<id>`（DM）または `channel:<id>` を使用してください。

**リアクション通知モード:** `off`、`own`（デフォルト）、`all`、`allowlist`（`reactionAllowlist` 由来）。

**スレッドセッション分離:** `thread.historyScope` はスレッドごと（デフォルト）またはチャネル全体で共有です。`thread.inheritParent` は親チャネルの transcript を新しいスレッドにコピーします。

- Slack ネイティブストリーミングと、Slack アシスタント風の「入力中...」スレッドステータスには返信スレッドターゲットが必要です。トップレベル DM はデフォルトではスレッド外のままなので、スレッド風プレビューの代わりに `typingReaction` または通常配信を使用します。
- `typingReaction` は、返信処理中に受信した Slack メッセージへ一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` のような Slack 絵文字 shortcode を使用してください。
- `channels.slack.execApprovals`: Slack ネイティブの exec 承認配信と承認者認可。スキーマは Discord と同じです: `enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack ユーザー ID）、`agentFilter`、`sessionFilter`、`target`（`"dm"`、`"channel"`、または `"both"`）。

| Action group | デフォルト | 注記 |
| ------------ | ------- | ---------------------- |
| reactions | 有効 | リアクト + リアクション一覧 |
| messages | 有効 | 読み取り/送信/編集/削除 |
| pins | 有効 | ピン留め/解除/一覧 |
| memberInfo | 有効 | メンバー情報 |
| emojiList | 有効 | カスタム絵文字一覧 |

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
        native: true, // オプトイン
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // オプションの明示的 URL（リバースプロキシ/パブリックデプロイメント向け）
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャットモード: `oncall`（@-mention 時に応答、デフォルト）、`onmessage`（すべてのメッセージ）、`onchar`（トリガープレフィックスで始まるメッセージ）。

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` は完全 URL ではなくパスである必要があります（例 `/api/channels/mattermost/command`）。
- `commands.callbackUrl` は OpenClaw Gateway エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- ネイティブスラッシュコールバックは、スラッシュコマンド登録時に Mattermost が返すコマンドごとのトークンで認証されます。登録に失敗したか、アクティブ化されたコマンドがない場合、OpenClaw は
  `Unauthorized: invalid command token.` でコールバックを拒否します。
- プライベート/tailnet/internal の callback host では、Mattermost に
  `ServiceSettings.AllowedUntrustedInternalConnections` に callback host/domain を含める必要がある場合があります。
  完全 URL ではなく、host/domain 値を使用してください。
- `channels.mattermost.configWrites`: Mattermost 起点の設定書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` を必須にします。
- `channels.mattermost.groups.<channelId>.requireMention`: チャネルごとのメンションゲーティング上書き（デフォルトには `"*"`）。
- オプションの `channels.mattermost.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

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

- `channels.signal.account`: チャネル起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal 起点の設定書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

### BlueBubbles

BlueBubbles は推奨される iMessage 経路です（Plugin ベース、`channels.bluebubbles` の下で設定）。

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

- ここで扱うコアキーパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- `type: "acp"` を持つトップレベル `bindings[]` エントリは、BlueBubbles 会話を永続 ACP セッションにバインドできます。`match.peer.id` には BlueBubbles handle またはターゲット文字列（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共通フィールド意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。
- 完全な BlueBubbles チャネル設定は [BlueBubbles](/ja-JP/channels/bluebubbles) に記載されています。

### iMessage

OpenClaw は `imsg rpc` を起動します（stdio 上の JSON-RPC）。デーモンやポートは不要です。

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

- オプションの `channels.imessage.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。

- Messages DB へのフルディスクアクセスが必要です。
- `chat_id:<id>` ターゲットを推奨します。チャット一覧には `imsg chats --limit 20` を使用してください。
- `cliPath` は SSH ラッパーを指せます。SCP 添付ファイル取得には `remoteHost`（`host` または `user@host`）を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は受信添付ファイルパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳格な host-key チェックを使用するため、リレーホストキーが `~/.ssh/known_hosts` にすでに存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage 起点の設定書き込みを許可または拒否します。
- `type: "acp"` を持つトップレベル `bindings[]` エントリは、iMessage 会話を永続 ACP セッションにバインドできます。`match.peer.id` には正規化された handle または明示的なチャットターゲット（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）を使用します。共通フィールド意味: [ACP Agents](/ja-JP/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH ラッパー例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix は Plugin ベースで、`channels.matrix` の下で設定します。

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

- トークン認証では `accessToken` を使用し、パスワード認証では `userId` + `password` を使用します。
- `channels.matrix.proxy` は Matrix HTTP トラフィックを明示的な HTTP(S) プロキシ経由にします。名前付きアカウントは `channels.matrix.accounts.<id>.proxy` でこれを上書きできます。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` は private/internal homeserver を許可します。`proxy` とこのネットワークオプトインは独立した制御です。
- `channels.matrix.defaultAccount` はマルチアカウント構成で優先アカウントを選択します。
- `channels.matrix.autoJoin` のデフォルトは `off` なので、招待されたルームや新しい DM 形式の招待は、`autoJoin: "allowlist"` と `autoJoinAllowlist`、または `autoJoin: "always"` を設定するまで無視されます。
- `channels.matrix.execApprovals`: Matrix ネイティブの exec 承認配信と承認者認可。
  - `enabled`: `true`、`false`、または `"auto"`（デフォルト）。auto モードでは、`approvers` または `commands.ownerAllowFrom` から承認者を解決できる場合に exec 承認が有効になります。
  - `approvers`: exec リクエストを承認できる Matrix ユーザー ID（例 `@owner:example.org`）。
  - `agentFilter`: オプションの agent ID Allowlist。省略するとすべてのエージェントの承認を転送します。
  - `sessionFilter`: オプションのセッションキーパターン（部分文字列または正規表現）。
  - `target`: 承認プロンプトの送信先。`"dm"`（デフォルト）、`"channel"`（送信元ルーム）、または `"both"`。
  - アカウントごとの上書き: `channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` は Matrix DM をセッションにどうグループ化するかを制御します: `per-user`（デフォルト）はルーティング先ピアごとに共有し、`per-room` は各 DM ルームを分離します。
- Matrix ステータスプローブとライブ directory ルックアップは、ランタイムトラフィックと同じプロキシポリシーを使用します。
- 完全な Matrix 設定、ターゲティングルール、セットアップ例は [Matrix](/ja-JP/channels/matrix) に記載されています。

### Microsoft Teams

Microsoft Teams は Plugin ベースで、`channels.msteams` の下で設定します。

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

- ここで扱うコアキーパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 設定（認証情報、Webhook、DM/グループポリシー、team/channel ごとの上書き）は [Microsoft Teams](/ja-JP/channels/msteams) に記載されています。

### IRC

IRC は Plugin ベースで、`channels.irc` の下で設定します。

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
- オプションの `channels.irc.defaultAccount` は、設定済みアカウント ID と一致する場合にデフォルトアカウント選択を上書きします。
- 完全な IRC チャネル設定（host/port/TLS/channels/allowlists/mention gating）は [IRC](/ja-JP/channels/irc) に記載されています。

### マルチアカウント（全チャネル）

チャネルごとに複数アカウントを実行できます（それぞれ独自の `accountId` を持ちます）:

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

- `accountId` が省略された場合は `default` が使用されます（CLI + ルーティング）。
- 環境変数トークンは **default** アカウントにのみ適用されます。
- ベースチャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- 各アカウントを異なるエージェントにルーティングするには `bindings[].match.accountId` を使用してください。
- 単一アカウントのトップレベルチャネル設定のまま、`openclaw channels add`（またはチャネルオンボーディング）経由で非デフォルトアカウントを追加すると、OpenClaw はまずアカウントスコープのトップレベル単一アカウント値をチャネルアカウントマップに昇格し、元のアカウントが引き続き動作するようにします。多くのチャネルではこれらを `channels.<channel>.accounts.default` に移します。Matrix では代わりに既存の一致する名前付き/default ターゲットを保持できます。
- 既存のチャネルのみのバインディング（`accountId` なし）は引き続き default アカウントにマッチします。アカウントスコープのバインディングは引き続きオプションです。
- `openclaw doctor --fix` も混在した形状を修復し、アカウントスコープのトップレベル単一アカウント値を、そのチャネル用に選ばれた昇格先アカウントへ移動します。多くのチャネルでは `accounts.default` を使用し、Matrix では代わりに既存の一致する名前付き/default ターゲットを保持できます。

### その他の Plugin チャネル

多くの Plugin チャネルは `channels.<id>` として設定され、専用チャネルページに記載されています（たとえば Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch）。
完全なチャネルインデックスは [Channels](/ja-JP/channels) を参照してください。

### グループチャットのメンションゲーティング

グループメッセージはデフォルトで **メンション必須** です（メタデータメンションまたは安全な正規表現パターン）。WhatsApp、Telegram、Discord、Google Chat、iMessage のグループチャットに適用されます。

**メンションタイプ:**

- **メタデータメンション**: ネイティブプラットフォームの @-mention。WhatsApp self-chat mode では無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` 内の安全な正規表現パターン。無効なパターンや安全でないネストされた繰り返しは無視されます。
- メンションゲーティングは、検出が可能な場合にのみ強制されます（ネイティブメンションまたは少なくとも1つのパターン）。

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

`messages.groupChat.historyLimit` はグローバルデフォルトを設定します。チャネルは `channels.<channel>.historyLimit`（またはアカウントごと）で上書きできます。無効にするには `0` を設定してください。

#### DM 履歴上限

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

解決順序: DM ごとの上書き → プロバイダーデフォルト → 上限なし（すべて保持）。

対応: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### self-chat mode

自分の番号を `allowFrom` に含めると self-chat mode が有効になります（ネイティブ @-mention を無視し、テキストパターンにのみ応答します）:

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
    nativeSkills: "auto", // 対応時にネイティブ Skill コマンドを登録
    text: true, // チャットメッセージ内の /commands を解析
    bash: false, // ! を許可（エイリアス: /bash）
    bashForegroundMs: 2000,
    config: false, // /config を許可
    mcp: false, // /mcp を許可
    plugins: false, // /plugins を許可
    debug: false, // /debug を許可
    restart: true, // /restart + gateway restart Tool を許可
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

- このブロックはコマンド画面を設定します。現在の built-in + bundled コマンドカタログについては [Slash Commands](/ja-JP/tools/slash-commands) を参照してください。
- このページは**設定キーのリファレンス**であり、完全なコマンドカタログではありません。QQ Bot の `/bot-ping` `/bot-help` `/bot-logs`、LINE の `/card`、device-pair の `/pair`、memory の `/dreaming`、phone-control の `/phone`、Talk の `/voice` のようなチャネル/Plugin 所有のコマンドは、それぞれのチャネル/Plugin ページと [Slash Commands](/ja-JP/tools/slash-commands) に記載されています。
- テキストコマンドは、先頭に `/` が付いた**単独の**メッセージである必要があります。
- `native: "auto"` は Discord/Telegram のネイティブコマンドを有効にし、Slack ではオフのままにします。
- `nativeSkills: "auto"` は Discord/Telegram のネイティブ Skill コマンドを有効にし、Slack ではオフのままにします。
- チャネルごとの上書き: `channels.discord.commands.native`（bool または `"auto"`）。`false` は以前に登録されたコマンドをクリアします。
- ネイティブ Skill 登録は `channels.<provider>.commands.nativeSkills` でチャネルごとに上書きできます。
- `channels.telegram.customCommands` は Telegram Bot メニューに追加エントリを加えます。
- `bash: true` はホストシェル向けの `! <cmd>` を有効にします。`tools.elevated.enabled` と、送信者が `tools.elevated.allowFrom.<channel>` に含まれていることが必要です。
- `config: true` は `/config` を有効にします（`openclaw.json` を読み書き）。Gateway `chat.send` クライアントでは、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用の `/config show` は通常の write スコープ付きオペレータークライアントでも引き続き利用可能です。
- `mcp: true` は `mcp.servers` 配下の OpenClaw 管理 MCP サーバー設定向けに `/mcp` を有効にします。
- `plugins: true` は Plugin の検出、インストール、有効化/無効化制御向けに `/plugins` を有効にします。
- `channels.<provider>.configWrites` はチャネルごとの設定変更をゲートします（デフォルト: true）。
- マルチアカウントチャネルでは、`channels.<provider>.accounts.<id>.configWrites` も、そのアカウントを対象とする書き込み（たとえば `/allowlist --config --account <id>` や `/config set channels.<provider>.accounts.<id>...`）をゲートします。
- `restart: false` は `/restart` と Gateway restart Tool アクションを無効にします。デフォルト: `true`。
- `ownerAllowFrom` は、owner 専用コマンド/Tools 向けの明示的な owner Allowlist です。`allowFrom` とは別です。
- `ownerDisplay: "hash"` はシステムプロンプト内の owner ID をハッシュ化します。ハッシュを制御するには `ownerDisplaySecret` を設定してください。
- `allowFrom` はプロバイダーごとです。これを設定すると、それが**唯一の**認可ソースになります（チャネル Allowlist/ペアリングと `useAccessGroups` は無視されます）。
- `useAccessGroups: false` は、`allowFrom` が設定されていないときに、コマンドが access-group ポリシーをバイパスできるようにします。
- コマンドドキュメントの対応:
  - built-in + bundled カタログ: [Slash Commands](/ja-JP/tools/slash-commands)
  - チャネル固有のコマンド画面: [Channels](/ja-JP/channels)
  - QQ Bot コマンド: [QQ Bot](/ja-JP/channels/qqbot)
  - ペアリングコマンド: [Pairing](/ja-JP/channels/pairing)
  - LINE card コマンド: [LINE](/ja-JP/channels/line)
  - memory Dreaming: [Dreaming](/ja-JP/concepts/dreaming)

</Accordion>

---

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference) — トップレベルキー
- [Configuration — agents](/ja-JP/gateway/config-agents)
- [Channels overview](/ja-JP/channels)
