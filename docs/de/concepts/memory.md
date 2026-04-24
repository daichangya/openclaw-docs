---
read_when:
    - Sie möchten verstehen, wie Memory funktioniert
    - Sie möchten wissen, welche Memory-Dateien geschrieben werden sollen
summary: Wie OpenClaw sich Dinge über Sitzungen hinweg merkt
title: Memory-Übersicht
x-i18n:
    generated_at: "2026-04-24T06:34:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw merkt sich Dinge, indem es **einfache Markdown-Dateien** im
Workspace Ihres Agenten schreibt. Das Modell „erinnert“ sich nur an das, was auf
Datenträger gespeichert wird — es gibt keinen versteckten Zustand.

## Wie es funktioniert

Ihr Agent hat drei speicherbezogene Dateien:

- **`MEMORY.md`** — Langzeitspeicher. Dauerhafte Fakten, Präferenzen und
  Entscheidungen. Wird zu Beginn jeder DM-Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** — tägliche Notizen. Laufender Kontext und Beobachtungen.
  Die Notizen von heute und gestern werden automatisch geladen.
- **`DREAMS.md`** (optional) — Dream Diary und Zusammenfassungen von Dreaming-Durchläufen
  zur menschlichen Prüfung, einschließlich fundierter historischer Backfill-Einträge.

Diese Dateien befinden sich im Agent-Workspace (Standard `~/.openclaw/workspace`).

<Tip>
Wenn Ihr Agent sich etwas merken soll, sagen Sie es ihm einfach: „Remember that I
prefer TypeScript.“ Es schreibt es dann in die passende Datei.
</Tip>

## Memory-Tools

Der Agent hat zwei Tools für die Arbeit mit Memory:

- **`memory_search`** — findet relevante Notizen mit semantischer Suche, selbst wenn
  die Formulierung vom Original abweicht.
- **`memory_get`** — liest eine bestimmte Memory-Datei oder einen Zeilenbereich.

Beide Tools werden vom aktiven Memory-Plugin bereitgestellt (Standard: `memory-core`).

## Begleit-Plugin Memory Wiki

Wenn sich dauerhafte Memory eher wie eine gepflegte Wissensbasis als
nur wie rohe Notizen verhalten soll, verwenden Sie das gebündelte Plugin `memory-wiki`.

`memory-wiki` kompiliert dauerhaftes Wissen in einen Wiki-Vault mit:

- deterministischer Seitenstruktur
- strukturierten Behauptungen und Belegen
- Verfolgung von Widersprüchen und Aktualität
- generierten Dashboards
- kompilierten Digests für Agent-/Laufzeit-Konsumenten
- wiki-nativen Tools wie `wiki_search`, `wiki_get`, `wiki_apply` und `wiki_lint`

Es ersetzt nicht das aktive Memory-Plugin. Das aktive Memory-Plugin ist weiterhin
für Recall, Promotion und Dreaming zuständig. `memory-wiki` ergänzt daneben eine wissensschicht
mit Herkunftsnachweisen.

Siehe [Memory Wiki](/de/plugins/memory-wiki).

## Memory-Suche

Wenn ein Embedding-Provider konfiguriert ist, verwendet `memory_search` eine **hybride
Suche** — eine Kombination aus Vektorähnlichkeit (semantische Bedeutung) und Keyword-Matching
(exakte Begriffe wie IDs und Codesymbole). Das funktioniert sofort, sobald Sie
einen API-Schlüssel für einen unterstützten Provider haben.

<Info>
OpenClaw erkennt Ihren Embedding-Provider automatisch anhand verfügbarer API-Schlüssel. Wenn Sie
einen konfigurierten OpenAI-, Gemini-, Voyage- oder Mistral-Schlüssel haben, wird die Memory-Suche
automatisch aktiviert.
</Info>

Einzelheiten dazu, wie die Suche funktioniert, zu Tuning-Optionen und zur Provider-Einrichtung finden Sie unter
[Memory Search](/de/concepts/memory-search).

## Memory-Backends

<CardGroup cols={3}>
<Card title="Integriert (Standard)" icon="database" href="/de/concepts/memory-builtin">
SQLite-basiert. Funktioniert sofort mit Keyword-Suche, Vektorähnlichkeit und
hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/de/concepts/memory-qmd">
Local-first-Sidecar mit Reranking, Query-Erweiterung und der Möglichkeit,
Verzeichnisse außerhalb des Workspace zu indizieren.
</Card>
<Card title="Honcho" icon="brain" href="/de/concepts/memory-honcho">
KI-native sitzungsübergreifende Memory mit Benutzermodellierung, semantischer Suche und
Multi-Agent-Bewusstsein. Plugin-Installation.
</Card>
</CardGroup>

## Wissens-Wiki-Schicht

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/de/plugins/memory-wiki">
Kompiliert dauerhafte Memory in einen Wiki-Vault mit Herkunftsnachweisen, Behauptungen,
Dashboards, Bridge-Modus und Obsidian-freundlichen Workflows.
</Card>
</CardGroup>

## Automatisches Leeren von Memory

Bevor [Compaction](/de/concepts/compaction) Ihr Gespräch zusammenfasst, führt OpenClaw
einen stillen Turn aus, der den Agenten daran erinnert, wichtigen Kontext in Memory-Dateien zu speichern.
Dies ist standardmäßig aktiviert — Sie müssen nichts konfigurieren.

<Tip>
Das Leeren von Memory verhindert Kontextverlust während der Compaction. Wenn Ihr Agent
wichtige Fakten im Gespräch hat, die noch nicht in eine Datei geschrieben wurden,
werden sie automatisch gespeichert, bevor die Zusammenfassung erfolgt.
</Tip>

## Dreaming

Dreaming ist ein optionaler Hintergrunddurchlauf zur Konsolidierung von Memory. Er sammelt
kurzfristige Signale, bewertet Kandidaten und befördert nur qualifizierte Einträge in den
Langzeitspeicher (`MEMORY.md`).

Es ist darauf ausgelegt, den Langzeitspeicher signalstark zu halten:

- **Opt-in**: standardmäßig deaktiviert.
- **Geplant**: wenn aktiviert, verwaltet `memory-core` automatisch einen wiederkehrenden Cron-Job
  für einen vollständigen Dreaming-Durchlauf.
- **Mit Schwellenwerten**: Promotionen müssen Gates für Score, Recall-Häufigkeit und Query-
  Diversität bestehen.
- **Prüfbar**: Phasenzusammenfassungen und Diary-Einträge werden zur menschlichen Prüfung in `DREAMS.md`
  geschrieben.

Informationen zu Phasenverhalten, Bewertungssignalen und Dream-Diary-Details finden Sie unter
[Dreaming](/de/concepts/dreaming).

## Fundierter Backfill und Live-Promotion

Das Dreaming-System hat jetzt zwei eng verwandte Prüfpfade:

- **Live Dreaming** arbeitet aus dem kurzfristigen Dreaming-Speicher unter
  `memory/.dreams/` und ist das, was die normale tiefe Phase verwendet, wenn entschieden wird, was
  in `MEMORY.md` übernommen werden kann.
- **Grounded Backfill** liest historische Notizen `memory/YYYY-MM-DD.md` als
  eigenständige Tagesdateien und schreibt strukturierte Prüfausgaben in `DREAMS.md`.

Grounded Backfill ist nützlich, wenn Sie ältere Notizen erneut abspielen und prüfen möchten, was
das System für dauerhaft hält, ohne `MEMORY.md` manuell zu bearbeiten.

Wenn Sie Folgendes verwenden:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

werden die fundierten dauerhaften Kandidaten nicht direkt übernommen. Sie werden in denselben
kurzfristigen Dreaming-Speicher gestaged, den die normale tiefe Phase bereits verwendet. Das
bedeutet:

- `DREAMS.md` bleibt die Oberfläche für die menschliche Prüfung.
- der kurzfristige Speicher bleibt die maschinenseitige Oberfläche für Ranking.
- `MEMORY.md` wird weiterhin nur durch tiefe Promotion geschrieben.

Wenn Sie entscheiden, dass die Wiederholung nicht nützlich war, können Sie die gestagten Artefakte
entfernen, ohne gewöhnliche Diary-Einträge oder den normalen Recall-Status zu berühren:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Indexstatus und Provider prüfen
openclaw memory search "query"  # Über die Befehlszeile suchen
openclaw memory index --force   # Index neu aufbauen
```

## Weiterführende Lektüre

- [Builtin Memory Engine](/de/concepts/memory-builtin) — Standard-Backend auf SQLite-Basis
- [QMD Memory Engine](/de/concepts/memory-qmd) — erweiterter Local-first-Sidecar
- [Honcho Memory](/de/concepts/memory-honcho) — KI-native sitzungsübergreifende Memory
- [Memory Wiki](/de/plugins/memory-wiki) — kompilierter Wissens-Vault und wiki-native Tools
- [Memory Search](/de/concepts/memory-search) — Suchpipeline, Provider und
  Tuning
- [Dreaming](/de/concepts/dreaming) — Hintergrund-Promotion
  von kurzfristigem Recall zu Langzeitspeicher
- [Konfigurationsreferenz für Memory](/de/reference/memory-config) — alle Konfigurationsschalter
- [Compaction](/de/concepts/compaction) — wie Compaction mit Memory interagiert

## Verwandt

- [Active Memory](/de/concepts/active-memory)
- [Memory Search](/de/concepts/memory-search)
- [Builtin Memory Engine](/de/concepts/memory-builtin)
- [Honcho Memory](/de/concepts/memory-honcho)
