---
read_when:
    - Vous voulez utiliser des modèles OSS hébergés par Bedrock Mantle avec OpenClaw
    - Vous avez besoin de l’endpoint Mantle compatible OpenAI pour GPT-OSS, Qwen, Kimi ou GLM
summary: Utiliser des modèles Amazon Bedrock Mantle (compatibles OpenAI) avec OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-06T03:10:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e5b33ede4067fb7de02a046f3e375cbd2af4bf68e7751c8dd687447f1a78c86
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw inclut un fournisseur groupé **Amazon Bedrock Mantle** qui se connecte à
l’endpoint Mantle compatible OpenAI. Mantle héberge des modèles open source et
tiers (GPT-OSS, Qwen, Kimi, GLM et similaires) via une surface standard
`/v1/chat/completions` reposant sur l’infrastructure Bedrock.

## Ce qu’OpenClaw prend en charge

- Fournisseur : `amazon-bedrock-mantle`
- API : `openai-completions` (compatible OpenAI)
- Authentification : `AWS_BEARER_TOKEN_BEDROCK` explicite ou génération de jeton porteur via la chaîne d’identifiants IAM
- Région : `AWS_REGION` ou `AWS_DEFAULT_REGION` (par défaut : `us-east-1`)

## Découverte automatique des modèles

Lorsque `AWS_BEARER_TOKEN_BEDROCK` est défini, OpenClaw l’utilise directement. Sinon,
OpenClaw tente de générer un jeton porteur Mantle à partir de la chaîne par défaut
d’identifiants AWS, y compris les profils partagés de credentials/configuration, SSO, l’identité Web
et les rôles d’instance ou de tâche. Il découvre ensuite les modèles Mantle
disponibles en interrogeant l’endpoint régional `/v1/models`. Les résultats de découverte sont
mis en cache pendant 1 heure, et les jetons porteurs dérivés d’IAM sont actualisés toutes les heures.

Régions prises en charge : `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Intégration

1. Choisissez un chemin d’authentification sur l’**hôte de la passerelle** :

Jeton porteur explicite :

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Facultatif (par défaut : us-east-1) :
export AWS_REGION="us-west-2"
```

Identifiants IAM :

```bash
# Toute source d’authentification compatible avec le SDK AWS fonctionne ici, par exemple :
export AWS_PROFILE="default"
export AWS_REGION="us-west-2"
```

2. Vérifiez que les modèles sont découverts :

```bash
openclaw models list
```

Les modèles découverts apparaissent sous le fournisseur `amazon-bedrock-mantle`. Aucune
configuration supplémentaire n’est requise, sauf si vous voulez remplacer les valeurs par défaut.

## Configuration manuelle

Si vous préférez une configuration explicite à la découverte automatique :

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

- OpenClaw peut générer le jeton porteur Mantle pour vous à partir d’identifiants IAM
  compatibles avec le SDK AWS lorsque `AWS_BEARER_TOKEN_BEDROCK` n’est pas défini.
- Le jeton porteur est le même `AWS_BEARER_TOKEN_BEDROCK` que celui utilisé par le fournisseur standard
  [Amazon Bedrock](/fr/providers/bedrock).
- La prise en charge du raisonnement est déduite à partir des identifiants de modèle contenant des motifs comme
  `thinking`, `reasoner` ou `gpt-oss-120b`.
- Si l’endpoint Mantle n’est pas disponible ou ne renvoie aucun modèle, le fournisseur est
  ignoré silencieusement.
