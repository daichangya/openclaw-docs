---
read_when:
    - Menambahkan otomatisasi browser yang dikendalikan agen
    - Men-debug mengapa openclaw mengganggu Chrome Anda sendiri
    - Mengimplementasikan pengaturan + siklus hidup browser di aplikasi macOS
summary: Layanan kontrol browser terintegrasi + perintah aksi
title: Browser (dikelola OpenClaw)
x-i18n:
    generated_at: "2026-04-25T13:57:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan agen.
Profil ini terisolasi dari browser pribadi Anda dan dikelola melalui layanan kontrol lokal kecil di dalam Gateway (hanya loopback).

Penjelasan untuk pemula:

- Anggap ini sebagai **browser terpisah khusus agen**.
- Profil `openclaw` **tidak** menyentuh profil browser pribadi Anda.
- Agen dapat **membuka tab, membaca halaman, mengklik, dan mengetik** di jalur yang aman.
- Profil bawaan `user` terhubung ke sesi Chrome Anda yang benar-benar sedang login melalui Chrome MCP.

## Yang Anda dapatkan

- Profil browser terpisah bernama **openclaw** (default dengan aksen oranye).
- Kontrol tab yang deterministik (daftar/buka/fokus/tutup).
- Aksi agen (klik/ketik/seret/pilih), snapshot, screenshot, PDF.
- Skill `browser-automation` bawaan yang mengajarkan agen loop pemulihan snapshot,
  stable-tab, stale-ref, dan manual-blocker saat plugin browser diaktifkan.
- Dukungan multi-profil opsional (`openclaw`, `work`, `remote`, ...).

Browser ini **bukan** browser utama harian Anda. Ini adalah permukaan yang aman dan terisolasi untuk otomatisasi dan verifikasi oleh agen.

## Quick start

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jika Anda mendapatkan “Browser disabled”, aktifkan di config (lihat di bawah) dan mulai ulang Gateway.

Jika `openclaw browser` benar-benar tidak ada, atau agen mengatakan tool browser tidak tersedia, langsung ke [Missing browser command or tool](/id/tools/browser#missing-browser-command-or-tool).

## Kontrol Plugin

Tool `browser` default adalah Plugin bawaan. Nonaktifkan untuk menggantinya dengan plugin lain yang mendaftarkan nama tool `browser` yang sama:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Default memerlukan `plugins.entries.browser.enabled` **dan** `browser.enabled=true`. Menonaktifkan hanya plugin akan menghapus CLI `openclaw browser`, metode gateway `browser.request`, tool agen, dan layanan kontrol sebagai satu kesatuan; config `browser.*` Anda tetap utuh untuk pengganti.

Perubahan config browser memerlukan restart Gateway agar plugin dapat mendaftarkan ulang layanannya.

## Panduan agen

Plugin browser menyediakan dua tingkat panduan agen:

- Deskripsi tool `browser` membawa kontrak ringkas yang selalu aktif: pilih
  profil yang tepat, pertahankan ref pada tab yang sama, gunakan `tabId`/label
  untuk penargetan tab, dan muat skill browser untuk pekerjaan multi-langkah.
- Skill `browser-automation` bawaan membawa loop operasional yang lebih panjang:
  periksa status/tab terlebih dahulu, beri label pada tab tugas, snapshot sebelum
  bertindak, lakukan snapshot ulang setelah perubahan UI, pulihkan stale ref
  sekali, dan laporkan penghalang login/2FA/captcha atau kamera/mikrofon sebagai
  tindakan manual alih-alih menebak.

Skills bawaan plugin dicantumkan di skill yang tersedia bagi agen saat
plugin diaktifkan. Instruksi skill lengkap dimuat sesuai kebutuhan, sehingga giliran rutin tidak membayar biaya token penuh.

## Perintah atau tool browser tidak ada

Jika `openclaw browser` tidak dikenali setelah upgrade, `browser.request` tidak ada, atau agen melaporkan tool browser tidak tersedia, penyebab yang umum adalah daftar `plugins.allow` yang tidak menyertakan `browser`. Tambahkan:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true`, dan `tools.alsoAllow: ["browser"]` tidak menggantikan keanggotaan allowlist — allowlist mengatur pemuatan plugin, dan kebijakan tool baru berjalan setelah pemuatan. Menghapus `plugins.allow` sepenuhnya juga memulihkan default.

## Profil: `openclaw` vs `user`

- `openclaw`: browser terkelola dan terisolasi (tidak memerlukan ekstensi).
- `user`: profil attach Chrome MCP bawaan untuk sesi **Chrome Anda yang benar-benar sedang login**.

Untuk pemanggilan tool browser oleh agen:

- Default: gunakan browser `openclaw` yang terisolasi.
- Pilih `profile="user"` saat sesi login yang sudah ada penting dan pengguna
  berada di depan komputer untuk mengklik/menyetujui prompt attach apa pun.
- `profile` adalah override eksplisit saat Anda menginginkan mode browser tertentu.

Setel `browser.defaultProfile: "openclaw"` jika Anda ingin mode terkelola sebagai default.

## Konfigurasi

Pengaturan browser berada di `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // ikut serta hanya untuk akses jaringan privat tepercaya
      // allowPrivateNetwork: true, // alias lama
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override lama untuk profil tunggal
    remoteCdpTimeoutMs: 1500, // timeout HTTP CDP jarak jauh (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout handshake WebSocket CDP jarak jauh (ms)
    localLaunchTimeoutMs: 15000, // timeout penemuan Chrome terkelola lokal (ms)
    localCdpReadyTimeoutMs: 8000, // timeout kesiapan CDP lokal pasca-peluncuran (ms)
    actionTimeoutMs: 60000, // timeout aksi browser default (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // setel 0 untuk menonaktifkan pembersihan idle
      maxTabsPerSession: 8, // setel 0 untuk menonaktifkan batas per sesi
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Port dan keterjangkauan">

- Layanan kontrol bind ke loopback pada port yang diturunkan dari `gateway.port` (default `18791` = gateway + 2). Override `gateway.port` atau `OPENCLAW_GATEWAY_PORT` akan menggeser port turunan dalam keluarga yang sama.
- Profil `openclaw` lokal menetapkan `cdpPort`/`cdpUrl` secara otomatis; setel itu hanya untuk CDP jarak jauh. `cdpUrl` default ke port CDP lokal terkelola saat tidak disetel.
- `remoteCdpTimeoutMs` berlaku untuk pemeriksaan keterjangkauan HTTP CDP jarak jauh (non-loopback); `remoteCdpHandshakeTimeoutMs` berlaku untuk handshake WebSocket CDP jarak jauh.
- `localLaunchTimeoutMs` adalah anggaran waktu bagi proses Chrome terkelola yang diluncurkan secara lokal untuk mengekspos endpoint HTTP CDP-nya. `localCdpReadyTimeoutMs` adalah anggaran lanjutan untuk kesiapan websocket CDP setelah proses ditemukan.
  Naikkan nilai ini pada Raspberry Pi, VPS kelas bawah, atau perangkat keras lama saat Chromium
  mulai dengan lambat. Nilai dibatasi hingga 120000 ms.
- `actionTimeoutMs` adalah anggaran default untuk permintaan browser `act` saat pemanggil tidak memberikan `timeoutMs`. Transport klien menambahkan sedikit kelonggaran agar penantian panjang dapat selesai alih-alih timeout di batas HTTP.
- `tabCleanup` adalah pembersihan best-effort untuk tab yang dibuka oleh sesi browser agen utama. Pembersihan siklus hidup subagen, Cron, dan ACP tetap menutup tab terlacak eksplisit mereka saat sesi berakhir; sesi utama mempertahankan tab aktif agar dapat digunakan ulang, lalu menutup tab terlacak yang idle atau berlebih di latar belakang.

</Accordion>

<Accordion title="Kebijakan SSRF">

- Navigasi browser dan open-tab dilindungi SSRF sebelum navigasi dan diperiksa ulang secara best-effort pada URL `http(s)` akhir setelahnya.
- Dalam mode SSRF ketat, penemuan endpoint CDP jarak jauh dan probe `/json/version` (`cdpUrl`) juga diperiksa.
- Variabel environment `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, dan `NO_PROXY` milik Gateway/penyedia tidak otomatis mem-proxy browser yang dikelola OpenClaw. Chrome terkelola diluncurkan langsung secara default sehingga pengaturan proxy penyedia tidak melemahkan pemeriksaan SSRF browser.
- Untuk mem-proxy browser terkelola itu sendiri, berikan flag proxy Chrome eksplisit melalui `browser.extraArgs`, seperti `--proxy-server=...` atau `--proxy-pac-url=...`. Mode SSRF ketat memblokir perutean proxy browser eksplisit kecuali akses browser jaringan privat memang sengaja diaktifkan.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` nonaktif secara default; aktifkan hanya saat akses browser jaringan privat memang dipercaya.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.

</Accordion>

<Accordion title="Perilaku profil">

- `attachOnly: true` berarti jangan pernah meluncurkan browser lokal; hanya attach jika browser sudah berjalan.
- `headless` dapat disetel secara global atau per profil terkelola lokal. Nilai per profil menimpa `browser.headless`, sehingga satu profil yang diluncurkan secara lokal dapat tetap headless sementara profil lain tetap terlihat.
- `POST /start?headless=true` dan `openclaw browser start --headless` meminta peluncuran headless sekali pakai untuk profil terkelola lokal tanpa menulis ulang `browser.headless` atau config profil. Profil existing-session, attach-only, dan CDP jarak jauh menolak override ini karena OpenClaw tidak meluncurkan proses browser tersebut.
- Pada host Linux tanpa `DISPLAY` atau `WAYLAND_DISPLAY`, profil terkelola lokal otomatis default ke headless saat environment maupun config profil/global tidak secara eksplisit memilih mode headed. `openclaw browser status --json`
  melaporkan `headlessSource` sebagai `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, atau `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` memaksa peluncuran terkelola lokal menjadi headless untuk proses saat ini. `OPENCLAW_BROWSER_HEADLESS=0` memaksa mode headed untuk start biasa dan mengembalikan error yang dapat ditindaklanjuti pada host Linux tanpa server display;
  permintaan eksplisit `start --headless` tetap menang untuk peluncuran tunggal itu.
- `executablePath` dapat disetel secara global atau per profil terkelola lokal. Nilai per profil menimpa `browser.executablePath`, sehingga profil terkelola yang berbeda dapat meluncurkan browser berbasis Chromium yang berbeda.
- `color` (tingkat atas dan per profil) memberi warna pada UI browser sehingga Anda dapat melihat profil mana yang aktif.
- Profil default adalah `openclaw` (mandiri terkelola). Gunakan `defaultProfile: "user"` untuk memilih browser pengguna yang sedang login.
- Urutan deteksi otomatis: browser default sistem jika berbasis Chromium; jika tidak Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP alih-alih CDP mentah. Jangan setel `cdpUrl` untuk driver tersebut.
- Setel `browser.profiles.<name>.userDataDir` saat profil existing-session perlu attach ke profil pengguna Chromium non-default (Brave, Edge, dll.).

</Accordion>

</AccordionGroup>

## Gunakan Brave (atau browser berbasis Chromium lain)

Jika browser **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll),
OpenClaw menggunakannya secara otomatis. Setel `browser.executablePath` untuk mengoverride
deteksi otomatis. `~` diperluas ke direktori home OS Anda:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Atau setel di config, per platform:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` per profil hanya memengaruhi profil terkelola lokal yang diluncurkan oleh OpenClaw. Profil `existing-session` justru terhubung ke browser yang sudah berjalan, dan profil CDP jarak jauh menggunakan browser di balik `cdpUrl`.

## Kontrol lokal vs jarak jauh

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan browser lokal.
- **Kontrol jarak jauh (host node):** jalankan host node di mesin yang memiliki browser; Gateway mem-proxy aksi browser ke host tersebut.
- **CDP jarak jauh:** setel `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  terhubung ke browser berbasis Chromium jarak jauh. Dalam kasus ini, OpenClaw tidak akan meluncurkan browser lokal.
- `headless` hanya memengaruhi profil terkelola lokal yang diluncurkan oleh OpenClaw. Ini tidak me-restart atau mengubah browser `existing-session` atau CDP jarak jauh.
- `executablePath` mengikuti aturan profil terkelola lokal yang sama. Mengubahnya pada profil terkelola lokal yang sedang berjalan akan menandai profil tersebut untuk restart/rekonsiliasi sehingga peluncuran berikutnya menggunakan biner baru.

Perilaku penghentian berbeda menurut mode profil:

- profil terkelola lokal: `openclaw browser stop` menghentikan proses browser yang
  diluncurkan oleh OpenClaw
- profil attach-only dan CDP jarak jauh: `openclaw browser stop` menutup sesi
  kontrol aktif dan melepaskan override emulasi Playwright/CDP (viewport,
  skema warna, locale, zona waktu, mode offline, dan status serupa), meskipun
  tidak ada proses browser yang diluncurkan oleh OpenClaw

URL CDP jarak jauh dapat menyertakan auth:

- Token query (misalnya, `https://provider.example?token=<token>`)
- HTTP Basic auth (misalnya, `https://user:pass@provider.example`)

OpenClaw mempertahankan auth saat memanggil endpoint `/json/*` dan saat terhubung
ke WebSocket CDP. Pilih variabel environment atau secrets manager untuk
token alih-alih meng-commit-nya ke file config.

## Proksi browser node (default tanpa konfigurasi)

Jika Anda menjalankan **host node** di mesin yang memiliki browser, OpenClaw dapat
merutekan otomatis pemanggilan tool browser ke node tersebut tanpa config browser tambahan.
Ini adalah jalur default untuk gateway jarak jauh.

Catatan:

- Host node mengekspos server kontrol browser lokalnya melalui **perintah proxy**.
- Profil berasal dari config `browser.profiles` milik node itu sendiri (sama seperti lokal).
- `nodeHost.browserProxy.allowProfiles` bersifat opsional. Biarkan kosong untuk perilaku lama/default: semua profil yang dikonfigurasi tetap dapat dijangkau melalui proxy, termasuk rute pembuatan/penghapusan profil.
- Jika Anda menyetel `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas least-privilege: hanya profil dalam allowlist yang dapat ditargetkan, dan rute pembuatan/penghapusan profil persisten diblokir pada permukaan proxy.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Pada node: `nodeHost.browserProxy.enabled=false`
  - Pada gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP jarak jauh terhosting)

[Browserless](https://browserless.io) adalah layanan Chromium terhosting yang mengekspos
URL koneksi CDP melalui HTTPS dan WebSocket. OpenClaw dapat menggunakan keduanya, tetapi
untuk profil browser jarak jauh, opsi paling sederhana adalah URL WebSocket langsung
dari dokumen koneksi Browserless.

Contoh:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Catatan:

- Ganti `<BROWSERLESS_API_KEY>` dengan token Browserless Anda yang sebenarnya.
- Pilih endpoint region yang sesuai dengan akun Browserless Anda (lihat dokumen mereka).
- Jika Browserless memberi Anda URL dasar HTTPS, Anda dapat mengubahnya menjadi
  `wss://` untuk koneksi CDP langsung atau tetap menggunakan URL HTTPS dan biarkan OpenClaw
  menemukan `/json/version`.

## Penyedia CDP WebSocket langsung

Beberapa layanan browser terhosting mengekspos endpoint **WebSocket langsung** alih-alih
discovery CDP berbasis HTTP standar (`/json/version`). OpenClaw menerima tiga bentuk
URL CDP dan otomatis memilih strategi koneksi yang tepat:

- **Discovery HTTP(S)** — `http://host[:port]` atau `https://host[:port]`.
  OpenClaw memanggil `/json/version` untuk menemukan URL debugger WebSocket, lalu
  terhubung. Tidak ada fallback WebSocket.
- **Endpoint WebSocket langsung** — `ws://host[:port]/devtools/<kind>/<id>` atau
  `wss://...` dengan path `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw terhubung langsung melalui handshake WebSocket dan melewati
  `/json/version` sepenuhnya.
- **Root WebSocket polos** — `ws://host[:port]` atau `wss://host[:port]` tanpa
  path `/devtools/...` (misalnya [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw mencoba discovery HTTP
  `/json/version` terlebih dahulu (menormalkan skema menjadi `http`/`https`);
  jika discovery mengembalikan `webSocketDebuggerUrl` maka URL itu digunakan, jika tidak OpenClaw
  fallback ke handshake WebSocket langsung pada root polos. Ini memungkinkan
  `ws://` polos yang diarahkan ke Chrome lokal tetap terhubung, karena Chrome hanya
  menerima upgrade WebSocket pada path per-target spesifik dari
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) adalah platform cloud untuk menjalankan
browser headless dengan pemecahan CAPTCHA bawaan, mode stealth, dan proxy residensial.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Catatan:

- [Daftar](https://www.browserbase.com/sign-up) dan salin **API Key** Anda
  dari [dashboard Overview](https://www.browserbase.com/overview).
- Ganti `<BROWSERBASE_API_KEY>` dengan API key Browserbase Anda yang sebenarnya.
- Browserbase otomatis membuat sesi browser saat WebSocket terhubung, sehingga
  tidak diperlukan langkah pembuatan sesi manual.
- Tingkat gratis mengizinkan satu sesi konkuren dan satu jam browser per bulan.
  Lihat [pricing](https://www.browserbase.com/pricing) untuk batas paket berbayar.
- Lihat [dokumen Browserbase](https://docs.browserbase.com) untuk referensi API
  lengkap, panduan SDK, dan contoh integrasi.

## Keamanan

Gagasan utama:

- Kontrol browser hanya loopback; akses mengalir melalui auth Gateway atau pairing node.
- API HTTP browser loopback mandiri menggunakan **hanya auth shared-secret**:
  auth bearer token gateway, `x-openclaw-password`, atau HTTP Basic auth dengan
  password gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"` **tidak**
  mengautentikasi API browser loopback mandiri ini.
- Jika kontrol browser diaktifkan dan tidak ada auth shared-secret yang dikonfigurasi, OpenClaw
  otomatis membuat `gateway.auth.token` saat startup dan menyimpannya ke config.
- OpenClaw **tidak** otomatis membuat token tersebut saat `gateway.auth.mode` sudah
  `password`, `none`, atau `trusted-proxy`.
- Simpan Gateway dan semua host node di jaringan privat (Tailscale); hindari paparan publik.
- Perlakukan URL/token CDP jarak jauh sebagai rahasia; pilih variabel env atau secrets manager.

Tips CDP jarak jauh:

- Pilih endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek bila memungkinkan.
- Hindari menanamkan token berumur panjang langsung di file config.

## Profil (multi-browser)

OpenClaw mendukung banyak profil bernama (config routing). Profil dapat berupa:

- **dikelola OpenClaw**: instance browser berbasis Chromium khusus dengan direktori data pengguna + port CDP-nya sendiri
- **jarak jauh**: URL CDP eksplisit (browser berbasis Chromium yang berjalan di tempat lain)
- **sesi yang sudah ada**: profil Chrome Anda yang sudah ada melalui koneksi otomatis Chrome DevTools MCP

Default:

- Profil `openclaw` dibuat otomatis jika tidak ada.
- Profil `user` sudah bawaan untuk attach existing-session Chrome MCP.
- Profil existing-session bersifat opt-in selain `user`; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800–18899** secara default.
- Menghapus profil memindahkan direktori data lokalnya ke Trash.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Existing session melalui Chrome DevTools MCP

OpenClaw juga dapat terhubung ke profil browser berbasis Chromium yang sedang berjalan melalui
server Chrome DevTools MCP resmi. Ini menggunakan ulang tab dan status login
yang sudah terbuka di profil browser tersebut.

Referensi latar belakang dan penyiapan resmi:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan:

- `user`

Opsional: buat profil existing-session kustom Anda sendiri jika Anda menginginkan
nama, warna, atau direktori data browser yang berbeda.

Perilaku default:

- Profil `user` bawaan menggunakan koneksi otomatis Chrome MCP, yang menargetkan
  profil Google Chrome lokal default.

Gunakan `userDataDir` untuk Brave, Edge, Chromium, atau profil Chrome non-default:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Lalu di browser yang sesuai:

1. Buka halaman inspect browser tersebut untuk remote debugging.
2. Aktifkan remote debugging.
3. Biarkan browser tetap berjalan dan setujui prompt koneksi saat OpenClaw melakukan attach.

Halaman inspect yang umum:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Uji smoke attach langsung:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Tanda sukses:

- `status` menampilkan `driver: existing-session`
- `status` menampilkan `transport: chrome-mcp`
- `status` menampilkan `running: true`
- `tabs` mencantumkan tab browser Anda yang sudah terbuka
- `snapshot` mengembalikan ref dari tab live yang dipilih

Yang perlu diperiksa jika attach tidak berhasil:

- browser berbasis Chromium target berada pada versi `144+`
- remote debugging diaktifkan pada halaman inspect browser tersebut
- browser menampilkan dan Anda menerima prompt persetujuan attach
- `openclaw doctor` memigrasikan config browser lama berbasis ekstensi dan memeriksa bahwa
  Chrome terpasang secara lokal untuk profil koneksi otomatis default, tetapi tidak dapat
  mengaktifkan remote debugging di sisi browser untuk Anda

Penggunaan agen:

- Gunakan `profile="user"` saat Anda membutuhkan status browser pengguna yang sedang login.
- Jika Anda menggunakan profil existing-session kustom, berikan nama profil eksplisit tersebut.
- Pilih mode ini hanya saat pengguna berada di depan komputer untuk menyetujui prompt attach.
- Gateway atau host node dapat menjalankan `npx chrome-devtools-mcp@latest --autoConnect`

Catatan:

- Jalur ini lebih berisiko daripada profil `openclaw` yang terisolasi karena dapat
  bertindak di dalam sesi browser Anda yang sedang login.
- OpenClaw tidak meluncurkan browser untuk driver ini; OpenClaw hanya melakukan attach.
- OpenClaw menggunakan alur resmi Chrome DevTools MCP `--autoConnect` di sini. Jika
  `userDataDir` disetel, nilainya diteruskan untuk menargetkan direktori data pengguna tersebut.
- Existing-session dapat melakukan attach pada host yang dipilih atau melalui
  node browser yang terhubung. Jika Chrome berada di tempat lain dan tidak ada node browser yang terhubung, gunakan
  CDP jarak jauh atau host node sebagai gantinya.

### Peluncuran Chrome MCP kustom

Override server Chrome DevTools MCP yang dijalankan per profil saat alur default
`npx chrome-devtools-mcp@latest` bukan yang Anda inginkan (host offline,
versi yang dipin, biner yang divendor):

| Field        | Fungsinya                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Executable yang dijalankan sebagai pengganti `npx`. Diresolusikan apa adanya; path absolut dihormati.                    |
| `mcpArgs`    | Array argumen yang diteruskan apa adanya ke `mcpCommand`. Menggantikan argumen default `chrome-devtools-mcp@latest --autoConnect`. |

Saat `cdpUrl` disetel pada profil existing-session, OpenClaw melewati
`--autoConnect` dan otomatis meneruskan endpoint ke Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint discovery HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP langsung).

Flag endpoint dan `userDataDir` tidak dapat digabungkan: saat `cdpUrl` disetel,
`userDataDir` diabaikan untuk peluncuran Chrome MCP, karena Chrome MCP terhubung ke
browser yang sedang berjalan di balik endpoint alih-alih membuka direktori
profil.

<Accordion title="Keterbatasan fitur existing-session">

Dibandingkan dengan profil `openclaw` yang dikelola, driver existing-session lebih terbatas:

- **Screenshot** — tangkapan halaman dan tangkapan elemen `--ref` berfungsi; selector CSS `--element` tidak. `--full-page` tidak dapat digabungkan dengan `--ref` atau `--element`. Playwright tidak diperlukan untuk screenshot halaman atau elemen berbasis ref.
- **Aksi** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan ref snapshot (tanpa selector CSS). `click-coords` mengklik koordinat viewport yang terlihat dan tidak memerlukan ref snapshot. `click` hanya tombol kiri. `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`. `press` tidak mendukung `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, dan `evaluate` tidak mendukung timeout per pemanggilan. `select` menerima satu nilai.
- **Wait / upload / dialog** — `wait --url` mendukung pola exact, substring, dan glob; `wait --load networkidle` tidak didukung. Hook upload memerlukan `ref` atau `inputRef`, satu file setiap kali, tanpa CSS `element`. Hook dialog tidak mendukung override timeout.
- **Fitur khusus terkelola** — aksi batch, ekspor PDF, intersepsi unduhan, dan `responsebody` tetap memerlukan jalur browser terkelola.

</Accordion>

## Jaminan isolasi

- **Direktori data pengguna khusus**: tidak pernah menyentuh profil browser pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah benturan dengan alur kerja pengembangan.
- **Kontrol tab yang deterministik**: `tabs` mengembalikan `suggestedTargetId` terlebih dahulu, lalu
  handle `tabId` stabil seperti `t1`, label opsional, dan `targetId` mentah.
  Agen seharusnya menggunakan kembali `suggestedTargetId`; id mentah tetap tersedia untuk
  debugging dan kompatibilitas.

## Pemilihan browser

Saat diluncurkan secara lokal, OpenClaw memilih yang pertama tersedia:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Anda dapat mengoverride dengan `browser.executablePath`.

Platform:

- macOS: memeriksa `/Applications` dan `~/Applications`.
- Linux: memeriksa lokasi umum Chrome/Brave/Edge/Chromium di bawah `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, dan
  `/usr/lib/chromium-browser`.
- Windows: memeriksa lokasi instalasi umum.

## API kontrol (opsional)

Untuk scripting dan debugging, Gateway mengekspos **API kontrol HTTP
khusus loopback** kecil ditambah CLI `openclaw browser` yang sesuai (snapshot, ref, wait
power-up, output JSON, alur kerja debug). Lihat
[Browser control API](/id/tools/browser-control) untuk referensi lengkapnya.

## Pemecahan masalah

Untuk masalah khusus Linux (terutama snap Chromium), lihat
[Browser troubleshooting](/id/tools/browser-linux-troubleshooting).

Untuk penyiapan host-terpisah WSL2 Gateway + Windows Chrome, lihat
[WSL2 + Windows + remote Chrome CDP troubleshooting](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Kegagalan startup CDP vs blok SSRF navigasi

Ini adalah kelas kegagalan yang berbeda dan mengarah ke jalur kode yang berbeda.

- **Kegagalan startup atau kesiapan CDP** berarti OpenClaw tidak dapat mengonfirmasi bahwa control plane browser sehat.
- **Blok SSRF navigasi** berarti control plane browser sehat, tetapi target navigasi halaman ditolak oleh kebijakan.

Contoh umum:

- Kegagalan startup atau kesiapan CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blok SSRF navigasi:
  - alur `open`, `navigate`, snapshot, atau pembukaan tab gagal dengan error kebijakan browser/jaringan sementara `start` dan `tabs` tetap berfungsi

Gunakan urutan minimal ini untuk memisahkan keduanya:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cara membaca hasilnya:

- Jika `start` gagal dengan `not reachable after start`, pecahkan masalah kesiapan CDP terlebih dahulu.
- Jika `start` berhasil tetapi `tabs` gagal, control plane masih tidak sehat. Perlakukan ini sebagai masalah keterjangkauan CDP, bukan masalah navigasi halaman.
- Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane browser aktif dan kegagalannya ada pada kebijakan navigasi atau halaman target.
- Jika `start`, `tabs`, dan `open` semuanya berhasil, jalur kontrol browser terkelola dasar dalam keadaan sehat.

Detail perilaku penting:

- Config browser secara default menggunakan objek kebijakan SSRF fail-closed bahkan saat Anda tidak mengonfigurasi `browser.ssrfPolicy`.
- Untuk profil terkelola loopback lokal `openclaw`, pemeriksaan kesehatan CDP sengaja melewati penegakan keterjangkauan SSRF browser untuk control plane lokal OpenClaw sendiri.
- Perlindungan navigasi bersifat terpisah. Hasil `start` atau `tabs` yang berhasil tidak berarti target `open` atau `navigate` berikutnya diizinkan.

Panduan keamanan:

- **Jangan** melonggarkan kebijakan SSRF browser secara default.
- Pilih pengecualian host yang sempit seperti `hostnameAllowlist` atau `allowedHostnames` daripada akses jaringan privat yang luas.
- Gunakan `dangerouslyAllowPrivateNetwork: true` hanya dalam lingkungan yang memang dipercaya secara sengaja saat akses browser jaringan privat diperlukan dan telah ditinjau.

## Tool agen + cara kerja kontrol

Agen mendapatkan **satu tool** untuk otomatisasi browser:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Pemetaan cara kerjanya:

- `browser snapshot` mengembalikan pohon UI yang stabil (AI atau ARIA).
- `browser act` menggunakan ID `ref` snapshot untuk click/type/drag/select.
- `browser screenshot` menangkap piksel (halaman penuh, elemen, atau ref berlabel).
- `browser doctor` memeriksa kesiapan Gateway, plugin, profil, browser, dan tab.
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP jarak jauh).
  - `target` (`sandbox` | `host` | `node`) untuk memilih lokasi browser berada.
  - Dalam sesi sandbox, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` dihilangkan: sesi sandbox default ke `sandbox`, sesi non-sandbox default ke `host`.
  - Jika node berkemampuan browser terhubung, tool dapat merutekan otomatis ke sana kecuali Anda mematok `target="host"` atau `target="node"`.

Ini menjaga agen tetap deterministik dan menghindari selector yang rapuh.

## Terkait

- [Ikhtisar Tools](/id/tools) — semua tool agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) — kontrol browser dalam lingkungan sandbox
- [Security](/id/gateway/security) — risiko kontrol browser dan hardening
