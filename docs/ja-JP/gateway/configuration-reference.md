---
read_when:
    - 正確なフィールドレベルの設定セマンティクスまたはデフォルトが必要です
    - チャンネル、モデル、Gateway、またはツールの設定ブロックを検証しています
summary: コアOpenClawキーのGateway設定リファレンス、デフォルト、および専用サブシステムリファレンスへのリンク
title: 設定リファレンス
x-i18n:
    generated_at: "2026-04-24T08:57:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc0d9feea2f2707f267d50ec83aa664ef503db8f9132762345cc80305f8bef73
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json`のコア設定リファレンスです。タスク指向の概要については、[Configuration](/ja-JP/gateway/configuration)を参照してください。

このページでは、OpenClawの主要な設定サーフェスを扱い、サブシステムごとにより詳細な専用リファレンスがある場合はそちらへリンクします。1ページの中に、すべてのチャンネル/Plugin所有のコマンドカタログや、すべての詳細なメモリ/QMDノブをインライン展開することは**意図していません**。

コード上の正しい情報源:

- `openclaw config schema` は、バリデーションとControl UIで使われるライブJSON Schemaを出力します。利用可能な場合は、バンドル済み/Plugin/チャンネルのメタデータがマージされます
- `config.schema.lookup` は、ドリルダウンツール向けに、パススコープされた単一のスキーマノードを返します
- `pnpm config:docs:check` / `pnpm config:docs:gen` は、現在のスキーマサーフェスに対してconfig-docベースラインハッシュを検証します

専用の詳細リファレンス:

- `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`、および`plugins.entries.memory-core.config.dreaming`配下のDreaming設定については[Memory configuration reference](/ja-JP/reference/memory-config)
- 現在の組み込み + バンドル済みコマンドカタログについては[Slash Commands](/ja-JP/tools/slash-commands)
- チャンネル固有のコマンドサーフェスについては各チャンネル/Pluginページ

設定形式は**JSON5**です（コメントと末尾カンマを使用できます）。すべてのフィールドは任意です — OpenClawは省略時に安全なデフォルトを使用します。

---

## チャンネル

チャンネルごとの設定キーは専用ページに移動しました — `channels.*`については
[Configuration — channels](/ja-JP/gateway/config-channels)を参照してください。
Slack、Discord、Telegram、WhatsApp、Matrix、iMessage、そのほかの
バンドル済みチャンネル（認証、アクセス制御、マルチアカウント、メンションゲート）を含みます。

## エージェントのデフォルト、マルチエージェント、セッション、メッセージ

専用ページに移動しました — 次については
[Configuration — agents](/ja-JP/gateway/config-agents)を参照してください:

- `agents.defaults.*`（workspace、model、thinking、heartbeat、memory、media、Skills、sandbox）
- `multiAgent.*`（マルチエージェントのルーティングとバインディング）
- `session.*`（セッションライフサイクル、Compaction、pruning）
- `messages.*`（メッセージ配信、TTS、Markdownレンダリング）
- `talk.*`（Talkモード）
  - `talk.silenceTimeoutMs`: 未設定の場合、Talkは文字起こしを送信する前にプラットフォームのデフォルトの無音待機時間を維持します（`macOSとAndroidでは700 ms、iOSでは900 ms`）

## ツールとカスタムプロバイダー

ツールポリシー、実験的トグル、プロバイダーバックのツール設定、およびカスタム
プロバイダー / base-URL設定は専用ページに移動しました —
[Configuration — tools and custom providers](/ja-JP/gateway/config-tools)を参照してください。

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

- `allowBundled`: バンドル済みSkills専用の任意の許可リストです（managed/workspace Skillsには影響しません）。
- `load.extraDirs`: 追加の共有Skillsルート（最も低い優先順位）。
- `install.preferBrew`: `true`の場合、`brew`が利用可能なら、他のインストーラー種別にフォールバックする前にHomebrewインストーラーを優先します。
- `install.nodeManager`: `metadata.openclaw.install`
  仕様向けのNodeインストーラー優先設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` は、そのSkillがバンドル済み/インストール済みであっても無効にします。
- `entries.<skillKey>.apiKey`: 主たる環境変数を宣言するSkill向けの簡易設定です（平文文字列またはSecretRefオブジェクト）。

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

- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および`plugins.load.paths`からロードされます。
- 検出では、ネイティブOpenClaw Pluginに加え、互換性のあるCodexバンドルとClaudeバンドルも受け入れます。manifestのないClaudeデフォルトレイアウトバンドルも含みます。
- **設定変更にはGatewayの再起動が必要です。**
- `allow`: 任意の許可リストです（一覧にあるPluginのみロードされます）。`deny`が優先されます。
- `plugins.entries.<id>.apiKey`: PluginレベルのAPIキー簡易フィールドです（Pluginがサポートしている場合）。
- `plugins.entries.<id>.env`: Pluginスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false`の場合、コアは`before_prompt_build`をブロックし、legacy `before_agent_start`からのprompt変更フィールドを無視します。一方で、legacy `modelOverride`と`providerOverride`は維持します。ネイティブPlugin hookと、サポート対象のバンドル提供hookディレクトリに適用されます。
- `plugins.entries.<id>.subagent.allowModelOverride`: このPluginがバックグラウンドsubagent実行時に実行ごとの`provider`および`model`の上書きを要求することを明示的に信頼します。
- `plugins.entries.<id>.subagent.allowedModels`: 信頼済みsubagent上書き向けの、canonicalな`provider/model`ターゲットの任意の許可リストです。任意のモデルを許可したい意図がある場合にのみ`"*"`を使ってください。
- `plugins.entries.<id>.config`: Plugin定義の設定オブジェクトです（利用可能な場合はネイティブOpenClaw Pluginスキーマで検証されます）。
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetchプロバイダー設定。
  - `apiKey`: Firecrawl APIキー（SecretRefを受け付けます）。`plugins.entries.firecrawl.config.webSearch.apiKey`、legacy `tools.web.fetch.firecrawl.apiKey`、または`FIRECRAWL_API_KEY`環境変数にフォールバックします。
  - `baseUrl`: Firecrawl APIベースURL（デフォルト: `https://api.firecrawl.dev`）。
  - `onlyMainContent`: ページから本文のみを抽出します（デフォルト: `true`）。
  - `maxAgeMs`: 最大キャッシュ保存期間（ミリ秒）（デフォルト: `172800000` / 2日）。
  - `timeoutSeconds`: スクレイプリクエストのタイムアウト（秒）（デフォルト: `60`）。
- `plugins.entries.xai.config.xSearch`: xAI X Search（Grok web search）設定。
  - `enabled`: X Searchプロバイダーを有効化します。
  - `model`: 検索に使用するGrokモデル（例: `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`: メモリDreaming設定。フェーズとしきい値については[Dreaming](/ja-JP/concepts/dreaming)を参照してください。
  - `enabled`: Dreamingのマスタースイッチ（デフォルト `false`）。
  - `frequency`: 各フルDreamingスイープのCron間隔（デフォルトは`"0 3 * * *"`）。
  - フェーズポリシーとしきい値は実装詳細です（ユーザー向け設定キーではありません）。
- 完全なメモリ設定は[Memory configuration reference](/ja-JP/reference/memory-config)にあります:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 有効化されたClaudeバンドルPluginは、`settings.json`から埋め込みPiデフォルトを提供することもできます。OpenClawはそれらを未加工のOpenClaw設定パッチとしてではなく、サニタイズ済みのエージェント設定として適用します。
- `plugins.slots.memory`: 有効なメモリPlugin idを選択します。メモリPluginを無効化するには`"none"`を指定します。
- `plugins.slots.contextEngine`: 有効なcontext engine Plugin idを選択します。別のengineをインストールして選択しない限り、デフォルトは`"legacy"`です。
- `plugins.installs`: `openclaw plugins update`で使用されるCLI管理のインストールメタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`を含みます。
  - `plugins.installs.*`は管理状態として扱ってください。手動編集よりCLIコマンドを優先してください。

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

- `evaluateEnabled: false` は`act:evaluate`と`wait --fn`を無効化します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`は未設定時には無効なので、browserナビゲーションはデフォルトで厳格なままです。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`は、private-networkへのbrowserナビゲーションを意図的に信頼する場合にのみ設定してください。
- strict modeでは、リモートCDPプロファイルエンドポイント（`profiles.*.cdpUrl`）も到達性/検出チェック時に同じprivate-networkブロックの対象になります。
- `ssrfPolicy.allowPrivateNetwork`はlegacy aliasとして引き続きサポートされます。
- strict modeでは、明示的な例外に`ssrfPolicy.hostnameAllowlist`および`ssrfPolicy.allowedHostnames`を使用します。
- リモートプロファイルはattach-onlyです（start/stop/resetは無効）。
- `profiles.*.cdpUrl`は`http://`、`https://`、`ws://`、`wss://`を受け付けます。
  OpenClawに`/json/version`を検出させたい場合はHTTP(S)を使用し、
  プロバイダーが直接のDevTools WebSocket URLを提供する場合はWS(S)を使用してください。
- `existing-session`プロファイルはCDPの代わりにChrome MCPを使用し、
  選択したホスト上または接続済みbrowser node経由でアタッチできます。
- `existing-session`プロファイルでは、特定の
  Chromiumベースbrowserプロファイル（BraveやEdgeなど）を対象にするために`userDataDir`を設定できます。
- `existing-session`プロファイルは、現在のChrome MCPルート制限を維持します:
  CSSセレクター指定ではなくsnapshot/ref駆動のアクション、単一ファイルアップロード
  hook、dialog timeout overrideなし、`wait --load networkidle`なし、さらに
  `responsebody`、PDFエクスポート、ダウンロードインターセプト、バッチアクションもありません。
- ローカル管理の`openclaw`プロファイルは`cdpPort`と`cdpUrl`を自動割り当てします。`cdpUrl`はリモートCDPの場合にのみ明示的に設定してください。
- 自動検出順: デフォルトbrowserがChromiumベースならそれ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- Controlサービス: loopbackのみ（ポートは`gateway.port`から導出、デフォルトは`18791`）。
- `extraArgs`は、ローカルChromium起動に追加の起動フラグを付加します（たとえば
  `--disable-gpu`、ウィンドウサイズ指定、デバッグフラグなど）。

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

- `seamColor`: ネイティブアプリUIクロームのアクセントカラーです（Talk Modeのバブル色など）。
- `assistant`: Control UIのIDオーバーライドです。有効なエージェントIDにフォールバックします。

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
    // 任意。デフォルトは false。
    allowRealIpFallback: false,
    tools: {
      // /tools/invoke HTTP に対する追加の deny
      deny: ["browser"],
      // デフォルトの HTTP deny リストからツールを削除
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

- `mode`: `local`（Gatewayを実行）または`remote`（リモートGatewayに接続）。`local`でない限りGatewayは起動を拒否します。
- `port`: WS + HTTP用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（デフォルト）、`lan`（`0.0.0.0`）、`tailnet`（Tailscale IPのみ）、または`custom`。
- **legacy bind alias**: `gateway.bind`ではホストalias（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）ではなく、bind mode値（`auto`、`loopback`、`lan`、`tailnet`、`custom`）を使用してください。
- **Dockerに関する注意**: デフォルトの`loopback` bindはコンテナ内の`127.0.0.1`で待ち受けます。Docker bridgeネットワーク（`-p 18789:18789`）では、トラフィックは`eth0`に到着するため、Gatewayには到達できません。`--network host`を使うか、すべてのインターフェースで待ち受けるように`bind: "lan"`（または`customBindHost: "0.0.0.0"`を使った`bind: "custom"`）を設定してください。
- **認証**: デフォルトで必須です。非loopback bindではGateway認証が必要です。実際には、共有token/password、または`gateway.auth.mode: "trusted-proxy"`を使用するID認識リバースプロキシを意味します。オンボーディングのウィザードではデフォルトでtokenが生成されます。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されている場合（SecretRefを含む）は、`gateway.auth.mode`を`token`または`password`に明示設定してください。両方が設定されていてmodeが未設定の場合、起動およびサービスのインストール/修復フローは失敗します。
- `gateway.auth.mode: "none"`: 明示的な認証なしモードです。信頼できるlocal loopbackセットアップでのみ使用してください。これはオンボーディングプロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: 認証をID認識リバースプロキシに委譲し、`gateway.trustedProxies`からのIDヘッダーを信頼します（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照）。このモードは**非loopback**のプロキシソースを前提としています。同一ホストのloopbackリバースプロキシはtrusted-proxy認証の条件を満たしません。
- `gateway.auth.allowTailscale`: `true`の場合、Tailscale ServeのIDヘッダーでControl UI/WebSocket認証を満たせます（`tailscale whois`で検証）。HTTP APIエンドポイントはこのTailscaleヘッダー認証を使用しません。代わりにGatewayの通常のHTTP認証モードに従います。このtoken不要フローは、Gatewayホストが信頼されていることを前提とします。`tailscale.mode = "serve"`のときのデフォルトは`true`です。
- `gateway.auth.rateLimit`: 任意の認証失敗リミッター。クライアントIPごと、および認証スコープごとに適用されます（共有シークレットとdevice-tokenは独立して追跡されます）。ブロックされた試行は`429` + `Retry-After`を返します。
  - 非同期のTailscale Serve Control UIパスでは、同じ`{scope, clientIp}`に対する失敗試行は、失敗書き込み前に直列化されます。そのため、同一クライアントからの同時の不正試行は、両方が単なる不一致として競合通過するのではなく、2回目のリクエストでリミッターに達することがあります。
  - `gateway.auth.rateLimit.exemptLoopback`のデフォルトは`true`です。localhostトラフィックにも意図的にレート制限を適用したい場合（テストセットアップや厳格なプロキシ配置など）は`false`に設定してください。
- browser起点のWS認証試行は常に、loopback除外を無効にした状態でスロットリングされます（browserベースのlocalhost総当たり攻撃に対する多層防御）。
- loopback上では、これらのbrowser起点ロックアウトは正規化された`Origin`
  値ごとに分離されるため、あるlocalhost originからの失敗が繰り返されても、
  別のoriginが自動的にロックアウトされることはありません。
- `tailscale.mode`: `serve`（tailnetのみ、loopback bind）または`funnel`（公開、認証必須）。
- `controlUi.allowedOrigins`: Gateway WebSocket接続の明示的なbrowser-origin許可リストです。非loopback originからのbrowserクライアントを想定する場合に必須です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Hostヘッダーoriginポリシーに意図的に依存するデプロイ向けに、Hostヘッダーoriginフォールバックを有効にする危険なモードです。
- `remote.transport`: `ssh`（デフォルト）または`direct`（ws/wss）。`direct`では、`remote.url`は`ws://`または`wss://`である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: クライアント側プロセス環境変数の
  非常用オーバーライドで、信頼できるprivate-network IPへの平文`ws://`を許可します。
  デフォルトでは、平文はloopback専用のままです。これに対応する`openclaw.json`
  の設定はなく、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`のような
  browser private-network設定もGateway WebSocketクライアントには影響しません。
- `gateway.remote.token` / `.password`はリモートクライアントの認証情報フィールドです。これ自体ではGateway認証は設定されません。
- `gateway.push.apns.relay.baseUrl`: 公式/TestFlight iOSビルドがrelayバックの登録をGatewayに公開した後に使用する、外部APNs relayのベースHTTPS URL。このURLはiOSビルドにコンパイルされたrelay URLと一致している必要があります。
- `gateway.push.apns.relay.timeoutMs`: Gatewayからrelayへの送信タイムアウト（ミリ秒）。デフォルトは`10000`です。
- relayバック登録は、特定のGateway IDに委譲されます。ペアリング済みiOSアプリは`gateway.identity.get`を取得し、そのIDをrelay登録に含め、登録スコープの送信許可をGatewayに転送します。別のGatewayはその保存済み登録を再利用できません。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上記relay設定に対する一時的な環境変数オーバーライドです。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL用の開発専用エスケープハッチです。本番のrelay URLはHTTPSのままにしてください。
- `gateway.channelHealthCheckMinutes`: チャンネルhealth-monitor間隔（分）。グローバルにhealth-monitor再起動を無効にするには`0`を設定します。デフォルト: `5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socketしきい値（分）。これは`gateway.channelHealthCheckMinutes`以上にしてください。デフォルト: `30`。
- `gateway.channelMaxRestartsPerHour`: ローリング1時間あたりのチャンネル/アカウントごとのhealth-monitor再起動最大回数。デフォルト: `10`。
- `channels.<provider>.healthMonitor.enabled`: グローバルmonitorを有効のまま保ちながら、health-monitor再起動をチャンネル単位でオプトアウトします。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: マルチアカウントチャンネル用のアカウント単位上書きです。設定されている場合、チャンネルレベルの上書きより優先されます。
- ローカルGateway呼び出しパスは、`gateway.auth.*`が未設定の場合に限り`gateway.remote.*`をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示設定され、未解決の場合、解決はクローズドフェイルします（リモートフォールバックによるマスキングはありません）。
- `trustedProxies`: TLSを終端する、または転送クライアントヘッダーを注入するリバースプロキシのIPです。自分が管理するプロキシだけを列挙してください。loopbackエントリは、同一ホストのプロキシ/ローカル検出セットアップ（たとえばTailscale Serveやローカルリバースプロキシ）では依然として有効ですが、loopbackリクエストが`gateway.auth.mode: "trusted-proxy"`の対象になるわけではありません。
- `allowRealIpFallback`: `true`の場合、`X-Forwarded-For`がないときにGatewayは`X-Real-IP`を受け入れます。クローズドフェイル動作のため、デフォルトは`false`です。
- `gateway.tools.deny`: HTTP `POST /tools/invoke`で追加的にブロックするツール名（デフォルトdenyリストを拡張）。
- `gateway.tools.allow`: デフォルトのHTTP denyリストからツール名を削除します。

</Accordion>

### OpenAI互換エンドポイント

- Chat Completions: デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true`で有効化します。
- Responses API: `gateway.http.endpoints.responses.enabled`。
- Responses URL入力のハードニング:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空の許可リストは未設定として扱われます。URLフェッチを無効化するには、
    `gateway.http.endpoints.responses.files.allowUrl=false`
    および/または`gateway.http.endpoints.responses.images.allowUrl=false`を使用してください。
- 任意のresponseハードニングヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity`（自分が管理するHTTPS originに対してのみ設定してください。詳細は[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth#tls-termination-and-hsts)を参照）

### マルチインスタンス分離

1台のホストで複数のGatewayを実行するには、ポートとstateディレクトリを一意にします:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev`（`~/.openclaw-dev` + ポート`19001`を使用）、`--profile <name>`（`~/.openclaw-<name>`を使用）。

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

- `enabled`: GatewayリスナーでTLS終端（HTTPS/WSS）を有効にします（デフォルト: `false`）。
- `autoGenerate`: 明示的なファイルが設定されていない場合に、ローカル自己署名証明書/鍵ペアを自動生成します。ローカル/開発用途専用です。
- `certPath`: TLS証明書ファイルのファイルシステムパス。
- `keyPath`: TLS秘密鍵ファイルのファイルシステムパス。権限制限を維持してください。
- `caPath`: クライアント検証またはカスタム信頼チェーン用の任意のCAバンドルパス。

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

- `mode`: 実行時に設定編集をどのように適用するかを制御します。
  - `"off"`: ライブ編集を無視します。変更には明示的な再起動が必要です。
  - `"restart"`: 設定変更時に常にGatewayプロセスを再起動します。
  - `"hot"`: 再起動せずにプロセス内で変更を適用します。
  - `"hybrid"`（デフォルト）: まずホットリロードを試し、必要に応じて再起動にフォールバックします。
- `debounceMs`: 設定変更を適用する前のデバウンス時間（ms）（0以上の整数）。
- `deferralTimeoutMs`: 進行中の操作を待ってから再起動を強制するまでの最大時間（ms）（デフォルト: `300000` = 5分）。

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
クエリ文字列のhook tokenは拒否されます。

バリデーションと安全性に関する注意:

- `hooks.enabled=true` には空でない `hooks.token` が必要です。
- `hooks.token` は `gateway.auth.token` と**異なる**必要があります。Gateway tokenの再利用は拒否されます。
- `hooks.path` は `/` にできません。`/hooks` のような専用のサブパスを使用してください。
- `hooks.allowRequestSessionKey=true` の場合は、`hooks.allowedSessionKeyPrefixes` を制限してください（例: `["hook:"]`）。
- マッピングまたはプリセットでテンプレート化された `sessionKey` を使う場合は、`hooks.allowedSessionKeyPrefixes` を設定し、`hooks.allowRequestSessionKey=true` を設定してください。静的なマッピングキーにはこのオプトインは不要です。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードの `sessionKey` は `hooks.allowRequestSessionKey=true` の場合にのみ受け付けられます（デフォルト: `false`）。
- `POST /hooks/<name>` → `hooks.mappings` 経由で解決
  - テンプレート展開されたマッピング `sessionKey` 値は外部提供として扱われ、これにも `hooks.allowRequestSessionKey=true` が必要です。

<Accordion title="マッピングの詳細">

- `match.path` は `/hooks` の後ろのサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source` は汎用パス向けにペイロードフィールドに一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取ります。
- `transform` はhook actionを返すJS/TSモジュールを指せます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内にとどまります（絶対パスとトラバーサルは拒否されます）。
- `agentId` は特定のagentにルーティングします。不明なIDはデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的ルーティングを制限します（`*` または省略 = すべて許可、`[]` = すべて拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` がないhook agent実行向けの任意の固定session key。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元と、テンプレート駆動のマッピングsession keyに `sessionKey` の設定を許可します（デフォルト: `false`）。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値（リクエスト + マッピング）向けの任意のプレフィックス許可リストです。例: `["hook:"]`。いずれかのマッピングまたはプリセットがテンプレート化された `sessionKey` を使う場合は必須になります。
- `deliver: true` は最終返信をチャンネルに送信します。`channel` のデフォルトは `last` です。
- `model` はこのhook実行のLLMを上書きします（モデルカタログが設定されている場合は許可されている必要があります）。

</Accordion>

### Gmail連携

- 組み込みのGmailプリセットは `sessionKey: "hook:gmail:{{messages[0].id}}"` を使用します。
- そのメッセージ単位ルーティングを維持する場合は、`hooks.allowRequestSessionKey: true` を設定し、`hooks.allowedSessionKeyPrefixes` をGmail名前空間に一致するよう制限してください。たとえば `["hook:", "hook:gmail:"]` です。
- `hooks.allowRequestSessionKey: false` が必要な場合は、テンプレート化されたデフォルトの代わりに静的な `sessionKey` でプリセットを上書きしてください。

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

- 設定済みの場合、Gatewayは起動時に `gog gmail watch serve` を自動起動します。無効化するには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
- Gatewayと並行して別の `gog gmail watch serve` を実行しないでください。

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

- agentが編集可能なHTML/CSS/JSとA2UIを、Gatewayポート配下のHTTPで配信します:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカル専用: `gateway.bind: "loopback"`（デフォルト）を維持してください。
- 非loopback bind: canvasルートでは、他のGateway HTTPサーフェスと同様にGateway認証（token/password/trusted-proxy）が必要です。
- Node WebViewは通常認証ヘッダーを送信しません。nodeがペアリングされて接続されると、Gatewayはcanvas/A2UIアクセス用のnodeスコープcapability URLを通知します。
- capability URLはアクティブなnode WSセッションに結び付けられ、有効期限は短くなっています。IPベースのフォールバックは使用されません。
- 配信されるHTMLにlive-reloadクライアントを注入します。
- 空の場合はスターター `index.html` を自動作成します。
- A2UIも `/__openclaw__/a2ui/` で配信します。
- 変更にはGatewayの再起動が必要です。
- ディレクトリが大きい場合や `EMFILE` エラーが出る場合はlive reloadを無効にしてください。

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（デフォルト）: TXTレコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含めます。
- ホスト名のデフォルトは `openclaw` です。`OPENCLAW_MDNS_HOSTNAME` で上書きできます。

### 広域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャストDNS-SDゾーンを書き込みます。ネットワーク間Discoveryを行うには、DNSサーバー（CoreDNS推奨）+ Tailscale split DNSと組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env`（インライン環境変数）

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

- インライン環境変数は、プロセス環境変数にそのキーがない場合にのみ適用されます。
- `.env` ファイル: CWDの `.env` + `~/.openclaw/.env`（どちらも既存の変数を上書きしません）。
- `shellEnv`: ログインshell profileから、必要な不足キーを取り込みます。
- 完全な優先順位については[Environment](/ja-JP/help/environment)を参照してください。

### 環境変数置換

任意の設定文字列で、`${VAR_NAME}` を使って環境変数を参照できます:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 一致するのは大文字名のみです: `[A-Z_][A-Z0-9_]*`。
- 変数が存在しない、または空の場合は、設定読み込み時にエラーになります。
- リテラルな `${VAR}` にするには `$${VAR}` でエスケープしてください。
- `$include` でも機能します。

---

## Secrets

SecretRefは追加的です。平文値も引き続き使用できます。

### `SecretRef`

1つのオブジェクト形状を使用します:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

バリデーション:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` のidパターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` のid: 絶対JSONポインター（例: `"/providers/openai/apiKey"`）
- `source: "exec"` のidパターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` のidには、`.` または `..` のスラッシュ区切りパスセグメントを含めてはいけません（例: `a/../b` は拒否されます）

### サポートされる認証情報サーフェス

- 正式なマトリクス: [SecretRef Credential Surface](/ja-JP/reference/secretref-credential-surface)
- `secrets apply` は、サポートされる `openclaw.json` 認証情報パスを対象にします。
- `auth-profiles.json` のrefは、実行時の解決と監査対象にも含まれます。

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

- `file` providerは `mode: "json"` と `mode: "singleValue"` をサポートします（singleValueモードでは `id` は `"value"` でなければなりません）。
- Fileおよびexec providerのパスは、Windows ACL検証が利用できない場合、クローズドフェイルします。検証できないが信頼できるパスに対してのみ `allowInsecurePath: true` を設定してください。
- `exec` providerには絶対 `command` パスが必要で、stdin/stdout上でプロトコルペイロードを使用します。
- デフォルトでは、シンボリックリンクのcommandパスは拒否されます。解決後ターゲットパスを検証しつつシンボリックリンクパスを許可するには `allowSymlinkCommand: true` を設定してください。
- `trustedDirs` が設定されている場合、trusted-dirチェックは解決後ターゲットパスに適用されます。
- `exec` 子環境はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- Secret refは有効化時にメモリ内スナップショットへ解決され、その後リクエストパスはそのスナップショットのみを読み取ります。
- 有効サーフェスフィルタリングは有効化中に適用されます: 有効なサーフェス上の未解決refは起動/リロードを失敗させ、一方で非アクティブなサーフェスは診断付きでスキップされます。

---

## 認証ストレージ

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

- エージェントごとのプロファイルは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は、静的認証情報モード向けに値レベルref（`api_key` 用の `keyRef`、`token` 用の `tokenRef`）をサポートします。
- OAuthモードのプロファイル（`auth.profiles.<id>.mode = "oauth"`）は、SecretRefバックのauth-profile認証情報をサポートしません。
- 静的な実行時認証情報は、解決済みのメモリ内スナップショットから取得されます。legacyの静的 `auth.json` エントリは見つかると削除されます。
- legacy OAuthは `~/.openclaw/credentials/oauth.json` からインポートされます。
- [OAuth](/ja-JP/concepts/oauth)を参照してください。
- Secretsの実行時動作と `audit/configure/apply` ツール: [Secrets Management](/ja-JP/gateway/secrets)。

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

- `billingBackoffHours`: 真の
  billing/insufficient-creditエラーによってプロファイルが失敗した場合の、時間単位の基本バックオフです（デフォルト: `5`）。明示的なbilling文言は
  `401`/`403`レスポンスでも引き続きここに入ることがありますが、プロバイダー固有のテキスト
  マッチャーは、それを所有するプロバイダーの範囲内に限定されます（たとえばOpenRouterの
  `Key limit exceeded`）。再試行可能なHTTP `402` のusage-windowまたは
  organization/workspace spend-limitメッセージは、代わりに `rate_limit` パスに残ります。
- `billingBackoffHoursByProvider`: billingバックオフ時間に対する任意のプロバイダー単位上書き。
- `billingMaxHours`: billingバックオフの指数的増加に対する上限時間です（デフォルト: `24`）。
- `authPermanentBackoffMinutes`: 高信頼の `auth_permanent` 失敗に対する、分単位の基本バックオフです（デフォルト: `10`）。
- `authPermanentMaxMinutes`: `auth_permanent` バックオフ増加に対する上限分数です（デフォルト: `60`）。
- `failureWindowHours`: バックオフカウンターに使用する、時間単位のローリングウィンドウです（デフォルト: `24`）。
- `overloadedProfileRotations`: overloadedエラーに対して、modelフォールバックに切り替える前に許可する同一プロバイダーauth-profileローテーションの最大数です（デフォルト: `1`）。`ModelNotReadyException` のようなprovider-busy形状はここに入ります。
- `overloadedBackoffMs`: overloadedなprovider/profileローテーションを再試行する前の固定遅延です（デフォルト: `0`）。
- `rateLimitedProfileRotations`: rate-limitエラーに対して、modelフォールバックに切り替える前に許可する同一プロバイダーauth-profileローテーションの最大数です（デフォルト: `1`）。そのrate-limitバケットには、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted` のようなプロバイダー形状の文言が含まれます。

---

## ロギング

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
- `--verbose` の場合、`consoleLevel` は `debug` になります。
- `maxFileBytes`: 書き込みを抑止する前のログファイル最大サイズ（バイト単位）（正の整数。デフォルト: `524288000` = 500 MB）。本番デプロイでは外部のログローテーションを使用してください。

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

- `enabled`: インストルメンテーション出力のマスタートグルです（デフォルト: `true`）。
- `flags`: 対象を絞ったログ出力を有効にするフラグ文字列の配列です（`"telegram.*"` や `"*"` のようなワイルドカードをサポート）。
- `stuckSessionWarnMs`: セッションが処理中状態のままである間に、stuck-session警告を出す経過時間しきい値（ms）。
- `otel.enabled`: OpenTelemetryエクスポートパイプラインを有効にします（デフォルト: `false`）。
- `otel.endpoint`: OTelエクスポート用のcollector URL。
- `otel.protocol`: `"http/protobuf"`（デフォルト）または `"grpc"`。
- `otel.headers`: OTelエクスポートリクエストとともに送信される追加のHTTP/gRPCメタデータヘッダー。
- `otel.serviceName`: リソース属性用のサービス名。
- `otel.traces` / `otel.metrics` / `otel.logs`: トレース、メトリクス、またはログのエクスポートを有効にします。
- `otel.sampleRate`: トレースサンプリング率 `0`–`1`。
- `otel.flushIntervalMs`: 定期的なテレメトリフラッシュ間隔（ms）。
- `cacheTrace.enabled`: 埋め込み実行のcache traceスナップショットをログに記録します（デフォルト: `false`）。
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

- `channel`: npm/gitインストール向けのリリースチャネル — `"stable"`、`"beta"`、または `"dev"`。
- `checkOnStart`: Gateway起動時にnpm更新を確認します（デフォルト: `true`）。
- `auto.enabled`: パッケージインストール向けのバックグラウンド自動更新を有効にします（デフォルト: `false`）。
- `auto.stableDelayHours`: stableチャネルで自動適用する前の最小遅延時間です（デフォルト: `6`; 最大: `168`）。
- `auto.stableJitterHours`: stableチャネルの追加ロールアウト分散時間です（デフォルト: `12`; 最大: `168`）。
- `auto.betaCheckIntervalHours`: betaチャネルの確認を実行する頻度（時間単位）です（デフォルト: `1`; 最大: `24`）。

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
- `dispatch.enabled`: ACPセッションターンディスパッチ用の独立したゲートです（デフォルト: `true`）。ACPコマンドを利用可能なまま実行をブロックするには `false` を設定してください。
- `backend`: デフォルトのACPランタイムbackend idです（登録済みACPランタイムPluginと一致する必要があります）。
- `defaultAgent`: spawnが明示的なターゲットを指定しない場合のフォールバックACPターゲットagent id。
- `allowedAgents`: ACPランタイムセッションに許可されるagent idの許可リストです。空は追加制限なしを意味します。
- `maxConcurrentSessions`: 同時にアクティブにできるACPセッションの最大数。
- `stream.coalesceIdleMs`: ストリーミングテキスト用のアイドルフラッシュ時間（ms）。
- `stream.maxChunkChars`: ストリーミングされたブロック投影を分割する前の最大チャンクサイズ。
- `stream.repeatSuppression`: ターンごとの重複したステータス/ツール行を抑制します（デフォルト: `true`）。
- `stream.deliveryMode`: `"live"` は増分でストリームし、`"final_only"` はターン終端イベントまでバッファします。
- `stream.hiddenBoundarySeparator`: 非表示ツールイベント後、可視テキストの前に入れる区切り文字です（デフォルト: `"paragraph"`）。
- `stream.maxOutputChars`: ACPターンごとに投影されるassistant出力文字数の最大値。
- `stream.maxSessionUpdateChars`: 投影されるACPステータス/更新行の最大文字数。
- `stream.tagVisibility`: ストリーミングイベント用の、タグ名から真偽値の可視性上書きへの記録。
- `runtime.ttlMinutes`: クリーンアップ対象になるまでのACPセッションワーカーのアイドルTTL（分）。
- `runtime.installCommand`: ACPランタイム環境のブートストラップ時に実行する任意のインストールコマンド。

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
  - `"random"`（デフォルト）: ローテーションする面白い/季節限定タグライン。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）。
  - `"off"`: タグラインテキストなし（バナーのタイトル/バージョンは引き続き表示）。
- バナー全体を非表示にするには（タグラインだけでなく）、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定してください。

---

## ウィザード

CLIガイド付きセットアップフロー（`onboard`、`configure`、`doctor`）によって書き込まれるメタデータ:

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

[Agent defaults](/ja-JP/gateway/config-agents#agent-defaults) の `agents.list` identityフィールドを参照してください。

---

## Bridge（legacy、削除済み）

現在のビルドにはTCP bridgeは含まれていません。NodeはGateway WebSocket経由で接続します。`bridge.*` キーはもはや設定スキーマの一部ではありません（削除するまでバリデーションは失敗します。`openclaw doctor --fix` で不明なキーを取り除けます）。

<Accordion title="legacy bridge設定（履歴参照）">

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

- `sessionRetention`: 完了済みの分離されたCron実行セッションを `sessions.json` からpruneする前にどれだけ保持するか。アーカイブ済みの削除されたCron transcriptのクリーンアップも制御します。デフォルト: `24h`。無効にするには `false` を設定してください。
- `runLog.maxBytes`: prune前の実行ログファイルごとの最大サイズ（`cron/runs/<jobId>.jsonl`）。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログのpruneが発生したときに保持される最新行数。デフォルト: `2000`。
- `webhookToken`: Cron Webhook POST配信（`delivery.mode = "webhook"`）に使うbearer tokenです。省略時は認証ヘッダーは送信されません。
- `webhook`: 非推奨のlegacyフォールバックWebhook URL（http/https）で、保存済みジョブのうち `notify: true` が残っているものにのみ使用されます。

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

- `maxAttempts`: 一時的エラーに対するワンショットジョブの最大再試行回数です（デフォルト: `3`; 範囲: `0`–`10`）。
- `backoffMs`: 各再試行時のバックオフ遅延の配列（ms）（デフォルト: `[30000, 60000, 300000]`; 1〜10要素）。
- `retryOn`: 再試行を引き起こすエラー種別 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略するとすべての一時的種別を再試行します。

ワンショットCronジョブにのみ適用されます。定期ジョブでは別の失敗処理を使います。

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

- `enabled`: Cronジョブの失敗アラートを有効にします（デフォルト: `false`）。
- `after`: アラート発火までの連続失敗回数（正の整数、最小: `1`）。
- `cooldownMs`: 同一ジョブに対する繰り返しアラートの最小間隔（ミリ秒）（0以上の整数）。
- `mode`: 配信モード — `"announce"` はチャンネルメッセージで送信し、`"webhook"` は設定済みWebhookへPOSTします。
- `accountId`: アラート配信のスコープを決める任意のアカウントまたはチャンネルid。

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

- すべてのジョブに共通するCron失敗通知のデフォルト宛先です。
- `mode`: `"announce"` または `"webhook"`。十分なターゲットデータがある場合のデフォルトは `"announce"` です。
- `channel`: announce配信用のチャンネル上書き。`"last"` は最後にわかっている配信チャンネルを再利用します。
- `to`: 明示的なannounceターゲットまたはWebhook URL。Webhookモードでは必須です。
- `accountId`: 配信用の任意のアカウント上書き。
- ジョブごとの `delivery.failureDestination` はこのグローバルデフォルトを上書きします。
- グローバルにもジョブごとにも失敗宛先が設定されていない場合、すでに `announce` で配信しているジョブは、失敗時にそのプライマリannounceターゲットへフォールバックします。
- `delivery.failureDestination` は、ジョブのプライマリ `delivery.mode` が `"webhook"` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

[Cron Jobs](/ja-JP/automation/cron-jobs)を参照してください。分離されたCron実行は、[background tasks](/ja-JP/automation/tasks)として追跡されます。

---

## メディアモデルのテンプレート変数

`tools.media.models[].args` で展開されるテンプレートプレースホルダー:

| Variable           | 説明 |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完全な受信メッセージ本文 |
| `{{RawBody}}`      | 生の本文（履歴/送信者ラッパーなし） |
| `{{BodyStripped}}` | グループメンションを除去した本文 |
| `{{From}}`         | 送信者識別子 |
| `{{To}}`           | 宛先識別子 |
| `{{MessageSid}}`   | チャンネルメッセージid |
| `{{SessionId}}`    | 現在のセッションUUID |
| `{{IsNewSession}}` | 新しいセッションが作成されたときは `"true"` |
| `{{MediaUrl}}`     | 受信メディア擬似URL |
| `{{MediaPath}}`    | ローカルメディアパス |
| `{{MediaType}}`    | メディア種別（image/audio/document/…） |
| `{{Transcript}}`   | 音声文字起こし |
| `{{Prompt}}`       | CLIエントリ用に解決されたメディアプロンプト |
| `{{MaxChars}}`     | CLIエントリ用に解決された最大出力文字数 |
| `{{ChatType}}`     | `"direct"` または `"group"` |
| `{{GroupSubject}}` | グループ件名（ベストエフォート） |
| `{{GroupMembers}}` | グループメンバープレビュー（ベストエフォート） |
| `{{SenderName}}`   | 送信者表示名（ベストエフォート） |
| `{{SenderE164}}`   | 送信者電話番号（ベストエフォート） |
| `{{Provider}}`     | プロバイダーヒント（whatsapp、telegram、discordなど） |

---

## 設定include（`$include`）

設定を複数ファイルに分割できます:

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
- ファイル配列: 順にディープマージされます（後のものが前のものを上書き）。
- siblingキー: include後にマージされます（includeされた値を上書き）。
- ネストしたinclude: 最大10レベル。
- パス: include元ファイルからの相対で解決されますが、トップレベル設定ディレクトリ（`openclaw.json` の `dirname`）内に収まる必要があります。絶対パスや`../`形式も、その境界内に解決される場合にのみ許可されます。
- 単一ファイルincludeに支えられた1つのトップレベルセクションだけを変更するOpenClaw所有の書き込みは、そのinclude先ファイルへ書き込みます。たとえば、`plugins install` は `plugins: { $include: "./plugins.json5" }` を `plugins.json5` 内で更新し、`openclaw.json` はそのままにします。
- ルートinclude、include配列、sibling上書きを伴うincludeは、OpenClaw所有の書き込みに対して読み取り専用です。これらの書き込みは設定をフラット化せず、クローズドフェイルします。
- エラー: ファイル欠如、パースエラー、循環includeに対して明確なメッセージを返します。

---

_関連: [Configuration](/ja-JP/gateway/configuration) · [Configuration Examples](/ja-JP/gateway/configuration-examples) · [Doctor](/ja-JP/gateway/doctor)_

## 関連

- [Configuration](/ja-JP/gateway/configuration)
- [Configuration examples](/ja-JP/gateway/configuration-examples)
