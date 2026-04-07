---
read_when:
    - Anda ingin memicu atau menjalankan TaskFlow dari sistem eksternal
    - Anda sedang mengonfigurasi plugin webhooks bawaan
summary: 'Plugin Webhooks: ingress TaskFlow terautentikasi untuk otomatisasi eksternal tepercaya'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-04-07T09:17:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5da12a887752ec6ee853cfdb912db0ae28512a0ffed06fe3828ef2eee15bc9d
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (plugin)

Plugin Webhooks menambahkan rute HTTP terautentikasi yang menghubungkan otomatisasi eksternal ke OpenClaw TaskFlows.

Gunakan ini saat Anda ingin sistem tepercaya seperti Zapier, n8n, pekerjaan CI, atau layanan internal membuat dan menjalankan TaskFlow terkelola tanpa perlu lebih dulu menulis plugin kustom.

## Tempat plugin ini berjalan

Plugin Webhooks berjalan di dalam proses Gateway.

Jika Gateway Anda berjalan di mesin lain, instal dan konfigurasikan plugin di host Gateway tersebut, lalu mulai ulang Gateway.

## Konfigurasikan rute

Atur konfigurasi di bawah `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Bidang rute:

- `enabled`: opsional, default-nya `true`
- `path`: opsional, default-nya `/plugins/webhooks/<routeId>`
- `sessionKey`: sesi wajib yang memiliki TaskFlow yang terikat
- `secret`: rahasia bersama atau SecretRef yang wajib
- `controllerId`: id controller opsional untuk flow terkelola yang dibuat
- `description`: catatan operator opsional

Input `secret` yang didukung:

- String biasa
- SecretRef dengan `source: "env" | "file" | "exec"`

Jika rute yang didukung secret tidak dapat menyelesaikan secret-nya saat startup, plugin akan melewati rute tersebut dan mencatat peringatan alih-alih mengekspos endpoint yang rusak.

## Model keamanan

Setiap rute dipercaya untuk bertindak dengan otoritas TaskFlow dari `sessionKey` yang dikonfigurasi.

Ini berarti rute dapat memeriksa dan mengubah TaskFlow yang dimiliki oleh sesi tersebut, jadi Anda sebaiknya:

- Gunakan secret unik yang kuat untuk setiap rute
- Lebih pilih referensi secret daripada secret plaintext inline
- Ikat rute ke sesi paling sempit yang sesuai dengan alur kerja
- Ekspos hanya path webhook spesifik yang Anda butuhkan

Plugin ini menerapkan:

- Autentikasi secret bersama
- Perlindungan ukuran body permintaan dan batas waktu
- Pembatasan laju fixed-window
- Pembatasan permintaan yang sedang berlangsung
- Akses TaskFlow terikat pemilik melalui `api.runtime.taskFlow.bindSession(...)`

## Format permintaan

Kirim permintaan `POST` dengan:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` atau `x-openclaw-webhook-secret: <secret>`

Contoh:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Tindakan yang didukung

Plugin saat ini menerima nilai JSON `action` berikut:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Membuat TaskFlow terkelola untuk sesi terikat milik rute.

Contoh:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Membuat tugas anak terkelola di dalam TaskFlow terkelola yang sudah ada.

Runtime yang diizinkan adalah:

- `subagent`
- `acp`

Contoh:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Bentuk respons

Respons yang berhasil mengembalikan:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Permintaan yang ditolak mengembalikan:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow tidak ditemukan.",
  "result": {}
}
```

Plugin ini secara sengaja membersihkan metadata pemilik/sesi dari respons webhook.

## Dokumentasi terkait

- [SDK runtime plugin](/id/plugins/sdk-runtime)
- [Ikhtisar hooks dan webhooks](/id/automation/hooks)
- [CLI webhooks](/cli/webhooks)
