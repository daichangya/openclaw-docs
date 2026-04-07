---
read_when:
    - Anda ingin menggunakan Arcee AI dengan OpenClaw
    - Anda memerlukan env var kunci API atau pilihan autentikasi CLI
summary: Penyiapan Arcee AI (autentikasi + pemilihan model)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-07T09:18:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb04909a708fec08dd2c8c863501b178f098bc4818eaebad38aea264157969d8
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai) menyediakan akses ke keluarga model mixture-of-experts Trinity melalui API yang kompatibel dengan OpenAI. Semua model Trinity berlisensi Apache 2.0.

Model Arcee AI dapat diakses langsung melalui platform Arcee atau melalui [OpenRouter](/id/providers/openrouter).

- Provider: `arcee`
- Autentikasi: `ARCEEAI_API_KEY` (langsung) atau `OPENROUTER_API_KEY` (melalui OpenRouter)
- API: kompatibel dengan OpenAI
- Base URL: `https://api.arcee.ai/api/v1` (langsung) atau `https://openrouter.ai/api/v1` (OpenRouter)

## Mulai cepat

1. Dapatkan kunci API dari [Arcee AI](https://chat.arcee.ai/) atau [OpenRouter](https://openrouter.ai/keys).

2. Tetapkan kunci API (disarankan: simpan untuk Gateway):

```bash
# Direct (Arcee platform)
openclaw onboard --auth-choice arceeai-api-key

# Via OpenRouter
openclaw onboard --auth-choice arceeai-openrouter
```

3. Tetapkan model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "arcee/trinity-large-thinking" },
    },
  },
}
```

## Contoh non-interaktif

```bash
# Direct (Arcee platform)
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-api-key \
  --arceeai-api-key "$ARCEEAI_API_KEY"

# Via OpenRouter
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-openrouter \
  --openrouter-api-key "$OPENROUTER_API_KEY"
```

## Catatan lingkungan

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `ARCEEAI_API_KEY`
(atau `OPENROUTER_API_KEY`) tersedia untuk proses tersebut (misalnya, di
`~/.openclaw/.env` atau melalui `env.shellEnv`).

## Katalog bawaan

OpenClaw saat ini menyediakan katalog Arcee bawaan berikut:

| Model ref                      | Nama                   | Input | Konteks | Biaya (masuk/keluar per 1M) | Catatan                                  |
| ------------------------------ | ---------------------- | ----- | ------- | --------------------------- | ---------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90               | Model default; reasoning diaktifkan      |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00               | Serbaguna; 400B params, 13B aktif        |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15              | Cepat dan hemat biaya; function calling  |

Referensi model yang sama berlaku untuk penyiapan langsung maupun OpenRouter (misalnya `arcee/trinity-large-thinking`).

Preset onboarding menetapkan `arcee/trinity-large-thinking` sebagai model default.

## Fitur yang didukung

- Streaming
- Penggunaan tool / function calling
- Output terstruktur (mode JSON dan skema JSON)
- Extended thinking (Trinity Large Thinking)
