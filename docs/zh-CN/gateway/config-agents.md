---
read_when:
    - 调整智能体默认值（模型、思考、工作区、心跳、媒体、Skills）
    - 配置多智能体路由和绑定
    - 调整会话、消息投递和 talk 模式行为
summary: 智能体默认值、多智能体路由、会话、消息和 talk 配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-04-25T07:51:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec43da7bb26dc2b0e99e972d0373b9b3f4dd443cc4ed95fc9807bc4d04483e45
    source_path: gateway/config-agents.md
    workflow: 15
---

在 `agents.*`、`multiAgent.*`、`session.*`、`messages.*` 和 `talk.*` 下按智能体作用域划分的配置键。对于渠道、工具、Gateway 网关运行时以及其他顶层键，请参阅 [配置参考](/zh-CN/gateway/configuration-reference)。

## 智能体默认值

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

可选的仓库根目录，会显示在系统提示中的 Runtime 行。如果未设置，OpenClaw 会从工作区开始向上遍历并自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

为未设置 `agents.list[].skills` 的智能体提供可选的默认 Skills 允许列表。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 没有 Skills
    ],
  },
}
```

- 省略 `agents.defaults.skills` 表示默认不限制 Skills。
- 省略 `agents.list[].skills` 表示继承默认值。
- 设置 `agents.list[].skills: []` 表示不使用任何 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用自动创建工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

控制何时将工作区引导文件注入到系统提示中。默认值：`"always"`。

- `"continuation-skip"`：安全的续接轮次（在一次已完成的助手响应之后）会跳过工作区引导内容的重新注入，从而减小提示大小。Heartbeat 运行和压缩后的重试仍会重建上下文。
- `"never"`：在每一轮都禁用工作区引导和上下文文件注入。仅对完全自行管理提示生命周期的智能体使用此选项（自定义上下文引擎、自行构建上下文的原生运行时，或专门的不使用引导文件的工作流）。Heartbeat 和压缩恢复轮次也会跳过注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

每个工作区引导文件在被截断前允许的最大字符数。默认值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

在所有工作区引导文件中注入的总最大字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制在引导上下文被截断时，智能体可见的警告文本。默认值：`"once"`。

- `"off"`：绝不将警告文本注入系统提示。
- `"once"`：对每个唯一的截断签名注入一次警告（推荐）。
- `"always"`：只要存在截断，就在每次运行时注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 上下文预算归属映射

OpenClaw 有多个高容量的提示 / 上下文预算，它们被有意按子系统拆分，而不是全部流经一个通用开关。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  常规工作区引导注入。
- `agents.defaults.startupContext.*`：
  一次性的 `/new` 和 `/reset` 启动前导内容，包括最近的每日
  `memory/*.md` 文件。
- `skills.limits.*`：
  注入到系统提示中的精简 Skills 列表。
- `agents.defaults.contextLimits.*`：
  有界的运行时摘录和由运行时拥有的注入块。
- `memory.qmd.limits.*`：
  已索引的内存搜索片段与注入大小限制。

仅当某个智能体需要不同预算时，才使用对应的按智能体覆盖项：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在裸 `/new` 和 `/reset` 运行时注入的首轮启动前导内容。

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

有界运行时上下文表面的共享默认值。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`：`memory_get` 摘录在添加截断元数据和续接提示前的默认上限。
- `memoryGetDefaultLines`：当省略 `lines` 时，`memory_get` 的默认行窗口。
- `toolResultMaxChars`：用于持久化结果和溢出恢复的实时工具结果上限。
- `postCompactionMaxChars`：在压缩后刷新注入期间使用的 `AGENTS.md` 摘录上限。

#### `agents.list[].contextLimits`

用于共享 `contextLimits` 开关的按智能体覆盖项。省略的字段会继承自 `agents.defaults.contextLimits`。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入到系统提示中的精简 Skills 列表的全局上限。这不会影响按需读取 `SKILL.md` 文件。

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 提示预算的按智能体覆盖项。

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

在调用提供商之前，转录 / 工具图像块中图像最长边的最大像素尺寸。
默认值：`1200`。

较低的值通常会减少视觉 token 使用量和以截图为主的运行中的请求负载大小。
较高的值会保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

系统提示上下文使用的时区（不影响消息时间戳）。会回退到主机时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系统提示中的时间格式。默认值：`auto`（操作系统偏好）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // 全局默认提供商参数
      embeddedHarness: {
        runtime: "pi", // pi | auto | 已注册的 harness id，例如 codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）两种形式。
  - 字符串形式只设置主模型。
  - 对象形式设置主模型以及按顺序排列的故障转移模型。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）两种形式。
  - 作为 `image` 工具路径的视觉模型配置使用。
  - 当选中的 / 默认模型无法接受图像输入时，也用作回退路由。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）两种形式。
  - 用于共享的图像生成能力，以及未来任何生成图像的工具 / 插件表面。
  - 典型值：`google/gemini-3.1-flash-image-preview` 用于原生 Gemini 图像生成，`fal/fal-ai/flux/dev` 用于 fal，或 `openai/gpt-image-2` 用于 OpenAI Images。
  - 如果你直接选择某个 provider / model，也要配置匹配的提供商凭证（例如，`google/*` 需要 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` 需要 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 需要 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推断一个有凭证支持的默认提供商。它会先尝试当前默认提供商，然后按 provider id 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）两种形式。
  - 用于共享的音乐生成能力和内置的 `music_generate` 工具。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.5+`。
  - 如果省略，`music_generate` 仍可推断一个有凭证支持的默认提供商。它会先尝试当前默认提供商，然后按 provider id 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择某个 provider / model，也要配置匹配的提供商凭证 / API key。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）两种形式。
  - 用于共享的视频生成能力和内置的 `video_generate` 工具。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断一个有凭证支持的默认提供商。它会先尝试当前默认提供商，然后按 provider id 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择某个 provider / model，也要配置匹配的提供商凭证 / API key。
  - 内置的 Qwen 视频生成提供商最多支持 1 个输出视频、1 张输入图像、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）两种形式。
  - 用于 `pdf` 工具的模型路由。
  - 如果省略，PDF 工具会回退到 `imageModel`，然后再回退到解析后的会话 / 默认模型。
- `pdfMaxBytesMb`：当调用时未传入 `maxBytesMb`，`pdf` 工具使用的默认 PDF 大小上限。
- `pdfMaxPages`：`pdf` 工具在提取回退模式下考虑的默认最大页数。
- `verboseDefault`：智能体的默认详细输出级别。可选值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `elevatedDefault`：智能体的默认增强输出级别。可选值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式为 `provider/model`（例如，使用 API key 访问时为 `openai/gpt-5.4`，或使用 Codex OAuth 时为 `openai-codex/gpt-5.5`）。如果你省略 provider，OpenClaw 会先尝试别名，然后尝试与该精确模型 id 唯一匹配的已配置 provider，最后才回退到已配置的默认 provider（这是已弃用的兼容行为，因此更推荐显式使用 `provider/model`）。如果该 provider 不再提供已配置的默认模型，OpenClaw 会回退到第一个已配置的 provider / model，而不是暴露一个过期且已移除 provider 的默认值。
- `models`：为 `/model` 配置的模型目录和允许列表。每个条目都可以包含 `alias`（快捷名称）和 `params`（提供商特定参数，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`extra_body` / `extraBody`）。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。除非你传入 `--replace`，否则 `config set` 会拒绝可能删除现有允许列表条目的替换操作。
  - 按 provider 作用域的配置 / 新手引导流程会把所选 provider 模型合并到该映射中，并保留已配置的其他无关 provider。
  - 对于直接使用的 OpenAI Responses 模型，服务端压缩会自动启用。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。参见 [OpenAI 服务端压缩](/zh-CN/providers/openai#server-side-compaction-responses-api)。
- `params`：应用到所有模型的全局默认 provider 参数。设置在 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（按模型）覆盖，然后 `agents.list[].params`（匹配智能体 id）再按键覆盖。详情参见 [提示缓存](/zh-CN/reference/prompt-caching)。
- `params.extra_body` / `params.extraBody`：高级透传 JSON，会合并进 OpenAI 兼容代理的 `api: "openai-completions"` 请求体中。如果它与生成的请求键冲突，额外请求体优先；非原生 completions 路由之后仍会剥离 OpenAI 专用的 `store`。
- `embeddedHarness`：默认的底层嵌入式智能体运行时策略。未指定 runtime 时，默认使用 OpenClaw Pi。使用 `runtime: "pi"` 可强制使用内置 PI harness，使用 `runtime: "auto"` 可让已注册的插件 harness 认领其支持的模型，或使用已注册的 harness id，例如 `runtime: "codex"`。设置 `fallback: "none"` 可禁用自动回退到 PI。显式插件运行时（例如 `codex`）默认是失败即关闭，除非你在相同覆盖作用域中设置 `fallback: "pi"`。保持模型引用使用标准形式 `provider/model`；通过运行时配置而不是旧版运行时 provider 前缀来选择 Codex、Claude CLI、Gemini CLI 和其他执行后端。参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes) 了解它与 provider / model 选择的区别。
- 会修改这些字段的配置写入器（例如 `/models set`、`/models set-image` 和回退 add / remove 命令）会保存为标准对象形式，并尽可能保留现有回退列表。
- `maxConcurrent`：跨会话并行运行的最大智能体数量（每个会话内部仍然串行）。默认值：4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` 用于控制哪个底层执行器运行嵌入式智能体轮次。
大多数部署应保持默认的 OpenClaw Pi 运行时。
当受信任的插件提供原生 harness 时使用它，例如内置的
Codex 应用服务器 harness。关于其概念模型，参见
[Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`：`"auto"`、`"pi"` 或已注册的插件 harness id。内置的 Codex 插件注册为 `codex`。
- `fallback`：`"pi"` 或 `"none"`。在 `runtime: "auto"` 中，若省略 `fallback`，默认是 `"pi"`，这样旧配置在没有插件 harness 认领运行时仍可继续使用 PI。在显式插件运行时模式下，例如 `runtime: "codex"`，若省略 `fallback`，默认是 `"none"`，这样缺少 harness 时会失败，而不是静默使用 PI。运行时覆盖不会从更宽泛的作用域继承 fallback；当你明确需要该兼容回退时，请与显式 runtime 一起设置 `fallback: "pi"`。选中的插件 harness 一旦失败，总是会直接暴露错误。
- 环境变量覆盖：`OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` 会覆盖 `runtime`；`OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` 会覆盖该进程的 fallback。
- 对于仅使用 Codex 的部署，设置 `model: "openai/gpt-5.5"` 和 `embeddedHarness.runtime: "codex"`。为了提升可读性，你也可以显式设置 `embeddedHarness.fallback: "none"`；这本就是显式插件运行时的默认值。
- 在第一次嵌入式运行后，harness 选择会按 session id 固定。配置 / 环境变量更改只影响新的或已重置的会话，不影响现有转录。具有转录历史但没有记录固定信息的旧会话，会被视为固定到 PI。`/status` 会报告实际运行时，例如 `Runtime: OpenClaw Pi Default` 或 `Runtime: OpenAI Codex`。
- 这只控制嵌入式聊天 harness。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用它们各自的 provider / model 设置。

**内置别名简写**（仅当模型位于 `agents.defaults.models` 中时生效）：

| 别名                | 模型                                               |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` 或已配置的 Codex OAuth GPT-5.5    |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

你配置的别名始终优先于默认值。

Z.AI GLM-4.x 模型会自动启用思考模式，除非你设置 `--thinking off`，或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 以进行工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设置为 `false` 可禁用它。
Anthropic Claude 4.6 模型在未显式设置思考级别时，默认使用 `adaptive` 思考模式。

### `agents.defaults.cliBackends`

用于纯文本回退运行（无工具调用）的可选 CLI 后端。在 API 提供商失败时，可作为备份。

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
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 后端以文本为主；工具始终禁用。
- 设置了 `sessionArg` 时支持会话。
- 当 `imageArg` 接受文件路径时，支持图像透传。

### `agents.defaults.systemPromptOverride`

用固定字符串替换整个由 OpenClaw 组装的系统提示。可在默认级别（`agents.defaults.systemPromptOverride`）或按智能体设置（`agents.list[].systemPromptOverride`）。按智能体的值优先；空值或仅包含空白的值会被忽略。适用于受控的提示实验。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

按模型家族应用的、与 provider 无关的提示叠加层。GPT-5 家族模型 id 会跨 provider 接收共享的行为契约；`personality` 只控制友好的交互风格层。

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`（默认）和 `"on"` 会启用友好的交互风格层。
- `"off"` 只禁用友好层；带标签的 GPT-5 行为契约仍保持启用。
- 当这个共享设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

周期性 Heartbeat 运行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：时长字符串（ms/s/m/h）。默认值：`30m`（API key 凭证）或 `1h`（OAuth 凭证）。设置为 `0m` 可禁用。
- `includeSystemPromptSection`：设为 false 时，会从系统提示中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入到引导上下文中。默认值：`true`。
- `suppressToolErrorWarnings`：设为 true 时，会在 Heartbeat 运行期间抑制工具错误警告负载。
- `timeoutSeconds`：Heartbeat 智能体轮次在被中止前允许的最大秒数。若不设置，则使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直接 / 私信投递策略。`allow`（默认）允许直接目标投递。`block` 会阻止直接目标投递，并发出 `reason=dm-blocked`。
- `lightContext`：设为 true 时，Heartbeat 运行会使用轻量级引导上下文，并且只保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：设为 true 时，每次 Heartbeat 都会在一个全新会话中运行，不带任何先前的对话历史。与 cron `sessionTarget: "isolated"` 使用相同的隔离模式。每次 Heartbeat 的 token 成本可从约 100K 降至约 2–5K。
- 按智能体设置：使用 `agents.list[].heartbeat`。如果任意智能体定义了 `heartbeat`，**则只有这些智能体** 会运行 Heartbeat。
- Heartbeat 会运行完整的智能体轮次——间隔越短，消耗的 token 越多。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（针对长历史记录的分块摘要）。参见 [Compaction](/zh-CN/concepts/compaction)。
- `provider`：已注册压缩 provider 插件的 id。设置后，会调用该 provider 的 `summarize()`，而不是使用内置 LLM 摘要。失败时会回退到内置实现。设置 provider 会强制使用 `mode: "safeguard"`。参见 [Compaction](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 中止一次压缩操作前允许的最大秒数。默认值：`900`。
- `keepRecentTokens`：Pi 切分点预算，用于把最近的转录尾部按原文保留。手动 `/compact` 在显式设置时会遵循此值；否则手动压缩就是一个硬检查点。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在压缩摘要时预先添加内置的不透明标识符保留指导。
- `identifierInstructions`：当 `identifierPolicy=custom` 时使用的自定义标识符保留文本。
- `qualityGuard`：对 safeguard 摘要执行输出格式错误后的重试检查。在 safeguard 模式下默认启用；设置 `enabled: false` 可跳过审计。
- `postCompactionSections`：压缩后要重新注入的可选 `AGENTS.md` H2/H3 章节名。默认值为 `["Session Startup", "Red Lines"]`；设置为 `[]` 可禁用重新注入。当未设置，或显式设置为该默认对时，也会接受旧版的 `Every Session` / `Safety` 标题作为兼容回退。
- `model`：仅用于压缩摘要的可选 `provider/model-id` 覆盖。若你希望主会话保持使用某个模型，而压缩摘要使用另一个模型，就用它；若未设置，压缩会使用会话的主模型。
- `notifyUser`：设为 `true` 时，会在压缩开始和完成时向用户发送简短通知（例如，“正在压缩上下文...” 和 “上下文压缩完成”）。默认关闭，以保持压缩静默进行。
- `memoryFlush`：在自动压缩前执行一次静默的智能体轮次，以存储持久记忆。当工作区为只读时会跳过。

### `agents.defaults.contextPruning`

在把内容发送给 LLM 之前，从内存上下文中修剪 **旧的工具结果**。**不会** 修改磁盘上的会话历史。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="`cache-ttl` 模式行为">

- `mode: "cache-ttl"` 会启用修剪流程。
- `ttl` 控制何时可以再次运行修剪（在上次缓存触碰之后）。
- 修剪会先对过大的工具结果执行软修剪；如仍有需要，再对更旧的工具结果执行硬清除。

**软修剪** 会保留开头和结尾，并在中间插入 `...`。

**硬清除** 会用占位符替换整个工具结果。

说明：

- 图像块永远不会被修剪 / 清除。
- 比例基于字符数（近似值），而不是精确 token 数。
- 如果助手消息少于 `keepLastAssistants` 条，则会跳过修剪。

</Accordion>

行为详情参见 [会话修剪](/zh-CN/concepts/session-pruning)。

### 分块流式传输

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- 非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才会启用分块回复。
- 渠道覆盖：`channels.<channel>.blockStreamingCoalesce`（以及按账号的变体）。Signal / Slack / Discord / Google Chat 默认使用 `minChars: 1500`。
- `humanDelay`：分块回复之间的随机停顿。`natural` = 800–2500 ms。按智能体覆盖：`agents.list[].humanDelay`。

行为和分块细节参见 [流式传输](/zh-CN/concepts/streaming)。

### 正在输入指示器

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 默认值：直接聊天 / 提及时使用 `instant`，未被提及的群聊使用 `message`。
- 按会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

参见 [正在输入指示器](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="沙箱详情">

**后端：**

- `docker`：本地 Docker 运行时（默认）
- `ssh`：通用的基于 SSH 的远程运行时
- `openshell`：OpenShell 运行时

当选择 `backend: "openshell"` 时，运行时专用设置会移至
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：`user@host[:port]` 形式的 SSH 目标
- `command`：SSH 客户端命令（默认值：`ssh`）
- `workspaceRoot`：用于按作用域划分工作区的远程绝对根目录
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：内联内容或 SecretRefs，OpenClaw 会在运行时将其物化为临时文件
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略开关

**SSH 凭证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 由 SecretRef 支持的 `*Data` 值会在沙箱会话启动前，从当前活动的 secrets 运行时快照中解析

**SSH 后端行为：**

- 在创建或重建后，对远程工作区执行一次初始化
- 然后保持远程 SSH 工作区为标准状态
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动把远程更改同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：每个作用域的沙箱工作区位于 `~/.openclaw/sandboxes` 下
- `ro`：沙箱工作区位于 `/workspace`，智能体工作区以只读方式挂载到 `/agent`
- `rw`：智能体工作区以读写方式挂载到 `/workspace`

**作用域：**

- `session`：每个会话一个容器 + 工作区
- `agent`：每个智能体一个容器 + 工作区（默认）
- `shared`：共享容器和工作区（无跨会话隔离）

**OpenShell 插件配置：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 模式：**

- `mirror`：在执行前把本地内容初始化到远程，执行后再同步回本地；本地工作区保持为标准状态
- `remote`：在创建沙箱时只对远程执行一次初始化，之后保持远程工作区为标准状态

在 `remote` 模式下，于 OpenClaw 之外在主机本地进行的编辑，在初始化步骤之后不会自动同步到沙箱中。
传输方式是通过 SSH 连接到 OpenShell 沙箱，但插件负责沙箱生命周期以及可选的镜像同步。

**`setupCommand`** 会在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根文件系统和 root 用户。

**容器默认使用 `network: "none"`** —— 如果智能体需要出站访问，请设置为 `"bridge"`（或自定义 bridge 网络）。
`"host"` 会被阻止。`"container:<id>"` 默认也会被阻止，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（紧急放行）。

**入站附件** 会被暂存到活动工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载额外的主机目录；全局和按智能体的绑定会合并。

**沙箱隔离浏览器**（`sandbox.browser.enabled`）：在容器中运行 Chromium + CDP。noVNC URL 会注入到系统提示中。不需要在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，OpenClaw 会发出一个短期有效的 token URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话以主机浏览器为目标。
- `network` 默认为 `openclaw-sandbox-browser`（专用 bridge 网络）。只有在你明确需要全局 bridge 连通性时才设置为 `bridge`。
- `cdpSourceRange` 可选地将容器边缘的 CDP 入站限制到某个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅会把额外的主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。
- 启动默认值定义在 `scripts/sandbox-browser-entrypoint.sh` 中，并针对容器主机进行了调优：
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - 默认启用 `--disable-extensions`
  - `--disable-3d-apis`、`--disable-software-rasterizer` 和 `--disable-gpu`
    默认启用；如果 WebGL / 3D 使用场景需要，可通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 禁用它们。
  - 如果你的工作流依赖扩展，`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 会重新启用扩展。
  - `--renderer-process-limit=2` 可通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 更改；设置为 `0` 会使用 Chromium 的
    默认进程限制。
  - 另外，当启用 `noSandbox` 时，还会加上 `--no-sandbox` 和 `--disable-setuid-sandbox`。
  - 这些默认值是容器镜像基线；如需更改容器默认行为，请使用自定义浏览器镜像和自定义
    入口点。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅适用于 Docker。

构建镜像：

```bash
scripts/sandbox-setup.sh           # 主沙箱镜像
scripts/sandbox-browser-setup.sh   # 可选的浏览器镜像
```

### `agents.list`（按智能体覆盖）

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`：稳定的智能体 id（必需）。
- `default`：若设置了多个，首个生效（会记录警告）。如果都未设置，则列表中的第一个条目为默认值。
- `model`：字符串形式只覆盖 `primary`；对象形式 `{ primary, fallbacks }` 会同时覆盖两者（`[]` 会禁用全局回退）。仅覆盖 `primary` 的 cron 作业仍会继承默认回退，除非你设置 `fallbacks: []`。
- `params`：按智能体的流参数，会合并到 `agents.defaults.models` 中选定模型条目之上。可用于像 `cacheRetention`、`temperature` 或 `maxTokens` 这样的智能体特定覆盖，而不必复制整个模型目录。
- `skills`：可选的按智能体 Skills 允许列表。如果省略，智能体会在设置了 `agents.defaults.skills` 时继承它；显式列表会替换默认值而不是合并，`[]` 表示无 Skills。
- `thinkingDefault`：可选的按智能体默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当未设置按消息或按会话覆盖时，它会覆盖该智能体的 `agents.defaults.thinkingDefault`。所选 provider / model 配置决定哪些值有效；对于 Google Gemini，`adaptive` 会保持 provider 自有的动态思考（在 Gemini 3 / 3.1 上省略 `thinkingLevel`，在 Gemini 2.5 上使用 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的按智能体默认推理可见性（`on | off | stream`）。当未设置按消息或按会话推理覆盖时生效。
- `fastModeDefault`：可选的按智能体快速模式默认值（`true | false`）。当未设置按消息或按会话快速模式覆盖时生效。
- `embeddedHarness`：可选的按智能体底层 harness 策略覆盖。使用 `{ runtime: "codex" }` 可让某个智能体仅使用 Codex，而其他智能体继续使用默认的 `auto` 模式 PI 回退。
- `runtime`：可选的按智能体运行时描述符。当智能体应默认使用 ACP harness 会话时，使用 `type: "acp"` 以及 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 会派生默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name` / `emoji`。
- `subagents.allowAgents`：`sessions_spawn` 允许的智能体 id 列表（`["*"]` = 任意；默认：仅同一智能体）。
- 沙箱继承保护：如果请求方会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些将以非沙箱方式运行的目标。
- `subagents.requireAgentId`：设为 true 时，会阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置；默认值：false）。

---

## 多智能体路由

在一个 Gateway 网关中运行多个彼此隔离的智能体。参见 [Multi-Agent](/zh-CN/concepts/multi-agent)。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 绑定匹配字段

- `type`（可选）：普通路由使用 `route`（未指定时默认即为 route），持久 ACP 对话绑定使用 `acp`。
- `match.channel`（必需）
- `match.accountId`（可选；`*` = 任意账号；省略 = 默认账号）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；特定渠道）
- `acp`（可选；仅适用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性的匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer / guild / team）
5. `match.accountId: "*"`（整个渠道）
6. 默认智能体

在每一层内，首个匹配的 `bindings` 条目胜出。

对于 `type: "acp"` 条目，OpenClaw 会按精确会话标识（`match.channel` + account + `match.peer.id`）解析，不使用上面的 route 绑定层级顺序。

### 按智能体划分的访问配置

<Accordion title="完全访问（无沙箱）">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="只读工具 + 工作区">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="无文件系统访问（仅消息）">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

有关优先级细节，参见 [多智能体沙箱隔离与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

---

## 会话

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="会话字段详情">

- **`scope`**：群聊上下文的基础会话分组策略。
  - `per-sender`（默认）：在某个渠道上下文中，每个发送者都有独立的隔离会话。
  - `global`：某个渠道上下文中的所有参与者共享一个会话（仅在确实需要共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：按发送者 id 跨渠道隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账号 + 渠道 + 发送者隔离（推荐用于多账号场景）。
- **`identityLinks`**：将规范 id 映射到带 provider 前缀的 peer，用于跨渠道共享会话。
- **`reset`**：主重置策略。`daily` 会在本地时间 `atHour` 重置；`idle` 会在空闲 `idleMinutes` 后重置。如果两者都配置，先到期者生效。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 仍可作为 `direct` 的别名。
- **`parentForkMaxTokens`**：创建分叉线程会话时允许的父会话最大 `totalTokens`（默认 `100000`）。
  - 如果父会话的 `totalTokens` 超过该值，OpenClaw 会启动一个新的线程会话，而不是继承父级转录历史。
  - 设置为 `0` 可禁用此保护，并始终允许父级分叉。
- **`mainKey`**：旧版字段。运行时始终对主私聊桶使用 `"main"`。
- **`agentToAgent.maxPingPongTurns`**：在智能体到智能体交互期间，智能体之间允许的最大往返回复轮数（整数，范围：`0`–`5`）。`0` 会禁用 ping-pong 链式交互。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 为别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。首个 deny 规则胜出。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 会实际执行清理。
  - `pruneAfter`：过期条目的时间阈值（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。
  - `rotateBytes`：当 `sessions.json` 超过此大小时轮转（默认 `10mb`）。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留时长。默认与 `pruneAfter` 相同；设置为 `false` 可禁用。
  - `maxDiskBytes`：可选的会话目录磁盘预算。在 `warn` 模式下记录警告；在 `enforce` 模式下会优先删除最旧的产物 / 会话。
  - `highWaterBytes`：预算清理后的可选目标值。默认是 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（provider 可覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认的按空闲时间自动取消聚焦小时数（`0` 为禁用；provider 可覆盖）
  - `maxAgeHours`：默认的硬最大存在时长小时数（`0` 为禁用；provider 可覆盖）

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 响应前缀

按渠道 / 账号覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析顺序（越具体越优先）：账号 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 会派生为 `[{identity.name}]`。

**模板变量：**

| 变量 | 说明 | 示例 |
| ----------------- | ---------------------- | --------------------------- |
| `{model}` | 模型短名称 | `claude-opus-4-6` |
| `{modelFull}` | 完整模型标识符 | `anthropic/claude-opus-4-6` |
| `{provider}` | 提供商名称 | `anthropic` |
| `{thinkingLevel}` | 当前思考级别 | `high`、`low`、`off` |
| `{identity.name}` | 智能体身份名称 | （与 `"auto"` 相同） |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认反应

- 默认为活动智能体的 `identity.emoji`，否则为 `"👀"`。设置为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账号 → 渠道 → `messages.ackReaction` → identity 回退。
- 作用范围：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord 和 Telegram 上回复后移除确认反应。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期 Status 反应。
  在 Slack 和 Discord 上，未设置时，如果确认反应处于活动状态，则保持 Status 反应启用。
  在 Telegram 上，必须显式设置为 `true` 才会启用生命周期 Status 反应。

### 入站去抖

将来自同一发送者的快速连续纯文本消息批处理为一次智能体轮次。媒体 / 附件会立即刷新。控制命令会绕过去抖。

### TTS（文本转语音）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` 控制默认的自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好，`/tts status` 会显示实际状态。
- `summaryModel` 会为自动摘要覆盖 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（需主动启用）。
- API key 会回退到 `ELEVENLABS_API_KEY` / `XI_API_KEY` 和 `OPENAI_API_KEY`。
- 内置语音提供商由插件负责。如果设置了 `plugins.allow`，请包含你要使用的每个 TTS 提供商插件，例如用于 Edge TTS 的 `microsoft`。旧版 provider id `edge` 仍可作为 `microsoft` 的别名使用。
- `providers.openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序为：配置，然后 `OPENAI_TTS_BASE_URL`，最后是 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为兼容 OpenAI 的 TTS 服务器，并放宽模型 / 语音校验。

---

## Talk

Talk 模式的默认值（macOS / iOS / Android）。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` 在配置了多个 Talk 提供商时，必须匹配 `talk.providers` 中的某个键。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容，并会自动迁移到 `talk.providers.<provider>` 中。
- 语音 id 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- 只有在未配置 Talk API key 时，才会使用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 允许 Talk 指令使用友好名称。
- `providers.mlx.modelId` 用于选择 macOS 本地 MLX helper 所使用的 Hugging Face 仓库。如果省略，macOS 会使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放会在存在时通过内置的 `openclaw-mlx-tts` helper 运行，否则使用 `PATH` 上的可执行文件；开发时可通过 `OPENCLAW_MLX_TTS_BIN` 覆盖 helper 路径。
- `silenceTimeoutMs` 控制 Talk 模式在用户静音后等待多长时间再发送转录。未设置时会保持平台默认暂停窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）。

---

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速设置
- [配置示例](/zh-CN/gateway/configuration-examples)
