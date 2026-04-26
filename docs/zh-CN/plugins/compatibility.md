---
read_when:
    - 你维护一个 OpenClaw 插件
    - 你看到了一个插件兼容性警告
    - 你正在规划一次插件 SDK 或清单迁移
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-04-26T10:21:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663d250c15f50698596b83ce2f70c4ba0c24c54cbfd7d588fdb3c72573e9ad30
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw 会通过具名兼容性适配器继续保留较旧的插件契约接线，然后才会移除它们。这样可以在 SDK、清单、设置、配置和智能体运行时契约演进的过程中，保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约会在核心注册表 `src/plugins/compat/registry.ts` 中进行跟踪。

每条记录包含：

- 稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 归属方：SDK、配置、设置、渠道、提供商、插件执行、智能体运行时或核心
- 适用时的引入日期和弃用日期
- 替代方案指引
- 覆盖旧行为和新行为的文档、诊断信息和测试

该注册表是维护者规划和未来插件检查器检查的来源。如果某个面向插件的行为发生变化，请在添加适配器的同一次变更中添加或更新兼容性记录。

## 插件检查器包

插件检查器应位于 OpenClaw 核心仓库之外，作为一个独立的包/仓库，并以带版本的兼容性契约和清单契约为基础。

首日 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单/模式校验
- 正在检查的契约兼容性版本
- 安装/来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中使用稳定的机器可读输出时，请使用 `--json`。OpenClaw 核心应暴露检查器可消费的契约和夹具，但不应从主 `openclaw` 包发布检查器二进制文件。

## 弃用策略

OpenClaw 不应在引入替代方案的同一版本中移除已文档化的插件契约。

迁移顺序如下：

1. 添加新契约。
2. 通过具名兼容性适配器继续保留旧行为接线。
3. 当插件作者可以采取行动时，发出诊断信息或警告。
4. 记录替代方案和时间线。
5. 同时测试旧路径和新路径。
6. 等待已公布的迁移窗口结束。
7. 仅在获得明确的破坏性版本发布批准后才移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接，以及最晚不超过警告开始后三个月的最终移除日期。不要添加一个移除窗口无限期开放的已弃用兼容路径，除非维护者明确决定这是永久兼容性，并将其标记为 `active`。

## 当前兼容性领域

当前兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅钩子插件形态和 `before_agent_start`
- 旧版 `activate(api)` 插件入口点，在插件迁移到 `register(api)` 期间继续保留
- 旧版 SDK 别名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 状态构建器、`openclaw/plugin-sdk/test-utils`，以及 `ClawdbotConfig` 类型别名
- 内置插件允许列表和启用行为
- 旧版提供商/渠道环境变量清单元数据
- 旧版提供商插件钩子和类型别名，在提供商迁移到显式目录、认证、思考、重放和传输钩子期间继续保留
- 旧版运行时别名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession` 和 `api.runtime.stt`
- 旧版 memory 插件拆分注册，在 memory 插件迁移到 `registerMemoryCapability` 期间继续保留
- 旧版渠道 SDK 帮助器，用于原生消息模式、提及门控、入站信封格式化和审批能力嵌套
- 正在由清单贡献归属替代的激活提示
- `setup-api` 运行时回退，在设置描述符迁移到冷路径 `setup.requiresRuntime: false` 元数据期间继续保留
- 提供商 `discovery` 钩子，在提供商目录钩子迁移到 `catalog.run(...)` 期间继续保留
- 渠道 `showConfigured` / `showInSetup` 元数据，在渠道包迁移到 `openclaw.channel.exposure` 期间继续保留
- 旧版运行时策略配置键，在 Doctor 将操作员迁移到 `agentRuntime` 期间继续保留
- 生成的内置渠道配置元数据回退，在注册表优先的 `channelConfigs` 元数据落地期间继续保留
- 持久化插件注册表禁用和安装迁移环境变量标志，在修复流程将操作员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix` 期间继续保留

新的插件代码应优先使用注册表和具体迁移指南中列出的替代方案。现有插件可以继续使用兼容路径，直到文档、诊断信息和发行说明公布移除窗口。

## 发行说明

发行说明应包含即将到来的插件弃用项，并附带目标日期和迁移文档链接。这个警告必须在某条兼容路径转为 `removal-pending` 或 `removed` 之前发出。
