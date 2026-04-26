---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 处理与 Codex/Claude 兼容的插件捆绑包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-26T07:51:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5f774ccc52b70eb8626cc7d5421482079af87566fed3013846a9d7e4b3c0863
    source_path: tools/plugin.md
    workflow: 15
---

插件可为 OpenClaw 扩展新能力：渠道、模型提供商、智能体 harness、工具、Skills、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取、网络搜索等。有些插件属于**核心**插件（随 OpenClaw 一起发布），另一些则是**外部**插件（由社区发布到 npm）。

## 快速开始

<Steps>
  <Step title="查看已加载内容">
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

    然后在配置文件中的 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>
</Steps>

如果你更喜欢原生聊天控制，可启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档文件、显式 `clawhub:<pkg>`，或裸包规范（优先 ClawHub，然后回退到 npm）。

如果配置无效，安装通常会以安全失败方式终止，并提示你使用 `openclaw doctor --fix`。唯一的恢复例外是一个狭义的内置插件重装路径，适用于选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。

打包形式的 OpenClaw 安装不会急切安装每个内置插件的运行时依赖树。当某个 OpenClaw 自带的内置插件因插件配置、旧版渠道配置或默认启用的清单而处于激活状态时，启动修复仅会在导入该插件之前修复该插件声明的运行时依赖。仅凭持久化的渠道认证状态，并不会激活某个内置渠道来进行 Gateway 网关启动时的运行时依赖修复。
显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false` 都会阻止对该插件/渠道进行自动的内置运行时依赖修复。
外部插件和自定义加载路径仍然必须通过 `openclaw plugins install` 安装。

## 插件类型

OpenClaw 识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

这两类都会显示在 `openclaw plugins list` 中。有关 bundle 的详细信息，请参阅 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你正在编写 Native 插件，请从 [构建插件](/zh-CN/plugins/building-plugins) 和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

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

### 核心（随 OpenClaw 一起发布）

<AccordionGroup>
  <Accordion title="模型提供商（默认启用）">
    `anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、
    `huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`qwen`、
    `moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、
    `qianfan`、`synthetic`、`together`、`venice`、
    `vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`
  </Accordion>

  <Accordion title="Memory 插件">
    - `memory-core` — 内置 Memory 搜索（默认通过 `plugins.slots.memory`）
    - `memory-lancedb` — 按需安装的长期 Memory，带自动召回/捕获功能（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`、`microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 为浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时和默认浏览器控制服务提供支持的内置浏览器插件（默认启用；替换它之前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
  </Accordion>
</AccordionGroup>

在找第三方插件？请参见 [Community Plugins](/zh-CN/plugins/community)。

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
| `enabled` | 主开关（默认：`true`） |
| `allow` | 插件允许列表（可选） |
| `deny` | 插件拒绝列表（可选；拒绝优先） |
| `load.paths` | 额外插件文件/目录 |
| `slots` | 独占插槽选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每个插件的开关 + 配置 |

配置更改**需要重启 Gateway 网关**。如果 Gateway 网关以启用了配置监视和进程内重启的方式运行（默认的 `openclaw gateway` 路径），那么在配置写入落地后，这个重启通常会自动在片刻后执行。
对于 Native 插件运行时代码或生命周期钩子，不存在受支持的热重载路径；在你期望更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或提供商/运行时钩子生效之前，请重启为实时渠道提供服务的 Gateway 网关进程。

`openclaw plugins list` 是本地插件注册表/配置快照。这里显示某个插件为 `enabled`，意味着持久化注册表和当前配置允许该插件参与运行。这并不能证明一个已经在运行的远程 Gateway 网关子进程已经重启并使用了相同的插件代码。在 VPS/容器部署中，如果有包装进程，请将重启信号发送给实际的 `openclaw gateway run` 进程，或针对正在运行的 Gateway 网关使用 `openclaw gateway restart`。

<Accordion title="插件状态：disabled vs missing vs invalid">
  - **Disabled**：插件存在，但启用规则将其关闭。配置会被保留。
  - **Missing**：配置引用了某个插件 id，但发现阶段没有找到它。
  - **Invalid**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现顺序与优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。那些指回 OpenClaw 自身打包内置插件目录的路径会被忽略；请运行 `openclaw doctor --fix` 来移除这些过时别名。
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
- 来自工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 独占插槽可以强制启用该插槽所选中的插件
- 某些内置选择加入型插件会在配置命名某个插件拥有的表面时自动启用，例如提供商模型引用、渠道配置或 harness 运行时
- OpenAI 系列 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置的 Codex app-server 插件则由 `agentRuntime.id: "codex"` 或旧版 `codex/*` 模型引用选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 的副作用或钩子没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc`，确认当前活动的 Gateway 网关 URL、profile、配置路径和进程就是你正在编辑的那一个。
- 在插件安装/配置/代码更改后重启实时 Gateway 网关。在包装容器中，PID 1 可能只是一个 supervisor；请重启或发送信号给子进程 `openclaw gateway run`。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和诊断信息。诸如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end` 这类非内置的会话钩子需要 `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。它会在智能体轮次的模型解析之前运行；`llm_output` 只会在某次模型尝试产生 assistant 输出之后运行。
- 若要证明当前会话实际使用的模型，请使用 `openclaw sessions` 或 Gateway 网关会话/状态表面；调试提供商负载时，请使用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这些意味着有多个已启用插件试图拥有相同的渠道、设置流程或工具名称。最常见的原因是：某个外部渠道插件与如今已提供相同渠道 id 的内置插件同时安装。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose`，查看每个已启用插件及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --json`，比较 `channels`、`channelConfigs`、`tools` 和诊断信息。
- 在安装或移除插件包后运行 `openclaw plugins registry --refresh`，以便持久化元数据反映当前安装状态。
- 在安装、注册表或配置更改后重启 Gateway 网关。

修复方式：

- 如果某个插件有意替换另一个拥有相同渠道 id 的插件，则首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并指定优先级更低的插件 id。参见 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复是意外发生的，请通过 `plugins.entries.<plugin-id>.enabled: false` 禁用其中一方，或移除过时的插件安装。
- 如果你显式启用了两个插件，OpenClaw 会保留这一请求并报告冲突。请为该渠道选择一个唯一所有者，或者重命名插件拥有的工具，以确保运行时表面明确无歧义。

## 插件插槽（独占类别）

有些类别是独占的（一次只能有一个激活）：

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

| 插槽 | 控制内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 当前激活的 Memory 插件 | `memory-core` |
| `contextEngine` | 当前激活的上下文引擎 | `legacy`（内置） |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅显示已启用插件
openclaw plugins list --verbose            # 每个插件的详细信息行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全量表格
openclaw plugins info <id>                 # inspect 的别名
openclaw plugins doctor                    # 诊断
openclaw plugins registry                  # 检查持久化注册表状态
openclaw plugins registry --refresh        # 重建持久化注册表
openclaw doctor --fix                      # 修复插件注册表状态

openclaw plugins install <package>         # 安装（优先 ClawHub，再回退到 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm 规范
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 更新单个插件
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 移除配置和插件索引记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多默认启用（例如内置模型提供商、内置语音提供商，以及内置浏览器插件）。其他内置插件仍然需要执行 `openclaw plugins enable <id>`。

`--force` 会原地覆盖现有已安装插件或 hook pack。对于已跟踪的 npm 插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。它不支持与 `--link` 一起使用，因为 `--link` 会复用源路径，而不是复制到受管理的安装目标。

当已经设置了 `plugins.allow` 时，`openclaw plugins install` 会在启用插件之前将已安装插件 id 添加到该允许列表中，因此重启后可立即加载。

OpenClaw 将持久化的本地插件注册表作为插件清单、贡献归属和启动规划的冷读取模型。安装、更新、卸载、启用和禁用流程在更改插件状态后都会刷新该注册表。同一个 `plugins/installs.json` 文件会在顶层 `installRecords` 中保留持久安装元数据，并在 `plugins` 中保留可重建的清单元数据。如果注册表缺失、过期或无效，`openclaw plugins registry --refresh` 会根据安装记录、配置策略和清单/包元数据重建其清单视图，而不会加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪安装。传入带 dist-tag 或精确版本的 npm 包规范时，它会将包名解析回已跟踪插件记录，并为后续更新记录新的规范。传入不带版本的包名时，会将精确固定版本的安装移回注册表的默认发布线。如果已安装的 npm 插件已经与解析出的版本和记录的制品标识匹配，OpenClaw 会跳过更新，而不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是内置危险代码扫描器出现误报时的应急覆盖开关。它允许插件安装和插件更新在遇到内置 `critical` 发现时继续进行，但仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

此 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关支持的 Skill 依赖安装则改用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是独立的 ClawHub Skill 下载/安装流程。

兼容的 bundle 会参与同一套插件 list/inspect/enable/disable 流程。当前运行时支持包括 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告检测到的 bundle 能力，以及 bundle 支持插件中受支持或不受支持的 MCP 和 LSP 服务器条目。

Marketplace 源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称、本地 marketplace 根目录或 `marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。对于远程 marketplace，插件条目必须保持在克隆后的 marketplace 仓库内部，并且只能使用相对路径源。

完整详情请参见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

Native 插件会导出一个入口对象，并暴露 `register(api)`。较旧的插件可能仍然使用 `activate(api)` 作为旧版别名，但新插件应使用 `register`。

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

OpenClaw 会加载入口对象，并在插件激活期间调用 `register(api)`。加载器仍然会为旧插件回退到 `activate(api)`，但内置插件和新的外部插件应将 `register` 视为公开契约。

`api.registrationMode` 会告诉插件为什么要加载它的入口：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 运行时激活。注册工具、钩子、服务、命令、路由和其他实时副作用。 |
| `discovery` | 只读能力发现。注册提供商和元数据；受信任的插件入口代码可能会被加载，但应跳过实时副作用。 |
| `setup-only` | 通过轻量级设置入口加载渠道设置元数据。 |
| `setup-runtime` | 加载同时也需要运行时入口的渠道设置。 |
| `cli-metadata` | 仅收集 CLI 命令元数据。 |

那些会打开套接字、数据库、后台工作线程或长生命周期客户端的插件入口，应使用 `api.registrationMode === "full"` 来保护这些副作用。
发现加载会与激活加载分别缓存，并不会替换正在运行的 Gateway 网关注册表。发现是非激活的，而不是免导入的：OpenClaw 可能会求值受信任的插件入口或渠道插件模块，以构建快照。请保持模块顶层轻量且无副作用，并将网络客户端、子进程、监听器、凭证读取和服务启动移动到完整运行时路径之后。

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
| `registerMediaUnderstandingProvider` | 图像/音频分析 |
| `registerImageGenerationProvider` | 图像生成 |
| `registerMusicGenerationProvider` | 音乐生成 |
| `registerVideoGenerationProvider` | 视频生成 |
| `registerWebFetchProvider` | Web 抓取 / 抓取提供商 |
| `registerWebSearchProvider` | 网络搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

类型化生命周期钩子的守卫行为：

- `before_tool_call`：`{ block: true }` 是终止性的；优先级更低的处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除更早的阻止结果。
- `before_install`：`{ block: true }` 是终止性的；优先级更低的处理器会被跳过。
- `before_install`：`{ block: false }` 是空操作，不会清除更早的阻止结果。
- `message_sending`：`{ cancel: true }` 是终止性的；优先级更低的处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除更早的取消结果。

Native Codex app-server 会将 Codex 原生工具事件桥接回这个钩子接口。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，通过 `after_tool_call` 观察结果，并参与 Codex `PermissionRequest` 审批。该桥接目前还不会重写 Codex 原生工具参数。准确的 Codex 运行时支持边界请参见 [Codex harness v1 support contract](/zh-CN/plugins/codex-harness#v1-support-contract)。

有关完整的类型化钩子行为，请参见 [插件 SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [Plugin Bundles](/zh-CN/plugins/bundles) — Codex/Claude/Cursor bundle 兼容性
- [Plugin manifest](/zh-CN/plugins/manifest) — manifest schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件架构内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [Community Plugins](/zh-CN/plugins/community) — 第三方列表
