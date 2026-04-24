---
read_when:
    - 你正在构建一个 OpenClaw 插件。
    - 你需要发布插件配置 schema，或排查插件校验错误。
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-24T18:09:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9118ed34fc7bb8923aff6b7f0ac795a1d637d255ef5f6ce0b37293e9a3812253
    source_path: plugins/manifest.md
    workflow: 15
---

本页仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参见 [插件 bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单文件的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会根据这里描述的 `openclaw.plugin.json` schema 对它们进行校验。

对于兼容 bundle，当前 OpenClaw 会在布局符合 OpenClaw 运行时预期时，读取 bundle 元数据、声明的 skill 根目录、Claude 命令根目录、Claude bundle 的 `settings.json` 默认值、Claude bundle 的 LSP 默认值，以及受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用这个清单在**不执行插件代码的情况下**验证配置。缺失或无效的清单会被视为插件错误，并阻止配置校验。

完整的插件系统指南请参见：[Plugins](/zh-CN/tools/plugin)。
关于原生能力模型和当前外部兼容性指导，请参见：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 这个文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，以便在不启动插件运行时的情况下进行检查。

**适用场景：**

- 插件标识、配置校验，以及配置 UI 提示
- 认证、新手引导和设置元数据（别名、自动启用、provider 环境变量、认证选项）
- 控制平面表面的激活提示
- 简写模型家族归属
- 静态能力归属快照（`contracts`）
- 共享 `openclaw qa` 主机可检查的 QA 运行器元数据
- 合并到目录和校验表面中的渠道特定配置元数据

**不要用于：** 注册运行时行为、声明代码入口点，或 npm 安装元数据。这些应放在你的插件代码和 `package.json` 中。

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
| `id` | 是 | `string` | 规范的插件 id。这就是 `plugins.entries.<id>` 中使用的 id。 |
| `configSchema` | 是 | `object` | 该插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将某个内置插件标记为默认启用。省略该字段，或设置为任何非 `true` 的值，都会使插件默认保持禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会被规范化到当前规范插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当认证、配置或模型引用提到这些 provider id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明一个由 `plugins.slots.*` 使用的排他性插件类型。 |
| `channels` | 否 | `string[]` | 该插件拥有的渠道 id。用于设备发现和配置校验。 |
| `providers` | 否 | `string[]` | 该插件拥有的 provider id。 |
| `providerDiscoveryEntry` | 否 | `string` | 轻量级 provider 发现模块路径，相对于插件根目录，用于作用域限定在清单内的 provider 目录元数据；无需激活完整插件运行时即可加载。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。 |
| `providerEndpoints` | 否 | `object[]` | 由清单拥有的 endpoint host/baseUrl 元数据，用于核心在 provider 运行时加载前对 provider 路由进行分类。 |
| `cliBackends` | 否 | `string[]` | 该插件拥有的 CLI 推理后端 id。用于在启动时基于显式配置引用自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | 其插件所有 synthetic auth hook 应在运行时加载前、冷启动模型发现期间进行探测的 provider 或 CLI 后端引用。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件拥有的占位 API key 值，用于表示非密钥的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 该插件拥有的命令名称，应在运行时加载前产出带插件感知的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 无需加载插件代码即可检查的轻量级 provider 认证环境元数据。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个 provider id 进行认证查找的 provider id，例如与基础 provider 共享 API key 和认证配置文件的 coding provider。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 无需加载插件代码即可检查的轻量级渠道环境元数据。对于由环境变量驱动的渠道设置或通用启动/配置辅助工具应可见的认证表面，请使用此字段。 |
| `providerAuthChoices` | 否 | `object[]` | 用于新手引导选择器、首选 provider 解析，以及简单 CLI 标志接线的轻量级认证选项元数据。 |
| `activation` | 否 | `object` | 用于 provider、命令、渠道、路由和能力触发加载的轻量级激活规划器元数据。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 轻量级设置/新手引导描述符，供发现和设置表面在不加载插件运行时的情况下检查。 |
| `qaRunners` | 否 | `object[]` | 共享 `openclaw qa` 主机在插件运行时加载前使用的轻量级 QA 运行器描述符。 |
| `contracts` | 否 | `object` | 静态内置能力快照，涵盖外部认证 hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、web-fetch、Web 搜索和工具归属。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 为 `contracts.mediaUnderstandingProviders` 中声明的 provider id 提供的轻量级媒体理解默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，会在运行时加载前合并到发现和校验表面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skill 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 显示在插件表面中的简短摘要。 |
| `version` | 否 | `string` | 仅供参考的插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在 provider 运行时加载之前读取这些内容。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 该选项所属的 provider id。 |
| `method` | 是 | `string` | 要分派到的认证方法 id。 |
| `choiceId` | 是 | `string` | 供新手引导和 CLI 流程使用的稳定 auth-choice id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器中的简短辅助文本。 |
| `assistantPriority` | 否 | `number` | 在由助手驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在助手选择器中隐藏该选项，但仍允许通过 CLI 手动选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选项的旧版选项 id。 |
| `groupId` | 否 | `string` | 用于对相关选项分组的可选分组 id。 |
| `groupLabel` | 否 | `string` | 该分组的面向用户标签。 |
| `groupHint` | 否 | `string` | 该分组的简短辅助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | 用于 CLI 帮助中的说明。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 该选项应出现在哪些新手引导表面中。如果省略，默认值为 `["text-inference"]`。 |

## commandAliases 参考

当某个插件拥有一个运行时命令名，而用户可能会误将其放入 `plugins.allow` 中，或尝试将其作为根级 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 会使用这些元数据进行诊断，而无需导入插件运行时代码。

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
| `name` | 是 | `string` | 属于该插件的命令名称。 |
| `kind` | 否 | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根级 CLI 命令。 |
| `cliCommand` | 否 | `string` | 若存在，用于建议 CLI 操作的相关根级 CLI 命令。 |

## activation 参考

当插件能够以低成本声明哪些控制平面事件应将其纳入激活/加载计划时，请使用 `activation`。

这个块是规划器元数据，不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已经执行。激活规划器使用这些字段在回退到现有清单归属元数据（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks）之前，先缩小候选插件范围。

优先使用已经能描述归属关系的最窄元数据。如果这些字段已经能够表达关系，请使用
`providers`、`channels`、`commandAliases`、setup 描述符或 `contracts`。
只有在这些归属字段无法表达额外规划提示时，才使用 `activation`。

这个块仅是元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时/插件入口点。当前使用方只是将它作为更广泛插件加载前的缩小范围提示，因此即使缺少 activation 元数据，通常也只会影响性能；在旧版清单归属回退机制仍存在的情况下，它不应改变正确性。

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
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders` | 否 | `string[]` | 应将该插件纳入激活/加载计划的 provider id。 |
| `onCommands` | 否 | `string[]` | 应将该插件纳入激活/加载计划的命令 id。 |
| `onChannels` | 否 | `string[]` | 应将该插件纳入激活/加载计划的渠道 id。 |
| `onRoutes` | 否 | `string[]` | 应将该插件纳入激活/加载计划的路由类型。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。若可能，优先使用更窄的字段。 |

当前在线使用方：

- 由命令触发的 CLI 规划会回退到旧版
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的设置/渠道规划在缺少显式渠道激活元数据时，会回退到旧版 `channels[]`
  归属
- 由 provider 触发的设置/运行时规划在缺少显式 provider
  激活元数据时，会回退到旧版
  `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示与清单归属回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 归属。这些原因标签用于主机诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## qaRunners 参考

当某个插件在共享的 `openclaw qa` 根命令下提供一个或多个传输运行器时，请使用 `qaRunners`。请保持这些元数据轻量且静态；实际的 CLI 注册仍由插件运行时通过一个轻量级的 `runtime-api.ts` 表面负责，该表面导出 `qaRunnerCliRegistrations`。

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
| `description` | 否 | `string` | 当共享主机需要一个占位命令时使用的回退帮助文本。 |

## setup 参考

当设置和新手引导表面需要在运行时加载前获取轻量级、由插件拥有的元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是面向设置流程的专用描述符表面，适用于必须保持仅元数据性质的控制平面/设置流程。

如果存在 `setup.providers` 和 `setup.cliBackends`，它们就是设置发现时优先使用的“描述符优先”查找表面。如果该描述符只能缩小候选插件范围，而设置仍需要更丰富的设置阶段运行时 hook，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

只有当这些描述符已足以满足设置表面需要时，才将 `requiresRuntime: false`。OpenClaw 会将显式的 `false` 视为仅描述符契约，并且不会为了设置查找而执行 `setup-api`。如果省略 `requiresRuntime`，则会保留旧版回退行为，从而确保那些仅添加了描述符但未添加该标志的现有插件不会出问题。

由于设置查找可能会执行插件拥有的 `setup-api` 代码，因此规范化后的
`setup.providers[].id` 和 `setup.cliBackends[]` 值必须在所有已发现插件之间保持唯一。归属不明确时会以关闭方式失败，而不是按照发现顺序选出一个“赢家”。

### setup.providers 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或新手引导期间暴露的 provider id。请确保规范化后的 id 在全局范围内唯一。 |
| `authMethods` | 否 | `string[]` | 该 provider 在不加载完整运行时的情况下支持的设置/认证方法 id。 |
| `envVars` | 否 | `string[]` | 通用设置/状态表面可在插件运行时加载前检查的环境变量。 |

### setup 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和新手引导期间暴露的 provider 设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先设置查找的设置阶段后端 id。请确保规范化后的 id 在全局范围内唯一。 |
| `configMigrations` | 否 | `string[]` | 由该插件设置表面拥有的配置迁移 id。 |
| `requiresRuntime` | 否 | `boolean` | 在描述符查找之后，设置是否仍需要执行 `setup-api`。 |

## uiHints 参考

`uiHints` 是一个从配置字段名到小型渲染提示的映射。

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

每个字段提示可以包含：

| 字段 | 类型 | 含义 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 面向用户的字段标签。 |
| `help` | `string` | 简短的辅助文本。 |
| `tags` | `string[]` | 可选的 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级项。 |
| `sensitive` | `boolean` | 将该字段标记为秘密或敏感项。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## contracts 参考

仅在 OpenClaw 可以**无需导入插件运行时**就读取静态能力归属元数据时，使用 `contracts`。

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表都是可选的：

| 字段 | 类型 | 含义 |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories` | `string[]` | 内置插件可为其注册工厂的嵌入式运行时 id。 |
| `externalAuthProviders` | `string[]` | 该插件拥有其外部认证配置文件 hook 的 provider id。 |
| `speechProviders` | `string[]` | 该插件拥有的语音 provider id。 |
| `realtimeTranscriptionProviders` | `string[]` | 该插件拥有的实时转录 provider id。 |
| `realtimeVoiceProviders` | `string[]` | 该插件拥有的实时语音 provider id。 |
| `memoryEmbeddingProviders` | `string[]` | 该插件拥有的内存嵌入 provider id。 |
| `mediaUnderstandingProviders` | `string[]` | 该插件拥有的媒体理解 provider id。 |
| `imageGenerationProviders` | `string[]` | 该插件拥有的图像生成 provider id。 |
| `videoGenerationProviders` | `string[]` | 该插件拥有的视频生成 provider id。 |
| `webFetchProviders` | `string[]` | 该插件拥有的 web-fetch provider id。 |
| `webSearchProviders` | `string[]` | 该插件拥有的 Web 搜索 provider id。 |
| `tools` | `string[]` | 该插件为内置契约检查所拥有的智能体工具名称。 |

实现了 `resolveExternalAuthProfiles` 的 provider 插件应声明
`contracts.externalAuthProviders`。未声明的插件仍会通过已弃用的兼容性回退运行，但该回退速度更慢，并将在迁移窗口结束后移除。

内置内存嵌入 provider 应为其暴露的每个适配器 id 声明
`contracts.memoryEmbeddingProviders`，包括诸如 `local` 这样的内建适配器。独立 CLI 路径使用这个清单契约，以便在完整 Gateway 网关运行时注册 provider 之前，仅加载所属插件。

## mediaUnderstandingProviderMetadata 参考

当某个媒体理解 provider 在运行时加载前，需要向通用核心辅助工具提供默认模型、自动认证回退优先级或原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。其键也必须在
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

每个 provider 条目可以包含：

| 字段 | 类型 | 含义 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities` | `("image" \| "audio" \| "video")[]` | 该 provider 暴露的媒体能力。 |
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时使用的“能力到模型”默认值。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证自动回退 provider 时的排序，数字越小越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | 该 provider 支持的原生文档输入。 |

## channelConfigs 参考

当某个渠道插件在运行时加载前需要轻量级配置元数据时，请使用 `channelConfigs`。

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
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

每个渠道条目可以包含：

| 字段 | 类型 | 含义 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` 的 JSON Schema。每个声明的渠道配置条目都必须提供。 |
| `uiHints` | `Record<string, object>` | 该渠道配置部分的可选 UI 标签/占位符/敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未准备好时，合并到选择器和检查表面中的渠道标签。 |
| `description` | `string` | 用于检查和目录表面的简短渠道描述。 |
| `preferOver` | `string[]` | 该渠道在选择表面中应优先于的旧版或较低优先级插件 id。 |

## modelSupport 参考

当 OpenClaw 应该在插件运行时加载前，根据诸如 `gpt-5.5` 或 `claude-sonnet-4.6` 这样的简写模型 id 推断你的 provider 插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 采用以下优先级：

- 显式的 `provider/model` 引用使用所属 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 如果仍存在歧义，则在用户或配置明确指定 provider 之前会忽略它

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 通过 `startsWith` 与简写模型 id 匹配的前缀。 |
| `modelPatterns` | `string[]` | 在去除 profile 后缀后，与简写模型 id 匹配的正则表达式源码。 |

旧版顶层能力键已弃用。请使用 `openclaw doctor --fix` 将
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规清单加载不再将这些顶层字段视为能力归属。

## Manifest 与 package.json 的区别

这两个文件承担不同职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置校验、认证选项元数据，以及必须在插件代码运行前就存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块 |

如果你不确定某项元数据应放在哪里，请使用这条规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，就放在 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就放在 `package.json`

### 会影响设备发现的 package.json 字段

有些运行时前插件元数据，刻意放在 `package.json` 的
`openclaw` 块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保持在插件包目录内。 |
| `openclaw.runtimeExtensions` | 声明已安装包的构建后 JavaScript 运行时入口点。必须保持在插件包目录内。 |
| `openclaw.setupEntry` | 仅用于设置的轻量级入口点，用于新手引导、延迟渠道启动，以及只读的渠道状态/SecretRef 发现。必须保持在插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 声明已安装包的构建后 JavaScript 设置入口点。必须保持在插件包目录内。 |
| `openclaw.channel` | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择文案。 |
| `openclaw.channel.configuredState` | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已经存在仅基于环境变量的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已经有任何内容登录？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置插件和外部发布插件的安装/更新提示。 |
| `openclaw.install.defaultChoice` | 当有多个安装来源可用时，优先使用的安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 主机版本，使用类似 `>=2026.3.22` 的 semver 下限。 |
| `openclaw.install.expectedIntegrity` | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会据此校验获取到的制品。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许一个范围很窄的内置插件重新安装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间，先加载仅设置用途的渠道表面，再加载完整的渠道插件。 |

清单元数据决定了在运行时加载之前，新手引导中会出现哪些 provider/渠道/设置选项。`package.json#openclaw.install` 则告诉新手引导：当用户选择了这些选项之一时，应如何获取或启用该插件。不要将安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；较新但有效的值会让旧主机跳过该插件。

精确的 npm 版本固定已经存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确 spec 与 `expectedIntegrity` 配对使用，这样一旦获取到的 npm 制品不再匹配固定版本，更新流程就会以关闭方式失败。为了兼容性，交互式新手引导仍会提供受信任注册表的 npm spec，包括裸包名和 dist-tag。目录诊断可以区分精确、浮动、完整性固定、缺少完整性、包名不匹配以及无效 default-choice 来源。它们还会在存在 `expectedIntegrity` 但没有可用于固定它的有效 npm 来源时发出警告。当存在 `expectedIntegrity` 时，安装/更新流程会强制执行它；若省略，则注册表解析结果会被记录，但不会附带完整性固定。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。该 setup entry 应暴露渠道元数据，以及适用于设置阶段的安全配置、状态和 secrets 适配器；请将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖针对源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的作用范围被刻意限制得很窄。它不会让任意损坏的配置变得可安装。当前它只允许安装流程从特定的陈旧内置插件升级失败中恢复，例如缺失的内置插件路径，或该同一内置插件下陈旧的 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作员引导至 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是一个微型检查器模块的包元数据：

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前，进行廉价的是/否认证探测时，请使用它。目标导出应是一个只读取持久化状态的小函数；不要通过完整渠道运行时 barrel 来间接调用它。

`openclaw.channel.configuredState` 采用相同的结构，用于廉价的仅环境变量已配置检查：

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

当某个渠道可以仅根据环境变量或其他微小的非运行时输入来回答已配置状态时，请使用它。如果该检查需要完整的配置解析或真实的渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 设备发现优先级（重复插件 id）

OpenClaw 会从多个根位置发现插件（内置、全局安装、工作区、配置中显式选定的路径）。如果两次发现共享同一个 `id`，则只保留**优先级最高**的清单；较低优先级的重复项会被丢弃，而不是与其并存加载。

优先级从高到低如下：

1. **配置选定** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一起提供的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 工作区中某个内置插件的 fork 或陈旧副本，不会覆盖内置构建。
- 如果你确实要用本地插件覆盖某个内置插件，请通过 `plugins.entries.<id>` 固定它，让它凭优先级胜出，而不要依赖工作区发现。
- 被丢弃的重复项会记录到日志中，这样 Doctor 和启动诊断就能指出被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 空 schema 也是可以接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读取/写入时校验，而不是在运行时校验。

## 校验行为

- 未知的 `channels.*` 键会被视为**错误**，除非该渠道 id 是由某个插件清单声明的。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 id。未知 id 会被视为**错误**。
- 如果某个插件已安装，但其清单或 schema 损坏或缺失，则校验会失败，并且 Doctor 会报告该插件错误。
- 如果插件配置存在，但插件处于**禁用**状态，则配置会被保留，并且 Doctor + 日志中会显示**警告**。

完整的 `plugins.*` schema 请参见 [配置参考](/zh-CN/gateway/configuration)。

## 说明

- 对于**原生 OpenClaw 插件**，清单是**必需的**，包括本地文件系统加载。运行时仍会单独加载插件模块；清单仅用于设备发现 + 校验。
- 原生清单使用 JSON5 解析，因此允许注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象。
- 清单加载器只会读取有文档记录的清单字段。请避免使用自定义顶层键。
- 当插件不需要它们时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；请将其用于静态 provider 目录元数据或狭义的发现描述符，而不是请求时执行逻辑。
- 排他性插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`，`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认 `legacy`）。
- 环境变量元数据（`providerAuthEnvVars`、`channelEnvVars`）仅具有声明性。状态、审计、cron 投递校验和其他只读表面，在将环境变量视为已配置之前，仍会应用插件信任和实际激活策略。
- 有关需要 provider 代码的运行时向导元数据，请参见 [Provider runtime hooks](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关内容

<CardGroup cols={3}>
  <Card title="构建插件" href="/zh-CN/plugins/building-plugins" icon="rocket">
    插件入门指南。
  </Card>
  <Card title="插件架构" href="/zh-CN/plugins/architecture" icon="diagram-project">
    内部架构和能力模型。
  </Card>
  <Card title="插件 SDK 概览" href="/zh-CN/plugins/sdk-overview" icon="book">
    插件 SDK 参考和子路径导入。
  </Card>
</CardGroup>
