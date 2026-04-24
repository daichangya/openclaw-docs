---
read_when:
    - 你需要一份关于智能体循环或生命周期事件的精确说明
    - 你正在更改会话排队、转录写入或会话写锁行为
summary: 智能体循环生命周期、流和等待语义
title: 智能体循环
x-i18n:
    generated_at: "2026-04-24T03:15:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# 智能体循环（OpenClaw）

智能体循环是智能体一次完整、“真实”的运行：输入接收 → 上下文组装 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是将一条消息
转化为操作和最终回复的权威路径，同时保持会话状态一致。

在 OpenClaw 中，一个循环是每个会话一次串行化的单次运行，在模型思考、调用工具和流式输出时
会发出生命周期事件和流事件。本文档解释了这一真实循环如何端到端连接。

## 入口点

- Gateway 网关 RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层）

1. `agent` RPC 验证参数，解析会话（sessionKey/sessionId），持久化会话元数据，并立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行智能体：
   - 解析模型 + thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core 运行时）
   - 如果嵌入式循环未发出 **lifecycle end/error**，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过每会话队列 + 全局队列串行化运行
   - 解析模型 + 认证配置文件并构建 Pi 会话
   - 订阅 Pi 事件并流式传输 assistant/tool 增量
   - 强制超时 -> 超过时中止运行
   - 返回负载和 usage 元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - 助手增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行会按会话键（会话通道）串行化，并可选地通过一个全局通道。
- 这可以防止工具/会话竞争，并保持会话历史一致。
- 消息渠道可以选择队列模式（collect/steer/followup）来接入该通道系统。
  参见 [命令队列](/zh-CN/concepts/queue)。
- 转录写入也受会话文件上的会话写锁保护。该锁
  具备进程感知能力并且基于文件，因此它可以捕获绕过进程内队列或来自
  其他进程的写入者。
- 默认情况下，会话写锁不可重入。如果某个辅助函数有意在保持单一逻辑写入者的同时嵌套获取
  同一把锁，则必须显式启用
  `allowReentrant: true`。

## 会话 + 工作区准备

- 工作区会被解析并创建；沙箱隔离运行可能会重定向到沙箱工作区根目录。
- Skills 会被加载（或从快照复用），并注入到环境变量和提示词中。
- Bootstrap/上下文文件会被解析并注入到系统提示词报告中。
- 会获取一个会话写锁；`SessionManager` 会在流式传输前打开并准备好。任何
  后续的转录重写、压缩或截断路径，在打开或
  修改转录文件之前都必须获取同一把锁。

## 提示词组装 + 系统提示词

- 系统提示词由 OpenClaw 的基础提示词、Skills 提示词、bootstrap 上下文和每次运行的覆盖项构建而成。
- 会强制执行特定于模型的限制和压缩保留令牌。
- 有关模型实际看到的内容，请参见 [系统提示词](/zh-CN/concepts/system-prompt)。

## Hook 点（你可以在哪些地方拦截）

OpenClaw 有两套 Hook 系统：

- **内部 Hook**（Gateway 网关 Hook）：用于命令和生命周期事件的事件驱动脚本。
- **插件 Hook**：位于智能体/工具生命周期和 Gateway 网关流水线中的扩展点。

### 内部 Hook（Gateway 网关 Hook）

- **`agent:bootstrap`**：在系统提示词最终确定前，构建 bootstrap 文件时运行。
  用它来添加/移除 bootstrap 上下文文件。
- **命令 Hook**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hook 文档）。

设置和示例请参见 [Hooks](/zh-CN/automation/hooks)。

### 插件 Hook（智能体 + Gateway 网关生命周期）

这些 Hook 在智能体循环或 Gateway 网关流水线内部运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），以确定性方式在模型解析前覆盖 provider/model。
- **`before_prompt_build`**：在会话加载后运行（带有 `messages`），用于在提交提示词前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对每回合动态文本使用 `prependContext`，对应该位于系统提示词空间中的稳定指导使用系统上下文字段。
- **`before_agent_start`**：旧版兼容 Hook，可能在任一阶段运行；优先使用上面更明确的 Hook。
- **`before_agent_reply`**：在内联操作之后、LLM 调用之前运行，允许插件接管该回合并返回合成回复，或完全静默该回合。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或注释压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果，并可选择阻止 Skills 或插件安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 自有的会话转录之前同步转换工具结果。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息 Hook。
- **`session_start` / `session_end`**：会话生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 网关生命周期事件。

出站/工具守卫的 Hook 决策规则：

- `before_tool_call`：`{ block: true }` 为终止性结果，并停止更低优先级的处理程序。
- `before_tool_call`：`{ block: false }` 为无操作，不会清除先前的阻止。
- `before_install`：`{ block: true }` 为终止性结果，并停止更低优先级的处理程序。
- `before_install`：`{ block: false }` 为无操作，不会清除先前的阻止。
- `message_sending`：`{ cancel: true }` 为终止性结果，并停止更低优先级的处理程序。
- `message_sending`：`{ cancel: false }` 为无操作，不会清除先前的取消。

有关 Hook API 和注册详情，请参见 [插件 Hook](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。

不同 harness 可能会以不同方式适配这些 Hook。Codex app-server harness 将
OpenClaw 插件 Hook 保持为已记录镜像表面的兼容性契约，
而 Codex 原生 Hook 仍然是一个独立的、更底层的 Codex 机制。

## 流式传输 + 部分回复

- 助手增量从 pi-agent-core 流式传出，并作为 `assistant` 事件发出。
- 分块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- 推理流式传输可以作为单独的流发出，也可以作为分块回复发出。
- 有关分块和分块回复行为，请参见 [流式传输](/zh-CN/concepts/streaming)。

## 工具执行 + 消息工具

- 工具 start/update/end 事件会在 `tool` 流上发出。
- 工具结果在记录/发出前，会针对大小和图像负载进行清理。
- 消息工具发送会被跟踪，以抑制重复的助手确认信息。

## 回复整形 + 抑制

- 最终负载由以下内容组装而成：
  - 助手文本（以及可选的推理）
  - 内联工具摘要（当 verbose 开启且允许时）
  - 模型报错时的助手错误文本
- 精确的静默令牌 `NO_REPLY` / `no_reply` 会从出站
  负载中过滤掉。
- 消息工具重复项会从最终负载列表中移除。
- 如果没有剩余可渲染的负载且某个工具报错，则会发出一个后备工具错误回复
  （除非某个消息工具已经发送了用户可见的回复）。

## 压缩 + 重试

- 自动压缩会发出 `compaction` 流事件，并且可以触发重试。
- 重试时，会重置内存缓冲区和工具摘要，以避免重复输出。
- 有关压缩流水线，请参见 [压缩](/zh-CN/concepts/compaction)。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为回退发出）
- `assistant`：来自 pi-agent-core 的流式增量
- `tool`：来自 pi-agent-core 的流式工具事件

## 聊天渠道处理

- 助手增量会缓冲到聊天 `delta` 消息中。
- 会在 **lifecycle end/error** 时发出聊天 `final`。

## 超时

- `agent.wait` 默认值：30 秒（仅等待）。可通过 `timeoutMs` 参数覆盖。
- 智能体运行时：`agents.defaults.timeoutSeconds` 默认为 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 的中止计时器中强制执行。
- LLM 空闲超时：`agents.defaults.llm.idleTimeoutSeconds` 会在空闲窗口内未收到任何响应分块时中止模型请求。对于缓慢的本地模型或推理/工具调用提供商，请显式设置该值；设为 0 可禁用。如果未设置，OpenClaw 会在配置了 `agents.defaults.timeoutSeconds` 时使用该值，否则使用 120 秒。没有显式 LLM 或智能体超时的 cron 触发运行会禁用空闲监控，并依赖 cron 外层超时。

## 可能提前结束的地方

- 智能体超时（abort）
- AbortSignal（取消）
- Gateway 网关断开或 RPC 超时
- `agent.wait` 超时（仅停止等待，不会停止智能体）

## 相关

- [工具](/zh-CN/tools) — 可用的智能体工具
- [Hooks](/zh-CN/automation/hooks) — 由智能体生命周期事件触发的事件驱动脚本
- [压缩](/zh-CN/concepts/compaction) — 长对话如何被总结
- [Exec 审批](/zh-CN/tools/exec-approvals) — shell 命令的审批门控
- [Thinking](/zh-CN/tools/thinking) — thinking/推理级别配置
