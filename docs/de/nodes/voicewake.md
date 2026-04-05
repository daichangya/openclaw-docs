---
read_when:
    - Ändern des Verhaltens oder der Standardwerte von Voice-Wake-Wörtern
    - Hinzufügen neuer Node-Plattformen, die eine Synchronisierung der Wake-Wörter benötigen
summary: Globale Voice-Wake-Wörter (vom Gateway verwaltet) und wie sie zwischen Nodes synchronisiert werden
title: Voice Wake
x-i18n:
    generated_at: "2026-04-05T12:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# Voice Wake (Globale Wake-Wörter)

OpenClaw behandelt **Wake-Wörter als eine einzige globale Liste**, die dem **Gateway** gehört.

- Es gibt **keine benutzerdefinierten Wake-Wörter pro Node**.
- **Jede Node-/App-UI kann** die Liste bearbeiten; Änderungen werden vom Gateway gespeichert und an alle übertragen.
- macOS und iOS behalten lokale Schalter für **Voice Wake aktiviert/deaktiviert** bei (lokale UX + Berechtigungen unterscheiden sich).
- Android lässt Voice Wake derzeit deaktiviert und verwendet im Tab „Voice“ einen manuellen Mikrofonablauf.

## Speicherung (Gateway-Host)

Wake-Wörter werden auf dem Gateway-Rechner hier gespeichert:

- `~/.openclaw/settings/voicewake.json`

Form:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokoll

### Methoden

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` mit Parametern `{ triggers: string[] }` → `{ triggers: string[] }`

Hinweise:

- Trigger werden normalisiert (getrimmt, leere Einträge entfernt). Leere Listen fallen auf Standardwerte zurück.
- Limits werden aus Sicherheitsgründen erzwungen (Obergrenzen für Anzahl/Länge).

### Ereignisse

- `voicewake.changed` Payload `{ triggers: string[] }`

Wer sie erhält:

- Alle WebSocket-Clients (macOS-App, WebChat usw.)
- Alle verbundenen Nodes (iOS/Android) sowie beim Verbinden einer Node zusätzlich als initialer Push des „aktuellen Zustands“.

## Client-Verhalten

### macOS-App

- Verwendet die globale Liste, um Trigger in `VoiceWakeRuntime` zu steuern.
- Das Bearbeiten von „Trigger words“ in den Voice-Wake-Einstellungen ruft `voicewake.set` auf und verlässt sich dann auf die Übertragung, um andere Clients synchron zu halten.

### iOS-Node

- Verwendet die globale Liste für die Trigger-Erkennung in `VoiceWakeManager`.
- Das Bearbeiten der Wake-Wörter in den Einstellungen ruft `voicewake.set` auf (über das Gateway-WS) und hält außerdem die lokale Wake-Wort-Erkennung reaktionsfähig.

### Android-Node

- Voice Wake ist derzeit in Android-Runtime/-Einstellungen deaktiviert.
- Android-Voice verwendet stattdessen im Tab „Voice“ eine manuelle Mikrofonerfassung statt Wake-Wort-Triggern.
