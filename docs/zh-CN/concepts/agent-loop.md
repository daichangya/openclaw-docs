---
read_when:
    - 你需要一份关于 Agent loop 或生命周期事件的精确演练说明
    - 你正在更改会话排队、转录写入或会话写锁行为
summary: Agent loop 生命周期、流和等待语义
title: Agent loop
x-i18n:
    generated_at: "2026-04-27T09:29:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b7cb32238489e213680553d0c5ea13f32fecb6ee748a514b69dbe2d223661b0
    source_path: concepts/agent-loop.md
    workflow: 15
---

Agent loop 是智能体一次完整、“真实”的运行流程：接收输入 → 组装上下文 → 模型推理 →
工具执行 → 流式回复 → 持久化。这是将一条消息转换为动作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，一个 loop 是每个会话一次单独的串行运行；当模型思考、调用工具并流式输出时，它会发出生命周期和流事件。本文档解释了这个真实 loop 是如何端到端连接起来的。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层概览）

1. `agent` RPC 验证参数，解析会话（`sessionKey`/`sessionId`），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型以及 thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式 loop 没有发出事件，则发出**生命周期结束/错误**事件
3. `runEmbeddedPiAgent`：
   - 通过每会话队列和全局队列对运行进行串行化
   - 解析模型和认证配置文件，并构建 pi 会话
   - 订阅 pi 事件并流式传输 assistant/tool 增量
   - 强制执行超时；若超时则中止运行
   - 返回负载和用量元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的**生命周期结束/错误**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按会话键（会话 lane）串行化，并可选择通过一个全局 lane。
- 这可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup）来接入这个 lane 系统。
  参见 [Command Queue](/zh-CN/concepts/queue)。
- 转录写入同样受会话文件上的会话写锁保护。这个锁是进程感知、基于文件的，因此它能捕获绕过进程内队列或来自其他进程的写入者。
- 会话写锁默认不可重入。如果某个辅助函数有意在保持单一逻辑写入者的同时嵌套获取同一把锁，则必须显式启用
  `allowReentrant: true`。

## 会话 + 工作区准备

- 工作区会被解析并创建；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到环境变量和提示词中。
- Bootstrap/上下文文件会被解析并注入到系统提示词报告中。
- 会获取会话写锁；在开始流式传输之前，会打开并准备 `SessionManager`。任何后续的转录重写、压缩或截断路径，都必须在打开或修改转录文件之前获取同一把锁。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和每次运行的覆盖项构建而成。
- 会强制执行特定于模型的限制和压缩预留 token。
- 关于模型实际看到的内容，参见 [System prompt](/zh-CN/concepts/system-prompt)。

## 钩子点（你可以拦截的位置）

OpenClaw 有两套钩子系统：

- **内部钩子**（Gateway 网关 hooks）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：位于智能体/工具生命周期和 Gateway 网关流水线中的扩展点。

### 内部钩子（Gateway 网关 hooks）

- **`agent:bootstrap`**：在系统提示词最终确定之前、构建 bootstrap 文件时运行。
  用它来添加/删除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 以及其他命令事件（参见 Hooks 文档）。

设置和示例参见 [Hooks](/zh-CN/automation/hooks)。

### 插件钩子（智能体 + Gateway 网关生命周期）

这些钩子在 Agent loop 或 Gateway 网关流水线内部运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），用于在模型解析前以确定性方式覆盖 provider/模型。
- **`before_prompt_build`**：在会话加载后运行（带 `messages`），用于在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对每轮动态文本使用 `prependContext`；对应该位于系统提示词空间中的稳定指引，使用 system-context 字段。
- **`before_agent_start`**：用于兼容旧行为的 legacy 钩子，可能在任一阶段运行；优先使用上面更明确的钩子。
- **`before_agent_reply`**：在内联动作之后、LLM 调用之前运行，允许插件接管这一轮并返回合成回复，或完全静默这一轮。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 自有会话转录之前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具保护的钩子决策规则：

- `before_tool_call`：`{ block: true }` 是终止性的，会阻止更低优先级的处理器继续执行。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除先前的阻止。
- `before_install`：`{ block: true }` 是终止性的，会阻止更低优先级的处理器继续执行。
- `before_install`：`{ block: false }` 是空操作，不会清除先前的阻止。
- `message_sending`：`{ cancel: true }` 是终止性的，会阻止更低优先级的处理器继续执行。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除先前的取消。

关于钩子 API 和注册细节，参见 [Plugin hooks](/zh-CN/plugins/hooks)。

不同 harness 可能会以不同方式适配这些钩子。Codex app-server harness 将
OpenClaw 插件钩子保留为已文档化镜像表面的兼容性契约，而 Codex 原生钩子仍然是独立的、更底层的 Codex 机制。

## 流式传输 + 部分回复

- assistant 增量从 pi-agent-core 流式传出，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- reasoning 流式传输可以作为单独的流发出，也可以作为分块回复发出。
- 关于分块和分块回复行为，参见 [Streaming](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具开始/更新/结束事件会在 `tool` 流上发出。
- 在记录/发出之前，会对工具结果的大小和图像负载进行清理。
- 会跟踪消息工具发送，以抑制重复的 assistant 确认消息。

## 回复整形 + 抑制

- 最终负载由以下内容组装：
  - assistant 文本（以及可选的 reasoning）
  - 内联工具摘要（当 verbose 开启且允许时）
  - 模型出错时的 assistant 错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  负载中过滤掉。
- 消息工具的重复项会从最终负载列表中移除。
- 如果没有可渲染的负载剩余，且某个工具发生错误，则会发出一个回退工具错误回复
  （除非某个消息工具已经发送了用户可见的回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并且可能触发重试。
- 重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 关于压缩流水线，参见 [Compaction](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为后备发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- assistant 增量会缓冲为聊天 `delta` 消息。
- 聊天 `final` 会在**生命周期结束/错误**时发出。

## 超时

- `agent.wait` 默认值：30 秒（仅等待）。可由 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 中通过中止计时器强制执行。
- 模型空闲超时：如果在空闲窗口内没有收到任何响应分块，OpenClaw 会中止模型请求。`models.providers.<id>.timeoutSeconds` 可延长这个模型空闲 watchdog，适用于缓慢的本地/自托管 provider；否则，如果已配置，OpenClaw 会使用 `agents.defaults.timeoutSeconds`，默认上限为 120 秒。对于未显式设置模型或智能体超时的 cron 触发运行，会禁用模型空闲 watchdog，而依赖 cron 外层超时。
- 提供商 HTTP 请求超时：`models.providers.<id>.timeoutSeconds` 适用于该 provider 的模型 HTTP 获取，包括连接、响应头、响应体、SDK 请求超时、总的 guarded-fetch 中止处理，以及模型流空闲 watchdog。对于像 Ollama 这样较慢的本地/自托管 provider，应优先使用这个配置，而不是提高整个智能体运行时超时。

## 可能提前结束的地方

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关内容

- [Tools](/zh-CN/tools) — 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [Compaction](/zh-CN/concepts/compaction) — 长对话如何被总结
- [Exec Approvals](/zh-CN/tools/exec-approvals) — shell 命令的审批门控
- [Thinking](/zh-CN/tools/thinking) — thinking/reasoning 级别配置
