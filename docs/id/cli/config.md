---
read_when:
    - Anda ingin membaca atau mengedit config secara non-interaktif
summary: Referensi CLI untuk `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: config
x-i18n:
    generated_at: "2026-04-23T09:18:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Helper config untuk edit non-interaktif di `openclaw.json`: dapatkan/setel/hapus/file/schema/validasi
nilai berdasarkan path dan cetak file config yang aktif. Jalankan tanpa subperintah untuk
membuka wizard konfigurasi (sama seperti `openclaw configure`).

Opsi root:

- `--section <section>`: filter bagian guided-setup yang dapat diulang saat Anda menjalankan `openclaw config` tanpa subperintah

Bagian terpandu yang didukung:

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
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Cetak schema JSON yang dihasilkan untuk `openclaw.json` ke stdout sebagai JSON.

Yang disertakan:

- Schema config root saat ini, plus field string root `$schema` untuk tooling editor
- Metadata dokumen `title` dan `description` field yang digunakan oleh UI Control
- Node objek bertingkat, wildcard (`*`), dan item array (`[]`) mewarisi metadata `title` / `description` yang sama saat dokumentasi field yang cocok ada
- Cabang `anyOf` / `oneOf` / `allOf` juga mewarisi metadata dokumen yang sama saat dokumentasi field yang cocok ada
- Metadata schema plugin + channel live best-effort saat manifest runtime dapat dimuat
- Schema fallback yang bersih bahkan saat config saat ini tidak valid

RPC runtime terkait:

- `config.schema.lookup` mengembalikan satu path config yang dinormalisasi dengan
  node schema dangkal (`title`, `description`, `type`, `enum`, `const`, batas umum),
  metadata hint UI yang cocok, dan ringkasan child langsung. Gunakan ini untuk
  drill-down dengan cakupan path di UI Control atau klien kustom.

```bash
openclaw config schema
```

Pipe ke file saat Anda ingin memeriksa atau memvalidasinya dengan alat lain:

```bash
openclaw config schema > openclaw.schema.json
```

### Path

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

Nilai di-parse sebagai JSON5 jika memungkinkan; jika tidak, akan diperlakukan sebagai string.
Gunakan `--strict-json` untuk mewajibkan parsing JSON5. `--json` tetap didukung sebagai alias lama.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` mencetak nilai mentah sebagai JSON alih-alih teks yang diformat untuk terminal.

Penetapan objek mengganti path target secara default. Path map/list yang dilindungi
yang umum menyimpan entri tambahan pengguna, seperti `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries`, dan
`auth.profiles`, menolak penggantian yang akan menghapus entri yang ada kecuali
Anda memberikan `--replace`.

Gunakan `--merge` saat menambahkan entri ke map tersebut:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Gunakan `--replace` hanya saat Anda memang ingin nilai yang diberikan menjadi
nilai target lengkap.

## Mode `config set`

`openclaw config set` mendukung empat gaya penetapan:

1. Mode nilai: `openclaw config set <path> <value>`
2. Mode builder SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Mode builder provider (hanya path `secrets.providers.<alias>`):

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

- Penetapan SecretRef ditolak pada surface mutable-runtime yang tidak didukung (misalnya `hooks.token`, `commands.ownerDisplaySecret`, token webhook thread-binding Discord, dan JSON kredensial WhatsApp). Lihat [SecretRef Credential Surface](/id/reference/secretref-credential-surface).

Parsing batch selalu menggunakan payload batch (`--batch-json`/`--batch-file`) sebagai sumber kebenaran.
`--strict-json` / `--json` tidak mengubah perilaku parsing batch.

Mode path/nilai JSON tetap didukung untuk SecretRef dan provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flag Builder Provider

Target builder provider harus menggunakan `secrets.providers.<alias>` sebagai path.

Flag umum:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (dapat diulang)

Provider file (`--provider-source file`):

- `--provider-path <path>` (wajib)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

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

Contoh provider exec yang diperkeras:

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

- Mode builder: menjalankan pemeriksaan keteresolusian SecretRef untuk ref/provider yang berubah.
- Mode JSON (`--strict-json`, `--json`, atau mode batch): menjalankan validasi schema plus pemeriksaan keteresolusian SecretRef.
- Validasi kebijakan juga berjalan untuk surface target SecretRef tidak didukung yang diketahui.
- Pemeriksaan kebijakan mengevaluasi seluruh config pasca-perubahan, jadi penulisan objek induk (misalnya menetapkan `hooks` sebagai objek) tidak dapat melewati validasi surface yang tidak didukung.
- Pemeriksaan SecretRef exec dilewati secara default selama dry-run untuk menghindari efek samping perintah.
- Gunakan `--allow-exec` dengan `--dry-run` untuk ikut serta dalam pemeriksaan SecretRef exec (ini dapat menjalankan perintah provider).
- `--allow-exec` hanya untuk dry-run dan akan error jika digunakan tanpa `--dry-run`.

`--dry-run --json` mencetak laporan yang dapat dibaca mesin:

- `ok`: apakah dry-run lolos
- `operations`: jumlah penetapan yang dievaluasi
- `checks`: apakah pemeriksaan schema/keteresolusian dijalankan
- `checks.resolvabilityComplete`: apakah pemeriksaan keteresolusian dijalankan sampai selesai (false saat ref exec dilewati)
- `refsChecked`: jumlah ref yang benar-benar di-resolve selama dry-run
- `skippedExecRefs`: jumlah ref exec yang dilewati karena `--allow-exec` tidak disetel
- `errors`: kegagalan schema/keteresolusian terstruktur saat `ok=false`

### Bentuk Keluaran JSON

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
      ref?: string, // ada untuk error keteresolusian
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
      "message": "Error: Variabel lingkungan \"MISSING_TEST_SECRET\" tidak disetel.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Jika dry-run gagal:

- `config schema validation failed`: bentuk config pasca-perubahan Anda tidak valid; perbaiki path/nilai atau bentuk objek provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: pindahkan kembali kredensial itu ke input plaintext/string dan pertahankan SecretRef hanya pada surface yang didukung.
- `SecretRef assignment(s) could not be resolved`: provider/ref yang dirujuk saat ini tidak dapat di-resolve (variabel env hilang, penunjuk file tidak valid, provider exec gagal, atau provider/source tidak cocok).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run melewati ref exec; jalankan ulang dengan `--allow-exec` jika Anda memerlukan validasi keteresolusian exec.
- Untuk mode batch, perbaiki entri yang gagal dan jalankan ulang `--dry-run` sebelum menulis.

## Keamanan penulisan

`openclaw config set` dan penulis config milik OpenClaw lainnya memvalidasi seluruh
config pasca-perubahan sebelum meng-commit-nya ke disk. Jika payload baru gagal dalam validasi schema
atau terlihat seperti clobber destruktif, config aktif dibiarkan apa adanya
dan payload yang ditolak disimpan di sampingnya sebagai `openclaw.json.rejected.*`.
Path config aktif harus berupa file reguler. Layout `openclaw.json`
berupa symlink tidak didukung untuk penulisan; gunakan `OPENCLAW_CONFIG_PATH` untuk menunjuk langsung
ke file aslinya.

Lebih disarankan penulisan melalui CLI untuk edit kecil:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Jika penulisan ditolak, periksa payload yang disimpan dan perbaiki bentuk config lengkapnya:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Penulisan langsung oleh editor tetap diizinkan, tetapi Gateway yang sedang berjalan memperlakukannya sebagai
tidak tepercaya sampai tervalidasi. Edit langsung yang tidak valid dapat dipulihkan dari
cadangan terakhir-yang-diketahui-baik saat startup atau hot reload. Lihat
[pemecahan masalah Gateway](/id/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Subperintah

- `config file`: Cetak path file config aktif (di-resolve dari `OPENCLAW_CONFIG_PATH` atau lokasi default). Path tersebut harus menunjuk file reguler, bukan symlink.

Restart gateway setelah pengeditan.

## Validasi

Validasi config saat ini terhadap schema aktif tanpa memulai
gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Setelah `openclaw config validate` berhasil, Anda dapat menggunakan TUI lokal agar
agen tersemat membandingkan config aktif dengan dokumentasi sambil Anda memvalidasi
setiap perubahan dari terminal yang sama:

Jika validasi sudah gagal, mulai dengan `openclaw configure` atau
`openclaw doctor --fix`. `openclaw chat` tidak melewati guard
config tidak valid.

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

- Minta agen membandingkan config Anda saat ini dengan halaman dokumentasi yang relevan dan menyarankan perbaikan terkecil.
- Terapkan edit yang terarah dengan `openclaw config set` atau `openclaw configure`.
- Jalankan ulang `openclaw config validate` setelah setiap perubahan.
- Jika validasi lolos tetapi runtime masih tidak sehat, jalankan `openclaw doctor` atau `openclaw doctor --fix` untuk bantuan migrasi dan perbaikan.
