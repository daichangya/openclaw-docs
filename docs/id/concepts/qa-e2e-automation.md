---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: Bentuk otomatisasi QA privat untuk qa-lab, qa-channel, skenario ber-seed, dan laporan protokol
title: Otomatisasi QA E2E
x-i18n:
    generated_at: "2026-04-09T01:27:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c922607d67e0f3a2489ac82bc9f510f7294ced039c1014c15b676d826441d833
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomatisasi QA E2E

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk kanal, dibandingkan yang dapat dicapai oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: kanal pesan sintetis dengan permukaan DM, channel, thread,
  reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed yang didukung repo untuk tugas kickoff dan skenario QA
  dasar.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, yang menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Perintah itu membangun situs QA, memulai lane gateway berbasis Docker, dan menampilkan
halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen misi QA,
mengamati perilaku kanal nyata, dan mencatat apa yang berhasil, gagal, atau
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
membangun ulang bundle itu saat ada perubahan, dan browser memuat ulang otomatis saat hash aset QA Lab berubah.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Ini sengaja disimpan di git agar rencana QA terlihat oleh manusia maupun
agen. Daftar dasar harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback cron
- recall memori
- pergantian model
- handoff subagen
- pembacaan repo dan pembacaan dokumen
- satu tugas build kecil seperti Lobster Invaders

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

Perintah ini menjalankan child process gateway QA lokal, bukan Docker. Skenario evaluasi karakter
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, mencatat statistik dasar run, lalu meminta model penilai dalam mode cepat dengan
penalaran `xhigh` untuk memberi peringkat pada run berdasarkan kealamian, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt penilai tetap menerima
setiap transkrip dan status run, tetapi ref kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan kembali peringkat ke ref sebenarnya setelah
parsing.
Run kandidat secara default menggunakan thinking `high`, dengan `xhigh` untuk model OpenAI yang
mendukungnya. Ganti kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI secara default menggunakan mode cepat agar pemrosesan prioritas dipakai jika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika
satu kandidat atau penilai memerlukan override. Berikan `--fast` hanya jika Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan penilai
dicatat dalam laporan untuk analisis benchmark, tetapi prompt penilai secara eksplisit menyatakan
agar tidak memberi peringkat berdasarkan kecepatan.
Run model kandidat dan penilai keduanya secara default menggunakan concurrency 16. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan gateway lokal
membuat run terlalu bising.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, penilai secara default menggunakan
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/web/dashboard)
