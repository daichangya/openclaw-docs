---
read_when:
    - 通过智能体生成视频
    - 配置视频生成提供商和模型
    - 了解 `video_generate` 工具参数
summary: 使用 12 个提供商后端，通过文本、图像或现有视频生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-04-06T18:17:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc8984dfc718a3558b66089b37aea718f3da1ec8cf4f846a017201413c9be6a2
    source_path: tools/video-generation.md
    workflow: 15
---

# 视频生成

OpenClaw 智能体可以根据文本提示、参考图像或现有视频生成视频。支持 12 个提供商后端，每个后端都有不同的模型选项、输入模式和功能集。智能体会根据你的配置和可用的 API 密钥自动选择合适的提供商。

<Note>
仅当至少有一个视频生成提供商可用时，`video_generate` 工具才会出现。如果你没有在智能体工具中看到它，请设置提供商 API 密钥或配置 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 将视频生成视为三种运行时模式：

- `generate` 用于不包含参考媒体的文生视频请求
- 当请求包含一个或多个参考图像时使用 `imageToVideo`
- 当请求包含一个或多个参考视频时使用 `videoToVideo`

提供商可以支持这些模式中的任意子集。该工具会在提交前验证当前模式，并在 `action=list` 中报告支持的模式。

## 快速开始

1. 为任意受支持的提供商设置 API 密钥：

```bash
export GEMINI_API_KEY="your-key"
```

2. 可选：固定一个默认模型：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 向智能体发出请求：

> 生成一段 5 秒钟、富有电影感的友善龙虾在日落时分冲浪的视频。

智能体会自动调用 `video_generate`。不需要将工具加入允许列表。

## 生成视频时会发生什么

视频生成是异步的。当智能体在会话中调用 `video_generate` 时：

1. OpenClaw 将请求提交给提供商，并立即返回一个任务 ID。
2. 提供商在后台处理该任务（通常为 30 秒到 5 分钟，取决于提供商和分辨率）。
3. 当视频准备就绪后，OpenClaw 会通过内部完成事件唤醒同一个会话。
4. 智能体会将最终生成的视频发布回原始对话中。

当某个任务正在进行时，同一会话中的重复 `video_generate` 调用会返回当前任务状态，而不是启动新的生成。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 可以通过 CLI 检查进度。

在非会话支持的智能体运行之外（例如直接调用工具），该工具会回退为内联生成，并在同一轮中返回最终媒体路径。

### 任务生命周期

每个 `video_generate` 请求都会经过四个状态：

1. **queued** -- 任务已创建，等待提供商接受。
2. **running** -- 提供商正在处理中（通常为 30 秒到 5 分钟，取决于提供商和分辨率）。
3. **succeeded** -- 视频已就绪；智能体会被唤醒并将其发布到对话中。
4. **failed** -- 提供商错误或超时；智能体会被唤醒并附带错误详情。

通过 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

防止重复：如果当前会话中已有视频任务处于 `queued` 或 `running` 状态，`video_generate` 会返回现有任务状态，而不是启动新任务。使用 `action: "status"` 可以显式检查状态，而不会触发新的生成。

## 支持的提供商

| 提供商 | 默认模型                        | 文本 | 图像参考          | 视频参考         | API 密钥                                  |
| ------ | ------------------------------- | ---- | ----------------- | ---------------- | ----------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | 是   | 是（远程 URL）    | 是（远程 URL）   | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | 是   | 1 张图像          | 否               | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | 是   | 1 张图像          | 否               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | 是   | 1 张图像          | 否               | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | 是   | 1 张图像          | 1 段视频         | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | 是   | 1 张图像          | 否               | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | 是   | 1 张图像          | 1 段视频         | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | 是   | 是（远程 URL）    | 是（远程 URL）   | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | 是   | 1 张图像          | 1 段视频         | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | 是   | 1 张图像          | 否               | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | 是   | 1 张图像 (`kling`) | 否              | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | 是   | 1 张图像          | 1 段视频         | `XAI_API_KEY`                            |

某些提供商还接受额外或替代的 API 密钥环境变量。详见各个[提供商页面](#related)。

运行 `video_generate action=list` 可在运行时查看可用的提供商、模型和运行时模式。

### 声明的能力矩阵

这是 `video_generate`、契约测试以及共享实时扫描使用的显式模式契约。

| 提供商 | `generate` | `imageToVideo` | `videoToVideo` | 当前共享实时通道                                                                                                                        |
| ------ | ---------- | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 已跳过，因为此提供商需要远程 `http(s)` 视频 URL                                             |
| BytePlus | 是         | 是             | 否             | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI  | 是         | 是             | 否             | 不在共享扫描中；特定于工作流的覆盖由 Comfy 测试负责                                                                                    |
| fal      | 是         | 是             | 否             | `generate`、`imageToVideo`                                                                                                              |
| Google   | 是         | 是             | 是             | `generate`、`imageToVideo`；共享 `videoToVideo` 已跳过，因为当前基于缓冲区的 Gemini/Veo 扫描不接受该输入                               |
| MiniMax  | 是         | 是             | 否             | `generate`、`imageToVideo`                                                                                                              |
| OpenAI   | 是         | 是             | 是             | `generate`、`imageToVideo`；共享 `videoToVideo` 已跳过，因为当前组织/输入路径需要提供商侧的修补/混剪访问                               |
| Qwen     | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 已跳过，因为此提供商需要远程 `http(s)` 视频 URL                                             |
| Runway   | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 仅在所选模型为 `runway/gen4_aleph` 时运行                                                   |
| Together | 是         | 是             | 否             | `generate`、`imageToVideo`                                                                                                              |
| Vydra    | 是         | 是             | 否             | `generate`；共享 `imageToVideo` 已跳过，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL                                    |
| xAI      | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 已跳过，因为此提供商当前需要远程 MP4 URL                                                    |

## 工具参数

### 必填

| 参数     | 类型   | 说明                                                                          |
| -------- | ------ | ----------------------------------------------------------------------------- |
| `prompt` | string | 要生成的视频文本描述（对 `action: "generate"` 为必填）                        |

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
| `resolution`      | string  | `480P`、`720P`、`768P` 或 `1080P`                                        |
| `durationSeconds` | number  | 目标时长（单位：秒，会四舍五入到提供商支持的最近值）                     |
| `size`            | string  | 当提供商支持时使用的尺寸提示                                             |
| `audio`           | boolean | 在支持时启用生成音频                                                     |
| `watermark`       | boolean | 在支持时切换提供商水印                                                   |

### 高级

| 参数       | 类型   | 说明                                           |
| ---------- | ------ | ---------------------------------------------- |
| `action`   | string | `"generate"`（默认）、`"status"` 或 `"list"`   |
| `model`    | string | 提供商/模型覆盖（例如 `runway/gen4.5`）        |
| `filename` | string | 输出文件名提示                                 |

并非所有提供商都支持所有参数。不支持的覆盖项会尽力忽略，并在工具结果中以警告形式报告。硬性能力限制（例如参考输入过多）会在提交前直接失败。

参考输入还会决定运行时模式：

- 无参考媒体：`generate`
- 任意图像参考：`imageToVideo`
- 任意视频参考：`videoToVideo`

混合使用图像和视频参考并不是稳定的共享能力表面。
建议每个请求只使用一种参考类型。

## 操作

- **generate**（默认）-- 根据给定提示和可选参考输入创建视频。
- **status** -- 检查当前会话中正在进行的视频任务状态，而不启动新的生成。
- **list** -- 显示可用的提供商、模型及其能力。

## 模型选择

生成视频时，OpenClaw 会按以下顺序解析模型：

1. **`model` 工具参数** -- 如果智能体在调用中指定了它。
2. **`videoGenerationModel.primary`** -- 来自配置。
3. **`videoGenerationModel.fallbacks`** -- 按顺序尝试。
4. **自动检测** -- 使用具有有效身份验证的提供商，从当前默认提供商开始，然后按字母顺序尝试其余提供商。

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

| 提供商 | 说明                                                                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | 使用 DashScope/Model Studio 异步端点。参考图像和视频必须是远程 `http(s)` URL。                                                                          |
| BytePlus | 仅支持单个图像参考。                                                                                                                                     |
| ComfyUI  | 由工作流驱动的本地或云端执行。通过已配置的图支持文生视频和图生视频。                                                                                    |
| fal      | 对长时间运行任务使用基于队列的流程。仅支持单个图像参考。                                                                                                |
| Google   | 使用 Gemini/Veo。支持一个图像或一个视频参考。                                                                                                           |
| MiniMax  | 仅支持单个图像参考。                                                                                                                                     |
| OpenAI   | 仅转发 `size` 覆盖。其他样式覆盖（`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略，并给出警告。                                           |
| Qwen     | 与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程 `http(s)` URL；本地文件会在前期直接被拒绝。                                                  |
| Runway   | 通过 data URI 支持本地文件。视频转视频需要 `runway/gen4_aleph`。纯文本运行公开 `16:9` 和 `9:16` 宽高比。                                              |
| Together | 仅支持单个图像参考。                                                                                                                                     |
| Vydra    | 直接使用 `https://www.vydra.ai/api/v1` 以避免身份验证在重定向中丢失。`veo3` 内置为仅文生视频；`kling` 需要远程图像 URL。                              |
| xAI      | 支持文生视频、图生视频以及远程视频编辑/扩展流程。                                                                                                       |

## 提供商能力模式

共享视频生成契约现在允许提供商声明特定于模式的能力，而不只是平铺的聚合限制。新的提供商实现应优先使用显式模式块：

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

像 `maxInputImages` 和 `maxInputVideos` 这样的平铺聚合字段，不足以声明转换模式支持。提供商应显式声明 `generate`、`imageToVideo` 和 `videoToVideo`，以便实时测试、契约测试和共享 `video_generate` 工具能够以确定方式验证模式支持。

## 实时测试

共享内置提供商的可选加入实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库包装命令：

```bash
pnpm test:live:media video
```

这个实时测试文件会从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用实时/环境 API 密钥，而不是已存储的认证配置文件，并运行它能够安全地通过本地媒体执行的声明模式：

- 对扫描中的每个提供商运行 `generate`
- 当 `capabilities.imageToVideo.enabled` 时运行 `imageToVideo`
- 当 `capabilities.videoToVideo.enabled` 且提供商/模型在共享扫描中接受基于缓冲区的本地视频输入时运行 `videoToVideo`

当前共享 `videoToVideo` 实时通道涵盖：

- `runway`，且仅当你选择 `runway/gen4_aleph` 时

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

或者通过 CLI：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 相关内容

- [工具概览](/zh-CN/tools)
- [后台任务](/zh-CN/automation/tasks) -- 用于异步视频生成的任务跟踪
- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [BytePlus](/zh-CN/concepts/model-providers#byteplus-international)
- [ComfyUI](/zh-CN/providers/comfy)
- [fal](/zh-CN/providers/fal)
- [Google (Gemini)](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [OpenAI](/zh-CN/providers/openai)
- [Qwen](/zh-CN/providers/qwen)
- [Runway](/zh-CN/providers/runway)
- [Together AI](/zh-CN/providers/together)
- [Vydra](/zh-CN/providers/vydra)
- [xAI](/zh-CN/providers/xai)
- [配置参考](/zh-CN/gateway/configuration-reference#agent-defaults)
- [模型](/zh-CN/concepts/models)
