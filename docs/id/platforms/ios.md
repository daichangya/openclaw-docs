---
read_when:
    - Melakukan pairing atau menghubungkan ulang node iOS
    - Menjalankan aplikasi iOS dari source
    - Men-debug discovery gateway atau perintah canvas
summary: 'Aplikasi node iOS: terhubung ke Gateway, pairing, canvas, dan pemecahan masalah'
title: Aplikasi iOS
x-i18n:
    generated_at: "2026-04-07T09:15:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3e0a6e33e72d4c9f1f17ef70a1b67bae9ebe4a2dca16677ea6b28d0ddac1b4e
    source_path: platforms/ios.md
    workflow: 15
---

# Aplikasi iOS (Node)

Ketersediaan: pratinjau internal. Aplikasi iOS belum didistribusikan secara publik.

## Yang dilakukannya

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos capability node: Canvas, snapshot layar, tangkapan kamera, lokasi, mode bicara, voice wake.
- Menerima perintah `node.invoke` dan melaporkan event status node.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui unicast DNS-SD (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (fallback).

## Mulai cepat (pair + connect)

1. Jalankan Gateway:

```bash
openclaw gateway --port 18789
```

2. Di aplikasi iOS, buka Settings dan pilih gateway yang ditemukan (atau aktifkan Manual Host dan masukkan host/port).

3. Setujui permintaan pairing di host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Jika aplikasi mencoba pairing ulang dengan detail auth yang berubah (role/scopes/public key),
permintaan tertunda sebelumnya akan digantikan dan `requestId` baru akan dibuat.
Jalankan `openclaw devices list` lagi sebelum menyetujui.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan push relay eksternal alih-alih menerbitkan token APNs mentah
ke gateway.

Persyaratan di sisi gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Cara kerja alurnya:

- Aplikasi iOS mendaftar ke relay menggunakan App Attest dan receipt aplikasi.
- Relay mengembalikan handle relay opak plus grant pengiriman yang dicakup ke registrasi.
- Aplikasi iOS mengambil identitas gateway yang di-pair dan menyertakannya dalam registrasi relay, sehingga registrasi berbasis relay didelegasikan ke gateway spesifik tersebut.
- Aplikasi meneruskan registrasi berbasis relay itu ke gateway yang di-pair dengan `push.apns.register`.
- Gateway menggunakan handle relay yang tersimpan itu untuk `push.test`, wake latar belakang, dan wake nudge.
- Base URL relay gateway harus cocok dengan URL relay yang ditanamkan ke dalam build iOS resmi/TestFlight.
- Jika aplikasi kemudian terhubung ke gateway lain atau build dengan base URL relay yang berbeda, aplikasi akan me-refresh registrasi relay alih-alih menggunakan ulang binding lama.

Yang **tidak** dibutuhkan gateway untuk jalur ini:

- Tidak ada token relay skala deployment.
- Tidak ada key APNs langsung untuk pengiriman berbasis relay resmi/TestFlight.

Alur operator yang diharapkan:

1. Instal build iOS resmi/TestFlight.
2. Setel `gateway.push.apns.relay.baseUrl` pada gateway.
3. Pair aplikasi ke gateway dan biarkan aplikasi menyelesaikan koneksinya.
4. Aplikasi menerbitkan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan registrasi relay berhasil.
5. Setelah itu, `push.test`, reconnect wake, dan wake nudge dapat menggunakan registrasi berbasis relay yang tersimpan.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai override env sementara untuk gateway.

## Alur autentikasi dan kepercayaan

Relay ada untuk menegakkan dua batasan yang tidak dapat disediakan APNs langsung-di-gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay yang di-host.
- Gateway hanya dapat mengirim push berbasis relay untuk perangkat iOS yang melakukan pairing dengan gateway spesifik tersebut.

Lompatan demi lompatan:

1. `iOS app -> gateway`
   - Aplikasi pertama-tama melakukan pairing dengan gateway melalui alur auth Gateway normal.
   - Ini memberi aplikasi sesi node yang terautentikasi plus sesi operator yang terautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikasi memanggil endpoint registrasi relay melalui HTTPS.
   - Registrasi mencakup proof App Attest plus receipt aplikasi.
   - Relay memvalidasi bundle ID, proof App Attest, dan receipt Apple, serta mewajibkan jalur distribusi resmi/produksi.
   - Inilah yang memblokir build Xcode/dev lokal agar tidak dapat menggunakan relay yang di-host. Build lokal bisa saja
     ditandatangani, tetapi tidak memenuhi proof distribusi Apple resmi yang diharapkan relay.

3. `gateway identity delegation`
   - Sebelum registrasi relay, aplikasi mengambil identitas gateway yang di-pair dari
     `gateway.identity.get`.
   - Aplikasi menyertakan identitas gateway itu dalam payload registrasi relay.
   - Relay mengembalikan handle relay dan grant pengiriman yang dicakup ke registrasi yang didelegasikan ke
     identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan handle relay dan grant pengiriman dari `push.apns.register`.
   - Pada `push.test`, reconnect wake, dan wake nudge, gateway menandatangani permintaan kirim dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi baik grant pengiriman yang tersimpan maupun tanda tangan gateway terhadap identitas
     gateway yang didelegasikan dari registrasi.
   - Gateway lain tidak dapat menggunakan ulang registrasi yang tersimpan itu, meskipun somehow memperoleh handle tersebut.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push akhir ke APNs atas nama gateway yang di-pair.

Mengapa desain ini dibuat:

- Untuk menjaga kredensial APNs produksi tetap di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs build resmi mentah di gateway.
- Untuk mengizinkan penggunaan relay yang di-host hanya untuk build OpenClaw resmi/TestFlight.
- Untuk mencegah satu gateway mengirim wake push ke perangkat iOS yang dimiliki gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay,
gateway tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah env var runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan
auth App Store Connect / TestFlight seperti `ASC_KEY_ID` dan `ASC_ISSUER_ID`; itu tidak mengonfigurasi
pengiriman APNs langsung untuk build iOS lokal.

Penyimpanan host gateway yang direkomendasikan:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Jangan commit file `.p8` atau meletakkannya di bawah checkout repo.

## Jalur discovery

### Bonjour (LAN)

Aplikasi iOS menelusuri `_openclaw-gw._tcp` di `local.` dan, bila dikonfigurasi, domain discovery DNS-SD area luas yang sama. Gateway di LAN yang sama muncul secara otomatis dari `local.`; discovery lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh:
`openclaw.internal.`) dan Tailscale split DNS.
Lihat [Bonjour](/id/gateway/bonjour) untuk contoh CoreDNS.

### Host/port manual

Di Settings, aktifkan **Manual Host** dan masukkan host + port gateway (default `18789`).

## Canvas + A2UI

Node iOS merender canvas WKWebView. Gunakan `node.invoke` untuk mengendalikannya:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Catatan:

- Host canvas Gateway menyajikan `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/`.
- Disajikan dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
- Node iOS otomatis bernavigasi ke A2UI saat connect ketika URL host canvas diumumkan.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + mode bicara

- Voice wake dan mode bicara tersedia di Settings.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai best-effort saat aplikasi tidak aktif.

## Error umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke foreground (perintah canvas/kamera/layar memerlukannya).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway tidak mengumumkan URL host canvas; periksa `canvasHost` di [konfigurasi Gateway](/id/gateway/configuration).
- Prompt pairing tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Reconnect gagal setelah instal ulang: token pairing Keychain telah dihapus; pair ulang node.

## Dokumen terkait

- [Pairing](/id/channels/pairing)
- [Discovery](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
