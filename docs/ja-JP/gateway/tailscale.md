---
read_when:
    - localhost の外部に Gateway Control UI を公開する】【。analysis to=none code  omitted
    - tailnet またはパブリックなダッシュボードアクセスを自動化する
summary: Gateway ダッシュボード向けの統合 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-25T13:49:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw は、Gateway ダッシュボードと WebSocket ポート向けに Tailscale **Serve**（tailnet）または **Funnel**（パブリック）を自動設定できます。これにより Gateway は loopback にバインドされたまま、Tailscale が HTTPS、ルーティング、そして（Serve の場合は）ID ヘッダーを提供します。

## モード

- `serve`: `tailscale serve` による tailnet 専用 Serve。Gateway は `127.0.0.1` のままです。
- `funnel`: `tailscale funnel` によるパブリック HTTPS。OpenClaw では共有パスワードが必要です。
- `off`: デフォルト（Tailscale 自動化なし）。

## 認証

ハンドシェイクを制御するには `gateway.auth.mode` を設定します:

- `none`（private ingress のみ）
- `token`（`OPENCLAW_GATEWAY_TOKEN` が設定されている場合のデフォルト）
- `password`（`OPENCLAW_GATEWAY_PASSWORD` または config 経由の共有シークレット）
- `trusted-proxy`（identity-aware reverse proxy。 [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）

`tailscale.mode = "serve"` で `gateway.auth.allowTailscale` が `true` の場合、
Control UI/WebSocket 認証は、トークン/パスワードを与えなくても Tailscale の ID ヘッダー
（`tailscale-user-login`）を使用できます。OpenClaw は、受け入れる前に
`x-forwarded-for` アドレスをローカル Tailscale デーモン（`tailscale whois`）経由で解決し、
それをヘッダーと照合することで ID を検証します。OpenClaw がリクエストを Serve として扱うのは、
それが loopback から到着し、かつ Tailscale の `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host`
ヘッダーを持っている場合のみです。
HTTP API エンドポイント（たとえば `/v1/*`、`/tools/invoke`、`/api/channels/*`）は、
Tailscale の ID ヘッダー認証を使用しません。これらは引き続き Gateway の
通常の HTTP 認証モードに従います。デフォルトでは shared-secret 認証、または意図的に
設定された trusted-proxy / private-ingress `none` セットアップです。
このトークン不要フローは、Gateway ホストが信頼されていることを前提とします。同じホスト上で
信頼できないローカルコードが実行される可能性がある場合は、`gateway.auth.allowTailscale` を無効にし、
代わりに token/password 認証を必須にしてください。
明示的な shared-secret 認証情報を必須にするには、`gateway.auth.allowTailscale: false`
を設定し、`gateway.auth.mode: "token"` または `"password"` を使用してください。

## 設定例

### tailnet 専用（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開く先: `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

### tailnet 専用（Tailnet IP に bind）

Gateway を Tailnet IP で直接リッスンさせたい場合に使用します（Serve/Funnel なし）。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別の Tailnet デバイスから接続:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

注: このモードでは loopback（`http://127.0.0.1:18789`）は**動作しません**。

### パブリックインターネット（Funnel + 共有パスワード）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

パスワードをディスクにコミットするより `OPENCLAW_GATEWAY_PASSWORD` を推奨します。

## CLI 例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注記

- Tailscale Serve/Funnel には `tailscale` CLI のインストールとログインが必要です。
- `tailscale.mode: "funnel"` は、パブリック公開を避けるため、auth mode が `password` でない限り起動を拒否します。
- シャットダウン時に OpenClaw が `tailscale serve` または `tailscale funnel` の設定を元に戻すようにしたい場合は、`gateway.tailscale.resetOnExit` を設定してください。
- `gateway.bind: "tailnet"` は直接 Tailnet bind です（HTTPS なし、Serve/Funnel なし）。
- `gateway.bind: "auto"` は loopback を優先します。tailnet 専用にしたい場合は `tailnet` を使用してください。
- Serve/Funnel が公開するのは **Gateway control UI + WS** のみです。Node は同じ Gateway WS エンドポイント経由で接続するため、Serve は Node アクセスにも使えます。

## ブラウザ制御（リモート Gateway + ローカルブラウザ）

Gateway をあるマシンで実行しつつ、別のマシン上のブラウザを操作したい場合は、
ブラウザマシン上で **node host** を実行し、両方を同じ tailnet 上に置いてください。
Gateway はブラウザ操作をその node にプロキシするため、別個の制御サーバーや Serve URL は不要です。

ブラウザ制御に Funnel は避けてください。Node ペアリングは operator アクセス同等として扱ってください。

## Tailscale の前提条件 + 制限

- Serve には tailnet に対する HTTPS の有効化が必要です。欠けている場合は CLI がプロンプトを出します。
- Serve は Tailscale の ID ヘッダーを注入します。Funnel は注入しません。
- Funnel には Tailscale v1.38.3+、MagicDNS、有効な HTTPS、および funnel node attribute が必要です。
- Funnel が TLS 上でサポートするポートは `443`、`8443`、`10000` のみです。
- macOS 上の Funnel にはオープンソース版 Tailscale アプリが必要です。

## 詳しく知る

- Tailscale Serve 概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 関連

- [Remote access](/ja-JP/gateway/remote)
- [Discovery](/ja-JP/gateway/discovery)
- [Authentication](/ja-JP/gateway/authentication)
