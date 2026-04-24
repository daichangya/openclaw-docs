---
read_when:
    - 你想要获取一个 URL 并提取可读内容
    - 你需要配置 `web_fetch` 或其 Firecrawl 回退机制
    - 你想了解 `web_fetch` 的限制和缓存机制
sidebarTitle: Web Fetch
summary: '`web_fetch` 工具——带有可读内容提取功能的 HTTP 获取工具'
title: Web 获取
x-i18n:
    generated_at: "2026-04-24T02:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

`web_fetch` 工具会执行普通的 HTTP GET，并提取可读内容
（将 HTML 转为 markdown 或文本）。它**不会**执行 JavaScript。

对于重度依赖 JS 的网站或受登录保护的页面，请改用
[Web Browser](/zh-CN/tools/browser)。

## 快速开始

`web_fetch` **默认启用**——无需任何配置。智能体可以
立即调用它：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具参数

<ParamField path="url" type="string" required>
要获取的 URL。仅支持 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
提取主体内容后的输出格式。
</ParamField>

<ParamField path="maxChars" type="number">
将输出截断为最多这么多字符。
</ParamField>

## 工作原理

<Steps>
  <Step title="获取">
    发送带有类似 Chrome 的 User-Agent 和 `Accept-Language`
    标头的 HTTP GET 请求。会阻止私有/内部主机名，并在重定向后再次检查。
  </Step>
  <Step title="提取">
    对 HTML 响应运行 Readability（主体内容提取）。
  </Step>
  <Step title="回退（可选）">
    如果 Readability 失败，且已配置 Firecrawl，则会通过
    Firecrawl API 以 bot-circumvention 模式重试。
  </Step>
  <Step title="缓存">
    结果会缓存 15 分钟（可配置），以减少对同一 URL 的重复
    获取。
  </Step>
</Steps>

## 配置

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // 默认值：true
        provider: "firecrawl", // 可选；省略则自动检测
        maxChars: 50000, // 输出字符数上限
        maxCharsCap: 50000, // maxChars 参数的硬上限
        maxResponseBytes: 2000000, // 截断前的最大下载大小
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // 使用 Readability 提取
        userAgent: "Mozilla/5.0 ...", // 覆盖 User-Agent
      },
    },
  },
}
```

## Firecrawl 回退

如果 Readability 提取失败，`web_fetch` 可以回退到
[Firecrawl](/zh-CN/tools/firecrawl)，以实现 bot-circumvention 和更好的提取效果：

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 可选；省略则根据可用凭证自动检测
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // 如果已设置 FIRECRAWL_API_KEY，则为可选
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // 缓存时长（1 天）
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` 支持 SecretRef 对象。
旧版 `tools.web.fetch.firecrawl.*` 配置会由 `openclaw doctor --fix` 自动迁移。

<Note>
  如果已启用 Firecrawl，且其 SecretRef 未解析，同时也没有
  `FIRECRAWL_API_KEY` 环境变量回退，Gateway 网关启动会快速失败。
</Note>

<Note>
  Firecrawl 的 `baseUrl` 覆盖受到严格限制：必须使用 `https://`，并且
  必须是官方 Firecrawl 主机（`api.firecrawl.dev`）。
</Note>

当前运行时行为：

- `tools.web.fetch.provider` 会显式选择获取回退提供商。
- 如果省略 `provider`，OpenClaw 会从可用凭证中自动检测第一个可用的 web-fetch
  提供商。目前内置的提供商是 Firecrawl。
- 如果禁用了 Readability，`web_fetch` 会直接跳到所选
  提供商回退。如果没有可用提供商，它会以封闭失败的方式结束。

## 限制与安全性

- `maxChars` 会被限制到 `tools.web.fetch.maxCharsCap`
- 在解析前，响应体会受 `maxResponseBytes` 限制；过大的
  响应会被截断，并附带警告
- 私有/内部主机名会被阻止
- 重定向会被检查，并受 `maxRedirects` 限制
- `web_fetch` 采用尽力而为模式——某些网站需要使用 [Web Browser](/zh-CN/tools/browser)

## 工具配置档

如果你使用工具配置档或 allowlist，请添加 `web_fetch` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_fetch"],
    // 或：allow: ["group:web"]  （包含 web_fetch、web_search 和 x_search）
  },
}
```

## 相关内容

- [Web Search](/zh-CN/tools/web) —— 使用多个提供商搜索网页
- [Web Browser](/zh-CN/tools/browser) —— 用于重度依赖 JS 网站的完整浏览器自动化
- [Firecrawl](/zh-CN/tools/firecrawl) —— Firecrawl 搜索和抓取工具
