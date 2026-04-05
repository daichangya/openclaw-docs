---
read_when:
    - ダッシュボードの認証または公開モードを変更するとき
summary: Gateway ダッシュボード（Control UI）へのアクセスと認証
title: Dashboard
x-i18n:
    generated_at: "2026-04-05T13:01:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 316e082ae4759f710b457487351e30c53b34c7c2b4bf84ad7b091a50538af5cc
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard（Control UI）

Gateway ダッシュボードは、デフォルトでは `/` で提供されるブラウザー Control UI です
（`gateway.controlUi.basePath` で上書き可能）。

すばやく開く（ローカル Gateway）:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

主な参照先:

- 使い方と UI 機能については [Control UI](/web/control-ui)。
- Serve/Funnel の自動化については [Tailscale](/ja-JP/gateway/tailscale)。
- bind モードとセキュリティに関する注意事項については [Web surfaces](/web)。

認証は、設定された gateway の認証パスを通じて WebSocket ハンドシェイク時に強制されます。

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときの Tailscale Serve identity headers
- `gateway.auth.mode: "trusted-proxy"` のときの trusted-proxy identity headers

`gateway.auth` については [Gateway configuration](/ja-JP/gateway/configuration) を参照してください。

セキュリティ上の注意: Control UI は**管理者向け画面**です（チャット、設定、exec approvals）。
公開しないでください。UI はダッシュボード URL トークンを、現在のブラウザータブセッションおよび選択された gateway URL に対して sessionStorage に保持し、読み込み後に URL から削除します。
localhost、Tailscale Serve、または SSH トンネルを優先してください。

## 最短経路（推奨）

- オンボーディング後、CLI はダッシュボードを自動で開き、クリーンな（トークンなしの）リンクを表示します。
- いつでも再度開けます: `openclaw dashboard`（リンクをコピーし、可能ならブラウザーを開き、headless なら SSH ヒントを表示します）。
- UI が共有シークレット認証を求める場合は、設定済みの token または
  password を Control UI settings に貼り付けてください。

## 認証の基本（ローカルとリモート）

- **Localhost**: `http://127.0.0.1:18789/` を開きます。
- **共有シークレット token の取得元**: `gateway.auth.token`（または
  `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` は、1回限りのブートストラップ用に URL fragment 経由でこれを渡せます。また、Control UI はこれを localStorage ではなく、現在のブラウザータブセッションと選択された gateway URL に対する sessionStorage に保持します。
- `gateway.auth.token` が SecretRef 管理されている場合、`openclaw dashboard` は
  設計上、トークンなし URL を表示/コピー/オープンします。これにより、
  外部管理されたトークンが shell ログ、クリップボード履歴、またはブラウザー起動引数に露出するのを防ぎます。
- `gateway.auth.token` が SecretRef として設定されていて、現在の
  shell で未解決でも、`openclaw dashboard` は引き続きトークンなし URL と、
  実行可能な認証セットアップガイダンスを表示します。
- **共有シークレット password**: 設定済みの `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_PASSWORD`）を使用します。ダッシュボードは password をリロード後も保持しません。
- **ID 付きモード**: `gateway.auth.allowTailscale: true` の場合、Tailscale Serve は
  identity headers により Control UI/WebSocket の認証を満たせます。また、
  non-loopback の identity-aware reverse proxy は
  `gateway.auth.mode: "trusted-proxy"` を満たせます。これらのモードでは、ダッシュボードは WebSocket 用に共有シークレットを貼り付ける必要がありません。
- **localhost 以外**: Tailscale Serve、non-loopback の shared-secret bind、
  `gateway.auth.mode: "trusted-proxy"` を使う non-loopback の identity-aware reverse proxy、
  または SSH トンネルを使ってください。HTTP APIs は、意図的に private-ingress の
  `gateway.auth.mode: "none"` または trusted-proxy HTTP auth を使っていない限り、引き続き
  shared-secret auth を使います。[Web surfaces](/web) を参照してください。

<a id="if-you-see-unauthorized-1008"></a>

## 「unauthorized」 / 1008 が表示された場合

- gateway に到達できることを確認してください（ローカル: `openclaw status`、リモート: SSH トンネル `ssh -N -L 18789:127.0.0.1:18789 user@host` を張ってから `http://127.0.0.1:18789/` を開く）。
- `AUTH_TOKEN_MISMATCH` の場合、gateway が retry ヒントを返すと、クライアントはキャッシュ済み device token を使って信頼された再試行を1回行うことがあります。その cached-token retry は、その token のキャッシュ済み approved scopes を再利用します。明示的な `deviceToken` / 明示的な `scopes` の呼び出し元は、要求した scope セットを保持します。その再試行後も認証に失敗する場合は、token drift を手動で解消してください。
- その再試行パス以外では、接続認証の優先順位は、明示的 shared token/password が先、その次に明示的 `deviceToken`、次に保存済み device token、最後に bootstrap token です。
- 非同期の Tailscale Serve Control UI パスでは、同じ
  `{scope, ip}` に対する失敗試行は、failed-auth limiter に記録される前に直列化されるため、2回目の同時不正再試行ではすでに `retry later` が表示される場合があります。
- token drift の修復手順については、[Token drift recovery checklist](/cli/devices#token-drift-recovery-checklist) に従ってください。
- gateway host から共有シークレットを取得または指定してください:
  - Token: `openclaw config get gateway.auth.token`
  - Password: 設定済みの `gateway.auth.password` または
    `OPENCLAW_GATEWAY_PASSWORD` を解決する
  - SecretRef 管理 token: 外部シークレットプロバイダーを解決するか、この
    shell で `OPENCLAW_GATEWAY_TOKEN` を export してから、`openclaw dashboard`
    を再実行する
  - 共有シークレットが設定されていない: `openclaw doctor --generate-gateway-token`
- ダッシュボード settings で、auth フィールドに token または password を貼り付けてから接続してください。
