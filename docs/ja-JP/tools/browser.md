---
read_when:
    - エージェント制御のブラウザー自動化の追加
    - openclawが自分のChromeに干渉している理由のデバッグ
    - macOSアプリでのブラウザー設定 + ライフサイクルの実装
summary: 統合ブラウザー制御サービス + アクションコマンド
title: ブラウザー（OpenClaw管理）
x-i18n:
    generated_at: "2026-04-25T14:00:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

OpenClawは、エージェントが制御する **専用のChrome/Brave/Edge/Chromiumプロファイル** を実行できます。
これは個人用ブラウザーから分離されており、Gateway内の小さなローカル
制御サービス（loopbackのみ）を通じて管理されます。

初心者向けの見方:

- これは **エージェント専用の別ブラウザー** だと考えてください。
- `openclaw` プロファイルは **個人用ブラウザープロファイルに触れません**。
- エージェントは安全なレーンで **タブを開き、ページを読み、クリックし、入力** できます。
- 組み込みの `user` プロファイルは、Chrome MCP経由で実際のサインイン済みChromeセッションに接続します。

## 何が得られるか

- **openclaw** という名前の別ブラウザープロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（list/open/focus/close）。
- エージェントアクション（click/type/drag/select）、snapshot、screenshot、PDF。
- browser pluginが有効なとき、browser-automationスキルがバンドルされ、snapshot、
  stable-tab、stale-ref、manual-blocker回復ループをエージェントに教えます。
- 任意のマルチプロファイルサポート（`openclaw`, `work`, `remote`, ...）。

このブラウザーは **日常使い用ではありません**。これはエージェント自動化と検証のための、
安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示された場合は、configで有効化し（下記参照）、
Gatewayを再起動してください。

`openclaw browser` 自体が存在しない、またはエージェントがbrowser toolを利用不可と言う場合は、
[Missing browser command or tool](/ja-JP/tools/browser#missing-browser-command-or-tool) に進んでください。

## Plugin制御

デフォルトの `browser` toolはバンドル済みPluginです。同じ `browser` tool名を登録する別Pluginに置き換えるには、これを無効化してください:

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

デフォルトでは `plugins.entries.browser.enabled` **および** `browser.enabled=true` の両方が必要です。pluginだけを無効化すると、`openclaw browser` CLI、`browser.request` Gateway method、agent tool、control serviceが1つの単位として削除されます。`browser.*` config自体は置き換え先のためにそのまま残ります。

browser configの変更は、pluginがserviceを再登録できるようにするため、Gatewayの再起動が必要です。

## エージェント向けガイダンス

browser pluginは、2段階のエージェント向けガイダンスを提供します:

- `browser` tool descriptionには、常時有効なコンパクト契約が入っています: 適切な
  profileを選び、同じタブ上でrefを維持し、タブターゲティングには `tabId` / labelを使い、
  複数ステップ作業ではbrowser skillを読み込むことです。
- バンドル済みの `browser-automation` スキルには、より長い運用ループが入っています:
  まずstatus/tabsを確認し、作業タブにlabelを付け、操作前にsnapshotし、
  UI変更後に再snapshotし、stale refを1回回復し、login/2FA/captchaまたは
  camera/microphone blockerは推測せず手動アクションとして報告します。

Pluginバンドル済みSkillsは、pluginが有効なときにエージェントの利用可能なSkills一覧に表示されます。完全なskill instructionsは必要時にだけ読み込まれるため、通常のターンでは完全なtokenコストを払いません。

## browser commandまたはtoolが見つからない

アップグレード後に `openclaw browser` が不明になった、`browser.request` が存在しない、またはエージェントがbrowser toolを利用不可と報告する場合、通常の原因は `plugins.allow` リストに `browser` が含まれていないことです。追加してください:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true`, `tools.alsoAllow: ["browser"]` はallowlist membershipの代わりにはなりません — allowlistがplugin読み込みを制御し、tool policyはその後にしか実行されません。`plugins.allow` 自体を完全に削除してもデフォルト状態に戻ります。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理される分離ブラウザー（extension不要）。
- `user`: 実際の **サインイン済みChrome**
  セッション向けの組み込みChrome MCP接続プロファイル。

エージェントbrowser tool呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザーを使います。
- 既存のログイン済みセッションが重要で、かつユーザーが
  attach promptをクリック/承認できる状態なら `profile="user"` を優先してください。
- `profile` は、特定のbrowser modeを使いたいときの明示的上書きです。

デフォルトでmanaged modeを使いたい場合は `browser.defaultProfile: "openclaw"` を設定してください。

## 設定

browser設定は `~/.openclaw/openclaw.json` にあります。

```json5
{
  browser: {
    enabled: true, // デフォルト: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 信頼済みprivate-networkアクセス時のみオプトイン
      // allowPrivateNetwork: true, // レガシーalias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // レガシーな単一プロファイル上書き
    remoteCdpTimeoutMs: 1500, // リモートCDP HTTPタイムアウト (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // リモートCDP WebSocketハンドシェイクタイムアウト (ms)
    localLaunchTimeoutMs: 15000, // ローカルmanaged Chrome検出タイムアウト (ms)
    localCdpReadyTimeoutMs: 8000, // ローカルmanaged起動後CDP準備タイムアウト (ms)
    actionTimeoutMs: 60000, // デフォルトbrowser actタイムアウト (ms)
    tabCleanup: {
      enabled: true, // デフォルト: true
      idleMinutes: 120, // アイドルcleanupを無効化するには0
      maxTabsPerSession: 8, // セッションごとの上限を無効化するには0
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

<Accordion title="ポートと到達性">

- control serviceは、`gateway.port` から導出されるポート上でloopbackにbindします（デフォルト `18791` = gateway + 2）。`gateway.port` または `OPENCLAW_GATEWAY_PORT` を上書きすると、同じ系列の導出ポートもずれます。
- ローカルの `openclaw` profileは自動で `cdpPort`/`cdpUrl` を割り当てます。これらを設定するのはremote CDP用だけにしてください。`cdpUrl` は未設定時、管理されるローカルCDPポートになります。
- `remoteCdpTimeoutMs` はremote（非loopback）CDP HTTP到達性チェックに適用されます。`remoteCdpHandshakeTimeoutMs` はremote CDP WebSocketハンドシェイクに適用されます。
- `localLaunchTimeoutMs` は、ローカル起動されたmanaged Chrome
  processがCDP HTTP endpointを公開するまでの予算です。`localCdpReadyTimeoutMs` は、
  process検出後のCDP websocket準備のための追加入力時間です。
  Raspberry Pi、低性能VPS、またはChromiumの
  起動が遅い古いハードウェアでは、これらを引き上げてください。値の上限は120000 msです。
- `actionTimeoutMs` は、呼び出し元が `timeoutMs` を渡さない場合のbrowser `act` リクエストのデフォルト予算です。クライアントtransportは小さな余裕時間を追加するため、長い待機もHTTP境界でタイムアウトせず完了できます。
- `tabCleanup` は、primary-agent browser sessionが開いたタブに対するbest-effort cleanupです。subagent、Cron、ACPのライフサイクルcleanupでは、セッション終了時に明示的に追跡されたタブは引き続き閉じられます。primary sessionでは、アクティブなタブを再利用可能なまま保ち、その後、アイドルまたは上限超過の追跡タブをバックグラウンドで閉じます。

</Accordion>

<Accordion title="SSRFポリシー">

- browser navigationとopen-tabは、navigation前にSSRFガードされ、さらに最終的な `http(s)` URLに対してbest-effortで再チェックされます。
- strict SSRF modeでは、remote CDP endpoint検出と `/json/version` probe（`cdpUrl`）もチェックされます。
- Gateway/providerの `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` 環境変数は、OpenClaw管理browserには自動適用されません。managed Chromeはデフォルトで直接起動されるため、provider proxy設定によってbrowser SSRFチェックが弱まることはありません。
- managed browser自体をproxyしたい場合は、`browser.extraArgs` 経由で `--proxy-server=...` や `--proxy-pac-url=...` のような明示的Chrome proxy flagを渡してください。strict SSRF modeでは、private-network browserアクセスが意図的に有効化されていない限り、明示的browser proxy routingはブロックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトでオフです。private-network browserアクセスを意図的に信頼する場合にのみ有効化してください。
- `browser.ssrfPolicy.allowPrivateNetwork` はレガシーaliasとして引き続きサポートされます。

</Accordion>

<Accordion title="プロファイルの挙動">

- `attachOnly: true` は、ローカルbrowserを絶対に起動しないことを意味します。すでに動作中のものがある場合のみattachします。
- `headless` はグローバルにも、ローカルmanaged profileごとにも設定できます。profileごとの値は `browser.headless` を上書きするため、ローカル起動プロファイルの1つをheadlessに保ちつつ、別のものは表示状態のままにできます。
- `POST /start?headless=true` と `openclaw browser start --headless` は、
  `browser.headless` やprofile configを書き換えずに、ローカルmanaged profile向けの
  ワンショットheadless起動を要求します。既存セッション、attach-only、remote CDP profileは、
  OpenClawがそれらのbrowser processを起動しないため、この上書きを拒否します。
- Linuxホストで `DISPLAY` または `WAYLAND_DISPLAY` がない場合、ローカルmanaged profileは、環境またはprofile/global
  configのいずれも明示的にheaded modeを選んでいない限り、自動でheadlessになります。`openclaw browser status --json`
  は `headlessSource` を `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, `default` のいずれかとして報告します。
- `OPENCLAW_BROWSER_HEADLESS=1` は、現在のprocessに対してローカルmanaged起動を強制的にheadlessにします。`OPENCLAW_BROWSER_HEADLESS=0` は、通常の
  起動では強制的にheaded modeにし、display serverのないLinuxホストでは実行可能なerrorを返します。
  明示的な `start --headless` リクエストは、その1回の起動に限って引き続き優先されます。
- `executablePath` はグローバルにも、ローカルmanaged profileごとにも設定できます。profileごとの値は `browser.executablePath` を上書きするため、異なるmanaged profileで別のChromium系browserを起動できます。
- `color`（トップレベルおよびprofileごと）はbrowser UIを着色し、どのprofileがアクティブかを見分けやすくします。
- デフォルトprofileは `openclaw`（managed standalone）です。サインイン済みuser browserを使うには `defaultProfile: "user"` を指定してください。
- 自動検出順: システムデフォルトbrowserがChromium系ならそれを使用。それ以外は Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` は、生のCDPではなくChrome DevTools MCPを使います。そのdriverには `cdpUrl` を設定しないでください。
- 既存セッションprofileを非デフォルトのChromium user profile（Brave、Edgeなど）にattachさせたい場合は `browser.profiles.<name>.userDataDir` を設定してください。

</Accordion>

</AccordionGroup>

## Brave（または他のChromium系browser）を使う

**システムデフォルト** browserがChromium系（Chrome/Brave/Edgeなど）なら、
OpenClawは自動でそれを使います。自動検出を上書きするには `browser.executablePath` を設定してください。`~` はOSのhome directoryに展開されます:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

または、platformごとにconfigで設定します:

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

profileごとの `executablePath` は、OpenClawが起動するローカルmanaged profileにのみ影響します。`existing-session` profileは代わりにすでに実行中のbrowserへattachし、remote CDP profileは `cdpUrl` の先にあるbrowserを使います。

## ローカル制御とリモート制御

- **ローカル制御（デフォルト）:** Gatewayがloopback control serviceを起動し、ローカルbrowserを起動できます。
- **リモート制御（node host）:** browserを持つマシン上でnode hostを実行します。Gatewayはbrowser actionをそのnodeへproxyします。
- **Remote CDP:** `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定して、
  remote Chromium系browserへattachします。この場合、OpenClawはローカルbrowserを起動しません。
- `headless` は、OpenClawが起動するローカルmanaged profileにのみ影響します。existing-sessionやremote CDP browserを再起動したり変更したりはしません。
- `executablePath` も同じくローカルmanaged profileルールに従います。実行中のローカルmanaged profileでこれを変更すると、その
  profileはrestart/reconcile対象としてマークされ、次回起動時に新しいbinaryが使われます。

停止時の挙動はprofile modeごとに異なります:

- ローカルmanaged profile: `openclaw browser stop` は、OpenClawが起動したbrowser processを停止します
- attach-onlyおよびremote CDP profile: `openclaw browser stop` は、アクティブな
  control sessionを閉じ、Playwright/CDP emulation override（viewport,
  color scheme, locale, timezone, offline mode など）を解放します。
  OpenClawがbrowser processを起動していなくても同様です

remote CDP URLにはauthを含められます:

- Query token（例: `https://provider.example?token=<token>`）
- HTTP Basic auth（例: `https://user:pass@provider.example`）

OpenClawは、`/json/*` endpoint呼び出し時と、
CDP WebSocket接続時の両方でauthを保持します。
tokenはconfig fileへcommitするより、環境変数やsecrets managerを優先してください。

## Node browser proxy（ゼロ設定デフォルト）

browserを持つマシン上で **node host** を実行している場合、OpenClawは
追加のbrowser設定なしでbrowser tool callをそのnodeへ自動ルーティングできます。
これはremote gateway向けのデフォルト経路です。

注記:

- node hostは、ローカルbrowser control serverを **proxy command** として公開します。
- profileはnode自身の `browser.profiles` configから取得されます（ローカルと同じ）。
- `nodeHost.browserProxy.allowProfiles` は任意です。空のままにすると従来/デフォルト挙動になり、設定済みのすべてのprofileがproxy経由で到達可能です。これにはprofile create/delete routeも含まれます。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClawはそれを最小権限境界として扱います。allowlistにあるprofileだけが対象となり、永続profile create/delete routeはproxyサーフェス上でブロックされます。
- 不要なら無効化できます:
  - node側: `nodeHost.browserProxy.enabled=false`
  - gateway側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型remote CDP）

[Browserless](https://browserless.io) は、HTTPSおよびWebSocket経由で
CDP接続URLを公開するホスト型Chromiumサービスです。OpenClawはどちらの形式も使えますが、
remote browser profileでは、もっとも簡単なのはBrowserlessのconnection docにある
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

注記:

- `<BROWSERLESS_API_KEY>` を実際のBrowserless tokenに置き換えてください。
- Browserlessアカウントに合うリージョンendpointを選んでください（詳細は公式doc参照）。
- BrowserlessがHTTPS base URLを渡してくる場合は、
  直接CDP接続用に `wss://` へ変換するか、HTTPS URLのままにしてOpenClawに
  `/json/version` を発見させることもできます。

## 直接WebSocket CDPプロバイダー

一部のホスト型browserサービスは、標準のHTTPベースCDP discovery（`/json/version`）ではなく、
**直接WebSocket** endpointを公開します。OpenClawは3種類の
CDP URL形状を受け付け、自動的に正しい接続戦略を選びます:

- **HTTP(S) discovery** — `http://host[:port]` または `https://host[:port]`。
  OpenClawは `/json/version` を呼び出してWebSocket debugger URLを発見し、
  それに接続します。WebSocketフォールバックはありません。
- **直接WebSocket endpoint** — `ws://host[:port]/devtools/<kind>/<id>` または
  `wss://...`。パスは `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 形式です。
  OpenClawは直接WebSocketハンドシェイクで接続し、
  `/json/version` は完全にスキップします。
- **素のWebSocket root** — `ws://host[:port]` または `wss://host[:port]`。`/devtools/...` パスなし
  （例: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)）。OpenClawはまずHTTP
  `/json/version` discoveryを試し（schemeを `http`/`https` に正規化）、
  それが `webSocketDebuggerUrl` を返した場合はそれを使います。返さない場合だけ、素のrootに対する直接WebSocketハンドシェイクへフォールバックします。これにより、ローカルChromeを指す素の `ws://` でも接続できます。Chromeは
  `/json/version` が返す、ターゲット固有の特定パスでのみ
  WebSocket upgradeを受け付けるためです。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みCAPTCHA解決、stealth mode、residential
proxyを備えた、headless browser実行用クラウドプラットフォームです。

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

注記:

- [Sign up](https://www.browserbase.com/sign-up) し、[Overview dashboard](https://www.browserbase.com/overview) から **API Key**
  をコピーしてください。
- `<BROWSERBASE_API_KEY>` を実際のBrowserbase API keyに置き換えてください。
- BrowserbaseはWebSocket connect時にbrowser sessionを自動作成するため、
  手動のsession作成手順は不要です。
- free tierでは、同時セッション1つ、月1 browser hourまでです。
  有料プランの上限は [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全なAPI
  リファレンス、SDKガイド、統合例は [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

重要な考え方:

- browser controlはloopback専用です。アクセスはGatewayのauthまたはnode pairingを通ります。
- スタンドアロンのloopback browser HTTP APIは **shared-secret authのみ** を使います:
  gateway token bearer auth、`x-openclaw-password`、または
  設定済みgateway passwordによるHTTP Basic authです。
- Tailscale Serve identity headerや `gateway.auth.mode: "trusted-proxy"` は、
  このスタンドアロンloopback browser APIを **認証しません**。
- browser controlが有効でshared-secret authが未設定の場合、OpenClawは
  起動時に `gateway.auth.token` を自動生成し、configへ永続化します。
- OpenClawは、`gateway.auth.mode` が
  `password`, `none`, `trusted-proxy` のいずれかである場合は、そのtokenを自動生成しません。
- Gatewayとnode hostはprivate network（Tailscale）上に保ち、
  公開しないようにしてください。
- remote CDP URL/tokenはsecretとして扱い、環境変数またはsecrets managerを優先してください。

remote CDPのヒント:

- 可能なら暗号化endpoint（HTTPSまたはWSS）と短命tokenを優先してください。
- 長寿命tokenをconfig fileへ直接埋め込むのは避けてください。

## プロファイル（マルチブラウザー）

OpenClawは複数の名前付きprofile（routing config）をサポートします。profileには次があります:

- **openclaw-managed**: 独自のuser data directory + CDP portを持つ、専用のChromium系browser instance
- **remote**: 明示的なCDP URL（別の場所で動作しているChromium系browser）
- **existing session**: Chrome DevTools MCP自動接続経由の既存Chrome profile

デフォルト:

- `openclaw` profileは、存在しない場合に自動作成されます。
- `user` profileは、Chrome MCP existing-session attach用に組み込みです。
- existing-session profileは `user` 以外ではオプトインです。`--driver existing-session` で作成してください。
- ローカルCDP portはデフォルトで **18800–18899** から割り当てられます。
- profileを削除すると、そのローカルdata directoryはTrashへ移動されます。

すべてのcontrol endpointは `?profile=<name>` を受け付けます。CLIでは `--browser-profile` を使います。

## Chrome DevTools MCP経由のexisting session

OpenClawは、公式Chrome DevTools MCPサーバーを通じて、実行中のChromium系browser profileにもattachできます。これにより、そのbrowser profileですでに開いているtabとlogin stateを再利用できます。

公式の背景説明とセットアップ参照:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みprofile:

- `user`

任意: 別の名前、色、browser data directoryが欲しい場合は、
独自のexisting-session profileを作成できます。

デフォルト挙動:

- 組み込みの `user` profileはChrome MCP auto-connectを使い、
  デフォルトのローカルGoogle Chrome profileを対象にします。

Brave、Edge、Chromium、または非デフォルトChrome profileには `userDataDir` を使ってください:

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

その後、対応するbrowserで:

1. そのbrowserのremote debugging向けinspect pageを開きます。
2. remote debuggingを有効にします。
3. browserを起動したままにし、OpenClawがattachするときに接続promptを承認します。

よく使うinspect page:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

live attach smoke test:

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
- `tabs` に、すでに開いているbrowser tabが一覧表示される
- `snapshot` が、選択されたlive tabからrefを返す

attachが動作しない場合の確認点:

- 対象のChromium系browserが version `144+` であること
- そのbrowserのinspect pageでremote debuggingが有効であること
- browserにattach consent promptが表示され、それを承認したこと
- `openclaw doctor` は、古いextensionベースbrowser configを移行し、
  デフォルトauto-connect profile向けにChromeがローカルにインストールされているか確認しますが、
  browser側のremote debugging有効化までは行えません

エージェントでの使用:

- ユーザーのログイン済みbrowser stateが必要な場合は `profile="user"` を使ってください。
- カスタムexisting-session profileを使っている場合は、その明示的なprofile名を渡してください。
- このモードは、ユーザーがコンピューターの前にいてattach
  promptを承認できる場合にのみ選んでください。
- Gatewayまたはnode hostは `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注記:

- この経路は、サインイン済みbrowser session内で動作できるため、分離された `openclaw` profileより高リスクです。
- OpenClawはこのdriver用にbrowserを起動しません。attachするだけです。
- OpenClawはここで公式Chrome DevTools MCPの `--autoConnect` フローを使います。
  `userDataDir` が設定されている場合は、そのuser data directoryを対象にするためにそのまま渡されます。
- existing-sessionは、選択されたhost上でも、接続された
  browser node経由でもattachできます。Chromeが別の場所にあり、browser nodeも接続されていない場合は、
  代わりにremote CDPまたはnode hostを使ってください。

### カスタムChrome MCP起動

デフォルトの
`npx chrome-devtools-mcp@latest` フローが望ましくない場合（offline host、
固定version、vendor binaryなど）は、profileごとに起動されるChrome DevTools MCPサーバーを上書きできます:

| フィールド   | 役割                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` の代わりに起動する実行ファイル。指定どおりに解決され、絶対パスもそのまま使われます。                              |
| `mcpArgs`    | `mcpCommand` にそのまま渡される引数配列。デフォルトの `chrome-devtools-mcp@latest --autoConnect` 引数を置き換えます。 |

existing-session profileで `cdpUrl` が設定されている場合、OpenClawは
`--autoConnect` をスキップし、そのendpointを自動でChrome MCPへ渡します:

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP discovery endpoint）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接CDP WebSocket）。

endpoint flagと `userDataDir` は併用できません。`cdpUrl` が設定されている場合、
Chrome MCP起動では `userDataDir` は無視されます。Chrome MCPはprofile
directoryを開くのではなく、endpointの背後で動作中のbrowserへattachするためです。

<Accordion title="existing-sessionの機能制限">

managed `openclaw` profileと比べると、existing-session driverには制限が多くあります:

- **Screenshot** — ページ全体のcaptureと `--ref` 要素captureは動作しますが、CSS `--element` selectorは使えません。`--full-page` は `--ref` や `--element` と組み合わせられません。ページ全体またはrefベース要素screenshotにはPlaywrightは不要です。
- **Action** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, `select` はsnapshot refが必要です（CSS selectorは不可）。`click-coords` は表示中viewport座標をクリックし、snapshot refを必要としません。`click` は左ボタンのみです。`type` は `slowly=true` をサポートしません。`fill` または `press` を使ってください。`press` は `delayMs` をサポートしません。`type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, `evaluate` は、呼び出しごとのtimeoutをサポートしません。`select` は単一値を受け付けます。
- **Wait / upload / dialog** — `wait --url` は完全一致、部分一致、glob patternをサポートします。`wait --load networkidle` はサポートされません。upload hookには `ref` または `inputRef` が必要で、1回につき1ファイルのみ、CSS `element` は不可です。dialog hookはtimeout overrideをサポートしません。
- **managed専用機能** — batch action、PDF export、download interception、`responsebody` は、引き続きmanaged browser pathが必要です。

</Accordion>

## 分離保証

- **専用user data dir**: 個人用browser profileには決して触れません。
- **専用port**: `9222` を避け、開発workflowとの衝突を防ぎます。
- **決定的なタブ制御**: `tabs` はまず `suggestedTargetId` を返し、その後に
  安定した `tabId` ハンドル（`t1` など）、任意のlabel、そして生の `targetId` を返します。
  エージェントは `suggestedTargetId` を再利用すべきです。生idは
  デバッグと互換性のために引き続き利用可能です。

## browser選択

ローカル起動時、OpenClawは利用可能な最初のものを選びます:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

platformごとの挙動:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, `/usr/lib/chromium-browser` 配下の一般的なChrome/Brave/Edge/Chromiumの場所を確認します。
- Windows: 一般的なインストール場所を確認します。

## Control API（任意）

スクリプト作成とデバッグのために、Gatewayは小さな **loopback専用HTTP
control API** と、それに対応する `openclaw browser` CLI（snapshot、ref、wait
power-up、JSON出力、debug workflow）も公開します。完全なリファレンスは
[Browser control API](/ja-JP/tools/browser-control) を参照してください。

## トラブルシューティング

Linux固有の問題（特にsnap Chromium）については、
[Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome分離ホスト構成については、
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP起動失敗とnavigation SSRFブロックの違い

これらは別の障害クラスであり、異なるコードパスを示します。

- **CDP起動または準備失敗** は、OpenClawがbrowser control planeの健全性を確認できないことを意味します。
- **Navigation SSRF block** は、browser control plane自体は健全だが、ページ遷移先がpolicyによって拒否されたことを意味します。

よくある例:

- CDP起動または準備失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Navigation SSRF block:
  - `start` と `tabs` は動くのに、`open`, `navigate`, snapshot, またはタブを開くフローがbrowser/network policy errorで失敗する

この最小手順で両者を切り分けてください:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗するなら、まずCDP readinessを調査してください。
- `start` は成功するのに `tabs` が失敗するなら、control planeは依然として不健全です。ページnavigationの問題ではなく、CDP reachability問題として扱ってください。
- `start` と `tabs` は成功するのに `open` や `navigate` が失敗するなら、browser control planeは起動しており、障害はnavigation policyまたはターゲットページ側にあります。
- `start`, `tabs`, `open` がすべて成功するなら、基本的なmanaged-browser control pathは健全です。

重要な挙動の詳細:

- browser configは、`browser.ssrfPolicy` を設定していなくても、デフォルトでfail-closedなSSRF policy objectになります。
- ローカルloopbackの `openclaw` managed profileでは、CDP health checkは意図的に、OpenClaw自身のローカルcontrol planeに対するbrowser SSRF reachability enforcementをスキップします。
- navigation保護は別です。`start` や `tabs` が成功しても、その後の `open` または `navigate` ターゲットが許可されることを意味しません。

セキュリティガイダンス:

- デフォルトでbrowser SSRF policyを緩めないでください。
- 広いprivate-networkアクセスより、`hostnameAllowlist` や `allowedHostnames` のような狭いhost例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、private-network browserアクセスが必要で、意図的に信頼されレビュー済みの環境でのみ使ってください。

## エージェントツール + 制御の仕組み

エージェントにはbrowser自動化用として **1つのツール** が渡されます:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定したUI tree（AIまたはARIA）を返します。
- `browser act` はsnapshotの `ref` IDを使って click/type/drag/select します。
- `browser screenshot` はpixel captureを行います（full page、element、またはlabel付きref）。
- `browser doctor` はGateway、plugin、profile、browser、tab readinessを確認します。
- `browser` は次を受け付けます:
  - `profile` で名前付きbrowser profile（openclaw、chrome、またはremote CDP）を選択します。
  - `target`（`sandbox` | `host` | `node`）でbrowserが存在する場所を選択します。
  - sandbox化されたsessionでは、`target: "host"` には `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` を省略した場合: sandbox化sessionではデフォルトで `sandbox`、非sandbox sessionではデフォルトで `host` になります。
  - browser-capableなnodeが接続されている場合、`target="host"` または `target="node"` を固定しない限り、ツールは自動でそこへルーティングされることがあります。

これにより、エージェントの挙動が決定的になり、壊れやすいselectorを避けられます。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのagent tool
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox環境でのbrowser control
- [Security](/ja-JP/gateway/security) — browser controlのリスクとハードニング
