---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或软件包打包
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载管线、注册表、运行时钩子、HTTP 路由和参考表格
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-24T20:18:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

对于公开的能力模型、插件形态，以及所有权 / 执行契约，请参见 [Plugin architecture](/zh-CN/plugins/architecture)。本页是内部机制的参考文档：加载管线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和架构表。

## 加载管线

启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 清单以及软件包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；未构建的原生插件使用 `jiti`
7. 调用原生 `register(api)` 钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令 / 运行时表面

<Note>
`activate` 是 `register` 的旧别名 —— 加载器会解析存在的那个（`def.register ?? def.activate`），并在同一时机调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门禁会在运行时执行**之前**发生。当入口逃逸出插件根目录、路径对所有用户可写，或对于非内置插件而言路径所有权看起来可疑时，候选项会被阻止。

### Manifest 优先行为

manifest 是控制平面的事实来源。OpenClaw 会用它来：

- 标识插件
- 发现已声明的渠道 / Skills / 配置 schema 或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签 / 占位文本
- 显示安装 / 目录元数据
- 在不加载插件运行时的情况下保留轻量的激活和设置描述符

对于原生插件，运行时模块是数据平面部分。它负责注册实际行为，例如钩子、工具、命令或提供商流程。

可选的 manifest `activation` 和 `setup` 块仍然留在控制平面。它们只是用于激活规划和设置发现的元数据描述符；不会替代运行时注册、`register(...)` 或 `setupEntry`。
首批实时激活消费者现在会使用 manifest 中的命令、渠道和提供商提示，在更广泛的注册表实例化之前缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- 渠道设置 / 插件解析会缩小到拥有所请求渠道 id 的插件
- 显式的提供商设置 / 运行时解析会缩小到拥有所请求提供商 id 的插件

激活规划器既为现有调用方暴露仅含 id 的 API，也为新的诊断功能暴露 plan API。Plan 条目会报告某个插件为何被选中，并将显式的 `activation.*` 规划提示与 manifest 所有权回退原因分开，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks。这种原因拆分就是兼容性边界：现有插件元数据会继续工作，而新代码则可以检测宽泛提示或回退行为，而无需改变运行时加载语义。

设置发现现在会优先使用描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，先缩小候选插件范围；然后才会回退到 `setup-api`，以兼容仍然需要设置阶段运行时钩子的插件。提供商设置流程会先使用 manifest `providerAuthChoices`，然后出于兼容性考虑再回退到运行时向导选项和安装目录选项。显式的 `setup.requiresRuntime: false` 是仅限描述符的截断；如果省略 `requiresRuntime`，则会保留旧版 `setup-api` 回退逻辑以确保兼容。如果发现多个插件声明了同一个规范化后的设置提供商或 CLI 后端 id，设置查找会拒绝这个有歧义的所有者，而不是依赖发现顺序。当设置运行时确实执行时，注册表诊断会报告 `setup.providers` / `setup.cliBackends` 与由 `setup-api` 注册的提供商或 CLI 后端之间的漂移，但不会阻止旧版插件。

### 加载器会缓存什么

OpenClaw 会保留短生命周期的进程内缓存，用于：

- 发现结果
- manifest 注册表数据
- 已加载的插件注册表

这些缓存可减少突发启动开销和重复命令开销。你可以把它们理解为短期性能缓存，而不是持久化存储。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 可使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接修改随意的核心全局状态。它们会注册到一个中心化的插件注册表中。

注册表会跟踪：

- 插件记录（标识、来源、源头、状态、诊断）
- 工具
- 旧版 hooks 和类型化 hooks
- 渠道
- 提供商
- gateway RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

随后，核心功能会从该注册表读取内容，而不是直接与插件模块交互。这样可以让加载保持单向：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性非常重要。它意味着大多数核心表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在批准结果确定后作出响应。

使用 `api.onConversationBindingResolved(...)`，可在绑定请求被批准或拒绝后收到回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 现在已为此插件 + 会话创建绑定。
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
- `binding`：已批准请求对应的解析后绑定
- `request`：原始请求摘要、分离提示、发送者 id 和会话元数据

此回调仅用于通知。它不会改变谁被允许绑定会话，并且会在核心审批处理完成后运行。

## 提供商运行时钩子

提供商插件分为三层：

- **Manifest 元数据**，用于廉价的运行时前查找：
  `setup.providers[].envVars`、已弃用的兼容字段 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置阶段钩子**：`catalog`（旧称 `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，覆盖认证、模型解析、
  流包装、思考级别、重放策略和使用量端点。完整列表请参见
  [Hook order and usage](#hook-order-and-usage)。

OpenClaw 仍然负责通用的智能体循环、故障转移、转录处理和工具策略。这些钩子是提供商特定行为的扩展表面，因此无需整套自定义推理传输也能实现扩展。

当提供商具有基于环境变量的凭证，并且希望通用认证 / 状态 / 模型选择器路径无需加载插件运行时就能看到这些凭证时，请使用 manifest `setup.providers[].envVars`。已弃用的 `providerAuthEnvVars` 在弃用窗口期内仍会被兼容适配器读取，而使用它的非内置插件会收到 manifest 诊断。当某个提供商 id 应复用另一个提供商 id 的环境变量、认证配置文件、基于配置的认证以及 API 密钥新手引导选项时，请使用 manifest `providerAuthAliases`。当新手引导 / 认证选项 CLI 表面需要在不加载提供商运行时的情况下知道该提供商的 choice id、分组标签和简单的单标志认证接线时，请使用 manifest `providerAuthChoices`。提供商运行时的 `envVars` 应保留给面向运维人员的提示，例如新手引导标签或 OAuth 客户端 id / 客户端密钥设置变量。

当某个渠道具有由环境变量驱动的认证或设置，并且通用 shell 环境回退、配置 / 状态检查或设置提示需要在不加载渠道运行时的情况下看到这些信息时，请使用 manifest `channelEnvVars`。

### Hook 顺序和用法

对于模型 / 提供商插件，OpenClaw 会大致按以下顺序调用 hooks。
“何时使用”这一列是快速决策指南。

| #   | Hook                              | 作用                                                                 | 何时使用                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | `catalog`                         | 在生成 `models.json` 期间，将提供商配置发布到 `models.providers` 中 | 提供商拥有目录或基础 URL 默认值                                          |
| 2   | `applyConfigDefaults`             | 在配置实例化期间应用由提供商拥有的全局配置默认值                    | 默认值依赖于认证模式、环境或提供商模型族语义                            |
| --  | _(built-in model lookup)_         | OpenClaw 会先尝试常规注册表 / 目录路径                              | _(不是插件 hook)_                                                        |
| 3   | `normalizeModelId`                | 在查找前规范化旧版或预览版 model-id 别名                            | 提供商拥有在规范模型解析前进行别名清理的逻辑                            |
| 4   | `normalizeTransport`              | 在通用模型组装前规范化提供商族的 `api` / `baseUrl`                  | 提供商拥有同一传输族中自定义提供商 id 的传输清理逻辑                    |
| 5   | `normalizeConfig`                 | 在运行时 / 提供商解析前规范化 `models.providers.<id>`               | 提供商需要应与插件放在一起的配置清理；内置的 Google 族辅助逻辑也会为受支持的 Google 配置项提供兜底 |
| 6   | `applyNativeStreamingUsageCompat` | 将原生流式使用量兼容性重写应用到配置提供商                          | 提供商需要基于端点驱动的原生流式使用量元数据修复                        |
| 7   | `resolveConfigApiKey`             | 在加载运行时认证前，为配置提供商解析 env-marker 认证                | 提供商拥有由提供商控制的 env-marker API 密钥解析；`amazon-bedrock` 这里也有内置的 AWS env-marker 解析器 |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的情况下暴露本地 / 自托管或基于配置的认证             | 提供商可以使用合成 / 本地凭证标记运行                                   |
| 9   | `resolveExternalAuthProfiles`     | 叠加由提供商拥有的外部认证配置文件；默认 `persistence` 为 `runtime-only`，适用于由 CLI / 应用拥有的凭证 | 提供商可复用外部认证凭证，而无需持久化复制的刷新令牌；请在 manifest 中声明 `contracts.externalAuthProviders` |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符优先级降到环境 / 基于配置的认证之后     | 提供商会存储合成占位配置文件，而这些配置文件不应具有更高优先级          |
| 11  | `resolveDynamicModel`             | 为本地注册表中尚不存在的由提供商拥有的模型 id 提供同步回退          | 提供商接受任意上游模型 id                                               |
| 12  | `prepareDynamicModel`             | 先进行异步预热，然后再次运行 `resolveDynamicModel`                  | 提供商在解析未知 id 之前需要网络元数据                                  |
| 13  | `normalizeResolvedModel`          | 在嵌入式运行器使用已解析模型前执行最终重写                          | 提供商需要传输重写，但仍使用核心传输                                    |
| 14  | `contributeResolvedModelCompat`   | 为位于其他兼容传输后的供应商模型提供兼容标记                        | 提供商能够在代理传输上识别自己的模型，而无需接管该提供商                |
| 15  | `capabilities`                    | 由共享核心逻辑使用的、由提供商拥有的转录 / 工具元数据               | 提供商需要处理转录 / 提供商族特有行为                                   |
| 16  | `normalizeToolSchemas`            | 在嵌入式运行器看到工具 schema 之前对其进行规范化                    | 提供商需要针对传输族进行 schema 清理                                    |
| 17  | `inspectToolSchemas`              | 在规范化后暴露由提供商拥有的 schema 诊断                            | 提供商希望给出关键字警告，而不需要让核心学习提供商特定规则              |
| 18  | `resolveReasoningOutputMode`      | 选择原生或带标签的推理输出契约                                      | 提供商需要带标签的推理 / 最终输出，而不是原生字段                       |
| 19  | `prepareExtraParams`              | 在通用流选项包装器之前进行请求参数规范化                            | 提供商需要默认请求参数或按提供商进行参数清理                            |
| 20  | `createStreamFn`                  | 用自定义传输完全替换常规流路径                                      | 提供商需要自定义线协议，而不只是包装器                                  |
| 21  | `wrapStreamFn`                    | 在应用通用包装器后再包装流函数                                      | 提供商需要请求头 / 请求体 / 模型兼容包装器，但不需要自定义传输          |
| 22  | `resolveTransportTurnState`       | 附加原生的每轮传输头或元数据                                        | 提供商希望通用传输发送提供商原生的轮次标识                              |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 头或会话冷却策略                                 | 提供商希望通用 WS 传输调整会话头或回退策略                              |
| 24  | `formatApiKey`                    | 认证配置文件格式化器：已存储的配置文件会变成运行时 `apiKey` 字符串  | 提供商存储了额外认证元数据，并需要自定义运行时令牌形态                  |
| 25  | `refreshOAuth`                    | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新逻辑                   | 提供商不适用共享的 `pi-ai` 刷新器                                       |
| 26  | `buildAuthDoctorHint`             | 当 OAuth 刷新失败时附加修复提示                                     | 提供商在刷新失败后需要由提供商控制的认证修复指导                        |
| 27  | `matchesContextOverflowError`     | 由提供商拥有的上下文窗口溢出匹配器                                  | 提供商存在原始溢出错误，而通用启发式无法识别                            |
| 28  | `classifyFailoverReason`          | 由提供商拥有的故障转移原因分类                                      | 提供商可以将原始 API / 传输错误映射为限流 / 过载等                      |
| 29  | `isCacheTtlEligible`              | 面向代理 / 回程提供商的提示缓存策略                                 | 提供商需要代理特定的缓存 TTL 门控                                       |
| 30  | `buildMissingAuthMessage`         | 替换通用的缺失认证恢复消息                                          | 提供商需要提供商特定的缺失认证恢复提示                                  |
| 31  | `suppressBuiltInModel`            | 过时上游模型抑制，并可附带面向用户的错误提示                        | 提供商需要隐藏过时的上游条目，或用供应商提示替换它们                    |
| 32  | `augmentModelCatalog`             | 在发现后附加合成 / 最终目录条目                                     | 提供商需要在 `models list` 和选择器中提供合成的前向兼容条目             |
| 33  | `resolveThinkingProfile`          | 为特定模型设置 `/think` 级别、显示标签和默认值                      | 提供商为选定模型提供自定义思考层级或二元标签                            |
| 34  | `isBinaryThinking`                | 开 / 关推理切换兼容性 hook                                          | 提供商只暴露二元的思考开 / 关                                            |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性 hook                                         | 提供商只希望在部分模型上启用 `xhigh`                                    |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性 hook                                       | 提供商拥有某个模型族的默认 `/think` 策略                                |
| 37  | `isModernModelRef`                | 用于实时配置文件过滤和 smoke 选择的现代模型匹配器                   | 提供商拥有实时 / smoke 首选模型匹配逻辑                                 |
| 38  | `prepareRuntimeAuth`              | 在推理前将已配置的凭证交换为实际运行时令牌 / 密钥                  | 提供商需要令牌交换或短期请求凭证                                        |
| 39  | `resolveUsageAuth`                | 为 `/usage` 及相关状态表面解析使用量 / 计费凭证                    | 提供商需要自定义使用量 / 配额令牌解析，或需要不同的使用量凭证           |
| 40  | `fetchUsageSnapshot`              | 在认证解析后获取并规范化提供商特定的使用量 / 配额快照             | 提供商需要提供商特定的使用量端点或负载解析器                            |
| 41  | `createEmbeddingProvider`         | 为 memory / 搜索构建由提供商拥有的嵌入适配器                       | Memory 嵌入行为应归属于提供商插件                                       |
| 42  | `buildReplayPolicy`               | 返回一个重放策略，用于控制该提供商的转录处理                       | 提供商需要自定义转录策略（例如移除 thinking 块）                        |
| 43  | `sanitizeReplayHistory`           | 在通用转录清理后重写重放历史                                       | 提供商需要超出共享压缩辅助逻辑之外的、提供商特定的重放重写              |
| 44  | `validateReplayTurns`             | 在嵌入式运行器之前，对重放轮次进行最终验证或重塑                   | 提供商传输在通用净化后需要更严格的轮次验证                              |
| 45  | `onModelSelected`                 | 运行由提供商拥有的选择后副作用                                     | 当某个模型变为活动状态时，提供商需要遥测或由提供商拥有的状态            |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查匹配到的提供商插件，然后继续回退到其他具备 hook 能力的提供商插件，直到某个插件实际更改了模型 id 或传输 / 配置。这样可以让别名 / 兼容性提供商 shim 继续工作，而不要求调用方知道哪个内置插件拥有该重写逻辑。如果没有任何提供商 hook 重写受支持的 Google 族配置项，那么内置的 Google 配置规范化器仍会应用该兼容性清理。

如果提供商需要完全自定义的线协议或自定义请求执行器，那就是另一类扩展。这些 hooks 适用于仍运行在 OpenClaw 常规推理循环上的提供商行为。

### 提供商示例

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

内置提供商插件会组合使用上述 hooks，以适配各个供应商在目录、认证、思考、重放和使用量方面的需求。权威的 hook 集合位于各插件在 `extensions/` 下的实现中；本页旨在说明这些形态，而不是镜像整份列表。

<AccordionGroup>
  <Accordion title="直通目录提供商">
    OpenRouter、Kilocode、Z.AI、xAI 会注册 `catalog` 以及
    `resolveDynamicModel` / `prepareDynamicModel`，以便它们能在
    OpenClaw 的静态目录之前暴露上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和使用量端点提供商">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 会将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配合使用，以控制令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理家族">
    共享的命名家族（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）允许提供商通过
    `buildReplayPolicy` 选择加入转录策略，而不需要每个插件都重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录提供商">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 只注册 `catalog`，并复用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 专用流辅助工具">
    Beta 头、`/fast` / `serviceTier` 和 `context1m` 位于
    Anthropic 插件公开的 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），
    而不在通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分核心辅助工具。以 TTS 为例：

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

- `textToSpeech` 返回文件 / 语音便笺表面使用的常规核心 TTS 输出负载。
- 使用核心 `messages.tts` 配置和提供商选择逻辑。
- 返回 PCM 音频缓冲区 + 采样率。插件必须自行针对提供商执行重采样 / 编码。
- `listVoices` 对每个提供商而言是可选的。可用于由供应商拥有的语音选择器或设置流程。
- 语音列表可包含更丰富的元数据，例如语言区域、性别和个性标签，以支持提供商感知型选择器。
- 目前只有 OpenAI 和 ElevenLabs 支持电话语音。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册语音提供商。

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
- 使用语音提供商实现由供应商拥有的合成行为。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` 提供商 id。
- 推荐的所有权模型以公司为导向：随着 OpenClaw 增加这些能力契约，一个供应商插件可以统一拥有文本、语音、图像以及未来的媒体提供商。

对于图像 / 音频 / 视频理解，插件应注册一个类型化的媒体理解提供商，而不是通用键 / 值包：

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
- 将供应商行为保留在提供商插件中。
- 增量扩展应保持类型化：新增可选方法、新增可选结果字段、新增可选能力。
- 视频生成已经遵循相同模式：
  - 核心拥有能力契约和运行时辅助工具
  - 供应商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能 / 渠道插件消费 `api.runtime.videoGeneration.*`

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

对于音频转录，插件既可以使用媒体理解运行时，也可以使用较旧的 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // 当无法可靠推断 MIME 时可选：
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像 / 音频 / 视频理解的首选共享表面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和提供商回退顺序。
- 当未产生转录输出时返回 `{ text: undefined }`（例如输入被跳过 / 不受支持）。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留为兼容性别名。

插件也可以通过 `api.runtime.subagent` 启动后台子智能体运行：

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

- `provider` 和 `model` 是每次运行可选的覆盖项，不是持久化的会话变更。
- OpenClaw 只会为受信任调用方接受这些覆盖字段。
- 对于插件拥有的回退运行，运维人员必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任插件限制到特定规范 `provider/model` 目标，或设为 `"*"` 以显式允许任意目标。
- 非受信任插件的子智能体运行仍可正常工作，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以使用共享运行时辅助工具，而不必深入智能体工具接线：

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

插件也可以通过 `api.registerWebSearchProvider(...)` 注册 Web 搜索提供商。

说明：

- 将提供商选择、凭证解析和共享请求语义保留在核心中。
- 使用 Web 搜索提供商实现供应商特定的搜索传输。
- `api.runtime.webSearch.*` 是需要搜索行为但不依赖智能体工具包装器的功能 / 渠道插件首选共享表面。

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

- `generate(...)`：使用已配置的图像生成提供商链生成图像。
- `listProviders(...)`：列出可用的图像生成提供商及其能力。

## Gateway 网关 HTTP 路由

插件可以使用 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

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
- `auth`：必填。使用 `"gateway"` 要求常规 Gateway 网关认证，或使用 `"plugin"` 进行插件管理的认证 / webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换自己已存在的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。请仅在相同认证级别上保留 `exact` / `prefix` 贯穿链。
- `auth: "plugin"` 路由**不会**自动接收运维人员运行时作用域。它们用于插件管理的 webhook / 签名验证，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域有意保持保守：
  - 共享密钥 bearer 认证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes` 也是如此
  - 受信任的携带身份 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）只有在显式存在该头时，才会接受 `x-openclaw-scopes`
  - 如果这些携带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退到 `operator.write`
- 实际规则：不要假设使用 gateway 认证的插件路由天然就是隐式管理员表面。如果你的路由需要仅管理员可用的行为，请要求使用携带身份的认证模式，并记录显式的 `x-openclaw-scopes` 头契约。

## 插件 SDK 导入路径

编写新插件时，请使用窄化的 SDK 子路径，而不是单体式的 `openclaw/plugin-sdk` 根 barrel。核心子路径如下：

| 子路径                              | 用途                         |
| ----------------------------------- | ---------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语                 |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口 / 构建辅助工具      |
| `openclaw/plugin-sdk/core`          | 通用共享辅助工具和总括契约   |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema（`OpenClawSchema`） |

渠道插件可从一组窄化接缝中选择 —— `channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。审批行为应统一到单一的 `approvalCapability` 契约上，而不是混杂在不相关的插件字段之间。参见 [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于对应的 `*-runtime` 子路径下
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用 —— 它只是面向旧插件的兼容性 shim。新代码应改为导入更窄化的通用原语。
</Info>

仓库内部入口点（按每个内置插件软件包根目录划分）：

- `index.js` —— 内置插件入口
- `api.js` —— 辅助工具 / 类型 barrel
- `runtime-api.js` —— 仅运行时 barrel
- `setup-entry.js` —— 设置插件入口

外部插件只能导入 `openclaw/plugin-sdk/*` 子路径。切勿从核心或另一个插件中导入其他插件软件包的 `src/*`。
通过 facade 加载的入口点会优先使用当前活动的运行时配置快照；如果不存在，则回退到磁盘上的已解析配置文件。

像 `image-generation`、`media-understanding` 和 `speech` 这样的能力专用子路径之所以存在，是因为内置插件目前在使用它们。它们并不自动构成长期冻结的外部契约 —— 在依赖这些路径时，请查阅相应的 SDK 参考页。

## 消息工具 schema

对于表情反应、已读和投票等非消息原语，插件应自行负责渠道特定的 `describeMessageTool(...)` schema 扩展。共享发送展示应使用通用 `MessagePresentation` 契约，而不是提供商原生的按钮、组件、块或卡片字段。
有关契约、回退规则、提供商映射和插件作者检查清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件会通过消息能力声明它们可以渲染的内容：

- `presentation`，用于语义化展示块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin`，用于固定投递请求

核心决定是原生渲染该展示，还是将其降级为文本。
不要从通用消息工具中暴露提供商原生 UI 的逃生舱。
面向旧版原生 schema 的已弃用 SDK 辅助工具仍会为现有第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应自行负责渠道特定的目标语义。保持共享出站宿主通用，并使用消息适配器表面来处理提供商规则：

- `messaging.inferTargetChatType({ to })` 决定在目录查找之前，规范化目标应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心某个输入是否应直接跳到类 id 解析，而不是目录搜索。
- `messaging.targetResolver.resolveTarget(...)` 是当核心在规范化之后或目录未命中之后需要最终由提供商拥有的解析时，插件提供的回退逻辑。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析完成后负责提供商特定的会话路由构建。

推荐拆分方式：

- 将 `inferTargetChatType` 用于应在搜索联系人 / 群组之前发生的类别决策。
- 将 `looksLikeId` 用于“将其视为显式 / 原生目标 id”的检查。
- 将 `resolveTarget` 用于提供商特定的规范化回退，而不是用于广泛的目录搜索。
- 将 chat id、thread id、JID、handle 和 room id 等提供商原生 id 保留在 `target` 值或提供商特定参数中，而不是放入通用 SDK 字段。

## 基于配置的目录

如果插件根据配置派生目录条目，应将这部分逻辑保留在插件中，并复用
`openclaw/plugin-sdk/directory-runtime` 提供的共享辅助工具。

适用场景包括：当某个渠道需要基于配置的联系人 / 群组时，例如：

- 基于 allowlist 的私信联系人
- 已配置的渠道 / 群组映射
- 按账户作用域划分的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制数量应用
- 去重 / 规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## 提供商目录

提供商插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })`
定义用于推理的模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入
`models.providers` 中相同的结构：

- `{ provider }`：单个提供商条目
- `{ providers }`：多个提供商条目

当插件拥有提供商特定的模型 id、基础 URL 默认值或受认证门控的模型元数据时，请使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw 内置隐式提供商的合并时机：

- `simple`：普通 API 密钥或环境变量驱动的提供商
- `profile`：存在认证配置文件时出现的提供商
- `paired`：合成多个相关提供商条目的提供商
- `late`：最后一轮，在其他隐式提供商之后

后面的提供商会在键冲突时胜出，因此插件可以有意用相同的提供商 id 覆盖内置提供商条目。

兼容性说明：

- `discovery` 仍作为旧别名可用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，请优先实现
`plugin.config.inspectAccount(cfg, accountId)`，并与 `resolveAccount(...)` 配套使用。

原因如下：

- `resolveAccount(...)` 是运行时路径。它可以假设凭证已完全实例化，并在缺少必需密钥时快速失败。
- 像 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve` 以及 doctor / config 修复流程这样的只读命令路径，不应仅为了描述配置就去实例化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源 / 状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你无需返回原始令牌值来报告只读可用性。返回 `tokenStatus: "available"`（以及对应的来源字段）就足以用于状态类命令。
- 当凭证通过 SecretRef 配置但在当前命令路径中不可用时，请使用 `configured_unavailable`。

这样，只读命令就能报告“已配置，但在当前命令路径中不可用”，而不是崩溃或误报该账户未配置。

## 软件包打包

插件目录可以包含一个带有 `openclaw.extensions` 的 `package.json`：

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
会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，以确保
`node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须仍位于插件目录内。任何逃逸出软件包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖
（无生命周期脚本，运行时不安装开发依赖）。
请保持插件依赖树为“纯 JS/TS”，并避免依赖需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。
当 OpenClaw 需要为已禁用的渠道插件提供设置表面，或某个渠道插件已启用但尚未配置时，它会加载 `setupEntry`，而不是完整插件入口。这样当你的主插件入口还会接线工具、hooks 或其他仅运行时代码时，就能让启动和设置过程更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让渠道插件在 Gateway 网关监听前的启动阶段，也使用同一个
`setupEntry` 路径，即使该渠道已经配置完成。

仅当 `setupEntry` 完全覆盖 Gateway 网关开始监听前必须存在的启动表面时，才应使用此选项。实际上，这意味着设置入口必须注册启动所依赖的每一项由渠道拥有的能力，例如：

- 渠道注册本身
- 在 Gateway 网关开始监听之前必须可用的任何 HTTP 路由
- 在同一时间窗口内必须存在的任何 gateway 方法、工具或服务

如果你的完整入口仍拥有任何必需的启动能力，就不要启用此标志。请保持插件采用默认行为，并让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅设置的契约表面辅助工具，供核心在完整渠道运行时加载之前查询。当前的设置提升表面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当核心需要在不加载完整插件入口的情况下，将旧版单账户渠道配置提升到 `channels.<id>.accounts.*` 时，就会使用这套表面。
Matrix 是当前的内置示例：当已存在命名账户时，它只会把认证 / 引导键移动到某个命名的提升账户中；并且它可以保留已配置的非规范默认账户键，而不是总是创建 `accounts.default`。

这些设置补丁适配器让内置契约表面发现保持惰性。导入时开销保持轻量；提升表面只会在首次使用时加载，而不是在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 gateway RPC 方法时，请将它们保留在插件专用前缀下。核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍然是保留的，并且始终解析为 `operator.admin`，即使插件请求了更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 宣传设置 / 发现元数据，并通过 `openclaw.install` 宣传安装提示。这样可以让核心目录不携带数据。

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
      "blurb": "通过 Nextcloud Talk webhook bot 实现的自托管聊天。",
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

除了最小示例外，`openclaw.channel` 还有一些实用字段：

- `detailLabel`：用于更丰富目录 / 状态表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：该目录条目应优先于哪些更低优先级的插件 / 渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面的文案控制
- `markdownCapable`：将该渠道标记为支持 Markdown，以供出站格式化决策使用
- `exposure.configured`：设为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设为 `false` 时，在交互式设置 / 配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部 / 私有，以供文档导航表面使用
- `showConfigured` / `showInSetup`：为兼容性保留的旧别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道选择加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM 注册表导出）。将 JSON 文件放到以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（用逗号 / 分号 / `PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧别名。

生成的渠道目录条目和提供商安装目录条目会在原始 `openclaw.install` 块旁边暴露规范化后的安装源事实。这些规范化事实可标识 npm spec 是精确版本还是浮动选择器、是否存在预期的完整性元数据，以及本地源路径是否也可用。当已知目录 / 软件包标识时，如果解析出的 npm 包名偏离该标识，规范化事实会发出警告。它们还会在 `defaultChoice` 无效、指向不可用源，或存在 npm 完整性元数据却没有有效 npm 源时发出警告。消费者应将 `installSource` 视为附加的可选字段，这样较旧的手工构建条目和兼容性 shim 就不必合成它。这样，新手引导和诊断就能解释源平面状态，而无需导入插件运行时。

官方外部 npm 条目应优先使用精确的 `npmSpec` 加上 `expectedIntegrity`。仅包名和 dist-tag 仍可用于兼容性，但它们会暴露源平面警告，以便目录逐步迁移到固定版本、带完整性校验的安装方式，而不会破坏现有插件。当新手引导从本地目录路径安装时，它会记录一个带有 `source: "path"` 的 `plugins.installs` 条目，并在可能时记录工作区相对的 `sourcePath`。绝对的实际加载路径仍保留在 `plugins.load.paths` 中；安装记录会避免将本地工作站路径重复写入长期配置。这使本地开发安装对源平面诊断可见，同时不会新增第二个原始文件系统路径暴露表面。

## 上下文引擎插件

上下文引擎插件负责会话上下文编排，包括摄取、组装和压缩。通过
`api.registerContextEngine(id, factory)` 从你的插件中注册它们，然后通过
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文管线，而不只是添加 memory 搜索或 hooks 时，请使用这种方式。

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

当插件需要当前 API 无法容纳的行为时，不要通过私有直连绕过插件系统。请补充缺失的能力。

推荐顺序：

1. 定义核心契约  
   决定哪些共享行为应由核心拥有：策略、回退、配置合并、生命周期、面向渠道的语义，以及运行时辅助工具形态。
2. 添加类型化的插件注册 / 运行时表面  
   使用最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和 / 或 `api.runtime`。
3. 连接核心 + 渠道 / 功能消费者  
   渠道和功能插件应通过核心消费该新能力，而不是直接导入某个供应商实现。
4. 注册供应商实现  
   然后由供应商插件针对该能力注册其后端实现。
5. 添加契约覆盖  
   添加测试，以便随着时间推移，所有权和注册形态始终保持明确。

这就是 OpenClaw 在保持明确主张的同时，不会被硬编码到某一个提供商世界观中的方式。有关具体文件检查清单和完整示例，请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加新能力时，实现通常应同时涉及以下表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器 / 运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能 / 渠道插件需要消费它时，位于 `src/plugins/runtime/*` 中的插件运行时暴露层
- `src/test-utils/plugin-registration.ts` 中的捕获 / 测试辅助工具
- `src/plugins/contracts/registry.ts` 中的所有权 / 契约断言
- `docs/` 中面向运维人员 / 插件作者的文档

如果其中某个表面缺失，通常说明该能力尚未完全集成。

### 能力模板

最小模式：

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契约测试模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

这样可保持规则简单明了：

- 核心拥有能力契约 + 编排
- 供应商插件拥有供应商实现
- 功能 / 渠道插件消费运行时辅助工具
- 契约测试让所有权始终明确

## 相关内容

- [Plugin architecture](/zh-CN/plugins/architecture) —— 公开能力模型和形态
- [Plugin SDK subpaths](/zh-CN/plugins/sdk-subpaths)
- [Plugin SDK setup](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
