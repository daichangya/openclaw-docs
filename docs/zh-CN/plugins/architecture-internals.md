---
read_when:
    - 实现提供商运行时钩子、渠道生命周期或软件包打包集
    - 调试插件加载顺序或注册表状态
    - 添加新的插件能力或上下文引擎插件
summary: 插件架构内部机制：加载管线、注册表、运行时钩子、HTTP 路由和参考表格
title: 插件架构内部机制
x-i18n:
    generated_at: "2026-04-25T18:41:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 074b0a0fb1678b73a2c9236fb9fbc208d8e39dcbba39c904b2bd7b5ceac473b6
    source_path: plugins/architecture-internals.md
    workflow: 15
---

关于公开的能力模型、插件形态以及所有权/执行契约，请参见 [插件架构](/zh-CN/plugins/architecture)。本页是内部机制的参考：加载管线、注册表、运行时钩子、Gateway 网关 HTTP 路由、导入路径和模式表。

## 加载管线

启动时，OpenClaw 大致会执行以下步骤：

1. 发现候选插件根目录
2. 读取原生或兼容 bundle 清单以及软件包元数据
3. 拒绝不安全的候选项
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、
   `slots`、`load.paths`）
5. 决定每个候选项是否启用
6. 加载已启用的原生模块：已构建的内置模块使用原生加载器；
   未构建的原生插件使用 `jiti`
7. 调用原生 `register(api)` 钩子，并将注册内容收集到插件注册表中
8. 将注册表暴露给命令/运行时表面

<Note>
`activate` 是 `register` 的旧别名——加载器会解析当前存在的那个（`def.register ?? def.activate`），并在同一时机调用。所有内置插件都使用 `register`；新插件优先使用 `register`。
</Note>

安全门会在运行时执行**之前**发生。当入口逃离插件根目录、路径对所有用户可写，或对于非内置插件而言路径所有权看起来可疑时，候选项会被阻止。

### 清单优先行为

清单是控制面的事实来源。OpenClaw 使用它来：

- 标识插件
- 发现声明的 channels/Skills/配置模式或 bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据
- 在不加载插件运行时的情况下保留低成本激活和设置描述符

对于原生插件，运行时模块是数据面部分。它会注册实际行为，例如钩子、工具、命令或 provider 流程。

可选的清单 `activation` 和 `setup` 块保留在控制面中。
它们只是用于激活规划和设置发现的元数据描述符；
不会替代运行时注册、`register(...)` 或 `setupEntry`。
当前第一批实时激活消费者会使用清单中的命令、渠道和提供商提示，
在更广泛的注册表实体化之前先缩小插件加载范围：

- CLI 加载会缩小到拥有所请求主命令的插件
- channel 设置/插件解析会缩小到拥有所请求
  channel id 的插件
- 显式 provider 设置/运行时解析会缩小到拥有所请求
  provider id 的插件

激活规划器既为现有调用方暴露仅含 id 的 API，也为新的诊断场景暴露
plan API。Plan 条目会报告某个插件为何被选中，
并区分显式 `activation.*` 规划器提示与清单所有权
回退，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、
`contracts.tools` 和钩子。这种原因拆分就是兼容性边界：
现有插件元数据仍然可用，而新代码可以检测宽泛提示
或回退行为，而不改变运行时加载语义。

设置发现现在优先使用描述符拥有的 id，例如 `setup.providers` 和
`setup.cliBackends`，在回退到 `setup-api` 之前先缩小候选插件范围，
以兼容那些仍然需要设置时运行时钩子的插件。Provider 设置流程优先使用清单中的 `providerAuthChoices`，然后为了兼容性再回退到
运行时向导选项和安装目录选项。显式
`setup.requiresRuntime: false` 是仅描述符层面的截断条件；省略
`requiresRuntime` 则为了兼容性保留旧版 `setup-api` 回退。如果有多个
已发现插件声称拥有同一个规范化后的设置 provider 或 CLI
backend id，设置查找会拒绝这个歧义所有者，而不是依赖
发现顺序。当设置运行时确实执行时，注册表诊断会报告
`setup.providers` / `setup.cliBackends` 与由 `setup-api` 注册的 providers 或 CLI
backends 之间的漂移，但不会阻止旧版插件。

### 加载器会缓存什么

OpenClaw 会为以下内容保留短生命周期的进程内缓存：

- 发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存可以减少突发启动成本和重复命令开销。可以安全地将它们视为短生命周期的性能缓存，而不是持久化。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不会直接随意修改 core 的全局状态。它们会注册到一个中心插件注册表中。

注册表会跟踪：

- 插件记录（标识、来源、origin、状态、诊断）
- 工具
- 旧版钩子和类型化钩子
- 渠道
- 提供商
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

然后，core 功能会从该注册表读取，而不是直接与插件模块交互。这样可保持单向加载：

- 插件模块 -> 注册表注册
- core 运行时 -> 注册表消费

这种分离对可维护性很重要。它意味着大多数 core 表面只需要一个集成点：“读取注册表”，而不是“为每个插件模块做特殊处理”。

## 会话绑定回调

绑定会话的插件可以在审批被处理后作出响应。

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
- `binding`：已批准请求的已解析绑定
- `request`：原始请求摘要、detach 提示、发送者 id 和
  会话元数据

此回调仅用于通知。它不会改变谁被允许绑定会话，并且会在 core 审批处理完成后运行。

## provider 运行时钩子

Provider 插件有三层：

- **清单元数据**，用于低成本的预运行时查找：
  `setup.providers[].envVars`、已弃用的兼容字段 `providerAuthEnvVars`、
  `providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时钩子**：`catalog`（旧版 `discovery`）以及
  `applyConfigDefaults`。
- **运行时钩子**：40 多个可选钩子，涵盖身份验证、模型解析、
  流包装、思考等级、重放策略和用量端点。请参见
  [钩子顺序和用法](#hook-order-and-usage) 下的完整列表。

OpenClaw 仍然负责通用的 Agent loop、故障切换、转录处理和工具策略。这些钩子是 provider 特定行为的扩展表面，因此无需整个自定义推理传输层。

当 provider 使用基于环境变量的凭证，并且通用身份验证/状态/模型选择器路径需要在不加载插件运行时的情况下看到这些凭证时，使用清单 `setup.providers[].envVars`。已弃用的 `providerAuthEnvVars` 在弃用窗口期间仍会由兼容适配器读取，而使用它的非内置插件会收到清单诊断。当一个 provider id 应复用另一个 provider id 的环境变量、认证配置文件、基于配置的身份验证和 API 密钥新手引导选项时，使用清单 `providerAuthAliases`。当新手引导/认证选择 CLI 表面需要在不加载 provider 运行时的情况下知道 provider 的 choice id、分组标签和简单单 flag 身份验证接线时，使用清单 `providerAuthChoices`。将 provider 运行时中的
`envVars` 保留给面向运维者的提示，例如新手引导标签或 OAuth
client-id/client-secret 设置变量。

当某个渠道具有由环境变量驱动的身份验证或设置，并且通用 shell 环境变量回退、配置/状态检查或设置提示需要在不加载渠道运行时的情况下看到这些信息时，使用清单 `channelEnvVars`。

### 钩子顺序和用法

对于模型/provider 插件，OpenClaw 大致按以下顺序调用钩子。
“何时使用”列是快速决策指南。

| #   | 钩子                              | 作用                                                                                                   | 何时使用                                                                                                                                   |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | 在生成 `models.json` 期间，将 provider 配置发布到 `models.providers`                                | provider 拥有目录，或拥有基础 URL 默认值                                                                                                  |
| 2   | `applyConfigDefaults`             | 在配置实体化期间应用 provider 拥有的全局配置默认值                                                  | 默认值依赖于身份验证模式、环境变量或 provider 模型家族语义                                                                               |
| --  | _(内置模型查找)_                  | OpenClaw 会先尝试正常的注册表/目录路径                                                              | _(不是插件钩子)_                                                                                                                          |
| 3   | `normalizeModelId`                | 在查找前规范化旧版或预览版 model-id 别名                                                           | provider 在规范模型解析之前负责清理别名                                                                                                  |
| 4   | `normalizeTransport`              | 在通用模型组装前，规范化 provider 家族的 `api` / `baseUrl`                                         | provider 负责清理同一传输家族中自定义 provider id 的传输配置                                                                              |
| 5   | `normalizeConfig`                 | 在运行时/provider 解析前规范化 `models.providers.<id>`                                              | provider 需要将配置清理逻辑放在插件中；内置的 Google 家族辅助逻辑也会为受支持的 Google 配置项提供兜底                                   |
| 6   | `applyNativeStreamingUsageCompat` | 对配置 providers 应用原生流式用量兼容性改写                                                        | provider 需要基于端点的原生流式用量元数据修复                                                                                            |
| 7   | `resolveConfigApiKey`             | 在加载运行时身份验证前，为配置 providers 解析 env-marker 身份验证                                   | provider 拥有自己的 env-marker API 密钥解析；`amazon-bedrock` 在这里也有一个内置 AWS env-marker 解析器                                  |
| 8   | `resolveSyntheticAuth`            | 在不持久化明文的情况下暴露 local/自托管或基于配置的身份验证                                         | provider 可以使用合成/local 凭证标记运行                                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 叠加 provider 拥有的外部认证配置文件；CLI/应用拥有的凭证默认 `persistence` 为 `runtime-only` | provider 复用外部认证凭证，而不持久化复制的刷新令牌；需在清单中声明 `contracts.externalAuthProviders`                                   |
| 10  | `shouldDeferSyntheticProfileAuth` | 将已存储的合成配置文件占位符优先级降到环境变量/基于配置的身份验证之后                              | provider 存储了合成占位配置文件，这些占位项不应获得更高优先级                                                                             |
| 11  | `resolveDynamicModel`             | 为本地注册表中尚不存在的 provider 拥有的模型 id 提供同步回退                                       | provider 接受任意上游模型 id                                                                                                             |
| 12  | `prepareDynamicModel`             | 先进行异步预热，然后再次运行 `resolveDynamicModel`                                                  | provider 在解析未知 id 之前需要网络元数据                                                                                                |
| 13  | `normalizeResolvedModel`          | 在嵌入式运行器使用已解析模型之前进行最终改写                                                        | provider 需要进行传输改写，但仍使用 core 传输                                                                                             |
| 14  | `contributeResolvedModelCompat`   | 为另一种兼容传输背后的 vendor 模型提供兼容性标记                                                   | provider 能在不接管 provider 本身的情况下识别自己的模型在代理传输上的运行                                                                |
| 15  | `capabilities`                    | 由共享 core 逻辑使用的 provider 拥有的转录/工具元数据                                              | provider 需要处理转录或 provider 家族特有行为                                                                                            |
| 16  | `normalizeToolSchemas`            | 在嵌入式运行器看到工具模式之前，对工具模式进行规范化                                                | provider 需要进行传输家族级别的模式清理                                                                                                  |
| 17  | `inspectToolSchemas`              | 在规范化后暴露 provider 拥有的模式诊断                                                             | provider 希望给出关键字警告，而不必让 core 学会 provider 特定规则                                                                         |
| 18  | `resolveReasoningOutputMode`      | 选择原生或带标签的推理输出契约                                                                      | provider 需要使用带标签的推理/最终输出，而不是原生字段                                                                                   |
| 19  | `prepareExtraParams`              | 在通用流选项包装器之前，规范化请求参数                                                              | provider 需要默认请求参数或按 provider 清理参数                                                                                          |
| 20  | `createStreamFn`                  | 用自定义传输完全替换正常流路径                                                                      | provider 需要自定义线协议，而不仅仅是包装器                                                                                               |
| 21  | `wrapStreamFn`                    | 在应用通用包装器之后再包装流函数                                                                    | provider 需要请求头/请求体/模型兼容包装，而不是自定义传输                                                                                 |
| 22  | `resolveTransportTurnState`       | 附加原生的逐轮传输请求头或元数据                                                                    | provider 希望通用传输发送 provider 原生轮次标识                                                                                          |
| 23  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 请求头或会话冷却策略                                                             | provider 希望通用 WS 传输调整会话请求头或回退策略                                                                                        |
| 24  | `formatApiKey`                    | 认证配置文件格式化器：将已存储配置文件转换为运行时 `apiKey` 字符串                                  | provider 存储了额外认证元数据，并需要自定义运行时令牌形态                                                                                 |
| 25  | `refreshOAuth`                    | 为自定义刷新端点或刷新失败策略覆盖 OAuth 刷新                                                      | provider 不适配共享的 `pi-ai` 刷新器                                                                                                     |
| 26  | `buildAuthDoctorHint`             | 当 OAuth 刷新失败时追加修复提示                                                                     | provider 需要在刷新失败后提供 provider 自有的身份验证修复指导                                                                             |
| 27  | `matchesContextOverflowError`     | provider 拥有的上下文窗口溢出错误匹配器                                                            | provider 存在通用启发式无法识别的原始溢出错误                                                                                            |
| 28  | `classifyFailoverReason`          | provider 拥有的故障切换原因分类                                                                     | provider 可以将原始 API/传输错误映射为限流、过载等                                                                                        |
| 29  | `isCacheTtlEligible`              | 面向代理/回传 providers 的提示缓存策略                                                             | provider 需要针对代理场景的缓存 TTL 控制                                                                                                 |
| 30  | `buildMissingAuthMessage`         | 替换通用的缺失身份验证恢复消息                                                                      | provider 需要 provider 特定的缺失身份验证恢复提示                                                                                        |
| 31  | `suppressBuiltInModel`            | 过期上游模型抑制，并可附加面向用户的错误提示                                                        | provider 需要隐藏过期上游条目，或用 vendor 提示替代它们                                                                                   |
| 32  | `augmentModelCatalog`             | 在发现之后追加合成/最终目录条目                                                                     | provider 需要在 `models list` 和选择器中添加合成的前向兼容条目                                                                            |
| 33  | `resolveThinkingProfile`          | 设置特定模型的 `/think` 等级、显示标签和默认值                                                     | provider 为选定模型暴露自定义思考层级或二元标签                                                                                           |
| 34  | `isBinaryThinking`                | 开/关推理切换兼容性钩子                                                                             | provider 只暴露二元的思考开/关                                                                                                            |
| 35  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性钩子                                                                          | provider 希望仅对部分模型启用 `xhigh`                                                                                                     |
| 36  | `resolveDefaultThinkingLevel`     | 默认 `/think` 等级兼容性钩子                                                                        | provider 负责某个模型家族的默认 `/think` 策略                                                                                             |
| 37  | `isModernModelRef`                | 用于实时配置文件过滤和 smoke 选择的现代模型匹配器                                                  | provider 负责实时/smoke 首选模型匹配                                                                                          |
| 38  | `prepareRuntimeAuth`              | 在推理前将已配置的凭证交换为实际运行时令牌/密钥                                                     | provider 需要进行令牌交换，或需要短生命周期的请求凭证                                                                      |
| 39  | `resolveUsageAuth`                | 为 `/usage` 及相关状态表面解析用量/计费凭证                                                         | provider 需要自定义用量/配额令牌解析，或使用不同的用量凭证                                                                |
| 40  | `fetchUsageSnapshot`              | 在身份验证解析后获取并规范化 provider 特定的用量/配额快照                                           | provider 需要 provider 特定的用量端点或负载解析器                                                                          |
| 41  | `createEmbeddingProvider`         | 为 memory/search 构建 provider 拥有的嵌入适配器                                                      | Memory 嵌入行为应归属于 provider 插件                                                                                     |
| 42  | `buildReplayPolicy`               | 返回一个重放策略，用于控制该 provider 的转录处理                                                    | provider 需要自定义转录策略（例如剥离 thinking 块）                                                                       |
| 43  | `sanitizeReplayHistory`           | 在通用转录清理后重写重放历史                                                                        | provider 需要在共享压缩辅助逻辑之外执行 provider 特定的重放改写                                                           |
| 44  | `validateReplayTurns`             | 在嵌入式运行器之前，对重放轮次进行最终验证或重塑                                                    | provider 传输在通用净化后需要更严格的轮次验证                                                                             |
| 45  | `onModelSelected`                 | 在模型被选中后运行 provider 拥有的副作用                                                           | provider 需要在模型激活时执行遥测或维护 provider 拥有的状态                                                              |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 会先检查已匹配的
provider 插件，然后继续尝试其他具备相应钩子能力的 provider 插件，
直到有插件实际改写模型 id 或传输/配置。这样可以保持
别名/兼容 provider shim 正常工作，而不要求调用方知道是哪个
内置插件拥有该改写逻辑。如果没有任何 provider 钩子改写受支持的
Google 家族配置项，内置的 Google 配置规范化器仍会应用
那一层兼容性清理。

如果 provider 需要完全自定义的线协议或自定义请求执行器，
那属于另一类扩展。这些钩子适用于仍运行在 OpenClaw
常规推理循环上的 provider 行为。

### provider 示例

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

内置的 provider 插件会组合使用上述钩子，以适配各个供应商在目录、
身份验证、思考、重放和用量方面的需求。权威的钩子集合与各插件一起
存放在 `extensions/` 下；本页用于说明其形态，而不是镜像那份列表。

<AccordionGroup>
  <Accordion title="透传目录 providers">
    OpenRouter、Kilocode、Z.AI、xAI 会注册 `catalog` 以及
    `resolveDynamicModel` / `prepareDynamicModel`，以便它们能在
    OpenClaw 的静态目录之前暴露上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和用量端点 providers">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 会将
    `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` +
    `fetchUsageSnapshot` 配对使用，以管理令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理家族">
    共享的命名家族（`google-gemini`、`passthrough-gemini`、
    `anthropic-by-model`、`hybrid-anthropic-openai`）允许 providers 通过
    `buildReplayPolicy` 选择加入转录策略，而不是让每个插件
    重新实现清理逻辑。
  </Accordion>
  <Accordion title="仅目录 providers">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、
    `qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和
    `volcengine` 仅注册 `catalog`，并复用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 特定的流辅助工具">
    Beta 请求头、`/fast` / `serviceTier` 以及 `context1m` 位于
    Anthropic 插件公开的 `api.ts` / `contract-api.ts` 接缝中
    （`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`），而不是位于
    通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时辅助工具

插件可以通过 `api.runtime` 访问部分 core 辅助工具。对于 TTS：

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

- `textToSpeech` 会返回用于文件/语音便笺表面的常规 core TTS 输出负载。
- 使用 core `messages.tts` 配置和 provider 选择逻辑。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为 providers 进行重采样/编码。
- `listVoices` 对每个 provider 来说都是可选的。可用于供应商自有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如区域设置、性别和个性标签，以支持 provider 感知的选择器。
- 目前 OpenAI 和 ElevenLabs 支持电话语音。Microsoft 不支持。

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

- 将 TTS 策略、回退和回复投递保留在 core 中。
- 使用语音 providers 承载供应商自有的合成行为。
- 旧版 Microsoft `edge` 输入会被规范化为 `microsoft` provider id。
- 推荐的所有权模型是面向公司的：随着 OpenClaw 增加这些
  能力契约，一个供应商插件可以拥有文本、语音、图像以及未来的媒体 providers。

对于图像/音频/视频理解，插件会注册一个类型化的
媒体理解 provider，而不是通用的键值包：

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

- 将编排、回退、配置和渠道接线保留在 core 中。
- 将供应商行为保留在 provider 插件中。
- 增量扩展应保持类型化：新的可选方法、新的可选
  结果字段、新的可选能力。
- 视频生成已经遵循相同模式：
  - core 拥有能力契约和运行时辅助工具
  - 供应商插件注册 `api.registerVideoGenerationProvider(...)`
  - 功能/渠道插件消费 `api.runtime.videoGeneration.*`

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

对于音频转录，插件既可以使用媒体理解运行时，
也可以使用旧版 STT 别名：

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
- 使用 core 媒体理解音频配置（`tools.media.audio`）和 provider 回退顺序。
- 当未生成转录输出时（例如输入被跳过/不受支持），返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 仍保留为兼容性别名。

插件还可以通过 `api.runtime.subagent` 启动后台子智能体运行：

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

- `provider` 和 `model` 是按次运行的可选覆盖项，不是持久性的会话变更。
- OpenClaw 只会为受信任调用方启用这些覆盖字段。
- 对于插件自有的回退运行，运维者必须通过 `plugins.entries.<id>.subagent.allowModelOverride: true` 显式启用。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 可将受信任插件限制为特定的规范 `provider/model` 目标，或使用 `"*"` 以显式允许任意目标。
- 不受信任插件的 subagent 运行仍可工作，但覆盖请求会被拒绝，而不是静默回退。

对于 Web 搜索，插件可以使用共享运行时辅助工具，而不是
深入到智能体工具接线中：

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
`api.registerWebSearchProvider(...)` 注册 Web 搜索 providers。

说明：

- 将 provider 选择、凭证解析和共享请求语义保留在 core 中。
- 使用 Web 搜索 providers 承载供应商特定的搜索传输。
- `api.runtime.webSearch.*` 是功能/渠道插件在需要搜索能力且不依赖智能体工具包装器时的首选共享表面。

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
- `auth`：必填。使用 `"gateway"` 要求常规 Gateway 网关身份验证，或使用 `"plugin"` 表示插件自管身份验证/Webhook 校验。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换其自身现有的路由注册。
- `handler`：当路由处理了请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被移除，并会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突会被拒绝，除非设置了 `replaceExisting: true`，并且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。`exact`/`prefix` 贯通链必须保持在同一 auth 级别内。
- `auth: "plugin"` 路由**不会**自动接收运维者运行时作用域。它们用于插件自管的 Webhook/签名校验，而不是特权 Gateway 网关辅助调用。
- `auth: "gateway"` 路由会在 Gateway 网关请求运行时作用域内运行，但该作用域刻意保持保守：
  - 共享密钥 bearer 身份验证（`gateway.auth.mode = "token"` / `"password"`）会将插件路由运行时作用域固定为 `operator.write`，即使调用方发送了 `x-openclaw-scopes`
  - 受信任的携带身份 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在显式提供该请求头时才会认可 `x-openclaw-scopes`
  - 如果这些携带身份的插件路由请求中缺少 `x-openclaw-scopes`，运行时作用域会回退为 `operator.write`
- 实际规则：不要假设经过 gateway 身份验证的插件路由就是隐式管理面。如果你的路由需要仅管理员可用的行为，请要求使用携带身份的身份验证模式，并记录显式的 `x-openclaw-scopes` 请求头契约。

## 插件 SDK 导入路径

编写新插件时，请使用更窄的 SDK 子路径，而不是单体的 `openclaw/plugin-sdk` 根
barrel。Core 子路径包括：

| 子路径                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | 插件注册原语                                       |
| `openclaw/plugin-sdk/channel-core`  | 渠道入口/构建辅助工具                              |
| `openclaw/plugin-sdk/core`          | 通用共享辅助工具和总括契约                         |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod 模式（`OpenClawSchema`）    |

渠道插件可从一组更窄的接缝中选择——`channel-setup`、
`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、
`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、
`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、
`channel-targets` 和 `channel-actions`。审批行为应统一收敛到一个
`approvalCapability` 契约，而不是分散混用在不相关的
插件字段中。参见 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。

运行时和配置辅助工具位于对应的 `*-runtime` 子路径下
（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、
`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用——它只是为旧插件提供的兼容 shim。
新代码应改为导入更窄的通用原语。
</Info>

仓库内部入口点（按每个内置插件软件包根目录划分）：

- `index.js` —— 内置插件入口
- `api.js` —— 辅助工具/类型 barrel
- `runtime-api.js` —— 仅运行时 barrel
- `setup-entry.js` —— 设置插件入口

外部插件应只导入 `openclaw/plugin-sdk/*` 子路径。绝不要从 core 或另一个插件中导入其他插件软件包的 `src/*`。
由 facade 加载的入口点会优先使用当前活动的运行时配置快照；
如果不存在，再回退到磁盘上已解析的配置文件。

诸如 `image-generation`、`media-understanding`
和 `speech` 之类的能力专用子路径之所以存在，是因为内置插件目前就在使用它们。它们并不自动构成长期冻结的外部契约——依赖它们时，请查看相关的 SDK 参考页。

## 消息工具模式

对于 reaction、read 和 Polls 等非消息原语，插件应自行拥有渠道特定的 `describeMessageTool(...)` 模式
贡献。共享发送呈现应使用通用的 `MessagePresentation` 契约，
而不是 provider 原生的按钮、组件、分块或卡片字段。
关于该契约、回退规则、provider 映射和插件作者检查清单，请参见 [Message Presentation](/zh-CN/plugins/message-presentation)。

具备发送能力的插件通过消息能力声明其可渲染内容：

- `presentation` 用于语义化呈现块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用于固定投递请求

Core 会决定是原生渲染该呈现，还是将其降级为文本。
不要从通用消息工具中暴露 provider 原生 UI 逃生通道。
面向旧原生模式的已弃用 SDK 辅助工具仍会为现有
第三方插件导出，但新插件不应使用它们。

## 渠道目标解析

渠道插件应自行拥有渠道特定的目标语义。保持共享
outbound host 通用，并通过消息适配器表面承载 provider 规则：

- `messaging.inferTargetChatType({ to })` 用于在目录查找前决定规范化目标
  应被视为 `direct`、`group` 还是 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 用于告知 core 某个
  输入是否应跳过目录搜索，直接进入类似 id 的解析。
- `messaging.targetResolver.resolveTarget(...)` 是当 core 在规范化之后或目录未命中之后，
  需要最终由 provider 自行解析时的插件回退入口。
- `messaging.resolveOutboundSessionRoute(...)` 则在目标解析完成后，
  负责 provider 特定的会话路由构造。

推荐划分方式：

- 使用 `inferTargetChatType` 处理应在搜索 peers/groups 之前发生的类别判定。
- 使用 `looksLikeId` 进行“将其视为显式/原生目标 id”的检查。
- 使用 `resolveTarget` 处理 provider 特定的规范化回退，而不是进行广泛的目录搜索。
- 将 chat id、thread id、JID、handle 和 room
  id 等 provider 原生 id 保留在 `target` 值或 provider 特定参数中，而不是放在通用 SDK
  字段里。

## 基于配置的目录

如果插件从配置派生目录条目，应将该逻辑保留在插件中，
并复用 `openclaw/plugin-sdk/directory-runtime`
中的共享辅助工具。

适用场景包括某个渠道需要基于配置的 peers/groups，例如：

- 基于 allowlist 的私信 peers
- 已配置的渠道/群组映射
- 基于账户范围的静态目录回退

`directory-runtime` 中的共享辅助工具只处理通用操作：

- 查询过滤
- 限制项应用
- 去重/规范化辅助工具
- 构建 `ChannelDirectoryEntry[]`

渠道特定的账户检查和 id 规范化应保留在插件实现中。

## provider 目录

Provider 插件可以通过
`registerProvider({ catalog: { run(...) { ... } } })` 定义用于推理的模型目录。

`catalog.run(...)` 返回的形态与 OpenClaw 写入
`models.providers` 的内容相同：

- `{ provider }` 表示一个 provider 条目
- `{ providers }` 表示多个 provider 条目

当插件拥有 provider 特定的模型 id、基础 URL 默认值或受身份验证保护的模型元数据时，应使用 `catalog`。

`catalog.order` 控制插件目录相对于 OpenClaw
内置隐式 providers 的合并时机：

- `simple`：纯 API 密钥或环境变量驱动的 providers
- `profile`：认证配置文件存在时出现的 providers
- `paired`：合成多个相关 provider 条目的 providers
- `late`：最后一轮，在其他隐式 providers 之后

后出现的 provider 会在键冲突时胜出，因此插件可以有意用相同 provider id
覆盖内置 provider 条目。

兼容性：

- `discovery` 仍可作为旧别名使用
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 会使用 `catalog`

## 只读渠道检查

如果你的插件注册了一个渠道，优先同时实现
`plugin.config.inspectAccount(cfg, accountId)` 和 `resolveAccount(...)`。

原因：

- `resolveAccount(...)` 是运行时路径。它可以假定凭证
  已完全实体化，并在缺少必需 secret 时快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、
  `openclaw channels status`、`openclaw channels resolve`，以及 Doctor/配置
  修复流程，不应仅为了描述配置就去实体化运行时凭证。

推荐的 `inspectAccount(...)` 行为：

- 只返回描述性的账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭证来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 你无需为了报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（以及对应的来源字段）就足以支持状态类命令。
- 当凭证通过 SecretRef 配置，但在当前命令路径中不可用时，使用 `configured_unavailable`。

这样，只读命令就可以报告“已配置，但在当前命令路径中不可用”，而不是崩溃或错误地将账户报告为未配置。

## 软件包打包集

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

每个条目都会成为一个插件。如果该打包集列出多个扩展，插件 id
会变成 `name/<fileBase>`。

如果你的插件导入了 npm 依赖，请在该目录中安装它们，
以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 条目在解析符号链接后都必须保留在插件
目录内。任何逃离软件包目录的条目都会被拒绝。

安全说明：`openclaw plugins install` 会使用
`npm install --omit=dev --ignore-scripts` 安装插件依赖
（无生命周期脚本，运行时无开发依赖）。请保持插件依赖树为“纯 JS/TS”，并避免依赖需要 `postinstall` 构建的软件包。

可选项：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。
当 OpenClaw 需要为已禁用的渠道插件提供设置表面时，或者
当某个渠道插件已启用但仍未配置时，它会加载 `setupEntry`
而不是完整插件入口。这样当主插件入口还会接入工具、钩子或其他仅运行时代码时，就能让启动和设置更轻量。

可选项：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
可以让某个渠道插件在 Gateway 网关
监听前启动阶段中也选择同样的 `setupEntry` 路径，即使该渠道已经配置完成。

只有当 `setupEntry` 完整覆盖了网关开始监听之前必须存在的启动表面时，才使用此选项。实际上，这意味着设置入口
必须注册启动所依赖的每个渠道自有能力，例如：

- 渠道注册本身
- 任何必须在网关开始监听前可用的 HTTP 路由
- 任何必须在同一时间窗口内存在的 Gateway 网关方法、工具或服务

如果你的完整入口仍然拥有任何必需的启动能力，请不要启用
此标志。保持插件使用默认行为，让 OpenClaw 在启动期间加载完整入口。

内置渠道还可以发布仅设置阶段的契约表面辅助工具，供 core 在完整渠道运行时尚未加载前查询。当前的设置提升表面包括：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

当 core 需要在不加载完整插件入口的情况下，将旧版单账户渠道
配置提升到 `channels.<id>.accounts.*` 时，会使用该表面。
Matrix 是当前的内置示例：当已存在命名账户时，它只会将身份验证/引导键移动到
一个已命名的提升账户中，并且可以保留一个已配置的非规范默认账户键，而不是总是创建
`accounts.default`。

这些设置补丁适配器让内置契约表面发现保持懒加载。
导入时保持轻量；提升表面只在首次使用时加载，
而不会在模块导入时重新进入内置渠道启动流程。

当这些启动表面包含 Gateway 网关 RPC 方法时，请将它们保留在
插件特定的前缀下。Core 管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍然保留，并且始终解析为
`operator.admin`，即使插件请求更窄的作用域也是如此。

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

渠道插件可以通过 `openclaw.channel` 声明设置/发现元数据，并通过 `openclaw.install` 声明安装提示。这样可以让 core 目录保持无数据。

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
      "blurb": "通过 Nextcloud Talk webhook 机器人提供自托管聊天。",
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

除最小示例外，有用的 `openclaw.channel` 字段还包括：

- `detailLabel`：用于更丰富目录/状态表面的次级标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：该目录条目应优先于的低优先级插件/渠道 id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面文案控制
- `markdownCapable`：将该渠道标记为支持 Markdown，以便进行 outbound 格式决策
- `exposure.configured`：设置为 `false` 时，在已配置渠道列表表面中隐藏该渠道
- `exposure.setup`：设置为 `false` 时，在交互式设置/配置选择器中隐藏该渠道
- `exposure.docs`：将该渠道标记为内部/私有，用于文档导航表面
- `showConfigured` / `showInSetup`：为兼容性仍接受的旧别名；优先使用 `exposure`
- `quickstartAllowFrom`：让该渠道选择加入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只存在一个账户，也要求显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用会话查找

OpenClaw 还可以合并**外部渠道目录**（例如 MPM
注册表导出）。将 JSON 文件放在以下任一位置：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或者将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向
一个或多个 JSON 文件（以逗号/分号/`PATH` 分隔）。每个文件应
包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧别名。

生成的渠道目录条目和 provider 安装目录条目会在原始 `openclaw.install` 块旁边暴露
规范化后的安装来源事实。这些
规范化事实可标识 npm 规范是否为精确版本或浮动选择器、
是否存在预期完整性元数据，以及是否还提供本地
来源路径。当目录/软件包标识已知时，规范化事实还会在
解析得到的 npm 软件包名与该标识不一致时发出警告。
如果 `defaultChoice` 无效、指向不可用来源，或存在 npm 完整性元数据
却没有有效的 npm 来源，它们也会发出警告。使用方应将 `installSource`
视为附加的可选字段，这样旧的手工构建条目和兼容 shim 就不必合成它。
这使得新手引导和诊断可以解释来源层状态，而无需
导入插件运行时。

官方外部 npm 条目应优先使用精确的 `npmSpec` 加上
`expectedIntegrity`。仅使用裸软件包名和 dist-tag 为兼容性仍然有效，
但它们会暴露来源层警告，以便目录可以逐步转向固定版本、带完整性检查的安装，
同时不破坏现有插件。
当新手引导从本地目录路径安装时，它会记录一条托管插件
安装账本条目，带有 `source: "path"`，并在可能时记录相对工作区的
`sourcePath`。绝对的实际加载路径仍保留在
`plugins.load.paths` 中；安装记录会避免将本地工作站路径重复写入长期配置。
这样可以让本地开发安装对来源层诊断保持可见，同时不增加第二个原始文件系统路径暴露表面。
旧版 `plugins.installs` 配置条目仍会作为
兼容性回退继续读取，而状态管理的 `plugins/installs.json` 账本
会成为安装来源的事实来源。

## 上下文引擎插件

上下文引擎插件负责会话上下文编排，包括摄取、组装
和压缩。可通过你的插件使用
`api.registerContextEngine(id, factory)` 注册它们，然后通过
`plugins.slots.contextEngine` 选择活动引擎。

当你的插件需要替换或扩展默认上下文
管线，而不仅仅是添加 memory 搜索或钩子时，请使用此方式。

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

当插件需要当前 API 无法适配的行为时，不要通过私有方式绕过
插件系统。应添加缺失的能力。

推荐顺序：

1. 定义 core 契约
   决定共享行为中哪些应由 core 拥有：策略、回退、配置合并、
   生命周期、面向渠道的语义，以及运行时辅助工具形态。
2. 添加类型化的插件注册/运行时表面
   用最小但有用的类型化能力表面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 接入 core + 渠道/功能使用方
   渠道和功能插件应通过 core 消费新能力，
   而不是直接导入某个供应商实现。
4. 注册供应商实现
   然后由供应商插件将其后端注册到该能力上。
5. 添加契约覆盖
   添加测试，以便随着时间推移，所有权和注册形态仍保持明确。

这正是 OpenClaw 能保持鲜明主张、同时又不被硬编码到某个
provider 世界观中的方式。有关具体的文件检查清单和完整示例，请参见 [能力扩展手册](/zh-CN/plugins/architecture)。

### 能力检查清单

当你添加新能力时，实现通常应同时涉及以下表面：

- `src/<capability>/types.ts` 中的 core 契约类型
- `src/<capability>/runtime.ts` 中的 core 运行器/运行时辅助工具
- `src/plugins/types.ts` 中的插件 API 注册表面
- `src/plugins/registry.ts` 中的插件注册表接线
- 当功能/渠道插件需要消费该能力时，`src/plugins/runtime/*` 中的插件运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获/测试辅助工具
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中面向运维者/插件作者的文档

如果其中某个表面缺失，通常说明该能力
尚未完全集成。

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

这样规则就很简单：

- core 拥有能力契约 + 编排
- 供应商插件拥有供应商实现
- 功能/渠道插件消费运行时辅助工具
- 契约测试使所有权保持明确

## 相关内容

- [插件架构](/zh-CN/plugins/architecture) —— 公开能力模型和形态
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
