---
read_when:
    - 你需要 `definePluginEntry` 或 `defineChannelPluginEntry` 的精确类型签名
    - 你想了解注册模式（full、setup、CLI 元数据）
    - 你正在查找入口点选项
sidebarTitle: Entry Points
summary: '`definePluginEntry`、`defineChannelPluginEntry` 和 `defineSetupPluginEntry` 参考'
title: 插件入口点
x-i18n:
    generated_at: "2026-04-23T20:57:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

每个插件都会导出一个默认入口对象。SDK 提供了三个辅助函数来
创建它们。

对于已安装的插件，`package.json` 应在可用时将运行时加载指向已构建的
JavaScript：

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` 和 `setupEntry` 仍然是工作区和 git
检出开发时有效的源码入口。`runtimeExtensions` 和 `runtimeSetupEntry` 在 OpenClaw 加载已安装包时优先使用，并让 npm 包能够避免运行时 TypeScript 编译。如果已安装包只声明了 TypeScript
源码入口，OpenClaw 会在存在匹配的构建产物 `dist/*.js` 对等文件时优先使用它，然后再回退到 TypeScript 源码。

所有入口路径都必须保持在插件包目录内部。运行时入口
和推断出的已构建 JavaScript 对等文件，并不会让一个逃逸包目录的 `extensions` 或
`setupEntry` 源路径变得有效。

<Tip>
  **在找操作演练吗？** 请参阅[渠道插件](/zh-CN/plugins/sdk-channel-plugins)
  或[提供商插件](/zh-CN/plugins/sdk-provider-plugins)以获取逐步指南。
</Tip>

## `definePluginEntry`

**导入：** `openclaw/plugin-sdk/plugin-entry`

用于提供商插件、工具插件、hook 插件，以及任何**不是**
消息渠道的插件。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| 字段 | 类型 | 必填 | 默认值 |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id` | `string` | 是 | — |
| `name` | `string` | 是 | — |
| `description` | `string` | 是 | — |
| `kind` | `string` | 否 | — |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否 | 空对象 schema |
| `register` | `(api: OpenClawPluginApi) => void` | 是 | — |

- `id` 必须与你的 `openclaw.plugin.json` manifest 匹配。
- `kind` 用于互斥槽位：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是函数，以实现惰性求值。
- OpenClaw 会在首次访问时解析并记忆该 schema，因此代价较高的 schema
  构建器只会运行一次。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

它是在 `definePluginEntry` 之上增加渠道特定连接的封装。会自动调用
`api.registerChannel({ plugin })`，暴露一个可选的根帮助 CLI 元数据接口，并根据注册模式控制 `registerFull` 的执行。

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| 字段 | 类型 | 必填 | 默认值 |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id` | `string` | 是 | — |
| `name` | `string` | 是 | — |
| `description` | `string` | 是 | — |
| `plugin` | `ChannelPlugin` | 是 | — |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否 | 空对象 schema |
| `setRuntime` | `(runtime: PluginRuntime) => void` | 否 | — |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void` | 否 | — |
| `registerFull` | `(api: OpenClawPluginApi) => void` | 否 | — |

- `setRuntime` 会在注册期间调用，以便你存储运行时引用
  （通常通过 `createPluginRuntimeStore`）。在 CLI 元数据
  捕获期间会跳过它。
- `registerCliMetadata` 会在 `api.registrationMode === "cli-metadata"`
  和 `api.registrationMode === "full"` 两种情况下运行。
  请将它作为渠道自有 CLI 描述符的规范位置，这样根帮助
  就能保持非激活式，同时普通 CLI 命令注册仍与完整插件加载兼容。
- `registerFull` 仅在 `api.registrationMode === "full"` 时运行。在 setup-only 加载期间会跳过。
- 与 `definePluginEntry` 一样，`configSchema` 可以是惰性工厂，OpenClaw
  会在首次访问时记忆解析结果。
- 对于插件自有的根 CLI 命令，当你希望命令保持惰性加载而又不从
  根 CLI 解析树中消失时，请优先使用 `api.registerCli(..., { descriptors: [...] })`。
  对于渠道插件，请优先从 `registerCliMetadata(...)` 中注册这些描述符，
  并让 `registerFull(...)` 只专注于运行时专属工作。
- 如果 `registerFull(...)` 同时注册 Gateway 网关 RPC 方法，请将它们保留在
  插件专用前缀下。保留的核心管理命名空间（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）始终会被强制为
  `operator.admin`。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用于轻量级的 `setup-entry.ts` 文件。它仅返回 `{ plugin }`，不包含
运行时或 CLI 连接逻辑。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当某个渠道被禁用、未配置，或启用了延迟加载时，OpenClaw 会加载这个入口而不是完整入口。请参阅
[设置与配置](/zh-CN/plugins/sdk-setup#setup-entry) 了解其适用场景。

在实践中，请将 `defineSetupPluginEntry(...)` 与以下狭义设置辅助工具家族搭配使用：

- `openclaw/plugin-sdk/setup-runtime`：用于运行时安全的设置辅助工具，例如
  可安全导入的设置补丁适配器、查找说明输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 和委托设置代理
- `openclaw/plugin-sdk/channel-setup`：用于可选安装的设置界面
- `openclaw/plugin-sdk/setup-tools`：用于设置 / 安装 CLI / 归档 / 文档辅助工具

请将重量级 SDK、CLI 注册器和长生命周期运行时服务保留在完整
入口中。

拆分设置与运行时界面的内置工作区渠道，可以改用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`。该契约允许设置入口保留设置安全的 plugin / secrets 导出，同时仍暴露一个
运行时 setter：

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

仅当设置流程在完整渠道入口加载之前，确实需要一个轻量级运行时
setter 时，才使用该内置契约。

## 注册模式

`api.registrationMode` 会告诉你的插件它是如何被加载的：

| 模式 | 何时使用 | 应注册什么 |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"` | 正常 Gateway 网关启动 | 全部内容 |
| `"setup-only"` | 已禁用 / 未配置的渠道 | 仅渠道注册 |
| `"setup-runtime"` | 设置流程中可用运行时 | 渠道注册，以及完整入口加载前所需的轻量级运行时 |
| `"cli-metadata"` | 根帮助 / CLI 元数据捕获 | 仅 CLI 描述符 |

`defineChannelPluginEntry` 会自动处理这种拆分。如果你为渠道直接使用
`definePluginEntry`，则需要自己检查模式：

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 仅运行时的重量级注册
  api.registerService(/* ... */);
}
```

请将 `"setup-runtime"` 视为这样一个窗口：设置专用启动界面必须
存在，但又不能重新进入完整内置渠道运行时。适合放在这里的有：
渠道注册、设置安全的 HTTP 路由、设置安全的 Gateway 网关方法，以及
委托设置辅助工具。重量级后台服务、CLI 注册器和
提供商 / 客户端 SDK 启动仍然属于 `"full"`。

对于 CLI 注册器，特别要注意：

- 当注册器拥有一个或多个根命令，并且你希望 OpenClaw 在首次调用时惰性加载真实 CLI 模块时，请使用 `descriptors`
- 请确保这些描述符覆盖该注册器暴露的每一个顶层命令根
- 仅当你需要急切兼容路径时，才单独使用 `commands`

## 插件形态

OpenClaw 会根据加载后插件的注册行为对其进行分类：

| 形态 | 说明 |
| --------------------- | -------------------------------------------------- |
| **plain-capability** | 一种能力类型（例如仅提供商） |
| **hybrid-capability** | 多种能力类型（例如提供商 + 语音） |
| **hook-only** | 仅 hooks，没有能力 |
| **non-capability** | 有工具 / 命令 / 服务，但没有能力 |

使用 `openclaw plugins inspect <id>` 可查看插件的形态。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) —— 注册 API 和子路径参考
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime) —— `api.runtime` 和 `createPluginRuntimeStore`
- [设置与配置](/zh-CN/plugins/sdk-setup) —— manifest、setup entry、延迟加载
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) —— 构建 `ChannelPlugin` 对象
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) —— 提供商注册与 hooks
