---
read_when:
    - Anda menggunakan `openclaw browser` dan menginginkan contoh untuk tugas umum
    - Anda ingin mengontrol browser yang berjalan di mesin lain melalui host node
    - Anda ingin menautkan ke Chrome lokal yang sudah login melalui Chrome MCP
summary: Referensi CLI untuk `openclaw browser` (siklus hidup, profil, tab, tindakan, state, dan debugging)
title: Browser
x-i18n:
    generated_at: "2026-04-25T13:42:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2157146e54c77fecafcc5e89dd65244bd7ebecc37f86b45921ccea025188a8
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Kelola permukaan kontrol browser OpenClaw dan jalankan tindakan browser (siklus hidup, profil, tab, snapshot, tangkapan layar, navigasi, input, emulasi state, dan debugging).

Terkait:

- Tool + API Browser: [Browser tool](/id/tools/browser)

## Flag umum

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (default dari konfigurasi).
- `--token <token>`: token Gateway (jika diperlukan).
- `--timeout <ms>`: timeout permintaan (ms).
- `--expect-final`: tunggu respons Gateway final.
- `--browser-profile <name>`: pilih profil browser (default dari konfigurasi).
- `--json`: output yang dapat dibaca mesin (jika didukung).

## Mulai cepat (lokal)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Agen dapat menjalankan pemeriksaan kesiapan yang sama dengan `browser({ action: "doctor" })`.

## Pemecahan masalah cepat

Jika `start` gagal dengan `not reachable after start`, selesaikan masalah kesiapan CDP terlebih dahulu. Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane browser sehat dan kegagalan biasanya disebabkan oleh kebijakan SSRF navigasi.

Urutan minimal:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Panduan terperinci: [Pemecahan masalah Browser](/id/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Siklus hidup

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Catatan:

- Untuk profil `attachOnly` dan CDP jarak jauh, `openclaw browser stop` menutup sesi kontrol aktif dan menghapus override emulasi sementara bahkan ketika OpenClaw tidak meluncurkan proses browser itu sendiri.
- Untuk profil lokal yang dikelola, `openclaw browser stop` menghentikan proses browser yang dihasilkan.
- `openclaw browser start --headless` hanya berlaku untuk permintaan start tersebut dan hanya ketika OpenClaw meluncurkan browser lokal yang dikelola. Ini tidak menulis ulang `browser.headless` atau konfigurasi profil, dan tidak berpengaruh untuk browser yang sudah berjalan.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil lokal yang dikelola berjalan dalam mode headless secara otomatis kecuali `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false`, atau `browser.profiles.<name>.headless=false` secara eksplisit meminta browser yang terlihat.

## Jika perintah tidak ada

Jika `openclaw browser` adalah perintah yang tidak dikenal, periksa `plugins.allow` di
`~/.openclaw/openclaw.json`.

Saat `plugins.allow` ada, plugin browser bawaan harus dicantumkan secara eksplisit:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` tidak mengembalikan subperintah CLI ketika allowlist plugin mengecualikan `browser`.

Terkait: [Browser tool](/id/tools/browser#missing-browser-command-or-tool)

## Profil

Profil adalah konfigurasi perutean browser bernama. Dalam praktiknya:

- `openclaw`: meluncurkan atau menautkan ke instance Chrome terkelola OpenClaw khusus (direktori data pengguna terisolasi).
- `user`: mengontrol sesi Chrome Anda yang sudah login melalui Chrome DevTools MCP.
- profil CDP kustom: menunjuk ke endpoint CDP lokal atau jarak jauh.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Gunakan profil tertentu:

```bash
openclaw browser --browser-profile work tabs
```

## Tab

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu `tabId` stabil seperti `t1`,
label opsional, dan `targetId` mentah. Agen harus meneruskan `suggestedTargetId`
kembali ke `focus`, `close`, snapshot, dan tindakan. Anda dapat
menetapkan label dengan `open --label`, `tab new --label`, atau `tab label`; label,
ID tab, ID target mentah, dan prefiks ID target unik semuanya diterima.

## Snapshot / tangkapan layar / tindakan

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Tangkapan layar:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Catatan:

- `--full-page` hanya untuk pengambilan halaman; tidak dapat digabungkan dengan `--ref`
  atau `--element`.
- Profil `existing-session` / `user` mendukung tangkapan layar halaman dan tangkapan layar `--ref`
  dari output snapshot, tetapi tidak mendukung tangkapan layar CSS `--element`.
- `--labels` menimpa ref snapshot saat ini pada tangkapan layar.
- `snapshot --urls` menambahkan tujuan tautan yang ditemukan ke snapshot AI agar
  agen dapat memilih target navigasi langsung alih-alih menebak hanya dari teks tautan.

Navigate/click/type (otomasi UI berbasis ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Pembantu file + dialog:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Profil Chrome yang dikelola menyimpan unduhan biasa yang dipicu klik ke direktori unduhan OpenClaw
(`/tmp/openclaw/downloads` secara default, atau root temp yang dikonfigurasi).
Gunakan `waitfordownload` atau `download` saat agen perlu menunggu file tertentu
dan mengembalikan jalurnya; penunggu eksplisit tersebut memiliki unduhan berikutnya.

## State dan penyimpanan

Viewport + emulasi:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookie + penyimpanan:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Debugging

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome yang sudah ada melalui MCP

Gunakan profil bawaan `user`, atau buat profil `existing-session` Anda sendiri:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Jalur ini hanya untuk host. Untuk Docker, server headless, Browserless, atau pengaturan jarak jauh lainnya, gunakan profil CDP.

Batas `existing-session` saat ini:

- tindakan berbasis snapshot menggunakan ref, bukan selector CSS
- `browser.actionTimeoutMs` mendukung permintaan `act` default ke 60000 ms saat
  pemanggil tidak memberikan `timeoutMs`; `timeoutMs` per panggilan tetap menang.
- `click` hanya klik kiri
- `type` tidak mendukung `slowly=true`
- `press` tidak mendukung `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, dan `evaluate` menolak
  override timeout per panggilan
- `select` hanya mendukung satu nilai
- `wait --load networkidle` tidak didukung
- upload file memerlukan `--ref` / `--input-ref`, tidak mendukung CSS
  `--element`, dan saat ini hanya mendukung satu file dalam satu waktu
- hook dialog tidak mendukung `--timeout`
- tangkapan layar mendukung pengambilan halaman dan `--ref`, tetapi tidak CSS `--element`
- `responsebody`, intersepsi unduhan, ekspor PDF, dan tindakan batch masih
  memerlukan browser terkelola atau profil CDP mentah

## Kontrol browser jarak jauh (proxy host node)

Jika Gateway berjalan di mesin yang berbeda dari browser, jalankan **host node** pada mesin yang memiliki Chrome/Brave/Edge/Chromium. Gateway akan mem-proxy tindakan browser ke node tersebut (tidak diperlukan server kontrol browser terpisah).

Gunakan `gateway.nodes.browser.mode` untuk mengontrol perutean otomatis dan `gateway.nodes.browser.node` untuk menyematkan node tertentu jika beberapa node terhubung.

Keamanan + penyiapan jarak jauh: [Browser tool](/id/tools/browser), [Akses jarak jauh](/id/gateway/remote), [Tailscale](/id/gateway/tailscale), [Security](/id/gateway/security)

## Terkait

- [Referensi CLI](/id/cli)
- [Browser](/id/tools/browser)
