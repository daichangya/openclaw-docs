---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw.
    - Potrzebujesz klucza API lub przepływu uwierzytelniania OAuth.
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie mediów, TTS, wyszukiwanie web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T13:56:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Wtyczka Google (Gemini) zapewnia dostęp do modeli Gemini przez Google AI Studio, a także
generowanie obrazów, rozumienie mediów (obraz/audio/wideo), zamianę tekstu na mowę oraz wyszukiwanie w sieci przez
Gemini Grounding.

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- API: Google Gemini API
- Opcja środowiska uruchomieniowego: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  ponownie używa OAuth Gemini CLI, zachowując przy tym referencje modeli w kanonicznej postaci `google/*`.

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze dla:** standardowego dostępu do API Gemini przez Google AI Studio.

    <Steps>
      <Step title="Uruchom wdrażanie">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Lub przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Ustaw domyślny model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Zmienne środowiskowe `GEMINI_API_KEY` i `GOOGLE_API_KEY` są obie akceptowane. Użyj tej, którą masz już skonfigurowaną.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Najlepsze dla:** ponownego użycia istniejącego logowania Gemini CLI przez PKCE OAuth zamiast osobnego klucza API.

    <Warning>
    Dostawca `google-gemini-cli` jest nieoficjalną integracją. Niektórzy użytkownicy
    zgłaszają ograniczenia konta przy używaniu OAuth w ten sposób. Używasz na własne ryzyko.
    </Warning>

    <Steps>
      <Step title="Zainstaluj Gemini CLI">
        Lokalne polecenie `gemini` musi być dostępne w `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # lub npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw obsługuje zarówno instalacje Homebrew, jak i globalne instalacje npm, w tym
        typowe układy Windows/npm.
      </Step>
      <Step title="Zaloguj się przez OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Domyślny model: `google/gemini-3.1-pro-preview`
    - Środowisko uruchomieniowe: `google-gemini-cli`
    - Alias: `gemini-cli`

    **Zmienne środowiskowe:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Lub warianty `GEMINI_CLI_*`.)

    <Note>
    Jeśli żądania OAuth Gemini CLI nie działają po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub
    `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway i spróbuj ponownie.
    </Note>

    <Note>
    Jeśli logowanie kończy się niepowodzeniem, zanim rozpocznie się przepływ w przeglądarce, upewnij się, że lokalne polecenie `gemini`
    jest zainstalowane i znajduje się w `PATH`.
    </Note>

    Referencje modeli `google-gemini-cli/*` są starszymi aliasami zgodności. Nowe
    konfiguracje powinny używać referencji modeli `google/*` oraz środowiska uruchomieniowego `google-gemini-cli`,
    gdy chcą lokalnego wykonania Gemini CLI.

  </Tab>
</Tabs>

## Możliwości

| Możliwość             | Obsługiwane                  |
| --------------------- | ---------------------------- |
| Uzupełnianie czatu    | Tak                          |
| Generowanie obrazów   | Tak                          |
| Generowanie muzyki    | Tak                          |
| Zamiana tekstu na mowę| Tak                          |
| Głos w czasie rzeczywistym | Tak (Google Live API)   |
| Rozumienie obrazów    | Tak                          |
| Transkrypcja audio    | Tak                          |
| Rozumienie wideo      | Tak                          |
| Wyszukiwanie w sieci (Grounding) | Tak                |
| Myślenie/wnioskowanie | Tak (Gemini 2.5+ / Gemini 3+) |
| Modele Gemma 4        | Tak                          |

<Tip>
Modele Gemini 3 używają `thinkingLevel` zamiast `thinkingBudget`. OpenClaw mapuje
kontrolki wnioskowania dla Gemini 3, Gemini 3.1 i aliasów `gemini-*-latest` na
`thinkingLevel`, aby uruchomienia domyślne/o niskim opóźnieniu nie wysyłały
wyłączonych wartości `thinkingBudget`.

`/think adaptive` zachowuje semantykę dynamicznego myślenia Google zamiast wybierania
stałego poziomu OpenClaw. Gemini 3 i Gemini 3.1 pomijają stały `thinkingLevel`, aby
Google mogło wybrać poziom; Gemini 2.5 wysyła dynamiczny znacznik Google
`thinkingBudget: -1`.

Modele Gemma 4 (na przykład `gemma-4-26b-a4b-it`) obsługują tryb myślenia. OpenClaw
przepisuje `thinkingBudget` na obsługiwany przez Google `thinkingLevel` dla Gemma 4.
Ustawienie myślenia na `off` zachowuje wyłączenie myślenia zamiast mapowania na
`MINIMAL`.
</Tip>

## Generowanie obrazów

Dołączony dostawca generowania obrazów `google` domyślnie używa
`google/gemini-3.1-flash-image-preview`.

- Obsługuje także `google/gemini-3-pro-image-preview`
- Generowanie: do 4 obrazów na żądanie
- Tryb edycji: włączony, do 5 obrazów wejściowych
- Kontrolki geometrii: `size`, `aspectRatio` i `resolution`

Aby używać Google jako domyślnego dostawcy obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Zobacz [Image Generation](/pl/tools/image-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie mechanizmu failover.
</Note>

## Generowanie wideo

Dołączona wtyczka `google` rejestruje także generowanie wideo przez współdzielone
narzędzie `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: text-to-video, image-to-video oraz przepływy pojedynczego wideo referencyjnego
- Obsługuje `aspectRatio`, `resolution` i `audio`
- Bieżące ograniczenie czasu trwania: **od 4 do 8 sekund**

Aby używać Google jako domyślnego dostawcy wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Zobacz [Video Generation](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie mechanizmu failover.
</Note>

## Generowanie muzyki

Dołączona wtyczka `google` rejestruje także generowanie muzyki przez współdzielone
narzędzie `music_generate`.

- Domyślny model muzyczny: `google/lyria-3-clip-preview`
- Obsługuje także `google/lyria-3-pro-preview`
- Kontrolki promptu: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, a także `wav` w `google/lyria-3-pro-preview`
- Dane wejściowe referencyjne: do 10 obrazów
- Uruchomienia oparte na sesji odłączają się przez współdzielony przepływ zadania/statusu, w tym `action: "status"`

Aby używać Google jako domyślnego dostawcy muzyki:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Zobacz [Music Generation](/pl/tools/music-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie mechanizmu failover.
</Note>

## Zamiana tekstu na mowę

Dołączony dostawca mowy `google` używa ścieżki Gemini API TTS z
`gemini-3.1-flash-tts-preview`.

- Domyślny głos: `Kore`
- Uwierzytelnianie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- Wyjście: WAV dla zwykłych załączników TTS, PCM dla Talk/telefonii
- Natywne wyjście notatki głosowej: nieobsługiwane na tej ścieżce Gemini API, ponieważ API zwraca PCM zamiast Opus

Aby używać Google jako domyślnego dostawcy TTS:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Mów profesjonalnie i spokojnym tonem.",
        },
      },
    },
  },
}
```

Gemini API TTS używa promptów w języku naturalnym do kontroli stylu. Ustaw
`audioProfile`, aby dodać wielokrotnego użytku prompt stylu przed tekstem mówionym. Ustaw
`speakerName`, gdy tekst promptu odnosi się do nazwanego mówcy.

Gemini API TTS akceptuje także ekspresyjne znaczniki audio w nawiasach kwadratowych w tekście,
takie jak `[whispers]` lub `[laughs]`. Aby ukryć znaczniki w widocznej odpowiedzi czatu,
a jednocześnie wysłać je do TTS, umieść je w bloku `[[tts:text]]...[[/tts:text]]`:

```text
Tutaj znajduje się czysty tekst odpowiedzi.

[[tts:text]][whispers] Tutaj znajduje się wersja mówiona.[[/tts:text]]
```

<Note>
Klucz API Google Cloud Console ograniczony do Gemini API jest prawidłowy dla tego
dostawcy. Nie jest to osobna ścieżka Cloud Text-to-Speech API.
</Note>

## Głos w czasie rzeczywistym

Dołączona wtyczka `google` rejestruje dostawcę głosu w czasie rzeczywistym opartego na
Gemini Live API dla mostów audio backendu, takich jak Voice Call i Google Meet.

| Ustawienie            | Ścieżka konfiguracji                                                | Domyślnie                                                                             |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Głos                  | `...google.voice`                                                   | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                             | (nieustawione)                                                                        |
| Czułość początku VAD  | `...google.startSensitivity`                                        | (nieustawione)                                                                        |
| Czułość końca VAD     | `...google.endSensitivity`                                          | (nieustawione)                                                                        |
| Czas ciszy            | `...google.silenceDurationMs`                                       | (nieustawione)                                                                        |
| Klucz API             | `...google.apiKey`                                                  | Używa `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY` jako wartości zapasowej |

Przykładowa konfiguracja Voice Call w czasie rzeczywistym:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API używa dwukierunkowego audio i wywoływania funkcji przez WebSocket.
OpenClaw dostosowuje dźwięk mostów telefonicznych/Meet do strumienia PCM Live API Gemini i
utrzymuje wywołania narzędzi w ramach współdzielonego kontraktu głosu w czasie rzeczywistym. Pozostaw `temperature`
nieustawione, chyba że potrzebujesz zmian próbkowania; OpenClaw pomija wartości niedodatnie,
ponieważ Google Live może zwracać transkrypcje bez audio dla `temperature: 0`.
Transkrypcja Gemini API jest włączona bez `languageCodes`; bieżący SDK Google
odrzuca podpowiedzi kodów językowych na tej ścieżce API.
</Note>

<Note>
Sesje przeglądarkowe Control UI Talk nadal wymagają dostawcy głosu w czasie rzeczywistym z
implementacją sesji WebRTC w przeglądarce. Obecnie tą ścieżką jest OpenAI Realtime; dostawca
Google jest przeznaczony dla mostów backendu w czasie rzeczywistym.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Bezpośrednie ponowne użycie pamięci podręcznej Gemini">
    W przypadku bezpośrednich uruchomień Gemini API (`api: "google-generative-ai"`), OpenClaw
    przekazuje skonfigurowany uchwyt `cachedContent` bezpośrednio do żądań Gemini.

    - Skonfiguruj parametry dla poszczególnych modeli lub globalnie przy użyciu
      `cachedContent` albo starszego `cached_content`
    - Jeśli obecne są oba, pierwszeństwo ma `cachedContent`
    - Przykładowa wartość: `cachedContents/prebuilt-context`
    - Użycie trafienia pamięci podręcznej Gemini jest normalizowane do OpenClaw `cacheRead` z
      nadrzędnego `cachedContentTokenCount`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Uwagi dotyczące użycia JSON Gemini CLI">
    Podczas używania dostawcy OAuth `google-gemini-cli`, OpenClaw normalizuje
    wyjście JSON CLI w następujący sposób:

    - Tekst odpowiedzi pochodzi z pola `response` JSON CLI.
    - Informacje o użyciu wracają do `stats`, gdy CLI pozostawia `usage` puste.
    - `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
    - Jeśli brakuje `stats.input`, OpenClaw wylicza tokeny wejściowe z
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Konfiguracja środowiska i demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `GEMINI_API_KEY`
    jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i mechanizmu failover.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Współdzielone parametry narzędzia muzyki i wybór dostawcy.
  </Card>
</CardGroup>
