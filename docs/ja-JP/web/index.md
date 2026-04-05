---
read_when:
    - Tailscale 経由で Gateway にアクセスしたい
    - ブラウザーの Control UI と設定編集を使いたい
summary: 'Gateway の Web サーフェス: Control UI、bind モード、セキュリティ'
title: Web
x-i18n:
    generated_at: "2026-04-05T13:01:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f5643283f7d37235d3d8104897f38db27ac5a9fdef6165156fb542d0e7048c
    source_path: web/index.md
    workflow: 15
---

# Web（Gateway）

Gateway は、Gateway WebSocket と同じポートから小さな **ブラウザー Control UI**（Vite + Lit）を配信します。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します（例: `/openclaw`）

機能については [Control UI](/web/control-ui) にあります。
このページでは、bind モード、セキュリティ、および Web 向けサーフェスに焦点を当てます。

## Webhook

`hooks.enabled=true` の場合、Gateway は同じ HTTP サーバー上に小さな webhook エンドポイントも公開します。
認証 + ペイロードについては、[Gateway configuration](/ja-JP/gateway/configuration) → `hooks` を参照してください。

## 設定（デフォルトでオン）

Control UI は、アセット（`dist/control-ui`）が存在する場合、**デフォルトで有効** です。
設定で制御できます。

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath は任意
  },
}
```

## Tailscale アクセス

### Integrated Serve（推奨）

Gateway を loopback のままにし、Tailscale Serve にプロキシさせます。

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

その後、gateway を起動します。

```bash
openclaw gateway
```

開く URL:

- `https://<magicdns>/`（または設定した `gateway.controlUi.basePath`）

### tailnet bind + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

その後、gateway を起動します（この非 loopback の例では shared-secret token
auth を使用します）。

```bash
openclaw gateway
```

開く URL:

- `http://<tailscale-ip>:18789/`（または設定した `gateway.controlUi.basePath`）

### Public internet（Funnel）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // または OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## セキュリティに関する注意

- Gateway auth はデフォルトで必須です（token、password、trusted-proxy、または有効時の Tailscale Serve identity header）。
- 非 loopback bind でも **引き続き** gateway auth が必要です。実際には、token/password auth、または `gateway.auth.mode: "trusted-proxy"` を使う identity-aware reverse proxy を意味します。
- ウィザードはデフォルトで shared-secret auth を作成し、通常は
  gateway token も生成します（loopback でも）。
- shared-secret モードでは、UI は `connect.params.auth.token` または
  `connect.params.auth.password` を送信します。
- Tailscale Serve や `trusted-proxy` のような identity-bearing モードでは、
  代わりにリクエストヘッダーによって WebSocket auth チェックが満たされます。
- 非 loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins`
  を明示的に設定してください（完全な origin）。これがない場合、gateway の起動はデフォルトで拒否されます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Host-header origin fallback モードを有効にしますが、危険なセキュリティ低下です。
- Serve では、`gateway.auth.allowTailscale` が `true` の場合、
  Tailscale identity header が Control UI/WebSocket auth を満たせます（token/password 不要）。
  HTTP API エンドポイントはそれらの Tailscale identity header を使わず、代わりに
  gateway の通常の HTTP auth モードに従います。明示的な資格情報を必須にするには
  `gateway.auth.allowTailscale: false` を設定してください。詳細は
  [Tailscale](/ja-JP/gateway/tailscale) と [Security](/ja-JP/gateway/security) を参照してください。この
  token なしフローは、gateway host が信頼されていることを前提とします。
- `gateway.tailscale.mode: "funnel"` では `gateway.auth.mode: "password"`（shared password）が必要です。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを配信します。ビルドするには:

```bash
pnpm ui:build # 初回実行時に UI の依存関係を自動インストール
```
