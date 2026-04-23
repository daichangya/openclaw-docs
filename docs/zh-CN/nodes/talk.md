---
read_when:
    - 在 macOS/iOS/Android 上实现通话模式
    - 更改语音/TTS/打断行为
summary: 通话模式：使用 ElevenLabs TTS 的连续语音对话
title: 通话模式
x-i18n:
    generated_at: "2026-04-23T22:59:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

通话模式是一个连续语音对话循环：

1. 监听语音
2. 将转写结果发送给模型（主会话，`chat.send`）
3. 等待回复
4. 通过已配置的 Talk 提供商朗读回复（`talk.speak`）

## 行为（macOS）

- 启用通话模式时，显示**常驻悬浮层**。
- **Listening → Thinking → Speaking** 阶段切换。
- 在**短暂停顿**（静音窗口）时，会发送当前转写内容。
- 回复会**写入 WebChat**（与键入时相同）。
- **语音打断**（默认开启）：如果助手正在说话时用户开始说话，我们会停止播放，并为下一次提示记录打断时间戳。

## 回复中的语音指令

助手可以在回复开头添加**单行 JSON** 来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅首个非空行有效。
- 未知键会被忽略。
- `once: true` 仅应用于当前这条回复。
- 如果没有 `once`，该语音会成为通话模式的新默认语音。
- 在 TTS 播放前，这一行 JSON 会被移除。

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
- `silenceTimeoutMs`：未设置时，通话模式会在发送转写前使用平台默认暂停窗口（macOS 和 Android 为 `700 ms`，iOS 为 `900 ms`）
- `voiceId`：回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或者在 API 密钥可用时使用第一个 ElevenLabs 语音）
- `modelId`：未设置时默认使用 `eleven_v3`
- `apiKey`：回退到 `ELEVENLABS_API_KEY`（或者在可用时使用 Gateway 网关 shell profile）
- `outputFormat`：macOS/iOS 默认 `pcm_44100`，Android 默认 `pcm_24000`（设置 `mp3_*` 可强制使用 MP3 流式传输）

## macOS UI

- 菜单栏切换项：**Talk**
- 配置标签页：**Talk Mode** 分组（voice id + 打断开关）
- 悬浮层：
  - **Listening**：云朵随麦克风电平脉动
  - **Thinking**：下沉动画
  - **Speaking**：向外扩散的圆环
  - 点击云朵：停止朗读
  - 点击 X：退出通话模式

## 说明

- 需要 Speech 和 Microphone 权限。
- 对会话键 `main` 使用 `chat.send`。
- Gateway 网关会通过活动的 Talk 提供商使用 `talk.speak` 解析通话播放。仅当该 RPC 不可用时，Android 才会回退到本地系统 TTS。
- `eleven_v3` 的 `stability` 仅验证为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 设置 `latency_tier` 时，仅验证 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，以支持低延迟 `AudioTrack` 流式传输。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [音频和语音便笺](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
