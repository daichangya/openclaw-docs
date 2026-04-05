---
read_when:
    - OpenClaw をクラウド VPS 上で 24/7 実行したい場合（ラップトップ上ではなく）
    - 自分の VPS 上で本番向けの常時稼働 Gateway を使いたい場合
    - 永続化、バイナリ、再起動動作を完全に制御したい場合
    - Hetzner または類似のプロバイダーで Docker 上の OpenClaw を実行している場合
summary: 永続状態、組み込みバイナリ、安全な再起動動作を備えて、安価な Hetzner VPS 上で OpenClaw Gateway を 24/7 実行する
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T12:48:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# Hetzner 上の OpenClaw（Docker、本番 VPS ガイド）

## 目的

永続状態、組み込みバイナリ、安全な再起動動作を備えて、Docker を使って Hetzner VPS 上で永続的な OpenClaw Gateway を実行します。

「月額約 5 ドルで OpenClaw を 24/7 動かしたい」なら、これがもっともシンプルで信頼性の高いセットアップです。
Hetzner の価格は変わることがあるため、最小の Debian/Ubuntu VPS を選び、OOM が発生したらスケールアップしてください。

セキュリティモデルの注意:

- 全員が同じ信頼境界内にいて、ランタイムが業務専用である場合は、社内共有エージェントでも問題ありません。
- 厳格に分離してください: 専用の VPS/ランタイム + 専用アカウントを使い、そのホストには個人用の Apple/Google/ブラウザ/パスワードマネージャープロファイルを置かないでください。
- ユーザー同士が敵対的である可能性がある場合は、gateway/host/OS user ごとに分離してください。

[Security](/gateway/security) と [VPS hosting](/vps) を参照してください。

## 何をするのか（簡単に言うと）

- 小さな Linux サーバー（Hetzner VPS）を借りる
- Docker をインストールする（分離されたアプリランタイム）
- Docker で OpenClaw Gateway を起動する
- ホスト上で `~/.openclaw` + `~/.openclaw/workspace` を永続化する（再起動/再ビルド後も保持される）
- SSH トンネル経由でラップトップから Control UI にアクセスする

そのマウントされた `~/.openclaw` の状態には、`openclaw.json`、エージェントごとの
`agents/<agentId>/agent/auth-profiles.json`、および `.env` が含まれます。

Gateway へのアクセス方法:

- ラップトップからの SSH ポートフォワーディング
- ファイアウォール設定とトークン管理を自分で行う場合は、ポートを直接公開

このガイドは、Hetzner 上の Ubuntu または Debian を前提にしています。  
別の Linux VPS の場合は、パッケージを適宜読み替えてください。
一般的な Docker フローについては、[Docker](/install/docker) を参照してください。

---

## 手早い手順（経験のある運用者向け）

1. Hetzner VPS を用意する
2. Docker をインストールする
3. OpenClaw リポジトリを clone する
4. 永続ホストディレクトリを作成する
5. `.env` と `docker-compose.yml` を設定する
6. 必要なバイナリをイメージに組み込む
7. `docker compose up -d`
8. 永続化と Gateway アクセスを確認する

---

## 必要なもの

- root アクセス可能な Hetzner VPS
- ラップトップからの SSH アクセス
- SSH + コピー＆ペーストへの基本的な慣れ
- 約 20 分
- Docker と Docker Compose
- モデル認証情報
- 任意のプロバイダー認証情報
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="VPS を用意する">
    Hetzner で Ubuntu または Debian の VPS を作成します。

    root として接続します:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    このガイドでは、VPS がステートフルであることを前提にしています。
    使い捨てインフラとして扱わないでください。

  </Step>

  <Step title="Docker をインストールする（VPS 上）">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    確認:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw リポジトリを clone する">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    このガイドでは、バイナリ永続化を確実にするためにカスタムイメージをビルドする前提です。

  </Step>

  <Step title="永続ホストディレクトリを作成する">
    Docker コンテナはエフェメラルです。
    長期間保持する状態はすべてホスト上に置く必要があります。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # 所有者をコンテナユーザー（uid 1000）に設定:
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="環境変数を設定する">
    リポジトリルートに `.env` を作成します。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    強力なシークレットを生成します:

    ```bash
    openssl rand -hex 32
    ```

    **このファイルをコミットしないでください。**

    この `.env` ファイルは、`OPENCLAW_GATEWAY_TOKEN` のようなコンテナ/ランタイム env 用です。
    保存されるプロバイダー OAuth/API-key 認証は、マウントされた
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` にあります。

  </Step>

  <Step title="Docker Compose 設定">
    `docker-compose.yml` を作成または更新します。

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # 推奨: VPS 上では Gateway を loopback 専用に保ち、SSH トンネル経由でアクセスします。
          # 公開する場合は `127.0.0.1:` 接頭辞を外し、それに応じてファイアウォールを設定してください。
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` はブートストラップを容易にするためだけのものです。適切な gateway 設定の代替ではありません。引き続き auth（`gateway.auth.token` または password）を設定し、デプロイに適した安全な bind 設定を使ってください。

  </Step>

  <Step title="共有 Docker VM ランタイム手順">
    一般的な Docker ホストフローについては、共有ランタイムガイドを使ってください:

    - [必要なバイナリをイメージに組み込む](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドして起動する](/install/docker-vm-runtime#build-and-launch)
    - [どこに何が永続化されるか](/install/docker-vm-runtime#what-persists-where)
    - [更新](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 固有のアクセス">
    共有のビルドと起動の手順の後、ラップトップからトンネルします:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    次を開きます:

    `http://127.0.0.1:18789/`

    設定した shared secret を貼り付けてください。このガイドではデフォルトで gateway token を
    使用します。password auth に切り替えた場合は、代わりにその password を使ってください。

  </Step>
</Steps>

共有の永続化マップは [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) にあります。

## Infrastructure as Code（Terraform）

インフラをコードで管理するワークフローを好むチーム向けに、コミュニティ管理の Terraform セットアップでは次を提供しています:

- リモート状態管理付きのモジュラー Terraform 設定
- cloud-init による自動プロビジョニング
- デプロイスクリプト（bootstrap、deploy、backup/restore）
- セキュリティ hardening（ファイアウォール、UFW、SSH 専用アクセス）
- gateway アクセス用 SSH トンネル設定

**リポジトリ:**

- Infrastructure: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker config: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

このアプローチは、再現可能なデプロイ、バージョン管理されたインフラ、自動化された災害復旧によって、上記の Docker セットアップを補完します。

> **注:** コミュニティ管理です。問題や貢献については、上記のリポジトリリンクを参照してください。

## 次のステップ

- メッセージングチャネルを設定する: [Channels](/ja-JP/channels)
- Gateway を設定する: [Gateway configuration](/gateway/configuration)
- OpenClaw を最新の状態に保つ: [Updating](/install/updating)
