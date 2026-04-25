---
read_when:
    - Menjadwalkan job latar belakang atau wakeup
    - Menghubungkan pemicu eksternal (webhook, Gmail) ke OpenClaw
    - Menentukan antara Heartbeat dan Cron untuk tugas terjadwal
summary: Job terjadwal, webhook, dan pemicu Gmail PubSub untuk scheduler Gateway
title: Tugas terjadwal
x-i18n:
    generated_at: "2026-04-25T13:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron adalah scheduler bawaan Gateway. Cron menyimpan job, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke channel chat atau endpoint webhook.

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

# Periksa job Anda
openclaw cron list
openclaw cron show <job-id>

# Lihat riwayat eksekusi
openclaw cron runs --id <job-id>
```

## Cara kerja cron

- Cron berjalan **di dalam** proses Gateway (bukan di dalam model).
- Definisi job disimpan di `~/.openclaw/cron/jobs.json` sehingga restart tidak menghilangkan jadwal.
- Status eksekusi runtime disimpan di sampingnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan gitignore `jobs-state.json`.
- Setelah pemisahan ini, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin memperlakukan job sebagai baru karena field runtime sekarang berada di `jobs-state.json`.
- Semua eksekusi cron membuat record [tugas latar belakang](/id/automation/tasks).
- Job sekali jalan (`--at`) otomatis dihapus setelah berhasil secara default.
- Eksekusi cron terisolasi menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` mereka secara best-effort saat eksekusi selesai, sehingga otomatisasi browser yang dilepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi juga melindungi dari balasan acknowledgement yang usang. Jika
  hasil pertama hanya berupa pembaruan status sementara (`on it`, `pulling everything
together`, dan petunjuk serupa) dan tidak ada eksekusi subagen turunan yang masih
  bertanggung jawab atas jawaban akhir, OpenClaw akan melakukan prompt ulang sekali untuk hasil
  sebenarnya sebelum pengiriman.

<a id="maintenance"></a>

Rekonsiliasi tugas untuk cron dimiliki oleh runtime: tugas cron yang aktif tetap berjalan selama
runtime cron masih melacak job tersebut sebagai sedang berjalan, bahkan jika baris sesi anak lama masih ada.
Setelah runtime berhenti memiliki job tersebut dan masa tenggang 5 menit berakhir, pemeliharaan dapat
menandai tugas sebagai `lost`.

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                                  |
| ------- | --------- | ---------------------------------------------------------- |
| `at`    | `--at`    | Timestamp sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                             |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional  |

Timestamp tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu lokal.

Ekspresi berulang tepat di awal jam otomatis di-stagger hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu yang presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi cron diparse oleh [croner](https://github.com/Hexagon/croner). Ketika field day-of-month dan day-of-week sama-sama bukan wildcard, croner mencocokkan ketika **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Maksud: "Pukul 9 pagi pada tanggal 15, hanya jika itu hari Senin"
# Aktual: "Pukul 9 pagi setiap tanggal 15, DAN pukul 9 pagi setiap hari Senin"
0 9 15 * 1
```

Ini akan berjalan ~5–6 kali per bulan alih-alih 0–1 kali per bulan. OpenClaw menggunakan perilaku OR default Croner di sini. Untuk mensyaratkan kedua kondisi, gunakan modifier day-of-week `+` dari Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan periksa field lainnya dalam prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya            | Nilai `--session`   | Berjalan di               | Paling cocok untuk              |
| --------------- | ------------------- | ------------------------- | ------------------------------- |
| Sesi utama      | `main`              | Giliran heartbeat berikutnya | Pengingat, system event      |
| Terisolasi      | `isolated`          | `cron:<jobId>` khusus     | Laporan, tugas latar belakang   |
| Sesi saat ini   | `current`           | Terikat saat dibuat       | Pekerjaan berulang yang sadar konteks |
| Sesi kustom     | `session:custom-id` | Sesi bernama persisten    | Alur kerja yang dibangun dari riwayat |

Job **sesi utama** mengantrekan system event dan secara opsional membangunkan heartbeat (`--wake now` atau `--wake next-heartbeat`). Job **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks di seluruh eksekusi, memungkinkan alur kerja seperti standup harian yang dibangun dari ringkasan sebelumnya.

Untuk job terisolasi, “sesi baru” berarti id transkrip/sesi baru untuk setiap eksekusi. OpenClaw dapat membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit, tetapi tidak mewarisi konteks percakapan ambient dari baris cron lama: routing channel/group, kebijakan kirim atau antre, elevasi, origin, atau binding runtime ACP. Gunakan `current` atau `session:<id>` ketika job berulang memang harus dibangun dengan konteks percakapan yang sama.

Untuk job terisolasi, teardown runtime kini mencakup pembersihan browser secara best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan agar hasil cron yang sebenarnya tetap diutamakan.

Eksekusi cron terisolasi juga membuang instance runtime MCP bundel yang dibuat untuk job melalui jalur pembersihan runtime bersama. Ini sesuai dengan cara client MCP sesi utama dan sesi kustom ditutup, sehingga job cron terisolasi tidak membocorkan proses anak stdio atau koneksi MCP jangka panjang antar eksekusi.

Ketika eksekusi cron terisolasi mengorkestrasi subagen, pengiriman juga lebih mengutamakan
output turunan akhir daripada teks sementara induk yang usang. Jika turunan masih
berjalan, OpenClaw menekan pembaruan induk parsial tersebut alih-alih mengumumkannya.

Untuk target announce Discord yang hanya teks, OpenClaw mengirim teks asisten akhir
kanonis satu kali alih-alih memutar ulang baik payload teks streaming/perantara
maupun jawaban akhir. Payload Discord media dan terstruktur tetap dikirim
sebagai payload terpisah agar lampiran dan komponen tidak hilang.

### Opsi payload untuk job terisolasi

- `--message`: teks prompt (wajib untuk terisolasi)
- `--model` / `--thinking`: override model dan level thinking
- `--light-context`: lewati injeksi file bootstrap workspace
- `--tools exec,read`: batasi alat yang dapat digunakan job

`--model` menggunakan model yang diizinkan dan dipilih untuk job tersebut. Jika model yang diminta
tidak diizinkan, cron mencatat peringatan dan kembali menggunakan pemilihan model default/agen
job tersebut. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa
tanpa daftar fallback per-job eksplisit tidak lagi menambahkan primary agen sebagai target retry tambahan yang tersembunyi.

Urutan prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (ketika eksekusi berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per-job
3. Override model sesi cron tersimpan yang dipilih pengguna
4. Pemilihan model default/agen

Mode cepat juga mengikuti pilihan live yang sudah diresolusikan. Jika konfigurasi model yang dipilih
memiliki `params.fastMode`, cron terisolasi menggunakan itu secara default. Override `fastMode`
sesi tersimpan tetap menang atas konfigurasi di kedua arah.

Jika eksekusi terisolasi mengalami handoff pergantian model live, cron akan mencoba ulang dengan
provider/model yang sudah diganti dan menyimpan pilihan live tersebut untuk eksekusi aktif
sebelum mencoba ulang. Ketika pergantian tersebut juga membawa profil auth baru, cron menyimpan
override profil auth itu untuk eksekusi aktif juga. Retry dibatasi: setelah
percobaan awal ditambah 2 retry pergantian, cron dibatalkan alih-alih berulang tanpa akhir.

## Pengiriman dan output

| Mode      | Yang terjadi                                                      |
| --------- | ----------------------------------------------------------------- |
| `announce` | Mengirim teks akhir ke target sebagai fallback jika agen tidak mengirim |
| `webhook`  | POST payload event selesai ke URL                               |
| `none`     | Tidak ada pengiriman fallback dari runner                       |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman ke channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`. Target Slack/Discord/Mattermost harus menggunakan prefix eksplisit (`channel:<id>`, `user:<id>`).

Untuk job terisolasi, pengiriman chat dibagikan. Jika rute chat tersedia, agen
dapat menggunakan alat `message` bahkan ketika job menggunakan `--no-deliver`. Jika
agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati fallback
announce. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang
dilakukan runner terhadap balasan akhir setelah giliran agen.

Notifikasi kegagalan mengikuti jalur tujuan yang terpisah:

- `cron.failureDestination` menetapkan default global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` menimpa itu per job.
- Jika keduanya tidak disetel dan job sudah mengirim melalui `announce`, notifikasi kegagalan kini fallback ke target announce utama tersebut.
- `delivery.failureDestination` hanya didukung pada job `sessionTarget="isolated"` kecuali mode pengiriman utama adalah `webhook`.

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

Job terisolasi berulang dengan pengiriman:

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

Job terisolasi dengan override model dan thinking:

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

Gateway dapat mengekspos endpoint webhook HTTP untuk pemicu eksternal. Aktifkan di config:

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

Setiap request harus menyertakan token hook melalui header:

- `Authorization: Bearer <token>` (disarankan)
- `x-openclaw-token: <token>`

Token query-string ditolak.

### POST /hooks/wake

Antrekan system event untuk sesi utama:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (wajib): deskripsi event
- `mode` (opsional): `now` (default) atau `next-heartbeat`

### POST /hooks/agent

Jalankan giliran agen terisolasi:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hook yang dipetakan (POST /hooks/\<name\>)

Nama hook kustom diresolusikan melalui `hooks.mappings` dalam config. Mapping dapat mentransformasi payload arbitrer menjadi aksi `wake` atau `agent` dengan template atau transformasi kode.

### Keamanan

- Simpan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.
- Gunakan token hook khusus; jangan gunakan ulang token auth gateway.
- Simpan `hooks.path` pada subpath khusus; `/` ditolak.
- Setel `hooks.allowedAgentIds` untuk membatasi routing `agentId` eksplisit.
- Pertahankan `hooks.allowRequestSessionKey=false` kecuali Anda memerlukan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, setel juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk session key yang diizinkan.
- Payload hook dibungkus dengan batas keamanan secara default.

## Integrasi Gmail PubSub

Hubungkan pemicu inbox Gmail ke OpenClaw melalui Google PubSub.

**Prasyarat**: CLI `gcloud`, `gog` (gogcli), hook OpenClaw diaktifkan, Tailscale untuk endpoint HTTPS publik.

### Setup wizard (disarankan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis config `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Auto-start Gateway

Saat `hooks.enabled=true` dan `hooks.gmail.account` disetel, Gateway menjalankan `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Setel `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk menonaktifkannya.

### Setup manual sekali jalan

1. Pilih project GCP yang memiliki client OAuth yang digunakan oleh `gog`:

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

## Mengelola job

```bash
# Daftar semua job
openclaw cron list

# Tampilkan satu job, termasuk rute pengiriman yang sudah diresolusikan
openclaw cron show <jobId>

# Edit job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Paksa jalankan job sekarang
openclaw cron run <jobId>

# Jalankan hanya jika sudah jatuh tempo
openclaw cron run <jobId> --due

# Lihat riwayat eksekusi
openclaw cron runs --id <jobId> --limit 50

# Hapus job
openclaw cron remove <jobId>

# Pemilihan agen (setup multi-agen)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Catatan override model:

- `openclaw cron add|edit --model ...` mengubah model terpilih job.
- Jika model diizinkan, provider/model persis itu akan digunakan pada eksekusi agen terisolasi.
- Jika tidak diizinkan, cron memberikan peringatan dan fallback ke pemilihan model default/agen job tersebut.
- Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override `--model` biasa tanpa daftar fallback per-job eksplisit tidak lagi fallback ke primary agen sebagai target retry tambahan yang diam-diam.

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

Sidecar status runtime diturunkan dari `cron.store`: store `.json` seperti
`~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sedangkan path store
tanpa sufiks `.json` menambahkan `-state.json`.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

**Retry sekali jalan**: error sementara (rate limit, overload, network, server error) diulang hingga 3 kali dengan exponential backoff. Error permanen langsung dinonaktifkan.

**Retry berulang**: exponential backoff (30 detik hingga 60 menit) di antara retry. Backoff direset setelah eksekusi berhasil berikutnya.

**Pemeliharaan**: `cron.sessionRetention` (default `24h`) memangkas entri run-session terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas file log eksekusi secara otomatis.

## Pemecahan masalah

### Tangga perintah

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
- Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibanding zona waktu host.
- `reason: not-due` pada output eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

### Cron berjalan tetapi tidak ada pengiriman

- Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen tetap dapat mengirim langsung dengan alat `message` saat rute chat tersedia.
- Target pengiriman hilang/tidak valid (`channel`/`to`) berarti outbound dilewati.
- Error auth channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
- Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman outbound langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada apa pun yang diposting kembali ke chat.
- Jika agen seharusnya mengirim pesan ke pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

### Hal yang perlu diperhatikan terkait zona waktu

- Cron tanpa `--tz` menggunakan zona waktu host gateway.
- Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
- Heartbeat `activeHours` menggunakan resolusi zona waktu yang dikonfigurasi.

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomatisasi secara ringkas
- [Background Tasks](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama periodik
- [Timezone](/id/concepts/timezone) — konfigurasi zona waktu
