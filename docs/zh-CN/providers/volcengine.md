---
read_when:
    - 你想在 OpenClaw 中使用火山引擎或 Doubao 模型
    - 你需要设置 Volcengine API 密钥
summary: 火山引擎设置（Doubao 模型、通用端点 + 编码端点）
title: Volcengine（Doubao）
x-i18n:
    generated_at: "2026-04-23T06:42:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine（Doubao）

Volcengine 提供商可访问托管在火山引擎上的 Doubao 模型和第三方模型，并为通用工作负载和编码工作负载提供独立端点。

| 详情 | 值 |
| --------- | --------------------------------------------------- |
| 提供商 | `volcengine`（通用）+ `volcengine-plan`（编码） |
| 认证 | `VOLCANO_ENGINE_API_KEY` |
| API | 兼容 OpenAI |

## 入门指南

<Steps>
  <Step title="设置 API 密钥">
    运行交互式新手引导：

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    这会通过一个 API 密钥同时注册通用提供商（`volcengine`）和编码提供商（`volcengine-plan`）。

  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
对于非交互式设置（CI、脚本），可直接传入密钥：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## 提供商和端点

| 提供商 | 端点 | 用途 |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine` | `ark.cn-beijing.volces.com/api/v3` | 通用模型 |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 编码模型 |

<Note>
这两个提供商都通过同一个 API 密钥配置。设置时会自动同时注册。
</Note>

## 可用模型

<Tabs>
  <Tab title="通用（volcengine）">
    | 模型引用 | 名称 | 输入 | 上下文 |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228` | Doubao Seed 1.8 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127` | Kimi K2.5 | text, image | 256,000 |
    | `volcengine/glm-4-7-251222` | GLM 4.7 | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201` | DeepSeek V3.2 | text, image | 128,000 |
  </Tab>
  <Tab title="编码（volcengine-plan）">
    | 模型引用 | 名称 | 输入 | 上下文 |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest` | Ark Coding Plan | text | 256,000 |
    | `volcengine-plan/doubao-seed-code` | Doubao Seed Code | text | 256,000 |
    | `volcengine-plan/glm-4.7` | GLM 4.7 Coding | text | 200,000 |
    | `volcengine-plan/kimi-k2-thinking` | Kimi K2 Thinking | text | 256,000 |
    | `volcengine-plan/kimi-k2.5` | Kimi K2.5 Coding | text | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text | 256,000 |
  </Tab>
</Tabs>

## 高级说明

<AccordionGroup>
  <Accordion title="新手引导后的默认模型">
    `openclaw onboard --auth-choice volcengine-api-key` 当前会将
    `volcengine-plan/ark-code-latest` 设为默认模型，同时也会注册
    通用 `volcengine` 目录。
  </Accordion>

  <Accordion title="模型选择器回退行为">
    在新手引导/配置模型选择期间，Volcengine 认证选项会优先显示
    `volcengine/*` 和 `volcengine-plan/*` 条目。如果这些模型尚未
    加载，OpenClaw 会回退到未过滤的目录，而不是显示一个空的、
    按提供商限定的选择器。
  </Accordion>

  <Accordion title="守护进程的环境变量">
    如果 Gateway 网关以守护进程方式运行（launchd/systemd），请确保
    `VOLCANO_ENGINE_API_KEY` 对该进程可用（例如放在
    `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

<Warning>
当 OpenClaw 作为后台服务运行时，你在交互式 shell 中设置的环境变量
不会被自动继承。请参见上面的守护进程说明。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
  <Card title="常见问题" href="/zh-CN/help/faq" icon="circle-question">
    关于 OpenClaw 设置的常见问题。
  </Card>
</CardGroup>
