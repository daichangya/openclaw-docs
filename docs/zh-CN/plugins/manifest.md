---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布插件配置 schema，或调试插件校验错误
summary: 插件清单 + JSON schema 要求（严格配置校验）
title: 插件清单
x-i18n:
    generated_at: "2026-04-23T06:24:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: de71b9d556c2696d3279f202b66d57aa8014e9c89d81e3f453602744120d1675
    source_path: plugins/manifest.md
    workflow: 15
---

# 插件清单（`openclaw.plugin.json`）

本页仅适用于 **原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参阅 [插件 bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不使用清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会依据这里描述的 `openclaw.plugin.json` schema 对它们进行校验。

对于兼容的 bundles，当其布局符合 OpenClaw 运行时预期时，OpenClaw 当前会读取 bundle 元数据，以及声明的 skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值，以及受支持的 hook packs。

每个原生 OpenClaw 插件 **必须** 在 **插件根目录** 中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用这个清单在 **不执行插件代码** 的情况下校验配置。缺失或无效的清单会被视为插件错误，并阻止配置校验。

请参阅完整的插件系统指南：[插件](/zh-CN/tools/plugin)。
关于原生能力模型和当前的外部兼容性指南，请参阅：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 这个文件的作用

`openclaw.plugin.json` 是 OpenClaw 在加载你的插件代码之前读取的元数据。

用于：

- 插件标识
- 配置校验
- 无需启动插件运行时即可获得的认证和新手引导元数据
- 运行时加载前，控制平面界面可检查的低成本激活提示
- 运行时加载前，设置 / 新手引导界面可检查的低成本设置描述符
- 运行时加载前应解析的别名和自动启用元数据
- 运行时加载前应自动激活插件的简写模型族归属元数据
- 用于内置兼容接线和契约覆盖的静态能力归属快照
- 共享 `openclaw qa` 主机在插件运行时加载前可检查的低成本 QA 运行器元数据
- 无需加载运行时即可合并到目录和校验界面的渠道特定配置元数据
- 配置 UI 提示

不要用于：

- 注册运行时行为
- 声明代码入口点
- npm 安装元数据

这些应放在你的插件代码和 `package.json` 中。

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
| `id` | 是 | `string` | 规范的插件 id。这是在 `plugins.entries.<id>` 中使用的 id。 |
| `configSchema` | 是 | `object` | 此插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略该字段，或将其设置为任何非 `true` 的值，以保持插件默认禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化为此规范插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当认证、配置或模型引用提到这些 provider id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明一个由 `plugins.slots.*` 使用的互斥插件类型。 |
| `channels` | 否 | `string[]` | 由此插件拥有的渠道 id。用于设备发现和配置校验。 |
| `providers` | 否 | `string[]` | 由此插件拥有的 provider id。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型族元数据，用于在运行时之前自动加载插件。 |
| `providerEndpoints` | 否 | `object[]` | 由清单拥有的 endpoint host/baseUrl 元数据，用于核心系统必须在 provider 运行时加载前分类的 provider 路由。 |
| `cliBackends` | 否 | `string[]` | 由此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | provider 或 CLI 后端引用；在运行时加载前的冷启动模型发现期间，应探测其由插件拥有的 synthetic auth hook。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件拥有的占位 API key 值，用于表示非机密的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 由此插件拥有的命令名称；在运行时加载前，应产出带有插件感知能力的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 无需加载插件代码即可检查的低成本 provider 认证环境变量元数据。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个 provider id 进行认证查找的 provider id，例如共享基础 provider API key 和认证配置文件的编码 provider。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 无需加载插件代码即可检查的低成本渠道环境变量元数据。将其用于通用启动 / 配置辅助工具应能看到的、由环境变量驱动的渠道设置或认证界面。 |
| `providerAuthChoices` | 否 | `object[]` | 用于新手引导选择器、首选 provider 解析和简单 CLI 标志接线的低成本认证选项元数据。 |
| `activation` | 否 | `object` | 用于 provider、命令、渠道、路由和能力触发加载的低成本激活提示。仅为元数据；插件运行时仍然拥有实际行为。 |
| `setup` | 否 | `object` | 设备发现和设置界面无需加载插件运行时即可检查的低成本设置 / 新手引导描述符。 |
| `qaRunners` | 否 | `object[]` | 共享 `openclaw qa` 主机在插件运行时加载前使用的低成本 QA 运行器描述符。 |
| `contracts` | 否 | `object` | 外部认证 hooks、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、网页抓取、网页搜索和工具归属的静态内置能力快照。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 为 `contracts.mediaUnderstandingProviders` 中声明的 provider id 提供的低成本媒体理解默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，会在运行时加载前合并到设备发现和校验界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skills 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 在插件界面中显示的简短摘要。 |
| `version` | 否 | `string` | 仅供参考的插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在 provider 运行时加载前读取它。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的 provider id。 |
| `method` | 是 | `string` | 要分发到的认证方法 id。 |
| `choiceId` | 是 | `string` | 新手引导和 CLI 流程使用的稳定认证选项 id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器的简短辅助文本。 |
| `assistantPriority` | 否 | `number` | 在由助手驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在助手选择器中隐藏该选项，但仍允许手动通过 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选项的旧版选项 id。 |
| `groupId` | 否 | `string` | 用于对相关选项分组的可选组 id。 |
| `groupLabel` | 否 | `string` | 该分组的面向用户标签。 |
| `groupHint` | 否 | `string` | 该分组的简短辅助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | 在 CLI 帮助中使用的描述。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有一个运行时命令名称，而用户可能误将其放入 `plugins.allow` 或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据提供诊断信息，而无需导入插件运行时代码。

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
| `cliCommand` | 否 | `string` | 用于 CLI 操作时建议的相关根 CLI 命令（如果存在）。 |

## `activation` 参考

当插件可以低成本地声明哪些控制平面事件应在后续激活它时，请使用 `activation`。

## `qaRunners` 参考

当插件在共享的 `openclaw qa` 根命令下提供一个或多个传输运行器时，请使用 `qaRunners`。保持这些元数据低成本且静态；插件运行时仍通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 界面来拥有实际的 CLI 注册。

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
| `description` | 否 | `string` | 当共享主机需要一个存根命令时使用的回退帮助文本。 |

此块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。当前使用方将其作为在更广泛的插件加载之前进行缩小范围的提示，因此缺少激活元数据通常只会带来性能损耗；在旧版清单归属回退仍存在时，它不应改变正确性。

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
| `onProviders` | 否 | `string[]` | 请求这些 provider id 时应激活此插件。 |
| `onCommands` | 否 | `string[]` | 应激活此插件的命令 id。 |
| `onChannels` | 否 | `string[]` | 应激活此插件的渠道 id。 |
| `onRoutes` | 否 | `string[]` | 应激活此插件的路由类型。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的广义能力提示。 |

当前在线使用方：

- 由命令触发的 CLI 规划会回退到旧版的 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 当缺少显式渠道激活元数据时，由渠道触发的设置 / 渠道规划会回退到旧版 `channels[]` 归属
- 当缺少显式 provider 激活元数据时，由 provider 触发的设置 / 运行时规划会回退到旧版的 `providers[]` 和顶层 `cliBackends[]` 归属

## `setup` 参考

当设置和新手引导界面需要在运行时加载前获取由插件拥有的低成本元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是用于控制平面 / 设置流程的、特定于设置的描述符界面，应保持为仅元数据。

存在 `setup.providers` 和 `setup.cliBackends` 时，它们是设置发现过程中优先使用的、描述符优先的查找界面。如果该描述符仅缩小候选插件范围，而设置仍需要更丰富的设置时运行时 hooks，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

由于设置查找可能执行由插件拥有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在已发现插件之间必须保持唯一。归属不明确时会以保守方式失败，而不是按发现顺序选出一个赢家。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或新手引导期间公开的 provider id。保持规范化 id 在全局范围内唯一。 |
| `authMethods` | 否 | `string[]` | 此 provider 在无需加载完整运行时的情况下支持的设置 / 认证方法 id。 |
| `envVars` | 否 | `string[]` | 通用设置 / 状态界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和新手引导期间公开的 provider 设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先设置查找的设置时后端 id。保持规范化 id 在全局范围内唯一。 |
| `configMigrations` | 否 | `string[]` | 由此插件的设置界面拥有的配置迁移 id。 |
| `requiresRuntime` | 否 | `boolean` | 描述符查找之后，设置是否仍需要执行 `setup-api`。 |

## `uiHints` 参考

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

每个字段提示可包含：

| 字段 | 类型 | 含义 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 面向用户的字段标签。 |
| `help` | `string` | 简短辅助文本。 |
| `tags` | `string[]` | 可选的 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级项。 |
| `sensitive` | `boolean` | 将该字段标记为机密或敏感项。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## `contracts` 参考

仅当 OpenClaw 无需导入插件运行时即可读取静态能力归属元数据时，才使用 `contracts`。

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
| `embeddedExtensionFactories` | `string[]` | 内置插件可为其注册工厂的嵌入式运行时 id。 |
| `externalAuthProviders` | `string[]` | 此插件拥有其外部认证配置文件 hook 的 provider id。 |
| `speechProviders` | `string[]` | 此插件拥有的语音 provider id。 |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录 provider id。 |
| `realtimeVoiceProviders` | `string[]` | 此插件拥有的实时语音 provider id。 |
| `mediaUnderstandingProviders` | `string[]` | 此插件拥有的媒体理解 provider id。 |
| `imageGenerationProviders` | `string[]` | 此插件拥有的图像生成 provider id。 |
| `videoGenerationProviders` | `string[]` | 此插件拥有的视频生成 provider id。 |
| `webFetchProviders` | `string[]` | 此插件拥有的网页抓取 provider id。 |
| `webSearchProviders` | `string[]` | 此插件拥有的网页搜索 provider id。 |
| `tools` | `string[]` | 此插件为内置契约检查所拥有的智能体工具名称。 |

实现了 `resolveExternalAuthProfiles` 的 provider 插件应声明 `contracts.externalAuthProviders`。未作此声明的插件仍会通过已弃用的兼容性回退路径运行，但该回退更慢，并将在迁移窗口结束后移除。

## `mediaUnderstandingProviderMetadata` 参考

当某个媒体理解 provider 具有默认模型、自动认证回退优先级，或通用核心辅助工具在运行时加载前所需的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。其中的键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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
| `capabilities` | `("image" \| "audio" \| "video")[]` | 此 provider 提供的媒体能力。 |
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时使用的“能力到模型”默认值。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证的自动 provider 回退时，数值越小排序越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | provider 支持的原生文档输入。 |

## `channelConfigs` 参考

当某个渠道插件在运行时加载前需要低成本配置元数据时，请使用 `channelConfigs`。

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

每个渠道条目可包含：

| 字段 | 类型 | 含义 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` 的 JSON Schema。对每个已声明的渠道配置条目来说是必填项。 |
| `uiHints` | `Record<string, object>` | 该渠道配置部分可选的 UI 标签 / 占位符 / 敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道描述。 |
| `preferOver` | `string[]` | 在选择界面中，此渠道应优先于的旧版或较低优先级插件 id。 |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，根据简写模型 id（如 `gpt-5.4` 或 `claude-sonnet-4.6`）推断你的 provider 插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 应用以下优先级：

- 显式 `provider/model` 引用使用所属的 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 剩余的歧义会被忽略，直到用户或配置指定 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 对简写模型 id 使用 `startsWith` 匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，对简写模型 id 进行匹配的正则表达式源码。 |

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规清单加载不再将这些顶层字段视为能力归属。

## 清单与 package.json 的区别

这两个文件承担不同的职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置校验、认证选项元数据，以及必须在插件代码运行前存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块 |

如果你不确定某段元数据应放在哪里，请使用这条规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，就把它放在 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就把它放在 `package.json`

### 影响设备发现的 `package.json` 字段

某些运行时前的插件元数据有意放在 `package.json` 的 `openclaw` 块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保持在插件包目录内。 |
| `openclaw.runtimeExtensions` | 声明已安装包的构建后 JavaScript 运行时入口点。必须保持在插件包目录内。 |
| `openclaw.setupEntry` | 仅用于设置的轻量级入口点，在新手引导、延迟渠道启动以及只读渠道状态 / SecretRef 发现期间使用。必须保持在插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 声明已安装包的构建后 JavaScript 设置入口点。必须保持在插件包目录内。 |
| `openclaw.channel` | 低成本渠道目录元数据，例如标签、文档路径、别名和选择文案。 |
| `openclaw.channel.configuredState` | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅环境变量驱动的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何账号登录？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置插件和外部发布插件的安装 / 更新提示。 |
| `openclaw.install.defaultChoice` | 当存在多个安装来源时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 主机版本，使用如 `>=2026.3.22` 这样的 semver 下限。 |
| `openclaw.install.expectedIntegrity` | 期望的 npm 分发完整性字符串，例如 `sha512-...`；安装和更新流程会据此校验拉取的制品。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许一个范围很窄的内置插件重新安装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置用途的渠道界面，再加载完整渠道插件。 |

清单元数据决定了哪些 provider / 渠道 / 设置选项会在运行时加载前出现在新手引导中。`package.json#openclaw.install` 则告诉新手引导：当用户选择这些选项之一时，应如何获取或启用该插件。不要把安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装期间和清单注册表加载期间强制执行。无效值会被拒绝；值如果有效但要求更新版本，则在较旧主机上会跳过该插件。

精确的 npm 版本固定已通过 `npmSpec` 提供，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。如果你希望在拉取到的 npm 制品不再匹配已固定版本时，让更新流程以保守方式失败，请将其与 `expectedIntegrity` 搭配使用。交互式新手引导只有在 `npmSpec` 是精确版本且存在 `expectedIntegrity` 时，才会从受信任的目录元数据中提供 npm 安装选项；否则会回退到本地来源或跳过。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账号时，渠道插件应提供 `openclaw.setupEntry`。该设置入口点应暴露渠道元数据，以及适用于设置场景的安全配置、状态和 secrets 适配器；网络客户端、Gateway 网关监听器和传输协议运行时应保留在主扩展入口点中。

运行时入口点字段不会覆盖源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的作用范围被有意限制得很窄。它不会让任意损坏的配置变得可安装。当前它仅允许安装流程从特定的陈旧内置插件升级失败中恢复，例如缺失的内置插件路径，或该同一内置插件的陈旧 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作人员引导到 `openclaw doctor --fix`。

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前执行低成本的“是 / 否”认证探测时，请使用它。目标导出应是一个只读取持久化状态的小函数；不要通过完整渠道运行时 barrel 转发它。

`openclaw.channel.configuredState` 对低成本、仅环境变量的已配置检查采用相同结构：

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

当某个渠道可以从环境变量或其他微小的非运行时输入中回答已配置状态时，请使用它。如果检查需要完整配置解析或真实的渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 设备发现优先级（重复插件 id）

OpenClaw 会从多个根位置发现插件（内置、全局安装、工作区、配置中显式选择的路径）。如果两个发现结果共享同一个 `id`，则只保留 **优先级最高** 的清单；较低优先级的重复项会被丢弃，而不是与其并行加载。

优先级从高到低如下：

1. **配置选定** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一同发布的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 工作区中某个内置插件的 fork 或陈旧副本不会遮蔽内置构建版本。
- 若要真正用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，使其凭借优先级胜出，而不要依赖工作区发现。
- 被丢弃的重复项会被记录日志，以便 Doctor 和启动诊断能够指向被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 可以接受空 schema（例如 `{ "type": "object", "additionalProperties": false }`）。
- schema 会在配置读取 / 写入时校验，而不是在运行时校验。

## 校验行为

- 未知的 `channels.*` 键是 **错误**，除非该渠道 id 由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用 **可发现** 的插件 id。未知 id 属于 **错误**。
- 如果某个插件已安装，但其清单或 schema 损坏或缺失，校验会失败，且 Doctor 会报告该插件错误。
- 如果插件配置存在，但插件 **已禁用**，则会保留该配置，并在 Doctor + 日志中显示 **警告**。

完整的 `plugins.*` schema 请参阅 [配置参考](/zh-CN/gateway/configuration)。

## 说明

- 对于原生 OpenClaw 插件，清单是 **必需的**，包括本地文件系统加载的插件。
- 运行时仍会单独加载插件模块；清单仅用于设备发现 + 校验。
- 原生清单使用 JSON5 解析，因此允许注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象即可。
- 清单加载器只会读取文档中列出的清单字段。避免在这里添加自定义顶层键。
- `providerAuthEnvVars` 是用于认证探测、环境变量标记校验以及类似 provider 认证界面的低成本元数据路径；这些场景不应只是为了检查环境变量名称而启动插件运行时。
- `providerAuthAliases` 允许 provider 变体复用另一个 provider 的认证环境变量、认证配置文件、基于配置的认证以及 API key 新手引导选项，而无需在核心中硬编码这种关系。
- `providerEndpoints` 允许 provider 插件拥有简单 endpoint host/baseUrl 匹配元数据。仅将其用于核心已支持的 endpoint 类别；插件仍然拥有运行时行为。
- `syntheticAuthRefs` 是用于 provider 拥有的 synthetic auth hooks 的低成本元数据路径；这些 hooks 必须在运行时注册表存在之前就对冷启动模型发现可见。只列出其运行时 provider 或 CLI 后端实际实现了 `resolveSyntheticAuth` 的引用。
- `nonSecretAuthMarkers` 是用于内置插件拥有的占位 API key 的低成本元数据路径，例如本地、OAuth 或环境凭证标记。核心系统会将这些值视为非机密，用于认证显示和 secret 审计，而无需硬编码所属 provider。
- `channelEnvVars` 是 shell 环境变量回退、设置提示和类似渠道界面的低成本元数据路径；这些场景不应只是为了检查环境变量名称而启动插件运行时。环境变量名称只是元数据，本身并不触发激活：状态、审计、cron 投递校验和其他只读界面在将某个环境变量视为已配置渠道之前，仍会应用插件信任和有效激活策略。
- `providerAuthChoices` 是用于认证选项选择器、`--auth-choice` 解析、首选 provider 映射和简单新手引导 CLI 标志注册的低成本元数据路径，会在 provider 运行时加载前生效。关于需要 provider 代码的运行时向导元数据，请参阅 [Provider 运行时 hooks](/zh-CN/plugins/architecture#provider-runtime-hooks)。
- 互斥插件类型通过 `plugins.slots.*` 进行选择。
  - `kind: "memory"` 由 `plugins.slots.memory` 选择。
  - `kind: "context-engine"` 由 `plugins.slots.contextEngine` 选择（默认：内置 `legacy`）。
- 当插件不需要时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`）。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) —— 插件入门指南
- [插件架构](/zh-CN/plugins/architecture) —— 内部架构
- [SDK 概览](/zh-CN/plugins/sdk-overview) —— 插件 SDK 参考
