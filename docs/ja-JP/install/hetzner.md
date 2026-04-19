---
read_when:
    - OpenClawをクラウドVPS上で24時間365日稼働させたい（ノートPCではなく）
    - 自分のVPS上で、本番運用向けの常時稼働するGatewayを使いたい
    - 永続化、バイナリ、再起動の挙動をすべて自分で制御したい
    - Hetznerまたは同様のプロバイダー上で、DockerでOpenClawを実行している
summary: 安価なHetzner VPS（Docker）で、永続的な状態と組み込み済みバイナリを備えたOpenClaw Gatewayを24時間365日実行する
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# Hetzner上のOpenClaw（Docker、本番VPSガイド）

## 目的

Dockerを使ってHetzner VPS上で永続的なOpenClaw Gatewayを実行し、耐久性のある状態、組み込み済みバイナリ、安全な再起動動作を実現します。

「約5ドルで24時間365日OpenClawを動かしたい」なら、これが最もシンプルで信頼性の高いセットアップです。  
Hetznerの料金は変動するため、最小のDebian/Ubuntu VPSを選び、OOMが発生したらスケールアップしてください。

セキュリティモデルの注意:

- 会社で共有するエージェントは、全員が同じ信頼境界内にいて、ランタイムが業務専用である場合に適しています。
- 厳格な分離を保ってください: 専用のVPS/ランタイム + 専用アカウントを使い、そのホスト上には個人用のApple/Google/ブラウザ/パスワードマネージャープロファイルを置かないでください。
- ユーザー同士が敵対的である場合は、gateway/host/OS userごとに分離してください。

[Security](/ja-JP/gateway/security) と [VPS hosting](/ja-JP/vps) を参照してください。

## 何をするのか（簡単に言うと）?

- 小さなLinuxサーバーを借りる（Hetzner VPS）
- Dockerをインストールする（分離されたアプリランタイム）
- DockerでOpenClaw Gatewayを起動する
- ホスト上で `~/.openclaw` + `~/.openclaw/workspace` を永続化する（再起動/再ビルド後も残る）
- SSHトンネル経由でノートPCからControl UIにアクセスする

このマウントされた `~/.openclaw` の状態には、`openclaw.json`、エージェントごとの `agents/<agentId>/agent/auth-profiles.json`、および `.env` が含まれます。

Gatewayには次の方法でアクセスできます:

- ノートPCからのSSHポートフォワーディング
- ファイアウォールとトークンを自分で管理する場合は、ポートを直接公開

このガイドはHetzner上のUbuntuまたはDebianを前提としています。  
別のLinux VPSを使っている場合は、適宜パッケージ名を読み替えてください。  
一般的なDockerの流れについては、[Docker](/ja-JP/install/docker) を参照してください。

---

## クイックパス（経験のある運用者向け）

1. Hetzner VPSを用意する
2. Dockerをインストールする
3. OpenClawリポジトリをクローンする
4. 永続化用のホストディレクトリを作成する
5. `.env` と `docker-compose.yml` を設定する
6. 必要なバイナリをイメージに組み込む
7. `docker compose up -d`
8. 永続化とGatewayアクセスを確認する

---

## 必要なもの

- rootアクセス可能なHetzner VPS
- ノートPCからのSSHアクセス
- SSH + コピー＆ペーストの基本操作に慣れていること
- 約20分
- DockerとDocker Compose
- モデル認証情報
- 任意のプロバイダー認証情報
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="VPSを用意する">
    HetznerでUbuntuまたはDebianのVPSを作成します。

    rootとして接続します:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    このガイドでは、VPSがステートフルであることを前提としています。
    使い捨てインフラとして扱わないでください。

  </Step>

  <Step title="Dockerをインストールする（VPS上）">
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

  <Step title="OpenClawリポジトリをクローンする">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    このガイドでは、バイナリの永続性を確実にするためにカスタムイメージをビルドする前提です。

  </Step>

  <Step title="永続化用のホストディレクトリを作成する">
    Dockerコンテナはエフェメラルです。
    長期間保持するすべての状態はホスト上に置く必要があります。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # 所有者をコンテナユーザー（uid 1000）に設定:
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="環境変数を設定する">
    リポジトリのルートに `.env` を作成します。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    `.env` 経由で明示的に管理したい場合を除き、`OPENCLAW_GATEWAY_TOKEN` は空欄のままにしてください。OpenClawは初回起動時にランダムなgateway tokenをconfigに書き込みます。keyring passwordを生成して、`GOG_KEYRING_PASSWORD` に貼り付けてください:

    ```bash
    openssl rand -hex 32
    ```

    **このファイルはコミットしないでください。**

    この `.env` ファイルは、`OPENCLAW_GATEWAY_TOKEN` のようなコンテナ/ランタイム環境変数用です。
    保存されるプロバイダーOAuth/API-key認証は、マウントされた
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます。

  </Step>

  <Step title="Docker Composeの設定">
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
          # 推奨: GatewayはVPS上でloopback専用のままにし、SSHトンネル経由でアクセスします。
          # 公開する場合は、`127.0.0.1:` の接頭辞を外し、適切にファイアウォールを設定してください。
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

    `--allow-unconfigured` はブートストラップの利便性のためだけのものであり、適切なgateway設定の代わりにはなりません。引き続き auth（`gateway.auth.token` または password）を設定し、デプロイに適した安全なbind設定を使用してください。

  </Step>

  <Step title="共通のDocker VMランタイム手順">
    共通のDockerホストの流れについては、共有ランタイムガイドを使ってください:

    - [必要なバイナリをイメージに組み込む](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドと起動](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [何がどこに永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner固有のアクセス方法">
    共通のビルドと起動手順の後、ノートPCからトンネルを張ります:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    開きます:

    `http://127.0.0.1:18789/`

    設定した共有シークレットを貼り付けてください。このガイドでは、デフォルトでgateway tokenを使用します。password認証に切り替えた場合は、代わりにそのpasswordを使ってください。

  </Step>
</Steps>

共有の永続化マップは [Docker VM Runtime](/ja-JP/install/docker-vm-runtime#what-persists-where) にあります。

## Infrastructure as Code（Terraform）

インフラをコードで管理するワークフローを好むチーム向けに、コミュニティ管理のTerraformセットアップでは次のものが提供されています:

- リモート状態管理を備えたモジュール式Terraform設定
- cloud-initによる自動プロビジョニング
- デプロイスクリプト（bootstrap、deploy、backup/restore）
- セキュリティ強化（firewall、UFW、SSH専用アクセス）
- gatewayアクセス用のSSHトンネル設定

**リポジトリ:**

- Infrastructure: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker config: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

このアプローチは、再現可能なデプロイ、バージョン管理されたインフラ、自動化された障害復旧を通じて、上記のDockerセットアップを補完します。

> **注意:** コミュニティ管理です。問題報告やコントリビューションについては、上記のリポジトリリンクを参照してください。

## 次のステップ

- メッセージングチャネルを設定する: [Channels](/ja-JP/channels)
- Gatewayを設定する: [Gateway configuration](/ja-JP/gateway/configuration)
- OpenClawを最新の状態に保つ: [Updating](/ja-JP/install/updating)
