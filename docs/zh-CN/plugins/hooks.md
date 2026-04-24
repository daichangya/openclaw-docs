---
read_when:
    - 你正在构建一个插件，需要 `before_tool_call`、`before_agent_reply`、消息钩子或生命周期钩子
    - 你需要从插件中阻止、重写或要求批准工具调用
    - 你正在内部钩子和插件钩子之间做选择
summary: 插件钩子：拦截智能体、工具、消息、会话以及 Gateway 网关生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-04-24T18:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122060cc36dd0ef0be4dbc6bab629742142543ba718fccd7f5a75885e73d43e1
    source_path: plugins/hooks.md
    workflow: 15
---

插件钩子是 OpenClaw 插件的进程内扩展点。当插件需要检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装过程或 Gateway 网关启动时，请使用它们。

如果你想要一个由运维人员安装的、用于命令和 Gateway 网关事件（例如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`）的小型 `HOOK.md` 脚本，请改用 [内部钩子](/zh-CN/automation/hooks)。

## 快速开始

在你的插件入口中，使用 `api.on(...)` 注册带类型的插件钩子：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

钩子处理程序会按 `priority` 降序依次运行。同一优先级的钩子会保持注册顺序。

## 钩子目录

钩子按其扩展的表面进行分组。**粗体** 标出的名称接受决策结果（阻止、取消、覆盖或要求批准）；其余都仅用于观察。

**智能体轮次**

- `before_model_resolve` — 在加载会话消息之前覆盖提供商或模型
- `before_prompt_build` — 在模型调用之前添加动态上下文或 system prompt 文本
- `before_agent_start` — 仅用于兼容性的组合阶段；优先使用上面的两个钩子
- **`before_agent_reply`** — 使用合成回复或静默来短路模型轮次
- `agent_end` — 观察最终消息、成功状态和运行时长

**会话观察**

- `llm_input` — 观察提供商输入（system prompt、prompt、历史记录）
- `llm_output` — 观察提供商输出

**工具**

- **`before_tool_call`** — 重写工具参数、阻止执行或要求批准
- `after_tool_call` — 观察工具结果、错误和耗时
- **`tool_result_persist`** — 重写由工具结果生成的助手消息
- **`before_message_write`** — 检查或阻止进行中的消息写入（较少见）

**消息与投递**

- **`inbound_claim`** — 在智能体路由之前认领入站消息（合成回复）
- `message_received` — 观察入站内容、发送者、线程和元数据
- **`message_sending`** — 重写出站内容或取消投递
- `message_sent` — 观察出站投递成功或失败
- **`before_dispatch`** — 在交给渠道之前检查或重写出站分发
- **`reply_dispatch`** — 参与最终的回复分发流水线

**会话与压缩**

- `session_start` / `session_end` — 跟踪会话生命周期边界
- `before_compaction` / `after_compaction` — 观察或注释压缩周期
- `before_reset` — 观察会话重置事件（`/reset`、程序化重置）

**子智能体**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — 协调子智能体路由和完成结果投递

**生命周期**

- `gateway_start` / `gateway_stop` — 随 Gateway 网关启动或停止插件拥有的服务
- **`before_install`** — 检查 Skills 或插件安装扫描，并可选择阻止

## 工具调用策略

`before_tool_call` 会接收：

- `event.toolName`
- `event.params`
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`，以及诊断字段 `ctx.trace`

它可以返回：

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

规则：

- `block: true` 是终止性的，并会跳过更低优先级的处理程序。
- `block: false` 会被视为没有作出决定。
- `params` 会重写执行时使用的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件批准机制向用户发起请求。`/approve` 命令既可以批准 exec 批准，也可以批准插件批准。
- 即使更高优先级的钩子请求了批准，更低优先级的 `block: true` 仍然可以阻止调用。
- `onResolution` 会接收最终的批准决定——`allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

## Prompt 和模型钩子

对于新插件，请使用按阶段划分的钩子：

- `before_model_resolve`：仅接收当前 prompt 和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `before_prompt_build`：接收当前 prompt 和会话消息。返回 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。

`before_agent_start` 仍然保留用于兼容性。优先使用上面的显式钩子，这样你的插件就不会依赖旧版的组合阶段。

当 OpenClaw 能识别当前活跃运行时，`before_agent_start` 和 `agent_end` 会包含 `event.runId`。同一个值也可通过 `ctx.runId` 获取。

需要使用 `llm_input`、`llm_output` 或 `agent_end` 的非内置插件必须设置：

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

可变更 prompt 的钩子可以按插件禁用，方式是设置 `plugins.entries.<id>.hooks.allowPromptInjection=false`。

## 消息钩子

将消息钩子用于渠道级路由和投递策略：

- `message_received`：观察入站内容、发送者、`threadId`、`messageId`、`senderId`、可选的运行/会话关联信息，以及元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

消息钩子上下文会在可用时公开稳定的关联字段：
`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、
`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在读取旧版元数据之前，优先使用这些一等字段。

在使用渠道特定元数据之前，优先使用带类型的 `threadId` 和 `replyToId` 字段。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性的。
- 带有 `cancel: false` 的 `message_sending` 会被视为没有作出决定。
- 被重写的 `content` 会继续传递给更低优先级的钩子，除非后续钩子取消投递。

## 安装钩子

`before_install` 会在内置的 Skills 和插件安装扫描之后运行。返回额外发现项，或返回 `{ block: true, blockReason }` 以停止安装。

`block: true` 是终止性的。`block: false` 会被视为没有作出决定。

## Gateway 网关生命周期

对需要 Gateway 网关拥有状态的插件服务，请使用 `gateway_start`。上下文会公开 `ctx.config`、`ctx.workspaceDir` 以及用于检查和更新 cron 的 `ctx.getCron?.()`。使用 `gateway_stop` 清理长时间运行的资源。

不要依赖内部的 `gateway:startup` 钩子来实现插件拥有的运行时服务。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
