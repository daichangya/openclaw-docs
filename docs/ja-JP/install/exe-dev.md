---
read_when:
    - Gateway 用に安価で常時稼働する Linux ホストがほしい場合
    - 自分で VPS を運用せずにリモートの Control UI アクセスを使いたい場合
summary: リモートアクセス用に exe.dev（VM + HTTPS プロキシ）で OpenClaw Gateway を実行する
title: exe.dev
x-i18n:
    generated_at: "2026-04-05T12:47:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff95b6f35b95df35c1b0cae3215647eefe88d2b7f19923868385036cc0dbdbf1
    source_path: install/exe-dev.md
    workflow: 15
---

# exe.dev

目的: exe.dev の VM 上で OpenClaw Gateway を実行し、ラップトップから `https://<vm-name>.exe.xyz` 経由でアクセスできるようにすること

このページでは、exe.dev のデフォルト **exeuntu** イメージを前提にしています。別のディストリビューションを選んだ場合は、それに応じてパッケージを読み替えてください。

## 初心者向けの簡単な手順

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 必要に応じて auth key/token を入力
3. VM の横にある「Agent」をクリックし、Shelley によるプロビジョニングが完了するまで待つ
4. `https://<vm-name>.exe.xyz/` を開き、設定した shared secret で認証する（このガイドではデフォルトで token auth を使用しますが、`gateway.auth.mode` を切り替えれば password auth も使えます）
5. 保留中のデバイスペアリング要求を `openclaw devices approve <requestId>` で承認する

## 必要なもの

- exe.dev アカウント
- [exe.dev](https://exe.dev) 仮想マシンへの `ssh exe.dev` アクセス（任意）

## Shelley を使った自動インストール

[exe.dev](https://exe.dev) のエージェントである Shelley は、私たちの
プロンプトを使って OpenClaw を即座にインストールできます。使用するプロンプトは次のとおりです:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手動インストール

## 1) VM を作成する

お使いのデバイスから:

```bash
ssh exe.dev new
```

次に接続します:

```bash
ssh <vm-name>.exe.xyz
```

ヒント: この VM は**ステートフル**に保ってください。OpenClaw は
`openclaw.json`、エージェントごとの `auth-profiles.json`、セッション、チャネル/プロバイダー状態を
`~/.openclaw/` の下に保存し、ワークスペースは `~/.openclaw/workspace/` に保存します。

## 2) 前提パッケージをインストールする（VM 上）

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw をインストールする

OpenClaw のインストールスクリプトを実行します:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) nginx を設定して OpenClaw をポート 8000 にプロキシする

`/etc/nginx/sites-enabled/default` を次の内容で編集します

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

クライアント提供のチェーンを保持するのではなく、転送ヘッダーを上書きしてください。
OpenClaw は、明示的に設定されたプロキシからの forwarded IP メタデータのみを信頼し、
追記型の `X-Forwarded-For` チェーンは hardening 上のリスクとして扱われます。

## 5) OpenClaw にアクセスして権限を付与する

`https://<vm-name>.exe.xyz/` にアクセスします（オンボーディングの Control UI 出力を参照）。認証を求められたら、
VM で設定した shared secret を貼り付けてください。このガイドでは token auth を使うため、`gateway.auth.token`
は `openclaw config get gateway.auth.token` で取得します（または `openclaw doctor --generate-gateway-token` で生成します）。
Gateway を password auth に変更している場合は、代わりに `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使ってください。
デバイスは `openclaw devices list` と `openclaw devices approve <requestId>` で承認します。迷ったらブラウザから Shelley を使ってください。

## リモートアクセス

リモートアクセスは [exe.dev](https://exe.dev) の認証によって処理されます。デフォルトでは、
ポート 8000 からの HTTP トラフィックは、メール認証付きで `https://<vm-name>.exe.xyz`
へ転送されます。

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

ガイド: [Updating](/install/updating)
