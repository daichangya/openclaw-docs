---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 认证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-04-23T00:39:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw 内置了适用于 Grok 模型的 `xai` 提供商插件。

## 入门指南

<Steps>
  <Step title="创建 API 密钥">
    在 [xAI 控制台](https://console.x.ai/) 中创建一个 API 密钥。
  </Step>
  <Step title="设置你的 API 密钥">
    设置 `XAI_API_KEY`，或运行：

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="选择模型">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw 使用 xAI Responses API 作为内置 xAI 传输层。同一个
`XAI_API_KEY` 也可用于由 Grok 支持的 `web_search`、原生
`x_search`，以及远程 `code_execution`。
如果你将 xAI 密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，
内置的 xAI 模型提供商也会将该密钥复用为回退值。
`code_execution` 的调优配置位于 `plugins.entries.xai.config.codeExecution` 下。
</Note>

## 内置模型目录

OpenClaw 开箱即用地包含以下 xAI 模型系列：

| 系列 | 模型 ID |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3 | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast` |
| Grok 4 | `grok-4`, `grok-4-0709` |
| Grok 4 Fast | `grok-4-fast`, `grok-4-fast-non-reasoning` |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning` |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code | `grok-code-fast-1` |

当较新的 `grok-4*` 和 `grok-code-fast*` ID 遵循相同的 API 形态时，
该插件也会转发解析这些 ID。

<Tip>
`grok-4-fast`、`grok-4-1-fast` 和 `grok-4.20-beta-*` 变体，
是当前内置目录中支持图像能力的 Grok 引用。
</Tip>

## OpenClaw 功能覆盖范围

当行为能够清晰适配时，内置插件会将 xAI 当前公开的 API 能力映射到 OpenClaw 的共享
提供商和工具契约上。

| xAI 能力 | OpenClaw 表面 | 状态 |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses | `xai/<model>` model 提供商 | 是 |
| 服务端 Web 搜索 | `web_search` provider `grok` | 是 |
| 服务端 X 搜索 | `x_search` 工具 | 是 |
| 服务端代码执行 | `code_execution` 工具 | 是 |
| 图像 | `image_generate` | 是 |
| 视频 | `video_generate` | 是 |
| 批量文本转语音 | `messages.tts.provider: "xai"` / `tts` | 是 |
| 流式 TTS | — | 未暴露；OpenClaw 的 TTS 契约返回完整音频缓冲区 |
| 批量语音转文本 | `tools.media.audio` / 媒体理解 | 是 |
| 流式语音转文本 | Voice Call `streaming.provider: "xai"` | 是 |
| 实时语音 | — | 尚未暴露；使用不同的会话 / WebSocket 契约 |
| 文件 / 批处理 | 仅限通用模型 API 兼容性 | 不是一等 OpenClaw 工具 |

<Note>
OpenClaw 使用 xAI 的 REST 图像 / 视频 / TTS / STT API 来实现媒体生成、
语音和批量转录；使用 xAI 的流式 STT WebSocket 来实现实时语音通话转录；
并使用 Responses API 来实现模型、搜索和代码执行工具。那些需要不同
OpenClaw 契约的能力，例如实时语音会话，会在此处作为上游能力进行说明，
而不是隐藏的插件行为。
</Note>

### 快速开始模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
会将原生 xAI 请求按如下方式重写：

| 源模型 | 快速开始模式目标 |
| ------------- | ------------------ |
| `grok-3` | `grok-3-fast` |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4` | `grok-4-fast` |
| `grok-4-0709` | `grok-4-fast` |

### 旧版兼容别名

旧版别名仍会规范化为标准的内置 ID：

| 旧版别名 | 标准 ID |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning` | `grok-4-fast` |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast` |
| `grok-4.20-reasoning` | `grok-4.20-beta-latest-reasoning` |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置的 `grok` Web 搜索提供商也使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置的 `xai` 插件通过共享的
    `video_generate` 工具注册视频生成功能。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：文生视频、图生视频、远程视频编辑，以及远程视频延长
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：生成 / 图生视频为 1-15 秒，延长为 2-10 秒

    <Warning>
    不接受本地视频缓冲区。对于视频编辑 / 延长输入，请使用远程 `http(s)` URL。
    图生视频接受本地图像缓冲区，因为 OpenClaw 可以将其编码为供 xAI 使用的数据 URL。
    </Warning>

    要将 xAI 用作默认视频提供商：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    有关共享工具参数、提供商选择和故障切换行为，请参阅 [视频生成](/zh-CN/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置的 `xai` 插件通过共享的
    `image_generate` 工具注册图像生成功能。

    - 默认图像模型：`xai/grok-imagine-image`
    - 其他模型：`xai/grok-imagine-image-pro`
    - 模式：文生图和参考图编辑
    - 参考输入：一个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像

    OpenClaw 会向 xAI 请求 `b64_json` 图像响应，以便生成的媒体能够通过常规渠道附件路径进行存储和传递。本地参考图像会被转换为数据 URL；远程 `http(s)` 参考则会直接透传。

    要将 xAI 用作默认图像提供商：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI 还记录了 `quality`、`mask`、`user` 以及其他原生比例，例如 `1:2`、`2:1`、`9:20` 和 `20:9`。目前 OpenClaw 仅转发跨提供商共享的图像控制项；不受支持的原生专属选项会有意不通过 `image_generate` 暴露出来。
    </Note>

  </Accordion>

  <Accordion title="文本转语音">
    内置的 `xai` 插件通过共享的 `tts`
    提供商表面注册文本转语音功能。

    - 音色：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 默认音色：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 语速：提供商原生语速覆盖项
    - 不支持原生 Opus 语音便笺格式

    要将 xAI 用作默认 TTS 提供商：

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点。xAI 也提供基于 WebSocket 的流式 TTS，但 OpenClaw 的语音提供商契约当前要求在回复交付前先获得完整音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `xai` 插件通过 OpenClaw 的媒体理解转录表面注册批量语音转文本功能。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，凡是入站音频转录使用
      `tools.media.audio` 的地方都支持，包括 Discord 语音频道片段和渠道音频附件

    要强制为入站音频转录使用 xAI：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    可以通过共享音频媒体配置或按调用的转录请求提供语言。提示词提示也被共享的 OpenClaw 表面接受，但 xAI REST STT 集成目前只转发文件、模型和语言，因为这些能够清晰映射到当前公开的 xAI 端点。

  </Accordion>

  <Accordion title="流式语音转文本">
    内置的 `xai` 插件还为实时语音通话音频注册了一个实时转录提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测：`800ms`
    - 默认启用中间转录结果

    Voice Call 的 Twilio 媒体流会发送 G.711 µ-law 音频帧，因此 xAI 提供商可以直接转发这些帧而无需转码：

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    提供商自有配置位于
    `plugins.entries.voice-call.config.streaming.providers.xai` 下。支持的键名包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或 `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    这个流式提供商用于 Voice Call 的实时转录路径。Discord 语音当前会录制短片段，并改用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置 xAI 插件将 `x_search` 作为 OpenClaw 工具公开，用于通过 Grok 搜索 X（前身为 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键名 | 类型 | 默认值 | 说明 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled` | boolean | — | 启用或禁用 `x_search` |
    | `model` | string | `grok-4-1-fast` | 用于 `x_search` 请求的模型 |
    | `inlineCitations` | boolean | — | 在结果中包含行内引用 |
    | `maxTurns` | number | — | 最大对话轮数 |
    | `timeoutSeconds` | number | — | 请求超时时间（秒） |
    | `cacheTtlMinutes` | number | — | 缓存生存时间（分钟） |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="代码执行配置">
    内置的 xAI 插件将 `code_execution` 作为 OpenClaw 工具公开，用于在 xAI 的沙箱环境中执行远程代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键名 | 类型 | 默认值 | 说明 |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled` | boolean | `true`（如果密钥可用） | 启用或禁用代码执行 |
    | `model` | string | `grok-4-1-fast` | 用于代码执行请求的模型 |
    | `maxTurns` | number | — | 最大对话轮数 |
    | `timeoutSeconds` | number | — | 请求超时时间（秒） |

    <Note>
    这是远程 xAI 沙箱执行，不是本地 [`exec`](/zh-CN/tools/exec)。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="已知限制">
    - 当前认证方式仅支持 API 密钥。OpenClaw 还不支持 xAI OAuth 或设备代码流程。
    - `grok-4.20-multi-agent-experimental-beta-0304` 在常规 xAI 提供商路径中不受支持，因为它需要与标准 OpenClaw xAI 传输层不同的上游 API 表面。
    - xAI Realtime voice 尚未注册为 OpenClaw 提供商。它需要与批量 STT 或流式转录不同的双向语音会话契约。
    - 在共享 `image_generate` 工具具备相应的跨提供商控制项之前，xAI 图像 `quality`、图像 `mask` 和额外的原生专属宽高比不会被公开。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享运行器路径上自动应用 xAI 专用的工具 schema 和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设为 `false` 可禁用它。
    - 内置 xAI 包装器会在发送原生 xAI 请求前，移除不受支持的严格工具 schema 标志和推理负载键。
    - `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw 工具公开。OpenClaw 会在每次工具请求中启用所需的特定 xAI 内置工具，而不是在每一轮聊天中附加所有原生工具。
    - `x_search` 和 `code_execution` 由内置 xAI 插件负责，而不是硬编码到核心模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，不是本地 [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径由单元测试和可选择启用的实时测试套件覆盖。实时命令会在探测 `XAI_API_KEY` 之前，从你的登录 shell（包括 `~/.profile`）加载密钥。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

提供商专用的实时测试文件会合成常规 TTS、适用于电话的 PCM TTS，通过 xAI 批量 STT 转录音频，将同一 PCM 通过 xAI 实时 STT 进行流式传输，生成文生图输出，并编辑一张参考图像。共享图像实时测试文件则通过 OpenClaw 的运行时选择、故障切换、规范化和媒体附件路径来验证同一个 xAI 提供商。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="所有提供商" href="/zh-CN/providers/index" icon="grid-2">
    更广泛的提供商概览。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和修复方法。
  </Card>
</CardGroup>
