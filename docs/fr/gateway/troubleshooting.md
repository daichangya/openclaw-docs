---
read_when:
    - Le hub de dépannage vous a orienté ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de runbook stables basées sur les symptômes avec des commandes exactes
summary: Runbook de dépannage approfondi pour le gateway, les canaux, l’automatisation, les Node et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-04-24T07:13:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c4cbbbe8b1cd5eaca34503f4a363d3fa2650e491f83455958eb5725f9d50c5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Dépannage Gateway

Cette page est le runbook approfondi.
Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous souhaitez d’abord le flux de tri rapide.

## Échelle de commandes

Exécutez d’abord celles-ci, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux attendus en bonne santé :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok`, et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration/service.
- `openclaw channels status --probe` affiche l’état de transport en direct par compte et,
  lorsque pris en charge, des résultats de sonde/audit tels que `works` ou `audit ok`.

## Anthropic 429 usage supplémentaire requis pour un contexte long

Utilisez cette section lorsque les journaux/erreurs incluent :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Recherchez :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- L’identifiant Anthropic actuel n’est pas éligible à l’utilisation en contexte long.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui nécessitent le chemin bêta 1M.

Options de correction :

1. Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
2. Utilisez un identifiant Anthropic éligible aux requêtes en contexte long, ou passez à une clé API Anthropic.
3. Configurez des modèles de repli afin que les exécutions se poursuivent lorsque les requêtes Anthropic en contexte long sont rejetées.

Lié :

- [/providers/anthropic](/fr/providers/anthropic)
- [/reference/token-use](/fr/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/fr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Le backend local compatible OpenAI réussit les sondes directes mais les exécutions d’agent échouent

Utilisez cette section lorsque :

- `curl ... /v1/models` fonctionne
- les petits appels directs `/v1/chat/completions` fonctionnent
- les exécutions de modèle OpenClaw échouent uniquement sur des tours d’agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Recherchez :

- les petits appels directs réussissent, mais les exécutions OpenClaw échouent uniquement sur les prompts plus volumineux
- des erreurs backend concernant `messages[].content` qui attend une chaîne
- des plantages backend qui apparaissent uniquement avec des nombres plus élevés de jetons de prompt ou des prompts complets du runtime d’agent

Signatures courantes :

- `messages[...].content: invalid type: sequence, expected a string` → le backend
  rejette les parties de contenu structurées de Chat Completions. Correction : définissez
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- les petites requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent avec des plantages backend/modèle
  (par exemple Gemma sur certaines builds `inferrs`) → le transport OpenClaw est
  probablement déjà correct ; c’est le backend qui échoue sur la forme plus volumineuse du prompt
  du runtime d’agent.
- les échecs diminuent après désactivation des outils mais ne disparaissent pas → les schémas d’outils
  participaient à la pression, mais le problème restant est toujours une limitation de capacité du modèle/serveur en amont ou un bogue du backend.

Options de correction :

1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions qui n’acceptent que des chaînes.
2. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer
   de manière fiable la surface de schéma d’outils d’OpenClaw.
3. Réduisez autant que possible la pression du prompt : bootstrap d’espace de travail plus petit, historique
   de session plus court, modèle local plus léger ou backend avec meilleure prise en charge du contexte long.
4. Si les petites requêtes directes continuent de réussir alors que les tours d’agent OpenClaw plantent toujours
   dans le backend, traitez cela comme une limitation du serveur/modèle en amont et déposez
   une reproduction là-bas avec la forme de charge utile acceptée.

Lié :

- [/gateway/local-models](/fr/gateway/local-models)
- [/gateway/configuration](/fr/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/fr/gateway/configuration-reference#openai-compatible-endpoints)

## Aucune réponse

Si les canaux sont actifs mais que rien ne répond, vérifiez le routage et la politique avant de reconnecter quoi que ce soit.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Recherchez :

- Appairage en attente pour les expéditeurs de messages privés.
- Contrôle des mentions de groupe (`requireMention`, `mentionPatterns`).
- Incohérences de liste d’autorisation canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à mention.
- `pairing request` → l’expéditeur doit être approuvé.
- `blocked` / `allowlist` → l’expéditeur/le canal a été filtré par la politique.

Lié :

- [/channels/troubleshooting](/fr/channels/troubleshooting)
- [/channels/pairing](/fr/channels/pairing)
- [/channels/groups](/fr/channels/groups)

## Connectivité de l’interface de contrôle du tableau de bord

Lorsque le tableau de bord/l’interface de contrôle ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Recherchez :

- URL de sonde et URL du tableau de bord correctes.
- Incompatibilité de mode d’authentification/jeton entre le client et le gateway.
- Utilisation HTTP là où une identité d’appareil est requise.

Signatures courantes :

- `device identity required` → contexte non sécurisé ou authentification d’appareil manquante.
- `origin not allowed` → `Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins`
  (ou vous vous connectez depuis une origine navigateur non-loopback sans liste d’autorisation
  explicite).
- `device nonce required` / `device nonce mismatch` → le client n’achève pas le
  flux d’authentification d’appareil basé sur challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → le client a signé la mauvaise
  charge utile (ou un horodatage périmé) pour la poignée de main actuelle.
- `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut effectuer une nouvelle tentative de confiance avec un jeton d’appareil mis en cache.
- Cette nouvelle tentative avec jeton mis en cache réutilise l’ensemble de scopes mis en cache stocké avec le jeton d’appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent à la place l’ensemble de scopes demandé.
- En dehors de ce chemin de nouvelle tentative, la priorité d’authentification de connexion est d’abord
  jeton/mot de passe partagé explicite, puis `deviceToken` explicite, puis jeton d’appareil stocké,
  puis jeton bootstrap.
- Sur le chemin asynchrone Tailscale Serve Control UI, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives concurrentes du même client peuvent donc produire `retry later`
  sur la seconde tentative au lieu de deux incompatibilités simples.
- `too many failed authentication attempts (retry later)` depuis un client loopback d’origine navigateur
  → les échecs répétés depuis cette même `Origin` normalisée sont temporairement
  bloqués ; une autre origine localhost utilise un compartiment distinct.
- `unauthorized` répété après cette nouvelle tentative → dérive du jeton partagé/jeton d’appareil ; actualisez la configuration du jeton et réapprouvez/faites tourner le jeton d’appareil si nécessaire.
- `gateway connect failed:` → mauvaise cible hôte/port/url.

### Correspondance rapide des codes de détail d’authentification

Utilisez `error.details.code` de la réponse `connect` en échec pour choisir l’action suivante :

| Detail code                  | Signification                                                                                                                                                                                      | Action recommandée                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé un jeton partagé requis.                                                                                                                                                 | Collez/définissez le jeton dans le client et réessayez. Pour les chemins du tableau de bord : `openclaw config get gateway.auth.token` puis collez-le dans les réglages de l’interface de contrôle.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Le jeton partagé ne correspond pas au jeton d’authentification du gateway.                                                                                                                                               | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative de confiance. Les nouvelles tentatives avec jeton mis en cache réutilisent les scopes approuvés stockés ; les appelants avec `deviceToken` / `scopes` explicites conservent les scopes demandés. Si cela échoue encore, exécutez la [liste de contrôle de récupération de dérive de jeton](/fr/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton par appareil mis en cache est obsolète ou révoqué.                                                                                                                                                 | Faites tourner/réapprouvez le jeton d’appareil à l’aide de la [CLI devices](/fr/cli/devices), puis reconnectez-vous.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | L’identité d’appareil nécessite une approbation. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade`, ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsqu’ils sont présents. | Approuvez la demande en attente : `openclaw devices list` puis `openclaw devices approve <requestId>`. Les montées de niveau de scope/rôle utilisent le même flux après examen de l’accès demandé.                                                                                                               |

Vérification de migration de l’authentification d’appareil v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux montrent des erreurs de nonce/signature, mettez à jour le client qui se connecte et vérifiez qu’il :

1. attend `connect.challenge`
2. signe la charge utile liée au challenge
3. envoie `connect.params.device.nonce` avec le même nonce de challenge

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- les sessions avec jeton d’appareil appairé ne peuvent gérer que **leur propre** appareil, sauf si l’appelant possède aussi `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que des scopes operator
  que la session appelante détient déjà

Lié :

- [/web/control-ui](/fr/web/control-ui)
- [/gateway/configuration](/fr/gateway/configuration) (modes d’authentification du gateway)
- [/gateway/trusted-proxy-auth](/fr/gateway/trusted-proxy-auth)
- [/gateway/remote](/fr/gateway/remote)
- [/cli/devices](/fr/cli/devices)

## Service Gateway non exécuté

Utilisez cette section lorsque le service est installé mais que le processus ne reste pas actif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analyse aussi les services au niveau système
```

Recherchez :

- `Runtime: stopped` avec des indications de sortie.
- Incompatibilité de configuration du service (`Config (cli)` vs `Config (service)`).
- Conflits de port/écouteur.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Indications de nettoyage `Other gateway-like services detected (best effort)`.

Signatures courantes :

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correction : définissez `gateway.mode="local"` dans votre configuration, ou relancez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration attendue du mode local. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification gateway valide (jeton/mot de passe, ou trusted-proxy là où il est configuré).
- `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
- `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations devraient conserver un seul gateway par machine ; si vous avez réellement besoin de plus d’un, isolez ports + configuration/état/espace de travail. Voir [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

Lié :

- [/gateway/background-process](/fr/gateway/background-process)
- [/gateway/configuration](/fr/gateway/configuration)
- [/gateway/doctor](/fr/gateway/doctor)

## Le Gateway a restauré la dernière configuration valide connue

Utilisez cette section lorsque le Gateway démarre, mais que les journaux indiquent qu’il a restauré `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Recherchez :

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un fichier horodaté `openclaw.json.clobbered.*` à côté de la configuration active
- Un événement système de l’agent principal qui commence par `Config recovery warning`

Ce qui s’est passé :

- La configuration rejetée n’a pas passé la validation au démarrage ou lors d’un rechargement à chaud.
- OpenClaw a conservé la charge utile rejetée sous `.clobbered.*`.
- La configuration active a été restaurée à partir de la dernière copie valide connue.
- Le prochain tour de l’agent principal reçoit un avertissement lui indiquant de ne pas réécrire aveuglément la configuration rejetée.

Inspecter et réparer :

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Signatures courantes :

- `.clobbered.*` existe → une modification directe externe ou une lecture au démarrage a été restaurée.
- `.rejected.*` existe → une écriture de configuration gérée par OpenClaw a échoué aux vérifications de schéma ou d’écrasement avant validation.
- `Config write rejected:` → l’écriture a tenté de supprimer une forme requise, de réduire brutalement la taille du fichier, ou de persister une configuration invalide.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, ou `size-drop-vs-last-good:*` → le démarrage a traité le fichier actuel comme écrasé parce qu’il avait perdu des champs ou de la taille par rapport à la dernière sauvegarde valide connue.
- `Config last-known-good promotion skipped` → le candidat contenait des espaces réservés de secrets expurgés tels que `***`.

Options de correction :

1. Conservez la configuration active restaurée si elle est correcte.
2. Copiez uniquement les clés souhaitées depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
3. Exécutez `openclaw config validate` avant de redémarrer.
4. Si vous modifiez à la main, conservez la configuration JSON5 complète, et non seulement l’objet partiel que vous vouliez changer.

Lié :

- [/gateway/configuration#strict-validation](/fr/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/fr/gateway/configuration#config-hot-reload)
- [/cli/config](/fr/cli/config)
- [/gateway/doctor](/fr/gateway/doctor)

## Avertissements de gateway probe

Utilisez cette section lorsque `openclaw gateway probe` atteint bien quelque chose, mais affiche tout de même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Recherchez :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne le repli SSH, plusieurs gateways, des scopes manquants, ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la mise en place du tunnel SSH a échoué, mais la commande a quand même essayé les cibles directes configurées/loopback.
- `multiple reachable gateways detected` → plus d’une cible a répondu. En général, cela signifie une configuration multi-gateway intentionnelle ou des écouteurs obsolètes/dupliqués.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a fonctionné, mais le RPC détaillé est limité par les scopes ; appairez l’identité de l’appareil ou utilisez des identifiants disposant de `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → le gateway a répondu, mais ce client nécessite encore un appairage/une approbation avant un accès opérateur normal.
- texte d’avertissement de SecretRef non résolu pour `gateway.auth.*` / `gateway.remote.*` → le matériel d’authentification n’était pas disponible dans ce chemin de commande pour la cible en échec.

Lié :

- [/cli/gateway](/fr/cli/gateway)
- [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/fr/gateway/remote)

## Canal connecté mais messages non transmis

Si l’état du canal est connecté mais que le flux de messages est mort, concentrez-vous sur la politique, les permissions et les règles de livraison spécifiques au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Recherchez :

- Politique de message privé (`pairing`, `allowlist`, `open`, `disabled`).
- Liste d’autorisation de groupe et exigences de mention.
- Permissions/scopes API du canal manquants.

Signatures courantes :

- `mention required` → message ignoré par la politique de mention de groupe.
- traces `pairing` / approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/permissions du canal.

Lié :

- [/channels/troubleshooting](/fr/channels/troubleshooting)
- [/channels/whatsapp](/fr/channels/whatsapp)
- [/channels/telegram](/fr/channels/telegram)
- [/channels/discord](/fr/channels/discord)

## Livraison Cron et Heartbeat

Si Cron ou Heartbeat ne s’est pas exécuté ou n’a pas livré, vérifiez d’abord l’état du planificateur, puis la cible de livraison.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Recherchez :

- Cron activé et prochain réveil présent.
- État de l’historique d’exécution des tâches (`ok`, `skipped`, `error`).
- Raisons d’ignorance du Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Signatures courantes :

- `cron: scheduler disabled; jobs will not run automatically` → Cron désactivé.
- `cron: timer tick failed` → échec du tick du planificateur ; vérifiez les erreurs de fichier/journal/runtime.
- `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la fenêtre d’heures actives.
- `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / en-têtes markdown, donc OpenClaw ignore l’appel au modèle.
- `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune des tâches n’est due à ce tick.
- `heartbeat: unknown accountId` → identifiant de compte invalide pour la cible de livraison Heartbeat.
- `heartbeat skipped` avec `reason=dm-blocked` → la cible Heartbeat s’est résolue en destination de type message privé alors que `agents.defaults.heartbeat.directPolicy` (ou le remplacement par agent) est défini sur `block`.

Lié :

- [/automation/cron-jobs#troubleshooting](/fr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/fr/automation/cron-jobs)
- [/gateway/heartbeat](/fr/gateway/heartbeat)

## Échec d’un outil sur un Node appairé

Si un Node est appairé mais que les outils échouent, isolez l’état de premier plan, de permission et d’approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Recherchez :

- Node en ligne avec les capacités attendues.
- Permissions système accordées pour caméra/micro/localisation/écran.
- Approbations d’exécution et état de la liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’app Node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permission système manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation d’exécution en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Lié :

- [/nodes/troubleshooting](/fr/nodes/troubleshooting)
- [/nodes/index](/fr/nodes/index)
- [/tools/exec-approvals](/fr/tools/exec-approvals)

## Échec de l’outil navigateur

Utilisez cette section lorsque les actions de l’outil navigateur échouent alors que le gateway lui-même est sain.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Recherchez :

- Si `plugins.allow` est défini et inclut `browser`.
- Un chemin d’exécutable navigateur valide.
- L’accessibilité du profil CDP.
- La disponibilité de Chrome local pour les profils `existing-session` / `user`.

Signatures courantes :

- `unknown command "browser"` ou `unknown command 'browser'` → le plugin navigateur inclus est exclu par `plugins.allow`.
- outil navigateur manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le plugin n’a jamais été chargé.
- `Failed to start Chrome CDP on port` → le processus navigateur n’a pas réussi à se lancer.
- `browser.executablePath not found` → le chemin configuré est invalide.
- `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge comme `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port mauvais ou hors plage.
- `Could not find DevToolsActivePort for chrome` → la session existante Chrome MCP n’a pas encore pu s’attacher au répertoire de données navigateur sélectionné. Ouvrez la page d’inspection du navigateur, activez le débogage à distance, gardez le navigateur ouvert, approuvez la première demande d’attachement, puis réessayez. Si l’état connecté n’est pas requis, préférez le profil géré `openclaw`.
- `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
- `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil attach-only n’a aucune cible accessible, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a toujours pas pu être ouvert.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle du gateway ne dispose pas de la dépendance d’exécution `playwright-core` du plugin navigateur inclus ; exécutez `openclaw doctor --fix`, puis redémarrez le gateway. Les instantanés ARIA et les captures d’écran de page de base peuvent encore fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments par sélecteur CSS et l’export PDF restent indisponibles.
- `fullPage is not supported for element screenshots` → la demande de capture d’écran mélange `--full-page` avec `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser une capture de page ou un `--ref` issu d’un instantané, pas un `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks d’envoi de fichiers Chrome MCP nécessitent des refs d’instantané, pas des sélecteurs CSS.
- `existing-session file uploads currently support one file at a time.` → envoyez un seul téléversement par appel sur les profils Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → les hooks de dialogue sur les profils Chrome MCP ne prennent pas en charge les remplacements de délai.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite encore un navigateur géré ou un profil CDP brut.
- remplacements obsolètes de viewport / mode sombre / locale / hors ligne sur des profils attach-only ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer tout le gateway.

Lié :

- [/tools/browser-linux-troubleshooting](/fr/tools/browser-linux-troubleshooting)
- [/tools/browser](/fr/tools/browser)

## Si vous avez mis à niveau et que quelque chose s’est soudainement cassé

La plupart des régressions après mise à niveau sont dues à une dérive de configuration ou à des valeurs par défaut plus strictes désormais appliquées.

### 1) Le comportement d’authentification et de remplacement d’URL a changé

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Points à vérifier :

- Si `gateway.mode=remote`, les appels CLI peuvent viser un service distant alors que votre service local fonctionne très bien.
- Les appels explicites avec `--url` ne retombent pas sur les identifiants stockés.

Signatures courantes :

- `gateway connect failed:` → mauvaise URL cible.
- `unauthorized` → point de terminaison accessible mais mauvaise authentification.

### 2) Les garde-fous de liaison et d’authentification sont plus stricts

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Points à vérifier :

- Les liaisons non loopback (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification gateway valide : authentification par jeton/mot de passe partagé, ou déploiement `trusted-proxy` non-loopback correctement configuré.
- Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

Signatures courantes :

- `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification gateway valide.
- `Connectivity probe: failed` alors que le runtime est actif → le gateway est vivant mais inaccessible avec l’authentification/l’URL actuelles.

### 3) L’état d’appairage et d’identité d’appareil a changé

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Points à vérifier :

- Approbations d’appareil en attente pour le tableau de bord/les Node.
- Approbations d’appairage de message privé en attente après des changements de politique ou d’identité.

Signatures courantes :

- `device identity required` → l’authentification de l’appareil n’est pas satisfaite.
- `pairing required` → l’expéditeur/l’appareil doit être approuvé.

Si la configuration du service et le runtime sont toujours en désaccord après ces vérifications, réinstallez les métadonnées du service à partir du même répertoire profil/état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Lié :

- [/gateway/pairing](/fr/gateway/pairing)
- [/gateway/authentication](/fr/gateway/authentication)
- [/gateway/background-process](/fr/gateway/background-process)

## Lié

- [Runbook Gateway](/fr/gateway)
- [Doctor](/fr/gateway/doctor)
- [FAQ](/fr/help/faq)
