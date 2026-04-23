---
read_when:
    - 更改智能体运行时、工作区引导或会话行为
summary: 智能体运行时、工作区契约和会话引导
title: 智能体运行时
x-i18n:
    generated_at: "2026-04-23T20:45:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669981cd99f7f0fae64b91b1131354207b4a16440c20a928928ea311a186417b
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw 运行一个单一的内置智能体运行时。

## 工作区（必需）

OpenClaw 使用单个智能体工作区目录（`agents.defaults.workspace`）作为智能体用于工具和上下文的**唯一**工作目录（`cwd`）。

建议：如果 `~/.openclaw/openclaw.json` 缺失，请使用 `openclaw setup` 创建它并初始化工作区文件。

完整工作区布局和备份指南：[智能体工作区](/zh-CN/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非 main 会话可以使用
`agents.defaults.sandbox.workspaceRoot` 下的按会话工作区覆盖此设置（请参阅
[Gateway 网关配置](/zh-CN/gateway/configuration)）。

## 引导文件（注入）

在 `agents.defaults.workspace` 中，OpenClaw 期望存在以下可由用户编辑的文件：

- `AGENTS.md` — 操作说明 + “记忆”
- `SOUL.md` — 人设、边界、语气
- `TOOLS.md` — 由用户维护的工具说明（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` — 一次性的首次运行仪式（完成后删除）
- `IDENTITY.md` — 智能体名称/风格/emoji
- `USER.md` — 用户档案 + 偏好的称呼方式

在新会话的首次轮次中，OpenClaw 会将这些文件的内容直接注入智能体上下文。

空白文件会被跳过。大文件会被裁剪并附带标记进行截断，以保持提示词精简（如需完整内容，请直接读取文件）。

如果某个文件缺失，OpenClaw 会注入一行“缺失文件”标记（并且 `openclaw setup` 会创建一个安全的默认模板）。

`BOOTSTRAP.md` 仅会为**全新工作区**创建（即不存在其他引导文件时）。如果你在完成仪式后删除它，它不应在后续重启时再次被创建。

若要完全禁用引导文件创建（用于已预置内容的工作区），请设置：

```json5
{ agent: { skipBootstrap: true } }
```

## 内置工具

核心工具（read/exec/edit/write 及相关系统工具）始终可用，但会受工具策略约束。`apply_patch` 是可选的，并由 `tools.exec.applyPatch` 控制。`TOOLS.md` **不会** 控制哪些工具存在；它只是关于_你希望如何使用_这些工具的指导。

## Skills

OpenClaw 会从以下位置加载 Skills（优先级从高到低）：

- 工作区：`<workspace>/skills`
- 项目智能体 Skills：`<workspace>/.agents/skills`
- 个人智能体 Skills：`~/.agents/skills`
- 托管/本地：`~/.openclaw/skills`
- 内置项（随安装提供）
- 额外 Skills 文件夹：`skills.load.extraDirs`

Skills 可通过配置/环境变量进行门控（请参阅 [Gateway 网关配置](/zh-CN/gateway/configuration) 中的 `skills`）。

## 运行时边界

内置智能体运行时建立在 Pi 智能体核心之上（模型、工具和提示词流水线）。会话管理、设备发现、工具接线和渠道投递则是 OpenClaw 在该核心之上拥有的层。

## 会话

会话转录会以 JSONL 格式存储在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 是稳定的，并由 OpenClaw 选择。
不会读取来自其他工具的旧版会话文件夹。

## 流式传输期间的引导

当队列模式为 `steer` 时，入站消息会被注入当前运行。
排队的引导消息会在当前助手轮次完成其工具调用执行**之后**、下一次 LLM 调用**之前**投递。引导不再跳过当前助手消息中剩余的工具调用；而是在下一个模型边界注入排队消息。

当队列模式为 `followup` 或 `collect` 时，入站消息会被保留到当前轮次结束，然后智能体会以排队载荷启动一个新的轮次。有关模式 + 去抖/上限行为，请参阅[队列](/zh-CN/concepts/queue)。

分块流式传输会在助手块完成后立即发送；它**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
可通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 或 `message_end`；默认是 `text_end`）。
可通过 `agents.defaults.blockStreamingChunk` 控制软分块（默认
800–1200 个字符；优先按段落断开，其次按换行，最后按句子）。
使用 `agents.defaults.blockStreamingCoalesce` 聚合流式分块，可减少单行刷屏（在发送前基于空闲时间进行合并）。非 Telegram 渠道需要显式设置
`*.blockStreaming: true` 才能启用块回复。
详细工具摘要会在工具启动时发出（无去抖）；控制 UI 会在可用时通过智能体事件流式显示工具输出。
更多详情：[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）会通过在**第一个** `/` 处分割来解析。

- 配置模型时使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 id 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商。如果该提供商不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的 provider/model，而不是暴露一个已失效、已被移除提供商的默认值。

## 配置（最小值）

至少需要设置：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈建议）

---

_下一步：[群聊](/zh-CN/channels/group-messages)_ 🦞
