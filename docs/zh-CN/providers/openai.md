---
read_when:
    - 你想在 OpenClaw 中使用 OpenAI 模型
    - 你想使用 Codex 订阅认证，而不是 API 密钥
    - 你需要更严格的 GPT-5 智能体执行行为
summary: 在 OpenClaw 中使用 OpenAI 的 API 密钥或 Codex 订阅
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T01:23:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775a937680731ff09181dd58d2be1ca1a751c9193ac299ba6657266490a6a9b7
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI 提供用于 GPT 模型的开发者 API。OpenClaw 支持两种认证方式：

  - **API 密钥** — 通过按量计费直接访问 OpenAI Platform（`openai/*` 模型）
  - **Codex 订阅** — 通过 ChatGPT/Codex 登录并使用订阅访问（`openai-codex/*` 模型）

  OpenAI 明确支持在 OpenClaw 这类外部工具和工作流中使用订阅 OAuth。

  ## OpenClaw 功能覆盖范围

  | OpenAI 能力 | OpenClaw 表面 | 状态 |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | 聊天 / Responses | `openai/<model>` 模型提供商 | 是 |
  | Codex 订阅模型 | `openai-codex/<model>` 模型提供商 | 是 |
  | 服务端 Web 搜索 | 原生 OpenAI Responses 工具 | 是，启用 Web 搜索且未固定提供商时 |
  | 图像 | `image_generate` | 是 |
  | 视频 | `video_generate` | 是 |
  | 文本转语音 | `messages.tts.provider: "openai"` / `tts` | 是 |
  | 批量语音转文本 | `tools.media.audio` / 媒体理解 | 是 |
  | 流式语音转文本 | Voice Call `streaming.provider: "openai"` | 是 |
  | 实时语音 | Voice Call `realtime.provider: "openai"` | 是 |
  | Embeddings | memory embedding 提供商 | 是 |

  ## 入门指南

  选择你偏好的认证方式，并按照设置步骤操作。

  <Tabs>
  <Tab title="API 密钥（OpenAI Platform）">
    **最适合：** 直接访问 API 和按量计费。

    <Steps>
      <Step title="获取你的 API 密钥">
        在 [OpenAI Platform 控制台](https://platform.openai.com/api-keys) 中创建或复制一个 API 密钥。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接传入密钥：

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

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex 登录通过 `openai-codex/*` 路由，而不是 `openai/*`。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **不会** 在直接 API 路径上公开 `openai/gpt-5.3-codex-spark`。实时 OpenAI API 请求会拒绝该模型。Spark 仅限 Codex。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **最适合：** 使用你的 ChatGPT/Codex 订阅，而不是单独的 API 密钥。Codex cloud 需要 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex 登录 |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex 登录（取决于授权资格） |

    <Note>
    此路由与 `openai/gpt-5.4` 有意分离。直接 Platform 访问请使用带 API 密钥的 `openai/*`，Codex 订阅访问请使用 `openai-codex/*`。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    如果新手引导复用了现有的 Codex CLI 登录，这些凭证仍由 Codex CLI 管理。过期后，OpenClaw 会先重新读取外部 Codex 来源，再把刷新的凭证写回 Codex 存储。
    </Tip>

    ### 上下文窗口上限

    OpenClaw 将模型元数据与运行时上下文上限视为两个独立的值。

    对于 `openai-codex/gpt-5.4`：

    - 原生 `contextWindow`：`1050000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中通常具有更好的延迟和质量表现。你可以用 `contextTokens` 覆盖它：

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    使用 `contextWindow` 来声明原生模型元数据。使用 `contextTokens` 来限制运行时上下文预算。
    </Note>

  </Tab>
</Tabs>

## 图像生成

内置的 `openai` 插件通过 `image_generate` 工具注册图像生成功能。

| 能力 | 值 |
| ------------------------- | ---------------------------------- |
| 默认模型 | `openai/gpt-image-2` |
| 每次请求的最大图像数 | 4 |
| 编辑模式 | 已启用（最多 5 张参考图像） |
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
有关共享工具参数、提供商选择和故障转移行为，请参见 [图像生成](/zh-CN/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文生图生成和图像编辑的默认模型。`gpt-image-1` 仍可作为显式模型覆盖使用，但新的 OpenAI 图像工作流应使用 `openai/gpt-image-2`。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="为 macOS 上的 OpenClaw 制作一张精致的发布海报" size=3840x2160 count=1
```

编辑：

```
/tool image_generate model=openai/gpt-image-2 prompt="保留物体形状，将材质改为半透明玻璃" image=/path/to/reference.png size=1024x1536
```

## 视频生成

内置的 `openai` 插件通过 `video_generate` 工具注册视频生成功能。

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
有关共享工具参数、提供商选择和故障转移行为，请参见 [视频生成](/zh-CN/tools/video-generation)。
</Note>

## GPT-5 提示词扩展

OpenClaw 会为跨提供商的 GPT-5 系列运行添加共享的 GPT-5 提示词扩展。它按模型 id 应用，因此 `openai/gpt-5.4`、`openai-codex/gpt-5.4`、`openrouter/openai/gpt-5.4`、`opencode/gpt-5.4` 以及其他兼容的 GPT-5 引用都会接收相同的叠加层。较旧的 GPT-4.x 模型不会应用该扩展。

内置的原生 Codex harness 提供商（`codex/*`）通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和心跳叠加层，因此 `codex/gpt-5.x` 会话会保持相同的后续跟进行为和主动心跳指引，即使 Codex 拥有 harness 提示词的其余部分也是如此。

GPT-5 扩展添加了一个带标签的行为契约，用于规定角色持续性、执行安全、工具纪律、输出形态、完成检查和验证。特定渠道的回复和静默消息行为仍保留在共享的 OpenClaw 系统提示词和出站传递策略中。对于匹配的模型，GPT-5 指引始终启用。友好的交互风格层是独立的，并且可配置。

| 值 | 效果 |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（默认） | 启用友好的交互风格层 |
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
当共享设置 `agents.defaults.promptOverlays.gpt5.personality` 未设置时，仍会读取旧版 `plugins.entries.openai.config.personality` 作为兼容性回退。
</Note>

## 语音和语音识别

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` 插件为 `messages.tts` 表面注册语音合成功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 语音 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音便笺为 `opus`，文件为 `mp3` |
    | API 密钥 | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
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
    设置 `OPENAI_TTS_BASE_URL` 可以覆盖 TTS Base URL，而不会影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `openai` 插件通过 OpenClaw 的媒体理解转录表面注册批量语音转文本功能。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转录使用
      `tools.media.audio`，就受支持，包括 Discord 语音频道片段和渠道
      音频附件

    要为入站音频转录强制使用 OpenAI：

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

    当共享音频媒体配置或每次调用的转录请求提供了语言和提示词提示时，
    这些内容会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` 插件为 Voice Call 插件注册实时转录功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示词 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用到 `wss://api.openai.com/v1/realtime` 的 WebSocket 连接，并采用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。此流式提供商用于 Voice Call 的实时转录路径；Discord 语音当前仍会录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` 插件为 Voice Call 插件注册实时语音功能。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | 语音 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    通过 `azureEndpoint` 和 `azureDeployment` 配置键支持 Azure OpenAI。支持双向工具调用。使用 G.711 u-law 音频格式。
    </Note>

  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="传输方式（WebSocket 与 SSE）">
    OpenClaw 对 `openai/*` 和 `openai-codex/*` 都优先使用 WebSocket，并在失败时回退到 SSE（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw 会：
    - 在回退到 SSE 之前，重试一次早期 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的会话与轮次标识头
    - 在不同传输变体之间规范化用量计数器（`input_tokens` / `prompt_tokens`）

    | 值 | 行为 |
    |-------|----------|
    | `"auto"`（默认） | 优先 WebSocket，失败时回退到 SSE |
    | `"sse"` | 仅强制使用 SSE |
    | `"websocket"` | 仅强制使用 WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
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
    OpenClaw 默认对 `openai/*` 启用 WebSocket 预热，以降低首次轮次延迟。

    ```json5
    // 禁用预热
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 为 `openai/*` 和 `openai-codex/*` 提供共享的快速模式开关：

    - **聊天/UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用后，OpenClaw 会将快速模式映射到 OpenAI 优先处理（`service_tier = "priority"`）。现有的 `service_tier` 值会被保留，并且快速模式不会重写 `reasoning` 或 `text.verbosity`。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    会话覆盖优先于配置。在 Sessions UI 中清除会话覆盖后，该会话会恢复为配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 提供优先处理。你可以在 OpenClaw 中按模型设置它：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    支持的值：`auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` 仅会转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果你通过代理路由任一提供商，OpenClaw 会保持 `service_tier` 不变。
    </Warning>

  </Accordion>

  <Accordion title="服务端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenClaw 会自动启用服务端压缩：

    - 强制设置 `store: true`（除非模型兼容性将 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    <Tabs>
      <Tab title="显式启用">
        对 Azure OpenAI Responses 这类兼容端点很有用：

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
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
                "openai/gpt-5.4": {
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
                "openai/gpt-5.4": {
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
    `responsesServerCompaction` 仅控制 `context_management` 注入。除非兼容性将 `supportsStore: false`，直接 OpenAI Responses 模型仍会强制使用 `store: true`。
    </Note>

  </Accordion>

  <Accordion title="严格智能体式 GPT 模式">
    对于 `openai/*` 和 `openai-codex/*` 上的 GPT-5 系列运行，OpenClaw 可以使用更严格的内嵌执行契约：

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
    - 对于较大工作自动启用 `update_plan`
    - 如果模型持续只做计划而不行动，则显示明确的阻塞状态

    <Note>
    仅限 OpenAI 和 Codex GPT-5 系列运行。其他提供商和较旧的模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生路由与 OpenAI-compatible 路由">
    OpenClaw 会区别对待直接 OpenAI、Codex 和 Azure OpenAI 端点，以及通用的 OpenAI-compatible `/v1` 代理：

    **原生路由**（`openai/*`、`openai-codex/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对于拒绝 `reasoning.effort: "none"` 的模型或代理，省略禁用的 reasoning
    - 默认将工具 schema 设为严格模式
    - 仅在已验证的原生主机上附加隐藏归因头
    - 保留 OpenAI 专有的请求整形（`service_tier`、`store`、reasoning 兼容性、提示词缓存提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 不强制严格工具 schema 或原生专用头

    Azure OpenAI 使用原生传输和兼容行为，但不会接收隐藏归因头。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
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
