---
read_when:
    - Sie möchten, dass die Memory-Promotion automatisch ausgeführt wird.
    - Sie möchten verstehen, was jede Dreaming-Phase macht.
    - Sie möchten die Konsolidierung abstimmen, ohne `MEMORY.md` zu verschmutzen.
summary: Hintergrund-Memory-Konsolidierung mit leichten, tiefen und REM-Phasen plus einem Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T06:33:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming ist das Hintergrundsystem zur Memory-Konsolidierung in `memory-core`.
Es hilft OpenClaw, starke kurzfristige Signale in dauerhafte Memory zu überführen und
den Prozess dabei erklärbar und überprüfbar zu halten.

Dreaming ist **opt-in** und standardmäßig deaktiviert.

## Was Dreaming schreibt

Dreaming führt zwei Arten von Ausgaben:

- **Maschinenzustand** in `memory/.dreams/` (Recall-Store, Phasen-Signale, Ingestion-Checkpoints, Sperren).
- **Menschenlesbare Ausgabe** in `DREAMS.md` (oder vorhandenes `dreams.md`) und optionalen Phasen-Report-Dateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langfristige Promotion schreibt weiterhin nur in `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei kooperative Phasen:

| Phase | Zweck                                    | Dauerhafter Schreibvorgang |
| ----- | ---------------------------------------- | -------------------------- |
| Light | Jüngeres kurzfristiges Material sortieren und bereitstellen | Nein |
| Deep  | Dauerhafte Kandidaten bewerten und promoten | Ja (`MEMORY.md`) |
| REM   | Über Themen und wiederkehrende Ideen reflektieren | Nein |

Diese Phasen sind interne Implementierungsdetails, keine separaten vom Benutzer konfigurierbaren
„Modi“.

### Light-Phase

Die Light-Phase nimmt aktuelle tägliche Memory-Signale und Recall-Traces auf, dedupliziert sie
und stellt Kandidatenzeilen bereit.

- Liest aus kurzfristigem Recall-Zustand, aktuellen täglichen Memory-Dateien und redigierten Sitzungs-Transkripten, sofern verfügbar.
- Schreibt einen verwalteten Block `## Light Sleep`, wenn der Speicher Inline-Ausgabe enthält.
- Zeichnet Verstärkungssignale für ein späteres Deep-Ranking auf.
- Schreibt niemals in `MEMORY.md`.

### Deep-Phase

Die Deep-Phase entscheidet, was zu langfristiger Memory wird.

- Bewertet Kandidaten mithilfe gewichteter Scores und Schwellenwert-Gates.
- Erfordert, dass `minScore`, `minRecallCount` und `minUniqueQueries` erfüllt sind.
- Rehydriert Snippets vor dem Schreiben aus Live-Tagesdateien, sodass veraltete/gelöschte Snippets übersprungen werden.
- Hängt promovierte Einträge an `MEMORY.md` an.
- Schreibt eine Zusammenfassung `## Deep Sleep` in `DREAMS.md` und schreibt optional `memory/dreaming/deep/YYYY-MM-DD.md`.

### REM-Phase

Die REM-Phase extrahiert Muster und reflektierende Signale.

- Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen kurzfristigen Traces.
- Schreibt einen verwalteten Block `## REM Sleep`, wenn der Speicher Inline-Ausgabe enthält.
- Zeichnet REM-Verstärkungssignale auf, die vom Deep-Ranking verwendet werden.
- Schreibt niemals in `MEMORY.md`.

## Ingestion von Sitzungs-Transkripten

Dreaming kann redigierte Sitzungs-Transkripte in den Dreaming-Korpus aufnehmen. Wenn
Transkripte verfügbar sind, werden sie in der Light-Phase zusammen mit täglichen
Memory-Signalen und Recall-Traces eingespeist. Persönliche und sensible Inhalte werden
vor der Aufnahme redigiert.

## Dream Diary

Dreaming führt außerdem ein erzählerisches **Dream Diary** in `DREAMS.md`.
Sobald nach jeder Phase genügend Material vorhanden ist, führt `memory-core` einen Best-Effort-Hintergrund-
Subagent-Turn aus (unter Verwendung des Standard-Runtime-Modells) und hängt einen kurzen Tagebucheintrag an.

Dieses Tagebuch ist für menschliches Lesen in der Dreams-UI gedacht, nicht als Promotionsquelle.
Von Dreaming erzeugte Tagebuch-/Report-Artefakte sind von der kurzfristigen
Promotion ausgeschlossen. Nur geerdete Memory-Snippets kommen für eine Promotion nach
`MEMORY.md` infrage.

Es gibt außerdem eine geerdete historische Backfill-Lane für Überprüfungs- und Wiederherstellungsarbeiten:

- `memory rem-harness --path ... --grounded` zeigt eine Vorschau auf geerdete Tagebuchausgabe aus historischen `YYYY-MM-DD.md`-Notizen.
- `memory rem-backfill --path ...` schreibt reversible geerdete Tagebucheinträge in `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` stellt geerdete dauerhafte Kandidaten in denselben kurzfristigen Evidenz-Store bereit, den die normale Deep-Phase bereits verwendet.
- `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese bereitgestellten Backfill-Artefakte, ohne normale Tagebucheinträge oder den Live-Zustand des kurzfristigen Recall zu berühren.

Die Control-UI stellt denselben Ablauf für Tagebuch-Backfill/Reset bereit, sodass Sie
Ergebnisse in der Dreams-Szene prüfen können, bevor Sie entscheiden, ob die geerdeten Kandidaten
eine Promotion verdienen. Die Szene zeigt außerdem eine eigene geerdete Lane, sodass Sie sehen können,
welche bereitgestellten kurzfristigen Einträge aus historischem Replay stammen, welche promovierten
Elemente geerdet geführt waren, und nur geerdete bereitgestellte Einträge löschen können, ohne
den normalen Live-Zustand des kurzfristigen Recall zu berühren.

## Deep-Ranking-Signale

Deep-Ranking verwendet sechs gewichtete Basissignale plus Phasen-Verstärkung:

| Signal              | Gewicht | Beschreibung |
| ------------------- | ------ | ------------ |
| Frequency           | 0.24   | Wie viele kurzfristige Signale der Eintrag angesammelt hat |
| Relevance           | 0.30   | Durchschnittliche Retrieval-Qualität für den Eintrag |
| Query diversity     | 0.15   | Unterschiedliche Query-/Tageskontexte, in denen er auftauchte |
| Recency             | 0.15   | Zeitlich abgeklungener Frische-Score |
| Consolidation       | 0.10   | Stärke des Wiederauftretens über mehrere Tage |
| Conceptual richness | 0.06   | Dichte der Konzept-Tags aus Snippet/Pfad |

Treffer aus der Light- und REM-Phase fügen einen kleinen, durch Recency abgeklungenen Boost aus
`memory/.dreams/phase-signals.json` hinzu.

## Zeitplanung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-
Durchlauf. Jeder Durchlauf führt die Phasen in Reihenfolge aus: light -> REM -> deep.

Standardverhalten für die Taktung:

| Einstellung          | Standard   |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI-Workflow

Verwenden Sie CLI-Promotion für Vorschau oder manuelles Anwenden:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Manuelles `memory promote` verwendet standardmäßig die Schwellenwerte der Deep-Phase, sofern diese nicht
mit CLI-Flags überschrieben werden.

Erklären, warum ein bestimmter Kandidat promoviert würde oder nicht:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

REM-Reflexionen, Kandidatenwahrheiten und die Ausgabe der Deep-Promotion als Vorschau anzeigen,
ohne irgendetwas zu schreiben:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Wichtige Standardwerte

Alle Einstellungen befinden sich unter `plugins.entries.memory-core.config.dreaming`.

| Schlüssel   | Standard   |
| ----------- | ---------- |
| `enabled`   | `false`    |
| `frequency` | `0 3 * * *` |

Phasenrichtlinie, Schwellenwerte und Speicherverhalten sind interne Implementierungs-
details (keine benutzerseitige Konfiguration).

Siehe [Memory configuration reference](/de/reference/memory-config#dreaming)
für die vollständige Liste der Schlüssel.

## Dreams-UI

Wenn aktiviert, zeigt der Tab **Dreams** im Gateway Folgendes an:

- aktuellen Aktivierungszustand von Dreaming
- Status auf Phasenebene und Vorhandensein eines verwalteten Durchlaufs
- Zähler für kurzfristige, geerdete, Signal- und heute promovierte Einträge
- Zeitpunkt des nächsten geplanten Laufs
- eine eigene geerdete Scene-Lane für bereitgestellte historische Replay-Einträge
- einen ausklappbaren Dream-Diary-Reader, gestützt durch `doctor.memory.dreamDiary`

## Verwandt

- [Memory](/de/concepts/memory)
- [Memory Search](/de/concepts/memory-search)
- [memory CLI](/de/cli/memory)
- [Memory configuration reference](/de/reference/memory-config)
