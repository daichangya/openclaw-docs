---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 你需要为每个 Gateway 网关隔离配置 / 状态 / 端口
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和配置文件）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-04-24T18:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

大多数设置都应只使用一个 Gateway 网关，因为单个 Gateway 网关可以处理多个消息连接和智能体。如果你需要更强的隔离或冗余（例如一个救援机器人），请使用隔离的配置文件 / 端口运行多个独立的 Gateway 网关。

## 最佳推荐设置

对于大多数用户，最简单的救援机器人设置是：

- 主机器人保留在默认配置文件上
- 救援机器人使用 `--profile rescue` 运行
- 为救援账号使用一个完全独立的 Telegram 机器人
- 为救援机器人使用不同的基础端口，例如 `19789`

这样可以让救援机器人与主机器人隔离，因此当主机器人宕机时，它仍可用于调试或应用配置更改。基础端口之间至少保留 20 个端口的间隔，以确保派生的 browser/canvas/CDP 端口永不冲突。

## 救援机器人快速开始

除非你有充分理由采用其他方式，否则请将此作为默认路径：

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主机器人已经在运行，这通常就是你所需要的全部。

在执行 `openclaw --profile rescue onboard` 期间：

- 使用独立的 Telegram 机器人令牌
- 保持 `rescue` 配置文件
- 使用比主机器人至少高 20 的基础端口
- 接受默认的救援工作区，除非你已经自己管理了一个

如果新手引导已经为你安装了救援服务，则最后的 `gateway install` 就不需要了。

## 为什么这样可行

救援机器人保持独立，因为它拥有自己的：

- 配置文件 / 配置
- 状态目录
- 工作区
- 基础端口（以及派生端口）
- Telegram 机器人令牌

对于大多数设置，建议为救援配置文件使用一个完全独立的 Telegram 机器人：

- 易于保持仅限操作员使用
- 单独的机器人令牌和身份
- 独立于主机器人的渠道 / 应用安装
- 当主机器人损坏时，提供简单的基于私信的恢复路径

## `--profile rescue onboard` 会更改什么

`openclaw --profile rescue onboard` 使用普通的新手引导流程，但会将所有内容写入一个独立的配置文件中。

实际上，这意味着救援机器人会拥有自己的：

- 配置文件
- 状态目录
- 工作区（默认是 `~/.openclaw/workspace-rescue`）
- 托管服务名称

除此之外，提示与普通新手引导相同。

## 通用多 Gateway 网关设置

上面的救援机器人布局是最简单的默认方案，但相同的隔离模式也适用于在一台主机上运行任意一对或一组 Gateway 网关。

对于更通用的设置，请为每个额外的 Gateway 网关分配自己的命名配置文件和自己的基础端口：

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

如果你希望两个 Gateway 网关都使用命名配置文件，也完全可行：

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

服务也遵循相同模式：

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

如果你想要一个备用操作员通道，请使用救援机器人快速开始。如果你想为不同渠道、租户、工作区或运维角色运行多个长期存在的 Gateway 网关，请使用通用配置文件模式。

## 隔离检查清单

为每个 Gateway 网关实例保持以下项唯一：

- `OPENCLAW_CONFIG_PATH` — 每个实例单独的配置文件
- `OPENCLAW_STATE_DIR` — 每个实例单独的会话、凭证、缓存
- `agents.defaults.workspace` — 每个实例单独的工作区根目录
- `gateway.port`（或 `--port`）— 每个实例唯一
- 派生的 browser/canvas/CDP 端口

如果这些是共享的，你将遇到配置竞争和端口冲突。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- browser 控制服务端口 = 基础端口 + 2（仅限 local loopback）
- canvas host 由 Gateway 网关 HTTP 服务器提供服务（与 `gateway.port` 相同端口）
- Browser 配置文件的 CDP 端口会从 `browser.controlPort + 9 .. + 108` 自动分配

如果你在配置或环境变量中覆盖了这些值，必须确保每个实例都保持唯一。

## Browser/CDP 说明（常见陷阱）

- **不要** 在多个实例上将 `browser.cdpUrl` 固定为相同的值。
- 每个实例都需要自己的 browser 控制端口和 CDP 范围（从其 gateway 端口派生）。
- 如果你需要显式的 CDP 端口，请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：使用 `browser.profiles.<name>.cdpUrl`（按配置文件、按实例设置）。

## 手动环境变量示例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
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

- `gateway status --deep` 有助于发现来自旧安装的陈旧 launchd/systemd/schtasks 服务。
- 只有在你有意运行多个隔离的 Gateway 网关时，`gateway probe` 中像 `multiple reachable gateways detected` 这样的警告文本才是预期现象。

## 相关内容

- [Gateway runbook](/zh-CN/gateway)
- [Gateway lock](/zh-CN/gateway/gateway-lock)
- [Configuration](/zh-CN/gateway/configuration)
