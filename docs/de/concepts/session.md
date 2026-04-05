---
read_when:
    - Sie möchten Sitzungsrouting und Isolation verstehen
    - Sie möchten den DM-Bereich für Setups mit mehreren Benutzern konfigurieren
summary: Wie OpenClaw Unterhaltungssitzungen verwaltet
title: Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-05T12:41:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab985781e54b22a034489dafa4b52cc204b1a5da22ee9b62edc7f6697512cea1
    source_path: concepts/session.md
    workflow: 15
---

# Sitzungsverwaltung

OpenClaw organisiert Unterhaltungen in **Sitzungen**. Jede Nachricht wird an eine
Sitzung weitergeleitet, je nachdem, woher sie stammt -- DMs, Gruppenchats, Cron-Jobs usw.

## So werden Nachrichten geroutet

| Quelle         | Verhalten                 |
| -------------- | ------------------------- |
| Direktnachrichten | Standardmäßig gemeinsame Sitzung |
| Gruppenchats   | Pro Gruppe isoliert       |
| Räume/Kanäle   | Pro Raum isoliert         |
| Cron-Jobs      | Frische Sitzung pro Lauf  |
| Webhooks       | Pro Hook isoliert         |

## DM-Isolation

Standardmäßig teilen sich alle DMs eine Sitzung für Kontinuität. Das ist für
Einzelbenutzer-Setups in Ordnung.

<Warning>
Wenn mehrere Personen Ihrem Agenten Nachrichten senden können, aktivieren Sie DM-Isolation. Andernfalls teilen sich alle
Benutzer denselben Unterhaltungskontext -- Alices private Nachrichten wären für Bob sichtbar.
</Warning>

**Die Lösung:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // nach Kanal + Absender isolieren
  },
}
```

Weitere Optionen:

- `main` (Standard) -- alle DMs teilen sich eine Sitzung.
- `per-peer` -- nach Absender isolieren (kanalübergreifend).
- `per-channel-peer` -- nach Kanal + Absender isolieren (empfohlen).
- `per-account-channel-peer` -- nach Konto + Kanal + Absender isolieren.

<Tip>
Wenn dieselbe Person Sie über mehrere Kanäle kontaktiert, verwenden Sie
`session.identityLinks`, um ihre Identitäten zu verknüpfen, sodass sie eine Sitzung teilen.
</Tip>

Prüfen Sie Ihre Konfiguration mit `openclaw security audit`.

## Sitzungslebenszyklus

Sitzungen werden wiederverwendet, bis sie ablaufen:

- **Tägliches Zurücksetzen** (Standard) -- neue Sitzung um 4:00 Uhr Ortszeit auf dem Gateway-
  Host.
- **Zurücksetzen bei Inaktivität** (optional) -- neue Sitzung nach einer Zeit der Inaktivität. Setzen Sie
  `session.reset.idleMinutes`.
- **Manuelles Zurücksetzen** -- geben Sie `/new` oder `/reset` im Chat ein. `/new <model>` wechselt auch das Modell.

Wenn sowohl tägliches als auch inaktivitätsbasiertes Zurücksetzen konfiguriert sind, gilt das zuerst ablaufende.

## Wo der Status gespeichert wird

Der gesamte Sitzungsstatus gehört dem **Gateway**. UI-Clients fragen das Gateway nach
Sitzungsdaten ab.

- **Speicher:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkripte:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Sitzungswartung

OpenClaw begrenzt den Sitzungs-Speicher im Laufe der Zeit automatisch. Standardmäßig läuft es
im Modus `warn` (meldet, was bereinigt würde). Setzen Sie `session.maintenance.mode`
auf `"enforce"` für automatische Bereinigung:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Vorschau mit `openclaw sessions cleanup --dry-run`.

## Sitzungen prüfen

- `openclaw status` -- Pfad des Sitzungsspeichers und letzte Aktivität.
- `openclaw sessions --json` -- alle Sitzungen (mit `--active <minutes>` filtern).
- `/status` im Chat -- Kontextnutzung, Modell und Schalter.
- `/context list` -- was im System-Prompt enthalten ist.

## Weiterführende Lektüre

- [Session Pruning](/concepts/session-pruning) -- Tool-Ergebnisse trimmen
- [Compaction](/concepts/compaction) -- lange Unterhaltungen zusammenfassen
- [Session Tools](/concepts/session-tool) -- Agent-Tools für sitzungsübergreifende Arbeit
- [Session Management Deep Dive](/reference/session-management-compaction) --
  Speicherschema, Transkripte, Send-Richtlinie, Ursprungsmetadaten und erweiterte Konfiguration
- [Multi-Agent](/concepts/multi-agent) — Routing und Sitzungsisolation über mehrere Agenten hinweg
- [Background Tasks](/automation/tasks) — wie entkoppelte Arbeit Aufgabenaufzeichnungen mit Sitzungsverweisen erstellt
- [Channel Routing](/channels/channel-routing) — wie eingehende Nachrichten an Sitzungen geroutet werden
