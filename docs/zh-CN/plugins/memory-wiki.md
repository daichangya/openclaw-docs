---
read_when:
    - 你想要超越普通 `MEMORY.md` 笔记的持久化知识
    - 你正在配置内置的 memory-wiki 插件
    - 你想了解 `wiki_search`、`wiki_get` 或桥接模式
summary: Memory Wiki：带有来源追踪、声明、仪表板和桥接模式的编译知识库
title: Memory Wiki
x-i18n:
    generated_at: "2026-04-12T16:12:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44d168a7096f744c56566ecac57499192eb101b4dd8a78e1b92f3aa0d6da3ad1
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Memory Wiki

`memory-wiki` 是一个内置插件，可将持久化记忆转换为编译后的知识库。

它**不会**替代当前激活的 memory 插件。当前激活的 memory 插件仍然负责召回、提升、索引和 dreaming。`memory-wiki` 位于其旁侧，并将持久化知识编译为可导航的 wiki，包含确定性的页面、结构化声明、来源追踪、仪表板以及机器可读的摘要。

当你希望 memory 的行为更像一个经过维护的知识层，而不是一堆 Markdown 文件时，就使用它。

## 它增加了什么

- 一个具有确定性页面布局的专用 wiki 知识库
- 结构化的声明和证据元数据，而不只是散文内容
- 页面级的来源追踪、置信度、矛盾点和开放问题
- 面向智能体/运行时消费者的编译摘要
- wiki 原生的 search/get/apply/lint 工具
- 可选的桥接模式，可从当前激活的 memory 插件导入公共工件
- 可选的 Obsidian 友好渲染模式和 CLI 集成

## 它如何与 memory 配合

可以这样理解这种划分：

| 层 | 负责内容 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 当前激活的 memory 插件（`memory-core`、QMD、Honcho 等） | 召回、语义搜索、提升、dreaming、memory 运行时 |
| `memory-wiki` | 编译后的 wiki 页面、富含来源追踪的综合内容、仪表板、wiki 专用的 search/get/apply |

如果当前激活的 memory 插件暴露了共享召回工件，OpenClaw 就可以通过 `memory_search corpus=all` 一次性搜索这两层。

当你需要 wiki 专用排序、来源追踪或直接页面访问时，请改用 wiki 原生工具。

## 推荐的混合模式

本地优先配置的一个强力默认方案是：

- 使用 QMD 作为当前激活的 memory 后端，负责召回和广泛的语义搜索
- 以 `bridge` 模式运行 `memory-wiki`，用于持久化的综合知识页面

这种拆分效果很好，因为每一层都能保持专注：

- QMD 让原始笔记、会话导出和额外集合保持可搜索
- `memory-wiki` 负责编译稳定的实体、声明、仪表板和来源页面

实用规则：

- 当你想对 memory 进行一次广泛的统一召回时，使用 `memory_search`
- 当你想要具备来源感知能力的 wiki 结果时，使用 `wiki_search` 和 `wiki_get`
- 当你希望共享搜索同时跨越两层时，使用 `memory_search corpus=all`

如果桥接模式报告零个已导出工件，说明当前激活的 memory 插件目前尚未暴露公共桥接输入。请先运行 `openclaw wiki doctor`，然后确认当前激活的 memory 插件支持公共工件。

## 知识库模式

`memory-wiki` 支持三种知识库模式：

### `isolated`

独立知识库、独立来源，不依赖 `memory-core`。

当你希望 wiki 成为它自己的策展式知识存储时，请使用此模式。

### `bridge`

通过公共插件 SDK 接缝，从当前激活的 memory 插件读取公共 memory 工件和 memory 事件。

当你希望 wiki 在不访问私有插件内部实现的前提下，编译并组织 memory 插件导出的工件时，请使用此模式。

桥接模式可为以下内容建立索引：

- 导出的 memory 工件
- dream 报告
- 每日笔记
- memory 根文件
- memory 事件日志

### `unsafe-local`

面向本机私有路径的显式逃生口。

此模式是有意设计为实验性的且不可移植。只有在你理解信任边界，并且确实需要桥接模式无法提供的本地文件系统访问时，才应使用它。

## 知识库布局

该插件会初始化如下知识库：

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

受管理的内容会保留在生成块中。人工笔记块会被保留。

主要页面分组包括：

- `sources/`：用于导入的原始材料和桥接支持的页面
- `entities/`：用于持久化对象、人物、系统、项目和物体
- `concepts/`：用于想法、抽象、模式和策略
- `syntheses/`：用于编译后的摘要和持续维护的汇总
- `reports/`：用于生成的仪表板

## 结构化声明与证据

页面可以携带结构化的 `claims` frontmatter，而不仅仅是自由文本内容。

每条声明可以包含：

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

证据条目可以包含：

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

这正是让 wiki 更像“信念层”而不是被动笔记堆的原因。声明可以被跟踪、评分、质疑，并回溯解析到来源。

## 编译流水线

编译步骤会读取 wiki 页面、规范化摘要，并在以下位置输出稳定的、面向机器的工件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

这些摘要的存在，是为了让智能体和运行时代码无需抓取 Markdown 页面。

编译输出还支持以下功能：

- 用于 search/get 流程的首轮 wiki 索引
- 从 claim id 回查所属页面
- 紧凑的提示补充内容
- 报告/仪表板生成

## 仪表板和健康报告

启用 `render.createDashboards` 后，编译过程会在 `reports/` 下维护仪表板。

内置报告包括：

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

这些报告会跟踪如下内容：

- 矛盾说明聚类
- 相互竞争的声明聚类
- 缺少结构化证据的声明
- 低置信度页面和声明
- 陈旧或新鲜度未知的内容
- 含有未解决问题的页面

## 搜索与检索

`memory-wiki` 支持两种搜索后端：

- `shared`：在可用时使用共享 memory 搜索流程
- `local`：在本地搜索 wiki

它还支持三种语料库：

- `wiki`
- `memory`
- `all`

重要行为：

- `wiki_search` 和 `wiki_get` 会在可能时优先使用编译摘要进行首轮处理
- claim id 可以解析回所属页面
- 有争议/陈旧/新鲜的声明会影响排序
- 来源标签可以保留到结果中

实用规则：

- 想进行一次广泛统一的召回时，使用 `memory_search corpus=all`
- 当你关心 wiki 专用排序、来源追踪或页面级信念结构时，使用 `wiki_search` + `wiki_get`

## 智能体工具

该插件注册了以下工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它们的作用：

- `wiki_status`：当前知识库模式、健康状态、Obsidian CLI 可用性
- `wiki_search`：搜索 wiki 页面，并在已配置时搜索共享 memory 语料库
- `wiki_get`：按 id/path 读取 wiki 页面，或回退到共享 memory 语料库
- `wiki_apply`：进行窄范围的综合/元数据变更，而不是自由形式的页面修改
- `wiki_lint`：结构检查、来源缺口、矛盾点、开放问题

该插件还会注册一个非独占的 memory 语料补充，因此当当前激活的 memory 插件支持语料选择时，共享的 `memory_search` 和 `memory_get` 也可以访问 wiki。

## 提示与上下文行为

启用 `context.includeCompiledDigestPrompt` 后，memory 提示部分会附加来自 `agent-digest.json` 的紧凑编译快照。

该快照有意保持为体积小、信号强：

- 仅顶部页面
- 仅顶部声明
- 矛盾计数
- 问题计数
- 置信度/新鲜度限定信息

这是可选启用的，因为它会改变提示形态，而且主要适用于显式消费 memory 补充内容的上下文引擎或旧版提示组装流程。

## 配置

将配置放在 `plugins.entries.memory-wiki.config` 下：

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

关键开关：

- `vaultMode`：`isolated`、`bridge`、`unsafe-local`
- `vault.renderMode`：`native` 或 `obsidian`
- `bridge.readMemoryArtifacts`：导入当前激活的 memory 插件的公共工件
- `bridge.followMemoryEvents`：在桥接模式中包含事件日志
- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`：向 memory 提示部分附加紧凑的摘要快照
- `render.createBacklinks`：生成确定性的相关内容块
- `render.createDashboards`：生成仪表板页面

### 示例：QMD + 桥接模式

如果你希望使用 QMD 负责召回，而使用 `memory-wiki` 作为维护型知识层，请使用此配置：

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

这样可以保持：

- 由 QMD 负责当前激活的 memory 召回
- `memory-wiki` 专注于编译页面和仪表板
- 在你有意启用编译摘要提示之前，提示形态保持不变

## CLI

`memory-wiki` 还暴露了顶层 CLI 界面：

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

完整命令参考请见 [CLI：wiki](/cli/wiki)。

## Obsidian 支持

当 `vault.renderMode` 为 `obsidian` 时，插件会写入对 Obsidian 友好的 Markdown，并且可选使用官方 `obsidian` CLI。

支持的工作流包括：

- 状态探测
- 知识库搜索
- 打开页面
- 调用 Obsidian 命令
- 跳转到每日笔记

这是可选功能。即使没有 Obsidian，wiki 仍可在原生模式下工作。

## 推荐工作流

1. 保留你当前激活的 memory 插件用于召回/提升/dreaming。
2. 启用 `memory-wiki`。
3. 除非你明确想使用桥接模式，否则先从 `isolated` 模式开始。
4. 当来源追踪很重要时，使用 `wiki_search` / `wiki_get`。
5. 对于窄范围的综合内容或元数据更新，使用 `wiki_apply`。
6. 在有意义的更改后运行 `wiki_lint`。
7. 如果你希望看到陈旧/矛盾可见性，就开启仪表板。

## 相关文档

- [Memory Overview](/zh-CN/concepts/memory)
- [CLI：memory](/cli/memory)
- [CLI：wiki](/cli/wiki)
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)
