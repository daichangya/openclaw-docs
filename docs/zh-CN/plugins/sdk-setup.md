---
read_when:
    - 你正在为一个插件添加设置向导
    - 你需要理解 `setup-entry.ts` 与 `index.ts` 的区别
    - 你正在定义插件配置模式或 `package.json` 中的 OpenClaw 元数据
sidebarTitle: Setup and Config
summary: 设置向导、`setup-entry.ts`、配置模式，以及 `package.json` 元数据
title: 插件设置和配置
x-i18n:
    generated_at: "2026-04-25T21:53:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66c44a08db7c83ec981c92fadea54482e5d85af3cc3c4621916e3e0b1223d9a6
    source_path: plugins/sdk-setup.md
    workflow: 15
---

用于插件打包（`package.json` 元数据）、清单（`openclaw.plugin.json`）、设置入口和配置模式的参考。

<Tip>
  **在找操作演练？** 操作指南会在上下文中介绍打包：
  [渠道插件](/zh-CN/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和
  [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

你的 `package.json` 需要有一个 `openclaw` 字段，用来告诉插件系统你的插件提供了什么：

**渠道插件：**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**提供商插件 / ClawHub 发布基线：**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

如果你要在 ClawHub 上对外发布插件，这些 `compat` 和 `build`
字段是必需的。规范的发布代码片段位于
`docs/snippets/plugin-publish/`。

### `openclaw` 字段

| 字段         | 类型       | 说明                                                                                                                    |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | 入口点文件（相对于包根目录）                                                                                           |
| `setupEntry` | `string`   | 仅用于设置的轻量入口（可选）                                                                                           |
| `channel`    | `object`   | 用于设置、选择器、快速开始和 Status 界面的渠道目录元数据                                                              |
| `providers`  | `string[]` | 此插件注册的提供商 id                                                                                                  |
| `install`    | `object`   | 安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery` |
| `startup`    | `object`   | 启动行为标志                                                                                                           |

### `openclaw.channel`

`openclaw.channel` 是轻量级包元数据，用于在加载运行时之前支持渠道发现和设置界面。

| 字段                                   | 类型       | 含义                                              |
| -------------------------------------- | ---------- | ------------------------------------------------- |
| `id`                                   | `string`   | 规范渠道 id。                                     |
| `label`                                | `string`   | 主要渠道标签。                                    |
| `selectionLabel`                       | `string`   | 当需要与 `label` 不同时，在选择器/设置中显示的标签。 |
| `detailLabel`                          | `string`   | 用于更丰富渠道目录和 Status 界面的次级详情标签。  |
| `docsPath`                             | `string`   | 用于设置和选择链接的文档路径。                    |
| `docsLabel`                            | `string`   | 当需要与渠道 id 不同时，用作文档链接的覆盖标签。  |
| `blurb`                                | `string`   | 简短的新手引导/目录说明。                         |
| `order`                                | `number`   | 在渠道目录中的排序顺序。                          |
| `aliases`                              | `string[]` | 用于渠道选择的额外查找别名。                      |
| `preferOver`                           | `string[]` | 此渠道应优先于的低优先级插件/渠道 id。            |
| `systemImage`                          | `string`   | 可选图标/system-image 名称，用于渠道 UI 目录。    |
| `selectionDocsPrefix`                  | `string`   | 在选择界面中显示于文档链接前的前缀文本。          |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径，而不是带标签的文档链接。 |
| `selectionExtras`                      | `string[]` | 附加在选择文案中的额外短文本。                    |
| `markdownCapable`                      | `boolean`  | 将该渠道标记为支持 Markdown，用于出站格式决策。   |
| `exposure`                             | `object`   | 用于设置、已配置列表和文档界面的渠道可见性控制。  |
| `quickstartAllowFrom`                  | `boolean`  | 让此渠道加入标准快速开始 `allowFrom` 设置流程。   |
| `forceAccountBinding`                  | `boolean`  | 即使只存在一个账户，也要求显式账户绑定。          |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 解析此渠道的 announce 目标时，优先使用会话查找。  |

示例：

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` 支持：

- `configured`：在已配置/Status 风格的列表界面中包含该渠道
- `setup`：在交互式设置/配置选择器中包含该渠道
- `docs`：在文档/导航界面中将该渠道标记为面向公众

`showConfigured` 和 `showInSetup` 仍然作为旧版别名受支持。优先使用
`exposure`。

### `openclaw.install`

`openclaw.install` 是包元数据，不是清单元数据。

| 字段                         | 类型                 | 含义                                                                           |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | 用于安装/更新流程的规范 npm 说明。                                             |
| `localPath`                  | `string`             | 本地开发或内置安装路径。                                                       |
| `defaultChoice`              | `"npm"` \| `"local"` | 当两者都可用时，首选的安装来源。                                               |
| `minHostVersion`             | `string`             | 支持的最低 OpenClaw 版本，格式为 `>=x.y.z`。                                   |
| `expectedIntegrity`          | `string`             | 预期的 npm dist 完整性字符串，通常为 `sha512-...`，用于固定版本安装。          |
| `allowInvalidConfigRecovery` | `boolean`            | 允许内置插件的重新安装流程从特定的陈旧配置故障中恢复。                         |

交互式新手引导也会使用 `openclaw.install` 来支持按需安装界面。如果你的插件在运行时加载之前公开提供商认证选项，或公开渠道设置/目录元数据，新手引导可以显示该选项，提示选择 npm 或本地安装，安装或启用插件，然后继续所选流程。npm 新手引导选项需要带有注册表 `npmSpec` 的受信任目录元数据；精确版本和 `expectedIntegrity` 是可选的固定项。如果存在
`expectedIntegrity`，安装/更新流程会强制校验它。把“显示什么”的元数据放在 `openclaw.plugin.json` 中，把“如何安装它”的元数据放在 `package.json` 中。

如果设置了 `minHostVersion`，安装和清单注册表加载都会强制执行它。较旧的宿主会跳过该插件；无效的版本字符串会被拒绝。

对于固定的 npm 安装，请在 `npmSpec` 中保留精确版本，并添加预期的制品完整性：

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` 不是针对损坏配置的通用绕过方式。它只用于狭窄的内置插件恢复场景，这样重新安装/设置就能修复已知的升级遗留问题，比如缺失的内置插件路径，或同一插件对应的陈旧 `channels.<id>`
条目。如果配置因无关原因损坏，安装仍会以失败关闭，并提示操作员运行 `openclaw doctor --fix`。

### 延迟完整加载

渠道插件可以通过以下方式启用延迟加载：

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

启用后，即使对于已经配置的渠道，OpenClaw 在监听前的启动阶段也只会加载 `setupEntry`。完整入口会在 Gateway 网关开始监听之后加载。

<Warning>
  只有当你的 `setupEntry` 在 Gateway 网关开始监听之前就注册了所需的一切（渠道注册、HTTP 路由、Gateway 网关方法）时，才启用延迟加载。如果完整入口拥有必需的启动能力，请保留默认行为。
</Warning>

如果你的设置/完整入口会注册 Gateway 网关 RPC 方法，请将它们保留在插件专用前缀下。保留的核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍归核心所有，并始终解析到
`operator.admin`。

## 插件清单

每个原生插件都必须在包根目录中提供一个 `openclaw.plugin.json`。
OpenClaw 用它在不执行插件代码的情况下验证配置。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

对于渠道插件，请添加 `kind` 和 `channels`：

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

即使没有配置的插件也必须提供一个模式。空模式也是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整模式参考请参见 [插件清单](/zh-CN/plugins/manifest)。

## ClawHub 发布

对于插件包，请使用包专用的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

旧版仅用于 Skills 的发布别名适用于 Skills。插件包应始终使用
`clawhub package publish`。

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量替代方案，当 OpenClaw 只需要设置界面时（新手引导、配置修复、已禁用渠道检查），会加载它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这样可以避免在设置流程中加载重量级运行时代码（加密库、CLI 注册、后台服务）。

对于将设置安全导出保存在 sidecar 模块中的内置工作区渠道，可以使用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`，而不是
`defineSetupPluginEntry(...)`。该内置契约同样支持可选的
`runtime` 导出，这样设置阶段的运行时接线就能保持轻量且明确。

**OpenClaw 何时使用 `setupEntry` 而不是完整入口：**

- 渠道已禁用，但需要设置/新手引导界面
- 渠道已启用，但尚未配置
- 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` 必须注册的内容：**

- 渠道插件对象（通过 `defineSetupPluginEntry`）
- Gateway 网关监听前所需的任何 HTTP 路由
- 启动期间需要的任何 Gateway 网关方法

这些启动期 Gateway 网关方法仍应避免使用保留的核心管理命名空间，例如
`config.*` 或 `update.*`。

**`setupEntry` 不应包含的内容：**

- CLI 注册
- 后台服务
- 重量级运行时导入（加密库、SDK）
- 仅在启动后才需要的 Gateway 网关方法

### 窄范围设置辅助导入

对于仅限设置的热路径，如果你只需要设置界面的一部分，优先使用窄范围的设置辅助接缝，而不是更宽泛的 `plugin-sdk/setup` 总入口：

| 导入路径                           | 适用场景                                                                                     | 关键导出                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延迟渠道启动中仍可用的设置期运行时辅助工具                                | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 具备环境感知能力的账户设置适配器                                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | 设置/安装 CLI/归档/文档辅助工具                                                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

当你需要完整的共享设置工具箱时，请使用更宽泛的 `plugin-sdk/setup` 接缝，其中包括配置补丁辅助工具，例如
`moveSingleAccountChannelSectionToDefaultAccount(...)`。

这些设置补丁适配器在导入时仍然对热路径安全。它们对内置单账户提升契约界面的查找是惰性的，因此导入
`plugin-sdk/setup-runtime` 不会在适配器真正使用前急切加载内置契约界面发现逻辑。

### 渠道自有的单账户提升

当一个渠道从单账户顶层配置升级为
`channels.<id>.accounts.*` 时，默认的共享行为是将提升后的账户作用域值移动到
`accounts.default`。

内置渠道可以通过其设置契约界面缩小或覆盖这种提升行为：

- `singleAccountKeysToMove`：应移动到提升后账户中的额外顶层键
- `namedAccountPromotionKeys`：当已存在命名账户时，只将这些键移动到提升后的账户；共享的策略/投递键保留在渠道根部
- `resolveSingleAccountPromotionTarget(...)`：选择哪个现有账户接收提升后的值

Matrix 是当前的内置示例。如果恰好已经存在一个命名的 Matrix 账户，或者
`defaultAccount` 指向现有的非规范键（例如 `Ops`），提升会保留该账户，而不是新建一个
`accounts.default` 条目。

## 配置模式

插件配置会根据你的清单中的 JSON Schema 进行验证。用户通过以下方式配置插件：

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

你的插件会在注册期间通过 `api.pluginConfig` 接收此配置。

对于渠道特定配置，请改用渠道配置部分：

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### 构建渠道配置模式

使用 `buildChannelConfigSchema` 可将一个 Zod 模式转换为插件自有配置工件所使用的
`ChannelConfigSchema` 包装器：

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

对于第三方插件，冷路径契约仍然是插件清单：请将生成的 JSON Schema 镜像到
`openclaw.plugin.json#channelConfigs` 中，这样配置模式、设置和 UI 界面就能在不加载运行时代码的情况下检查 `channels.<id>`。

## 设置向导

渠道插件可以为 `openclaw onboard` 提供交互式设置向导。向导是
`ChannelPlugin` 上的一个 `ChannelSetupWizard` 对象：

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` 类型支持 `credentials`、`textInputs`、
`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等等。
完整示例请参见内置插件包（例如 Discord 插件的 `src/channel.setup.ts`）。

对于只需要标准
`note -> prompt -> parse -> merge -> patch` 流程的私信允许列表提示，优先使用
`openclaw/plugin-sdk/setup` 中的共享设置辅助工具：
`createPromptParsedAllowFromForAccount(...)`、
`createTopLevelChannelParsedAllowFromPrompt(...)` 和
`createNestedChannelParsedAllowFromPrompt(...)`。

对于仅在标签、分数和可选附加行上有所不同的渠道设置 Status 区块，优先使用
`openclaw/plugin-sdk/setup` 中的
`createStandardChannelSetupStatus(...)`，而不要在每个插件中手工重复同样的
`status` 对象。

对于仅应在特定上下文中出现的可选设置界面，请使用
`openclaw/plugin-sdk/channel-setup` 中的
`createOptionalChannelSetupSurface`：

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` 还公开了更底层的
`createOptionalChannelSetupAdapter(...)` 和
`createOptionalChannelSetupWizard(...)` 构建器，当你只需要这个可选安装界面的一半时可以使用。

生成的可选适配器/向导在真实配置写入时会失败关闭。它们会在
`validateInput`、`applyAccountConfig` 和 `finalize` 之间复用同一条“需要安装”的消息，并在设置了 `docsPath` 时附加一个文档链接。

对于基于二进制文件的设置 UI，优先使用共享的委托辅助工具，而不是在每个渠道中复制相同的二进制/Status 粘合逻辑：

- `createDetectedBinaryStatus(...)`：用于仅在标签、提示、分数和二进制检测上变化的 Status 区块
- `createCliPathTextInput(...)`：用于基于路径的文本输入
- `createDelegatedSetupWizardStatusResolvers(...)`、
  `createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和
  `createDelegatedResolveConfigured(...)`：当 `setupEntry` 需要惰性转发到更重的完整向导时使用
- `createDelegatedTextInputShouldPrompt(...)`：当 `setupEntry` 只需要委托 `textInputs[*].shouldPrompt` 决策时使用

## 发布和安装

**外部插件：** 发布到 [ClawHub](/zh-CN/tools/clawhub) 或 npm，然后安装：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw 会先尝试 ClawHub，并在失败后自动回退到 npm。你也可以显式强制使用 ClawHub：

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

没有对应的 `npm:` 覆盖方式。如果你希望在 ClawHub 回退后走 npm 路径，请使用普通的 npm 包说明：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**仓库内插件：** 放在内置插件工作区树下，构建期间会自动发现它们。

**用户可执行安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
  对于来自 npm 的安装，`openclaw plugins install` 会运行项目本地的
  `npm install --ignore-scripts`（不运行生命周期脚本），并忽略继承来的全局 npm 安装设置。请保持插件依赖树为纯 JS/TS，并避免依赖需要 `postinstall` 构建的包。
</Info>

内置且由 OpenClaw 拥有的插件是唯一的启动修复例外：当打包安装检测到某个插件已通过插件配置、旧版渠道配置，或其内置的默认启用清单而启用时，启动过程会在导入前安装该插件缺失的运行时依赖。第三方插件不应依赖启动安装；请继续使用显式的插件安装器。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
- [插件清单](/zh-CN/plugins/manifest) — 完整清单模式参考
- [构建插件](/zh-CN/plugins/building-plugins) — 分步入门指南
