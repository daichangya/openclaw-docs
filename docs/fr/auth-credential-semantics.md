---
read_when:
    - Travail sur la résolution des profils d’authentification ou le routage des identifiants
    - Débogage des échecs d’authentification du modèle ou de l’ordre des profils
summary: Sémantique canonique d’éligibilité des identifiants et de résolution pour les profils d’authentification
title: Sémantique des identifiants d’authentification
x-i18n:
    generated_at: "2026-04-24T06:59:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b45da872b9ab177acbac08ce353b6ee31b6a068477ace52e5e5eda32a848d8bb
    source_path: auth-credential-semantics.md
    workflow: 15
---

Ce document définit la sémantique canonique d’éligibilité des identifiants et de résolution utilisée dans l’ensemble de :

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L’objectif est de maintenir l’alignement entre le comportement au moment de la sélection et celui à l’exécution.

## Codes de raison stables pour la sonde

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Identifiants de jeton

Les identifiants de jeton (`type: "token"`) prennent en charge `token` inline et/ou `tokenRef`.

### Règles d’éligibilité

1. Un profil de jeton n’est pas éligible lorsque `token` et `tokenRef` sont tous deux absents.
2. `expires` est facultatif.
3. Si `expires` est présent, il doit s’agir d’un nombre fini supérieur à `0`.
4. Si `expires` est invalide (`NaN`, `0`, négatif, non fini ou du mauvais type), le profil n’est pas éligible avec `invalid_expires`.
5. Si `expires` se situe dans le passé, le profil n’est pas éligible avec `expired`.
6. `tokenRef` ne contourne pas la validation de `expires`.

### Règles de résolution

1. La sémantique du résolveur correspond à la sémantique d’éligibilité pour `expires`.
2. Pour les profils éligibles, le contenu du jeton peut être résolu à partir d’une valeur inline ou de `tokenRef`.
3. Les références impossibles à résoudre produisent `unresolved_ref` dans la sortie de `models status --probe`.

## Filtrage explicite de l’ordre d’authentification

- Lorsque `auth.order.<provider>` ou la surcharge d’ordre du magasin d’authentification est définie pour un provider, `models status --probe` ne sonde que les identifiants de profil qui restent dans l’ordre d’authentification résolu pour ce provider.
- Un profil stocké pour ce provider qui est omis de l’ordre explicite n’est pas essayé silencieusement plus tard. La sortie de la sonde le signale avec `reasonCode: excluded_by_auth_order` et le détail
  `Excluded by auth.order for this provider.`

## Résolution des cibles de sonde

- Les cibles de sonde peuvent provenir des profils d’authentification, des identifiants d’environnement ou de `models.json`.
- Si un provider dispose d’identifiants mais qu’OpenClaw ne peut pas résoudre de candidat de modèle pouvant être sondé pour celui-ci, `models status --probe` signale `status: no_model` avec `reasonCode: no_model`.

## Garde de politique SecretRef OAuth

- L’entrée SecretRef est réservée aux identifiants statiques uniquement.
- Si un identifiant de profil est de `type: "oauth"`, les objets SecretRef ne sont pas pris en charge pour le contenu de cet identifiant de profil.
- Si `auth.profiles.<id>.mode` est `"oauth"`, l’entrée `keyRef`/`tokenRef` basée sur SecretRef pour ce profil est rejetée.
- Les violations constituent des échecs bloquants dans les chemins de résolution d’authentification au démarrage/rechargement.

## Messagerie compatible avec l’existant

Pour la compatibilité des scripts, les erreurs de sonde conservent cette première ligne inchangée :

`Auth profile credentials are missing or expired.`

Des détails conviviaux et des codes de raison stables peuvent être ajoutés sur les lignes suivantes.

## Lié

- [Gestion des secrets](/fr/gateway/secrets)
- [Stockage de l’authentification](/fr/concepts/oauth)
