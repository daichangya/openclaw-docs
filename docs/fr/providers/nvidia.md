---
read_when:
    - Vous souhaitez utiliser des modèles NVIDIA dans OpenClaw
    - Vous avez besoin de configurer `NVIDIA_API_KEY`
summary: Utiliser l’API compatible OpenAI de NVIDIA dans OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-05T12:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: a24c5e46c0cf0fbc63bf09c772b486dd7f8f4b52e687d3b835bb54a1176b28da
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA fournit une API compatible OpenAI à `https://integrate.api.nvidia.com/v1` pour les modèles Nemotron et NeMo. Authentifiez-vous avec une clé API depuis [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## Configuration CLI

Exportez la clé une fois, puis exécutez l’intégration guidée et définissez un modèle NVIDIA :

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Si vous passez encore `--token`, rappelez-vous qu’il atterrit dans l’historique du shell et dans la sortie de `ps` ; préférez la variable d’environnement quand c’est possible.

## Extrait de configuration

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

## Identifiants de modèle

| Référence de modèle                                  | Nom                                      | Contexte | Sortie max |
| ---------------------------------------------------- | ---------------------------------------- | -------- | ---------- |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`      | NVIDIA Llama 3.1 Nemotron 70B Instruct   | 131,072  | 4,096      |
| `nvidia/meta/llama-3.3-70b-instruct`                 | Meta Llama 3.3 70B Instruct              | 131,072  | 4,096      |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct` | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192    | 2,048      |

## Remarques

- Point de terminaison `/v1` compatible OpenAI ; utilisez une clé API depuis NVIDIA NGC.
- Le fournisseur s’active automatiquement lorsque `NVIDIA_API_KEY` est défini.
- Le catalogue intégré est statique ; les coûts sont à `0` par défaut dans la source.
