---
read_when:
    - Sie möchten Perplexity als Websuch-Provider konfigurieren
    - Sie benötigen die Einrichtung des Perplexity-API-Keys oder des OpenRouter-Proxys
summary: Einrichtung des Websuch-Providers Perplexity (API-Key, Suchmodi, Filterung)
title: Perplexity (Provider)
x-i18n:
    generated_at: "2026-04-05T12:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9082d15d6a36a096e21efe8cee78e4b8643252225520f5b96a0b99cf5a7a4b
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Websuch-Provider)

Das Perplexity-Plugin stellt Websuchfunktionen über die Perplexity-
Search-API oder Perplexity Sonar über OpenRouter bereit.

<Note>
Diese Seite behandelt die Einrichtung des Perplexity-**Providers**. Informationen zum Perplexity-
**Tool** (wie der Agent es verwendet) finden Sie unter [Perplexity-Tool](/tools/perplexity-search).
</Note>

- Typ: Websuch-Provider (kein Model-Provider)
- Authentifizierung: `PERPLEXITY_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter)
- Konfigurationspfad: `plugins.entries.perplexity.config.webSearch.apiKey`

## Schnellstart

1. Den API-Key setzen:

```bash
openclaw configure --section web
```

Oder direkt setzen:

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. Der Agent verwendet Perplexity automatisch für Websuchen, wenn es konfiguriert ist.

## Suchmodi

Das Plugin wählt den Transport anhand des Präfixes des API-Keys automatisch aus:

| Key-Präfix | Transport                     | Funktionen                                       |
| ---------- | ----------------------------- | ------------------------------------------------ |
| `pplx-`    | Native Perplexity-Search-API  | Strukturierte Ergebnisse, Domain-/Sprach-/Datumsfilter |
| `sk-or-`   | OpenRouter (Sonar)            | KI-synthetisierte Antworten mit Zitaten          |

## Filterung der nativen API

Bei Verwendung der nativen Perplexity-API (Schlüssel mit Präfix `pplx-`) unterstützen Suchen:

- **Land**: aus 2 Buchstaben bestehender Ländercode
- **Sprache**: ISO-639-1-Sprachcode
- **Datumsbereich**: Tag, Woche, Monat, Jahr
- **Domain-Filter**: Allowlist/Denylist (maximal 20 Domains)
- **Content-Budget**: `max_tokens`, `max_tokens_per_page`

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (`launchd`/`systemd`), stellen Sie sicher, dass
`PERPLEXITY_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in
`~/.openclaw/.env` oder über `env.shellEnv`).
