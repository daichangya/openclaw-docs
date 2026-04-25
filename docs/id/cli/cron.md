---
read_when:
    - Anda menginginkan pekerjaan terjadwal dan wakeup
    - Anda sedang men-debug eksekusi dan log cron
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan pekerjaan latar belakang)
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:43:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Kelola pekerjaan Cron untuk penjadwal Gateway.

Terkait:

- Pekerjaan Cron: [Pekerjaan Cron](/id/automation/cron-jobs)

Tip: jalankan `openclaw cron --help` untuk melihat permukaan perintah lengkap.

Catatan: `openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau
rute pengiriman yang telah di-resolve. Untuk `channel: "last"`, pratinjau menunjukkan apakah
rute di-resolve dari sesi utama/saat ini atau akan gagal tertutup.

Catatan: pekerjaan `cron add` terisolasi secara default menggunakan pengiriman `--announce`. Gunakan `--no-deliver` untuk menjaga
output tetap internal. `--deliver` tetap tersedia sebagai alias usang untuk `--announce`.

Catatan: pengiriman chat cron terisolasi bersifat shared. `--announce` adalah pengiriman fallback runner
untuk balasan akhir; `--no-deliver` menonaktifkan fallback tersebut tetapi
tidak menghapus alat `message` milik agen saat rute chat tersedia.

Catatan: pekerjaan sekali jalan (`--at`) dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk menyimpannya.

Catatan: `--session` mendukung `main`, `isolated`, `current`, dan `session:<id>`.
Gunakan `current` untuk mengikat ke sesi aktif saat pembuatan, atau `session:<id>` untuk
kunci sesi persisten yang eksplisit.

Catatan: `--session isolated` membuat transkrip/id sesi baru untuk setiap run.
Preferensi aman dan override model/auth yang dipilih pengguna secara eksplisit dapat terbawa, tetapi
konteks percakapan sekitar tidak terbawa: perutean channel/group, kebijakan kirim/antre,
elevation, origin, dan binding runtime ACP di-reset untuk run terisolasi yang baru.

Catatan: untuk pekerjaan CLI sekali jalan, datetime `--at` tanpa offset diperlakukan sebagai UTC kecuali Anda juga memberikan
`--tz <iana>`, yang menafsirkan waktu wall-clock lokal tersebut dalam timezone yang diberikan.

Catatan: pekerjaan berulang kini menggunakan retry backoff eksponensial setelah error berturut-turut (30d → 1m → 5m → 15m → 60m), lalu kembali ke jadwal normal setelah run sukses berikutnya.

Catatan: `openclaw cron run` sekarang kembali segera setelah run manual dimasukkan ke antrean untuk dieksekusi. Respons yang berhasil mencakup `{ ok: true, enqueued: true, runId }`; gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

Catatan: `openclaw cron run <job-id>` secara default melakukan force-run. Gunakan `--due` untuk mempertahankan
perilaku lama "hanya jalankan jika jatuh tempo".

Catatan: giliran cron terisolasi menekan balasan lama yang hanya berupa acknowledgement. Jika
hasil pertama hanyalah pembaruan status sementara dan tidak ada run subagen turunan yang
bertanggung jawab atas jawaban akhirnya, cron akan mem-prompt ulang sekali untuk hasil sebenarnya
sebelum pengiriman.

Catatan: jika run cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` /
`no_reply`), cron menekan pengiriman langsung keluar dan jalur ringkasan fallback terantre juga,
sehingga tidak ada apa pun yang dikirim kembali ke chat.

Catatan: `cron add|edit --model ...` menggunakan model yang dipilih dan diizinkan tersebut untuk pekerjaan.
Jika model tidak diizinkan, cron akan memberi peringatan dan kembali ke pemilihan
model agen/default pekerjaan. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa
tanpa daftar fallback per pekerjaan yang eksplisit tidak lagi menambahkan primary agen sebagai target retry ekstra tersembunyi.

Catatan: prioritas model cron terisolasi adalah override Gmail-hook terlebih dahulu, lalu per pekerjaan
`--model`, lalu override model cron-session tersimpan yang dipilih pengguna, lalu
pemilihan agen/default normal.

Catatan: mode cepat cron terisolasi mengikuti pemilihan model live yang telah di-resolve. Konfigurasi model
`params.fastMode` berlaku secara default, tetapi override `fastMode` sesi tersimpan tetap lebih diutamakan daripada konfigurasi.

Catatan: jika run terisolasi melempar `LiveSessionModelSwitchError`, cron akan mempertahankan
provider/model yang dialihkan (dan override profil auth yang dialihkan jika ada) untuk
run aktif sebelum mencoba lagi. Loop retry luar dibatasi hingga 2 retry switch
setelah percobaan awal, lalu dibatalkan alih-alih berulang tanpa akhir.

Catatan: notifikasi kegagalan menggunakan `delivery.failureDestination` terlebih dahulu, lalu
`cron.failureDestination` global, dan terakhir fallback ke target announce utama pekerjaan
saat tidak ada tujuan kegagalan eksplisit yang dikonfigurasi.

Catatan: retensi/pemangkasan dikontrol dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi run terisolasi yang telah selesai.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

Catatan upgrade: jika Anda memiliki pekerjaan cron lama dari sebelum format delivery/store saat ini, jalankan
`openclaw doctor --fix`. Doctor sekarang menormalkan field cron lama (`jobId`, `schedule.cron`,
field delivery tingkat atas termasuk `threadId` lama, alias delivery `provider` payload) dan memigrasikan pekerjaan fallback webhook `notify: true`
sederhana ke pengiriman webhook eksplisit saat `cron.webhook` telah
dikonfigurasi.

## Edit umum

Perbarui pengaturan pengiriman tanpa mengubah pesan:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Nonaktifkan pengiriman untuk pekerjaan terisolasi:

```bash
openclaw cron edit <job-id> --no-deliver
```

Aktifkan konteks bootstrap ringan untuk pekerjaan terisolasi:

```bash
openclaw cron edit <job-id> --light-context
```

Umumkan ke saluran tertentu:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Buat pekerjaan terisolasi dengan konteks bootstrap ringan:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk pekerjaan agent-turn terisolasi. Untuk run cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace penuh.

Catatan kepemilikan pengiriman:

- Pengiriman chat cron terisolasi bersifat shared. Agen dapat mengirim langsung dengan
  alat `message` saat rute chat tersedia.
- `announce` melakukan fallback-deliver balasan akhir hanya saat agen tidak mengirim
  langsung ke target yang telah di-resolve. `webhook` mem-post payload yang telah selesai ke URL.
  `none` menonaktifkan pengiriman fallback runner.

## Perintah admin umum

Run manual:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Entri `cron runs` mencakup diagnostik pengiriman dengan target cron yang dimaksud,
target yang telah di-resolve, pengiriman alat message, penggunaan fallback, dan status delivered.

Retargeting agen/sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Penyesuaian pengiriman:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Catatan pengiriman kegagalan:

- `delivery.failureDestination` didukung untuk pekerjaan terisolasi.
- Pekerjaan sesi utama hanya dapat menggunakan `delivery.failureDestination` saat
  mode pengiriman utama adalah `webhook`.
- Jika Anda tidak menetapkan tujuan kegagalan apa pun dan pekerjaan sudah mengumumkan ke
  suatu saluran, notifikasi kegagalan akan menggunakan ulang target announce yang sama.

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas terjadwal](/id/automation/cron-jobs)
