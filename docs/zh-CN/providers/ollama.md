---
read_when:
    - 你想通过 Ollama 使用云端或本地模型来运行 OpenClaw
    - 你需要 Ollama 的设置与配置指南
    - 你想使用 Ollama 视觉模型进行图像理解
summary: 将 OpenClaw 与 Ollama 一起运行（云端和本地模型）
title: Ollama】【：】【“】【analysis to=final code  omitted
x-i18n:
    generated_at: "2026-04-23T21:01:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw 通过 Ollama 的原生 API（`/api/chat`）集成 Ollama，可用于托管云模型和本地/自托管 Ollama 服务器。你可以通过三种模式使用 Ollama：通过可达的 Ollama 主机使用 `Cloud + Local`、对接 `https://ollama.com` 的 `Cloud only`，或对接可达 Ollama 主机的 `Local only`。

<Warning>
**远程 Ollama 用户：** 不要在 OpenClaw 中使用 `/v1` 的 OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，并且模型可能会将原始工具 JSON 作为纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不要加 `/v1`）。
</Warning>

## 入门指南

选择你偏好的设置方式和模式。

<Tabs>
  <Tab title="新手引导（推荐）">
    **最适合：** 最快完成可用的 Ollama 云端或本地设置。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        ```

        从提供商列表中选择 **Ollama**。
      </Step>
      <Step title="选择你的模式">
        - **Cloud + Local** —— 本地 Ollama 主机，外加通过该主机路由的云模型
        - **Cloud only** —— 通过 `https://ollama.com` 使用托管 Ollama 模型
        - **Local only** —— 仅使用本地模型
      </Step>
      <Step title="选择模型">
        `Cloud only` 会提示输入 `OLLAMA_API_KEY`，并推荐托管云默认模型。`Cloud + Local` 和 `Local only` 会要求输入 Ollama base URL，发现可用模型，并在所选本地模型尚不可用时自动拉取。`Cloud + Local` 还会检查该 Ollama 主机是否已登录以访问云功能。
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非交互式模式

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    可选地指定自定义 base URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手动设置">
    **最适合：** 完全控制云端或本地设置。

    <Steps>
      <Step title="选择云端或本地">
        - **Cloud + Local**：安装 Ollama，使用 `ollama signin` 登录，并通过该主机路由云请求
        - **Cloud only**：使用 `https://ollama.com` 和 `OLLAMA_API_KEY`
        - **Local only**：从 [ollama.com/download](https://ollama.com/download) 安装 Ollama
      </Step>
      <Step title="拉取本地模型（仅本地）">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="为 OpenClaw 启用 Ollama">
        对于 `Cloud only`，请使用你真实的 `OLLAMA_API_KEY`。对于基于主机的设置，任意占位值都可以：

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="检查并设置你的模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或在配置中设置默认值：

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 云模型

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` 将一个可达的 Ollama 主机作为本地和云模型的控制点。这是 Ollama 偏好的混合工作流。

    在设置期间使用 **Cloud + Local**。OpenClaw 会提示输入 Ollama base URL，从该主机发现本地模型，并检查该主机是否已通过 `ollama signin` 登录以访问云功能。主机登录后，OpenClaw 还会推荐托管云默认模型，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主机尚未登录，OpenClaw 会保持为仅本地设置，直到你运行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 对接的是 Ollama 的托管 API：`https://ollama.com`。

    在设置期间使用 **Cloud only**。OpenClaw 会提示输入 `OLLAMA_API_KEY`，设置 `baseUrl: "https://ollama.com"`，并初始化托管云模型列表。此路径**不需要**本地 Ollama 服务器，也不需要 `ollama signin`。

    `openclaw onboard` 中显示的云模型列表会通过 `https://ollama.com/api/tags` 实时填充，最多 500 个条目，因此模型选择器反映的是当前托管目录，而不是静态预设。如果设置时 `ollama.com` 不可达或未返回模型，OpenClaw 会回退到之前的硬编码建议，以确保新手引导仍可完成。

  </Tab>

  <Tab title="Local only">
    在仅本地模式下，OpenClaw 会从已配置的 Ollama 实例中发现模型。该路径适用于本地或自托管 Ollama 服务器。

    OpenClaw 当前推荐 `gemma4` 作为本地默认值。

  </Tab>
</Tabs>

## 模型发现（隐式提供商）

当你设置了 `OLLAMA_API_KEY`（或 auth profile），并且**没有**定义 `models.providers.ollama` 时，OpenClaw 会从 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型。

| 行为 | 详情 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询 | 查询 `/api/tags` |
| 能力检测 | 使用尽力而为的 `/api/show` 查找来读取 `contextWindow` 并检测能力（包括视觉） |
| 视觉模型 | `/api/show` 报告具有 `vision` 能力的模型会被标记为支持图像（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示词 |
| 推理检测 | 使用模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning` |
| Token 限制 | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 token 上限 |
| 成本 | 所有成本设置为 `0` |

这样可以避免手动定义模型条目，同时让目录与本地 Ollama 实例保持一致。

```bash
# See what models are available
ollama list
openclaw models list
```

若要添加新模型，只需使用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型会被自动发现并可立即使用。

<Note>
如果你显式设置了 `models.providers.ollama`，则会跳过自动发现，你必须手动定义模型。详见下面的显式配置部分。
</Note>

## 视觉与图像描述

内置的 Ollama 插件会将 Ollama 注册为支持图像的媒体理解提供商。这使 OpenClaw 能够将显式图像描述请求以及已配置的默认图像模型路由到本地或托管的 Ollama 视觉模型。

对于本地视觉，请拉取一个支持图像的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

然后使用 infer CLI 验证：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必须是完整的 `<provider/model>` 引用。设置后，`openclaw infer image describe` 会直接运行该模型，而不会因为该模型支持原生视觉就跳过描述。

若要将 Ollama 设为入站媒体的默认图像理解模型，请配置 `agents.defaults.imageModel`：

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

如果你手动定义了 `models.providers.ollama.models`，请将视觉模型标记为支持图像输入：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 会拒绝那些未被标记为支持图像能力的模型的图像描述请求。在隐式发现模式下，当 `/api/show` 报告视觉能力时，OpenClaw 会从 Ollama 中读取这项信息。

## 配置

<Tabs>
  <Tab title="基础（隐式发现）">
    最简单的仅本地启用路径是通过环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果设置了 `OLLAMA_API_KEY`，则可以在提供商条目中省略 `apiKey`，OpenClaw 会在可用性检查时自动填充它。
    </Tip>

  </Tab>

  <Tab title="显式（手动模型）">
    当你希望使用托管云设置、Ollama 运行在其他主机/端口、你想强制指定特定上下文窗口或模型列表，或者你想完全手动定义模型时，请使用显式配置。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="自定义 base URL">
    如果 Ollama 运行在不同主机或端口上（显式配置会禁用自动发现，因此请手动定义模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
          },
        },
      },
    }
    ```

    <Warning>
    不要在 URL 后添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，在这种模式下工具调用并不可靠。请使用不带路径后缀的基础 Ollama URL。
    </Warning>

  </Tab>
</Tabs>

### 模型选择

配置完成后，你的所有 Ollama 模型都可用：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web 搜索

OpenClaw 支持将 **Ollama Web 搜索** 作为内置的 `web_search` 提供商。

| 属性 | 详情 |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 主机 | 使用你已配置的 Ollama 主机（若设置了 `models.providers.ollama.baseUrl` 则使用该值，否则为 `http://127.0.0.1:11434`） |
| 身份验证 | 无需密钥 |
| 要求 | Ollama 必须正在运行，并已通过 `ollama signin` 登录 |

可在 `openclaw onboard` 或 `openclaw configure --section web` 中选择 **Ollama Web 搜索**，或设置：

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
完整设置和行为细节请参见 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI 兼容模式">
    <Warning>
    **在 OpenAI 兼容模式下，工具调用并不可靠。** 仅当你需要为某个代理使用 OpenAI 格式，且不依赖原生工具调用行为时，才使用此模式。
    </Warning>

    如果你确实需要改用 OpenAI 兼容端点（例如某个仅支持 OpenAI 格式的代理后面），请显式设置 `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    在此模式下，可能无法同时支持流式传输和工具调用。你可能需要在模型配置中通过 `params: { streaming: false }` 禁用流式传输。

    当 Ollama 与 `api: "openai-completions"` 一起使用时，OpenClaw 默认会注入 `options.num_ctx`，以避免 Ollama 静默回退到 4096 的上下文窗口。如果你的代理/上游拒绝未知的 `options` 字段，请禁用此行为：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="上下文窗口">
    对于自动发现的模型，OpenClaw 会在可用时使用 Ollama 报告的上下文窗口，否则会回退到 OpenClaw 使用的默认 Ollama 上下文窗口。

    你可以在显式提供商配置中覆盖 `contextWindow` 和 `maxTokens`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="推理模型">
    默认情况下，OpenClaw 会将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为支持推理的模型。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    无需额外配置 —— OpenClaw 会自动标记它们。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 是免费的，并在本地运行，因此所有模型成本都设置为 $0。这同时适用于自动发现和手动定义的模型。
  </Accordion>

  <Accordion title="记忆 embeddings">
    内置的 Ollama 插件会为 [Memory Search](/zh-CN/concepts/memory) 注册一个记忆 embedding 提供商。它会使用已配置的 Ollama base URL
    和 API 密钥。

    | 属性 | 值 |
    | ------------- | ------------------- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是 —— 如果 embedding 模型尚未在本地存在，则会自动拉取 |

    若要将 Ollama 选为记忆搜索 embedding 提供商：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式传输配置">
    OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），它可以完整支持同时进行流式传输和工具调用。无需额外配置。

    对于原生 `/api/chat` 请求，OpenClaw 还会将 thinking 控制直接转发给 Ollama：`/think off` 和 `openclaw agent --thinking off` 会发送顶层 `think: false`，而非 `off` 的 thinking 级别则会发送 `think: true`。

    <Tip>
    如果你需要使用 OpenAI 兼容端点，请参见上面的“旧版 OpenAI 兼容模式”部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="未检测到 Ollama">
    请确保 Ollama 正在运行，并且你已经设置了 `OLLAMA_API_KEY`（或 auth profile），同时你**没有**定义显式的 `models.providers.ollama` 条目：

    ```bash
    ollama serve
    ```

    验证 API 可访问：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    如果你的模型未列出，请在本地拉取该模型，或在 `models.providers.ollama` 中显式定义它。

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    请检查 Ollama 是否运行在正确端口上：

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多帮助请参见：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障切换行为概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web 搜索" href="/zh-CN/tools/ollama-search" icon="magnifying-glass">
    基于 Ollama 的 Web 搜索的完整设置与行为细节。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
