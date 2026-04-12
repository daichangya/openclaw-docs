---
read_when:
    - Sie möchten dauerhaftes Wissen, das über einfache `MEMORY.md`-Notizen hinausgeht.
    - Sie konfigurieren das gebündelte memory-wiki-Plugin.
    - Sie möchten `wiki_search`, `wiki_get` oder den Bridge-Modus verstehen.
summary: 'memory-wiki: kompilierter Wissensspeicher mit Herkunftsnachweisen, Claims, Dashboards und Bridge-Modus'
title: Memory Wiki
x-i18n:
    generated_at: "2026-04-12T23:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44d168a7096f744c56566ecac57499192eb101b4dd8a78e1b92f3aa0d6da3ad1
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Memory Wiki

`memory-wiki` ist ein gebündeltes Plugin, das dauerhaftes Memory in einen kompilierten
Wissensspeicher verwandelt.

Es ersetzt **nicht** das aktive Memory-Plugin. Das aktive Memory-Plugin bleibt weiterhin
für Recall, Promotion, Indexing und Dreaming zuständig. `memory-wiki` existiert daneben
und kompiliert dauerhaftes Wissen in ein navigierbares Wiki mit deterministischen Seiten,
strukturierten Claims, Herkunftsnachweisen, Dashboards und maschinenlesbaren Digests.

Verwenden Sie es, wenn Memory sich eher wie eine gepflegte Wissensschicht und
weniger wie ein Stapel von Markdown-Dateien verhalten soll.

## Was es hinzufügt

- Einen dedizierten Wiki-Speicher mit deterministischem Seitenlayout
- Strukturierte Claim- und Evidenz-Metadaten statt nur Prosa
- Herkunftsnachweise, Konfidenz, Widersprüche und offene Fragen auf Seitenebene
- Kompilierte Digests für Agent-/Laufzeit-Consumer
- Wiki-native `search`-/`get`-/`apply`-/`lint`-Tools
- Optionalen Bridge-Modus, der öffentliche Artefakte aus dem aktiven Memory-Plugin importiert
- Optionalen Obsidian-freundlichen Render-Modus und CLI-Integration

## Wie es zu Memory passt

Stellen Sie sich die Aufteilung so vor:

| Ebene                                                   | Zuständig für                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Aktives Memory-Plugin (`memory-core`, QMD, Honcho usw.) | Recall, semantische Suche, Promotion, Dreaming, Memory-Laufzeit                           |
| `memory-wiki`                                           | Kompilierte Wiki-Seiten, Synthesen mit Herkunftsnachweisen, Dashboards, wiki-spezifisches search/get/apply |

Wenn das aktive Memory-Plugin gemeinsame Recall-Artefakte bereitstellt, kann OpenClaw
beide Ebenen in einem Durchgang mit `memory_search corpus=all` durchsuchen.

Wenn Sie wiki-spezifisches Ranking, Herkunftsnachweise oder direkten Seitenzugriff
benötigen, verwenden Sie stattdessen die wiki-nativen Tools.

## Empfohlenes Hybridmuster

Ein starkes Standardmuster für lokale Setups ist:

- QMD als aktives Memory-Backend für Recall und breite semantische Suche
- `memory-wiki` im `bridge`-Modus für dauerhafte, synthetisierte Wissensseiten

Diese Aufteilung funktioniert gut, weil jede Ebene fokussiert bleibt:

- QMD hält rohe Notizen, Sitzungs-Exporte und zusätzliche Sammlungen durchsuchbar
- `memory-wiki` kompiliert stabile Entitäten, Claims, Dashboards und Quellseiten

Praktische Regel:

- Verwenden Sie `memory_search`, wenn Sie einen breiten Recall-Durchgang über Memory möchten
- Verwenden Sie `wiki_search` und `wiki_get`, wenn Sie wiki-bewusste Ergebnisse mit Herkunftsnachweisen möchten
- Verwenden Sie `memory_search corpus=all`, wenn die gemeinsame Suche beide Ebenen umfassen soll

Wenn der Bridge-Modus null exportierte Artefakte meldet, stellt das aktive Memory-Plugin
derzeit noch keine öffentlichen Bridge-Eingaben bereit. Führen Sie zuerst `openclaw wiki doctor` aus
und prüfen Sie dann, ob das aktive Memory-Plugin öffentliche Artefakte unterstützt.

## Speicher-Modi

`memory-wiki` unterstützt drei Speicher-Modi:

### `isolated`

Eigener Speicher, eigene Quellen, keine Abhängigkeit von `memory-core`.

Verwenden Sie dies, wenn das Wiki ein eigener kuratierter Wissensspeicher sein soll.

### `bridge`

Liest öffentliche Memory-Artefakte und Memory-Ereignisse aus dem aktiven Memory-Plugin
über öffentliche Plugin-SDK-Schnittstellen.

Verwenden Sie dies, wenn das Wiki die exportierten Artefakte des Memory-Plugins
kompilieren und organisieren soll, ohne auf private Plugin-Interna zuzugreifen.

Der Bridge-Modus kann Folgendes indexieren:

- exportierte Memory-Artefakte
- Dream-Reports
- tägliche Notizen
- Dateien im Memory-Root
- Memory-Ereignislogs

### `unsafe-local`

Explizite Escape-Hatch auf demselben Rechner für lokale private Pfade.

Dieser Modus ist absichtlich experimentell und nicht portabel. Verwenden Sie ihn nur,
wenn Sie die Vertrauensgrenze verstehen und gezielt lokalen Dateisystemzugriff benötigen,
den der Bridge-Modus nicht bereitstellen kann.

## Speicher-Layout

Das Plugin initialisiert einen Speicher wie folgt:

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

Verwaltete Inhalte bleiben innerhalb generierter Blöcke. Von Menschen geschriebene Notizblöcke bleiben erhalten.

Die Hauptseitengruppen sind:

- `sources/` für importiertes Rohmaterial und Bridge-gestützte Seiten
- `entities/` für dauerhafte Dinge, Personen, Systeme, Projekte und Objekte
- `concepts/` für Ideen, Abstraktionen, Muster und Richtlinien
- `syntheses/` für kompilierte Zusammenfassungen und gepflegte Rollups
- `reports/` für generierte Dashboards

## Strukturierte Claims und Evidenz

Seiten können strukturierte `claims` im Frontmatter tragen, nicht nur Freitext.

Jeder Claim kann Folgendes enthalten:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Evidenz-Einträge können Folgendes enthalten:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Dadurch verhält sich das Wiki eher wie eine Belief-Schicht als wie ein passiver
Notiz-Dump. Claims können verfolgt, bewertet, angefochten und auf Quellen zurückgeführt werden.

## Compile-Pipeline

Der Compile-Schritt liest Wiki-Seiten, normalisiert Zusammenfassungen und erzeugt stabile,
maschinenorientierte Artefakte unter:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Diese Digests existieren, damit Agenten und Laufzeitcode keine Markdown-Seiten
parsen müssen.

Kompilierte Ausgaben unterstützen außerdem:

- erste Wiki-Indexierung für `search`-/`get`-Abläufe
- Claim-ID-Lookup zurück zur besitzenden Seite
- kompakte Prompt-Ergänzungen
- Report-/Dashboard-Generierung

## Dashboards und Zustandsberichte

Wenn `render.createDashboards` aktiviert ist, pflegt `compile` Dashboards unter `reports/`.

Integrierte Reports umfassen:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Diese Reports verfolgen beispielsweise:

- Cluster von Widerspruchsnotizen
- konkurrierende Claim-Cluster
- Claims ohne strukturierte Evidenz
- Seiten und Claims mit niedriger Konfidenz
- veraltete oder unbekannte Aktualität
- Seiten mit ungelösten Fragen

## Suche und Abruf

`memory-wiki` unterstützt zwei Such-Backends:

- `shared`: verwendet den gemeinsamen Memory-Suchablauf, wenn verfügbar
- `local`: durchsucht das Wiki lokal

Es unterstützt außerdem drei Corpora:

- `wiki`
- `memory`
- `all`

Wichtiges Verhalten:

- `wiki_search` und `wiki_get` verwenden nach Möglichkeit kompilierte Digests als ersten Schritt
- Claim-IDs können zurück zur besitzenden Seite aufgelöst werden
- angefochtene/veraltete/aktuelle Claims beeinflussen das Ranking
- Provenance-Labels können in den Ergebnissen erhalten bleiben

Praktische Regel:

- Verwenden Sie `memory_search corpus=all` für einen breiten Recall-Durchgang
- Verwenden Sie `wiki_search` + `wiki_get`, wenn wiki-spezifisches Ranking,
  Herkunftsnachweise oder eine seitenbasierte Belief-Struktur wichtig sind

## Agent-Tools

Das Plugin registriert diese Tools:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Was sie tun:

- `wiki_status`: aktueller Speicher-Modus, Zustand, Verfügbarkeit der Obsidian-CLI
- `wiki_search`: durchsucht Wiki-Seiten und, wenn konfiguriert, gemeinsame Memory-Corpora
- `wiki_get`: liest eine Wiki-Seite per ID/Pfad oder greift ersatzweise auf das gemeinsame Memory-Corpus zu
- `wiki_apply`: enge Synthese-/Metadaten-Mutationen ohne freie Seitenchirurgie
- `wiki_lint`: Strukturprüfungen, Provenance-Lücken, Widersprüche, offene Fragen

Das Plugin registriert außerdem eine nicht-exklusive Ergänzung für Memory-Corpora, sodass gemeinsames
`memory_search` und `memory_get` das Wiki erreichen können, wenn das aktive Memory-Plugin
Corpus-Auswahl unterstützt.

## Prompt- und Kontextverhalten

Wenn `context.includeCompiledDigestPrompt` aktiviert ist, hängen Memory-Prompt-Abschnitte
einen kompakten kompilierten Snapshot aus `agent-digest.json` an.

Dieser Snapshot ist absichtlich klein und signalstark:

- nur die wichtigsten Seiten
- nur die wichtigsten Claims
- Anzahl der Widersprüche
- Anzahl der Fragen
- Konfidenz-/Aktualitätsqualifikatoren

Dies ist Opt-in, weil es die Form des Prompts verändert und vor allem für Kontext-Engines
oder die Legacy-Prompt-Zusammenstellung nützlich ist, die Memory-Ergänzungen explizit verwenden.

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

Wichtige Schalter:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` oder `obsidian`
- `bridge.readMemoryArtifacts`: importiert öffentliche Artefakte des aktiven Memory-Plugins
- `bridge.followMemoryEvents`: schließt Ereignislogs im Bridge-Modus ein
- `search.backend`: `shared` oder `local`
- `search.corpus`: `wiki`, `memory` oder `all`
- `context.includeCompiledDigestPrompt`: hängt einen kompakten Digest-Snapshot an Memory-Prompt-Abschnitte an
- `render.createBacklinks`: generiert deterministische Related-Blöcke
- `render.createDashboards`: generiert Dashboard-Seiten

### Beispiel: QMD + Bridge-Modus

Verwenden Sie dies, wenn Sie QMD für Recall und `memory-wiki` für eine gepflegte
Wissensschicht verwenden möchten:

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

Damit bleibt:

- QMD für aktiven Memory-Recall zuständig
- `memory-wiki` auf kompilierte Seiten und Dashboards fokussiert
- die Prompt-Form unverändert, bis Sie kompilierte Digest-Prompts bewusst aktivieren

## CLI

`memory-wiki` stellt außerdem eine Top-Level-CLI-Oberfläche bereit:

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

Siehe [CLI: wiki](/cli/wiki) für die vollständige Befehlsreferenz.

## Obsidian-Unterstützung

Wenn `vault.renderMode` auf `obsidian` gesetzt ist, schreibt das Plugin Obsidian-freundliches
Markdown und kann optional die offizielle `obsidian`-CLI verwenden.

Unterstützte Abläufe umfassen:

- Statusprüfung
- Speicher-Suche
- Öffnen einer Seite
- Aufrufen eines Obsidian-Befehls
- Springen zur täglichen Notiz

Dies ist optional. Das Wiki funktioniert auch im nativen Modus ohne Obsidian.

## Empfohlener Workflow

1. Behalten Sie Ihr aktives Memory-Plugin für Recall/Promotion/Dreaming.
2. Aktivieren Sie `memory-wiki`.
3. Beginnen Sie mit dem Modus `isolated`, es sei denn, Sie möchten ausdrücklich den Bridge-Modus.
4. Verwenden Sie `wiki_search` / `wiki_get`, wenn Herkunftsnachweise wichtig sind.
5. Verwenden Sie `wiki_apply` für enge Synthesen oder Metadaten-Updates.
6. Führen Sie `wiki_lint` nach sinnvollen Änderungen aus.
7. Aktivieren Sie Dashboards, wenn Sie Sichtbarkeit für Veraltetheit/Widersprüche möchten.

## Verwandte Dokumente

- [Memory-Überblick](/de/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Überblick über das Plugin SDK](/de/plugins/sdk-overview)
