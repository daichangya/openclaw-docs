---
read_when:
    - 你想通过 Ollama 使用云端或本地模型运行 OpenClaw
    - 你需要 Ollama 的设置和配置指南
    - 你想使用 Ollama 视觉模型进行图像理解
summary: 使用 Ollama（云端和本地模型）运行 OpenClaw
title: Ollama
x-i18n:
    generated_at: "2026-04-27T02:57:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2347bab12354fbcf4065eec923695f1cc71eb2740f6fd589c9b70c0b71794469
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw 可通过 Ollama 的原生 API（`/api/chat`）集成托管云模型以及本地/自托管 Ollama 服务器。你可以通过三种模式使用 Ollama：通过可访问的 Ollama 主机使用 `Cloud + Local`、针对 `https://ollama.com` 使用 `Cloud only`，或针对可访问的 Ollama 主机使用 `Local only`。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型还可能把原始工具 JSON 当作纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不带 `/v1`）。
</Warning>

Ollama 提供商配置使用 `baseUrl` 作为规范键名。OpenClaw 也接受 `baseURL`，以兼容 OpenAI SDK 风格的示例，但新配置应优先使用 `baseUrl`。

本地和局域网 Ollama 主机不需要真实的 bearer token；对于 loopback、私有网络、`.local` 和裸主机名 Ollama base URL，OpenClaw 仅使用本地 `ollama-local` 标记。远程公共主机和 Ollama Cloud（`https://ollama.com`）则需要通过 `OLLAMA_API_KEY`、auth profile 或提供商的 `apiKey` 提供真实凭证。

当 Ollama 用于 memory embeddings 时，bearer 认证会限定在声明它的主机范围内。提供商级别的密钥只会发送到该提供商的 Ollama 主机；`agents.*.memorySearch.remote.apiKey` 只会发送到其远程 embedding 主机；单独的 `OLLAMA_API_KEY` 环境变量值则会被视为 Ollama Cloud 的约定，而不会默认发送到本地/自托管主机。

## 入门指南

选择你偏好的设置方式和模式。

<Tabs>
  <Tab title="新手引导（推荐）">
    **最适合：** 以最快路径完成可用的 Ollama 云端或本地设置。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        ```

        从提供商列表中选择 **Ollama**。
      </Step>
      <Step title="选择你的模式">
        - **Cloud + Local** — 本地 Ollama 主机，加上经由该主机路由的云模型
        - **Cloud only** — 通过 `https://ollama.com` 使用托管 Ollama 模型
        - **Local only** — 仅使用本地模型
      </Step>
      <Step title="选择一个模型">
        `Cloud only` 会提示输入 `OLLAMA_API_KEY`，并建议使用托管云默认模型。`Cloud + Local` 和 `Local only` 会要求提供 Ollama base URL，发现可用模型，并在所选本地模型尚不可用时自动拉取该模型。`Cloud + Local` 还会检查该 Ollama 主机是否已登录并具备云访问能力。
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非交互模式

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    你也可以选择性指定自定义 base URL 或模型：

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
        - **Cloud only**：使用 `https://ollama.com` 并提供 `OLLAMA_API_KEY`
        - **Local only**：从 [ollama.com/download](https://ollama.com/download) 安装 Ollama
      </Step>
      <Step title="拉取本地模型（仅本地）">
        ```bash
        ollama pull gemma4
        # 或
        ollama pull gpt-oss:20b
        # 或
        ollama pull llama3.3
        ```
      </Step>
      <Step title="为 OpenClaw 启用 Ollama">
        对于 `Cloud only`，请使用真实的 `OLLAMA_API_KEY`。对于基于主机的设置，任意占位值都可以：

        ```bash
        # 云端
        export OLLAMA_API_KEY="your-ollama-api-key"

        # 仅本地
        export OLLAMA_API_KEY="ollama-local"

        # 或在你的配置文件中设置
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="查看并设置你的模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或者在配置中设置默认值：

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
    `Cloud + Local` 使用可访问的 Ollama 主机作为本地和云模型的统一控制点。这是 Ollama 首选的混合流程。

    在设置期间使用 **Cloud + Local**。OpenClaw 会提示输入 Ollama base URL，从该主机发现本地模型，并检查该主机是否已通过 `ollama signin` 登录并具备云访问能力。当主机已登录时，OpenClaw 还会建议托管云默认模型，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果该主机尚未登录，OpenClaw 会将设置保持为仅本地，直到你运行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 直接针对 Ollama 的托管 API `https://ollama.com` 运行。

    在设置期间使用 **Cloud only**。OpenClaw 会提示输入 `OLLAMA_API_KEY`，设置 `baseUrl: "https://ollama.com"`，并初始化托管云模型列表。此路径 **不** 需要本地 Ollama 服务器或 `ollama signin`。

    `openclaw onboard` 期间显示的云模型列表会从 `https://ollama.com/api/tags` 实时获取，最多 500 项，因此选择器反映的是当前托管目录，而不是静态预设。如果在设置时无法访问 `ollama.com` 或没有返回模型，OpenClaw 会回退到先前的硬编码建议，以便新手引导仍可完成。

  </Tab>

  <Tab title="Local only">
    在仅本地模式下，OpenClaw 会从已配置的 Ollama 实例中发现模型。此路径适用于本地或自托管 Ollama 服务器。

    OpenClaw 当前建议 `gemma4` 作为本地默认模型。

  </Tab>
</Tabs>

## 模型发现（隐式提供商）

当你设置了 `OLLAMA_API_KEY`（或 auth profile），并且**没有**定义 `models.providers.ollama` 时，OpenClaw 会从 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型。

| 行为 | 详情 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询 | 查询 `/api/tags` |
| 能力检测 | 使用尽力而为的 `/api/show` 查询来读取 `contextWindow`、展开后的 `num_ctx` Modelfile 参数，以及包括 vision/tools 在内的能力 |
| 视觉模型 | 若 `/api/show` 报告模型具备 `vision` 能力，则该模型会被标记为支持图像（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示词 |
| 推理检测 | 使用模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning` |
| Token 限制 | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 token 上限 |
| 成本 | 将所有成本设置为 `0` |

这样可以避免手动添加模型条目，同时让目录与本地 Ollama 实例保持一致。

```bash
# 查看有哪些可用模型
ollama list
openclaw models list
```

要添加新模型，只需用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型会被自动发现并可供使用。

<Note>
如果你显式设置了 `models.providers.ollama`，则会跳过自动发现，你必须手动定义模型。请参见下方的显式配置部分。
</Note>

## 视觉与图像描述

内置的 Ollama 插件会将 Ollama 注册为支持图像的媒体理解提供商。这使 OpenClaw 能够通过本地或托管的 Ollama 视觉模型来路由显式图像描述请求以及已配置的默认图像模型。

对于本地视觉模型，请拉取一个支持图像的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

然后用 infer CLI 进行验证：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必须是完整的 `<provider/model>` 引用。设置后，`openclaw infer image describe` 会直接运行该模型，而不会因为该模型支持原生视觉能力而跳过描述。

要让 Ollama 成为入站媒体的默认图像理解模型，请配置 `agents.defaults.imageModel`：

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

如果你手动定义 `models.providers.ollama.models`，请将视觉模型标记为支持图像输入：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 会拒绝未标记为支持图像的模型的图像描述请求。在隐式发现模式下，当 `/api/show` 报告 vision 能力时，OpenClaw 会从 Ollama 中读取此信息。

## 配置

<Tabs>
  <Tab title="基础（隐式发现）">
    最简单的仅本地启用方式是通过环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已设置 `OLLAMA_API_KEY`，你可以在提供商条目中省略 `apiKey`，OpenClaw 会为可用性检查自动填充它。
    </Tip>

  </Tab>

  <Tab title="显式（手动模型）">
    当你需要托管云设置、Ollama 运行在其他主机/端口上、你想强制指定特定上下文窗口或模型列表，或你希望完全手动定义模型时，请使用显式配置。

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
    如果 Ollama 运行在不同的主机或端口上（显式配置会禁用自动发现，因此你需要手动定义模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不要加 /v1 - 使用原生 Ollama API URL
            api: "ollama", // 显式设置，以确保原生工具调用行为
          },
        },
      },
    }
    ```

    <Warning>
    不要在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，而该模式下工具调用并不可靠。请使用不带路径后缀的 Ollama 基础 URL。
    </Warning>

  </Tab>
</Tabs>

### 模型选择

配置完成后，你的所有 Ollama 模型都会可用：

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

也支持自定义 Ollama 提供商 id。当模型引用使用活动提供商前缀时，例如 `ollama-spark/qwen3:32b`，OpenClaw 在调用 Ollama 前只会去掉该前缀，因此服务器接收到的是 `qwen3:32b`。

## Ollama Web 搜索

OpenClaw 支持将 **Ollama Web 搜索** 作为内置的 `web_search` 提供商。

| 属性 | 详情 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主机 | 使用你配置的 Ollama 主机（设置了 `models.providers.ollama.baseUrl` 时使用其值，否则为 `http://127.0.0.1:11434`）；`https://ollama.com` 直接使用托管 API |
| 认证 | 对已登录的本地 Ollama 主机无需密钥；对于直接使用 `https://ollama.com` 进行搜索或受保护的主机，需要 `OLLAMA_API_KEY` 或配置好的提供商认证 |
| 要求 | 本地/自托管主机必须正在运行并已通过 `ollama signin` 登录；直接使用托管搜索则需要 `baseUrl: "https://ollama.com"` 加真实的 Ollama API 密钥 |

在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Ollama Web 搜索**，或者设置：

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
完整的设置与行为细节，请参见 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI 兼容模式">
    <Warning>
    **在 OpenAI 兼容模式下，工具调用并不可靠。** 仅当你需要为代理使用 OpenAI 格式且不依赖原生工具调用行为时，才使用此模式。
    </Warning>

    如果你确实需要改用 OpenAI 兼容端点（例如位于只支持 OpenAI 格式的代理之后），请显式设置 `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // 默认值：true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    该模式可能无法同时支持流式传输和工具调用。你可能需要在模型配置中通过 `params: { streaming: false }` 禁用流式传输。

    当 Ollama 使用 `api: "openai-completions"` 时，OpenClaw 默认会注入 `options.num_ctx`，这样 Ollama 就不会静默回退到 4096 的上下文窗口。如果你的代理/上游会拒绝未知的 `options` 字段，请禁用此行为：

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
    对于自动发现的模型，OpenClaw 会在可用时使用 Ollama 报告的上下文窗口，包括来自自定义 Modelfiles 的更大 `PARAMETER num_ctx` 值。否则，它会回退到 OpenClaw 使用的默认 Ollama 上下文窗口。

    你可以在显式提供商配置中覆盖 `contextWindow` 和 `maxTokens`。若要在不重建 Modelfile 的情况下限制 Ollama 每次请求的运行时上下文，可设置 `params.num_ctx`；OpenClaw 会在原生 Ollama 和 OpenAI 兼容的 Ollama 适配器中都将其作为 `options.num_ctx` 发送。无效、零、负数和非有限值会被忽略，并回退到 `contextWindow`。

    原生 Ollama 模型条目也接受 `params` 下常见的 Ollama 运行时选项，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 和 `use_mmap`。OpenClaw 只会转发 Ollama 请求键，因此像 `streaming` 这样的 OpenClaw 运行时参数不会泄露给 Ollama。使用 `params.think` 或 `params.thinking` 可以发送顶层 Ollama `think`；对于 Qwen 风格的思考模型，`false` 会禁用 API 级别的思考。

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
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    每个模型的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也同样有效。如果两者都已配置，则显式提供商模型条目的优先级高于智能体默认值。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 默认会将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为具备推理能力。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    不需要额外配置 —— OpenClaw 会自动标记它们。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 是免费的并且在本地运行，因此所有模型成本都设置为 $0。这同时适用于自动发现和手动定义的模型。
  </Accordion>

  <Accordion title="Memory embeddings">
    内置的 Ollama 插件为 [memory search](/zh-CN/concepts/memory) 注册了一个 memory embedding 提供商。它使用配置好的 Ollama base URL 和 API 密钥，调用 Ollama 当前的 `/api/embed` 端点，并在可能时将多个 memory chunk 批量合并到一次 `input` 请求中。

    | 属性 | 值 |
    | ------------- | ------------------- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是 —— 如果 embedding 模型尚未在本地存在，会自动拉取 |

    要将 Ollama 选为 memory search 的 embedding 提供商：

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
    OpenClaw 的 Ollama 集成默认使用 **原生 Ollama API**（`/api/chat`），可同时完整支持流式传输和工具调用。不需要任何特殊配置。

    对于原生 `/api/chat` 请求，OpenClaw 也会将思考控制直接转发给 Ollama：`/think off` 和 `openclaw agent --thinking off` 会发送顶层 `think: false`，而 `/think low|medium|high` 会发送匹配的顶层 `think` 强度字符串。`/think max` 会映射为 Ollama 的最高原生强度，即 `think: "high"`。

    <Tip>
    如果你需要使用 OpenAI 兼容端点，请参阅上方的“旧版 OpenAI 兼容模式”部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="未检测到 Ollama">
    请确保 Ollama 正在运行，并且你已设置 `OLLAMA_API_KEY`（或 auth profile），同时你**没有**定义显式的 `models.providers.ollama` 条目：

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
    ollama list  # 查看已安装内容
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 或其他模型
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    检查 Ollama 是否在正确的端口上运行：

    ```bash
    # 检查 Ollama 是否正在运行
    ps aux | grep ollama

    # 或重启 Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障切换行为的概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web 搜索" href="/zh-CN/tools/ollama-search" icon="magnifying-glass">
    由 Ollama 驱动的 web 搜索的完整设置与行为细节。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整的配置参考。
  </Card>
</CardGroup>
