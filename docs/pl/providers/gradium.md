---
read_when:
    - Chcesz używać Gradium do text-to-speech
    - Potrzebujesz klucza API Gradium lub konfiguracji głosu
summary: Używaj Gradium text-to-speech w OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-25T13:56:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium to dołączony provider text-to-speech dla OpenClaw. Może generować zwykłe odpowiedzi audio, wyjście Opus zgodne z notatkami głosowymi oraz dźwięk 8 kHz u-law dla powierzchni telefonicznych.

## Konfiguracja

Utwórz klucz API Gradium, a następnie udostępnij go OpenClaw:

```bash
export GRADIUM_API_KEY="gsk_..."
```

Możesz również przechowywać klucz w konfiguracji pod `messages.tts.providers.gradium.apiKey`.

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## Głosy

| Nazwa     | Voice ID           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Głos domyślny: Emma.

## Wyjście

- Odpowiedzi jako pliki audio używają WAV.
- Odpowiedzi jako notatki głosowe używają Opus i są oznaczane jako zgodne z wiadomościami głosowymi.
- Synteza telefoniczna używa `ulaw_8000` przy 8 kHz.

## Powiązane

- [Text-to-Speech](/pl/tools/tts)
- [Przegląd multimediów](/pl/tools/media-overview)
