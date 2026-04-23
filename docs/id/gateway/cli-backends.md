---
read_when:
    - Anda menginginkan fallback yang andal saat penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami bridge loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan bridge alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-23T14:55:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime fallback)

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback khusus teks** saat penyedia API sedang down,
terkena rate limit, atau sementara berperilaku tidak semestinya. Ini sengaja dibuat konservatif:

- **Alat OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat gateway melalui bridge MCP loopback.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (agar giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman** alih-alih jalur utama. Gunakan ini ketika Anda
menginginkan respons teks yang “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
pengikatan thread/percakapan, dan sesi coding eksternal persisten, gunakan
[ACP Agents](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

## Mulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, tambahkan hanya
path command:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Itu saja. Tidak perlu key, tidak perlu konfigurasi auth tambahan selain yang dibutuhkan CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada host
gateway, OpenClaw sekarang akan memuat otomatis plugin bawaan yang memilikinya ketika konfigurasi Anda
secara eksplisit merujuk backend tersebut dalam ref model atau di bawah
`agents.defaults.cliBackends`.

## Menggunakannya sebagai fallback

Tambahkan backend CLI ke daftar fallback Anda agar hanya berjalan saat model utama gagal:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Catatan:

- Jika Anda menggunakan `agents.defaults.models` (allowlist), Anda juga harus menyertakan model backend CLI di sana.
- Jika penyedia utama gagal (auth, rate limit, timeout), OpenClaw akan
  mencoba backend CLI berikutnya.

## Ikhtisar konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri dikunci dengan **id provider** (misalnya `codex-cli`, `my-cli`).
Id provider menjadi sisi kiri dari ref model Anda:

```
<provider>/<model>
```

### Contoh konfigurasi

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // CLI bergaya Codex dapat menunjuk ke file prompt sebagai gantinya:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Cara kerjanya

1. **Memilih backend** berdasarkan prefiks provider (`codex-cli/...`).
2. **Membangun system prompt** menggunakan prompt OpenClaw + konteks workspace yang sama.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend `claude-cli` bawaan menjaga proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks akhir.
5. **Menyimpan id sesi** per backend, agar giliran lanjutan menggunakan ulang sesi CLI yang sama.

<Note>
Backend `claude-cli` Anthropic bawaan kini didukung lagi. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI ala OpenClaw kembali diizinkan, jadi OpenClaw memperlakukan
penggunaan `claude -p` sebagai hal yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend `codex-cli` OpenAI bawaan meneruskan system prompt OpenClaw melalui
override konfigurasi `model_instructions_file` milik Codex (`-c
model_instructions_file="..."`). Codex tidak menyediakan flag
`--append-system-prompt` ala Claude, jadi OpenClaw menulis prompt yang telah dirangkai ke
file sementara untuk setiap sesi Codex CLI baru.

Backend `claude-cli` Anthropic bawaan menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw ringkas dalam system prompt yang ditambahkan, dan
Plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agent/sesi itu, sehingga resolver skill native Claude Code melihat
set terfilter yang sama yang sebaliknya akan diiklankan OpenClaw dalam
prompt. Override env/API key skill tetap diterapkan oleh OpenClaw ke environment proses anak untuk eksekusi tersebut.

Sebelum OpenClaw dapat menggunakan backend `claude-cli` bawaan, Claude Code sendiri
harus sudah login di host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Gunakan `agents.defaults.cliBackends.claude-cli.command` hanya ketika biner `claude`
belum ada di `PATH`.

## Sesi

- Jika CLI mendukung sesi, set `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) saat ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subcommand resume** dengan flag yang berbeda, set
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan secara opsional
  `resumeOutput` (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: kirim id sesi hanya jika sebelumnya ada yang tersimpan.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran lanjutan menggunakan ulang proses Claude aktif selagi
  masih aktif. stdio hangat sekarang menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan field transport. Jika Gateway dimulai ulang atau proses idle
  berhenti, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi yang tersimpan
  diverifikasi terhadap transkrip project yang ada dan dapat dibaca sebelum
  resume, sehingga pengikatan phantom dibersihkan dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi CLI yang tersimpan adalah kontinuitas milik provider. Reset sesi harian implisit
  tidak memutuskannya; `/reset` dan kebijakan `session.reset` eksplisit tetap memutuskannya.

Catatan serialisasi:

- `serialize: true` menjaga eksekusi di lane yang sama tetap berurutan.
- Sebagian besar CLI menserialkan pada satu lane provider.
- OpenClaw menghentikan penggunaan ulang sesi CLI yang tersimpan saat identitas auth yang dipilih berubah,
  termasuk jika id profil auth berubah, API key statis, token statis, atau identitas akun OAuth saat CLI mengeksposnya. Rotasi
  access token dan refresh token OAuth tidak memutus sesi CLI yang tersimpan. Jika sebuah CLI tidak mengekspos
  id akun OAuth yang stabil, OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, set `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` diatur, path tersebut
diteruskan sebagai arg CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (injeksi path), yang cukup untuk CLI yang otomatis
memuat file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  usage dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agent akhir beserta pengidentifikasi sesi
  saat ada.
- `output: "text"` memperlakukan stdout sebagai respons akhir.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai arg CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` diatur, stdin digunakan.

## Default (milik plugin)

Plugin OpenAI bawaan juga mendaftarkan default untuk `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google bawaan juga mendaftarkan default untuk `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prasyarat: Gemini CLI lokal harus terpasang dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari field JSON `response`.
- Usage menggunakan fallback ke `stats` saat `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Override hanya jika diperlukan (umum: path `command` absolut).

## Default milik plugin

Default backend CLI sekarang menjadi bagian dari permukaan plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks provider dalam ref model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki plugin melalui hook
  `normalizeConfig` opsional.

Plugin yang memerlukan shim kompatibilitas prompt/pesan kecil dapat mendeklarasikan
transformasi teks dua arah tanpa mengganti provider atau backend CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` menulis ulang system prompt dan user prompt yang diteruskan ke CLI. `output`
menulis ulang delta assistant yang di-streaming dan teks akhir yang telah diurai sebelum OpenClaw menangani
marker kontrolnya sendiri dan pengiriman channel.

Untuk CLI yang mengeluarkan JSONL kompatibel stream-json Claude Code, set
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Overlay MCP bundel

Backend CLI **tidak** menerima panggilan alat OpenClaw secara langsung, tetapi sebuah backend dapat
ikut serta dalam overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bawaan saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: override konfigurasi inline untuk `mcp_servers`
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat bundle MCP diaktifkan, OpenClaw:

- memunculkan server MCP HTTP loopback yang mengekspos alat gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke sesi, akun, dan konteks channel saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari extension pemiliknya

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat saat sebuah
backend ikut serta dalam bundle MCP agar eksekusi latar belakang tetap terisolasi.

## Keterbatasan

- **Tidak ada panggilan alat OpenClaw langsung.** OpenClaw tidak menyuntikkan panggilan alat ke
  protokol backend CLI. Backend hanya melihat alat gateway saat mereka ikut serta dalam
  `bundleMcp: true`.
- **Streaming bersifat spesifik per backend.** Beberapa backend melakukan streaming JSONL; yang lain menahan buffer
  hingga proses selesai.
- **Output terstruktur** bergantung pada format JSON milik CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibandingkan eksekusi awal `--json`. Sesi OpenClaw tetap berfungsi
  normal.

## Pemecahan masalah

- **CLI tidak ditemukan**: set `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` diatur dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat melanjutkan dengan output JSON).
- **Gambar diabaikan**: set `imageArg` (dan pastikan CLI mendukung path file).
