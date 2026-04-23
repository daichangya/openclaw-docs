---
read_when:
    - 你需要一份关于智能体循环或生命周期事件的精确演练说明
    - 你正在更改会话队列、转录写入，或会话写锁行为
summary: 智能体循环生命周期、流，以及等待语义
title: 智能体循环
x-i18n:
    generated_at: "2026-04-23T04:01:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# 智能体循环（OpenClaw）

智能体循环是智能体一次完整、“真实”的运行过程：输入接收 → 上下文组装 → 模型推理 → 工具执行 → 流式回复 → 持久化。它是将消息转换为操作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，循环是每个会话一次单独的串行运行；当模型思考、调用工具并流式输出时，它会发出生命周期事件和流事件。本文档解释了这个真实循环是如何端到端连接起来的。

## 入口点

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层概览）

1. `agent` RPC 验证参数，解析会话（`sessionKey`/`sessionId`），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型以及 thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环未发出事件，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过按会话划分的队列和全局队列来串行化运行
   - 解析模型 + auth profile，并构建 pi 会话
   - 订阅 pi 事件并流式传输 assistant/tool 增量
   - 强制执行超时；超过时中止运行
   - 返回负载和 usage 元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 队列 + 并发

- 运行会按会话键（会话通道）串行化，并且可选地通过全局通道进一步串行化。
- 这可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup），这些模式会接入这个通道系统。
  参见 [Command Queue](/zh-CN/concepts/queue)。
- 转录写入同样受到会话文件上的会话写锁保护。该锁具备进程感知能力，并且基于文件，因此可以捕获绕过进程内队列的写入者，或来自其他进程的写入者。
- 会话写锁默认是非重入的。如果某个辅助函数有意在保留单一逻辑写入者的同时嵌套获取同一把锁，则必须显式启用 `allowReentrant: true`。

## 会话 + 工作区准备

- 工作区会被解析并创建；启用沙箱隔离的运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到 env 和提示词中。
- Bootstrap/上下文文件会被解析并注入到 system prompt 报告中。
- 会获取一个会话写锁；`SessionManager` 会在开始流式传输之前打开并准备好。任何后续的转录重写、压缩或截断路径，在打开或修改转录文件之前，都必须获取同一把锁。

## 提示词组装 + system prompt

- System prompt 由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文以及每次运行的覆盖项共同构建。
- 会强制执行模型特定限制和压缩预留 token。
- 有关模型实际看到的内容，请参见 [System prompt](/zh-CN/concepts/system-prompt)。

## Hook 点（你可以拦截的位置）

OpenClaw 有两套 Hook 系统：

- **内部 Hook**（Gateway Hook）：用于命令和生命周期事件的事件驱动脚本。
- **插件 Hook**：位于智能体/工具生命周期和 Gateway 网关流水线中的扩展点。

### 内部 Hook（Gateway Hook）

- **`agent:bootstrap`**：在 system prompt 最终确定之前构建 bootstrap 文件时运行。
  用它来添加/删除 bootstrap 上下文文件。
- **命令 Hook**：`/new`、`/reset`、`/stop` 以及其他命令事件（见 Hooks 文档）。

设置和示例请参见 [Hooks](/zh-CN/automation/hooks)。

### 插件 Hook（智能体 + Gateway 网关生命周期）

这些 Hook 在智能体循环内部或 Gateway 网关流水线中运行：

- **`before_model_resolve`**：在会话开始前运行（没有 `messages`），用于在模型解析前以确定性方式覆盖 provider/model。
- **`before_prompt_build`**：在会话加载后运行（带有 `messages`），用于在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对于每轮动态文本，使用 `prependContext`；对于应位于 system prompt 空间中的稳定指导，使用 system-context 字段。
- **`before_agent_start`**：为兼容旧行为保留的 Hook，可能在任一阶段运行；优先使用上面更明确的 Hook。
- **`before_agent_reply`**：在内联操作之后、LLM 调用之前运行，允许插件接管本轮并返回合成回复，或完全让本轮静默。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入会话转录之前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息 Hook。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具防护的 Hook 判定规则：

- `before_tool_call`：`{ block: true }` 是终止性结果，并会阻止更低优先级处理器继续执行。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除先前的阻止结果。
- `before_install`：`{ block: true }` 是终止性结果，并会阻止更低优先级处理器继续执行。
- `before_install`：`{ block: false }` 是无操作，不会清除先前的阻止结果。
- `message_sending`：`{ cancel: true }` 是终止性结果，并会阻止更低优先级处理器继续执行。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除先前的取消结果。

有关 Hook API 和注册细节，请参见 [Plugin hooks](/zh-CN/plugins/architecture#provider-runtime-hooks)。

## 流式传输 + 部分回复

- Assistant 增量由 pi-agent-core 流式传出，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- 推理流式传输可以作为单独的流发出，也可以作为块回复发出。
- 有关分块和块回复行为，请参见 [Streaming](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 工具结果在记录/发出前，会针对大小和图像负载进行清理。
- 消息工具发送会被跟踪，以抑制重复的 assistant 确认消息。

## 回复整形 + 抑制

- 最终负载由以下内容组装而成：
  - assistant 文本（以及可选的推理内容）
  - 内联工具摘要（当 verbose 启用且允许时）
  - 模型报错时的 assistant 错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  负载中过滤掉。
- 消息工具产生的重复内容会从最终负载列表中移除。
- 如果没有任何可渲染负载剩下，且某个工具报错，则会发出一个备用工具错误回复
  （除非某个消息工具已经发送了用户可见的回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并且可以触发重试。
- 重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 有关压缩流水线，请参见 [Compaction](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为回退方案发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- Assistant 增量会被缓冲到聊天 `delta` 消息中。
- 在 **lifecycle end/error** 时会发出聊天 `final`。

## 超时

- `agent.wait` 默认值：30 秒（仅等待）。可通过 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认值为 172800 秒（48 小时）；由 `runEmbeddedPiAgent` 中的中止计时器强制执行。
- LLM 空闲超时：`agents.defaults.llm.idleTimeoutSeconds` 会在空闲时间窗口内未收到任何响应分块时中止模型请求。对于较慢的本地模型或推理/工具调用 provider，请显式设置它；设为 0 可禁用。如果未设置，OpenClaw 会在已配置 `agents.defaults.timeoutSeconds` 时使用该值，否则使用 120 秒。对于没有显式 LLM 或智能体超时的 cron 触发运行，将禁用空闲 watchdog，并依赖 cron 外层超时。

## 可能提前结束的位置

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关内容

- [Tools](/zh-CN/tools) — 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [Compaction](/zh-CN/concepts/compaction) — 长对话如何被总结
- [Exec Approvals](/zh-CN/tools/exec-approvals) — shell 命令的审批门控
- [Thinking](/zh-CN/tools/thinking) — thinking/推理级别配置
