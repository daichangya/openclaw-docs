---
read_when:
    - Le centre de dépannage vous a orienté ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de guide de dépannage stables, basées sur les symptômes, avec des commandes exactes
summary: Guide de dépannage approfondi pour Gateway, les canaux, l’automatisation, les Nodes et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-04-20T07:05:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d93a82407dbb1314b91a809ff9433114e1e9a3b56d46547ef53a8196bac06260
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Dépannage de Gateway

Cette page est le guide de dépannage approfondi.
Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous voulez d’abord le flux de triage rapide.

## Échelle de commandes

Exécutez-les d’abord, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux attendus lorsque tout fonctionne correctement :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration/service.
- `openclaw channels status --probe` affiche l’état de transport en direct par compte et, lorsqu’ils sont pris en charge, les résultats de sonde/audit comme `works` ou `audit ok`.

## Anthropic 429 : usage supplémentaire requis pour le contexte long

Utilisez ceci lorsque les journaux/erreurs contiennent :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

À rechercher :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- Les identifiants Anthropic actuels ne sont pas éligibles à l’usage du contexte long.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui nécessitent le chemin bêta 1M.

Options de correction :

1. Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
2. Utilisez des identifiants Anthropic éligibles aux requêtes à contexte long, ou passez à une clé API Anthropic.
3. Configurez des modèles de secours afin que les exécutions continuent lorsque les requêtes Anthropic à contexte long sont rejetées.

Voir aussi :

- [/providers/anthropic](/fr/providers/anthropic)
- [/reference/token-use](/fr/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/fr/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Un backend local compatible OpenAI réussit les sondes directes, mais les exécutions d’agent échouent

Utilisez ceci lorsque :

- `curl ... /v1/models` fonctionne
- les petits appels directs à `/v1/chat/completions` fonctionnent
- les exécutions de modèles OpenClaw échouent uniquement lors des tours d’agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

À rechercher :

- les petits appels directs réussissent, mais les exécutions OpenClaw échouent uniquement sur des prompts plus volumineux
- des erreurs du backend indiquant que `messages[].content` attend une chaîne
- des plantages du backend qui n’apparaissent qu’avec des nombres de tokens de prompt plus élevés ou avec les prompts complets du runtime d’agent

Signatures courantes :

- `messages[...].content: invalid type: sequence, expected a string` → le backend rejette les parties de contenu structurées de Chat Completions. Correctif : définissez `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- les petites requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent avec des plantages du backend/modèle (par exemple Gemma sur certaines versions de `inferrs`) → le transport OpenClaw est probablement déjà correct ; c’est le backend qui échoue sur la forme plus volumineuse des prompts du runtime d’agent.
- les échecs diminuent après la désactivation des outils, mais ne disparaissent pas → les schémas d’outils faisaient partie de la pression, mais le problème restant vient toujours en amont de la capacité du modèle/serveur ou d’un bogue du backend.

Options de correction :

1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions qui n’acceptent que des chaînes.
2. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer de manière fiable la surface de schéma d’outils d’OpenClaw.
3. Réduisez la pression sur les prompts lorsque c’est possible : initialisation d’espace de travail plus petite, historique de session plus court, modèle local plus léger ou backend avec une meilleure prise en charge du contexte long.
4. Si les petites requêtes directes continuent de réussir alors que les tours d’agent OpenClaw plantent toujours dans le backend, traitez cela comme une limitation du serveur/modèle en amont et signalez-y un cas de reproduction avec la forme de payload acceptée.

Voir aussi :

- [/gateway/local-models](/fr/gateway/local-models)
- [/gateway/configuration](/fr/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/fr/gateway/configuration-reference#openai-compatible-endpoints)

## Aucune réponse

Si les canaux sont actifs mais que rien ne répond, vérifiez le routage et la stratégie avant de reconnecter quoi que ce soit.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

À rechercher :

- Appairage en attente pour les expéditeurs de messages directs.
- Contrôle des mentions de groupe (`requireMention`, `mentionPatterns`).
- Incohérences de liste d’autorisation de canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à mention.
- `pairing request` → l’expéditeur a besoin d’une approbation.
- `blocked` / `allowlist` → l’expéditeur/canal a été filtré par la stratégie.

Voir aussi :

- [/channels/troubleshooting](/fr/channels/troubleshooting)
- [/channels/pairing](/fr/channels/pairing)
- [/channels/groups](/fr/channels/groups)

## Connectivité de l’interface Dashboard / Control UI

Lorsque le tableau de bord / la Control UI ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

À rechercher :

- URL de sonde et URL de tableau de bord correctes.
- Incohérence de mode d’authentification / jeton entre le client et Gateway.
- Utilisation de HTTP là où une identité d’appareil est requise.

Signatures courantes :

- `device identity required` → contexte non sécurisé ou authentification d’appareil manquante.
- `origin not allowed` → l’`Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins` (ou vous vous connectez depuis une origine de navigateur non loopback sans liste d’autorisation explicite).
- `device nonce required` / `device nonce mismatch` → le client ne termine pas le flux d’authentification d’appareil basé sur défi (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → le client a signé le mauvais payload (ou un horodatage périmé) pour la poignée de main en cours.
- `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut effectuer une nouvelle tentative approuvée avec le jeton d’appareil mis en cache.
- Cette nouvelle tentative avec jeton en cache réutilise l’ensemble de portées mis en cache stocké avec le jeton d’appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent à la place l’ensemble de portées demandé.
- En dehors de ce chemin de nouvelle tentative, la priorité d’authentification de connexion est d’abord le jeton/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
- Sur le chemin asynchrone de la Control UI via Tailscale Serve, les tentatives échouées pour le même `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives concurrentes provenant du même client peuvent donc faire apparaître `retry later` lors de la seconde tentative au lieu de deux simples incohérences.
- `too many failed authentication attempts (retry later)` depuis un client loopback d’origine navigateur → les échecs répétés depuis cette même `Origin` normalisée sont temporairement bloqués ; une autre origine localhost utilise un compartiment séparé.
- `unauthorized` répété après cette nouvelle tentative → dérive du jeton partagé/du jeton d’appareil ; actualisez la configuration du jeton et réapprouvez/faites tourner le jeton d’appareil si nécessaire.
- `gateway connect failed:` → mauvaise cible d’hôte/port/URL.

### Résumé rapide des codes de détail d’authentification

Utilisez `error.details.code` dans la réponse `connect` échouée pour choisir l’action suivante :

| Code de détail               | Signification                                                                                                                                                                                 | Action recommandée                                                                                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé un jeton partagé requis.                                                                                                                                             | Collez/définissez le jeton dans le client et réessayez. Pour les chemins du tableau de bord : `openclaw config get gateway.auth.token` puis collez-le dans les paramètres de la Control UI.                                                                                           |
| `AUTH_TOKEN_MISMATCH`        | Le jeton partagé ne correspond pas au jeton d’authentification de Gateway.                                                                                                                    | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative approuvée. Les nouvelles tentatives avec jeton en cache réutilisent les portées approuvées stockées ; les appelants avec `deviceToken` / `scopes` explicites conservent les portées demandées. Si l’échec persiste, exécutez la [check-list de récupération de dérive de jeton](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton par appareil en cache est périmé ou révoqué.                                                                                                                                         | Faites tourner/réapprouvez le jeton d’appareil à l’aide de la [CLI des appareils](/cli/devices), puis reconnectez-vous.                                                                                                                                                                |
| `PAIRING_REQUIRED`           | L’identité de l’appareil doit être approuvée. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsqu’ils sont présents. | Approuvez la demande en attente : `openclaw devices list` puis `openclaw devices approve <requestId>`. Les mises à niveau de portée/rôle utilisent le même flux après examen de l’accès demandé.                                                                                      |

Vérification de migration vers l’authentification d’appareil v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux affichent des erreurs de nonce/signature, mettez à jour le client qui se connecte et vérifiez qu’il :

1. attend `connect.challenge`
2. signe le payload lié au défi
3. envoie `connect.params.device.nonce` avec le même nonce du défi

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- les sessions avec jeton d’appareil appairé ne peuvent gérer que **leur propre** appareil, sauf si l’appelant possède aussi `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que des portées opérateur que la session appelante détient déjà

Voir aussi :

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/fr/gateway/configuration) (modes d’authentification de Gateway)
- [/gateway/trusted-proxy-auth](/fr/gateway/trusted-proxy-auth)
- [/gateway/remote](/fr/gateway/remote)
- [/cli/devices](/cli/devices)

## Le service Gateway ne s’exécute pas

Utilisez ceci lorsque le service est installé mais que le processus ne reste pas actif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

À rechercher :

- `Runtime: stopped` avec des indications de sortie.
- Incohérence de configuration du service (`Config (cli)` vs `Config (service)`).
- Conflits de port/écoute.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Indications de nettoyage `Other gateway-like services detected (best effort)`.

Signatures courantes :

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode Gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correctif : définissez `gateway.mode="local"` dans votre configuration, ou relancez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration attendue du mode local. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → liaison non loopback sans chemin d’authentification Gateway valide (jeton/mot de passe, ou trusted-proxy lorsque configuré).
- `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
- `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des installations devraient conserver une seule Gateway par machine ; si vous en avez vraiment besoin de plusieurs, isolez les ports + la configuration/l’état/l’espace de travail. Voir [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

Voir aussi :

- [/gateway/background-process](/fr/gateway/background-process)
- [/gateway/configuration](/fr/gateway/configuration)
- [/gateway/doctor](/fr/gateway/doctor)

## Avertissements de sonde Gateway

Utilisez ceci lorsque `openclaw gateway probe` atteint bien quelque chose, mais affiche quand même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

À rechercher :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne le repli SSH, plusieurs Gateways, des portées manquantes ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a quand même essayé les cibles directes configurées/loopback.
- `multiple reachable gateways detected` → plus d’une cible a répondu. En général, cela signifie une configuration multi-Gateway intentionnelle ou des écouteurs obsolètes/dupliqués.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a fonctionné, mais le RPC détaillé est limité par les portées ; appairez l’identité de l’appareil ou utilisez des identifiants avec `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → la Gateway a répondu, mais ce client a encore besoin d’un appairage/d’une approbation avant un accès opérateur normal.
- texte d’avertissement `gateway.auth.*` / `gateway.remote.*` SecretRef non résolu → le matériel d’authentification n’était pas disponible dans ce chemin de commande pour la cible en échec.

Voir aussi :

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/fr/gateway/remote)

## Canal connecté mais messages non transmis

Si l’état du canal est connecté mais que le flux de messages est interrompu, concentrez-vous sur la stratégie, les autorisations et les règles de livraison propres au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

À rechercher :

- Stratégie de message direct (`pairing`, `allowlist`, `open`, `disabled`).
- Liste d’autorisation des groupes et exigences de mention.
- Autorisations/portées API du canal manquantes.

Signatures courantes :

- `mention required` → message ignoré par la stratégie de mention de groupe.
- traces `pairing` / approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/autorisations du canal.

Voir aussi :

- [/channels/troubleshooting](/fr/channels/troubleshooting)
- [/channels/whatsapp](/fr/channels/whatsapp)
- [/channels/telegram](/fr/channels/telegram)
- [/channels/discord](/fr/channels/discord)

## Livraison Cron et Heartbeat

Si Cron ou Heartbeat ne s’est pas exécuté ou n’a pas été livré, vérifiez d’abord l’état du planificateur, puis la cible de livraison.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

À rechercher :

- Cron activé et prochain réveil présent.
- État de l’historique des exécutions de tâche (`ok`, `skipped`, `error`).
- Raisons d’omission de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Signatures courantes :

- `cron: scheduler disabled; jobs will not run automatically` → Cron est désactivé.
- `cron: timer tick failed` → l’impulsion du planificateur a échoué ; vérifiez les erreurs de fichier/journal/runtime.
- `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la plage d’heures actives.
- `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / en-têtes Markdown ; OpenClaw ignore donc l’appel du modèle.
- `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due à cette impulsion.
- `heartbeat: unknown accountId` → identifiant de compte invalide pour la cible de livraison de Heartbeat.
- `heartbeat skipped` avec `reason=dm-blocked` → la cible de Heartbeat a été résolue vers une destination de type message direct alors que `agents.defaults.heartbeat.directPolicy` (ou une surcharge par agent) est défini sur `block`.

Voir aussi :

- [/automation/cron-jobs#troubleshooting](/fr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/fr/automation/cron-jobs)
- [/gateway/heartbeat](/fr/gateway/heartbeat)

## Échec d’un outil Node appairé

Si un Node est appairé mais que les outils échouent, isolez l’état de premier plan, les autorisations et l’état d’approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

À rechercher :

- Node en ligne avec les capacités attendues.
- Autorisations du système d’exploitation pour la caméra/le micro/la localisation/l’écran.
- État des approbations d’exécution et de la liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application Node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorisation du système d’exploitation manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation d’exécution en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Voir aussi :

- [/nodes/troubleshooting](/fr/nodes/troubleshooting)
- [/nodes/index](/fr/nodes/index)
- [/tools/exec-approvals](/fr/tools/exec-approvals)

## Échec de l’outil navigateur

Utilisez ceci lorsque les actions de l’outil navigateur échouent même si la Gateway elle-même est saine.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

À rechercher :

- Si `plugins.allow` est défini et inclut `browser`.
- Un chemin d’exécutable de navigateur valide.
- L’accessibilité du profil CDP.
- La disponibilité de Chrome local pour les profils `existing-session` / `user`.

Signatures courantes :

- `unknown command "browser"` ou `unknown command 'browser'` → le Plugin navigateur fourni est exclu par `plugins.allow`.
- outil navigateur manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le Plugin ne s’est jamais chargé.
- `Failed to start Chrome CDP on port` → le processus du navigateur n’a pas pu démarrer.
- `browser.executablePath not found` → le chemin configuré est invalide.
- `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge tel que `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port incorrect ou hors plage.
- `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
- `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte Gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil attach-only n’a pas de cible accessible, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a toujours pas pu être ouvert.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle de Gateway n’inclut pas le paquet Playwright complet ; les instantanés ARIA et les captures d’écran de page de base peuvent toujours fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments via sélecteur CSS et l’export PDF restent indisponibles.
- `fullPage is not supported for element screenshots` → la requête de capture d’écran mélange `--full-page` avec `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser une capture de page ou un `--ref` d’instantané, et non un `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks de téléversement Chrome MCP nécessitent des références d’instantané, pas des sélecteurs CSS.
- `existing-session file uploads currently support one file at a time.` → envoyez un seul téléversement par appel sur les profils Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → les hooks de boîte de dialogue sur les profils Chrome MCP ne prennent pas en charge les surcharges de délai d’attente.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite encore un navigateur géré ou un profil CDP brut.
- remplacements persistants de viewport / mode sombre / langue / hors ligne sur les profils attach-only ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer toute la Gateway.

Voir aussi :

- [/tools/browser-linux-troubleshooting](/fr/tools/browser-linux-troubleshooting)
- [/tools/browser](/fr/tools/browser)

## Si vous avez effectué une mise à niveau et que quelque chose s’est soudainement cassé

La plupart des problèmes après mise à niveau proviennent d’une dérive de configuration ou de valeurs par défaut plus strictes désormais appliquées.

### 1) Le comportement d’authentification et de surcharge d’URL a changé

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Ce qu’il faut vérifier :

- Si `gateway.mode=remote`, les appels CLI peuvent cibler le distant alors que votre service local fonctionne bien.
- Les appels explicites avec `--url` ne reviennent pas aux identifiants stockés.

Signatures courantes :

- `gateway connect failed:` → mauvaise cible d’URL.
- `unauthorized` → point de terminaison accessible mais mauvaise authentification.

### 2) Les garde-fous de liaison et d’authentification sont plus stricts

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Ce qu’il faut vérifier :

- Les liaisons non loopback (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification Gateway valide : authentification par jeton/mot de passe partagé, ou déploiement `trusted-proxy` non loopback correctement configuré.
- Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

Signatures courantes :

- `refusing to bind gateway ... without auth` → liaison non loopback sans chemin d’authentification Gateway valide.
- `Connectivity probe: failed` alors que le runtime est en cours d’exécution → la Gateway est active mais inaccessible avec l’authentification/l’URL actuelles.

### 3) L’état d’appairage et d’identité de l’appareil a changé

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Ce qu’il faut vérifier :

- Approbations d’appareil en attente pour le tableau de bord/les Nodes.
- Approbations d’appairage DM en attente après des changements de stratégie ou d’identité.

Signatures courantes :

- `device identity required` → l’authentification de l’appareil n’est pas satisfaite.
- `pairing required` → l’expéditeur/l’appareil doit être approuvé.

Si la configuration du service et le runtime sont toujours en désaccord après ces vérifications, réinstallez les métadonnées du service depuis le même répertoire de profil/d’état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Voir aussi :

- [/gateway/pairing](/fr/gateway/pairing)
- [/gateway/authentication](/fr/gateway/authentication)
- [/gateway/background-process](/fr/gateway/background-process)
