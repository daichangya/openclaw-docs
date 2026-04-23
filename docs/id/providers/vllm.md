---
read_when:
    - Anda ingin menjalankan OpenClaw terhadap server vLLM lokal
    - Anda menginginkan endpoint `/v1` yang kompatibel dengan OpenAI dengan model Anda sendiri
summary: Jalankan OpenClaw dengan vLLM (server lokal yang kompatibel dengan OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-23T09:27:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6c4ceeb59cc10079630e45263485747eadfc66a66267d27579f466d0c0a91a1
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM dapat menyajikan model open-source (dan beberapa model kustom) melalui HTTP API **yang kompatibel dengan OpenAI**. OpenClaw terhubung ke vLLM menggunakan API `openai-completions`.

OpenClaw juga dapat **menemukan otomatis** model yang tersedia dari vLLM saat Anda ikut serta dengan `VLLM_API_KEY` (nilai apa pun berfungsi jika server Anda tidak menegakkan auth) dan Anda tidak mendefinisikan entri `models.providers.vllm` secara eksplisit.

OpenClaw memperlakukan `vllm` sebagai provider lokal yang kompatibel dengan OpenAI dan mendukung
streamed usage accounting, sehingga jumlah token status/konteks dapat diperbarui dari
respons `stream_options.include_usage`.

| Properti         | Nilai                                    |
| ---------------- | ---------------------------------------- |
| ID Provider      | `vllm`                                   |
| API              | `openai-completions` (kompatibel dengan OpenAI) |
| Auth             | variabel lingkungan `VLLM_API_KEY`       |
| Base URL default | `http://127.0.0.1:8000/v1`               |

## Mulai menggunakan

<Steps>
  <Step title="Mulai vLLM dengan server yang kompatibel dengan OpenAI">
    Base URL Anda harus mengekspos endpoint `/v1` (misalnya `/v1/models`, `/v1/chat/completions`). vLLM umumnya berjalan di:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Tetapkan variabel lingkungan API key">
    Nilai apa pun berfungsi jika server Anda tidak menegakkan auth:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Pilih model">
    Ganti dengan salah satu model ID vLLM Anda:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Discovery model (provider implisit)

Saat `VLLM_API_KEY` ditetapkan (atau ada auth profile) dan Anda **tidak** mendefinisikan `models.providers.vllm`, OpenClaw mengueri:

```
GET http://127.0.0.1:8000/v1/models
```

dan mengonversi ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda menetapkan `models.providers.vllm` secara eksplisit, discovery otomatis dilewati dan Anda harus mendefinisikan model secara manual.
</Note>

## Konfigurasi eksplisit (model manual)

Gunakan konfigurasi eksplisit saat:

- vLLM berjalan di host atau port yang berbeda
- Anda ingin menetapkan nilai `contextWindow` atau `maxTokens`
- Server Anda memerlukan API key sungguhan (atau Anda ingin mengontrol header)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Model vLLM Lokal",
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

## Catatan lanjutan

<AccordionGroup>
  <Accordion title="Perilaku bergaya proxy">
    vLLM diperlakukan sebagai backend `/v1` bergaya proxy yang kompatibel dengan OpenAI, bukan endpoint
    OpenAI native. Artinya:

    | Perilaku | Diterapkan? |
    |----------|-------------|
    | Pembentukan permintaan OpenAI native | Tidak |
    | `service_tier` | Tidak dikirim |
    | Responses `store` | Tidak dikirim |
    | Petunjuk prompt-cache | Tidak dikirim |
    | Pembentukan payload compat reasoning OpenAI | Tidak diterapkan |
    | Header attribution OpenClaw tersembunyi | Tidak disuntikkan pada base URL kustom |

  </Accordion>

  <Accordion title="Base URL kustom">
    Jika server vLLM Anda berjalan di host atau port non-default, tetapkan `baseUrl` di konfigurasi provider eksplisit:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Model vLLM Jarak Jauh",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Server tidak dapat dijangkau">
    Periksa bahwa server vLLM sedang berjalan dan dapat diakses:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jika Anda melihat error koneksi, verifikasi host, port, dan bahwa vLLM dimulai dengan mode server yang kompatibel dengan OpenAI.

  </Accordion>

  <Accordion title="Error auth pada permintaan">
    Jika permintaan gagal dengan error auth, tetapkan `VLLM_API_KEY` sungguhan yang cocok dengan konfigurasi server Anda, atau konfigurasi provider secara eksplisit di bawah `models.providers.vllm`.

    <Tip>
    Jika server vLLM Anda tidak menegakkan auth, nilai `VLLM_API_KEY` apa pun yang tidak kosong berfungsi sebagai sinyal opt-in untuk OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Tidak ada model yang ditemukan">
    Discovery otomatis memerlukan `VLLM_API_KEY` ditetapkan **dan** tidak ada entri konfigurasi `models.providers.vllm` yang eksplisit. Jika Anda telah mendefinisikan provider secara manual, OpenClaw melewati discovery dan hanya menggunakan model yang Anda deklarasikan.
  </Accordion>
</AccordionGroup>

<Warning>
Bantuan lebih lanjut: [Troubleshooting](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="OpenAI" href="/id/providers/openai" icon="bolt">
    Provider OpenAI native dan perilaku rute yang kompatibel dengan OpenAI.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan cara mengatasinya.
  </Card>
</CardGroup>
