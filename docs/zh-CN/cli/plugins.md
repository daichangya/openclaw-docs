---
read_when:
    - 你想要安装或管理 Gateway 网关插件或兼容的捆绑包。
    - 你想要调试插件加载失败问题。
summary: '`openclaw plugins` 的 CLI 参考（list、install、marketplace、uninstall、enable/disable、doctor）'
title: 插件
x-i18n:
    generated_at: "2026-04-25T21:53:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c8abd8c8faf9fbbe1e586a94d5a84848b03746bff05fdac35ffd47032dda292
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

OpenClaw 附带了一些内置插件。其中有些默认启用（例如内置模型提供商、内置语音提供商以及内置浏览器插件）；另一些则需要执行 `plugins enable`。

原生 OpenClaw 插件必须提供 `openclaw.plugin.json`，并包含内联 JSON Schema（`configSchema`，即使为空也必须提供）。兼容的捆绑包则改用它们自己的 bundle manifest。

`plugins list` 会显示 `Format: openclaw` 或 `Format: bundle`。详细的 list/info 输出还会显示 bundle 子类型（`codex`、`claude` 或 `cursor`）以及检测到的 bundle 能力。

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

裸包名会先在 ClawHub 中检查，然后再检查 npm。安全说明：应将插件安装视为运行代码。建议优先使用固定版本。

如果你的 `plugins` 部分由单文件 `$include` 提供支持，那么 `plugins install/update/enable/disable/uninstall` 会直接写入该被包含文件，而不会修改 `openclaw.json`。根级 include、include 数组以及带有同级覆盖项的 include 会以失败关闭方式处理，而不是被展平。支持的形态请参见 [Config includes](/zh-CN/gateway/configuration)。

如果配置无效，`plugins install` 通常会以失败关闭方式终止，并提示你先运行 `openclaw doctor --fix`。唯一有文档说明的例外是一个范围很窄的内置插件恢复路径，仅适用于显式启用了 `openclaw.install.allowInvalidConfigRecovery` 的插件。

`--force` 会复用现有安装目标，并原地覆盖一个已安装的插件或 hook 包。当你有意使用新的本地路径、归档文件、ClawHub 包或 npm 制品重新安装同一 id 时，请使用它。对于已跟踪的 npm 插件的常规升级，优先使用 `openclaw plugins update <id-or-npm-spec>`。

如果你对一个已经安装的插件 id 运行 `plugins install`，OpenClaw 会停止，并引导你在正常升级时使用 `plugins update <id-or-npm-spec>`；如果你确实想从不同来源覆盖当前安装，则使用 `plugins install <package> --force`。

`--pin` 仅适用于 npm 安装。它不支持与 `--marketplace` 一起使用，因为 marketplace 安装会持久化 marketplace 来源元数据，而不是 npm spec。

`--dangerously-force-unsafe-install` 是用于处理内置危险代码扫描器误报的紧急开关。即使内置扫描器报告了 `critical` 级发现，它也允许安装继续进行，但它**不会**绕过插件 `before_install` hook 策略阻止，也**不会**绕过扫描失败。

这个 CLI 标志适用于插件 install/update 流程。由 Gateway 网关支持的 Skills 依赖安装使用对应的 `dangerouslyForceUnsafeInstall` 请求覆盖，而 `openclaw skills install` 仍然是单独的 ClawHub Skills 下载/安装流程。

`plugins install` 也是暴露 `openclaw.hooks` 于 `package.json` 中的 hook 包的安装入口。要查看筛选后的 hook 可见性和按 hook 启用，请使用 `openclaw hooks`，而不是用它来安装包。

npm spec **仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git/URL/file spec 和 semver 范围会被拒绝。为保证安全，依赖安装会在项目本地使用 `--ignore-scripts` 运行，即使你的 shell 配置了全局 npm 安装设置也是如此。

裸 spec 和 `@latest` 会保持在稳定轨道上。如果 npm 将二者中的任意一种解析为预发布版本，OpenClaw 会停止，并要求你显式选择加入，例如使用预发布标签 `@beta`/`@rc`，或精确的预发布版本，如 `@1.2.3-beta.4`。

如果一个裸安装 spec 与某个内置插件 id 匹配（例如 `diffs`），OpenClaw 会直接安装该内置插件。若要安装同名的 npm 包，请使用显式的带作用域 spec（例如 `@scope/diffs`）。

支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。

也支持 Claude marketplace 安装。

ClawHub 安装使用显式的 `clawhub:<package>` 定位符：

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw 现在也会优先为裸的 npm-safe 插件 spec 使用 ClawHub。只有当 ClawHub 没有该包或版本时，它才会回退到 npm：

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw 会从 ClawHub 下载包归档，检查其声明的插件 API / 最低 gateway 兼容性，然后通过常规归档路径进行安装。已记录的安装会保留其 ClawHub 来源元数据，以便后续更新。

当 marketplace 名称存在于 Claude 的本地 registry 缓存 `~/.claude/plugins/known_marketplaces.json` 中时，可使用 `plugin@marketplace` 简写：

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
- GitHub 仓库简写，例如 `owner/repo`
- GitHub 仓库 URL，例如 `https://github.com/owner/repo`
- git URL

对于从 GitHub 或 git 加载的远程 marketplace，插件条目必须保留在克隆后的 marketplace 仓库内部。OpenClaw 接受来自该仓库的相对路径来源，并拒绝远程 manifest 中的 HTTP(S)、绝对路径、git、GitHub 及其他非路径插件来源。

对于本地路径和归档文件，OpenClaw 会自动检测：

- 原生 OpenClaw 插件（`openclaw.plugin.json`）
- Codex 兼容捆绑包（`.codex-plugin/plugin.json`）
- Claude 兼容捆绑包（`.claude-plugin/plugin.json` 或默认 Claude 组件布局）
- Cursor 兼容捆绑包（`.cursor-plugin/plugin.json`）

兼容捆绑包会安装到常规插件根目录中，并参与相同的 list/info/enable/disable 流程。目前，bundle Skills、Claude command-skills、Claude `settings.json` 默认值、Claude `.lsp.json` / manifest 声明的 `lspServers` 默认值、Cursor command-skills 以及兼容的 Codex hook 目录均已支持；其他检测到的 bundle 能力会显示在诊断/info 中，但尚未接入运行时执行。

### 列表

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

使用 `--enabled` 仅显示已启用的插件。使用 `--verbose` 可从表格视图切换为每个插件的详细行，其中包含 source/origin/version/activation 元数据。使用 `--json` 可获取适用于机器读取的清单以及 registry 诊断信息。

`plugins list` 会先读取持久化的本地插件 registry；如果 registry 缺失或无效，则回退为仅基于 manifest 推导的结果。它适合用来检查某个插件是否已安装、已启用，以及在冷启动规划中是否可见，但它不是对已运行 Gateway 网关进程的实时运行时探测。在更改插件代码、启用状态、hook 策略或 `plugins.load.paths` 后，需重启为该渠道提供服务的 Gateway 网关，之后新 `register(api)` 代码或 hook 才会运行。对于远程/容器部署，请确认你重启的是真正的 `openclaw gateway run` 子进程，而不只是一个包装进程。

对于运行时 hook 调试：

- `openclaw plugins inspect <id> --json` 会显示来自模块加载检查过程的已注册 hook 和诊断信息。
- `openclaw gateway status --deep --require-rpc` 会确认可访问的 Gateway 网关、服务/进程提示、配置路径以及 RPC 健康状态。
- 非内置的会话 hook（`llm_input`、`llm_output`、`agent_end`）要求 `plugins.entries.<id>.hooks.allowConversationAccess=true`。

使用 `--link` 可避免复制本地目录（会添加到 `plugins.load.paths`）：

```bash
openclaw plugins install -l ./my-plugin
```

`--force` 不支持与 `--link` 一起使用，因为链接安装会复用源路径，而不是覆盖一个受管安装目标。

在 npm 安装中使用 `--pin`，可以把解析后的精确 spec（`name@version`）保存到受管安装 ledger 中，同时保留默认的非固定行为。

### 安装台账

插件安装元数据是机器管理状态，不是用户配置。新的安装和更新会将其写入活动 OpenClaw 状态目录下的 `plugins/installs.json`。该文件包含“请勿手动编辑”的警告，并被 `openclaw plugins update`、卸载、诊断以及冷插件 registry 使用。

`openclaw.json` 中旧版的 `plugins.installs` 条目仍可读取，作为已弃用的兼容性回退。当 install/update/uninstall 路径重写插件安装状态时，OpenClaw 会写入 ledger 文件，并从持久化配置负载中移除 `plugins.installs`。

### 卸载

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 会从 `plugins.entries`、受管安装 ledger、插件 allowlist，以及适用时的已链接 `plugins.load.paths` 条目中移除插件记录。
对于活动中的 memory 插件，memory 插槽会重置为 `memory-core`。

默认情况下，卸载还会删除活动 state-dir 插件根目录下的插件安装目录。使用
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

更新适用于受管安装 ledger 中已跟踪的插件安装，以及 `hooks.internal.installs` 中已跟踪的 hook-pack 安装。

当你传入一个插件 id 时，OpenClaw 会复用为该插件记录的安装 spec。这意味着先前存储的 dist-tag（如 `@beta`）和精确固定版本，在后续执行 `update <id>` 时仍会继续使用。

对于 npm 安装，你也可以传入带有 dist-tag 或精确版本的显式 npm package spec。OpenClaw 会将该包名解析回已跟踪的插件记录，更新那个已安装插件，并记录新的 npm spec，以供未来基于 id 的更新使用。

传入不带版本或标签的 npm 包名，同样会解析回已跟踪的插件记录。当某个插件被固定到精确版本，而你想让它回到 registry 的默认发布线路时，可使用这种方式。

在执行实时 npm 更新之前，OpenClaw 会根据 npm registry 元数据检查已安装的包版本。如果已安装版本和记录的制品身份已与解析出的目标一致，则会跳过更新，不会下载、重新安装，也不会重写 `openclaw.json`。

当已存储完整性哈希且拉取到的制品哈希发生变化时，OpenClaw 会将其视为 npm 制品漂移。交互式 `openclaw plugins update` 命令会打印预期哈希和实际哈希，并在继续前请求确认。非交互式更新辅助流程会以失败关闭方式终止，除非调用方提供显式的继续策略。

`--dangerously-force-unsafe-install` 也可用于 `plugins update`，作为插件更新期间内置危险代码扫描误报的紧急覆盖开关。它仍然不会绕过插件 `before_install` 策略阻止或扫描失败阻止，并且它仅适用于插件更新，不适用于 hook-pack 更新。

### 检查

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

对单个插件进行深度检查。显示身份、加载状态、来源、已注册能力、hooks、工具、命令、服务、gateway 方法、HTTP 路由、策略标志、诊断信息、安装元数据、bundle 能力，以及任何检测到的 MCP 或 LSP 服务器支持。

每个插件都会根据它在运行时实际注册的内容进行分类：

- **plain-capability** — 一种能力类型（例如仅 provider 的插件）
- **hybrid-capability** — 多种能力类型（例如文本 + 语音 + 图像）
- **hook-only** — 仅有 hooks，没有能力或表面
- **non-capability** — 有工具/命令/服务，但没有能力

关于能力模型的更多内容，请参见 [Plugin shapes](/zh-CN/plugins/architecture#plugin-shapes)。

`--json` 标志会输出适合脚本和审计使用的机器可读报告。

`inspect --all` 会渲染一个全量表格，其中包含 shape、能力种类、兼容性提示、bundle 能力和 hook 摘要列。

`info` 是 `inspect` 的别名。

### Doctor

```bash
openclaw plugins doctor
```

`doctor` 会报告插件加载错误、manifest/设备发现诊断信息以及兼容性提示。当一切正常时，它会打印 `No plugin issues detected.`。

对于缺少 `register`/`activate` 导出这类模块形态失败，请在重新运行时设置 `OPENCLAW_PLUGIN_LOAD_DEBUG=1`，以便在诊断输出中包含紧凑的导出形态摘要。

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

本地插件 registry 是 OpenClaw 持久化的冷读取模型，用于保存已安装插件的身份、启用状态、来源元数据和贡献归属。
正常启动、provider 所有者查找、channel 设置分类和插件清单都可以在不导入插件运行时模块的情况下读取它。

使用 `plugins registry` 可检查持久化 registry 是否存在、是否最新或是否已过期。使用 `--refresh` 可根据持久安装 ledger、配置策略以及 manifest/package 元数据重新构建它。这是修复路径，不是运行时激活路径。

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` 是一个已弃用的紧急兼容性开关，用于处理 registry 读取失败。优先使用 `plugins registry --refresh` 或 `openclaw doctor --fix`；这个环境变量回退仅用于迁移发布期间的紧急启动恢复。

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list 接受本地 marketplace 路径、`marketplace.json` 路径、如 `owner/repo` 这样的 GitHub 简写、GitHub 仓库 URL，或 git URL。`--json` 会打印解析后的来源标签，以及已解析的 marketplace manifest 和插件条目。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [构建插件](/zh-CN/plugins/building-plugins)
- [社区插件](/zh-CN/plugins/community)
