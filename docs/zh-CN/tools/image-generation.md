---
read_when:
    - 通过智能体生成图像
    - 配置图像生成提供商和模型
    - 了解 `image_generate` 工具参数
summary: 使用已配置的提供商生成和编辑图像（OpenAI、OpenAI Codex OAuth、Google Gemini、fal、MiniMax、ComfyUI、Vydra、xAI）
title: 图像生成
x-i18n:
    generated_at: "2026-04-23T23:04:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 820829a009d48ccb23fbd9ee256bae27f6d7d9539fd75c2b0a7cef4b91c5c873
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` 工具允许智能体使用你已配置的提供商来生成和编辑图像。生成的图像会自动作为媒体附件附加在智能体的回复中。

<Note>
只有当至少有一个图像生成提供商可用时，该工具才会出现。如果你在智能体工具中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel`、设置提供商 API 密钥，或使用 OpenAI Codex OAuth 登录。
</Note>

## 快速开始

1. 为至少一个提供商设置 API 密钥（例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`），或使用 OpenAI Codex OAuth 登录。
2. 可选：设置你偏好的模型：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth 使用相同的 `openai/gpt-image-2` 模型引用。当
配置了 `openai-codex` OAuth 配置文件时，OpenClaw 会通过该 OAuth 配置文件路由图像请求，而不是优先尝试 `OPENAI_API_KEY`。
如果显式配置了自定义 `models.providers.openai` 图像设置，例如 API 密钥或
自定义 / Azure base URL，则会重新切换回直接 OpenAI Images API 路径。

3. 让智能体执行：_“生成一个友好的机器人吉祥物图像。”_

智能体会自动调用 `image_generate`。不需要工具允许列表——当提供商可用时它默认启用。

## 支持的提供商

| 提供商 | 默认模型                    | 编辑支持                       | Auth                                                  |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | 是（最多 4 张图像）               | `OPENAI_API_KEY` 或 OpenAI Codex OAuth                |
| Google   | `gemini-3.1-flash-image-preview` | 是                                | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | 是                                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | 是（主体参考）            | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |
| ComfyUI  | `workflow`                       | 是（1 张图像，由工作流配置） | `COMFY_API_KEY` 或云端环境下的 `COMFY_CLOUD_API_KEY`    |
| Vydra    | `grok-imagine`                   | 否                                 | `VYDRA_API_KEY`                                       |
| xAI      | `grok-imagine-image`             | 是（最多 5 张图像）               | `XAI_API_KEY`                                         |

使用 `action: "list"` 可在运行时检查可用的提供商和模型：

```
/tool image_generate action=list
```

## 工具参数

<ParamField path="prompt" type="string" required>
图像生成提示词。对于 `action: "generate"` 为必填项。
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
使用 `"list"` 在运行时检查可用的提供商和模型。
</ParamField>

<ParamField path="model" type="string">
提供商 / 模型覆盖，例如 `openai/gpt-image-2`。
</ParamField>

<ParamField path="image" type="string">
用于编辑模式的单个参考图像路径或 URL。
</ParamField>

<ParamField path="images" type="string[]">
用于编辑模式的多个参考图像（最多 5 个）。
</ParamField>

<ParamField path="size" type="string">
尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>

<ParamField path="aspectRatio" type="string">
宽高比：`1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
分辨率提示。
</ParamField>

<ParamField path="count" type="number">
要生成的图像数量（1–4）。
</ParamField>

<ParamField path="filename" type="string">
输出文件名提示。
</ParamField>

并非所有提供商都支持所有参数。当某个回退提供商支持接近的几何选项，但不支持你精确请求的值时，OpenClaw 会在提交前重映射到最接近的受支持尺寸、宽高比或分辨率。真正不受支持的覆盖项仍会在工具结果中报告。

工具结果会报告实际应用的设置。当 OpenClaw 在提供商回退期间重映射几何参数时，返回的 `size`、`aspectRatio` 和 `resolution` 值会反映实际发送的内容，而 `details.normalization` 会记录从请求值到应用值的转换。

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### 提供商选择顺序

生成图像时，OpenClaw 会按以下顺序尝试提供商：

1. 工具调用中的 **`model` 参数**（如果智能体指定了它）
2. 配置中的 **`imageGenerationModel.primary`**
3. 按顺序尝试 **`imageGenerationModel.fallbacks`**
4. **自动检测**——仅使用带 auth 支持的提供商默认值：
   - 先尝试当前默认提供商
   - 然后按提供商 ID 顺序尝试其余已注册图像生成提供商

如果某个提供商失败（auth 错误、速率限制等），系统会自动尝试下一个候选项。如果全部失败，错误信息中会包含每次尝试的详细信息。

说明：

- 自动检测具备 auth 感知能力。只有当 OpenClaw 实际可以对某个提供商进行身份验证时，该提供商默认值才会进入候选列表。
- 默认启用自动检测。如果你希望图像生成只使用显式的 `model`、`primary` 和 `fallbacks` 条目，请设置
  `agents.defaults.mediaGenerationAutoProviderFallback: false`。
- 使用 `action: "list"` 可以检查当前已注册的提供商、它们的默认模型以及 auth 环境变量提示。

### 图像编辑

OpenAI、Google、fal、MiniMax、ComfyUI 和 xAI 支持编辑参考图像。传入参考图像路径或 URL：

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、Google 和 xAI 通过 `images` 参数最多支持 5 张参考图像。fal、MiniMax 和 ComfyUI 支持 1 张。

### OpenAI `gpt-image-2`

OpenAI 图像生成默认使用 `openai/gpt-image-2`。如果配置了
`openai-codex` OAuth 配置文件，OpenClaw 会复用与 Codex 订阅聊天模型相同的 OAuth 配置文件，并通过 Codex Responses 后端发送图像请求；它不会为该请求静默回退到 `OPENAI_API_KEY`。
如需强制使用直接 OpenAI Images API 路由，请显式配置
`models.providers.openai`，并设置 API 密钥、自定义 base URL
或 Azure 端点。较旧的
`openai/gpt-image-1` 模型仍可显式选择，但新的 OpenAI 图像生成和图像编辑请求应使用 `gpt-image-2`。

`gpt-image-2` 通过同一个 `image_generate` 工具同时支持文生图生成和参考图像编辑。OpenClaw 会将 `prompt`、
`count`、`size` 和参考图像转发给 OpenAI。OpenAI 不会直接接收
`aspectRatio` 或 `resolution`；在可能的情况下，OpenClaw 会将它们映射为受支持的 `size`，否则工具会将它们报告为被忽略的覆盖项。

生成一张 4K 横版图像：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

生成两张方形图像：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

编辑一张本地参考图像：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

使用多个参考图像进行编辑：

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

如需通过 Azure OpenAI 部署而不是 `api.openai.com` 路由 OpenAI 图像生成，
请参阅 OpenAI 提供商文档中的 [Azure OpenAI 端点](/zh-CN/providers/openai#azure-openai-endpoints)。

MiniMax 图像生成可通过两条内置 MiniMax auth 路径使用：

- `minimax/image-01`：用于 API 密钥设置
- `minimax-portal/image-01`：用于 OAuth 设置

## 提供商能力

| 能力            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 生成              | 是（最多 4 张）        | 是（最多 4 张）        | 是（最多 4 张）       | 是（最多 9 张）              | 是（由工作流定义输出）     | 是（1 张） | 是（最多 4 张）        |
| 编辑 / 参考        | 是（最多 5 张图像） | 是（最多 5 张图像） | 是（1 张图像）       | 是（1 张图像，主体参考） | 是（1 张图像，由工作流配置） | 否      | 是（最多 5 张图像） |
| 尺寸控制          | 是（最高 4K）       | 是                  | 是                 | 否                         | 否                                 | 否      | 否                   |
| 宽高比          | 否                   | 是                  | 是（仅生成） | 是                        | 否                                 | 否      | 是                  |
| 分辨率（1K / 2K / 4K） | 否                   | 是                  | 是                 | 否                         | 否                                 | 否      | 是（1K / 2K）          |

### xAI `grok-imagine-image`

内置的 xAI 提供商对纯提示词请求使用 `/v1/images/generations`，
而当存在 `image` 或 `images` 时使用 `/v1/images/edits`。

- 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
- 数量：最多 4 张
- 参考图像：一个 `image` 或最多五个 `images`
- 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
- 分辨率：`1K`、`2K`
- 输出：作为 OpenClaw 管理的图像附件返回

OpenClaw 有意不暴露 xAI 原生的 `quality`、`mask`、`user` 或
其他仅限原生的额外宽高比，直到这些控制项出现在共享的跨提供商 `image_generate` 契约中。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [fal](/zh-CN/providers/fal) — fal 图像与视频提供商设置
- [ComfyUI](/zh-CN/providers/comfy) — 本地 ComfyUI 和 Comfy Cloud 工作流设置
- [Google（Gemini）](/zh-CN/providers/google) — Gemini 图像提供商设置
- [MiniMax](/zh-CN/providers/minimax) — MiniMax 图像提供商设置
- [OpenAI](/zh-CN/providers/openai) — OpenAI Images 提供商设置
- [Vydra](/zh-CN/providers/vydra) — Vydra 图像、视频和语音设置
- [xAI](/zh-CN/providers/xai) — Grok 图像、视频、搜索、代码执行和 TTS 设置
- [配置参考](/zh-CN/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` 配置
- [模型](/zh-CN/concepts/models) — 模型配置与回退
