---
read_when:
    - 编辑系统提示文本、工具列表或时间/heartbeat 部分
    - 更改工作区引导或 Skills 注入行为
summary: OpenClaw 系统提示包含什么，以及它是如何组装的
title: 系统提示
x-i18n:
    generated_at: "2026-04-23T20:47:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fb6d12441ac50fdbb7b67730e7a7342b72decb22743276c65eb6365cd22b9f
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw 会为每次智能体运行构建一个自定义系统提示。该提示**由 OpenClaw 拥有**，不会使用 pi-coding-agent 的默认提示。

系统提示由 OpenClaw 组装，并注入到每次智能体运行中。

提供商插件可以贡献具备缓存感知能力的提示指导，而无需替换
完整的 OpenClaw 自有提示。提供商运行时可以：

- 替换一小组具名核心段落（`interaction_style`、
  `tool_call_style`、`execution_bias`）
- 在提示缓存边界上方注入一个**稳定前缀**
- 在提示缓存边界下方注入一个**动态后缀**

对于特定模型家族的调优，请使用提供商自有的贡献方式。旧版的
`before_prompt_build` 提示变异应保留用于兼容性或真正的全局提示修改，
而不是普通的提供商行为。

OpenAI GPT-5 家族 overlay 会保持核心执行规则精简，并添加
模型专用指导，用于处理 persona 锁定、简洁输出、工具纪律、
并行查找、交付物覆盖、验证、缺失上下文和终端工具卫生。

## 结构

该提示有意保持精简，并使用固定段落：

- **Tooling**：结构化工具的事实来源提醒，以及运行时工具使用指导。
- **Execution Bias**：紧凑的后续执行指导：对可执行请求在当前轮次内行动、
  持续执行直到完成或被阻塞、从较弱的工具结果中恢复、
  实时检查可变状态，并在最终完成前进行验证。
- **Safety**：简短的护栏提醒，避免权力寻求行为或绕过监督。
- **Skills**（当可用时）：告诉模型如何按需加载 skill 指令。
- **OpenClaw Self-Update**：如何安全地使用
  `config.schema.lookup` 检查配置、使用 `config.patch` 修补配置、使用 `config.apply` 替换完整配置，以及仅在用户明确请求时运行 `update.run`。
  仅限 owner 的 `gateway` 工具也会拒绝重写
  `tools.exec.ask` / `tools.exec.security`，包括会规范化到这些受保护 exec 路径的旧版 `tools.bash.*`
  别名。
- **Workspace**：工作目录（`agents.defaults.workspace`）。
- **Documentation**：OpenClaw 文档的本地路径（仓库或 npm package）以及何时读取它们。
- **Workspace Files（已注入）**：表示引导文件已包含在下方。
- **Sandbox**（启用时）：表示启用了沙箱隔离运行时、沙箱路径，以及是否可使用提升权限的 exec。
- **Current Date & Time**：用户本地时间、时区和时间格式。
- **Reply Tags**：面向受支持提供商的可选回复标签语法。
- **Heartbeats**：heartbeat 提示和确认行为，在默认智能体启用 heartbeat 时显示。
- **Runtime**：主机、操作系统、node、模型、仓库根目录（若检测到）、思考级别（一行）。
- **Reasoning**：当前可见性级别 + `/reasoning` 切换提示。

Tooling 段还包括针对长时间运行任务的运行时指导：

- 对未来的后续操作（`check back later`、提醒、循环任务）
  使用 cron，而不是 `exec` 睡眠循环、`yieldMs` 延迟技巧，或重复的 `process`
  轮询
- 仅对现在就开始并在后台继续运行的命令使用 `exec` / `process`
- 当启用了自动完成唤醒时，只启动命令一次，并在它输出或失败时依赖
  基于推送的唤醒路径
- 当你需要检查正在运行的命令时，使用 `process` 查看日志、状态、输入或进行干预
- 如果任务更大，优先使用 `sessions_spawn`；子智能体完成是
  基于推送的，并会自动回告给请求方
- 不要为了等待完成而循环轮询 `subagents list` / `sessions_list`

当启用了实验性的 `update_plan` 工具时，Tooling 还会告知模型：
仅在非平凡的多步骤工作中使用它，始终只保留一个
`in_progress` 步骤，并避免在每次更新后重复整个计划。

系统提示中的安全护栏属于建议性内容。它们会引导模型行为，但不构成强制策略。若要实现硬性约束，请使用工具策略、exec approval、沙箱隔离和渠道允许列表；按设计，操作员可以禁用这些机制。

在具有原生 approval 卡片/按钮的渠道上，运行时提示现在会告知
智能体优先依赖该原生 approval UI。只有在工具结果表明聊天审批不可用，
或手动审批是唯一途径时，它才应包含手动 `/approve` 命令。

## 提示模式

OpenClaw 可以为子智能体渲染更小的系统提示。运行时会为每次运行设置一个
`promptMode`（不是面向用户的配置）：

- `full`（默认）：包含上面的所有段落。
- `minimal`：用于子智能体；省略 **Skills**、**Memory Recall**、**OpenClaw
  Self-Update**、**Model Aliases**、**User Identity**、**Reply Tags**、
  **Messaging**、**Silent Replies** 和 **Heartbeats**。Tooling、**Safety**、
  Workspace、Sandbox、Current Date & Time（已知时）、Runtime，以及注入的
  上下文仍然可用。
- `none`：仅返回基础身份行。

当 `promptMode=minimal` 时，额外注入的提示会标记为 **Subagent
Context**，而不是 **Group Chat Context**。

## 工作区引导注入

引导文件会被裁剪后追加到 **Project Context** 下方，这样模型无需显式读取即可看到身份和 profile 上下文：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（仅在全新的工作区中）
- `MEMORY.md`（如果存在）

除非适用某个文件专用门禁，否则这些文件都会在每次轮次中
**注入到上下文窗口**。在以下情况下，正常运行中会省略 `HEARTBEAT.md`：
默认智能体禁用了 heartbeat，或
`agents.defaults.heartbeat.includeSystemPromptSection` 为 false。请保持已注入
文件简洁——尤其是 `MEMORY.md`，它会随时间增长，并可能导致上下文使用量意外升高以及更频繁的压缩。

> **注意：** `memory/*.md` 的每日文件**不属于**常规引导
> Project Context。在普通轮次中，它们会按需通过
> `memory_search` 和 `memory_get` 工具访问，因此除非模型显式读取它们，否则不会计入
> 上下文窗口。裸 `/new` 和 `/reset` 轮次是例外：运行时可以将最近的每日记忆
> 作为一次性的启动上下文块预置到第一次轮次中。

大文件会被截断，并带有一个标记。每个文件的最大大小由
`agents.defaults.bootstrapMaxChars` 控制（默认：12000）。跨文件的引导注入总内容
受 `agents.defaults.bootstrapTotalMaxChars`
限制（默认：60000）。缺失文件会注入一个简短的缺失文件标记。当发生截断时，
OpenClaw 可以在 Project Context 中注入一条警告块；可通过
`agents.defaults.bootstrapPromptTruncationWarning` 控制（`off`、`once`、`always`；
默认：`once`）。

子智能体会话只会注入 `AGENTS.md` 和 `TOOLS.md`（其他引导文件
会被过滤掉，以保持子智能体上下文精简）。

内部 hook 可以通过 `agent:bootstrap` 拦截此步骤，以变更或替换
注入的引导文件（例如将 `SOUL.md` 替换为另一个 persona）。

如果你想让智能体听起来不那么通用，可以从
[SOUL.md Personality Guide](/zh-CN/concepts/soul) 开始。

若要检查每个注入文件贡献了多少内容（原始大小 vs 注入大小、截断情况，以及工具 schema 开销），请使用 `/context list` 或 `/context detail`。参见 [Context](/zh-CN/concepts/context)。

## 时间处理

当已知用户时区时，系统提示会包含一个专门的 **Current Date & Time** 段。
为保持提示缓存稳定，它现在只包含
**时区**（不包含动态时钟或时间格式）。

当智能体需要当前时间时，请使用 `session_status`；该状态卡
包含一行时间戳。该工具还可以选择设置按会话的模型
覆盖（`model=default` 会清除它）。

配置方式：

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat`（`auto` | `12` | `24`）

完整行为细节请参见 [Date & Time](/zh-CN/date-time)。

## Skills

当存在符合条件的 skill 时，OpenClaw 会注入一个紧凑的**可用 Skills 列表**
（`formatSkillsForPrompt`），其中包含每个 skill 的**文件路径**。该
提示会指示模型使用 `read` 在列出的路径（工作区、托管或内置）加载 SKILL.md。
如果没有符合条件的 skill，则省略 Skills 段。

符合条件的判断包括 skill 元数据门禁、运行时环境/配置检查，
以及在配置了 `agents.defaults.skills` 或
`agents.list[].skills` 时的有效智能体 skill 允许列表。

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

这样既能保持基础提示精简，同时仍支持有针对性的 skill 使用。

Skills 列表预算由 Skills 子系统负责：

- 全局默认：`skills.limits.maxSkillsPromptChars`
- 按智能体覆盖：`agents.list[].skillsLimits.maxSkillsPromptChars`

通用的有界运行时摘录使用不同的表面：

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

这种划分使 Skills 尺寸控制独立于运行时读取/注入尺寸控制，例如
`memory_get`、实时工具结果和压缩后 AGENTS.md 刷新等。

## Documentation

在可用时，系统提示会包含一个 **Documentation** 段，用于指向
本地 OpenClaw 文档目录（仓库工作区中的 `docs/` 或内置 npm
package 文档），并同时说明公共镜像、源码仓库、社区 Discord，以及用于 Skills 发现的
ClawHub（[https://clawhub.ai](https://clawhub.ai)）。提示会指示模型优先查阅本地文档，
以了解 OpenClaw 的行为、命令、配置或架构，并在可能时自行运行
`openclaw status`（只有在没有访问权限时才询问用户）。
