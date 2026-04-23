---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想将一个 OpenAI 兼容代理或自定义 LLM 添加到 OpenClaw 中
    - 你需要了解提供商的身份验证、目录和运行时 hook
sidebarTitle: Provider plugins
summary: 构建 OpenClaw 模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-04-23T23:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d92a91da77880a685f4bcdf9fb20fca339de72d08ed6ff8541dc09120d33f243
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

本指南将带你构建一个提供商插件，为 OpenClaw 添加一个模型提供商（LLM）。完成后，你将拥有一个具备模型目录、API 密钥身份验证和动态模型解析的提供商。

<Info>
  如果你还没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础包结构和 manifest 设置。
</Info>

<Tip>
  提供商插件会将模型接入 OpenClaw 的常规推理循环。如果该模型必须通过一个拥有线程、压缩或工具事件的原生智能体守护进程运行，请将该提供商与 [agent harness](/zh-CN/plugins/sdk-agent-harness) 配合使用，而不要把守护进程协议细节放入核心中。
</Tip>

## 教程步骤

<Steps>
  <Step title="包和 manifest">
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
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    manifest 声明了 `providerAuthEnvVars`，这样 OpenClaw 就可以在不加载你的插件运行时的情况下检测凭证。当某个提供商变体应复用另一个提供商 ID 的身份验证时，请添加 `providerAuthAliases`。`modelSupport`
    是可选项，它允许 OpenClaw 在运行时 hook 存在之前，就能从像 `acme-large` 这样的简写模型 ID 自动加载你的提供商插件。如果你要在 ClawHub 上发布该提供商，那么 `package.json` 中的这些 `openclaw.compat` 和 `openclaw.build` 字段是必需的。

  </Step>

  <Step title="注册提供商">
    一个最小可用的提供商需要 `id`、`label`、`auth` 和 `catalog`：

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
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
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
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

    这就是一个可用的提供商。用户现在可以执行
    `openclaw onboard --acme-ai-api-key <key>`，并选择
    `acme-ai/acme-large` 作为模型。

    如果上游提供商使用的控制标记与 OpenClaw 不同，请添加一个小型双向文本转换，而不是替换流路径：

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` 会在传输前重写最终系统提示和文本消息内容。`output` 会在 OpenClaw 解析其自身控制标记或执行渠道投递前，重写助手文本增量和最终文本。

    对于仅注册一个文本提供商、使用 API 密钥身份验证并且只带有一个由 catalog 支撑的运行时的内置提供商，请优先使用更窄的
    `defineSingleProviderPluginEntry(...)` 辅助工具：

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` 是 OpenClaw 能解析真实提供商身份验证时所使用的实时 catalog 路径。它可以执行提供商专属发现。
    `buildStaticProvider` 仅用于在配置身份验证前可安全显示的离线条目；它不得要求凭证，也不得发起网络请求。
    OpenClaw 的 `models list --all` 当前仅对内置提供商插件执行静态 catalog，并且执行环境是空配置、空环境，以及无 agent/workspace 路径。

    如果你的身份验证流程还需要在 onboarding 期间修补 `models.providers.*`、别名以及智能体默认模型，请使用
    `openclaw/plugin-sdk/provider-onboard` 中的 preset 辅助工具。最窄的辅助工具包括
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    当某个提供商的原生端点在正常 `openai-completions` 传输上支持流式 usage 块时，请优先使用
    `openclaw/plugin-sdk/provider-catalog-shared` 中的共享 catalog 辅助工具，而不是硬编码 provider-id 检查。
    `supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 会从端点能力映射中检测支持情况，因此即使插件使用的是自定义 provider ID，原生 Moonshot/DashScope 风格端点也仍可选择加入。

  </Step>

  <Step title="添加动态模型解析">
    如果你的提供商接受任意模型 ID（例如代理或路由器），请添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

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

    如果解析需要网络调用，请使用 `prepareDynamicModel` 进行异步预热——完成后会再次运行 `resolveDynamicModel`。

  </Step>

  <Step title="按需添加运行时 hook">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。只有在你的提供商确实需要时，再逐步添加 hook。

    共享辅助构建器现在已覆盖最常见的 replay/tool-compat 家族，因此插件通常不需要再手动逐个连接每个 hook：

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

    当前可用的 replay 家族：

    | 家族 | 它接入的内容 | 内置示例 |
    | --- | --- | --- |
    | `openai-compatible` | 面向 OpenAI 兼容传输的共享 OpenAI 风格 replay 策略，包括工具调用 ID 清理、assistant-first 顺序修复，以及在传输需要时进行通用 Gemini 轮次校验 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 按 `modelId` 选择的 Claude 感知 replay 策略，因此只有当解析出的模型实际是 Claude ID 时，Anthropic message 传输才会获得 Claude 专属的 thinking block 清理 | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 原生 Gemini replay 策略，加上 bootstrap replay 清理和带标签的推理输出模式 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 面向通过 OpenAI 兼容代理传输运行的 Gemini 模型的 Gemini thought-signature 清理；不会启用原生 Gemini replay 校验或 bootstrap 重写 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 用于在一个插件中混合 Anthropic message 和 OpenAI 兼容模型界面的提供商的混合策略；可选的 Claude 专属 thinking block 丢弃仍仅作用于 Anthropic 一侧 | `minimax` |

    当前可用的 stream 家族：

    | 家族 | 它接入的内容 | 内置示例 |
    | --- | --- | --- |
    | `google-thinking` | 在共享流路径上对 Gemini thinking 负载进行标准化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 在共享代理流路径上为 Kilo 推理提供包装器，并在 `kilo/auto` 和不支持的代理推理 ID 情况下跳过注入 thinking | `kilocode` |
    | `moonshot-thinking` | 根据配置和 `/think` 级别对 Moonshot 二进制原生 thinking 负载进行映射 | `moonshot` |
    | `minimax-fast-mode` | 在共享流路径上对 MiniMax fast mode 模型进行重写 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses 包装器：归属头、`/fast`/`serviceTier`、文本详细度、原生 Codex web 搜索、reasoning 兼容负载整形，以及 Responses 上下文管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | 面向代理路由的 OpenRouter 推理包装器，并集中处理不支持模型/`auto` 跳过逻辑 | `openrouter` |
    | `tool-stream-default-on` | 对于像 Z.AI 这样除非显式禁用否则希望启用工具流式传输的提供商，默认开启 `tool_stream` 包装器 | `zai` |

    <Accordion title="为 family builders 提供支持的 SDK 接缝">
      每个 family builder 都由同一包中导出的更底层公共辅助工具组合而成。当某个提供商需要偏离常见模式时，你可以直接使用这些工具：

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始 replay builder（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。还导出 Gemini replay 辅助工具（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）以及 endpoint/model 辅助工具（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共享的 OpenAI/Codex 包装器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）和共享的代理/提供商包装器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、底层 Gemini 模式辅助工具（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`），以及 xAI 兼容辅助工具（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。内置 xAI 插件会配合这些工具使用 `normalizeResolvedModel` + `contributeResolvedModelCompat`，以确保 xAI 规则由该提供商自行维护。

      一些流辅助工具有意保留在 provider 本地。`@openclaw/anthropic-provider` 将 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及更底层的 Anthropic 包装器构建器保留在其自己的公共 `api.ts` / `contract-api.ts` 接缝中，因为它们编码了 Claude OAuth beta 处理和 `context1m` 门控。xAI 插件同样将原生 xAI Responses 整形保留在其自己的 `wrapStreamFn` 中（`/fast` 别名、默认 `tool_stream`、不支持的严格工具清理、xAI 专属 reasoning 负载移除）。

      同样的包根模式也支撑着 `@openclaw/openai-provider`（provider 构建器、默认模型辅助工具、实时 provider 构建器）和 `@openclaw/openrouter-provider`（provider 构建器以及 onboarding/配置辅助工具）。
    </Accordion>

    <Tabs>
      <Tab title="令牌交换">
        对于需要在每次推理调用前执行令牌交换的提供商：

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
        对于需要自定义请求头或请求体修改的提供商：

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
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
      <Tab title="原生传输身份">
        对于在通用 HTTP 或 WebSocket 传输上需要原生请求/会话头或元数据的提供商：

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
      <Tab title="用量与计费">
        对于暴露用量/计费数据的提供商：

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

    <Accordion title="所有可用的提供商 hook">
      OpenClaw 按以下顺序调用 hook。大多数提供商只会用到 2-3 个：

      | # | Hook | 适用场景 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或 `baseUrl` 默认值 |
      | 2 | `applyConfigDefaults` | 在配置实例化期间应用由提供商自有的全局默认值 |
      | 3 | `normalizeModelId` | 在查找前清理旧版/预览版模型 ID 别名 |
      | 4 | `normalizeTransport` | 在通用模型组装前清理 provider family 的 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 标准化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 为配置提供商重写原生流式用量兼容性 |
      | 7 | `resolveConfigApiKey` | 提供商自有的环境标记身份验证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或基于配置的合成身份验证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将合成存储配置文件占位符排在环境/配置身份验证之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 在解析前异步获取元数据 |
      | 12 | `normalizeResolvedModel` | 在 runner 前重写传输 |
      | 13 | `contributeResolvedModelCompat` | 为运行在另一兼容传输后的厂商模型提供兼容标志 |
      | 14 | `capabilities` | 旧版静态能力包；仅为兼容性保留 |
      | 15 | `normalizeToolSchemas` | 在注册前清理由提供商拥有的工具模式 |
      | 16 | `inspectToolSchemas` | 由提供商拥有的工具模式诊断 |
      | 17 | `resolveReasoningOutputMode` | 带标签与原生 reasoning-output 契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义的 `StreamFn` 传输 |
      | 20 | `wrapStreamFn` | 在正常流路径上包装自定义头/请求体 |
      | 21 | `resolveTransportTurnState` | 原生的逐轮请求头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS 会话头/降级冷却 |
      | 23 | `formatApiKey` | 自定义运行时令牌形态 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 身份验证修复指导 |
      | 26 | `matchesContextOverflowError` | 由提供商自有的上下文溢出检测 |
      | 27 | `classifyFailoverReason` | 由提供商自有的限流/过载分类 |
      | 28 | `isCacheTtlEligible` | 提示缓存 TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失身份验证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏过时的上游条目 |
      | 31 | `augmentModelCatalog` | 合成的前向兼容条目 |
      | 32 | `resolveThinkingProfile` | 模型专属 `/think` 选项集 |
      | 33 | `isBinaryThinking` | 二元 thinking 开/关兼容性 |
      | 34 | `supportsXHighThinking` | `xhigh` 推理支持兼容性 |
      | 35 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略兼容性 |
      | 36 | `isModernModelRef` | 实时/冒烟模型匹配 |
      | 37 | `prepareRuntimeAuth` | 推理前的令牌交换 |
      | 38 | `resolveUsageAuth` | 自定义用量凭证解析 |
      | 39 | `fetchUsageSnapshot` | 自定义用量端点 |
      | 40 | `createEmbeddingProvider` | 由提供商拥有的 memory/search 嵌入适配器 |
      | 41 | `buildReplayPolicy` | 自定义转录回放/压缩策略 |
      | 42 | `sanitizeReplayHistory` | 在通用清理后执行提供商专属回放重写 |
      | 43 | `validateReplayTurns` | 在嵌入式运行器前进行严格回放轮次校验 |
      | 44 | `onModelSelected` | 选择后的回调（例如遥测） |

      运行时回退说明：

      - `normalizeConfig` 会先检查匹配的提供商，然后再检查其他具备 hook 能力的提供商插件，直到某个插件实际修改了配置为止。如果没有任何提供商 hook 重写某个受支持的 Google family 配置项，仍会应用内置的 Google 配置标准化器。
      - `resolveConfigApiKey` 在暴露相应 hook 时会使用提供商 hook。内置 `amazon-bedrock` 路径在这里也有一个内建 AWS 环境标记解析器，尽管 Bedrock 运行时身份验证本身仍使用 AWS SDK 默认链。
      - `resolveSystemPromptContribution` 允许提供商为某个模型 family 注入具备缓存感知能力的系统提示指导。若行为属于某个单一提供商/模型 family，并且应保留稳定/动态缓存拆分，请优先使用它，而不是 `before_prompt_build`。

      有关详细说明和真实示例，请参阅 [Internals: Provider Runtime Hooks](/zh-CN/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    提供商插件除了文本推理外，还可以同时注册语音、实时转写、实时语音、媒体理解、图像生成、视频生成、web 抓取和 web 搜索。OpenClaw 将其归类为
    **hybrid-capability** 插件——这是公司级插件的推荐模式（每个厂商一个插件）。参见
    [Internals: Capability Ownership](/zh-CN/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 中，与现有的
    `api.registerProvider(...)` 调用一起注册每项能力。只选择你需要的标签页：

    <Tabs>
      <Tab title="语音（TTS）">
        ```typescript
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
        ```
      </Tab>
      <Tab title="实时转写">
        优先使用 `createRealtimeTranscriptionWebSocketSession(...)`——该共享辅助工具会处理代理捕获、重连退避、关闭时刷新、就绪握手、音频排队和关闭事件诊断。
        你的插件只需要映射上游事件。

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        对于通过 POST multipart 音频的批量 STT 提供商，请使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。该辅助工具会标准化上传文件名，包括那些需要使用 M4A 风格文件名才能兼容转写 API 的 AAC 上传。
      </Tab>
      <Tab title="实时语音">
        ```typescript
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
        ```
      </Tab>
      <Tab title="媒体理解">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="图像和视频生成">
        视频能力使用**具备模式感知**的结构：`generate`、
        `imageToVideo` 和 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 这样的扁平聚合字段，不足以清晰表达变换模式支持或已禁用模式。
        音乐生成也遵循同样的模式，使用显式的 `generate` /
        `edit` 块。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web 抓取和搜索">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
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
            description: "Fetch a page through Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="测试">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
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

这里不要使用旧版仅适用于 Skills 的发布别名；插件包应使用
`clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # 包含 provider auth metadata 的 manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # 用量端点（可选）
```

## Catalog 顺序参考

`catalog.order` 控制你的 catalog 相对于内置提供商的合并时机：

| 顺序 | 时机 | 使用场景 |
| --------- | ------------- | ----------------------------------------------- |
| `simple` | 第一轮 | 纯 API 密钥提供商 |
| `profile` | `simple` 之后 | 由 auth profiles 门控的提供商 |
| `paired` | `profile` 之后 | 合成多个相关条目 |
| `late` | 最后一轮 | 覆盖现有提供商（冲突时胜出） |

## 下一步

- [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins) — 如果你的插件同时也提供渠道
- [插件运行时](/zh-CN/plugins/sdk-runtime) — `api.runtime` 辅助工具（TTS、搜索、子智能体）
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture#provider-runtime-hooks) — hook 细节和内置示例

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [构建渠道插件](/zh-CN/plugins/sdk-channel-plugins)
