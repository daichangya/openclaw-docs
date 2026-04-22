---
read_when:
    - Menambahkan atau memodifikasi CLI model (`models list/set/scan/aliases/fallbacks`)
    - Mengubah perilaku fallback model atau UX pemilihan
    - Memperbarui probe pemindaian model (tool/gambar)
summary: 'CLI model: daftar, setel, alias, fallback, pemindaian, status'
title: CLI Model
x-i18n:
    generated_at: "2026-04-22T04:21:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf7a17a20bea66e5e8dce134ed08b483417bc70ed875e796609d850aa79280e
    source_path: concepts/models.md
    workflow: 15
---

# CLI Model

Lihat [/concepts/model-failover](/id/concepts/model-failover) untuk rotasi profil
auth, cooldown, dan bagaimana hal itu berinteraksi dengan fallback.
Ikhtisar provider cepat + contoh: [/concepts/model-providers](/id/concepts/model-providers).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan ini:

1. Model **utama** (`agents.defaults.model.primary` atau `agents.defaults.model`).
2. **Fallback** di `agents.defaults.model.fallbacks` (sesuai urutan).
3. **Failover auth provider** terjadi di dalam provider sebelum berpindah ke
   model berikutnya.

Terkait:

- `agents.defaults.models` adalah allowlist/katalog model yang dapat digunakan OpenClaw (ditambah alias).
- `agents.defaults.imageModel` digunakan **hanya ketika** model utama tidak dapat menerima gambar.
- `agents.defaults.pdfModel` digunakan oleh tool `pdf`. Jika dihilangkan, tool
  akan fallback ke `agents.defaults.imageModel`, lalu ke model sesi/default yang
  telah di-resolve.
- `agents.defaults.imageGenerationModel` digunakan oleh surface kapabilitas pembuatan gambar bersama. Jika dihilangkan, `image_generate` tetap dapat menginfer default provider yang didukung auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu sisa provider pembuatan gambar yang terdaftar menurut urutan provider-id. Jika Anda menetapkan provider/model tertentu, konfigurasi juga auth/API key provider tersebut.
- `agents.defaults.musicGenerationModel` digunakan oleh surface kapabilitas pembuatan musik bersama. Jika dihilangkan, `music_generate` tetap dapat menginfer default provider yang didukung auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu sisa provider pembuatan musik yang terdaftar menurut urutan provider-id. Jika Anda menetapkan provider/model tertentu, konfigurasi juga auth/API key provider tersebut.
- `agents.defaults.videoGenerationModel` digunakan oleh surface kapabilitas pembuatan video bersama. Jika dihilangkan, `video_generate` tetap dapat menginfer default provider yang didukung auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu sisa provider pembuatan video yang terdaftar menurut urutan provider-id. Jika Anda menetapkan provider/model tertentu, konfigurasi juga auth/API key provider tersebut.
- Default per-agent dapat menimpa `agents.defaults.model` melalui `agents.list[].model` ditambah binding (lihat [/concepts/multi-agent](/id/concepts/multi-agent)).

## Kebijakan model cepat

- Tetapkan model utama Anda ke model generasi terbaru terkuat yang tersedia bagi Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan chat berisiko lebih rendah.
- Untuk agent dengan tool aktif atau input yang tidak tepercaya, hindari tier model yang lebih tua/lebih lemah.

## Onboarding (disarankan)

Jika Anda tidak ingin mengedit konfigurasi secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Ini dapat menyiapkan model + auth untuk provider umum, termasuk **langganan
OpenAI Code (Codex)** (OAuth) dan **Anthropic** (API key atau Claude CLI).

## Kunci konfigurasi (ikhtisar)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parameter provider)
- `models.providers` (provider kustom yang ditulis ke `models.json`)

Ref model dinormalisasi ke huruf kecil. Alias provider seperti `z.ai/*` dinormalisasi
menjadi `zai/*`.

Contoh konfigurasi provider (termasuk OpenCode) ada di
[/providers/opencode](/id/providers/opencode).

## "Model is not allowed" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` ditetapkan, itu menjadi **allowlist** untuk `/model` dan untuk
override sesi. Saat pengguna memilih model yang tidak ada dalam allowlist itu,
OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Ini terjadi **sebelum** balasan normal dibuat, sehingga pesannya dapat terasa
seperti “tidak merespons.” Perbaikannya adalah salah satu dari berikut ini:

- Tambahkan model ke `agents.defaults.models`, atau
- Hapus allowlist (hapus `agents.defaults.models`), atau
- Pilih model dari `/model list`.

Contoh konfigurasi allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Mengganti model di chat (`/model`)

Anda dapat mengganti model untuk sesi saat ini tanpa restart:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Catatan:

- `/model` (dan `/model list`) adalah picker ringkas bernomor (keluarga model + provider yang tersedia).
- Di Discord, `/model` dan `/models` membuka picker interaktif dengan dropdown provider dan model plus langkah Submit.
- `/model <#>` memilih dari picker tersebut.
- `/model` segera menyimpan pilihan sesi baru.
- Jika agent idle, run berikutnya langsung menggunakan model baru.
- Jika run sudah aktif, OpenClaw menandai switch langsung sebagai pending dan hanya restart ke model baru pada titik retry yang bersih.
- Jika aktivitas tool atau output balasan sudah dimulai, switch yang pending dapat tetap antre sampai ada peluang retry berikutnya atau giliran pengguna berikutnya.
- `/model status` adalah tampilan detail (kandidat auth dan, bila dikonfigurasi, `baseUrl` endpoint provider + mode `api`).
- Ref model di-parse dengan membagi pada `/` **pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
- Jika ID model itu sendiri berisi `/` (gaya OpenRouter), Anda harus menyertakan prefiks provider (contoh: `/model openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw me-resolve input dalam urutan ini:
  1. kecocokan alias
  2. kecocokan provider-terkonfigurasi unik untuk model id tanpa prefiks yang persis sama
  3. fallback usang ke provider default yang dikonfigurasi
     Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
     sebagai gantinya melakukan fallback ke provider/model terkonfigurasi pertama untuk menghindari
     menampilkan default provider yang usang dan sudah dihapus.

Perilaku/konfigurasi perintah lengkap: [Slash commands](/id/tools/slash-commands).

## Perintah CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (tanpa subperintah) adalah shortcut untuk `models status`.

### `models list`

Secara default menampilkan model yang dikonfigurasi. Flag yang berguna:

- `--all`: katalog lengkap
- `--local`: hanya provider lokal
- `--provider <name>`: filter berdasarkan provider
- `--plain`: satu model per baris
- `--json`: output yang dapat dibaca mesin

`--all` menyertakan baris katalog statis milik provider bawaan sebelum auth
dikonfigurasi, sehingga tampilan discovery-only dapat menampilkan model yang tidak tersedia sampai
Anda menambahkan kredensial provider yang sesuai.

### `models status`

Menampilkan model utama yang telah di-resolve, fallback, model gambar, dan ikhtisar auth
provider yang dikonfigurasi. Perintah ini juga menampilkan status kedaluwarsa OAuth untuk profil yang ditemukan
di penyimpanan auth (memberi peringatan dalam 24 jam secara default). `--plain` hanya mencetak
model utama yang telah di-resolve.
Status OAuth selalu ditampilkan (dan disertakan dalam output `--json`). Jika provider yang dikonfigurasi
tidak memiliki kredensial, `models status` mencetak bagian **Missing auth**.
JSON mencakup `auth.oauth` (jendela peringatan + profil) dan `auth.providers`
(auth efektif per provider, termasuk kredensial berbasis env). `auth.oauth`
hanya untuk kesehatan profil auth-store; provider yang hanya berbasis env tidak muncul di sana.
Gunakan `--check` untuk otomasi (exit `1` saat missing/expired, `2` saat akan kedaluwarsa).
Gunakan `--probe` untuk pemeriksaan auth langsung; baris probe dapat berasal dari profil auth, kredensial env,
atau `models.json`.
Jika `auth.order.<provider>` yang eksplisit menghilangkan profil tersimpan, probe melaporkan
`excluded_by_auth_order` alih-alih mencobanya. Jika auth ada tetapi tidak ada model yang dapat diprobe
yang dapat di-resolve untuk provider tersebut, probe melaporkan `status: no_model`.

Pilihan auth bergantung pada provider/akun. Untuk host gateway yang selalu aktif, API
key biasanya paling dapat diprediksi; penggunaan ulang Claude CLI dan profil
OAuth/token Anthropic yang ada juga didukung.

Contoh (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Pemindaian (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan dapat
secara opsional memprobe model untuk dukungan tool dan gambar.

Flag utama:

- `--no-probe`: lewati probe langsung (hanya metadata)
- `--min-params <b>`: ukuran parameter minimum (miliar)
- `--max-age-days <days>`: lewati model yang lebih lama
- `--provider <name>`: filter prefiks provider
- `--max-candidates <n>`: ukuran daftar fallback
- `--set-default`: set `agents.defaults.model.primary` ke pilihan pertama
- `--set-image`: set `agents.defaults.imageModel.primary` ke pilihan gambar pertama

Probing memerlukan API key OpenRouter (dari profil auth atau
`OPENROUTER_API_KEY`). Tanpa key, gunakan `--no-probe` untuk hanya menampilkan kandidat.

Hasil pemindaian diberi peringkat berdasarkan:

1. Dukungan gambar
2. Latensi tool
3. Ukuran konteks
4. Jumlah parameter

Input

- Daftar `/models` OpenRouter (filter `:free`)
- Memerlukan API key OpenRouter dari profil auth atau `OPENROUTER_API_KEY` (lihat [/environment](/id/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol probe: `--timeout`, `--concurrency`

Saat dijalankan di TTY, Anda dapat memilih fallback secara interaktif. Dalam mode non-interaktif,
berikan `--yes` untuk menerima default.

## Registry model (`models.json`)

Provider kustom di `models.providers` ditulis ke `models.json` di bawah direktori
agent (default `~/.openclaw/agents/<agentId>/agent/models.json`). File ini
digabungkan secara default kecuali `models.mode` disetel ke `replace`.

Prioritas mode merge untuk provider ID yang cocok:

- `baseUrl` non-kosong yang sudah ada di `models.json` agent akan menang.
- `apiKey` non-kosong di `models.json` agent menang hanya ketika provider tersebut tidak dikelola SecretRef dalam konteks config/profil-auth saat ini.
- Nilai `apiKey` provider yang dikelola SecretRef disegarkan dari marker sumber (`ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec) alih-alih menyimpan secret yang sudah di-resolve.
- Nilai header provider yang dikelola SecretRef disegarkan dari marker sumber (`secretref-env:ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec).
- `apiKey`/`baseUrl` agent yang kosong atau hilang melakukan fallback ke config `models.providers`.
- Field provider lain disegarkan dari config dan data katalog yang dinormalisasi.

Persistensi marker bersifat source-authoritative: OpenClaw menulis marker dari snapshot config sumber aktif (pra-resolve), bukan dari nilai secret runtime yang sudah di-resolve.
Ini berlaku setiap kali OpenClaw meregenerasi `models.json`, termasuk jalur yang dipicu perintah seperti `openclaw agent`.

## Terkait

- [Model Providers](/id/concepts/model-providers) — routing provider dan auth
- [Model Failover](/id/concepts/model-failover) — rantai fallback
- [Image Generation](/id/tools/image-generation) — konfigurasi model gambar
- [Music Generation](/id/tools/music-generation) — konfigurasi model musik
- [Video Generation](/id/tools/video-generation) — konfigurasi model video
- [Configuration Reference](/id/gateway/configuration-reference#agent-defaults) — kunci konfigurasi model
