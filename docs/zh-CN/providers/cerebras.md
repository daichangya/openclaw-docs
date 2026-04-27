---
read_when:
    - 你想在 OpenClaw 中使用 Cerebras
    - 你需要 Cerebras API 密钥环境变量或 CLI 认证选项
summary: Cerebras 设置（认证 + 模型选择）
title: Cerebras
x-i18n:
    generated_at: "2026-04-27T09:30:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 15
---

[Cerebras](https://www.cerebras.ai) 提供高速、兼容 OpenAI 的推理服务。

| 属性 | 值 |
| -------- | ---------------------------- |
| 提供商 | `cerebras` |
| 认证 | `CEREBRAS_API_KEY` |
| API | 兼容 OpenAI |
| Base URL | `https://api.cerebras.ai/v1` |

## 入门指南

<Steps>
  <Step title="获取 API 密钥">
    在 [Cerebras Cloud Console](https://cloud.cerebras.ai) 中创建一个 API 密钥。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 内置目录

OpenClaw 为公共的兼容 OpenAI 端点内置了一个静态 Cerebras 目录：

| Model ref                                 | 名称                 | 备注 |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 默认模型；预览版 reasoning 模型 |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 生产级 reasoning 模型 |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 预览版非 reasoning 模型 |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 生产级速度优先模型 |

<Warning>
Cerebras 将 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 标记为预览模型，并且文档说明 `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` 将于 2026 年 5 月 27 日弃用。在将它们用于生产环境之前，请查看 Cerebras 的 supported-models 页面。
</Warning>

## 手动配置

内置插件通常意味着你只需要 API 密钥。若你想覆盖模型元数据，请使用显式的
`models.providers.cerebras` 配置：

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
如果 Gateway 网关以守护进程方式运行（launchd/systemd），请确保 `CEREBRAS_API_KEY`
对该进程可用，例如放在 `~/.openclaw/.env` 中，或通过
`env.shellEnv` 提供。
</Note>
