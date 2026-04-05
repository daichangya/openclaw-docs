---
read_when:
    - Appairage de nodes iOS/Android à une passerelle
    - Utilisation de node canvas/camera pour le contexte d’agent
    - Ajout de nouvelles commandes de node ou d’assistants CLI
summary: 'Nodes : appairage, capacités, autorisations et assistants CLI pour canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-05T12:48:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 201be0e13cb6d39608f0bbd40fd02333f68bd44f588538d1016fe864db7e038e
    source_path: nodes/index.md
    workflow: 15
---

# Nodes

Un **node** est un appareil compagnon (macOS/iOS/Android/headless) qui se connecte au **WebSocket** de la passerelle (même port que les opérateurs) avec `role: "node"` et expose une surface de commandes (par ex. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) via `node.invoke`. Détails du protocole : [Protocole Gateway](/gateway/protocol).

Transport historique : [Protocole Bridge](/gateway/bridge-protocol) (TCP JSONL ;
historique uniquement pour les nodes actuels).

macOS peut également fonctionner en **mode node** : l’app de barre de menus se connecte au serveur WS de la passerelle et expose ses commandes locales canvas/camera comme node (de sorte que `openclaw nodes …` fonctionne sur ce Mac).

Remarques :

- Les nodes sont des **périphériques**, pas des passerelles. Ils n’exécutent pas le service de passerelle.
- Les messages Telegram/WhatsApp/etc. arrivent sur la **passerelle**, pas sur les nodes.
- Guide de dépannage : [/nodes/troubleshooting](/nodes/troubleshooting)

## Appairage + état

**Les nodes WS utilisent l’appairage d’appareil.** Les nodes présentent une identité d’appareil pendant `connect` ; la passerelle
crée une demande d’appairage d’appareil pour `role: node`. Approuvez-la via la CLI des appareils (ou l’interface).

CLI rapide :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Si un node réessaie avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez
`openclaw devices list` avant d’approuver.

Remarques :

- `nodes status` marque un node comme **paired** lorsque son rôle d’appairage d’appareil inclut `node`.
- L’enregistrement d’appairage d’appareil est le contrat durable de rôle approuvé. La rotation de jeton reste à l’intérieur de ce contrat ; elle ne peut pas faire évoluer un node appairé vers un rôle différent que l’approbation d’appairage n’a jamais accordé.
- `node.pair.*` (CLI : `openclaw nodes pending/approve/reject/rename`) est un magasin d’appairage de node distinct appartenant à la passerelle ; il ne contrôle **pas** la poignée de main WS `connect`.
- La portée d’approbation suit les commandes déclarées par la demande en attente :
  - demande sans commande : `operator.pairing`
  - commandes de node sans exec : `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` : `operator.pairing` + `operator.admin`

## Hôte de node distant (system.run)

Utilisez un **hôte de node** lorsque votre passerelle s’exécute sur une machine et que vous voulez que les commandes s’exécutent
sur une autre. Le modèle parle toujours à la **passerelle** ; la passerelle
transmet les appels `exec` à l’**hôte de node** lorsque `host=node` est sélectionné.

### Ce qui s’exécute où

- **Hôte de passerelle** : reçoit les messages, exécute le modèle, route les appels d’outils.
- **Hôte de node** : exécute `system.run`/`system.which` sur la machine du node.
- **Approbations** : appliquées sur l’hôte de node via `~/.openclaw/exec-approvals.json`.

Remarque sur les approbations :

- Les exécutions de node adossées à une approbation lient le contexte exact de la requête.
- Pour les exécutions directes de fichiers shell/runtime, OpenClaw lie également au mieux un opérande de fichier local concret et refuse l’exécution si ce fichier change avant l’exécution.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande interpréteur/runtime, l’exécution adossée à une approbation est refusée au lieu de prétendre couvrir totalement le runtime. Utilisez le sandboxing,
  des hôtes séparés ou une liste d’autorisation/workflow approuvé explicite pour une sémantique d’interpréteur plus large.

### Démarrer un hôte de node (premier plan)

Sur la machine du node :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Passerelle distante via tunnel SSH (liaison loopback)

Si la passerelle est liée au loopback (`gateway.bind=loopback`, par défaut en mode local),
les hôtes de node distants ne peuvent pas se connecter directement. Créez un tunnel SSH et pointez l’hôte de node
vers l’extrémité locale du tunnel.

Exemple (hôte de node -> hôte de passerelle) :

```bash
# Terminal A (à laisser en cours d’exécution) : transfère le port local 18790 -> passerelle 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B : exporte le jeton de passerelle et se connecte via le tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Remarques :

- `openclaw node run` prend en charge l’authentification par jeton ou mot de passe.
- Les variables d’environnement sont préférées : `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Le repli de configuration est `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte de node ignore intentionnellement `gateway.remote.token` / `gateway.remote.password`.
- En mode distant, `gateway.remote.token` / `gateway.remote.password` sont éligibles selon les règles de priorité distantes.
- Si des SecretRefs actifs `gateway.auth.*` sont configurés mais non résolus, l’authentification de l’hôte de node échoue en mode fermé.
- La résolution d’auth de l’hôte de node n’honore que les variables d’environnement `OPENCLAW_GATEWAY_*`.

### Démarrer un hôte de node (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Appairer + nommer

Sur l’hôte de la passerelle :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Si le node réessaie avec des détails d’auth modifiés, réexécutez `openclaw devices list`
et approuvez le `requestId` courant.

Options de nommage :

- `--display-name` sur `openclaw node run` / `openclaw node install` (persiste dans `~/.openclaw/node.json` sur le node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (remplacement côté passerelle).

### Ajouter les commandes à la liste d’autorisation

Les approbations exec sont **par hôte de node**. Ajoutez des entrées de liste d’autorisation depuis la passerelle :

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Les approbations vivent sur l’hôte de node à `~/.openclaw/exec-approvals.json`.

### Pointer exec vers le node

Configurez les valeurs par défaut (configuration de la passerelle) :

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou par session :

```
/exec host=node security=allowlist node=<id-or-name>
```

Une fois défini, tout appel `exec` avec `host=node` s’exécute sur l’hôte de node (sous réserve de la liste d’autorisation/des approbations du node).

`host=auto` ne choisira pas implicitement le node de lui-même, mais une requête explicite `host=node` par appel est autorisée depuis `auto`. Si vous voulez que l’exec sur node soit la valeur par défaut pour la session, définissez explicitement `tools.exec.host=node` ou `/exec host=node ...`.

Associé :

- [CLI d’hôte de node](/cli/node)
- [Outil Exec](/tools/exec)
- [Approbations Exec](/tools/exec-approvals)

## Invocation de commandes

Bas niveau (RPC brut) :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Des assistants de niveau supérieur existent pour les workflows courants du type « donner à l’agent une pièce jointe MEDIA ».

## Captures d’écran (instantanés canvas)

Si le node affiche le Canvas (WebView), `canvas.snapshot` renvoie `{ format, base64 }`.

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

- `canvas present` accepte des URL ou des chemins de fichiers locaux (`--target`), ainsi que des `--x/--y/--width/--height` facultatifs pour le positionnement.
- `canvas eval` accepte du JS inline (`--js`) ou un argument positionnel.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Remarques :

- Seul A2UI v0.8 JSONL est pris en charge (v0.9/createSurface est rejeté).

## Photos + vidéos (caméra du node)

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

- Le node doit être **au premier plan** pour `canvas.*` et `camera.*` (les appels en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`).
- La durée des clips est limitée (actuellement `<= 60s`) pour éviter des charges utiles base64 trop volumineuses.
- Android demandera les autorisations `CAMERA`/`RECORD_AUDIO` lorsque possible ; les autorisations refusées échouent avec `*_PERMISSION_REQUIRED`.

## Enregistrements d’écran (nodes)

Les nodes pris en charge exposent `screen.record` (`mp4`). Exemple :

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Remarques :

- La disponibilité de `screen.record` dépend de la plateforme du node.
- Les enregistrements d’écran sont limités à `<= 60s`.
- `--no-audio` désactive la capture microphone sur les plateformes prises en charge.
- Utilisez `--screen <index>` pour sélectionner un écran lorsqu’il y a plusieurs affichages.

## Localisation (nodes)

Les nodes exposent `location.get` lorsque la localisation est activée dans les réglages.

Assistant CLI :

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Remarques :

- La localisation est **désactivée par défaut**.
- « Toujours » nécessite une autorisation système ; la récupération en arrière-plan est best-effort.
- La réponse inclut lat/lon, précision (mètres) et horodatage.

## SMS (nodes Android)

Les nodes Android peuvent exposer `sms.send` lorsque l’utilisateur accorde l’autorisation **SMS** et que l’appareil prend en charge la téléphonie.

Invocation bas niveau :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Remarques :

- L’invite d’autorisation doit être acceptée sur l’appareil Android avant que la capacité soit annoncée.
- Les appareils Wi‑Fi uniquement sans téléphonie n’annonceront pas `sms.send`.

## Commandes Android appareil + données personnelles

Les nodes Android peuvent annoncer des familles de commandes supplémentaires lorsque les capacités correspondantes sont activées.

Familles disponibles :

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Exemples d’invocation :

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Remarques :

- Les commandes de mouvement sont contrôlées par capacité selon les capteurs disponibles.

## Commandes système (hôte de node / mac node)

Le node macOS expose `system.run`, `system.notify` et `system.execApprovals.get/set`.
L’hôte de node headless expose `system.run`, `system.which` et `system.execApprovals.get/set`.

Exemples :

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Remarques :

- `system.run` renvoie stdout/stderr/code de sortie dans la charge utile.
- L’exécution shell passe désormais par l’outil `exec` avec `host=node` ; `nodes` reste la surface RPC directe pour les commandes de node explicites.
- `nodes invoke` n’expose pas `system.run` ni `system.run.prepare` ; ils restent uniquement sur le chemin exec.
- Le chemin exec prépare un `systemRunPlan` canonique avant approbation. Une fois une approbation accordée, la passerelle transmet ce plan stocké, et non des champs command/cwd/session modifiés ultérieurement par l’appelant.
- `system.notify` respecte l’état des autorisations de notification dans l’app macOS.
- Les métadonnées `platform` / `deviceFamily` de node non reconnues utilisent une liste d’autorisation conservatrice par défaut qui exclut `system.run` et `system.which`. Si vous avez intentionnellement besoin de ces commandes pour une plateforme inconnue, ajoutez-les explicitement via `gateway.nodes.allowCommands`.
- `system.run` prend en charge `--cwd`, `--env KEY=VAL`, `--command-timeout` et `--needs-screen-recording`.
- Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les valeurs `--env` limitées à la requête sont réduites à une liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions allow-always en mode allowlist, les wrappers de distribution connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent les chemins de l’exécutable interne au lieu des chemins du wrapper. Si le déballage n’est pas sûr, aucune entrée de liste d’autorisation n’est persistée automatiquement.
- Sur les hôtes de node Windows en mode allowlist, les exécutions de wrapper shell via `cmd.exe /c` nécessitent une approbation (une entrée de liste d’autorisation seule n’autorise pas automatiquement la forme wrapper).
- `system.notify` prend en charge `--priority <passive|active|timeSensitive>` et `--delivery <system|overlay|auto>`.
- Les hôtes de node ignorent les remplacements `PATH` et retirent les clés dangereuses de démarrage/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Si vous avez besoin d’entrées PATH supplémentaires, configurez plutôt l’environnement du service de l’hôte de node (ou installez les outils dans des emplacements standard) au lieu de passer `PATH` via `--env`.
- En mode node macOS, `system.run` est contrôlé par les approbations exec dans l’app macOS (Settings → Exec approvals).
  Ask/allowlist/full se comportent comme sur l’hôte de node headless ; les invites refusées renvoient `SYSTEM_RUN_DENIED`.
- Sur l’hôte de node headless, `system.run` est contrôlé par les approbations exec (`~/.openclaw/exec-approvals.json`).

## Liaison exec node

Lorsque plusieurs nodes sont disponibles, vous pouvez lier exec à un node spécifique.
Cela définit le node par défaut pour `exec host=node` (et peut être remplacé par agent).

Valeur par défaut globale :

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Remplacement par agent :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Supprimez-le pour autoriser n’importe quel node :

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Carte des autorisations

Les nodes peuvent inclure une carte `permissions` dans `node.list` / `node.describe`, indexée par nom d’autorisation (par ex. `screenRecording`, `accessibility`) avec des valeurs booléennes (`true` = accordé).

## Hôte de node headless (multiplateforme)

OpenClaw peut exécuter un **hôte de node headless** (sans interface) qui se connecte au WebSocket de la passerelle et expose `system.run` / `system.which`. C’est utile sous Linux/Windows
ou pour exécuter un node minimal à côté d’un serveur.

Démarrez-le :

```bash
openclaw node run --host <gateway-host> --port 18789
```

Remarques :

- L’appairage reste requis (la passerelle affichera une invite d’appairage d’appareil).
- L’hôte de node stocke son identifiant de node, son jeton, son nom d’affichage et ses informations de connexion à la passerelle dans `~/.openclaw/node.json`.
- Les approbations exec sont appliquées localement via `~/.openclaw/exec-approvals.json`
  (voir [Approbations Exec](/tools/exec-approvals)).
- Sur macOS, l’hôte de node headless exécute `system.run` localement par défaut. Définissez
  `OPENCLAW_NODE_EXEC_HOST=app` pour router `system.run` via l’hôte exec de l’app compagnon ; ajoutez
  `OPENCLAW_NODE_EXEC_FALLBACK=0` pour exiger l’hôte app et échouer en mode fermé s’il n’est pas disponible.
- Ajoutez `--tls` / `--tls-fingerprint` lorsque le WS de la passerelle utilise TLS.

## Mode mac node

- L’app macOS de barre de menus se connecte au serveur WS de la passerelle comme node (de sorte que `openclaw nodes …` fonctionne sur ce Mac).
- En mode distant, l’app ouvre un tunnel SSH pour le port de la passerelle et se connecte à `localhost`.
