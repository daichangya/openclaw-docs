---
read_when:
    - Sie ändern, wie Zeitstempel dem Modell oder Benutzern angezeigt werden
    - Sie debuggen die Zeitformatierung in Nachrichten oder in der Ausgabe des System-Prompts
summary: Behandlung von Datum und Uhrzeit in Envelopes, Prompts, Tools und Connectors
title: Datum und Uhrzeit
x-i18n:
    generated_at: "2026-04-05T12:41:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753af5946a006215d6af2467fa478f3abb42b1dff027cf85d5dc4c7ba4b58d39
    source_path: date-time.md
    workflow: 15
---

# Datum und Uhrzeit

OpenClaw verwendet standardmäßig **host-lokale Zeit für Transportzeitstempel** und die **Benutzerzeitzone nur im System-Prompt**.
Provider-Zeitstempel bleiben erhalten, damit Tools ihre nativen Semantiken beibehalten (die aktuelle Uhrzeit ist über `session_status` verfügbar).

## Nachrichten-Envelopes (standardmäßig lokal)

Eingehende Nachrichten werden mit einem Zeitstempel eingebettet (Minutenpräzision):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Dieser Zeitstempel im Envelope ist **standardmäßig host-lokal**, unabhängig von der Zeitzone des Providers.

Sie können dieses Verhalten überschreiben:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` verwendet UTC.
- `envelopeTimezone: "local"` verwendet die Host-Zeitzone.
- `envelopeTimezone: "user"` verwendet `agents.defaults.userTimezone` (fällt auf die Host-Zeitzone zurück).
- Verwenden Sie eine explizite IANA-Zeitzone (z. B. `"America/Chicago"`) für eine feste Zone.
- `envelopeTimestamp: "off"` entfernt absolute Zeitstempel aus Envelope-Headern.
- `envelopeElapsed: "off"` entfernt Suffixe für verstrichene Zeit (im Stil `+2m`).

### Beispiele

**Lokal (Standard):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Benutzerzeitzone:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Verstrichene Zeit aktiviert:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## System-Prompt: Current Date & Time

Wenn die Benutzerzeitzone bekannt ist, enthält der System-Prompt einen eigenen Abschnitt
**Current Date & Time** nur mit der **Zeitzone** (ohne Uhrzeit/Zeitformat),
damit das Prompt-Caching stabil bleibt:

```
Time zone: America/Chicago
```

Wenn der Agent die aktuelle Uhrzeit benötigt, verwenden Sie das Tool `session_status`; die Statuskarte
enthält eine Zeitstempelzeile.

## Systemereigniszeilen (standardmäßig lokal)

In den Agent-Kontext eingefügte Systemereignisse in Warteschlangen werden mit einem Zeitstempel präfigiert, der dieselbe
Zeitzonenauswahl wie Nachrichten-Envelopes verwendet (Standard: host-lokal).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Benutzerzeitzone + Format konfigurieren

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` setzt die **benutzerlokale Zeitzone** für den Prompt-Kontext.
- `timeFormat` steuert die **12h-/24h-Anzeige** im Prompt. `auto` folgt den OS-Einstellungen.

## Erkennung des Zeitformats (auto)

Wenn `timeFormat: "auto"` gesetzt ist, prüft OpenClaw die OS-Einstellung (macOS/Windows)
und greift auf die gebietsschemaabhängige Formatierung zurück. Der erkannte Wert wird **pro Prozess zwischengespeichert**,
um wiederholte Systemaufrufe zu vermeiden.

## Tool-Nutzlasten + Connectors (rohe Provider-Zeit + normalisierte Felder)

Kanal-Tools geben **providernative Zeitstempel** zurück und fügen zur Konsistenz normalisierte Felder hinzu:

- `timestampMs`: Epochenmillisekunden (UTC)
- `timestampUtc`: UTC-Zeichenfolge im ISO-8601-Format

Rohe Provider-Felder bleiben erhalten, damit nichts verloren geht.

- Slack: epochenähnliche Zeichenfolgen aus der API
- Discord: UTC-ISO-Zeitstempel
- Telegram/WhatsApp: providerspezifische numerische/ISO-Zeitstempel

Wenn Sie Ortszeit benötigen, konvertieren Sie diese nachgelagert unter Verwendung der bekannten Zeitzone.

## Verwandte Dokumentation

- [System Prompt](/concepts/system-prompt)
- [Timezones](/concepts/timezone)
- [Messages](/concepts/messages)
