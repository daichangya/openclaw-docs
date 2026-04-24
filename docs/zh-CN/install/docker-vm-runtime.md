---
read_when:
    - 你正在使用 Docker 在云虚拟机上部署 OpenClaw
    - 你需要共享二进制构建、持久化和更新流程
summary: 长期运行的 OpenClaw Gateway 网关主机的共享 Docker VM 运行时步骤
title: Docker VM 运行时
x-i18n:
    generated_at: "2026-04-24T03:17:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54e99e6186a3c13783922e4d1e4a55e9872514be23fa77ca869562dcd436ad2b
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

适用于基于虚拟机的 Docker 安装（如 GCP、Hetzner 以及类似 VPS 提供商）的共享运行时步骤。

## 将所需二进制文件构建进镜像

在正在运行的容器内安装二进制文件是一个陷阱。
任何在运行时安装的内容都会在重启后丢失。

Skills 所需的所有外部二进制文件都必须在镜像构建时安装。

下面的示例只展示了三个常见二进制文件：

- 用于 Gmail 访问的 `gog`
- 用于 Google Places 的 `goplaces`
- 用于 WhatsApp 的 `wacli`

这些只是示例，并非完整列表。
你可以使用相同模式安装任意数量的二进制文件。

如果你之后新增了依赖其他二进制文件的 Skills，你必须：

1. 更新 Dockerfile
2. 重新构建镜像
3. 重启容器

**Dockerfile 示例**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 示例二进制文件 1：Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# 示例二进制文件 2：Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# 示例二进制文件 3：WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# 使用相同模式在下方添加更多二进制文件

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
上面的下载 URL 适用于 x86_64（amd64）。对于基于 ARM 的虚拟机（例如 Hetzner ARM、GCP Tau T2A），请将下载 URL 替换为各工具发布页面中的对应 ARM64 变体。
</Note>

## 构建并启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果在 `pnpm install --frozen-lockfile` 期间构建失败，并出现 `Killed` 或 `exit code 137`，说明虚拟机内存不足。
请先换用更大的机器规格，再重试。

验证二进制文件：

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

预期输出：

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

验证 Gateway 网关：

```bash
docker compose logs -f openclaw-gateway
```

预期输出：

```
[gateway] listening on ws://0.0.0.0:18789
```

## 各项内容的持久化位置

OpenClaw 运行在 Docker 中，但 Docker 不是事实来源。
所有长期状态都必须能在重启、重建和重启机器后继续保留。

| 组件 | 位置 | 持久化机制 | 说明 |
| --- | --- | --- | --- |
| Gateway 网关配置 | `/home/node/.openclaw/` | 主机卷挂载 | 包含 `openclaw.json`、`.env` |
| 模型凭证配置文件 | `/home/node/.openclaw/agents/` | 主机卷挂载 | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API keys） |
| Skills 配置 | `/home/node/.openclaw/skills/` | 主机卷挂载 | Skills 级状态 |
| 智能体工作区 | `/home/node/.openclaw/workspace/` | 主机卷挂载 | 代码和智能体产物 |
| WhatsApp 会话 | `/home/node/.openclaw/` | 主机卷挂载 | 保留 QR 登录状态 |
| Gmail keyring | `/home/node/.openclaw/` | 主机卷 + password | 需要 `GOG_KEYRING_PASSWORD` |
| 外部二进制文件 | `/usr/local/bin/` | Docker 镜像 | 必须在构建时写入 |
| Node 运行时 | 容器文件系统 | Docker 镜像 | 每次镜像构建时重建 |
| 操作系统软件包 | 容器文件系统 | Docker 镜像 | 不要在运行时安装 |
| Docker 容器 | 临时 | 可重启 | 可以安全销毁 |

## 更新

要在虚拟机上更新 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

## 相关内容

- [Docker](/zh-CN/install/docker)
- [Podman](/zh-CN/install/podman)
- [ClawDock](/zh-CN/install/clawdock)
