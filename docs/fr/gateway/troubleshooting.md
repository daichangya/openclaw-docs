---
read_when:
    - Le hub de dépannage vous a dirigé ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de guide de dépannage stables, basées sur les symptômes, avec des commandes exactes
summary: Guide de dépannage approfondi pour Gateway, les canaux, l’automatisation, les nœuds et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-04-21T07:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2afb105376bb467e5a344e6d73726908cb718fa13116b751fddb494a0b641c42
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Dépannage de Gateway

Cette page est le guide de dépannage approfondi.
Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous voulez d’abord le flux de triage rapide.

## Échelle de commandes

Exécutez d’abord celles-ci, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux attendus en bon état :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration/service.
- `openclaw channels status --probe` affiche l’état en direct du transport par compte et,
  lorsque pris en charge, les résultats de sonde/audit comme `works` ou `audit ok`.

## Anthropic 429 utilisation supplémentaire requise pour le contexte long

Utilisez ceci lorsque les journaux/erreurs incluent :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Recherchez :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- L’identifiant Anthropic actuel n’est pas éligible à l’utilisation du contexte long.
- Les requêtes échouent uniquement sur les sessions longues/exécutions de modèle qui nécessitent le chemin bêta 1M.

Options de correction :

1. Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
2. Utilisez un identifiant Anthropic éligible aux requêtes de contexte long, ou passez à une clé API Anthropic.
3. Configurez des modèles de secours afin que les exécutions continuent lorsque les requêtes Anthropic de contexte long sont rejetées.

Associé :

- [/providers/anthropic](/fr/providers/anthropic)
- [/reference/token-use](/fr/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/fr/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Le backend local compatible OpenAI passe les sondes directes mais les exécutions d’agent échouent

Utilisez ceci lorsque :

- `curl ... /v1/models` fonctionne
- les petits appels directs à `/v1/chat/completions` fonctionnent
- les exécutions de modèle OpenClaw échouent uniquement sur des tours d’agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Recherchez :

- les petits appels directs réussissent, mais les exécutions OpenClaw échouent uniquement sur des prompts plus volumineux
- des erreurs du backend indiquant que `messages[].content` attend une chaîne
- des plantages du backend qui apparaissent uniquement avec des nombres de tokens de prompt plus élevés ou des prompts complets du runtime de l’agent

Signatures courantes :

- `messages[...].content: invalid type: sequence, expected a string` → le backend
  rejette les parties structurées de contenu Chat Completions. Correction : définissez
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- les petites requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent avec des plantages du backend/modèle
  (par exemple Gemma sur certaines versions de `inferrs`) → le transport OpenClaw est
  probablement déjà correct ; le backend échoue sur la forme plus volumineuse du
  prompt du runtime d’agent.
- les échecs diminuent après avoir désactivé les outils mais ne disparaissent pas → les schémas d’outils faisaient
  partie de la pression, mais le problème restant vient toujours d’une limite en amont du modèle/serveur
  ou d’un bug du backend.

Options de correction :

1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions acceptant uniquement des chaînes.
2. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer
   de manière fiable la surface de schéma d’outils d’OpenClaw.
3. Réduisez la pression du prompt quand c’est possible : bootstrap d’espace de travail plus léger, historique
   de session plus court, modèle local plus léger ou backend avec meilleure prise en charge
   du contexte long.
4. Si les petites requêtes directes continuent de réussir alors que les tours d’agent OpenClaw plantent encore
   dans le backend, traitez cela comme une limite du serveur/modèle en amont et ouvrez
   là-bas un repro avec la forme de charge utile acceptée.

Associé :

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

Recherchez :

- Association en attente pour les expéditeurs de DM.
- Limitation par mention de groupe (`requireMention`, `mentionPatterns`).
- Incohérences entre les listes d’autorisation du canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à mention.
- `pairing request` → l’expéditeur doit être approuvé.
- `blocked` / `allowlist` → l’expéditeur/canal a été filtré par la politique.

Associé :

- [/channels/troubleshooting](/fr/channels/troubleshooting)
- [/channels/pairing](/fr/channels/pairing)
- [/channels/groups](/fr/channels/groups)

## Connectivité de l’interface dashboard/control ui

Lorsque l’interface dashboard/control UI ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Recherchez :

- URL de sonde et URL du dashboard correctes.
- Incohérence de mode d’authentification/jeton entre le client et Gateway.
- Utilisation de HTTP là où l’identité d’appareil est requise.

Signatures courantes :

- `device identity required` → contexte non sécurisé ou authentification d’appareil manquante.
- `origin not allowed` → `Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins`
  (ou vous vous connectez depuis une origine de navigateur non-loopback sans
  liste d’autorisation explicite).
- `device nonce required` / `device nonce mismatch` → le client ne termine pas le
  flux d’authentification d’appareil basé sur défi (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → le client a signé la mauvaise
  charge utile (ou un horodatage périmé) pour l’échange en cours.
- `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut faire une tentative de confiance avec le jeton d’appareil en cache.
- Cette tentative avec jeton en cache réutilise l’ensemble de portées en cache stocké avec le jeton
  d’appareil associé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent
  à la place leur ensemble de portées demandé.
- En dehors de ce chemin de nouvelle tentative, l’ordre de priorité d’authentification de connexion est :
  jeton/mot de passe partagé explicite d’abord, puis `deviceToken` explicite, puis jeton d’appareil stocké,
  puis jeton d’amorçage.
- Sur le chemin asynchrone Tailscale Serve Control UI, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives
  concurrentes du même client peuvent donc produire `retry later`
  lors de la deuxième tentative au lieu de deux simples incohérences.
- `too many failed authentication attempts (retry later)` depuis un client loopback d’origine navigateur
  → les échecs répétés depuis cette même `Origin` normalisée sont temporairement bloqués ;
  une autre origine localhost utilise un compartiment distinct.
- `unauthorized` répété après cette tentative → dérive du jeton partagé/jeton d’appareil ; actualisez la configuration
  du jeton et réapprouvez/faites tourner le jeton d’appareil si nécessaire.
- `gateway connect failed:` → mauvaise cible hôte/port/url.

### Carte rapide des codes de détail d’authentification

Utilisez `error.details.code` de la réponse `connect` échouée pour choisir l’action suivante :

| Detail code                  | Meaning                                                                                                                                                                                      | Recommended action                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé de jeton partagé requis.                                                                                                                                           | Collez/définissez le jeton dans le client et réessayez. Pour les chemins dashboard : `openclaw config get gateway.auth.token` puis collez-le dans les paramètres de Control UI.                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | Le jeton partagé ne correspond pas au jeton d’authentification de Gateway.                                                                                                                  | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative de confiance. Les nouvelles tentatives avec jeton en cache réutilisent les portées approuvées stockées ; les appelants avec `deviceToken` / `scopes` explicites conservent leurs portées demandées. Si cela échoue encore, exécutez la [checklist de récupération de dérive de jeton](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton par appareil en cache est périmé ou révoqué.                                                                                                                                       | Faites tourner/réapprouvez le jeton d’appareil avec le [CLI devices](/cli/devices), puis reconnectez-vous.                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | L’identité d’appareil a besoin d’une approbation. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsqu’ils sont présents. | Approuvez la requête en attente : `openclaw devices list` puis `openclaw devices approve <requestId>`. Les mises à niveau de portée/rôle utilisent le même flux après examen de l’accès demandé.                                                                                     |

Vérification de migration d’authentification d’appareil v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux montrent des erreurs de nonce/signature, mettez à jour le client qui se connecte et vérifiez qu’il :

1. attend `connect.challenge`
2. signe la charge utile liée au défi
3. envoie `connect.params.device.nonce` avec le même nonce de défi

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- les sessions de jeton d’appareil associé ne peuvent gérer que **leur propre** appareil, sauf si
  l’appelant possède aussi `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que des portées opérateur que
  la session appelante détient déjà

Associé :

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

Recherchez :

- `Runtime: stopped` avec des indices de sortie.
- Incohérence de configuration du service (`Config (cli)` vs `Config (service)`).
- Conflits de port/d’écoute.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Indices de nettoyage `Other gateway-like services detected (best effort)`.

Signatures courantes :

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode Gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correction : définissez `gateway.mode="local"` dans votre configuration, ou relancez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration attendue en mode local. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification Gateway valide (jeton/mot de passe, ou trusted-proxy lorsqu’il est configuré).
- `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
- `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des installations doivent conserver une seule Gateway par machine ; si vous en avez vraiment besoin de plusieurs, isolez les ports + la configuration/l’état/l’espace de travail. Voir [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

Associé :

- [/gateway/background-process](/fr/gateway/background-process)
- [/gateway/configuration](/fr/gateway/configuration)
- [/gateway/doctor](/fr/gateway/doctor)

## Gateway a restauré la configuration du dernier état valide

Utilisez ceci lorsque Gateway démarre, mais que les journaux indiquent qu’il a restauré `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Recherchez :

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un fichier horodaté `openclaw.json.clobbered.*` à côté de la configuration active
- Un événement système de l’agent principal qui commence par `Config recovery warning`

Ce qui s’est passé :

- La configuration rejetée n’a pas passé la validation au démarrage ou lors du rechargement à chaud.
- OpenClaw a conservé la charge utile rejetée comme `.clobbered.*`.
- La configuration active a été restaurée depuis la dernière copie validée et connue comme bonne.
- Le prochain tour de l’agent principal est averti de ne pas réécrire aveuglément la configuration rejetée.

Inspecter et réparer :

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Signatures courantes :

- `.clobbered.*` existe → une modification directe externe ou une lecture au démarrage a été restaurée.
- `.rejected.*` existe → une écriture de configuration gérée par OpenClaw a échoué aux vérifications de schéma ou d’écrasement avant validation.
- `Config write rejected:` → l’écriture a tenté de supprimer une structure requise, de réduire fortement la taille du fichier ou de persister une configuration invalide.
- `Config last-known-good promotion skipped` → le candidat contenait des espaces réservés de secret masqués comme `***`.

Options de correction :

1. Conservez la configuration active restaurée si elle est correcte.
2. Copiez uniquement les clés voulues depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
3. Exécutez `openclaw config validate` avant de redémarrer.
4. Si vous modifiez à la main, conservez la configuration JSON5 complète, pas seulement l’objet partiel que vous vouliez changer.

Associé :

- [/gateway/configuration#strict-validation](/fr/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/fr/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/fr/gateway/doctor)

## Avertissements de sonde Gateway

Utilisez ceci lorsque `openclaw gateway probe` atteint quelque chose, mais affiche quand même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Recherchez :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne le repli SSH, plusieurs Gateways, des portées manquantes ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a quand même essayé les cibles directes configurées/loopback.
- `multiple reachable gateways detected` → plus d’une cible a répondu. En général, cela signifie une installation multi-Gateway intentionnelle ou des écouteurs obsolètes/dupliqués.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a réussi, mais le RPC de détail est limité par les portées ; associez l’identité d’appareil ou utilisez des identifiants avec `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → la Gateway a répondu, mais ce client a encore besoin d’une association/approbation avant un accès opérateur normal.
- texte d’avertissement non résolu `gateway.auth.*` / `gateway.remote.*` SecretRef → le matériel d’authentification n’était pas disponible dans ce chemin de commande pour la cible en échec.

Associé :

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/fr/gateway/remote)

## Canal connecté mais messages qui ne circulent pas

Si l’état du canal est connecté mais que le flux de messages est mort, concentrez-vous sur la politique, les autorisations et les règles de livraison spécifiques au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Recherchez :

- Politique DM (`pairing`, `allowlist`, `open`, `disabled`).
- Liste d’autorisation de groupe et exigences de mention.
- Autorisations/portées API du canal manquantes.

Signatures courantes :

- `mention required` → message ignoré par la politique de mention du groupe.
- traces `pairing` / d’approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/autorisations du canal.

Associé :

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

Recherchez :

- Cron activé et prochain réveil présent.
- Statut de l’historique d’exécution des tâches (`ok`, `skipped`, `error`).
- Raisons d’ignorance de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Signatures courantes :

- `cron: scheduler disabled; jobs will not run automatically` → Cron désactivé.
- `cron: timer tick failed` → l’impulsion du planificateur a échoué ; vérifiez les erreurs de fichier/journal/runtime.
- `heartbeat skipped` avec `reason=quiet-hours` → hors de la fenêtre d’heures actives.
- `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / en-têtes markdown, donc OpenClaw ignore l’appel au modèle.
- `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due sur cette impulsion.
- `heartbeat: unknown accountId` → ID de compte invalide pour la cible de livraison Heartbeat.
- `heartbeat skipped` avec `reason=dm-blocked` → la cible Heartbeat a été résolue vers une destination de type DM alors que `agents.defaults.heartbeat.directPolicy` (ou la surcharge par agent) est défini sur `block`.

Associé :

- [/automation/cron-jobs#troubleshooting](/fr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/fr/automation/cron-jobs)
- [/gateway/heartbeat](/fr/gateway/heartbeat)

## Échec de l’outil Node associé

Si un Node est associé mais que les outils échouent, isolez l’état de premier plan, les autorisations et l’état d’approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Recherchez :

- Node en ligne avec les capacités attendues.
- Autorisations OS pour caméra/micro/localisation/écran.
- État des approbations exec et de la liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’app Node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorisation OS manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation exec en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Associé :

- [/nodes/troubleshooting](/fr/nodes/troubleshooting)
- [/nodes/index](/fr/nodes/index)
- [/tools/exec-approvals](/fr/tools/exec-approvals)

## Échec de l’outil navigateur

Utilisez ceci lorsque les actions de l’outil navigateur échouent alors que Gateway lui-même est sain.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Recherchez :

- Si `plugins.allow` est défini et inclut `browser`.
- Chemin d’exécutable du navigateur valide.
- Accessibilité du profil CDP.
- Disponibilité de Chrome local pour les profils `existing-session` / `user`.

Signatures courantes :

- `unknown command "browser"` ou `unknown command 'browser'` → le Plugin navigateur fourni est exclu par `plugins.allow`.
- outil navigateur manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le Plugin n’a jamais été chargé.
- `Failed to start Chrome CDP on port` → le processus du navigateur n’a pas pu démarrer.
- `browser.executablePath not found` → le chemin configuré est invalide.
- `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge tel que `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port invalide ou hors plage.
- `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
- `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte Gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil en attachement seul n’a pas de cible accessible, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a toujours pas pu être ouvert.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle de Gateway n’inclut pas le paquet Playwright complet ; les instantanés ARIA et les captures d’écran simples de page peuvent encore fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments par sélecteur CSS et l’export PDF restent indisponibles.
- `fullPage is not supported for element screenshots` → la requête de capture d’écran mélange `--full-page` avec `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser la capture de page ou un `--ref` depuis un instantané, pas un `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks de téléversement Chrome MCP nécessitent des refs d’instantané, pas des sélecteurs CSS.
- `existing-session file uploads currently support one file at a time.` → envoyez un seul téléversement par appel sur les profils Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → les hooks de dialogue sur les profils Chrome MCP ne prennent pas en charge les surcharges de délai.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite encore un navigateur géré ou un profil CDP brut.
- surcharges obsolètes de viewport / mode sombre / langue / hors ligne sur les profils attach-only ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer toute la Gateway.

Associé :

- [/tools/browser-linux-troubleshooting](/fr/tools/browser-linux-troubleshooting)
- [/tools/browser](/fr/tools/browser)

## Si vous avez effectué une mise à niveau et que quelque chose s’est soudainement cassé

La plupart des pannes après mise à niveau proviennent d’une dérive de configuration ou de valeurs par défaut plus strictes désormais appliquées.

### 1) Le comportement d’authentification et de surcharge d’URL a changé

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

À vérifier :

- Si `gateway.mode=remote`, les appels CLI peuvent cibler le distant alors que votre service local fonctionne très bien.
- Les appels explicites `--url` ne retombent pas sur les identifiants stockés.

Signatures courantes :

- `gateway connect failed:` → mauvaise cible URL.
- `unauthorized` → point de terminaison accessible mais mauvaise authentification.

### 2) Les garde-fous de liaison et d’authentification sont plus stricts

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

À vérifier :

- Les liaisons non-loopback (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification Gateway valide : authentification par jeton/mot de passe partagé, ou déploiement `trusted-proxy` non-loopback correctement configuré.
- Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

Signatures courantes :

- `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification Gateway valide.
- `Connectivity probe: failed` alors que le runtime est en cours d’exécution → Gateway est actif mais inaccessible avec l’authentification/l’URL actuelles.

### 3) L’état de l’association et de l’identité d’appareil a changé

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

À vérifier :

- Approbations d’appareil en attente pour le dashboard/nodes.
- Approbations d’association DM en attente après des changements de politique ou d’identité.

Signatures courantes :

- `device identity required` → l’authentification d’appareil n’est pas satisfaite.
- `pairing required` → l’expéditeur/l’appareil doit être approuvé.

Si la configuration du service et le runtime sont toujours en désaccord après les vérifications, réinstallez les métadonnées du service depuis le même répertoire de profil/d’état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Associé :

- [/gateway/pairing](/fr/gateway/pairing)
- [/gateway/authentication](/fr/gateway/authentication)
- [/gateway/background-process](/fr/gateway/background-process)
