---
read_when:
    - Chcesz skonfigurować Perplexity jako dostawcę wyszukiwania w sieci
    - Potrzebujesz klucza API Perplexity lub konfiguracji proxy OpenRouter
summary: Konfiguracja dostawcy wyszukiwania w sieci Perplexity (klucz API, tryby wyszukiwania, filtrowanie)
title: Perplexity
x-i18n:
    generated_at: "2026-04-25T13:56:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d913d71c1b3a5cfbd755efff9235adfd5dd460ef606a6d229d2cceb5134174d3
    source_path: providers/perplexity-provider.md
    workflow: 15
---

Plugin Perplexity zapewnia możliwości wyszukiwania w sieci za pośrednictwem
Perplexity Search API lub Perplexity Sonar przez OpenRouter.

<Note>
Ta strona opisuje konfigurację **dostawcy** Perplexity. Informacje o **narzędziu**
Perplexity (czyli o tym, jak agent go używa) znajdziesz w [narzędziu Perplexity](/pl/tools/perplexity-search).
</Note>

| Właściwość | Wartość                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Typ        | Dostawca wyszukiwania w sieci (nie dostawca modeli)                     |
| Uwierzytelnianie | `PERPLEXITY_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter) |
| Ścieżka konfiguracji | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Uruchom interaktywny proces konfiguracji wyszukiwania w sieci:

    ```bash
    openclaw configure --section web
    ```

    Lub ustaw klucz bezpośrednio:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Rozpocznij wyszukiwanie">
    Agent będzie automatycznie używać Perplexity do wyszukiwania w sieci, gdy klucz
    zostanie skonfigurowany. Nie są wymagane żadne dodatkowe kroki.
  </Step>
</Steps>

## Tryby wyszukiwania

Plugin automatycznie wybiera transport na podstawie prefiksu klucza API:

<Tabs>
  <Tab title="Natywne Perplexity API (pplx-)">
    Gdy klucz zaczyna się od `pplx-`, OpenClaw używa natywnego Perplexity Search
    API. Ten transport zwraca wyniki uporządkowane strukturalnie i obsługuje filtry domen, języka
    oraz daty (zobacz opcje filtrowania poniżej).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Gdy klucz zaczyna się od `sk-or-`, OpenClaw kieruje ruch przez OpenRouter przy użyciu
    modelu Perplexity Sonar. Ten transport zwraca odpowiedzi syntetyzowane przez AI wraz
    z cytowaniami.
  </Tab>
</Tabs>

| Prefiks klucza | Transport                    | Funkcje                                          |
| -------------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`        | Natywne Perplexity Search API | Wyniki uporządkowane strukturalnie, filtry domen/języka/daty |
| `sk-or-`       | OpenRouter (Sonar)           | Odpowiedzi syntetyzowane przez AI wraz z cytowaniami |

## Filtrowanie w natywnym API

<Note>
Opcje filtrowania są dostępne tylko przy użyciu natywnego Perplexity API
(klucz `pplx-`). Wyszukiwania OpenRouter/Sonar nie obsługują tych parametrów.
</Note>

Podczas korzystania z natywnego Perplexity API wyszukiwania obsługują następujące filtry:

| Filtr          | Opis                                   | Przykład                            |
| -------------- | -------------------------------------- | ----------------------------------- |
| Kraj           | 2-literowy kod kraju                   | `us`, `de`, `jp`                    |
| Język          | Kod języka ISO 639-1                   | `en`, `fr`, `zh`                    |
| Zakres dat     | Okno świeżości                         | `day`, `week`, `month`, `year`      |
| Filtry domen   | Lista dozwolonych lub blokowanych domen (maks. 20 domen) | `example.com`                       |
| Budżet treści  | Limity tokenów na odpowiedź / na stronę | `max_tokens`, `max_tokens_per_page` |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zmienna środowiskowa dla procesów demona">
    Jeśli Gateway OpenClaw działa jako demon (launchd/systemd), upewnij się, że
    `PERPLEXITY_API_KEY` jest dostępny dla tego procesu.

    <Warning>
    Klucz ustawiony wyłącznie w `~/.profile` nie będzie widoczny dla demona launchd/systemd,
    chyba że to środowisko zostanie jawnie zaimportowane. Ustaw klucz w
    `~/.openclaw/.env` lub przez `env.shellEnv`, aby mieć pewność, że proces gateway będzie mógł
    go odczytać.
    </Warning>

  </Accordion>

  <Accordion title="Konfiguracja proxy OpenRouter">
    Jeśli wolisz kierować wyszukiwania Perplexity przez OpenRouter, ustaw
    `OPENROUTER_API_KEY` (prefiks `sk-or-`) zamiast natywnego klucza Perplexity.
    OpenClaw wykryje prefiks i automatycznie przełączy się na transport Sonar.

    <Tip>
    Transport OpenRouter jest przydatny, jeśli masz już konto OpenRouter
    i chcesz skonsolidowanego rozliczania dla wielu dostawców.
    </Tip>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzie wyszukiwania Perplexity" href="/pl/tools/perplexity-search" icon="magnifying-glass">
    Jak agent wywołuje wyszukiwania Perplexity i interpretuje wyniki.
  </Card>
  <Card title="Informacje referencyjne o konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełne informacje referencyjne o konfiguracji, w tym wpisy Plugin.
  </Card>
</CardGroup>
