---
read_when:
    - 编辑系统提示文本、工具列表或时间/心跳部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示包含哪些内容，以及它是如何组装的
title: 系统提示
x-i18n:
    generated_at: "2026-04-23T22:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw 会为每次智能体运行构建一个自定义系统提示。该提示**由 OpenClaw 持有**，不使用 pi-coding-agent 的默认提示。

该提示由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以贡献具备缓存感知能力的提示指导，而无需替换完整的、由 OpenClaw 持有的提示。提供商运行时可以：

- 替换一小组具名核心部分（`interaction_style`、`tool_call_style`、`execution_bias`）
- 在提示缓存边界之上注入一个**稳定前缀**
- 在提示缓存边界之下注入一个**动态后缀**

对于特定模型家族的调优，请使用提供商持有的贡献。保留旧版 `before_prompt_build` 提示变更机制用于兼容性需求或真正的全局提示变更，而不是普通的提供商行为。

OpenAI GPT-5 系列覆盖层保持核心执行规则简洁，并添加了模型特定指导，包括角色锁定、简洁输出、工具纪律、并行查找、交付物覆盖、验证、缺失上下文以及终端工具使用规范。

## 结构

该提示刻意保持紧凑，并使用固定部分：

- **工具**：结构化工具的事实来源提醒，以及运行时工具使用指导。
- **执行倾向**：紧凑的贯彻执行指导：对可执行请求在当前轮次采取行动、持续直到完成或受阻、从较差的工具结果中恢复、实时检查可变状态，并在结束前验证。
- **安全**：简短的护栏提醒，避免寻求权力行为或绕过监督。
- **Skills**（可用时）：告诉模型如何按需加载 skill 指令。
- **OpenClaw 自更新**：如何使用 `config.schema.lookup` 安全地检查配置，使用 `config.patch` 修补配置，使用 `config.apply` 替换完整配置，以及仅在用户明确请求时运行 `update.run`。仅所有者可用的 `gateway` 工具也会拒绝重写 `tools.exec.ask` / `tools.exec.security`，包括会规范化为这些受保护 exec 路径的旧版 `tools.bash.*` 别名。
- **工作区**：工作目录（`agents.defaults.workspace`）。
- **文档**：OpenClaw 文档的本地路径（仓库或 npm 包）以及何时阅读它们。
- **工作区文件（已注入）**：表示引导文件包含在下方。
- **沙箱**（启用时）：表示沙箱隔离运行时、沙箱路径，以及是否提供提权 exec。
- **当前日期和时间**：用户本地时间、时区和时间格式。
- **回复标签**：受支持提供商的可选回复标签语法。
- **心跳**：心跳提示和确认行为，在默认智能体启用心跳时显示。
- **运行时**：主机、OS、node、模型、仓库根目录（检测到时）、思考级别（一行）。
- **推理**：当前可见性级别 + `/reasoning` 切换提示。

“工具”部分还包含针对长时间运行任务的运行时指导：

- 对于未来的后续跟进（“稍后再查看”、提醒、周期性工作），使用 cron，而不是 `exec` sleep 循环、`yieldMs` 延迟技巧或重复的 `process` 轮询
- 仅将 `exec` / `process` 用于那些现在启动并会在后台继续运行的命令
- 当启用了自动完成唤醒时，只启动一次命令，并依赖它输出内容或失败时的推送式唤醒路径
- 当你需要检查运行中命令的日志、状态、输入或进行干预时，使用 `process`
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是推送式的，并会自动回报给请求者
- 不要仅为了等待完成而循环轮询 `subagents list` / `sessions_list`

当启用实验性的 `update_plan` 工具时，“工具”部分还会告诉模型：仅将其用于非平凡的多步骤工作，始终只保留一个 `in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示中的安全护栏是建议性的。它们用于引导模型行为，但不强制执行策略。若要进行硬性约束，请使用工具策略、exec 审批、沙箱隔离和渠道 allowlist；按设计，操作者可以禁用这些机制。

在具有原生审批卡片/按钮的渠道上，运行时提示现在会告诉智能体优先依赖该原生审批 UI。只有当工具结果表明聊天审批不可用，或手动审批是唯一途径时，它才应包含手动 `/approve` 命令。

## 提示模式

OpenClaw 可以为子智能体渲染更小的系统提示。运行时会为每次运行设置一个 `promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上述所有部分。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、**Messaging**、**Silent Replies** 和 **Heartbeats**。工具、**安全**、工作区、沙箱、当前日期和时间（已知时）、运行时和注入的上下文仍然可用。
- `none`：只返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示会标记为**子智能体上下文**，而不是**群聊上下文**。

## 工作区引导注入

引导文件会被裁剪，并附加在 **Project Context** 下方，这样模型无需显式读取就能看到身份和配置上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新工作区中）
- 存在时的 `MEMORY.md`

除非某个文件有特定门控，否则这些文件都会在每一轮**注入到上下文窗口中**。当默认智能体禁用了心跳，或 `agents.defaults.heartbeat.includeSystemPromptSection` 为 false 时，`HEARTBEAT.md` 会在普通运行中被省略。请保持注入文件简洁 —— 尤其是 `MEMORY.md`，它会随时间增长，并可能导致上下文使用量意外增高以及更频繁的压缩。

> **注意：** `memory/*.md` 每日文件**不属于**普通引导 Project Context 的一部分。在常规轮次中，它们会按需通过 `memory_search` 和 `memory_get` 工具访问，因此除非模型显式读取，否则不会占用上下文窗口。纯 `/new` 和 `/reset` 轮次是例外：运行时可以在首轮前附加最近的每日记忆，作为一次性启动上下文块。

大文件会被截断并附加标记。每个文件的最大大小由 `agents.defaults.bootstrapMaxChars` 控制（默认：12000）。跨文件注入的引导内容总量上限由 `agents.defaults.bootstrapTotalMaxChars` 控制（默认：60000）。缺失文件会注入一个简短的缺失文件标记。发生截断时，OpenClaw 可以在 Project Context 中注入一个警告块；可通过 `agents.defaults.bootstrapPromptTruncationWarning` 控制（`off`、`once`、`always`；默认：`once`）。

子智能体会话只注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件会被过滤掉，以保持子智能体上下文较小）。

内部 hook 可以通过 `agent:bootstrap` 拦截此步骤，以变更或替换注入的引导文件（例如将 `SOUL.md` 替换为另一种角色设定）。

如果你想让智能体听起来不那么通用，可以从 [SOUL.md Personality Guide](/zh-CN/concepts/soul) 开始。

要检查每个注入文件贡献了多少内容（原始值与注入值、截断情况以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见 [上下文](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示会包含一个专门的**当前日期和时间**部分。为了保持提示缓存稳定，它现在只包含**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，请使用 `session_status`；状态卡片中包含时间戳行。该工具还可以选择设置按会话生效的模型覆盖（`model=default` 可清除覆盖）。

配置项：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为细节请参见 [日期和时间](/zh-CN/date-time)。

## Skills

当存在符合条件的 skill 时，OpenClaw 会注入一个紧凑的**可用 skills 列表**（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。提示会指示模型使用 `read` 加载所列位置的 `SKILL.md`（工作区、托管或内置）。如果没有符合条件的 skill，则省略 Skills 部分。

符合条件的判断包括 skill 元数据门控、运行时环境/配置检查，以及配置了 `agents.defaults.skills` 或 `agents.list[].skills` 时的有效智能体 skill allowlist。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这样既能保持基础提示较小，又能启用有针对性的 skill 使用。

skills 列表预算由 skills 子系统负责：

- 全局默认值：`skills.limits.maxSkillsPromptChars`
- 按智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用另一套能力面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种拆分使 skills 大小控制与运行时读取/注入大小控制分离，例如 `memory_get`、实时工具结果，以及压缩后对 `AGENTS.md` 的刷新。

## 文档

可用时，系统提示会包含一个**文档**部分，指向本地 OpenClaw 文档目录（仓库工作区中的 `docs/` 或 npm 包内置文档），并说明公共镜像、源代码仓库、社区 Discord，以及用于发现 Skills 的 ClawHub（[https://clawhub.ai](https://clawhub.ai)）。提示会指示模型在处理 OpenClaw 行为、命令、配置或架构时优先查阅本地文档，并在可能时自行运行 `openclaw status`（只有在没有访问权限时才询问用户）。

## 相关

- [智能体运行时](/zh-CN/concepts/agent)
- [智能体工作区](/zh-CN/concepts/agent-workspace)
- [上下文引擎](/zh-CN/concepts/context-engine)
