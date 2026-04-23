---
read_when:
    - Sie möchten semantischen Speicher indexieren oder durchsuchen
    - Sie debuggen die Verfügbarkeit oder Indizierung von Speicher
    - Sie möchten abgerufenen Kurzzeitspeicher in `MEMORY.md` übernehmen
summary: CLI-Referenz für `openclaw memory` (`status`/`index`/`search`/`promote`/`promote-explain`/`rem-harness`)
title: memory
x-i18n:
    generated_at: "2026-04-23T14:00:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Semantische Speicherindizierung und -suche verwalten.
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

- `--agent <id>`: auf einen einzelnen Agenten begrenzen. Ohne diese Option laufen diese Befehle für jeden konfigurierten Agenten; wenn keine Agentenliste konfiguriert ist, fällt dies auf den Standard-Agenten zurück.
- `--verbose`: detaillierte Logs während Probes und Indizierung ausgeben.

`memory status`:

- `--deep`: Verfügbarkeit von Vektoren und Embeddings prüfen.
- `--index`: eine Neuindizierung ausführen, wenn der Store dirty ist (impliziert `--deep`).
- `--fix`: veraltete Recall-Sperren reparieren und Promotion-Metadaten normalisieren.
- `--json`: JSON-Ausgabe ausgeben.

Wenn `memory status` `Dreaming status: blocked` anzeigt, ist der verwaltete Dreaming-Cron aktiviert, aber der Heartbeat, der ihn antreibt, feuert für den Standard-Agenten nicht. Siehe [Dreaming never runs](/de/concepts/dreaming#dreaming-never-runs-status-shows-blocked) für die zwei häufigen Ursachen.

`memory index`:

- `--force`: eine vollständige Neuindizierung erzwingen.

`memory search`:

- Query-Eingabe: entweder positionales `[query]` oder `--query <text>` übergeben.
- Wenn beide angegeben werden, hat `--query` Vorrang.
- Wenn keines von beiden angegeben wird, beendet sich der Befehl mit einem Fehler.
- `--agent <id>`: auf einen einzelnen Agenten begrenzen (Standard: der Standard-Agent).
- `--max-results <n>`: die Anzahl der zurückgegebenen Ergebnisse begrenzen.
- `--min-score <n>`: Treffer mit niedrigem Score herausfiltern.
- `--json`: JSON-Ergebnisse ausgeben.

`memory promote`:

Vorschau und Anwendung von Kurzzeitspeicher-Promotions.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- Promotions in `MEMORY.md` schreiben (Standard: nur Vorschau).
- `--limit <n>` -- die Anzahl der angezeigten Kandidaten begrenzen.
- `--include-promoted` -- Einträge einschließen, die bereits in früheren Zyklen übernommen wurden.

Vollständige Optionen:

- Bewertet Kurzzeitkandidaten aus `memory/YYYY-MM-DD.md` mithilfe gewichteter Promotionssignale (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Verwendet Kurzzeitsignale sowohl aus Memory-Recalls als auch aus Daily-Ingestion-Durchläufen sowie leichte/REM-Phasen-Verstärkungssignale.
- Wenn Dreaming aktiviert ist, verwaltet `memory-core` automatisch einen Cron-Job, der im Hintergrund einen vollständigen Durchlauf ausführt (`light -> REM -> deep`) (kein manuelles `openclaw cron add` erforderlich).
- `--agent <id>`: auf einen einzelnen Agenten begrenzen (Standard: der Standard-Agent).
- `--limit <n>`: maximale Anzahl an Kandidaten, die zurückgegeben/angewendet werden.
- `--min-score <n>`: minimaler gewichteter Promotions-Score.
- `--min-recall-count <n>`: minimale Recall-Anzahl, die für einen Kandidaten erforderlich ist.
- `--min-unique-queries <n>`: minimale Anzahl unterschiedlicher Queries, die für einen Kandidaten erforderlich ist.
- `--apply`: ausgewählte Kandidaten an `MEMORY.md` anhängen und als übernommen markieren.
- `--include-promoted`: bereits übernommene Kandidaten in die Ausgabe einschließen.
- `--json`: JSON-Ausgabe ausgeben.

`memory promote-explain`:

Einen bestimmten Promotionskandidaten und seine Score-Aufschlüsselung erklären.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: Kandidatenschlüssel, Pfadfragment oder Snippet-Fragment zur Suche.
- `--agent <id>`: auf einen einzelnen Agenten begrenzen (Standard: der Standard-Agent).
- `--include-promoted`: bereits übernommene Kandidaten einschließen.
- `--json`: JSON-Ausgabe ausgeben.

`memory rem-harness`:

REM-Reflexionen, Wahrheitskandidaten und Deep-Promotion-Ausgabe in der Vorschau anzeigen, ohne etwas zu schreiben.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: auf einen einzelnen Agenten begrenzen (Standard: der Standard-Agent).
- `--include-promoted`: bereits übernommene Deep-Kandidaten einschließen.
- `--json`: JSON-Ausgabe ausgeben.

## Dreaming

Dreaming ist das Hintergrundsystem zur Speicherkonsolidierung mit drei kooperativen
Phasen: **light** (Kurzzeitmaterial sortieren/stagen), **deep** (dauerhafte
Fakten in `MEMORY.md` übernehmen) und **REM** (reflektieren und Themen sichtbar machen).

- Aktivieren mit `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Per Chat umschalten mit `/dreaming on|off` (oder mit `/dreaming status` prüfen).
- Dreaming läuft nach einem verwalteten Sweep-Zeitplan (`dreaming.frequency`) und führt Phasen in dieser Reihenfolge aus: light, REM, deep.
- Nur die Deep-Phase schreibt dauerhaften Speicher in `MEMORY.md`.
- Für Menschen lesbare Phasenausgaben und Tagebucheinträge werden in `DREAMS.md` (oder vorhandenes `dreams.md`) geschrieben, mit optionalen Berichten pro Phase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Das Ranking verwendet gewichtete Signale: Recall-Häufigkeit, Abrufrelevanz, Query-Diversität, zeitliche Aktualität, tagesübergreifende Konsolidierung und abgeleiteten konzeptuellen Reichtum.
- Promotion liest die Live-Tagesnotiz vor dem Schreiben in `MEMORY.md` erneut, sodass bearbeitete oder gelöschte Kurzzeit-Snippets nicht aus veralteten Recall-Store-Snapshots übernommen werden.
- Geplante und manuelle `memory promote`-Läufe verwenden dieselben Standardwerte der Deep-Phase, sofern Sie keine CLI-Schwellenwert-Overrides übergeben.
- Automatische Läufe werden über konfigurierte Memory-Workspaces aufgefächert.

Standardplanung:

- **Sweep-Taktung**: `dreaming.frequency = 0 3 * * *`
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
- Wenn tatsächlich aktive Remote-API-Schlüsselfelder für Memory als SecretRefs konfiguriert sind, löst der Befehl diese Werte aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl schnell fehl.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlspfad erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Unknown-Method-Fehler zurück.
- Passen Sie die Taktung geplanter Sweeps mit `dreaming.frequency` an. Die Richtlinie für Deep-Promotion ist ansonsten intern; verwenden Sie CLI-Flags bei `memory promote`, wenn Sie einmalige manuelle Overrides benötigen.
- `memory rem-harness --path <file-or-dir> --grounded` zeigt fundierte `What Happened`, `Reflections` und `Possible Lasting Updates` aus historischen Tagesnotizen in der Vorschau an, ohne etwas zu schreiben.
- `memory rem-backfill --path <file-or-dir>` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md` zur Prüfung in der UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` speist außerdem fundierte dauerhafte Kandidaten in den Live-Kurzzeit-Promotion-Store ein, sodass die normale Deep-Phase sie bewerten kann.
- `memory rem-backfill --rollback` entfernt zuvor geschriebene fundierte Tagebucheinträge, und `memory rem-backfill --rollback-short-term` entfernt zuvor gestagte fundierte Kurzzeitkandidaten.
- Siehe [Dreaming](/de/concepts/dreaming) für vollständige Phasenbeschreibungen und die Configuration Reference.
