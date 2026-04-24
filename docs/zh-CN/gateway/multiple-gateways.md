---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 你需要为每个 Gateway 网关提供独立的配置/状态/端口
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和配置文件）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-04-24T03:16:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 多个 Gateway 网关（同一主机）

大多数设置应使用一个 Gateway 网关，因为单个 Gateway 网关可以处理多个消息连接和智能体。如果你需要更强的隔离或冗余（例如救援机器人），请运行使用独立配置文件/端口的独立 Gateway 网关。

## 最佳推荐设置

对大多数用户来说，最简单的救援机器人设置是：

- 将主机器人保留在默认配置文件上
- 在 `--profile rescue` 上运行救援机器人
- 为救援账号使用一个完全独立的 Telegram 机器人
- 将救援机器人放在不同的基础端口上，例如 `19789`

这样可以将救援机器人与主机器人隔离开，因此当主机器人宕机时，它可以调试或应用
配置更改。基础端口之间至少保留 20 个端口，这样派生出的浏览器/canvas/CDP 端口就不会发生冲突。

## 救援机器人快速开始

除非你有非常充分的理由采用其他方式，否则请将其作为默认路径：

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主机器人已经在运行，这通常就是你所需要的一切。

在执行 `openclaw --profile rescue onboard` 期间：

- 使用独立的 Telegram 机器人令牌
- 保持 `rescue` 配置文件
- 使用至少比主机器人高 20 的基础端口
- 接受默认的救援工作区，除非你已经自行管理了一个

如果新手引导已经为你安装了救援服务，则最后的
`gateway install` 就不需要了。

## 为什么这样可行

救援机器人保持独立，因为它拥有自己的：

- 配置文件/配置
- 状态目录
- 工作区
- 基础端口（以及派生端口）
- Telegram 机器人令牌

对于大多数设置，为 rescue 配置文件使用一个完全独立的 Telegram 机器人：

- 易于保持为仅操作员可用
- 独立的机器人令牌和身份
- 独立于主机器人的渠道/应用安装
- 当主机器人损坏时，基于私信的简单恢复路径

## `--profile rescue onboard` 会更改什么

`openclaw --profile rescue onboard` 使用正常的新手引导流程，但它
会将所有内容写入单独的配置文件。

在实际中，这意味着救援机器人会拥有自己的：

- 配置文件
- 状态目录
- 工作区（默认是 `~/.openclaw/workspace-rescue`）
- 托管服务名称

除此之外，这些提示与正常的新手引导相同。

## 通用多 Gateway 网关设置

上面的救援机器人布局是最简单的默认方式，但相同的隔离
模式适用于同一主机上的任意一对或一组 Gateway 网关。

对于更通用的设置，请为每个额外的 Gateway 网关分配自己的命名配置文件和
自己的基础端口：

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

如果你希望两个 Gateway 网关都使用命名配置文件，这也完全可行：

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

服务遵循相同模式：

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

当你想要一个后备操作员通道时，请使用救援机器人快速开始。当你希望为
不同渠道、租户、工作区或操作角色运行多个长期存在的 Gateway 网关时，请使用
通用配置文件模式。

## 隔离检查清单

请确保每个 Gateway 网关实例的以下项都是唯一的：

- `OPENCLAW_CONFIG_PATH` — 每实例配置文件
- `OPENCLAW_STATE_DIR` — 每实例会话、凭证、缓存
- `agents.defaults.workspace` — 每实例工作区根目录
- `gateway.port`（或 `--port`）— 每实例唯一
- 派生的浏览器/canvas/CDP 端口

如果这些内容被共享，你将遇到配置竞争和端口冲突。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 浏览器控制服务端口 = 基础端口 + 2（仅限 loopback）
- canvas host 通过 Gateway 网关 HTTP 服务器提供服务（与 `gateway.port` 使用同一端口）
- 浏览器配置文件 CDP 端口会从 `browser.controlPort + 9 .. + 108` 自动分配

如果你在配置或环境变量中覆盖了其中任意项，必须确保它们对每个实例都是唯一的。

## 浏览器/CDP 说明（常见陷阱）

- **不要** 在多个实例上将 `browser.cdpUrl` 固定为相同值。
- 每个实例都需要自己的浏览器控制端口和 CDP 范围（由其 gateway 端口派生）。
- 如果你需要显式 CDP 端口，请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：使用 `browser.profiles.<name>.cdpUrl`（每个配置文件、每个实例）。

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

解释：

- `gateway status --deep` 有助于发现旧安装留下的陈旧 launchd/systemd/schtasks 服务。
- `gateway probe` 中如 `multiple reachable gateways detected` 之类的警告文本，只有在你有意运行多个独立 Gateway 网关时才是预期现象。

## 相关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关锁](/zh-CN/gateway/gateway-lock)
- [配置](/zh-CN/gateway/configuration)
