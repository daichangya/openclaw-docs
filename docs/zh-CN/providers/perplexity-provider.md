---
read_when:
    - 你想将 Perplexity 配置为 Web 搜索提供商
    - 你需要配置 Perplexity API 密钥或 OpenRouter 代理设置
summary: Perplexity Web 搜索提供商设置（API 密钥、搜索模式、过滤）
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T18:10:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Perplexity 插件通过 Perplexity Search API 或经由 OpenRouter 的 Perplexity Sonar 提供 Web 搜索能力。

<Note>
本页介绍的是 Perplexity **提供商**设置。关于 Perplexity **工具**（即智能体如何使用它），请参见 [Perplexity 工具](/zh-CN/tools/perplexity-search)。
</Note>

| 属性 | 值 |
| ----------- | ---------------------------------------------------------------------- |
| 类型 | Web 搜索提供商（不是模型提供商） |
| 认证 | `PERPLEXITY_API_KEY`（直连）或 `OPENROUTER_API_KEY`（通过 OpenRouter） |
| 配置路径 | `plugins.entries.perplexity.config.webSearch.apiKey` |

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
    运行交互式 Web 搜索配置流程：

    ```bash
    openclaw configure --section web
    ```

    或直接设置密钥：

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="开始搜索">
    一旦配置好密钥，智能体会自动使用 Perplexity 进行 Web 搜索。
    无需其他额外步骤。
  </Step>
</Steps>

## 搜索模式

插件会根据 API 密钥前缀自动选择传输方式：

<Tabs>
  <Tab title="原生 Perplexity API（pplx-）">
    当你的密钥以 `pplx-` 开头时，OpenClaw 会使用原生 Perplexity Search
    API。这种传输方式返回结构化结果，并支持域名、语言和日期过滤（见下方过滤选项）。
  </Tab>
  <Tab title="OpenRouter / Sonar（sk-or-）">
    当你的密钥以 `sk-or-` 开头时，OpenClaw 会通过 OpenRouter 路由，并使用
    Perplexity Sonar 模型。这种传输方式返回带引用的 AI 综合答案。
  </Tab>
</Tabs>

| 密钥前缀 | 传输方式 | 功能 |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-` | 原生 Perplexity Search API | 结构化结果、域名/语言/日期过滤 |
| `sk-or-` | OpenRouter（Sonar） | 带引用的 AI 综合答案 |

## 原生 API 过滤

<Note>
过滤选项仅在使用原生 Perplexity API
（`pplx-` 密钥）时可用。OpenRouter/Sonar 搜索不支持这些参数。
</Note>

使用原生 Perplexity API 时，搜索支持以下过滤器：

| 过滤器 | 说明 | 示例 |
| -------------- | -------------------------------------- | ----------------------------------- |
| 国家 | 2 位国家代码 | `us`、`de`、`jp` |
| 语言 | ISO 639-1 语言代码 | `en`、`fr`、`zh` |
| 日期范围 | 时间新近度窗口 | `day`、`week`、`month`、`year` |
| 域名过滤 | 允许列表或拒绝列表（最多 20 个域名） | `example.com` |
| 内容预算 | 每次响应 / 每个页面的 token 限制 | `max_tokens`、`max_tokens_per_page` |

## 高级配置

<AccordionGroup>
  <Accordion title="守护进程的环境变量">
    如果 OpenClaw Gateway 网关作为守护进程运行（launchd/systemd），请确保
    `PERPLEXITY_API_KEY` 对该进程可用。

    <Warning>
    仅设置在 `~/.profile` 中的密钥不会对 launchd/systemd
    守护进程可见，除非显式导入该环境。请将密钥设置到
    `~/.openclaw/.env` 或通过 `env.shellEnv` 设置，以确保 Gateway 网关进程能够
    读取它。
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter 代理设置">
    如果你更希望通过 OpenRouter 路由 Perplexity 搜索，请设置
    `OPENROUTER_API_KEY`（前缀为 `sk-or-`），而不是原生 Perplexity 密钥。
    OpenClaw 会检测此前缀，并自动切换到 Sonar 传输方式。

    <Tip>
    如果你已经拥有 OpenRouter 账户，并希望在多个提供商之间统一计费，
    OpenRouter 传输方式会很有用。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Perplexity 搜索工具" href="/zh-CN/tools/perplexity-search" icon="magnifying-glass">
    智能体如何调用 Perplexity 搜索并解释结果。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整配置参考，包括插件条目。
  </Card>
</CardGroup>
