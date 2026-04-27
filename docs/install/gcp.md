---
read_when:
    - 你想要让 OpenClaw 在 GCP 上 24/7 运行
    - 你想要在你自己的 VM 上部署一个生产级、始终在线的 Gateway 网关
    - 你想要完全控制持久化、二进制文件和重启行为
summary: 在 GCP Compute Engine VM（Docker）上 24/7 运行 OpenClaw Gateway 网关并保留持久状态
title: GCP
x-i18n:
    generated_at: "2026-04-24T03:17:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 15
---

# 在 GCP Compute Engine 上运行 OpenClaw（Docker，生产 VPS 指南）

## 目标

使用 Docker 在 GCP Compute Engine VM 上运行一个持久化的 OpenClaw Gateway 网关，并具备持久状态、预置二进制文件以及安全的重启行为。

如果你想要“每月约 \$5–12 持续 24/7 运行的 OpenClaw”，这是一个在 Google Cloud 上可靠的方案。
价格会因机器类型和区域而异；请选择适合你工作负载的最小 VM，如果遇到 OOM 再向上扩容。

## 我们在做什么（简单说明）？

- 创建一个 GCP 项目并启用计费
- 创建一个 Compute Engine VM
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway 网关
- 在宿主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（重启 / 重建后仍然保留）
- 通过 SSH 隧道从你的笔记本访问 Control UI

这个挂载的 `~/.openclaw` 状态包含 `openclaw.json`、每个智能体的
`agents/<agentId>/agent/auth-profiles.json`，以及 `.env`。

可以通过以下方式访问 Gateway 网关：

- 从你的笔记本使用 SSH 端口转发
- 如果你自行管理防火墙和 token，也可以直接暴露端口

本指南在 GCP Compute Engine 上使用 Debian。
Ubuntu 也可以；请相应调整软件包。
有关通用 Docker 流程，请参见 [Docker](/zh-CN/install/docker)。

---

## 快速路径（适合有经验的运维人员）

1. 创建 GCP 项目并启用 Compute Engine API
2. 创建 Compute Engine VM（`e2-small`、Debian 12、20GB）
3. SSH 登录到 VM
4. 安装 Docker
5. 克隆 OpenClaw 仓库
6. 创建持久化宿主机目录
7. 配置 `.env` 和 `docker-compose.yml`
8. 预置所需二进制文件，构建并启动

---

## 你需要准备

- GCP 账户（`e2-micro` 符合免费层资格）
- 已安装 `gcloud` CLI（或使用 Cloud Console）
- 从你的笔记本进行 SSH 访问
- 基本的 SSH 和复制 / 粘贴操作经验
- 约 20–30 分钟
- Docker 和 Docker Compose
- 模型 auth 凭证
- 可选的提供商凭证
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="安装 gcloud CLI（或使用 Console）">
    **选项 A：gcloud CLI**（推荐用于自动化）

    从 [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) 安装

    初始化并进行身份验证：

    ```bash
    gcloud init
    gcloud auth login
    ```

    **选项 B：Cloud Console**

    所有步骤都可以通过网页 UI 完成，地址为 [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="创建 GCP 项目">
    **CLI：**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    在 [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) 启用计费（Compute Engine 必需）。

    启用 Compute Engine API：

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console：**

    1. 前往 IAM & Admin > Create Project
    2. 命名并创建
    3. 为该项目启用计费
    4. 前往 APIs & Services > Enable APIs > 搜索 “Compute Engine API” > Enable

  </Step>

  <Step title="创建 VM">
    **机器类型：**

    | 类型      | 规格                     | 成本               | 说明                           |
    | --------- | ------------------------ | ------------------ | ------------------------------ |
    | e2-medium | 2 vCPU，4GB RAM          | 约 \$25/月         | 最适合本地 Docker 构建         |
    | e2-small  | 2 vCPU，2GB RAM          | 约 \$12/月         | Docker 构建的最低推荐配置      |
    | e2-micro  | 2 vCPU（共享），1GB RAM | 符合免费层资格     | Docker 构建常因 OOM 失败（137） |

    **CLI：**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console：**

    1. 前往 Compute Engine > VM instances > Create instance
    2. 名称：`openclaw-gateway`
    3. 区域：`us-central1`，可用区：`us-central1-a`
    4. 机器类型：`e2-small`
    5. 启动磁盘：Debian 12，20GB
    6. 创建

  </Step>

  <Step title="SSH 登录到 VM">
    **CLI：**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console：**

    在 Compute Engine 控制台中，点击你的 VM 旁边的 “SSH” 按钮。

    注意：SSH 密钥传播在 VM 创建后可能需要 1–2 分钟。如果连接被拒绝，请等待后重试。

  </Step>

  <Step title="安装 Docker（在 VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    注销并重新登录，使组变更生效：

    ```bash
    exit
    ```

    然后重新 SSH 登录：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    验证：

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="克隆 OpenClaw 仓库">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    本指南假设你将构建一个自定义镜像，以保证二进制文件的持久性。

  </Step>

  <Step title="创建持久化宿主机目录">
    Docker 容器是临时性的。
    所有长期状态都必须存放在宿主机上。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="配置环境变量">
    在仓库根目录创建 `.env`。

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

    除非你明确希望通过 `.env` 管理 `OPENCLAW_GATEWAY_TOKEN`，否则请将其留空；OpenClaw 会在首次启动时将一个随机 gateway token 写入配置。生成一个 keyring 密码并将其粘贴到 `GOG_KEYRING_PASSWORD` 中：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交这个文件。**

    这个 `.env` 文件用于容器 / 运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。
    已存储的提供商 OAuth / API-key auth 位于挂载的
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中。

  </Step>

  <Step title="Docker Compose 配置">
    创建或更新 `docker-compose.yml`。

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
          # 推荐：让 Gateway 网关在 VM 上仅绑定到 loopback；通过 SSH 隧道访问。
          # 若要将其公开暴露，请移除 `127.0.0.1:` 前缀，并相应配置防火墙。
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

    `--allow-unconfigured` 仅用于引导阶段的便利，它不能替代正确的 gateway 配置。你仍然应设置 auth（`gateway.auth.token` 或密码），并为你的部署使用安全的 bind 设置。

  </Step>

  <Step title="共享的 Docker VM 运行时步骤">
    对于通用 Docker 宿主机流程，请使用共享运行时指南：

    - [将所需二进制文件预置到镜像中](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [哪些内容会持久化以及持久化到哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 特定的启动说明">
    在 GCP 上，如果在 `pnpm install --frozen-lockfile` 期间构建因 `Killed` 或 `exit code 137` 失败，说明 VM 内存不足。最低应使用 `e2-small`，或者使用 `e2-medium` 以获得更可靠的首次构建体验。

    当绑定到 LAN（`OPENCLAW_GATEWAY_BIND=lan`）时，继续之前请先配置受信任的浏览器来源：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果你修改了 gateway 端口，请将 `18789` 替换为你配置的端口。

  </Step>

  <Step title="从你的笔记本访问">
    创建一个 SSH 隧道来转发 Gateway 网关端口：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在浏览器中打开：

    `http://127.0.0.1:18789/`

    重新打印一个干净的仪表盘链接：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果 UI 提示需要 shared-secret auth，请将已配置的 token 或密码粘贴到 Control UI 设置中。此 Docker 流程默认会写入一个 token；如果你将容器配置改为密码 auth，则应改用该密码。

    如果 Control UI 显示 `unauthorized` 或 `disconnected (1008): pairing required`，请批准该浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    还需要查看共享持久化和更新参考？
    请参见 [Docker VM Runtime](/zh-CN/install/docker-vm-runtime#what-persists-where) 和 [Docker VM Runtime updates](/zh-CN/install/docker-vm-runtime#updates)。

  </Step>
</Steps>

---

## 故障排除

**SSH 连接被拒绝**

SSH 密钥传播在 VM 创建后可能需要 1–2 分钟。请等待后重试。

**OS Login 问题**

检查你的 OS Login 配置文件：

```bash
gcloud compute os-login describe-profile
```

确保你的账户拥有所需的 IAM 权限（Compute OS Login 或 Compute OS Admin Login）。

**内存不足（OOM）**

如果 Docker 构建失败并显示 `Killed` 和 `exit code 137`，说明 VM 被 OOM killer 终止了。请升级到 `e2-small`（最低）或 `e2-medium`（推荐用于可靠的本地构建）：

```bash
# 先停止 VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# 更改机器类型
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# 启动 VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## 服务账号（安全最佳实践）

对于个人使用，你的默认用户账户已经足够。

对于自动化或 CI/CD 流水线，请创建一个权限最小化的专用服务账号：

1. 创建服务账号：

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. 授予 Compute Instance Admin 角色（或更窄的自定义角色）：

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

请避免在自动化中使用 Owner 角色。应遵循最小权限原则。

有关 IAM 角色的详细信息，请参见 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)。

---

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 将本地设备配对为节点：[Nodes](/zh-CN/nodes)
- 配置 Gateway 网关：[Gateway configuration](/zh-CN/gateway/configuration)

## 相关

- [Install overview](/zh-CN/install)
- [Azure](/zh-CN/install/azure)
- [VPS hosting](/zh-CN/vps)
