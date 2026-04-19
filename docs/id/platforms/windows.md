---
read_when:
    - Menginstal OpenClaw di Windows
    - Memilih antara Windows native dan WSL2
    - Mencari status aplikasi pendamping Windows
summary: 'Dukungan Windows: jalur instalasi native dan WSL2, daemon, serta keterbatasan saat ini'
title: Windows
x-i18n:
    generated_at: "2026-04-19T09:06:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw mendukung **Windows native** dan **WSL2**. WSL2 adalah jalur yang lebih
stabil dan direkomendasikan untuk pengalaman penuh — CLI, Gateway, dan
tooling berjalan di dalam Linux dengan kompatibilitas penuh. Windows native berfungsi untuk
penggunaan CLI dan Gateway inti, dengan beberapa keterbatasan yang dicatat di bawah ini.

Aplikasi pendamping Windows native sedang direncanakan.

## WSL2 (direkomendasikan)

- [Memulai](/id/start/getting-started) (gunakan di dalam WSL)
- [Instalasi & pembaruan](/id/install/updating)
- Panduan resmi WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status Windows native

Alur CLI Windows native terus ditingkatkan, tetapi WSL2 masih menjadi jalur yang direkomendasikan.

Yang saat ini berfungsi dengan baik di Windows native:

- penginstal situs web melalui `install.ps1`
- penggunaan CLI lokal seperti `openclaw --version`, `openclaw doctor`, dan `openclaw plugins list --json`
- smoke test local-agent/provider tertanam seperti:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Keterbatasan saat ini:

- `openclaw onboard --non-interactive` masih mengharapkan gateway lokal yang dapat dijangkau kecuali Anda meneruskan `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` dan `openclaw gateway install` mencoba Windows Scheduled Tasks terlebih dahulu
- jika pembuatan Scheduled Task ditolak, OpenClaw akan beralih ke item login Startup-folder per pengguna dan segera memulai gateway
- jika `schtasks` sendiri macet atau berhenti merespons, OpenClaw sekarang segera membatalkan jalur tersebut dan beralih agar tidak hang selamanya
- Scheduled Tasks tetap lebih dipilih jika tersedia karena memberikan status supervisor yang lebih baik

Jika Anda hanya ingin CLI native, tanpa instalasi layanan gateway, gunakan salah satu dari ini:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Jika Anda memang ingin startup terkelola di Windows native:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Jika pembuatan Scheduled Task diblokir, mode layanan fallback tetap otomatis dimulai setelah login melalui folder Startup milik pengguna saat ini.

## Gateway

- [Runbook Gateway](/id/gateway)
- [Konfigurasi](/id/gateway/configuration)

## Instalasi layanan Gateway (CLI)

Di dalam WSL2:

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

Pilih **Layanan Gateway** saat diminta.

Perbaiki/migrasikan:

```
openclaw doctor
```

## Gateway auto-start sebelum login Windows

Untuk penyiapan headless, pastikan seluruh rantai boot berjalan bahkan ketika tidak ada yang login ke
Windows.

### 1) Biarkan layanan pengguna tetap berjalan tanpa login

Di dalam WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Instal layanan pengguna Gateway OpenClaw

Di dalam WSL:

```bash
openclaw gateway install
```

### 3) Mulai WSL secara otomatis saat boot Windows

Di PowerShell sebagai Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Ganti `Ubuntu` dengan nama distro Anda dari:

```powershell
wsl --list --verbose
```

### Verifikasi rantai startup

Setelah reboot (sebelum masuk ke Windows), periksa dari WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Lanjutan: mengekspos layanan WSL melalui LAN (portproxy)

WSL memiliki jaringan virtualnya sendiri. Jika mesin lain perlu menjangkau layanan
yang berjalan **di dalam WSL** (SSH, server TTS lokal, atau Gateway), Anda harus
meneruskan port Windows ke IP WSL saat ini. IP WSL berubah setelah restart,
jadi Anda mungkin perlu menyegarkan aturan penerusan.

Contoh (PowerShell **sebagai Administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Izinkan port tersebut melewati Windows Firewall (sekali saja):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Segarkan portproxy setelah WSL dimulai ulang:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Catatan:

- SSH dari mesin lain menargetkan **IP host Windows** (contoh: `ssh user@windows-host -p 2222`).
- Node jarak jauh harus mengarah ke URL Gateway yang **dapat dijangkau** (bukan `127.0.0.1`); gunakan
  `openclaw status --all` untuk mengonfirmasi.
- Gunakan `listenaddress=0.0.0.0` untuk akses LAN; `127.0.0.1` membuatnya tetap lokal saja.
- Jika Anda ingin ini otomatis, daftarkan Scheduled Task untuk menjalankan langkah
  penyegaran saat login.

## Instalasi WSL2 langkah demi langkah

### 1) Instal WSL2 + Ubuntu

Buka PowerShell (Admin):

```powershell
wsl --install
# Atau pilih distro secara eksplisit:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Reboot jika Windows memintanya.

### 2) Aktifkan systemd (diperlukan untuk instalasi gateway)

Di terminal WSL Anda:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Lalu dari PowerShell:

```powershell
wsl --shutdown
```

Buka kembali Ubuntu, lalu verifikasi:

```bash
systemctl --user status
```

### 3) Instal OpenClaw (di dalam WSL)

Untuk penyiapan pertama kali normal di dalam WSL, ikuti alur Memulai Linux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Jika Anda mengembangkan dari source alih-alih melakukan onboarding pertama kali, gunakan
alur pengembangan source dari [Penyiapan](/id/start/setup):

```bash
pnpm install
# Hanya saat pertama kali dijalankan (atau setelah mereset konfigurasi/ruang kerja OpenClaw lokal)
pnpm openclaw setup
pnpm gateway:watch
```

Panduan lengkap: [Memulai](/id/start/getting-started)

## Aplikasi pendamping Windows

Kami belum memiliki aplikasi pendamping Windows. Kontribusi diterima jika Anda ingin
mewujudkannya.
