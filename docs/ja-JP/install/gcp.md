---
read_when:
    - GCP 上で OpenClaw を 24 時間 365 日稼働させたい場合
    - 自分の VM 上で本番向けの常時稼働 Gateway を使いたい場合
    - 永続化、バイナリ、再起動動作を完全に制御したい場合
summary: 耐久的な状態を備えた GCP Compute Engine VM（Docker）で OpenClaw Gateway を 24 時間 365 日実行する
title: GCP
x-i18n:
    generated_at: "2026-04-05T12:48:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73daaee3de71dad5175f42abf3e11355f2603b2f9e2b2523eac4d4c7015e3ebc
    source_path: install/gcp.md
    workflow: 15
---

# GCP Compute Engine 上の OpenClaw（Docker、本番 VPS ガイド）

## 目的

Docker を使って GCP Compute Engine VM 上で永続的な OpenClaw Gateway を実行し、耐久的な状態、イメージに bake されたバイナリ、安全な再起動動作を実現します。

「月額およそ 5〜12 ドルで OpenClaw を 24 時間 365 日動かしたい」場合、これは Google Cloud 上で信頼性の高いセットアップです。
料金はマシンタイプとリージョンによって異なります。ワークロードに合う最小の VM を選び、OOM が発生したらスケールアップしてください。

## 何をするのか（簡単に言うと）

- GCP プロジェクトを作成して課金を有効にする
- Compute Engine VM を作成する
- Docker をインストールする（分離されたアプリ実行環境）
- Docker 内で OpenClaw Gateway を起動する
- ホスト上に `~/.openclaw` + `~/.openclaw/workspace` を永続化する（再起動 / 再ビルド後も保持）
- SSH トンネル経由でノート PC から Control UI にアクセスする

マウントされた `~/.openclaw` の状態には、`openclaw.json`、エージェントごとの
`agents/<agentId>/agent/auth-profiles.json`、および `.env` が含まれます。

Gateway には次の方法でアクセスできます:

- ノート PC からの SSH ポートフォワーディング
- ファイアウォールと token を自分で管理する場合の直接ポート公開

このガイドでは、GCP Compute Engine 上の Debian を使用します。
Ubuntu でも動作します。その場合はパッケージを適宜読み替えてください。
一般的な Docker フローについては、[Docker](/install/docker) を参照してください。

---

## クイックパス（経験のある運用者向け）

1. GCP プロジェクトを作成し、Compute Engine API を有効にする
2. Compute Engine VM を作成する（e2-small、Debian 12、20GB）
3. VM に SSH 接続する
4. Docker をインストールする
5. OpenClaw リポジトリーを clone する
6. 永続化用のホストディレクトリーを作成する
7. `.env` と `docker-compose.yml` を設定する
8. 必要なバイナリを bake し、ビルドして起動する

---

## 必要なもの

- GCP アカウント（e2-micro の free tier 対象）
- `gcloud` CLI インストール済み環境（または Cloud Console を使用）
- ノート PC からの SSH アクセス
- SSH とコピー / ペーストの基本的な操作
- 約 20〜30 分
- Docker と Docker Compose
- モデル auth 認証情報
- 任意のプロバイダー認証情報
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLI をインストールする（または Console を使う）">
    **方法 A: gcloud CLI**（自動化向けに推奨）

    [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) からインストールします。

    初期化して認証します:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **方法 B: Cloud Console**

    すべての手順は、[https://console.cloud.google.com](https://console.cloud.google.com) の web UI から実行できます。

  </Step>

  <Step title="GCP プロジェクトを作成する">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) で課金を有効にします（Compute Engine に必須）。

    Compute Engine API を有効にします:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. IAM と管理 > プロジェクトを作成 に移動
    2. 名前を付けて作成
    3. プロジェクトの課金を有効化
    4. API とサービス > API を有効化 に移動し、「Compute Engine API」を検索して有効化

  </Step>

  <Step title="VM を作成する">
    **マシンタイプ:**

    | Type      | Specs                    | Cost               | Notes                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | 約 $25/月            | ローカル Docker ビルドでは最も信頼性が高い        |
    | e2-small  | 2 vCPU, 2GB RAM          | 約 $12/月            | Docker ビルド向けの推奨最小構成                 |
    | e2-micro  | 2 vCPU（共有）, 1GB RAM | free tier 対象      | Docker ビルドで OOM（exit 137）になることが多い |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Compute Engine > VM instances > Create instance に移動
    2. 名前: `openclaw-gateway`
    3. Region: `us-central1`、Zone: `us-central1-a`
    4. Machine type: `e2-small`
    5. Boot disk: Debian 12、20GB
    6. 作成

  </Step>

  <Step title="VM に SSH 接続する">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Compute Engine ダッシュボードで、VM の横にある「SSH」ボタンをクリックします。

    注: SSH キーの伝播には、VM 作成後 1〜2 分かかることがあります。接続が拒否された場合は、少し待って再試行してください。

  </Step>

  <Step title="Docker をインストールする（VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    グループ変更を反映するため、ログアウトして再ログインします:

    ```bash
    exit
    ```

    その後、再度 SSH 接続します:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    確認:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw リポジトリーを clone する">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    このガイドでは、バイナリの永続性を確実にするためにカスタムイメージをビルドする前提です。

  </Step>

  <Step title="永続化用のホストディレクトリーを作成する">
    Docker コンテナーはエフェメラルです。
    長期間保持する状態はすべてホスト上に置く必要があります。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="環境変数を設定する">
    リポジトリーのルートに `.env` を作成します。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    強力な secret を生成します:

    ```bash
    openssl rand -hex 32
    ```

    **このファイルはコミットしないでください。**

    この `.env` ファイルは、`OPENCLAW_GATEWAY_TOKEN` のようなコンテナー / 実行時 env 用です。
    保存されるプロバイダー OAuth / API キー auth は、マウントされた
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます。

  </Step>

  <Step title="Docker Compose を設定する">
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
          # 推奨: Gateway は VM 上では loopback のみにして、SSH トンネル経由でアクセスします。
          # 公開する場合は `127.0.0.1:` 接頭辞を外し、ファイアウォールを適切に設定してください。
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

    `--allow-unconfigured` は bootstrap の利便性のためだけのものです。適切な gateway 設定の代わりにはなりません。引き続き auth（`gateway.auth.token` または password）を設定し、デプロイに応じて安全な bind 設定を使用してください。

  </Step>

  <Step title="共有 Docker VM 実行手順">
    一般的な Docker ホストフローについては、共有実行ガイドを使ってください:

    - [必要なバイナリをイメージに bake する](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドと起動](/install/docker-vm-runtime#build-and-launch)
    - [何がどこに永続化されるか](/install/docker-vm-runtime#what-persists-where)
    - [更新](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 固有の起動メモ">
    GCP では、`pnpm install --frozen-lockfile` 中に `Killed` または `exit code 137` でビルドが失敗した場合、その VM はメモリー不足です。最低でも `e2-small`、初回ビルドをより安定させるには `e2-medium` を使ってください。

    LAN に bind する場合（`OPENCLAW_GATEWAY_BIND=lan`）、続行する前に信頼するブラウザー origin を設定してください:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    gateway port を変更した場合は、`18789` を設定した port に置き換えてください。

  </Step>

  <Step title="ノート PC からアクセスする">
    Gateway port を転送する SSH トンネルを作成します:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    ブラウザーで開きます:

    `http://127.0.0.1:18789/`

    きれいなダッシュボードリンクを再表示するには:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UI が shared-secret auth を求めた場合は、設定済みの token または
    password を Control UI 設定に貼り付けてください。この Docker フローでは
    デフォルトで token を書き込みます。コンテナー設定を password auth に
    切り替えた場合は、代わりにその password を使用してください。

    Control UI に `unauthorized` または `disconnected (1008): pairing required` が表示される場合は、ブラウザーデバイスを承認してください:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    共有の永続化 / 更新リファレンスをもう一度確認したいですか?
    [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) と [Docker VM Runtime updates](/install/docker-vm-runtime#updates) を参照してください。

  </Step>
</Steps>

---

## トラブルシューティング

**SSH 接続が拒否される**

SSH キーの伝播には VM 作成後 1〜2 分かかることがあります。少し待って再試行してください。

**OS Login の問題**

OS Login プロファイルを確認します:

```bash
gcloud compute os-login describe-profile
```

アカウントに必要な IAM 権限（Compute OS Login または Compute OS Admin Login）があることを確認してください。

**メモリー不足（OOM）**

Docker ビルドが `Killed` と `exit code 137` で失敗する場合、その VM は OOM kill されています。e2-small（最小）または e2-medium（ローカルビルドを安定して行う推奨構成）にアップグレードしてください:

```bash
# まず VM を停止
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# マシンタイプを変更
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM を起動
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## サービスアカウント（セキュリティのベストプラクティス）

個人利用であれば、通常はデフォルトのユーザーアカウントで問題ありません。

自動化または CI/CD パイプラインでは、最小権限を持つ専用サービスアカウントを作成してください:

1. サービスアカウントを作成します:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin ロール（またはより狭いカスタムロール）を付与します:

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

自動化に Owner ロールを使うのは避けてください。最小権限の原則を使ってください。

IAM ロールの詳細は [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) を参照してください。

---

## 次のステップ

- メッセージングチャネルを設定する: [Channels](/ja-JP/channels)
- ローカルデバイスを node として pairing する: [Nodes](/nodes)
- Gateway を設定する: [Gateway configuration](/gateway/configuration)
