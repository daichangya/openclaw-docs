---
read_when:
    - Anda ingin menjalankan OpenClaw terhadap server SGLang lokal
    - Anda ingin endpoint `/v1` yang kompatibel dengan OpenAI dengan model Anda sendiri
summary: Jalankan OpenClaw dengan SGLang (server self-hosted yang kompatibel dengan OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T09:27:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang dapat melayani model open-source melalui API HTTP **yang kompatibel dengan OpenAI**.
OpenClaw dapat terhubung ke SGLang menggunakan API `openai-completions`.

OpenClaw juga dapat **menemukan model yang tersedia secara otomatis** dari SGLang saat Anda ikut
serta dengan `SGLANG_API_KEY` (nilai apa pun berfungsi jika server Anda tidak menegakkan auth)
dan Anda tidak mendefinisikan entri `models.providers.sglang` yang eksplisit.

OpenClaw memperlakukan `sglang` sebagai provider lokal yang kompatibel dengan OpenAI yang mendukung
pencatatan penggunaan berbasis streaming, sehingga jumlah token status/konteks dapat diperbarui dari
respons `stream_options.include_usage`.

## Memulai

<Steps>
  <Step title="Mulai SGLang">
    Jalankan SGLang dengan server yang kompatibel dengan OpenAI. Base URL Anda harus mengekspos
    endpoint `/v1` (misalnya `/v1/models`, `/v1/chat/completions`). SGLang
    biasanya berjalan di:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Atur API key">
    Nilai apa pun berfungsi jika tidak ada auth yang dikonfigurasi di server Anda:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Jalankan onboarding atau atur model secara langsung">
    ```bash
    openclaw onboard
    ```

    Atau konfigurasikan model secara manual:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Penemuan model (provider implisit)

Saat `SGLANG_API_KEY` diatur (atau auth profile ada) dan Anda **tidak**
mendefinisikan `models.providers.sglang`, OpenClaw akan mengkueri:

- `GET http://127.0.0.1:30000/v1/models`

dan mengonversi ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda mengatur `models.providers.sglang` secara eksplisit, penemuan otomatis dilewati dan
Anda harus mendefinisikan model secara manual.
</Note>

## Konfigurasi eksplisit (model manual)

Gunakan config eksplisit saat:

- SGLang berjalan pada host/port yang berbeda.
- Anda ingin mem-pin nilai `contextWindow`/`maxTokens`.
- Server Anda memerlukan API key nyata (atau Anda ingin mengontrol header).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Model SGLang Lokal",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku bergaya proxy">
    SGLang diperlakukan sebagai backend `/v1` yang kompatibel dengan OpenAI bergaya proxy, bukan
    endpoint OpenAI native.

    | Behavior | SGLang |
    |----------|--------|
    | Pembentukan request khusus OpenAI | Tidak diterapkan |
    | `service_tier`, Responses `store`, petunjuk prompt-cache | Tidak dikirim |
    | Pembentukan payload kompatibilitas reasoning | Tidak diterapkan |
    | Header atribusi tersembunyi (`originator`, `version`, `User-Agent`) | Tidak disuntikkan pada base URL SGLang kustom |

  </Accordion>

  <Accordion title="Pemecahan masalah">
    **Server tidak dapat dijangkau**

    Verifikasi server berjalan dan merespons:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Error auth**

    Jika request gagal dengan error auth, atur `SGLANG_API_KEY` nyata yang cocok
    dengan konfigurasi server Anda, atau konfigurasikan provider secara eksplisit di bawah
    `models.providers.sglang`.

    <Tip>
    Jika Anda menjalankan SGLang tanpa autentikasi, nilai non-kosong apa pun untuk
    `SGLANG_API_KEY` sudah cukup untuk ikut serta dalam penemuan model.
    </Tip>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema config lengkap termasuk entri provider.
  </Card>
</CardGroup>
