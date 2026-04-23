---
read_when:
    - 你想让 OpenClaw 连接到本地 inferrs 服务器运行
    - 你正在通过 inferrs 提供 Gemma 或其他模型 ծառայ务
    - 你需要 OpenClaw 与 inferrs 兼容所需的精确标志
summary: 通过 inferrs（兼容 OpenAI 的本地服务器）运行 OpenClaw
title: Inferrs
x-i18n:
    generated_at: "2026-04-23T23:02:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) 可以通过兼容 OpenAI 的
`/v1` API 提供本地模型服务。OpenClaw 可通过通用的
`openai-completions` 路径与 `inferrs` 配合使用。

目前，最好将 `inferrs` 视为一个自定义的自托管兼容 OpenAI 后端，而不是专门的 OpenClaw 提供商插件。

## 快速开始

<Steps>
  <Step title="使用模型启动 inferrs">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="验证服务器可访问">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="添加 OpenClaw 提供商条目">
    添加一个显式的提供商条目，并将默认模型指向它。完整示例请参见下方配置。
  </Step>
</Steps>

## 完整配置示例

此示例在本地 `inferrs` 服务器上使用 Gemma 4。

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B（inferrs）",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="为什么 requiresStringContent 很重要">
    某些 `inferrs` Chat Completions 路由仅接受字符串形式的
    `messages[].content`，而不接受结构化 content-part 数组。

    <Warning>
    如果 OpenClaw 运行失败，并出现如下错误：

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    请在模型条目中设置 `compat.requiresStringContent: true`。
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw 会在发送请求前，将纯文本内容部分展平为普通字符串。

  </Accordion>

  <Accordion title="Gemma 和工具 schema 注意事项">
    某些当前的 `inferrs` + Gemma 组合可以接受较小的直接
    `/v1/chat/completions` 请求，但仍会在完整的 OpenClaw 智能体运行时轮次中失败。

    如果发生这种情况，请先尝试：

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    这会禁用该模型的 OpenClaw 工具 schema 接口，并可减轻对更严格的本地后端造成的提示压力。

    如果很小的直接请求仍然可行，但正常的 OpenClaw 智能体轮次仍继续在 `inferrs` 内部崩溃，那么剩余问题通常属于上游模型/服务器行为，而不是 OpenClaw 的传输层问题。

  </Accordion>

  <Accordion title="手动冒烟测试">
    配置完成后，请同时测试两个层面：

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    如果第一条命令成功而第二条失败，请查看下方的故障排除部分。

  </Accordion>

  <Accordion title="代理风格行为">
    `inferrs` 被视为一个代理风格的兼容 OpenAI `/v1` 后端，而不是原生 OpenAI 端点。

    - 不适用原生仅限 OpenAI 的请求塑形
    - 不支持 `service_tier`、不支持 Responses `store`、不支持提示缓存提示，也不支持
      OpenAI 推理兼容负载塑形
    - 不会在自定义 `inferrs` base URL 上注入隐藏的 OpenClaw 归属 headers
      （`originator`、`version`、`User-Agent`）

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="curl /v1/models 失败">
    `inferrs` 没有运行、无法访问，或者没有绑定到预期的
    host/port。请确认服务器已启动，并正在监听你配置的地址。
  </Accordion>

  <Accordion title="messages[].content 需要是字符串">
    请在模型条目中设置 `compat.requiresStringContent: true`。详情请参见上方
    `requiresStringContent` 一节。
  </Accordion>

  <Accordion title="直接 /v1/chat/completions 调用成功，但 openclaw infer model run 失败">
    请尝试设置 `compat.supportsTools: false` 以禁用工具 schema 接口。
    参见上方 Gemma 工具 schema 注意事项。
  </Accordion>

  <Accordion title="inferrs 在更大的智能体轮次中仍然崩溃">
    如果 OpenClaw 已不再出现 schema 错误，但 `inferrs` 在较大的
    智能体轮次中仍然崩溃，请将其视为上游 `inferrs` 或模型的限制。请减轻提示压力，或切换到其他本地后端或模型。
  </Accordion>
</AccordionGroup>

<Tip>
如需通用帮助，请参见 [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="本地模型" href="/zh-CN/gateway/local-models" icon="server">
    让 OpenClaw 连接本地模型服务器运行。
  </Card>
  <Card title="Gateway 网关故障排除" href="/zh-CN/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    调试那些探针通过、但智能体运行失败的本地兼容 OpenAI 后端。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
</CardGroup>
