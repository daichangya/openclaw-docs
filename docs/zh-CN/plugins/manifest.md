---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布一个插件配置 schema，或调试插件验证错误
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-24T20:10:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac25782f26abe79875c25abcd6f7b53fbe7a3c7b139c80c8a1a6675e69d6529c
    source_path: plugins/manifest.md
    workflow: 15
---

此页面仅适用于**原生 OpenClaw 插件清单**。

有关兼容的 bundle 布局，请参阅 [Plugin bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会根据此处描述的 `openclaw.plugin.json` schema 对其进行验证。

对于兼容 bundle，当前当其布局符合 OpenClaw 运行时预期时，OpenClaw 会读取 bundle 元数据，以及声明的 skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值和受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码的情况下**验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

请参阅完整的插件系统指南：[Plugins](/zh-CN/tools/plugin)。
有关原生能力模型和当前外部兼容性指引，请参阅：
[Capability model](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，能够在不启动插件运行时的情况下进行检查。

**请将它用于：**

- 插件标识、配置验证和配置 UI 提示
- 凭证、onboarding 和设置元数据（别名、自动启用、提供商环境变量、凭证选项）
- 控制平面界面的激活提示
- 简写模型家族归属
- 静态能力归属快照（`contracts`）
- 共享 `openclaw qa` 主机可检查的 QA 运行器元数据
- 合并到目录和验证界面中的渠道专用配置元数据

**不要将它用于：**注册运行时行为、声明代码入口点或 npm 安装元数据。这些应放在你的插件代码和 `package.json` 中。

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
      "choiceLabel": "OpenRouter API 密钥",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API 密钥",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API 密钥",
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

| 字段                                 | 必填 | 类型                             | 含义                                                                                                                                                                                                                 |
| ------------------------------------ | ---- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是   | `string`                         | 规范插件 id。这是在 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                             |
| `configSchema`                       | 是   | `object`                         | 该插件配置的内联 JSON Schema。                                                                                                                                                                                       |
| `enabledByDefault`                   | 否   | `true`                           | 将内置插件标记为默认启用。省略此字段，或将其设置为任何非 `true` 的值，以保持插件默认禁用。                                                                                                                          |
| `legacyPluginIds`                    | 否   | `string[]`                       | 会规范化为此规范插件 id 的旧版 id。                                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | 否   | `string[]`                       | 当凭证、配置或模型引用提到这些提供商 id 时，应自动启用此插件。                                                                                                                                                       |
| `kind`                               | 否   | `"memory"` \| `"context-engine"` | 声明由 `plugins.slots.*` 使用的排他性插件类型。                                                                                                                                                                      |
| `channels`                           | 否   | `string[]`                       | 此插件拥有的渠道 id。用于设备发现和配置验证。                                                                                                                                                                        |
| `providers`                          | 否   | `string[]`                       | 此插件拥有的提供商 id。                                                                                                                                                                                              |
| `providerDiscoveryEntry`             | 否   | `string`                         | 轻量级提供商设备发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载的、限定于清单作用域的提供商目录元数据。                                                                                    |
| `modelSupport`                       | 否   | `object`                         | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。                                                                                                                                                      |
| `providerEndpoints`                  | 否   | `object[]`                       | 由清单拥有的 endpoint 主机 / `baseUrl` 元数据，用于核心在提供商运行时加载前必须分类的提供商路由。                                                                                                                   |
| `cliBackends`                        | 否   | `string[]`                       | 此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。                                                                                                                                                |
| `syntheticAuthRefs`                  | 否   | `string[]`                       | 在运行时加载前、冷启动模型发现期间，应探测其插件自有 synthetic auth hook 的提供商或 CLI 后端引用。                                                                                                                  |
| `nonSecretAuthMarkers`               | 否   | `string[]`                       | 由内置插件拥有的占位 API 密钥值，表示非机密的本地、OAuth 或环境凭证状态。                                                                                                                                            |
| `commandAliases`                     | 否   | `object[]`                       | 由此插件拥有的命令名称，在运行时加载前应生成具备插件感知能力的配置和 CLI 诊断信息。                                                                                                                                 |
| `providerAuthEnvVars`                | 否   | `Record<string, string[]>`       | 用于提供商凭证 / 状态查找的已弃用兼容性环境变量元数据。对于新插件，优先使用 `setup.providers[].envVars`；在弃用窗口期内，OpenClaw 仍会读取此字段。                                                                 |
| `providerAuthAliases`                | 否   | `Record<string, string>`         | 应复用另一个提供商 id 进行凭证查找的提供商 id，例如与基础提供商共享 API 密钥和凭证配置文件的编码提供商。                                                                                                            |
| `channelEnvVars`                     | 否   | `Record<string, string[]>`       | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将其用于由环境变量驱动的渠道设置或凭证界面，以便通用启动 / 配置辅助工具能够识别。                                                               |
| `providerAuthChoices`                | 否   | `object[]`                       | 用于 onboarding 选择器、首选提供商解析和简单 CLI 标志接线的轻量级凭证选项元数据。                                                                                                                                  |
| `activation`                         | 否   | `object`                         | 用于由提供商、命令、渠道、路由和能力触发加载的轻量级激活规划器元数据。仅包含元数据；插件运行时仍拥有实际行为。                                                                                                      |
| `setup`                              | 否   | `object`                         | 供设备发现和设置界面在不加载插件运行时的情况下检查的轻量级设置 / onboarding 描述符。                                                                                                                               |
| `qaRunners`                          | 否   | `object[]`                       | 共享 `openclaw qa` 主机在插件运行时加载前使用的轻量级 QA 运行器描述符。                                                                                                                                             |
| `contracts`                          | 否   | `object`                         | 外部凭证 hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、网页抓取、网页搜索和工具归属的静态内置能力快照。                                                                                  |
| `mediaUnderstandingProviderMetadata` | 否   | `Record<string, object>`         | 为 `contracts.mediaUnderstandingProviders` 中声明的提供商 id 提供的轻量级媒体理解默认值。                                                                                                                           |
| `channelConfigs`                     | 否   | `Record<string, object>`         | 在运行时加载前合并到设备发现和验证界面中的、由清单拥有的渠道配置元数据。                                                                                                                                            |
| `skills`                             | 否   | `string[]`                       | 要加载的 Skills 目录，相对于插件根目录。                                                                                                                                                                             |
| `name`                               | 否   | `string`                         | 人类可读的插件名称。                                                                                                                                                                                                  |
| `description`                        | 否   | `string`                         | 在插件界面中显示的简短摘要。                                                                                                                                                                                          |
| `version`                            | 否   | `string`                         | 仅供参考的插件版本。                                                                                                                                                                                                  |
| `uiHints`                            | 否   | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                             |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个 onboarding 或凭证选项。
OpenClaw 会在提供商运行时加载之前读取这些信息。

| 字段                 | 必填 | 类型                                            | 含义                                                                                       |
| -------------------- | ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `provider`            | 是   | `string`                                        | 此选项所属的提供商 id。                                                                    |
| `method`              | 是   | `string`                                        | 要分派到的凭证方法 id。                                                                    |
| `choiceId`            | 是   | `string`                                        | 由 onboarding 和 CLI 流程使用的稳定凭证选项 id。                                           |
| `choiceLabel`         | 否   | `string`                                        | 面向用户的标签。如果省略，OpenClaw 会回退为 `choiceId`。                                   |
| `choiceHint`          | 否   | `string`                                        | 选择器的简短帮助文本。                                                                     |
| `assistantPriority`   | 否   | `number`                                        | 在由智能体驱动的交互式选择器中，值越小排序越靠前。                                         |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                  | 在智能体选择器中隐藏此选项，但仍允许手动通过 CLI 进行选择。                                |
| `deprecatedChoiceIds` | 否   | `string[]`                                      | 应将用户重定向到此替代选项的旧版选项 id。                                                  |
| `groupId`             | 否   | `string`                                        | 用于对相关选项分组的可选组 id。                                                            |
| `groupLabel`          | 否   | `string`                                        | 该分组面向用户的标签。                                                                     |
| `groupHint`           | 否   | `string`                                        | 该分组的简短帮助文本。                                                                     |
| `optionKey`           | 否   | `string`                                        | 用于简单单标志凭证流程的内部选项键。                                                       |
| `cliFlag`             | 否   | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                |
| `cliOption`           | 否   | `string`                                        | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。                                   |
| `cliDescription`      | 否   | `string`                                        | 用于 CLI 帮助信息中的描述。                                                                |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation">` | 此选项应显示在哪些 onboarding 界面中。如果省略，默认值为 `["text-inference"]`。            |

## `commandAliases` 参考

当插件拥有某个运行时命令名称，而用户可能会误将其放入 `plugins.allow`，或尝试将其作为根级 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用此元数据在不导入插件运行时代码的情况下提供诊断信息。

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

| 字段         | 必填 | 类型              | 含义                                                             |
| ------------ | ---- | ----------------- | ---------------------------------------------------------------- |
| `name`       | 是   | `string`          | 属于此插件的命令名称。                                           |
| `kind`       | 否   | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根级 CLI 命令。                |
| `cliCommand` | 否   | `string`          | 可用于 CLI 操作时建议的相关根级 CLI 命令（如果存在）。           |

## `activation` 参考

当插件能够以低成本声明哪些控制平面事件应将其纳入激活 / 加载计划时，请使用 `activation`。

该区块是规划器元数据，而不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已经执行。激活规划器使用这些字段在回退到现有清单归属元数据（如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks）之前，先缩小候选插件范围。

优先使用已经描述归属关系的最窄元数据。如果 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 这些字段已经能够表达这种关系，就使用它们。仅在这些归属字段无法表示额外规划器提示时，才使用 `activation`。

该区块仅包含元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。当前使用方会在更广泛的插件加载之前将其作为缩小范围的提示，因此缺失激活元数据通常只会带来性能成本；在旧版清单归属回退仍存在的情况下，它不应影响正确性。

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

| 字段             | 必填 | 类型                                                 | 含义                                                                                       |
| ---------------- | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `onProviders`    | 否   | `string[]`                                           | 应将此插件纳入激活 / 加载计划的提供商 id。                                                 |
| `onCommands`     | 否   | `string[]`                                           | 应将此插件纳入激活 / 加载计划的命令 id。                                                   |
| `onChannels`     | 否   | `string[]`                                           | 应将此插件纳入激活 / 加载计划的渠道 id。                                                   |
| `onRoutes`       | 否   | `string[]`                                           | 应将此插件纳入激活 / 加载计划的路由类型。                                                  |
| `onCapabilities` | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。若可能，优先使用更窄的字段。                           |

当前正在使用的消费者：

- 由命令触发的 CLI 规划会回退到旧版的
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的设置 / 渠道规划在缺少显式渠道激活元数据时，
  会回退到旧版的 `channels[]` 归属
- 由提供商触发的设置 / 运行时规划在缺少显式提供商
  激活元数据时，会回退到旧版的
  `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示与清单归属回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改为使用了 `commandAliases` 归属。这些原因标签用于宿主诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## `qaRunners` 参考

当插件在共享的 `openclaw qa` 根命令下贡献一个或多个传输运行器时，请使用 `qaRunners`。保持这些元数据轻量且静态；插件运行时仍通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 接口拥有实际的 CLI 注册逻辑。

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

| 字段          | 必填 | 类型     | 含义                                                                  |
| ------------- | ---- | -------- | --------------------------------------------------------------------- |
| `commandName` | 是   | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。                      |
| `description` | 否   | `string` | 当共享宿主需要一个 stub 命令时使用的回退帮助文本。                    |

## `setup` 参考

当设置和 onboarding 界面在运行时加载前需要低成本的、由插件拥有的元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是控制平面 / 设置流程使用的、专用于设置的描述符界面，应保持为仅元数据。

存在 `setup.providers` 和 `setup.cliBackends` 时，它们是设置设备发现的首选“描述符优先”查找界面。如果描述符只能缩小候选插件范围，而设置仍需要更丰富的设置时运行时 hooks，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 还会在通用提供商凭证和环境变量查找中包含 `setup.providers[].envVars`。在弃用窗口期内，`providerAuthEnvVars` 仍通过兼容适配器受到支持，但仍在使用它的非内置插件会收到清单诊断。新插件应将设置 / 状态环境变量元数据放在 `setup.providers[].envVars` 上。

仅当这些描述符对设置界面已经足够时，才设置 `requiresRuntime: false`。OpenClaw 将显式的 `false` 视为仅描述符契约，并且不会为设置查找执行 `setup-api`。省略 `requiresRuntime` 会保留旧版回退行为，以便那些在未添加该标志的情况下已添加描述符的现有插件不会中断。

由于设置查找可能执行插件自有的 `setup-api` 代码，因此规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在所有已发现插件之间必须保持唯一。归属不明确时会以封闭失败方式处理，而不是根据发现顺序选出一个获胜者。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的提供商或 CLI 后端，或某个描述符没有对应的运行时注册，设置注册表诊断会报告描述符漂移。这些诊断是附加性的，不会拒绝旧版插件。

### `setup.providers` 参考

| 字段          | 必填 | 类型       | 含义                                                                       |
| ------------- | ---- | ---------- | -------------------------------------------------------------------------- |
| `id`          | 是   | `string`   | 在设置或 onboarding 期间公开的提供商 id。保持规范化 id 在全局范围内唯一。  |
| `authMethods` | 否   | `string[]` | 此提供商在不加载完整运行时的情况下支持的设置 / 凭证方法 id。               |
| `envVars`     | 否   | `string[]` | 通用设置 / 状态界面可在插件运行时加载前检查的环境变量。                    |

### `setup` 字段

| 字段               | 必填 | 类型       | 含义                                                                                     |
| ------------------ | ---- | ---------- | ---------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 在设置和 onboarding 期间公开的提供商设置描述符。                                         |
| `cliBackends`      | 否   | `string[]` | 用于描述符优先设置查找的设置阶段后端 id。保持规范化 id 在全局范围内唯一。                |
| `configMigrations` | 否   | `string[]` | 属于此插件设置界面的配置迁移 id。                                                        |
| `requiresRuntime`  | 否   | `boolean`  | 在描述符查找之后，设置是否仍需要执行 `setup-api`。                                       |

## `uiHints` 参考

`uiHints` 是从配置字段名到小型渲染提示的映射。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API 密钥",
      "help": "用于 OpenRouter 请求",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

每个字段提示可以包含：

| 字段          | 类型       | 含义                            |
| ------------- | ---------- | ------------------------------- |
| `label`       | `string`   | 面向用户的字段标签。            |
| `help`        | `string`   | 简短帮助文本。                  |
| `tags`        | `string[]` | 可选的 UI 标签。                |
| `advanced`    | `boolean`  | 将该字段标记为高级。            |
| `sensitive`   | `boolean`  | 将该字段标记为机密或敏感。      |
| `placeholder` | `string`   | 表单输入框的占位文本。          |

## `contracts` 参考

仅在 OpenClaw 能够在不导入插件运行时的情况下读取静态能力归属元数据时，才使用 `contracts`。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex-app-server"],
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

| 字段                             | 类型       | 含义                                                           |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | 已弃用的内嵌扩展工厂 id。                                      |
| `agentToolResultMiddleware`      | `string[]` | 此插件可为其注册工具结果中间件的 harness id。                  |
| `externalAuthProviders`          | `string[]` | 此插件拥有其外部凭证配置文件 hook 的提供商 id。                |
| `speechProviders`                | `string[]` | 此插件拥有的语音提供商 id。                                    |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录提供商 id。                                |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音提供商 id。                                |
| `memoryEmbeddingProviders`       | `string[]` | 此插件拥有的 Memory 嵌入提供商 id。                            |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解提供商 id。                                |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成提供商 id。                                |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成提供商 id。                                |
| `webFetchProviders`              | `string[]` | 此插件拥有的网页抓取提供商 id。                                |
| `webSearchProviders`             | `string[]` | 此插件拥有的网页搜索提供商 id。                                |
| `tools`                          | `string[]` | 此插件拥有的智能体工具名称，用于内置契约检查。                 |

保留 `contracts.embeddedExtensionFactories` 是为了兼容仍需要直接 Pi 内嵌运行器事件的内置兼容代码。新的工具结果转换应声明 `contracts.agentToolResultMiddleware`，并改为使用 `api.registerAgentToolResultMiddleware(...)` 进行注册。

实现 `resolveExternalAuthProfiles` 的提供商插件应声明 `contracts.externalAuthProviders`。未声明该字段的插件仍会通过已弃用的兼容回退继续运行，但该回退更慢，并将在迁移窗口结束后移除。

内置的 Memory 嵌入提供商应为其公开的每个适配器 id 声明 `contracts.memoryEmbeddingProviders`，包括诸如 `local` 之类的内置适配器。独立 CLI 路径使用此清单契约，仅在完整 Gateway 网关运行时注册提供商之前加载所属插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解提供商具有默认模型、自动凭证回退优先级，或在运行时加载前就需要供通用核心辅助工具使用的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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

| 字段                   | 类型                                | 含义                                                                       |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此提供商公开的媒体能力。                                                   |
| `defaultModels`        | `Record<string, string>`            | 当配置未指定模型时使用的“能力到模型”默认值。                               |
| `autoPriority`         | `Record<string, number>`            | 用于基于凭证自动回退提供商时的排序优先级，数字越小排序越靠前。             |
| `nativeDocumentInputs` | `"pdf"[]`                           | 该提供商支持的原生文档输入。                                               |

## `channelConfigs` 参考

当渠道插件在运行时加载前需要低成本配置元数据时，请使用 `channelConfigs`。

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

| 字段          | 类型                     | 含义                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都必须提供。                  |
| `uiHints`     | `Record<string, object>` | 该渠道配置部分的可选 UI 标签 / 占位符 / 敏感性提示。                                  |
| `label`       | `string`                 | 当运行时元数据尚未准备好时，合并到选择器和检查界面中的渠道标签。                      |
| `description` | `string`                 | 用于检查和目录界面的简短渠道描述。                                                    |
| `preferOver`  | `string[]`               | 在选择界面中应优先于其显示的旧版或较低优先级插件 id。                                 |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，根据诸如 `gpt-5.5` 或 `claude-sonnet-4.6` 这样的简写模型 id 推断你的提供商插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用：

- 显式 `provider/model` 引用使用所属 `providers` 清单元数据
- `modelPatterns` 的优先级高于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 对于其余歧义，在用户或配置明确指定提供商之前会被忽略

字段：

| 字段            | 类型       | 含义                                                                          |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 针对简写模型 id 进行匹配的前缀。                            |
| `modelPatterns` | `string[]` | 在移除配置文件后缀后，针对简写模型 id 进行匹配的正则表达式源码。              |

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规清单加载不再将这些顶层字段视为能力归属。

## 清单与 package.json 的区别

这两个文件承担不同的职责：

| 文件                   | 用途                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置验证、凭证选项元数据，以及在插件代码运行前必须存在的 UI 提示                                             |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 区块                                    |

如果你不确定某段元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，就把它放在 `openclaw.plugin.json` 中
- 如果它与打包、入口文件或 npm 安装行为有关，就把它放在 `package.json` 中

### 影响设备发现的 `package.json` 字段

某些运行时前插件元数据有意放在 `package.json` 的 `openclaw` 区块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段                                                              | 含义                                                                                                                                                                               |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 声明原生插件入口点。必须保持在插件包目录内。                                                                                                                                        |
| `openclaw.runtimeExtensions`                                      | 声明已安装包的构建后 JavaScript 运行时入口点。必须保持在插件包目录内。                                                                                                             |
| `openclaw.setupEntry`                                             | 仅用于设置的轻量级入口点，用于 onboarding、延迟渠道启动和只读渠道状态 / SecretRef 设备发现。必须保持在插件包目录内。                                                             |
| `openclaw.runtimeSetupEntry`                                      | 声明已安装包的构建后 JavaScript 设置入口点。必须保持在插件包目录内。                                                                                                               |
| `openclaw.channel`                                                | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择文案。                                                                                                                         |
| `openclaw.channel.configuredState`                                | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅由环境变量驱动的设置？”。                                                                           |
| `openclaw.channel.persistedAuthState`                             | 轻量级持久化凭证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何内容处于已登录状态？”。                                                                         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 用于内置和外部发布插件的安装 / 更新提示。                                                                                                                                           |
| `openclaw.install.defaultChoice`                                  | 当存在多个安装来源时的首选安装路径。                                                                                                                                                |
| `openclaw.install.minHostVersion`                                 | 最低支持的 OpenClaw 宿主版本，使用类似 `>=2026.3.22` 的 semver 下限。                                                                                                              |
| `openclaw.install.expectedIntegrity`                              | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会根据它验证获取到的制品。                                                                                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | 当配置无效时，允许一个狭窄的内置插件重新安装恢复路径。                                                                                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置用的渠道界面，然后再加载完整渠道插件。                                                                                                                    |

清单元数据决定了在运行时加载前，onboarding 中会出现哪些提供商 / 渠道 / 设置选项。`package.json#openclaw.install` 则告诉 onboarding，当用户选择其中某个选项时，应如何获取或启用该插件。不要将安装提示移动到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装期间和清单注册表加载期间强制执行。无效值会被拒绝；对较旧宿主而言，较新但有效的值会导致跳过该插件。

精确的 npm 版本固定已存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确 spec 与 `expectedIntegrity` 配对使用，这样如果获取到的 npm 制品不再匹配固定的发布版本，更新流程就会以封闭失败方式处理。出于兼容性考虑，交互式 onboarding 仍会提供受信任注册表的 npm spec，包括裸包名和 dist-tag。目录诊断可以区分精确、浮动、带完整性固定、缺失完整性、包名不匹配和无效默认选项来源。它们还会在存在 `expectedIntegrity` 但没有可用于固定的有效 npm 来源时发出警告。存在 `expectedIntegrity` 时，安装 / 更新流程会强制执行它；省略时，注册表解析会被记录，但不会附带完整性固定。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。设置入口点应公开渠道元数据以及适用于设置的安全配置、状态和密钥适配器；将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的作用范围是有意保持狭窄的。它不会让任意损坏的配置都变得可安装。当前它只允许安装流程从特定的过时内置插件升级失败中恢复，例如缺失的内置插件路径，或该内置插件对应的过时 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作人员引导到 `openclaw doctor --fix`。

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前进行一个低成本的“是 / 否”凭证探测时，请使用它。目标导出应是一个仅读取持久化状态的小函数；不要通过完整渠道运行时 barrel 来间接调用它。

`openclaw.channel.configuredState` 对低成本的仅环境变量配置检查采用相同的结构：

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

当某个渠道能够通过环境变量或其他微型非运行时输入回答已配置状态时，请使用它。如果检查需要完整配置解析或真实渠道运行时，请将该逻辑保留在插件的 `config.hasConfiguredState` hook 中。

## 设备发现优先级（重复插件 id）

OpenClaw 会从多个根位置发现插件（内置、全局安装、工作区、配置中显式选择的路径）。如果两个发现结果共享同一个 `id`，则只保留**优先级最高**的清单；低优先级的重复项会被丢弃，而不会与其并行加载。

优先级从高到低如下：

1. **配置中选择的** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一起发布的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 位于工作区中的内置插件分叉或过时副本不会遮蔽内置构建。
- 如果要真正用本地插件覆盖一个内置插件，请通过 `plugins.entries.<id>` 固定它，使其依靠优先级获胜，而不是依赖工作区发现。
- 被丢弃的重复项会被记录下来，以便 Doctor 和启动诊断能够指出被丢弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 空 schema 也是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读取 / 写入时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 id 由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 id。未知 id 是**错误**。
- 如果插件已安装，但其清单或 schema 损坏或缺失，
  验证会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件被**禁用**，配置会被保留，
  并且 Doctor + 日志中会显示**警告**。

有关完整的 `plugins.*` schema，请参阅[配置参考](/zh-CN/gateway/configuration)。

## 说明

- 对于**原生 OpenClaw 插件**，包括本地文件系统加载，清单都是**必需的**。运行时仍会单独加载插件模块；清单仅用于设备发现 + 验证。
- 原生清单使用 JSON5 解析，因此支持注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象即可。
- 清单加载器只会读取有文档说明的清单字段。避免使用自定义顶层键。
- 当插件不需要它们时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；应将其用于静态提供商目录元数据或狭义设备发现描述符，而不是请求时执行。
- 排他性插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory` 选择，`kind: "context-engine"` 通过 `plugins.slots.contextEngine` 选择（默认值为 `legacy`）。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅具有声明性。状态、审计、cron 投递验证和其他只读界面在将某个环境变量视为已配置之前，仍会应用插件信任和有效激活策略。
- 有关需要提供商代码的运行时向导元数据，请参阅[提供商运行时 hook](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
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
