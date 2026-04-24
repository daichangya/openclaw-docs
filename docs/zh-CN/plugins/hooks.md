---
read_when:
    - 你正在构建一个插件，需要 `before_tool_call`、`before_agent_reply`、消息钩子或生命周期钩子
    - 你需要从插件中阻止、重写或要求批准工具调用
    - 你正在在内部钩子和插件钩子之间做选择
summary: 插件钩子：拦截智能体、工具、消息、会话以及 Gateway 网关生命周期事件
title: 插件钩子
x-i18n:
    generated_at: "2026-04-24T17:31:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e25ad31350ca129e99a7e6ec42ee699857b8aaa016479bd1f79be32a37784b4
    source_path: plugins/hooks.md
    workflow: 15
---

插件钩子是 OpenClaw 插件的进程内扩展点。当插件需要检查或更改智能体运行、工具调用、消息流、会话生命周期、子智能体路由、安装流程或 Gateway 网关启动时，请使用它们。

如果你想要一个由运维人员安装的小型 `HOOK.md` 脚本来处理命令和 Gateway 网关事件，例如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`，请改用 [内部钩子](/zh-CN/automation/hooks)。

## 快速开始

在你的插件入口中，使用 `api.on(...)` 注册类型化的插件钩子：

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

钩子处理器会按 `priority` 的降序依次运行。相同优先级的钩子会保持注册顺序。

## 常见钩子

| Hook                                                                                     | 用途                                                                             |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `before_tool_call`                                                                       | 在工具运行前重写工具参数、阻止执行或请求用户批准。                               |
| `after_tool_call`                                                                        | 在执行后观察工具结果、错误和耗时。                                               |
| `before_prompt_build`                                                                    | 在模型调用前添加动态上下文或系统提示词文本。                                     |
| `before_model_resolve`                                                                   | 在加载会话消息前覆盖提供商或模型。                                               |
| `before_agent_reply`                                                                     | 使用合成回复或静默来短路模型轮次。                                               |
| `llm_input` / `llm_output`                                                               | 为具备会话感知能力的插件观察提供商输入/输出。                                     |
| `agent_end`                                                                              | 观察最终消息、成功状态和运行时长。                                               |
| `message_received`                                                                       | 在渠道解析后观察传入的渠道消息。                                                 |
| `message_sending`                                                                        | 重写或取消发出的渠道消息。                                                       |
| `message_sent`                                                                           | 观察发出消息的最终成功或失败状态。                                               |
| `session_start` / `session_end`                                                          | 跟踪会话生命周期边界。                                                           |
| `before_compaction` / `after_compaction`                                                 | 观察或注释压缩周期。                                                             |
| `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` | 协调子智能体路由和完成结果的投递。                                               |
| `gateway_start` / `gateway_stop`                                                         | 随 Gateway 网关一起启动或停止插件服务。                                          |
| `before_install`                                                                         | 检查 Skills 或插件安装扫描，并可选择阻止安装。                                   |

## 工具调用策略

`before_tool_call` 会接收：

- `event.toolName`
- `event.params`
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，例如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`，以及诊断信息 `ctx.trace`

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
    onResolution?: (decision: string) => Promise<void> | void;
  };
};
```

规则：

- `block: true` 是终止性决定，并会跳过更低优先级的处理器。
- `block: false` 会被视为未作决定。
- `params` 会重写执行时使用的工具参数。
- `requireApproval` 会暂停智能体运行，并通过插件批准机制向用户发起请求。`/approve` 命令既可以批准 exec 批准，也可以批准插件批准。
- 即使高优先级钩子请求了批准，低优先级的 `block: true` 仍然可以阻止执行。

## 提示词和模型钩子

新插件请使用特定阶段的钩子：

- `before_model_resolve`：只接收当前提示词和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `before_prompt_build`：接收当前提示词和会话消息。返回 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。

`before_agent_start` 仍然保留以兼容旧用法。优先使用上面这些明确的钩子，这样你的插件就不必依赖旧版的组合阶段。

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

修改提示词的钩子可以按插件通过 `plugins.entries.<id>.hooks.allowPromptInjection=false` 禁用。

## 消息钩子

对于渠道级路由和投递策略，请使用消息钩子：

- `message_received`：观察传入内容、发送者、`threadId` 和元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败状态。

在使用渠道特定元数据之前，优先使用类型化的 `threadId` 和 `replyToId` 字段。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性决定。
- 带有 `cancel: false` 的 `message_sending` 会被视为未作决定。
- 被重写的 `content` 会继续传递给更低优先级的钩子，除非后续钩子取消投递。

## 安装钩子

`before_install` 会在内置的 Skills 和插件安装扫描完成后运行。

返回附加发现结果，或返回 `{ block: true, blockReason }` 来停止安装。

`block: true` 是终止性决定。`block: false` 会被视为未作决定。

## Gateway 网关生命周期

对于需要依赖 Gateway 网关所拥有状态的插件服务，请使用 `gateway_start`。上下文会暴露 `ctx.config`、`ctx.workspaceDir` 以及用于检查和更新 cron 的 `ctx.getCron?.()`。使用 `gateway_stop` 清理长期运行的资源。

不要依赖内部的 `gateway:startup` 钩子来运行由插件拥有的运行时服务。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [内部钩子](/zh-CN/automation/hooks)
- [插件架构内部机制](/zh-CN/plugins/architecture-internals)
