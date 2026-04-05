---
read_when:
    - Sie möchten einen selbst gehosteten Websuch-Provider
    - Sie möchten SearXNG für `web_search` verwenden
    - Sie benötigen eine datenschutzorientierte oder Air-Gap-Suchoption
summary: SearXNG-Websuche -- selbst gehosteter, schlüsselfreier Meta-Such-Provider
title: SearXNG-Suche
x-i18n:
    generated_at: "2026-04-05T12:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# SearXNG-Suche

OpenClaw unterstützt [SearXNG](https://docs.searxng.org/) als **selbst gehosteten,
schlüsselfreien** `web_search`-Provider. SearXNG ist eine Open-Source-Meta-Suchmaschine,
die Ergebnisse von Google, Bing, DuckDuckGo und anderen Quellen zusammenführt.

Vorteile:

- **Kostenlos und unbegrenzt** -- kein API-Schlüssel oder kommerzielles Abonnement erforderlich
- **Datenschutz / Air-Gap** -- Abfragen verlassen niemals Ihr Netzwerk
- **Funktioniert überall** -- keine Regionsbeschränkungen wie bei kommerziellen Such-APIs

## Einrichtung

<Steps>
  <Step title="Eine SearXNG-Instanz ausführen">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Oder verwenden Sie eine bestehende SearXNG-Bereitstellung, auf die Sie Zugriff haben. Siehe die
    [SearXNG-Dokumentation](https://docs.searxng.org/) für die Einrichtung in Produktionsumgebungen.

  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    # Wählen Sie "searxng" als Provider aus
    ```

    Oder setzen Sie die env var und lassen Sie die Auto-Erkennung sie finden:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Plugin-spezifische Einstellungen für die SearXNG-Instanz:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Das Feld `baseUrl` akzeptiert auch SecretRef-Objekte.

Transportregeln:

- `https://` funktioniert für öffentliche oder private SearXNG-Hosts
- `http://` wird nur für vertrauenswürdige Hosts in privaten Netzwerken oder auf loopback akzeptiert
- öffentliche SearXNG-Hosts müssen `https://` verwenden

## Umgebungsvariable

Setzen Sie `SEARXNG_BASE_URL` als Alternative zur Konfiguration:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Wenn `SEARXNG_BASE_URL` gesetzt ist und kein expliziter Provider konfiguriert wurde, wählt die Auto-Erkennung
SearXNG automatisch aus (mit der niedrigsten Priorität -- jeder API-gestützte Provider mit einem
Schlüssel gewinnt zuerst).

## Referenz der Plugin-Konfiguration

| Feld         | Beschreibung                                                        |
| ------------ | ------------------------------------------------------------------- |
| `baseUrl`    | Base URL Ihrer SearXNG-Instanz (erforderlich)                       |
| `categories` | Kommagetrennte Kategorien wie `general`, `news` oder `science`      |
| `language`   | Sprachcode für Ergebnisse wie `en`, `de` oder `fr`                  |

## Hinweise

- **JSON-API** -- verwendet den nativen Endpunkt `format=json` von SearXNG, kein HTML-Scraping
- **Kein API-Schlüssel** -- funktioniert sofort mit jeder SearXNG-Instanz
- **Validierung der Base URL** -- `baseUrl` muss eine gültige URL mit `http://` oder `https://`
  sein; öffentliche Hosts müssen `https://` verwenden
- **Reihenfolge der Auto-Erkennung** -- SearXNG wird in der
  Auto-Erkennung zuletzt geprüft (Reihenfolge 200). API-gestützte Provider mit konfigurierten
  Schlüsseln werden zuerst ausgeführt, dann DuckDuckGo (Reihenfolge 100), dann Ollama Web Search (Reihenfolge 110)
- **Selbst gehostet** -- Sie kontrollieren die Instanz, Abfragen und Upstream-Suchmaschinen
- **Categories** verwendet standardmäßig `general`, wenn nichts konfiguriert wurde

<Tip>
  Damit die SearXNG-JSON-API funktioniert, stellen Sie sicher, dass auf Ihrer SearXNG-Instanz das Format `json`
  in der `settings.yml` unter `search.formats` aktiviert ist.
</Tip>

## Verwandt

- [Überblick zur Websuche](/tools/web) -- alle Provider und Auto-Erkennung
- [DuckDuckGo-Suche](/tools/duckduckgo-search) -- eine weitere schlüsselfreie Fallback-Option
- [Brave-Suche](/tools/brave-search) -- strukturierte Ergebnisse mit kostenlosem Tarif
