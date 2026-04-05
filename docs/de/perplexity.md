---
read_when:
    - Sie möchten Perplexity Search für die Websuche verwenden
    - Sie benötigen die Einrichtung von `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`
summary: Perplexity Search API und Sonar/OpenRouter-Kompatibilität für `web_search`
title: Perplexity Search (Legacy-Pfad)
x-i18n:
    generated_at: "2026-04-05T12:48:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba91e63e7412f3b6f889ee11f4a66563014932a1dc7be8593fe2262a4877b89b
    source_path: perplexity.md
    workflow: 15
---

# Perplexity Search API

OpenClaw unterstützt die Perplexity Search API als `web_search`-Provider.
Sie gibt strukturierte Ergebnisse mit den Feldern `title`, `url` und `snippet` zurück.

Aus Kompatibilitätsgründen unterstützt OpenClaw auch Legacy-Setups für Perplexity Sonar/OpenRouter.
Wenn Sie `OPENROUTER_API_KEY` verwenden, einen `sk-or-...`-Schlüssel in `plugins.entries.perplexity.config.webSearch.apiKey` speichern oder `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` setzen, wechselt der Provider zum Pfad für Chat-Completions und gibt KI-synthetisierte Antworten mit Zitaten statt strukturierter Search-API-Ergebnisse zurück.

## Einen Perplexity-API-Schlüssel erhalten

1. Erstellen Sie ein Perplexity-Konto unter [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Erzeugen Sie im Dashboard einen API-Schlüssel
3. Speichern Sie den Schlüssel in der Konfiguration oder setzen Sie `PERPLEXITY_API_KEY` in der Gateway-Umgebung.

## OpenRouter-Kompatibilität

Wenn Sie OpenRouter bereits für Perplexity Sonar verwendet haben, behalten Sie `provider: "perplexity"` bei und setzen Sie `OPENROUTER_API_KEY` in der Gateway-Umgebung oder speichern Sie einen `sk-or-...`-Schlüssel in `plugins.entries.perplexity.config.webSearch.apiKey`.

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

### OpenRouter-/Sonar-Kompatibilität

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

**Über die Konfiguration:** Führen Sie `openclaw configure --section web` aus. Der Schlüssel wird in
`~/.openclaw/openclaw.json` unter `plugins.entries.perplexity.config.webSearch.apiKey` gespeichert.
Dieses Feld akzeptiert auch SecretRef-Objekte.

**Über die Umgebung:** Setzen Sie `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`
in der Prozessumgebung des Gateway. Für eine Gateway-Installation legen Sie ihn in
`~/.openclaw/.env` ab (oder in Ihrer Dienstumgebung). Siehe [Env vars](/help/faq#env-vars-and-env-loading).

Wenn `provider: "perplexity"` konfiguriert ist und der SecretRef des Perplexity-Schlüssels ohne Env-Fallback nicht aufgelöst werden kann, schlägt Start/Reload sofort fehl.

## Tool-Parameter

Diese Parameter gelten für den nativen Pfad der Perplexity Search API.

| Parameter             | Beschreibung                                         |
| --------------------- | ---------------------------------------------------- |
| `query`               | Suchanfrage (erforderlich)                           |
| `count`               | Anzahl der zurückzugebenden Ergebnisse (1-10, Standard: 5) |
| `country`             | 2-stelliger ISO-Ländercode (z. B. "US", "DE")        |
| `language`            | ISO-639-1-Sprachcode (z. B. "en", "de", "fr")        |
| `freshness`           | Zeitfilter: `day` (24h), `week`, `month` oder `year` |
| `date_after`          | Nur Ergebnisse, die nach diesem Datum veröffentlicht wurden (YYYY-MM-DD) |
| `date_before`         | Nur Ergebnisse, die vor diesem Datum veröffentlicht wurden (YYYY-MM-DD) |
| `domain_filter`       | Domain-Allowlist-/Denylist-Array (max. 20)           |
| `max_tokens`          | Gesamtbudget für Inhalt (Standard: 25000, max.: 1000000) |
| `max_tokens_per_page` | Token-Limit pro Seite (Standard: 2048)               |

Für den Legacy-Kompatibilitätspfad Sonar/OpenRouter:

- `query`, `count` und `freshness` werden akzeptiert
- `count` ist dort nur für Kompatibilität gedacht; die Antwort ist weiterhin eine synthetisierte
  Antwort mit Zitaten statt einer Ergebnisliste mit N Einträgen
- Filter, die nur für die Search API gelten, wie `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` und `max_tokens_per_page`,
  geben explizite Fehler zurück

**Beispiele:**

```javascript
// Länderspezifische und sprachspezifische Suche
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Aktuelle Ergebnisse (letzte Woche)
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

// Domain-Filterung (Denylist - Präfix mit -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Mehr Inhalt extrahieren
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Regeln für Domain-Filter

- Maximal 20 Domains pro Filter
- Allowlist und Denylist können nicht in derselben Anfrage gemischt werden
- Verwenden Sie das Präfix `-` für Denylist-Einträge (z. B. `["-reddit.com"]`)

## Hinweise

- Die Perplexity Search API gibt strukturierte Websuchergebnisse zurück (`title`, `url`, `snippet`)
- OpenRouter oder explizite Einstellungen `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` schalten Perplexity aus Kompatibilitätsgründen zurück auf Sonar-Chat-Completions
- Die Sonar-/OpenRouter-Kompatibilität gibt eine synthetisierte Antwort mit Zitaten zurück, nicht strukturierte Ergebniszeilen
- Ergebnisse werden standardmäßig 15 Minuten zwischengespeichert (konfigurierbar über `cacheTtlMinutes`)

Siehe [Web tools](/tools/web) für die vollständige Konfiguration von `web_search`.
Siehe [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) für weitere Details.
