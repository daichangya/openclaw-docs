---
read_when:
    - OpenClaw を identity-aware proxy の背後で実行している
    - OpenClaw の前段に Pomerium、Caddy、または nginx + OAuth を設定している
    - リバースプロキシ構成で WebSocket 1008 unauthorized エラーを修正している
    - HSTS やその他の HTTP ハードニングヘッダーをどこで設定すべきか判断したい
summary: 認証を信頼できるリバースプロキシに委任する（Pomerium、Caddy、nginx + OAuth）
title: Trusted Proxy 認証
x-i18n:
    generated_at: "2026-04-05T12:46:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Trusted Proxy 認証

> ⚠️ **セキュリティ上重要な機能です。** このモードでは、認証を完全にリバースプロキシに委任します。設定を誤ると、Gateway が未承認アクセスにさらされる可能性があります。有効にする前に、このページを注意深く読んでください。

## 使用するべき場合

次のような場合は `trusted-proxy` 認証モードを使用してください。

- OpenClaw を **identity-aware proxy**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）の背後で実行している
- プロキシがすべての認証を処理し、ヘッダー経由でユーザー ID を渡す
- Kubernetes やコンテナー環境にいて、プロキシが Gateway への唯一の経路である
- ブラウザーが WS ペイロード内でトークンを渡せないため、WebSocket の `1008 unauthorized` エラーに遭遇している

## 使用してはいけない場合

- プロキシがユーザー認証をしていない場合（単なる TLS 終端やロードバランサー）
- プロキシを迂回して Gateway に到達できる経路が少しでもある場合（ファイアウォールの穴、内部ネットワークアクセス）
- プロキシが転送ヘッダーを正しく除去 / 上書きしているか確信が持てない場合
- 個人の単一ユーザーアクセスだけが必要な場合（より簡単なセットアップとして Tailscale Serve + loopback を検討してください）

## 仕組み

1. リバースプロキシがユーザーを認証する（OAuth、OIDC、SAML など）
2. プロキシが認証済みユーザー ID を含むヘッダーを追加する（例: `x-forwarded-user: nick@example.com`）
3. OpenClaw が、そのリクエストが**信頼されたプロキシ IP**（`gateway.trustedProxies` で設定）から来たことを確認する
4. OpenClaw が設定されたヘッダーからユーザー ID を抽出する
5. すべての条件が満たされれば、リクエストは認可される

## Control UI のペアリング動作

`gateway.auth.mode = "trusted-proxy"` が有効で、リクエストが
trusted-proxy チェックを通過すると、Control UI の WebSocket セッションは
デバイスペアリング ID なしで接続できます。

影響:

- このモードでは、Control UI アクセスの主なゲートはペアリングではなくなります。
- 実効的なアクセス制御は、リバースプロキシの認証ポリシーと `allowUsers` になります。
- Gateway への入口は、信頼されたプロキシ IP のみに厳しく制限してください（`gateway.trustedProxies` + ファイアウォール）。

## 設定

```json5
{
  gateway: {
    // Trusted-proxy auth は、loopback 以外の信頼されたプロキシ送信元からのリクエストを想定します
    bind: "lan",

    // 重要: ここにはあなたのプロキシ IP のみを追加してください
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 認証済みユーザー ID を含むヘッダー（必須）
        userHeader: "x-forwarded-user",

        // 任意: 必ず存在しなければならないヘッダー（プロキシ検証）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 任意: 特定ユーザーに制限する（空 = 全員許可）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

重要なランタイムルール:

- trusted-proxy 認証は、loopback 送信元のリクエスト（`127.0.0.1`、`::1`、loopback CIDR）を拒否します。
- 同一ホストの loopback リバースプロキシは trusted-proxy 認証を満たしません。
- 同一ホストの loopback プロキシ構成では、代わりに token / password 認証を使用するか、OpenClaw が検証できる loopback 以外の trusted proxy アドレス経由にしてください。
- loopback 以外の Control UI デプロイでは、明示的な `gateway.controlUi.allowedOrigins` も必要です。

### 設定リファレンス

| Field                                       | Required | 説明 |
| ------------------------------------------- | -------- | ---- |
| `gateway.trustedProxies`                    | Yes      | 信頼するプロキシ IP アドレスの配列です。他の IP からのリクエストは拒否されます。 |
| `gateway.auth.mode`                         | Yes      | `"trusted-proxy"` でなければなりません |
| `gateway.auth.trustedProxy.userHeader`      | Yes      | 認証済みユーザー ID を含むヘッダー名 |
| `gateway.auth.trustedProxy.requiredHeaders` | No       | リクエストを信頼するために追加で存在しなければならないヘッダー |
| `gateway.auth.trustedProxy.allowUsers`      | No       | ユーザー ID の allowlist。空なら認証済み全ユーザーを許可します。 |

## TLS 終端と HSTS

TLS 終端点は 1 つだけにし、HSTS はそこで適用してください。

### 推奨パターン: プロキシで TLS 終端

リバースプロキシが `https://control.example.com` の HTTPS を処理する場合は、
そのドメインに対して `Strict-Transport-Security` をプロキシ側で設定してください。

- インターネット公開のデプロイに適しています。
- 証明書と HTTP ハードニングポリシーを 1 か所で管理できます。
- OpenClaw はプロキシ背後の loopback HTTP のままにできます。

ヘッダー値の例:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway で TLS 終端

OpenClaw 自身が HTTPS を直接提供する場合（TLS 終端プロキシなし）は、次を設定します。

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` は文字列のヘッダー値、または明示的に無効化する `false` を受け付けます。

### ロールアウト指針

- まずは短い max age（例: `max-age=300`）から始めて、トラフィックを検証してください。
- 十分な確信が持ててから、長期間の値（例: `max-age=31536000`）に引き上げてください。
- `includeSubDomains` は、すべてのサブドメインが HTTPS 対応済みの場合にのみ追加してください。
- preload は、ドメイン全体が preload 要件を満たすよう意図的に整えている場合にのみ使用してください。
- loopback 専用のローカル開発では HSTS の恩恵はありません。

## プロキシ設定例

### Pomerium

Pomerium は `x-pomerium-claim-email`（または他の claim ヘッダー）に ID を渡し、`x-pomerium-jwt-assertion` に JWT を渡します。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium の IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Pomerium 設定スニペット:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### OAuth 付き Caddy

`caddy-security` プラグイン付き Caddy は、ユーザーを認証し、ID ヘッダーを渡せます。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Caddy / sidecar proxy の IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfile スニペット:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy はユーザーを認証し、`x-auth-request-email` に ID を渡します。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx / oauth2-proxy の IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginx 設定スニペット:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Forward Auth 付き Traefik

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik コンテナーの IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## 混在した token 設定

OpenClaw は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）と `trusted-proxy` モードが同時に有効なあいまいな設定を拒否します。token の混在設定は、loopback リクエストが誤った認証経路で黙って認証される原因になります。

起動時に `mixed_trusted_proxy_token` エラーが表示された場合:

- trusted-proxy モードを使うなら shared token を削除する、または
- token ベース認証を意図しているなら `gateway.auth.mode` を `"token"` に切り替える

loopback の trusted-proxy 認証もフェイルクローズします。同一ホストの呼び出し元は、黙って認証されるのではなく、信頼されたプロキシ経由で設定済みの ID ヘッダーを渡す必要があります。

## オペレータースコープヘッダー

trusted-proxy 認証は **ID を伴う** HTTP モードなので、呼び出し元は
`x-openclaw-scopes` でオペレータースコープを任意に宣言できます。

例:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

動作:

- ヘッダーが存在する場合、OpenClaw は宣言されたスコープ集合を尊重します。
- ヘッダーが存在していて空の場合、そのリクエストは**オペレータースコープなし**を宣言します。
- ヘッダーが存在しない場合、通常の ID 付き HTTP API は標準のオペレーターデフォルトスコープ集合にフォールバックします。
- Gateway-auth **plugin HTTP ルート**はデフォルトでより狭く、`x-openclaw-scopes` が存在しない場合、そのランタイムスコープは `operator.write` にフォールバックします。
- ブラウザー起点の HTTP リクエストは、trusted-proxy 認証が成功した後でも、`gateway.controlUi.allowedOrigins`（または意図的な Host-header フォールバックモード）を通過する必要があります。

実用的なルール:

- trusted-proxy リクエストをデフォルトより狭くしたい場合、または gateway-auth plugin ルートで write スコープより強い権限が必要な場合は、`x-openclaw-scopes` を明示的に送ってください。

## セキュリティチェックリスト

trusted-proxy 認証を有効にする前に、次を確認してください。

- [ ] **プロキシが唯一の経路である**: Gateway ポートは、あなたのプロキシ以外からはファイアウォールで遮断されている
- [ ] **trustedProxies が最小限である**: サブネット全体ではなく、実際のプロキシ IP のみ
- [ ] **loopback プロキシ送信元がない**: trusted-proxy 認証は loopback 送信元リクエストでフェイルクローズする
- [ ] **プロキシがヘッダーを除去する**: プロキシはクライアントからの `x-forwarded-*` ヘッダーを追記ではなく上書きする
- [ ] **TLS 終端**: プロキシが TLS を処理し、ユーザーは HTTPS 経由で接続する
- [ ] **allowedOrigins が明示的である**: loopback 以外の Control UI では明示的な `gateway.controlUi.allowedOrigins` を使う
- [ ] **allowUsers が設定されている**（推奨）: 認証済みなら誰でもではなく、既知のユーザーに制限する
- [ ] **混在した token 設定がない**: `gateway.auth.token` と `gateway.auth.mode: "trusted-proxy"` を同時に設定しない

## セキュリティ監査

`openclaw security audit` は、trusted-proxy 認証に対して**critical** 重大度の検出結果を出します。これは意図された動作で、セキュリティをプロキシ設定に委任していることへの注意喚起です。

監査では次を確認します。

- ベースとなる `gateway.trusted_proxy_auth` の warning / critical リマインダー
- `trustedProxies` 設定の欠落
- `userHeader` 設定の欠落
- 空の `allowUsers`（認証済みなら誰でも許可）
- 公開された Control UI サーフェスにおけるワイルドカードまたは欠落した browser-origin ポリシー

## トラブルシューティング

### 「trusted_proxy_untrusted_source」

リクエストが `gateway.trustedProxies` 内の IP から来ていません。次を確認してください。

- プロキシ IP は正しいですか？（Docker コンテナー IP は変わることがあります）
- プロキシの前段にロードバランサーはありますか？
- 実際の IP を確認するには `docker inspect` または `kubectl get pods -o wide` を使ってください

### 「trusted_proxy_loopback_source」

OpenClaw が loopback 送信元の trusted-proxy リクエストを拒否しました。

確認事項:

- プロキシは `127.0.0.1` / `::1` から接続していますか？
- 同一ホストの loopback リバースプロキシで trusted-proxy 認証を使おうとしていませんか？

修正方法:

- 同一ホストの loopback プロキシ構成では token / password 認証を使う、または
- loopback 以外の trusted proxy アドレスを経由し、その IP を `gateway.trustedProxies` に含める

### 「trusted_proxy_user_missing」

ユーザーヘッダーが空か存在しませんでした。次を確認してください。

- プロキシは ID ヘッダーを渡すように設定されていますか？
- ヘッダー名は正しいですか？（大文字小文字は区別しませんが、綴りは重要です）
- ユーザーは本当にプロキシで認証されていますか？

### 「trusted*proxy_missing_header*\*」

必要なヘッダーが存在しませんでした。次を確認してください。

- それらの特定ヘッダーに対するプロキシ設定
- 経路のどこかでヘッダーが除去されていないか

### 「trusted_proxy_user_not_allowed」

ユーザーは認証されていますが、`allowUsers` に含まれていません。追加するか、allowlist を削除してください。

### 「trusted_proxy_origin_not_allowed」

trusted-proxy 認証は成功しましたが、ブラウザーの `Origin` ヘッダーが Control UI の origin チェックを通過しませんでした。

確認事項:

- `gateway.controlUi.allowedOrigins` に正確なブラウザー origin が含まれている
- 意図的に全許可したい場合を除いて、ワイルドカード origin に依存していない
- Host-header フォールバックモードを意図的に使う場合、`gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` を明示的に設定している

### WebSocket がまだ失敗する

次の点をプロキシで確認してください。

- WebSocket アップグレードをサポートしている（`Upgrade: websocket`、`Connection: upgrade`）
- ID ヘッダーを WebSocket アップグレードリクエストでも渡している（HTTP だけではない）
- WebSocket 接続に別の認証経路が存在しない

## token 認証からの移行

token 認証から trusted-proxy へ移行する場合:

1. プロキシがユーザーを認証し、ヘッダーを渡すよう設定する
2. プロキシ構成を独立してテストする（ヘッダー付き `curl`）
3. OpenClaw の設定を trusted-proxy 認証に更新する
4. Gateway を再起動する
5. Control UI からの WebSocket 接続をテストする
6. `openclaw security audit` を実行して、検出結果を確認する

## 関連

- [Security](/gateway/security) — 完全なセキュリティガイド
- [Configuration](/gateway/configuration) — 設定リファレンス
- [Remote Access](/gateway/remote) — その他のリモートアクセスパターン
- [Tailscale](/gateway/tailscale) — tailnet 専用アクセス向けのより簡単な代替手段
