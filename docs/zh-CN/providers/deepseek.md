---
read_when:
    - 你想在 OpenClaw 中使用 DeepSeek
    - 你需要 API key 环境变量或 CLI 认证方式选择
summary: DeepSeek 设置（认证 + 模型选择）
title: DeepSeek
x-i18n:
    generated_at: "2026-04-23T20:59:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) 提供强大的 AI 模型，并带有与 OpenAI 兼容的 API。

| 属性 | 值 |
| -------- | -------------------------- |
| 提供商 | `deepseek` |
| 认证 | `DEEPSEEK_API_KEY` |
| API | 与 OpenAI 兼容 |
| Base URL | `https://api.deepseek.com` |

## 快速开始

<Steps>
  <Step title="获取你的 API key">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建一个 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    这会提示你输入 API key，并将 `deepseek/deepseek-chat` 设置为默认模型。

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非交互式设置">
    对于脚本化或无头安装，请直接传入所有标志：

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
如果 Gateway 网关以守护进程方式运行（launchd / systemd），请确保 `DEEPSEEK_API_KEY`
对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过
`env.shellEnv` 提供）。
</Warning>

## 内置目录

| 模型引用 | 名称 | 输入 | 上下文 | 最大输出 | 说明 |
| ---------------------------- | ----------------- | ----- | ------- | ---------- | ------------------------------------------------- |
| `deepseek/deepseek-chat` | DeepSeek Chat | text | 131,072 | 8,192 | 默认模型；DeepSeek V3.2 非思考界面 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072 | 65,536 | 启用推理的 V3.2 界面 |

<Tip>
目前源码中，这两个内置模型都声明支持流式传输用量兼容性。
</Tip>

## 配置示例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>
