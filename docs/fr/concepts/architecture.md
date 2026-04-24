---
read_when:
    - Travail sur le protocole gateway, les clients ou les transports
summary: Architecture du gateway WebSocket, composants et flux client
title: Architecture du Gateway
x-i18n:
    generated_at: "2026-04-24T07:06:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91c553489da18b6ad83fc860014f5bfb758334e9789cb7893d4d00f81c650f02
    source_path: concepts/architecture.md
    workflow: 15
---

## Aperçu

- Un seul **Gateway** longue durée possède toutes les surfaces de messagerie (WhatsApp via
  Baileys, Telegram via grammY, Slack, Discord, Signal, iMessage, WebChat).
- Les clients du plan de contrôle (app macOS, CLI, interface web, automatisations) se connectent au
  Gateway via **WebSocket** sur l’hôte de liaison configuré (par défaut
  `127.0.0.1:18789`).
- Les **Node** (macOS/iOS/Android/sans interface) se connectent également via **WebSocket**, mais
  déclarent `role: node` avec des caps/commandes explicites.
- Un Gateway par hôte ; c’est le seul endroit qui ouvre une session WhatsApp.
- L’**hôte canvas** est servi par le serveur HTTP du Gateway sous :
  - `/__openclaw__/canvas/` (HTML/CSS/JS modifiable par l’agent)
  - `/__openclaw__/a2ui/` (hôte A2UI)
    Il utilise le même port que le Gateway (par défaut `18789`).

## Composants et flux

### Gateway (daemon)

- Maintient les connexions fournisseur.
- Expose une API WS typée (requêtes, réponses, événements push serveur).
- Valide les trames entrantes par rapport au schéma JSON.
- Émet des événements tels que `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Clients (app Mac / CLI / administration web)

- Une connexion WS par client.
- Envoient des requêtes (`health`, `status`, `send`, `agent`, `system-presence`).
- S’abonnent aux événements (`tick`, `agent`, `presence`, `shutdown`).

### Node (macOS / iOS / Android / sans interface)

- Se connectent au **même serveur WS** avec `role: node`.
- Fournissent une identité d’appareil dans `connect` ; l’appairage est **basé sur l’appareil** (rôle `node`) et
  l’approbation est conservée dans le stockage d’appairage des appareils.
- Exposent des commandes telles que `canvas.*`, `camera.*`, `screen.record`, `location.get`.

Détails du protocole :

- [Protocole Gateway](/fr/gateway/protocol)

### WebChat

- Interface statique qui utilise l’API WS du Gateway pour l’historique du chat et les envois.
- Dans les configurations distantes, se connecte via le même tunnel SSH/Tailscale que les autres
  clients.

## Cycle de vie de la connexion (client unique)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: or res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## Protocole sur le fil (résumé)

- Transport : WebSocket, trames texte avec charge utile JSON.
- La première trame **doit** être `connect`.
- Après la poignée de main :
  - Requêtes : `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Événements : `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` sont des métadonnées de découverte, et non
  un dump généré de toutes les routes d’assistance appelables.
- L’authentification par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification gateway configuré.
- Les modes porteurs d’identité tels que Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou le mode non-loopback
  `gateway.auth.mode: "trusted-proxy"` satisfont l’authentification à partir des en-têtes de requête
  au lieu de `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` désactive entièrement l’authentification par secret partagé ;
  gardez ce mode désactivé sur une entrée publique ou non fiable.
- Des clés d’idempotence sont requises pour les méthodes avec effets de bord (`send`, `agent`) afin de
  pouvoir réessayer en toute sécurité ; le serveur conserve un cache de déduplication de courte durée.
- Les Node doivent inclure `role: "node"` ainsi que les caps/commandes/permissions dans `connect`.

## Appairage + confiance locale

- Tous les clients WS (opérateurs + Node) incluent une **identité d’appareil** dans `connect`.
- Les nouveaux identifiants d’appareil nécessitent une approbation d’appairage ; le Gateway émet un **jeton d’appareil**
  pour les connexions suivantes.
- Les connexions directes au loopback local peuvent être approuvées automatiquement pour maintenir une expérience fluide sur le même hôte.
- OpenClaw dispose également d’un chemin d’auto-connexion local au backend/conteneur, étroitement limité, pour les flux d’assistance à secret partagé de confiance.
- Les connexions tailnet et LAN, y compris les liaisons tailnet sur le même hôte, exigent toujours une approbation explicite d’appairage.
- Toutes les connexions doivent signer le nonce `connect.challenge`.
- La charge utile de signature `v3` lie également `platform` + `deviceFamily` ; le gateway
  épingle les métadonnées appairées lors de la reconnexion et exige un appairage de réparation en cas de changement de métadonnées.
- Les connexions **non locales** nécessitent toujours une approbation explicite.
- L’authentification du Gateway (`gateway.auth.*`) s’applique toujours à **toutes** les connexions, locales ou
  distantes.

Détails : [Protocole Gateway](/fr/gateway/protocol), [Appairage](/fr/channels/pairing),
[Sécurité](/fr/gateway/security).

## Typage du protocole et génération de code

- Les schémas TypeBox définissent le protocole.
- Le schéma JSON est généré à partir de ces schémas.
- Les modèles Swift sont générés à partir du schéma JSON.

## Accès distant

- Recommandé : Tailscale ou VPN.
- Alternative : tunnel SSH

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```

- La même poignée de main + le même jeton d’authentification s’appliquent sur le tunnel.
- TLS + épinglage facultatif peuvent être activés pour WS dans les configurations distantes.

## Instantané d’exploitation

- Démarrage : `openclaw gateway` (au premier plan, journaux vers stdout).
- Santé : `health` via WS (également inclus dans `hello-ok`).
- Supervision : launchd/systemd pour le redémarrage automatique.

## Invariants

- Exactement un Gateway contrôle une seule session Baileys par hôte.
- La poignée de main est obligatoire ; toute première trame non JSON ou différente de `connect` entraîne une fermeture forcée.
- Les événements ne sont pas rejoués ; les clients doivent actualiser en cas de trou.

## Lié

- [Boucle d’agent](/fr/concepts/agent-loop) — cycle détaillé d’exécution de l’agent
- [Protocole Gateway](/fr/gateway/protocol) — contrat du protocole WebSocket
- [File d’attente](/fr/concepts/queue) — file de commandes et concurrence
- [Sécurité](/fr/gateway/security) — modèle de confiance et durcissement
