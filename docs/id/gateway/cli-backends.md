---
read_when:
    - Anda menginginkan fallback yang andal saat penyedia API gagal
    - Anda menjalankan Codex CLI atau CLI AI lokal lainnya dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan jembatan alat MCP opsional'
title: backend CLI
x-i18n:
    generated_at: "2026-04-25T13:45:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

OpenClaw dapat menjalankan **CLI AI lokal** sebagai **fallback hanya-teks** ketika penyedia API sedang down,
terkena rate limit, atau sementara bermasalah. Ini sengaja dibuat konservatif:

- **Alat OpenClaw tidak disuntikkan secara langsung**, tetapi backend dengan `bundleMcp: true`
  dapat menerima alat gateway melalui jembatan local loopback MCP.
- **Streaming JSONL** untuk CLI yang mendukungnya.
- **Sesi didukung** (jadi giliran lanjutan tetap koheren).
- **Gambar dapat diteruskan** jika CLI menerima path gambar.

Ini dirancang sebagai **jaring pengaman** alih-alih jalur utama. Gunakan saat Anda
menginginkan respons teks “selalu berfungsi” tanpa bergantung pada API eksternal.

Jika Anda menginginkan runtime harness penuh dengan kontrol sesi ACP, tugas latar belakang,
binding thread/percakapan, dan sesi coding eksternal persisten, gunakan
[ACP Agents](/id/tools/acp-agents) sebagai gantinya. Backend CLI bukan ACP.

## Mulai cepat yang ramah pemula

Anda dapat menggunakan Codex CLI **tanpa konfigurasi apa pun** (plugin OpenAI bawaan
mendaftarkan backend default):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jika gateway Anda berjalan di bawah launchd/systemd dan PATH minimal, cukup tambahkan
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

Selesai. Tidak ada key, tidak ada konfigurasi autentikasi tambahan selain yang sudah dimiliki CLI itu sendiri.

Jika Anda menggunakan backend CLI bawaan sebagai **penyedia pesan utama** pada
host gateway, OpenClaw sekarang akan memuat otomatis plugin bawaan yang memilikinya ketika konfigurasi Anda
secara eksplisit merujuk backend tersebut dalam ref model atau di bawah
`agents.defaults.cliBackends`.

## Menggunakannya sebagai fallback

Tambahkan backend CLI ke daftar fallback Anda agar hanya berjalan ketika model utama gagal:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
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

Setiap entri diberi key oleh **id penyedia** (misalnya `codex-cli`, `my-cli`).
Id penyedia menjadi sisi kiri ref model Anda:

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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
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
2. **Membangun system prompt** menggunakan prompt OpenClaw + konteks workspace yang sama.
3. **Menjalankan CLI** dengan id sesi (jika didukung) agar riwayat tetap konsisten.
   Backend bawaan `claude-cli` mempertahankan proses stdio Claude tetap hidup per
   sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. **Mengurai output** (JSON atau teks biasa) dan mengembalikan teks akhir.
5. **Menyimpan id sesi** per backend, sehingga giliran lanjutan menggunakan kembali sesi CLI yang sama.

<Note>
Backend bawaan Anthropic `claude-cli` kembali didukung. Staf Anthropic
memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga OpenClaw memperlakukan
penggunaan `claude -p` sebagai hal yang diizinkan untuk integrasi ini kecuali Anthropic menerbitkan
kebijakan baru.
</Note>

Backend bawaan OpenAI `codex-cli` meneruskan system prompt OpenClaw melalui
override konfigurasi `model_instructions_file` milik Codex (`-c
model_instructions_file="..."`). Codex tidak mengekspos flag
`--append-system-prompt` bergaya Claude, jadi OpenClaw menulis prompt yang telah dirakit ke
file sementara untuk setiap sesi Codex CLI baru.

Backend bawaan Anthropic `claude-cli` menerima snapshot Skills OpenClaw
dengan dua cara: katalog Skills OpenClaw ringkas dalam system prompt tambahan, dan
plugin Claude Code sementara yang diteruskan dengan `--plugin-dir`. Plugin tersebut hanya berisi
Skills yang memenuhi syarat untuk agen/sesi itu, sehingga resolver skill native Claude Code
melihat kumpulan yang sama yang sebaliknya akan diumumkan OpenClaw dalam
prompt. Override env/key API skill tetap diterapkan oleh OpenClaw ke environment proses turunan untuk run tersebut.

Claude CLI juga memiliki mode izin noninteraktifnya sendiri. OpenClaw memetakannya
ke kebijakan exec yang ada alih-alih menambahkan konfigurasi khusus Claude: ketika
kebijakan exec efektif yang diminta adalah YOLO (`tools.exec.security: "full"` dan
`tools.exec.ask: "off"`), OpenClaw menambahkan `--permission-mode bypassPermissions`.
Pengaturan `agents.list[].tools.exec` per agen mengoverride `tools.exec` global untuk
agen tersebut. Untuk memaksa mode Claude yang berbeda, atur arg backend raw yang eksplisit
seperti `--permission-mode default` atau `--permission-mode acceptEdits` di bawah
`agents.defaults.cliBackends.claude-cli.args` dan `resumeArgs` yang sesuai.

Sebelum OpenClaw dapat menggunakan backend bawaan `claude-cli`, Claude Code sendiri
harus sudah login di host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Gunakan `agents.defaults.cliBackends.claude-cli.command` hanya ketika biner `claude`
belum ada di `PATH`.

## Sesi

- Jika CLI mendukung sesi, atur `sessionArg` (misalnya `--session-id`) atau
  `sessionArgs` (placeholder `{sessionId}`) ketika id perlu disisipkan
  ke beberapa flag.
- Jika CLI menggunakan **subperintah resume** dengan flag yang berbeda, atur
  `resumeArgs` (menggantikan `args` saat resume) dan opsional `resumeOutput`
  (untuk resume non-JSON).
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sudah pernah disimpan.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` secara default menggunakan `liveSession: "claude-stdio"`, `output: "jsonl"`,
  dan `input: "stdin"` sehingga giliran lanjutan menggunakan ulang proses Claude live selama
  masih aktif. Stdio hangat sekarang menjadi default, termasuk untuk konfigurasi kustom
  yang menghilangkan field transport. Jika Gateway restart atau proses idle
  keluar, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi yang tersimpan
  diverifikasi terhadap transkrip proyek yang ada dan dapat dibaca sebelum
  resume, sehingga binding fantom dibersihkan dengan `reason=transcript-missing`
  alih-alih diam-diam memulai sesi Claude CLI baru di bawah `--resume`.
- Sesi CLI yang tersimpan adalah kontinuitas yang dimiliki penyedia. Reset sesi harian implisit
  tidak memotongnya; `/reset` dan kebijakan `session.reset` eksplisit tetap memotongnya.

Catatan serialisasi:

- `serialize: true` menjaga urutan run pada lane yang sama.
- Sebagian besar CLI melakukan serialisasi pada satu lane penyedia.
- OpenClaw melepaskan penggunaan ulang sesi CLI yang tersimpan ketika identitas auth yang dipilih berubah,
  termasuk perubahan id profil auth, kunci API statis, token statis, atau identitas akun OAuth
  ketika CLI mengeksposnya. Rotasi access token dan refresh token OAuth
  tidak memotong sesi CLI yang tersimpan. Jika CLI tidak mengekspos id akun OAuth yang stabil,
  OpenClaw membiarkan CLI tersebut menegakkan izin resume.

## Gambar (pass-through)

Jika CLI Anda menerima path gambar, atur `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw akan menulis gambar base64 ke file sementara. Jika `imageArg` diatur, path tersebut
akan diteruskan sebagai arg CLI. Jika `imageArg` tidak ada, OpenClaw menambahkan
path file ke prompt (path injection), yang cukup untuk CLI yang memuat otomatis
file lokal dari path biasa.

## Input / output

- `output: "json"` (default) mencoba mengurai JSON dan mengekstrak teks + id sesi.
- Untuk output JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan
  penggunaan dari `stats` saat `usage` tidak ada atau kosong.
- `output: "jsonl"` mengurai stream JSONL (misalnya Codex CLI `--json`) dan mengekstrak pesan agen akhir plus pengenal sesi saat ada.
- `output: "text"` memperlakukan stdout sebagai respons akhir.

Mode input:

- `input: "arg"` (default) meneruskan prompt sebagai arg CLI terakhir.
- `input: "stdin"` mengirim prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` diatur, stdin digunakan.

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

Prasyarat: Gemini CLI lokal harus terpasang dan tersedia sebagai
`gemini` di `PATH` (`brew install gemini-cli` atau
`npm install -g @google/gemini-cli`).

Catatan JSON Gemini CLI:

- Teks balasan dibaca dari field JSON `response`.
- Penggunaan melakukan fallback ke `stats` saat `usage` tidak ada atau kosong.
- `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
  `stats.input_tokens - stats.cached`.

Override hanya jika perlu (umum: path `command` absolut).

## Default milik plugin

Default backend CLI sekarang menjadi bagian dari permukaan plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- Backend `id` menjadi prefiks penyedia dalam ref model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap mengoverride default plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki plugin melalui hook
  `normalizeConfig` opsional.

Plugin yang membutuhkan shim kompatibilitas prompt/pesan kecil dapat mendeklarasikan
transformasi teks dua arah tanpa mengganti penyedia atau backend CLI:

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
menulis ulang delta assistant yang di-stream dan teks akhir yang telah diurai sebelum OpenClaw menangani
marker kontrolnya sendiri dan pengiriman saluran.

Untuk CLI yang mengeluarkan JSONL yang kompatibel dengan stream-json Claude Code, atur
`jsonlDialect: "claude-stream-json"` pada konfigurasi backend tersebut.

## Overlay MCP bundle

Backend CLI **tidak** menerima panggilan alat OpenClaw secara langsung, tetapi backend dapat
ikut serta ke overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`.

Perilaku bawaan saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan
- `codex-cli`: override konfigurasi inline untuk `mcp_servers`; server loopback OpenClaw yang dihasilkan
  ditandai dengan mode persetujuan alat per-server milik Codex
  sehingga panggilan MCP tidak terhenti pada prompt persetujuan lokal
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan

Saat bundle MCP diaktifkan, OpenClaw:

- memunculkan server MCP HTTP loopback yang mengekspos alat gateway ke proses CLI
- mengautentikasi jembatan dengan token per sesi (`OPENCLAW_MCP_TOKEN`)
- membatasi akses alat ke sesi, akun, dan konteks saluran saat ini
- memuat server bundle-MCP yang diaktifkan untuk workspace saat ini
- menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari extension yang memilikinya

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat saat
backend ikut serta dalam bundle MCP agar run latar belakang tetap terisolasi.

Runtime MCP bawaan yang dicakup ke sesi di-cache untuk digunakan ulang dalam sebuah sesi, lalu
dipanen setelah idle selama `mcp.sessionIdleTtlMs` milidetik (default 10
menit; atur `0` untuk menonaktifkan). Run tertanam sekali jalan seperti probe auth,
pembuatan slug, dan recall Active Memory membersihkan permintaan pada akhir run sehingga child stdio
dan stream Streamable HTTP/SSE tidak hidup lebih lama dari run tersebut.

## Batasan

- **Tidak ada panggilan alat OpenClaw langsung.** OpenClaw tidak menyuntikkan panggilan alat ke
  protokol backend CLI. Backend hanya melihat alat gateway saat mereka ikut serta dalam
  `bundleMcp: true`.
- **Streaming bersifat spesifik backend.** Beberapa backend melakukan streaming JSONL; yang lain menahan
  hingga proses selesai.
- **Output terstruktur** bergantung pada format JSON milik CLI.
- **Sesi Codex CLI** dilanjutkan melalui output teks (tanpa JSONL), yang kurang
  terstruktur dibandingkan run awal `--json`. Sesi OpenClaw tetap berfungsi
  normal.

## Pemecahan masalah

- **CLI tidak ditemukan**: atur `command` ke path lengkap.
- **Nama model salah**: gunakan `modelAliases` untuk memetakan `provider/model` → model CLI.
- **Tidak ada kontinuitas sesi**: pastikan `sessionArg` diatur dan `sessionMode` bukan
  `none` (Codex CLI saat ini tidak dapat melanjutkan dengan output JSON).
- **Gambar diabaikan**: atur `imageArg` (dan verifikasi CLI mendukung path file).

## Terkait

- [Gateway runbook](/id/gateway)
- [Model lokal](/id/gateway/local-models)
