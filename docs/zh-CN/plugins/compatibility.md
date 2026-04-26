---
read_when:
    - 你在维护一个 OpenClaw 插件。
    - 你看到了插件兼容性警告。
    - 你正在规划插件 SDK 或清单迁移。
summary: 插件兼容性契约、弃用元数据和迁移预期
title: 插件兼容性
x-i18n:
    generated_at: "2026-04-26T07:50:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b015e39981aab5e055529b72eb07e303116d6a6b5e583d2cd6a0273335669b1
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw 会在移除旧插件契约之前，先通过具名兼容性适配器继续接入这些旧契约。这样在 SDK、清单、设置、配置和 Agent Runtimes 契约演进期间，可以保护现有的内置插件和外部插件。

## 兼容性注册表

插件兼容性契约会在核心注册表 `src/plugins/compat/registry.ts` 中进行跟踪。

每条记录都包含：

- 一个稳定的兼容性代码
- 状态：`active`、`deprecated`、`removal-pending` 或 `removed`
- 归属方：SDK、配置、设置、渠道、提供商、插件执行、Agent Runtimes 或 core
- 适用时的引入日期和弃用日期
- 替代方案指引
- 覆盖旧行为和新行为的文档、诊断信息和测试

该注册表是维护者规划和未来插件检查器检查的依据。如果插件面向的行为发生变化，请在添加适配器的同一变更中添加或更新兼容性记录。

## 插件检查器包

插件检查器应位于 OpenClaw core 仓库之外，作为一个单独的包/代码仓库，并以带版本的兼容性契约和清单契约为基础。

首日 CLI 应为：

```sh
openclaw-plugin-inspector ./my-plugin
```

它应输出：

- 清单/schema 验证
- 正在检查的契约兼容性版本
- 安装/来源元数据检查
- 冷路径导入检查
- 弃用和兼容性警告

在 CI 注释中使用稳定的机器可读输出时，请使用 `--json`。OpenClaw core 应公开检查器可使用的契约和夹具，但不应从主 `openclaw` 包中发布该检查器二进制文件。

## 弃用策略

OpenClaw 不应在引入替代方案的同一版本中移除已文档化的插件契约。

迁移顺序如下：

1. 添加新契约。
2. 通过具名兼容性适配器保留旧行为接入。
3. 在插件作者可以采取行动时发出诊断信息或警告。
4. 记录替代方案和时间线。
5. 对旧路径和新路径都进行测试。
6. 等待已公告的迁移窗口期结束。
7. 仅在获得明确的破坏性发布批准后再移除。

已弃用记录必须包含警告开始日期、替代方案、文档链接，以及已知时的目标移除日期。

## 当前兼容性领域

当前兼容性记录包括：

- 旧版宽泛 SDK 导入，例如 `openclaw/plugin-sdk/compat`
- 旧版仅 hook 的插件形态和 `before_agent_start`
- 内置插件允许列表和启用行为
- 旧版 provider/channel 环境变量清单元数据
- 正在由清单贡献归属替代的激活提示
- 在 Doctor 将运维人员迁移到 `agentRuntime` 期间保留的旧版运行时策略配置键
- 在 registry-first 的 `channelConfigs` 元数据落地期间，生成的内置渠道配置元数据后备逻辑
- 在修复流程将运维人员迁移到 `openclaw plugins registry --refresh` 和 `openclaw doctor --fix` 期间，持久化的插件注册表禁用环境变量

新插件代码应优先使用注册表和特定迁移指南中列出的替代方案。现有插件可以继续使用兼容路径，直到文档、诊断信息和发布说明公告移除窗口期。

## 发布说明

发布说明应包含即将到来的插件弃用项，并附上目标日期和迁移文档链接。这个警告必须在兼容路径进入 `removal-pending` 或 `removed` 之前发出。
