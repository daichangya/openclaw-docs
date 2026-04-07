---
read_when:
    - Anda ingin menggunakan model Mistral di OpenClaw
    - Anda memerlukan onboarding kunci API Mistral dan referensi model
summary: Gunakan model Mistral dan transkripsi Voxtral dengan OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-07T09:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e32a0eb2a37dba6383ba338b06a8d0be600e7443aa916225794ccb0fdf46aee
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw mendukung Mistral untuk perutean model teks/gambar (`mistral/...`) dan
transkripsi audio melalui Voxtral dalam pemahaman media.
Mistral juga dapat digunakan untuk embedding memori (`memorySearch.provider = "mistral"`).

## Penyiapan CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Cuplikan konfigurasi (provider LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Katalog LLM bawaan

OpenClaw saat ini menyediakan katalog Mistral bawaan berikut:

| Model ref                        | Input       | Konteks | Output maks | Catatan                                                         |
| -------------------------------- | ----------- | ------- | ----------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384      | Model default                                                    |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192       | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384      | Mistral Small 4; reasoning yang dapat disesuaikan melalui API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768      | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096       | Coding                                                           |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768      | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000 | 40,000      | reasoning diaktifkan                                             |

## Cuplikan konfigurasi (transkripsi audio dengan Voxtral)

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

## reasoning yang dapat disesuaikan (`mistral-small-latest`)

`mistral/mistral-small-latest` dipetakan ke Mistral Small 4 dan mendukung [reasoning yang dapat disesuaikan](https://docs.mistral.ai/capabilities/reasoning/adjustable) pada Chat Completions API melalui `reasoning_effort` (`none` meminimalkan thinking tambahan dalam output; `high` menampilkan jejak thinking lengkap sebelum jawaban akhir).

OpenClaw memetakan level **thinking** sesi ke API Mistral:

- **off** / **minimal** → `none`
- **low** / **medium** / **high** / **xhigh** / **adaptive** → `high`

Model lain dalam katalog Mistral bawaan tidak menggunakan parameter ini; tetap gunakan model `magistral-*` saat Anda menginginkan perilaku native Mistral yang mengutamakan reasoning.

## Catatan

- Autentikasi Mistral menggunakan `MISTRAL_API_KEY`.
- Base URL provider secara default adalah `https://api.mistral.ai/v1`.
- Model default onboarding adalah `mistral/mistral-large-latest`.
- Model audio default media-understanding untuk Mistral adalah `voxtral-mini-latest`.
- Jalur transkripsi media menggunakan `/v1/audio/transcriptions`.
- Jalur embedding memori menggunakan `/v1/embeddings` (model default: `mistral-embed`).
