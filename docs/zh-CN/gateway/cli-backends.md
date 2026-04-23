---
read_when:
    - 当 API 提供商失效时，你希望有一个可靠的回退方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并希望复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP loopback bridge
summary: CLI 后端：本地 AI CLI 回退，支持可选的 MCP 工具桥接
title: CLI 后端
x-i18n:
    generated_at: "2026-04-23T07:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 后端（回退运行时）

当 API 提供商宕机、被限流或暂时异常时，OpenClaw 可以运行**本地 AI CLI** 作为**纯文本回退**。这是一种有意保守的设计：

- **OpenClaw 工具不会被直接注入**，但设置了 `bundleMcp: true` 的后端可以通过 loopback MCP bridge 接收 gateway 工具。
- 为支持该能力的 CLI 提供 **JSONL 流式传输**。
- **支持会话**（因此后续轮次能保持连贯）。
- 如果 CLI 接受图像路径，**图像可以透传**。

这被设计为一种**安全网**，而不是主路径。当你希望在不依赖外部 API 的情况下获得“始终可用”的文本响应时，可以使用它。

如果你需要具备 ACP 会话控制、后台任务、线程/会话绑定以及持久化外部编码会话的完整 harness 运行时，请改用 [ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以**无需任何配置**使用 Codex CLI（内置 OpenAI 插件
会注册一个默认后端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

如果你的 gateway 在 launchd/systemd 下运行，且 PATH 很精简，只需添加
命令路径：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

就这样。无需 key，也无需除 CLI 本身之外的额外身份验证配置。

如果你在 gateway 主机上将某个内置 CLI 后端用作**主要消息提供商**，当你的配置
在模型引用中或在
`agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载其所属的内置插件。

## 将其用作回退

将 CLI 后端添加到你的回退列表中，这样它只会在主模型失败时运行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

说明：

- 如果你使用 `agents.defaults.models`（允许列表），也必须在其中包含你的 CLI 后端模型。
- 如果主提供商失败（身份验证、限流、超时），OpenClaw 将
  接着尝试 CLI 后端。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以一个**提供商 id** 作为键（例如 `codex-cli`、`my-cli`）。
该提供商 id 会成为你的模型引用左侧部分：

```
<provider>/<model>
```

### 配置示例

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // 对于 Codex 风格的 CLI，也可以改为指向 prompt 文件：
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## 工作原理

1. 根据提供商前缀选择后端（`codex-cli/...`）。
2. 使用相同的 OpenClaw prompt + 工作区上下文构建系统 prompt。
3. 使用会话 id 执行 CLI（如果支持），以保持历史一致。
   内置的 `claude-cli` 后端会为每个
   OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. 解析输出（JSON 或纯文本），并返回最终文本。
5. 为每个后端持久化会话 id，使后续轮次复用相同的 CLI 会话。

<Note>
内置的 Anthropic `claude-cli` 后端现已重新支持。Anthropic 工作人员
告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此除非 Anthropic 发布
新政策，否则 OpenClaw 会将用于此集成的 `claude -p` 用法视为已获许可。
</Note>

内置的 OpenAI `codex-cli` 后端通过
Codex 的 `model_instructions_file` 配置覆盖项（`-c
model_instructions_file="..."`）传递 OpenClaw 的系统 prompt。Codex 不提供类似 Claude 的
`--append-system-prompt` 标志，因此 OpenClaw 会为每个新的 Codex CLI 会话将组装后的 prompt 写入一个
临时文件。

内置的 Anthropic `claude-cli` 后端会通过两种方式接收 OpenClaw 的 Skills 快照：
一种是附加系统 prompt 中的紧凑型 OpenClaw Skills 目录，另一种是
通过 `--plugin-dir` 传入的临时 Claude Code 插件。该插件仅包含当前智能体/会话可用的 Skills，因此 Claude Code 的原生 skill 解析器看到的过滤结果，与 OpenClaw 原本会在 prompt 中公开的集合保持一致。Skill 环境变量/API key 覆盖仍然会由 OpenClaw 应用到该次运行的子进程环境中。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（占位符 `{sessionId}`），适用于需要将 ID 插入
  多个标志的场景。
- 如果 CLI 使用带有不同标志的**恢复子命令**，请设置
  `resumeArgs`（恢复时替换 `args`），并可选设置 `resumeOutput`
  （用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果未存储，则生成新的 UUID）。
  - `existing`：仅当之前已存储会话 id 时才发送。
  - `none`：从不发送会话 id。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"`，
  和 `input: "stdin"`，因此只要该 Claude 进程仍然活跃，后续轮次就会复用这个活动进程。现在 warm stdio 已是默认值，包括那些省略传输字段的自定义配置。
  如果 Gateway 网关重启，或空闲进程退出，OpenClaw 会从已存储的 Claude 会话 id 恢复。已存储的会话
  id 会先针对现有、可读的项目 transcript 进行验证后再恢复，因此虚假的绑定会以 `reason=transcript-missing`
  被清除，而不是在 `--resume` 下静默启动一个新的 Claude CLI 会话。
- 已存储的 CLI 会话属于提供商拥有的连续性。隐式的每日会话
  重置不会切断它们；`/reset` 和显式 `session.reset` 策略仍然会切断。

串行化说明：

- `serialize: true` 会保持同一通道中的运行顺序。
- 大多数 CLI 会在一个提供商通道中串行执行。
- 当所选身份验证身份发生变化时，OpenClaw 会丢弃已存储 CLI 会话的复用，
  包括 auth profile id 变化、静态 API key 变化、静态 token 变化，或
  当 CLI 暴露了稳定 OAuth 账户身份时该身份的变化。OAuth access 和 refresh token
  的轮换不会切断已存储的 CLI 会话。如果某个 CLI 不暴露稳定的 OAuth 账户 id，OpenClaw 会让该 CLI 自行强制执行恢复权限。

## 图像（透传）

如果你的 CLI 接受图像路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图像写入临时文件。如果设置了 `imageArg`，这些
路径会作为 CLI 参数传递。如果缺少 `imageArg`，OpenClaw 会将
文件路径附加到 prompt 中（路径注入），这对于那些会从普通路径自动
加载本地文件的 CLI 已经足够。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON，并提取文本 + 会话 id。
- 对于 Gemini CLI 的 JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从
  `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并提取最终智能体消息以及存在时的会话
  标识符。
- `output: "text"` 将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）将 prompt 作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送 prompt。
- 如果 prompt 很长且设置了 `maxPromptArgChars`，则会使用 stdin。

## 默认值（由插件拥有）

内置 OpenAI 插件还为 `codex-cli` 注册了一个默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置 Google 插件还为 `google-gemini-cli` 注册了一个默认值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且可作为
`gemini` 在 `PATH` 中使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON 的 `response` 字段读取。
- 当 `usage` 缺失或为空时，用量会回退到 `stats`。
- `stats.cached` 会被规范化为 OpenClaw `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 会从
  `stats.input_tokens - stats.cached` 推导输入 token 数。

仅在需要时覆盖（常见情况：使用绝对 `command` 路径）。

## 插件拥有的默认值

CLI 后端默认值现在已成为插件表面的一部分：

- 插件使用 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍会覆盖插件默认值。
- 后端特定的配置清理仍由插件通过可选的
  `normalizeConfig` hook 拥有。

需要微小 prompt/消息兼容性 shim 的插件，可以声明双向文本转换，而无需替换提供商或 CLI 后端：

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` 会重写传递给 CLI 的系统 prompt 和用户 prompt。`output`
会在 OpenClaw 处理其自身控制标记和渠道投递之前，重写流式 assistant 增量和解析后的最终文本。

对于输出 Claude Code stream-json 兼容 JSONL 的 CLI，请在该后端配置上设置
`jsonlDialect: "claude-stream-json"`。

## Bundle MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但某个后端可以
通过 `bundleMcp: true` 选择加入自动生成的 MCP 配置覆盖层。

当前内置行为：

- `claude-cli`：生成严格的 MCP 配置文件
- `codex-cli`：为 `mcp_servers` 提供内联配置覆盖
- `google-gemini-cli`：生成 Gemini 系统设置文件

启用 bundle MCP 时，OpenClaw 会：

- 启动一个 loopback HTTP MCP 服务器，将 gateway 工具暴露给 CLI 进程
- 使用每会话 token（`OPENCLAW_MCP_TOKEN`）对 bridge 进行身份验证
- 将工具访问范围限定到当前会话、账户和渠道上下文
- 为当前工作区加载已启用的 bundle-MCP 服务器
- 将它们与任何现有的后端 MCP 配置/设置结构合并
- 使用所属扩展中由后端拥有的集成模式重写启动配置

如果未启用任何 MCP 服务器，当某个后端选择启用 bundle MCP 时，OpenClaw 仍会注入严格配置，以便后台运行保持隔离。

## 限制

- **不支持直接 OpenClaw 工具调用。** OpenClaw 不会将工具调用注入到
  CLI 后端协议中。只有在后端选择加入
  `bundleMcp: true` 时，它们才会看到 gateway 工具。
- **流式传输是后端特定的。** 有些后端流式输出 JSONL；另一些则会缓冲
  直到退出。
- **结构化输出** 取决于 CLI 的 JSON 格式。
- **Codex CLI 会话** 通过文本输出恢复（不是 JSONL），其结构化程度
  低于初始 `--json` 运行。不过 OpenClaw 会话本身仍可正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保已设置 `sessionArg`，并且 `sessionMode` 不是
  `none`（Codex CLI 当前无法使用 JSON 输出恢复）。
- **图像被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。
