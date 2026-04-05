---
read_when:
    - Vous souhaitez utiliser des modèles Xiaomi MiMo dans OpenClaw
    - Vous avez besoin de configurer `XIAOMI_API_KEY`
summary: Utiliser les modèles Xiaomi MiMo avec OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T12:52:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo est la plateforme API des modèles **MiMo**. OpenClaw utilise le point de terminaison compatible OpenAI de Xiaomi
avec une authentification par clé API. Créez votre clé API dans la
[console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), puis configurez le
fournisseur groupé `xiaomi` avec cette clé.

## Catalogue intégré

- Base URL : `https://api.xiaomimimo.com/v1`
- API : `openai-completions`
- Autorisation : `Bearer $XIAOMI_API_KEY`

| Réf modèle             | Entrée      | Contexte  | Sortie max | Remarques                    |
| ---------------------- | ----------- | --------- | ---------- | ---------------------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192      | Modèle par défaut            |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000     | Raisonnement activé          |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000     | Multimodal avec raisonnement activé |

## Configuration CLI

```bash
openclaw onboard --auth-choice xiaomi-api-key
# or non-interactive
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Extrait de configuration

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## Remarques

- Réf du modèle par défaut : `xiaomi/mimo-v2-flash`.
- Modèles intégrés supplémentaires : `xiaomi/mimo-v2-pro`, `xiaomi/mimo-v2-omni`.
- Le fournisseur est injecté automatiquement lorsque `XIAOMI_API_KEY` est défini (ou lorsqu’un profil d’authentification existe).
- Consultez [/concepts/model-providers](/concepts/model-providers) pour les règles des fournisseurs.
