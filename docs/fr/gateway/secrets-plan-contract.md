---
read_when:
    - Génération ou révision de plans `openclaw secrets apply`
    - Débogage des erreurs `Invalid plan target path`
    - Compréhension du comportement de validation des types de cible et des chemins
summary: 'Contrat des plans `secrets apply` : validation des cibles, correspondance des chemins et portée des cibles `auth-profiles.json`'
title: Contrat de plan d’application des secrets
x-i18n:
    generated_at: "2026-04-05T12:43:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# Contrat de plan d’application des secrets

Cette page définit le contrat strict appliqué par `openclaw secrets apply`.

Si une cible ne correspond pas à ces règles, l’application échoue avant de modifier la configuration.

## Structure du fichier de plan

`openclaw secrets apply --from <plan.json>` attend un tableau `targets` de cibles de plan :

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## Portée des cibles prise en charge

Les cibles de plan sont acceptées pour les chemins d’identifiants pris en charge dans :

- [Surface des identifiants SecretRef](/reference/secretref-credential-surface)

## Comportement du type de cible

Règle générale :

- `target.type` doit être reconnu et doit correspondre à la forme normalisée de `target.path`.

Les alias de compatibilité restent acceptés pour les plans existants :

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Règles de validation des chemins

Chaque cible est validée avec tous les éléments suivants :

- `type` doit être un type de cible reconnu.
- `path` doit être un chemin par points non vide.
- `pathSegments` peut être omis. S’il est fourni, il doit se normaliser exactement vers le même chemin que `path`.
- Les segments interdits sont rejetés : `__proto__`, `prototype`, `constructor`.
- Le chemin normalisé doit correspondre à la forme de chemin enregistrée pour le type de cible.
- Si `providerId` ou `accountId` est défini, il doit correspondre à l’identifiant encodé dans le chemin.
- Les cibles `auth-profiles.json` nécessitent `agentId`.
- Lors de la création d’un nouveau mappage `auth-profiles.json`, incluez `authProfileProvider`.

## Comportement en cas d’échec

Si une cible échoue à la validation, l’application quitte avec une erreur comme :

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Aucune écriture n’est validée pour un plan invalide.

## Comportement de consentement des fournisseurs exec

- `--dry-run` ignore par défaut les vérifications exec SecretRef.
- Les plans contenant des SecretRefs/fournisseurs exec sont rejetés en mode écriture sauf si `--allow-exec` est défini.
- Lors de la validation/application de plans contenant exec, passez `--allow-exec` dans les commandes dry-run et en écriture.

## Remarques sur la portée d’exécution et d’audit

- Les entrées `auth-profiles.json` basées uniquement sur des références (`keyRef`/`tokenRef`) sont incluses dans la résolution à l’exécution et dans la couverture d’audit.
- `secrets apply` écrit les cibles `openclaw.json` prises en charge, les cibles `auth-profiles.json` prises en charge et les cibles de nettoyage facultatives.

## Vérifications opérateur

```bash
# Valider le plan sans écrire
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Puis l’appliquer pour de vrai
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Pour les plans contenant exec, autorisez explicitement dans les deux modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Si l’application échoue avec un message de chemin cible invalide, régénérez le plan avec `openclaw secrets configure` ou corrigez le chemin cible vers une forme prise en charge ci-dessus.

## Documentation associée

- [Gestion des secrets](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [Surface des identifiants SecretRef](/reference/secretref-credential-surface)
- [Référence de configuration](/gateway/configuration-reference)
