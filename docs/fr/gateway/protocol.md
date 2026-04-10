---
read_when:
    - Implémenter ou mettre à jour des clients WS de gateway
    - Déboguer les incompatibilités de protocole ou les échecs de connexion
    - Régénérer le schéma/les modèles du protocole
summary: 'Protocole WebSocket Gateway : handshake, trames, gestion des versions'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-04-10T06:55:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83c820c46d4803d571c770468fd6782619eaa1dca253e156e8087dec735c127f
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocole Gateway (WebSocket)

Le protocole WS Gateway est le **plan de contrôle unique + le transport de nœud** pour
OpenClaw. Tous les clients (CLI, interface web, app macOS, nœuds iOS/Android,
nœuds headless) se connectent via WebSocket et déclarent leur **rôle** + leur **portée**
au moment du handshake.

## Transport

- WebSocket, trames texte avec des payloads JSON.
- La première trame **doit** être une requête `connect`.

## Handshake (`connect`)

Gateway → Client (défi pré-connexion) :

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway :

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Client :

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

Lorsqu’un token d’appareil est émis, `hello-ok` inclut également :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Pendant le transfert de bootstrap approuvé, `hello-ok.auth` peut aussi inclure des
entrées de rôle supplémentaires bornées dans `deviceTokens` :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Pour le flux de bootstrap intégré nœud/opérateur, le token principal du nœud reste avec
`scopes: []` et tout token opérateur transmis reste borné à la liste d’autorisation de
l’opérateur de bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de portée de bootstrap restent
préfixées par le rôle : les entrées opérateur ne satisfont que les requêtes opérateur, et les
rôles non opérateur ont toujours besoin de portées sous leur propre préfixe de rôle.

### Exemple de nœud

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Encapsulation

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes avec effets de bord nécessitent des **clés d’idempotence** (voir le schéma).

## Rôles + portées

### Rôles

- `operator` = client de plan de contrôle (CLI/UI/automatisation).
- `node` = hôte de capacités (camera/screen/canvas/system.run).

### Portées (`operator`)

Portées courantes :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` nécessite `operator.talk.secrets`
(ou `operator.admin`).

Les méthodes RPC Gateway enregistrées par des plugins peuvent demander leur propre portée opérateur, mais
les préfixes d’administration cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sont toujours résolus vers `operator.admin`.

La portée de méthode n’est que le premier filtre. Certaines commandes slash atteintes via
`chat.send` appliquent des vérifications plus strictes au niveau de la commande en plus. Par
exemple, les écritures persistantes `/config set` et `/config unset` nécessitent `operator.admin`.

`node.pair.approve` a également une vérification de portée supplémentaire au moment de l’approbation, en
plus de la portée de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec des commandes de nœud hors exec : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

Les nœuds déclarent des revendications de capacités au moment de la connexion :

- `caps` : catégories de capacités de haut niveau.
- `commands` : liste d’autorisation des commandes pour `invoke`.
- `permissions` : bascules granulaires (par ex. `screen.record`, `camera.capture`).

La Gateway traite celles-ci comme des **revendications** et applique des listes d’autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les interfaces puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **operator** et comme **node**.

## Familles courantes de méthodes RPC

Cette page n’est pas un dump complet généré, mais la surface WS publique est plus large
que les exemples de handshake/auth ci-dessus. Voici les principales familles de méthodes que la
Gateway expose aujourd’hui.

`hello-ok.features.methods` est une liste de découverte conservatrice construite à partir de
`src/gateway/server-methods-list.ts` plus les exports de méthodes de plugins/canaux chargés.
Traitez-la comme un mécanisme de découverte de fonctionnalités, pas comme un dump généré de tous les helpers appelables
implémentés dans `src/gateway/server-methods/*.ts`.

### Système et identité

- `health` renvoie le snapshot d’état de santé de la gateway, en cache ou fraîchement sondé.
- `status` renvoie le résumé de gateway au format `/status` ; les champs sensibles sont
  inclus uniquement pour les clients opérateur avec portée admin.
- `gateway.identity.get` renvoie l’identité d’appareil de la gateway utilisée par les flux de relais et
  de pairing.
- `system-presence` renvoie le snapshot de présence actuel pour les appareils
  opérateur/nœud connectés.
- `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte
  de présence.
- `last-heartbeat` renvoie le dernier événement heartbeat persisté.
- `set-heartbeats` active ou désactive le traitement des heartbeats sur la gateway.

### Modèles et utilisation

- `models.list` renvoie le catalogue des modèles autorisés à l’exécution.
- `usage.status` renvoie des résumés des fenêtres d’utilisation des fournisseurs et du quota restant.
- `usage.cost` renvoie des résumés agrégés des coûts d’utilisation pour une plage de dates.
- `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings pour
  l’espace de travail de l’agent par défaut actif.
- `sessions.usage` renvoie des résumés d’utilisation par session.
- `sessions.usage.timeseries` renvoie une série temporelle d’utilisation pour une session.
- `sessions.usage.logs` renvoie les entrées du journal d’utilisation pour une session.

### Canaux et assistants de connexion

- `channels.status` renvoie des résumés d’état des canaux/plugins intégrés + fournis.
- `channels.logout` déconnecte un canal/compte spécifique là où le canal
  prend en charge la déconnexion.
- `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web
  actuel compatible QR.
- `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le
  canal en cas de succès.
- `push.test` envoie une notification push APNs de test à un nœud iOS enregistré.
- `voicewake.get` renvoie les déclencheurs de mot d’activation stockés.
- `voicewake.set` met à jour les déclencheurs de mot d’activation et diffuse le changement.

### Messagerie et journaux

- `send` est la RPC de livraison sortante directe pour les envois
  ciblés par canal/compte/fil en dehors du moteur de chat.
- `logs.tail` renvoie la fin du journal de fichiers configuré de la gateway avec des contrôles de curseur/limite et
  d’octets maximum.

### Talk et TTS

- `talk.config` renvoie le payload de configuration Talk effectif ; `includeSecrets`
  nécessite `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients
  WebChat/Control UI.
- `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
- `tts.status` renvoie l’état d’activation de TTS, le fournisseur actif, les fournisseurs de repli,
  et l’état de configuration du fournisseur.
- `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
- `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
- `tts.setProvider` met à jour le fournisseur TTS préféré.
- `tts.convert` exécute une conversion texte-parole ponctuelle.

### Secrets, configuration, mise à jour et assistant

- `secrets.reload` résout à nouveau les SecretRefs actifs et remplace l’état des secrets à l’exécution
  uniquement en cas de succès complet.
- `secrets.resolve` résout les assignations de secrets ciblées par commande pour un ensemble spécifique
  de commandes/cibles.
- `config.get` renvoie le snapshot de configuration actuel et son hash.
- `config.set` écrit un payload de configuration validé.
- `config.patch` fusionne une mise à jour partielle de configuration.
- `config.apply` valide puis remplace le payload complet de configuration.
- `config.schema` renvoie le payload du schéma de configuration live utilisé par Control UI et
  les outils CLI : schéma, `uiHints`, version et métadonnées de génération, y compris
  les métadonnées de schéma de plugin + canal lorsque l’exécution peut les charger. Le schéma
  inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés
  et textes d’aide utilisés par l’UI, y compris pour les objets imbriqués, les jokers,
  les éléments de tableau et les branches de composition `anyOf` / `oneOf` / `allOf` lorsque la
  documentation de champ correspondante existe.
- `config.schema.lookup` renvoie un payload de recherche limité à un chemin pour un chemin de configuration
  : chemin normalisé, nœud de schéma superficiel, indice correspondant + `hintPath`, et
  résumés immédiats des enfants pour l’exploration UI/CLI.
  - Les nœuds de schéma de recherche conservent la documentation orientée utilisateur et les champs de validation courants :
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    bornes numériques/chaînes/tableaux/objets, et indicateurs booléens comme
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Les résumés des enfants exposent `key`, le `path` normalisé, `type`, `required`,
    `hasChildren`, ainsi que le `hint` / `hintPath` correspondant.
- `update.run` exécute le flux de mise à jour de la gateway et planifie un redémarrage uniquement lorsque
  la mise à jour elle-même a réussi.
- `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant
  d’onboarding via RPC WS.

### Familles majeures existantes

#### Assistants d’agent et d’espace de travail

- `agents.list` renvoie les entrées d’agent configurées.
- `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agent et
  le raccordement de l’espace de travail.
- `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les
  fichiers de l’espace de travail de bootstrap exposés pour un agent.
- `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou
  une session.
- `agent.wait` attend la fin d’une exécution et renvoie le snapshot terminal lorsqu’il est
  disponible.

#### Contrôle de session

- `sessions.list` renvoie l’index actuel des sessions.
- `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les
  abonnements aux événements de changement de session pour le client WS actuel.
- `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent
  les abonnements aux événements de transcription/message pour une session.
- `sessions.preview` renvoie des aperçus bornés de transcription pour des clés
  de session spécifiques.
- `sessions.resolve` résout ou canonicalise une cible de session.
- `sessions.create` crée une nouvelle entrée de session.
- `sessions.send` envoie un message dans une session existante.
- `sessions.steer` est la variante interruption-et-réorientation pour une session active.
- `sessions.abort` interrompt le travail actif pour une session.
- `sessions.patch` met à jour les métadonnées/remplacements de session.
- `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la
  maintenance de session.
- `sessions.get` renvoie la ligne complète de session stockée.
- l’exécution du chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et
  `chat.inject`.
- `chat.history` est normalisé pour l’affichage pour les clients UI : les balises de directive inline sont
  supprimées du texte visible, les payloads XML d’appel d’outil en texte brut (y compris
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et
  les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle de modèle ASCII/pleine largeur divulgués
  sont supprimés, les lignes d’assistant ne contenant que des jetons silencieux, telles que `NO_REPLY` /
  `no_reply` exacts, sont omises, et les lignes surdimensionnées peuvent être remplacées par des placeholders.

#### Pairing d’appareils et tokens d’appareil

- `device.pair.list` renvoie les appareils pairés en attente et approuvés.
- `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les
  enregistrements de pairing d’appareil.
- `device.token.rotate` fait tourner un token d’appareil pairé dans les limites de son rôle
  et de ses portées approuvés.
- `device.token.revoke` révoque un token d’appareil pairé.

#### Pairing de nœud, `invoke` et travail en attente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` et `node.pair.verify` couvrent le pairing de nœud et la
  vérification du bootstrap.
- `node.list` et `node.describe` renvoient l’état des nœuds connus/connectés.
- `node.rename` met à jour un libellé de nœud pairé.
- `node.invoke` transmet une commande à un nœud connecté.
- `node.invoke.result` renvoie le résultat d’une requête `invoke`.
- `node.event` transporte les événements d’origine nœud de retour vers la gateway.
- `node.canvas.capability.refresh` rafraîchit les tokens de capacité canvas à portée limitée.
- `node.pending.pull` et `node.pending.ack` sont les API de file d’attente des nœuds connectés.
- `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente
  pour les nœuds hors ligne/déconnectés.

#### Familles d’approbation

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et
  `exec.approval.resolve` couvrent les requêtes d’approbation exec ponctuelles ainsi que la
  recherche/relecture des approbations en attente.
- `exec.approval.waitDecision` attend une approbation exec en attente et renvoie
  la décision finale (ou `null` en cas de délai d’attente).
- `exec.approvals.get` et `exec.approvals.set` gèrent les snapshots de politique
  d’approbation exec de la gateway.
- `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique locale de
  d’approbation exec du nœud via des commandes de relais de nœud.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent
  les flux d’approbation définis par les plugins.

#### Autres familles majeures

- automatisation :
  - `wake` planifie une injection de texte de réveil immédiate ou au prochain heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Familles d’événements courantes

- `chat` : mises à jour de chat UI telles que `chat.inject` et autres événements
  de chat limités à la transcription.
- `session.message` et `session.tool` : mises à jour de transcription/flux d’événements pour une
  session abonnée.
- `sessions.changed` : l’index de session ou les métadonnées ont changé.
- `presence` : mises à jour du snapshot de présence du système.
- `tick` : événement périodique de keepalive / vitalité.
- `health` : mise à jour du snapshot de santé de la gateway.
- `heartbeat` : mise à jour du flux d’événements heartbeat.
- `cron` : événement de changement d’exécution/de tâche cron.
- `shutdown` : notification d’arrêt de la gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie du pairing de nœud.
- `node.invoke.request` : diffusion de requête d’invocation de nœud.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie des appareils pairés.
- `voicewake.changed` : la configuration des déclencheurs de mot d’activation a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie de
  l’approbation exec.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie de
  l’approbation de plugin.

### Méthodes utilitaires de nœud

- Les nœuds peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de skill
  pour les vérifications d’auto-autorisation.

### Méthodes utilitaires d’opérateur

- Les opérateurs peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire des commandes à l’exécution pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle quelle surface la valeur `name` principale cible :
    - `text` renvoie le jeton principal de commande texte sans le `/` initial
    - `native` et le chemin par défaut `both` renvoient des noms natifs adaptés au fournisseur
      lorsqu’ils sont disponibles
  - `textAliases` contient des alias slash exacts tels que `/model` et `/m`.
  - `nativeName` contient le nom de commande natif adapté au fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que le nommage natif ainsi que la disponibilité
    des commandes natives de plugin.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées de la réponse.
- Les opérateurs peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils à l’exécution pour un
  agent. La réponse inclut les outils groupés et les métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du plugin lorsque `source="plugin"`
  - `optional` : si un outil de plugin est facultatif
- Les opérateurs peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire d’outils effectivement actif à l’exécution
  pour une session.
  - `sessionKey` est requis.
  - La gateway dérive le contexte d’exécution fiable côté serveur à partir de la session au lieu d’accepter
    un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser maintenant,
    y compris les outils core, plugin et de canal.
- Les opérateurs peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible des
  Skills pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et
    les options d’installation nettoyées sans exposer les valeurs secrètes brutes.
- Les opérateurs peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour les métadonnées
  de découverte ClawHub.
- Les opérateurs peuvent appeler `skills.install` (`operator.admin`) dans deux modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de skill dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode installateur Gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    exécute une action déclarée `metadata.openclaw.install` sur l’hôte gateway.
- Les opérateurs peuvent appeler `skills.update` (`operator.admin`) dans deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    l’espace de travail de l’agent par défaut.
  - Le mode configuration patche les valeurs `skills.entries.<skillKey>` telles que `enabled`,
    `apiKey` et `env`.

## Approbations exec

- Lorsqu’une requête exec nécessite une approbation, la gateway diffuse `exec.approval.requested`.
- Les clients opérateur résolvent cela en appelant `exec.approval.resolve` (nécessite la portée `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les requêtes sans `systemRunPlan` sont rejetées.
- Après l’approbation, les appels `node.invoke system.run` transmis réutilisent ce
  `systemRunPlan` canonique comme contexte autoritaire de commande/cwd/session.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre `prepare` et la transmission finale approuvée de `system.run`, la
  gateway rejette l’exécution au lieu de faire confiance au payload modifié.

## Repli de livraison d’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve un comportement strict : les cibles de livraison non résolues ou internes uniquement renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise un repli vers une exécution limitée à la session lorsqu’aucune route livrable externe ne peut être résolue (par exemple sessions internes/webchat ou configurations multicanales ambiguës).

## Gestion des versions

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir de définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Authentification

- L’authentification gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes porteurs d’identité tels que Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` hors loopback satisfont la vérification d’authentification de connexion à partir
  des en-têtes de requête au lieu de `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` ignore entièrement l’authentification de connexion par secret partagé ;
  n’exposez pas ce mode sur une entrée publique/non fiable.
- Après le pairing, la Gateway émet un **token d’appareil** limité au rôle + aux portées
  de la connexion. Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être
  persisté par le client pour les connexions futures.
- Les clients doivent persister le `hello-ok.auth.deviceToken` principal après toute
  connexion réussie.
- La reconnexion avec ce token d’appareil **stocké** doit également réutiliser l’ensemble de portées approuvées
  stocké pour ce token. Cela préserve l’accès lecture/sonde/statut qui avait déjà été
  accordé et évite de réduire silencieusement les reconnexions à une
  portée implicite plus étroite réservée à l’admin.
- L’ordre de priorité normal de l’authentification de connexion est d’abord le token/mot de passe partagé explicite, puis
  le `deviceToken` explicite, puis le token par appareil stocké, puis le token de bootstrap.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des tokens de transfert de bootstrap.
  Persistez-les uniquement lorsque la connexion a utilisé l’authentification bootstrap sur un transport fiable
  tel que `wss://` ou loopback/pairing local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites, cet
  ensemble de portées demandé par l’appelant reste autoritaire ; les portées en cache ne sont réutilisées que lorsque le client réutilise le token par appareil stocké.
- Les tokens d’appareil peuvent être tournés/révoqués via `device.token.rotate` et
  `device.token.revoke` (nécessite la portée `operator.pairing`).
- L’émission/la rotation de token reste limitée à l’ensemble de rôles approuvés enregistré dans
  l’entrée de pairing de cet appareil ; la rotation d’un token ne peut pas étendre l’appareil à un
  rôle que l’approbation de pairing n’a jamais accordé.
- Pour les sessions de token d’appareil pairé, la gestion des appareils est limitée à soi-même sauf si l’appelant
  possède aussi `operator.admin` : les appelants non admin ne peuvent supprimer/révoquer/faire tourner
  que leur **propre** entrée d’appareil.
- `device.token.rotate` vérifie également l’ensemble de portées opérateur demandé par rapport aux
  portées actuelles de session de l’appelant. Les appelants non admin ne peuvent pas faire tourner un token vers
  un ensemble de portées opérateur plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients de confiance peuvent tenter une unique nouvelle tentative bornée avec un token par appareil en cache.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles de reconnexion automatiques et afficher des instructions d’action à l’opérateur.

## Identité d’appareil + pairing

- Les nœuds doivent inclure une identité d’appareil stable (`device.id`) dérivée de l’empreinte d’une
  paire de clés.
- Les gateways émettent des tokens par appareil + rôle.
- Les approbations de pairing sont requises pour les nouveaux IDs d’appareil, sauf si
  l’auto-approbation locale est activée.
- L’auto-approbation de pairing est centrée sur les connexions directes de local loopback.
- OpenClaw dispose également d’un chemin étroit d’auto-connexion backend/local au conteneur pour
  des flux d’assistant de secret partagé approuvés.
- Les connexions tailnet ou LAN sur le même hôte sont toujours traitées comme distantes pour le pairing et
  nécessitent une approbation.
- Tous les clients WS doivent inclure l’identité `device` pendant `connect` (operator + node).
  Control UI ne peut l’omettre que dans ces modes :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée localhost-only.
  - authentification opérateur Control UI réussie avec `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (bris de glace, grave dégradation de sécurité).
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration de l’authentification d’appareil

Pour les clients hérités qui utilisent encore le comportement de signature antérieur au challenge, `connect` renvoie désormais
des codes de détail `DEVICE_AUTH_*` sous `error.details.code` avec une valeur stable dans `error.details.reason`.

Échecs courants de migration :

| Message                     | details.code                     | details.reason           | Signification                                       |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce périmé/incorrect.   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Le payload de signature ne correspond pas au payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est hors du décalage autorisé.   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format / la canonicalisation de la clé publique a échoué. |

Cible de migration :

- Toujours attendre `connect.challenge`.
- Signer le payload v2 qui inclut le nonce du serveur.
- Envoyer le même nonce dans `connect.params.device.nonce`.
- Le payload de signature préféré est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs appareil/client/rôle/portées/token/nonce.
- Les signatures héritées `v2` restent acceptées pour compatibilité, mais l’épinglage des métadonnées
  d’appareil pairé contrôle toujours la politique de commande lors de la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent éventuellement épingler l’empreinte du certificat gateway (voir la configuration `gateway.tls`
  ainsi que `gateway.remote.tlsFingerprint` ou la CLI `--tls-fingerprint`).

## Portée

Ce protocole expose l’**API gateway complète** (état, canaux, modèles, chat,
agent, sessions, nœuds, approbations, etc.). La surface exacte est définie par les
schémas TypeBox dans `src/gateway/protocol/schema.ts`.
