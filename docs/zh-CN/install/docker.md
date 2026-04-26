---
read_when:
    - 你想使用容器化的 Gateway 网关，而不是本地安装
    - 你正在验证 Docker 流程
summary: OpenClaw 的可选 Docker 安装和新手引导
title: Docker
x-i18n:
    generated_at: "2026-04-26T10:09:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00452deb5921b0ec42835dca0df0d93b7903d12942b1c6a795def451c24c8145
    source_path: install/docker.md
    workflow: 15
---

Docker **是可选的**。只有当你想使用容器化的 Gateway 网关，或验证 Docker 流程时，才使用它。

## Docker 适合我吗？

- **是**：你想要一个隔离的、可随时丢弃的 Gateway 网关环境，或者想在没有本地安装的主机上运行 OpenClaw。
- **否**：你是在自己的机器上运行，只想要最快的开发循环。请改用常规安装流程。
- **沙箱注意事项**：默认沙箱后端在启用沙箱隔离时会使用 Docker，但沙箱隔离默认是关闭的，且**不**要求整个 Gateway 网关都在 Docker 中运行。也提供 SSH 和 OpenShell 沙箱后端。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。

## 前提条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 镜像构建至少需要 2 GB 内存（在 1 GB 主机上，`pnpm install` 可能会因 OOM 被杀掉并返回退出码 137）
- 足够的磁盘空间用于镜像和日志
- 如果运行在 VPS / 公网主机上，请查看
  [面向网络暴露的安全加固](/zh-CN/gateway/security)，
  尤其是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 Gateway 网关

<Steps>
  <Step title="构建镜像">
    在仓库根目录中，运行设置脚本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地构建 Gateway 网关镜像。如果改用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像发布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常用标签：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成新手引导">
    设置脚本会自动运行新手引导。它将会：

    - 提示你输入 provider API 密钥
    - 生成一个 Gateway 网关令牌并将其写入 `.env`
    - 通过 Docker Compose 启动 Gateway 网关

    在设置期间，启动前的新手引导和配置写入会直接通过
    `openclaw-gateway` 运行。`openclaw-cli` 用于你在
    Gateway 网关容器已经存在之后运行的命令。

  </Step>

  <Step title="打开控制 UI">
    在浏览器中打开 `http://127.0.0.1:18789/`，然后将已配置的
    共享密钥粘贴到“设置”中。设置脚本默认会将令牌写入 `.env`；如果你将容器配置切换为密码认证，请改用该密码。

    需要再次获取 URL 吗？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置渠道（可选）">
    使用 CLI 容器添加消息渠道：

    ```bash
    # WhatsApp（二维码）
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    文档：[WhatsApp](/zh-CN/channels/whatsapp)、[Telegram](/zh-CN/channels/telegram)、[Discord](/zh-CN/channels/discord)

  </Step>
</Steps>

### 手动流程

如果你更喜欢自己逐步运行，而不是使用设置脚本：

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
从仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入 `docker-compose.extra.yml`；
请使用 `-f docker-compose.yml -f docker-compose.extra.yml` 将其包含进来。
</Note>

<Note>
由于 `openclaw-cli` 与 `openclaw-gateway` 共享网络命名空间，它是一个
启动后工具。在执行 `docker compose up -d openclaw-gateway` 之前，请通过
带有 `--no-deps --entrypoint node` 的 `openclaw-gateway`
来运行新手引导和设置时的配置写入。
</Note>

### 环境变量

设置脚本接受以下可选环境变量：

| Variable                        | Purpose                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                | 使用远程镜像而不是在本地构建                                    |
| `OPENCLAW_DOCKER_APT_PACKAGES`  | 在构建期间安装额外的 apt 软件包（用空格分隔）                   |
| `OPENCLAW_EXTENSIONS`           | 在构建时预安装插件依赖（用空格分隔的名称）                      |
| `OPENCLAW_EXTRA_MOUNTS`         | 额外的主机 bind 挂载（用逗号分隔的 `source:target[:opts]`）     |
| `OPENCLAW_HOME_VOLUME`          | 将 `/home/node` 持久化到一个具名 Docker 卷中                    |
| `OPENCLAW_SANDBOX`              | 选择启用沙箱引导（`1`、`true`、`yes`、`on`）                    |
| `OPENCLAW_DOCKER_SOCKET`        | 覆盖 Docker socket 路径                                         |
| `OPENCLAW_DISABLE_BONJOUR`      | 禁用 Bonjour / mDNS 广播（Docker 默认值为 `1`）                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`   | 用于 OpenTelemetry 导出的共享 OTLP / HTTP 收集器端点            |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT` | 用于 traces、metrics 或 logs 的按信号区分的 OTLP 端点           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`   | OTLP 协议覆盖。目前只支持 `http/protobuf`                       |
| `OTEL_SERVICE_NAME`             | 用于 OpenTelemetry 资源的服务名称                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | 选择启用最新的实验性 GenAI 语义属性                             |
| `OPENCLAW_OTEL_PRELOADED`       | 当已有预加载的 OpenTelemetry SDK 时，跳过启动第二个 SDK         |

### 可观测性

OpenTelemetry 导出是从 Gateway 网关容器出站发送到你的 OTLP
收集器。它不需要发布 Docker 端口。如果你是在本地构建镜像，并且希望镜像内可用内置的 OpenTelemetry 导出器，
请包含它的运行时依赖：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方 OpenClaw Docker 发布镜像包含 `diagnostics-otel`
依赖。要启用导出，请在配置中允许并启用 `diagnostics-otel` 插件，
然后设置 `diagnostics.otel.enabled=true`，或者使用
[OpenTelemetry 导出](/zh-CN/gateway/opentelemetry) 中的配置示例。收集器认证头通过
`diagnostics.otel.headers` 进行配置，而不是通过 Docker 环境变量。

Prometheus 指标使用已经发布的 Gateway 网关端口。启用
`diagnostics-prometheus` 插件，然后抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

该路由受 Gateway 网关认证保护。不要暴露单独的公开 `/metrics`
端口，也不要暴露未认证的反向代理路径。参见
[Prometheus 指标](/zh-CN/gateway/prometheus)。

### 健康检查

容器探针端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活性
curl -fsS http://127.0.0.1:18789/readyz     # 就绪性
```

Docker 镜像内置了一个 `HEALTHCHECK`，会探测 `/healthz`。
如果检查持续失败，Docker 会将容器标记为 `unhealthy`，
编排系统可以重启或替换它。

需要认证的深度健康状态快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认设置 `OPENCLAW_GATEWAY_BIND=lan`，这样通过 Docker 端口发布后，
主机就能访问 `http://127.0.0.1:18789`。

- `lan`（默认）：主机浏览器和主机 CLI 都可以访问已发布的 Gateway 网关端口。
- `loopback`：只有容器网络命名空间内的进程可以直接访问
  Gateway 网关。

<Note>
请在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用主机别名，例如 `0.0.0.0` 或 `127.0.0.1`。
</Note>

### Bonjour / mDNS

Docker bridge 网络通常无法可靠地转发 Bonjour / mDNS 组播
（`224.0.0.251:5353`）。因此，内置的 Compose 设置默认使用
`OPENCLAW_DISABLE_BONJOUR=1`，这样 Gateway 网关就不会因为桥接网络丢弃组播流量而崩溃循环或反复重启广播。

对于 Docker 主机，请使用已发布的 Gateway 网关 URL、Tailscale 或广域 DNS-SD。
只有在使用 host networking、macvlan，
或其他已知支持 mDNS 组播的网络时，才将 `OPENCLAW_DISABLE_BONJOUR=0`。

关于常见问题和故障排除，请参见 [Bonjour 设备发现](/zh-CN/gateway/bonjour)。

### 存储与持久化

Docker Compose 会将 `OPENCLAW_CONFIG_DIR` bind 挂载到 `/home/node/.openclaw`，
并将 `OPENCLAW_WORKSPACE_DIR` 挂载到 `/home/node/.openclaw/workspace`，因此这些路径
在容器被替换后仍会保留。

这个挂载的配置目录就是 OpenClaw 存储以下内容的位置：

- 用于行为配置的 `openclaw.json`
- 用于存储 provider OAuth / API-key 认证的 `agents/<agentId>/agent/auth-profiles.json`
- 用于存储基于环境变量的运行时密钥（例如 `OPENCLAW_GATEWAY_TOKEN`）的 `.env`

有关 VM 部署中持久化的完整细节，请参见
[Docker VM Runtime - 持久化内容与位置](/zh-CN/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：**请留意 `media/`、会话 JSONL 文件、`cron/runs/*.jsonl`，
以及 `/tmp/openclaw/` 下的滚动文件日志。

### Shell 辅助工具（可选）

为了更方便地进行日常 Docker 管理，请安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前是通过旧的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路径安装的 ClawDock，请重新运行上面的安装命令，以便让你的本地辅助文件跟踪新位置。

然后你就可以使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。
运行 `clawdock-help` 查看所有命令。
完整辅助指南请参见 [ClawDock](/zh-CN/install/clawdock)。

<AccordionGroup>
  <Accordion title="为 Docker Gateway 网关启用智能体沙箱">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自定义 socket 路径（例如 rootless Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    该脚本只有在沙箱前提条件通过后才会挂载 `docker.sock`。如果
    沙箱设置无法完成，脚本会将 `agents.defaults.sandbox.mode`
    重置为 `off`。

  </Accordion>

  <Accordion title="自动化 / CI（非交互式）">
    使用 `-T` 禁用 Compose 伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共享网络安全说明">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI
    命令可以通过 `127.0.0.1` 访问 Gateway 网关。请将其视为一个共享的
    信任边界。compose 配置会删除 `NET_RAW` / `NET_ADMIN`，并在 `openclaw-cli` 上启用
    `no-new-privileges`。
  </Accordion>

  <Accordion title="权限与 EACCES">
    镜像以 `node`（uid 1000）身份运行。如果你在
    `/home/node/.openclaw` 上看到权限错误，请确保你的主机 bind 挂载归 uid 1000 所有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快的重新构建">
    按照依赖层可缓存的方式组织你的 Dockerfile。这样可以避免在 lockfile 未变更时重复运行
    `pnpm install`：

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

  <Accordion title="Power-user container options">
    默认镜像以安全优先为原则，并以非 root 的 `node` 用户运行。若你需要功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **预装系统依赖**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安装 Playwright 浏览器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久化浏览器下载内容**：设置
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`，并使用
       `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在
    Docker 或无头环境中，请复制你最终跳转到的完整重定向 URL，并将其粘贴回向导中以完成认证。
  </Accordion>

  <Accordion title="Base image metadata">
    主 Docker 镜像使用 `node:24-bookworm`，并发布 OCI 基础镜像注解，
    包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等。参见
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

有关共享 VM 部署步骤，包括二进制预置、持久化和更新，请参见
[Hetzner（Docker VPS）](/zh-CN/install/hetzner) 和
[Docker VM Runtime](/zh-CN/install/docker-vm-runtime)。

## 智能体沙箱

当通过 Docker 后端启用 `agents.defaults.sandbox` 时，Gateway 网关会将
智能体工具执行（shell、文件读写等）放在隔离的 Docker
容器中运行，而 Gateway 网关本身仍运行在主机上。这让你可以在不将整个
Gateway 网关容器化的情况下，为不受信任或多租户的智能体会话建立一道硬隔离边界。

沙箱范围可以是每智能体（默认）、每会话，或共享。每种范围
都会获得各自挂载到 `/workspace` 的工作区。你还可以配置
工具允许 / 拒绝策略、网络隔离、资源限制以及浏览器
容器。

有关完整配置、镜像、安全说明和多智能体配置文件，请参见：

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整沙箱参考
- [OpenShell](/zh-CN/gateway/openshell) -- 对沙箱容器的交互式 shell 访问
- [Multi-Agent Sandbox and Tools](/zh-CN/tools/multi-agent-sandbox-tools) -- 每智能体覆盖项

### 快速启用

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

构建默认沙箱镜像：

```bash
scripts/sandbox-setup.sh
```

## 故障排除

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    构建沙箱镜像，或将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。
    容器会按需为每个会话自动创建。
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    将 `docker.user` 设置为与你挂载工作区所有权匹配的 UID:GID，
    或对工作区文件夹执行 chown。
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，这会加载
    `/etc/profile`，并且可能会重置 PATH。设置 `docker.env.PATH` 以预置你的
    自定义工具路径，或在你的 Dockerfile 中向 `/etc/profile.d/` 添加脚本。
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    VM 至少需要 2 GB 内存。请使用更大的机器规格后重试。
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    获取一个新的 dashboard 链接，并批准该浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多细节： [Dashboard](/zh-CN/web/dashboard)、[Devices](/zh-CN/cli/devices)。

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    重置 Gateway 网关模式和绑定：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相关内容

- [安装概览](/zh-CN/install) — 所有安装方式
- [Podman](/zh-CN/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-CN/install/clawdock) — Docker Compose 社区方案
- [更新](/zh-CN/install/updating) — 让 OpenClaw 保持最新
- [配置](/zh-CN/gateway/configuration) — 安装后的 Gateway 网关配置
