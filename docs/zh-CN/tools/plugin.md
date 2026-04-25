---
read_when:
    - 安装或配置插件
    - 了解插件发现与加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-25T17:39:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

插件通过新增功能来扩展 OpenClaw：渠道、模型提供商、智能体 harness、工具、Skills、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是 **核心** 插件（随 OpenClaw 一起提供），另一些则是 **外部** 插件（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载的内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # 来自 npm
    openclaw plugins install @openclaw/voice-call

    # 来自本地目录或归档文件
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="重启 Gateway 网关">
    ```bash
    openclaw gateway restart
    ```

    然后在你的配置文件中的 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>
</Steps>

如果你更喜欢聊天原生控制，启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档文件、显式 `clawhub:<pkg>`，或裸包说明符（优先 ClawHub，其次回退到 npm）。

如果配置无效，安装通常会以失败关闭的方式结束，并提示你使用
`openclaw doctor --fix`。唯一的恢复例外是一条受限的内置插件重装路径，适用于选择加入
`openclaw.install.allowInvalidConfigRecovery` 的插件。

打包后的 OpenClaw 安装不会急切安装每个内置插件的运行时依赖树。当某个 OpenClaw 自带的内置插件因插件配置、旧版渠道配置或默认启用的清单而处于活跃状态时，启动过程只会在导入它之前修复该插件声明的运行时依赖。显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false`
都会阻止对该插件/渠道自动执行内置运行时依赖修复。外部插件和自定义加载路径仍必须通过
`openclaw plugins install` 安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。关于 bundle 的详细信息，请参见 [插件包](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 官方插件

### 可安装（npm）

| 插件 | 包 | 文档 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix | `@openclaw/matrix` | [Matrix](/zh-CN/channels/matrix) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr | `@openclaw/nostr` | [Nostr](/zh-CN/channels/nostr) |
| Voice Call | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/zh-CN/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/zh-CN/plugins/zalouser) |

### 核心（随 OpenClaw 一起提供）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置的内存搜索（默认通过 `plugins.slots.memory` 启用）
    - `memory-lancedb` — 按需安装的长期记忆，带自动召回/捕获功能（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时以及默认浏览器控制服务的内置浏览器插件（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
  </Accordion>
</AccordionGroup>

在找第三方插件？请参见 [社区插件](/zh-CN/plugins/community)。

## 配置

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 字段 | 说明 |
| ---------------- | --------------------------------------------------------- |
| `enabled` | 主开关（默认：`true`） |
| `allow` | 插件允许列表（可选） |
| `deny` | 插件拒绝列表（可选；拒绝优先） |
| `load.paths` | 额外的插件文件/目录 |
| `slots` | 排他性插槽选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 按插件划分的开关 + 配置 |

配置更改 **需要重启网关**。如果 Gateway 网关在启用了配置监听和进程内重启的情况下运行（默认的 `openclaw gateway` 路径），那么在配置写入完成后，通常会自动稍后执行该重启。目前不支持对原生插件运行时代码或生命周期钩子的热重载；在期望更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或提供商/运行时钩子生效之前，请重启为实时渠道提供服务的 Gateway 网关进程。

`openclaw plugins list` 是本地插件注册表/配置快照。那里显示为
`enabled` 的插件表示持久化注册表和当前配置允许该插件参与运行。这并不能证明一个已经运行中的远程 Gateway 网关子进程已经重启并加载了相同的插件代码。在 VPS/容器部署中，如果存在包装进程，请把重启信号发给实际的 `openclaw gateway run` 进程，或针对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了某个插件 id，但设备发现未找到它。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现顺序和优先级

OpenClaw 按以下顺序扫描插件（先匹配者生效）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起提供。许多默认启用（模型提供商、语音）。
    其他则需要显式启用。
  </Step>
</Steps>

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来源于工作区的插件 **默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 排他性插槽可以强制启用为该插槽选定的插件
- 某些选择加入的内置插件会在配置命名了某个插件拥有的表面时自动启用，例如提供商模型引用、渠道配置或 harness 运行时
- OpenAI 系列的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置的 Codex
  app-server 插件则通过 `embeddedHarness.runtime: "codex"` 或旧版
  `codex/*` 模型引用来选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 的副作用或钩子在实时聊天流量中没有运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，确认当前活跃的
  Gateway 网关 URL、配置文件、配置路径和进程，正是你正在编辑的那些。
- 在插件安装/配置/代码更改后重启实时 Gateway 网关。在包装容器中，
  PID 1 可能只是一个监督进程；请重启或发送信号给子进程
  `openclaw gateway run`。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册情况和诊断信息。非内置的会话钩子，如 `llm_input`、
  `llm_output` 和 `agent_end`，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；而 `llm_output` 仅在一次模型尝试产生助手输出后才运行。
- 要证明生效中的会话模型，请使用 `openclaw sessions` 或
  Gateway 网关的会话/状态表面；在调试提供商负载时，请使用
  `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

## 插件插槽（排他性类别）

某些类别是排他的（一次只能有一个处于活跃状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或 "none" 以禁用
      contextEngine: "legacy", // 或某个插件 id
    },
  },
}
```

| 插槽 | 它控制的内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 活跃的内存插件 | `memory-core` |
| `contextEngine` | 活跃的上下文引擎 | `legacy`（内建） |

## CLI 参考

```bash
openclaw plugins list                       # 精简清单
openclaw plugins list --enabled            # 仅显示已启用插件
openclaw plugins list --verbose            # 每个插件的详细信息行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全局表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断
openclaw plugins registry                  # 查看持久化注册表状态
openclaw plugins registry --refresh        # 重建持久化注册表

openclaw plugins install <package>         # 安装（优先 ClawHub，其次 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 更新单个插件
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 移除配置/安装记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起提供。许多默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）。其他内置插件仍然需要使用 `openclaw plugins enable <id>`。

`--force` 会就地覆盖现有已安装的插件或 hook 包。对于已跟踪的 npm
插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。
它不支持与 `--link` 一起使用，因为后者会复用源路径，而不是复制到受管理的安装目标。

当 `plugins.allow` 已经设置时，`openclaw plugins install` 会在启用插件之前，将已安装插件的 id 添加到该允许列表中，因此重启后可立即加载。

OpenClaw 会维护一个持久化的本地插件注册表，将其作为插件清单、贡献归属和启动规划的冷读取模型。安装、更新、卸载、启用和禁用流程会在更改插件状态后刷新该注册表。如果注册表缺失、过期或无效，`openclaw plugins registry --refresh`
会根据持久安装账本、配置策略以及清单/包元数据重建它，而不会加载插件运行时模块。

`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。传入带有 dist-tag 或精确版本的 npm 包 spec 时，会将包名解析回已跟踪的插件记录，并为后续更新记录新的 spec。传入不带版本的包名时，会将一个精确固定版本的安装切回注册表的默认发布线。如果已安装的 npm 插件已经匹配解析后的版本和记录的构件标识，OpenClaw 会跳过更新，而不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是一个用于紧急破局的覆盖选项，用于处理内置危险代码扫描器的误报。它允许插件安装和插件更新在内置 `critical` 发现后继续执行，但仍不会绕过插件
`before_install` 策略拦截或扫描失败拦截。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关驱动的 Skills 依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub Skills 下载/安装流程。

兼容的 bundle 会参与相同的插件 list/inspect/enable/disable 流程。当前运行时支持包括 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告检测到的 bundle 能力，以及由 bundle 支持的或不支持的 MCP 和 LSP 服务器条目。

Marketplace 源可以是 `~/.claude/plugins/known_marketplaces.json`
中的 Claude 已知 marketplace 名称、本地 marketplace 根目录或
`marketplace.json` 路径、像 `owner/repo` 这样的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保留在克隆得到的 marketplace 仓库内部，并且只能使用相对路径源。

完整详情请参见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个入口对象，并暴露 `register(api)`。较旧的插件仍可能使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw 会加载入口对象，并在插件激活期间调用 `register(api)`。加载器仍会为旧插件回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公开契约。

`api.registrationMode` 会告诉插件其入口为何被加载：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 运行时激活。注册工具、钩子、服务、命令、路由以及其他实时副作用。 |
| `discovery` | 只读能力发现。注册提供商和元数据；可信插件入口代码可能会被加载，但应跳过实时副作用。 |
| `setup-only` | 通过轻量级 setup 入口加载渠道设置元数据。 |
| `setup-runtime` | 加载渠道设置，同时也需要运行时入口。 |
| `cli-metadata` | 仅收集 CLI 命令元数据。 |

那些会打开套接字、数据库、后台 worker 或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 来保护这些副作用。发现加载与激活加载会分别缓存，并且不会替换正在运行的 Gateway 网关注册表。发现过程不会激活，但也不是完全不导入：OpenClaw 可能会执行可信插件入口或渠道插件模块，以构建快照。请保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移到完整运行时路径之后。

常见注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | 模型提供商（LLM） |
| `registerChannel` | 聊天渠道 |
| `registerTool` | 智能体工具 |
| `registerHook` / `on(...)` | 生命周期钩子 |
| `registerSpeechProvider` | 文本转语音 / STT |
| `registerRealtimeTranscriptionProvider` | 流式 STT |
| `registerRealtimeVoiceProvider` | 双工实时语音 |
| `registerMediaUnderstandingProvider` | 图像/音频分析 |
| `registerImageGenerationProvider` | 图像生成 |
| `registerMusicGenerationProvider` | 音乐生成 |
| `registerVideoGenerationProvider` | 视频生成 |
| `registerWebFetchProvider` | 网页抓取 / 爬取提供商 |
| `registerWebSearchProvider` | 网页搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

类型化生命周期钩子的钩子守卫行为：

- `before_tool_call`：`{ block: true }` 是终止性的；更低优先级的处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除更早的拦截。
- `before_install`：`{ block: true }` 是终止性的；更低优先级的处理器会被跳过。
- `before_install`：`{ block: false }` 是空操作，不会清除更早的拦截。
- `message_sending`：`{ cancel: true }` 是终止性的；更低优先级的处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除更早的取消。

原生 Codex app-server 运行时会将桥接的 Codex 原生工具事件回送到这个钩子表面。插件可以通过 `before_tool_call` 拦截原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex
`PermissionRequest` 批准。该桥接目前还不会改写 Codex 原生工具参数。精确的 Codex 运行时支持边界位于
[Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract)。

关于完整的类型化钩子行为，请参见 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — Codex/Claude/Cursor bundle 兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
