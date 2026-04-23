---
read_when:
    - Anda ingin memperbarui checkout source dengan aman
    - Anda perlu memahami perilaku singkat `--update`
summary: Referensi CLI untuk `openclaw update` (pembaruan source yang cukup aman + restart otomatis gateway)
title: pembaruan
x-i18n:
    generated_at: "2026-04-23T09:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Perbarui OpenClaw dengan aman dan beralih antara channel stable/beta/dev.

Jika Anda menginstal melalui **npm/pnpm/bun** (instalasi global, tanpa metadata git),
pembaruan dilakukan melalui alur package-manager di [Updating](/id/install/updating).

## Penggunaan

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opsi

- `--no-restart`: lewati restart layanan Gateway setelah pembaruan berhasil.
- `--channel <stable|beta|dev>`: setel channel pembaruan (git + npm; disimpan di konfigurasi).
- `--tag <dist-tag|version|spec>`: override target package hanya untuk pembaruan ini. Untuk instalasi package, `main` dipetakan ke `github:openclaw/openclaw#main`.
- `--dry-run`: pratinjau tindakan pembaruan yang direncanakan (alur channel/tag/target/restart) tanpa menulis konfigurasi, menginstal, menyinkronkan plugin, atau me-restart.
- `--json`: cetak JSON `UpdateRunResult` yang dapat dibaca mesin, termasuk
  `postUpdate.plugins.integrityDrifts` saat drift artefak plugin npm
  terdeteksi selama sinkronisasi plugin pascapembaruan.
- `--timeout <seconds>`: timeout per langkah (default `1200` dtk).
- `--yes`: lewati prompt konfirmasi (misalnya konfirmasi downgrade)

Catatan: downgrade memerlukan konfirmasi karena versi yang lebih lama dapat merusak konfigurasi.

## `update status`

Tampilkan channel pembaruan aktif + tag/branch/SHA git (untuk checkout source), beserta ketersediaan pembaruan.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opsi:

- `--json`: cetak JSON status yang dapat dibaca mesin.
- `--timeout <seconds>`: timeout untuk pemeriksaan (default `3` dtk).

## `update wizard`

Alur interaktif untuk memilih channel pembaruan dan mengonfirmasi apakah Gateway
harus di-restart setelah pembaruan (default-nya restart). Jika Anda memilih `dev` tanpa checkout git, perintah ini
menawarkan untuk membuatnya.

Opsi:

- `--timeout <seconds>`: timeout untuk setiap langkah pembaruan (default `1200`)

## Apa yang dilakukannya

Saat Anda beralih channel secara eksplisit (`--channel ...`), OpenClaw juga menjaga
metode instalasi tetap selaras:

- `dev` → memastikan ada checkout git (default: `~/openclaw`, override dengan `OPENCLAW_GIT_DIR`),
  memperbaruinya, dan menginstal CLI global dari checkout tersebut.
- `stable` → menginstal dari npm menggunakan `latest`.
- `beta` → lebih memilih npm dist-tag `beta`, tetapi fallback ke `latest` saat beta
  tidak ada atau lebih lama daripada rilis stable saat ini.

Auto-updater inti Gateway (saat diaktifkan melalui konfigurasi) menggunakan kembali jalur pembaruan yang sama ini.

Untuk instalasi package-manager, `openclaw update` me-resolve versi package
target sebelum memanggil package manager. Jika versi yang terinstal persis
cocok dengan target dan tidak ada perubahan channel pembaruan yang perlu disimpan,
perintah keluar sebagai skipped sebelum instalasi package, sinkronisasi plugin, refresh completion,
atau pekerjaan restart gateway.

## Alur checkout git

Channel:

- `stable`: checkout tag non-beta terbaru, lalu build + doctor.
- `beta`: lebih memilih tag `-beta` terbaru, tetapi fallback ke tag stable terbaru
  saat beta tidak ada atau lebih lama.
- `dev`: checkout `main`, lalu fetch + rebase.

Gambaran umum:

1. Memerlukan worktree yang bersih (tidak ada perubahan yang belum di-commit).
2. Beralih ke channel yang dipilih (tag atau branch).
3. Fetch upstream (khusus dev).
4. Khusus dev: preflight lint + build TypeScript di worktree sementara; jika tip gagal, perintah berjalan mundur hingga 10 commit untuk menemukan build bersih terbaru.
5. Rebase ke commit yang dipilih (khusus dev).
6. Instal dependensi dengan package manager repo. Untuk checkout pnpm, updater melakukan bootstrap `pnpm` sesuai kebutuhan (melalui `corepack` terlebih dahulu, lalu fallback sementara `npm install pnpm@10`) alih-alih menjalankan `npm run build` di dalam workspace pnpm.
7. Build + build Control UI.
8. Jalankan `openclaw doctor` sebagai pemeriksaan akhir “pembaruan aman”.
9. Sinkronkan plugin ke channel aktif (dev menggunakan plugin bawaan; stable/beta menggunakan npm) dan perbarui plugin yang diinstal melalui npm.

Jika pembaruan plugin npm yang dipin secara tepat di-resolve ke artefak yang integrity-nya
berbeda dari catatan instalasi yang tersimpan, `openclaw update` membatalkan pembaruan
artefak plugin tersebut alih-alih menginstalnya. Instal ulang atau perbarui plugin
secara eksplisit hanya setelah memverifikasi bahwa Anda memercayai artefak baru tersebut.

Jika bootstrap pnpm masih gagal, updater kini berhenti lebih awal dengan error khusus package-manager alih-alih mencoba `npm run build` di dalam checkout.

## Singkatan `--update`

`openclaw --update` ditulis ulang menjadi `openclaw update` (berguna untuk shell dan launcher script).

## Lihat juga

- `openclaw doctor` (menawarkan untuk menjalankan pembaruan terlebih dahulu pada checkout git)
- [Development channels](/id/install/development-channels)
- [Updating](/id/install/updating)
- [CLI reference](/id/cli)
