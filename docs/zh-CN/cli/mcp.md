---
read_when:
    - 将 Codex、Claude Code 或其他 MCP 客户端连接到 OpenClaw 支持的渠道
    - 运行 `openclaw mcp serve`
    - 管理 OpenClaw 已保存的 MCP 服务器定义
summary: 通过 MCP 暴露 OpenClaw 渠道会话，并管理已保存的 MCP 服务器定义
title: MCP
x-i18n:
    generated_at: "2026-04-23T20:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1af58dd0e2ff911c5e62fe03420f6bb26fe55a61e751ccf2b8e781f68764829f
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` 有两个用途：

- 使用 `openclaw mcp serve` 将 OpenClaw 作为 MCP 服务器运行
- 使用 `list`、`show`、
  `set` 和 `unset` 管理由 OpenClaw 拥有的出站 MCP 服务器定义

换句话说：

- `serve` 表示 OpenClaw 作为 MCP 服务器运行
- `list` / `show` / `set` / `unset` 表示 OpenClaw 作为其他 MCP 服务器的 MCP 客户端侧注册表，
  供其运行时在后续消费

当 OpenClaw 应自行托管一个编码 harness
会话并通过 ACP 路由该运行时时，请使用 [`openclaw acp`](/zh-CN/cli/acp)。

## OpenClaw 作为 MCP 服务器

这是 `openclaw mcp serve` 路径。

## 何时使用 `serve`

在以下情况下使用 `openclaw mcp serve`：

- Codex、Claude Code 或其他 MCP 客户端应直接与
  OpenClaw 支持的渠道会话通信
- 你已经有一个本地或远程的 OpenClaw Gateway 网关，并且已有已路由的会话
- 你希望使用一个可跨 OpenClaw 渠道后端工作的 MCP 服务器，
  而不是为每个渠道单独运行桥接器

当 OpenClaw 应自行托管编码
运行时，并将智能体会话保留在 OpenClaw 内部时，请改用 [`openclaw acp`](/zh-CN/cli/acp)。

## 工作原理

`openclaw mcp serve` 会启动一个 stdio MCP 服务器。该
进程由 MCP 客户端拥有。当客户端保持 stdio 会话开启时，桥接器会通过 WebSocket 连接到
本地或远程 OpenClaw Gateway 网关，并通过 MCP 暴露已路由的渠道会话。

生命周期：

1. MCP 客户端启动 `openclaw mcp serve`
2. 桥接器连接到 Gateway 网关
3. 已路由的会话会成为 MCP 会话和 transcript/history 工具
4. 当桥接器保持连接时，实时事件会在内存中排队
5. 如果启用了 Claude 渠道模式，同一会话还可以接收
   Claude 专用的推送通知

重要行为：

- 实时队列状态会在桥接器连接时开始
- 较早的 transcript 历史会通过 `messages_read` 读取
- Claude 推送通知仅在 MCP 会话存活期间存在
- 当客户端断开连接时，桥接器会退出，实时队列也会消失
- 由 OpenClaw 启动的 stdio MCP 服务器（内置或用户配置）
  会在关闭时按进程树拆理，因此服务器启动的子进程不会在父 stdio 客户端退出后继续存活
- 删除或重置会话时，会通过共享运行时清理路径释放该会话的 MCP 客户端，
  因此不会有绑定到已移除会话上的残留 stdio 连接

## 选择客户端模式

以两种不同方式使用同一个桥接器：

- 通用 MCP 客户端：仅使用标准 MCP 工具。使用 `conversations_list`、
  `messages_read`、`events_poll`、`events_wait`、`messages_send` 以及
  approval 工具。
- Claude Code：标准 MCP 工具加上 Claude 专用渠道适配器。
  启用 `--claude-channel-mode on`，或保留默认值 `auto`。

目前，`auto` 的行为与 `on` 相同。尚未支持客户端能力检测。

## `serve` 暴露的内容

该桥接器使用现有的 Gateway 网关会话路由元数据来暴露渠道支持的会话。当 OpenClaw 已经拥有带有已知路由的会话状态时，会出现一个会话，例如：

- `channel`
- 接收者或目标元数据
- 可选的 `accountId`
- 可选的 `threadId`

这为 MCP 客户端提供了一个统一位置，用于：

- 列出最近的已路由会话
- 读取最近的 transcript 历史
- 等待新的入站事件
- 通过相同路由发送回复
- 查看桥接器连接期间到达的 approval 请求

## 用法

```bash
# 本地 Gateway 网关
openclaw mcp serve

# 远程 Gateway 网关
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 使用密码认证的远程 Gateway 网关
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 启用详细桥接日志
openclaw mcp serve --verbose

# 禁用 Claude 专用推送通知
openclaw mcp serve --claude-channel-mode off
```

## 桥接工具

当前桥接器暴露以下 MCP 工具：

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

列出最近的、已存在于 Gateway 网关会话状态中并带有路由元数据的会话支持会话。

常用过滤器：

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

按 `session_key` 返回一个会话。

### `messages_read`

读取一个会话支持会话的最近 transcript 消息。

### `attachments_fetch`

从单条 transcript 消息中提取非文本消息内容块。这是
针对 transcript 内容的元数据视图，而不是独立的持久 attachment blob
存储。

### `events_poll`

从数值游标之后读取已排队的实时事件。

### `events_wait`

长轮询，直到下一个匹配的已排队事件到达，或超时到期。

当通用 MCP 客户端需要接近实时的交付，而又不使用
Claude 专用推送协议时，请使用此工具。

### `messages_send`

通过会话上已记录的相同路由回发文本。

当前行为：

- 需要已存在的会话路由
- 使用该会话的 channel、recipient、account id 和 thread id
- 仅发送文本

### `permissions_list_open`

列出桥接器自连接到 Gateway 网关以来观察到的待处理 exec/plugin approval 请求。

### `permissions_respond`

以以下方式处理一个待处理的 exec/plugin approval 请求：

- `allow-once`
- `allow-always`
- `deny`

## 事件模型

桥接器在连接期间会在内存中保留一个事件队列。

当前事件类型：

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

重要限制：

- 队列仅限实时；它会在 MCP 桥接器启动时开始
- `events_poll` 和 `events_wait` 本身不会回放较旧的 Gateway 网关历史
- 持久化积压内容应通过 `messages_read` 读取

## Claude 渠道通知

桥接器还可以暴露 Claude 专用的渠道通知。这相当于
OpenClaw 版本的 Claude Code 渠道适配器：标准 MCP 工具仍然可用，
但实时入站消息也可以作为 Claude 专用 MCP 通知到达。

标志：

- `--claude-channel-mode off`：仅标准 MCP 工具
- `--claude-channel-mode on`：启用 Claude 渠道通知
- `--claude-channel-mode auto`：当前默认值；桥接行为与 `on` 相同

启用 Claude 渠道模式后，服务器会声明 Claude 实验性能力，并可发出：

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

当前桥接行为：

- 入站的 `user` transcript 消息会被转发为
  `notifications/claude/channel`
- 通过 MCP 收到的 Claude 权限请求会在内存中跟踪
- 如果关联会话随后发送 `yes abcde` 或 `no abcde`，桥接器
  会将其转换为 `notifications/claude/channel/permission`
- 这些通知仅存在于实时会话中；如果 MCP 客户端断开连接，
  就没有可推送的目标

这是有意设计为客户端专用的。通用 MCP 客户端应依赖
标准轮询工具。

## MCP 客户端配置

示例 stdio 客户端配置：

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

对于大多数通用 MCP 客户端，请先使用标准工具表面并忽略
Claude 模式。只有当客户端确实理解 Claude 专用通知方法时，
才打开 Claude 模式。

## 选项

`openclaw mcp serve` 支持：

- `--url <url>`：Gateway 网关 WebSocket URL
- `--token <token>`：Gateway 网关 token
- `--token-file <path>`：从文件读取 token
- `--password <password>`：Gateway 网关密码
- `--password-file <path>`：从文件读取密码
- `--claude-channel-mode <auto|on|off>`：Claude 通知模式
- `-v`, `--verbose`：在 stderr 输出详细日志

如有可能，优先使用 `--token-file` 或 `--password-file`，而不是内联密钥。

## 安全性与信任边界

桥接器不会自行发明路由。它只会暴露 Gateway 网关
已经知道如何路由的会话。

这意味着：

- 发送者允许列表、配对和渠道级信任仍属于底层
  OpenClaw 渠道配置
- `messages_send` 只能通过现有的已存储路由进行回复
- approval 状态仅对当前桥接会话实时/内存有效
- 桥接认证应使用与你信任任何其他远程 Gateway 网关客户端时相同的
  Gateway 网关 token 或密码控制

如果某个会话未出现在 `conversations_list` 中，通常原因不是
MCP 配置，而是底层 Gateway 网关会话中缺少或不完整的路由元数据。

## 测试

OpenClaw 为此桥接器提供了一个确定性的 Docker 冒烟测试：

```bash
pnpm test:docker:mcp-channels
```

该冒烟测试会：

- 启动一个带有种子数据的 Gateway 网关容器
- 启动第二个容器，并在其中运行 `openclaw mcp serve`
- 验证会话发现、transcript 读取、attachment 元数据读取、
  实时事件队列行为以及出站发送路由
- 通过真实的 stdio MCP 桥接验证 Claude 风格的渠道与权限通知

这是在不接入真实
Telegram、Discord 或 iMessage 账户到测试运行中的情况下，证明该桥接有效的最快方法。

关于更广泛的测试背景，请参见 [Testing](/zh-CN/help/testing)。

## 故障排除

### 没有返回任何会话

通常表示 Gateway 网关会话尚不可路由。请确认底层
会话已存储 channel/provider、recipient，以及可选的
account/thread 路由元数据。

### `events_poll` 或 `events_wait` 漏掉较早消息

这是预期行为。实时队列从桥接器连接时开始。请使用 `messages_read`
读取较早的 transcript 历史。

### Claude 通知未显示

请检查以下所有项：

- 客户端保持了 stdio MCP 会话处于打开状态
- `--claude-channel-mode` 为 `on` 或 `auto`
- 客户端确实理解 Claude 专用通知方法
- 入站消息发生在桥接器连接之后

### 缺少 approval

`permissions_list_open` 仅显示桥接器连接期间观察到的 approval 请求。它不是持久化的 approval 历史 API。

## OpenClaw 作为 MCP 客户端注册表

这是 `openclaw mcp list`、`show`、`set` 和 `unset` 路径。

这些命令不会通过 MCP 暴露 OpenClaw。它们管理 OpenClaw 配置中 `mcp.servers` 下由 OpenClaw 拥有的 MCP
服务器定义。

这些已保存的定义供 OpenClaw 稍后启动或配置的运行时使用，
例如内嵌 Pi 和其他运行时适配器。OpenClaw 集中存储这些定义，
这样这些运行时就不需要各自维护重复的
MCP 服务器列表。

重要行为：

- 这些命令只读取或写入 OpenClaw 配置
- 它们不会连接到目标 MCP 服务器
- 它们不会验证该命令、URL 或远程传输当前是否可达
- 运行时适配器会在执行时决定实际支持哪些传输形态
- 内嵌 Pi 会在普通 `coding` 和 `messaging`
  工具配置中暴露已配置的 MCP 工具；`minimal` 仍会隐藏它们，而 `tools.deny: ["bundle-mcp"]`
  会显式禁用它们

## 已保存的 MCP 服务器定义

OpenClaw 还会在配置中存储一个轻量级 MCP 服务器注册表，供
希望使用 OpenClaw 管理 MCP 定义的表面使用。

命令：

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

说明：

- `list` 会对服务器名称排序。
- `show` 在不带名称时会打印完整的已配置 MCP 服务器对象。
- `set` 期望在命令行上传入一个 JSON 对象值。
- `unset` 会在指定服务器不存在时失败。

示例：

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

示例配置结构：

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio 传输

启动一个本地子进程，并通过 stdin/stdout 通信。

| 字段 | 描述 |
| ---- | ---- |
| `command` | 要启动的可执行文件（必填） |
| `args` | 命令行参数数组 |
| `env` | 额外环境变量 |
| `cwd` / `workingDirectory` | 进程的工作目录 |

#### Stdio 环境变量安全过滤器

OpenClaw 会拒绝那些可能在第一次 RPC 之前改变 stdio MCP 服务器启动方式的解释器启动环境变量键，即使它们出现在服务器的 `env` 块中。被阻止的键包括 `NODE_OPTIONS`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4` 以及类似的运行时控制变量。启动时会以配置错误拒绝这些键，这样它们就不能注入隐式前导代码、替换解释器，或对 stdio 进程启用调试器。普通的凭证、代理和服务器专用环境变量（`GITHUB_TOKEN`、`HTTP_PROXY`、自定义 `*_API_KEY` 等）不受影响。

如果你的 MCP 服务器确实需要其中某个被阻止的变量，请将它设置在 gateway 主机进程上，而不是放在 stdio 服务器的 `env` 下。

### SSE / HTTP 传输

通过 HTTP Server-Sent Events 连接到远程 MCP 服务器。

| 字段 | 描述 |
| ---- | ---- |
| `url` | 远程服务器的 HTTP 或 HTTPS URL（必填） |
| `headers` | 可选的 HTTP 请求头键值映射（例如认证 token） |
| `connectionTimeoutMs` | 每服务器连接超时，单位为毫秒（可选） |

示例：

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url` 中的敏感值（userinfo）和 `headers` 中的敏感值会在日志和状态输出中被脱敏。

### Streamable HTTP 传输

`streamable-http` 是除 `sse` 和 `stdio` 之外的另一种传输选项。它使用 HTTP 流式传输与远程 MCP 服务器进行双向通信。

| 字段 | 描述 |
| ---- | ---- |
| `url` | 远程服务器的 HTTP 或 HTTPS URL（必填） |
| `transport` | 设为 `"streamable-http"` 以选择此传输；如果省略，OpenClaw 将使用 `sse` |
| `headers` | 可选的 HTTP 请求头键值映射（例如认证 token） |
| `connectionTimeoutMs` | 每服务器连接超时，单位为毫秒（可选） |

示例：

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

这些命令只管理已保存的配置。它们不会启动渠道桥接器、
打开实时 MCP 客户端会话，也不能证明目标服务器当前可达。

## 当前限制

本页记录的是当前发布版本中的桥接器。

当前限制：

- 会话发现依赖现有的 Gateway 网关会话路由元数据
- 除 Claude 专用适配器外，没有通用推送协议
- 目前还没有消息编辑或 reaction 工具
- HTTP/SSE/streamable-http 传输一次只连接一个远程服务器；尚不支持多路复用上游
- `permissions_list_open` 仅包含桥接器连接期间观察到的 approval
