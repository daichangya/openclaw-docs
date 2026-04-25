---
read_when:
    - 添加或修改 `openclaw infer` 命令
    - 设计稳定的无头能力自动化
summary: 面向由提供商支持的模型、图像、音频、TTS、视频、网页和嵌入工作流的 infer-first CLI
title: 推理 CLI
x-i18n:
    generated_at: "2026-04-25T10:34:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` 是由提供商支持的推理工作流的规范无头入口。

它有意暴露的是能力家族，而不是原始 Gateway 网关 RPC 名称，也不是原始智能体工具 id。

## 将 infer 变成一个 skill

将下面内容复制并粘贴给一个智能体：

```text
阅读 https://docs.openclaw.ai/cli/infer，然后创建一个 skill，将我的常见工作流路由到 `openclaw infer`。
重点关注模型运行、图像生成、视频生成、音频转录、TTS、网页搜索和嵌入。
```

一个好的基于 infer 的 skill 应该：

- 将常见用户意图映射到正确的 infer 子命令
- 为其覆盖的工作流包含几个规范的 infer 示例
- 在示例和建议中优先使用 `openclaw infer ...`
- 避免在 skill 正文中重新记录整个 infer 功能面

典型的面向 infer 的 skill 覆盖范围：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 为什么使用 infer

`openclaw infer` 为 OpenClaw 中由提供商支持的推理任务提供了一个一致的 CLI。

优势：

- 使用 OpenClaw 中已经配置好的提供商和模型，而不是为每个后端分别接入一次性包装器。
- 将模型、图像、音频转录、TTS、视频、网页和嵌入工作流统一在一个命令树下。
- 为脚本、自动化和智能体驱动的工作流使用稳定的 `--json` 输出结构。
- 当任务本质上是“运行推理”时，优先使用 OpenClaw 的第一方入口。
- 对于大多数 infer 命令，使用普通本地路径而无需依赖 Gateway 网关。

对于端到端提供商检查，在更底层的
提供商测试通过后，优先使用 `openclaw infer ...`。它会在发出提供商请求之前，
覆盖已发布的 CLI、配置加载、
默认智能体解析、内置插件激活、运行时依赖修复，
以及共享能力运行时。

## 命令树

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## 常见任务

下表将常见推理任务映射到对应的 infer 命令。

| 任务 | 命令 | 说明 |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| 运行文本/模型提示词 | `openclaw infer model run --prompt "..." --json` | 默认使用普通本地路径 |
| 生成图像 | `openclaw infer image generate --prompt "..." --json` | 从现有文件开始时请使用 `image edit` |
| 描述图像文件 | `openclaw infer image describe --file ./image.png --json` | `--model` 必须是支持图像的 `<provider/model>` |
| 转录音频 | `openclaw infer audio transcribe --file ./memo.m4a --json` | `--model` 必须是 `<provider/model>` |
| 合成语音 | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` 面向 Gateway 网关 |
| 生成视频 | `openclaw infer video generate --prompt "..." --json` | 支持诸如 `--resolution` 之类的提供商提示参数 |
| 描述视频文件 | `openclaw infer video describe --file ./clip.mp4 --json` | `--model` 必须是 `<provider/model>` |
| 搜索网页 | `openclaw infer web search --query "..." --json` |  |
| 获取网页内容 | `openclaw infer web fetch --url https://example.com --json` |  |
| 创建嵌入 | `openclaw infer embedding create --text "..." --json` |  |

## 行为

- `openclaw infer ...` 是这些工作流的主要 CLI 入口。
- 当输出将被另一个命令或脚本消费时，使用 `--json`。
- 当需要特定后端时，使用 `--provider` 或 `--model provider/model`。
- 对于 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必须使用 `<provider/model>` 形式。
- 对于 `image describe`，显式指定 `--model` 会直接运行该 provider/model。该模型必须在模型目录或提供商配置中具备图像能力。`codex/<model>` 会运行一个受限的 Codex app-server 图像理解回合；`openai-codex/<model>` 使用 OpenAI Codex OAuth 提供商路径。
- 无状态执行命令默认使用本地。
- 由 Gateway 网关管理状态的命令默认使用 Gateway 网关。
- 普通本地路径不要求 Gateway 网关处于运行状态。
- `model run` 是一次性执行。通过该命令的智能体运行时打开的 MCP 服务器，会在本地和 `--gateway` 执行中都在回复后被回收，因此重复的脚本调用不会让 stdio MCP 子进程持续存活。

## 模型

对由提供商支持的文本推理以及模型/提供商检查，使用 `model`。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

说明：

- `model run` 会复用智能体运行时，因此提供商/模型覆盖的行为与普通智能体执行保持一致。
- 因为 `model run` 面向无头自动化，所以命令结束后不会保留每个会话的内置 MCP 运行时。
- `model auth login`、`model auth logout` 和 `model auth status` 用于管理已保存的提供商认证状态。

## 图像

生成、编辑和描述请使用 `image`。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

说明：

- 从现有输入文件开始时，请使用 `image edit`。
- 使用 `image providers --json` 来确认哪些内置图像提供商可被
  发现、已配置、已选中，以及每个提供商暴露了哪些
  生成/编辑能力。
- 将 `image generate --model <provider/model> --json` 用作图像生成变更的最小化在线
  CLI 冒烟检查。示例：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 响应会报告 `ok`、`provider`、`model`、`attempts` 和已写入的
  输出路径。设置了 `--output` 时，最终扩展名可能会遵循
  提供商返回的 MIME 类型。

- 对于 `image describe`，`--model` 必须是支持图像的 `<provider/model>`。
- 对于本地 Ollama 视觉模型，请先拉取模型，并将 `OLLAMA_API_KEY` 设置为任意占位值，例如 `ollama-local`。参见 [Ollama](/zh-CN/providers/ollama#vision-and-image-description)。

## 音频

文件转录请使用 `audio`。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

说明：

- `audio transcribe` 用于文件转录，不用于实时会话管理。
- `--model` 必须是 `<provider/model>`。

## TTS

语音合成和 TTS 提供商状态请使用 `tts`。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

说明：

- `tts status` 默认使用 Gateway 网关，因为它反映的是由 Gateway 网关管理的 TTS 状态。
- 使用 `tts providers`、`tts voices` 和 `tts set-provider` 来检查和配置 TTS 行为。

## 视频

生成和描述请使用 `video`。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

说明：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 和 `--timeout-ms`，并将它们转发给视频生成运行时。
- 对于 `video describe`，`--model` 必须是 `<provider/model>`。

## 网页

搜索和抓取工作流请使用 `web`。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

说明：

- 使用 `web providers` 来检查可用、已配置和已选中的提供商。

## 嵌入

向量创建和嵌入提供商检查请使用 `embedding`。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 输出

Infer 命令会在一个共享封装下规范化 JSON 输出：

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

顶层字段是稳定的：

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

对于生成媒体的命令，`outputs` 包含由 OpenClaw 写入的文件。请在
自动化中使用该数组中的 `path`、`mimeType`、`size` 以及任何媒体特定维度，
而不是解析面向人类的 stdout。

## 常见陷阱

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 说明

- `openclaw capability ...` 是 `openclaw infer ...` 的别名。

## 相关内容

- [CLI reference](/zh-CN/cli)
- [Models](/zh-CN/concepts/models)
