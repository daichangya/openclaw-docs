---
read_when:
    - 你需要调试会话 id、transcript JSONL 或 sessions.json 字段
    - 你正在更改自动压缩行为，或添加“压缩前”清理流程
    - 你想实现记忆刷新或静默系统轮次
summary: 深入解析：会话存储 + 转录、生命周期，以及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
    generated_at: "2026-04-24T03:19:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# 会话管理与压缩（深入解析）

本文档说明 OpenClaw 如何端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪内容
- **转录持久化**（`*.jsonl`）及其结构
- **转录清理**（运行前的提供商特定修正）
- **上下文限制**（上下文窗口与已跟踪 token）
- **压缩**（手动 + 自动压缩）以及在哪里挂接压缩前工作
- **静默清理**（例如不应产生用户可见输出的记忆写入）

如果你想先看更高层次的概览，请从以下页面开始：

- [/concepts/session](/zh-CN/concepts/session)
- [/concepts/compaction](/zh-CN/concepts/compaction)
- [/concepts/memory](/zh-CN/concepts/memory)
- [/concepts/memory-search](/zh-CN/concepts/memory-search)
- [/concepts/session-pruning](/zh-CN/concepts/session-pruning)
- [/reference/transcript-hygiene](/zh-CN/reference/transcript-hygiene)

---

## 事实来源：Gateway 网关

OpenClaw 的设计围绕单个**Gateway 网关进程**展开，该进程持有会话状态。

- UI（macOS 应用、Web Control UI、TUI）应向 Gateway 网关查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机上；“检查你本地 Mac 上的文件”并不能反映 Gateway 网关实际使用的内容。

---

## 两层持久化

OpenClaw 通过两层来持久化会话：

1. **会话存储（`sessions.json`）**
   - 键 / 值映射：`sessionKey -> SessionEntry`
   - 小型、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 id、最后活动时间、开关、token 计数器等）

2. **转录（`<sessionId>.jsonl`）**
   - 带树结构的仅追加转录（条目具有 `id` + `parentId`）
   - 存储实际的对话 + 工具调用 + 压缩摘要
   - 用于为未来轮次重建模型上下文

---

## 磁盘位置

在 Gateway 网关主机上，按智能体划分：

- 存储：`~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 转录：`~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 存储维护和磁盘控制

会话持久化为 `sessions.json` 和转录产物提供自动维护控制（`session.maintenance`）：

- `mode`：`warn`（默认）或 `enforce`
- `pruneAfter`：陈旧条目的保留期限截止值（默认 `30d`）
- `maxEntries`：`sessions.json` 中条目的上限（默认 `500`）
- `rotateBytes`：当 `sessions.json` 过大时进行轮转（默认 `10mb`）
- `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留时长（默认：与 `pruneAfter` 相同；`false` 表示禁用清理）
- `maxDiskBytes`：可选的 sessions 目录预算
- `highWaterBytes`：清理后的可选目标值（默认是 `maxDiskBytes` 的 `80%`）

磁盘预算清理的执行顺序（`mode: "enforce"`）：

1. 先删除最旧的归档或孤立转录产物。
2. 如果仍高于目标值，则驱逐最旧的会话条目及其转录文件。
3. 持续执行，直到使用量不高于 `highWaterBytes`。

在 `mode: "warn"` 下，OpenClaw 会报告潜在驱逐项，但不会修改存储 / 文件。

按需运行维护：

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 会话和运行日志

隔离的 cron 运行也会创建会话条目 / 转录，并且它们有专用的保留控制：

- `cron.sessionRetention`（默认 `24h`）会从会话存储中清理旧的隔离 cron 运行会话（`false` 表示禁用）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 会清理 `~/.openclaw/cron/runs/<jobId>.jsonl` 文件（默认值：`2_000_000` 字节和 `2000` 行）。

---

## 会话键（`sessionKey`）

`sessionKey` 用于标识你当前位于_哪个对话桶_中（路由 + 隔离）。

常见模式：

- 主 / 直接聊天（按智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间 / 渠道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- Cron：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则记录于 [/concepts/session](/zh-CN/concepts/session)。

---

## 会话 id（`sessionId`）

每个 `sessionKey` 都指向当前的 `sessionId`（继续该对话的转录文件）。

经验规则：

- **重置**（`/new`、`/reset`）会为该 `sessionKey` 创建一个新的 `sessionId`。
- **每日重置**（默认是 Gateway 网关主机本地时间凌晨 4:00）会在跨过重置边界后的下一条消息时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）会在消息到达且已超过空闲窗口时创建新的 `sessionId`。当同时配置了每日重置和空闲过期时，先到期的规则生效。
- **线程父分叉保护**（`session.parentForkMaxTokens`，默认 `100000`）会在父会话已过大时跳过父转录分叉；新线程将从头开始。设置为 `0` 可禁用。

实现细节：该决策在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()` 完成。

---

## 会话存储 schema（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非完整列表）：

- `sessionId`：当前转录 id（除非设置了 `sessionFile`，否则文件名由它派生）
- `updatedAt`：最后活动时间戳
- `sessionFile`：可选的显式转录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：用于群组 / 渠道标记的元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（按会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为 / 取决于提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该会话键完成自动压缩的次数
- `memoryFlushAt`：最后一次压缩前记忆刷新时间戳
- `memoryFlushCompactionCount`：上次刷新运行时的压缩计数

该存储可安全编辑，但 Gateway 网关才是权威：随着会话运行，它可能会重写或重新填充条目。

---

## 转录结构（`*.jsonl`）

转录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

该文件是 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选的 `parentSession`）
- 然后：带有 `id` + `parentId` 的会话条目（树结构）

值得注意的条目类型：

- `message`：用户 / 助手 / `toolResult` 消息
- `custom_message`：由扩展注入、_会进入模型上下文_的消息（可对 UI 隐藏）
- `custom`：_不会进入模型上下文_的扩展状态
- `compaction`：持久化的压缩摘要，带有 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：在导航树分支时持久化的摘要

OpenClaw 有意**不会**“修正”转录；Gateway 网关使用 `SessionManager` 读写它们。

---

## 上下文窗口与已跟踪 token

有两个不同的概念很重要：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的 token）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 `/status` 和仪表板）

如果你要调整限制：

- 上下文窗口来自模型目录（并且可以通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算 / 报告值；不要将它视为严格保证。

更多内容请参见 [/token-use](/zh-CN/reference/token-use)。

---

## 压缩：它是什么

压缩会将较早的对话总结为转录中的持久化 `compaction` 条目，并保持最近消息不变。

压缩后，未来轮次将看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久化的**（不同于会话修剪）。参见 [/concepts/session-pruning](/zh-CN/concepts/session-pruning)。

## 压缩分块边界和工具配对

当 OpenClaw 将长转录拆分为压缩分块时，它会保持
助手工具调用与其对应的 `toolResult` 条目配对。

- 如果 token 比例拆分点落在工具调用与其结果之间，OpenClaw
  会将边界移到助手工具调用消息处，而不是把这一对拆开。
- 如果尾部的工具结果块本来会让分块超出目标大小，OpenClaw
  会保留该待处理工具块，并保持未摘要的尾部不变。
- 已中止 / 出错的工具调用块不会让待处理拆分保持开启状态。

---

## 自动压缩何时发生（Pi 运行时）

在内嵌 Pi 智能体中，自动压缩会在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`，以及类似的提供商特定变体）→ 压缩 → 重试。
2. **阈值维护**：在一次成功轮次之后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为 prompt + 下一次模型输出预留的余量

这些是 Pi 运行时语义（OpenClaw 会消费这些事件，但由 Pi 决定何时压缩）。

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

OpenClaw 还会对内嵌运行强制施加一个安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，OpenClaw 会将其抬高。
- 默认下限是 `20000` token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用该下限。
- 如果它已经更高，OpenClaw 不会改动。

原因：在压缩变得不可避免之前，为多轮“清理”工作（例如记忆写入）保留足够余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（由 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 可插拔压缩提供商

插件可以通过插件 API 上的 `registerCompactionProvider()` 注册压缩提供商。当 `agents.defaults.compaction.provider` 设置为已注册的提供商 id 时，safeguard 扩展会将摘要工作委托给该提供商，而不是使用内置的 `summarizeInStages` 流水线。

- `provider`：已注册压缩提供商插件的 id。不设置则使用默认 LLM 摘要。
- 设置 `provider` 会强制使用 `mode: "safeguard"`。
- 提供商会收到与内置路径相同的压缩指令和标识符保留策略。
- 在提供商输出之后，safeguard 仍会保留最近轮次和拆分轮次的后缀上下文。
- 如果提供商失败或返回空结果，OpenClaw 会自动回退到内置 LLM 摘要。
- 中止 / 超时信号会被重新抛出（不会吞掉），以尊重调用方取消。

源码：`src/plugins/compaction-provider.ts`、`src/agents/pi-hooks/compaction-safeguard.ts`。

---

## 面向用户的可见表面

你可以通过以下方式观察压缩和会话状态：

- `/status`（任何聊天会话中）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默清理（`NO_REPLY`）

OpenClaw 支持用于后台任务的“静默”轮次，在这些场景中，用户不应看到中间输出。

约定：

- 助手会以精确的静默 token `NO_REPLY` /
  `no_reply` 开始其输出，以表示“不要向用户发送回复”。
- OpenClaw 会在传递层移除 / 抑制该内容。
- 精确静默 token 抑制是大小写不敏感的，因此当整个负载仅由该静默 token 组成时，`NO_REPLY` 和
  `no_reply` 都会生效。
- 这仅适用于真正的后台 / 无传递轮次；它不是普通可操作用户请求的快捷方式。

从 `2026.1.10` 开始，当部分分块以 `NO_REPLY` 开头时，OpenClaw 还会抑制**草稿 / 输入中流式传输**，这样静默操作就不会在轮次中途泄露部分输出。

---

## 压缩前“记忆刷新”（已实现）

目标：在自动压缩发生之前，运行一个静默的智能体轮次，将持久状态写入磁盘（例如写入智能体工作区中的 `memory/YYYY-MM-DD.md`），这样压缩就无法抹去关键上下文。

OpenClaw 使用的是**阈值前刷新**方法：

1. 监控会话上下文使用量。
2. 当它跨过某个“软阈值”（低于 Pi 的压缩阈值）时，向智能体运行一个静默的
   “立即写入记忆”指令。
3. 使用精确的静默 token `NO_REPLY` / `no_reply`，让用户
   看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（用于刷新轮次的用户消息）
- `systemPrompt`（附加到刷新轮次中的额外系统提示）

说明：

- 默认 prompt / system prompt 包含 `NO_REPLY` 提示，用于抑制
  传递。
- 每个压缩周期只会运行一次刷新（在 `sessions.json` 中跟踪）。
- 该刷新仅对内嵌 Pi 会话运行（CLI 后端会跳过）。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时，会跳过刷新。
- 关于工作区文件布局和写入模式，请参见 [记忆](/zh-CN/concepts/memory)。

Pi 也会在扩展 API 中暴露一个 `session_before_compact` hook，但 OpenClaw 的
刷新逻辑目前位于 Gateway 网关侧。

---

## 故障排查清单

- 会话键错误？先看 [/concepts/session](/zh-CN/concepts/session)，并在 `/status` 中确认 `sessionKey`。
- 存储与转录不匹配？请确认 Gateway 网关主机，以及 `openclaw status` 中显示的存储路径。
- 压缩过于频繁？请检查：
  - 模型上下文窗口（是否过小）
  - 压缩设置（对于模型窗口来说，`reserveTokens` 过高会导致更早发生压缩）
  - tool-result 膨胀：启用 / 调整会话修剪
- 静默轮次泄露？请确认回复以 `NO_REPLY` 开头（大小写不敏感的精确 token），并且你使用的是包含流式抑制修复的构建版本。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)
- [上下文引擎](/zh-CN/concepts/context-engine)
