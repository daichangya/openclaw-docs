---
read_when:
    - Chcesz włączyć lub skonfigurować web_search
    - Chcesz włączyć lub skonfigurować x_search
    - Musisz wybrać providera wyszukiwania
    - Chcesz zrozumieć automatyczne wykrywanie i fallback providera
sidebarTitle: Web Search
summary: web_search, x_search i web_fetch — przeszukiwanie sieci, przeszukiwanie postów X lub pobieranie treści strony
title: Web Search
x-i18n:
    generated_at: "2026-04-23T10:10:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e568670e1e15f195dbac1a249723a2ad873d6c49217575959b8eea2cb14ef75
    source_path: tools/web.md
    workflow: 15
---

# Web Search

Narzędzie `web_search` przeszukuje sieć przy użyciu skonfigurowanego providera i
zwraca wyniki. Wyniki są cache’owane według zapytania przez 15 minut (konfigurowalne).

OpenClaw zawiera także `x_search` dla postów X (dawniej Twitter) oraz
`web_fetch` do lekkiego pobierania URL. W tej fazie `web_fetch` pozostaje
lokalne, podczas gdy `web_search` i `x_search` mogą pod spodem używać xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. Dla
  stron intensywnie używających JS lub logowań użyj [Web Browser](/pl/tools/browser). Dla
  pobrania konkretnego URL użyj [Web Fetch](/pl/tools/web-fetch).
</Info>

## Szybki start

<Steps>
  <Step title="Wybierz providera">
    Wybierz providera i wykonaj wymaganą konfigurację. Niektórzy providerzy są
    bezkluczowi, podczas gdy inni używają kluczy API. Szczegóły znajdziesz na
    stronach providerów poniżej.
  </Step>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    ```
    To zapisuje providera i wszelkie potrzebne poświadczenia. Możesz też ustawić zmienną env
    (na przykład `BRAVE_API_KEY`) i pominąć ten krok dla providerów
    opartych na API.
  </Step>
  <Step title="Użyj">
    Agent może teraz wywoływać `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Dla postów X użyj:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Wybór providera

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/pl/tools/brave-search">
    Ustrukturyzowane wyniki ze snippetami. Obsługuje tryb `llm-context`, filtry kraju/języka. Dostępny darmowy poziom.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pl/tools/duckduckgo-search">
    Fallback bez klucza. Nie wymaga klucza API. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pl/tools/exa-search">
    Wyszukiwanie neuronowe + słowami kluczowymi z ekstrakcją treści (wyróżnienia, tekst, podsumowania).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pl/tools/firecrawl">
    Ustrukturyzowane wyniki. Najlepiej łączyć z `firecrawl_search` i `firecrawl_scrape` dla głębokiej ekstrakcji.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pl/tools/gemini-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/pl/tools/grok-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/pl/tools/kimi-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez Moonshot web search.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pl/tools/minimax-search">
    Ustrukturyzowane wyniki przez API wyszukiwania MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pl/tools/ollama-search">
    Wyszukiwanie bez klucza przez skonfigurowany host Ollama. Wymaga `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/pl/tools/perplexity-search">
    Ustrukturyzowane wyniki z kontrolą ekstrakcji treści i filtrowaniem domen.
  </Card>
  <Card title="SearXNG" icon="server" href="/pl/tools/searxng-search">
    Samohostowane meta-wyszukiwanie. Nie wymaga klucza API. Agreguje Google, Bing, DuckDuckGo i inne.
  </Card>
  <Card title="Tavily" icon="globe" href="/pl/tools/tavily">
    Ustrukturyzowane wyniki z głębokością wyszukiwania, filtrowaniem tematów i `tavily_extract` do ekstrakcji URL.
  </Card>
</CardGroup>

### Porównanie providerów

| Provider                                  | Styl wyników                | Filtry                                           | Klucz API                                                                         |
| ----------------------------------------- | --------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [Brave](/pl/tools/brave-search)              | Ustrukturyzowane snippety   | Kraj, język, czas, tryb `llm-context`            | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/pl/tools/duckduckgo-search)    | Ustrukturyzowane snippety   | --                                               | Brak (bez klucza)                                                                 |
| [Exa](/pl/tools/exa-search)                  | Ustrukturyzowane + wyodrębnione | Tryb neuronowy/słów kluczowych, data, ekstrakcja treści | `EXA_API_KEY`                                                              |
| [Firecrawl](/pl/tools/firecrawl)             | Ustrukturyzowane snippety   | Przez narzędzie `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/pl/tools/gemini-search)            | Syntetyzowane przez AI + cytowania | --                                         | `GEMINI_API_KEY`                                                                  |
| [Grok](/pl/tools/grok-search)                | Syntetyzowane przez AI + cytowania | --                                         | `XAI_API_KEY`                                                                     |
| [Kimi](/pl/tools/kimi-search)                | Syntetyzowane przez AI + cytowania | --                                         | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/pl/tools/minimax-search)   | Ustrukturyzowane snippety   | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web Search](/pl/tools/ollama-search) | Ustrukturyzowane snippety   | --                                               | Domyślnie brak; wymagane `ollama signin`, może ponownie używać bearer auth providera Ollama |
| [Perplexity](/pl/tools/perplexity-search)    | Ustrukturyzowane snippety   | Kraj, język, czas, domeny, limity treści         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                       |
| [SearXNG](/pl/tools/searxng-search)          | Ustrukturyzowane snippety   | Kategorie, język                                 | Brak (samohostowane)                                                              |
| [Tavily](/pl/tools/tavily)                   | Ustrukturyzowane snippety   | Przez narzędzie `tavily_search`                  | `TAVILY_API_KEY`                                                                  |

## Automatyczne wykrywanie

## Natywne web search OpenAI

Bezpośrednie modele OpenAI Responses automatycznie używają hostowanego przez OpenAI narzędzia `web_search`, gdy OpenClaw web search jest włączone i nie przypięto zarządzanego providera. To zachowanie należące do providera w dołączonym Pluginie OpenAI i dotyczy tylko natywnego ruchu OpenAI API, a nie bazowych URL proxy zgodnych z OpenAI ani tras Azure. Ustaw `tools.web.search.provider` na innego providera, takiego jak `brave`, aby zachować zarządzane narzędzie `web_search` dla modeli OpenAI, albo ustaw `tools.web.search.enabled: false`, aby wyłączyć zarówno zarządzane wyszukiwanie, jak i natywne wyszukiwanie OpenAI.

## Natywne web search Codex

Modele obsługujące Codex mogą opcjonalnie używać natywnego dla providera narzędzia Responses `web_search` zamiast zarządzanej funkcji `web_search` OpenClaw.

- Skonfiguruj je pod `tools.web.search.openaiCodex`
- Aktywuje się tylko dla modeli obsługujących Codex (`openai-codex/*` albo providerów używających `api: "openai-codex-responses"`)
- Zarządzane `web_search` nadal obowiązuje dla modeli innych niż Codex
- `mode: "cached"` to ustawienie domyślne i zalecane
- `tools.web.search.enabled: false` wyłącza zarówno zarządzane, jak i natywne wyszukiwanie

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

Jeśli natywne wyszukiwanie Codex jest włączone, ale bieżący model nie obsługuje Codex, OpenClaw zachowuje zwykłe zarządzane zachowanie `web_search`.

## Konfigurowanie web search

Listy providerów w dokumentacji i przepływach konfiguracji są alfabetyczne. Automatyczne wykrywanie zachowuje
oddzielną kolejność pierwszeństwa.

Jeśli `provider` nie jest ustawiony, OpenClaw sprawdza providerów w tej kolejności i używa
pierwszego gotowego:

Najpierw providerzy oparci na API:

1. **Brave** — `BRAVE_API_KEY` albo `plugins.entries.brave.config.webSearch.apiKey` (kolejność 10)
2. **MiniMax Search** — `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` albo `plugins.entries.minimax.config.webSearch.apiKey` (kolejność 15)
3. **Gemini** — `GEMINI_API_KEY` albo `plugins.entries.google.config.webSearch.apiKey` (kolejność 20)
4. **Grok** — `XAI_API_KEY` albo `plugins.entries.xai.config.webSearch.apiKey` (kolejność 30)
5. **Kimi** — `KIMI_API_KEY` / `MOONSHOT_API_KEY` albo `plugins.entries.moonshot.config.webSearch.apiKey` (kolejność 40)
6. **Perplexity** — `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` albo `plugins.entries.perplexity.config.webSearch.apiKey` (kolejność 50)
7. **Firecrawl** — `FIRECRAWL_API_KEY` albo `plugins.entries.firecrawl.config.webSearch.apiKey` (kolejność 60)
8. **Exa** — `EXA_API_KEY` albo `plugins.entries.exa.config.webSearch.apiKey` (kolejność 65)
9. **Tavily** — `TAVILY_API_KEY` albo `plugins.entries.tavily.config.webSearch.apiKey` (kolejność 70)

Potem fallbacki bez klucza:

10. **DuckDuckGo** — fallback HTML bez klucza, bez konta i bez klucza API (kolejność 100)
11. **Ollama Web Search** — fallback bez klucza przez skonfigurowany host Ollama; wymaga, aby Ollama było osiągalne i zalogowane przez `ollama signin`, i może ponownie używać bearer auth providera Ollama, jeśli host go wymaga (kolejność 110)
12. **SearXNG** — `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Jeśli żaden provider nie zostanie wykryty, następuje fallback do Brave (otrzymasz błąd
brakującego klucza z prośbą o skonfigurowanie go).

<Note>
  Wszystkie pola kluczy providerów obsługują obiekty SecretRef. Zakresowe SecretRef
  dla Pluginów pod `plugins.entries.<plugin>.config.webSearch.apiKey` są rozstrzygane dla
  dołączonych providerów Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity i Tavily
  niezależnie od tego, czy provider został wybrany jawnie przez `tools.web.search.provider`, czy
  wybrany przez auto-detect. W trybie auto-detect OpenClaw rozstrzyga tylko klucz
  wybranego providera — SecretRef niewybranych providerów pozostają nieaktywne, więc możesz
  utrzymywać skonfigurowanych wielu providerów bez płacenia kosztu rozstrzygania dla
  tych, których nie używasz.
</Note>

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // domyślnie: true
        provider: "brave", // albo pomiń dla automatycznego wykrywania
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Konfiguracja specyficzna dla providera (klucze API, bazowe URL, tryby) znajduje się pod
`plugins.entries.<plugin>.config.webSearch.*`. Przykłady znajdziesz na stronach
providerów.

Wybór providera fallback `web_fetch` jest oddzielny:

- wybierasz go przez `tools.web.fetch.provider`
- albo pomijasz to pole i pozwalasz OpenClaw automatycznie wykryć pierwszego gotowego providera web-fetch na podstawie dostępnych poświadczeń
- obecnie dołączonym providerem web-fetch jest Firecrawl, konfigurowany pod
  `plugins.entries.firecrawl.config.webFetch.*`

Gdy wybierzesz **Kimi** podczas `openclaw onboard` albo
`openclaw configure --section web`, OpenClaw może również zapytać o:

- region API Moonshot (`https://api.moonshot.ai/v1` albo `https://api.moonshot.cn/v1`)
- domyślny model Kimi web-search (domyślnie `kimi-k2.6`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa ono
tego samego fallbacku `XAI_API_KEY` co Grok web search.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy wybierzesz Grok podczas `openclaw onboard` albo `openclaw configure --section web`,
OpenClaw może też zaoferować opcjonalną konfigurację `x_search` z użyciem tego samego klucza.
To oddzielny krok uzupełniający wewnątrz ścieżki Grok, a nie osobny wybór providera
web-search na najwyższym poziomie. Jeśli wybierzesz innego providera, OpenClaw nie
pokaże promptu `x_search`.

### Przechowywanie kluczy API

<Tabs>
  <Tab title="Plik konfiguracji">
    Uruchom `openclaw configure --section web` albo ustaw klucz bezpośrednio:

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
  <Tab title="Zmienna środowiskowa">
    Ustaw zmienną env providera w środowisku procesu Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Dla instalacji gateway umieść ją w `~/.openclaw/.env`.
    Zobacz [Zmienne env](/pl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametry narzędzia

| Parametr              | Opis                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                     |
| `count`               | Liczba zwracanych wyników (1-10, domyślnie: 5)        |
| `country`             | 2-literowy kod kraju ISO (np. `"US"`, `"DE"`)        |
| `language`            | Kod języka ISO 639-1 (np. `"en"`, `"de"`)            |
| `search_lang`         | Kod języka wyszukiwania (tylko Brave)                 |
| `freshness`           | Filtr czasu: `day`, `week`, `month` lub `year`        |
| `date_after`          | Wyniki po tej dacie (YYYY-MM-DD)                      |
| `date_before`         | Wyniki przed tą datą (YYYY-MM-DD)                     |
| `ui_lang`             | Kod języka UI (tylko Brave)                           |
| `domain_filter`       | Tablica allowlisty/denylisty domen (tylko Perplexity) |
| `max_tokens`          | Całkowity budżet treści, domyślnie 25000 (tylko Perplexity) |
| `max_tokens_per_page` | Limit tokenów na stronę, domyślnie 2048 (tylko Perplexity) |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi providerami. Tryb Brave `llm-context`
  odrzuca `ui_lang`, `freshness`, `date_after` i `date_before`.
  Gemini, Grok i Kimi zwracają jedną odpowiedź syntetyzowaną z cytowaniami. Akceptują
  `count` dla zgodności ze współdzielonym narzędziem, ale nie zmienia to kształtu
  odpowiedzi ugruntowanej.
  Perplexity zachowuje się tak samo, gdy używasz ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` lub `OPENROUTER_API_KEY`).
  SearXNG akceptuje `http://` tylko dla zaufanych hostów sieci prywatnej lub loopback;
  publiczne punkty końcowe SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują tylko `query` i `count` przez `web_search`
  — dla opcji zaawansowanych używaj ich dedykowanych narzędzi.
</Warning>

## x_search

`x_search` odpytuje posty X (dawniej Twitter) przy użyciu xAI i zwraca
odpowiedzi syntetyzowane przez AI z cytowaniami. Akceptuje zapytania w języku naturalnym i
opcjonalne ustrukturyzowane filtry. OpenClaw włącza wbudowane narzędzie `x_search`
xAI tylko w żądaniu obsługującym to wywołanie narzędzia.

<Note>
  xAI dokumentuje `x_search` jako obsługujące wyszukiwanie słowami kluczowymi, wyszukiwanie semantyczne, wyszukiwanie użytkowników i pobieranie wątków. Dla statystyk zaangażowania pojedynczych postów, takich jak reposty,
  odpowiedzi, zakładki czy wyświetlenia, preferuj precyzyjne wyszukiwanie dokładnego URL
  posta lub identyfikatora statusu. Szerokie wyszukiwania słowami kluczowymi mogą znaleźć właściwy post, ale zwracać mniej
  kompletne metadane per post. Dobry wzorzec to: najpierw zlokalizuj post, a potem
  wykonaj drugie zapytanie `x_search` skupione na tym dokładnym poście.
</Note>

### Konfiguracja x_search

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
            apiKey: "xai-...", // opcjonalne, jeśli ustawiono XAI_API_KEY
          },
        },
      },
    },
  },
}
```

### Parametry x_search

| Parametr                     | Opis                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Zapytanie wyszukiwania (wymagane)                      |
| `allowed_x_handles`          | Ogranicza wyniki do określonych identyfikatorów X      |
| `excluded_x_handles`         | Wyklucza określone identyfikatory X                    |
| `from_date`                  | Uwzględnia tylko posty z tej daty lub później (YYYY-MM-DD) |
| `to_date`                    | Uwzględnia tylko posty z tej daty lub wcześniej (YYYY-MM-DD) |
| `enable_image_understanding` | Pozwala xAI analizować obrazy dołączone do pasujących postów |
| `enable_video_understanding` | Pozwala xAI analizować wideo dołączone do pasujących postów |

### Przykład x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statystyki per post: używaj dokładnego URL statusu lub identyfikatora statusu, gdy to możliwe
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Przykłady

```javascript
// Podstawowe wyszukiwanie
await web_search({ query: "OpenClaw plugin SDK" });

// Wyszukiwanie specyficzne dla Niemiec
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Ostatnie wyniki (ostatni tydzień)
await web_search({ query: "AI developments", freshness: "week" });

// Zakres dat
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrowanie domen (tylko Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profile narzędzi

Jeśli używasz profili narzędzi lub allowlist, dodaj `web_search`, `x_search` albo `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // lub: allow: ["group:web"]  (obejmuje web_search, x_search i web_fetch)
  },
}
```

## Powiązane

- [Web Fetch](/pl/tools/web-fetch) -- pobiera URL i wyodrębnia czytelną treść
- [Web Browser](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla stron intensywnie używających JS
- [Grok Search](/pl/tools/grok-search) -- Grok jako provider `web_search`
- [Ollama Web Search](/pl/tools/ollama-search) -- web search bez klucza przez host Ollama
