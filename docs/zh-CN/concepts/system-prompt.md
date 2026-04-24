---
read_when:
    - 编辑系统提示词文本、工具列表或时间/心跳部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含什么，以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-04-24T23:30:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83d9cc69fff164ba52d1fc1a9b04ea799f48dbd8b449bde63473c6dec4cb026a
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw 会为每次智能体运行构建一个自定义系统提示词。该提示词由 **OpenClaw 拥有**，不使用 pi-coding-agent 的默认提示词。

系统提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以贡献具备缓存感知能力的提示词指导，而无需替换完整的 OpenClaw 自有提示词。提供商运行时可以：

- 替换一小组具名核心部分（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在提示词缓存边界上方注入一个**稳定前缀**
- 在提示词缓存边界下方注入一个**动态后缀**

对于特定模型家族的调优，请使用由提供商拥有的贡献。保留旧版 `before_prompt_build` 提示词变更方式，仅用于兼容性或真正的全局提示词更改，而不是常规的提供商行为。

OpenAI GPT-5 系列覆盖层会保持核心执行规则简短，同时添加特定于模型的指导，涵盖人格锁定、简洁输出、工具使用纪律、并行查找、交付物覆盖、验证、缺失上下文以及终端工具使用规范。

## 结构

该提示词刻意保持紧凑，并使用固定部分：

- **工具使用**：结构化工具的事实来源提醒，以及运行时工具使用指导。
- **执行偏向**：紧凑的持续推进指导：对可执行请求在当前轮次内采取行动，持续直到完成或被阻塞，从较弱的工具结果中恢复，实时检查可变状态，并在最终完成前进行验证。
- **安全**：简短的护栏提醒，避免追求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载 skill 指令。
- **OpenClaw 自更新**：如何使用 `config.schema.lookup` 安全检查配置，使用 `config.patch` 修补配置，使用 `config.apply` 替换完整配置，以及仅在用户明确请求时运行 `update.run`。仅限所有者使用的 `gateway` 工具还会拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括会规范化到这些受保护 exec 路径的旧版 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时应阅读它们。
- **工作区文件（已注入）**：表示引导文件包含在下方。
- **沙箱**（启用时）：表示运行时处于沙箱隔离状态、沙箱路径，以及是否可使用提升权限的 exec。
- **当前日期与时间**：用户本地时间、时区和时间格式。
- **回复标签**：受支持提供商的可选回复标签语法。
- **心跳**：心跳提示词和确认行为，当默认智能体启用心跳时显示。
- **运行时**：主机、操作系统、 Node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **推理**：当前可见性级别 + `/reasoning` 切换提示。

“工具使用”部分还包含针对长时间运行工作的运行时指导：

- 对于未来的后续跟进（`check back later`、提醒、周期性工作），使用 cron，而不是使用 `exec` 睡眠循环、`yieldMs` 延迟技巧或重复轮询 `process`
- 仅将 `exec` / `process` 用于那些现在启动并继续在后台运行的命令
- 启用自动完成唤醒时，只启动命令一次，并在其输出结果或失败时依赖基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成采用基于推送的方式，并会自动回告给请求方
- 不要仅为了等待完成而循环轮询 `subagents list` / `sessions_list`

当实验性的 `update_plan` 工具启用时，“工具使用”部分还会告诉模型：仅将其用于非平凡的多步骤工作，始终保持恰好一个 `in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示词中的安全护栏属于建议性内容。它们指导模型行为，但不强制执行策略。要实现硬性约束，请使用工具策略、exec 审批、沙箱隔离和渠道允许列表；根据设计，运营者可以禁用这些机制。

在具有原生审批卡片/按钮的渠道上，运行时提示词现在会告诉智能体优先依赖该原生审批 UI。只有当工具结果表明聊天审批不可用，或手动审批是唯一途径时，才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置一个 `promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上面的所有部分。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw 自更新**、**模型别名**、**用户身份**、**回复标签**、**消息传递**、**静默回复** 和 **心跳**。工具使用、**安全**、工作区、沙箱、当前日期与时间（已知时）、运行时和注入的上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为 **子智能体上下文**，而不是 **群聊上下文**。

## 工作区引导注入

引导文件会被裁剪并追加到 **项目上下文** 下，从而让模型无需显式读取即可看到身份和配置档案上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新工作区中）
- 存在时的 `MEMORY.md`

除非适用特定文件的门控条件，否则这些文件都会在每一轮**注入到上下文窗口中**。在正常运行中，如果默认智能体禁用了心跳，或 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false，则会省略 `HEARTBEAT.md`。请保持注入文件简洁——尤其是 `MEMORY.md`，它会随着时间增长，并可能导致上下文使用量意外升高以及更频繁的压缩。

> **注意：** `memory/*.md` 每日文件**不是**普通引导项目上下文的一部分。在常规轮次中，它们通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取它们，否则不会计入上下文窗口。纯 `/new` 和 `/reset` 轮次是例外：运行时可以将最近的每日记忆作为一次性启动上下文块预置到第一轮中。

大文件会使用标记进行截断。每个文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（默认值：12000）。跨文件注入的引导内容总量上限由 `agents.defaults.bootstrapTotalMaxChars` 控制（默认值：60000）。缺失文件会注入一个简短的缺失文件标记。发生截断时，OpenClaw 可以在项目上下文中注入一个警告块；可通过 `agents.defaults.bootstrapPromptTruncationWarning` 控制（`off`、`once`、`always`；默认值：`once`）。

子智能体会话仅注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截这一步，以变更或替换注入的引导文件（例如将 `SOUL.md` 替换为其他 persona）。

如果你想让智能体听起来没那么通用，可以从 [SOUL.md Personality Guide](/zh-CN/concepts/soul) 开始。

要检查每个注入文件贡献了多少内容（原始大小与注入后大小、截断情况，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见 [Context](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示词会包含专门的 **当前日期与时间** 部分。为了保持提示词缓存稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，请使用 `session_status`；状态卡中包含一行时间戳。相同工具还可以选择设置每个会话的模型覆盖（`model=default` 会清除它）。

使用以下配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为细节请参见 [Date & Time](/zh-CN/date-time)。

## Skills

当存在符合条件的 skill 时，OpenClaw 会注入一个紧凑的**可用 skills 列表**（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。提示词会指示模型使用 `read` 加载列出位置中的 SKILL.md（工作区、托管或内置）。如果没有符合条件的 skill，则省略 Skills 部分。

是否符合条件取决于 skill 元数据门控、运行时环境/配置检查，以及在配置了 `agents.defaults.skills` 或 `agents.list[].skills` 时的有效智能体 skill 允许列表。

插件内置的 skill 仅在其所属插件已启用时才符合条件。这样，工具插件就可以暴露更深入的操作指南，而无需将所有这些指导直接嵌入到每个工具描述中。

```text
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这样可以保持基础提示词较小，同时仍支持有针对性的 skill 使用。

skills 列表预算由 skills 子系统负责：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 每个智能体的覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用不同的配置面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分使 skills 的大小控制与运行时读取/注入大小控制相分离，例如 `memory_get`、实时工具结果以及压缩后的 `AGENTS.md` 刷新。

## 文档

可用时，系统提示词会包含一个 **文档** 部分，指向本地 OpenClaw 文档目录（仓库工作区中的 `docs/` 或内置的 npm 包文档），并且还会说明公开镜像、源代码仓库、社区 Discord 以及用于发现 skill 的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。提示词会指示模型在处理 OpenClaw 行为、命令、配置或架构时优先查阅本地文档，并在可能时自行运行 `openclaw status`（只有在无法访问时才询问用户）。

## 相关内容

- [智能体运行时](/zh-CN/concepts/agent)
- [智能体工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
