---
read_when:
    - Menambahkan atau memodifikasi CLI models (`models list/set/scan/aliases/fallbacks`)
    - Mengubah perilaku fallback model atau UX pemilihan
    - Memperbarui probe scan model (tools/images)
summary: 'CLI Models: daftar, set, alias, fallback, scan, status'
title: CLI Models
x-i18n:
    generated_at: "2026-04-25T13:45:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

Lihat [/concepts/model-failover](/id/concepts/model-failover) untuk rotasi profil auth,
cooldown, dan bagaimana hal itu berinteraksi dengan fallback.
Ringkasan provider cepat + contoh: [/concepts/model-providers](/id/concepts/model-providers).
Ref model memilih provider dan model. Biasanya ref ini tidak memilih
runtime agen tingkat rendah. Misalnya, `openai/gpt-5.5` dapat berjalan melalui jalur provider OpenAI
normal atau melalui runtime app-server Codex, tergantung pada
`agents.defaults.embeddedHarness.runtime`. Lihat
[/concepts/agent-runtimes](/id/concepts/agent-runtimes).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan ini:

1. Model **primary** (`agents.defaults.model.primary` atau `agents.defaults.model`).
2. **Fallback** di `agents.defaults.model.fallbacks` (berurutan).
3. **Failover auth provider** terjadi di dalam provider sebelum berpindah ke
   model berikutnya.

Terkait:

- `agents.defaults.models` adalah allowlist/katalog model yang dapat digunakan OpenClaw (plus alias).
- `agents.defaults.imageModel` digunakan **hanya ketika** model primary tidak dapat menerima image.
- `agents.defaults.pdfModel` digunakan oleh alat `pdf`. Jika dihilangkan, alat tersebut
  fallback ke `agents.defaults.imageModel`, lalu ke model sesi/default yang sudah diresolusikan.
- `agents.defaults.imageGenerationModel` digunakan oleh kapabilitas pembuatan image bersama. Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default provider yang didukung auth. Alat ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan image terdaftar lainnya menurut urutan id provider. Jika Anda menetapkan provider/model tertentu, konfigurasi juga auth/API key provider tersebut.
- `agents.defaults.musicGenerationModel` digunakan oleh kapabilitas pembuatan musik bersama. Jika dihilangkan, `music_generate` tetap dapat menyimpulkan default provider yang didukung auth. Alat ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan musik terdaftar lainnya menurut urutan id provider. Jika Anda menetapkan provider/model tertentu, konfigurasi juga auth/API key provider tersebut.
- `agents.defaults.videoGenerationModel` digunakan oleh kapabilitas pembuatan video bersama. Jika dihilangkan, `video_generate` tetap dapat menyimpulkan default provider yang didukung auth. Alat ini mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan video terdaftar lainnya menurut urutan id provider. Jika Anda menetapkan provider/model tertentu, konfigurasi juga auth/API key provider tersebut.
- Default per agen dapat menimpa `agents.defaults.model` melalui `agents.list[].model` plus binding (lihat [/concepts/multi-agent](/id/concepts/multi-agent)).

## Kebijakan model singkat

- Tetapkan primary Anda ke model generasi terbaru terkuat yang tersedia bagi Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan chat dengan konsekuensi lebih rendah.
- Untuk agen dengan alat aktif atau input yang tidak tepercaya, hindari model tingkat lama/lebih lemah.

## Onboarding (disarankan)

Jika Anda tidak ingin mengedit config secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Onboarding dapat menyiapkan model + auth untuk provider umum, termasuk **langganan
OpenAI Code (Codex)** (OAuth) dan **Anthropic** (API key atau Claude CLI).

## Key config (ringkasan)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parameter provider)
- `models.providers` (provider kustom yang ditulis ke dalam `models.json`)

Ref model dinormalisasi ke huruf kecil. Alias provider seperti `z.ai/*` dinormalisasi
menjadi `zai/*`.

Contoh konfigurasi provider (termasuk OpenCode) ada di
[/providers/opencode](/id/providers/opencode).

### Edit allowlist yang aman

Gunakan penulisan aditif saat memperbarui `agents.defaults.models` secara manual:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` melindungi map model/provider dari penimpaan tidak sengaja. Penetapan objek biasa ke `agents.defaults.models`, `models.providers`, atau
`models.providers.<id>.models` ditolak ketika hal itu akan menghapus entri yang sudah ada.
Gunakan `--merge` untuk perubahan aditif; gunakan `--replace` hanya ketika nilai yang
diberikan memang harus menjadi seluruh nilai target.

Setup provider interaktif dan `openclaw configure --section model` juga menggabungkan
pilihan per-scope provider ke allowlist yang ada, sehingga menambahkan Codex,
Ollama, atau provider lain tidak menghapus entri model yang tidak terkait.
Configure mempertahankan `agents.defaults.model.primary` yang sudah ada saat provider
auth diterapkan ulang. Perintah penetapan default eksplisit seperti
`openclaw models auth login --provider <id> --set-default` dan
`openclaw models set <model>` tetap mengganti `agents.defaults.model.primary`.

## "Model is not allowed" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` disetel, itu menjadi **allowlist** untuk `/model` dan untuk
override sesi. Saat pengguna memilih model yang tidak ada di allowlist tersebut,
OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Ini terjadi **sebelum** balasan normal dibuat, sehingga pesannya bisa terasa
seperti “tidak merespons.” Perbaikannya adalah:

- Tambahkan model ke `agents.defaults.models`, atau
- Hapus allowlist (hapus `agents.defaults.models`), atau
- Pilih model dari `/model list`.

Contoh config allowlist:

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

- `/model` (dan `/model list`) adalah pemilih ringkas bernomor (keluarga model + provider yang tersedia).
- Di Discord, `/model` dan `/models` membuka pemilih interaktif dengan dropdown provider dan model plus langkah Submit.
- `/models add` sudah deprecated dan sekarang mengembalikan pesan deprecasi alih-alih mendaftarkan model dari chat.
- `/model <#>` memilih dari pemilih tersebut.
- `/model` menyimpan pilihan sesi baru segera.
- Jika agen idle, eksekusi berikutnya langsung menggunakan model baru.
- Jika eksekusi sudah aktif, OpenClaw menandai perpindahan live sebagai pending dan hanya me-restart ke model baru pada titik retry yang bersih.
- Jika aktivitas alat atau output balasan sudah dimulai, perpindahan pending dapat tetap dalam antrean hingga peluang retry berikutnya atau giliran pengguna berikutnya.
- `/model status` adalah tampilan terperinci (kandidat auth dan, jika dikonfigurasi, endpoint provider `baseUrl` + mode `api`).
- Ref model diparse dengan memisahkan pada **`/` pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
- Jika id model itu sendiri berisi `/` (gaya OpenRouter), Anda harus menyertakan prefix provider (contoh: `/model openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw me-resolve input dalam urutan ini:
  1. kecocokan alias
  2. kecocokan provider terkonfigurasi yang unik untuk id model tanpa prefix yang persis sama
  3. fallback deprecated ke provider default yang dikonfigurasi
     Jika provider tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
     akan fallback ke provider/model pertama yang dikonfigurasi untuk menghindari
     menampilkan default provider yang sudah usang dan dihapus.

Perilaku/config perintah lengkap: [Slash commands](/id/tools/slash-commands).

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
- `--provider <id>`: filter berdasarkan id provider, misalnya `moonshot`; label tampilan dari pemilih interaktif tidak diterima
- `--plain`: satu model per baris
- `--json`: output yang dapat dibaca mesin

`--all` mencakup baris katalog statis milik provider yang dibundel sebelum auth
dikonfigurasi, sehingga tampilan hanya-discovery dapat menampilkan model yang tidak tersedia sampai
Anda menambahkan kredensial provider yang sesuai.

### `models status`

Menampilkan model primary yang sudah diresolusikan, fallback, model image, dan ringkasan auth
provider yang dikonfigurasi. Perintah ini juga menampilkan status kedaluwarsa OAuth untuk profil yang ditemukan
di auth store (memberi peringatan dalam 24 jam secara default). `--plain` hanya mencetak
model primary yang sudah diresolusikan.
Status OAuth selalu ditampilkan (dan disertakan dalam output `--json`). Jika provider yang dikonfigurasi
tidak memiliki kredensial, `models status` mencetak bagian **Missing auth**.
JSON mencakup `auth.oauth` (jendela peringatan + profil) dan `auth.providers`
(auth efektif per provider, termasuk kredensial berbasis env). `auth.oauth`
hanya untuk kesehatan profil auth-store; provider yang hanya berbasis env tidak muncul di sana.
Gunakan `--check` untuk otomasi (exit `1` saat hilang/kedaluwarsa, `2` saat akan kedaluwarsa).
Gunakan `--probe` untuk pemeriksaan auth live; baris probe dapat berasal dari profil auth, kredensial env,
atau `models.json`.
Jika `auth.order.<provider>` eksplisit menghilangkan profil tersimpan, probe melaporkan
`excluded_by_auth_order` alih-alih mencobanya. Jika auth ada tetapi tidak ada model yang bisa diprobe yang dapat diresolusikan untuk provider itu, probe melaporkan `status: no_model`.

Pilihan auth bergantung pada provider/akun. Untuk host gateway yang selalu aktif, API
key biasanya paling dapat diprediksi; penggunaan ulang Claude CLI dan profil
OAuth/token Anthropic yang sudah ada juga didukung.

Contoh (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scanning (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan dapat
secara opsional memprobe model untuk dukungan alat dan image.

Flag utama:

- `--no-probe`: lewati probe live (hanya metadata)
- `--min-params <b>`: ukuran parameter minimum (miliar)
- `--max-age-days <days>`: lewati model yang lebih lama
- `--provider <name>`: filter prefix provider
- `--max-candidates <n>`: ukuran daftar fallback
- `--set-default`: tetapkan `agents.defaults.model.primary` ke pilihan pertama
- `--set-image`: tetapkan `agents.defaults.imageModel.primary` ke pilihan image pertama

Katalog `/models` OpenRouter bersifat publik, sehingga scan hanya-metadata dapat menampilkan
kandidat gratis tanpa key. Probe dan inferensi tetap memerlukan
API key OpenRouter (dari profil auth atau `OPENROUTER_API_KEY`). Jika tidak ada key yang
tersedia, `openclaw models scan` fallback ke output hanya-metadata dan membiarkan
config tidak berubah. Gunakan `--no-probe` untuk meminta mode hanya-metadata secara eksplisit.

Hasil scan diperingkat berdasarkan:

1. Dukungan image
2. Latensi alat
3. Ukuran konteks
4. Jumlah parameter

Input

- daftar `/models` OpenRouter (filter `:free`)
- Probe live memerlukan API key OpenRouter dari profil auth atau `OPENROUTER_API_KEY` (lihat [/environment](/id/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol request/probe: `--timeout`, `--concurrency`

Saat probe live berjalan dalam TTY, Anda dapat memilih fallback secara interaktif. Dalam
mode non-interaktif, teruskan `--yes` untuk menerima default. Hasil hanya-metadata bersifat
informasional; `--set-default` dan `--set-image` memerlukan probe live agar
OpenClaw tidak mengonfigurasi model OpenRouter tanpa key yang tidak dapat digunakan.

## Registry models (`models.json`)

Provider kustom di `models.providers` ditulis ke `models.json` di bawah
direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). File ini
digabungkan secara default kecuali `models.mode` disetel ke `replace`.

Prioritas mode merge untuk ID provider yang cocok:

- `baseUrl` non-kosong yang sudah ada di `models.json` agen akan menang.
- `apiKey` non-kosong di `models.json` agen menang hanya ketika provider tersebut tidak dikelola SecretRef dalam konteks config/auth-profile saat ini.
- Nilai `apiKey` provider yang dikelola SecretRef diperbarui dari marker sumber (`ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec) alih-alih menyimpan secret hasil resolusi.
- Nilai header provider yang dikelola SecretRef diperbarui dari marker sumber (`secretref-env:ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec).
- `apiKey`/`baseUrl` agen yang kosong atau hilang fallback ke config `models.providers`.
- Field provider lainnya diperbarui dari config dan data katalog yang dinormalisasi.

Persistensi marker bersifat source-authoritative: OpenClaw menulis marker dari snapshot config sumber aktif (pra-resolusi), bukan dari nilai secret runtime yang sudah diresolusikan.
Ini berlaku setiap kali OpenClaw meregenerasi `models.json`, termasuk jalur yang didorong perintah seperti `openclaw agent`.

## Terkait

- [Model Providers](/id/concepts/model-providers) — perutean provider dan auth
- [Agent Runtimes](/id/concepts/agent-runtimes) — Pi, Codex, dan runtime loop agen lainnya
- [Model Failover](/id/concepts/model-failover) — rantai fallback
- [Image Generation](/id/tools/image-generation) — konfigurasi model image
- [Music Generation](/id/tools/music-generation) — konfigurasi model musik
- [Video Generation](/id/tools/video-generation) — konfigurasi model video
- [Configuration Reference](/id/gateway/config-agents#agent-defaults) — key config model
