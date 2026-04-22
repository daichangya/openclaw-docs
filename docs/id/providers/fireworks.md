---
read_when:
    - Anda ingin menggunakan Fireworks dengan OpenClaw
    - Anda memerlukan variabel env API key Fireworks atau ID model default
summary: Penyiapan Fireworks (auth + pemilihan model)
title: Fireworks
x-i18n:
    generated_at: "2026-04-22T04:25:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) mengekspos model open-weight dan model yang dirutekan melalui API yang kompatibel dengan OpenAI. OpenClaw menyertakan Plugin penyedia Fireworks bawaan.

| Properti      | Nilai                                                  |
| ------------- | ------------------------------------------------------ |
| Penyedia      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions yang kompatibel dengan OpenAI         |
| URL dasar     | `https://api.fireworks.ai/inference/v1`                |
| Model default | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Memulai

<Steps>
  <Step title="Siapkan auth Fireworks melalui onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Ini menyimpan key Fireworks Anda di config OpenClaw dan menetapkan model awal Fire Pass sebagai default.

  </Step>
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Contoh non-interaktif

Untuk penyiapan berbasis skrip atau CI, teruskan semua nilai di command line:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Katalog bawaan

| Referensi model                                       | Nama                        | Input      | Konteks | Output maks | Catatan                                                                                                                                                    |
| ----------------------------------------------------- | --------------------------- | ---------- | ------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`       | Kimi K2.6                   | text,image | 262,144 | 262,144     | Model Kimi terbaru di Fireworks. Thinking dinonaktifkan untuk permintaan Fireworks K2.6; rutekan langsung melalui Moonshot jika Anda memerlukan output thinking Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000     | Model awal bawaan default di Fireworks                                                                                                                     |

<Tip>
Jika Fireworks menerbitkan model yang lebih baru seperti rilis Qwen atau Gemma terbaru, Anda dapat langsung beralih ke model itu dengan menggunakan ID model Fireworks-nya tanpa menunggu pembaruan katalog bawaan.
</Tip>

## ID model Fireworks kustom

OpenClaw juga menerima ID model Fireworks dinamis. Gunakan ID model atau router persis seperti yang ditampilkan oleh Fireworks dan beri prefix `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cara kerja prefix ID model">
    Setiap referensi model Fireworks di OpenClaw diawali dengan `fireworks/` diikuti oleh ID atau path router persis dari platform Fireworks. Contohnya:

    - Model router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Model langsung: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw menghapus prefix `fireworks/` saat membangun permintaan API dan mengirim path sisanya ke endpoint Fireworks.

  </Accordion>

  <Accordion title="Catatan lingkungan">
    Jika Gateway berjalan di luar shell interaktif Anda, pastikan `FIREWORKS_API_KEY` juga tersedia untuk proses tersebut.

    <Warning>
    Key yang hanya berada di `~/.profile` tidak akan membantu daemon launchd/systemd kecuali environment tersebut juga diimpor ke sana. Setel key di `~/.openclaw/.env` atau melalui `env.shellEnv` untuk memastikan proses gateway dapat membacanya.
    </Warning>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
