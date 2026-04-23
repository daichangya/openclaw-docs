---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容 bundle
    - 你想调试插件加载失败 խնդիր
summary: '`openclaw plugins` 的 CLI 参考（列出、安装、市场、卸载、启用 / 禁用、Doctor）'
title: Plugins
x-i18n:
    generated_at: "2026-04-23T20:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: e940ac64f562ded6dec6702d7d93a55ed3d6a69df6cae8811e9d02482bda0bbe
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

管理 Gateway 网关插件、hook pack 和兼容 bundle。

相关内容：

- 插件系统：[Plugins](/zh-CN/tools/plugin)
- bundle 兼容性：[Plugin bundles](/zh-CN/plugins/bundles)
- 插件清单 + schema：[Plugin manifest](/zh-CN/plugins/manifest)
- 安全加固：[Security](/zh-CN/gateway/security)

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

内置插件随 OpenClaw 一起提供。其中一些默认启用（例如
内置模型提供商、内置语音提供商以及内置浏览器
插件）；其他插件则需要通过 `plugins enable` 启用。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，并带有内联 JSON
Schema（`configSchema`，即使为空也需要）。兼容 bundle 则使用它们自己的 bundle
manifest。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细列表 / 信息
输出还会显示 bundle 子类型（`codex`、`claude` 或 `cursor`）以及检测到的 bundle
能力。

### 安装

```bash
openclaw plugins install <package>                      # 优先 ClawHub，然后 npm
openclaw plugins install clawhub:<package>              # 仅 ClawHub
openclaw plugins install <package> --force              # 覆盖现有安装
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（显式）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

裸包名会先在 ClawHub 中查找，然后再查找 npm。安全提示：
请将插件安装视为运行代码。优先使用固定版本。

如果你的 `plugins` 部分由单文件 `$include` 提供支持，则 `plugins install/update/enable/disable/uninstall` 会写回该被包含文件，并保持 `openclaw.json` 不变。根级 include、include 数组以及带有同级覆盖项的 include 都会以失败即关闭的方式处理，而不会展平。支持的形式请参阅 [Config includes](/zh-CN/gateway/configuration)。

如果配置无效，`plugins install` 通常会以失败即关闭的方式终止，并提示你
先运行 `openclaw doctor --fix`。唯一记录在案的例外是一个狭窄的
内置插件恢复路径，适用于显式启用
`openclaw.install.allowInvalidConfigRecovery` 的插件。

`--force` 会复用现有安装目标，并就地覆盖已安装的
插件或 hook pack。当你有意从新的本地路径、归档文件、ClawHub 包或 npm 构件重新安装
同一个 id 时，请使用它。
对于已被跟踪的 npm 插件的常规升级，优先使用
`openclaw plugins update <id-or-npm-spec>`。

如果你对一个已安装的插件 id 运行 `plugins install`，OpenClaw
会停止并提示你使用 `plugins update <id-or-npm-spec>` 进行常规升级，
或者在你确实想从不同来源覆盖当前安装时，使用
`plugins install <package> --force`。

`--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，
因为 marketplace 安装会持久保存 marketplace 来源元数据，而不是
npm spec。

`--dangerously-force-unsafe-install` 是一个破窗应急选项，用于处理内置危险代码扫描器的误报。
即使内置扫描器报告 `critical` 级发现，
它也允许继续安装，但它**不会**
绕过插件 `before_install` hook 策略拦截，也**不会**绕过扫描
失败。

这个 CLI 标志适用于插件安装 / 更新流程。由 Gateway 网关支持的 Skills
依赖安装使用匹配的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而 `openclaw skills install` 仍然是单独的 ClawHub Skills
下载 / 安装流程。

`plugins install` 也是暴露了
`package.json` 中 `openclaw.hooks` 的 hook pack 的安装入口。请使用 `openclaw hooks` 查看经过筛选的 hook
可见性和逐个 hook 启用状态，而不是用于包安装。

npm spec **仅限 registry**（包名 + 可选的**精确版本**或
**dist-tag**）。Git / URL / 文件 spec 和 semver 范围都会被拒绝。出于安全考虑，
依赖安装会使用 `--ignore-scripts` 运行。

裸 spec 和 `@latest` 会保持在稳定通道。如果 npm 将其中任一项解析为预发布版本，
OpenClaw 会停止，并要求你通过
预发布 tag（如 `@beta` / `@rc`）或精确的预发布版本（如
`@1.2.3-beta.4`）显式选择启用。

如果一个裸安装 spec 与某个内置插件 id 匹配（例如 `diffs`），OpenClaw
会直接安装该内置插件。若要安装同名 npm 包，请使用显式的带作用域 spec（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

还支持 Claude marketplace 安装。

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先为裸的 npm-safe 插件 spec 使用 ClawHub。只有当
ClawHub 没有该包或该版本时，它才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载包归档，检查声明的
插件 API / 最低 Gateway 网关兼容性，然后通过常规
归档路径安装。已记录的安装会保留其 ClawHub 来源元数据，以供后续更新使用。

当 marketplace 名称存在于 Claude 本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，
请使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

如果你想显式传递 marketplace 来源，请使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

marketplace 来源可以是：

- `~/.claude/plugins/known_marketplaces.json` 中 Claude 已知 marketplace 名称
- 本地 marketplace 根目录或 `marketplace.json` 路径
- GitHub 仓库简写，例如 `owner/repo`
- GitHub 仓库 URL，例如 `https://github.com/owner/repo`
- git URL

对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保持在克隆后的 marketplace 仓库内。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程 manifest 中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件来源。

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容 bundle（`.codex-plugin/plugin.json`）
- Claude 兼容 bundle（`.claude-plugin/plugin.json` 或默认 Claude
  组件布局）
- Cursor 兼容 bundle（`.cursor-plugin/plugin.json`）

兼容 bundle 会安装到普通插件根目录中，并参与
相同的 list / info / enable / disable 流程。目前，支持 bundle Skills、Claude
command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` /
manifest 声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的
Codex hook 目录；其他检测到的 bundle 能力会显示在诊断 / 信息中，但尚未接入运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已加载插件。使用 `--verbose` 可从
表格视图切换到逐插件详细行，显示来源 / 起源 / 版本 / 激活
元数据。使用 `--json` 获取机器可读的清单和注册表
诊断信息。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持与 `--link` 一起使用，因为链接安装会复用
源路径，而不是覆盖托管安装目标。

在 npm 安装时使用 `--pin`，可将解析得到的精确 spec（`name@version`）保存到
`plugins.installs` 中，而默认行为则不会固定版本。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、`plugins.installs`、
插件允许列表以及链接的 `plugins.load.paths` 条目中移除插件记录（如适用）。
对于活动记忆插件，memory 槽位会重置为 `memory-core`。

默认情况下，卸载还会移除活动
state-dir 插件根目录下的插件安装目录。使用
`--keep-files` 可保留磁盘上的文件。

`--keep-config` 作为 `--keep-files` 的已弃用别名仍受支持。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新会应用于 `plugins.installs` 中跟踪的安装，以及 `hooks.internal.installs` 中跟踪的 hook-pack
安装。

当你传入插件 id 时，OpenClaw 会复用为该
插件记录的安装 spec。这意味着先前保存的 dist-tag（如 `@beta`）和精确固定版本，在后续 `update <id>` 运行时仍会继续使用。

对于 npm 安装，你也可以传入显式 npm 包 spec，并带上 dist-tag
或精确版本。OpenClaw 会将该包名重新解析回已跟踪的插件
记录，更新该已安装插件，并记录新的 npm spec，供后续基于
id 的更新使用。

传入不带版本或 tag 的 npm 包名，也会重新解析回
已跟踪的插件记录。当某个插件被固定到精确版本，而你
想让它回到 registry 默认发布线时，请使用这种方式。

在执行实际 npm 更新之前，OpenClaw 会根据
npm registry 元数据检查已安装包版本。如果已安装版本和记录的构件
标识已经与解析后的目标一致，则会跳过更新，不会
下载、重新安装或重写 `openclaw.json`。

当存在已保存的完整性哈希，且获取到的构件哈希发生变化时，
OpenClaw 会将其视为 npm 构件漂移。交互式
`openclaw plugins update` 命令会打印预期与实际哈希，并在继续前请求
确认。非交互式更新辅助工具会以失败即关闭的方式终止，
除非调用方提供显式继续策略。

`--dangerously-force-unsafe-install` 在 `plugins update` 上同样可用，作为
插件更新期间内置危险代码扫描误报的破窗应急覆盖项。它仍然不会绕过插件 `before_install` 策略拦截
或扫描失败拦截，并且它仅适用于插件更新，不适用于 hook-pack
更新。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度检查。显示其标识、加载状态、来源、
已注册能力、hooks、工具、命令、服务、Gateway 网关方法、
HTTP 路由、策略标志、诊断信息、安装元数据、bundle 能力，
以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件都会根据其在运行时实际注册的内容进行分类：

- **plain-capability** —— 一种能力类型（例如仅提供商插件）
- **hybrid-capability** —— 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** —— 仅有 hooks，没有能力或界面
- **non-capability** —— 有工具 / 命令 / 服务，但没有能力

关于能力模型的更多内容，请参阅 [Plugin shapes](/zh-CN/plugins/architecture#plugin-shapes)。

`--json` 标志会输出适合脚本编写和
审计的机器可读报告。

`inspect --all` 会渲染一个覆盖全局插件的表格，其中包含 shape、能力种类、
兼容性说明、bundle 能力和 hook 摘要列。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、manifest / 发现诊断信息，以及
兼容性说明。当一切正常时，它会输出 `No plugin issues
detected.`

对于缺少 `register` / `activate` 导出之类的模块形态失败问题，请使用
`OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在
诊断输出中包含精简的导出形态摘要。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

marketplace list 接受本地 marketplace 路径、`marketplace.json` 路径、
类似 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL，或 git URL。`--json`
会输出解析后的来源标签，以及已解析的 marketplace manifest 和
插件条目。
