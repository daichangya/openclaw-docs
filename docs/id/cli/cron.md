---
read_when:
    - Anda menginginkan job terjadwal dan wakeup
    - Anda sedang men-debug eksekusi Cron dan lognya
summary: Referensi CLI untuk `openclaw cron` (menjadwalkan dan menjalankan background job)
title: Cron
x-i18n:
    generated_at: "2026-04-23T09:18:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5216f220748b05df5202af778878b37148d6abe235be9fe82ddcf976d51532a
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Kelola job Cron untuk scheduler Gateway.

Terkait:

- Job Cron: [Job Cron](/id/automation/cron-jobs)

Tip: jalankan `openclaw cron --help` untuk surface perintah lengkap.

Catatan: `openclaw cron list` dan `openclaw cron show <job-id>` mempratinjau
rute pengiriman yang telah diselesaikan. Untuk `channel: "last"`, pratinjau
menunjukkan apakah rute diselesaikan dari sesi utama/saat ini atau akan gagal tertutup.

Catatan: job `cron add` terisolasi default ke pengiriman `--announce`. Gunakan `--no-deliver` untuk menjaga
output tetap internal. `--deliver` tetap ada sebagai alias usang untuk `--announce`.

Catatan: pengiriman chat cron terisolasi bersifat bersama. `--announce` adalah pengiriman fallback runner
untuk balasan akhir; `--no-deliver` menonaktifkan fallback tersebut tetapi
tidak menghapus tool `message` milik agent saat rute chat tersedia.

Catatan: job sekali jalan (`--at`) dihapus setelah berhasil secara default. Gunakan `--keep-after-run` untuk menyimpannya.

Catatan: `--session` mendukung `main`, `isolated`, `current`, dan `session:<id>`.
Gunakan `current` untuk mengikat ke sesi aktif saat waktu pembuatan, atau `session:<id>` untuk
kunci sesi persisten yang eksplisit.

Catatan: untuk job CLI sekali jalan, datetime `--at` tanpa offset diperlakukan sebagai UTC kecuali Anda juga memberikan
`--tz <iana>`, yang menafsirkan waktu wall-clock lokal tersebut dalam timezone yang diberikan.

Catatan: job berulang sekarang menggunakan backoff retry eksponensial setelah error beruntun (30d → 1m → 5m → 15m → 60m), lalu kembali ke jadwal normal setelah run berhasil berikutnya.

Catatan: `openclaw cron run` sekarang kembali segera setelah run manual masuk antrean untuk dieksekusi. Respons yang berhasil mencakup `{ ok: true, enqueued: true, runId }`; gunakan `openclaw cron runs --id <job-id>` untuk mengikuti hasil akhirnya.

Catatan: `openclaw cron run <job-id>` secara default melakukan force-run. Gunakan `--due` untuk mempertahankan
perilaku lama "hanya jalankan jika sudah jatuh tempo".

Catatan: giliran cron terisolasi menekan balasan usang yang hanya berupa acknowledgment. Jika
hasil pertama hanyalah pembaruan status sementara dan tidak ada run subagent turunan yang
bertanggung jawab atas jawaban akhirnya, cron akan mem-prompt ulang sekali untuk hasil sebenarnya
sebelum pengiriman.

Catatan: jika run cron terisolasi hanya mengembalikan token senyap (`NO_REPLY` /
`no_reply`), cron menekan pengiriman keluar langsung dan juga jalur ringkasan antrean fallback,
sehingga tidak ada apa pun yang diposting kembali ke chat.

Catatan: `cron add|edit --model ...` menggunakan model yang diizinkan dan dipilih tersebut untuk job.
Jika model tidak diizinkan, cron akan memperingatkan dan fallback ke pemilihan
model agent/default job sebagai gantinya. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa tanpa daftar fallback per-job yang eksplisit tidak lagi menambahkan model utama agent sebagai target retry tambahan tersembunyi.

Catatan: prioritas model cron terisolasi adalah override Gmail-hook terlebih dahulu, lalu per-job
`--model`, lalu override model cron-session yang tersimpan, lalu pemilihan
agent/default normal.

Catatan: mode cepat cron terisolasi mengikuti pemilihan live model yang telah diselesaikan. Konfigurasi model
`params.fastMode` berlaku secara default, tetapi override `fastMode` sesi yang tersimpan tetap lebih diutamakan daripada konfigurasi.

Catatan: jika run terisolasi melempar `LiveSessionModelSwitchError`, cron menyimpan
provider/model yang dialihkan (dan override profil auth yang dialihkan bila ada) sebelum
mencoba lagi. Loop retry luar dibatasi hingga 2 retry switch setelah upaya awal,
lalu dibatalkan alih-alih berputar tanpa akhir.

Catatan: notifikasi kegagalan menggunakan `delivery.failureDestination` terlebih dahulu, lalu
`cron.failureDestination` global, dan akhirnya fallback ke target announce utama
job saat tidak ada tujuan kegagalan eksplisit yang dikonfigurasi.

Catatan: retensi/pruning dikendalikan dalam konfigurasi:

- `cron.sessionRetention` (default `24h`) memangkas sesi run terisolasi yang sudah selesai.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas `~/.openclaw/cron/runs/<jobId>.jsonl`.

Catatan upgrade: jika Anda memiliki job cron lama dari sebelum format delivery/store saat ini, jalankan
`openclaw doctor --fix`. Doctor sekarang menormalkan field cron lama (`jobId`, `schedule.cron`,
field delivery tingkat atas termasuk `threadId` lama, alias delivery `provider` payload) dan memigrasikan job fallback webhook `notify: true`
sederhana menjadi pengiriman webhook eksplisit saat `cron.webhook` dikonfigurasi.

## Pengeditan umum

Perbarui pengaturan delivery tanpa mengubah pesan:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Nonaktifkan delivery untuk job terisolasi:

```bash
openclaw cron edit <job-id> --no-deliver
```

Aktifkan konteks bootstrap ringan untuk job terisolasi:

```bash
openclaw cron edit <job-id> --light-context
```

Umumkan ke channel tertentu:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Buat job terisolasi dengan konteks bootstrap ringan:

```bash
openclaw cron add \
  --name "Ringkasan pagi ringan" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Ringkas pembaruan semalam." \
  --light-context \
  --no-deliver
```

`--light-context` hanya berlaku untuk job giliran agent terisolasi. Untuk run cron, mode ringan menjaga konteks bootstrap tetap kosong alih-alih menyuntikkan set bootstrap workspace penuh.

Catatan kepemilikan delivery:

- Pengiriman chat cron terisolasi bersifat bersama. Agent dapat mengirim langsung dengan
  tool `message` saat rute chat tersedia.
- Fallback `announce` hanya mengirim balasan akhir saat agent tidak mengirim
  langsung ke target yang telah diselesaikan. `webhook` memposting payload yang selesai ke URL.
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

Entri `cron runs` mencakup diagnostik delivery dengan target cron yang dimaksud,
target yang telah diselesaikan, pengiriman tool message, penggunaan fallback, dan status terkirim.

Penargetan ulang agent/sesi:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Penyesuaian delivery:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Catatan failure-delivery:

- `delivery.failureDestination` didukung untuk job terisolasi.
- Job sesi utama hanya dapat menggunakan `delivery.failureDestination` saat
  mode delivery utama adalah `webhook`.
- Jika Anda tidak menetapkan tujuan kegagalan apa pun dan job sudah melakukan announce ke
  channel, notifikasi kegagalan akan menggunakan ulang target announce yang sama tersebut.
