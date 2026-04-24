---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容捆绑包
    - 你想调试插件加载失败问题
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-04-24T03:15:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

管理 Gateway 网关插件、hook 包和兼容捆绑包。

相关内容：

- 插件系统：[插件](/zh-CN/tools/plugin)
- 捆绑包兼容性：[插件捆绑包](/zh-CN/plugins/bundles)
- 插件清单 + schema：[插件清单](/zh-CN/plugins/manifest)
- 安全加固：[安全](/zh-CN/gateway/security)

## 命令

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

内置插件会随 OpenClaw 一起提供。其中一些默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）；另一些则需要执行 `plugins enable`。

原生 OpenClaw 插件必须提供 `openclaw.plugin.json`，并带有内联 JSON Schema（`configSchema`，即使为空也需要）。兼容捆绑包则使用它们自己的捆绑包清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细列表/info 输出还会显示捆绑包子类型（`codex`、`claude` 或 `cursor`）以及检测到的捆绑包能力。

### 安装

```bash
openclaw plugins install <package>                      # 先 ClawHub，后 npm
openclaw plugins install clawhub:<package>              # 仅 ClawHub
openclaw plugins install <package> --force              # 覆盖现有安装
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（显式）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

裸包名会先在 ClawHub 中检查，然后再检查 npm。安全提示：请将插件安装视为运行代码。优先使用固定版本。

如果你的 `plugins` 部分由单文件 `$include` 提供支持，`plugins install/update/enable/disable/uninstall` 会将变更写入该被包含文件，并保持 `openclaw.json` 不变。根级 include、include 数组，以及带有同级覆盖项的 include 会以失败即关闭的方式处理，而不会被展平。支持的结构请参见 [配置 include](/zh-CN/gateway/configuration)。

如果配置无效，`plugins install` 通常会以失败即关闭的方式终止，并提示你先运行 `openclaw doctor --fix`。唯一有文档记录的例外是一个狭窄的内置插件恢复路径，仅适用于显式选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。

`--force` 会复用现有安装目标，并原地覆盖已安装的插件或 hook 包。当你有意从新的本地路径、归档文件、ClawHub 包或 npm 制品重新安装同一个 id 时，请使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

如果你对已安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并将你引导到 `plugins update <id-or-npm-spec>` 进行常规升级；如果你确实想从不同来源覆盖当前安装，则使用 `plugins install <package> --force`。

`--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是用于内置危险代码扫描器误报的紧急破窗选项。即使内置扫描器报告 `critical` 级别问题，它也允许安装继续进行，但它**不会**绕过插件 `before_install` hook 策略阻止，也**不会**绕过扫描失败。

这个 CLI 标志适用于插件 install/update 流程。由 Gateway 网关支持的 skill 依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是单独的 ClawHub skill 下载/安装流程。

`plugins install` 也是暴露 `openclaw.hooks` 的 hook 包在 `package.json` 中的安装入口。请使用 `openclaw hooks` 来进行经过过滤的 hook 可见性查看和按 hook 启用，而不是进行包安装。

npm spec **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file spec 和 semver 范围会被拒绝。出于安全考虑，依赖安装会使用 `--ignore-scripts` 运行。

裸 spec 和 `@latest` 会保持在稳定通道上。如果 npm 将它们中的任意一个解析为预发布版本，OpenClaw 会停止，并要求你显式选择加入预发布标签，例如 `@beta`/`@rc`，或者像 `@1.2.3-beta.4` 这样的精确预发布版本。

如果一个裸安装 spec 与某个内置插件 id 匹配（例如 `diffs`），OpenClaw 会直接安装该内置插件。若要安装同名 npm 包，请使用显式的作用域 spec（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

也支持 Claude marketplace 安装。

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

现在，OpenClaw 对于裸 npm-safe 插件 spec 也会优先使用 ClawHub。只有当 ClawHub 没有该包或该版本时，它才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载包归档，检查公布的插件 API / 最低网关兼容性，然后通过常规归档路径安装它。记录下来的安装会保留其 ClawHub 源元数据，以便后续更新。

当 marketplace 名称存在于 Claude 本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，可使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传递 marketplace 源时，使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace 源可以是：

- `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称
- 本地 marketplace 根目录或 `marketplace.json` 路径
- GitHub 仓库简写，例如 `owner/repo`
- GitHub 仓库 URL，例如 `https://github.com/owner/repo`
- git URL

对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在克隆的 marketplace 仓库内。OpenClaw 接受来自该仓库的相对路径源，并拒绝远程清单中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件源。

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容捆绑包（`.codex-plugin/plugin.json`）
- Claude 兼容捆绑包（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容捆绑包（`.cursor-plugin/plugin.json`）

兼容捆绑包会安装到常规插件根目录中，并参与相同的 list/info/enable/disable 流程。目前，已支持 bundle skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / 清单声明的 `lspServers` 默认值、Cursor command-skills 以及兼容的 Codex hook 目录；其他已检测到的捆绑包能力会在诊断/info 中显示，但尚未接入运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已加载的插件。使用 `--verbose` 可从表格视图切换到按插件显示的详细行，其中包含 source/origin/version/activation 元数据。使用 `--json` 获取机器可读的清单以及注册表诊断信息。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是复制到受管安装目标。

在 npm 安装中使用 `--pin`，可将解析后的精确 spec（`name@version`）保存到 `plugins.installs` 中，而默认行为则保持不固定版本。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、`plugins.installs`、插件 allowlist，以及在适用时从已链接的 `plugins.load.paths` 条目中移除插件记录。对于活跃的 memory 插件，memory 槽位会重置为 `memory-core`。

默认情况下，卸载还会删除活动 state-dir 插件根目录下的插件安装目录。使用 `--keep-files` 可保留磁盘上的文件。

`--keep-config` 作为 `--keep-files` 的已弃用别名仍受支持。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新会应用到 `plugins.installs` 中已跟踪的安装，以及 `hooks.internal.installs` 中已跟踪的 hook 包安装。

当你传入一个插件 id 时，OpenClaw 会复用为该插件记录的安装 spec。这意味着之前存储的 dist-tag（如 `@beta`）和精确固定版本会在后续 `update <id>` 运行中继续使用。

对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 包 spec。OpenClaw 会将该包名解析回已跟踪的插件记录，更新这个已安装插件，并为将来的基于 id 的更新记录新的 npm spec。

传入不带版本或标签的 npm 包名也会解析回已跟踪的插件记录。当某个插件被固定到精确版本，而你想让它回到 registry 的默认发布线时，请使用这种方式。

在执行实际 npm 更新之前，OpenClaw 会根据 npm registry 元数据检查已安装包版本。如果已安装版本和记录的制品标识已与解析目标匹配，则会跳过更新，不会下载、重新安装或重写 `openclaw.json`。

当存在已存储的完整性哈希，而抓取到的制品哈希发生变化时，OpenClaw 会将其视为 npm 制品漂移。交互式 `openclaw plugins update` 命令会打印期望哈希和实际哈希，并在继续前请求确认。非交互式更新助手会以失败即关闭的方式终止，除非调用方提供显式的继续策略。

`--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新期间内置危险代码扫描误报的紧急破窗覆盖。它仍然不会绕过插件 `before_install` 策略阻止，也不会绕过扫描失败阻止，并且它仅适用于插件更新，不适用于 hook 包更新。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度检查。显示身份、加载状态、来源、已注册能力、hooks、工具、命令、服务、网关方法、HTTP 路由、策略标志、诊断、安装元数据、捆绑包能力，以及任何已检测到的 MCP 或 LSP 服务器支持。

每个插件都会根据其在运行时实际注册的内容进行分类：

- **plain-capability** — 单一能力类型（例如，仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如，文本 + 语音 + 图像）
- **hook-only** — 仅有 hooks，没有能力或入口面
- **non-capability** — 有工具/命令/服务，但没有能力

关于能力模型的更多信息，请参见 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

`--json` 标志会输出适合脚本和审计使用的机器可读报告。

`inspect --all` 会渲染一个覆盖全量插件的表格，其中包含形态、能力种类、兼容性提示、捆绑包能力和 hook 摘要列。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、清单/发现诊断以及兼容性提示。当一切正常时，它会打印 `No plugin issues
detected.`

对于诸如缺少 `register`/`activate` 导出之类的模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在诊断输出中包含紧凑的导出形态摘要。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace 列表支持本地 marketplace 路径、`marketplace.json` 路径、类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json` 会打印解析后的源标签，以及解析出的 marketplace 清单和插件条目。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [构建插件](/zh-CN/plugins/building-plugins)
- [社区插件](/zh-CN/plugins/community)
