---
read_when:
    - Ajout ou modification d’intégrations CLI externes
    - Débogage des adaptateurs RPC (`signal-cli`, `imsg`)
summary: Adaptateurs RPC pour les CLI externes (`signal-cli`, `imsg` hérité) et modèles Gateway
title: Adaptateurs RPC
x-i18n:
    generated_at: "2026-04-24T07:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw intègre des CLI externes via JSON-RPC. Deux modèles sont utilisés aujourd’hui.

## Modèle A : daemon HTTP (`signal-cli`)

- `signal-cli` s’exécute comme daemon avec JSON-RPC sur HTTP.
- Le flux d’événements est en SSE (`/api/v1/events`).
- Sonde de santé : `/api/v1/check`.
- OpenClaw possède le cycle de vie lorsque `channels.signal.autoStart=true`.

Voir [Signal](/fr/channels/signal) pour la configuration et les points de terminaison.

## Modèle B : processus enfant stdio (hérité : `imsg`)

> **Remarque :** pour les nouvelles configurations iMessage, utilisez plutôt [BlueBubbles](/fr/channels/bluebubbles).

- OpenClaw lance `imsg rpc` comme processus enfant (intégration iMessage héritée).
- JSON-RPC est délimité par ligne sur stdin/stdout (un objet JSON par ligne).
- Pas de port TCP, pas de daemon requis.

Méthodes cœur utilisées :

- `watch.subscribe` → notifications (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonde/diagnostics)

Voir [iMessage](/fr/channels/imessage) pour la configuration héritée et l’adressage (`chat_id` préféré).

## Recommandations pour les adaptateurs

- Le Gateway possède le processus (démarrage/arrêt liés au cycle de vie du fournisseur).
- Gardez les clients RPC résilients : délais d’expiration, redémarrage en cas de sortie.
- Préférez les identifiants stables (par ex. `chat_id`) aux chaînes d’affichage.

## Lié

- [Protocole Gateway](/fr/gateway/protocol)
