---
read_when:
    - Travail sur la résolution des profils d’authentification ou le routage des identifiants
    - Débogage des échecs d’authentification des modèles ou de l’ordre des profils
summary: Sémantique canonique d’éligibilité et de résolution des identifiants pour les profils d’authentification
title: Sémantique des identifiants d’authentification
x-i18n:
    generated_at: "2026-04-05T12:34:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd3e16cd25eb22c5e707311d06a19df1a59747ee3261c2d32c534a245fd7fb
    source_path: auth-credential-semantics.md
    workflow: 15
---

# Sémantique des identifiants d’authentification

Ce document définit la sémantique canonique d’éligibilité et de résolution des identifiants utilisée dans l’ensemble de :

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L’objectif est de maintenir l’alignement entre le comportement au moment de la sélection et celui à l’exécution.

## Codes de raison de probe stables

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Identifiants de jeton

Les identifiants de jeton (`type: "token"`) prennent en charge `token` en ligne et/ou `tokenRef`.

### Règles d’éligibilité

1. Un profil de jeton n’est pas éligible lorsque `token` et `tokenRef` sont tous deux absents.
2. `expires` est facultatif.
3. Si `expires` est présent, il doit s’agir d’un nombre fini supérieur à `0`.
4. Si `expires` est invalide (`NaN`, `0`, négatif, non fini ou de type incorrect), le profil n’est pas éligible avec `invalid_expires`.
5. Si `expires` se situe dans le passé, le profil n’est pas éligible avec `expired`.
6. `tokenRef` ne contourne pas la validation de `expires`.

### Règles de résolution

1. La sémantique du résolveur correspond à la sémantique d’éligibilité pour `expires`.
2. Pour les profils éligibles, le matériel de jeton peut être résolu à partir d’une valeur en ligne ou de `tokenRef`.
3. Les références impossibles à résoudre produisent `unresolved_ref` dans la sortie de `models status --probe`.

## Filtrage explicite de l’ordre d’authentification

- Lorsque `auth.order.<provider>` ou la surcharge d’ordre du magasin d’authentification est définie pour un fournisseur, `models status --probe` ne probe que les identifiants de profil qui restent dans l’ordre d’authentification résolu pour ce fournisseur.
- Un profil stocké pour ce fournisseur qui est omis de l’ordre explicite n’est pas essayé silencieusement plus tard. La sortie de probe le signale avec `reasonCode: excluded_by_auth_order` et le détail `Excluded by auth.order for this provider.`

## Résolution de la cible de probe

- Les cibles de probe peuvent provenir des profils d’authentification, des identifiants d’environnement ou de `models.json`.
- Si un fournisseur a des identifiants mais qu’OpenClaw ne peut pas résoudre de candidat de modèle probeable pour lui, `models status --probe` signale `status: no_model` avec `reasonCode: no_model`.

## Garde de politique SecretRef OAuth

- L’entrée SecretRef est réservée aux identifiants statiques uniquement.
- Si un identifiant de profil est de `type: "oauth"`, les objets SecretRef ne sont pas pris en charge pour ce matériel d’identifiant de profil.
- Si `auth.profiles.<id>.mode` vaut `"oauth"`, l’entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.
- Les violations sont des échecs bloquants dans les chemins de résolution d’authentification au démarrage/rechargement.

## Messagerie compatible avec l’historique

Pour la compatibilité des scripts, les erreurs de probe conservent cette première ligne inchangée :

`Auth profile credentials are missing or expired.`

Des détails plus conviviaux et des codes de raison stables peuvent être ajoutés sur les lignes suivantes.
