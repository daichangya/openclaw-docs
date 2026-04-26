---
read_when:
    - '`openclaw browser` を使用していて、一般的なタスクの例を探しています'
    - nodeホスト経由で別のマシン上で動作しているBrowserを制御したい場合
    - Chrome MCP経由で、ローカルでサインイン済みのChromeに接続したい場合
summary: '`openclaw browser` のCLIリファレンス（ライフサイクル、プロファイル、タブ、アクション、状態、デバッグ）'
title: Browser
x-i18n:
    generated_at: "2026-04-26T11:25:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClawのBrowser制御サーフェスを管理し、Browserアクション（ライフサイクル、プロファイル、タブ、スナップショット、スクリーンショット、ナビゲーション、入力、状態エミュレーション、デバッグ）を実行します。

関連:

- Browserツール + API: [Browser tool](/ja-JP/tools/browser)

## よく使うフラグ

- `--url <gatewayWsUrl>`: Gateway WebSocket URL（デフォルトは設定値）。
- `--token <token>`: Gatewayトークン（必要な場合）。
- `--timeout <ms>`: リクエストタイムアウト（ms）。
- `--expect-final`: Gatewayの最終レスポンスを待機します。
- `--browser-profile <name>`: Browserプロファイルを選択します（デフォルトは設定値）。
- `--json`: 機械可読な出力（対応している場合）。

## クイックスタート（ローカル）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

エージェントは `browser({ action: "doctor" })` で同じ準備状況チェックを実行できます。

## すぐできるトラブルシューティング

`start` が `not reachable after start` で失敗する場合は、まずCDPの準備状況をトラブルシュートしてください。`start` と `tabs` が成功するのに `open` や `navigate` が失敗する場合、Browser制御プレーンは正常で、失敗原因は通常ナビゲーションのSSRFポリシーです。

最小シーケンス:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

詳細ガイダンス: [Browser troubleshooting](/ja-JP/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## ライフサイクル

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

注意:

- `doctor --deep` はライブスナップショットのプローブを追加します。基本的なCDP準備状況がグリーンでも、現在のタブを検査できる証拠が必要な場合に便利です。
- `attachOnly` とリモートCDPプロファイルでは、`openclaw browser stop` は、OpenClaw自身がBrowserプロセスを起動していなくても、アクティブな制御セッションを閉じ、一時的なエミュレーション上書きをクリアします。
- ローカル管理プロファイルでは、`openclaw browser stop` は起動されたBrowserプロセスを停止します。
- `openclaw browser start --headless` はその開始リクエストにのみ適用され、OpenClawがローカル管理Browserを起動する場合にのみ有効です。`browser.headless` やプロファイル設定を書き換えることはなく、すでに実行中のBrowserに対しては no-op です。
- Linuxホストで `DISPLAY` または `WAYLAND_DISPLAY` がない場合、ローカル管理プロファイルは、`OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false`、または `browser.profiles.<name>.headless=false` で明示的に可視Browserを要求しない限り、自動的にヘッドレスで実行されます。

## コマンドが存在しない場合

`openclaw browser` が未知のコマンドである場合は、`~/.openclaw/openclaw.json` の `plugins.allow` を確認してください。

`plugins.allow` が存在する場合、バンドルされているbrowser Pluginを明示的に列挙する必要があります。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` を設定しても、Pluginの許可リストで `browser` が除外されている場合、CLIサブコマンドは復元されません。

関連: [Browser tool](/ja-JP/tools/browser#missing-browser-command-or-tool)

## プロファイル

プロファイルは、名前付きのBrowserルーティング設定です。実際には次のとおりです。

- `openclaw`: 専用のOpenClaw管理Chromeインスタンスを起動または接続します（分離されたユーザーデータディレクトリ）。
- `user`: Chrome DevTools MCP経由で既存のサインイン済みChromeセッションを制御します。
- カスタムCDPプロファイル: ローカルまたはリモートのCDPエンドポイントを指定します。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

特定のプロファイルを使用するには:

```bash
openclaw browser --browser-profile work tabs
```

## タブ

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` は、安定した `t1` のような `tabId`、任意のラベル、生の `targetId` より前に、まず `suggestedTargetId` を返します。エージェントは、`focus`、`close`、スナップショット、アクションに `suggestedTargetId` を渡し返すべきです。ラベルは `open --label`、`tab new --label`、または `tab label` で割り当てられ、ラベル、tab id、生のtarget id、一意なtarget-idプレフィックスのいずれも受け付けられます。Chromiumがナビゲーションまたはフォーム送信中に基盤となる生targetを置き換えた場合、OpenClawは一致を証明できるときに、安定した `tabId` / ラベルを置き換え先タブに維持します。生のtarget idは依然として不安定なため、`suggestedTargetId` を優先してください。

## スナップショット / スクリーンショット / アクション

スナップショット:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

スクリーンショット:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

注意:

- `--full-page` はページキャプチャ専用で、`--ref` または `--element` と組み合わせることはできません。
- `existing-session` / `user` プロファイルはページスクリーンショットと、スナップショット出力の `--ref` スクリーンショットをサポートしますが、CSS `--element` スクリーンショットはサポートしません。
- `--labels` は現在のスナップショット参照をスクリーンショット上に重ねて表示します。
- `snapshot --urls` は、検出されたリンク先をAIスナップショットに追加するため、エージェントはリンクテキストだけから推測するのではなく、直接のナビゲーション先を選べます。

ナビゲート/クリック/入力（refベースUI自動化）:

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

アクションレスポンスは、OpenClawが置き換えタブを証明できる場合、アクションによるページ置換後の現在の生 `targetId` を返します。それでも、スクリプトは長期間のワークフロー向けに `suggestedTargetId` / ラベルを保存して渡すべきです。

ファイル + ダイアログヘルパー:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

管理されたChromeプロファイルは、通常のクリックで開始されたダウンロードをOpenClawのダウンロードディレクトリ（デフォルトは `/tmp/openclaw/downloads`、または設定された一時ルート）に保存します。エージェントが特定のファイルを待機してそのパスを返す必要がある場合は、`waitfordownload` または `download` を使用してください。これらの明示的な待機機能が次のダウンロードを所有します。

## 状態とストレージ

ビューポート + エミュレーション:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookie + ストレージ:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## デバッグ

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## MCP経由の既存Chrome

組み込みの `user` プロファイルを使用するか、独自の `existing-session` プロファイルを作成します。

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

この経路はホスト専用です。Docker、ヘッドレスサーバー、Browserless、その他のリモート構成では、代わりにCDPプロファイルを使用してください。

現在のexisting-sessionの制限:

- スナップショット駆動アクションはCSSセレクターではなくrefを使用します
- `browser.actionTimeoutMs` は、呼び出し元が `timeoutMs` を省略した場合、サポートされる `act` リクエストのデフォルトを60000 msにします。呼び出しごとの `timeoutMs` がある場合はそちらが優先されます。
- `click` は左クリックのみです
- `type` は `slowly=true` をサポートしません
- `press` は `delayMs` をサポートしません
- `hover`、`scrollintoview`、`drag`、`select`、`fill`、`evaluate` は呼び出しごとのタイムアウト上書きを拒否します
- `select` は1つの値のみサポートします
- `wait --load networkidle` はサポートされません
- ファイルアップロードは `--ref` / `--input-ref` が必要で、CSS `--element` をサポートせず、現在は1回に1ファイルのみサポートします
- ダイアログフックは `--timeout` をサポートしません
- スクリーンショットはページキャプチャと `--ref` をサポートしますが、CSS `--element` はサポートしません
- `responsebody`、ダウンロードインターセプト、PDFエクスポート、バッチアクションは、引き続き管理Browserまたは生CDPプロファイルが必要です

## リモートBrowser制御（nodeホストプロキシ）

GatewayがBrowserとは別のマシンで実行されている場合は、Chrome/Brave/Edge/Chromiumがあるマシンで **node host** を実行してください。GatewayはBrowserアクションをそのnodeへプロキシします（別個のBrowser制御サーバーは不要です）。

自動ルーティングを制御するには `gateway.nodes.browser.mode` を使用し、複数のnodeが接続されている場合に特定のnodeへ固定するには `gateway.nodes.browser.node` を使用します。

セキュリティ + リモートセットアップ: [Browser tool](/ja-JP/tools/browser), [Remote access](/ja-JP/gateway/remote), [Tailscale](/ja-JP/gateway/tailscale), [Security](/ja-JP/gateway/security)

## 関連

- [CLI reference](/ja-JP/cli)
- [Browser](/ja-JP/tools/browser)
