---
read_when:
    - Sie möchten semantischen Speicher indizieren oder durchsuchen
    - Sie debuggen die Verfügbarkeit oder Indizierung von Memory
    - Sie möchten abgerufenen Kurzzeitspeicher in `MEMORY.md` überführen
summary: CLI-Referenz für `openclaw memory` (`status`/`index`/`search`/`promote`/`promote-explain`/`rem-harness`)
title: Memory
x-i18n:
    generated_at: "2026-04-24T06:31:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Verwalten von semantischer Memory-Indizierung und -Suche.
Bereitgestellt durch das aktive Memory-Plugin (Standard: `memory-core`; setzen Sie `plugins.slots.memory = "none"`, um es zu deaktivieren).

Verwandt:

- Memory-Konzept: [Memory](/de/concepts/memory)
- Memory-Wiki: [Memory Wiki](/de/plugins/memory-wiki)
- Wiki-CLI: [wiki](/de/cli/wiki)
- Plugins: [Plugins](/de/tools/plugin)

## Beispiele

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Optionen

`memory status` und `memory index`:

- `--agent <id>`: auf einen einzelnen Agenten begrenzen. Ohne diese Option werden diese Befehle für jeden konfigurierten Agenten ausgeführt; wenn keine Agentenliste konfiguriert ist, wird auf den Standard-Agenten zurückgegriffen.
- `--verbose`: detaillierte Logs während Prüfungen und Indizierung ausgeben.

`memory status`:

- `--deep`: Verfügbarkeit von Vektoren und Embeddings prüfen.
- `--index`: eine Neuindizierung ausführen, wenn der Speicher veraltet ist (impliziert `--deep`).
- `--fix`: veraltete Recall-Sperren reparieren und Promotionsmetadaten normalisieren.
- `--json`: JSON-Ausgabe ausgeben.

Wenn `memory status` `Dreaming status: blocked` anzeigt, ist der verwaltete Dreaming-Cron aktiviert, aber der Heartbeat, der ihn für den Standard-Agenten antreibt, wird nicht ausgelöst. Siehe [Dreaming never runs](/de/concepts/dreaming#dreaming-never-runs-status-shows-blocked) für die zwei häufigen Ursachen.

`memory index`:

- `--force`: eine vollständige Neuindizierung erzwingen.

`memory search`:

- Abfrageeingabe: entweder die positionale Eingabe `[query]` oder `--query <text>` übergeben.
- Wenn beides angegeben wird, hat `--query` Vorrang.
- Wenn keines von beiden angegeben wird, beendet sich der Befehl mit einem Fehler.
- `--agent <id>`: auf einen einzelnen Agenten begrenzen (Standard: der Standard-Agent).
- `--max-results <n>`: die Anzahl der zurückgegebenen Ergebnisse begrenzen.
- `--min-score <n>`: Treffer mit niedrigem Score herausfiltern.
- `--json`: JSON-Ergebnisse ausgeben.

`memory promote`:

Vorschau und Anwenden von Kurzzeit-Memory-Promotions.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- Promotions nach `MEMORY.md` schreiben (Standard: nur Vorschau).
- `--limit <n>` -- maximale Anzahl angezeigter Kandidaten.
- `--include-promoted` -- Einträge einschließen, die bereits in vorherigen Zyklen befördert wurden.

Vollständige Optionen:

- Bewertet Kurzzeitkandidaten aus `memory/YYYY-MM-DD.md` anhand gewichteter Promotionssignale (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Verwendet Kurzzeitsignale sowohl aus Memory-Recalls als auch aus täglichen Ingestion-Durchläufen sowie leichte/REM-Phasen-Verstärkungssignale.
- Wenn Dreaming aktiviert ist, verwaltet `memory-core` automatisch einen Cron-Job, der im Hintergrund einen vollständigen Durchlauf (`light -> REM -> deep`) ausführt (kein manuelles `openclaw cron add` erforderlich).
- `--agent <id>`: auf einen einzelnen Agenten begrenzen (Standard: der Standard-Agent).
- `--limit <n>`: maximale Anzahl zurückzugebender/anzuwendender Kandidaten.
- `--min-score <n>`: minimaler gewichteter Promotionsscore.
- `--min-recall-count <n>`: minimale Recall-Anzahl, die für einen Kandidaten erforderlich ist.
- `--min-unique-queries <n>`: minimale Anzahl unterschiedlicher Abfragen, die für einen Kandidaten erforderlich ist.
- `--apply`: ausgewählte Kandidaten an `MEMORY.md` anhängen und als befördert markieren.
- `--include-promoted`: bereits beförderte Kandidaten in die Ausgabe einschließen.
- `--json`: JSON-Ausgabe ausgeben.

`memory promote-explain`:

Einen bestimmten Promotionskandidaten und die Aufschlüsselung seines Scores erklären.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: Kandidatenschlüssel, Pfadfragment oder Snippet-Fragment zum Nachschlagen.
- `--agent <id>`: auf einen einzelnen Agenten begrenzen (Standard: der Standard-Agent).
- `--include-promoted`: bereits beförderte Kandidaten einschließen.
- `--json`: JSON-Ausgabe ausgeben.

`memory rem-harness`:

Vorschau von REM-Reflexionen, möglichen Wahrheiten und Deep-Promotion-Ausgabe, ohne etwas zu schreiben.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: auf einen einzelnen Agenten begrenzen (Standard: der Standard-Agent).
- `--include-promoted`: bereits beförderte Deep-Kandidaten einschließen.
- `--json`: JSON-Ausgabe ausgeben.

## Dreaming

Dreaming ist das Hintergrundsystem zur Memory-Konsolidierung mit drei kooperierenden
Phasen: **light** (Kurzzeitmaterial sortieren/stagen), **deep** (dauerhafte
Fakten nach `MEMORY.md` befördern) und **REM** (reflektieren und Themen hervorheben).

- Aktivieren mit `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Im Chat umschalten mit `/dreaming on|off` (oder mit `/dreaming status` prüfen).
- Dreaming läuft nach einem verwalteten Durchlaufzeitplan (`dreaming.frequency`) und führt Phasen der Reihe nach aus: light, REM, deep.
- Nur die Deep-Phase schreibt dauerhafte Memory nach `MEMORY.md`.
- Menschenlesbare Phasenausgabe und Tagebucheinträge werden nach `DREAMS.md` (oder vorhandene `dreams.md`) geschrieben, mit optionalen Berichten pro Phase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Das Ranking verwendet gewichtete Signale: Recall-Häufigkeit, Abrufrelevanz, Query-Diversität, zeitliche Aktualität, Konsolidierung über mehrere Tage hinweg und abgeleiteter konzeptioneller Reichtum.
- Promotion liest die aktuelle Tagesnotiz vor dem Schreiben nach `MEMORY.md` erneut ein, sodass bearbeitete oder gelöschte Kurzzeit-Snippets nicht aus veralteten Recall-Store-Snapshots befördert werden.
- Geplante und manuelle `memory promote`-Ausführungen teilen sich dieselben Standardwerte der Deep-Phase, sofern Sie keine CLI-Schwellenwertüberschreibungen übergeben.
- Automatische Ausführungen werden auf konfigurierte Memory-Workspaces verteilt.

Standardzeitplan:

- **Durchlaufrhythmus**: `dreaming.frequency = 0 3 * * *`
- **Deep-Schwellenwerte**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Beispiel:

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

Hinweise:

- `memory index --verbose` gibt Details pro Phase aus (Provider, Modell, Quellen, Batch-Aktivität).
- `memory status` enthält alle zusätzlichen Pfade, die über `memorySearch.extraPaths` konfiguriert sind.
- Wenn effektiv aktive Remote-API-Key-Felder von Memory als SecretRefs konfiguriert sind, löst der Befehl diese Werte aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl sofort fehl.
- Hinweis zu Versionsabweichungen des Gateway: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Unknown-Method-Fehler zurück.
- Passen Sie den geplanten Durchlaufrhythmus mit `dreaming.frequency` an. Die Deep-Promotion-Richtlinie ist ansonsten intern; verwenden Sie CLI-Flags für `memory promote`, wenn Sie einmalige manuelle Überschreibungen benötigen.
- `memory rem-harness --path <file-or-dir> --grounded` zeigt eine Vorschau geerdeter `What Happened`, `Reflections` und `Possible Lasting Updates` aus historischen Tagesnotizen an, ohne etwas zu schreiben.
- `memory rem-backfill --path <file-or-dir>` schreibt reversible geerdete Tagebucheinträge nach `DREAMS.md` zur UI-Prüfung.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` legt zusätzlich geerdete dauerhafte Kandidaten im aktiven Kurzzeit-Promotion-Store ab, sodass die normale Deep-Phase sie bewerten kann.
- `memory rem-backfill --rollback` entfernt zuvor geschriebene geerdete Tagebucheinträge, und `memory rem-backfill --rollback-short-term` entfernt zuvor abgelegte geerdete Kurzzeitkandidaten.
- Siehe [Dreaming](/de/concepts/dreaming) für vollständige Phasenbeschreibungen und die Konfigurationsreferenz.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Memory-Überblick](/de/concepts/memory)
