---
read_when:
    - Implémenter ou mettre à jour des clients WS Gateway
    - Déboguer des incompatibilités de protocole ou des échecs de connexion
    - Régénérer le schéma/les modèles du protocole
summary: 'Protocole WebSocket Gateway : handshake, trames, versionnement'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-04-24T07:11:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocole Gateway (WebSocket)

Le protocole WS du Gateway est le **plan de contrôle unique + transport node** pour
OpenClaw. Tous les clients (CLI, interface web, application macOS, nodes iOS/Android, nodes
headless) se connectent via WebSocket et déclarent leur **rôle** + **périmètre** au
moment du handshake.

## Transport

- WebSocket, trames texte avec charges utiles JSON.
- La première trame **doit** être une requête `connect`.
- Les trames pré-connexion sont plafonnées à 64 KiB. Après un handshake réussi, les clients
  doivent respecter les limites `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Lorsque les diagnostics sont activés,
  les trames entrantes surdimensionnées et les buffers sortants lents émettent des événements
  `payload.large` avant que le gateway ne ferme ou n’abandonne la trame concernée. Ces événements conservent
  les tailles, limites, surfaces et codes de raison sûrs. Ils ne conservent pas le corps du message,
  le contenu des pièces jointes, le corps brut de la trame, les tokens, les cookies ou les valeurs secrètes.

## Handshake (connect)

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
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` et `policy` sont tous requis par le schéma
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` est facultatif. `auth`
rapporte le rôle/les périmètres négociés lorsqu’ils sont disponibles, et inclut `deviceToken`
lorsque le gateway en émet un.

Lorsqu’aucun jeton d’appareil n’est émis, `hello-ok.auth` peut quand même rapporter les
autorisations négociées :

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Lorsqu’un jeton d’appareil est émis, `hello-ok` inclut aussi :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Pendant le transfert de bootstrap de confiance, `hello-ok.auth` peut aussi inclure des entrées de rôle supplémentaires bornées dans `deviceTokens` :

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

Pour le flux de bootstrap node/operator intégré, le jeton principal du node reste
`scopes: []` et tout jeton opérateur transféré reste borné à la liste blanche
de bootstrap de l’opérateur (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de périmètre de bootstrap restent
préfixées par le rôle : les entrées opérateur ne satisfont que les requêtes opérateur, et les rôles non opérateur
ont toujours besoin de périmètres sous leur propre préfixe de rôle.

### Exemple node

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

- **Request** : `{type:"req", id, method, params}`
- **Response** : `{type:"res", id, ok, payload|error}`
- **Event** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes avec effets de bord exigent des **clés d’idempotence** (voir schéma).

## Rôles + périmètres

### Rôles

- `operator` = client du plan de contrôle (CLI/interface/utilisation automatisée).
- `node` = hôte de capacités (camera/screen/canvas/system.run).

### Périmètres (operator)

Périmètres courants :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` exige `operator.talk.secrets`
(ou `operator.admin`).

Les méthodes RPC gateway enregistrées par un Plugin peuvent demander leur propre périmètre operator, mais
les préfixes admin cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) se résolvent toujours en `operator.admin`.

Le périmètre de méthode n’est que le premier contrôle. Certaines commandes slash atteintes via
`chat.send` appliquent des vérifications plus strictes au niveau de la commande en plus. Par exemple, les écritures persistantes
`/config set` et `/config unset` exigent `operator.admin`.

`node.pair.approve` a aussi une vérification de périmètre supplémentaire au moment de l’approbation, en plus du
périmètre de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec des commandes node sans exécution : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Les nodes déclarent des revendications de capacité au moment de la connexion :

- `caps` : catégories de capacités de haut niveau.
- `commands` : liste blanche de commandes pour l’invocation.
- `permissions` : bascules granulaires (par ex. `screen.record`, `camera.capture`).

Le Gateway traite ces éléments comme des **revendications** et applique des listes blanches côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les interfaces puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **operator** et **node**.

## Délimitation des événements de diffusion

Les événements de diffusion WebSocket poussés par le serveur sont protégés par périmètre afin que les sessions limitées à l’appairage ou réservées au node ne reçoivent pas passivement le contenu des sessions.

- Les **trames de chat, d’agent et de résultat d’outil** (y compris les événements `agent` diffusés en streaming et les résultats d’appel d’outil) exigent au moins `operator.read`. Les sessions sans `operator.read` ignorent complètement ces trames.
- Les **diffusions `plugin.*` définies par des plugins** sont protégées par `operator.write` ou `operator.admin`, selon la manière dont le Plugin les a enregistrées.
- Les **événements d’état et de transport** (`heartbeat`, `presence`, `tick`, cycle de vie de connexion/déconnexion, etc.) restent sans restriction afin que l’état du transport reste observable pour toute session authentifiée.
- Les **familles d’événements de diffusion inconnues** sont protégées par périmètre par défaut (échec sécurisé par défaut) sauf si un gestionnaire enregistré les assouplit explicitement.

Chaque connexion cliente conserve son propre numéro de séquence par client afin que les diffusions préservent un ordre monotone sur cette socket même lorsque différents clients voient des sous-ensembles filtrés par périmètre différents du flux d’événements.

## Familles courantes de méthodes RPC

La surface WS publique est plus large que les exemples de handshake/authentification ci-dessus. Ceci
n’est pas un dump généré — `hello-ok.features.methods` est une liste de
discovery conservatrice construite à partir de `src/gateway/server-methods-list.ts` plus des exportations
de méthodes de plugin/canal chargées. Traitez-la comme de la discovery de fonctionnalités, pas comme une énumération complète de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Système et identité">
    - `health` renvoie l’instantané de santé du gateway mis en cache ou fraîchement sondé.
    - `diagnostics.stability` renvoie l’enregistreur borné récent de stabilité diagnostique. Il conserve des métadonnées opérationnelles telles que noms d’événements, décomptes, tailles en octets, mesures mémoire, état de file/session, noms de canal/plugin et ID de session. Il ne conserve pas le texte du chat, les corps de webhook, les sorties d’outils, les corps bruts de requête ou de réponse, les tokens, les cookies ou les valeurs secrètes. Le périmètre operator read est requis.
    - `status` renvoie le résumé du gateway de type `/status` ; les champs sensibles ne sont inclus que pour les clients operator avec périmètre admin.
    - `gateway.identity.get` renvoie l’identité d’appareil du gateway utilisée par les flux de relais et d’appairage.
    - `system-presence` renvoie l’instantané de présence actuel pour les appareils operator/node connectés.
    - `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte de présence.
    - `last-heartbeat` renvoie le dernier événement Heartbeat persisté.
    - `set-heartbeats` active ou désactive le traitement Heartbeat sur le gateway.
  </Accordion>

  <Accordion title="Modèles et utilisation">
    - `models.list` renvoie le catalogue de modèles autorisés à l’exécution.
    - `usage.status` renvoie les fenêtres d’utilisation fournisseur / résumés de quota restant.
    - `usage.cost` renvoie des résumés agrégés de coût d’utilisation pour une plage de dates.
    - `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings pour l’espace de travail actif de l’agent par défaut.
    - `sessions.usage` renvoie des résumés d’utilisation par session.
    - `sessions.usage.timeseries` renvoie des séries temporelles d’utilisation pour une session.
    - `sessions.usage.logs` renvoie des entrées de journal d’utilisation pour une session.
  </Accordion>

  <Accordion title="Canaux et assistants de connexion">
    - `channels.status` renvoie des résumés d’état des canaux/plugins intégrés + fournis.
    - `channels.logout` déconnecte un canal/compte spécifique lorsque le canal prend en charge la déconnexion.
    - `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web actuel compatible QR.
    - `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le canal en cas de succès.
    - `push.test` envoie une notification push APNs de test à un node iOS enregistré.
    - `voicewake.get` renvoie les déclencheurs de mot d’éveil stockés.
    - `voicewake.set` met à jour les déclencheurs de mot d’éveil et diffuse le changement.
  </Accordion>

  <Accordion title="Messagerie et journaux">
    - `send` est le RPC direct de livraison sortante pour les envois ciblés par canal/compte/fil en dehors du runner de chat.
    - `logs.tail` renvoie la fin configurée du journal de fichiers du gateway avec contrôles de curseur/limite et nombre maximal d’octets.
  </Accordion>

  <Accordion title="Talk et TTS">
    - `talk.config` renvoie la charge utile effective de configuration Talk ; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients WebChat/Control UI.
    - `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
    - `tts.status` renvoie l’état d’activation TTS, le fournisseur actif, les fournisseurs de repli et l’état de configuration du fournisseur.
    - `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
    - `tts.enable` et `tts.disable` activent/désactivent l’état des préférences TTS.
    - `tts.setProvider` met à jour le fournisseur TTS préféré.
    - `tts.convert` exécute une conversion texte-parole ponctuelle.
  </Accordion>

  <Accordion title="Secrets, configuration, mise à jour et assistant">
    - `secrets.reload` re-résout les SecretRef actifs et échange l’état secret d’exécution uniquement en cas de succès complet.
    - `secrets.resolve` résout les affectations secrètes ciblées par commande pour un ensemble commande/cible spécifique.
    - `config.get` renvoie l’instantané et le hash de la configuration actuelle.
    - `config.set` écrit une charge utile de configuration validée.
    - `config.patch` fusionne une mise à jour partielle de configuration.
    - `config.apply` valide + remplace la charge utile complète de configuration.
    - `config.schema` renvoie la charge utile live du schéma de configuration utilisée par Control UI et l’outillage CLI : schéma, `uiHints`, version et métadonnées de génération, y compris les métadonnées de schéma de plugin + canal lorsque l’exécution peut les charger. Le schéma inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés et textes d’aide utilisés par l’interface, y compris les branches de composition d’objet imbriqué, joker, élément de tableau et `anyOf` / `oneOf` / `allOf` lorsque la documentation de champ correspondante existe.
    - `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un chemin de configuration : chemin normalisé, nœud de schéma peu profond, hint correspondant + `hintPath`, et résumés immédiats des enfants pour l’exploration UI/CLI. Les nœuds de schéma de recherche conservent la documentation visible par l’utilisateur et les champs de validation courants (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, bornes numériques/chaîne/tableau/objet, et indicateurs comme `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Les résumés enfants exposent `key`, `path` normalisé, `type`, `required`, `hasChildren`, plus le `hint` / `hintPath` correspondant.
    - `update.run` exécute le flux de mise à jour du gateway et programme un redémarrage uniquement si la mise à jour elle-même a réussi.
    - `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant d’onboarding via WS RPC.
  </Accordion>

  <Accordion title="Assistants d’agent et d’espace de travail">
    - `agents.list` renvoie les entrées d’agent configurées.
    - `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agent et le câblage de l’espace de travail.
    - `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les fichiers bootstrap d’espace de travail exposés pour un agent.
    - `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou une session.
    - `agent.wait` attend qu’une exécution se termine et renvoie l’instantané terminal lorsqu’il est disponible.
  </Accordion>

  <Accordion title="Contrôle de session">
    - `sessions.list` renvoie l’index actuel des sessions.
    - `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements aux événements de changement de session pour le client WS actuel.
    - `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les abonnements aux événements de transcription/message pour une session.
    - `sessions.preview` renvoie des aperçus bornés de transcription pour des clés de session spécifiques.
    - `sessions.resolve` résout ou canonise une cible de session.
    - `sessions.create` crée une nouvelle entrée de session.
    - `sessions.send` envoie un message dans une session existante.
    - `sessions.steer` est la variante interruption-et-orientation pour une session active.
    - `sessions.abort` interrompt le travail actif pour une session.
    - `sessions.patch` met à jour les métadonnées/remplacements de session.
    - `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la maintenance de session.
    - `sessions.get` renvoie la ligne complète stockée de la session.
    - L’exécution de chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et `chat.inject`. `chat.history` est normalisé pour l’affichage des clients UI : les balises de directive en ligne sont supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués) ainsi que les tokens de contrôle de modèle ASCII/pleine largeur ayant fuité sont supprimés, les lignes assistant composées uniquement de tokens silencieux comme exactement `NO_REPLY` / `no_reply` sont omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.
  </Accordion>

  <Accordion title="Appairage d’appareil et jetons d’appareil">
    - `device.pair.list` renvoie les appareils appairés en attente et approuvés.
    - `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les enregistrements d’appairage d’appareil.
    - `device.token.rotate` fait tourner un jeton d’appareil appairé dans les limites de rôle et de périmètre approuvées.
    - `device.token.revoke` révoque un jeton d’appareil appairé.
  </Accordion>

  <Accordion title="Appairage node, invocation et travail en attente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` et `node.pair.verify` couvrent l’appairage node et la vérification de bootstrap.
    - `node.list` et `node.describe` renvoient l’état des nodes connus/connectés.
    - `node.rename` met à jour le libellé d’un node appairé.
    - `node.invoke` transfère une commande à un node connecté.
    - `node.invoke.result` renvoie le résultat d’une requête d’invocation.
    - `node.event` transporte les événements émis par le node vers le gateway.
    - `node.canvas.capability.refresh` actualise les jetons de capacité canvas limités par périmètre.
    - `node.pending.pull` et `node.pending.ack` sont les API de file pour node connecté.
    - `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente pour les nodes hors ligne/déconnectés.
  </Accordion>

  <Accordion title="Familles d’approbations">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et `exec.approval.resolve` couvrent les requêtes ponctuelles d’approbation d’exécution ainsi que la recherche/relecture des approbations en attente.
    - `exec.approval.waitDecision` attend une approbation d’exécution en attente et renvoie la décision finale (ou `null` en cas de délai d’expiration).
    - `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique d’approbation d’exécution du gateway.
    - `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique locale d’approbation d’exécution d’un node via des commandes de relais node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les flux d’approbation définis par des plugins.
  </Accordion>

  <Accordion title="Automatisation, Skills et outils">
    - Automatisation : `wake` programme une injection de texte wake immédiate ou au prochain Heartbeat ; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gèrent le travail planifié.
    - Skills et outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Familles courantes d’événements

- `chat` : mises à jour de chat UI telles que `chat.inject` et autres
  événements de chat limités à la transcription.
- `session.message` et `session.tool` : mises à jour de transcription/flux d’événements pour une
  session abonnée.
- `sessions.changed` : l’index de session ou les métadonnées ont changé.
- `presence` : mises à jour de l’instantané de présence système.
- `tick` : événement périodique de keepalive / liveness.
- `health` : mise à jour de l’instantané de santé du gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement d’exécution/de tâche cron.
- `shutdown` : notification d’arrêt du gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie de l’appairage node.
- `node.invoke.request` : diffusion d’une requête d’invocation node.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie de l’appareil appairé.
- `voicewake.changed` : changement de configuration du déclencheur de mot d’éveil.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie de
  l’approbation d’exécution.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie de
  l’approbation de Plugin.

### Méthodes auxiliaires node

- Les nodes peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de skill
  pour les vérifications d’auto-autorisation.

### Méthodes auxiliaires operator

- Les operators peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire
  des commandes d’exécution pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle quelle surface la valeur principale `name` cible :
    - `text` renvoie le jeton principal de commande texte sans le `/` initial
    - `native` et le chemin par défaut `both` renvoient des noms natifs adaptés au fournisseur
      lorsqu’ils sont disponibles
  - `textAliases` transporte des alias slash exacts tels que `/model` et `/m`.
  - `nativeName` transporte le nom de commande natif adapté au fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que la dénomination native plus la disponibilité des commandes natives de plugin.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées de la réponse.
- Les operators peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils d’exécution pour un
  agent. La réponse inclut des outils groupés et des métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du Plugin lorsque `source="plugin"`
  - `optional` : si un outil de Plugin est facultatif
- Les operators peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire d’outils
  effectif à l’exécution pour une session.
  - `sessionKey` est requis.
  - Le gateway dérive le contexte d’exécution de confiance de la session côté serveur au lieu d’accepter
    un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser à cet instant,
    y compris les outils core, Plugin et canal.
- Les operators peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible
  des Skills pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’admissibilité, les conditions manquantes, les vérifications de configuration et
    les options d’installation assainies sans exposer de valeurs secrètes brutes.
- Les operators peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour
  les métadonnées de discovery ClawHub.
- Les operators peuvent appeler `skills.install` (`operator.admin`) dans deux modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de skill dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode installateur gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    exécute une action déclarée `metadata.openclaw.install` sur l’hôte gateway.
- Les operators peuvent appeler `skills.update` (`operator.admin`) dans deux modes :
  - Le mode ClawHub met à jour un slug suivi ou tous les installs ClawHub suivis dans
    l’espace de travail de l’agent par défaut.
  - Le mode configuration patch les valeurs `skills.entries.<skillKey>` telles que `enabled`,
    `apiKey` et `env`.

## Approbations d’exécution

- Lorsqu’une requête d’exécution nécessite une approbation, le gateway diffuse `exec.approval.requested`.
- Les clients operator résolvent cela en appelant `exec.approval.resolve` (exige le périmètre `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les requêtes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels transférés `node.invoke system.run` réutilisent ce
  `systemRunPlan` canonique comme contexte faisant autorité pour commande/cwd/session.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre la préparation et le transfert final approuvé `system.run`, le
  gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison d’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve un comportement strict : les cibles de livraison non résolues ou uniquement internes renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise un repli vers une exécution limitée à la session lorsqu’aucune route de livraison externe exploitable ne peut être résolue (par exemple sessions internes/webchat ou configurations multi-canaux ambiguës).

## Versionnement

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema/protocol-schemas.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir de définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Ces valeurs sont
stables sur le protocole v3 et constituent la base attendue pour les clients tiers.

| Constante                                 | Valeur par défaut                                    | Source                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Délai d’expiration de requête (par RPC)   | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Délai d’expiration préauth / connect-challenge | `10_000` ms                                      | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff initial de reconnexion            | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff maximal de reconnexion            | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de nouvelle tentative rapide après fermeture par jeton d’appareil | `250` ms                              | `src/gateway/client.ts`                                    |
| Délai de grâce avant `terminate()` forcé  | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Délai d’expiration par défaut de `stopAndWait()` | `1_000` ms                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalle tick par défaut (avant `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                    |
| Fermeture pour dépassement de délai tick  | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

Le serveur annonce les valeurs effectives `policy.tickIntervalMs`, `policy.maxPayload`
et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs
plutôt que les valeurs par défaut d’avant handshake.

## Authentification

- L’authentification gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes portant une identité tels que Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou le mode non-loopback
  `gateway.auth.mode: "trusted-proxy"` satisfont la vérification d’authentification connect à partir
  des en-têtes de requête au lieu de `connect.params.auth.*`.
- L’ingress privé `gateway.auth.mode: "none"` saute entièrement l’authentification connect par secret partagé ; n’exposez pas ce mode sur un ingress public/non fiable.
- Après appairage, le Gateway émet un **jeton d’appareil** limité au rôle + aux périmètres de la connexion. Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être
  persisté par le client pour les connexions futures.
- Les clients doivent persister le `hello-ok.auth.deviceToken` principal après toute
  connexion réussie.
- Se reconnecter avec ce jeton d’appareil **stocké** doit aussi réutiliser l’ensemble de périmètres approuvés stocké
  pour ce jeton. Cela préserve l’accès read/probe/status
  déjà accordé et évite de réduire silencieusement les reconnexions à un
  périmètre implicite plus étroit, limité à admin.
- Assemblage côté client de l’authentification connect (`selectConnectAuth` dans
  `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et est toujours transmis lorsqu’il est défini.
  - `auth.token` est rempli par ordre de priorité : d’abord un jeton partagé explicite,
    puis un `deviceToken` explicite, puis un jeton stocké par appareil (indexé par
    `deviceId` + `role`).
  - `auth.bootstrapToken` n’est envoyé que si aucun des éléments ci-dessus n’a résolu
    `auth.token`. Un jeton partagé ou tout jeton d’appareil résolu le supprime.
  - L’auto-promotion d’un jeton d’appareil stocké lors de l’unique nouvelle tentative
    `AUTH_TOKEN_MISMATCH` est limitée aux **points de terminaison de confiance uniquement** —
    loopback, ou `wss://` avec un `tlsFingerprint` épinglé. Le `wss://` public
    sans épinglage n’est pas admissible.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des jetons de transfert de bootstrap.
  Ne les persistez que lorsque la connexion a utilisé l’authentification bootstrap sur un transport de confiance
  tel que `wss://` ou loopback/appairage local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites, cet
  ensemble de périmètres demandé par l’appelant reste autoritaire ; les périmètres en cache ne sont
  réutilisés que lorsque le client réutilise le jeton stocké par appareil.
- Les jetons d’appareil peuvent être tournés/révoqués via `device.token.rotate` et
  `device.token.revoke` (exige le périmètre `operator.pairing`).
- L’émission/la rotation de jetons reste limitée à l’ensemble de rôles approuvé enregistré dans
  l’entrée d’appairage de cet appareil ; la rotation d’un jeton ne peut pas étendre l’appareil à un
  rôle que l’approbation d’appairage n’a jamais accordé.
- Pour les sessions à jeton d’appareil appairé, la gestion des appareils est limitée à l’appareil lui-même sauf si l’appelant a aussi `operator.admin` : les appelants non-admin ne peuvent supprimer/révoquer/faire tourner que **leur propre** entrée d’appareil.
- `device.token.rotate` vérifie aussi l’ensemble de périmètres operator demandé par rapport aux
  périmètres de la session actuelle de l’appelant. Les appelants non-admin ne peuvent pas faire tourner un jeton vers
  un ensemble de périmètres operator plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` plus des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients de confiance peuvent tenter une nouvelle tentative bornée avec un jeton stocké par appareil.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles automatiques de reconnexion et faire remonter des indications d’action opérateur.

## Identité d’appareil + appairage

- Les nodes doivent inclure une identité d’appareil stable (`device.id`) dérivée de l’empreinte d’une
  paire de clés.
- Les gateways émettent des jetons par appareil + rôle.
- Des approbations d’appairage sont requises pour les nouveaux ID d’appareil sauf si l’auto-approbation locale
  est activée.
- L’auto-approbation d’appairage est centrée sur les connexions directes locales en loopback.
- OpenClaw dispose aussi d’un chemin étroit d’auto-connexion backend/conteneur-local pour
  des flux auxiliaires de secret partagé de confiance.
- Les connexions de même hôte via tailnet ou LAN sont toujours traitées comme distantes pour l’appairage et
  exigent une approbation.
- Tous les clients WS doivent inclure l’identité `device` pendant `connect` (operator + node).
  Control UI peut l’omettre uniquement dans ces modes :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée localhost-only.
  - authentification operator réussie Control UI en `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (solution extrême, sévère dégradation de sécurité).
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration d’authentification d’appareil

Pour les clients hérités qui utilisent encore un comportement de signature d’avant challenge, `connect` renvoie maintenant
des codes de détail `DEVICE_AUTH_*` sous `error.details.code` avec un `error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/incorrect. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile signée ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est hors du décalage autorisé.  |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/canonicalization de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs device/client/role/scopes/token/nonce.
- Les signatures `v2` héritées restent acceptées pour compatibilité, mais l’épinglage des métadonnées d’appareil appairé continue de contrôler la politique de commande lors de la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent éventuellement épingler l’empreinte du certificat gateway (voir la configuration `gateway.tls`
  plus `gateway.remote.tlsFingerprint` ou la CLI `--tls-fingerprint`).

## Périmètre

Ce protocole expose l’**API complète du gateway** (statut, canaux, modèles, chat,
agent, sessions, nodes, approbations, etc.). La surface exacte est définie par les
schémas TypeBox dans `src/gateway/protocol/schema.ts`.

## Lié

- [Protocole Bridge](/fr/gateway/bridge-protocol)
- [Runbook Gateway](/fr/gateway)
