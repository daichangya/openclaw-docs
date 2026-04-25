---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或软件包打包 bundles
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载管线、注册表、运行时钩子、HTTP 路由和参考表格
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-25T21:54:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d521f78bbd6aa4da09a28dcffa3c2309d46c8c1ec08f2f6b0616b3c2259339fc
    source_path: plugins/architecture-internals.md
    workflow: 15
---

对于公开的能力模型、插件形状以及所有权/执行契约，请参阅 [插件架构](/zh-CN/plugins/architecture)。本页是内部机制的参考文档：加载管线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和模式表。

## 加载管线

在启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 清单以及软件包元数据
3. 拒绝不安全的候选项
4. 标准化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选项是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 `jiti`
7. 调用原生 `register(api)` 钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令/运行时表面

<Note>
`activate` 是 `register` 的旧别名——加载器会解析当前存在的那个（`def.register ?? def.activate`），并在相同位置调用它。所有内置插件都使用 `register`；新插件优先使用 `register`。
</Note>

安全门禁发生在**运行时执行之前**。当入口逃逸出插件根目录、路径对所有用户可写，或对于非内置插件而言路径所有权看起来可疑时，候选项会被阻止。

### 清单优先行为

清单是控制平面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现声明的渠道/Skills/配置模式或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据
- 在不加载插件运行时的情况下保留轻量的激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它会注册实际行为，例如钩子、工具、命令或 provider 流程。

可选的清单 `activation` 和 `setup` 块仍然保留在控制平面。它们是仅含元数据的描述符，用于激活规划和设置发现；它们不会替代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活使用方现在会使用清单中的命令、渠道和 provider 提示，在更广泛的注册表实体化之前缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置/插件解析会缩小到拥有所请求渠道 id 的插件
- 显式 provider 设置/运行时解析会缩小到拥有所请求 provider id 的插件

激活规划器同时为现有调用方提供仅含 id 的 API，也为新的诊断能力提供 plan API。计划条目会报告插件为何被选中，将显式 `activation.*` 规划器提示与清单所有权回退分开，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子。这个原因拆分是兼容性边界：现有插件元数据会继续生效，而新代码可以检测宽泛提示或回退行为，而无需改变运行时加载语义。

设置发现现在会优先使用描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，以便在回退到 `setup-api` 之前先缩小候选插件范围；`setup-api` 用于那些仍然需要设置阶段运行时钩子的插件。provider 设置流程会优先使用清单 `providerAuthChoices`，然后为兼容性回退到运行时向导选项和安装目录选项。显式 `setup.requiresRuntime: false` 是仅描述符层面的截断；省略 `requiresRuntime` 则会为兼容性保留旧版 `setup-api` 回退。如果发现多个插件声称拥有相同的标准化设置 provider 或 CLI backend id，设置查找会拒绝这个有歧义的所有者，而不是依赖发现顺序。当设置运行时确实执行时，注册表诊断会报告 `setup.providers` / `setup.cliBackends` 与由 `setup-api` 注册的 providers 或 CLI backends 之间的偏差，但不会阻止旧版插件。

### 加载器缓存的内容

OpenClaw 会保留一些短生命周期的进程内缓存，用于：

- 发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存可减少突发启动开销和重复命令开销。可以安全地将它们视为短期性能缓存，而不是持久化。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改随意的核心全局状态。它们会注册到一个中央插件注册表中。

注册表会跟踪：

- 插件记录（标识、来源、源头、状态、诊断）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- providers
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

然后，核心功能会从该注册表中读取，而不是直接与插件模块通信。这样可以保持单向加载：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“对每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在审批结果确定时作出响应。

使用 `api.onConversationBindingResolved(...)` 可在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 现在此插件 + 会话已存在一个绑定。
        console.log(event.binding?.conversationId);
        return;
      }

      // 请求被拒绝；清除任何本地待处理状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：用于已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 和会话元数据

这个回调仅用于通知。它不会改变谁被允许绑定会话，并且会在核心审批处理完成后运行。

## Provider 运行时钩子

Provider 插件有三层：

- **清单元数据**，用于低成本的运行前查找：
  `setup.providers[].envVars`、已弃用的兼容性 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置阶段钩子**：`catalog`（旧称 `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，涵盖认证、模型解析、
  流包装、思考级别、重放策略和用量端点。完整列表见
  [Hook order and usage](#hook-order-and-usage)。

OpenClaw 仍然拥有通用的 智能体 loop、故障切换、转录处理和工具策略。这些钩子是 provider 特定行为的扩展表面，而不需要整个自定义推理传输层。

当 provider 具有基于环境变量的凭证，并且通用认证/Status/模型选择器路径需要在不加载插件运行时的情况下看到这些凭证时，请使用清单 `setup.providers[].envVars`。已弃用的 `providerAuthEnvVars` 在弃用窗口期间仍会被兼容适配器读取，使用它的非内置插件会收到一条清单诊断信息。当一个 provider id 应复用另一个 provider id 的环境变量、auth 配置文件、配置支持的认证以及 API 密钥新手引导选项时，请使用清单 `providerAuthAliases`。当新手引导/认证选择 CLI 表面需要在不加载 provider 运行时的情况下了解 provider 的 choice id、分组标签和简单的单标志认证接线时，请使用清单 `providerAuthChoices`。将 provider 运行时的 `envVars` 保留给面向操作员的提示，例如新手引导标签或 OAuth client-id/client-secret 设置变量。

当一个渠道具有由环境变量驱动的认证或设置，并且通用 shell 环境变量回退、配置/Status 检查或设置提示需要在不加载渠道运行时的情况下看到这些信息时，请使用清单 `channelEnvVars`。

### 钩子顺序和用法

对于模型/provider 插件，OpenClaw 会按大致如下顺序调用钩子。
“何时使用”列是快速决策指南。

| #   | 钩子 | 作用 | 何时使用 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在生成 `models.json` 期间，将 provider 配置发布到 `models.providers` 中 | provider 拥有目录或基础 URL 默认值 |
| 2   | `applyConfigDefaults`             | 在配置实体化期间应用 provider 拥有的全局配置默认值 | 默认值依赖于认证模式、环境变量或 provider 模型族语义 |
| --  | _(内置模型查找)_         | OpenClaw 会先尝试常规的注册表/目录路径 | _(不是插件钩子)_ |
| 3   | `normalizeModelId`                | 在查找前标准化旧版或预览版 model-id 别名 | provider 在规范模型解析前拥有别名清理逻辑 |
| 4   | `normalizeTransport`              | 在通用模型组装前，标准化 provider 族的 `api` / `baseUrl` | provider 在同一传输族中为自定义 provider id 拥有传输清理逻辑 |
| 5   | `normalizeConfig`                 | 在运行时/provider 解析前标准化 `models.providers.<id>` | provider 需要应与插件一起维护的配置清理逻辑；内置的 Google 族辅助逻辑也会为受支持的 Google 配置项提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 将原生流式用量兼容性重写应用到配置 providers | provider 需要基于端点的原生流式用量元数据修复 |
| 7   | `resolveConfigApiKey`             | 在运行时认证加载前，为配置 providers 解析环境变量标记认证 | provider 拥有自己的环境变量标记 API key 解析逻辑；`amazon-bedrock` 在这里也有一个内置的 AWS 环境变量标记解析器 |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的情况下暴露本地/自托管或配置支持的认证 | provider 可通过合成/本地凭证标记运行 |
| 9   | `resolveExternalAuthProfiles`     | 叠加 provider 拥有的外部认证配置文件；默认 `persistence` 为 `runtime-only`，适用于 CLI/应用拥有的凭证 | provider 可复用外部认证凭证，而无需持久化复制的 refresh token；请在清单中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符优先级降到环境变量/配置支持认证之后 | provider 存储了不应获得更高优先级的合成占位配置文件 |
| 11  | `resolveDynamicModel`             | 对尚未出现在本地注册表中的 provider 拥有模型 id 进行同步回退 | provider 接受任意上游模型 id |
| 12  | `prepareDynamicModel`             | 先执行异步预热，然后再次运行 `resolveDynamicModel` | provider 在解析未知 id 之前需要网络元数据 |
| 13  | `normalizeResolvedModel`          | 在嵌入式运行器使用已解析模型前执行最终重写 | provider 需要传输重写，但仍使用核心传输 |
| 14  | `contributeResolvedModelCompat`   | 为位于另一兼容传输之后的厂商模型提供兼容性标志 | provider 可在不接管该 provider 的前提下，在代理传输上识别自己的模型 |
| 15  | `capabilities`                    | 由共享核心逻辑使用的 provider 拥有的转录/工具元数据 | provider 需要转录/provider 族特有差异处理 |
| 16  | `normalizeToolSchemas`            | 在嵌入式运行器看到它们之前标准化工具模式 | provider 需要传输族级别的模式清理 |
| 17  | `inspectToolSchemas`              | 在标准化后暴露 provider 拥有的模式诊断 | provider 希望提供关键字警告，而不需要教会核心 provider 特定规则 |
| 18  | `resolveReasoningOutputMode`      | 选择原生推理输出契约还是带标签的推理输出契约 | provider 需要带标签的推理/最终输出，而不是原生字段 |
| 19  | `prepareExtraParams`              | 在通用流选项包装器之前标准化请求参数 | provider 需要默认请求参数或按 provider 清理参数 |
| 20  | `createStreamFn`                  | 用自定义传输完全替换常规流路径 | provider 需要自定义线协议，而不仅仅是包装器 |
| 21  | `wrapStreamFn`                    | 在应用通用包装器之后对流函数再做包装 | provider 需要请求头/请求体/模型兼容性包装器，但不需要自定义传输 |
| 22  | `resolveTransportTurnState`       | 附加原生的逐轮传输头或元数据 | provider 希望通用传输发送 provider 原生轮次标识 |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 头或会话冷却策略 | provider 希望通用 WS 传输调整会话头或回退策略 |
| 24  | `formatApiKey`                    | 认证配置文件格式化器：将已存储配置文件转换为运行时 `apiKey` 字符串 | provider 存储额外认证元数据，并需要自定义运行时令牌形状 |
| 25  | `refreshOAuth`                    | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑 | provider 不适用于共享的 `pi-ai` 刷新器 |
| 26  | `buildAuthDoctorHint`             | 当 OAuth 刷新失败时附加修复提示 | provider 在刷新失败后需要 provider 自有的认证修复指引 |
| 27  | `matchesContextOverflowError`     | provider 自有的上下文窗口溢出匹配器 | provider 存在通用启发式无法识别的原始溢出错误 |
| 28  | `classifyFailoverReason`          | provider 自有的故障切换原因分类 | provider 可将原始 API/传输错误映射为限流/过载等原因 |
| 29  | `isCacheTtlEligible`              | 面向代理/回传 providers 的提示缓存策略 | provider 需要代理特定的缓存 TTL 门控 |
| 30  | `buildMissingAuthMessage`         | 替换通用的缺失认证恢复消息 | provider 需要 provider 特定的缺失认证恢复提示 |
| 31  | `suppressBuiltInModel`            | 过时上游模型抑制，并可选提供面向用户的错误提示 | provider 需要隐藏过时的上游条目，或用厂商提示替换它们 |
| 32  | `augmentModelCatalog`             | 在发现之后追加合成/最终目录条目 | provider 需要在 `models list` 和选择器中提供合成的前向兼容条目 |
| 33  | `resolveThinkingProfile`          | 针对特定模型设置 `/think` 级别、显示标签和默认值 | provider 为选定模型提供自定义思考层级或二元标签 |
| 34  | `isBinaryThinking`                | 开/关推理切换兼容性钩子 | provider 只暴露二元的思考开/关 |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性钩子 | provider 希望仅在部分模型上启用 `xhigh` |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性钩子 | provider 拥有某个模型族的默认 `/think` 策略 |
| 37  | `isModernModelRef`                | 用于实时配置文件过滤和 smoke 选择的现代模型匹配器 | provider 拥有实时/smoke 首选模型匹配逻辑 |
| 38  | `prepareRuntimeAuth`              | 在推理之前，将已配置凭证交换为实际运行时令牌/key | provider 需要令牌交换或短生命周期请求凭证 |
| 39  | `resolveUsageAuth`                | 为 `/usage` 及相关 Status 表面解析用量/计费凭证 | provider 需要自定义用量/配额令牌解析，或使用不同的用量凭证 |
| 40  | `fetchUsageSnapshot`              | 在认证解析完成后获取并标准化 provider 特定的用量/配额快照 | provider 需要 provider 特定的用量端点或负载解析器 |
| 41  | `createEmbeddingProvider`         | 为 memory/搜索构建 provider 自有的嵌入适配器 | Memory 嵌入行为应归属于 provider 插件 |
| 42  | `buildReplayPolicy`               | 返回一个重放策略，用于控制该 provider 的转录处理 | provider 需要自定义转录策略（例如，移除 thinking 块） |
| 43  | `sanitizeReplayHistory`           | 在通用转录清理之后重写重放历史 | provider 需要超出共享压缩辅助工具之外的 provider 特定重放重写 |
| 44  | `validateReplayTurns`             | 在嵌入式运行器之前对重放轮次进行最终验证或重塑 | provider 传输在通用清理之后需要更严格的轮次验证 |
| 45  | `onModelSelected`                 | 在模型被选中后运行 provider 自有的后置副作用 | 当模型变为活动状态时，provider 需要遥测或 provider 自有状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配的 provider 插件，然后继续尝试其他具备钩子能力的 provider 插件，直到某个插件实际更改了模型 id 或传输/配置为止。这样可以让别名/兼容 provider shim 正常工作，而无需调用方知道哪个内置插件拥有该重写逻辑。如果没有 provider 钩子重写受支持的 Google 族配置项，内置的 Google 配置标准化器仍会应用该兼容性清理。

如果 provider 需要完全自定义的线协议或自定义请求执行器，那属于另一类扩展。这些钩子适用于仍运行在 OpenClaw 常规推理 loop 上的 provider 行为。

### Provider 示例

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 内置示例

内置 provider 插件会组合使用上述钩子，以适配各个厂商的目录、认证、思考、重放和用量需求。权威钩子集合与各个插件一起保存在 `extensions/` 下；本页说明其形状，而不是镜像完整列表。

<AccordionGroup>
  <Accordion title="透传目录 providers">
    OpenRouter、Kilocode、Z.AI、xAI 注册 `catalog` 以及
    `resolveDynamicModel` / `prepareDynamicModel`，从而可以在 OpenClaw 的静态目录之前暴露上游
    模型 id。
  </Accordion>
  <Accordion title="OAuth 和用量端点 providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配对使用，以负责令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理族">
    共享命名族（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）允许 providers 通过
    `buildReplayPolicy` 选择转录策略，而不是让每个插件都重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录 providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只注册 `catalog`，并使用共享推理 loop。
  </Accordion>
  <Accordion title="Anthropic 特定流辅助工具">
    Beta 请求头、`/fast` / `serviceTier` 以及 `context1m` 位于
    Anthropic 插件公开的 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是放在
    通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助工具

插件可以通过 `api.runtime` 访问选定的核心辅助工具。对于 TTS：

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

说明：

- `textToSpeech` 返回用于文件/语音便笺表面的常规核心 TTS 输出负载。
- 使用核心 `messages.tts` 配置和 provider 选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为 providers 重新采样/编码。
- `listVoices` 对每个 provider 而言都是可选的。将其用于厂商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如区域设置、性别和个性标签，以用于 provider 感知的选择器。
- 目前 OpenAI 和 ElevenLabs 支持电话场景。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册语音 providers。

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

说明：

- 将 TTS 策略、回退和回复投递保留在核心中。
- 将语音 providers 用于厂商自有的合成行为。
- 旧版 Microsoft `edge` 输入会被标准化为 `microsoft` provider id。
- 首选的所有权模型是面向公司的：随着 OpenClaw 增加这些
  能力契约，一个厂商插件可以同时拥有文本、语音、图像以及未来的媒体 providers。

对于图像/音频/视频理解，插件会注册一个带类型的
媒体理解 provider，而不是通用的键/值包：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

说明：

- 将编排、回退、配置和渠道接线保留在核心中。
- 将厂商行为保留在 provider 插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选
  结果字段、新的可选能力。
- 视频生成已经遵循同样的模式：
  - 核心拥有能力契约和运行时辅助工具
  - 厂商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件使用 `api.runtime.videoGeneration.*`

对于媒体理解运行时辅助工具，插件可以调用：

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

对于音频转录，插件可以使用媒体理解运行时
或较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // 当无法可靠推断 MIME 时可选：
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享表面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和 provider 回退顺序。
- 当未产生转录输出时返回 `{ text: undefined }`（例如输入被跳过/不受支持）。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留为兼容性别名。

插件还可以通过 `api.runtime.subagent` 启动后台 subagent 运行：

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

说明：

- `provider` 和 `model` 是每次运行的可选覆盖项，不是持久会话更改。
- OpenClaw 仅对受信任调用方接受这些覆盖字段。
- 对于插件自有的回退运行，操作员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制为特定的规范 `provider/model` 目标，或设为 `"*"` 以显式允许任何目标。
- 不受信任插件的 subagent 运行仍然可用，但覆盖请求会被拒绝，而不是静默回退。

对于 web 搜索，插件可以使用共享运行时辅助工具，而不是
直接深入 智能体 工具接线：

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

插件也可以通过
`api.registerWebSearchProvider(...)` 注册 web 搜索 providers。

说明：

- 将 provider 选择、凭证解析和共享请求语义保留在核心中。
- 将 web 搜索 providers 用于厂商特定的搜索传输。
- `api.runtime.webSearch.*` 是需要搜索行为且不依赖 智能体 工具包装器的功能/渠道插件的首选共享表面。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`：使用已配置的图像生成 provider 链生成图像。
- `listProviders(...)`：列出可用的图像生成 providers 及其能力。

## Gateway 网关 HTTP 路由

插件可以通过 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

路由字段：

- `path`：Gateway 网关 HTTP 服务器下的路由路径。
- `auth`：必填。使用 `"gateway"` 表示需要常规 Gateway 网关认证，或使用 `"plugin"` 表示插件管理的认证/webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换自己现有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。仅在相同认证级别内保留 `exact`/`prefix` 贯穿链。
- `auth: "plugin"` 路由**不会**自动收到操作员运行时作用域。它们用于插件管理的 webhook/签名验证，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由在 Gateway 网关请求运行时作用域内运行，但该作用域是有意保守的：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任的携带身份 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在显式存在该请求头时才接受 `x-openclaw-scopes`
  - 如果这些携带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实用规则：不要假设 gateway-auth 插件路由天然就是管理员表面。如果你的路由需要仅管理员可用的行为，请要求使用携带身份的认证模式，并记录显式 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

在编写新插件时，请使用更窄的 SDK 子路径，而不是单体式的 `openclaw/plugin-sdk` 根 barrel。核心子路径：

| 子路径 | 用途 |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语 |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口/构建辅助工具 |
| `openclaw/plugin-sdk/core`          | 通用共享辅助工具和总括契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 模式（`OpenClawSchema`） |

渠道插件可从一系列窄接缝中选择——`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。审批行为应统一到单一的 `approvalCapability` 契约上，而不是混杂在无关的插件字段之间。参见 [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于对应的 `*-runtime` 子路径下
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用——它是面向旧插件的兼容 shim。新代码应改为导入更窄的通用原语。
</Info>

仓库内部入口点（按每个内置插件软件包根目录划分）：

- `index.js` — 内置插件入口
- `api.js` — 辅助工具/类型 barrel
- `runtime-api.js` — 仅运行时 barrel
- `setup-entry.js` — 设置插件入口

外部插件只能导入 `openclaw/plugin-sdk/*` 子路径。绝不要从核心或另一个插件中导入其他插件软件包的 `src/*`。
Facade 加载的入口点会优先使用当前活动的运行时配置快照；如果不存在，则回退到磁盘上已解析的配置文件。

诸如 `image-generation`、`media-understanding` 和 `speech` 这样的能力专用子路径之所以存在，是因为内置插件目前正在使用它们。它们并不自动成为长期冻结的外部契约——在依赖它们之前，请查阅相应的 SDK 参考页面。

## 消息工具模式

对于反应、已读和投票等非消息原语，插件应自行负责特定渠道的 `describeMessageTool(...)` 模式扩展。
共享发送展示应使用通用 `MessagePresentation` 契约，而不是 provider 原生的按钮、组件、块或卡片字段。
有关该契约、回退规则、provider 映射和插件作者检查清单，请参阅 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件会通过消息能力声明自己能渲染什么：

- `presentation`，用于语义化展示块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`，用于固定投递请求

核心负责决定是原生渲染该展示，还是将其降级为文本。
不要从通用消息工具中暴露 provider 原生 UI 逃生口。
面向旧版原生模式的已弃用 SDK 辅助工具仍会为现有第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应拥有特定渠道的目标语义。保持共享出站主机通用，并使用消息适配器表面处理 provider 规则：

- `messaging.inferTargetChatType({ to })` 决定一个标准化目标在目录查找前应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心，某个输入是否应跳过目录搜索，直接进入类似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是插件的回退路径，当核心在标准化之后或目录未命中之后需要最终由 provider 拥有的解析结果时使用。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后负责 provider 特定的会话路由构造。

推荐拆分方式：

- 对于应在搜索联系人/群组之前发生的分类决策，使用 `inferTargetChatType`。
- 对于“将其视为显式/原生目标 id”的检查，使用 `looksLikeId`。
- 对于 provider 特定的标准化回退，使用 `resolveTarget`，而不是用于广泛的目录搜索。
- 将 chat id、thread id、JID、handle 和 room id 等 provider 原生 id 保留在 `target` 值或 provider 特定参数中，而不是放入通用 SDK 字段。

## 配置支持的目录

如果插件会从配置派生目录条目，则应将这部分逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime`
提供的共享辅助工具。

当某个渠道需要配置支持的联系人/群组时，请使用这种方式，例如：

- 基于 allowlist 的私信联系人
- 已配置的渠道/群组映射
- 按账户划分的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制应用
- 去重/标准化辅助工具
- 构建 `ChannelDirectoryEntry[]`

特定渠道的账户检查和 id 标准化应保留在插件实现中。

## Provider 目录

Provider 插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })`
定义用于推理的模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 时相同的形状：

- `{ provider }`，用于单个 provider 条目
- `{ providers }`，用于多个 provider 条目

当插件拥有 provider 特定的模型 id、基础 URL 默认值或受认证控制的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw
内置隐式 providers 的合并时机：

- `simple`：普通 API key 或环境变量驱动的 providers
- `profile`：存在 auth 配置文件时出现的 providers
- `paired`：合成多个相关 provider 条目的 providers
- `late`：最后一轮，在其他隐式 providers 之后

后出现的 provider 会在键冲突时胜出，因此插件可以有意用相同的 provider id 覆盖内置 provider 条目。

兼容性：

- `discovery` 仍可作为旧别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，最好同时实现
`plugin.config.inspectAccount(cfg, accountId)` 和 `resolveAccount(...)`。

原因如下：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证已经完全实体化，并且在缺少必要 secret 时快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor/config
  修复流程，不应仅为了描述配置就必须实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你不需要为了报告只读可用性而返回原始令牌值。对于 status 风格的命令，返回 `tokenStatus: "available"`（以及对应的来源字段）就足够了。
- 当某个凭证通过 SecretRef 配置，但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样，只读命令就能报告“已配置，但在该命令路径中不可用”，而不是崩溃或错误地将账户报告为未配置。

## 软件包打包 bundles

插件目录可以包含带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都会成为一个插件。如果该 pack 列出了多个扩展，插件 id
将变为 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以便
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接之后都必须保持在插件目录内部。逃逸出软件包目录的条目会被拒绝。

安全说明：`openclaw plugins install` 会使用项目本地的
`npm install --omit=dev --ignore-scripts` 安装插件依赖（无生命周期脚本、运行时无开发依赖），并忽略继承的全局 npm 安装设置。请保持插件依赖树为“纯 JS/TS”，并避免依赖需要
`postinstall` 构建的软件包。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。
当 OpenClaw 需要为已禁用的渠道插件提供设置表面，或者
当某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`，而不是完整的插件入口。这样在你的主插件入口还会接入工具、钩子或其他仅运行时代码时，能让启动和设置过程更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可让某个渠道插件在 Gateway 网关的监听前启动阶段也选择同样的 `setupEntry` 路径，即使该渠道已经配置完成。

只有当 `setupEntry` 能完整覆盖 Gateway 网关开始监听之前必须存在的启动表面时，才应使用此选项。实际而言，这意味着设置入口
必须注册启动所依赖的每一项由渠道拥有的能力，例如：

- 渠道注册本身
- 任何必须在 Gateway 网关开始监听前可用的 HTTP 路由
- 任何在同一时间窗口内必须存在的 Gateway 网关方法、工具或服务

如果你的完整入口仍拥有任何必需的启动能力，请不要启用
此标志。保持插件采用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅设置阶段的契约表面辅助工具，供核心在完整渠道运行时加载前查询。当前的设置提升表面为：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧版单账户渠道配置提升到
`channels.<id>.accounts.*` 时，会使用该表面。
Matrix 是当前的内置示例：当已存在命名账户时，它只会把认证/引导键移动到一个已命名的提升账户中，并且它可以保留一个已配置的非规范默认账户键，而不是总是创建
`accounts.default`。

这些设置补丁适配器让内置契约表面发现保持惰性。导入时开销保持轻量；提升表面只会在首次使用时加载，而不会在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在插件特定前缀下。核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）始终保留，并且总是解析为 `operator.admin`，即使某个插件请求更窄的作用域也是如此。

示例：

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### 渠道目录元数据

渠道插件可以通过 `openclaw.channel` 通告设置/发现元数据，并通过 `openclaw.install` 提供安装提示。这样可以让核心目录保持无数据化。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk（自托管）",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "通过 Nextcloud Talk webhook 机器人实现自托管聊天。",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

除了最小示例之外，其他有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富的目录/Status 表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：此目录条目应优先于的低优先级插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面文案控制
- `markdownCapable`：将该渠道标记为支持 markdown，以用于出站格式决策
- `exposure.configured`：当设为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：当设为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：在文档导航表面中将该渠道标记为内部/私有
- `showConfigured` / `showInSetup`：仍为兼容性接受的旧别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道选择加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM
注册表导出）。将一个 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应
包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧别名。

生成的渠道目录条目和 provider 安装目录条目会在原始 `openclaw.install` 块旁边暴露标准化的安装来源事实。标准化事实会标识 npm 规格是否是精确版本或浮动选择器、是否存在预期的完整性元数据，以及本地源路径是否也可用。当目录/软件包标识已知时，标准化事实会在解析得到的 npm 软件包名偏离该标识时发出警告。它们还会在 `defaultChoice` 无效、指向不可用源，或存在 npm 完整性元数据但没有有效 npm 源时发出警告。使用方应将 `installSource` 视为附加的可选字段，这样较旧的手工构建条目和兼容性 shim 就不必合成它。这使新手引导和诊断能够解释源平面状态，而无需导入插件运行时。

官方外部 npm 条目应优先使用精确的 `npmSpec` 加
`expectedIntegrity`。为兼容性起见，裸软件包名和 dist-tag 仍然可用，但它们会暴露源平面警告，以便目录可以朝着固定版本、带完整性检查的安装方式演进，而不会破坏现有插件。当新手引导从本地目录路径安装时，它会记录一个托管插件安装台账条目，其中包含 `source: "path"`，并在可能时记录相对于工作区的 `sourcePath`。绝对的实际加载路径仍保留在 `plugins.load.paths` 中；安装记录避免将本地工作站路径重复写入长期配置中。这样可让本地开发安装对源平面诊断可见，而不会增加第二个原始文件系统路径暴露表面。旧版 `plugins.installs` 配置条目仍会作为兼容性回退被读取，而状态管理的 `plugins/installs.json` 台账则成为安装来源的事实来源。
`openclaw doctor --fix` 会将这些旧版配置条目迁移到托管台账中，并在不加载插件运行时模块的情况下刷新冷注册表索引。

## 上下文引擎插件

上下文引擎插件拥有用于摄取、组装和压缩的会话上下文编排。通过
`api.registerContextEngine(id, factory)` 从你的插件中注册它们，然后使用
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文管线，而不仅仅是添加 memory 搜索或钩子时，请使用此方式。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

如果你的引擎**不**拥有压缩算法，请保持 `compact()`
已实现，并显式委托它：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 添加新能力

当插件需要当前 API 无法适配的行为时，不要通过私有直连方式绕过
插件系统。请添加缺失的能力。

推荐顺序：

1. 定义核心契约
   决定核心应拥有哪些共享行为：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助工具形状。
2. 添加类型化的插件注册/运行时表面
   使用最小且有用的类型化能力表面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 连接核心 + 渠道/功能使用方
   渠道和功能插件应通过核心消费该新能力，
   而不是直接导入某个厂商实现。
4. 注册厂商实现
   然后由厂商插件针对该能力注册其后端实现。
5. 添加契约覆盖
   添加测试，以便所有权和注册形状能随时间保持明确。

这就是 OpenClaw 保持有主张、同时不被硬编码到某一个
provider 世界观中的方式。有关具体文件检查清单和完整示例，请参阅 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加新能力时，实现通常应同时涉及以下表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器/运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- `src/plugins/runtime/*` 中的插件运行时暴露，当功能/渠道
  插件需要消费它时
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助工具
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中面向操作员/插件的文档

如果这些表面中缺少某一个，通常说明该能力尚未完全集成。

### 能力模板

最小模式：

```ts
// 核心契约
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// 插件 API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// 面向功能/渠道插件的共享运行时辅助工具
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契约测试模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

这样规则就很简单：

- 核心拥有能力契约 + 编排
- 厂商插件拥有厂商实现
- 功能/渠道插件消费运行时辅助工具
- 契约测试让所有权保持明确

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) — 公开能力模型和形状
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
