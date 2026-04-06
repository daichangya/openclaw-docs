---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想向 OpenClaw 添加一个兼容 OpenAI 的代理或自定义 LLM
    - 你需要理解提供商凭证、目录和运行时 hooks
sidebarTitle: Provider Plugins
summary: 构建 OpenClaw 模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-04-06T12:28:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c888a988f6128f2c77b73ee4962ae7ad7b8a6c1b7d302610788c81ad25b0db
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# 构建提供商插件

本指南将带你逐步构建一个提供商插件，为 OpenClaw 添加一个模型提供商
（LLM）。完成后，你将拥有一个带有模型目录、API 密钥凭证和动态模型解析的提供商。

<Info>
  如果你之前从未构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础的软件包结构和清单设置。
</Info>

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="软件包和清单">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI 模型提供商",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API 密钥",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API 密钥"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    清单会声明 `providerAuthEnvVars`，这样 OpenClaw 就能在不加载你的插件运行时的情况下检测
    凭证。`modelSupport` 是可选的，它允许 OpenClaw 根据简写模型 id
    （例如 `acme-large`）自动加载你的提供商插件，此时甚至还没有运行时 hooks。如果你在
    ClawHub 上发布该提供商，那么 `package.json` 中的这些 `openclaw.compat` 和 `openclaw.build` 字段
    是必需的。

  </Step>

  <Step title="注册提供商">
    一个最小可用的提供商需要 `id`、`label`、`auth` 和 `catalog`：

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI 模型提供商",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API 密钥",
              hint: "来自你的 Acme AI 控制台的 API 密钥",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "输入你的 Acme AI API 密钥",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    这就是一个可工作的提供商。现在用户可以运行
    `openclaw onboard --acme-ai-api-key <key>`，并选择
    `acme-ai/acme-large` 作为他们的模型。

    对于仅注册一个文本提供商、使用 API 密钥凭证，并且只有一个基于目录的运行时的内置提供商，
    优先使用更窄的
    `defineSingleProviderPluginEntry(...)` 辅助函数：

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI 模型提供商",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API 密钥",
            hint: "来自你的 Acme AI 控制台的 API 密钥",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "输入你的 Acme AI API 密钥",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    如果你的凭证流程在新手引导期间还需要修补 `models.providers.*`、别名以及
    智能体默认模型，请使用来自
    `openclaw/plugin-sdk/provider-onboard` 的预设辅助函数。最窄的辅助函数是
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    当某个提供商的原生端点在常规 `openai-completions` 传输协议上支持流式使用量块时，
    优先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助函数，
    而不是硬编码提供商 id 检查。
    `supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 会根据端点能力映射检测支持情况，
    因此像原生 Moonshot/DashScope 这类风格的端点，即使插件使用的是自定义提供商 id，
    也仍然可以选择启用。

  </Step>

  <Step title="添加动态模型解析">
    如果你的提供商接受任意模型 ID（例如代理或路由器），
    请添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... 来自上面的 id、label、auth、catalog

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    如果解析过程需要网络调用，请使用 `prepareDynamicModel` 进行异步
    预热——在其完成后，`resolveDynamicModel` 会再次运行。

  </Step>

  <Step title="按需添加运行时 hooks">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。随着你的提供商需求增加，
    再逐步添加 hooks。

    共享辅助构建器现在已覆盖最常见的回放/工具兼容性
    系列，因此插件通常不需要再手动逐一接线每个 hook：

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    当前可用的回放系列：

    | 系列 | 它会接入的内容 |
    | --- | --- |
    | `openai-compatible` | 用于兼容 OpenAI 的传输协议的共享 OpenAI 风格回放策略，包括 tool-call-id 清理、assistant-first 顺序修复，以及在传输协议需要时进行通用 Gemini 轮次校验 |
    | `anthropic-by-model` | 按 `modelId` 选择的 Claude 感知回放策略，因此 Anthropic message 传输协议只有在解析出的模型确实是 Claude id 时，才会获得 Claude 专用的 thinking block 清理 |
    | `google-gemini` | 原生 Gemini 回放策略，以及 bootstrap 回放清理和带标记的 reasoning-output 模式 |
    | `passthrough-gemini` | 用于通过兼容 OpenAI 的代理传输协议运行的 Gemini 模型的 Gemini thought-signature 清理；不会启用原生 Gemini 回放校验或 bootstrap 重写 |
    | `hybrid-anthropic-openai` | 用于在一个插件中混合 Anthropic message 和兼容 OpenAI 模型面的提供商的混合策略；可选的仅 Claude thinking block 丢弃仍限制在 Anthropic 一侧 |

    真实的内置示例：

    - `google`：`google-gemini`
    - `openrouter`、`kilocode`、`opencode` 和 `opencode-go`：`passthrough-gemini`
    - `amazon-bedrock` 和 `anthropic-vertex`：`anthropic-by-model`
    - `minimax`：`hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai` 和 `zai`：`openai-compatible`

    当前可用的流式系列：

    | 系列 | 它会接入的内容 |
    | --- | --- |
    | `google-thinking` | 在共享流路径上进行 Gemini thinking 负载标准化 |
    | `kilocode-thinking` | 在共享代理流路径上提供 Kilo reasoning 包装器，其中 `kilo/auto` 和不支持的代理 reasoning id 会跳过注入的 thinking |
    | `moonshot-thinking` | 根据配置和 `/think` 级别，将 Moonshot 二进制 native-thinking 负载进行映射 |
    | `minimax-fast-mode` | 在共享流路径上进行 MiniMax fast-mode 模型重写 |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses 包装器：归属头、`/fast`/`serviceTier`、文本冗长度、原生 Codex web 搜索、reasoning 兼容性负载整形，以及 Responses 上下文管理 |
    | `openrouter-thinking` | 用于代理路由的 OpenRouter reasoning 包装器，集中处理不支持模型和 `auto` 跳过 |
    | `tool-stream-default-on` | 为像 Z.AI 这样希望默认启用工具流式传输、除非显式禁用的提供商提供默认开启的 `tool_stream` 包装器 |

    真实的内置示例：

    - `google`：`google-thinking`
    - `kilocode`：`kilocode-thinking`
    - `moonshot`：`moonshot-thinking`
    - `minimax` 和 `minimax-portal`：`minimax-fast-mode`
    - `openai` 和 `openai-codex`：`openai-responses-defaults`
    - `openrouter`：`openrouter-thinking`
    - `zai`：`tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` 还会导出 replay-family
    枚举以及这些系列所基于的共享辅助函数。常见的公共导出包括：

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - 共享回放构建器，例如 `buildOpenAICompatibleReplayPolicy(...)`、
      `buildAnthropicReplayPolicyForModel(...)`、
      `buildGoogleGeminiReplayPolicy(...)` 和
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini 回放辅助函数，例如 `sanitizeGoogleGeminiReplayHistory(...)`
      和 `resolveTaggedReasoningOutputMode()`
    - 端点/模型辅助函数，例如 `resolveProviderEndpoint(...)`、
      `normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)` 和
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` 同时公开 family 构建器以及这些 family 复用的公共包装辅助函数。
    常见的公共导出包括：

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - 共享 OpenAI/Codex 包装器，例如
      `createOpenAIAttributionHeadersWrapper(...)`、
      `createOpenAIFastModeWrapper(...)`、
      `createOpenAIServiceTierWrapper(...)`、
      `createOpenAIResponsesContextManagementWrapper(...)` 和
      `createCodexNativeWebSearchWrapper(...)`
    - 共享代理/提供商包装器，例如 `createOpenRouterWrapper(...)`、
      `createToolStreamWrapper(...)` 和 `createMinimaxFastModeWrapper(...)`

    某些流式辅助函数有意保持为提供商本地。当前内置
    示例：`@openclaw/anthropic-provider` 导出
    `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及来自其公共 `api.ts` /
    `contract-api.ts` 接缝的更底层 Anthropic 包装器构建器。之所以这些辅助函数仍然保持为 Anthropic 专用，
    是因为它们还编码了 Claude OAuth beta 处理和 `context1m` 门控。

    其他内置提供商也会在行为无法在 family 之间干净共享时，将传输协议专用包装器保留在本地。
    当前示例：内置 xAI 插件将原生 xAI Responses 整形保留在它自己的
    `wrapStreamFn` 中，包括 `/fast` 别名重写、默认 `tool_stream`、
    对不受支持 strict-tool 的清理，以及移除 xAI 专用的 reasoning 负载。

    `openclaw/plugin-sdk/provider-tools` 当前公开一个共享的
    工具 schema 系列，以及共享的 schema/兼容性辅助函数：

    - `ProviderToolCompatFamily` 记录了当前共享 family 清单。
    - `buildProviderToolCompatFamilyHooks("gemini")` 为需要 Gemini 安全工具 schema 的提供商接入 Gemini schema
      清理 + 诊断。
    - `normalizeGeminiToolSchemas(...)` 和 `inspectGeminiToolSchemas(...)`
      是底层的公共 Gemini schema 辅助函数。
    - `resolveXaiModelCompatPatch()` 返回内置的 xAI compat patch：
      `toolSchemaProfile: "xai"`、不支持的 schema 关键字、原生
      `web_search` 支持，以及 HTML 实体形式 tool-call 参数的解码。
    - `applyXaiModelCompat(model)` 会在解析后的模型到达运行器之前，
      对其应用同样的 xAI compat patch。

    真实的内置示例：xAI 插件使用 `normalizeResolvedModel` 加上
    `contributeResolvedModelCompat`，使兼容性元数据由提供商自己持有，
    而不是在核心中硬编码 xAI 规则。

    其他内置提供商也采用相同的软件包根模式：

    - `@openclaw/openai-provider`：`api.ts` 导出提供商构建器、
      默认模型辅助函数和 realtime 提供商构建器
    - `@openclaw/openrouter-provider`：`api.ts` 导出提供商构建器
      以及新手引导/配置辅助函数

    <Tabs>
      <Tab title="令牌交换">
        对于那些在每次推理调用之前都需要进行令牌交换的提供商：

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="自定义请求头">
        对于那些需要自定义请求头或请求体修改的提供商：

        ```typescript
        // wrapStreamFn 返回一个从 ctx.streamFn 派生的 StreamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="原生传输协议标识">
        对于那些在通用 HTTP 或 WebSocket 传输协议上需要原生请求/会话头或元数据的提供商：

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="用量和计费">
        对于那些公开用量/计费数据的提供商：

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="所有可用的提供商 hooks">
      OpenClaw 会按照以下顺序调用 hooks。大多数提供商只会使用 2-3 个：

      | # | Hook | 适用场景 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或默认 `baseUrl` |
      | 2 | `applyConfigDefaults` | 在配置具体化期间应用由提供商持有的全局默认值 |
      | 3 | `normalizeModelId` | 在查找前清理旧版/预览版模型 id 别名 |
      | 4 | `normalizeTransport` | 在通用模型组装前清理 provider-family `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 标准化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生流式使用量兼容性重写 |
      | 7 | `resolveConfigApiKey` | 由提供商持有的环境标记凭证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或基于配置的合成凭证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将合成的已存配置档占位符置于环境变量/配置凭证之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 解析前进行异步元数据获取 |
      | 12 | `normalizeResolvedModel` | 运行器之前的传输协议重写 |

      运行时回退说明：

      - `normalizeConfig` 会先检查匹配的提供商，然后再检查其他
        具备 hook 能力的提供商插件，直到某个插件确实改写了配置。
        如果没有任何提供商 hook 重写受支持的 Google family 配置项，
        内置的 Google 配置标准化器仍会生效。
      - `resolveConfigApiKey` 在公开该 hook 时会使用提供商 hook。内置的
        `amazon-bedrock` 路径在这里还带有一个内建的 AWS 环境标记解析器，
        即使 Bedrock 运行时凭证本身仍然使用 AWS SDK 默认
        链。
      | 13 | `contributeResolvedModelCompat` | 为运行在另一个兼容传输协议之后的供应商模型提供兼容性标志 |
      | 14 | `capabilities` | 旧版静态能力包；仅为兼容性保留 |
      | 15 | `normalizeToolSchemas` | 在注册前由提供商持有的工具 schema 清理 |
      | 16 | `inspectToolSchemas` | 由提供商持有的工具 schema 诊断 |
      | 17 | `resolveReasoningOutputMode` | 标记型还是原生 reasoning-output 契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义的 StreamFn 传输协议 |
      | 20 | `wrapStreamFn` | 常规流路径上的自定义头/请求体包装器 |
      | 21 | `resolveTransportTurnState` | 原生逐轮请求头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS 会话头/冷却 |
      | 23 | `formatApiKey` | 自定义运行时令牌形态 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 凭证修复指引 |
      | 26 | `matchesContextOverflowError` | 由提供商持有的上下文溢出检测 |
      | 27 | `classifyFailoverReason` | 由提供商持有的限流/过载分类 |
      | 28 | `isCacheTtlEligible` | prompt cache TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失凭证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏过时的上游条目 |
      | 31 | `augmentModelCatalog` | 合成的前向兼容条目 |
      | 32 | `isBinaryThinking` | 二进制 thinking 开/关 |
      | 33 | `supportsXHighThinking` | `xhigh` reasoning 支持 |
      | 34 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略 |
      | 35 | `isModernModelRef` | live/smoke 模型匹配 |
      | 36 | `prepareRuntimeAuth` | 推理前的令牌交换 |
      | 37 | `resolveUsageAuth` | 自定义用量凭证解析 |
      | 38 | `fetchUsageSnapshot` | 自定义用量端点 |
      | 39 | `createEmbeddingProvider` | 用于记忆/搜索的、由提供商持有的嵌入适配器 |
      | 40 | `buildReplayPolicy` | 自定义转录回放/压缩策略 |
      | 41 | `sanitizeReplayHistory` | 通用清理之后的提供商专用回放重写 |
      | 42 | `validateReplayTurns` | 在嵌入式运行器之前进行严格的回放轮次校验 |
      | 43 | `onModelSelected` | 选择模型后的回调（例如遥测） |

      Prompt 调优说明：

      - `resolveSystemPromptContribution` 允许提供商为某个模型 family 注入具备缓存感知能力的
        system prompt 指引。当某个行为属于单个提供商/模型 family，
        并且应该保留稳定/动态缓存拆分时，优先使用它，而不是
        `before_prompt_build`。

      有关详细说明和真实示例，请参见
      [内部机制：提供商运行时 Hooks](/zh-CN/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    <a id="step-5-add-extra-capabilities"></a>
    提供商插件除了文本推理外，还可以注册语音、实时转录、实时语音、
    媒体理解、图像生成、视频生成、web 抓取
    和 web 搜索：

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Realtime Voice",
        isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
        createBridge: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          setMediaTimestamp: () => {},
          submitToolResult: () => {},
          acknowledgeMark: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "通过 Acme 的渲染后端抓取页面。",
        envVars: ["ACME_FETCH_API_KEY"],
        placeholder: "acme-...",
        signupUrl: "https://acme.example.com/fetch",
        credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
        getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
        setCredentialValue: (fetchConfigTarget, value) => {
          const acme = (fetchConfigTarget.acme ??= {});
          acme.apiKey = value;
        },
        createTool: () => ({
          description: "通过 Acme Fetch 抓取页面。",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    OpenClaw 会将其归类为 **hybrid-capability** 插件。这是
    公司插件（每个厂商一个插件）的推荐模式。请参见
    [内部机制：能力归属](/zh-CN/plugins/architecture#capability-ownership-model)。

    对于视频生成，优先使用上面展示的具备模式感知能力的能力结构：
    `generate`、`imageToVideo` 和 `videoToVideo`。较旧的扁平字段，
    如 `maxInputImages`、`maxInputVideos` 和 `maxDurationSeconds`
    仍然可作为汇总回退上限使用，但它们无法同样清晰地描述按模式区分的限制
    或已禁用的转换模式。

  </Step>

  <Step title="测试">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // 从 index.ts 或单独文件中导出你的 provider 配置对象
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## 发布到 ClawHub

提供商插件的发布方式与任何其他外部代码插件相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

这里不要使用旧版仅供 Skills 使用的发布别名；插件包应使用
`clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 元数据
├── openclaw.plugin.json      # 带有 providerAuthEnvVars 的清单
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # 用量端点（可选）
```

## 目录顺序参考

`catalog.order` 用于控制你的目录相对于内置
提供商的合并时机：

| 顺序 | 时机 | 用例 |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一轮 | 普通 API 密钥提供商 |
| `profile` | 在 simple 之后 | 受凭证配置档控制的提供商 |
| `paired`  | 在 profile 之后 | 合成多个相关条目 |
| `late`    | 最后一轮 | 覆盖现有提供商（冲突时获胜） |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 如果你的插件还提供一个渠道
- [SDK 运行时](/zh-CN/plugins/sdk-runtime) — `api.runtime` 辅助函数（TTS、搜索、subagent）
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整的子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture#provider-runtime-hooks) — hook 细节和内置示例
