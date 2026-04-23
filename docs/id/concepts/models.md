---
read_when:
    - Menambahkan atau memodifikasi CLI models (models list/set/scan/aliases/fallbacks)
    - Mengubah perilaku fallback model atau UX pemilihan model
    - Memperbarui probe pemindaian model (tool/gambar)
summary: 'CLI Models: list, set, alias, fallback, scan, status'
title: CLI Models
x-i18n:
    generated_at: "2026-04-23T09:20:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46916d9600a4e4aebdb026aa42df39149d8b6d438a8a7e85a61053dfc8f76dcc
    source_path: concepts/models.md
    workflow: 15
---

# CLI Models

Lihat [/concepts/model-failover](/id/concepts/model-failover) untuk rotasi profil auth,
cooldown, dan bagaimana hal itu berinteraksi dengan fallback.
Ikhtisar provider cepat + contoh: [/concepts/model-providers](/id/concepts/model-providers).

## Cara kerja pemilihan model

OpenClaw memilih model dalam urutan ini:

1. Model **utama** (`agents.defaults.model.primary` atau `agents.defaults.model`).
2. **Fallback** di `agents.defaults.model.fallbacks` (sesuai urutan).
3. **Failover auth provider** terjadi di dalam provider sebelum berpindah ke
   model berikutnya.

Terkait:

- `agents.defaults.models` adalah allowlist/katalog model yang dapat digunakan OpenClaw (plus alias).
- `agents.defaults.imageModel` digunakan **hanya ketika** model utama tidak dapat menerima gambar.
- `agents.defaults.pdfModel` digunakan oleh tool `pdf`. Jika dihilangkan, tool
  akan fallback ke `agents.defaults.imageModel`, lalu model sesi/default yang sudah di-resolve.
- `agents.defaults.imageGenerationModel` digunakan oleh kemampuan pembuatan gambar bersama. Jika dihilangkan, `image_generate` tetap dapat menyimpulkan default provider yang didukung auth. Ia mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan gambar terdaftar lainnya dalam urutan provider-id. Jika Anda menetapkan provider/model tertentu, konfigurasikan juga auth/API key provider tersebut.
- `agents.defaults.musicGenerationModel` digunakan oleh kemampuan pembuatan musik bersama. Jika dihilangkan, `music_generate` tetap dapat menyimpulkan default provider yang didukung auth. Ia mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan musik terdaftar lainnya dalam urutan provider-id. Jika Anda menetapkan provider/model tertentu, konfigurasikan juga auth/API key provider tersebut.
- `agents.defaults.videoGenerationModel` digunakan oleh kemampuan pembuatan video bersama. Jika dihilangkan, `video_generate` tetap dapat menyimpulkan default provider yang didukung auth. Ia mencoba provider default saat ini terlebih dahulu, lalu provider pembuatan video terdaftar lainnya dalam urutan provider-id. Jika Anda menetapkan provider/model tertentu, konfigurasikan juga auth/API key provider tersebut.
- Default per agen dapat mengoverride `agents.defaults.model` melalui `agents.list[].model` plus binding (lihat [/concepts/multi-agent](/id/concepts/multi-agent)).

## Kebijakan model cepat

- Atur model utama Anda ke model generasi terbaru terkuat yang tersedia bagi Anda.
- Gunakan fallback untuk tugas yang sensitif terhadap biaya/latensi dan chat dengan taruhan lebih rendah.
- Untuk agen yang mengaktifkan tool atau input tidak tepercaya, hindari model tingkat lama/lebih lemah.

## Onboarding (disarankan)

Jika Anda tidak ingin mengedit config secara manual, jalankan onboarding:

```bash
openclaw onboard
```

Perintah ini dapat menyiapkan model + auth untuk provider umum, termasuk **langganan
OpenAI Code (Codex)** (OAuth) dan **Anthropic** (API key atau Claude CLI).

## Kunci config (ikhtisar)

- `agents.defaults.model.primary` dan `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` dan `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` dan `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` dan `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` dan `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + parameter provider)
- `models.providers` (provider kustom yang ditulis ke `models.json`)

Ref model dinormalisasi ke huruf kecil. Alias provider seperti `z.ai/*` dinormalisasi
menjadi `zai/*`.

Contoh konfigurasi provider (termasuk OpenCode) tersedia di
[/providers/opencode](/id/providers/opencode).

### Edit allowlist yang aman

Gunakan penulisan aditif saat memperbarui `agents.defaults.models` secara manual:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` melindungi peta model/provider dari tertimpa secara tidak sengaja. Penetapan
objek polos ke `agents.defaults.models`, `models.providers`, atau
`models.providers.<id>.models` ditolak jika akan menghapus entri yang sudah ada.
Gunakan `--merge` untuk perubahan aditif; gunakan `--replace` hanya ketika nilai yang
diberikan harus menjadi nilai target lengkap.

Penyiapan provider interaktif dan `openclaw configure --section model` juga menggabungkan
pilihan yang dicakup ke provider ke allowlist yang ada, sehingga menambahkan Codex,
Ollama, atau provider lain tidak menghapus entri model yang tidak terkait.

## "Model is not allowed" (dan mengapa balasan berhenti)

Jika `agents.defaults.models` diatur, itu menjadi **allowlist** untuk `/model` dan untuk
override sesi. Saat pengguna memilih model yang tidak ada dalam allowlist itu,
OpenClaw mengembalikan:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Ini terjadi **sebelum** balasan normal dihasilkan, sehingga pesan bisa terasa
seperti “tidak merespons.” Perbaikannya adalah:

- Tambahkan model ke `agents.defaults.models`, atau
- Kosongkan allowlist (hapus `agents.defaults.models`), atau
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
- `/models add` tersedia secara default dan dapat dinonaktifkan dengan `commands.modelsWrite=false`.
- Saat diaktifkan, `/models add <provider> <modelId>` adalah jalur tercepat; `/models add` tanpa argumen memulai alur terpandu yang mengutamakan provider bila didukung.
- Setelah `/models add`, model baru tersedia di `/models` dan `/model` tanpa restart gateway.
- `/model <#>` memilih dari pemilih tersebut.
- `/model` memersistensikan pilihan sesi baru segera.
- Jika agen sedang idle, eksekusi berikutnya langsung menggunakan model baru.
- Jika eksekusi sudah aktif, OpenClaw menandai live switch sebagai tertunda dan hanya restart ke model baru pada titik retry yang bersih.
- Jika aktivitas tool atau output balasan sudah dimulai, live switch yang tertunda bisa tetap antre sampai kesempatan retry berikutnya atau giliran pengguna berikutnya.
- `/model status` adalah tampilan detail (kandidat auth dan, jika dikonfigurasi, endpoint provider `baseUrl` + mode `api`).
- Ref model di-parse dengan memisahkan pada `/` **pertama**. Gunakan `provider/model` saat mengetik `/model <ref>`.
- Jika id model itu sendiri berisi `/` (gaya OpenRouter), Anda harus menyertakan prefiks provider (contoh: `/model openrouter/moonshotai/kimi-k2`).
- Jika Anda menghilangkan provider, OpenClaw me-resolve input dalam urutan ini:
  1. kecocokan alias
  2. kecocokan provider terkonfigurasi unik untuk id model tanpa prefiks yang persis sama
  3. fallback deprecated ke provider default yang dikonfigurasi
     Jika provider itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw
     akan fallback ke provider/model terkonfigurasi pertama untuk menghindari
     menampilkan default provider terhapus yang usang.

Perilaku/config perintah lengkap: [Perintah slash](/id/tools/slash-commands).

Contoh:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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
- `--provider <id>`: filter berdasarkan id provider, misalnya `moonshot`; label tampilan
  dari pemilih interaktif tidak diterima
- `--plain`: satu model per baris
- `--json`: output yang dapat dibaca mesin

`--all` mencakup baris katalog statis milik provider bawaan sebelum auth
dikonfigurasi, sehingga tampilan khusus discovery dapat menampilkan model yang tidak tersedia sampai
Anda menambahkan kredensial provider yang sesuai.

### `models status`

Menampilkan model utama yang di-resolve, fallback, image model, dan ikhtisar auth
provider yang dikonfigurasi. Perintah ini juga menampilkan status kedaluwarsa OAuth untuk profil yang ditemukan
di auth store (peringatan dalam 24 jam secara default). `--plain` hanya mencetak
model utama yang di-resolve.
Status OAuth selalu ditampilkan (dan disertakan dalam output `--json`). Jika provider yang dikonfigurasi
tidak memiliki kredensial, `models status` mencetak bagian **Missing auth**.
JSON mencakup `auth.oauth` (jendela peringatan + profil) dan `auth.providers`
(auth efektif per provider, termasuk kredensial berbasis env). `auth.oauth`
hanya kesehatan profil auth-store; provider yang hanya berbasis env tidak muncul di sana.
Gunakan `--check` untuk otomasi (keluar `1` saat hilang/kedaluwarsa, `2` saat akan kedaluwarsa).
Gunakan `--probe` untuk pemeriksaan auth langsung; baris probe dapat berasal dari profil auth, kredensial env,
atau `models.json`.
Jika `auth.order.<provider>` eksplisit menghilangkan profil tersimpan, probe melaporkan
`excluded_by_auth_order` alih-alih mencobanya. Jika auth ada tetapi tidak ada model yang bisa diprobe
untuk provider itu, probe melaporkan `status: no_model`.

Pilihan auth bergantung pada provider/akun. Untuk host gateway yang selalu aktif, API
key biasanya paling dapat diprediksi; penggunaan ulang Claude CLI dan profil
OAuth/token Anthropic yang ada juga didukung.

Contoh (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Pemindaian (model gratis OpenRouter)

`openclaw models scan` memeriksa **katalog model gratis** OpenRouter dan secara
opsional dapat memprobe model untuk dukungan tool dan gambar.

Flag utama:

- `--no-probe`: lewati probe langsung (hanya metadata)
- `--min-params <b>`: ukuran parameter minimum (miliar)
- `--max-age-days <days>`: lewati model yang lebih lama
- `--provider <name>`: filter prefiks provider
- `--max-candidates <n>`: ukuran daftar fallback
- `--set-default`: set `agents.defaults.model.primary` ke pilihan pertama
- `--set-image`: set `agents.defaults.imageModel.primary` ke pilihan gambar pertama

Probing memerlukan OpenRouter API key (dari profil auth atau
`OPENROUTER_API_KEY`). Tanpa key, gunakan `--no-probe` untuk hanya mencantumkan kandidat.

Hasil scan diperingkat berdasarkan:

1. Dukungan gambar
2. Latensi tool
3. Ukuran konteks
4. Jumlah parameter

Input

- Daftar OpenRouter `/models` (filter `:free`)
- Memerlukan OpenRouter API key dari profil auth atau `OPENROUTER_API_KEY` (lihat [/environment](/id/help/environment))
- Filter opsional: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Kontrol probe: `--timeout`, `--concurrency`

Saat dijalankan di TTY, Anda dapat memilih fallback secara interaktif. Dalam mode non-interaktif,
berikan `--yes` untuk menerima default.

## Registri models (`models.json`)

Provider kustom di `models.providers` ditulis ke `models.json` di bawah
direktori agen (default `~/.openclaw/agents/<agentId>/agent/models.json`). File ini
digabungkan secara default kecuali `models.mode` diatur ke `replace`.

Prioritas mode merge untuk id provider yang cocok:

- `baseUrl` yang tidak kosong dan sudah ada di `models.json` agen akan diprioritaskan.
- `apiKey` yang tidak kosong di `models.json` agen diprioritaskan hanya ketika provider tersebut tidak dikelola SecretRef dalam konteks config/profil-auth saat ini.
- Nilai `apiKey` provider yang dikelola SecretRef disegarkan dari penanda sumber (`ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec) alih-alih memersistensikan rahasia yang sudah di-resolve.
- Nilai header provider yang dikelola SecretRef disegarkan dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk ref env, `secretref-managed` untuk ref file/exec).
- `apiKey`/`baseUrl` agen yang kosong atau hilang melakukan fallback ke config `models.providers`.
- Field provider lainnya disegarkan dari config dan data katalog yang sudah dinormalisasi.

Persistensi penanda bersifat source-authoritative: OpenClaw menulis penanda dari snapshot config sumber aktif (pra-resolusi), bukan dari nilai rahasia runtime yang sudah di-resolve.
Ini berlaku setiap kali OpenClaw meregenerasi `models.json`, termasuk jalur yang dipicu perintah seperti `openclaw agent`.

## Terkait

- [Provider Model](/id/concepts/model-providers) — perutean provider dan auth
- [Failover Model](/id/concepts/model-failover) — rantai fallback
- [Pembuatan Gambar](/id/tools/image-generation) — konfigurasi image model
- [Pembuatan Musik](/id/tools/music-generation) — konfigurasi music model
- [Pembuatan Video](/id/tools/video-generation) — konfigurasi video model
- [Referensi Config](/id/gateway/configuration-reference#agent-defaults) — kunci config model
