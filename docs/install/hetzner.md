---
read_when:
    - 你希望 OpenClaw 在云 VPS 上 24/7 运行（而不是在你的笔记本上）
    - 你希望在你自己的 VPS 上运行一个生产级、始终在线的 Gateway 网关
    - 你希望完全控制持久化、二进制文件和重启行为
    - 你正在 Hetzner 或类似提供商上通过 Docker 运行 OpenClaw
summary: 在便宜的 Hetzner VPS（Docker）上 24/7 运行 OpenClaw Gateway 网关，并具备持久状态和内置二进制文件
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T03:17:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# Hetzner 上的 OpenClaw（Docker，生产 VPS 指南）

## 目标

在 Hetzner VPS 上使用 Docker 运行一个持久化的 OpenClaw Gateway 网关，并具备持久状态、内置二进制文件以及安全的重启行为。

如果你想要一个“约 5 美元即可 24/7 运行的 OpenClaw”，这是最简单且可靠的设置方式。
Hetzner 的价格可能会变化；请选择最小的 Debian/Ubuntu VPS，如果遇到 OOM 再向上扩容。

安全模型提醒：

- 当所有人都处于相同信任边界内，且运行时仅用于业务时，共享给公司的智能体是可以接受的。
- 保持严格隔离：专用 VPS/运行时 + 专用账户；不要在该主机上使用个人 Apple/Google/浏览器/密码管理器配置文件。
- 如果用户彼此之间具有对抗性，请按 Gateway 网关/主机/OS 用户拆分。

参见[安全](/zh-CN/gateway/security)和 [VPS 托管](/zh-CN/vps)。

## 我们要做什么（简单来说）？

- 租用一台小型 Linux 服务器（Hetzner VPS）
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway 网关
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（可在重启/重建后保留）
- 通过 SSH 隧道从你的笔记本访问 Control UI

该挂载的 `~/.openclaw` 状态包括 `openclaw.json`、每个智能体的
`agents/<agentId>/agent/auth-profiles.json` 和 `.env`。

可通过以下方式访问 Gateway 网关：

- 从你的笔记本使用 SSH 端口转发
- 如果你自行管理防火墙和 token，也可以直接暴露端口

本指南假设你在 Hetzner 上使用 Ubuntu 或 Debian。  
如果你使用其他 Linux VPS，请相应调整软件包。
有关通用 Docker 流程，请参见 [Docker](/zh-CN/install/docker)。

---

## 快速路径（适合有经验的操作员）

1. 预配 Hetzner VPS
2. 安装 Docker
3. 克隆 OpenClaw 仓库
4. 创建持久化主机目录
5. 配置 `.env` 和 `docker-compose.yml`
6. 将所需二进制文件内置到镜像中
7. `docker compose up -d`
8. 验证持久化和 Gateway 网关访问

---

## 你需要准备

- 具有 root 访问权限的 Hetzner VPS
- 从你的笔记本进行 SSH 访问
- 具备基本的 SSH + 复制粘贴操作能力
- 约 20 分钟
- Docker 和 Docker Compose
- 模型认证凭证
- 可选的提供商凭证
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="预配 VPS">
    在 Hetzner 中创建一个 Ubuntu 或 Debian VPS。

    以 root 身份连接：

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    本指南假设该 VPS 是有状态的。
    不要把它当作一次性基础设施。

  </Step>

  <Step title="安装 Docker（在 VPS 上）">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
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

    本指南假设你将构建自定义镜像，以保证二进制文件持久化。

  </Step>

  <Step title="创建持久化主机目录">
    Docker 容器是临时性的。
    所有长期状态都必须保存在主机上。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # 将所有权设置为容器用户（uid 1000）：
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="配置环境变量">
    在仓库根目录创建 `.env`。

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

    除非你明确希望通过 `.env` 管理它，否则请将 `OPENCLAW_GATEWAY_TOKEN` 留空；
    OpenClaw 会在首次启动时将随机生成的 Gateway 网关 token 写入
    配置。请生成一个 keyring 密码并粘贴到
    `GOG_KEYRING_PASSWORD` 中：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交这个文件。**

    此 `.env` 文件用于容器/运行时环境变量，例如 `OPENCLAW_GATEWAY_TOKEN`。
    存储的提供商 OAuth/API-key 凭证保存在挂载的
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
          # 推荐：让 Gateway 网关在 VPS 上仅绑定到 loopback；通过 SSH 隧道访问。
          # 若要公开暴露，请移除 `127.0.0.1:` 前缀并相应配置防火墙。
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

    `--allow-unconfigured` 仅用于引导阶段的便利，不可替代正确的 Gateway 网关配置。你仍应设置认证（`gateway.auth.token` 或 password），并为你的部署使用安全的 bind 设置。

  </Step>

  <Step title="共享 Docker VM 运行时步骤">
    针对通用 Docker 主机流程，请使用共享运行时指南：

    - [将所需二进制文件内置到镜像中](/zh-CN/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/zh-CN/install/docker-vm-runtime#build-and-launch)
    - [哪些内容会持久化到哪里](/zh-CN/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-CN/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 特定访问方式">
    完成共享的构建和启动步骤后，从你的笔记本建立隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    打开：

    `http://127.0.0.1:18789/`

    粘贴已配置的共享密钥。本指南默认使用 Gateway 网关 token；
    如果你改用了 password 认证，请改为使用该 password。

  </Step>
</Steps>

共享持久化映射见 [Docker VM 运行时](/zh-CN/install/docker-vm-runtime#what-persists-where)。

## 基础设施即代码（Terraform）

对于偏好基础设施即代码工作流的团队，社区维护的 Terraform 设置提供了：

- 采用远程状态管理的模块化 Terraform 配置
- 通过 cloud-init 进行自动化预配
- 部署脚本（bootstrap、deploy、backup/restore）
- 安全加固（防火墙、UFW、仅 SSH 访问）
- 用于 Gateway 网关访问的 SSH 隧道配置

**仓库：**

- 基础设施：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 配置：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

这种方式可在上述 Docker 设置基础上补充可复现部署、版本控制的基础设施以及自动化灾难恢复。

> **注意：** 由社区维护。如有问题或希望贡献，请参见上述仓库链接。

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 网关配置](/zh-CN/gateway/configuration)
- 保持 OpenClaw 为最新版本：[更新](/zh-CN/install/updating)

## 相关内容

- [安装概览](/zh-CN/install)
- [Fly.io](/zh-CN/install/fly)
- [Docker](/zh-CN/install/docker)
- [VPS 托管](/zh-CN/vps)
