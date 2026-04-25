---
read_when:
    - Menjalankan host Node tanpa antarmuka
    - Melakukan pairing Node non-macOS untuk `system.run`
summary: Referensi CLI untuk `openclaw node` (host Node tanpa antarmuka)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Jalankan **host Node tanpa antarmuka** yang terhubung ke Gateway WebSocket dan mengekspos
`system.run` / `system.which` pada mesin ini.

## Mengapa menggunakan host Node?

Gunakan host Node saat Anda ingin agen **menjalankan perintah di mesin lain** dalam
jaringan Anda tanpa memasang aplikasi pendamping macOS lengkap di sana.

Kasus penggunaan umum:

- Menjalankan perintah pada mesin Linux/Windows jarak jauh (server build, mesin lab, NAS).
- Menjaga exec tetap **tersandbox** di gateway, tetapi mendelegasikan run yang disetujui ke host lain.
- Menyediakan target eksekusi ringan tanpa antarmuka untuk otomatisasi atau Node CI.

Eksekusi tetap dijaga oleh **persetujuan exec** dan allowlist per agen pada
host Node, sehingga Anda dapat menjaga akses perintah tetap terbatas dan eksplisit.

## Proxy browser (zero-config)

Host Node otomatis mengiklankan proxy browser jika `browser.enabled` tidak
dinonaktifkan pada node. Ini memungkinkan agen menggunakan otomatisasi browser pada node tersebut
tanpa konfigurasi tambahan.

Secara default, proxy mengekspos permukaan profil browser normal milik node. Jika Anda
mengatur `nodeHost.browserProxy.allowProfiles`, proxy menjadi restriktif:
penargetan profil yang tidak ada di allowlist akan ditolak, dan rute
buat/hapus profil persisten diblokir melalui proxy.

Nonaktifkan di node bila perlu:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Jalankan (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (default: `18789`)
- `--tls`: gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: fingerprint sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: override id node (menghapus token pairing)
- `--display-name <name>`: override nama tampilan node

## Autentikasi Gateway untuk host Node

`openclaw node run` dan `openclaw node install` me-resolve autentikasi gateway dari config/env (tidak ada flag `--token`/`--password` pada perintah node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` diperiksa terlebih dahulu.
- Lalu fallback config lokal: `gateway.auth.token` / `gateway.auth.password`.
- Dalam mode lokal, host node sengaja tidak mewarisi `gateway.remote.token` / `gateway.remote.password`.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak ter-resolve, resolusi autentikasi node gagal tertutup (tanpa fallback remote yang menutupi).
- Dalam `gateway.mode=remote`, field klien remote (`gateway.remote.token` / `gateway.remote.password`) juga memenuhi syarat sesuai aturan prioritas remote.
- Resolusi autentikasi host Node hanya menghormati env var `OPENCLAW_GATEWAY_*`.

Untuk node yang terhubung ke Gateway `ws://` non-loopback pada jaringan privat tepercaya,
atur `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Tanpanya, startup node
gagal tertutup dan meminta Anda menggunakan `wss://`, tunnel SSH, atau Tailscale.
Ini adalah opt-in process-environment, bukan key konfigurasi `openclaw.json`.
`openclaw node install` mempertahankannya ke dalam layanan node yang diawasi ketika env tersebut
ada di environment perintah install.

## Layanan (background)

Pasang host Node tanpa antarmuka sebagai layanan pengguna.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opsi:

- `--host <host>`: host Gateway WebSocket (default: `127.0.0.1`)
- `--port <port>`: port Gateway WebSocket (default: `18789`)
- `--tls`: gunakan TLS untuk koneksi gateway
- `--tls-fingerprint <sha256>`: fingerprint sertifikat TLS yang diharapkan (sha256)
- `--node-id <id>`: override id node (menghapus token pairing)
- `--display-name <name>`: override nama tampilan node
- `--runtime <runtime>`: runtime layanan (`node` atau `bun`)
- `--force`: pasang ulang/timpa jika sudah terpasang

Kelola layanan:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Gunakan `openclaw node run` untuk host Node foreground (tanpa layanan).

Perintah layanan menerima `--json` untuk output yang dapat dibaca mesin.

## Pairing

Koneksi pertama membuat permintaan pairing perangkat tertunda (`role: node`) pada Gateway.
Setujui melalui:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Pada jaringan node yang dikontrol ketat, operator Gateway dapat secara eksplisit memilih
persetujuan otomatis pairing node pertama kali dari CIDR tepercaya:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pairing `role: node` baru dengan
tanpa scope yang diminta. Klien operator/browser, Control UI, WebChat, dan peningkatan role,
scope, metadata, atau public-key tetap memerlukan persetujuan manual.

Jika node mencoba pairing ulang dengan detail autentikasi yang berubah (role/scopes/public key),
permintaan tertunda sebelumnya akan digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

Host Node menyimpan id node, token, nama tampilan, dan info koneksi gateway di
`~/.openclaw/node.json`.

## Persetujuan exec

`system.run` digerbangkan oleh persetujuan exec lokal:

- `~/.openclaw/exec-approvals.json`
- [Persetujuan exec](/id/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (edit dari Gateway)

Untuk exec node async yang disetujui, OpenClaw menyiapkan `systemRunPlan`
kanonis sebelum meminta persetujuan. Penerusan `system.run` yang disetujui kemudian menggunakan ulang
rencana tersimpan tersebut, sehingga pengeditan pada field command/cwd/session setelah permintaan persetujuan
dibuat akan ditolak alih-alih mengubah apa yang dieksekusi node.

## Terkait

- [Referensi CLI](/id/cli)
- [Nodes](/id/nodes)
