---
read_when:
    - localhostの外部にGateway Control UIを公開する
    - tailnetまたは公開ダッシュボードアクセスを自動化する
summary: Gatewayダッシュボード向けの統合Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T11:31:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClawは、GatewayダッシュボードとWebSocketポート向けに、Tailscale **Serve**（tailnet）または **Funnel**（公開）を自動設定できます。これによりGatewayはloopbackにバインドされたままとなり、TailscaleがHTTPS、ルーティング、そして（Serveの場合は）アイデンティティヘッダーを提供します。

## モード

- `serve`: `tailscale serve` によるtailnet専用Serve。gatewayは `127.0.0.1` のままです。
- `funnel`: `tailscale funnel` による公開HTTPS。OpenClawは共有パスワードを必要とします。
- `off`: デフォルト（Tailscale自動化なし）。

状態および監査出力では、このOpenClaw Serve/Funnelモードに対して **Tailscale exposure** を使用します。`off` は、OpenClawがServeやFunnelを管理していないことを意味し、ローカルのTailscaleデーモンが停止またはログアウトしていることを意味するわけではありません。

## 認証

ハンドシェイクを制御するには `gateway.auth.mode` を設定します。

- `none`（private ingress専用）
- `token`（`OPENCLAW_GATEWAY_TOKEN` が設定されている場合のデフォルト）
- `password`（`OPENCLAW_GATEWAY_PASSWORD` または設定による共有シークレット）
- `trusted-proxy`（アイデンティティ対応リバースプロキシ。 [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）

`tailscale.mode = "serve"` で、かつ `gateway.auth.allowTailscale` が `true` の場合、
Control UI/WebSocket認証は、トークン/パスワードを渡さずにTailscaleのアイデンティティヘッダー
（`tailscale-user-login`）を使用できます。OpenClawは、ローカルのTailscale
デーモン経由で `x-forwarded-for` アドレスを解決し（`tailscale whois`）、それをヘッダーと照合してから受け入れることで、
そのアイデンティティを検証します。OpenClawは、リクエストがloopbackから到着し、Tailscaleの
`x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host`
ヘッダーを含む場合にのみ、それをServeとして扱います。
browserデバイスアイデンティティを含むControl UI operatorセッションでは、この
検証済みServe経路はデバイスペアリングの往復もスキップします。ただし、
browserデバイスアイデンティティ自体を回避するわけではありません。デバイスなしクライアントは引き続き拒否され、
nodeロールまたは非Control UIのWebSocket接続は引き続き通常のペアリングおよび
認証チェックに従います。
HTTP APIエンドポイント（たとえば `/v1/*`, `/tools/invoke`, `/api/channels/*`）
では、Tailscaleのアイデンティティヘッダー認証は **使用されません**。これらは引き続きgatewayの
通常のHTTP認証モードに従います。デフォルトでは共有シークレット認証で、意図的に
設定されたtrusted-proxy / private-ingress `none` 構成も利用できます。
このトークン不要フローは、gatewayホストが信頼されていることを前提としています。同じホスト上で
信頼できないローカルコードが実行される可能性がある場合は、`gateway.auth.allowTailscale` を無効化し、
代わりにトークン/パスワード認証を必須にしてください。
明示的な共有シークレット認証情報を必須にするには、`gateway.auth.allowTailscale: false`
を設定し、`gateway.auth.mode: "token"` または `"password"` を使用してください。

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

開く先: `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

### tailnet専用（Tailnet IPにbind）

GatewayをTailnet IPで直接待ち受けさせたい場合に使用します（Serve/Funnelなし）。

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

注: このモードではloopback（`http://127.0.0.1:18789`）は **動作しません**。

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

パスワードをディスクへコミットする代わりに、`OPENCLAW_GATEWAY_PASSWORD` を推奨します。

## CLI例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意

- Tailscale Serve/Funnelを使うには、`tailscale` CLIがインストール済みでログイン済みである必要があります。
- 公開露出を避けるため、`tailscale.mode: "funnel"` は認証モードが `password` でないと起動を拒否します。
- 終了時にOpenClawが `tailscale serve`
  または `tailscale funnel` の設定を取り消すようにしたい場合は、`gateway.tailscale.resetOnExit` を設定してください。
- `gateway.bind: "tailnet"` は直接のTailnet bindです（HTTPSなし、Serve/Funnelなし）。
- `gateway.bind: "auto"` はloopbackを優先します。tailnet専用にしたい場合は `tailnet` を使用してください。
- Serve/Funnelが公開するのは **Gateway control UI + WS** のみです。nodeは
  同じGateway WSエンドポイント経由で接続するため、Serveはnodeアクセスにも使えます。

## Browser制御（リモートGateway + ローカルBrowser）

Gatewayを1台のマシンで実行しつつ、別のマシン上のBrowserを操作したい場合は、
Browserマシン上で **node host** を実行し、両方を同じtailnet上に保ってください。
GatewayがBrowserアクションをそのnodeへプロキシするため、別個の制御サーバーやServe URLは不要です。

Browser制御にFunnelは避けてください。nodeのペアリングはoperatorアクセスと同様に扱ってください。

## Tailscaleの前提条件 + 制限

- Serveには、tailnetでHTTPSが有効になっている必要があります。足りない場合はCLIがプロンプトを表示します。
- ServeはTailscaleのアイデンティティヘッダーを注入します。Funnelは注入しません。
- Funnelには、Tailscale v1.38.3以降、MagicDNS、HTTPS有効化、およびfunnel node属性が必要です。
- FunnelがTLS上でサポートするポートは `443`、`8443`、`10000` のみです。
- macOSでのFunnelには、オープンソース版Tailscaleアプリが必要です。

## さらに詳しく

- Tailscale Serve概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 関連

- [Remote access](/ja-JP/gateway/remote)
- [Discovery](/ja-JP/gateway/discovery)
- [Authentication](/ja-JP/gateway/authentication)
