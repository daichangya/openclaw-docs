---
read_when:
    - 设计或重构媒体理解功能
    - 调优入站音频/视频/图片预处理
summary: 入站图片/音频/视频理解（可选），支持提供商和 CLI 回退
title: 媒体理解
x-i18n:
    generated_at: "2026-04-23T20:54:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7aedf3a080c4b1ab627e563c120cdee9b05c6ef9dac776843bb60b276ada8786
    source_path: nodes/media-understanding.md
    workflow: 15
---

# 媒体理解 - 入站（2026-01-17）

OpenClaw 可以在回复流水线运行前对**入站媒体**（图片/音频/视频）进行**摘要理解**。它会自动检测本地工具或提供商密钥是否可用，并且可以禁用或自定义。如果关闭理解功能，模型仍会像往常一样接收原始文件/URL。

各厂商特定的媒体行为由厂商插件注册，而 OpenClaw
核心负责共享的 `tools.media` 配置、回退顺序和回复流水线集成。

## 目标

- 可选：将入站媒体预先摘要为简短文本，以加快路由和改善命令解析。
- 始终保留原始媒体向模型传递（永远如此）。
- 支持**提供商 API** 和 **CLI 回退**。
- 支持多个模型并按顺序回退（错误/大小/超时）。

## 高层行为

1. 收集入站附件（`MediaPaths`、`MediaUrls`、`MediaTypes`）。
2. 对每个启用的能力（图片/音频/视频），按策略选择附件（默认：**第一个**）。
3. 选择第一个符合条件的模型条目（大小 + 能力 + 身份验证）。
4. 如果模型失败或媒体过大，则**回退到下一个条目**。
5. 成功时：
   - `Body` 变为 `[Image]`、`[Audio]` 或 `[Video]` 块。
   - 音频会设置 `{{Transcript}}`；命令解析在有 caption 文本时使用 caption，
     否则使用 transcript。
   - Caption 会以 `User text:` 的形式保留在块中。

如果理解失败或被禁用，**回复流程仍会继续**，并使用原始正文 + 附件。

## 配置概览

`tools.media` 支持**共享模型**以及按能力划分的覆盖：

- `tools.media.models`：共享模型列表（使用 `capabilities` 进行能力限制）。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`：
  - 默认值（`prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`）
  - 提供商覆盖（`baseUrl`、`headers`、`providerOptions`）
  - 通过 `tools.media.audio.providerOptions.deepgram` 设置的 Deepgram 音频选项
  - 音频 transcript 回显控制（`echoTranscript`，默认 `false`；`echoFormat`）
  - 可选的**按能力划分 `models` 列表**（优先于共享模型）
  - `attachments` 策略（`mode`、`maxAttachments`、`prefer`）
  - `scope`（可选，按渠道/chatType/session key 进行门控）
- `tools.media.concurrency`：最大并发能力运行数（默认 **2**）。

```json5
{
  tools: {
    media: {
      models: [
        /* 共享列表 */
      ],
      image: {
        /* 可选覆盖 */
      },
      audio: {
        /* 可选覆盖 */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* 可选覆盖 */
      },
    },
  },
}
```

### 模型条目

每个 `models[]` 条目都可以是**提供商**或 **CLI**：

```json5
{
  type: "provider", // 如果省略则默认为 provider
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // 可选，用于多模态条目
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI 模板还可以使用：

- `{{MediaDir}}`（包含媒体文件的目录）
- `{{OutputDir}}`（为本次运行创建的临时目录）
- `{{OutputBase}}`（临时文件基础路径，不含扩展名）

## 默认值和限制

推荐默认值：

- `maxChars`：图片/视频为 **500**（简短、便于命令解析）
- `maxChars`：音频为**未设置**（除非你显式设置限制，否则使用完整 transcript）
- `maxBytes`：
  - 图片：**10MB**
  - 音频：**20MB**
  - 视频：**50MB**

规则：

- 如果媒体超过 `maxBytes`，则会跳过该模型，并**尝试下一个模型**。
- 小于 **1024 字节**的音频文件会被视为空/损坏，并在提供商/CLI 转录前跳过。
- 如果模型返回的内容超过 `maxChars`，输出会被裁剪。
- `prompt` 默认使用简单的 “Describe the {media}.”，并附带 `maxChars` 指引（仅图片/视频）。
- 如果当前活动的主图片模型已经原生支持视觉能力，OpenClaw
  会跳过 `[Image]` 摘要块，而是直接将原始图片传入
  模型。
- 显式的 `openclaw infer image describe --model <provider/model>` 请求则不同：它们会直接运行该具备图像能力的提供商/模型，包括
  类似 `ollama/qwen2.5vl:7b` 这样的 Ollama 引用。
- 如果 `<capability>.enabled: true` 但未配置任何模型，OpenClaw 会尝试
  **当前活动的回复模型**，前提是其提供商支持该能力。

### 自动检测媒体理解（默认）

如果 `tools.media.<capability>.enabled` **未**设置为 `false`，并且你还没有
配置模型，OpenClaw 会按以下顺序自动检测，并在找到**第一个可用选项时停止**：

1. **当前活动的回复模型**，前提是其提供商支持该能力。
2. **`agents.defaults.imageModel`** 的主/回退引用（仅图片）。
3. **本地 CLI**（仅音频；如果已安装）
   - `sherpa-onnx-offline`（要求 `SHERPA_ONNX_MODEL_DIR` 中包含 encoder/decoder/joiner/tokens）
   - `whisper-cli`（`whisper-cpp`；使用 `WHISPER_CPP_MODEL` 或内置的 tiny 模型）
   - `whisper`（Python CLI；会自动下载模型）
4. **Gemini CLI**（`gemini`），使用 `read_many_files`
5. **提供商身份验证**
   - 已配置的、支持该能力的 `models.providers.*` 条目
     会优先于内置回退顺序被尝试。
   - 带有图像能力模型的仅图片配置提供商，即使不是内置厂商插件，也会自动注册用于
     媒体理解。
   - 当显式选中时，Ollama 图片理解可用，例如通过
     `agents.defaults.imageModel` 或
     `openclaw infer image describe --model ollama/<vision-model>`。
   - 内置回退顺序：
     - 音频：OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - 图片：OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - 视频：Google → Qwen → Moonshot

若要禁用自动检测，请设置：

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

注意：二进制检测会尽力支持 macOS/Linux/Windows；请确保 CLI 位于 `PATH` 中（我们会展开 `~`），或设置带完整命令路径的显式 CLI 模型。

### 代理环境支持（提供商模型）

启用基于提供商的**音频**和**视频**媒体理解时，OpenClaw
会在提供商 HTTP 调用中遵循标准的出站代理环境变量：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

如果未设置任何代理环境变量，媒体理解会直接出站。
如果代理值格式错误，OpenClaw 会记录一条警告，并回退到直接
抓取。

## 能力（可选）

如果你设置了 `capabilities`，该条目只会针对这些媒体类型运行。对于共享
列表，OpenClaw 可以推断默认值：

- `openai`、`anthropic`、`minimax`：**图片**
- `minimax-portal`：**图片**
- `moonshot`：**图片 + 视频**
- `openrouter`：**图片**
- `google`（Gemini API）：**图片 + 音频 + 视频**
- `qwen`：**图片 + 视频**
- `mistral`：**音频**
- `zai`：**图片**
- `groq`：**音频**
- `xai`：**音频**
- `deepgram`：**音频**
- 任何带有图像能力模型的 `models.providers.<id>.models[]` 目录：
  **图片**

对于 CLI 条目，**请显式设置 `capabilities`**，以避免意外匹配。
如果你省略 `capabilities`，该条目就会对它所在列表生效。

## 提供商支持矩阵（OpenClaw 集成）

| 能力       | 提供商集成                                                                             | 说明                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 图片       | OpenAI、OpenRouter、Anthropic、Google、MiniMax、Moonshot、Qwen、Z.AI、配置提供商       | 厂商插件会注册图像支持；MiniMax 和 MiniMax OAuth 都使用 `MiniMax-VL-01`；具备图像能力的配置提供商会自动注册。                         |
| 音频       | OpenAI、Groq、Deepgram、Google、Mistral                                                | 提供商转录（Whisper/Deepgram/Gemini/Voxtral）。                                                                                         |
| 视频       | Google、Qwen、Moonshot                                                                 | 通过厂商插件实现提供商视频理解；Qwen 视频理解使用标准 DashScope 端点。                                                                  |

MiniMax 说明：

- `minimax` 和 `minimax-portal` 的图像理解来自插件拥有的
  `MiniMax-VL-01` 媒体提供商。
- 内置的 MiniMax 文本目录仍然从纯文本开始；显式的
  `models.providers.minimax` 条目会实体化具备图像能力的 M2.7 chat 引用。

## 模型选择建议

- 当质量和安全性重要时，优先为每种媒体能力选择可用的最新一代强模型。
- 对于处理不受信任输入的启用工具智能体，避免使用较旧/较弱的媒体模型。
- 每种能力至少保留一个回退，以提高可用性（高质量模型 + 更快/更便宜模型）。
- 当提供商 API 不可用时，CLI 回退（`whisper-cli`、`whisper`、`gemini`）很有用。
- `parakeet-mlx` 说明：使用 `--output-dir` 时，如果输出格式为 `txt`（或未指定），OpenClaw 会读取 `<output-dir>/<media-basename>.txt`；非 `txt` 格式则回退到 stdout。

## 附件策略

按能力划分的 `attachments` 控制处理哪些附件：

- `mode`：`first`（默认）或 `all`
- `maxAttachments`：处理数量上限（默认 **1**）
- `prefer`：`first`、`last`、`path`、`url`

当 `mode: "all"` 时，输出会标记为 `[Image 1/2]`、`[Audio 2/2]` 等。

文件附件提取行为：

- 提取出的文件文本在附加到媒体提示前，会被包装为**不受信任的外部内容**。
- 注入块使用明确的边界标记，例如
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`，并包含一行
  `Source: External` 元数据。
- 该附件提取路径有意省略冗长的
  `SECURITY NOTICE:` 横幅，以避免媒体提示膨胀；但边界
  标记和元数据仍会保留。
- 如果文件中没有可提取文本，OpenClaw 会注入 `[No extractable text]`。
- 如果某个 PDF 在此路径中回退为渲染后的页面图片，媒体提示会保留
  占位符 `[PDF content rendered to images; images not forwarded to model]`，
  因为这个附件提取步骤转发的是文本块，而不是渲染后的 PDF 图片。

## 配置示例

### 1）共享模型列表 + 覆盖

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2）仅音频 + 视频（关闭图片）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3）可选的图片理解

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4）多模态单条目（显式能力）

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## 状态输出

当媒体理解运行时，`/status` 会包含一条简短摘要行：

```text
📎 Media：image 正常（openai/gpt-5.5）· audio 已跳过（maxBytes）
```

它会显示按能力划分的结果，以及在适用时所选的提供商/模型。

## 说明

- 理解是**尽力而为**的。错误不会阻止回复。
- 即使关闭理解功能，附件仍会传递给模型。
- 使用 `scope` 可限制理解在哪些位置运行（例如仅在私信中）。

## 相关文档

- [配置](/zh-CN/gateway/configuration)
- [图片与媒体支持](/zh-CN/nodes/images)
