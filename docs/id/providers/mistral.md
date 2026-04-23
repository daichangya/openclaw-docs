---
read_when:
    - Anda ingin menggunakan model Mistral di OpenClaw
    - Anda ingin transkripsi realtime Voxtral untuk Voice Call
    - Anda memerlukan onboarding API key Mistral dan ref model
summary: Gunakan model Mistral dan transkripsi Voxtral dengan OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T09:27:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw mendukung Mistral untuk perutean model teks/gambar (`mistral/...`) dan
transkripsi audio melalui Voxtral dalam media understanding.
Mistral juga dapat digunakan untuk embedding memori (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Memulai

<Steps>
  <Step title="Dapatkan API key Anda">
    Buat API key di [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Atau berikan key secara langsung:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Atur model default">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Katalog LLM bawaan

OpenClaw saat ini menyediakan katalog Mistral bawaan berikut:

| Ref model                        | Input       | Konteks | Output maks | Catatan                                                         |
| -------------------------------- | ----------- | ------- | ----------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | teks, gambar | 262,144 | 16,384      | Model default                                                   |
| `mistral/mistral-medium-2508`    | teks, gambar | 262,144 | 8,192       | Mistral Medium 3.1                                              |
| `mistral/mistral-small-latest`   | teks, gambar | 128,000 | 16,384      | Mistral Small 4; reasoning dapat disesuaikan via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | teks, gambar | 128,000 | 32,768      | Pixtral                                                         |
| `mistral/codestral-latest`       | teks        | 256,000 | 4,096       | Coding                                                          |
| `mistral/devstral-medium-latest` | teks        | 262,144 | 32,768      | Devstral 2                                                      |
| `mistral/magistral-small`        | teks        | 128,000 | 40,000      | Reasoning diaktifkan                                            |

## Transkripsi audio (Voxtral)

Gunakan Voxtral untuk transkripsi audio batch melalui pipeline
media understanding.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Jalur transkripsi media menggunakan `/v1/audio/transcriptions`. Model audio default untuk Mistral adalah `voxtral-mini-latest`.
</Tip>

## Streaming STT Voice Call

Plugin `mistral` bawaan mendaftarkan Voxtral Realtime sebagai provider
streaming STT Voice Call.

| Pengaturan   | Jalur config                                                          | Default                                 |
| ------------ | --------------------------------------------------------------------- | --------------------------------------- |
| API key      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Fallback ke `MISTRAL_API_KEY`           |
| Model        | `...mistral.model`                                                    | `voxtral-mini-transcribe-realtime-2602` |
| Encoding     | `...mistral.encoding`                                                 | `pcm_mulaw`                             |
| Sample rate  | `...mistral.sampleRate`                                               | `8000`                                  |
| Delay target | `...mistral.targetStreamingDelayMs`                                   | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
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
OpenClaw secara default menetapkan realtime STT Mistral ke `pcm_mulaw` pada 8 kHz agar Voice Call
dapat meneruskan frame media Twilio secara langsung. Gunakan `encoding: "pcm_s16le"` dan
`sampleRate` yang sesuai hanya jika stream upstream Anda memang sudah berupa PCM mentah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Reasoning yang dapat disesuaikan (mistral-small-latest)">
    `mistral/mistral-small-latest` dipetakan ke Mistral Small 4 dan mendukung [reasoning yang dapat disesuaikan](https://docs.mistral.ai/capabilities/reasoning/adjustable) pada API Chat Completions melalui `reasoning_effort` (`none` meminimalkan thinking tambahan di output; `high` menampilkan jejak thinking penuh sebelum jawaban final).

    OpenClaw memetakan level **thinking** sesi ke API Mistral:

    | Level thinking OpenClaw                        | `reasoning_effort` Mistral |
    | ---------------------------------------------- | -------------------------- |
    | **off** / **minimal**                          | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Model katalog Mistral bawaan lainnya tidak menggunakan parameter ini. Tetap gunakan model `magistral-*` saat Anda menginginkan perilaku native Mistral yang mengutamakan reasoning.
    </Note>

  </Accordion>

  <Accordion title="Embedding memori">
    Mistral dapat melayani embedding memori melalui `/v1/embeddings` (model default: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth dan base URL">
    - Auth Mistral menggunakan `MISTRAL_API_KEY`.
    - Base URL provider secara default adalah `https://api.mistral.ai/v1`.
    - Model default onboarding adalah `mistral/mistral-large-latest`.
    - Z.AI menggunakan auth Bearer dengan API key Anda.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Media understanding" href="/id/nodes/media-understanding" icon="microphone">
    Penyiapan transkripsi audio dan pemilihan provider.
  </Card>
</CardGroup>
