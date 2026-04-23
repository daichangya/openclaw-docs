---
read_when:
    - 你想在 OpenClaw 中使用本地 ComfyUI 工作流
    - 你想通过 Comfy Cloud 使用图像、视频或音乐工作流
    - 你需要内置 comfy 插件的配置键＠恐縮ですნიერassistant to=functions.read commentary  ирызjson 751  content omitted due to length?
summary: 在 OpenClaw 中设置 ComfyUI 工作流的图像、视频与音乐生成
title: ComfyUI
x-i18n:
    generated_at: "2026-04-23T20:59:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d254334c4430bd01ef51fa231ccfbbb4ca18108806b9155c3f0a5d35d4422fd7
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw 内置了一个 `comfy` 插件，用于运行基于工作流的 ComfyUI。该插件完全由工作流驱动，因此 OpenClaw 不会尝试把通用的 `size`、`aspectRatio`、`resolution`、`durationSeconds` 或类似 TTS 的控制项映射到你的图上。

| 属性 | 详情 |
| --------------- | -------------------------------------------------------------------------------- |
| 提供商 | `comfy` |
| 模型 | `comfy/workflow` |
| 共享表面 | `image_generate`、`video_generate`、`music_generate` |
| 认证 | 本地 ComfyUI 无需认证；Comfy Cloud 使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| API | ComfyUI `/prompt` / `/history` / `/view` 和 Comfy Cloud `/api/*` |

## 支持内容

- 通过工作流 JSON 进行图像生成
- 使用 1 张上传参考图像进行图像编辑
- 通过工作流 JSON 进行视频生成
- 使用 1 张上传参考图像进行视频生成
- 通过共享 `music_generate` 工具进行音乐或音频生成
- 从已配置节点或所有匹配的输出节点下载输出

## 快速开始

你可以选择在自己的机器上运行 ComfyUI，或使用 Comfy Cloud。

<Tabs>
  <Tab title="本地">
    **最适合：** 在你的机器或局域网上运行自己的 ComfyUI 实例。

    <Steps>
      <Step title="在本地启动 ComfyUI">
        确保你的本地 ComfyUI 实例正在运行（默认地址为 `http://127.0.0.1:8188`）。
      </Step>
      <Step title="准备你的工作流 JSON">
        导出或创建一个 ComfyUI 工作流 JSON 文件。记下提示输入节点和你希望 OpenClaw 读取输出的节点的 node ID。
      </Step>
      <Step title="配置提供商">
        将 `mode` 设为 `"local"`，并指向你的工作流文件。下面是一个最小图像示例：

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="设置默认模型">
        将 OpenClaw 指向你所配置能力使用的 `comfy/workflow` 模型：

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="验证">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **最适合：** 在无需管理本地 GPU 资源的情况下，在 Comfy Cloud 上运行工作流。

    <Steps>
      <Step title="获取 API key">
        在 [comfy.org](https://comfy.org) 注册，并从你的账户仪表板生成一个 API key。
      </Step>
      <Step title="设置 API key">
        通过以下任一方式提供你的 key：

        ```bash
        # 环境变量（推荐）
        export COMFY_API_KEY="your-key"

        # 备选环境变量
        export COMFY_CLOUD_API_KEY="your-key"

        # 或直接内联写入配置
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="准备你的工作流 JSON">
        导出或创建一个 ComfyUI 工作流 JSON 文件。记下提示输入节点和输出节点的 node ID。
      </Step>
      <Step title="配置提供商">
        将 `mode` 设为 `"cloud"`，并指向你的工作流文件：

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        Cloud 模式默认将 `baseUrl` 设为 `https://cloud.comfy.org`。只有在你使用自定义云端端点时，才需要设置 `baseUrl`。
        </Tip>
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="验证">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置

Comfy 支持共享的顶层连接设置，以及按能力划分的工作流配置段（`image`、`video`、`music`）：

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### 共享键

| 键 | 类型 | 描述 |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode` | `"local"` 或 `"cloud"` | 连接模式。 |
| `baseUrl` | string | 本地模式默认为 `http://127.0.0.1:8188`，cloud 模式默认为 `https://cloud.comfy.org`。 |
| `apiKey` | string | 可选的内联 key，可替代 `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` 环境变量。 |
| `allowPrivateNetwork` | boolean | 在 cloud 模式下允许私有/LAN `baseUrl`。 |

### 按能力配置的键

这些键适用于 `image`、`video` 或 `music` 段内部：

| 键 | 必填 | 默认值 | 描述 |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` 或 `workflowPath` | 是 | -- | ComfyUI 工作流 JSON 文件的路径。 |
| `promptNodeId` | 是 | -- | 接收文本提示的节点 ID。 |
| `promptInputName` | 否 | `"text"` | 提示节点上的输入名称。 |
| `outputNodeId` | 否 | -- | 用于读取输出的节点 ID。如果省略，则会使用所有匹配的输出节点。 |
| `pollIntervalMs` | 否 | -- | 轮询作业完成状态的间隔时间，单位为毫秒。 |
| `timeoutMs` | 否 | -- | 工作流运行超时时间，单位为毫秒。 |

`image` 和 `video` 段还支持：

| 键 | 必填 | 默认值 | 描述 |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId` | 是（传入参考图像时） | -- | 接收上传参考图像的节点 ID。 |
| `inputImageInputName` | 否 | `"image"` | 图像节点上的输入名称。 |

## 工作流细节

<AccordionGroup>
  <Accordion title="图像工作流">
    将默认图像模型设为 `comfy/workflow`：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **参考图像编辑示例：**

    若要启用使用上传参考图像进行图像编辑，请在图像配置中添加 `inputImageNodeId`：

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="视频工作流">
    将默认视频模型设为 `comfy/workflow`：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy 视频工作流通过已配置图形支持文生视频和图生视频。

    <Note>
    OpenClaw 不会将输入视频传递给 Comfy 工作流。输入仅支持文本提示和单张参考图像。
    </Note>

  </Accordion>

  <Accordion title="音乐工作流">
    该内置插件会为由工作流定义的音频或音乐输出注册一个音乐生成提供商，并通过共享的 `music_generate` 工具暴露出来：

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    使用 `music` 配置段来指向你的音频工作流 JSON 和输出节点。

  </Accordion>

  <Accordion title="向后兼容">
    现有的顶层图像配置（不带嵌套 `image` 段）仍然可用：

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw 会将这种 legacy 结构视为图像工作流配置。你无需立即迁移，但对于新设置，仍推荐使用嵌套的 `image` / `video` / `music` 段。

    <Tip>
    如果你只使用图像生成，则 legacy 扁平配置与新的嵌套 `image` 段在功能上是等价的。
    </Tip>

  </Accordion>

  <Accordion title="实时测试">
    该内置插件提供了选择启用的实时覆盖测试：

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    如果未配置对应的 Comfy 工作流段，则实时测试会跳过单独的图像、视频或音乐用例。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Image Generation" href="/zh-CN/tools/image-generation" icon="image">
    图像生成工具的配置与用法。
  </Card>
  <Card title="Video Generation" href="/zh-CN/tools/video-generation" icon="video">
    视频生成工具的配置与用法。
  </Card>
  <Card title="Music Generation" href="/zh-CN/tools/music-generation" icon="music">
    音乐与音频生成工具设置。
  </Card>
  <Card title="Provider Directory" href="/zh-CN/providers/index" icon="layers">
    所有提供商和模型引用的概览。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference#agent-defaults" icon="gear">
    包括智能体默认值在内的完整配置参考。
  </Card>
</CardGroup>
