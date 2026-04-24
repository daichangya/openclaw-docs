---
read_when:
    - Vous souhaitez exécuter un audit rapide de sécurité sur la configuration/l’état
    - Vous souhaitez appliquer des suggestions de correction sûres (« fix ») (autorisations, renforcement des valeurs par défaut)
summary: Référence CLI pour `openclaw security` (auditer et corriger les pièges de sécurité courants)
title: Sécurité
x-i18n:
    generated_at: "2026-04-24T07:05:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Outils de sécurité (audit + corrections facultatives).

Voir aussi :

- Guide de sécurité : [Sécurité](/fr/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

L’audit avertit lorsque plusieurs expéditeurs de messages privés partagent la session principale et recommande le **mode sécurisé pour les messages privés** : `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` pour les canaux multi-comptes) pour les boîtes de réception partagées.
Cela concerne le renforcement des boîtes de réception coopératives/partagées. Un seul Gateway partagé par des opérateurs mutuellement non fiables/adverses n’est pas une configuration recommandée ; séparez les limites de confiance avec des Gateways distincts (ou des utilisateurs/hôtes OS distincts).
Il émet également `security.trust_model.multi_user_heuristic` lorsque la configuration suggère une entrée probablement partagée entre utilisateurs (par exemple une politique ouverte de messages privés/de groupe, des cibles de groupe configurées ou des règles d’expéditeur génériques), et rappelle qu’OpenClaw suit par défaut un modèle de confiance d’assistant personnel.
Pour les configurations intentionnelles à utilisateurs partagés, les recommandations de l’audit consistent à isoler toutes les sessions, à limiter l’accès au système de fichiers à l’espace de travail et à ne pas placer d’identités ou d’identifiants personnels/privés sur cette exécution.
Il avertit également lorsque de petits modèles (`<=300B`) sont utilisés sans isolation avec les outils web/navigateur activés.
Pour les entrées Webhook, il avertit lorsque `hooks.token` réutilise le jeton Gateway, lorsque `hooks.token` est court, lorsque `hooks.path="/"`, lorsque `hooks.defaultSessionKey` n’est pas défini, lorsque `hooks.allowedAgentIds` n’est pas restreint, lorsque les remplacements de `sessionKey` de requête sont activés, et lorsque les remplacements sont activés sans `hooks.allowedSessionKeyPrefixes`.
Il avertit également lorsque des paramètres Docker de sandbox sont configurés alors que le mode sandbox est désactivé, lorsque `gateway.nodes.denyCommands` utilise des entrées inefficaces de type motif/inconnues (correspondance exacte sur le nom de commande Node uniquement, pas de filtrage du texte shell), lorsque `gateway.nodes.allowCommands` active explicitement des commandes Node dangereuses, lorsque le `tools.profile="minimal"` global est remplacé par des profils d’outils d’agent, lorsque des groupes ouverts exposent des outils d’exécution/système de fichiers sans protections de sandbox/espace de travail, et lorsque des outils de Plugin installés peuvent être accessibles sous une politique d’outils permissive.
Il signale également `gateway.allowRealIpFallback=true` (risque d’usurpation d’en-tête si les proxys sont mal configurés) et `discovery.mdns.mode="full"` (fuite de métadonnées via les enregistrements TXT mDNS).
Il avertit également lorsque le navigateur sandbox utilise le réseau Docker `bridge` sans `sandbox.browser.cdpSourceRange`.
Il signale aussi les modes réseau Docker sandbox dangereux (y compris `host` et les jonctions d’espace de noms `container:*`).
Il avertit également lorsque des conteneurs Docker de navigateur sandbox existants ont des libellés de hachage manquants/obsolètes (par exemple des conteneurs antérieurs à la migration sans `openclaw.browserConfigEpoch`) et recommande `openclaw sandbox recreate --browser --all`.
Il avertit également lorsque les enregistrements d’installation de Plugin/hook basés sur npm ne sont pas épinglés, n’ont pas de métadonnées d’intégrité ou divergent des versions de package actuellement installées.
Il avertit lorsque les listes d’autorisation de canal reposent sur des noms/e-mails/tags modifiables au lieu d’identifiants stables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, portées IRC lorsqu’applicable).
Il avertit lorsque `gateway.auth.mode="none"` laisse les API HTTP Gateway accessibles sans secret partagé (`/tools/invoke` plus tout endpoint `/v1/*` activé).
Les paramètres préfixés par `dangerous`/`dangerously` sont des remplacements explicites de type bris de glace pour l’opérateur ; en activer un ne constitue pas, en soi, un rapport de vulnérabilité de sécurité.
Pour l’inventaire complet des paramètres dangereux, consultez la section « Résumé des indicateurs non sécurisés ou dangereux » dans [Sécurité](/fr/gateway/security).

Comportement de SecretRef :

- `security audit` résout les SecretRefs pris en charge en mode lecture seule pour ses chemins ciblés.
- Si un SecretRef n’est pas disponible dans le chemin de commande courant, l’audit continue et signale `secretDiagnostics` (au lieu de planter).
- `--token` et `--password` ne remplacent l’authentification de sonde approfondie que pour cette invocation de commande ; ils ne réécrivent ni la configuration ni les mappages SecretRef.

## Sortie JSON

Utilisez `--json` pour les vérifications CI/politiques :

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Si `--fix` et `--json` sont combinés, la sortie inclut à la fois les actions de correction et le rapport final :

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Ce que modifie `--fix`

`--fix` applique des remédiations sûres et déterministes :

- bascule les `groupPolicy="open"` courants en `groupPolicy="allowlist"` (y compris les variantes de compte dans les canaux pris en charge)
- lorsque la politique de groupe WhatsApp bascule en `allowlist`, initialise `groupAllowFrom` à partir
  du fichier `allowFrom` stocké lorsque cette liste existe et que la configuration ne
  définit pas déjà `allowFrom`
- définit `logging.redactSensitive` de `"off"` à `"tools"`
- renforce les autorisations pour les fichiers d’état/de configuration et les fichiers sensibles courants
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- renforce également les fichiers inclus de configuration référencés depuis `openclaw.json`
- utilise `chmod` sur les hôtes POSIX et des réinitialisations `icacls` sur Windows

`--fix` ne fait **pas** :

- faire tourner les jetons/mots de passe/clés API
- désactiver des outils (`gateway`, `cron`, `exec`, etc.)
- modifier les choix d’exposition de liaison/authentification/réseau du Gateway
- supprimer ou réécrire des Plugins/Skills

## Voir aussi

- [Référence CLI](/fr/cli)
- [Audit de sécurité](/fr/gateway/security)
