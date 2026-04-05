---
read_when:
    - OpenClawでNVIDIAモデルを使いたい場合
    - '`NVIDIA_API_KEY` の設定が必要な場合'
summary: OpenClawでNVIDIAのOpenAI互換APIを使用する
title: NVIDIA
x-i18n:
    generated_at: "2026-04-05T12:53:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: a24c5e46c0cf0fbc63bf09c772b486dd7f8f4b52e687d3b835bb54a1176b28da
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIAは、NemotronおよびNeMoモデル向けに `https://integrate.api.nvidia.com/v1` でOpenAI互換APIを提供しています。[NVIDIA NGC](https://catalog.ngc.nvidia.com/) のAPIキーで認証してください。

## CLIセットアップ

キーを一度exportしてから、オンボーディングを実行し、NVIDIAモデルを設定します:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

`--token` をまだ使っている場合は、それがシェル履歴や `ps` 出力に残ることを忘れないでください。可能であればenv varを優先してください。

## 設定スニペット

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## モデルID

| Model ref                                            | Name                                     | Context | Max output |
| ---------------------------------------------------- | ---------------------------------------- | ------- | ---------- |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`      | NVIDIA Llama 3.1 Nemotron 70B Instruct   | 131,072 | 4,096      |
| `nvidia/meta/llama-3.3-70b-instruct`                 | Meta Llama 3.3 70B Instruct              | 131,072 | 4,096      |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct` | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192   | 2,048      |

## 注記

- OpenAI互換の `/v1` エンドポイントです。NVIDIA NGCのAPIキーを使用してください。
- `NVIDIA_API_KEY` が設定されていると、プロバイダーは自動で有効になります。
- 同梱のcatalogは静的で、コストはソース上ではデフォルトで `0` です。
