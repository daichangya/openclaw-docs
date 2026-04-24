---
read_when:
    - Vous souhaitez utiliser des modèles OSS hébergés par Bedrock Mantle avec OpenClaw
    - Vous avez besoin du point de terminaison compatible OpenAI de Mantle pour GPT-OSS, Qwen, Kimi ou GLM
summary: Utiliser les modèles Amazon Bedrock Mantle (compatibles OpenAI) avec OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T07:25:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClaw inclut un fournisseur **Amazon Bedrock Mantle** intégré qui se connecte au
point de terminaison compatible OpenAI de Mantle. Mantle héberge des modèles open source et
tiers (GPT-OSS, Qwen, Kimi, GLM, et similaires) via une surface standard
`/v1/chat/completions` adossée à l’infrastructure Bedrock.

| Property       | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| ID du fournisseur    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (compatible OpenAI) ou `anthropic-messages` (route Anthropic Messages) |
| Auth           | `AWS_BEARER_TOKEN_BEDROCK` explicite ou génération de jeton bearer via la chaîne d’identifiants IAM |
| Région par défaut | `us-east-1` (remplacez avec `AWS_REGION` ou `AWS_DEFAULT_REGION`)                            |

## Démarrage

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Jeton bearer explicite">
    **Idéal pour :** les environnements où vous avez déjà un jeton bearer Mantle.

    <Steps>
      <Step title="Définir le jeton bearer sur l’hôte gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Définissez éventuellement une région (par défaut `us-east-1`) :

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont découverts">
        ```bash
        openclaw models list
        ```

        Les modèles découverts apparaissent sous le fournisseur `amazon-bedrock-mantle`. Aucune
        configuration supplémentaire n’est requise, sauf si vous souhaitez remplacer les valeurs par défaut.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Identifiants IAM">
    **Idéal pour :** utiliser des identifiants compatibles AWS SDK (configuration partagée, SSO, web identity, rôles d’instance ou de tâche).

    <Steps>
      <Step title="Configurer les identifiants AWS sur l’hôte gateway">
        Toute source d’authentification compatible AWS SDK fonctionne :

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont découverts">
        ```bash
        openclaw models list
        ```

        OpenClaw génère automatiquement un jeton bearer Mantle à partir de la chaîne d’identifiants.
      </Step>
    </Steps>

    <Tip>
    Lorsque `AWS_BEARER_TOKEN_BEDROCK` n’est pas défini, OpenClaw génère le jeton bearer pour vous à partir de la chaîne d’identifiants AWS par défaut, y compris les profils partagés credentials/config, SSO, web identity, ainsi que les rôles d’instance ou de tâche.
    </Tip>

  </Tab>
</Tabs>

## Découverte automatique des modèles

Lorsque `AWS_BEARER_TOKEN_BEDROCK` est défini, OpenClaw l’utilise directement. Sinon,
OpenClaw tente de générer un jeton bearer Mantle à partir de la chaîne d’identifiants AWS par défaut.
Il découvre ensuite les modèles Mantle disponibles en interrogeant le
point de terminaison régional `/v1/models`.

| Behavior          | Detail                    |
| ----------------- | ------------------------- |
| Cache de découverte   | Résultats mis en cache pendant 1 heure |
| Actualisation du jeton IAM | Toutes les heures                    |

<Note>
Le jeton bearer est le même `AWS_BEARER_TOKEN_BEDROCK` utilisé par le fournisseur standard [Amazon Bedrock](/fr/providers/bedrock).
</Note>

### Régions prises en charge

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configuration manuelle

Si vous préférez une configuration explicite à la découverte automatique :

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

## Configuration avancée

<AccordionGroup>
  <Accordion title="Prise en charge du raisonnement">
    La prise en charge du raisonnement est déduite à partir des identifiants de modèles contenant des motifs comme
    `thinking`, `reasoner`, ou `gpt-oss-120b`. OpenClaw définit automatiquement `reasoning: true`
    pour les modèles correspondants pendant la découverte.
  </Accordion>

  <Accordion title="Indisponibilité du point de terminaison">
    Si le point de terminaison Mantle est indisponible ou ne renvoie aucun modèle, le fournisseur est
    ignoré silencieusement. OpenClaw ne renvoie pas d’erreur ; les autres fournisseurs configurés
    continuent de fonctionner normalement.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via la route Anthropic Messages">
    Mantle expose également une route Anthropic Messages qui transporte les modèles Claude via le même chemin de streaming authentifié par bearer. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) peut être appelé via cette route avec le streaming appartenant au fournisseur, de sorte que les jetons bearer AWS ne sont pas traités comme des clés API Anthropic.

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

  <Accordion title="Relation avec le fournisseur Amazon Bedrock">
    Bedrock Mantle est un fournisseur distinct du fournisseur standard
    [Amazon Bedrock](/fr/providers/bedrock). Mantle utilise une
    surface `/v1` compatible OpenAI, tandis que le fournisseur Bedrock standard utilise
    l’API Bedrock native.

    Les deux fournisseurs partagent le même identifiant `AWS_BEARER_TOKEN_BEDROCK` lorsqu’il est
    présent.

  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/fr/providers/bedrock" icon="cloud">
    Fournisseur Bedrock natif pour Anthropic Claude, Titan et d’autres modèles.
  </Card>
  <Card title="Sélection de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir des fournisseurs, des références de modèles et le comportement de basculement.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et manière de les résoudre.
  </Card>
</CardGroup>
