---
read_when:
    - 当 API 提供商失败时，你希望有一个可靠的回退方案
    - 你正在运行 Codex CLI 或其他本地 AI CLI，并希望复用它们
    - 你想了解用于 CLI 后端工具访问的 MCP local loopback 桥接器
summary: CLI 后端：带可选 MCP 工具桥接的本地 AI CLI 回退方案
title: CLI 后端
x-i18n:
    generated_at: "2026-04-22T17:40:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d252cf0db426ad091038dd8ce3bc12b810b02f42a4c81d326ec766b21dbadd01
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 后端（回退运行时）

当 API 提供商不可用、触发速率限制或暂时行为异常时，OpenClaw 可以运行**本地 AI CLI** 作为**纯文本回退方案**。这是一种有意保持保守的设计：

- **OpenClaw 工具不会被直接注入**，但设置了 `bundleMcp: true` 的后端可以通过 loopback MCP 桥接接收 Gateway 网关工具。
- 为支持该能力的 CLI 提供 **JSONL 分块流式传输**。
- **支持会话**（因此后续轮次能保持连贯）。
- 如果 CLI 接受图像路径，**图像也可以透传**。

这被设计为一种**安全兜底机制**，而不是主要路径。当你想要获得“不管怎样都能工作”的文本响应、且不依赖外部 API 时，可以使用它。

如果你想要一个具备 ACP 会话控制、后台任务、线程/对话绑定以及持久化外部编码会话的完整 harness 运行时，请改用 [ACP Agents](/zh-CN/tools/acp-agents)。CLI 后端不是 ACP。

## 面向初学者的快速开始

你可以**无需任何配置**就使用 Codex CLI（内置的 OpenAI 插件会注册一个默认后端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

如果你的 Gateway 网关在 launchd/systemd 下运行且 PATH 很精简，只需添加命令路径：

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

就这样。除了 CLI 自身之外，不需要密钥，也不需要额外认证配置。

如果你在 Gateway 网关主机上把某个内置 CLI 后端用作**主要消息提供商**，当你的配置在模型引用中或在 `agents.defaults.cliBackends` 下显式引用该后端时，OpenClaw 现在会自动加载其所属的内置插件。

## 将其用作回退方案

把一个 CLI 后端加入你的回退列表，这样它只会在主模型失败时运行：

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

- 如果你使用 `agents.defaults.models`（允许列表），你也必须在其中包含你的 CLI 后端模型。
- 如果主提供商失败（认证、速率限制、超时），OpenClaw 会接着尝试 CLI 后端。

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
          // Codex 风格的 CLI 也可以改为指向一个提示文件：
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

1. 根据提供商前缀（`codex-cli/...`）**选择一个后端**。
2. 使用相同的 OpenClaw 提示词和工作区上下文**构建系统提示词**。
3. 使用会话 id（如果支持）**执行 CLI**，从而保持历史记录一致。
   内置的 `claude-cli` 后端会为每个 OpenClaw 会话保持一个 Claude stdio 进程常驻，并通过 stream-json stdin 发送后续轮次。
4. **解析输出**（JSON 或纯文本）并返回最终文本。
5. 按后端**持久化会话 id**，这样后续轮次会复用同一个 CLI 会话。

<Note>
内置的 Anthropic `claude-cli` 后端现已再次受支持。Anthropic 的工作人员告诉我们，允许使用 OpenClaw 风格的 Claude CLI 方式，因此除非 Anthropic 发布新的策略，否则 OpenClaw 会将 `claude -p` 的用法视为该集成的授权方式。
</Note>

内置的 OpenAI `codex-cli` 后端会通过 Codex 的 `model_instructions_file` 配置覆盖项（`-c
model_instructions_file="..."`）传递 OpenClaw 的系统提示词。Codex 没有提供类似 Claude 的 `--append-system-prompt` 标志，因此 OpenClaw 会在每个新的 Codex CLI 会话中，把组装后的提示词写入一个临时文件。

内置的 Anthropic `claude-cli` 后端会通过两种方式接收 OpenClaw 的 Skills 快照：一种是在追加的系统提示词中接收紧凑版 OpenClaw Skills 目录，另一种是通过 `--plugin-dir` 传入一个临时 Claude Code 插件。该插件仅包含当前智能体/会话可用的 Skills，因此 Claude Code 的原生技能解析器会看到与 OpenClaw 本来会在提示词中通告的同一组已过滤 Skills。针对 Skill 的环境变量/API 密钥覆盖仍然由 OpenClaw 应用于本次运行的子进程环境。

## 会话

- 如果 CLI 支持会话，请设置 `sessionArg`（例如 `--session-id`）或 `sessionArgs`（占位符 `{sessionId}`），以便在需要将 ID 插入多个标志时使用。
- 如果 CLI 使用带有不同标志的**恢复子命令**，请设置 `resumeArgs`（恢复时替换 `args`），并可选设置 `resumeOutput`（用于非 JSON 的恢复输出）。
- `sessionMode`：
  - `always`：始终发送会话 id（如果尚未存储则生成新的 UUID）。
  - `existing`：仅在之前已存储会话 id 时才发送。
  - `none`：从不发送会话 id。
- `claude-cli` 默认使用 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此只要进程仍处于活动状态，后续轮次就会复用这个常驻 Claude 进程。如果 Gateway 网关重启，或者空闲进程退出，OpenClaw 会从已存储的 Claude 会话 id 恢复。
- 已存储的 CLI 会话属于提供商拥有的连续性状态。隐式的每日会话重置不会切断它们；`/reset` 和显式的 `session.reset` 策略仍然会切断。

序列化说明：

- `serialize: true` 会让同一通道中的运行保持有序。
- 大多数 CLI 会在单个提供商通道上串行执行。
- 当后端认证状态发生变化时，包括重新登录、令牌轮换或认证配置文件凭证变更，OpenClaw 会放弃复用已存储的 CLI 会话。

## 图像（透传）

如果你的 CLI 接受图像路径，请设置 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 会把 base64 图像写入临时文件。如果设置了 `imageArg`，这些路径会作为 CLI 参数传入。如果未设置 `imageArg`，OpenClaw 会把文件路径追加到提示词中（路径注入），这对于那些能从普通路径自动加载本地文件的 CLI 已经足够。

## 输入 / 输出

- `output: "json"`（默认）会尝试解析 JSON，并提取文本和会话 id。
- 对于 Gemini CLI 的 JSON 输出，当 `usage` 缺失或为空时，OpenClaw 会从 `response` 读取回复文本，并从 `stats` 读取用量。
- `output: "jsonl"` 会解析 JSONL 流（例如 Codex CLI `--json`），并在存在时提取最终智能体消息以及会话标识符。
- `output: "text"` 会将 stdout 视为最终响应。

输入模式：

- `input: "arg"`（默认）会把提示词作为最后一个 CLI 参数传入。
- `input: "stdin"` 会通过 stdin 发送提示词。
- 如果提示词很长且设置了 `maxPromptArgChars`，则会改用 stdin。

## 默认值（插件拥有）

内置的 OpenAI 插件也会为 `codex-cli` 注册一个默认值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

内置的 Google 插件也会为 `google-gemini-cli` 注册一个默认值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前提条件：必须已安装本地 Gemini CLI，并且可通过 `PATH` 中的
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 说明：

- 回复文本从 JSON 的 `response` 字段读取。
- 当 `usage` 不存在或为空时，用量会回退到 `stats`。
- `stats.cached` 会被标准化为 OpenClaw `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 会通过
  `stats.input_tokens - stats.cached` 推导输入 token 数。

仅在需要时覆盖（常见情况：使用绝对 `command` 路径）。

## 插件拥有的默认值

CLI 后端默认值现在属于插件表面的一部分：

- 插件通过 `api.registerCliBackend(...)` 注册它们。
- 后端的 `id` 会成为模型引用中的提供商前缀。
- `agents.defaults.cliBackends.<id>` 中的用户配置仍然会覆盖插件默认值。
- 后端专属的配置清理仍然由插件通过可选的 `normalizeConfig` hook 负责。

如果插件需要非常轻量的提示词/消息兼容性垫片，它们可以声明双向文本转换，而无需替换提供商或 CLI 后端：

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
会在 OpenClaw 处理其自身控制标记和渠道投递之前，重写流式 assistant 增量和解析后的最终文本。

对于输出与 Claude Code stream-json 兼容的 JSONL 的 CLI，请在该后端配置上设置
`jsonlDialect: "claude-stream-json"`。

## bundle MCP 覆盖层

CLI 后端**不会**直接接收 OpenClaw 工具调用，但后端可以通过设置 `bundleMcp: true` 选择接收一个生成的 MCP 配置覆盖层。

当前的内置行为：

- `claude-cli`：生成严格的 MCP 配置文件
- `codex-cli`：为 `mcp_servers` 提供内联配置覆盖
- `google-gemini-cli`：生成 Gemini 系统设置文件

启用 bundle MCP 后，OpenClaw 会：

- 启动一个 loopback HTTP MCP 服务器，将 Gateway 网关工具暴露给 CLI 进程
- 使用每会话令牌（`OPENCLAW_MCP_TOKEN`）对桥接进行认证
- 将工具访问范围限定在当前会话、账户和渠道上下文中
- 为当前工作区加载已启用的 bundle-MCP 服务器
- 将它们与任何现有的后端 MCP 配置/设置结构合并
- 使用所属扩展中的后端拥有集成模式重写启动配置

如果没有启用任何 MCP 服务器，只要后端选择启用 bundle MCP，OpenClaw 仍会注入严格配置，以便后台运行保持隔离。

## 限制

- **没有直接 OpenClaw 工具调用。** OpenClaw 不会把工具调用注入到 CLI 后端协议中。只有当后端选择 `bundleMcp: true` 时，它们才能看到 Gateway 网关工具。
- **流式传输取决于后端。** 某些后端会流式输出 JSONL，其他后端则会缓冲到退出时再输出。
- **结构化输出** 取决于 CLI 的 JSON 格式。
- **Codex CLI 会话** 通过文本输出恢复（不是 JSONL），其结构化程度低于初始 `--json` 运行。不过 OpenClaw 会话本身仍然可以正常工作。

## 故障排除

- **找不到 CLI**：将 `command` 设置为完整路径。
- **模型名称错误**：使用 `modelAliases` 将 `provider/model` 映射到 CLI 模型。
- **没有会话连续性**：确保已设置 `sessionArg`，并且 `sessionMode` 不是
  `none`（Codex CLI 目前无法通过 JSON 输出恢复）。
- **图像被忽略**：设置 `imageArg`（并确认 CLI 支持文件路径）。
