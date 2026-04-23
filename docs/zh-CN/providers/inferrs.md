---
read_when:
    - 你想让 OpenClaw 对接本地 inferrs 服务器运行
    - 你正通过 inferrs 提供 Gemma 或其他模型服务
    - 你需要用于 inferrs 的精确 OpenClaw compat 标志
summary: 通过 inferrs（OpenAI 兼容本地服务器）运行 OpenClaw
title: Inferrs
x-i18n:
    generated_at: "2026-04-23T21:00:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c0926be4b599479595dd322eb0b6de02fee4b3ff07a7360d09e9f2527df9d02
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) 可以通过
OpenAI 兼容的 `/v1` API 提供本地模型服务。OpenClaw 可通过通用的
`openai-completions` 路径与 `inferrs` 配合使用。

当前最好将 `inferrs` 视为一个自定义的自托管 OpenAI 兼容
后端，而不是专用的 OpenClaw 提供商插件。

## 入门指南

<Steps>
  <Step title="使用某个模型启动 inferrs">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="验证服务器可达">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="添加一个 OpenClaw 提供商条目">
    添加一个显式提供商条目，并将你的默认模型指向它。完整配置示例见下文。
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
            name: "Gemma 4 E2B (inferrs)",
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
    某些 `inferrs` Chat Completions 路由只接受字符串形式的
    `messages[].content`，而不接受结构化内容片段数组。

    <Warning>
    如果 OpenClaw 运行失败，并出现类似下面的错误：

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

    OpenClaw 会在发送请求前，将纯文本内容片段展平成普通字符串。

  </Accordion>

  <Accordion title="Gemma 与工具 schema 的注意事项">
    某些当前的 `inferrs` + Gemma 组合可以接受较小的直接
    `/v1/chat/completions` 请求，但在完整 OpenClaw 智能体运行时
    轮次中仍会失败。

    如果发生这种情况，请先尝试：

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    这会禁用该模型的 OpenClaw 工具 schema 界面，并可减轻对更严格本地后端的提示词
    压力。

    如果很小的直接请求仍然可用，但正常的 OpenClaw 智能体轮次继续在
    `inferrs` 内部崩溃，那么剩余问题通常是上游模型/服务器行为，
    而不是 OpenClaw 的传输层。

  </Accordion>

  <Accordion title="手动冒烟测试">
    配置完成后，请测试这两层：

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

    如果第一条命令成功，而第二条失败，请查看下面的故障排除部分。

  </Accordion>

  <Accordion title="代理式行为">
    `inferrs` 被视为代理式的 OpenAI 兼容 `/v1` 后端，而不是原生
    OpenAI 端点。

    - 原生 OpenAI 专用的请求整形在这里不适用
    - 不支持 `service_tier`、不支持 Responses `store`、不支持 prompt-cache 提示，也不支持
      OpenAI 推理兼容载荷整形
    - 在自定义 `inferrs` base URL 上，不会注入隐藏的 OpenClaw 归属标头（`originator`、`version`、`User-Agent`）

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="curl /v1/models 失败">
    `inferrs` 未运行、不可达，或未绑定到预期的
    主机/端口。请确保服务器已启动，并监听在你
    配置的地址上。
  </Accordion>

  <Accordion title="messages[].content 需要字符串">
    请在模型条目中设置 `compat.requiresStringContent: true`。详见上面的
    `requiresStringContent` 部分。
  </Accordion>

  <Accordion title="直接调用 /v1/chat/completions 能通过，但 openclaw infer model run 失败">
    尝试设置 `compat.supportsTools: false` 以禁用工具 schema 界面。
    详见上面的 Gemma 工具 schema 注意事项。
  </Accordion>

  <Accordion title="inferrs 在更大的智能体轮次中仍然崩溃">
    如果 OpenClaw 不再收到 schema 错误，但 `inferrs` 在更大的
    智能体轮次中仍然崩溃，请将其视为上游 `inferrs` 或模型限制。请减小
    提示词压力，或切换到不同的本地后端或模型。
  </Accordion>
</AccordionGroup>

<Tip>
有关一般帮助，请参见 [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Tip>

## 另请参见

<CardGroup cols={2}>
  <Card title="本地模型" href="/zh-CN/gateway/local-models" icon="server">
    让 OpenClaw 对接本地模型服务器运行。
  </Card>
  <Card title="Gateway 网关故障排除" href="/zh-CN/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    调试那些探测通过但智能体运行失败的本地 OpenAI 兼容后端。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障切换行为概览。
  </Card>
</CardGroup>
