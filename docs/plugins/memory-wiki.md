---
read_when:
    - 你想要超越普通 `MEMORY.md` 笔记的持久知识能力
    - 你正在配置内置的 memory-wiki 插件
    - 你想了解 `wiki_search`、`wiki_get` 或桥接模式
summary: Memory Wiki：带来源、主张、仪表板和桥接模式的编译知识库
title: Memory Wiki
x-i18n:
    generated_at: "2026-04-23T20:57:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` 是一个内置插件，可将持久记忆变成一个编译式
知识库。

它**不会**替换当前活动的 memory 插件。当前活动的 memory 插件仍然
负责 recall、promotion、indexing 和 dreaming。`memory-wiki` 会与其并列存在，
并将持久知识编译为一个可导航的 wiki，其中包含确定性的页面、
结构化主张、来源、仪表板以及机器可读摘要。

当你希望记忆更像一个经过维护的知识层，而不只是
一堆 Markdown 文件时，就使用它。

## 它增加了什么

- 一个专用的 wiki 知识库，具有确定性的页面布局
- 结构化的主张和证据元数据，而不只是散文
- 页面级的来源、置信度、矛盾点和开放问题
- 面向智能体/运行时使用的编译摘要
- 原生 wiki 的搜索/get/apply/lint 工具
- 可选的桥接模式，可从当前活动的 memory 插件导入公共产物
- 可选的 Obsidian 友好渲染模式和 CLI 集成

## 它如何与 memory 协作

可以这样理解它们的分工：

| 层 | 负责内容 |
| --- | --- |
| 活动 memory 插件（`memory-core`、QMD、Honcho 等） | Recall、语义搜索、promotion、dreaming、memory 运行时 |
| `memory-wiki` | 编译后的 wiki 页面、富含来源的综合内容、仪表板、wiki 专用的 search/get/apply |

如果活动 memory 插件暴露共享 recall 产物，OpenClaw 就可以用
`memory_search corpus=all` 一次搜索两个层。

当你需要 wiki 专用排序、来源信息，或直接访问页面时，请改用
原生 wiki 工具。

## 推荐的混合模式

对本地优先设置来说，一个强有力的默认组合是：

- 使用 QMD 作为活动 memory 后端，负责 recall 和广泛的语义搜索
- 在 `bridge` 模式下使用 `memory-wiki` 来管理持久的综合知识页面

这种拆分效果很好，因为每一层都保持专注：

- QMD 让原始笔记、会话导出和额外 collection 保持可搜索
- `memory-wiki` 负责编译稳定的实体、主张、仪表板和来源页面

实际规则：

- 当你想做一次广泛的记忆 recall 时，使用 `memory_search`
- 当你想要带来源感知的 wiki 结果时，使用 `wiki_search` 和 `wiki_get`
- 当你想让共享搜索跨越两个层时，使用 `memory_search corpus=all`

如果桥接模式报告导出了零个产物，说明当前活动的 memory 插件
暂时还没有暴露公共桥接输入。请先运行 `openclaw wiki doctor`，
然后确认当前活动的 memory 插件支持公共产物。

## 知识库模式

`memory-wiki` 支持三种知识库模式：

### `isolated`

独立知识库、独立来源，不依赖 `memory-core`。

当你希望 wiki 成为一个独立策展的知识存储时，请使用此模式。

### `bridge`

通过公共插件 SDK 接缝，从当前活动的 memory 插件
读取公共 memory 产物和 memory 事件。

当你希望 wiki 在不触及私有插件内部实现的前提下，
对 memory 插件导出的产物进行编译和组织时，请使用此模式。

桥接模式可以索引：

- 导出的 memory 产物
- dream 报告
- 每日笔记
- memory 根文件
- memory 事件日志

### `unsafe-local`

用于本机私有路径的显式同机逃生模式。

该模式是有意设置为实验性且不可移植的。仅当你
理解信任边界，并且确实需要 bridge 模式无法提供的本地文件系统访问时才应使用。

## 知识库布局

插件会按如下结构初始化一个知识库：

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

托管内容会保留在生成块中。人工笔记块会被保留。

主要页面分组如下：

- `sources/`：导入的原始材料和 bridge 支持的页面
- `entities/`：持久存在的事物、人物、系统、项目和对象
- `concepts/`：思想、抽象、模式和策略
- `syntheses/`：编译后的摘要和维护中的汇总
- `reports/`：生成的仪表板

## 结构化主张与证据

页面可以携带结构化的 `claims` frontmatter，而不只是自由文本。

每条主张可以包含：

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

这正是 wiki 比被动笔记堆更像一层信念系统的原因。
主张可以被跟踪、评分、争议，并回溯到来源进行解决。

## 编译管线

编译步骤会读取 wiki 页面、规范化摘要，并在以下位置输出稳定的
机器可读产物：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

这些摘要的存在，是为了让智能体和运行时代码无需抓取 Markdown
页面。

编译输出还支撑着：

- 用于 search/get 流程的第一步 wiki 索引
- 从 claim id 反查所属页面
- 紧凑的提示补充
- 报告/仪表板生成

## 仪表板与健康报告

启用 `render.createDashboards` 后，compile 会在 `reports/` 下维护仪表板。

内置报告包括：

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

这些报告会跟踪如下内容：

- 矛盾说明簇
- 相互竞争的主张簇
- 缺少结构化证据的主张
- 低置信度页面和主张
- 陈旧或新鲜度未知的内容
- 含有未解决问题的页面

## 搜索与检索

`memory-wiki` 支持两种搜索后端：

- `shared`：在可用时使用共享 memory 搜索流程
- `local`：在本地搜索 wiki

它还支持三种 corpus：

- `wiki`
- `memory`
- `all`

重要行为：

- `wiki_search` 和 `wiki_get` 会在可能时优先使用编译摘要
- claim id 可以反查到所属页面
- 有争议/陈旧/新鲜的主张会影响排序
- 来源标签可以在结果中保留下来

实际规则：

- 当你想做一次广泛 recall 时，使用 `memory_search corpus=all`
- 当你关心 wiki 专用排序、来源或页面级信念结构时，使用 `wiki_search` + `wiki_get`

## 智能体工具

该插件会注册以下工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它们的作用：

- `wiki_status`：当前知识库模式、健康状态、Obsidian CLI 可用性
- `wiki_search`：搜索 wiki 页面，并在已配置时搜索共享 memory 语料库
- `wiki_get`：按 id/path 读取 wiki 页面，或回退到共享 memory 语料库
- `wiki_apply`：执行狭义的综合/元数据变更，而不是自由形式的页面手术
- `wiki_lint`：进行结构检查、来源缺口、矛盾、开放问题检查

该插件还会注册一个非排他的 memory corpus 补充，因此当活动 memory
插件支持 corpus 选择时，共享的 `memory_search` 和 `memory_get` 也可以访问 wiki。

## 提示与上下文行为

启用 `context.includeCompiledDigestPrompt` 时，memory 提示段会
追加一段来自 `agent-digest.json` 的紧凑编译快照。

该快照有意保持小而高信号：

- 仅包含顶级页面
- 仅包含顶级主张
- 矛盾计数
- 问题计数
- 置信度/新鲜度限定词

这是选择启用的，因为它会改变提示形态，并且主要适用于
明确消费 memory 补充的上下文引擎或 legacy 提示组装逻辑。

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
- `bridge.readMemoryArtifacts`：导入活动 memory 插件的公共产物
- `bridge.followMemoryEvents`：在桥接模式中包含事件日志
- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`：将紧凑摘要快照追加到 memory 提示段
- `render.createBacklinks`：生成确定性的相关块
- `render.createDashboards`：生成仪表板页面

### 示例：QMD + 桥接模式

当你希望用 QMD 做 recall，用 `memory-wiki` 做维护型
知识层时，请使用这种方式：

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

这会保持：

- 由 QMD 负责活动 memory recall
- `memory-wiki` 专注于编译页面和仪表板
- 在你明确启用编译摘要提示之前，提示形态保持不变

## CLI

`memory-wiki` 还暴露了一个顶层 CLI 表面：

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

完整命令参考请参见 [CLI: wiki](/zh-CN/cli/wiki)。

## Obsidian 支持

当 `vault.renderMode` 为 `obsidian` 时，插件会写出适合 Obsidian 的
Markdown，并可选择使用官方 `obsidian` CLI。

支持的工作流包括：

- 状态探测
- 知识库搜索
- 打开页面
- 调用某个 Obsidian 命令
- 跳转到每日笔记

这是可选功能。即使不使用 Obsidian，wiki 在 native 模式下也能正常工作。

## 推荐工作流

1. 保留活动 memory 插件来负责 recall/promotion/dreaming。
2. 启用 `memory-wiki`。
3. 除非你明确需要桥接模式，否则先从 `isolated` 模式开始。
4. 当来源信息很重要时，使用 `wiki_search` / `wiki_get`。
5. 对狭义综合或元数据更新，使用 `wiki_apply`。
6. 在有意义的变更后运行 `wiki_lint`。
7. 如果你希望看到陈旧/矛盾可见性，就打开仪表板。

## 相关文档

- [Memory Overview](/zh-CN/concepts/memory)
- [CLI: memory](/zh-CN/cli/memory)
- [CLI: wiki](/zh-CN/cli/wiki)
- [Plugin SDK Overview](/zh-CN/plugins/sdk-overview)
