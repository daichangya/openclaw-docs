---
read_when:
    - Implémenter ou mettre à jour des clients WS de gateway
    - Déboguer des incompatibilités de protocole ou des échecs de connexion
    - Régénérer les schémas/modèles du protocole
summary: 'Protocole WebSocket de la gateway : poignée de main, trames, versionnement'
title: Protocole de la gateway
x-i18n:
    generated_at: "2026-04-05T12:44:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocole de la gateway (WebSocket)

Le protocole WS de la gateway est le **plan de contrôle unique + transport de nœud** pour
OpenClaw. Tous les clients (CLI, interface web, application macOS, nœuds iOS/Android, nœuds headless)
se connectent via WebSocket et déclarent leur **rôle** + **portée** au moment de la
poignée de main.

## Transport

- WebSocket, trames texte avec charge utile JSON.
- La première trame **doit** être une requête `connect`.

## Poignée de main (connect)

Gateway → client (défi pré-connexion) :

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → gateway :

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

Gateway → client :

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

Lorsqu'un jeton d'appareil est émis, `hello-ok` inclut aussi :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Pendant le transfert d'amorçage approuvé, `hello-ok.auth` peut aussi inclure des
entrées de rôle supplémentaires limitées dans `deviceTokens` :

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

Pour le flux d'amorçage intégré node/operator, le jeton principal du nœud reste à
`scopes: []` et tout jeton operator transmis reste limité à la liste d'autorisation
operator de l'amorçage (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de portée d'amorçage restent
préfixées par rôle : les entrées operator ne satisfont que les requêtes operator, et les rôles non operator
ont toujours besoin de portées sous leur propre préfixe de rôle.

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

## Tramage

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes avec effets de bord nécessitent des **clés d'idempotence** (voir le schéma).

## Rôles + portées

### Rôles

- `operator` = client du plan de contrôle (CLI/UI/automatisation).
- `node` = hôte de capacités (camera/screen/canvas/system.run).

### Portées (operator)

Portées courantes :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` nécessite `operator.talk.secrets`
(ou `operator.admin`).

Les méthodes RPC de gateway enregistrées par plugin peuvent demander leur propre portée operator, mais
les préfixes admin réservés du cœur (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sont toujours résolus en `operator.admin`.

La portée de méthode n'est que la première barrière. Certaines commandes slash atteintes via
`chat.send` appliquent en plus des vérifications plus strictes au niveau commande. Par exemple,
les écritures persistantes `/config set` et `/config unset` nécessitent `operator.admin`.

`node.pair.approve` possède aussi une vérification de portée supplémentaire au moment de l'approbation, en plus de la portée de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec commandes de nœud autres que exec : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Les nœuds déclarent leurs revendications de capacité au moment de `connect` :

- `caps` : catégories de capacité de haut niveau.
- `commands` : liste d'autorisation des commandes pour l'invocation.
- `permissions` : bascules granulaires (par exemple `screen.record`, `camera.capture`).

La gateway les traite comme des **revendications** et applique des listes d'autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d'appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les interfaces puissent afficher une seule ligne par appareil
  même lorsqu'il se connecte à la fois comme **operator** et **node**.

## Familles courantes de méthodes RPC

Cette page n'est pas un dump complet généré, mais la surface WS publique est plus large
que les exemples de poignée de main/authentification ci-dessus. Voici les principales familles de méthodes que la
gateway expose actuellement.

`hello-ok.features.methods` est une liste de découverte conservatrice construite à partir de
`src/gateway/server-methods-list.ts` plus les exportations chargées de méthodes de plugin/canal.
Considérez-la comme une découverte de fonctionnalités, pas comme un dump généré de tous les assistants appelables
implémentés dans `src/gateway/server-methods/*.ts`.

### Système et identité

- `health` renvoie l'instantané d'état de la gateway mis en cache ou nouvellement sondé.
- `status` renvoie le résumé de gateway de type `/status` ; les champs sensibles ne sont
  inclus que pour les clients operator à portée admin.
- `gateway.identity.get` renvoie l'identité d'appareil de la gateway utilisée par les flux de relais et
  de jumelage.
- `system-presence` renvoie l'instantané de présence actuel pour les appareils
  operator/node connectés.
- `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte
  de présence.
- `last-heartbeat` renvoie le dernier événement heartbeat persisté.
- `set-heartbeats` active/désactive le traitement heartbeat sur la gateway.

### Modèles et utilisation

- `models.list` renvoie le catalogue de modèles autorisé à l'exécution.
- `usage.status` renvoie les fenêtres d'utilisation fournisseur/résumés de quota restant.
- `usage.cost` renvoie des résumés agrégés de coût d'utilisation pour une plage de dates.
- `doctor.memory.status` renvoie l'état de préparation de la mémoire vectorielle / des embeddings pour
  l'espace de travail actif de l'agent par défaut.
- `sessions.usage` renvoie des résumés d'utilisation par session.
- `sessions.usage.timeseries` renvoie une série temporelle d'utilisation pour une session.
- `sessions.usage.logs` renvoie les entrées de journal d'utilisation pour une session.

### Canaux et assistants de connexion

- `channels.status` renvoie des résumés d'état de canal/plugin intégrés + groupés.
- `channels.logout` déconnecte un canal/compte spécifique lorsque le canal
  prend en charge la déconnexion.
- `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web actuel compatible QR.
- `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le
  canal en cas de succès.
- `push.test` envoie un push APNs de test à un nœud iOS enregistré.
- `voicewake.get` renvoie les déclencheurs de mot d'activation stockés.
- `voicewake.set` met à jour les déclencheurs de mot d'activation et diffuse le changement.

### Messagerie et journaux

- `send` est le RPC de livraison sortante directe pour les envois ciblés par
  canal/compte/fil en dehors du moteur de chat.
- `logs.tail` renvoie la fin du journal fichier configuré de la gateway avec
  contrôles de curseur/limite et d'octets maximum.

### Talk et TTS

- `talk.config` renvoie la charge utile de configuration Talk effective ; `includeSecrets`
  nécessite `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` définit/diffuse l'état du mode Talk actuel pour les clients
  WebChat/interface de contrôle.
- `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
- `tts.status` renvoie l'état d'activation du TTS, le fournisseur actif, les fournisseurs de repli,
  et l'état de configuration du fournisseur.
- `tts.providers` renvoie l'inventaire visible des fournisseurs TTS.
- `tts.enable` et `tts.disable` activent/désactivent l'état des préférences TTS.
- `tts.setProvider` met à jour le fournisseur TTS préféré.
- `tts.convert` exécute une conversion ponctuelle texte-vers-parole.

### Secrets, configuration, mise à jour et assistant

- `secrets.reload` rerésout les SecretRef actifs et ne remplace l'état secret d'exécution qu'en cas de succès complet.
- `secrets.resolve` résout les affectations de secrets ciblées par commande pour un ensemble commande/cible spécifique.
- `config.get` renvoie l'instantané de configuration actuel et son hash.
- `config.set` écrit une charge utile de configuration validée.
- `config.patch` fusionne une mise à jour partielle de configuration.
- `config.apply` valide + remplace la charge utile complète de configuration.
- `config.schema` renvoie la charge utile de schéma de configuration active utilisée par l'interface de contrôle et
  les outils CLI : schéma, `uiHints`, version et métadonnées de génération, y compris
  les métadonnées de schéma plugin + canal lorsque le runtime peut les charger. Le schéma
  inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés
  et textes d'aide utilisés par l'interface, y compris pour les objets imbriqués, génériques,
  éléments de tableau, et branches de composition `anyOf` / `oneOf` / `allOf` lorsque la
  documentation de champ correspondante existe.
- `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un chemin de configuration :
  chemin normalisé, nœud de schéma superficiel, indication correspondante + `hintPath`, et
  résumés immédiats des enfants pour l'exploration détaillée UI/CLI.
  - Les nœuds de schéma de lookup conservent la documentation orientée utilisateur et les champs de validation courants :
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    bornes numériques/chaînes/tableaux/objets, et drapeaux booléens comme
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Les résumés d'enfants exposent `key`, `path` normalisé, `type`, `required`,
    `hasChildren`, plus `hint` / `hintPath` correspondants.
- `update.run` exécute le flux de mise à jour de la gateway et planifie un redémarrage uniquement lorsque
  la mise à jour elle-même a réussi.
- `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l'assistant
  d'onboarding via RPC WS.

### Grandes familles existantes

#### Assistants d'agent et d'espace de travail

- `agents.list` renvoie les entrées d'agent configurées.
- `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d'agent et
  le câblage de l'espace de travail.
- `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les
  fichiers bootstrap d'espace de travail exposés pour un agent.
- `agent.identity.get` renvoie l'identité effective de l'assistant pour un agent ou une
  session.
- `agent.wait` attend la fin d'une exécution et renvoie l'instantané terminal lorsque
  disponible.

#### Contrôle de session

- `sessions.list` renvoie l'index actuel des sessions.
- `sessions.subscribe` et `sessions.unsubscribe` activent/désactivent les abonnements aux événements de changement de session
  pour le client WS courant.
- `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent/désactivent
  les abonnements aux événements de transcription/message pour une session.
- `sessions.preview` renvoie des aperçus bornés de transcription pour des clés de session
  spécifiques.
- `sessions.resolve` résout ou canonicalise une cible de session.
- `sessions.create` crée une nouvelle entrée de session.
- `sessions.send` envoie un message dans une session existante.
- `sessions.steer` est la variante d'interruption-et-réorientation pour une session active.
- `sessions.abort` interrompt le travail actif d'une session.
- `sessions.patch` met à jour les métadonnées/remplacements d'une session.
- `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la
  maintenance de session.
- `sessions.get` renvoie la ligne complète de session stockée.
- l'exécution du chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et
  `chat.inject`.
- `chat.history` est normalisé pour l'affichage pour les clients UI : les balises de directives inline sont retirées du texte visible, les charges utiles XML d'appel d'outil en texte brut (y compris
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et
  les blocs tronqués d'appel d'outil) ainsi que les jetons de contrôle de modèle ASCII/pleine largeur divulgués
  sont retirés, les lignes d'assistant composées uniquement de jetons silencieux comme `NO_REPLY` /
  `no_reply` exact sont omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.

#### Jumelage d'appareils et jetons d'appareil

- `device.pair.list` renvoie les appareils jumelés en attente et approuvés.
- `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent
  les enregistrements de jumelage d'appareil.
- `device.token.rotate` fait tourner un jeton d'appareil jumelé dans les limites de son rôle
  et de ses portées approuvés.
- `device.token.revoke` révoque un jeton d'appareil jumelé.

#### Jumelage de nœuds, invocation et travail en attente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` et `node.pair.verify` couvrent le jumelage de nœud et la vérification d'amorçage.
- `node.list` et `node.describe` renvoient l'état des nœuds connus/connectés.
- `node.rename` met à jour un libellé de nœud jumelé.
- `node.invoke` transfère une commande à un nœud connecté.
- `node.invoke.result` renvoie le résultat d'une requête d'invocation.
- `node.event` transporte les événements d'origine nœud vers la gateway.
- `node.canvas.capability.refresh` actualise les jetons de capacité canvas limités en portée.
- `node.pending.pull` et `node.pending.ack` sont les API de file pour nœuds connectés.
- `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente
  pour les nœuds hors ligne/déconnectés.

#### Familles d'approbation

- `exec.approval.request` et `exec.approval.resolve` couvrent les demandes d'approbation exec
  ponctuelles.
- `exec.approval.waitDecision` attend une approbation exec en attente et renvoie
  la décision finale (ou `null` en cas de délai).
- `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique d'approbation exec
  de la gateway.
- `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique d'approbation exec
  locale au nœud via des commandes de relais nœud.
- `plugin.approval.request`, `plugin.approval.waitDecision` et
  `plugin.approval.resolve` couvrent les flux d'approbation définis par les plugins.

#### Autres grandes familles

- automatisation :
  - `wake` planifie une injection de texte de réveil immédiate ou au prochain heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/outils : `skills.*`, `tools.catalog`, `tools.effective`

### Familles courantes d'événements

- `chat` : mises à jour de chat UI telles que `chat.inject` et autres
  événements de chat limités à la transcription.
- `session.message` et `session.tool` : mises à jour transcription/flux d'événements pour une
  session abonnée.
- `sessions.changed` : l'index ou les métadonnées de session ont changé.
- `presence` : mises à jour d'instantané de présence système.
- `tick` : événement périodique de keepalive / vitalité.
- `health` : mise à jour de l'instantané d'état de la gateway.
- `heartbeat` : mise à jour du flux d'événements heartbeat.
- `cron` : événement de changement d'exécution/tâche cron.
- `shutdown` : notification d'arrêt de la gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie du jumelage de nœud.
- `node.invoke.request` : diffusion d'une requête d'invocation de nœud.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie de l'appareil jumelé.
- `voicewake.changed` : la configuration des déclencheurs de mot d'activation a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie de
  l'approbation exec.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie de l'approbation plugin.

### Méthodes d'assistance pour nœuds

- Les nœuds peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de Skills
  pour les vérifications d'auto-autorisation.

### Méthodes d'assistance pour operator

- Les operators peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d'outils runtime pour un
  agent. La réponse inclut des outils groupés et des métadonnées de provenance :
  - `source`: `core` ou `plugin`
  - `pluginId`: plugin propriétaire lorsque `source="plugin"`
  - `optional`: si un outil de plugin est facultatif
- Les operators peuvent appeler `tools.effective` (`operator.read`) pour récupérer l'inventaire d'outils effectif
  à l'exécution pour une session.
  - `sessionKey` est obligatoire.
  - La gateway dérive le contexte d'exécution approuvé côté serveur au lieu d'accepter un
    contexte d'authentification ou de livraison fourni par l'appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser à cet instant,
    y compris les outils core, plugin et canal.
- Les operators peuvent appeler `skills.status` (`operator.read`) pour récupérer l'inventaire visible
  des Skills pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l'espace de travail de l'agent par défaut.
  - La réponse inclut l'éligibilité, les exigences manquantes, les vérifications de configuration et
    les options d'installation assainies sans exposer les valeurs brutes de secrets.
- Les operators peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour les métadonnées de découverte
  ClawHub.
- Les operators peuvent appeler `skills.install` (`operator.admin`) selon deux modes :
  - mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de Skill dans le répertoire `skills/` de l'espace de travail de l'agent par défaut.
  - mode d'installation gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    exécute une action déclarée `metadata.openclaw.install` sur l'hôte gateway.
- Les operators peuvent appeler `skills.update` (`operator.admin`) selon deux modes :
  - le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    l'espace de travail de l'agent par défaut.
  - le mode configuration applique un patch aux valeurs `skills.entries.<skillKey>` telles que `enabled`,
    `apiKey` et `env`.

## Approbations exec

- Lorsqu'une requête exec nécessite une approbation, la gateway diffuse `exec.approval.requested`.
- Les clients operator résolvent cela en appelant `exec.approval.resolve` (nécessite la portée `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les requêtes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels transférés `node.invoke system.run` réutilisent ce
  `systemRunPlan` canonique comme contexte faisant autorité pour la commande/le cwd/la session.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre la préparation et le transfert final approuvé `system.run`, la
  gateway rejette l'exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison d'agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve un comportement strict : les cibles de livraison non résolues ou internes seulement renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise un repli vers une exécution limitée à la session lorsqu'aucune route de livraison externe résoluble ne peut être trouvée (par exemple sessions internes/webchat ou configurations multicanales ambiguës).

## Versionnement

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir de définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Authentification

- L'authentification gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d'authentification configuré.
- Les modes portant une identité comme Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"`
  hors local loopback satisfont la vérification d'authentification connect à partir
  des en-têtes de requête au lieu de `connect.params.auth.*`.
- L'entrée privée `gateway.auth.mode: "none"` ignore entièrement l'authentification connect par secret partagé ; n'exposez pas ce mode sur une entrée publique/non fiable.
- Après jumelage, la gateway émet un **jeton d'appareil** limité au rôle + aux portées de la connexion.
  Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être persisté par le client pour les connexions futures.
- Les clients doivent persister le `hello-ok.auth.deviceToken` principal après toute connexion réussie.
- Une reconnexion avec ce jeton d'appareil **stocké** doit aussi réutiliser l'ensemble de portées approuvées stocké pour ce jeton. Cela préserve l'accès lecture/sonde/statut déjà accordé et évite que les reconnexions ne se réduisent silencieusement à une portée implicite admin seulement.
- L'ordre normal de priorité d'authentification à la connexion est : jeton/mot de passe partagé explicite d'abord, puis `deviceToken` explicite, puis jeton par appareil stocké, puis jeton d'amorçage.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des jetons de transfert d'amorçage.
  Ne les persistez que lorsque la connexion a utilisé l'authentification d'amorçage sur un transport approuvé
  tel que `wss://` ou local loopback/jumelage local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites, cet ensemble de portées demandé par l'appelant reste faisant autorité ; les portées en cache ne sont réutilisées que lorsque le client réutilise le jeton par appareil stocké.
- Les jetons d'appareil peuvent être tournés/révoqués via `device.token.rotate` et
  `device.token.revoke` (nécessite la portée `operator.pairing`).
- L'émission/la rotation de jeton reste limitée à l'ensemble de rôles approuvés enregistré dans
  l'entrée de jumelage de cet appareil ; la rotation d'un jeton ne peut pas étendre l'appareil vers un
  rôle que l'approbation de jumelage n'a jamais accordé.
- Pour les sessions avec jeton d'appareil jumelé, la gestion d'appareil est limitée à soi-même sauf si l'appelant dispose aussi de `operator.admin` : les appelants non admin ne peuvent supprimer/révoquer/faire tourner que **leur propre** entrée d'appareil.
- `device.token.rotate` vérifie également l'ensemble de portées operator demandé par rapport aux
  portées actuelles de la session appelante. Les appelants non admin ne peuvent pas faire tourner un
  jeton vers un ensemble de portées operator plus large que celui qu'ils détiennent déjà.
- Les échecs d'authentification incluent `error.details.code` plus des indices de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients approuvés peuvent tenter une nouvelle tentative délimitée avec un jeton par appareil mis en cache.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles automatiques de reconnexion et afficher des consignes d'action à l'opérateur.

## Identité d'appareil + jumelage

- Les nœuds doivent inclure une identité d'appareil stable (`device.id`) dérivée de l'empreinte d'une
  paire de clés.
- Les gateways émettent des jetons par appareil + rôle.
- Des approbations de jumelage sont nécessaires pour les nouveaux IDs d'appareil, sauf si l'auto-approbation locale est activée.
- L'auto-approbation de jumelage est centrée sur les connexions directes local loopback.
- OpenClaw dispose aussi d'un chemin étroit d'auto-connexion backend/locale au conteneur pour des flux d'assistance à secret partagé approuvés.
- Les connexions tailnet ou LAN du même hôte sont toujours traitées comme distantes pour le jumelage et nécessitent une approbation.
- Tous les clients WS doivent inclure l'identité `device` pendant `connect` (operator + node).
  L'interface de contrôle ne peut l'omettre que dans ces modes :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée localhost uniquement.
  - authentification operator d'interface de contrôle réussie avec `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (solution de dernier recours, grave dégradation de sécurité).
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration de l'authentification d'appareil

Pour les clients hérités qui utilisent encore le comportement de signature pré-défi, `connect` renvoie désormais
des codes de détail `DEVICE_AUTH_*` sous `error.details.code` avec un `error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/incorrect. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L'horodatage signé est hors du décalage autorisé. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l'empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/canonicalisation de la clé publique a échoué. |

Cible de migration :

- Toujours attendre `connect.challenge`.
- Signer la charge utile v2 qui inclut le nonce serveur.
- Envoyer le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs device/client/role/scopes/token/nonce.
- Les signatures héritées `v2` restent acceptées pour la compatibilité, mais l'épinglage des métadonnées d'appareil jumelé continue de contrôler la politique de commande à la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent éventuellement épingler l'empreinte du certificat gateway (voir la configuration `gateway.tls`
  plus `gateway.remote.tlsFingerprint` ou l'option CLI `--tls-fingerprint`).

## Portée

Ce protocole expose **l'API complète de la gateway** (status, canaux, modèles, chat,
agent, sessions, nœuds, approbations, etc.). La surface exacte est définie par les
schémas TypeBox dans `src/gateway/protocol/schema.ts`.
