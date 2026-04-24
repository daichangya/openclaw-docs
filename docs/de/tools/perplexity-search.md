---
read_when:
    - Sie möchten Perplexity Search für die Websuche verwenden
    - Sie müssen `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY` einrichten
summary: Perplexity Search API und Sonar/OpenRouter-Kompatibilität für `web_search`
title: Perplexity-Suche
x-i18n:
    generated_at: "2026-04-24T07:04:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw unterstützt die Perplexity Search API als `web_search`-Provider.
Sie gibt strukturierte Ergebnisse mit den Feldern `title`, `url` und `snippet` zurück.

Aus Kompatibilitätsgründen unterstützt OpenClaw auch veraltete Setups für Perplexity Sonar/OpenRouter.
Wenn Sie `OPENROUTER_API_KEY`, einen `sk-or-...`-Key in `plugins.entries.perplexity.config.webSearch.apiKey` verwenden oder `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` setzen, wechselt der Provider auf den Chat-Completions-Pfad und gibt AI-synthetisierte Antworten mit Quellenangaben statt strukturierter Search-API-Ergebnisse zurück.

## Einen Perplexity-API-Key erhalten

1. Erstellen Sie ein Perplexity-Konto unter [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Generieren Sie im Dashboard einen API-Key
3. Speichern Sie den Key in der Konfiguration oder setzen Sie `PERPLEXITY_API_KEY` in der Gateway-Umgebung.

## OpenRouter-Kompatibilität

Wenn Sie OpenRouter bereits für Perplexity Sonar verwendet haben, behalten Sie `provider: "perplexity"` bei und setzen Sie `OPENROUTER_API_KEY` in der Gateway-Umgebung, oder speichern Sie einen `sk-or-...`-Key in `plugins.entries.perplexity.config.webSearch.apiKey`.

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

## Wo der Key gesetzt wird

**Über die Konfiguration:** Führen Sie `openclaw configure --section web` aus. Dadurch wird der Key in
`~/.openclaw/openclaw.json` unter `plugins.entries.perplexity.config.webSearch.apiKey` gespeichert.
Dieses Feld akzeptiert auch SecretRef-Objekte.

**Über die Umgebung:** Setzen Sie `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY`
in der Prozessumgebung des Gateway. Für eine Gateway-Installation tragen Sie ihn in
`~/.openclaw/.env` ein (oder in Ihre Service-Umgebung). Siehe [Env vars](/de/help/faq#env-vars-and-env-loading).

Wenn `provider: "perplexity"` konfiguriert ist und der SecretRef für den Perplexity-Key nicht aufgelöst werden kann und kein Env-Fallback vorhanden ist, schlägt Start/Reload sofort fehl.

## Tool-Parameter

Diese Parameter gelten für den nativen Pfad der Perplexity Search API.

<ParamField path="query" type="string" required>
Suchanfrage.
</ParamField>

<ParamField path="count" type="number" default="5">
Anzahl der zurückzugebenden Ergebnisse (1–10).
</ParamField>

<ParamField path="country" type="string">
2-stelliger ISO-Ländercode (z. B. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
ISO-639-1-Sprachcode (z. B. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Zeitfilter — `day` entspricht 24 Stunden.
</ParamField>

<ParamField path="date_after" type="string">
Nur Ergebnisse, die nach diesem Datum veröffentlicht wurden (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Nur Ergebnisse, die vor diesem Datum veröffentlicht wurden (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Domain-Allowlist-/Denylist-Array (max. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Gesamtbudget für Inhalte (max. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Token-Limit pro Seite.
</ParamField>

Für den veralteten Kompatibilitätspfad Sonar/OpenRouter:

- `query`, `count` und `freshness` werden akzeptiert
- `count` dient dort nur der Kompatibilität; die Antwort bleibt weiterhin eine synthetisierte
  Antwort mit Quellenangaben statt einer Liste mit N Ergebnissen
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

// Mehr Inhalts-Extraktion
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
- OpenRouter oder explizites `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` schaltet Perplexity aus Kompatibilitätsgründen zurück auf Sonar-Chat-Completions
- Sonar-/OpenRouter-Kompatibilität gibt eine synthetisierte Antwort mit Quellenangaben zurück, nicht strukturierte Ergebniszeilen
- Ergebnisse werden standardmäßig 15 Minuten gecacht (konfigurierbar über `cacheTtlMinutes`)

## Verwandt

- [Web-Suche – Überblick](/de/tools/web) -- alle Provider und Auto-Erkennung
- [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) -- offizielle Perplexity-Dokumentation
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit Länder-/Sprachfiltern
- [Exa Search](/de/tools/exa-search) -- neuronale Suche mit Inhalts-Extraktion
