---
read_when:
    - Vous souhaitez utiliser Volcano Engine ou des modèles Doubao avec OpenClaw
    - Vous avez besoin de la configuration de la clé API Volcengine
summary: Configuration de Volcano Engine (modèles Doubao, points de terminaison général + coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-05T12:52:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85d9e737e906cd705fb31479d6b78d92b68c9218795ea9667516c1571dcaaf3a
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Le provider Volcengine donne accès aux modèles Doubao et aux modèles tiers
hébergés sur Volcano Engine, avec des points de terminaison distincts pour les
charges de travail générales et de coding.

- Providers : `volcengine` (général) + `volcengine-plan` (coding)
- Authentification : `VOLCANO_ENGINE_API_KEY`
- API : compatible OpenAI

## Démarrage rapide

1. Définissez la clé API :

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Providers et points de terminaison

| Provider          | Point de terminaison                      | Cas d’usage      |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modèles généraux |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modèles de coding |

Les deux providers sont configurés à partir d’une seule clé API. La configuration enregistre automatiquement les deux.

## Modèles disponibles

Provider général (`volcengine`) :

| Référence de modèle                           | Nom                             | Entrée       | Contexte |
| --------------------------------------------- | ------------------------------- | ------------ | -------- |
| `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                 | texte, image | 256,000  |
| `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028 | texte, image | 256,000  |
| `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                       | texte, image | 256,000  |
| `volcengine/glm-4-7-251222`                   | GLM 4.7                         | texte, image | 200,000  |
| `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                   | texte, image | 128,000  |

Provider de coding (`volcengine-plan`) :

| Référence de modèle                                  | Nom                      | Entrée | Contexte |
| ---------------------------------------------------- | ------------------------ | ------ | -------- |
| `volcengine-plan/ark-code-latest`                    | Ark Coding Plan          | texte  | 256,000  |
| `volcengine-plan/doubao-seed-code`                   | Doubao Seed Code         | texte  | 256,000  |
| `volcengine-plan/glm-4.7`                            | GLM 4.7 Coding           | texte  | 200,000  |
| `volcengine-plan/kimi-k2-thinking`                   | Kimi K2 Thinking         | texte  | 256,000  |
| `volcengine-plan/kimi-k2.5`                          | Kimi K2.5 Coding         | texte  | 256,000  |
| `volcengine-plan/doubao-seed-code-preview-251028`    | Doubao Seed Code Preview | texte  | 256,000  |

`openclaw onboard --auth-choice volcengine-api-key` définit actuellement
`volcengine-plan/ark-code-latest` comme modèle par défaut tout en enregistrant
également le catalogue général `volcengine`.

Pendant la sélection du modèle dans onboarding/configure, le choix d’authentification Volcengine privilégie
à la fois les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas
encore chargés, OpenClaw revient au catalogue non filtré au lieu d’afficher un
sélecteur limité au provider vide.

## Remarque sur l’environnement

Si la Gateway s’exécute comme démon (launchd/systemd), assurez-vous que
`VOLCANO_ENGINE_API_KEY` est disponible pour ce processus (par exemple dans
`~/.openclaw/.env` ou via `env.shellEnv`).
