---
read_when:
    - ローカルインストールの代わりにコンテナ化されたgatewayを使いたい場合
    - Dockerフローを検証している場合
summary: OpenClaw向けの任意のDockerベースセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-04-05T12:48:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker（任意）

Dockerは**任意**です。コンテナ化されたgatewayを使いたい場合、またはDockerフローを検証したい場合にのみ使用してください。

## Dockerは自分に合っているか？

- **Yes**: 分離された使い捨てのgateway環境が欲しい、またはローカルインストールなしでホスト上でOpenClawを実行したい。
- **No**: 自分のマシンで実行していて、最速の開発ループだけが欲しい。代わりに通常のインストールフローを使用してください。
- **サンドボックス化に関する注記**: エージェントサンドボックス化でもDockerを使いますが、gateway全体をDockerで実行する必要は**ありません**。[サンドボックス化](/gateway/sandboxing) を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に少なくとも2 GB RAM（1 GBホストでは `pnpm install` が exit 137 でOOM killされることがあります）
- イメージとログに十分なディスク容量
- VPS/公開ホスト上で実行する場合は、
  [ネットワーク公開のためのセキュリティハードニング](/gateway/security)、
  特にDockerの `DOCKER-USER` ファイアウォールポリシーを確認してください。

## コンテナ化されたGateway

<Steps>
  <Step title="イメージをビルドする">
    リポジトリルートから、セットアップスクリプトを実行します:

    ```bash
    ./scripts/docker/setup.sh
    ```

    これによりgatewayイメージがローカルでビルドされます。代わりにビルド済みイメージを使うには:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ビルド済みイメージは
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    で公開されています。
    一般的なタグ: `main`、`latest`、`<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトは自動的にオンボーディングを実行します。これにより次のことが行われます:

    - プロバイダーAPIキーの入力を求める
    - gatewayトークンを生成して `.env` に書き込む
    - Docker Compose経由でgatewayを起動する

    セットアップ中、起動前のオンボーディングと設定書き込みは
    `openclaw-gateway` を直接通じて実行されます。`openclaw-cli` は、
    gatewayコンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="コントロールUIを開く">
    ブラウザーで `http://127.0.0.1:18789/` を開き、設定済みの
    shared secretをSettingsに貼り付けます。セットアップスクリプトはデフォルトで
    `.env` にトークンを書き込みます。コンテナ設定をpassword認証に切り替えた場合は、
    代わりにそのpasswordを使ってください。

    URLをもう一度確認したいですか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャネルを設定する（任意）">
    CLIコンテナを使ってメッセージングチャネルを追加します:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp)、[Telegram](/ja-JP/channels/telegram)、[Discord](/ja-JP/channels/discord)

  </Step>
</Steps>

### 手動フロー

セットアップスクリプトを使わずに各手順を自分で実行したい場合:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` はリポジトリルートから実行してください。`OPENCLAW_EXTRA_MOUNTS`
または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml`
を書き出します。`-f docker-compose.yml -f docker-compose.extra.yml` でそれを含めてください。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワーク名前空間を共有するため、
起動後ツールです。`docker compose up -d openclaw-gateway` の前は、オンボーディング
とセットアップ時の設定書き込みを `openclaw-gateway` 経由で
`--no-deps --entrypoint node` を使って実行してください。
</Note>

### 環境変数

セットアップスクリプトは次の任意の環境変数を受け付けます:

| Variable                       | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | ローカルビルドの代わりにリモートイメージを使う                   |
| `OPENCLAW_DOCKER_APT_PACKAGES` | ビルド時に追加のaptパッケージをインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS`          | ビルド時に拡張機能依存関係を事前インストールする（スペース区切りの名前） |
| `OPENCLAW_EXTRA_MOUNTS`        | 追加のホストbind mount（カンマ区切りの `source:target[:opts]`）  |
| `OPENCLAW_HOME_VOLUME`         | `/home/node` を名前付きDocker volumeに永続化する                 |
| `OPENCLAW_SANDBOX`             | サンドボックスブートストラップにopt-inする（`1`、`true`、`yes`、`on`） |
| `OPENCLAW_DOCKER_SOCKET`       | Docker socketパスを上書きする                                    |

### ヘルスチェック

コンテナのプローブエンドポイント（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Dockerイメージには `/healthz` をpingする組み込みの `HEALTHCHECK` が含まれています。
チェックが継続して失敗すると、Dockerはコンテナを `unhealthy` とマークし、
オーケストレーションシステムはそれを再起動または置換できます。

認証付きの詳細ヘルススナップショット:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN と loopback

`scripts/docker/setup.sh` は `OPENCLAW_GATEWAY_BIND=lan` をデフォルトにするため、
Dockerのポート公開とともにホストから `http://127.0.0.1:18789` へアクセスできます。

- `lan`（デフォルト）: ホストブラウザーとホストCLIが公開されたgatewayポートに到達できます。
- `loopback`: コンテナのネットワーク名前空間内のプロセスだけが
  gatewayに直接到達できます。

<Note>
bindモードの値には、`0.0.0.0` や `127.0.0.1` のようなホストエイリアスではなく、`gateway.bind` の値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使ってください。
</Note>

### ストレージと永続化

Docker Composeは `OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、
`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` にbind mountするため、
これらのパスはコンテナ置換後も保持されます。

そのmountされた設定ディレクトリには、OpenClawが次を保存します:

- 動作設定用の `openclaw.json`
- 保存されたプロバイダーOAuth/APIキー認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` のようなenvベースのランタイムシークレット用の `.env`

VMデプロイにおける完全な永続化の詳細については、
[Docker VM Runtime - どこに何が永続化されるか](/install/docker-vm-runtime#what-persists-where)
を参照してください。

**ディスク増加のホットスポット:** `media/`、セッションJSONLファイル、`cron/runs/*.jsonl`、
および `/tmp/openclaw/` 配下のローテーションファイルログに注意してください。

### シェルヘルパー（任意）

日常的なDocker管理を簡単にするには、`ClawDock` をインストールします:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` のrawパスからClawDockをインストールしていた場合は、上のインストールコマンドを再実行して、ローカルのヘルパーファイルが新しい場所を追跡するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使います。すべてのコマンドを確認するには
`clawdock-help` を実行してください。
完全なヘルパーガイドは [ClawDock](/install/clawdock) を参照してください。

<AccordionGroup>
  <Accordion title="Docker gatewayでエージェントサンドボックスを有効にする">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    カスタムsocketパス（例: rootless Docker）:

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    スクリプトは、サンドボックス前提条件が通過した後にのみ `docker.sock` をmountします。
    サンドボックスセットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode`
    を `off` に戻します。

  </Accordion>

  <Accordion title="自動化 / CI（非対話式）">
    Composeの疑似TTY割り当てを `-T` で無効にします:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティ注記">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使うため、
    CLIコマンドが `127.0.0.1` 経由でgatewayに到達できます。これを共有の
    信頼境界として扱ってください。compose設定では `NET_RAW`/`NET_ADMIN` を削除し、
    `openclaw-cli` で `no-new-privileges` を有効化しています。
  </Accordion>

  <Accordion title="権限とEACCES">
    イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で
    権限エラーが出る場合は、ホストのbind mountが uid 1000 に所有されていることを確認してください:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="より高速なrebuild">
    依存関係レイヤーがキャッシュされるようにDockerfileを並べてください。これにより、
    lockfileが変わらない限り `pnpm install` の再実行を避けられます:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="上級者向けコンテナオプション">
    デフォルトイメージはセキュリティ優先で、非rootの `node` として実行されます。より
    高機能なコンテナにするには:

    1. **`/home/node` を永続化**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **システム依存関係を焼き込む**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwrightブラウザーをインストール**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **ブラウザーダウンロードを永続化**: 
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` を設定し、
       `OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使います。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（ヘッドレスDocker）">
    ウィザードでOpenAI Codex OAuthを選ぶと、ブラウザーURLが開きます。Dockerまたはヘッドレス環境では、遷移先の完全なリダイレクトURLをコピーして、認証を完了するためにウィザードへ貼り戻してください。
  </Accordion>

  <Accordion title="ベースイメージメタデータ">
    メインDockerイメージは `node:24-bookworm` を使用し、
    `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` などを含むOCI base-image
    annotationを公開します。詳細は
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
    を参照してください。
  </Accordion>
</AccordionGroup>

### VPSで実行する場合

共有VMデプロイ手順（バイナリの焼き込み、永続化、更新を含む）については、
[Hetzner (Docker VPS)](/install/hetzner) および
[Docker VM Runtime](/install/docker-vm-runtime) を参照してください。

## エージェントサンドボックス

`agents.defaults.sandbox` が有効な場合、gateway自体はホスト上に残ったまま、
gatewayはエージェントのツール実行
（シェル、ファイル読み書きなど）を分離されたDockerコンテナ内で実行します。これにより、gateway全体をコンテナ化せずに、信頼できない、または
マルチテナントなエージェントセッションの周囲に強い隔離を設けられます。

サンドボックススコープは、agent単位（デフォルト）、session単位、または共有にできます。各スコープには `/workspace` にmountされた独自のワークスペースがあります。allow/denyツールポリシー、ネットワーク分離、リソース制限、ブラウザーコンテナも設定できます。

完全な設定、イメージ、セキュリティ注記、およびマルチエージェントプロファイルについては、次を参照してください:

- [サンドボックス化](/gateway/sandboxing) -- 完全なサンドボックスリファレンス
- [OpenShell](/gateway/openshell) -- サンドボックスコンテナへの対話型シェルアクセス
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- agentごとの上書き

### クイック有効化

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

デフォルトのサンドボックスイメージをビルドします:

```bash
scripts/sandbox-setup.sh
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージがない、またはサンドボックスコンテナが起動しない">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    でサンドボックスイメージをビルドするか、`agents.defaults.sandbox.docker.image` を独自イメージに設定してください。
    コンテナはセッションごとに必要時に自動作成されます。
  </Accordion>

  <Accordion title="サンドボックス内の権限エラー">
    `docker.user` をmountされたワークスペース所有権に一致する UID:GID に設定するか、
    ワークスペースフォルダーを `chown` してください。
  </Accordion>

  <Accordion title="サンドボックス内でカスタムツールが見つからない">
    OpenClawは `sh -lc`（login shell）でコマンドを実行するため、
    `/etc/profile` を読み込み、PATHがリセットされることがあります。`docker.env.PATH` を設定して
    カスタムツールパスを先頭に追加するか、Dockerfile内の `/etc/profile.d/` にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中にOOM killされる（exit 137）">
    VMには少なくとも2 GB RAMが必要です。より大きいマシンクラスを使って再試行してください。
  </Accordion>

  <Accordion title="コントロールUIでUnauthorizedまたはpairing requiredと表示される">
    新しいダッシュボードリンクを取得し、ブラウザーデバイスを承認してください:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [Dashboard](/web/dashboard)、[Devices](/cli/devices)。

  </Accordion>

  <Accordion title="Gateway target に ws://172.x.x.x が表示される、または Docker CLIからpairingエラーが出る">
    gatewayモードとbindをリセットしてください:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [Install Overview](/install) — すべてのインストール方法
- [Podman](/install/podman) — Dockerの代替としてのPodman
- [ClawDock](/install/clawdock) — Docker Composeのコミュニティセットアップ
- [Updating](/install/updating) — OpenClawを最新に保つ方法
- [Configuration](/gateway/configuration) — インストール後のgateway設定
