---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda menginginkan akses Tailnet tanpa tunnel SSH
summary: UI kontrol berbasis browser untuk Gateway (chat, Node, config)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T13:59:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

Control UI adalah aplikasi single-page kecil berbasis **Vite + Lit** yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefix opsional: setel `gateway.controlUi.basePath` (misalnya `/openclaw`)

Control UI berbicara **langsung ke Gateway WebSocket** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, jalankan Gateway terlebih dahulu: `openclaw gateway`.

Auth disuplai selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- Header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dashboard menyimpan token untuk sesi tab browser saat ini
dan URL gateway yang dipilih; password tidak dipersistenkan. Onboarding biasanya
membuat token gateway untuk auth shared-secret saat koneksi pertama, tetapi auth
berbasis password juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pairing perangkat (koneksi pertama)

Saat Anda terhubung ke Control UI dari browser atau perangkat baru, Gateway
memerlukan **persetujuan pairing satu kali** — bahkan jika Anda berada pada Tailnet
yang sama dengan `gateway.auth.allowTailscale: true`. Ini adalah langkah keamanan untuk mencegah
akses yang tidak sah.

**Yang akan Anda lihat:** "disconnected (1008): pairing required"

**Untuk menyetujui perangkat:**

```bash
# Daftar permintaan yang tertunda
openclaw devices list

# Setujui berdasarkan ID permintaan
openclaw devices approve <requestId>
```

Jika browser mencoba ulang pairing dengan detail auth yang berubah (role/scope/public
key), permintaan tertunda sebelumnya digantikan dan `requestId` baru dibuat. Jalankan ulang `openclaw devices list` sebelum persetujuan.

Jika browser sudah dipair dan Anda mengubahnya dari akses baca ke
akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas,
dan meminta Anda menyetujui kumpulan scope baru secara eksplisit.

Setelah disetujui, perangkat diingat dan tidak akan memerlukan persetujuan ulang kecuali
Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat
[Devices CLI](/id/cli/devices) untuk rotasi token dan pencabutan.

**Catatan:**

- Koneksi browser loopback lokal langsung (`127.0.0.1` / `localhost`) disetujui
  secara otomatis.
- Koneksi browser Tailnet dan LAN tetap memerlukan persetujuan eksplisit, bahkan saat
  berasal dari mesin yang sama.
- Setiap profil browser menghasilkan ID perangkat unik, jadi berganti browser atau
  membersihkan data browser akan memerlukan pairing ulang.

## Identitas pribadi (lokal browser)

Control UI mendukung identitas pribadi per browser (nama tampilan dan
avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini
tersimpan di penyimpanan browser, dicakup ke profil browser saat ini, dan tidak
disinkronkan ke perangkat lain atau dipersistenkan di sisi server selain metadata
kepengarangan transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau
berganti browser akan meresetnya menjadi kosong.

## Endpoint config runtime

Control UI mengambil pengaturan runtime-nya dari
`/__openclaw/control-ui-config.json`. Endpoint tersebut dijaga oleh auth gateway yang sama seperti permukaan HTTP lainnya: browser yang tidak terautentikasi tidak dapat mengambilnya, dan pengambilan yang berhasil memerlukan token/password gateway yang sudah valid, identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

Control UI dapat melokalkan dirinya sendiri saat pemuatan pertama berdasarkan locale browser Anda.
Untuk mengoverride nanti, buka **Overview -> Gateway Access -> Language**. Pemilih
locale berada di kartu Gateway Access, bukan di bawah Appearance.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang fallback ke bahasa Inggris.

## Yang dapat dilakukan (saat ini)

- Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Berbicara langsung dengan OpenAI Realtime dari browser melalui WebRTC. Gateway
  membuat rahasia klien Realtime berumur pendek dengan `talk.realtime.session`; browser
  mengirim audio mikrofon langsung ke OpenAI dan meneruskan pemanggilan tool
  `openclaw_agent_consult` kembali melalui `chat.send` untuk model OpenClaw
  yang lebih besar dan telah dikonfigurasi.
- Stream pemanggilan tool + kartu output tool langsung di Chat (event agen)
- Channels: status channel bawaan plus channel Plugin bawaan/eksternal, login QR, dan config per channel (`channels.status`, `web.login.*`, `config.patch`)
- Instances: daftar presence + refresh (`system-presence`)
- Sessions: daftar + override model/thinking/fast/verbose/trace/reasoning per sesi (`sessions.list`, `sessions.patch`)
- Dreams: status Dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron jobs: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`)
- Skills: status, aktifkan/nonaktifkan, install, pembaruan kunci API (`skills.*`)
- Nodes: daftar + kapabilitas (`node.list`)
- Persetujuan exec: edit allowlist gateway atau node + kebijakan ask untuk `exec host=gateway/node` (`exec.approvals.*`)
- Config: lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config: terapkan + restart dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir
- Penulisan config menyertakan penjaga base-hash untuk mencegah menimpa edit bersamaan
- Penulisan config (`config.set`/`config.apply`/`config.patch`) juga melakukan preflight resolusi SecretRef aktif untuk ref dalam payload config yang dikirim; ref aktif yang tidak teresolusikan dalam payload yang dikirim ditolak sebelum penulisan
- Schema config + rendering form (`config.schema` / `config.schema.lookup`,
  termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan child
  langsung, metadata docs pada node object/wildcard/array/composition bertingkat,
  plus schema plugin + channel saat tersedia); editor Raw JSON
  hanya tersedia saat snapshot memiliki round-trip raw yang aman
- Jika sebuah snapshot tidak dapat melakukan round-trip teks mentah dengan aman, Control UI memaksa mode Form dan menonaktifkan mode Raw untuk snapshot tersebut
- Editor Raw JSON "Reset to saved" mempertahankan bentuk yang ditulis dalam raw (formatting, komentar, tata letak `$include`) alih-alih merender ulang snapshot yang diratakan, sehingga edit eksternal bertahan saat reset ketika snapshot dapat melakukan round-trip dengan aman
- Nilai objek SecretRef terstruktur dirender hanya-baca di input teks form untuk mencegah kerusakan objek-ke-string secara tidak sengaja
- Debug: snapshot status/health/models + log event + pemanggilan RPC manual (`status`, `health`, `models.list`)
- Log: tail langsung log file gateway dengan filter/ekspor (`logs.tail`)
- Update: jalankan pembaruan package/git + restart (`update.run`) dengan laporan restart

Catatan panel Cron jobs:

- Untuk job terisolasi, pengiriman default adalah mengumumkan ringkasan. Anda dapat beralih ke none jika menginginkan eksekusi hanya internal.
- Field channel/target muncul saat announce dipilih.
- Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` disetel ke URL Webhook HTTP(S) yang valid.
- Untuk job sesi utama, mode pengiriman webhook dan none tersedia.
- Kontrol edit lanjutan mencakup hapus-setelah-jalan, hapus override agen, opsi cron exact/stagger,
  override model/thinking agen, dan toggle pengiriman best-effort.
- Validasi form bersifat inline dengan error tingkat field; nilai tidak valid menonaktifkan tombol simpan sampai diperbaiki.
- Setel `cron.webhookToken` untuk mengirim token bearer khusus; jika dihilangkan, webhook dikirim tanpa header auth.
- Fallback lama: job lama yang tersimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

## Perilaku chat

- `chat.send` **non-blocking**: segera mengakui dengan `{ runId, status: "started" }` dan respons di-stream melalui event `chat`.
- Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat sedang berjalan, dan `{ status: "ok" }` setelah selesai.
- Respons `chat.history` dibatasi ukurannya demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memangkas field teks panjang, menghilangkan blok metadata berat, dan mengganti pesan yang terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
- Gambar asisten/yang dihasilkan dipersistenkan sebagai referensi media terkelola dan disajikan kembali melalui URL media Gateway yang diautentikasi, sehingga reload tidak bergantung pada payload gambar base64 mentah yang tetap ada dalam respons riwayat chat.
- `chat.history` juga menghapus tag directive inline khusus tampilan dari teks asisten yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML pemanggilan tool dalam teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan tool yang terpotong), serta token kontrol model ASCII/full-width yang bocor, dan menghilangkan entri asisten yang seluruh teks terlihatnya hanya token silent persis `NO_REPLY` / `no_reply`.
- Selama pengiriman aktif dan refresh riwayat final, tampilan chat mempertahankan
  pesan pengguna/asisten optimistis lokal tetap terlihat jika `chat.history` sesaat mengembalikan
  snapshot yang lebih lama; transkrip kanonis menggantikan pesan lokal tersebut setelah
  riwayat Gateway menyusul.
- `chat.inject` menambahkan catatan asisten ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus UI (tanpa eksekusi agen, tanpa pengiriman channel).
- Pemilih model dan thinking pada header chat langsung mem-patch sesi aktif melalui `sessions.patch`; keduanya adalah override sesi persisten, bukan opsi kirim sekali jalan.
- Saat laporan penggunaan sesi Gateway yang baru menunjukkan tekanan konteks tinggi, area composer chat menampilkan pemberitahuan konteks dan, pada tingkat Compaction yang direkomendasikan, tombol compact yang menjalankan jalur Compaction sesi normal. Snapshot token yang stale disembunyikan sampai Gateway melaporkan penggunaan baru lagi.
- Mode Talk menggunakan penyedia suara realtime terdaftar yang mendukung sesi WebRTC browser. Konfigurasikan OpenAI dengan `talk.provider: "openai"` plus
  `talk.providers.openai.apiKey`, atau gunakan kembali config penyedia realtime Voice Call. Browser tidak pernah menerima kunci API OpenAI standar; browser hanya menerima rahasia klien Realtime sementara. Suara realtime Google Live didukung untuk backend Voice Call dan bridge Google Meet, tetapi belum untuk jalur WebRTC browser ini. Prompt sesi Realtime dirakit oleh Gateway;
  `talk.realtime.session` tidak menerima override instruksi yang diberikan pemanggil.
- Di composer Chat, kontrol Talk adalah tombol gelombang di sebelah tombol
  dikte mikrofon. Saat Talk dimulai, baris status composer menampilkan
  `Connecting Talk...`, lalu `Talk live` saat audio terhubung, atau
  `Asking OpenClaw...` saat pemanggilan tool realtime sedang berkonsultasi dengan model
  yang lebih besar dan telah dikonfigurasi melalui `chat.send`.
- Stop:
  - Klik **Stop** (memanggil `chat.abort`)
  - Saat sebuah eksekusi aktif, tindak lanjut normal diantrikan. Klik **Steer** pada pesan yang diantrikan untuk menyuntikkan tindak lanjut itu ke giliran yang sedang berjalan.
  - Ketik `/stop` (atau frasa abort mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan di luar band
  - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua eksekusi aktif untuk sesi tersebut
- Retensi parsial abort:
  - Saat sebuah eksekusi dibatalkan, teks asisten parsial tetap dapat ditampilkan di UI
  - Gateway mempersistenkan teks asisten parsial yang dibatalkan ke riwayat transkrip saat output terbuffer tersedia
  - Entri yang dipersistenkan mencakup metadata abort sehingga konsumen transkrip dapat membedakan parsial abort dari output penyelesaian normal

## Instalasi PWA dan web push

Control UI menyertakan `manifest.webmanifest` dan service worker, sehingga
browser modern dapat menginstalnya sebagai PWA mandiri. Web Push memungkinkan
Gateway membangunkan PWA yang terinstal dengan notifikasi bahkan saat tab atau
jendela browser tidak terbuka.

| Permukaan                                            | Fungsinya                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                     | Manifest PWA. Browser menawarkan "Install app" setelah dapat dijangkau. |
| `ui/public/sw.js`                                    | Service worker yang menangani event `push` dan klik notifikasi.    |
| `push/vapid-keys.json` (di bawah direktori state OpenClaw) | Pasangan kunci VAPID yang dibuat otomatis dan digunakan untuk menandatangani payload Web Push. |
| `push/web-push-subscriptions.json`                   | Endpoint langganan browser yang dipersistenkan.                    |

Override pasangan kunci VAPID melalui variabel env pada proses Gateway saat
Anda ingin mematok kunci (untuk deployment multi-host, rotasi secrets, atau
pengujian):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default ke `mailto:openclaw@localhost`)

Control UI menggunakan metode Gateway dengan scope terbatas ini untuk mendaftarkan dan
menguji langganan browser:

- `push.web.vapidPublicKey` — mengambil kunci publik VAPID yang aktif.
- `push.web.subscribe` — mendaftarkan `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — menghapus endpoint yang terdaftar.
- `push.web.test` — mengirim notifikasi uji ke langganan pemanggil.

Web Push independen dari jalur relay APNS iOS
(lihat [Configuration](/id/gateway/configuration) untuk push berbasis relay) dan
metode `push.test` yang sudah ada, yang menargetkan pairing mobile native.

## Embed terhosting

Pesan asisten dapat merender konten web terhosting secara inline dengan shortcode `[embed ...]`.
Kebijakan sandbox iframe dikendalikan oleh
`gateway.controlUi.embedSandbox`:

- `strict`: menonaktifkan eksekusi skrip di dalam embed terhosting
- `scripts`: mengizinkan embed interaktif sambil tetap menjaga isolasi origin; ini
  adalah default dan biasanya cukup untuk game/widget browser mandiri
- `trusted`: menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen
  same-site yang memang sengaja membutuhkan hak lebih kuat

Contoh:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Gunakan `trusted` hanya saat dokumen yang di-embed benar-benar membutuhkan
perilaku same-origin. Untuk sebagian besar game yang dihasilkan agen dan canvas interaktif, `scripts` adalah pilihan yang lebih aman.

URL embed `http(s)` eksternal absolut tetap diblokir secara default. Jika Anda
memang sengaja ingin `[embed url="https://..."]` memuat halaman pihak ketiga, setel
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Akses Tailnet (disarankan)

### Tailscale Serve terintegrasi (lebih disukai)

Biarkan Gateway tetap di loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

```bash
openclaw gateway --tailscale serve
```

Buka:

- `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

Secara default, permintaan Control UI/WebSocket Serve dapat diautentikasi melalui header identitas Tailscale
(`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw
memverifikasi identitas dengan meresolusikan alamat `x-forwarded-for` menggunakan
`tailscale whois` dan mencocokkannya dengan header, dan hanya menerima ini saat
permintaan mencapai loopback dengan header `x-forwarded-*` milik Tailscale. Setel
`gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial shared-secret
eksplisit bahkan untuk trafik Serve. Kemudian gunakan `gateway.auth.mode: "token"` atau
`"password"`.
Untuk jalur identitas Serve async tersebut, upaya auth gagal untuk IP klien
dan scope auth yang sama diserialkan sebelum penulisan rate-limit. Karena itu, percobaan buruk bersamaan
dari browser yang sama dapat menampilkan `retry later` pada permintaan kedua
alih-alih dua mismatch biasa yang saling berpacu secara paralel.
Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya dapat berjalan di host tersebut, wajibkan auth token/password.

### Bind ke tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Lalu buka:

- `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

Tempelkan shared secret yang sesuai ke pengaturan UI (dikirim sebagai
`connect.params.auth.token` atau `connect.params.auth.password`).

## HTTP tidak aman

Jika Anda membuka dashboard melalui HTTP biasa (`http://<lan-ip>` atau `http://<tailscale-ip>`),
browser berjalan dalam **konteks non-aman** dan memblokir WebCrypto. Secara default,
OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian yang didokumentasikan:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- auth operator Control UI yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang disarankan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (pada host gateway)

**Perilaku toggle insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` hanyalah toggle kompatibilitas lokal:

- Toggle ini mengizinkan sesi Control UI localhost berlanjut tanpa identitas perangkat dalam
  konteks HTTP non-aman.
- Toggle ini tidak melewati pemeriksaan pairing.
- Toggle ini tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost).

**Hanya untuk break-glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` menonaktifkan pemeriksaan identitas perangkat Control UI dan merupakan
penurunan keamanan yang serius. Kembalikan secepatnya setelah penggunaan darurat.

Catatan trusted-proxy:

- auth trusted-proxy yang berhasil dapat mengizinkan sesi Control UI **operator** tanpa
  identitas perangkat
- ini **tidak** berlaku untuk sesi Control UI dengan role node
- reverse proxy loopback pada host yang sama tetap tidak memenuhi auth trusted-proxy; lihat
  [Trusted proxy auth](/id/gateway/trusted-proxy-auth)

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan penyiapan HTTPS.

## Content Security Policy

Control UI dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin**, URL `data:`, dan URL `blob:` yang dibuat secara lokal yang diizinkan. URL gambar `http(s)` jarak jauh dan protocol-relative ditolak oleh browser dan tidak memicu pengambilan jaringan.

Apa artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender, termasuk rute avatar terautentikasi yang diambil UI dan diubah menjadi URL `blob:` lokal.
- URL inline `data:image/...` tetap dirender (berguna untuk payload dalam protokol).
- URL `blob:` lokal yang dibuat oleh Control UI tetap dirender.
- URL avatar jarak jauh yang dikeluarkan oleh metadata channel dihapus pada helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa pengambilan gambar jarak jauh arbitrer dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — selalu aktif dan tidak dapat dikonfigurasi.

## Auth rute avatar

Saat auth gateway dikonfigurasi, endpoint avatar Control UI memerlukan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` hanya mengembalikan gambar avatar kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Permintaan yang tidak terautentikasi ke salah satu rute ditolak (sesuai dengan rute media asisten saudaranya). Ini mencegah rute avatar membocorkan identitas agen pada host yang dilindungi.
- Control UI sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan URL blob yang terautentikasi agar gambar tetap dirender di dashboard.

Jika Anda menonaktifkan auth gateway (tidak disarankan pada host bersama), rute avatar juga menjadi tidak terautentikasi, sejalan dengan bagian gateway lainnya.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun dengan:

```bash
pnpm ui:build
```

Base absolut opsional (saat Anda menginginkan URL aset tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Untuk pengembangan lokal (server dev terpisah):

```bash
pnpm ui:dev
```

Lalu arahkan UI ke URL WS Gateway Anda (misalnya `ws://127.0.0.1:18789`).

## Debugging/pengujian: server dev + Gateway jarak jauh

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan bisa
berbeda dari origin HTTP. Ini berguna saat Anda menginginkan server dev Vite
secara lokal tetapi Gateway berjalan di tempat lain.

1. Jalankan server dev UI: `pnpm ui:dev`
2. Buka URL seperti:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Auth sekali pakai opsional (jika diperlukan):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Catatan:

- `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
- `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) jika memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log permintaan dan Referer. Parameter query lama `?token=` masih diimpor sekali demi kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
- `password` hanya disimpan di memori.
- Saat `gatewayUrl` disetel, UI tidak fallback ke kredensial config atau environment.
  Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang hilang adalah error.
- Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
- `gatewayUrl` hanya diterima pada jendela tingkat atas (tidak di-embed) untuk mencegah clickjacking.
- Deployment Control UI non-loopback harus menyetel `gateway.controlUi.allowedOrigins`
  secara eksplisit (origin lengkap). Ini termasuk penyiapan dev jarak jauh.
- Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal
  yang sangat terkontrol. Artinya mengizinkan origin browser apa pun, bukan “cocokkan host apa pun yang sedang saya gunakan.”
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan
  mode fallback origin Host-header, tetapi ini adalah mode keamanan yang berbahaya.

Contoh:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detail penyiapan akses jarak jauh: [Remote access](/id/gateway/remote).

## Terkait

- [Dashboard](/id/web/dashboard) — dashboard gateway
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [Health Checks](/id/gateway/health) — pemantauan kesehatan gateway
