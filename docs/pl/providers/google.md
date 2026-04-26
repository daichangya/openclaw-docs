---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw
    - Potrzebujesz klucza API lub przepływu uwierzytelniania OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie mediów, TTS, wyszukiwanie w sieci)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-26T11:39:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

Plugin Google udostępnia dostęp do modeli Gemini przez Google AI Studio, a także
generowanie obrazów, rozumienie mediów (obrazy/audio/wideo), zamianę tekstu na mowę oraz wyszukiwanie w sieci przez
Gemini Grounding.

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- API: Google Gemini API
- Opcja środowiska uruchomieniowego: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  ponownie wykorzystuje OAuth Gemini CLI, zachowując kanoniczne odwołania do modeli jako `google/*`.

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze dla:** standardowego dostępu do Gemini API przez Google AI Studio.

    <Steps>
      <Step title="Uruchom onboarding">
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
      <Step title="Ustaw model domyślny">
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
    Zmienne środowiskowe `GEMINI_API_KEY` i `GOOGLE_API_KEY` są obie obsługiwane. Użyj tej, którą masz już skonfigurowaną.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Najlepsze dla:** ponownego wykorzystania istniejącego logowania Gemini CLI przez PKCE OAuth zamiast osobnego klucza API.

    <Warning>
    Dostawca `google-gemini-cli` jest nieoficjalną integracją. Niektórzy użytkownicy
    zgłaszają ograniczenia konta przy takim użyciu OAuth. Używasz na własne ryzyko.
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

    - Model domyślny: `google/gemini-3.1-pro-preview`
    - Środowisko uruchomieniowe: `google-gemini-cli`
    - Alias: `gemini-cli`

    **Zmienne środowiskowe:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Lub warianty `GEMINI_CLI_*`.)

    <Note>
    Jeśli żądania OAuth Gemini CLI po zalogowaniu kończą się niepowodzeniem, ustaw `GOOGLE_CLOUD_PROJECT` lub
    `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway i spróbuj ponownie.
    </Note>

    <Note>
    Jeśli logowanie kończy się niepowodzeniem przed rozpoczęciem przepływu w przeglądarce, upewnij się, że lokalne polecenie `gemini`
    jest zainstalowane i znajduje się w `PATH`.
    </Note>

    Odwołania do modeli `google-gemini-cli/*` są aliasami zgodności ze starszymi wersjami. Nowe
    konfiguracje powinny używać odwołań do modeli `google/*` oraz środowiska uruchomieniowego `google-gemini-cli`,
    gdy potrzebne jest lokalne wykonanie Gemini CLI.

  </Tab>
</Tabs>

## Możliwości

| Możliwość             | Obsługiwane                    |
| --------------------- | ------------------------------ |
| Uzupełnianie czatu    | Tak                            |
| Generowanie obrazów   | Tak                            |
| Generowanie muzyki    | Tak                            |
| Zamiana tekstu na mowę| Tak                            |
| Głos w czasie rzeczywistym | Tak (Google Live API)    |
| Rozumienie obrazów    | Tak                            |
| Transkrypcja audio    | Tak                            |
| Rozumienie wideo      | Tak                            |
| Wyszukiwanie w sieci (Grounding) | Tak                 |
| Myślenie/rozumowanie  | Tak (Gemini 2.5+ / Gemini 3+)  |
| Modele Gemma 4        | Tak                            |

<Tip>
Modele Gemini 3 używają `thinkingLevel` zamiast `thinkingBudget`. OpenClaw mapuje
kontrolki rozumowania Gemini 3, Gemini 3.1 i aliasów `gemini-*-latest` do
`thinkingLevel`, aby domyślne uruchomienia i uruchomienia o niskim opóźnieniu nie wysyłały wyłączonych
wartości `thinkingBudget`.

`/think adaptive` zachowuje dynamiczną semantykę myślenia Google zamiast wybierać
stały poziom OpenClaw. Gemini 3 i Gemini 3.1 pomijają stałe `thinkingLevel`, więc
Google może wybrać poziom; Gemini 2.5 wysyła dynamiczny znacznik Google
`thinkingBudget: -1`.

Modele Gemma 4 (na przykład `gemma-4-26b-a4b-it`) obsługują tryb myślenia. OpenClaw
przepisuje `thinkingBudget` na obsługiwane przez Google `thinkingLevel` dla Gemma 4.
Ustawienie myślenia na `off` zachowuje wyłączenie myślenia zamiast mapowania do
`MINIMAL`.
</Tip>

## Generowanie obrazów

Dołączony dostawca generowania obrazów `google` domyślnie używa
`google/gemini-3.1-flash-image-preview`.

- Obsługuje także `google/gemini-3-pro-image-preview`
- Generowanie: do 4 obrazów na żądanie
- Tryb edycji: włączony, do 5 obrazów wejściowych
- Kontrola geometrii: `size`, `aspectRatio` i `resolution`

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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie awaryjne.
</Note>

## Generowanie wideo

Dołączony Plugin `google` rejestruje również generowanie wideo przez współdzielone
narzędzie `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: tekst-na-wideo, obraz-na-wideo i przepływy z pojedynczym referencyjnym wideo
- Obsługuje `aspectRatio`, `resolution` i `audio`
- Bieżące ograniczenie długości: **4 do 8 sekund**

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie awaryjne.
</Note>

## Generowanie muzyki

Dołączony Plugin `google` rejestruje również generowanie muzyki przez współdzielone
narzędzie `music_generate`.

- Domyślny model muzyczny: `google/lyria-3-clip-preview`
- Obsługuje także `google/lyria-3-pro-preview`
- Kontrolki promptu: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, a także `wav` dla `google/lyria-3-pro-preview`
- Wejścia referencyjne: do 10 obrazów
- Uruchomienia oparte na sesji są odłączane przez współdzielony przepływ zadania/statusu, w tym `action: "status"`

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
Zobacz [Generowanie muzyki](/pl/tools/music-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie awaryjne.
</Note>

## Zamiana tekstu na mowę

Dołączony dostawca mowy `google` używa ścieżki TTS Gemini API z
`gemini-3.1-flash-tts-preview`.

- Domyślny głos: `Kore`
- Uwierzytelnianie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- Wyjście: WAV dla zwykłych załączników TTS, Opus dla celów notatek głosowych, PCM dla Talk/telefonii
- Wyjście notatek głosowych: Google PCM jest opakowywany jako WAV i transkodowany do 48 kHz Opus przy użyciu `ffmpeg`

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
          audioProfile: "Mów profesjonalnie, spokojnym tonem.",
        },
      },
    },
  },
}
```

TTS Gemini API używa promptów w języku naturalnym do kontroli stylu. Ustaw
`audioProfile`, aby dodać wielokrotnego użytku prompt stylu przed wypowiadanym tekstem. Ustaw
`speakerName`, gdy tekst promptu odnosi się do nazwanego mówcy.

TTS Gemini API akceptuje również ekspresyjne kwadratowe znaczniki audio w tekście,
takie jak `[whispers]` lub `[laughs]`. Aby ukryć znaczniki w widocznej odpowiedzi czatu,
a jednocześnie przekazać je do TTS, umieść je w bloku `[[tts:text]]...[[/tts:text]]`:

```text
Tutaj znajduje się czysta odpowiedź tekstowa.

[[tts:text]][whispers] Tutaj znajduje się wersja mówiona.[[/tts:text]]
```

<Note>
Klucz API Google Cloud Console ograniczony do Gemini API jest prawidłowy dla tego
dostawcy. Nie jest to osobna ścieżka Cloud Text-to-Speech API.
</Note>

## Głos w czasie rzeczywistym

Dołączony Plugin `google` rejestruje dostawcę głosu w czasie rzeczywistym opartego na
Gemini Live API dla backendowych mostków audio, takich jak Voice Call i Google Meet.

| Ustawienie            | Ścieżka konfiguracji                                                | Domyślnie                                                                           |
| --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                     |
| Głos                  | `...google.voice`                                                   | `Kore`                                                                              |
| Temperature           | `...google.temperature`                                             | (nieustawione)                                                                      |
| Czułość startu VAD    | `...google.startSensitivity`                                        | (nieustawione)                                                                      |
| Czułość końca VAD     | `...google.endSensitivity`                                          | (nieustawione)                                                                      |
| Czas trwania ciszy    | `...google.silenceDurationMs`                                       | (nieustawione)                                                                      |
| Klucz API             | `...google.apiKey`                                                  | Korzysta awaryjnie z `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY` |

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
Google Live API używa dźwięku dwukierunkowego i wywołań funkcji przez Webhook.
OpenClaw dostosowuje dźwięk mostków telefonicznych/Meet do strumienia PCM Live API Gemini i
utrzymuje wywołania narzędzi we współdzielonym kontrakcie głosu czasu rzeczywistego. Pozostaw `temperature`
nieustawione, chyba że potrzebujesz zmian próbkowania; OpenClaw pomija wartości niedodatnie,
ponieważ Google Live może zwracać transkrypcje bez audio dla `temperature: 0`.
Transkrypcja Gemini API jest włączona bez `languageCodes`; bieżący SDK Google
odrzuca podpowiedzi kodów językowych na tej ścieżce API.
</Note>

<Note>
Sesje przeglądarkowe Talk w interfejsie Control UI nadal wymagają dostawcy głosu czasu rzeczywistego z
implementacją sesji WebRTC w przeglądarce. Obecnie tą ścieżką jest OpenAI Realtime; dostawca
Google jest przeznaczony dla backendowych mostków czasu rzeczywistego.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Bezpośrednie ponowne użycie cache Gemini">
    Dla bezpośrednich uruchomień Gemini API (`api: "google-generative-ai"`), OpenClaw
    przekazuje skonfigurowany uchwyt `cachedContent` do żądań Gemini.

    - Skonfiguruj parametry per model lub globalnie przy użyciu
      `cachedContent` albo starszego `cached_content`
    - Jeśli obecne są oba, wygrywa `cachedContent`
    - Przykładowa wartość: `cachedContents/prebuilt-context`
    - Użycie trafienia cache Gemini jest normalizowane do OpenClaw `cacheRead` z
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

  <Accordion title="Uwagi o użyciu JSON Gemini CLI">
    Przy użyciu dostawcy OAuth `google-gemini-cli` OpenClaw normalizuje
    wyjście JSON CLI w następujący sposób:

    - Tekst odpowiedzi pochodzi z pola JSON CLI `response`.
    - Użycie korzysta awaryjnie z `stats`, gdy CLI pozostawia `usage` puste.
    - `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
    - Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Konfiguracja środowiska i demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `GEMINI_API_KEY`
    jest dostępne dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Wspólne parametry narzędzia muzyki i wybór dostawcy.
  </Card>
</CardGroup>
