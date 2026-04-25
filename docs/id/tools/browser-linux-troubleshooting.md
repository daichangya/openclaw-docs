---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Memperbaiki masalah startup CDP Chrome/Brave/Edge/Chromium untuk kontrol browser OpenClaw di Linux
title: Pemecahan masalah browser
x-i18n:
    generated_at: "2026-04-25T13:57:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Masalah: "Failed to start Chrome CDP on port 18800"

Server kontrol browser OpenClaw gagal meluncurkan Chrome/Brave/Edge/Chromium dengan error:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Penyebab utama

Di Ubuntu (dan banyak distro Linux), instalasi Chromium default adalah **paket snap**. Pembatasan AppArmor milik snap mengganggu cara OpenClaw menjalankan dan memantau proses browser.

Perintah `apt install chromium` menginstal paket stub yang mengarahkan ke snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Ini BUKAN browser sungguhan - ini hanya wrapper.

Kegagalan peluncuran Linux umum lainnya:

- `The profile appears to be in use by another Chromium process` berarti Chrome
  menemukan file kunci `Singleton*` basi di direktori profil terkelola. OpenClaw
  menghapus kunci tersebut dan mencoba ulang sekali saat kunci mengarah ke proses yang mati atau
  berada di host lain.
- `Missing X server or $DISPLAY` berarti browser terlihat secara eksplisit
  diminta pada host tanpa sesi desktop. Secara default, profil terkelola lokal kini
  menggunakan fallback ke mode headless di Linux saat `DISPLAY` dan
  `WAYLAND_DISPLAY` sama-sama tidak diatur. Jika Anda mengatur `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false`, atau `browser.profiles.<name>.headless: false`,
  hapus override mode terlihat tersebut, atur `OPENCLAW_BROWSER_HEADLESS=1`, jalankan `Xvfb`,
  jalankan `openclaw browser start --headless` untuk peluncuran terkelola satu kali, atau jalankan
  OpenClaw dalam sesi desktop sungguhan.

### Solusi 1: Instal Google Chrome (Direkomendasikan)

Instal paket `.deb` resmi Google Chrome, yang tidak di-sandbox oleh snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # jika ada error dependensi
```

Lalu perbarui config OpenClaw Anda (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Solusi 2: Gunakan Snap Chromium dengan mode attach-only

Jika Anda harus menggunakan snap Chromium, konfigurasikan OpenClaw agar menempel ke browser yang dijalankan manual:

1. Perbarui config:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Mulai Chromium secara manual:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Secara opsional buat service user systemd untuk memulai Chrome otomatis:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Aktifkan dengan: `systemctl --user enable --now openclaw-browser.service`

### Memverifikasi browser berfungsi

Periksa status:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Uji penjelajahan:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referensi config

| Opsi                             | Deskripsi                                                            | Default                                                     |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Mengaktifkan kontrol browser                                         | `true`                                                      |
| `browser.executablePath`         | Path ke biner browser berbasis Chromium (Chrome/Brave/Edge/Chromium) | terdeteksi otomatis (mengutamakan browser default jika berbasis Chromium) |
| `browser.headless`               | Menjalankan tanpa GUI                                                | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Override per-proses untuk mode headless browser terkelola lokal      | tidak diatur                                                |
| `browser.noSandbox`              | Menambahkan flag `--no-sandbox` (diperlukan untuk beberapa setup Linux) | `false`                                                  |
| `browser.attachOnly`             | Jangan meluncurkan browser, hanya menempel ke yang sudah ada         | `false`                                                     |
| `browser.cdpPort`                | Port Chrome DevTools Protocol                                        | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Timeout penemuan Chrome terkelola lokal                              | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Timeout kesiapan CDP setelah peluncuran lokal terkelola              | `8000`                                                      |

Di Raspberry Pi, host VPS lama, atau penyimpanan lambat, tingkatkan
`browser.localLaunchTimeoutMs` saat Chrome memerlukan lebih banyak waktu untuk mengekspos endpoint HTTP CDP-nya.
Tingkatkan `browser.localCdpReadyTimeoutMs` saat peluncuran berhasil tetapi
`openclaw browser start` masih melaporkan `not reachable after start`. Nilainya
dibatasi maksimal 120000 ms.

### Masalah: "No Chrome tabs found for profile=\"user\""

Anda menggunakan profil `existing-session` / Chrome MCP. OpenClaw dapat melihat Chrome lokal,
tetapi tidak ada tab terbuka yang tersedia untuk ditempeli.

Opsi perbaikan:

1. **Gunakan browser terkelola:** `openclaw browser start --browser-profile openclaw`
   (atau atur `browser.defaultProfile: "openclaw"`).
2. **Gunakan Chrome MCP:** pastikan Chrome lokal berjalan dengan setidaknya satu tab terbuka, lalu coba lagi dengan `--browser-profile user`.

Catatan:

- `user` hanya untuk host. Untuk server Linux, container, atau host jarak jauh, gunakan profil CDP.
- `user` / profil `existing-session` lainnya mempertahankan batas Chrome MCP saat ini:
  tindakan berbasis ref, hook unggah satu file, tanpa override timeout dialog, tanpa
  `wait --load networkidle`, dan tanpa `responsebody`, ekspor PDF, intersepsi unduhan, atau tindakan batch.
- Profil `openclaw` lokal menetapkan `cdpPort`/`cdpUrl` secara otomatis; atur itu hanya untuk CDP jarak jauh.
- Profil CDP jarak jauh menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) untuk penemuan `/json/version`, atau WS(S) saat layanan browser Anda
  memberi URL socket DevTools langsung.

## Terkait

- [Browser](/id/tools/browser)
- [Login browser](/id/tools/browser-login)
- [Pemecahan masalah browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
