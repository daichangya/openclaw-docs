---
read_when:
    - Sie verstehen möchten, wie Speicher funktioniert
    - Sie wissen möchten, welche Speicherdateien geschrieben werden sollen
summary: Wie OpenClaw sich Dinge über Sitzungen hinweg merkt
title: Speicher im Überblick
x-i18n:
    generated_at: "2026-04-05T12:40:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89fbd20cf2bcdf461a9e311ee0ff43b5f69d9953519656eecd419b4a419256f8
    source_path: concepts/memory.md
    workflow: 15
---

# Speicher im Überblick

OpenClaw merkt sich Dinge, indem es **einfache Markdown-Dateien** im Workspace
Ihres Agenten schreibt. Das Modell „erinnert“ sich nur an das, was auf die
Festplatte geschrieben wird -- es gibt keinen versteckten Zustand.

## So funktioniert es

Ihr Agent hat zwei Orte zum Speichern von Erinnerungen:

- **`MEMORY.md`** -- Langzeitspeicher. Dauerhafte Fakten, Präferenzen und
  Entscheidungen. Wird zu Beginn jeder DM-Sitzung geladen.
- **`memory/YYYY-MM-DD.md`** -- tägliche Notizen. Laufender Kontext und
  Beobachtungen. Die Notizen von heute und gestern werden automatisch geladen.

Diese Dateien befinden sich im Agent-Workspace (Standard `~/.openclaw/workspace`).

<Tip>
Wenn Ihr Agent sich etwas merken soll, bitten Sie ihn einfach darum: „Merke dir, dass ich
TypeScript bevorzuge.“ Er schreibt es in die passende Datei.
</Tip>

## Speicher-Tools

Der Agent hat zwei Tools für die Arbeit mit dem Speicher:

- **`memory_search`** -- findet relevante Notizen mithilfe semantischer Suche, selbst wenn
  die Formulierung vom Original abweicht.
- **`memory_get`** -- liest eine bestimmte Speicherdatei oder einen Zeilenbereich.

Beide Tools werden vom aktiven Speicher-Plugin bereitgestellt (Standard: `memory-core`).

## Speichersuche

Wenn ein Embedding-Provider konfiguriert ist, verwendet `memory_search` eine **hybride
Suche** -- eine Kombination aus Vektorähnlichkeit (semantische Bedeutung) und Keyword-Abgleich
(exakte Begriffe wie IDs und Codesymbole). Das funktioniert sofort, sobald Sie einen
API-Schlüssel für einen unterstützten Provider haben.

<Info>
OpenClaw erkennt Ihren Embedding-Provider automatisch anhand verfügbarer API-Schlüssel. Wenn Sie
einen konfigurierten OpenAI-, Gemini-, Voyage- oder Mistral-Schlüssel haben, wird die
Speichersuche automatisch aktiviert.
</Info>

Einzelheiten dazu, wie die Suche funktioniert, zu Tuning-Optionen und zur Provider-Einrichtung finden Sie unter
[Speichersuche](/concepts/memory-search).

## Speicher-Backends

<CardGroup cols={3}>
<Card title="Integriert (Standard)" icon="database" href="/concepts/memory-builtin">
SQLite-basiert. Funktioniert sofort mit Keyword-Suche, Vektorähnlichkeit und
hybrider Suche. Keine zusätzlichen Abhängigkeiten.
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
Local-first-Sidecar mit Reranking, Query Expansion und der Möglichkeit,
Verzeichnisse außerhalb des Workspaces zu indizieren.
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
KI-nativer sitzungsübergreifender Speicher mit Benutzermodellierung, semantischer Suche und
Multi-Agent-Bewusstsein. Plugin-Installation.
</Card>
</CardGroup>

## Automatisches Schreiben in den Speicher

Bevor [Kompaktierung](/concepts/compaction) Ihre Konversation zusammenfasst, führt OpenClaw
einen stillen Turn aus, der den Agenten daran erinnert, wichtigen Kontext in Speicherdateien zu sichern.
Dies ist standardmäßig aktiviert -- Sie müssen nichts konfigurieren.

<Tip>
Das Schreiben in den Speicher verhindert Kontextverlust während der Kompaktierung. Wenn Ihr Agent
wichtige Fakten in der Konversation hat, die noch nicht in eine Datei geschrieben wurden,
werden sie automatisch gespeichert, bevor die Zusammenfassung erfolgt.
</Tip>

## Dreaming (experimentell)

Dreaming ist ein optionaler Hintergrund-Durchlauf zur Konsolidierung des Speichers. Dabei werden
kurzfristige Abrufe aus täglichen Dateien (`memory/YYYY-MM-DD.md`) erneut betrachtet, bewertet und
nur qualifizierte Elemente in den Langzeitspeicher (`MEMORY.md`) übernommen.

Es ist darauf ausgelegt, den Langzeitspeicher signalstark zu halten:

- **Opt-in**: standardmäßig deaktiviert.
- **Geplant**: wenn aktiviert, verwaltet `memory-core` die wiederkehrende Aufgabe
  automatisch.
- **Schwellenwertbasiert**: Übernahmen müssen Hürden bei Punktzahl, Abruffrequenz und Abfrage-
  Vielfalt überschreiten.

Für das Modusverhalten (`off`, `core`, `rem`, `deep`), Bewertungssignale und Tuning-
Optionen siehe [Dreaming (experimentell)](/concepts/memory-dreaming).

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Weiterführende Informationen

- [Integrierte Speicher-Engine](/concepts/memory-builtin) -- Standard-SQLite-Backend
- [QMD-Speicher-Engine](/concepts/memory-qmd) -- fortgeschrittener Local-first-Sidecar
- [Honcho-Speicher](/concepts/memory-honcho) -- KI-nativer sitzungsübergreifender Speicher
- [Speichersuche](/concepts/memory-search) -- Suchpipeline, Provider und
  Tuning
- [Dreaming (experimentell)](/concepts/memory-dreaming) -- Hintergrundübernahme
  vom kurzfristigen Abruf in den Langzeitspeicher
- [Referenz zur Speicherkonfiguration](/reference/memory-config) -- alle Konfigurationsoptionen
- [Kompaktierung](/concepts/compaction) -- wie Kompaktierung mit Speicher interagiert
