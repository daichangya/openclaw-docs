---
read_when:
    - Vuoi lo speech-to-text di SenseAudio per allegati audio
    - Ti serve la variabile env della chiave API di SenseAudio o il percorso di configurazione audio
summary: Speech-to-text batch di SenseAudio per note vocali in entrata
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:56:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio può trascrivere allegati audio/note vocali in entrata tramite la
pipeline condivisa `tools.media.audio` di OpenClaw. OpenClaw invia audio multipart
all'endpoint di trascrizione compatibile con OpenAI e inserisce il testo restituito
come `{{Transcript}}` più un blocco `[Audio]`.

| Dettaglio     | Valore                                           |
| ------------- | ------------------------------------------------ |
| Sito web      | [senseaudio.cn](https://senseaudio.cn)           |
| Documentazione | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Auth          | `SENSEAUDIO_API_KEY`                             |
| Modello predefinito | `senseaudio-asr-pro-1.5-260319`            |
| URL predefinito | `https://api.senseaudio.cn/v1`                 |

## Per iniziare

<Steps>
  <Step title="Imposta la tua chiave API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Abilita il provider audio">
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
  <Step title="Invia una nota vocale">
    Invia un messaggio audio tramite qualsiasi canale connesso. OpenClaw carica l'audio
    su SenseAudio e usa la trascrizione nella pipeline di risposta.
  </Step>
</Steps>

## Opzioni

| Opzione    | Percorso                              | Descrizione                                |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | id del modello ASR di SenseAudio           |
| `language` | `tools.media.audio.models[].language` | suggerimento facoltativo della lingua      |
| `prompt`   | `tools.media.audio.prompt`            | prompt facoltativo per la trascrizione     |
| `baseUrl`  | `tools.media.audio.baseUrl` o model   | sovrascrive la base compatibile con OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | header di richiesta aggiuntivi             |

<Note>
SenseAudio in OpenClaw è solo STT batch. La trascrizione realtime di Voice Call
continua a usare provider con supporto STT in streaming.
</Note>
