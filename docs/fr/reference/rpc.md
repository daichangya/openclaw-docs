---
read_when:
    - Ajouter ou modifier des intégrations CLI externes
    - Déboguer des adaptateurs RPC (signal-cli, imsg)
summary: Adaptateurs RPC pour les CLI externes (signal-cli, ancien imsg) et modèles gateway
title: Adaptateurs RPC
x-i18n:
    generated_at: "2026-04-05T12:53:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# Adaptateurs RPC

OpenClaw intègre des CLI externes via JSON-RPC. Deux modèles sont utilisés aujourd’hui.

## Modèle A : démon HTTP (signal-cli)

- `signal-cli` s’exécute comme un démon avec JSON-RPC sur HTTP.
- Le flux d’événements utilise SSE (`/api/v1/events`).
- Sonde de santé : `/api/v1/check`.
- OpenClaw possède le cycle de vie lorsque `channels.signal.autoStart=true`.

Voir [Signal](/channels/signal) pour la configuration et les points de terminaison.

## Modèle B : processus enfant stdio (historique : imsg)

> **Note :** pour les nouvelles configurations iMessage, utilisez plutôt [BlueBubbles](/channels/bluebubbles).

- OpenClaw lance `imsg rpc` comme processus enfant (ancienne intégration iMessage).
- JSON-RPC est délimité par ligne sur stdin/stdout (un objet JSON par ligne).
- Aucun port TCP, aucun démon requis.

Méthodes cœur utilisées :

- `watch.subscribe` → notifications (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (sonde/diagnostic)

Voir [iMessage](/channels/imessage) pour la configuration historique et l’adressage (`chat_id` préférable).

## Recommandations pour les adaptateurs

- La Gateway possède le processus (start/stop liés au cycle de vie du provider).
- Gardez les clients RPC robustes : délais d’attente, redémarrage à la sortie.
- Préférez des ID stables (par ex. `chat_id`) aux chaînes d’affichage.
