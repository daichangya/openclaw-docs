---
read_when:
    - Anda ingin menjalankan Gateway di server Linux atau cloud VPS
    - Anda memerlukan peta cepat panduan hosting
    - Anda ingin penyesuaian server Linux generik untuk OpenClaw
sidebarTitle: Linux Server
summary: Jalankan OpenClaw di server Linux atau cloud VPS — pemilih provider, arsitektur, dan penyesuaian performa
title: Server Linux
x-i18n:
    generated_at: "2026-04-23T09:30:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Server Linux

Jalankan Gateway OpenClaw di server Linux atau cloud VPS mana pun. Halaman ini membantu Anda memilih provider, menjelaskan cara kerja deployment cloud, dan membahas penyesuaian Linux generik yang berlaku di mana saja.

## Pilih provider

<CardGroup cols={2}>
  <Card title="Railway" href="/id/install/railway">Penyiapan sekali klik, di browser</Card>
  <Card title="Northflank" href="/id/install/northflank">Penyiapan sekali klik, di browser</Card>
  <Card title="DigitalOcean" href="/id/install/digitalocean">VPS berbayar yang sederhana</Card>
  <Card title="Oracle Cloud" href="/id/install/oracle">Tier ARM Always Free</Card>
  <Card title="Fly.io" href="/id/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/id/install/hetzner">Docker di VPS Hetzner</Card>
  <Card title="Hostinger" href="/id/install/hostinger">VPS dengan penyiapan sekali klik</Card>
  <Card title="GCP" href="/id/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/id/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/id/install/exe-dev">VM dengan proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/id/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** juga bekerja dengan baik.
Panduan video komunitas tersedia di
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(sumber komunitas -- mungkin menjadi tidak tersedia).

## Cara kerja penyiapan cloud

- **Gateway berjalan di VPS** dan memiliki status + workspace.
- Anda terhubung dari laptop atau ponsel melalui **Control UI** atau **Tailscale/SSH**.
- Perlakukan VPS sebagai sumber kebenaran dan **cadangkan** status + workspace secara teratur.
- Default aman: pertahankan Gateway di loopback dan akses melalui tunnel SSH atau Tailscale Serve.
  Jika Anda melakukan bind ke `lan` atau `tailnet`, wajibkan `gateway.auth.token` atau `gateway.auth.password`.

Halaman terkait: [Akses remote Gateway](/id/gateway/remote), [hub Platform](/id/platforms).

## Agen perusahaan bersama di VPS

Menjalankan satu agen untuk tim adalah penyiapan yang valid ketika setiap pengguna berada dalam batas kepercayaan yang sama dan agen hanya untuk bisnis.

- Simpan di runtime khusus (VPS/VM/container + pengguna/akun OS khusus).
- Jangan masuk ke runtime tersebut dengan akun Apple/Google pribadi atau profil browser/password-manager pribadi.
- Jika pengguna bersifat adversarial satu sama lain, pisahkan berdasarkan gateway/host/pengguna OS.

Detail model keamanan: [Keamanan](/id/gateway/security).

## Menggunakan node dengan VPS

Anda dapat menyimpan Gateway di cloud dan memasangkan **node** di perangkat lokal Anda
(Mac/iOS/Android/headless). Node menyediakan layar/kamera/canvas lokal dan kapabilitas `system.run`
sementara Gateway tetap berada di cloud.

Dokumentasi: [Nodes](/id/nodes), [CLI Nodes](/id/cli/nodes).

## Penyesuaian startup untuk VM kecil dan host ARM

Jika perintah CLI terasa lambat pada VM berdaya rendah (atau host ARM), aktifkan module compile cache milik Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` meningkatkan waktu startup perintah berulang.
- `OPENCLAW_NO_RESPAWN=1` menghindari overhead startup tambahan dari jalur self-respawn.
- Eksekusi perintah pertama memanaskan cache; eksekusi berikutnya lebih cepat.
- Untuk detail khusus Raspberry Pi, lihat [Raspberry Pi](/id/install/raspberry-pi).

### Daftar periksa penyesuaian systemd (opsional)

Untuk host VM yang menggunakan `systemd`, pertimbangkan:

- Tambahkan env layanan untuk jalur startup yang stabil:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Pertahankan perilaku restart secara eksplisit:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Gunakan disk berbasis SSD untuk path status/cache guna mengurangi penalti cold-start random-I/O.

Untuk jalur standar `openclaw onboard --install-daemon`, edit unit pengguna:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Jika Anda sengaja memasang unit sistem, edit
`openclaw-gateway.service` melalui `sudo systemctl edit openclaw-gateway.service`.

Cara kebijakan `Restart=` membantu pemulihan otomatis:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Untuk perilaku OOM Linux, pemilihan korban proses anak, dan diagnostik `exit 137`,
lihat [Tekanan memori Linux dan OOM kill](/id/platforms/linux#memory-pressure-and-oom-kills).
