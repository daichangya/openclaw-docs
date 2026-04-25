---
read_when:
    - Anda menginginkan model Xiaomi MiMo di OpenClaw
    - Anda memerlukan penyiapan `XIAOMI_API_KEY`
summary: Gunakan model Xiaomi MiMo dengan OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T13:55:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo adalah platform API untuk model **MiMo**. OpenClaw menggunakan endpoint
Xiaomi yang kompatibel dengan OpenAI dengan autentikasi API key.

| Properti | Nilai                           |
| -------- | ------------------------------- |
| Provider | `xiaomi`                        |
| Auth     | `XIAOMI_API_KEY`                |
| API      | Kompatibel dengan OpenAI        |
| Base URL | `https://api.xiaomimimo.com/v1` |

## Memulai

<Steps>
  <Step title="Dapatkan API key">
    Buat API key di [konsol Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Atau berikan key secara langsung:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Katalog bawaan

| Model ref              | Input       | Context   | Output maks | Reasoning | Catatan       |
| ---------------------- | ----------- | --------- | ----------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192       | Tidak     | Model default |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000      | Ya        | Context besar |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000      | Ya        | Multimodal    |

<Tip>
Model ref default adalah `xiaomi/mimo-v2-flash`. Provider disuntikkan secara otomatis saat `XIAOMI_API_KEY` disetel atau profil auth tersedia.
</Tip>

## Text-to-speech

Plugin `xiaomi` bawaan juga mendaftarkan Xiaomi MiMo sebagai provider suara untuk
`messages.tts`. Plugin ini memanggil kontrak TTS chat-completions Xiaomi dengan teks sebagai
pesan `assistant` dan panduan gaya opsional sebagai pesan `user`.

| Properti | Nilai                                    |
| -------- | ---------------------------------------- |
| ID TTS   | `xiaomi` (alias `mimo`)                  |
| Auth     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` dengan `audio` |
| Default  | `mimo-v2.5-tts`, voice `mimo_default`    |
| Output   | MP3 secara default; WAV saat dikonfigurasi |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Voice bawaan yang didukung mencakup `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo`, dan `Dean`. `mimo-v2-tts` didukung untuk akun MiMo
TTS yang lebih lama; default menggunakan model TTS MiMo-V2.5 saat ini. Untuk target
voice-note seperti Feishu dan Telegram, OpenClaw mentranskode output Xiaomi ke Opus 48kHz
dengan `ffmpeg` sebelum pengiriman.

## Contoh config

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Perilaku auto-injection">
    Provider `xiaomi` disuntikkan secara otomatis saat `XIAOMI_API_KEY` disetel di environment Anda atau profil auth tersedia. Anda tidak perlu mengonfigurasi provider secara manual kecuali jika ingin mengganti metadata model atau base URL.
  </Accordion>

  <Accordion title="Detail model">
    - **mimo-v2-flash** — ringan dan cepat, ideal untuk tugas teks tujuan umum. Tidak mendukung reasoning.
    - **mimo-v2-pro** — mendukung reasoning dengan context window 1 juta token untuk beban kerja dokumen panjang.
    - **mimo-v2-omni** — model multimodal dengan reasoning yang menerima input teks dan gambar.

    <Note>
    Semua model menggunakan prefix `xiaomi/` (misalnya `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Pemecahan masalah">
    - Jika model tidak muncul, pastikan `XIAOMI_API_KEY` disetel dan valid.
    - Saat Gateway berjalan sebagai daemon, pastikan key tersedia untuk proses tersebut (misalnya di `~/.openclaw/.env` atau melalui `env.shellEnv`).

    <Warning>
    Key yang hanya disetel di shell interaktif Anda tidak terlihat oleh proses Gateway yang dikelola daemon. Gunakan `~/.openclaw/.env` atau config `env.shellEnv` untuk ketersediaan yang persisten.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, model ref, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi OpenClaw lengkap.
  </Card>
  <Card title="Konsol Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Dasbor Xiaomi MiMo dan pengelolaan API key.
  </Card>
</CardGroup>
