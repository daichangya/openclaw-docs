---
read_when:
    - 你正在更改出站渠道的 Markdown 格式化或分块处理
    - 你正在添加新的渠道格式化器或样式映射
    - 你正在调试跨渠道的格式化回归问题
summary: 出站渠道的 Markdown 格式化流水线
title: Markdown 格式化
x-i18n:
    generated_at: "2026-04-23T22:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw 会先将出站 Markdown 转换为共享的中间表示（IR），再渲染为特定渠道的输出格式。IR 会在保留源文本内容的同时携带样式 / 链接区间，因此分块与渲染可以在不同渠道间保持一致。

## 目标

- **一致性：** 一次解析，多个渲染器。
- **安全分块：** 在渲染之前拆分文本，确保行内格式不会在分块之间被破坏。
- **适配渠道：** 将同一个 IR 映射到 Slack mrkdwn、Telegram HTML 和 Signal 样式区间，而无需重新解析 Markdown。

## 流水线

1. **解析 Markdown -> IR**
   - IR 由纯文本加样式区间（粗体 / 斜体 / 删除线 / 代码 / 剧透）和链接区间组成。
   - 偏移量使用 UTF-16 代码单元，因此 Signal 样式区间可以与其 API 对齐。
   - 只有当某个渠道选择启用表格转换时，才会解析表格。
2. **对 IR 分块（格式优先）**
   - 分块发生在渲染之前，基于 IR 文本进行。
   - 行内格式不会跨分块拆分；区间会按分块切片。
3. **按渠道渲染**
   - **Slack：** mrkdwn 标记（粗体 / 斜体 / 删除线 / 代码），链接格式为 `<url|label>`。
   - **Telegram：** HTML 标签（`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`）。
   - **Signal：** 纯文本 + `text-style` 区间；当标签与 URL 不同时，链接会变为 `label (url)`。

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

- Slack、Telegram 和 Signal 的出站适配器都基于 IR 进行渲染。
- 其他渠道（WhatsApp、iMessage、Microsoft Teams、Discord）仍然使用纯文本或各自的格式规则；如果启用了 Markdown 表格转换，则会在分块之前先应用转换。

## 表格处理

Markdown 表格在各类聊天客户端中的支持并不一致。使用
`markdown.tables` 可按渠道（以及按账号）控制转换方式。

- `code`：将表格渲染为代码块（大多数渠道的默认值）。
- `bullets`：将每一行转换为项目符号列表（Signal + WhatsApp 的默认值）。
- `off`：禁用表格解析与转换；原始表格文本会直接透传。

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

- 分块限制来自渠道适配器 / 配置，并应用于 IR 文本。
- 代码围栏会作为单个代码块保留，并带有结尾换行，以便渠道能够正确渲染。
- 列表前缀和引用块前缀是 IR 文本的一部分，因此分块不会在前缀中间拆开。
- 行内样式（粗体 / 斜体 / 删除线 / 行内代码 / 剧透）绝不会跨分块拆分；渲染器会在每个分块内部重新打开样式。

如果你需要进一步了解跨渠道的分块行为，请参阅
[流式传输 + 分块](/zh-CN/concepts/streaming)。

## 链接策略

- **Slack：** `[label](url)` -> `<url|label>`；裸 URL 保持原样。解析期间会禁用自动链接，以避免重复加链接。
- **Telegram：** `[label](url)` -> `<a href="url">label</a>`（HTML 解析模式）。
- **Signal：** `[label](url)` -> `label (url)`，除非标签与 URL 相同。

## 剧透

剧透标记（`||spoiler||`）仅为 Signal 解析，在其中映射为 SPOILER 样式区间。其他渠道会将其视为纯文本。

## 如何添加或更新渠道格式化器

1. **只解析一次：** 使用共享的 `markdownToIR(...)` 辅助函数，并传入适合该渠道的选项（自动链接、标题样式、引用块前缀）。
2. **渲染：** 使用 `renderMarkdownWithMarkers(...)` 和样式标记映射（或 Signal 样式区间）实现渲染器。
3. **分块：** 在渲染前调用 `chunkMarkdownIR(...)`；然后渲染每个分块。
4. **接入适配器：** 更新渠道出站适配器，使其使用新的分块器和渲染器。
5. **测试：** 添加或更新格式化测试；如果该渠道使用分块，还要添加出站投递测试。

## 常见陷阱

- 必须保留 Slack 尖括号标记（`<@U123>`、`<#C123>`、`<https://...>`）；同时要安全地转义原始 HTML。
- Telegram HTML 需要对标签外的文本进行转义，以避免标记损坏。
- Signal 样式区间依赖 UTF-16 偏移量；不要使用码点偏移量。
- 为代码围栏保留结尾换行，这样结束标记才能落在单独一行上。

## 相关

- [流式传输和分块](/zh-CN/concepts/streaming)
- [系统提示](/zh-CN/concepts/system-prompt)
