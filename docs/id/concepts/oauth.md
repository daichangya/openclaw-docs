---
read_when:
    - Anda ingin memahami OAuth OpenClaw secara menyeluruh
    - Anda mengalami masalah token tidak valid / logout
    - Anda menginginkan alur autentikasi Claude CLI atau OAuth
    - Anda menginginkan beberapa akun atau perutean profil
summary: 'OAuth di OpenClaw: pertukaran token, penyimpanan, dan pola multi-akun'
title: OAuth
x-i18n:
    generated_at: "2026-04-07T09:13:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4117fee70e3e64fd3a762403454ac2b78de695d2b85a7146750c6de615921e02
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw mendukung “autentikasi langganan” melalui OAuth untuk penyedia yang menawarkannya
(khususnya **OpenAI Codex (ChatGPT OAuth)**). Untuk Anthropic, pembagian praktisnya
sekarang adalah:

- **Kunci API Anthropic**: penagihan API Anthropic normal
- **Autentikasi langganan Anthropic Claude CLI / di dalam OpenClaw**: staf Anthropic
  memberi tahu kami bahwa penggunaan ini diizinkan lagi

OpenAI Codex OAuth secara eksplisit didukung untuk digunakan di alat eksternal seperti
OpenClaw. Halaman ini menjelaskan:

Untuk Anthropic dalam produksi, autentikasi kunci API adalah jalur yang lebih aman dan direkomendasikan.

- cara kerja **pertukaran token** OAuth (PKCE)
- tempat token **disimpan** (dan alasannya)
- cara menangani **beberapa akun** (profil + override per sesi)

OpenClaw juga mendukung **plugin penyedia** yang membawa alur OAuth atau kunci API
mereka sendiri. Jalankan melalui:

```bash
openclaw models auth login --provider <id>
```

## Token sink (mengapa ini ada)

Penyedia OAuth umumnya menerbitkan **refresh token baru** selama alur login/refresh. Beberapa penyedia (atau klien OAuth) dapat membatalkan refresh token lama ketika token baru diterbitkan untuk pengguna/aplikasi yang sama.

Gejala praktis:

- Anda login melalui OpenClaw _dan_ melalui Claude Code / Codex CLI → salah satunya nanti secara acak “logout”

Untuk mengurangi hal itu, OpenClaw memperlakukan `auth-profiles.json` sebagai **token sink**:

- runtime membaca kredensial dari **satu tempat**
- kami dapat menyimpan beberapa profil dan merutekannya secara deterministik
- ketika kredensial digunakan ulang dari CLI eksternal seperti Codex CLI, OpenClaw
  mencerminkannya dengan provenance dan membaca ulang sumber eksternal tersebut, bukan
  memutar refresh token itu sendiri

## Penyimpanan (tempat token berada)

Rahasia disimpan **per-agent**:

- Profil auth (OAuth + kunci API + ref tingkat nilai opsional): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- File kompatibilitas legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entri `api_key` statis akan dibersihkan saat ditemukan)

File legacy khusus impor (masih didukung, tetapi bukan penyimpanan utama):

- `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat pertama kali digunakan)

Semua hal di atas juga menghormati `$OPENCLAW_STATE_DIR` (override direktori state). Referensi lengkap: [/gateway/configuration](/id/gateway/configuration-reference#auth-storage)

Untuk ref rahasia statis dan perilaku aktivasi snapshot runtime, lihat [Manajemen Rahasia](/id/gateway/secrets).

## Kompatibilitas token legacy Anthropic

<Warning>
Dokumentasi publik Claude Code Anthropic menyatakan bahwa penggunaan Claude Code secara langsung tetap berada dalam
batas langganan Claude, dan staf Anthropic memberi tahu kami bahwa penggunaan Claude
CLI bergaya OpenClaw diizinkan lagi. Karena itu, OpenClaw memperlakukan penggunaan ulang Claude CLI dan
penggunaan `claude -p` sebagai hal yang diizinkan untuk integrasi ini kecuali Anthropic
menerbitkan kebijakan baru.

Untuk dokumentasi rencana Claude Code langsung Anthropic saat ini, lihat [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
dan [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Jika Anda menginginkan opsi bergaya langganan lain di OpenClaw, lihat [OpenAI
Codex](/id/providers/openai), [Qwen Cloud Coding
Plan](/id/providers/qwen), [MiniMax Coding Plan](/id/providers/minimax),
dan [Z.AI / GLM Coding Plan](/id/providers/glm).
</Warning>

OpenClaw juga mengekspos setup-token Anthropic sebagai jalur token-auth yang didukung, tetapi sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` jika tersedia.

## Migrasi Anthropic Claude CLI

OpenClaw kembali mendukung penggunaan ulang Anthropic Claude CLI. Jika Anda sudah memiliki login
Claude lokal pada host, onboarding/configure dapat langsung menggunakannya kembali.

## Pertukaran OAuth (cara login bekerja)

Alur login interaktif OpenClaw diimplementasikan di `@mariozechner/pi-ai` dan dihubungkan ke wizard/perintah.

### Setup-token Anthropic

Bentuk alur:

1. mulai setup-token Anthropic atau paste-token dari OpenClaw
2. OpenClaw menyimpan kredensial Anthropic yang dihasilkan dalam profil auth
3. pemilihan model tetap pada `anthropic/...`
4. profil auth Anthropic yang ada tetap tersedia untuk kontrol rollback/urutan

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth secara eksplisit didukung untuk penggunaan di luar Codex CLI, termasuk alur kerja OpenClaw.

Bentuk alur (PKCE):

1. hasilkan verifier/challenge PKCE + `state` acak
2. buka `https://auth.openai.com/oauth/authorize?...`
3. coba tangkap callback di `http://127.0.0.1:1455/auth/callback`
4. jika callback tidak dapat bind (atau Anda remote/headless), tempel URL/code redirect
5. lakukan pertukaran di `https://auth.openai.com/oauth/token`
6. ekstrak `accountId` dari access token dan simpan `{ access, refresh, expires, accountId }`

Jalur wizard adalah `openclaw onboard` → pilihan auth `openai-codex`.

## Refresh + kedaluwarsa

Profil menyimpan stempel waktu `expires`.

Saat runtime:

- jika `expires` masih di masa depan → gunakan access token yang tersimpan
- jika sudah kedaluwarsa → refresh (di bawah file lock) dan timpa kredensial yang tersimpan
- pengecualian: kredensial CLI eksternal yang digunakan ulang tetap dikelola secara eksternal; OpenClaw
  membaca ulang penyimpanan auth CLI dan tidak pernah menggunakan refresh token yang disalin itu sendiri

Alur refresh berlangsung otomatis; secara umum Anda tidak perlu mengelola token secara manual.

## Beberapa akun (profil) + perutean

Dua pola:

### 1) Disarankan: agent terpisah

Jika Anda ingin “pribadi” dan “kerja” tidak pernah saling berinteraksi, gunakan agent yang terisolasi (sesi + kredensial + workspace terpisah):

```bash
openclaw agents add work
openclaw agents add personal
```

Lalu konfigurasi auth per-agent (wizard) dan arahkan chat ke agent yang tepat.

### 2) Lanjutan: beberapa profil dalam satu agent

`auth-profiles.json` mendukung beberapa ID profil untuk penyedia yang sama.

Pilih profil yang digunakan:

- secara global melalui urutan config (`auth.order`)
- per sesi melalui `/model ...@<profileId>`

Contoh (override sesi):

- `/model Opus@anthropic:work`

Cara melihat ID profil yang ada:

- `openclaw channels list --json` (menampilkan `auth[]`)

Dokumentasi terkait:

- [/concepts/model-failover](/id/concepts/model-failover) (aturan rotasi + cooldown)
- [/tools/slash-commands](/id/tools/slash-commands) (permukaan perintah)

## Terkait

- [Autentikasi](/id/gateway/authentication) — ikhtisar autentikasi penyedia model
- [Rahasia](/id/gateway/secrets) — penyimpanan kredensial dan SecretRef
- [Referensi Konfigurasi](/id/gateway/configuration-reference#auth-storage) — kunci config auth
