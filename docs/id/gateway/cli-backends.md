---
read_when:
    - Anda ingin fallback yang andal saat provider API gagal
    - Anda sedang menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami bridge loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan bridge alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-23T09:20:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime fallback)

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback hanya-teks** saat provider API sedang down,
terkena rate limit, atau sementara bermasalah. Pendekatan ini sengaja konservatif:

- **Alat OpenClaw tidak diinjeksi secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat gateway melalui bridge loopback MCP.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (jadi giliran tindak lanjut tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman** alih-alih jalur utama. Gunakan ini saat Anda
menginginkan respons teks “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
binding thread/percakapan, dan sesi coding eksternal persisten, gunakan
[ACP Agents](/id/tools/acp-agents). Backend CLI bukan ACP.

## Memulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, tambahkan hanya
path perintahnya:

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

Itu saja. Tidak perlu key, tidak perlu konfigurasi auth tambahan selain yang dimiliki CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **provider pesan utama** pada
host gateway, OpenClaw sekarang otomatis memuat plugin bawaan pemiliknya saat config Anda
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
- Jika provider utama gagal (auth, rate limit, timeout), OpenClaw akan
  mencoba backend CLI berikutnya.

## Ringkasan konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri dikunci oleh **id provider** (misalnya `codex-cli`, `my-cli`).
Id provider menjadi sisi kiri ref model Anda:

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
          // CLI gaya Codex dapat menunjuk ke file prompt sebagai gantinya:
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
2. **Membangun system prompt** menggunakan prompt + konteks workspace OpenClaw yang sama.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend `claude-cli` bawaan menjaga proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran tindak lanjut melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks akhir.
5. **Mempertahankan id sesi** per backend, sehingga tindak lanjut menggunakan kembali sesi CLI yang sama.

<Note>
Backend `claude-cli` Anthropic bawaan kembali didukung. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan
penggunaan `claude -p` sebagai yang disahkan untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend `codex-cli` OpenAI bawaan meneruskan system prompt OpenClaw melalui
override config `model_instructions_file` milik Codex (`-c
model_instructions_file="..."`). Codex tidak mengekspos flag
`--append-system-prompt` gaya Claude, jadi OpenClaw menulis prompt rakitan ke
file sementara untuk setiap sesi Codex CLI baru.

Backend `claude-cli` Anthropic bawaan menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw ringkas di appended system prompt, dan
Plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agen/sesi itu, sehingga resolver skill native Claude Code melihat himpunan terfilter yang sama yang sebaliknya akan diiklankan OpenClaw di
prompt. Override env/API key skill tetap diterapkan oleh OpenClaw ke
lingkungan proses anak untuk run tersebut.

## Sesi

- Jika CLI mendukung sesi, setel `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) saat ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag yang berbeda, setel
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan opsional
  `resumeOutput` (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` default ke `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran tindak lanjut menggunakan kembali proses Claude live saat
  proses tersebut aktif. Warm stdio sekarang menjadi default, termasuk untuk config kustom
  yang menghilangkan field transport. Jika Gateway direstart atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi yang tersimpan diverifikasi terhadap transkrip proyek yang ada dan dapat dibaca sebelum
  resume, sehingga binding fantom dihapus dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi CLI yang tersimpan adalah kontinuitas milik provider. Reset sesi harian implisit
  tidak memutusnya; `/reset` dan kebijakan `session.reset` eksplisit tetap
  memutuskannya.

Catatan serialisasi:

- `serialize: true` menjaga run pada jalur yang sama tetap terurut.
- Sebagian besar CLI melakukan serialisasi pada satu jalur provider.
- OpenClaw membuang penggunaan ulang sesi CLI yang tersimpan saat identitas auth terpilih berubah,
  termasuk perubahan id profil auth, API key statis, token statis, atau identitas akun OAuth
  saat CLI mengekspos salah satunya. Rotasi token akses dan refresh OAuth tidak
  memutus sesi CLI yang tersimpan. Jika CLI tidak mengekspos id akun OAuth yang stabil,
  OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, setel `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` disetel, path tersebut
diteruskan sebagai argumen CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (injeksi path), yang cukup untuk CLI yang memuat
file lokal secara otomatis dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen akhir plus pengenal sesi jika ada.
- `output: "text"` memperlakukan stdout sebagai respons akhir.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai argumen CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` disetel, stdin digunakan.

## Default (dimiliki plugin)

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

Prasyarat: Gemini CLI lokal harus terinstal dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari field JSON `response`.
- Penggunaan fallback ke `stats` saat `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Lakukan override hanya jika diperlukan (umumnya: path `command` absolut).

## Default yang dimiliki plugin

Default backend CLI sekarang menjadi bagian dari surface plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- Backend `id` menjadi prefiks provider dalam ref model.
- Config pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default plugin.
- Pembersihan config khusus backend tetap dimiliki plugin melalui hook
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

`input` menulis ulang system prompt dan prompt pengguna yang diteruskan ke CLI. `output`
menulis ulang delta asisten yang di-stream dan teks akhir yang telah diurai sebelum OpenClaw menangani
penanda kontrolnya sendiri dan pengiriman channel.

Untuk CLI yang memancarkan JSONL yang kompatibel dengan stream-json Claude Code, setel
`jsonlDialect: "claude-stream-json"` pada config backend tersebut.

## Overlay bundle MCP

Backend CLI **tidak** menerima pemanggilan alat OpenClaw secara langsung, tetapi sebuah backend dapat
ikut serta dalam overlay config MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bawaan saat ini:

- `claude-cli`: file config MCP ketat yang dihasilkan
- `codex-cli`: override config inline untuk `mcp_servers`
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat bundle MCP diaktifkan, OpenClaw:

- meluncurkan server MCP HTTP loopback yang mengekspos alat gateway ke proses CLI
- mengautentikasi bridge dengan token per-sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke konteks sesi, akun, dan channel saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk config/pengaturan MCP backend yang sudah ada
- menulis ulang config peluncuran menggunakan mode integrasi milik backend dari extension pemilik

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menginjeksi config ketat saat sebuah
backend ikut serta dalam bundle MCP agar run latar belakang tetap terisolasi.

## Batasan

- **Tidak ada pemanggilan alat OpenClaw langsung.** OpenClaw tidak menginjeksi pemanggilan alat ke
  protokol backend CLI. Backend hanya melihat alat gateway saat mereka ikut serta dalam
  `bundleMcp: true`.
- **Streaming bersifat khusus backend.** Beberapa backend men-stream JSONL; yang lain membuffer
  sampai keluar.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** melanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibanding run awal `--json`. Sesi OpenClaw tetap berfungsi
  normal.

## Pemecahan masalah

- **CLI tidak ditemukan**: setel `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` disetel dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat melanjutkan dengan output JSON).
- **Gambar diabaikan**: setel `imageArg` (dan verifikasi bahwa CLI mendukung path file).
