---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: Bentuk otomatisasi QA privat untuk qa-lab, qa-channel, skenario ber-seed, dan laporan protokol
title: Otomatisasi QA E2E
x-i18n:
    generated_at: "2026-04-25T13:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk channel, daripada yang dapat dicapai oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyisipkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed yang didukung repo untuk tugas kickoff dan skenario QA
  dasar.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen misi
QA, mengamati perilaku channel nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundle QA Lab yang di-bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image yang sudah dibangun dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch`
membangun ulang bundle itu saat ada perubahan, dan browser otomatis memuat ulang saat hash aset QA Lab berubah.

Untuk lane smoke Matrix transport-real, jalankan:

```bash
pnpm openclaw qa matrix
```

Lane tersebut menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan
pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan
plugin Matrix nyata di dalam child gateway QA. Lane transport langsung menjaga config child
tetap dicakup pada transport yang sedang diuji, sehingga Matrix berjalan tanpa
`qa-channel` di config child. Lane ini menulis artefak laporan terstruktur dan
log stdout/stderr gabungan ke direktori output Matrix QA yang dipilih. Untuk
menangkap juga output build/launcher `scripts/run-node.mjs` bagian luar, setel
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ke file log lokal-repo.
Progres Matrix dicetak secara default. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` membatasi
seluruh proses, dan `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` membatasi pembersihan agar
teardown Docker yang macet melaporkan perintah pemulihan yang tepat alih-alih hang.

Untuk lane smoke Telegram transport-real, jalankan:

```bash
pnpm openclaw qa telegram
```

Lane tersebut menargetkan satu grup Telegram privat nyata alih-alih menyediakan
server sekali pakai. Lane ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ditambah dua bot berbeda di grup
privat yang sama. Bot SUT harus memiliki username Telegram, dan observasi
bot-ke-bot bekerja paling baik saat kedua bot mengaktifkan Bot-to-Bot Communication Mode
di `@BotFather`.
Perintah keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa exit code gagal.
Laporan dan ringkasan Telegram mencakup RTT per balasan dari
permintaan kirim pesan driver ke balasan SUT yang teramati, dimulai dari canary.

Sebelum menggunakan kredensial langsung pooled, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi
keterjangkauan admin/list saat secret maintainer tersedia. Doctor hanya melaporkan status set/missing untuk secret.

Untuk lane smoke Discord transport-real, jalankan:

```bash
pnpm openclaw qa discord
```

Lane tersebut menargetkan satu channel guild Discord privat nyata dengan dua bot: bot
driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh child
gateway OpenClaw melalui plugin Discord bawaan. Lane ini memerlukan
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`,
dan `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` saat menggunakan kredensial env.
Lane ini memverifikasi penanganan mention channel dan memeriksa bahwa bot SUT telah
mendaftarkan perintah native `/help` dengan Discord.
Perintah keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa exit code gagal.

Lane transport langsung sekarang berbagi satu kontrak yang lebih kecil alih-alih masing-masing
menciptakan bentuk daftar skenario sendiri:

`qa-channel` tetap menjadi suite luas perilaku produk sintetis dan bukan bagian
dari matriks cakupan transport langsung.

| Lane     | Canary | Gating mention | Blok allowlist | Balasan tingkat atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaction | Perintah help | Registrasi perintah native |
| -------- | ------ | -------------- | --------------- | -------------------- | ---------------------- | -------------------- | -------------- | ------------------ | ------------- | -------------------------- |
| Matrix   | x      | x              | x               | x                    | x                      | x                    | x              | x                  |               |                            |
| Telegram | x      | x              |                 |                      |                        |                      |                |                    | x             |                            |
| Discord  | x      | x              |                 |                      |                        |                      |                |                    |               | x                          |

Ini menjaga `qa-channel` sebagai suite luas perilaku produk sementara Matrix,
Telegram, dan transport langsung di masa depan berbagi satu daftar periksa kontrak transport yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, memasang dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan dan
ringkasan QA normal kembali ke `.artifacts/qa-e2e/...` di host.
Ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Proses suite host dan Multipass menjalankan beberapa skenario terpilih secara paralel
dengan worker gateway terisolasi secara default. `qa-channel` default ke konkurensi
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa exit code gagal.
Proses langsung meneruskan input auth QA yang didukung dan praktis untuk
guest: key provider berbasis env, path konfigurasi provider langsung QA, dan
`CODEX_HOME` bila ada. Pertahankan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang di-mount.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Aset ini sengaja disimpan di git agar rencana QA terlihat bagi manusia maupun
agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah
sumber kebenaran untuk satu test run dan seharusnya mendefinisikan:

- metadata skenario
- metadata kategori, kapabilitas, lane, dan risiko opsional
- referensi docs dan code
- kebutuhan plugin opsional
- patch konfigurasi gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan kembali yang mendukung `qa-flow` boleh tetap generik
dan lintas-cutting. Misalnya, skenario markdown dapat menggabungkan helper
sisi-transport dengan helper sisi-browser yang mengendalikan Control UI tersemat melalui
seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan kapabilitas produk, bukan folder
pohon sumber. Pertahankan ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar dasar harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup action pesan
- callback Cron
- memory recall
- pergantian model
- handoff subagent
- pembacaan repo dan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi
  lane mock deterministik default untuk QA yang didukung repo dan parity gate.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol,
  fixture, record/replay, dan chaos eksperimental. Ini bersifat aditif dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi lane provider berada di `extensions/qa-lab/src/providers/`.
Setiap provider memiliki default, startup server lokal, konfigurasi model gateway,
kebutuhan staging auth-profile, dan flag kapabilitas live/mock-nya sendiri. Kode suite dan gateway bersama
seharusnya merutekan melalui registri provider alih-alih bercabang berdasarkan
nama provider.

## Adaptor transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown.
`qa-channel` adalah adaptor pertama pada seam tersebut, tetapi target desainnya lebih luas:
channel nyata atau sintetis di masa depan seharusnya dipasang ke runner suite yang sama
alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- adaptor transport memiliki config gateway, readiness, observasi masuk dan keluar, action transport, dan status transport yang dinormalisasi.
- file skenario markdown di bawah `qa/scenarios/` mendefinisikan test run; `qa-lab` menyediakan permukaan runtime yang dapat digunakan kembali yang mengeksekusinya.

Panduan adopsi untuk maintainer terkait adaptor channel baru berada di
[Testing](/id/help/testing#adding-a-channel-to-qa).

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang teramati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model live
dan tulis laporan Markdown yang dinilai:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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

Perintah ini menjalankan proses child gateway QA lokal, bukan Docker. Skenario character eval
sebaiknya menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, mencatat statistik proses dasar, lalu meminta model juri dalam mode fast dengan
reasoning `xhigh` jika didukung untuk memberi peringkat proses berdasarkan naturalness, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt juri tetap mendapatkan
setiap transkrip dan status proses, tetapi ref kandidat diganti dengan label netral seperti
`candidate-01`; laporan memetakan peringkat kembali ke ref nyata setelah parsing.
Proses kandidat default ke thinking `high`, dengan `medium` untuk GPT-5.4 dan `xhigh`
untuk ref eval OpenAI lama yang mendukungnya. Override kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI default ke mode fast agar pemrosesan prioritas digunakan ketika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika satu
kandidat atau juri memerlukan override. Berikan `--fast` hanya jika Anda ingin memaksa mode fast aktif untuk setiap model kandidat. Durasi kandidat dan juri dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit mengatakan agar tidak memberi peringkat berdasarkan kecepatan.
Proses model kandidat dan juri keduanya default ke konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan gateway lokal
membuat proses terlalu bising.
Saat tidak ada kandidat `--model` yang diberikan, default character eval adalah
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat `--model` tidak diberikan.
Saat tidak ada `--judge-model` yang diberikan, default juri adalah
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/id/web/dashboard)
