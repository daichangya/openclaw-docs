---
read_when:
    - 你想通过 Ollama 使用云端或本地模型运行 OpenClaw
    - 你需要 Ollama 的设置和配置指南
    - 你想使用 Ollama 视觉模型进行图像理解
summary: 使用 Ollama 运行 OpenClaw（云端和本地模型）
title: Ollama
x-i18n:
    generated_at: "2026-04-27T04:00:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617a3a8660ba301a30ab6148e316c7fa033773fbad09cb4a910cfe8f2979fde7
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw 可通过 Ollama 的原生 API（`/api/chat`）集成托管云模型以及本地/自托管的 Ollama 服务器。你可以通过三种模式使用 Ollama：通过可访问的 Ollama 主机使用 `Cloud + Local`、对接 `https://ollama.com` 的 `Cloud only`，或对接可访问的 Ollama 主机的 `Local only`。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` 的 OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型还可能把原始工具 JSON 当作纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不要带 `/v1`）。
</Warning>

Ollama provider 配置使用 `baseUrl` 作为规范键名。为了兼容 OpenAI SDK 风格的示例，OpenClaw 也接受 `baseURL`，但新配置应优先使用 `baseUrl`。

本地和局域网中的 Ollama 主机不需要真实的 bearer token；对于 loopback、私有网络、`.local` 和纯主机名形式的 Ollama base URL，OpenClaw 仅使用本地的 `ollama-local` 标记。远程公共主机和 Ollama Cloud（`https://ollama.com`）则需要通过 `OLLAMA_API_KEY`、认证配置文件或 provider 的 `apiKey` 提供真实凭证。

将 `api: "ollama"` 用于自定义 provider id 时，也遵循相同的认证规则。例如，指向私有局域网 Ollama 主机的 `ollama-remote` provider 可以使用 `apiKey: "ollama-local"`，子智能体会通过 Ollama provider hook 解析该标记，而不会把它当作缺失的凭证。

当 Ollama 用于 memory embeddings 时，bearer 认证会限定在声明它的主机范围内。provider 级别的密钥只会发送到该 provider 自己的 Ollama 主机；`agents.*.memorySearch.remote.apiKey` 只会发送到它自己的远程嵌入主机；而单独设置的 `OLLAMA_API_KEY` 环境变量默认会被视为 Ollama Cloud 的约定，而不会默认发送到本地/自托管主机。

## 入门指南

选择你偏好的设置方法和模式。

<Tabs>
  <Tab title="新手引导（推荐）">
    **最适合：** 以最快路径完成可用的 Ollama 云端或本地设置。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        ```

        从 provider 列表中选择 **Ollama**。
      </Step>
      <Step title="选择你的模式">
        - **Cloud + Local** — 本地 Ollama 主机，加上通过该主机路由的云模型
        - **Cloud only** — 通过 `https://ollama.com` 使用托管的 Ollama 模型
        - **Local only** — 仅使用本地模型
      </Step>
      <Step title="选择模型">
        `Cloud only` 会提示输入 `OLLAMA_API_KEY`，并建议托管云默认模型。`Cloud + Local` 和 `Local only` 会要求填写 Ollama base URL、发现可用模型，并在所选本地模型尚不可用时自动拉取。`Cloud + Local` 还会检查该 Ollama 主机是否已登录以启用云访问。
      </Step>
      <Step title="验证模型是否可用">
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

    你也可以选择性地指定自定义 base URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手动设置">
    **最适合：** 完全掌控云端或本地设置。

    <Steps>
      <Step title="选择云端或本地">
        - **Cloud + Local**：安装 Ollama，使用 `ollama signin` 登录，并通过该主机路由云请求
        - **Cloud only**：使用带有 `OLLAMA_API_KEY` 的 `https://ollama.com`
        - **Local only**：从 [ollama.com/download](https://ollama.com/download) 安装 Ollama
      </Step>
      <Step title="拉取本地模型（仅限本地）">
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
    `Cloud + Local` 使用一个可访问的 Ollama 主机作为本地模型和云模型的统一控制点。这是 Ollama 首选的混合流程。

    设置时请使用 **Cloud + Local**。OpenClaw 会提示输入 Ollama base URL，从该主机发现本地模型，并检查该主机是否已通过 `ollama signin` 登录以启用云访问。主机登录后，OpenClaw 还会建议托管云默认模型，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主机尚未登录，OpenClaw 会保持为仅本地设置，直到你运行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 通过 Ollama 的托管 API `https://ollama.com` 运行。

    设置时请使用 **Cloud only**。OpenClaw 会提示输入 `OLLAMA_API_KEY`，设置 `baseUrl: "https://ollama.com"`，并初始化托管云模型列表。此路径**不**需要本地 Ollama 服务器或 `ollama signin`。

    在 `openclaw onboard` 期间显示的云模型列表会实时从 `https://ollama.com/api/tags` 填充，上限为 500 项，因此选择器反映的是当前托管目录，而不是静态预置列表。如果在设置时 `ollama.com` 不可达或未返回任何模型，OpenClaw 会回退到此前的硬编码建议，以确保新手引导仍能完成。

  </Tab>

  <Tab title="Local only">
    在仅本地模式下，OpenClaw 会从已配置的 Ollama 实例发现模型。此路径适用于本地或自托管的 Ollama 服务器。

    OpenClaw 当前建议 `gemma4` 作为本地默认模型。

  </Tab>
</Tabs>

## 模型发现（隐式 provider）

当你设置 `OLLAMA_API_KEY`（或认证配置文件）且**未**定义 `models.providers.ollama` 时，OpenClaw 会从 `http://127.0.0.1:11434` 上的本地 Ollama 实例发现模型。

| 行为 | 说明 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询 | 查询 `/api/tags` |
| 能力检测 | 使用尽力而为的 `/api/show` 查询来读取 `contextWindow`、展开后的 `num_ctx` Modelfile 参数，以及包括 vision/tools 在内的能力 |
| 视觉模型 | 当 `/api/show` 报告模型具有 `vision` 能力时，这些模型会被标记为支持图像（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示词 |
| 推理检测 | 使用模型名称启发式规则（`r1`、`reasoning`、`think`）标记 `reasoning` |
| 令牌限制 | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大令牌上限 |
| 成本 | 所有成本均设置为 `0` |

这样可以避免手动添加模型条目，同时保持目录与本地 Ollama 实例一致。

```bash
# 查看有哪些可用模型
ollama list
openclaw models list
```

要添加新模型，只需使用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型会被自动发现并可立即使用。

<Note>
如果你显式设置了 `models.providers.ollama`，则会跳过自动发现，你必须手动定义模型。请参见下方的显式配置部分。
</Note>

## 视觉与图像描述

内置的 Ollama 插件会将 Ollama 注册为支持图像的媒体理解 provider。这使 OpenClaw 能够通过本地或托管的 Ollama 视觉模型，路由显式图像描述请求以及已配置的图像模型默认值。

对于本地视觉能力，请拉取一个支持图像的模型：

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

`--model` 必须是完整的 `<provider/model>` 引用。设置后，`openclaw infer image describe` 会直接运行该模型，而不会因为模型支持原生视觉就跳过描述。

如需将 Ollama 设为入站媒体的默认图像理解模型，请配置 `agents.defaults.imageModel`：

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

如果你手动定义 `models.providers.ollama.models`，请用图像输入支持来标记视觉模型：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 会拒绝未标记为支持图像能力的模型的图像描述请求。在隐式发现模式下，当 `/api/show` 报告 vision 能力时，OpenClaw 会从 Ollama 读取该信息。

## 配置

<Tabs>
  <Tab title="基础（隐式发现）">
    最简单的仅本地启用方式是通过环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已设置 `OLLAMA_API_KEY`，则可以在 provider 条目中省略 `apiKey`，OpenClaw 会自动填充它以进行可用性检查。
    </Tip>

  </Tab>

  <Tab title="显式配置（手动模型）">
    当你需要托管云设置、Ollama 运行在其他主机/端口、你想强制使用特定上下文窗口或模型列表，或者你希望完全手动定义模型时，请使用显式配置。

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
    如果 Ollama 运行在不同的主机或端口上（显式配置会禁用自动发现，因此需要手动定义模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不要加 /v1 - 使用原生 Ollama API URL
            api: "ollama", // 显式设置以保证原生工具调用行为
            timeoutSeconds: 300, // 可选：给冷启动的本地模型更多连接和流式传输时间
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 可选：在轮次之间保持模型已加载
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    不要在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，在该模式下工具调用不可靠。请使用不带路径后缀的基础 Ollama URL。
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

也支持自定义 Ollama provider id。当模型引用使用当前启用的 provider 前缀时，例如 `ollama-spark/qwen3:32b`，OpenClaw 在调用 Ollama 前只会剥离该前缀，因此服务器接收到的是 `qwen3:32b`。

对于较慢的本地模型，优先考虑按 provider 范围调整请求参数，而不是提高整个智能体运行时的超时时间：

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` 适用于模型 HTTP 请求，包括连接建立、headers、body 流式传输，以及整个受保护 fetch 的中止超时。`params.keep_alive` 会作为顶层 `keep_alive` 转发给 Ollama 的原生 `/api/chat` 请求；当首轮加载时间是瓶颈时，请按模型设置它。

## Ollama Web 搜索

OpenClaw 支持 **Ollama Web 搜索**，作为内置的 `web_search` provider。

| 属性 | 说明 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主机 | 使用你配置的 Ollama 主机（如果设置了则为 `models.providers.ollama.baseUrl`，否则为 `http://127.0.0.1:11434`）；`https://ollama.com` 直接使用托管 API |
| 认证 | 对已登录的本地 Ollama 主机无需密钥；对于直接使用 `https://ollama.com` 进行搜索或受认证保护的主机，则使用 `OLLAMA_API_KEY` 或已配置的 provider 认证 |
| 要求 | 本地/自托管主机必须正在运行并已通过 `ollama signin` 登录；直接使用托管搜索则需要 `baseUrl: "https://ollama.com"` 加上真实的 Ollama API key |

在 `openclaw onboard` 或 `openclaw configure --section web` 中选择 **Ollama Web 搜索**，或设置：

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
    **在 OpenAI 兼容模式下，工具调用不可靠。** 只有在你需要为代理使用 OpenAI 格式且不依赖原生工具调用行为时，才应使用此模式。
    </Warning>

    如果你需要改用 OpenAI 兼容端点（例如，在只支持 OpenAI 格式的代理之后），请显式设置 `api: "openai-completions"`：

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

    此模式可能无法同时支持流式传输和工具调用。你可能需要在模型配置中使用 `params: { streaming: false }` 来禁用流式传输。

    当 Ollama 使用 `api: "openai-completions"` 时，OpenClaw 默认会注入 `options.num_ctx`，以避免 Ollama 悄悄回退到 4096 的上下文窗口。如果你的代理/上游拒绝未知的 `options` 字段，请禁用此行为：

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
    对于自动发现的模型，OpenClaw 会在可用时使用 Ollama 报告的上下文窗口，包括来自自定义 Modelfile 的更大 `PARAMETER num_ctx` 值。否则，它会回退到 OpenClaw 使用的默认 Ollama 上下文窗口。

    你可以在显式 provider 配置中覆盖 `contextWindow` 和 `maxTokens`。若要在不重新构建 Modelfile 的情况下限制 Ollama 每次请求的运行时上下文，请设置 `params.num_ctx`；OpenClaw 会将其作为 `options.num_ctx` 发送给原生 Ollama 以及 OpenAI 兼容的 Ollama 适配器。无效、零、负数和非有限值会被忽略，并回退到 `contextWindow`。

    原生 Ollama 模型条目也接受放在 `params` 下的常见 Ollama 运行时选项，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 和 `use_mmap`。OpenClaw 只会转发 Ollama 请求键，因此像 `streaming` 这样的 OpenClaw 运行时参数不会泄露给 Ollama。使用 `params.think` 或 `params.thinking` 可发送顶层 Ollama `think`；对 Qwen 风格的 thinking 模型，`false` 会禁用 API 级 thinking。

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

    你也可以使用按模型设置的 `agents.defaults.models["ollama/<model>"].params.num_ctx`。如果两者都已配置，则显式 provider 模型条目会覆盖智能体默认值。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 默认会将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为支持推理能力。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    无需额外配置——OpenClaw 会自动标记它们。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 是免费的并且在本地运行，因此所有模型成本都设为 $0。这适用于自动发现和手动定义的模型。
  </Accordion>

  <Accordion title="Memory embeddings">
    内置的 Ollama 插件为 [memory search](/zh-CN/concepts/memory) 注册了一个 memory embedding provider。它使用已配置的 Ollama base URL 和 API key，调用 Ollama 当前的 `/api/embed` 端点，并在可能时将多个 memory chunk 批量合并到一个 `input` 请求中。

    | 属性 | 值 |
    | ------------- | ------------------- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是——如果嵌入模型在本地不存在，会自动拉取 |

    要将 Ollama 选择为 memory search 的 embedding provider：

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
    OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），它完全支持同时进行流式传输和工具调用。无需特殊配置。

    对于原生 `/api/chat` 请求，OpenClaw 还会将 thinking 控制直接转发给 Ollama：`/think off` 和 `openclaw agent --thinking off` 会发送顶层 `think: false`，而 `/think low|medium|high` 会发送匹配的顶层 `think` 强度字符串。`/think max` 会映射为 Ollama 最高的原生强度，即 `think: "high"`。

    <Tip>
    如果你需要使用 OpenAI 兼容端点，请参见上方的“旧版 OpenAI 兼容模式”部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="未检测到 Ollama">
    请确认 Ollama 正在运行，且你已设置 `OLLAMA_API_KEY`（或认证配置文件），并且你**没有**定义显式的 `models.providers.ollama` 条目：

    ```bash
    ollama serve
    ```

    验证 API 是否可访问：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    如果你的模型未列出，请在本地拉取该模型，或在 `models.providers.ollama` 中显式定义它。

    ```bash
    ollama list  # 查看已安装的模型
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

  <Accordion title="冷启动本地模型超时">
    大型本地模型在开始流式传输前，首次加载可能需要较长时间。请将超时设置限定在 Ollama provider 范围内，并可选择让 Ollama 在轮次之间保持模型已加载：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    如果主机本身接受连接的速度很慢，`timeoutSeconds` 也会延长此 provider 的受保护 Undici 连接超时。

  </Accordion>
</AccordionGroup>

<Note>
更多帮助： [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有 provider、模型引用和故障转移行为概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web 搜索" href="/zh-CN/tools/ollama-search" icon="magnifying-glass">
    由 Ollama 驱动的 Web 搜索的完整设置与行为细节。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
