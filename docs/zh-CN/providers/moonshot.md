---
read_when:
    - 你想要配置 Moonshot K2（Moonshot 开放平台）与 Kimi Coding。
    - 你需要了解分别独立的端点、密钥和模型引用。
    - 你想要适用于任一提供商的可复制粘贴配置。
summary: 配置 Moonshot K2 与 Kimi Coding（分别使用不同的提供商和密钥）
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-21T02:04:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b7044b2e680ac235a2d60fde6491582d09c3dfdd6a78109ae085932eb97b54d
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI（Kimi）

Moonshot 提供带有 OpenAI 兼容端点的 Kimi API。配置该提供商，并将默认模型设置为 `moonshot/kimi-k2.6`，或者使用 `kimi/kimi-code` 来配置 Kimi Coding。

<Warning>
Moonshot 和 Kimi Coding 是**不同的提供商**。密钥不能互换，端点不同，模型引用也不同（`moonshot/...` 与 `kimi/...`）。
</Warning>

## 内置模型目录

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | 名称                   | 推理 | 输入        | 上下文 | 最大输出 |
| --------------------------------- | ---------------------- | ---- | ----------- | ------ | -------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 否   | text, image | 262,144 | 262,144  |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 否   | text, image | 262,144 | 262,144  |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 是   | text        | 262,144 | 262,144  |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 是   | text        | 262,144 | 262,144  |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 否   | text        | 256,000 | 16,384   |

[//]: # "moonshot-kimi-k2-ids:end"

当前由 Moonshot 托管的 K2 模型，其内置成本估算使用 Moonshot 公布的按量计费价格：Kimi K2.6 的缓存命中为 $0.16/MTok，输入为 $0.95/MTok，输出为 $4.00/MTok；Kimi K2.5 的缓存命中为 $0.10/MTok，输入为 $0.60/MTok，输出为 $3.00/MTok。其他旧版目录条目会继续保留零成本占位值，除非你在配置中覆盖它们。

## 入门指南

选择你的提供商，并按照设置步骤操作。

<Tabs>
  <Tab title="Moonshot API">
    **最适合：** 通过 Moonshot 开放平台使用 Kimi K2 模型。

    <Steps>
      <Step title="选择你的端点区域">
        | 认证选项              | 端点                           | 区域 |
        | --------------------- | ------------------------------ | ---- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`   | 国际 |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`   | 中国 |
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        或者，针对中国端点：

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **最适合：** 通过 Kimi Coding 端点处理以代码为重点的任务。

    <Note>
    Kimi Coding 使用与 Moonshot 不同的 API 密钥和提供商前缀（`kimi/...` 而不是 `moonshot/...`）。旧版模型引用 `kimi/k2p5` 仍然作为兼容 id 被接受。
    </Note>

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi Web 搜索

OpenClaw 还内置了作为 `web_search` 提供商的 **Kimi**，由 Moonshot Web 搜索提供支持。

<Steps>
  <Step title="运行交互式 Web 搜索设置">
    ```bash
    openclaw configure --section web
    ```

    在 Web 搜索部分选择 **Kimi**，以存储
    `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="配置 Web 搜索区域和模型">
    交互式设置会提示你输入：

    | 设置             | 选项                                                                 |
    | ---------------- | -------------------------------------------------------------------- |
    | API 区域         | `https://api.moonshot.ai/v1`（国际）或 `https://api.moonshot.cn/v1`（中国） |
    | Web 搜索模型     | 默认为 `kimi-k2.6`                                                   |

  </Step>
</Steps>

配置位于 `plugins.entries.moonshot.config.webSearch` 下：

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // 或使用 KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## 高级

<AccordionGroup>
  <Accordion title="原生思考模式">
    Moonshot Kimi 支持二元原生思考模式：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    通过 `agents.defaults.models.<provider/model>.params` 按模型配置：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw 还会为 Moonshot 映射运行时 `/think` 级别：

    | `/think` 级别     | Moonshot 行为              |
    | ----------------- | -------------------------- |
    | `/think off`      | `thinking.type=disabled`   |
    | 任何非 off 级别   | `thinking.type=enabled`    |

    <Warning>
    当 Moonshot 思考模式启用时，`tool_choice` 必须是 `auto` 或 `none`。OpenClaw 会将不兼容的 `tool_choice` 值规范化为 `auto` 以保持兼容性。
    </Warning>

    Kimi K2.6 还接受一个可选的 `thinking.keep` 字段，用于控制 `reasoning_content` 在多轮对话中的保留方式。将其设置为 `"all"` 可在多轮间保留完整推理；省略它（或保留为 `null`）则使用服务器默认策略。OpenClaw 仅会为 `moonshot/kimi-k2.6` 转发 `thinking.keep`，并会从其他模型中移除该字段。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式 usage 兼容性">
    原生 Moonshot 端点（`https://api.moonshot.ai/v1` 和 `https://api.moonshot.cn/v1`）在共享的 `openai-completions` 传输协议上声明支持流式 usage 兼容性。OpenClaw 根据端点能力判断这一点，因此指向相同原生 Moonshot 主机的兼容自定义提供商 id 也会继承相同的流式 usage 行为。
  </Accordion>

  <Accordion title="端点与模型引用参考">
    | 提供商      | 模型引用前缀    | 端点                         | 认证环境变量        |
    | ----------- | --------------- | ---------------------------- | ------------------- |
    | Moonshot    | `moonshot/`     | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`  |
    | Moonshot CN | `moonshot/`     | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`  |
    | Kimi Coding | `kimi/`         | Kimi Coding 端点             | `KIMI_API_KEY`      |
    | Web 搜索    | N/A             | 与 Moonshot API 区域相同     | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |

    - Kimi Web 搜索使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，默认使用 `https://api.moonshot.ai/v1` 和模型 `kimi-k2.6`。
    - 如有需要，可在 `models.providers` 中覆盖价格和上下文元数据。
    - 如果 Moonshot 为某个模型发布了不同的上下文限制，请相应调整 `contextWindow`。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="Web 搜索" href="/tools/web-search" icon="magnifying-glass">
    配置包括 Kimi 在内的 Web 搜索提供商。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    提供商、模型和插件的完整配置模式。
  </Card>
  <Card title="Moonshot 开放平台" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API 密钥管理和文档。
  </Card>
</CardGroup>
