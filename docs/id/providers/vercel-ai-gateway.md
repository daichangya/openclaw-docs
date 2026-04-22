---
read_when:
    - Anda ingin menggunakan Vercel AI Gateway dengan OpenClaw
    - Anda memerlukan env var API key atau pilihan auth CLI
summary: Penyiapan Vercel AI Gateway (auth + pemilihan model)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:26:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) menyediakan API terpadu untuk
mengakses ratusan model melalui satu endpoint.

| Properti      | Nilai                            |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | kompatibel dengan Anthropic Messages |
| Katalog model | Ditemukan otomatis melalui `/v1/models` |

<Tip>
OpenClaw menemukan otomatis katalog Gateway `/v1/models`, jadi
`/models vercel-ai-gateway` mencakup ref model saat ini seperti
`vercel-ai-gateway/openai/gpt-5.4` dan
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Memulai

<Steps>
  <Step title="Tetapkan API key">
    Jalankan onboarding dan pilih opsi auth AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Tetapkan model default">
    Tambahkan model ke config OpenClaw Anda:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Contoh non-interaktif

Untuk penyiapan skrip atau CI, berikan semua nilai di command line:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Singkatan ID model

OpenClaw menerima ref model singkat Claude Vercel dan menormalkannya saat
runtime:

| Input singkat                        | Ref model ternormalisasi                     |
| ------------------------------------ | -------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Anda dapat menggunakan singkatan atau ref model yang sepenuhnya memenuhi syarat
dalam konfigurasi Anda. OpenClaw meresolusikan bentuk kanonis secara otomatis.
</Tip>

## Catatan lanjutan

<AccordionGroup>
  <Accordion title="Variabel environment untuk proses daemon">
    Jika OpenClaw Gateway berjalan sebagai daemon (launchd/systemd), pastikan
    `AI_GATEWAY_API_KEY` tersedia bagi proses tersebut.

    <Warning>
    Key yang hanya ditetapkan di `~/.profile` tidak akan terlihat oleh daemon launchd/systemd
    kecuali environment tersebut diimpor secara eksplisit. Tetapkan key di
    `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses gateway dapat
    membacanya.
    </Warning>

  </Accordion>

  <Accordion title="Perutean provider">
    Vercel AI Gateway merutekan permintaan ke provider upstream berdasarkan prefiks
    ref model. Misalnya, `vercel-ai-gateway/anthropic/claude-opus-4.6` dirutekan
    melalui Anthropic, sedangkan `vercel-ai-gateway/openai/gpt-5.4` dirutekan melalui
    OpenAI dan `vercel-ai-gateway/moonshotai/kimi-k2.6` dirutekan melalui
    MoonshotAI. Satu `AI_GATEWAY_API_KEY` Anda menangani autentikasi untuk semua
    provider upstream.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
