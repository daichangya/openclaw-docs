---
read_when:
    - Externe CLI-Integrationen hinzufügen oder ändern
    - Fehlerbehebung bei RPC-Adaptern (signal-cli, imsg)
summary: RPC-Adapter für externe CLI-Tools (signal-cli, altes imsg) und Gateway-Muster
title: RPC-Adapter
x-i18n:
    generated_at: "2026-04-05T12:54:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# RPC-Adapter

OpenClaw integriert externe CLI-Tools über JSON-RPC. Derzeit werden zwei Muster verwendet.

## Muster A: HTTP-Daemon (`signal-cli`)

- `signal-cli` läuft als Daemon mit JSON-RPC über HTTP.
- Ereignis-Stream ist SSE (`/api/v1/events`).
- Health-Check: `/api/v1/check`.
- OpenClaw verwaltet den Lebenszyklus, wenn `channels.signal.autoStart=true`.

Einrichtung und Endpunkte finden Sie unter [Signal](/de/channels/signal).

## Muster B: Child-Prozess über stdio (alt: imsg)

> **Hinweis:** Für neue iMessage-Setups verwenden Sie stattdessen [BlueBubbles](/de/channels/bluebubbles).

- OpenClaw startet `imsg rpc` als Child-Prozess (alte iMessage-Integration).
- JSON-RPC ist zeilengetrennt über stdin/stdout (ein JSON-Objekt pro Zeile).
- Kein TCP-Port, kein Daemon erforderlich.

Verwendete Kernmethoden:

- `watch.subscribe` → Benachrichtigungen (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (Probe/Diagnose)

Die alte Einrichtung und Adressierung (`chat_id` bevorzugt) finden Sie unter [iMessage](/de/channels/imessage).

## Richtlinien für Adapter

- Das Gateway verwaltet den Prozess (Start/Stopp an den Lebenszyklus des Providers gekoppelt).
- Halten Sie RPC-Clients robust: Timeouts, Neustart nach Beendigung.
- Bevorzugen Sie stabile IDs (z. B. `chat_id`) gegenüber Anzeigezeichenfolgen.
