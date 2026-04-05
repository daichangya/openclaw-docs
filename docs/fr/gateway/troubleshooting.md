---
read_when:
    - Le hub de dépannage vous a dirigé ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de runbook stables basées sur les symptômes avec des commandes exactes
summary: Runbook de dépannage approfondi pour la gateway, les canaux, l’automatisation, les nodes et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-04-05T12:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Dépannage Gateway

Cette page est le runbook approfondi.
Commencez par [/help/troubleshooting](/help/troubleshooting) si vous souhaitez d’abord le flux de triage rapide.

## Échelle de commandes

Exécutez celles-ci en premier, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux attendus en bonne santé :

- `openclaw gateway status` affiche `Runtime: running` et `RPC probe: ok`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration/service.
- `openclaw channels status --probe` affiche l’état de transport en direct par compte et,
  lorsque c’est pris en charge, des résultats de probe/audit tels que `works` ou `audit ok`.

## Anthropic 429 extra usage requis pour un long contexte

Utilisez cette section lorsque les journaux/erreurs incluent :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

À rechercher :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- L’identifiant Anthropic actuel n’est pas éligible à l’utilisation de long contexte.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui ont besoin du chemin bêta 1M.

Options de correction :

1. Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
2. Utilisez une clé API Anthropic avec facturation, ou activez Anthropic Extra Usage sur le compte Anthropic OAuth/abonnement.
3. Configurez des modèles de repli afin que les exécutions continuent lorsque les requêtes Anthropic à long contexte sont rejetées.

Liens associés :

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Pas de réponse

Si les canaux sont actifs mais que rien ne répond, vérifiez le routage et la politique avant de reconnecter quoi que ce soit.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

À rechercher :

- Appairage en attente pour les expéditeurs DM.
- Filtrage des mentions de groupe (`requireMention`, `mentionPatterns`).
- Incohérences de liste d’autorisation de canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à mention.
- `pairing request` → l’expéditeur a besoin d’une approbation.
- `blocked` / `allowlist` → l’expéditeur/le canal a été filtré par la politique.

Liens associés :

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Connectivité de l’UI de contrôle Dashboard

Lorsque dashboard/control UI ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

À rechercher :

- URL de probe et URL dashboard correctes.
- Incohérence de mode d’authentification/jeton entre le client et la gateway.
- Utilisation HTTP là où une identité d’appareil est requise.

Signatures courantes :

- `device identity required` → contexte non sécurisé ou authentification d’appareil manquante.
- `origin not allowed` → le `Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins`
  (ou vous vous connectez depuis une origine de navigateur non loopback sans
  liste d’autorisation explicite).
- `device nonce required` / `device nonce mismatch` → le client n’achève pas le
  flux d’authentification d’appareil basé sur challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → le client a signé la mauvaise
  charge utile (ou un horodatage obsolète) pour la poignée de main en cours.
- `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut faire une tentative de reprise de confiance avec le jeton d’appareil en cache.
- Cette tentative avec jeton en cache réutilise l’ensemble de portées stocké avec le jeton d’appareil appairé.
  Les appelants avec `deviceToken` explicite / `scopes` explicites conservent leur ensemble de portées demandé.
- En dehors de ce chemin de reprise, la priorité d’authentification à la connexion est :
  jeton/mot de passe partagé explicite d’abord, puis `deviceToken` explicite, puis jeton d’appareil stocké,
  puis bootstrap token.
- Sur le chemin asynchrone Tailscale Serve Control UI, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives
  concurrentes du même client peuvent donc afficher `retry later`
  à la deuxième tentative au lieu de deux simples incohérences.
- `too many failed authentication attempts (retry later)` depuis un client loopback d’origine navigateur
  → les échecs répétés depuis ce même `Origin` normalisé sont temporairement bloqués ;
  une autre origine localhost utilise un bucket distinct.
- `unauthorized` répété après cette reprise → dérive du jeton partagé/jeton d’appareil ; actualisez la configuration du jeton et réapprouvez/rotez le jeton d’appareil si nécessaire.
- `gateway connect failed:` → mauvaise cible hôte/port/url.

### Correspondance rapide des codes de détail d’authentification

Utilisez `error.details.code` de la réponse `connect` échouée pour choisir l’action suivante :

| Code de détail               | Signification                                           | Action recommandée                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé le jeton partagé requis.      | Collez/définissez le jeton dans le client puis réessayez. Pour les chemins dashboard : `openclaw config get gateway.auth.token` puis collez-le dans les réglages de Control UI.                                                                                                     |
| `AUTH_TOKEN_MISMATCH`        | Le jeton partagé ne correspond pas au jeton d’authentification gateway. | Si `canRetryWithDeviceToken=true`, autorisez une tentative de reprise de confiance. Les tentatives avec jeton en cache réutilisent les portées approuvées stockées ; les appelants avec `deviceToken` / `scopes` explicites conservent les portées demandées. Si cela échoue encore, exécutez la [liste de contrôle de récupération de dérive de jeton](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton par appareil en cache est obsolète ou révoqué. | Faites pivoter/réapprouvez le jeton d’appareil avec la [CLI devices](/cli/devices), puis reconnectez-vous.                                                                                                                                                                           |
| `PAIRING_REQUIRED`           | L’identité de l’appareil est connue mais non approuvée pour ce rôle. | Approuvez la demande en attente : `openclaw devices list` puis `openclaw devices approve <requestId>`.                                                                                                                                                                               |

Vérification de migration device auth v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux affichent des erreurs de nonce/signature, mettez à jour le client qui se connecte et vérifiez qu’il :

1. attend `connect.challenge`
2. signe la charge utile liée au challenge
3. envoie `connect.params.device.nonce` avec le même nonce de challenge

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- les sessions avec jeton d’appareil appairé ne peuvent gérer **que leur propre**
  appareil sauf si l’appelant dispose aussi de `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que des portées opérateur
  que la session appelante possède déjà

Liens associés :

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration) (modes d’authentification gateway)
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Service Gateway non démarré

Utilisez cette section lorsque le service est installé mais que le processus ne reste pas actif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analyse aussi les services au niveau système
```

À rechercher :

- `Runtime: stopped` avec des indications de sortie.
- Incohérence de configuration du service (`Config (cli)` vs `Config (service)`).
- Conflits de port/écouteur.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Indications de nettoyage `Other gateway-like services detected (best effort)`.

Signatures courantes :

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correction : définissez `gateway.mode="local"` dans votre configuration, ou relancez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration locale attendue. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → liaison hors loopback sans chemin d’authentification gateway valide (jeton/mot de passe, ou trusted-proxy si configuré).
- `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
- `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations devraient conserver une seule gateway par machine ; si vous en avez vraiment besoin de plusieurs, isolez ports + configuration/état/espace de travail. Voir [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

Liens associés :

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Avertissements de probe Gateway

Utilisez cette section lorsque `openclaw gateway probe` atteint quelque chose, mais affiche quand même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

À rechercher :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne le repli SSH, plusieurs gateways, des portées manquantes ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a quand même essayé des cibles directes configurées/loopback.
- `multiple reachable gateways detected` → plus d’une cible a répondu. En général, cela signifie une configuration multi-gateway intentionnelle ou des écouteurs obsolètes/dupliqués.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a réussi, mais le détail RPC est limité par la portée ; appairez une identité d’appareil ou utilisez des identifiants avec `operator.read`.
- texte d’avertissement SecretRef non résolu `gateway.auth.*` / `gateway.remote.*` → le matériel d’authentification n’était pas disponible dans ce chemin de commande pour la cible en échec.

Liens associés :

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

## Canal connecté mais messages qui ne circulent pas

Si l’état du canal est connecté mais que le flux de messages est mort, concentrez-vous sur la politique, les autorisations et les règles de livraison spécifiques au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

À rechercher :

- Politique DM (`pairing`, `allowlist`, `open`, `disabled`).
- Liste d’autorisation de groupe et exigences de mention.
- Portées/autorisations API du canal manquantes.

Signatures courantes :

- `mention required` → message ignoré par la politique de mention de groupe.
- traces `pairing` / approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/autorisations du canal.

Liens associés :

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Livraison cron et heartbeat

Si cron ou heartbeat ne s’est pas exécuté ou n’a pas livré, vérifiez d’abord l’état du planificateur, puis la cible de livraison.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

À rechercher :

- Cron activé et prochain réveil présent.
- État de l’historique d’exécution des tâches (`ok`, `skipped`, `error`).
- Raisons de saut de heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Signatures courantes :

- `cron: scheduler disabled; jobs will not run automatically` → cron désactivé.
- `cron: timer tick failed` → l’impulsion du planificateur a échoué ; vérifiez les erreurs de fichier/journal/runtime.
- `heartbeat skipped` avec `reason=quiet-hours` → hors de la fenêtre d’heures actives.
- `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / en-têtes markdown, donc OpenClaw ignore l’appel au modèle.
- `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due à cette impulsion.
- `heartbeat: unknown accountId` → ID de compte invalide pour la cible de livraison du heartbeat.
- `heartbeat skipped` avec `reason=dm-blocked` → la cible du heartbeat a été résolue vers une destination de type DM alors que `agents.defaults.heartbeat.directPolicy` (ou le remplacement par agent) est défini sur `block`.

Liens associés :

- [/automation/cron-jobs#troubleshooting](/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Échec d’un outil de node appairé

Si un node est appairé mais que les outils échouent, isolez l’état de premier plan, d’autorisation et d’approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

À rechercher :

- Node en ligne avec les capacités attendues.
- Autorisations OS pour caméra/micro/localisation/écran.
- Approbations d’exécution et état de liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application du node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorisation OS manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation d’exécution en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Liens associés :

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Échec de l’outil navigateur

Utilisez cette section lorsque les actions de l’outil navigateur échouent alors même que la gateway elle-même est en bonne santé.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

À rechercher :

- Si `plugins.allow` est défini et inclut `browser`.
- Chemin exécutable du navigateur valide.
- Accessibilité du profil CDP.
- Disponibilité de Chrome local pour les profils `existing-session` / `user`.

Signatures courantes :

- `unknown command "browser"` ou `unknown command 'browser'` → le plugin navigateur intégré est exclu par `plugins.allow`.
- outil navigateur manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le plugin ne s’est jamais chargé.
- `Failed to start Chrome CDP on port` → le processus du navigateur n’a pas réussi à se lancer.
- `browser.executablePath not found` → le chemin configuré est invalide.
- `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge tel que `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port invalide ou hors plage.
- `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
- `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas joignable depuis l’hôte gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil attach-only n’a pas de cible joignable, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a quand même pas pu être ouvert.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle de la gateway ne contient pas le package Playwright complet ; les instantanés ARIA et captures d’écran simples de page peuvent encore fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments par sélecteur CSS et l’export PDF restent indisponibles.
- `fullPage is not supported for element screenshots` → la requête de capture d’écran mélangeait `--full-page` avec `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser une capture de page ou un `--ref` d’instantané, pas un `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks de téléversement Chrome MCP nécessitent des références d’instantané, pas des sélecteurs CSS.
- `existing-session file uploads currently support one file at a time.` → envoyez un seul téléversement par appel sur les profils Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → les hooks de dialogue sur les profils Chrome MCP ne prennent pas en charge les remplacements de délai.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite encore un navigateur géré ou un profil CDP brut.
- remplacements obsolètes de viewport / dark-mode / locale / offline sur des profils attach-only ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer toute la gateway.

Liens associés :

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Si vous avez mis à niveau et que quelque chose s’est soudainement cassé

La plupart des cassures après mise à niveau sont dues à une dérive de configuration ou à des valeurs par défaut plus strictes désormais appliquées.

### 1) Le comportement d’authentification et de remplacement d’URL a changé

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

À vérifier :

- Si `gateway.mode=remote`, les appels CLI peuvent cibler le distant alors que votre service local fonctionne bien.
- Les appels `--url` explicites ne reviennent pas aux identifiants stockés.

Signatures courantes :

- `gateway connect failed:` → mauvaise cible d’URL.
- `unauthorized` → point de terminaison joignable mais mauvaise authentification.

### 2) Les garde-fous de liaison et d’authentification sont plus stricts

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

À vérifier :

- Les liaisons hors loopback (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification gateway valide : authentification par jeton/mot de passe partagé, ou déploiement `trusted-proxy` hors loopback correctement configuré.
- Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

Signatures courantes :

- `refusing to bind gateway ... without auth` → liaison hors loopback sans chemin d’authentification gateway valide.
- `RPC probe: failed` alors que le runtime fonctionne → gateway active mais inaccessible avec l’authentification/l’URL actuelle.

### 3) L’état d’appairage et d’identité d’appareil a changé

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

À vérifier :

- Approbations d’appareil en attente pour dashboard/nodes.
- Approbations d’appairage DM en attente après modifications de politique ou d’identité.

Signatures courantes :

- `device identity required` → l’authentification d’appareil n’est pas satisfaite.
- `pairing required` → l’expéditeur/l’appareil doit être approuvé.

Si la configuration de service et le runtime ne concordent toujours pas après vérifications, réinstallez les métadonnées du service à partir du même répertoire profil/état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Liens associés :

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
