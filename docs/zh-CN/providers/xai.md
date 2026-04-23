---
read_when:
    - 你希望在 OpenClaw 中使用 Grok 模型
    - 你正在配置 xAI 认证或模型 id
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
    generated_at: "2026-04-23T21:02:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7149e017b7a5dd95b08c3f3348c5cbbe057b59a5f6bd6cc1f36473d4e47bf87
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw 内置了一个用于 Grok 模型的 `xai` provider 插件。

## 快速开始

<Steps>
  <Step title="创建 API key">
    在 [xAI console](https://console.x.ai/) 中创建一个 API key。
  </Step>
  <Step title="设置你的 API key">
    设置 `XAI_API_KEY`，或运行：

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="选择一个模型">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw 使用 xAI Responses API 作为内置 xAI 传输。同一个
`XAI_API_KEY` 也可以为基于 Grok 的 `web_search`、一级 `x_search`
以及远程 `code_execution` 提供支持。
如果你将 xAI key 存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，
内置 xAI 模型 provider 也会回退复用该 key。
`code_execution` 的调优位于 `plugins.entries.xai.config.codeExecution` 下。
</Note>

## 内置模型目录

OpenClaw 默认内置以下 xAI 模型家族：

| 家族 | 模型 id |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3 | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast` |
| Grok 4 | `grok-4`, `grok-4-0709` |
| Grok 4 Fast | `grok-4-fast`, `grok-4-fast-non-reasoning` |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning` |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code | `grok-code-fast-1` |

当新的 `grok-4*` 和 `grok-code-fast*` id 遵循相同 API 形状时，
该插件也会前向解析它们。

<Tip>
`grok-4-fast`、`grok-4-1-fast` 以及 `grok-4.20-beta-*` 变体是
当前内置目录中具备图像能力的 Grok 引用。
</Tip>

## OpenClaw 功能覆盖范围

内置插件会在行为可自然匹配的前提下，将 xAI 当前公开 API 表面映射到 OpenClaw 的共享
provider 和工具契约上。

| xAI 能力 | OpenClaw 表面 | 状态 |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses | `xai/<model>` 模型 provider | 是 |
| 服务端 web 搜索 | `web_search` provider `grok` | 是 |
| 服务端 X 搜索 | `x_search` 工具 | 是 |
| 服务端 code execution | `code_execution` 工具 | 是 |
| 图像 | `image_generate` | 是 |
| 视频 | `video_generate` | 是 |
| 批量 text-to-speech | `messages.tts.provider: "xai"` / `tts` | 是 |
| 流式 TTS | — | 未暴露；OpenClaw 的 TTS 契约返回完整音频缓冲区 |
| 批量 speech-to-text | `tools.media.audio` / 媒体理解 | 是 |
| 流式 speech-to-text | Voice Call `streaming.provider: "xai"` | 是 |
| 实时语音 | — | 尚未暴露；会话/WebSocket 契约不同 |
| 文件 / 批处理 | 仅通用模型 API 兼容 | 不是一级 OpenClaw 工具 |

<Note>
OpenClaw 对媒体生成、语音和批量转录使用 xAI 的 REST 图像/视频/TTS/STT API，
对实时 Voice Call 转录使用 xAI 的流式 STT WebSocket，
并对模型、搜索和 code-execution 工具使用 Responses API。像
Realtime 语音会话这类需要不同 OpenClaw 契约的功能，会在这里作为上游能力进行记录，
而不是隐藏为插件行为。
</Note>

### Fast 模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
会按如下方式重写原生 xAI 请求：

| 源模型 | Fast 模式目标 |
| ------------- | ------------------ |
| `grok-3` | `grok-3-fast` |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4` | `grok-4-fast` |
| `grok-4-0709` | `grok-4-fast` |

### 旧版兼容别名

旧版别名仍会标准化到规范内置 id：

| 旧版别名 | 规范 id |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning` | `grok-4-fast` |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast` |
| `grok-4.20-reasoning` | `grok-4.20-beta-latest-reasoning` |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置的 `grok` web 搜索 provider 同样使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置 `xai` 插件通过共享
    `video_generate` 工具注册视频生成功能。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：text-to-video、image-to-video、远程视频编辑以及远程视频
      延长
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：生成/image-to-video 为 1-15 秒，extension 为
      2-10 秒

    <Warning>
    不接受本地视频缓冲区。对于
    视频编辑/延长输入，请使用远程 `http(s)` URL。Image-to-video 可以接受本地图像缓冲区，因为
    OpenClaw 可以将它们编码为 xAI 可用的数据 URL。
    </Warning>

    如需将 xAI 设为默认视频 provider：

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
    共享工具参数、provider 选择和故障转移行为请参见 [视频生成](/zh-CN/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置 `xai` 插件通过共享
    `image_generate` 工具注册图像生成功能。

    - 默认图像模型：`xai/grok-imagine-image`
    - 额外模型：`xai/grok-imagine-image-pro`
    - 模式：text-to-image 和参考图像编辑
    - 参考输入：一张 `image` 或最多五张 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像

    OpenClaw 会向 xAI 请求 `b64_json` 图像响应，以便将生成媒体
    通过正常的渠道附件路径进行存储和投递。本地
    参考图像会被转换为数据 URL；远程 `http(s)` 引用则会直接透传。

    如需将 xAI 设为默认图像 provider：

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
    xAI 还文档化了 `quality`、`mask`、`user`，以及更多原生宽高比，
    例如 `1:2`、`2:1`、`9:20` 和 `20:9`。目前 OpenClaw 只透传
    跨 provider 共享的图像控制项；不受支持的原生专属调节项
    会被有意排除在 `image_generate` 之外。
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    内置 `xai` 插件通过共享 `tts`
    provider 表面注册 text-to-speech 功能。

    - 音色：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 默认音色：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 速度：provider 原生速度覆盖
    - 不支持原生 Opus 语音便笺格式

    如需将 xAI 设为默认 TTS provider：

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
    但 OpenClaw 的语音 provider 契约目前要求在回复投递前
    获得完整音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    内置 `xai` 插件通过 OpenClaw 的
    媒体理解转录表面注册批量 speech-to-text。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - 在 OpenClaw 中，只要入站音频转录使用
      `tools.media.audio`，就可以使用它，包括 Discord 语音频道片段和
      渠道音频附件

    如需强制对入站音频转录使用 xAI：

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

    语言可以通过共享音频媒体配置提供，也可以通过每次调用的
    转录请求提供。提示词提示通过共享 OpenClaw
    表面可被接受，但 xAI REST STT 集成目前只透传 file、model 和
    language，因为这些字段能与当前公开的 xAI 端点自然映射。

  </Accordion>

  <Accordion title="流式 speech-to-text">
    内置 `xai` 插件还为实时语音通话音频注册了一个实时转录 provider。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认 endpointing：`800ms`
    - interim transcripts：默认启用

    Voice Call 的 Twilio 媒体流发送的是 G.711 µ-law 音频帧，因此
    xAI provider 可以直接转发这些帧，而无需转码：

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

    provider 自有配置位于
    `plugins.entries.voice-call.config.streaming.providers.xai` 下。支持的
    键包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或
    `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    这个流式 provider 用于 Voice Call 的实时转录路径。
    Discord 语音当前仍会录制短片段，并改为使用批量
    `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置 xAI 插件将 `x_search` 暴露为 OpenClaw 工具，用于通过 Grok 搜索
    X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键 | 类型 | 默认值 | 描述 |
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

  <Accordion title="Code execution 配置">
    内置 xAI 插件将 `code_execution` 暴露为 OpenClaw 工具，用于在 xAI 的沙箱环境中执行远程代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键 | 类型 | 默认值 | 描述 |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled` | boolean | `true`（若 key 可用） | 启用或禁用 code execution |
    | `model` | string | `grok-4-1-fast` | 用于 code execution 请求的模型 |
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
    - 当前认证仅支持 API key。OpenClaw 尚不支持 xAI OAuth 或 device-code 流程。
    - `grok-4.20-multi-agent-experimental-beta-0304` 不支持走普通 xAI provider 路径，
      因为它需要与标准 OpenClaw xAI 传输不同的上游 API 表面。
    - xAI Realtime 语音尚未注册为 OpenClaw provider。它
      需要与批量 STT 或流式转录不同的双向语音会话契约。
    - xAI 图像 `quality`、图像 `mask` 以及额外的原生专属宽高比，
      目前都不会暴露，除非共享 `image_generate` 工具
      拥有对应的跨 provider 控制项。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享运行器路径上自动应用 xAI 特定的工具 schema 和工具调用兼容修复。
    - 原生 xAI 请求默认启用 `tool_stream: true`。将
      `agents.defaults.models["xai/<model>"].params.tool_stream` 设置为 `false` 可禁用它。
    - 内置 xAI 包装器会在发送原生 xAI 请求前，剥离不受支持的严格工具 schema 标志和
      reasoning 负载键。
    - `web_search`、`x_search` 和 `code_execution` 被暴露为 OpenClaw
      工具。OpenClaw 会在每个工具请求内部启用所需的特定 xAI 内置能力，
      而不是在每个聊天轮次中附带所有原生工具。
    - `x_search` 和 `code_execution` 由内置 xAI 插件拥有，
      而不是硬编码在核心模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，不是本地
      [`exec`](/zh-CN/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径由单元测试和选择启用的实时测试套件覆盖。实时
命令会在探测 `XAI_API_KEY` 之前，从你的登录 shell 中加载 secrets，
包括 `~/.profile`。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

provider 专属的实时测试文件会合成普通 TTS、适合电话的 PCM
TTS，通过 xAI 批量 STT 转录音频，再通过 xAI
实时 STT 流式传输相同的 PCM，生成 text-to-image 输出，并编辑一张参考图像。共享图像实时测试文件则会通过 OpenClaw 的
运行时选择、故障转移、标准化和媒体附件路径验证同一个 xAI provider。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 providers、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数与 provider 选择。
  </Card>
  <Card title="所有 providers" href="/zh-CN/providers/index" icon="grid-2">
    更广泛的 provider 概览。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题与修复方法。
  </Card>
</CardGroup>
