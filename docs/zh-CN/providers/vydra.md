---
read_when:
    - 你想在 OpenClaw 中使用 Vydra 媒体生成功能 to=functions.read 】【。】【”】【commentary  手机天天彩票=json? no. translate only.
    - 你需要 Vydra API 密钥设置指南
summary: 在 OpenClaw 中使用 Vydra 的图片、视频和语音功能
title: Vydra
x-i18n:
    generated_at: "2026-04-23T21:02:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d08480a223ebd5edcdb8dbea92ee0039f0f21535ab3fcd279133da16a5a0489
    source_path: providers/vydra.md
    workflow: 15
---

内置的 Vydra 插件增加了以下能力：

- 通过 `vydra/grok-imagine` 实现图片生成
- 通过 `vydra/veo3` 和 `vydra/kling` 实现视频生成
- 通过 Vydra 基于 ElevenLabs 的 TTS 路由实现语音合成

OpenClaw 对这三种能力都使用同一个 `VYDRA_API_KEY`。

<Warning>
请使用 `https://www.vydra.ai/api/v1` 作为 base URL。

Vydra 的 apex 主机（`https://vydra.ai/api/v1`）当前会重定向到 `www`。某些 HTTP 客户端会在这种跨主机重定向中丢弃 `Authorization`，从而使有效的 API 密钥看起来像误导性的身份验证失败。内置插件直接使用 `www` base URL，以避免这个问题。
</Warning>

## 设置

<Steps>
  <Step title="运行交互式新手引导">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    或直接设置环境变量：

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="选择默认能力">
    从下列能力中选择一个或多个（图片、视频或语音），并应用对应配置。
  </Step>
</Steps>

## 功能

<AccordionGroup>
  <Accordion title="图片生成">
    默认图片模型：

    - `vydra/grok-imagine`

    将其设为默认图片提供商：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    当前内置支持仅限文本生成图片。Vydra 托管的编辑路由要求远程图片 URL，而 OpenClaw 当前尚未在内置插件中添加 Vydra 专属上传桥接。

    <Note>
    共享工具参数、提供商选择和故障切换行为请参见 [图片生成](/zh-CN/tools/image-generation)。
    </Note>

  </Accordion>

  <Accordion title="视频生成">
    已注册的视频模型：

    - `vydra/veo3` 用于文本生成视频
    - `vydra/kling` 用于图片生成视频

    将 Vydra 设为默认视频提供商：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    说明：

    - `vydra/veo3` 在内置配置中仅支持文本生成视频。
    - `vydra/kling` 当前要求远程图片 URL 引用。会直接拒绝本地文件上传。
    - Vydra 当前的 `kling` HTTP 路由在要求 `image_url` 还是 `video_url` 方面一直不太稳定；内置提供商会将同一个远程图片 URL 同时映射到这两个字段。
    - 内置插件保持保守，不会转发诸如长宽比、分辨率、水印或生成音频等未文档化的样式参数。

    <Note>
    共享工具参数、提供商选择和故障切换行为请参见 [视频生成](/zh-CN/tools/video-generation)。
    </Note>

  </Accordion>

  <Accordion title="视频 live 测试">
    提供商专属 live 覆盖：

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    当前内置的 Vydra live 文件覆盖：

    - `vydra/veo3` 文本生成视频
    - `vydra/kling` 使用远程图片 URL 的图片生成视频

    如有需要，可覆盖远程图片夹具：

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="语音合成">
    将 Vydra 设为语音提供商：

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    默认值：

    - 模型：`elevenlabs/tts`
    - Voice id：`21m00Tcm4TlvDq8ikWAM`

    当前内置插件仅公开一个已知可用的默认语音，并返回 MP3 音频文件。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="提供商目录" href="/zh-CN/providers/index" icon="list">
    浏览所有可用提供商。
  </Card>
  <Card title="图片生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图片工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference#agent-defaults" icon="gear">
    智能体默认值和模型配置。
  </Card>
</CardGroup>
