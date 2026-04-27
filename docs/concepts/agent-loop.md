---
read_when:
    - 你需要一份关于智能体循环或生命周期事件的精确演练说明
    - 你正在更改会话排队、转录写入或会话写锁行为
summary: 智能体循环生命周期、流和等待语义
title: 智能体循环
x-i18n:
    generated_at: "2026-04-24T18:07:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

智能体循环是一次智能体完整而“真实”的运行：接收输入 → 组装上下文 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是将一条消息转化为动作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，循环是每个会话一次单独的串行运行，在模型思考、调用工具和流式输出时发出生命周期和流事件。本文档解释了这一真实循环是如何端到端连接起来的。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层概览）

1. `agent` RPC 验证参数，解析会话（`sessionKey`/`sessionId`），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型以及 thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环没有发出，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过按会话和全局队列对运行进行串行化
   - 解析模型和 auth profile，并构建 pi 会话
   - 订阅 pi 事件并流式传输 assistant/tool 增量
   - 强制执行超时；超出时中止运行
   - 返回负载和使用情况元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - 助手增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 队列 + 并发

- 运行按会话键（会话通道）串行化，并可选地经过一个全局通道。
- 这样可以防止工具 / 会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup）来接入该通道系统。
  参见 [命令队列](/zh-CN/concepts/queue)。
- 转录写入也受会话文件上的会话写锁保护。该锁具备进程感知能力，并且基于文件，因此它可以捕获绕过进程内队列或来自其他进程的写入者。
- 默认情况下，会话写锁是不可重入的。如果某个辅助函数有意在保持单一逻辑写入者的同时嵌套获取同一个锁，则必须显式选择加入
  `allowReentrant: true`。

## 会话 + 工作区准备

- 工作区会被解析并创建；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到环境变量和提示词中。
- Bootstrap / 上下文文件会被解析并注入系统提示词报告。
- 会获取一个会话写锁；`SessionManager` 会在流式传输开始前打开并完成准备。任何后续的转录重写、压缩或截断路径，在打开或修改转录文件之前，都必须获取同一个锁。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和每次运行的覆盖项共同构建。
- 会强制执行特定于模型的限制和压缩保留 token。
- 关于模型实际看到的内容，参见 [系统提示词](/zh-CN/concepts/system-prompt)。

## 钩子点（你可以拦截的位置）

OpenClaw 有两套钩子系统：

- **内部钩子**（Gateway 网关钩子）：用于命令和生命周期事件的事件驱动脚本。
- **插件钩子**：位于智能体 / 工具生命周期和 Gateway 网关流水线内部的扩展点。

### 内部钩子（Gateway 网关钩子）

- **`agent:bootstrap`**：在系统提示词最终确定之前、构建 bootstrap 文件时运行。
  用它来添加 / 移除 bootstrap 上下文文件。
- **命令钩子**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hooks 文档）。

设置和示例参见 [Hooks](/zh-CN/automation/hooks)。

### 插件钩子（智能体 + Gateway 网关生命周期）

这些钩子在智能体循环或 Gateway 网关流水线内部运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），以在模型解析前确定性地覆盖 provider / model。
- **`before_prompt_build`**：在会话加载后运行（带有 `messages`），在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对每轮动态文本使用 `prependContext`，对应该位于系统提示词空间中的稳定指导使用系统上下文字段。
- **`before_agent_start`**：旧版兼容钩子，可能在任一阶段运行；优先使用上面明确的钩子。
- **`before_agent_reply`**：在内联动作之后、LLM 调用之前运行，允许插件接管本轮并返回合成回复，或完全静默该轮。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或注释压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数 / 结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 拥有的会话转录之前，同步转换这些结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息钩子。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

用于出站 / 工具防护的钩子判定规则：

- `before_tool_call`：`{ block: true }` 是终态，并会停止更低优先级处理器。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除先前的阻止状态。
- `before_install`：`{ block: true }` 是终态，并会停止更低优先级处理器。
- `before_install`：`{ block: false }` 是空操作，不会清除先前的阻止状态。
- `message_sending`：`{ cancel: true }` 是终态，并会停止更低优先级处理器。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除先前的取消状态。

关于钩子 API 和注册细节，参见 [插件钩子](/zh-CN/plugins/hooks)。

不同的 Harness 可能会以不同方式适配这些钩子。Codex app-server harness 将
OpenClaw 插件钩子保留为已记录镜像界面的兼容性契约，而 Codex 原生钩子则仍是独立的更底层 Codex 机制。

## 流式传输 + 部分回复

- 助手增量从 pi-agent-core 流出，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- 推理流式传输可以作为单独的流发出，也可以作为块回复发出。
- 关于分块和块回复行为，参见 [流式传输](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 在记录 / 发出之前，工具结果会针对大小和图像负载进行净化处理。
- 会跟踪消息工具发送，以抑制重复的助手确认。

## 回复整形 + 抑制

- 最终负载由以下内容组装而成：
  - 助手文本（以及可选的推理）
  - 内联工具摘要（当 verbose 开启且允许时）
  - 当模型出错时的助手错误文本
- 精确的静默标记 `NO_REPLY` / `no_reply` 会从出站
  负载中过滤掉。
- 来自消息工具的重复内容会从最终负载列表中移除。
- 如果没有可渲染负载剩余且某个工具出错，则会发出一个回退工具错误回复
  （除非某个消息工具已经发送了用户可见的回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并且可以触发重试。
- 在重试时，内存缓冲区和工具摘要会被重置，以避免重复输出。
- 关于压缩流水线，参见 [压缩](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并作为 `agentCommand` 的回退）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- 助手增量会被缓冲到聊天 `delta` 消息中。
- 聊天 `final` 会在 **lifecycle end/error** 时发出。

## 超时

- `agent.wait` 默认值：30 秒（仅等待）。可通过 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认值为 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 的中止定时器中强制执行。
- LLM 空闲超时：`agents.defaults.llm.idleTimeoutSeconds` 会在空闲窗口内未收到任何响应分块时中止模型请求。对于缓慢的本地模型或推理 / 工具调用 provider，请显式设置它；设为 0 则禁用。如果未设置，OpenClaw 会在配置了 `agents.defaults.timeoutSeconds` 时使用该值，否则使用 120 秒。对于没有显式 LLM 或智能体超时的 cron 触发运行，会禁用空闲 watchdog，并依赖 cron 的外层超时。

## 可能提前结束的地方

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关内容

- [工具](/zh-CN/tools) — 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/zh-CN/concepts/compaction) — 长对话如何被总结
- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门控
- [Thinking](/zh-CN/tools/thinking) — thinking / reasoning 级别配置
