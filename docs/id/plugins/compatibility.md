---
read_when:
    - Anda memelihara sebuah Plugin OpenClaw
    - Anda melihat peringatan kompatibilitas Plugin
    - Anda sedang merencanakan migrasi SDK atau manifes Plugin
summary: Kontrak kompatibilitas Plugin, metadata deprecation, dan ekspektasi migrasi
title: Kompatibilitas Plugin
x-i18n:
    generated_at: "2026-04-25T13:50:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw mempertahankan kontrak Plugin lama tetap terhubung melalui adapter kompatibilitas
bernama sebelum menghapusnya. Ini melindungi Plugin bawaan dan eksternal yang sudah ada
sementara kontrak SDK, manifes, setup, config, dan runtime agen terus berkembang.

## Registri kompatibilitas

Kontrak kompatibilitas Plugin dilacak di registri inti pada
`src/plugins/compat/registry.ts`.

Setiap record memiliki:

- kode kompatibilitas yang stabil
- status: `active`, `deprecated`, `removal-pending`, atau `removed`
- pemilik: SDK, config, setup, channel, provider, eksekusi plugin, runtime agen,
  atau core
- tanggal pengenalan dan deprecation bila berlaku
- panduan penggantian
- dokumentasi, diagnostik, dan test yang mencakup perilaku lama dan baru

Registri ini adalah sumber untuk perencanaan maintainer dan pemeriksaan plugin inspector di masa depan. Jika perilaku yang menghadap Plugin berubah, tambahkan atau perbarui record kompatibilitas dalam perubahan yang sama yang menambahkan adapter.

## Paket plugin inspector

Plugin inspector seharusnya berada di luar repo inti OpenClaw sebagai
paket/repo terpisah yang didukung oleh kontrak kompatibilitas dan manifes yang diberi versi.

CLI hari pertama seharusnya:

```sh
openclaw-plugin-inspector ./my-plugin
```

CLI ini seharusnya mengeluarkan:

- validasi manifes/skema
- versi kompatibilitas kontrak yang sedang diperiksa
- pemeriksaan metadata instalasi/source
- pemeriksaan import cold-path
- peringatan deprecation dan kompatibilitas

Gunakan `--json` untuk output yang stabil dan dapat dibaca mesin pada anotasi CI. OpenClaw
core seharusnya mengekspos kontrak dan fixture yang dapat digunakan inspector, tetapi
tidak seharusnya memublikasikan biner inspector dari paket utama `openclaw`.

## Kebijakan deprecation

OpenClaw tidak seharusnya menghapus kontrak Plugin yang terdokumentasi dalam rilis yang sama
dengan saat penggantinya diperkenalkan.

Urutan migrasinya adalah:

1. Tambahkan kontrak baru.
2. Pertahankan perilaku lama tetap terhubung melalui adapter kompatibilitas bernama.
3. Keluarkan diagnostik atau peringatan saat pembuat Plugin dapat bertindak.
4. Dokumentasikan penggantian dan timeline.
5. Uji jalur lama dan baru.
6. Tunggu selama jendela migrasi yang diumumkan.
7. Hapus hanya dengan persetujuan rilis breaking yang eksplisit.

Record yang deprecated harus menyertakan tanggal mulai peringatan, pengganti, tautan dokumentasi,
dan tanggal target penghapusan jika diketahui.

## Area kompatibilitas saat ini

Record kompatibilitas saat ini mencakup:

- import SDK luas lama seperti `openclaw/plugin-sdk/compat`
- bentuk Plugin lama yang hanya-hook dan `before_agent_start`
- perilaku allowlist dan enablement Plugin bawaan
- metadata manifes env-var provider/channel lama
- petunjuk aktivasi yang sedang digantikan oleh kepemilikan kontribusi manifes
- alias penamaan `embeddedHarness` dan `agent-harness` sementara penamaan publik bergerak
  menuju `agentRuntime`
- fallback metadata konfigurasi saluran bawaan yang dihasilkan sementara metadata
  `channelConfigs` yang registry-first hadir

Kode Plugin baru sebaiknya memilih pengganti yang tercantum di registri dan di
panduan migrasi spesifik. Plugin yang sudah ada dapat terus menggunakan jalur kompatibilitas
sampai dokumentasi, diagnostik, dan catatan rilis mengumumkan jendela penghapusan.

## Catatan rilis

Catatan rilis seharusnya menyertakan deprecation Plugin yang akan datang dengan tanggal target dan
tautan ke dokumentasi migrasi. Peringatan itu perlu terjadi sebelum suatu jalur kompatibilitas berpindah ke `removal-pending` atau `removed`.
