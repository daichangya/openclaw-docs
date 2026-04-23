---
read_when:
    - 更改智能体运行时、工作区引导或会话行为
summary: 智能体运行时、工作区契约和会话引导
title: 智能体运行时
x-i18n:
    generated_at: "2026-04-23T22:56:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d4d1e20b740ae9633da05005d93acbb2b127534fc881895c373af4076461b96
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw 运行一个单一的内嵌智能体运行时。

## 工作区（必需）

OpenClaw 使用单个智能体工作区目录（`agents.defaults.workspace`）作为智能体工具和上下文的 **唯一** 工作目录（`cwd`）。

建议：如果缺少 `~/.openclaw/openclaw.json`，请使用 `openclaw setup` 创建它并初始化工作区文件。

完整的工作区布局和备份指南： [智能体工作区](/zh-CN/concepts/agent-workspace)

如果启用了 `agents.defaults.sandbox`，非主会话可以使用
`agents.defaults.sandbox.workspaceRoot` 下的按会话工作区覆盖该设置（参见
[Gateway 网关配置](/zh-CN/gateway/configuration)）。

## 引导文件（注入）

在 `agents.defaults.workspace` 内，OpenClaw 期望存在以下可由用户编辑的文件：

- `AGENTS.md` — 操作说明 + “记忆”
- `SOUL.md` — 人设、边界、语气
- `TOOLS.md` — 用户维护的工具说明（例如 `imsg`、`sag`、约定）
- `BOOTSTRAP.md` — 一次性的首次运行仪式（完成后删除）
- `IDENTITY.md` — 智能体名称 / 风格 / emoji
- `USER.md` — 用户档案 + 偏好的称呼方式

在新会话的第一轮中，OpenClaw 会将这些文件的内容直接注入到智能体上下文中。

空文件会被跳过。大文件会被裁剪并附带截断标记，以保持提示精简（如需完整内容，请读取文件）。

如果文件缺失，OpenClaw 会注入一行“缺失文件”标记（并且 `openclaw setup` 会创建安全的默认模板）。

`BOOTSTRAP.md` 仅会为 **全新的工作区** 创建（即不存在其他引导文件时）。如果你在完成仪式后删除它，后续重启时不应再次创建。

如需完全禁用引导文件创建（用于预先填充的工作区），请设置：

```json5
{ agent: { skipBootstrap: true } }
```

## 内置工具

核心工具（read/exec/edit/write 及相关系统工具）始终可用，
但受工具策略限制。`apply_patch` 是可选的，并受
`tools.exec.applyPatch` 控制。`TOOLS.md` **不** 控制哪些工具存在；它只是
说明 _你_ 希望如何使用这些工具。

## Skills

OpenClaw 会从以下位置加载 Skills（优先级从高到低）：

- 工作区：`<workspace>/skills`
- 项目智能体 Skills：`<workspace>/.agents/skills`
- 个人智能体 Skills：`~/.agents/skills`
- 托管 / 本地：`~/.openclaw/skills`
- 内置项（随安装一起提供）
- 额外 Skill 目录：`skills.load.extraDirs`

Skills 可以通过配置 / 环境变量进行控制（参见 [Gateway 网关配置](/zh-CN/gateway/configuration) 中的 `skills`）。

## 运行时边界

内嵌智能体运行时构建在 Pi 智能体核心之上（模型、工具和
提示词管线）。会话管理、发现、工具接线以及渠道投递是 OpenClaw 在该核心之上拥有的层。

## 会话

会话转录以 JSONL 格式存储在以下位置：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

会话 ID 是稳定的，并由 OpenClaw 选择。
不会读取来自其他工具的旧版会话文件夹。

## 流式传输期间的引导

当队列模式为 `steer` 时，入站消息会被注入到当前运行中。
排队的引导消息会在**当前助手轮次完成其工具调用执行之后**、下一次 LLM 调用之前送达。引导不再跳过当前助手消息中剩余的工具调用；它会改为在下一个模型边界注入排队消息。

当队列模式为 `followup` 或 `collect` 时，入站消息会被保留到
当前轮次结束，然后使用排队负载启动新的智能体轮次。有关模式以及去抖 / 上限行为，请参见
[队列](/zh-CN/concepts/queue)。

分块流式传输会在助手完成块后立即发送；它
**默认关闭**（`agents.defaults.blockStreamingDefault: "off"`）。
可通过 `agents.defaults.blockStreamingBreak` 调整边界（`text_end` 或 `message_end`；默认为 text_end）。
可通过 `agents.defaults.blockStreamingChunk` 控制软分块行为（默认
800–1200 个字符；优先段落分隔，其次换行，最后句子）。
使用 `agents.defaults.blockStreamingCoalesce` 对流式分块进行合并，以减少
单行刷屏（发送前基于空闲时间进行合并）。非 Telegram 渠道需要
显式设置 `*.blockStreaming: true` 才会启用分块回复。
详细工具摘要会在工具启动时发出（无去抖）；如果可用，Control UI
会通过智能体事件流式显示工具输出。
更多详情： [流式传输 + 分块](/zh-CN/concepts/streaming)。

## 模型引用

配置中的模型引用（例如 `agents.defaults.model` 和 `agents.defaults.models`）通过按 **第一个** `/` 分割进行解析。

- 配置模型时，请使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 风格），请包含提供商前缀（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 ID 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商。如果该提供商不再提供已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商 / 模型，而不是暴露一个过时的、已移除提供商默认值。

## 配置（最小）

至少设置以下内容：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（强烈建议）

---

_下一步： [群聊](/zh-CN/channels/group-messages)_ 🦞

## 相关内容

- [智能体工作区](/zh-CN/concepts/agent-workspace)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [会话管理](/zh-CN/concepts/session)
