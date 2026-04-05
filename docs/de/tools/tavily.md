---
read_when:
    - Sie möchten web_search mit Tavily-Unterstützung verwenden
    - Sie benötigen einen Tavily-API-Schlüssel
    - Sie möchten Tavily als `web_search`-Provider verwenden
    - Sie möchten Inhalte aus URLs extrahieren
summary: Tavily-Such- und Extraktionstools
title: Tavily
x-i18n:
    generated_at: "2026-04-05T12:58:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

OpenClaw kann **Tavily** auf zwei Arten verwenden:

- als `web_search`-Provider
- als explizite Plugin-Tools: `tavily_search` und `tavily_extract`

Tavily ist eine Such-API, die für KI-Anwendungen entwickelt wurde und strukturierte Ergebnisse zurückgibt,
die für die Nutzung mit LLMs optimiert sind. Sie unterstützt konfigurierbare Suchtiefe, Themen-
Filterung, Domain-Filter, KI-generierte Antwortzusammenfassungen und Inhaltsextraktion
aus URLs (einschließlich mit JavaScript gerenderter Seiten).

## API-Schlüssel erhalten

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

- Wenn Sie Tavily im Onboarding oder über `openclaw configure --section web` auswählen, wird
  das gebündelte Tavily-Plugin automatisch aktiviert.
- Speichern Sie die Tavily-Konfiguration unter `plugins.entries.tavily.config.webSearch.*`.
- `web_search` mit Tavily unterstützt `query` und `count` (bis zu 20 Ergebnisse).
- Für Tavily-spezifische Steuerungen wie `search_depth`, `topic`, `include_answer`
  oder Domain-Filter verwenden Sie `tavily_search`.

## Tavily-Plugin-Tools

### `tavily_search`

Verwenden Sie dies, wenn Sie Tavily-spezifische Suchsteuerungen statt des generischen
`web_search` möchten.

| Parameter         | Beschreibung                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `query`           | Suchanfrage als Zeichenkette (unter 400 Zeichen halten)            |
| `search_depth`    | `basic` (Standard, ausgewogen) oder `advanced` (höchste Relevanz, langsamer) |
| `topic`           | `general` (Standard), `news` (Echtzeit-Updates) oder `finance`     |
| `max_results`     | Anzahl der Ergebnisse, 1-20 (Standard: 5)                          |
| `include_answer`  | KI-generierte Antwortzusammenfassung einschließen (Standard: false) |
| `time_range`      | Nach Aktualität filtern: `day`, `week`, `month` oder `year`        |
| `include_domains` | Array von Domains, auf die Ergebnisse beschränkt werden sollen     |
| `exclude_domains` | Array von Domains, die aus den Ergebnissen ausgeschlossen werden sollen |

**Suchtiefe:**

| Tiefe      | Geschwindigkeit | Relevanz | Am besten geeignet für                  |
| ---------- | --------------- | -------- | --------------------------------------- |
| `basic`    | Schneller       | Hoch     | Allgemeine Suchanfragen (Standard)      |
| `advanced` | Langsamer       | Höchste  | Präzision, spezifische Fakten, Recherche |

### `tavily_extract`

Verwenden Sie dies, um bereinigte Inhalte aus einer oder mehreren URLs zu extrahieren. Behandelt
mit JavaScript gerenderte Seiten und unterstützt query-fokussiertes Chunking für gezielte
Extraktion.

| Parameter           | Beschreibung                                                   |
| ------------------- | -------------------------------------------------------------- |
| `urls`              | Array von zu extrahierenden URLs (1-20 pro Anfrage)           |
| `query`             | Extrahierte Chunks nach Relevanz für diese Query neu ranken   |
| `extract_depth`     | `basic` (Standard, schnell) oder `advanced` (für JS-lastige Seiten) |
| `chunks_per_source` | Chunks pro URL, 1-5 (erfordert `query`)                       |
| `include_images`    | Bild-URLs in die Ergebnisse einschließen (Standard: false)    |

**Extraktionstiefe:**

| Tiefe      | Wann verwenden                              |
| ---------- | ------------------------------------------- |
| `basic`    | Einfache Seiten - probieren Sie dies zuerst |
| `advanced` | Mit JS gerenderte SPAs, dynamische Inhalte, Tabellen |

Tipps:

- Maximal 20 URLs pro Anfrage. Teilen Sie größere Listen auf mehrere Aufrufe auf.
- Verwenden Sie `query` + `chunks_per_source`, um nur relevante Inhalte statt ganzer Seiten zu erhalten.
- Probieren Sie zuerst `basic`; verwenden Sie `advanced`, wenn Inhalte fehlen oder unvollständig sind.

## Das richtige Tool auswählen

| Bedarf                                | Tool             |
| ------------------------------------- | ---------------- |
| Schnelle Websuche ohne besondere Optionen | `web_search`     |
| Suche mit Tiefe, Thema, KI-Antworten  | `tavily_search`  |
| Inhalte aus bestimmten URLs extrahieren | `tavily_extract` |

## Verwandt

- [Überblick über Web Search](/tools/web) -- alle Provider und automatische Erkennung
- [Firecrawl](/tools/firecrawl) -- Suche + Scraping mit Inhaltsextraktion
- [Exa Search](/tools/exa-search) -- neuronale Suche mit Inhaltsextraktion
