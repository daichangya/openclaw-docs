---
read_when:
    - Ses ekleri için Deepgram speech-to-text istiyorsunuz
    - Voice Call için Deepgram akışlı transkripsiyon istiyorsunuz
    - Hızlı bir Deepgram yapılandırma örneğine ihtiyacınız var
summary: Gelen sesli notlar için Deepgram transkripsiyonu
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T09:09:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Ses Transkripsiyonu)

Deepgram bir speech-to-text API'sidir. OpenClaw içinde, `tools.media.audio` üzerinden gelen
ses/sesli not transkripsiyonu için ve `plugins.entries.voice-call.config.streaming`
üzerinden Voice Call akışlı STT için kullanılır.

Toplu transkripsiyon için OpenClaw, tam ses dosyasını Deepgram'a yükler
ve transkripti yanıt işlem hattına enjekte eder (`{{Transcript}}` +
`[Audio]` bloğu). Voice Call akışı için OpenClaw, canlı G.711
u-law karelerini Deepgram'ın WebSocket `listen` uç noktasına iletir ve
Deepgram döndürdükçe kısmi veya nihai transkriptleri yayar.

| Ayrıntı       | Değer                                                      |
| ------------- | ---------------------------------------------------------- |
| Web sitesi    | [deepgram.com](https://deepgram.com)                       |
| Belgeler      | [developers.deepgram.com](https://developers.deepgram.com) |
| Kimlik doğrulama | `DEEPGRAM_API_KEY`                                      |
| Varsayılan model | `nova-3`                                                |

## Başlarken

<Steps>
  <Step title="API anahtarınızı ayarlayın">
    Deepgram API anahtarınızı ortama ekleyin:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Ses sağlayıcısını etkinleştirin">
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
  <Step title="Bir sesli not gönderin">
    Herhangi bir bağlı kanal üzerinden bir ses mesajı gönderin. OpenClaw bunu
    Deepgram aracılığıyla transkribe eder ve transkripti yanıt işlem hattına enjekte eder.
  </Step>
</Steps>

## Yapılandırma seçenekleri

| Seçenek          | Yol                                                         | Açıklama                              |
| ---------------- | ----------------------------------------------------------- | ------------------------------------- |
| `model`          | `tools.media.audio.models[].model`                          | Deepgram model kimliği (varsayılan: `nova-3`) |
| `language`       | `tools.media.audio.models[].language`                       | Dil ipucu (isteğe bağlı)              |
| `detect_language`| `tools.media.audio.providerOptions.deepgram.detect_language`| Dil algılamayı etkinleştir (isteğe bağlı) |
| `punctuate`      | `tools.media.audio.providerOptions.deepgram.punctuate`      | Noktalama işaretlerini etkinleştir (isteğe bağlı) |
| `smart_format`   | `tools.media.audio.providerOptions.deepgram.smart_format`   | Akıllı biçimlendirmeyi etkinleştir (isteğe bağlı) |

<Tabs>
  <Tab title="Dil ipucuyla">
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
  <Tab title="Deepgram seçenekleriyle">
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

## Voice Call akışlı STT

Bundled `deepgram` Plugin'i, Voice Call Plugin'i için bir gerçek zamanlı transkripsiyon sağlayıcısı da kaydeder.

| Ayar            | Yapılandırma yolu                                                      | Varsayılan                        |
| --------------- | ---------------------------------------------------------------------- | --------------------------------- |
| API anahtarı    | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey`| `DEEPGRAM_API_KEY` değerine geri döner |
| Model           | `...deepgram.model`                                                    | `nova-3`                          |
| Dil             | `...deepgram.language`                                                 | (ayarsız)                         |
| Kodlama         | `...deepgram.encoding`                                                 | `mulaw`                           |
| Örnekleme oranı | `...deepgram.sampleRate`                                               | `8000`                            |
| Endpointing     | `...deepgram.endpointingMs`                                            | `800`                             |
| Ara sonuçlar    | `...deepgram.interimResults`                                           | `true`                            |

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
Voice Call, telefon sesini 8 kHz G.711 u-law olarak alır. Deepgram
akış sağlayıcısı varsayılan olarak `encoding: "mulaw"` ve `sampleRate: 8000` kullanır, bu yüzden
Twilio medya kareleri doğrudan iletilebilir.
</Note>

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Kimlik doğrulama standart sağlayıcı kimlik doğrulama sırasını izler. `DEEPGRAM_API_KEY`,
    en basit yoldur.
  </Accordion>
  <Accordion title="Proxy ve özel uç noktalar">
    Proxy kullanırken uç noktaları veya başlıkları `tools.media.audio.baseUrl` ve
    `tools.media.audio.headers` ile geçersiz kılın.
  </Accordion>
  <Accordion title="Çıktı davranışı">
    Çıktı, diğer sağlayıcılarla aynı ses kurallarını izler (boyut sınırları, zaman aşımları,
    transkript enjeksiyonu).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Medya araçları" href="/tr/tools/media-overview" icon="photo-film">
    Ses, görsel ve video işleme işlem hattına genel bakış.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Medya aracı ayarları dahil tam yapılandırma başvurusu.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
  <Card title="SSS" href="/tr/help/faq" icon="circle-question">
    OpenClaw kurulumu hakkında sık sorulan sorular.
  </Card>
</CardGroup>
