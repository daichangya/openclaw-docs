---
read_when:
    - 你想使用 memory-wiki CLI
    - 你正在为 `openclaw wiki` 编写文档或进行更改
summary: '`openclaw wiki` 的 CLI 参考（memory-wiki vault 状态、搜索、编译、lint、应用、bridge 和 Obsidian 辅助工具）'
title: wiki
x-i18n:
    generated_at: "2026-04-23T20:45:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76289ee6732c4baaaa50dd14d97b20b454b43a2444d0eb278cf832893058a44f
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

检查并维护 `memory-wiki` vault。

由内置 `memory-wiki` 插件提供。

相关内容：

- [Memory Wiki plugin](/zh-CN/plugins/memory-wiki)
- [Memory Overview](/zh-CN/concepts/memory)
- [CLI: memory](/zh-CN/cli/memory)

## 用途

当你需要一个已编译的知识 vault，并具备以下能力时，请使用 `openclaw wiki`：

- wiki 原生搜索和页面读取
- 带丰富来源信息的综合内容
- 矛盾与新鲜度报告
- 从当前激活记忆插件导入的 bridge
- 可选的 Obsidian CLI 辅助工具

## 常用命令

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 命令

### `wiki status`

检查当前 vault 模式、健康状态以及 Obsidian CLI 可用性。

当你不确定 vault 是否已初始化、bridge 模式
是否健康，或 Obsidian 集成是否可用时，请先使用这个命令。

### `wiki doctor`

运行 wiki 健康检查，并显示配置或 vault 问题。

典型问题包括：

- 启用了 bridge 模式，但没有公开的记忆构件
- vault 布局无效或缺失
- 在预期使用 Obsidian 模式时缺少外部 Obsidian CLI

### `wiki init`

创建 wiki vault 布局和起始页面。

这会初始化根结构，包括顶层索引和缓存
目录。

### `wiki ingest <path-or-url>`

将内容导入 wiki 源层。

说明：

- URL 导入由 `ingest.allowUrlIngest` 控制
- 导入的源页面会在 frontmatter 中保留来源信息
- 启用时，导入后可自动运行编译

### `wiki compile`

重建索引、相关块、仪表板和已编译摘要。

这会将稳定的面向机器的构件写入以下位置：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，编译还会刷新报告页面。

### `wiki lint`

对 vault 执行 lint，并报告：

- 结构问题
- 来源信息缺失
- 矛盾
- 未解决问题
- 低置信度页面 / claim
- 过期页面 / claim

在对 wiki 做出有意义的更新后运行此命令。

### `wiki search <query>`

搜索 wiki 内容。

行为取决于配置：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`

当你需要 wiki 专用排序或来源信息细节时，请使用 `wiki search`。
如果你只想做一次广泛的共享 recall 搜索，而当前激活的记忆插件公开了共享搜索功能，
则优先使用 `openclaw memory search`。

### `wiki get <lookup>`

通过 id 或相对路径读取 wiki 页面。

示例：

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

应用狭义变更，而不是自由形式地修改页面。

支持的流程包括：

- 创建 / 更新综合页面
- 更新页面元数据
- 附加来源 id
- 添加问题
- 添加矛盾
- 更新置信度 / 状态
- 写入结构化 claim

此命令的存在，是为了让 wiki 可以安全演进，而无需手动编辑
受管理的块。

### `wiki bridge import`

将当前激活记忆插件中的公开记忆构件导入到由 bridge 支持的
源页面中。

当你在 `bridge` 模式下希望将最新导出的记忆构件
拉入 wiki vault 时，请使用此命令。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下，从显式配置的本地路径导入。

这是一个有意保持实验性的功能，并且仅适用于同一台机器。

### `wiki obsidian ...`

为运行在 Obsidian 友好模式下的 vault 提供的 Obsidian 辅助命令。

子命令：

- `status`
- `search`
- `open`
- `command`
- `daily`

当启用 `obsidian.useOfficialCli` 时，
这些命令要求官方 `obsidian` CLI 存在于 `PATH` 中。

## 实用使用建议

- 当来源信息和页面标识很重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手动编辑受管理的生成区段。
- 在信任存在矛盾或低置信度的内容之前，先运行 `wiki lint`。
- 当你希望在批量导入或源内容变更后立即获得最新
  仪表板和已编译摘要时，请运行 `wiki compile`。
- 当 bridge 模式依赖新导出的记忆
  构件时，请使用 `wiki bridge import`。

## 配置关联

`openclaw wiki` 的行为受以下配置影响：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

完整配置模型请参阅 [Memory Wiki plugin](/zh-CN/plugins/memory-wiki)。
