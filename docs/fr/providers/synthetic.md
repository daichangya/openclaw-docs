---
read_when:
    - Vous souhaitez utiliser Synthetic comme fournisseur de modèles
    - Vous avez besoin d’une clé API Synthetic ou d’une configuration d’URL de base
summary: Utiliser l’API compatible Anthropic de Synthetic dans OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-05T12:52:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3495bca5cb134659cf6c54e31fa432989afe0cc04f53cf3e3146ce80a5e8af49
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

Synthetic expose des points de terminaison compatibles Anthropic. OpenClaw l’enregistre comme fournisseur
`synthetic` et utilise l’API Anthropic Messages.

## Configuration rapide

1. Définissez `SYNTHETIC_API_KEY` (ou exécutez l’assistant ci-dessous).
2. Lancez l’intégration guidée :

```bash
openclaw onboard --auth-choice synthetic-api-key
```

Le modèle par défaut est défini sur :

```
synthetic/hf:MiniMaxAI/MiniMax-M2.5
```

## Exemple de configuration

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

Remarque : le client Anthropic d’OpenClaw ajoute `/v1` à l’URL de base, utilisez donc
`https://api.synthetic.new/anthropic` (et non `/anthropic/v1`). Si Synthetic change
son URL de base, remplacez `models.providers.synthetic.baseUrl`.

## Catalogue de modèles

Tous les modèles ci-dessous utilisent un coût `0` (entrée/sortie/cache).

| ID du modèle                                           | Fenêtre de contexte | Jetons max | Raisonnement | Entrée        |
| ------------------------------------------------------ | ------------------- | ---------- | ------------ | ------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192000              | 65536      | false        | text          |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256000              | 8192       | true         | text          |
| `hf:zai-org/GLM-4.7`                                   | 198000              | 128000     | false        | text          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128000              | 8192       | false        | text          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128000              | 8192       | false        | text          |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128000              | 8192       | false        | text          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128000              | 8192       | false        | text          |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159000              | 8192       | false        | text          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128000              | 8192       | false        | text          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524000              | 8192       | false        | text          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256000              | 8192       | false        | text          |
| `hf:moonshotai/Kimi-K2.5`                              | 256000              | 8192       | true         | text + image  |
| `hf:openai/gpt-oss-120b`                               | 128000              | 8192       | false        | text          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256000              | 8192       | false        | text          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256000              | 8192       | false        | text          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250000              | 8192       | false        | text + image  |
| `hf:zai-org/GLM-4.5`                                   | 128000              | 128000     | false        | text          |
| `hf:zai-org/GLM-4.6`                                   | 198000              | 128000     | false        | text          |
| `hf:zai-org/GLM-5`                                     | 256000              | 128000     | true         | text + image  |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128000              | 8192       | false        | text          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256000              | 8192       | true         | text          |

## Remarques

- Les références de modèle utilisent `synthetic/<modelId>`.
- Si vous activez une liste d’autorisation de modèles (`agents.defaults.models`), ajoutez chaque modèle que vous prévoyez d’utiliser.
- Consultez [Fournisseurs de modèles](/concepts/model-providers) pour les règles des fournisseurs.
