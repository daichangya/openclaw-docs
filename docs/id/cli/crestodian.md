---
read_when:
    - Anda menjalankan openclaw tanpa perintah dan ingin memahami Crestodian
    - Anda memerlukan cara yang aman tanpa config untuk memeriksa atau memperbaiki OpenClaw
    - Anda sedang merancang atau mengaktifkan mode penyelamatan message-channel
summary: Referensi CLI dan model keamanan untuk Crestodian, helper setup dan perbaikan yang aman tanpa config
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:43:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian adalah helper setup, perbaikan, dan konfigurasi lokal OpenClaw. Tool ini
dirancang agar tetap dapat dijangkau ketika jalur agen normal rusak.

Menjalankan `openclaw` tanpa perintah akan memulai Crestodian di terminal interaktif.
Menjalankan `openclaw crestodian` akan memulai helper yang sama secara eksplisit.

## Yang ditampilkan Crestodian

Saat startup, Crestodian interaktif membuka shell TUI yang sama yang digunakan oleh
`openclaw tui`, dengan backend chat Crestodian. Log chat dimulai dengan sapaan
singkat:

- kapan harus memulai Crestodian
- model atau jalur planner deterministik yang benar-benar digunakan Crestodian
- validitas config dan agen default
- keterjangkauan Gateway dari probe startup pertama
- tindakan debug berikutnya yang dapat dilakukan Crestodian

Crestodian tidak membuang secret atau memuat perintah CLI Plugin hanya untuk memulai. TUI
tetap menyediakan header normal, log chat, baris status, footer, autocomplete,
dan kontrol editor.

Gunakan `status` untuk inventaris terperinci dengan path config, path docs/source,
probe CLI lokal, keberadaan API key, agen, model, dan detail Gateway.

Crestodian menggunakan discovery referensi OpenClaw yang sama seperti agen biasa. Dalam checkout Git,
Crestodian mengarahkan dirinya ke `docs/` lokal dan tree source lokal. Dalam instalasi paket npm, Crestodian
menggunakan docs paket yang dibundel dan menaut ke
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), dengan panduan eksplisit
untuk meninjau source kapan pun docs tidak memadai.

## Contoh

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Di dalam TUI Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Startup aman

Jalur startup Crestodian sengaja dibuat kecil. Crestodian dapat berjalan ketika:

- `openclaw.json` tidak ada
- `openclaw.json` tidak valid
- Gateway mati
- pendaftaran perintah Plugin tidak tersedia
- belum ada agen yang dikonfigurasi

`openclaw --help` dan `openclaw --version` tetap menggunakan jalur cepat normal.
`openclaw` noninteraktif keluar dengan pesan singkat alih-alih mencetak help root,
karena produk tanpa perintah adalah Crestodian.

## Operasi dan persetujuan

Crestodian menggunakan operasi bertipe alih-alih mengedit config secara ad hoc.

Operasi read-only dapat dijalankan segera:

- tampilkan ringkasan
- daftar agen
- tampilkan status model/backend
- jalankan pemeriksaan status atau health
- periksa keterjangkauan Gateway
- jalankan doctor tanpa perbaikan interaktif
- validasi config
- tampilkan path audit log

Operasi persisten memerlukan persetujuan percakapan dalam mode interaktif kecuali
Anda meneruskan `--yes` untuk perintah langsung:

- menulis config
- menjalankan `config set`
- menetapkan nilai SecretRef yang didukung melalui `config set-ref`
- menjalankan bootstrap setup/onboarding
- mengubah model default
- memulai, menghentikan, atau me-restart Gateway
- membuat agen
- menjalankan perbaikan doctor yang menulis ulang config atau state

Penulisan yang diterapkan dicatat di:

```text
~/.openclaw/audit/crestodian.jsonl
```

Discovery tidak diaudit. Hanya operasi yang diterapkan dan penulisan yang dicatat.

`openclaw onboard --modern` memulai Crestodian sebagai pratinjau onboarding modern.
`openclaw onboard` biasa tetap menjalankan onboarding klasik.

## Bootstrap Setup

`setup` adalah bootstrap onboarding yang mengutamakan chat. Setup menulis hanya melalui
operasi config bertipe dan meminta persetujuan terlebih dahulu.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Ketika belum ada model yang dikonfigurasi, setup memilih backend pertama yang dapat digunakan dalam
urutan ini dan memberi tahu Anda apa yang dipilih:

- model eksplisit yang ada, jika sudah dikonfigurasi
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Jika tidak ada yang tersedia, setup tetap menulis workspace default dan membiarkan
model tidak disetel. Instal atau login ke Codex/Claude Code, atau sediakan
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, lalu jalankan setup lagi.

## Planner Berbantuan Model

Crestodian selalu dimulai dalam mode deterministik. Untuk perintah fuzzy yang tidak
dipahami parser deterministik, Crestodian lokal dapat membuat satu giliran planner terbatas
melalui jalur runtime normal OpenClaw. Crestodian terlebih dahulu menggunakan
model OpenClaw yang dikonfigurasi. Jika belum ada model terkonfigurasi yang dapat digunakan, Crestodian dapat
fallback ke runtime lokal yang sudah ada di mesin:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness app-server Codex: `openai/gpt-5.5` dengan `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Planner berbantuan model tidak dapat memutasi config secara langsung. Planner harus menerjemahkan
permintaan menjadi salah satu perintah bertipe Crestodian, lalu aturan persetujuan dan
audit normal tetap berlaku. Crestodian mencetak model yang digunakan dan perintah
yang diinterpretasikan sebelum menjalankan apa pun. Giliran planner fallback tanpa config bersifat
sementara, tool-disabled bila runtime mendukungnya, dan menggunakan
workspace/session sementara.

Mode penyelamatan message-channel tidak menggunakan planner berbantuan model. Penyelamatan
jarak jauh tetap deterministik sehingga jalur agen normal yang rusak atau disusupi tidak
dapat digunakan sebagai editor config.

## Beralih ke agen

Gunakan selector bahasa alami untuk keluar dari Crestodian dan membuka TUI normal:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, dan `openclaw terminal` tetap membuka TUI agen normal
secara langsung. Perintah-perintah tersebut tidak memulai Crestodian.

Setelah beralih ke TUI normal, gunakan `/crestodian` untuk kembali ke Crestodian.
Anda dapat menyertakan permintaan lanjutan:

```text
/crestodian
/crestodian restart gateway
```

Peralihan agen di dalam TUI meninggalkan breadcrumb bahwa `/crestodian` tersedia.

## Mode penyelamatan pesan

Mode penyelamatan pesan adalah entrypoint message-channel untuk Crestodian. Mode ini untuk
kasus ketika agen normal Anda mati, tetapi channel tepercaya seperti WhatsApp
masih menerima perintah.

Perintah teks yang didukung:

- `/crestodian <request>`

Alur operator:

```text
Anda, di DM owner tepercaya: /crestodian status
OpenClaw: Mode penyelamatan Crestodian. Gateway dapat dijangkau: tidak. Config valid: tidak.
Anda: /crestodian restart gateway
OpenClaw: Rencana: restart Gateway. Balas /crestodian yes untuk menerapkan.
Anda: /crestodian yes
OpenClaw: Diterapkan. Entri audit ditulis.
```

Pembuatan agen juga dapat diantrikan dari prompt lokal atau mode penyelamatan:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Mode penyelamatan jarak jauh adalah surface admin. Mode ini harus diperlakukan seperti perbaikan
config jarak jauh, bukan seperti chat normal.

Kontrak keamanan untuk penyelamatan jarak jauh:

- Dinonaktifkan saat sandboxing aktif. Jika agen/session berada dalam sandbox,
  Crestodian harus menolak penyelamatan jarak jauh dan menjelaskan bahwa perbaikan CLI lokal
  diperlukan.
- Status efektif default adalah `auto`: izinkan penyelamatan jarak jauh hanya dalam operasi YOLO
  tepercaya, ketika runtime sudah memiliki otoritas lokal tanpa sandbox.
- Memerlukan identitas owner yang eksplisit. Penyelamatan tidak boleh menerima aturan
  pengirim wildcard, kebijakan grup terbuka, webhook tanpa autentikasi, atau channel anonim.
- Hanya DM owner secara default. Penyelamatan grup/channel memerlukan opt-in eksplisit dan
  prompt persetujuan sebaiknya tetap dirutekan ke DM owner.
- Penyelamatan jarak jauh tidak dapat membuka TUI lokal atau beralih ke session agen
  interaktif. Gunakan `openclaw` lokal untuk handoff agen.
- Penulisan persisten tetap memerlukan persetujuan, bahkan dalam mode penyelamatan.
- Audit setiap operasi penyelamatan yang diterapkan, termasuk channel, akun, pengirim,
  session key, operasi, hash config sebelum, dan hash config sesudah.
- Jangan pernah menggemakan secret. Inspeksi SecretRef harus melaporkan ketersediaan, bukan
  nilainya.
- Jika Gateway hidup, utamakan operasi bertipe Gateway. Jika Gateway
  mati, gunakan hanya surface perbaikan lokal minimal yang tidak bergantung pada loop agen
  normal.

Bentuk config:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` harus menerima:

- `"auto"`: default. Izinkan hanya ketika runtime efektif adalah YOLO dan
  sandboxing nonaktif.
- `false`: jangan pernah izinkan penyelamatan message-channel.
- `true`: izinkan penyelamatan secara eksplisit ketika pemeriksaan owner/channel lolos. Ini
  tetap tidak boleh melewati penolakan sandboxing.

Postur YOLO default `"auto"` adalah:

- mode sandbox resolve ke `off`
- `tools.exec.security` resolve ke `full`
- `tools.exec.ask` resolve ke `off`

Penyelamatan jarak jauh dicakup oleh lane Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Fallback planner lokal tanpa config dicakup oleh:

```bash
pnpm test:docker:crestodian-planner
```

Pemeriksaan smoke surface perintah live channel opt-in memeriksa `/crestodian status` plus
roundtrip persetujuan persisten melalui handler penyelamatan:

```bash
pnpm test:live:crestodian-rescue-channel
```

Setup baru tanpa config melalui Crestodian dicakup oleh:

```bash
pnpm test:docker:crestodian-first-run
```

Lane itu dimulai dengan state dir kosong, merutekan `openclaw` polos ke Crestodian,
menetapkan model default, membuat agen tambahan, mengonfigurasi Discord melalui
pengaktifan Plugin plus token SecretRef, memvalidasi config, dan memeriksa audit
log. QA Lab juga memiliki skenario berbasis repo untuk alur Ring 0 yang sama:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Terkait

- [CLI reference](/id/cli)
- [Doctor](/id/cli/doctor)
- [TUI](/id/cli/tui)
- [Sandbox](/id/cli/sandbox)
- [Security](/id/cli/security)
