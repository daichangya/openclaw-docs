---
read_when:
    - Anda menginginkan fallback yang andal saat provider API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami bridge loopback MCP untuk akses tool backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan bridge tool MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-07T09:13:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f061357f420455ad6ffaabe7fe28f1fb1b1769d73a4eb2e6f45c6eb3c2e36667
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime fallback)

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback teks saja** saat provider API sedang down,
terkena rate limit, atau sementara berperilaku tidak semestinya. Ini sengaja dibuat konservatif:

- **Tool OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima tool gateway melalui bridge loopback MCP.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (agar giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman** alih-alih jalur utama. Gunakan saat Anda
menginginkan respons teks yang “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
binding thread/conversation, dan sesi coding eksternal persisten, gunakan
[ACP Agents](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

## Quick start yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minim, tambahkan hanya
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

Selesai. Tidak perlu key, tidak perlu konfigurasi auth tambahan selain yang dimiliki CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **provider pesan utama** di
host gateway, OpenClaw sekarang memuat otomatis plugin bawaan pemiliknya saat konfigurasi Anda
secara eksplisit merujuk backend tersebut dalam model ref atau di bawah
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

Setiap entri diberi key berupa **id provider** (misalnya `codex-cli`, `my-cli`).
Id provider menjadi sisi kiri dari model ref Anda:

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

1. **Memilih backend** berdasarkan prefix provider (`codex-cli/...`).
2. **Membangun system prompt** menggunakan prompt OpenClaw yang sama + konteks workspace.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
4. **Mem-parsing output** (JSON atau teks biasa) dan mengembalikan teks final.
5. **Menyimpan id sesi** per backend, agar giliran lanjutan menggunakan kembali sesi CLI yang sama.

<Note>
Backend `claude-cli` Anthropic bawaan kini didukung lagi. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI ala OpenClaw kembali diizinkan, jadi OpenClaw memperlakukan
penggunaan `claude -p` sebagai sesuatu yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

## Sesi

- Jika CLI mendukung sesi, setel `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) saat ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subcommand resume** dengan flag yang berbeda, setel
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah kirim id sesi.

Catatan serialisasi:

- `serialize: true` menjaga run pada lane yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lane provider.
- OpenClaw menghapus penggunaan ulang sesi CLI yang tersimpan saat status auth backend berubah, termasuk login ulang, rotasi token, atau credential profil auth yang berubah.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, setel `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` disetel, path tersebut
diteruskan sebagai argumen CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (path injection), yang cukup untuk CLI yang otomatis
memuat file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mem-parsing JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  usage dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mem-parsing stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen final serta identifier sesi
  saat tersedia.
- `output: "text"` memperlakukan stdout sebagai respons final.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai argumen CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` disetel, stdin akan digunakan.

## Default (dimiliki plugin)

Plugin OpenAI bawaan juga mendaftarkan default untuk `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Plugin Google bawaan juga mendaftarkan default untuk `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prasyarat: Gemini CLI lokal harus terinstal dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari field JSON `response`.
- Usage akan fallback ke `stats` saat `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Override hanya jika diperlukan (umumnya: path `command` absolut).

## Default milik plugin

Default backend CLI sekarang menjadi bagian dari surface plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefix provider dalam model ref.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki plugin melalui hook opsional
  `normalizeConfig`.

## Overlay bundle MCP

Backend CLI **tidak** menerima pemanggilan tool OpenClaw secara langsung, tetapi backend dapat
memilih menggunakan overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bawaan saat ini:

- `codex-cli`: tidak ada overlay bundle MCP
- `google-gemini-cli`: tidak ada overlay bundle MCP

Saat bundle MCP diaktifkan, OpenClaw:

- menjalankan server MCP HTTP loopback yang mengekspos tool gateway ke proses CLI
- mengautentikasi bridge dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses tool ke sesi, akun, dan konteks channel saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan backend `--mcp-config` yang sudah ada
- menulis ulang argumen CLI untuk meneruskan `--strict-mcp-config --mcp-config <generated-file>`

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi strict saat sebuah
backend memilih bundle MCP agar run latar belakang tetap terisolasi.

## Keterbatasan

- **Tidak ada pemanggilan tool OpenClaw langsung.** OpenClaw tidak menyuntikkan pemanggilan tool ke dalam
  protokol backend CLI. Backend hanya melihat tool gateway saat mereka memilih
  `bundleMcp: true`.
- **Streaming bersifat khusus backend.** Beberapa backend melakukan streaming JSONL; yang lain melakukan buffer
  sampai proses selesai.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (bukan JSONL), yang kurang
  terstruktur dibandingkan run awal `--json`. Sesi OpenClaw tetap bekerja
  secara normal.

## Troubleshooting

- **CLI tidak ditemukan**: setel `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` disetel dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat resume dengan output JSON).
- **Gambar diabaikan**: setel `imageArg` (dan verifikasi CLI mendukung path file).
