---
read_when:
    - 你想在 OpenClaw 中使用 MiniMax 模型
    - 你需要 MiniMax 设置指南
summary: 在 OpenClaw 中使用 MiniMax 模型
title: MiniMax
x-i18n:
    generated_at: "2026-04-23T23:02:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

OpenClaw 的 MiniMax 提供商默认使用 **MiniMax M2.7**。

MiniMax 还提供：

- 通过 T2A v2 提供的内置语音合成
- 通过 `MiniMax-VL-01` 提供的内置图像理解
- 通过 `music-2.5+` 提供的内置音乐生成
- 通过 MiniMax Coding Plan 搜索 API 提供的内置 `web_search`

提供商拆分：

| 提供商 ID | 身份验证 | 能力 |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax` | API key | 文本、图像生成、图像理解、语音、web 搜索 |
| `minimax-portal` | OAuth | 文本、图像生成、图像理解 |

## 内置目录

| 模型 | 类型 | 描述 |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7` | Chat（推理） | 默认托管推理模型 |
| `MiniMax-M2.7-highspeed` | Chat（推理） | 更快的 M2.7 推理层级 |
| `MiniMax-VL-01` | Vision | 图像理解模型 |
| `image-01` | 图像生成 | 文本生成图像和图像到图像编辑 |
| `music-2.5+` | 音乐生成 | 默认音乐模型 |
| `music-2.5` | 音乐生成 | 上一代音乐生成层级 |
| `music-2.0` | 音乐生成 | 旧版音乐生成层级 |
| `MiniMax-Hailuo-2.3` | 视频生成 | 文本生成视频和图像参考流程 |

## 入门指南

选择你偏好的身份验证方式，并按照设置步骤操作。

<Tabs>
  <Tab title="OAuth（Coding Plan）">
    **最适合：** 通过 OAuth 使用 MiniMax Coding Plan 快速完成设置，无需 API 密钥。

    <Tabs>
      <Tab title="国际版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            这会针对 `api.minimax.io` 进行身份验证。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            这会针对 `api.minimaxi.com` 进行身份验证。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth 设置使用 `minimax-portal` 提供商 ID。模型引用格式为 `minimax-portal/MiniMax-M2.7`。
    </Note>

    <Tip>
    MiniMax Coding Plan 推荐链接（九折优惠）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **最适合：** 使用与 Anthropic 兼容 API 的托管 MiniMax。

    <Tabs>
      <Tab title="国际版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            这会将 `api.minimax.io` 配置为基础 URL。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            这会将 `api.minimaxi.com` 配置为基础 URL。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### 配置示例

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    在与 Anthropic 兼容的流式路径上，除非你显式自行设置 `thinking`，否则 OpenClaw 默认会禁用 MiniMax thinking。MiniMax 的流式端点会以 OpenAI 风格的 delta 分块而不是原生 Anthropic thinking block 输出 `reasoning_content`，如果默认隐式开启，可能会将内部推理泄露到可见输出中。
    </Warning>

    <Note>
    API key 设置使用 `minimax` 提供商 ID。模型引用格式为 `minimax/MiniMax-M2.7`。
    </Note>

  </Tab>
</Tabs>

## 通过 `openclaw configure` 进行配置

使用交互式配置向导设置 MiniMax，而无需手动编辑 JSON：

<Steps>
  <Step title="启动向导">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="选择模型/身份验证">
    从菜单中选择 **Model/auth**。
  </Step>
  <Step title="选择一个 MiniMax 身份验证选项">
    从可用的 MiniMax 选项中选择一个：

    | 身份验证选项 | 描述 |
    | --- | --- |
    | `minimax-global-oauth` | 国际版 OAuth（Coding Plan） |
    | `minimax-cn-oauth` | 中国版 OAuth（Coding Plan） |
    | `minimax-global-api` | 国际版 API key |
    | `minimax-cn-api` | 中国版 API key |

  </Step>
  <Step title="选择你的默认模型">
    在提示时选择你的默认模型。
  </Step>
</Steps>

## 能力

### 图像生成

MiniMax 插件会为 `image_generate` 工具注册 `image-01` 模型。它支持：

- **文本生成图像**，支持宽高比控制
- **图像到图像编辑**（主体参考），支持宽高比控制
- 每次请求最多输出 **9 张图像**
- 每次编辑请求最多支持 **1 张参考图像**
- 支持的宽高比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`

如需将 MiniMax 用于图像生成，请将其设置为图像生成提供商：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

该插件对文本模型使用相同的 `MINIMAX_API_KEY` 或 OAuth 身份验证。如果已经设置好 MiniMax，则无需额外配置。

`minimax` 和 `minimax-portal` 都会使用同一个
`image-01` 模型注册 `image_generate`。API key 设置使用 `MINIMAX_API_KEY`；OAuth 设置则可使用内置的 `minimax-portal` 身份验证路径。

当新手引导或 API key 设置写入显式的 `models.providers.minimax`
条目时，OpenClaw 会实例化 `MiniMax-M2.7` 和
`MiniMax-M2.7-highspeed`，并设置 `input: ["text", "image"]`。

内置的 MiniMax 文本目录本身在显式 provider 配置存在之前仍保持为仅文本元数据。
图像理解则通过插件自有的 `MiniMax-VL-01` 媒体提供商单独暴露。

<Note>
共享工具参数、提供商选择和故障转移行为请参阅 [Image Generation](/zh-CN/tools/image-generation)。
</Note>

### 音乐生成

内置 `minimax` 插件也会通过共享
`music_generate` 工具注册音乐生成。

- 默认音乐模型：`minimax/music-2.5+`
- 也支持 `minimax/music-2.5` 和 `minimax/music-2.0`
- 提示控制：`lyrics`、`instrumental`、`durationSeconds`
- 输出格式：`mp3`
- 基于会话的运行会通过共享任务/状态流进行分离，包括 `action: "status"`

如需将 MiniMax 设为默认音乐提供商：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
共享工具参数、提供商选择和故障转移行为请参阅 [Music Generation](/zh-CN/tools/music-generation)。
</Note>

### 视频生成

内置 `minimax` 插件也会通过共享
`video_generate` 工具注册视频生成。

- 默认视频模型：`minimax/MiniMax-Hailuo-2.3`
- 模式：文本生成视频和单图参考流程
- 支持 `aspectRatio` 和 `resolution`

如需将 MiniMax 设为默认视频提供商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
共享工具参数、提供商选择和故障转移行为请参阅 [Video Generation](/zh-CN/tools/video-generation)。
</Note>

### 图像理解

MiniMax 插件将图像理解与文本目录分开注册：

| 提供商 ID | 默认图像模型 |
| ---------------- | ------------------- |
| `minimax` | `MiniMax-VL-01` |
| `minimax-portal` | `MiniMax-VL-01` |

这就是为什么即使内置文本提供商目录仍显示为仅文本的 M2.7 chat 引用，自动媒体路由仍然可以使用 MiniMax 图像理解。

### Web 搜索

MiniMax 插件还会通过 MiniMax Coding Plan
搜索 API 注册 `web_search`。

- provider id：`minimax`
- 结构化结果：标题、URL、摘要、相关查询
- 首选环境变量：`MINIMAX_CODE_PLAN_KEY`
- 可接受的环境变量别名：`MINIMAX_CODING_API_KEY`
- 兼容性回退：当其已指向 coding-plan 令牌时使用 `MINIMAX_API_KEY`
- 区域复用：`plugins.entries.minimax.config.webSearch.region`，然后是 `MINIMAX_API_HOST`，再然后是 MiniMax provider base URL
- 搜索始终保持在 provider id `minimax`；OAuth 中国版/国际版设置仍然可以通过 `models.providers.minimax-portal.baseUrl` 间接引导区域

配置位于 `plugins.entries.minimax.config.webSearch.*` 下。

<Note>
完整 web 搜索配置和用法请参阅 [MiniMax Search](/zh-CN/tools/minimax-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="配置选项">
    | 选项 | 说明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | 优先使用 `https://api.minimax.io/anthropic`（兼容 Anthropic）；`https://api.minimax.io/v1` 可选，用于 OpenAI 兼容负载 |
    | `models.providers.minimax.api` | 优先使用 `anthropic-messages`；`openai-completions` 可选，用于 OpenAI 兼容负载 |
    | `models.providers.minimax.apiKey` | MiniMax API key（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | 定义 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` |
    | `agents.defaults.models` | 为你希望加入允许列表的模型设置别名 |
    | `models.mode` | 如果你想在内置模型之外添加 MiniMax，请保持为 `merge` |
  </Accordion>

  <Accordion title="thinking 默认值">
    在 `api: "anthropic-messages"` 上，除非参数/配置中已显式设置 thinking，否则 OpenClaw 会注入 `thinking: { type: "disabled" }`。

    这样可以防止 MiniMax 的流式端点以 OpenAI 风格 delta 分块输出 `reasoning_content`，从而避免内部推理泄露到可见输出中。

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` 或 `params.fastMode: true` 会在兼容 Anthropic 的流式路径上，将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
  </Accordion>

  <Accordion title="后备示例">
    **最适合：** 保持你最强的最新一代模型为主模型，并在失败时切换到 MiniMax M2.7。下面示例使用 Opus 作为具体主模型；你可以替换为自己偏好的最新一代主模型。

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan 用量详情">
    - Coding Plan 用量 API：`https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（需要 coding plan 密钥）。
    - OpenClaw 会将 MiniMax coding plan 用量标准化为与其他提供商相同的“剩余百分比”显示。MiniMax 原始的 `usage_percent` / `usagePercent` 字段表示的是剩余额度，而不是已消耗额度，因此 OpenClaw 会将其取反。有计数字段时优先使用计数字段。
    - 当 API 返回 `model_remains` 时，OpenClaw 会优先选择 chat 模型条目，并在需要时从 `start_time` / `end_time` 推导窗口标签，同时将选定的模型名称包含在计划标签中，以便更容易区分 coding-plan 窗口。
    - 用量快照会将 `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额界面，并优先使用已存储的 MiniMax OAuth，其次才回退到 Coding Plan 密钥环境变量。
  </Accordion>
</AccordionGroup>

## 说明

- 模型引用遵循身份验证路径：
  - API key 设置：`minimax/<model>`
  - OAuth 设置：`minimax-portal/<model>`
- 默认 chat 模型：`MiniMax-M2.7`
- 备选 chat 模型：`MiniMax-M2.7-highspeed`
- 新手引导和直接 API key 设置会为两个 M2.7 变体写入显式模型定义，并设置 `input: ["text", "image"]`
- 当前内置 provider 目录在存在显式 MiniMax provider 配置之前，会将 chat 引用显示为仅文本元数据
- 如果你需要精确的成本跟踪，请更新 `models.json` 中的价格值
- 使用 `openclaw models list` 确认当前 provider id，然后通过 `openclaw models set minimax/MiniMax-M2.7` 或 `openclaw models set minimax-portal/MiniMax-M2.7` 进行切换

<Tip>
MiniMax Coding Plan 推荐链接（九折优惠）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
提供商规则请参阅 [模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 故障排除

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    这通常意味着 **MiniMax 提供商尚未配置**（没有匹配的提供商条目，也没有找到 MiniMax auth profile/环境变量密钥）。该检测问题的修复已包含在 **2026.1.12** 中。可通过以下方式修复：

    - 升级到 **2026.1.12**（或从源码 `main` 运行），然后重启 Gateway 网关。
    - 运行 `openclaw configure` 并选择一个 **MiniMax** 身份验证选项，或
    - 手动添加匹配的 `models.providers.minimax` 或 `models.providers.minimax-portal` 块，或
    - 设置 `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 MiniMax auth profile，以便注入匹配的提供商。

    请确认模型 ID **区分大小写**：

    - API key 路径：`minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 路径：`minimax-portal/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7-highspeed`

    然后重新检查：

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    共享图像工具参数和提供商选择。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    共享音乐工具参数和提供商选择。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="MiniMax Search" href="/zh-CN/tools/minimax-search" icon="magnifying-glass">
    通过 MiniMax Coding Plan 进行 web 搜索配置。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    通用故障排除和常见问题。
  </Card>
</CardGroup>
