---
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Install and Configure
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-04-20T16:49:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# 插件

插件可为 OpenClaw 扩展新能力：渠道、模型提供商、工具、Skills、语音、实时转写、实时语音、媒体理解、图像生成、视频生成、网页抓取、网页搜索等。有些插件是**核心**插件（随 OpenClaw 一起提供），另一些是**外部**插件（由社区发布到 npm）。

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

    然后在你的配置文件中，通过 `plugins.entries.\<id\>.config` 进行配置。

  </Step>
</Steps>

如果你更喜欢使用聊天原生控制方式，请启用 `commands.plugins: true`，然后使用：

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

安装路径使用与 CLI 相同的解析器：本地路径/归档文件、显式 `clawhub:<pkg>`，或裸包规范（优先 ClawHub，然后回退到 npm）。

如果配置无效，安装通常会以失败关闭的方式结束，并提示你使用
`openclaw doctor --fix`。唯一的恢复例外，是针对选择启用
`openclaw.install.allowInvalidConfigRecovery` 的插件所提供的一条受限的内置插件重装路径。

打包分发的 OpenClaw 安装不会急切安装每个内置插件的全部运行时依赖树。
当某个由 OpenClaw 拥有的内置插件因插件配置、旧版渠道配置或默认启用的清单而处于激活状态时，启动过程只会在导入该插件之前修复它所声明的运行时依赖。外部插件和自定义加载路径仍然必须通过
`openclaw plugins install` 安装。

## 插件类型

OpenClaw 可识别两种插件格式：

| 格式 | 工作方式 | 示例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **原生** | `openclaw.plugin.json` + 运行时模块；在进程内执行 | 官方插件、社区 npm 包 |
| **Bundle** | 与 Codex/Claude/Cursor 兼容的布局；映射到 OpenClaw 功能 | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

两者都会显示在 `openclaw plugins list` 中。有关 Bundle 的详细信息，请参阅 [插件包](/zh-CN/plugins/bundles)。

如果你正在编写原生插件，请从 [构建插件](/zh-CN/plugins/building-plugins)
和 [插件 SDK 概览](/zh-CN/plugins/sdk-overview) 开始。

## 官方插件

### 可安装（npm）

| 插件 | 包名 | 文档 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/zh-CN/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/zh-CN/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/zh-CN/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/zh-CN/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/zh-CN/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/zh-CN/plugins/zalouser)   |

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
    - `memory-core` — 内置的 Memory 搜索（默认通过 `plugins.slots.memory` 使用）
    - `memory-lancedb` — 按需安装的长期 Memory，支持自动召回/捕获（设置 `plugins.slots.memory = "memory-lancedb"`）
  </Accordion>

  <Accordion title="语音提供商（默认启用）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="其他">
    - `browser` — 用于浏览器工具、`openclaw browser` CLI、`browser.request` Gateway 网关方法、浏览器运行时以及默认浏览器控制服务的内置浏览器插件（默认启用；在替换它之前请先禁用）
    - `copilot-proxy` — VS Code Copilot Proxy 桥接（默认禁用）
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
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| 字段 | 说明 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | 总开关（默认：`true`） |
| `allow`          | 插件允许列表（可选） |
| `deny`           | 插件拒绝列表（可选；拒绝优先） |
| `load.paths`     | 额外的插件文件/目录 |
| `slots`          | 独占插槽选择器（例如 `memory`、`contextEngine`） |
| `entries.\<id\>` | 每个插件的开关 + 配置 |

配置变更**需要重启 Gateway 网关**。如果 Gateway 网关正在以启用了配置监听和进程内重启的方式运行（默认的 `openclaw gateway` 路径），那么配置写入落盘后，通常会在稍后自动执行该重启。

<Accordion title="插件状态：已禁用 vs 缺失 vs 无效">
  - **已禁用**：插件存在，但启用规则将其关闭。配置会被保留。
  - **缺失**：配置引用了某个插件 id，但发现流程没有找到它。
  - **无效**：插件存在，但其配置与声明的 schema 不匹配。
</Accordion>

## 发现与优先级

OpenClaw 会按以下顺序扫描插件（先匹配到的优先）：

<Steps>
  <Step title="配置路径">
    `plugins.load.paths` — 显式文件或目录路径。
  </Step>

  <Step title="工作区扩展">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` 和 `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="全局扩展">
    `~/.openclaw/<plugin-root>/*.ts` 和 `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="内置插件">
    随 OpenClaw 一起提供。许多插件默认启用（模型提供商、语音）。
    其他插件则需要显式启用。
  </Step>
</Steps>

### 启用规则

- `plugins.enabled: false` 会禁用所有插件
- `plugins.deny` 始终优先于 allow
- `plugins.entries.\<id\>.enabled: false` 会禁用该插件
- 来自工作区的插件**默认禁用**（必须显式启用）
- 内置插件遵循内建的默认启用集合，除非被覆盖
- 独占插槽可以强制启用该插槽所选中的插件

## 插件插槽（独占类别）

某些类别是独占的（同一时间只能激活一个）：

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
| `memory`        | 当前激活的 Memory 插件 | `memory-core`       |
| `contextEngine` | 当前激活的上下文引擎 | `legacy`（内建） |

## CLI 参考

```bash
openclaw plugins list                       # 紧凑清单
openclaw plugins list --enabled            # 仅显示已加载插件
openclaw plugins list --verbose            # 每个插件的详细信息行
openclaw plugins list --json               # 机器可读清单
openclaw plugins inspect <id>              # 深度详情
openclaw plugins inspect <id> --json       # 机器可读
openclaw plugins inspect --all             # 全量表格
openclaw plugins info <id>                 # inspect 的别名
openclaw plugins doctor                    # 诊断

openclaw plugins install <package>         # 安装（优先 ClawHub，然后 npm）
openclaw plugins install clawhub:<pkg>     # 仅从 ClawHub 安装
openclaw plugins install <spec> --force    # 覆盖现有安装
openclaw plugins install <path>            # 从本地路径安装
openclaw plugins install -l <path>         # 链接（不复制），用于开发
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 记录精确解析后的 npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # 更新单个插件
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # 更新全部
openclaw plugins uninstall <id>          # 删除配置/安装记录
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

内置插件随 OpenClaw 一起提供。许多插件默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）。其他内置插件仍然需要执行 `openclaw plugins enable <id>`。

`--force` 会原地覆盖已安装的现有插件或 hook 包。
它不支持与 `--link` 一起使用，因为 `--link` 会复用源路径，而不是复制到受管安装目标中。

`--pin` 仅适用于 npm。它不支持与 `--marketplace` 一起使用，因为
marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是一个应急覆盖选项，用于处理内置危险代码扫描器的误报。它允许插件安装和插件更新在遇到内置 `critical` 发现后继续进行，但它仍然不会绕过插件 `before_install` 策略阻止或扫描失败拦截。

这个 CLI 标志仅适用于插件安装/更新流程。由 Gateway 网关驱动的 Skills 依赖安装则会改用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖参数，而 `openclaw skills install` 仍然是独立的 ClawHub Skills 下载/安装流程。

兼容的 Bundle 参与相同的插件 list/inspect/enable/disable 流程。当前运行时支持包括 Bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` 和清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录。

`openclaw plugins inspect <id>` 还会报告已检测到的 Bundle 能力，以及由 Bundle 支持或不支持的 MCP 和 LSP server 条目。

Marketplace 来源可以是来自
`~/.claude/plugins/known_marketplaces.json` 的 Claude 已知 marketplace 名称、本地 marketplace 根目录或
`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。对于远程 marketplace，插件条目必须保留在克隆得到的 marketplace 仓库内，并且只能使用相对路径来源。

完整详情请参阅 [`openclaw plugins` CLI 参考](/cli/plugins)。

## 插件 API 概览

原生插件会导出一个入口对象，该对象暴露 `register(api)`。旧版插件仍可能继续使用 `activate(api)` 作为旧别名，但新插件应使用 `register`。

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

OpenClaw 会加载该入口对象，并在插件激活期间调用 `register(api)`。加载器仍会为旧版插件回退到 `activate(api)`，但内置 Bundle 插件和新的外部插件都应将 `register` 视为公开契约。

常见的注册方法：

| 方法 | 注册内容 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | 模型提供商（LLM） |
| `registerChannel`                       | 聊天渠道 |
| `registerTool`                          | 智能体工具 |
| `registerHook` / `on(...)`              | 生命周期 hook |
| `registerSpeechProvider`                | 文本转语音 / STT |
| `registerRealtimeTranscriptionProvider` | 流式 STT |
| `registerRealtimeVoiceProvider`         | 双向实时语音 |
| `registerMediaUnderstandingProvider`    | 图像/音频分析 |
| `registerImageGenerationProvider`       | 图像生成 |
| `registerMusicGenerationProvider`       | 音乐生成 |
| `registerVideoGenerationProvider`       | 视频生成 |
| `registerWebFetchProvider`              | 网页抓取 / 抓取提供商 |
| `registerWebSearchProvider`             | 网页搜索 |
| `registerHttpRoute`                     | HTTP 端点 |
| `registerCommand` / `registerCli`       | CLI 命令 |
| `registerContextEngine`                 | 上下文引擎 |
| `registerService`                       | 后台服务 |

类型化生命周期 hook 的守卫行为：

- `before_tool_call`：`{ block: true }` 是终止性的；优先级更低的处理器会被跳过。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除更早的 block。
- `before_install`：`{ block: true }` 是终止性的；优先级更低的处理器会被跳过。
- `before_install`：`{ block: false }` 是空操作，不会清除更早的 block。
- `message_sending`：`{ cancel: true }` 是终止性的；优先级更低的处理器会被跳过。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除更早的 cancel。

有关完整的类型化 hook 行为，请参阅 [SDK 概览](/zh-CN/plugins/sdk-overview#hook-decision-semantics)。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 创建你自己的插件
- [插件包](/zh-CN/plugins/bundles) — Codex/Claude/Cursor Bundle 兼容性
- [插件清单](/zh-CN/plugins/manifest) — 清单 schema
- [注册工具](/zh-CN/plugins/building-plugins#registering-agent-tools) — 在插件中添加智能体工具
- [插件内部机制](/zh-CN/plugins/architecture) — 能力模型和加载流水线
- [社区插件](/zh-CN/plugins/community) — 第三方列表
