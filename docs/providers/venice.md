---
read_when:
    - 你希望在 OpenClaw 中使用注重隐私的推理功能
    - 你希望获得 Venice AI 的设置指南
summary: 在 OpenClaw 中使用 Venice AI 注重隐私的模型
title: Venice AI
x-i18n:
    generated_at: "2026-04-25T18:27:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

Venice AI 提供**注重隐私的 AI 推理**，支持无审查模型，并可通过其匿名代理访问主流专有模型。所有推理默认都是私密的——不会用你的数据进行训练，也不会记录日志。

## 为什么在 OpenClaw 中使用 Venice

- **私密推理**：适用于开源模型（不记录日志）。
- **无审查模型**：在你需要时可直接使用。
- **匿名访问**专有模型（Opus/GPT/Gemini）：在你更看重质量时可使用。
- 与 OpenAI 兼容的 `/v1` 端点。

## 隐私模式

Venice 提供两种隐私级别——理解这一点对于选择模型至关重要：

| 模式 | 描述 | 模型 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **私密** | 完全私密。提示词/响应**绝不会被存储或记录**。仅为临时使用。 | Llama、Qwen、DeepSeek、Kimi、MiniMax、Venice Uncensored 等。 |
| **匿名化** | 通过 Venice 代理并移除元数据。底层提供商（OpenAI、Anthropic、Google、xAI）会看到匿名化后的请求。 | Claude、GPT、Gemini、Grok |

<Warning>
匿名化模型**并非**完全私密。Venice 会在转发前移除元数据，但底层提供商（OpenAI、Anthropic、Google、xAI）仍会处理该请求。如果你需要完全隐私，请选择**私密**模型。
</Warning>

## 功能

- **注重隐私**：可在“私密”（完全私密）和“匿名化”（代理）模式之间选择
- **无审查模型**：可访问没有内容限制的模型
- **主流模型访问**：可通过 Venice 的匿名代理使用 Claude、GPT、Gemini 和 Grok
- **与 OpenAI 兼容的 API**：标准 `/v1` 端点，便于集成
- **流式传输**：所有模型均支持
- **函数调用**：部分模型支持（请检查模型能力）
- **视觉**：具备视觉能力的模型支持
- **无硬性速率限制**：极端使用情况下可能会应用公平使用限流

## 入门指南

<Steps>
  <Step title="获取你的 API 密钥">
    1. 在 [venice.ai](https://venice.ai) 注册
    2. 前往**Settings > API Keys > Create new key**
    3. 复制你的 API 密钥（格式：`vapi_xxxxxxxxxxxx`）
  </Step>
  <Step title="配置 OpenClaw">
    选择你偏好的设置方式：

    <Tabs>
      <Tab title="交互式（推荐）">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        这将会：
        1. 提示你输入 API 密钥（或使用已有的 `VENICE_API_KEY`）
        2. 显示所有可用的 Venice 模型
        3. 让你选择默认模型
        4. 自动配置该提供商
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

设置完成后，OpenClaw 会显示所有可用的 Venice 模型。请根据你的需求进行选择：

- **默认模型**：`venice/kimi-k2-5`，提供强大的私密推理能力和视觉能力。
- **高能力选项**：`venice/claude-opus-4-6`，是 Venice 匿名化路径中能力最强的选项。
- **隐私**：如需完全私密推理，请选择“私密”模型。
- **能力**：如需通过 Venice 的代理访问 Claude、GPT、Gemini，请选择“匿名化”模型。

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
请使用下表为你的使用场景选择合适的模型。

| 使用场景 | 推荐模型 | 原因 |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **通用聊天（默认）** | `kimi-k2-5` | 强大的私密推理能力和视觉能力 |
| **整体质量最佳** | `claude-opus-4-6` | Venice 匿名化选项中能力最强 |
| **隐私 + 编码** | `qwen3-coder-480b-a35b-instruct` | 具有大上下文的私密编程模型 |
| **私密视觉** | `kimi-k2-5` | 在不离开私密模式的情况下支持视觉 |
| **快速 + 低成本** | `qwen3-4b` | 轻量级推理模型 |
| **复杂私密任务** | `deepseek-v3.2` | 推理能力强，但不支持 Venice 工具 |
| **无审查** | `venice-uncensored` | 无内容限制 |

</Tip>

## DeepSeek V4 重放行为

如果 Venice 提供了 DeepSeek V4 模型，例如 `venice/deepseek-v4-pro` 或 `venice/deepseek-v4-flash`，当代理省略必需的 DeepSeek V4 `reasoning_content` 时，OpenClaw 会在智能体工具调用轮次中补入所需的 `reasoning_content` 重放占位符。Venice 会拒绝 DeepSeek 原生的顶层 `thinking` 控制，因此 OpenClaw 将该提供商特定的重放修复与原生 DeepSeek provider 的 thinking 控制分开处理。

## 内置目录（共 41 个）

<AccordionGroup>
  <Accordion title="私密模型（26 个）——完全私密，不记录日志">
    | 模型 ID | 名称 | 上下文 | 功能 |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | 默认、推理、视觉 |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | 推理 |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | 通用 |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | 通用 |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | 通用，工具已禁用 |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | 推理 |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | 通用 |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | 编码 |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | 编码 |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | 推理、视觉 |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | 通用 |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B（视觉）             | 256k    | 视觉 |
    | `qwen3-4b`                             | Venice Small（Qwen3 4B）            | 32k     | 快速、推理 |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | 推理，工具已禁用 |
    | `venice-uncensored`                    | Venice Uncensored（Dolphin-Mistral） | 32k     | 无审查，工具已禁用 |
    | `mistral-31-24b`                       | Venice Medium（Mistral）            | 128k    | 视觉 |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | 视觉 |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | 通用 |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | 通用 |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | 推理 |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | 通用 |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | 推理 |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | 推理 |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | 推理 |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | 推理 |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | 推理 |
  </Accordion>

  <Accordion title="匿名化模型（15 个）——通过 Venice 代理">
    | 模型 ID | 名称 | 上下文 | 功能 |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6（通过 Venice）   | 1M      | 推理、视觉 |
    | `claude-opus-4-5`               | Claude Opus 4.5（通过 Venice）   | 198k    | 推理、视觉 |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6（通过 Venice） | 1M      | 推理、视觉 |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5（通过 Venice） | 198k    | 推理、视觉 |
    | `openai-gpt-54`                 | GPT-5.4（通过 Venice）           | 1M      | 推理、视觉 |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex（通过 Venice）     | 400k    | 推理、视觉、编码 |
    | `openai-gpt-52`                 | GPT-5.2（通过 Venice）           | 256k    | 推理 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex（通过 Venice）     | 256k    | 推理、视觉、编码 |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o（通过 Venice）            | 128k    | 视觉 |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini（通过 Venice）       | 128k    | 视觉 |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro（通过 Venice）    | 1M      | 推理、视觉 |
    | `gemini-3-pro-preview`          | Gemini 3 Pro（通过 Venice）      | 198k    | 推理、视觉 |
    | `gemini-3-flash-preview`        | Gemini 3 Flash（通过 Venice）    | 256k    | 推理、视觉 |
    | `grok-41-fast`                  | Grok 4.1 Fast（通过 Venice）     | 1M      | 推理、视觉 |
    | `grok-code-fast-1`              | Grok Code Fast 1（通过 Venice）  | 256k    | 推理、编码 |
  </Accordion>
</AccordionGroup>

## 模型发现

当设置了 `VENICE_API_KEY` 时，OpenClaw 会自动从 Venice API 发现模型。如果 API 无法访问，则会回退到静态目录。

`/models` 端点是公开的（列出模型时无需认证），但推理需要有效的 API 密钥。

## 流式传输和工具支持

| 功能 | 支持情况 |
| -------------------- | ---------------------------------------------------- |
| **流式传输** | 所有模型 |
| **函数调用** | 大多数模型（请检查 API 中的 `supportsFunctionCalling`） |
| **视觉/图像** | 标有 “Vision” 功能的模型 |
| **JSON 模式** | 通过 `response_format` 支持 |

## 定价

Venice 使用基于积分的计费系统。请查看 [venice.ai/pricing](https://venice.ai/pricing) 了解当前费率：

- **私密模型**：通常成本更低
- **匿名化模型**：与直连 API 定价相近，另加少量 Venice 费用

### Venice（匿名化）与直连 API 对比

| 方面 | Venice（匿名化） | 直连 API |
| ------------ | ----------------------------- | ------------------- |
| **隐私** | 元数据已移除，匿名化 | 关联到你的账户 |
| **延迟** | +10-50ms（代理） | 直连 |
| **功能** | 支持大多数功能 | 完整功能 |
| **计费** | Venice 积分 | 提供商计费 |

## 使用示例

```bash
# 使用默认私密模型
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# 通过 Venice 使用 Claude Opus（匿名化）
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# 使用无审查模型
openclaw agent --model venice/venice-uncensored --message "Draft options"

# 使用视觉模型处理图像
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# 使用编程模型
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## 故障排除

<AccordionGroup>
  <Accordion title="API 密钥无法识别">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    请确保该密钥以 `vapi_` 开头。

  </Accordion>

  <Accordion title="模型不可用">
    Venice 模型目录会动态更新。运行 `openclaw models list` 可查看当前可用模型。某些模型可能只是暂时离线。
  </Accordion>

  <Accordion title="连接问题">
    Venice API 地址为 `https://api.venice.ai/api/v1`。请确保你的网络允许 HTTPS 连接。
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
    选择提供商、模型引用和故障切换行为。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI 首页和账户注册。
  </Card>
  <Card title="API 文档" href="https://docs.venice.ai" icon="book">
    Venice API 参考和开发者文档。
  </Card>
  <Card title="定价" href="https://venice.ai/pricing" icon="credit-card">
    当前 Venice 积分费率和套餐。
  </Card>
</CardGroup>
