---
read_when:
    - '`openclaw browser`を使用していて、一般的なタスクの例が欲しい場合'
    - nodeホスト経由で別のマシン上で実行中のブラウザを制御したい場合
    - Chrome MCP経由で、ローカルでサインイン済みのChromeにアタッチしたい場合
summary: '`openclaw browser`のCLIリファレンス（ライフサイクル、プロファイル、タブ、アクション、状態、デバッグ）'
title: ブラウザ
x-i18n:
    generated_at: "2026-04-25T13:43:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2157146e54c77fecafcc5e89dd65244bd7ebecc37f86b45921ccea025188a8
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

OpenClawのブラウザ制御サーフェスを管理し、ブラウザ操作を実行します（ライフサイクル、プロファイル、タブ、スナップショット、スクリーンショット、ナビゲーション、入力、状態エミュレーション、デバッグ）。

関連:

- Browserツール + API: [Browser tool](/ja-JP/tools/browser)

## 共通フラグ

- `--url <gatewayWsUrl>`: Gateway WebSocket URL（デフォルトは設定値）。
- `--token <token>`: Gatewayトークン（必要な場合）。
- `--timeout <ms>`: リクエストタイムアウト（ms）。
- `--expect-final`: 最終的なGatewayレスポンスを待機します。
- `--browser-profile <name>`: ブラウザプロファイルを選択します（デフォルトは設定値）。
- `--json`: 機械可読な出力（対応している場合）。

## クイックスタート（ローカル）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

エージェントは`browser({ action: "doctor" })`で同じ準備確認を実行できます。

## クイックトラブルシューティング

`start`が`not reachable after start`で失敗する場合は、まずCDPの準備状態を確認してください。`start`と`tabs`が成功していて`open`または`navigate`が失敗する場合、ブラウザ制御プレーンは健全であり、失敗の原因は通常ナビゲーションSSRFポリシーです。

最小手順:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

詳細ガイド: [Browser troubleshooting](/ja-JP/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## ライフサイクル

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

注意:

- `attachOnly`およびリモートCDPプロファイルでは、`openclaw browser stop`は、OpenClaw自身がブラウザプロセスを起動していない場合でも、アクティブな制御セッションを閉じ、一時的なエミュレーション上書きをクリアします。
- ローカル管理プロファイルでは、`openclaw browser stop`は起動されたブラウザプロセスを停止します。
- `openclaw browser start --headless`は、その開始リクエストにのみ適用され、かつOpenClawがローカル管理ブラウザを起動する場合にのみ有効です。`browser.headless`やプロファイル設定を書き換えることはなく、すでに実行中のブラウザに対しては何もしません。
- Linuxホストで`DISPLAY`または`WAYLAND_DISPLAY`がない場合、`OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false`、または`browser.profiles.<name>.headless=false`で可視ブラウザを明示要求しない限り、ローカル管理プロファイルは自動的にヘッドレスで実行されます。

## コマンドが見つからない場合

`openclaw browser`が不明なコマンドである場合は、`~/.openclaw/openclaw.json`の`plugins.allow`を確認してください。

`plugins.allow`が存在する場合、バンドル済みbrowser pluginを明示的に一覧に含める必要があります。

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`plugins.allow`の許可リストから`browser`が除外されている場合、`browser.enabled=true`を設定してもCLIサブコマンドは復元されません。

関連: [Browser tool](/ja-JP/tools/browser#missing-browser-command-or-tool)

## プロファイル

プロファイルは名前付きのブラウザルーティング設定です。実際には次のように使います。

- `openclaw`: OpenClaw管理の専用Chromeインスタンスを起動またはアタッチします（分離されたユーザーデータディレクトリ）。
- `user`: Chrome DevTools MCP経由で、既存のサインイン済みChromeセッションを制御します。
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

`tabs`は、安定した`tabId`（`t1`など）、任意のラベル、raw `targetId`より先に`suggestedTargetId`を返します。エージェントは、`focus`、`close`、スナップショット、および各種操作に` suggestedTargetId`を戻して渡す必要があります。`open --label`、`tab new --label`、または`tab label`でラベルを割り当てられます。ラベル、tab id、raw target id、一意なtarget-idプレフィックスはいずれも受け付けられます。

## スナップショット / スクリーンショット / 操作

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

- `--full-page`はページキャプチャ専用で、`--ref`や`--element`とは併用できません。
- `existing-session` / `user`プロファイルは、ページスクリーンショットおよびスナップショット出力からの`--ref`スクリーンショットには対応しますが、CSS `--element`スクリーンショットには対応しません。
- `--labels`は、現在のスナップショット参照をスクリーンショット上に重ねて表示します。
- `snapshot --urls`は、発見されたリンク先をAIスナップショットに付加するため、エージェントはリンクテキストだけから推測するのではなく、直接ナビゲーション先を選べます。

ナビゲーション/クリック/入力（refベースのUI自動化）:

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

ファイル + ダイアログ補助:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

管理対象Chromeプロファイルでは、通常のクリックでトリガーされたダウンロードはOpenClawダウンロードディレクトリ（デフォルトは`/tmp/openclaw/downloads`、または設定された一時ルート）に保存されます。特定のファイルを待機してパスを返す必要がある場合は`waitfordownload`または`download`を使用してください。これらの明示的な待機処理が次のダウンロードを所有します。

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

組み込みの`user`プロファイルを使用するか、自分で`existing-session`プロファイルを作成します:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

この経路はホスト専用です。Docker、ヘッドレスサーバー、Browserless、その他のリモートセットアップでは、代わりにCDPプロファイルを使用してください。

現在のexisting-sessionの制限:

- スナップショット駆動の操作は、CSSセレクターではなくrefを使用します
- `browser.actionTimeoutMs`は、呼び出し側が`timeoutMs`を省略した`act`リクエストに対して、デフォルトで60000 msを適用します。呼び出しごとの`timeoutMs`がある場合はそちらが優先されます。
- `click`は左クリックのみ対応
- `type`は`slowly=true`に対応しません
- `press`は`delayMs`に対応しません
- `hover`、`scrollintoview`、`drag`、`select`、`fill`、`evaluate`は、呼び出しごとのタイムアウト上書きを拒否します
- `select`は1つの値のみ対応
- `wait --load networkidle`は非対応
- ファイルアップロードは`--ref` / `--input-ref`が必要で、CSS `--element`には対応せず、現在は一度に1ファイルのみ対応
- ダイアログフックは`--timeout`に対応しません
- スクリーンショットはページキャプチャと`--ref`に対応しますが、CSS `--element`には対応しません
- `responsebody`、ダウンロードインターセプト、PDFエクスポート、バッチ操作は、引き続き管理対象ブラウザまたはraw CDPプロファイルが必要です

## リモートブラウザ制御（node hostプロキシ）

Gatewayがブラウザとは別のマシンで動作している場合は、Chrome/Brave/Edge/Chromiumがあるマシン上で**node host**を実行してください。Gatewayはブラウザ操作をそのnodeへプロキシします（別個のブラウザ制御サーバーは不要です）。

自動ルーティングの制御には`gateway.nodes.browser.mode`を使い、複数のnodeが接続されている場合に特定のnodeへ固定するには`gateway.nodes.browser.node`を使います。

セキュリティ + リモートセットアップ: [Browser tool](/ja-JP/tools/browser), [Remote access](/ja-JP/gateway/remote), [Tailscale](/ja-JP/gateway/tailscale), [Security](/ja-JP/gateway/security)

## 関連

- [CLI reference](/ja-JP/cli)
- [Browser](/ja-JP/tools/browser)
