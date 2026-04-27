---
read_when:
    - 你需要一份关于 Agent loop 或生命周期事件的精确演练说明
    - 你正在更改会话排队、转录写入或会话写锁行为
summary: Agent loop 生命周期、流以及等待语义
title: Agent loop
x-i18n:
    generated_at: "2026-04-27T04:00:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3aeae2a42ffbbe0e55aac57f4dd6c0e8459e233ccd5051e03de5c19d737bae
    source_path: concepts/agent-loop.md
    workflow: 15
---

agentic loop 是智能体一次完整、“真实”的运行过程：输入接收 → 上下文组装 → 模型推理 → 工具执行 → 流式回复 → 持久化。它是将一条消息转化为动作和最终回复、同时保持会话状态一致的权威路径。

在 OpenClaw 中，一个 loop 是每个会话一次单独、串行化的运行；当模型进行思考、调用工具并流式输出时，它会发出生命周期和流事件。本文档解释这个真实 loop 是如何端到端连接起来的。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层概述）

1. `agent` RPC 校验参数，解析会话（`sessionKey`/`sessionId`），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型以及 thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式 loop 没有发出事件，则发出 **生命周期 end/error**
3. `runEmbeddedPiAgent`：
   - 通过按会话划分的队列和全局队列实现串行运行
   - 解析模型和 auth profile，并构建 pi 会话
   - 订阅 pi 事件，并流式传输 assistant/tool 增量
   - 强制超时；如果超过时限则中止运行
   - 返回负载和 usage 元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **生命周期 end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按会话键（会话 lane）进行串行化，并可选择再经过一个全局 lane。
- 这样可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup），这些模式会接入此 lane 系统。
  参见 [Command Queue](/zh-CN/concepts/queue)。
- 转录写入也会受到会话文件上的会话写锁保护。该锁具备进程感知能力且基于文件，因此能够捕获绕过进程内队列或来自其他进程的写入者。
- 会话写锁默认不可重入。如果某个辅助逻辑在保持单一逻辑写入者的同时，确实需要嵌套获取同一个锁，则必须显式选择加入
  `allowReentrant: true`。

## 会话 + 工作区准备

- 工作区会被解析并创建；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到环境变量和提示词中。
- Bootstrap/上下文文件会被解析，并注入到 system prompt 报告中。
- 会获取一个会话写锁；`SessionManager` 会在开始流式传输之前打开并准备就绪。任何后续的转录重写、压缩或截断路径，在打开或修改转录文件之前，都必须获取同一个锁。

## 提示词组装 + system prompt

- system prompt 由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文以及每次运行的覆盖项共同构建。
- 会强制执行特定于模型的限制以及为 compaction 预留的 token。
- 关于模型会看到什么，参见 [System prompt](/zh-CN/concepts/system-prompt)。

## Hook 点（你可以在哪些位置拦截）

OpenClaw 有两套 Hook 系统：

- **内部钩子**（Gateway 网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：位于智能体/工具生命周期和 Gateway 网关流水线中的扩展点。

### 内部钩子（Gateway 网关钩子）

- **`agent:bootstrap`**：在最终确定 system prompt 之前、构建 bootstrap 文件时运行。
  可用于添加/删除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 以及其他命令事件（参见 Hooks 文档）。

设置和示例见 [Hooks](/zh-CN/automation/hooks)。

### 插件钩子（智能体 + Gateway 网关生命周期）

这些钩子在智能体 loop 或 Gateway 网关流水线内部运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），用于在模型解析之前，以确定性方式覆盖 provider/模型。
- **`before_prompt_build`**：在会话加载后运行（带有 `messages`），可在提交提示词之前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对于每轮动态文本，请使用 `prependContext`；对于应位于 system prompt 空间中的稳定指导，请使用 system-context 字段。
- **`before_agent_start`**：旧版兼容钩子，可能在任一阶段运行；优先使用上面这些更明确的钩子。
- **`before_agent_reply`**：在内联动作之后、LLM 调用之前运行，允许插件接管当前轮次并返回一个合成回复，或完全使该轮静默。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注 compaction 周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 自有的会话转录之前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具防护的 Hook 决策规则：

- `before_tool_call`：`{ block: true }` 是终结性决定，并会阻止更低优先级的处理器继续执行。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除先前的阻止决定。
- `before_install`：`{ block: true }` 是终结性决定，并会阻止更低优先级的处理器继续执行。
- `before_install`：`{ block: false }` 是空操作，不会清除先前的阻止决定。
- `message_sending`：`{ cancel: true }` 是终结性决定，并会阻止更低优先级的处理器继续执行。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除先前的取消决定。

有关 Hook API 和注册细节，参见 [Plugin hooks](/zh-CN/plugins/hooks)。

不同 harness 对这些钩子的适配方式可能不同。Codex app-server harness 将
OpenClaw 插件钩子保留为已记录镜像表面的兼容性契约，而 Codex 原生钩子仍然是独立的、更底层的 Codex 机制。

## 流式传输 + 部分回复

- assistant 增量会从 pi-agent-core 流式传出，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- 推理流式传输可以作为单独的流发出，也可以作为块回复发出。
- 关于分块和块回复行为，参见 [Streaming](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 在记录/发出之前，工具结果会针对大小和图像负载进行清理。
- 会跟踪消息工具发送，以抑制重复的 assistant 确认信息。

## 回复塑形 + 抑制

- 最终负载由以下部分组装而成：
  - assistant 文本（以及可选的推理内容）
  - 内联工具摘要（当 verbose 开启且允许时）
  - 当模型出错时的 assistant 错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  负载中过滤掉。
- 消息工具产生的重复项会从最终负载列表中移除。
- 如果没有可渲染的负载剩余且某个工具出错，则会发出一个回退工具错误回复
  （除非消息工具已经发送过用户可见的回复）。

## Compaction + 重试

- 自动 compaction 会发出 `compaction` 流事件，并且可能触发重试。
- 重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 关于 compaction 流水线，参见 [Compaction](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并在必要时由 `agentCommand` 作为回退发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- assistant 增量会被缓冲为聊天 `delta` 消息。
- 在 **生命周期 end/error** 时会发出聊天 `final`。

## 超时

- `agent.wait` 默认值：30 秒（仅等待）。可通过 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认值为 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 的中止计时器中强制执行。
- LLM 空闲超时：`agents.defaults.llm.idleTimeoutSeconds` 会在空闲窗口内未收到任何响应块时中止模型请求。对于缓慢的本地模型或推理/工具调用 provider，请显式设置它；设置为 0 可禁用。如果未设置，OpenClaw 会在已配置 `agents.defaults.timeoutSeconds` 时使用它，否则使用 120 秒。对于由 cron 触发且未显式设置 LLM 或智能体超时的运行，会禁用空闲监视器，并依赖 cron 外层超时。
- provider HTTP 请求超时：`models.providers.<id>.timeoutSeconds` 仅适用于该 provider 的模型 HTTP 获取，包括连接、响应头、响应体以及受保护获取的总中止处理。对于像 Ollama 这样缓慢的本地/自托管 provider，应先使用这个设置，再考虑提高整个智能体运行时超时。

## 可能提前结束的情况

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
