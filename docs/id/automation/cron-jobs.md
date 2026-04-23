---
read_when:
    - Menjadwalkan tugas latar belakang atau aktivasi kembali
    - Menghubungkan pemicu eksternal (webhook, Gmail) ke OpenClaw
    - Menentukan pilihan antara Heartbeat dan Cron untuk tugas terjadwal
summary: Pekerjaan terjadwal, webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas Terjadwal
x-i18n:
    generated_at: "2026-04-23T09:16:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tugas Terjadwal (Cron)

Cron adalah penjadwal bawaan Gateway. Cron menyimpan pekerjaan, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke saluran chat atau endpoint webhook.

## Mulai cepat

```bash
# Tambahkan pengingat sekali jalan
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Periksa pekerjaan Anda
openclaw cron list
openclaw cron show <job-id>

# Lihat riwayat eksekusi
openclaw cron runs --id <job-id>
```

## Cara kerja cron

- Cron berjalan **di dalam proses Gateway** (bukan di dalam model).
- Definisi pekerjaan disimpan di `~/.openclaw/cron/jobs.json` sehingga restart tidak menghilangkan jadwal.
- Status eksekusi runtime disimpan di sebelahnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan gitignore `jobs-state.json`.
- Setelah pemisahan, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin menganggap pekerjaan sebagai pekerjaan baru karena field runtime kini berada di `jobs-state.json`.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Pekerjaan sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi menutup tab browser/proses yang dilacak untuk sesi `cron:<jobId>` mereka secara best-effort saat eksekusi selesai, sehingga otomatisasi browser yang dilepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi juga melindungi dari balasan konfirmasi yang kedaluwarsa. Jika hasil pertama hanya berupa pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada eksekusi subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw akan memicu ulang sekali untuk hasil sebenarnya sebelum pengiriman.

<a id="maintenance"></a>

Rekonsiliasi tugas untuk cron dimiliki oleh runtime: tugas cron yang aktif tetap hidup selama runtime cron masih melacak pekerjaan tersebut sebagai sedang berjalan, meskipun baris sesi anak lama masih ada.
Setelah runtime berhenti memiliki pekerjaan tersebut dan jendela tenggang 5 menit berakhir, pemeliharaan dapat menandai tugas sebagai `lost`.

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                                   |
| ------- | --------- | ----------------------------------------------------------- |
| `at`    | `--at`    | Stempel waktu sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                              |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional   |

Stempel waktu tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan local loopback.

Ekspresi berulang pada awal jam otomatis diberi jeda hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu yang presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi Cron diuraikan oleh [croner](https://github.com/Hexagon/croner). Saat field day-of-month dan day-of-week sama-sama bukan wildcard, croner mencocokkan ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie yang standar.

```
# Maksud: "Jam 9 pagi pada tanggal 15, hanya jika hari itu Senin"
# Aktual: "Jam 9 pagi setiap tanggal 15, DAN jam 9 pagi setiap hari Senin"
0 9 15 * 1
```

Ini dipicu ~5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier day-of-week `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan jaga field lainnya di prompt atau perintah pekerjaan Anda.

## Gaya eksekusi

| Gaya            | Nilai `--session`    | Berjalan di               | Paling cocok untuk               |
| --------------- | -------------------- | ------------------------- | -------------------------------- |
| Sesi utama      | `main`               | Giliran heartbeat berikutnya | Pengingat, peristiwa sistem    |
| Terisolasi      | `isolated`           | `cron:<jobId>` khusus     | Laporan, pekerjaan latar belakang |
| Sesi saat ini   | `current`            | Terikat saat pembuatan    | Pekerjaan berulang yang sadar konteks |
| Sesi kustom     | `session:custom-id`  | Sesi bernama persisten    | Alur kerja yang dibangun dari riwayat |

Pekerjaan **sesi utama** mengantrikan peristiwa sistem dan secara opsional membangunkan heartbeat (`--wake now` atau `--wake next-heartbeat`). Pekerjaan **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks antar eksekusi, sehingga memungkinkan alur kerja seperti standup harian yang dibangun dari ringkasan sebelumnya.

Untuk pekerjaan terisolasi, teardown runtime kini mencakup pembersihan browser secara best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan agar hasil cron yang sebenarnya tetap diutamakan.

Eksekusi cron terisolasi juga membuang semua instance runtime MCP bawaan yang dibuat untuk pekerjaan tersebut melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara klien MCP sesi utama dan sesi kustom ditutup, sehingga pekerjaan cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP jangka panjang antar eksekusi.

Saat eksekusi cron terisolasi mengorkestrasi subagen, pengiriman juga lebih mengutamakan output turunan akhir daripada teks sementara induk yang kedaluwarsa. Jika turunan masih berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

### Opsi payload untuk pekerjaan terisolasi

- `--message`: teks prompt (wajib untuk terisolasi)
- `--model` / `--thinking`: override model dan tingkat thinking
- `--light-context`: lewati injeksi file bootstrap workspace
- `--tools exec,read`: batasi alat yang dapat digunakan pekerjaan

`--model` menggunakan model yang diizinkan dan dipilih untuk pekerjaan itu. Jika model yang diminta tidak diizinkan, cron mencatat peringatan dan kembali menggunakan pemilihan model agen/default untuk pekerjaan tersebut. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa tanpa daftar fallback per pekerjaan yang eksplisit tidak lagi menambahkan primary agen sebagai target retry tambahan yang tersembunyi.

Urutan prioritas pemilihan model untuk pekerjaan terisolasi adalah:

1. Override model hook Gmail (saat eksekusi berasal dari Gmail dan override itu diizinkan)
2. `model` payload per pekerjaan
3. Override model sesi cron yang tersimpan
4. Pemilihan model agen/default

Mode cepat juga mengikuti pilihan live yang telah diselesaikan. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakan itu secara default. Override `fastMode` sesi yang tersimpan tetap menang atas konfigurasi ke dua arah.

Jika sebuah eksekusi terisolasi mengalami handoff perpindahan model live, cron mencoba lagi dengan provider/model yang telah dialihkan dan menyimpan pilihan live tersebut sebelum mencoba ulang. Saat perpindahan itu juga membawa profil auth baru, cron juga menyimpan override profil auth tersebut. Retry dibatasi: setelah percobaan awal ditambah 2 retry perpindahan, cron membatalkan alih-alih berulang tanpa henti.

## Pengiriman dan output

| Mode       | Yang terjadi                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Kirim teks akhir ke target sebagai fallback jika agen tidak mengirim |
| `webhook`  | POST payload peristiwa selesai ke URL                               |
| `none`     | Tidak ada pengiriman fallback oleh runner                           |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman ke saluran. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`. Target Slack/Discord/Mattermost harus menggunakan prefiks eksplisit (`channel:<id>`, `user:<id>`).

Untuk pekerjaan terisolasi, pengiriman chat bersifat bersama. Jika rute chat tersedia, agen dapat menggunakan alat `message` bahkan saat pekerjaan menggunakan `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati announce fallback. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner terhadap balasan akhir setelah giliran agen.

Notifikasi kegagalan mengikuti jalur tujuan yang terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menggantikannya per pekerjaan.
- Jika keduanya tidak diatur dan pekerjaan sudah mengirim melalui `announce`, notifikasi kegagalan kini fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada pekerjaan `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.

## Contoh CLI

Pengingat sekali jalan (sesi utama):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Pekerjaan terisolasi berulang dengan pengiriman:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Pekerjaan terisolasi dengan override model dan thinking:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook

Gateway dapat mengekspos endpoint webhook HTTP untuk pemicu eksternal. Aktifkan dalam konfigurasi:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autentikasi

Setiap permintaan harus menyertakan token hook melalui header:

- `Authorization: Bearer <token>` (disarankan)
- `x-openclaw-token: <token>`

Token query-string ditolak.

### POST /hooks/wake

Antrikan peristiwa sistem untuk sesi utama:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (wajib): deskripsi peristiwa
- `mode` (opsional): `now` (default) atau `next-heartbeat`

### POST /hooks/agent

Jalankan giliran agen terisolasi:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hook yang dipetakan (POST /hooks/\<name\>)

Nama hook kustom diselesaikan melalui `hooks.mappings` dalam konfigurasi. Pemetaan dapat mengubah payload arbitrer menjadi aksi `wake` atau `agent` dengan template atau transformasi kode.

### Keamanan

- Simpan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.
- Gunakan token hook khusus; jangan gunakan ulang token auth gateway.
- Simpan `hooks.path` pada subpath khusus; `/` ditolak.
- Atur `hooks.allowedAgentIds` untuk membatasi routing `agentId` eksplisit.
- Biarkan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, atur juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk session key yang diizinkan.
- Payload hook dibungkus dengan batasan keamanan secara default.

## Integrasi Gmail PubSub

Hubungkan pemicu inbox Gmail ke OpenClaw melalui Google PubSub.

**Prasyarat**: CLI `gcloud`, `gog` (gogcli), hook OpenClaw aktif, Tailscale untuk endpoint HTTPS publik.

### Penyiapan wizard (disarankan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis konfigurasi `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Gateway auto-start

Saat `hooks.enabled=true` dan `hooks.gmail.account` diatur, Gateway menjalankan `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Atur `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkannya.

### Penyiapan manual satu kali

1. Pilih project GCP yang memiliki klien OAuth yang digunakan oleh `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Buat topik dan berikan akses push Gmail:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Mulai watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Override model Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Mengelola pekerjaan

```bash
# Daftar semua pekerjaan
openclaw cron list

# Tampilkan satu pekerjaan, termasuk rute pengiriman yang telah diselesaikan
openclaw cron show <jobId>

# Edit pekerjaan
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Paksa jalankan pekerjaan sekarang
openclaw cron run <jobId>

# Jalankan hanya jika sudah jatuh tempo
openclaw cron run <jobId> --due

# Lihat riwayat eksekusi
openclaw cron runs --id <jobId> --limit 50

# Hapus pekerjaan
openclaw cron remove <jobId>

# Pemilihan agen (penyiapan multi-agen)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Catatan override model:

- `openclaw cron add|edit --model ...` mengubah model terpilih pekerjaan.
- Jika model diizinkan, provider/model yang tepat itu akan diteruskan ke eksekusi agen terisolasi.
- Jika tidak diizinkan, cron akan memberi peringatan dan kembali ke pemilihan model agen/default pekerjaan.
- Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override `--model` biasa tanpa daftar fallback per pekerjaan yang eksplisit tidak lagi diteruskan ke primary agen sebagai target retry tambahan yang diam-diam.

## Konfigurasi

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sedangkan path store tanpa sufiks `.json` akan menambahkan `-state.json`.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

**Retry sekali jalan**: kesalahan sementara (batas laju, kelebihan beban, jaringan, kesalahan server) diulang hingga 3 kali dengan exponential backoff. Kesalahan permanen akan langsung dinonaktifkan.

**Retry berulang**: exponential backoff (30 dtk hingga 60 mnt) di antara retry. Backoff direset setelah eksekusi berhasil berikutnya.

**Pemeliharaan**: `cron.sessionRetention` (default `24h`) memangkas entri sesi-eksekusi terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas file log eksekusi secara otomatis.

## Pemecahan masalah

### Urutan perintah

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron tidak berjalan

- Periksa `cron.enabled` dan variabel env `OPENCLAW_SKIP_CRON`.
- Pastikan Gateway berjalan terus-menerus.
- Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibandingkan zona waktu host.
- `reason: not-due` pada output eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan pekerjaan belum jatuh tempo.

### Cron berjalan tetapi tidak ada pengiriman

- Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen tetap dapat mengirim langsung dengan alat `message` saat rute chat tersedia.
- Target pengiriman hilang/tidak valid (`channel`/`to`) berarti pengiriman keluar dilewati.
- Kesalahan auth saluran (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
- Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman keluar langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada apa pun yang diposting kembali ke chat.
- Jika agen seharusnya mengirim pesan ke pengguna sendiri, periksa bahwa pekerjaan memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau saluran/target yang eksplisit).

### Hal yang perlu diperhatikan terkait zona waktu

- Cron tanpa `--tz` menggunakan zona waktu host gateway.
- Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
- `activeHours` Heartbeat menggunakan resolusi zona waktu yang dikonfigurasi.

## Terkait

- [Otomatisasi & Tugas](/id/automation) — semua mekanisme otomatisasi secara ringkas
- [Tugas Latar Belakang](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama berkala
- [Zona waktu](/id/concepts/timezone) — konfigurasi zona waktu
