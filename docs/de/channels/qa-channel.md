---
read_when:
    - Sie binden den synthetischen QA-Transport in einen lokalen oder CI-Testlauf ein
    - Sie benötigen die Konfigurationsoberfläche des gebündelten qa-channel
    - Sie arbeiten an der Ende-zu-Ende-QA-Automatisierung iteratively
summary: Synthetisches Slack-ähnliches Channel-Plugin für deterministische OpenClaw-QA-Szenarien
title: QA-Channel
x-i18n:
    generated_at: "2026-04-24T06:28:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` ist ein gebündelter synthetischer Nachrichtentransport für automatisierte OpenClaw-QA.

Er ist kein Produktions-Channel. Er dient dazu, dieselbe Channel-Plugin-Grenze zu testen,
die auch von echten Transporten verwendet wird, während der Zustand deterministisch und vollständig
prüfbar bleibt.

## Was er heute leistet

- Slack-ähnliche Zielgrammatik:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- HTTP-gestützter synthetischer Bus für:
  - Injektion eingehender Nachrichten
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

Aktueller vertikaler Slice:

```bash
pnpm qa:e2e
```

Dies wird jetzt über die gebündelte `qa-lab`-Erweiterung geleitet. Es startet den
QA-Bus im Repository, bootet den gebündelten `qa-channel`-Runtime-Slice, führt einen deterministischen
Self-Check aus und schreibt einen Markdown-Bericht unter `.artifacts/qa-e2e/`.

Private Debugger-Benutzeroberfläche:

```bash
pnpm qa:lab:up
```

Dieser einzelne Befehl baut die QA-Site, startet den Docker-gestützten Gateway- + QA-Lab-Stack
und gibt die QA-Lab-URL aus. Auf dieser Site können Sie Szenarien auswählen, die Modell-Lane wählen,
einzelne Durchläufe starten und die Ergebnisse live beobachten.

Vollständige repository-gestützte QA-Suite:

```bash
pnpm openclaw qa suite
```

Dadurch wird der private QA-Debugger unter einer lokalen URL gestartet, getrennt vom
ausgelieferten Control-UI-Bundle.

## Umfang

Der aktuelle Umfang ist absichtlich eng gehalten:

- Bus + Plugin-Transport
- Threaded-Routing-Grammatik
- Channel-eigene Nachrichtenaktionen
- Markdown-Berichterstellung
- Docker-gestützte QA-Site mit Ausführungssteuerung

Spätere Arbeiten werden Folgendes hinzufügen:

- Ausführung über Anbieter-/Modell-Matrix
- umfangreichere Szenarioerkennung
- später OpenClaw-native Orchestrierung

## Verwandt

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Channel-Überblick](/de/channels)
