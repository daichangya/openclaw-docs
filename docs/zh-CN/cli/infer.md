---
read_when:
    - 添加或修改 `openclaw infer` 命令
    - 设计稳定的无头能力自动化
summary: 面向 provider 支持的模型、图像、音频、TTS、视频、网页和嵌入工作流的 infer-first CLI
title: 推理 CLI
x-i18n:
    generated_at: "2026-04-23T20:44:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a93edb109474a0f2d72609c93563caf21b26adda033cb1ecd3fa646de0d304f
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` 是 provider 支持的推理工作流的标准无头界面。

它有意暴露的是能力族，而不是原始 gateway RPC 名称，也不是原始智能体工具 ID。

## 将 infer 变成一个技能

把下面这段内容复制并粘贴给一个智能体：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

一个基于 infer 的优秀技能应当：

- 将常见用户意图映射到正确的 infer 子命令
- 为其覆盖的工作流提供少量标准 infer 示例
- 在示例和建议中优先使用 `openclaw infer ...`
- 避免在技能正文中重新记录整个 infer 界面

典型的 infer 技能覆盖范围：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 为什么使用 infer

`openclaw infer` 为 OpenClaw 内的 provider 支持推理任务提供了统一的 CLI。

优点：

- 使用 OpenClaw 中已配置的 providers 和模型，而不是为每个后端单独接线一次性封装器。
- 将模型、图像、音频转写、TTS、视频、网页和嵌入工作流统一放在同一命令树下。
- 为脚本、自动化和智能体驱动工作流使用稳定的 `--json` 输出结构。
- 当任务本质上是“运行推理”时，优先使用 OpenClaw 的第一方界面。
- 对于大多数 infer 命令，使用正常的本地路径，无需 Gateway 网关。

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

| 任务                    | 命令                                                                   | 说明                                                |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- |
| 运行文本/模型提示       | `openclaw infer model run --prompt "..." --json`                       | 默认使用正常本地路径                                |
| 生成图像                | `openclaw infer image generate --prompt "..." --json`                  | 如果从现有文件开始，请使用 `image edit`             |
| 描述图像文件            | `openclaw infer image describe --file ./image.png --json`              | `--model` 必须是支持图像的 `<provider/model>`       |
| 转写音频                | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` 必须是 `<provider/model>`                 |
| 合成语音                | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` 面向 Gateway 网关                      |
| 生成视频                | `openclaw infer video generate --prompt "..." --json`                  |                                                     |
| 描述视频文件            | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` 必须是 `<provider/model>`                 |
| 搜索网页                | `openclaw infer web search --query "..." --json`                       |                                                     |
| 获取网页                | `openclaw infer web fetch --url https://example.com --json`            |                                                     |
| 创建嵌入                | `openclaw infer embedding create --text "..." --json`                  |                                                     |

## 行为

- `openclaw infer ...` 是这些工作流的主要 CLI 界面。
- 当输出将被其他命令或脚本消费时，请使用 `--json`。
- 当需要特定后端时，请使用 `--provider` 或 `--model provider/model`。
- 对于 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必须使用 `<provider/model>` 形式。
- 对于 `image describe`，显式 `--model` 会直接运行该 provider/模型。该模型必须在模型目录或 provider 配置中具备图像能力。
- 无状态执行命令默认走本地。
- 由 Gateway 网关管理状态的命令默认走 Gateway 网关。
- 正常本地路径无需 Gateway 网关运行。

## Model

对 provider 支持的文本推理以及模型/provider 检查，请使用 `model`。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

说明：

- `model run` 会复用智能体运行时，因此 provider/模型覆盖的行为与正常智能体执行一致。
- `model auth login`、`model auth logout` 和 `model auth status` 用于管理已保存的 provider 认证状态。

## Image

生成、编辑和描述图像请使用 `image`。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

说明：

- 从现有输入文件开始时，请使用 `image edit`。
- 对于 `image describe`，`--model` 必须是支持图像的 `<provider/model>`。
- 对于本地 Ollama 视觉模型，请先拉取模型，并将 `OLLAMA_API_KEY` 设置为任意占位值，例如 `ollama-local`。参见 [Ollama](/zh-CN/providers/ollama#vision-and-image-description)。

## Audio

文件转写请使用 `audio`。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

说明：

- `audio transcribe` 用于文件转写，而不是实时会话管理。
- `--model` 必须是 `<provider/model>`。

## TTS

语音合成和 TTS provider 状态请使用 `tts`。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

说明：

- `tts status` 默认走 Gateway 网关，因为它反映的是 Gateway 网关管理的 TTS 状态。
- 使用 `tts providers`、`tts voices` 和 `tts set-provider` 来检查和配置 TTS 行为。

## Video

生成和描述视频请使用 `video`。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

说明：

- 对于 `video describe`，`--model` 必须是 `<provider/model>`。

## Web

搜索和抓取网页工作流请使用 `web`。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

说明：

- 使用 `web providers` 检查可用、已配置和已选定的 providers。

## Embedding

向量创建和嵌入 provider 检查请使用 `embedding`。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 输出

Infer 命令会在共享封装结构下规范化 JSON 输出：

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
