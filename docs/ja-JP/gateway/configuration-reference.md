---
read_when:
    - フィールド単位で正確な config の意味やデフォルト値が必要な場合
    - channel、model、Gateway、または tool の config ブロックを検証している場合
summary: OpenClaw コアキー、デフォルト値、および専用サブシステムリファレンスへのリンクのための Gateway config リファレンス
title: Configuration リファレンス
x-i18n:
    generated_at: "2026-04-26T11:29:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` 用のコア config リファレンスです。タスク指向の概要については [Configuration](/ja-JP/gateway/configuration) を参照してください。

このページでは、主要な OpenClaw config サーフェスを扱い、サブシステムごとにより深い専用リファレンスがある場合はそこへリンクします。チャネルおよび Plugin 所有のコマンドカタログや、詳細な memory/QMD ノブは、このページではなく各専用ページにあります。

コード上の正:

- `openclaw config schema` は、検証と Control UI に使われるライブ JSON Schema を出力し、利用可能な場合はバンドル済み/Plugin/チャネルのメタデータもマージされます
- `config.schema.lookup` は、ドリルダウン用ツール向けに、1 つのパスにスコープされた schema ノードを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、config-doc の baseline hash を現在の schema サーフェスに対して検証します

エージェントの参照パス: 編集前に、正確なフィールド単位のドキュメントと制約を確認するには、`gateway` ツール action `config.schema.lookup` を使用してください。タスク指向のガイダンスには [Configuration](/ja-JP/gateway/configuration) を使用し、このページでは広範なフィールドマップ、デフォルト値、サブシステムリファレンスへのリンクを参照してください。

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および `plugins.entries.memory-core.config.dreaming` 配下の dreaming config については [Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドル済みコマンドカタログについては [Slash commands](/ja-JP/tools/slash-commands)
- チャネル固有のコマンドサーフェスについては各チャネル/Plugin のページ

Config 形式は **JSON5** です（コメントと末尾カンマを許可）。すべてのフィールドは任意で、省略された場合は OpenClaw が安全なデフォルト値を使用します。

---

## Channels

チャネルごとの config キーは専用ページへ移動しました。`channels.*` については [Configuration — channels](/ja-JP/gateway/config-channels) を参照してください。Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、およびその他のバンドル済みチャネル（auth、アクセス制御、マルチアカウント、mention ゲーティングを含む）を扱います。

## Agent defaults、multi-agent、sessions、messages

専用ページへ移動しました。次については [Configuration — agents](/ja-JP/gateway/config-agents) を参照してください。

- `agents.defaults.*`（workspace、model、thinking、heartbeat、memory、media、Skills、sandbox）
- `multiAgent.*`（multi-agent ルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、pruning）
- `messages.*`（メッセージ配信、TTS、Markdown レンダリング）
- `talk.*`（Talk mode）
  - `talk.speechLocale`: iOS/macOS の Talk 音声認識用の任意の BCP 47 locale id
  - `talk.silenceTimeoutMs`: 未設定時、Talk は文字起こし送信前のプラットフォーム既定のポーズ時間を維持します（`macOS と Android では 700 ms、iOS では 900 ms`）

## Tools とカスタム provider

tool ポリシー、experimental トグル、provider ベースの tool config、およびカスタム provider / base-URL のセットアップは専用ページへ移動しました。 [Configuration — tools and custom providers](/ja-JP/gateway/config-tools) を参照してください。

## MCP

OpenClaw 管理の MCP サーバー定義は `mcp.servers` 配下にあり、組み込み Pi やその他のランタイムアダプターで使用されます。`openclaw mcp list`、`show`、`set`、`unset` コマンドは、config 編集中に対象サーバーへ接続せずにこのブロックを管理します。

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: 設定済み MCP tools を公開するランタイム向けの、名前付き stdio またはリモート MCP サーバー定義。
- `mcp.sessionIdleTtlMs`: セッションスコープのバンドル済み MCP ランタイムのアイドル TTL。ワンショットの組み込み実行では run-end cleanup が要求されます。この TTL は、長寿命セッションと将来の呼び出し元のためのバックストップです。
- `mcp.*` 配下の変更は、キャッシュされたセッション MCP ランタイムを破棄することでホット適用されます。次回の tool 検出/使用時に新しい config から再生成されるため、削除された `mcp.servers` エントリはアイドル TTL を待たずに即座に回収されます。

ランタイム挙動については [MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry) および [CLI backends](/ja-JP/gateway/cli-backends#bundle-mcp-overlays) を参照してください。

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドル済み Skills のみを対象にする任意の allowlist（managed/workspace Skills には影響しません）。
- `load.extraDirs`: 追加の共有 skill ルート（最も低い優先度）。
- `install.preferBrew`: `true` の場合、`brew` が利用可能であれば、他のインストーラー種別にフォールバックする前に Homebrew インストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install` spec 用の node インストーラー優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、その skill がバンドル済み/インストール済みでも無効化します。
- `entries.<skillKey>.apiKey`: 主要な env var を宣言する skill 向けの簡易設定（平文文字列または SecretRef オブジェクト）。

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
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
- 検出では、ネイティブ OpenClaw plugins に加えて、互換性のある Codex バンドルと Claude バンドルも受け入れます。manifest のない Claude デフォルトレイアウトバンドルも含まれます。
- **Config の変更には gateway の再起動が必要です。**
- `allow`: 任意の allowlist（列挙された plugins のみを読み込み）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: Plugin が対応している場合の Plugin レベル API key 簡易フィールド。
- `plugins.entries.<id>.env`: Plugin スコープの env var マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、core は `before_prompt_build` をブロックし、legacy `before_agent_start` からの prompt 変更フィールドを無視します。一方で legacy の `modelOverride` と `providerOverride` は保持します。ネイティブ Plugin hook と、対応するバンドル提供 hook ディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true` の場合、信頼済みの非バンドル Plugin は `llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` などの型付き hook から生の会話内容を読み取れます。
- `plugins.entries.<id>.subagent.allowModelOverride`: この Plugin がバックグラウンドのサブエージェント実行に対して per-run の `provider` と `model` override を要求できるよう、明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済みサブエージェント override 用の、canonical な `provider/model` 対象の任意 allowlist。任意の model を許可したい場合にのみ `"*"` を使用してください。
- `plugins.entries.<id>.config`: Plugin 定義の config オブジェクト（利用可能な場合はネイティブ OpenClaw Plugin schema によって検証されます）。
- チャネル Plugin の account/runtime 設定は `channels.<id>` 配下に置かれ、中央の OpenClaw オプションレジストリではなく、所有 Plugin の manifest `channelConfigs` メタデータによって記述されるべきです。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider 設定。
  - `apiKey`: Firecrawl API key（SecretRef を受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、legacy の `tools.web.fetch.firecrawl.apiKey`、または `FIRECRAWL_API_KEY` env var にフォールバックします。
  - `baseUrl`: Firecrawl API base URL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ有効期間（ミリ秒）（デフォルト: `172800000` / 2 日）。
  - `timeoutSeconds`: スクレイプ要求タイムアウト（秒）（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Search provider を有効化します。
  - `model`: 検索に使う Grok model（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory Dreaming 設定。フェーズと閾値については [Dreaming](/ja-JP/concepts/dreaming) を参照してください。
  - `enabled`: Dreaming のマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各完全 Dreaming スイープの Cron cadence（デフォルトは `"0 3 * * *"`）。
  - フェーズポリシーと閾値は実装詳細であり、ユーザー向け config キーではありません。
- 完全な memory config は [Memory configuration reference](/ja-JP/reference/memory-config) にあります。
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効な Claude bundle plugins は `settings.json` から埋め込み Pi デフォルト値を提供することもできます。OpenClaw はそれらを、生の OpenClaw config パッチではなく、サニタイズ済みエージェント設定として適用します。
- `plugins.slots.memory`: アクティブな memory Plugin id を選択します。memory plugins を無効化するには `"none"` を指定します。
- `plugins.slots.contextEngine`: アクティブな context engine Plugin id を選択します。別の engine をインストールして選択しない限り、デフォルトは `"legacy"` です。

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
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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
- `tabCleanup` は、アイドル時間経過後、またはセッションが上限を超えたときに、追跡中の primary-agent タブを回収します。個別のクリーンアップモードを無効化するには、`idleMinutes: 0` または `maxTabsPerSession: 0` を設定してください。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は未設定時には無効であるため、browser ナビゲーションはデフォルトで strict のままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` は、private-network browser ナビゲーションを意図的に信頼する場合にのみ設定してください。
- strict mode では、リモート CDP profile endpoint（`profiles.*.cdpUrl`）にも、到達性/検出チェック中に同じ private-network ブロックが適用されます。
- `ssrfPolicy.allowPrivateNetwork` は legacy エイリアスとして引き続きサポートされます。
- strict mode では、明示的な例外として `ssrfPolicy.hostnameAllowlist` と `ssrfPolicy.allowedHostnames` を使用してください。
- リモート profile は attach-only です（start/stop/reset は無効）。
- `profiles.*.cdpUrl` は `http://`、`https://`、`ws://`、`wss://` を受け付けます。OpenClaw に `/json/version` を検出させたい場合は HTTP(S) を使用し、provider が直接の DevTools WebSocket URL を提供する場合は WS(S) を使用してください。
- `remoteCdpTimeoutMs` と `remoteCdpHandshakeTimeoutMs` は、リモートおよび `attachOnly` CDP の到達性確認とタブオープン要求に適用されます。管理された loopback profile はローカル CDP のデフォルト値を維持します。
- 外部管理の CDP service が loopback 経由で到達可能な場合は、その profile に `attachOnly: true` を設定してください。そうしないと OpenClaw はその loopback port をローカル管理 browser profile とみなし、ローカル port 所有エラーを報告することがあります。
- `existing-session` profile は CDP の代わりに Chrome MCP を使用し、選択した host 上または接続された browser Node 経由で attach できます。
- `existing-session` profile では、Brave や Edge のような特定の Chromium ベース browser profile を対象にするために `userDataDir` を設定できます。
- `existing-session` profile は、現在の Chrome MCP ルート制限を維持します: CSS セレクター指定の代わりに snapshot/ref 駆動の action、単一ファイルのアップロード hook、dialog タイムアウト override なし、`wait --load networkidle` なし、さらに `responsebody`、PDF export、download interception、batch action もありません。
- ローカル管理の `openclaw` profile は `cdpPort` と `cdpUrl` を自動割り当てします。`cdpUrl` を明示的に設定するのはリモート CDP の場合だけにしてください。
- ローカル管理 profile では、その profile 用にグローバルな `browser.executablePath` を上書きするために `executablePath` を設定できます。これを使うと、ある profile は Chrome、別の profile は Brave で実行できます。
- ローカル管理 profile は、プロセス開始後の Chrome CDP HTTP 検出に `browser.localLaunchTimeoutMs` を使用し、起動後の CDP websocket 準備完了には `browser.localCdpReadyTimeoutMs` を使用します。Chrome 自体は正常起動するが、準備完了チェックが起動と競合するような低速ホストでは、これらを引き上げてください。どちらの値も `120000` ms 以下の正の整数である必要があり、無効な config 値は拒否されます。
- 自動検出順序: デフォルト browser が Chromium ベースならそれを優先 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` と `browser.profiles.<name>.executablePath` は、どちらも Chromium 起動前に OS ホームディレクトリ用の `~` と `~/...` を受け付けます。`existing-session` profile の profile ごとの `userDataDir` もチルダ展開されます。
- Control service: loopback のみ（port は `gateway.port` から導出され、デフォルトは `18791`）。
- `extraArgs` は、ローカル Chromium 起動時に追加の起動フラグを付加します（例: `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグ）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: ネイティブ app UI クロームのアクセントカラー（Talk Mode のバブル色など）。
- `assistant`: Control UI の ID 上書き。アクティブな agent ID にフォールバックします。

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
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
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
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
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

<Accordion title="Gateway フィールド詳細">

- `mode`: `local`（gateway を実行）または `remote`（リモート gateway に接続）。`local` でない限り、Gateway は起動を拒否します。
- `port`: WS + HTTP 用の単一多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IP のみ）、または `custom`。
- **旧式の bind エイリアス**: `gateway.bind` には、host エイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind mode 値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Docker に関する注意**: デフォルトの `loopback` bind は、コンテナ内の `127.0.0.1` で listen します。Docker bridge ネットワーク（`-p 18789:18789`）では、トラフィックは `eth0` に到達するため、gateway には到達できません。`--network host` を使用するか、すべてのインターフェースで listen するために `bind: "lan"`（または `bind: "custom"` と `customBindHost: "0.0.0.0"`）を設定してください。
- **Auth**: デフォルトで必須です。非 loopback bind では gateway auth が必要です。実際には、共有 token/password、または `gateway.auth.mode: "trusted-proxy"` を使う ID 対応 reverse proxy が必要です。オンボーディングウィザードはデフォルトで token を生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合（SecretRef を含む）は、`gateway.auth.mode` を `token` または `password` に明示的に設定してください。両方が設定されていて mode が未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモード。信頼できるローカル loopback セットアップでのみ使用してください。これは意図的にオンボーディングプロンプトでは提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応 reverse proxy に認証を委譲し、`gateway.trustedProxies` からの ID ヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）。このモードは **非 loopback** の proxy 発信元を前提としています。同一ホストの loopback reverse proxy では trusted-proxy auth の条件を満たしません。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の ID ヘッダーが Control UI/WebSocket auth を満たせます（`tailscale whois` で検証）。HTTP API endpoint はこの Tailscale ヘッダー auth を使用しません。代わりに gateway の通常の HTTP auth mode に従います。この token なしフローは、gateway host が信頼されていることを前提としています。`tailscale.mode = "serve"` の場合のデフォルトは `true` です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアント IP ごと、および auth スコープごとに適用されます（共有シークレットと device-token は独立して追跡されます）。ブロックされた試行は `429` + `Retry-After` を返します。
  - 非同期 Tailscale Serve Control UI パスでは、同じ `{scope, clientIp}` に対する失敗試行は、失敗書き込み前に直列化されます。そのため、同じクライアントからの並行した不正試行は、両方が単なる不一致として通過する競合になるのではなく、2 回目のリクエストでリミッターに達することがあります。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。localhost トラフィックにも意図的にレート制限を適用したい場合（テストセットアップや厳格な proxy デプロイ）には `false` を設定してください。
- browser 起点の WS auth 試行は、常に loopback 例外を無効にした状態でスロットルされます（browser ベースの localhost 総当たり攻撃に対する多層防御）。
- loopback 上では、それらの browser 起点ロックアウトは正規化された `Origin` 値ごとに分離されるため、ある localhost origin からの繰り返し失敗が、別の origin を自動的にロックアウトすることはありません。
- `tailscale.mode`: `serve`（tailnet のみ、loopback bind）または `funnel`（公開、auth 必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket 接続用の明示的な browser origin allowlist。非 loopback origin からの browser クライアントを想定する場合に必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダーの origin ポリシーに意図的に依存するデプロイ向けに、Host ヘッダーベースの origin フォールバックを有効にする危険なモードです。
- `remote.transport`: `ssh`（デフォルト）または `direct`（ws/wss）。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼できる private-network IP への平文 `ws://` を許可する、クライアント側プロセス環境の break-glass オーバーライドです。平文のデフォルトは引き続き loopback のみです。`openclaw.json` に相当する設定はなく、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` のような browser の private-network config も Gateway WebSocket クライアントには影響しません。
- `gateway.remote.token` / `.password` はリモートクライアント認証情報フィールドです。これら自体では gateway auth は設定されません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOS ビルドが relay ベースの registration を gateway に公開した後に使用される、外部 APNs relay 用のベース HTTPS URL。この URL は iOS ビルドにコンパイルされた relay URL と一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: gateway から relay への送信タイムアウト（ミリ秒）。デフォルトは `10000` です。
- relay ベースの registration は特定の gateway ID に委譲されます。ペアリング済み iOS app は `gateway.identity.get` を取得し、その ID を relay registration に含め、registration スコープの send grant を gateway に転送します。別の gateway はその保存済み registration を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記 relay config の一時的な env オーバーライドです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL 用の開発専用 escape hatch です。本番の relay URL は HTTPS のままにしてください。
- `gateway.channelHealthCheckMinutes`: channel ヘルスモニター間隔（分）。ヘルスモニター再起動をグローバルに無効化するには `0` を設定してください。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket しきい値（分）。これは `gateway.channelHealthCheckMinutes` 以上に保ってください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング 1 時間あたりの、チャネル/アカウントごとのヘルスモニター再起動最大数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバル monitor を有効にしたまま、チャネル単位でヘルスモニター再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャネル用のアカウント単位 override。設定されている場合、チャネルレベル override より優先されます。
- ローカル gateway 呼び出しパスは、`gateway.auth.*` が未設定のときに限り、フォールバックとして `gateway.remote.*` を使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef により明示的に設定されていて未解決の場合、解決は closed fail します（リモートフォールバックによる隠蔽は行いません）。
- `trustedProxies`: TLS を終端したり、転送元クライアントヘッダーを注入したりする reverse proxy の IP。自分が管理する proxy のみを列挙してください。loopback エントリは同一ホスト proxy/ローカル検出セットアップ（たとえば Tailscale Serve やローカル reverse proxy）では引き続き有効ですが、loopback リクエストが `gateway.auth.mode: "trusted-proxy"` の対象になることは **ありません**。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` がないときに gateway は `X-Real-IP` を受け入れます。closed fail 動作のため、デフォルトは `false` です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求された scopes がない初回 Node デバイスペアリングを自動承認するための、任意の CIDR/IP allowlist。未設定時は無効です。これは operator/browser/Control UI/WebChat のペアリングを自動承認せず、role、scope、metadata、public-key のアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: ペアリングと allowlist 評価の後に、宣言済み Node コマンドに対して適用されるグローバル allow/deny 制御です。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` 用に追加でブロックする tool 名（デフォルト deny list を拡張）。
- `gateway.tools.allow`: デフォルト HTTP deny list から tool 名を削除します。

</Accordion>

### OpenAI 互換 endpoint

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses の URL 入力ハードニング:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の allowlist は未設定として扱われます。URL 取得を無効にするには `gateway.http.endpoints.responses.files.allowUrl=false` および/または `gateway.http.endpoints.responses.images.allowUrl=false` を使用してください。
- 任意のレスポンスハードニングヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分が管理する HTTPS origin に対してのみ設定してください。詳細は [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### マルチインスタンス分離

一意の port と state dir を使って、1 台のホスト上で複数 gateway を実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利フラグ: `--dev`（`~/.openclaw-dev` + port `19001` を使用）、`--profile <name>`（`~/.openclaw-<name>` を使用）。

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

- `enabled`: gateway listener で TLS 終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合にローカルの自己署名 cert/key ペアを自動生成します。ローカル/開発専用です。
- `certPath`: TLS 証明書ファイルのファイルシステムパス。
- `keyPath`: TLS 秘密鍵ファイルのファイルシステムパス。権限制限をかけてください。
- `caPath`: クライアント検証またはカスタム trust chain 用の任意の CA bundle パス。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: 実行時に config 編集をどのように適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: config 変更時に常に gateway プロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まず hot reload を試し、必要なら再起動にフォールバックします。
- `debounceMs`: config 変更を適用する前のデバウンス時間（ms）（0 以上の整数）。
- `deferralTimeoutMs`: 進行中の操作を待ってから再起動を強制するまでの、任意の最大待機時間（ms）。省略または `0` を設定すると、無期限に待機し、まだ保留中である旨の警告を定期的に記録します。

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

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。  
クエリ文字列の hook token は拒否されます。

検証と安全性に関する注意:

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と**別の値**である必要があります。Gateway token の再利用は拒否されます。
- `hooks.path` に `/` は使えません。`/hooks` のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- mapping または preset がテンプレート化された `sessionKey` を使う場合は、`hooks.allowedSessionKeyPrefixes` と `hooks.allowRequestSessionKey=true` を設定してください。静的 mapping key ではそのオプトインは不要です。

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されます
  - テンプレート展開された mapping の `sessionKey` 値は外部から供給されたものとして扱われ、これも `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="Mapping の詳細">

- `match.path` は `/hooks` の後のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス用のペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` は、hook action を返す JS/TS module を指せます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内に留まります（絶対パスおよびパストラバーサルは拒否されます）。
- `agentId` は特定の agent にルーティングします。不明な ID はデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的なルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` がない hook agent 実行用の任意の固定 session key。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元とテンプレート駆動 mapping の session key に `sessionKey` 設定を許可します（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（request + mapping）用の任意の接頭辞 allowlist。例: `["hook:"]`。いずれかの mapping または preset がテンプレート化された `sessionKey` を使う場合は必須になります。
- `deliver: true` は最終返信をチャネルに送信します。`channel` のデフォルトは `last` です。
- `model` はこの hook 実行用の LLM を override します（model catalog が設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail 連携

- 組み込みの Gmail preset は `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- このメッセージ単位ルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` を Gmail 名前空間に一致するよう制限してください。たとえば `["hook:", "hook:gmail:"]` です。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトの代わりに静的 `sessionKey` で preset を override してください。

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

- 設定されている場合、Gateway は起動時に `gog gmail watch serve` を自動起動します。無効化するには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
- Gateway と並行して別の `gog gmail watch serve` を実行しないでください。

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Gateway port 配下の HTTP で、agent が編集可能な HTML/CSS/JS と A2UI を配信します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- 非 loopback bind: canvas ルートには、他の Gateway HTTP サーフェスと同様に Gateway auth（token/password/trusted-proxy）が必要です。
- Node WebView は通常 auth ヘッダーを送らないため、Node がペアリングされ接続されると、Gateway は canvas/A2UI アクセス用の node スコープ capability URL を公開します。
- capability URL はアクティブな Node WS セッションに紐付けられ、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 配信する HTML に live-reload クライアントを注入します。
- 空の場合は starter `index.html` を自動作成します。
- `/__openclaw__/a2ui/` でも A2UI を配信します。
- 変更には gateway の再起動が必要です。
- 大きなディレクトリや `EMFILE` エラーがある場合は live reload を無効化してください。

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

- `minimal`（デフォルト）: TXT レコードから `cliPath` と `sshPort` を省略します。
- `full`: `cliPath` と `sshPort` を含めます。
- hostname のデフォルトは `openclaw` です。`OPENCLAW_MDNS_HOSTNAME` で override します。

### Wide-area（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンを書き込みます。ネットワークをまたぐ検出には、DNS サーバー（CoreDNS 推奨）と Tailscale split DNS を組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## Environment

### `env`（インライン env var）

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

- インライン env var は、プロセス env にそのキーが存在しない場合にのみ適用されます。
- `.env` ファイル: CWD の `.env` と `~/.openclaw/.env`（どちらも既存の var を上書きしません）。
- `shellEnv`: ログインシェル profile から不足している期待キーをインポートします。
- 完全な優先順位は [Environment](/ja-JP/help/environment) を参照してください。

### Env var 置換

任意の config 文字列で `${VAR_NAME}` により env var を参照できます:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 変数が存在しない、または空の場合、config 読み込み時にエラーになります。
- リテラルの `${VAR}` にしたい場合は `$${VAR}` でエスケープします。
- `$include` でも動作します。

---

## Secrets

SecretRef は追加型です。平文値も引き続き使用できます。

### `SecretRef`

1 つのオブジェクト形式を使います。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の id パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の id: 絶対 JSON pointer（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の id パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` の id には、スラッシュ区切りのパスセグメントとして `.` または `..` を含めてはなりません（例: `a/../b` は拒否されます）

### 対応する認証情報サーフェス

- 正式なマトリクス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、対応している `openclaw.json` の認証情報パスを対象にします。
- `auth-profiles.json` の ref は、ランタイム解決と audit 対象にも含まれます。

### Secret provider 設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
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

- `file` provider は `mode: "json"` と `mode: "singleValue"` をサポートします（singleValue mode では `id` は `"value"` でなければなりません）。
- File および exec provider のパスは、Windows ACL 検証が利用できない場合に closed fail します。検証できないが信頼できるパスに対してのみ `allowInsecurePath: true` を設定してください。
- `exec` provider では絶対パスの `command` が必要で、stdin/stdout 上で protocol payload を使用します。
- デフォルトでは、symlink の command パスは拒否されます。解決後の対象パスを検証しつつ symlink パスを許可するには `allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、trusted-dir チェックは解決後の対象パスに適用されます。
- `exec` 子プロセス環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret ref は activation 時にインメモリスナップショットへ解決され、その後リクエストパスはそのスナップショットだけを読み取ります。
- activation 中に active-surface filtering が適用されます。有効なサーフェス上の未解決 ref は startup/reload を失敗させ、非アクティブなサーフェスは診断付きでスキップされます。

---

## Auth ストレージ

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
- `auth-profiles.json` は、静的認証モード向けに値レベル ref（`api_key` 用の `keyRef`、`token` 用の `tokenRef`）をサポートします。
- OAuth mode の profile（`auth.profiles.<id>.mode = "oauth"`）は、SecretRef ベースの auth-profile 認証情報をサポートしません。
- 静的ランタイム認証情報は、インメモリで解決済みのスナップショットから取得されます。旧式の静的 `auth.json` エントリは、見つかると除去されます。
- 旧形式の OAuth は `~/.openclaw/credentials/oauth.json` からインポートされます。
- [OAuth](/ja-JP/concepts/oauth) を参照してください。
- secrets のランタイム挙動と `audit/configure/apply` ツールについては [Secrets Management](/ja-JP/gateway/secrets) を参照してください。

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

- `billingBackoffHours`: profile が真の billing/credits 不足エラーで失敗したときの、時間単位の基本バックオフ（デフォルト: `5`）。明示的な billing テキストは、`401`/`403` レスポンスでもここに入ることがありますが、provider 固有のテキスト matcher はその provider に限定されたままです（例: OpenRouter の `Key limit exceeded`）。再試行可能な HTTP `402` の利用枠や organization/workspace 支出上限メッセージは、代わりに `rate_limit` パスに留まります。
- `billingBackoffHoursByProvider`: billing バックオフ時間の provider ごとの任意 override。
- `billingMaxHours`: billing バックオフの指数増加に対する時間単位の上限（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼度の `auth_permanent` failure に対する分単位の基本バックオフ（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する分単位の上限（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンタに使われる、時間単位のローリングウィンドウ（デフォルト: `24`）。
- `overloadedProfileRotations`: overloaded エラー時に、model フォールバックへ切り替える前に許可される同一 provider auth-profile ローテーションの最大数（デフォルト: `1`）。`ModelNotReadyException` のような provider-busy 形はここに入ります。
- `overloadedBackoffMs`: overloaded provider/profile ローテーションを再試行する前の固定遅延（デフォルト: `0`）。
- `rateLimitedProfileRotations`: レート制限エラー時に、model フォールバックへ切り替える前に許可される同一 provider auth-profile ローテーションの最大数（デフォルト: `1`）。このレート制限バケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のような provider 由来の文言が含まれます。

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
- `consoleLevel` は `--verbose` のとき `debug` に引き上げられます。
- `maxFileBytes`: ローテーション前のアクティブログファイル最大サイズ（バイト単位の正の整数。デフォルト: `104857600` = 100 MB）。OpenClaw はアクティブファイルの横に、番号付きアーカイブを最大 5 個保持します。

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
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
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
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列です（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: セッションが processing 状態のままのときに stuck-session 警告を出すまでの経過時間しきい値（ms）。
- `otel.enabled`: OpenTelemetry エクスポートパイプラインを有効化します（デフォルト: `false`）。完全な設定、シグナルカタログ、プライバシーモデルについては [OpenTelemetry export](/ja-JP/gateway/opentelemetry) を参照してください。
- `otel.endpoint`: OTel export 用の collector URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 任意のシグナル別 OTLP endpoint。設定されている場合、そのシグナルに限り `otel.endpoint` を上書きします。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTel export リクエストとともに送信される追加の HTTP/gRPC メタデータヘッダー。
- `otel.serviceName`: リソース属性用のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、または log export を有効化します。
- `otel.sampleRate`: trace サンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期的な telemetry flush 間隔（ms）。
- `otel.captureContent`: OTEL span 属性用の生コンテンツキャプチャのオプトイン設定。デフォルトでは無効です。真偽値 `true` は system 以外の message/tool コンテンツをキャプチャし、オブジェクト形式では `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` を明示的に有効化できます。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新の experimental GenAI span provider 属性を有効にする環境トグルです。デフォルトでは互換性のために span は legacy の `gen_ai.system` 属性を維持し、GenAI metrics は境界付き semantic 属性を使用します。
- `OPENCLAW_OTEL_PRELOADED=1`: すでにグローバル OpenTelemetry SDK を登録済みのホスト向け環境トグルです。これにより OpenClaw は Plugin 所有 SDK の起動/停止をスキップしつつ、診断リスナーはアクティブのまま維持します。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`、`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 対応する config キーが未設定の場合に使用される、シグナル別 endpoint の env var。
- `cacheTrace.enabled`: 組み込み実行用の cache trace スナップショットを記録します（デフォルト: `false`）。
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
- `auto.enabled`: パッケージインストール向けのバックグラウンド自動更新を有効化します（デフォルト: `false`）。
- `auto.stableDelayHours`: stable チャネルでの自動適用までの最小遅延時間（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable チャネルのロールアウトを分散させる追加時間幅（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta チャネルの確認を実行する時間間隔（デフォルト: `1`、最大: `24`）。

---

## ACP

```json5
{
  acp: {
    enabled: true,
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

- `enabled`: グローバルな ACP 機能ゲートです（デフォルト: `true`。ACP dispatch と spawn の UI を隠すには `false` を設定）。
- `dispatch.enabled`: ACP セッションターン dispatch 用の独立ゲートです（デフォルト: `true`）。ACP コマンドを利用可能なまま実行だけをブロックするには `false` を設定してください。
- `backend`: デフォルトの ACP ランタイム backend id（登録済み ACP ランタイム Plugin に一致している必要があります）。`plugins.allow` が設定されている場合は、backend Plugin id（例: `acpx`）を含めてください。そうしないとバンドル済みデフォルト Plugin は読み込まれません。
- `defaultAgent`: spawn が明示的な対象を指定しない場合のフォールバック ACP 対象 agent id。
- `allowedAgents`: ACP ランタイムセッションで許可される agent id の allowlist。空の場合は追加制限なし。
- `maxConcurrentSessions`: 同時にアクティブにできる ACP セッションの最大数。
- `stream.coalesceIdleMs`: ストリームされたテキスト用のアイドル flush ウィンドウ（ms）。
- `stream.maxChunkChars`: ストリームされたブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの繰り返し status/tool 行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は増分ストリームし、`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示 tool イベントの後に可視テキストの前へ入れる区切り文字（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACP ターンごとに投影される assistant 出力の最大文字数。
- `stream.maxSessionUpdateChars`: 投影される ACP status/update 行の最大文字数。
- `stream.tagVisibility`: ストリームイベントの tag 名から可視性 override の真偽値への記録。
- `runtime.ttlMinutes`: ACP セッション worker がクリーンアップ対象になるまでのアイドル TTL（分）。
- `runtime.installCommand`: ACP ランタイム環境のブートストラップ時に実行する任意の install コマンド。

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
  - `"random"`（デフォルト）: 面白い/季節もののタグラインをローテーションします。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体を隠すには（タグラインだけでなく）、env `OPENCLAW_HIDE_BANNER=1` を設定してください。

---

## Wizard

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

[Agent defaults](/ja-JP/gateway/config-agents#agent-defaults) 配下の `agents.list` identity フィールドを参照してください。

---

## Bridge（旧式、削除済み）

現在のビルドには TCP bridge は含まれていません。Node は Gateway WebSocket 経由で接続します。`bridge.*` キーは config schema の一部ではなくなっています（削除されるまで検証は失敗します。`openclaw doctor --fix` で未知キーを除去できます）。

<Accordion title="旧式 bridge config（参考用の履歴情報）">

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
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から削除する前に保持する期間です。アーカイブされた削除済み Cron transcript のクリーンアップも制御します。デフォルト: `24h`。無効化するには `false` を設定してください。
- `runLog.maxBytes`: 削除前の実行ログファイル（`cron/runs/<jobId>.jsonl`）ごとの最大サイズ。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログ削除が発動した際に保持される最新行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST 配信（`delivery.mode = "webhook"`）に使う bearer token。省略時は auth ヘッダーは送信されません。
- `webhook`: 旧式で非推奨のフォールバック Webhook URL（http/https）。保存済みで `notify: true` が付いたジョブに対してのみ使われます。

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

- `maxAttempts`: 一時的なエラーに対する one-shot ジョブの最大再試行回数（デフォルト: `3`、範囲: `0`–`10`）。
- `backoffMs`: 各再試行に対するバックオフ遅延（ms）の配列（デフォルト: `[30000, 60000, 300000]`、1〜10 エントリ）。
- `retryOn`: 再試行を引き起こすエラー種別 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略すると、すべての一時的種別を再試行します。

これは one-shot Cron ジョブにのみ適用されます。定期実行ジョブでは別の失敗処理が使われます。

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

- `enabled`: Cron ジョブの失敗アラートを有効化します（デフォルト: `false`）。
- `after`: アラートを発火させるまでの連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同じジョブに対するアラート再送の最小間隔（ms）（0 以上の整数）。
- `mode`: 配信モード — `"announce"` はチャネルメッセージで送信し、`"webhook"` は設定済み Webhook に POST します。
- `accountId`: アラート配信のスコープを定める任意の account または channel id。

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

- すべてのジョブに共通する Cron failure 通知のデフォルト宛先です。
- `mode`: `"announce"` または `"webhook"`。十分な対象データがある場合のデフォルトは `"announce"` です。
- `channel`: announce 配信用のチャネル override。`"last"` は最後に既知だった配信チャネルを再利用します。
- `to`: 明示的な announce 対象または Webhook URL。Webhook mode では必須です。
- `accountId`: 任意の配信用 account override。
- ジョブごとの `delivery.failureDestination` はこのグローバルデフォルトを override します。
- グローバルにもジョブごとにも failure destination が設定されていない場合、すでに `announce` で配信しているジョブは、失敗時にその主 announce 対象へフォールバックします。
- `delivery.failureDestination` は、ジョブの主 `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs) を参照してください。分離された Cron 実行は [background tasks](/ja-JP/automation/tasks) として追跡されます。

---

## メディア model テンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| Variable           | 説明 |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完全な受信メッセージ本文 |
| `{{RawBody}}`      | 生の本文（履歴/送信者ラッパーなし） |
| `{{BodyStripped}}` | グループ mention を除去した本文 |
| `{{From}}`         | 送信者識別子 |
| `{{To}}`           | 宛先識別子 |
| `{{MessageSid}}`   | チャネルメッセージ ID |
| `{{SessionId}}`    | 現在のセッション UUID |
| `{{IsNewSession}}` | 新しいセッションが作成されたとき `"true"` |
| `{{MediaUrl}}`     | 受信メディアの疑似 URL |
| `{{MediaPath}}`    | ローカルメディアパス |
| `{{MediaType}}`    | メディア種別（image/audio/document/…） |
| `{{Transcript}}`   | 音声文字起こし |
| `{{Prompt}}`       | CLI エントリ用に解決されたメディア prompt |
| `{{MaxChars}}`     | CLI エントリ用に解決された最大出力文字数 |
| `{{ChatType}}`     | `"direct"` または `"group"` |
| `{{GroupSubject}}` | グループ件名（ベストエフォート） |
| `{{GroupMembers}}` | グループメンバープレビュー（ベストエフォート） |
| `{{SenderName}}`   | 送信者表示名（ベストエフォート） |
| `{{SenderE164}}`   | 送信者電話番号（ベストエフォート） |
| `{{Provider}}`     | provider ヒント（whatsapp、telegram、discord など） |

---

## Config include (`$include`)

config を複数ファイルに分割できます。

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
- ファイル配列: 順番にディープマージされます（後のものが前のものを上書き）。
- 兄弟キー: include の後にマージされます（include された値を上書き）。
- ネストされた include: 最大 10 階層まで。
- パス: include しているファイルからの相対パスとして解決されますが、最上位 config ディレクトリ（`openclaw.json` の `dirname`）内に収まっている必要があります。絶対パスや `../` 形式も、その境界内に解決される場合にのみ許可されます。
- 単一ファイル include に裏付けられた 1 つの最上位セクションだけを変更する OpenClaw 管理の書き込みは、その include 先ファイルへ書き込みます。たとえば `plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 側で更新し、`openclaw.json` はそのままにします。
- ルート include、include 配列、兄弟 override を持つ include は、OpenClaw 管理の書き込みに対して読み取り専用です。そのような書き込みは config をフラット化する代わりに closed fail します。
- エラー: ファイル欠落、parse エラー、循環 include に対して明確なメッセージを出します。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [Configuration](/ja-JP/gateway/configuration)
- [Configuration examples](/ja-JP/gateway/configuration-examples)
