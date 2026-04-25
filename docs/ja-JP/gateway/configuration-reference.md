---
read_when:
    - 正確なフィールド単位のconfigセマンティクスやデフォルト値が必要な場合
    - channel、model、Gateway、またはtoolのconfigブロックを検証している場合
summary: コアOpenClawキー、デフォルト、および専用サブシステムリファレンスへのリンクのためのGateway configリファレンス
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-25T13:46:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json`のコアconfigリファレンスです。タスク指向の概要については、[Configuration](/ja-JP/gateway/configuration)を参照してください。

主要なOpenClaw config surfaceを扱い、サブシステムが独自のより深いリファレンスを持つ場合はそこへのリンクを示します。channelおよびpluginが所有するコマンドカタログや、詳細なmemory/QMDノブは、このページではなくそれぞれ専用ページにあります。

コード上の正:

- `openclaw config schema`は、検証とControl UIで使われるライブJSON Schemaを出力します。利用可能な場合はbundled/plugin/channelメタデータをマージしたものです
- `config.schema.lookup`は、ドリルダウン用ツール向けに、1つのパススコープschema nodeを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen`は、現在のschema surfaceに対してconfig-docベースラインhashを検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および`plugins.entries.memory-core.config.dreaming`配下のDreaming configについては[Memory configuration reference](/ja-JP/reference/memory-config)
- 現在のbuilt-in + bundledコマンドカタログについては[Slash commands](/ja-JP/tools/slash-commands)
- channel固有のコマンドsurfaceについては各channel/pluginページ

config形式は**JSON5**です（コメント + 末尾カンマ可）。すべてのフィールドは任意です。省略時はOpenClawが安全なデフォルトを使用します。

---

## Channels

channelごとのconfigキーは専用ページに移動しました。`channels.*`については
[Configuration — channels](/ja-JP/gateway/config-channels)を参照してください。
Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、その他のbundled channels
（認証、アクセス制御、複数アカウント、メンションゲーティングを含む）を扱います。

## Agent defaults、multi-agent、sessions、messages

専用ページに移動しました。以下については
[Configuration — agents](/ja-JP/gateway/config-agents)を参照してください。

- `agents.defaults.*`（workspace、model、thinking、Heartbeat、memory、media、Skills、sandbox）
- `multiAgent.*`（multi-agentルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、pruning）
- `messages.*`（メッセージ配信、TTS、Markdownレンダリング）
- `talk.*`（Talkモード）
  - `talk.silenceTimeoutMs`: 未設定時、Talkはtranscript送信前のプラットフォーム既定の無音待機時間を維持します（`macOSとAndroidでは700 ms、iOSでは900 ms`）

## Toolsとcustom providers

toolポリシー、experimentalトグル、provider支援tool config、およびcustom
provider / base-URL設定は専用ページに移動しました。詳しくは
[Configuration — tools and custom providers](/ja-JP/gateway/config-tools)を参照してください。

## MCP

OpenClaw管理のMCPサーバー定義は`mcp.servers`配下にあり、embedded Piやその他のruntime adapterで消費されます。`openclaw mcp list`、`show`、`set`、`unset`コマンドは、config編集時に対象サーバーへ接続せずにこのブロックを管理します。

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

- `mcp.servers`: 設定済みMCP toolsを公開するruntime向けの、名前付きstdioまたはremote MCPサーバー定義です。
- `mcp.sessionIdleTtlMs`: セッションスコープbundled MCP runtimeのアイドルTTLです。ワンショットembedded実行はrun-end cleanupを要求します。このTTLは、長寿命セッションや将来の呼び出し側向けのバックストップです。
- `mcp.*`配下の変更は、キャッシュ済みセッションMCP runtimeを破棄することでホット適用されます。次のtool検出/利用時に新しいconfigから再作成されるため、削除された`mcp.servers`エントリはアイドルTTL待ちではなく即時に回収されます。

runtime動作については、[MCP](/ja-JP/cli/mcp#openclaw-as-an-mcp-client-registry)および
[CLI backends](/ja-JP/gateway/cli-backends#bundle-mcp-overlays)を参照してください。

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

- `allowBundled`: bundled skillsのみに対する任意のallowlistです（managed/workspace skillsには影響しません）。
- `load.extraDirs`: 追加の共有skillルートです（最も低い優先順位）。
- `install.preferBrew`: `true`の場合、`brew`が利用可能なら他のinstaller種別へフォールバックする前にHomebrew installerを優先します。
- `install.nodeManager`: `metadata.openclaw.install`指定向けnode installerの優先設定です（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`は、bundled/installedであってもskillを無効化します。
- `entries.<skillKey>.apiKey`: 主要env varを宣言するskill向けの簡易設定です（プレーンテキスト文字列またはSecretRef object）。

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

- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および`plugins.load.paths`から読み込まれます。
- 検出では、native OpenClaw pluginsに加えて、互換性のあるCodex bundleおよびClaude bundleも受け入れます。manifestなしのClaudeデフォルトレイアウトbundleも含みます。
- **config変更にはGateway再起動が必要です。**
- `allow`: 任意のallowlistです（一覧にあるpluginのみ読み込まれます）。`deny`が優先されます。
- `plugins.entries.<id>.apiKey`: pluginレベルAPIキーの簡易フィールドです（pluginがサポートする場合）。
- `plugins.entries.<id>.env`: pluginスコープのenv varマップです。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false`の場合、coreは`before_prompt_build`をブロックし、legacy `before_agent_start`からのprompt変更フィールドを無視します。一方でlegacy `modelOverride`と`providerOverride`は保持します。native plugin hooksおよび、サポートされるbundle提供hookディレクトリに適用されます。
- `plugins.entries.<id>.hooks.allowConversationAccess`: `true`の場合、信頼された非bundled pluginは、`llm_input`、`llm_output`、`agent_end`のような型付きhookから生の会話内容を読めます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このpluginがバックグラウンドsubagent実行に対して実行単位の`provider`および`model`上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼されたsubagent override向けの、正規の`provider/model`ターゲットの任意allowlistです。意図的に任意モデルを許可したい場合にのみ`"*"`を使用してください。
- `plugins.entries.<id>.config`: plugin定義のconfig objectです（利用可能な場合はnative OpenClaw plugin schemaで検証されます）。
- channel pluginのアカウント/runtime設定は`channels.<id>`配下にあり、中央のOpenClawオプションレジストリではなく、所有pluginのmanifest `channelConfigs`メタデータで記述されるべきです。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch provider設定です。
  - `apiKey`: Firecrawl APIキーです（SecretRef対応）。`plugins.entries.firecrawl.config.webSearch.apiKey`、legacy `tools.web.fetch.firecrawl.apiKey`、または`FIRECRAWL_API_KEY` env varにフォールバックします。
  - `baseUrl`: Firecrawl API base URLです（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページからメインコンテンツのみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ有効期間（ミリ秒）です（デフォルト: `172800000` / 2日）。
  - `timeoutSeconds`: スクレイプ要求のタイムアウト秒数です（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定です。
  - `enabled`: X Search providerを有効化します。
  - `model`: 検索に使うGrok modelです（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: memory Dreaming設定です。フェーズとしきい値については[Dreaming](/ja-JP/concepts/dreaming)を参照してください。
  - `enabled`: Dreamingのマスタースイッチです（デフォルト`false`）。
  - `frequency`: 各フルDreaming sweepのCron cadenceです（デフォルトで`"0 3 * * *"`）。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向けconfigキーではありません）。
- 完全なmemory configは[Memory configuration reference](/ja-JP/reference/memory-config)にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効なClaude bundle pluginsは、`settings.json`からembedded Piデフォルトを提供することもできます。OpenClawはこれを生のOpenClaw config patchとしてではなく、サニタイズされたagent設定として適用します。
- `plugins.slots.memory`: アクティブなmemory plugin idを選択します。memory pluginsを無効にするには`"none"`を指定します。
- `plugins.slots.contextEngine`: アクティブなcontext engine plugin idを選択します。別のengineをインストールして選択しない限り、デフォルトは`"legacy"`です。
- `plugins.installs`: `openclaw plugins update`で使われるCLI管理インストールメタデータです。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`を含みます。
  - `plugins.installs.*`は管理状態として扱ってください。手動編集ではなくCLIコマンドを優先してください。

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

- `evaluateEnabled: false`は、`act:evaluate`と`wait --fn`を無効にします。
- `tabCleanup`は、アイドル時間後、またはセッションが上限を超えたときに、追跡されているprimary-agentタブを回収します。個別のクリーンアップモードを無効にするには、`idleMinutes: 0`または`maxTabsPerSession: 0`を設定してください。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`は未設定時には無効のため、ブラウザナビゲーションはデフォルトで厳格なままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`は、プライベートネットワークへのブラウザナビゲーションを意図的に信頼する場合にのみ設定してください。
- strict modeでは、リモートCDPプロファイルエンドポイント（`profiles.*.cdpUrl`）も、到達性/検出チェック時に同じプライベートネットワークブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork`は、従来エイリアスとして引き続きサポートされます。
- strict modeでは、明示的な例外に`ssrfPolicy.hostnameAllowlist`と`ssrfPolicy.allowedHostnames`を使用してください。
- リモートプロファイルはattach-onlyです（start/stop/resetは無効）。
- `profiles.*.cdpUrl`は`http://`、`https://`、`ws://`、`wss://`を受け付けます。`/json/version`をOpenClawに検出させたい場合はHTTP(S)を使用し、providerが直接のDevTools WebSocket URLを提供する場合はWS(S)を使用してください。
- `existing-session`プロファイルはCDPの代わりにChrome MCPを使用し、選択したホスト上、または接続済みbrowser node経由でattachできます。
- `existing-session`プロファイルでは、BraveやEdgeのような特定のChromium系ブラウザプロファイルを対象にするため、`userDataDir`を設定できます。
- `existing-session`プロファイルは、現在のChrome MCPルート制限を維持します。つまり、CSSセレクター指定ではなくsnapshot/ref駆動アクション、1ファイルアップロードhook、ダイアログタイムアウト上書きなし、`wait --load networkidle`なし、`responsebody`、PDFエクスポート、ダウンロードインターセプト、バッチアクションなしです。
- ローカル管理の`openclaw`プロファイルは`cdpPort`と`cdpUrl`を自動割り当てします。`cdpUrl`を明示的に設定するのはリモートCDPの場合だけにしてください。
- ローカル管理プロファイルでは、プロファイルごとにグローバルな`browser.executablePath`を上書きするために`executablePath`を設定できます。これにより、あるプロファイルはChrome、別のプロファイルはBraveで実行できます。
- ローカル管理プロファイルでは、プロセス開始後のChrome CDP HTTP検出に`browser.localLaunchTimeoutMs`を使い、起動後のCDP websocket準備完了には`browser.localCdpReadyTimeoutMs`を使います。Chrome自体は正常起動するものの、準備完了チェックが起動と競合するような低速ホストでは、これらを引き上げてください。
- 自動検出順序: 既定ブラウザがChromium系ならそれ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath`は、OSホームディレクトリ用に`~`を受け付けます。
- Control service: loopbackのみ（portは`gateway.port`から導出。デフォルト`18791`）。
- `extraArgs`は、ローカルChromium起動に追加の起動フラグを付加します（例: `--disable-gpu`、ウィンドウサイズ指定、またはデバッグフラグ）。

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

- `seamColor`: ネイティブアプリUIクローム用のアクセントカラーです（Talk Modeのバブル色など）。
- `assistant`: Control UIのID上書きです。アクティブなagent identityにフォールバックします。

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

<Accordion title="Gatewayフィールド詳細">

- `mode`: `local`（gatewayを実行）または`remote`（リモートgatewayへ接続）です。Gatewayは`local`でない限り起動を拒否します。
- `port`: WS + HTTP用の単一多重化portです。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IPのみ）、または`custom`です。
- **従来のbindエイリアス**: `gateway.bind`ではホストエイリアス（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind mode値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Dockerに関する注記**: デフォルトの`loopback` bindは、コンテナ内の`127.0.0.1`で待ち受けます。Docker bridge networking（`-p 18789:18789`）ではトラフィックは`eth0`に到着するため、gatewayには到達できません。`--network host`を使うか、全インターフェースで待ち受けるために`bind: "lan"`（または`bind: "custom"`と`customBindHost: "0.0.0.0"`）を設定してください。
- **Auth**: デフォルトで必須です。loopback以外のbindではgateway authが必要です。実際には、共有token/password、または`gateway.auth.mode: "trusted-proxy"`を使うID対応のリバースプロキシを意味します。オンボーディングウィザードはデフォルトでtokenを生成します。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されている場合（SecretRefを含む）は、`gateway.auth.mode`を`token`または`password`に明示設定してください。両方が設定されていてmodeが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的なno-auth modeです。信頼できるlocal loopback構成でのみ使用してください。これは意図的にオンボーディングプロンプトでは提示されません。
- `gateway.auth.mode: "trusted-proxy"`: 認証をID対応のリバースプロキシへ委任し、`gateway.trustedProxies`からのIDヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照）。このmodeは**non-loopback**のプロキシソースを前提とします。同一ホスト上のloopbackリバースプロキシはtrusted-proxy authの条件を満たしません。
- `gateway.auth.allowTailscale`: `true`の場合、Tailscale ServeのIDヘッダーがControl UI/WebSocket authを満たせます（`tailscale whois`で検証）。HTTP APIエンドポイントではそのTailscaleヘッダーauthは使われず、通常のHTTP auth modeに従います。このtoken不要フローはgatewayホストが信頼されていることを前提とします。`tailscale.mode = "serve"`のときのデフォルトは`true`です。
- `gateway.auth.rateLimit`: 任意の認証失敗レート制限です。クライアントIPごと、およびauthスコープごとに適用されます（shared-secretとdevice-tokenは独立して追跡されます）。ブロックされた試行は`429` + `Retry-After`を返します。
  - 非同期のTailscale Serve Control UIパスでは、同じ`{scope, clientIp}`に対する失敗試行は、失敗書き込み前に直列化されます。そのため、同一クライアントからの同時不正試行は、両方が単なる不一致として競合通過するのではなく、2回目のリクエストで制限に達することがあります。
  - `gateway.auth.rateLimit.exemptLoopback`のデフォルトは`true`です。localhostトラフィックにも意図的にレート制限をかけたい場合（テスト構成や厳格なプロキシ構成など）は`false`に設定してください。
- ブラウザ起点のWS auth試行は、常にloopback除外を無効にした状態でスロットリングされます（ブラウザ経由のlocalhost総当たりに対する多層防御）。
- loopbackでは、それらのブラウザ起点lockoutは正規化された`Origin`値ごとに分離されるため、あるlocalhost originからの繰り返し失敗が、別のoriginを自動的にlockoutすることはありません。
- `tailscale.mode`: `serve`（tailnetのみ、loopback bind）または`funnel`（公開、auth必須）です。
- `controlUi.allowedOrigins`: Gateway WebSocket接続用の明示的なブラウザorigin allowlistです。non-loopback originからのブラウザクライアントを想定する場合は必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Hostヘッダーoriginポリシーに意図的に依存するデプロイ向けに、Hostヘッダーorigin fallbackを有効にする危険なmodeです。
- `remote.transport`: `ssh`（デフォルト）または`direct`（ws/wss）です。`direct`では、`remote.url`は`ws://`または`wss://`である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベートネットワークIPへの平文`ws://`を許可する、クライアント側プロセス環境のbreak-glass上書きです。デフォルトでは、平文は引き続きloopbackのみ許可されます。`openclaw.json`相当の設定はなく、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`のようなブラウザのプライベートネットワーク設定もGateway WebSocketクライアントには影響しません。
- `gateway.remote.token` / `.password`: リモートクライアントの認証情報フィールドです。これ自体ではgateway authは設定しません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOSビルドがrelay経由登録をgatewayへ公開した後に使う、外部APNs relayのベースHTTPS URLです。このURLは、iOSビルドにコンパイルされたrelay URLと一致する必要があります。
- `gateway.push.apns.relay.timeoutMs`: gatewayからrelayへの送信タイムアウト（ミリ秒）です。デフォルトは`10000`です。
- relay経由の登録は、特定のgateway identityに委任されます。ペア済みiOSアプリは`gateway.identity.get`を取得し、そのidentityをrelay登録に含め、登録スコープのsend grantをgatewayへ転送します。別のgatewayはその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記relay configの一時的なenv上書きです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL用の開発専用escape hatchです。本番relay URLはHTTPSのままにしてください。
- `gateway.channelHealthCheckMinutes`: channel health-monitor間隔（分）です。グローバルにhealth-monitor再起動を無効にするには`0`を設定してください。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socketしきい値（分）です。これは`gateway.channelHealthCheckMinutes`以上に保ってください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: 1時間のローリングウィンドウ内でのchannel/accountごとのhealth-monitor再起動上限です。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルmonitorを有効のまま、チャネル単位でhealth-monitor再起動をオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 複数アカウントchannel向けのアカウント単位上書きです。設定されている場合、チャネルレベル上書きより優先されます。
- ローカルgatewayの呼び出しパスは、`gateway.auth.*`が未設定の場合に限り、フォールバックとして`gateway.remote.*`を使用できます。
- `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示設定され、未解決の場合、解決はfail closedになります（リモートフォールバックで隠蔽されません）。
- `trustedProxies`: TLSを終端する、またはforwarded-clientヘッダーを注入するリバースプロキシのIPです。自分で管理するプロキシのみを列挙してください。loopbackエントリは、同一ホストのプロキシ/ローカル検出構成（例: Tailscale Serveやローカルリバースプロキシ）では引き続き有効ですが、loopbackリクエストが`gateway.auth.mode: "trusted-proxy"`の対象になるわけでは**ありません**。
- `allowRealIpFallback`: `true`の場合、`X-Forwarded-For`がないときにgatewayは`X-Real-IP`を受け入れます。fail-closed動作のためデフォルトは`false`です。
- `gateway.nodes.pairing.autoApproveCidrs`: 要求スコープなしの初回node device pairingを自動承認するための任意のCIDR/IP allowlistです。未設定時は無効です。これはoperator/browser/Control UI/WebChat pairingを自動承認せず、role、scope、metadata、public-keyのアップグレードも自動承認しません。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: pairingおよびallowlist評価後に宣言済みnode commandへ適用される、グローバルな許可/拒否整形です。
- `gateway.tools.deny`: HTTP `POST /tools/invoke`向けに追加でブロックするtool名です（デフォルトdeny listを拡張）。
- `gateway.tools.allow`: デフォルトのHTTP deny listからtool名を除外します。

</Accordion>

### OpenAI互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true`で有効化します。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力ハードニング:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空のallowlistは未設定として扱われます。URL取得を無効にするには、`gateway.http.endpoints.responses.files.allowUrl=false`および/または`gateway.http.endpoints.responses.images.allowUrl=false`を使用してください。
- 任意のresponse hardening header:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分で管理するHTTPS originに対してのみ設定してください。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)を参照）

### 複数インスタンスの分離

一意のportとstate dirを使って、1台のホスト上で複数gatewayを実行します。

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

- `enabled`: gateway listenerでTLS終端（HTTPS/WSS）を有効化します（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカル自己署名cert/keyペアを自動生成します。ローカル/dev用途専用です。
- `certPath`: TLS certificateファイルのファイルシステムパスです。
- `keyPath`: TLS private keyファイルのファイルシステムパスです。権限を制限して保持してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の任意のCA bundleパスです。

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

- `mode`: 実行時にconfig編集をどう適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: config変更時に常にgatewayプロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずhot reloadを試し、必要ならrestartへフォールバックします。
- `debounceMs`: config変更適用前のデバウンス時間（ms）です（0以上の整数）。
- `deferralTimeoutMs`: 進行中処理を待ってからrestartを強制するまでの最大待機時間（ms）の任意設定です。省略または`0`の場合、無期限に待機し、まだ保留中であることを示す警告を定期的にログ出力します。

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
クエリ文字列のhook tokenは拒否されます。

検証と安全性に関する注意:

- `hooks.enabled=true`には空でない`hooks.token`が必要です。
- `hooks.token`は`gateway.auth.token`と**異なる**必要があります。Gateway tokenの再利用は拒否されます。
- `hooks.path`は`/`にできません。`/hooks`のような専用サブパスを使用してください。
- `hooks.allowRequestSessionKey=true`の場合は、`hooks.allowedSessionKeyPrefixes`を制限してください（例: `["hook:"]`）。
- mappingまたはpresetがテンプレート化された`sessionKey`を使う場合は、`hooks.allowedSessionKeyPrefixes`と`hooks.allowRequestSessionKey=true`を設定してください。静的mappingキーにはそのオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストpayloadからの`sessionKey`は、`hooks.allowRequestSessionKey=true`の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings`経由で解決されます
  - テンプレート展開されたmappingの`sessionKey`値は外部供給として扱われ、これも`hooks.allowRequestSessionKey=true`を必要とします。

<Accordion title="Mapping詳細">

- `match.path`は`/hooks`以降のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source`は、汎用パス向けにpayloadフィールドへ一致します。
- `{{messages[0].subject}}`のようなテンプレートはpayloadから読み取られます。
- `transform`は、hook actionを返すJS/TS moduleを指せます。
  - `transform.module`は相対パスである必要があり、`hooks.transformsDir`内に留まります（絶対パスとトラバーサルは拒否されます）。
- `agentId`は特定agentへルーティングします。不明なIDはデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的ルーティングを制限します（`*`または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的`sessionKey`なしのhook agent実行向けの任意の固定セッションキーです。
- `allowRequestSessionKey`: `/hooks/agent`呼び出し元およびテンプレート駆動mapping session keyによる`sessionKey`設定を許可します（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的`sessionKey`値（リクエスト + mapping）向けの任意のプレフィックスallowlistです。例: `["hook:"]`。いずれかのmappingまたはpresetがテンプレート化された`sessionKey`を使う場合は必須になります。
- `deliver: true`は最終返信をchannelへ送信します。`channel`のデフォルトは`last`です。
- `model`はこのhook実行のLLMを上書きします（model catalogが設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail統合

- 組み込みのGmail presetは`sessionKey: "hook:gmail:{{messages[0].id}}"`を使用します。
- このメッセージ単位ルーティングを維持する場合は、`hooks.allowRequestSessionKey: true`を設定し、`hooks.allowedSessionKeyPrefixes`をGmail namespaceに合うよう制限してください。たとえば`["hook:", "hook:gmail:"]`です。
- `hooks.allowRequestSessionKey: false`が必要な場合は、テンプレート化されたデフォルトの代わりに静的な`sessionKey`でpresetを上書きしてください。

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

- 設定されている場合、Gatewayは起動時に`gog gmail watch serve`を自動起動します。無効にするには`OPENCLAW_SKIP_GMAIL_WATCHER=1`を設定してください。
- Gatewayと並行して別の`gog gmail watch serve`を実行しないでください。

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

- agentが編集可能なHTML/CSS/JSとA2UIを、Gateway port配下のHTTPで提供します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）のままにしてください。
- non-loopback bindでは、canvasルートは他のGateway HTTP surfaceと同様にGateway auth（token/password/trusted-proxy）を必要とします。
- Node WebViewは通常authヘッダーを送らないため、nodeがpairingおよび接続済みになると、Gatewayはcanvas/A2UIアクセス用のnodeスコープcapability URLを通知します。
- capability URLはアクティブなnode WSセッションにバインドされ、短時間で期限切れになります。IPベースのフォールバックは使われません。
- 提供するHTMLにlive-reload clientを注入します。
- 空の場合はスターター`index.html`を自動作成します。
- A2UIも`/__openclaw__/a2ui/`で提供します。
- 変更にはgateway再起動が必要です。
- 大きなディレクトリや`EMFILE`エラー時はlive reloadを無効にしてください。

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

- `minimal`（デフォルト）: TXTレコードから`cliPath` + `sshPort`を省略します。
- `full`: `cliPath` + `sshPort`を含めます。
- Hostnameのデフォルトは`openclaw`です。`OPENCLAW_MDNS_HOSTNAME`で上書きできます。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/`配下にunicast DNS-SD zoneを書き込みます。ネットワークをまたぐdiscoveryには、DNSサーバー（CoreDNS推奨） + Tailscale split DNSを組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## Environment

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

- インラインenv varは、プロセスenvにそのキーがない場合にのみ適用されます。
- `.env`ファイル: CWDの`.env` + `~/.openclaw/.env`（どちらも既存varを上書きしません）。
- `shellEnv`: ログインshell profileから、不足している想定キーを取り込みます。
- 完全な優先順位については[Environment](/ja-JP/help/environment)を参照してください。

### Env var置換

任意のconfig文字列内で`${VAR_NAME}`を使ってenv varを参照できます:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 変数が未設定または空の場合、config読み込み時にエラーになります。
- リテラルの`${VAR}`にするには`$${VAR}`でエスケープします。
- `$include`でも動作します。

---

## Secrets

SecretRefは追加的な仕組みです。プレーンテキスト値も引き続き利用できます。

### `SecretRef`

1つのobject形式を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider`パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"`のidパターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"`のid: 絶対JSON pointer（例: `"/providers/openai/apiKey"`）
- `source: "exec"`のidパターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"`のidには、`.`や`..`のスラッシュ区切りパスセグメントを含めてはいけません（例: `a/../b`は拒否されます）

### サポートされる認証情報surface

- 正規の一覧: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply`は、サポートされる`openclaw.json`認証情報パスを対象にします。
- `auth-profiles.json`のrefも、実行時解決と監査対象に含まれます。

### Secret provider設定

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

- `file` providerは`mode: "json"`と`mode: "singleValue"`をサポートします（singleValue modeでは`id`は`"value"`でなければなりません）。
- Windows ACL検証が利用できない場合、fileおよびexec provider pathはfail closedになります。検証できないが信頼できるpathに対してのみ`allowInsecurePath: true`を設定してください。
- `exec` providerは絶対`command`パスを必要とし、stdin/stdout上のprotocol payloadを使用します。
- デフォルトでは、symlinkのcommand pathは拒否されます。解決後のターゲットパスを検証しつつsymlink pathを許可するには、`allowSymlinkCommand: true`を設定してください。
- `trustedDirs`が設定されている場合、trusted-dirチェックは解決後のターゲットパスに適用されます。
- `exec`の子プロセスenvironmentはデフォルトで最小限です。必要な変数は`passEnv`で明示的に渡してください。
- Secret refは有効化時にメモリ上スナップショットへ解決され、その後リクエストパスはそのスナップショットのみを読みます。
- アクティブsurfaceフィルタリングは有効化中に適用されます。有効なsurface上の未解決refは起動/reloadを失敗させ、非アクティブsurfaceは診断付きでスキップされます。

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
- `auth-profiles.json`は、静的認証モード向けに値レベルref（`api_key`用の`keyRef`、`token`用の`tokenRef`）をサポートします。
- OAuth mode profile（`auth.profiles.<id>.mode = "oauth"`）は、SecretRefを使ったauth-profile認証情報をサポートしません。
- 静的runtime認証情報は、メモリ上の解決済みスナップショットから取得されます。従来の静的`auth.json`エントリは、見つかった時点で削除されます。
- 従来のOAuthインポート元は`~/.openclaw/credentials/oauth.json`です。
- [OAuth](/ja-JP/concepts/oauth)を参照してください。
- Secretsのruntime動作と`audit/configure/apply`ツールについては、[Secrets Management](/ja-JP/gateway/secrets)を参照してください。

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

- `billingBackoffHours`: profileが真の課金/残高不足エラーで失敗した場合の、時間単位の基本backoffです（デフォルト: `5`）。明示的な課金文言は、`401`/`403`応答でもここに分類されることがありますが、provider固有の文言マッチャーはそのproviderに限定されたままです（例: OpenRouterの`Key limit exceeded`）。再試行可能なHTTP `402`の利用枠期間またはorganization/workspaceの支出上限メッセージは、代わりに`rate_limit`経路に残ります。
- `billingBackoffHoursByProvider`: 課金backoff時間に対する、providerごとの任意上書きです。
- `billingMaxHours`: 課金backoffの指数増加に対する上限時間です（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼な`auth_permanent`失敗に対する、分単位の基本backoffです（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` backoff増加の上限分数です（デフォルト: `60`）。
- `failureWindowHours`: backoffカウンターに使用するローリングウィンドウ時間です（デフォルト: `24`）。
- `overloadedProfileRotations`: overloadedエラーに対してmodel fallbackへ切り替える前に許可する、同一provider auth-profile rotationの最大回数です（デフォルト: `1`）。`ModelNotReadyException`のようなprovider-busy形状はここに分類されます。
- `overloadedBackoffMs`: overloaded provider/profile rotationを再試行する前の固定遅延です（デフォルト: `0`）。
- `rateLimitedProfileRotations`: rate-limitエラーに対してmodel fallbackへ切り替える前に許可する、同一provider auth-profile rotationの最大回数です（デフォルト: `1`）。このrate-limitバケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted`のようなprovider形状の文言が含まれます。

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
- 安定したpathにするには`logging.file`を設定してください。
- `consoleLevel`は`--verbose`時に`debug`へ引き上げられます。
- `maxFileBytes`: 書き込み抑止前のログファイル最大サイズ（バイト）です（正の整数。デフォルト: `524288000` = 500 MB）。本番デプロイでは外部ログローテーションを使用してください。

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
- `flags`: 対象を絞ったログ出力を有効にするflag文字列配列です（`"telegram.*"`や`"*"`のようなワイルドカード対応）。
- `stuckSessionWarnMs`: セッションがprocessing状態のままの間にstuck-session警告を出すまでの経過しきい値（ms）です。
- `otel.enabled`: OpenTelemetryエクスポートパイプラインを有効にします（デフォルト: `false`）。
- `otel.endpoint`: OTelエクスポート用collector URLです。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または`"grpc"`です。
- `otel.headers`: OTelエクスポート要求に付加される追加のHTTP/gRPCメタデータヘッダーです。
- `otel.serviceName`: resource attribute用のサービス名です。
- `otel.traces` / `otel.metrics` / `otel.logs`: trace、metrics、またはlogエクスポートを有効にします。
- `otel.sampleRate`: traceサンプリング率です（`0`–`1`）。
- `otel.flushIntervalMs`: 定期telemetry flush間隔（ms）です。
- `otel.captureContent`: OTEL span attribute向けの生コンテンツ取得をオプトインします。デフォルトはoffです。boolean `true`はsystem以外のmessage/tool内容を取得し、object形式では`inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt`を個別に有効化できます。
- `OPENCLAW_OTEL_PRELOADED=1`: すでにグローバルOpenTelemetry SDKを登録済みのホスト向けのenvironmentトグルです。この場合、OpenClawはplugin所有のSDK起動/終了をスキップしつつ、diagnostic listenerは有効のままにします。
- `cacheTrace.enabled`: embedded実行用のcache trace snapshotログを有効にします（デフォルト: `false`）。
- `cacheTrace.filePath`: cache trace JSONLの出力パスです（デフォルト: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
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

- `channel`: npm/gitインストール用のリリースchannelです — `"stable"`、`"beta"`、または`"dev"`。
- `checkOnStart`: gateway起動時にnpm更新を確認します（デフォルト: `true`）。
- `auto.enabled`: packageインストール向けのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stable-channel自動適用前の最小遅延時間です（デフォルト: `6`、最大: `168`）。
- `auto.stableJitterHours`: stable-channelロールアウトの追加分散ウィンドウ時間です（デフォルト: `12`、最大: `168`）。
- `auto.betaCheckIntervalHours`: beta-channel確認の実行間隔（時間）です（デフォルト: `1`、最大: `24`）。

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
- `dispatch.enabled`: ACPセッションターンdispatch用の独立したゲートです（デフォルト: `true`）。ACPコマンドを利用可能なまま実行だけをブロックしたい場合は`false`に設定してください。
- `backend`: デフォルトのACP runtime backend idです（登録済みACP runtime pluginに一致する必要があります）。
- `defaultAgent`: spawnで明示ターゲットが指定されない場合のフォールバックACP target agent idです。
- `allowedAgents`: ACP runtime sessionで許可されるagent idのallowlistです。空は追加制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできるACP sessionの最大数です。
- `stream.coalesceIdleMs`: ストリームされたテキスト用のアイドルflushウィンドウ（ms）です。
- `stream.maxChunkChars`: ストリームされたブロック投影を分割する前の最大チャンクサイズです。
- `stream.repeatSuppression`: ターンごとの重複したstatus/tool行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"`は段階的にストリームし、`"final_only"`はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示toolイベントの後、可視テキストの前に入れる区切りです（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACPターンごとに投影されるassistant出力文字数の上限です。
- `stream.maxSessionUpdateChars`: 投影されるACP status/update行の最大文字数です。
- `stream.tagVisibility`: ストリームイベント用の、tag名からboolean可視性上書きへの記録です。
- `runtime.ttlMinutes`: ACP session workerがクリーンアップ対象になるまでのアイドルTTL（分）です。
- `runtime.installCommand`: ACP runtime environmentをbootstrapするときに実行する任意のインストールコマンドです。

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

- `cli.banner.taglineMode`はバナーのtaglineスタイルを制御します:
  - `"random"`（デフォルト）: ローテーションする面白系/季節系tagline。
  - `"default"`: 固定の中立tagline（`All your chats, one OpenClaw.`）。
  - `"off"`: taglineテキストなし（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体を隠したい場合（taglineだけでなく）は、env `OPENCLAW_HIDE_BANNER=1`を設定してください。

---

## Wizard

CLIのガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）によって書き込まれるメタデータです:

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

[Agent defaults](/ja-JP/gateway/config-agents#agent-defaults)配下の`agents.list` identityフィールドを参照してください。

---

## Bridge（legacy、削除済み）

現在のビルドにはTCP bridgeは含まれていません。NodesはGateway WebSocket経由で接続します。`bridge.*`キーはもはやconfig schemaの一部ではありません（削除されるまで検証は失敗します。`openclaw doctor --fix`でunknown keyを削除できます）。

<Accordion title="Legacy bridge config（履歴参照）">

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

- `sessionRetention`: 完了したisolated cron実行セッションを`sessions.json`からpruneするまでの保持期間です。削除済みcron transcriptのアーカイブクリーンアップもこれで制御します。デフォルト: `24h`。無効にするには`false`を設定してください。
- `runLog.maxBytes`: prune前の、実行ログファイル（`cron/runs/<jobId>.jsonl`）ごとの最大サイズです。デフォルト: `2_000_000`バイト。
- `runLog.keepLines`: 実行ログprune発動時に保持される最新行数です。デフォルト: `2000`。
- `webhookToken`: cron webhook POST配信（`delivery.mode = "webhook"`）で使うbearer tokenです。省略時はauthヘッダーは送信されません。
- `webhook`: 保存済みジョブで`notify: true`が残っているものにのみ使われる、非推奨の従来fallback webhook URL（http/https）です。

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

- `maxAttempts`: 一時エラー時のone-shot jobに対する最大リトライ回数です（デフォルト: `3`、範囲: `0`–`10`）。
- `backoffMs`: 各リトライ試行に使うbackoff遅延（ms）の配列です（デフォルト: `[30000, 60000, 300000]`、1〜10要素）。
- `retryOn`: リトライを発動するエラー種別です — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略するとすべての一時エラー種別をリトライします。

one-shot cron jobsにのみ適用されます。定期ジョブは別の失敗処理を使用します。

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

- `enabled`: cron jobの失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラート発火までの連続失敗回数です（正の整数、最小: `1`）。
- `cooldownMs`: 同一jobに対する再アラート間の最小ミリ秒数です（0以上の整数）。
- `mode`: 配信モードです — `"announce"`はchannel message経由で送信し、`"webhook"`は設定済みwebhookへPOSTします。
- `accountId`: アラート配信のスコープを絞る任意のaccountまたはchannel idです。

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

- すべてのjobに共通するcron失敗通知のデフォルト宛先です。
- `mode`: `"announce"`または`"webhook"`です。十分なターゲット情報が存在する場合のデフォルトは`"announce"`です。
- `channel`: announce配信のchannel上書きです。`"last"`は最後に分かっている配信channelを再利用します。
- `to`: 明示的なannounceターゲットまたはwebhook URLです。webhook modeでは必須です。
- `accountId`: 配信用の任意のaccount上書きです。
- jobごとの`delivery.failureDestination`がこのグローバルデフォルトを上書きします。
- グローバルにもjobごとにも失敗宛先が設定されていない場合、すでに`announce`で配信しているjobは、失敗時にそのprimary announceターゲットへフォールバックします。
- `delivery.failureDestination`は、jobのprimary `delivery.mode`が`"webhook"`でない限り、`sessionTarget="isolated"`のjobでのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs)を参照してください。isolated cron実行は[background tasks](/ja-JP/automation/tasks)として追跡されます。

---

## Media model template variables

`tools.media.models[].args`で展開されるテンプレートプレースホルダー:

| 変数 | 説明 |
| ------------------ | ------------------------------------------------- |
| `{{Body}}` | 完全な受信メッセージ本文 |
| `{{RawBody}}` | 生の本文（履歴/送信者ラッパーなし） |
| `{{BodyStripped}}` | グループメンションを取り除いた本文 |
| `{{From}}` | 送信者ID |
| `{{To}}` | 宛先ID |
| `{{MessageSid}}` | channelメッセージID |
| `{{SessionId}}` | 現在のセッションUUID |
| `{{IsNewSession}}` | 新しいセッションが作成されたとき`"true"` |
| `{{MediaUrl}}` | 受信メディアの疑似URL |
| `{{MediaPath}}` | ローカルメディアパス |
| `{{MediaType}}` | メディア種別（image/audio/document/…） |
| `{{Transcript}}` | 音声transcript |
| `{{Prompt}}` | CLI項目向けに解決されたmedia prompt |
| `{{MaxChars}}` | CLI項目向けに解決された最大出力文字数 |
| `{{ChatType}}` | `"direct"`または`"group"` |
| `{{GroupSubject}}` | グループ件名（ベストエフォート） |
| `{{GroupMembers}}` | グループメンバーのプレビュー（ベストエフォート） |
| `{{SenderName}}` | 送信者表示名（ベストエフォート） |
| `{{SenderE164}}` | 送信者電話番号（ベストエフォート） |
| `{{Provider}}` | providerヒント（whatsapp、telegram、discordなど） |

---

## Config includes（`$include`）

configを複数ファイルに分割できます:

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
- ファイル配列: 順番にdeep mergeされます（後のものが前のものを上書き）。
- 兄弟キー: includeの後にマージされます（includeされた値を上書き）。
- ネストしたinclude: 最大10階層まで。
- パス: include元ファイルを基準に解決されますが、トップレベルconfigディレクトリ（`openclaw.json`の`dirname`）内に留まる必要があります。絶対パスや`../`形式も、最終的にその境界内へ解決される場合に限り許可されます。
- 1つのトップレベルsectionだけを変更するOpenClaw管理の書き込みで、そのsectionが単一ファイルincludeに対応している場合、そのinclude先ファイルへ書き込みます。たとえば、`plugins install`は`plugins: { $include: "./plugins.json5" }`を`plugins.json5`内で更新し、`openclaw.json`はそのまま残します。
- ルートinclude、include配列、および兄弟上書きを伴うincludeは、OpenClaw管理書き込みでは読み取り専用です。それらの書き込みはconfigをフラット化する代わりにfail closedします。
- エラー: ファイル欠如、パースエラー、循環includeに対して明確なメッセージを出します。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [Configuration](/ja-JP/gateway/configuration)
- [Configuration examples](/ja-JP/gateway/configuration-examples)
