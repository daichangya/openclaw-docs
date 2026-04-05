---
read_when:
    - ブラウザから Gateway を操作したいとき
    - SSH トンネルなしで Tailnet アクセスを使いたいとき
summary: Gateway 向けのブラウザベース Control UI（チャット、ノード、設定）
title: Control UI
x-i18n:
    generated_at: "2026-04-05T13:02:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1568680a07907343352dbb3a2e6a1b896826404a7d8baba62512f03eac28e3d7
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI（ブラウザ）

Control UI は、Gateway から配信される小さな **Vite + Lit** シングルページアプリです。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定（例: `/openclaw`）

これは同じポート上の **Gateway WebSocket** に**直接**接続します。

## クイックオープン（ローカル）

Gateway が同じコンピューターで実行中であれば、次を開いてください。

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページが読み込めない場合は、まず Gateway を起動してください: `openclaw gateway`

認証は、WebSocket ハンドシェイク中に次のいずれかで提供されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときの Tailscale Serve identity header
- `gateway.auth.mode: "trusted-proxy"` のときの trusted-proxy identity header

ダッシュボード設定パネルは、現在のブラウザタブセッション用の token と
選択された gateway URL を保持します。password は永続化されません。オンボーディングでは通常、
初回接続時に shared-secret auth 用の gateway token が生成されますが、
`gateway.auth.mode` が `"password"` の場合は password auth も使えます。

## デバイスのペアリング（初回接続）

新しいブラウザまたはデバイスから Control UI に接続すると、Gateway は
**一度限りのペアリング承認**を要求します。これは、同じ Tailnet 上にいて
`gateway.auth.allowTailscale: true` であっても同様です。これは、不正アクセスを防ぐための
セキュリティ対策です。

**表示される内容:** `disconnected (1008): pairing required`

**デバイスを承認するには:**

```bash
# 保留中のリクエストを一覧表示
openclaw devices list

# リクエスト ID で承認
openclaw devices approve <requestId>
```

ブラウザが変更された auth 詳細（role/scopes/public
key）でペアリングを再試行すると、以前の保留リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に
`openclaw devices list` を再実行してください。

一度承認されると、そのデバイスは記憶され、
`openclaw devices revoke --device <id> --role <role>` で取り消さない限り再承認は不要です。token のローテーションと失効については
[Devices CLI](/cli/devices) を参照してください。

**注記:**

- 直接のローカル loopback ブラウザ接続（`127.0.0.1` / `localhost`）は
  自動承認されます。
- Tailnet と LAN のブラウザ接続は、同じマシンからの接続であっても
  引き続き明示的な承認が必要です。
- 各ブラウザプロファイルは一意のデバイス ID を生成するため、ブラウザを切り替えたり
  ブラウザデータを消去したりすると再ペアリングが必要になります。

## 言語サポート

Control UI は初回読み込み時にブラウザのロケールに基づいて自身をローカライズでき、後から Access カードの言語ピッカーで上書きできます。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- 英語以外の翻訳はブラウザで lazy-load されます。
- 選択したロケールはブラウザストレージに保存され、次回以降の訪問でも再利用されます。
- 翻訳キーが欠けている場合は英語にフォールバックします。

## 現在できること

- Gateway WS 経由でモデルとチャット（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- Chat でツール呼び出し + ライブツール出力カードをストリーミング（agent events）
- Channels: built-in および bundled/external plugin channels のステータス、QR ログイン、チャネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）
- Instances: presence 一覧 + 更新（`system-presence`）
- Sessions: 一覧 + セッションごとの model/thinking/fast/verbose/reasoning 上書き（`sessions.list`, `sessions.patch`）
- Cron jobs: 一覧/追加/編集/実行/有効化/無効化 + 実行履歴（`cron.*`）
- Skills: ステータス、有効化/無効化、インストール、API key 更新（`skills.*`）
- Nodes: 一覧 + capabilities（`node.list`）
- Exec approvals: `exec host=gateway/node` のための gateway または node の allowlist + ask policy を編集（`exec.approvals.*`）
- Config: `~/.openclaw/openclaw.json` を表示/編集（`config.get`, `config.set`）
- Config: 検証付きで適用 + 再起動（`config.apply`）し、最後にアクティブだったセッションを起こす
- Config の書き込みには、並行編集による上書きを防ぐ base-hash ガードが含まれます
- Config の書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された config payload 内の ref について、アクティブな SecretRef 解決も書き込み前に事前確認します。解決できないアクティブな送信済み ref は、書き込み前に拒否されます
- Config schema + form rendering（`config.schema` / `config.schema.lookup`、
  field の `title` / `description`、一致した UI ヒント、直下の子要約、
  ネストされた object/wildcard/array/composition ノード上の docs metadata、
  利用可能な場合は plugin + channel schema も含む）。Raw JSON editor は、
  snapshot が安全な raw round-trip に対応している場合にのみ利用可能です
- snapshot が安全に raw text で round-trip できない場合、Control UI は Form mode を強制し、その snapshot では Raw mode を無効化します
- Structured SecretRef object 値は、誤って object を string に壊してしまうのを防ぐため、form text input では読み取り専用として表示されます
- Debug: status/health/models の snapshot + event log + 手動 RPC 呼び出し（`status`, `health`, `models.list`）
- Logs: gateway file logs のライブ tail をフィルター/エクスポート付きで表示（`logs.tail`）
- Update: package/git update + restart を実行（`update.run`）し、restart report を表示

Cron jobs パネルの注記:

- 分離ジョブでは、配信はデフォルトで概要の announce です。内部実行専用にしたい場合は none に切り替えられます。
- announce が選択されている場合、channel/target フィールドが表示されます。
- Webhook モードでは、`delivery.mode = "webhook"` を使用し、`delivery.to` に有効な HTTP(S) webhook URL を設定します。
- main-session jobs では、webhook と none の配信モードが利用可能です。
- 高度な編集コントロールには、delete-after-run、agent override のクリア、cron の exact/stagger オプション、
  agent model/thinking 上書き、best-effort delivery トグルが含まれます。
- Form の検証は field 単位のエラー付きインラインで行われ、無効な値がある間は save ボタンが無効になります。
- 専用 bearer token を送信するには `cron.webhookToken` を設定してください。省略した場合、webhook は auth header なしで送信されます。
- 非推奨のフォールバック: `notify: true` を持つ保存済み legacy jobs は、移行されるまでは引き続き `cron.webhook` を使用できます。

## チャット動作

- `chat.send` は**非ブロッキング**です。`{ runId, status: "started" }` を即座に ack し、応答は `chat` event でストリーミングされます。
- 同じ `idempotencyKey` で再送すると、実行中は `{ status: "in_flight" }`、完了後は `{ status: "ok" }` を返します。
- `chat.history` のレスポンスは、UI の安全性のためサイズ制限されています。トランスクリプト項目が大きすぎる場合、Gateway は長い text field を切り詰めたり、重い metadata block を省略したり、巨大なメッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えたりすることがあります。
- `chat.history` は、表示専用のインラインディレクティブタグ（たとえば `[[reply_to_*]]` や `[[audio_as_voice]]`）、プレーンテキストのツール呼び出し XML payload（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏れ出た ASCII/全角の model control token も、可視の assistant text から除去します。また、可視テキスト全体が正確に silent token `NO_REPLY` / `no_reply` だけである assistant 項目は省略します。
- `chat.inject` は assistant note をセッショントランスクリプトに追記し、UI 専用更新のための `chat` event をブロードキャストします（agent run なし、channel delivery なし）。
- チャットヘッダーの model と thinking の picker は、`sessions.patch` を通じてアクティブな session を即時 patch します。これらは持続的な session override であり、1ターン限りの send option ではありません。
- Stop:
  - **Stop** をクリック（`chat.abort` を呼び出す）
  - `/stop` を入力（または `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` のような単独の abort phrase）して out-of-band に中断
  - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、その session のすべての active run を中断します
- Abort partial retention:
  - run が中断されたとき、部分的な assistant text は UI に表示されたままの場合があります
  - Gateway は、buffered output がある場合、中断された部分 assistant text を transcript history に永続化します
  - 永続化された項目には abort metadata が含まれるため、transcript consumer は abort partial と通常完了出力を区別できます

## Tailnet アクセス（推奨）

### 統合 Tailscale Serve（推奨）

Gateway を loopback のままにし、Tailscale Serve に HTTPS でプロキシさせます。

```bash
openclaw gateway --tailscale serve
```

次を開いてください。

- `https://<magicdns>/`（または設定した `gateway.controlUi.basePath`）

デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI / WebSocket の Serve リクエストは Tailscale identity header
（`tailscale-user-login`）で認証できます。OpenClaw
は `x-forwarded-for` address を `tailscale whois` で解決して
header と照合することで identity を検証し、かつリクエストが
Tailscale の `x-forwarded-*` header を伴って loopback に到達した場合にのみこれを受け入れます。
Serve トラフィックでも明示的な shared-secret
credentials を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定してください。その場合は `gateway.auth.mode: "token"` または
`"password"` を使用します。
その非同期 Serve identity 経路では、同じ client IP と
auth scope に対する認証失敗は、rate-limit 書き込み前に直列化されます。したがって、同じブラウザからの
同時の不正リトライでは、2件の単純な mismatch が並行して競合する代わりに、2件目のリクエストで `retry later` が表示される場合があります。
token なしの Serve auth は、gateway host が信頼できることを前提とします。そのホスト上で
信頼できないローカルコードが動作する可能性があるなら、token/password auth を必須にしてください。

### tailnet に bind + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

その後、次を開きます。

- `http://<tailscale-ip>:18789/`（または設定した `gateway.controlUi.basePath`）

一致する shared secret を UI 設定に貼り付けてください（
`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

## 非セキュア HTTP

平文 HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、
ブラウザは **non-secure context** で動作し、WebCrypto をブロックします。デフォルトでは、
OpenClaw は device identity のない Control UI 接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` による localhost 限定の非セキュア HTTP 互換性
- `gateway.auth.mode: "trusted-proxy"` による operator Control UI auth の成功
- 緊急用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UI をローカルで開いてください。

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（gateway host 上）

**insecure-auth トグルの動作:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` は、ローカル互換性のためだけのトグルです。

- これは、non-secure HTTP context で localhost Control UI session が
  device identity なしでも進行できるようにします。
- pairing check は迂回しません。
- リモート（非 localhost）の device identity 要件は緩和しません。

**緊急時専用:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` は Control UI の device identity check を無効化し、
重大なセキュリティ低下を引き起こします。緊急利用後はすぐに元へ戻してください。

trusted-proxy に関する注記:

- trusted-proxy auth が成功した場合、device identity なしで **operator** Control UI session を受け入れられます
- これは node-role の Control UI session には**拡張されません**
- 同一ホスト loopback reverse proxy も trusted-proxy auth を満たしません。詳しくは
  [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください

HTTPS セットアップの案内については [Tailscale](/ja-JP/gateway/tailscale) を参照してください。

## UI のビルド

Gateway は `dist/control-ui` から static file を配信します。次でビルドしてください。

```bash
pnpm ui:build # 初回実行時に UI deps を自動インストール
```

任意の absolute base（asset URL を固定したい場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別個の dev server）:

```bash
pnpm ui:dev # 初回実行時に UI deps を自動インストール
```

その後、UI をあなたの Gateway WS URL（例: `ws://127.0.0.1:18789`）へ向けてください。

## デバッグ/テスト: dev server + リモート Gateway

Control UI は static files です。WebSocket の接続先は設定可能で、
HTTP origin と異なっていてもかまいません。これは、Vite dev server はローカルで使いながら、
Gateway は別の場所で動かしたい場合に便利です。

1. UI dev server を起動: `pnpm ui:dev`
2. 次のような URL を開きます:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

任意の一回限り認証（必要な場合）:

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

注記:

- `gatewayUrl` は読み込み後に localStorage に保存され、URL から削除されます。
- `token` は、可能な限り URL fragment（`#token=...`）で渡してください。fragment はサーバーに送信されないため、request-log や Referer への漏えいを避けられます。従来の `?token=` query param も互換性のため一度だけ取り込まれますが、フォールバックとしてのみであり、bootstrap 後すぐに削除されます。
- `password` はメモリ内にのみ保持されます。
- `gatewayUrl` が設定されている場合、UI は config や environment の credentials にフォールバックしません。
  `token`（または `password`）を明示的に指定してください。
  明示的 credentials が欠けている場合はエラーになります。
- Gateway が TLS の背後にある場合は `wss://` を使ってください（Tailscale Serve、HTTPS proxy など）。
- `gatewayUrl` は clickjacking を防ぐため、top-level window でのみ受け付けられます（埋め込み不可）。
- 非 loopback の Control UI 配置では、`gateway.controlUi.allowedOrigins` を
  明示的に設定する必要があります（完全な origin）。これには remote dev setup も含まれます。
- 厳密に管理されたローカルテスト以外では `gateway.controlUi.allowedOrigins: ["*"]` を使わないでください。
  これは「いま使っている host に合わせる」ではなく、「任意の browser origin を許可する」という意味です。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Host-header origin fallback mode を有効にしますが、危険なセキュリティモードです。

例:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

リモートアクセス設定の詳細: [Remote access](/ja-JP/gateway/remote)

## 関連

- [Dashboard](/web/dashboard) — gateway dashboard
- [WebChat](/web/webchat) — ブラウザベースのチャットインターフェース
- [TUI](/web/tui) — ターミナルユーザーインターフェース
- [Health Checks](/ja-JP/gateway/health) — gateway のヘルス監視
