---
read_when:
    - 你想在 API 提供商失败时使用可靠的回退方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并希望复用它们
    - 你想了解 CLI 后端工具访问的 MCP loopback 桥接机制
summary: CLI 后端：带可选 MCP 工具桥接的本地 AI CLI 回退方案
title: CLI 后端
x-i18n:
    generated_at: "2026-04-23T20:48:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 86594b886c259df68591223e106c7507ab802321aaedebc9b243793c4f453388
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 后端（回退运行时）

当 API 提供商不可用、
受到速率限制或暂时异常时，OpenClaw 可以将**本地 AI CLI** 作为**纯文本回退方案**运行。这个机制刻意保持保守：

- **不会直接注入 OpenClaw 工具**，但带有 `bundleMcp: true`
  的后端可以通过 loopback MCP 桥接接收 Gateway 网关工具。
- **支持 JSONL 流式传输**，适用于支持该能力的 CLI。
- **支持会话**（因此后续轮次能保持连贯）。
- **如果 CLI 接受图像路径**，则可以传递图像。

这被设计为一种**安全网**，而不是主路径。当你
希望在不依赖外部 API 的情况下获得“始终可用”的文本回复时，可以使用它。

如果你想要具有 ACP 会话控制、后台任务、
线程 / 对话绑定以及持久化外部编码会话的完整 harness 运行时，请使用
[ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以**无需任何配置**使用 Codex CLI（内置 OpenAI 插件
会注册一个默认后端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

如果你的 Gateway 网关运行在 launchd / systemd 下，而 PATH 很精简，只需添加
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

就这样。除了 CLI 本身之外，不需要额外的 key 或认证配置。

如果你在 Gateway 网关主机上将某个内置 CLI 后端用作**主消息提供商**，
而你的配置又在模型引用或
`agents.defaults.cliBackends` 下显式引用了该后端，那么 OpenClaw 现在会自动加载其所属的内置插件。

## 将其作为回退使用

将某个 CLI 后端添加到你的回退列表中，这样它只会在主模型失败时运行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

说明：

- 如果你使用 `agents.defaults.models`（允许列表），你也必须把 CLI 后端模型包含进去。
- 如果主提供商失败（认证、速率限制、超时），OpenClaw 将
  接着尝试 CLI 后端。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以一个**提供商 id** 为键（例如 `codex-cli`、`my-cli`）。
这个提供商 id 会成为你的模型引用左半部分：

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
          // Codex 风格 CLI 可以改为指向提示词文件：
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

1. **根据提供商前缀选择后端**（`codex-cli/...`）。
2. **使用相同的 OpenClaw 提示词 + 工作区上下文构建系统提示词**。
3. **使用会话 id 执行 CLI**（如果支持），以保持历史一致。
   内置的 `claude-cli` 后端会为每个
   OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本），并返回最终文本。
5. **按后端持久化会话 id**，这样后续轮次会复用相同的 CLI 会话。

<Note>
内置 Anthropic `claude-cli` 后端现已重新受支持。Anthropic 工作人员
告诉我们，OpenClaw 风格的 Claude CLI 用法再次被允许，因此 OpenClaw 将
`claude -p` 用法视为此集成的许可用法，除非 Anthropic 发布
新的政策。
</Note>

内置 OpenAI `codex-cli` 后端会通过
Codex 的 `model_instructions_file` 配置覆盖项（`-c
model_instructions_file="..."`）传递 OpenClaw 的系统提示词。Codex 不提供类似 Claude 风格的
`--append-system-prompt` 标志，因此 OpenClaw 会为每个新的 Codex CLI 会话
将组装后的提示词写入一个临时文件。

内置 Anthropic `claude-cli` 后端会通过
两种方式接收 OpenClaw 的 Skills 快照：一种是附加系统提示词中的紧凑 OpenClaw Skills 目录，另一种是
通过 `--plugin-dir` 传入的临时 Claude Code 插件。该插件仅包含对该智能体 / 会话适用的 Skills，
因此 Claude Code 原生 Skills 解析器看到的就是与 OpenClaw 在提示词中会公布的同一套经过筛选的内容。Skill 环境变量 / API key 覆盖仍由 OpenClaw 应用于该次运行的子进程环境。

在 OpenClaw 可以使用内置 `claude-cli` 后端之前，Claude Code 本身必须已经在同一台主机上登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

仅当 `claude`
二进制文件尚未存在于 `PATH` 中时，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（占位符 `{sessionId}`），当需要将 ID 插入
  到多个标志中时使用。
- 如果 CLI 使用带有不同标志的**resume 子命令**，请设置
  `resumeArgs`（恢复时替代 `args`），并可选设置
  `resumeOutput`（用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：总是发送会话 id（如果未存储，则生成新的 UUID）。
  - `existing`：仅在之前已存储会话 id 时发送。
  - `none`：永不发送会话 id。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"`、
  和 `input: "stdin"`，因此后续轮次会在 Claude 进程仍处于活动状态时复用该活动 Claude 进程。
  现在 warm stdio 是默认行为，包括那些省略传输字段的自定义配置
  也是如此。如果 Gateway 网关重启，或者空闲进程
  退出，OpenClaw 会从已存储的 Claude 会话 id 恢复。已存储的会话
  id 会先与现有可读的项目转录进行校验，再执行
  恢复，因此虚假的绑定会以 `reason=transcript-missing`
  被清除，而不是在 `--resume` 下静默启动新的 Claude CLI 会话。
- 已存储的 CLI 会话属于提供商拥有的连续性。隐式的每日会话
  重置不会中断它们；`/reset` 和显式 `session.reset` 策略
  才会。

序列化说明：

- `serialize: true` 会保持同一通道中的运行按顺序执行。
- 大多数 CLI 都会在一个提供商通道上串行化。
- 当所选认证身份发生变化时，OpenClaw 会放弃复用已存储的 CLI 会话，
  包括 auth profile id 变化、静态 API key 变化、静态 token 变化，或
  当 CLI 暴露该信息时 OAuth 账户身份变化。
  OAuth access token 和 refresh token 的轮换不会中断已存储的 CLI 会话。
  如果某个 CLI 不暴露稳定的 OAuth 账户 id，OpenClaw 会让该 CLI 自行强制执行恢复权限。

## 图像（透传）

如果你的 CLI 接受图像路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会将 base64 图像写入临时文件。如果设置了 `imageArg`，
这些路径就会作为 CLI 参数传入。如果缺少 `imageArg`，OpenClaw 会将
文件路径追加到提示词中（路径注入），这足以满足那些会从普通路径自动
加载本地文件的 CLI。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON，并提取文本 + 会话 id。
- 对于 Gemini CLI JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，
  并从 `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并提取最终智能体消息以及会话
  标识符（如果存在）。
- `output: "text"` 将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）将提示词作为最后一个 CLI 参数传递。
- `input: "stdin"` 通过 stdin 发送提示词。
- 如果提示词很长并设置了 `maxPromptArgChars`，则会改用 stdin。

## 默认值（由插件持有）

内置 OpenAI 插件还会为 `codex-cli` 注册一个默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置 Google 插件也会为 `google-gemini-cli` 注册一个默认值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：本地 Gemini CLI 必须已安装，并且可以通过
`PATH` 中的 `gemini` 访问（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON `response` 字段读取。
- 当 `usage` 不存在或为空时，用量回退到 `stats`。
- `stats.cached` 会被标准化为 OpenClaw 的 `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 会根据
  `stats.input_tokens - stats.cached` 推导输入 token 数。

仅在需要时覆盖（常见情况：绝对 `command` 路径）。

## 由插件持有的默认值

CLI 后端默认值现在属于插件表面的一部分：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的提供商前缀。
- 用户在 `agents.defaults.cliBackends.<id>` 中的配置仍会覆盖插件默认值。
- 后端特定的配置清理由插件通过可选
  `normalizeConfig` hook 持有。

需要进行微小提示词 / 消息兼容性调整的插件，可以声明双向文本转换，而无需替换提供商或 CLI 后端：

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

`input` 会重写传递给 CLI 的系统提示词和用户提示词。`output`
会在 OpenClaw 处理其自身控制标记和渠道投递之前，重写流式助手增量和解析后的最终文本。

对于输出 Claude Code stream-json 兼容 JSONL 的 CLI，
请在该后端配置中设置
`jsonlDialect: "claude-stream-json"`。

## Bundle MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但某个后端可以
通过 `bundleMcp: true` 选择启用自动生成的 MCP 配置覆盖层。

当前内置行为：

- `claude-cli`：自动生成严格 MCP 配置文件
- `codex-cli`：`mcp_servers` 的内联配置覆盖
- `google-gemini-cli`：自动生成 Gemini 系统设置文件

启用 bundle MCP 时，OpenClaw 会：

- 启动一个 loopback HTTP MCP 服务器，将 Gateway 网关工具暴露给 CLI 进程
- 使用按会话生成的令牌（`OPENCLAW_MCP_TOKEN`）对桥接进行身份验证
- 将工具访问范围限制在当前会话、账户和渠道上下文中
- 为当前工作区加载已启用的 bundle-MCP 服务器
- 将它们与任何现有的后端 MCP 配置 / 设置结构合并
- 使用所属扩展定义的后端集成模式重写启动配置

如果没有启用任何 MCP 服务器，只要某个
后端选择启用 bundle MCP，OpenClaw 仍会注入严格配置，以便后台运行保持隔离。

## 限制

- **没有直接的 OpenClaw 工具调用。** OpenClaw 不会将工具调用直接注入
  到 CLI 后端协议中。后端只有在选择启用
  `bundleMcp: true` 时，才会看到 Gateway 网关工具。
- **流式传输取决于后端。** 有些后端会流式输出 JSONL；其他后端则会缓冲
  直到退出。
- **结构化输出**取决于 CLI 的 JSON 格式。
- **Codex CLI 会话**通过文本输出恢复（没有 JSONL），因此其结构化程度
  不如初始的 `--json` 运行。不过 OpenClaw 会话本身仍可正常工作。

## 故障排除

- **找不到 CLI：** 请将 `command` 设置为完整路径。
- **模型名称错误：** 使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性：** 请确保已设置 `sessionArg`，且 `sessionMode` 不是
  `none`（Codex CLI 当前无法通过 JSON 输出恢复）。
- **图像被忽略：** 请设置 `imageArg`（并确认 CLI 支持文件路径）。
