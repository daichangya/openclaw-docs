---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi di sekitar dashboard Gateway
summary: Bentuk otomatisasi QA privat untuk qa-lab, qa-channel, skenario yang di-seed, dan laporan protokol
title: Otomatisasi QA E2E
x-i18n:
    generated_at: "2026-04-10T09:13:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 357d6698304ff7a8c4aa8a7be97f684d50f72b524740050aa761ac0ee68266de
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomatisasi QA E2E

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis dan berbentuk channel dibandingkan yang bisa dicapai oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread, reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip, menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed yang didukung repo untuk tugas kickoff dan skenario QA dasar.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dashboard Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Perintah itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen sebuah misi QA, mengamati perilaku channel nyata, dan mencatat apa yang berhasil, gagal, atau tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali, mulai stack dengan bundle QA Lab yang di-bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker tetap berjalan pada image yang sudah dibangun sebelumnya dan melakukan bind-mount `extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch` membangun ulang bundle tersebut saat ada perubahan, dan browser akan memuat ulang otomatis ketika hash aset QA Lab berubah.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke dalam jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini akan mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw di dalam guest, menjalankan `qa suite`, lalu menyalin laporan dan ringkasan QA normal kembali ke `.artifacts/qa-e2e/...` pada host.
Perintah ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
Live run meneruskan input autentikasi QA yang didukung dan praktis untuk guest: kunci penyedia berbasis env, path konfigurasi penyedia live QA, dan `CODEX_HOME` jika ada. Pertahankan `--output-dir` di bawah root repo agar guest dapat menulis kembali melalui workspace yang di-mount.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Ini sengaja disimpan di git agar rencana QA terlihat oleh manusia maupun agen. Daftar dasar harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback cron
- recall memori
- peralihan model
- handoff subagen
- pembacaan repo dan dokumen
- satu tugas build kecil seperti Lobster Invaders

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama pada beberapa ref model live dan tulis laporan Markdown yang dinilai:

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

Perintah ini menjalankan child process gateway QA lokal, bukan Docker. Skenario evaluasi karakter harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap transkrip lengkap, mencatat statistik run dasar, lalu meminta model juri dalam mode fast dengan penalaran `xhigh` untuk memberi peringkat run berdasarkan kealamian, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan penyedia: prompt juri tetap menerima setiap transkrip dan status run, tetapi ref kandidat diganti dengan label netral seperti `candidate-01`; laporan memetakan kembali peringkat ke ref asli setelah parsing.
Run kandidat secara default menggunakan thinking `high`, dengan `xhigh` untuk model OpenAI yang mendukungnya. Override kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback global, dan format lama `--model-thinking <provider/model=level>` tetap dipertahankan demi kompatibilitas.
Ref kandidat OpenAI secara default menggunakan mode fast agar pemrosesan prioritas dipakai di tempat yang didukung oleh penyedia. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika satu kandidat atau juri memerlukan override. Gunakan `--fast` hanya saat Anda ingin memaksa mode fast aktif untuk setiap model kandidat. Durasi kandidat dan juri dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit menyatakan agar tidak memberi peringkat berdasarkan kecepatan.
Run model kandidat dan juri sama-sama secara default menggunakan konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas penyedia atau tekanan gateway lokal membuat sebuah run terlalu bising.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` ketika tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, juri default-nya adalah
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/web/dashboard)
