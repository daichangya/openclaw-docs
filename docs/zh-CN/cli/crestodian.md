---
read_when:
    - 你在不带任何命令的情况下运行 openclaw，并且想了解 Crestodian
    - 你需要一种无配置且安全的方式来检查或修复 OpenClaw
    - 你正在设计或启用消息渠道救援模式
summary: Crestodian 的 CLI 参考和安全模型，即这个无配置且安全的设置与修复辅助工具
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T09:23:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: bcb9d6c81ca95d3738094143147d1a237bfb2037e530f87dc9aea20f6f528010
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本地设置、修复和配置辅助工具。它的设计目标是在正常智能体路径损坏时，仍然可以访问。

在不带任何命令的情况下运行 `openclaw` 会在交互式终端中启动 Crestodian。运行 `openclaw crestodian` 会显式启动同一个辅助工具。

## Crestodian 会显示什么

启动时，Crestodian 会打印一个紧凑的系统概览：

- 配置路径及其有效性
- 已配置的智能体和默认智能体
- 默认模型
- 本地 Codex 和 Claude Code CLI 的可用性
- OpenAI 和 Anthropic API 密钥是否存在
- 规划器模式（`deterministic` 或通过已配置模型进行模型辅助）
- 本地文档路径或公共文档 URL
- Git 检出时的本地源码路径，否则为 OpenClaw GitHub 源码 URL
- Gateway 网关 可达性
- 立即推荐的下一步操作

它不会为了启动而转储密钥，也不会加载插件 CLI 命令。

Crestodian 使用与常规智能体相同的 OpenClaw 参考发现机制。在 Git 检出中，它会将自身指向本地 `docs/` 和本地源码树。在 npm 包安装中，它会使用随包提供的文档，并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，同时明确建议你在文档不够用时查阅源码。

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

在交互式提示符中：

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

Crestodian 的启动路径被刻意保持得很小。在以下情况下它也可以运行：

- `openclaw.json` 缺失
- `openclaw.json` 无效
- Gateway 网关 已停止
- 插件命令注册不可用
- 尚未配置任何智能体

`openclaw --help` 和 `openclaw --version` 仍然使用正常的快速路径。
非交互式 `openclaw` 会输出一条简短消息后退出，而不是打印根帮助信息，因为无命令产品形态就是 Crestodian。

## 操作和批准

Crestodian 使用类型化操作，而不是临时编辑配置。

只读操作可以立即运行：

- 显示概览
- 列出智能体
- 显示模型/后端 Status
- 运行 status 或 health 检查
- 检查 Gateway 网关 可达性
- 运行 doctor，但不执行交互式修复
- 验证配置
- 显示审计日志路径

持久化操作在交互模式下需要对话式批准，除非你为直接命令传递 `--yes`：

- 写入配置
- 运行 `config set`
- 通过 `config set-ref` 设置受支持的 SecretRef 值
- 运行 setup/新手引导 引导流程
- 更改默认模型
- 启动、停止或重启 Gateway 网关
- 创建智能体
- 运行会重写配置或状态的 doctor 修复

已应用的写入会记录到：

```text
~/.openclaw/audit/crestodian.jsonl
```

发现过程不会被审计。只有已应用的操作和写入会被记录。

`openclaw onboard --modern` 会将 Crestodian 作为现代新手引导预览启动。
普通的 `openclaw onboard` 仍然运行经典新手引导。

## 设置引导

`setup` 是以聊天为先的新手引导引导流程。它只会通过类型化配置操作进行写入，并且会先请求批准。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

当未配置任何模型时，setup 会按以下顺序选择第一个可用后端，并告诉你它选择了什么：

- 已有的显式模型（如果已经配置）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

如果这些都不可用，setup 仍会写入默认工作区，并将模型保持为未设置状态。安装或登录 Codex/Claude Code，或者暴露 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然后再次运行 setup。

## 模型辅助规划器

Crestodian 始终以确定性模式启动。对于确定性解析器无法理解的模糊命令，本地 Crestodian 可以通过 OpenClaw 的正常运行时路径执行一次受限的规划器轮次。它会优先使用已配置的 OpenClaw 模型。如果尚无可用的已配置模型，它可以回退到机器上已存在的本地运行时：

- Claude Code CLI：`claude-cli/claude-opus-4-7`
- Codex app-server harness：`openai/gpt-5.5`，带 `embeddedHarness.runtime: "codex"`
- Codex CLI：`codex-cli/gpt-5.5`

模型辅助规划器不能直接修改配置。它必须先将请求转换为 Crestodian 的某个类型化命令，然后才会应用正常的批准和审计规则。Crestodian 会在执行任何操作之前打印它使用的模型以及解释后的命令。无配置回退规划器轮次是临时的，在运行时支持的情况下会禁用工具，并使用临时工作区/会话。

消息渠道救援模式不会使用模型辅助规划器。远程救援保持确定性，这样损坏或被攻陷的正常智能体路径就不能被用作配置编辑器。

## 切换到智能体

使用自然语言选择器离开 Crestodian 并打开正常 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 仍会直接打开正常智能体 TUI。它们不会启动 Crestodian。

切换到正常 TUI 后，使用 `/crestodian` 返回 Crestodian。你可以附带后续请求：

```text
/crestodian
/crestodian restart gateway
```

TUI 内部的智能体切换会留下一个提示，表明 `/crestodian` 可用。

## 消息救援模式

消息救援模式是 Crestodian 的消息渠道入口点。它适用于这样的场景：你的正常智能体已失效，但像 WhatsApp 这样的可信渠道仍然可以接收命令。

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

也可以从本地提示符或救援模式中排队创建智能体：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

远程救援模式是一个管理员界面。必须将其视为远程配置修复，而不是普通聊天。

远程救援的安全约定：

- 当沙箱隔离处于活动状态时禁用。如果某个智能体/会话处于沙箱隔离状态，Crestodian 必须拒绝远程救援，并说明需要使用本地 CLI 修复。
- 默认有效状态为 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已经具有未沙箱隔离的本地权限。
- 需要显式的所有者身份。救援不得接受通配发送者规则、开放群组策略、未经身份验证的 webhook 或匿名渠道。
- 默认仅限所有者 私信。群组/渠道救援需要显式选择启用，并且仍应将批准提示路由到所有者 私信。
- 远程救援不能打开本地 TUI，也不能切换到交互式智能体会话。要进行智能体切换，请使用本地 `openclaw`。
- 即使在救援模式下，持久化写入仍然需要批准。
- 审计每一项已应用的救援操作，包括渠道、账户、发送者、会话键、操作、变更前配置哈希和变更后配置哈希。
- 永远不要回显密钥。SecretRef 检查应报告可用性，而不是值。
- 如果 Gateway 网关 存活，优先使用 Gateway 网关 类型化操作。如果 Gateway 网关 已停止，则只使用不依赖正常 Agent loop 的最小本地修复界面。

配置结构：

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

- `"auto"`：默认。仅当有效运行时为 YOLO 且沙箱隔离关闭时允许。
- `false`：绝不允许消息渠道救援。
- `true`：当所有者/渠道检查通过时显式允许救援。这仍然不得绕过沙箱隔离拒绝。

默认的 `"auto"` YOLO 姿态为：

- 沙箱模式解析为 `off`
- `tools.exec.security` 解析为 `full`
- `tools.exec.ask` 解析为 `off`

远程救援由 Docker 通道覆盖测试：

```bash
pnpm test:docker:crestodian-rescue
```

无配置本地规划器回退由以下测试覆盖：

```bash
pnpm test:docker:crestodian-planner
```

一个选择启用的实时渠道命令界面冒烟测试会检查 `/crestodian status`，以及通过救援处理器执行的持久化批准往返流程：

```bash
pnpm test:live:crestodian-rescue-channel
```

通过 Crestodian 执行的全新无配置 setup 由以下测试覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Doctor](/zh-CN/cli/doctor)
- [TUI](/zh-CN/cli/tui)
- [沙箱](/zh-CN/cli/sandbox)
- [安全](/zh-CN/cli/security)
