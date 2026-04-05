---
read_when:
    - Sie möchten semantischen Speicher indizieren oder durchsuchen
    - Sie debuggen Speicherverfügbarkeit oder Indizierung
    - Sie möchten abgerufenen Kurzzeitspeicher in `MEMORY.md` übernehmen
summary: CLI-Referenz für `openclaw memory` (Status/Index/Suche/Promote)
title: memory
x-i18n:
    generated_at: "2026-04-05T12:38:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a89e3a819737bb63521128ae63d9e25b5cd9db35c3ea4606d087a8ad48b41eab
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Verwalten Sie die Indizierung und Suche des semantischen Speichers.
Bereitgestellt durch das aktive Speicher-Plugin (Standard: `memory-core`; setzen Sie `plugins.slots.memory = "none"`, um es zu deaktivieren).

Verwandt:

- Speicherkonzept: [Memory](/concepts/memory)
- Plugins: [Plugins](/tools/plugin)

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
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Optionen

`memory status` und `memory index`:

- `--agent <id>`: auf einen einzelnen Agent begrenzen. Ohne diese Option laufen diese Befehle für jeden konfigurierten Agent; wenn keine Agent-Liste konfiguriert ist, greifen sie auf den Standard-Agent zurück.
- `--verbose`: detaillierte Logs während Prüfungen und Indizierung ausgeben.

`memory status`:

- `--deep`: Verfügbarkeit von Vektoren + Embeddings prüfen.
- `--index`: eine Neuindizierung ausführen, wenn der Speicher verunreinigt ist (impliziert `--deep`).
- `--fix`: veraltete Recall-Sperren reparieren und Promote-Metadaten normalisieren.
- `--json`: JSON-Ausgabe ausgeben.

`memory index`:

- `--force`: eine vollständige Neuindizierung erzwingen.

`memory search`:

- Abfrageeingabe: entweder positional `[query]` oder `--query <text>` übergeben.
- Wenn beide angegeben werden, hat `--query` Vorrang.
- Wenn keines von beiden angegeben wird, beendet sich der Befehl mit einem Fehler.
- `--agent <id>`: auf einen einzelnen Agent begrenzen (Standard: der Standard-Agent).
- `--max-results <n>`: die Anzahl der zurückgegebenen Ergebnisse begrenzen.
- `--min-score <n>`: Treffer mit niedrigem Score herausfiltern.
- `--json`: JSON-Ergebnisse ausgeben.

`memory promote`:

Kurzzeitspeicher-Promotions anzeigen und anwenden.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- Promotions in `MEMORY.md` schreiben (Standard: nur Vorschau).
- `--limit <n>` -- die Anzahl der angezeigten Kandidaten begrenzen.
- `--include-promoted` -- Einträge einschließen, die in früheren Durchläufen bereits übernommen wurden.

Vollständige Optionen:

- Bewertet Kurzzeitkandidaten aus `memory/YYYY-MM-DD.md` anhand gewichteter Recall-Signale (`frequency`, `relevance`, `query diversity`, `recency`).
- Verwendet Recall-Ereignisse, die erfasst werden, wenn `memory_search` Treffer aus dem Tagesspeicher zurückgibt.
- Optionaler Auto-Dreaming-Modus: wenn `plugins.entries.memory-core.config.dreaming.mode` auf `core`, `deep` oder `rem` gesetzt ist, verwaltet `memory-core` automatisch einen Cron-Job, der die Promotion im Hintergrund auslöst (kein manuelles `openclaw cron add` erforderlich).
- `--agent <id>`: auf einen einzelnen Agent begrenzen (Standard: der Standard-Agent).
- `--limit <n>`: maximale Anzahl der zurückzugebenden/anzuwendenden Kandidaten.
- `--min-score <n>`: minimaler gewichteter Promote-Score.
- `--min-recall-count <n>`: minimale Recall-Anzahl, die für einen Kandidaten erforderlich ist.
- `--min-unique-queries <n>`: minimale Anzahl unterschiedlicher Abfragen, die für einen Kandidaten erforderlich ist.
- `--apply`: ausgewählte Kandidaten an `MEMORY.md` anhängen und als übernommen markieren.
- `--include-promoted`: bereits übernommene Kandidaten in die Ausgabe einschließen.
- `--json`: JSON-Ausgabe ausgeben.

## Dreaming (experimentell)

Dreaming ist der nächtliche Reflexionsdurchlauf für den Speicher. Er heißt „dreaming“, weil das System erneut betrachtet, was tagsüber abgerufen wurde, und entscheidet, was es wert ist, langfristig behalten zu werden.

- Es ist optional und standardmäßig deaktiviert.
- Aktivieren Sie es mit `plugins.entries.memory-core.config.dreaming.mode`.
- Sie können Modi im Chat mit `/dreaming off|core|rem|deep` umschalten. Führen Sie `/dreaming` (oder `/dreaming options`) aus, um zu sehen, was die einzelnen Modi tun.
- Wenn aktiviert, erstellt und verwaltet `memory-core` automatisch einen verwalteten Cron-Job.
- Setzen Sie `dreaming.limit` auf `0`, wenn Sie Dreaming aktiviert lassen möchten, die automatische Promotion aber effektiv pausieren möchten.
- Die Bewertung verwendet gewichtete Signale: Recall-Häufigkeit, Abrufrelevanz, Abfragevielfalt und zeitliche Aktualität (aktuelle Recalls bauen sich im Lauf der Zeit ab).
- Die Übernahme in `MEMORY.md` erfolgt nur, wenn Qualitätsschwellen erreicht werden, damit der Langzeitspeicher signalstark bleibt, statt einmalige Details zu sammeln.

Standard-Voreinstellungen der Modi:

- `core`: täglich um `0 3 * * *`, `minScore=0.75`, `minRecallCount=3`, `minUniqueQueries=2`
- `deep`: alle 12 Stunden (`0 */12 * * *`), `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`
- `rem`: alle 6 Stunden (`0 */6 * * *`), `minScore=0.85`, `minRecallCount=4`, `minUniqueQueries=3`

Beispiel:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
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
- Wenn effektiv aktive entfernte API-Schlüsselfelder für den Speicher als SecretRefs konfiguriert sind, löst der Befehl diese Werte aus dem aktiven Gateway-Snapshot auf. Wenn das Gateway nicht verfügbar ist, schlägt der Befehl sofort fehl.
- Hinweis zu Gateway-Versionsabweichungen: Dieser Befehlsweg erfordert ein Gateway, das `secrets.resolve` unterstützt; ältere Gateways geben einen Fehler wegen unbekannter Methode zurück.
- Die Dreaming-Taktung verwendet standardmäßig den voreingestellten Zeitplan des jeweiligen Modus. Überschreiben Sie die Taktung mit `plugins.entries.memory-core.config.dreaming.frequency` als Cron-Ausdruck (zum Beispiel `0 3 * * *`) und passen Sie sie mit `timezone`, `limit`, `minScore`, `minRecallCount` und `minUniqueQueries` fein an.
