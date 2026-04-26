---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-26T03:55:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa9c2bb91aa248d8454faabed7622f44a28f261734645017d059bb8a09e8e7ac
    source_path: tools/plugin.md
    workflow: 15
---

插件通过新增能力扩展 OpenClaw：渠道、模型提供商、
智能体 harness、工具、Skills、语音、实时转录、实时
语音、媒体理解、图像生成、视频生成、网页抓取、网页
搜索等。有些插件是**核心**插件（随 OpenClaw 一起发布），另一些
是**外部**插件（由社区在 npm 上发布）。

## 快速开始

<Steps>
  <Step title="查看已加载内容">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="安装插件">
    ```bash
    # 从 npm
    openclaw plugins install @openclaw/voice-call

    # 从本地目录或归档文件
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

如果你更喜欢原生聊天控制方式，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档文件、显式
`clawhub:<pkg>`，或裸包规范（优先 ClawHub，然后回退到 npm）。

如果配置无效，安装通常会以失败关闭的方式结束，并引导你使用
`openclaw doctor --fix`。唯一的恢复例外是一个范围很窄的内置插件
重新安装路径，适用于选择加入
`openclaw.install.allowInvalidConfigRecovery`
的插件。

打包的 OpenClaw 安装不会急切安装每个内置插件的
运行时依赖树。当某个 OpenClaw 自带的内置插件因
插件配置、旧版渠道配置或默认启用的清单而处于活动状态时，
启动过程只会在导入该插件之前修复该插件声明的运行时依赖。
显式禁用仍然优先：`plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false` 和 `channels.<id>.enabled: false`
都会阻止为该插件/渠道自动修复内置运行时依赖。
外部插件和自定义加载路径仍然必须通过
`openclaw plugins install`
来安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。有关 Bundle 的详细信息，请参阅 [插件包](/zh-CN/plugins/bundles)。

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
    - `memory-core` — 内置 Memory 搜索（通过 `plugins.slots.memory` 默认启用）
    - `memory-lancedb` — 按需安装的长期 Memory，支持自动回忆/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关 方法、浏览器运行时以及默认浏览器控制服务的内置浏览器插件（默认启用；替换它之前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接器（默认禁用）
  </Accordion>
</AccordionGroup>

在找第三方插件？请参阅 [社区插件](/zh-CN/plugins/community)。

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
| `allow` | 插件 allowlist（可选） |
| `deny` | 插件 denylist（可选；deny 优先） |
| `load.paths` | 额外的插件文件/目录 |
| `slots` | 独占槽位选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 按插件划分的开关 + 配置 |

配置更改**需要重启 Gateway 网关**。如果 Gateway 网关 正在使用配置
watch + 进程内重启运行（默认的 `openclaw gateway` 路径），则该
重启通常会在配置写入落盘后不久自动执行。
对于原生插件运行时代码或生命周期钩子，没有受支持的热重载路径；
在期望更新后的 `register(api)` 代码、`api.on(...)` 钩子、工具、服务或
提供商/运行时钩子生效之前，请重启为实时渠道提供服务的 Gateway 网关 进程。

`openclaw plugins list` 是本地插件注册表/配置快照。
其中某个插件显示为 `enabled`，表示持久化注册表和当前配置允许该
插件参与运行。
但这并不能证明某个已经运行中的远程 Gateway 网关 子进程
已经重启并加载了同样的插件代码。在 VPS/容器包装进程场景下，
请把重启发送到实际的 `openclaw gateway run` 进程，
或针对正在运行的 Gateway 网关 使用 `openclaw gateway restart`。

<Accordion title="插件状态：disabled、missing 与 invalid">
  - **Disabled**：插件存在，但启用规则将其关闭。配置会被保留。
  - **Missing**：配置引用了某个插件 ID，但发现流程没有找到该插件。
  - **Invalid**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现与优先级

OpenClaw 按以下顺序扫描插件（先匹配者优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。若这些路径指回
    OpenClaw 自己打包的内置插件目录，则会被忽略；
    请运行 `openclaw doctor --fix` 来移除这些过时别名。
  </Step>

  <Step title="工作区插件">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局插件">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起发布。许多默认启用（模型提供商、语音）。
    其他插件则需要显式启用。
  </Step>
</Steps>

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来自工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 独占槽位可以强制启用为该槽位选中的插件
- 一些选择加入的内置插件会在配置命中某个
  由插件拥有的表面时自动启用，例如提供商模型引用、渠道配置或 harness
  运行时
- OpenAI 系列的 Codex 路由保持独立的插件边界：
  `openai-codex/*` 属于 OpenAI 插件，而内置 Codex
  app-server 插件则通过 `embeddedHarness.runtime: "codex"` 或旧版
  `codex/*` 模型引用来选择

## 运行时钩子故障排除

如果某个插件出现在 `plugins list` 中，但 `register(api)` 副作用或钩子
没有在实时聊天流量中运行，请先检查以下内容：

- 运行 `openclaw gateway status --deep --require-rpc` 并确认活动的
  Gateway 网关 URL、配置文件、配置路径和进程，确实是你正在编辑的那些。
- 在插件安装/配置/代码变更后重启实时 Gateway 网关。在包装式
  容器中，PID 1 可能只是 supervisor；请重启或发送信号给子进程
  `openclaw gateway run`。
- 使用 `openclaw plugins inspect <id> --json` 确认钩子注册和
  诊断信息。诸如 `llm_input`、
  `llm_output`、`before_agent_finalize` 和 `agent_end`
  这类非内置的会话钩子，需要
  `plugins.entries.<id>.hooks.allowConversationAccess=true`。
- 对于模型切换，优先使用 `before_model_resolve`。
  它会在智能体 turn 的模型解析之前运行；`llm_output` 只会在某次模型尝试
  产出 assistant 输出之后运行。
- 若要证明实际生效的会话模型，请使用 `openclaw sessions` 或
  Gateway 网关 的会话/Status 表面；在调试提供商载荷时，
  请使用 `--raw-stream --raw-stream-path <path>` 启动 Gateway 网关。

### 重复的渠道或工具所有权

症状：

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

这表示有多个已启用插件正试图拥有同一个渠道、
设置流程或工具名称。最常见的原因是外部渠道插件
与现在已提供相同渠道 ID 的内置插件并排安装。

调试步骤：

- 运行 `openclaw plugins list --enabled --verbose` 以查看每个已启用插件
  及其来源。
- 对每个可疑插件运行 `openclaw plugins inspect <id> --json`，
  比较 `channels`、`channelConfigs`、`tools` 和诊断信息。
- 在安装或移除
  插件包后运行 `openclaw plugins registry --refresh`，以便持久化元数据反映当前安装状态。
- 在安装、注册表或配置变更后重启 Gateway 网关。

修复选项：

- 如果某个插件本来就打算替换另一个插件的同一渠道 ID，
  首选插件应声明 `channelConfigs.<channel-id>.preferOver`，其值为
  低优先级插件 ID。请参阅 [/plugins/manifest#replacing-another-channel-plugin](/zh-CN/plugins/manifest#replacing-another-channel-plugin)。
- 如果重复属于意外情况，请使用
  `plugins.entries.<plugin-id>.enabled: false` 禁用其中一方，或移除过时的插件安装。
- 如果你显式启用了两个插件，OpenClaw 会保留这一请求并
  报告冲突。请为该渠道选择一个唯一所有者，或重命名插件拥有的
  工具，以确保运行时表面不含歧义。

## 插件槽位（独占类别）

某些类别是独占的（同一时间只能有一个处于活动状态）：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或用 "none" 禁用
      contextEngine: "legacy", // 或某个插件 id
    },
  },
}
```

| 槽位 | 控制内容 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 活动的 Memory 插件 | `memory-core` |
| `contextEngine` | 活动的上下文引擎 | `legacy`（内置） |

## CLI 参考

```bash
openclaw plugins list                       # 精简清单
openclaw plugins list --enabled            # 仅显示已启用插件
openclaw plugins list --verbose            # 每个插件的详细行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全量表格
openclaw plugins info <id>                 # inspect 别名
openclaw plugins doctor                    # 诊断
openclaw plugins registry                  # 检查持久化注册表状态
openclaw plugins registry --refresh        # 重建持久化注册表
openclaw doctor --fix                      # 修复插件注册表状态

openclaw plugins install <package>         # 安装（优先 ClawHub，然后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 开发用链接（不复制）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm 规范
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 更新单个插件
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 删除配置和插件索引记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起发布。许多默认启用（例如
内置模型提供商、内置语音提供商以及内置浏览器
插件）。其他内置插件仍然需要 `openclaw plugins enable <id>`。

`--force` 会原地覆盖现有已安装插件或 hook 包。对于已跟踪的 npm
插件的常规升级，请使用 `openclaw plugins update <id-or-npm-spec>`。
它不支持与 `--link` 一起使用，因为后者会复用源路径，
而不是复制到受管安装目标中。

当 `plugins.allow` 已设置时，`openclaw plugins install` 会在启用前
将已安装插件的 ID 添加到该 allowlist 中，因此安装后的插件在重启后
可以立即加载。

OpenClaw 会维护一个持久化的本地插件注册表，作为
插件清单、贡献归属和启动规划的冷读取模型。安装、更新、
卸载、启用和禁用流程在修改插件
状态后都会刷新该注册表。同一个 `plugins/installs.json` 文件会在顶层
`installRecords` 中保存持久的安装元数据，并在 `plugins` 中保存可重建的清单元数据。如果
注册表缺失、过时或无效，`openclaw plugins registry
--refresh` 会根据安装记录、配置策略以及
清单/package 元数据重建其清单视图，而无需加载插件运行时模块。
`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪安装。
传入带有 dist-tag 或精确版本的 npm 包规范时，会将包名解析
回已跟踪的插件记录，并记录新的规范以供未来更新。
传入不带版本的包名时，会把精确固定版本的安装移回
注册表的默认发布线。如果已安装的 npm 插件已经匹配
解析后的版本和记录的制品标识，OpenClaw 会跳过本次更新，
不会下载、重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，
因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是用于处理内置危险代码扫描器误报的
应急覆盖开关。它允许插件安装
和插件更新绕过内置的 `critical` 发现继续执行，但它仍然
不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关 支持的 Skills
依赖安装则使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖；
而 `openclaw skills install` 仍然是单独的 ClawHub Skills 下载/安装流程。

兼容的插件包会参与同一套插件 list/inspect/enable/disable
流程。当前运行时支持包括 bundle Skills、Claude command-skills、
Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的
`lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook
目录。

`openclaw plugins inspect <id>` 还会报告检测到的 Bundle 能力，以及
由 bundle 支持的插件中受支持或不受支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是来自
`~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称、
本地 marketplace 根目录或 `marketplace.json` 路径、像 `owner/repo` 这样的 GitHub 简写、
GitHub 仓库 URL，或 git URL。对于远程 marketplace，
插件条目必须保留在克隆的 marketplace 仓库内部，并且只能使用相对路径来源。

完整详情请参阅 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

原生插件导出一个入口对象，该对象暴露 `register(api)`。较旧的
插件可能仍然使用 `activate(api)` 作为旧版别名，但新插件应当
使用 `register`。

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

OpenClaw 会加载该入口对象，并在插件激活期间调用 `register(api)`。
加载器仍会为较旧插件回退到 `activate(api)`，
但内置插件和新的外部插件都应将 `register` 视为公共契约。

`api.registrationMode` 会告诉插件它的入口为何被加载：

| 模式 | 含义 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 运行时激活。注册工具、钩子、服务、命令、路由以及其他实时副作用。 |
| `discovery` | 只读能力发现。注册提供商和元数据；可信插件入口代码可能会被加载，但应跳过实时副作用。 |
| `setup-only` | 通过轻量级设置入口加载渠道设置元数据。 |
| `setup-runtime` | 加载也需要运行时入口的渠道设置。 |
| `cli-metadata` | 仅收集 CLI 命令元数据。 |

会打开套接字、数据库、后台 worker 或长生命周期客户端的
插件入口，应使用 `api.registrationMode === "full"` 来保护这些副作用。
发现加载与激活加载会分别缓存，
不会替换正在运行的 Gateway 网关 注册表。发现是非激活式的，而不是免导入式的：
OpenClaw 可能会对可信插件入口或渠道插件模块求值，以构建
快照。请保持模块顶层轻量且无副作用，并把
网络客户端、子进程、监听器、凭证读取和服务启动
放到完整运行时路径之后。

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
| `registerWebFetchProvider` | 网页抓取 / 爬取提供商 |
| `registerWebSearchProvider` | 网页搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

针对类型化生命周期钩子的钩子保护行为：

- `before_tool_call`：`{ block: true }` 为终止态；较低优先级处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除更早的阻止。
- `before_install`：`{ block: true }` 为终止态；较低优先级处理器会被跳过。
- `before_install`：`{ block: false }` 是无操作，不会清除更早的阻止。
- `message_sending`：`{ cancel: true }` 为终止态；较低优先级处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除更早的取消。

原生 Codex app-server 会把桥接的 Codex 原生工具事件回传到这个
钩子表面。插件可以通过 `before_tool_call` 阻止原生 Codex 工具，
通过 `after_tool_call` 观察结果，并参与 Codex
`PermissionRequest` 批准。该桥接目前还不会重写 Codex 原生工具
参数。准确的 Codex 运行时支持边界定义在
[Codex harness v1 支持契约](/zh-CN/plugins/codex-harness#v1-support-contract) 中。

有关完整的类型化钩子行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — 与 Codex/Claude/Cursor 兼容的插件包
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
