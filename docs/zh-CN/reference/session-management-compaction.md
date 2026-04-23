---
read_when:
    - 你需要调试会话 id、转录 JSONL 或 sessions.json 字段
    - 你正在更改自动压缩行为或添加“压缩前”整理逻辑
    - 你想实现 memory flush 或静默系统轮次
summary: 深入解析：会话存储 + 转录、生命周期，以及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-04-23T21:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea56c9305b0884e6ba6bdbd2a0bec16170af97b47749a9929c155ac4e6bd790b
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# 会话管理与压缩（深入解析）

本文解释 OpenClaw 如何端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **转录持久化**（`*.jsonl`）及其结构
- **转录清理**（运行前的提供商专属修复）
- **上下文限制**（上下文窗口 vs 跟踪 token）
- **压缩**（手动 + 自动压缩）以及在哪些位置挂接压缩前工作
- **静默整理**（例如不应产生用户可见输出的 memory 写入）

如果你想先看更高层的概览，请先阅读：

- [/concepts/session](/zh-CN/concepts/session)
- [/concepts/compaction](/zh-CN/concepts/compaction)
- [/concepts/memory](/zh-CN/concepts/memory)
- [/concepts/memory-search](/zh-CN/concepts/memory-search)
- [/concepts/session-pruning](/zh-CN/concepts/session-pruning)
- [/reference/transcript-hygiene](/zh-CN/reference/transcript-hygiene)

---

## 事实来源：Gateway 网关

OpenClaw 围绕一个拥有会话状态的**单一 Gateway 进程**设计。

- UI（macOS 应用、Web 控制 UI、TUI）应向 Gateway 网关查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机上；“检查你本地 Mac 上的文件”并不能反映 Gateway 网关实际使用的内容。

---

## 两层持久化

OpenClaw 通过两层持久化会话：

1. **会话存储（`sessions.json`）**
   - 键值映射：`sessionKey -> SessionEntry`
   - 体积小、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 id、最近活动、开关、token 计数器等）

2. **转录（`<sessionId>.jsonl`）**
   - 追加式转录，带树状结构（条目具有 `id` + `parentId`）
   - 存储实际会话、工具调用和压缩摘要
   - 用于为未来轮次重建模型上下文

---

## 磁盘路径

每个智能体在 Gateway 主机上的路径：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 主题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护与磁盘控制

会话持久化带有针对 `sessions.json` 和转录工件的自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：陈旧条目年龄截止值（默认 `30d`）
- `maxEntries`：`sessions.json` 中条目数量上限（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时进行轮转（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留时长（默认：与 `pruneAfter` 相同；`false` 禁用清理）
- `maxDiskBytes`：可选的 sessions 目录预算
- `highWaterBytes`：清理后的可选目标值（默认是 `maxDiskBytes` 的 `80%`）

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先移除最旧的已归档或孤立转录工件。
2. 如果仍高于目标值，则淘汰最旧的会话条目及其转录文件。
3. 持续执行，直到使用量降至 `highWaterBytes` 及以下。

在 `mode: "warn"` 下，OpenClaw 会报告潜在淘汰项，但不会修改存储/文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话与运行日志

隔离的 cron 运行也会创建会话条目/转录，并且它们有专用保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中清理旧的隔离 cron 运行会话（`false` 禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认值：`2_000_000` 字节和 `2000` 行）。

---

## 会话键（`sessionKey`）

`sessionKey` 用于标识你处于哪个_会话桶_中（路由 + 隔离）。

常见模式：

- 主/私聊（按智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/频道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非显式覆盖）

规范规则记录在 [/concepts/session](/zh-CN/concepts/session) 中。

---

## 会话 id（`sessionId`）

每个 `sessionKey` 都指向一个当前 `sessionId`（即继续该会话的转录文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建一个新的 `sessionId`。
- **每日重置**（默认是 gateway 主机本地时间凌晨 4:00）会在重置边界后的下一条消息到达时创建一个新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在空闲窗口之后收到新消息时创建新的 `sessionId`。当每日重置和空闲过期同时配置时，以先到期者为准。
- **线程父会话分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）会在父会话已过大时跳过父转录分叉；新线程会从头开始。设置为 `0` 可禁用。

实现细节：这个决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()`。

---

## 会话存储 schema（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非穷尽）：

- `sessionId`：当前转录 id（除非设置了 `sessionFile`，否则文件名由其派生）
- `updatedAt`：最近活动时间戳
- `sessionFile`：可选的显式转录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：群组/频道标签元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为 / 依赖提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该会话键自动压缩完成的次数
- `memoryFlushAt`：最近一次压缩前 memory flush 的时间戳
- `memoryFlushCompactionCount`：最近一次 flush 运行时的压缩计数

该存储可以安全编辑，但 Gateway 网关是权威：在会话运行过程中，它可能会重写或重新注入条目。

---

## 转录结构（`*.jsonl`）

转录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

该文件是 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选 `parentSession`）
- 其后：带有 `id` + `parentId` 的会话条目（树结构）

值得注意的条目类型：

- `message`：用户/助手/toolResult 消息
- `custom_message`：由扩展注入、**会进入模型上下文**的消息（可对 UI 隐藏）
- `custom`：**不会进入模型上下文**的扩展状态
- `compaction`：持久化的压缩摘要，带有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：在导航树分支时持久化的摘要

OpenClaw 有意**不**去“修复”转录；Gateway 网关使用 `SessionManager` 读写它们。

---

## 上下文窗口 vs 跟踪 token

有两个不同的概念很重要：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的 token）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表板）

如果你在调优限制：

- 上下文窗口来自模型目录（也可以通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算/报告值；不要将其视为严格保证。

详情请参见 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会把较早的会话摘要为一个持久化的 `compaction` 条目写入转录，并保留最近消息不变。

压缩后，未来轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久化**的（不同于会话裁剪）。参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界与工具配对

当 OpenClaw 将长转录拆分为多个压缩块时，它会保持
助手工具调用与其对应的 `toolResult` 条目配对。

- 如果按 token 比例切分恰好落在工具调用和其结果之间，OpenClaw
  会将边界移到助手工具调用消息处，而不是将这一对拆开。
- 如果尾部的工具结果块本来会把分块推过目标大小，OpenClaw
  会保留这个待处理工具块，并保持未摘要的尾部完整。
- 被中止/报错的工具调用块不会使待处理拆分持续保持开启状态。

---

## 自动压缩何时发生（Pi 运行时）

在内嵌 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及类似的提供商形态变体）→ 压缩 → 重试。
2. **阈值维护**：在一次成功轮次之后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示词 + 下一次模型输出保留的余量

这些都是 Pi 运行时语义（OpenClaw 会消费这些事件，但由 Pi 决定何时压缩）。

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

OpenClaw 还会对内嵌运行强制一个安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其提高。
- 默认下限是 `20000` token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果本来已经更高，OpenClaw 不会修改。

原因：为多轮“整理”工作（例如 memory 写入）预留足够余量，避免在压缩变得不可避免之前就耗尽空间。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册一个压缩提供商。
当 `agents.defaults.compaction.provider` 被设置为某个已注册提供商 id 时，safeguard 扩展会将摘要工作委托给该提供商，而不是使用内置的 `summarizeInStages` 流程。

- `provider`：已注册压缩提供商插件的 id。不设置则使用默认 LLM 摘要。
- 设置 `provider` 会强制 `mode: "safeguard"`。
- 提供商会收到与内置路径相同的压缩指令和标识符保留策略。
- 在提供商输出后，safeguard 仍会保留最近轮次和拆分轮次后缀上下文。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要。
- Abort/timeout 信号会被重新抛出（不会吞掉），以尊重调用方取消。

源码：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 面向用户的界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（任意聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默整理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，在这类轮次中，用户不应看到中间输出。

约定：

- 助手以精确的静默令牌 `NO_REPLY` /
  `no_reply` 开头输出，以表示“不要向用户发送回复”。
- OpenClaw 会在投递层剥离/抑制它。
- 精确静默令牌抑制是大小写不敏感的，因此当整个负载仅由该静默令牌组成时，`NO_REPLY` 和
  `no_reply` 都算有效。
- 这只适用于真正的后台/不投递轮次；它不是普通可执行用户请求的捷径。

截至 `2026.1.10`，如果某个部分分块以 `NO_REPLY` 开头，OpenClaw 也会抑制**草稿/typing 流式输出**，从而避免静默操作在轮次中途泄漏部分输出。

---

## 压缩前的 “memory flush”（已实现）

目标：在自动压缩发生之前，运行一次静默的智能体轮次，将持久
状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），从而使压缩不会
抹掉关键上下文。

OpenClaw 使用**压缩前阈值 flush** 方法：

1. 监控会话上下文使用量。
2. 当其超过一个“软阈值”（低于 Pi 的压缩阈值）时，运行一次静默的
   “立即写入 memory” 指令给智能体。
3. 使用精确静默令牌 `NO_REPLY` / `no_reply`，使用户
   看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（用于 flush 轮次的用户消息）
- `systemPrompt`（追加到 flush 轮次的额外系统提示）

说明：

- 默认 prompt/system prompt 包含 `NO_REPLY` 提示，用于抑制
  投递。
- 每个压缩周期只运行一次 flush（在 `sessions.json` 中跟踪）。
- flush 仅对内嵌 Pi 会话运行（CLI 后端会跳过）。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，会跳过 flush。
- 有关工作区文件布局和写入模式，请参见 [Memory](/zh-CN/concepts/memory)。

Pi 也通过扩展 API 暴露了一个 `session_before_compact` hook，但 OpenClaw 的
flush 逻辑目前仍位于 Gateway 网关侧。

---

## 故障排除清单

- 会话键不对？请从 [/concepts/session](/zh-CN/concepts/session) 开始，并在 `/status` 中确认 `sessionKey`。
- 存储与转录不匹配？请确认 Gateway 网关主机以及 `openclaw status` 中显示的存储路径。
- 压缩过于频繁？请检查：
  - 模型上下文窗口（是否过小）
  - 压缩设置（对当前模型窗口来说，`reserveTokens` 过高会导致更早触发压缩）
  - tool-result 膨胀：启用/调优会话裁剪
- 静默轮次仍有泄漏？请确认回复以 `NO_REPLY` 开头（大小写不敏感的精确令牌），并且你使用的是包含流式抑制修复的构建版本。
