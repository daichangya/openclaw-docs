---
read_when:
    - Verhalten oder Standardwerte für Voice Wake Words ändern
    - Neue Node-Plattformen hinzufügen, die Wake-Word-Synchronisierung benötigen
summary: Globale Wake-Words für Sprache (Gateway-eigen) und wie sie über Nodes hinweg synchronisiert werden
title: Voice Wake
x-i18n:
    generated_at: "2026-04-24T06:46:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw behandelt **Wake-Words als eine einzige globale Liste**, die dem **Gateway** gehört.

- Es gibt **keine benutzerdefinierten Wake-Words pro Node**.
- **Jede Node/App-UI kann** die Liste bearbeiten; Änderungen werden vom Gateway dauerhaft gespeichert und an alle übertragen.
- macOS und iOS behalten lokale Schalter **Voice Wake aktiviert/deaktiviert** bei (lokale UX und Berechtigungen unterscheiden sich).
- Android lässt Voice Wake derzeit deaktiviert und verwendet im Voice-Tab einen manuellen Mikrofon-Ablauf.

## Speicherung (Gateway-Host)

Wake-Words werden auf dem Gateway-Rechner gespeichert unter:

- `~/.openclaw/settings/voicewake.json`

Struktur:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokoll

### Methoden

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` mit Parametern `{ triggers: string[] }` → `{ triggers: string[] }`

Hinweise:

- Trigger werden normalisiert (getrimmt, leere Einträge entfernt). Leere Listen fallen auf Standardwerte zurück.
- Aus Sicherheitsgründen werden Limits erzwungen (Obergrenzen für Anzahl/Länge).

### Ereignisse

- `voicewake.changed` mit Payload `{ triggers: string[] }`

Wer es empfängt:

- Alle WebSocket-Clients (macOS-App, WebChat usw.)
- Alle verbundenen Nodes (iOS/Android) sowie zusätzlich beim Verbinden einer Node als initialer Push des „aktuellen Zustands“.

## Client-Verhalten

### macOS-App

- Verwendet die globale Liste, um Trigger von `VoiceWakeRuntime` zu steuern.
- Das Bearbeiten von „Trigger words“ in den Voice-Wake-Einstellungen ruft `voicewake.set` auf und verlässt sich dann auf die Übertragung, um andere Clients synchron zu halten.

### iOS-Node

- Verwendet die globale Liste für die Trigger-Erkennung von `VoiceWakeManager`.
- Das Bearbeiten der Wake-Words in den Einstellungen ruft `voicewake.set` auf (über das Gateway-WS) und hält gleichzeitig die lokale Wake-Word-Erkennung reaktionsfähig.

### Android-Node

- Voice Wake ist derzeit in Android-Laufzeit/Einstellungen deaktiviert.
- Android-Sprache verwendet stattdessen manuelle Mikrofonaufnahme im Voice-Tab statt Wake-Word-Triggern.

## Verwandt

- [Talk mode](/de/nodes/talk)
- [Audio and voice notes](/de/nodes/audio)
- [Media understanding](/de/nodes/media-understanding)
