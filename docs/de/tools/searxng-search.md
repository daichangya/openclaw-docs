---
read_when:
    - Sie möchten einen selbst gehosteten Websuch-Provider.
    - Sie möchten SearXNG für `web_search` verwenden.
    - Sie benötigen eine datenschutzorientierte oder air-gapped Suchoption.
summary: SearXNG-Websuche -- selbst gehosteter, schlüsselloser Meta-Such-Provider
title: SearXNG-Suche
x-i18n:
    generated_at: "2026-04-24T07:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw unterstützt [SearXNG](https://docs.searxng.org/) als **selbst gehosteten,
schlüssellosen** `web_search`-Provider. SearXNG ist eine Open-Source-Meta-Suchmaschine,
die Ergebnisse von Google, Bing, DuckDuckGo und anderen Quellen aggregiert.

Vorteile:

- **Kostenlos und unbegrenzt** -- kein API key und kein kommerzielles Abo erforderlich
- **Datenschutz / Air-Gap** -- Suchanfragen verlassen nie Ihr Netzwerk
- **Funktioniert überall** -- keine Regionsbeschränkungen bei kommerziellen Such-APIs

## Einrichtung

<Steps>
  <Step title="Eine SearXNG-Instanz ausführen">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Oder verwenden Sie eine vorhandene SearXNG-Bereitstellung, auf die Sie Zugriff haben. Siehe die
    [SearXNG-Dokumentation](https://docs.searxng.org/) für ein Produktions-Setup.

  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    # Wählen Sie "searxng" als Provider
    ```

    Oder setzen Sie die Env-Variable und lassen Sie die Auto-Erkennung sie finden:

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
- `http://` wird nur für vertrauenswürdige Hosts im privaten Netzwerk oder auf loopback akzeptiert
- öffentliche SearXNG-Hosts müssen `https://` verwenden

## Umgebungsvariable

Setzen Sie `SEARXNG_BASE_URL` als Alternative zur Konfiguration:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Wenn `SEARXNG_BASE_URL` gesetzt ist und kein expliziter Provider konfiguriert wurde, wählt die Auto-Erkennung
SearXNG automatisch aus (mit der niedrigsten Priorität -- jeder API-gestützte Provider mit einem
Schlüssel gewinnt zuerst).

## Plugin-Konfigurationsreferenz

| Feld         | Beschreibung                                                         |
| ------------ | -------------------------------------------------------------------- |
| `baseUrl`    | Base-URL Ihrer SearXNG-Instanz (erforderlich)                        |
| `categories` | Kommagetrennte Kategorien wie `general`, `news` oder `science`       |
| `language`   | Sprachcode für Ergebnisse wie `en`, `de` oder `fr`                   |

## Hinweise

- **JSON API** -- verwendet den nativen Endpunkt `format=json` von SearXNG, kein HTML-Scraping
- **Kein API key** -- funktioniert sofort mit jeder SearXNG-Instanz
- **Validierung der Base-URL** -- `baseUrl` muss eine gültige URL `http://` oder `https://`
  sein; öffentliche Hosts müssen `https://` verwenden
- **Reihenfolge der Auto-Erkennung** -- SearXNG wird in der
  Auto-Erkennung zuletzt geprüft (Reihenfolge 200). API-gestützte Provider mit konfigurierten Schlüsseln laufen zuerst, dann
  DuckDuckGo (Reihenfolge 100), dann Ollama Web Search (Reihenfolge 110)
- **Selbst gehostet** -- Sie kontrollieren die Instanz, die Suchanfragen und die Upstream-Suchmaschinen
- **Kategorien** verwenden standardmäßig `general`, wenn nichts konfiguriert ist

<Tip>
  Damit die SearXNG-JSON-API funktioniert, stellen Sie sicher, dass in Ihrer SearXNG-Instanz das Format `json`
  in `settings.yml` unter `search.formats` aktiviert ist.
</Tip>

## Verwandt

- [Web Search overview](/de/tools/web) -- alle Provider und Auto-Erkennung
- [DuckDuckGo Search](/de/tools/duckduckgo-search) -- ein weiterer schlüsselloser Fallback
- [Brave Search](/de/tools/brave-search) -- strukturierte Ergebnisse mit kostenlosem Tier
