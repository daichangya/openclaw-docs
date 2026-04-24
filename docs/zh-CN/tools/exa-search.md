---
read_when:
    - 你想将 Exa 用于 `web_search`
    - 你需要一个 `EXA_API_KEY`
    - 你想要神经搜索或内容提取
summary: Exa AI 搜索——支持内容提取的神经搜索和关键词搜索
title: Exa 搜索
x-i18n:
    generated_at: "2026-04-24T02:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw 支持将 [Exa AI](https://exa.ai/) 作为 `web_search` 提供商。Exa 提供神经搜索、关键词搜索和混合搜索模式，并内置内容提取功能（高亮、文本、摘要）。

## 获取 API 密钥

<Steps>
  <Step title="创建账户">
    在 [exa.ai](https://exa.ai/) 注册，并在你的控制台中生成一个 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `EXA_API_KEY`，或通过以下方式配置：

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
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
对于 gateway 安装，请将其放在 `~/.openclaw/.env` 中。

## 工具参数

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number">
返回的结果数量（1–100）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
搜索模式。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间筛选。
</ParamField>

<ParamField path="date_after" type="string">
此日期之后的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
此日期之前的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="contents" type="object">
内容提取选项（见下文）。
</ParamField>

### 内容提取

Exa 可以在搜索结果旁边返回提取出的内容。传入一个 `contents`
对象即可启用：

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| 内容选项      | 类型                                                                  | 描述         |
| ------------- | --------------------------------------------------------------------- | ------------ |
| `text`        | `boolean \| { maxCharacters }`                                        | 提取整页文本 |
| `highlights`  | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 提取关键句子 |
| `summary`     | `boolean \| { query }`                                                | AI 生成摘要  |

### 搜索模式

| 模式              | 描述                         |
| ----------------- | ---------------------------- |
| `auto`            | Exa 选择最佳模式（默认）     |
| `neural`          | 基于语义/含义的搜索          |
| `fast`            | 快速关键词搜索               |
| `deep`            | 更彻底的深度搜索             |
| `deep-reasoning`  | 带推理能力的深度搜索         |
| `instant`         | 最快返回结果                 |

## 注意事项

- 如果未提供 `contents` 选项，Exa 默认使用 `{ highlights: true }`，因此结果会包含关键句摘录
- 结果会在可用时保留来自 Exa API 响应中的 `highlightScores` 和 `summary` 字段
- 结果描述会优先从高亮内容解析，其次是摘要，最后是全文文本——使用任何可用的内容
- `freshness` 不能与 `date_after`/`date_before` 组合使用——请选择一种时间筛选模式
- 每个查询最多可返回 100 条结果（受 Exa 搜索类型限制）
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）
- Exa 是一个官方 API 集成，提供结构化 JSON 响应

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) —— 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) —— 带国家/语言筛选的结构化结果
- [Perplexity Search](/zh-CN/tools/perplexity-search) —— 带域名筛选的结构化结果
