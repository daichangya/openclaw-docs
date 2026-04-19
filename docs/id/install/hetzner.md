---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di VPS cloud (bukan laptop Anda)
    - Anda menginginkan Gateway yang selalu aktif dan siap produksi di VPS Anda sendiri
    - Anda menginginkan kontrol penuh atas persistensi, biner, dan perilaku restart
    - Anda menjalankan OpenClaw di Docker pada Hetzner atau penyedia serupa
summary: Jalankan Gateway OpenClaw 24/7 di VPS Hetzner murah (Docker) dengan state yang tahan lama dan biner yang sudah disertakan
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw di Hetzner (Docker, Panduan VPS Produksi)

## Tujuan

Jalankan Gateway OpenClaw yang persisten di VPS Hetzner menggunakan Docker, dengan state yang tahan lama, biner yang sudah disertakan, dan perilaku restart yang aman.

Jika Anda menginginkan “OpenClaw 24/7 seharga ~$5”, ini adalah pengaturan andal paling sederhana.
Harga Hetzner berubah-ubah; pilih VPS Debian/Ubuntu terkecil dan tingkatkan jika Anda mengalami OOM.

Pengingat model keamanan:

- Agen yang dibagikan dalam perusahaan tidak masalah ketika semua orang berada dalam batas kepercayaan yang sama dan runtime hanya digunakan untuk bisnis.
- Pertahankan pemisahan yang ketat: VPS/runtime khusus + akun khusus; jangan gunakan profil Apple/Google/browser/password-manager pribadi di host tersebut.
- Jika pengguna saling berlawanan satu sama lain, pisahkan berdasarkan gateway/host/pengguna OS.

Lihat [Keamanan](/id/gateway/security) dan [hosting VPS](/id/vps).

## Apa yang kita lakukan (dalam istilah sederhana)?

- Menyewa server Linux kecil (VPS Hetzner)
- Menginstal Docker (runtime aplikasi terisolasi)
- Menjalankan Gateway OpenClaw di Docker
- Menyimpan `~/.openclaw` + `~/.openclaw/workspace` di host (tetap ada setelah restart/rebuild)
- Mengakses UI Kontrol dari laptop Anda melalui tunnel SSH

State `~/.openclaw` yang dimount tersebut mencakup `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` per agen, dan `.env`.

Gateway dapat diakses melalui:

- SSH port forwarding dari laptop Anda
- Eksposur port langsung jika Anda mengelola firewall dan token sendiri

Panduan ini mengasumsikan Ubuntu atau Debian di Hetzner.  
Jika Anda menggunakan VPS Linux lain, sesuaikan paketnya.
Untuk alur Docker umum, lihat [Docker](/id/install/docker).

---

## Jalur cepat (operator berpengalaman)

1. Provision VPS Hetzner
2. Instal Docker
3. Clone repositori OpenClaw
4. Buat direktori host persisten
5. Konfigurasikan `.env` dan `docker-compose.yml`
6. Sertakan biner yang diperlukan ke dalam image
7. `docker compose up -d`
8. Verifikasi persistensi dan akses Gateway

---

## Yang Anda perlukan

- VPS Hetzner dengan akses root
- Akses SSH dari laptop Anda
- Kenyamanan dasar menggunakan SSH + salin/tempel
- ~20 menit
- Docker dan Docker Compose
- Kredensial autentikasi model
- Kredensial penyedia opsional
  - QR WhatsApp
  - token bot Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Provision VPS">
    Buat VPS Ubuntu atau Debian di Hetzner.

    Hubungkan sebagai root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Panduan ini mengasumsikan VPS bersifat stateful.
    Jangan perlakukan sebagai infrastruktur sekali pakai.

  </Step>

  <Step title="Instal Docker (di VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Verifikasi:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone repositori OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Panduan ini mengasumsikan Anda akan membangun image kustom untuk menjamin persistensi biner.

  </Step>

  <Step title="Buat direktori host persisten">
    Kontainer Docker bersifat ephemeral.
    Semua state jangka panjang harus disimpan di host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership ke pengguna kontainer (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Konfigurasikan variabel environment">
    Buat `.env` di root repositori.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Biarkan `OPENCLAW_GATEWAY_TOKEN` kosong kecuali Anda secara eksplisit ingin
    mengelolanya melalui `.env`; OpenClaw menulis token gateway acak ke
    konfigurasi saat pertama kali dijalankan. Buat kata sandi keyring dan tempelkan ke
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Jangan commit file ini.**

    File `.env` ini digunakan untuk env kontainer/runtime seperti `OPENCLAW_GATEWAY_TOKEN`.
    Autentikasi OAuth/API-key penyedia yang disimpan berada di
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` yang dimount.

  </Step>

  <Step title="Konfigurasi Docker Compose">
    Buat atau perbarui `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Disarankan: pertahankan Gateway hanya loopback di VPS; akses melalui tunnel SSH.
          # Untuk mengeksposnya secara publik, hapus prefix `127.0.0.1:` dan atur firewall dengan tepat.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` hanya untuk kemudahan bootstrap, ini bukan pengganti konfigurasi gateway yang benar. Tetap atur autentikasi (`gateway.auth.token` atau kata sandi) dan gunakan pengaturan bind yang aman untuk deployment Anda.

  </Step>

  <Step title="Langkah runtime VM Docker bersama">
    Gunakan panduan runtime bersama untuk alur host Docker umum:

    - [Sertakan biner yang diperlukan ke dalam image](/id/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build and launch](/id/install/docker-vm-runtime#build-and-launch)
    - [Apa yang persisten di mana](/id/install/docker-vm-runtime#what-persists-where)
    - [Pembaruan](/id/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Akses khusus Hetzner">
    Setelah langkah build dan launch bersama, buat tunnel dari laptop Anda:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Buka:

    `http://127.0.0.1:18789/`

    Tempel shared secret yang telah dikonfigurasi. Panduan ini menggunakan token gateway secara default; jika Anda beralih ke autentikasi berbasis kata sandi, gunakan kata sandi tersebut.

  </Step>
</Steps>

Peta persistensi bersama tersedia di [Docker VM Runtime](/id/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Untuk tim yang lebih memilih alur kerja infrastructure-as-code, pengaturan Terraform yang dipelihara komunitas menyediakan:

- Konfigurasi Terraform modular dengan pengelolaan remote state
- Provisioning otomatis melalui cloud-init
- Skrip deployment (bootstrap, deploy, backup/restore)
- Hardening keamanan (firewall, UFW, akses SSH-only)
- Konfigurasi tunnel SSH untuk akses gateway

**Repositori:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfigurasi Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Pendekatan ini melengkapi pengaturan Docker di atas dengan deployment yang dapat direproduksi, infrastruktur yang dikontrol versinya, dan pemulihan bencana otomatis.

> **Catatan:** Dipelihara oleh komunitas. Untuk masalah atau kontribusi, lihat tautan repositori di atas.

## Langkah berikutnya

- Siapkan saluran pesan: [Channels](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Pastikan OpenClaw tetap terbaru: [Updating](/id/install/updating)
