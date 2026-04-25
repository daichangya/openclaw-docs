---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcją Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania wykonywania agenta GPT-5
summary: Używaj OpenAI przez klucze API lub subskrypcję Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:56:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI udostępnia API dla deweloperów dla modeli GPT. OpenClaw obsługuje trzy trasy z rodziny OpenAI. Prefiks modelu wybiera trasę:

- **Klucz API** — bezpośredni dostęp do OpenAI Platform z rozliczaniem zależnym od użycia (`openai/*` modele)
- **Subskrypcja Codex przez PI** — logowanie ChatGPT/Codex z dostępem subskrypcyjnym (`openai-codex/*` modele)
- **Harness serwera aplikacji Codex** — natywne wykonanie przez serwer aplikacji Codex (`openai/*` modele plus `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI jawnie wspiera użycie subskrypcyjnego OAuth w narzędziach zewnętrznych i przepływach pracy takich jak OpenClaw.

Dostawca, model, runtime i kanał to oddzielne warstwy. Jeśli te etykiety
zaczynają się mieszać, przeczytaj [Runtime’y agentów](/pl/concepts/agent-runtimes) przed
zmianą konfiguracji.

## Szybki wybór

| Cel | Użyj | Uwagi |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Bezpośrednie rozliczanie kluczem API | `openai/gpt-5.4` | Ustaw `OPENAI_API_KEY` lub uruchom onboarding klucza API OpenAI. |
| GPT-5.5 z uwierzytelnianiem subskrypcją ChatGPT/Codex | `openai-codex/gpt-5.5` | Domyślna trasa PI dla OAuth Codex. Najlepszy pierwszy wybór dla konfiguracji subskrypcyjnych. |
| GPT-5.5 z natywnym zachowaniem serwera aplikacji Codex | `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"` | Używa harnessu serwera aplikacji Codex, a nie publicznej trasy OpenAI API. |
| Generowanie lub edycja obrazów | `openai/gpt-image-2` | Działa zarówno z `OPENAI_API_KEY`, jak i z OAuth OpenAI Codex. |

<Note>
GPT-5.5 jest obecnie dostępny w OpenClaw przez trasy subskrypcyjne/OAuth:
`openai-codex/gpt-5.5` z runnerem PI albo `openai/gpt-5.5` z
harnessem serwera aplikacji Codex. Bezpośredni dostęp kluczem API do `openai/gpt-5.5` jest
obsługiwany, gdy OpenAI włączy GPT-5.5 w publicznym API; do tego czasu używaj
modelu z włączonym API, takiego jak `openai/gpt-5.4`, w konfiguracjach `OPENAI_API_KEY`.
</Note>

<Note>
Włączenie Pluginu OpenAI lub wybranie modelu `openai-codex/*` nie
włącza wbudowanego Pluginu serwera aplikacji Codex. OpenClaw włącza ten Plugin tylko
gdy jawnie wybierzesz natywny harness Codex przez
`embeddedHarness.runtime: "codex"` lub użyjesz starszego odnośnika modelu `codex/*`.
</Note>

## Zakres funkcji OpenClaw

| Możliwość OpenAI | Powierzchnia OpenClaw | Status |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Czat / Responses | `openai/<model>` dostawca modeli | Tak |
| Modele subskrypcyjne Codex | `openai-codex/<model>` z OAuth `openai-codex` | Tak |
| Harness serwera aplikacji Codex | `openai/<model>` z `embeddedHarness.runtime: codex` | Tak |
| Wyszukiwanie w sieci po stronie serwera | Natywne narzędzie OpenAI Responses | Tak, gdy web search jest włączone i nie przypięto dostawcy |
| Obrazy | `image_generate` | Tak |
| Wideo | `video_generate` | Tak |
| Text-to-speech | `messages.tts.provider: "openai"` / `tts` | Tak |
| Batch speech-to-text | `tools.media.audio` / rozumienie multimediów | Tak |
| Streaming speech-to-text | Voice Call `streaming.provider: "openai"` | Tak |
| Głos realtime | Voice Call `realtime.provider: "openai"` / Talk w interfejsie Control UI | Tak |
| Embeddings | dostawca embeddingów pamięci | Tak |

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu do API i rozliczania zależnego od użycia.

    <Steps>
      <Step title="Pobierz klucz API">
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

    ### Podsumowanie trasy

    | Odniesienie modelu | Trasa | Uwierzytelnianie |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Bezpośrednie OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Bezpośrednie OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Przyszła bezpośrednia trasa API, gdy OpenAI włączy GPT-5.5 w API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` to bezpośrednia trasa klucza API OpenAI, chyba że jawnie wymusisz
    harness serwera aplikacji Codex. Sam GPT-5.5 jest obecnie dostępny tylko przez subskrypcję/OAuth;
    używaj `openai-codex/*` dla OAuth Codex przez domyślny runner PI albo
    używaj `openai/gpt-5.5` z `embeddedHarness.runtime: "codex"` dla natywnego
    wykonania przez serwer aplikacji Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Żądania live OpenAI API odrzucają ten model, a bieżący katalog Codex również go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze dla:** używania subskrypcji ChatGPT/Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania do ChatGPT.

    <Steps>
      <Step title="Uruchom OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Lub uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach bezgłowych lub nieprzyjaznych callbackowi dodaj `--device-code`, aby zalogować się przez przepływ device-code ChatGPT zamiast callbacku przeglądarki localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Podsumowanie trasy

    | Odniesienie modelu | Trasa | Uwierzytelnianie |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex przez PI | Logowanie Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness serwera aplikacji Codex | Uwierzytelnianie serwera aplikacji Codex |

    <Note>
    Nadal używaj identyfikatora dostawcy `openai-codex` dla poleceń auth/profili. Prefiks modelu
    `openai-codex/*` jest również jawną trasą PI dla OAuth Codex.
    Nie wybiera ani nie włącza automatycznie wbudowanego harnessu serwera aplikacji Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding nie importuje już materiałów OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przez powyższy przepływ device-code — OpenClaw zarządza wynikowymi poświadczeniami we własnym magazynie auth agenta.
    </Note>

    ### Wskaźnik statusu

    Czat `/status` pokazuje, który runtime modelu jest aktywny dla bieżącej sesji.
    Domyślny harness PI jest wyświetlany jako `Runtime: OpenClaw Pi Default`. Gdy
    wybrany jest wbudowany harness serwera aplikacji Codex, `/status` pokazuje
    `Runtime: OpenAI Codex`. Istniejące sesje zachowują zapisany identyfikator harnessu, więc użyj
    `/new` lub `/reset` po zmianie `embeddedHarness`, jeśli chcesz, aby `/status`
    odzwierciedlał nowy wybór PI/Codex.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu runtime jako oddzielne wartości.

    Dla `openai-codex/gpt-5.5` przez OAuth Codex:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit runtime `contextTokens`: `272000`

    Mniejszy domyślny limit w praktyce daje lepszą latencję i jakość. Nadpisz go przez `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Używaj `contextWindow` do deklarowania natywnych metadanych modelu. Używaj `contextTokens` do ograniczania budżetu kontekstu runtime.
    </Note>

    ### Odtwarzanie katalogu

    OpenClaw używa metadanych katalogu Codex z upstream dla `gpt-5.5`, gdy są
    dostępne. Jeśli wykrywanie live Codex pominie wiersz `openai-codex/gpt-5.5`, gdy
    konto jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    Cron, sub-agent i uruchomienia skonfigurowanego modelu domyślnego nie kończyły się błędem
    `Unknown model`.

  </Tab>
</Tabs>

## Generowanie obrazów

Wbudowany Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów OpenAI kluczem API, jak i generowanie obrazów przez OAuth Codex
przez to samo odniesienie modelu `openai/gpt-image-2`.

| Możliwość | Klucz API OpenAI | OAuth Codex |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Odniesienie modelu | `openai/gpt-image-2` | `openai/gpt-image-2` |
| Uwierzytelnianie | `OPENAI_API_KEY` | Logowanie OpenAI Codex OAuth |
| Transport | OpenAI Images API | Backend Codex Responses |
| Maks. liczba obrazów na żądanie | 4 | 4 |
| Tryb edycji | Włączony (do 5 obrazów referencyjnych) | Włączony (do 5 obrazów referencyjnych) |
| Nadpisania rozmiaru | Obsługiwane, w tym rozmiary 2K/4K | Obsługiwane, w tym rozmiary 2K/4K |
| Proporcje / rozdzielczość | Nie są przekazywane do OpenAI Images API | Mapowane do obsługiwanego rozmiaru, gdy jest to bezpieczne |

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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

`gpt-image-2` jest domyślnym modelem zarówno dla generowania obrazów z tekstu w OpenAI, jak i dla
edycji obrazów. `gpt-image-1` nadal można używać jako jawnego nadpisania modelu, ale nowe
przepływy pracy z obrazami OpenAI powinny używać `openai/gpt-image-2`.

W instalacjach z OAuth Codex zachowaj to samo odniesienie `openai/gpt-image-2`. Gdy
profil OAuth `openai-codex` jest skonfigurowany, OpenClaw rozpoznaje zapisany token dostępu OAuth
i wysyła żądania obrazów przez backend Codex Responses. Nie próbuje
najpierw `OPENAI_API_KEY` ani nie przechodzi po cichu awaryjnie na klucz API dla tego
żądania. Skonfiguruj `models.providers.openai` jawnie z kluczem API,
niestandardowym `baseUrl` lub endpointem Azure, jeśli chcesz używać bezpośredniej trasy
OpenAI Images API.
Jeśli ten niestandardowy endpoint obrazów znajduje się w zaufanej sieci LAN/adresie prywatnym, ustaw także
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw nadal
blokuje prywatne/wewnętrzne endpointy obrazów zgodne z OpenAI, chyba że to ustawienie opt-in
jest obecne.

Generowanie:

```
/tool image_generate model=openai/gpt-image-2 prompt="Dopracowany plakat premierowy dla OpenClaw na macOS" size=3840x2160 count=1
```

Edycja:

```
/tool image_generate model=openai/gpt-image-2 prompt="Zachowaj kształt obiektu, zmień materiał na półprzezroczyste szkło" image=/path/to/reference.png size=1024x1536
```

## Generowanie wideo

Wbudowany Plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość | Wartość |
| ---------------- | --------------------------------------------------------------------------------- |
| Model domyślny | `openai/sora-2` |
| Tryby | Tekst do wideo, obraz do wideo, edycja pojedynczego wideo |
| Wejścia referencyjne | 1 obraz lub 1 wideo |
| Nadpisania rozmiaru | Obsługiwane |
| Inne nadpisania | `aspectRatio`, `resolution`, `audio`, `watermark` są ignorowane z ostrzeżeniem narzędzia |

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Wkład do promptu GPT-5

OpenClaw dodaje współdzielony wkład do promptu GPT-5 dla uruchomień rodziny GPT-5 u różnych dostawców. Jest stosowany według identyfikatora modelu, więc `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne odniesienia GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Wbudowany natywny harness Codex używa tego samego zachowania GPT-5 i nakładki Heartbeat przez instrukcje deweloperskie serwera aplikacji Codex, więc sesje `openai/gpt-5.x` wymuszone przez `embeddedHarness.runtime: "codex"` zachowują tę samą konsekwencję działania i proaktywne wskazówki Heartbeat, mimo że Codex zarządza resztą promptu harnessu.

Wkład GPT-5 dodaje oznakowany kontrakt zachowania dotyczący utrzymywania persony, bezpieczeństwa wykonywania, dyscypliny narzędzi, kształtu wyjścia, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału oraz zachowanie cichych wiadomości pozostają we współdzielonym promptcie systemowym OpenClaw i polityce dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Warstwa przyjaznego stylu interakcji jest oddzielna i konfigurowalna.

| Wartość | Efekt |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (domyślnie) | Włącza warstwę przyjaznego stylu interakcji |
| `"on"` | Alias dla `"friendly"` |
| `"off"` | Wyłącza tylko warstwę przyjaznego stylu |

<Tabs>
  <Tab title="Konfiguracja">
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
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako fallback zgodności, gdy współdzielone ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Wbudowany Plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.voice` | `coral` |
    | Prędkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instrukcje | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Fallback do `OPENAI_API_KEY` |
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
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać TTS `baseUrl` bez wpływu na endpoint API czatu.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Wbudowany Plugin `openai` rejestruje wsadowe speech-to-text przez
    powierzchnię transkrypcji rozumienia multimediów w OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: upload pliku audio jako multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord i
      załączników audio kanału

    Aby wymusić OpenAI dla transkrypcji przychodzącego audio:

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

    Wskazówki dotyczące języka i promptu są przekazywane do OpenAI, gdy są dostarczone przez
    współdzieloną konfigurację audio media lub żądanie transkrypcji dla danego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja realtime">
    Wbudowany Plugin `openai` rejestruje transkrypcję realtime dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Fallback do `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z dźwiękiem G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji realtime Pluginu Voice Call; głos w Discord obecnie nagrywa krótkie segmenty i zamiast tego używa wsadowej ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos realtime">
    Wbudowany Plugin `openai` rejestruje głos realtime dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Fallback do `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment`. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpointy Azure OpenAI

Wbudowany dostawca `openai` może kierować ruch do zasobu Azure OpenAI dla
generowania obrazów przez nadpisanie `baseUrl`. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na
kształt żądania Azure.

<Note>
Głos realtime używa oddzielnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i nie jest zależny od `models.providers.openai.baseUrl`. Zobacz akordeon **Głos
realtime** w sekcji [Głos i mowa](#voice-and-speech), aby poznać jego ustawienia
Azure.
</Note>

Używaj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę enterprise dla Azure OpenAI
- Potrzebujesz regionalnej rezydencji danych lub mechanizmów zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch w istniejącej dzierżawie Azure

### Konfiguracja

Dla generowania obrazów przez Azure za pośrednictwem wbudowanego dostawcy `openai`, ustaw
`models.providers.openai.baseUrl` na zasób Azure i ustaw `apiKey` na
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

OpenClaw rozpoznaje następujące sufiksy hostów Azure dla trasy generowania obrazów Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Dla żądań generowania obrazów na rozpoznanym hoście Azure OpenClaw:

- Wysyła nagłówek `api-key` zamiast `Authorization: Bearer`
- Używa ścieżek zależnych od deploymentu (`/openai/deployments/{deployment}/...`)
- Dodaje `?api-version=...` do każdego żądania

Inne `baseUrl` (publiczne OpenAI, proxy zgodne z OpenAI) zachowują standardowy
kształt żądania obrazu OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każde niestandardowe
`openai.baseUrl` jak publiczny endpoint OpenAI i zakończą się błędem względem deploymentów
obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję preview lub GA Azure
dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Domyślną wartością jest `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli to nazwy deploymentów

Azure OpenAI wiąże modele z deploymentami. Dla żądań generowania obrazów Azure
kierowanych przez wbudowanego dostawcę `openai`, pole `model` w OpenClaw
musi być **nazwą deploymentu Azure** skonfigurowaną w portalu Azure, a nie
publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz deployment o nazwie `gpt-image-2-prod`, który obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Czysty plakat" size=1024x1024 count=1
```

Ta sama zasada nazwy deploymentu dotyczy wywołań generowania obrazów kierowanych przez
wbudowanego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w podzbiorze regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Przed utworzeniem deploymentu sprawdź aktualną listę regionów Microsoft i potwierdź, że konkretny model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje, które publiczne OpenAI dopuszcza (na przykład niektóre
wartości `background` dla `gpt-image-2`) albo udostępniać je tylko w określonych
wersjach modeli. Te różnice wynikają z Azure i bazowego modelu, a nie z
OpenClaw. Jeśli żądanie Azure kończy się błędem walidacji, sprawdź
zestaw parametrów obsługiwany przez konkretny deployment i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Trasy natywne vs zgodne z OpenAI**
w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu czatu lub Responses na Azure (poza generowaniem obrazów) użyj
przepływu onboardingu lub dedykowanej konfiguracji dostawcy Azure — samo `openai.baseUrl`
nie przejmuje kształtu API/uwierzytelniania Azure. Istnieje osobny
dostawca `azure-openai-responses/*`; zobacz
poniższy akordeon dotyczący Compaction po stronie serwera.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa trybu WebSocket-first z fallbackiem do SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket, zanim przejdzie awaryjnie do SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE w czasie ochłodzenia
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień i ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Wartość | Zachowanie |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, fallback do SSE |
    | `"sse"` | Wymuś tylko SSE |
    | `"websocket"` | Wymuś tylko WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
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

  <Accordion title="Rozgrzewanie WebSocket">
    OpenClaw domyślnie włącza rozgrzewanie WebSocket dla `openai/*` i `openai-codex/*`, aby zmniejszyć opóźnienie pierwszej tury.

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

  <Accordion title="Tryb szybki">
    OpenClaw udostępnia współdzielony przełącznik trybu szybkiego dla `openai/*` i `openai-codex/*`:

    - **Czat/UI:** `/fast status|on|off`
    - **Konfiguracja:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Po włączeniu OpenClaw mapuje tryb szybki na przetwarzanie priorytetowe OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a tryb szybki nie przepisuje `reasoning` ani `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Nadpisania sesji mają pierwszeństwo nad konfiguracją. Wyczyszczenie nadpisania sesji w interfejsie Sessions przywraca sesję do skonfigurowanej wartości domyślnej.
    </Note>

  </Accordion>

  <Accordion title="Przetwarzanie priorytetowe (`service_tier`)">
    API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustaw je dla modelu w OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Obsługiwane wartości: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` jest przekazywane tylko do natywnych endpointów OpenAI (`api.openai.com`) i natywnych endpointów Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregoś z tych dostawców przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) otoczka strumienia harnessu Pi w Pluginie OpenAI automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (lub `80000`, gdy jest niedostępne)

    Dotyczy to wbudowanej ścieżki harnessu Pi oraz hooków dostawcy OpenAI używanych przez osadzone uruchomienia. Natywny harness serwera aplikacji Codex zarządza własnym kontekstem przez Codex i jest konfigurowany osobno przez `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Włącz jawnie">
        Przydatne dla zgodnych endpointów, takich jak Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
    `responsesServerCompaction` kontroluje tylko wstrzykiwanie `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność ustawia `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Ścisły tryb agentowy GPT">
    Dla uruchomień rodziny GPT-5 na `openai/*` OpenClaw może używać bardziej rygorystycznego osadzonego kontraktu wykonania:

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
    - Nie traktuje już tury zawierającej tylko plan jako udanego postępu, gdy dostępne jest działanie narzędzia
    - Ponawia turę z nakierowaniem na natychmiastowe działanie
    - Automatycznie włącza `update_plan` dla istotnej pracy
    - Pokazuje jawny stan blokady, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień rodziny GPT-5 w OpenAI i Codex. Inni dostawcy i starsze rodziny modeli zachowują domyślne zachowanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne vs zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie endpointy OpenAI, Codex i Azure OpenAI inaczej niż generyczne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli, które obsługują `none` w OpenAI
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi na tryb ścisły
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych natywnych hostach
    - Zachowują kształtowanie żądań tylko dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki pamięci podręcznej promptu)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego zachowania zgodności
    - Usuwają Completions `store` z nienatywnych ładunków `openai-completions`
    - Akceptują zaawansowane przekazywanie JSON `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków tylko natywnych

    Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odniesień modeli i zachowania failover.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
