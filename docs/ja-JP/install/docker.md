---
read_when:
    - ローカルインストールの代わりにコンテナ化されたgatewayを使いたい
    - Dockerフローを検証している
summary: OpenClaw のオプションのDockerベースセットアップとオンボーディング
title: Docker
x-i18n:
    generated_at: "2026-04-26T11:32:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker は**任意**です。コンテナ化されたgatewayを使いたい場合、またはDockerフローを検証したい場合にのみ使ってください。

## Docker は自分に合っているか？

- **はい**: 分離された使い捨てのgateway環境が欲しい、またはローカルインストールなしでOpenClawをホスト上で動かしたい。
- **いいえ**: 自分のマシン上で動かしていて、最速の開発ループが欲しいだけ。代わりに通常のインストールフローを使ってください。
- **Sandboxing に関する注意**: sandboxing が有効なとき、デフォルトのsandboxバックエンドはDockerを使いますが、sandboxing はデフォルトでオフであり、gateway全体をDockerで動かす必要は**ありません**。SSH および OpenShell のsandboxバックエンドも利用できます。[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。

## 前提条件

- Docker Desktop（または Docker Engine）+ Docker Compose v2
- イメージビルド用に最低2 GB RAM（1 GBホストでは `pnpm install` が exit 137 でOOM kill されることがあります）
- イメージとログのための十分なディスク容量
- VPS/公開ホストで動かす場合は、
  [ネットワーク公開に対するセキュリティハードニング](/ja-JP/gateway/security)
  を確認してください。特に Docker `DOCKER-USER` firewall policy に注意してください。

## コンテナ化されたGateway

<Steps>
  <Step title="イメージをビルドする">
    repo root から、セットアップスクリプトを実行します。

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
    よく使うタグ: `main`, `latest`, `<version>`（例: `2026.2.26`）。

  </Step>

  <Step title="オンボーディングを完了する">
    セットアップスクリプトは自動的にオンボーディングを実行します。内容は次のとおりです。

    - プロバイダーAPI keys の入力を促す
    - gateway token を生成して `.env` に書き込む
    - Docker Compose 経由でgatewayを起動する

    セットアップ中、起動前オンボーディングとconfig書き込みは
    `openclaw-gateway` を直接通して実行されます。`openclaw-cli` は、
    gatewayコンテナがすでに存在した後に実行するコマンド用です。

  </Step>

  <Step title="Control UI を開く">
    ブラウザーで `http://127.0.0.1:18789/` を開き、Settings に設定済みの
    shared secret を貼り付けます。セットアップスクリプトはデフォルトで `.env` にtokenを書き込みます。コンテナconfigをpassword認証に切り替えた場合は、代わりにそのpasswordを使ってください。

    URLをもう一度確認したいですか？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="チャネルを設定する（任意）">
    CLIコンテナを使ってメッセージングチャネルを追加します。

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    ドキュメント: [WhatsApp](/ja-JP/channels/whatsapp), [Telegram](/ja-JP/channels/telegram), [Discord](/ja-JP/channels/discord)

  </Step>
</Steps>

### 手動フロー

セットアップスクリプトを使わず、各手順を自分で実行したい場合:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` はrepo root から実行してください。`OPENCLAW_EXTRA_MOUNTS`
または `OPENCLAW_HOME_VOLUME` を有効にした場合、セットアップスクリプトは `docker-compose.extra.yml`
を書き出します。`-f docker-compose.yml -f docker-compose.extra.yml` で含めてください。
</Note>

<Note>
`openclaw-cli` は `openclaw-gateway` のネットワークnamespaceを共有するため、
起動後ツールです。`docker compose up -d openclaw-gateway` の前は、オンボーディング
とセットアップ時のconfig書き込みを `openclaw-gateway` 経由で
`--no-deps --entrypoint node` を付けて実行してください。
</Note>

### 環境変数

セットアップスクリプトは、以下の任意の環境変数を受け付けます。

| 変数 | 用途 |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE` | ローカルビルドの代わりにリモートイメージを使う |
| `OPENCLAW_DOCKER_APT_PACKAGES` | ビルド中に追加のapt packages をインストールする（スペース区切り） |
| `OPENCLAW_EXTENSIONS` | ビルド時にPlugin 依存関係を事前インストールする（スペース区切りの名前） |
| `OPENCLAW_EXTRA_MOUNTS` | 追加のホストbind mounts（カンマ区切りの `source:target[:opts]`） |
| `OPENCLAW_HOME_VOLUME` | `/home/node` を名前付きDocker volume に永続化する |
| `OPENCLAW_SANDBOX` | sandbox bootstrap にオプトインする（`1`, `true`, `yes`, `on`） |
| `OPENCLAW_DOCKER_SOCKET` | Docker socket path を上書きする |
| `OPENCLAW_DISABLE_BONJOUR` | Bonjour/mDNS 広告を無効にする（Dockerではデフォルト `1`） |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | バンドル済みPlugin source のbind-mount overlay を無効にする |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry export 用の共有 OTLP/HTTP collector endpoint |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT` | traces、metrics、logs 用のシグナル別 OTLP endpoints |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP protocol 上書き。現在サポートされるのは `http/protobuf` のみ |
| `OTEL_SERVICE_NAME` | OpenTelemetry resources で使われるservice名 |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | 最新の実験的 GenAI semantic attributes にオプトインする |
| `OPENCLAW_OTEL_PRELOADED` | すでに1つ preload されている場合に2つ目のOpenTelemetry SDK起動をスキップする |

メンテナーは、パッケージ済みイメージに対してバンドル済みPlugin source をテストするために、
1つのPlugin source ディレクトリを、そのパッケージ済みsource path にマウントできます。たとえば
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
のように指定します。そのマウントされたsource ディレクトリは、同じplugin id に対する
対応するコンパイル済みの `/app/dist/extensions/synology-chat` bundle を上書きします。

### 可観測性

OpenTelemetry export は、GatewayコンテナからOTLP
collector への送信です。公開されたDocker port は必要ありません。ローカルでイメージを
ビルドし、バンドル済みOpenTelemetry exporter をイメージ内で利用できるようにしたい場合は、
そのランタイム依存関係を含めてください。

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

公式のOpenClaw Dockerリリースイメージには、バンドル済みの
`diagnostics-otel` Plugin source が含まれています。イメージとキャッシュ状態によっては、
Plugin を最初に有効化したときに、Gateway がPlugin ローカルのOpenTelemetryランタイム依存関係を
ステージする必要がある場合があります。そのため、最初の起動時はパッケージregistryへ到達できるようにするか、
リリースレーン内でイメージを事前ウォームアップしてください。export を有効にするには、
configで `diagnostics-otel` Plugin を許可して有効化し、その後
`diagnostics.otel.enabled=true` を設定するか、
[OpenTelemetry export](/ja-JP/gateway/opentelemetry) のconfig例を使ってください。collector 認証headers は
Docker環境変数ではなく、`diagnostics.otel.headers` で設定します。

Prometheus metrics は、すでに公開されているGateway port を使います。
`diagnostics-prometheus` Plugin を有効にした後、次をscrapeしてください。

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

このルートはGateway認証で保護されています。別の公開
`/metrics` port や、無認証のreverse-proxy path を公開しないでください。
[Prometheus metrics](/ja-JP/gateway/prometheus) を参照してください。

### ヘルスチェック

コンテナprobe endpoints（認証不要）:

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Dockerイメージには、`/healthz` をpingする組み込みの `HEALTHCHECK` が含まれています。
チェックが失敗し続けると、Docker はコンテナを `unhealthy` とマークし、
オーケストレーションシステムは再起動または置換できます。

認証付きのdeep health snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN と loopback

`scripts/docker/setup.sh` はデフォルトで `OPENCLAW_GATEWAY_BIND=lan` にするため、
Docker port publishing を通じてホストから `http://127.0.0.1:18789` へアクセスできます。

- `lan`（デフォルト）: ホストブラウザーとホストCLIが、公開されたgateway port に到達できます。
- `loopback`: コンテナのネットワークnamespace内のプロセスだけが、
  gatewayへ直接到達できます。

<Note>
`0.0.0.0` や `127.0.0.1` のようなホスト別名ではなく、`gateway.bind` にはbind mode 値（`lan` / `loopback` / `custom` /
`tailnet` / `auto`）を使ってください。
</Note>

### Bonjour / mDNS

Docker bridge networking は通常、Bonjour/mDNS multicast
（`224.0.0.251:5353`）を信頼して転送しません。そのため、バンドル済みComposeセットアップでは
デフォルトで `OPENCLAW_DISABLE_BONJOUR=1` とし、bridge がmulticast traffic を落としても
Gateway がクラッシュループしたり、広告を繰り返し再起動したりしないようにしています。

Dockerホストでは、公開されたGateway URL、Tailscale、または広域DNS-SDを使ってください。
`OPENCLAW_DISABLE_BONJOUR=0` は、host networking、macvlan、
またはmDNS multicast が動作すると確認されている他のネットワークでのみ設定してください。

注意点とトラブルシューティングについては、[Bonjour discovery](/ja-JP/gateway/bonjour) を参照してください。

### ストレージと永続化

Docker Compose は、`OPENCLAW_CONFIG_DIR` を `/home/node/.openclaw` に、
`OPENCLAW_WORKSPACE_DIR` を `/home/node/.openclaw/workspace` にbind-mount するため、
これらのパスはコンテナ置換後も保持されます。

そのマウントされたconfigディレクトリには、OpenClaw の以下が保存されます。

- 動作config 用の `openclaw.json`
- 保存済みプロバイダーOAuth/API-key 認証用の `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` などenvベースのランタイムsecret 用の `.env`

VMデプロイにおける完全な永続化詳細については、
[Docker VM Runtime - What persists where](/ja-JP/install/docker-vm-runtime#what-persists-where)
を参照してください。

**ディスク増加のホットスポット:** `media/`、session JSONL files、`cron/runs/*.jsonl`、
および `/tmp/openclaw/` 配下のローテーションファイルログに注意してください。

### シェルヘルパー（任意）

日常的なDocker管理を簡単にするには、`ClawDock` をインストールしてください。

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

古い `scripts/shell-helpers/clawdock-helpers.sh` のraw path から ClawDock をインストールしていた場合は、上のインストールコマンドを再実行して、ローカルのhelper file が新しい場所を追従するようにしてください。

その後、`clawdock-start`、`clawdock-stop`、`clawdock-dashboard` などを使えます。
すべてのコマンドは `clawdock-help` を実行してください。
完全なhelper guide は [ClawDock](/ja-JP/install/clawdock) を参照してください。

<AccordionGroup>
  <Accordion title="Docker gateway でエージェントsandboxを有効にする">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    カスタムsocket path（例: rootless Docker）:

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    スクリプトは、sandbox前提条件を満たした後にのみ `docker.sock` をマウントします。
    sandboxセットアップを完了できない場合、スクリプトは `agents.defaults.sandbox.mode`
    を `off` に戻します。

  </Accordion>

  <Accordion title="自動化 / CI（非対話）">
    Compose の擬似TTY割り当てを `-T` で無効にします。

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共有ネットワークのセキュリティに関する注意">
    `openclaw-cli` は `network_mode: "service:openclaw-gateway"` を使うため、
    CLIコマンドは `127.0.0.1` 経由でgatewayに到達できます。これは共有の
    信頼境界として扱ってください。compose config は `openclaw-cli` から
    `NET_RAW`/`NET_ADMIN` を削除し、`no-new-privileges` を有効にしています。
  </Accordion>

  <Accordion title="権限と EACCES">
    イメージは `node`（uid 1000）として実行されます。`/home/node/.openclaw` で
    権限エラーが出る場合は、ホストのbind mounts が uid 1000 の所有になっていることを確認してください。

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="より速い再ビルド">
    Dockerfile の順序を、依存関係レイヤーがキャッシュされるようにしてください。これにより
    lockfile が変わらない限り `pnpm install` の再実行を避けられます。

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
    デフォルトイメージはセキュリティ優先で、非rootの `node` として動作します。より
    機能豊富なコンテナにするには:

    1. **`/home/node` を永続化する**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **system deps をイメージに焼き込む**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright browsers をインストールする**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **browser downloads を永続化する**: 
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` を設定し、
       `OPENCLAW_HOME_VOLUME` または `OPENCLAW_EXTRA_MOUNTS` を使います。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（ヘッドレスDocker）">
    ウィザードでOpenAI Codex OAuth を選ぶと、ブラウザーURLが開きます。Docker または
    ヘッドレス環境では、最終的に到達した完全なredirect URLをコピーして、認証完了のために
    ウィザードへ貼り戻してください。
  </Accordion>

  <Accordion title="ベースイメージメタデータ">
    メインDockerイメージは `node:24-bookworm` を使い、
    `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` などのOCI base-image
    annotations を公開します。詳細は
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
    を参照してください。
  </Accordion>
</AccordionGroup>

### VPSで動かしますか？

共有VMデプロイ手順については [Hetzner (Docker VPS)](/ja-JP/install/hetzner) と
[Docker VM Runtime](/ja-JP/install/docker-vm-runtime) を参照してください。
これにはバイナリの焼き込み、永続化、更新が含まれます。

## エージェントSandbox

Dockerバックエンドで `agents.defaults.sandbox` が有効な場合、gateway
自体はホスト上に残したまま、エージェントのツール実行（shell、file read/write など）を分離されたDocker
containers 内で実行します。これにより、gateway全体をコンテナ化せずに、
信頼できない、またはマルチテナントのエージェントセッションに対して強固な壁を作れます。

Sandbox scope はエージェントごと（デフォルト）、セッションごと、または共有にできます。各scope
には `/workspace` にマウントされた独自のworkspace が与えられます。さらに
allow/deny ツールポリシー、ネットワーク分離、リソース制限、browser
containers も設定できます。

完全な設定、イメージ、セキュリティ上の注意、マルチエージェントプロファイルについては次を参照してください。

- [Sandboxing](/ja-JP/gateway/sandboxing) -- 完全なsandboxリファレンス
- [OpenShell](/ja-JP/gateway/openshell) -- sandbox containers への対話的shellアクセス
- [Multi-Agent Sandbox and Tools](/ja-JP/tools/multi-agent-sandbox-tools) -- エージェントごとの上書き

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

デフォルトsandboxイメージをビルドするには:

```bash
scripts/sandbox-setup.sh
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="イメージがない、またはsandboxコンテナが起動しない">
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    でsandboxイメージをビルドするか、`agents.defaults.sandbox.docker.image` を
    カスタムイメージに設定してください。コンテナは必要に応じてセッションごとに自動作成されます。
  </Accordion>

  <Accordion title="sandbox内で権限エラーが出る">
    `docker.user` を、マウントしたworkspace の所有権に一致する UID:GID に設定するか、
    workspaceフォルダーを chown してください。
  </Accordion>

  <Accordion title="sandbox内でカスタムツールが見つからない">
    OpenClaw は `sh -lc`（login shell）でコマンドを実行するため、
    `/etc/profile` を読み込み、PATH をリセットする場合があります。
    `docker.env.PATH` を設定してカスタムツールパスを先頭に追加するか、
    Dockerfile の `/etc/profile.d/` 配下にスクリプトを追加してください。
  </Accordion>

  <Accordion title="イメージビルド中にOOM kill される（exit 137）">
    VMには最低2 GB RAM が必要です。より大きなマシンクラスを使って再試行してください。
  </Accordion>

  <Accordion title="Control UI で Unauthorized または pairing required が表示される">
    新しいdashboardリンクを取得し、ブラウザーデバイスを承認してください。

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    詳細: [Dashboard](/ja-JP/web/dashboard), [Devices](/ja-JP/cli/devices)。

  </Accordion>

  <Accordion title="Gateway target が ws://172.x.x.x を表示する、またはDocker CLIから pairing errors が出る">
    gateway mode と bind をリセットしてください。

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Podman](/ja-JP/install/podman) — Docker の代替としてのPodman
- [ClawDock](/ja-JP/install/clawdock) — Docker Compose のコミュニティセットアップ
- [Updating](/ja-JP/install/updating) — OpenClaw を最新に保つ
- [Configuration](/ja-JP/gateway/configuration) — インストール後のgateway設定
