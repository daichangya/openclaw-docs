---
read_when:
    - 你希望使用 Gradium 进行文本转语音
    - 你需要 Gradium API 密钥或语音配置
summary: 在 OpenClaw 中使用 Gradium 文本转语音
title: Gradium
x-i18n:
    generated_at: "2026-04-24T18:10:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium 是 OpenClaw 内置的文本转语音提供商。它可以生成普通音频回复、兼容语音便签的 Opus 输出，以及用于电话类界面的 8 kHz u-law 音频。

## 设置

创建一个 Gradium API 密钥，然后将其提供给 OpenClaw：

```bash
export GRADIUM_API_KEY="gsk_..."
```

你也可以将该密钥存储在配置中的 `messages.tts.providers.gradium.apiKey` 下。

## 配置

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## 语音

| 名称      | 语音 ID            |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

默认语音：Emma。

## 输出

- 音频文件回复使用 WAV。
- 语音便签回复使用 Opus，并标记为语音兼容。
- 电话语音合成使用 8 kHz 的 `ulaw_8000`。

## 相关内容

- [文本转语音](/zh-CN/tools/tts)
- [媒体概览](/zh-CN/tools/media-overview)
