---
read_when:
    - 你想安装或管理 Gateway 网关插件或兼容的捆绑包
    - 你想调试插件加载失败问题
summary: '`openclaw plugins` 的 CLI 设置参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-04-23T06:40:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80e324995fa2dbb5babb9631714eb2449a1c8c00411bf6bf44c4c74bc9a3e2b8
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

管理 Gateway 网关插件、hook 包和兼容捆绑包。

相关内容：

- 插件系统：[Plugins](/zh-CN/tools/plugin)
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

内置插件随 OpenClaw 一起发布。其中一些默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）；另一些则需要运行 `plugins enable`。

原生 OpenClaw 插件必须随附 `openclaw.plugin.json`，并包含内联 JSON Schema（`configSchema`，即使为空也需要提供）。兼容捆绑包则改用它们自己的 bundle manifest。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细列表 / 信息输出还会显示 bundle 子类型（`codex`、`claude` 或 `cursor`），以及检测到的 bundle 能力。

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

裸包名会先在 ClawHub 中查找，然后再查找 npm。安全提示：请将插件安装视为执行代码。优先使用固定版本。

如果配置无效，`plugins install` 通常会以安全关闭方式失败，并提示你先运行 `openclaw doctor --fix`。唯一有文档说明的例外，是一个针对内置插件的窄范围恢复路径，用于那些显式选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件。

`--force` 会复用现有安装目标，并原地覆盖已安装的插件或 hook 包。当你明确要从新的本地路径、归档、ClawHub 包或 npm 制品重新安装同一 id 时，请使用它。对于已跟踪 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

`--pin` 仅适用于 npm 安装。不支持与 `--marketplace` 一起使用，因为 marketplace 安装会保存 marketplace 源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是一个紧急兜底选项，用于处理内置危险代码扫描器的误报。即使内置扫描器报告 `critical` 级发现，它也允许继续安装，但它**不会**绕过插件 `before_install` hook 的策略阻止，也**不会**绕过扫描失败。

这个 CLI 标志适用于插件 install / update 流程。由 Gateway 网关支持的技能依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而 `openclaw skills install` 仍然是独立的 ClawHub Skills 下载 / 安装流程。

`plugins install` 也是暴露了 `openclaw.hooks` 的 hook 包在 `package.json` 中的安装入口。请使用 `openclaw hooks` 来查看经过筛选的 hook 可见性以及按 hook 启用，而不是用于包安装。

npm spec **仅支持 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git / URL / file spec 和 semver 范围都会被拒绝。为确保安全，依赖安装会使用 `--ignore-scripts` 运行。

裸 spec 和 `@latest` 会停留在稳定轨道上。如果 npm 将其中任一项解析为预发布版本，OpenClaw 会停止，并要求你通过预发布 tag（例如 `@beta` / `@rc`）或精确的预发布版本（例如 `@1.2.3-beta.4`）显式选择加入。

如果一个裸安装 spec 与某个内置插件 id 匹配（例如 `diffs`），OpenClaw 会直接安装该内置插件。若要安装同名的 npm 包，请使用显式的带作用域 spec（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

也支持 Claude marketplace 安装。

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先为裸 npm-safe 插件 spec 使用 ClawHub。只有当 ClawHub 中没有该包或该版本时，才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载包归档，检查声明的插件 API / 最低 Gateway 网关兼容性，然后通过常规归档路径安装。已记录的安装会保留其 ClawHub 源元数据，以便后续更新。

当 marketplace 名称存在于 Claude 的本地注册表缓存 `~/.claude/plugins/known_marketplaces.json` 中时，可使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

如果你想显式传递 marketplace 源，请使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace 源可以是：

- `~/.claude/plugins/known_marketplaces.json` 中 Claude 已知 marketplace 名称
- 本地 marketplace 根目录或 `marketplace.json` 路径
- GitHub 仓库简写，例如 `owner/repo`
- GitHub 仓库 URL，例如 `https://github.com/owner/repo`
- git URL

对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保持在克隆后的 marketplace 仓库内。OpenClaw 接受来自该仓库的相对路径源，并拒绝远程 manifest 中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径插件源。

对于本地路径和归档，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容捆绑包（`.codex-plugin/plugin.json`）
- Claude 兼容捆绑包（`.claude-plugin/plugin.json` 或默认的 Claude 组件布局）
- Cursor 兼容捆绑包（`.cursor-plugin/plugin.json`）

兼容捆绑包会安装到常规插件根目录中，并参与相同的 list / info / enable / disable 流程。目前，已支持 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / manifest 声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录；其他已检测到的 bundle 能力会在诊断 / 信息中显示，但尚未接入运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已加载的插件。使用 `--verbose` 可从表格视图切换到按插件显示的详细行，其中包含 source / origin / version / activation 元数据。使用 `--json` 可获取机器可读的清单以及注册表诊断信息。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是复制到受管安装目标上。

在 npm 安装中使用 `--pin`，可将解析出的精确 spec（`name@version`）保存到 `plugins.installs` 中，同时保持默认行为为不固定版本。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、`plugins.installs`、插件 allowlist，以及在适用时的已链接 `plugins.load.paths` 条目中移除插件记录。对于活动中的 memory 插件，memory 槽位会重置为 `memory-core`。

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

更新会应用于 `plugins.installs` 中跟踪的安装，以及 `hooks.internal.installs` 中跟踪的 hook 包安装。

当你传入插件 id 时，OpenClaw 会复用为该插件记录的安装 spec。这意味着此前保存的 dist-tag（例如 `@beta`）和固定的精确版本，之后在运行 `update <id>` 时仍会继续使用。

对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm 包 spec。OpenClaw 会将该包名回溯解析到已跟踪的插件记录，更新那个已安装插件，并为将来基于 id 的更新记录新的 npm spec。

仅传入不带版本或 tag 的 npm 包名，也会回溯解析到已跟踪的插件记录。当某个插件被固定到精确版本，而你想把它移回 registry 的默认发布线时，可使用这种方式。

在实际执行 npm 更新之前，OpenClaw 会将已安装包版本与 npm registry 元数据进行检查。如果已安装版本与记录的制品标识已经匹配解析出的目标版本，则会跳过更新，不会下载、重新安装，也不会重写 `openclaw.json`。

当存在已存储的完整性哈希，而获取到的制品哈希发生变化时，OpenClaw 会将其视为 npm 制品漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助流程会以安全关闭方式失败，除非调用方提供显式的继续策略。

`--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为处理插件更新期间内置危险代码扫描误报的紧急覆盖项。它仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止，并且只适用于插件更新，不适用于 hook 包更新。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度检查。显示标识、加载状态、来源、已注册能力、hooks、工具、命令、服务、Gateway 网关方法、HTTP 路由、策略标志、诊断信息、安装元数据、bundle 能力，以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件都会根据其在运行时实际注册的内容进行分类：

- **plain-capability** — 一种能力类型（例如仅 provider 插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有 hooks，没有能力或表面
- **non-capability** — 有工具 / 命令 / 服务，但没有能力

有关能力模型的更多信息，请参阅 [Plugin shapes](/zh-CN/plugins/architecture#plugin-shapes)。

`--json` 标志会输出适用于脚本处理和审计的机器可读报告。

`inspect --all` 会渲染一个全局表格，其中包含 shape、capability kinds、compatibility notices、bundle capabilities 和 hook summary 列。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、manifest / 发现诊断信息以及兼容性提示。当一切正常时，它会输出 `No plugin issues detected.`

对于缺少 `register` / `activate` 导出之类的模块形状失败问题，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以便在诊断输出中包含紧凑的导出形状摘要。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本地 marketplace 路径、`marketplace.json` 路径、如 `owner/repo` 这样的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json` 会输出解析后的源标签，以及已解析的 marketplace manifest 和插件条目。
