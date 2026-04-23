---
read_when:
    - Mendiagnosis konektivitas channel atau kesehatan Gateway
    - Memahami perintah dan opsi CLI pemeriksaan kesehatan
summary: Perintah pemeriksaan kesehatan dan pemantauan kesehatan Gateway
title: Pemeriksaan Kesehatan
x-i18n:
    generated_at: "2026-04-23T09:21:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# Pemeriksaan Kesehatan (CLI)

Panduan singkat untuk memverifikasi konektivitas channel tanpa menebak-nebak.

## Pemeriksaan cepat

- `openclaw status` — ringkasan lokal: keterjangkauan/mode Gateway, petunjuk update, usia auth channel tertaut, sesi + aktivitas terbaru.
- `openclaw status --all` — diagnosis lokal penuh (read-only, berwarna, aman untuk ditempel saat debugging).
- `openclaw status --deep` — meminta Gateway yang sedang berjalan untuk melakukan probe kesehatan langsung (`health` dengan `probe:true`), termasuk probe channel per akun saat didukung.
- `openclaw health` — meminta snapshot kesehatan Gateway yang sedang berjalan (khusus WS; tidak ada socket channel langsung dari CLI).
- `openclaw health --verbose` — memaksa probe kesehatan langsung dan mencetak detail koneksi Gateway.
- `openclaw health --json` — output snapshot kesehatan yang dapat dibaca mesin.
- Kirim `/status` sebagai pesan mandiri di WhatsApp/WebChat untuk mendapatkan balasan status tanpa memanggil agent.
- Log: tail `/tmp/openclaw/openclaw-*.log` dan filter untuk `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostik mendalam

- Kredensial di disk: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` harus baru).
- Session store: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (path dapat dioverride di konfigurasi). Jumlah dan penerima terbaru ditampilkan melalui `status`.
- Alur tautkan ulang: `openclaw channels logout && openclaw channels login --verbose` saat kode status 409–515 atau `loggedOut` muncul di log. (Catatan: alur login QR me-restart otomatis sekali untuk status 515 setelah pairing.)
- Diagnostik diaktifkan secara default. Gateway mencatat fakta operasional kecuali `diagnostics.enabled: false` disetel. Peristiwa memori mencatat jumlah byte RSS/heap, tekanan threshold, dan tekanan pertumbuhan. Peristiwa payload terlalu besar mencatat apa yang ditolak, dipotong, atau di-chunk, beserta ukuran dan batas bila tersedia. Peristiwa ini tidak mencatat teks pesan, isi lampiran, body Webhook, body permintaan atau respons mentah, token, cookie, atau nilai rahasia. Heartbeat yang sama memulai perekam stabilitas terbatas, yang tersedia melalui `openclaw gateway stability` atau Gateway RPC `diagnostics.stability`. Exit Gateway fatal, timeout shutdown, dan kegagalan startup restart menyimpan snapshot perekam terbaru di `~/.openclaw/logs/stability/` saat ada peristiwa; periksa bundel tersimpan terbaru dengan `openclaw gateway stability --bundle latest`.
- Untuk laporan bug, jalankan `openclaw gateway diagnostics export` dan lampirkan file zip yang dihasilkan. Ekspor ini menggabungkan ringkasan Markdown, bundel stabilitas terbaru, metadata log yang sudah disanitasi, snapshot status/kesehatan Gateway yang sudah disanitasi, dan bentuk konfigurasi. Ekspor ini memang dimaksudkan untuk dibagikan: teks chat, body Webhook, output tool, kredensial, cookie, identifier akun/pesan, dan nilai rahasia dihilangkan atau disunting.

## Konfigurasi monitor kesehatan

- `gateway.channelHealthCheckMinutes`: seberapa sering Gateway memeriksa kesehatan channel. Default: `5`. Setel `0` untuk menonaktifkan restart monitor kesehatan secara global.
- `gateway.channelStaleEventThresholdMinutes`: berapa lama channel yang terhubung dapat tetap idle sebelum monitor kesehatan menganggapnya stale dan me-restart-nya. Default: `30`. Biarkan nilai ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: batas bergulir satu jam untuk restart monitor kesehatan per channel/akun. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: menonaktifkan restart monitor kesehatan untuk channel tertentu sambil tetap membiarkan pemantauan global aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-akun yang menang atas pengaturan tingkat channel.
- Override per-channel ini berlaku pada monitor channel bawaan yang mengeksposnya saat ini: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, dan WhatsApp.

## Saat sesuatu gagal

- `logged out` atau status 409–515 → tautkan ulang dengan `openclaw channels logout` lalu `openclaw channels login`.
- Gateway tidak dapat dijangkau → mulai: `openclaw gateway --port 18789` (gunakan `--force` jika port sibuk).
- Tidak ada pesan masuk → pastikan ponsel tertaut sedang online dan pengirim diizinkan (`channels.whatsapp.allowFrom`); untuk chat grup, pastikan aturan allowlist + mention cocok (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Perintah "health" khusus

`openclaw health` meminta snapshot kesehatan dari Gateway yang sedang berjalan (tanpa socket channel
langsung dari CLI). Secara default, perintah ini dapat mengembalikan snapshot Gateway ter-cache yang baru; lalu
Gateway menyegarkan cache itu di latar belakang. `openclaw health --verbose` memaksa
probe langsung. Perintah ini melaporkan usia kredensial/auth tertaut saat tersedia,
ringkasan probe per-channel, ringkasan session-store, dan durasi probe. Perintah keluar
dengan status non-zero jika Gateway tidak dapat dijangkau atau probe gagal/timeout.

Opsi:

- `--json`: output JSON yang dapat dibaca mesin
- `--timeout <ms>`: override timeout probe default 10 detik
- `--verbose`: paksa probe langsung dan cetak detail koneksi Gateway
- `--debug`: alias untuk `--verbose`

Snapshot kesehatan mencakup: `ok` (boolean), `ts` (timestamp), `durationMs` (waktu probe), status per-channel, ketersediaan agent, dan ringkasan session-store.
