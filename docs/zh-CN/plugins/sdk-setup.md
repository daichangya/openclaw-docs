---
read_when:
    - 你正在为插件添加一个设置向导
    - 你需要了解 setup-entry.ts 与 index.ts 的区别
    - 你正在定义插件配置 schema 或 package.json 中的 openclaw 元数据
sidebarTitle: Setup and Config
summary: 设置向导、setup-entry.ts、配置 schema 和 package.json 元数据
title: 插件设置和配置
x-i18n:
    generated_at: "2026-04-23T20:58:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

插件打包（`package.json` 元数据）、manifest
（`openclaw.plugin.json`）、setup 入口和配置 schema 的参考。

<Tip>
  **想看操作指南？** 如何打包的完整流程请参见：
  [渠道插件](/zh-CN/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和
  [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

你的 `package.json` 需要一个 `openclaw` 字段，用来告诉插件系统
你的插件提供什么：

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

如果你要将插件发布到外部的 ClawHub，那么这些 `compat` 和 `build`
字段是必需的。规范的发布片段位于
`docs/snippets/plugin-publish/` 中。

### `openclaw` 字段

| 字段         | 类型       | 说明                                                                                                                     |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | 入口点文件（相对于包根目录）                                                                                             |
| `setupEntry` | `string`   | 轻量级、仅用于 setup 的入口（可选）                                                                                      |
| `channel`    | `object`   | 用于 setup、选择器、快速开始和状态界面的渠道目录元数据                                                                   |
| `providers`  | `string[]` | 该插件注册的提供商 id                                                                                                    |
| `install`    | `object`   | 安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery` |
| `startup`    | `object`   | 启动行为标志                                                                                                             |

### `openclaw.channel`

`openclaw.channel` 是用于渠道发现和 setup
界面的轻量包元数据，在运行时加载之前即可使用。

| 字段                                   | 类型       | 含义                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 规范渠道 id。                                                                 |
| `label`                                | `string`   | 主渠道标签。                                                                  |
| `selectionLabel`                       | `string`   | 当需要与 `label` 不同时，在选择器/setup 中显示的标签。                        |
| `detailLabel`                          | `string`   | 用于更丰富的渠道目录和状态界面的次级详细标签。                                |
| `docsPath`                             | `string`   | 用于 setup 和选择链接的文档路径。                                             |
| `docsLabel`                            | `string`   | 当需要与渠道 id 不同时，用作文档链接的标签覆盖。                              |
| `blurb`                                | `string`   | 简短的新手引导/目录描述。                                                     |
| `order`                                | `number`   | 渠道目录中的排序顺序。                                                        |
| `aliases`                              | `string[]` | 渠道选择时的额外查找别名。                                                    |
| `preferOver`                           | `string[]` | 该渠道应优先于的低优先级插件/渠道 id。                                        |
| `systemImage`                          | `string`   | 渠道 UI 目录中可选的图标/system-image 名称。                                  |
| `selectionDocsPrefix`                  | `string`   | 选择界面中显示在文档链接之前的前缀文本。                                      |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径，而不是带标签的文档链接。                        |
| `selectionExtras`                      | `string[]` | 附加到选择文案中的额外短文本。                                                |
| `markdownCapable`                      | `boolean`  | 标记该渠道是否支持 markdown，用于出站格式决策。                               |
| `exposure`                             | `object`   | 渠道在 setup、已配置列表和文档界面中的可见性控制。                            |
| `quickstartAllowFrom`                  | `boolean`  | 让该渠道加入标准快速开始 `allowFrom` 设置流程。                               |
| `forceAccountBinding`                  | `boolean`  | 即使只存在一个账户，也要求显式账户绑定。                                      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 为该渠道解析 announce 目标时，优先使用会话查询。                              |

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

- `configured`：在已配置/状态类列表界面中包含该渠道
- `setup`：在交互式 setup/configure 选择器中包含该渠道
- `docs`：在文档/导航界面中将该渠道标记为面向公开

`showConfigured` 和 `showInSetup` 仍作为旧版别名受支持。请优先使用
`exposure`。

### `openclaw.install`

`openclaw.install` 是包元数据，不是 manifest 元数据。

| 字段                         | 类型                 | 含义                                                                             |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 用于安装/更新流程的规范 npm spec。                                               |
| `localPath`                  | `string`             | 本地开发或内置安装路径。                                                         |
| `defaultChoice`              | `"npm"` \| `"local"` | 当两者都可用时，首选安装来源。                                                   |
| `minHostVersion`             | `string`             | 最低支持的 OpenClaw 版本，格式为 `>=x.y.z`。                                     |
| `expectedIntegrity`          | `string`             | 预期的 npm dist 完整性字符串，通常为 `sha512-...`，用于固定安装。                |
| `allowInvalidConfigRecovery` | `boolean`            | 允许内置插件重新安装流程从特定的陈旧配置失败中恢复。                             |

交互式新手引导也会使用 `openclaw.install` 来驱动按需安装
界面。如果你的插件在运行时加载之前就公开提供商身份验证选项或渠道 setup/目录
元数据，那么新手引导就可以显示该选项、提示用户选择 npm 或本地安装、安装或启用插件，然后继续所选
流程。npm 新手引导选项要求目录元数据受信任，并带有 registry
`npmSpec`；精确版本和 `expectedIntegrity` 是可选的固定项。如果
存在 `expectedIntegrity`，安装/更新流程会强制校验它。请将“显示什么”
元数据放在 `openclaw.plugin.json` 中，将“如何安装它”
元数据放在 `package.json` 中。

如果设置了 `minHostVersion`，安装和 manifest 注册表加载都会强制执行它。
较旧的宿主会跳过该插件；无效版本字符串会被拒绝。

对于固定的 npm 安装，请在 `npmSpec` 中保留精确版本，并添加
预期的工件完整性：

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

`allowInvalidConfigRecovery` 不是针对损坏配置的通用绕过开关。它
仅用于狭义的内置插件恢复，因此重新安装/setup 可以修复已知的升级遗留问题，例如缺失的内置插件路径或该插件对应的过期 `channels.<id>`
条目。如果配置因无关原因损坏，安装仍会以失败关闭方式终止，并提示运维者运行 `openclaw doctor --fix`。

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

启用后，即使是已配置的渠道，OpenClaw 也只会在预监听启动
阶段加载 `setupEntry`。完整入口会在 gateway 开始监听之后再加载。

<Warning>
  只有当你的 `setupEntry` 注册了 gateway 在开始监听前所需的一切内容时，
  才应启用延迟加载（渠道注册、HTTP 路由、gateway 方法）。如果完整入口拥有所需的启动能力，请保持默认行为。
</Warning>

如果你的 setup/完整入口会注册 gateway RPC 方法，请将它们放在
插件专属前缀下。保留的核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）始终归核心所有，并且总是解析为 `operator.admin`。

## 插件 manifest

每个原生插件都必须在包根目录提供一个 `openclaw.plugin.json`。
OpenClaw 使用它在**不执行插件代码**的情况下校验配置。

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

即使插件没有任何配置，也必须提供一个 schema。空 schema 也是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整 schema 参考请参见 [插件 Manifest](/zh-CN/plugins/manifest)。

## ClawHub 发布

对于插件包，请使用包专属的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

旧版的仅适用于 Skills 的发布别名是给 Skills 用的。插件包应
始终使用 `clawhub package publish`。

## Setup 入口

`setup-entry.ts` 是 `index.ts` 的轻量替代，用于
OpenClaw 只需要 setup 界面时加载（新手引导、配置修复、
已禁用渠道检查）。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这样可以避免在 setup 流程中加载沉重的运行时代码（加密库、CLI 注册、
后台服务）。

对于将 setup 安全导出保存在 sidecar 模块中的内置工作区渠道，可以使用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`，而不是
`defineSetupPluginEntry(...)`。该内置合约还支持一个可选的
`runtime` 导出，以便 setup 时的运行时接线保持轻量且明确。

**OpenClaw 在以下情况下会使用 `setupEntry` 而不是完整入口：**

- 渠道已禁用，但需要 setup/新手引导界面
- 渠道已启用但尚未配置
- 启用了延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` 必须注册的内容：**

- 渠道插件对象（通过 `defineSetupPluginEntry`）
- 在 gateway 开始监听前所需的任何 HTTP 路由
- 启动期间所需的任何 gateway 方法

这些启动期 gateway 方法仍应避免使用保留的核心管理
命名空间，例如 `config.*` 或 `update.*`。

**`setupEntry` 不应包含的内容：**

- CLI 注册
- 后台服务
- 沉重的运行时导入（加密、SDK）
- 仅在启动后才需要的 gateway 方法

### 窄化的 setup helper 导入

对于 setup 专用的热路径，当你只需要 setup 接口的一部分时，优先使用更窄的 setup helper 接口，而不是更宽泛的
`plugin-sdk/setup` 总入口：

| 导入路径                             | 适用场景                                                                               | 关键导出                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`           | 在 `setupEntry` / 延迟渠道启动中仍可用的 setup 时运行时 helper                         | `createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`   | 感知环境变量的账户 setup 适配器                                                        | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`             | setup/安装 CLI/压缩包/文档 helper                                                     | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR`                                                                                                                                                                              |

当你需要完整的共享 setup 工具箱时，请使用更宽泛的 `plugin-sdk/setup`
接口，包括配置补丁 helper，例如
`moveSingleAccountChannelSectionToDefaultAccount(...)`。

这些 setup patch 适配器在导入时依然是热路径安全的。它们内置的
单账户提升合约表面查询是惰性的，因此导入
`plugin-sdk/setup-runtime` 不会在适配器真正被使用之前急切加载内置合约表面发现逻辑。

### 渠道自有的单账户提升

当某个渠道从单账户顶层配置升级到
`channels.<id>.accounts.*` 时，默认共享行为是将提升后的
账户作用域值移动到 `accounts.default`。

内置渠道可以通过其 setup
合约表面来收窄或覆盖该提升行为：

- `singleAccountKeysToMove`：应移动到提升后账户中的额外顶层键
- `namedAccountPromotionKeys`：当具名账户已存在时，只有这些
  键会移动到提升后的账户；共享的策略/投递键仍保留在渠道根部
- `resolveSingleAccountPromotionTarget(...)`：选择哪个现有账户
  接收提升后的值

Matrix 是当前的内置示例。如果恰好只存在一个具名 Matrix 账户，
或者 `defaultAccount` 指向了一个现有的非规范键，例如 `Ops`，提升过程将保留该账户，而不是创建新的
`accounts.default` 条目。

## 配置 schema

插件配置会根据 manifest 中的 JSON Schema 进行校验。用户通过以下方式配置插件：

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

你的插件会在注册期间通过 `api.pluginConfig` 接收到该配置。

对于渠道专属配置，请改用渠道配置部分：

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

### 构建渠道配置 schema

使用 `openclaw/plugin-sdk/core` 中的 `buildChannelConfigSchema`，将
Zod schema 转换为 OpenClaw 可校验的 `ChannelConfigSchema` 包装器：

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## 设置向导

渠道插件可以为 `openclaw onboard` 提供交互式设置向导。
该向导是 `ChannelPlugin` 上的一个 `ChannelSetupWizard` 对象：

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
`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。
完整示例请参见内置插件包（例如 Discord 插件中的 `src/channel.setup.ts`）。

对于只需要标准
`note -> prompt -> parse -> merge -> patch` 流程的私信 allowlist 提示，请优先使用
`openclaw/plugin-sdk/setup` 中的共享 setup helper：
`createPromptParsedAllowFromForAccount(...)`、
`createTopLevelChannelParsedAllowFromPrompt(...)` 和
`createNestedChannelParsedAllowFromPrompt(...)`。

对于仅在标签、分数和可选额外行上有所不同的渠道 setup 状态块，请优先使用
`openclaw/plugin-sdk/setup` 中的 `createStandardChannelSetupStatus(...)`，
而不是在每个插件中手写相同的 `status` 对象。

对于只应在特定上下文中出现的可选 setup 界面，请使用
`openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface`：

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// 返回 { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` 还暴露了更底层的
`createOptionalChannelSetupAdapter(...)` 和
`createOptionalChannelSetupWizard(...)` 构建器，以便在你只需要这个可选安装界面的一半时使用。

生成的可选适配器/向导在真实配置写入时会以失败关闭方式处理。它们
会在 `validateInput`、
`applyAccountConfig` 和 `finalize` 中复用一条“需要安装”的消息，并在设置了 `docsPath` 时附加文档链接。

对于基于二进制的 setup UI，请优先使用共享的委派 helper，而不是
在每个渠道中复制相同的二进制/状态胶水逻辑：

- `createDetectedBinaryStatus(...)`：用于仅在标签、
  提示、分数和二进制检测上不同的状态块
- `createCliPathTextInput(...)`：用于基于路径的文本输入
- `createDelegatedSetupWizardStatusResolvers(...)`、
  `createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和
  `createDelegatedResolveConfigured(...)`：当 `setupEntry` 需要懒加载转发到
  更重的完整向导时使用
- `createDelegatedTextInputShouldPrompt(...)`：当 `setupEntry` 只需要
  委派 `textInputs[*].shouldPrompt` 的决策时使用

## 发布与安装

**外部插件：** 发布到 [ClawHub](/zh-CN/tools/clawhub) 或 npm，然后安装：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw 会先尝试 ClawHub，再自动回退到 npm。你也可以
显式强制使用 ClawHub：

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # 仅 ClawHub
```

没有对应的 `npm:` 覆盖前缀。如果你想在 ClawHub 回退之后走 npm 路径，
请直接使用普通 npm 包规范：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**仓库内插件：** 放在内置插件工作区树下，它们会在构建期间自动
被发现。

**用户可安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
  对于来自 npm 的安装，`openclaw plugins install` 会运行
  `npm install --ignore-scripts`（不执行 lifecycle scripts）。请保持插件依赖
  树为纯 JS/TS，并避免依赖需要 `postinstall` 构建的包。
</Info>

只有内置且由 OpenClaw 拥有的插件是启动修复的例外：当
打包安装发现某个插件已被插件配置、旧版渠道配置或其内置默认启用 manifest 启用时，启动过程会在导入前安装该插件缺失的运行时依赖。第三方插件不应依赖启动时安装；仍应使用显式插件安装器。

## 相关

- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) -- `definePluginEntry` 和 `defineChannelPluginEntry`
- [插件 Manifest](/zh-CN/plugins/manifest) -- 完整 manifest schema 参考
- [构建插件](/zh-CN/plugins/building-plugins) -- 分步入门指南
