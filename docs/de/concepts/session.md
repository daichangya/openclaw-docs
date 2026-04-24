---
read_when:
    - Sie möchten Sitzungsweiterleitung und Isolation verstehen
    - Sie möchten den DM-Bereich für Mehrbenutzer-Setups konfigurieren
summary: Wie OpenClaw Konversationssitzungen verwaltet
title: Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-24T06:35:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: cafff1fd480bdd306f87c818e7cb66bda8440d643fbe9ce5e14b773630b35d37
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organisiert Unterhaltungen in **Sitzungen**. Jede Nachricht wird zu einer
Sitzung weitergeleitet, basierend darauf, woher sie stammt -- DMs, Gruppenchats, Cron-Jobs usw.

## Wie Nachrichten weitergeleitet werden

| Quelle         | Verhalten                 |
| -------------- | ------------------------- |
| Direktnachrichten | Standardmäßig gemeinsame Sitzung |
| Gruppenchats   | Pro Gruppe isoliert       |
| Räume/Kanäle   | Pro Raum isoliert         |
| Cron-Jobs      | Neue Sitzung pro Ausführung |
| Webhooks       | Pro Hook isoliert         |

## DM-Isolation

Standardmäßig teilen sich alle DMs eine Sitzung für Kontinuität. Das ist für
Einzelbenutzer-Setups in Ordnung.

<Warning>
Wenn mehrere Personen Ihrem Agenten Nachrichten senden können, aktivieren Sie DM-Isolation. Ohne diese
teilen sich alle Benutzer denselben Konversationskontext -- Alices private Nachrichten wären für Bob sichtbar.
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
`session.identityLinks`, um ihre Identitäten zu verknüpfen, sodass sie sich eine Sitzung teilen.
</Tip>

Prüfen Sie Ihr Setup mit `openclaw security audit`.

## Sitzungslebenszyklus

Sitzungen werden wiederverwendet, bis sie ablaufen:

- **Tägliches Zurücksetzen** (Standard) -- neue Sitzung um 4:00 Uhr Ortszeit auf dem Gateway-Host.
- **Leerlauf-Zurücksetzen** (optional) -- neue Sitzung nach einer Zeit der Inaktivität. Setzen Sie
  `session.reset.idleMinutes`.
- **Manuelles Zurücksetzen** -- geben Sie `/new` oder `/reset` im Chat ein. `/new <model>` schaltet außerdem
  das Modell um.

Wenn sowohl tägliches als auch Leerlauf-Zurücksetzen konfiguriert sind, gilt das zuerst ablaufende.

Sitzungen mit einer aktiven CLI-Sitzung im Besitz des Providers werden nicht durch den impliziten
täglichen Standard getrennt. Verwenden Sie `/reset` oder konfigurieren Sie `session.reset` explizit, wenn diese
Sitzungen nach einem Timer ablaufen sollen.

## Wo der Status gespeichert wird

Der gesamte Sitzungsstatus gehört dem **Gateway**. UI-Clients fragen das Gateway nach
Sitzungsdaten ab.

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
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

- `openclaw status` -- Pfad zum Sitzungsspeicher und aktuelle Aktivität.
- `openclaw sessions --json` -- alle Sitzungen (filtern mit `--active <minutes>`).
- `/status` im Chat -- Kontextnutzung, Modell und Umschalter.
- `/context list` -- was sich im System-Prompt befindet.

## Weiterführende Informationen

- [Session Pruning](/de/concepts/session-pruning) -- Tool-Ergebnisse kürzen
- [Compaction](/de/concepts/compaction) -- lange Unterhaltungen zusammenfassen
- [Session Tools](/de/concepts/session-tool) -- Agent-Tools für sitzungsübergreifende Arbeit
- [Deep Dive zur Sitzungsverwaltung](/de/reference/session-management-compaction) --
  Store-Schema, Transkripte, Send-Richtlinie, Ursprungsmetadaten und erweiterte Konfiguration
- [Multi-Agent](/de/concepts/multi-agent) — Routing und Sitzungsisolation über Agenten hinweg
- [Hintergrundaufgaben](/de/automation/tasks) — wie losgelöste Arbeit Aufgabeneinträge mit Sitzungsreferenzen erzeugt
- [Kanalweiterleitung](/de/channels/channel-routing) — wie eingehende Nachrichten an Sitzungen weitergeleitet werden

## Verwandt

- [Session Pruning](/de/concepts/session-pruning)
- [Session Tools](/de/concepts/session-tool)
- [Befehlswarteschlange](/de/concepts/queue)
