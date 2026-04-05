---
read_when:
    - Du möchtest Perplexity Search für die Websuche verwenden
    - Du benötigst die Einrichtung von `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`
summary: Perplexity Search API und Sonar/OpenRouter-Kompatibilität für `web_search`
title: Perplexity Search
x-i18n:
    generated_at: "2026-04-05T12:58:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d97498e26e5570364e1486cb75584ed53b40a0091bf0210e1ea62f62d562ea
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw unterstützt die Perplexity Search API als `web_search`-Provider.
Sie liefert strukturierte Ergebnisse mit den Feldern `title`, `url` und `snippet` zurück.

Aus Kompatibilitätsgründen unterstützt OpenClaw auch Legacy-Setups mit Perplexity Sonar/OpenRouter.
Wenn du `OPENROUTER_API_KEY`, einen `sk-or-...`-Schlüssel in `plugins.entries.perplexity.config.webSearch.apiKey` verwendest oder `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` setzt, wechselt der Provider auf den Chat-Completions-Pfad und liefert AI-synthetisierte Antworten mit Quellenangaben statt strukturierter Search-API-Ergebnisse zurück.

## Einen Perplexity-API-Schlüssel erhalten

1. Erstelle ein Perplexity-Konto unter [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Generiere einen API-Schlüssel im Dashboard
3. Speichere den Schlüssel in der Konfiguration oder setze `PERPLEXITY_API_KEY` in der Gateway-Umgebung.

## OpenRouter-Kompatibilität

Wenn du OpenRouter bereits für Perplexity Sonar verwendet hast, behalte `provider: "perplexity"` bei und setze `OPENROUTER_API_KEY` in der Gateway-Umgebung oder speichere einen `sk-or-...`-Schlüssel in `plugins.entries.perplexity.config.webSearch.apiKey`.

Optionale Kompatibilitätssteuerungen:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Konfigurationsbeispiele

### Native Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter- / Sonar-Kompatibilität

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Wo der Schlüssel gesetzt wird

**Über die Konfiguration:** Führe `openclaw configure --section web` aus. Dadurch wird der Schlüssel in
`~/.openclaw/openclaw.json` unter `plugins.entries.perplexity.config.webSearch.apiKey` gespeichert.
Dieses Feld akzeptiert auch SecretRef-Objekte.

**Über die Umgebung:** Setze `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`
in der Prozessumgebung des Gateway. Für eine Gateway-Installation lege ihn in
`~/.openclaw/.env` ab (oder in deiner Service-Umgebung). Siehe [Env vars](/help/faq#env-vars-and-env-loading).

Wenn `provider: "perplexity"` konfiguriert ist und der SecretRef für den Perplexity-Schlüssel nicht aufgelöst wird und kein env-Fallback vorhanden ist, schlägt Start/Reload sofort fehl.

## Tool-Parameter

Diese Parameter gelten für den nativen Pfad der Perplexity Search API.

| Parameter             | Beschreibung                                          |
| --------------------- | ----------------------------------------------------- |
| `query`               | Suchanfrage (erforderlich)                            |
| `count`               | Anzahl der zurückzugebenden Ergebnisse (1-10, Standard: 5) |
| `country`             | 2-stelliger ISO-Ländercode (z. B. `"US"`, `"DE"`)     |
| `language`            | ISO-639-1-Sprachcode (z. B. `"en"`, `"de"`, `"fr"`)   |
| `freshness`           | Zeitfilter: `day` (24h), `week`, `month` oder `year`  |
| `date_after`          | Nur Ergebnisse, die nach diesem Datum veröffentlicht wurden (YYYY-MM-DD) |
| `date_before`         | Nur Ergebnisse, die vor diesem Datum veröffentlicht wurden (YYYY-MM-DD) |
| `domain_filter`       | Domain-Allowlist-/Denylist-Array (max. 20)            |
| `max_tokens`          | Gesamtbudget für Inhalte (Standard: 25000, max.: 1000000) |
| `max_tokens_per_page` | Token-Limit pro Seite (Standard: 2048)                |

Für den Legacy-Kompatibilitätspfad Sonar/OpenRouter:

- `query`, `count` und `freshness` werden akzeptiert
- `count` ist dort nur für Kompatibilität vorhanden; die Antwort bleibt weiterhin eine synthetisierte
  Einzelantwort mit Quellenangaben statt einer Liste mit N Ergebnissen
- Search-API-exklusive Filter wie `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` und `max_tokens_per_page`
  geben explizite Fehler zurück

**Beispiele:**

```javascript
// Länder- und sprachspezifische Suche
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Aktuelle Ergebnisse (vergangene Woche)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Suche nach Datumsbereich
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain-Filterung (Allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain-Filterung (Denylist - mit Präfix -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Mehr Inhaltsextraktion
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regeln für Domain-Filter

- Maximal 20 Domains pro Filter
- Allowlist und Denylist können in derselben Anfrage nicht gemischt werden
- Verwende das Präfix `-` für Denylist-Einträge (z. B. `["-reddit.com"]`)

## Hinweise

- Die Perplexity Search API liefert strukturierte Websuchergebnisse (`title`, `url`, `snippet`) zurück
- OpenRouter oder explizit gesetzte `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` schalten Perplexity aus Kompatibilitätsgründen zurück auf Sonar-Chat-Completions
- Sonar/OpenRouter-Kompatibilität liefert eine synthetisierte Einzelantwort mit Quellenangaben zurück, keine strukturierten Ergebniszeilen
- Ergebnisse werden standardmäßig 15 Minuten lang gecacht (konfigurierbar über `cacheTtlMinutes`)

## Verwandt

- [Web Search overview](/tools/web) -- alle Provider und Auto-Erkennung
- [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) -- offizielle Perplexity-Dokumentation
- [Brave Search](/tools/brave-search) -- strukturierte Ergebnisse mit Länder-/Sprachfiltern
- [Exa Search](/tools/exa-search) -- neuronale Suche mit Inhaltsextraktion
