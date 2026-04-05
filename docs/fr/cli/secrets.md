---
read_when:
    - Nouvelle résolution des références de secret à l’exécution
    - Audit des résidus en texte brut et des références non résolues
    - Configuration des SecretRefs et application de modifications de nettoyage à sens unique
summary: Référence CLI pour `openclaw secrets` (recharger, auditer, configurer, appliquer)
title: secrets
x-i18n:
    generated_at: "2026-04-05T12:39:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Utilisez `openclaw secrets` pour gérer les SecretRefs et maintenir en bon état l’instantané d’exécution actif.

Rôles des commandes :

- `reload` : RPC de passerelle (`secrets.reload`) qui résout à nouveau les références et remplace l’instantané d’exécution uniquement en cas de succès complet (aucune écriture de configuration).
- `audit` : analyse en lecture seule des stockages configuration/auth/modèles générés et des résidus historiques pour détecter le texte brut, les références non résolues et les dérives de priorité (les références exec sont ignorées sauf si `--allow-exec` est défini).
- `configure` : planificateur interactif pour la configuration du fournisseur, le mappage des cibles et le preflight (TTY requis).
- `apply` : exécuter un plan enregistré (`--dry-run` pour validation uniquement ; le dry-run ignore les vérifications exec par défaut, et le mode écriture rejette les plans contenant exec sauf si `--allow-exec` est défini), puis nettoyer les résidus en texte brut ciblés.

Boucle opérateur recommandée :

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Si votre plan inclut des SecretRefs/fournisseurs `exec`, passez `--allow-exec` à la fois sur les commandes d’application dry-run et en écriture.

Remarque sur les codes de sortie pour CI/gates :

- `audit --check` renvoie `1` en cas de détections.
- les références non résolues renvoient `2`.

Associé :

- Guide des secrets : [Gestion des secrets](/gateway/secrets)
- Surface des identifiants : [Surface des identifiants SecretRef](/reference/secretref-credential-surface)
- Guide de sécurité : [Sécurité](/gateway/security)

## Recharger l’instantané d’exécution

Résoudre à nouveau les références de secret et remplacer l’instantané d’exécution de manière atomique.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Remarques :

- Utilise la méthode RPC de passerelle `secrets.reload`.
- Si la résolution échoue, la passerelle conserve le dernier instantané valide connu et renvoie une erreur (aucune activation partielle).
- La réponse JSON inclut `warningCount`.

Options :

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audit

Analyser l’état d’OpenClaw pour détecter :

- le stockage de secrets en texte brut
- les références non résolues
- la dérive de priorité (identifiants `auth-profiles.json` masquant des références `openclaw.json`)
- les résidus générés `agents/*/agent/models.json` (valeurs `apiKey` des fournisseurs et en-têtes sensibles des fournisseurs)
- les résidus historiques (entrées historiques du magasin d’auth, rappels OAuth)

Remarque sur les résidus d’en-tête :

- La détection des en-têtes sensibles des fournisseurs est basée sur des heuristiques de nommage (noms et fragments courants d’en-têtes d’auth/identifiants tels que `authorization`, `x-api-key`, `token`, `secret`, `password` et `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Comportement de sortie :

- `--check` quitte avec un code non nul en cas de détections.
- les références non résolues quittent avec un code non nul de priorité supérieure.

Points importants de la structure du rapport :

- `status` : `clean | findings | unresolved`
- `resolution` : `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary` : `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- codes de détection :
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (assistant interactif)

Construire interactivement les modifications de fournisseur et de SecretRef, exécuter le preflight et éventuellement appliquer :

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flux :

- Configuration du fournisseur d’abord (`add/edit/remove` pour les alias `secrets.providers`).
- Mappage des identifiants ensuite (sélection des champs et attribution de références `{source, provider, id}`).
- Preflight et application facultative en dernier.

Indicateurs :

- `--providers-only` : configurer uniquement `secrets.providers`, ignorer le mappage des identifiants.
- `--skip-provider-setup` : ignorer la configuration du fournisseur et mapper les identifiants vers des fournisseurs existants.
- `--agent <id>` : limiter la découverte des cibles et les écritures dans `auth-profiles.json` à un seul magasin d’agent.
- `--allow-exec` : autoriser les vérifications exec SecretRef pendant le preflight/l’application (peut exécuter des commandes fournisseur).

Remarques :

- Nécessite un TTY interactif.
- Vous ne pouvez pas combiner `--providers-only` avec `--skip-provider-setup`.
- `configure` cible les champs contenant des secrets dans `openclaw.json` ainsi que `auth-profiles.json` pour la portée d’agent sélectionnée.
- `configure` prend en charge la création directe de nouveaux mappages `auth-profiles.json` dans le flux de sélection.
- Surface canonique prise en charge : [Surface des identifiants SecretRef](/reference/secretref-credential-surface).
- Il effectue une résolution preflight avant l’application.
- Si le preflight/l’application inclut des références exec, gardez `--allow-exec` activé pour les deux étapes.
- Les plans générés utilisent par défaut des options de nettoyage (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` tous activés).
- Le chemin d’application est à sens unique pour les valeurs en texte brut nettoyées.
- Sans `--apply`, la CLI demande quand même `Apply this plan now?` après le preflight.
- Avec `--apply` (et sans `--yes`), la CLI demande une confirmation supplémentaire irréversible.
- `--json` affiche le plan + le rapport preflight, mais la commande nécessite toujours un TTY interactif.

Remarque de sécurité sur les fournisseurs exec :

- Les installations Homebrew exposent souvent des binaires liés symboliquement sous `/opt/homebrew/bin/*`.
- Définissez `allowSymlinkCommand: true` uniquement si nécessaire pour des chemins de gestionnaire de paquets de confiance, et associez-le à `trustedDirs` (par exemple `["/opt/homebrew"]`).
- Sous Windows, si la vérification ACL n’est pas disponible pour un chemin de fournisseur, OpenClaw échoue en mode fermé. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur pour contourner les vérifications de sécurité de chemin.

## Appliquer un plan enregistré

Appliquer ou exécuter le preflight d’un plan généré précédemment :

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Comportement exec :

- `--dry-run` valide le preflight sans écrire de fichiers.
- Les vérifications exec SecretRef sont ignorées par défaut en dry-run.
- Le mode écriture rejette les plans qui contiennent des SecretRefs/fournisseurs exec sauf si `--allow-exec` est défini.
- Utilisez `--allow-exec` pour autoriser explicitement les vérifications/exécutions de fournisseur exec dans l’un ou l’autre mode.

Détails du contrat de plan (chemins cibles autorisés, règles de validation et sémantique d’échec) :

- [Contrat de plan d’application des secrets](/gateway/secrets-plan-contract)

Ce que `apply` peut mettre à jour :

- `openclaw.json` (cibles SecretRef + upserts/suppressions de fournisseurs)
- `auth-profiles.json` (nettoyage des cibles de fournisseur)
- résidus historiques `auth.json`
- clés secrètes connues dans `~/.openclaw/.env` dont les valeurs ont été migrées

## Pourquoi il n’y a pas de sauvegardes de restauration

`secrets apply` n’écrit intentionnellement pas de sauvegardes de restauration contenant d’anciennes valeurs en texte brut.

La sécurité provient d’un preflight strict + d’une application quasi atomique avec restauration en mémoire best-effort en cas d’échec.

## Exemple

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Si `audit --check` signale toujours des détections de texte brut, mettez à jour les chemins cibles restants signalés puis relancez l’audit.
