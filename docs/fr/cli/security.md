---
read_when:
    - Vous voulez exécuter un audit de sécurité rapide sur la configuration/l’état
    - Vous voulez appliquer des suggestions de correction sûres (`fix`) (autorisations, durcissement des valeurs par défaut)
summary: Référence CLI pour `openclaw security` (auditer et corriger les pièges de sécurité courants)
title: security
x-i18n:
    generated_at: "2026-04-05T12:39:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Outils de sécurité (audit + correctifs facultatifs).

Voir aussi :

- Guide de sécurité : [Security](/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

L’audit avertit lorsque plusieurs expéditeurs DM partagent la session principale et recommande le **mode DM sécurisé** : `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` pour les canaux multi-comptes) pour les boîtes de réception partagées.
Cela vise le durcissement des boîtes de réception coopératives/partagées. Une seule Gateway partagée par des opérateurs mutuellement non fiables/adverses n’est pas une configuration recommandée ; séparez les limites de confiance avec des gateways distinctes (ou des utilisateurs/systèmes d’exploitation/hôtes distincts).
Il émet aussi `security.trust_model.multi_user_heuristic` lorsque la configuration suggère probablement une entrée à utilisateurs partagés (par exemple politique DM/groupe ouverte, cibles de groupe configurées ou règles génériques d’expéditeur), et rappelle qu’OpenClaw suit par défaut un modèle de confiance d’assistant personnel.
Pour les configurations intentionnellement partagées entre plusieurs utilisateurs, les recommandations de l’audit sont de sandboxer toutes les sessions, de conserver l’accès au système de fichiers limité au workspace et de ne pas exposer d’identités ou d’identifiants personnels/privés dans cet environnement d’exécution.
Il avertit aussi lorsque de petits modèles (`<=300B`) sont utilisés sans sandboxing et avec les outils web/navigateur activés.
Pour l’entrée webhook, il avertit lorsque `hooks.token` réutilise le jeton Gateway, lorsque `hooks.token` est court, lorsque `hooks.path="/"`, lorsque `hooks.defaultSessionKey` n’est pas défini, lorsque `hooks.allowedAgentIds` n’est pas restreint, lorsque les surcharges de `sessionKey` de requête sont activées, et lorsque les surcharges sont activées sans `hooks.allowedSessionKeyPrefixes`.
Il avertit aussi lorsque des paramètres Docker de sandbox sont configurés alors que le mode sandbox est désactivé, lorsque `gateway.nodes.denyCommands` utilise des entrées inefficaces de type motif/inconnues (correspondance exacte uniquement sur les noms de commandes de nœud, pas de filtrage du texte shell), lorsque `gateway.nodes.allowCommands` active explicitement des commandes de nœud dangereuses, lorsque `tools.profile="minimal"` global est surchargé par des profils d’outils d’agent, lorsque des groupes ouverts exposent des outils runtime/système de fichiers sans protections sandbox/workspace, et lorsque des outils de plugins d’extension installés peuvent être accessibles sous une politique d’outils permissive.
Il signale aussi `gateway.allowRealIpFallback=true` (risque d’usurpation d’en-tête si les proxys sont mal configurés) et `discovery.mdns.mode="full"` (fuite de métadonnées via les enregistrements TXT mDNS).
Il avertit aussi lorsque le navigateur sandbox utilise le réseau Docker `bridge` sans `sandbox.browser.cdpSourceRange`.
Il signale aussi les modes réseau Docker sandbox dangereux (y compris `host` et les jonctions d’espace de noms `container:*`).
Il avertit aussi lorsque des conteneurs Docker existants du navigateur sandbox ont des labels de hachage absents/obsolètes (par exemple des conteneurs d’avant migration sans `openclaw.browserConfigEpoch`) et recommande `openclaw sandbox recreate --browser --all`.
Il avertit aussi lorsque les enregistrements d’installation de plugin/hook basés sur npm ne sont pas épinglés, n’ont pas de métadonnées d’intégrité ou divergent des versions de paquets actuellement installées.
Il avertit lorsque les listes d’autorisation de canaux s’appuient sur des noms/e-mails/tags modifiables plutôt que sur des IDs stables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, portées IRC selon le cas).
Il avertit lorsque `gateway.auth.mode="none"` laisse les API HTTP Gateway accessibles sans secret partagé (`/tools/invoke` plus tout point de terminaison `/v1/*` activé).
Les paramètres préfixés par `dangerous`/`dangerously` sont des surcharges explicites de secours opérateur ; en activer un ne constitue pas, à lui seul, un signalement de vulnérabilité de sécurité.
Pour l’inventaire complet des paramètres dangereux, consultez la section « Insecure or dangerous flags summary » dans [Security](/gateway/security).

Comportement de SecretRef :

- `security audit` résout les SecretRefs pris en charge en mode lecture seule pour ses chemins ciblés.
- Si un SecretRef n’est pas disponible dans le chemin de commande actuel, l’audit continue et signale `secretDiagnostics` (au lieu de planter).
- `--token` et `--password` ne surchargent l’authentification de sonde approfondie que pour cette invocation de commande ; ils ne réécrivent ni la configuration ni les mappages SecretRef.

## Sortie JSON

Utilisez `--json` pour les vérifications CI/politiques :

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Si `--fix` et `--json` sont combinés, la sortie inclut à la fois les actions de correction et le rapport final :

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Ce que `--fix` modifie

`--fix` applique des remédiations sûres et déterministes :

- fait basculer les `groupPolicy="open"` courants vers `groupPolicy="allowlist"` (y compris les variantes de compte dans les canaux pris en charge)
- lorsque la politique de groupe WhatsApp bascule vers `allowlist`, initialise `groupAllowFrom` à partir du fichier `allowFrom` stocké lorsque cette liste existe et que la configuration ne définit pas déjà `allowFrom`
- définit `logging.redactSensitive` de `"off"` à `"tools"`
- renforce les autorisations pour l’état/la configuration et les fichiers sensibles courants
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, les fichiers de session
  `*.jsonl`)
- renforce aussi les fichiers d’inclusion de configuration référencés depuis `openclaw.json`
- utilise `chmod` sur les hôtes POSIX et des réinitialisations `icacls` sous Windows

`--fix` ne fait **pas** :

- faire tourner les jetons/mots de passe/clés API
- désactiver des outils (`gateway`, `cron`, `exec`, etc.)
- modifier les choix de liaison/auth/exposition réseau de la gateway
- supprimer ou réécrire des plugins/Skills
