---
read_when:
    - エージェント制御のブラウザ自動化の追加
    - openclawが自分のChromeに干渉している理由をデバッグする
    - macOSアプリでブラウザ設定とライフサイクルを実装する
summary: 統合ブラウザ制御サービス + アクションコマンド
title: Browser（OpenClaw管理）
x-i18n:
    generated_at: "2026-04-24T09:02:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClawは、エージェントが制御する**専用のChrome/Brave/Edge/Chromiumプロファイル**を実行できます。  
これは個人用ブラウザから分離されており、Gateway内の小さなローカル  
制御サービス（loopbackのみ）を通じて管理されます。

初心者向けの見方:

- これは**エージェント専用の別ブラウザ**だと考えてください。
- `openclaw`プロファイルは個人用ブラウザプロファイルに**触れません**。
- エージェントは安全なレーン内で**タブを開き、ページを読み、クリックし、入力できます**。
- 組み込みの`user`プロファイルは、Chrome MCP経由であなたの実際のサインイン済みChromeセッションに接続します。

## できること

- **openclaw**という名前の独立したブラウザプロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（一覧/開く/フォーカス/閉じる）。
- エージェント操作（クリック/入力/ドラッグ/選択）、スナップショット、スクリーンショット、PDF。
- 任意のマルチプロファイルサポート（`openclaw`、`work`、`remote`、...）。

このブラウザは**日常使いのブラウザではありません**。  
これはエージェント自動化と検証のための、安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示された場合は、configで有効にし（下記参照）、Gatewayを再起動してください。

`openclaw browser`自体が存在しない場合、またはエージェントがbrowserツールを利用できないと言う場合は、[Missing browser command or tool](/ja-JP/tools/browser#missing-browser-command-or-tool)に進んでください。

## Plugin制御

デフォルトの`browser`ツールはバンドル済みPluginです。同じ`browser`ツール名を登録する別のPluginに置き換えるには、これを無効にしてください。

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

デフォルトには、`plugins.entries.browser.enabled` **と** `browser.enabled=true`の両方が必要です。Pluginだけを無効にすると、`openclaw browser` CLI、`browser.request` gatewayメソッド、エージェントツール、制御サービスが一体として削除されます。一方で`browser.*` configは置き換え用としてそのまま残ります。

ブラウザconfigの変更では、Pluginがサービスを再登録できるようにGatewayの再起動が必要です。

## browserコマンドまたはツールが見つからない

アップグレード後に`openclaw browser`が不明になった場合、`browser.request`が存在しない場合、またはエージェントがbrowserツールを利用できないと報告する場合、通常の原因は`browser`を含まない`plugins.allow`リストです。これを追加してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true`、および`tools.alsoAllow: ["browser"]`は、許可リストの所属の代わりにはなりません。許可リストがPluginの読み込みを制御し、ツールポリシーは読み込み後にしか適用されないためです。`plugins.allow`自体を完全に削除してもデフォルトに戻ります。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理された分離ブラウザ（拡張機能不要）。
- `user`: あなたの**実際のサインイン済みChrome**セッション向けの組み込みChrome MCP接続プロファイル。

エージェントのbrowserツール呼び出しでは:

- デフォルト: 分離された`openclaw`ブラウザを使用します。
- 既存のログイン済みセッションが重要で、かつユーザーがコンピューターの前にいて接続プロンプトをクリック/承認できる場合は、`profile="user"`を優先してください。
- 特定のブラウザモードを使いたいときの明示的な上書きが`profile`です。

デフォルトで管理モードにしたい場合は、`browser.defaultProfile: "openclaw"`を設定してください。

## 設定

ブラウザ設定は`~/.openclaw/openclaw.json`にあります。

```json5
{
  browser: {
    enabled: true, // デフォルト: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼されたプライベートネットワークアクセスにのみオプトイン
      // allowPrivateNetwork: true, // レガシーエイリアス
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // レガシーな単一プロファイル上書き
    remoteCdpTimeoutMs: 1500, // リモートCDP HTTPタイムアウト（ms）
    remoteCdpHandshakeTimeoutMs: 3000, // リモートCDP WebSocketハンドシェイクタイムアウト（ms）
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

<AccordionGroup>

<Accordion title="ポートと到達可能性">

- 制御サービスは`gateway.port`から導出されたポートでloopbackにbindします（デフォルト`18791` = gateway + 2）。`gateway.port`または`OPENCLAW_GATEWAY_PORT`を上書きすると、導出ポートも同じ系統で移動します。
- ローカル`openclaw`プロファイルは`cdpPort`/`cdpUrl`を自動割り当てします。これらはリモートCDPに対してのみ設定してください。`cdpUrl`が未設定の場合は、管理されたローカルCDPポートがデフォルトになります。
- `remoteCdpTimeoutMs`はリモート（非loopback）CDP HTTP到達性チェックに適用されます。`remoteCdpHandshakeTimeoutMs`はリモートCDP WebSocketハンドシェイクに適用されます。

</Accordion>

<Accordion title="SSRFポリシー">

- ブラウザナビゲーションとopen-tabは、ナビゲーション前にSSRF保護され、その後も最終`http(s)` URLに対してベストエフォートで再チェックされます。
- 厳格なSSRFモードでは、リモートCDPエンドポイント検出と`/json/version`プローブ（`cdpUrl`）もチェックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`はデフォルトでオフです。プライベートネットワークのブラウザアクセスを意図的に信頼する場合にのみ有効にしてください。
- `browser.ssrfPolicy.allowPrivateNetwork`はレガシーエイリアスとして引き続きサポートされます。

</Accordion>

<Accordion title="プロファイルの挙動">

- `attachOnly: true`は、ローカルブラウザを決して起動せず、すでに動作している場合にのみ接続することを意味します。
- `color`（トップレベルとプロファイルごと）はブラウザUIに色を付け、どのプロファイルが有効か分かるようにします。
- デフォルトプロファイルは`openclaw`（管理されたスタンドアロン）です。サインイン済みユーザーブラウザにオプトインするには`defaultProfile: "user"`を使用してください。
- 自動検出順序: システムデフォルトブラウザがChromium系ならそれを使用。そうでなければChrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"`は、生のCDPではなくChrome DevTools MCPを使用します。そのdriverに対して`cdpUrl`は設定しないでください。
- 既存セッションプロファイルをデフォルト以外のChromiumユーザープロファイル（Brave、Edgeなど）に接続するには、`browser.profiles.<name>.userDataDir`を設定してください。

</Accordion>

</AccordionGroup>

## Brave（または別のChromium系ブラウザ）を使う

**システムデフォルト**ブラウザがChromium系（Chrome/Brave/Edgeなど）であれば、  
OpenClawは自動的にそれを使用します。自動検出を上書きするには  
`browser.executablePath`を設定してください。

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

またはconfigで、プラットフォームごとに設定します。

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gatewayがloopback制御サービスを起動し、ローカルブラウザを起動できます。
- **リモート制御（node host）:** ブラウザがあるマシン上でnode hostを実行し、Gatewayがそこへブラウザ操作をプロキシします。
- **リモートCDP:** リモートのChromium系ブラウザに接続するには、`browser.profiles.<name>.cdpUrl`（または`browser.cdpUrl`）を設定します。この場合、OpenClawはローカルブラウザを起動しません。

停止の挙動はプロファイルモードによって異なります。

- ローカル管理プロファイル: `openclaw browser stop`は、OpenClawが起動したブラウザプロセスを停止します
- attach-onlyおよびリモートCDPプロファイル: `openclaw browser stop`は、アクティブな制御セッションを閉じ、Playwright/CDPのエミュレーション上書き（viewport、color scheme、locale、timezone、offline modeなどの状態）を解除します。OpenClawがブラウザプロセスを起動していない場合でも同様です

リモートCDP URLにはauthを含められます。

- クエリtoken（例: `https://provider.example?token=<token>`）
- HTTP Basic auth（例: `https://user:pass@provider.example`）

OpenClawは、`/json/*`エンドポイント呼び出し時とCDP WebSocket接続時にauthを保持します。tokenはconfigファイルにコミットするのではなく、環境変数またはシークレットマネージャーを使うことを推奨します。

## Nodeブラウザプロキシ（デフォルトでゼロ設定）

ブラウザがあるマシンで**node host**を実行している場合、OpenClawは  
追加のブラウザconfigなしで、browserツール呼び出しをそのNodeに自動ルーティングできます。  
これはリモートGatewayのデフォルト経路です。

注意:

- node hostは、ローカルブラウザ制御サーバーを**プロキシコマンド**経由で公開します。
- プロファイルはNode自身の`browser.profiles` configから取得されます（ローカルと同じ）。
- `nodeHost.browserProxy.allowProfiles`は任意です。空のままにすると従来どおり/デフォルトの挙動になり、profile create/deleteルートを含め、設定済みのすべてのプロファイルがプロキシ経由で到達可能なままになります。
- `nodeHost.browserProxy.allowProfiles`を設定すると、OpenClawはそれを最小権限境界として扱います。許可リスト入りしたプロファイルだけが対象になり、永続的なprofile create/deleteルートはプロキシサーフェスでブロックされます。
- 不要なら無効にしてください:
  - Node側: `nodeHost.browserProxy.enabled=false`
  - Gateway側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型リモートCDP）

[Browserless](https://browserless.io)は、HTTPSとWebSocket経由でCDP接続URLを公開する  
ホスト型Chromiumサービスです。OpenClawはどちらの形式も使えますが、  
リモートブラウザプロファイルでは、最も簡単なのはBrowserlessの接続ドキュメントにある  
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

- `<BROWSERLESS_API_KEY>`は実際のBrowserless tokenに置き換えてください。
- Browserlessアカウントに対応するリージョンエンドポイントを選んでください（詳細は先方ドキュメント参照）。
- BrowserlessがHTTPSベースURLを提供する場合は、それを
  直接CDP接続用に`wss://`へ変換するか、HTTPS URLのままにしてOpenClawに
  `/json/version`を検出させることができます。

## 直接WebSocket CDPプロバイダー

一部のホスト型ブラウザサービスは、標準のHTTPベースCDP検出（`/json/version`）ではなく、  
**直接WebSocket**エンドポイントを公開します。OpenClawは3種類の  
CDP URL形式を受け入れ、適切な接続戦略を自動選択します。

- **HTTP(S)検出** — `http://host[:port]`または`https://host[:port]`。  
  OpenClawは`/json/version`を呼び出してWebSocket debugger URLを検出し、その後
  接続します。WebSocketフォールバックはありません。
- **直接WebSocketエンドポイント** — `ws://host[:port]/devtools/<kind>/<id>`または
  `wss://...`で、`/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  パスを持つもの。OpenClawは直接WebSocketハンドシェイクで接続し、
  `/json/version`を完全にスキップします。
- **素のWebSocketルート** — `ws://host[:port]`または`wss://host[:port]`で
  `/devtools/...`パスを持たないもの（例: [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClawはまずHTTP
  `/json/version`検出を試み（スキームを`http`/`https`に正規化）、  
  検出結果が`webSocketDebuggerUrl`を返せばそれを使い、そうでなければOpenClawは
  素のルートで直接WebSocketハンドシェイクにフォールバックします。これにより、
  ローカルChromeを指す素の`ws://`でも接続できます。Chromeは
  `/json/version`から得られる特定のper-targetパスでしかWebSocket upgradeを
  受け付けないためです。

### Browserbase

[Browserbase](https://www.browserbase.com)は、組み込みのCAPTCHA解決、ステルスモード、住宅用プロキシを備えた、  
ヘッドレスブラウザ実行向けのクラウドプラットフォームです。

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

- [登録](https://www.browserbase.com/sign-up)し、[Overview dashboard](https://www.browserbase.com/overview)から**API Key**をコピーしてください。
- `<BROWSERBASE_API_KEY>`を実際のBrowserbase API keyに置き換えてください。
- BrowserbaseはWebSocket接続時にブラウザセッションを自動作成するため、手動でのセッション作成手順は不要です。
- 無料プランでは、同時セッション1つ、月1ブラウザ時間まで利用できます。有料プランの制限は[pricing](https://www.browserbase.com/pricing)を参照してください。
- 完全なAPIリファレンス、SDKガイド、統合例については[Browserbase docs](https://docs.browserbase.com)を参照してください。

## セキュリティ

重要な考え方:

- ブラウザ制御はloopback専用です。アクセスはGatewayのauthまたはNodeペアリングを通ります。
- スタンドアロンのloopbackブラウザHTTP APIは、**共有シークレットauthのみ**を使用します:
  Gateway token bearer auth、`x-openclaw-password`、または設定済みGateway passwordによるHTTP Basic auth。
- Tailscale Serve IDヘッダーおよび`gateway.auth.mode: "trusted-proxy"`は、このスタンドアロンloopbackブラウザAPIを**認証しません**。
- ブラウザ制御が有効で、共有シークレットauthが未設定の場合、OpenClawは起動時に`gateway.auth.token`を自動生成し、それをconfigへ永続化します。
- `gateway.auth.mode`がすでに`password`、`none`、または`trusted-proxy`の場合、OpenClawはそのtokenを自動生成**しません**。
- GatewayとすべてのNodeホストはプライベートネットワーク（Tailscale）上に保ち、公開露出は避けてください。
- リモートCDP URL/tokenはシークレットとして扱い、環境変数またはシークレットマネージャーを優先してください。

リモートCDPのヒント:

- 可能であれば、暗号化されたエンドポイント（HTTPSまたはWSS）と短命tokenを優先してください。
- 長期間有効なtokenをconfigファイルへ直接埋め込むのは避けてください。

## プロファイル（マルチブラウザ）

OpenClawは複数の名前付きプロファイル（ルーティング設定）をサポートします。プロファイルには次の種類があります。

- **OpenClaw管理**: 専用のuser data directory + CDP portを持つ、専用のChromium系ブラウザインスタンス
- **remote**: 明示的なCDP URL（別の場所で動作するChromium系ブラウザ）
- **existing session**: Chrome DevTools MCP自動接続による、既存のChromeプロファイル

デフォルト:

- `openclaw`プロファイルは、存在しない場合に自動作成されます。
- `user`プロファイルは、Chrome MCP existing-session接続用として組み込みです。
- `user`以外のexisting-sessionプロファイルはオプトインです。`--driver existing-session`で作成してください。
- ローカルCDPポートはデフォルトで**18800–18899**から割り当てられます。
- プロファイルを削除すると、そのローカルdata directoryはゴミ箱へ移動されます。

すべての制御エンドポイントは`?profile=<name>`を受け付けます。CLIでは`--browser-profile`を使用します。

## Chrome DevTools MCP経由のExisting-session

OpenClawは、公式Chrome DevTools MCPサーバーを通じて、実行中のChromium系ブラウザプロファイルにも接続できます。これにより、そのブラウザプロファイルですでに開いているタブやログイン状態を再利用できます。

公式の背景情報およびセットアップ参考資料:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

任意: 別の名前、色、またはbrowser data directoryを使いたい場合は、独自のcustom existing-sessionプロファイルを作成できます。

デフォルトの挙動:

- 組み込みの`user`プロファイルはChrome MCP自動接続を使用し、デフォルトのローカルGoogle Chromeプロファイルを対象にします。

Brave、Edge、Chromium、またはデフォルト以外のChromeプロファイルには`userDataDir`を使用してください。

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

次に、対応するブラウザで:

1. そのブラウザのリモートデバッグ用inspectページを開きます。
2. リモートデバッグを有効にします。
3. ブラウザを起動したままにし、OpenClawが接続するときの接続確認プロンプトを承認します。

一般的なinspectページ:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

ライブ接続のスモークテスト:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功時の見え方:

- `status`に`driver: existing-session`が表示される
- `status`に`transport: chrome-mcp`が表示される
- `status`に`running: true`が表示される
- `tabs`に、すでに開いているブラウザタブが一覧表示される
- `snapshot`が、選択中のライブタブからrefを返す

接続がうまくいかない場合の確認項目:

- 対象のChromium系ブラウザがバージョン`144+`である
- そのブラウザのinspectページでリモートデバッグが有効になっている
- ブラウザに接続同意プロンプトが表示され、それを承認した
- `openclaw doctor`は古い拡張機能ベースのブラウザconfigを移行し、デフォルト自動接続プロファイルに対してChromeがローカルにインストールされているか確認しますが、ブラウザ側のリモートデバッグを代わりに有効化することはできません

エージェントでの使用:

- ユーザーのログイン済みブラウザ状態が必要な場合は`profile="user"`を使用してください。
- custom existing-sessionプロファイルを使う場合は、その明示的なプロファイル名を渡してください。
- このモードは、ユーザーがコンピューターの前にいて接続プロンプトを承認できる場合にのみ選んでください。
- GatewayまたはNodeホストは`npx chrome-devtools-mcp@latest --autoConnect`を起動できます

注意:

- この経路は、サインイン済みブラウザセッション内で動作できるため、分離された`openclaw`プロファイルより高リスクです。
- OpenClawはこのdriver向けにブラウザを起動しません。接続するだけです。
- OpenClawはここで公式のChrome DevTools MCP `--autoConnect`フローを使用します。`userDataDir`が設定されている場合は、そのuser data directoryを対象にするために渡されます。
- Existing-sessionは選択したhost上、または接続済みブラウザNode経由で接続できます。Chromeが別の場所にあり、かつブラウザNodeが接続されていない場合は、代わりにリモートCDPまたはnode hostを使用してください。

<Accordion title="Existing-session機能の制限">

管理された`openclaw`プロファイルと比べると、existing-session driverにはより多くの制約があります。

- **スクリーンショット** — ページキャプチャと`--ref`要素キャプチャは使えますが、CSS `--element`セレクターは使えません。`--full-page`は`--ref`または`--element`と併用できません。ページまたはrefベースの要素スクリーンショットにはPlaywrightは不要です。
- **操作** — `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select`はsnapshot refを必要とします（CSSセレクターは不可）。`click`は左ボタンのみです。`type`は`slowly=true`をサポートしません。`fill`または`press`を使用してください。`press`は`delayMs`をサポートしません。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate`は呼び出しごとのtimeoutをサポートしません。`select`は単一値を受け付けます。
- **Wait / upload / dialog** — `wait --url`は完全一致、部分一致、globパターンをサポートします。`wait --load networkidle`はサポートされません。upload hookは`ref`または`inputRef`を必要とし、一度に1ファイルのみで、CSS `element`は使えません。dialog hookはtimeout上書きをサポートしません。
- **管理プロファイル専用機能** — バッチ操作、PDFエクスポート、ダウンロードインターセプト、`responsebody`は引き続き管理ブラウザ経路が必要です。

</Accordion>

## 分離保証

- **専用user data dir**: 個人用ブラウザプロファイルには決して触れません。
- **専用ポート**: 開発ワークフローの`9222`との衝突を防ぎます。
- **決定的なタブ制御**: 「最後のタブ」ではなく`targetId`でタブを対象にします。

## ブラウザ選択

ローカル起動時、OpenClawは最初に利用可能なものを選びます。

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath`で上書きできます。

プラットフォーム:

- macOS: `/Applications`と`~/Applications`を確認します。
- Linux: `google-chrome`、`brave`、`microsoft-edge`、`chromium`などを探します。
- Windows: 一般的なインストール場所を確認します。

## 制御API（任意）

スクリプト作成とデバッグのために、Gatewayは小さな**loopback専用HTTP  
制御API**と、それに対応する`openclaw browser` CLI（snapshot、ref、wait  
強化機能、JSON出力、デバッグワークフロー）を公開しています。完全なリファレンスは  
[Browser control API](/ja-JP/tools/browser-control)を参照してください。

## トラブルシューティング

Linux固有の問題（特にsnap版Chromium）については、  
[Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)を参照してください。

WSL2 Gateway + Windows Chromeの分離ホスト構成については、  
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)を参照してください。

### CDP起動失敗とナビゲーションSSRFブロックの違い

これらは異なる種類の失敗であり、異なるコード経路を示します。

- **CDP起動または準備完了失敗**は、OpenClawがブラウザ制御プレーンの健全性を確認できないことを意味します。
- **ナビゲーションSSRFブロック**は、ブラウザ制御プレーン自体は健全だが、ページナビゲーション先がポリシーにより拒否されていることを意味します。

一般的な例:

- CDP起動または準備完了失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- ナビゲーションSSRFブロック:
  - `open`、`navigate`、snapshot、またはタブを開くフローがブラウザ/ネットワークポリシーエラーで失敗する一方、`start`と`tabs`は動作する

この最小シーケンスを使うと両者を切り分けられます。

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start`が`not reachable after start`で失敗する場合は、まずCDP準備完了をトラブルシュートしてください。
- `start`は成功するが`tabs`が失敗する場合、制御プレーンは依然として不健全です。これはページナビゲーションの問題ではなく、CDP到達性の問題として扱ってください。
- `start`と`tabs`は成功するが`open`または`navigate`が失敗する場合、ブラウザ制御プレーンは起動しており、失敗はナビゲーションポリシーまたは対象ページにあります。
- `start`、`tabs`、`open`がすべて成功する場合、基本的な管理ブラウザ制御経路は健全です。

重要な挙動の詳細:

- browser.ssrfPolicyを設定していなくても、ブラウザconfigはデフォルトでフェイルクローズなSSRFポリシーオブジェクトになります。
- ローカルloopbackの`openclaw`管理プロファイルでは、CDPヘルスチェックは意図的に、OpenClaw自身のローカル制御プレーンに対するブラウザSSRF到達性の強制をスキップします。
- ナビゲーション保護は別です。`start`または`tabs`が成功しても、その後の`open`または`navigate`先が許可されていることは意味しません。

セキュリティガイダンス:

- ブラウザSSRFポリシーをデフォルトで緩和**しないでください**。
- 広いプライベートネットワークアクセスよりも、`hostnameAllowlist`や`allowedHostnames`のような狭いホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true`は、プライベートネットワークのブラウザアクセスが必要で、かつレビュー済みの、意図的に信頼された環境でのみ使用してください。

## エージェントツール + 制御の仕組み

エージェントには、ブラウザ自動化用として**1つのツール**が与えられます。

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot`は、安定したUIツリー（AIまたはARIA）を返します。
- `browser act`は、snapshotの`ref` IDを使ってクリック/入力/ドラッグ/選択を行います。
- `browser screenshot`は、ピクセルをキャプチャします（ページ全体または要素）。
- `browser`は次を受け付けます:
  - `profile`: 名前付きブラウザプロファイル（openclaw、chrome、またはremote CDP）を選択します。
  - `target`（`sandbox` | `host` | `node`）: ブラウザが存在する場所を選択します。
  - sandbox化されたセッションでは、`target: "host"`には`agents.defaults.sandbox.browser.allowHostControl=true`が必要です。
  - `target`を省略した場合: sandbox化されたセッションではデフォルトで`sandbox`、非sandboxセッションではデフォルトで`host`になります。
  - ブラウザ対応Nodeが接続されている場合、`target="host"`または`target="node"`で固定しない限り、ツールは自動的にそこへルーティングされることがあります。

これにより、エージェントの動作が決定的になり、壊れやすいセレクターを避けられます。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox環境でのブラウザ制御
- [Security](/ja-JP/gateway/security) — ブラウザ制御のリスクとハードニング
