---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型。
    - 你想使用 Codex 订阅认证，而不是 API keys。
    - 你需要更严格的 GPT-5 智能体执行行为。
summary: 在 OpenClaw 中通过 API keys 或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T07:51:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI 为 GPT 模型提供开发者 API，而 Codex 也可作为 ChatGPT 套餐中的 coding agent，通过 OpenAI 的 Codex 客户端使用。OpenClaw 将这些表面分开处理，以保持配置行为可预测。

  OpenClaw 支持三种 OpenAI 系列路径。模型前缀用于选择 provider/认证路径；单独的运行时设置用于选择由谁执行内嵌智能体循环：

  - **API key** — 通过 OpenAI Platform 直接访问，按使用量计费（`openai/*` 模型）
  - **通过 PI 使用 Codex 订阅** — 使用 ChatGPT/Codex 登录和订阅访问（`openai-codex/*` 模型）
  - **Codex app-server harness** — 原生 Codex app-server 执行（`openai/*` 模型加上 `agents.defaults.agentRuntime.id: "codex"`）

  OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

  provider、模型、运行时和渠道是彼此独立的层。如果你把这些标签混在一起了，请在修改配置前先阅读 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

  ## 快速选择

  | 目标 | 使用方式 | 说明 |
  | --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
  | 直接使用 API key 计费 | `openai/gpt-5.5` | 设置 `OPENAI_API_KEY`，或运行 OpenAI API key 新手引导。 |
  | 使用 ChatGPT/Codex 订阅认证的 GPT-5.5 | `openai-codex/gpt-5.5` | 这是 Codex OAuth 的默认 PI 路径。是订阅配置的首选方案。 |
  | 使用原生 Codex app-server 行为的 GPT-5.5 | `openai/gpt-5.5` 加 `agentRuntime.id: "codex"` | 为该模型引用强制使用 Codex app-server harness。 |
  | 图像生成或编辑 | `openai/gpt-image-2` | 可配合 `OPENAI_API_KEY` 或 OpenAI Codex OAuth 使用。 |
  | 透明背景图像 | `openai/gpt-image-1.5` | 使用 `outputFormat=png` 或 `webp`，并设置 `openai.background=transparent`。 |

  ## 命名对照

  这些名称看起来相似，但不能互换：

  | 你看到的名称 | 所属层级 | 含义 |
  | ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
  | `openai` | 提供商前缀 | 直接 OpenAI Platform API 路径。 |
  | `openai-codex` | 提供商前缀 | 通过普通 OpenClaw Pi 运行器走 OpenAI Codex OAuth/订阅路径。 |
  | `codex` plugin | 插件 | OpenClaw 内置插件，提供原生 Codex app-server 运行时和 `/codex` 聊天控制。 |
  | `agentRuntime.id: codex` | Agent Runtimes | 为内嵌轮次强制使用原生 Codex app-server harness。 |
  | `/codex ...` | 聊天命令集 | 在对话中绑定/控制 Codex app-server 线程。 |
  | `runtime: "acp", agentId: "codex"` | ACP 会话路径 | 通过 ACP/acpx 运行 Codex 的显式后备路径。 |

  这意味着一个配置中可以有意同时包含 `openai-codex/*` 和 `codex` 插件。当你希望通过 PI 使用 Codex OAuth，同时又希望原生 `/codex` 聊天控制可用时，这是有效的。`openclaw doctor` 会对这种组合发出警告，以便你确认这是有意为之；它不会重写该配置。

  <Note>
  GPT-5.5 同时可通过直接 OpenAI Platform API key 访问，以及订阅/OAuth 路径访问。对直接 `OPENAI_API_KEY` 流量，请使用 `openai/gpt-5.5`；对通过 PI 的 Codex OAuth，请使用 `openai-codex/gpt-5.5`；对原生 Codex app-server harness，请使用带 `agentRuntime.id: "codex"` 的 `openai/gpt-5.5`。
  </Note>

  <Note>
  启用 OpenAI 插件或选择 `openai-codex/*` 模型，并不会启用内置 Codex app-server 插件。只有当你显式选择原生 Codex harness（`agentRuntime.id: "codex"`）或使用旧版 `codex/*` 模型引用时，OpenClaw 才会启用该插件。
  如果内置 `codex` 插件已启用，但 `openai-codex/*` 仍通过 PI 解析，`openclaw doctor` 会发出警告，但会保持该路径不变。
  </Note>

  ## OpenClaw 功能覆盖范围

  | OpenAI 能力 | OpenClaw 表面 | 状态 |
  | ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
  | 聊天 / Responses | `openai/<model>` 模型提供商 | 是 |
  | Codex 订阅模型 | 使用 `openai-codex` OAuth 的 `openai-codex/<model>` | 是 |
  | Codex app-server harness | 带 `agentRuntime.id: codex` 的 `openai/<model>` | 是 |
  | 服务端 Web 搜索 | 原生 OpenAI Responses 工具 | 是，当启用 Web 搜索且未固定 provider 时 |
  | 图像 | `image_generate` | 是 |
  | 视频 | `video_generate` | 是 |
  | 文本转语音 | `messages.tts.provider: "openai"` / `tts` | 是 |
  | 批量语音转文本 | `tools.media.audio` / 媒体理解 | 是 |
  | 流式语音转文本 | Voice Call `streaming.provider: "openai"` | 是 |
  | 实时语音 | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是 |
  | Embeddings | memory embedding provider | 是 |

  ## 入门指南

  选择你偏好的认证方式，并按照设置步骤进行操作。

  <Tabs>
  <Tab title="API key（OpenAI Platform）">
    **最适合：** 直接 API 访问和按使用量计费。

    <Steps>
      <Step title="获取你的 API key">
        在 [OpenAI Platform dashboard](https://platform.openai.com/api-keys) 创建或复制一个 API key。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接传入 key：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路径概览

    | 模型引用 | 运行时配置 | 路径 | 认证 |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5` | 省略 / `agentRuntime.id: "pi"` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 省略 / `agentRuntime.id: "pi"` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Codex app-server |

    <Note>
    `openai/*` 是直接 OpenAI API key 路径，除非你显式强制使用 Codex app-server harness。对通过默认 Pi 运行器的 Codex OAuth，请使用 `openai-codex/*`；对原生 Codex app-server 执行，请使用带 `agentRuntime.id: "codex"` 的 `openai/gpt-5.5`。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **不会**暴露 `openai/gpt-5.3-codex-spark`。实时 OpenAI API 请求会拒绝该模型，当前 Codex 目录也未公开它。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，而不是单独的 API key。Codex cloud 需要 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        对于无头环境或不适合回调的设置，可添加 `--device-code`，通过 ChatGPT device-code 流程登录，而不是使用 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 路径概览

    | 模型引用 | 运行时配置 | 路径 | 认证 |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | 省略 / `runtime: "pi"` | 通过 Pi 的 ChatGPT/Codex OAuth | Codex 登录 |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | 仍然是 Pi，除非有插件显式接管 `openai-codex` | Codex 登录 |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Codex app-server 认证 |

    <Note>
    对认证/配置文件命令，继续使用 `openai-codex` provider ID。`openai-codex/*` 模型前缀也是通过 Codex OAuth 走 Pi 的显式路径。
    它不会选择或自动启用内置 Codex app-server harness。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上面的 device-code 流程登录——OpenClaw 会在自己的智能体认证存储中管理生成的凭证。
    </Note>

    ### 状态指示器

    聊天 `/status` 会显示当前会话正在使用的模型运行时。
    默认的 Pi harness 会显示为 `Runtime: OpenClaw Pi Default`。当选择内置 Codex app-server harness 时，`/status` 会显示
    `Runtime: OpenAI Codex`。现有会话会保留其已记录的 harness ID，因此如果你在更改 `agentRuntime` 后希望 `/status` 反映新的 Pi/Codex 选择，请使用 `/new` 或 `/reset`。

    ### Doctor 警告

    如果启用了内置 `codex` 插件，而本标签页中的
    `openai-codex/*` 路径已被选中，`openclaw doctor` 会警告该模型仍通过 Pi 解析。当这正是你希望使用的订阅认证路径时，请保持配置不变。只有在你想使用原生 Codex app-server 执行时，才切换到 `openai/<model>` 加 `agentRuntime.id: "codex"`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为两个独立值。

    对于通过 Codex OAuth 使用的 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中具有更好的延迟和质量特性。你可以使用 `contextTokens` 覆盖它：

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

<Note>
使用 `contextWindow` 声明原生模型元数据。使用 `contextTokens` 限制运行时上下文预算。
</Note>

### 目录恢复

当上游 Codex 目录中存在 `gpt-5.5` 元数据时，OpenClaw 会使用它。如果实时 Codex 发现结果在账户已认证的情况下遗漏了 `openai-codex/gpt-5.5` 这一行，OpenClaw 会合成该 OAuth 模型行，以避免 cron、子智能体和已配置默认模型运行因 `Unknown model` 而失败。

  </Tab>
</Tabs>

## 图像生成

内置 `openai` 插件通过 `image_generate` 工具注册图像生成功能。
它支持使用相同的 `openai/gpt-image-2` 模型引用，通过 OpenAI API key 图像生成和 Codex OAuth 图像生成。

| 能力 | OpenAI API key | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用 | `openai/gpt-image-2` | `openai/gpt-image-2` |
| 认证 | `OPENAI_API_KEY` | OpenAI Codex OAuth 登录 |
| 传输 | OpenAI Images API | Codex Responses 后端 |
| 每次请求的最大图像数 | 4 | 4 |
| 编辑模式 | 已启用（最多 5 张参考图像） | 已启用（最多 5 张参考图像） |
| 尺寸覆盖 | 支持，包括 2K/4K 尺寸 | 支持，包括 2K/4K 尺寸 |
| 宽高比 / 分辨率 | 不会转发到 OpenAI Images API | 在安全时映射到受支持的尺寸 |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
有关共享工具参数、提供商选择和故障切换行为，请参见 [图像生成](/zh-CN/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文生图和图像编辑的默认模型。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。对于透明背景 PNG/WebP 输出，请使用 `openai/gpt-image-1.5`；当前的 `gpt-image-2` API 会拒绝
`background: "transparent"`。

对于透明背景请求，智能体应调用 `image_generate`，并使用
`model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"`，以及
`background: "transparent"`；较旧的 `openai.background` provider 选项仍然受支持。OpenClaw 还会通过将默认的 `openai/gpt-image-2` 透明请求重写为 `gpt-image-1.5`，来保护公共 OpenAI 和 OpenAI Codex OAuth 路径；Azure 和自定义 OpenAI 兼容端点则会保留其已配置的 deployment/模型名称。

同样的设置也适用于无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

当从输入文件开始时，对 `openclaw infer image edit` 使用相同的 `--output-format` 和 `--background` 标志。
`--openai-background` 仍可作为 OpenAI 专用别名使用。

对于 Codex OAuth 安装，继续使用相同的 `openai/gpt-image-2` 引用。当配置了 `openai-codex` OAuth 配置文件时，OpenClaw 会解析该已存储的 OAuth 访问令牌，并通过 Codex Responses 后端发送图像请求。它不会先尝试 `OPENAI_API_KEY`，也不会在该请求中静默回退到 API key。如果你想改为使用直接 OpenAI Images API 路径，请显式配置 `models.providers.openai`，并设置 API key、自定义 base URL 或 Azure 端点。
如果该自定义图像端点位于受信任 LAN/私有地址上，还需设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；如果没有这一显式启用项，OpenClaw 会继续阻止私有/内部 OpenAI 兼容图像端点。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

生成透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

编辑：

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 视频生成

内置 `openai` 插件通过 `video_generate` 工具注册视频生成功能。

| 能力 | 值 |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型 | `openai/sora-2` |
| 模式 | 文生视频、图生视频、单视频编辑 |
| 参考输入 | 1 张图像或 1 个视频 |
| 尺寸覆盖 | 支持 |
| 其他覆盖 | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略，并产生工具警告 |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
有关共享工具参数、提供商选择和故障切换行为，请参见 [视频生成](/zh-CN/tools/video-generation)。
</Note>

## GPT-5 提示词叠加

OpenClaw 会为跨提供商的 GPT-5 系列运行添加共享的 GPT-5 提示词叠加。它按模型 ID 生效，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容的 GPT-5 引用都会收到相同的叠加。较旧的 GPT-4.x 模型则不会。

内置原生 Codex harness 会通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和 heartbeat 叠加，因此即使 Codex 拥有其余 harness 提示词，使用 `agentRuntime.id: "codex"` 强制执行的 `openai/gpt-5.x` 会话仍会保持相同的后续执行和主动 heartbeat 指导。

GPT-5 叠加会添加一个带标签的行为契约，用于人格持续性、执行安全、工具纪律、输出结构、完成检查和验证。渠道特定的回复和静默消息行为则保留在共享的 OpenClaw 系统提示词和出站投递策略中。GPT-5 指导会始终对匹配的模型启用。友好交互风格层是独立且可配置的。

| 值 | 效果 |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（默认） | 启用友好交互风格层 |
| `"on"` | `"friendly"` 的别名 |
| `"off"` | 仅禁用友好风格层 |

<Tabs>
  <Tab title="配置">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
运行时对值不区分大小写，因此 `"Off"` 和 `"off"` 都会禁用友好风格层。
</Tip>

<Note>
当共享设置 `agents.defaults.promptOverlays.gpt5.personality` 未设置时，仍会读取旧版 `plugins.entries.openai.config.personality` 作为兼容性后备。
</Note>

## 语音与语音识别

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置 `openai` 插件为 `messages.tts` 表面注册了语音合成功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 语音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音笔记为 `opus`，文件为 `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用语音：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS base URL，而不影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置 `openai` 插件通过
    OpenClaw 的媒体理解转录表面注册了批量语音转文本功能。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，凡是入站音频转录使用
      `tools.media.audio` 的地方都支持，包括 Discord 语音频道片段和渠道音频附件

    若要强制对入站音频转录使用 OpenAI：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    当由共享音频媒体配置或每次调用的转录请求提供语言和提示线索时，它们会被转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置 `openai` 插件为 Voice Call 插件注册了实时转录功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示词 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，并使用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。此流式提供商用于 Voice Call 的实时转录路径；Discord 语音当前仍会录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置 `openai` 插件为 Voice Call 插件注册了实时语音功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 语音 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    支持通过 `azureEndpoint` 和 `azureDeployment` 配置键使用 Azure OpenAI。支持双向工具调用。使用 G.711 u-law 音频格式。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置 `openai` provider 可以通过覆盖 base URL，将图像生成请求发送到 Azure OpenAI 资源。在图像生成路径上，OpenClaw 会检测 `models.providers.openai.baseUrl` 中的 Azure 主机名，并自动切换为 Azure 的请求结构。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），不会受 `models.providers.openai.baseUrl` 影响。有关其实 Azure 设置，请参见 [语音与语音识别](#voice-and-speech) 下的 **实时语音** 手风琴项。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户内

### 配置

若要通过内置 `openai` provider 使用 Azure 图像生成，请将
`models.providers.openai.baseUrl` 指向你的 Azure 资源，并将 `apiKey` 设置为 Azure OpenAI key（而不是 OpenAI Platform key）：

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw 会将以下 Azure 主机后缀识别为 Azure 图像生成路径：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于发送到已识别 Azure 主机的图像生成请求，OpenClaw 会：

- 发送 `api-key` 标头，而不是 `Authorization: Bearer`
- 使用按 deployment 作用域的路径（`/openai/deployments/{deployment}/...`）
- 为每个请求附加 `?api-version=...`
- 对 Azure 图像生成调用使用默认 600 秒请求超时。
  每次调用的 `timeoutMs` 值仍会覆盖此默认值。

其他 base URL（公共 OpenAI、OpenAI 兼容代理）则继续使用标准 OpenAI 图像请求结构。

<Note>
`openai` provider 图像生成路径的 Azure 路由功能需要 OpenClaw 2026.4.22 或更高版本。更早版本会将任何自定义
`openai.baseUrl` 都视为公共 OpenAI 端点，并会在 Azure 图像 deployment 上失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 可为 Azure 图像生成路径固定特定 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

如果该变量未设置，则默认值为 `2024-12-01-preview`。

### 模型名称就是 deployment 名称

Azure OpenAI 将模型绑定到 deployment。对于通过内置 `openai` provider 路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段必须是你在 Azure 门户中配置的**Azure deployment 名称**，而不是公共 OpenAI 模型 ID。

如果你创建了一个名为 `gpt-image-2-prod`、提供 `gpt-image-2` 的 deployment：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的 deployment 名称规则也适用于通过内置 `openai` provider 路由的图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域可用
（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。在创建 deployment 之前，请先查看 Microsoft 当前的区域列表，并确认你的区域提供该具体模型。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。
Azure 可能会拒绝公共 OpenAI 允许的选项（例如在 `gpt-image-2` 上的某些
`background` 值），或仅在特定模型版本上提供这些选项。这些差异来自 Azure 和底层模型，而不是 OpenClaw。如果 Azure 请求因验证错误失败，请在 Azure 门户中检查你的具体 deployment 和 API 版本所支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不会接收 OpenClaw 的隐藏归因标头——参见 [高级配置](#advanced-configuration) 下的 **原生与 OpenAI 兼容路径** 手风琴项。

对于 Azure 上的聊天或 Responses 流量（图像生成之外），请使用新手引导流程或专用 Azure provider 配置——仅设置 `openai.baseUrl` 并不会采用 Azure 的 API/认证结构。另有一个单独的
`azure-openai-responses/*` provider；参见下方的服务端压缩手风琴项。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输（WebSocket 与 SSE）">
    对于 `openai/*` 和 `openai-codex/*`，OpenClaw 都采用 WebSocket 优先、SSE 回退（`"auto"`）策略。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 之前重试一次早期 WebSocket 失败
    - 失败后将 WebSocket 标记为降级状态约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话和轮次身份标头
    - 在不同传输变体之间规范化使用量计数器（`input_tokens` / `prompt_tokens`）

    | 值 | 行为 |
    |-------|----------|
    | `"auto"`（默认） | WebSocket 优先，SSE 回退 |
    | `"sse"` | 强制仅使用 SSE |
    | `"websocket"` | 强制仅使用 WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    相关 OpenAI 文档：
    - [使用 WebSocket 的 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [流式 API 响应（SSE）](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket 预热">
    OpenClaw 默认对 `openai/*` 和 `openai-codex/*` 启用 WebSocket 预热，以减少首轮延迟。

    ```json5
    // 禁用预热
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fast 模式">
    OpenClaw 为 `openai/*` 和 `openai-codex/*` 提供共享的 Fast 模式开关：

    - **聊天/UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将 Fast 模式映射为 OpenAI 优先处理（`service_tier = "priority"`）。现有的 `service_tier` 值会被保留，Fast 模式不会重写 `reasoning` 或 `text.verbosity`。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    会话覆盖优先于配置。在 Sessions UI 中清除会话覆盖后，会话会恢复为配置中的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 暴露优先处理能力。你可以在 OpenClaw 中按模型进行设置：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    支持的值：`auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` 仅会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一 provider，OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI 插件的 Pi harness 流包装器会自动启用服务端压缩：

    - 强制 `store: true`（除非模型兼容性设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（若不可用则为 `80000`）

    这适用于内置 Pi harness 路径，以及内嵌运行所使用的 OpenAI provider hooks。原生 Codex app-server harness 通过 Codex 自行管理上下文，并通过 `agents.defaults.agentRuntime.id` 单独配置。

    <Tabs>
      <Tab title="显式启用">
        适用于 Azure OpenAI Responses 等兼容端点：

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="自定义阈值">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="禁用">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接 OpenAI Responses 模型仍会强制 `store: true`，除非兼容性设置了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="严格智能体 GPT 模式">
    对于 `openai/*` 上的 GPT-5 系列运行，OpenClaw 可以使用更严格的内嵌执行契约：

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    使用 `strict-agentic` 时，OpenClaw 会：
    - 当工具操作可用时，不再将仅有计划的轮次视为成功推进
    - 使用“立即行动”的引导重试该轮次
    - 对重要工作自动启用 `update_plan`
    - 如果模型持续规划但不执行，则显式呈现阻塞状态

    <Note>
    仅适用于 OpenAI 和 Codex 的 GPT-5 系列运行。其他 provider 和较旧模型家族仍保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生与 OpenAI 兼容路径">
    OpenClaw 对直接 OpenAI、Codex 和 Azure OpenAI 端点，与通用 OpenAI 兼容 `/v1` 代理的处理方式不同：

    **原生路径**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对拒绝 `reasoning.effort: "none"` 的模型或代理省略禁用推理设置
    - 默认对工具 schema 使用严格模式
    - 仅在已验证的原生主机上附加隐藏归因标头
    - 保留 OpenAI 专属请求结构（`service_tier`、`store`、reasoning 兼容性、提示缓存提示）

    **代理/兼容路径：**
    - 使用较宽松的兼容行为
    - 从非原生 `openai-completions` 载荷中剥离 Completions `store`
    - 接受用于 OpenAI 兼容 Completions 代理的高级 `params.extra_body`/`params.extraBody` 透传 JSON
    - 接受用于 OpenAI 兼容 Completions 代理（如 vLLM）的 `params.chat_template_kwargs`
    - 不强制严格工具 schema 或原生专属标头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏归因标头。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
</CardGroup>
