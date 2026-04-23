---
read_when:
    - 你想创建一个新的 OpenClaw 插件
    - 你需要一个插件开发的快速开始指南
    - 你正在为 OpenClaw 添加新的渠道、提供商、工具或其他能力
sidebarTitle: Getting Started
summary: 在几分钟内创建你的第一个 OpenClaw 插件
title: 构建插件
x-i18n:
    generated_at: "2026-04-23T22:59:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90c2413c9c011c89f1e50e12e1a1ee4cca8207234827897b423cf421244203ce
    source_path: plugins/building-plugins.md
    workflow: 15
---

插件可通过新增能力来扩展 OpenClaw：渠道、模型提供商、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、web 抓取、web 搜索、智能体工具，或这些能力的任意组合。

你不需要把插件添加到 OpenClaw 仓库中。发布到 [ClawHub](/zh-CN/tools/clawhub) 或 npm 后，用户可通过 `openclaw plugins install <package-name>` 安装。OpenClaw 会先尝试 ClawHub，失败后再自动回退到 npm。

## 先决条件

- Node >= 22 和一个包管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 对于仓库内插件：已克隆仓库并执行 `pnpm install`

## 你要构建哪种插件？

<CardGroup cols={3}>
  <Card title="渠道插件" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到消息平台（Discord、IRC 等）
  </Card>
  <Card title="提供商插件" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    添加一个模型提供商（LLM、代理或自定义端点）
  </Card>
  <Card title="工具 / hook 插件" icon="wrench">
    注册智能体工具、事件 hook 或服务 —— 继续阅读下文
  </Card>
</CardGroup>

对于在新手引导/设置运行时不保证已安装的渠道插件，请使用
`openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface(...)`。它会生成一个设置适配器 + 向导组合，用于声明安装要求，并在插件安装前对真实配置写入采用默认拒绝策略。

## 快速开始：工具插件

本教程将创建一个注册智能体工具的最小插件。渠道插件和提供商插件请参阅上方链接的专门指南。

<Steps>
  <Step title="创建包和 manifest">
    <CodeGroup>
    ```json package.json
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

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    每个插件都需要一个 manifest，即使没有配置也是如此。完整模式请参阅
    [Manifest](/zh-CN/plugins/manifest)。规范的 ClawHub 发布片段位于 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="编写入口点">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` 用于非渠道插件。对于渠道，请使用
    `defineChannelPluginEntry` —— 参见 [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins)。
    关于完整入口点选项，请参阅 [Entry Points](/zh-CN/plugins/sdk-entrypoints)。

  </Step>

  <Step title="测试并发布">

    **外部插件：** 通过 ClawHub 验证并发布，然后安装：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    对于像 `@myorg/openclaw-my-plugin` 这样的裸包规格，OpenClaw 也会先检查 ClawHub，再检查 npm。

    **仓库内插件：** 放在内置插件工作区树下 —— 会自动发现。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## 插件能力

单个插件可通过 `api` 对象注册任意数量的能力：

| 能力 | 注册方法 | 详细指南 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 文本推理（LLM） | `api.registerProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins) |
| CLI 推理后端 | `api.registerCliBackend(...)` | [CLI Backends](/zh-CN/gateway/cli-backends) |
| 渠道 / 消息 | `api.registerChannel(...)` | [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins) |
| 语音（TTS/STT） | `api.registerSpeechProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 实时转写 | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 实时语音 | `api.registerRealtimeVoiceProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 媒体理解 | `api.registerMediaUnderstandingProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 图像生成 | `api.registerImageGenerationProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音乐生成 | `api.registerMusicGenerationProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 视频生成 | `api.registerVideoGenerationProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web 抓取 | `api.registerWebFetchProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web 搜索 | `api.registerWebSearchProvider(...)` | [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 嵌入式 Pi 扩展 | `api.registerEmbeddedExtensionFactory(...)` | [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api) |
| 智能体工具 | `api.registerTool(...)` | 下文 |
| 自定义命令 | `api.registerCommand(...)` | [入口点](/zh-CN/plugins/sdk-entrypoints) |
| 事件 hook | `api.registerHook(...)` | [入口点](/zh-CN/plugins/sdk-entrypoints) |
| HTTP 路由 | `api.registerHttpRoute(...)` | [Internals](/zh-CN/plugins/architecture#gateway-http-routes) |
| CLI 子命令 | `api.registerCli(...)` | [入口点](/zh-CN/plugins/sdk-entrypoints) |

完整注册 API 请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#registration-api)。

当插件需要 Pi 原生嵌入式运行器 hook（例如在最终工具结果消息发出前异步重写 `tool_result`）时，请使用 `api.registerEmbeddedExtensionFactory(...)`。如果该工作不需要 Pi 扩展时序，请优先使用常规 OpenClaw 插件 hook。

如果你的插件注册了自定义 Gateway 网关 RPC 方法，请保持在插件专属前缀下。核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）是保留的，并且始终解析到 `operator.admin`，即使插件请求更窄的作用域也是如此。

需要注意的 hook 守卫语义：

- `before_tool_call`：`{ block: true }` 是终止性的，会阻止更低优先级的处理器继续执行。
- `before_tool_call`：`{ block: false }` 视为未作决定。
- `before_tool_call`：`{ requireApproval: true }` 会暂停智能体执行，并通过 exec 审批浮层、Telegram 按钮、Discord 交互，或任意渠道上的 `/approve` 命令提示用户审批。
- `before_install`：`{ block: true }` 是终止性的，会阻止更低优先级的处理器继续执行。
- `before_install`：`{ block: false }` 视为未作决定。
- `message_sending`：`{ cancel: true }` 是终止性的，会阻止更低优先级的处理器继续执行。
- `message_sending`：`{ cancel: false }` 视为未作决定。
- `message_received`：当你需要入站线程/主题路由时，优先使用类型化的 `threadId` 字段。`metadata` 仅保留给渠道专属扩展信息。
- `message_sending`：优先使用类型化的 `replyToId` / `threadId` 路由字段，而不是渠道专属的 metadata 键。

`/approve` 命令同时处理 exec 审批和插件审批，并带有有界回退逻辑：当未找到某个 exec 审批 ID 时，OpenClaw 会使用同一个 ID 在插件审批中重试。插件审批转发可通过配置中的 `approvals.plugin` 独立设置。

如果自定义审批流程需要检测这个相同的有界回退场景，请优先使用 `openclaw/plugin-sdk/error-runtime` 中的 `isApprovalNotFoundError`，而不是手动匹配审批过期字符串。

详情请参阅 [SDK 概览 hook decision semantics](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 注册智能体工具

工具是 LLM 可调用的类型化函数。它们可以是必需工具（始终可用），也可以是可选工具（用户选择启用）：

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

用户可在配置中启用可选工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名称不得与核心工具冲突（冲突时会被跳过）
- 对于有副作用或需要额外二进制依赖的工具，请使用 `optional: true`
- 用户可通过将插件 ID 添加到 `tools.allow` 来启用该插件的所有工具

## 导入约定

始终从聚焦的 `openclaw/plugin-sdk/<subpath>` 路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完整子路径参考请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview)。

在你的插件内部，请使用本地 barrel 文件（`api.ts`、`runtime-api.ts`）进行内部导入——绝不要通过其 SDK 路径导入你自己的插件。

对于提供商插件，请将提供商专属辅助工具保留在这些包根 barrel 中，除非该接缝确实是通用的。当前内置示例包括：

- Anthropic：Claude 流包装器，以及 `service_tier` / beta 辅助工具
- OpenAI：provider 构建器、默认模型辅助工具、实时 provider
- OpenRouter：provider 构建器以及 onboarding/配置辅助工具

如果某个辅助工具只在一个内置 provider 包内部有用，请将其保留在该包根接缝上，而不是提升到 `openclaw/plugin-sdk/*` 中。

一些自动生成的 `openclaw/plugin-sdk/<bundled-id>` 辅助接缝仍然存在，用于内置插件维护和兼容性，例如
`plugin-sdk/feishu-setup` 或 `plugin-sdk/zalo-setup`。请将这些视为保留界面，而不是新第三方插件的默认模式。

## 提交前检查清单

<Check>**package.json** 具有正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** manifest 已存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入都使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## Beta 版本测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 的 GitHub 发布标签，并通过 `Watch` > `Releases` 订阅。Beta 标签形如 `v2026.3.N-beta.1`。你也可以为 OpenClaw 官方 X 账号 [@openclaw](https://x.com/openclaw) 开启通知，以获取发布公告。
2. 一旦 beta 标签出现，尽快用它测试你的插件。稳定版发布前的窗口通常只有几小时。
3. 测试完成后，在 `plugin-forum` Discord 渠道中你插件对应的讨论串里发布 `all good` 或说明出了什么问题。如果你还没有讨论串，请创建一个。
4. 如果出现问题，请创建或更新一个标题为 `Beta blocker: <plugin-name> - <summary>` 的 issue，并添加 `beta-blocker` 标签。将 issue 链接放入你的讨论串。
5. 向 `main` 提交一个标题为 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，并在 PR 和你的 Discord 讨论串中都链接该 issue。贡献者不能为 PR 打标签，因此标题就是面向维护者和自动化的 PR 侧信号。有 PR 的阻塞问题会被合并；没有 PR 的阻塞问题则仍有可能随版本发布。维护者会在 beta 测试期间关注这些讨论串。
6. 没有消息就表示一切正常。如果你错过了这个窗口，你的修复很可能只能在下一个周期发布。

## 下一步

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/zh-CN/plugins/sdk-channel-plugins">
    构建消息渠道插件
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/zh-CN/plugins/sdk-provider-plugins">
    构建模型提供商插件
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/zh-CN/plugins/sdk-overview">
    导入映射和注册 API 参考
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/zh-CN/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、搜索、子智能体
  </Card>
  <Card title="Testing" icon="test-tubes" href="/zh-CN/plugins/sdk-testing">
    测试工具和模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/zh-CN/plugins/manifest">
    完整 manifest 模式参考
  </Card>
</CardGroup>

## 相关内容

- [Plugin Architecture](/zh-CN/plugins/architecture) — 内部架构深入解析
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 插件 SDK 参考
- [Manifest](/zh-CN/plugins/manifest) — 插件 manifest 格式
- [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins) — 构建渠道插件
- [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins) — 构建提供商插件
