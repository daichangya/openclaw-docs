---
read_when:
    - 调整智能体默认设置（模型、思考、工作区、心跳、媒体、Skills）
    - 配置多智能体路由和绑定
    - 调整会话、消息传递和对话模式行为
summary: 智能体默认设置、多智能体路由、会话、消息和对话配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-04-25T12:32:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1601dc5720f6a82fb947667ed9c0b4612c5187572796db5deb7a28dd13be3528
    source_path: gateway/config-agents.md
    workflow: 15
---

在 `agents.*`、`multiAgent.*`、`session.*`、`messages.*` 和 `talk.*` 下定义的智能体作用域配置键。对于渠道、工具、Gateway 网关运行时和其他顶层键，请参阅 [配置参考](/zh-CN/gateway/configuration-reference)。

## 智能体默认设置

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

可选的仓库根目录，会显示在系统提示词的 Runtime 行中。如果未设置，OpenClaw 会从工作区开始向上遍历并自动检测。

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
      { id: "locked-down", skills: [] }, // 不使用任何 Skills
    ],
  },
}
```

- 省略 `agents.defaults.skills`，则默认不限制 Skills。
- 省略 `agents.list[].skills`，则继承默认值。
- 将 `agents.list[].skills: []` 设置为空数组，则不使用任何 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用自动创建工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

控制何时将工作区引导文件注入系统提示词。默认值：`"always"`。

- `"continuation-skip"`：在安全的续接轮次中（即助手已完成一次响应之后），会跳过重新注入工作区引导内容，从而减少提示词大小。Heartbeat 运行和压缩后的重试仍会重建上下文。
- `"never"`：在每一轮都禁用工作区引导和上下文文件注入。仅建议对那些完全自行管理提示词生命周期的智能体使用此选项（例如自定义上下文引擎、自行构建上下文的原生运行时，或专门设计为无引导的工作流）。Heartbeat 和压缩恢复轮次也会跳过注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

每个工作区引导文件在截断前允许的最大字符数。默认值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区引导文件合计注入的最大总字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制当引导上下文被截断时，是否向智能体可见地注入警告文本。
默认值：`"once"`。

- `"off"`：绝不向系统提示词中注入警告文本。
- `"once"`：每种唯一的截断特征仅注入一次警告（推荐）。
- `"always"`：只要存在截断，就在每次运行时都注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 上下文预算归属映射

OpenClaw 有多个高容量的提示词/上下文预算，它们被有意按子系统拆分，而不是全部通过一个通用开关统一控制。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  常规工作区引导注入。
- `agents.defaults.startupContext.*`：
  一次性的 `/new` 和 `/reset` 启动前导内容，包括最近的每日
  `memory/*.md` 文件。
- `skills.limits.*`：
  注入系统提示词中的紧凑 Skills 列表。
- `agents.defaults.contextLimits.*`：
  有界的运行时摘录和由运行时注入的内容块。
- `memory.qmd.limits.*`：
  已索引的 memory 搜索片段和注入大小控制。

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

为有界运行时上下文表面提供共享默认值。

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

- `memoryGetMaxChars`：`memory_get` 摘录在添加截断元数据和续接提示之前的默认上限。
- `memoryGetDefaultLines`：当省略 `lines` 时，`memory_get` 的默认行窗口。
- `toolResultMaxChars`：用于持久化结果和溢出恢复的实时工具结果上限。
- `postCompactionMaxChars`：压缩后刷新注入期间，`AGENTS.md` 摘录的字符上限。

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

注入系统提示词中的紧凑 Skills 列表的全局上限。
这不会影响按需读取 `SKILL.md` 文件。

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

针对 Skills 提示词预算的按智能体覆盖项。

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

在调用提供商之前，转录内容/工具图像块中图片最长边的最大像素尺寸。
默认值：`1200`。

对于包含大量截图的运行，较低的值通常会减少视觉 token 使用量和请求负载大小。
较高的值则能保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

用于系统提示词上下文的时区（不影响消息时间戳）。如果未设置，则回退为主机时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系统提示词中的时间格式。默认值：`auto`（操作系统偏好）。

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

- `model`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 字符串形式只设置主模型。
  - 对象形式会设置主模型以及按顺序排列的故障切换模型。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 作为 `image` 工具路径的视觉模型配置使用。
  - 当所选/默认模型无法接受图像输入时，也会用作回退路由。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于共享的图像生成能力，以及未来任何生成图像的工具/插件表面。
  - 常见值：`google/gemini-3.1-flash-image-preview` 用于原生 Gemini 图像生成，`fal/fal-ai/flux/dev` 用于 fal，或 `openai/gpt-image-2` 用于 OpenAI Images。
  - 如果你直接选择某个 provider/model，也要配置匹配的提供商凭证（例如，`google/*` 需要 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` 需要 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 需要 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推断出一个基于已认证提供商的默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于共享的音乐生成能力和内置的 `music_generate` 工具。
  - 常见值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推断出一个基于已认证提供商的默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择某个 provider/model，也要配置匹配的提供商凭证/API 密钥。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于共享的视频生成能力和内置的 `video_generate` 工具。
  - 常见值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断出一个基于已认证提供商的默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择某个 provider/model，也要配置匹配的提供商凭证/API 密钥。
  - 内置的 Qwen 视频生成提供商最多支持 1 个输出视频、1 张输入图像、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于 `pdf` 工具的模型路由。
  - 如果省略，PDF 工具会依次回退到 `imageModel`，再回退到已解析的会话/默认模型。
- `pdfMaxBytesMb`：当调用时未传入 `maxBytesMb` 时，`pdf` 工具使用的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具在提取回退模式中考虑的默认最大页数。
- `verboseDefault`：智能体的默认详细级别。取值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `elevatedDefault`：智能体的默认增强输出级别。取值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式为 `provider/model`（例如，`openai/gpt-5.4` 用于 API 密钥访问，或 `openai-codex/gpt-5.5` 用于 Codex OAuth）。如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 id 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商（这是已弃用的兼容行为，因此推荐显式使用 `provider/model`）。如果该提供商不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的 provider/model，而不是暴露一个陈旧且已移除提供商的默认值。
- `models`：为 `/model` 配置的模型目录和允许列表。每个条目都可以包含 `alias`（快捷方式）和 `params`（提供商特定参数，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`extra_body`/`extraBody`）。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。除非你传入 `--replace`，否则 `config set` 会拒绝会移除现有允许列表条目的替换操作。
  - 按提供商作用域的配置/新手引导流程会将所选提供商模型合并到此映射中，并保留已配置的其他无关提供商。
  - 对于直接使用的 OpenAI Responses 模型，会自动启用服务端压缩。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。参见 [OpenAI 服务端压缩](/zh-CN/providers/openai#server-side-compaction-responses-api)。
- `params`：应用于所有模型的全局默认提供商参数。在 `agents.defaults.params` 中设置（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（按模型）覆盖，然后再由 `agents.list[].params`（匹配的智能体 id）按键覆盖。详情参见 [提示词缓存](/zh-CN/reference/prompt-caching)。
- `params.extra_body`/`params.extraBody`：高级透传 JSON，会合并到 OpenAI 兼容代理的 `api: "openai-completions"` 请求体中。如果它与自动生成的请求键冲突，则额外请求体优先生效；非原生 completions 路由之后仍会剥离仅适用于 OpenAI 的 `store`。
- `embeddedHarness`：默认的底层嵌入式智能体运行时策略。若省略 `runtime`，默认使用 OpenClaw Pi。使用 `runtime: "pi"` 可强制使用内置的 PI harness，使用 `runtime: "auto"` 可让已注册的插件 harness 接管其支持的模型，或者使用已注册的 harness id，如 `runtime: "codex"`。设置 `fallback: "none"` 可禁用自动回退到 PI。像 `codex` 这样的显式插件运行时默认会以封闭失败方式运行，除非你在同一覆盖作用域中设置 `fallback: "pi"`。请将模型引用保持为规范形式 `provider/model`；通过运行时配置选择 Codex、Claude CLI、Gemini CLI 和其他执行后端，而不是使用旧式运行时提供商前缀。关于它与 provider/model 选择的区别，参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- 会修改这些字段的配置写入器（例如 `/models set`、`/models set-image` 和回退模型的添加/删除命令）会保存为规范的对象形式，并尽可能保留现有的回退列表。
- `maxConcurrent`：跨会话并行运行的最大智能体数量（每个会话本身仍然是串行的）。默认值：`4`。

### `agents.defaults.embeddedHarness`

`embeddedHarness` 控制由哪个底层执行器来运行嵌入式智能体轮次。
大多数部署应保留默认的 OpenClaw Pi 运行时。
当受信任的插件提供原生 harness 时可使用它，例如内置的
Codex 应用服务器 harness。关于其心智模型，请参见
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

- `runtime`：`"auto"`、`"pi"` 或已注册的插件 harness id。内置的 Codex 插件注册的是 `codex`。
- `fallback`：`"pi"` 或 `"none"`。在 `runtime: "auto"` 模式下，若省略 `fallback`，默认是 `"pi"`，这样旧配置在没有插件 harness 接管运行时仍可继续使用 PI。在显式插件运行时模式下，例如 `runtime: "codex"`，若省略 `fallback`，默认是 `"none"`，这样缺少 harness 时会直接失败，而不是静默改用 PI。运行时覆盖项不会从更宽作用域继承 `fallback`；如果你确实希望在显式运行时下启用这种兼容性回退，请同时设置 `fallback: "pi"`。所选插件 harness 的失败始终会直接暴露出来。
- 环境变量覆盖：`OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` 会覆盖 `runtime`；`OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` 会为当前进程覆盖 `fallback`。
- 对于仅使用 Codex 的部署，请设置 `model: "openai/gpt-5.5"` 和 `embeddedHarness.runtime: "codex"`。你也可以显式设置 `embeddedHarness.fallback: "none"` 以增强可读性；这是显式插件运行时的默认值。
- 在第一次嵌入式运行后，harness 选择会按会话 id 固定。配置/环境变量的变更只会影响新的或已重置的会话，不会影响现有转录记录。具有转录历史但未记录固定值的旧会话会被视为固定到 PI。`/status` 会报告生效的运行时，例如 `Runtime: OpenClaw Pi Default` 或 `Runtime: OpenAI Codex`。
- 这只控制嵌入式聊天 harness。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用各自的 provider/model 设置。

**内置别名简写**（仅当模型存在于 `agents.defaults.models` 中时生效）：

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
Z.AI 模型默认启用 `tool_stream` 以支持工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设为 `false` 可禁用它。
当未设置显式思考级别时，Anthropic Claude 4.6 模型默认使用 `adaptive` 思考模式。

### `agents.defaults.cliBackends`

用于纯文本回退运行（无工具调用）的可选 CLI 后端。在 API 提供商失败时，它可作为备份使用。

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
          // 或者当 CLI 接受提示词文件参数时，使用 systemPromptFileArg。
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 后端以文本为主；工具始终被禁用。
- 当设置了 `sessionArg` 时，支持会话。
- 当 `imageArg` 接受文件路径时，支持图像透传。

### `agents.defaults.systemPromptOverride`

用固定字符串替换整个由 OpenClaw 组装的系统提示词。可在默认级别（`agents.defaults.systemPromptOverride`）或按智能体（`agents.list[].systemPromptOverride`）设置。按智能体的值优先；空值或仅包含空白字符的值会被忽略。适合用于受控的提示词实验。

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

按模型家族应用的、与提供商无关的提示词叠加层。GPT-5 系列模型 id 会在不同提供商之间接收共享的行为契约；`personality` 仅控制友好的交互风格层。

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
- `"off"` 仅禁用友好层；带标签的 GPT-5 行为契约仍然启用。
- 当这个共享设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

定期 Heartbeat 运行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m 表示禁用
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 默认：true；false 会从系统提示词中省略 Heartbeat 部分
        lightContext: false, // 默认：false；true 只保留工作区引导文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 会让每次 heartbeat 在一个全新会话中运行（无对话历史）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（默认）| block
        target: "none", // 默认：none | 可选值：last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：时长字符串（ms/s/m/h）。默认值：`30m`（API 密钥认证）或 `1h`（OAuth 认证）。设置为 `0m` 可禁用。
- `includeSystemPromptSection`：为 false 时，会从系统提示词中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入引导上下文。默认值：`true`。
- `suppressToolErrorWarnings`：为 true 时，在 heartbeat 运行期间会抑制工具错误警告负载。
- `timeoutSeconds`：heartbeat 智能体轮次在被中止前允许的最长时间（秒）。若未设置，则使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直接/私信投递策略。`allow`（默认）允许投递到直接目标。`block` 会阻止投递到直接目标，并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，heartbeat 运行使用轻量级引导上下文，并且只保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次 heartbeat 都会在一个没有任何先前对话历史的全新会话中运行。与 cron `sessionTarget: "isolated"` 使用相同的隔离模式。可将每次 heartbeat 的 token 成本从约 100K 降低到约 2-5K。
- 按智能体设置：使用 `agents.list[].heartbeat`。当任一智能体定义了 `heartbeat` 时，**只有这些智能体**会运行 heartbeat。
- Heartbeat 会运行完整的智能体轮次——更短的间隔会消耗更多 token。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 已注册的 compaction 提供商插件 id（可选）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // 当 identifierPolicy=custom 时使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] 表示禁用重新注入
        model: "openrouter/anthropic/claude-sonnet-4-6", // 可选，仅用于 compaction 的模型覆盖
        notifyUser: true, // 在 compaction 开始和完成时发送简短通知给用户（默认：false）
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

- `mode`：`default` 或 `safeguard`（对长历史进行分块摘要）。参见 [Compaction](/zh-CN/concepts/compaction)。
- `provider`：已注册的 compaction 提供商插件 id。设置后，会调用该提供商的 `summarize()`，而不是使用内置的 LLM 摘要。在失败时会回退到内置实现。设置提供商会强制使用 `mode: "safeguard"`。参见 [Compaction](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 在中止前允许单次 compaction 操作运行的最长秒数。默认值：`900`。
- `keepRecentTokens`：Pi 切分点预算，用于逐字保留最近的转录尾部。手动 `/compact` 在显式设置时会遵循该值；否则，手动 compaction 是一个硬检查点。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在 compaction 摘要前附加内置的不透明标识符保留指引。
- `identifierInstructions`：可选的自定义标识符保留文本，在 `identifierPolicy=custom` 时使用。
- `qualityGuard`：针对 safeguard 摘要的输出格式错误重试检查。在 safeguard 模式下默认启用；设置 `enabled: false` 可跳过审计。
- `postCompactionSections`：compaction 后重新注入的可选 `AGENTS.md` H2/H3 章节名。默认值为 `["Session Startup", "Red Lines"]`；设为 `[]` 可禁用重新注入。当未设置或显式设置为该默认组合时，较旧的 `Every Session`/`Safety` 标题也会作为旧版回退被接受。
- `model`：可选的仅用于 compaction 摘要的 `provider/model-id` 覆盖项。当主会话应继续使用一个模型，而 compaction 摘要应改由另一个模型运行时，请使用此项；未设置时，compaction 使用会话的主模型。
- `notifyUser`：为 `true` 时，会在 compaction 开始和完成时向用户发送简短通知（例如，“Compacting context...” 和 “Compaction complete”）。默认禁用，以保持 compaction 静默。
- `memoryFlush`：在自动 compaction 之前执行的静默智能体轮次，用于存储持久记忆。工作区为只读时会跳过。

### `agents.defaults.contextPruning`

在发送给 LLM 之前，从内存上下文中裁剪**旧的工具结果**。**不会**修改磁盘上的会话历史。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 时长（ms/s/m/h），默认单位：分钟
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

<Accordion title="cache-ttl 模式行为">

- `mode: "cache-ttl"` 会启用裁剪流程。
- `ttl` 控制距离上次缓存触碰后，多久才能再次运行裁剪。
- 裁剪会先对过大的工具结果执行软裁剪，如仍有需要，再对更旧的工具结果执行硬清除。

**软裁剪** 会保留开头和结尾，并在中间插入 `...`。

**硬清除** 会用占位文本替换整个工具结果。

注意：

- 图像块永远不会被裁剪/清除。
- 比例按字符计算（近似值），不是精确 token 数。
- 如果助手消息少于 `keepLastAssistants` 条，则会跳过裁剪。

</Accordion>

行为细节参见 [会话裁剪](/zh-CN/concepts/session-pruning)。

### 分块流式传输

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（使用 minMs/maxMs）
    },
  },
}
```

- 非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才会启用分块回复。
- 渠道覆盖：`channels.<channel>.blockStreamingCoalesce`（以及按账号变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`：分块回复之间的随机暂停。`natural` = 800–2500ms。按智能体覆盖：`agents.list[].humanDelay`。

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

- 默认值：直接聊天/提及时使用 `instant`，未提及的群聊使用 `message`。
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
          // 也支持 SecretRefs / 内联内容：
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
- `ssh`：通用 SSH 支持的远程运行时
- `openshell`：OpenShell 运行时

当选择 `backend: "openshell"` 时，运行时特定设置会移动到
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：`user@host[:port]` 形式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于按作用域工作区的远程绝对根目录
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：内联内容或 SecretRefs，OpenClaw 会在运行时将其实体化为临时文件
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略开关

**SSH 认证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 由 SecretRef 支持的 `*Data` 值会在沙箱会话开始前，从当前激活的 secrets 运行时快照中解析

**SSH 后端行为：**

- 在创建或重建后为远程工作区执行一次初始化填充
- 随后保持远程 SSH 工作区为规范工作区
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程更改同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：在 `~/.openclaw/sandboxes` 下使用按作用域划分的沙箱工作区
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
          gateway: "lab", // 可选
          gatewayEndpoint: "https://lab.example", // 可选
          policy: "strict", // 可选 OpenShell 策略 id
          providers: ["openai"], // 可选
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 模式：**

- `mirror`：在执行前将本地内容同步到远程，在执行后再同步回来；本地工作区保持为规范工作区
- `remote`：在创建沙箱时只向远程初始化一次，之后保持远程工作区为规范工作区

在 `remote` 模式下，在 OpenClaw 外部对主机本地所做的编辑，在初始化步骤之后不会自动同步到沙箱中。
传输方式是通过 SSH 连接到 OpenShell 沙箱，但插件负责沙箱生命周期以及可选的镜像同步。

**`setupCommand`** 会在容器创建后执行一次（通过 `sh -lc`）。需要网络出口、可写根文件系统和 root 用户。

**容器默认使用 `network: "none"`** —— 如果智能体需要出站访问，请设置为 `"bridge"`（或自定义桥接网络）。
默认会阻止使用 `"host"`。默认也会阻止使用 `"container:<id>"`，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（紧急放行）。

**入站附件** 会暂存在当前活动工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载额外的主机目录；全局和按智能体的挂载项会合并。

**沙箱隔离浏览器**（`sandbox.browser.enabled`）：在容器中运行 Chromium + CDP。会将 noVNC URL 注入系统提示词。无需在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，OpenClaw 会发出短时有效的 token URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话以主机浏览器为目标。
- `network` 默认为 `openclaw-sandbox-browser`（专用桥接网络）。只有在你明确希望使用全局桥接连接时，才设置为 `bridge`。
- `cdpSourceRange` 可选，用于在容器边界处将 CDP 入站限制到某个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只会将额外的主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。
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
  - `--disable-extensions`（默认启用）
  - `--disable-3d-apis`、`--disable-software-rasterizer` 和 `--disable-gpu`
    默认启用；如果 WebGL/3D 使用场景需要，可通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 禁用这些默认标志。
  - 如果你的工作流依赖扩展，可使用
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 重新启用扩展。
  - `--renderer-process-limit=2` 可通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 更改；设置为 `0` 则使用 Chromium 的
    默认进程上限。
  - 当启用 `noSandbox` 时，还会附加 `--no-sandbox`。
  - 这些默认值是容器镜像基线；如果要更改容器默认值，请使用带有自定义入口点的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅支持 Docker。

构建镜像：

```bash
scripts/sandbox-setup.sh           # 主沙箱镜像
scripts/sandbox-browser-setup.sh   # 可选浏览器镜像
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
        model: "anthropic/claude-opus-4-6", // 或 { primary, fallbacks }
        thinkingDefault: "high", // 按智能体覆盖思考级别
        reasoningDefault: "on", // 按智能体覆盖推理可见性
        fastModeDefault: false, // 按智能体覆盖快速模式
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 按键覆盖匹配 defaults.models 的 params
        skills: ["docs-search"], // 设置后会替换 agents.defaults.skills
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

- `id`：稳定的智能体 id（必填）。
- `default`：当设置了多个默认值时，以第一个为准（会记录警告）。如果都未设置，则列表中的第一个条目为默认值。
- `model`：字符串形式只覆盖 `primary`；对象形式 `{ primary, fallbacks }` 会同时覆盖两者（`[]` 会禁用全局回退项）。只覆盖 `primary` 的 cron 作业仍会继承默认回退项，除非你设置 `fallbacks: []`。
- `params`：按智能体的流参数，会合并到 `agents.defaults.models` 中选定模型条目之上。用于为特定智能体覆盖如 `cacheRetention`、`temperature` 或 `maxTokens` 之类的参数，而不必复制整个模型目录。
- `skills`：可选的按智能体 Skills 允许列表。如果省略，而 `agents.defaults.skills` 已设置，则该智能体会继承它；显式列表会替换默认值而不是合并，`[]` 表示不使用任何 Skills。
- `thinkingDefault`：可选的按智能体默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当没有按消息或会话的覆盖项时，会覆盖该智能体的 `agents.defaults.thinkingDefault`。选定的提供商/模型配置决定了哪些值有效；对于 Google Gemini，`adaptive` 会保留由提供商控制的动态思考（在 Gemini 3/3.1 上省略 `thinkingLevel`，在 Gemini 2.5 上使用 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的按智能体默认推理可见性（`on | off | stream`）。当没有按消息或会话的推理覆盖项时生效。
- `fastModeDefault`：可选的按智能体快速模式默认值（`true | false`）。当没有按消息或会话的快速模式覆盖项时生效。
- `embeddedHarness`：可选的按智能体底层 harness 策略覆盖项。使用 `{ runtime: "codex" }` 可以让某一个智能体仅使用 Codex，而其他智能体继续使用默认的 `auto` 模式和 PI 回退。
- `runtime`：可选的按智能体运行时描述符。当该智能体应默认使用 ACP harness 会话时，使用 `type: "acp"` 以及 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 会派生默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name`/`emoji`。
- `subagents.allowAgents`：用于 `sessions_spawn` 的智能体 id 允许列表（`["*"]` = 任意；默认：仅相同智能体）。
- 沙箱继承保护：如果请求方会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些会在无沙箱环境下运行的目标。
- `subagents.requireAgentId`：为 true 时，会阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置；默认：false）。

---

## 多智能体路由

在一个 Gateway 网关中运行多个彼此隔离的智能体。参见 [多智能体](/zh-CN/concepts/multi-agent)。

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

- `type`（可选）：普通路由使用 `route`（缺失时默认为 route），持久 ACP 对话绑定使用 `acp`。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账号；省略 = 默认账号）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；特定于渠道）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（整个渠道范围）
6. 默认智能体

在每一层级中，第一个匹配的 `bindings` 条目获胜。

对于 `type: "acp"` 条目，OpenClaw 会按精确对话身份（`match.channel` + account + `match.peer.id`）解析，不使用上述 route 绑定层级顺序。

### 按智能体访问配置

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

优先级细节请参见 [多智能体沙箱隔离与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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
    parentForkMaxTokens: 100000, // 超过该 token 数时跳过父线程分叉（0 表示禁用）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 时长或 false
      maxDiskBytes: "500mb", // 可选硬预算
      highWaterBytes: "400mb", // 可选清理目标
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 默认按小时计算的不活动自动取消聚焦时间（`0` 表示禁用）
      maxAgeHours: 0, // 默认按小时计算的硬性最大时长（`0` 表示禁用）
    },
    mainKey: "main", // 旧版字段（运行时始终使用 "main"）
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
  - `per-sender`（默认）：在一个渠道上下文中，每个发送者都有独立的会话。
  - `global`：一个渠道上下文中的所有参与者共享同一个会话（仅在确实需要共享上下文时使用）。
- **`dmScope`**：私信如何分组。
  - `main`：所有私信共享主会话。
  - `per-peer`：按发送者 id 跨渠道隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账号 + 渠道 + 发送者隔离（推荐用于多账号）。
- **`identityLinks`**：将规范 id 映射到带提供商前缀的对端，用于跨渠道共享会话。
- **`reset`**：主要重置策略。`daily` 会在本地时间 `atHour` 重置；`idle` 会在 `idleMinutes` 的空闲后重置。当两者都已配置时，以先到期者为准。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 仍可作为 `direct` 的别名使用。
- **`parentForkMaxTokens`**：创建分叉线程会话时，允许父会话的最大 `totalTokens`（默认 `100000`）。
  - 如果父会话的 `totalTokens` 超过此值，OpenClaw 会启动一个全新的线程会话，而不是继承父转录历史。
  - 设置为 `0` 可禁用此保护，并始终允许从父会话分叉。
- **`mainKey`**：旧版字段。运行时始终对主私聊桶使用 `"main"`。
- **`agentToAgent.maxPingPongTurns`**：在智能体到智能体交换期间，智能体之间允许的最大来回回复轮次（整数，范围：`0`–`5`）。`0` 会禁用这种来回链式交互。
- **`sendPolicy`**：可按 `channel`、`chatType`（`direct|group|channel`，其中旧版 `dm` 为别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一个拒绝规则优先。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 会实际执行清理。
  - `pruneAfter`：陈旧条目的年龄截止值（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中允许的最大条目数（默认 `500`）。
  - `rotateBytes`：当 `sessions.json` 超过该大小时进行轮换（默认 `10mb`）。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留期。默认等于 `pruneAfter`；设置为 `false` 可禁用。
  - `maxDiskBytes`：可选的会话目录磁盘预算。在 `warn` 模式下会记录警告；在 `enforce` 模式下会优先移除最旧的工件/会话。
  - `highWaterBytes`：预算清理后的可选目标值。默认是 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（提供商可覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认按小时计算的不活动自动取消聚焦时间（`0` 表示禁用；提供商可覆盖）
  - `maxAgeHours`：默认按小时计算的硬性最大时长（`0` 表示禁用；提供商可覆盖）

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // 或 "auto"
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
      debounceMs: 2000, // 0 表示禁用
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 响应前缀

按渠道/账号覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析顺序（越具体越优先）：账号 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 会派生为 `[{identity.name}]`。

**模板变量：**

| 变量 | 描述 | 示例 |
| ----------------- | ---------------------- | --------------------------- |
| `{model}` | 简短模型名称 | `claude-opus-4-6` |
| `{modelFull}` | 完整模型标识符 | `anthropic/claude-opus-4-6` |
| `{provider}` | 提供商名称 | `anthropic` |
| `{thinkingLevel}` | 当前思考级别 | `high`、`low`、`off` |
| `{identity.name}` | 智能体身份名称 | （与 `"auto"` 相同） |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认反应

- 默认使用当前智能体的 `identity.emoji`，否则为 `"👀"`。设为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账号 → 渠道 → `messages.ackReaction` → identity 回退。
- 作用范围：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord 和 Telegram 上回复后移除确认反应。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期状态反应。
  在 Slack 和 Discord 上，未设置时只要确认反应处于激活状态，就会保持启用状态反应。
  在 Telegram 上，必须显式设为 `true` 才会启用生命周期状态反应。

### 入站去抖

将来自同一发送者的快速连续纯文本消息合并为一个智能体轮次。媒体/附件会立即触发发送。控制命令会绕过去抖。

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

- `auto` 控制默认自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可覆盖本地偏好，`/tts status` 会显示生效状态。
- `summaryModel` 会覆盖自动摘要所使用的 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（需显式启用）。
- API 密钥会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 内置语音提供商由插件拥有。如果设置了 `plugins.allow`，请加入你想使用的每个 TTS 提供商插件，例如 Edge TTS 使用 `microsoft`。旧版提供商 id `edge` 可作为 `microsoft` 的别名使用。
- `providers.openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序为：配置、然后 `OPENAI_TTS_BASE_URL`、再然后 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为兼容 OpenAI 的 TTS 服务器，并放宽模型/语音校验。

---

## 对话

对话模式的默认值（macOS/iOS/Android）。

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

- 当配置了多个对话提供商时，`talk.provider` 必须匹配 `talk.providers` 中的某个键。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容，会自动迁移到 `talk.providers.<provider>`。
- 语音 id 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- 只有在未配置 Talk API 密钥时，才会应用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 允许对话指令使用友好名称。
- `providers.mlx.modelId` 选择 macOS 本地 MLX helper 使用的 Hugging Face 仓库。如省略，macOS 使用 `mlx-community/Soprano-80M-bf16`。
- macOS 的 MLX 播放会通过内置的 `openclaw-mlx-tts` helper 运行；如果该 helper 不存在，则使用 `PATH` 上的可执行文件；开发时可用 `OPENCLAW_MLX_TTS_BIN` 覆盖 helper 路径。
- `silenceTimeoutMs` 控制对话模式在用户静音后等待多久才发送转录内容。未设置时会保留平台默认暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）。

---

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速设置
- [配置示例](/zh-CN/gateway/configuration-examples)
