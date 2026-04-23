---
read_when:
    - Menambahkan otomasi browser yang dikendalikan agen
    - Men-debug mengapa openclaw mengganggu Chrome Anda sendiri
    - Mengimplementasikan pengaturan + siklus hidup browser di app macOS
summary: Layanan kontrol browser terintegrasi + perintah aksi
title: Browser (dikelola OpenClaw)
x-i18n:
    generated_at: "2026-04-23T09:28:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Browser (dikelola openclaw)

OpenClaw dapat menjalankan **profil Chrome/Brave/Edge/Chromium khusus** yang dikendalikan agen.
Profil ini terisolasi dari browser pribadi Anda dan dikelola melalui layanan
kontrol lokal kecil di dalam Gateway (hanya loopback).

Tampilan pemula:

- Anggap ini sebagai **browser terpisah khusus agen**.
- Profil `openclaw` **tidak** menyentuh profil browser pribadi Anda.
- Agen dapat **membuka tab, membaca halaman, mengklik, dan mengetik** di jalur aman.
- Profil `user` bawaan terhubung ke sesi Chrome nyata Anda yang sudah login melalui Chrome MCP.

## Yang Anda dapatkan

- Profil browser terpisah bernama **openclaw** (aksen oranye secara default).
- Kontrol tab deterministik (daftar/buka/fokus/tutup).
- Aksi agen (klik/ketik/drag/select), snapshot, screenshot, PDF.
- Dukungan multi-profil opsional (`openclaw`, `work`, `remote`, ...).

Browser ini **bukan** browser harian Anda. Ini adalah permukaan yang aman dan terisolasi untuk
otomasi dan verifikasi agen.

## Memulai cepat

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jika Anda mendapatkan “Browser disabled”, aktifkan di config (lihat di bawah) dan restart
Gateway.

Jika `openclaw browser` hilang sepenuhnya, atau agen mengatakan tool browser
tidak tersedia, lompat ke [Perintah atau tool browser hilang](/id/tools/browser#missing-browser-command-or-tool).

## Kontrol Plugin

Tool `browser` default sekarang adalah Plugin bundled yang dikirim dalam keadaan aktif
secara default. Artinya Anda dapat menonaktifkan atau menggantinya tanpa menghapus seluruh
sistem Plugin OpenClaw:

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

Nonaktifkan Plugin bundled sebelum menginstal Plugin lain yang menyediakan
nama tool `browser` yang sama. Pengalaman browser default memerlukan keduanya:

- `plugins.entries.browser.enabled` tidak dinonaktifkan
- `browser.enabled=true`

Jika Anda mematikan hanya Plugin-nya, CLI browser bundled (`openclaw browser`),
metode gateway (`browser.request`), tool agen, dan layanan kontrol browser
default semuanya hilang bersama. Config `browser.*` Anda tetap utuh untuk
digunakan ulang oleh Plugin pengganti.

Plugin browser bundled juga sekarang memiliki implementasi runtime browser.
Inti hanya menyimpan helper SDK Plugin bersama plus ekspor ulang kompatibilitas untuk
path impor internal yang lebih lama. Dalam praktiknya, menghapus atau mengganti package Plugin browser akan menghapus set fitur browser alih-alih meninggalkan runtime kedua milik inti.

Perubahan config browser tetap memerlukan restart Gateway agar Plugin bundled
dapat mendaftarkan ulang layanan browser-nya dengan pengaturan baru.

## Perintah atau tool browser hilang

Jika `openclaw browser` tiba-tiba menjadi perintah yang tidak dikenal setelah upgrade, atau
agen melaporkan bahwa tool browser hilang, penyebab yang paling umum adalah
daftar `plugins.allow` yang ketat dan tidak menyertakan `browser`.

Contoh config yang rusak:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Perbaiki dengan menambahkan `browser` ke allowlist Plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Catatan penting:

- `browser.enabled=true` saja tidak cukup ketika `plugins.allow` diatur.
- `plugins.entries.browser.enabled=true` juga tidak cukup ketika `plugins.allow` diatur.
- `tools.alsoAllow: ["browser"]` **tidak** memuat Plugin browser bundled. Pengaturan ini hanya menyesuaikan kebijakan tool setelah Plugin sudah dimuat.
- Jika Anda tidak memerlukan allowlist Plugin yang ketat, menghapus `plugins.allow` juga akan memulihkan perilaku browser bundled default.

Gejala umum:

- `openclaw browser` adalah perintah yang tidak dikenal.
- `browser.request` hilang.
- Agen melaporkan tool browser tidak tersedia atau hilang.

## Profil: `openclaw` vs `user`

- `openclaw`: browser terkelola dan terisolasi (tidak memerlukan extension).
- `user`: profil attach Chrome MCP bawaan untuk sesi **Chrome nyata Anda yang sudah login**.

Untuk pemanggilan tool browser agen:

- Default: gunakan browser `openclaw` yang terisolasi.
- Lebih pilih `profile="user"` saat sesi yang sudah login penting dan pengguna
  sedang berada di depan komputer untuk mengklik/menyetujui prompt attach.
- `profile` adalah override eksplisit saat Anda menginginkan mode browser tertentu.

Atur `browser.defaultProfile: "openclaw"` jika Anda ingin mode terkelola secara default.

## Konfigurasi

Pengaturan browser berada di `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in hanya untuk akses private-network tepercaya
      // allowPrivateNetwork: true, // alias lama
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override profil tunggal lama
    remoteCdpTimeoutMs: 1500, // batas waktu HTTP CDP remote (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // batas waktu handshake WebSocket CDP remote (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

Catatan:

- Layanan kontrol browser melakukan bind ke loopback pada port yang diturunkan dari `gateway.port`
  (default: `18791`, yaitu gateway + 2).
- Jika Anda mengoverride port Gateway (`gateway.port` atau `OPENCLAW_GATEWAY_PORT`),
  port browser turunan ikut bergeser agar tetap berada dalam “keluarga” yang sama.
- `cdpUrl` default ke port CDP lokal terkelola saat tidak diatur.
- `remoteCdpTimeoutMs` berlaku untuk pemeriksaan jangkauan CDP remote (non-loopback).
- `remoteCdpHandshakeTimeoutMs` berlaku untuk pemeriksaan jangkauan handshake WebSocket CDP remote.
- Navigasi/buka-tab browser dilindungi SSRF sebelum navigasi dan diperiksa ulang sebisa mungkin pada URL `http(s)` final setelah navigasi.
- Dalam mode SSRF ketat, penemuan/probe endpoint CDP remote (`cdpUrl`, termasuk lookup `/json/version`) juga diperiksa.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` dinonaktifkan secara default. Atur ke `true` hanya saat Anda memang memercayai akses browser private-network.
- `browser.ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama untuk kompatibilitas.
- `attachOnly: true` berarti “jangan pernah meluncurkan browser lokal; hanya attach jika sudah berjalan.”
- `color` + `color` per profil memberi tint pada UI browser agar Anda dapat melihat profil mana yang aktif.
- Profil default adalah `openclaw` (browser mandiri yang dikelola OpenClaw). Gunakan `defaultProfile: "user"` untuk memilih browser pengguna yang sudah login.
- Urutan deteksi otomatis: browser default sistem jika berbasis Chromium; jika tidak, Chrome → Brave → Edge → Chromium → Chrome Canary.
- Profil `openclaw` lokal mengisi `cdpPort`/`cdpUrl` secara otomatis — atur itu hanya untuk CDP remote.
- `driver: "existing-session"` menggunakan Chrome DevTools MCP alih-alih CDP mentah. Jangan
  atur `cdpUrl` untuk driver itu.
- Atur `browser.profiles.<name>.userDataDir` saat sebuah profil existing-session
  harus attach ke profil pengguna Chromium non-default seperti Brave atau Edge.

## Gunakan Brave (atau browser berbasis Chromium lainnya)

Jika browser **default sistem** Anda berbasis Chromium (Chrome/Brave/Edge/dll.),
OpenClaw menggunakannya secara otomatis. Atur `browser.executablePath` untuk mengoverride
deteksi otomatis:

Contoh CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Kontrol lokal vs remote

- **Kontrol lokal (default):** Gateway memulai layanan kontrol loopback dan dapat meluncurkan browser lokal.
- **Kontrol remote (host Node):** jalankan host Node di mesin yang memiliki browser; Gateway mem-proxy aksi browser ke host tersebut.
- **CDP remote:** atur `browser.profiles.<name>.cdpUrl` (atau `browser.cdpUrl`) untuk
  attach ke browser berbasis Chromium remote. Dalam kasus ini, OpenClaw tidak akan meluncurkan browser lokal.

Perilaku penghentian berbeda menurut mode profil:

- profil terkelola lokal: `openclaw browser stop` menghentikan proses browser yang
  diluncurkan OpenClaw
- profil attach-only dan CDP remote: `openclaw browser stop` menutup sesi kontrol aktif
  dan melepaskan override emulasi Playwright/CDP (viewport,
  skema warna, locale, zona waktu, mode offline, dan status serupa), meskipun
  tidak ada proses browser yang diluncurkan oleh OpenClaw

URL CDP remote dapat menyertakan auth:

- Token query (mis. `https://provider.example?token=<token>`)
- HTTP Basic auth (mis. `https://user:pass@provider.example`)

OpenClaw mempertahankan auth tersebut saat memanggil endpoint `/json/*` dan saat menghubungkan
ke WebSocket CDP. Lebih pilih variabel environment atau secrets manager untuk
token alih-alih meng-commit-nya ke file config.

## Proxy browser Node (default zero-config)

Jika Anda menjalankan **host Node** di mesin yang memiliki browser, OpenClaw dapat
merutekan otomatis pemanggilan tool browser ke Node itu tanpa config browser tambahan.
Ini adalah jalur default untuk gateway remote.

Catatan:

- Host Node mengekspos server kontrol browser lokalnya melalui **proxy command**.
- Profil berasal dari config `browser.profiles` milik Node itu sendiri (sama seperti lokal).
- `nodeHost.browserProxy.allowProfiles` bersifat opsional. Biarkan kosong untuk perilaku lama/default: semua profil yang dikonfigurasi tetap dapat dijangkau melalui proxy, termasuk rute create/delete profil.
- Jika Anda mengatur `nodeHost.browserProxy.allowProfiles`, OpenClaw memperlakukannya sebagai batas least-privilege: hanya profil yang ada di allowlist yang dapat ditargetkan, dan rute create/delete profil persisten diblokir di permukaan proxy.
- Nonaktifkan jika Anda tidak menginginkannya:
  - Pada node: `nodeHost.browserProxy.enabled=false`
  - Pada gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remote terhosting)

[Browserless](https://browserless.io) adalah layanan Chromium terhosting yang mengekspos
URL koneksi CDP melalui HTTPS dan WebSocket. OpenClaw dapat menggunakan salah satu bentuknya, tetapi
untuk profil browser remote, opsi paling sederhana adalah URL WebSocket langsung
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
- Jika Browserless memberi Anda base URL HTTPS, Anda bisa mengonversinya ke
  `wss://` untuk koneksi CDP langsung atau mempertahankan URL HTTPS dan membiarkan OpenClaw
  menemukan `/json/version`.

## Provider CDP WebSocket langsung

Beberapa layanan browser terhosting mengekspos endpoint **WebSocket** langsung alih-alih
penemuan CDP berbasis HTTP standar (`/json/version`). OpenClaw menerima tiga bentuk
URL CDP dan memilih strategi koneksi yang tepat secara otomatis:

- **Penemuan HTTP(S)** — `http://host[:port]` atau `https://host[:port]`.
  OpenClaw memanggil `/json/version` untuk menemukan URL debugger WebSocket, lalu
  terhubung. Tidak ada fallback WebSocket.
- **Endpoint WebSocket langsung** — `ws://host[:port]/devtools/<kind>/<id>` atau
  `wss://...` dengan path `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw terhubung langsung melalui handshake WebSocket dan melewati
  `/json/version` sepenuhnya.
- **Root WebSocket polos** — `ws://host[:port]` atau `wss://host[:port]` tanpa
  path `/devtools/...` (mis. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw mencoba penemuan HTTP
  `/json/version` terlebih dahulu (menormalkan skema menjadi `http`/`https`);
  jika penemuan mengembalikan `webSocketDebuggerUrl`, URL itu digunakan, jika tidak OpenClaw
  melakukan fallback ke handshake WebSocket langsung pada root polos. Ini mencakup
  port debug remote bergaya Chrome dan provider khusus WebSocket.

`ws://host:port` / `wss://host:port` polos tanpa path `/devtools/...`
yang diarahkan ke instans Chrome lokal didukung melalui
fallback discovery-first — Chrome hanya menerima upgrade WebSocket pada path per-browser
atau per-target tertentu yang dikembalikan oleh `/json/version`, jadi handshake root polos saja
akan gagal.

### Browserbase

[Browserbase](https://www.browserbase.com) adalah platform cloud untuk menjalankan
browser headless dengan penyelesaian CAPTCHA bawaan, mode stealth, dan proxy residensial.

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
- Browserbase membuat sesi browser secara otomatis saat koneksi WebSocket, jadi tidak
  diperlukan langkah pembuatan sesi manual.
- Paket gratis mengizinkan satu sesi konkuren dan satu jam browser per bulan.
  Lihat [pricing](https://www.browserbase.com/pricing) untuk batas paket berbayar.
- Lihat [dokumen Browserbase](https://docs.browserbase.com) untuk referensi API
  lengkap, panduan SDK, dan contoh integrasi.

## Keamanan

Ide utama:

- Kontrol browser hanya loopback; akses mengalir melalui auth Gateway atau pairing node.
- API HTTP browser loopback mandiri hanya menggunakan **auth shared-secret**:
  auth bearer token gateway, `x-openclaw-password`, atau HTTP Basic auth dengan
  password gateway yang dikonfigurasi.
- Header identitas Tailscale Serve dan `gateway.auth.mode: "trusted-proxy"` **tidak**
  mengautentikasi API browser loopback mandiri ini.
- Jika kontrol browser diaktifkan dan tidak ada auth shared-secret yang dikonfigurasi, OpenClaw
  membuat `gateway.auth.token` secara otomatis saat startup dan memersistensikannya ke config.
- OpenClaw **tidak** membuat token itu secara otomatis saat `gateway.auth.mode` sudah
  `password`, `none`, atau `trusted-proxy`.
- Pertahankan Gateway dan host Node mana pun di jaringan privat (Tailscale); hindari paparan publik.
- Perlakukan URL/token CDP remote sebagai secret; lebih pilih env var atau secrets manager.

Tip CDP remote:

- Lebih pilih endpoint terenkripsi (HTTPS atau WSS) dan token berumur pendek jika memungkinkan.
- Hindari menyematkan token berumur panjang langsung di file config.

## Profil (multi-browser)

OpenClaw mendukung beberapa profil bernama (config perutean). Profil dapat berupa:

- **dikelola openclaw**: instans browser berbasis Chromium khusus dengan direktori user data + port CDP sendiri
- **remote**: URL CDP eksplisit (browser berbasis Chromium yang berjalan di tempat lain)
- **sesi yang ada**: profil Chrome Anda yang sudah ada melalui attach otomatis Chrome DevTools MCP

Default:

- Profil `openclaw` dibuat otomatis jika hilang.
- Profil `user` tersedia bawaan untuk attach existing-session Chrome MCP.
- Profil existing-session bersifat opt-in selain `user`; buat dengan `--driver existing-session`.
- Port CDP lokal dialokasikan dari **18800–18899** secara default.
- Menghapus profil akan memindahkan direktori data lokalnya ke Trash.

Semua endpoint kontrol menerima `?profile=<name>`; CLI menggunakan `--browser-profile`.

## Existing-session melalui Chrome DevTools MCP

OpenClaw juga dapat attach ke profil browser berbasis Chromium yang sedang berjalan melalui
server resmi Chrome DevTools MCP. Ini menggunakan ulang tab dan status login
yang sudah terbuka di profil browser tersebut.

Latar belakang resmi dan referensi penyiapan:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil bawaan:

- `user`

Opsional: buat profil existing-session kustom Anda sendiri jika Anda menginginkan
nama, warna, atau direktori data browser yang berbeda.

Perilaku default:

- Profil `user` bawaan menggunakan auto-connect Chrome MCP, yang menargetkan
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
3. Biarkan browser tetap berjalan dan setujui prompt koneksi saat OpenClaw attach.

Halaman inspect umum:

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

Tanda keberhasilan:

- `status` menampilkan `driver: existing-session`
- `status` menampilkan `transport: chrome-mcp`
- `status` menampilkan `running: true`
- `tabs` mencantumkan tab browser yang sudah Anda buka
- `snapshot` mengembalikan ref dari tab live yang dipilih

Yang perlu diperiksa jika attach tidak bekerja:

- browser berbasis Chromium target memiliki versi `144+`
- remote debugging diaktifkan di halaman inspect browser itu
- browser menampilkan dan Anda menerima prompt persetujuan attach
- `openclaw doctor` memigrasikan config browser lama berbasis extension dan memeriksa bahwa
  Chrome terinstal secara lokal untuk profil auto-connect default, tetapi tidak dapat
  mengaktifkan remote debugging sisi browser untuk Anda

Penggunaan agen:

- Gunakan `profile="user"` saat Anda memerlukan status browser pengguna yang sudah login.
- Jika Anda menggunakan profil existing-session kustom, berikan nama profil eksplisit tersebut.
- Pilih mode ini hanya saat pengguna berada di depan komputer untuk menyetujui prompt
  attach.
- Gateway atau host Node dapat menjalankan `npx chrome-devtools-mcp@latest --autoConnect`

Catatan:

- Jalur ini berisiko lebih tinggi daripada profil `openclaw` yang terisolasi karena dapat
  bertindak di dalam sesi browser Anda yang sudah login.
- OpenClaw tidak meluncurkan browser untuk driver ini; ia hanya attach ke
  sesi yang sudah ada.
- OpenClaw menggunakan alur resmi Chrome DevTools MCP `--autoConnect` di sini. Jika
  `userDataDir` diatur, OpenClaw meneruskannya untuk menargetkan
  direktori user data Chromium yang eksplisit itu.
- Screenshot existing-session mendukung tangkapan halaman dan tangkapan elemen `--ref`
  dari snapshot, tetapi tidak mendukung selector CSS `--element`.
- Screenshot halaman existing-session bekerja tanpa Playwright melalui Chrome MCP.
  Screenshot elemen berbasis ref (`--ref`) juga berfungsi di sana, tetapi `--full-page`
  tidak dapat digabungkan dengan `--ref` atau `--element`.
- Aksi existing-session masih lebih terbatas dibanding jalur browser terkelola:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag`, dan `select` memerlukan
    ref snapshot alih-alih selector CSS
  - `click` hanya tombol kiri (tanpa override tombol atau modifier)
  - `type` tidak mendukung `slowly=true`; gunakan `fill` atau `press`
  - `press` tidak mendukung `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill`, dan `evaluate` tidak
    mendukung override timeout per panggilan
  - `select` saat ini hanya mendukung satu nilai
- Existing-session `wait --url` mendukung pola exact, substring, dan glob
  seperti driver browser lainnya. `wait --load networkidle` belum didukung.
- Hook upload existing-session memerlukan `ref` atau `inputRef`, mendukung satu file
  sekaligus, dan tidak mendukung penargetan CSS `element`.
- Hook dialog existing-session tidak mendukung override timeout.
- Beberapa fitur masih memerlukan jalur browser terkelola, termasuk batch
  actions, ekspor PDF, intersepsi unduhan, dan `responsebody`.
- Existing-session dapat attach di host terpilih atau melalui node browser yang terhubung.
  Jika Chrome berada di tempat lain dan tidak ada node browser yang terhubung, gunakan
  CDP remote atau host Node sebagai gantinya.

## Jaminan isolasi

- **Direktori user data khusus**: tidak pernah menyentuh profil browser pribadi Anda.
- **Port khusus**: menghindari `9222` untuk mencegah bentrokan dengan alur kerja dev.
- **Kontrol tab deterministik**: targetkan tab berdasarkan `targetId`, bukan “tab terakhir”.

## Pemilihan browser

Saat meluncurkan secara lokal, OpenClaw memilih yang tersedia pertama:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Anda dapat mengoverride dengan `browser.executablePath`.

Platform:

- macOS: memeriksa `/Applications` dan `~/Applications`.
- Linux: mencari `google-chrome`, `brave`, `microsoft-edge`, `chromium`, dll.
- Windows: memeriksa lokasi instalasi umum.

## API Control (opsional)

Hanya untuk integrasi lokal, Gateway mengekspos API HTTP loopback kecil:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Actions: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Jaringan: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Pengaturan: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Semua endpoint menerima `?profile=<name>`.

Jika auth Gateway berbasis shared-secret dikonfigurasi, rute HTTP browser juga memerlukan auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` atau HTTP Basic auth dengan password tersebut

Catatan:

- API browser loopback mandiri ini **tidak** menggunakan trusted-proxy atau
  header identitas Tailscale Serve.
- Jika `gateway.auth.mode` adalah `none` atau `trusted-proxy`, rute browser loopback ini
  tidak mewarisi mode pembawa identitas tersebut; tetap jaga agar hanya loopback.

### Kontrak error `/act`

`POST /act` menggunakan respons error terstruktur untuk validasi tingkat rute dan
kegagalan kebijakan:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Nilai `code` saat ini:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` hilang atau tidak dikenali.
- `ACT_INVALID_REQUEST` (HTTP 400): payload aksi gagal dinormalisasi atau divalidasi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` digunakan dengan jenis aksi yang tidak didukung.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (atau `wait --fn`) dinonaktifkan oleh config.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` tingkat atas atau batched bertentangan dengan target permintaan.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): aksi tidak didukung untuk profil existing-session.

Kegagalan runtime lainnya masih dapat mengembalikan `{ "error": "<message>" }` tanpa
field `code`.

### Persyaratan Playwright

Beberapa fitur (navigate/act/AI snapshot/role snapshot, screenshot elemen,
PDF) memerlukan Playwright. Jika Playwright tidak terinstal, endpoint tersebut mengembalikan error 501 yang jelas.

Yang masih berfungsi tanpa Playwright:

- Snapshot ARIA
- Screenshot halaman untuk browser `openclaw` terkelola saat WebSocket
  CDP per-tab tersedia
- Screenshot halaman untuk profil `existing-session` / Chrome MCP
- Screenshot berbasis ref (`--ref`) existing-session dari output snapshot

Yang masih memerlukan Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- Screenshot elemen selector CSS (`--element`)
- Ekspor PDF browser penuh

Screenshot elemen juga menolak `--full-page`; rute mengembalikan `fullPage is
not supported for element screenshots`.

Jika Anda melihat `Playwright is not available in this gateway build`, perbaiki dependensi runtime Plugin browser bundled agar `playwright-core` terinstal,
lalu restart gateway. Untuk instalasi terpaket, jalankan `openclaw doctor --fix`.
Untuk Docker, instal juga binary browser Chromium seperti ditunjukkan di bawah.

#### Instalasi Playwright Docker

Jika Gateway Anda berjalan di Docker, hindari `npx playwright` (konflik override npm).
Gunakan CLI bundled sebagai gantinya:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Untuk mempersistensikan unduhan browser, atur `PLAYWRIGHT_BROWSERS_PATH` (misalnya,
`/home/node/.cache/ms-playwright`) dan pastikan `/home/node` dipersistensikan melalui
`OPENCLAW_HOME_VOLUME` atau bind mount. Lihat [Docker](/id/install/docker).

## Cara kerjanya (internal)

Alur tingkat tinggi:

- **Server control** kecil menerima permintaan HTTP.
- Server ini terhubung ke browser berbasis Chromium (Chrome/Brave/Edge/Chromium) melalui **CDP**.
- Untuk aksi lanjutan (klik/ketik/snapshot/PDF), server ini menggunakan **Playwright** di atas
  CDP.
- Saat Playwright tidak ada, hanya operasi non-Playwright yang tersedia.

Desain ini menjaga agen pada antarmuka yang stabil dan deterministik sambil memungkinkan
Anda menukar browser dan profil lokal/remote.

## Referensi cepat CLI

Semua perintah menerima `--browser-profile <name>` untuk menargetkan profil tertentu.
Semua perintah juga menerima `--json` untuk output yang dapat dibaca mesin (payload stabil).

Dasar:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspeksi:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Catatan siklus hidup:

- Untuk profil attach-only dan CDP remote, `openclaw browser stop` tetap merupakan
  perintah pembersihan yang benar setelah pengujian. Perintah ini menutup sesi kontrol aktif dan
  menghapus override emulasi sementara alih-alih mematikan browser
  dasarnya.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Aksi:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Status:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Catatan:

- `upload` dan `dialog` adalah panggilan **arming**; jalankan sebelum klik/press
  yang memicu chooser/dialog.
- Jalur output download dan trace dibatasi ke root temp OpenClaw:
  - trace: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - download: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Jalur upload dibatasi ke root upload temp OpenClaw:
  - upload: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` juga dapat mengatur input file secara langsung melalui `--input-ref` atau `--element`.
- `snapshot`:
  - `--format ai` (default saat Playwright terinstal): mengembalikan AI snapshot dengan ref numerik (`aria-ref="<n>"`).
  - `--format aria`: mengembalikan pohon aksesibilitas (tanpa ref; hanya untuk inspeksi).
  - `--efficient` (atau `--mode efficient`): preset role snapshot ringkas (interactive + compact + depth + maxChars lebih rendah).
  - Default config (hanya tool/CLI): atur `browser.snapshotDefaults.mode: "efficient"` untuk menggunakan snapshot efisien saat pemanggil tidak memberikan mode (lihat [konfigurasi Gateway](/id/gateway/configuration-reference#browser)).
  - Opsi role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) memaksa role-based snapshot dengan ref seperti `ref=e12`.
  - `--frame "<iframe selector>"` mencakup role snapshot ke iframe (dipasangkan dengan role ref seperti `e12`).
  - `--interactive` mengeluarkan daftar datar elemen interaktif yang mudah dipilih (terbaik untuk menggerakkan aksi).
  - `--labels` menambahkan screenshot khusus viewport dengan label ref ter-overlay (mencetak `MEDIA:<path>`).
- `click`/`type`/dll. memerlukan `ref` dari `snapshot` (baik numerik `12` atau role ref `e12`).
  Selector CSS sengaja tidak didukung untuk aksi.

## Snapshot dan ref

OpenClaw mendukung dua gaya “snapshot”:

- **AI snapshot (ref numerik)**: `openclaw browser snapshot` (default; `--format ai`)
  - Output: snapshot teks yang menyertakan ref numerik.
  - Aksi: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Secara internal, ref di-resolve melalui `aria-ref` milik Playwright.

- **Role snapshot (role ref seperti `e12`)**: `openclaw browser snapshot --interactive` (atau `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: daftar/pohon berbasis peran dengan `[ref=e12]` (dan opsional `[nth=1]`).
  - Aksi: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Secara internal, ref di-resolve melalui `getByRole(...)` (plus `nth()` untuk duplikat).
  - Tambahkan `--labels` untuk menyertakan screenshot viewport dengan label `e12` yang dioverlay.

Perilaku ref:

- Ref **tidak stabil di seluruh navigasi**; jika sesuatu gagal, jalankan ulang `snapshot` dan gunakan ref baru.
- Jika role snapshot diambil dengan `--frame`, role ref dicakup ke iframe tersebut sampai role snapshot berikutnya.

## Peningkat wait

Anda dapat menunggu lebih dari sekadar waktu/teks:

- Tunggu URL (glob didukung oleh Playwright):
  - `openclaw browser wait --url "**/dash"`
- Tunggu status muat:
  - `openclaw browser wait --load networkidle`
- Tunggu predikat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Tunggu selector menjadi terlihat:
  - `openclaw browser wait "#main"`

Semua ini dapat digabungkan:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Alur kerja debugging

Saat sebuah aksi gagal (mis. “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Gunakan `click <ref>` / `type <ref>` (lebih pilih role ref dalam mode interactive)
3. Jika masih gagal: `openclaw browser highlight <ref>` untuk melihat apa yang ditargetkan Playwright
4. Jika halaman berperilaku aneh:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Untuk debugging mendalam: rekam trace:
   - `openclaw browser trace start`
   - reproduksi masalah
   - `openclaw browser trace stop` (mencetak `TRACE:<path>`)

## Output JSON

`--json` digunakan untuk skrip dan tooling terstruktur.

Contoh:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshot dalam JSON menyertakan `refs` plus blok `stats` kecil (lines/chars/refs/interactive) sehingga tool dapat menalar ukuran dan kepadatan payload.

## Knop status dan environment

Ini berguna untuk alur kerja “buat situs berperilaku seperti X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (lama `set headers --json '{"X-Debug":"1"}'` tetap didukung)
- HTTP basic auth: `set credentials user pass` (atau `--clear`)
- Geolokasi: `set geo <lat> <lon> --origin "https://example.com"` (atau `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zona waktu / locale: `set timezone ...`, `set locale ...`
- Perangkat / viewport:
  - `set device "iPhone 14"` (preset perangkat Playwright)
  - `set viewport 1280 720`

## Keamanan & privasi

- Profil browser openclaw dapat berisi sesi yang sudah login; perlakukan sebagai hal sensitif.
- `browser act kind=evaluate` / `openclaw browser evaluate` dan `wait --fn`
  mengeksekusi JavaScript arbitrer dalam konteks halaman. Prompt injection dapat mengarahkan
  ini. Nonaktifkan dengan `browser.evaluateEnabled=false` jika Anda tidak memerlukannya.
- Untuk login dan catatan anti-bot (X/Twitter, dll.), lihat [Login browser + posting X/Twitter](/id/tools/browser-login).
- Jaga Gateway/host Node tetap privat (hanya loopback atau tailnet).
- Endpoint CDP remote sangat kuat; tunnel-kan dan lindungi.

Contoh mode ketat (blokir tujuan privat/internal secara default):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // allow exact opsional
    },
  },
}
```

## Pemecahan masalah

Untuk masalah khusus Linux (terutama snap Chromium), lihat
[Pemecahan masalah browser](/id/tools/browser-linux-troubleshooting).

Untuk penyiapan host-terpisah Gateway WSL2 + Chrome Windows, lihat
[Pemecahan masalah WSL2 + Windows + CDP Chrome remote](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Kegagalan startup CDP vs blok SSRF navigasi

Ini adalah kelas kegagalan yang berbeda dan menunjuk ke jalur kode yang berbeda.

- **Kegagalan startup atau readiness CDP** berarti OpenClaw tidak dapat memastikan bahwa control plane browser dalam keadaan sehat.
- **Blok SSRF navigasi** berarti control plane browser sehat, tetapi target navigasi halaman ditolak oleh kebijakan.

Contoh umum:

- Kegagalan startup atau readiness CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blok SSRF navigasi:
  - alur `open`, `navigate`, snapshot, atau pembukaan tab gagal dengan error kebijakan browser/jaringan sementara `start` dan `tabs` masih berfungsi

Gunakan urutan minimal ini untuk membedakan keduanya:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cara membaca hasilnya:

- Jika `start` gagal dengan `not reachable after start`, selesaikan kesiapan CDP terlebih dahulu.
- Jika `start` berhasil tetapi `tabs` gagal, control plane masih tidak sehat. Perlakukan ini sebagai masalah jangkauan CDP, bukan masalah navigasi halaman.
- Jika `start` dan `tabs` berhasil tetapi `open` atau `navigate` gagal, control plane browser aktif dan kegagalan ada pada kebijakan navigasi atau halaman target.
- Jika `start`, `tabs`, dan `open` semuanya berhasil, jalur kontrol browser terkelola dasar dalam keadaan sehat.

Detail perilaku penting:

- Config browser secara default menggunakan objek kebijakan SSRF fail-closed bahkan saat Anda tidak mengonfigurasi `browser.ssrfPolicy`.
- Untuk profil terkelola `openclaw` loopback lokal, pemeriksaan kesehatan CDP sengaja melewati penegakan jangkauan SSRF browser untuk control plane lokal milik OpenClaw sendiri.
- Perlindungan navigasi terpisah. Hasil `start` atau `tabs` yang berhasil tidak berarti target `open` atau `navigate` berikutnya akan diizinkan.

Panduan keamanan:

- **Jangan** melonggarkan kebijakan SSRF browser secara default.
- Lebih pilih pengecualian host yang sempit seperti `hostnameAllowlist` atau `allowedHostnames` daripada akses private-network yang luas.
- Gunakan `dangerouslyAllowPrivateNetwork: true` hanya di environment yang memang tepercaya, saat akses browser private-network diperlukan dan telah ditinjau.

Contoh: navigasi diblokir, control plane sehat

- `start` berhasil
- `tabs` berhasil
- `open http://internal.example` gagal

Itu biasanya berarti startup browser baik-baik saja dan target navigasi memerlukan peninjauan kebijakan.

Contoh: startup diblokir sebelum navigasi menjadi relevan

- `start` gagal dengan `not reachable after start`
- `tabs` juga gagal atau tidak dapat dijalankan

Itu menunjuk ke peluncuran browser atau jangkauan CDP, bukan masalah allowlist URL halaman.

## Tool agen + cara kerja kontrol

Agen mendapatkan **satu tool** untuk otomasi browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Pemetaan cara kerjanya:

- `browser snapshot` mengembalikan pohon UI yang stabil (AI atau ARIA).
- `browser act` menggunakan ID `ref` dari snapshot untuk klik/type/drag/select.
- `browser screenshot` menangkap piksel (halaman penuh atau elemen).
- `browser` menerima:
  - `profile` untuk memilih profil browser bernama (openclaw, chrome, atau CDP remote).
  - `target` (`sandbox` | `host` | `node`) untuk memilih tempat browser berada.
  - Dalam sesi sandbox, `target: "host"` memerlukan `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jika `target` dihilangkan: sesi sandbox default ke `sandbox`, sesi non-sandbox default ke `host`.
  - Jika node yang mampu browser terhubung, tool dapat merutekan otomatis ke sana kecuali Anda mem-pin `target="host"` atau `target="node"`.

Ini menjaga agen tetap deterministik dan menghindari selector yang rapuh.

## Terkait

- [Ikhtisar Tools](/id/tools) — semua tool agen yang tersedia
- [Sandboxing](/id/gateway/sandboxing) — kontrol browser di environment bersandbox
- [Keamanan](/id/gateway/security) — risiko kontrol browser dan penguatan
