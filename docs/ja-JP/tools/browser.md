---
read_when:
    - エージェント制御のブラウザー自動化を追加する
    - openclaw が自分の Chrome に干渉している理由をデバッグする
    - macOS アプリでブラウザー設定 + ライフサイクルを実装する
summary: 統合ブラウザー制御サービス + アクションコマンド
title: ブラウザー（OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-05T13:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a41162efd397ea918469e16aa67e554bcbb517b3112df1d3e7927539b6a0926a
    source_path: tools/browser.md
    workflow: 15
---

# ブラウザー（openclaw 管理）

OpenClaw は、エージェントが制御する **専用の Chrome/Brave/Edge/Chromium プロファイル** を実行できます。
これは個人用ブラウザーから分離されており、Gateway 内の小さなローカル制御サービス
（loopback のみ）を通じて管理されます。

初心者向けの見方:

- これは **エージェント専用の別ブラウザー** だと考えてください。
- `openclaw` プロファイルは **個人用ブラウザープロファイルには触れません**。
- エージェントは安全なレーン内で **タブを開き、ページを読み、クリックし、入力できます**。
- 組み込みの `user` プロファイルは、Chrome MCP を通じて実際のサインイン済み Chrome セッションに接続します。

## できること

- **openclaw** という名前の別ブラウザープロファイル（デフォルトではオレンジのアクセント）。
- 決定的なタブ制御（一覧/開く/フォーカス/閉じる）。
- エージェントアクション（クリック/入力/ドラッグ/選択）、snapshot、スクリーンショット、PDF。
- 任意のマルチプロファイル対応（`openclaw`、`work`、`remote`、...）。

このブラウザーは **日常使い用ではありません**。エージェント自動化と検証のための、
安全で分離されたサーフェスです。

## クイックスタート

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

「Browser disabled」と表示される場合は、設定で有効化し（下記参照）、Gateway を
再起動してください。

`openclaw browser` コマンド自体が見つからない場合、またはエージェントがブラウザーツール
を利用できないと言う場合は、[ブラウザーコマンドまたはツールがない](/tools/browser#missing-browser-command-or-tool) に進んでください。

## plugin 制御

デフォルトの `browser` ツールは、現在デフォルトで有効なバンドル済み plugin です。
つまり、OpenClaw の残りの plugin システムを削除せずに、これを無効化または置き換えることができます。

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

同じ `browser` ツール名を提供する別 plugin をインストールする前に、このバンドル済み plugin を無効化してください。デフォルトのブラウザー体験には次の両方が必要です。

- `plugins.entries.browser.enabled` が無効化されていない
- `browser.enabled=true`

plugin だけを無効にすると、バンドル済みブラウザー CLI（`openclaw browser`）、
Gateway メソッド（`browser.request`）、エージェントツール、およびデフォルトのブラウザー制御
サービスはすべて一緒に消えます。`browser.*` 設定は、置き換え plugin が再利用できるようそのまま残ります。

バンドル済みブラウザー plugin は、現在ブラウザーランタイム実装も所有しています。
core に残るのは、共有 Plugin SDK ヘルパーと、古い内部 import パス向けの互換性 re-export のみです。実際には、ブラウザー
plugin パッケージを削除または置き換えると、core 所有の 2 つ目のランタイムが残るのではなく、
ブラウザー機能セット全体がなくなります。

ブラウザー設定の変更では、バンドル済み plugin が新しい設定でブラウザーサービスを再登録できるよう、
引き続き Gateway の再起動が必要です。

## ブラウザーコマンドまたはツールがない

アップグレード後に `openclaw browser` が突然 unknown command になった場合、または
エージェントがブラウザーツールがないと報告する場合、最もよくある原因は
`browser` を含まない制限的な `plugins.allow` リストです。

壊れた設定の例:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

`browser` を plugin allowlist に追加して修正してください。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

重要な注意事項:

- `plugins.allow` が設定されている場合、`browser.enabled=true` だけでは不十分です。
- `plugins.allow` が設定されている場合、`plugins.entries.browser.enabled=true` だけでも不十分です。
- `tools.alsoAllow: ["browser"]` は、バンドル済み browser plugin をロードしません。これは、plugin がすでにロードされた後でツールポリシーを調整するだけです。
- 制限的な plugin allowlist が不要なら、`plugins.allow` を削除することでもデフォルトのバンドル済みブラウザー動作が復元されます。

典型的な症状:

- `openclaw browser` が unknown command になる。
- `browser.request` がない。
- エージェントがブラウザーツールを利用不可または欠如として報告する。

## プロファイル: `openclaw` と `user`

- `openclaw`: 管理された分離ブラウザー（拡張不要）。
- `user`: **実際のサインイン済み Chrome**
  セッション用の組み込み Chrome MCP 接続プロファイル。

エージェントのブラウザーツール呼び出しでは:

- デフォルト: 分離された `openclaw` ブラウザーを使用します。
- 既存のログイン済みセッションが重要で、ユーザーが PC の前にいて接続プロンプトをクリック/承認できる場合は `profile="user"` を優先します。
- 特定のブラウザーモードを使いたい場合、`profile` が明示的な上書きになります。

管理モードをデフォルトにしたい場合は、`browser.defaultProfile: "openclaw"` を設定してください。

## 設定

ブラウザー設定は `~/.openclaw/openclaw.json` にあります。

```json5
{
  browser: {
    enabled: true, // デフォルト: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // デフォルトの trusted-network モード
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy な単一プロファイル上書き
    remoteCdpTimeoutMs: 1500, // リモート CDP HTTP タイムアウト（ms）
    remoteCdpHandshakeTimeoutMs: 3000, // リモート CDP WebSocket ハンドシェイクタイムアウト（ms）
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

補足:

- ブラウザー制御サービスは、`gateway.port`
  から導出されたポートで loopback に bind されます
  （デフォルト: `18791`、つまり gateway + 2）。
- Gateway ポート（`gateway.port` または `OPENCLAW_GATEWAY_PORT`）を上書きすると、
  導出されるブラウザーポートも同じ「ファミリー」を保つようにずれます。
- `cdpUrl` が未設定の場合、デフォルトでは管理されたローカル CDP ポートになります。
- `remoteCdpTimeoutMs` はリモート（非 loopback）の CDP 到達性チェックに適用されます。
- `remoteCdpHandshakeTimeoutMs` はリモート CDP WebSocket 到達性チェックに適用されます。
- ブラウザーのナビゲーション/タブオープンは、ナビゲーション前に SSRF ガードされ、ナビゲーション後の最終 `http(s)` URL に対してもベストエフォートで再確認されます。
- strict SSRF モードでは、リモート CDP エンドポイントの discovery/probe（`cdpUrl` と `/json/version` 参照を含む）もチェックされます。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` のデフォルトは `true`（trusted-network モデル）です。strict な public-only ブラウジングにするには `false` に設定してください。
- `browser.ssrfPolicy.allowPrivateNetwork` は、互換性のために引き続き legacy alias としてサポートされています。
- `attachOnly: true` は、「ローカルブラウザーは絶対に起動せず、すでに実行中なら接続だけする」を意味します。
- `color` とプロファイルごとの `color` はブラウザー UI に色を付け、どのプロファイルがアクティブかを見分けられるようにします。
- デフォルトプロファイルは `openclaw`（OpenClaw 管理のスタンドアロンブラウザー）です。サインイン済みユーザーブラウザーを使うには `defaultProfile: "user"` を使用します。
- 自動検出順序: システム既定ブラウザーが Chromium ベースならそれを使用し、そうでなければ Chrome → Brave → Edge → Chromium → Chrome Canary。
- ローカル `openclaw` プロファイルは `cdpPort`/`cdpUrl` を自動割り当てします。これらはリモート CDP に対してのみ設定してください。
- `driver: "existing-session"` は raw CDP ではなく Chrome DevTools MCP を使用します。この
  driver には `cdpUrl` を設定しないでください。
- `browser.profiles.<name>.userDataDir` を設定すると、existing-session プロファイルが Brave や Edge などの非デフォルト Chromium ユーザープロファイルに接続できます。

## Brave（または別の Chromium ベースブラウザー）を使う

**システム既定** のブラウザーが Chromium ベース（Chrome/Brave/Edge など）の場合、
OpenClaw は自動的にそれを使います。自動検出を上書きするには `browser.executablePath` を設定します。

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

- **ローカル制御（デフォルト）:** Gateway が loopback 制御サービスを起動し、ローカルブラウザーを起動できます。
- **リモート制御（node host）:** ブラウザーがあるマシン上で node host を実行すると、Gateway がブラウザーアクションをそこへプロキシします。
- **リモート CDP:** `browser.profiles.<name>.cdpUrl`（または `browser.cdpUrl`）を設定すると、
  リモートの Chromium ベースブラウザーに接続します。この場合、OpenClaw はローカルブラウザーを起動しません。

停止動作はプロファイルモードによって異なります。

- ローカル管理プロファイル: `openclaw browser stop` は OpenClaw が起動したブラウザープロセスを停止します
- attach-only および remote CDP プロファイル: `openclaw browser stop` はアクティブな
  制御セッションを閉じ、Playwright/CDP のエミュレーション上書き（viewport、
  color scheme、locale、timezone、offline mode などの状態）を解除します。
  OpenClaw がブラウザープロセスを起動していなくても同様です

リモート CDP URL には認証を含められます。

- クエリトークン（例: `https://provider.example?token=<token>`）
- HTTP Basic 認証（例: `https://user:pass@provider.example`）

OpenClaw は `/json/*` エンドポイント呼び出し時と
CDP WebSocket 接続時の両方で認証情報を保持します。
トークンは設定ファイルにコミットするのではなく、環境変数または secrets manager を使うことを推奨します。

## node ブラウザープロキシ（ゼロ設定のデフォルト）

ブラウザーがあるマシン上で **node host** を実行すると、OpenClaw は
追加のブラウザー設定なしでブラウザーツール呼び出しをその node に自動ルーティングできます。
これはリモート Gateway のデフォルト経路です。

補足:

- node host は、そのローカルブラウザー制御サーバーを **proxy command** として公開します。
- プロファイルは node 自身の `browser.profiles` 設定（ローカルと同じ）から取得されます。
- `nodeHost.browserProxy.allowProfiles` は任意です。空のままにすると legacy/default 動作、つまり設定済みのすべてのプロファイルがプロキシ経由で到達可能なままになり、プロファイル作成/削除ルートも含まれます。
- `nodeHost.browserProxy.allowProfiles` を設定すると、OpenClaw はそれを最小権限境界として扱います。allowlist にあるプロファイルだけを対象にでき、永続プロファイルの作成/削除ルートはプロキシサーフェス上でブロックされます。
- 不要なら無効にできます:
  - node 側: `nodeHost.browserProxy.enabled=false`
  - gateway 側: `gateway.nodes.browser.mode="off"`

## Browserless（ホスト型リモート CDP）

[Browserless](https://browserless.io) は、HTTPS と WebSocket 経由で
CDP 接続 URL を公開するホスト型 Chromium サービスです。OpenClaw はどちらの形式も使用できますが、
リモートブラウザープロファイルでは Browserless の接続ドキュメントにある
直接 WebSocket URL を使うのが最も簡単です。

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

補足:

- `<BROWSERLESS_API_KEY>` を実際の Browserless トークンに置き換えてください。
- Browserless アカウントに対応するリージョンエンドポイントを選んでください（詳細はそのドキュメントを参照）。
- Browserless が HTTPS ベース URL を提供する場合は、それを
  `wss://` に変換して直接 CDP 接続に使うか、HTTPS URL のまま OpenClaw に
  `/json/version` を検出させることができます。

## 直接 WebSocket CDP プロバイダー

一部のホスト型ブラウザーサービスは、標準の HTTP ベース CDP discovery
（`/json/version`）ではなく **直接 WebSocket** エンドポイントを公開します。OpenClaw は両方をサポートしています。

- **HTTP(S) エンドポイント** — OpenClaw は `/json/version` を呼び出して
  WebSocket debugger URL を検出し、その後接続します。
- **WebSocket エンドポイント**（`ws://` / `wss://`） — OpenClaw は
  `/json/version` をスキップして直接接続します。これは
  [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)、または WebSocket URL を渡してくる任意のプロバイダーで使用してください。

### Browserbase

[Browserbase](https://www.browserbase.com) は、
組み込みの CAPTCHA 解決、stealth mode、住宅用プロキシを備えた
headless ブラウザー実行向けクラウドプラットフォームです。

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

補足:

- [登録](https://www.browserbase.com/sign-up) し、
  [Overview dashboard](https://www.browserbase.com/overview) から **API Key**
  をコピーしてください。
- `<BROWSERBASE_API_KEY>` を実際の Browserbase API キーに置き換えてください。
- Browserbase は WebSocket 接続時にブラウザーセッションを自動作成するため、
  手動のセッション作成手順は不要です。
- 無料ティアでは、同時セッション 1 つと月 1 ブラウザー時間が利用できます。
  有料プランの制限については [pricing](https://www.browserbase.com/pricing) を参照してください。
- 完全な API
  リファレンス、SDK ガイド、統合例については [Browserbase docs](https://docs.browserbase.com) を参照してください。

## セキュリティ

重要な考え方:

- ブラウザー制御は loopback のみです。アクセスは Gateway の auth または node ペアリングを通じて流れます。
- スタンドアロンの loopback ブラウザー HTTP API は **shared-secret auth のみ** を使用します:
  gateway token bearer auth、`x-openclaw-password`、または
  設定済み Gateway パスワードによる HTTP Basic auth。
- Tailscale Serve の identity header と `gateway.auth.mode: "trusted-proxy"` は、
  このスタンドアロン loopback browser API の認証には **使われません**。
- ブラウザー制御が有効で shared-secret auth が設定されていない場合、OpenClaw
  は起動時に `gateway.auth.token` を自動生成し、設定へ永続化します。
- `gateway.auth.mode` がすでに
  `password`、`none`、または `trusted-proxy` の場合、OpenClaw はその token を自動生成しません。
- Gateway と node host は private network（Tailscale）上に保ち、
  公開露出は避けてください。
- リモート CDP URL/トークンは秘密情報として扱い、env vars または secrets manager を優先してください。

リモート CDP のヒント:

- 可能なら暗号化されたエンドポイント（HTTPS または WSS）と短命トークンを優先してください。
- 長期トークンを設定ファイルに直接埋め込むのは避けてください。

## プロファイル（マルチブラウザー）

OpenClaw は複数の名前付きプロファイル（ルーティング設定）をサポートします。プロファイルは次のいずれかです。

- **openclaw 管理**: 独自のユーザーデータディレクトリ + CDP ポートを持つ専用 Chromium ベースブラウザーインスタンス
- **remote**: 明示的な CDP URL（別の場所で実行中の Chromium ベースブラウザー）
- **existing session**: Chrome DevTools MCP 自動接続による既存の Chrome プロファイル

デフォルト:

- `openclaw` プロファイルは、存在しない場合自動作成されます。
- `user` プロファイルは、Chrome MCP の existing-session 接続用に組み込まれています。
- existing-session プロファイルは `user` を除いて opt-in です。`--driver existing-session` で作成してください。
- ローカル CDP ポートはデフォルトで **18800–18899** から割り当てられます。
- プロファイルを削除すると、そのローカルデータディレクトリは Trash に移動されます。

すべての制御エンドポイントは `?profile=<name>` を受け付けます。CLI では `--browser-profile` を使用します。

## Chrome DevTools MCP 経由の existing-session

OpenClaw は、公式の Chrome DevTools MCP サーバーを通じて、実行中の Chromium ベースブラウザープロファイルにも接続できます。これにより、そのブラウザープロファイルで
すでに開かれているタブとログイン状態を再利用できます。

公式の背景情報とセットアップリファレンス:

- [Chrome for Developers: ブラウザーセッションで Chrome DevTools MCP を使う](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

組み込みプロファイル:

- `user`

任意: 名前、色、またはブラウザーデータディレクトリを変えたい場合は、
独自の custom existing-session プロファイルを作成できます。

デフォルト動作:

- 組み込みの `user` プロファイルは Chrome MCP 自動接続を使用し、
  デフォルトのローカル Google Chrome プロファイルを対象にします。

Brave、Edge、Chromium、または非デフォルトの Chrome プロファイルには `userDataDir` を使用します。

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

その後、対応するブラウザーで以下を行います。

1. そのブラウザーのリモートデバッグ用 inspect ページを開きます。
2. リモートデバッグを有効にします。
3. ブラウザーを実行したままにし、OpenClaw が接続するときに表示される接続プロンプトを承認します。

よく使われる inspect ページ:

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
- `tabs` にすでに開いているブラウザータブが一覧表示される
- `snapshot` が選択中のライブタブから ref を返す

接続が機能しない場合の確認事項:

- 対象の Chromium ベースブラウザーのバージョンが `144+` である
- そのブラウザーの inspect ページでリモートデバッグが有効になっている
- ブラウザーに接続同意プロンプトが表示され、それを承認した
- `openclaw doctor` は古い拡張ベースのブラウザー設定を移行し、
  デフォルト自動接続プロファイル用に Chrome がローカルインストールされているかを確認しますが、
  ブラウザー側のリモートデバッグを有効化することはできません

エージェントで使う場合:

- ユーザーのログイン済みブラウザー状態が必要なときは `profile="user"` を使います。
- custom existing-session プロファイルを使う場合は、その明示的なプロファイル名を渡してください。
- このモードは、ユーザーが PC の前にいて接続プロンプトを承認できる場合にのみ選んでください。
- Gateway または node host は `npx chrome-devtools-mcp@latest --autoConnect` を起動できます

補足:

- この経路は、分離された `openclaw` プロファイルより高リスクです。サインイン済みブラウザーセッション内で動作できるためです。
- OpenClaw はこの driver ではブラウザーを起動せず、既存セッションにのみ接続します。
- OpenClaw はここで公式の Chrome DevTools MCP `--autoConnect` フローを使用します。`userDataDir` が設定されている場合、OpenClaw はそれを渡してその明示的な
  Chromium ユーザーデータディレクトリを対象にします。
- existing-session のスクリーンショットは、ページキャプチャと snapshot からの `--ref` 要素
  キャプチャをサポートしますが、CSS `--element` セレクターはサポートしません。
- existing-session のページスクリーンショットは、Playwright なしで Chrome MCP 経由で動作します。
  ref ベースの要素スクリーンショット（`--ref`）もそこで動作しますが、`--full-page`
  は `--ref` または `--element` と組み合わせられません。
- existing-session アクションは、管理ブラウザー経路より依然として制限があります:
  - `click`、`type`、`hover`、`scrollIntoView`、`drag`、`select` には、
    CSS セレクターではなく snapshot ref が必要です
  - `click` は左ボタンのみです（ボタン上書きや modifier は不可）
  - `type` は `slowly=true` をサポートしません。`fill` または `press` を使ってください
  - `press` は `delayMs` をサポートしません
  - `hover`、`scrollIntoView`、`drag`、`select`、`fill`、`evaluate` は
    呼び出しごとのタイムアウト上書きをサポートしません
  - `select` は現在単一値のみサポートします
- existing-session の `wait --url` は、他の browser driver と同様に exact、substring、glob パターンをサポートします。`wait --load networkidle` はまだサポートされていません。
- existing-session の upload hook には `ref` または `inputRef` が必要で、一度に 1 ファイルだけをサポートし、CSS `element` 指定はサポートしません。
- existing-session の dialog hook はタイムアウト上書きをサポートしません。
- batch
  actions、PDF エクスポート、download interception、`responsebody` など、
  依然として管理ブラウザー経路が必要な機能もあります。
- existing-session は host-local です。Chrome が別マシンまたは別ネットワーク namespace 上にある場合は、代わりに remote CDP または node host を使用してください。

## 分離の保証

- **専用 user data dir**: 個人用ブラウザープロファイルには絶対に触れません。
- **専用ポート**: 開発ワークフローとの衝突を避けるため `9222` を回避します。
- **決定的なタブ制御**: 「最後のタブ」ではなく `targetId` でタブを対象にします。

## ブラウザー選択

ローカル起動時、OpenClaw は利用可能な最初のものを選びます。

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` で上書きできます。

プラットフォーム:

- macOS: `/Applications` と `~/Applications` を確認します。
- Linux: `google-chrome`、`brave`、`microsoft-edge`、`chromium` などを探します。
- Windows: よくあるインストール場所を確認します。

## 制御 API（任意）

ローカル統合専用として、Gateway は小さな loopback HTTP API を公開します。

- ステータス/開始/停止: `GET /`, `POST /start`, `POST /stop`
- タブ: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- snapshot/スクリーンショット: `GET /snapshot`, `POST /screenshot`
- アクション: `POST /navigate`, `POST /act`
- hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- ダウンロード: `POST /download`, `POST /wait/download`
- デバッグ: `GET /console`, `POST /pdf`
- デバッグ: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- ネットワーク: `POST /response/body`
- 状態: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- 状態: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- 設定: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

すべてのエンドポイントは `?profile=<name>` を受け付けます。

shared-secret gateway auth が設定されている場合、browser HTTP route にも auth が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` またはそのパスワードによる HTTP Basic auth

補足:

- このスタンドアロン loopback browser API は `trusted-proxy` または
  Tailscale Serve identity header を消費しません。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合、これらの loopback browser
  route はその identity-bearing mode を継承しません。loopback-only のまま保ってください。

### Playwright 要件

一部の機能（navigate/act/AI snapshot/role snapshot、要素スクリーンショット、
PDF）には Playwright が必要です。Playwright がインストールされていない場合、これらのエンドポイントは
明確な 501 エラーを返します。

Playwright なしでも動作するもの:

- ARIA snapshot
- タブごとの CDP
  WebSocket が利用可能な場合の、管理 `openclaw` ブラウザーのページスクリーンショット
- `existing-session` / Chrome MCP プロファイルのページスクリーンショット
- snapshot 出力からの `existing-session` ref ベーススクリーンショット（`--ref`）

依然として Playwright が必要なもの:

- `navigate`
- `act`
- AI snapshot / role snapshot
- CSS セレクター要素スクリーンショット（`--element`）
- ブラウザー全体の PDF エクスポート

要素スクリーンショットでは `--full-page` も拒否されます。この route は `fullPage is
not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` と表示された場合は、完全な
Playwright パッケージ（`playwright-core` ではない）をインストールして gateway を再起動するか、browser support 付きで OpenClaw を再インストールしてください。

#### Docker での Playwright インストール

Gateway を Docker で実行している場合、`npx playwright` は避けてください（npm override の衝突）。
代わりにバンドル済み CLI を使ってください。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ブラウザーダウンロードを永続化するには `PLAYWRIGHT_BROWSERS_PATH`（例:
`/home/node/.cache/ms-playwright`）を設定し、`/home/node` が
`OPENCLAW_HOME_VOLUME` または bind mount で永続化されていることを確認してください。[Docker](/ja-JP/install/docker) を参照してください。

## 仕組み（内部）

高レベルのフロー:

- 小さな **control server** が HTTP リクエストを受け取ります。
- **CDP** を通じて Chromium ベースブラウザー（Chrome/Brave/Edge/Chromium）に接続します。
- 高度なアクション（クリック/入力/snapshot/PDF）には、
  CDP の上で **Playwright** を使用します。
- Playwright がない場合、Playwright 非依存の操作のみ利用可能です。

この設計により、エージェントには安定した決定的インターフェースを提供しつつ、
ローカル/リモートブラウザーやプロファイルを切り替えられます。

## CLI クイックリファレンス

すべてのコマンドは、特定プロファイルを対象にするために `--browser-profile <name>` を受け付けます。
すべてのコマンドは、機械可読な出力（安定したペイロード）のために `--json` も受け付けます。

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

確認:

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

ライフサイクルに関する補足:

- attach-only および remote CDP プロファイルでは、テスト後の適切な
  クリーンアップコマンドは引き続き `openclaw browser stop` です。基盤となる
  ブラウザーを kill する代わりに、アクティブな制御セッションを閉じ、一時的な
  エミュレーション上書きを解除します。
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

補足:

- `upload` と `dialog` は **arming** 呼び出しです。chooser/dialog を発生させる
  click/press の前に実行してください。
- download と trace の出力パスは OpenClaw の temp root に制限されます:
  - traces: `/tmp/openclaw`（フォールバック: `${os.tmpdir()}/openclaw`）
  - downloads: `/tmp/openclaw/downloads`（フォールバック: `${os.tmpdir()}/openclaw/downloads`）
- upload パスは OpenClaw の temp uploads root に制限されます:
  - uploads: `/tmp/openclaw/uploads`（フォールバック: `${os.tmpdir()}/openclaw/uploads`）
- `upload` は `--input-ref` または `--element` による file input への直接設定もできます。
- `snapshot`:
  - `--format ai`（Playwright インストール時のデフォルト）: 数値 ref（`aria-ref="<n>"`）を含む AI snapshot を返します。
  - `--format aria`: アクセシビリティツリーを返します（ref なし。確認用のみ）。
  - `--efficient`（または `--mode efficient`）: compact role snapshot のプリセット（interactive + compact + depth + より低い maxChars）。
  - 設定のデフォルト（tool/CLI のみ）: caller が mode を渡さないときに efficient snapshot を使うには `browser.snapshotDefaults.mode: "efficient"` を設定します（[Gateway configuration](/ja-JP/gateway/configuration-reference#browser) を参照）。
  - role snapshot オプション（`--interactive`、`--compact`、`--depth`、`--selector`）は、`ref=e12` のような ref を持つ role-based snapshot を強制します。
  - `--frame "<iframe selector>"` は role snapshot を iframe にスコープします（`e12` のような role ref と組み合わせます）。
  - `--interactive` は、操作対象を選びやすいフラットな interactive 要素一覧を出力します（アクション駆動に最適）。
  - `--labels` は、ref ラベルをオーバーレイした viewport-only スクリーンショットを追加します（`MEDIA:<path>` を出力）。
- `click`/`type`/その他には `snapshot` からの `ref`（数値 `12` または role ref `e12`）が必要です。
  CSS セレクターはアクションでは意図的にサポートされていません。

## snapshot と ref

OpenClaw は 2 つの「snapshot」スタイルをサポートします。

- **AI snapshot（数値 ref）**: `openclaw browser snapshot`（デフォルト。`--format ai`）
  - 出力: 数値 ref を含むテキスト snapshot。
  - アクション: `openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部的には、ref は Playwright の `aria-ref` で解決されます。

- **Role snapshot（`e12` のような role ref）**: `openclaw browser snapshot --interactive`（または `--compact`、`--depth`、`--selector`、`--frame`）
  - 出力: `[ref=e12]`（および任意の `[nth=1]`）を持つ role ベースの一覧/ツリー。
  - アクション: `openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部的には、ref は `getByRole(...)`（重複には `nth()` を追加）で解決されます。
  - `--labels` を追加すると、`e12` ラベルをオーバーレイした viewport スクリーンショットを含められます。

ref の動作:

- ref は **ナビゲーションをまたいで安定ではありません**。失敗したら `snapshot` を再実行して新しい ref を使ってください。
- role snapshot が `--frame` 付きで取得された場合、role ref は次の role snapshot までその iframe にスコープされます。

## Wait の強化機能

時間/テキスト以外も待てます。

- URL を待つ（Playwright の glob 対応）:
  - `openclaw browser wait --url "**/dash"`
- load state を待つ:
  - `openclaw browser wait --load networkidle`
- JS predicate を待つ:
  - `openclaw browser wait --fn "window.ready===true"`
- セレクターが visible になるのを待つ:
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
2. `click <ref>` / `type <ref>` を使う（interactive モードでは role ref を推奨）
3. まだ失敗する場合: `openclaw browser highlight <ref>` で Playwright が何を対象にしているか確認する
4. ページの挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 詳細なデバッグには trace を記録する:
   - `openclaw browser trace start`
   - 問題を再現する
   - `openclaw browser trace stop`（`TRACE:<path>` を出力）

## JSON 出力

`--json` はスクリプトと構造化ツール向けです。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 内の role snapshot には `refs` と小さな `stats` ブロック（lines/chars/refs/interactive）が含まれ、ツールがペイロードサイズと密度を判断できます。

## 状態と環境ノブ

これらは「サイトを X のように振る舞わせる」ワークフローで便利です。

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'`（legacy の `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP Basic 認証: `set credentials user pass`（または `--clear`）
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"`（Playwright device preset）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw ブラウザープロファイルにはログイン済みセッションが含まれる場合があります。機密として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn`
  は、ページコンテキストで任意の JavaScript を実行します。プロンプトインジェクションが
  これを誘導できるため、不要なら `browser.evaluateEnabled=false` で無効化してください。
- ログインや anti-bot に関する注意（X/Twitter など）については、[Browser login + X/Twitter posting](/tools/browser-login) を参照してください。
- Gateway/node host は private（loopback または tailnet-only）に保ってください。
- リモート CDP エンドポイントは強力です。トンネル化し、保護してください。

strict-mode の例（デフォルトで private/internal 宛先をブロック）:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 任意の正確一致 allow
    },
  },
}
```

## トラブルシューティング

Linux 固有の問題（特に snap Chromium）については、
[Browser troubleshooting](/tools/browser-linux-troubleshooting) を参照してください。

WSL2 Gateway + Windows Chrome の分離ホスト構成については、
[WSL2 + Windows + remote Chrome CDP troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting) を参照してください。

## エージェントツール + 制御の仕組み

エージェントはブラウザー自動化用に **1 つのツール** を受け取ります。

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

対応関係:

- `browser snapshot` は安定した UI ツリー（AI または ARIA）を返します。
- `browser act` は snapshot の `ref` ID を使って click/type/drag/select を行います。
- `browser screenshot` はピクセルをキャプチャします（フルページまたは要素）。
- `browser` は次を受け付けます:
  - `profile` で名前付きブラウザープロファイル（openclaw、chrome、または remote CDP）を選択。
  - `target`（`sandbox` | `host` | `node`）でブラウザーが存在する場所を選択。
  - sandboxed session では、`target: "host"` に `agents.defaults.sandbox.browser.allowHostControl=true` が必要。
  - `target` が省略された場合: sandboxed session はデフォルトで `sandbox`、非 sandbox session はデフォルトで `host`。
  - ブラウザー対応 node が接続されている場合、`target="host"` または `target="node"` を固定しない限り、ツールはそこへ自動ルーティングされることがあります。

これにより、エージェントを決定的に保ち、壊れやすいセレクターを避けられます。

## 関連

- [Tools Overview](/tools) — 利用可能なすべてのエージェントツール
- [Sandboxing](/ja-JP/gateway/sandboxing) — sandboxed 環境でのブラウザー制御
- [Security](/ja-JP/gateway/security) — ブラウザー制御のリスクとハードニング
