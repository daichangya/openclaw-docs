---
read_when:
    - Sie müssen verstehen, wie Zeitstempel für das Modell normalisiert werden
    - Konfigurieren der Benutzerzeitzone für System-Prompts
summary: Zeitzonenbehandlung für Agenten, Umschläge und Prompts
title: Zeitzonen
x-i18n:
    generated_at: "2026-04-24T06:35:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw standardisiert Zeitstempel, damit das Modell **eine einzige Referenzzeit** sieht.

## Nachrichtenumschläge (standardmäßig lokal)

Eingehende Nachrichten werden in einen Umschlag wie diesen verpackt:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Der Zeitstempel im Umschlag ist standardmäßig **host-lokal**, mit Minutenpräzision.

Sie können dies wie folgt überschreiben:

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
- `envelopeTimezone: "user"` verwendet `agents.defaults.userTimezone` (fällt auf die Host-Zeitzone zurück).
- Verwenden Sie eine explizite IANA-Zeitzone (z. B. `"Europe/Vienna"`) für einen festen Offset.
- `envelopeTimestamp: "off"` entfernt absolute Zeitstempel aus den Umschlag-Headern.
- `envelopeElapsed: "off"` entfernt Suffixe für verstrichene Zeit (im Stil von `+2m`).

### Beispiele

**Lokal (Standard):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Feste Zeitzone:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Verstrichene Zeit:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Tool-Payloads (rohe Provider-Daten + normalisierte Felder)

Tool-Aufrufe (`channels.discord.readMessages`, `channels.slack.readMessages` usw.) geben **rohe Provider-Zeitstempel** zurück.
Zusätzlich hängen wir normalisierte Felder zur Konsistenz an:

- `timestampMs` (UTC-Epoch-Millisekunden)
- `timestampUtc` (ISO-8601-UTC-Zeichenfolge)

Rohe Provider-Felder bleiben erhalten.

## Benutzerzeitzone für den System-Prompt

Setzen Sie `agents.defaults.userTimezone`, um dem Modell die lokale Zeitzone des Benutzers mitzuteilen. Wenn sie
nicht gesetzt ist, löst OpenClaw die **Host-Zeitzone zur Laufzeit** auf (kein Konfigurationsschreibvorgang).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Der System-Prompt enthält:

- Abschnitt `Current Date & Time` mit lokaler Zeit und Zeitzone
- `Time format: 12-hour` oder `24-hour`

Sie können das Prompt-Format mit `agents.defaults.timeFormat` steuern (`auto` | `12` | `24`).

Siehe [Date & Time](/de/date-time) für das vollständige Verhalten und Beispiele.

## Verwandt

- [Heartbeat](/de/gateway/heartbeat) — aktive Stunden verwenden die Zeitzone für die Zeitplanung
- [Cron Jobs](/de/automation/cron-jobs) — Cron-Ausdrücke verwenden die Zeitzone für die Zeitplanung
- [Date & Time](/de/date-time) — vollständiges Datums-/Zeitverhalten und Beispiele
