---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-24T14:42:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

插件通过新增能力来扩展 OpenClaw：渠道、模型提供商、智能体 harness、工具、技能、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是 **核心** 插件（随 OpenClaw 一起发布），另一些则是 **外部** 插件（由社区发布到 npm）。

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

    然后在你的配置文件中，通过 `plugins.entries.\<id\>.config` 进行配置。

  </Step>
</Steps>

如果你更喜欢聊天原生控制方式，启用 `commands.plugins: true`，然后使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式 `clawhub:<pkg>`，或裸包规范（优先 ClawHub，然后回退到 npm）。

如果配置无效，安装通常会以安全失败的方式终止，并引导你使用 `openclaw doctor --fix`。唯一的恢复例外是一个范围很窄的内置插件重装路径，仅适用于选择启用 `openclaw.install.allowInvalidConfigRecovery` 的插件。

打包后的 OpenClaw 安装不会急切地安装每个内置插件的运行时依赖树。当某个 OpenClaw 自有的内置插件因插件配置、旧版渠道配置或默认启用的清单而处于活动状态时，启动过程只会在导入该插件前修复它声明的运行时依赖。外部插件和自定义加载路径仍然必须通过 `openclaw plugins install` 安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 软件包 |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

这两种格式都会显示在 `openclaw plugins list` 中。有关 bundle 的详细信息，请参阅 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从 [Building Plugins](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 官方插件

### 可安装（npm）

| 插件 | 软件包 | 文档 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix | `@openclaw/matrix` | [Matrix](/zh-CN/channels/matrix) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr | `@openclaw/nostr` | [Nostr](/zh-CN/channels/nostr) |
| Voice Call | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/zh-CN/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/zh-CN/plugins/zalouser) |

### 核心（随 OpenClaw 一起发布）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置的 memory 搜索（默认通过 `plugins.slots.memory` 使用）
    - `memory-lancedb` — 按需安装的长期 memory，带自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于 browser 工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、browser 运行时以及默认 browser 控制服务的内置 browser 插件（默认启用；替换前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
  </Accordion>
</AccordionGroup>

在找第三方插件？请参阅 [Community Plugins](/zh-CN/plugins/community)。

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
| `deny` | 插件拒绝列表（可选；`deny` 优先） |
| `load.paths` | 额外的插件文件/目录 |
| `slots` | 独占槽位选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每个插件的开关 + 配置 |

配置变更 **需要重启 Gateway 网关**。如果 Gateway 网关正在以启用配置监视 + 进程内重启的方式运行（默认的 `openclaw gateway` 路径），通常会在配置写入完成后稍等片刻自动执行重启。原生插件运行时代码或生命周期 hook 没有受支持的热重载路径；在期望更新后的 `register(api)` 代码、`api.on(...)` hook、工具、服务或提供商/运行时 hook 生效之前，请重启为实时渠道提供服务的 Gateway 网关进程。

`openclaw plugins list` 是本地 CLI/配置快照。那里显示某个插件为 `loaded`，表示从该次 CLI 调用看到的配置/文件来看，该插件可被发现且可被加载。这并不能证明一个已经运行中的远程 Gateway 网关子进程已经重启到相同的插件代码。在 VPS/容器部署且带包装进程的环境中，请向实际的 `openclaw gateway run` 进程发送重启信号，或对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了某个插件 id，但发现流程未找到它。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现顺序与优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式的文件或目录路径。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多插件默认启用（模型提供商、语音）。
    其他插件则需要显式启用。
  </Step>
</Steps>

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来自工作区的插件 **默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 独占槽位可以为该槽位强制启用所选插件
- 某些内置的可选加入插件会在配置命名了某个插件拥有的表面时自动启用，例如 provider model 引用、渠道配置或 harness 运行时
- OpenAI 系列的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置的 Codex
  app-server 插件则通过 `embeddedHarness.runtime: "codex"` 或旧版
  `codex/*` model 引用来选择

## 运行时 Hook 故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 的副作用或 hook
没有在实时聊天流量中运行，请先检查以下几点：

- 运行 `openclaw gateway status --deep --require-rpc`，确认当前活动的
  Gateway 网关 URL、profile、配置路径和进程，就是你正在编辑的那些。
- 在插件安装/配置/代码变更后重启正在提供服务的 Gateway 网关。在包装容器中，
  PID 1 可能只是一个 supervisor；请重启或发送信号给子进程
  `openclaw gateway run`。
- 使用 `openclaw plugins inspect <id> --json` 确认 hook 注册和
  诊断信息。像 `llm_input`、
  `llm_output` 和 `agent_end` 这样的非内置会话 hook，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体回合的模型解析前运行；`llm_output` 只会在某次模型尝试产出 assistant 输出后才运行。
- 要证明实际生效的会话模型，请使用 `openclaw sessions` 或
  Gateway 网关的 session/status 表面；调试 provider 负载时，
  请使用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

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
| `memory` | 活动的 memory 插件 | `memory-core` |
| `contextEngine` | 活动的 context engine | `legacy`（内建） |

## CLI 参考

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only loaded plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config/install records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多插件默认启用（例如内置模型提供商、内置语音提供商，以及内置 browser 插件）。其他内置插件仍然需要执行 `openclaw plugins enable <id>`。

`--force` 会就地覆盖现有已安装的插件或 hook 包。对于受跟踪的 npm 插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用，因为 `--link` 会复用源路径，而不是复制到受管理的安装目标中。

当已经设置了 `plugins.allow` 时，`openclaw plugins install` 会在启用插件之前，将已安装插件的 id 添加到该允许列表中，因此重启后即可立即加载。

`openclaw plugins update <id-or-npm-spec>` 适用于受跟踪的安装。传入带有 dist-tag 或精确版本的 npm 包规范时，会将该包名解析回受跟踪的插件记录，并为后续更新记录新的规范。传入不带版本的包名时，会将一个精确 pin 住的安装移回注册表的默认发布线。如果已安装的 npm 插件已经匹配解析后的版本和记录的制品标识，OpenClaw 会跳过更新，不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是一个“破玻璃”式覆盖选项，用于处理内置危险代码扫描器的误报。它允许插件安装和插件更新在遇到内置 `critical` 级别发现后继续进行，但仍然不会绕过插件 `before_install` 策略拦截或扫描失败拦截。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的技能依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub 技能下载/安装流程。

兼容的 bundle 也会参与相同的插件 list/inspect/enable/disable 流程。当前运行时支持包括 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和 manifest 声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告检测到的 bundle 能力，以及由 bundle 支持的或不支持的 MCP 和 LSP server 条目。

Marketplace 源可以是来自 `~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保留在克隆的 marketplace 仓库内，并且只能使用相对路径源。

完整详情请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件会导出一个入口对象，并暴露 `register(api)`。较旧的插件可能仍使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

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

OpenClaw 会加载该入口对象，并在插件激活期间调用 `register(api)`。对于旧插件，加载器仍会回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公共契约。

常见的注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | 模型提供商（LLM） |
| `registerChannel` | 聊天渠道 |
| `registerTool` | 智能体工具 |
| `registerHook` / `on(...)` | 生命周期 hook |
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
| `registerContextEngine` | context engine |
| `registerService` | 后台服务 |

类型化生命周期 hook 的 hook guard 行为：

- `before_tool_call`：`{ block: true }` 是终止性的；低优先级处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除更早的拦截。
- `before_install`：`{ block: true }` 是终止性的；低优先级处理器会被跳过。
- `before_install`：`{ block: false }` 是无操作，不会清除更早的拦截。
- `message_sending`：`{ cancel: true }` 是终止性的；低优先级处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除更早的取消。

完整的类型化 hook 行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [Building Plugins](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [Plugin Bundles](/zh-CN/plugins/bundles) — Codex/Claude/Cursor bundle 兼容性
- [Plugin Manifest](/zh-CN/plugins/manifest) — manifest schema
- [Registering Tools](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [Plugin Internals](/zh-CN/plugins/architecture) — 能力模型与加载流水线
- [Community Plugins](/zh-CN/plugins/community) — 第三方列表
