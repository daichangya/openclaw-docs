---
read_when:
    - エージェント制御のブラウザ自動化を追加する
    - openclawが自分のChromeに干渉している理由をデバッグする
    - macOSアプリでブラウザ設定とライフサイクルを実装する
summary: 統合ブラウザ制御サービス + アクションコマンド
title: ブラウザ（OpenClaw管理）
x-i18n:
    generated_at: "2026-04-20T04:47:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f7d37b34ba48dc7c38f8c2e77f8bb97af987eac6a874ebfc921f950fb59de4b
    source_path: tools/browser.md
    workflow: 15
---

# ブラウザ（openclaw管理）

OpenClawは、エージェントが制御する**専用のChrome/Brave/Edge/Chromiumプロファイル**を実行できます。
これは個人用ブラウザから分離されており、Gateway内の小さなローカル
制御サービス（loopbackのみ）を通じて管理されます。

初心者向けの見方:

- これは**エージェント専用の別ブラウザ**だと考えてください。
- `openclaw` プロファイルは、個人用ブラウザプロファイルには**触れません**。
- エージェントは安全なレーンで**タブを開き、ページを読み、クリックし、入力**できます。
- 組み込みの `user` プロファイルは、Chrome MCP経由で実際にサインイン済みのChromeセッションに接続します。

## 得られるもの

- **openclaw** という名前の別ブラウザプロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（一覧/開く/フォーカス/閉じる）。
- エージェントアクション（クリック/入力/ドラッグ/選択）、スナップショット、スクリーンショット、PDF。
- 任意のマルチプロファイル対応（`openclaw`、`work`、`remote`、...）。

このブラウザは日常使いのブラウザ**ではありません**。これは
エージェント自動化と検証のための、安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示された場合は、configで有効化して（下記参照）、Gatewayを
再起動してください。

`openclaw browser` 自体が存在しない場合、またはエージェントがブラウザツール
を利用できないと言う場合は、[Missing browser command or tool](/ja-JP/tools/browser#missing-browser-command-or-tool)に進んでください。

## Plugin制御

デフォルトの `browser` ツールは現在、デフォルトで有効な状態で同梱されるbundled pluginです。
つまり、OpenClawの残りのpluginシステムを削除しなくても、
これを無効化または置き換えできます。

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

同じ `browser` ツール名を提供する別のpluginをインストールする前に、
同梱pluginを無効にしてください。デフォルトのブラウザ体験には次の両方が必要です。

- `plugins.entries.browser.enabled` が無効になっていないこと
- `browser.enabled=true`

pluginだけをオフにすると、同梱ブラウザCLI（`openclaw browser`）、
gatewayメソッド（`browser.request`）、エージェントツール、およびデフォルトのブラウザ制御
サービスはすべてまとめて消えます。`browser.*` configは、置き換えpluginが再利用できるようにそのまま残ります。

同梱ブラウザpluginは、現在ブラウザruntime実装も所有しています。
coreには、共有のPlugin SDKヘルパーと、古い内部importパス向けの互換
re-exportだけが残ります。実際には、ブラウザplugin packageを削除または置き換えると、
2つ目のcore所有runtimeが残るのではなく、ブラウザ機能セット自体がなくなります。

ブラウザconfigの変更では、同梱pluginが新しい設定でブラウザサービスを再登録できるようにするため、
引き続きGatewayの再起動が必要です。

## ブラウザコマンドまたはツールが見つからない

アップグレード後に `openclaw browser` が突然未知のコマンドになった場合、
またはエージェントがブラウザツールが見つからないと報告する場合、最も一般的な原因は、
`browser` を含まない制限的な `plugins.allow` リストです。

壊れたconfigの例:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

plugin許可リストに `browser` を追加して修正してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

重要な注意点:

- `plugins.allow` が設定されている場合、`browser.enabled=true` だけでは不十分です。
- `plugins.allow` が設定されている場合、`plugins.entries.browser.enabled=true` だけでも不十分です。
- `tools.alsoAllow: ["browser"]` は同梱ブラウザpluginをロード**しません**。これは、pluginがすでにロードされた後にツールポリシーを調整するだけです。
- 制限的なplugin許可リストが不要な場合は、`plugins.allow` を削除してもデフォルトの同梱ブラウザ動作に戻ります。

典型的な症状:

- `openclaw browser` が未知のコマンドになる。
- `browser.request` が存在しない。
- エージェントがブラウザツールを利用不可または未検出として報告する。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理された分離ブラウザ（拡張機能不要）。
- `user`: あなたの**実際にサインイン済みのChrome**セッション用の組み込みChrome MCP接続プロファイル。

エージェントのブラウザツール呼び出しについて:

- デフォルト: 分離された `openclaw` ブラウザを使用します。
- 既存のログイン済みセッションが重要で、ユーザーがコンピューターの前にいて接続プロンプトをクリック/承認できる場合は、`profile="user"` を優先してください。
- `profile` は、特定のブラウザモードを使いたいときの明示的な上書きです。

デフォルトで管理モードを使いたい場合は、`browser.defaultProfile: "openclaw"` を設定してください。

## 設定

ブラウザ設定は `~/.openclaw/openclaw.json` にあります。

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

- ブラウザ制御サービスは、`gateway.port` から派生したポートでloopbackにバインドされます
  （デフォルト: `18791`、gateway + 2）。
- Gatewayポート（`gateway.port` または `OPENCLAW_GATEWAY_PORT`）を上書きすると、
  派生ブラウザポートも同じ「ファミリー」に収まるようにずれます。
- `cdpUrl` は未設定時、管理されたローカルCDPポートがデフォルトになります。
- `remoteCdpTimeoutMs` はremote（non-loopback）CDP到達性チェックに適用されます。
- `remoteCdpHandshakeTimeoutMs` はremote CDP WebSocket到達性チェックに適用されます。
- ブラウザのナビゲーション/タブを開く操作には、ナビゲーション前にSSRFガードがかかり、ナビゲーション後の最終 `http(s)` URL に対してもベストエフォートで再確認されます。
- strict SSRFモードでは、remote CDPエンドポイントの検出/プローブ（`cdpUrl`、`/json/version` 参照を含む）もチェックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトで無効です。private-networkのブラウザアクセスを意図的に信頼する場合にのみ `true` に設定してください。
- `browser.ssrfPolicy.allowPrivateNetwork` は、互換性のために引き続き従来のaliasとしてサポートされます。
- `attachOnly: true` は「ローカルブラウザを決して起動せず、すでに実行中の場合のみ接続する」という意味です。
- `color` とプロファイルごとの `color` はブラウザUIに色を付け、どのプロファイルがアクティブか分かるようにします。
- デフォルトプロファイルは `openclaw`（OpenClaw管理のスタンドアロンブラウザ）です。サインイン済みユーザーブラウザを使うには `defaultProfile: "user"` を使用してください。
- 自動検出順: システムデフォルトブラウザがChromium系ならそれを使用し、そうでなければ Chrome → Brave → Edge → Chromium → Chrome Canary の順です。
- ローカル `openclaw` プロファイルでは `cdpPort`/`cdpUrl` は自動割り当てされるため、それらはremote CDP用にのみ設定してください。
- `driver: "existing-session"` は生のCDPではなくChrome DevTools MCPを使います。この
  driverには `cdpUrl` を設定しないでください。
- 既存セッションプロファイルをBraveやEdgeのようなデフォルト以外のChromiumユーザープロファイルに接続する場合は、`browser.profiles.<name>.userDataDir` を設定してください。

## Brave（または別のChromium系ブラウザ）を使う

**システムデフォルト**ブラウザがChromium系（Chrome/Brave/Edgeなど）の場合、
OpenClawは自動的にそれを使用します。自動検出を上書きするには
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

- **ローカル制御（デフォルト）:** Gatewayがloopback制御サービスを起動し、ローカルブラウザを起動できます。
- **リモート制御（node host）:** ブラウザがあるマシンでnode hostを実行すると、Gatewayがブラウザアクションをそこにプロキシします。
- **Remote CDP:** `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定して、
  remote Chromium系ブラウザに接続します。この場合、OpenClawはローカルブラウザを起動しません。

停止動作はプロファイルモードによって異なります:

- ローカル管理プロファイル: `openclaw browser stop` は、OpenClawが起動したブラウザプロセスを停止します
- attach-onlyおよびremote CDPプロファイル: `openclaw browser stop` は、アクティブな
  制御セッションを閉じ、Playwright/CDPのエミュレーション上書き（ビューポート、
  カラースキーム、ロケール、タイムゾーン、オフラインモード、および類似の状態）を解放します。
  OpenClawがブラウザプロセスを起動していない場合でも同様です

Remote CDP URLには認証を含められます:

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic認証（例: `https://user:pass@provider.example`）

OpenClawは `/json/*` エンドポイント呼び出し時と、CDP WebSocket接続時の両方で
認証情報を保持します。configファイルにコミットするのではなく、
トークンには環境変数またはシークレットマネージャーを使うことを推奨します。

## Node browser proxy（デフォルトのゼロ設定）

ブラウザのあるマシンで**node host**を実行している場合、OpenClawは
追加のブラウザ設定なしで、ブラウザツール呼び出しをそのnodeに自動ルーティングできます。
これはremote gatewayのデフォルト経路です。

注意:

- node hostは、そのローカルブラウザ制御サーバーを**proxy command**経由で公開します。
- プロファイルはnode自身の `browser.profiles` configから取得されます（ローカルと同じ）。
- `nodeHost.browserProxy.allowProfiles` は任意です。従来どおり/デフォルト動作にするには空のままにしてください: 設定済みのすべてのプロファイルが、プロファイル作成/削除ルートを含め、proxy経由で引き続き到達可能です。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClawはそれを最小権限境界として扱います: 許可リストにあるプロファイルのみを対象にでき、永続プロファイルの作成/削除ルートはproxyサーフェスでブロックされます。
- 不要な場合は無効化してください:
  - node側: `nodeHost.browserProxy.enabled=false`
  - gateway側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型remote CDP）

[Browserless](https://browserless.io) は、HTTPSおよびWebSocket経由で
CDP接続URLを公開するホスト型Chromiumサービスです。OpenClawはどちらの形式も使用できますが、
remote browser profileでは、最も簡単な選択肢はBrowserlessの接続ドキュメントにある
直接のWebSocket URLです。

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
- Browserlessアカウントに対応するリージョンエンドポイントを選んでください（詳細はドキュメントを参照）。
- BrowserlessからHTTPSベースURLが提供される場合は、それを
  直接CDP接続用の `wss://` に変換するか、HTTPS URLのままにしてOpenClawに
  `/json/version` を検出させることができます。

## 直接WebSocket CDPプロバイダー

一部のホスト型ブラウザサービスは、標準のHTTPベースCDP検出（`/json/version`）ではなく
**直接WebSocket**エンドポイントを公開します。OpenClawは3つの
CDP URL形式を受け入れ、適切な接続戦略を自動的に選びます:

- **HTTP(S)検出** — `http://host[:port]` または `https://host[:port]`。
  OpenClawは `/json/version` を呼び出してWebSocketデバッガーURLを検出し、その後
  接続します。WebSocketフォールバックはありません。
- **直接WebSocketエンドポイント** — `ws://host[:port]/devtools/<kind>/<id>` または
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>` パス付きの `wss://...`。
  OpenClawはWebSocketハンドシェイクで直接接続し、
  `/json/version` は完全にスキップします。
- **パスなしのWebSocketルート** — `/devtools/...` パスなしの `ws://host[:port]` または `wss://host[:port]`
  （例: [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClawはまずHTTP
  `/json/version` 検出を試み（スキームは `http`/`https` に正規化されます）、
  検出で `webSocketDebuggerUrl` が返された場合はそれを使用し、そうでない場合はOpenClawが
  パスなしルートへの直接WebSocketハンドシェイクにフォールバックします。これにより、
  Chromeスタイルのremote debugポートとWebSocket専用プロバイダーの
  両方をカバーします。

`/devtools/...` パスなしのプレーンな `ws://host:port` / `wss://host:port` を
ローカルChromeインスタンスに向ける使い方は、検出優先の
フォールバックによってサポートされます。Chromeは、`/json/version` が返すブラウザ単位
またはターゲット単位の特定パスでのみWebSocketアップグレードを受け付けるため、
パスなしルートへのハンドシェイク単体では失敗します。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みのCAPTCHA解決、stealth mode、およびresidential
proxyを備えたheadless browser実行用クラウドプラットフォームです。

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

- [Sign up](https://www.browserbase.com/sign-up) して、[Overview dashboard](https://www.browserbase.com/overview)から
  **API Key** をコピーしてください。
- `<BROWSERBASE_API_KEY>` は実際のBrowserbase API keyに置き換えてください。
- BrowserbaseはWebSocket接続時にブラウザセッションを自動作成するため、
  手動のセッション作成手順は不要です。
- 無料プランでは、同時セッション1つ、月あたりブラウザ1時間まで利用できます。
  有料プランの制限については[pricing](https://www.browserbase.com/pricing)を参照してください。
- 完全なAPI
  リファレンス、SDKガイド、統合例については、[Browserbase docs](https://docs.browserbase.com)を参照してください。

## セキュリティ

主な考え方:

- ブラウザ制御はloopback専用です。アクセスはGatewayの認証またはnodeペアリングを通ります。
- スタンドアロンのloopback browser HTTP APIは、**shared-secret authのみ**を使用します:
  gateway token bearer auth、`x-openclaw-password`、または
  設定されたgateway passwordを使うHTTP Basic authです。
- Tailscale Serveのidentity headerおよび `gateway.auth.mode: "trusted-proxy"` は、
  このスタンドアロンloopback browser APIの認証には**使用されません**。
- ブラウザ制御が有効で、shared-secret authが設定されていない場合、OpenClawは
  起動時に `gateway.auth.token` を自動生成し、configに永続化します。
- `gateway.auth.mode` が
  すでに `password`、`none`、または `trusted-proxy` の場合、OpenClawはそのtokenを自動生成**しません**。
- Gatewayおよびすべてのnode hostはプライベートネットワーク（Tailscale）上に置き、公開しないでください。
- Remote CDP URL/tokenはシークレットとして扱い、環境変数またはsecrets managerを優先してください。

Remote CDPのヒント:

- 可能な場合は、暗号化されたエンドポイント（HTTPSまたはWSS）と短寿命トークンを優先してください。
- 長寿命トークンをconfigファイルに直接埋め込まないでください。

## プロファイル（マルチブラウザ）

OpenClawは複数の名前付きプロファイル（ルーティングconfig）をサポートします。プロファイルには次の種類があります。

- **openclaw-managed**: 専用のChromium系ブラウザインスタンス。独自のuser data directory + CDPポートを持ちます
- **remote**: 明示的なCDP URL（別の場所で動作しているChromium系ブラウザ）
- **existing session**: Chrome DevTools MCP自動接続を介した既存のChromeプロファイル

デフォルト:

- `openclaw` プロファイルは、存在しない場合に自動作成されます。
- `user` プロファイルは、Chrome MCP existing-session接続用に組み込まれています。
- existing-sessionプロファイルは `user` 以外ではオプトインです。`--driver existing-session` で作成してください。
- ローカルCDPポートはデフォルトで **18800–18899** から割り当てられます。
- プロファイルを削除すると、そのローカルdata directoryはゴミ箱に移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け付けます。CLIでは `--browser-profile` を使用します。

## Chrome DevTools MCP経由のexisting-session

OpenClawは、公式のChrome DevTools MCPサーバーを通じて、
実行中のChromium系ブラウザプロファイルにも接続できます。これにより、そのブラウザプロファイルですでに
開かれているタブとログイン状態を再利用できます。

公式の背景情報とセットアップ参照先:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

任意: 別の名前、色、またはbrowser data directoryを使いたい場合は、
独自のexisting-sessionプロファイルを作成できます。

デフォルト動作:

- 組み込みの `user` プロファイルはChrome MCP自動接続を使い、
  デフォルトのローカルGoogle Chromeプロファイルを対象にします。

Brave、Edge、Chromium、またはデフォルト以外のChromeプロファイルには `userDataDir` を使用します。

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

その後、対応するブラウザで次の操作を行います。

1. そのブラウザのremote debugging用inspectページを開きます。
2. remote debuggingを有効にします。
3. ブラウザを実行したままにし、OpenClaw接続時に表示される接続確認プロンプトを承認します。

一般的なinspectページ:

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

- `status` に `driver: existing-session` と表示される
- `status` に `transport: chrome-mcp` と表示される
- `status` に `running: true` と表示される
- `tabs` に、すでに開いているブラウザタブが一覧表示される
- `snapshot` が、選択されたライブタブからrefを返す

接続できない場合の確認項目:

- 対象のChromium系ブラウザがバージョン `144+` である
- そのブラウザのinspectページでremote debuggingが有効になっている
- ブラウザが接続確認プロンプトを表示し、それを承認した
- `openclaw doctor` は古い拡張機能ベースのブラウザconfigを移行し、
  デフォルトの自動接続プロファイル向けにChromeがローカルにインストールされているかを確認しますが、
  ブラウザ側のremote debuggingを代わりに有効化することはできません

エージェント利用:

- ユーザーのログイン済みブラウザ状態が必要な場合は `profile="user"` を使ってください。
- カスタムexisting-sessionプロファイルを使う場合は、その明示的なプロファイル名を渡してください。
- このモードは、ユーザーがコンピューターの前にいて接続確認
  プロンプトを承認できるときにのみ選択してください。
- Gatewayまたはnode hostは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注意:

- この経路は、サインイン済みブラウザセッション内で
  動作できるため、分離された `openclaw` プロファイルより高リスクです。
- OpenClawはこのdriver用にブラウザを起動しません。既存の
  セッションにのみ接続します。
- OpenClawはここで公式のChrome DevTools MCP `--autoConnect` フローを使用します。
  `userDataDir` が設定されている場合、OpenClawはそれを渡して、その明示的な
  Chromium user data directoryを対象にします。
- Existing-sessionのスクリーンショットは、ページキャプチャとスナップショットからの `--ref` 要素
  キャプチャをサポートしますが、CSS `--element` セレクターはサポートしません。
- Existing-sessionのページスクリーンショットは、Chrome MCP経由でPlaywrightなしでも動作します。
  refベースの要素スクリーンショット（`--ref`）もそこで動作しますが、`--full-page`
  は `--ref` や `--element` と組み合わせられません。
- Existing-sessionのアクションは、管理ブラウザ
  経路よりも依然として制限があります:
  - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` には、
    CSSセレクターではなくsnapshot refが必要です
  - `click` は左ボタンのみです（ボタン上書きやmodifierは不可）
  - `type` は `slowly=true` をサポートしません。`fill` または `press`
    を使用してください
  - `press` は `delayMs` をサポートしません
  - `hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は、
    呼び出しごとのtimeout上書きをサポートしません
  - `select` は現在、単一の値のみサポートします
- Existing-sessionの `wait --url` は、他のブラウザdriverと同様に完全一致、部分一致、globパターンを
  サポートします。`wait --load networkidle` はまだサポートされていません。
- Existing-sessionのアップロードhookでは `ref` または `inputRef` が必要で、一度に1ファイルのみサポートし、
  CSS `element` ターゲティングはサポートしません。
- Existing-sessionのdialog hookはtimeout上書きをサポートしません。
- バッチ
  アクション、PDFエクスポート、ダウンロードインターセプト、`responsebody` など、一部の機能は依然として管理ブラウザ経路が必要です。
- Existing-sessionは、選択したhost上、または接続された
  browser node経由で接続できます。Chromeが別の場所にあり、browser nodeが接続されていない場合は、
  代わりにremote CDPまたはnode hostを使用してください。

## 分離保証

- **専用user data dir**: 個人用ブラウザプロファイルには一切触れません。
- **専用ポート**: 開発ワークフローとの衝突を避けるため `9222` を回避します。
- **決定的なタブ制御**: 「最後のタブ」ではなく `targetId` でタブを指定します。

## ブラウザ選択

ローカル起動時、OpenClawは最初に利用可能なものを選びます。

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `google-chrome`、`brave`、`microsoft-edge`、`chromium` などを探します。
- Windows: 一般的なインストール先を確認します。

## Control API（任意）

ローカル統合専用として、Gatewayは小さなloopback HTTP APIを公開します。

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Actions: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Network: `POST /response/body`
- State: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- State: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Settings: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

すべてのエンドポイントは `?profile=<name>` を受け付けます。

shared-secret gateway authが設定されている場合、browser HTTPルートにも認証が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはそのpasswordを使うHTTP Basic auth

注意:

- このスタンドアロンloopback browser APIは、trusted-proxyや
  Tailscale Serveのidentity headerを**使用しません**。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合、これらのloopback browser
  ルートはそうしたidentity-bearing modeを継承しません。loopback専用のままにしてください。

### `/act` エラー契約

`POST /act` は、ルートレベルの検証および
ポリシー失敗に対して構造化エラーレスポンスを使用します。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED`（HTTP 400）: `kind` が欠落しているか、認識されません。
- `ACT_INVALID_REQUEST`（HTTP 400）: アクションpayloadの正規化または検証に失敗しました。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）: サポートされていないアクションkindで `selector` が使用されました。
- `ACT_EVALUATE_DISABLED`（HTTP 403）: `evaluate`（または `wait --fn`）はconfigで無効です。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）: トップレベルまたはバッチ化された `targetId` がリクエスト対象と競合しています。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）: existing-sessionプロファイルではそのアクションはサポートされていません。

その他のruntime失敗では、`code` フィールドなしの `{ "error": "<message>" }` が
返ることもあります。

### Playwright要件

一部の機能（navigate/act/AI snapshot/role snapshot、要素スクリーンショット、
PDF）にはPlaywrightが必要です。Playwrightがインストールされていない場合、それらのエンドポイントは
分かりやすい501エラーを返します。

Playwrightなしでも動作するもの:

- ARIAスナップショット
- 管理された `openclaw` ブラウザで、タブごとのCDP
  WebSocketが利用可能な場合のページスクリーンショット
- `existing-session` / Chrome MCPプロファイルのページスクリーンショット
- スナップショット出力からの `existing-session` refベーススクリーンショット（`--ref`）

引き続きPlaywrightが必要なもの:

- `navigate`
- `act`
- AIスナップショット / role snapshot
- CSSセレクター要素スクリーンショット（`--element`）
- ブラウザ全体のPDFエクスポート

要素スクリーンショットでは `--full-page` も拒否されます。ルートは `fullPage is
not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` と表示された場合は、完全な
Playwright package（`playwright-core` ではなく）をインストールしてgatewayを再起動するか、
ブラウザサポート付きでOpenClawを再インストールしてください。

#### DockerでのPlaywrightインストール

GatewayをDockerで実行している場合は、`npx playwright` は使わないでください（npm overrideの競合）。
代わりに、同梱CLIを使います。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ブラウザダウンロードを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（たとえば
`/home/node/.cache/ms-playwright`）を設定し、`/home/node` が
`OPENCLAW_HOME_VOLUME` またはbind mount経由で永続化されるようにしてください。[Docker](/ja-JP/install/docker)を参照してください。

## 仕組み（内部）

高レベルのフロー:

- 小さな**control server**がHTTPリクエストを受け付けます。
- **CDP** 経由でChromium系ブラウザ（Chrome/Brave/Edge/Chromium）に接続します。
- 高度なアクション（クリック/入力/スナップショット/PDF）には、CDPの上に
  **Playwright** を使用します。
- Playwrightがない場合、Playwright非依存の操作のみ利用可能です。

この設計により、ローカル/リモートのブラウザやプロファイルを入れ替えつつ、
エージェント側は安定した決定的インターフェースを維持できます。

## CLIクイックリファレンス

すべてのコマンドは、特定のプロファイルを対象にするために `--browser-profile <name>` を受け付けます。
また、すべてのコマンドは機械可読出力（安定したpayload）のために `--json` も受け付けます。

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

- attach-onlyおよびremote CDPプロファイルでは、テスト後の
  正しいクリーンアップコマンドは引き続き `openclaw browser stop` です。これは、基になる
  ブラウザを終了する代わりに、アクティブな制御セッションを閉じ、
  一時的なエミュレーション上書きをクリアします。
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

- `upload` と `dialog` は**事前待機**の呼び出しです。chooser/dialogを発生させる
  click/pressの前に実行してください。
- ダウンロードおよびtraceの出力パスは、OpenClawの一時ルートに制限されます:
  - traces: `/tmp/openclaw`（フォールバック: `${os.tmpdir()}/openclaw`）
  - downloads: `/tmp/openclaw/downloads`（フォールバック: `${os.tmpdir()}/openclaw/downloads`）
- アップロードパスは、OpenClawの一時uploadsルートに制限されます:
  - uploads: `/tmp/openclaw/uploads`（フォールバック: `${os.tmpdir()}/openclaw/uploads`）
- `upload` は `--input-ref` または `--element` でファイル入力を直接設定することもできます。
- `snapshot`:
  - `--format ai`（Playwrightインストール時のデフォルト）: 数値ref付きのAIスナップショット（`aria-ref="<n>"`）を返します。
  - `--format aria`: アクセシビリティツリーを返します（refなし。検査専用）。
  - `--efficient`（または `--mode efficient`）: compact role snapshotのプリセット（interactive + compact + depth + 低いmaxChars）。
  - Configデフォルト（tool/CLIのみ）: 呼び出し側がmodeを渡さない場合にefficient snapshotsを使うには、`browser.snapshotDefaults.mode: "efficient"` を設定してください（[Gateway configuration](/ja-JP/gateway/configuration-reference#browser)を参照）。
  - Role snapshotオプション（`--interactive`、`--compact`、`--depth`、`--selector`）は、`ref=e12` のようなref付きrole-based snapshotを強制します。
  - `--frame "<iframe selector>"` はrole snapshotsをiframeにスコープします（`e12` のようなrole refと組み合わせます）。
  - `--interactive` は、インタラクティブ要素のフラットで選びやすい一覧を出力します（アクション操作に最適）。
  - `--labels` は、refラベルを重ねたビューポート限定スクリーンショットを追加します（`MEDIA:<path>` を出力）。
- `click`/`type` などには、`snapshot` の `ref`（数値の `12` またはrole refの `e12`）が必要です。
  アクションでは、意図的にCSSセレクターはサポートされていません。

## スナップショットとref

OpenClawは2つの「snapshot」スタイルをサポートします。

- **AIスナップショット（数値ref）**: `openclaw browser snapshot`（デフォルト; `--format ai`）
  - 出力: 数値refを含むテキストスナップショット。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部では、refはPlaywrightの `aria-ref` を通じて解決されます。

- **Role snapshot（`e12` のようなrole ref）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（および任意で `[nth=1]`）付きのroleベース一覧/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部では、refは `getByRole(...)`（重複時は `nth()` を追加）で解決されます。
  - `--labels` を追加すると、`e12` ラベルを重ねたビューポートスクリーンショットが含まれます。

Refの挙動:

- refは**ナビゲーションをまたいで安定しません**。何か失敗した場合は、`snapshot` を再実行して新しいrefを使ってください。
- role snapshotを `--frame` 付きで取得した場合、role refは次のrole snapshotまでそのiframeにスコープされます。

## Waitの強化機能

時間/テキスト以外も待機できます。

- URLを待機する（Playwrightがサポートするglobを使用可能）:
  - `openclaw browser wait --url "**/dash"`
- 読み込み状態を待機する:
  - `openclaw browser wait --load networkidle`
- JS述語を待機する:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが可視になるまで待機する:
  - `openclaw browser wait "#main"`

これらは組み合わせ可能です。

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
2. `click <ref>` / `type <ref>` を使います（interactive modeではrole ref推奨）
3. まだ失敗する場合: `openclaw browser highlight <ref>` で、Playwrightがどこを対象にしているか確認します
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 詳細デバッグではtraceを記録します:
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

JSON内のrole snapshotsには、ツールがpayloadサイズと密度を判断できるよう、
`refs` と小さな `stats` ブロック（lines/chars/refs/interactive）が含まれます。

## 状態と環境のノブ

これらは「サイトをXのように振る舞わせる」ワークフローで役立ちます。

- Cookies: `cookies`、`cookies set`、`cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'`（従来の `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP basic auth: `set credentials user pass`（または `--clear`）
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`、`set locale ...`
- Device / viewport:
  - `set device "iPhone 14"`（Playwright deviceプリセット）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw browser profileにはログイン済みセッションが含まれる場合があります。機微情報として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn` は、
  ページコンテキストで任意のJavaScriptを実行します。prompt injectionによって
  これが誘導される可能性があります。不要であれば `browser.evaluateEnabled=false` で無効にしてください。
- ログインやbot対策に関する注意（X/Twitterなど）については、[Browser login + X/Twitter posting](/ja-JP/tools/browser-login)を参照してください。
- Gateway/node hostはプライベートに保ってください（loopbackまたはtailnet専用）。
- Remote CDPエンドポイントは強力です。トンネル化し、保護してください。

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

Linux固有の問題（特にsnap版Chromium）については、
[Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)を参照してください。

WSL2 Gateway + Windows Chromeの分離host構成については、
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)を参照してください。

### CDP起動失敗とナビゲーションSSRFブロックの違い

これらは異なる種類の失敗であり、示しているコードパスも異なります。

- **CDP起動または準備完了失敗** は、OpenClawがブラウザ制御プレーンが正常かどうかを確認できないことを意味します。
- **ナビゲーションSSRFブロック** は、ブラウザ制御プレーン自体は正常だが、ページのナビゲーション先がポリシーによって拒否されたことを意味します。

一般的な例:

- CDP起動または準備完了失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- ナビゲーションSSRFブロック:
  - `open`、`navigate`、snapshot、またはタブを開くフローがブラウザ/ネットワークポリシーエラーで失敗する一方、`start` と `tabs` は引き続き動作する

この最小手順を使うと、2つを切り分けられます。

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合は、まずCDPの準備完了状態をトラブルシュートしてください。
- `start` は成功するが `tabs` が失敗する場合、制御プレーンはまだ不健全です。これはページナビゲーションの問題ではなく、CDP到達性の問題として扱ってください。
- `start` と `tabs` は成功するが `open` または `navigate` が失敗する場合、ブラウザ制御プレーンは稼働しており、失敗はナビゲーションポリシーまたは対象ページ側にあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的な管理ブラウザ制御経路は正常です。

重要な動作の詳細:

- `browser.ssrfPolicy` を設定していなくても、ブラウザconfigはデフォルトでfail-closedなSSRFポリシーオブジェクトになります。
- ローカルloopbackの `openclaw` 管理プロファイルでは、CDPヘルスチェックは意図的に、OpenClaw自身のローカル制御プレーンに対するブラウザSSRF到達性強制をスキップします。
- ナビゲーション保護は別です。`start` や `tabs` が成功しても、その後の `open` や `navigate` の対象が許可されることを意味するわけではありません。

セキュリティガイダンス:

- デフォルトでブラウザSSRFポリシーを緩めることは**しないでください**。
- 広範なprivate-networkアクセスよりも、`hostnameAllowlist` や `allowedHostnames` のような限定的なhost例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、private-networkブラウザアクセスが必要で、レビュー済みの、意図的に信頼された環境でのみ使用してください。

例: ナビゲーションはブロックされるが、制御プレーンは正常

- `start` は成功する
- `tabs` は成功する
- `open http://internal.example` は失敗する

これは通常、ブラウザ起動自体は問題なく、ナビゲーション先についてポリシーレビューが必要であることを意味します。

例: ナビゲーション以前に起動がブロックされる

- `start` が `not reachable after start` で失敗する
- `tabs` も失敗するか実行できない

これは、ページURL許可リストの問題ではなく、ブラウザ起動またはCDP到達性を示しています。

## エージェントツール + 制御の仕組み

エージェントはブラウザ自動化用に**1つのツール**を取得します。

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定したUIツリー（AIまたはARIA）を返します。
- `browser act` はsnapshotの `ref` IDを使って、クリック/入力/ドラッグ/選択を行います。
- `browser screenshot` はピクセルをキャプチャします（ページ全体または要素）。
- `browser` は次を受け付けます:
  - `profile`: 名前付きブラウザプロファイル（openclaw、chrome、またはremote CDP）を選択します。
  - `target`（`sandbox` | `host` | `node`）: ブラウザが存在する場所を選択します。
  - sandbox化されたセッションでは、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` を省略した場合: sandbox化されたセッションではデフォルトが `sandbox`、非sandboxセッションではデフォルトが `host` です。
  - ブラウザ対応nodeが接続されている場合、`target="host"` または `target="node"` を固定しない限り、ツールは自動的にそこへルーティングされる場合があります。

これにより、エージェントの動作は決定的になり、脆いセレクターを避けられます。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox環境でのブラウザ制御
- [Security](/ja-JP/gateway/security) — ブラウザ制御のリスクとハードニング
