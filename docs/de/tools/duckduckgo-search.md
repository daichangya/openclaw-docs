---
read_when:
    - Sie möchten einen Websuch-Provider, der keinen API-Schlüssel benötigt
    - Sie möchten DuckDuckGo für `web_search` verwenden
    - Sie benötigen einen Such-Fallback ohne Konfiguration
summary: DuckDuckGo-Websuche – schlüsselfreier Fallback-Provider (experimentell, HTML-basiert)
title: DuckDuckGo Search
x-i18n:
    generated_at: "2026-04-05T12:57:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# DuckDuckGo Search

OpenClaw unterstützt DuckDuckGo als **schlüsselfreien** `web_search`-Provider. Es ist kein API-
Schlüssel und kein Konto erforderlich.

<Warning>
  DuckDuckGo ist eine **experimentelle, inoffizielle** Integration, die Ergebnisse
  aus den Nicht-JavaScript-Suchseiten von DuckDuckGo abruft – nicht aus einer offiziellen API. Rechnen Sie
  mit gelegentlichen Ausfällen durch Bot-Challenge-Seiten oder HTML-Änderungen.
</Warning>

## Einrichtung

Es wird kein API-Schlüssel benötigt — setzen Sie DuckDuckGo einfach als Ihren Provider:

<Steps>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    # Wählen Sie "duckduckgo" als Provider aus
    ```
  </Step>
</Steps>

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Optionale Einstellungen auf Plugin-Ebene für Region und SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo-Regionscode
            safeSearch: "moderate", // "strict", "moderate", oder "off"
          },
        },
      },
    },
  },
}
```

## Tool-Parameter

| Parameter    | Beschreibung                                                  |
| ------------ | ------------------------------------------------------------- |
| `query`      | Suchanfrage (erforderlich)                                    |
| `count`      | Zurückzugebende Ergebnisse (1-10, Standard: 5)                |
| `region`     | DuckDuckGo-Regionscode (z. B. `us-en`, `uk-en`, `de-de`)      |
| `safeSearch` | SafeSearch-Stufe: `strict`, `moderate` (Standard) oder `off`  |

Region und SafeSearch können auch in der Plugin-Konfiguration gesetzt werden (siehe oben) — Tool-
Parameter überschreiben Konfigurationswerte pro Anfrage.

## Hinweise

- **Kein API-Schlüssel** — funktioniert sofort, ohne Konfiguration
- **Experimentell** — sammelt Ergebnisse aus den HTML-
  Suchseiten von DuckDuckGo ohne JavaScript, nicht aus einer offiziellen API oder einem SDK
- **Bot-Challenge-Risiko** — DuckDuckGo kann CAPTCHAs ausliefern oder Anfragen
  bei intensiver oder automatisierter Nutzung blockieren
- **HTML-Parsing** — Ergebnisse hängen von der Seitenstruktur ab, die sich ohne
  Vorankündigung ändern kann
- **Reihenfolge der automatischen Erkennung** — DuckDuckGo ist der erste schlüsselfreie Fallback
  (Reihenfolge 100) in der automatischen Erkennung. API-gestützte Provider mit konfigurierten Schlüsseln laufen
  zuerst, dann Ollama Web Search (Reihenfolge 110), dann SearXNG (Reihenfolge 200)
- **SafeSearch ist standardmäßig auf moderate gesetzt**, wenn nichts konfiguriert ist

<Tip>
  Für den Produktionseinsatz sollten Sie [Brave Search](/tools/brave-search) (mit
  verfügbarem Free-Tier) oder einen anderen API-gestützten Provider in Betracht ziehen.
</Tip>

## Verwandte Themen

- [Überblick über Web Search](/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/tools/brave-search) -- strukturierte Ergebnisse mit Free-Tier
- [Exa Search](/tools/exa-search) -- neuronale Suche mit Inhalts-Extraktion
