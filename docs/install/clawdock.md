---
read_when:
    - 你经常用 Docker 运行 OpenClaw，并希望日常命令更简短
    - 你想要一个用于 dashboard、日志、令牌设置和配对流程的辅助层
summary: 用于基于 Docker 的 OpenClaw 安装的 ClawDock shell 辅助工具
title: ClawDock
x-i18n:
    generated_at: "2026-04-23T20:51:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock 是一层面向基于 Docker 的 OpenClaw 安装的小型 shell 辅助工具。

它提供像 `clawdock-start`、`clawdock-dashboard` 和 `clawdock-fix-token` 这样的短命令，而不是更长的 `docker compose ...` 调用。

如果你还没有设置 Docker，请先从 [Docker](/zh-CN/install/docker) 开始。

## 安装

使用规范的辅助脚本路径：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前是从 `scripts/shell-helpers/clawdock-helpers.sh` 安装 ClawDock，请改为从新的 `scripts/clawdock/clawdock-helpers.sh` 路径重新安装。旧的 raw GitHub 路径已被移除。

## 你将获得什么

### 基本操作

| 命令 | 说明 |
| ------------------ | ---------------------- |
| `clawdock-start` | 启动 Gateway 网关 |
| `clawdock-stop` | 停止 Gateway 网关 |
| `clawdock-restart` | 重启 Gateway 网关 |
| `clawdock-status` | 检查容器状态 |
| `clawdock-logs` | 跟踪 Gateway 网关日志 |

### 容器访问

| 命令 | 说明 |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell` | 在 Gateway 网关容器内打开 shell |
| `clawdock-cli <command>` | 在 Docker 中运行 OpenClaw CLI 命令 |
| `clawdock-exec <command>` | 在容器中执行任意命令 |

### Web UI 和配对

| 命令 | 说明 |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard` | 打开 Control UI URL |
| `clawdock-devices` | 列出待处理的设备配对 |
| `clawdock-approve <id>` | 批准一个配对请求 |

### 设置与维护

| 命令 | 说明 |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | 在容器内配置 Gateway 网关令牌 |
| `clawdock-update` | 拉取、重建并重启 |
| `clawdock-rebuild` | 仅重建 Docker 镜像 |
| `clawdock-clean` | 移除容器和卷 |

### 实用工具

| 命令 | 说明 |
| ---------------------- | --------------------------------------- |
| `clawdock-health` | 运行 Gateway 网关健康检查 |
| `clawdock-token` | 打印 Gateway 网关令牌 |
| `clawdock-cd` | 跳转到 OpenClaw 项目目录 |
| `clawdock-config` | 打开 `~/.openclaw` |
| `clawdock-show-config` | 打印配置文件并隐藏敏感值 |
| `clawdock-workspace` | 打开工作区目录 |

## 首次使用流程

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

如果浏览器提示需要配对：

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 配置与 secrets

ClawDock 使用与 [Docker](/zh-CN/install/docker) 中描述相同的 Docker 配置拆分：

- `<project>/.env` 用于 Docker 专用值，例如镜像名称、端口和 Gateway 网关令牌
- `~/.openclaw/.env` 用于基于环境变量的提供商 key 和 bot token
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 用于存储提供商 OAuth / API-key 认证
- `~/.openclaw/openclaw.json` 用于行为配置

当你想快速检查 `.env` 文件和 `openclaw.json` 时，请使用 `clawdock-show-config`。它会在打印输出中隐藏 `.env` 值。

## 相关页面

- [Docker](/zh-CN/install/docker)
- [Docker VM Runtime](/zh-CN/install/docker-vm-runtime)
- [Updating](/zh-CN/install/updating)
