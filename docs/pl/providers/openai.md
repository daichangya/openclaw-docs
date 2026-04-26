---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcją Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania wykonywania agenta GPT-5
summary: Używaj OpenAI za pomocą kluczy API lub subskrypcji Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI udostępnia deweloperskie API dla modeli GPT, a Codex jest również dostępny jako agent kodujący w planach ChatGPT przez klientów Codex OpenAI. OpenClaw rozdziela te powierzchnie, aby konfiguracja pozostawała przewidywalna.

  OpenClaw obsługuje trzy ścieżki rodziny OpenAI. Prefiks modelu wybiera ścieżkę dostawcy/uwierzytelniania; osobne ustawienie runtime wybiera, kto wykonuje osadzoną pętlę agenta:

  - **Klucz API** — bezpośredni dostęp do OpenAI Platform z rozliczaniem zależnym od użycia (modele `openai/*`)
  - **Subskrypcja Codex przez PI** — logowanie ChatGPT/Codex z dostępem subskrypcyjnym (modele `openai-codex/*`)
  - **Harness app-server Codex** — natywne wykonanie app-server Codex (modele `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)

  OpenAI wyraźnie wspiera użycie subskrypcyjnego OAuth w zewnętrznych narzędziach i przepływach takich jak OpenClaw.

  Dostawca, model, runtime i kanał to oddzielne warstwy. Jeśli te etykiety zaczynają się mieszać, przeczytaj [Runtime agentów](/pl/concepts/agent-runtimes), zanim zmienisz konfigurację.

  ## Szybki wybór

  | Cel                                           | Użyj                                             | Uwagi                                                                       |
  | --------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
  | Bezpośrednie rozliczanie kluczem API          | `openai/gpt-5.5`                                 | Ustaw `OPENAI_API_KEY` lub uruchom wdrożenie klucza API OpenAI.            |
  | GPT-5.5 z uwierzytelnianiem subskrypcją ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Domyślna ścieżka PI dla OAuth Codex. Najlepszy pierwszy wybór dla konfiguracji subskrypcyjnych. |
  | GPT-5.5 z natywnym zachowaniem app-server Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Wymusza harness app-server Codex dla tego odwołania do modelu.             |
  | Generowanie lub edycja obrazów                | `openai/gpt-image-2`                             | Działa zarówno z `OPENAI_API_KEY`, jak i z OAuth OpenAI Codex.             |
  | Obrazy z przezroczystym tłem                  | `openai/gpt-image-1.5`                           | Użyj `outputFormat=png` lub `webp` oraz `openai.background=transparent`.   |

  ## Mapa nazw

  Nazwy są podobne, ale nie są zamienne:

  | Nazwa, którą widzisz                | Warstwa           | Znaczenie                                                                                   |
  | ----------------------------------- | ----------------- | ------------------------------------------------------------------------------------------- |
  | `openai`                            | Prefiks dostawcy  | Bezpośrednia ścieżka API OpenAI Platform.                                                  |
  | `openai-codex`                      | Prefiks dostawcy  | Ścieżka OAuth/subskrypcji OpenAI Codex przez standardowy runner PI OpenClaw.              |
  | Plugin `codex`                      | Plugin            | Dołączony Plugin OpenClaw, który udostępnia natywny runtime app-server Codex i kontrolki czatu `/codex`. |
  | `agentRuntime.id: codex`            | Runtime agenta    | Wymusza natywny harness app-server Codex dla osadzonych tur.                              |
  | `/codex ...`                        | Zestaw poleceń czatu | Wiąże/kontroluje wątki app-server Codex z poziomu rozmowy.                               |
  | `runtime: "acp", agentId: "codex"`  | Ścieżka sesji ACP | Jawna ścieżka awaryjna uruchamiająca Codex przez ACP/acpx.                                |

  Oznacza to, że konfiguracja może celowo zawierać jednocześnie `openai-codex/*` i Plugin `codex`. Jest to prawidłowe, gdy chcesz używać OAuth Codex przez PI, a jednocześnie mieć dostępne natywne kontrolki czatu `/codex`. `openclaw doctor` ostrzega o tej kombinacji, aby można było potwierdzić, że jest zamierzona; nie przepisuje jej.

  <Note>
  GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp kluczem API OpenAI Platform, jak i przez ścieżki subskrypcyjne/OAuth. Użyj `openai/gpt-5.5` dla bezpośredniego ruchu `OPENAI_API_KEY`, `openai-codex/gpt-5.5` dla OAuth Codex przez PI albo `openai/gpt-5.5` z `agentRuntime.id: "codex"` dla natywnego harness app-server Codex.
  </Note>

  <Note>
  Włączenie Plugin OpenAI lub wybranie modelu `openai-codex/*` nie włącza dołączonego Plugin app-server Codex. OpenClaw włącza ten Plugin tylko wtedy, gdy jawnie wybierzesz natywny harness Codex za pomocą `agentRuntime.id: "codex"` lub użyjesz starszego odwołania do modelu `codex/*`.
  Jeśli dołączony Plugin `codex` jest włączony, ale `openai-codex/*` nadal jest rozwiązywany przez PI, `openclaw doctor` ostrzega i pozostawia ścieżkę bez zmian.
  </Note>

  ## Zakres funkcji OpenClaw

  | Możliwość OpenAI          | Powierzchnia OpenClaw                                    | Status                                                  |
  | ------------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
  | Czat / Responses          | dostawca modeli `openai/<model>`                         | Tak                                                     |
  | Modele subskrypcyjne Codex | `openai-codex/<model>` z OAuth `openai-codex`           | Tak                                                     |
  | Harness app-server Codex  | `openai/<model>` z `agentRuntime.id: codex`              | Tak                                                     |
  | Wyszukiwanie w sieci po stronie serwera | natywne narzędzie OpenAI Responses            | Tak, gdy wyszukiwanie w sieci jest włączone i nie przypięto dostawcy |
  | Obrazy                    | `image_generate`                                         | Tak                                                     |
  | Wideo                     | `video_generate`                                         | Tak                                                     |
  | Zamiana tekstu na mowę    | `messages.tts.provider: "openai"` / `tts`                | Tak                                                     |
  | Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie mediów              | Tak                                                     |
  | Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"`        | Tak                                                     |
  | Głos realtime             | Voice Call `realtime.provider: "openai"` / Control UI Talk | Tak                                                  |
  | Embeddings                | dostawca embeddingów pamięci                             | Tak                                                     |

  ## Pierwsze kroki

  Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

  <Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze do:** bezpośredniego dostępu do API i rozliczania zależnego od użycia.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz lub skopiuj klucz API z [pulpitu OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Uruchom wdrożenie">
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

    ### Podsumowanie ścieżek

    | Odwołanie do modelu     | Konfiguracja runtime         | Ścieżka                    | Uwierzytelnianie |
    | ----------------------- | ---------------------------- | -------------------------- | ---------------- |
    | `openai/gpt-5.5`        | pominięte / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`   | pominięte / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`        | `agentRuntime.id: "codex"`             | Harness app-server Codex   | app-server Codex |

    <Note>
    `openai/*` to bezpośrednia ścieżka klucza API OpenAI, chyba że jawnie wymusisz harness app-server Codex. Użyj `openai-codex/*` dla OAuth Codex przez domyślny runner PI albo użyj `openai/gpt-5.5` z `agentRuntime.id: "codex"` dla natywnego wykonania app-server Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Żądania do działającego API OpenAI odrzucają ten model, a bieżący katalog Codex również go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze do:** używania subskrypcji ChatGPT/Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania do ChatGPT.

    <Steps>
      <Step title="Uruchom OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Lub uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Dla konfiguracji bezgłowych lub nieprzyjaznych dla callbacków dodaj `--device-code`, aby zalogować się przepływem kodu urządzenia ChatGPT zamiast callbacku przeglądarki na localhost:

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

    ### Podsumowanie ścieżek

    | Odwołanie do modelu | Konfiguracja runtime | Ścieżka | Uwierzytelnianie |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | pominięte / `runtime: "pi"` | OAuth ChatGPT/Codex przez PI | logowanie Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Nadal PI, chyba że Plugin jawnie przejmie `openai-codex` | logowanie Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness app-server Codex | uwierzytelnianie app-server Codex |

    <Note>
    Nadal używaj identyfikatora dostawcy `openai-codex` dla poleceń uwierzytelniania/profili. Prefiks modelu `openai-codex/*` jest też jawną ścieżką PI dla OAuth Codex. Nie wybiera ani nie włącza automatycznie dołączonego harness app-server Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Wdrożenie nie importuje już materiałów OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przez powyższy przepływ kodu urządzenia — OpenClaw zarządza wynikowymi poświadczeniami we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Wskaźnik statusu

    Czatowe `/status` pokazuje, który runtime modelu jest aktywny dla bieżącej sesji. Domyślny harness PI pojawia się jako `Runtime: OpenClaw Pi Default`. Gdy wybrany jest dołączony harness app-server Codex, `/status` pokazuje `Runtime: OpenAI Codex`. Istniejące sesje zachowują zapisany identyfikator harness, więc użyj `/new` lub `/reset` po zmianie `agentRuntime`, jeśli chcesz, aby `/status` odzwierciedlał nowy wybór PI/Codex.

    ### Ostrzeżenie doctor

    Jeśli dołączony Plugin `codex` jest włączony, a wybrana jest ścieżka `openai-codex/*` z tej karty, `openclaw doctor` ostrzega, że model nadal jest rozwiązywany przez PI. Pozostaw konfigurację bez zmian, gdy jest to zamierzona ścieżka uwierzytelniania subskrypcyjnego. Przełącz się na `openai/<model>` plus `agentRuntime.id: "codex"` tylko wtedy, gdy chcesz natywnego wykonania app-server Codex.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu runtime jako oddzielne wartości.

    Dla `openai-codex/gpt-5.5` przez OAuth Codex:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit runtime `contextTokens`: `272000`

    Mniejszy domyślny limit w praktyce daje lepsze charakterystyki opóźnień i jakości. Nadpisz go za pomocą `contextTokens`:

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
    Użyj `contextWindow`, aby zadeklarować natywne metadane modelu. Użyj `contextTokens`, aby ograniczyć budżet kontekstu runtime.
    </Note>

    ### Odtwarzanie katalogu

    OpenClaw używa metadanych katalogu Codex z upstream dla `gpt-5.5`, gdy są one dostępne. Jeśli aktywne wykrywanie Codex pominie wiersz `openai-codex/gpt-5.5`, mimo że konto jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby uruchomienia Cron, sub-agentów i skonfigurowanego modelu domyślnego nie kończyły się błędem `Unknown model`.

  </Tab>
</Tabs>

## Generowanie obrazów

Dołączony Plugin `openai` rejestruje generowanie obrazów za pomocą narzędzia `image_generate`.
Obsługuje zarówno generowanie obrazów przez klucz API OpenAI, jak i generowanie obrazów przez OAuth Codex przy użyciu tego samego odwołania do modelu `openai/gpt-image-2`.

| Możliwość                | Klucz API OpenAI                   | OAuth Codex                          |
| ------------------------ | ---------------------------------- | ------------------------------------ |
| Odwołanie do modelu      | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Uwierzytelnianie         | `OPENAI_API_KEY`                   | logowanie OpenAI Codex OAuth         |
| Transport                | OpenAI Images API                  | backend Codex Responses              |
| Maks. liczba obrazów na żądanie | 4                          | 4                                    |
| Tryb edycji              | Włączony (do 5 obrazów referencyjnych) | Włączony (do 5 obrazów referencyjnych) |
| Nadpisania rozmiaru      | Obsługiwane, w tym rozmiary 2K/4K  | Obsługiwane, w tym rozmiary 2K/4K    |
| Współczynnik proporcji / rozdzielczość | Nieprzekazywane do OpenAI Images API | Mapowane na obsługiwany rozmiar, gdy jest to bezpieczne |

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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

`gpt-image-2` jest ustawieniem domyślnym zarówno dla generowania obrazu z tekstu w OpenAI, jak i dla edycji obrazów. `gpt-image-1.5`, `gpt-image-1` i `gpt-image-1-mini` pozostają dostępne jako jawne nadpisania modelu. Użyj `openai/gpt-image-1.5` dla wyjścia PNG/WebP z przezroczystym tłem; bieżące API `gpt-image-2` odrzuca `background: "transparent"`.

Dla żądania z przezroczystym tłem agenci powinni wywołać `image_generate` z `model: "openai/gpt-image-1.5"`, `outputFormat: "png"` lub `"webp"` oraz `background: "transparent"`; starsza opcja dostawcy `openai.background` nadal jest akceptowana. OpenClaw chroni również publiczne ścieżki OpenAI i OpenAI Codex OAuth, przepisując domyślne przezroczyste żądania `openai/gpt-image-2` na `gpt-image-1.5`; Azure i niestandardowe punkty końcowe zgodne z OpenAI zachowują skonfigurowane nazwy wdrożenia/modelu.

To samo ustawienie jest dostępne dla bezgłowych uruchomień CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Używaj tych samych flag `--output-format` i `--background` z `openclaw infer image edit`, gdy zaczynasz od pliku wejściowego.
`--openai-background` pozostaje dostępne jako alias specyficzny dla OpenAI.

W przypadku instalacji OAuth Codex zachowaj to samo odwołanie `openai/gpt-image-2`. Gdy skonfigurowany jest profil OAuth `openai-codex`, OpenClaw rozwiązuje zapisany token dostępu OAuth i wysyła żądania obrazów przez backend Codex Responses. Nie próbuje najpierw `OPENAI_API_KEY` ani nie przechodzi po cichu awaryjnie na klucz API dla tego żądania. Skonfiguruj jawnie `models.providers.openai` z kluczem API, niestandardowym bazowym URL lub punktem końcowym Azure, jeśli chcesz zamiast tego używać bezpośredniej ścieżki OpenAI Images API.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się w zaufanej sieci LAN/prywatnym adresie, ustaw także `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw nadal blokuje prywatne/wewnętrzne punkty końcowe obrazów zgodne z OpenAI, chyba że to ustawienie opt-in jest obecne.

Generowanie:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Generowanie przezroczystego PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Edycja:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generowanie wideo

Dołączony Plugin `openai` rejestruje generowanie wideo za pomocą narzędzia `video_generate`.

| Możliwość       | Wartość                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| Model domyślny   | `openai/sora-2`                                                                  |
| Tryby            | Tekst do wideo, obraz do wideo, edycja pojedynczego wideo                        |
| Wejścia referencyjne | 1 obraz lub 1 wideo                                                          |
| Nadpisania rozmiaru | Obsługiwane                                                                  |
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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Wkład do promptu GPT-5

OpenClaw dodaje współdzielony wkład do promptu GPT-5 dla uruchomień rodziny GPT-5 u różnych dostawców. Jest stosowany według identyfikatora modelu, więc `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne odwołania GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x nie otrzymują jej.

Dołączony natywny harness Codex używa tego samego zachowania GPT-5 i nakładki Heartbeat przez instrukcje deweloperskie app-server Codex, więc sesje `openai/gpt-5.x` wymuszone przez `agentRuntime.id: "codex"` zachowują tę samą spójność wykonania i proaktywne wskazówki Heartbeat, mimo że Codex zarządza resztą promptu harness.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dotyczący trwałości persony, bezpieczeństwa wykonania, dyscypliny użycia narzędzi, kształtu wyjścia, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału oraz zachowanie dla cichych wiadomości pozostaje w współdzielonym promptcie systemowym OpenClaw i polityce dostarczania wyjścia. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Warstwa przyjaznego stylu interakcji jest oddzielna i konfigurowalna.

| Wartość               | Efekt                                          |
| --------------------- | ---------------------------------------------- |
| `"friendly"` (domyślnie) | Włącza warstwę przyjaznego stylu interakcji |
| `"on"`                | Alias dla `"friendly"`                         |
| `"off"`               | Wyłącza tylko warstwę przyjaznego stylu        |

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
Starsze ustawienie `plugins.entries.openai.config.personality` jest nadal odczytywane jako zgodna ścieżka awaryjna, gdy nie ustawiono współdzielonego `agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Dołączony Plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.voice` | `coral` |
    | Szybkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instrukcje | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Używa `OPENAI_API_KEY` jako wartości awaryjnej |
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
    Dołączony Plugin `openai` rejestruje wsadową zamianę mowy na tekst przez powierzchnię transkrypcji rozumienia mediów OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Punkt końcowy: REST OpenAI `/v1/audio/transcriptions`
    - Ścieżka wejściowa: wieloczęściowe przesyłanie pliku audio
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa `tools.media.audio`, w tym segmenty kanałów głosowych Discord i załączniki audio kanałów

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

    Wskazówki dotyczące języka i promptu są przekazywane do OpenAI, gdy są dostarczone przez współdzieloną konfigurację mediów audio lub żądanie transkrypcji dla konkretnego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja realtime">
    Dołączony Plugin `openai` rejestruje transkrypcję realtime dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Używa `OPENAI_API_KEY` jako wartości awaryjnej |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z dźwiękiem G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji realtime Plugin Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa wsadowej ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos realtime">
    Dołączony Plugin `openai` rejestruje głos realtime dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Używa `OPENAI_API_KEY` jako wartości awaryjnej |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment`. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Dołączony dostawca `openai` może kierować ruch do zasobu Azure OpenAI dla generowania obrazów przez nadpisanie bazowego URL. Na ścieżce generowania obrazów OpenClaw wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na format żądania Azure.

<Note>
Głos realtime używa osobnej ścieżki konfiguracji (`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`) i nie zależy od `models.providers.openai.baseUrl`. Zobacz akordeon **Głos realtime** w sekcji [Głos i mowa](#voice-and-speech), aby poznać ustawienia Azure.
</Note>

Używaj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę korporacyjną Azure OpenAI
- Potrzebujesz regionalnej rezydencji danych lub mechanizmów zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch w istniejącej dzierżawie Azure

### Konfiguracja

Aby generować obrazy przez Azure przy użyciu dołączonego dostawcy `openai`, ustaw `models.providers.openai.baseUrl` na zasób Azure, a `apiKey` na klucz Azure OpenAI (nie klucz OpenAI Platform):

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

OpenClaw rozpoznaje następujące sufiksy hostów Azure dla ścieżki generowania obrazów Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Dla żądań generowania obrazów kierowanych na rozpoznany host Azure OpenClaw:

- Wysyła nagłówek `api-key` zamiast `Authorization: Bearer`
- Używa ścieżek ograniczonych do wdrożenia (`/openai/deployments/{deployment}/...`)
- Dołącza `?api-version=...` do każdego żądania
- Używa domyślnego limitu czasu żądania 600 s dla wywołań generowania obrazów Azure.
  Wartości `timeoutMs` dla konkretnych wywołań nadal nadpisują to ustawienie domyślne.

Inne bazowe URL-e (publiczny OpenAI, proxy zgodne z OpenAI) zachowują standardowy format żądań obrazów OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każde niestandardowe `openai.baseUrl` jak publiczny punkt końcowy OpenAI i zakończą się błędem przy wdrożeniach obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję preview lub GA Azure dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Wartością domyślną jest `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli to nazwy wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure kierowanych przez dołączonego dostawcę `openai` pole `model` w OpenClaw musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama zasada nazwy wdrożenia dotyczy wywołań generowania obrazów kierowanych przez dołączonego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w części regionów (na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`, `uaenorth`). Przed utworzeniem wdrożenia sprawdź aktualną listę regionów Microsoft i potwierdź, że konkretny model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczny OpenAI nie zawsze akceptują te same parametry obrazów. Azure może odrzucać opcje, które publiczny OpenAI dopuszcza (na przykład określone wartości `background` dla `gpt-image-2`) albo udostępniać je tylko dla konkretnych wersji modeli. Te różnice wynikają z Azure i modelu bazowego, a nie z OpenClaw. Jeśli żądanie Azure zakończy się błędem walidacji, sprawdź zestaw parametrów obsługiwany przez konkretne wdrożenie i wersję API w portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania compat, ale nie otrzymuje ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Ścieżki natywne vs zgodne z OpenAI** w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu czatu lub Responses na Azure (poza generowaniem obrazów) użyj przepływu wdrożenia lub dedykowanej konfiguracji dostawcy Azure — samo `openai.baseUrl` nie przejmuje formatu API/uwierzytelniania Azure. Istnieje osobny dostawca `azure-openai-responses/*`; zobacz poniżej akordeon dotyczący Compaction po stronie serwera.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa podejścia WebSocket-first z awaryjnym przejściem na SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przejściem awaryjnym na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i w czasie ochłodzenia używa SSE
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
            "openai/gpt-5.5": {
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
    OpenClaw domyślnie włącza rozgrzewanie WebSocket dla `openai/*` i `openai-codex/*`, aby skrócić opóźnienie pierwszej tury.

    ```json5
    // Wyłącz rozgrzewanie
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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

    Gdy tryb jest włączony, OpenClaw mapuje tryb szybki na przetwarzanie priorytetowe OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a tryb szybki nie przepisuje `reasoning` ani `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w UI sesji przywraca w sesji skonfigurowaną wartość domyślną.
    </Note>

  </Accordion>

  <Accordion title="Przetwarzanie priorytetowe (service_tier)">
    API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustaw je dla modelu w OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Obsługiwane wartości: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` jest przekazywane tylko do natywnych punktów końcowych OpenAI (`api.openai.com`) i natywnych punktów końcowych Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregoś z tych dostawców przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) opakowanie strumienia Pi harness w Plugin OpenAI automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że compat modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (lub `80000`, gdy brak tej wartości)

    Dotyczy to wbudowanej ścieżki Pi harness oraz hooków dostawcy OpenAI używanych przez osadzone uruchomienia. Natywny harness app-server Codex zarządza własnym kontekstem przez Codex i jest konfigurowany osobno przez `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Włącz jawnie">
        Przydatne dla zgodnych punktów końcowych, takich jak Azure OpenAI Responses:

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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` steruje tylko wstrzykiwaniem `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że compat ustawia `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Rygorystyczny tryb agentowy GPT">
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
    - Nie traktuje już tury zawierającej wyłącznie plan jako udanego postępu, gdy dostępna jest akcja narzędzia
    - Ponawia turę z ukierunkowaniem typu act-now
    - Automatycznie włącza `update_plan` dla istotnej pracy
    - Pokazuje jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień rodziny GPT-5 OpenAI i Codex. Inni dostawcy i starsze rodziny modeli zachowują domyślne zachowanie.
    </Note>

  </Accordion>

  <Accordion title="Ścieżki natywne vs zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Ścieżki natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących OpenAI `none` effort
    - Pomijają wyłączone reasoning dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi w trybie ścisłym
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych natywnych hostach
    - Zachowują formatowanie żądań specyficzne dla OpenAI (`service_tier`, `store`, compat reasoning, wskazówki cache promptów)

    **Ścieżki proxy/zgodne:**
    - Używają luźniejszego zachowania compat
    - Usuwają Completions `store` z nienatywnych ładunków `openai-completions`
    - Akceptują przekazanie zaawansowanego JSON `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Akceptują `params.chat_template_kwargs` dla proxy Completions zgodnych z OpenAI, takich jak vLLM
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków tylko dla ścieżek natywnych

    Azure OpenAI używa natywnego transportu i zachowania compat, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
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
