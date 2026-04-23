---
read_when:
    - 当 API 提供商失效时，你希望有一个可靠的回退方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并希望复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP local loopback 桥接】【。
summary: CLI 后端：带可选 MCP 工具桥接的本地 AI CLI 回退方案
title: CLI 后端
x-i18n:
    generated_at: "2026-04-23T22:14:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14633003fdffeb6061ee365973d78d88443dd24163b14e4ba77fe4e2fe7a450e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 后端（回退运行时）

当 API 提供商不可用、触发速率限制或暂时行为异常时，OpenClaw 可以运行**本地 AI CLI** 作为**纯文本回退方案**。这是有意保持保守的设计：

- **OpenClaw 工具不会被直接注入**，但设置了 `bundleMcp: true` 的后端可以通过 loopback MCP 桥接接收 Gateway 网关工具。
- 对支持该能力的 CLI 提供 **JSONL 分块流式传输**。
- **支持会话**（因此后续轮次能保持连贯）。
- 如果 CLI 接受图片路径，**图片也可以透传**。

这被设计为一种**安全兜底机制**，而不是主要路径。当你希望在不依赖外部 API 的情况下获得“始终可用”的文本响应时，可以使用它。

如果你需要具备 ACP 会话控制、后台任务、线程/对话绑定以及持久化外部编码会话的完整 harness 运行时，请改用 [ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以**无需任何配置**直接使用 Codex CLI（内置 OpenAI 插件会注册一个默认后端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

如果你的 Gateway 网关运行在 launchd/systemd 下，且 PATH 很精简，只需添加命令路径：

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

就是这样。除了 CLI 本身之外，不需要任何密钥，也不需要额外的认证配置。

如果你在 Gateway 网关宿主机上把内置 CLI 后端用作**主要消息提供商**，当你的配置在模型引用中或在 `agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载其所属的内置插件。

## 将其用作回退方案

把 CLI 后端加入你的回退列表，这样它只会在主模型失败时运行：

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

- 如果你使用 `agents.defaults.models`（允许列表），你也必须把 CLI 后端模型包含在其中。
- 如果主提供商失败（认证、速率限制、超时），OpenClaw 接下来会尝试 CLI 后端。

## 配置概览

所有 CLI 后端都位于：

```
agents.defaults.cliBackends
```

每个条目都以**provider id** 为键（例如 `codex-cli`、`my-cli`）。
这个 provider id 会成为模型引用左侧部分：

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
          // Codex 风格的 CLI 也可以改为指向提示词文件：
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

1. 根据 provider 前缀（`codex-cli/...`）**选择一个后端**。
2. 使用相同的 OpenClaw 提示词和工作区上下文**构建系统提示词**。
3. 用会话 id（如果支持）**执行 CLI**，以便历史记录保持一致。  
   内置 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程存活，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本），并返回最终文本。
5. 为每个后端**持久化 session id**，这样后续轮次会复用相同的 CLI 会话。

<Note>
内置的 Anthropic `claude-cli` 后端现已再次受支持。Anthropic 员工告诉我们，允许使用 OpenClaw 风格的 Claude CLI，因此除非 Anthropic 发布新的政策，否则 OpenClaw 会将 `claude -p` 的用法视为该集成的认可方式。
</Note>

内置 OpenAI `codex-cli` 后端会通过 Codex 的 `model_instructions_file` 配置覆盖项（`-c
model_instructions_file="..."`）传递 OpenClaw 的系统提示词。Codex 没有提供类似 Claude 的
`--append-system-prompt` 标志，因此 OpenClaw 会为每个新的 Codex CLI 会话把组装好的提示词写入临时文件。

内置 Anthropic `claude-cli` 后端会通过两种方式接收 OpenClaw 的 Skills 快照：一是附加系统提示词中的精简 OpenClaw Skills 目录，二是通过 `--plugin-dir` 传入的临时 Claude Code 插件。该插件只包含对该智能体/会话符合条件的 Skills，因此 Claude Code 的原生 skill 解析器看到的过滤结果，与 OpenClaw 原本会在提示词中公布的集合一致。对于运行所需的 Skill 环境变量/API 密钥覆盖，仍由 OpenClaw 应用到子进程环境中。

Claude CLI 还有它自己的非交互权限模式。OpenClaw 会将其映射到现有的 exec 策略，而不是增加 Claude 专用配置：当生效的请求 exec 策略为 YOLO（`tools.exec.security: "full"` 且
`tools.exec.ask: "off"`）时，OpenClaw 会添加 `--permission-mode bypassPermissions`。
每个智能体的 `agents.list[].tools.exec` 设置会覆盖该智能体的全局 `tools.exec`。如果你想强制使用其他 Claude 模式，请在 `agents.defaults.cliBackends.claude-cli.args` 和对应的 `resumeArgs` 下设置显式原始后端参数，例如 `--permission-mode default` 或 `--permission-mode acceptEdits`。

在 OpenClaw 可以使用内置 `claude-cli` 后端之前，Claude Code 本身必须已经在同一台主机上登录：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

只有当 `claude` 二进制文件不在 `PATH` 中时，才需要使用 `agents.defaults.cliBackends.claude-cli.command`。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（占位符 `{sessionId}`），以便在需要把 ID 插入多个标志时使用。
- 如果 CLI 使用带不同标志的**恢复子命令**，请设置
  `resumeArgs`（恢复时替换 `args`），并可选设置 `resumeOutput`（用于非 JSON 恢复）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果未存储则生成新的 UUID）。
  - `existing`：仅在之前存储过会话 id 时发送。
  - `none`：从不发送会话 id。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"`，
  以及 `input: "stdin"`，这样在活跃期间后续轮次会复用正在运行的 Claude 进程。
  warm stdio 现在是默认行为，包括那些省略传输字段的自定义配置也是如此。如果 Gateway 网关重启，或空闲进程退出，OpenClaw 会从已存储的 Claude session id 恢复。已存储的 session id 会在恢复前与现有且可读的项目转录记录进行校验，因此虚假的绑定会以 `reason=transcript-missing` 清除，而不是在 `--resume` 下悄悄启动一个新的 Claude CLI 会话。
- 已存储的 CLI 会话属于 provider 所拥有的连续性。隐式的每日会话重置不会切断它们；`/reset` 和显式 `session.reset` 策略仍然会切断。

序列化说明：

- `serialize: true` 会保持同一 lane 的运行按顺序执行。
- 大多数 CLI 都会在一个 provider lane 上串行执行。
- 当所选认证身份发生变化时，OpenClaw 会放弃复用已存储的 CLI 会话，包括 auth profile id、静态 API 密钥、静态令牌，或 CLI 暴露的 OAuth 账户身份发生变化时。OAuth 访问令牌和刷新令牌的轮换不会切断已存储的 CLI 会话。如果某个 CLI 没有暴露稳定的 OAuth 账户 id，OpenClaw 会让该 CLI 自行强制执行恢复权限。

## 图片（透传）

如果你的 CLI 接受图片路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会把 base64 图片写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传入。如果缺少 `imageArg`，OpenClaw 会把文件路径附加到提示词中（路径注入），这对那些能从普通路径自动加载本地文件的 CLI 来说已经足够。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON 并提取文本 + session id。
- 对于 Gemini CLI 的 JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并提取最终智能体消息以及存在时的会话标识符。
- `output: "text"` 会把 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）会把提示词作为最后一个 CLI 参数传入。
- `input: "stdin"` 会通过 stdin 发送提示词。
- 如果提示词很长且设置了 `maxPromptArgChars`，则会改用 stdin。

## 默认值（插件拥有）

内置 OpenAI 插件也为 `codex-cli` 注册了默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置 Google 插件也为 `google-gemini-cli` 注册了默认值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前置要求：本地 Gemini CLI 必须已安装，并且可以通过 `PATH` 中的
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON 的 `response` 字段读取。
- 当 `usage` 不存在或为空时，用量会回退为 `stats`。
- `stats.cached` 会被标准化为 OpenClaw 的 `cacheRead`。
- 如果 `stats.input` 缺失，OpenClaw 会根据
  `stats.input_tokens - stats.cached` 推导输入 token 数。

仅在需要时覆盖即可（常见情况：使用绝对 `command` 路径）。

## 插件拥有的默认值

CLI 后端默认值现在属于插件表面的一部分：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- 后端 `id` 会成为模型引用中的 provider 前缀。
- 位于 `agents.defaults.cliBackends.<id>` 的用户配置仍会覆盖插件默认值。
- 后端特定的配置清理由插件通过可选的
  `normalizeConfig` hook 继续拥有。

需要进行极小提示词/消息兼容性适配的插件，可以声明双向文本转换，而无需替换 provider 或 CLI 后端：

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

`input` 会重写传给 CLI 的系统提示词和用户提示词。`output`
会在 OpenClaw 处理其自身控制标记和渠道投递之前，重写流式 assistant 增量内容以及解析后的最终文本。

对于输出与 Claude Code stream-json 兼容的 JSONL 的 CLI，请在该后端配置上设置
`jsonlDialect: "claude-stream-json"`。

## 内置 MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但后端可以通过设置
`bundleMcp: true` 选择加入生成的 MCP 配置覆盖层。

当前内置行为：

- `claude-cli`：生成的严格 MCP 配置文件
- `codex-cli`：针对 `mcp_servers` 的内联配置覆盖；生成的 OpenClaw loopback 服务器会标记为 Codex 的按服务器工具批准模式，因此 MCP 调用不会因本地批准提示而卡住
- `google-gemini-cli`：生成的 Gemini system settings 文件

启用 bundle MCP 时，OpenClaw 会：

- 启动一个 loopback HTTP MCP 服务器，向 CLI 进程暴露 Gateway 网关工具
- 使用每个会话单独的令牌（`OPENCLAW_MCP_TOKEN`）对桥接进行认证
- 将工具访问范围限定在当前会话、账户和渠道上下文中
- 为当前工作区加载已启用的 bundle-MCP 服务器
- 将它们与任何现有后端 MCP 配置/设置结构合并
- 使用所属扩展中的后端自有集成模式重写启动配置

如果没有启用任何 MCP 服务器，只要某个后端选择启用 bundle MCP，OpenClaw 仍会注入严格配置，以便后台运行保持隔离。

## 限制

- **没有直接的 OpenClaw 工具调用。** OpenClaw 不会将工具调用直接注入 CLI 后端协议。只有在后端选择启用 `bundleMcp: true` 时，后端才能看到 Gateway 网关工具。
- **流式传输是后端特定的。** 某些后端会流式输出 JSONL；其他后端则会一直缓冲到退出时。
- **结构化输出** 取决于 CLI 的 JSON 格式。
- **Codex CLI 会话** 通过文本输出恢复（不是 JSONL），其结构化程度低于初始 `--json` 运行。不过 OpenClaw 会话本身仍可正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射为 CLI 模型。
- **没有会话连续性**：确保设置了 `sessionArg`，并且 `sessionMode` 不是 `none`（Codex CLI 当前无法使用 JSON 输出恢复）。
- **图片被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。
