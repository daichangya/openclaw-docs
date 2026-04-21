---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 你需要为每个 Gateway 网关使用隔离的配置、状态和端口。
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和配置档案）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-04-21T17:32:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 多个 Gateway 网关（同一主机）

大多数场景应使用一个 Gateway 网关，因为单个 Gateway 网关可以处理多个消息连接和智能体。如果你需要更强的隔离或冗余能力（例如救援机器人），请运行使用隔离配置档案和端口的独立 Gateway 网关。

## 隔离检查清单（必需）

- `OPENCLAW_CONFIG_PATH` — 每个实例单独的配置文件
- `OPENCLAW_STATE_DIR` — 每个实例单独的会话、凭证、缓存
- `agents.defaults.workspace` — 每个实例单独的工作区根目录
- `gateway.port`（或 `--port`）— 每个实例唯一
- 派生端口（browser/canvas）不得重叠

如果这些内容被共享，你将遇到配置竞争和端口冲突。

## 推荐：主实例使用默认配置档案，救援实例使用命名配置档案

配置档案会自动限定 `OPENCLAW_STATE_DIR` 和 `OPENCLAW_CONFIG_PATH`，并为服务名称添加后缀。对于大多数救援机器人场景，主机器人保留在默认配置档案上，仅为救援机器人使用命名配置档案，例如 `rescue`。

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

服务：

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

如果你希望两个 Gateway 网关都使用命名配置档案，也可以，但这不是必需的。

## 救援机器人指南

推荐设置：

- 主机器人保留在默认配置档案上
- 救援机器人运行在 `--profile rescue`
- 为救援账户使用一个完全独立的 Telegram 机器人
- 让救援机器人使用不同的基础端口，例如 `19001`

这样可以让救援机器人与主机器人隔离，当主机器人不可用时，它仍可用于调试或应用配置更改。基础端口之间至少保留 20 个端口的间隔，这样派生的 browser/canvas/CDP 端口就不会发生冲突。

### 推荐的救援渠道/账户

对于大多数场景，建议为救援配置档案使用一个完全独立的 Telegram 机器人。

为什么选择 Telegram：

- 易于保持为仅限操作员使用
- 单独的机器人令牌和身份
- 独立于主机器人的渠道/应用安装
- 当主机器人损坏时，提供简单的基于私信的恢复路径

关键在于完全独立：独立的机器人账户、独立的凭证、独立的 OpenClaw 配置档案、独立的工作区，以及独立的端口。

### 推荐安装流程

除非你有充分理由采用其他方式，否则请将其作为默认设置：

```bash
# Main bot (default profile, port 18789)
openclaw onboard
openclaw gateway install

# Rescue bot (separate Telegram bot, separate profile, port 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

在执行 `openclaw --profile rescue onboard` 期间：

- 使用独立的 Telegram 机器人令牌
- 保留 `rescue` 配置档案
- 使用比主机器人至少高 20 的基础端口
- 除非你已经自行管理，否则接受默认的救援工作区

如果新手引导流程已经为你安装了救援服务，那么最后的 `gateway install` 就不需要了。

### 新手引导会更改什么

`openclaw --profile rescue onboard` 使用常规的新手引导流程，但它会将所有内容写入单独的配置档案中。

在实际效果上，这意味着救援机器人会拥有它自己的：

- 配置文件
- 状态目录
- 工作区（默认情况下为 `~/.openclaw/workspace-rescue`）
- 托管服务名称

除此之外，其提示与普通新手引导相同。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- browser 控制服务端口 = 基础端口 + 2（仅限 loopback）
- canvas host 由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 相同端口）
- Browser 配置档案的 CDP 端口会从 `browser.controlPort + 9 .. + 108` 自动分配

如果你在配置或环境变量中覆盖了其中任意项，你必须确保每个实例的值都唯一。

## Browser/CDP 说明（常见陷阱）

- **不要** 在多个实例上将 `browser.cdpUrl` 固定为相同的值。
- 每个实例都需要自己的 browser 控制端口和 CDP 范围（由其 gateway 端口派生）。
- 如果你需要显式指定 CDP 端口，请按实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：使用 `browser.profiles.<name>.cdpUrl`（按配置档案、按实例设置）。

## 手动环境变量示例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## 快速检查

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

说明：

- `gateway status --deep` 有助于发现旧安装遗留的 launchd/systemd/schtasks 服务。
- 只有在你有意运行多个相互隔离的 Gateway 网关时，`gateway probe` 中诸如 `multiple reachable gateways detected` 这样的警告文本才属于预期现象。
