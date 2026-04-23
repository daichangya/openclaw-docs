---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证，而不是 API key
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中通过 API key 或 Codex 订阅使用 OpenAI
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T21:01:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39f5259ef82bb95bb7a94cf36a33c4a3ea2b9ba06f5355dc7abf256167d7a4b9
    source_path: providers/openai.md
    workflow: 15
---

OpenAI 为 GPT 模型提供开发者 API。OpenClaw 在相同的规范 OpenAI 模型引用后支持两种认证路径：

- **API key** —— 直接访问 OpenAI Platform，并按用量计费（`openai/*` 模型）
- **Codex 订阅** —— 使用 ChatGPT/Codex 登录与订阅访问。内部认证/provider id 是 `openai-codex`，但新的模型引用仍应使用 `openai/*`。

OpenAI 明确支持在 OpenClaw 这样的外部工具和工作流中使用订阅 OAuth。

## OpenClaw 功能覆盖

| OpenAI 能力 | OpenClaw 界面 | 状态 |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| Chat / Responses | `openai/<model>` 模型提供商 | 支持 |
| Codex 订阅模型 | 带 `openai-codex` 认证的 `openai/<model>` | 支持 |
| 服务器端 web 搜索 | 原生 OpenAI Responses 工具 | 支持，当启用 web 搜索且未固定 provider 时 |
| 图像 | `image_generate` | 支持 |
| 视频 | `video_generate` | 支持 |
| 文本转语音 | `messages.tts.provider: "openai"` / `tts` | 支持 |
| 批量语音转文本 | `tools.media.audio` / 媒体理解 | 支持 |
| 流式语音转文本 | Voice Call `streaming.provider: "openai"` | 支持 |
| 实时语音 | Voice Call `realtime.provider: "openai"` | 支持 |
| Embeddings | memory embedding provider | 支持 |

## 入门指南

请选择你偏好的认证方式，并按照相应步骤进行设置。

<Tabs>
  <Tab title="API key（OpenAI Platform）">
    **最适合：** 直接 API 访问和按用量计费。

    <Steps>
      <Step title="获取你的 API key">
        在 [OpenAI Platform dashboard](https://platform.openai.com/api-keys) 中创建或复制一个 API key。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或者直接传入 key：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用 | 路由 | 认证 |
    |-----------|-------|------|
    | `openai/gpt-5.5` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5-pro` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    `openai-codex/*` 仍然作为旧版兼容别名被接受，但新配置应使用 `openai/*`。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **不会**暴露 `openai/gpt-5.3-codex-spark`。实时 OpenAI API 请求会拒绝该模型，而当前 Codex 目录也没有暴露它。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，而不是单独的 API key。Codex 云需要 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        对于无头或不适合 localhost 回调的设置，请添加 `--device-code`，通过 ChatGPT 设备码流程登录，而不是使用 localhost 浏览器回调：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用 | 路由 | 认证 |
    |-----------|-------|------|
    | `openai/gpt-5.5` | ChatGPT/Codex OAuth | Codex 登录 |

    <Note>
    `openai-codex/*` 和 `codex/*` 模型引用是旧版兼容别名。对于认证/profile 命令，请继续使用 `openai-codex` provider id。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Note>
    新手引导不再从 `~/.codex` 导入 OAuth 材料。请使用浏览器 OAuth（默认）或上述设备码流程登录——OpenClaw 会在自己的智能体认证存储中管理得到的凭证。
    </Note>

    ### 状态指示器

    聊天 `/status` 会显示当前会话使用的是哪个内置 harness。默认 PI harness 显示为 `Runner: pi (embedded)`，不会添加额外徽章。当选择的是内置 Codex app-server harness 时，`/status` 会在 `Fast` 后附加非 PI harness id，例如
    `Fast · codex`。现有会话会保留其已记录的 harness id，因此如果你更改了 `embeddedHarness`，并希望 `/status` 反映新的 PI/Codex 选择，请使用 `/new` 或 `/reset`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据与运行时上下文上限视为两个独立值。

    对于通过 Codex OAuth 使用的 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    这个较小的默认上限在实践中具有更好的延迟和质量特性。你可以通过 `contextTokens` 覆盖它：

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
    请使用 `contextWindow` 声明原生模型元数据。请使用 `contextTokens` 限制运行时上下文预算。
    </Note>

  </Tab>
</Tabs>

## 图像生成

内置 `openai` 插件通过 `image_generate` 工具注册图像生成能力。

| 能力 | 值 |
| ------------------------- | ---------------------------------- |
| 默认模型 | `openai/gpt-image-2` |
| 每次请求最大图像数 | 4 |
| 编辑模式 | 启用（最多 5 张参考图） |
| 尺寸覆盖 | 支持，包括 2K/4K 尺寸 |
| 宽高比 / 分辨率 | 不会转发到 OpenAI Images API |

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
共享工具参数、provider 选择和故障转移行为请参阅[图像生成](/zh-CN/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文生图和图像编辑的默认模型。
`gpt-image-1` 仍可作为显式模型覆盖使用，但新的 OpenAI 图像工作流应使用 `openai/gpt-image-2`。

`openai-codex` provider 也会通过 OpenAI Codex OAuth 为图像生成和参考图像编辑暴露 `gpt-image-2`。
当智能体已通过 Codex OAuth 登录、但没有 `OPENAI_API_KEY` 时，请使用
`openai-codex/gpt-image-2`。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

使用 Codex OAuth 生成：

```
/tool image_generate model=openai-codex/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

编辑：

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 视频生成

内置 `openai` 插件通过 `video_generate` 工具注册视频生成能力。

| 能力 | 值 |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型 | `openai/sora-2` |
| 模式 | 文生视频、图生视频、单视频编辑 |
| 参考输入 | 1 张图片或 1 个视频 |
| 尺寸覆盖 | 支持 |
| 其他覆盖 | `aspectRatio`、`resolution`、`audio`、`watermark` 会被忽略，并给出工具警告 |

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
共享工具参数、provider 选择和故障转移行为请参阅[视频生成](/zh-CN/tools/video-generation)。
</Note>

## GPT-5 提示词贡献

OpenClaw 会为跨 provider 的 GPT-5 家族运行添加一个共享 GPT-5 提示词贡献。它按模型 id 应用，因此 `openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 以及其他兼容的 GPT-5 引用都会收到相同的覆盖层。较旧的 GPT-4.x 模型则不会。

内置的原生 Codex harness 会通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和心跳覆盖，因此当 `openai/gpt-5.x` 会话被强制使用 `embeddedHarness.runtime: "codex"` 时，也会保留相同的执行跟进和主动心跳指导，即使 Codex 拥有该 harness 提示词的其余部分。

GPT-5 提示词贡献增加了一个带标签的行为契约，用于人格保持、执行安全、工具纪律、输出形状、完成检查和验证。渠道专用的回复和静默消息行为则仍保留在共享 OpenClaw system prompt 和出站投递策略中。GPT-5 指导会始终为匹配模型启用。友好交互风格层是独立的，并且可配置。

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
运行时值不区分大小写，因此 `"Off"` 和 `"off"` 都会禁用友好风格层。
</Tip>

<Note>
当未设置共享的 `agents.defaults.promptOverlays.gpt5.personality` 时，仍会读取旧版 `plugins.entries.openai.config.personality` 作为兼容回退。
</Note>

## 语音和语音处理

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置 `openai` 插件会为 `messages.tts` 界面注册语音合成能力。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 语音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts` 支持） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便签为 `opus`，文件为 `mp3` |
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
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS 的 base URL，而不会影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置 `openai` 插件会通过
    OpenClaw 的媒体理解转写界面注册批量语音转文本能力。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，凡是入站音频转写使用
      `tools.media.audio` 的地方都支持它，包括 Discord 语音频道片段和渠道音频附件

    若要强制对入站音频转写使用 OpenAI：

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

    当共享音频媒体配置或单次转写请求提供语言和提示词提示时，这些提示会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置 `openai` 插件会为 Voice Call 插件注册实时转录能力。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示词 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    它使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，并采用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。这一流式 provider 用于 Voice Call 的实时转录路径；而 Discord 语音当前仍是录制短片段，并使用批量 `tools.media.audio` 转写路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置 `openai` 插件会为 Voice Call 插件注册实时语音能力。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 语音 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    通过 `azureEndpoint` 和 `azureDeployment` 配置键支持 Azure OpenAI。支持双向工具调用。使用 G.711 u-law 音频格式。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置的 `openai` provider 可以通过覆盖 base URL，将目标指向一个 Azure OpenAI 资源以进行图像生成。在图像生成路径上，OpenClaw 会检测 `models.providers.openai.baseUrl` 中的 Azure 主机名，并自动切换到 Azure 的请求形状。

<Note>
实时语音使用单独的配置路径
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），不会受到 `models.providers.openai.baseUrl` 的影响。其 Azure 设置请参阅[语音和语音处理](#voice-and-speech) 下 **实时语音** 手风琴部分。
</Note>

在以下情况下使用 Azure OpenAI：

- 你已经拥有 Azure OpenAI 订阅、配额或企业协议
- 你需要 Azure 提供的区域数据驻留或合规控制
- 你希望将流量保留在现有 Azure 租户内部

### 配置

若要通过内置 `openai` provider 使用 Azure 进行图像生成，请将
`models.providers.openai.baseUrl` 指向你的 Azure 资源，并将 `apiKey` 设置为
Azure OpenAI key（而不是 OpenAI Platform key）：

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

OpenClaw 会识别以下 Azure 主机后缀，并将其用于 Azure 图像生成路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于识别出的 Azure 主机上的图像生成请求，OpenClaw 会：

- 发送 `api-key` 标头，而不是 `Authorization: Bearer`
- 使用部署作用域路径（`/openai/deployments/{deployment}/...`）
- 在每个请求后追加 `?api-version=...`

其他 base URL（公共 OpenAI、兼容 OpenAI 的代理）仍使用标准
OpenAI 图像请求形状。

<Note>
`openai` provider 的图像生成路径使用 Azure 路由功能，要求
OpenClaw 版本为 2026.4.22 或更高。更早版本会将任意自定义
`openai.baseUrl` 视为公共 OpenAI 端点，并在 Azure 图像部署上失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 可为
Azure 图像生成路径固定特定的 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

  当该变量未设置时，默认值为 `2024-12-01-preview`。

  ### 模型名称即部署名称

  Azure OpenAI 会将模型绑定到部署。对于通过内置 `openai` provider 路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段必须是你在 Azure 门户中配置的**Azure 部署名称**，而不是公共 OpenAI 模型 id。

  如果你创建了一个名为 `gpt-image-2-prod` 的部署，并让它提供 `gpt-image-2`：

  ```
  /tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
  ```

  同样的部署名称规则也适用于通过内置 `openai` provider 路由的图像生成调用。

  ### 区域可用性

  Azure 图像生成当前仅在部分区域可用
  （例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
  `uaenorth`）。在创建部署之前，请先检查 Microsoft 当前的
  区域列表，并确认你的区域提供了对应模型。

  ### 参数差异

  Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。
  Azure 可能会拒绝公共 OpenAI 可接受的某些选项（例如在 `gpt-image-2` 上某些
  `background` 值），或者只在特定模型版本中暴露这些选项。这些差异来自 Azure 和底层模型，而不是 OpenClaw。如果 Azure 请求因校验错误而失败，请检查 Azure 门户中你的具体部署和 API 版本所支持的参数集。

  <Note>
  Azure OpenAI 使用原生传输和兼容行为，但不会接收
  OpenClaw 的隐藏归因标头——请参阅[高级配置](#advanced-configuration)下
  **原生与兼容 OpenAI 路由** 手风琴部分。

  对于 Azure 上的聊天或 Responses 流量（超出图像生成范围），请使用
  新手引导流程或专门的 Azure provider 配置——仅设置 `openai.baseUrl`
  并不会自动启用 Azure 的 API/认证形状。还存在一个独立的
  `azure-openai-responses/*` provider；请参阅下方
  Server-side compaction 手风琴部分。
  </Note>

  ## 高级配置

  <AccordionGroup>
  <Accordion title="传输（WebSocket vs SSE）">
    OpenClaw 对 `openai/*` 和 `openai-codex/*` 都默认使用 WebSocket 优先并回退到 SSE（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 会：
    - 对一次早期 WebSocket 失败重试一次，然后回退到 SSE
    - 失败后，将 WebSocket 标记为约 60 秒降级，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话与轮次身份标头
    - 跨不同传输变体统一用量计数器（`input_tokens` / `prompt_tokens`）

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
    OpenClaw 默认会为 `openai/*` 启用 WebSocket 预热，以减少首轮延迟。

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

  <Accordion title="Fast mode">
    OpenClaw 为 `openai/*` 暴露了一个共享 fast mode 开关：

    - **聊天/UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将 fast mode 映射为 OpenAI priority processing（`service_tier = "priority"`）。已有的 `service_tier` 值会被保留，fast mode 不会重写 `reasoning` 或 `text.verbosity`。

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
    会话覆盖优先于配置。在 Sessions UI 中清除会话覆盖后，会话会回到配置中的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先级处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 暴露优先级处理能力。你可以在 OpenClaw 中按模型设置它：

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
    `serviceTier` 只会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一 provider，OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction（Responses API）">
    对于直接的 OpenAI Responses 模型（位于 `api.openai.com` 上的 `openai/*`），OpenClaw 会自动启用 server-side compaction：

    - 强制设置 `store: true`（除非模型兼容性设置 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（若不可用则为 `80000`）

    <Tabs>
      <Tab title="显式启用">
        对于像 Azure OpenAI Responses 这样的兼容端点很有用：

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
    `responsesServerCompaction` 只控制 `context_management` 注入。直接的 OpenAI Responses 模型仍会强制 `store: true`，除非兼容性设置了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT 模式">
    对于 `openai/*` 上的 GPT-5 家族运行，OpenClaw 可使用更严格的内置执行契约：

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    启用 `strict-agentic` 后，OpenClaw 会：
    - 当存在可用工具动作时，不再将仅有规划的轮次视为成功进展
    - 使用一个立即行动的 steer 重试该轮次
    - 对于较大工作量自动启用 `update_plan`
    - 如果模型持续规划却不行动，则显式呈现 blocked 状态

    <Note>
    仅作用于 OpenAI 和 Codex 的 GPT-5 家族运行。其他提供商和较旧模型家族仍保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生与兼容 OpenAI 路由">
    OpenClaw 会将直接 OpenAI、Codex 和 Azure OpenAI 端点与通用的兼容 OpenAI `/v1` 代理区别对待：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对于会拒绝 `reasoning.effort: "none"` 的模型或代理，省略禁用 reasoning 的设置
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因标头
    - 保留 OpenAI 专属请求整形（`service_tier`、`store`、reasoning 兼容性、提示词缓存提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 不会强制严格工具 schema，也不会添加原生专属标头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏归因标头。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和 provider 选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和 provider 选择。
  </Card>
  <Card title="OAuth 和认证" href="/zh-CN/gateway/authentication" icon="key">
    认证细节和凭证复用规则。
  </Card>
</CardGroup>
