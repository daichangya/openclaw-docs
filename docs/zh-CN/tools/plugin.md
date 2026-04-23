---
read_when:
    - 安装或配置插件时 ауаҩы to=final code  omitted
    - 了解插件发现和加载规则时��� to=final code  omitted
    - 使用兼容 Codex/Claude 的插件包时
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-23T21:09:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2cf5cb6146ae5e52a32201ee08c03211dbea2313b884c696307abc56d3f9cbf
    source_path: tools/plugin.md
    workflow: 15
---

插件会为 OpenClaw 扩展新能力：渠道、模型提供商、
工具、Skills、语音、实时转写、实时语音、
媒体理解、图像生成、视频生成、网页抓取、Web
搜索等等。有些插件是**核心**插件（随 OpenClaw 一起发布），另一些则是**外部**插件（由社区发布到 npm）。

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

    然后在配置文件中的 `plugins.entries.\<id\>.config` 下进行配置。

  </Step>
</Steps>

如果你更喜欢聊天原生控制，请启用 `commands.plugins: true` 并使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档、显式
`clawhub:<pkg>`，或裸包规范（优先 ClawHub，然后回退 npm）。

如果配置无效，安装通常会以关闭失败方式终止，并提示你运行
`openclaw doctor --fix`。唯一的恢复例外是一个窄范围的内置插件
重装路径，适用于选择加入
`openclaw.install.allowInvalidConfigRecovery` 的插件。

打包版 OpenClaw 不会急切地安装每个内置插件的
运行时依赖树。当某个 OpenClaw 自有内置插件因
插件配置、旧版渠道配置或默认启用的 manifest 而处于活动状态时，启动
只会在导入该插件前修复它声明的运行时依赖。
外部插件和自定义加载路径仍然必须通过
`openclaw plugins install` 安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 兼容 Codex/Claude/Cursor 的布局；映射到 OpenClaw 功能 | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

这两类都会出现在 `openclaw plugins list` 中。有关 bundle 细节，请参见 [Plugin Bundles](/zh-CN/plugins/bundles)。

如果你在编写 Native 插件，请从 [Building Plugins](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 官方插件

### 可安装（npm）

| 插件 | 包名 | 文档 |
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

  <Accordion title="记忆插件">
    - `memory-core` —— 内置记忆搜索（默认通过 `plugins.slots.memory` 启用）
    - `memory-lancedb` —— 按需安装的长期记忆，支持自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`、`microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` —— 用于浏览器工具、`openclaw browser` CLI、`browser.request` gateway 方法、浏览器运行时和默认浏览器控制服务的内置浏览器插件（默认启用；在替换它之前请先禁用）
    - `copilot-proxy` —— VS Code Copilot Proxy bridge（默认禁用）
  </Accordion>
</AccordionGroup>

想找第三方插件？请参见 [Community Plugins](/zh-CN/plugins/community)。

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
| `allow` | 插件 allowlist（可选） |
| `deny` | 插件 denylist（可选；deny 优先） |
| `load.paths` | 额外的插件文件/目录 |
| `slots` | 排他性 slot 选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 按插件划分的开关 + 配置 |

配置更改**需要重启 gateway**。如果 Gateway 网关以启用配置
监视 + 进程内重启的方式运行（默认的 `openclaw gateway` 路径），该
重启通常会在配置写入后不久自动执行。

<Accordion title="插件状态：disabled vs missing vs invalid">
  - **Disabled**：插件存在，但启用规则将其关闭。配置会被保留。
  - **Missing**：配置引用了某个插件 id，但发现过程中未找到它。
  - **Invalid**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现与优先级

OpenClaw 按以下顺序扫描插件（先匹配者获胜）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` —— 显式文件或目录路径。
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
- `plugins.deny` 永远优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来自工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 排他性 slot 可以强制启用该 slot 所选的插件

## 插件 slots（排他性类别）

某些类别是排他的（同一时间只能有一个处于活动状态）：

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

| Slot | 它控制什么 | 默认值 |
| --------------- | --------------------- | ------------------- |
| `memory` | 活动的记忆插件 | `memory-core` |
| `contextEngine` | 活动的上下文引擎 | `legacy`（内建） |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅显示已加载插件
openclaw plugins list --verbose            # 按插件显示详细行
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
openclaw plugins install -l <path>         # link（不复制），用于开发
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

内置插件随 OpenClaw 一起发布。许多默认启用（例如
内置模型提供商、内置语音提供商，以及内置浏览器
插件）。其他内置插件仍然需要 `openclaw plugins enable <id>`。

`--force` 会原地覆盖现有已安装插件或 hook pack。对于已跟踪 npm
插件的日常升级，请使用 `openclaw plugins update <id-or-npm-spec>`。
它不支持与 `--link` 一起使用，因为 `--link` 会复用源路径，而不是
复制到受管理的安装目标中。

当已经设置了 `plugins.allow` 时，`openclaw plugins install` 会在
启用插件前先将该插件 id 添加到该 allowlist 中，因此重启后即可立即加载。

`openclaw plugins update <id-or-npm-spec>` 适用于已跟踪安装。传入
带 dist-tag 或精确版本的 npm 包规范时，会将包名重新解析回已跟踪插件记录，并为将来的更新记录新规范。
传入不带版本的包名时，会将精确固定的安装切回
注册表的默认发布线。如果已安装的 npm 插件已经与
解析出的版本和记录的工件身份匹配，OpenClaw 会跳过此次更新，而不会下载、
重新安装或重写配置。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace 来源元数据，而不是 npm 规范。

`--dangerously-force-unsafe-install` 是针对内置危险代码扫描器误报的 break-glass 覆盖。它允许插件安装
和插件更新在内置 `critical` 发现之后继续进行，但仍
不会绕过插件 `before_install` 策略阻止或扫描失败阻止。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关驱动的 Skill
依赖安装则使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是单独的 ClawHub
skill 下载/安装流程。

兼容的 bundle 会参与同样的插件 list/inspect/enable/disable
流程。当前运行时支持 bundle Skills、Claude command-skills、
Claude `settings.json` 默认值、Claude `.lsp.json` 以及 manifest 声明的
`lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook
目录。

`openclaw plugins inspect <id>` 还会为基于 bundle 的插件报告检测到的 bundle 能力，以及受支持或不受支持的 MCP 和 LSP 服务器条目。

Marketplace 来源可以是 `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称、本地 marketplace 根目录或
`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库
URL，或 git URL。对于远程 marketplaces，插件条目必须保持在
克隆后的 marketplace 仓库内部，并且只能使用相对路径来源。

完整细节请参见 [`openclaw plugins` CLI 参考](/zh-CN/cli/plugins)。

## 插件 API 概览

Native 插件会导出一个入口对象，暴露 `register(api)`。较旧的
插件仍可能使用 `activate(api)` 作为旧版别名，但新插件应使用
`register`。

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

OpenClaw 会加载该入口对象，并在插件
激活期间调用 `register(api)`。加载器仍会为旧插件回退到 `activate(api)`，
但内置插件和新的外部插件应将 `register` 视为公共契约。

常见注册方法：

| 方法 | 它注册的内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider` | 模型提供商（LLM） |
| `registerChannel` | 聊天渠道 |
| `registerTool` | 智能体工具 |
| `registerHook` / `on(...)` | 生命周期 hooks |
| `registerSpeechProvider` | 文本转语音 / STT |
| `registerRealtimeTranscriptionProvider` | 流式 STT |
| `registerRealtimeVoiceProvider` | 双工实时语音 |
| `registerMediaUnderstandingProvider` | 图像/音频分析 |
| `registerImageGenerationProvider` | 图像生成 |
| `registerMusicGenerationProvider` | 音乐生成 |
| `registerVideoGenerationProvider` | 视频生成 |
| `registerWebFetchProvider` | 网页抓取 / 抓取提供商 |
| `registerWebSearchProvider` | Web 搜索 |
| `registerHttpRoute` | HTTP 端点 |
| `registerCommand` / `registerCli` | CLI 命令 |
| `registerContextEngine` | 上下文引擎 |
| `registerService` | 后台服务 |

带类型生命周期 hooks 的 hook 护栏行为：

- `before_tool_call`：`{ block: true }` 是终止性的；会跳过更低优先级处理器。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除更早的 block。
- `before_install`：`{ block: true }` 是终止性的；会跳过更低优先级处理器。
- `before_install`：`{ block: false }` 是无操作，不会清除更早的 block。
- `message_sending`：`{ cancel: true }` 是终止性的；会跳过更低优先级处理器。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除更早的 cancel。

完整的类型化 hook 行为请参见 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [Building Plugins](/zh-CN/plugins/building-plugins) —— 创建你自己的插件
- [Plugin Bundles](/zh-CN/plugins/bundles) —— Codex/Claude/Cursor bundle 兼容性
- [Plugin Manifest](/zh-CN/plugins/manifest) —— manifest schema
- [Registering Tools](/zh-CN/plugins/building-plugins#registering-agent-tools) —— 在插件中添加智能体工具
- [Plugin Internals](/zh-CN/plugins/architecture) —— 能力模型和加载流水线
- [Community Plugins](/zh-CN/plugins/community) —— 第三方列表
