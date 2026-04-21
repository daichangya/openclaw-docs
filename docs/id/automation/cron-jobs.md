---
read_when:
    - Menjadwalkan pekerjaan latar belakang atau wakeup
    - Menghubungkan pemicu eksternal (webhook, Gmail) ke OpenClaw
    - Menentukan antara Heartbeat dan Cron untuk tugas terjadwal
summary: Pekerjaan terjadwal, webhook, dan pemicu Gmail PubSub untuk penjadwal Gateway
title: Tugas Terjadwal
x-i18n:
    generated_at: "2026-04-21T09:16:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tugas Terjadwal (Cron)

Cron adalah penjadwal bawaan Gateway. Cron menyimpan job secara persisten, membangunkan agen pada waktu yang tepat, dan dapat mengirimkan output kembali ke channel chat atau endpoint Webhook.

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
- Definisi job disimpan secara persisten di `~/.openclaw/cron/jobs.json` sehingga restart tidak menghilangkan jadwal.
- Status eksekusi runtime disimpan secara persisten di sebelahnya dalam `~/.openclaw/cron/jobs-state.json`. Jika Anda melacak definisi cron di git, lacak `jobs.json` dan tambahkan `jobs-state.json` ke gitignore.
- Setelah pemisahan ini, versi OpenClaw yang lebih lama dapat membaca `jobs.json` tetapi mungkin memperlakukan job sebagai baru karena field runtime sekarang berada di `jobs-state.json`.
- Semua eksekusi cron membuat catatan [tugas latar belakang](/id/automation/tasks).
- Job sekali jalan (`--at`) akan terhapus otomatis setelah berhasil secara bawaan.
- Eksekusi cron terisolasi menutup tab/proses browser yang dilacak untuk sesi `cron:<jobId>` mereka secara best-effort saat eksekusi selesai, sehingga otomatisasi browser yang terlepas tidak meninggalkan proses yatim.
- Eksekusi cron terisolasi juga melindungi dari balasan pengakuan yang usang. Jika hasil pertama hanya berupa pembaruan status sementara (`on it`, `pulling everything together`, dan petunjuk serupa) dan tidak ada eksekusi subagen turunan yang masih bertanggung jawab atas jawaban akhir, OpenClaw akan melakukan prompt ulang sekali untuk hasil yang sebenarnya sebelum pengiriman.

<a id="maintenance"></a>

Rekonsiliasi tugas untuk cron dimiliki oleh runtime: tugas cron yang aktif tetap hidup selama runtime cron masih melacak job tersebut sebagai sedang berjalan, meskipun baris sesi child lama masih ada.
Setelah runtime berhenti memiliki job tersebut dan masa tenggang 5 menit berakhir, pemeliharaan dapat menandai tugas sebagai `lost`.

## Jenis jadwal

| Jenis   | Flag CLI  | Deskripsi                                                    |
| ------- | --------- | ------------------------------------------------------------ |
| `at`    | `--at`    | Stempel waktu sekali jalan (ISO 8601 atau relatif seperti `20m`) |
| `every` | `--every` | Interval tetap                                               |
| `cron`  | `--cron`  | Ekspresi cron 5-field atau 6-field dengan `--tz` opsional    |

Stempel waktu tanpa zona waktu diperlakukan sebagai UTC. Tambahkan `--tz America/New_York` untuk penjadwalan waktu lokal sesuai jam setempat.

Ekspresi berulang tepat di awal jam akan diacak otomatis hingga 5 menit untuk mengurangi lonjakan beban. Gunakan `--exact` untuk memaksa waktu yang presisi atau `--stagger 30s` untuk jendela eksplisit.

### Day-of-month dan day-of-week menggunakan logika OR

Ekspresi cron diurai oleh [croner](https://github.com/Hexagon/croner). Ketika field day-of-month dan day-of-week keduanya bukan wildcard, croner mencocokkan saat **salah satu** field cocok — bukan keduanya. Ini adalah perilaku cron Vixie standar.

```
# Maksud:   "Jam 9 pagi pada tanggal 15, hanya jika hari itu Senin"
# Realita:  "Jam 9 pagi pada setiap tanggal 15, DAN jam 9 pagi setiap hari Senin"
0 9 15 * 1
```

Ini terpicu ~5–6 kali per bulan, bukan 0–1 kali per bulan. OpenClaw menggunakan perilaku OR bawaan Croner di sini. Untuk mewajibkan kedua kondisi, gunakan modifier day-of-week `+` milik Croner (`0 9 15 * +1`) atau jadwalkan pada satu field dan cek field lainnya dalam prompt atau perintah job Anda.

## Gaya eksekusi

| Gaya           | Nilai `--session`   | Berjalan di               | Paling cocok untuk                 |
| -------------- | ------------------- | ------------------------- | ---------------------------------- |
| Sesi utama     | `main`              | Giliran Heartbeat berikutnya | Pengingat, peristiwa sistem     |
| Terisolasi     | `isolated`          | `cron:<jobId>` khusus     | Laporan, pekerjaan latar belakang  |
| Sesi saat ini  | `current`           | Terikat saat dibuat       | Pekerjaan berulang berbasis konteks |
| Sesi kustom    | `session:custom-id` | Sesi bernama persisten    | Alur kerja yang dibangun dari riwayat |

Job **sesi utama** mengantrikan peristiwa sistem dan secara opsional membangunkan heartbeat (`--wake now` atau `--wake next-heartbeat`). Job **terisolasi** menjalankan giliran agen khusus dengan sesi baru. **Sesi kustom** (`session:xxx`) mempertahankan konteks antar eksekusi, sehingga memungkinkan alur kerja seperti standup harian yang dibangun dari ringkasan sebelumnya.

Untuk job terisolasi, teardown runtime sekarang mencakup pembersihan browser best-effort untuk sesi cron tersebut. Kegagalan pembersihan diabaikan agar hasil cron yang sebenarnya tetap diprioritaskan.

Saat eksekusi cron terisolasi mengorkestrasi subagen, pengiriman juga lebih memprioritaskan output turunan akhir daripada teks sementara parent yang usang. Jika turunan masih berjalan, OpenClaw menekan pembaruan parent parsial itu alih-alih mengumumkannya.

### Opsi payload untuk job terisolasi

- `--message`: teks prompt (wajib untuk job terisolasi)
- `--model` / `--thinking`: override model dan tingkat thinking
- `--light-context`: lewati injeksi file bootstrap workspace
- `--tools exec,read`: batasi tool yang dapat digunakan job

`--model` menggunakan model yang dipilih dan diizinkan untuk job tersebut. Jika model yang diminta tidak diizinkan, cron mencatat peringatan dan kembali memakai pilihan model agen/default job tersebut. Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override model biasa tanpa daftar fallback eksplisit per-job tidak lagi menambahkan model utama agen sebagai target percobaan ulang ekstra yang tersembunyi.

Urutan prioritas pemilihan model untuk job terisolasi adalah:

1. Override model hook Gmail (ketika eksekusi berasal dari Gmail dan override tersebut diizinkan)
2. `model` payload per-job
3. Override model sesi cron yang tersimpan
4. Pemilihan model agen/default

Mode cepat juga mengikuti pilihan live yang telah diselesaikan. Jika konfigurasi model yang dipilih memiliki `params.fastMode`, cron terisolasi menggunakannya secara bawaan. Override `fastMode` sesi yang tersimpan tetap diprioritaskan atas konfigurasi, ke arah mana pun.

Jika eksekusi terisolasi menemui handoff perpindahan model live, cron mencoba ulang dengan provider/model yang telah dipindahkan dan menyimpan pilihan live itu sebelum mencoba ulang. Saat perpindahan juga membawa auth profile baru, cron juga menyimpan override auth profile tersebut. Percobaan ulang dibatasi: setelah percobaan awal ditambah 2 percobaan ulang perpindahan, cron membatalkan alih-alih berputar tanpa akhir.

## Pengiriman dan output

| Mode       | Yang terjadi                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Kirim fallback teks akhir ke target jika agen tidak mengirim       |
| `webhook`  | POST payload peristiwa selesai ke URL                              |
| `none`     | Tidak ada pengiriman fallback oleh runner                          |

Gunakan `--announce --channel telegram --to "-1001234567890"` untuk pengiriman ke channel. Untuk topik forum Telegram, gunakan `-1001234567890:topic:123`. Target Slack/Discord/Mattermost harus menggunakan prefix eksplisit (`channel:<id>`, `user:<id>`).

Untuk job terisolasi, pengiriman chat bersifat bersama. Jika rute chat tersedia, agen dapat menggunakan tool `message` bahkan ketika job memakai `--no-deliver`. Jika agen mengirim ke target yang dikonfigurasi/saat ini, OpenClaw melewati fallback announce. Jika tidak, `announce`, `webhook`, dan `none` hanya mengontrol apa yang dilakukan runner terhadap balasan akhir setelah giliran agen.

Notifikasi kegagalan mengikuti jalur tujuan terpisah:

- `cron.failureDestination` menetapkan bawaan global untuk notifikasi kegagalan.
- `job.delivery.failureDestination` mengganti itu per job.
- Jika keduanya tidak disetel dan job sudah mengirim melalui `announce`, notifikasi kegagalan sekarang fallback ke target announce utama tersebut.
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

Gateway dapat mengekspos endpoint Webhook HTTP untuk pemicu eksternal. Aktifkan dalam config:

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

Mengantrikan peristiwa sistem untuk sesi utama:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (wajib): deskripsi peristiwa
- `mode` (opsional): `now` (bawaan) atau `next-heartbeat`

### POST /hooks/agent

Menjalankan giliran agen terisolasi:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Field: `message` (wajib), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hook terpetakan (POST /hooks/\<name\>)

Nama hook kustom di-resolve melalui `hooks.mappings` dalam config. Mapping dapat mentransformasikan payload arbitrer menjadi aksi `wake` atau `agent` dengan template atau transformasi kode.

### Keamanan

- Simpan endpoint hook di balik loopback, tailnet, atau reverse proxy tepercaya.
- Gunakan token hook khusus; jangan gunakan ulang token auth gateway.
- Simpan `hooks.path` pada subpath khusus; `/` ditolak.
- Tetapkan `hooks.allowedAgentIds` untuk membatasi routing `agentId` eksplisit.
- Biarkan `hooks.allowRequestSessionKey=false` kecuali Anda membutuhkan sesi yang dipilih pemanggil.
- Jika Anda mengaktifkan `hooks.allowRequestSessionKey`, tetapkan juga `hooks.allowedSessionKeyPrefixes` untuk membatasi bentuk session key yang diizinkan.
- Payload hook dibungkus dengan batasan keamanan secara bawaan.

## Integrasi Gmail PubSub

Hubungkan pemicu kotak masuk Gmail ke OpenClaw melalui Google PubSub.

**Prasyarat**: CLI `gcloud`, `gog` (gogcli), hook OpenClaw diaktifkan, Tailscale untuk endpoint HTTPS publik.

### Penyiapan wizard (disarankan)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Ini menulis config `hooks.gmail`, mengaktifkan preset Gmail, dan menggunakan Tailscale Funnel untuk endpoint push.

### Auto-start Gateway

Saat `hooks.enabled=true` dan `hooks.gmail.account` disetel, Gateway memulai `gog gmail watch serve` saat boot dan memperbarui watch secara otomatis. Tetapkan `OPENCLAW_SKIP_GMAIL_WATCHER=1` untuk memilih tidak menggunakannya.

### Penyiapan manual sekali jalan

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

## Mengelola job

```bash
# Daftar semua job
openclaw cron list

# Tampilkan satu job, termasuk rute pengiriman yang telah di-resolve
openclaw cron show <jobId>

# Edit sebuah job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Paksa jalankan sebuah job sekarang
openclaw cron run <jobId>

# Jalankan hanya jika sudah jatuh tempo
openclaw cron run <jobId> --due

# Lihat riwayat eksekusi
openclaw cron runs --id <jobId> --limit 50

# Hapus sebuah job
openclaw cron remove <jobId>

# Pemilihan agen (penyiapan multi-agent)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Catatan override model:

- `openclaw cron add|edit --model ...` mengubah model yang dipilih job.
- Jika model diizinkan, provider/model yang tepat itu akan sampai ke eksekusi agen terisolasi.
- Jika tidak diizinkan, cron akan memperingatkan dan kembali ke pemilihan model agen/default job.
- Rantai fallback yang dikonfigurasi tetap berlaku, tetapi override `--model` biasa tanpa daftar fallback eksplisit per-job tidak lagi jatuh ke model utama agen sebagai target percobaan ulang tambahan yang diam-diam.

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

Sidecar status runtime diturunkan dari `cron.store`: penyimpanan `.json` seperti `~/clawd/cron/jobs.json` menggunakan `~/clawd/cron/jobs-state.json`, sedangkan path penyimpanan tanpa sufiks `.json` menambahkan `-state.json`.

Nonaktifkan cron: `cron.enabled: false` atau `OPENCLAW_SKIP_CRON=1`.

**Percobaan ulang sekali jalan**: error sementara (batas laju, kelebihan beban, jaringan, error server) dicoba ulang hingga 3 kali dengan exponential backoff. Error permanen langsung dinonaktifkan.

**Percobaan ulang berulang**: exponential backoff (30 detik hingga 60 menit) di antara percobaan ulang. Backoff di-reset setelah eksekusi sukses berikutnya.

**Pemeliharaan**: `cron.sessionRetention` (bawaan `24h`) memangkas entri sesi-eksekusi terisolasi. `cron.runLog.maxBytes` / `cron.runLog.keepLines` memangkas otomatis file run-log.

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

### Cron tidak terpicu

- Periksa `cron.enabled` dan variabel env `OPENCLAW_SKIP_CRON`.
- Pastikan Gateway berjalan terus-menerus.
- Untuk jadwal `cron`, verifikasi zona waktu (`--tz`) dibanding zona waktu host.
- `reason: not-due` pada output eksekusi berarti eksekusi manual diperiksa dengan `openclaw cron run <jobId> --due` dan job belum jatuh tempo.

### Cron terpicu tetapi tidak ada pengiriman

- Mode pengiriman `none` berarti tidak ada pengiriman fallback runner yang diharapkan. Agen masih dapat mengirim langsung dengan tool `message` saat rute chat tersedia.
- Target pengiriman hilang/tidak valid (`channel`/`to`) berarti pengiriman keluar dilewati.
- Error auth channel (`unauthorized`, `Forbidden`) berarti pengiriman diblokir oleh kredensial.
- Jika eksekusi terisolasi hanya mengembalikan token senyap (`NO_REPLY` / `no_reply`), OpenClaw menekan pengiriman keluar langsung dan juga menekan jalur ringkasan antrean fallback, sehingga tidak ada yang diposting kembali ke chat.
- Jika agen seharusnya mengirim pesan ke pengguna sendiri, periksa bahwa job memiliki rute yang dapat digunakan (`channel: "last"` dengan chat sebelumnya, atau channel/target eksplisit).

### Gotcha zona waktu

- Cron tanpa `--tz` menggunakan zona waktu host gateway.
- Jadwal `at` tanpa zona waktu diperlakukan sebagai UTC.
- Heartbeat `activeHours` menggunakan resolusi zona waktu yang dikonfigurasi.

## Terkait

- [Automation & Tasks](/id/automation) — semua mekanisme otomatisasi secara ringkas
- [Background Tasks](/id/automation/tasks) — ledger tugas untuk eksekusi cron
- [Heartbeat](/id/gateway/heartbeat) — giliran sesi utama periodik
- [Timezone](/id/concepts/timezone) — konfigurasi zona waktu
