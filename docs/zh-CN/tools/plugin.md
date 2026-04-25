---
read_when:
    - 安装或配置插件时
    - 了解插件发现和加载规则时
    - 处理与 Codex / Claude 兼容的插件包时
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-25T02:37:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e41595020c5f1702e3288eb07c88482cb820b78b33ea27154af788e8da80fa1
    source_path: tools/plugin.md
    workflow: 15
---

插件可为 OpenClaw 扩展新能力：渠道、模型提供商、Agent harnesses、工具、Skills、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是 **core**（随 OpenClaw 一起发布），另一些是 **external**（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # From npm
    openclaw plugins install @openclaw/voice-call

    # From a local directory or archive
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

如果你更喜欢聊天原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径 / 归档、显式 `clawhub:<pkg>`，或裸包规范（优先 ClawHub，然后回退到 npm）。

如果配置无效，安装通常会以失败关闭方式结束，并引导你使用
`openclaw doctor --fix`。唯一的恢复例外是一个较窄的内置插件重装路径，
适用于选择启用
`openclaw.install.allowInvalidConfigRecovery`
的插件。

打包后的 OpenClaw 安装不会急切安装每个内置插件的完整运行时依赖树。
当某个内置且由 OpenClaw 拥有的插件通过插件配置、旧版渠道配置或默认启用的清单处于活动状态时，启动修复只会在导入该插件之前修复该插件声明的运行时依赖。显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false`
都会阻止该插件 / 渠道的内置运行时依赖自动修复。
外部插件和自定义加载路径仍必须通过
`openclaw plugins install`
进行安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 与 Codex / Claude / Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

这两种都会显示在 `openclaw plugins list` 下。有关 bundle 的详细信息，请参见 [插件包](/zh-CN/plugins/bundles)。

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

### Core（随 OpenClaw 一起发布）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、
    `huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`qwen`、
    `moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、
    `qianfan`、`synthetic`、`together`、`venice`、
    `vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置内存搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` — 按需安装的长期记忆，带自动召回 / 捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`、`microsoft`
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

| 字段 | 描述 |
| ---------------- | --------------------------------------------------------- |
| `enabled` | 总开关（默认：`true`） |
| `allow` | 插件允许列表（可选） |
| `deny` | 插件拒绝列表（可选；拒绝优先） |
| `load.paths` | 额外的插件文件 / 目录 |
| `slots` | 独占槽位选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 按插件的开关 + 配置 |

配置更改**需要重启 Gateway 网关**。如果 Gateway 网关以启用配置监视和进程内重启的方式运行（默认的 `openclaw gateway` 路径），那么在配置写入落地后，通常会在片刻后自动执行该重启。
原生插件运行时代码或生命周期钩子没有受支持的热重载路径；在期望更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或提供商 / 运行时钩子生效之前，请重启正在服务实时渠道的 Gateway 网关进程。

`openclaw plugins list` 是本地 CLI / 配置快照。那里显示为 `loaded`
的插件表示该插件可从该次 CLI 调用所看到的配置 / 文件中被发现并加载。
这并不能证明一个已经运行的远程 Gateway 网关子进程已经重启到相同的插件代码。
在使用包装进程的 VPS / 容器部署中，请将重启发送到实际的
`openclaw gateway run`
进程，或对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：disabled、missing、invalid">
  - **Disabled**：插件存在，但启用规则将其关闭。配置会被保留。
  - **Missing**：配置引用了某个插件 ID，但发现过程未找到该插件。
  - **Invalid**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现与优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

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
    随 OpenClaw 一起发布。许多默认启用（模型提供商、语音）。
    其他则需要显式启用。
  </Step>
</Steps>

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 工作区来源的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 独占槽位可强制启用为该槽位选定的插件
- 某些内置的按需启用插件会在配置命名某个插件拥有的表面时自动启用，
  例如提供商模型引用、渠道配置或 harness 运行时
- OpenAI 系列 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置的 Codex
  app-server 插件由 `embeddedHarness.runtime: "codex"` 或旧版
  `codex/*` 模型引用选定

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子
未在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc` 并确认活动的
  Gateway 网关 URL、配置文件、配置路径和进程正是你在编辑的那些。
- 在插件安装 / 配置 / 代码更改后重启实时 Gateway 网关。在包装容器中，
  PID 1 可能只是一个监督进程；请重启或向子进程
  `openclaw gateway run`
  发送信号。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和
  诊断信息。像 `llm_input`、
  `llm_output` 和 `agent_end` 这样的非内置会话钩子需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析前运行；`llm_output` 只会在模型尝试产生助手输出后运行。
- 如需证明有效的会话模型，请使用 `openclaw sessions` 或 Gateway 网关会话 / 状态表面；在调试提供商负载时，请使用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

## 插件槽位（独占类别）

某些类别是独占的（同一时间只能有一个处于活动状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| 槽位 | 控制内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 活动 Memory 插件 | `memory-core` |
| `contextEngine` | 活动上下文引擎 | `legacy`（内建） |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅已加载插件
openclaw plugins list --verbose            # 每个插件的详细行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全局表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断

openclaw plugins install <package>         # 安装（优先 ClawHub，然后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析的 npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 更新单个插件
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 移除配置 / 安装记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）。其他内置插件仍需要运行 `openclaw plugins enable <id>`。

`--force` 会原地覆盖已安装的插件或 hook pack。对于已跟踪 npm 插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用，因为后者会复用源路径，而不是复制到受管理的安装目标。

当已设置 `plugins.allow` 时，`openclaw plugins install` 会在启用插件前，将已安装插件的 id 添加到该允许列表中，因此插件在重启后可立即加载。

`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪的安装。传入带 dist-tag 或精确版本的 npm 包规范时，会将包名解析回已跟踪的插件记录，并为将来的更新记录新的 spec。传入不带版本的包名时，会将精确固定的安装移回注册表的默认发布线。如果已安装的 npm 插件已经与解析后的版本和记录的产物标识一致，OpenClaw 会跳过更新，不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是用于内置危险代码扫描器误报的紧急覆盖开关。它允许插件安装和插件更新在遇到内置 `critical` 发现后继续进行，但仍不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

这个 CLI 标志仅适用于插件安装 / 更新流程。由 Gateway 网关支持的 Skills 依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍是独立的 ClawHub Skills 下载 / 安装流程。

兼容的 bundle 会参与相同的插件 list / inspect / enable / disable 流程。当前运行时支持包括 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告检测到的 bundle 能力，以及由 bundle 支持的或不支持的 MCP 和 LSP server 条目。

Marketplace 来源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保持在克隆后的 marketplace 仓库内，并且只能使用相对路径来源。

完整信息请参见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个入口对象，并公开 `register(api)`。较旧的插件仍可能使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

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

OpenClaw 会加载该入口对象，并在插件激活期间调用 `register(api)`。加载器仍会为旧插件回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公开契约。

`api.registrationMode` 会告诉插件其入口为何被加载：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 运行时激活。注册工具、钩子、服务、命令、路由以及其他实时副作用。 |
| `discovery` | 只读能力发现。注册提供商和元数据；受信任的插件入口代码可能会被加载，但要跳过实时副作用。 |
| `setup-only` | 通过轻量级设置入口加载渠道设置元数据。 |
| `setup-runtime` | 需要运行时入口的渠道设置加载。 |
| `cli-metadata` | 仅收集 CLI 命令元数据。 |

会打开套接字、数据库、后台工作进程或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 来保护这些副作用。发现加载与激活加载会分别缓存，且不会替换正在运行的 Gateway 网关注册表。发现是非激活式的，而不是免导入的：OpenClaw 可能会求值受信任的插件入口或渠道插件模块以构建快照。请保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移到完整运行时路径后面。

常见注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | 模型提供商（LLM） |
| `registerChannel` | 聊天渠道 |
| `registerTool` | 智能体工具 |
| `registerHook` / `on(...)` | 生命周期钩子 |
| `registerSpeechProvider` | 文本转语音 / STT |
| `registerRealtimeTranscriptionProvider` | 流式 STT |
| `registerRealtimeVoiceProvider` | 双向实时语音 |
| `registerMediaUnderstandingProvider` | 图像 / 音频分析 |
| `registerImageGenerationProvider` | 图像生成 |
| `registerMusicGenerationProvider` | 音乐生成 |
| `registerVideoGenerationProvider` | 视频生成 |
| `registerWebFetchProvider` | 网页抓取 / 抓取提供商 |
| `registerWebSearchProvider` | 网页搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

类型化生命周期钩子的钩子保护行为：

- `before_tool_call`：`{ block: true }` 为终止性结果；较低优先级处理器会被跳过。
- `before_tool_call`：`{ block: false }` 为无操作，不会清除更早的阻止。
- `before_install`：`{ block: true }` 为终止性结果；较低优先级处理器会被跳过。
- `before_install`：`{ block: false }` 为无操作，不会清除更早的阻止。
- `message_sending`：`{ cancel: true }` 为终止性结果；较低优先级处理器会被跳过。
- `message_sending`：`{ cancel: false }` 为无操作，不会清除更早的取消。

原生 Codex app-server 会将桥接的 Codex 原生工具事件回传到这个钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex 的 `PermissionRequest` 批准。该桥接目前尚不会重写 Codex 原生工具参数。

有关完整的类型化钩子行为，请参见 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — 与 Codex / Claude / Cursor 的插件包兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
