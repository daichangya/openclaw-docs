---
read_when:
    - 更改音频转录或媒体处理
summary: 入站音频/语音消息如何被下载、转录并注入到回复中
title: 音频和语音消息
x-i18n:
    generated_at: "2026-04-23T22:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# 音频 / 语音消息（2026-01-17）

## 已支持的内容

- **媒体理解（音频）**：如果已启用音频理解（或自动检测到可用），OpenClaw 会：
  1. 定位第一个音频附件（本地路径或 URL），并在需要时下载它。
  2. 在发送给每个模型条目前执行 `maxBytes` 限制。
  3. 按顺序运行第一个符合条件的模型条目（提供商或 CLI）。
  4. 如果失败或跳过（大小/超时），则尝试下一个条目。
  5. 成功后，用一个 `[Audio]` 块替换 `Body`，并设置 `{{Transcript}}`。
- **命令解析**：当转录成功时，`CommandBody`/`RawBody` 会被设置为转录文本，因此斜杠命令仍然有效。
- **详细日志**：在 `--verbose` 模式下，我们会记录转录何时运行，以及何时替换消息正文。

## 自动检测（默认）

如果你**未配置模型**，并且 `tools.media.audio.enabled` **未**设置为 `false`，
OpenClaw 会按以下顺序自动检测，并在找到第一个可用选项后停止：

1. **当前回复模型**，前提是其提供商支持音频理解。
2. **本地 CLI**（如果已安装）
   - `sherpa-onnx-offline`（需要设置 `SHERPA_ONNX_MODEL_DIR`，其中包含 encoder/decoder/joiner/tokens）
   - `whisper-cli`（来自 `whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或内置 tiny 模型）
   - `whisper`（Python CLI；自动下载模型）
3. **Gemini CLI**（`gemini`），使用 `read_many_files`
4. **提供商身份验证**
   - 会优先尝试已配置且支持音频的 `models.providers.*` 条目
   - 内置回退顺序：OpenAI → Groq → Deepgram → Google → Mistral

如需禁用自动检测，请设置 `tools.media.audio.enabled: false`。
如需自定义，请设置 `tools.media.audio.models`。
注意：在 macOS/Linux/Windows 上，二进制检测是尽力而为；请确保 CLI 位于 `PATH` 中（我们会展开 `~`），或设置带完整命令路径的显式 CLI 模型。

## 配置示例

### 提供商 + CLI 回退（OpenAI + Whisper CLI）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### 仅提供商，并带作用域门控

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### 仅提供商（Deepgram）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### 仅提供商（Mistral Voxtral）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### 将转录内容回显到聊天中（主动启用）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## 说明与限制

- 提供商身份验证遵循标准模型身份验证顺序（auth 配置文件、环境变量、`models.providers.*.apiKey`）。
- Groq 设置详情： [Groq](/zh-CN/providers/groq)。
- 当使用 `provider: "deepgram"` 时，Deepgram 会读取 `DEEPGRAM_API_KEY`。
- Deepgram 设置详情： [Deepgram（音频转录）](/zh-CN/providers/deepgram)。
- Mistral 设置详情： [Mistral](/zh-CN/providers/mistral)。
- 音频提供商可以通过 `tools.media.audio` 覆盖 `baseUrl`、`headers` 和 `providerOptions`。
- 默认大小上限为 20 MB（`tools.media.audio.maxBytes`）。超大音频会对该模型跳过，并尝试下一个条目。
- 小于 1024 字节的极小/空音频文件会在提供商/CLI 转录之前被跳过。
- 音频的默认 `maxChars` **未设置**（完整转录）。设置 `tools.media.audio.maxChars` 或按条目的 `maxChars` 可裁剪输出。
- OpenAI 的自动默认值是 `gpt-4o-mini-transcribe`；如需更高准确率，请设置 `model: "gpt-4o-transcribe"`。
- 使用 `tools.media.audio.attachments` 可处理多个语音消息（`mode: "all"` + `maxAttachments`）。
- 转录文本可在模板中作为 `{{Transcript}}` 使用。
- `tools.media.audio.echoTranscript` 默认关闭；启用后会在智能体处理前，将转录确认发送回原始聊天。
- `tools.media.audio.echoFormat` 用于自定义回显文本（占位符：`{transcript}`）。
- CLI stdout 有上限（5 MB）；请保持 CLI 输出简洁。

### 代理环境支持

基于提供商的音频转录会遵循标准出站代理环境变量：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

如果未设置代理环境变量，则使用直连出口。如果代理配置格式错误，OpenClaw 会记录一条警告并回退到直连获取。

## 群组中的提及检测

当为群聊设置 `requireMention: true` 时，OpenClaw 现在会在检查提及之前**先转录音频**。这样即使语音消息中包含提及，也能被处理。

**工作方式：**

1. 如果语音消息没有文本正文，并且群组要求提及，OpenClaw 会执行一次“预检”转录。
2. 系统会检查转录文本中是否存在提及模式（例如 `@BotName`、emoji 触发词）。
3. 如果检测到提及，消息会继续进入完整回复管线。
4. 转录文本会用于提及检测，从而使语音消息能够通过提及门控。

**回退行为：**

- 如果预检期间转录失败（超时、API 错误等），消息会根据仅文本的提及检测来处理。
- 这样可确保混合消息（文本 + 音频）永远不会被错误丢弃。

**按 Telegram 群组/话题选择退出：**

- 设置 `channels.telegram.groups.<chatId>.disableAudioPreflight: true` 可为该群组跳过预检转录提及检查。
- 设置 `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` 可按话题覆盖（`true` 表示跳过，`false` 表示强制启用）。
- 默认值为 `false`（当提及门控条件匹配时启用预检）。

**示例：** 用户在一个设置了 `requireMention: true` 的 Telegram 群组中发送一条语音消息，说“Hey @Claude, what's the weather?”。该语音消息会先被转录，系统检测到提及，然后智能体作出回复。

## 注意事项

- 作用域规则采用首个匹配即生效。`chatType` 会被规范化为 `direct`、`group` 或 `room`。
- 请确保你的 CLI 以 0 退出，并输出纯文本；如果输出 JSON，需要通过 `jq -r .text` 进行处理。
- 对于 `parakeet-mlx`，如果你传入 `--output-dir`，当 `--output-format` 为 `txt`（或省略）时，OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；非 `txt` 输出格式会回退到解析 stdout。
- 请将超时设置保持在合理范围内（`timeoutSeconds`，默认 60 秒），以避免阻塞回复队列。
- 预检转录仅会处理**第一个**音频附件用于提及检测。其他音频会在主要媒体理解阶段中处理。

## 相关

- [媒体理解](/zh-CN/nodes/media-understanding)
- [Talk 模式](/zh-CN/nodes/talk)
- [语音唤醒](/zh-CN/nodes/voicewake)
