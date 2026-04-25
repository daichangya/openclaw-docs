---
read_when:
    - Anda ingin memahami OAuth OpenClaw secara menyeluruh
    - Anda mengalami masalah invalidasi token / logout
    - Anda menginginkan alur autentikasi Claude CLI atau OAuth
    - Anda menginginkan beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pertukaran token, penyimpanan, dan pola multi-akun'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:44:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw mendukung “subscription auth” melalui OAuth untuk penyedia yang menawarkannya
(terutama **OpenAI Codex (ChatGPT OAuth)**). Untuk Anthropic, pembagian praktisnya
sekarang adalah:

- **Kunci API Anthropic**: penagihan API Anthropic normal
- **Anthropic Claude CLI / subscription auth di dalam OpenClaw**: staf Anthropic
  memberi tahu kami bahwa penggunaan ini diizinkan lagi

OpenAI Codex OAuth secara eksplisit didukung untuk digunakan di alat eksternal seperti
OpenClaw. Halaman ini menjelaskan:

Untuk Anthropic dalam produksi, autentikasi kunci API adalah jalur yang lebih aman dan direkomendasikan.

- cara kerja **pertukaran token** OAuth (PKCE)
- tempat token **disimpan** (dan alasannya)
- cara menangani **beberapa akun** (profil + override per sesi)

OpenClaw juga mendukung **plugin penyedia** yang menyertakan alur OAuth atau kunci API
mereka sendiri. Jalankan melalui:

```bash
openclaw models auth login --provider <id>
```

## Token sink (mengapa ini ada)

Penyedia OAuth biasanya menerbitkan **refresh token baru** selama alur login/refresh. Beberapa penyedia (atau klien OAuth) dapat membuat refresh token lama menjadi tidak valid saat refresh token baru diterbitkan untuk pengguna/aplikasi yang sama.

Gejala praktis:

- Anda login melalui OpenClaw _dan_ melalui Claude Code / Codex CLI → salah satunya nanti akan secara acak “logout”

Untuk mengurangi hal itu, OpenClaw memperlakukan `auth-profiles.json` sebagai **token sink**:

- runtime membaca kredensial dari **satu tempat**
- kami dapat menyimpan beberapa profil dan merutekannya secara deterministik
- penggunaan ulang CLI eksternal bersifat spesifik per penyedia: Codex CLI dapat melakukan bootstrap profil
  `openai-codex:default` yang kosong, tetapi setelah OpenClaw memiliki profil OAuth lokal,
  refresh token lokal menjadi kanonis; integrasi lain dapat tetap
  dikelola secara eksternal dan membaca ulang penyimpanan autentikasi CLI mereka

## Penyimpanan (tempat token berada)

Secret disimpan **per agen**:

- Profil autentikasi (OAuth + kunci API + ref tingkat nilai opsional): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File kompatibilitas lama: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis dibersihkan saat ditemukan)

File lama khusus impor (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat penggunaan pertama)

Semua yang di atas juga menghormati `$OPENCLAW_STATE_DIR` (override direktori status). Referensi lengkap: [/gateway/configuration](/id/gateway/configuration-reference#auth-storage)

Untuk ref secret statis dan perilaku aktivasi snapshot runtime, lihat [Secrets Management](/id/gateway/secrets).

## Kompatibilitas token lama Anthropic

<Warning>
Dokumentasi publik Claude Code dari Anthropic menyatakan bahwa penggunaan langsung Claude Code tetap berada dalam
batas langganan Claude, dan staf Anthropic memberi tahu kami bahwa penggunaan Claude
CLI bergaya OpenClaw diizinkan lagi. Karena itu, OpenClaw memperlakukan penggunaan ulang Claude CLI dan
penggunaan `claude -p` sebagai hal yang diizinkan untuk integrasi ini kecuali Anthropic
menerbitkan kebijakan baru.

Untuk dokumentasi paket langsung Claude Code saat ini dari Anthropic, lihat [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
dan [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jika Anda ingin opsi bergaya langganan lain di OpenClaw, lihat [OpenAI
Codex](/id/providers/openai), [Qwen Cloud Coding
Plan](/id/providers/qwen), [MiniMax Coding Plan](/id/providers/minimax),
dan [Z.AI / GLM Coding Plan](/id/providers/glm).
</Warning>

OpenClaw juga mengekspos setup-token Anthropic sebagai jalur token-auth yang didukung, tetapi sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.

## Migrasi Anthropic Claude CLI

OpenClaw kembali mendukung penggunaan ulang Anthropic Claude CLI. Jika Anda sudah memiliki login
Claude lokal di host, onboarding/configure dapat langsung menggunakannya kembali.

## Pertukaran OAuth (cara kerja login)

Alur login interaktif OpenClaw diimplementasikan di `@mariozechner/pi-ai` dan dihubungkan ke wizard/perintah.

### Setup-token Anthropic

Bentuk alur:

1. mulai setup-token Anthropic atau paste-token dari OpenClaw
2. OpenClaw menyimpan kredensial Anthropic yang dihasilkan dalam profil autentikasi
3. pemilihan model tetap pada `anthropic/...`
4. profil autentikasi Anthropic yang ada tetap tersedia untuk rollback/kontrol urutan

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth secara eksplisit didukung untuk digunakan di luar Codex CLI, termasuk alur kerja OpenClaw.

Bentuk alur (PKCE):

1. hasilkan verifier/challenge PKCE + `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...`
3. coba tangkap callback di `http://127.0.0.1:1455/auth/callback`
4. jika callback tidak dapat bind (atau Anda remote/headless), tempel URL/kode redirect
5. tukarkan di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari access token dan simpan `{ access, refresh, expires, accountId }`

Jalur wizard adalah `openclaw onboard` → pilihan autentikasi `openai-codex`.

## Refresh + kedaluwarsa

Profil menyimpan timestamp `expires`.

Saat runtime:

- jika `expires` ada di masa depan → gunakan access token yang tersimpan
- jika kedaluwarsa → refresh (di bawah file lock) dan timpa kredensial yang tersimpan
- pengecualian: beberapa kredensial CLI eksternal tetap dikelola secara eksternal; OpenClaw
  membaca ulang penyimpanan autentikasi CLI tersebut alih-alih menggunakan refresh token yang disalin.
  Bootstrap Codex CLI sengaja lebih sempit: ia mengisi profil
  `openai-codex:default` yang kosong, lalu refresh yang dimiliki OpenClaw menjaga profil lokal
  tetap kanonis.

Alur refresh bersifat otomatis; Anda umumnya tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Disarankan: agen terpisah

Jika Anda ingin “pribadi” dan “kerja” tidak pernah berinteraksi, gunakan agen terisolasi (sesi + kredensial + workspace terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Lalu konfigurasikan autentikasi per agen (wizard) dan rutekan chat ke agen yang tepat.

### 2) Lanjutan: beberapa profil dalam satu agen

`auth-profiles.json` mendukung beberapa ID profil untuk penyedia yang sama.

Pilih profil yang digunakan:

- secara global melalui urutan konfigurasi (`auth.order`)
- per sesi melalui `/model ...@<profileId>`

Contoh (override sesi):

- `/model Opus@anthropic:work`

Cara melihat ID profil yang ada:

- `openclaw channels list --json` (menampilkan `auth[]`)

Dokumentasi terkait:

- [Model failover](/id/concepts/model-failover) (aturan rotasi + cooldown)
- [Slash commands](/id/tools/slash-commands) (permukaan perintah)

## Terkait

- [Authentication](/id/gateway/authentication) — ikhtisar autentikasi penyedia model
- [Secrets](/id/gateway/secrets) — penyimpanan kredensial dan SecretRef
- [Configuration Reference](/id/gateway/configuration-reference#auth-storage) — key konfigurasi autentikasi
