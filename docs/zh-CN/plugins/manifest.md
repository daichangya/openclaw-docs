---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布一个插件配置 schema，或调试插件验证错误
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-23T22:59:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf7422a024519d24af426724c430e5b998af947e2632aeb36334d94ac77d0c9
    source_path: plugins/manifest.md
    workflow: 15
---

此页面仅适用于**原生 OpenClaw 插件清单**。

有关兼容的 bundle 布局，请参见 [插件 bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会根据此处描述的 `openclaw.plugin.json` schema 对它们进行验证。

对于兼容 bundle，当前当其布局符合 OpenClaw 运行时预期时，OpenClaw 会读取 bundle 元数据、已声明的 skill 根目录、Claude 命令根目录、Claude bundle 的 `settings.json` 默认值、Claude bundle 的 LSP 默认值，以及受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

完整的插件系统指南请参见：[插件](/zh-CN/tools/plugin)。
关于原生能力模型和当前外部兼容性指导，请参见：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 这个文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，以便在不启动插件运行时的情况下检查。

**将其用于：**

- 插件标识、配置验证和配置 UI 提示
- 凭证、onboarding 和设置元数据（别名、自动启用、提供商环境变量、凭证选择）
- 控制平面能力面的激活提示
- 简写模型家族归属
- 静态能力归属快照（`contracts`）
- 共享 `openclaw qa` 主机可检查的 QA 运行器元数据
- 合并到目录和验证能力面中的渠道特定配置元数据

**不要将其用于：** 注册运行时行为、声明代码入口点或 npm 安装元数据。这些应放在你的插件代码和 `package.json` 中。

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

## 丰富示例

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
| `id` | 是 | `string` | 规范插件 ID。这是在 `plugins.entries.<id>` 中使用的 ID。 |
| `configSchema` | 是 | `object` | 该插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将一个内置插件标记为默认启用。省略它，或将其设置为任何非 `true` 的值，可使该插件默认禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化到此规范插件 ID 的旧版 ID。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当凭证、配置或模型引用提到这些提供商 ID 时，应自动启用该插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明一种由 `plugins.slots.*` 使用的独占插件类型。 |
| `channels` | 否 | `string[]` | 由该插件持有的渠道 ID。用于设备发现和配置验证。 |
| `providers` | 否 | `string[]` | 由该插件持有的提供商 ID。 |
| `modelSupport` | 否 | `object` | 由清单持有的简写模型家族元数据，用于在运行时之前自动加载插件。 |
| `providerEndpoints` | 否 | `object[]` | 由清单持有的 endpoint host/baseUrl 元数据，用于核心在提供商运行时加载前对提供商路由进行分类。 |
| `cliBackends` | 否 | `string[]` | 由该插件持有的 CLI 推理后端 ID。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | 在运行时加载之前进行冷模型发现时，应探测其插件持有的 synthetic auth hook 的提供商或 CLI 后端引用。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件持有的占位 API key 值，用于表示非密钥的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 由该插件持有的命令名称，这些命令应在运行时加载之前生成具备插件感知能力的配置和 CLI 诊断。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可在不加载插件代码的情况下检查的轻量提供商凭证环境变量元数据。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个提供商 ID 来进行凭证查找的提供商 ID，例如与基础提供商共享 API key 和 auth 配置文件的 coding 提供商。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可在不加载插件代码的情况下检查的轻量渠道环境变量元数据。将其用于通用启动/配置辅助工具应能看到的、基于环境变量的渠道设置或凭证能力面。 |
| `providerAuthChoices` | 否 | `object[]` | 用于 onboarding 选择器、首选提供商解析和简单 CLI 标志连线的轻量凭证选择元数据。 |
| `activation` | 否 | `object` | 针对 provider、command、channel、route 和 capability 触发加载的轻量激活提示。仅为元数据；实际行为仍由插件运行时持有。 |
| `setup` | 否 | `object` | 设备发现和设置能力面可在不加载插件运行时的情况下检查的轻量设置/onboarding 描述符。 |
| `qaRunners` | 否 | `object[]` | 共享 `openclaw qa` 主机在插件运行时加载前使用的轻量 QA 运行器描述符。 |
| `contracts` | 否 | `object` | 静态内置能力快照，涵盖外部凭证 hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、web-fetch、Web 搜索和工具归属。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 针对在 `contracts.mediaUnderstandingProviders` 中声明的提供商 ID 的轻量媒体理解默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单持有的渠道配置元数据，在运行时加载之前合并到设备发现和验证能力面中。 |
| `skills` | 否 | `string[]` | 要加载的 skill 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 显示在插件能力面中的简短摘要。 |
| `version` | 否 | `string` | 信息性插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 用于配置字段的 UI 标签、占位符和敏感性提示。 |

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一种 onboarding 或凭证选择。
OpenClaw 会在提供商运行时加载之前读取它。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选择所属的提供商 ID。 |
| `method` | 是 | `string` | 要分发到的凭证方法 ID。 |
| `choiceId` | 是 | `string` | onboarding 和 CLI 流程使用的稳定凭证选择 ID。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器的简短辅助文本。 |
| `assistantPriority` | 否 | `number` | 在由助手驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在助手选择器中隐藏该选择，同时仍允许手动 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选择的旧版选择 ID。 |
| `groupId` | 否 | `string` | 用于对相关选择分组的可选组 ID。 |
| `groupLabel` | 否 | `string` | 该组面向用户的标签。 |
| `groupHint` | 否 | `string` | 该组的简短辅助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志凭证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | CLI 帮助中使用的描述。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 该选择应出现在哪些 onboarding 能力面中。如果省略，默认值为 `["text-inference"]`。 |

## commandAliases 参考

当插件持有某个运行时命令名称，而用户可能误将其放入 `plugins.allow` 或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 会使用此元数据进行诊断，而无需导入插件运行时代码。

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
| `kind` | 否 | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。 |
| `cliCommand` | 否 | `string` | 如果存在，用于建议 CLI 操作的相关根 CLI 命令。 |

## activation 参考

当插件可以低成本声明哪些控制平面事件稍后应激活它时，请使用 `activation`。

## qaRunners 参考

当插件在共享 `openclaw qa` 根下贡献一个或多个传输运行器时，请使用 `qaRunners`。请保持此元数据轻量且静态；实际 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量 `runtime-api.ts` 能力面持有。

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
| `description` | 否 | `string` | 当共享主机需要一个 stub 命令时使用的回退帮助文本。 |

该块仅是元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时/插件入口点。
当前使用方会在更广泛的插件加载前将其作为缩小范围的提示，因此缺失的激活元数据通常只会带来性能成本；在旧版清单归属回退仍存在时，它不应改变正确性。

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
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders` | 否 | `string[]` | 请求这些提供商 ID 时应激活该插件。 |
| `onCommands` | 否 | `string[]` | 应激活该插件的命令 ID。 |
| `onChannels` | 否 | `string[]` | 应激活该插件的渠道 ID。 |
| `onRoutes` | 否 | `string[]` | 应激活该插件的路由类型。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。 |

当前实时使用方：

- 由命令触发的 CLI 规划会回退到旧版
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的设置/渠道规划在缺失显式渠道激活元数据时，会回退到旧版 `channels[]`
  归属
- 由提供商触发的设置/运行时规划在缺失显式提供商
  激活元数据时，会回退到旧版
  `providers[]` 和顶层 `cliBackends[]` 归属

## setup 参考

当设置和 onboarding 能力面需要在运行时加载前读取由插件持有的轻量元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面/设置流程、应保持仅元数据性质的设置特定描述符能力面。

当存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现的首选“描述符优先”查找能力面。如果描述符仅缩小候选插件范围，而设置仍需要更丰富的设置期运行时 hook，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

由于设置查找可能会执行插件持有的 `setup-api` 代码，因此规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在所有已发现插件中必须保持唯一。归属不明确时会以封闭失败的方式处理，而不是按发现顺序选出一个胜者。

### setup.providers 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或 onboarding 期间暴露的提供商 ID。请保持规范化后的 ID 在全局唯一。 |
| `authMethods` | 否 | `string[]` | 该提供商在不加载完整运行时的情况下支持的设置/凭证方法 ID。 |
| `envVars` | 否 | `string[]` | 通用设置/状态能力面可在插件运行时加载前检查的环境变量。 |

### setup 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和 onboarding 期间暴露的提供商设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先设置查找的设置期后端 ID。请保持规范化后的 ID 在全局唯一。 |
| `configMigrations` | 否 | `string[]` | 由该插件设置能力面持有的配置迁移 ID。 |
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
| `help` | `string` | 简短辅助文本。 |
| `tags` | `string[]` | 可选 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级。 |
| `sensitive` | `boolean` | 将该字段标记为密钥或敏感字段。 |
| `placeholder` | `string` | 表单输入的占位符文本。 |

## contracts 参考

仅当用于 OpenClaw 可在不导入插件运行时的情况下读取的静态能力归属元数据时，才使用 `contracts`。

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
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
| `embeddedExtensionFactories` | `string[]` | 内置插件可为其注册工厂的嵌入式运行时 ID。 |
| `externalAuthProviders` | `string[]` | 其外部凭证配置文件 hook 由该插件持有的提供商 ID。 |
| `speechProviders` | `string[]` | 该插件持有的语音提供商 ID。 |
| `realtimeTranscriptionProviders` | `string[]` | 该插件持有的实时转录提供商 ID。 |
| `realtimeVoiceProviders` | `string[]` | 该插件持有的实时语音提供商 ID。 |
| `mediaUnderstandingProviders` | `string[]` | 该插件持有的媒体理解提供商 ID。 |
| `imageGenerationProviders` | `string[]` | 该插件持有的图像生成提供商 ID。 |
| `videoGenerationProviders` | `string[]` | 该插件持有的视频生成提供商 ID。 |
| `webFetchProviders` | `string[]` | 该插件持有的 web-fetch 提供商 ID。 |
| `webSearchProviders` | `string[]` | 该插件持有的 Web 搜索提供商 ID。 |
| `tools` | `string[]` | 该插件为内置契约检查所持有的智能体工具名称。 |

实现了 `resolveExternalAuthProfiles` 的提供商插件应声明
`contracts.externalAuthProviders`。未进行该声明的插件仍会通过一个已弃用的兼容性回退路径运行，但该回退路径速度更慢，并会在迁移窗口结束后移除。

## mediaUnderstandingProviderMetadata 参考

当某个媒体理解提供商具有默认模型、自动凭证回退优先级，或在运行时加载前就需要由通用核心辅助工具读取的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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

每个提供商条目可以包含：

| 字段 | 类型 | 含义 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities` | `("image" \| "audio" \| "video")[]` | 该提供商暴露的媒体能力。 |
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时，按能力映射的默认模型。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证的自动提供商回退时，数值越小排序越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | 该提供商支持的原生文档输入。 |

## channelConfigs 参考

当渠道插件在运行时加载前需要轻量配置元数据时，请使用 `channelConfigs`。

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
| `label` | `string` | 当运行时元数据尚未就绪时，合并到选择器和检查能力面中的渠道标签。 |
| `description` | `string` | 用于检查和目录能力面的简短渠道描述。 |
| `preferOver` | `string[]` | 在选择能力面中，该渠道应优先于其之上的旧版或较低优先级插件 ID。 |

## modelSupport 参考

当 OpenClaw 需要在插件运行时加载之前，根据 `gpt-5.5` 或 `claude-sonnet-4.6` 这类简写模型 ID 推断你的提供商插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 应用以下优先级：

- 显式 `provider/model` 引用使用其持有方 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 如果仍存在歧义，在用户或配置明确指定提供商之前会忽略该歧义

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 针对简写模型 ID 进行匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，针对简写模型 ID 进行匹配的正则表达式源。 |

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规
清单加载不再将这些顶层字段视为能力归属。

## Manifest 与 package.json

这两个文件的职责不同：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置验证、凭证选择元数据，以及在插件代码运行前必须存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块 |

如果你不确定某段元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，就把它放在 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就把它放在 `package.json`

### 会影响设备发现的 package.json 字段

有些运行时前插件元数据会有意放在 `package.json` 的
`openclaw` 块中，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保留在插件包目录内。 |
| `openclaw.runtimeExtensions` | 声明已安装包的构建后 JavaScript 运行时入口点。必须保留在插件包目录内。 |
| `openclaw.setupEntry` | 轻量级、仅用于设置的入口点，用于 onboarding、延迟渠道启动以及只读渠道状态/SecretRef 发现。必须保留在插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 声明已安装包的构建后 JavaScript 设置入口点。必须保留在插件包目录内。 |
| `openclaw.channel` | 轻量渠道目录元数据，例如标签、文档路径、别名和选择文案。 |
| `openclaw.channel.configuredState` | 轻量级 configured-state 检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅基于环境变量的设置？” |
| `openclaw.channel.persistedAuthState` | 轻量级持久化凭证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已经有任何已登录状态？” |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 用于内置和外部发布插件的安装/更新提示。 |
| `openclaw.install.defaultChoice` | 当存在多个安装源时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 主机版本，使用类似 `>=2026.3.22` 的 semver 下界。 |
| `openclaw.install.expectedIntegrity` | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会据此验证获取到的产物。 |
| `openclaw.install.allowInvalidConfigRecovery` | 允许在配置无效时走一条狭窄的内置插件重装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置用途的渠道能力面，再加载完整渠道插件。 |

清单元数据决定了在运行时加载前，哪些 provider/channel/setup 选择会出现在 onboarding 中。`package.json#openclaw.install` 会告诉 onboarding：当用户选择这些选项之一时，应如何获取或启用该插件。不要将安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间被强制执行。无效值会被拒绝；较新的但有效的值会导致旧主机跳过该插件。

精确的 npm 版本固定已存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。如果你希望在获取到的
npm 产物不再匹配固定版本时，让更新流程以封闭失败的方式终止，请将其与
`expectedIntegrity` 搭配使用。交互式 onboarding 会提供受信任注册表的 npm spec，包括裸包名和 dist-tag。当存在 `expectedIntegrity` 时，安装/更新流程会强制执行它；若省略，则仅记录注册表解析结果，而不附加完整性固定。

渠道插件应提供 `openclaw.setupEntry`，以便在不加载完整运行时的情况下，状态、渠道列表或 SecretRef 扫描也能识别已配置账号。设置入口点应暴露渠道元数据以及设置安全的配置、状态和 secret 适配器；请将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖源入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 被刻意设计得非常狭窄。它不会让任意损坏的配置变得可安装。当前它只允许安装流程从特定的旧版内置插件升级失败中恢复，例如缺失的内置插件路径，或同一内置插件对应的过期 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作员引导至 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是一个用于微型检查器模块的包元数据：

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

当设置、Doctor 或 configured-state 流程需要在完整渠道插件加载前进行一个轻量级 yes/no 凭证探测时，请使用它。目标导出应是一个只读取持久化状态的小函数；不要通过完整渠道运行时 barrel 暴露它。

`openclaw.channel.configuredState` 采用相同结构，用于轻量级、仅基于环境变量的配置状态检查：

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

当某个渠道可以仅根据环境变量或其他微小的非运行时输入来回答配置状态时，请使用它。如果检查需要完整配置解析或真实渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 发现优先级（重复插件 ID）

OpenClaw 会从多个根目录发现插件（内置、全局安装、工作区、配置中显式选择的路径）。如果两个发现项共享相同的 `id`，则只保留**优先级最高**的清单；低优先级的重复项会被丢弃，而不是与其并列加载。

优先级从高到低：

1. **配置选择** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一起提供的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 放在工作区中的某个内置插件分叉版或过时副本，不会遮蔽内置构建。
- 如果你确实想用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，使其通过优先级胜出，而不是依赖工作区发现。
- 重复项被丢弃时会写入日志，以便 Doctor 和启动诊断可以指向被丢弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 空 schema 也是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读/写时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键会被视为**错误**，除非该渠道 ID 是由某个插件清单声明的。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 ID。未知 ID 会被视为**错误**。
- 如果插件已安装，但其清单或 schema 损坏或缺失，验证会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件处于**禁用**状态，则配置会被保留，并且 Doctor + 日志中会显示一条**警告**。

完整 `plugins.*` schema 请参见[配置参考](/zh-CN/gateway/configuration)。

## 说明

- 对于**原生 OpenClaw 插件**，清单是**必需的**，包括本地文件系统加载。运行时仍会单独加载插件模块；清单仅用于设备发现 + 验证。
- 原生清单使用 JSON5 解析，因此只要最终值仍是对象，就接受注释、尾随逗号和未加引号的键。
- 清单加载器只会读取文档化的清单字段。避免自定义顶层键。
- 当插件不需要时，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- 独占插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`，`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认 `legacy`）。
- 环境变量元数据（`providerAuthEnvVars`、`channelEnvVars`）仅具声明性。状态、审计、cron 投递验证和其他只读能力面在将某个环境变量视为已配置之前，仍会应用插件信任和有效激活策略。
- 对于需要提供商代码的运行时向导元数据，请参见[提供商运行时 hook](/zh-CN/plugins/architecture#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关

<CardGroup cols={3}>
  <Card title="构建插件" href="/zh-CN/plugins/building-plugins" icon="rocket">
    插件入门指南。
  </Card>
  <Card title="插件架构" href="/zh-CN/plugins/architecture" icon="diagram-project">
    内部架构和能力模型。
  </Card>
  <Card title="插件 SDK 概览" href="/zh-CN/plugins/sdk-overview" icon="book">
    插件 SDK 参考与子路径导入。
  </Card>
</CardGroup>
