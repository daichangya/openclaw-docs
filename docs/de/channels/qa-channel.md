---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Testlauf ein
    - Sie benötigen die gebündelte `qa-channel`-Konfigurationsoberfläche
    - Sie arbeiten iterativ an einer End-to-End-QA-Automatisierung
summary: Synthetisches Slack-ähnliches Channel-Plugin für deterministische OpenClaw-QA-Szenarien
title: QA-Channel
x-i18n:
    generated_at: "2026-04-07T06:13:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65c2c908d3ec27c827087616c4ea278f10686810091058321ff26f68296a1782
    source_path: channels/qa-channel.md
    workflow: 15
---

# QA-Channel

`qa-channel` ist ein gebündelter synthetischer Nachrichtentransport für automatisierte OpenClaw-QA.

Er ist kein Produktions-Channel. Er dient dazu, dieselbe Channel-Plugin-Grenze zu nutzen
wie reale Transporte, während der Zustand deterministisch und vollständig
prüfbar bleibt.

## Was er heute macht

- Slack-ähnliche Zielgrammatik:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- HTTP-gestützter synthetischer Bus für:
  - Einspeisung eingehender Nachrichten
  - Erfassung ausgehender Transkripte
  - Thread-Erstellung
  - Reaktionen
  - Bearbeitungen
  - Löschungen
  - Such- und Leseaktionen
- Gebündelter hostseitiger Self-Check-Runner, der einen Markdown-Bericht schreibt

## Konfiguration

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Unterstützte Kontoschlüssel:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Runner

Aktueller vertikaler Ausschnitt:

```bash
pnpm qa:e2e
```

Dies wird jetzt über die gebündelte `qa-lab`-Erweiterung geleitet. Sie startet den
QA-Bus im Repository, bootet den gebündelten `qa-channel`-Runtime-Ausschnitt, führt einen deterministischen
Self-Check aus und schreibt einen Markdown-Bericht unter `.artifacts/qa-e2e/`.

Private Debugger-Benutzeroberfläche:

```bash
pnpm qa:lab:up
```

Dieser einzelne Befehl baut die QA-Site, startet den Docker-gestützten Gateway- + QA-Lab-
Stack und gibt die QA-Lab-URL aus. Auf dieser Site können Sie Szenarien auswählen, die
Modell-Lane wählen, einzelne Läufe starten und die Ergebnisse live verfolgen.

Vollständige Repository-gestützte QA-Suite:

```bash
pnpm openclaw qa suite
```

Dadurch wird der private QA-Debugger unter einer lokalen URL gestartet, getrennt vom
ausgelieferten Control-UI-Bundle.

## Umfang

Der aktuelle Umfang ist bewusst eng gefasst:

- Bus + Plugin-Transport
- Threaded-Routing-Grammatik
- Channel-eigene Nachrichtenaktionen
- Markdown-Berichterstellung
- Docker-gestützte QA-Site mit Laufsteuerungen

Folgearbeiten werden hinzufügen:

- Ausführung einer Provider-/Modell-Matrix
- umfassendere Szenarioerkennung
- später OpenClaw-native Orchestrierung
