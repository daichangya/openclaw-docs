---
read_when:
    - Chcesz używać speech-to-text SenseAudio dla załączników audio
    - Potrzebujesz zmiennej środowiskowej klucza API SenseAudio lub ścieżki konfiguracji audio
summary: Batch speech-to-text SenseAudio dla przychodzących notatek głosowych
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:57:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio może transkrybować przychodzące załączniki audio/notatki głosowe przez
współdzielony pipeline `tools.media.audio` w OpenClaw. OpenClaw wysyła multipart audio
do punktu końcowego transkrypcji zgodnego z OpenAI i wstrzykuje zwrócony tekst
jako `{{Transcript}}` oraz blok `[Audio]`.

| Szczegół     | Wartość                                          |
| ------------ | ------------------------------------------------ |
| Strona       | [senseaudio.cn](https://senseaudio.cn)           |
| Dokumentacja | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Auth         | `SENSEAUDIO_API_KEY`                             |
| Model domyślny | `senseaudio-asr-pro-1.5-260319`                |
| Domyślny URL | `https://api.senseaudio.cn/v1`                   |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Włącz dostawcę audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Wyślij notatkę głosową">
    Wyślij wiadomość audio przez dowolny podłączony kanał. OpenClaw prześle
    audio do SenseAudio i użyje transkrypcji w pipeline odpowiedzi.
  </Step>
</Steps>

## Opcje

| Opcja       | Ścieżka                              | Opis                                 |
| ----------- | ------------------------------------ | ------------------------------------ |
| `model`     | `tools.media.audio.models[].model`   | Identyfikator modelu ASR SenseAudio  |
| `language`  | `tools.media.audio.models[].language` | Opcjonalna wskazówka języka         |
| `prompt`    | `tools.media.audio.prompt`           | Opcjonalny prompt transkrypcji       |
| `baseUrl`   | `tools.media.audio.baseUrl` or model | Nadpisuje bazowy URL zgodny z OpenAI |
| `headers`   | `tools.media.audio.request.headers`  | Dodatkowe nagłówki żądania           |

<Note>
SenseAudio w OpenClaw obsługuje tylko batch STT. Realtime transcription dla Voice Call
nadal korzysta z dostawców z obsługą strumieniowego STT.
</Note>
