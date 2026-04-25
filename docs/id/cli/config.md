---
read_when:
    - Anda ingin membaca atau mengedit konfigurasi secara non-interaktif
summary: Referensi CLI untuk `openclaw config` (get/set/unset/file/schema/validate)
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-25T13:43:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Helper konfigurasi untuk pengeditan non-interaktif di `openclaw.json`: get/set/unset/file/schema/validate
nilai berdasarkan path dan mencetak file konfigurasi aktif. Jalankan tanpa subperintah untuk
membuka wizard konfigurasi (sama seperti `openclaw configure`).

Opsi root:

- `--section <section>`: filter section penyiapan terpandu yang dapat diulang saat Anda menjalankan `openclaw config` tanpa subperintah

Section terpandu yang didukung:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Contoh

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Cetak JSON schema yang dihasilkan untuk `openclaw.json` ke stdout sebagai JSON.

Yang disertakan:

- Root schema konfigurasi saat ini, ditambah field string root `$schema` untuk tooling editor
- Metadata dokumen field `title` dan `description` yang digunakan oleh Control UI
- Node objek bertingkat, wildcard (`*`), dan item array (`[]`) mewarisi metadata `title` / `description` yang sama saat dokumentasi field yang cocok tersedia
- Cabang `anyOf` / `oneOf` / `allOf` juga mewarisi metadata dokumen yang sama saat dokumentasi field yang cocok tersedia
- Metadata schema Plugin + kanal live best-effort saat manifest runtime dapat dimuat
- Fallback schema yang bersih bahkan saat konfigurasi saat ini tidak valid

Runtime RPC terkait:

- `config.schema.lookup` mengembalikan satu path konfigurasi yang dinormalisasi dengan
  node schema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum),
  metadata petunjuk UI yang cocok, dan ringkasan child langsung. Gunakan ini untuk
  penelusuran terfokus pada path di Control UI atau klien kustom.

```bash
openclaw config schema
```

Pipe ke file saat Anda ingin memeriksa atau memvalidasinya dengan alat lain:

```bash
openclaw config schema > openclaw.schema.json
```

### Paths

Path menggunakan notasi titik atau kurung:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Gunakan indeks daftar agen untuk menargetkan agen tertentu:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Nilai

Nilai di-parse sebagai JSON5 jika memungkinkan; jika tidak, nilai diperlakukan sebagai string.
Gunakan `--strict-json` untuk mewajibkan parsing JSON5. `--json` tetap didukung sebagai alias lama.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` mencetak nilai mentah sebagai JSON alih-alih teks berformat terminal.

Penetapan objek mengganti path target secara default. Path map/list yang dilindungi
yang umumnya menyimpan entri tambahan dari pengguna, seperti `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries`, dan
`auth.profiles`, menolak penggantian yang akan menghapus entri yang ada kecuali
Anda meneruskan `--replace`.

Gunakan `--merge` saat menambahkan entri ke map tersebut:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gunakan `--replace` hanya saat Anda memang ingin nilai yang diberikan menjadi
nilai target lengkap.

## Mode `config set`

`openclaw config set` mendukung empat gaya penetapan:

1. Mode nilai: `openclaw config set <path> <value>`
2. Mode pembuat SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Mode pembuat provider (khusus path `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Mode batch (`--batch-json` atau `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Catatan kebijakan:

- Penetapan SecretRef ditolak pada surface runtime-mutable yang tidak didukung (misalnya `hooks.token`, `commands.ownerDisplaySecret`, token Webhook pengikatan thread Discord, dan JSON kredensial WhatsApp). Lihat [SecretRef Credential Surface](/id/reference/secretref-credential-surface).

Parsing batch selalu menggunakan payload batch (`--batch-json`/`--batch-file`) sebagai sumber kebenaran.
`--strict-json` / `--json` tidak mengubah perilaku parsing batch.

Mode JSON path/value tetap didukung untuk SecretRef maupun provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flag pembuat provider

Target pembuat provider harus menggunakan `secrets.providers.<alias>` sebagai path.

Flag umum:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (dapat diulang)

Provider file (`--provider-source file`):

- `--provider-path <path>` (wajib)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Provider exec (`--provider-source exec`):

- `--provider-command <path>` (wajib)
- `--provider-arg <arg>` (dapat diulang)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (dapat diulang)
- `--provider-pass-env <ENV_VAR>` (dapat diulang)
- `--provider-trusted-dir <path>` (dapat diulang)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Contoh provider exec yang diperketat:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

Gunakan `--dry-run` untuk memvalidasi perubahan tanpa menulis `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Perilaku dry-run:

- Mode builder: menjalankan pemeriksaan resolvabilitas SecretRef untuk ref/provider yang berubah.
- Mode JSON (`--strict-json`, `--json`, atau mode batch): menjalankan validasi schema plus pemeriksaan resolvabilitas SecretRef.
- Validasi kebijakan juga berjalan untuk surface target SecretRef yang diketahui tidak didukung.
- Pemeriksaan kebijakan mengevaluasi seluruh konfigurasi pasca-perubahan, sehingga penulisan objek induk (misalnya menetapkan `hooks` sebagai objek) tidak dapat melewati validasi surface yang tidak didukung.
- Pemeriksaan SecretRef exec dilewati secara default selama dry-run untuk menghindari efek samping perintah.
- Gunakan `--allow-exec` dengan `--dry-run` untuk ikut serta dalam pemeriksaan SecretRef exec (ini dapat mengeksekusi perintah provider).
- `--allow-exec` hanya untuk dry-run dan menghasilkan error jika digunakan tanpa `--dry-run`.

`--dry-run --json` mencetak laporan yang dapat dibaca mesin:

- `ok`: apakah dry-run berhasil
- `operations`: jumlah penetapan yang dievaluasi
- `checks`: apakah pemeriksaan schema/resolvabilitas dijalankan
- `checks.resolvabilityComplete`: apakah pemeriksaan resolvabilitas dijalankan sampai selesai (`false` saat ref exec dilewati)
- `refsChecked`: jumlah ref yang benar-benar di-resolve selama dry-run
- `skippedExecRefs`: jumlah ref exec yang dilewati karena `--allow-exec` tidak disetel
- `errors`: kegagalan schema/resolvabilitas terstruktur saat `ok=false`

### Bentuk output JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // ada untuk error resolvabilitas
    },
  ],
}
```

Contoh berhasil:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Contoh gagal:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Jika dry-run gagal:

- `config schema validation failed`: bentuk konfigurasi pasca-perubahan Anda tidak valid; perbaiki bentuk path/nilai atau objek provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: pindahkan kredensial tersebut kembali ke input plaintext/string dan pertahankan SecretRef hanya pada surface yang didukung.
- `SecretRef assignment(s) could not be resolved`: provider/ref yang dirujuk saat ini tidak dapat di-resolve (variabel env hilang, pointer file tidak valid, kegagalan provider exec, atau ketidakcocokan provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run melewati ref exec; jalankan ulang dengan `--allow-exec` jika Anda memerlukan validasi resolvabilitas exec.
- Untuk mode batch, perbaiki entri yang gagal dan jalankan ulang `--dry-run` sebelum menulis.

## Keamanan penulisan

`openclaw config set` dan penulis konfigurasi milik OpenClaw lainnya memvalidasi seluruh
konfigurasi pasca-perubahan sebelum meng-commit-nya ke disk. Jika payload baru gagal dalam validasi schema
atau terlihat seperti clobber destruktif, konfigurasi aktif dibiarkan apa adanya
dan payload yang ditolak disimpan di sampingnya sebagai `openclaw.json.rejected.*`.
Path konfigurasi aktif harus berupa file biasa. Layout `openclaw.json` yang berupa symlink
tidak didukung untuk penulisan; gunakan `OPENCLAW_CONFIG_PATH` untuk menunjuk langsung
ke file asli.

Utamakan penulisan via CLI untuk edit kecil:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jika penulisan ditolak, periksa payload yang disimpan dan perbaiki bentuk konfigurasi lengkap:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Penulisan langsung melalui editor tetap diizinkan, tetapi Gateway yang sedang berjalan memperlakukannya sebagai
tidak tepercaya sampai valid. Edit langsung yang tidak valid dapat dipulihkan dari
cadangan terakhir yang diketahui baik selama startup atau hot reload. Lihat
[Gateway troubleshooting](/id/gateway/troubleshooting#gateway-restored-last-known-good-config).

Pemulihan seluruh file dicadangkan untuk konfigurasi yang rusak secara global, seperti parse
error, kegagalan schema tingkat root, kegagalan migrasi lama, atau kegagalan campuran plugin
dan root. Jika validasi gagal hanya di bawah `plugins.entries.<id>...`,
OpenClaw mempertahankan `openclaw.json` aktif tetap di tempatnya dan melaporkan
masalah lokal Plugin sebagai gantinya alih-alih memulihkan `.last-good`. Ini mencegah perubahan schema Plugin atau
ketidaksesuaian `minHostVersion` membatalkan pengaturan pengguna lain yang tidak terkait seperti models,
providers, profil auth, channels, eksposur gateway, tools, memory, browser, atau
konfigurasi cron.

## Subperintah

- `config file`: Cetak path file konfigurasi aktif (di-resolve dari `OPENCLAW_CONFIG_PATH` atau lokasi default). Path tersebut harus menunjuk file biasa, bukan symlink.

Mulai ulang gateway setelah pengeditan.

## Validasi

Validasi konfigurasi saat ini terhadap schema aktif tanpa memulai
gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Setelah `openclaw config validate` berhasil, Anda dapat menggunakan TUI lokal untuk
meminta agen tertanam membandingkan konfigurasi aktif dengan dokumen sambil Anda memvalidasi
setiap perubahan dari terminal yang sama:

Jika validasi sudah gagal, mulai dengan `openclaw configure` atau
`openclaw doctor --fix`. `openclaw chat` tidak melewati guard konfigurasi
tidak valid.

```bash
openclaw chat
```

Lalu di dalam TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Loop perbaikan yang umum:

- Minta agen membandingkan konfigurasi Anda saat ini dengan halaman dokumen yang relevan dan menyarankan perbaikan terkecil.
- Terapkan edit terarah dengan `openclaw config set` atau `openclaw configure`.
- Jalankan ulang `openclaw config validate` setelah setiap perubahan.
- Jika validasi lolos tetapi runtime masih tidak sehat, jalankan `openclaw doctor` atau `openclaw doctor --fix` untuk bantuan migrasi dan perbaikan.

## Terkait

- [CLI reference](/id/cli)
- [Configuration](/id/gateway/configuration)
