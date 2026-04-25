---
read_when:
    - Menjalankan atau memecahkan masalah penyiapan gateway jarak jauh
summary: Akses jarak jauh menggunakan tunnel SSH (Gateway WS) dan tailnet
title: Akses jarak jauh
x-i18n:
    generated_at: "2026-04-25T13:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

Repositori ini mendukung “remote over SSH” dengan mempertahankan satu Gateway (master) yang berjalan di host khusus (desktop/server) dan menghubungkan klien ke sana.

- Untuk **operator (Anda / aplikasi macOS)**: tunneling SSH adalah fallback universal.
- Untuk **node (iOS/Android dan perangkat mendatang)**: hubungkan ke **Gateway WebSocket** (LAN/tailnet atau tunnel SSH sesuai kebutuhan).

## Gagasan inti

- Gateway WebSocket bind ke **loopback** pada port yang Anda konfigurasi (default `18789`).
- Untuk penggunaan jarak jauh, Anda meneruskan port loopback tersebut melalui SSH (atau gunakan tailnet/VPN dan kurangi penggunaan tunnel).

## Penyiapan VPN/tailnet umum (tempat agen berada)

Anggap **host Gateway** sebagai “tempat agen berada.” Host ini memiliki sesi, profil auth, saluran, dan status.
Laptop/desktop Anda (dan node) terhubung ke host tersebut.

### 1) Gateway selalu aktif di tailnet Anda (VPS atau server rumah)

Jalankan Gateway di host persisten dan akses melalui **Tailscale** atau SSH.

- **UX terbaik:** pertahankan `gateway.bind: "loopback"` dan gunakan **Tailscale Serve** untuk Control UI.
- **Fallback:** pertahankan loopback + tunnel SSH dari mesin mana pun yang membutuhkan akses.
- **Contoh:** [exe.dev](/id/install/exe-dev) (VM mudah) atau [Hetzner](/id/install/hetzner) (VPS produksi).

Ini ideal saat laptop Anda sering tidur tetapi Anda ingin agen selalu aktif.

### 2) Desktop rumah menjalankan Gateway, laptop menjadi remote control

Laptop **tidak** menjalankan agen. Laptop terhubung dari jarak jauh:

- Gunakan mode **Remote over SSH** pada aplikasi macOS (Settings → General → “OpenClaw runs”).
- Aplikasi membuka dan mengelola tunnel, sehingga WebChat + health check “langsung berfungsi”.

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

### 3) Laptop menjalankan Gateway, akses jarak jauh dari mesin lain

Pertahankan Gateway tetap lokal tetapi ekspos dengan aman:

- Tunnel SSH ke laptop dari mesin lain, atau
- Tailscale Serve untuk Control UI dan pertahankan Gateway hanya-loopback.

Panduan: [Tailscale](/id/gateway/tailscale) dan [Ikhtisar web](/id/web).

## Alur perintah (apa yang berjalan di mana)

Satu layanan gateway memiliki status + saluran. Node adalah periferal.

Contoh alur (Telegram → node):

- Pesan Telegram tiba di **Gateway**.
- Gateway menjalankan **agen** dan memutuskan apakah perlu memanggil alat node.
- Gateway memanggil **node** melalui Gateway WebSocket (`node.*` RPC).
- Node mengembalikan hasil; Gateway membalas kembali ke Telegram.

Catatan:

- **Node tidak menjalankan layanan gateway.** Hanya satu gateway yang seharusnya berjalan per host kecuali Anda memang sengaja menjalankan profil terisolasi (lihat [Beberapa gateway](/id/gateway/multiple-gateways)).
- “Mode node” aplikasi macOS hanyalah klien node melalui Gateway WebSocket.

## Tunnel SSH (CLI + alat)

Buat tunnel lokal ke Gateway WS jarak jauh:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Saat tunnel aktif:

- `openclaw health` dan `openclaw status --deep` kini menjangkau gateway jarak jauh melalui `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, dan `openclaw gateway call` juga dapat menargetkan URL yang diteruskan melalui `--url` bila diperlukan.

Catatan: ganti `18789` dengan `gateway.port` yang Anda konfigurasi (atau `--port`/`OPENCLAW_GATEWAY_PORT`).
Catatan: saat Anda memberikan `--url`, CLI tidak melakukan fallback ke kredensial config atau environment.
Sertakan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.

## Default jarak jauh CLI

Anda dapat mempertahankan target jarak jauh agar perintah CLI menggunakannya secara default:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Ketika gateway hanya-loopback, pertahankan URL di `ws://127.0.0.1:18789` dan buka tunnel SSH terlebih dahulu.

## Prioritas kredensial

Resolusi kredensial Gateway mengikuti satu kontrak bersama di seluruh jalur call/probe/status dan pemantauan persetujuan exec Discord. Node-host menggunakan kontrak dasar yang sama dengan satu pengecualian mode lokal (sengaja mengabaikan `gateway.remote.*`):

- Kredensial eksplisit (`--token`, `--password`, atau alat `gatewayToken`) selalu diutamakan pada jalur call yang menerima auth eksplisit.
- Keamanan override URL:
  - Override URL CLI (`--url`) tidak pernah menggunakan ulang kredensial config/env implisit.
  - Override URL env (`OPENCLAW_GATEWAY_URL`) dapat menggunakan hanya kredensial env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Default mode lokal:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback remote hanya berlaku saat input token auth lokal tidak diatur)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback remote hanya berlaku saat input password auth lokal tidak diatur)
- Default mode jarak jauh:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Pengecualian mode lokal Node-host: `gateway.remote.token` / `gateway.remote.password` diabaikan.
- Pemeriksaan token probe/status jarak jauh bersifat ketat secara default: hanya menggunakan `gateway.remote.token` (tanpa fallback token lokal) saat menargetkan mode jarak jauh.
- Override env Gateway hanya menggunakan `OPENCLAW_GATEWAY_*`.

## UI chat melalui SSH

WebChat tidak lagi menggunakan port HTTP terpisah. UI chat SwiftUI terhubung langsung ke Gateway WebSocket.

- Teruskan `18789` melalui SSH (lihat di atas), lalu hubungkan klien ke `ws://127.0.0.1:18789`.
- Di macOS, utamakan mode “Remote over SSH” pada aplikasi, yang mengelola tunnel secara otomatis.

## Aplikasi macOS "Remote over SSH"

Aplikasi menu bar macOS dapat mengelola penyiapan yang sama secara end-to-end (pemeriksaan status jarak jauh, WebChat, dan penerusan Voice Wake).

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

## Aturan keamanan (remote/VPN)

Versi singkat: **pertahankan Gateway hanya-loopback** kecuali Anda yakin memang perlu bind.

- **Loopback + SSH/Tailscale Serve** adalah default paling aman (tanpa ekspos publik).
- `ws://` plaintext secara default hanya untuk loopback. Untuk jaringan privat tepercaya,
  atur `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` pada proses klien sebagai
  jalan keluar darurat. Tidak ada padanan `openclaw.json`; ini harus berupa process
  environment untuk klien yang membuat koneksi WebSocket.
- **Bind non-loopback** (`lan`/`tailnet`/`custom`, atau `auto` saat loopback tidak tersedia) harus menggunakan auth gateway: token, password, atau reverse proxy sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` adalah sumber kredensial klien. Keduanya **tidak** dengan sendirinya mengonfigurasi auth server.
- Jalur call lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya saat `gateway.auth.*` tidak diatur.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak ter-resolve, resolusi gagal tertutup (tanpa fallback remote yang menutupi).
- `gateway.remote.tlsFingerprint` mem-pin sertifikat TLS jarak jauh saat menggunakan `wss://`.
- **Tailscale Serve** dapat mengautentikasi lalu lintas Control UI/WebSocket melalui header identitas
  saat `gateway.auth.allowTailscale: true`; endpoint API HTTP tidak
  menggunakan auth header Tailscale itu dan sebagai gantinya mengikuti mode auth HTTP
  normal gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Atur menjadi
  `false` jika Anda ingin auth shared-secret di mana-mana.
- Auth **Trusted-proxy** hanya untuk penyiapan proxy sadar identitas non-loopback.
  Reverse proxy loopback pada host yang sama tidak memenuhi `gateway.auth.mode: "trusted-proxy"`.
- Perlakukan kontrol browser seperti akses operator: hanya tailnet + pairing node yang disengaja.

Pendalaman: [Security](/id/gateway/security).

### macOS: tunnel SSH persisten melalui LaunchAgent

Untuk klien macOS yang terhubung ke gateway jarak jauh, penyiapan persisten termudah menggunakan entri konfigurasi SSH `LocalForward` ditambah LaunchAgent untuk menjaga tunnel tetap hidup saat reboot dan crash.

#### Langkah 1: tambahkan konfigurasi SSH

Edit `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Ganti `<REMOTE_IP>` dan `<REMOTE_USER>` dengan nilai Anda.

#### Langkah 2: salin kunci SSH (sekali saja)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Langkah 3: konfigurasikan token gateway

Simpan token dalam konfigurasi agar tetap bertahan setelah restart:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Langkah 4: buat LaunchAgent

Simpan ini sebagai `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Langkah 5: muat LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tunnel akan mulai otomatis saat login, restart saat crash, dan menjaga port yang diteruskan tetap aktif.

Catatan: jika Anda memiliki LaunchAgent `com.openclaw.ssh-tunnel` sisa dari penyiapan lama, unload dan hapus file tersebut.

#### Pemecahan masalah

Periksa apakah tunnel sedang berjalan:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Restart tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Hentikan tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entri konfigurasi                     | Fungsinya                                                    |
| ------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`  | Meneruskan port lokal 18789 ke port jarak jauh 18789         |
| `ssh -N`                              | SSH tanpa menjalankan perintah jarak jauh (hanya port-forwarding) |
| `KeepAlive`                           | Otomatis me-restart tunnel jika crash                        |
| `RunAtLoad`                           | Memulai tunnel saat LaunchAgent dimuat ketika login          |

## Terkait

- [Tailscale](/id/gateway/tailscale)
- [Authentication](/id/gateway/authentication)
- [Remote gateway setup](/id/gateway/remote-gateway-readme)
