---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun automasi QA dengan realisme lebih tinggi di sekitar dashboard Gateway
summary: Bentuk automasi QA privat untuk qa-lab, qa-channel, seeded scenarios, dan laporan protokol
title: Automasi E2E QA
x-i18n:
    generated_at: "2026-04-23T09:20:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automasi E2E QA

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk channel, daripada yang dapat dicapai oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan surface DM, channel, thread,
  reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed yang didukung repo untuk tugas kickoff dan skenario QA
  baseline.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dashboard Gateway (Control UI) dengan agent.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Perintah itu membangun situs QA, memulai lane Gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop automasi dapat memberi agent sebuah misi QA,
mengamati perilaku channel nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundle QA Lab yang di-bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker tetap berjalan pada image yang sudah dibangun sebelumnya dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch`
membangun ulang bundle tersebut saat ada perubahan, dan browser melakukan auto-reload saat hash aset QA Lab berubah.

Untuk lane smoke Matrix transport-real, jalankan:

```bash
pnpm openclaw qa matrix
```

Lane tersebut memprovisikan homeserver Tuwunel sekali pakai di Docker, mendaftarkan
pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan
plugin Matrix nyata di dalam child Gateway QA. Lane transport live menjaga config child
tetap dibatasi pada transport yang sedang diuji, sehingga Matrix berjalan tanpa
`qa-channel` di config child. Lane ini menulis artefak laporan terstruktur dan
log gabungan stdout/stderr ke direktori output QA Matrix yang dipilih. Untuk
juga menangkap output build/launcher `scripts/run-node.mjs` luar, atur
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ke file log lokal repo.

Untuk lane smoke Telegram transport-real, jalankan:

```bash
pnpm openclaw qa telegram
```

Lane tersebut menargetkan satu grup Telegram privat nyata alih-alih memprovisikan server
sekali pakai. Lane ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, serta dua bot berbeda dalam grup
privat yang sama. Bot SUT harus memiliki username Telegram, dan observasi bot-ke-bot
bekerja paling baik saat kedua bot mengaktifkan Bot-to-Bot Communication Mode
di `@BotFather`.
Perintah keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa exit code gagal.
Laporan dan ringkasan Telegram menyertakan RTT per balasan dari request pengiriman
pesan driver ke balasan SUT yang diamati, dimulai dari canary.

Lane transport live kini berbagi satu kontrak yang lebih kecil alih-alih masing-masing
menciptakan bentuk daftar skenario mereka sendiri:

`qa-channel` tetap menjadi suite perilaku produk sintetis yang luas dan bukan bagian
dari matriks cakupan transport live.

| Lane     | Canary | Pembatasan mention | Blok allowlist | Balasan top-level | Lanjutkan setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaction | Perintah help |
| -------- | ------ | ------------------ | -------------- | ----------------- | ------------------------- | -------------------- | -------------- | ------------------ | ------------- |
| Matrix   | x      | x                  | x              | x                 | x                         | x                    | x              | x                  |               |
| Telegram | x      |                    |                |                   |                           |                      |                |                    | x             |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport live masa depan berbagi satu checklist kontrak transport
yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Perintah ini mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin kembali laporan dan
ringkasan QA normal ke `.artifacts/qa-e2e/...` pada host.
Perintah ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Eksekusi suite pada host dan Multipass menjalankan beberapa skenario yang dipilih secara paralel
dengan worker Gateway terisolasi secara default. `qa-channel` default ke konkurensi
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyetel
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa exit code gagal.
Eksekusi live meneruskan input auth QA yang didukung dan praktis untuk
guest: kunci provider berbasis env, path config provider live QA, dan
`CODEX_HOME` bila ada. Pertahankan `--output-dir` di bawah root repo agar guest
dapat menulis balik melalui workspace yang di-mount.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Aset ini sengaja disimpan di git agar rencana QA terlihat baik bagi manusia maupun
agent.

`qa-lab` harus tetap menjadi runner Markdown generik. Setiap file Markdown skenario adalah
sumber kebenaran untuk satu test run dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kapabilitas, lane, dan risiko opsional
- referensi docs dan code
- persyaratan plugin opsional
- patch config Gateway opsional
- `qa-flow` yang dapat dieksekusi

Surface runtime yang dapat digunakan kembali yang mendukung `qa-flow` boleh tetap generik
dan lintas-cutting. Misalnya, skenario Markdown dapat menggabungkan helper sisi
transport dengan helper sisi browser yang menggerakkan Control UI tertanam melalui
seam Gateway `browser.request` tanpa menambahkan runner khusus.

File skenario sebaiknya dikelompokkan berdasarkan kapabilitas produk, bukan folder
source tree. Jaga ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback Cron
- recall memori
- pergantian model
- handoff subagent
- membaca repo dan membaca docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi
  lane mock deterministik default untuk QA yang didukung repo dan gate paritas.
- `aimock` memulai server provider yang didukung AIMock untuk cakupan protokol,
  fixture, record/replay, dan chaos eksperimental. Ini bersifat tambahan dan tidak menggantikan
  dispatcher skenario `mock-openai`.

Implementasi lane provider berada di `extensions/qa-lab/src/providers/`.
Setiap provider memiliki default-nya sendiri, startup server lokal, config model Gateway,
kebutuhan staging auth-profile, dan flag kapabilitas live/mock. Kode suite dan Gateway
bersama sebaiknya merutekan melalui registry provider alih-alih bercabang berdasarkan
nama provider.

## Adaptor transport

`qa-lab` memiliki seam transport generik untuk skenario QA Markdown.
`qa-channel` adalah adaptor pertama pada seam tersebut, tetapi target desainnya lebih luas:
channel nyata atau sintetis di masa depan harus terhubung ke suite runner yang sama
alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- adaptor transport memiliki config Gateway, kesiapan, observasi masuk dan keluar, aksi transport, dan status transport yang dinormalisasi.
- file skenario Markdown di bawah `qa/scenarios/` mendefinisikan test run; `qa-lab` menyediakan surface runtime yang dapat digunakan ulang yang mengeksekusinya.

Panduan adopsi untuk maintainer bagi adaptor channel baru ada di
[Testing](/id/help/testing#adding-a-channel-to-qa).

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model live
dan tulis laporan Markdown yang dinilai:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Perintah ini menjalankan child process Gateway QA lokal, bukan Docker. Skenario character eval
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa ia sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, mencatat statistik dasar eksekusi, lalu meminta model juri dalam mode cepat dengan
penalaran `xhigh` untuk memberi peringkat run berdasarkan kealamian, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt juri tetap mendapatkan
setiap transkrip dan status run, tetapi ref kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan kembali peringkat ke ref nyata setelah
parsing.
Run kandidat default ke thinking `high`, dengan `xhigh` untuk model OpenAI yang
mendukungnya. Override kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback
global, dan bentuk lama `--model-thinking <provider/model=level>` dipertahankan
untuk kompatibilitas.
Ref kandidat OpenAI default ke mode cepat sehingga pemrosesan prioritas digunakan saat
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat
satu kandidat atau juri memerlukan override. Berikan `--fast` hanya saat Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan juri
dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit menyatakan
agar tidak memberi peringkat berdasarkan kecepatan.
Run model kandidat dan juri keduanya default ke konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas provider atau tekanan Gateway lokal
membuat run terlalu berisik.
Saat tidak ada kandidat `--model` yang diberikan, character eval default ke
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, juri default ke
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Docs terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/id/web/dashboard)
