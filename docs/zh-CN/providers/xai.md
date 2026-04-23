---
read_when:
    - 你想在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 凭证或模型 id
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-04-23T23:03:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw 内置了 `xai` 提供商插件，用于支持 Grok 模型。

## 快速开始

<Steps>
  <Step title="创建 API key">
    在 [xAI console](https://console.x.ai/) 中创建一个 API key。
  </Step>
  <Step title="设置 API key">
    设置 `XAI_API_KEY`，或者运行：

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
OpenClaw 使用 xAI Responses API 作为内置的 xAI 传输层。同一个
`XAI_API_KEY` 也可用于由 Grok 驱动的 `web_search`、一等公民的 `x_search`，
以及远程 `code_execution`。
如果你把 xAI key 存储在 `plugins.entries.xai.config.webSearch.apiKey`
下，内置的 xAI 模型提供商也会将其作为回退项复用。
`code_execution` 的调优配置位于 `plugins.entries.xai.config.codeExecution`。
</Note>

## 内置目录

OpenClaw 默认包含以下 xAI 模型系列：

| 系列 | 模型 id |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3 | `grok-3`、`grok-3-fast`、`grok-3-mini`、`grok-3-mini-fast` |
| Grok 4 | `grok-4`、`grok-4-0709` |
| Grok 4 Fast | `grok-4-fast`、`grok-4-fast-non-reasoning` |
| Grok 4.1 Fast | `grok-4-1-fast`、`grok-4-1-fast-non-reasoning` |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`、`grok-4.20-beta-latest-non-reasoning` |
| Grok Code | `grok-code-fast-1` |

当更新的 `grok-4*` 和 `grok-code-fast*` id 遵循相同 API 结构时，插件也会向前解析它们。

<Tip>
`grok-4-fast`、`grok-4-1-fast` 和 `grok-4.20-beta-*` 变体是当前内置目录中支持图像的 Grok 引用。
</Tip>

## OpenClaw 功能覆盖范围

内置插件将 xAI 当前公开 API 接口映射到 OpenClaw 的共享提供商和工具契约上。不符合共享契约的能力（例如流式 TTS 和实时语音）不会暴露——参见下表。

| xAI 能力 | OpenClaw 接口 | 状态 |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 聊天 / Responses | `xai/<model>` 模型提供商 | 是 |
| 服务端 Web 搜索 | `web_search` 提供商 `grok` | 是 |
| 服务端 X 搜索 | `x_search` 工具 | 是 |
| 服务端代码执行 | `code_execution` 工具 | 是 |
| 图像 | `image_generate` | 是 |
| 视频 | `video_generate` | 是 |
| 批量文本转语音 | `messages.tts.provider: "xai"` / `tts` | 是 |
| 流式 TTS | — | 未暴露；OpenClaw 的 TTS 契约返回完整音频缓冲区 |
| 批量语音转文本 | `tools.media.audio` / 媒体理解 | 是 |
| 流式语音转文本 | Voice Call `streaming.provider: "xai"` | 是 |
| 实时语音 | — | 尚未暴露；其会话/WebSocket 契约不同 |
| 文件 / 批处理 | 仅通用模型 API 兼容性 | 不是一等公民 OpenClaw 工具 |

<Note>
OpenClaw 使用 xAI 的 REST 图像/视频/TTS/STT API 来处理媒体生成、
语音和批量转写；使用 xAI 的流式 STT WebSocket 来处理实时
voice-call 转写；并使用 Responses API 来处理模型、搜索和
code-execution 工具。像实时语音会话这样需要不同 OpenClaw 契约的功能，会在这里作为上游能力记录，而不是作为隐藏的插件行为存在。
</Note>

### 快速模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
会将原生 xAI 请求重写如下：

| 源模型 | 快速模式目标 |
| ------------- | ------------------ |
| `grok-3` | `grok-3-fast` |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4` | `grok-4-fast` |
| `grok-4-0709` | `grok-4-fast` |

### 旧版兼容别名

旧版别名仍会规范化为标准内置 id：

| 旧版别名 | 标准 id |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning` | `grok-4-fast` |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast` |
| `grok-4.20-reasoning` | `grok-4.20-beta-latest-reasoning` |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置的 `grok` Web 搜索提供商同样使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置的 `xai` 插件通过共享的
    `video_generate` 工具注册视频生成能力。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：文生视频、图生视频、远程视频编辑，以及远程视频延展
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：生成/图生视频为 1-15 秒，延展为 2-10 秒

    <Warning>
    不接受本地视频缓冲区。对于
    视频编辑/延展输入，请使用远程 `http(s)` URL。图生视频接受本地图像缓冲区，因为
    OpenClaw 可以将其编码为 xAI 所需的 data URL。
    </Warning>

    如需将 xAI 用作默认视频提供商：

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
    共享工具参数、提供商选择和故障转移行为请参见[视频生成](/zh-CN/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置的 `xai` 插件通过共享的
    `image_generate` 工具注册图像生成能力。

    - 默认图像模型：`xai/grok-imagine-image`
    - 额外模型：`xai/grok-imagine-image-pro`
    - 模式：文生图和参考图像编辑
    - 参考输入：一个 `image` 或最多五个 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像

    OpenClaw 会请求 xAI 返回 `b64_json` 图像响应，以便生成的媒体可以通过常规渠道附件路径进行存储和投递。本地参考图像会被转换为 data URL；远程 `http(s)` 参考图像会直接透传。

    如需将 xAI 用作默认图像提供商：

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
    xAI 还记录了 `quality`、`mask`、`user` 以及其他原生宽高比，
    例如 `1:2`、`2:1`、`9:20` 和 `20:9`。目前 OpenClaw 仅转发共享的跨提供商图像控制项；不受支持的仅限原生参数不会通过 `image_generate` 暴露，这是有意设计。
    </Note>

  </Accordion>

  <Accordion title="文本转语音">
    内置的 `xai` 插件通过共享的 `tts`
    提供商接口注册文本转语音能力。

    - 音色：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 默认音色：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 速度：提供商原生速度覆盖
    - 不支持原生 Opus 语音消息格式

    如需将 xAI 用作默认 TTS 提供商：

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
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点。xAI 也提供基于 WebSocket 的流式 TTS，
    但 OpenClaw 的语音提供商契约当前要求在回复投递前先拿到完整音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="语音转文本">
    内置的 `xai` 插件通过 OpenClaw 的
    媒体理解转写接口注册批量语音转文本能力。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转写使用
      `tools.media.audio`，就支持该能力，包括 Discord 语音频道片段以及
      渠道音频附件

    如需强制使用 xAI 进行入站音频转写：

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

    可以通过共享音频媒体配置或按次调用的转写请求提供语言。提示词线索可由共享的 OpenClaw 接口接受，但 xAI REST STT 集成目前只会转发 file、model 和 language，因为这些字段能与当前公开的 xAI 端点清晰对应。

  </Accordion>

  <Accordion title="流式语音转文本">
    内置的 `xai` 插件还为实时 voice-call 音频注册了一个实时转写提供商。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测：`800ms`
    - 默认启用中间转写结果

    Voice Call 的 Twilio 媒体流发送 G.711 µ-law 音频帧，因此
    xAI 提供商可以直接转发这些帧，而无需转码：

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
    `plugins.entries.voice-call.config.streaming.providers.xai` 下。支持的
    键包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    该流式提供商用于 Voice Call 的实时转写路径。
    Discord 语音当前会录制短片段，并改用批量
    `tools.media.audio` 转写路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置的 xAI 插件将 `x_search` 作为 OpenClaw 工具暴露，用于通过 Grok 搜索
    X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键 | 类型 | 默认值 | 说明 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled` | boolean | — | 启用或禁用 x_search |
    | `model` | string | `grok-4-1-fast` | 用于 x_search 请求的模型 |
    | `inlineCitations` | boolean | — | 在结果中包含内联引用 |
    | `maxTurns` | number | — | 最大对话轮数 |
    | `timeoutSeconds` | number | — | 请求超时时间（秒） |
    | `cacheTtlMinutes` | number | — | 缓存存活时间（分钟） |

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
    内置的 xAI 插件将 `code_execution` 作为 OpenClaw 工具暴露，用于在 xAI 的沙箱环境中执行远程代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键 | 类型 | 默认值 | 说明 |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled` | boolean | `true`（如果 key 可用） | 启用或禁用代码执行 |
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
    - 当前凭证仅支持 API key。OpenClaw 尚未支持 xAI OAuth 或设备码流程。
    - `grok-4.20-multi-agent-experimental-beta-0304` 在普通 xAI 提供商路径中不受支持，因为它需要不同于标准 OpenClaw xAI 传输的上游 API 接口。
    - xAI Realtime voice 尚未注册为 OpenClaw 提供商。它需要与批量 STT 或流式转写不同的双向语音会话契约。
    - 在共享 `image_generate` 工具具备相应跨提供商控制项之前，xAI 图像的 `quality`、图像 `mask` 以及额外的仅限原生宽高比不会暴露。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享 runner 路径上自动应用 xAI 特定的工具 schema 和工具调用兼容性修复。
    - 原生 xAI 请求默认使用 `tool_stream: true`。如需禁用，请设置
      `agents.defaults.models["xai/<model>"].params.tool_stream` 为 `false`。
    - 内置 xAI 包装器会在发送原生 xAI 请求前，剥离不受支持的严格工具 schema 标志和推理负载键。
    - `web_search`、`x_search` 和 `code_execution` 会作为 OpenClaw 工具暴露。OpenClaw 会在每个工具请求中启用其所需的特定 xAI 内置功能，而不是在每次聊天轮次中附加所有原生工具。
    - `x_search` 和 `code_execution` 由内置 xAI 插件负责，而不是硬编码在核心模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，不是本地
      [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径已由单元测试和选择启用的实时测试套件覆盖。实时命令在探测 `XAI_API_KEY` 之前，会先从你的登录 shell（包括 `~/.profile`）加载密钥。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

提供商专用的实时测试文件会合成普通 TTS、适合电话的 PCM
TTS，通过 xAI 批量 STT 转写音频，将同样的 PCM 通过 xAI 实时 STT 进行流式传输，生成文生图输出，并编辑参考图像。共享图像实时测试文件则通过 OpenClaw 的运行时选择、故障转移、规范化和媒体附件路径，对同一个 xAI 提供商进行验证。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
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
