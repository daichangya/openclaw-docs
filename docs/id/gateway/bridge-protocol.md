---
read_when:
    - Membangun atau men-debug klien node (mode node iOS/Android/macOS)
    - Menyelidiki kegagalan pairing atau auth bridge
    - Mengaudit surface node yang diekspos oleh gateway
summary: 'Protokol bridge historis (node legacy): TCP JSONL, pairing, RPC dengan scope terbatas'
title: Protokol bridge
x-i18n:
    generated_at: "2026-04-25T13:45:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
Bridge TCP telah **dihapus**. Build OpenClaw saat ini tidak lagi menyertakan listener bridge dan key config `bridge.*` tidak lagi ada dalam schema. Halaman ini dipertahankan hanya untuk referensi historis. Gunakan [Gateway Protocol](/id/gateway/protocol) untuk semua klien node/operator.
</Warning>

## Mengapa ini ada

- **Batas keamanan**: bridge mengekspos allowlist kecil alih-alih seluruh
  surface API gateway.
- **Pairing + identitas node**: penerimaan node dimiliki oleh gateway dan terkait
  dengan token per node.
- **UX penemuan**: node dapat menemukan gateway melalui Bonjour di LAN, atau terhubung
  langsung melalui tailnet.
- **Loopback WS**: control plane WS penuh tetap lokal kecuali ditunnel melalui SSH.

## Transport

- TCP, satu objek JSON per baris (JSONL).
- TLS opsional (saat `bridge.tls.enabled` bernilai true).
- Port listener default historis adalah `18790` (build saat ini tidak memulai
  bridge TCP).

Saat TLS diaktifkan, record TXT discovery menyertakan `bridgeTls=1` ditambah
`bridgeTlsSha256` sebagai petunjuk non-rahasia. Perlu dicatat bahwa record TXT Bonjour/mDNS tidak
diautentikasi; klien tidak boleh memperlakukan fingerprint yang diiklankan sebagai
pin otoritatif tanpa maksud pengguna yang eksplisit atau verifikasi out-of-band lainnya.

## Handshake + pairing

1. Klien mengirim `hello` dengan metadata node + token (jika sudah dipasangkan).
2. Jika belum dipasangkan, gateway membalas `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Klien mengirim `pair-request`.
4. Gateway menunggu persetujuan, lalu mengirim `pair-ok` dan `hello-ok`.

Secara historis, `hello-ok` mengembalikan `serverName` dan dapat menyertakan
`canvasHostUrl`.

## Frame

Klien → Gateway:

- `req` / `res`: RPC gateway dengan scope terbatas (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sinyal node (transkrip voice, permintaan agen, subscribe chat, siklus hidup exec)

Gateway → Klien:

- `invoke` / `invoke-res`: perintah node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: pembaruan chat untuk sesi yang di-subscribe
- `ping` / `pong`: keepalive

Penegakan allowlist legacy berada di `src/gateway/server-bridge.ts` (sudah dihapus).

## Event siklus hidup exec

Node dapat mengirim event `exec.finished` atau `exec.denied` untuk menampilkan aktivitas system.run.
Event ini dipetakan ke event sistem di gateway. (Node legacy mungkin masih mengirim `exec.started`.)

Field payload (semua opsional kecuali jika ditandai):

- `sessionKey` (wajib): sesi agen untuk menerima event sistem.
- `runId`: ID exec unik untuk pengelompokan.
- `command`: string perintah mentah atau yang sudah diformat.
- `exitCode`, `timedOut`, `success`, `output`: detail penyelesaian (hanya finished).
- `reason`: alasan penolakan (hanya denied).

## Penggunaan tailnet historis

- Bind bridge ke IP tailnet: `bridge.bind: "tailnet"` di
  `~/.openclaw/openclaw.json` (hanya historis; `bridge.*` tidak lagi valid).
- Klien terhubung melalui nama MagicDNS atau IP tailnet.
- Bonjour **tidak** melintasi jaringan; gunakan host/port manual atau wide-area DNS‑SD
  bila diperlukan.

## Pembuatan versi

Bridge ini adalah **v1 implisit** (tanpa negosiasi min/max). Bagian ini
hanya referensi historis; klien node/operator saat ini menggunakan WebSocket
[Gateway Protocol](/id/gateway/protocol).

## Terkait

- [Gateway protocol](/id/gateway/protocol)
- [Nodes](/id/nodes)
