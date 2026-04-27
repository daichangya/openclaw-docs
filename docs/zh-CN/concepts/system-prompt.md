---
read_when:
    - 编辑系统提示词文本、工具列表或时间/心跳部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示词包含什么，以及它是如何组装的
title: 系统提示词
x-i18n:
    generated_at: "2026-04-27T06:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1cc4cc47f5c694e84190b0aa0a6c097cbdb647c4ed51c0271666527f488314e
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw 会为每次智能体运行构建一个自定义系统提示词。该提示词**由 OpenClaw 拥有**，不会使用 pi-coding-agent 的默认提示词。

提示词由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以提供具备缓存感知能力的提示词指导，而无需替换完整的 OpenClaw 自有提示词。提供商运行时可以：

- 替换一小组具名核心部分（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在提示词缓存边界之上注入一个**稳定前缀**
- 在提示词缓存边界之下注入一个**动态后缀**

将提供商自有贡献用于按模型家族进行特定调优。保留旧版 `before_prompt_build` 提示词变更机制，用于兼容性场景或真正的全局提示词变更，而不是常规提供商行为。

OpenAI GPT-5 系列叠加层保持核心执行规则简洁，并增加了针对模型的指导，涵盖人格锁定、简洁输出、工具纪律、并行查找、交付物覆盖、验证、缺失上下文以及终端工具使用规范。

## 结构

该提示词有意保持紧凑，并使用固定部分：

- **工具**：结构化工具事实来源提醒，以及运行时工具使用指导。
- **执行倾向**：简洁的跟进式指导：对可执行请求在当前轮次中直接采取行动，持续执行直到完成或被阻塞，从较弱的工具结果中恢复，实时检查可变状态，并在最终提交前进行验证。
- **安全**：简短的护栏提醒，避免追求权力的行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载 skill 指令。
- **OpenClaw 自更新**：如何使用 `config.schema.lookup` 安全检查配置，使用 `config.patch` 修补配置，使用 `config.apply` 替换完整配置，以及仅在用户明确请求时运行 `update.run`。仅限所有者使用的 `gateway` 工具也会拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括会归一化到这些受保护 exec 路径的旧版 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时阅读它们。
- **工作区文件（已注入）**：表示下方已包含引导文件。
- **沙箱**（启用时）：表示运行时处于沙箱隔离中、沙箱路径以及是否可使用提权 exec。
- **当前日期和时间**：用户本地时间、时区和时间格式。
- **回复标签**：适用于受支持提供商的可选回复标签语法。
- **心跳**：当默认智能体启用心跳时的心跳提示和 ack 行为。
- **运行时**：主机、操作系统、node、模型、仓库根目录（若检测到）、思考等级（一行）。
- **推理**：当前可见性级别 + `/reasoning` 切换提示。

“工具”部分还包含针对长时间运行工作的运行时指导：

- 对未来的后续跟进（`check back later`、提醒、周期性工作）使用 cron，而不是使用 `exec` 睡眠循环、`yieldMs` 延迟技巧或重复 `process` 轮询
- 仅将 `exec` / `process` 用于立即启动并继续在后台运行的命令
- 当启用了自动完成唤醒时，只启动命令一次，并依赖基于推送的唤醒路径，在其输出内容或失败时触发
- 当你需要检查运行中命令的日志、状态、输入或进行干预时，使用 `process`
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成采用基于推送的方式，并会自动向请求方回报
- 不要为了等待完成而循环轮询 `subagents list` / `sessions_list`

启用实验性 `update_plan` 工具时，“工具”部分还会告诉模型：仅将其用于非平凡的多步骤工作，始终保持且仅保持一个 `in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示词中的安全护栏是建议性的。它们用于引导模型行为，但不会强制执行策略。若要实现硬性约束，请使用工具策略、exec 审批、沙箱隔离和渠道 allowlist；按设计，操作员可以禁用这些机制。

在具有原生审批卡片/按钮的渠道中，运行时提示词现在会告诉智能体优先依赖该原生审批 UI。只有当工具结果表明聊天审批不可用，或者手动审批是唯一途径时，它才应包含手动 `/approve` 命令。

## 提示词模式

OpenClaw 可以为子智能体渲染更小的系统提示词。运行时会为每次运行设置一个 `promptMode`（不是面向用户的配置）：

- `full`（默认）：包含以上所有部分。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw 自更新**、**模型别名**、**用户身份**、**回复标签**、**消息传递**、**静默回复** 和 **心跳**。工具、**安全**、工作区、沙箱、当前日期和时间（若已知）、运行时以及注入的上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示词会标记为 **子智能体上下文**，而不是 **群聊上下文**。

## 工作区引导注入

引导文件会被裁剪，并追加到 **项目上下文** 下，因此模型无需显式读取即可看到身份和 profile 上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新工作区中）
- 存在时的 `MEMORY.md`

除非适用文件级门控，否则这些文件中的所有内容都会在每一轮**注入到上下文窗口中**。当默认智能体禁用心跳，或者 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，正常运行不会注入 `HEARTBEAT.md`。请保持注入文件简洁——尤其是 `MEMORY.md`，它会随着时间增长，并可能导致上下文使用量意外升高以及更频繁的压缩。

<Note>
`memory/*.md` 每日文件**不属于**常规引导项目上下文的一部分。在普通轮次中，它们通过 `memory_search` 和 `memory_get` 工具按需访问，因此除非模型显式读取，否则不会占用上下文窗口。纯 `/new` 和 `/reset` 轮次是例外：运行时可以在第一轮将最近的每日记忆作为一次性启动上下文块预置到前面。
</Note>

大文件会带标记进行截断。每个文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（默认：12000）。跨文件注入的引导内容总量上限由 `agents.defaults.bootstrapTotalMaxChars` 控制（默认：60000）。缺失文件会注入一个简短的缺失文件标记。发生截断时，OpenClaw 可以在项目上下文中注入一个警告块；可通过 `agents.defaults.bootstrapPromptTruncationWarning` 控制（`off`、`once`、`always`；默认：`once`）。

子智能体会话仅注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件会被过滤掉，以保持子智能体上下文较小）。

内部钩子可以通过 `agent:bootstrap` 拦截此步骤，以变更或替换注入的引导文件（例如将 `SOUL.md` 替换为其他 persona）。

如果你想让智能体听起来不那么通用，请先从 [SOUL.md Personality Guide](/zh-CN/concepts/soul) 开始。

若要检查每个注入文件带来的上下文占用（原始大小与注入后大小、截断情况以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见 [Context](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示词会包含一个专门的 **当前日期和时间** 部分。为了保持提示词缓存稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，请使用 `session_status`；状态卡中包含时间戳行。该工具还可以选择性地设置会话级模型覆盖（`model=default` 会清除该覆盖）。

使用以下配置：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为细节参见 [Date & Time](/zh-CN/date-time)。

## Skills

当存在符合条件的 skill 时，OpenClaw 会注入一个紧凑的**可用 skills 列表**（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。提示词会指示模型使用 `read` 加载列出位置中的 SKILL.md（工作区、托管或内置）。如果没有符合条件的 skill，则省略 Skills 部分。

资格条件包括 skill 元数据门控、运行时环境/配置检查，以及配置了 `agents.defaults.skills` 或 `agents.list[].skills` 时生效的智能体 skills allowlist。

插件内置的 skill 仅在其所属插件启用时才符合条件。这样，工具插件就可以暴露更深入的操作指南，而无需将所有这些指导直接嵌入到每个工具描述中。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这使基础提示词保持较小，同时仍能支持有针对性的 skill 使用。

skills 列表预算由 skills 子系统负责：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 按智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用不同的配置面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分将 skills 的大小控制与运行时读取/注入大小分开，例如 `memory_get`、实时工具结果以及压缩后的 `AGENTS.md` 刷新。

## 文档

系统提示词包含一个**文档**部分。当本地文档可用时，它会指向本地 OpenClaw 文档目录（Git 检出中的 `docs/` 或内置 npm 包文档）。如果本地文档不可用，则回退到 [https://docs.openclaw.ai](https://docs.openclaw.ai)。

同一部分还包含 OpenClaw 源码位置。Git 检出会暴露本地源码根目录，以便智能体直接检查代码。包安装则包含 GitHub 源码 URL，并告诉智能体在文档不完整或已过时时去那里查看源码。提示词还会注明公开文档镜像、社区 Discord，以及用于发现技能的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。它会告诉模型：对于 OpenClaw 的行为、命令、配置或架构，应优先查阅文档；并在可能时自行运行 `openclaw status`（仅在无法访问时才询问用户）。对于配置，它会特别引导智能体先使用 `gateway` 工具动作 `config.schema.lookup` 获取精确的字段级文档和约束，然后查看 `docs/gateway/configuration.md` 和 `docs/gateway/configuration-reference.md` 以获得更广泛的指导。

## 相关

- [Agent runtime](/zh-CN/concepts/agent)
- [Agent workspace](/zh-CN/concepts/agent-workspace)
- [Context engine](/zh-CN/concepts/context-engine)
