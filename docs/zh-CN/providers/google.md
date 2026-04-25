---
read_when:
    - 你想在 OpenClaw 中使用 Google Gemini 模型
    - 你需要 API 密钥或 OAuth 认证流程
summary: Google Gemini 设置（API 密钥 + OAuth、图像生成、媒体理解、TTS、网页搜索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-25T05:16:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Google 插件通过 Google AI Studio 提供对 Gemini 模型的访问，另外还支持通过 Gemini Grounding 实现图像生成、媒体理解（图像/音频/视频）、文本转语音和网页搜索。

- 提供商：`google`
- 认证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 运行时选项：`agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  会复用 Gemini CLI OAuth，同时保持模型引用规范为 `google/*`。

## 入门指南

选择你偏好的认证方式，并按照设置步骤进行操作。

<Tabs>
  <Tab title="API 密钥">
    **最适合：** 通过 Google AI Studio 进行标准的 Gemini API 访问。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        或直接传入密钥：

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    环境变量 `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 都可以使用。使用你已经配置好的那个即可。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI（OAuth）">
    **最适合：** 复用现有的 Gemini CLI 登录，通过 PKCE OAuth 而不是单独的 API 密钥进行认证。

    <Warning>
    `google-gemini-cli` 提供商是一个非官方集成。有些用户报告称，以这种方式使用 OAuth 时会遇到账户限制。请自行承担风险。
    </Warning>

    <Steps>
      <Step title="安装 Gemini CLI">
        本地 `gemini` 命令必须可在 `PATH` 中使用。

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw 同时支持通过 Homebrew 安装和全局 npm 安装，包括常见的 Windows/npm 布局。
      </Step>
      <Step title="通过 OAuth 登录">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - 默认模型：`google/gemini-3.1-pro-preview`
    - 运行时：`google-gemini-cli`
    - 别名：`gemini-cli`

    **环境变量：**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （或使用 `GEMINI_CLI_*` 变体。）

    <Note>
    如果 Gemini CLI OAuth 在登录后请求失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`，然后重试。
    </Note>

    <Note>
    如果在浏览器流程开始前登录就失败，请确认本地 `gemini` 命令已安装并且位于 `PATH` 中。
    </Note>

    `google-gemini-cli/*` 模型引用是旧版兼容别名。新的配置应使用 `google/*` 模型引用，并在需要本地 Gemini CLI 执行时搭配 `google-gemini-cli` 运行时。

  </Tab>
</Tabs>

## 功能

| 功能 | 支持情况 |
| ---------------------- | ----------------------------- |
| 聊天补全 | 是 |
| 图像生成 | 是 |
| 音乐生成 | 是 |
| 文本转语音 | 是 |
| 实时语音 | 是（Google Live API） |
| 图像理解 | 是 |
| 音频转写 | 是 |
| 视频理解 | 是 |
| 网页搜索（Grounding） | 是 |
| 思考/推理 | 是（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 模型 | 是 |

<Tip>
Gemini 3 模型使用 `thinkingLevel` 而不是 `thinkingBudget`。OpenClaw 会将 Gemini 3、Gemini 3.1 和 `gemini-*-latest` 别名的推理控制映射到 `thinkingLevel`，这样默认/低延迟运行就不会发送已禁用的 `thinkingBudget` 值。

`/think adaptive` 会保留 Google 的动态思考语义，而不是选择一个固定的 OpenClaw 级别。Gemini 3 和 Gemini 3.1 不会发送固定的 `thinkingLevel`，以便让 Google 自行选择级别；Gemini 2.5 会发送 Google 的动态哨兵值 `thinkingBudget: -1`。

Gemma 4 模型（例如 `gemma-4-26b-a4b-it`）支持思考模式。OpenClaw 会将 `thinkingBudget` 重写为 Gemma 4 支持的 Google `thinkingLevel`。将思考设置为 `off` 时，会保持思考禁用状态，而不会映射为 `MINIMAL`。
</Tip>

## 图像生成

内置的 `google` 图像生成提供商默认使用
`google/gemini-3.1-flash-image-preview`。

- 也支持 `google/gemini-3-pro-image-preview`
- 生成：每次请求最多 4 张图像
- 编辑模式：已启用，最多支持 5 张输入图像
- 几何控制：`size`、`aspectRatio` 和 `resolution`

要将 Google 用作默认图像提供商：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
有关共享工具参数、提供商选择和故障转移行为，请参阅 [Image Generation](/zh-CN/tools/image-generation)。
</Note>

## 视频生成

内置的 `google` 插件还会通过共享的
`video_generate` 工具注册视频生成能力。

- 默认视频模型：`google/veo-3.1-fast-generate-preview`
- 模式：文生视频、图生视频，以及单视频参考流程
- 支持 `aspectRatio`、`resolution` 和 `audio`
- 当前时长限制：**4 到 8 秒**

要将 Google 用作默认视频提供商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
有关共享工具参数、提供商选择和故障转移行为，请参阅 [Video Generation](/zh-CN/tools/video-generation)。
</Note>

## 音乐生成

内置的 `google` 插件还会通过共享的
`music_generate` 工具注册音乐生成能力。

- 默认音乐模型：`google/lyria-3-clip-preview`
- 也支持 `google/lyria-3-pro-preview`
- 提示词控制：`lyrics` 和 `instrumental`
- 输出格式：默认 `mp3`，另外在 `google/lyria-3-pro-preview` 上支持 `wav`
- 参考输入：最多 10 张图像
- 基于会话的运行会通过共享的任务/状态流程分离执行，包括 `action: "status"`

要将 Google 用作默认音乐提供商：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
有关共享工具参数、提供商选择和故障转移行为，请参阅 [Music Generation](/zh-CN/tools/music-generation)。
</Note>

## 文本转语音

内置的 `google` 语音提供商使用 Gemini API TTS 路径，并采用
`gemini-3.1-flash-tts-preview`。

- 默认语音：`Kore`
- 认证：`messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- 输出：常规 TTS 附件使用 WAV，Talk/电话场景使用 PCM
- 原生语音便笺输出：此 Gemini API 路径不支持，因为 API 返回的是 PCM 而不是 Opus

要将 Google 用作默认 TTS 提供商：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS 使用自然语言提示来控制风格。设置
`audioProfile` 可在朗读文本前添加一个可复用的风格提示。若你的提示文本提到了具名说话人，请设置
`speakerName`。

Gemini API TTS 还接受文本中的方括号音频标签，
例如 `[whispers]` 或 `[laughs]`。如果你想在发送给 TTS 的同时不让这些标签出现在可见聊天回复中，可将它们放在 `[[tts:text]]...[[/tts:text]]`
块内：

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
限制为 Gemini API 的 Google Cloud Console API 密钥可用于此提供商。这不是单独的 Cloud Text-to-Speech API 路径。
</Note>

## 实时语音

内置的 `google` 插件注册了一个由
Gemini Live API 支持的实时语音提供商，用于 Voice Call 和 Google Meet 等后端音频桥接。

| 设置 | 配置路径 | 默认值 |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 模型 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025` |
| 语音 | `...google.voice` | `Kore` |
| Temperature | `...google.temperature` | （未设置） |
| VAD 起始灵敏度 | `...google.startSensitivity` | （未设置） |
| VAD 结束灵敏度 | `...google.endSensitivity` | （未设置） |
| 静音时长 | `...google.silenceDurationMs` | （未设置） |
| API 密钥 | `...google.apiKey` | 回退到 `models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY` |

Voice Call 实时配置示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API 通过 WebSocket 使用双向音频和函数调用。OpenClaw 会将电话/Meet 桥接音频适配到 Gemini 的 PCM Live API 流，并在共享的实时语音契约上保留工具调用。除非你需要调整采样，否则请将 `temperature`
保持未设置；OpenClaw 会省略非正值，因为当 `temperature: 0` 时，Google Live 可能返回只有转录而没有音频的结果。
Gemini API 转写在不使用 `languageCodes` 的情况下启用；当前 Google
SDK 会在此 API 路径上拒绝语言代码提示。
</Note>

<Note>
Control UI Talk 浏览器会话仍然需要一个带有浏览器 WebRTC 会话实现的实时语音提供商。目前该路径是 OpenAI Realtime；Google 提供商用于后端实时桥接。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="直接复用 Gemini 缓存">
    对于直接 Gemini API 运行（`api: "google-generative-ai"`），OpenClaw
    会将已配置的 `cachedContent` 句柄透传给 Gemini 请求。

    - 使用以下任一方式按模型或全局配置参数：
      `cachedContent` 或旧版 `cached_content`
    - 如果两者同时存在，则 `cachedContent` 优先
    - 示例值：`cachedContents/prebuilt-context`
    - Gemini 缓存命中用量会从上游 `cachedContentTokenCount` 规范化到 OpenClaw `cacheRead`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI JSON 使用说明">
    使用 `google-gemini-cli` OAuth 提供商时，OpenClaw 会按如下方式规范化
    CLI JSON 输出：

    - 回复文本来自 CLI JSON 的 `response` 字段。
    - 当 CLI 将 `usage` 留空时，用量会回退到 `stats`。
    - `stats.cached` 会规范化为 OpenClaw `cacheRead`。
    - 如果缺少 `stats.input`，OpenClaw 会根据
      `stats.input_tokens - stats.cached` 推导输入 token 数。

  </Accordion>

  <Accordion title="环境与守护进程设置">
    如果 Gateway 网关以守护进程方式运行（launchd/systemd），请确保 `GEMINI_API_KEY`
    对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过
    `env.shellEnv` 提供）。
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
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    共享音乐工具参数和提供商选择。
  </Card>
</CardGroup>
