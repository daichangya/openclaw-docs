---
read_when:
    - OpenClawでTogether AIを使いたいとき
    - API keyのenv varまたはCLI auth choiceが必要なとき
summary: Together AIのセットアップ（auth + model selection）
title: Together AI
x-i18n:
    generated_at: "2026-04-05T12:54:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22aacbaadf860ce8245bba921dcc5ede9da8fd6fa1bc3cc912551aecc1ba0d71
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) は、Llama、DeepSeek、Kimiなどを含む主要なオープンソースmodelへのアクセスを、統一されたAPI経由で提供します。

- Provider: `together`
- Auth: `TOGETHER_API_KEY`
- API: OpenAI互換
- Base URL: `https://api.together.xyz/v1`

## クイックスタート

1. API keyを設定します（推奨: Gateway用に保存する）:

```bash
openclaw onboard --auth-choice together-api-key
```

2. デフォルトmodelを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## 非対話式の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

これにより、デフォルトmodelとして `together/moonshotai/Kimi-K2.5` が設定されます。

## 環境に関する注

Gatewayをdaemon（launchd/systemd）として実行する場合は、`TOGETHER_API_KEY`
がそのprocessから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
`env.shellEnv` 経由）。

## 組み込みcatalog

OpenClawには現在、次のbundled Together catalogが含まれています。

| Model ref                                                    | 名前                                   | 入力        | コンテキスト | 注                                  |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ------------ | ----------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | text, image | 262,144      | デフォルトmodel。reasoning有効      |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | text        | 202,752      | 汎用テキストmodel                   |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | text        | 131,072      | 高速なinstruction model             |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000   | マルチモーダル                      |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000   | マルチモーダル                      |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | text        | 131,072      | 汎用テキストmodel                   |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | text        | 131,072      | Reasoning model                     |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | text        | 262,144      | 第2のKimiテキストmodel              |

オンボーディングpresetでは、デフォルトmodelとして `together/moonshotai/Kimi-K2.5` が設定されます。
