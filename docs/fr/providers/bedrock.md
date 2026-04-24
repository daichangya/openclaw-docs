---
read_when:
    - Vous souhaitez utiliser des modèles Amazon Bedrock avec OpenClaw
    - Vous devez configurer les identifiants/région AWS pour les appels de modèle
summary: Utiliser les modèles Amazon Bedrock (API Converse) avec OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-24T07:26:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

OpenClaw peut utiliser des modèles **Amazon Bedrock** via le fournisseur de diffusion **Bedrock Converse**
de pi-ai. L’authentification Bedrock utilise la **chaîne d’identifiants par défaut du SDK AWS**,
et non une clé API.

| Propriété | Valeur                                                     |
| --------- | ---------------------------------------------------------- |
| Fournisseur | `amazon-bedrock`                                         |
| API       | `bedrock-converse-stream`                                  |
| Auth      | Identifiants AWS (variables d’environnement, configuration partagée ou rôle d’instance) |
| Région    | `AWS_REGION` ou `AWS_DEFAULT_REGION` (par défaut : `us-east-1`) |

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clés d’accès / variables d’environnement">
    **Idéal pour :** machines de développeur, CI, ou hôtes où vous gérez directement les identifiants AWS.

    <Steps>
      <Step title="Définir les identifiants AWS sur l’hôte gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Facultatif :
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Facultatif (clé API / jeton bearer Bedrock) :
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Ajouter un fournisseur Bedrock et un modèle à votre configuration">
        Aucun `apiKey` n’est requis. Configurez le fournisseur avec `auth: "aws-sdk"` :

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Avec l’authentification par marqueur d’environnement (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, ou `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw active automatiquement le fournisseur Bedrock implicite pour la découverte des modèles sans configuration supplémentaire.
    </Tip>

  </Tab>

  <Tab title="Rôles d’instance EC2 (IMDS)">
    **Idéal pour :** instances EC2 avec un rôle IAM attaché, utilisant le service de métadonnées d’instance pour l’authentification.

    <Steps>
      <Step title="Activer explicitement la découverte">
        Lors de l’utilisation d’IMDS, OpenClaw ne peut pas détecter l’authentification AWS à partir des seuls marqueurs d’environnement, vous devez donc l’activer explicitement :

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Ajouter éventuellement un marqueur d’environnement pour le mode auto">
        Si vous voulez également que le chemin d’auto-détection par marqueur d’environnement fonctionne (par exemple, pour les surfaces `openclaw status`) :

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Vous n’avez **pas** besoin d’une fausse clé API.
      </Step>
      <Step title="Vérifier que les modèles sont découverts">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Le rôle IAM attaché à votre instance EC2 doit avoir les permissions suivantes :

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (pour la découverte automatique)
    - `bedrock:ListInferenceProfiles` (pour la découverte des profils d’inférence)

    Ou attachez la politique gérée `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Vous n’avez besoin de `AWS_PROFILE=default` que si vous voulez spécifiquement un marqueur d’environnement pour le mode auto ou les surfaces d’état. Le véritable chemin d’authentification runtime Bedrock utilise la chaîne par défaut du SDK AWS, donc l’authentification de rôle d’instance IMDS fonctionne même sans marqueurs d’environnement.
    </Note>

  </Tab>
</Tabs>

## Découverte automatique des modèles

OpenClaw peut découvrir automatiquement les modèles Bedrock qui prennent en charge la **diffusion**
et la **sortie texte**. La découverte utilise `bedrock:ListFoundationModels` et
`bedrock:ListInferenceProfiles`, et les résultats sont mis en cache (par défaut : 1 heure).

Comment le fournisseur implicite est activé :

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` vaut `true`,
  OpenClaw tentera la découverte même lorsqu’aucun marqueur d’environnement AWS n’est présent.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` n’est pas défini,
  OpenClaw n’ajoute automatiquement le
  fournisseur Bedrock implicite que lorsqu’il voit l’un de ces marqueurs d’authentification AWS :
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, ou `AWS_PROFILE`.
- Le véritable chemin d’authentification runtime Bedrock utilise toujours la chaîne par défaut du SDK AWS, de sorte que
  la configuration partagée, SSO, et l’authentification de rôle d’instance IMDS peuvent fonctionner même lorsque la découverte
  nécessitait `enabled: true` pour activer l’option.

<Note>
Pour des entrées explicites `models.providers["amazon-bedrock"]`, OpenClaw peut toujours résoudre tôt l’authentification Bedrock par marqueur d’environnement à partir des marqueurs AWS comme `AWS_BEARER_TOKEN_BEDROCK` sans forcer le chargement de l’authentification runtime complète. Le véritable chemin d’authentification des appels de modèle utilise toujours la chaîne par défaut du SDK AWS.
</Note>

<AccordionGroup>
  <Accordion title="Options de configuration de la découverte">
    Les options de configuration se trouvent sous `plugins.entries.amazon-bedrock.config.discovery` :

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Option | Par défaut | Description |
    | ------ | ---------- | ----------- |
    | `enabled` | auto | En mode auto, OpenClaw n’active le fournisseur Bedrock implicite que lorsqu’il voit un marqueur d’environnement AWS pris en charge. Définissez `true` pour forcer la découverte. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Région AWS utilisée pour les appels API de découverte. |
    | `providerFilter` | (tous) | Correspond aux noms de fournisseurs Bedrock (par exemple `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Durée de cache en secondes. Définissez `0` pour désactiver le cache. |
    | `defaultContextWindow` | `32000` | Fenêtre de contexte utilisée pour les modèles découverts (surchargez si vous connaissez les limites de votre modèle). |
    | `defaultMaxTokens` | `4096` | Nombre maximal de jetons de sortie utilisé pour les modèles découverts (surchargez si vous connaissez les limites de votre modèle). |

  </Accordion>
</AccordionGroup>

## Configuration rapide (chemin AWS)

Ce parcours crée un rôle IAM, attache les permissions Bedrock, associe
le profil d’instance, et active la découverte OpenClaw sur l’hôte EC2.

```bash
# 1. Créer un rôle IAM et un profil d’instance
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attacher à votre instance EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Sur l’instance EC2, activer explicitement la découverte
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Facultatif : ajouter un marqueur d’environnement si vous voulez le mode auto sans activation explicite
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Vérifier que les modèles sont découverts
openclaw models list
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Profils d’inférence">
    OpenClaw découvre les **profils d’inférence régionaux et globaux** en même temps
    que les modèles foundation. Lorsqu’un profil est mappé à un modèle foundation connu, le
    profil hérite des capacités de ce modèle (fenêtre de contexte, nombre max de jetons,
    raisonnement, vision) et la région de requête Bedrock correcte est injectée
    automatiquement. Cela signifie que les profils Claude inter-régions fonctionnent sans surcharge manuelle du fournisseur.

    Les identifiants de profil d’inférence ressemblent à `us.anthropic.claude-opus-4-6-v1:0` (régional)
    ou `anthropic.claude-opus-4-6-v1:0` (global). Si le modèle sous-jacent est déjà
    présent dans les résultats de découverte, le profil hérite de son ensemble complet de capacités ;
    sinon, des valeurs sûres par défaut s’appliquent.

    Aucune configuration supplémentaire n’est nécessaire. Tant que la découverte est activée et que le principal IAM
    dispose de `bedrock:ListInferenceProfiles`, les profils apparaissent en même temps
    que les modèles foundation dans `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrails">
    Vous pouvez appliquer des [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    à tous les appels de modèles Bedrock en ajoutant un objet `guardrail` à la
    configuration du plugin `amazon-bedrock`. Les Guardrails permettent d’appliquer un filtrage de contenu,
    un refus de sujet, des filtres de mots, des filtres d’informations sensibles, et des vérifications d’ancrage contextuel.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // ID du guardrail ou ARN complet
                guardrailVersion: "1", // numéro de version ou "DRAFT"
                streamProcessingMode: "sync", // facultatif : "sync" ou "async"
                trace: "enabled", // facultatif : "enabled", "disabled", ou "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Option | Requise | Description |
    | ------ | ------- | ----------- |
    | `guardrailIdentifier` | Oui | ID du guardrail (par ex. `abc123`) ou ARN complet (par ex. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Oui | Numéro de version publiée, ou `"DRAFT"` pour le brouillon de travail. |
    | `streamProcessingMode` | Non | `"sync"` ou `"async"` pour l’évaluation des guardrails pendant la diffusion. Si omis, Bedrock utilise sa valeur par défaut. |
    | `trace` | Non | `"enabled"` ou `"enabled_full"` pour le débogage ; omettez-le ou définissez `"disabled"` pour la production. |

    <Warning>
    Le principal IAM utilisé par le gateway doit avoir la permission `bedrock:ApplyGuardrail` en plus des permissions standard d’invocation.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings pour la recherche mémoire">
    Bedrock peut également servir de fournisseur d’embeddings pour la
    [recherche mémoire](/fr/concepts/memory-search). Cela se configure séparément du
    fournisseur d’inférence -- définissez `agents.defaults.memorySearch.provider` sur `"bedrock"` :

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // par défaut
          },
        },
      },
    }
    ```

    Les embeddings Bedrock utilisent la même chaîne d’identifiants du SDK AWS que l’inférence (rôles d’instance,
    SSO, clés d’accès, configuration partagée, et identité web). Aucune clé API n’est
    nécessaire. Lorsque `provider` vaut `"auto"`, Bedrock est auto-détecté si cette
    chaîne d’identifiants se résout avec succès.

    Les modèles d’embeddings pris en charge incluent Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4), et TwelveLabs Marengo. Voir
    [Référence de configuration de la mémoire -- Bedrock](/fr/reference/memory-config#bedrock-embedding-config)
    pour la liste complète des modèles et les options de dimensions.

  </Accordion>

  <Accordion title="Remarques et limites">
    - Bedrock exige que **l’accès au modèle** soit activé dans votre compte/région AWS.
    - La découverte automatique nécessite les permissions `bedrock:ListFoundationModels` et
      `bedrock:ListInferenceProfiles`.
    - Si vous comptez sur le mode auto, définissez l’un des marqueurs d’environnement AWS pris en charge sur l’hôte
      gateway. Si vous préférez l’authentification IMDS/configuration partagée sans marqueurs d’environnement, définissez
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw expose la source d’identifiants dans cet ordre : `AWS_BEARER_TOKEN_BEDROCK`,
      puis `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, puis `AWS_PROFILE`, puis la
      chaîne par défaut du SDK AWS.
    - La prise en charge du raisonnement dépend du modèle ; consultez la fiche modèle Bedrock pour
      connaître les capacités actuelles.
    - Si vous préférez un flux de clés géré, vous pouvez aussi placer un proxy
      compatible OpenAI devant Bedrock et le configurer à la place comme fournisseur OpenAI.
  </Accordion>
</AccordionGroup>

## Articles connexes

<CardGroup cols={2}>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, références de modèles et comportement de bascule.
  </Card>
  <Card title="Recherche mémoire" href="/fr/concepts/memory-search" icon="magnifying-glass">
    Configuration des embeddings Bedrock pour la recherche mémoire.
  </Card>
  <Card title="Référence de configuration mémoire" href="/fr/reference/memory-config#bedrock-embedding-config" icon="database">
    Liste complète des modèles d’embeddings Bedrock et options de dimensions.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
