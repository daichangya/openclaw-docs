---
read_when:
    - 你希望通过 Ollama 使用云端或本地模型来运行 OpenClaw
    - 你需要 Ollama 的设置和配置指南
    - 你希望使用 Ollama 视觉模型进行图像理解
summary: 使用 Ollama 运行 OpenClaw（云端和本地模型）
title: Ollama
x-i18n:
    generated_at: "2026-04-27T06:06:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56ab991f939f1bb42f798d762f0fe55ada9409e78e6b66ee76987a52637109bc
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw 通过 Ollama 原生 API（`/api/chat`）集成 Ollama，可用于托管云模型以及本地 / 自托管 Ollama 服务器。你可以通过三种模式使用 Ollama：通过可访问的 Ollama 主机实现 `Cloud + Local`、面向 `https://ollama.com` 的 `Cloud only`，或面向可访问 Ollama 主机的 `Local only`。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型还可能把原始工具 JSON 作为纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不要带 `/v1`）。
</Warning>

Ollama provider 配置使用 `baseUrl` 作为标准键名。出于与 OpenAI SDK 风格示例兼容的目的，OpenClaw 也接受 `baseURL`，但新配置应优先使用 `baseUrl`。

## 认证规则

<AccordionGroup>
  <Accordion title="本地和局域网主机">
    本地和局域网 Ollama 主机不需要真实的 bearer token。OpenClaw 仅对 loopback、私有网络、`.local` 以及裸主机名 Ollama base URL 使用本地 `ollama-local` 标记。
  </Accordion>
  <Accordion title="远程和 Ollama Cloud 主机">
    远程公网主机和 Ollama Cloud（`https://ollama.com`）需要通过 `OLLAMA_API_KEY`、认证配置文件或 provider 的 `apiKey` 提供真实凭证。
  </Accordion>
  <Accordion title="自定义 provider id">
    设置了 `api: "ollama"` 的自定义 provider id 也遵循相同规则。例如，指向私有 LAN Ollama 主机的 `ollama-remote` provider 可以使用 `apiKey: "ollama-local"`，子智能体会通过 Ollama provider hook 解析该标记，而不会将其视为缺失凭证。
  </Accordion>
  <Accordion title="Memory 嵌入范围">
    当 Ollama 用于 Memory 嵌入时，bearer 认证仅作用于声明它的主机：

    - provider 级密钥只会发送到该 provider 的 Ollama 主机。
    - `agents.*.memorySearch.remote.apiKey` 只会发送到其远程嵌入主机。
    - 纯 `OLLAMA_API_KEY` 环境变量值会被视为 Ollama Cloud 约定，默认不会发送到本地或自托管主机。

  </Accordion>
</AccordionGroup>

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
        - **Cloud + Local** — 本地 Ollama 主机加上通过该主机路由的云模型
        - **Cloud only** — 通过 `https://ollama.com` 使用托管 Ollama 模型
        - **Local only** — 仅使用本地模型
      </Step>
      <Step title="选择模型">
        `Cloud only` 会提示输入 `OLLAMA_API_KEY`，并推荐托管云默认模型。`Cloud + Local` 和 `Local only` 会要求提供 Ollama base URL、发现可用模型，并在所选本地模型尚不可用时自动拉取。`Cloud + Local` 还会检查该 Ollama 主机是否已登录云访问。
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

    你也可以指定自定义 base URL 或模型：

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
        - **Cloud only**：配合 `OLLAMA_API_KEY` 使用 `https://ollama.com`
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
        对于 `Cloud only`，请使用真实的 `OLLAMA_API_KEY`。对于基于主机的设置，任意占位值都可用：

        ```bash
        # 云端
        export OLLAMA_API_KEY="your-ollama-api-key"

        # 仅本地
        export OLLAMA_API_KEY="ollama-local"

        # 或者在配置文件中设置
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
    `Cloud + Local` 使用一个可访问的 Ollama 主机作为本地和云模型的统一控制点。这是 Ollama 推荐的混合流程。

    在设置期间使用 **Cloud + Local**。OpenClaw 会提示输入 Ollama base URL，从该主机发现本地模型，并检查该主机是否已通过 `ollama signin` 登录云访问。如果主机已登录，OpenClaw 还会推荐托管云默认模型，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主机尚未登录，OpenClaw 会保持为仅本地设置，直到你运行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 面向 Ollama 的托管 API `https://ollama.com` 运行。

    在设置期间使用 **Cloud only**。OpenClaw 会提示输入 `OLLAMA_API_KEY`，设置 `baseUrl: "https://ollama.com"`，并初始化托管云模型列表。此路径 **不** 需要本地 Ollama 服务器或 `ollama signin`。

    `openclaw onboard` 期间显示的云模型列表会从 `https://ollama.com/api/tags` 实时拉取，最多 500 条，因此选择器反映的是当前托管目录，而不是静态种子列表。如果设置时 `ollama.com` 不可达或返回空模型列表，OpenClaw 会回退到之前的硬编码建议，以确保新手引导仍能完成。

  </Tab>

  <Tab title="Local only">
    在仅本地模式下，OpenClaw 会从已配置的 Ollama 实例发现模型。此路径适用于本地或自托管 Ollama 服务器。

    OpenClaw 当前推荐 `gemma4` 作为本地默认值。

  </Tab>
</Tabs>

## 模型发现（隐式 provider）

当你设置了 `OLLAMA_API_KEY`（或认证配置文件），且**没有**定义 `models.providers.ollama` 或其他设置了 `api: "ollama"` 的自定义远程 provider 时，OpenClaw 会从位于 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型。

| 行为                 | 详情                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询             | 查询 `/api/tags`                                                                                                                                              |
| 能力检测             | 尽力使用 `/api/show` 查询读取 `contextWindow`、展开后的 `num_ctx` Modelfile 参数，以及包括 vision / tools 在内的能力                                        |
| 视觉模型             | `/api/show` 报告有 `vision` 能力的模型会被标记为支持图像（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示中                                 |
| 推理检测             | 使用模型名称启发式规则（`r1`、`reasoning`、`think`）标记 `reasoning`                                                                                          |
| Token 限制           | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 token 上限                                                                                              |
| 成本                 | 将所有成本设置为 `0`                                                                                                                                          |

这样可以避免手动录入模型条目，同时使模型目录与本地 Ollama 实例保持一致。

```bash
# 查看有哪些可用模型
ollama list
openclaw models list
```

要添加新模型，只需用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型会被自动发现并可立即使用。

<Note>
如果你显式设置了 `models.providers.ollama`，或者配置了像 `models.providers.ollama-cloud` 这样设置了 `api: "ollama"` 的自定义远程 provider，则会跳过自动发现，你必须手动定义模型。像 `http://127.0.0.2:11434` 这样的 loopback 自定义 provider 仍会被视为本地。参见下方显式配置部分。
</Note>

## 视觉和图像描述

内置的 Ollama 插件会将 Ollama 注册为支持图像的媒体理解 provider。这使 OpenClaw 能够通过本地或托管的 Ollama 视觉模型，路由显式图像描述请求以及已配置的默认图像模型。

对于本地视觉模型，请拉取一个支持图像的模型：

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

`--model` 必须是完整的 `<provider/model>` 引用。设置后，`openclaw infer image describe` 会直接运行该模型，而不会因为该模型支持原生视觉而跳过描述。

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

如果你手动定义 `models.providers.ollama.models`，请为视觉模型标记图像输入支持：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 会拒绝将未标记为支持图像的模型用于图像描述请求。在隐式发现模式下，当 `/api/show` 报告 vision 能力时，OpenClaw 会从 Ollama 读取这一信息。

## 配置

<Tabs>
  <Tab title="基础（隐式发现）">
    最简单的仅本地启用方式是使用环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果设置了 `OLLAMA_API_KEY`，你可以在 provider 条目中省略 `apiKey`，OpenClaw 会在可用性检查时自动填充它。
    </Tip>

  </Tab>

  <Tab title="显式（手动模型）">
    当你想使用托管云设置、Ollama 运行在另一台主机 / 端口上、你想强制指定特定上下文窗口或模型列表，或者你想完全手动定义模型时，请使用显式配置。

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
    如果 Ollama 运行在其他主机或端口上（显式配置会禁用自动发现，因此你需要手动定义模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不要加 /v1 - 使用原生 Ollama API URL
            api: "ollama", // 显式设置，以确保原生工具调用行为
            timeoutSeconds: 300, // 可选：为冷启动的本地模型提供更长的连接和流式传输时间
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 可选：在轮次之间保持模型加载
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    不要在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，而该模式下工具调用并不可靠。请使用不带路径后缀的基础 Ollama URL。
    </Warning>

  </Tab>
</Tabs>

## 常见方案

可将下面这些作为起点，并用 `ollama list` 或 `openclaw models list --provider ollama` 中的精确模型名称替换模型 ID。

<AccordionGroup>
  <Accordion title="使用自动发现的本地模型">
    当 Ollama 与 Gateway 网关运行在同一台机器上，并且你希望 OpenClaw 自动发现已安装模型时，请使用此方式。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    这种方式可让配置保持最简。除非你想手动定义模型，否则不要添加 `models.providers.ollama` 配置块。

  </Accordion>

  <Accordion title="带手动模型的局域网 Ollama 主机">
    对局域网主机请使用原生 Ollama URL。不要添加 `/v1`。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` 是 OpenClaw 侧的上下文预算。`params.num_ctx` 会在请求中发送给 Ollama。当你的硬件无法运行模型宣称的完整上下文时，请让两者保持一致。

  </Accordion>

  <Accordion title="仅使用 Ollama Cloud">
    当你不运行本地守护进程，而是希望直接使用托管 Ollama 模型时，请使用此方式。

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

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
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="通过已登录守护进程同时使用云端和本地">
    当本地或局域网 Ollama 守护进程已通过 `ollama signin` 登录，并且应同时提供本地模型和 `:cloud` 模型时，请使用此方式。

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="多个 Ollama 主机">
    当你有多个 Ollama 服务器时，请使用自定义 provider ID。每个 provider 都有自己的主机、模型、认证、超时和模型引用。

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    当 OpenClaw 发送请求时，活动 provider 前缀会被去掉，因此 `ollama-large/qwen3.5:27b` 到达 Ollama 时会变成 `qwen3.5:27b`。

  </Accordion>

  <Accordion title="精简的本地模型配置">
    一些本地模型可以回答简单提示，但可能难以处理完整的智能体工具面。在更改全局运行时设置之前，请先尝试限制工具和上下文。

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    仅当模型或服务器在工具 schema 上稳定失败时，才使用 `compat.supportsTools: false`。它会以降低智能体能力为代价来换取稳定性。

  </Accordion>
</AccordionGroup>

### 模型选择

完成配置后，你的所有 Ollama 模型都可用：

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

也支持自定义 Ollama provider ID。当模型引用使用活动
provider 前缀时，例如 `ollama-spark/qwen3:32b`，OpenClaw 在调用 Ollama 前只会去掉这个
前缀，因此服务器接收到的是 `qwen3:32b`。

对于较慢的本地模型，建议优先使用 provider 范围的请求调优，而不是提高
整个智能体运行时超时：

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

`timeoutSeconds` 适用于模型 HTTP 请求，包括连接建立、
标头、正文流式传输，以及整个受保护获取的中止超时。`params.keep_alive`
会作为顶层 `keep_alive` 转发给原生 `/api/chat` 请求中的 Ollama；
当首轮加载时间是瓶颈时，请按模型设置它。

### 快速验证

```bash
# 这台机器可见的 Ollama 守护进程
curl http://127.0.0.1:11434/api/tags

# OpenClaw 目录和当前选中模型
openclaw models list --provider ollama
openclaw models status

# 直接模型冒烟测试
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

对于远程主机，请将 `127.0.0.1` 替换为 `baseUrl` 中使用的主机。如果 `curl` 可用但 OpenClaw 不行，请检查 Gateway 网关是否运行在另一台机器、容器或服务账号下。

## Ollama Web 搜索

OpenClaw 支持 **Ollama Web 搜索**，作为内置 `web_search` provider。

| Property    | 详情                                                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | 使用你配置的 Ollama 主机（若设置了 `models.providers.ollama.baseUrl` 则用它，否则为 `http://127.0.0.1:11434`）；`https://ollama.com` 则直接使用托管 API            |
| Auth        | 对已登录的本地 Ollama 主机无需密钥；对于直接 `https://ollama.com` 搜索或受认证保护的主机，则使用 `OLLAMA_API_KEY` 或已配置的 provider 认证                         |
| Requirement | 本地 / 自托管主机必须处于运行状态并已通过 `ollama signin` 登录；直接使用托管搜索则要求 `baseUrl: "https://ollama.com"` 并提供真实的 Ollama API 密钥                 |

在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Ollama Web 搜索**，或设置：

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

如需通过 Ollama Cloud 直接使用托管搜索：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

对于已登录的本地守护进程，OpenClaw 使用守护进程的 `/api/experimental/web_search` 代理。对于 `https://ollama.com`，它会直接调用托管的 `/api/web_search` 端点。

<Note>
有关完整设置和行为细节，请参见 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI 兼容模式">
    <Warning>
    **在 OpenAI 兼容模式下，工具调用并不可靠。** 仅当你需要通过某个仅支持 OpenAI 格式的代理，并且不依赖原生工具调用行为时，才使用此模式。
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

    在这种模式下，可能无法同时支持流式传输和工具调用。你可能需要在模型配置中通过 `params: { streaming: false }` 禁用流式传输。

    当 Ollama 使用 `api: "openai-completions"` 时，OpenClaw 默认会注入 `options.num_ctx`，以避免 Ollama 静默回退到 4096 上下文窗口。如果你的代理 / 上游拒绝未知的 `options` 字段，请禁用此行为：

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

    你可以为该 Ollama provider 下的每个模型设置 provider 级别的 `contextWindow`、`contextTokens` 和 `maxTokens` 默认值，并在需要时按模型覆盖。若要在不重建 Modelfile 的情况下限制 Ollama 每次请求的运行时上下文，请设置 `params.num_ctx`；OpenClaw 会将其作为 `options.num_ctx` 发送给原生 Ollama 和 OpenAI 兼容的 Ollama 适配器。无效、零、负数和非有限值会被忽略，并回退到 `contextWindow`。

    原生 Ollama 模型条目也接受位于 `params` 下的常见 Ollama 运行时选项，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 和 `use_mmap`。OpenClaw 只会转发 Ollama 请求键，因此像 `streaming` 这样的 OpenClaw 运行时参数不会泄漏给 Ollama。使用 `params.think` 或 `params.thinking` 发送顶层 Ollama `think`；对 Qwen 风格的思考模型，`false` 会禁用 API 级思考。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
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

    每模型的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也同样生效。如果两者都已配置，则显式 provider 模型条目优先于智能体默认值。

  </Accordion>

  <Accordion title="思考控制">
    对于原生 Ollama 模型，OpenClaw 会按 Ollama 预期的方式转发思考控制：使用顶层 `think`，而不是 `options.think`。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    你也可以设置模型默认值：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    每模型的 `params.think` 或 `params.thinking` 可以为特定已配置模型禁用或强制启用 Ollama API 思考。像 `/think off` 这样的运行时命令仍会作用于当前运行。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 默认会将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为支持推理的模型。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    无需额外配置。OpenClaw 会自动为它们打标。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 是免费的并且在本地运行，因此所有模型成本都设置为 $0。这适用于自动发现模型和手动定义模型。
  </Accordion>

  <Accordion title="Memory 嵌入">
    内置的 Ollama 插件会为
    [memory search](/zh-CN/concepts/memory) 注册一个 Memory 嵌入 provider。它使用配置好的 Ollama base URL
    和 API 密钥，调用 Ollama 当前的 `/api/embed` 端点，并在可能时将
    多个 Memory 分块批量放入一个 `input` 请求中。

    | Property      | 值                  |
    | ------------- | ------------------- |
    | 默认模型      | `nomic-embed-text`  |
    | 自动拉取      | 是——如果本地不存在，嵌入模型会自动拉取 |

    要将 Ollama 选为 memory search 的嵌入 provider：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

    对于远程嵌入主机，请将认证限定在该主机范围内：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              model: "nomic-embed-text",
              apiKey: "ollama-local",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式传输配置">
    OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），它可同时完整支持流式传输和工具调用。无需任何特殊配置。

    对于原生 `/api/chat` 请求，OpenClaw 还会直接将思考控制转发给 Ollama：`/think off` 和 `openclaw agent --thinking off` 会发送顶层 `think: false`，而 `/think low|medium|high` 会发送对应的顶层 `think` 努力度字符串。`/think max` 会映射到 Ollama 的最高原生努力级别，即 `think: "high"`。

    <Tip>
    如果你需要使用 OpenAI 兼容端点，请参见上方“旧版 OpenAI 兼容模式”部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="未检测到 Ollama">
    请确保 Ollama 正在运行，并且你已设置 `OLLAMA_API_KEY`（或认证配置文件），同时你**没有**定义显式的 `models.providers.ollama` 条目：

    ```bash
    ollama serve
    ```

    验证 API 是否可访问：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    如果列表中没有你的模型，请在本地拉取该模型，或在 `models.providers.ollama` 中显式定义它。

    ```bash
    ollama list  # 查看已安装内容
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 或其他模型
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    检查 Ollama 是否在正确端口上运行：

    ```bash
    # 检查 Ollama 是否正在运行
    ps aux | grep ollama

    # 或重启 Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="远程主机使用 curl 可用，但 OpenClaw 不行">
    请从运行 Gateway 网关的同一台机器和运行时环境中验证：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常见原因：

    - `baseUrl` 指向 `localhost`，但 Gateway 网关运行在 Docker 中或另一台主机上。
    - URL 使用了 `/v1`，因此选择了 OpenAI 兼容行为，而不是原生 Ollama。
    - 远程主机需要在 Ollama 侧调整防火墙或 LAN 绑定设置。
    - 模型存在于你笔记本的守护进程中，但不存在于远程守护进程中。

  </Accordion>

  <Accordion title="模型将工具 JSON 作为文本输出">
    这通常意味着 provider 正在使用 OpenAI 兼容模式，或该模型无法处理工具 schema。

    请优先使用原生 Ollama 模式：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    如果小型本地模型在工具 schema 上仍然失败，请在该模型条目上设置 `compat.supportsTools: false`，然后重新测试。

  </Accordion>

  <Accordion title="冷启动本地模型超时">
    大型本地模型在开始流式传输之前，首次加载可能需要较长时间。请将超时限制在 Ollama provider 范围内，并可选地让 Ollama 在轮次之间保持模型加载：

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

    如果主机本身接受连接较慢，`timeoutSeconds` 也会扩展该 provider 的受保护 Undici 连接超时。

  </Accordion>

  <Accordion title="大上下文模型太慢或内存不足">
    许多 Ollama 模型宣称支持比你的硬件能够舒适运行的更大上下文。请同时限制 OpenClaw 的预算和 Ollama 的请求上下文：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768 },
              },
            ],
          },
        },
      },
    }
    ```

    如果提示摄入阶段很慢，请先降低 `contextWindow`。如果生成阶段耗时过长，请降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多帮助： [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web 搜索" href="/zh-CN/tools/ollama-search" icon="magnifying-glass">
    由 Ollama 驱动的 Web 搜索的完整设置和行为细节。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
