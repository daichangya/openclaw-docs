---
read_when:
    - Sie möchten `web_search` aktivieren oder konfigurieren
    - Sie möchten `x_search` aktivieren oder konfigurieren
    - Sie müssen einen Suchanbieter auswählen
    - Sie möchten die automatische Erkennung und den Provider-Fallback verstehen
sidebarTitle: Web Search
summary: web_search, x_search und web_fetch – das Web durchsuchen, X-Posts durchsuchen oder Seiteninhalte abrufen
title: Websuche
x-i18n:
    generated_at: "2026-04-21T06:31:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e88a891ce28a5fe1baf4b9ce8565c59ba2d2695c63d77af232edd7f3fd2cd8a
    source_path: tools/web.md
    workflow: 15
---

# Websuche

Das Tool `web_search` durchsucht das Web mit Ihrem konfigurierten Anbieter und
gibt Ergebnisse zurück. Ergebnisse werden 15 Minuten lang nach Anfrage gecacht
(konfigurierbar).

OpenClaw enthält außerdem `x_search` für X-Posts (früher Twitter) und
`web_fetch` für leichtgewichtiges Abrufen von URLs. In dieser Phase bleibt
`web_fetch` lokal, während `web_search` und `x_search` unter der Haube xAI Responses verwenden können.

<Info>
  `web_search` ist ein leichtgewichtiges HTTP-Tool, keine Browser-Automatisierung. Für
  JS-lastige Seiten oder Logins verwenden Sie den [Web Browser](/de/tools/browser). Für
  das Abrufen einer bestimmten URL verwenden Sie [Web Fetch](/de/tools/web-fetch).
</Info>

## Schnellstart

<Steps>
  <Step title="Anbieter wählen">
    Wählen Sie einen Anbieter und führen Sie alle erforderlichen Einrichtungsschritte aus. Einige Anbieter sind
    ohne Schlüssel nutzbar, andere verwenden API-Schlüssel. Details finden Sie auf den unten verlinkten
    Anbieter-Seiten.
  </Step>
  <Step title="Konfigurieren">
    ```bash
    openclaw configure --section web
    ```
    Dadurch werden der Anbieter und alle erforderlichen Anmeldedaten gespeichert. Sie können auch eine Env-
    Variable setzen (zum Beispiel `BRAVE_API_KEY`) und diesen Schritt für API-gestützte
    Anbieter überspringen.
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

## Einen Anbieter auswählen

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/de/tools/brave-search">
    Strukturierte Ergebnisse mit Snippets. Unterstützt den Modus `llm-context`, Länder-/Sprachfilter. Kostenlose Stufe verfügbar.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/de/tools/duckduckgo-search">
    Schlüsselfreier Fallback. Kein API-Schlüssel erforderlich. Inoffizielle HTML-basierte Integration.
  </Card>
  <Card title="Exa" icon="brain" href="/de/tools/exa-search">
    Neuronale + schlüsselwortbasierte Suche mit Inhaltsextraktion (Highlights, Text, Zusammenfassungen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/de/tools/firecrawl">
    Strukturierte Ergebnisse. Am besten in Kombination mit `firecrawl_search` und `firecrawl_scrape` für tiefe Extraktion.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/de/tools/gemini-search">
    KI-synthetisierte Antworten mit Zitaten über Google-Search-Grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/de/tools/grok-search">
    KI-synthetisierte Antworten mit Zitaten über xAI-Web-Grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/de/tools/kimi-search">
    KI-synthetisierte Antworten mit Zitaten über Moonshot-Websuche.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/de/tools/minimax-search">
    Strukturierte Ergebnisse über die Such-API des MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/de/tools/ollama-search">
    Schlüsselfreie Suche über Ihren konfigurierten Ollama-Host. Erfordert `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/de/tools/perplexity-search">
    Strukturierte Ergebnisse mit Steuerung der Inhaltsextraktion und Domain-Filterung.
  </Card>
  <Card title="SearXNG" icon="server" href="/de/tools/searxng-search">
    Selbst gehostete Meta-Suche. Kein API-Schlüssel erforderlich. Aggregiert Google, Bing, DuckDuckGo und mehr.
  </Card>
  <Card title="Tavily" icon="globe" href="/de/tools/tavily">
    Strukturierte Ergebnisse mit Suchtiefe, Themenfilterung und `tavily_extract` für URL-Extraktion.
  </Card>
</CardGroup>

### Anbietervergleich

| Anbieter                                  | Ergebnisstil               | Filter                                           | API-Schlüssel                                                                    |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [Brave](/de/tools/brave-search)              | Strukturierte Snippets     | Land, Sprache, Zeit, Modus `llm-context`         | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/de/tools/duckduckgo-search)    | Strukturierte Snippets     | --                                               | Keiner (schlüsselfrei)                                                            |
| [Exa](/de/tools/exa-search)                  | Strukturiert + extrahiert  | Neuraler/Schlüsselwort-Modus, Datum, Inhaltsextraktion | `EXA_API_KEY`                                                                 |
| [Firecrawl](/de/tools/firecrawl)             | Strukturierte Snippets     | Über das Tool `firecrawl_search`                 | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/de/tools/gemini-search)            | KI-synthetisiert + Zitate  | --                                               | `GEMINI_API_KEY`                                                                  |
| [Grok](/de/tools/grok-search)                | KI-synthetisiert + Zitate  | --                                               | `XAI_API_KEY`                                                                     |
| [Kimi](/de/tools/kimi-search)                | KI-synthetisiert + Zitate  | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/de/tools/minimax-search)   | Strukturierte Snippets     | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web Search](/de/tools/ollama-search) | Strukturierte Snippets     | --                                               | Standardmäßig keiner; `ollama signin` erforderlich, kann Bearer-Auth des Ollama-Providers wiederverwenden |
| [Perplexity](/de/tools/perplexity-search)    | Strukturierte Snippets     | Land, Sprache, Zeit, Domains, Inhaltslimits      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                       |
| [SearXNG](/de/tools/searxng-search)          | Strukturierte Snippets     | Kategorien, Sprache                              | Keiner (selbst gehostet)                                                          |
| [Tavily](/de/tools/tavily)                   | Strukturierte Snippets     | Über das Tool `tavily_search`                    | `TAVILY_API_KEY`                                                                  |

## Automatische Erkennung

## Native Codex-Websuche

Codex-fähige Modelle können optional das anbieter-native Responses-Tool `web_search` statt der von OpenClaw verwalteten Funktion `web_search` verwenden.

- Konfigurieren Sie es unter `tools.web.search.openaiCodex`
- Es wird nur für Codex-fähige Modelle aktiviert (`openai-codex/*` oder Anbieter mit `api: "openai-codex-responses"`)
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

Wenn die native Codex-Suche aktiviert ist, das aktuelle Modell aber nicht Codex-fähig ist, behält OpenClaw das normale Verhalten des verwalteten `web_search` bei.

## Websuche einrichten

Anbieterlisten in der Dokumentation und in Setup-Abläufen sind alphabetisch sortiert. Die automatische Erkennung verwendet eine
separate Prioritätsreihenfolge.

Wenn kein `provider` gesetzt ist, prüft OpenClaw Anbieter in dieser Reihenfolge und verwendet den
ersten, der bereit ist:

Zuerst API-gestützte Anbieter:

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
11. **Ollama Web Search** -- schlüsselfreier Fallback über Ihren konfigurierten Ollama-Host; erfordert, dass Ollama erreichbar ist und mit `ollama signin` angemeldet wurde, und kann Bearer-Auth des Ollama-Providers wiederverwenden, wenn der Host dies benötigt (Reihenfolge 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (Reihenfolge 200)

Wenn kein Anbieter erkannt wird, fällt OpenClaw auf Brave zurück (Sie erhalten dann einen Fehler wegen eines fehlenden Schlüssels,
der Sie zur Konfiguration auffordert).

<Note>
  Alle Felder für Anbieterschlüssel unterstützen SecretRef-Objekte. Im Modus der automatischen Erkennung
  löst OpenClaw nur den Schlüssel des ausgewählten Anbieters auf -- SecretRefs nicht ausgewählter Anbieter
  bleiben inaktiv.
</Note>

## Konfiguration

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // Standard: true
        provider: "brave", // oder weglassen für automatische Erkennung
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Anbieterspezifische Konfigurationen (API-Schlüssel, Basis-URLs, Modi) befinden sich unter
`plugins.entries.<plugin>.config.webSearch.*`. Beispiele finden Sie auf den
jeweiligen Anbieter-Seiten.

Die Auswahl des Fallback-Anbieters für `web_fetch` ist getrennt:

- wählen Sie ihn mit `tools.web.fetch.provider`
- oder lassen Sie dieses Feld weg und lassen Sie OpenClaw automatisch den ersten bereiten `web_fetch`-
  Anbieter aus verfügbaren Anmeldedaten erkennen
- derzeit ist der gebündelte `web_fetch`-Anbieter Firecrawl, konfiguriert unter
  `plugins.entries.firecrawl.config.webFetch.*`

Wenn Sie **Kimi** während `openclaw onboard` oder
`openclaw configure --section web` auswählen, kann OpenClaw zusätzlich fragen nach:

- der Moonshot-API-Region (`https://api.moonshot.ai/v1` oder `https://api.moonshot.cn/v1`)
- dem Standardmodell für die Kimi-Websuche (Standard ist `kimi-k2.6`)

Für `x_search` konfigurieren Sie `plugins.entries.xai.config.xSearch.*`. Es verwendet denselben
`XAI_API_KEY`-Fallback wie die Grok-Websuche.
Ältere Konfiguration unter `tools.web.x_search.*` wird von `openclaw doctor --fix` automatisch migriert.
Wenn Sie Grok während `openclaw onboard` oder `openclaw configure --section web` auswählen,
kann OpenClaw auch optional ein `x_search`-Setup mit demselben Schlüssel anbieten.
Dies ist ein separater Folgeschritt innerhalb des Grok-Pfads, keine separate Auswahl eines Websuchanbieters auf oberster Ebene.
Wenn Sie einen anderen Anbieter auswählen, zeigt OpenClaw die `x_search`-Abfrage nicht an.

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
    Setzen Sie die Env-Variable des Anbieters in der Prozessumgebung des Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Für eine Gateway-Installation legen Sie sie in `~/.openclaw/.env` ab.
    Siehe [Env vars](/de/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tool-Parameter

| Parameter             | Beschreibung                                           |
| --------------------- | ------------------------------------------------------ |
| `query`               | Suchanfrage (erforderlich)                             |
| `count`               | Zurückzugebende Ergebnisse (1-10, Standard: 5)         |
| `country`             | 2-stelliger ISO-Ländercode (z. B. `"US"`, `"DE"`)      |
| `language`            | ISO-639-1-Sprachcode (z. B. `"en"`, `"de"`)            |
| `search_lang`         | Code der Suchsprache (nur Brave)                       |
| `freshness`           | Zeitfilter: `day`, `week`, `month` oder `year`         |
| `date_after`          | Ergebnisse nach diesem Datum (YYYY-MM-DD)              |
| `date_before`         | Ergebnisse vor diesem Datum (YYYY-MM-DD)               |
| `ui_lang`             | UI-Sprachcode (nur Brave)                              |
| `domain_filter`       | Array für Domain-Allowlist/Denylist (nur Perplexity)   |
| `max_tokens`          | Gesamtes Inhaltsbudget, Standard 25000 (nur Perplexity) |
| `max_tokens_per_page` | Token-Limit pro Seite, Standard 2048 (nur Perplexity)  |

<Warning>
  Nicht alle Parameter funktionieren mit allen Anbietern. Der Brave-Modus `llm-context`
  lehnt `ui_lang`, `freshness`, `date_after` und `date_before` ab.
  Gemini, Grok und Kimi geben eine synthetisierte Antwort mit Zitaten zurück. Sie
  akzeptieren `count` zur Kompatibilität mit gemeinsam genutzten Tools, aber dies
  ändert nicht die Form der geerdeten Antwort.
  Perplexity verhält sich genauso, wenn Sie den Sonar-/OpenRouter-
  Kompatibilitätspfad verwenden (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` oder `OPENROUTER_API_KEY`).
  SearXNG akzeptiert `http://` nur für vertrauenswürdige private-network- oder Loopback-Hosts;
  öffentliche SearXNG-Endpunkte müssen `https://` verwenden.
  Firecrawl und Tavily unterstützen über `web_search` nur `query` und `count`
  -- verwenden Sie ihre dedizierten Tools für erweiterte Optionen.
</Warning>

## x_search

`x_search` durchsucht X-Posts (früher Twitter) mit xAI und gibt
KI-synthetisierte Antworten mit Zitaten zurück. Es akzeptiert natürlichsprachige Suchanfragen und
optionale strukturierte Filter. OpenClaw aktiviert das integrierte xAI-Tool `x_search` nur
für die Anfrage, die diesen Tool-Aufruf bedient.

<Note>
  xAI dokumentiert `x_search` mit Unterstützung für Schlüsselwortsuche, semantische Suche, Benutzer-
  Suche und Thread-Abruf. Für Engagement-Statistiken pro Post wie Reposts,
  Antworten, Bookmarks oder Views bevorzugen Sie eine gezielte Abfrage der exakten Post-URL
  oder Status-ID. Breite Schlüsselwortsuchen können den richtigen Post finden, aber weniger
  vollständige Metadaten pro Post zurückgeben. Ein gutes Muster ist: Zuerst den Post lokalisieren, dann
  eine zweite `x_search`-Anfrage ausführen, die genau auf diesen Post fokussiert ist.
</Note>

### x_search-Konfiguration

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
            apiKey: "xai-...", // optional wenn XAI_API_KEY gesetzt ist
          },
        },
      },
    },
  },
}
```

### x_search-Parameter

| Parameter                    | Beschreibung                                          |
| ---------------------------- | ----------------------------------------------------- |
| `query`                      | Suchanfrage (erforderlich)                            |
| `allowed_x_handles`          | Ergebnisse auf bestimmte X-Handles beschränken        |
| `excluded_x_handles`         | Bestimmte X-Handles ausschließen                      |
| `from_date`                  | Nur Posts an oder nach diesem Datum einschließen (YYYY-MM-DD) |
| `to_date`                    | Nur Posts an oder vor diesem Datum einschließen (YYYY-MM-DD)  |
| `enable_image_understanding` | xAI Bilder untersuchen lassen, die an passende Posts angehängt sind |
| `enable_video_understanding` | xAI Videos untersuchen lassen, die an passende Posts angehängt sind |

### x_search-Beispiel

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statistiken pro Post: wenn möglich die exakte Status-URL oder Status-ID verwenden
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Beispiele

```javascript
// Einfache Suche
await web_search({ query: "OpenClaw plugin SDK" });

// Deutschland-spezifische Suche
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
    // oder: allow: ["group:web"]  (enthält web_search, x_search und web_fetch)
  },
}
```

## Verwandt

- [Web Fetch](/de/tools/web-fetch) -- eine URL abrufen und lesbaren Inhalt extrahieren
- [Web Browser](/de/tools/browser) -- vollständige Browser-Automatisierung für JS-lastige Seiten
- [Grok Search](/de/tools/grok-search) -- Grok als Anbieter für `web_search`
- [Ollama Web Search](/de/tools/ollama-search) -- schlüsselfreie Websuche über Ihren Ollama-Host
