---
read_when:
    - Mengubah eksekusi atau konkurensi auto-reply
summary: Desain antrean perintah yang membuat run auto-reply masuk diserialkan
title: Antrean perintah
x-i18n:
    generated_at: "2026-04-25T13:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

Kami membuat run auto-reply masuk (semua channel) menjadi serial melalui antrean kecil dalam proses untuk mencegah beberapa run agen saling bertabrakan, sambil tetap memungkinkan paralelisme yang aman antar sesi.

## Mengapa

- Run auto-reply bisa mahal (panggilan LLM) dan dapat saling bertabrakan saat beberapa pesan masuk tiba dalam waktu berdekatan.
- Serialisasi menghindari persaingan atas sumber daya bersama (file sesi, log, stdin CLI) dan mengurangi kemungkinan terkena rate limit upstream.

## Cara kerjanya

- Antrean FIFO yang sadar lane menguras setiap lane dengan batas konkurensi yang dapat dikonfigurasi (default 1 untuk lane yang tidak dikonfigurasi; main default ke 4, subagent ke 8).
- `runEmbeddedPiAgent` mengantre berdasarkan **session key** (lane `session:<key>`) untuk menjamin hanya ada satu run aktif per sesi.
- Setiap run sesi kemudian diantrikan ke **global lane** (`main` secara default) sehingga paralelisme keseluruhan dibatasi oleh `agents.defaults.maxConcurrent`.
- Saat logging verbose diaktifkan, run yang diantrikan mengeluarkan pemberitahuan singkat jika menunggu lebih dari ~2 detik sebelum mulai.
- Indikator mengetik tetap aktif segera saat masuk antrean (bila didukung oleh channel) sehingga pengalaman pengguna tidak berubah saat menunggu giliran.

## Mode antrean (per channel)

Pesan masuk dapat mengarahkan run saat ini, menunggu giliran tindak lanjut, atau melakukan keduanya:

- `steer`: injeksikan segera ke run saat ini (membatalkan panggilan tool yang tertunda setelah batas tool berikutnya). Jika tidak sedang streaming, fallback ke followup.
- `followup`: antrekan untuk giliran agen berikutnya setelah run saat ini berakhir.
- `collect`: gabungkan semua pesan yang diantrikan ke dalam **satu** giliran followup (default). Jika pesan menargetkan channel/thread yang berbeda, antrean dikuras secara terpisah untuk mempertahankan perutean.
- `steer-backlog` (alias `steer+backlog`): arahkan sekarang **dan** pertahankan pesan untuk giliran followup.
- `interrupt` (legacy): hentikan run aktif untuk sesi tersebut, lalu jalankan pesan terbaru.
- `queue` (alias legacy): sama dengan `steer`.

Steer-backlog berarti Anda bisa mendapatkan respons followup setelah run yang diarahkan, sehingga surface streaming dapat terlihat seperti duplikat. Pilih `collect`/`steer` jika Anda ingin satu respons per pesan masuk.
Kirim `/queue collect` sebagai perintah mandiri (per sesi) atau tetapkan `messages.queue.byChannel.discord: "collect"`.

Default (saat tidak ditetapkan dalam config):

- Semua surface → `collect`

Konfigurasikan secara global atau per channel melalui `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opsi antrean

Opsi berlaku untuk `followup`, `collect`, dan `steer-backlog` (serta untuk `steer` saat fallback ke followup):

- `debounceMs`: tunggu hingga tenang sebelum memulai giliran followup (mencegah “continue, continue”).
- `cap`: jumlah maksimum pesan yang diantrikan per sesi.
- `drop`: kebijakan overflow (`old`, `new`, `summarize`).

Summarize mempertahankan daftar poin singkat dari pesan yang dibuang dan menyuntikkannya sebagai prompt followup sintetis.
Default: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Override per sesi

- Kirim `/queue <mode>` sebagai perintah mandiri untuk menyimpan mode untuk sesi saat ini.
- Opsi dapat digabungkan: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` atau `/queue reset` menghapus override sesi.

## Cakupan dan jaminan

- Berlaku untuk run agen auto-reply di semua channel masuk yang menggunakan pipeline balasan gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, dan lain-lain).
- Lane default (`main`) berlaku untuk seluruh proses untuk heartbeat masuk + main; tetapkan `agents.defaults.maxConcurrent` untuk memungkinkan beberapa sesi berjalan paralel.
- Lane tambahan dapat ada (misalnya `cron`, `subagent`) sehingga pekerjaan latar belakang dapat berjalan paralel tanpa memblokir balasan masuk. Run yang terlepas ini dilacak sebagai [background tasks](/id/automation/tasks).
- Lane per sesi menjamin bahwa hanya satu run agen yang menyentuh sesi tertentu pada satu waktu.
- Tidak ada dependensi eksternal atau thread worker latar belakang; murni TypeScript + promise.

## Pemecahan masalah

- Jika perintah tampak macet, aktifkan log verbose dan cari baris “queued for …ms” untuk memastikan antrean sedang dikuras.
- Jika Anda memerlukan kedalaman antrean, aktifkan log verbose dan pantau baris waktu antrean.

## Terkait

- [Session management](/id/concepts/session)
- [Retry policy](/id/concepts/retry)
