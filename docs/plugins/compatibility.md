---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到一个插件兼容性警告
    - 你正在规划插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-04-26T11:10:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw 会在移除旧插件契约之前，通过具名兼容适配器继续接通较旧的插件契约。这样可以在 SDK、清单、设置、配置和智能体运行时契约演进期间，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约记录在核心注册表 `src/plugins/compat/registry.ts` 中。

每条记录包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 所有者：SDK、配置、设置、渠道、提供商、插件执行、智能体运行时或核心
- 适用时的引入日期和弃用日期
- 替代指引
- 覆盖旧行为和新行为的文档、诊断信息和测试

该注册表是维护者规划和未来插件检查器校验的来源。如果面向插件的行为发生变化，请在添加适配器的同一变更中添加或更新兼容性记录。

Doctor 修复和迁移兼容性会单独记录在 `src/commands/doctor/shared/deprecation-compat.ts` 中。这些记录涵盖旧配置结构、安装账本布局以及修复垫片；即使运行时兼容路径已移除，它们也可能仍需保留。

发布前的整体检查应同时检查这两个注册表。不要仅因为对应的运行时或配置兼容性记录已过期，就删除某个 Doctor 迁移；首先要确认是否仍存在需要该修复的受支持升级路径。还要在发布规划期间重新验证每条替代说明，因为随着提供商和渠道从核心中迁出，插件归属和配置范围可能会发生变化。

## 插件检查器包

插件检查器应位于核心 OpenClaw 仓库之外，作为一个独立的软件包/仓库，并以有版本控制的兼容性契约和清单契约为基础。

首日 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单/模式校验
- 正在检查的契约兼容版本
- 安装/来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中，请使用 `--json` 获取稳定的机器可读输出。OpenClaw 核心应暴露供检查器使用的契约和夹具，但不应从主 `openclaw` 包发布检查器二进制文件。

## 弃用策略

OpenClaw 不应在引入替代方案的同一版本中移除已文档化的插件契约。

迁移顺序如下：

1. 添加新契约。
2. 通过具名兼容适配器保留旧行为接通。
3. 在插件作者可以采取行动时发出诊断信息或警告。
4. 记录替代方案和时间线。
5. 测试旧路径和新路径。
6. 等待已宣布的迁移窗口结束。
7. 仅在获得明确的破坏性版本发布批准后移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接以及最终移除日期，且最终移除日期不得晚于警告开始后三个月。不要添加一个移除窗口无限期开放的已弃用兼容路径，除非维护者明确决定它是永久兼容，并将其标记为 `active`。

## 当前兼容性领域

当前兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子插件形态以及 `before_agent_start`
- 旧版 `activate(api)` 插件入口点，同时插件迁移到 `register(api)`
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 状态构建器、`openclaw/plugin-sdk/test-utils`，以及 `ClawdbotConfig` / `OpenClawSchemaType` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商/渠道环境变量清单元数据
- 旧版提供商插件钩子和类型别名，同时提供商迁移到显式的目录、认证、思考、重放和传输钩子
- 旧版运行时别名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession` 和 `api.runtime.stt`
- 旧版 memory 插件拆分注册，同时 memory 插件迁移到 `registerMemoryCapability`
- 旧版渠道 SDK 辅助工具，用于原生消息模式、提及门控、入站信封格式化和审批能力嵌套
- 正在由清单贡献归属替代的激活提示
- `setup-api` 运行时回退，同时设置描述符迁移到冷路径 `setup.requiresRuntime: false` 元数据
- 提供商 `discovery` 钩子，同时提供商目录钩子迁移到 `catalog.run(...)`
- 渠道 `showConfigured` / `showInSetup` 元数据，同时渠道包迁移到 `openclaw.channel.exposure`
- 旧版 runtime-policy 配置键，同时 Doctor 将操作员迁移到 `agentRuntime`
- 生成的内置渠道配置元数据回退，同时以注册表优先的 `channelConfigs` 元数据正在落地
- 持久化插件注册表禁用和安装迁移环境变量标记，同时修复流程将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix`
- 旧版由插件持有的 web search、web fetch 和 x_search 配置路径，同时 Doctor 将它们迁移到 `plugins.entries.<plugin>.config`
- 旧版 `plugins.installs` 手写配置和内置插件加载路径别名，同时安装元数据迁移到状态管理的插件账本中

新的插件代码应优先使用注册表和具体迁移指南中列出的替代方案。现有插件可以继续使用兼容路径，直到文档、诊断信息和发布说明宣布移除窗口。

## 发布说明

发布说明应包含即将到来的插件弃用项，并附上目标日期和迁移文档链接。必须在某个兼容路径转为 `removal-pending` 或 `removed` 之前发出该警告。
