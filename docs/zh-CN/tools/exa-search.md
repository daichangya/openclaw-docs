---
read_when:
    - 你想将 Exa 用于 `web_search`
    - 你需要配置 `EXA_API_KEY`
    - 你想使用神经搜索或内容提取
summary: Exa AI 搜索——带内容提取的神经搜索与关键词搜索
title: Exa 搜索
x-i18n:
    generated_at: "2026-04-23T21:07:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a1d70ca56d13b5d2aaeab28e6c0557983a1d4422d5131dd4b99195234ad7a4c
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw 支持将 [Exa AI](https://exa.ai/) 用作 `web_search` 提供商。Exa
提供神经搜索、关键词搜索和混合搜索模式，并内置内容
提取能力（highlights、text、summary）。

## 获取 API key

<Steps>
  <Step title="创建账户">
    在 [exa.ai](https://exa.ai/) 注册，并从你的
    控制台生成 API key。
  </Step>
  <Step title="存储 key">
    在 Gateway 网关环境中设置 `EXA_API_KEY`，或通过以下命令配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 配置

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // 如果已设置 EXA_API_KEY，则为可选
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**环境变量替代方式：** 在 Gateway 网关环境中设置 `EXA_API_KEY`。
对于 gateway 安装，请将其写入 `~/.openclaw/.env`。

## 工具参数

| 参数 | 描述 |
| ------------- | ----------------------------------------------------------------------------- |
| `query` | 搜索查询（必填） |
| `count` | 返回结果数量（1-100） |
| `type` | 搜索模式：`auto`、`neural`、`fast`、`deep`、`deep-reasoning` 或 `instant` |
| `freshness` | 时间过滤：`day`、`week`、`month` 或 `year` |
| `date_after` | 返回此日期之后的结果（YYYY-MM-DD） |
| `date_before` | 返回此日期之前的结果（YYYY-MM-DD） |
| `contents` | 内容提取选项（见下文） |

### 内容提取

Exa 可以在搜索结果旁返回提取出的内容。传入 `contents`
对象即可启用：

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // 全文文本
    highlights: { numSentences: 3 }, // 关键句
    summary: true, // AI 摘要
  },
});
```

| 内容选项 | 类型 | 描述 |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text` | `boolean \| { maxCharacters }` | 提取页面全文 |
| `highlights` | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 提取关键句 |
| `summary` | `boolean \| { query }` | AI 生成摘要 |

### 搜索模式

| 模式 | 描述 |
| ---------------- | --------------------------------- |
| `auto` | Exa 选择最佳模式（默认） |
| `neural` | 基于语义/含义的搜索 |
| `fast` | 快速关键词搜索 |
| `deep` | 深度全面搜索 |
| `deep-reasoning` | 带 reasoning 的深度搜索 |
| `instant` | 最快返回结果 |

## 说明

- 如果未提供 `contents` 选项，Exa 默认使用 `{ highlights: true }`，
  因此结果会包含关键句摘录
- 当可用时，结果会保留来自 Exa API
  响应的 `highlightScores` 和 `summary` 字段
- 结果描述会优先取自 highlights，其次是 summary，再其次是
  full text —— 哪个可用就用哪个
- `freshness` 与 `date_after`/`date_before` 不能同时使用 —— 请只选择一种
  时间过滤模式
- 每次查询最多可返回 100 条结果（受 Exa 搜索类型
  限制）
- 结果默认缓存 15 分钟（可通过
  `cacheTtlMinutes` 配置）
- Exa 是一个官方 API 集成，返回结构化 JSON 响应

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) —— 所有提供商与自动检测
- [Brave Search](/zh-CN/tools/brave-search) —— 带国家/语言过滤的结构化结果
- [Perplexity Search](/zh-CN/tools/perplexity-search) —— 带域名过滤的结构化结果
