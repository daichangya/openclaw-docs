---
read_when:
    - Sie möchten webbasierte Suche mit Tavily.
    - Sie benötigen einen Tavily-API-Schlüssel.
    - Sie möchten Tavily als `web_search`-Provider verwenden.
    - Sie möchten Inhalte aus URLs extrahieren.
summary: Tavily-Such- und Extraktionstools
title: Tavily
x-i18n:
    generated_at: "2026-04-24T07:05:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 15
---

OpenClaw kann **Tavily** auf zwei Arten verwenden:

- als `web_search`-Provider
- als explizite Plugin-Tools: `tavily_search` und `tavily_extract`

Tavily ist eine Such-API für KI-Anwendungen, die strukturierte Ergebnisse zurückgibt,
die für die Nutzung durch LLMs optimiert sind. Sie unterstützt konfigurierbare Suchtiefe, Themen-
Filterung, Domain-Filter, KI-generierte Antwortzusammenfassungen und Inhaltsextraktion
aus URLs (einschließlich JavaScript-gerenderter Seiten).

## API-Schlüssel abrufen

1. Erstellen Sie ein Tavily-Konto unter [tavily.com](https://tavily.com/).
2. Generieren Sie im Dashboard einen API-Schlüssel.
3. Speichern Sie ihn in der Konfiguration oder setzen Sie `TAVILY_API_KEY` in der Gateway-Umgebung.

## Tavily-Suche konfigurieren

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Hinweise:

- Wenn Sie Tavily beim Onboarding oder mit `openclaw configure --section web` auswählen,
  wird das gebündelte Tavily-Plugin automatisch aktiviert.
- Speichern Sie die Tavily-Konfiguration unter `plugins.entries.tavily.config.webSearch.*`.
- `web_search` mit Tavily unterstützt `query` und `count` (bis zu 20 Ergebnisse).
- Für Tavily-spezifische Steuerungen wie `search_depth`, `topic`, `include_answer`
  oder Domain-Filter verwenden Sie `tavily_search`.

## Tavily-Plugin-Tools

### `tavily_search`

Verwenden Sie dieses Tool, wenn Sie Tavily-spezifische Suchsteuerungen statt des generischen
`web_search` möchten.

| Parameter         | Beschreibung                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `query`           | Suchanfrage als String (unter 400 Zeichen halten)                   |
| `search_depth`    | `basic` (Standard, ausgewogen) oder `advanced` (höchste Relevanz, langsamer) |
| `topic`           | `general` (Standard), `news` (Echtzeit-Updates) oder `finance`      |
| `max_results`     | Anzahl der Ergebnisse, 1–20 (Standard: 5)                           |
| `include_answer`  | Eine KI-generierte Antwortzusammenfassung einschließen (Standard: false) |
| `time_range`      | Nach Aktualität filtern: `day`, `week`, `month` oder `year`         |
| `include_domains` | Array von Domains, auf die die Ergebnisse beschränkt werden         |
| `exclude_domains` | Array von Domains, die aus den Ergebnissen ausgeschlossen werden    |

**Suchtiefe:**

| Tiefe      | Geschwindigkeit | Relevanz | Am besten geeignet für              |
| ---------- | --------------- | -------- | ----------------------------------- |
| `basic`    | Schneller       | Hoch     | Allgemeine Anfragen (Standard)      |
| `advanced` | Langsamer       | Höchste  | Präzision, spezifische Fakten, Recherche |

### `tavily_extract`

Verwenden Sie dieses Tool, um saubere Inhalte aus einer oder mehreren URLs zu extrahieren. Es verarbeitet
JavaScript-gerenderte Seiten und unterstützt query-fokussiertes Chunking für gezielte
Extraktion.

| Parameter           | Beschreibung                                              |
| ------------------- | --------------------------------------------------------- |
| `urls`              | Array von URLs zur Extraktion (1–20 pro Anfrage)          |
| `query`             | Extrahierte Chunks nach Relevanz zu dieser Anfrage neu ranken |
| `extract_depth`     | `basic` (Standard, schnell) oder `advanced` (für JS-lastige Seiten) |
| `chunks_per_source` | Chunks pro URL, 1–5 (erfordert `query`)                   |
| `include_images`    | Bild-URLs in Ergebnisse einschließen (Standard: false)    |

**Extraktionstiefe:**

| Tiefe      | Wann verwenden                           |
| ---------- | ---------------------------------------- |
| `basic`    | Einfache Seiten – zuerst ausprobieren    |
| `advanced` | JS-gerenderte SPAs, dynamische Inhalte, Tabellen |

Tipps:

- Maximal 20 URLs pro Anfrage. Teilen Sie größere Listen in mehrere Aufrufe auf.
- Verwenden Sie `query` + `chunks_per_source`, um nur relevante Inhalte statt ganzer Seiten zu erhalten.
- Probieren Sie zuerst `basic`; wechseln Sie zu `advanced`, wenn Inhalte fehlen oder unvollständig sind.

## Das richtige Tool wählen

| Bedarf                               | Tool             |
| ------------------------------------ | ---------------- |
| Schnelle Websuche ohne Spezialoptionen | `web_search`   |
| Suche mit Tiefe, Thema, KI-Antworten | `tavily_search`  |
| Inhalte aus bestimmten URLs extrahieren | `tavily_extract` |

## Verwandt

- [Web-Search-Übersicht](/de/tools/web) -- alle Provider und automatische Erkennung
- [Firecrawl](/de/tools/firecrawl) -- Suche + Scraping mit Inhaltsextraktion
- [Exa Search](/de/tools/exa-search) -- neuronale Suche mit Inhaltsextraktion
