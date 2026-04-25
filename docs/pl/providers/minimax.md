---
read_when:
    - Chcesz używać modeli MiniMax w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji MiniMax
summary: Używanie modeli MiniMax w OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

Domyślny provider MiniMax w OpenClaw używa **MiniMax M2.7**.

MiniMax udostępnia także:

- Dołączoną syntezę mowy przez T2A v2
- Dołączone rozumienie obrazów przez `MiniMax-VL-01`
- Dołączone generowanie muzyki przez `music-2.6`
- Dołączone `web_search` przez API wyszukiwania MiniMax Coding Plan

Podział providerów:

| Identyfikator providera | Auth    | Możliwości                                                      |
| ----------------------- | ------- | --------------------------------------------------------------- |
| `minimax`               | Klucz API | Tekst, generowanie obrazów, rozumienie obrazów, mowa, web search |
| `minimax-portal`        | OAuth   | Tekst, generowanie obrazów, rozumienie obrazów, mowa             |

## Wbudowany katalog

| Model                    | Typ              | Opis                                      |
| ------------------------ | ---------------- | ----------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Domyślny hostowany model reasoning        |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Szybszy poziom reasoning M2.7             |
| `MiniMax-VL-01`          | Vision           | Model rozumienia obrazów                  |
| `image-01`               | Image generation | Tekst-na-obraz i edycja obraz-obraz       |
| `music-2.6`              | Music generation | Domyślny model muzyczny                   |
| `music-2.5`              | Music generation | Poprzedni poziom generowania muzyki       |
| `music-2.0`              | Music generation | Starszy poziom generowania muzyki         |
| `MiniMax-Hailuo-2.3`     | Video generation | Przepływy tekst-na-wideo i odniesienia do obrazu |

## Pierwsze kroki

Wybierz preferowaną metodę auth i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Najlepsze dla:** szybkiej konfiguracji z MiniMax Coding Plan przez OAuth, bez wymaganego klucza API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Uruchom onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            To uwierzytelnia względem `api.minimax.io`.
          </Step>
          <Step title="Sprawdź, czy model jest dostępny">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Uruchom onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            To uwierzytelnia względem `api.minimaxi.com`.
          </Step>
          <Step title="Sprawdź, czy model jest dostępny">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Konfiguracje OAuth używają identyfikatora providera `minimax-portal`. Referencje modeli mają postać `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Klucz API">
    **Najlepsze dla:** hostowanego MiniMax z API zgodnym z Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Uruchom onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            To konfiguruje `api.minimax.io` jako `baseUrl`.
          </Step>
          <Step title="Sprawdź, czy model jest dostępny">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Uruchom onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            To konfiguruje `api.minimaxi.com` jako `baseUrl`.
          </Step>
          <Step title="Sprawdź, czy model jest dostępny">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Przykład konfiguracji

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Na ścieżce streamingu zgodnej z Anthropic OpenClaw domyślnie wyłącza myślenie MiniMax, chyba że jawnie ustawisz `thinking`. Endpoint streamingu MiniMax emituje `reasoning_content` w kawałkach delta w stylu OpenAI zamiast natywnych bloków myślenia Anthropic, co może ujawniać wewnętrzne rozumowanie w widocznym wyniku, jeśli pozostanie niejawnie włączone.
    </Warning>

    <Note>
    Konfiguracje z kluczem API używają identyfikatora providera `minimax`. Referencje modeli mają postać `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Konfiguracja przez `openclaw configure`

Użyj interaktywnego kreatora konfiguracji, aby ustawić MiniMax bez edycji JSON:

<Steps>
  <Step title="Uruchom kreator">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Wybierz Model/auth">
    Wybierz z menu **Model/auth**.
  </Step>
  <Step title="Wybierz opcję auth MiniMax">
    Wybierz jedną z dostępnych opcji MiniMax:

    | Wybór auth | Opis |
    | --- | --- |
    | `minimax-global-oauth` | Międzynarodowy OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China OAuth (Coding Plan) |
    | `minimax-global-api` | Międzynarodowy klucz API |
    | `minimax-cn-api` | China klucz API |

  </Step>
  <Step title="Wybierz swój model domyślny">
    Po wyświetleniu promptu wybierz swój model domyślny.
  </Step>
</Steps>

## Możliwości

### Generowanie obrazów

Plugin MiniMax rejestruje model `image-01` dla narzędzia `image_generate`. Obsługuje on:

- **Generowanie tekst-na-obraz** z kontrolą proporcji
- **Edycję obraz-obraz** (odniesienie do obiektu) z kontrolą proporcji
- Do **9 obrazów wyjściowych** na żądanie
- Do **1 obrazu referencyjnego** na żądanie edycji
- Obsługiwane proporcje: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Aby używać MiniMax do generowania obrazów, ustaw go jako providera generowania obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin używa tego samego `MINIMAX_API_KEY` albo auth OAuth co modele tekstowe. Jeśli MiniMax jest już skonfigurowany, nie jest wymagana żadna dodatkowa konfiguracja.

Zarówno `minimax`, jak i `minimax-portal` rejestrują `image_generate` z tym samym
modelem `image-01`. Konfiguracje z kluczem API używają `MINIMAX_API_KEY`; konfiguracje OAuth mogą zamiast tego używać
dołączonej ścieżki auth `minimax-portal`.

Gdy onboarding albo konfiguracja z kluczem API zapisuje jawne wpisy `models.providers.minimax`,
OpenClaw materializuje `MiniMax-M2.7` i
`MiniMax-M2.7-highspeed` jako modele czatu tylko tekstowego. Rozumienie obrazów jest
ujawniane osobno przez należącego do Plugin providera mediów `MiniMax-VL-01`.

<Note>
Wspólne parametry narzędzia, wybór providera i zachowanie failover: [Image Generation](/pl/tools/image-generation).
</Note>

### Text-to-speech

Dołączony Plugin `minimax` rejestruje MiniMax T2A v2 jako providera mowy dla
`messages.tts`.

- Domyślny model TTS: `speech-2.8-hd`
- Domyślny głos: `English_expressive_narrator`
- Obsługiwane dołączone identyfikatory modeli obejmują `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` i `speech-01-turbo`.
- Rozwiązywanie auth odbywa się w kolejności: `messages.tts.providers.minimax.apiKey`, następnie
  profile auth OAuth/token `minimax-portal`, następnie klucze środowiskowe Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), a na końcu `MINIMAX_API_KEY`.
- Jeśli nie skonfigurowano hosta TTS, OpenClaw ponownie używa skonfigurowanego
  hosta OAuth `minimax-portal` i usuwa sufiksy ścieżki zgodne z Anthropic,
  takie jak `/anthropic`.
- Zwykłe załączniki audio pozostają w formacie MP3.
- Cele notatek głosowych, takie jak Feishu i Telegram, są transkodowane z MiniMax
  MP3 do 48kHz Opus przez `ffmpeg`, ponieważ API plików Feishu/Lark akceptuje
  tylko `file_type: "opus"` dla natywnych wiadomości audio.
- MiniMax T2A akceptuje ułamkowe `speed` i `vol`, ale `pitch` jest wysyłane jako
  liczba całkowita; OpenClaw obcina ułamkowe wartości `pitch` przed wysłaniem żądania do API.

| Ustawienie                               | Zmienna env            | Domyślnie                     | Opis                              |
| ---------------------------------------- | ---------------------- | ----------------------------- | --------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.             |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Identyfikator modelu TTS.         |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Identyfikator głosu używany do wyjścia mowy. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Prędkość odtwarzania, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Głośność, `(0, 10]`.              |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Całkowite przesunięcie wysokości, `-12..12`. |

### Generowanie muzyki

Dołączony Plugin `minimax` rejestruje także generowanie muzyki przez współdzielone
narzędzie `music_generate`.

- Domyślny model muzyczny: `minimax/music-2.6`
- Obsługuje także `minimax/music-2.5` i `minimax/music-2.0`
- Kontrolki promptu: `lyrics`, `instrumental`, `durationSeconds`
- Format wyjściowy: `mp3`
- Uruchomienia oparte na sesji odpinają się przez współdzielony przepływ task/status, w tym `action: "status"`

Aby używać MiniMax jako domyślnego providera muzyki:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Wspólne parametry narzędzia, wybór providera i zachowanie failover: [Music Generation](/pl/tools/music-generation).
</Note>

### Generowanie wideo

Dołączony Plugin `minimax` rejestruje także generowanie wideo przez współdzielone
narzędzie `video_generate`.

- Domyślny model wideo: `minimax/MiniMax-Hailuo-2.3`
- Tryby: tekst-na-wideo i przepływy z pojedynczym obrazem referencyjnym
- Obsługuje `aspectRatio` i `resolution`

Aby używać MiniMax jako domyślnego providera wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Wspólne parametry narzędzia, wybór providera i zachowanie failover: [Video Generation](/pl/tools/video-generation).
</Note>

### Rozumienie obrazów

Plugin MiniMax rejestruje rozumienie obrazów oddzielnie od katalogu
tekstowego:

| Identyfikator providera | Domyślny model obrazu |
| ----------------------- | --------------------- |
| `minimax`               | `MiniMax-VL-01`       |
| `minimax-portal`        | `MiniMax-VL-01`       |

Dlatego automatyczny routing mediów może używać rozumienia obrazów MiniMax nawet
wtedy, gdy dołączony katalog providera tekstowego nadal pokazuje tylko tekstowe referencje czatu M2.7.

### Web search

Plugin MiniMax rejestruje także `web_search` przez API wyszukiwania MiniMax Coding Plan.

- Identyfikator providera: `minimax`
- Wyniki ustrukturyzowane: tytuły, URL-e, snippety, powiązane zapytania
- Preferowana zmienna env: `MINIMAX_CODE_PLAN_KEY`
- Akceptowany alias env: `MINIMAX_CODING_API_KEY`
- Fallback zgodności: `MINIMAX_API_KEY`, gdy już wskazuje token coding-plan
- Ponowne użycie regionu: `plugins.entries.minimax.config.webSearch.region`, następnie `MINIMAX_API_HOST`, a następnie base URL-e providera MiniMax
- Wyszukiwanie pozostaje na identyfikatorze providera `minimax`; konfiguracja OAuth CN/global może nadal pośrednio sterować regionem przez `models.providers.minimax-portal.baseUrl`

Konfiguracja znajduje się pod `plugins.entries.minimax.config.webSearch.*`.

<Note>
Pełna konfiguracja i użycie web search: [MiniMax Search](/pl/tools/minimax-search).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Opcje konfiguracji">
    | Opcja | Opis |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferuj `https://api.minimax.io/anthropic` (zgodne z Anthropic); `https://api.minimax.io/v1` jest opcjonalne dla payloadów zgodnych z OpenAI |
    | `models.providers.minimax.api` | Preferuj `anthropic-messages`; `openai-completions` jest opcjonalne dla payloadów zgodnych z OpenAI |
    | `models.providers.minimax.apiKey` | Klucz API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definiuje `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Nadaje aliasy modelom, które chcesz mieć w allowliście |
    | `models.mode` | Zachowaj `merge`, jeśli chcesz dodać MiniMax obok wbudowanych |
  </Accordion>

  <Accordion title="Domyślne myślenie">
    Przy `api: "anthropic-messages"` OpenClaw wstrzykuje `thinking: { type: "disabled" }`, chyba że myślenie jest już jawnie ustawione w params/config.

    Zapobiega to emitowaniu przez endpoint streamingu MiniMax `reasoning_content` w kawałkach delta w stylu OpenAI, co ujawniłoby wewnętrzne rozumowanie w widocznym wyniku.

  </Accordion>

  <Accordion title="Tryb fast">
    `/fast on` lub `params.fastMode: true` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed` na ścieżce streamu zgodnej z Anthropic.
  </Accordion>

  <Accordion title="Przykład fallbacku">
    **Najlepsze dla:** utrzymania najsilniejszego najnowszej generacji modelu jako primary i przejścia awaryjnego na MiniMax M2.7. Poniższy przykład używa Opus jako konkretnego primary; podmień na preferowany główny model najnowszej generacji.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Szczegóły użycia Coding Plan">
    - API użycia Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (wymaga klucza coding plan).
    - OpenClaw normalizuje użycie coding-plan MiniMax do tego samego wyświetlania `% left`, którego używają inni providerzy. Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit, a nie zużyty limit, więc OpenClaw je odwraca. Gdy są dostępne, pierwszeństwo mają pola oparte na licznikach.
    - Gdy API zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, wyprowadza etykietę okna z `start_time` / `end_time`, gdy to potrzebne, i uwzględnia nazwę wybranego modelu w etykiecie planu, aby łatwiej odróżniać okna coding-plan.
    - Migawki użycia traktują `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitu MiniMax i preferują zapisane MiniMax OAuth przed fallbackiem do zmiennych env klucza Coding Plan.
  </Accordion>
</AccordionGroup>

## Uwagi

- Referencje modeli zależą od ścieżki auth:
  - konfiguracja z kluczem API: `minimax/<model>`
  - konfiguracja OAuth: `minimax-portal/<model>`
- Domyślny model czatu: `MiniMax-M2.7`
- Alternatywny model czatu: `MiniMax-M2.7-highspeed`
- Onboarding i bezpośrednia konfiguracja z kluczem API zapisują definicje modeli tylko tekstowych dla obu wariantów M2.7
- Rozumienie obrazów używa należącego do Plugin providera mediów `MiniMax-VL-01`
- Zaktualizuj wartości cenowe w `models.json`, jeśli potrzebujesz dokładnego śledzenia kosztów
- Użyj `openclaw models list`, aby potwierdzić bieżący identyfikator providera, a następnie przełącz przez `openclaw models set minimax/MiniMax-M2.7` lub `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Reguły providerów: [Model providers](/pl/concepts/model-providers).
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Zwykle oznacza to, że **provider MiniMax nie jest skonfigurowany** (brak pasującego wpisu providera i brak profilu auth/env key dla MiniMax). Poprawka dla tego wykrywania znajduje się w **2026.1.12**. Napraw to przez:

    - aktualizację do **2026.1.12** (albo uruchomienie ze źródeł `main`), a następnie restart gateway
    - uruchomienie `openclaw configure` i wybranie opcji auth **MiniMax**, albo
    - ręczne dodanie pasującego bloku `models.providers.minimax` lub `models.providers.minimax-portal`, albo
    - ustawienie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` albo profilu auth MiniMax, aby można było wstrzyknąć pasującego providera

    Upewnij się, że identyfikator modelu jest **wrażliwy na wielkość liter**:

    - ścieżka z kluczem API: `minimax/MiniMax-M2.7` albo `minimax/MiniMax-M2.7-highspeed`
    - ścieżka OAuth: `minimax-portal/MiniMax-M2.7` albo `minimax-portal/MiniMax-M2.7-highspeed`

    Następnie sprawdź ponownie:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Troubleshooting](/pl/help/troubleshooting) oraz [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazu i wybór providera.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Wspólne parametry narzędzia muzyki i wybór providera.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór providera.
  </Card>
  <Card title="MiniMax Search" href="/pl/tools/minimax-search" icon="magnifying-glass">
    Konfiguracja web search przez MiniMax Coding Plan.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
