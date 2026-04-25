---
read_when:
    - Anda menginginkan speech-to-text SenseAudio untuk lampiran audio
    - Anda memerlukan env var API key SenseAudio atau jalur konfigurasi audio
summary: Speech-to-text batch SenseAudio untuk catatan suara masuk
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:55:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio dapat mentranskripsikan lampiran audio/catatan suara masuk melalui
pipeline bersama `tools.media.audio` milik OpenClaw. OpenClaw mengirim audio multipart
ke endpoint transkripsi yang kompatibel dengan OpenAI dan menyisipkan teks yang dikembalikan
sebagai `{{Transcript}}` plus blok `[Audio]`.

| Detail        | Nilai                                            |
| ------------- | ------------------------------------------------ |
| Situs web     | [senseaudio.cn](https://senseaudio.cn)           |
| Dokumentasi   | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Auth          | `SENSEAUDIO_API_KEY`                             |
| Model default | `senseaudio-asr-pro-1.5-260319`                  |
| URL default   | `https://api.senseaudio.cn/v1`                   |

## Memulai

<Steps>
  <Step title="Atur API key Anda">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Aktifkan penyedia audio">
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
  <Step title="Kirim catatan suara">
    Kirim pesan audio melalui channel apa pun yang terhubung. OpenClaw mengunggah
    audio ke SenseAudio dan menggunakan transkripnya dalam pipeline balasan.
  </Step>
</Steps>

## Opsi

| Opsi       | Jalur                                 | Deskripsi                              |
| ---------- | ------------------------------------- | -------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | ID model ASR SenseAudio                |
| `language` | `tools.media.audio.models[].language` | Petunjuk bahasa opsional               |
| `prompt`   | `tools.media.audio.prompt`            | Prompt transkripsi opsional            |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | Override basis yang kompatibel OpenAI  |
| `headers`  | `tools.media.audio.request.headers`   | Header permintaan tambahan             |

<Note>
SenseAudio hanya STT batch di OpenClaw. Transkripsi realtime Voice Call
tetap menggunakan penyedia dengan dukungan STT streaming.
</Note>
