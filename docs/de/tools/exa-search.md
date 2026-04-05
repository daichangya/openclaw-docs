---
read_when:
    - Sie möchten Exa für web_search verwenden
    - Sie benötigen einen `EXA_API_KEY`
    - Sie möchten neuronale Suche oder Inhalts-Extraktion verwenden
summary: Exa-AI-Suche -- neuronale Suche und Stichwortsuche mit Inhalts-Extraktion
title: Exa Search
x-i18n:
    generated_at: "2026-04-05T12:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Exa Search

OpenClaw unterstützt [Exa AI](https://exa.ai/) als `web_search`-Provider. Exa
bietet neuronale, stichwortbasierte und hybride Suchmodi mit integrierter
Inhalts-Extraktion (Highlights, Text, Zusammenfassungen).

## API-Schlüssel abrufen

<Steps>
  <Step title="Konto erstellen">
    Registrieren Sie sich bei [exa.ai](https://exa.ai/) und erzeugen Sie in Ihrem
    Dashboard einen API-Schlüssel.
  </Step>
  <Step title="Schlüssel speichern">
    Setzen Sie `EXA_API_KEY` in der Gateway-Umgebung oder konfigurieren Sie ihn über:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfiguration

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternative über Umgebungsvariable:** Setzen Sie `EXA_API_KEY` in der Gateway-Umgebung.
Für eine Gateway-Installation fügen Sie ihn in `~/.openclaw/.env` ein.

## Tool-Parameter

| Parameter     | Beschreibung                                                                   |
| ------------- | ------------------------------------------------------------------------------ |
| `query`       | Suchanfrage (erforderlich)                                                     |
| `count`       | Anzahl der zurückzugebenden Ergebnisse (1-100)                                 |
| `type`        | Suchmodus: `auto`, `neural`, `fast`, `deep`, `deep-reasoning` oder `instant`   |
| `freshness`   | Zeitfilter: `day`, `week`, `month` oder `year`                                 |
| `date_after`  | Ergebnisse nach diesem Datum (YYYY-MM-DD)                                      |
| `date_before` | Ergebnisse vor diesem Datum (YYYY-MM-DD)                                       |
| `contents`    | Optionen für die Inhalts-Extraktion (siehe unten)                              |

### Inhalts-Extraktion

Exa kann extrahierte Inhalte zusammen mit Suchergebnissen zurückgeben. Übergeben Sie ein `contents`-
Objekt, um dies zu aktivieren:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Option in `contents` | Typ                                                                  | Beschreibung                 |
| -------------------- | --------------------------------------------------------------------- | ---------------------------- |
| `text`               | `boolean \| { maxCharacters }`                                        | Vollständigen Seitentext extrahieren |
| `highlights`         | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Wichtige Sätze extrahieren   |
| `summary`            | `boolean \| { query }`                                                | KI-generierte Zusammenfassung |

### Suchmodi

| Modus            | Beschreibung                        |
| ---------------- | ----------------------------------- |
| `auto`           | Exa wählt den besten Modus (Standard) |
| `neural`         | Semantische/bedeutungsbasierte Suche |
| `fast`           | Schnelle Stichwortsuche             |
| `deep`           | Gründliche Tiefensuche              |
| `deep-reasoning` | Tiefensuche mit Reasoning           |
| `instant`        | Schnellste Ergebnisse               |

## Hinweise

- Wenn keine Option `contents` angegeben wird, verwendet Exa standardmäßig `{ highlights: true }`,
  sodass Ergebnisse Auszüge wichtiger Sätze enthalten
- Ergebnisse behalten die Felder `highlightScores` und `summary` aus der Exa-API-
  Antwort bei, sofern verfügbar
- Ergebnisbeschreibungen werden zuerst aus Highlights, dann aus der Zusammenfassung und anschließend aus
  dem Volltext aufgelöst — je nachdem, was verfügbar ist
- `freshness` und `date_after`/`date_before` können nicht kombiniert werden — verwenden Sie einen
  Zeitfiltermodus
- Pro Anfrage können bis zu 100 Ergebnisse zurückgegeben werden (vorbehaltlich der Grenzen
  des Exa-Suchtyps)
- Ergebnisse werden standardmäßig 15 Minuten lang zwischengespeichert (konfigurierbar über
  `cacheTtlMinutes`)
- Exa ist eine offizielle API-Integration mit strukturierten JSON-Antworten

## Verwandt

- [Überblick über Web Search](/tools/web) -- alle Provider und automatische Erkennung
- [Brave Search](/tools/brave-search) -- strukturierte Ergebnisse mit Länder-/Sprachfiltern
- [Perplexity Search](/tools/perplexity-search) -- strukturierte Ergebnisse mit Domain-Filterung
