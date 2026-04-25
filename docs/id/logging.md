---
read_when:
    - Anda memerlukan ikhtisar logging yang ramah pemula
    - Anda ingin mengonfigurasi level atau format log
    - Anda sedang memecahkan masalah dan perlu menemukan log dengan cepat
summary: 'Ikhtisar logging: log file, output konsol, tailing CLI, dan Control UI'
title: Ikhtisar logging
x-i18n:
    generated_at: "2026-04-25T13:49:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw memiliki dua permukaan log utama:

- **Log file** (baris JSON) yang ditulis oleh Gateway.
- **Output konsol** yang ditampilkan di terminal dan UI Debug Gateway.

Tab **Logs** di Control UI melakukan tail pada log file gateway. Halaman ini menjelaskan tempat
log berada, cara membacanya, dan cara mengonfigurasi level serta format log.

## Tempat log berada

Secara default, Gateway menulis file log bergulir di bawah:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

Tanggal menggunakan timezone lokal host gateway.

Anda dapat mengoverride ini di `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cara membaca log

### CLI: live tail (disarankan)

Gunakan CLI untuk melakukan tail pada file log gateway melalui RPC:

```bash
openclaw logs --follow
```

Opsi saat ini yang berguna:

- `--local-time`: render timestamp dalam timezone lokal Anda
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standar
- `--expect-final`: flag tunggu respons akhir RPC yang didukung agen (diterima di sini melalui layer klien bersama)

Mode output:

- **Sesi TTY**: baris log terstruktur yang rapi, berwarna, dan mudah dibaca.
- **Sesi non-TTY**: teks biasa.
- `--json`: JSON dipisahkan per baris (satu event log per baris).
- `--plain`: paksa teks biasa dalam sesi TTY.
- `--no-color`: nonaktifkan warna ANSI.

Saat Anda memberikan `--url` eksplisit, CLI tidak otomatis menerapkan config atau
kredensial environment; sertakan `--token` sendiri jika Gateway target
memerlukan auth.

Dalam mode JSON, CLI mengeluarkan objek bertanda `type`:

- `meta`: metadata stream (file, cursor, size)
- `log`: entri log yang telah diurai
- `notice`: petunjuk truncation / rotation
- `raw`: baris log yang tidak diurai

Jika Gateway loopback lokal meminta pairing, `openclaw logs` akan fallback ke
file log lokal yang dikonfigurasi secara otomatis. Target `--url` eksplisit tidak
menggunakan fallback ini.

Jika Gateway tidak dapat dijangkau, CLI mencetak petunjuk singkat untuk menjalankan:

```bash
openclaw doctor
```

### Control UI (web)

Tab **Logs** pada Control UI melakukan tail pada file yang sama menggunakan `logs.tail`.
Lihat [/web/control-ui](/id/web/control-ui) untuk cara membukanya.

### Log khusus saluran

Untuk memfilter aktivitas saluran (WhatsApp/Telegram/dll), gunakan:

```bash
openclaw channels logs --channel whatsapp
```

## Format log

### Log file (JSONL)

Setiap baris dalam file log adalah objek JSON. CLI dan Control UI mengurai
entri ini untuk merender output terstruktur (waktu, level, subsistem, pesan).

### Output konsol

Log konsol **sadar-TTY** dan diformat agar mudah dibaca:

- Prefiks subsistem (misalnya `gateway/channels/whatsapp`)
- Pewarnaan level (info/warn/error)
- Mode compact atau JSON opsional

Pemformatan konsol dikendalikan oleh `logging.consoleStyle`.

### Log Gateway WebSocket

`openclaw gateway` juga memiliki logging protokol WebSocket untuk lalu lintas RPC:

- mode normal: hanya hasil yang menarik (error, error parse, panggilan lambat)
- `--verbose`: semua lalu lintas request/response
- `--ws-log auto|compact|full`: pilih gaya rendering verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Mengonfigurasi logging

Semua konfigurasi logging berada di bawah `logging` dalam `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Level log

- `logging.level`: level **log file** (JSONL).
- `logging.consoleLevel`: level verbositas **konsol**.

Anda dapat mengoverride keduanya melalui variabel environment **`OPENCLAW_LOG_LEVEL`** (misalnya `OPENCLAW_LOG_LEVEL=debug`). Env var ini lebih diutamakan daripada file config, sehingga Anda dapat menaikkan verbositas untuk satu run tanpa mengedit `openclaw.json`. Anda juga dapat memberikan opsi CLI global **`--log-level <level>`** (misalnya, `openclaw --log-level debug gateway run`), yang mengoverride variabel environment untuk perintah tersebut.

`--verbose` hanya memengaruhi output konsol dan verbositas log WS; ini tidak mengubah
level log file.

### Gaya konsol

`logging.consoleStyle`:

- `pretty`: ramah manusia, berwarna, dengan timestamp.
- `compact`: output lebih rapat (terbaik untuk sesi panjang).
- `json`: JSON per baris (untuk pemroses log).

### Redaksi

Ringkasan alat dapat meredaksi token sensitif sebelum mencapai konsol:

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: daftar string regex untuk mengoverride set default

Redaksi hanya memengaruhi **output konsol** dan tidak mengubah log file.

## Diagnostik + OpenTelemetry

Diagnostik adalah event terstruktur yang dapat dibaca mesin untuk run model **dan**
telemetri alur pesan (Webhook, antrean, status sesi). Diagnostik **tidak**
menggantikan log; diagnostik ada untuk memberi makan metrik, trace, dan exporter lainnya.

Event diagnostik dikeluarkan in-process, tetapi exporter hanya akan terpasang saat
diagnostik + plugin exporter diaktifkan.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: model data + SDK untuk trace, metrik, dan log.
- **OTLP**: protokol wire yang digunakan untuk mengekspor data OTel ke collector/backend.
- OpenClaw mengekspor melalui **OTLP/HTTP (protobuf)** saat ini.

### Sinyal yang diekspor

- **Metrik**: counter + histogram (penggunaan token, alur pesan, antrean).
- **Trace**: span untuk penggunaan model + pemrosesan Webhook/pesan.
- **Log**: diekspor melalui OTLP saat `diagnostics.otel.logs` diaktifkan. Volume log
  bisa tinggi; perhatikan `logging.level` dan filter exporter.

### Katalog event diagnostik

Penggunaan model:

- `model.usage`: token, biaya, durasi, konteks, provider/model/channel, id sesi.

Alur pesan:

- `webhook.received`: ingress Webhook per saluran.
- `webhook.processed`: Webhook ditangani + durasi.
- `webhook.error`: error handler Webhook.
- `message.queued`: pesan dimasukkan ke antrean untuk diproses.
- `message.processed`: hasil + durasi + error opsional.
- `message.delivery.started`: percobaan pengiriman keluar dimulai.
- `message.delivery.completed`: percobaan pengiriman keluar selesai + jumlah durasi/hasil.
- `message.delivery.error`: percobaan pengiriman keluar gagal + durasi/kategori error terbatas.

Antrean + sesi:

- `queue.lane.enqueue`: enqueue lane antrean perintah + kedalaman.
- `queue.lane.dequeue`: dequeue lane antrean perintah + waktu tunggu.
- `session.state`: transisi status sesi + alasan.
- `session.stuck`: peringatan sesi macet + usia.
- `run.attempt`: metadata retry/attempt run.
- `diagnostic.heartbeat`: counter agregat (Webhook/antrean/sesi).

Exec:

- `exec.process.completed`: hasil proses exec terminal, durasi, target, mode,
  exit code, dan jenis kegagalan. Teks perintah dan direktori kerja tidak
  disertakan.

### Aktifkan diagnostik (tanpa exporter)

Gunakan ini jika Anda ingin event diagnostik tersedia untuk plugin atau sink kustom:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flag diagnostik (log yang ditargetkan)

Gunakan flag untuk menyalakan log debug tambahan yang ditargetkan tanpa menaikkan `logging.level`.
Flag tidak peka huruf besar/kecil dan mendukung wildcard (misalnya `telegram.*` atau `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Override env (sekali pakai):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Catatan:

- Log flag masuk ke file log standar (sama dengan `logging.file`).
- Output tetap direduksi sesuai `logging.redactSensitive`.
- Panduan lengkap: [/diagnostics/flags](/id/diagnostics/flags).

### Ekspor ke OpenTelemetry

Diagnostik dapat diekspor melalui plugin `diagnostics-otel` (OTLP/HTTP). Ini
berfungsi dengan collector/backend OpenTelemetry apa pun yang menerima OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Catatan:

- Anda juga dapat mengaktifkan plugin dengan `openclaw plugins enable diagnostics-otel`.
- `protocol` saat ini hanya mendukung `http/protobuf`. `grpc` diabaikan.
- Metrik mencakup penggunaan token, biaya, ukuran konteks, durasi run, dan
  counter/histogram alur pesan (Webhook, antrean, status sesi, kedalaman/tunggu antrean).
- Trace/metrik dapat diaktifkan atau dinonaktifkan dengan `traces` / `metrics` (default: aktif). Trace
  mencakup span penggunaan model ditambah span pemrosesan Webhook/pesan saat diaktifkan.
- Konten model/alat mentah tidak diekspor secara default. Gunakan
  `diagnostics.otel.captureContent` hanya ketika collector dan kebijakan retensi Anda
  telah disetujui untuk teks prompt, respons, alat, atau system prompt.
- Atur `headers` ketika collector Anda memerlukan auth.
- Variabel environment yang didukung: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Atur `OPENCLAW_OTEL_PRELOADED=1` saat preload lain atau proses host sudah
  mendaftarkan SDK OpenTelemetry global. Dalam mode itu plugin tidak memulai
  atau mematikan SDK-nya sendiri, tetapi tetap menghubungkan listener diagnostik OpenClaw dan
  menghormati `diagnostics.otel.traces`, `metrics`, dan `logs`.

### Metrik yang diekspor (nama + jenis)

Penggunaan model:

- `openclaw.tokens` (counter, attr: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attr: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attr: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attr: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Alur pesan:

- `openclaw.webhook.received` (counter, attr: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attr: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attr: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attr: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attr: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attr: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attr: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attr:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Antrean + sesi:

- `openclaw.queue.lane.enqueue` (counter, attr: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attr: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attr: `openclaw.lane` atau
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attr: `openclaw.lane`)
- `openclaw.session.state` (counter, attr: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attr: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attr: `openclaw.state`)
- `openclaw.run.attempt` (counter, attr: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (histogram, attr: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Span yang diekspor (nama + atribut kunci)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

Saat penangkapan konten diaktifkan secara eksplisit, span model/alat juga dapat menyertakan
atribut `openclaw.content.*` yang dibatasi dan direduksi untuk kelas konten tertentu
yang Anda pilih.

### Sampling + flushing

- Sampling trace: `diagnostics.otel.sampleRate` (0.0–1.0, hanya span root).
- Interval ekspor metrik: `diagnostics.otel.flushIntervalMs` (minimum 1000ms).

### Catatan protokol

- Endpoint OTLP/HTTP dapat diatur melalui `diagnostics.otel.endpoint` atau
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Jika endpoint sudah mengandung `/v1/traces` atau `/v1/metrics`, endpoint itu digunakan apa adanya.
- Jika endpoint sudah mengandung `/v1/logs`, endpoint itu digunakan apa adanya untuk log.
- `OPENCLAW_OTEL_PRELOADED=1` menggunakan ulang SDK OpenTelemetry yang terdaftar secara eksternal
  untuk trace/metrik alih-alih memulai NodeSDK milik plugin.
- `diagnostics.otel.logs` mengaktifkan ekspor log OTLP untuk output logger utama.

### Perilaku ekspor log

- Log OTLP menggunakan record terstruktur yang sama yang ditulis ke `logging.file`.
- Menghormati `logging.level` (level log file). Redaksi konsol **tidak** berlaku
  untuk log OTLP.
- Instalasi dengan volume tinggi sebaiknya mengutamakan sampling/filtering collector OTLP.

## Tips pemecahan masalah

- **Gateway tidak dapat dijangkau?** Jalankan `openclaw doctor` terlebih dahulu.
- **Log kosong?** Periksa bahwa Gateway sedang berjalan dan menulis ke path file
  di `logging.file`.
- **Butuh detail lebih?** Atur `logging.level` ke `debug` atau `trace` lalu coba lagi.

## Terkait

- [Gateway Logging Internals](/id/gateway/logging) — gaya log WS, prefiks subsistem, dan penangkapan konsol
- [Diagnostics](/id/gateway/configuration-reference#diagnostics) — ekspor OpenTelemetry dan konfigurasi trace cache
