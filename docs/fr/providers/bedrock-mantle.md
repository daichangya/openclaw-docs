---
read_when:
    - Vous souhaitez utiliser les modèles OSS hébergés Bedrock Mantle avec OpenClaw
    - Vous avez besoin du point de terminaison compatible OpenAI Mantle pour GPT-OSS, Qwen, Kimi ou GLM
summary: Utiliser les modèles Amazon Bedrock Mantle (compatibles OpenAI) avec OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T14:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw inclut un fournisseur **Amazon Bedrock Mantle** groupé qui se connecte au
point de terminaison compatible OpenAI de Mantle. Mantle héberge des modèles open source et
tiers (GPT-OSS, Qwen, Kimi, GLM, et similaires) via une surface standard
`/v1/chat/completions` reposant sur l’infrastructure Bedrock.

| Propriété       | Valeur                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------- |
| ID du fournisseur | `amazon-bedrock-mantle`                                                                   |
| API             | `openai-completions` (compatible OpenAI) ou `anthropic-messages` (route Anthropic Messages) |
| Authentification | `AWS_BEARER_TOKEN_BEDROCK` explicite ou génération de bearer token via la chaîne d’identifiants IAM |
| Région par défaut | `us-east-1` (remplacez avec `AWS_REGION` ou `AWS_DEFAULT_REGION`)                         |

## Prise en main

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Jeton bearer explicite">
    **Idéal pour :** les environnements où vous disposez déjà d’un jeton bearer Mantle.

    <Steps>
      <Step title="Définir le jeton bearer sur l’hôte Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Vous pouvez aussi définir une région (par défaut : `us-east-1`) :

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont détectés">
        ```bash
        openclaw models list
        ```

        Les modèles détectés apparaissent sous le fournisseur `amazon-bedrock-mantle`. Aucune
        configuration supplémentaire n’est requise sauf si vous souhaitez remplacer les valeurs par défaut.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Identifiants IAM">
    **Idéal pour :** l’utilisation d’identifiants compatibles SDK AWS (configuration partagée, SSO, identité web, rôles d’instance ou de tâche).

    <Steps>
      <Step title="Configurer les identifiants AWS sur l’hôte Gateway">
        Toute source d’authentification compatible SDK AWS fonctionne :

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont détectés">
        ```bash
        openclaw models list
        ```

        OpenClaw génère automatiquement un jeton bearer Mantle à partir de la chaîne d’identifiants.
      </Step>
    </Steps>

    <Tip>
    Lorsque `AWS_BEARER_TOKEN_BEDROCK` n’est pas défini, OpenClaw génère le jeton bearer pour vous à partir de la chaîne d’identifiants AWS par défaut, y compris les profils partagés credentials/config, le SSO, l’identité web, et les rôles d’instance ou de tâche.
    </Tip>

  </Tab>
</Tabs>

## Détection automatique des modèles

Lorsque `AWS_BEARER_TOKEN_BEDROCK` est défini, OpenClaw l’utilise directement. Sinon,
OpenClaw tente de générer un jeton bearer Mantle à partir de la chaîne d’identifiants
AWS par défaut. Il détecte ensuite les modèles Mantle disponibles en interrogeant
le point de terminaison régional `/v1/models`.

| Comportement         | Détail                     |
| -------------------- | -------------------------- |
| Cache de détection   | Résultats mis en cache pendant 1 heure |
| Actualisation du jeton IAM | Toutes les heures     |

<Note>
Le jeton bearer est le même `AWS_BEARER_TOKEN_BEDROCK` que celui utilisé par le fournisseur standard [Amazon Bedrock](/fr/providers/bedrock).
</Note>

### Régions prises en charge

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configuration manuelle

Si vous préférez une configuration explicite plutôt que la détection automatique :

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

## Notes avancées

<AccordionGroup>
  <Accordion title="Prise en charge du raisonnement">
    La prise en charge du raisonnement est déduite à partir des ID de modèle contenant des motifs comme
    `thinking`, `reasoner` ou `gpt-oss-120b`. OpenClaw définit `reasoning: true`
    automatiquement pour les modèles correspondants pendant la détection.
  </Accordion>

  <Accordion title="Indisponibilité du point de terminaison">
    Si le point de terminaison Mantle est indisponible ou ne renvoie aucun modèle, le fournisseur est
    ignoré silencieusement. OpenClaw ne renvoie pas d’erreur ; les autres fournisseurs configurés
    continuent de fonctionner normalement.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via la route Anthropic Messages">
    Mantle expose aussi une route Anthropic Messages qui transporte les modèles Claude via le même chemin de streaming authentifié par bearer. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) peut être appelé via cette route avec un streaming géré par le fournisseur, de sorte que les jetons bearer AWS ne sont pas traités comme des clés API Anthropic.

    Lorsque vous épinglez un modèle Anthropic Messages sur le fournisseur Mantle, OpenClaw utilise la surface API `anthropic-messages` au lieu de `openai-completions` pour ce modèle. L’authentification provient toujours de `AWS_BEARER_TOKEN_BEDROCK` (ou du jeton bearer IAM généré).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Lien avec le fournisseur Amazon Bedrock">
    Bedrock Mantle est un fournisseur distinct du fournisseur standard
    [Amazon Bedrock](/fr/providers/bedrock). Mantle utilise une
    surface `/v1` compatible OpenAI, tandis que le fournisseur Bedrock standard utilise
    l’API Bedrock native.

    Les deux fournisseurs partagent le même identifiant `AWS_BEARER_TOKEN_BEDROCK` lorsqu’il
    est présent.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/fr/providers/bedrock" icon="cloud">
    Fournisseur Bedrock natif pour Anthropic Claude, Titan et d’autres modèles.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et comment les résoudre.
  </Card>
</CardGroup>
