---
read_when:
    - Anda menginginkan penyiapan terpandu untuk gateway, workspace, auth, channel, dan Skills
summary: Referensi CLI untuk `openclaw onboard` (onboarding interaktif)
title: Onboard
x-i18n:
    generated_at: "2026-04-25T13:44:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Onboarding interaktif untuk penyiapan Gateway lokal atau remote.

## Panduan terkait

- Pusat onboarding CLI: [Onboarding (CLI)](/id/start/wizard)
- Gambaran umum onboarding: [Onboarding Overview](/id/start/onboarding-overview)
- Referensi onboarding CLI: [CLI Setup Reference](/id/start/wizard-cli-reference)
- Otomatisasi CLI: [CLI Automation](/id/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (macOS App)](/id/start/onboarding)

## Contoh

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` memulai pratinjau onboarding percakapan Crestodian. Tanpa
`--modern`, `openclaw onboard` tetap menggunakan alur onboarding klasik.

Untuk target `ws://` plaintext di jaringan privat (hanya jaringan tepercaya), tetapkan
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` di environment proses onboarding.
Tidak ada padanan `openclaw.json` untuk break-glass transport sisi klien ini.

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

`--custom-api-key` bersifat opsional dalam mode non-interaktif. Jika dihilangkan,
onboarding memeriksa `CUSTOM_API_KEY`.

LM Studio juga mendukung flag key khusus provider dalam mode non-interaktif:

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

`--custom-base-url` secara default adalah `http://127.0.0.1:11434`. `--custom-model-id` bersifat opsional; jika dihilangkan, onboarding menggunakan default yang disarankan Ollama. ID model cloud seperti `kimi-k2.5:cloud` juga berfungsi di sini.

Simpan key provider sebagai ref alih-alih plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Dengan `--secret-input-mode ref`, onboarding menulis ref berbasis env alih-alih nilai key plaintext.
Untuk provider berbasis auth-profile, ini menulis entri `keyRef`; untuk provider kustom, ini menulis `models.providers.<id>.apiKey` sebagai ref env (misalnya `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Kontrak mode `ref` non-interaktif:

- Tetapkan env var provider di environment proses onboarding (misalnya `OPENAI_API_KEY`).
- Jangan berikan flag key inline (misalnya `--openai-api-key`) kecuali env var tersebut juga ditetapkan.
- Jika flag key inline diberikan tanpa env var yang diwajibkan, onboarding gagal cepat dengan panduan.

Opsi token Gateway dalam mode non-interaktif:

- `--gateway-auth token --gateway-token <token>` menyimpan token plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` menyimpan `gateway.auth.token` sebagai env SecretRef.
- `--gateway-token` dan `--gateway-token-ref-env` saling eksklusif.
- `--gateway-token-ref-env` memerlukan env var yang tidak kosong di environment proses onboarding.
- Dengan `--install-daemon`, saat auth token memerlukan token, token Gateway yang dikelola SecretRef divalidasi tetapi tidak disimpan sebagai plaintext yang telah di-resolve dalam metadata environment layanan supervisor.
- Dengan `--install-daemon`, jika mode token memerlukan token dan SecretRef token yang dikonfigurasi belum ter-resolve, onboarding gagal tertutup dengan panduan perbaikan.
- Dengan `--install-daemon`, jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak ditetapkan, onboarding memblokir instalasi sampai mode ditetapkan secara eksplisit.
- Onboarding lokal menulis `gateway.mode="local"` ke dalam config. Jika file config berikutnya tidak memiliki `gateway.mode`, perlakukan itu sebagai kerusakan config atau pengeditan manual yang tidak lengkap, bukan sebagai pintasan mode lokal yang valid.
- `--allow-unconfigured` adalah escape hatch runtime gateway terpisah. Ini tidak berarti onboarding boleh menghilangkan `gateway.mode`.

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

Kesehatan gateway lokal non-interaktif:

- Kecuali Anda memberikan `--skip-health`, onboarding menunggu gateway lokal yang dapat dijangkau sebelum keluar dengan sukses.
- `--install-daemon` memulai jalur instalasi gateway terkelola terlebih dahulu. Tanpanya, Anda harus sudah memiliki gateway lokal yang berjalan, misalnya `openclaw gateway run`.
- Jika Anda hanya ingin penulisan config/workspace/bootstrap dalam otomatisasi, gunakan `--skip-health`.
- Jika Anda mengelola file workspace sendiri, berikan `--skip-bootstrap` untuk menetapkan `agents.defaults.skipBootstrap: true` dan melewati pembuatan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, dan `BOOTSTRAP.md`.
- Di Windows native, `--install-daemon` mencoba Scheduled Tasks terlebih dahulu dan fallback ke item login folder Startup per pengguna jika pembuatan task ditolak.

Perilaku onboarding interaktif dengan mode referensi:

- Pilih **Use secret reference** saat diminta.
- Lalu pilih salah satu:
  - Environment variable
  - Configured secret provider (`file` atau `exec`)
- Onboarding melakukan validasi preflight cepat sebelum menyimpan ref.
  - Jika validasi gagal, onboarding menampilkan error dan memungkinkan Anda mencoba lagi.

Pilihan endpoint Z.AI non-interaktif:

Catatan: `--auth-choice zai-api-key` kini mendeteksi otomatis endpoint Z.AI terbaik untuk key Anda (memprioritaskan API umum dengan `zai/glm-5.1`).
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

- `quickstart`: prompt minimal, menghasilkan token gateway secara otomatis.
- `manual`: prompt lengkap untuk port/bind/auth (alias `advanced`).
- Saat pilihan auth mengimplikasikan provider pilihan, onboarding memfilter terlebih dahulu pemilih model default dan allowlist ke provider tersebut. Untuk Volcengine dan BytePlus, ini juga cocok dengan varian coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).
- Jika filter preferred-provider belum menghasilkan model yang dimuat, onboarding akan fallback ke katalog tanpa filter alih-alih membiarkan pemilih kosong.
- Pada langkah web-search, beberapa provider dapat memicu prompt lanjutan khusus provider:
  - **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY` yang sama dan pilihan model `x_search`.
  - **Kimi** dapat menanyakan region API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) dan model web-search Kimi default.
- Perilaku scope DM onboarding lokal: [CLI Setup Reference](/id/start/wizard-cli-reference#outputs-and-internals).
- Chat pertama tercepat: `openclaw dashboard` (Control UI, tanpa penyiapan channel).
- Custom Provider: hubungkan endpoint apa pun yang kompatibel dengan OpenAI atau Anthropic, termasuk provider terhosting yang tidak tercantum. Gunakan Unknown untuk deteksi otomatis.

## Perintah lanjutan umum

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` tidak mengimplikasikan mode non-interaktif. Gunakan `--non-interactive` untuk skrip.
</Note>
