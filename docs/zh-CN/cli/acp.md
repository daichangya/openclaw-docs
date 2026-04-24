---
read_when:
    - 设置基于 ACP 的 IDE 集成
    - 调试 ACP 会话路由到 Gateway 网关
summary: 为 IDE 集成运行 ACP 桥接器
title: ACP
x-i18n:
    generated_at: "2026-04-24T02:39:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04a1413c23464489a192f5d99cd97f128c0ddc080f3ae637073147a2b07ce305
    source_path: cli/acp.md
    workflow: 15
---

运行与 OpenClaw Gateway 网关通信的 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 桥接器。

此命令通过 `stdio` 为 IDE 提供 ACP，并通过 WebSocket 将提示转发到 Gateway 网关。
它会让 ACP 会话持续映射到 Gateway 网关会话键。

`openclaw acp` 是一个由 Gateway 网关支持的 ACP 桥接器，不是完整的 ACP 原生编辑器
运行时。它专注于会话路由、提示传递和基础的流式更新。

如果你希望外部 MCP 客户端直接与 OpenClaw 渠道
会话通信，而不是托管 ACP harness 会话，请改用
[`openclaw mcp serve`](/zh-CN/cli/mcp)。

## 这不是什么

此页面经常与 ACP harness 会话混淆。

`openclaw acp` 的含义是：

- OpenClaw 充当 ACP 服务器
- IDE 或 ACP 客户端连接到 OpenClaw
- OpenClaw 将这些工作转发到 Gateway 网关会话中

这不同于 [ACP Agents](/zh-CN/tools/acp-agents)，后者中 OpenClaw 会通过 `acpx` 运行
外部 harness，例如 Codex 或 Claude Code。

快速规则：

- 编辑器/客户端想通过 ACP 与 OpenClaw 通信：使用 `openclaw acp`
- OpenClaw 应启动 Codex/Claude/Gemini 作为 ACP harness：使用 `/acp spawn` 和 [ACP Agents](/zh-CN/tools/acp-agents)

## 兼容性矩阵

| ACP 区域                                                              | 状态 | 说明                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 已实现 | 通过 `stdio` 到 Gateway 网关 chat/send + abort 的核心桥接流程。                                                                                                                                                                         |
| `listSessions`, 斜杠命令                                               | 已实现 | 会话列表基于 Gateway 网关会话状态工作；命令通过 `available_commands_update` 进行通告。                                                                                                                                                  |
| `loadSession`                                                         | 部分支持 | 将 ACP 会话重新绑定到 Gateway 网关会话键，并重放存储的用户/助手文本历史。工具/系统历史尚未重建。                                                                                                                                       |
| 提示内容（`text`、嵌入式 `resource`、图片）                           | 部分支持 | 文本/资源会被展平为 chat 输入；图片会成为 Gateway 网关附件。                                                                                                                                                                             |
| 会话模式                                                              | 部分支持 | 支持 `session/set_mode`，并且桥接器公开了初始的 Gateway 网关支持会话控制，用于 thought level、tool verbosity、reasoning、usage detail 和 elevated actions。更广泛的 ACP 原生模式/配置表面仍不在当前范围内。                            |
| 会话信息和用量更新                                                    | 部分支持 | 桥接器会根据缓存的 Gateway 网关会话快照发出 `session_info_update` 和尽力而为的 `usage_update` 通知。用量是近似值，且仅当 Gateway 网关将 token 总量标记为最新时才会发送。                                                             |
| 工具流式传输                                                          | 部分支持 | `tool_call` / `tool_call_update` 事件会包含原始 I/O、文本内容，以及当 Gateway 网关工具参数/结果暴露这些信息时尽力而为提供的文件位置。嵌入式终端和更丰富的原生 Diffs 输出仍未暴露。                                                     |
| 每会话 MCP 服务器（`mcpServers`）                                     | 不支持 | 桥接模式会拒绝每会话 MCP 服务器请求。请改为在 OpenClaw gateway 或智能体上配置 MCP。                                                                                                                                                     |
| 客户端文件系统方法（`fs/read_text_file`, `fs/write_text_file`）       | 不支持 | 该桥接器不会调用 ACP 客户端文件系统方法。                                                                                                                                                                                                |
| 客户端终端方法（`terminal/*`）                                        | 不支持 | 该桥接器不会创建 ACP 客户端终端，也不会通过工具调用流式传输终端 ID。                                                                                                                                                                    |
| 会话计划 / thought 流式传输                                           | 不支持 | 该桥接器当前会发出输出文本和工具状态，而不是 ACP 计划或 thought 更新。                                                                                                                                                                  |

## 已知限制

- `loadSession` 会重放存储的用户和助手文本历史，但不会
  重建历史工具调用、系统通知或更丰富的 ACP 原生事件
  类型。
- 如果多个 ACP 客户端共享同一个 Gateway 网关会话键，事件和取消
  路由将是尽力而为，而不是严格按客户端完全隔离。若你需要
  干净的编辑器本地轮次，优先使用默认隔离的 `acp:<uuid>` 会话。
- Gateway 网关停止状态会被转换为 ACP 停止原因，但这种映射
  不如完整 ACP 原生运行时那样具有表现力。
- 初始会话控制当前只公开一组聚焦的 Gateway 网关旋钮：
  thought level、tool verbosity、reasoning、usage detail 和 elevated
  actions。模型选择和 exec-host 控制尚未作为 ACP
  配置选项公开。
- `session_info_update` 和 `usage_update` 来源于 Gateway 网关会话
  快照，而不是实时 ACP 原生运行时统计。用量是近似值，
  不包含成本数据，并且仅在 Gateway 网关将总 token
  数据标记为最新时发出。
- 工具跟随数据是尽力而为的。桥接器可以公开已知工具参数/结果中
  出现的文件路径，但它尚不会发出 ACP 终端或
  结构化文件 Diffs。

## 用法

```bash
openclaw acp

# 远程 Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# 远程 Gateway（从文件读取 token）
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 附加到现有会话键
openclaw acp --session agent:main:main

# 按标签附加（必须已存在）
openclaw acp --session-label "support inbox"

# 在第一个提示之前重置会话键
openclaw acp --session agent:main:main --reset-session
```

## ACP 客户端（调试）

使用内置 ACP 客户端在没有 IDE 的情况下对桥接器进行安装完整性检查。
它会启动 ACP 桥接器，并允许你以交互方式输入提示。

```bash
openclaw acp client

# 让启动的桥接器指向远程 Gateway 网关
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 覆盖服务器命令（默认：openclaw）
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

权限模型（客户端调试模式）：

- 自动批准基于 allowlist，并且只适用于受信任的核心工具 ID。
- `read` 自动批准仅限当前工作目录（设置了 `--cwd` 时）。
- ACP 仅会自动批准范围很窄的只读类别：活动 cwd 下受限的 `read` 调用，以及只读搜索工具（`search`、`web_search`、`memory_search`）。未知/非核心工具、超范围读取、可执行工具、控制平面工具、变更型工具和交互式流程始终需要显式提示批准。
- 服务器提供的 `toolCall.kind` 被视为不受信任的元数据（不是授权来源）。
- 此 ACP 桥接器策略独立于 ACPX harness 权限。如果你通过 `acpx` 后端运行 OpenClaw，`plugins.entries.acpx.config.permissionMode=approve-all` 是该 harness 会话的紧急放开式 “yolo” 开关。

## 如何使用

当 IDE（或其他客户端）支持 Agent Client Protocol，并且你希望
它驱动一个 OpenClaw Gateway 网关会话时，请使用 ACP。

1. 确保 Gateway 网关正在运行（本地或远程）。
2. 配置 Gateway 网关目标（配置或标志）。
3. 让你的 IDE 通过 `stdio` 运行 `openclaw acp`。

示例配置（持久化）：

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

示例直接运行（不写入配置）：

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# 本地进程安全时优先推荐
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 选择智能体

ACP 不会直接选择智能体。它按 Gateway 网关会话键进行路由。

使用带有智能体作用域的会话键来定位特定智能体：

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每个 ACP 会话都映射到单个 Gateway 网关会话键。一个智能体可以拥有多个
会话；除非你覆盖该键或标签，否则 ACP 默认使用隔离的 `acp:<uuid>` 会话。

桥接模式不支持每会话 `mcpServers`。如果 ACP 客户端
在 `newSession` 或 `loadSession` 期间发送它们，桥接器会返回清晰的
错误，而不是静默忽略。

如果你希望由 ACPX 支持的会话看到 OpenClaw 插件工具或选定的
内置工具，例如 `cron`，请启用 Gateway 网关侧的 ACPX MCP 桥接，
而不是尝试传递每会话 `mcpServers`。请参见
[ACP Agents](/zh-CN/tools/acp-agents-setup#plugin-tools-mcp-bridge) 和
[OpenClaw tools MCP bridge](/zh-CN/tools/acp-agents-setup#openclaw-tools-mcp-bridge)。

## 从 `acpx` 使用（Codex、Claude、其他 ACP 客户端）

如果你希望 Codex 或 Claude Code 这类编码智能体
通过 ACP 与你的 OpenClaw bot 通信，请使用带有其内置 `openclaw` 目标的 `acpx`。

典型流程：

1. 运行 Gateway 网关，并确保 ACP 桥接器可以访问它。
2. 让 `acpx openclaw` 指向 `openclaw acp`。
3. 定位你希望编码智能体使用的 OpenClaw 会话键。

示例：

```bash
# 向你的默认 OpenClaw ACP 会话发送一次性请求
acpx openclaw exec "Summarize the active OpenClaw session state."

# 用于后续轮次的持久命名会话
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果你希望 `acpx openclaw` 每次都定位特定的 Gateway 网关和会话键，
请在 `~/.acpx/config.json` 中覆盖 `openclaw` 智能体命令：

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

对于仓库本地的 OpenClaw 检出，请使用直接 CLI 入口点，而不是
dev runner，这样 ACP 流才能保持干净。例如：

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

这是让 Codex、Claude Code 或其他支持 ACP 的客户端
从 OpenClaw 智能体提取上下文信息、而无需抓取终端内容的最简单方式。

## Zed 编辑器设置

在 `~/.config/zed/settings.json` 中添加一个自定义 ACP 智能体（或使用 Zed 的设置 UI）：

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

若要定位特定 Gateway 网关或智能体：

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

在 Zed 中，打开 Agent 面板并选择“OpenClaw ACP”以启动一个线程。

## 会话映射

默认情况下，ACP 会话会获得一个带有 `acp:` 前缀的隔离 Gateway 网关会话键。
若要复用已知会话，请传入会话键或标签：

- `--session <key>`：使用特定 Gateway 网关会话键。
- `--session-label <label>`：按标签解析现有会话。
- `--reset-session`：为该键生成一个新的会话 id（同一键，新 transcript）。

如果你的 ACP 客户端支持元数据，则可以按会话覆盖：

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

在 [/concepts/session](/zh-CN/concepts/session) 了解有关会话键的更多信息。

## 选项

- `--url <url>`：Gateway WebSocket URL（若已配置，默认为 `gateway.remote.url`）。
- `--token <token>`：Gateway 网关认证 token。
- `--token-file <path>`：从文件读取 Gateway 网关认证 token。
- `--password <password>`：Gateway 网关认证密码。
- `--password-file <path>`：从文件读取 Gateway 网关认证密码。
- `--session <key>`：默认会话键。
- `--session-label <label>`：要解析的默认会话标签。
- `--require-existing`：如果会话键/标签不存在则失败。
- `--reset-session`：在首次使用前重置会话键。
- `--no-prefix-cwd`：不要在提示前添加工作目录前缀。
- `--provenance <off|meta|meta+receipt>`：包含 ACP 来源元数据或回执。
- `--verbose, -v`：向 `stderr` 输出详细日志。

安全说明：

- 在某些系统上，`--token` 和 `--password` 可能会出现在本地进程列表中。
- 优先使用 `--token-file`/`--password-file` 或环境变量（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）。
- Gateway 网关认证解析遵循其他 Gateway 网关客户端使用的共享契约：
  - 本地模式：环境变量（`OPENCLAW_GATEWAY_*`）-> `gateway.auth.*` -> 仅当 `gateway.auth.*` 未设置时才回退到 `gateway.remote.*`（已配置但未解析的本地 SecretRefs 将以失败关闭）
  - 远程模式：`gateway.remote.*`，并按远程优先级规则进行环境变量/配置回退
  - `--url` 可安全覆盖，不会复用隐式配置/环境变量凭证；请传入显式 `--token`/`--password`（或其文件变体）
- ACP 运行时后端子进程会接收 `OPENCLAW_SHELL=acp`，可用于上下文特定的 shell/profile 规则。
- `openclaw acp client` 会在其启动的桥接器进程上设置 `OPENCLAW_SHELL=acp-client`。

### `acp client` 选项

- `--cwd <dir>`：ACP 会话的工作目录。
- `--server <command>`：ACP 服务器命令（默认：`openclaw`）。
- `--server-args <args...>`：传递给 ACP 服务器的额外参数。
- `--server-verbose`：在 ACP 服务器上启用详细日志。
- `--verbose, -v`：详细客户端日志。
