---
read_when:
    - 你正在构建一个 OpenClaw 插件】【。
    - 你需要发布一个插件配置 schema，或调试插件验证错误】【。
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-27T08:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6e1da1cc57f6ba89ef511b01636439dd34f0b847a306b96271ccf9c2b878d4
    source_path: plugins/manifest.md
    workflow: 15
---

此页面仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参见 [Plugin bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但它们不会根据此处描述的 `openclaw.plugin.json` schema 进行验证。

对于兼容 bundle，OpenClaw 当前会在布局符合 OpenClaw 运行时期望时，读取 bundle 元数据、已声明的 Skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值以及受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用这个清单在**不执行插件代码的情况下**验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

请参阅完整的插件系统指南：[Plugins](/zh-CN/tools/plugin)。
关于原生能力模型和当前外部兼容性指导，请参见：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 这个文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，以便在不启动插件运行时的情况下进行检查。

**将它用于：**

- 插件标识、配置验证和配置 UI 提示
- 认证、新手引导和设置元数据（别名、自动启用、提供商环境变量、认证选项）
- 控制平面界面的激活提示
- 简写模型族归属
- 静态能力归属快照（`contracts`）
- 共享 `openclaw qa` 主机可检查的 QA 运行器元数据
- 合并到目录和验证界面中的渠道专用配置元数据

**不要将它用于：** 注册运行时行为、声明代码入口点或 npm 安装元数据。这些属于你的插件代码和 `package.json`。

## 最小示例

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## 完整示例

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## 顶层字段参考

| 字段 | 必填 | 类型 | 含义 |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id` | 是 | `string` | 规范插件 id。这是在 `plugins.entries.<id>` 中使用的 id。 |
| `configSchema` | 是 | `object` | 此插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略此项，或设置为任何非 `true` 的值，以使该插件默认禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化为此规范插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当认证、配置或模型引用提到这些提供商 id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明一个由 `plugins.slots.*` 使用的互斥插件种类。 |
| `channels` | 否 | `string[]` | 由此插件拥有的渠道 id。用于发现和配置验证。 |
| `providers` | 否 | `string[]` | 由此插件拥有的提供商 id。 |
| `providerDiscoveryEntry` | 否 | `string` | 轻量级 provider 发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载的、限定于清单范围内的 provider 目录元数据。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型族元数据，用于在运行时之前自动加载插件。 |
| `modelCatalog` | 否 | `object` | 适用于由此插件拥有的提供商的声明式模型目录元数据。这是未来只读列表、新手引导、模型选择器、别名和抑制功能在不加载插件运行时情况下的控制平面契约。 |
| `providerEndpoints` | 否 | `object[]` | 由清单拥有的端点 host / `baseUrl` 元数据，用于核心在 provider 运行时加载前必须分类的 provider 路由。 |
| `cliBackends` | 否 | `string[]` | 由此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | provider 或 CLI 后端引用；在运行时加载前的冷启动模型发现期间，应探测其由插件拥有的合成认证钩子。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件拥有的占位 API 密钥值，表示非密钥的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 由此插件拥有的命令名称；在运行时加载前，这些命令应产生具备插件感知的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | 已弃用的兼容性环境变量元数据，用于 provider 认证 / Status 查询。对于新插件，优先使用 `setup.providers[].envVars`；OpenClaw 在弃用窗口期内仍会读取此项。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个 provider id 进行认证查询的 provider id，例如共享基础 provider API 密钥和 auth profile 的编码 provider。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将其用于通用启动 / 配置辅助工具应可见的、由环境变量驱动的渠道设置或认证界面。 |
| `providerAuthChoices` | 否 | `object[]` | 适用于新手引导选择器、首选 provider 解析和简单 CLI 标志接线的轻量级认证选项元数据。 |
| `activation` | 否 | `object` | 适用于由 provider、命令、渠道、路由和能力触发加载的轻量级激活规划器元数据。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 可供发现和设置界面在不加载插件运行时情况下检查的轻量级设置 / 新手引导描述符。 |
| `qaRunners` | 否 | `object[]` | 共享 `openclaw qa` 主机在插件运行时加载前使用的轻量级 QA 运行器描述符。 |
| `contracts` | 否 | `object` | 外部认证钩子、语音、实时转写、实时语音、媒体理解、图像生成、音乐生成、视频生成、网页抓取、Ollama Web 搜索 和工具归属的静态内置能力快照。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 适用于在 `contracts.mediaUnderstandingProviders` 中声明的 provider id 的轻量级媒体理解默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，在运行时加载前合并到发现和验证界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skills 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 显示在插件界面中的简短摘要。 |
| `version` | 否 | `string` | 信息性插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在 provider 运行时加载前读取它。
provider 设置列表会使用这些清单选项、由描述符派生的设置选项，
以及安装目录元数据，而无需加载 provider 运行时。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的 provider id。 |
| `method` | 是 | `string` | 要分派到的认证方法 id。 |
| `choiceId` | 是 | `string` | 新手引导和 CLI 流程使用的稳定认证选项 id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退为 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器中的简短帮助文本。 |
| `assistantPriority` | 否 | `number` | 在由助手驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在助手选择器中隐藏该选项，但仍允许通过手动 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 旧版选项 id，应该将用户重定向到这个替代选项。 |
| `groupId` | 否 | `string` | 用于对相关选项分组的可选分组 id。 |
| `groupLabel` | 否 | `string` | 该分组的面向用户标签。 |
| `groupHint` | 否 | `string` | 该分组的简短帮助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | 用于 CLI 帮助中的说明。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 该选项应出现在哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有一个运行时命令名称，而用户可能误将其放入 `plugins.allow`，
或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw
使用这些元数据来提供诊断，而无需导入插件运行时代码。

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| 字段 | 必填 | 类型 | 含义 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name` | 是 | `string` | 属于此插件的命令名称。 |
| `kind` | 否 | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。 |
| `cliCommand` | 否 | `string` | 若存在，用于建议 CLI 操作的相关根 CLI 命令。 |

## `activation` 参考

当插件可以以低成本声明哪些控制平面事件
应将其包含在激活 / 加载计划中时，请使用 `activation`。

此块是规划器元数据，而不是生命周期 API。它不会注册
运行时行为，不会替代 `register(...)`，也不保证
插件代码已执行。激活规划器使用这些字段来
缩小候选插件范围，然后才回退到现有的清单归属
元数据，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、
`contracts.tools` 和 hooks。

优先使用已经能够描述归属关系的最窄元数据。能用
`providers`、`channels`、`commandAliases`、setup 描述符或 `contracts`
表达关系时，就使用这些字段。对于无法由这些归属字段表示的额外规划器
提示，再使用 `activation`。
对于 `claude-cli`、`codex-cli` 或 `google-gemini-cli` 这类 CLI 运行时别名，
请使用顶层 `cliBackends`；`activation.onAgentHarnesses` 仅适用于
那些尚无归属字段的嵌入式 Agent harness id。

此块仅为元数据。它不会注册运行时行为，也不会
替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。
当前使用方会在更广泛的插件加载之前将其作为缩小范围的提示，因此
缺少激活元数据通常只会带来性能成本；
只要旧版清单归属回退仍然存在，就不应影响正确性。

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders` | 否 | `string[]` | 应将此插件包含在激活 / 加载计划中的 provider id。 |
| `onAgentHarnesses` | 否 | `string[]` | 应将此插件包含在激活 / 加载计划中的嵌入式 Agent harness 运行时 id。对于 CLI 后端别名，请使用顶层 `cliBackends`。 |
| `onCommands` | 否 | `string[]` | 应将此插件包含在激活 / 加载计划中的命令 id。 |
| `onChannels` | 否 | `string[]` | 应将此插件包含在激活 / 加载计划中的渠道 id。 |
| `onRoutes` | 否 | `string[]` | 应将此插件包含在激活 / 加载计划中的路由类型。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 用于控制平面激活规划的宽泛能力提示。可以的话，优先使用更窄的字段。 |

当前在线使用方：

- 由命令触发的 CLI 规划会回退到旧版
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 智能体运行时启动规划对嵌入式 harness 使用 `activation.onAgentHarnesses`，
  对 CLI 运行时别名使用顶层 `cliBackends[]`
- 由渠道触发的设置 / 渠道规划在缺少显式渠道激活元数据时，
  会回退到旧版 `channels[]`
  归属
- 由 provider 触发的设置 / 运行时规划在缺少显式 provider
  激活元数据时，会回退到旧版
  `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示和清单
归属回退。例如，`activation-command-hint` 表示
匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示
规划器改用了 `commandAliases` 归属。这些原因标签
用于宿主诊断和测试；插件作者应继续声明最能描述
归属关系的元数据。

## `qaRunners` 参考

当插件在共享的 `openclaw qa` 根命令下贡献一个或多个传输运行器时，
请使用 `qaRunners`。请保持这些元数据轻量且静态；
实际的 CLI 注册仍由插件运行时通过一个轻量级
`runtime-api.ts` 接口负责，该接口导出 `qaRunnerCliRegistrations`。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是 | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。 |
| `description` | 否 | `string` | 当共享宿主需要一个桩命令时使用的回退帮助文本。 |

## `setup` 参考

当设置和新手引导界面需要在运行时加载前获取由插件拥有的轻量级元数据时，
请使用 `setup`。

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理
后端。`setup.cliBackends` 是面向
应保持仅元数据化的控制平面 / 设置流程的、设置专用描述符界面。

存在 `setup.providers` 和 `setup.cliBackends` 时，它们是
设置发现中优先使用的描述符优先查询界面。如果该描述符仅用于
缩小候选插件范围，而设置仍需要更丰富的设置期运行时钩子，
请将 `requiresRuntime` 设为 `true`，并保留 `setup-api`
作为回退执行路径。

OpenClaw 还会将 `setup.providers[].envVars` 包含在通用 provider 认证和
环境变量查询中。`providerAuthEnvVars` 在弃用窗口期内仍通过兼容适配器
继续受支持，但仍在使用它的非内置插件
会收到清单诊断。新插件应将设置 / Status 环境变量元数据
放在 `setup.providers[].envVars` 上。

在没有 setup 入口时，或者当
`setup.requiresRuntime: false` 声明设置运行时不必要时，OpenClaw 也可以从 `setup.providers[].authMethods`
派生出简单的设置选项。对于自定义标签、CLI 标志、新手引导范围
和助手元数据，显式的 `providerAuthChoices` 条目仍然是首选。

仅当这些描述符已足以满足
设置界面时，才将 `requiresRuntime: false`。OpenClaw 将显式的 `false` 视为仅描述符契约，
并且不会为设置查询执行 `setup-api` 或 `openclaw.setupEntry`。如果
一个仅描述符插件仍然提供了其中某个设置运行时入口，
OpenClaw 会报告一条附加诊断，并继续忽略它。省略
`requiresRuntime` 会保留旧版回退行为，因此现有那些在未设置该标志的情况下添加了
描述符的插件不会失效。

由于设置查询可能会执行由插件拥有的 `setup-api` 代码，
规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在所有已发现插件中
保持唯一。归属不明确时会采取失败即关闭的方式，而不是按发现顺序选一个
“赢家”。

当设置运行时确实执行时，如果 `setup-api` 注册了一个提供商或 CLI 后端，
但清单描述符没有声明它，或者某个描述符没有匹配的运行时
注册，设置注册表诊断就会报告描述符漂移。
这些诊断是附加性的，不会拒绝旧版插件。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或新手引导期间暴露的 provider id。请保持规范化 id 在全局范围内唯一。 |
| `authMethods` | 否 | `string[]` | 此 provider 在不加载完整运行时的情况下支持的设置 / 认证方法 id。 |
| `envVars` | 否 | `string[]` | 通用设置 / Status 界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和新手引导期间暴露的 provider 设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先设置查询的设置期后端 id。请保持规范化 id 在全局范围内唯一。 |
| `configMigrations` | 否 | `string[]` | 由此插件的设置界面拥有的配置迁移 id。 |
| `requiresRuntime` | 否 | `boolean` | 描述符查询后，设置是否仍需要执行 `setup-api`。 |

## `uiHints` 参考

`uiHints` 是一个从配置字段名映射到小型渲染提示的映射表。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

每个字段提示可包含：

| 字段 | 类型 | 含义 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 面向用户的字段标签。 |
| `help` | `string` | 简短帮助文本。 |
| `tags` | `string[]` | 可选的 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级项。 |
| `sensitive` | `boolean` | 将该字段标记为密钥或敏感项。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## `contracts` 参考

仅当 OpenClaw 可以在不导入插件运行时的情况下读取静态能力归属元数据时，
才使用 `contracts`。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表都是可选的：

| 字段 | 类型 | 含义 |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories` | `string[]` | Codex app-server 扩展工厂 id，目前为 `codex-app-server`。 |
| `agentToolResultMiddleware` | `string[]` | 内置插件可为其注册工具结果中间件的运行时 id。 |
| `externalAuthProviders` | `string[]` | 其外部 auth profile 钩子由该插件拥有的 provider id。 |
| `speechProviders` | `string[]` | 该插件拥有的语音 provider id。 |
| `realtimeTranscriptionProviders` | `string[]` | 该插件拥有的实时转写 provider id。 |
| `realtimeVoiceProviders` | `string[]` | 该插件拥有的实时语音 provider id。 |
| `memoryEmbeddingProviders` | `string[]` | 该插件拥有的 memory embedding provider id。 |
| `mediaUnderstandingProviders` | `string[]` | 该插件拥有的媒体理解 provider id。 |
| `imageGenerationProviders` | `string[]` | 该插件拥有的图像生成 provider id。 |
| `videoGenerationProviders` | `string[]` | 该插件拥有的视频生成 provider id。 |
| `webFetchProviders` | `string[]` | 该插件拥有的网页抓取 provider id。 |
| `webSearchProviders` | `string[]` | 该插件拥有的网页搜索 provider id。 |
| `migrationProviders` | `string[]` | 该插件为 `openclaw migrate` 拥有的导入 provider id。 |
| `tools` | `string[]` | 该插件为内置契约检查拥有的智能体工具名称。 |

`contracts.embeddedExtensionFactories` 被保留用于内置的、仅适用于 Codex
app-server 的扩展工厂。内置工具结果转换应
声明 `contracts.agentToolResultMiddleware`，并使用
`api.registerAgentToolResultMiddleware(...)` 进行注册。外部插件不能
注册工具结果中间件，因为该接口可以在模型看到高信任度工具输出之前
改写它。

实现了 `resolveExternalAuthProfiles` 的 provider 插件
应声明 `contracts.externalAuthProviders`。未声明该项的插件仍会通过
已弃用的兼容性回退运行，但该回退更慢，
并将在迁移窗口结束后移除。

内置 memory embedding provider 应为其暴露的每个适配器 id 声明
`contracts.memoryEmbeddingProviders`，
包括诸如 `local` 之类的内置适配器。独立 CLI 路径使用这个清单
契约，在完整 Gateway 网关运行时尚未
注册 provider 之前，仅加载拥有该能力的插件。

## `mediaUnderstandingProviderMetadata` 参考

当某个媒体理解 provider 具有默认模型、自动认证回退优先级
或原生文档支持，并且通用核心辅助工具需要在运行时加载前获取这些信息时，
请使用 `mediaUnderstandingProviderMetadata`。其键也必须在
`contracts.mediaUnderstandingProviders` 中声明。

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

每个 provider 条目可包含：

| 字段 | 类型 | 含义 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities` | `("image" \| "audio" \| "video")[]` | 该 provider 暴露的媒体能力。 |
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时，按能力映射到模型的默认值。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证自动回退 provider 时，数字越小排序越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | 该 provider 支持的原生文档输入。 |

## `channelConfigs` 参考

当某个渠道插件需要在运行时加载前获取低成本配置元数据时，
请使用 `channelConfigs`。只读的渠道设置 / Status 发现可以
在没有 setup 入口时直接使用这些元数据来处理已配置的外部渠道，
或者在 `setup.requiresRuntime: false` 声明设置运行时不必要时使用它们。

`channelConfigs` 是插件清单元数据，而不是新的顶层用户配置
区段。用户仍然在 `channels.<channel-id>` 下配置渠道实例。
OpenClaw 会读取清单元数据，以决定哪个插件拥有该已配置的
渠道，然后才执行插件运行时代码。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述的是不同
路径：

- `configSchema` 用于验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 用于验证 `channels.<channel-id>`

声明了 `channels[]` 的非内置插件也应声明匹配的
`channelConfigs` 条目。若没有它们，OpenClaw 仍然可以加载该插件，
但冷路径配置 schema、设置和 Control UI 界面在插件运行时执行前
无法知道该渠道拥有的选项结构。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和
`nativeSkillsAutoEnabled` 可以为在渠道运行时加载前执行的命令配置检查
声明静态 `auto` 默认值。内置渠道也可以通过
`package.json#openclaw.channel.commands` 发布相同默认值，并与其他由 package 拥有的
渠道目录元数据一起提供。

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

每个渠道条目可包含：

| 字段 | 类型 | 含义 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都必须提供。 |
| `uiHints` | `Record<string, object>` | 该渠道配置区段的可选 UI 标签 / 占位符 / 敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道描述。 |
| `commands` | `object` | 用于运行时前配置检查的静态原生命令和原生 Skills 自动默认值。 |
| `preferOver` | `string[]` | 在选择界面中，此渠道应优先于其之上的旧版或低优先级插件 id。 |

### 替换另一个渠道插件

当你的插件是某个渠道 id 的首选拥有者，而另一个插件
也可以提供该渠道时，请使用 `preferOver`。常见情况包括：插件 id 已重命名、
独立插件取代了内置插件，或者维护中的分支为了配置兼容性
保留了相同的渠道 id。

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

当配置了 `channels.chat` 时，OpenClaw 会同时考虑渠道 id 和
首选插件 id。如果低优先级插件之所以被选中
只是因为它是内置的或默认启用的，
OpenClaw 会在生效运行时配置中禁用它，以便由一个插件统一拥有该渠道
及其工具。显式的用户选择仍然优先：如果用户明确启用了两个插件，
OpenClaw 会保留该选择，并报告重复渠道 / 工具诊断，
而不是静默更改用户请求的插件集合。

请将 `preferOver` 限定在那些确实能提供相同渠道的插件 id 上。
它不是一个通用优先级字段，也不会重命名用户配置键。

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，根据简写模型 id
如 `gpt-5.5` 或 `claude-sonnet-4.6` 推断你的 provider 插件时，
请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用：

- 显式的 `provider/model` 引用使用拥有该项的 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置
  插件优先
- 其余歧义会被忽略，直到用户或配置指定某个 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 通过 `startsWith` 与简写模型 id 匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，与简写模型 id 匹配的正则表达式源码。 |

## `modelCatalog` 参考

当 OpenClaw 应在加载插件运行时之前了解 provider 模型元数据时，
请使用 `modelCatalog`。这是由清单拥有的固定目录
条目、provider 别名、抑制规则和发现模式的数据源。
运行时刷新仍属于 provider 运行时代码负责，但清单会告知核心
何时需要运行时。

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

顶层字段：

| 字段 | 类型 | 含义 |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers` | `Record<string, object>` | 由此插件拥有的 provider id 的目录条目。键也应出现在顶层 `providers` 中。 |
| `aliases` | `Record<string, object>` | 在目录或抑制规划中应解析到某个已拥有 provider 的 provider 别名。 |
| `suppressions` | `object[]` | 因特定 provider 原因而被此插件抑制的、来自其他来源的模型条目。 |
| `discovery` | `Record<string, "static" \| "refreshable" \| "runtime">` | 该 provider 目录是可从清单元数据读取、可刷新到缓存，还是需要运行时。 |

provider 字段：

| 字段 | 类型 | 含义 |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string` | 此 provider 目录中模型的可选默认 base URL。 |
| `api` | `ModelApi` | 此 provider 目录中模型的可选默认 API 适配器。 |
| `headers` | `Record<string, string>` | 适用于此 provider 目录的可选静态请求头。 |
| `models` | `object[]` | 必填模型条目。没有 `id` 的条目会被忽略。 |

模型字段：

| 字段 | 类型 | 含义 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id` | `string` | provider 本地模型 id，不含 `provider/` 前缀。 |
| `name` | `string` | 可选显示名称。 |
| `api` | `ModelApi` | 可选的逐模型 API 覆盖值。 |
| `baseUrl` | `string` | 可选的逐模型 base URL 覆盖值。 |
| `headers` | `Record<string, string>` | 可选的逐模型静态请求头。 |
| `input` | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 该模型接受的模态。 |
| `reasoning` | `boolean` | 该模型是否暴露推理行为。 |
| `contextWindow` | `number` | provider 原生上下文窗口。 |
| `contextTokens` | `number` | 当与 `contextWindow` 不同时，可选的实际运行时上下文上限。 |
| `maxTokens` | `number` | 已知时的最大输出 token 数。 |
| `cost` | `object` | 可选的每百万 token 美元定价，包括可选的 `tieredPricing`。 |
| `compat` | `object` | 与 OpenClaw 模型配置兼容性匹配的可选兼容性标志。 |
| `status` | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。仅当某条目绝不能出现时才使用 suppress。 |
| `statusReason` | `string` | 在非可用状态下显示的可选原因。 |
| `replaces` | `string[]` | 该模型取代的旧 provider 本地模型 id。 |
| `replacedBy` | `string` | 已弃用条目的替代 provider 本地模型 id。 |
| `tags` | `string[]` | 供选择器和过滤器使用的稳定标签。 |

不要将仅运行时数据放入 `modelCatalog`。如果某个 provider 需要账户
状态、API 请求或本地进程发现才能得知完整模型集合，
请在 `discovery` 中将该 provider 声明为 `refreshable` 或 `runtime`。

### OpenClaw Provider Index

OpenClaw Provider Index 是由 OpenClaw 拥有的预览元数据，适用于那些
插件可能尚未安装的 provider。它不是插件清单的一部分。
插件清单仍然是已安装插件的权威来源。Provider Index 是内部回退契约，
未来可安装 provider 和安装前模型选择器界面将在未安装 provider 插件时
使用它。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单中的 `modelCatalog`。
3. 通过显式刷新得到的模型目录缓存。
4. OpenClaw Provider Index 预览条目。

Provider Index 不得包含密钥、启用状态、运行时钩子
或与实际账户相关的在线模型数据。它的预览目录使用与插件清单
相同的 `modelCatalog` provider 条目结构，但应仅限于稳定显示元数据，
除非有意让 `api`、
`baseUrl`、定价或兼容性标志等运行时适配器字段与已安装插件清单保持一致。
对于具有在线 `/models` 发现能力的 provider，应通过显式模型目录缓存路径
写入刷新后的条目，而不是在常规列表或新手引导期间调用 provider API。

Provider Index 条目还可以携带适用于那些插件已移出核心
或尚未安装的 provider 的可安装插件元数据。此元数据遵循渠道目录模式：
package 名称、npm 安装规格、预期完整性以及轻量级认证选项标签
足以展示一个可安装的设置选项。一旦插件安装完成，
其清单将优先生效，而该 provider 的 Provider Index 条目会被忽略。

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders`
移动到 `contracts` 下；常规
清单加载不再将这些顶层字段视为能力
归属。

## 清单与 package.json 的区别

这两个文件承担不同职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 在插件代码运行前必须存在的设备发现、配置验证、认证选项元数据和 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 区块 |

如果你不确定某项元数据应该放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，就将其放在 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就将其放在 `package.json`

### 影响设备发现的 package.json 字段

一些运行时前插件元数据会有意放在 `package.json` 的
`openclaw` 区块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保留在插件 package 目录内。 |
| `openclaw.runtimeExtensions` | 为已安装 package 声明已构建的 JavaScript 运行时入口点。必须保留在插件 package 目录内。 |
| `openclaw.setupEntry` | 在新手引导、延迟渠道启动和只读渠道 Status / SecretRef 设备发现期间使用的轻量级仅设置入口点。必须保留在插件 package 目录内。 |
| `openclaw.runtimeSetupEntry` | 为已安装 package 声明已构建的 JavaScript 设置入口点。必须保留在插件 package 目录内。 |
| `openclaw.channel` | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择说明文本。 |
| `openclaw.channel.commands` | 在渠道运行时加载前，由配置、审计和命令列表界面使用的静态原生命令和原生 Skills 自动默认元数据。 |
| `openclaw.channel.configuredState` | 轻量级 configured-state 检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅环境变量的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已登录任何内容？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置插件和外部发布插件的安装 / 更新提示。 |
| `openclaw.install.defaultChoice` | 当有多个安装来源可用时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 宿主版本，使用类似 `>=2026.3.22` 的 semver 下限。 |
| `openclaw.install.expectedIntegrity` | 预期的 npm 分发完整性字符串，例如 `sha512-...`；安装和更新流程会据此校验获取的制品。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许狭义的内置插件重新安装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许仅设置用途的渠道界面在启动期间于完整渠道插件之前加载。 |

清单元数据决定了在运行时加载前，
哪些 provider / channel / setup 选项会出现在新手引导中。`package.json#openclaw.install` 则告诉
新手引导，当用户选择其中某个选项时，
应如何获取或启用该插件。不要将安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装和清单
注册表加载期间强制执行。无效值会被拒绝；较新但有效的值会在旧宿主上跳过该
插件。

精确的 npm 版本固定已经存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录
条目应将精确 spec 与 `expectedIntegrity` 配对，这样如果获取到的 npm 制品
不再匹配固定版本，更新流程就会失败即关闭。
出于兼容性考虑，交互式新手引导仍会提供受信任注册表的 npm spec，
包括裸 package 名称和 dist-tag。目录诊断可以
区分精确、浮动、带完整性固定、缺少完整性、package 名称不匹配
以及无效默认选项来源。它们还会在
存在 `expectedIntegrity` 但没有可用于固定它的有效 npm 来源时发出警告。
当存在 `expectedIntegrity` 时，
安装 / 更新流程会强制校验它；省略时，注册表解析结果
会被记录下来，但不带完整性固定。

当 Status、渠道列表
或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。
该设置入口点应暴露渠道元数据以及适用于设置场景的配置、
Status 和密钥适配器；请将网络客户端、Gateway 网关监听器
和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖针对源代码
入口点字段的 package 边界检查。例如，`openclaw.runtimeExtensions` 不能让一个
越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 被有意保持为狭义能力。它
不会让任意损坏配置都变得可安装。目前它只允许安装流程
从特定的过期内置插件升级失败中恢复，例如
缺失的内置插件路径，或同一个内置插件对应的陈旧 `channels.<id>` 条目。
无关的配置错误仍会阻止安装，并引导操作人员
运行 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是一个微型检查器
模块的 package 元数据：

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

当设置、Doctor 或 configured-state 流程需要在完整渠道插件加载前进行一个
低成本的是否已认证探测时，请使用它。目标导出应是一个仅
读取持久化状态的小函数；不要通过完整的
渠道运行时 barrel 转发它。

`openclaw.channel.configuredState` 采用相同结构，用于低成本的仅环境变量
configured 检查：

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

当某个渠道可以通过环境变量或其他微型
非运行时输入来回答 configured-state 时，请使用它。如果检查需要完整配置解析或真实
渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState`
钩子中。

## 设备发现优先级（重复插件 id）

OpenClaw 会从多个根目录发现插件（内置、全局安装、工作区、显式由配置选择的路径）。如果两个发现结果共享相同的 `id`，则只保留**优先级最高**的清单；优先级较低的重复项会被丢弃，而不是与其一起加载。

优先级从高到低：

1. **由配置选择** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一起提供的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 位于工作区中的某个内置插件分支或过期副本不会遮蔽内置构建。
- 如果你确实要用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，让它凭优先级获胜，而不是依赖工作区发现。
- 被丢弃的重复项会记录到日志中，以便 Doctor 和启动诊断指出被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 可以接受空 schema（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读写时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 id 已由
  某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 id。未知 id 是**错误**。
- 如果某个插件已安装，但其清单或 schema 损坏或缺失，
  验证会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件已**禁用**，则配置会被保留，并且
  Doctor + 日志中会显示一条**警告**。

有关完整 `plugins.*` schema，请参见 [配置参考](/zh-CN/gateway/configuration)。

## 注意事项

- 对于原生 OpenClaw 插件，清单是**必需的**，包括从本地文件系统加载的插件。运行时仍会单独加载插件模块；清单仅用于设备发现 + 验证。
- 原生清单使用 JSON5 解析，因此支持注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象即可。
- 清单加载器只会读取已文档化的清单字段。避免使用自定义顶层键。
- 当插件不需要它们时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；应将其用于静态 provider 目录元数据或窄范围发现描述符，而不是请求时执行。
- 互斥插件种类通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory` 选择，`kind: "context-engine"` 通过 `plugins.slots.contextEngine` 选择（默认值为 `legacy`）。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 以及 `channelEnvVars`）仅是声明式信息。Status、审计、cron 投递验证和其他只读界面在将某个环境变量视为已配置之前，仍会应用插件信任和生效激活策略。
- 关于需要 provider 代码的运行时向导元数据，请参见 [Provider 运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器允许列表要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关内容

<CardGroup cols={3}>
  <Card title="构建插件" href="/zh-CN/plugins/building-plugins" icon="rocket">
    插件入门指南。
  </Card>
  <Card title="插件架构" href="/zh-CN/plugins/architecture" icon="diagram-project">
    内部架构和能力模型。
  </Card>
  <Card title="SDK 概览" href="/zh-CN/plugins/sdk-overview" icon="book">
    插件 SDK 参考和子路径导入。
  </Card>
</CardGroup>
