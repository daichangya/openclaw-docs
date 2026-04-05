---
read_when:
    - Vous voulez utiliser les modèles Mistral dans OpenClaw
    - Vous avez besoin de l’onboarding de clé API Mistral et des références de modèle
summary: Utiliser les modèles Mistral et la transcription Voxtral avec OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-05T12:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f61b9e0656dd7e0243861ddf14b1b41a07c38bff27cef9ad0815d14c8e34408
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw prend en charge Mistral à la fois pour le routage de modèles texte/image (`mistral/...`) et
la transcription audio via Voxtral dans la compréhension des médias.
Mistral peut aussi être utilisé pour les embeddings de mémoire (`memorySearch.provider = "mistral"`).

## Configuration CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Extrait de configuration (fournisseur LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Catalogue LLM intégré

OpenClaw livre actuellement ce catalogue Mistral intégré :

| Référence de modèle              | Entrée      | Contexte | Sortie max | Remarques                |
| -------------------------------- | ----------- | -------- | ---------- | ------------------------ |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384     | Modèle par défaut        |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192      | Mistral Medium 3.1       |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384     | Modèle multimodal plus petit |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768     | Pixtral                  |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096      | Code                     |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768     | Devstral 2               |
| `mistral/magistral-small`        | text        | 128,000  | 40,000     | Raisonnement activé      |

## Extrait de configuration (transcription audio avec Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Remarques

- L’authentification Mistral utilise `MISTRAL_API_KEY`.
- L’URL de base du fournisseur vaut par défaut `https://api.mistral.ai/v1`.
- Le modèle par défaut de l’onboarding est `mistral/mistral-large-latest`.
- Le modèle audio par défaut de compréhension des médias pour Mistral est `voxtral-mini-latest`.
- Le chemin de transcription des médias utilise `/v1/audio/transcriptions`.
- Le chemin des embeddings mémoire utilise `/v1/embeddings` (modèle par défaut : `mistral-embed`).
