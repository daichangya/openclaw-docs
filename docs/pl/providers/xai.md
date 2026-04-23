---
read_when:
    - Chcesz używać modeli Grok w OpenClaw
    - Konfigurujesz uwierzytelnianie xAI lub identyfikatory modeli
summary: Używaj modeli xAI Grok w OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T10:08:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw dostarcza bundled Plugin dostawcy `xai` dla modeli Grok.

## Pierwsze kroki

<Steps>
  <Step title="Utwórz klucz API">
    Utwórz klucz API w [konsoli xAI](https://console.x.ai/).
  </Step>
  <Step title="Ustaw klucz API">
    Ustaw `XAI_API_KEY` albo uruchom:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Wybierz model">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw używa xAI Responses API jako bundled transportu xAI. Ten sam
`XAI_API_KEY` może także zasilać `web_search` oparte na Grok, pierwszoklasowe `x_search`
oraz zdalne `code_execution`.
Jeśli przechowujesz klucz xAI w `plugins.entries.xai.config.webSearch.apiKey`,
bundled dostawca modeli xAI również użyje tego klucza jako fallbacku.
Dostrajanie `code_execution` znajduje się w `plugins.entries.xai.config.codeExecution`.
</Note>

## Bundled katalog modeli

OpenClaw zawiera od razu te rodziny modeli xAI:

| Rodzina         | Identyfikatory modeli                                                     |
| --------------- | ------------------------------------------------------------------------- |
| Grok 3          | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                |
| Grok 4          | `grok-4`, `grok-4-0709`                                                   |
| Grok 4 Fast     | `grok-4-fast`, `grok-4-fast-non-reasoning`                                |
| Grok 4.1 Fast   | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                            |
| Grok 4.20 Beta  | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`  |
| Grok Code       | `grok-code-fast-1`                                                        |

Plugin przekazuje też dalej i rozwiązuje nowsze identyfikatory `grok-4*` i `grok-code-fast*`, gdy
mają ten sam kształt API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` oraz warianty `grok-4.20-beta-*` to
obecne odwołania Grok obsługujące obrazy w bundled katalogu.
</Tip>

## Zakres funkcji OpenClaw

Bundled Plugin mapuje bieżącą publiczną powierzchnię API xAI na współdzielone
kontrakty dostawców i narzędzi OpenClaw tam, gdzie zachowanie pasuje w czysty sposób.

| Możliwość xAI              | Powierzchnia OpenClaw                     | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Czat / Responses           | dostawca modeli `xai/<model>`             | Tak                                                                 |
| Wyszukiwanie w sieci po stronie serwera | dostawca `web_search` `grok`   | Tak                                                                 |
| Wyszukiwanie X po stronie serwera | narzędzie `x_search`               | Tak                                                                 |
| Wykonywanie kodu po stronie serwera | narzędzie `code_execution`       | Tak                                                                 |
| Obrazy                     | `image_generate`                          | Tak                                                                 |
| Wideo                      | `video_generate`                          | Tak                                                                 |
| Wsadowy text-to-speech     | `messages.tts.provider: "xai"` / `tts`    | Tak                                                                 |
| Strumieniowy TTS           | —                                         | Nieudostępnione; kontrakt TTS OpenClaw zwraca kompletne bufory audio |
| Wsadowy speech-to-text     | `tools.media.audio` / rozumienie multimediów | Tak                                                              |
| Strumieniowy speech-to-text | Voice Call `streaming.provider: "xai"`   | Tak                                                                 |
| Realtime voice             | —                                         | Jeszcze nieudostępnione; inny kontrakt sesji/WebSocket              |
| Pliki / batch              | Tylko zgodność generycznego API modeli    | Nie jest pierwszoklasowym narzędziem OpenClaw                       |

<Note>
OpenClaw używa REST API xAI dla obrazów/wideo/TTS/STT do generowania multimediów,
mowy i wsadowej transkrypcji, strumieniowego WebSocket STT xAI do aktywnej
transkrypcji voice-call oraz Responses API dla modeli, wyszukiwania i
narzędzi code-execution. Funkcje wymagające innych kontraktów OpenClaw, takie jak
sesje głosowe Realtime, są dokumentowane tutaj jako możliwości upstream, a nie
ukryte zachowanie Pluginu.
</Note>

### Mapowania trybu szybkiego

`/fast on` lub `agents.defaults.models["xai/<model>"].params.fastMode: true`
przepisuje natywne żądania xAI w następujący sposób:

| Model źródłowy | Cel trybu szybkiego |
| -------------- | ------------------- |
| `grok-3`       | `grok-3-fast`       |
| `grok-3-mini`  | `grok-3-mini-fast`  |
| `grok-4`       | `grok-4-fast`       |
| `grok-4-0709`  | `grok-4-fast`       |

### Starsze aliasy zgodności

Starsze aliasy nadal normalizują się do kanonicznych bundled identyfikatorów:

| Starszy alias             | Kanoniczny identyfikator                |
| ------------------------- | --------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                           |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                         |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`       |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning`   |

## Funkcje

<AccordionGroup>
  <Accordion title="Wyszukiwanie w sieci">
    Bundled dostawca wyszukiwania w sieci `grok` również używa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generowanie wideo">
    Bundled Plugin `xai` rejestruje generowanie wideo przez współdzielone
    narzędzie `video_generate`.

    - Domyślny model wideo: `xai/grok-imagine-video`
    - Tryby: text-to-video, image-to-video, zdalna edycja wideo i zdalne
      rozszerzanie wideo
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Rozdzielczości: `480P`, `720P`
    - Czas trwania: 1-15 sekund dla generowania/image-to-video, 2-10 sekund dla
      rozszerzania

    <Warning>
    Lokalne bufory wideo nie są akceptowane. Używaj zdalnych URL-i `http(s)` dla
    danych wejściowych edycji/rozszerzania wideo. Image-to-video akceptuje lokalne bufory obrazów, ponieważ
    OpenClaw może zakodować je jako URL-e danych dla xAI.
    </Warning>

    Aby używać xAI jako domyślnego dostawcy wideo:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia,
    wybór dostawcy i zachowanie failover.
    </Note>

  </Accordion>

  <Accordion title="Generowanie obrazów">
    Bundled Plugin `xai` rejestruje generowanie obrazów przez współdzielone
    narzędzie `image_generate`.

    - Domyślny model obrazów: `xai/grok-imagine-image`
    - Dodatkowy model: `xai/grok-imagine-image-pro`
    - Tryby: text-to-image i edycja na podstawie obrazu referencyjnego
    - Dane wejściowe referencyjne: jeden `image` lub do pięciu `images`
    - Proporcje obrazu: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Rozdzielczości: `1K`, `2K`
    - Liczba: do 4 obrazów

    OpenClaw żąda od xAI odpowiedzi obrazów w formacie `b64_json`, aby wygenerowane multimedia mogły zostać
    zapisane i dostarczone przez zwykłą ścieżkę załączników kanału. Lokalne
    obrazy referencyjne są konwertowane do URL-i danych; zdalne odwołania `http(s)` są
    przekazywane dalej.

    Aby używać xAI jako domyślnego dostawcy obrazów:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI dokumentuje także `quality`, `mask`, `user` oraz dodatkowe natywne proporcje,
    takie jak `1:2`, `2:1`, `9:20` i `20:9`. OpenClaw przekazuje dziś tylko
    współdzielone, międzydostawcowe kontrolki obrazów; nieobsługiwane natywne ustawienia
    są celowo nieudostępniane przez `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Bundled Plugin `xai` rejestruje text-to-speech przez współdzieloną
    powierzchnię dostawcy `tts`.

    - Głosy: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Głos domyślny: `eve`
    - Formaty: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Język: kod BCP-47 lub `auto`
    - Szybkość: natywne nadpisanie szybkości dostawcy
    - Natywny format notatek głosowych Opus nie jest obsługiwany

    Aby używać xAI jako domyślnego dostawcy TTS:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw używa wsadowego endpointu xAI `/v1/tts`. xAI oferuje także strumieniowy TTS
    przez WebSocket, ale kontrakt dostawcy mowy OpenClaw obecnie oczekuje
    kompletnego bufora audio przed dostarczeniem odpowiedzi.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Bundled Plugin `xai` rejestruje wsadowy speech-to-text przez powierzchnię
    transkrypcji rozumienia multimediów OpenClaw.

    - Model domyślny: `grok-stt`
    - Endpoint: xAI REST `/v1/stt`
    - Ścieżka wejściowa: przesyłanie pliku audio jako multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie przychodząca transkrypcja audio używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord i
      załączników audio kanałów

    Aby wymusić xAI dla przychodzącej transkrypcji audio:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Język można podać przez współdzieloną konfigurację audio multimediów albo w żądaniu transkrypcji dla pojedynczego wywołania. Wskazówki promptu są akceptowane przez współdzieloną
    powierzchnię OpenClaw, ale integracja xAI REST STT przekazuje tylko plik, model i
    język, ponieważ to właśnie czysto mapuje się na bieżący publiczny endpoint xAI.

  </Accordion>

  <Accordion title="Strumieniowy speech-to-text">
    Bundled Plugin `xai` rejestruje także dostawcę transkrypcji realtime
    dla dźwięku aktywnego voice-call.

    - Endpoint: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Domyślne kodowanie: `mulaw`
    - Domyślna częstotliwość próbkowania: `8000`
    - Domyślne endpointing: `800ms`
    - Transkrypcje pośrednie: domyślnie włączone

    Strumień multimediów Twilio w Voice Call wysyła ramki audio G.711 µ-law, więc
    dostawca xAI może przekazywać te ramki bezpośrednio bez transkodowania:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Konfiguracja należąca do dostawcy znajduje się w
    `plugins.entries.voice-call.config.streaming.providers.xai`. Obsługiwane
    klucze to `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` lub
    `alaw`), `interimResults`, `endpointingMs` i `language`.

    <Note>
    Ten dostawca strumieniowy służy do ścieżki transkrypcji realtime w Voice Call.
    Dźwięk głosowy Discord obecnie nagrywa krótkie segmenty i zamiast tego używa wsadowej
    ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Konfiguracja x_search">
    Bundled Plugin xAI udostępnia `x_search` jako narzędzie OpenClaw do przeszukiwania
    treści X (dawniej Twitter) przez Grok.

    Ścieżka konfiguracji: `plugins.entries.xai.config.xSearch`

    | Klucz             | Typ     | Domyślnie          | Opis                                 |
    | ----------------- | ------- | ------------------ | ------------------------------------ |
    | `enabled`         | boolean | —                  | Włącza lub wyłącza `x_search`        |
    | `model`           | string  | `grok-4-1-fast`    | Model używany do żądań `x_search`    |
    | `inlineCitations` | boolean | —                  | Dołącza cytowania inline w wynikach  |
    | `maxTurns`        | number  | —                  | Maksymalna liczba tur rozmowy        |
    | `timeoutSeconds`  | number  | —                  | Limit czasu żądania w sekundach      |
    | `cacheTtlMinutes` | number  | —                  | Czas życia cache w minutach          |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfiguracja wykonywania kodu">
    Bundled Plugin xAI udostępnia `code_execution` jako narzędzie OpenClaw do
    zdalnego wykonywania kodu w środowisku sandbox xAI.

    Ścieżka konfiguracji: `plugins.entries.xai.config.codeExecution`

    | Klucz             | Typ     | Domyślnie                 | Opis                                      |
    | ----------------- | ------- | ------------------------- | ----------------------------------------- |
    | `enabled`         | boolean | `true` (jeśli klucz jest dostępny) | Włącza lub wyłącza wykonywanie kodu |
    | `model`           | string  | `grok-4-1-fast`           | Model używany do żądań wykonywania kodu   |
    | `maxTurns`        | number  | —                         | Maksymalna liczba tur rozmowy             |
    | `timeoutSeconds`  | number  | —                         | Limit czasu żądania w sekundach           |

    <Note>
    To zdalne wykonywanie w sandboxie xAI, a nie lokalne [`exec`](/pl/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Znane ograniczenia">
    - Uwierzytelnianie obecnie obsługuje tylko klucz API. W OpenClaw nie ma jeszcze przepływu OAuth ani device-code dla xAI.
    - `grok-4.20-multi-agent-experimental-beta-0304` nie jest obsługiwany na
      zwykłej ścieżce dostawcy xAI, ponieważ wymaga innej powierzchni API upstream
      niż standardowy transport xAI w OpenClaw.
    - xAI Realtime voice nie jest jeszcze zarejestrowany jako dostawca OpenClaw. Wymaga
      innego dwukierunkowego kontraktu sesji głosowej niż wsadowe STT albo
      strumieniowa transkrypcja.
    - `quality` obrazu xAI, `mask` obrazu i dodatkowe natywne proporcje obrazu
      nie są udostępniane, dopóki współdzielone narzędzie `image_generate` nie będzie miało
      odpowiadających im międzydostawcowych kontrolek.
  </Accordion>

  <Accordion title="Uwagi zaawansowane">
    - OpenClaw automatycznie stosuje poprawki zgodności schematu narzędzi i wywołań narzędzi specyficzne dla xAI
      na współdzielonej ścieżce runnera.
    - Natywne żądania xAI domyślnie ustawiają `tool_stream: true`. Ustaw
      `agents.defaults.models["xai/<model>"].params.tool_stream` na `false`, aby
      to wyłączyć.
    - Bundled wrapper xAI usuwa nieobsługiwane flagi ścisłego schematu narzędzi i
      klucze payloadu rozumowania przed wysłaniem natywnych żądań xAI.
    - `web_search`, `x_search` i `code_execution` są udostępniane jako narzędzia OpenClaw.
      OpenClaw włącza konkretną wbudowaną funkcję xAI potrzebną w danym
      żądaniu narzędzia, zamiast dołączać wszystkie natywne narzędzia do każdej tury czatu.
    - `x_search` i `code_execution` należą do bundled Pluginu xAI, a nie są
      zakodowane na stałe w głównym runtime modeli.
    - `code_execution` to zdalne wykonywanie w sandboxie xAI, a nie lokalne
      [`exec`](/pl/tools/exec).
  </Accordion>
</AccordionGroup>

## Testowanie na żywo

Ścieżki multimedialne xAI są pokryte testami jednostkowymi i opcjonalnymi zestawami live. Polecenia live
ładują sekrety z powłoki logowania, w tym z `~/.profile`, przed
sondowaniem `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Plik live specyficzny dla dostawcy syntetyzuje zwykły TTS, telekomunikacyjny PCM
TTS, transkrybuje audio przez wsadowe STT xAI, strumieniuje to samo PCM przez realtime STT xAI,
generuje wynik text-to-image i edytuje obraz referencyjny. Współdzielony plik live obrazów weryfikuje tego samego dostawcę xAI przez
wybór runtime OpenClaw, fallback, normalizację i ścieżkę załączników multimedialnych.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Wszyscy dostawcy" href="/pl/providers/index" icon="grid-2">
    Szerszy przegląd dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i rozwiązania.
  </Card>
</CardGroup>
