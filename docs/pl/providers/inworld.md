---
read_when:
    - Chcesz syntezy mowy Inworld dla odpowiedzi wychodzących
    - Potrzebujesz wyjścia PCM telephony lub OGG_OPUS voice-note z Inworld
summary: Strumieniowe przetwarzanie tekstu na mowę Inworld dla odpowiedzi OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:39:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld to dostawca strumieniowego przetwarzania tekstu na mowę (TTS). W OpenClaw
syntetyzuje wychodzące audio odpowiedzi (domyślnie MP3, `OGG_OPUS` dla notatek głosowych)
oraz audio PCM dla kanałów telefonicznych, takich jak Voice Call.

OpenClaw wysyła żądanie do strumieniowego endpointu TTS Inworld, łączy
zwrócone fragmenty audio zakodowane w base64 w jeden bufor i przekazuje wynik
do standardowego pipeline audio odpowiedzi.

| Szczegół      | Wartość                                                     |
| ------------- | ----------------------------------------------------------- |
| Strona        | [inworld.ai](https://inworld.ai)                            |
| Dokumentacja  | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Auth          | `INWORLD_API_KEY` (HTTP Basic, poświadczenie dashboard w Base64) |
| Domyślny głos | `Sarah`                                                     |
| Domyślny model | `inworld-tts-1.5-max`                                      |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw swój klucz API">
    Skopiuj poświadczenie z dashboardu Inworld (Workspace > API Keys)
    i ustaw je jako zmienną env. Wartość jest wysyłana dosłownie jako poświadczenie HTTP Basic,
    więc nie koduj jej ponownie w Base64 i nie zamieniaj na token bearer.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Wybierz Inworld w messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Wyślij wiadomość">
    Wyślij odpowiedź przez dowolny podłączony kanał. OpenClaw zsyntetyzuje
    audio za pomocą Inworld i dostarczy je jako MP3 (lub `OGG_OPUS`, gdy kanał
    oczekuje notatki głosowej).
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja         | Ścieżka                                      | Opis                                                              |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Poświadczenie dashboard w Base64. Fallback do `INWORLD_API_KEY`.  |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Nadpisuje base URL API Inworld (domyślnie `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identyfikator głosu (domyślnie `Sarah`).                          |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Id modelu TTS (domyślnie `inworld-tts-1.5-max`).                  |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura samplingu `0..2` (opcjonalnie).                       |

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Inworld używa auth HTTP Basic z jednym ciągiem poświadczenia zakodowanym
    w Base64. Skopiuj go dosłownie z dashboardu Inworld. Dostawca wysyła
    go jako `Authorization: Basic <apiKey>` bez dalszego kodowania, więc
    nie koduj go samodzielnie w Base64 i nie przekazuj tokena w stylu bearer.
    Zobacz [TTS auth notes](/pl/tools/tts#inworld-primary), aby zobaczyć to samo wyjaśnienie.
  </Accordion>
  <Accordion title="Modele">
    Obsługiwane identyfikatory modeli: `inworld-tts-1.5-max` (domyślny),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Wyjścia audio">
    Odpowiedzi domyślnie używają MP3. Gdy docelowy kanał to `voice-note`,
    OpenClaw prosi Inworld o `OGG_OPUS`, aby audio było odtwarzane jako natywna
    bańka głosowa. Synteza telefoniczna używa surowego `PCM` przy 22050 Hz, aby zasilać
    mostek telefoniczny.
  </Accordion>
  <Accordion title="Niestandardowe endpointy">
    Nadpisz host API przez `messages.tts.providers.inworld.baseUrl`.
    Końcowe ukośniki są usuwane przed wysłaniem żądań.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/pl/tools/tts" icon="waveform-lines">
    Przegląd TTS, dostawcy i konfiguracja `messages.tts`.
  </Card>
  <Card title="Configuration" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawienia `messages.tts`.
  </Card>
  <Card title="Providers" href="/pl/providers" icon="grid">
    Wszyscy dołączeni dostawcy OpenClaw.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
</CardGroup>
