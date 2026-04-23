---
read_when:
    - エージェント制御のbrowser自動化の追加
    - openclawが自分のChromeに干渉している理由のデバッグ
    - macOSアプリでbrowser設定とライフサイクルを実装する
summary: 統合browser control service + アクションコマンド
title: Browser（OpenClaw管理）
x-i18n:
    generated_at: "2026-04-23T04:51:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Browser（openclaw管理）

OpenClawは、エージェントが制御する**専用のChrome/Brave/Edge/Chromiumプロファイル**を実行できます。
これは個人用ブラウザーから分離されており、Gateway内の小さなローカル
control service（loopbackのみ）を通じて管理されます。

初心者向けの見方:

- これは**別の、エージェント専用ブラウザー**だと考えてください。
- `openclaw` プロファイルは**あなたの個人用ブラウザープロファイルには触れません**。
- エージェントは安全なレーンで**タブを開き、ページを読み、クリックし、入力**できます。
- 組み込みの `user` プロファイルは、Chrome MCP経由であなたの実際のサインイン済みChromeセッションに接続します。

## 得られるもの

- **openclaw** という名前の独立したブラウザープロファイル（デフォルトではオレンジのアクセント）
- 決定的なタブ制御（一覧/開く/フォーカス/閉じる）
- エージェント操作（クリック/入力/ドラッグ/選択）、スナップショット、スクリーンショット、PDF
- 任意のマルチプロファイル対応（`openclaw`、`work`、`remote`、...）

このブラウザーは**日常利用向けではありません**。これはエージェント自動化と検証のための、安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示される場合は、設定で有効にし（下記参照）、Gatewayを再起動してください。

`openclaw browser` 自体が存在しない場合、またはエージェントがbrowser toolを利用できないと言う場合は、[Missing browser command or tool](/ja-JP/tools/browser#missing-browser-command-or-tool) に進んでください。

## Plugin制御

デフォルトの `browser` toolは、現在デフォルト有効で配布されるバンドルPluginです。
つまり、OpenClawの残りのPluginシステムを削除せずに、これを無効化または置き換えできます。

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

同じ `browser` tool名を提供する別のPluginをインストールする前に、バンドルPluginを無効にしてください。デフォルトのbrowser体験には次の両方が必要です。

- `plugins.entries.browser.enabled` が無効化されていないこと
- `browser.enabled=true`

Pluginだけをオフにすると、バンドルbrowser CLI（`openclaw browser`）、
gatewayメソッド（`browser.request`）、エージェントtool、およびデフォルトbrowser control serviceがまとめて消えます。`browser.*` 設定は、置き換えPluginが再利用できるよう、そのまま残ります。

バンドルbrowser Pluginは、現在ではbrowserランタイム実装も所有しています。
coreには共有Plugin SDKヘルパーと、古い内部importパス向けの互換re-exportしか残っていません。実際には、browser Pluginパッケージを削除または置き換えると、browser機能セット全体がなくなり、core所有の第2ランタイムが残ることはありません。

browser設定の変更には、バンドルPluginが新しい設定でbrowser serviceを再登録できるよう、引き続きGatewayの再起動が必要です。

## browserコマンドまたはtoolが見つからない

アップグレード後に `openclaw browser` が突然unknown commandになった場合、またはエージェントがbrowser toolがないと報告する場合、最も一般的な原因は、`browser` を含まない制限付き `plugins.allow` リストです。

壊れている設定の例:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

修正するには、Plugin許可リストに `browser` を追加してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

重要な注意:

- `plugins.allow` が設定されているとき、`browser.enabled=true` だけでは不十分です。
- `plugins.allow` が設定されているとき、`plugins.entries.browser.enabled=true` だけでも不十分です。
- `tools.alsoAllow: ["browser"]` はバンドルbrowser Pluginを読み込みません。これはPluginがすでに読み込まれた後にtoolポリシーを調整するだけです。
- 制限付きPlugin許可リストが不要なら、`plugins.allow` を削除することでもデフォルトのバンドルbrowser挙動が復元されます。

典型的な症状:

- `openclaw browser` がunknown commandになる。
- `browser.request` が存在しない。
- エージェントがbrowser toolを利用不可または欠如として報告する。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理対象で分離されたブラウザー（拡張不要）
- `user`: あなたの**実際のサインイン済みChrome** セッション向け組み込みChrome MCP接続プロファイル

エージェントbrowser tool呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザーを使います。
- 既存のログイン済みセッションが重要で、ユーザーがコンピューターの前にいて接続/承認プロンプトをクリックできる場合は、`profile="user"` を優先してください。
- `profile` は、特定のbrowserモードを使いたいときの明示的な上書きです。

デフォルトで管理モードを使いたい場合は、`browser.defaultProfile: "openclaw"` を設定してください。

## 設定

browser設定は `~/.openclaw/openclaw.json` にあります。

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

注意:

- browser control serviceは、`gateway.port` から導出されるポートのloopbackにバインドされます
  （デフォルト: `18791`、つまりgateway + 2）。
- Gatewayポート（`gateway.port` または `OPENCLAW_GATEWAY_PORT`）を上書きすると、
  導出されるbrowserポートも同じ「ファミリー」に収まるようにずれます。
- `cdpUrl` は、未設定なら管理対象ローカルCDPポートがデフォルトになります。
- `remoteCdpTimeoutMs` は、リモート（非loopback）CDP到達可能性チェックに適用されます。
- `remoteCdpHandshakeTimeoutMs` は、リモートCDP WebSocket到達可能性チェックに適用されます。
- browser navigation/open-tab は、遷移前にSSRFガードされ、遷移後の最終 `http(s)` URLでもベストエフォートで再チェックされます。
- strict SSRFモードでは、リモートCDPエンドポイントの検出/プローブ（`cdpUrl`、`/json/version` 参照を含む）もチェック対象です。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトで無効です。意図的に信頼するプライベートネットワークbrowserアクセスが必要な場合にのみ `true` にしてください。
- `browser.ssrfPolicy.allowPrivateNetwork` は、互換性のためのレガシーエイリアスとして引き続きサポートされます。
- `attachOnly: true` は「ローカルbrowserは決して起動せず、すでに動作中であれば接続だけする」という意味です。
- `color` とプロファイルごとの `color` はbrowser UIを着色し、どのプロファイルがアクティブか見分けられるようにします。
- デフォルトプロファイルは `openclaw`（OpenClaw管理のスタンドアロンbrowser）です。サインイン済みユーザーbrowserを使うには `defaultProfile: "user"` を使ってください。
- 自動検出順序: システムデフォルトbrowserがChromium系ならそれを使い、そうでなければ Chrome → Brave → Edge → Chromium → Chrome Canary。
- ローカル `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。これらはリモートCDP用にのみ設定してください。
- `driver: "existing-session"` は、生のCDPではなくChrome DevTools MCPを使います。この
  driverには `cdpUrl` を設定しないでください。
- 既存セッションプロファイルをBraveやEdgeのような非デフォルトChromiumユーザープロファイルに接続させたい場合は、`browser.profiles.<name>.userDataDir` を設定してください。

## Brave（または別のChromium系ブラウザー）を使う

**システムデフォルト** のbrowserがChromium系（Chrome/Brave/Edgeなど）の場合、
OpenClawはそれを自動的に使います。自動検出を上書きするには
`browser.executablePath` を設定してください。

CLI例:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gatewayがloopback control serviceを起動し、ローカルbrowserを起動できます。
- **リモート制御（node host）:** browserを持つマシン上でnode hostを実行すると、Gatewayがbrowser操作をそこへプロキシします。
- **リモートCDP:** `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定して、
  リモートのChromium系browserへ接続します。この場合、OpenClawはローカルbrowserを起動しません。

停止動作はプロファイルモードによって異なります。

- ローカル管理プロファイル: `openclaw browser stop` は
  OpenClawが起動したbrowserプロセスを停止します
- attach-onlyおよびリモートCDPプロファイル: `openclaw browser stop` はアクティブな
  control sessionを閉じ、Playwright/CDPエミュレーション上書き（viewport、
  color scheme、locale、timezone、offline modeなどの状態）を解放します。
  これは、OpenClawがbrowserプロセスを起動していない場合でも行われます

リモートCDP URLには認証を含められます。

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic認証（例: `https://user:pass@provider.example`）

OpenClawは、`/json/*` エンドポイント呼び出し時およびCDP WebSocket接続時に
この認証を保持します。トークンは設定ファイルへコミットするのではなく、
環境変数またはシークレットマネージャーを使うことを推奨します。

## Node browserプロキシ（ゼロ設定デフォルト）

browserを持つマシンで **node host** を実行している場合、OpenClawは
追加のbrowser設定なしでbrowser tool呼び出しをそのnodeへ自動ルーティングできます。
これはリモートGateway向けのデフォルト経路です。

注意:

- node hostは、ローカルbrowser control serverを**プロキシコマンド**として公開します。
- プロファイルはnode自身の `browser.profiles` 設定から取得されます（ローカルと同じ）。
- `nodeHost.browserProxy.allowProfiles` は任意です。legacy/default挙動のままにするには空のままにしてください: 設定済みの全プロファイルが、プロファイル作成/削除ルートを含めてプロキシ経由で到達可能のままになります。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClawはこれを最小権限境界として扱います: 許可リストにあるプロファイルのみをターゲットにでき、永続プロファイルの作成/削除ルートはプロキシサーフェス上でブロックされます。
- 不要なら無効化できます:
  - node側: `nodeHost.browserProxy.enabled=false`
  - gateway側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型リモートCDP）

[Browserless](https://browserless.io) は、HTTPSおよびWebSocket経由で
CDP接続URLを公開するホスト型Chromiumサービスです。OpenClawはどちらの形式も使えますが、
リモートbrowserプロファイルでは、最も簡単なのはBrowserlessの接続ドキュメントにある
直接WebSocket URLです。

例:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

注意:

- `<BROWSERLESS_API_KEY>` は実際のBrowserlessトークンに置き換えてください。
- Browserlessアカウントに対応するリージョンエンドポイントを選んでください（詳細はBrowserlessのドキュメントを参照）。
- BrowserlessからHTTPSベースURLが渡される場合は、それを直接CDP接続用に
  `wss://` へ変換するか、HTTPS URLのままにしてOpenClawに
  `/json/version` を検出させることができます。

## 直接WebSocket CDPプロバイダー

一部のホスト型browserサービスは、標準のHTTPベースCDP検出（`/json/version`）ではなく、
**直接WebSocket** エンドポイントを公開します。OpenClawは3つの
CDP URL形式を受け入れ、自動的に適切な接続戦略を選びます:

- **HTTP(S)検出** — `http://host[:port]` または `https://host[:port]`。
  OpenClawは `/json/version` を呼び出してWebSocket debugger URLを検出し、その後
  接続します。WebSocketへのフォールバックはありません。
- **直接WebSocketエンドポイント** — `ws://host[:port]/devtools/<kind>/<id>` または
  `wss://...` で、`/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  パスを持つもの。OpenClawはWebSocketハンドシェイクで直接接続し、
  `/json/version` を完全にスキップします。
- **ベアWebSocketルート** — `ws://host[:port]` または `wss://host[:port]` で
  `/devtools/...` パスを持たないもの（例: [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClawはまずHTTP
  `/json/version` 検出を試み（スキームを `http`/`https` に正規化）、
  検出結果が `webSocketDebuggerUrl` を返した場合はそれを使います。そうでなければOpenClawは
  ベアルートへの直接WebSocketハンドシェイクへフォールバックします。これにより、
  Chrome形式のリモートデバッグポートとWebSocket専用プロバイダーの両方をカバーします。

`/devtools/...` パスなしの単純な `ws://host:port` / `wss://host:port` を
ローカルChromeインスタンスへ向けることも、検出優先フォールバックによってサポートされます。
Chromeは `/json/version` が返すブラウザー単位またはターゲット単位の特定パスでのみ
WebSocketアップグレードを受け付けるため、ベアルートへのハンドシェイクだけでは
失敗します。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みのCAPTCHA解決、ステルスモード、および住宅プロキシを備えた
ヘッドレスブラウザー実行用のクラウドプラットフォームです。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

注意:

- [サインアップ](https://www.browserbase.com/sign-up) して、[Overview dashboard](https://www.browserbase.com/overview) から **API Key**
  を取得してください。
- `<BROWSERBASE_API_KEY>` は実際のBrowserbase APIキーに置き換えてください。
- BrowserbaseはWebSocket接続時に自動でbrowserセッションを作成するため、
  手動のセッション作成手順は不要です。
- 無料枠では、同時セッション1つ、月あたりbrowser利用時間1時間までです。
  有料プランの制限については [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全なAPI
  リファレンス、SDKガイド、および統合例については [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

主要な考え方:

- browser制御はloopback専用です。アクセスはGatewayの認証またはnodeペアリングを通ります。
- スタンドアロンのloopback browser HTTP APIは、**shared-secret認証のみ** を使用します:
  gatewayトークンのBearer認証、`x-openclaw-password`、または
  設定済みgatewayパスワードを使うHTTP Basic認証です。
- Tailscale ServeのIDヘッダーと `gateway.auth.mode: "trusted-proxy"` は、
  このスタンドアロンloopback browser APIの認証には**使われません**。
- browser制御が有効で、shared-secret認証が設定されていない場合、OpenClawは
  起動時に `gateway.auth.token` を自動生成し、設定へ永続化します。
- `gateway.auth.mode` がすでに `password`、`none`、または `trusted-proxy` の場合、
  OpenClawはそのトークンを自動生成しません。
- Gatewayおよびnode hostはプライベートネットワーク（Tailscale）上に置き、
  公開しないでください。
- リモートCDP URL/トークンはシークレットとして扱い、環境変数またはシークレットマネージャーを使ってください。

リモートCDPのヒント:

- 可能であれば、暗号化されたエンドポイント（HTTPSまたはWSS）と短命トークンを使ってください。
- 長寿命トークンを設定ファイルへ直接埋め込むのは避けてください。

## プロファイル（マルチブラウザー）

OpenClawは複数の名前付きプロファイル（ルーティング設定）をサポートします。プロファイルは次のいずれかです。

- **openclaw管理**: 独自のユーザーデータディレクトリ + CDPポートを持つ、専用のChromium系browserインスタンス
- **remote**: 明示的なCDP URL（別の場所で実行中のChromium系browser）
- **既存セッション**: Chrome DevTools MCP自動接続経由の既存Chromeプロファイル

デフォルト:

- `openclaw` プロファイルは、存在しなければ自動作成されます。
- `user` プロファイルは、Chrome MCPのexisting-session接続用として組み込まれています。
- existing-sessionプロファイルは `user` 以外では明示的オプトインです。`--driver existing-session` で作成してください。
- ローカルCDPポートはデフォルトで **18800–18899** の範囲から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリはTrashへ移動されます。

すべてのcontrolエンドポイントは `?profile=<name>` を受け付け、CLIでは `--browser-profile` を使います。

## Chrome DevTools MCP経由のexisting-session

OpenClawは、公式Chrome DevTools MCPサーバーを通じて、実行中のChromium系browserプロファイルに接続することもできます。これにより、そのbrowserプロファイルですでに開かれているタブとログイン状態を再利用できます。

公式の背景説明とセットアップ参考資料:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

任意: 別の名前、色、またはbrowserデータディレクトリを使いたい場合は、
独自のcustom existing-sessionプロファイルを作成できます。

デフォルト挙動:

- 組み込みの `user` プロファイルはChrome MCP auto-connectを使い、
  デフォルトのローカルGoogle Chromeプロファイルを対象にします。

Brave、Edge、Chromium、または非デフォルトのChromeプロファイルには、`userDataDir` を使ってください。

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

次に、対応するbrowserで次を行います。

1. そのbrowserのremote debugging用inspectページを開く。
2. remote debuggingを有効にする。
3. browserを起動したままにし、OpenClawが接続したときの接続プロンプトを承認する。

主なinspectページ:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

ライブ接続スモークテスト:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功時の見え方:

- `status` に `driver: existing-session` が表示される
- `status` に `transport: chrome-mcp` が表示される
- `status` に `running: true` が表示される
- `tabs` に、すでに開いているbrowserタブが一覧表示される
- `snapshot` が、選択されたライブタブからrefを返す

接続できない場合の確認点:

- 対象のChromium系browserがバージョン `144+` である
- そのbrowserのinspectページでremote debuggingが有効になっている
- browserが接続同意プロンプトを表示し、それを承認した
- `openclaw doctor` は古い拡張ベースbrowser設定を移行し、デフォルトauto-connectプロファイル用に
  Chromeがローカルにインストールされているかを確認できますが、browser側のremote debuggingを有効にすることはできません

エージェント利用:

- ユーザーのログイン済みbrowser状態が必要な場合は `profile="user"` を使ってください。
- custom existing-sessionプロファイルを使う場合は、その明示的なプロファイル名を渡してください。
- このモードは、ユーザーがコンピューターの前にいて接続
  プロンプトを承認できる場合にのみ選んでください。
- Gatewayまたはnode hostは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注意:

- この経路は、サインイン済みbrowserセッション内で動作できるため、分離された `openclaw` プロファイルより高リスクです。
- OpenClawはこのdriver用にbrowserを起動しません。existing sessionにのみ接続します。
- OpenClawはここで公式Chrome DevTools MCPの `--autoConnect` フローを使います。`userDataDir` が設定されている場合、
  OpenClawはそれを渡して、その明示的なChromiumユーザーデータディレクトリを対象にします。
- existing-sessionのスクリーンショットは、ページキャプチャと、スナップショットからの `--ref` 要素キャプチャはサポートしますが、CSS `--element` セレクターはサポートしません。
- existing-sessionのページスクリーンショットは、PlaywrightなしでChrome MCP経由で動作します。
  refベースの要素スクリーンショット（`--ref`）も動作しますが、`--full-page`
  は `--ref` または `--element` と組み合わせられません。
- existing-sessionの操作は、管理対象browser経路より依然として制限があります:
  - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` には
    CSSセレクターではなくスナップショットrefが必要
  - `click` は左ボタンのみ（ボタン上書きや修飾キーなし）
  - `type` は `slowly=true` をサポートしない。`fill` または `press` を使用する
  - `press` は `delayMs` をサポートしない
  - `hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は
    呼び出しごとのtimeout上書きをサポートしない
  - `select` は現在1つの値のみサポート
- existing-sessionの `wait --url` は、他のbrowser driverと同様に完全一致、部分一致、globパターンをサポートします。`wait --load networkidle` はまだ未対応です。
- existing-sessionのアップロードフックは `ref` または `inputRef` が必要で、1回に1ファイルだけをサポートし、CSS `element` ターゲット指定はサポートしません。
- existing-sessionのdialogフックはtimeout上書きをサポートしません。
- 一部の機能は依然として管理対象browser経路が必要です。これには、バッチ
  操作、PDFエクスポート、ダウンロードインターセプト、および `responsebody` が含まれます。
- existing-sessionは、選択されたホスト上、または接続されたbrowser node経由で接続できます。Chromeが別の場所にあり、browser nodeが接続されていない場合は、
  代わりにremote CDPまたはnode hostを使ってください。

## 分離保証

- **専用ユーザーデータディレクトリ**: あなたの個人用browserプロファイルには決して触れません。
- **専用ポート**: 開発ワークフローとの衝突を防ぐため、`9222` を避けます。
- **決定的なタブ制御**: 「最後のタブ」ではなく、`targetId` でタブを対象指定します。

## ブラウザー選択

ローカル起動時、OpenClawは最初に見つかったものを使います。

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `google-chrome`、`brave`、`microsoft-edge`、`chromium` などを探します。
- Windows: 一般的なインストール場所を確認します。

## Control API（任意）

ローカル統合専用として、Gatewayは小さなloopback HTTP APIを公開します。

- Status/start/stop: `GET /`、`POST /start`、`POST /stop`
- Tabs: `GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`、`POST /screenshot`
- Actions: `POST /navigate`、`POST /act`
- Hooks: `POST /hooks/file-chooser`、`POST /hooks/dialog`
- Downloads: `POST /download`、`POST /wait/download`
- Debugging: `GET /console`、`POST /pdf`
- Debugging: `GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- Network: `POST /response/body`
- State: `GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- State: `GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- Settings: `POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

すべてのエンドポイントは `?profile=<name>` を受け付けます。

shared-secret gateway認証が設定されている場合、browser HTTPルートにも認証が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` または、そのパスワードを使うHTTP Basic認証

注意:

- このスタンドアロンloopback browser APIは、trusted-proxy や
  Tailscale ServeのIDヘッダーを消費しません。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合、これらのloopback browser
  ルートはそのようなIDベースモードを継承しません。loopback専用のままにしてください。

### `/act` のエラー契約

`POST /act` は、ルートレベルのバリデーションおよび
ポリシー失敗に対して、構造化エラーレスポンスを使います。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED`（HTTP 400）: `kind` が欠落しているか未認識。
- `ACT_INVALID_REQUEST`（HTTP 400）: アクションペイロードの正規化またはバリデーションに失敗した。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）: 未対応のアクション種別で `selector` が使われた。
- `ACT_EVALUATE_DISABLED`（HTTP 403）: `evaluate`（または `wait --fn`）が設定で無効化されている。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）: トップレベルまたはバッチ化された `targetId` がリクエスト対象と競合している。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）: このアクションはexisting-sessionプロファイルではサポートされていない。

その他のランタイム失敗では、`code` フィールドなしで
`{ "error": "<message>" }` が返ることもあります。

### Playwright要件

一部の機能（navigate/act/AI snapshot/role snapshot、要素スクリーンショット、
PDF）にはPlaywrightが必要です。Playwrightがインストールされていない場合、
これらのエンドポイントは明確な501エラーを返します。

Playwrightなしでも動作するもの:

- ARIAスナップショット
- 管理対象 `openclaw` browserで、タブごとのCDP
  WebSocketが利用可能な場合のページスクリーンショット
- `existing-session` / Chrome MCPプロファイル向けのページスクリーンショット
- スナップショット出力からの `existing-session` のrefベーススクリーンショット（`--ref`）

引き続きPlaywrightが必要なもの:

- `navigate`
- `act`
- AIスナップショット / roleスナップショット
- CSSセレクターによる要素スクリーンショット（`--element`）
- browser全体のPDFエクスポート

要素スクリーンショットでは `--full-page` も拒否されます。ルートは
`fullPage is not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` と表示される場合は、
`playwright-core` がインストールされるようにバンドルbrowser Pluginのランタイム依存関係を修復し、その後gatewayを再起動してください。パッケージ版インストールでは、`openclaw doctor --fix` を実行してください。Dockerでは、以下に示すようにChromium browserバイナリもインストールしてください。

#### Docker Playwrightインストール

GatewayがDocker内で動作している場合、`npx playwright` は避けてください（npm overrideの競合があります）。
代わりにバンドルCLIを使ってください。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

browserダウンロードを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（たとえば
`/home/node/.cache/ms-playwright`）を設定し、`/home/node` が
`OPENCLAW_HOME_VOLUME` またはbind mountを通じて永続化されるようにしてください。[Docker](/ja-JP/install/docker) を参照してください。

## 仕組み（内部）

高レベルな流れ:

- 小さな **control server** がHTTPリクエストを受け付けます。
- **CDP** を使ってChromium系browser（Chrome/Brave/Edge/Chromium）に接続します。
- 高度な操作（クリック/入力/スナップショット/PDF）には、CDPの上に **Playwright** を使います。
- Playwrightがない場合、Playwright非依存の操作だけが利用可能です。

この設計により、エージェントは安定した決定的インターフェース上に保たれたまま、
ローカル/リモートbrowserやプロファイルを入れ替えられます。

## CLIクイックリファレンス

すべてのコマンドは、特定のプロファイルを対象にするために `--browser-profile <name>` を受け付けます。
すべてのコマンドは、機械可読出力（安定ペイロード）のために `--json` も受け付けます。

基本:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

検査:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

ライフサイクルに関する注意:

- attach-onlyおよびリモートCDPプロファイルでは、テスト後の正しい
  クリーンアップコマンドは依然として `openclaw browser stop` です。これは基盤の
  browserを終了する代わりに、アクティブなcontrol sessionを閉じ、一時的な
  エミュレーション上書きをクリアします。
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

アクション:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

状態:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

注意:

- `upload` と `dialog` は**事前待機**の呼び出しです。file chooser/dialogを発生させる
  click/press の前に実行してください。
- ダウンロードとtraceの出力パスは、OpenClaw tempルートに制限されています:
  - traces: `/tmp/openclaw`（フォールバック: `${os.tmpdir()}/openclaw`）
  - downloads: `/tmp/openclaw/downloads`（フォールバック: `${os.tmpdir()}/openclaw/downloads`）
- アップロードパスは、OpenClaw temp uploadsルートに制限されています:
  - uploads: `/tmp/openclaw/uploads`（フォールバック: `${os.tmpdir()}/openclaw/uploads`）
- `upload` は、`--input-ref` または `--element` により、file inputを直接設定することもできます。
- `snapshot`:
  - `--format ai`（Playwrightインストール時のデフォルト）: 数値refを持つAIスナップショットを返します（`aria-ref="<n>"`）。
  - `--format aria`: アクセシビリティツリーを返します（refなし。検査専用）。
  - `--efficient`（または `--mode efficient`）: compactなrole snapshotプリセット（interactive + compact + depth + 低めのmaxChars）。
  - 設定デフォルト（tool/CLIのみ）: 呼び出し元がmodeを渡さないときにefficient snapshotsを使うには、`browser.snapshotDefaults.mode: "efficient"` を設定してください（[Gateway configuration](/ja-JP/gateway/configuration-reference#browser) を参照）。
  - Role snapshotオプション（`--interactive`、`--compact`、`--depth`、`--selector`）は、`ref=e12` のようなrefを持つroleベースsnapshotを強制します。
  - `--frame "<iframe selector>"` は、role snapshotsをiframeにスコープします（`e12` のようなrole refと組み合わせます）。
  - `--interactive` は、操作可能要素の平坦で選びやすい一覧を出力します（アクション駆動に最適）。
  - `--labels` は、重ね描きされたrefラベル付きのビューポート限定スクリーンショットを追加します（`MEDIA:<path>` を出力）。
- `click`/`type`/その他は、`snapshot` からの `ref`（数値 `12` またはrole ref `e12`）が必要です。
  CSSセレクターは意図的にサポートされていません。

## スナップショットとref

OpenClawは2種類の「snapshot」スタイルをサポートします。

- **AI snapshot（数値ref）**: `openclaw browser snapshot`（デフォルト; `--format ai`）
  - 出力: 数値refを含むテキストsnapshot。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部的には、refはPlaywrightの `aria-ref` を通じて解決されます。

- **Role snapshot（`e12` のようなrole ref）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（および任意で `[nth=1]`）を持つroleベースの一覧/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部的には、refは `getByRole(...)`（重複時は `nth()` を併用）で解決されます。
  - `--labels` を追加すると、`e12` ラベルを重ねたビューポートスクリーンショットが含まれます。

refの挙動:

- refは**ナビゲーションをまたいで安定しません**。何か失敗したら、`snapshot` を再実行して新しいrefを使ってください。
- role snapshotを `--frame` 付きで取得した場合、role refsは次のrole snapshotまでそのiframeにスコープされます。

## Waitの強化機能

待機できるのは時間やテキストだけではありません。

- URL待機（Playwrightでサポートされるglob）:
  - `openclaw browser wait --url "**/dash"`
- load state待機:
  - `openclaw browser wait --load networkidle`
- JS述語待機:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが可視になるのを待機:
  - `openclaw browser wait "#main"`

これらは組み合わせられます。

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## デバッグワークフロー

アクションが失敗したとき（例: 「not visible」、「strict mode violation」、「covered」）:

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使う（interactiveモードではrole refを推奨）
3. それでも失敗する場合: `openclaw browser highlight <ref>` で、Playwrightが何を対象にしているか確認する
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深いデバッグにはtraceを記録する:
   - `openclaw browser trace start`
   - 問題を再現する
   - `openclaw browser trace stop`（`TRACE:<path>` を出力）

## JSON出力

`--json` はスクリプトおよび構造化ツール向けです。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON内のrole snapshotsには `refs` に加えて、小さな `stats` ブロック（lines/chars/refs/interactive）が含まれており、ツールがペイロードサイズと密度を推論できます。

## 状態と環境のノブ

これらは「サイトをXのように振る舞わせる」ワークフローで役立ちます。

- Cookies: `cookies`、`cookies set`、`cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'`（レガシーの `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP basic認証: `set credentials user pass`（または `--clear`）
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`、`set locale ...`
- Device / viewport:
  - `set device "iPhone 14"`（Playwright device presets）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw browserプロファイルにはログイン済みセッションが含まれることがあるため、機密として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn`
  は、ページコンテキストで任意のJavaScriptを実行します。プロンプトインジェクションで
  これが誘導されることがあります。不要なら `browser.evaluateEnabled=false` で無効にしてください。
- ログインやアンチボットに関する注意（X/Twitterなど）については、[Browser login + X/Twitter posting](/ja-JP/tools/browser-login) を参照してください。
- Gateway/node hostはプライベートに保ってください（loopbackまたはtailnet専用）。
- リモートCDPエンドポイントは強力です。トンネルし、保護してください。

strict-modeの例（デフォルトでprivate/internal宛先をブロック）:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## トラブルシューティング

Linux固有の問題（特にsnap Chromium）については、
[Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chromeの分離ホスト構成については、
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP起動失敗とナビゲーションSSRFブロック

これらは異なる種類の失敗であり、異なるコード経路を示します。

- **CDP起動またはready状態の失敗** は、OpenClawがbrowser control planeの健全性を確認できないことを意味します。
- **ナビゲーションSSRFブロック** は、browser control plane自体は健全だが、ページ遷移先がポリシーで拒否されたことを意味します。

よくある例:

- CDP起動またはready状態の失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- ナビゲーションSSRFブロック:
  - `start` と `tabs` は動作するのに、`open`、`navigate`、snapshot、またはタブを開くフローがbrowser/network policyエラーで失敗する

この最小シーケンスを使うと、両者を切り分けられます。

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合は、まずCDP ready状態をトラブルシュートしてください。
- `start` は成功しても `tabs` が失敗する場合、control planeは依然として不健全です。これはページナビゲーションの問題ではなく、CDP到達性の問題として扱ってください。
- `start` と `tabs` が成功していて、`open` または `navigate` だけが失敗する場合、browser control planeは起動済みであり、失敗原因はナビゲーションポリシーまたは対象ページにあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的な管理対象browser制御経路は健全です。

重要な挙動の詳細:

- `browser.ssrfPolicy` を設定していなくても、browser設定はデフォルトでfail-closedなSSRF policyオブジェクトになります。
- ローカルloopbackの `openclaw` 管理対象プロファイルでは、CDP健全性チェックは、OpenClaw自身のローカルcontrol planeに対するbrowser SSRF到達性強制を意図的にスキップします。
- ナビゲーション保護は別です。`start` や `tabs` が成功しても、後続の `open` または `navigate` ターゲットが許可されていることは意味しません。

セキュリティ指針:

- デフォルトでbrowser SSRF policyを緩めないでください。
- 広いprivate-networkアクセスよりも、`hostnameAllowlist` や `allowedHostnames` のような狭いホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、private-network browserアクセスが必要で、意図的に信頼され、レビュー済みの環境でのみ使ってください。

例: ナビゲーションはブロックされるが、control planeは健全

- `start` は成功する
- `tabs` は成功する
- `open http://internal.example` は失敗する

これは通常、browser起動自体は正常で、ナビゲーション先がポリシーレビューを必要としていることを意味します。

例: ナビゲーション以前に起動がブロックされている

- `start` が `not reachable after start` で失敗する
- `tabs` も失敗する、または実行できない

これは、ページURL許可リストの問題ではなく、browser起動またはCDP到達性を示しています。

## エージェントtoolと制御の仕組み

エージェントはbrowser自動化用に**1つのtool**を取得します。

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定したUIツリー（AIまたはARIA）を返します。
- `browser act` は、そのsnapshotの `ref` IDを使ってclick/type/drag/selectを行います。
- `browser screenshot` はピクセルをキャプチャします（全ページまたは要素）。
- `browser` は次を受け付けます:
  - `profile` で名前付きbrowserプロファイル（openclaw、chrome、またはremote CDP）を選ぶ。
  - `target`（`sandbox` | `host` | `node`）でbrowserが存在する場所を選ぶ。
  - sandbox化されたセッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要。
  - `target` を省略した場合: sandbox化されたセッションではデフォルトで `sandbox`、非sandboxセッションではデフォルトで `host`。
  - browser対応nodeが接続されている場合、`target="host"` または `target="node"` で固定しない限り、toolはそこへ自動ルーティングされることがあります。

これにより、エージェントは決定的に動作し、壊れやすいセレクターを避けられます。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントtool
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox環境でのbrowser制御
- [Security](/ja-JP/gateway/security) — browser制御のリスクとハードニング
