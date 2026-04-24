---
read_when:
    - Jumelage de nœuds iOS/Android à un gateway
    - Utiliser canvas/camera de nœud pour le contexte d’agent
    - Ajout de nouvelles commandes de nœud ou d’assistants CLI
summary: 'Nœuds : jumelage, capacités, autorisations et assistants CLI pour canvas/camera/screen/device/notifications/system'
title: Nœuds
x-i18n:
    generated_at: "2026-04-24T07:18:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Un **nœud** est un appareil compagnon (macOS/iOS/Android/headless) qui se connecte au **WebSocket** du Gateway (même port que les opérateurs) avec `role: "node"` et expose une surface de commandes (par ex. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Détails du protocole : [Protocole Gateway](/fr/gateway/protocol).

Transport hérité : [Protocole Bridge](/fr/gateway/bridge-protocol) (TCP JSONL ;
historique uniquement pour les nœuds actuels).

macOS peut aussi fonctionner en **mode nœud** : l’application de barre de menus se connecte au serveur WS du Gateway et expose ses commandes locales canvas/camera comme un nœud (ainsi `openclaw nodes …` fonctionne sur ce Mac).

Remarques :

- Les nœuds sont des **périphériques**, pas des gateways. Ils n’exécutent pas le service gateway.
- Les messages Telegram/WhatsApp/etc. arrivent sur le **gateway**, pas sur les nœuds.
- Runbook de dépannage : [/nodes/troubleshooting](/fr/nodes/troubleshooting)

## Jumelage + statut

**Les nœuds WS utilisent le jumelage d’appareil.** Les nœuds présentent une identité d’appareil pendant `connect` ; le Gateway
crée une demande de jumelage d’appareil pour `role: node`. Approuvez-la via la CLI des appareils (ou l’interface).

CLI rapide :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Si un nœud réessaie avec des détails d’authentification modifiés (rôle/portées/clé publique), la
demande en attente précédente est remplacée et un nouveau `requestId` est créé. Relancez
`openclaw devices list` avant d’approuver.

Remarques :

- `nodes status` marque un nœud comme **jumelé** lorsque son rôle de jumelage d’appareil inclut `node`.
- L’enregistrement de jumelage d’appareil est le contrat durable de rôle approuvé. La rotation
  des jetons reste à l’intérieur de ce contrat ; elle ne peut pas faire évoluer un nœud jumelé vers un
  rôle différent que l’approbation du jumelage n’a jamais accordé.
- `node.pair.*` (CLI : `openclaw nodes pending/approve/reject/rename`) est un stockage distinct
  de jumelage de nœud géré par le gateway ; il ne contrôle **pas** la poignée de main WS `connect`.
- La portée d’approbation suit les commandes déclarées de la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes de nœud non-exec : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`

## Hôte de nœud distant (system.run)

Utilisez un **hôte de nœud** lorsque votre Gateway s’exécute sur une machine et que vous souhaitez que les commandes
s’exécutent sur une autre. Le modèle continue de parler au **gateway** ; le gateway
transmet les appels `exec` à l’**hôte de nœud** lorsque `host=node` est sélectionné.

### Ce qui s’exécute où

- **Hôte Gateway** : reçoit les messages, exécute le modèle, route les appels d’outils.
- **Hôte de nœud** : exécute `system.run`/`system.which` sur la machine du nœud.
- **Approvals** : appliquées sur l’hôte de nœud via `~/.openclaw/exec-approvals.json`.

Remarque sur les approbations :

- Les exécutions de nœud adossées à une approbation lient le contexte exact de la requête.
- Pour les exécutions directes de shell/fichiers runtime, OpenClaw lie aussi au mieux un opérande de
  fichier local concret et refuse l’exécution si ce fichier change avant l’exécution.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur/runtime,
  l’exécution adossée à une approbation est refusée au lieu de prétendre couvrir entièrement le runtime. Utilisez le sandboxing,
  des hôtes séparés ou une liste d’autorisation/un workflow de confiance explicites pour une sémantique d’interpréteur plus large.

### Démarrer un hôte de nœud (premier plan)

Sur la machine du nœud :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway distant via tunnel SSH (bind loopback)

Si le Gateway se lie sur loopback (`gateway.bind=loopback`, par défaut en mode local),
les hôtes de nœud distants ne peuvent pas s’y connecter directement. Créez un tunnel SSH et pointez
l’hôte de nœud vers l’extrémité locale du tunnel.

Exemple (hôte de nœud -> hôte gateway) :

```bash
# Terminal A (à laisser tourner) : transférer le port local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B : exporter le jeton gateway et se connecter via le tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Remarques :

- `openclaw node run` prend en charge l’authentification par jeton ou mot de passe.
- Les variables d’environnement sont préférées : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Le repli de configuration est `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte de nœud ignore intentionnellement `gateway.remote.token` / `gateway.remote.password`.
- En mode distant, `gateway.remote.token` / `gateway.remote.password` sont éligibles selon les règles de priorité distantes.
- Si des SecretRef locaux actifs `gateway.auth.*` sont configurés mais non résolus, l’authentification de l’hôte de nœud échoue en mode fermé.
- La résolution d’authentification de l’hôte de nœud ne respecte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

### Démarrer un hôte de nœud (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Jumeler + nommer

Sur l’hôte gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si le nœud réessaie avec des détails d’authentification modifiés, relancez `openclaw devices list`
et approuvez le `requestId` actuel.

Options de nommage :

- `--display-name` sur `openclaw node run` / `openclaw node install` (persiste dans `~/.openclaw/node.json` sur le nœud).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (remplacement côté gateway).

### Mettre les commandes dans la liste d’autorisation

Les approbations exec sont **par hôte de nœud**. Ajoutez des entrées de liste d’autorisation depuis le gateway :

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Les approbations vivent sur l’hôte de nœud dans `~/.openclaw/exec-approvals.json`.

### Pointer exec vers le nœud

Configurer les valeurs par défaut (configuration gateway) :

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou par session :

```
/exec host=node security=allowlist node=<id-or-name>
```

Une fois cela défini, tout appel `exec` avec `host=node` s’exécute sur l’hôte de nœud (sous réserve de la
liste d’autorisation/approvals du nœud).

`host=auto` ne choisira pas implicitement le nœud de lui-même, mais une requête explicite `host=node` par appel est autorisée depuis `auto`. Si vous voulez que l’exécution sur nœud soit la valeur par défaut de la session, définissez explicitement `tools.exec.host=node` ou `/exec host=node ...`.

Associé :

- [CLI d’hôte de nœud](/fr/cli/node)
- [Outil Exec](/fr/tools/exec)
- [Exec approvals](/fr/tools/exec-approvals)

## Invoquer des commandes

Bas niveau (RPC brut) :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Des assistants de niveau supérieur existent pour les flux de travail courants « donner à l’agent une pièce jointe MEDIA ».

## Captures d’écran (instantanés canvas)

Si le nœud affiche le Canvas (WebView), `canvas.snapshot` renvoie `{ format, base64 }`.

Assistant CLI (écrit dans un fichier temporaire et affiche `MEDIA:<path>`) :

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Contrôles Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Remarques :

- `canvas present` accepte des URL ou des chemins de fichiers locaux (`--target`), ainsi que `--x/--y/--width/--height` facultatifs pour le positionnement.
- `canvas eval` accepte du JS inline (`--js`) ou un argument positionnel.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Remarques :

- Seul A2UI v0.8 JSONL est pris en charge (v0.9/createSurface est rejeté).

## Photos + vidéos (caméra du nœud)

Photos (`jpg`) :

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # par défaut : les deux orientations (2 lignes MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clips vidéo (`mp4`) :

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Remarques :

- Le nœud doit être **au premier plan** pour `canvas.*` et `camera.*` (les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`).
- La durée des clips est limitée (actuellement `<= 60s`) pour éviter des charges utiles base64 surdimensionnées.
- Android demandera les autorisations `CAMERA`/`RECORD_AUDIO` lorsque possible ; les autorisations refusées échouent avec `*_PERMISSION_REQUIRED`.

## Enregistrements d’écran (nœuds)

Les nœuds pris en charge exposent `screen.record` (`mp4`). Exemple :

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Remarques :

- La disponibilité de `screen.record` dépend de la plateforme du nœud.
- Les enregistrements d’écran sont limités à `<= 60s`.
- `--no-audio` désactive la capture du microphone sur les plateformes prises en charge.
- Utilisez `--screen <index>` pour sélectionner un écran lorsqu’il y en a plusieurs.

## Localisation (nœuds)

Les nœuds exposent `location.get` lorsque la localisation est activée dans les réglages.

Assistant CLI :

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Remarques :

- La localisation est **désactivée par défaut**.
- « Toujours » nécessite une autorisation système ; la récupération en arrière-plan se fait au mieux.
- La réponse inclut lat/lon, précision (mètres) et horodatage.

## SMS (nœuds Android)

Les nœuds Android peuvent exposer `sms.send` lorsque l’utilisateur accorde l’autorisation **SMS** et que l’appareil prend en charge la téléphonie.

Invocation bas niveau :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Remarques :

- L’invite d’autorisation doit être acceptée sur l’appareil Android avant que la capacité ne soit annoncée.
- Les appareils Wi‑Fi uniquement sans téléphonie n’annonceront pas `sms.send`.

## Commandes Android device + données personnelles

Les nœuds Android peuvent annoncer des familles de commandes supplémentaires lorsque les capacités correspondantes sont activées.

Familles disponibles :

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Exemples d’invocations :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Remarques :

- Les commandes de mouvement sont contrôlées par capacité selon les capteurs disponibles.

## Commandes système (hôte de nœud / nœud mac)

Le nœud macOS expose `system.run`, `system.notify` et `system.execApprovals.get/set`.
L’hôte de nœud headless expose `system.run`, `system.which` et `system.execApprovals.get/set`.

Exemples :

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Remarques :

- `system.run` renvoie stdout/stderr/code de sortie dans la charge utile.
- L’exécution shell passe désormais par l’outil `exec` avec `host=node` ; `nodes` reste la surface RPC directe pour les commandes de nœud explicites.
- `nodes invoke` n’expose pas `system.run` ni `system.run.prepare` ; ceux-ci restent disponibles uniquement sur le chemin exec.
- Le chemin exec prépare un `systemRunPlan` canonique avant l’approbation. Une fois qu’une
  approbation est accordée, le gateway transmet ce plan stocké, et non d’éventuels champs
  command/cwd/session modifiés plus tard par l’appelant.
- `system.notify` respecte l’état des autorisations de notification dans l’application macOS.
- Les métadonnées de nœud `platform` / `deviceFamily` non reconnues utilisent une liste d’autorisation par défaut prudente qui exclut `system.run` et `system.which`. Si vous avez volontairement besoin de ces commandes pour une plateforme inconnue, ajoutez-les explicitement via `gateway.nodes.allowCommands`.
- `system.run` prend en charge `--cwd`, `--env KEY=VAL`, `--command-timeout` et `--needs-screen-recording`.
- Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les valeurs `--env` à portée de requête sont réduites à une liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les wrappers de dispatch connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent les chemins des exécutables internes au lieu des chemins des wrappers. Si le déballage n’est pas sûr, aucune entrée de liste d’autorisation n’est persistée automatiquement.
- Sur les hôtes de nœud Windows en mode liste d’autorisation, les exécutions via wrapper shell `cmd.exe /c` nécessitent une approbation (une entrée de liste d’autorisation seule n’autorise pas automatiquement cette forme de wrapper).
- `system.notify` prend en charge `--priority <passive|active|timeSensitive>` et `--delivery <system|overlay|auto>`.
- Les hôtes de nœud ignorent les remplacements de `PATH` et retirent les clés dangereuses de démarrage/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Si vous avez besoin d’entrées PATH supplémentaires, configurez l’environnement du service hôte de nœud (ou installez les outils dans des emplacements standard) au lieu de passer `PATH` via `--env`.
- En mode nœud macOS, `system.run` est contrôlé par les approbations exec dans l’application macOS (Réglages → Approbations exec).
  Ask/allowlist/full se comportent comme sur l’hôte de nœud headless ; les invites refusées renvoient `SYSTEM_RUN_DENIED`.
- Sur l’hôte de nœud headless, `system.run` est contrôlé par les approbations exec (`~/.openclaw/exec-approvals.json`).

## Liaison exec de nœud

Lorsque plusieurs nœuds sont disponibles, vous pouvez lier exec à un nœud spécifique.
Cela définit le nœud par défaut pour `exec host=node` (et peut être remplacé par agent).

Valeur par défaut globale :

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Remplacement par agent :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Supprimez pour autoriser n’importe quel nœud :

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Carte des autorisations

Les nœuds peuvent inclure une carte `permissions` dans `node.list` / `node.describe`, indexée par nom d’autorisation (par ex. `screenRecording`, `accessibility`) avec des valeurs booléennes (`true` = accordée).

## Hôte de nœud headless (multiplateforme)

OpenClaw peut exécuter un **hôte de nœud headless** (sans interface) qui se connecte au
WebSocket du Gateway et expose `system.run` / `system.which`. C’est utile sur Linux/Windows
ou pour exécuter un nœud minimal à côté d’un serveur.

Le démarrer :

```bash
openclaw node run --host <gateway-host> --port 18789
```

Remarques :

- Le jumelage reste requis (le Gateway affichera une invite de jumelage d’appareil).
- L’hôte de nœud stocke son ID de nœud, son jeton, son nom d’affichage et les informations de connexion gateway dans `~/.openclaw/node.json`.
- Les approbations exec sont appliquées localement via `~/.openclaw/exec-approvals.json`
  (voir [Exec approvals](/fr/tools/exec-approvals)).
- Sur macOS, l’hôte de nœud headless exécute `system.run` localement par défaut. Définissez
  `OPENCLAW_NODE_EXEC_HOST=app` pour router `system.run` via l’hôte exec de l’application compagnon ; ajoutez
  `OPENCLAW_NODE_EXEC_FALLBACK=0` pour exiger l’hôte applicatif et échouer en mode fermé s’il est indisponible.
- Ajoutez `--tls` / `--tls-fingerprint` lorsque le WS du Gateway utilise TLS.

## Mode nœud Mac

- L’application macOS de barre de menus se connecte au serveur WS du Gateway comme un nœud (de sorte que `openclaw nodes …` fonctionne sur ce Mac).
- En mode distant, l’application ouvre un tunnel SSH pour le port Gateway et se connecte à `localhost`.
