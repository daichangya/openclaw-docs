---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 你需要为每个 Gateway 网关提供隔离的配置/状态/端口
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和 profiles）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-04-23T20:49:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 372f2ba155d2bf70c3d4ded5952e1d41124c9123c888525845f7d85bd6ebfba9
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 多个 Gateway 网关（同一主机）

大多数设置只需要一个 Gateway 网关，因为单个 Gateway 网关就可以处理多个消息连接和智能体。如果你需要更强的隔离性或冗余（例如救援 bot），可以运行多个使用隔离 profiles/ports 的独立 Gateway 网关。

## 最佳推荐设置

对大多数用户来说，最简单的救援 bot 设置是：

- 让主 bot 保持在默认 profile 上
- 让救援 bot 运行在 `--profile rescue`
- 为救援账户使用一个完全独立的 Telegram bot
- 为救援 bot 使用不同的基础端口，例如 `19789`

这样可以让救援 bot 与主 bot 隔离开来，因此当主 bot 宕机时，它仍可以进行调试或应用配置更改。基础端口之间至少保留 20 个端口的间隔，这样派生出的 browser/canvas/CDP 端口就不会发生冲突。

## 救援 Bot 快速开始

除非你有非常充分的理由使用其他方式，否则请将此作为默认路径：

```bash
# Rescue bot（独立 Telegram bot、独立 profile、端口 19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主 bot 已经在运行，通常这样就足够了。

在执行 `openclaw --profile rescue onboard` 期间：

- 使用独立的 Telegram bot token
- 保留 `rescue` profile
- 使用至少比主 bot 高 20 的基础端口
- 除非你已经自行管理，否则接受默认的 rescue 工作区

如果新手引导已经为你安装了 rescue 服务，则最后的
`gateway install` 就不需要了。

## 为什么这样可行

救援 bot 保持独立，因为它拥有自己的：

- profile/配置
- 状态目录
- 工作区
- 基础端口（以及派生端口）
- Telegram bot token

对于大多数设置，建议为 rescue profile 使用一个完全独立的 Telegram bot：

- 容易保持为仅运维者使用
- 独立的 bot token 和身份
- 独立于主 bot 的渠道/应用安装
- 当主 bot 出问题时，可通过私信实现简单的恢复路径

## `--profile rescue onboard` 会更改什么

`openclaw --profile rescue onboard` 使用正常的新手引导流程，但会将
所有内容写入一个独立 profile 中。

在实际效果上，这意味着 rescue bot 会拥有自己的：

- 配置文件
- 状态目录
- 工作区（默认是 `~/.openclaw/workspace-rescue`）
- 托管服务名称

除此之外，提示内容与普通新手引导相同。

## 通用多 Gateway 网关设置

上面的救援 bot 布局是最简单的默认方式，但同样的隔离
模式也适用于同一主机上的任意两个或更多 Gateway 网关。

对于更通用的设置，请为每个额外 Gateway 网关分配自己的命名 profile 和自己的基础端口：

```bash
# main（默认 profile）
openclaw setup
openclaw gateway --port 18789

# 额外 Gateway 网关
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

如果你希望两个 Gateway 网关都使用命名 profile，也可以：

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

服务也遵循同样的模式：

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

当你需要一条回退运维通道时，请使用救援 bot 快速开始。  
当你希望为不同渠道、租户、工作区或运维角色运行多个长期存在的 Gateway 网关时，请使用通用 profile 模式。

## 隔离检查清单

请确保每个 Gateway 网关实例都使用唯一值：

- `OPENCLAW_CONFIG_PATH` —— 每个实例独立的配置文件
- `OPENCLAW_STATE_DIR` —— 每个实例独立的会话、凭证、缓存
- `agents.defaults.workspace` —— 每个实例独立的工作区根目录
- `gateway.port`（或 `--port`）—— 每个实例唯一
- 派生的 browser/canvas/CDP 端口

如果这些内容被共享，你将遇到配置竞争和端口冲突。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- browser 控制服务端口 = 基础端口 + 2（仅限 local loopback）
- canvas host 由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 使用相同端口）
- Browser profile CDP 端口会从 `browser.controlPort + 9 .. + 108` 自动分配

如果你在配置或环境变量中覆盖了这些值，则必须保证每个实例都使用唯一值。

## Browser/CDP 说明（常见陷阱）

- **不要** 在多个实例上将 `browser.cdpUrl` 固定为相同值。
- 每个实例都需要自己的 browser 控制端口和 CDP 范围（由其 gateway 端口派生）。
- 如果你需要显式 CDP 端口，请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：请使用 `browser.profiles.<name>.cdpUrl`（按 profile、按实例设置）。

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

- `gateway status --deep` 有助于发现旧安装遗留下来的 launchd/systemd/schtasks 服务。
- 当且仅当你有意运行多个隔离 Gateway 网关时，`gateway probe` 中类似 `multiple reachable gateways detected` 的警告文本才是预期行为。
