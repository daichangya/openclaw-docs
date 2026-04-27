---
read_when:
    - 你希望在 OpenClaw 中使用 Qwen
    - 你之前使用过 Qwen OAuth
summary: 通过 OpenClaw 内置的 qwen provider 使用 Qwen Cloud
title: Qwen
x-i18n:
    generated_at: "2026-04-23T21:02:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth 已被移除。** 使用 `portal.qwen.ai` 端点的免费层 OAuth 集成
（`qwen-portal`）现已不可用。背景信息请参见
[Issue #49557](https://github.com/openclaw/openclaw/issues/49557)。

</Warning>

OpenClaw 现在将 Qwen 视为一个一级内置 provider，其规范 id
为 `qwen`。该内置 provider 面向 Qwen Cloud / Alibaba DashScope 以及
Coding Plan 端点，并保留旧版 `modelstudio` id 作为兼容别名。

- Provider：`qwen`
- 首选环境变量：`QWEN_API_KEY`
- 为兼容性也接受：`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`
- API 风格：OpenAI 兼容

<Tip>
如果你想使用 `qwen3.6-plus`，优先选择**标准版（按量计费）**端点。
Coding Plan 支持可能会落后于公开目录。
</Tip>

## 快速开始

选择你的套餐类型，并按步骤进行设置。

<Tabs>
  <Tab title="Coding Plan（订阅）">
    **最适合：** 通过 Qwen Coding Plan 获取基于订阅的访问。

    <Steps>
      <Step title="获取 API key">
        在 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制一个 API key。
      </Step>
      <Step title="运行新手引导">
        对于**全球**端点：

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        对于**中国**端点：

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    旧版 `modelstudio-*` auth-choice id 和 `modelstudio/...` 模型引用仍然
    作为兼容别名可用，但新的设置流程应优先使用规范的
    `qwen-*` auth-choice id 和 `qwen/...` 模型引用。
    </Note>

  </Tab>

  <Tab title="标准版（按量计费）">
    **最适合：** 通过标准版 Model Studio 端点获取按量计费访问，包括像 `qwen3.6-plus` 这样在 Coding Plan 中可能不可用的模型。

    <Steps>
      <Step title="获取 API key">
        在 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制一个 API key。
      </Step>
      <Step title="运行新手引导">
        对于**全球**端点：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        对于**中国**端点：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    旧版 `modelstudio-*` auth-choice id 和 `modelstudio/...` 模型引用仍然
    作为兼容别名可用，但新的设置流程应优先使用规范的
    `qwen-*` auth-choice id 和 `qwen/...` 模型引用。
    </Note>

  </Tab>
</Tabs>

## 套餐类型与端点

| 套餐 | 区域 | Auth choice | 端点 |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| 标准版（按量计费） | 中国 | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1` |
| 标准版（按量计费） | 全球 | `qwen-standard-api-key` | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan（订阅） | 中国 | `qwen-api-key-cn` | `coding.dashscope.aliyuncs.com/v1` |
| Coding Plan（订阅） | 全球 | `qwen-api-key` | `coding-intl.dashscope.aliyuncs.com/v1` |

provider 会根据你的 auth choice 自动选择端点。规范
choice 使用 `qwen-*` 家族；`modelstudio-*` 仅保留兼容用途。
你也可以在配置中通过自定义 `baseUrl` 进行覆盖。

<Tip>
**管理 keys：** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**文档：** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 内置目录

OpenClaw 当前内置了以下 Qwen 目录。配置后的目录具有
端点感知能力：Coding Plan 配置会省略那些只确认可在
标准版端点上运行的模型。

| 模型引用 | 输入 | 上下文 | 说明 |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus` | text, image | 1,000,000 | 默认模型 |
| `qwen/qwen3.6-plus` | text, image | 1,000,000 | 需要该模型时优先使用标准版端点 |
| `qwen/qwen3-max-2026-01-23` | text | 262,144 | Qwen Max 系列 |
| `qwen/qwen3-coder-next` | text | 262,144 | 编码 |
| `qwen/qwen3-coder-plus` | text | 1,000,000 | 编码 |
| `qwen/MiniMax-M2.5` | text | 1,000,000 | 启用推理 |
| `qwen/glm-5` | text | 202,752 | GLM |
| `qwen/glm-4.7` | text | 202,752 | GLM |
| `qwen/kimi-k2.5` | text, image | 262,144 | 通过 Alibaba 提供的 Moonshot AI |

<Note>
即使某个模型出现在内置目录中，其可用性仍可能因端点和计费套餐不同而有所差异。
</Note>

## 多模态附加能力

`qwen` 插件还在**标准版**
DashScope 端点上暴露多模态能力（而不是 Coding Plan 端点）：

- **视频理解**：通过 `qwen-vl-max-latest`
- **Wan 视频生成**：通过 `wan2.6-t2v`（默认）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v`

如需将 Qwen 设为默认视频 provider：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
共享工具参数、provider 选择和故障转移行为请参见 [视频生成](/zh-CN/tools/video-generation)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="图像与视频理解">
    内置 Qwen 插件会在**标准版**
    DashScope 端点上（而不是 Coding Plan 端点）注册图像和视频媒体理解能力。

    | 属性 | 值 |
    | ------------- | --------------------- |
    | 模型 | `qwen-vl-max-latest` |
    | 支持的输入 | 图像、视频 |

    媒体理解会根据配置好的 Qwen 认证自动解析——
    不需要额外配置。请确保你使用的是标准版（按量计费）
    端点，以获得媒体理解支持。

  </Accordion>

  <Accordion title="Qwen 3.6 Plus 可用性">
    `qwen3.6-plus` 在标准版（按量计费）Model Studio
    端点上可用：

    - 中国：`dashscope.aliyuncs.com/compatible-mode/v1`
    - 全球：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    如果 Coding Plan 端点对
    `qwen3.6-plus` 返回 “unsupported model” 错误，请切换到标准版（按量计费），而不是继续使用 Coding Plan
    端点/key 组合。

  </Accordion>

  <Accordion title="能力规划">
    `qwen` 插件正在被定位为完整 Qwen
    Cloud 表面的厂商归属地，而不仅仅是编码/文本模型。

    - **文本/聊天模型：** 现已内置
    - **工具调用、结构化输出、thinking：** 继承自 OpenAI 兼容传输
    - **图像生成：** 计划在 provider 插件层实现
    - **图像/视频理解：** 现已在标准版端点内置
    - **语音/音频：** 计划在 provider 插件层实现
    - **Memory 嵌入/重排序：** 计划通过嵌入适配器表面实现
    - **视频生成：** 现已通过共享视频生成能力内置

  </Accordion>

  <Accordion title="视频生成细节">
    对于视频生成，OpenClaw 会在提交任务前，将配置的 Qwen 区域映射到对应的
    DashScope AIGC 主机：

    - 全球/国际：`https://dashscope-intl.aliyuncs.com`
    - 中国：`https://dashscope.aliyuncs.com`

    这意味着，一个普通的 `models.providers.qwen.baseUrl`，无论指向
    Coding Plan 还是标准版 Qwen 主机，仍然会让视频生成走向正确的
    区域 DashScope 视频端点。

    当前内置 Qwen 视频生成限制：

    - 每次请求最多 **1** 个输出视频
    - 最多 **1** 张输入图像
    - 最多 **4** 个输入视频
    - 最长 **10 秒** 时长
    - 支持 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark`
    - 当前参考图像/视频模式要求使用**远程 http(s) URL**。本地
      文件路径会被直接拒绝，因为 DashScope 视频端点不
      接受这些参考内容的本地缓冲区上传。

  </Accordion>

  <Accordion title="流式使用量兼容性">
    原生 Model Studio 端点会在共享的
    `openai-completions` 传输上声明流式使用量兼容性。OpenClaw 现在按端点
    能力来判断这一点，因此，指向相同原生主机的 DashScope 兼容自定义 provider id
    会继承同样的流式使用量行为，而不再
    要求必须使用内置的 `qwen` provider id。

    原生流式使用量兼容性同时适用于 Coding Plan 主机和
    标准版 DashScope 兼容主机：

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="多模态端点区域">
    多模态表面（视频理解和 Wan 视频生成）使用的是
    **标准版** DashScope 端点，而不是 Coding Plan 端点：

    - 全球/国际标准版 Base URL：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - 中国标准版 Base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="环境与 daemon 设置">
    如果 Gateway 网关作为 daemon 运行（launchd/systemd），请确保 `QWEN_API_KEY`
    对该进程可见（例如放在 `~/.openclaw/.env` 中，或通过
    `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 providers、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数与 provider 选择。
  </Card>
  <Card title="Alibaba（ModelStudio）" href="/zh-CN/providers/alibaba" icon="cloud">
    旧版 ModelStudio provider 与迁移说明。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排除与常见问题。
  </Card>
</CardGroup>
