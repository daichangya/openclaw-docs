---
read_when:
    - エージェント制御のブラウザ自動化を追加する
    - openclaw が自分の Chrome に干渉している理由をデバッグする
    - macOSアプリでブラウザ設定 + ライフサイクルを実装する
summary: 統合ブラウザ制御サービス + アクションコマンド
title: ブラウザ（OpenClaw管理）
x-i18n:
    generated_at: "2026-04-14T13:04:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae9ef725f544d4236d229f498c7187871c69bd18d31069b30a7e67fac53166a2
    source_path: tools/browser.md
    workflow: 15
---

# ブラウザ（openclaw管理）

OpenClaw は、エージェントが制御する**専用の Chrome/Brave/Edge/Chromium プロファイル**を実行できます。
これは個人用ブラウザから分離されており、Gateway 内の小さなローカル
制御サービス（loopback のみ）を通じて管理されます。

初心者向けの見方:

- これは**エージェント専用の別ブラウザ**だと考えてください。
- `openclaw` プロファイルは、個人用ブラウザプロファイルには**触れません**。
- エージェントは安全なレーンで**タブを開き、ページを読み取り、クリックし、入力**できます。
- 組み込みの `user` プロファイルは、Chrome MCP 経由で実際のサインイン済み Chrome セッションに接続します。

## 利用できるもの

- **openclaw** という名前の別ブラウザプロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（一覧表示/開く/フォーカス/閉じる）。
- エージェントアクション（クリック/入力/ドラッグ/選択）、スナップショット、スクリーンショット、PDF。
- オプションのマルチプロファイル対応（`openclaw`、`work`、`remote`、...）。

このブラウザは日常使いのメインブラウザでは**ありません**。これは
エージェントの自動化と検証のための、安全で分離された画面です。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示される場合は、config で有効にし（下記参照）、Gateway を
再起動してください。

`openclaw browser` 自体が見つからない場合、またはエージェントがブラウザツール
を利用できないと言う場合は、[ブラウザコマンドまたはツールが見つからない](/ja-JP/tools/browser#missing-browser-command-or-tool) に進んでください。

## Plugin 制御

デフォルトの `browser` ツールは、現在はデフォルトで有効になっているバンドル済み Plugin です。
つまり、OpenClaw の残りの Plugin システムを削除せずに、これを無効化または置き換えできます:

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

同じ `browser` ツール名を提供する別の Plugin をインストールする前に、バンドル済み Plugin を無効化してください。デフォルトのブラウザ体験には次の両方が必要です:

- `plugins.entries.browser.enabled` が無効化されていないこと
- `browser.enabled=true`

Plugin だけをオフにすると、バンドル済みブラウザ CLI（`openclaw browser`）、
Gateway メソッド（`browser.request`）、エージェントツール、デフォルトのブラウザ制御
サービスはすべてまとめて消えます。置き換え用 Plugin が再利用できるように、
`browser.*` config はそのまま保持されます。

バンドル済みブラウザ Plugin は、現在ブラウザランタイム実装も所有しています。
core には共有の Plugin SDK ヘルパーと、古い内部 import パス向けの互換性
re-export だけが残ります。実際には、ブラウザ Plugin パッケージを削除または
置き換えると、core が所有する 2 つ目のランタイムが残るのではなく、ブラウザ機能
一式が削除されます。

ブラウザ config の変更では、バンドル済み Plugin が新しい設定でブラウザサービスを
再登録できるように、引き続き Gateway の再起動が必要です。

## ブラウザコマンドまたはツールが見つからない

アップグレード後に `openclaw browser` が突然 unknown command になった場合、
またはエージェントがブラウザツールが見つからないと報告する場合、最も一般的な
原因は `browser` を含まない制限的な `plugins.allow` リストです。

壊れた config の例:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Plugin allowlist に `browser` を追加して修正してください:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

重要な注意点:

- `browser.enabled=true` だけでは、`plugins.allow` が設定されている場合は不十分です。
- `plugins.entries.browser.enabled=true` だけでも、`plugins.allow` が設定されている場合は不十分です。
- `tools.alsoAllow: ["browser"]` はバンドル済みブラウザ Plugin を読み込み**ません**。これは、Plugin がすでに読み込まれた後にツールポリシーを調整するだけです。
- 制限的な Plugin allowlist が不要であれば、`plugins.allow` を削除することでもデフォルトのバンドル済みブラウザ動作が復元されます。

典型的な症状:

- `openclaw browser` が unknown command になる。
- `browser.request` が見つからない。
- エージェントがブラウザツールを利用不可または未検出として報告する。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理された分離ブラウザ（拡張機能不要）。
- `user`: 実際の**サインイン済み Chrome** セッションに接続する組み込み Chrome MCP アタッチプロファイル。

エージェントのブラウザツール呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザを使用します。
- 既存のログイン済みセッションが重要で、ユーザーが PC の前にいてアタッチプロンプトをクリック/承認できる場合は `profile="user"` を優先します。
- `profile` は、特定のブラウザモードを使いたいときの明示的なオーバーライドです。

デフォルトで managed モードを使いたい場合は `browser.defaultProfile: "openclaw"` を設定してください。

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

- ブラウザ制御サービスは `gateway.port` から導出されたポートで loopback にバインドされます
  （デフォルト: `18791`、つまり gateway + 2）。
- Gateway ポート（`gateway.port` または `OPENCLAW_GATEWAY_PORT`）をオーバーライドすると、
  同じ「ファミリー」を保つために導出ブラウザポートもずれます。
- `cdpUrl` が未設定の場合は、managed なローカル CDP ポートがデフォルトになります。
- `remoteCdpTimeoutMs` は remote（非 loopback）CDP 到達性チェックに適用されます。
- `remoteCdpHandshakeTimeoutMs` は remote CDP WebSocket 到達性チェックに適用されます。
- ブラウザのナビゲーション/タブを開く処理は、ナビゲーション前に SSRF ガードされ、ナビゲーション後の最終 `http(s)` URL に対してベストエフォートで再チェックされます。
- strict SSRF モードでは、remote CDP エンドポイントの検出/プローブ（`cdpUrl`、`/json/version` 参照を含む）もチェックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` はデフォルトで無効です。意図的に private-network ブラウザアクセスを信頼する場合にのみ `true` に設定してください。
- `browser.ssrfPolicy.allowPrivateNetwork` は互換性のための legacy alias として引き続きサポートされています。
- `attachOnly: true` は「ローカルブラウザを決して起動せず、すでに実行中の場合のみ接続する」ことを意味します。
- `color` とプロファイルごとの `color` はブラウザ UI を色付けし、どのプロファイルがアクティブかを見分けられるようにします。
- デフォルトプロファイルは `openclaw`（OpenClaw 管理のスタンドアロンブラウザ）です。サインイン済みユーザーブラウザを使うには `defaultProfile: "user"` を指定してください。
- 自動検出順序: システムのデフォルトブラウザが Chromium ベースならそれを使用し、そうでなければ Chrome → Brave → Edge → Chromium → Chrome Canary の順です。
- ローカル `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。これらは remote CDP に対してのみ設定してください。
- `driver: "existing-session"` は raw CDP の代わりに Chrome DevTools MCP を使用します。この
  driver には `cdpUrl` を設定しないでください。
- `browser.profiles.<name>.userDataDir` は、existing-session プロファイルを
  Brave や Edge などの非デフォルト Chromium ユーザープロファイルに接続させたい場合に設定してください。

## Brave（または別の Chromium ベースブラウザ）を使う

**システムのデフォルト**ブラウザが Chromium ベース（Chrome/Brave/Edge など）の場合、
OpenClaw は自動的にそれを使用します。自動検出をオーバーライドするには
`browser.executablePath` を設定してください:

CLI の例:

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

- **ローカル制御（デフォルト）:** Gateway が loopback 制御サービスを起動し、ローカルブラウザを起動できます。
- **リモート制御（node host）:** ブラウザを持つマシン上で node host を実行すると、Gateway がブラウザアクションをそこへプロキシします。
- **remote CDP:** `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定すると、
  remote の Chromium ベースブラウザに接続できます。この場合、OpenClaw はローカルブラウザを起動しません。

停止時の動作はプロファイルモードによって異なります:

- ローカル managed プロファイル: `openclaw browser stop` は
  OpenClaw が起動したブラウザプロセスを停止します
- attach-only および remote CDP プロファイル: `openclaw browser stop` はアクティブな
  制御セッションを閉じ、Playwright/CDP のエミュレーションオーバーライド（ビューポート、
  カラースキーム、ロケール、タイムゾーン、オフラインモード、その他同様の状態）を解除します。
  OpenClaw がブラウザプロセスを起動していない場合でも同様です

remote CDP URL には auth を含めることができます:

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic auth（例: `https://user:pass@provider.example`）

OpenClaw は `/json/*` エンドポイントを呼び出すときも、CDP WebSocket に接続するときも
その auth を保持します。トークンは config ファイルにコミットするのではなく、
環境変数や secrets manager を使うことを推奨します。

## Node ブラウザプロキシ（ゼロ設定デフォルト）

ブラウザがあるマシンで **node host** を実行している場合、OpenClaw は
追加のブラウザ設定なしでブラウザツール呼び出しをその node に自動ルーティングできます。
これは remote gateway のデフォルト経路です。

注意:

- node host はそのローカルブラウザ制御サーバーを**プロキシコマンド**として公開します。
- プロファイルは node 自身の `browser.profiles` config から取得されます（ローカルと同じ）。
- `nodeHost.browserProxy.allowProfiles` はオプションです。空のままにすると legacy/default の動作になり、プロファイル作成/削除ルートを含め、設定済みのすべてのプロファイルがプロキシ経由で到達可能なままになります。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClaw はそれを最小権限境界として扱います。allowlist に載ったプロファイルだけを対象にでき、永続プロファイルの作成/削除ルートはプロキシ画面でブロックされます。
- 不要であれば無効化してください:
  - node 側: `nodeHost.browserProxy.enabled=false`
  - gateway 側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型 remote CDP）

[Browserless](https://browserless.io) は、HTTPS と WebSocket 経由で
CDP 接続 URL を公開するホスト型 Chromium サービスです。OpenClaw はどちらの形式も使用できますが、
remote ブラウザプロファイルでは、最も簡単な方法は Browserless の接続ドキュメントにある
直接 WebSocket URL を使うことです。

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

- `<BROWSERLESS_API_KEY>` は実際の Browserless トークンに置き換えてください。
- Browserless アカウントに対応するリージョンエンドポイントを選んでください（詳細は各種ドキュメントを参照）。
- Browserless から HTTPS ベース URL が提供される場合は、それを
  直接 CDP 接続用の `wss://` に変換するか、HTTPS URL のままにして OpenClaw に
  `/json/version` を検出させることができます。

## 直接 WebSocket CDP プロバイダー

一部のホスト型ブラウザサービスは、標準の HTTP ベース CDP 検出（`/json/version`）ではなく
**直接 WebSocket** エンドポイントを公開しています。OpenClaw は両方をサポートします:

- **HTTP(S) エンドポイント** — OpenClaw は `/json/version` を呼び出して
  WebSocket デバッガー URL を検出し、その後接続します。
- **WebSocket エンドポイント**（`ws://` / `wss://`）— OpenClaw は直接接続し、
  `/json/version` をスキップします。これは
  [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)、または WebSocket URL を渡す
  任意のプロバイダーのようなサービスに使用してください。

### Browserbase

[Browserbase](https://www.browserbase.com) は、組み込みの CAPTCHA 解決、ステルスモード、
住宅用プロキシを備えた headless ブラウザ実行用のクラウドプラットフォームです。

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

- [登録](https://www.browserbase.com/sign-up) して、[Overview ダッシュボード](https://www.browserbase.com/overview)から **API Key**
  をコピーしてください。
- `<BROWSERBASE_API_KEY>` は実際の Browserbase API キーに置き換えてください。
- Browserbase は WebSocket 接続時にブラウザセッションを自動作成するため、
  手動のセッション作成ステップは不要です。
- 無料プランでは、同時セッション 1 つ、月あたり 1 ブラウザ時間まで利用できます。
  有料プランの上限は [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全な API リファレンス、SDK ガイド、統合例については
  [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

重要な考え方:

- ブラウザ制御は loopback 専用です。アクセスは Gateway の auth または node ペアリングを通ります。
- スタンドアロンの loopback ブラウザ HTTP API は**shared-secret auth のみ**を使用します:
  gateway token bearer auth、`x-openclaw-password`、または
  設定済み gateway password を使う HTTP Basic auth です。
- Tailscale Serve の identity header と `gateway.auth.mode: "trusted-proxy"` は
  このスタンドアロン loopback ブラウザ API を**認証しません**。
- ブラウザ制御が有効で、shared-secret auth が未設定の場合、OpenClaw は
  起動時に `gateway.auth.token` を自動生成して config に永続化します。
- `gateway.auth.mode` がすでに
  `password`、`none`、または `trusted-proxy` の場合、OpenClaw はその token を自動生成**しません**。
- Gateway と node host は private network（Tailscale）上に維持し、public に公開しないでください。
- remote CDP URL/token は secrets として扱い、環境変数や secrets manager を優先してください。

remote CDP のヒント:

- 可能であれば暗号化されたエンドポイント（HTTPS または WSS）と短命トークンを優先してください。
- 長期間有効なトークンを config ファイルに直接埋め込むのは避けてください。

## プロファイル（マルチブラウザ）

OpenClaw は複数の名前付きプロファイル（ルーティング設定）をサポートしています。プロファイルには次の種類があります:

- **openclaw-managed**: 専用の user data directory + CDP port を持つ、専用の Chromium ベースブラウザインスタンス
- **remote**: 明示的な CDP URL（別の場所で実行中の Chromium ベースブラウザ）
- **existing session**: Chrome DevTools MCP 自動接続経由の、既存の Chrome プロファイル

デフォルト:

- `openclaw` プロファイルは、存在しない場合は自動作成されます。
- `user` プロファイルは、Chrome MCP existing-session 接続用に組み込まれています。
- existing-session プロファイルは `user` 以外ではオプトインです。`--driver existing-session` で作成してください。
- ローカル CDP ポートはデフォルトで **18800–18899** から割り当てられます。
- プロファイルを削除すると、そのローカル data directory は Trash に移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け付けます。CLI は `--browser-profile` を使用します。

## Chrome DevTools MCP 経由の existing-session

OpenClaw は、公式の Chrome DevTools MCP サーバーを通じて、実行中の Chromium ベースブラウザプロファイルにも接続できます。
これにより、そのブラウザプロファイルですでに開かれているタブとログイン状態を再利用できます。

公式の背景情報とセットアップ参照:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

オプション: 別の名前、色、または browser data directory を使いたい場合は、
独自の custom existing-session プロファイルを作成できます。

デフォルト動作:

- 組み込みの `user` プロファイルは Chrome MCP auto-connect を使用し、
  ローカルのデフォルト Google Chrome プロファイルを対象にします。

Brave、Edge、Chromium、またはデフォルト以外の Chrome プロファイルには `userDataDir` を使ってください:

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

次に、対応するブラウザで以下を行います:

1. そのブラウザのリモートデバッグ用 inspect page を開きます。
2. リモートデバッグを有効にします。
3. ブラウザを起動したままにし、OpenClaw が接続するときに接続確認プロンプトを承認します。

一般的な inspect page:

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

成功時の状態:

- `status` に `driver: existing-session` が表示される
- `status` に `transport: chrome-mcp` が表示される
- `status` に `running: true` が表示される
- `tabs` に、すでに開いているブラウザタブが一覧表示される
- `snapshot` が選択中のライブタブから refs を返す

接続できない場合に確認すること:

- 対象の Chromium ベースブラウザがバージョン `144+` である
- そのブラウザの inspect page でリモートデバッグが有効になっている
- ブラウザに接続確認プロンプトが表示され、それを承認した
- `openclaw doctor` は古い拡張機能ベースのブラウザ config を移行し、
  デフォルト auto-connect プロファイル用に Chrome がローカルにインストールされているかを確認しますが、
  ブラウザ側のリモートデバッグを代わりに有効化することはできません

エージェントでの使用:

- ユーザーのログイン済みブラウザ状態が必要な場合は `profile="user"` を使用します。
- custom existing-session プロファイルを使う場合は、その明示的なプロファイル名を渡します。
- このモードは、ユーザーが PC の前にいて接続確認プロンプトを承認できる場合にのみ選択してください。
- Gateway または node host は `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

注意:

- この経路は分離された `openclaw` プロファイルより高リスクです。サインイン済みブラウザセッション内で操作できるためです。
- この driver では OpenClaw はブラウザを起動しません。既存セッションにのみ接続します。
- OpenClaw はここで公式の Chrome DevTools MCP `--autoConnect` フローを使用します。
  `userDataDir` が設定されている場合、OpenClaw はそれを渡して、その明示的な
  Chromium user data directory を対象にします。
- existing-session のスクリーンショットは、ページキャプチャとスナップショットからの `--ref` 要素
  キャプチャをサポートしますが、CSS `--element` セレクターはサポートしません。
- existing-session のページスクリーンショットは、Chrome MCP 経由で Playwright なしでも動作します。
  ref ベースの要素スクリーンショット（`--ref`）も同様に動作しますが、`--full-page`
  は `--ref` や `--element` と組み合わせられません。
- existing-session のアクションは、managed browser の
  経路よりもまだ制限があります:
  - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` は
    CSS セレクターではなく snapshot refs を必要とします
  - `click` は左ボタンのみです（ボタンオーバーライドや修飾キーは不可）
  - `type` は `slowly=true` をサポートしません。`fill` または `press` を使用してください
  - `press` は `delayMs` をサポートしません
  - `hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は
    呼び出しごとの timeout オーバーライドをサポートしません
  - `select` は現在 1 つの値のみサポートします
- existing-session の `wait --url` は、他の browser driver と同様に exact、substring、
  glob パターンをサポートします。`wait --load networkidle` はまだサポートされていません。
- existing-session の upload hook は `ref` または `inputRef` を必要とし、
  1 度に 1 ファイルのみサポートし、CSS `element` ターゲティングはサポートしません。
- existing-session の dialog hook は timeout オーバーライドをサポートしません。
- 一部の機能は依然として managed browser の経路が必要です。これには batch
  actions、PDF export、download interception、`responsebody` が含まれます。
- existing-session は host-local です。Chrome が別のマシン上にあるか、
  別の network namespace にある場合は、代わりに remote CDP または node host を使用してください。

## 分離の保証

- **専用 user data dir**: 個人用ブラウザプロファイルには一切触れません。
- **専用ポート**: 開発ワークフローとの衝突を避けるため `9222` を使用しません。
- **決定的なタブ制御**: 「最後のタブ」ではなく `targetId` でタブを対象指定します。

## ブラウザの選択

ローカルで起動する場合、OpenClaw は利用可能な最初のものを選びます:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` でオーバーライドできます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `google-chrome`、`brave`、`microsoft-edge`、`chromium` などを探します。
- Windows: 一般的なインストール場所を確認します。

## 制御 API（オプション）

ローカル統合専用として、Gateway は小さな loopback HTTP API を公開します:

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

shared-secret gateway auth が設定されている場合、ブラウザ HTTP ルートにも auth が必要です:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはその password を使う HTTP Basic auth

注意:

- このスタンドアロン loopback ブラウザ API は `trusted-proxy` や
  Tailscale Serve の identity header を使用しません。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合、これらの loopback browser
  ルートはそれらの identity-bearing モードを継承しません。loopback 専用のままにしてください。

### `/act` エラー契約

`POST /act` は、ルートレベルのバリデーションと
ポリシー失敗に対して構造化されたエラーレスポンスを使用します:

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED`（HTTP 400）: `kind` が欠落しているか認識されません。
- `ACT_INVALID_REQUEST`（HTTP 400）: アクションペイロードの正規化またはバリデーションに失敗しました。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）: 未対応のアクション種別で `selector` が使われました。
- `ACT_EVALUATE_DISABLED`（HTTP 403）: config により `evaluate`（または `wait --fn`）が無効です。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）: トップレベルまたはバッチ化された `targetId` がリクエスト対象と競合しています。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）: このアクションは existing-session プロファイルではサポートされません。

その他のランタイム失敗では、依然として
`code` フィールドなしの `{ "error": "<message>" }` が返る場合があります。

### Playwright 要件

一部の機能（navigate/act/AI snapshot/role snapshot、要素スクリーンショット、
PDF）には Playwright が必要です。Playwright がインストールされていない場合、
それらのエンドポイントは明確な 501 エラーを返します。

Playwright なしでも引き続き動作するもの:

- ARIA snapshots
- タブごとの CDP WebSocket が利用可能な場合の、managed `openclaw` browser のページ
  スクリーンショット
- `existing-session` / Chrome MCP プロファイルのページスクリーンショット
- snapshot 出力からの `existing-session` の ref ベーススクリーンショット（`--ref`）

引き続き Playwright が必要なもの:

- `navigate`
- `act`
- AI snapshots / role snapshots
- CSS セレクター要素スクリーンショット（`--element`）
- 完全な browser PDF export

要素スクリーンショットでは `--full-page` も拒否されます。このルートは `fullPage is
not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` と表示された場合は、完全な
Playwright パッケージ（`playwright-core` ではなく）をインストールして gateway を再起動するか、
ブラウザサポート付きで OpenClaw を再インストールしてください。

#### Docker での Playwright インストール

Gateway が Docker 上で動作している場合は、`npx playwright` を避けてください（npm の override 競合が発生します）。
代わりに、バンドル済み CLI を使用してください:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ブラウザダウンロードを永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（例:
`/home/node/.cache/ms-playwright`）を設定し、`OPENCLAW_HOME_VOLUME` または bind mount によって
`/home/node` が永続化されるようにしてください。[Docker](/ja-JP/install/docker) を参照してください。

## 仕組み（内部）

高レベルのフロー:

- 小さな**制御サーバー**が HTTP リクエストを受け付けます。
- **CDP** 経由で Chromium ベースブラウザ（Chrome/Brave/Edge/Chromium）に接続します。
- 高度なアクション（クリック/入力/スナップショット/PDF）には、CDP の上に
  **Playwright** を使用します。
- Playwright がない場合は、Playwright を必要としない操作のみ利用できます。

この設計により、エージェントは安定した決定的インターフェース上で動作しつつ、
ローカル/リモートのブラウザやプロファイルを切り替えられます。

## CLI クイックリファレンス

すべてのコマンドは、特定のプロファイルを対象にするために `--browser-profile <name>` を受け付けます。
また、すべてのコマンドは machine-readable な出力（安定したペイロード）のために `--json` も受け付けます。

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

- attach-only および remote CDP プロファイルでは、テスト後の適切なクリーンアップコマンドは
  引き続き `openclaw browser stop` です。これは、基盤となる
  ブラウザを終了する代わりに、アクティブな制御セッションを閉じて
  一時的なエミュレーションオーバーライドをクリアします。
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

- `upload` と `dialog` は**事前準備**の呼び出しです。ファイル選択ダイアログ/ダイアログを
  発生させる click/press の前に実行してください。
- ダウンロードと trace の出力パスは OpenClaw の temp ルートに制限されています:
  - traces: `/tmp/openclaw`（フォールバック: `${os.tmpdir()}/openclaw`）
  - downloads: `/tmp/openclaw/downloads`（フォールバック: `${os.tmpdir()}/openclaw/downloads`）
- upload パスは OpenClaw の temp uploads ルートに制限されています:
  - uploads: `/tmp/openclaw/uploads`（フォールバック: `${os.tmpdir()}/openclaw/uploads`）
- `upload` は `--input-ref` または `--element` を使って file input を直接設定することもできます。
- `snapshot`:
  - `--format ai`（Playwright インストール時のデフォルト）: 数値 refs（`aria-ref="<n>"`）を含む AI snapshot を返します。
  - `--format aria`: アクセシビリティツリーを返します（refs なし、検査専用）。
  - `--efficient`（または `--mode efficient`）: compact role snapshot プリセット（interactive + compact + depth + 低めの maxChars）。
  - config デフォルト（tool/CLI のみ）: 呼び出し元が mode を渡さない場合に efficient snapshots を使うには `browser.snapshotDefaults.mode: "efficient"` を設定してください（[Gateway configuration](/ja-JP/gateway/configuration-reference#browser) を参照）。
  - Role snapshot オプション（`--interactive`、`--compact`、`--depth`、`--selector`）は、`ref=e12` のような refs を持つ role-based snapshot を強制します。
  - `--frame "<iframe selector>"` は role snapshots の対象を iframe に限定します（`e12` のような role refs と組み合わせます）。
  - `--interactive` は、インタラクティブ要素のフラットで選びやすい一覧を出力します（アクション操作に最適）。
  - `--labels` は、重ね合わせられた ref ラベル付きのビューポート限定スクリーンショットを追加します（`MEDIA:<path>` を出力します）。
- `click`/`type` などには、`snapshot` からの `ref`（数値の `12` または role ref の `e12`）が必要です。
  アクションに CSS セレクターは意図的にサポートされていません。

## スナップショットと refs

OpenClaw は 2 種類の「snapshot」スタイルをサポートしています:

- **AI snapshot（数値 refs）**: `openclaw browser snapshot`（デフォルト、`--format ai`）
  - 出力: 数値 refs を含むテキストスナップショット。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部的には、ref は Playwright の `aria-ref` 経由で解決されます。

- **Role snapshot（`e12` のような role refs）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（およびオプションの `[nth=1]`）を含む role-based の一覧/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部的には、ref は `getByRole(...)`（重複時は `nth()` を追加）で解決されます。
  - オーバーレイされた `e12` ラベル付きビューポートスクリーンショットを含めるには `--labels` を追加してください。

ref の動作:

- refs は**ナビゲーションをまたいで安定しません**。失敗した場合は `snapshot` を再実行して新しい ref を使ってください。
- role snapshot が `--frame` 付きで取得された場合、role refs は次の role snapshot までその iframe にスコープされます。

## Wait の強化機能

time/text だけでなく、さらに多くの条件で待機できます:

- URL を待つ（Playwright がサポートする glob を使用可能）:
  - `openclaw browser wait --url "**/dash"`
- load state を待つ:
  - `openclaw browser wait --load networkidle`
- JS predicate を待つ:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが表示状態になるのを待つ:
  - `openclaw browser wait "#main"`

これらは組み合わせ可能です:

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
2. `click <ref>` / `type <ref>` を使う（interactive mode では role refs を推奨）
3. まだ失敗する場合: `openclaw browser highlight <ref>` で Playwright が何を対象にしているかを確認する
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 詳細デバッグには trace を記録する:
   - `openclaw browser trace start`
   - 問題を再現する
   - `openclaw browser trace stop`（`TRACE:<path>` を出力します）

## JSON 出力

`--json` はスクリプト処理や構造化ツール向けです。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON の role snapshots には `refs` に加えて小さな `stats` ブロック（lines/chars/refs/interactive）が含まれ、
ツールがペイロードサイズや密度を判断できるようになっています。

## 状態と環境の調整項目

これらは「サイトを X のように振る舞わせる」ワークフローで役立ちます:

- Cookies: `cookies`、`cookies set`、`cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'`（legacy の `set headers --json '{"X-Debug":"1"}'` も引き続きサポートされます）
- HTTP basic auth: `set credentials user pass`（または `--clear`）
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`、`set locale ...`
- Device / viewport:
  - `set device "iPhone 14"`（Playwright の device preset）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw browser プロファイルにはログイン済みセッションが含まれる場合があります。機密情報として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn` は
  ページコンテキストで任意の JavaScript を実行します。プロンプトインジェクションにより
  これが誘導される可能性があります。不要であれば `browser.evaluateEnabled=false` で無効にしてください。
- ログインやアンチボットに関する注意（X/Twitter など）については、[Browser login + X/Twitter posting](/ja-JP/tools/browser-login) を参照してください。
- Gateway/node host は private（loopback または tailnet-only）に保ってください。
- remote CDP エンドポイントは強力です。トンネル化し、保護してください。

strict-mode の例（デフォルトで private/internal 宛先をブロック）:

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

Linux 固有の問題（特に snap Chromium）については、
[Browser troubleshooting](/ja-JP/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の split-host 構成については、
[WSL2 + Windows + remote Chrome CDP troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

### CDP 起動失敗とナビゲーション SSRF ブロックの違い

これらは異なる失敗クラスであり、異なるコードパスを示します。

- **CDP 起動または readiness 失敗** は、OpenClaw がブラウザ制御プレーンの正常性を確認できないことを意味します。
- **ナビゲーション SSRF ブロック** は、ブラウザ制御プレーン自体は正常だが、ページナビゲーション先がポリシーによって拒否されたことを意味します。

よくある例:

- CDP 起動または readiness 失敗:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- ナビゲーション SSRF ブロック:
  - `start` と `tabs` は動作するのに、`open`、`navigate`、snapshot、またはタブを開くフローがブラウザ/ネットワークポリシーエラーで失敗する

この最小シーケンスで両者を切り分けてください:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

結果の読み方:

- `start` が `not reachable after start` で失敗する場合は、まず CDP readiness をトラブルシュートしてください。
- `start` は成功しても `tabs` が失敗する場合、制御プレーンは依然として不健全です。これはページナビゲーションの問題ではなく、CDP 到達性の問題として扱ってください。
- `start` と `tabs` は成功するが `open` または `navigate` が失敗する場合、ブラウザ制御プレーンは起動しており、失敗はナビゲーションポリシーまたは対象ページ側にあります。
- `start`、`tabs`、`open` がすべて成功する場合、基本的な managed-browser 制御経路は正常です。

重要な動作の詳細:

- `browser.ssrfPolicy` を設定していない場合でも、browser config はデフォルトで fail-closed の SSRF policy object になります。
- ローカル loopback の `openclaw` managed プロファイルでは、CDP 正常性チェックは意図的に OpenClaw 自身のローカル制御プレーンに対する browser SSRF 到達性強制をスキップします。
- ナビゲーション保護は別です。`start` や `tabs` が成功しても、その後の `open` や `navigate` の対象が許可されていることは意味しません。

セキュリティガイダンス:

- デフォルトで browser SSRF policy を緩めては**いけません**。
- 広範な private-network アクセスよりも、`hostnameAllowlist` や `allowedHostnames` のような狭いホスト例外を優先してください。
- `dangerouslyAllowPrivateNetwork: true` は、private-network ブラウザアクセスが必要でレビュー済みの、意図的に信頼された環境でのみ使用してください。

例: ナビゲーションはブロックされるが、制御プレーンは正常

- `start` は成功する
- `tabs` は成功する
- `open http://internal.example` は失敗する

通常これは、ブラウザ起動自体は問題なく、ナビゲーション先についてポリシーレビューが必要であることを意味します。

例: ナビゲーション以前に起動がブロックされる

- `start` が `not reachable after start` で失敗する
- `tabs` も失敗するか、実行できない

これはページ URL allowlist の問題ではなく、ブラウザ起動または CDP 到達性を示します。

## エージェントツール + 制御の仕組み

エージェントはブラウザ自動化用に**1 つのツール**を取得します:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

マッピング方法:

- `browser snapshot` は安定した UI ツリー（AI または ARIA）を返します。
- `browser act` は snapshot の `ref` ID を使って click/type/drag/select を行います。
- `browser screenshot` はピクセルをキャプチャします（フルページまたは要素）。
- `browser` は次を受け付けます:
  - `profile`: 名前付きブラウザプロファイル（openclaw、chrome、または remote CDP）を選択します。
  - `target`（`sandbox` | `host` | `node`）: ブラウザが存在する場所を選択します。
  - sandboxed session では、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要です。
  - `target` が省略された場合: sandboxed session はデフォルトで `sandbox`、非 sandbox session はデフォルトで `host` になります。
  - browser 対応の node が接続されている場合、`target="host"` または `target="node"` で固定しない限り、ツールは自動的にそこへルーティングされることがあります。

これにより、エージェントの動作を決定的に保ち、壊れやすいセレクターを避けられます。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandbox 環境でのブラウザ制御
- [Security](/ja-JP/gateway/security) — ブラウザ制御のリスクとハードニング
