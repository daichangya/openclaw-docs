---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcją Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania wykonywania agenta GPT-5
summary: Używaj OpenAI za pomocą kluczy API lub subskrypcji Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T13:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI udostępnia interfejsy API dla deweloperów modeli GPT. OpenClaw obsługuje dwie ścieżki uwierzytelniania:

  - **Klucz API** — bezpośredni dostęp do OpenAI Platform z rozliczaniem zależnym od użycia (modele `openai/*`)
  - **Subskrypcja Codex** — logowanie przez ChatGPT/Codex z dostępem w ramach subskrypcji (modele `openai-codex/*`)

  OpenAI wyraźnie wspiera użycie subskrypcji OAuth w zewnętrznych narzędziach i przepływach pracy, takich jak OpenClaw.

  ## Zakres funkcji w OpenClaw

  | Możliwość OpenAI          | Powierzchnia w OpenClaw                  | Status                                                  |
  | ------------------------- | ---------------------------------------- | ------------------------------------------------------- |
  | Czat / Responses          | dostawca modeli `openai/<model>`         | Tak                                                     |
  | Modele subskrypcji Codex  | dostawca modeli `openai-codex/<model>`   | Tak                                                     |
  | Wyszukiwanie w sieci po stronie serwera | natywne narzędzie OpenAI Responses | Tak, gdy wyszukiwanie w sieci jest włączone i nie przypięto dostawcy |
  | Obrazy                    | `image_generate`                         | Tak                                                     |
  | Wideo                     | `video_generate`                         | Tak                                                     |
  | Zamiana tekstu na mowę    | `messages.tts.provider: "openai"` / `tts` | Tak                                                    |
  | Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie multimediów | Tak                                                 |
  | Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"` | Tak                                              |
  | Głos w czasie rzeczywistym | Voice Call `realtime.provider: "openai"` | Tak                                                    |
  | Embeddings                | dostawca osadzania pamięci               | Tak                                                     |

  ## Pierwsze kroki

  Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

  <Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu do API i rozliczania zależnego od użycia.

    <Steps>
      <Step title="Pobierz swój klucz API">
        Utwórz lub skopiuj klucz API z [panelu OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Lub przekaż klucz bezpośrednio:

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

    ### Podsumowanie ścieżki

    | Model ref | Ścieżka | Uwierzytelnianie |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    Logowanie przez ChatGPT/Codex jest kierowane przez `openai-codex/*`, a nie `openai/*`.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark` na bezpośredniej ścieżce API. Rzeczywiste żądania do OpenAI API odrzucają ten model. Spark jest dostępny tylko w Codex.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze dla:** używania subskrypcji ChatGPT/Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania do ChatGPT.

    <Steps>
      <Step title="Uruchom Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Lub uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach bezgłowych lub nieprzyjaznych dla callbacków dodaj `--device-code`, aby zalogować się przez przepływ kodu urządzenia ChatGPT zamiast callbacku przeglądarki localhost:

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

    ### Podsumowanie ścieżki

    | Model ref | Ścieżka | Uwierzytelnianie |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | logowanie Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | logowanie Codex (zależne od uprawnień) |

    <Note>
    Ta ścieżka jest celowo oddzielona od `openai/gpt-5.4`. Używaj `openai/*` z kluczem API do bezpośredniego dostępu do Platform, a `openai-codex/*` do dostępu przez subskrypcję Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Onboarding nie importuje już materiałów OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przez powyższy przepływ kodu urządzenia — OpenClaw zarządza powstałymi poświadczeniami we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu w czasie działania jako osobne wartości.

    Dla `openai-codex/gpt-5.4`:

    - Natywne `contextWindow`: `1050000`
    - Domyślny limit `contextTokens` w czasie działania: `272000`

    Mniejszy domyślny limit w praktyce zapewnia lepszą latencję i charakterystykę jakości. Zastąp go za pomocą `contextTokens`:

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
    Używaj `contextWindow`, aby zadeklarować natywne metadane modelu. Używaj `contextTokens`, aby ograniczyć budżet kontekstu w czasie działania.
    </Note>

  </Tab>
</Tabs>

## Generowanie obrazów

Dołączony Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.

| Możliwość                | Wartość                            |
| ------------------------ | ---------------------------------- |
| Model domyślny           | `openai/gpt-image-2`               |
| Maks. liczba obrazów na żądanie | 4                           |
| Tryb edycji              | Włączony (do 5 obrazów referencyjnych) |
| Nadpisania rozmiaru      | Obsługiwane, w tym rozmiary 2K/4K  |
| Proporcje / rozdzielczość | Nie są przekazywane do OpenAI Images API |

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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

`gpt-image-2` jest modelem domyślnym zarówno dla generowania obrazów z tekstu w OpenAI, jak i edycji obrazów. `gpt-image-1` nadal można używać jako jawnego nadpisania modelu, ale nowe przepływy pracy OpenAI związane z obrazami powinny używać `openai/gpt-image-2`.

Generowanie:

```
/tool image_generate model=openai/gpt-image-2 prompt="Dopracowany plakat premierowy dla OpenClaw na macOS" size=3840x2160 count=1
```

Edycja:

```
/tool image_generate model=openai/gpt-image-2 prompt="Zachowaj kształt obiektu, zmień materiał na półprzezroczyste szkło" image=/path/to/reference.png size=1024x1536
```

## Generowanie wideo

Dołączony Plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość       | Wartość                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Model domyślny   | `openai/sora-2`                                                                   |
| Tryby            | Tekst na wideo, obraz na wideo, edycja pojedynczego wideo                         |
| Dane referencyjne | 1 obraz lub 1 wideo                                                              |
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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

## Wkład do promptu GPT-5

OpenClaw dodaje wspólny wkład do promptu GPT-5 dla uruchomień rodziny GPT-5 u różnych dostawców. Jest stosowany według identyfikatora modelu, więc `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` i inne zgodne odwołania do GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x nie otrzymują jej.

Dołączony natywny dostawca harnessu Codex (`codex/*`) używa tego samego zachowania GPT-5 i nakładki Heartbeat przez instrukcje deweloperskie serwera aplikacji Codex, więc sesje `codex/gpt-5.x` zachowują to samo doprowadzanie działań do końca i proaktywne wskazówki Heartbeat, mimo że Codex zarządza resztą promptu harnessu.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dotyczący trwałości persony, bezpieczeństwa wykonywania, dyscypliny narzędzi, kształtu danych wyjściowych, sprawdzania ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału i zachowanie wiadomości cichych pozostaje we wspólnym prompcie systemowym OpenClaw i zasadach dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Warstwa przyjaznego stylu interakcji jest oddzielna i konfigurowalna.

| Wartość                | Efekt                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (domyślnie) | Włącz warstwę przyjaznego stylu interakcji |
| `"on"`                 | Alias dla `"friendly"`                      |
| `"off"`                | Wyłącz tylko warstwę przyjaznego stylu      |

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
Wartości nie rozróżniają wielkości liter w czasie działania, więc zarówno `"Off"`, jak i `"off"` wyłączają warstwę przyjaznego stylu.
</Tip>

<Note>
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako zgodnościowy mechanizm zapasowy, gdy wspólne ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Dołączony Plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.voice` | `coral` |
    | Prędkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instrukcje | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Rezerwowo używa `OPENAI_API_KEY` |
    | Bazowy URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy URL TTS bez wpływu na punkt końcowy API czatu.
    </Note>

  </Accordion>

  <Accordion title="Zamiana mowy na tekst">
    Dołączony Plugin `openai` rejestruje wsadową zamianę mowy na tekst przez
    powierzchnię transkrypcji rozumienia multimediów OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie pliku audio multipart
    - Obsługiwane w OpenClaw wszędzie tam, gdzie transkrypcja dźwięku przychodzącego używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord i
      załączników audio kanału

    Aby wymusić OpenAI dla transkrypcji dźwięku przychodzącego:

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

    Wskazówki dotyczące języka i promptu są przekazywane do OpenAI, gdy są podane przez
    wspólną konfigurację multimediów audio lub żądanie transkrypcji dla pojedynczego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje transkrypcję w czasie rzeczywistym dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Rezerwowo używa `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z dźwiękiem G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji w czasie rzeczywistym Pluginu Voice Call; głos Discord obecnie zapisuje krótkie segmenty i zamiast tego używa wsadowej ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje głos w czasie rzeczywistym dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Rezerwowo używa `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment`. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Dołączony dostawca `openai` może kierować żądania do zasobu Azure OpenAI dla
generowania obrazów przez nadpisanie bazowego URL. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na
format żądania Azure.

<Note>
Głos w czasie rzeczywistym używa osobnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i nie jest zależny od `models.providers.openai.baseUrl`. Zobacz akordeon **Głos
w czasie rzeczywistym** w sekcji [Głos i mowa](#voice-and-speech), aby poznać jego ustawienia Azure.
</Note>

Używaj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę korporacyjną Azure OpenAI
- Potrzebujesz regionalnej rezydencji danych lub mechanizmów zgodności, które zapewnia Azure
- Chcesz utrzymać ruch w istniejącej dzierżawie Azure

### Konfiguracja

W przypadku generowania obrazów w Azure przez dołączonego dostawcę `openai`, ustaw
`models.providers.openai.baseUrl` na swój zasób Azure i ustaw `apiKey` na
klucz Azure OpenAI (a nie klucz OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw rozpoznaje te sufiksy hostów Azure dla ścieżki generowania obrazów Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Dla żądań generowania obrazów na rozpoznanym hoście Azure OpenClaw:

- Wysyła nagłówek `api-key` zamiast `Authorization: Bearer`
- Używa ścieżek o zakresie wdrożenia (`/openai/deployments/{deployment}/...`)
- Dodaje `?api-version=...` do każdego żądania

Inne bazowe URL-e (publiczne OpenAI, proxy zgodne z OpenAI) zachowują standardowy
format żądań obrazów OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każde niestandardowe
`openai.baseUrl` jak publiczny punkt końcowy OpenAI i zakończą się niepowodzeniem przy wdrożeniach
obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję preview lub GA Azure
dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Wartością domyślną jest `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure
kierowanych przez dołączonego dostawcę `openai`, pole `model` w OpenClaw
musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Czysty plakat" size=1024x1024 count=1
```

Ta sama zasada nazw wdrożeń dotyczy wywołań generowania obrazów kierowanych przez
dołączonego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów w Azure jest obecnie dostępne tylko w części regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Sprawdź aktualną listę regionów Microsoftu przed utworzeniem
wdrożenia i potwierdź, że konkretny model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje, na które publiczne OpenAI zezwala (na przykład niektóre
wartości `background` w `gpt-image-2`) albo udostępniać je tylko w konkretnych wersjach
modelu. Te różnice wynikają z Azure i bazowego modelu, a nie z
OpenClaw. Jeśli żądanie Azure kończy się błędem walidacji, sprawdź
zestaw parametrów obsługiwanych przez konkretne wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zgodnego zachowania, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw. Zobacz akordeon **Trasy natywne vs zgodne z OpenAI**
w sekcji [Konfiguracja zaawansowana](#advanced-configuration),
aby poznać szczegóły.
</Note>

<Tip>
Informacje o osobnym dostawcy Azure OpenAI Responses (odrębnym od dostawcy `openai`)
znajdziesz w odwołaniach do modeli `azure-openai-responses/*` w akordeonie
[Compaction po stronie serwera](#server-side-compaction-responses-api).
</Tip>

<Note>
Ruch czatu i Responses w Azure wymaga konfiguracji dostawcy/API specyficznej dla Azure
oprócz nadpisania bazowego URL. Jeśli chcesz wykonywać wywołania modeli Azure poza
generowaniem obrazów, użyj przepływu onboardingu lub konfiguracji dostawcy, która ustawia
odpowiedni format API/uwierzytelniania Azure, zamiast zakładać, że samo `openai.baseUrl` wystarczy.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa strategii WebSocket-first z awaryjnym przejściem na SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket, zanim przejdzie na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE podczas czasu schładzania
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień i ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Wartość | Zachowanie |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, awaryjnie SSE |
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
    - [Realtime API z WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Strumieniowe odpowiedzi API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Rozgrzewanie WebSocket">
    OpenClaw domyślnie włącza rozgrzewanie WebSocket dla `openai/*`, aby skrócić opóźnienie pierwszej tury.

    ```json5
    // Wyłącz rozgrzewanie
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

  <Accordion title="Tryb szybki">
    OpenClaw udostępnia wspólny przełącznik trybu szybkiego zarówno dla `openai/*`, jak i `openai-codex/*`:

    - **Czat/UI:** `/fast status|on|off`
    - **Konfiguracja:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Po włączeniu OpenClaw mapuje tryb szybki na przetwarzanie priorytetowe OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a tryb szybki nie nadpisuje `reasoning` ani `text.verbosity`.

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
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w interfejsie Sessions przywraca w sesji skonfigurowaną wartość domyślną.
    </Note>

  </Accordion>

  <Accordion title="Przetwarzanie priorytetowe (service_tier)">
    API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustaw je dla modelu w OpenClaw:

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
    `serviceTier` jest przekazywane tylko do natywnych punktów końcowych OpenAI (`api.openai.com`) i natywnych punktów końcowych Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregokolwiek dostawcę przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) OpenClaw automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (lub `80000`, gdy jest niedostępne)

    <Tabs>
      <Tab title="Włącz jawnie">
        Przydatne dla zgodnych punktów końcowych, takich jak Azure OpenAI Responses:

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
    `responsesServerCompaction` steruje tylko wstrzykiwaniem `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność ustawia `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Rygorystyczny tryb agentowy GPT">
    Dla uruchomień rodziny GPT-5 w `openai/*` i `openai-codex/*` OpenClaw może używać bardziej rygorystycznego osadzonego kontraktu wykonywania:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Przy `strict-agentic` OpenClaw:
    - Nie traktuje już tury zawierającej wyłącznie plan jako udanego postępu, gdy dostępne jest działanie narzędzia
    - Ponawia turę ze wskazówką, aby działać od razu
    - Automatycznie włącza `update_plan` dla istotnej pracy
    - Pokazuje jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień rodziny GPT-5 OpenAI i Codex. Inni dostawcy i starsze rodziny modeli zachowują domyślne działanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne vs zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli, które obsługują wysiłek OpenAI `none`
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi na tryb ścisły
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych hostach natywnych
    - Zachowują kształt żądań właściwy tylko dla OpenAI (`service_tier`, `store`, zgodność reasoning, wskazówki pamięci podręcznej promptów)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego zachowania zgodności
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków właściwych tylko dla tras natywnych

    Azure OpenAI używa natywnego transportu i zgodnego zachowania, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
