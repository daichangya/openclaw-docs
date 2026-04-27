---
read_when:
    - 你在不带任何命令的情况下运行 `openclaw`，并且想了解 Crestodian
    - 你需要一种无配置且安全的方式来检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: Crestodian 的 CLI 参考和安全模型，这是一个无配置且安全的设置与修复辅助工具
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T07:48:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本地设置、修复和配置辅助工具。它被设计为在正常智能体路径损坏时仍可访问。

在不带任何命令的情况下运行 `openclaw` 会在交互式终端中启动 Crestodian。
运行 `openclaw crestodian` 会显式启动同一个辅助工具。

## Crestodian 会显示什么

启动时，交互式 Crestodian 会打开与 `openclaw tui` 相同的 TUI shell，但使用 Crestodian 聊天后端。聊天日志会以简短的问候开始：

- 何时启动 Crestodian
- Crestodian 实际使用的模型或确定性规划器路径
- 配置有效性和默认智能体
- 来自首次启动探测的 Gateway 网关 可达性
- Crestodian 接下来可以执行的调试操作

它不会为了启动而转储密钥，也不会加载插件 CLI 命令。TUI 仍然提供常规的页眉、聊天日志、状态行、页脚、自动补全和编辑器控件。

使用 `status` 可查看详细清单，其中包括配置路径、文档/源码路径、本地 CLI 探测、API 密钥存在情况、智能体、模型以及 Gateway 网关 详情。

Crestodian 使用与常规智能体相同的 OpenClaw 参考发现机制。在 Git 检出中，它会将自己指向本地 `docs/` 和本地源码树。在 npm 包安装中，它会使用打包附带的文档，并链接到
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同时明确提示在文档不足时查看源码。

## 示例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

在 Crestodian TUI 内：

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 安全启动

Crestodian 的启动路径被刻意保持得很小。它可以在以下情况下运行：

- 缺少 `openclaw.json`
- `openclaw.json` 无效
- Gateway 网关 已关闭
- 插件命令注册不可用
- 尚未配置任何智能体

`openclaw --help` 和 `openclaw --version` 仍然使用常规快速路径。
非交互式 `openclaw` 会用一条简短消息退出，而不是打印根帮助，因为无命令产品就是 Crestodian。

## 操作与批准

Crestodian 使用类型化操作，而不是临时编辑配置。

只读操作可以立即运行：

- 显示概览
- 列出智能体
- 显示模型/后端状态
- 运行 status 或健康检查
- 检查 Gateway 网关 可达性
- 在不进行交互式修复的情况下运行 doctor
- 验证配置
- 显示审计日志路径

持久化操作在交互模式下需要会话式批准，除非你为直接命令传递 `--yes`：

- 写入配置
- 运行 `config set`
- 通过 `config set-ref` 设置受支持的 `SecretRef` 值
- 运行 setup/新手引导 bootstrap
- 更改默认模型
- 启动、停止或重启 Gateway 网关
- 创建智能体
- 运行会重写配置或状态的 doctor 修复

已应用的写入会记录到：

```text
~/.openclaw/audit/crestodian.jsonl
```

设备发现不会被审计。只有已应用的操作和写入会被记录。

`openclaw onboard --modern` 会将 Crestodian 作为现代新手引导预览启动。
普通的 `openclaw onboard` 仍然运行经典新手引导。

## Setup bootstrap

`setup` 是一种以聊天优先的新手引导 bootstrap。它只通过类型化配置操作进行写入，并且会先请求批准。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

当未配置模型时，setup 会按以下顺序选择第一个可用后端，并告诉你它选择了什么：

- 已有显式模型（如果已配置）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

如果这些都不可用，setup 仍会写入默认工作区，并将模型保持为未设置。安装或登录 Codex/Claude Code，或暴露
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然后再次运行 setup。

## 模型辅助规划器

Crestodian 始终以确定性模式启动。对于确定性解析器无法理解的模糊命令，本地 Crestodian 可以通过 OpenClaw 的常规运行时路径执行一次受限的规划器轮次。它会先使用已配置的 OpenClaw 模型。如果尚无可用的已配置模型，它可以回退到机器上已存在的本地运行时：

- Claude Code CLI：`claude-cli/claude-opus-4-7`
- Codex app-server harness：`openai/gpt-5.5`，带 `agentRuntime.id: "codex"`
- Codex CLI：`codex-cli/gpt-5.5`

模型辅助规划器不能直接更改配置。它必须将请求转换为 Crestodian 的某个类型化命令，然后再应用常规的批准和审计规则。Crestodian 会在执行任何操作之前打印它所使用的模型和解释后的命令。无配置的回退规划器轮次是临时的，在运行时支持的情况下会禁用工具，并使用临时工作区/会话。

消息渠道救援模式不会使用模型辅助规划器。远程救援保持确定性，这样损坏或被攻陷的正常智能体路径就不能被用作配置编辑器。

## 切换到智能体

使用自然语言选择器可离开 Crestodian 并打开常规 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 仍会直接打开常规智能体 TUI。它们不会启动 Crestodian。

切换到常规 TUI 后，使用 `/crestodian` 返回 Crestodian。
你可以附带后续请求：

```text
/crestodian
/crestodian restart gateway
```

TUI 内的智能体切换会留下一个提示，说明 `/crestodian` 可用。

## 消息救援模式

消息救援模式是 Crestodian 的消息渠道入口。它适用于你的正常智能体已失效，但像 WhatsApp 这样的受信任渠道仍然可以接收命令的情况。

支持的文本命令：

- `/crestodian <request>`

操作员流程：

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

也可以通过本地提示或救援模式排队创建智能体：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

远程救援模式是一个管理员界面。必须将其视为远程配置修复，而不是普通聊天。

远程救援的安全约定：

- 当沙箱隔离处于激活状态时禁用。如果某个智能体/会话已被沙箱隔离，Crestodian 必须拒绝远程救援，并说明需要本地 CLI 修复。
- 默认有效状态是 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已经具有未沙箱隔离的本地权限。
- 要求明确的所有者身份。救援不得接受通配发送者规则、开放群组策略、未认证的 webhook 或匿名渠道。
- 默认仅限所有者私信。群组/渠道救援需要显式选择启用。
- 远程救援不能打开本地 TUI，也不能切换到交互式智能体会话。智能体交接请使用本地 `openclaw`。
- 即使在救援模式下，持久化写入仍然需要批准。
- 审计每个已应用的救援操作。消息渠道救援会记录渠道、账号、发送者和源地址元数据。更改配置的操作还会记录变更前后的配置哈希。
- 绝不回显密钥。`SecretRef` 检查应报告可用性，而不是值。
- 如果 Gateway 网关 存活，优先使用 Gateway 网关 类型化操作。如果 Gateway 网关 已失效，只使用不依赖常规 Agent loop 的最小本地修复界面。

配置形状：

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` 应接受：

- `"auto"`：默认值。仅当有效运行时是 YOLO 且沙箱隔离关闭时允许。
- `false`：绝不允许消息渠道救援。
- `true`：当所有者/渠道检查通过时显式允许救援。但这仍然不能绕过沙箱隔离拒绝。

默认的 `"auto"` YOLO 姿态是：

- 沙箱模式解析为 `off`
- `tools.exec.security` 解析为 `full`
- `tools.exec.ask` 解析为 `off`

远程救援由 Docker lane 覆盖：

```bash
pnpm test:docker:crestodian-rescue
```

无配置的本地规划器回退由以下内容覆盖：

```bash
pnpm test:docker:crestodian-planner
```

一个可选启用的实时渠道命令界面冒烟测试会检查 `/crestodian status`，以及通过救援处理器完成一次持久化批准往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

通过 Crestodian 进行的全新无配置 setup 由以下内容覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

该 lane 从一个空状态目录开始，将裸 `openclaw` 路由到 Crestodian，设置默认模型，创建一个额外智能体，通过插件启用加 token `SecretRef` 配置 Discord，验证配置，并检查审计日志。QA Lab 还为相同的 Ring 0 流程提供了一个基于仓库的场景：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [安全性](/zh-CN/cli/security)
