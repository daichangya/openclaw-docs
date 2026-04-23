---
read_when:
    - 你想用一个 API key 访问多个 LLM】【。analysis to=functions.read commentary  六和彩json 765  content omitted due to length?
    - 你想在 OpenClaw 中通过 Kilo Gateway 运行模型
summary: 在 OpenClaw 中使用 Kilo Gateway 的统一 API 访问多种模型
title: Kilocode
x-i18n:
    generated_at: "2026-04-23T21:00:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 413366f6d9668beffea4c799f18fa81e3cf2ed44e9ba08e105791417f6a275b4
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway 提供一个**统一 API**，可通过单一
端点和 API key 将请求路由到多个模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

| 属性 | 值 |
| -------- | ---------------------------------- |
| 提供商 | `kilocode` |
| 认证 | `KILOCODE_API_KEY` |
| API | OpenAI 兼容 |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## 入门指南

<Steps>
  <Step title="创建账户">
    前往 [app.kilo.ai](https://app.kilo.ai)，登录或创建账户，然后进入 API Keys 页面生成一个新 key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    或直接设置环境变量：

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## 默认模型

默认模型是 `kilocode/kilo/auto`，这是一个由 Kilo Gateway 管理的
提供商自有智能路由模型。

<Note>
OpenClaw 将 `kilocode/kilo/auto` 视为稳定的默认引用，但不会
公布该路由背后从任务到上游模型的源码支持映射。`kilocode/kilo/auto` 背后的精确
上游路由由 Kilo Gateway 拥有，而不是在 OpenClaw 中硬编码。
</Note>

## 可用模型

OpenClaw 会在启动时从 Kilo Gateway 动态发现可用模型。使用
`/models kilocode` 可查看你的账户可用的完整模型列表。

Gateway 上任何可用模型都可以通过 `kilocode/` 前缀使用：

| 模型引用 | 说明 |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto` | 默认 —— 智能路由 |
| `kilocode/anthropic/claude-sonnet-4` | 通过 Kilo 使用 Anthropic |
| `kilocode/openai/gpt-5.5` | 通过 Kilo 使用 OpenAI |
| `kilocode/google/gemini-3-pro-preview` | 通过 Kilo 使用 Google |
| ...以及更多 | 使用 `/models kilocode` 列出全部模型 |

<Tip>
启动时，OpenClaw 会查询 `GET https://api.kilo.ai/api/gateway/models`，并将
发现到的模型优先合并到静态回退目录之前。内置回退始终
包含 `kilocode/kilo/auto`（`Kilo Auto`），并带有 `input: ["text", "image"]`、
`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`。
</Tip>

## 配置示例

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="传输与兼容性">
    源码文档中将 Kilo Gateway 视为与 OpenRouter 兼容，因此它会保留在
    代理风格的 OpenAI 兼容路径上，而不是使用原生 OpenAI 请求整形。

    - 由 Gemini 支持的 Kilo 引用仍保留在代理式 Gemini 路径上，因此 OpenClaw 会在此路径中保留
      Gemini thought-signature 清理，而不会启用原生 Gemini
      replay 校验或 bootstrap 重写。
    - Kilo Gateway 底层使用 Bearer token，并以你的 API key 作为凭证。

  </Accordion>

  <Accordion title="流包装器与 reasoning">
    Kilo 的共享流包装器会添加提供商应用请求头，并为受支持的具体模型引用规范化
    代理 reasoning 负载。

    <Warning>
    `kilocode/kilo/auto` 以及其他不支持代理 reasoning 的提示会跳过 reasoning
    注入。如果你需要 reasoning 支持，请使用具体模型引用，例如
    `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="故障排除">
    - 如果启动时模型发现失败，OpenClaw 会回退到内置静态目录，其中包含 `kilocode/kilo/auto`。
    - 请确认你的 API key 有效，并且你的 Kilo 账户已启用所需模型。
    - 当 Gateway 网关作为守护进程运行时，请确保 `KILOCODE_API_KEY` 对该进程可见（例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    如何选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 仪表板、API key 和账户管理。
  </Card>
</CardGroup>
