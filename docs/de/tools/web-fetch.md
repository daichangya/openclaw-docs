---
read_when:
    - Sie möchten eine URL abrufen und lesbaren Inhalt extrahieren
    - Sie müssen `web_fetch` oder dessen Firecrawl-Fallback konfigurieren
    - Sie möchten die Limits und das Caching von `web_fetch` verstehen
sidebarTitle: Web Fetch
summary: Tool `web_fetch` -- HTTP-Fetch mit Extraktion lesbarer Inhalte
title: Web Fetch
x-i18n:
    generated_at: "2026-04-05T12:58:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Web Fetch

Das Tool `web_fetch` führt einen normalen HTTP-GET aus und extrahiert lesbaren Inhalt
(HTML zu Markdown oder Text). Es führt **kein** JavaScript aus.

Für stark JavaScript-lastige Websites oder login-geschützte Seiten verwenden Sie stattdessen den
[Web Browser](/tools/browser).

## Schnellstart

`web_fetch` ist **standardmäßig aktiviert** -- keine Konfiguration erforderlich. Der Agent kann
es sofort aufrufen:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Tool-Parameter

| Parameter     | Typ      | Beschreibung                                  |
| ------------- | -------- | --------------------------------------------- |
| `url`         | `string` | Abzurufende URL (erforderlich, nur http/https) |
| `extractMode` | `string` | `"markdown"` (Standard) oder `"text"`         |
| `maxChars`    | `number` | Ausgabe auf diese Anzahl Zeichen kürzen       |

## So funktioniert es

<Steps>
  <Step title="Abrufen">
    Sendet einen HTTP-GET mit einem Chrome-ähnlichen User-Agent und einem `Accept-Language`-
    Header. Blockiert private/interne Hostnamen und prüft Redirects erneut.
  </Step>
  <Step title="Extrahieren">
    Führt Readability (Extraktion des Hauptinhalts) auf der HTML-Antwort aus.
  </Step>
  <Step title="Fallback (optional)">
    Wenn Readability fehlschlägt und Firecrawl konfiguriert ist, wird der Abruf über die
    Firecrawl-API mit Bot-Umgehungsmodus erneut versucht.
  </Step>
  <Step title="Cache">
    Ergebnisse werden 15 Minuten lang gecacht (konfigurierbar), um wiederholte
    Abrufe derselben URL zu reduzieren.
  </Step>
</Steps>

## Konfiguration

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // Standard: true
        provider: "firecrawl", // optional; für Auto-Erkennung weglassen
        maxChars: 50000, // maximale Ausgab zeichen
        maxCharsCap: 50000, // harte Obergrenze für den Parameter maxChars
        maxResponseBytes: 2000000, // maximale Download-Größe vor dem Kürzen
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // Readability-Extraktion verwenden
        userAgent: "Mozilla/5.0 ...", // User-Agent überschreiben
      },
    },
  },
}
```

## Firecrawl-Fallback

Wenn die Readability-Extraktion fehlschlägt, kann `web_fetch` auf
[Firecrawl](/tools/firecrawl) zurückfallen, um Bot-Umgehung und bessere Extraktion zu erhalten:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; für Auto-Erkennung aus verfügbaren Zugangsdaten weglassen
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional, falls FIRECRAWL_API_KEY gesetzt ist
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // Cache-Dauer (1 Tag)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` unterstützt SecretRef-Objekte.
Legacy-Konfiguration unter `tools.web.fetch.firecrawl.*` wird von `openclaw doctor --fix` automatisch migriert.

<Note>
  Wenn Firecrawl aktiviert ist und sein SecretRef nicht aufgelöst wird und es kein
  Env-Fallback `FIRECRAWL_API_KEY` gibt, schlägt der Start des Gateways sofort fehl.
</Note>

<Note>
  Überschreibungen für `baseUrl` von Firecrawl sind eingeschränkt: Sie müssen `https://` verwenden und
  den offiziellen Firecrawl-Host (`api.firecrawl.dev`).
</Note>

Aktuelles Laufzeitverhalten:

- `tools.web.fetch.provider` wählt den Fetch-Fallback-Provider explizit aus.
- Wenn `provider` weggelassen wird, erkennt OpenClaw den ersten bereiten Web-Fetch-
  Provider anhand der verfügbaren Zugangsdaten automatisch. Derzeit ist der gebündelte Provider Firecrawl.
- Wenn Readability deaktiviert ist, überspringt `web_fetch` direkt zum ausgewählten
  Provider-Fallback. Wenn kein Provider verfügbar ist, schlägt es fail-closed fehl.

## Limits und Sicherheit

- `maxChars` wird auf `tools.web.fetch.maxCharsCap` begrenzt
- Der Antwort-Body wird vor dem Parsen auf `maxResponseBytes` begrenzt; übergroße
  Antworten werden mit einer Warnung gekürzt
- Private/interne Hostnamen werden blockiert
- Redirects werden geprüft und durch `maxRedirects` begrenzt
- `web_fetch` ist Best-Effort -- für manche Websites ist der [Web Browser](/tools/browser) nötig

## Tool-Profile

Wenn Sie Tool-Profile oder Allowlists verwenden, fügen Sie `web_fetch` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // oder: allow: ["group:web"]  (enthält web_fetch, web_search und x_search)
  },
}
```

## Verwandte Themen

- [Web Search](/tools/web) -- das Web mit mehreren Providern durchsuchen
- [Web Browser](/tools/browser) -- vollständige Browser-Automatisierung für stark JavaScript-lastige Websites
- [Firecrawl](/tools/firecrawl) -- Firecrawl-Tools für Suche und Scraping
