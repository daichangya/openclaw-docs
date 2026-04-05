---
read_when:
    - Vous souhaitez utiliser avec OpenClaw des modèles OSS hébergés sur Bedrock Mantle
    - Vous avez besoin du point de terminaison Mantle compatible OpenAI pour GPT-OSS, Qwen, Kimi ou GLM
summary: Utiliser les modèles Amazon Bedrock Mantle (compatibles OpenAI) avec OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-05T12:51:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2efe61261fbb430f63be9f5025c0654c44b191dbe96b3eb081d7ccbe78458907
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw inclut un provider **Amazon Bedrock Mantle** intégré qui se connecte au
point de terminaison Mantle compatible OpenAI. Mantle héberge des modèles open source et
tiers (GPT-OSS, Qwen, Kimi, GLM, et similaires) via une surface standard
`/v1/chat/completions` reposant sur l’infrastructure Bedrock.

## Ce que OpenClaw prend en charge

- Provider : `amazon-bedrock-mantle`
- API : `openai-completions` (compatible OpenAI)
- Authentification : jeton bearer via `AWS_BEARER_TOKEN_BEDROCK`
- Région : `AWS_REGION` ou `AWS_DEFAULT_REGION` (par défaut : `us-east-1`)

## Découverte automatique des modèles

Lorsque `AWS_BEARER_TOKEN_BEDROCK` est défini, OpenClaw découvre automatiquement
les modèles Mantle disponibles en interrogeant le point de terminaison régional `/v1/models`.
Les résultats de la découverte sont mis en cache pendant 1 heure.

Régions prises en charge : `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Définissez le jeton bearer sur l’**hôte gateway** :

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Facultatif (par défaut : us-east-1) :
export AWS_REGION="us-west-2"
```

2. Vérifiez que les modèles sont découverts :

```bash
openclaw models list
```

Les modèles découverts apparaissent sous le provider `amazon-bedrock-mantle`. Aucune
configuration supplémentaire n’est requise, sauf si vous souhaitez remplacer les valeurs par défaut.

## Configuration manuelle

Si vous préférez une configuration explicite plutôt que la découverte automatique :

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Remarques

- Mantle exige actuellement un jeton bearer. De simples identifiants IAM (rôles d’instance,
  SSO, clés d’accès) ne suffisent pas sans jeton.
- Le jeton bearer est le même `AWS_BEARER_TOKEN_BEDROCK` que celui utilisé par le provider
  standard [Amazon Bedrock](/providers/bedrock).
- La prise en charge du raisonnement est déduite à partir des ID de modèle contenant des motifs comme
  `thinking`, `reasoner` ou `gpt-oss-120b`.
- Si le point de terminaison Mantle n’est pas disponible ou ne renvoie aucun modèle, le provider est
  ignoré silencieusement.
