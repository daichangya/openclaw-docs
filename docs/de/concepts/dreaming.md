---
read_when:
    - Sie möchten, dass die Hochstufung von Erinnerungen automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase bewirkt
    - Sie möchten die Konsolidierung abstimmen, ohne `MEMORY.md` zu überladen
summary: Hintergrundspeicherkonsolidierung mit Light-, Deep- und REM-Phasen sowie einem Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T14:01:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung in `memory-core`.
Es hilft OpenClaw, starke kurzfristige Signale in dauerhafte Erinnerung zu überführen,
während der Prozess nachvollziehbar und überprüfbar bleibt.

Dreaming ist **Opt-in** und standardmäßig deaktiviert.

## Was Dreaming schreibt

Dreaming verwaltet zwei Arten von Ausgabe:

- **Maschinenzustand** in `memory/.dreams/` (Recall-Speicher, Phasensignale, Ingestion-Checkpoints, Sperren).
- **Menschenlesbare Ausgabe** in `DREAMS.md` (oder bestehendem `dreams.md`) und optionalen Phasenberichtdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langfristige Hochstufung schreibt weiterhin nur in `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei kooperative Phasen:

| Phase | Zweck                                     | Dauerhafter Schreibvorgang |
| ----- | ----------------------------------------- | -------------------------- |
| Light | Aktuelles Kurzzeitmaterial sortieren und vorbereiten | Nein                |
| Deep  | Dauerhafte Kandidaten bewerten und hochstufen | Ja (`MEMORY.md`)      |
| REM   | Über Themen und wiederkehrende Ideen reflektieren | Nein                |

Diese Phasen sind interne Implementierungsdetails, keine separaten vom Benutzer konfigurierbaren
„Modi“.

### Light-Phase

Die Light-Phase ingestiert aktuelle tägliche Erinnerungssignale und Recall-Traces, dedupliziert sie
und bereitet Kandidatenzeilen vor.

- Liest aus dem Kurzzeit-Recall-Zustand, aktuellen täglichen Erinnerungsdateien und redigierten Sitzungs-Transkripten, wenn verfügbar.
- Schreibt einen verwalteten Block `## Light Sleep`, wenn der Speicher Inline-Ausgabe enthält.
- Zeichnet Verstärkungssignale für spätere Deep-Bewertung auf.
- Schreibt niemals in `MEMORY.md`.

### Deep-Phase

Die Deep-Phase entscheidet, was zur Langzeiterinnerung wird.

- Bewertet Kandidaten mit gewichteter Bewertung und Schwellenwert-Gates.
- Erfordert das Bestehen von `minScore`, `minRecallCount` und `minUniqueQueries`.
- Rehydriert Snippets aus aktiven Tagesdateien vor dem Schreiben, sodass veraltete/gelöschte Snippets übersprungen werden.
- Hängt hochgestufte Einträge an `MEMORY.md` an.
- Schreibt eine Zusammenfassung `## Deep Sleep` in `DREAMS.md` und optional `memory/dreaming/deep/YYYY-MM-DD.md`.

### REM-Phase

Die REM-Phase extrahiert Muster und reflektive Signale.

- Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen Kurzzeit-Traces.
- Schreibt einen verwalteten Block `## REM Sleep`, wenn der Speicher Inline-Ausgabe enthält.
- Zeichnet REM-Verstärkungssignale auf, die von der Deep-Bewertung verwendet werden.
- Schreibt niemals in `MEMORY.md`.

## Ingestion von Sitzungs-Transkripten

Dreaming kann redigierte Sitzungs-Transkripte in den Dreaming-Korpus ingestieren. Wenn
Transkripte verfügbar sind, werden sie in der Light-Phase zusammen mit täglichen
Erinnerungssignalen und Recall-Traces verarbeitet. Persönliche und sensible Inhalte werden
vor der Ingestion redigiert.

## Dream Diary

Dreaming führt außerdem ein narratives **Dream Diary** in `DREAMS.md`.
Sobald jede Phase genug Material hat, führt `memory-core` im Best-Effort-Verfahren einen
Hintergrund-Subagent-Turn aus (unter Verwendung des Standard-Laufzeitmodells) und hängt einen kurzen Tagebucheintrag an.

Dieses Tagebuch ist für menschliches Lesen in der Dreams-UI gedacht, nicht als Quelle für Hochstufung.
Von Dreaming erzeugte Tagebuch-/Berichtsartefakte sind von der kurzfristigen
Hochstufung ausgeschlossen. Nur fundierte Erinnerungssnippets können in
`MEMORY.md` hochgestuft werden.

Es gibt außerdem einen fundierten historischen Backfill-Pfad für Prüf- und Wiederherstellungsarbeiten:

- `memory rem-harness --path ... --grounded` zeigt eine Vorschau auf fundierte Tagebuchausgabe aus historischen `YYYY-MM-DD.md`-Notizen.
- `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` staged fundierte dauerhafte Kandidaten in denselben Kurzzeit-Evidenzspeicher, den die normale Deep-Phase bereits verwendet.
- `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese gestagten Backfill-Artefakte, ohne gewöhnliche Tagebucheinträge oder aktiven Kurzzeit-Recall zu verändern.

Die Control-UI stellt denselben Tagebuch-Backfill-/Reset-Ablauf bereit, sodass Sie Ergebnisse
in der Dreams-Szene prüfen können, bevor Sie entscheiden, ob die fundierten Kandidaten
eine Hochstufung verdienen. Die Szene zeigt außerdem einen eigenen fundierten Pfad, damit Sie sehen können,
welche gestagten Kurzzeiteinträge aus historischem Replay stammen, welche hochgestuften
Elemente fundiert geleitet waren, und nur fundiert-only gestagte Einträge löschen können, ohne
den gewöhnlichen aktiven Kurzzeitzustand zu berühren.

## Deep-Bewertungssignale

Die Deep-Bewertung verwendet sechs gewichtete Basissignale plus Phasenverstärkung:

| Signal               | Gewicht | Beschreibung                                      |
| -------------------- | ------- | ------------------------------------------------- |
| Häufigkeit           | 0.24    | Wie viele Kurzzeitsignale der Eintrag angesammelt hat |
| Relevanz             | 0.30    | Durchschnittliche Abrufqualität für den Eintrag   |
| Abfragevielfalt      | 0.15    | Unterschiedliche Abfrage-/Tageskontexte, in denen er erschien |
| Aktualität           | 0.15    | Zeitabklingender Frische-Score                    |
| Konsolidierung       | 0.10    | Stärke der Wiederkehr über mehrere Tage           |
| Konzeptuelle Dichte  | 0.06    | Dichte der Konzept-Tags aus Snippet/Pfad          |

Treffer aus Light- und REM-Phasen fügen aus
`memory/.dreams/phase-signals.json` einen kleinen, aktualitätsabklingenden Boost hinzu.

## Zeitplanung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen
Dreaming-Durchlauf. Jeder Durchlauf führt die Phasen der Reihe nach aus: light -> REM -> deep.

Standardverhalten der Taktung:

| Einstellung           | Standard    |
| --------------------- | ----------- |
| `dreaming.frequency`  | `0 3 * * *` |

## Schnellstart

Dreaming aktivieren:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Dreaming mit benutzerdefinierter Durchlauf-Taktung aktivieren:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Slash-Befehl

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI-Workflow

Verwenden Sie die CLI-Hochstufung für Vorschau oder manuelles Anwenden:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Manuelles `memory promote` verwendet standardmäßig die Schwellenwerte der Deep-Phase, sofern sie
nicht mit CLI-Flags überschrieben werden.

Erläutern, warum ein bestimmter Kandidat hochgestuft würde oder nicht:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

REM-Reflexionen, Kandidatenwahrheiten und Deep-Hochstufungsausgabe als Vorschau anzeigen, ohne
etwas zu schreiben:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Wichtige Standardwerte

Alle Einstellungen befinden sich unter `plugins.entries.memory-core.config.dreaming`.

| Schlüssel    | Standard    |
| ------------ | ----------- |
| `enabled`    | `false`     |
| `frequency`  | `0 3 * * *` |

Phasenrichtlinie, Schwellenwerte und Speicherverhalten sind interne Implementierungs-
details (keine benutzerseitige Konfiguration).

Siehe [Referenz zur Memory-Konfiguration](/de/reference/memory-config#dreaming)
für die vollständige Liste der Schlüssel.

## Dreams-UI

Wenn aktiviert, zeigt die Registerkarte **Dreams** im Gateway:

- aktuellen Aktivierungsstatus von Dreaming
- Status auf Phasenebene und Vorhandensein verwalteter Durchläufe
- Zählwerte für kurzfristig, fundiert, Signal und heute hochgestuft
- Zeitpunkt des nächsten geplanten Laufs
- einen eigenen fundierten Szenenpfad für gestagte historische Replay-Einträge
- einen aufklappbaren Dream-Diary-Reader, gestützt durch `doctor.memory.dreamDiary`

## Fehlerbehebung

### Dreaming läuft nie (Status zeigt blocked)

Der verwaltete Dreaming-Cron läuft auf dem Heartbeat des Standard-Agenten. Wenn der Heartbeat für diesen Agenten nicht ausgelöst wird, reiht der Cron ein Systemereignis ein, das niemand verarbeitet, und Dreaming läuft stillschweigend nicht. Sowohl `openclaw memory status` als auch `/dreaming status` melden in diesem Fall `blocked` und nennen den Agenten, dessen Heartbeat der Blocker ist.

Zwei häufige Ursachen:

- Ein anderer Agent deklariert einen expliziten `heartbeat:`-Block. Wenn irgendein Eintrag in `agents.list` einen eigenen `heartbeat`-Block hat, senden nur diese Agenten Heartbeats — die Standardwerte gelten dann nicht mehr für alle anderen, sodass der Standard-Agent stumm werden kann. Verschieben Sie die Heartbeat-Einstellungen nach `agents.defaults.heartbeat`, oder fügen Sie dem Standard-Agenten einen expliziten `heartbeat`-Block hinzu. Siehe [Geltungsbereich und Vorrang](/de/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` ist `0`, leer oder nicht parsebar. Der Cron hat dann kein Intervall, an dem er sich orientieren kann, sodass der Heartbeat effektiv deaktiviert ist. Setzen Sie `every` auf eine positive Dauer wie `30m`. Siehe [Standardwerte](/de/gateway/heartbeat#defaults).

## Verwandt

- [Heartbeat](/de/gateway/heartbeat)
- [Memory](/de/concepts/memory)
- [Memory Search](/de/concepts/memory-search)
- [memory CLI](/de/cli/memory)
- [Referenz zur Memory-Konfiguration](/de/reference/memory-config)
