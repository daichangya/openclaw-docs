---
read_when:
    - モバイルnode appをgatewayとすばやくペアリングしたい場合
    - リモート/手動共有用のsetup-code出力が必要な場合
summary: '`openclaw qr`のCLIリファレンス（モバイルペアリングQR + セットアップコードの生成）'
title: qr
x-i18n:
    generated_at: "2026-04-05T12:39:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

現在のGateway設定から、モバイルペアリング用のQRとsetup codeを生成します。

## 使用方法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## オプション

- `--remote`: `gateway.remote.url`を優先します。これが未設定でも、`gateway.tailscale.mode=serve|funnel`がリモート公開URLを提供できる場合があります
- `--url <url>`: payloadで使うgateway URLを上書き
- `--public-url <url>`: payloadで使う公開URLを上書き
- `--token <token>`: bootstrapフローが認証に使うgateway tokenを上書き
- `--password <password>`: bootstrapフローが認証に使うgateway passwordを上書き
- `--setup-code-only`: setup codeのみを出力
- `--no-ascii`: ASCII QRレンダリングをスキップ
- `--json`: JSONを出力（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 注

- `--token`と`--password`は同時に指定できません。
- setup code自体には、共有gateway token/passwordではなく、不透明で短命な`bootstrapToken`が含まれるようになりました。
- 組み込みのnode/operator bootstrapフローでは、primary node tokenは引き続き`scopes: []`で発行されます。
- bootstrap handoffがoperator tokenも発行する場合、そのtokenはbootstrap allowlistに制限されたままです: `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`。
- Bootstrap scopeチェックはroleプレフィックス付きです。そのoperator allowlistはoperatorリクエストだけを満たします。operator以外のroleでは、各roleプレフィックス配下のscopeが引き続き必要です。
- Tailscale/publicな`ws://` gateway URLでは、モバイルペアリングはfail closedします。プライベートLANの`ws://`は引き続きサポートされますが、Tailscale/publicなモバイル経路ではTailscale Serve/Funnelまたは`wss://` gateway URLを使う必要があります。
- `--remote`を使う場合、OpenClawは`gateway.remote.url`または
  `gateway.tailscale.mode=serve|funnel`のいずれかを必要とします。
- `--remote`を使う場合、実効的に有効なremote credentialsがSecretRefとして設定されていて、`--token`または`--password`を渡さないときは、コマンドはアクティブなgateway snapshotからそれらを解決します。gatewayが利用できない場合、コマンドは即座に失敗します。
- `--remote`を使わない場合、CLI auth overrideが渡されていなければ、ローカルgateway auth SecretRefsが解決されます:
  - token authが有効になりうる場合、`gateway.auth.token`が解決されます（明示的な`gateway.auth.mode="token"`、またはpassword sourceが勝たない推測モード）。
  - password authが有効になりうる場合、`gateway.auth.password`が解決されます（明示的な`gateway.auth.mode="password"`、またはauth/envから勝つtokenがない推測モード）。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されていて（SecretRefsを含む）、`gateway.auth.mode`が未設定の場合、modeを明示的に設定するまでsetup-code解決は失敗します。
- Gatewayのバージョン差異に関する注記: このコマンドパスには`secrets.resolve`をサポートするgatewayが必要です。古いgatewayではunknown-methodエラーが返ります。
- スキャン後、デバイスペアリングを承認するには次を使います:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
