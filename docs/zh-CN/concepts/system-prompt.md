---
read_when:
    - 编辑系统提示词文本、工具列表或时间/心跳部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含什么，以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-04-25T08:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw 会为每次智能体运行构建一个自定义系统提示词。该提示词由 **OpenClaw 拥有**，不使用 pi-coding-agent 默认提示词。

提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以贡献具备缓存感知能力的提示词指导，而无需替换完整的 OpenClaw 自有提示词。提供商运行时可以：

- 替换一小组具名核心部分（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在提示词缓存边界上方注入一个**稳定前缀**
- 在提示词缓存边界下方注入一个**动态后缀**

将提供商自有贡献用于针对特定模型家族的调优。保留遗留的 `before_prompt_build` 提示词变更机制，以兼容性需求或真正的全局提示词变更为主，而不是用于常规提供商行为。

OpenAI GPT-5 系列叠加层保持核心执行规则简洁，同时添加模型特定指导，用于角色锁定、简洁输出、工具纪律、并行查找、交付物覆盖、验证、缺失上下文以及终端工具使用规范。

## 结构

该提示词刻意保持紧凑，并使用固定部分：

- **工具**：结构化工具事实来源提醒，以及运行时工具使用指导。
- **执行倾向**：紧凑的贯彻执行指导：对可执行请求在当前轮次内采取行动，持续直到完成或受阻，从较弱的工具结果中恢复，实时检查可变状态，并在最终完成前进行验证。
- **安全**：简短的护栏提醒，避免寻求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载技能说明。
- **OpenClaw 自我更新**：如何使用 `config.schema.lookup` 安全检查配置，使用 `config.patch` 修补配置，使用 `config.apply` 替换完整配置，并且仅在用户明确请求时运行 `update.run`。仅限所有者使用的 `gateway` 工具也会拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括会规范化到这些受保护执行路径的遗留 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时阅读它们。
- **工作区文件（已注入）**：表明引导文件已包含在下方。
- **沙箱**（启用时）：表明运行时已沙箱隔离、沙箱路径以及是否可使用提权执行。
- **当前日期和时间**：用户本地时间、时区和时间格式。
- **回复标签**：受支持提供商的可选回复标签语法。
- **心跳**：当默认智能体启用心跳时的心跳提示和确认行为。
- **运行时**：主机、操作系统、node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **推理**：当前可见性级别 + `/reasoning` 切换提示。

“工具”部分还包含针对长时间运行工作的运行时指导：

- 对将来的跟进（`check back later`、提醒、周期性工作）使用 cron，而不是使用 `exec` 睡眠循环、`yieldMs` 延迟技巧或重复轮询 `process`
- 仅对“立即启动并继续在后台运行”的命令使用 `exec` / `process`
- 当启用自动完成唤醒时，只启动一次命令，并依赖其在输出或失败时的基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是基于推送的，并会自动回报给请求者
- 不要仅为了等待完成而循环轮询 `subagents list` / `sessions_list`

当实验性的 `update_plan` 工具启用时，“工具”部分还会告诉模型仅将其用于非平凡的多步骤工作、始终只保留一个 `in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示词中的安全护栏仅起建议作用。它们用于引导模型行为，但不强制执行策略。要实现硬性强制，请使用工具策略、执行审批、沙箱隔离和渠道允许列表；运营者可以按设计禁用这些机制。

在具有原生审批卡片/按钮的渠道上，运行时提示词现在会告诉智能体优先依赖该原生审批 UI。只有当工具结果表明聊天审批不可用，或者手动审批是唯一可行路径时，它才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置一个 `promptMode`（不是面向用户的配置）：

- `full`（默认）：包含以上所有部分。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw 自我更新**、**模型别名**、**用户身份**、**回复标签**、**消息传递**、**静默回复** 和 **心跳**。工具、**安全**、工作区、沙箱、当前日期和时间（已知时）、运行时以及注入的上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为 **子智能体上下文**，而不是 **群聊上下文**。

## 工作区引导注入

引导文件会被裁剪，并追加到 **项目上下文** 下，以便模型无需显式读取就能看到身份和配置资料上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新工作区中）
- 存在时的 `MEMORY.md`

除非某个文件适用特定门控，否则以上所有文件都会在每一轮**注入到上下文窗口中**。当默认智能体禁用心跳，或 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，正常运行中会省略 `HEARTBEAT.md`。请保持注入文件简洁——尤其是 `MEMORY.md`，它会随着时间增长，并可能导致上下文使用量意外升高和更频繁的压缩。

> **注意：** `memory/*.md` 每日文件**不属于**常规引导项目上下文。在普通轮次中，它们通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取它们，否则不会占用上下文窗口。纯 `/new` 和 `/reset` 轮次是例外：运行时可以在第一轮之前将最近的每日记忆作为一次性启动上下文块预置进去。

大型文件会带有标记被截断。每个文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（默认：12000）。跨文件注入的引导内容总量受 `agents.defaults.bootstrapTotalMaxChars` 限制（默认：60000）。缺失文件会注入一个简短的缺失文件标记。发生截断时，OpenClaw 可以在项目上下文中注入一个警告块；可通过 `agents.defaults.bootstrapPromptTruncationWarning` 控制（`off`、`once`、`always`；默认：`once`）。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截此步骤，以变更或替换注入的引导文件（例如将 `SOUL.md` 替换为备用人格设定）。

如果你想让智能体听起来不那么通用，可以从 [SOUL.md Personality Guide](/zh-CN/concepts/soul) 开始。

要检查每个注入文件贡献了多少内容（原始内容与注入内容、截断情况以及工具 schema 开销），可使用 `/context list` 或 `/context detail`。参见 [Context](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示词会包含专门的 **当前日期和时间** 部分。为了保持提示词缓存稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，请使用 `session_status`；状态卡片中包含时间戳行。该工具也可以选择设置每个会话的模型覆盖（`model=default` 会清除此覆盖）。

可通过以下项配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为细节请参见 [Date & Time](/zh-CN/date-time)。

## Skills

当存在符合条件的技能时，OpenClaw 会注入一个紧凑的**可用技能列表**（`formatSkillsForPrompt`），其中包含每个技能的**文件路径**。提示词会指示模型使用 `read` 加载列出位置中的 `SKILL.md`（工作区、托管或内置）。如果没有符合条件的技能，则省略 Skills 部分。

资格条件包括技能元数据门控、运行时环境/配置检查，以及在配置 `agents.defaults.skills` 或 `agents.list[].skills` 时生效的智能体技能允许列表。

插件内置的技能只有在其所属插件启用时才符合条件。这样，工具插件就可以暴露更深入的操作指南，而无需将所有这些指导直接嵌入每个工具描述中。

```text
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这样可以在保持基础提示词较小的同时，仍然支持有针对性的技能使用。

技能列表的预算由技能子系统负责：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 每个智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用的是不同的接口：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分使技能大小控制与运行时读取/注入大小控制分离开来，例如 `memory_get`、实时工具结果以及压缩后的 `AGENTS.md` 刷新。

## 文档

系统提示词包含一个**文档**部分。当本地文档可用时，它会指向本地 OpenClaw 文档目录（Git 检出中的 `docs/`，或内置的 npm 包文档）。如果本地文档不可用，则回退到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一部分还包含 OpenClaw 源码位置。Git 检出会暴露本地源码根目录，以便智能体可以直接检查代码。包安装则包含 GitHub 源码 URL，并告诉智能体在文档不完整或过时时前往那里查看源码。提示词还会注明公开文档镜像、社区 Discord 和 ClawHub（[https://clawhub.ai](https://clawhub.ai)）用于 Skills 发现。它会告诉模型，对于 OpenClaw 行为、命令、配置或架构，应优先查阅文档，并尽可能自行运行 `openclaw status`（仅在缺乏访问权限时才询问用户）。

## 相关内容

- [智能体运行时](/zh-CN/concepts/agent)
- [智能体工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
