---
read_when:
    - |-
      你希望让智能体分析 PDF 文件】【。analysis to=functions.read code  大发快三官网json
      {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/","offset":1,"limit":1}
    - 你需要准确的 PDF 工具参数和限制
    - |-
      你正在调试原生 PDF 模式与提取回退机制】【。analysis to=functions.read code აციას=json
      {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/","offset":1,"limit":1}
summary: 使用原生 provider 支持与提取回退分析一个或多个 PDF 文档
title: PDF 工具
x-i18n:
    generated_at: "2026-04-23T21:09:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 230fa60b5fc0e046bec85c2304c74de52997982dd58bffc721645129c82971f0
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` 用于分析一个或多个 PDF 文档，并返回文本。

快速行为说明：

- 对 Anthropic 和 Google 模型 providers 使用原生 provider 模式。
- 对其他 providers 使用提取回退模式（先提取文本，必要时再使用页面图像）。
- 支持单个输入（`pdf`）或多个输入（`pdfs`），每次调用最多 10 个 PDF。

## 可用性

只有当 OpenClaw 能为该智能体解析出一个支持 PDF 的模型配置时，才会注册该工具：

1. `agents.defaults.pdfModel`
2. 回退到 `agents.defaults.imageModel`
3. 回退到智能体已解析的会话/默认模型
4. 如果原生 PDF providers 依赖认证，则优先选择它们，而不是通用图像回退候选项

如果无法解析出可用模型，则不会暴露 `pdf` 工具。

可用性说明：

- 回退链具备认证感知能力。已配置的 `provider/model` 只有在
  OpenClaw 实际能够为该智能体认证该 provider 时才算有效。
- 当前原生 PDF providers 仅有 **Anthropic** 和 **Google**。
- 如果已解析的会话/默认 provider 本身已经配置了可用的 vision/PDF
  模型，则 PDF 工具会优先复用它，而不是回退到其他有认证支持的
  providers。

## 输入参考

- `pdf`（`string`）：单个 PDF 路径或 URL
- `pdfs`（`string[]`）：多个 PDF 路径或 URL，总数最多 10 个
- `prompt`（`string`）：分析提示词，默认值为 `Analyze this PDF document.`
- `pages`（`string`）：页码过滤，例如 `1-5` 或 `1,3,7-9`
- `model`（`string`）：可选模型覆盖（`provider/model`）
- `maxBytesMb`（`number`）：每个 PDF 的大小上限（MB）

输入说明：

- `pdf` 和 `pdfs` 会在加载前合并并去重。
- 如果未提供任何 PDF 输入，工具会报错。
- `pages` 会按从 1 开始的页码解析、去重、排序，并被限制在已配置的最大页数内。
- `maxBytesMb` 默认取 `agents.defaults.pdfMaxBytesMb`，否则为 `10`。

## 支持的 PDF 引用

- 本地文件路径（包括 `~` 展开）
- `file://` URL
- `http://` 和 `https://` URL

引用说明：

- 其他 URI scheme（例如 `ftp://`）会被拒绝，并返回 `unsupported_pdf_reference`。
- 在沙箱模式下，远程 `http(s)` URL 会被拒绝。
- 启用仅工作区文件策略时，位于允许根目录之外的本地文件路径会被拒绝。

## 执行模式

### 原生 provider 模式

对于 provider `anthropic` 和 `google`，会使用原生模式。  
该工具会将原始 PDF 字节直接发送到 provider API。

原生模式限制：

- 不支持 `pages`。如果设置了该参数，工具会返回错误。
- 支持多 PDF 输入；每个 PDF 都会在提示词之前，作为原生 document block /
  内联 PDF part 发送。

### 提取回退模式

对于非原生 providers，会使用回退模式。

流程：

1. 从选定页面中提取文本（最多 `agents.defaults.pdfMaxPages`，默认 `20`）。
2. 如果提取出的文本长度少于 `200` 个字符，则将选定页面渲染为 PNG 图像并一并包含。
3. 将提取内容与提示词一起发送给所选模型。

回退细节：

- 页面图像提取使用 `4,000,000` 的像素预算。
- 如果目标模型不支持图像输入，且没有可提取文本，则工具会报错。
- 如果文本提取成功，但图像提取要求在仅文本模型上使用 vision，
  OpenClaw 会丢弃渲染图像，并继续使用提取文本。
- 提取回退需要 `pdfjs-dist`（以及用于图像渲染的 `@napi-rs/canvas`）。

## 配置

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

完整字段说明请参见 [配置参考](/zh-CN/gateway/configuration-reference)。

## 输出细节

该工具会在 `content[0].text` 中返回文本，并在 `details` 中返回结构化元数据。

常见 `details` 字段：

- `model`：解析后的模型引用（`provider/model`）
- `native`：原生 provider 模式为 `true`，回退模式为 `false`
- `attempts`：在成功前失败的回退尝试

路径字段：

- 单个 PDF 输入：`details.pdf`
- 多个 PDF 输入：`details.pdfs[]`，其中包含 `pdf` 条目
- 沙箱路径重写元数据（如适用）：`rewrittenFrom`

## 错误行为

- 缺少 PDF 输入：抛出 `pdf required: provide a path or URL to a PDF document`
- PDF 数量过多：在 `details.error = "too_many_pdfs"` 中返回结构化错误
- 不支持的引用 scheme：返回 `details.error = "unsupported_pdf_reference"`
- 原生模式下使用 `pages`：会抛出清晰错误 `pages is not supported with native PDF providers`

## 示例

单个 PDF：

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

多个 PDF：

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

带页码过滤的回退模型：

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [配置参考](/zh-CN/gateway/configuration-reference#agent-defaults) — `pdfMaxBytesMb` 和 `pdfMaxPages` 配置
