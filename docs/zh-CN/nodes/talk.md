---
read_when:
    - 在 macOS / iOS / Android 上实现 Talk 模式
    - 更改语音 / TTS / 打断行为
summary: Talk 模式：使用 ElevenLabs TTS 的连续语音对话
title: Talk 模式
x-i18n:
    generated_at: "2026-04-23T20:54:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fdd0f51f388fb2aec2773a201234fcedddb91a09ee7417d87bd91c113b660d8
    source_path: nodes/talk.md
    workflow: 15
---

Talk 模式是一种连续语音对话循环：

1. 监听语音
2. 将转录内容发送给模型（主会话，`chat.send`）
3. 等待响应
4. 通过已配置的 Talk 提供商（`talk.speak`）将其读出来

## 行为（macOS）

- 启用 Talk 模式时，显示**始终在线的悬浮层**。
- 在**Listening → Thinking → Speaking** 各阶段之间切换。
- 当出现**短暂停顿**（静音窗口）时，发送当前转录内容。
- 回复会**写入 WebChat**（与打字输入相同）。
- **语音打断**（默认开启）：如果用户在助手说话时开始讲话，我们会停止播放，并为下一次提示词记录打断时间戳。

## 回复中的语音指令

助手可以在回复前加上一行**单独的 JSON 行**来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅第一行非空行有效。
- 未知键会被忽略。
- `once: true` 仅对当前回复生效。
- 如果没有 `once`，该语音会成为 Talk 模式的新默认语音。
- 该 JSON 行会在 TTS 播放前被移除。

支持的键：

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`、`rate`（WPM）、`stability`、`similarity`、`style`、`speakerBoost`
- `seed`、`normalize`、`lang`、`output_format`、`latency_tier`
- `once`

## 配置（`~/.openclaw/openclaw.json`）

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

默认值：

- `interruptOnSpeech`：true
- `silenceTimeoutMs`：未设置时，Talk 会在发送转录内容前使用平台默认暂停窗口（`macOS` 和 `Android` 为 `700 ms`，`iOS` 为 `900 ms`）
- `voiceId`：回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或者在 API key 可用时使用第一个 ElevenLabs voice）
- `modelId`：未设置时默认使用 `eleven_v3`
- `apiKey`：回退到 `ELEVENLABS_API_KEY`（或在可用时使用 Gateway 网关 shell profile）
- `outputFormat`：在 macOS / iOS 上默认使用 `pcm_44100`，在 Android 上默认使用 `pcm_24000`（设置 `mp3_*` 可强制使用 MP3 流式传输）

## macOS UI

- 菜单栏开关：**Talk**
- 配置标签页：**Talk Mode** 分组（voice id + 打断开关）
- 悬浮层：
  - **Listening**：云朵随麦克风音量脉动
  - **Thinking**：下沉动画
  - **Speaking**：向外扩散的光环
  - 点击云朵：停止说话
  - 点击 X：退出 Talk 模式

## 说明

- 需要 Speech 和 Microphone 权限。
- 使用 `chat.send`，针对会话键 `main`。
- Gateway 网关会通过活动 Talk 提供商使用 `talk.speak` 解析 Talk 播放。Android 仅在该 RPC 不可用时回退到本地系统 TTS。
- `eleven_v3` 的 `stability` 会被校验为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 设置 `latency_tier` 时，会将其校验为 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，以便进行低延迟 AudioTrack 流式传输。
