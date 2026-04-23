---
read_when:
    - 你正在更改面向出站渠道的 Markdown 格式化或分块 logic
    - 你正在添加新的渠道格式化器或样式映射
    - 你正在调试跨渠道的格式化回归问题
summary: 面向出站渠道的 Markdown 格式化流水线
title: Markdown 格式化
x-i18n:
    generated_at: "2026-04-23T20:46:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f7d9ae8f605bb93b0b1fccebac3ca8c01fe9bfbb3ab8a8b4b93ab8cc31f2b23
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw 会先将出站 Markdown 转换为共享的中间表示（IR），再渲染为特定渠道的输出格式。IR 会保留源文本不变，同时携带样式/link spans，因此分块和渲染可以在各个渠道间保持一致。

## 目标

- **一致性：** 一次解析，多种渲染器。
- **安全分块：** 在渲染前先拆分文本，这样内联格式就不会在分块间断裂。
- **适配渠道：** 将同一个 IR 映射为 Slack `mrkdwn`、Telegram HTML 和 Signal 样式范围，而无需重复解析 Markdown。

## 流水线

1. **解析 Markdown -> IR**
   - IR 由纯文本以及样式 spans（bold/italic/strike/code/spoiler）和 link spans 组成。
   - 偏移量使用 UTF-16 code units，以便 Signal 样式范围与其 API 对齐。
   - 只有在渠道启用了表格转换时，表格才会被解析。
2. **对 IR 分块（先格式后分块）**
   - 分块发生在渲染之前，直接针对 IR 文本进行。
   - 内联格式不会跨分块拆分；spans 会按每个分块进行切片。
3. **按渠道渲染**
   - **Slack：** `mrkdwn` 标记（bold/italic/strike/code），链接使用 `<url|label>`。
   - **Telegram：** HTML 标签（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`）。
   - **Signal：** 纯文本 + `text-style` 范围；当 label 与 URL 不同时，链接会变成 `label (url)`。

## IR 示例

输入 Markdown：

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR（示意）：

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 使用位置

- Slack、Telegram 和 Signal 的出站适配器都从 IR 进行渲染。
- 其他渠道（WhatsApp、iMessage、Microsoft Teams、Discord）仍然使用纯文本或其自身格式规则；如果启用了 Markdown 表格转换，则会在分块之前先应用表格转换。

## 表格处理

Markdown 表格在不同聊天客户端中的支持并不一致。使用
`markdown.tables` 按渠道（以及按账户）控制转换方式。

- `code`：将表格渲染为代码块（大多数渠道的默认值）。
- `bullets`：将每一行转换为项目符号列表（Signal + WhatsApp 的默认值）。
- `off`：禁用表格解析和转换；原始表格文本会直接透传。

配置键：

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## 分块规则

- 分块限制来自渠道适配器/配置，并应用到 IR 文本上。
- 代码围栏会作为一个完整区块保留，并带有尾随换行，以便渠道正确渲染。
- 列表前缀和引用块前缀是 IR 文本的一部分，因此分块不会在前缀中间拆开。
- 内联样式（bold/italic/strike/inline-code/spoiler）绝不会跨分块拆分；渲染器会在每个分块内重新打开样式。

如果你想进一步了解跨渠道的分块行为，请参阅
[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 链接策略

- **Slack：** `[label](url)` -> `<url|label>`；裸 URL 保持原样。解析时会禁用自动链接，以避免重复链接。
- **Telegram：** `[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：** `[label](url)` -> `label (url)`，除非 label 与 URL 相同。

## 剧透

剧透标记（`||spoiler||`）只会为 Signal 解析，在那里它们会映射为
SPOILER 样式范围。其他渠道会将其视为纯文本。

## 如何添加或更新渠道格式化器

1. **解析一次：** 使用共享的 `markdownToIR(...)` 辅助函数，并传入与渠道匹配的选项（autolink、heading style、blockquote prefix）。
2. **渲染：** 使用 `renderMarkdownWithMarkers(...)` 和样式标记映射（或 Signal 样式范围）实现渲染器。
3. **分块：** 在渲染前调用 `chunkMarkdownIR(...)`；然后渲染每个分块。
4. **接线适配器：** 更新渠道出站适配器，使其使用新的分块器和渲染器。
5. **测试：** 添加或更新格式测试；如果该渠道使用分块，还要添加出站投递测试。

## 常见陷阱

- Slack 尖括号标记（`<@U123>`、`<#C123>`、`<https://...>`）必须保留；同时要安全地转义原始 HTML。
- Telegram HTML 要求对标签外文本进行转义，以避免标记损坏。
- Signal 样式范围依赖 UTF-16 偏移量；不要使用 code point 偏移量。
- 为代码围栏保留尾随换行，这样结束标记才能落在独立一行上。
