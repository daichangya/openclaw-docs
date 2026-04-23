---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcją Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania wykonania agenta GPT-5
summary: Używaj OpenAI przez klucze API albo subskrypcję Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T10:07:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d847e53c2faee5363071dfdcb1f4150b64577674161e000844f579482198d1
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI udostępnia deweloperskie API dla modeli GPT. OpenClaw obsługuje dwie ścieżki auth:

  - **Klucz API** — bezpośredni dostęp do OpenAI Platform z rozliczaniem zależnym od użycia (modele `openai/*`)
  - **Subskrypcja Codex** — logowanie ChatGPT/Codex z dostępem subskrypcyjnym (modele `openai-codex/*`)

  OpenAI jawnie wspiera użycie OAuth subskrypcji w zewnętrznych narzędziach i przepływach pracy takich jak OpenClaw.

  ## Zakres funkcji OpenClaw

  | Możliwość OpenAI         | Powierzchnia OpenClaw                     | Status                                                 |
  | ------------------------ | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses         | provider modeli `openai/<model>`          | Tak                                                    |
  | Modele subskrypcji Codex | provider modeli `openai-codex/<model>`    | Tak                                                    |
  | Wyszukiwanie w sieci po stronie serwera | natywne narzędzie OpenAI Responses | Tak, gdy wyszukiwanie w sieci jest włączone i nie przypięto providera |
  | Obrazy                   | `image_generate`                          | Tak                                                    |
  | Wideo                    | `video_generate`                          | Tak                                                    |
  | Zamiana tekstu na mowę   | `messages.tts.provider: "openai"` / `tts` | Tak                                                    |
  | Wsadowe speech-to-text   | `tools.media.audio` / rozumienie multimediów | Tak                                                 |
  | Strumieniowe speech-to-text | Voice Call `streaming.provider: "openai"` | Tak                                                 |
  | Głos realtime            | Voice Call `realtime.provider: "openai"`  | Tak                                                    |
  | Embeddings               | provider embeddingów pamięci              | Tak                                                    |

  ## Pierwsze kroki

  Wybierz preferowaną metodę auth i wykonaj kroki konfiguracji.

  <Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu do API i rozliczania zależnego od użycia.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz albo skopiuj klucz API z [panelu OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Podsumowanie ścieżek

    | Odwołanie modelu | Ścieżka | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    Logowanie ChatGPT/Codex jest kierowane przez `openai-codex/*`, a nie `openai/*`.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark` na bezpośredniej ścieżce API. Żywe żądania OpenAI API odrzucają ten model. Spark jest dostępny tylko w Codex.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze dla:** używania subskrypcji ChatGPT/Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania do ChatGPT.

    <Steps>
      <Step title="Uruchom OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach bezobsługowych albo nieprzyjaznych dla callback hosta dodaj `--device-code`, aby zalogować się przez przepływ device-code ChatGPT zamiast callbacku przeglądarki localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Podsumowanie ścieżek

    | Odwołanie modelu | Ścieżka | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | logowanie Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | logowanie Codex (zależne od uprawnień) |

    <Note>
    Ta ścieżka jest celowo oddzielona od `openai/gpt-5.4`. Używaj `openai/*` z kluczem API do bezpośredniego dostępu do Platform, a `openai-codex/*` do dostępu subskrypcyjnego Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Onboarding nie importuje już materiału OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przez przepływ device-code powyżej — OpenClaw zarządza uzyskanymi poświadczeniami we własnym magazynie auth agenta.
    </Note>

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu runtime jako osobne wartości.

    Dla `openai-codex/gpt-5.4`:

    - Natywne `contextWindow`: `1050000`
    - Domyślny limit `contextTokens` runtime: `272000`

    Mniejszy domyślny limit w praktyce daje lepszą latencję i jakość. Nadpisz go przez `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Używaj `contextWindow`, aby deklarować natywne metadane modelu. Używaj `contextTokens`, aby ograniczać budżet kontekstu runtime.
    </Note>

  </Tab>
</Tabs>

## Generowanie obrazów

Bundlowany Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.

| Możliwość                 | Wartość                            |
| ------------------------- | ---------------------------------- |
| Model domyślny            | `openai/gpt-image-2`               |
| Maksymalna liczba obrazów na żądanie | 4                        |
| Tryb edycji               | Włączony (do 5 obrazów referencyjnych) |
| Nadpisania rozmiaru       | Obsługiwane, w tym rozmiary 2K/4K  |
| Współczynnik proporcji / rozdzielczość | Nie są przekazywane do OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Zobacz [Image Generation](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór providera i zachowanie failover.
</Note>

`gpt-image-2` jest domyślnym modelem zarówno dla generowania obrazu z tekstu OpenAI, jak i dla edycji obrazów. `gpt-image-1` nadal można używać jako jawnego nadpisania modelu, ale nowe
przepływy pracy z obrazami OpenAI powinny używać `openai/gpt-image-2`.

Generowanie:

```
/tool image_generate model=openai/gpt-image-2 prompt="Dopracowany plakat premierowy dla OpenClaw na macOS" size=3840x2160 count=1
```

Edycja:

```
/tool image_generate model=openai/gpt-image-2 prompt="Zachowaj kształt obiektu, zmień materiał na półprzezroczyste szkło" image=/path/to/reference.png size=1024x1536
```

## Generowanie wideo

Bundlowany Plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość       | Wartość                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Model domyślny   | `openai/sora-2`                                                                   |
| Tryby            | Text-to-video, image-to-video, edycja pojedynczego wideo                          |
| Wejścia referencyjne | 1 obraz albo 1 wideo                                                         |
| Nadpisania rozmiaru | Obsługiwane                                                                    |
| Inne nadpisania  | `aspectRatio`, `resolution`, `audio`, `watermark` są ignorowane z ostrzeżeniem narzędzia |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Zobacz [Video Generation](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór providera i zachowanie failover.
</Note>

## Wkład do promptu GPT-5

OpenClaw dodaje wspólny wkład do promptu GPT-5 dla uruchomień rodziny GPT-5 u różnych providerów. Stosuje się on według ID modelu, więc `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` i inne zgodne odwołania GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Bundlowany natywny provider harness Codex (`codex/*`) używa tego samego zachowania GPT-5 i nakładki Heartbeat przez instrukcje deweloperskie serwera aplikacji Codex, więc sesje `codex/gpt-5.x` zachowują to samo doprowadzanie spraw do końca i proaktywne wskazówki Heartbeat, mimo że Codex jest właścicielem reszty promptu harness.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonania, dyscypliny narzędzi, kształtu wyjścia, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału i zachowanie cichych wiadomości pozostają w współdzielonym promptcie systemowym OpenClaw i zasadach dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Warstwa przyjaznego stylu interakcji jest oddzielna i konfigurowalna.

| Wartość                | Efekt                                       |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (domyślnie) | Włącza warstwę przyjaznego stylu interakcji |
| `"on"`                 | Alias dla `"friendly"`                      |
| `"off"`                | Wyłącza tylko warstwę przyjaznego stylu     |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Wartości są niewrażliwe na wielkość liter w runtime, więc zarówno `"Off"`, jak i `"off"` wyłączają warstwę przyjaznego stylu.
</Tip>

<Note>
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako zapasowa ścieżka zgodności, gdy współdzielone ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Bundlowany Plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.voice` | `coral` |
    | Szybkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instrukcje | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Zapasowo używa `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać podstawowy URL TTS bez wpływu na endpoint API czatu.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Bundlowany Plugin `openai` rejestruje wsadowe speech-to-text przez
    powierzchnię transkrypcji rozumienia multimediów w OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Ścieżka wejściowa: multipart upload pliku audio
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie przychodząca transkrypcja audio używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord i
      załączników audio kanałów

    Aby wymusić OpenAI dla przychodzącej transkrypcji audio:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Wskazówki języka i promptu są przekazywane do OpenAI, gdy są dostarczane przez
    współdzieloną konfigurację audio media albo żądanie transkrypcji per wywołanie.

  </Accordion>

  <Accordion title="Transkrypcja realtime">
    Bundlowany Plugin `openai` rejestruje transkrypcję realtime dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Zapasowo używa `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket do `wss://api.openai.com/v1/realtime` z dźwiękiem G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten provider strumieniowania służy do ścieżki transkrypcji realtime w Voice Call; głos Discord obecnie rejestruje krótkie segmenty i zamiast tego używa wsadowej ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos realtime">
    Bundlowany Plugin `openai` rejestruje głos realtime dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Zapasowo używa `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment`. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa najpierw WebSocket z zapasową ścieżką SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - ponawia jedno wczesne niepowodzenie WebSocket przed przejściem na SSE
    - po błędzie oznacza WebSocket jako zdegradowany na około 60 sekund i w czasie wychłodzenia używa SSE
    - dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień i ponownych połączeń
    - normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Wartość | Zachowanie |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, zapasowo SSE |
    | `"sse"` | Wymuś tylko SSE |
    | `"websocket"` | Wymuś tylko WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Powiązana dokumentacja OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw domyślnie włącza warm-up WebSocket dla `openai/*`, aby zmniejszyć latencję pierwszej tury.

    ```json5
    // Wyłącz warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

<a id="openai-fast-mode"></a>

  <Accordion title="Tryb fast">
    OpenClaw udostępnia wspólny przełącznik trybu fast dla `openai/*` i `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Gdy jest włączony, OpenClaw mapuje tryb fast na przetwarzanie priorytetowe OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a tryb fast nie przepisuje `reasoning` ani `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w interfejsie Sessions przywraca sesję do skonfigurowanej wartości domyślnej.
    </Note>

  </Accordion>

  <Accordion title="Przetwarzanie priorytetowe (service_tier)">
    API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustaw je per model w OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Obsługiwane wartości: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` jest przekazywane tylko do natywnych endpointów OpenAI (`api.openai.com`) i natywnych endpointów Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregokolwiek providera przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) OpenClaw automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że compat modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (albo `80000`, gdy brak tej wartości)

    <Tabs>
      <Tab title="Włącz jawnie">
        Przydatne dla zgodnych endpointów, takich jak Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Niestandardowy próg">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Wyłącz">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` kontroluje tylko wstrzykiwanie `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że compat ustawia `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Tryb rygorystycznie agentowy GPT">
    Dla uruchomień rodziny GPT-5 na `openai/*` i `openai-codex/*` OpenClaw może używać bardziej rygorystycznego osadzonego kontraktu wykonania:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Z `strict-agentic` OpenClaw:
    - nie traktuje już tury tylko z planem jako udanego postępu, gdy dostępne jest działanie narzędzia
    - ponawia turę z ukierunkowaniem na natychmiastowe działanie
    - automatycznie włącza `update_plan` dla istotnej pracy
    - ujawnia jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień rodziny GPT-5 w OpenAI i Codex. Inni providerzy i starsze rodziny modeli zachowują domyślne zachowanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne vs zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie endpointy OpenAI, Codex i Azure OpenAI inaczej niż generyczne zgodne z OpenAI proxy `/v1`:

    **Trasy natywne** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - zachowują `reasoning: { effort: "none" }` tylko dla modeli, które obsługują OpenAI `none` effort
    - pomijają wyłączone reasoning dla modeli albo proxy, które odrzucają `reasoning.effort: "none"`
    - domyślnie ustawiają schematy narzędzi na tryb strict
    - dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych natywnych hostach
    - zachowują kształtowanie żądań tylko dla OpenAI (`service_tier`, `store`, reasoning-compat, wskazówki prompt-cache)

    **Trasy proxy/zgodne:**
    - używają luźniejszego zachowania compat
    - nie wymuszają ścisłych schematów narzędzi ani natywnych nagłówków

    Azure OpenAI używa natywnego transportu i zachowania compat, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, odwołań modeli i zachowanie failover.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór providera.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór providera.
  </Card>
  <Card title="OAuth i auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
