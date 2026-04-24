---
read_when:
    - Sie ändern, wie Zeitstempel dem Modell oder Benutzern angezeigt werden.
    - Sie debuggen Zeitformatierung in Nachrichten oder der Ausgabe des System-Prompts.
summary: Datums- und Zeitverarbeitung über Envelopes, Prompts, Tools und Connectors hinweg
title: Datum und Uhrzeit
x-i18n:
    generated_at: "2026-04-24T06:36:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 15
---

# Datum & Uhrzeit

OpenClaw verwendet standardmäßig **Host-lokale Zeit für Transport-Zeitstempel** und die **Zeitzone des Benutzers nur im System-Prompt**.
Zeitstempel von Providern bleiben erhalten, damit Tools ihre native Semantik behalten (die aktuelle Uhrzeit ist über `session_status` verfügbar).

## Nachrichten-Envelopes (standardmäßig lokal)

Eingehende Nachrichten werden mit einem Zeitstempel umhüllt (Minutengenauigkeit):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Dieser Envelope-Zeitstempel ist **standardmäßig Host-lokal**, unabhängig von der Zeitzone des Providers.

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
- `envelopeTimezone: "local"` verwendet die Zeitzone des Hosts.
- `envelopeTimezone: "user"` verwendet `agents.defaults.userTimezone` (fällt auf die Zeitzone des Hosts zurück).
- Verwenden Sie eine explizite IANA-Zeitzone (z. B. `"America/Chicago"`) für eine feste Zone.
- `envelopeTimestamp: "off"` entfernt absolute Zeitstempel aus Envelope-Headern.
- `envelopeElapsed: "off"` entfernt Suffixe für verstrichene Zeit (im Stil von `+2m`).

### Beispiele

**Lokal (Standard):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Zeitzone des Benutzers:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Verstrichene Zeit aktiviert:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## System-Prompt: Current Date & Time

Wenn die Zeitzone des Benutzers bekannt ist, enthält der System-Prompt einen eigenen Abschnitt
**Current Date & Time** nur mit der **Zeitzone** (kein Uhrzeit-/Zeitformat),
damit Prompt-Caching stabil bleibt:

```
Time zone: America/Chicago
```

Wenn der Agent die aktuelle Uhrzeit benötigt, verwenden Sie das Tool `session_status`; die Statuskarte
enthält eine Zeitstempelzeile.

## System-Event-Zeilen (standardmäßig lokal)

In den Agent-Kontext eingefügte System-Events in der Warteschlange werden mit einem Zeitstempel präfixiert, der dieselbe
Zeitzonenauswahl wie Nachrichten-Envelopes verwendet (Standard: Host-lokal).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Zeitzone des Benutzers + Format konfigurieren

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

Wenn `timeFormat: "auto"` gesetzt ist, prüft OpenClaw die OS-Präferenz (macOS/Windows)
und fällt auf lokalisierte Formatierung zurück. Der erkannte Wert wird **pro Prozess zwischengespeichert**,
um wiederholte Systemaufrufe zu vermeiden.

## Tool-Nutzlasten + Connectors (rohe Provider-Zeit + normalisierte Felder)

Kanal-Tools geben **Providereigene Zeitstempel** zurück und fügen zur Konsistenz normalisierte Felder hinzu:

- `timestampMs`: Epoch-Millisekunden (UTC)
- `timestampUtc`: ISO-8601-UTC-String

Rohe Provider-Felder bleiben erhalten, sodass nichts verloren geht.

- Slack: epochähnliche Strings aus der API
- Discord: UTC-ISO-Zeitstempel
- Telegram/WhatsApp: providerspezifische numerische/ISO-Zeitstempel

Wenn Sie lokale Zeit benötigen, konvertieren Sie sie nachgelagert mit der bekannten Zeitzone.

## Verwandte Dokumentation

- [System-Prompt](/de/concepts/system-prompt)
- [Zeitzonen](/de/concepts/timezone)
- [Nachrichten](/de/concepts/messages)
