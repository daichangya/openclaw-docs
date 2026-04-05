---
read_when:
    - Sie Brave Search für web_search verwenden möchten
    - Sie einen BRAVE_API_KEY oder Tarifdetails benötigen
summary: Einrichtung der Brave Search API für web_search
title: Brave Search (veralteter Pfad)
x-i18n:
    generated_at: "2026-04-05T12:34:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw unterstützt die Brave Search API als `web_search`-Provider.

## API-Schlüssel abrufen

1. Erstellen Sie ein Brave-Search-API-Konto unter [https://brave.com/search/api/](https://brave.com/search/api/)
2. Wählen Sie im Dashboard den Tarif **Search** und generieren Sie einen API-Schlüssel.
3. Speichern Sie den Schlüssel in der Konfiguration oder setzen Sie `BRAVE_API_KEY` in der Gateway-Umgebung.

## Konfigurationsbeispiel

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Provider-spezifische Brave-Sucheinstellungen befinden sich jetzt unter `plugins.entries.brave.config.webSearch.*`.
Das veraltete `tools.web.search.apiKey` wird weiterhin über den Kompatibilitäts-Shim geladen, ist aber nicht mehr der kanonische Konfigurationspfad.

`webSearch.mode` steuert den Brave-Transport:

- `web` (Standard): normale Brave-Websuche mit Titeln, URLs und Snippets
- `llm-context`: Brave LLM Context API mit vorab extrahierten Textabschnitten und Quellen zur Verankerung

## Tool-Parameter

| Parameter     | Beschreibung                                                      |
| ------------- | ----------------------------------------------------------------- |
| `query`       | Suchanfrage (erforderlich)                                        |
| `count`       | Anzahl der zurückzugebenden Ergebnisse (1–10, Standard: 5)        |
| `country`     | 2-stelliger ISO-Ländercode (z. B. "US", "DE")                    |
| `language`    | ISO-639-1-Sprachcode für Suchergebnisse (z. B. "en", "de", "fr") |
| `search_lang` | Brave-Suchsprachcode (z. B. `en`, `en-gb`, `zh-hans`)            |
| `ui_lang`     | ISO-Sprachcode für UI-Elemente                                    |
| `freshness`   | Zeitfilter: `day` (24 h), `week`, `month` oder `year`             |
| `date_after`  | Nur Ergebnisse, die nach diesem Datum veröffentlicht wurden (YYYY-MM-DD) |
| `date_before` | Nur Ergebnisse, die vor diesem Datum veröffentlicht wurden (YYYY-MM-DD) |

**Beispiele:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Hinweise

- OpenClaw verwendet den Brave-Tarif **Search**. Wenn Sie ein veraltetes Abonnement haben (z. B. den ursprünglichen Free-Tarif mit 2.000 Anfragen/Monat), bleibt dieses gültig, umfasst aber keine neueren Funktionen wie LLM Context oder höhere Ratenlimits.
- Jeder Brave-Tarif umfasst **5 $/Monat an kostenlosem Guthaben** (wird erneuert). Der Search-Tarif kostet 5 $ pro 1.000 Anfragen, daher deckt das Guthaben 1.000 Anfragen/Monat ab. Legen Sie Ihr Nutzungslimit im Brave-Dashboard fest, um unerwartete Kosten zu vermeiden. Aktuelle Tarife finden Sie im [Brave API portal](https://brave.com/search/api/).
- Der Search-Tarif umfasst den Endpunkt LLM Context und KI-Inferenzrechte. Das Speichern von Ergebnissen zum Trainieren oder Abstimmen von Modellen erfordert einen Tarif mit ausdrücklichen Speicherrechten. Siehe die Brave-[Terms of Service](https://api-dashboard.search.brave.com/terms-of-service).
- Der Modus `llm-context` gibt verankerte Quelleneinträge statt der normalen Websuch-Snippet-Struktur zurück.
- Der Modus `llm-context` unterstützt `ui_lang`, `freshness`, `date_after` oder `date_before` nicht.
- `ui_lang` muss ein Regions-Subtag wie `en-US` enthalten.
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert (konfigurierbar über `cacheTtlMinutes`).

Siehe [Web-Tools](/tools/web) für die vollständige `web_search`-Konfiguration.
