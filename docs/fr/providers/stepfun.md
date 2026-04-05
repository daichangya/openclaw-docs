---
read_when:
    - Vous souhaitez utiliser des modèles StepFun dans OpenClaw
    - Vous avez besoin d'instructions de configuration pour StepFun
summary: Utiliser les modèles StepFun avec OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-05T12:52:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw inclut un plugin fournisseur StepFun intégré avec deux IDs de fournisseur :

- `stepfun` pour le point de terminaison standard
- `stepfun-plan` pour le point de terminaison Step Plan

Les catalogues intégrés diffèrent actuellement selon la surface :

- Standard : `step-3.5-flash`
- Step Plan : `step-3.5-flash`, `step-3.5-flash-2603`

## Vue d'ensemble des régions et points de terminaison

- Point de terminaison standard Chine : `https://api.stepfun.com/v1`
- Point de terminaison standard global : `https://api.stepfun.ai/v1`
- Point de terminaison Step Plan Chine : `https://api.stepfun.com/step_plan/v1`
- Point de terminaison Step Plan global : `https://api.stepfun.ai/step_plan/v1`
- Variable d'environnement d'authentification : `STEPFUN_API_KEY`

Utilisez une clé Chine avec les points de terminaison `.com` et une clé globale avec les
points de terminaison `.ai`.

## Configuration CLI

Configuration interactive :

```bash
openclaw onboard
```

Choisissez l'un de ces choix d'authentification :

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

Exemples non interactifs :

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## Références de modèle

- Modèle standard par défaut : `stepfun/step-3.5-flash`
- Modèle Step Plan par défaut : `stepfun-plan/step-3.5-flash`
- Modèle alternatif Step Plan : `stepfun-plan/step-3.5-flash-2603`

## Catalogues intégrés

Standard (`stepfun`) :

| Référence de modèle      | Contexte | Sortie max | Remarques                |
| ------------------------ | -------- | ---------- | ------------------------ |
| `stepfun/step-3.5-flash` | 262,144  | 65,536     | Modèle standard par défaut |

Step Plan (`stepfun-plan`) :

| Référence de modèle                | Contexte | Sortie max | Remarques                  |
| ---------------------------------- | -------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536     | Modèle Step Plan par défaut |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536     | Modèle Step Plan supplémentaire |

## Extraits de configuration

Fournisseur standard :

```json5
{
  env: { STEPFUN_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
  models: {
    mode: "merge",
    providers: {
      stepfun: {
        baseUrl: "https://api.stepfun.ai/v1",
        api: "openai-completions",
        apiKey: "${STEPFUN_API_KEY}",
        models: [
          {
            id: "step-3.5-flash",
            name: "Step 3.5 Flash",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Fournisseur Step Plan :

```json5
{
  env: { STEPFUN_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
  models: {
    mode: "merge",
    providers: {
      "stepfun-plan": {
        baseUrl: "https://api.stepfun.ai/step_plan/v1",
        api: "openai-completions",
        apiKey: "${STEPFUN_API_KEY}",
        models: [
          {
            id: "step-3.5-flash",
            name: "Step 3.5 Flash",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
          {
            id: "step-3.5-flash-2603",
            name: "Step 3.5 Flash 2603",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Remarques

- Le fournisseur est intégré à OpenClaw, donc il n'y a pas d'étape séparée d'installation du plugin.
- `step-3.5-flash-2603` est actuellement exposé uniquement sur `stepfun-plan`.
- Un flux d'authentification unique écrit des profils correspondant à la région pour `stepfun` et `stepfun-plan`, afin que les deux surfaces puissent être découvertes ensemble.
- Utilisez `openclaw models list` et `openclaw models set <provider/model>` pour inspecter ou changer de modèle.
- Pour une vue d'ensemble plus large des fournisseurs, voir [Fournisseurs de modèles](/concepts/model-providers).
