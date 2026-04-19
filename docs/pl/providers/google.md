---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw
    - Potrzebujesz przepływu uwierzytelniania za pomocą klucza API lub OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie multimediów, TTS, wyszukiwanie w sieci)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-19T01:11:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Plugin Google zapewnia dostęp do modeli Gemini przez Google AI Studio, a także do
generowania obrazów, rozumienia multimediów (obraz/audio/wideo), zamiany tekstu na mowę oraz wyszukiwania w sieci przez
Gemini Grounding.

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternatywny dostawca: `google-gemini-cli` (OAuth)

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
    **Najlepsze dla:** użycia istniejącego logowania Gemini CLI przez PKCE OAuth zamiast osobnego klucza API.

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

        OpenClaw obsługuje zarówno instalacje przez Homebrew, jak i globalne instalacje npm, w tym
        typowe układy Windows/npm.
      </Step>
      <Step title="Zaloguj się przez OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Model domyślny: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Zmienne środowiskowe:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Lub warianty `GEMINI_CLI_*`.)

    <Note>
    Jeśli żądania Gemini CLI OAuth kończą się niepowodzeniem po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub
    `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway i spróbuj ponownie.
    </Note>

    <Note>
    Jeśli logowanie kończy się niepowodzeniem, zanim uruchomi się przepływ w przeglądarce, upewnij się, że lokalne polecenie `gemini`
    jest zainstalowane i dostępne w `PATH`.
    </Note>

    Dostawca `google-gemini-cli`, działający wyłącznie przez OAuth, to oddzielna powierzchnia
    inferencji tekstu. Generowanie obrazów, rozumienie multimediów i Gemini Grounding pozostają przy
    identyfikatorze dostawcy `google`.

  </Tab>
</Tabs>

## Możliwości

| Możliwość              | Obsługiwane                  |
| ---------------------- | ---------------------------- |
| Uzupełnianie czatu     | Tak                          |
| Generowanie obrazów    | Tak                          |
| Generowanie muzyki     | Tak                          |
| Zamiana tekstu na mowę | Tak                          |
| Rozumienie obrazów     | Tak                          |
| Transkrypcja audio     | Tak                          |
| Rozumienie wideo       | Tak                          |
| Wyszukiwanie w sieci (Grounding) | Tak                |
| Myślenie/wnioskowanie  | Tak (Gemini 2.5+ / Gemini 3+) |
| Modele Gemma 4         | Tak                          |

<Tip>
Modele Gemini 3 używają `thinkingLevel` zamiast `thinkingBudget`. OpenClaw mapuje
kontrolki wnioskowania dla Gemini 3, Gemini 3.1 i aliasu `gemini-*-latest` na
`thinkingLevel`, aby domyślne przebiegi i przebiegi o niskich opóźnieniach nie wysyłały wyłączonych
wartości `thinkingBudget`.

Modele Gemma 4 (na przykład `gemma-4-26b-a4b-it`) obsługują tryb myślenia. OpenClaw
przepisuje `thinkingBudget` na obsługiwany przez Google `thinkingLevel` dla Gemma 4.
Ustawienie myślenia na `off` zachowuje wyłączone myślenie zamiast mapowania na
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
Zobacz [Image Generation](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Generowanie wideo

Dołączony Plugin `google` rejestruje także generowanie wideo przez współdzielone
narzędzie `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: text-to-video, image-to-video i przepływy z pojedynczym referencyjnym wideo
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
Zobacz [Video Generation](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Generowanie muzyki

Dołączony Plugin `google` rejestruje także generowanie muzyki przez współdzielone
narzędzie `music_generate`.

- Domyślny model muzyczny: `google/lyria-3-clip-preview`
- Obsługuje także `google/lyria-3-pro-preview`
- Kontrolki promptu: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, a także `wav` w `google/lyria-3-pro-preview`
- Wejścia referencyjne: do 10 obrazów
- Przebiegi oparte na sesjach są odłączane przez współdzielony przepływ zadania/statusu, w tym `action: "status"`

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
Zobacz [Music Generation](/pl/tools/music-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Zamiana tekstu na mowę

Dołączony dostawca mowy `google` używa ścieżki TTS Gemini API z
`gemini-3.1-flash-tts-preview`.

- Głos domyślny: `Kore`
- Uwierzytelnianie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- Wyjście: WAV dla zwykłych załączników TTS, PCM dla Talk/telefonii
- Natywne wyjście notatek głosowych: nieobsługiwane w tej ścieżce Gemini API, ponieważ API zwraca PCM zamiast Opus

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
        },
      },
    },
  },
}
```

TTS Gemini API akceptuje ekspresyjne znaczniki audio w nawiasach kwadratowych w tekście, takie jak
`[whispers]` lub `[laughs]`. Aby ukryć znaczniki w widocznej odpowiedzi czatu, a jednocześnie
wysłać je do TTS, umieść je w bloku `[[tts:text]]...[[/tts:text]]`:

```text
Oto czysty tekst odpowiedzi.

[[tts:text]][whispers] Oto wersja mówiona.[[/tts:text]]
```

<Note>
Klucz API Google Cloud Console ograniczony do Gemini API jest prawidłowy dla tego
dostawcy. To nie jest osobna ścieżka Cloud Text-to-Speech API.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Bezpośrednie ponowne użycie pamięci podręcznej Gemini">
    W przypadku bezpośrednich przebiegów Gemini API (`api: "google-generative-ai"`), OpenClaw
    przekazuje skonfigurowany uchwyt `cachedContent` do żądań Gemini.

    - Skonfiguruj parametry dla modelu lub globalne za pomocą
      `cachedContent` albo starszego `cached_content`
    - Jeśli obecne są oba, pierwszeństwo ma `cachedContent`
    - Przykładowa wartość: `cachedContents/prebuilt-context`
    - Użycie trafień pamięci podręcznej Gemini jest normalizowane do OpenClaw `cacheRead` z
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

  <Accordion title="Uwagi dotyczące użycia JSON w Gemini CLI">
    Podczas korzystania z dostawcy OAuth `google-gemini-cli` OpenClaw normalizuje
    wyjście JSON CLI w następujący sposób:

    - Tekst odpowiedzi pochodzi z pola `response` w JSON CLI.
    - Użycie przechodzi awaryjnie na `stats`, gdy CLI pozostawia `usage` puste.
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
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Wspólne parametry narzędzia muzycznego i wybór dostawcy.
  </Card>
</CardGroup>
