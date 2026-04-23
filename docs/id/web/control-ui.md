---
read_when:
    - Anda ingin mengoperasikan Gateway dari browser
    - Anda ingin akses Tailnet tanpa tunnel SSH
summary: Control UI berbasis browser untuk Gateway (chat, Node, config)
title: Control UI
x-i18n:
    generated_at: "2026-04-23T09:30:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (browser)

Control UI adalah aplikasi satu halaman **Vite + Lit** kecil yang disajikan oleh Gateway:

- default: `http://<host>:18789/`
- prefiks opsional: atur `gateway.controlUi.basePath` (misalnya `/openclaw`)

Aplikasi ini berbicara **langsung ke WebSocket Gateway** pada port yang sama.

## Buka cepat (lokal)

Jika Gateway berjalan di komputer yang sama, buka:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (atau [http://localhost:18789/](http://localhost:18789/))

Jika halaman gagal dimuat, mulai Gateway terlebih dahulu: `openclaw gateway`.

Auth diberikan selama handshake WebSocket melalui:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header identitas Tailscale Serve saat `gateway.auth.allowTailscale: true`
- header identitas trusted-proxy saat `gateway.auth.mode: "trusted-proxy"`

Panel pengaturan dashboard menyimpan token untuk sesi tab browser saat ini
dan URL Gateway yang dipilih; kata sandi tidak dipertahankan. Onboarding biasanya
membuat token Gateway untuk auth shared-secret pada koneksi pertama, tetapi auth kata
sandi juga berfungsi saat `gateway.auth.mode` adalah `"password"`.

## Pairing perangkat (koneksi pertama)

Saat Anda terhubung ke Control UI dari browser atau perangkat baru, Gateway
memerlukan **persetujuan pairing satu kali** — bahkan jika Anda berada di Tailnet yang sama
dengan `gateway.auth.allowTailscale: true`. Ini adalah langkah keamanan untuk mencegah
akses tidak sah.

**Yang akan Anda lihat:** "disconnected (1008): pairing required"

**Untuk menyetujui perangkat:**

```bash
# Daftar permintaan tertunda
openclaw devices list

# Setujui berdasarkan ID permintaan
openclaw devices approve <requestId>
```

Jika browser mencoba pairing ulang dengan detail auth yang berubah (peran/scope/public
key), permintaan tertunda sebelumnya akan digantikan dan `requestId`
baru dibuat. Jalankan ulang `openclaw devices list` sebelum menyetujui.

Jika browser sudah dipasangkan dan Anda mengubahnya dari akses baca ke
akses tulis/admin, ini diperlakukan sebagai peningkatan persetujuan, bukan
koneksi ulang diam-diam. OpenClaw mempertahankan persetujuan lama tetap aktif, memblokir koneksi ulang yang lebih luas,
dan meminta Anda menyetujui kumpulan scope baru secara eksplisit.

Setelah disetujui, perangkat akan diingat dan tidak memerlukan persetujuan ulang kecuali
Anda mencabutnya dengan `openclaw devices revoke --device <id> --role <role>`. Lihat
[Devices CLI](/id/cli/devices) untuk rotasi dan pencabutan token.

**Catatan:**

- Koneksi browser local loopback langsung (`127.0.0.1` / `localhost`) disetujui
  otomatis.
- Koneksi browser Tailnet dan LAN tetap memerlukan persetujuan eksplisit, bahkan saat
  berasal dari mesin yang sama.
- Setiap profil browser menghasilkan ID perangkat unik, jadi berpindah browser atau
  menghapus data browser akan memerlukan pairing ulang.

## Identitas personal (lokal browser)

Control UI mendukung identitas personal per-browser (nama tampilan dan
avatar) yang dilampirkan ke pesan keluar untuk atribusi dalam sesi bersama. Identitas ini
berada di penyimpanan browser, dicakup ke profil browser saat ini, dan tidak
disinkronkan ke perangkat lain atau disimpan di sisi server di luar metadata kepengarangan
transkrip normal pada pesan yang benar-benar Anda kirim. Menghapus data situs atau
berpindah browser akan meresetnya menjadi kosong.

## Endpoint config runtime

Control UI mengambil pengaturan runtime-nya dari
`/__openclaw/control-ui-config.json`. Endpoint ini dibatasi oleh auth gateway yang sama seperti seluruh surface HTTP lainnya: browser yang tidak terautentikasi tidak dapat
mengambilnya, dan pengambilan yang berhasil memerlukan token/kata sandi Gateway yang sudah valid,
identitas Tailscale Serve, atau identitas trusted-proxy.

## Dukungan bahasa

Control UI dapat melokalkan dirinya saat pemuatan pertama berdasarkan locale browser Anda.
Untuk menimpanya nanti, buka **Overview -> Gateway Access -> Language**. Pemilih
locale berada di kartu Gateway Access, bukan di bawah Appearance.

- Locale yang didukung: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Terjemahan non-Inggris dimuat secara lazy di browser.
- Locale yang dipilih disimpan di penyimpanan browser dan digunakan kembali pada kunjungan berikutnya.
- Kunci terjemahan yang hilang akan fallback ke bahasa Inggris.

## Apa yang dapat dilakukannya (saat ini)

- Chat dengan model melalui Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Streaming pemanggilan tool + kartu output tool live di Chat (event agent)
- Channels: status channel bawaan plus channel plugin bawaan/external, login QR, dan config per-channel (`channels.status`, `web.login.*`, `config.patch`)
- Instances: daftar presence + refresh (`system-presence`)
- Sessions: daftar + override model/thinking/fast/verbose/trace/reasoning per-sesi (`sessions.list`, `sessions.patch`)
- Dreams: status Dreaming, toggle aktif/nonaktif, dan pembaca Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Job Cron: daftar/tambah/edit/jalankan/aktifkan/nonaktifkan + riwayat eksekusi (`cron.*`)
- Skills: status, aktifkan/nonaktifkan, instal, pembaruan API key (`skills.*`)
- Node: daftar + kapabilitas (`node.list`)
- Persetujuan exec: edit allowlist Gateway atau Node + kebijakan ask untuk `exec host=gateway/node` (`exec.approvals.*`)
- Config: lihat/edit `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config: terapkan + restart dengan validasi (`config.apply`) dan bangunkan sesi aktif terakhir
- Penulisan config menyertakan guard base-hash untuk mencegah penimpaan edit bersamaan
- Penulisan config (`config.set`/`config.apply`/`config.patch`) juga melakukan preflight resolusi SecretRef aktif untuk ref dalam payload config yang dikirim; ref aktif yang tidak ter-resolve dalam payload yang dikirim ditolak sebelum penulisan
- Schema config + rendering formulir (`config.schema` / `config.schema.lookup`,
  termasuk field `title` / `description`, petunjuk UI yang cocok, ringkasan child
  langsung, metadata docs pada node nested object/wildcard/array/composition,
  serta schema plugin + channel saat tersedia); editor Raw JSON
  hanya tersedia saat snapshot memiliki round-trip raw yang aman
- Jika sebuah snapshot tidak dapat melakukan round-trip raw dengan aman, Control UI memaksa mode Form dan menonaktifkan mode Raw untuk snapshot tersebut
- Editor Raw JSON "Reset to saved" mempertahankan bentuk yang ditulis secara raw (formatting, komentar, layout `$include`) alih-alih merender ulang snapshot yang sudah diratakan, sehingga edit eksternal tetap bertahan saat reset ketika snapshot dapat melakukan round-trip dengan aman
- Nilai objek SecretRef terstruktur dirender sebagai hanya-baca dalam input teks formulir untuk mencegah kerusakan tak sengaja object-to-string
- Debug: snapshot status/health/models + log event + panggilan RPC manual (`status`, `health`, `models.list`)
- Logs: tail live log file Gateway dengan filter/export (`logs.tail`)
- Update: jalankan update package/git + restart (`update.run`) dengan laporan restart

Catatan panel job Cron:

- Untuk job terisolasi, pengiriman default adalah mengumumkan ringkasan. Anda dapat mengubah ke none jika ingin eksekusi internal saja.
- Field channel/target muncul saat announce dipilih.
- Mode Webhook menggunakan `delivery.mode = "webhook"` dengan `delivery.to` diatur ke URL Webhook HTTP(S) yang valid.
- Untuk job sesi utama, mode pengiriman webhook dan none tersedia.
- Kontrol edit lanjutan mencakup delete-after-run, clear agent override, opsi exact/stagger Cron,
  override model/thinking agent, dan toggle pengiriman best-effort.
- Validasi formulir bersifat inline dengan error tingkat field; nilai yang tidak valid menonaktifkan tombol save sampai diperbaiki.
- Atur `cron.webhookToken` untuk mengirim token bearer khusus, jika dihilangkan Webhook dikirim tanpa header auth.
- Fallback deprecated: job lama yang disimpan dengan `notify: true` masih dapat menggunakan `cron.webhook` sampai dimigrasikan.

## Perilaku chat

- `chat.send` bersifat **non-blocking**: langsung ack dengan `{ runId, status: "started" }` dan respons di-stream melalui event `chat`.
- Mengirim ulang dengan `idempotencyKey` yang sama mengembalikan `{ status: "in_flight" }` saat masih berjalan, dan `{ status: "ok" }` setelah selesai.
- Respons `chat.history` dibatasi ukurannya demi keamanan UI. Saat entri transkrip terlalu besar, Gateway dapat memotong field teks panjang, menghilangkan blok metadata berat, dan mengganti pesan berukuran terlalu besar dengan placeholder (`[chat.history omitted: message too large]`).
- `chat.history` juga menghapus tag directive inline yang hanya untuk tampilan dari teks assistant yang terlihat (misalnya `[[reply_to_*]]` dan `[[audio_as_voice]]`), payload XML tool-call plaintext (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), serta token kontrol model ASCII/full-width yang bocor, dan menghilangkan entri assistant yang seluruh teks terlihatnya hanya token senyap yang persis `NO_REPLY` / `no_reply`.
- `chat.inject` menambahkan catatan assistant ke transkrip sesi dan menyiarkan event `chat` untuk pembaruan khusus UI (tanpa eksekusi agent, tanpa pengiriman channel).
- Pemilih model dan thinking pada header chat langsung menambal sesi aktif melalui `sessions.patch`; ini adalah override sesi yang persisten, bukan opsi kirim satu giliran saja.
- Hentikan:
  - Klik **Stop** (memanggil `chat.abort`)
  - Ketik `/stop` (atau frasa abort mandiri seperti `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) untuk membatalkan out-of-band
  - `chat.abort` mendukung `{ sessionKey }` (tanpa `runId`) untuk membatalkan semua eksekusi aktif untuk sesi tersebut
- Retensi parsial abort:
  - Saat sebuah eksekusi dibatalkan, teks assistant parsial masih dapat ditampilkan di UI
  - Gateway menyimpan teks assistant parsial yang dibatalkan ke riwayat transkrip ketika output yang di-buffer ada
  - Entri yang disimpan menyertakan metadata abort sehingga konsumen transkrip dapat membedakan parsial abort dari output penyelesaian normal

## Embed ter-host

Pesan assistant dapat merender konten web ter-host secara inline dengan shortcode `[embed ...]`.
Kebijakan sandbox iframe dikontrol oleh
`gateway.controlUi.embedSandbox`:

- `strict`: menonaktifkan eksekusi script di dalam embed ter-host
- `scripts`: mengizinkan embed interaktif sambil menjaga isolasi origin; ini
  adalah default dan biasanya cukup untuk game/widget browser mandiri
- `trusted`: menambahkan `allow-same-origin` di atas `allow-scripts` untuk dokumen
  situs yang sama yang memang memerlukan hak istimewa yang lebih kuat

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

Gunakan `trusted` hanya saat dokumen ter-embed memang memerlukan
perilaku same-origin. Untuk sebagian besar game yang dihasilkan agent dan kanvas interaktif, `scripts` adalah
pilihan yang lebih aman.

URL embed `http(s)` eksternal absolut tetap diblokir secara default. Jika Anda
memang ingin `[embed url="https://..."]` memuat halaman pihak ketiga, atur
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Akses Tailnet (disarankan)

### Tailscale Serve terintegrasi (diutamakan)

Pertahankan Gateway di loopback dan biarkan Tailscale Serve mem-proxy-nya dengan HTTPS:

```bash
openclaw gateway --tailscale serve
```

Buka:

- `https://<magicdns>/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

Secara default, permintaan Serve Control UI/WebSocket dapat diautentikasi melalui header identitas Tailscale
(`tailscale-user-login`) saat `gateway.auth.allowTailscale` bernilai `true`. OpenClaw
memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` menggunakan
`tailscale whois` dan mencocokkannya dengan header, dan hanya menerima ini saat
permintaan mencapai loopback dengan header `x-forwarded-*` milik Tailscale. Atur
`gateway.auth.allowTailscale: false` jika Anda ingin mewajibkan kredensial
shared-secret eksplisit bahkan untuk lalu lintas Serve. Lalu gunakan `gateway.auth.mode: "token"` atau
`"password"`.
Untuk jalur identitas Serve async tersebut, upaya auth yang gagal untuk IP klien
dan cakupan auth yang sama diserialkan sebelum penulisan rate-limit. Karena itu
percobaan buruk bersamaan dari browser yang sama dapat menampilkan `retry later` pada
permintaan kedua alih-alih dua mismatch biasa yang berlomba secara paralel.
Auth Serve tanpa token mengasumsikan host gateway tepercaya. Jika kode lokal yang tidak tepercaya
dapat berjalan di host itu, wajibkan auth token/kata sandi.

### Bind ke Tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Lalu buka:

- `http://<tailscale-ip>:18789/` (atau `gateway.controlUi.basePath` yang Anda konfigurasi)

Tempel secret bersama yang cocok ke pengaturan UI (dikirim sebagai
`connect.params.auth.token` atau `connect.params.auth.password`).

## HTTP tidak aman

Jika Anda membuka dashboard melalui HTTP plaintext (`http://<lan-ip>` atau `http://<tailscale-ip>`),
browser berjalan dalam **konteks non-aman** dan memblokir WebCrypto. Secara default,
OpenClaw **memblokir** koneksi Control UI tanpa identitas perangkat.

Pengecualian yang didokumentasikan:

- kompatibilitas HTTP tidak aman khusus localhost dengan `gateway.controlUi.allowInsecureAuth=true`
- auth operator Control UI yang berhasil melalui `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Perbaikan yang direkomendasikan:** gunakan HTTPS (Tailscale Serve) atau buka UI secara lokal:

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

- Mengizinkan sesi localhost Control UI untuk lanjut tanpa identitas perangkat dalam
  konteks HTTP non-aman.
- Tidak melewati pemeriksaan pairing.
- Tidak melonggarkan persyaratan identitas perangkat remote (non-localhost).

**Hanya break-glass:**

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
penurunan keamanan yang parah. Kembalikan secepatnya setelah penggunaan darurat.

Catatan trusted-proxy:

- auth trusted-proxy yang berhasil dapat mengizinkan sesi operator Control UI tanpa
  identitas perangkat
- ini **tidak** berlaku untuk sesi Control UI peran Node
- reverse proxy loopback host yang sama tetap tidak memenuhi auth trusted-proxy; lihat
  [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)

Lihat [Tailscale](/id/gateway/tailscale) untuk panduan setup HTTPS.

## Content Security Policy

Control UI dikirim dengan kebijakan `img-src` yang ketat: hanya aset **same-origin** dan URL `data:` yang diizinkan. URL gambar remote `http(s)` dan protocol-relative ditolak oleh browser dan tidak mengeluarkan fetch jaringan.

Apa artinya dalam praktik:

- Avatar dan gambar yang disajikan di bawah path relatif (misalnya `/avatars/<id>`) tetap dirender.
- URL inline `data:image/...` tetap dirender (berguna untuk payload in-protocol).
- URL avatar remote yang dipancarkan oleh metadata channel dihapus pada helper avatar Control UI dan diganti dengan logo/badge bawaan, sehingga channel yang disusupi atau berbahaya tidak dapat memaksa fetch gambar remote arbitrer dari browser operator.

Anda tidak perlu mengubah apa pun untuk mendapatkan perilaku ini — selalu aktif dan tidak dapat dikonfigurasi.

## Auth rute avatar

Saat auth gateway dikonfigurasi, endpoint avatar Control UI memerlukan token gateway yang sama seperti API lainnya:

- `GET /avatar/<agentId>` mengembalikan gambar avatar hanya kepada pemanggil yang terautentikasi. `GET /avatar/<agentId>?meta=1` mengembalikan metadata avatar dengan aturan yang sama.
- Request yang tidak terautentikasi ke kedua rute ditolak (sesuai dengan rute sibling assistant-media). Ini mencegah rute avatar membocorkan identitas agent pada host yang sebaliknya dilindungi.
- Control UI sendiri meneruskan token gateway sebagai header bearer saat mengambil avatar, dan menggunakan blob URL yang terautentikasi sehingga gambar tetap dirender di dashboard.

Jika Anda menonaktifkan auth gateway (tidak disarankan pada host bersama), rute avatar juga menjadi tidak terautentikasi, sejalan dengan bagian gateway lainnya.

## Membangun UI

Gateway menyajikan file statis dari `dist/control-ui`. Bangun dengan:

```bash
pnpm ui:build
```

Base absolut opsional (saat Anda menginginkan URL aset yang tetap):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Untuk pengembangan lokal (server dev terpisah):

```bash
pnpm ui:dev
```

Lalu arahkan UI ke URL WS Gateway Anda (misalnya `ws://127.0.0.1:18789`).

## Debugging/testing: server dev + Gateway remote

Control UI adalah file statis; target WebSocket dapat dikonfigurasi dan dapat
berbeda dari origin HTTP. Ini berguna saat Anda menginginkan server dev Vite
secara lokal tetapi Gateway berjalan di tempat lain.

1. Mulai server dev UI: `pnpm ui:dev`
2. Buka URL seperti:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Auth satu kali opsional (jika diperlukan):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Catatan:

- `gatewayUrl` disimpan di localStorage setelah dimuat dan dihapus dari URL.
- `token` sebaiknya diteruskan melalui fragmen URL (`#token=...`) bila memungkinkan. Fragmen tidak dikirim ke server, sehingga menghindari kebocoran log request dan Referer. Query param lama `?token=` masih diimpor sekali untuk kompatibilitas, tetapi hanya sebagai fallback, dan langsung dihapus setelah bootstrap.
- `password` hanya disimpan di memori.
- Saat `gatewayUrl` diatur, UI tidak fallback ke kredensial config atau environment.
  Berikan `token` (atau `password`) secara eksplisit. Kredensial eksplisit yang tidak ada adalah sebuah error.
- Gunakan `wss://` saat Gateway berada di belakang TLS (Tailscale Serve, proxy HTTPS, dll.).
- `gatewayUrl` hanya diterima di jendela top-level (bukan embed) untuk mencegah clickjacking.
- Deployment Control UI non-loopback harus mengatur `gateway.controlUi.allowedOrigins`
  secara eksplisit (origin penuh). Ini termasuk setup dev remote.
- Jangan gunakan `gateway.controlUi.allowedOrigins: ["*"]` kecuali untuk pengujian lokal
  yang sangat terkontrol. Ini berarti mengizinkan origin browser apa pun, bukan “cocokkan host apa pun yang sedang saya gunakan.”
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

Detail setup akses remote: [Remote access](/id/gateway/remote).

## Terkait

- [Dashboard](/id/web/dashboard) — dashboard Gateway
- [WebChat](/id/web/webchat) — antarmuka chat berbasis browser
- [TUI](/id/web/tui) — antarmuka pengguna terminal
- [Health Checks](/id/gateway/health) — pemantauan kesehatan Gateway
