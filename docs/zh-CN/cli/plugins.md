---
read_when:
    - 你想要安装或管理 Gateway 网关插件或兼容的捆绑包
    - 你想要调试插件加载失败问题
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-04-25T17:39:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ae8f71873fb90dc7acde2ac522228cc60603ba34322e5b6d031e8de7545684e
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

管理 Gateway 网关插件、hook 包和兼容的捆绑包。

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
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

内置插件会随 OpenClaw 一起提供。其中一些默认启用（例如内置模型提供商、内置语音提供商，以及内置浏览器插件）；另一些则需要运行 `plugins enable`。

原生 OpenClaw 插件必须提供 `openclaw.plugin.json`，并包含内联 JSON Schema（`configSchema`，即使为空也需要）。兼容捆绑包则改为使用它们自己的 bundle manifest。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细 list/info 输出还会显示捆绑包子类型（`codex`、`claude` 或 `cursor`）以及检测到的捆绑包能力。

### 安装

```bash
openclaw plugins install <package>                      # 先尝试 ClawHub，再尝试 npm
openclaw plugins install clawhub:<package>              # 仅使用 ClawHub
openclaw plugins install <package> --force              # 覆盖现有安装
openclaw plugins install <package> --pin                # 固定版本
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # 本地路径
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace（显式指定）
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

裸包名会先在 ClawHub 中检查，然后再查 npm。安全提示：安装插件应被视为运行代码。建议优先使用固定版本。

如果你的 `plugins` 部分由单文件 `$include` 提供支持，那么 `plugins install/update/enable/disable/uninstall` 会直接写入该被包含文件，而不会修改 `openclaw.json`。根级 include、include 数组，以及带有同级覆盖项的 include 都会以失败关闭的方式处理，而不会被展平。支持的形式见 [配置 includes](/zh-CN/gateway/configuration)。

如果配置无效，`plugins install` 通常会以失败关闭的方式终止，并提示你先运行 `openclaw doctor --fix`。唯一有文档说明的例外，是一条针对明确选择加入 `openclaw.install.allowInvalidConfigRecovery` 的插件的狭义内置插件恢复路径。

`--force` 会复用现有安装目标，并原地覆盖已安装的插件或 hook 包。当你有意从新的本地路径、归档文件、ClawHub 包或 npm 构件重新安装相同 id 时，应使用它。对于已被跟踪的 npm 插件的常规升级，更推荐使用 `openclaw plugins update <id-or-npm-spec>`。

如果你对一个已经安装的插件 id 运行 `plugins install`，OpenClaw 会停止并提示你：正常升级请使用 `plugins update <id-or-npm-spec>`；如果你确实想从不同来源覆盖当前安装，则使用 `plugins install <package> --force`。

`--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是一个用于应对内置危险代码扫描器误报的破窗选项。即使内置扫描器报告了 `critical` 级别发现，它也允许安装继续进行，但它**不会**绕过插件 `before_install` hook 策略阻止，也**不会**绕过扫描失败。

这个 CLI 标志适用于插件 install/update 流程。由 Gateway 网关支持的 Skills 依赖安装会使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖项，而 `openclaw skills install` 仍然是单独的 ClawHub Skills 下载/安装流程。

`plugins install` 也是暴露 `openclaw.hooks` 于 `package.json` 中的 hook 包的安装入口。请使用 `openclaw hooks` 查看经过筛选的 hook 可见性以及按 hook 启用，而不是用于包安装。

npm spec **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file spec 和 semver 范围都会被拒绝。出于安全考虑，依赖安装会使用 `--ignore-scripts` 运行。

裸 spec 和 `@latest` 会停留在稳定发布轨道上。如果 npm 将这两者中的任一解析为预发布版本，OpenClaw 会停止并要求你显式选择加入，例如使用 `@beta`/`@rc` 这样的预发布标签，或 `@1.2.3-beta.4` 这样的精确预发布版本。

如果一个裸安装 spec 与某个内置插件 id 匹配（例如 `diffs`），OpenClaw 会直接安装该内置插件。若要安装同名 npm 包，请使用显式的带作用域 spec（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

也支持 Claude marketplace 安装。

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在对于符合 npm 安全要求的裸插件 spec 也会优先使用 ClawHub。只有当 ClawHub 中没有该包或该版本时，它才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载包归档，检查已声明的插件 API / 最低 Gateway 网关兼容性，然后通过常规归档路径安装。记录下来的安装会保留其 ClawHub 来源元数据，供后续更新使用。

当 marketplace 名称存在于 Claude 的本地 registry 缓存 `~/.claude/plugins/known_marketplaces.json` 中时，可使用 `plugin@marketplace` 简写：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

当你想显式传入 marketplace 来源时，请使用 `--marketplace`：

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace 来源可以是：

- `~/.claude/plugins/known_marketplaces.json` 中的 Claude 已知 marketplace 名称
- 本地 marketplace 根目录或 `marketplace.json` 路径
- 形如 `owner/repo` 的 GitHub 仓库简写
- 形如 `https://github.com/owner/repo` 的 GitHub 仓库 URL
- git URL

对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保持在克隆得到的 marketplace 仓库内部。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程 manifest 中的 HTTP(S)、绝对路径、git、GitHub 以及其他非路径类插件来源。

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- 与 Codex 兼容的捆绑包（`.codex-plugin/plugin.json`）
- 与 Claude 兼容的捆绑包（`.claude-plugin/plugin.json` 或默认的 Claude 组件布局）
- 与 Cursor 兼容的捆绑包（`.cursor-plugin/plugin.json`）

兼容捆绑包会安装到常规插件根目录中，并参与相同的 list/info/enable/disable 流程。目前已支持 bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / manifest 声明的 `lspServers` 默认值、Cursor command-skills，以及兼容的 Codex hook 目录；其他已检测到的捆绑包能力会显示在 diagnostics/info 中，但尚未接入运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已启用的插件。使用 `--verbose` 可从表格视图切换为逐插件详细信息行，展示 source/origin/version/activation 元数据。使用 `--json` 获取机器可读的清单以及 registry diagnostics。

`plugins list` 会先读取持久化的本地插件 registry；如果 registry 缺失或无效，则回退为仅基于 manifest 推导的结果。它适合用于检查某个插件是否已安装、已启用，以及在冷启动规划中是否可见，但它并不是对已运行 Gateway 网关进程的实时运行时探测。更改插件代码、启用状态、hook 策略或 `plugins.load.paths` 后，在期望新的 `register(api)` 代码或 hook 开始生效之前，请重启为该渠道提供服务的 Gateway 网关。对于远程/容器部署，请确认你重启的是真正的 `openclaw gateway run` 子进程，而不只是一个包装进程。

对于运行时 hook 调试：

- `openclaw plugins inspect <id> --json` 会显示来自模块加载检查过程的已注册 hook 和 diagnostics
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关、service/process 提示、配置路径和 RPC 健康状态
- 非内置的对话 hook（`llm_input`、`llm_output`、`agent_end`）要求设置 `plugins.entries.<id>.hooks.allowConversationAccess=true`

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是复制到受管理的安装目标上。

在 npm 安装中使用 `--pin`，可将解析出的精确 spec（`name@version`）保存到 `plugins.installs`，同时保留默认行为的不固定版本模式。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、`plugins.installs`、插件 allowlist，以及相关的已链接 `plugins.load.paths` 条目中删除插件记录。对于处于激活状态的 memory 插件，memory 插槽会重置为 `memory-core`。

默认情况下，卸载还会删除活动 state-dir 插件根目录下的插件安装目录。使用 `--keep-files` 可保留磁盘上的文件。

`--keep-config` 仍受支持，但作为 `--keep-files` 的已弃用别名。

### 更新

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

更新会应用于 `plugins.installs` 中已跟踪的安装，以及 `hooks.internal.installs` 中已跟踪的 hook 包安装。

当你传入插件 id 时，OpenClaw 会复用该插件记录下来的安装 spec。这意味着先前保存的 dist-tag（例如 `@beta`）和精确固定版本，在后续运行 `update <id>` 时仍会继续使用。

对于 npm 安装，你也可以传入带 dist-tag 或精确版本的显式 npm package spec。OpenClaw 会将该包名重新解析回已跟踪的插件记录，更新对应已安装插件，并为将来基于 id 的更新记录新的 npm spec。

传入不带版本或标签的 npm 包名，也会重新解析回已跟踪的插件记录。当某个插件被固定到精确版本，而你想将其切回 registry 默认发布线时，可使用这种方式。

在执行实际 npm 更新之前，OpenClaw 会根据 npm registry 元数据检查已安装包版本。如果已安装版本和已记录的构件标识与解析出的目标已经一致，则会跳过更新，不会下载、重新安装，也不会改写 `openclaw.json`。

当存在已存储的完整性哈希，而获取到的构件哈希发生变化时，OpenClaw 会将其视为 npm 构件漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续之前请求确认。非交互式更新辅助工具会以失败关闭的方式终止，除非调用方提供了显式的继续策略。

`--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为在插件更新期间应对内置危险代码扫描误报的破窗覆盖项。它仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止，并且它仅适用于插件更新，不适用于 hook 包更新。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

针对单个插件的深度检查。会显示身份、加载状态、来源、已注册能力、hooks、工具、命令、服务、gateway 方法、HTTP 路由、策略标志、diagnostics、安装元数据、捆绑包能力，以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件都会根据其在运行时实际注册的内容进行分类：

- **plain-capability** — 一种能力类型（例如仅 provider 的插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 只有 hooks，没有能力或其他 surface
- **non-capability** — 有工具/命令/服务，但没有能力

有关能力模型的更多信息，请参见 [插件形态](/zh-CN/plugins/architecture#plugin-shapes)。

`--json` 标志会输出适合脚本处理和审计的机器可读报告。

`inspect --all` 会渲染一个面向整个插件集合的表格，其中包含 shape、capability kinds、兼容性提示、捆绑包能力和 hook 摘要列。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、manifest/设备发现 diagnostics，以及兼容性提示。当一切正常时，它会打印 `No plugin issues detected.`。

对于缺少 `register`/`activate` 导出之类的模块形态失败，请使用 `OPENCLAW_PLUGIN_LOAD_DEBUG=1` 重新运行，以便在诊断输出中包含紧凑的导出形态摘要。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件 registry 是 OpenClaw 针对已安装插件身份、启用状态、来源元数据和贡献归属关系的持久化冷读取模型。正常启动、provider 所有者查找、渠道设置分类以及插件清单都可以在不导入插件运行时模块的情况下读取它。

使用 `plugins registry` 可检查持久化 registry 是否存在、是否为最新，或是否已过期。使用 `--refresh` 可根据持久化安装账本、配置策略以及 manifest/package 元数据重建它。这是一条修复路径，而不是运行时激活路径。

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的破窗兼容性开关，用于处理 registry 读取失败。更推荐使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；这个环境变量回退仅用于迁移发布期间的紧急启动恢复。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本地 marketplace 路径、`marketplace.json` 路径、形如 `owner/repo` 的 GitHub 简写、GitHub 仓库 URL 或 git URL。`--json` 会打印解析后的来源标签，以及已解析的 marketplace manifest 和插件条目。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [构建插件](/zh-CN/plugins/building-plugins)
- [社区插件](/zh-CN/plugins/community)
