---
read_when:
    - Ses ekleri için SenseAudio konuşmadan metne dönüştürmeyi istiyorsunuz
    - SenseAudio API anahtarı ortam değişkenine veya ses yapılandırma yoluna ihtiyacınız var
summary: Gelen sesli notlar için SenseAudio toplu konuşmadan metne dönüştürme
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:56:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

SenseAudio, OpenClaw'un paylaşılan `tools.media.audio` işlem hattı üzerinden gelen ses/sesli not eklerini
metne dönüştürebilir. OpenClaw, çok parçalı sesi OpenAI uyumlu
transkripsiyon uç noktasına gönderir ve dönen metni `{{Transcript}}` ile bir `[Audio]` bloğu olarak ekler.

| Ayrıntı      | Değer                                           |
| ------------ | ----------------------------------------------- |
| Web sitesi   | [senseaudio.cn](https://senseaudio.cn)          |
| Dokümanlar   | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| Kimlik doğrulama | `SENSEAUDIO_API_KEY`                         |
| Varsayılan model | `senseaudio-asr-pro-1.5-260319`              |
| Varsayılan URL | `https://api.senseaudio.cn/v1`                |

## Başlarken

<Steps>
  <Step title="API anahtarınızı ayarlayın">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Ses sağlayıcısını etkinleştirin">
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
  <Step title="Bir sesli not gönderin">
    Bağlı herhangi bir kanal üzerinden bir sesli mesaj gönderin. OpenClaw,
    sesi SenseAudio'ya yükler ve transkripti yanıt işlem hattında kullanır.
  </Step>
</Steps>

## Seçenekler

| Seçenek   | Yol                                   | Açıklama                             |
| --------- | ------------------------------------- | ------------------------------------ |
| `model`   | `tools.media.audio.models[].model`    | SenseAudio ASR model kimliği         |
| `language` | `tools.media.audio.models[].language` | İsteğe bağlı dil ipucu               |
| `prompt`  | `tools.media.audio.prompt`            | İsteğe bağlı transkripsiyon istemi   |
| `baseUrl` | `tools.media.audio.baseUrl` or model  | OpenAI uyumlu taban URL'yi geçersiz kıl |
| `headers` | `tools.media.audio.request.headers`   | Ek istek üst bilgileri               |

<Note>
SenseAudio, OpenClaw içinde yalnızca toplu STT içindir. Voice Call gerçek zamanlı transkripsiyon
akışı destekleyen STT sağlayıcılarını kullanmaya devam eder.
</Note>
