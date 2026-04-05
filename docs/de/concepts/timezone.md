---
read_when:
    - Sie müssen verstehen, wie Zeitstempel für das Modell normalisiert werden
    - Konfigurieren der Benutzerzeitzone für System-Prompts
summary: Zeitzonenbehandlung für Agents, Envelopes und Prompts
title: Zeitzonen
x-i18n:
    generated_at: "2026-04-05T12:41:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# Zeitzonen

OpenClaw standardisiert Zeitstempel, sodass das Modell eine **einzige Referenzzeit** sieht.

## Nachrichten-Envelopes (standardmäßig lokal)

Eingehende Nachrichten werden in einen Envelope wie diesen eingebettet:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Der Zeitstempel im Envelope ist **standardmäßig host-lokal**, mit Minutenpräzision.

Sie können dies überschreiben mit:

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
- `envelopeTimestamp: "off"` entfernt absolute Zeitstempel aus Envelope-Headern.
- `envelopeElapsed: "off"` entfernt Suffixe für verstrichene Zeit (im Stil `+2m`).

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

## Tool-Nutzlasten (rohe Provider-Daten + normalisierte Felder)

Tool-Aufrufe (`channels.discord.readMessages`, `channels.slack.readMessages` usw.) geben **rohe Provider-Zeitstempel** zurück.
Zur Konsistenz fügen wir außerdem normalisierte Felder an:

- `timestampMs` (UTC-Epochenmillisekunden)
- `timestampUtc` (UTC-Zeichenfolge im Format ISO 8601)

Rohe Provider-Felder bleiben erhalten.

## Benutzerzeitzone für den System-Prompt

Setzen Sie `agents.defaults.userTimezone`, um dem Modell die lokale Zeitzone des Benutzers mitzuteilen. Wenn sie
nicht gesetzt ist, löst OpenClaw die **Host-Zeitzone zur Laufzeit** auf (kein Schreiben in die Konfiguration).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Der System-Prompt enthält:

- Abschnitt `Current Date & Time` mit Ortszeit und Zeitzone
- `Time format: 12-hour` oder `24-hour`

Sie können das Prompt-Format mit `agents.defaults.timeFormat` steuern (`auto` | `12` | `24`).

Siehe [Date & Time](/date-time) für das vollständige Verhalten und Beispiele.

## Verwandt

- [Heartbeat](/gateway/heartbeat) — aktive Stunden verwenden die Zeitzone für die Zeitplanung
- [Cron Jobs](/automation/cron-jobs) — Cron-Ausdrücke verwenden die Zeitzone für die Zeitplanung
- [Date & Time](/date-time) — vollständiges Datums-/Zeitverhalten und Beispiele
