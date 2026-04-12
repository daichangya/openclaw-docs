---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要提供插件配置 schema，或调试插件校验错误
summary: 插件清单 + JSON schema 要求（严格配置校验）
title: 插件清单
x-i18n:
    generated_at: "2026-04-12T16:25:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b57c7373e4ccd521b10945346db67991543bd2bed4cc8b6641e1f215b48579
    source_path: plugins/manifest.md
    workflow: 15
---

# 插件清单（`openclaw.plugin.json`）

本页仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参见 [插件 bundle](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但它们不会根据此处描述的 `openclaw.plugin.json` schema 进行校验。

对于兼容 bundle，OpenClaw 当前会在布局符合 OpenClaw 运行时预期时，读取 bundle 元数据，以及已声明的 skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值和支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下校验配置。缺失或无效的清单会被视为插件错误，并阻止配置校验。

请参见完整的插件系统指南：[插件](/zh-CN/tools/plugin)。
关于原生能力模型和当前外部兼容性指引，请参见：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在加载你的插件代码之前读取的元数据。

将它用于：

- 插件标识
- 配置校验
- 在无需启动插件运行时的情况下即可使用的认证和新手引导元数据
- 控制平面可在运行时加载前检查的轻量激活提示
- 设置 / 新手引导界面可在运行时加载前检查的轻量设置描述符
- 应在插件运行时加载前解析的别名和自动启用元数据
- 应在插件运行时加载前自动激活插件的简写模型家族归属元数据
- 用于内置兼容性接线和契约覆盖的静态能力归属快照
- 应在不加载运行时的情况下合并到目录和校验界面中的渠道特定配置元数据
- 配置 UI 提示

不要将它用于：

- 注册运行时行为
- 声明代码入口点
- npm 安装元数据

这些内容属于你的插件代码和 `package.json`。

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
  "cliBackends": ["openrouter-cli"],
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

| Field                               | Required | Type                             | What it means                                                                                                                                                                                                |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Yes      | `string`                         | 规范插件 id。这是在 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                     |
| `configSchema`                      | Yes      | `object`                         | 此插件配置的内联 JSON Schema。                                                                                                                                                                               |
| `enabledByDefault`                  | No       | `true`                           | 将内置插件标记为默认启用。省略此字段，或将其设置为任何非 `true` 的值，以使插件默认保持禁用。                                                                                                               |
| `legacyPluginIds`                   | No       | `string[]`                       | 会规范化为此规范插件 id 的旧版 id。                                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders` | No       | `string[]`                       | 当认证、配置或模型引用提到这些提供商 id 时，应自动启用此插件。                                                                                                                                               |
| `kind`                              | No       | `"memory"` \| `"context-engine"` | 声明由 `plugins.slots.*` 使用的独占插件类型。                                                                                                                                                                |
| `channels`                          | No       | `string[]`                       | 此插件拥有的渠道 id。用于设备发现和配置校验。                                                                                                                                                                |
| `providers`                         | No       | `string[]`                       | 此插件拥有的提供商 id。                                                                                                                                                                                      |
| `modelSupport`                      | No       | `object`                         | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。                                                                                                                                               |
| `cliBackends`                       | No       | `string[]`                       | 此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。                                                                                                                                         |
| `commandAliases`                    | No       | `object[]`                       | 此插件拥有的命令名称，应在运行时加载前生成具备插件感知能力的配置和 CLI 诊断信息。                                                                                                                           |
| `providerAuthEnvVars`               | No       | `Record<string, string[]>`       | OpenClaw 可在不加载插件代码的情况下检查的轻量提供商认证环境变量元数据。                                                                                                                                      |
| `providerAuthAliases`               | No       | `Record<string, string>`         | 应复用另一个提供商 id 进行认证查找的提供商 id，例如共享基础提供商 API key 和认证配置文件的 coding 提供商。                                                                                                  |
| `channelEnvVars`                    | No       | `Record<string, string[]>`       | OpenClaw 可在不加载插件代码的情况下检查的轻量渠道环境变量元数据。将其用于由环境变量驱动的渠道设置或认证界面，以便通用的启动 / 配置辅助工具能够识别。                                                      |
| `providerAuthChoices`               | No       | `object[]`                       | 用于新手引导选择器、首选提供商解析和简单 CLI flag 接线的轻量认证选项元数据。                                                                                                                                 |
| `activation`                        | No       | `object`                         | 用于由提供商、命令、渠道、路由和能力触发加载的轻量激活提示。仅元数据；插件运行时仍拥有实际行为。                                                                                                            |
| `setup`                             | No       | `object`                         | 设备发现和设置界面可在不加载插件运行时的情况下检查的轻量设置 / 新手引导描述符。                                                                                                                             |
| `contracts`                         | No       | `object`                         | 用于语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、web 获取、web 搜索和工具归属的静态内置能力快照。                                                                                    |
| `channelConfigs`                    | No       | `Record<string, object>`         | 由清单拥有的渠道配置元数据，在运行时加载前合并到设备发现和校验界面中。                                                                                                                                      |
| `skills`                            | No       | `string[]`                       | 要加载的 Skills 目录，相对于插件根目录。                                                                                                                                                                     |
| `name`                              | No       | `string`                         | 人类可读的插件名称。                                                                                                                                                                                         |
| `description`                       | No       | `string`                         | 在插件界面中显示的简短摘要。                                                                                                                                                                                 |
| `version`                           | No       | `string`                         | 信息性插件版本。                                                                                                                                                                                             |
| `uiHints`                           | No       | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                     |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在提供商运行时加载前读取这些信息。

| Field                 | Required | Type                                            | What it means                                                                                 |
| --------------------- | -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `provider`            | Yes      | `string`                                        | 此选项所属的提供商 id。                                                                       |
| `method`              | Yes      | `string`                                        | 要分发到的认证方法 id。                                                                       |
| `choiceId`            | Yes      | `string`                                        | 由新手引导和 CLI 流程使用的稳定认证选项 id。                                                  |
| `choiceLabel`         | No       | `string`                                        | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。                                      |
| `choiceHint`          | No       | `string`                                        | 选择器中显示的简短辅助文本。                                                                  |
| `assistantPriority`   | No       | `number`                                        | 在由助手驱动的交互式选择器中，值越小排序越靠前。                                              |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | 在助手选择器中隐藏该选项，但仍允许手动通过 CLI 选择。                                         |
| `deprecatedChoiceIds` | No       | `string[]`                                      | 应将用户重定向到此替代选项的旧版选项 id。                                                     |
| `groupId`             | No       | `string`                                        | 用于对相关选项进行分组的可选分组 id。                                                         |
| `groupLabel`          | No       | `string`                                        | 该分组面向用户的标签。                                                                        |
| `groupHint`           | No       | `string`                                        | 该分组的简短辅助文本。                                                                        |
| `optionKey`           | No       | `string`                                        | 用于简单单 flag 认证流程的内部选项键。                                                        |
| `cliFlag`             | No       | `string`                                        | CLI flag 名称，例如 `--openrouter-api-key`。                                                  |
| `cliOption`           | No       | `string`                                        | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。                                      |
| `cliDescription`      | No       | `string`                                        | 用于 CLI 帮助信息中的描述。                                                                   |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。                  |

## `commandAliases` 参考

当插件拥有某个运行时命令名称，而用户可能会误将其放入 `plugins.allow` 或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据在不导入插件运行时代码的情况下提供诊断信息。

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

| Field        | Required | Type              | What it means                                                  |
| ------------ | -------- | ----------------- | -------------------------------------------------------------- |
| `name`       | Yes      | `string`          | 属于此插件的命令名称。                                         |
| `kind`       | No       | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。                |
| `cliCommand` | No       | `string`          | 若存在相关根 CLI 命令，则建议用于 CLI 操作的对应根 CLI 命令。 |

## `activation` 参考

当插件可以以低成本声明哪些控制平面事件应在之后激活它时，请使用 `activation`。

此块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。
当前使用方会在更广泛的插件加载之前将其作为收窄提示，因此缺少激活元数据通常只会带来性能损耗；在旧版清单归属回退机制仍存在时，它不应改变正确性。

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

| Field            | Required | Type                                                 | What it means                                         |
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `onProviders`    | No       | `string[]`                                           | 请求这些提供商 id 时应激活此插件。                    |
| `onCommands`     | No       | `string[]`                                           | 这些命令 id 应激活此插件。                            |
| `onChannels`     | No       | `string[]`                                           | 这些渠道 id 应激活此插件。                            |
| `onRoutes`       | No       | `string[]`                                           | 这些路由类型应激活此插件。                            |
| `onCapabilities` | No       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的广义能力提示。                  |

当前在线使用方：

- 由命令触发的 CLI 规划会回退到旧版
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的设置 / 渠道规划会在缺少显式渠道激活元数据时，回退到旧版 `channels[]`
  归属信息
- 由提供商触发的设置 / 运行时规划会在缺少显式提供商激活元数据时，回退到旧版
  `providers[]` 和顶层 `cliBackends[]` 归属信息

## `setup` 参考

当设置和新手引导界面需要在运行时加载前获取由插件拥有的轻量元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面 / 设置流程的设置专用描述符界面，应保持为纯元数据。

当存在 `setup.providers` 和 `setup.cliBackends` 时，它们是设置发现过程中优先使用的描述符优先查找界面。如果该描述符仅用于收窄候选插件，而设置仍需要更丰富的设置时运行时 hook，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

由于设置查找可能会执行由插件拥有的 `setup-api` 代码，因此规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在所有已发现插件中必须保持唯一。归属不明确时会默认失败关闭，而不是按发现顺序选择一个赢家。

### `setup.providers` 参考

| Field         | Required | Type       | What it means                                                                  |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------ |
| `id`          | Yes      | `string`   | 在设置或新手引导期间公开的提供商 id。请确保规范化 id 在全局范围内唯一。        |
| `authMethods` | No       | `string[]` | 此提供商在不加载完整运行时的情况下支持的设置 / 认证方法 id。                   |
| `envVars`     | No       | `string[]` | 通用设置 / 状态界面可在插件运行时加载前检查的环境变量。                        |

### `setup` 字段

| Field              | Required | Type       | What it means                                                                                 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------- |
| `providers`        | No       | `object[]` | 在设置和新手引导期间公开的提供商设置描述符。                                                  |
| `cliBackends`      | No       | `string[]` | 用于描述符优先设置查找的设置时后端 id。请确保规范化 id 在全局范围内唯一。                    |
| `configMigrations` | No       | `string[]` | 由此插件的设置界面拥有的配置迁移 id。                                                         |
| `requiresRuntime`  | No       | `boolean`  | 描述符查找后，设置是否仍需要执行 `setup-api`。                                                |

## `uiHints` 参考

`uiHints` 是从配置字段名称到小型渲染提示的映射。

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

| Field         | Type       | What it means                       |
| ------------- | ---------- | ----------------------------------- |
| `label`       | `string`   | 面向用户的字段标签。                |
| `help`        | `string`   | 简短辅助文本。                      |
| `tags`        | `string[]` | 可选 UI 标签。                      |
| `advanced`    | `boolean`  | 将该字段标记为高级字段。            |
| `sensitive`   | `boolean`  | 将该字段标记为密钥或敏感字段。      |
| `placeholder` | `string`   | 表单输入的占位文本。                |

## `contracts` 参考

仅在 OpenClaw 可以在不导入插件运行时的情况下读取静态能力归属元数据时使用 `contracts`。

```json
{
  "contracts": {
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

| Field                            | Type       | What it means                                           |
| -------------------------------- | ---------- | ------------------------------------------------------- |
| `speechProviders`                | `string[]` | 此插件拥有的语音提供商 id。                             |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录提供商 id。                         |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音提供商 id。                         |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解提供商 id。                         |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成提供商 id。                         |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成提供商 id。                         |
| `webFetchProviders`              | `string[]` | 此插件拥有的 web 获取提供商 id。                        |
| `webSearchProviders`             | `string[]` | 此插件拥有的 web 搜索提供商 id。                        |
| `tools`                          | `string[]` | 此插件拥有的智能体工具名称，用于内置契约检查。          |

## `channelConfigs` 参考

当渠道插件需要在运行时加载前提供轻量配置元数据时，请使用 `channelConfigs`。

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

| Field         | Type                     | What it means                                                                           |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都必须提供此字段。             |
| `uiHints`     | `Record<string, object>` | 该渠道配置部分可选的 UI 标签 / 占位符 / 敏感性提示。                                   |
| `label`       | `string`                 | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。                         |
| `description` | `string`                 | 用于检查和目录界面的简短渠道描述。                                                     |
| `preferOver`  | `string[]`               | 在选择界面中，此渠道应优先于的旧版或较低优先级插件 id。                                |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，从 `gpt-5.4` 或 `claude-sonnet-4.6` 之类的简写模型 id 推断出你的提供商插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用规则：

- 显式 `provider/model` 引用使用拥有该模型的 `providers` 清单元数据
- `modelPatterns` 的优先级高于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 对于剩余的歧义，在用户或配置明确指定提供商之前会被忽略

字段：

| Field           | Type       | What it means                                                         |
| --------------- | ---------- | --------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 与简写模型 id 进行匹配的前缀。                      |
| `modelPatterns` | `string[]` | 在移除配置文件后缀后，与简写模型 id 进行匹配的正则表达式源码。        |

旧版顶层能力键已弃用。请使用 `openclaw doctor --fix` 将
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；正常的清单加载不再将这些顶层字段视为能力归属信息。

## 清单与 `package.json` 的区别

这两个文件承担不同职责：

| File                   | Use it for                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 在插件代码运行前必须存在的设备发现、配置校验、认证选项元数据和 UI 提示                              |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 配置块               |

如果你不确定某段元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，就把它放在 `openclaw.plugin.json` 中
- 如果它与打包、入口文件或 npm 安装行为有关，就把它放在 `package.json` 中

### 影响设备发现的 `package.json` 字段

某些运行时前插件元数据有意放在 `package.json` 的
`openclaw` 配置块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| Field                                                             | What it means                                                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 声明原生插件入口点。                                                                                                                      |
| `openclaw.setupEntry`                                             | 在新手引导和延迟渠道启动期间使用的轻量级仅设置入口点。                                                                                    |
| `openclaw.channel`                                                | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择文案。                                                                                |
| `openclaw.channel.configuredState`                                | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅由环境变量驱动的设置？”。                               |
| `openclaw.channel.persistedAuthState`                             | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何内容处于已登录状态？”。                              |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 用于内置插件和外部发布插件的安装 / 更新提示。                                                                                             |
| `openclaw.install.defaultChoice`                                  | 当存在多个安装来源时的首选安装路径。                                                                                                      |
| `openclaw.install.minHostVersion`                                 | 最低支持的 OpenClaw host 版本，使用类似 `>=2026.3.22` 的 semver 下限。                                                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | 当配置无效时，允许使用狭义的内置插件重新安装恢复路径。                                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置用途的渠道界面，再加载完整的渠道插件。                                                                          |

`openclaw.install.minHostVersion` 会在安装期间和清单注册表加载期间强制执行。无效值会被拒绝；较新的但有效的值会在较旧 host 上跳过该插件。

`openclaw.install.allowInvalidConfigRecovery` 的设计范围是刻意收窄的。它不会让任意损坏的配置变为可安装。当前它仅允许安装流程从特定的陈旧内置插件升级故障中恢复，例如缺失的内置插件路径，或该内置插件对应的陈旧 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作人员引导至 `openclaw doctor --fix`。

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前执行轻量级的是 / 否认证探测时，请使用它。目标导出应是一个仅仅读取持久化状态的小函数；不要通过完整的渠道运行时 barrel 暴露它。

`openclaw.channel.configuredState` 使用相同的结构来进行轻量级的仅环境变量已配置检查：

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

当渠道可以仅通过环境变量或其他轻量级非运行时输入来判断已配置状态时，请使用它。如果该检查需要完整配置解析或真实的渠道运行时，请改为将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 可以接受空 schema（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在读取 / 写入配置时进行校验，而不是在运行时进行校验。

## 校验行为

- 未知的 `channels.*` 键会被视为**错误**，除非该渠道 id 已由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 id。未知 id 会被视为**错误**。
- 如果某个插件已安装，但其清单或 schema 缺失或损坏，则校验会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件处于**禁用**状态，则配置会被保留，并且 Doctor + 日志中会显示**警告**。

完整的 `plugins.*` schema 请参见[配置参考](/zh-CN/gateway/configuration)。

## 注意事项

- 对于原生 OpenClaw 插件，清单是**必需的**，包括从本地文件系统加载的插件。
- 运行时仍会单独加载插件模块；清单仅用于设备发现 + 校验。
- 原生清单使用 JSON5 解析，因此支持注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象即可。
- 清单加载器只会读取已文档化的清单字段。避免在此添加自定义顶层键。
- `providerAuthEnvVars` 是用于认证探测、环境变量标记校验以及类似提供商认证界面的轻量元数据路径，这些场景不应仅为了检查环境变量名称而启动插件运行时。
- `providerAuthAliases` 允许提供商变体复用另一个提供商的认证环境变量、认证配置文件、基于配置的认证以及 API key 新手引导选项，而无需在 core 中硬编码这种关系。
- `channelEnvVars` 是用于 shell 环境变量回退、设置提示以及类似渠道界面的轻量元数据路径，这些场景不应仅为了检查环境变量名称而启动插件运行时。
- `providerAuthChoices` 是用于认证选项选择器、`--auth-choice` 解析、首选提供商映射以及在提供商运行时加载前注册简单新手引导 CLI flag 的轻量元数据路径。对于需要提供商代码的运行时向导元数据，请参见
  [提供商运行时 hook](/zh-CN/plugins/architecture#provider-runtime-hooks)。
- 独占插件类型通过 `plugins.slots.*` 进行选择。
  - `kind: "memory"` 通过 `plugins.slots.memory` 选择。
  - `kind: "context-engine"` 通过 `plugins.slots.contextEngine`
    选择（默认值：内置 `legacy`）。
- 当插件不需要 `channels`、`providers`、`cliBackends` 和 `skills` 时，可以省略这些字段。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器允许列表要求（例如 pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`）。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 插件入门指南
- [插件架构](/zh-CN/plugins/architecture) — 内部架构
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 插件 SDK 参考
