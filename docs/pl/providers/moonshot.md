---
read_when:
    - Chcesz skonfigurować Moonshot K2 (Moonshot Open Platform) i Kimi Coding
    - Musisz zrozumieć oddzielne punkty końcowe, klucze i referencje modeli
    - Chcesz gotową do skopiowania konfigurację dla któregoś z dostawców
summary: Skonfiguruj Moonshot K2 i Kimi Coding (oddzielni dostawcy + klucze)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T10:07:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e143632de7aff050f32917e379e21ace5f4a5f9857618ef720f885f2f298ca72
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot udostępnia API Kimi z punktami końcowymi zgodnymi z OpenAI. Skonfiguruj
dostawcę i ustaw model domyślny na `moonshot/kimi-k2.6`, albo użyj
Kimi Coding z `kimi/kimi-code`.

<Warning>
Moonshot i Kimi Coding to **oddzielni dostawcy**. Klucze nie są wymienne, punkty końcowe są różne, a referencje modeli również (`moonshot/...` vs `kimi/...`).
</Warning>

## Wbudowany katalog modeli

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Nazwa                  | Rozumowanie | Wejście     | Kontekst | Maks. wyjście |
| --------------------------------- | ---------------------- | ----------- | ----------- | -------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nie         | tekst, obraz | 262,144 | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nie         | tekst, obraz | 262,144 | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Tak         | tekst       | 262,144 | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Tak         | tekst       | 262,144 | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nie         | tekst       | 256,000 | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

Dołączone szacunki kosztów dla obecnych modeli K2 hostowanych przez Moonshot używają
opublikowanych przez Moonshot stawek pay-as-you-go: Kimi K2.6 kosztuje $0.16/MTok za cache hit,
$0.95/MTok za wejście i $4.00/MTok za wyjście; Kimi K2.5 kosztuje $0.10/MTok za cache hit,
$0.60/MTok za wejście i $3.00/MTok za wyjście. Pozostałe starsze wpisy katalogu zachowują
placeholders kosztów zerowych, chyba że nadpiszesz je w konfiguracji.

## Pierwsze kroki

Wybierz dostawcę i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Moonshot API">
    **Najlepsze dla:** modeli Kimi K2 przez Moonshot Open Platform.

    <Steps>
      <Step title="Wybierz region punktu końcowego">
        | Wybór uwierzytelniania   | Punkt końcowy                 | Region          |
        | ------------------------ | ----------------------------- | --------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1`  | Międzynarodowy  |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1`  | Chiny           |
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Albo dla punktu końcowego w Chinach:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Zweryfikuj, że modele są dostępne">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Uruchom test smoke live">
        Użyj izolowanego katalogu stanu, gdy chcesz zweryfikować dostęp do modelu i
        śledzenie kosztów bez naruszania zwykłych sesji:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Odpowiedź JSON powinna zgłaszać `provider: "moonshot"` oraz
        `model: "kimi-k2.6"`. Wpis transkryptu asystenta przechowuje znormalizowane
        użycie tokenów oraz szacowany koszt w `usage.cost`, gdy Moonshot zwraca
        metadane użycia.
      </Step>
    </Steps>

    ### Przykład konfiguracji

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Najlepsze dla:** zadań skoncentrowanych na kodzie przez punkt końcowy Kimi Coding.

    <Note>
    Kimi Coding używa innego klucza API i prefiksu dostawcy (`kimi/...`) niż Moonshot (`moonshot/...`). Starsza referencja modelu `kimi/k2p5` pozostaje akceptowana jako identyfikator zgodności.
    </Note>

    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Zweryfikuj, że model jest dostępny">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Przykład konfiguracji

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web search

OpenClaw dostarcza również **Kimi** jako dostawcę `web_search`, oparty na Moonshot web
search.

<Steps>
  <Step title="Uruchom interaktywną konfigurację web search">
    ```bash
    openclaw configure --section web
    ```

    W sekcji web-search wybierz **Kimi**, aby zapisać
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Skonfiguruj region web search i model">
    Interaktywna konfiguracja pyta o:

    | Ustawienie         | Opcje                                                                 |
    | ------------------ | --------------------------------------------------------------------- |
    | Region API         | `https://api.moonshot.ai/v1` (międzynarodowy) lub `https://api.moonshot.cn/v1` (Chiny) |
    | Model web search   | Domyślnie `kimi-k2.6`                                                 |

  </Step>
</Steps>

Konfiguracja znajduje się w `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // albo użyj KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Zaawansowane

<AccordionGroup>
  <Accordion title="Natywny tryb myślenia">
    Moonshot Kimi obsługuje binarny natywny tryb myślenia:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Skonfiguruj go dla modelu przez `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw mapuje także poziomy runtime `/think` dla Moonshot:

    | Poziom `/think`    | Zachowanie Moonshot        |
    | ------------------ | -------------------------- |
    | `/think off`       | `thinking.type=disabled`   |
    | Dowolny poziom nie-off | `thinking.type=enabled` |

    <Warning>
    Gdy tryb myślenia Moonshot jest włączony, `tool_choice` musi mieć wartość `auto` albo `none`. OpenClaw normalizuje niezgodne wartości `tool_choice` do `auto` dla zgodności.
    </Warning>

    Kimi K2.6 akceptuje też opcjonalne pole `thinking.keep`, które kontroluje
    zachowywanie `reasoning_content` przez wiele tur. Ustaw je na `"all"`, aby zachować pełne
    rozumowanie między turami; pomiń je (albo pozostaw `null`), aby użyć domyślnej
    strategii serwera. OpenClaw przekazuje `thinking.keep` tylko dla
    `moonshot/kimi-k2.6` i usuwa je z innych modeli.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Sanityzacja id wywołań narzędzi">
    Moonshot Kimi zwraca identyfikatory `tool_call` w kształcie `functions.<name>:<index>`. OpenClaw zachowuje je bez zmian, aby wywołania narzędzi przez wiele tur nadal działały.

    Aby wymusić ścisłą sanityzację dla niestandardowego dostawcy zgodnego z OpenAI, ustaw `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Zgodność użycia streamingu">
    Natywne punkty końcowe Moonshot (`https://api.moonshot.ai/v1` i
    `https://api.moonshot.cn/v1`) deklarują zgodność użycia streamingu we
    współdzielonym transporcie `openai-completions`. OpenClaw opiera się na capability
    punktu końcowego, więc zgodne niestandardowe identyfikatory dostawców celujące w te same natywne
    hosty Moonshot dziedziczą to samo zachowanie użycia streamingu.

    Przy dołączonym cenniku K2.6 użycie streamingu obejmujące tokeny wejścia, wyjścia
    i cache-read jest również konwertowane na lokalny szacowany koszt w USD dla
    `/status`, `/usage full`, `/usage cost` oraz rozliczania sesji opartego na
    transkrypcie.

  </Accordion>

  <Accordion title="Dokumentacja punktów końcowych i referencji modeli">
    | Dostawca    | Prefiks referencji modelu | Punkt końcowy                | Zmienna środowiskowa uwierzytelniania |
    | ----------- | ------------------------- | ---------------------------- | ------------------------------------- |
    | Moonshot    | `moonshot/`               | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`                    |
    | Moonshot CN | `moonshot/`               | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`                    |
    | Kimi Coding | `kimi/`                   | Punkt końcowy Kimi Coding    | `KIMI_API_KEY`                        |
    | Web search  | N/A                       | Taki sam jak region API Moonshot | `KIMI_API_KEY` lub `MOONSHOT_API_KEY` |

    - Kimi web search używa `KIMI_API_KEY` lub `MOONSHOT_API_KEY` i domyślnie korzysta z `https://api.moonshot.ai/v1` z modelem `kimi-k2.6`.
    - W razie potrzeby nadpisz ceny i metadane kontekstu w `models.providers`.
    - Jeśli Moonshot opublikuje inne limity kontekstu dla modelu, odpowiednio dostosuj `contextWindow`.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania failover.
  </Card>
  <Card title="Web search" href="/pl/tools/web" icon="magnifying-glass">
    Konfigurowanie dostawców web search, w tym Kimi.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji dostawców, modeli i pluginów.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Zarządzanie kluczami API Moonshot i dokumentacja.
  </Card>
</CardGroup>
