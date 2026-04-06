---
read_when:
    - 通过智能体生成视频时
    - 配置视频生成提供商和模型时
    - 了解 `video_generate` 工具参数时
summary: 使用 12 个提供商后端，从文本、图像或现有视频生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-04-06T12:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: a224c0a1bd6fe61592ac22ad9a65f0ae25a378a12b79c1210f2e7101886798bb
    source_path: tools/video-generation.md
    workflow: 15
---

# 视频生成

OpenClaw 智能体可以根据文本提示、参考图像或现有视频生成视频。支持 12 个提供商后端，每个后端具有不同的模型选项、输入模式和功能集。智能体会根据你的配置和可用的 API 密钥自动选择合适的提供商。

<Note>
只有在至少有一个视频生成提供商可用时，`video_generate` 工具才会出现。如果你没有在智能体工具中看到它，请设置提供商 API 密钥，或配置 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 将视频生成视为三种运行时模式：

- `generate`：用于没有参考媒体的文生视频请求
- `imageToVideo`：当请求包含一个或多个参考图像时使用
- `videoToVideo`：当请求包含一个或多个参考视频时使用

提供商可以支持这些模式中的任意子集。工具会在提交前验证当前模式，并在 `action=list` 中报告支持的模式。

## 快速开始

1. 为任一受支持的提供商设置 API 密钥：

```bash
export GEMINI_API_KEY="your-key"
```

2. 可选：固定一个默认模型：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 向智能体提出请求：

> 生成一个 5 秒长、具有电影感的友善龙虾在日落时冲浪的视频。

智能体会自动调用 `video_generate`。无需对工具进行 allowlist 配置。

## 生成视频时会发生什么

视频生成是异步的。当智能体在一个会话中调用 `video_generate` 时：

1. OpenClaw 会将请求提交给提供商，并立即返回一个任务 ID。
2. 提供商会在后台处理该任务（通常需要 30 秒到 5 分钟，具体取决于提供商和分辨率）。
3. 当视频准备就绪时，OpenClaw 会通过内部完成事件唤醒同一个会话。
4. 智能体会将完成的视频发布回原始对话中。

当同一会话中已有任务正在进行时，重复调用 `video_generate` 不会启动新的生成，而是返回当前任务状态。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可在 CLI 中检查进度。

在不依赖会话支持的智能体运行场景之外（例如直接调用工具），该工具会回退为内联生成，并在同一轮中返回最终媒体路径。

## 支持的提供商

| 提供商 | 默认模型                        | 文本 | 图像参考          | 视频参考         | API 密钥                                  |
| ------ | ------------------------------- | ---- | ----------------- | ---------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | 是   | 是（远程 URL）    | 是（远程 URL）   | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | 是   | 1 张图像          | 否               | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | 是   | 1 张图像          | 否               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | 是   | 1 张图像          | 否               | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | 是   | 1 张图像          | 1 个视频         | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | 是   | 1 张图像          | 否               | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | 是   | 1 张图像          | 1 个视频         | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | 是   | 是（远程 URL）    | 是（远程 URL）   | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | 是   | 1 张图像          | 1 个视频         | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | 是   | 1 张图像          | 否               | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | 是   | 1 张图像（`kling`） | 否             | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | 是   | 1 张图像          | 1 个视频         | `XAI_API_KEY`                            |

某些提供商接受额外或替代的 API 密钥环境变量。详见各个[提供商页面](#related)。

运行 `video_generate action=list` 可在运行时检查可用的提供商、模型和运行时模式。

## 工具参数

### 必填

| 参数     | 类型   | 说明                                                                        |
| -------- | ------ | --------------------------------------------------------------------------- |
| `prompt` | string | 要生成视频的文本描述（对于 `action: "generate"` 为必填） |

### 内容输入

| 参数     | 类型     | 说明                         |
| -------- | -------- | ---------------------------- |
| `image`  | string   | 单个参考图像（路径或 URL）   |
| `images` | string[] | 多个参考图像（最多 5 个）    |
| `video`  | string   | 单个参考视频（路径或 URL）   |
| `videos` | string[] | 多个参考视频（最多 4 个）    |

### 风格控制

| 参数              | 类型    | 说明                                                                     |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`     | string  | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` |
| `resolution`      | string  | `480P`、`720P` 或 `1080P`                                                |
| `durationSeconds` | number  | 目标时长（秒，四舍五入到提供商支持的最接近值）                           |
| `size`            | string  | 当提供商支持时的尺寸提示                                                 |
| `audio`           | boolean | 在支持时启用生成音频                                                     |
| `watermark`       | boolean | 在支持时切换提供商水印                                                   |

### 高级

| 参数       | 类型   | 说明                                              |
| ---------- | ------ | ------------------------------------------------- |
| `action`   | string | `"generate"`（默认）、`"status"` 或 `"list"`      |
| `model`    | string | 提供商/模型覆盖（例如 `runway/gen4.5`）           |
| `filename` | string | 输出文件名提示                                    |

并非所有提供商都支持全部参数。不支持的覆盖项会以尽力而为的方式被忽略，并在工具结果中报告为警告。硬性能力限制（例如参考输入过多）会在提交前直接失败。

参考输入也会决定运行时模式：

- 无参考媒体：`generate`
- 任意图像参考：`imageToVideo`
- 任意视频参考：`videoToVideo`

混合使用图像和视频参考并不是稳定的共享能力接口。
建议每次请求只使用一种参考类型。

## 操作

- **generate**（默认）-- 根据给定提示和可选参考输入创建视频。
- **status** -- 检查当前会话中正在进行的视频任务状态，而不启动新的生成。
- **list** -- 显示可用的提供商、模型及其能力。

## 模型选择

生成视频时，OpenClaw 会按以下顺序解析模型：

1. **`model` 工具参数** -- 如果智能体在调用中指定了该参数。
2. **`videoGenerationModel.primary`** -- 来自配置。
3. **`videoGenerationModel.fallbacks`** -- 按顺序尝试。
4. **自动检测** -- 使用具有有效认证的提供商，先从当前默认提供商开始，然后按字母顺序尝试其余提供商。

如果某个提供商失败，会自动尝试下一个候选项。如果所有候选项都失败，错误中会包含每次尝试的详细信息。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## 提供商说明

| 提供商 | 说明                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | 使用 DashScope/Model Studio 异步端点。参考图像和视频必须是远程 `http(s)` URL。                                                                    |
| BytePlus | 仅支持单张参考图像。                                                                                                                                |
| ComfyUI  | 由工作流驱动的本地或云端执行。通过已配置图形支持文生视频和图生视频。                                                                              |
| fal      | 对长时间运行任务使用基于队列的流程。仅支持单张参考图像。                                                                                           |
| Google   | 使用 Gemini/Veo。支持一个图像参考或一个视频参考。                                                                                                  |
| MiniMax  | 仅支持单张参考图像。                                                                                                                                |
| OpenAI   | 仅转发 `size` 覆盖项。其他风格覆盖项（`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略，并附带警告。                                  |
| Qwen     | 与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程 `http(s)` URL；本地文件会在前期直接被拒绝。                                               |
| Runway   | 支持通过数据 URI 使用本地文件。视频转视频需要 `runway/gen4_aleph`。纯文本运行提供 `16:9` 和 `9:16` 宽高比。                                        |
| Together | 仅支持单张参考图像。                                                                                                                                |
| Vydra    | 直接使用 `https://www.vydra.ai/api/v1`，以避免认证在重定向中丢失。`veo3` 内置为仅文生视频；`kling` 需要远程图像 URL。                             |
| xAI      | 支持文生视频、图生视频，以及远程视频编辑/扩展流程。                                                                                                |

## 提供商能力模式

共享的视频生成契约现在允许提供商声明按模式划分的能力，而不只是扁平的聚合限制。新的提供商实现应优先使用显式模式块：

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

旧的扁平字段，如 `maxInputImages` 和 `maxInputVideos`，仍可作为向后兼容的聚合上限使用，但它们无法同样精确地表达按模式划分的限制。

## 配置

在你的 OpenClaw 配置中设置默认视频生成模型：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

或通过 CLI：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 相关内容

- [工具概览](/zh-CN/tools)
- [后台任务](/zh-CN/automation/tasks) -- 异步视频生成的任务跟踪
- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [BytePlus（国际版）](/zh-CN/concepts/model-providers#byteplus-international)
- [ComfyUI](/zh-CN/providers/comfy)
- [fal](/zh-CN/providers/fal)
- [Google（Gemini）](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [OpenAI](/zh-CN/providers/openai)
- [Qwen](/zh-CN/providers/qwen)
- [Runway](/zh-CN/providers/runway)
- [Together AI](/zh-CN/providers/together)
- [Vydra](/zh-CN/providers/vydra)
- [xAI](/zh-CN/providers/xai)
- [配置参考](/zh-CN/gateway/configuration-reference#agent-defaults)
- [模型](/zh-CN/concepts/models)
