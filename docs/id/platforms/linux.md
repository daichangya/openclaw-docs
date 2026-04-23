---
read_when:
    - Mencari status aplikasi pendamping Linux
    - Merencanakan cakupan platform atau kontribusi
    - Men-debug pembunuhan OOM Linux atau exit 137 pada VPS atau container
summary: Dukungan Linux + status aplikasi pendamping
title: Aplikasi Linux
x-i18n:
    generated_at: "2026-04-23T09:23:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# Aplikasi Linux

Gateway didukung sepenuhnya di Linux. **Node adalah runtime yang direkomendasikan**.
Bun tidak direkomendasikan untuk Gateway (bug WhatsApp/Telegram).

Aplikasi pendamping Linux native sedang direncanakan. Kontribusi diterima jika Anda ingin membantu membangunnya.

## Jalur cepat untuk pemula (VPS)

1. Instal Node 24 (disarankan; Node 22 LTS, saat ini `22.14+`, masih berfungsi untuk kompatibilitas)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dari laptop Anda: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Buka `http://127.0.0.1:18789/` dan autentikasi dengan shared secret yang telah dikonfigurasi (token secara default; password jika Anda menetapkan `gateway.auth.mode: "password"`)

Panduan lengkap server Linux: [Linux Server](/id/vps). Contoh VPS langkah demi langkah: [exe.dev](/id/install/exe-dev)

## Instal

- [Getting Started](/id/start/getting-started)
- [Install & updates](/id/install/updating)
- Alur opsional: [Bun (experimental)](/id/install/bun), [Nix](/id/install/nix), [Docker](/id/install/docker)

## Gateway

- [Panduan operasional Gateway](/id/gateway)
- [Konfigurasi](/id/gateway/configuration)

## Instal layanan Gateway (CLI)

Gunakan salah satu dari ini:

```
openclaw onboard --install-daemon
```

Atau:

```
openclaw gateway install
```

Atau:

```
openclaw configure
```

Pilih **Gateway service** saat diminta.

Perbaiki/migrasikan:

```
openclaw doctor
```

## Kontrol sistem (unit pengguna systemd)

OpenClaw menginstal layanan **user** systemd secara default. Gunakan layanan **system**
untuk server bersama atau server yang selalu aktif. `openclaw gateway install` dan
`openclaw onboard --install-daemon` sudah merender unit kanonis saat ini
untuk Anda; tulis sendiri hanya jika Anda memerlukan penyiapan system/service-manager
kustom. Panduan layanan lengkap ada di [panduan operasional Gateway](/id/gateway).

Penyiapan minimal:

Buat `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Aktifkan:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Tekanan memori dan pembunuhan OOM

Di Linux, kernel memilih korban OOM saat host, VM, atau cgroup container
kehabisan memori. Gateway bisa menjadi korban yang buruk karena memiliki sesi
berumur panjang dan koneksi channel. Karena itu, OpenClaw mengatur agar child
process sementara lebih mungkin dibunuh daripada Gateway bila memungkinkan.

Untuk spawn child Linux yang memenuhi syarat, OpenClaw memulai child melalui
wrapper `/bin/sh` singkat yang menaikkan `oom_score_adj` milik child itu sendiri menjadi `1000`, lalu
menjalankan `exec` ke command sebenarnya. Ini adalah operasi tanpa hak istimewa karena child
hanya meningkatkan kemungkinan dirinya sendiri dibunuh oleh OOM.

Permukaan child process yang dicakup meliputi:

- child command yang dikelola supervisor,
- child shell PTY,
- child server MCP stdio,
- proses browser/Chrome yang diluncurkan OpenClaw.

Wrapper ini khusus Linux dan dilewati saat `/bin/sh` tidak tersedia. Wrapper ini
juga dilewati jika env child menetapkan `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, atau `off`.

Untuk memverifikasi child process:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Nilai yang diharapkan untuk child yang dicakup adalah `1000`. Proses Gateway harus
mempertahankan skor normalnya, biasanya `0`.

Ini tidak menggantikan tuning memori normal. Jika VPS atau container berulang kali
membunuh child, tingkatkan batas memori, kurangi konkurensi, atau tambahkan kontrol resource
yang lebih kuat seperti systemd `MemoryMax=` atau batas memori tingkat container.
