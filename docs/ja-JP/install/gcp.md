---
read_when:
    - GCP上でOpenClawを24時間365日実行したい場合
    - 自分のVM上で本番運用レベルの常時稼働Gatewayを実行したい場合
    - 永続化、バイナリ、再起動動作を完全に制御したい場合
summary: 耐久性のある状態を維持しながら、GCP Compute Engine VM（Docker）上でOpenClaw Gatewayを24時間365日実行する
title: GCP
x-i18n:
    generated_at: "2026-04-19T01:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4cf7924cbcfae74f268c88caedb79ed87a6ad37f4910ad65d92a5d99fe49c1
    source_path: install/gcp.md
    workflow: 15
---

# GCP Compute Engine上のOpenClaw（Docker、本番VPSガイド）

## 目的

耐久性のある状態、組み込み済みバイナリ、安全な再起動動作を備えて、GCP Compute Engine VM上でDockerを使って永続的なOpenClaw Gatewayを実行します。

「月額およそ$5〜12でOpenClawを24時間365日動かしたい」場合、これはGoogle Cloud上で信頼性の高い構成です。
料金はマシンタイプやリージョンによって異なります。ワークロードに合う最小のVMを選び、OOMが発生したらスケールアップしてください。

## 何をするのか（簡単に）

- GCPプロジェクトを作成して課金を有効化する
- Compute Engine VMを作成する
- Dockerをインストールする（分離されたアプリ実行環境）
- DockerでOpenClaw Gatewayを起動する
- ホスト上の`~/.openclaw` + `~/.openclaw/workspace`を永続化する（再起動や再構築後も残る）
- SSHトンネル経由でノートPCからControl UIにアクセスする

このマウントされた`~/.openclaw`の状態には、`openclaw.json`、エージェントごとの
`agents/<agentId>/agent/auth-profiles.json`、および`.env`が含まれます。

Gatewayには次の方法でアクセスできます。

- ノートPCからのSSHポートフォワーディング
- ファイアウォール設定とトークン管理を自分で行う場合は、ポートを直接公開

このガイドではGCP Compute Engine上のDebianを使用します。
Ubuntuでも動作します。パッケージ名は適宜読み替えてください。
一般的なDockerフローについては、[Docker](/ja-JP/install/docker)を参照してください。

---

## クイックパス（経験者向け）

1. GCPプロジェクトを作成し、Compute Engine APIを有効化する
2. Compute Engine VMを作成する（e2-small、Debian 12、20GB）
3. VMにSSH接続する
4. Dockerをインストールする
5. OpenClawリポジトリをクローンする
6. 永続化用のホストディレクトリを作成する
7. `.env`と`docker-compose.yml`を設定する
8. 必要なバイナリをイメージに組み込み、ビルドして起動する

---

## 必要なもの

- GCPアカウント（e2-microは無料枠の対象）
- インストール済みのgcloud CLI（またはCloud Consoleを使用）
- ノートPCからのSSHアクセス
- SSHとコピー&ペーストの基本操作
- 約20〜30分
- DockerとDocker Compose
- モデル認証情報
- 任意のプロバイダー認証情報
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLIをインストールする（またはConsoleを使う）">
    **オプションA: gcloud CLI**（自動化に推奨）

    [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) からインストールします

    初期化して認証します。

    ```bash
    gcloud init
    gcloud auth login
    ```

    **オプションB: Cloud Console**

    すべての手順は [https://console.cloud.google.com](https://console.cloud.google.com) のWeb UIから実行できます

  </Step>

  <Step title="GCPプロジェクトを作成する">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) で課金を有効化します（Compute Engineに必須）。

    Compute Engine APIを有効化します。

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. IAMと管理 > プロジェクトを作成 に移動する
    2. 名前を付けて作成する
    3. プロジェクトの課金を有効化する
    4. APIとサービス > APIを有効化 に移動し、「Compute Engine API」を検索して有効化する

  </Step>

  <Step title="VMを作成する">
    **マシンタイプ:**

    | Type      | Specs                    | Cost               | Notes                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU、4GB RAM          | 約$25/月           | ローカルDockerビルドで最も信頼性が高い       |
    | e2-small  | 2 vCPU、2GB RAM          | 約$12/月           | Dockerビルドに推奨される最小構成             |
    | e2-micro  | 2 vCPU（共有）、1GB RAM | 無料枠対象         | DockerビルドでOOM（exit 137）になりやすい    |

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

    1. Compute Engine > VMインスタンス > インスタンスを作成 に移動する
    2. 名前: `openclaw-gateway`
    3. リージョン: `us-central1`、ゾーン: `us-central1-a`
    4. マシンタイプ: `e2-small`
    5. ブートディスク: Debian 12、20GB
    6. 作成する

  </Step>

  <Step title="VMにSSH接続する">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Compute Engineダッシュボードで、VMの横にある「SSH」ボタンをクリックします。

    注: SSH鍵の反映にはVM作成後1〜2分かかることがあります。接続が拒否された場合は、少し待ってから再試行してください。

  </Step>

  <Step title="Dockerをインストールする（VM上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    グループ変更を反映するため、ログアウトして再ログインします。

    ```bash
    exit
    ```

    その後、再度SSH接続します。

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    確認します。

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
    長期間保持する状態はすべてホスト上に置く必要があります。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="環境変数を設定する">
    リポジトリのルートに`.env`を作成します。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    `.env`で明示的に管理したい場合を除き、`OPENCLAW_GATEWAY_TOKEN`は空のままにしてください。OpenClawは初回起動時にランダムなgateway tokenを設定へ書き込みます。鍵リング用パスワードを生成し、それを`GOG_KEYRING_PASSWORD`に貼り付けます。

    ```bash
    openssl rand -hex 32
    ```

    **このファイルはコミットしないでください。**

    この`.env`ファイルは、`OPENCLAW_GATEWAY_TOKEN`のようなコンテナ/ランタイム環境変数用です。
    保存されるプロバイダーOAuth/APIキー認証は、マウントされた
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`に保存されます。

  </Step>

  <Step title="Docker Composeの設定">
    `docker-compose.yml`を作成または更新します。

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
          # 推奨: GatewayはVM上でloopback専用のままにし、SSHトンネル経由でアクセスします。
          # 公開するには、`127.0.0.1:`プレフィックスを削除し、適切にファイアウォールを設定してください。
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

    `--allow-unconfigured`はブートストラップを簡単にするためだけのものです。適切なgateway設定の代替ではありません。引き続き認証（`gateway.auth.token`またはpassword）を設定し、デプロイに適した安全なbind設定を使用してください。

  </Step>

  <Step title="共有Docker VMランタイム手順">
    共通のDockerホストフローについては、共有ランタイムガイドを使用してください。

    - [必要なバイナリをイメージに組み込む](/ja-JP/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [ビルドして起動する](/ja-JP/install/docker-vm-runtime#build-and-launch)
    - [どこに何が永続化されるか](/ja-JP/install/docker-vm-runtime#what-persists-where)
    - [更新](/ja-JP/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP固有の起動メモ">
    `pnpm install --frozen-lockfile`中にビルドが`Killed`または`exit code 137`で失敗する場合、VMのメモリが不足しています。最低でも`e2-small`を使用し、初回ビルドの信頼性を高めるには`e2-medium`を使用してください。

    LANにbindする場合（`OPENCLAW_GATEWAY_BIND=lan`）、続行する前に信頼するブラウザーoriginを設定してください。

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    gatewayポートを変更した場合は、`18789`を設定したポートに置き換えてください。

  </Step>

  <Step title="ノートPCからアクセスする">
    Gatewayポートを転送するSSHトンネルを作成します。

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    ブラウザーで開きます。

    `http://127.0.0.1:18789/`

    クリーンなダッシュボードリンクを再表示します。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UIが共有シークレット認証を求めた場合は、設定済みのトークンまたは
    パスワードをControl UI設定に貼り付けてください。このDockerフローは
    デフォルトでトークンを書き込みます。コンテナ設定をpassword認証に
    切り替えた場合は、そのpasswordを使用してください。

    Control UIに`unauthorized`または`disconnected (1008): pairing required`と表示される場合は、ブラウザーデバイスを承認します。

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    共有の永続化や更新の参照先をもう一度確認したいですか。
    [Docker VM Runtime](/ja-JP/install/docker-vm-runtime#what-persists-where) と [Docker VM Runtime updates](/ja-JP/install/docker-vm-runtime#updates) を参照してください。

  </Step>
</Steps>

---

## トラブルシューティング

**SSH connection refused**

SSH鍵の反映にはVM作成後1〜2分かかることがあります。少し待ってから再試行してください。

**OS Loginの問題**

OS Loginプロファイルを確認します。

```bash
gcloud compute os-login describe-profile
```

アカウントに必要なIAM権限（Compute OS LoginまたはCompute OS Admin Login）があることを確認してください。

**メモリ不足（OOM）**

Dockerビルドが`Killed`および`exit code 137`で失敗する場合、VMがOOM-killされています。`e2-small`（最小）または`e2-medium`（信頼できるローカルビルドに推奨）へアップグレードしてください。

```bash
# まずVMを停止する
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# マシンタイプを変更する
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VMを起動する
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## サービスアカウント（セキュリティのベストプラクティス）

個人利用であれば、デフォルトのユーザーアカウントで問題ありません。

自動化やCI/CDパイプラインでは、最小権限の専用サービスアカウントを作成してください。

1. サービスアカウントを作成します。

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Adminロール（またはより狭いカスタムロール）を付与します。

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

自動化にOwnerロールは使用しないでください。最小権限の原則に従ってください。

IAMロールの詳細は、[https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) を参照してください。

---

## 次のステップ

- メッセージングチャネルを設定する: [Channels](/ja-JP/channels)
- ローカルデバイスをNodeとしてペアリングする: [Nodes](/ja-JP/nodes)
- Gatewayを設定する: [Gateway configuration](/ja-JP/gateway/configuration)
