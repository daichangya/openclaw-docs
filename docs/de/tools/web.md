---
read_when:
    - Sie möchten `web_search` aktivieren oder konfigurieren
    - Sie möchten `x_search` aktivieren oder konfigurieren
    - Sie müssen einen Search-Provider auswählen
    - Sie möchten die automatische Erkennung und den Provider-Fallback verstehen
sidebarTitle: Web Search
summary: '`web_search`, `x_search` und `web_fetch` -- im Web suchen, X-Posts durchsuchen oder Seiteninhalte abrufen'
title: Web Search
x-i18n:
    generated_at: "2026-04-05T12:59:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8b9a5d641dcdcbe7c099c8862898f12646f43151b6c4152d69c26af9b17e0fa
    source_path: tools/web.md
    workflow: 15
---

# Web Search

Das Tool `web_search` durchsucht das Web mit Ihrem konfigurierten Provider und
gibt Ergebnisse zurück. Ergebnisse werden 15 Minuten lang nach Query gecacht (konfigurierbar).

OpenClaw enthält außerdem `x_search` für X-Posts (früher Twitter) und
`web_fetch` für leichtgewichtigen URL-Abruf. In dieser Phase bleibt `web_fetch`
lokal, während `web_search` und `x_search` unter der Haube xAI Responses verwenden können.

<Info>
  `web_search` ist ein leichtgewichtiges HTTP-Tool, keine Browser-Automatisierung. Für
  JS-lastige Websites oder Logins verwenden Sie den [Web Browser](/tools/browser). Für
  das Abrufen einer bestimmten URL verwenden Sie [Web Fetch](/tools/web-fetch).
</Info>

## Schnellstart

<Steps>
  <Step title="Einen Provider auswählen">
    Wählen Sie einen Provider aus und schließen Sie alle erforderlichen Einrichtungsschritte ab. Einige Provider sind
    schlüsselfrei, während andere API-Schlüssel verwenden. Details finden Sie auf den Provider-Seiten unten.
  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    ```
    Dadurch werden der Provider und alle benötigten Anmeldedaten gespeichert. Sie können auch eine Umgebungsvariable
    setzen (zum Beispiel `BRAVE_API_KEY`) und diesen Schritt bei API-basierten
    Providern überspringen.
  </Step>
  <Step title="Verwenden">
    Der Agent kann jetzt `web_search` aufrufen:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Für X-Posts verwenden Sie:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Einen Provider auswählen

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tools/brave-search">
    Strukturierte Ergebnisse mit Snippets. Unterstützt den Modus `llm-context`, Länder-/Sprachfilter. Kostenlose Stufe verfügbar.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tools/duckduckgo-search">
    Schlüsselfreier Fallback. Kein API-Schlüssel erforderlich. Inoffizielle HTML-basierte Integration.
  </Card>
  <Card title="Exa" icon="brain" href="/tools/exa-search">
    Neuronale + schlüsselwortbasierte Suche mit Inhaltsextraktion (Highlights, Text, Zusammenfassungen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tools/firecrawl">
    Strukturierte Ergebnisse. Am besten zusammen mit `firecrawl_search` und `firecrawl_scrape` für tiefe Extraktion.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tools/gemini-search">
    KI-synthetisierte Antworten mit Quellenangaben über Google-Search-Grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/tools/grok-search">
    KI-synthetisierte Antworten mit Quellenangaben über xAI-Web-Grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/tools/kimi-search">
    KI-synthetisierte Antworten mit Quellenangaben über Moonshot-Websuche.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tools/minimax-search">
    Strukturierte Ergebnisse über die Search-API des MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tools/ollama-search">
    Schlüsselfreie Suche über Ihren konfigurierten Ollama-Host. Erfordert `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/tools/perplexity-search">
    Strukturierte Ergebnisse mit Steuerelementen für Inhaltsextraktion und Domain-Filterung.
  </Card>
  <Card title="SearXNG" icon="server" href="/tools/searxng-search">
    Selbst gehostete Meta-Suche. Kein API-Schlüssel erforderlich. Aggregiert Google, Bing, DuckDuckGo und mehr.
  </Card>
  <Card title="Tavily" icon="globe" href="/tools/tavily">
    Strukturierte Ergebnisse mit Suchtiefe, Themenfilterung und `tavily_extract` zur URL-Extraktion.
  </Card>
</CardGroup>

### Provider-Vergleich

| Provider                                  | Ergebnisstil               | Filter                                           | API-Schlüssel                                                                     |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [Brave](/tools/brave-search)              | Strukturierte Snippets     | Land, Sprache, Zeit, Modus `llm-context`         | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/tools/duckduckgo-search)    | Strukturierte Snippets     | --                                               | Keiner (schlüsselfrei)                                                            |
| [Exa](/tools/exa-search)                  | Strukturiert + extrahiert  | Neuronal-/Keyword-Modus, Datum, Inhaltsextraktion | `EXA_API_KEY`                                                                     |
| [Firecrawl](/tools/firecrawl)             | Strukturierte Snippets     | Über das Tool `firecrawl_search`                 | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/tools/gemini-search)            | KI-synthetisiert + Quellenangaben | --                                        | `GEMINI_API_KEY`                                                                  |
| [Grok](/tools/grok-search)                | KI-synthetisiert + Quellenangaben | --                                        | `XAI_API_KEY`                                                                     |
| [Kimi](/tools/kimi-search)                | KI-synthetisiert + Quellenangaben | --                                        | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/tools/minimax-search)   | Strukturierte Snippets     | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web Search](/tools/ollama-search) | Strukturierte Snippets     | --                                               | Standardmäßig keiner; `ollama signin` erforderlich, kann Ollama-Provider-Bearer-Auth wiederverwenden |
| [Perplexity](/tools/perplexity-search)    | Strukturierte Snippets     | Land, Sprache, Zeit, Domains, Inhaltslimits      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                       |
| [SearXNG](/tools/searxng-search)          | Strukturierte Snippets     | Kategorien, Sprache                              | Keiner (selbst gehostet)                                                          |
| [Tavily](/tools/tavily)                   | Strukturierte Snippets     | Über das Tool `tavily_search`                    | `TAVILY_API_KEY`                                                                  |

## Automatische Erkennung

## Native Codex-Websuche

Codex-fähige Modelle können optional das providernative Responses-Tool `web_search` statt der von OpenClaw verwalteten Funktion `web_search` verwenden.

- Konfigurieren Sie dies unter `tools.web.search.openaiCodex`
- Es wird nur für Codex-fähige Modelle aktiviert (`openai-codex/*` oder Provider mit `api: "openai-codex-responses"`)
- Verwaltetes `web_search` gilt weiterhin für Nicht-Codex-Modelle
- `mode: "cached"` ist die Standard- und empfohlene Einstellung
- `tools.web.search.enabled: false` deaktiviert sowohl verwaltete als auch native Suche

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Wenn die native Codex-Suche aktiviert ist, das aktuelle Modell aber nicht Codex-fähig ist, behält OpenClaw das normale verwaltete Verhalten von `web_search` bei.

## Web Search einrichten

Provider-Listen in der Dokumentation und in Einrichtungsabläufen sind alphabetisch sortiert. Die automatische Erkennung verwendet eine
separate Prioritätsreihenfolge.

Wenn kein `provider` gesetzt ist, prüft OpenClaw die Provider in dieser Reihenfolge und verwendet den
ersten, der bereit ist:

Zuerst API-basierte Provider:

1. **Brave** -- `BRAVE_API_KEY` oder `plugins.entries.brave.config.webSearch.apiKey` (Reihenfolge 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` oder `plugins.entries.minimax.config.webSearch.apiKey` (Reihenfolge 15)
3. **Gemini** -- `GEMINI_API_KEY` oder `plugins.entries.google.config.webSearch.apiKey` (Reihenfolge 20)
4. **Grok** -- `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey` (Reihenfolge 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` oder `plugins.entries.moonshot.config.webSearch.apiKey` (Reihenfolge 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey` (Reihenfolge 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webSearch.apiKey` (Reihenfolge 60)
8. **Exa** -- `EXA_API_KEY` oder `plugins.entries.exa.config.webSearch.apiKey` (Reihenfolge 65)
9. **Tavily** -- `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey` (Reihenfolge 70)

Danach schlüsselfreie Fallbacks:

10. **DuckDuckGo** -- schlüsselfreier HTML-Fallback ohne Konto oder API-Schlüssel (Reihenfolge 100)
11. **Ollama Web Search** -- schlüsselfreier Fallback über Ihren konfigurierten Ollama-Host; erfordert, dass Ollama erreichbar ist und Sie mit `ollama signin` angemeldet sind, und kann Ollama-Provider-Bearer-Auth wiederverwenden, falls der Host diese benötigt (Reihenfolge 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (Reihenfolge 200)

Wenn kein Provider erkannt wird, fällt OpenClaw auf Brave zurück (Sie erhalten dann einen Fehler wegen eines fehlenden Schlüssels,
der Sie zur Konfiguration auffordert).

<Note>
  Alle Schlüssel-Felder von Providern unterstützen SecretRef-Objekte. Im Modus der automatischen Erkennung
  löst OpenClaw nur den Schlüssel des ausgewählten Providers auf -- SecretRefs nicht ausgewählter Provider
  bleiben inaktiv.
</Note>

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Providerspezifische Konfiguration (API-Schlüssel, Base-URLs, Modi) befindet sich unter
`plugins.entries.<plugin>.config.webSearch.*`. Beispiele finden Sie auf den
Provider-Seiten.

Die Auswahl des Fallback-Providers für `web_fetch` ist separat:

- wählen Sie ihn mit `tools.web.fetch.provider`
- oder lassen Sie dieses Feld weg und lassen Sie OpenClaw automatisch den ersten bereiten Web-Fetch-
  Provider anhand verfügbarer Anmeldedaten erkennen
- der derzeit gebündelte Web-Fetch-Provider ist Firecrawl, konfiguriert unter
  `plugins.entries.firecrawl.config.webFetch.*`

Wenn Sie **Kimi** während `openclaw onboard` oder
`openclaw configure --section web` auswählen, kann OpenClaw zusätzlich nach Folgendem fragen:

- der Moonshot-API-Region (`https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`)
- dem Standardmodell für Kimi-Websuche (Standard ist `kimi-k2.5`)

Für `x_search` konfigurieren Sie `plugins.entries.xai.config.xSearch.*`. Es verwendet denselben
`XAI_API_KEY`-Fallback wie Grok Web Search.
Die veraltete Konfiguration `tools.web.x_search.*` wird von `openclaw doctor --fix` automatisch migriert.
Wenn Sie Grok während `openclaw onboard` oder `openclaw configure --section web` auswählen,
kann OpenClaw auch eine optionale Einrichtung von `x_search` mit demselben Schlüssel anbieten.
Dies ist ein separater Folgeschritt innerhalb des Grok-Pfads, keine separate Auswahl
eines Web-Search-Providers auf oberster Ebene. Wenn Sie einen anderen Provider auswählen, zeigt OpenClaw die Abfrage für `x_search` nicht an.

### API-Schlüssel speichern

<Tabs>
  <Tab title="Konfigurationsdatei">
    Führen Sie `openclaw configure --section web` aus oder setzen Sie den Schlüssel direkt:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Umgebungsvariable">
    Setzen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Gateways:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Bei einer Gateway-Installation legen Sie sie in `~/.openclaw/.env` ab.
    Siehe [Umgebungsvariablen](/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tool-Parameter

| Parameter             | Beschreibung                                          |
| --------------------- | ----------------------------------------------------- |
| `query`               | Suchanfrage (erforderlich)                            |
| `count`               | Zurückzugebende Ergebnisse (1-10, Standard: 5)        |
| `country`             | 2-stelliger ISO-Ländercode (z. B. "US", "DE")         |
| `language`            | ISO-639-1-Sprachcode (z. B. "en", "de")               |
| `search_lang`         | Suchsprachen-Code (nur Brave)                         |
| `freshness`           | Zeitfilter: `day`, `week`, `month` oder `year`        |
| `date_after`          | Ergebnisse nach diesem Datum (YYYY-MM-DD)             |
| `date_before`         | Ergebnisse vor diesem Datum (YYYY-MM-DD)              |
| `ui_lang`             | UI-Sprachcode (nur Brave)                             |
| `domain_filter`       | Domain-Allowlist-/Denylist-Array (nur Perplexity)     |
| `max_tokens`          | Gesamtes Inhaltsbudget, Standard 25000 (nur Perplexity) |
| `max_tokens_per_page` | Token-Limit pro Seite, Standard 2048 (nur Perplexity) |

<Warning>
  Nicht alle Parameter funktionieren mit allen Providern. Der Modus `llm-context` von Brave
  lehnt `ui_lang`, `freshness`, `date_after` und `date_before` ab.
  Gemini, Grok und Kimi geben eine synthetisierte Antwort mit Quellenangaben zurück. Sie
  akzeptieren `count` zur Kompatibilität mit gemeinsam genutzten Tools, aber es verändert nicht die
  Form der geerdeten Antwort.
  Perplexity verhält sich genauso, wenn Sie den Kompatibilitätspfad Sonar/OpenRouter
  verwenden (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` oder `OPENROUTER_API_KEY`).
  SearXNG akzeptiert `http://` nur für vertrauenswürdige Hosts im privaten Netzwerk oder auf loopback;
  öffentliche SearXNG-Endpunkte müssen `https://` verwenden.
  Firecrawl und Tavily unterstützen über `web_search` nur `query` und `count`
  -- verwenden Sie deren dedizierte Tools für erweiterte Optionen.
</Warning>

## x_search

`x_search` durchsucht X-Posts (früher Twitter) mit xAI und gibt
KI-synthetisierte Antworten mit Quellenangaben zurück. Es akzeptiert natürlichsprachliche Queries und
optionale strukturierte Filter. OpenClaw aktiviert das integrierte xAI-Tool `x_search` nur bei der Anfrage, die diesen Tool-Aufruf bedient.

<Note>
  xAI dokumentiert `x_search` als Unterstützung für Keyword-Suche, semantische Suche, Benutzer-
  Suche und Thread-Abruf. Für postbezogene Interaktionsstatistiken wie Reposts,
  Antworten, Lesezeichen oder Aufrufe sollten Sie bevorzugt eine gezielte Abfrage für die exakte Post-URL
  oder Status-ID verwenden. Breite Keyword-Suchen können den richtigen Post finden, aber weniger
  vollständige postbezogene Metadaten zurückgeben. Ein gutes Muster ist: zuerst den Post finden, dann
  eine zweite `x_search`-Query ausführen, die auf genau diesen Post fokussiert ist.
</Note>

### `x_search` konfigurieren

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### `x_search`-Parameter

| Parameter                    | Beschreibung                                         |
| ---------------------------- | ---------------------------------------------------- |
| `query`                      | Suchanfrage (erforderlich)                           |
| `allowed_x_handles`          | Ergebnisse auf bestimmte X-Handles beschränken       |
| `excluded_x_handles`         | Bestimmte X-Handles ausschließen                     |
| `from_date`                  | Nur Posts an oder nach diesem Datum einschließen (YYYY-MM-DD) |
| `to_date`                    | Nur Posts an oder vor diesem Datum einschließen (YYYY-MM-DD) |
| `enable_image_understanding` | xAI Bilder prüfen lassen, die an passende Posts angehängt sind |
| `enable_video_understanding` | xAI Videos prüfen lassen, die an passende Posts angehängt sind |

### `x_search`-Beispiel

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Postbezogene Statistiken: wenn möglich die exakte Status-URL oder Status-ID verwenden
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Beispiele

```javascript
// Einfache Suche
await web_search({ query: "OpenClaw plugin SDK" });

// Suche speziell für Deutschland
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Aktuelle Ergebnisse (letzte Woche)
await web_search({ query: "AI developments", freshness: "week" });

// Datumsbereich
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain-Filterung (nur Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Tool-Profile

Wenn Sie Tool-Profile oder Allowlists verwenden, fügen Sie `web_search`, `x_search` oder `group:web` hinzu:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Verwandt

- [Web Fetch](/tools/web-fetch) -- eine URL abrufen und lesbaren Inhalt extrahieren
- [Web Browser](/tools/browser) -- vollständige Browser-Automatisierung für JS-lastige Websites
- [Grok Search](/tools/grok-search) -- Grok als `web_search`-Provider
- [Ollama Web Search](/tools/ollama-search) -- schlüsselfreie Websuche über Ihren Ollama-Host
