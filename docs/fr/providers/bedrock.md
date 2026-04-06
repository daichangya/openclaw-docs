---
read_when:
    - Vous voulez utiliser des modèles Amazon Bedrock avec OpenClaw
    - Vous avez besoin de configurer les identifiants/la région AWS pour les appels de modèles
summary: Utiliser des modèles Amazon Bedrock (API Converse) avec OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-06T03:11:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70bb29fe9199084b1179ced60935b5908318f5b80ced490bf44a45e0467c4929
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw peut utiliser les modèles **Amazon Bedrock** via le fournisseur de streaming **Bedrock Converse**
de pi-ai. L’authentification Bedrock utilise la **chaîne d’identifiants par défaut du SDK AWS**,
et non une clé API.

## Ce que pi-ai prend en charge

- Fournisseur : `amazon-bedrock`
- API : `bedrock-converse-stream`
- Authentification : identifiants AWS (variables d’environnement, configuration partagée ou rôle d’instance)
- Région : `AWS_REGION` ou `AWS_DEFAULT_REGION` (par défaut : `us-east-1`)

## Découverte automatique des modèles

OpenClaw peut découvrir automatiquement les modèles Bedrock qui prennent en charge le **streaming**
et la **sortie texte**. La découverte utilise `bedrock:ListFoundationModels` et
`bedrock:ListInferenceProfiles`, et les résultats sont mis en cache (par défaut : 1 heure).

Comment le fournisseur implicite est activé :

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` vaut `true`,
  OpenClaw essaiera la découverte même si aucun marqueur d’environnement AWS n’est présent.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` n’est pas défini,
  OpenClaw n’ajoute automatiquement le
  fournisseur Bedrock implicite que lorsqu’il voit l’un de ces marqueurs d’authentification AWS :
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, ou `AWS_PROFILE`.
- Le chemin d’authentification réel de l’exécution Bedrock utilise toujours la chaîne par défaut du SDK AWS, donc
  la configuration partagée, SSO et l’authentification de rôle d’instance IMDS peuvent fonctionner même lorsque la découverte
  avait besoin de `enabled: true` pour être activée.

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

Remarques :

- `enabled` utilise par défaut le mode auto. En mode auto, OpenClaw n’active le
  fournisseur Bedrock implicite que lorsqu’il voit un marqueur d’environnement AWS pris en charge.
- `region` utilise par défaut `AWS_REGION` ou `AWS_DEFAULT_REGION`, puis `us-east-1`.
- `providerFilter` correspond aux noms de fournisseurs Bedrock (par exemple `anthropic`).
- `refreshInterval` est en secondes ; définissez-le à `0` pour désactiver le cache.
- `defaultContextWindow` (par défaut : `32000`) et `defaultMaxTokens` (par défaut : `4096`)
  sont utilisés pour les modèles découverts (remplacez-les si vous connaissez les limites de votre modèle).
- Pour les entrées explicites `models.providers["amazon-bedrock"]`, OpenClaw peut toujours
  résoudre tôt l’authentification par marqueur d’environnement Bedrock à partir de marqueurs d’environnement AWS tels que
  `AWS_BEARER_TOKEN_BEDROCK` sans forcer le chargement de l’authentification complète de l’exécution. Le
  chemin d’authentification réel des appels de modèle utilise toujours la chaîne par défaut du SDK AWS.

## Onboarding

1. Assurez-vous que les identifiants AWS sont disponibles sur l’**hôte gateway** :

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Facultatif :
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Facultatif (clé API/jeton porteur Bedrock) :
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Ajoutez un fournisseur Bedrock et un modèle à votre configuration (aucune `apiKey` requise) :

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

## Rôles d’instance EC2

Lorsque vous exécutez OpenClaw sur une instance EC2 avec un rôle IAM attaché, le SDK AWS
peut utiliser le service de métadonnées d’instance (IMDS) pour l’authentification. Pour la découverte
de modèles Bedrock, OpenClaw n’active automatiquement le fournisseur implicite qu’à partir de marqueurs d’environnement AWS
sauf si vous définissez explicitement
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Configuration recommandée pour les hôtes basés sur IMDS :

- Définissez `plugins.entries.amazon-bedrock.config.discovery.enabled` sur `true`.
- Définissez `plugins.entries.amazon-bedrock.config.discovery.region` (ou exportez `AWS_REGION`).
- Vous n’avez **pas** besoin d’une fausse clé API.
- Vous n’avez besoin de `AWS_PROFILE=default` que si vous voulez spécifiquement un marqueur d’environnement
  pour le mode auto ou les surfaces d’état.

```bash
# Recommandé : activation explicite de la découverte + région
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Facultatif : ajouter un marqueur d’environnement si vous voulez le mode auto sans activation explicite
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Permissions IAM requises** pour le rôle d’instance EC2 :

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (pour la découverte automatique)
- `bedrock:ListInferenceProfiles` (pour la découverte des profils d’inférence)

Ou attachez la politique gérée `AmazonBedrockFullAccess`.

## Configuration rapide (chemin AWS)

```bash
# 1. Créer le rôle IAM et le profil d’instance
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

# 2. L’attacher à votre instance EC2
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

## Profils d’inférence

OpenClaw découvre les **profils d’inférence régionaux et globaux** en même temps que les
foundation models. Lorsqu’un profil correspond à un foundation model connu, le
profil hérite des capacités de ce modèle (fenêtre de contexte, nombre maximal de jetons,
reasoning, vision) et la région de requête Bedrock correcte est injectée
automatiquement. Cela signifie que les profils Claude inter-région fonctionnent sans remplacements
manuels de fournisseur.

Les identifiants de profils d’inférence ressemblent à `us.anthropic.claude-opus-4-6-v1:0` (régional)
ou `anthropic.claude-opus-4-6-v1:0` (global). Si le modèle sous-jacent est déjà
dans les résultats de découverte, le profil hérite de son ensemble complet de capacités ;
sinon des valeurs par défaut sûres s’appliquent.

Aucune configuration supplémentaire n’est nécessaire. Tant que la découverte est activée et que le principal IAM
dispose de `bedrock:ListInferenceProfiles`, les profils apparaissent en même temps que les
foundation models dans `openclaw models list`.

## Remarques

- Bedrock exige que l’**accès au modèle** soit activé dans votre compte/région AWS.
- La découverte automatique nécessite les permissions `bedrock:ListFoundationModels` et
  `bedrock:ListInferenceProfiles`.
- Si vous comptez sur le mode auto, définissez l’un des marqueurs d’environnement d’authentification AWS pris en charge sur l’
  hôte gateway. Si vous préférez l’authentification IMDS/configuration partagée sans marqueurs d’environnement, définissez
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw expose la source d’identifiants dans cet ordre : `AWS_BEARER_TOKEN_BEDROCK`,
  puis `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, puis `AWS_PROFILE`, puis la
  chaîne par défaut du SDK AWS.
- La prise en charge de reasoning dépend du modèle ; vérifiez la fiche du modèle Bedrock pour les
  capacités actuelles.
- Si vous préférez un flux à clé gérée, vous pouvez aussi placer un proxy
  compatible OpenAI devant Bedrock et le configurer à la place comme fournisseur OpenAI.

## Guardrails

Vous pouvez appliquer les [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
à tous les appels de modèles Bedrock en ajoutant un objet `guardrail` à la
configuration du plugin `amazon-bedrock`. Les Guardrails vous permettent d’appliquer le filtrage de contenu,
le refus de sujets, les filtres de mots, les filtres d’informations sensibles et les vérifications
d’ancrage contextuel.

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
            trace: "enabled", // facultatif : "enabled", "disabled" ou "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier` (obligatoire) accepte un ID de guardrail (par ex. `abc123`) ou un
  ARN complet (par ex. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (obligatoire) indique quelle version publiée utiliser, ou
  `"DRAFT"` pour le brouillon de travail.
- `streamProcessingMode` (facultatif) contrôle si l’évaluation du guardrail s’exécute
  de manière synchrone (`"sync"`) ou asynchrone (`"async"`) pendant le streaming. S’il
  est omis, Bedrock utilise son comportement par défaut.
- `trace` (facultatif) active la sortie de trace du guardrail dans la réponse API. Définissez-le sur
  `"enabled"` ou `"enabled_full"` pour le débogage ; omettez-le ou définissez `"disabled"` pour la
  production.

Le principal IAM utilisé par la gateway doit disposer de la permission `bedrock:ApplyGuardrail`
en plus des permissions d’invocation standard.

## Embeddings pour la recherche mémoire

Bedrock peut également servir de fournisseur d’embeddings pour la
[recherche mémoire](/fr/concepts/memory-search). Cela se configure séparément du
fournisseur d’inférence — définissez `agents.defaults.memorySearch.provider` sur `"bedrock"` :

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

Les embeddings Bedrock utilisent la même chaîne d’identifiants du SDK AWS que l’inférence (rôles
d’instance, SSO, clés d’accès, configuration partagée et identité web). Aucune clé API n’est
nécessaire. Lorsque `provider` vaut `"auto"`, Bedrock est détecté automatiquement si cette
chaîne d’identifiants est résolue avec succès.

Les modèles d’embeddings pris en charge incluent Amazon Titan Embed (v1, v2), Amazon Nova
Embed, Cohere Embed (v3, v4) et TwelveLabs Marengo. Voir
[Référence de configuration de la mémoire — Bedrock](/fr/reference/memory-config#bedrock-embedding-config)
pour la liste complète des modèles et les options de dimension.
