---
read_when:
    - 你想在 OpenClaw 中使用 MiniMax 模型
    - 你需要 MiniMax 设置指南
summary: 在 OpenClaw 中使用 MiniMax 模型
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T09:40:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf6cfb68ef5fcaa360a2a7ebb9e3ce130100a59b014643091449a07654c7c6f
    source_path: providers/minimax.md
    workflow: 15
---

OpenClaw 的 MiniMax 提供商默认使用 **MiniMax M2.7**。

MiniMax 还提供：

- 通过 T2A v2 内置语音合成
- 通过 `MiniMax-VL-01` 内置图像理解
- 通过 `music-2.5+` 内置音乐生成
- 通过 MiniMax Coding Plan 搜索 API 内置 `web_search`

提供商拆分：

| Provider ID      | 认证方式 | 能力                                                           |
| ---------------- | -------- | -------------------------------------------------------------- |
| `minimax`        | API 密钥 | 文本、图像生成、图像理解、语音、网页搜索                       |
| `minimax-portal` | OAuth    | 文本、图像生成、图像理解、语音                                 |

## 内置目录

| 模型                     | 类型             | 说明                                     |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | 聊天（推理）     | 默认托管推理模型                         |
| `MiniMax-M2.7-highspeed` | 聊天（推理）     | 更快的 M2.7 推理层级                     |
| `MiniMax-VL-01`          | 视觉             | 图像理解模型                             |
| `image-01`               | 图像生成         | 文生图和图像到图像编辑                   |
| `music-2.5+`             | 音乐生成         | 默认音乐模型                             |
| `music-2.5`              | 音乐生成         | 上一代音乐生成层级                       |
| `music-2.0`              | 音乐生成         | 旧版音乐生成层级                         |
| `MiniMax-Hailuo-2.3`     | 视频生成         | 文生视频和图像参考流程                   |

## 入门指南

选择你偏好的认证方式，并按照设置步骤操作。

<Tabs>
  <Tab title="OAuth（Coding Plan）">
    **最适合：** 通过 OAuth 快速设置 MiniMax Coding Plan，无需 API 密钥。

    <Tabs>
      <Tab title="国际版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            这会对 `api.minimax.io` 进行认证。
          </Step>
          <Step title="验证模型可用">
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

            这会对 `api.minimaxi.com` 进行认证。
          </Step>
          <Step title="验证模型可用">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth 设置使用 `minimax-portal` 提供商 id。模型引用遵循 `minimax-portal/MiniMax-M2.7` 这种格式。
    </Note>

    <Tip>
    MiniMax Coding Plan 邀请链接（9 折优惠）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API 密钥">
    **最适合：** 使用兼容 Anthropic API 的托管 MiniMax。

    <Tabs>
      <Tab title="国际版">
        <Steps>
          <Step title="运行新手引导">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            这会将 `api.minimax.io` 配置为基础 URL。
          </Step>
          <Step title="验证模型可用">
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
          <Step title="验证模型可用">
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
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
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
    在兼容 Anthropic 的流式传输路径上，除非你显式自行设置 `thinking`，否则 OpenClaw 默认会禁用 MiniMax thinking。MiniMax 的流式端点会以 OpenAI 风格的 delta 分块而不是原生 Anthropic thinking 块发出 `reasoning_content`，如果在未显式配置的情况下保持启用，可能会将内部推理泄露到可见输出中。
    </Warning>

    <Note>
    API 密钥设置使用 `minimax` 提供商 id。模型引用遵循 `minimax/MiniMax-M2.7` 这种格式。
    </Note>

  </Tab>
</Tabs>

## 通过 `openclaw configure` 配置

使用交互式配置向导设置 MiniMax，而无需编辑 JSON：

<Steps>
  <Step title="启动向导">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="选择模型/认证">
    从菜单中选择 **模型/认证**。
  </Step>
  <Step title="选择一种 MiniMax 认证选项">
    选择以下可用的 MiniMax 选项之一：

    | 认证选项 | 说明 |
    | --- | --- |
    | `minimax-global-oauth` | 国际版 OAuth（Coding Plan） |
    | `minimax-cn-oauth` | 中国版 OAuth（Coding Plan） |
    | `minimax-global-api` | 国际版 API 密钥 |
    | `minimax-cn-api` | 中国版 API 密钥 |

  </Step>
  <Step title="选择你的默认模型">
    在出现提示时选择你的默认模型。
  </Step>
</Steps>

## 功能

### 图像生成

MiniMax 插件会为 `image_generate` 工具注册 `image-01` 模型。它支持：

- **文生图生成**，支持宽高比控制
- **图像到图像编辑**（主体参考），支持宽高比控制
- 每次请求最多 **9 张输出图像**
- 每次编辑请求最多 **1 张参考图像**
- 支持的宽高比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`

要将 MiniMax 用于图像生成，请将其设置为图像生成提供商：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

该插件使用与文本模型相同的 `MINIMAX_API_KEY` 或 OAuth 认证。如果 MiniMax 已经设置完成，则无需额外配置。

`minimax` 和 `minimax-portal` 都会使用相同的 `image-01` 模型注册 `image_generate`。
API 密钥设置使用 `MINIMAX_API_KEY`；OAuth 设置则可以改用内置的
`minimax-portal` 认证路径。

当新手引导或 API 密钥设置写入显式的 `models.providers.minimax`
条目时，OpenClaw 会将 `MiniMax-M2.7` 和
`MiniMax-M2.7-highspeed` 实体化为仅文本的聊天模型。图像理解则通过由插件拥有的 `MiniMax-VL-01` 媒体提供商单独提供。

<Note>
共享工具参数、提供商选择和故障切换行为请参阅 [图像生成](/zh-CN/tools/image-generation)。
</Note>

### 文本转语音

内置的 `minimax` 插件还会将 MiniMax T2A v2 注册为
`messages.tts` 的语音提供商。

- 默认 TTS 模型：`speech-2.8-hd`
- 默认音色：`English_expressive_narrator`
- 支持的内置模型 id 包括 `speech-2.8-hd`、`speech-2.8-turbo`、
  `speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、
  `speech-02-turbo`、`speech-01-hd` 和 `speech-01-turbo`。
- 认证解析顺序为 `messages.tts.providers.minimax.apiKey`，然后是
  `minimax-portal` OAuth/token 认证配置文件，再然后是 Token Plan 环境变量键
  （`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、
  `MINIMAX_CODING_API_KEY`），最后是 `MINIMAX_API_KEY`。
- 如果未配置 TTS 主机，OpenClaw 会复用已配置的
  `minimax-portal` OAuth 主机，并去掉兼容 Anthropic 的路径后缀，
  例如 `/anthropic`。
- 普通音频附件保持为 MP3。
- Feishu 和 Telegram 等语音便笺目标会通过 `ffmpeg` 从 MiniMax
  MP3 转码为 48 kHz Opus，因为 Feishu/Lark 文件 API 对原生音频消息只接受
  `file_type: "opus"`。
- MiniMax T2A 接受小数 `speed` 和 `vol`，但 `pitch` 会以整数发送；
  OpenClaw 会在发起 API 请求前截断带小数的 `pitch` 值。

| 设置                                     | 环境变量               | 默认值                        | 说明                         |
| ---------------------------------------- | ---------------------- | ----------------------------- | ---------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API 主机。       |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS 模型 id。                |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 用于语音输出的音色 id。      |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 播放速度，`0.5..2.0`。       |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量，`(0, 10]`。            |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数音高偏移，`-12..12`。    |

### 音乐生成

内置的 `minimax` 插件还会通过共享的
`music_generate` 工具注册音乐生成功能。

- 默认音乐模型：`minimax/music-2.5+`
- 还支持 `minimax/music-2.5` 和 `minimax/music-2.0`
- 提示词控制项：`lyrics`、`instrumental`、`durationSeconds`
- 输出格式：`mp3`
- 基于会话的运行会通过共享的任务/Status 流程分离执行，包括 `action: "status"`

要将 MiniMax 用作默认音乐提供商：

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
共享工具参数、提供商选择和故障切换行为请参阅 [音乐生成](/zh-CN/tools/music-generation)。
</Note>

### 视频生成

内置的 `minimax` 插件还会通过共享的
`video_generate` 工具注册视频生成功能。

- 默认视频模型：`minimax/MiniMax-Hailuo-2.3`
- 模式：文生视频和单图参考流程
- 支持 `aspectRatio` 和 `resolution`

要将 MiniMax 用作默认视频提供商：

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
共享工具参数、提供商选择和故障切换行为请参阅 [视频生成](/zh-CN/tools/video-generation)。
</Note>

### 图像理解

MiniMax 插件将图像理解与文本
目录分开注册：

| Provider ID      | 默认图像模型        |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

这就是为什么自动媒体路由即使在内置文本提供商目录仍显示仅文本的 M2.7 聊天引用时，
也可以使用 MiniMax 图像理解。

### 网页搜索

MiniMax 插件还会通过 MiniMax Coding Plan
搜索 API 注册 `web_search`。

- 提供商 id：`minimax`
- 结构化结果：标题、URL、摘要、相关查询
- 首选环境变量：`MINIMAX_CODE_PLAN_KEY`
- 可接受的环境变量别名：`MINIMAX_CODING_API_KEY`
- 兼容性回退：当 `MINIMAX_API_KEY` 已经指向 coding-plan token 时可使用它
- 区域复用：`plugins.entries.minimax.config.webSearch.region`，然后是 `MINIMAX_API_HOST`，再然后是 MiniMax 提供商基础 URL
- 搜索始终保留在提供商 id `minimax` 上；OAuth 中国版/国际版设置仍可通过 `models.providers.minimax-portal.baseUrl` 间接引导区域

配置位于 `plugins.entries.minimax.config.webSearch.*` 下。

<Note>
完整的网页搜索配置和用法请参阅 [MiniMax 搜索](/zh-CN/tools/minimax-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="配置选项">
    | 选项 | 说明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | 优先使用 `https://api.minimax.io/anthropic`（兼容 Anthropic）；`https://api.minimax.io/v1` 可选，用于兼容 OpenAI 的负载 |
    | `models.providers.minimax.api` | 优先使用 `anthropic-messages`；`openai-completions` 可选，用于兼容 OpenAI 的负载 |
    | `models.providers.minimax.apiKey` | MiniMax API 密钥（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | 定义 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` |
    | `agents.defaults.models` | 为你希望加入 allowlist 的模型设置别名 |
    | `models.mode` | 如果你想在内置模型之外添加 MiniMax，请保持为 `merge` |
  </Accordion>

  <Accordion title="thinking 默认值">
    在 `api: "anthropic-messages"` 上，除非参数/配置中已经显式设置了 thinking，否则 OpenClaw 会注入 `thinking: { type: "disabled" }`。

    这样可以防止 MiniMax 的流式端点以 OpenAI 风格的 delta 分块发出 `reasoning_content`，从而将内部推理泄露到可见输出中。

  </Accordion>

  <Accordion title="快速模式">
    `/fast on` 或 `params.fastMode: true` 会在兼容 Anthropic 的流式路径上，将 `MiniMax-M2.7` 改写为 `MiniMax-M2.7-highspeed`。
  </Accordion>

  <Accordion title="回退示例">
    **最适合：** 将你最强的最新一代模型保留为主模型，并在失败时回退到 MiniMax M2.7。下面的示例使用 Opus 作为具体的主模型；你可以替换为自己偏好的最新一代主模型。

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

  <Accordion title="Coding Plan 使用详情">
    - Coding Plan 用量 API：`https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（需要 coding plan key）。
    - OpenClaw 会将 MiniMax coding-plan 用量标准化为与其他提供商相同的“剩余百分比”显示。MiniMax 原始的 `usage_percent` / `usagePercent` 字段表示的是剩余额度，而不是已消耗额度，因此 OpenClaw 会对其进行反转。若存在按次数计数的字段，则优先使用这些字段。
    - 当 API 返回 `model_remains` 时，OpenClaw 会优先选择聊天模型条目，在需要时从 `start_time` / `end_time` 推导窗口标签，并将所选模型名称包含到套餐标签中，以便更容易区分 coding-plan 窗口。
    - 用量快照会将 `minimax`、`minimax-cn` 和 `minimax-portal` 视为同一个 MiniMax 配额面，并优先使用已存储的 MiniMax OAuth，再回退到 Coding Plan key 环境变量。
  </Accordion>
</AccordionGroup>

## 说明

- 模型引用遵循认证路径：
  - API 密钥设置：`minimax/<model>`
  - OAuth 设置：`minimax-portal/<model>`
- 默认聊天模型：`MiniMax-M2.7`
- 备用聊天模型：`MiniMax-M2.7-highspeed`
- 新手引导和直接 API 密钥设置会为两个 M2.7 变体写入仅文本的模型定义
- 图像理解使用由插件拥有的 `MiniMax-VL-01` 媒体提供商
- 如果你需要精确的成本跟踪，请更新 `models.json` 中的定价值
- 使用 `openclaw models list` 确认当前提供商 id，然后通过 `openclaw models set minimax/MiniMax-M2.7` 或 `openclaw models set minimax-portal/MiniMax-M2.7` 进行切换

<Tip>
MiniMax Coding Plan 邀请链接（9 折优惠）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
有关提供商规则，请参阅 [模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 故障排除

<AccordionGroup>
  <Accordion title='"未知模型：minimax/MiniMax-M2.7"'>
    这通常意味着**MiniMax 提供商未配置**（没有匹配的提供商条目，且也未找到 MiniMax 认证配置文件/环境变量键）。此检测的修复已包含在 **2026.1.12** 中。可通过以下方式修复：

    - 升级到 **2026.1.12**（或直接从源码 `main` 运行），然后重启 Gateway 网关。
    - 运行 `openclaw configure` 并选择一个 **MiniMax** 认证选项，或
    - 手动添加匹配的 `models.providers.minimax` 或 `models.providers.minimax-portal` 配置块，或
    - 设置 `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 MiniMax 认证配置文件，以便注入匹配的提供商。

    请确保模型 id **区分大小写**：

    - API 密钥路径：`minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 路径：`minimax-portal/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7-highspeed`

    然后使用以下命令重新检查：

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多帮助： [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
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
  <Card title="MiniMax 搜索" href="/zh-CN/tools/minimax-search" icon="magnifying-glass">
    通过 MiniMax Coding Plan 进行网页搜索配置。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排除和常见问题。
  </Card>
</CardGroup>
