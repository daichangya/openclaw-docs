---
read_when:
    - 你想在 OpenClaw 中使用 Google Gemini 模型
    - 你需要 API 密钥或 OAuth 认证流程
summary: Google Gemini 设置（API 密钥 + OAuth、图像生成、媒体理解、TTS、网页搜索）
title: Google（Gemini）
x-i18n:
    generated_at: "2026-04-18T18:25:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google（Gemini）

Google 插件通过 Google AI Studio 提供对 Gemini 模型的访问，还提供通过 Gemini Grounding 实现的图像生成、媒体理解（图像/音频/视频）、文本转语音以及网页搜索。

- 提供商：`google`
- 认证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 备用提供商：`google-gemini-cli`（OAuth）

## 入门指南

选择你偏好的认证方式，并按照设置步骤操作。

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
    环境变量 `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 都支持。使用你已经配置好的那个即可。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI（OAuth）">
    **最适合：** 复用现有的 Gemini CLI 登录，通过 PKCE OAuth，而不是单独使用 API 密钥。

    <Warning>
    `google-gemini-cli` 提供商是非官方集成。一些用户报告称，以这种方式使用 OAuth 时会遇到账户限制。请自行承担风险。
    </Warning>

    <Steps>
      <Step title="安装 Gemini CLI">
        本地 `gemini` 命令必须可在 `PATH` 中使用。

        ```bash
        # Homebrew
        brew install gemini-cli

        # 或 npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw 同时支持 Homebrew 安装和全局 npm 安装，包括常见的 Windows/npm 布局。
      </Step>
      <Step title="通过 OAuth 登录">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - 默认模型：`google-gemini-cli/gemini-3-flash-preview`
    - 别名：`gemini-cli`

    **环境变量：**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （或使用 `GEMINI_CLI_*` 变体。）

    <Note>
    如果 Gemini CLI OAuth 请求在登录后失败，请在 Gateway 网关主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`，然后重试。
    </Note>

    <Note>
    如果在浏览器流程开始前登录就失败，请确认本地 `gemini` 命令已安装并且位于 `PATH` 中。
    </Note>

    仅支持 OAuth 的 `google-gemini-cli` 提供商是一个独立的文本推理接口。图像生成、媒体理解和 Gemini Grounding 仍然使用 `google` 提供商 id。

  </Tab>
</Tabs>

## 功能

| 功能                     | 支持情况                        |
| ------------------------ | ------------------------------- |
| 聊天补全                 | 是                              |
| 图像生成                 | 是                              |
| 音乐生成                 | 是                              |
| 文本转语音               | 是                              |
| 图像理解                 | 是                              |
| 音频转录                 | 是                              |
| 视频理解                 | 是                              |
| 网页搜索（Grounding）    | 是                              |
| Thinking / 推理          | 是（Gemini 2.5+ / Gemini 3+）   |
| Gemma 4 模型             | 是                              |

<Tip>
Gemini 3 模型使用 `thinkingLevel` 而不是 `thinkingBudget`。OpenClaw 会将 Gemini 3、Gemini 3.1 和 `gemini-*-latest` 别名的推理控制映射到 `thinkingLevel`，这样默认/低延迟运行就不会发送被禁用的 `thinkingBudget` 值。

Gemma 4 模型（例如 `gemma-4-26b-a4b-it`）支持 thinking 模式。OpenClaw 会将 `thinkingBudget` 重写为 Gemma 4 支持的 Google `thinkingLevel`。将 thinking 设置为 `off` 时，会保持禁用状态，而不是映射为 `MINIMAL`。
</Tip>

## 图像生成

内置的 `google` 图像生成提供商默认使用
`google/gemini-3.1-flash-image-preview`。

- 还支持 `google/gemini-3-pro-image-preview`
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
有关共享工具参数、提供商选择和故障切换行为，请参阅 [图像生成](/zh-CN/tools/image-generation)。
</Note>

## 视频生成

内置的 `google` 插件也通过共享的
`video_generate` 工具注册视频生成能力。

- 默认视频模型：`google/veo-3.1-fast-generate-preview`
- 模式：文本生成视频、图像生成视频，以及单视频参考流程
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
有关共享工具参数、提供商选择和故障切换行为，请参阅 [视频生成](/zh-CN/tools/video-generation)。
</Note>

## 音乐生成

内置的 `google` 插件也通过共享的
`music_generate` 工具注册音乐生成能力。

- 默认音乐模型：`google/lyria-3-clip-preview`
- 还支持 `google/lyria-3-pro-preview`
- 提示词控制：`lyrics` 和 `instrumental`
- 输出格式：默认 `mp3`，另外在 `google/lyria-3-pro-preview` 上支持 `wav`
- 参考输入：最多 10 张图像
- 基于会话的运行会通过共享的任务/状态流程分离处理，包括 `action: "status"`

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
有关共享工具参数、提供商选择和故障切换行为，请参阅 [音乐生成](/zh-CN/tools/music-generation)。
</Note>

## 文本转语音

内置的 `google` 语音提供商使用 Gemini API 的 TTS 路径，并采用
`gemini-3.1-flash-tts-preview`。

- 默认语音：`Kore`
- 认证：`messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- 输出：常规 TTS 附件为 WAV，Talk / 电话场景为 PCM
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
        },
      },
    },
  },
}
```

Gemini API TTS 支持在文本中使用带方括号的表现性音频标签，例如
`[whispers]` 或 `[laughs]`。为了让这些标签不出现在可见的聊天回复中，同时仍发送给 TTS，请将它们放在 `[[tts:text]]...[[/tts:text]]` 块内：

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
限制为 Gemini API 的 Google Cloud Console API 密钥可用于此提供商。这不是单独的 Cloud Text-to-Speech API 路径。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="直接复用 Gemini 缓存">
    对于直接 Gemini API 运行（`api: "google-generative-ai"`），OpenClaw 会将已配置的 `cachedContent` 句柄传递给 Gemini 请求。

    - 可使用 `cachedContent` 或旧版 `cached_content` 为每个模型或全局参数进行配置
    - 如果两者同时存在，以 `cachedContent` 为准
    - 示例值：`cachedContents/prebuilt-context`
    - Gemini 的缓存命中用量会从上游 `cachedContentTokenCount` 规范化为 OpenClaw `cacheRead`

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
    使用 `google-gemini-cli` OAuth 提供商时，OpenClaw 会按如下方式规范化 CLI JSON 输出：

    - 回复文本来自 CLI JSON 的 `response` 字段。
    - 当 CLI 将 `usage` 留空时，使用量会回退到 `stats`。
    - `stats.cached` 会被规范化为 OpenClaw `cacheRead`。
    - 如果缺少 `stats.input`，OpenClaw 会通过 `stats.input_tokens - stats.cached` 推导输入 token 数。

  </Accordion>

  <Accordion title="环境和守护进程设置">
    如果 Gateway 网关以守护进程（launchd/systemd）方式运行，请确保 `GEMINI_API_KEY` 对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。
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
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    共享音乐工具参数和提供商选择。
  </Card>
</CardGroup>
