---
read_when:
    - ローカル制御 API 経由でエージェント browser をスクリプト化またはデバッグする
    - '`openclaw browser` CLI リファレンスを探している場合'
    - snapshot と ref を使ったカスタム browser automation の追加
summary: OpenClaw browser 制御 API、CLI リファレンス、およびスクリプトアクション
title: Browser 制御 API
x-i18n:
    generated_at: "2026-04-25T13:59:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1515ca1e31e6fd8fd3e0f34f17ce309c52202e26ed3b79e24a460380efab040d
    source_path: tools/browser-control.md
    workflow: 15
---

セットアップ、設定、およびトラブルシューティングについては [Browser](/ja-JP/tools/browser) を参照してください。  
このページは、ローカル制御 HTTP API、`openclaw browser`
CLI、およびスクリプトパターン（snapshot、ref、wait、debug flow）のリファレンスです。

## 制御 API（任意）

ローカル統合専用として、Gateway は小さな loopback HTTP API を公開します。

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

すべての endpoint は `?profile=<name>` を受け付けます。`POST /start?headless=true` は、
永続化された browser config を変更せずに、ローカル管理 profile に対する
1 回限りの headless 起動を要求します。attach-only、remote CDP、および existing-session profile は、
それらの browser process を OpenClaw が起動しないため、この override を拒否します。

shared-secret gateway auth が設定されている場合、browser HTTP route にも auth が必要です。

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` または、その password を使った HTTP Basic auth

注意:

- この standalone loopback browser API は、trusted-proxy または
  Tailscale Serve の identity header を使用しません。
- `gateway.auth.mode` が `none` または `trusted-proxy` の場合でも、これらの loopback browser
  route はそれらの identity-bearing mode を継承しません。loopback のみに保ってください。

### `/act` のエラー契約

`POST /act` は、route レベルの validation と
policy failure に対して構造化されたエラーレスポンスを使用します。

```json
{ "error": "<message>", "code": "ACT_*" }
```

現在の `code` 値:

- `ACT_KIND_REQUIRED`（HTTP 400）: `kind` が欠落しているか未認識。
- `ACT_INVALID_REQUEST`（HTTP 400）: action payload の正規化または validation に失敗。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）: 未対応の action kind で `selector` が使われた。
- `ACT_EVALUATE_DISABLED`（HTTP 403）: `evaluate`（または `wait --fn`）が config で無効。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）: top-level または batched `targetId` が request target と競合。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）: existing-session profile では action がサポートされない。

その他の runtime failure は、`code` field なしで
`{ "error": "<message>" }` を返す場合があります。

### Playwright 要件

一部の機能（navigate/act/AI snapshot/role snapshot、element screenshot、
PDF）には Playwright が必要です。Playwright がインストールされていない場合、これらの endpoint は
明確な 501 error を返します。

Playwright がなくても動作するもの:

- ARIA snapshot
- タブ単位の CDP
  WebSocket が利用可能な場合の、管理対象 `openclaw` browser 向け page screenshot
- `existing-session` / Chrome MCP profile 向け page screenshot
- snapshot 出力からの `existing-session` ref ベース screenshot（`--ref`）

引き続き Playwright が必要なもの:

- `navigate`
- `act`
- AI snapshot / role snapshot
- CSS selector による element screenshot（`--element`）
- 完全な browser PDF export

element screenshot は `--full-page` も拒否します。route は `fullPage is
not supported for element screenshots` を返します。

`Playwright is not available in this gateway build` が表示された場合は、
`playwright-core` がインストールされるように、バンドル済み browser Plugin の runtime dependency を修復し、その後 gateway を再起動してください。パッケージ版インストールでは `openclaw doctor --fix` を実行してください。  
Docker では、以下のように Chromium browser binary もインストールしてください。

#### Docker での Playwright インストール

Gateway を Docker で動かしている場合は、`npx playwright` を避けてください（npm override の競合があります）。  
代わりにバンドル済み CLI を使用します。

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

browser download を永続化するには、`PLAYWRIGHT_BROWSERS_PATH`（たとえば
`/home/node/.cache/ms-playwright`）を設定し、`/home/node` が
`OPENCLAW_HOME_VOLUME` または bind mount により永続化されていることを確認してください。[Docker](/ja-JP/install/docker) を参照してください。

## 仕組み（内部）

小さな loopback control server が HTTP request を受け付け、CDP 経由で Chromium 系 browser に接続します。高度な action（click/type/snapshot/PDF）は CDP 上の Playwright を通じて実行されます。Playwright がない場合は、Playwright 非依存の操作のみ利用可能です。エージェントからは 1 つの安定した interface が見え、背後で local/remote browser や profile が自由に入れ替わります。

## CLI クイックリファレンス

すべてのコマンドは、特定の profile を対象にするための `--browser-profile <name>` と、機械可読出力のための `--json` を受け付けます。

<AccordionGroup>

<Accordion title="基本: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # 1 回限りのローカル管理 headless 起動
openclaw browser stop            # attach-only/remote CDP 上のエミュレーションもクリア
openclaw browser tabs
openclaw browser tab             # 現在の tab のショートカット
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="確認: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # または --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="アクション: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # または role ref なら e12
openclaw browser click-coords 120 340        # viewport 座標
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="状態: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # 削除するには --clear
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注意:

- `upload` と `dialog` は **arming** 呼び出しです。chooser/dialog をトリガーする click/press の前に実行してください。
- `click`/`type` などには `snapshot` から得た `ref` が必要です（数値の `12`、role ref の `e12`、または actionable ARIA ref の `ax12`）。action に対して CSS selector は意図的にサポートされていません。可視 viewport 上の位置だけが唯一信頼できる target の場合は `click-coords` を使ってください。
- download、trace、および upload path は OpenClaw の temp root に制限されています: `/tmp/openclaw{,/downloads,/uploads}`（フォールバック: `${os.tmpdir()}/openclaw/...`）。
- `upload` は `--input-ref` または `--element` 経由で file input を直接設定することもできます。

snapshot フラグの要点:

- `--format ai`（Playwright がある場合のデフォルト）: 数値 ref（`aria-ref="<n>"`）を使う AI snapshot。
- `--format aria`: `axN` ref を持つ accessibility tree。Playwright が利用可能な場合、OpenClaw は backend DOM id を使って ref を live page に紐付けるため、follow-up action で使用できます。そうでなければ、出力は確認専用として扱ってください。
- `--efficient`（または `--mode efficient`）: compact role snapshot preset。これをデフォルトにするには `browser.snapshotDefaults.mode: "efficient"` を設定してください（[Gateway configuration](/ja-JP/gateway/configuration-reference#browser) を参照）。
- `--interactive`, `--compact`, `--depth`, `--selector` は role snapshot を強制し、`ref=e12` ref を使います。`--frame "<iframe>"` は role snapshot を iframe にスコープします。
- `--labels` は、overlay された ref label 付きの viewport 限定 screenshot を追加します（`MEDIA:<path>` を出力）。
- `--urls` は、検出された link destination を AI snapshot に追加します。

## Snapshot と ref

OpenClaw は 2 種類の「snapshot」スタイルをサポートします。

- **AI snapshot（数値 ref）**: `openclaw browser snapshot`（デフォルト; `--format ai`）
  - 出力: 数値 ref を含むテキスト snapshot。
  - アクション: `openclaw browser click 12`, `openclaw browser type 23 "hello"`。
  - 内部的には、ref は Playwright の `aria-ref` で解決されます。

- **Role snapshot（`e12` のような role ref）**: `openclaw browser snapshot --interactive`（または `--compact`, `--depth`, `--selector`, `--frame`）
  - 出力: `[ref=e12]`（および任意で `[nth=1]`）を持つ role ベースの list/tree。
  - アクション: `openclaw browser click e12`, `openclaw browser highlight e12`。
  - 内部的には、ref は `getByRole(...)`（重複時は `nth()` を追加）で解決されます。
  - `--labels` を追加すると、overlay された `e12` label 付きの viewport screenshot も含まれます。
  - link text が曖昧で、エージェントが具体的な
    navigation target を必要とする場合は `--urls` を追加してください。

- **ARIA snapshot（`ax12` のような ARIA ref）**: `openclaw browser snapshot --format aria`
  - 出力: accessibility tree を構造化 node として出力します。
  - アクション: `openclaw browser click ax12` は、snapshot path が Playwright と Chrome backend DOM id を通じて
    ref を紐付けられる場合に動作します。
  - Playwright が利用できない場合でも、ARIA snapshot は
    確認用途には有用ですが、ref は action に使えないことがあります。action 用の ref が必要なら、`--format ai`
    または `--interactive` で再 snapshot してください。

ref の動作:

- ref は **navigation をまたいで安定しません**。失敗した場合は `snapshot` を再実行し、新しい ref を使ってください。
- role snapshot を `--frame` 付きで取得した場合、role ref は次の role snapshot までその iframe にスコープされます。
- 不明または古い `axN` ref は、Playwright の `aria-ref` selector へフォールスルーせず、即座に失敗します。その場合は同じ tab で新しい snapshot を取得してください。

## Wait の強化機能

時間や text 以外も待機できます。

- URL を待つ（Playwright の glob をサポート）:
  - `openclaw browser wait --url "**/dash"`
- load state を待つ:
  - `openclaw browser wait --load networkidle`
- JS predicate を待つ:
  - `openclaw browser wait --fn "window.ready===true"`
- selector が visible になるのを待つ:
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

action が失敗した場合（例: 「not visible」、「strict mode violation」、「covered」）:

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` を使う（interactive モードでは role ref を優先）
3. それでも失敗する場合: `openclaw browser highlight <ref>` を使って、Playwright が何を target にしているか確認する
4. page の挙動がおかしい場合:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. より深いデバッグには trace を記録する:
   - `openclaw browser trace start`
   - 問題を再現する
   - `openclaw browser trace stop`（`TRACE:<path>` を出力）

## JSON 出力

`--json` は、スクリプトや構造化ツール向けです。

例:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON の role snapshot には、`refs` に加えて小さな `stats` block（lines/chars/refs/interactive）も含まれるため、ツール側で payload size や密度を判断できます。

## 状態と環境ノブ

これらは「サイトを X のように振る舞わせる」ワークフローで有用です。

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'`（レガシーな `set headers --json '{"X-Debug":"1"}'` も引き続きサポート）
- HTTP basic auth: `set credentials user pass`（または `--clear`）
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"`（または `--clear`）
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"`（Playwright の device preset）
  - `set viewport 1280 720`

## セキュリティとプライバシー

- openclaw browser profile にはログイン済み session が含まれる可能性があるため、機密情報として扱ってください。
- `browser act kind=evaluate` / `openclaw browser evaluate` と `wait --fn`
  は、page context で任意の JavaScript を実行します。prompt injection により
  これが誘導される可能性があります。不要なら `browser.evaluateEnabled=false` で無効化してください。
- ログインや anti-bot に関する注意（X/Twitter など）については [Browser login + X/Twitter posting](/ja-JP/tools/browser-login) を参照してください。
- Gateway/node host は private（loopback または tailnet-only）に保ってください。
- remote CDP endpoint は強力です。トンネルし、保護してください。

strict-mode の例（デフォルトで private/internal 宛先をブロック）:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 任意の完全一致 allow
    },
  },
}
```

## 関連

- [Browser](/ja-JP/tools/browser) — 概要、設定、profile、セキュリティ
- [Browser login](/ja-JP/tools/browser-login) — サイトへのサインイン
- [Browser Linux troubleshooting](/ja-JP/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/ja-JP/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
