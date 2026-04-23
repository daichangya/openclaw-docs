---
read_when:
    - 你想通过 LiteLLM proxy 路由 OpenClaw
    - 你需要通过 LiteLLM 实现成本跟踪、日志记录或模型路由
summary: 通过 LiteLLM Proxy 运行 OpenClaw，以实现统一模型访问和成本跟踪
title: LiteLLM
x-i18n:
    generated_at: "2026-04-23T21:00:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) 是一个开源 LLM 网关，为 100+ 模型提供商提供统一 API。通过 LiteLLM 路由 OpenClaw，可以获得集中式成本跟踪、日志记录，以及在无需修改 OpenClaw 配置的情况下切换后端的灵活性。

<Tip>
**为什么要将 LiteLLM 与 OpenClaw 配合使用？**

- **成本跟踪** —— 精确查看 OpenClaw 在所有模型上的花费
- **模型路由** —— 无需更改配置即可在 Claude、GPT-4、Gemini、Bedrock 之间切换
- **虚拟密钥** —— 为 OpenClaw 创建带消费限制的密钥
- **日志记录** —— 用于调试的完整请求/响应日志
- **回退** —— 当主提供商不可用时自动故障切换

</Tip>

## 快速开始

<Tabs>
  <Tab title="新手引导（推荐）">
    **最适合：** 最快获得可用 LiteLLM 配置的路径。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="手动设置">
    **最适合：** 希望完全控制安装和配置。

    <Steps>
      <Step title="启动 LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="让 OpenClaw 指向 LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        就这样。OpenClaw 现在会通过 LiteLLM 路由。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置

### 环境变量

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 配置文件

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="虚拟密钥">
    为 OpenClaw 创建一个带消费限制的专用密钥：

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    将生成的密钥用作 `LITELLM_API_KEY`。

  </Accordion>

  <Accordion title="模型路由">
    LiteLLM 可以将模型请求路由到不同后端。在你的 LiteLLM `config.yaml` 中进行配置：

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw 仍然请求 `claude-opus-4-6` —— 路由由 LiteLLM 负责处理。

  </Accordion>

  <Accordion title="查看使用量">
    查看 LiteLLM 的仪表盘或 API：

    ```bash
    # 密钥信息
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # 消费日志
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy 行为说明">
    - LiteLLM 默认运行在 `http://localhost:4000`
    - OpenClaw 会通过 LiteLLM 的 OpenAI 兼容 `/v1`
      代理端点进行连接
    - 通过 LiteLLM 时，不会应用 OpenAI 原生专属请求整形：
      没有 `service_tier`，没有 Responses `store`，没有提示词缓存提示，也没有
      OpenAI 推理兼容载荷整形
    - 在自定义 LiteLLM base URL 上，不会注入
      隐藏的 OpenClaw 归因 headers（`originator`、`version`、`User-Agent`）
  </Accordion>
</AccordionGroup>

<Note>
有关通用提供商配置和故障切换行为，请参见 [模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="LiteLLM 文档" href="https://docs.litellm.ai" icon="book">
    官方 LiteLLM 文档和 API 参考。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障切换行为概览。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
</CardGroup>
