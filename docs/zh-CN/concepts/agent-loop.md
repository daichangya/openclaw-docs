---
read_when:
    - 你需要对智能体循环或生命周期事件的精确演练说明
summary: 智能体循环生命周期、流和等待语义
title: 智能体循环
x-i18n:
    generated_at: "2026-04-08T13:33:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32d3a73df8dabf449211a6183a70dcfd2a9b6f584dc76d0c4c9147582b2ca6a1
    source_path: concepts/agent-loop.md
    workflow: 15
---

# 智能体循环 (OpenClaw)

智能体循环是智能体一次完整、“真实”的运行：输入接收 → 上下文组装 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是将一条消息转换为操作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，循环是每个会话一次单独的串行运行；当模型思考、调用工具并流式输出内容时，它会发出生命周期事件和流事件。本文档解释这个真实循环如何进行端到端连接。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高级概览）

1. `agent` RPC 验证参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型 + thinking/verbose 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环未发出 **生命周期 end/error**，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过每会话队列 + 全局队列对运行进行串行化
   - 解析模型 + 认证配置文件并构建 pi 会话
   - 订阅 pi 事件并流式传输 assistant/tool 增量
   - 强制超时；如果超过则中止运行
   - 返回负载 + 用量元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - assistant 增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **生命周期 end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按每个会话键（会话通道）串行化，并可选择通过全局通道。
- 这可防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup），这些模式会接入这个通道系统。
  参见 [命令队列](/zh-CN/concepts/queue)。

## 会话 + 工作区准备

- 工作区会被解析并创建；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到环境变量和提示词中。
- Bootstrap/上下文文件会被解析并注入到系统提示词报告中。
- 会获取会话写锁；`SessionManager` 会在流式传输前打开并准备好。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、Bootstrap 上下文和每次运行的覆盖项构建而成。
- 会强制执行特定于模型的限制和压缩预留 token。
- 关于模型能看到什么，请参见 [系统提示词](/zh-CN/concepts/system-prompt)。

## Hook 点（你可以在哪里拦截）

OpenClaw 有两套 hook 系统：

- **内部 hooks**（Gateway 网关 hooks）：用于命令和生命周期事件的事件驱动脚本。
- **插件 hooks**：位于智能体/工具生命周期和 Gateway 网关管道中的扩展点。

### 内部 hooks（Gateway 网关 hooks）

- **`agent:bootstrap`**：在系统提示词最终确定之前、构建 Bootstrap 文件时运行。
  用它来添加/移除 Bootstrap 上下文文件。
- **命令 hooks**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hooks 文档）。

设置和示例请参见 [Hooks](/zh-CN/automation/hooks)。

### 插件 hooks（智能体 + Gateway 网关生命周期）

这些会在智能体循环内部或 Gateway 网关管道中运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），以在模型解析前确定性地覆盖提供商/模型。
- **`before_prompt_build`**：在会话加载后运行（带 `messages`），以在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对每轮动态文本使用 `prependContext`，对应该位于系统提示词空间中的稳定指导使用系统上下文字段。
- **`before_agent_start`**：旧版兼容 hook，可能在任一阶段运行；优先使用上面的显式 hooks。
- **`before_agent_reply`**：在内联操作之后、LLM 调用之前运行，让插件接管当前轮次并返回合成回复，或完全静默该轮次。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或标注压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入会话记录之前，同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息 hooks。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

用于出站/工具保护的 hook 决策规则：

- `before_tool_call`：`{ block: true }` 是终止性的，会阻止更低优先级处理器。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除先前的阻止状态。
- `before_install`：`{ block: true }` 是终止性的，会阻止更低优先级处理器。
- `before_install`：`{ block: false }` 是无操作，不会清除先前的阻止状态。
- `message_sending`：`{ cancel: true }` 是终止性的，会阻止更低优先级处理器。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除先前的取消状态。

Hook API 和注册细节请参见 [插件 hooks](/zh-CN/plugins/architecture#provider-runtime-hooks)。

## 流式传输 + 部分回复

- assistant 增量会从 pi-agent-core 流式传输，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- 推理流式传输可以作为单独的流发出，或作为分块回复发出。
- 关于分块和分块回复行为，请参见 [流式传输](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 工具结果在记录/发出之前，会针对大小和图像负载进行清理。
- 会跟踪消息工具发送，以抑制重复的 assistant 确认消息。

## 回复塑形 + 抑制

- 最终负载由以下内容组装而成：
  - assistant 文本（以及可选的推理内容）
  - 内联工具摘要（当 verbose + 允许时）
  - 当模型报错时的 assistant 错误文本
- 精确的静默 token `NO_REPLY` / `no_reply` 会从出站
  负载中过滤掉。
- 消息工具重复项会从最终负载列表中移除。
- 如果没有可渲染的负载剩余且工具出错，则会发出后备工具错误回复
  （除非消息工具已经发送了用户可见的回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并且可能触发重试。
- 重试时，会重置内存缓冲区和工具摘要，以避免重复输出。
- 关于压缩管道，请参见 [压缩](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为后备发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- assistant 增量会被缓冲为聊天 `delta` 消息。
- 聊天 `final` 会在 **生命周期 end/error** 时发出。

## 超时

- `agent.wait` 默认值：30s（仅等待）。可用 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认值为 172800s（48 小时）；在 `runEmbeddedPiAgent` 的中止计时器中强制执行。
- LLM 空闲超时：`agents.defaults.llm.idleTimeoutSeconds` 会在空闲窗口内没有收到响应分块时中止模型请求。对于较慢的本地模型或推理/工具调用提供商，请显式设置它；将其设为 0 可禁用。如果未设置，OpenClaw 会在已配置时使用 `agents.defaults.timeoutSeconds`，否则使用 60s。由 cron 触发且未显式设置 LLM 或智能体超时的运行，会禁用空闲监视器，并依赖 cron 外层超时。

## 可能提前结束的地方

- 智能体超时（中止）
- AbortSignal（取消）
- Gateway 网关断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止智能体）

## 相关内容

- [工具](/zh-CN/tools) — 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/zh-CN/concepts/compaction) — 长对话如何被总结
- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门控
- [Thinking](/zh-CN/tools/thinking) — thinking/推理级别配置
