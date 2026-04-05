---
read_when:
    - Vous voulez utiliser les modèles Amazon Bedrock avec OpenClaw
    - Vous avez besoin d’une configuration des identifiants/région AWS pour les appels de modèle
summary: Utiliser les modèles Amazon Bedrock (API Converse) avec OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T12:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: a751824b679a9340db714ee5227e8d153f38f6c199ca900458a4ec092b4efe54
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw peut utiliser les modèles **Amazon Bedrock** via le fournisseur de streaming **Bedrock Converse**
de pi‑ai. L’authentification Bedrock utilise la **chaîne d’identifiants par défaut du SDK AWS**,
pas une clé API.

## Ce que prend en charge pi-ai

- Fournisseur : `amazon-bedrock`
- API : `bedrock-converse-stream`
- Auth : identifiants AWS (variables d’environnement, configuration partagée ou rôle d’instance)
- Région : `AWS_REGION` ou `AWS_DEFAULT_REGION` (par défaut : `us-east-1`)

## Découverte automatique des modèles

OpenClaw peut découvrir automatiquement les modèles Bedrock qui prennent en charge le **streaming**
et la **sortie texte**. La découverte utilise `bedrock:ListFoundationModels` et
`bedrock:ListInferenceProfiles`, et les résultats sont mis en cache (par défaut : 1 heure).

Comment le fournisseur implicite est activé :

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` vaut `true`,
  OpenClaw tentera la découverte même en l’absence de marqueur AWS env.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` n’est pas défini,
  OpenClaw n’ajoute automatiquement le
  fournisseur Bedrock implicite que s’il voit l’un de ces marqueurs d’authentification AWS :
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, ou `AWS_PROFILE`.
- Le chemin réel d’authentification Bedrock à l’exécution utilise toujours la chaîne par défaut du SDK AWS, donc
  la configuration partagée, SSO et l’authentification par rôle d’instance IMDS peuvent fonctionner même lorsque la découverte
  nécessite `enabled: true` pour être activée.

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

- `enabled` est par défaut en mode auto. En mode auto, OpenClaw n’active le
  fournisseur Bedrock implicite que lorsqu’il voit un marqueur AWS env pris en charge.
- `region` vaut par défaut `AWS_REGION` ou `AWS_DEFAULT_REGION`, puis `us-east-1`.
- `providerFilter` correspond aux noms de fournisseurs Bedrock (par exemple `anthropic`).
- `refreshInterval` est en secondes ; définissez `0` pour désactiver le cache.
- `defaultContextWindow` (par défaut : `32000`) et `defaultMaxTokens` (par défaut : `4096`)
  sont utilisés pour les modèles découverts (remplacez-les si vous connaissez les limites de votre modèle).
- Pour les entrées explicites `models.providers["amazon-bedrock"]`, OpenClaw peut toujours
  résoudre tôt l’authentification Bedrock basée sur les marqueurs env à partir des marqueurs AWS env comme
  `AWS_BEARER_TOKEN_BEDROCK` sans forcer le chargement complet de l’authentification d’exécution. Le
  chemin réel d’authentification des appels de modèle utilise toujours la chaîne par défaut du SDK AWS.

## Onboarding

1. Assurez-vous que les identifiants AWS sont disponibles sur l’**hôte Gateway** :

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Optional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Optional (Bedrock API key/bearer token):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Ajoutez un fournisseur Bedrock et un modèle à votre configuration (aucun `apiKey` requis) :

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
des modèles Bedrock, OpenClaw n’active automatiquement le fournisseur implicite que depuis les marqueurs AWS env
sauf si vous définissez explicitement
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Configuration recommandée pour les hôtes basés sur IMDS :

- Définissez `plugins.entries.amazon-bedrock.config.discovery.enabled` sur `true`.
- Définissez `plugins.entries.amazon-bedrock.config.discovery.region` (ou exportez `AWS_REGION`).
- Vous n’avez **pas** besoin d’une fausse clé API.
- Vous n’avez besoin de `AWS_PROFILE=default` que si vous voulez spécifiquement un marqueur env
  pour le mode auto ou les surfaces d’état.

```bash
# Recommended: explicit discovery enable + region
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Optional: add an env marker if you want auto mode without explicit enable
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
# 1. Create IAM role and instance profile
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

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Profils d’inférence

OpenClaw découvre les **profils d’inférence régionaux et globaux** en même temps que
les modèles foundation. Lorsqu’un profil correspond à un modèle foundation connu, le
profil hérite des capacités de ce modèle (fenêtre de contexte, max tokens,
raisonnement, vision) et la bonne région Bedrock de requête est injectée
automatiquement. Cela signifie que les profils Claude inter-régions fonctionnent sans surcharges manuelles du fournisseur.

Les identifiants de profils d’inférence ressemblent à `us.anthropic.claude-opus-4-6-v1:0` (régional)
ou `anthropic.claude-opus-4-6-v1:0` (global). Si le modèle sous-jacent est déjà
dans les résultats de découverte, le profil hérite de son ensemble complet de capacités ;
sinon des valeurs par défaut sûres s’appliquent.

Aucune configuration supplémentaire n’est nécessaire. Tant que la découverte est activée et que le principal IAM
dispose de `bedrock:ListInferenceProfiles`, les profils apparaissent à côté
des modèles foundation dans `openclaw models list`.

## Remarques

- Bedrock exige que l’**accès au modèle** soit activé dans votre compte/région AWS.
- La découverte automatique nécessite les permissions `bedrock:ListFoundationModels` et
  `bedrock:ListInferenceProfiles`.
- Si vous comptez sur le mode auto, définissez sur l’hôte Gateway l’un des marqueurs AWS auth env pris en charge. Si vous préférez l’authentification IMDS/shared-config sans marqueurs env, définissez
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw expose la source des identifiants dans cet ordre : `AWS_BEARER_TOKEN_BEDROCK`,
  puis `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, puis `AWS_PROFILE`, puis la
  chaîne par défaut du SDK AWS.
- La prise en charge du raisonnement dépend du modèle ; vérifiez la fiche modèle Bedrock pour
  les capacités actuelles.
- Si vous préférez un flux de clé géré, vous pouvez aussi placer un proxy
  compatible OpenAI devant Bedrock et le configurer à la place comme fournisseur OpenAI.

## Guardrails

Vous pouvez appliquer les [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
à tous les appels de modèle Bedrock en ajoutant un objet `guardrail` à la
configuration du plugin `amazon-bedrock`. Les Guardrails vous permettent d’appliquer le filtrage de contenu,
le refus de sujet, les filtres de mots, les filtres d’informations sensibles et les vérifications
d’ancrage contextuel.

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // guardrail ID or full ARN
            guardrailVersion: "1", // version number or "DRAFT"
            streamProcessingMode: "sync", // optional: "sync" or "async"
            trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier` (requis) accepte un identifiant de guardrail (par ex. `abc123`) ou un
  ARN complet (par ex. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (requis) précise quelle version publiée utiliser, ou
  `"DRAFT"` pour le brouillon de travail.
- `streamProcessingMode` (facultatif) contrôle si l’évaluation des guardrails s’exécute
  de manière synchrone (`"sync"`) ou asynchrone (`"async"`) pendant le streaming. Si
  omis, Bedrock utilise son comportement par défaut.
- `trace` (facultatif) active la sortie de trace des guardrails dans la réponse API. Définissez-la sur
  `"enabled"` ou `"enabled_full"` pour le débogage ; omettez-la ou définissez `"disabled"` pour
  la production.

Le principal IAM utilisé par la passerelle doit disposer de la permission `bedrock:ApplyGuardrail`
en plus des permissions standard d’invocation.
