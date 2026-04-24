---
read_when:
    - Externe CLI-Integrationen hinzufügen oder ändern
    - RPC-Adapter debuggen (signal-cli, imsg)
summary: RPC-Adapter für externe CLIs (signal-cli, Legacy-imsg) und Gateway-Muster
title: RPC-Adapter
x-i18n:
    generated_at: "2026-04-24T06:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw integriert externe CLIs über JSON-RPC. Heute werden zwei Muster verwendet.

## Muster A: HTTP-Daemon (signal-cli)

- `signal-cli` läuft als Daemon mit JSON-RPC über HTTP.
- Ereignis-Stream ist SSE (`/api/v1/events`).
- Health-Probe: `/api/v1/check`.
- OpenClaw verwaltet den Lebenszyklus, wenn `channels.signal.autoStart=true`.

Siehe [Signal](/de/channels/signal) für Einrichtung und Endpunkte.

## Muster B: stdio-Kindprozess (Legacy: imsg)

> **Hinweis:** Für neue iMessage-Setups verwenden Sie stattdessen [BlueBubbles](/de/channels/bluebubbles).

- OpenClaw startet `imsg rpc` als Kindprozess (Legacy-iMessage-Integration).
- JSON-RPC ist zeilenbegrenzt über stdin/stdout (ein JSON-Objekt pro Zeile).
- Kein TCP-Port, kein Daemon erforderlich.

Verwendete Core-Methoden:

- `watch.subscribe` → Benachrichtigungen (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (Probe/Diagnose)

Siehe [iMessage](/de/channels/imessage) für die Legacy-Einrichtung und Adressierung (`chat_id` bevorzugt).

## Richtlinien für Adapter

- Das Gateway verwaltet den Prozess (Start/Stop an den Lebenszyklus des Anbieters gebunden).
- Halten Sie RPC-Clients robust: Timeouts, Neustart bei Exit.
- Bevorzugen Sie stabile IDs (z. B. `chat_id`) gegenüber Anzeigenamen.

## Verwandt

- [Gateway-Protokoll](/de/gateway/protocol)
