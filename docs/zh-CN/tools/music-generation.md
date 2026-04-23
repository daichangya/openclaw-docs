---
read_when:
    - 通过智能体生成音乐或音频
    - 配置音乐生成 providers 和模型
    - 理解 `music_generate` 工具参数
summary: |-
    使用共享 providers 生成音乐，包括基于工作流的插件＿日本assistant to=functions.read in commentary  彩神争霸大发快ीjson_object
    {"path":"/home/runner/work/docs/docs/source/AGENTS.md","offset":1,"limit":220}	RTLUanalysis to=functions.read  天天彩票网json_object  天天中彩票派奖  иахьassistant to=functions.read in commentary  大发极速json_object
    {"path":"/home/runner/work/docs/docs/source/docs/AGENTS.md","offset":1,"limit":220}
title: 音乐生成
x-i18n:
    generated_at: "2026-04-23T21:09:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b03922bf032586f649e677d1d8c08250b1fd5dc95f1cdde050a058562feb3da
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` 工具让智能体能够通过
共享音乐生成能力，配合已配置的 providers（如 Google、
MiniMax 以及基于工作流配置的 ComfyUI）来创建音乐或音频。

对于共享的、provider 支持的智能体会话，OpenClaw 会将音乐生成作为一个
后台任务启动，在任务账本中跟踪它，然后在曲目准备好之后再次唤醒智能体，以便智能体将完成的音频发回原始渠道。

<Note>
只有当至少有一个音乐生成 provider 可用时，内置共享工具才会出现。如果你在智能体工具中看不到 `music_generate`，请配置 `agents.defaults.musicGenerationModel` 或设置 provider API 密钥。
</Note>

## 快速开始

### 共享的 provider 支持生成

1. 至少为一个 provider 设置 API 密钥，例如 `GEMINI_API_KEY` 或
   `MINIMAX_API_KEY`。
2. 可选地设置你偏好的模型：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. 让智能体：“_生成一首关于夜晚驾驶穿越霓虹城市的欢快 synthpop 曲目。_”

智能体会自动调用 `music_generate`。无需加入工具允许列表。

对于没有会话支持智能体运行的直接同步上下文，内置
工具仍会回退为内联生成，并在工具结果中返回最终媒体路径。

示例提示：

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### 基于工作流的 Comfy 生成

内置的 `comfy` 插件会通过
音乐生成 provider 注册表接入共享的 `music_generate` 工具。

1. 配置 `models.providers.comfy.music`，并提供工作流 JSON 以及
   prompt/output 节点。
2. 如果你使用 Comfy Cloud，请设置 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
3. 让智能体生成音乐，或直接调用工具。

示例：

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## 共享内置 provider 支持

| Provider | 默认模型                 | 参考输入       | 支持的控制项                                           | API 密钥                                 |
| -------- | ------------------------ | -------------- | ------------------------------------------------------ | ---------------------------------------- |
| ComfyUI  | `workflow`               | 最多 1 张图像  | 由工作流定义的音乐或音频                               | `COMFY_API_KEY`、`COMFY_CLOUD_API_KEY`   |
| Google   | `lyria-3-clip-preview`   | 最多 10 张图像 | `lyrics`、`instrumental`、`format`                     | `GEMINI_API_KEY`、`GOOGLE_API_KEY`       |
| MiniMax  | `music-2.5+`             | 无             | `lyrics`、`instrumental`、`durationSeconds`、`format=mp3` | `MINIMAX_API_KEY`                     |

### 已声明能力矩阵

这是 `music_generate`、契约测试
和共享 live sweep 使用的显式模式契约。

| Provider | `generate` | `edit` | 编辑上限 | 共享 live lanes                                                         |
| -------- | ---------- | ------ | -------- | ----------------------------------------------------------------------- |
| ComfyUI  | 是         | 是     | 1 张图像 | 不在共享 sweep 中；由 `extensions/comfy/comfy.live.test.ts` 覆盖        |
| Google   | 是         | 是     | 10 张图像| `generate`、`edit`                                                      |
| MiniMax  | 是         | 否     | 无       | `generate`                                                              |

使用 `action: "list"` 可在运行时检查可用的共享 providers 和模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 可检查当前活跃的基于会话的音乐任务：

```text
/tool music_generate action=status
```

直接生成示例：

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 内置工具参数

| 参数               | 类型      | 说明                                                                                         |
| ------------------ | --------- | -------------------------------------------------------------------------------------------- |
| `prompt`           | string    | 音乐生成提示（`action: "generate"` 时必填）                                                  |
| `action`           | string    | `"generate"`（默认）、用于当前会话任务的 `"status"`，或用于查看 providers 的 `"list"`        |
| `model`            | string    | Provider/模型覆盖，例如 `google/lyria-3-pro-preview` 或 `comfy/workflow`                     |
| `lyrics`           | string    | 当 provider 支持显式歌词输入时可选的歌词                                                     |
| `instrumental`     | boolean   | 当 provider 支持时，请求纯伴奏输出                                                           |
| `image`            | string    | 单张参考图像路径或 URL                                                                       |
| `images`           | string[]  | 多张参考图像（最多 10 张）                                                                   |
| `durationSeconds`  | number    | 当 provider 支持时，目标时长（秒）提示                                                      |
| `format`           | string    | 当 provider 支持时，输出格式提示（`mp3` 或 `wav`）                                           |
| `filename`         | string    | 输出文件名提示                                                                               |

并非所有 providers 都支持所有参数。OpenClaw 仍会在提交前验证
诸如输入数量这类硬限制。当 provider 支持时长，但其最大值
低于请求值时，OpenClaw 会自动将时长压缩到最接近的受支持值。真正不受支持的可选提示
在所选 provider 或模型无法满足时，会被忽略并附带警告。

工具结果会报告实际应用的设置。当 OpenClaw 在 provider 回退期间压缩时长时，返回的 `durationSeconds` 会反映实际提交值，而 `details.normalization.durationSeconds` 会显示从请求值到应用值的映射。

## 共享 provider 支持路径的异步行为

- 基于会话的智能体运行：`music_generate` 会创建一个后台任务，立即返回一个 started/task 响应，并在稍后通过后续智能体消息发布完成曲目。
- 防重复：当该后台任务仍处于 `queued` 或 `running` 状态时，同一会话中的后续 `music_generate` 调用会返回任务状态，而不是再次启动新的生成。
- 状态查询：使用 `action: "status"` 可在不启动新生成的情况下检查当前活跃的基于会话的音乐任务。
- 任务跟踪：使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 检查该生成任务的排队、运行和终态状态。
- 完成唤醒：OpenClaw 会向同一会话注入一个内部完成事件，这样模型就可以自己编写面向用户的后续回复。
- 提示提示：当音乐任务已在飞行中时，同一会话中的后续用户/手动轮次会收到一个小型运行时提示，这样模型就不会盲目再次调用 `music_generate`。
- 无会话回退：没有真实智能体会话的直接/本地上下文仍会以内联方式运行，并在同一轮中返回最终音频结果。

### 任务生命周期

每个 `music_generate` 请求都会经历四种状态：

1. **queued** —— 任务已创建，等待 provider 接受。
2. **running** —— provider 正在处理（通常 30 秒到 3 分钟，取决于 provider 和时长）。
3. **succeeded** —— 曲目已准备好；智能体会被唤醒并将其发布到对话中。
4. **failed** —— provider 错误或超时；智能体会带着错误详情被唤醒。

通过 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

防重复：如果当前会话已有音乐任务处于 `queued` 或 `running`，`music_generate` 会返回现有任务状态，而不是启动新任务。使用 `action: "status"` 可显式检查状态，而不会触发新生成。

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Provider 选择顺序

生成音乐时，OpenClaw 会按以下顺序尝试 providers：

1. 工具调用中的 `model` 参数（如果智能体显式指定）
2. 配置中的 `musicGenerationModel.primary`
3. 按顺序尝试 `musicGenerationModel.fallbacks`
4. 仅使用基于认证的 provider 默认值进行自动检测：
   - 当前默认 provider 优先
   - 其余已注册音乐生成 providers 按 provider-id 顺序排列

如果某个 provider 失败，会自动尝试下一个候选项。如果全部失败，
错误中会包含每次尝试的详细信息。

如果你希望
音乐生成仅使用显式 `model`、`primary` 和 `fallbacks`
条目，请设置 `agents.defaults.mediaGenerationAutoProviderFallback: false`。

## Provider 说明

- Google 使用 Lyria 3 批量生成。当前内置流程支持
  prompt、可选歌词文本，以及可选参考图像。
- MiniMax 使用批量 `music_generation` 端点。当前内置流程
  支持 prompt、可选歌词、纯伴奏模式、时长引导，以及
  mp3 输出。
- ComfyUI 支持基于工作流驱动，具体取决于配置的图结构以及
  prompt/output 字段的节点映射。

## Provider 能力模式

共享音乐生成契约现在支持显式模式声明：

- `generate` 用于仅提示的生成
- `edit` 用于请求中包含一张或多张参考图像时

新的 provider 实现应优先使用显式模式块：

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

旧版扁平字段，例如 `maxInputImages`、`supportsLyrics` 和
`supportsFormat`，不足以声明编辑支持。Providers 应当
显式声明 `generate` 和 `edit`，这样 live tests、契约测试以及
共享 `music_generate` 工具才能以确定性方式验证模式支持。

## 如何选择正确路径

- 当你需要模型选择、provider 故障转移以及内置异步任务/状态流时，请使用共享 provider 支持路径。
- 当你需要自定义工作流图，或使用不属于共享内置音乐能力的 provider 时，请使用插件路径，例如 ComfyUI。
- 如果你在调试 ComfyUI 专用行为，请参阅 [ComfyUI](/zh-CN/providers/comfy)。如果你在调试共享 provider 行为，请从 [Google（Gemini）](/zh-CN/providers/google) 或 [MiniMax](/zh-CN/providers/minimax) 开始。

## 实时测试

共享内置 providers 的选择加入 live 覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

仓库封装命令：

```bash
pnpm test:live:media music
```

该 live 文件会从 `~/.profile` 加载缺失的 provider 环境变量，
默认优先使用 live/env API 密钥，而不是已存储 auth profiles，并会在 provider 启用编辑模式时同时运行
`generate` 和已声明的 `edit` 覆盖。

当前这意味着：

- `google`：`generate` + `edit`
- `minimax`：仅 `generate`
- `comfy`：单独的 Comfy live 覆盖，不在共享 provider sweep 中

内置 ComfyUI 音乐路径的选择加入 live 覆盖：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy live 文件在配置了相关部分时，也会覆盖 comfy 图像和视频工作流。

## 相关内容

- [后台任务](/zh-CN/automation/tasks) - 用于分离式 `music_generate` 运行的任务跟踪
- [配置参考](/zh-CN/gateway/configuration-reference#agent-defaults) - `musicGenerationModel` 配置
- [ComfyUI](/zh-CN/providers/comfy)
- [Google（Gemini）](/zh-CN/providers/google)
- [MiniMax](/zh-CN/providers/minimax)
- [模型](/zh-CN/concepts/models) - 模型配置与故障转移
- [工具概览](/zh-CN/tools)
