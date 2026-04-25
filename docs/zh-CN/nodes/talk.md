---
read_when:
    - 在 macOS/iOS/Android 上实现通话模式
    - 更改语音 / TTS / 打断行为
summary: 通话模式：与已配置的 TTS 提供商进行连续语音对话
title: 通话模式
x-i18n:
    generated_at: "2026-04-25T07:51:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

通话模式是一个连续的语音对话循环：

1. 监听语音
2. 将转录文本发送给模型（主会话，`chat.send`）
3. 等待响应
4. 通过已配置的通话提供商播报响应（`talk.speak`）

## 行为（macOS）

- 启用通话模式后，会显示**常驻覆盖层**。
- 在**监听 → 思考 → 播报**阶段之间切换。
- 当出现**短暂停顿**（静音窗口）时，会发送当前转录文本。
- 回复会被**写入 WebChat**（与手动输入相同）。
- **语音打断**（默认开启）：如果助手正在播报时用户开始说话，我们会停止播放，并为下一个提示记录打断时间戳。

## 回复中的语音指令

助手可以在回复前添加**单独的一行 JSON** 来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅第一行非空行有效。
- 未知键会被忽略。
- `once: true` 仅应用于当前这条回复。
- 如果没有 `once`，该语音会成为通话模式的新默认语音。
- 该 JSON 行会在 TTS 播放前被移除。

支持的键：

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate`（WPM）, `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 配置（`~/.openclaw/openclaw.json`）

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

默认值：

- `interruptOnSpeech`：true
- `silenceTimeoutMs`：未设置时，通话模式会在发送转录文本前使用平台默认的停顿窗口（`macOS` 和 Android 上为 `700 ms`，iOS 上为 `900 ms`）
- `provider`：选择当前启用的通话提供商。对于 macOS 本地播放路径，使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`：对于 ElevenLabs，会回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（如果提供了 API key，也可回退到第一个 ElevenLabs 语音）。
- `providers.elevenlabs.modelId`：未设置时默认为 `eleven_v3`。
- `providers.mlx.modelId`：未设置时默认为 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`：会回退到 `ELEVENLABS_API_KEY`（如果可用，也可回退到 Gateway 网关 shell 配置文件）。
- `outputFormat`：在 macOS/iOS 上默认为 `pcm_44100`，在 Android 上默认为 `pcm_24000`（设置为 `mp3_*` 可强制使用 MP3 流式传输）

## macOS UI

- 菜单栏开关：**通话**
- 配置标签页：**通话模式**分组（语音 id + 打断开关）
- 覆盖层：
  - **监听中**：云朵会随麦克风电平脉动
  - **思考中**：下沉动画
  - **播报中**：向外辐射的圆环
  - 点击云朵：停止播报
  - 点击 X：退出通话模式

## 说明

- 需要语音识别和麦克风权限。
- 使用针对会话键 `main` 的 `chat.send`。
- Gateway 网关通过当前启用的通话提供商，使用 `talk.speak` 来解析通话播放。Android 仅在该 RPC 不可用时回退到本地系统 TTS。
- macOS 本地 MLX 播放会在存在时使用内置的 `openclaw-mlx-tts` 辅助程序，或者使用 `PATH` 上的可执行文件。开发期间可设置 `OPENCLAW_MLX_TTS_BIN` 指向自定义辅助二进制文件。
- `eleven_v3` 的 `stability` 会校验为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 设置了 `latency_tier` 时，会校验为 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，以实现低延迟 `AudioTrack` 流式传输。

## 相关内容

- [语音唤醒](/zh-CN/nodes/voicewake)
- [音频和语音笔记](/zh-CN/nodes/audio)
- [媒体理解](/zh-CN/nodes/media-understanding)
