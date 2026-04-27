---
read_when:
    - 你需要调试会话 id、transcript JSONL 或 sessions.json 字段
    - 你正在更改自动压缩行为或添加“压缩前”清理逻辑
    - 你想实现 memory 刷新或静默系统轮次
summary: 深入解析：会话存储 + transcript、生命周期以及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-04-27T06:06:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: bde684cc753013f0ac2b6cdaf9e826179fb8e5550fd77c814e4dbd59550510bc
    source_path: reference/session-management-compaction.md
    workflow: 15
---

OpenClaw 在以下这些方面端到端地管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **Transcript 持久化**（`*.jsonl`）及其结构
- **Transcript 清理**（运行前按提供商执行的修正）
- **上下文限制**（上下文窗口与跟踪 token 的区别）
- **压缩**（手动和自动压缩）以及应在何处挂接压缩前工作
- **静默清理**（不应产生用户可见输出的 memory 写入）

如果你想先看更高层概览，请从以下内容开始：

- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [Memory 概览](/zh-CN/concepts/memory)
- [Memory 搜索](/zh-CN/concepts/memory-search)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [Transcript 清理](/zh-CN/reference/transcript-hygiene)

---

## 事实来源：Gateway 网关

OpenClaw 的设计围绕一个拥有会话状态的单一 **Gateway 网关进程**。

- UI（macOS 应用、Web Control UI、TUI）应通过查询 Gateway 网关来获取会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机上；“检查你本地 Mac 上的文件”并不能反映 Gateway 网关实际使用的内容。

---

## 两层持久化

OpenClaw 通过两层来持久化会话：

1. **会话存储（`sessions.json`）**
   - 键值映射：`sessionKey -> SessionEntry`
   - 小型、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 id、最后活动时间、开关、token 计数器等）

2. **Transcript（`<sessionId>.jsonl`）**
   - 带树形结构的仅追加 transcript（条目有 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为未来轮次重建模型上下文

---

## 磁盘位置

在 Gateway 网关主机上，按智能体区分：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram topic 会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护和磁盘控制

会话持久化为 `sessions.json` 和 transcript 工件提供自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：过期条目年龄截止时间（默认 `30d`）
- `maxEntries`：`sessions.json` 中的条目上限（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时进行轮换（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` transcript 归档的保留时间（默认：与 `pruneAfter` 相同；`false` 禁用清理）
- `maxDiskBytes`：可选的 sessions 目录预算
- `highWaterBytes`：清理后的可选目标值（默认是 `maxDiskBytes` 的 `80%`）

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先删除最旧的已归档或孤立 transcript 工件。
2. 如果仍高于目标值，则驱逐最旧的会话条目及其 transcript 文件。
3. 持续执行，直到使用量小于等于 `highWaterBytes`。

在 `mode: "warn"` 下，OpenClaw 会报告潜在驱逐项，但不会修改存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 cron 运行也会创建会话条目/transcript，并具有专用保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中清理旧的隔离 cron 运行会话（`false` 禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认分别为 `2_000_000` 字节和 `2000` 行）。

当 cron 强制创建新的隔离运行会话时，它会在写入新行之前，
清理之前的 `cron:<jobId>` 会话条目。它会保留安全偏好，
例如 thinking/fast/verbose 设置、标签以及用户显式选择的模型/认证覆盖。它会丢弃环境会话上下文，
例如渠道/群组路由、发送或排队策略、提权、来源以及 ACP
运行时绑定，以便新的隔离运行不会从旧运行继承过时的交付或
运行时权限。

---

## 会话键（`sessionKey`）

`sessionKey` 用于标识你位于_哪个对话桶_中（路由 + 隔离）。

常见模式：

- 主/直接聊天（按智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/渠道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录在 [/concepts/session](/zh-CN/concepts/session) 中。

---

## 会话 id（`sessionId`）

每个 `sessionKey` 指向一个当前 `sessionId`（即继续该对话的 transcript 文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认是 gateway 主机本地时间凌晨 4:00）会在越过重置边界后的下一条消息到来时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在消息于空闲窗口后到达时创建新的 `sessionId`。当同时配置了每日重置和空闲过期时，先到期者生效。
- **系统事件**（heartbeat、cron 唤醒、exec 通知、gateway 记账）可能会修改会话行，但不会延长每日/空闲重置的新鲜度。在构建新提示词之前，重置轮换会丢弃上一会话中排队的系统事件通知。
- **线程父分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）会在父会话已经过大时跳过父 transcript 分叉；新线程将重新开始。设为 `0` 可禁用。

实现细节：该决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储模式（`sessions.json`）

该存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非详尽）：

- `sessionId`：当前 transcript id（除非设置了 `sessionFile`，否则文件名由此派生）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置
  新鲜度使用它。旧行可能会从 JSONL 会话头派生它。
- `lastInteractionAt`：上次真实用户/渠道交互时间戳；空闲重置
  新鲜度使用它，因此 heartbeat、cron 和 exec 事件不会让会话一直保持活跃。缺少该字段的旧行会回退到恢复出的会话开始
  时间作为空闲新鲜度基线。
- `updatedAt`：上次存储行变更时间戳，用于列出、修剪和
  记账。它不是每日/空闲重置新鲜度的权威依据。
- `sessionFile`：可选的显式 transcript 路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：群组/渠道标签元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为 / 取决于提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键完成自动压缩的次数
- `memoryFlushAt`：上次压缩前 memory 刷新的时间戳
- `memoryFlushCompactionCount`：上次 flush 运行时的压缩计数

该存储可以安全编辑，但 Gateway 网关才是权威：会话运行过程中，它可能会重写或重新补全条目。

---

## Transcript 结构（`*.jsonl`）

Transcripts 由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

文件格式是 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选的 `parentSession`）
- 后续内容：带 `id` + `parentId` 的会话条目（树形）

值得注意的条目类型：

- `message`：用户/助手/toolResult 消息
- `custom_message`：由扩展注入、且_会_进入模型上下文的消息（可对 UI 隐藏）
- `custom`：_不会_进入模型上下文的扩展状态
- `compaction`：持久化的压缩摘要，带 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：在导航树分支时持久化的摘要

OpenClaw 有意**不会**“修复” transcripts；Gateway 网关使用 `SessionManager` 来读写它们。

---

## 上下文窗口与已跟踪 token

需要区分两个概念：

1. **模型上下文窗口**：每个模型的硬上限（模型可见 token）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表板）

如果你在调优限制：

- 上下文窗口来自模型目录（也可通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算/报告值；不要把它当作严格保证。

更多内容请参见 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会将较旧的对话总结为 transcript 中持久化的 `compaction` 条目，并保留最近消息不变。

压缩之后，未来轮次可见的是：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久化的**（不同于会话修剪）。请参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界和工具配对

当 OpenClaw 将较长 transcript 拆分为压缩分块时，它会保持
助手工具调用与其匹配的 `toolResult` 条目成对出现。

- 如果 token 占比分割点落在工具调用与其结果之间，OpenClaw
  会将边界移动到助手工具调用消息处，而不是将这对内容分开。
- 如果尾部的工具结果块本来会把分块推到目标大小之上，
  OpenClaw 会保留该待处理工具块，并保持未总结的尾部内容不变。
- 已中止/报错的工具调用块不会保持待处理分割处于打开状态。

---

## 自动压缩何时发生（Pi 运行时）

在嵌入式 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded` 以及类似的提供商风格变体）→ 压缩 → 重试。
2. **阈值维护**：成功完成一轮后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示词 + 下一次模型输出预留的余量

这些是 Pi 运行时语义（OpenClaw 会消费这些事件，但由 Pi 决定何时压缩）。

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 且
活动 transcript 文件达到该大小时，OpenClaw 还可以在打开下一次
运行前触发本地预检压缩。这是针对本地重新打开成本的文件大小保护，而不是原始归档：OpenClaw 仍然执行正常的语义压缩，
并且它要求 `truncateAfterCompaction`，以便压缩后的摘要可以成为新的后继 transcript。

---

## 压缩设置（`reserveTokens`、`keepRecentTokens`）

Pi 的压缩设置位于 Pi settings 中：

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw 还会对嵌入式运行强制实施一个安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其提高。
- 默认下限是 `20000` token。
- 将 `agents.defaults.compaction.reserveTokensFloor: 0` 设为 `0` 可禁用该下限。
- 如果它已经更高，OpenClaw 不会修改。
- 手动 `/compact` 会遵循显式设置的 `agents.defaults.compaction.keepRecentTokens`，
  并保留 Pi 的最近尾部截断点。若未显式设置保留预算，
  手动压缩仍然是一个硬检查点，重建后的上下文将从
  新摘要开始。
- 将 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置为字节值或
  类似 `"20mb"` 的字符串，可以在活动
  transcript 变大时，于某个轮次开始前运行本地压缩。该保护仅在
  同时启用了 `truncateAfterCompaction` 时才会生效。保持未设置或设为 `0` 可
  禁用。
- 当启用 `agents.defaults.compaction.truncateAfterCompaction` 时，
  OpenClaw 会在压缩后将活动 transcript 轮换为一个已压缩的后继 JSONL。
  旧的完整 transcript 会作为归档保留，并从压缩检查点链接过去，而不是就地重写。

原因：在压缩变得不可避免之前，为多轮“清理”操作（例如 memory 写入）留出足够余量。

实现位置：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔的压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为某个已注册提供商 id 时，safeguard 扩展会将摘要生成委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 id。不设置则使用默认 LLM 摘要生成。
- 设置 `provider` 会强制使用 `mode: "safeguard"`。
- 提供商会接收与内置路径相同的压缩指令和标识符保留策略。
- 在提供商输出之后，safeguard 仍会保留最近轮次和拆分轮次的后缀上下文。
- 内置 safeguard 摘要生成会使用新消息重新提炼先前摘要，
  而不是原样保留先前完整摘要。
- safeguard 模式默认启用摘要质量审计；设置
  `qualityGuard.enabled: false` 可跳过输出格式错误时的重试行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要生成。
- 中止/超时信号会被重新抛出（而不是吞掉），以遵守调用方取消操作。

源码：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 面向用户的可见界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（在任意聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默清理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，在这种场景下用户不应看到中间输出。

约定：

- 助手以精确的静默 token `NO_REPLY` /
  `no_reply` 开始输出，以表示“不要向用户交付回复”。
- OpenClaw 会在交付层中去除/抑制它。
- 精确静默 token 抑制不区分大小写，因此当整个负载仅为该静默 token 时，
  `NO_REPLY` 和
  `no_reply` 都会生效。
- 这仅适用于真正的后台/无交付轮次；它并不是
  普通可执行用户请求的捷径。

从 `2026.1.10` 开始，如果某个
部分分块以 `NO_REPLY` 开头，OpenClaw 还会抑制**草稿/打字流式传输**，这样静默操作就不会在轮次中途泄露部分输出。

---

## 压缩前“memory flush”（已实现）

目标：在自动压缩发生之前，运行一个静默的智能体轮次，将持久
状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就无法
抹去关键上下文。

OpenClaw 使用**阈值前 flush** 方案：

1. 监控会话上下文使用量。
2. 当它越过一个“软阈值”（低于 Pi 的压缩阈值）时，运行一个静默的
   “立即写入 memory”指令给智能体。
3. 使用精确的静默 token `NO_REPLY` / `no_reply`，让用户
   看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（flush 轮次的用户消息）
- `systemPrompt`（附加到 flush 轮次的额外系统提示词）

说明：

- 默认 prompt/systemPrompt 包含 `NO_REPLY` 提示，以抑制
  交付。
- 每个压缩周期只运行一次 flush（在 `sessions.json` 中跟踪）。
- flush 仅对嵌入式 Pi 会话运行（CLI 后端会跳过）。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，会跳过 flush。
- 有关工作区文件布局和写入模式，请参见 [Memory](/zh-CN/concepts/memory)。

Pi 也在扩展 API 中暴露了 `session_before_compact` 钩子，但 OpenClaw 的
flush 逻辑目前位于 Gateway 网关侧。

---

## 故障排除清单

- 会话键不对？从 [/concepts/session](/zh-CN/concepts/session) 开始，并在 `/status` 中确认 `sessionKey`。
- 存储与 transcript 不匹配？确认 Gateway 网关主机以及 `openclaw status` 显示的存储路径。
- 压缩过于频繁？检查：
  - 模型上下文窗口（太小）
  - 压缩设置（对于模型窗口来说，`reserveTokens` 过高会导致更早压缩）
  - `toolResult` 膨胀：启用/调整会话修剪
- 静默轮次泄露？确认回复以 `NO_REPLY` 开头（大小写不敏感的精确 token），并且你使用的是包含流式抑制修复的版本。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
