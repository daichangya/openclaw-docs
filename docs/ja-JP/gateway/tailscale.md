---
read_when:
    - localhostの外部にGateway Control UIを公開する場合
    - tailnetまたは公開ダッシュボードアクセスを自動化する場合
summary: Gatewayダッシュボード向けに統合されたTailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-05T12:45:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale（Gatewayダッシュボード）

OpenClawは、GatewayダッシュボードとWebSocketポート向けに、Tailscaleの**Serve**（tailnet）または**Funnel**（公開）を自動設定できます。これにより、Gatewayをloopbackにbindしたまま、TailscaleがHTTPS、ルーティング、および（Serveでは）IDヘッダーを提供します。

## モード

- `serve`: `tailscale serve`によるtailnet専用Serve。gatewayは`127.0.0.1`のままです。
- `funnel`: `tailscale funnel`による公開HTTPS。OpenClawは共有パスワードを必須とします。
- `off`: デフォルト（Tailscale自動化なし）。

## 認証

ハンドシェイクを制御するには`gateway.auth.mode`を設定します:

- `none`（プライベートingressのみ）
- `token`（`OPENCLAW_GATEWAY_TOKEN`が設定されている場合のデフォルト）
- `password`（`OPENCLAW_GATEWAY_PASSWORD`または設定による共有シークレット）
- `trusted-proxy`（ID認識型リバースプロキシ。[Trusted Proxy Auth](/gateway/trusted-proxy-auth)を参照）

`tailscale.mode = "serve"`かつ`gateway.auth.allowTailscale`が`true`の場合、
Control UI/WebSocket認証では、トークン/パスワードを渡さずにTailscaleのIDヘッダー
（`tailscale-user-login`）を使用できます。OpenClawは、`x-forwarded-for`アドレスをローカルのTailscaleデーモン（`tailscale whois`）で解決し、それをヘッダーと照合してから受け入れることで、IDを検証します。
OpenClawは、リクエストがloopbackから到着し、かつTailscaleの`x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host`ヘッダーを持つ場合にのみ、それをServeとして扱います。
HTTP APIエンドポイント（たとえば`/v1/*`、`/tools/invoke`、`/api/channels/*`）は、TailscaleのIDヘッダー認証を**使用しません**。これらは引き続きgatewayの通常のHTTP認証モードに従います。デフォルトでは共有シークレット認証で、意図的に設定されたtrusted-proxy / private-ingressの`none`構成も可能です。
このトークン不要フローは、gatewayホストが信頼されていることを前提としています。同じホスト上で信頼できないローカルコードが実行される可能性がある場合は、`gateway.auth.allowTailscale`を無効にし、代わりにtoken/password認証を必須にしてください。
明示的な共有シークレット認証情報を必須にするには、`gateway.auth.allowTailscale: false`を設定し、`gateway.auth.mode: "token"`または`"password"`を使用してください。

## 設定例

### tailnet専用（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開く: `https://<magicdns>/`（または設定した`gateway.controlUi.basePath`）

### tailnet専用（Tailnet IPにbind）

GatewayをTailnet IPで直接listenさせたい場合に使用します（Serve/Funnelなし）。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別のTailnetデバイスから接続:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

注: このモードではloopback（`http://127.0.0.1:18789`）は**動作しません**。

### 公開インターネット（Funnel + 共有パスワード）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

パスワードをディスクにコミットする代わりに、`OPENCLAW_GATEWAY_PASSWORD`を推奨します。

## CLI例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注記

- Tailscale Serve/Funnelを使用するには、`tailscale` CLIがインストールされ、ログイン済みである必要があります。
- `tailscale.mode: "funnel"`は、公開露出を避けるため、認証モードが`password`でない限り起動を拒否します。
- 終了時にOpenClawが`tailscale serve`または`tailscale funnel`設定を元に戻すようにしたい場合は、`gateway.tailscale.resetOnExit`を設定してください。
- `gateway.bind: "tailnet"`は直接のTailnet bindです（HTTPSなし、Serve/Funnelなし）。
- `gateway.bind: "auto"`はloopbackを優先します。tailnet専用にしたい場合は`tailnet`を使用してください。
- Serve/Funnelが公開するのは**Gateway control UI + WS**のみです。ノードは同じGateway WSエンドポイント経由で接続するため、Serveはノードアクセスにも利用できます。

## ブラウザー制御（リモートGateway + ローカルブラウザー）

Gatewayをあるマシンで実行しつつ、別のマシン上のブラウザーを操作したい場合は、
ブラウザーマシン上で**node host**を実行し、両方を同じtailnet上に置いてください。
Gatewayはブラウザー操作をそのノードへプロキシするため、別個の制御サーバーやServe URLは不要です。

ブラウザー制御にFunnelは避けてください。ノードのペアリングは運用者アクセスとして扱ってください。

## Tailscaleの前提条件と制限

- Serveには、tailnetでHTTPSが有効になっている必要があります。欠けている場合、CLIがプロンプトを表示します。
- ServeはTailscaleのIDヘッダーを注入します。Funnelは注入しません。
- Funnelには、Tailscale v1.38.3+、MagicDNS、有効なHTTPS、およびfunnelノード属性が必要です。
- Funnelは、TLS上で`443`、`8443`、`10000`ポートのみをサポートします。
- macOSでのFunnelには、オープンソース版のTailscaleアプリが必要です。

## 詳しく見る

- Tailscale Serve概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve`コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel`コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
