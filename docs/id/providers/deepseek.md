---
read_when:
    - Anda ingin menggunakan DeepSeek dengan OpenClaw
    - Anda memerlukan env var API key atau pilihan auth CLI
summary: Penyiapan DeepSeek (auth + pemilihan model)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:53:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) menyediakan model AI yang kuat dengan API yang kompatibel dengan OpenAI.

| Properti | Nilai                     |
| -------- | ------------------------- |
| Provider | `deepseek`                |
| Auth     | `DEEPSEEK_API_KEY`        |
| API      | Kompatibel dengan OpenAI  |
| Base URL | `https://api.deepseek.com` |

## Memulai

<Steps>
  <Step title="Get your API key">
    Buat API key di [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Ini akan meminta API key Anda dan menetapkan `deepseek/deepseek-v4-flash` sebagai model default.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    Untuk memeriksa katalog statis bawaan tanpa memerlukan Gateway yang sedang berjalan,
    gunakan:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    Untuk instalasi scripted atau headless, berikan semua flag secara langsung:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `DEEPSEEK_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).
</Warning>

## Katalog bawaan

| Referensi model              | Nama              | Input | Context   | Output maks | Catatan                                    |
| ---------------------------- | ----------------- | ----- | --------- | ----------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000     | Model default; surface V4 yang mendukung thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000     | Surface V4 yang mendukung thinking         |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192       | Surface non-thinking DeepSeek V3.2         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536      | Surface V3.2 dengan reasoning aktif        |

<Tip>
Model V4 mendukung kontrol `thinking` milik DeepSeek. OpenClaw juga me-replay
`reasoning_content` DeepSeek pada giliran tindak lanjut agar sesi thinking dengan pemanggilan tool
dapat dilanjutkan.
</Tip>

## Thinking dan tool

Sesi thinking DeepSeek V4 memiliki kontrak replay yang lebih ketat daripada kebanyakan
provider yang kompatibel dengan OpenAI: ketika pesan asisten yang diaktifkan thinking menyertakan
pemanggilan tool, DeepSeek mengharapkan `reasoning_content` asisten sebelumnya dikirim
kembali pada permintaan tindak lanjut. OpenClaw menangani ini di dalam Plugin DeepSeek,
sehingga penggunaan tool multi-giliran normal berfungsi dengan `deepseek/deepseek-v4-flash` dan
`deepseek/deepseek-v4-pro`.

Jika Anda mengalihkan sesi yang sudah ada dari provider lain yang kompatibel dengan OpenAI ke
model DeepSeek V4, giliran pemanggilan tool asisten yang lebih lama mungkin tidak memiliki
`reasoning_content` DeepSeek native. OpenClaw mengisi field yang hilang tersebut untuk permintaan thinking DeepSeek V4 agar provider dapat menerima replay riwayat tool-call
tanpa memerlukan `/new`.

Saat thinking dinonaktifkan di OpenClaw (termasuk pilihan UI **None**),
OpenClaw mengirim DeepSeek `thinking: { type: "disabled" }` dan menghapus
`reasoning_content` yang di-replay dari history keluar. Ini menjaga sesi
thinking yang dinonaktifkan tetap berada di jalur DeepSeek non-thinking.

Gunakan `deepseek/deepseek-v4-flash` untuk jalur cepat default. Gunakan
`deepseek/deepseek-v4-pro` saat Anda menginginkan model V4 yang lebih kuat dan dapat menerima
biaya atau latensi yang lebih tinggi.

## Pengujian live

Suite model live langsung mencakup DeepSeek V4 dalam set model modern. Untuk
menjalankan hanya pemeriksaan direct-model DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Pemeriksaan live tersebut memverifikasi bahwa kedua model V4 dapat menyelesaikan completion dan bahwa giliran tindak lanjut thinking/tool mempertahankan payload replay yang dibutuhkan DeepSeek.

## Contoh config

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Referensi config lengkap untuk agen, model, dan provider.
  </Card>
</CardGroup>
