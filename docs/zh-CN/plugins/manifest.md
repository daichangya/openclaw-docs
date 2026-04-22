---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要提供插件配置 schema，或调试插件校验错误
summary: 插件清单 + JSON schema 要求（严格配置校验）
title: 插件清单
x-i18n:
    generated_at: "2026-04-22T07:00:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 085c1baccb96b8e6bd4033ad11bdd5f79bdb0daec470e977fce723c3ae38cc99
    source_path: plugins/manifest.md
    workflow: 15
---

# 插件清单（`openclaw.plugin.json`）

本页仅适用于**原生 OpenClaw 插件清单**。

如需了解兼容的 bundle 布局，请参阅 [插件 bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但它们不会根据此处介绍的 `openclaw.plugin.json` schema 进行校验。

对于兼容 bundle，如果其布局符合 OpenClaw 运行时预期，OpenClaw 当前会读取 bundle 元数据，以及声明的 skill 根目录、Claude 命令根目录、Claude bundle 的 `settings.json` 默认值、Claude bundle 的 LSP 默认值，以及受支持的 hook packs。

每个原生 OpenClaw 插件**必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下校验配置。缺失或无效的清单会被视为插件错误，并阻止配置校验。

完整的插件系统指南请参阅：[插件](/zh-CN/tools/plugin)。
如需了解原生能力模型及当前外部兼容性指南，请参阅：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在加载你的插件代码之前读取的元数据。

将它用于：

- 插件标识
- 配置校验
- 无需启动插件运行时即可获取的认证与新手引导元数据
- 控制平面界面可在运行时加载前检查的轻量激活提示
- 设置 / 新手引导界面可在运行时加载前检查的轻量设置描述符
- 应在插件运行时加载前解析的别名与自动启用元数据
- 应在插件运行时加载前自动激活插件的简写模型家族归属元数据
- 用于内置兼容接线与契约覆盖的静态能力归属快照
- 共享 `openclaw qa` 主机可在插件运行时加载前检查的轻量 QA 运行器元数据
- 应合并到目录与校验界面、且无需加载运行时的渠道专属配置元数据
- 配置 UI 提示

不要将它用于：

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
| ------------------------------------ | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 规范插件 id。这是 `plugins.entries.<id>` 中使用的 id。 |
| `configSchema` | 是 | `object` | 该插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略该字段，或将其设为任何非 `true` 的值，可使插件默认保持禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化到该规范插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当认证、配置或模型引用提到这些提供商 id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明用于 `plugins.slots.*` 的互斥插件类型。 |
| `channels` | 否 | `string[]` | 此插件拥有的渠道 id。用于设备发现和配置校验。 |
| `providers` | 否 | `string[]` | 此插件拥有的提供商 id。 |
| `modelSupport` | 否 | `object` | 由清单持有的简写模型家族元数据，用于在运行时之前自动加载插件。 |
| `providerEndpoints` | 否 | `object[]` | 由清单持有的端点主机 / `baseUrl` 元数据，用于 core 在提供商运行时加载前对提供商路由进行分类。 |
| `cliBackends` | 否 | `string[]` | 此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | 提供商或 CLI 后端引用；在运行时加载前的冷启动模型发现期间，应探测其由插件持有的 synthetic auth hook。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件持有的占位 API key 值，表示非机密的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 此插件拥有的命令名称；在运行时加载前，它们应生成带有插件感知的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 无需加载插件代码即可检查的轻量提供商认证环境变量元数据。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个提供商 id 进行认证查找的提供商 id，例如与基础提供商 API key 和认证配置文件共享的 coding 提供商。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 无需加载插件代码即可检查的轻量渠道环境变量元数据。将其用于由环境变量驱动的渠道设置或认证界面，以便通用启动 / 配置辅助工具能够识别。 |
| `providerAuthChoices` | 否 | `object[]` | 用于新手引导选择器、首选提供商解析和简单 CLI 标志接线的轻量认证选择元数据。 |
| `activation` | 否 | `object` | 面向提供商、命令、渠道、路由和能力触发加载的轻量激活提示。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 设备发现和设置界面可在不加载插件运行时的情况下检查的轻量设置 / 新手引导描述符。 |
| `qaRunners` | 否 | `object[]` | 共享 `openclaw qa` 主机在插件运行时加载前使用的轻量 QA 运行器描述符。 |
| `contracts` | 否 | `object` | 用于语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、网页抓取、网页搜索和工具归属的静态内置能力快照。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 为 `contracts.mediaUnderstandingProviders` 中声明的提供商 id 提供的轻量媒体理解默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单持有的渠道配置元数据，在运行时加载前合并到设备发现和校验界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skills 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 显示在插件界面中的简短摘要。 |
| `version` | 否 | `string` | 仅供参考的插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在提供商运行时加载之前读取这些内容。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的提供商 id。 |
| `method` | 是 | `string` | 要分发到的认证方式 id。 |
| `choiceId` | 是 | `string` | 由新手引导和 CLI 流程使用的稳定认证选项 id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器中显示的简短辅助文本。 |
| `assistantPriority` | 否 | `number` | 在由助手驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在助手选择器中隐藏该选项，但仍允许手动通过 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 旧版选项 id；应将用户重定向到当前替代选项。 |
| `groupId` | 否 | `string` | 用于对相关选项分组的可选分组 id。 |
| `groupLabel` | 否 | `string` | 该分组面向用户的标签。 |
| `groupHint` | 否 | `string` | 该分组的简短辅助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | 用于 CLI 帮助信息中的说明。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 该选项应出现在哪些新手引导界面中。如省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有某个运行时命令名称，而用户可能错误地将它放入 `plugins.allow` 中，或尝试将其作为根级 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据生成诊断信息，而无需导入插件运行时代码。

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
| `kind` | 否 | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根级 CLI 命令。 |
| `cliCommand` | 否 | `string` | 若存在，用于 CLI 操作时建议的相关根级 CLI 命令。 |

## `activation` 参考

当插件可以低成本声明哪些控制平面事件应在之后激活它时，请使用 `activation`。

## `qaRunners` 参考

当插件在共享 `openclaw qa` 根命令下贡献一个或多个传输运行器时，请使用 `qaRunners`。请保持这些元数据轻量且静态；实际的 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量 `runtime-api.ts` 接口负责。

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

此区块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。当前使用方会在更广泛的插件加载前将其用作缩小范围的提示，因此缺少激活元数据通常只会带来性能成本；在旧版清单归属回退机制仍存在时，它不应改变正确性。

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
| `onProviders` | 否 | `string[]` | 请求这些提供商 id 时，应激活此插件。 |
| `onCommands` | 否 | `string[]` | 应激活此插件的命令 id。 |
| `onChannels` | 否 | `string[]` | 应激活此插件的渠道 id。 |
| `onRoutes` | 否 | `string[]` | 应激活此插件的路由类型。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划所用的宽泛能力提示。 |

当前在线使用方：

- 由命令触发的 CLI 规划会回退到旧版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 当缺少显式渠道激活元数据时，渠道触发的设置 / 渠道规划会回退到旧版 `channels[]` 归属
- 当缺少显式提供商激活元数据时，提供商触发的设置 / 运行时规划会回退到旧版 `providers[]` 和顶层 `cliBackends[]` 归属

## `setup` 参考

当设置和新手引导界面需要在运行时加载前获取由插件持有的轻量元数据时，请使用 `setup`。

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

顶层 `cliBackends` 依然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是设置专用的描述符界面，供应保持为纯元数据的控制平面 / 设置流程使用。

当存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现的首选“描述符优先”查找界面。如果描述符只能缩小候选插件范围，而设置仍需要更丰富的设置期运行时 hook，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

由于设置查找可能执行插件持有的 `setup-api` 代码，因此规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在已发现插件之间保持唯一。若归属存在歧义，系统会以保守方式失败，而不是按发现顺序挑选一个赢家。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或新手引导期间公开的提供商 id。请保持规范化 id 在全局范围内唯一。 |
| `authMethods` | 否 | `string[]` | 此提供商在无需加载完整运行时的情况下支持的设置 / 认证方式 id。 |
| `envVars` | 否 | `string[]` | 通用设置 / 状态界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和新手引导期间公开的提供商设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于“描述符优先”设置查找的设置期后端 id。请保持规范化 id 在全局范围内唯一。 |
| `configMigrations` | 否 | `string[]` | 由该插件设置界面持有的配置迁移 id。 |
| `requiresRuntime` | 否 | `boolean` | 在描述符查找之后，设置是否仍需要执行 `setup-api`。 |

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

每个字段提示可以包含：

| 字段 | 类型 | 含义 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 面向用户的字段标签。 |
| `help` | `string` | 简短辅助文本。 |
| `tags` | `string[]` | 可选的 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级选项。 |
| `sensitive` | `boolean` | 将该字段标记为机密或敏感。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## `contracts` 参考

仅在 OpenClaw 无需导入插件运行时即可读取的静态能力归属元数据场景中使用 `contracts`。

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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
| `speechProviders` | `string[]` | 此插件拥有的语音提供商 id。 |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录提供商 id。 |
| `realtimeVoiceProviders` | `string[]` | 此插件拥有的实时语音提供商 id。 |
| `mediaUnderstandingProviders` | `string[]` | 此插件拥有的媒体理解提供商 id。 |
| `imageGenerationProviders` | `string[]` | 此插件拥有的图像生成提供商 id。 |
| `videoGenerationProviders` | `string[]` | 此插件拥有的视频生成提供商 id。 |
| `webFetchProviders` | `string[]` | 此插件拥有的 Web 抓取提供商 id。 |
| `webSearchProviders` | `string[]` | 此插件拥有的 Web 搜索提供商 id。 |
| `tools` | `string[]` | 在内置契约检查中，此插件拥有的智能体工具名称。 |

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解提供商具有默认模型、自动认证回退优先级，或 generic core 辅助工具在运行时加载前所需的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。键名也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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
| `capabilities` | `("image" \| "audio" \| "video")[]` | 此提供商公开的媒体能力。 |
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时使用的“能力到模型”默认映射。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证的自动提供商回退时，数值越小排序越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | 该提供商支持的原生文档输入。 |

## `channelConfigs` 参考

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
| `schema` | `object` | `channels.<id>` 的 JSON Schema。对每个已声明的渠道配置条目来说都是必填。 |
| `uiHints` | `Record<string, object>` | 该渠道配置区块可选的 UI 标签 / 占位符 / 敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道描述。 |
| `preferOver` | `string[]` | 在选择界面中，此渠道应优先于的旧版或较低优先级插件 id。 |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，根据诸如 `gpt-5.4` 或 `claude-sonnet-4.6` 之类的简写模型 id 推断你的提供商插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 采用以下优先级：

- 显式 `provider/model` 引用使用所属 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 剩余歧义会被忽略，直到用户或配置显式指定提供商

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 对简写模型 id 进行匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除配置文件后缀后，对简写模型 id 进行匹配的正则表达式源码。 |

旧版顶层能力字段已弃用。请使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；正常清单加载已不再将这些顶层字段视为能力归属。

## 清单与 `package.json` 的区别

这两个文件承担不同职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置校验、认证选项元数据，以及在插件代码运行前必须存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 配置块 |

如果你不确定某条元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，就放入 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就放入 `package.json`

### 会影响设备发现的 `package.json` 字段

某些运行时前插件元数据被有意放在 `package.json` 的 `openclaw` 配置块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保持在插件包目录内。 |
| `openclaw.runtimeExtensions` | 为已安装包声明构建后的 JavaScript 运行时入口点。必须保持在插件包目录内。 |
| `openclaw.setupEntry` | 在新手引导、延迟渠道启动以及只读渠道状态 / SecretRef 发现期间使用的轻量仅设置入口点。必须保持在插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 为已安装包声明构建后的 JavaScript 设置入口点。必须保持在插件包目录内。 |
| `openclaw.channel` | 轻量渠道目录元数据，例如标签、文档路径、别名和选择文案。 |
| `openclaw.channel.configuredState` | 轻量已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅基于环境变量的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何内容处于已登录状态？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置插件和外部发布插件的安装 / 更新提示。 |
| `openclaw.install.defaultChoice` | 当有多个安装来源可用时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 主机版本，使用类似 `>=2026.3.22` 的 semver 下限。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许使用一条受限的内置插件重新安装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置的渠道界面，再加载完整渠道插件。 |

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；在较旧主机上，较新但有效的值会导致跳过该插件。

渠道插件应提供 `openclaw.setupEntry`，以便在状态、渠道列表或 SecretRef 扫描需要识别已配置账户时，无需加载完整运行时。设置入口点应公开渠道元数据，以及适用于设置阶段的安全配置、状态和密钥适配器；网络客户端、Gateway 网关监听器和传输运行时应保留在主扩展入口点中。

运行时入口点字段不会绕过源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的设计刻意保持为窄范围。它不会让任意损坏的配置都变得可安装。当前它仅允许安装流程从某些特定的陈旧内置插件升级故障中恢复，例如缺失的内置插件路径，或同一个内置插件对应的陈旧 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作人员引导到 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是针对一个微型检查模块的包元数据：

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前进行一个低成本的“是 / 否”认证探测时，请使用它。目标导出应是一个仅读取持久化状态的小函数；不要通过完整渠道运行时 barrel 转发它。

`openclaw.channel.configuredState` 也采用相同结构，用于低成本的仅环境变量已配置检查：

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

当一个渠道可以仅通过环境变量或其他微型非运行时输入来回答已配置状态时，请使用它。如果检查需要完整配置解析或真实的渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 设备发现优先级（重复插件 id）

OpenClaw 会从多个根目录发现插件（内置、全局安装、工作区、配置中显式选择的路径）。如果两次发现共享同一个 `id`，则只保留**优先级最高**的清单；较低优先级的重复项会被丢弃，而不是与其并行加载。

优先级从高到低如下：

1. **配置选定** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一同发布的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 工作区中某个内置插件的 fork 或陈旧副本不会遮蔽内置构建。
- 如果你确实要用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，使其凭借优先级获胜，而不是依赖工作区发现。
- 重复项被丢弃会记录日志，以便 Doctor 和启动诊断可以指出被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 空 schema 也是允许的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读写时校验，而不是在运行时校验。

## 校验行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 id 已由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的**插件 id。未知 id 属于**错误**。
- 如果某个插件已安装，但其清单或 schema 缺失或损坏，校验会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件处于**禁用**状态，则配置会被保留，并且 Doctor 与日志中会显示一条**警告**。

完整的 `plugins.*` schema 请参阅[配置参考](/zh-CN/gateway/configuration)。

## 注意事项

- 清单对于**原生 OpenClaw 插件**是**必需的**，包括本地文件系统加载。
- 运行时仍会单独加载插件模块；清单仅用于设备发现 + 校验。
- 原生清单使用 JSON5 解析，因此只要最终值仍是一个对象，就接受注释、尾随逗号和未加引号的键。
- 清单加载器只读取已文档化的清单字段。避免在此添加自定义顶层键。
- `providerAuthEnvVars` 是用于认证探测、环境变量标记校验，以及类似提供商认证界面的轻量元数据路径；这些场景不应仅为了检查环境变量名称而启动插件运行时。
- `providerAuthAliases` 允许提供商变体复用另一个提供商的认证环境变量、认证配置文件、基于配置的认证以及 API key 新手引导选项，而无需在 core 中硬编码这种关系。
- `providerEndpoints` 允许提供商插件持有简单的端点主机 / `baseUrl` 匹配元数据。仅将其用于 core 已支持的端点类别；实际运行时行为仍由插件负责。
- `syntheticAuthRefs` 是用于提供商持有的 synthetic auth hook 的轻量元数据路径；这些 hook 必须在运行时注册表存在之前，对冷启动模型发现可见。只列出那些其运行时提供商或 CLI 后端实际实现了 `resolveSyntheticAuth` 的引用。
- `nonSecretAuthMarkers` 是用于内置插件持有的占位 API key 的轻量元数据路径，例如本地、OAuth 或环境凭证标记。Core 会将这些值视为非机密，用于认证显示和密钥审计，而无需硬编码其所属提供商。
- `channelEnvVars` 是用于 shell 环境变量回退、设置提示以及类似渠道界面的轻量元数据路径；这些场景不应仅为了检查环境变量名称而启动插件运行时。环境变量名称只是元数据，本身不构成激活：状态、审计、定时任务投递校验以及其他只读界面，在将某个环境变量视为已配置渠道前，仍会应用插件信任与有效激活策略。
- `providerAuthChoices` 是用于认证选项选择器、`--auth-choice` 解析、首选提供商映射，以及在提供商运行时加载前注册简单新手引导 CLI 标志的轻量元数据路径。对于需要提供商代码的运行时向导元数据，请参阅[提供商运行时 hooks](/zh-CN/plugins/architecture#provider-runtime-hooks)。
- 互斥插件类型通过 `plugins.slots.*` 选择。
  - `kind: "memory"` 通过 `plugins.slots.memory` 选择。
  - `kind: "context-engine"` 通过 `plugins.slots.contextEngine` 选择（默认值：内置 `legacy`）。
- 当插件不需要 `channels`、`providers`、`cliBackends` 和 `skills` 时，可以省略这些字段。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器允许列表要求（例如 pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`）。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 插件快速开始
- [插件架构](/zh-CN/plugins/architecture) — 内部架构
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 插件 SDK 参考
