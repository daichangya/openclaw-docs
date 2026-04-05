---
read_when:
    - Sie möchten eine Firecrawl-gestützte Webextraktion
    - Sie benötigen einen Firecrawl-API-Key
    - Sie möchten Firecrawl als `web_search`-Provider
    - Sie möchten Anti-Bot-Extraktion für `web_fetch`
summary: Firecrawl-Suche, Scraping und web_fetch-Fallback
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T12:57:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw kann **Firecrawl** auf drei Arten verwenden:

- als `web_search`-Provider
- als explizite Plugin-Tools: `firecrawl_search` und `firecrawl_scrape`
- als Fallback-Extractor für `web_fetch`

Es handelt sich um einen gehosteten Extraktions-/Suchdienst, der Bot-Umgehung und Caching unterstützt,
was bei JS-lastigen Websites oder Seiten hilft, die einfache HTTP-Fetches blockieren.

## API-Key abrufen

1. Erstellen Sie ein Firecrawl-Konto und generieren Sie einen API-Key.
2. Speichern Sie ihn in der Konfiguration oder setzen Sie `FIRECRAWL_API_KEY` in der Gateway-Umgebung.

## Firecrawl-Suche konfigurieren

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Hinweise:

- Wenn Sie Firecrawl im Onboarding oder mit `openclaw configure --section web` auswählen, wird das gebündelte Firecrawl-Plugin automatisch aktiviert.
- `web_search` mit Firecrawl unterstützt `query` und `count`.
- Für Firecrawl-spezifische Steuerungen wie `sources`, `categories` oder Ergebnis-Scraping verwenden Sie `firecrawl_search`.
- `baseUrl`-Overrides müssen auf `https://api.firecrawl.dev` bleiben.
- `FIRECRAWL_BASE_URL` ist der gemeinsame Env-Fallback für die Base URLs von Firecrawl-Suche und -Scraping.

## Firecrawl-Scraping + web_fetch-Fallback konfigurieren

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Hinweise:

- Firecrawl-Fallback-Versuche werden nur ausgeführt, wenn ein API-Key verfügbar ist (`plugins.entries.firecrawl.config.webFetch.apiKey` oder `FIRECRAWL_API_KEY`).
- `maxAgeMs` steuert, wie alt gecachte Ergebnisse sein dürfen (ms). Standard sind 2 Tage.
- Die veraltete Konfiguration `tools.web.fetch.firecrawl.*` wird von `openclaw doctor --fix` automatisch migriert.
- Overrides für Firecrawl-Scraping/`baseUrl` sind auf `https://api.firecrawl.dev` beschränkt.

`firecrawl_scrape` verwendet dieselben Einstellungen und Env-Variablen aus `plugins.entries.firecrawl.config.webFetch.*` erneut.

## Firecrawl-Plugin-Tools

### `firecrawl_search`

Verwenden Sie dies, wenn Sie Firecrawl-spezifische Suchsteuerungen statt des generischen `web_search` möchten.

Zentrale Parameter:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Verwenden Sie dies für JS-lastige oder botgeschützte Seiten, bei denen einfaches `web_fetch` schwach ist.

Zentrale Parameter:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / Bot-Umgehung

Firecrawl stellt einen Parameter für den **Proxy-Modus** zur Bot-Umgehung bereit (`basic`, `stealth` oder `auto`).
OpenClaw verwendet für Firecrawl-Requests immer `proxy: "auto"` plus `storeInCache: true`.
Wenn `proxy` weggelassen wird, verwendet Firecrawl standardmäßig `auto`. `auto` versucht bei einem Fehlschlag eines einfachen Versuchs erneut mit Stealth-Proxys, was mehr Credits
als Scraping nur mit `basic` verbrauchen kann.

## Wie `web_fetch` Firecrawl verwendet

Reihenfolge der `web_fetch`-Extraktion:

1. Readability (lokal)
2. Firecrawl (wenn ausgewählt oder automatisch als aktiver Web-Fetch-Fallback erkannt)
3. Einfache HTML-Bereinigung (letzter Fallback)

Der Auswahlschalter ist `tools.web.fetch.provider`. Wenn Sie ihn weglassen, erkennt OpenClaw
den ersten bereiten Web-Fetch-Provider anhand verfügbarer Zugangsdaten automatisch.
Heute ist der gebündelte Provider Firecrawl.

## Verwandt

- [Überblick Web Search](/tools/web) -- alle Provider und automatische Erkennung
- [Web Fetch](/tools/web-fetch) -- `web_fetch`-Tool mit Firecrawl-Fallback
- [Tavily](/tools/tavily) -- Such- und Extraktionstools
