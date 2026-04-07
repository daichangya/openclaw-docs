---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi di sekitar dashboard Gateway
summary: Bentuk otomatisasi QA privat untuk qa-lab, qa-channel, skenario seed, dan laporan protokol
title: Otomatisasi QA E2E
x-i18n:
    generated_at: "2026-04-07T09:13:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b68cfcfb50532dbda93ba62e1ed8dc6a7ddd4214cb1db8c9a84a7bc0b32b3060
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomatisasi QA E2E

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis
dan berbentuk kanal daripada yang dapat dilakukan oleh satu uji unit.

Komponen saat ini:

- `extensions/qa-channel`: kanal pesan sintetis dengan permukaan DM, kanal, thread,
  reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed yang didukung repo untuk tugas kickoff dan skenario QA
  dasar.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dashboard Gateway (UI Kontrol) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen sebuah
misi QA, mengamati perilaku kanal nyata, dan mencatat apa yang berhasil, gagal, atau
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
`extensions/qa-lab/web/dist` ke dalam kontainer `qa-lab`. `qa:lab:watch`
membangun ulang bundle tersebut saat ada perubahan, dan browser memuat ulang otomatis ketika hash aset QA Lab berubah.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

Ini sengaja ada di git agar rencana QA terlihat oleh manusia maupun
agen. Daftar dasar harus tetap cukup luas untuk mencakup:

- obrolan DM dan kanal
- perilaku thread
- siklus hidup aksi pesan
- callback cron
- pemanggilan memori
- peralihan model
- handoff subagen
- pembacaan repo dan pembacaan dokumen
- satu tugas build kecil seperti Lobster Invaders

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari linimasa bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

## Dokumen terkait

- [Pengujian](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/web/dashboard)
