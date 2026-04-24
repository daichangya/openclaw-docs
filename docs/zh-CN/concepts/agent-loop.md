---
read_when:
    - 你需要一份关于智能体循环或生命周期事件的精确演练说明
    - 你正在更改会话排队、转录写入或会话写锁行为
summary: 智能体循环生命周期、流，以及等待语义
title: 智能体循环
x-i18n:
    generated_at: "2026-04-24T17:31:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09419b1181c682fe4feed3e30ae6d7e18e002279bedb702312d944fd93a85ac6
    source_path: concepts/agent-loop.md
    workflow: 15
---

# 智能体循环（OpenClaw）

智能体循环是智能体一次完整的“真实”运行：输入接收 → 上下文组装 → 模型推理 → 工具执行 → 流式回复 → 持久化。它是将一条消息转换为操作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，一个循环是每个会话对应的一次串行化运行；在模型思考、调用工具和流式输出内容时，它会发出生命周期事件和流事件。本文档说明这一真实循环如何端到端接线。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作方式（高层概览）

1. `agent` RPC 验证参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型以及 thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环未发出事件，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过每会话队列和全局队列对运行进行串行化
   - 解析模型和凭证配置文件，并构建 Pi 会话
   - 订阅 Pi 事件并流式传输 assistant/tool 增量
   - 强制执行超时；超过时中止运行
   - 返回负载和 usage 元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按会话键（会话通道）串行化，也可以选择通过全局通道。
- 这可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup）来接入这一通道系统。
  参见 [命令队列](/zh-CN/concepts/queue)。
- 转录写入同样受会话文件上的会话写锁保护。该锁具有进程感知能力并基于文件，因此可以捕获绕过进程内队列或来自其他进程的写入者。
- 会话写锁默认不可重入。如果某个辅助函数有意在保持单一逻辑写入者的前提下嵌套获取同一把锁，则必须显式启用
  `allowReentrant: true`。

## 会话 + 工作区准备

- 工作区会被解析并创建；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到环境和提示词中。
- Bootstrap/上下文文件会被解析并注入到系统提示词报告中。
- 会先获取会话写锁；`SessionManager` 会在流式传输开始前打开并完成准备。任何后续的转录重写、压缩或截断路径，都必须在打开或修改转录文件之前获取同一把锁。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和每次运行的覆盖项共同构建。
- 会强制执行特定于模型的限制和压缩预留 token。
- 有关模型实际看到的内容，参见 [系统提示词](/zh-CN/concepts/system-prompt)。

## 钩子点（你可以拦截的位置）

OpenClaw 有两套钩子系统：

- **内部钩子**（Gateway 网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：位于智能体/工具生命周期和 Gateway 网关流水线内部的扩展点。

### 内部钩子（Gateway 网关钩子）

- **`agent:bootstrap`**：在系统提示词最终确定之前、构建 bootstrap 文件时运行。
  用它来添加/移除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 以及其他命令事件（参见 Hooks 文档）。

设置和示例参见 [Hooks](/zh-CN/automation/hooks)。

### 插件钩子（智能体 + Gateway 网关生命周期）

这些钩子在智能体循环或 Gateway 网关流水线内部运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），用于在模型解析前确定性地覆盖 provider/model。
- **`before_prompt_build`**：在会话加载后运行（带有 `messages`），用于在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对每轮动态文本使用 `prependContext`，对应该位于系统提示词空间中的稳定指导使用 system-context 字段。
- **`before_agent_start`**：遗留兼容性钩子，可能在任一阶段运行；优先使用上面更明确的钩子。
- **`before_agent_reply`**：在内联操作之后、LLM 调用之前运行，允许插件接管当前轮次并返回合成回复，或完全静默该轮次。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 skill 或插件安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 自有的会话转录之前，同步转换这些结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

用于出站/工具保护的钩子判定规则：

- `before_tool_call`：`{ block: true }` 是终止性结果，并会阻止更低优先级处理器继续执行。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除先前的阻止状态。
- `before_install`：`{ block: true }` 是终止性结果，并会阻止更低优先级处理器继续执行。
- `before_install`：`{ block: false }` 是空操作，不会清除先前的阻止状态。
- `message_sending`：`{ cancel: true }` 是终止性结果，并会阻止更低优先级处理器继续执行。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除先前的取消状态。

有关钩子 API 和注册细节，参见 [插件钩子](/zh-CN/plugins/hooks)。

不同 Harness 可能会以不同方式适配这些钩子。Codex app-server harness 将
OpenClaw 插件钩子保留为已记录镜像表面的兼容性契约，而 Codex 原生钩子仍然是独立的、更底层的 Codex 机制。

## 流式传输 + 部分回复

- assistant 增量从 pi-agent-core 流式传出，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- 推理流式传输可以作为单独流发出，也可以作为块回复发出。
- 有关分块和块回复行为，参见 [流式传输](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具开始/更新/结束事件会在 `tool` 流上发出。
- 在记录/发出之前，工具结果会针对大小和图像负载进行清理。
- 会跟踪消息工具发送，以抑制重复的 assistant 确认信息。

## 回复整形 + 抑制

- 最终负载由以下内容组装而成：
  - assistant 文本（以及可选的推理内容）
  - 内联工具摘要（在 verbose 开启且允许时）
  - 模型出错时的 assistant 错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  负载中过滤掉。
- 会从最终负载列表中移除消息工具重复项。
- 如果没有剩余可渲染负载，且某个工具出错，则会发出回退工具错误回复
  （除非某个消息工具已经发送了用户可见的回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并且可能触发重试。
- 重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 有关压缩流水线，参见 [压缩](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为回退发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- assistant 增量会被缓冲为聊天 `delta` 消息。
- 聊天 `final` 会在 **lifecycle end/error** 时发出。

## 超时

- `agent.wait` 默认值：30 秒（仅等待）。可由 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认值为 172800 秒（48 小时）；由 `runEmbeddedPiAgent` 中的中止计时器强制执行。
- LLM 空闲超时：`agents.defaults.llm.idleTimeoutSeconds` 会在空闲窗口内未收到任何响应分块时中止模型请求。对于缓慢的本地模型或推理/工具调用 provider，请显式设置它；设为 0 可禁用。如果未设置，OpenClaw 会在已配置 `agents.defaults.timeoutSeconds` 时使用该值，否则使用 120 秒。对于未显式设置 LLM 或智能体超时的 cron 触发运行，会禁用空闲看门狗，并依赖 cron 外层超时。

## 可能提前结束的位置

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关内容

- [工具](/zh-CN/tools) —— 可供智能体使用的工具
- [Hooks](/zh-CN/automation/hooks) —— 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/zh-CN/concepts/compaction) —— 长对话如何被总结
- [Exec 审批](/zh-CN/tools/exec-approvals) —— shell 命令的审批门控
- [Thinking](/zh-CN/tools/thinking) —— thinking/推理级别配置
