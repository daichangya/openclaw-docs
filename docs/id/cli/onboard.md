---
read_when:
    - Anda menginginkan penyiapan terpandu untuk Gateway, workspace, auth, saluran, dan Skills
summary: Referensi CLI untuk `openclaw onboard` (onboarding interaktif)
title: onboard
x-i18n:
    generated_at: "2026-04-23T09:19:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Onboarding interaktif untuk penyiapan Gateway lokal atau remote.

## Panduan terkait

- Hub onboarding CLI: [Onboarding (CLI)](/id/start/wizard)
- Ikhtisar onboarding: [Ikhtisar Onboarding](/id/start/onboarding-overview)
- Referensi onboarding CLI: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference)
- Otomatisasi CLI: [Otomatisasi CLI](/id/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (Aplikasi macOS)](/id/start/onboarding)

## Contoh

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Untuk target `ws://` plaintext jaringan privat (hanya jaringan tepercaya), setel
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` di environment proses onboarding.

Provider kustom non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` bersifat opsional dalam mode non-interaktif. Jika dihilangkan, onboarding memeriksa `CUSTOM_API_KEY`.

LM Studio juga mendukung flag kunci khusus provider dalam mode non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` default-nya `http://127.0.0.1:11434`. `--custom-model-id` bersifat opsional; jika dihilangkan, onboarding menggunakan default yang disarankan Ollama. ID model cloud seperti `kimi-k2.5:cloud` juga berfungsi di sini.

Simpan key provider sebagai ref, bukan plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, onboarding menulis ref berbasis env alih-alih nilai key plaintext.
Untuk provider berbasis auth-profile, ini menulis entri `keyRef`; untuk provider kustom, ini menulis `models.providers.<id>.apiKey` sebagai env ref (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrak mode `ref` non-interaktif:

- Setel env var provider di environment proses onboarding, misalnya `OPENAI_API_KEY`.
- Jangan berikan flag key inline, misalnya `--openai-api-key`, kecuali env var itu juga disetel.
- Jika flag key inline diberikan tanpa env var yang diperlukan, onboarding gagal cepat dengan panduan.

Opsi token Gateway dalam mode non-interaktif:

- `--gateway-auth token --gateway-token <token>` menyimpan token plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai env SecretRef.
- `--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.
- `--gateway-token-ref-env` memerlukan env var tidak kosong di environment proses onboarding.
- Dengan `--install-daemon`, saat auth token memerlukan token, token Gateway yang dikelola SecretRef divalidasi tetapi tidak dipersistenkan sebagai plaintext hasil resolve dalam metadata environment layanan supervisor.
- Dengan `--install-daemon`, jika mode token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat di-resolve, onboarding gagal tertutup dengan panduan remediasi.
- Dengan `--install-daemon`, jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak disetel, onboarding memblokir instalasi sampai mode disetel secara eksplisit.
- Onboarding lokal menulis `gateway.mode="local"` ke dalam config. Jika file config setelahnya tidak memiliki `gateway.mode`, perlakukan itu sebagai kerusakan config atau edit manual yang tidak lengkap, bukan sebagai pintasan mode lokal yang valid.
- `--allow-unconfigured` adalah escape hatch runtime Gateway yang terpisah. Itu tidak berarti onboarding boleh menghilangkan `gateway.mode`.

Contoh:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Kesehatan Gateway lokal non-interaktif:

- Kecuali Anda memberikan `--skip-health`, onboarding menunggu sampai Gateway lokal dapat dijangkau sebelum keluar dengan sukses.
- `--install-daemon` memulai jalur instalasi Gateway terkelola terlebih dahulu. Tanpanya, Anda harus sudah memiliki Gateway lokal yang berjalan, misalnya `openclaw gateway run`.
- Jika Anda hanya menginginkan penulisan config/workspace/bootstrap dalam otomatisasi, gunakan `--skip-health`.
- Pada Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan fallback ke item login per-pengguna di folder Startup jika pembuatan task ditolak.

Perilaku onboarding interaktif dengan mode referensi:

- Pilih **Use secret reference** saat diminta.
- Lalu pilih salah satu:
  - Environment variable
  - Provider secret yang dikonfigurasi (`file` atau `exec`)
- Onboarding melakukan validasi preflight cepat sebelum menyimpan ref.
  - Jika validasi gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.

Pilihan endpoint Z.AI non-interaktif:

Catatan: `--auth-choice zai-api-key` kini otomatis mendeteksi endpoint Z.AI terbaik untuk key Anda (mengutamakan API umum dengan `zai/glm-5.1`).
Jika Anda secara khusus menginginkan endpoint GLM Coding Plan, pilih `zai-coding-global` atau `zai-coding-cn`.

```bash
# Pemilihan endpoint tanpa prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Pilihan endpoint Z.AI lainnya:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Contoh Mistral non-interaktif:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Catatan alur:

- `quickstart`: prompt minimal, otomatis membuat token Gateway.
- `manual`: prompt lengkap untuk port/bind/auth (alias dari `advanced`).
- Saat pilihan auth menyiratkan provider pilihan, onboarding memprefilter pemilih default-model dan allowlist ke provider tersebut. Untuk Volcengine dan BytePlus, ini juga mencocokkan varian coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Jika filter provider pilihan belum menghasilkan model yang dimuat, onboarding
  fallback ke katalog tanpa filter alih-alih membiarkan pemilih kosong.
- Pada langkah pencarian web, beberapa provider dapat memicu
  prompt lanjutan khusus provider:
  - **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY`
    yang sama dan pilihan model `x_search`.
  - **Kimi** dapat menanyakan region API Moonshot (`api.moonshot.ai` vs
    `api.moonshot.cn`) dan model pencarian web Kimi default.
- Perilaku cakupan DM onboarding lokal: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference#outputs-and-internals).
- Obrolan pertama tercepat: `openclaw dashboard` (UI Control, tanpa penyiapan saluran).
- Provider Kustom: hubungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic,
  termasuk provider hosted yang tidak tercantum. Gunakan Unknown untuk deteksi otomatis.

## Perintah tindak lanjut umum

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` tidak menyiratkan mode non-interaktif. Gunakan `--non-interactive` untuk skrip.
</Note>
