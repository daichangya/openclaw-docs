---
read_when:
    - モデルプロバイダーとしてSyntheticを使いたい場合
    - Synthetic APIキーまたはbase URLの設定が必要な場合
summary: OpenClawでSyntheticのAnthropic互換APIを使用する
title: Synthetic
x-i18n:
    generated_at: "2026-04-05T12:54:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3495bca5cb134659cf6c54e31fa432989afe0cc04f53cf3e3146ce80a5e8af49
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

SyntheticはAnthropic互換エンドポイントを公開しています。OpenClawはこれを
`synthetic` プロバイダーとして登録し、Anthropic Messages APIを使用します。

## クイックセットアップ

1. `SYNTHETIC_API_KEY` を設定します（または以下のウィザードを実行します）。
2. オンボーディングを実行します:

```bash
openclaw onboard --auth-choice synthetic-api-key
```

デフォルトモデルは次に設定されます:

```
synthetic/hf:MiniMaxAI/MiniMax-M2.5
```

## 設定例

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

注: OpenClawのAnthropicクライアントはbase URLに `/v1` を付加するため、
`https://api.synthetic.new/anthropic` を使用してください（`/anthropic/v1` ではありません）。Syntheticが
base URLを変更した場合は、`models.providers.synthetic.baseUrl` を上書きしてください。

## モデルカタログ

以下のすべてのモデルは、コスト `0`（input/output/cache）を使用します。

| Model ID                                               | Context window | Max tokens | Reasoning | Input        |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192000         | 65536      | false     | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256000         | 8192       | true      | text         |
| `hf:zai-org/GLM-4.7`                                   | 198000         | 128000     | false     | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128000         | 8192       | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128000         | 8192       | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128000         | 8192       | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128000         | 8192       | false     | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159000         | 8192       | false     | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128000         | 8192       | false     | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524000         | 8192       | false     | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256000         | 8192       | false     | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256000         | 8192       | true      | text + image |
| `hf:openai/gpt-oss-120b`                               | 128000         | 8192       | false     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256000         | 8192       | false     | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256000         | 8192       | false     | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250000         | 8192       | false     | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128000         | 128000     | false     | text         |
| `hf:zai-org/GLM-4.6`                                   | 198000         | 128000     | false     | text         |
| `hf:zai-org/GLM-5`                                     | 256000         | 128000     | true      | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128000         | 8192       | false     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256000         | 8192       | true      | text         |

## 注記

- モデル参照には `synthetic/<modelId>` を使用します。
- モデルallowlist（`agents.defaults.models`）を有効にする場合は、
  使用予定のすべてのモデルを追加してください。
- プロバイダールールについては [Model providers](/concepts/model-providers) を参照してください。
