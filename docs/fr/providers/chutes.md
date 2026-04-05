---
read_when:
    - Vous voulez utiliser Chutes avec OpenClaw
    - Vous avez besoin du parcours de configuration OAuth ou clé API
    - Vous voulez le modèle par défaut, les alias ou le comportement de découverte
summary: Configuration de Chutes (OAuth ou clé API, découverte de modèles, alias)
title: Chutes
x-i18n:
    generated_at: "2026-04-05T12:51:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) expose des catalogues de modèles open source via une
API compatible OpenAI. OpenClaw prend en charge à la fois l’OAuth via navigateur et l’authentification directe par clé API
pour le fournisseur intégré `chutes`.

- Fournisseur : `chutes`
- API : compatible OpenAI
- URL de base : `https://llm.chutes.ai/v1`
- Authentification :
  - OAuth via `openclaw onboard --auth-choice chutes`
  - Clé API via `openclaw onboard --auth-choice chutes-api-key`
  - Variables d’environnement d’exécution : `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`

## Démarrage rapide

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

OpenClaw lance localement le flux navigateur, ou affiche une URL + un flux
de collage de redirection sur les hôtes distants/headless. Les jetons OAuth sont actualisés automatiquement via les profils d’authentification OpenClaw.

Remplacements OAuth facultatifs :

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### Clé API

```bash
openclaw onboard --auth-choice chutes-api-key
```

Obtenez votre clé sur
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).

Les deux chemins d’authentification enregistrent le catalogue Chutes intégré et définissent le modèle par défaut
sur `chutes/zai-org/GLM-4.7-TEE`.

## Comportement de découverte

Lorsque l’authentification Chutes est disponible, OpenClaw interroge le catalogue Chutes avec cet
identifiant et utilise les modèles découverts. Si la découverte échoue, OpenClaw revient
à un catalogue statique intégré afin que l’onboarding et le démarrage continuent de fonctionner.

## Alias par défaut

OpenClaw enregistre également trois alias de commodité pour le catalogue Chutes
intégré :

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## Catalogue de démarrage intégré

Le catalogue de repli intégré inclut des références Chutes actuelles telles que :

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## Exemple de configuration

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

## Remarques

- Aide OAuth et exigences de l’application de redirection : [documentation OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
- La découverte par clé API et par OAuth utilise le même ID de fournisseur `chutes`.
- Les modèles Chutes sont enregistrés sous la forme `chutes/<model-id>`.
