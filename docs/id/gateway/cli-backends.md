---
read_when:
    - Anda menginginkan fallback yang andal saat penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-09T01:27:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b458f9fe6fa64c47864c8c180f3dedfd35c5647de470a2a4d31c26165663c20
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime fallback)

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback hanya-teks** saat penyedia API sedang tidak tersedia,
terkena pembatasan laju, atau untuk sementara berperilaku tidak semestinya. Ini sengaja dibuat konservatif:

- **Alat OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat gateway melalui jembatan loopback MCP.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (agar giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman** alih-alih jalur utama. Gunakan ini saat Anda
menginginkan respons teks yang “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness lengkap dengan kontrol sesi ACP, tugas latar belakang,
pengikatan thread/percakapan, dan sesi coding eksternal persisten, gunakan
[ACP Agents](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

## Memulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, tambahkan hanya
path perintah:

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

Itu saja. Tidak ada key, tidak ada konfigurasi auth tambahan selain yang dibutuhkan oleh CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada
host gateway, OpenClaw kini memuat otomatis plugin bawaan pemiliknya saat konfigurasi Anda
secara eksplisit mereferensikan backend tersebut dalam referensi model atau di bawah
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

- Jika Anda menggunakan `agents.defaults.models` (allowlist), Anda juga harus menyertakan model backend CLI Anda di sana.
- Jika penyedia utama gagal (auth, pembatasan laju, timeout), OpenClaw akan
  mencoba backend CLI berikutnya.

## Ringkasan konfigurasi

Semua backend CLI berada di bawah:

```
agents.defaults.cliBackends
```

Setiap entri diberi key oleh **id penyedia** (misalnya `codex-cli`, `my-cli`).
Id penyedia menjadi sisi kiri dari referensi model Anda:

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
          // CLI bergaya Codex dapat diarahkan ke file prompt sebagai gantinya:
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

1. **Memilih backend** berdasarkan prefiks penyedia (`codex-cli/...`).
2. **Menyusun prompt sistem** menggunakan prompt OpenClaw + konteks workspace yang sama.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks akhir.
5. **Menyimpan id sesi** per backend, sehingga tindak lanjut menggunakan kembali sesi CLI yang sama.

<Note>
Backend `claude-cli` Anthropic bawaan kini didukung lagi. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw kini diperbolehkan lagi, jadi OpenClaw menganggap
penggunaan `claude -p` disetujui untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend `codex-cli` OpenAI bawaan meneruskan prompt sistem OpenClaw melalui
override konfigurasi `model_instructions_file` Codex (`-c
model_instructions_file="..."`). Codex tidak menyediakan flag
`--append-system-prompt` seperti Claude, jadi OpenClaw menulis prompt yang telah dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

## Sesi

- Jika CLI mendukung sesi, setel `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) saat ID perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag yang berbeda, setel
  `resumeArgs` (menggantikan `args` saat melanjutkan) dan secara opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika tidak ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah kirim id sesi.

Catatan serialisasi:

- `serialize: true` menjaga eksekusi pada lane yang sama tetap berurutan.
- Sebagian besar CLI melakukan serialisasi pada satu lane penyedia.
- OpenClaw membuang penggunaan ulang sesi CLI yang tersimpan saat status auth backend berubah, termasuk login ulang, rotasi token, atau perubahan kredensial profil auth.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, setel `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` disetel, path tersebut
diteruskan sebagai arg CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (penyuntikan path), yang cukup untuk CLI yang otomatis
memuat file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen akhir serta
  pengenal sesi jika ada.
- `output: "text"` memperlakukan stdout sebagai respons akhir.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai arg CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` disetel, stdin digunakan.

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
- Penggunaan mengambil fallback ke `stats` saat `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Override hanya jika diperlukan (umumnya: path `command` absolut).

## Default yang dimiliki plugin

Default backend CLI kini menjadi bagian dari surface plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks penyedia dalam referensi model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menimpa default plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki plugin melalui hook
  `normalizeConfig` opsional.

## Overlay bundle MCP

Backend CLI **tidak** menerima panggilan alat OpenClaw secara langsung, tetapi backend dapat
memilih ikut serta dalam overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bawaan saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: override konfigurasi inline untuk `mcp_servers`
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat bundle MCP diaktifkan, OpenClaw:

- memunculkan server HTTP MCP loopback yang mengekspos alat gateway ke proses CLI
- mengautentikasi jembatan dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke sesi, akun, dan konteks channel saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari extension pemiliknya

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat saat
backend memilih ikut serta dalam bundle MCP agar eksekusi latar belakang tetap terisolasi.

## Keterbatasan

- **Tidak ada panggilan alat OpenClaw langsung.** OpenClaw tidak menyuntikkan panggilan alat ke
  protokol backend CLI. Backend hanya melihat alat gateway saat mereka memilih ikut serta pada
  `bundleMcp: true`.
- **Streaming bersifat khusus backend.** Beberapa backend melakukan streaming JSONL; yang lain menahan buffer
  hingga keluar.
- **Output terstruktur** bergantung pada format JSON CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibandingkan eksekusi awal `--json`. Sesi OpenClaw tetap berfungsi
  normal.

## Pemecahan masalah

- **CLI tidak ditemukan**: setel `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` disetel dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat melanjutkan dengan output JSON).
- **Gambar diabaikan**: setel `imageArg` (dan pastikan CLI mendukung path file).
