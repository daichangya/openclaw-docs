---
read_when:
    - 你需要对智能体循环或生命周期事件进行精确讲解
    - 你正在更改会话排队、transcript 写入或会话写锁行为
summary: 智能体循环生命周期、流和等待语义
title: 智能体循环
x-i18n:
    generated_at: "2026-04-23T20:45:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 849a0737185cb9e26cc4815ac05fee28d2495676579832eeb09d79459d989152
    source_path: concepts/agent-loop.md
    workflow: 15
---

# 智能体循环（OpenClaw）

智能体循环是一次智能体完整且“真实”的运行：输入接收 → 上下文组装 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是将一条消息转化为动作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，每个循环都是每个会话的一次单独串行运行；当模型思考、调用工具并流式输出时，它会发出生命周期和流事件。本文档解释这个真实循环是如何端到端连接起来的。

## 入口点

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作方式（高层概览）

1. `agent` RPC 验证参数，解析会话（`sessionKey`/`sessionId`），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型 + thinking/verbose/trace 默认值
   - 加载技能快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环未发出**生命周期结束/错误**事件，则发出该事件作为补偿
3. `runEmbeddedPiAgent`：
   - 通过每会话队列 + 全局队列对运行进行串行化
   - 解析模型 + 认证配置，并构建 pi 会话
   - 订阅 pi 事件并流式传输助手/工具增量
   - 强制执行超时 → 超时后中止运行
   - 返回 payload 和使用量元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - 助手增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的**生命周期结束/错误**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按会话键串行化（会话 lane），并可选地通过全局 lane。
- 这样可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup）并接入这套 lane 系统。
  参见[命令队列](/zh-CN/concepts/queue)。
- transcript 写入也受会话文件上的会话写锁保护。该锁具备进程感知能力且基于文件，因此可以捕获绕过进程内队列或来自其他进程的写入者。
- 默认情况下，会话写锁不可重入。如果某个辅助函数有意在保持单一逻辑写入者的同时嵌套获取同一把锁，必须显式启用
  `allowReentrant: true`。

## 会话 + 工作区准备

- 会解析并创建工作区；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到环境变量和提示中。
- 引导/上下文文件会被解析，并注入系统提示报告中。
- 会获取会话写锁；在开始流式传输前会打开并准备好 `SessionManager`。后续任何 transcript 重写、压缩或截断路径，在打开或修改 transcript 文件前都必须获取同一把锁。

## 提示组装 + 系统提示

- 系统提示由 OpenClaw 的基础提示、技能提示、引导上下文和每次运行覆盖项共同构建。
- 会强制执行模型特定限制和压缩预留 token。
- 有关模型看到的内容，请参阅[系统提示](/zh-CN/concepts/system-prompt)。

## Hook 点（你可以拦截的位置）

OpenClaw 有两套 hook 系统：

- **内部 hooks**（Gateway hooks）：用于命令和生命周期事件的事件驱动脚本。
- **插件 hooks**：位于智能体/工具生命周期和 gateway 管道内部的扩展点。

### 内部 hooks（Gateway hooks）

- **`agent:bootstrap`**：在系统提示最终确定前、构建引导文件时运行。
  用于添加/移除引导上下文文件。
- **命令 hooks**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hooks 文档）。

设置和示例请参阅 [Hooks](/zh-CN/automation/hooks)。

### 插件 hooks（智能体 + gateway 生命周期）

这些 hook 运行在智能体循环或 gateway 管道内部：

- **`before_model_resolve`**：在会话前运行（无 `messages`），用于在模型解析前确定性地覆盖 provider/模型。
- **`before_prompt_build`**：在会话加载后运行（带 `messages`），可在提示提交前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对每轮动态文本请使用 `prependContext`；对应位于系统提示空间中的稳定指导请使用系统上下文字段。
- **`before_agent_start`**：旧版兼容 hook，可能在任一阶段运行；优先使用上面更明确的 hooks。
- **`before_agent_reply`**：在线内动作之后、LLM 调用之前运行，允许插件接管当前轮次并返回合成回复，或完全静默该轮次。
- **`agent_end`**：完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入会话 transcript 之前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息 hooks。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：gateway 生命周期事件。

出站/工具保护的 hook 决策规则：

- `before_tool_call`：`{ block: true }` 是终止性的，并会停止较低优先级处理器。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除先前的阻止状态。
- `before_install`：`{ block: true }` 是终止性的，并会停止较低优先级处理器。
- `before_install`：`{ block: false }` 是空操作，不会清除先前的阻止状态。
- `message_sending`：`{ cancel: true }` 是终止性的，并会停止较低优先级处理器。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除先前的取消状态。

有关 hook API 和注册细节，请参阅[插件 hooks](/zh-CN/plugins/architecture#provider-runtime-hooks)。

## 流式传输 + 部分回复

- 助手增量会从 pi-agent-core 流式传输，并作为 `assistant` 事件发出。
- 分块流式传输可在 `text_end` 或 `message_end` 时发出部分回复。
- reasoning 流式传输可以作为单独流发出，也可以作为分块回复发出。
- 关于分块和分块回复行为，请参阅[流式传输](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 工具结果在记录/发出前，会针对大小和图像 payload 进行清理。
- 消息工具发送会被跟踪，以抑制重复的助手确认消息。

## 回复整形 + 抑制

- 最终 payload 由以下内容组装而成：
  - 助手文本（以及可选 reasoning）
  - 内联工具摘要（在 verbose + 允许时）
  - 模型出错时的助手错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  payload 中过滤掉。
- 消息工具重复项会从最终 payload 列表中移除。
- 如果没有可渲染的 payload 剩余，且某个工具出错，则会发出回退工具错误回复
  （除非某个消息工具已经发送了用户可见回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并且可能触发重试。
- 发生重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 关于压缩管道，请参阅[压缩](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（以及在回退情况下由 `agentCommand` 发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- 助手增量会被缓冲成聊天 `delta` 消息。
- 会在**生命周期结束/错误**时发出聊天 `final`。

## 超时

- `agent.wait` 默认值：30 秒（仅等待本身）。可通过 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 的中止计时器中强制执行。
- LLM 空闲超时：`agents.defaults.llm.idleTimeoutSeconds` 会在空闲窗口内没有收到响应分块时中止模型请求。对于较慢的本地模型或 reasoning/工具调用 provider，请显式设置；设为 0 可禁用。如果未设置，OpenClaw 会在配置了 `agents.defaults.timeoutSeconds` 时使用它，否则使用 120 秒。对于没有显式 LLM 或智能体超时的 cron 触发运行，会禁用空闲 watchdog，并依赖 cron 外层超时。

## 可能提前结束的地方

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关内容

- [工具](/zh-CN/tools) —— 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) —— 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/zh-CN/concepts/compaction) —— 长对话如何被总结
- [Exec 审批](/zh-CN/tools/exec-approvals) —— shell 命令的审批门槛
- [Thinking](/zh-CN/tools/thinking) —— thinking/reasoning 级别配置
