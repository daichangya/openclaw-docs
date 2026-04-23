---
read_when:
    - 通过智能体生成视频
    - 配置视频生成 provider 和模型 +#+#+#+#+#+analysis to=functions.read 早点加盟_input={"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-qa-testing/SKILL.md"} code
    - 了解 `video_generate` 工具参数
summary: 使用 14 个 provider 后端，通过文本、图像或现有视频生成视频
title: 视频生成
x-i18n:
    generated_at: "2026-04-23T21:10:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67b3b0c669489dca7c0903dbd2ddd7b0f3438a3a722c5cb2b78850ecd1906866
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw 智能体可以根据文本提示词、参考图像或现有视频生成视频。当前支持 14 个 provider 后端，每个后端都有不同的模型选项、输入模式和功能集。智能体会根据你的配置和可用的 API key 自动选择合适的 provider。

<Note>
`video_generate` 工具只有在至少有一个视频生成 provider 可用时才会出现。如果你在智能体工具中看不到它，请设置 provider API key，或配置 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 将视频生成视为三种运行时模式：

- `generate`：用于不带参考媒体的文生视频请求
- `imageToVideo`：当请求中包含一个或多个参考图像时使用
- `videoToVideo`：当请求中包含一个或多个参考视频时使用

Providers 可以支持这些模式中的任意子集。工具会在提交前校验当前模式，并在 `action=list` 中报告支持的模式。

## 快速开始

1. 为任意支持的 provider 设置 API key：

```bash
export GEMINI_API_KEY="your-key"
```

2. 可选地固定一个默认模型：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 向智能体发出请求：

> Generate a 5-second cinematic video of a friendly lobster surfing at sunset.

智能体会自动调用 `video_generate`。不需要工具 allowlist。

## 生成视频时会发生什么

视频生成是异步的。当智能体在会话中调用 `video_generate` 时：

1. OpenClaw 将请求提交给 provider，并立即返回一个任务 ID。
2. Provider 在后台处理该作业（通常需要 30 秒到 5 分钟，具体取决于 provider 和分辨率）。
3. 当视频准备就绪后，OpenClaw 会通过一个内部完成事件唤醒同一会话。
4. 智能体会将完成的视频发回原始对话中。

当某个作业正在进行时，同一会话中的重复 `video_generate` 调用会返回当前任务状态，而不是启动新的生成任务。你可以使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 在 CLI 中查看进度。

在没有会话支持的智能体运行场景之外（例如直接工具调用），该工具会回退为内联生成，并在同一轮中返回最终媒体路径。

### 任务生命周期

每个 `video_generate` 请求会经历四个状态：

1. **queued** —— 任务已创建，等待 provider 接收。
2. **running** —— provider 正在处理（通常需要 30 秒到 5 分钟，具体取决于 provider 和分辨率）。
3. **succeeded** —— 视频已准备就绪；智能体被唤醒并将其发布回对话。
4. **failed** —— provider 错误或超时；智能体被唤醒并附带错误详情。

从 CLI 查看状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

防止重复：如果当前会话中已有一个 `queued` 或 `running` 状态的视频任务，`video_generate` 会返回现有任务状态，而不是启动新任务。若要显式检查状态而不触发新生成，请使用 `action: "status"`。

## 支持的 providers

| Provider | 默认模型 | 文本 | 图像参考 | 视频参考 | API key |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba | `wan2.6-t2v` | 是 | 是（远程 URL） | 是（远程 URL） | `MODELSTUDIO_API_KEY` |
| BytePlus 1.0 | `seedance-1-0-pro-250528` | 是 | 最多 2 张图（仅 I2V 模型；首帧 + 末帧） | 否 | `BYTEPLUS_API_KEY` |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215` | 是 | 最多 2 张图（通过角色指定首帧 + 末帧） | 否 | `BYTEPLUS_API_KEY` |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` | 是 | 最多 9 张参考图 | 最多 3 个视频 | `BYTEPLUS_API_KEY` |
| ComfyUI | `workflow` | 是 | 1 张图 | 否 | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal | `fal-ai/minimax/video-01-live` | 是 | 1 张图 | 否 | `FAL_KEY` |
| Google | `veo-3.1-fast-generate-preview` | 是 | 1 张图 | 1 个视频 | `GEMINI_API_KEY` |
| MiniMax | `MiniMax-Hailuo-2.3` | 是 | 1 张图 | 否 | `MINIMAX_API_KEY` |
| OpenAI | `sora-2` | 是 | 1 张图 | 1 个视频 | `OPENAI_API_KEY` |
| Qwen | `wan2.6-t2v` | 是 | 是（远程 URL） | 是（远程 URL） | `QWEN_API_KEY` |
| Runway | `gen4.5` | 是 | 1 张图 | 1 个视频 | `RUNWAYML_API_SECRET` |
| Together | `Wan-AI/Wan2.2-T2V-A14B` | 是 | 1 张图 | 否 | `TOGETHER_API_KEY` |
| Vydra | `veo3` | 是 | 1 张图（`kling`） | 否 | `VYDRA_API_KEY` |
| xAI | `grok-imagine-video` | 是 | 1 张图 | 1 个视频 | `XAI_API_KEY` |

某些 provider 接受额外或替代的 API key 环境变量。详情请参阅各个[provider 页面](#related)。

运行 `video_generate action=list` 可在运行时查看可用的 provider、模型和运行时模式。

### 声明式能力矩阵

这是 `video_generate`、契约测试和共享实时 sweep 所使用的显式模式契约。

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 当前共享实时 lanes |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba | 是 | 是 | 是 | `generate`、`imageToVideo`；`videoToVideo` 被跳过，因为该 provider 需要远程 `http(s)` 视频 URL |
| BytePlus | 是 | 是 | 否 | `generate`、`imageToVideo` |
| ComfyUI | 是 | 是 | 否 | 不在共享 sweep 中；工作流专用覆盖位于 Comfy 测试中 |
| fal | 是 | 是 | 否 | `generate`、`imageToVideo` |
| Google | 是 | 是 | 是 | `generate`、`imageToVideo`；共享 `videoToVideo` 被跳过，因为当前基于缓冲区的 Gemini/Veo sweep 不接受该输入 |
| MiniMax | 是 | 是 | 否 | `generate`、`imageToVideo` |
| OpenAI | 是 | 是 | 是 | `generate`、`imageToVideo`；共享 `videoToVideo` 被跳过，因为当前该组织/输入路径需要 provider 侧的 inpaint/remix 访问 |
| Qwen | 是 | 是 | 是 | `generate`、`imageToVideo`；`videoToVideo` 被跳过，因为该 provider 需要远程 `http(s)` 视频 URL |
| Runway | 是 | 是 | 是 | `generate`、`imageToVideo`；只有当所选模型为 `runway/gen4_aleph` 时才运行 `videoToVideo` |
| Together | 是 | 是 | 否 | `generate`、`imageToVideo` |
| Vydra | 是 | 是 | 否 | `generate`；共享 `imageToVideo` 被跳过，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL |
| xAI | 是 | 是 | 是 | `generate`、`imageToVideo`；`videoToVideo` 被跳过，因为该 provider 当前需要远程 MP4 URL |

## 工具参数

### 必填

| 参数 | 类型 | 描述 |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt` | string | 要生成的视频文本描述（`action: "generate"` 时必填） |

### 内容输入

| 参数 | 类型 | 描述 |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image` | string | 单个参考图像（路径或 URL） |
| `images` | string[] | 多个参考图像（最多 9 张） |
| `imageRoles` | string[] | 与合并后的图像列表一一对应的可选位置角色提示。规范值：`first_frame`、`last_frame`、`reference_image` |
| `video` | string | 单个参考视频（路径或 URL） |
| `videos` | string[] | 多个参考视频（最多 4 个） |
| `videoRoles` | string[] | 与合并后的视频列表一一对应的可选位置角色提示。规范值：`reference_video` |
| `audioRef` | string | 单个参考音频（路径或 URL）。当 provider 支持音频输入时，可用于背景音乐或语音参考等 |
| `audioRefs` | string[] | 多个参考音频（最多 3 个） |
| `audioRoles` | string[] | 与合并后的音频列表一一对应的可选位置角色提示。规范值：`reference_audio` |

角色提示会按原样转发给 provider。规范值来自
`VideoGenerationAssetRole` 联合类型，但 providers 也可能接受额外的
角色字符串。`*Roles` 数组的条目数不能超过对应参考列表；
一旦出现 off-by-one 错误，就会返回清晰错误。
使用空字符串可使某个槽位保持未设置。

### 风格控制

| 参数 | 类型 | 描述 |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio` | string | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` 或 `adaptive` |
| `resolution` | string | `480P`、`720P`、`768P` 或 `1080P` |
| `durationSeconds` | number | 目标时长（秒），会四舍五入到最接近的 provider 支持值 |
| `size` | string | 当 provider 支持时使用的尺寸提示 |
| `audio` | boolean | 当支持时，在输出中启用生成音频。它与 `audioRef*`（输入）不同 |
| `watermark` | boolean | 当支持时，切换 provider 的水印功能 |

`adaptive` 是一个 provider 专用哨兵值：对于在其能力中声明了
`adaptive` 的 provider，会原样转发该值（例如 BytePlus
Seedance 使用它根据输入图像尺寸自动检测比例）。未声明该值的
provider 会通过工具结果中的 `details.ignoredOverrides` 报告该值，
从而让该忽略行为可见。

### 高级

| 参数 | 类型 | 描述 |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action` | string | `"generate"`（默认）、`"status"` 或 `"list"` |
| `model` | string | provider/模型覆盖值（例如 `runway/gen4.5`） |
| `filename` | string | 输出文件名提示 |
| `providerOptions` | object | 作为 JSON 对象传递的 provider 专用选项（例如 `{"seed": 42, "draft": true}`）。如果 provider 声明了类型化 schema，则会校验键和值类型；未知键或不匹配项会导致该候选项在回退时被跳过。未声明 schema 的 provider 会按原样接收这些选项。运行 `video_generate action=list` 可查看每个 provider 接受哪些选项 |

并非所有 provider 都支持所有参数。OpenClaw 已经会将时长规范化到最接近的 provider 支持值；同时，当某个回退 provider 暴露不同的控制界面时，它还会重新映射诸如 size 到 aspect-ratio 之类的几何提示。真正不支持的覆盖项会尽最大努力被忽略，并在工具结果中以警告方式报告。硬性能力限制（例如参考输入过多）会在提交前直接失败。

工具结果会报告实际应用的设置。当 OpenClaw 在 provider 回退期间重新映射时长或几何参数时，返回的 `durationSeconds`、`size`、`aspectRatio` 和 `resolution` 值会反映实际提交的内容，而 `details.normalization` 则会记录从请求值到应用值的转换。

参考输入也会选择运行时模式：

- 无参考媒体：`generate`
- 任意图像参考：`imageToVideo`
- 任意视频参考：`videoToVideo`
- 参考音频输入不会改变解析后的模式；它们会叠加在图像/视频参考所选的模式之上，并且仅对声明了 `maxInputAudios` 的 provider 生效

图像和视频参考混用并不是稳定的共享能力界面。
每次请求最好只使用一种参考类型。

#### 回退与类型化选项

某些能力检查是在回退层而不是工具边界上应用的，这样即使请求超出了主 provider 的限制，也仍有机会在一个有能力的回退 provider 上运行：

- 如果当前候选项未声明 `maxInputAudios`（或声明为
  `0`），那么当请求中包含音频参考时，它会被跳过，并尝试下一个候选项。
- 如果当前候选项的 `maxDurationSeconds` 小于请求的
  `durationSeconds`，并且候选项未声明
  `supportedDurationSeconds` 列表，则该候选项会被跳过。
- 如果请求中包含 `providerOptions`，而当前候选项
  显式声明了一个类型化 `providerOptions` schema，则当提供的键不在 schema 中，或值类型不匹配时，该候选项会被跳过。尚未声明 schema 的 provider 会按原样接收这些选项（向后兼容透传）。provider 还可以通过声明一个空 schema
  （`capabilities.providerOptions: {}`）来显式拒绝所有 provider 选项，这种情况会产生与类型不匹配相同的跳过结果。

请求中的第一个跳过原因会以 `warn` 级别写入日志，以便运维人员看到
其主 provider 被跳过；后续跳过则以 `debug` 级别记录，以保持长回退链安静。如果所有候选项都被跳过，聚合错误会包含每个候选项的跳过原因。

## 动作

- **generate**（默认）—— 根据给定提示词和可选参考输入创建视频。
- **status** —— 检查当前会话中正在进行的视频任务状态，而不启动新的生成。
- **list** —— 显示可用的 providers、模型及其能力。

## 模型选择

生成视频时，OpenClaw 会按以下顺序解析模型：

1. **`model` 工具参数** —— 如果智能体在调用中显式指定了它。
2. **`videoGenerationModel.primary`** —— 来自配置。
3. **`videoGenerationModel.fallbacks`** —— 按顺序尝试。
4. **自动检测** —— 使用那些具有有效认证的 providers，先从当前默认 provider 开始，然后按字母顺序尝试剩余 providers。

如果某个 provider 失败，会自动尝试下一个候选项。如果所有候选项都失败，错误中会包含每次尝试的详细信息。

如果你希望视频生成仅使用显式的 `model`、`primary` 和 `fallbacks`
条目，请设置 `agents.defaults.mediaGenerationAutoProviderFallback: false`。

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

## Provider 说明

| Provider | 说明 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba | 使用 DashScope/Model Studio 异步端点。参考图像和视频必须是远程 `http(s)` URL。 |
| BytePlus 1.0 | Provider id 为 `byteplus`。模型包括：`seedance-1-0-pro-250528`（默认）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。T2V 模型（`*-t2v-*`）不接受图像输入；I2V 模型和通用 `*-pro-*` 模型支持单张参考图像（首帧）。你可以按位置传入图像，或设置 `role: "first_frame"`。当提供了图像时，T2V 模型 ID 会自动切换到对应的 I2V 变体。支持的 `providerOptions` 键：`seed`（number）、`draft`（boolean，会强制 480p）、`camera_fixed`（boolean）。 |
| BytePlus Seedance 1.5 | 需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) 插件。Provider id 为 `byteplus-seedance15`。模型：`seedance-1-5-pro-251215`。使用统一的 `content[]` API。最多支持 2 张输入图像（first_frame + last_frame）。所有输入都必须是远程 `https://` URL。请在每张图像上设置 `role: "first_frame"` / `"last_frame"`，或按位置传入图像。`aspectRatio: "adaptive"` 会根据输入图像自动检测比例。`audio: true` 会映射到 `generate_audio`。`providerOptions.seed`（number）会被转发。 |
| BytePlus Seedance 2.0 | 需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) 插件。Provider id 为 `byteplus-seedance2`。模型：`dreamina-seedance-2-0-260128`、`dreamina-seedance-2-0-fast-260128`。使用统一的 `content[]` API。最多支持 9 张参考图像、3 个参考视频和 3 个参考音频。所有输入都必须是远程 `https://` URL。请为每个资源设置 `role` —— 支持值包括：`"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"`。`aspectRatio: "adaptive"` 会根据输入图像自动检测比例。`audio: true` 会映射到 `generate_audio`。`providerOptions.seed`（number）会被转发。 |
| ComfyUI | 由工作流驱动的本地或云执行。通过已配置图形支持文生视频和图生视频。 |
| fal | 对长时间运行作业使用基于队列的流程。仅支持单张图像参考。 |
| Google | 使用 Gemini/Veo。支持一张图像或一个视频参考。 |
| MiniMax | 仅支持单张图像参考。 |
| OpenAI | 仅会转发 `size` 覆盖值。其他风格覆盖值（`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略，并附带警告。 |
| Qwen | 与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程 `http(s)` URL；本地文件会被提前拒绝。 |
| Runway | 支持通过 data URI 使用本地文件。视频转视频需要 `runway/gen4_aleph`。纯文本运行支持 `16:9` 和 `9:16` 宽高比。 |
| Together | 仅支持单张图像参考。 |
| Vydra | 直接使用 `https://www.vydra.ai/api/v1`，以避免认证被重定向丢失。内置 `veo3` 仅支持文生视频；`kling` 需要远程图像 URL。 |
| xAI | 支持文生视频、图生视频，以及远程视频编辑/扩展流程。 |

## Provider 能力模式

共享视频生成契约现在允许 provider 声明按模式区分的
能力，而不仅仅是扁平的聚合限制。新的 provider
实现应优先使用显式模式块：

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

像 `maxInputImages` 和 `maxInputVideos` 这样的扁平聚合字段，并不足以声明变换模式支持。Providers 应显式声明
`generate`、`imageToVideo` 和 `videoToVideo`，这样实时测试、
契约测试以及共享的 `video_generate` 工具才能确定性地校验模式支持。

## 实时测试

对共享内置 provider 的按需实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库包装器：

```bash
pnpm test:live:media video
```

该实时测试文件会从 `~/.profile` 中加载缺失的 provider 环境变量，默认优先使用
实时/环境变量 API key，而不是已存储的认证配置档案，并默认运行一个适合发布的 smoke 测试：

- 对 sweep 中每个非 FAL provider 执行 `generate`
- 使用一秒钟的 lobster 提示词
- 每个 provider 的操作上限由 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 控制
  （默认 `180000`）

由于 provider 侧队列延迟可能主导发布时间，FAL 为按需启用：

```bash
pnpm test:live:media video --video-providers fal
```

设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 还会运行共享 sweep 能够通过本地媒体安全执行的已声明变换模式：

- 当 `capabilities.imageToVideo.enabled` 时运行 `imageToVideo`
- 当 `capabilities.videoToVideo.enabled` 且该 provider/模型
  在共享 sweep 中接受基于 buffer 的本地视频输入时运行 `videoToVideo`

当前共享的 `videoToVideo` 实时 lane 覆盖：

- 仅当你选择 `runway/gen4_aleph` 时覆盖 `runway`

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
- [后台任务](/zh-CN/automation/tasks) —— 异步视频生成的任务跟踪
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
