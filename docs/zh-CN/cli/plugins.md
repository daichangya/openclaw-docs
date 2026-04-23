---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容捆绑包
    - 你想调试插件加载失败
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: plugins
x-i18n:
    generated_at: "2026-04-23T07:05:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7dd521db1de47ceb183d98a538005d3d816f52ffeee12593bcbaa8014d6e507b
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

管理 Gateway 网关插件、hook 包和兼容捆绑包。

相关内容：

- 插件系统：[Plugins](/zh-CN/tools/plugin)
- 捆绑包兼容性：[Plugin bundles](/zh-CN/plugins/bundles)
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
插件）；另一些则需要执行 `plugins enable`。

原生 OpenClaw 插件必须提供带内联 JSON
Schema 的 `openclaw.plugin.json`（`configSchema`，即使为空也必须存在）。兼容捆绑包则使用它们自己的捆绑包清单。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细的 list/info
输出还会显示捆绑包子类型（`codex`、`claude` 或 `cursor`）以及检测到的捆绑包
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
openclaw plugins install <plugin> --marketplace <name>  # marketplace（显式指定）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

裸包名会先在 ClawHub 中检查，然后再检查 npm。安全说明：
安装插件等同于运行代码。优先使用固定版本。

如果你的 `plugins` 配置部分由单文件 `$include` 支持，`plugins install`、
`plugins update`、`plugins enable`、`plugins disable` 和 `plugins uninstall`
会直接写入该被包含文件，并保持 `openclaw.json` 不变。根级
include、include 数组以及带有同级覆盖项的 include 会以失败关闭的方式处理，
而不是被拍平成单一配置。支持的形式请参阅 [Config includes](/zh-CN/gateway/configuration)。

如果配置无效，`plugins install` 通常会以失败关闭的方式终止，并提示你先
运行 `openclaw doctor --fix`。唯一有文档说明的例外是一个针对内置插件的窄范围恢复路径，
适用于显式启用了
`openclaw.install.allowInvalidConfigRecovery` 的插件。

`--force` 会复用现有安装目标，并原地覆盖一个已安装的
插件或 hook 包。当你有意从新的本地路径、归档、ClawHub 包或 npm 制品
重新安装相同 id 时可使用它。
对于已跟踪 npm 插件的常规升级，优先使用
`openclaw plugins update <id-or-npm-spec>`。

如果你对一个已安装的插件 id 运行 `plugins install`，OpenClaw
会停止并提示你：正常升级请使用 `plugins update <id-or-npm-spec>`，
如果你确实想从不同来源覆盖
当前安装，则使用 `plugins install <package> --force`。

`--pin` 仅适用于 npm 安装。它不支持与 `--marketplace`
一起使用，因为 marketplace 安装会保留 marketplace 来源元数据，而不是
npm spec。

`--dangerously-force-unsafe-install` 是一个应急选项，用于处理内置危险代码扫描器
的误报。即使内置扫描器报告 `critical` 级别发现，
它也允许安装继续进行，但它 **不会** 绕过插件 `before_install` hook 策略拦截，
也 **不会** 绕过扫描失败。

这个 CLI 标志适用于插件安装/更新流程。由 Gateway 网关支持的 Skills
依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而 `openclaw skills install` 仍然是独立的 ClawHub Skills
下载/安装流程。

`plugins install` 也是暴露
`openclaw.hooks` 于 `package.json` 中的 hook 包的安装入口。请使用 `openclaw hooks` 查看经过筛选的 hook
可见性和按 hook 启用控制，而不是用于安装包。

npm spec **仅限 registry**（包名 + 可选的 **精确版本** 或
**dist-tag**）。Git/URL/file spec 和 semver 范围会被拒绝。出于安全考虑，
依赖安装会使用 `--ignore-scripts` 运行。

裸 spec 和 `@latest` 会保持在稳定通道。如果 npm 将其中任一解析为预发布版本，
OpenClaw 会停止，并要求你显式选择加入，例如使用
`@beta`/`@rc` 这样的预发布标签，或像
`@1.2.3-beta.4` 这样的精确预发布版本。

如果一个裸安装 spec 与某个内置插件 id 匹配（例如 `diffs`），OpenClaw
会直接安装该内置插件。若要安装同名 npm 包，请使用显式作用域 spec（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

也支持 Claude marketplace 安装。

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

现在，对于 npm 安全的裸插件 spec，OpenClaw 也会优先使用 ClawHub。只有在
ClawHub 没有该包或该版本时，才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载包归档，检查其声明的
插件 API / 最低 Gateway 网关兼容性，然后通过常规
归档路径进行安装。已记录的安装会保留其 ClawHub 来源元数据，以供后续更新使用。

当 marketplace 名称存在于 Claude 的本地注册表缓存
`~/.claude/plugins/known_marketplaces.json` 中时，使用 `plugin@marketplace`
简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传递 marketplace 来源时，请使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace 来源可以是：

- `~/.claude/plugins/known_marketplaces.json` 中 Claude 已知 marketplace 名称
- 本地 marketplace 根目录或 `marketplace.json` 路径
- 例如 `owner/repo` 的 GitHub 仓库简写
- 例如 `https://github.com/owner/repo` 的 GitHub 仓库 URL
- git URL

对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在
克隆得到的 marketplace 仓库内。对于远程清单中的插件来源，OpenClaw 接受来自
该仓库的相对路径来源，并拒绝 HTTP(S)、绝对路径、git、GitHub 及其他非路径
来源。

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容捆绑包（`.codex-plugin/plugin.json`）
- Claude 兼容捆绑包（`.claude-plugin/plugin.json` 或默认的 Claude
  组件布局）
- Cursor 兼容捆绑包（`.cursor-plugin/plugin.json`）

兼容捆绑包会安装到常规插件根目录中，并参与
相同的 list/info/enable/disable 流程。目前，支持捆绑包 Skills、Claude
command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` /
清单声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的
Codex hook 目录；其他已检测到的捆绑包能力会显示在诊断/info 中，
但尚未接入运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已加载插件。使用 `--verbose` 可从
表格视图切换到按插件显示详情行，其中包含 source/origin/version/activation
元数据。使用 `--json` 可获取适用于机器读取的清单以及注册表
诊断信息。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持与 `--link` 同时使用，因为链接安装会复用
源路径，而不是复制到受管理的安装目标上。

在 npm 安装中使用 `--pin`，可将解析得到的精确 spec（`name@version`）保存到
`plugins.installs` 中，同时保留默认行为为非固定版本。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、`plugins.installs`、
插件 allowlist，以及相关联的 `plugins.load.paths` 条目中移除插件记录。
对于活动中的 memory 插件，memory slot 会重置为 `memory-core`。

默认情况下，卸载还会删除活动
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

更新会应用于 `plugins.installs` 中已跟踪的安装，以及 `hooks.internal.installs` 中已跟踪的 hook 包
安装。

当你传入插件 id 时，OpenClaw 会复用该
插件已记录的安装 spec。这意味着先前保存的 dist-tag（如 `@beta`）以及固定的精确版本
会继续用于之后的 `update <id>` 运行。

对于 npm 安装，你也可以传入带 dist-tag
或精确版本的显式 npm 包 spec。OpenClaw 会将该包名解析回已跟踪的插件
记录，更新该已安装插件，并为后续基于 id 的更新记录新的 npm spec。

传入不带版本或标签的 npm 包名，也会解析回已跟踪的
插件记录。当某个插件此前被固定到精确版本，而你
想将其切回 registry 的默认发布线时，可使用这种方式。

在执行实际 npm 更新前，OpenClaw 会根据
npm registry 元数据检查已安装包的版本。如果已安装版本与记录的制品
标识已经匹配解析目标，更新将被跳过，不会进行
下载、重新安装，也不会重写 `openclaw.json`。

当存在已存储的完整性哈希且抓取到的制品哈希发生变化时，
OpenClaw 会将其视为 npm 制品漂移。交互式
`openclaw plugins update` 命令会打印期望哈希和实际哈希，并在继续前请求
确认。非交互式更新辅助流程会以失败关闭的方式终止，
除非调用方提供显式的继续策略。

`--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为
插件更新期间内置危险代码扫描误报的应急覆盖项。
它仍不会绕过插件 `before_install` 策略拦截，
也不会绕过扫描失败拦截，并且它只适用于插件更新，不适用于 hook 包更新。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度检查。显示身份、加载状态、来源、
已注册能力、hooks、工具、命令、服务、Gateway 网关方法、
HTTP 路由、策略标记、诊断信息、安装元数据、捆绑包能力，
以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件会根据它在运行时实际注册的内容进行分类：

- **plain-capability** — 一种能力类型（例如，仅提供商插件）
- **hybrid-capability** — 多种能力类型（例如，文本 + 语音 + 图像）
- **hook-only** — 只有 hooks，没有能力或外部界面
- **non-capability** — 有工具/命令/服务，但没有能力

有关能力模型的更多信息，请参阅 [Plugin shapes](/zh-CN/plugins/architecture#plugin-shapes)。

`--json` 标志会输出适用于脚本和
审计的机器可读报告。

`inspect --all` 会渲染一个覆盖整个插件集的表格，其中包含 shape、capability kinds、
compatibility notices、bundle capabilities 和 hook summary 列。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、manifest/discovery 诊断信息以及
兼容性提示。当一切正常时，它会输出 `No plugin issues
detected.`

对于缺少 `register`/`activate` 导出等模块形态故障，请使用
`OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以在
诊断输出中包含紧凑的导出形态摘要。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本地 marketplace 路径、`marketplace.json` 路径、
如 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json`
会输出解析后的来源标签，以及已解析的 marketplace manifest 和
插件条目。
