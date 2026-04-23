---
read_when:
    - Anda menginginkan speech-to-text Deepgram untuk lampiran audio
    - Anda menginginkan transkripsi streaming Deepgram untuk Voice Call
    - Anda memerlukan contoh konfigurasi Deepgram singkat
summary: Transkripsi Deepgram untuk voice note masuk
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T09:26:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Transkripsi Audio)

Deepgram adalah API speech-to-text. Di OpenClaw, Deepgram digunakan untuk
transkripsi audio/voice note masuk melalui `tools.media.audio` dan untuk STT
streaming Voice Call melalui `plugins.entries.voice-call.config.streaming`.

Untuk transkripsi batch, OpenClaw mengunggah file audio lengkap ke Deepgram
dan menyuntikkan transkrip ke pipeline balasan (`{{Transcript}}` +
blok `[Audio]`). Untuk streaming Voice Call, OpenClaw meneruskan frame G.711
u-law langsung melalui endpoint WebSocket `listen` Deepgram dan memancarkan
transkrip parsial atau final saat Deepgram mengembalikannya.

| Detail        | Nilai                                                      |
| ------------- | ---------------------------------------------------------- |
| Situs web     | [deepgram.com](https://deepgram.com)                       |
| Docs          | [developers.deepgram.com](https://developers.deepgram.com) |
| Auth          | `DEEPGRAM_API_KEY`                                         |
| Model default | `nova-3`                                                   |

## Mulai

<Steps>
  <Step title="Setel API key Anda">
    Tambahkan API key Deepgram Anda ke environment:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Aktifkan provider audio">
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
  <Step title="Kirim voice note">
    Kirim pesan audio melalui channel yang terhubung. OpenClaw akan mentranskripsikannya
    melalui Deepgram dan menyuntikkan transkrip ke pipeline balasan.
  </Step>
</Steps>

## Opsi konfigurasi

| Opsi              | Path                                                         | Deskripsi                            |
| ----------------- | ------------------------------------------------------------ | ------------------------------------ |
| `model`           | `tools.media.audio.models[].model`                           | ID model Deepgram (default: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Petunjuk bahasa (opsional)           |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Aktifkan deteksi bahasa (opsional)   |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Aktifkan tanda baca (opsional)       |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Aktifkan pemformatan pintar (opsional) |

<Tabs>
  <Tab title="Dengan petunjuk bahasa">
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
  <Tab title="Dengan opsi Deepgram">
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

## STT streaming Voice Call

Plugin bawaan `deepgram` juga mendaftarkan provider transkripsi realtime
untuk plugin Voice Call.

| Pengaturan      | Path konfigurasi                                                       | Default                          |
| --------------- | ---------------------------------------------------------------------- | -------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Fallback ke `DEEPGRAM_API_KEY`   |
| Model           | `...deepgram.model`                                                    | `nova-3`                         |
| Language        | `...deepgram.language`                                                 | (tidak disetel)                  |
| Encoding        | `...deepgram.encoding`                                                 | `mulaw`                          |
| Sample rate     | `...deepgram.sampleRate`                                               | `8000`                           |
| Endpointing     | `...deepgram.endpointingMs`                                            | `800`                            |
| Interim results | `...deepgram.interimResults`                                           | `true`                           |

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
Voice Call menerima audio telepon sebagai G.711 u-law 8 kHz. Provider
streaming Deepgram default ke `encoding: "mulaw"` dan `sampleRate: 8000`, sehingga
frame media Twilio dapat diteruskan secara langsung.
</Note>

## Catatan

<AccordionGroup>
  <Accordion title="Autentikasi">
    Autentikasi mengikuti urutan auth provider standar. `DEEPGRAM_API_KEY` adalah
    jalur paling sederhana.
  </Accordion>
  <Accordion title="Proxy dan endpoint kustom">
    Timpa endpoint atau header dengan `tools.media.audio.baseUrl` dan
    `tools.media.audio.headers` saat menggunakan proxy.
  </Accordion>
  <Accordion title="Perilaku output">
    Output mengikuti aturan audio yang sama seperti provider lain (batas ukuran, timeout,
    penyuntikan transkrip).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Media tools" href="/id/tools/media-overview" icon="photo-film">
    Ikhtisar pipeline pemrosesan audio, gambar, dan video.
  </Card>
  <Card title="Configuration" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap termasuk pengaturan tool media.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah debugging.
  </Card>
  <Card title="FAQ" href="/id/help/faq" icon="circle-question">
    Pertanyaan umum tentang penyiapan OpenClaw.
  </Card>
</CardGroup>
