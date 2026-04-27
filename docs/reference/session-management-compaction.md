---
read_when:
    - 你需要调试会话 ID、转录记录 JSONL 或 `sessions.json` 字段
    - 你正在更改自动压缩行为，或添加“压缩前”清理流程
    - 你想要实现内存刷新或静默系统轮次
summary: 深入解析：会话存储 + 转录记录、生命周期，以及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-04-27T02:50:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 513d54c1135814428d74a5207b78f0d2643dff68b604b48ba2f051ab5d8046d2
    source_path: reference/session-management-compaction.md
    workflow: 15
---

本页说明 OpenClaw 如何端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪的内容
- **转录记录持久化**（`*.jsonl`）及其结构
- **转录记录清理**（运行前基于提供商的特定修正）
- **上下文限制**（上下文窗口与已跟踪 token 的区别）
- **压缩**（手动 + 自动压缩）以及在何处挂接压缩前工作
- **静默清理**（例如不应产生用户可见输出的内存写入）

如果你想先看更高层的概览，请先阅读：

- [会话管理](/zh-CN/concepts/session)
- [压缩](/zh-CN/concepts/compaction)
- [内存概览](/zh-CN/concepts/memory)
- [内存搜索](/zh-CN/concepts/memory-search)
- [会话裁剪](/zh-CN/concepts/session-pruning)
- [转录记录清理](/zh-CN/reference/transcript-hygiene)

---

## 真正的权威来源：Gateway 网关

OpenClaw 围绕一个拥有会话状态的 **Gateway 网关进程** 进行设计。

- UI（macOS 应用、Web Control UI、TUI）应向 Gateway 网关查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机上；“检查你本地 Mac 上的文件”并不能反映 Gateway 网关实际使用的内容。

---

## 两层持久化

OpenClaw 以两层方式持久化会话：

1. **会话存储（`sessions.json`）**
   - 键值映射：`sessionKey -> SessionEntry`
   - 体积小、可变、更安全可编辑（或删除条目）
   - 跟踪会话元数据（当前会话 ID、最后活动时间、切换项、token 计数器等）

2. **转录记录（`<sessionId>.jsonl`）**
   - 带树结构的仅追加转录记录（条目具有 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于为未来轮次重建模型上下文

---

## 磁盘位置

在 Gateway 网关主机上，按智能体区分：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录记录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护与磁盘控制

会话持久化为 `sessions.json` 和转录记录产物提供了自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：过期条目年龄截断值（默认 `30d`）
- `maxEntries`：`sessions.json` 中条目上限（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时进行轮转（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录记录归档的保留期（默认：与 `pruneAfter` 相同；`false` 表示禁用清理）
- `maxDiskBytes`：可选的会话目录容量预算
- `highWaterBytes`：清理后的可选目标值（默认是 `maxDiskBytes` 的 `80%`）

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先移除最旧的已归档或孤立转录记录产物。
2. 如果仍高于目标值，则驱逐最旧的会话条目及其转录记录文件。
3. 持续执行，直到使用量低于或等于 `highWaterBytes`。

在 `mode: "warn"` 下，OpenClaw 会报告潜在驱逐项，但不会修改存储或文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话与运行日志

隔离的 cron 运行也会创建会话条目和转录记录，并且它们有专门的保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中裁剪旧的隔离 cron 运行会话（`false` 禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会裁剪 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认分别为 `2_000_000` 字节和 `2000` 行）。

当 cron 强制创建新的隔离运行会话时，它会在写入新行之前清理之前的 `cron:<jobId>` 会话条目。它会保留安全的偏好设置，例如 thinking/fast/verbose 设置、标签以及用户显式选择的模型 / 凭证覆盖。它会丢弃环境对话上下文，例如渠道 / 群组路由、发送或队列策略、提权、来源以及 ACP 运行时绑定，这样新的隔离运行就不会继承旧运行中的过期投递或运行时权限。

---

## 会话键（`sessionKey`）

`sessionKey` 用于标识你当前处于 _哪个对话桶_ 中（路由 + 隔离）。

常见模式：

- 主 / 直接聊天（每个智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间 / 渠道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录于 [/concepts/session](/zh-CN/concepts/session)。

---

## 会话 ID（`sessionId`）

每个 `sessionKey` 都指向当前的 `sessionId`（即继续该对话的转录记录文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认在 Gateway 网关主机本地时间凌晨 4:00）会在跨过重置边界后的下一条消息到达时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在消息于空闲窗口后到达时创建新的 `sessionId`。当同时配置每日重置和空闲过期时，以先到期者为准。
- **系统事件**（心跳、cron 唤醒、exec 通知、Gateway 网关记账事件）可能会修改会话行，但不会延长每日 / 空闲重置的新鲜度。发生重置滚动时，在构建新的提示之前，会丢弃上一会话排队中的系统事件通知。
- **线程父级分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）会在父会话已过大时跳过父转录记录分叉；新线程将从头开始。设为 `0` 可禁用。

实现细节：该决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储模式（`sessions.json`）

该存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非完整列表）：

- `sessionId`：当前转录记录 ID（除非设置了 `sessionFile`，否则文件名由此派生）
- `sessionStartedAt`：当前 `sessionId` 的开始时间戳；每日重置的新鲜度依赖此值。旧行可能会从 JSONL 会话头派生它。
- `lastInteractionAt`：最后一次真实用户 / 渠道交互的时间戳；空闲重置的新鲜度依赖此值，因此心跳、cron 和 exec 事件不会让会话保持活跃。缺少此字段的旧行会回退到恢复出的会话开始时间作为空闲新鲜度依据。
- `updatedAt`：最后一次存储行变更的时间戳，用于列出、裁剪和记账。它不是每日 / 空闲重置新鲜度的权威依据。
- `sessionFile`：可选的显式转录记录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：群组 / 渠道标记的元数据
- 切换项：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为 / 取决于提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：此会话键完成自动压缩的次数
- `memoryFlushAt`：上次压缩前内存刷新的时间戳
- `memoryFlushCompactionCount`：上次刷新运行时的压缩计数

该存储可安全编辑，但 Gateway 网关才是权威：会话运行时，它可能会重写或重新补全条目。

---

## 转录记录结构（`*.jsonl`）

转录记录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

文件格式为 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选的 `parentSession`）
- 随后：带有 `id` + `parentId` 的会话条目（树结构）

值得注意的条目类型：

- `message`：用户 / assistant / toolResult 消息
- `custom_message`：由扩展注入、且 _会_ 进入模型上下文的消息（可对 UI 隐藏）
- `custom`：_不会_ 进入模型上下文的扩展状态
- `compaction`：持久化的压缩摘要，包含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：在导航树分支时持久化的摘要

OpenClaw 有意 **不会** “修正” 转录记录；Gateway 网关使用 `SessionManager` 读写它们。

---

## 上下文窗口与已跟踪 token

有两个不同概念需要关注：

1. **模型上下文窗口**：每个模型的硬上限（模型可见 token 数）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 `/status` 和仪表板）

如果你在调整限制：

- 上下文窗口来自模型目录（也可通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算 / 报告值；不要把它当作严格保证。

更多内容请参阅 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会将较早的对话总结为转录记录中持久化的 `compaction` 条目，并保留最近消息不变。

压缩后，未来轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是 **持久的**（不同于会话裁剪）。参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界与工具配对

当 OpenClaw 将长转录记录拆分为压缩分块时，它会保持 assistant 工具调用与其对应的 `toolResult` 条目成对出现。

- 如果按 token 占比分割的位置落在工具调用与其结果之间，OpenClaw 会将边界移动到 assistant 工具调用消息处，而不是拆开这对条目。
- 如果尾部的工具结果块本来会把分块推过目标大小，OpenClaw 会保留这个待处理工具块，并保持未摘要的尾部完整。
- 已中止 / 出错的工具调用块不会阻止待处理分割继续进行。

---

## 自动压缩何时发生（Pi 运行时）

在内嵌 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误（`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded` 以及类似提供商形式的变体）→ 压缩 → 重试。
2. **阈值维护**：在一次成功轮次之后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示词 + 下一次模型输出预留的余量

这些都是 Pi 运行时语义（OpenClaw 会消费这些事件，但由 Pi 决定何时压缩）。

当设置了 `agents.defaults.compaction.maxActiveTranscriptBytes` 且活动转录记录文件达到该大小时，OpenClaw 也可以在打开下一次运行前触发预检本地压缩。这是针对本地重新打开成本的文件大小保护，而不是原始归档：OpenClaw 仍会运行正常的语义压缩，并且它要求 `truncateAfterCompaction`，这样压缩后的摘要才能成为新的后继转录记录。

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

OpenClaw 还会对内嵌运行强制应用一个安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会提升它。
- 默认下限为 `20000` 个 token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果它已经更高，OpenClaw 会保持不变。
- 手动 `/compact` 会遵循显式的 `agents.defaults.compaction.keepRecentTokens`，并保留 Pi 的最近尾部截断点。若未显式设置保留预算，手动压缩仍然是一个硬检查点，重建后的上下文将从新的摘要开始。
- 将 `agents.defaults.compaction.maxActiveTranscriptBytes` 设置为字节值或类似 `"20mb"` 的字符串，可在活动转录记录变大时于轮次开始前运行本地压缩。该保护仅在同时启用 `truncateAfterCompaction` 时生效。保持未设置或设为 `0` 可禁用。
- 启用 `agents.defaults.compaction.truncateAfterCompaction` 后，OpenClaw 会在压缩后将活动转录记录轮转为压缩后的后继 JSONL。旧的完整转录记录会保持归档状态，并从压缩检查点链接过去，而不是就地重写。

原因：在压缩变得不可避免之前，为多轮“清理”工作（如内存写入）保留足够的余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当设置 `agents.defaults.compaction.provider` 为某个已注册提供商 ID 时，safeguard 扩展会将摘要生成委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 ID。不设置则使用默认的 LLM 摘要生成。
- 设置 `provider` 会强制 `mode: "safeguard"`。
- 提供商会收到与内置路径相同的压缩指令和标识符保留策略。
- safeguard 仍会在提供商输出后保留最近轮次和拆分轮次的后缀上下文。
- 内置的 safeguard 摘要生成会将先前摘要与新消息重新蒸馏，而不是原样保留此前完整摘要。
- safeguard 模式默认启用摘要质量审计；设置 `qualityGuard.enabled: false` 可跳过输出格式错误时的重试行为。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要生成。
- 中止 / 超时信号会被重新抛出（不会被吞掉），以遵循调用方取消请求。

来源：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 用户可见入口

你可以通过以下方式观察压缩和会话状态：

- `/status`（任何聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩次数

---

## 静默清理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，在这些场景下用户不应看到中间输出。

约定：

- assistant 以精确的静默标记 `NO_REPLY` / `no_reply` 开始其输出，以表示“不要向用户投递回复”。
- OpenClaw 会在投递层剥离 / 抑制它。
- 对精确静默标记的抑制不区分大小写，因此当整个负载仅为该静默标记时，`NO_REPLY` 和 `no_reply` 都算有效。
- 这仅适用于真正的后台 / 不投递轮次；它不是处理普通可执行用户请求的捷径。

从 `2026.1.10` 起，当部分分块以 `NO_REPLY` 开头时，OpenClaw 还会抑制 **草稿 / 输入中流式传输**，这样静默操作就不会在轮次中途泄露部分输出。

---

## 压缩前“内存刷新”（已实现）

目标：在自动压缩发生前，运行一个静默的智能体轮次，将持久状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就无法抹掉关键上下文。

OpenClaw 使用 **阈值前刷新** 方法：

1. 监控会话上下文使用量。
2. 当它跨过一个“软阈值”（低于 Pi 的压缩阈值）时，向智能体运行一个静默的“现在写入内存”指令。
3. 使用精确的静默标记 `NO_REPLY` / `no_reply`，这样用户什么也看不到。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（用于刷新轮次的用户消息）
- `systemPrompt`（附加到刷新轮次的额外系统提示词）

说明：

- 默认的 prompt / system prompt 包含 `NO_REPLY` 提示，用于抑制投递。
- 每个压缩周期只运行一次刷新（在 `sessions.json` 中跟踪）。
- 刷新仅对内嵌 Pi 会话运行（CLI 后端会跳过）。
- 当会话工作区为只读时（`workspaceAccess: "ro"` 或 `"none"`），会跳过刷新。
- 工作区文件布局和写入模式请参见 [内存](/zh-CN/concepts/memory)。

Pi 也会在扩展 API 中暴露 `session_before_compact` 钩子，但 OpenClaw 当前的刷新逻辑位于 Gateway 网关侧。

---

## 故障排除清单

- 会话键不对？从 [/concepts/session](/zh-CN/concepts/session) 开始，并在 `/status` 中确认 `sessionKey`。
- 存储与转录记录不匹配？确认 Gateway 网关主机以及 `openclaw status` 中的存储路径。
- 压缩过于频繁？检查：
  - 模型上下文窗口（是否过小）
  - 压缩设置（相对模型窗口，`reserveTokens` 过高会导致更早压缩）
  - 工具结果膨胀：启用 / 调整会话裁剪
- 静默轮次泄露？确认回复以 `NO_REPLY` 开头（不区分大小写的精确标记），并且你使用的构建包含流式传输抑制修复。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
