---
read_when:
    - Mendiagnosis konektivitas saluran atau kesehatan gateway
    - Memahami perintah dan opsi CLI pemeriksaan kesehatan
summary: Perintah pemeriksaan kesehatan dan pemantauan kesehatan gateway
title: Pemeriksaan kesehatan
x-i18n:
    generated_at: "2026-04-25T13:46:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

Panduan singkat untuk memverifikasi konektivitas saluran tanpa menebak.

## Pemeriksaan cepat

- `openclaw status` — ringkasan lokal: keterjangkauan/mode gateway, petunjuk pembaruan, usia auth saluran yang tertaut, sesi + aktivitas terbaru.
- `openclaw status --all` — diagnosis lokal lengkap (read-only, berwarna, aman untuk ditempel saat debugging).
- `openclaw status --deep` — meminta probe kesehatan live ke gateway yang sedang berjalan (`health` dengan `probe:true`), termasuk probe saluran per akun jika didukung.
- `openclaw health` — meminta snapshot kesehatan gateway yang sedang berjalan (hanya WS; tidak ada soket saluran langsung dari CLI).
- `openclaw health --verbose` — memaksa probe kesehatan live dan mencetak detail koneksi gateway.
- `openclaw health --json` — output snapshot kesehatan yang dapat dibaca mesin.
- Kirim `/status` sebagai pesan mandiri di WhatsApp/WebChat untuk mendapatkan balasan status tanpa memanggil agen.
- Log: tail `/tmp/openclaw/openclaw-*.log` dan filter untuk `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostik mendalam

- Kredensial di disk: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime seharusnya baru).
- Penyimpanan sesi: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (path dapat dioverride di config). Jumlah dan penerima terbaru ditampilkan melalui `status`.
- Alur relink: `openclaw channels logout && openclaw channels login --verbose` saat kode status 409–515 atau `loggedOut` muncul di log. (Catatan: alur login QR otomatis restart sekali untuk status 515 setelah pairing.)
- Diagnostik aktif secara default. Gateway merekam fakta operasional kecuali `diagnostics.enabled: false` diatur. Event memori merekam jumlah byte RSS/heap, tekanan ambang batas, dan tekanan pertumbuhan. Event payload terlalu besar merekam apa yang ditolak, dipotong, atau dipecah, plus ukuran dan batas saat tersedia. Event tersebut tidak merekam teks pesan, isi lampiran, body Webhook, body permintaan atau respons mentah, token, cookie, atau nilai rahasia. Heartbeat yang sama memulai perekam stabilitas terbatas, yang tersedia melalui `openclaw gateway stability` atau Gateway RPC `diagnostics.stability`. Keluar Gateway fatal, timeout shutdown, dan kegagalan startup restart menyimpan snapshot perekam terbaru di bawah `~/.openclaw/logs/stability/` saat event ada; periksa bundle tersimpan terbaru dengan `openclaw gateway stability --bundle latest`.
- Untuk laporan bug, jalankan `openclaw gateway diagnostics export` dan lampirkan file zip yang dihasilkan. Ekspor ini menggabungkan ringkasan Markdown, bundle stabilitas terbaru, metadata log yang disanitasi, snapshot status/kesehatan Gateway yang disanitasi, dan bentuk config. Ini dimaksudkan untuk dibagikan: teks chat, body Webhook, output tool, kredensial, cookie, identifier akun/pesan, dan nilai rahasia dihilangkan atau disamarkan. Lihat [Ekspor Diagnostik](/id/gateway/diagnostics).

## Config monitor kesehatan

- `gateway.channelHealthCheckMinutes`: seberapa sering gateway memeriksa kesehatan saluran. Default: `5`. Atur `0` untuk menonaktifkan restart monitor kesehatan secara global.
- `gateway.channelStaleEventThresholdMinutes`: berapa lama saluran yang terhubung dapat diam sebelum monitor kesehatan menganggapnya stale dan me-restart-nya. Default: `30`. Pastikan nilainya lebih besar atau sama dengan `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: batas bergulir satu jam untuk restart monitor kesehatan per saluran/akun. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: menonaktifkan restart monitor kesehatan untuk saluran tertentu sambil tetap membiarkan pemantauan global aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override multi-akun yang menang atas pengaturan tingkat saluran.
- Override per saluran ini berlaku untuk monitor saluran bawaan yang mengeksposnya saat ini: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, dan WhatsApp.

## Saat ada yang gagal

- `logged out` atau status 409–515 → lakukan relink dengan `openclaw channels logout` lalu `openclaw channels login`.
- Gateway tidak dapat dijangkau → mulai: `openclaw gateway --port 18789` (gunakan `--force` jika port sibuk).
- Tidak ada pesan masuk → konfirmasi ponsel tertaut sedang online dan pengirim diizinkan (`channels.whatsapp.allowFrom`); untuk chat grup, pastikan aturan allowlist + mention cocok (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Perintah "health" khusus

`openclaw health` meminta snapshot kesehatan gateway yang sedang berjalan (tanpa soket saluran langsung dari CLI). Secara default perintah ini dapat mengembalikan snapshot gateway cache yang masih segar; gateway kemudian menyegarkan cache tersebut di latar belakang. `openclaw health --verbose` memaksa probe live sebagai gantinya. Perintah ini melaporkan usia linked creds/auth saat tersedia, ringkasan probe per saluran, ringkasan penyimpanan sesi, dan durasi probe. Perintah ini keluar non-zero jika gateway tidak dapat dijangkau atau probe gagal/timeout.

Opsi:

- `--json`: output JSON yang dapat dibaca mesin
- `--timeout <ms>`: override timeout probe default 10 detik
- `--verbose`: paksa probe live dan cetak detail koneksi gateway
- `--debug`: alias untuk `--verbose`

Snapshot kesehatan mencakup: `ok` (boolean), `ts` (timestamp), `durationMs` (waktu probe), status per saluran, ketersediaan agen, dan ringkasan penyimpanan sesi.

## Terkait

- [Runbook Gateway](/id/gateway)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
