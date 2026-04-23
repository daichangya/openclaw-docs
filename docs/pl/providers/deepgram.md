---
read_when:
    - Chcesz używać Deepgram speech-to-text dla załączników audio
    - Chcesz używać transkrypcji strumieniowej Deepgram dla Voice Call
    - Potrzebujesz szybkiego przykładu konfiguracji Deepgram
summary: Transkrypcja Deepgram dla przychodzących notatek głosowych
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T10:07:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (transkrypcja audio)

Deepgram to API speech-to-text. W OpenClaw jest używane do transkrypcji
przychodzących plików audio/notatek głosowych przez `tools.media.audio` oraz do
strumieniowego STT w Voice Call przez `plugins.entries.voice-call.config.streaming`.

W przypadku transkrypcji wsadowej OpenClaw przesyła cały plik audio do Deepgram
i wstrzykuje transkrypcję do potoku odpowiedzi (`{{Transcript}}` +
blok `[Audio]`). W przypadku strumieniowania Voice Call OpenClaw przekazuje na żywo ramki G.711
u-law przez endpoint WebSocket `listen` Deepgram i emituje częściowe lub
końcowe transkrypcje w miarę zwracania ich przez Deepgram.

| Szczegół       | Wartość                                                    |
| -------------- | ---------------------------------------------------------- |
| Strona         | [deepgram.com](https://deepgram.com)                       |
| Dokumentacja   | [developers.deepgram.com](https://developers.deepgram.com) |
| Uwierzytelnianie | `DEEPGRAM_API_KEY`                                       |
| Model domyślny | `nova-3`                                                   |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Dodaj klucz API Deepgram do środowiska:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Włącz dostawcę audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Wyślij notatkę głosową">
    Wyślij wiadomość audio przez dowolny podłączony kanał. OpenClaw przetranskrybuje ją
    przez Deepgram i wstrzyknie transkrypcję do potoku odpowiedzi.
  </Step>
</Steps>

## Opcje konfiguracji

| Opcja             | Ścieżka                                                     | Opis                                  |
| ----------------- | ----------------------------------------------------------- | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                          | Identyfikator modelu Deepgram (domyślnie: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                       | Wskazówka językowa (opcjonalna)       |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Włącza wykrywanie języka (opcjonalne) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`      | Włącza interpunkcję (opcjonalne)      |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`   | Włącza inteligentne formatowanie (opcjonalne) |

<Tabs>
  <Tab title="Ze wskazówką językową">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Z opcjami Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Strumieniowe STT dla Voice Call

Bundled Plugin `deepgram` rejestruje również dostawcę transkrypcji realtime
dla Pluginu Voice Call.

| Ustawienie       | Ścieżka konfiguracji                                                   | Domyślnie                        |
| ---------------- | ---------------------------------------------------------------------- | -------------------------------- |
| Klucz API        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Wraca do `DEEPGRAM_API_KEY`      |
| Model            | `...deepgram.model`                                                    | `nova-3`                         |
| Język            | `...deepgram.language`                                                 | (nieustawione)                   |
| Kodowanie        | `...deepgram.encoding`                                                 | `mulaw`                          |
| Częstotliwość próbkowania | `...deepgram.sampleRate`                                      | `8000`                           |
| Endpointing      | `...deepgram.endpointingMs`                                            | `800`                            |
| Wyniki pośrednie | `...deepgram.interimResults`                                           | `true`                           |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call odbiera dźwięk telefoniczny jako 8 kHz G.711 u-law. Dostawca
strumieniowania Deepgram domyślnie używa `encoding: "mulaw"` i `sampleRate: 8000`, więc
ramki multimedialne Twilio mogą być przekazywane bezpośrednio.
</Note>

## Uwagi

<AccordionGroup>
  <Accordion title="Uwierzytelnianie">
    Uwierzytelnianie przebiega zgodnie ze standardową kolejnością uwierzytelniania dostawców. `DEEPGRAM_API_KEY` to
    najprostsza ścieżka.
  </Accordion>
  <Accordion title="Proxy i niestandardowe endpointy">
    Nadpisz endpointy lub nagłówki za pomocą `tools.media.audio.baseUrl` i
    `tools.media.audio.headers`, gdy używasz proxy.
  </Accordion>
  <Accordion title="Zachowanie wyjścia">
    Wyjście podlega tym samym regułom audio co u innych dostawców (limity rozmiaru, timeouty,
    wstrzykiwanie transkrypcji).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzia multimedialne" href="/pl/tools/media-overview" icon="photo-film">
    Przegląd potoku przetwarzania audio, obrazów i wideo.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji, w tym ustawień narzędzi multimedialnych.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
  <Card title="FAQ" href="/pl/help/faq" icon="circle-question">
    Często zadawane pytania dotyczące konfiguracji OpenClaw.
  </Card>
</CardGroup>
