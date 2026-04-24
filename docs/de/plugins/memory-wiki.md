---
read_when:
    - Sie möchten dauerhaftes Wissen über einfache MEMORY.md-Notizen hinaus
    - Sie konfigurieren das gebündelte Plugin memory-wiki
    - Sie möchten wiki_search, wiki_get oder den Bridge-Modus verstehen
summary: 'memory-wiki: kompilierter Wissensspeicher mit Herkunft, Claims, Dashboards und Bridge-Modus'
title: Memory-Wiki
x-i18n:
    generated_at: "2026-04-24T06:50:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` ist ein gebündeltes Plugin, das dauerhaftes Memory in einen kompilierten
Wissensspeicher verwandelt.

Es ersetzt **nicht** das Active-Memory-Plugin. Das Active-Memory-Plugin verwaltet weiterhin
Recall, Promotion, Indexierung und Dreaming. `memory-wiki` sitzt daneben
und kompiliert dauerhaftes Wissen in ein navigierbares Wiki mit deterministischen Seiten,
strukturierten Claims, Herkunft, Dashboards und maschinenlesbaren Digests.

Verwenden Sie es, wenn Sie möchten, dass sich Memory eher wie eine gepflegte Wissensschicht verhält und
weniger wie ein Haufen Markdown-Dateien.

## Was es hinzufügt

- Einen dedizierten Wiki-Speicher mit deterministischem Seitenlayout
- Strukturierte Metadaten für Claims und Evidenz, nicht nur Fließtext
- Herkunft, Konfidenz, Widersprüche und offene Fragen auf Seitenebene
- Kompilierte Digests für Agent-/Runtime-Konsumenten
- Wiki-native Tools für Suche/Abruf/Apply/Lint
- Optionalen Bridge-Modus, der öffentliche Artefakte aus dem Active-Memory-Plugin importiert
- Optionalen Obsidian-freundlichen Render-Modus und CLI-Integration

## Wie es zu Memory passt

Betrachten Sie die Aufteilung so:

| Ebene                                                   | Verwaltet                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active-Memory-Plugin (`memory-core`, QMD, Honcho usw.)  | Recall, semantische Suche, Promotion, Dreaming, Memory-Runtime                            |
| `memory-wiki`                                           | Kompilierte Wiki-Seiten, synthesen mit starker Herkunft, Dashboards, wiki-spezifische Suche/Abruf/Apply |

Wenn das Active-Memory-Plugin gemeinsame Recall-Artefakte bereitstellt, kann OpenClaw
beide Ebenen in einem Durchlauf mit `memory_search corpus=all` durchsuchen.

Wenn Sie wiki-spezifisches Ranking, Herkunft oder direkten Seitenzugriff benötigen, verwenden Sie stattdessen die wiki-nativen Tools.

## Empfohlenes Hybridmuster

Ein starkes Standardmuster für lokale Setups ist:

- QMD als Active-Memory-Backend für Recall und breite semantische Suche
- `memory-wiki` im Modus `bridge` für dauerhaft synthetisierte Wissensseiten

Diese Aufteilung funktioniert gut, weil jede Ebene fokussiert bleibt:

- QMD hält rohe Notizen, Sitzungs-Exporte und zusätzliche Sammlungen durchsuchbar
- `memory-wiki` kompiliert stabile Entitäten, Claims, Dashboards und Quellseiten

Praktische Regel:

- Verwenden Sie `memory_search`, wenn Sie einen breiten Recall-Durchlauf über Memory möchten
- Verwenden Sie `wiki_search` und `wiki_get`, wenn Sie provenance-bewusste Wiki-Ergebnisse möchten
- Verwenden Sie `memory_search corpus=all`, wenn die gemeinsame Suche beide Ebenen umfassen soll

Wenn der Bridge-Modus null exportierte Artefakte meldet, stellt das Active-Memory-Plugin
derzeit noch keine öffentlichen Bridge-Eingaben bereit. Führen Sie zuerst `openclaw wiki doctor` aus und prüfen Sie dann, ob das Active-Memory-Plugin öffentliche Artefakte unterstützt.

## Vault-Modi

`memory-wiki` unterstützt drei Vault-Modi:

### `isolated`

Eigener Vault, eigene Quellen, keine Abhängigkeit von `memory-core`.

Verwenden Sie dies, wenn das Wiki ein eigener kuratierter Wissensspeicher sein soll.

### `bridge`

Liest öffentliche Memory-Artefakte und Memory-Ereignisse aus dem Active-Memory-Plugin
über öffentliche Plugin-SDK-Seams.

Verwenden Sie dies, wenn das Wiki die exportierten Artefakte des Memory-Plugins kompilieren und organisieren soll,
ohne auf private Plugin-Interna zuzugreifen.

Der Bridge-Modus kann indexieren:

- exportierte Memory-Artefakte
- Dream-Berichte
- tägliche Notizen
- Dateien im Memory-Root
- Memory-Ereignisprotokolle

### `unsafe-local`

Explizite Escape-Hatch auf derselben Maschine für lokale private Pfade.

Dieser Modus ist absichtlich experimentell und nicht portabel. Verwenden Sie ihn nur, wenn Sie
die Vertrauensgrenze verstehen und gezielt lokalen Dateisystemzugriff benötigen, den
der Bridge-Modus nicht bereitstellen kann.

## Vault-Layout

Das Plugin initialisiert einen Vault wie folgt:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Verwalteter Inhalt bleibt innerhalb generierter Blöcke. Blöcke für menschliche Notizen bleiben erhalten.

Die wichtigsten Seitengruppen sind:

- `sources/` für importiertes Rohmaterial und Bridge-gestützte Seiten
- `entities/` für dauerhafte Dinge, Personen, Systeme, Projekte und Objekte
- `concepts/` für Ideen, Abstraktionen, Muster und Richtlinien
- `syntheses/` für kompilierte Zusammenfassungen und gepflegte Rollups
- `reports/` für generierte Dashboards

## Strukturierte Claims und Evidenz

Seiten können strukturierte `claims` im Frontmatter enthalten, nicht nur Freitext.

Jeder Claim kann enthalten:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Evidenz-Einträge können enthalten:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Dadurch verhält sich das Wiki eher wie eine Schicht von Überzeugungen als wie ein passiver Notiz-
Dump. Claims können verfolgt, bewertet, angefochten und auf Quellen zurückgeführt werden.

## Compile-Pipeline

Der Schritt zum Kompilieren liest Wiki-Seiten, normalisiert Zusammenfassungen und erzeugt stabile
maschinenorientierte Artefakte unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Diese Digests existieren, damit Agenten und Runtime-Code keine Markdown-
Seiten scrapen müssen.

Kompilierte Ausgabe treibt außerdem an:

- erste Wiki-Indexierung für Such-/Abruf-Abläufe
- Claim-ID-Lookup zurück zur besitzenden Seite
- kompakte Prompt-Ergänzungen
- Bericht-/Dashboard-Generierung

## Dashboards und Health-Reports

Wenn `render.createDashboards` aktiviert ist, pflegt compile Dashboards unter `reports/`.

Integrierte Reports umfassen:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Diese Reports verfolgen Dinge wie:

- Cluster mit Hinweisen auf Widersprüche
- konkurrierende Claim-Cluster
- Claims ohne strukturierte Evidenz
- Seiten und Claims mit niedriger Konfidenz
- veraltete oder unbekannte Aktualität
- Seiten mit ungelösten Fragen

## Suche und Abruf

`memory-wiki` unterstützt zwei Such-Backends:

- `shared`: verwendet den gemeinsamen Memory-Suchablauf, wenn verfügbar
- `local`: durchsucht das Wiki lokal

Es unterstützt außerdem drei Korpora:

- `wiki`
- `memory`
- `all`

Wichtiges Verhalten:

- `wiki_search` und `wiki_get` verwenden nach Möglichkeit kompilierte Digests als ersten Durchgang
- Claim-IDs können zurück zur besitzenden Seite aufgelöst werden
- angefochtene/veraltete/aktuelle Claims beeinflussen das Ranking
- Herkunftsbezeichnungen können in Ergebnisse übernommen werden

Praktische Regel:

- Verwenden Sie `memory_search corpus=all` für einen breiten Recall-Durchlauf
- Verwenden Sie `wiki_search` + `wiki_get`, wenn Ihnen wiki-spezifisches Ranking,
  Herkunft oder die Überzeugungsstruktur auf Seitenebene wichtig ist

## Agenten-Tools

Das Plugin registriert diese Tools:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Was sie tun:

- `wiki_status`: aktueller Vault-Modus, Health, Verfügbarkeit der Obsidian-CLI
- `wiki_search`: durchsucht Wiki-Seiten und, wenn konfiguriert, gemeinsame Memory-Korpora
- `wiki_get`: liest eine Wiki-Seite nach ID/Pfad oder greift auf ein gemeinsames Memory-Korpus zurück
- `wiki_apply`: enge Synthese-/Metadaten-Mutationen ohne freiformige Seitenchirurgie
- `wiki_lint`: strukturelle Prüfungen, Herkunftslücken, Widersprüche, offene Fragen

Das Plugin registriert außerdem eine nicht exklusive Ergänzung für Memory-Korpora, sodass gemeinsames
`memory_search` und `memory_get` das Wiki erreichen können, wenn das Active-Memory-
Plugin Korpusauswahl unterstützt.

## Verhalten von Prompt und Kontext

Wenn `context.includeCompiledDigestPrompt` aktiviert ist, hängen Memory-Prompt-Abschnitte
einen kompakten kompilierten Snapshot aus `agent-digest.json` an.

Dieser Snapshot ist absichtlich klein und signalstark:

- nur Top-Seiten
- nur Top-Claims
- Anzahl der Widersprüche
- Anzahl der Fragen
- Qualifikatoren für Konfidenz/Aktualität

Dies ist Opt-in, weil es die Form des Prompt ändert und hauptsächlich für Kontext-
Engines oder Legacy-Prompt-Erstellung nützlich ist, die explizit Memory-Ergänzungen verwenden.

## Konfiguration

Legen Sie die Konfiguration unter `plugins.entries.memory-wiki.config` ab:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Wichtige Umschalter:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` oder `obsidian`
- `bridge.readMemoryArtifacts`: öffentliche Artefakte des Active-Memory-Plugins importieren
- `bridge.followMemoryEvents`: Ereignisprotokolle im Bridge-Modus einbeziehen
- `search.backend`: `shared` oder `local`
- `search.corpus`: `wiki`, `memory` oder `all`
- `context.includeCompiledDigestPrompt`: kompakten Digest-Snapshot an Memory-Prompt-Abschnitte anhängen
- `render.createBacklinks`: deterministische Related-Blöcke erzeugen
- `render.createDashboards`: Dashboard-Seiten erzeugen

### Beispiel: QMD + Bridge-Modus

Verwenden Sie dies, wenn Sie QMD für Recall und `memory-wiki` für eine gepflegte
Wissensschicht möchten:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Dadurch bleibt:

- QMD zuständig für Recall im Active Memory
- `memory-wiki` fokussiert auf kompilierte Seiten und Dashboards
- die Form des Prompt unverändert, bis Sie Digest-Prompts bewusst aktivieren

## CLI

`memory-wiki` stellt außerdem eine CLI-Oberfläche auf oberster Ebene bereit:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Die vollständige Befehlsreferenz finden Sie unter [CLI: wiki](/de/cli/wiki).

## Obsidian-Unterstützung

Wenn `vault.renderMode` auf `obsidian` gesetzt ist, schreibt das Plugin Obsidian-freundliches
Markdown und kann optional die offizielle `obsidian` CLI verwenden.

Unterstützte Workflows umfassen:

- Status-Probing
- Vault-Suche
- Öffnen einer Seite
- Aufrufen eines Obsidian-Befehls
- Springen zur täglichen Notiz

Dies ist optional. Das Wiki funktioniert weiterhin im nativen Modus ohne Obsidian.

## Empfohlener Workflow

1. Behalten Sie Ihr Active-Memory-Plugin für Recall/Promotion/Dreaming.
2. Aktivieren Sie `memory-wiki`.
3. Beginnen Sie mit dem Modus `isolated`, sofern Sie nicht ausdrücklich den Bridge-Modus möchten.
4. Verwenden Sie `wiki_search` / `wiki_get`, wenn Herkunft wichtig ist.
5. Verwenden Sie `wiki_apply` für enge Synthesen oder Metadatenaktualisierungen.
6. Führen Sie `wiki_lint` nach sinnvollen Änderungen aus.
7. Aktivieren Sie Dashboards, wenn Sie Sichtbarkeit für veraltete Inhalte/Widersprüche möchten.

## Verwandte Dokumente

- [Memory-Überblick](/de/concepts/memory)
- [CLI: memory](/de/cli/memory)
- [CLI: wiki](/de/cli/wiki)
- [Überblick über das Plugin SDK](/de/plugins/sdk-overview)
