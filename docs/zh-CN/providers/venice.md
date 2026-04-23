---
read_when:
    - 你希望在 OpenClaw 中使用注重隐私的推理能力
    - 你需要 Venice AI 设置指南
summary: 在 OpenClaw 中使用 Venice AI 注重隐私的模型
title: Venice AI
x-i18n:
    generated_at: "2026-04-23T21:02:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17597207ea42b246c636b6512015c72040fbb85cc57f00edb81d4c038868a86d
    source_path: providers/venice.md
    workflow: 15
---

Venice AI 提供**注重隐私的 AI 推理**，支持无审查模型，并通过其匿名代理访问主流专有模型。所有推理默认都是私密的——不会用你的数据进行训练，也不会记录日志。

## 为什么在 OpenClaw 中使用 Venice

- 面向开源模型的**私密推理**（不记录日志）。
- 在你需要时可使用**无审查模型**。
- 当质量更重要时，可通过 Venice 的匿名代理**匿名访问**专有模型（Opus/GPT/Gemini）。
- 兼容 OpenAI 的 `/v1` 端点。

## 隐私模式

Venice 提供两种隐私级别——理解这一点是选择模型的关键：

| 模式           | 说明                                                                                                                            | 模型                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **私密**       | 完全私密。提示/回复**永不存储或记录**。临时性。                                                                                 | Llama、Qwen、DeepSeek、Kimi、MiniMax、Venice Uncensored 等   |
| **匿名化**     | 通过 Venice 代理并去除元数据。底层 provider（OpenAI、Anthropic、Google、xAI）会看到匿名化请求。                               | Claude、GPT、Gemini、Grok                                    |

<Warning>
匿名化模型**不是**完全私密的。Venice 会在转发前去除元数据，但底层 provider（OpenAI、Anthropic、Google、xAI）仍会处理请求。如果你需要完全隐私，请选择**私密**模型。
</Warning>

## 功能

- **注重隐私**：可在“私密”（完全私密）和“匿名化”（经代理）模式之间选择
- **无审查模型**：可访问没有内容限制的模型
- **主流模型访问**：通过 Venice 的匿名代理使用 Claude、GPT、Gemini 和 Grok
- **兼容 OpenAI 的 API**：标准 `/v1` 端点，易于集成
- **流式传输**：所有模型都支持
- **函数调用**：部分模型支持（请检查模型能力）
- **视觉**：支持具备视觉能力的模型
- **无硬性速率限制**：极端用量下可能应用公平使用节流

## 入门指南

<Steps>
  <Step title="获取 API 密钥">
    1. 在 [venice.ai](https://venice.ai) 注册
    2. 前往 **Settings > API Keys > Create new key**
    3. 复制你的 API 密钥（格式：`vapi_xxxxxxxxxxxx`）
  </Step>
  <Step title="配置 OpenClaw">
    选择你偏好的设置方式：

    <Tabs>
      <Tab title="交互式（推荐）">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        这会：
        1. 提示输入你的 API 密钥（或使用现有的 `VENICE_API_KEY`）
        2. 显示所有可用的 Venice 模型
        3. 让你选择默认模型
        4. 自动配置 provider
      </Tab>
      <Tab title="环境变量">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="非交互式">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="验证设置">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## 模型选择

完成设置后，OpenClaw 会显示所有可用的 Venice 模型。请根据你的需求选择：

- **默认模型**：`venice/kimi-k2-5`，适合强大的私密 reasoning + 视觉。
- **高能力选项**：`venice/claude-opus-4-6`，适合最强的匿名化 Venice 路径。
- **隐私**：如果你需要完全私密的推理，请选择“私密”模型。
- **能力**：如果你希望通过 Venice 代理访问 Claude、GPT、Gemini，请选择“匿名化”模型。

你可以随时更改默认模型：

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

列出所有可用模型：

```bash
openclaw models list | grep venice
```

你也可以运行 `openclaw configure`，选择 **Model/auth**，然后选择 **Venice AI**。

<Tip>
请使用下表为你的场景选择合适模型。

| 使用场景                    | 推荐模型                         | 原因                                         |
| --------------------------- | -------------------------------- | -------------------------------------------- |
| **通用聊天（默认）**        | `kimi-k2-5`                      | 强大的私密 reasoning + 视觉                  |
| **整体质量最佳**            | `claude-opus-4-6`                | 最强的匿名化 Venice 选项                     |
| **隐私 + 编码**             | `qwen3-coder-480b-a35b-instruct` | 具有大上下文的私密编码模型                   |
| **私密视觉**                | `kimi-k2-5`                      | 支持视觉，且无需离开私密模式                 |
| **快速 + 便宜**             | `qwen3-4b`                       | 轻量级 reasoning 模型                        |
| **复杂私密任务**            | `deepseek-v3.2`                  | 强 reasoning，但无 Venice 工具支持           |
| **无审查**                  | `venice-uncensored`              | 无内容限制                                   |

</Tip>

## 可用模型（共 41 个）

<AccordionGroup>
  <Accordion title="私密模型（26 个）——完全私密，不记录日志">
    | 模型 ID                               | 名称                                | 上下文  | 特性                         |
    | -------------------------------------- | ----------------------------------- | ------- | ---------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | 默认、reasoning、视觉        |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                    |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | 通用                         |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | 通用                         |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | 通用，禁用工具               |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | Reasoning                    |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | 通用                         |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | 编码                         |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | 编码                         |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | Reasoning、视觉              |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | 通用                         |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B（视觉）              | 256k    | 视觉                         |
    | `qwen3-4b`                             | Venice Small（Qwen3 4B）           | 32k     | 快速、reasoning              |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | Reasoning，禁用工具          |
    | `venice-uncensored`                    | Venice Uncensored（Dolphin-Mistral） | 32k   | 无审查，禁用工具             |
    | `mistral-31-24b`                       | Venice Medium（Mistral）           | 128k    | 视觉                         |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | 视觉                         |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | 通用                         |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | 通用                         |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | Reasoning                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | 通用                         |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | Reasoning                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | Reasoning                    |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | Reasoning                    |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | Reasoning                    |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | Reasoning                    |
  </Accordion>

  <Accordion title="匿名化模型（15 个）——通过 Venice 代理">
    | 模型 ID                        | 名称                           | 上下文  | 特性                       |
    | ------------------------------- | ------------------------------ | ------- | -------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6（通过 Venice） | 1M      | Reasoning、视觉            |
    | `claude-opus-4-5`               | Claude Opus 4.5（通过 Venice） | 198k    | Reasoning、视觉            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6（通过 Venice） | 1M    | Reasoning、视觉            |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5（通过 Venice） | 198k  | Reasoning、视觉            |
    | `openai-gpt-54`                 | GPT-5.4（通过 Venice）         | 1M      | Reasoning、视觉            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex（通过 Venice）   | 400k    | Reasoning、视觉、编码      |
    | `openai-gpt-52`                 | GPT-5.2（通过 Venice）         | 256k    | Reasoning                  |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex（通过 Venice）   | 256k    | Reasoning、视觉、编码      |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o（通过 Venice）          | 128k    | 视觉                       |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini（通过 Venice）     | 128k    | 视觉                       |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro（通过 Venice）  | 1M      | Reasoning、视觉            |
    | `gemini-3-pro-preview`          | Gemini 3 Pro（通过 Venice）    | 198k    | Reasoning、视觉            |
    | `gemini-3-flash-preview`        | Gemini 3 Flash（通过 Venice）  | 256k    | Reasoning、视觉            |
    | `grok-41-fast`                  | Grok 4.1 Fast（通过 Venice）   | 1M      | Reasoning、视觉            |
    | `grok-code-fast-1`              | Grok Code Fast 1（通过 Venice）| 256k    | Reasoning、编码            |
  </Accordion>
</AccordionGroup>

## 模型发现

当设置了 `VENICE_API_KEY` 时，OpenClaw 会自动从 Venice API 发现模型。如果 API 不可达，它会回退到静态目录。

`/models` 端点是公开的（列出模型无需认证），但推理需要有效 API 密钥。

## 流式传输和工具支持

| 功能                 | 支持情况                                              |
| -------------------- | ----------------------------------------------------- |
| **流式传输**         | 所有模型                                              |
| **函数调用**         | 大多数模型（请检查 API 中的 `supportsFunctionCalling`） |
| **视觉/图像**        | 带有“Vision”特性的模型                                |
| **JSON 模式**        | 通过 `response_format` 支持                           |

## 定价

Venice 使用基于积分的系统。当前费率请查看 [venice.ai/pricing](https://venice.ai/pricing)：

- **私密模型**：通常成本较低
- **匿名化模型**：与直接 API 定价相近，外加少量 Venice 费用

### Venice（匿名化） vs 直接 API

| 维度         | Venice（匿名化）              | 直接 API             |
| ------------ | ----------------------------- | -------------------- |
| **隐私**     | 去除元数据，匿名化            | 与你的账户绑定       |
| **延迟**     | +10-50ms（代理）              | 直连                 |
| **功能**     | 支持大多数功能                | 完整功能             |
| **计费**     | Venice 积分                   | Provider 计费        |

## 使用示例

```bash
# 使用默认私密模型
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# 通过 Venice 使用 Claude Opus（匿名化）
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# 使用无审查模型
openclaw agent --model venice/venice-uncensored --message "Draft options"

# 使用带图像的视觉模型
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# 使用编码模型
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## 故障排除

<AccordionGroup>
  <Accordion title="API 密钥未被识别">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    请确保该密钥以 `vapi_` 开头。

  </Accordion>

  <Accordion title="模型不可用">
    Venice 模型目录会动态更新。运行 `openclaw models list` 查看当前可用模型。某些模型可能暂时离线。
  </Accordion>

  <Accordion title="连接问题">
    Venice API 位于 `https://api.venice.ai/api/v1`。请确保你的网络允许 HTTPS 连接。
  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="配置文件示例">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 providers、模型引用和故障转移行为。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI 主页和账户注册。
  </Card>
  <Card title="API 文档" href="https://docs.venice.ai" icon="book">
    Venice API 参考和开发者文档。
  </Card>
  <Card title="定价" href="https://venice.ai/pricing" icon="credit-card">
    当前 Venice 积分费率和套餐。
  </Card>
</CardGroup>
