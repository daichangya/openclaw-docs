---
read_when:
    - Melakukan pairing atau menghubungkan ulang node iOS
    - Menjalankan aplikasi iOS dari source
    - Men-debug penemuan gateway atau perintah canvas
summary: 'Aplikasi node iOS: terhubung ke Gateway, pairing, canvas, dan pemecahan masalah'
title: aplikasi iOS
x-i18n:
    generated_at: "2026-04-25T13:50:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

Ketersediaan: pratinjau internal. Aplikasi iOS belum didistribusikan secara publik.

## Apa yang dilakukan

- Terhubung ke Gateway melalui WebSocket (LAN atau tailnet).
- Mengekspos kemampuan node: Canvas, snapshot layar, pengambilan kamera, Location, mode Talk, Voice wake.
- Menerima perintah `node.invoke` dan melaporkan event status node.

## Persyaratan

- Gateway berjalan di perangkat lain (macOS, Linux, atau Windows melalui WSL2).
- Jalur jaringan:
  - LAN yang sama melalui Bonjour, **atau**
  - Tailnet melalui DNS-SD unicast (contoh domain: `openclaw.internal.`), **atau**
  - Host/port manual (fallback).

## Mulai cepat (pair + connect)

1. Mulai Gateway:

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
permintaan tertunda sebelumnya akan digantikan dan `requestId` baru dibuat.
Jalankan `openclaw devices list` lagi sebelum persetujuan.

Opsional: jika node iOS selalu terhubung dari subnet yang dikontrol ketat, Anda
dapat ikut serta ke persetujuan otomatis node pertama kali dengan CIDR atau IP tepat yang eksplisit:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Ini dinonaktifkan secara default. Ini hanya berlaku untuk pairing `role: node` baru dengan
tanpa scope yang diminta. Pairing operator/browser dan setiap perubahan role, scope, metadata, atau
public-key tetap memerlukan persetujuan manual.

4. Verifikasi koneksi:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push berbasis relay untuk build resmi

Build iOS resmi yang didistribusikan menggunakan relay push eksternal alih-alih memublikasikan token APNs mentah
ke gateway.

Persyaratan sisi gateway:

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

Cara kerja alur ini:

- Aplikasi iOS mendaftar ke relay menggunakan App Attest dan receipt aplikasi.
- Relay mengembalikan handle relay buram plus grant kirim yang dicakup ke registrasi.
- Aplikasi iOS mengambil identitas gateway yang dipair dan menyertakannya dalam registrasi relay, sehingga registrasi berbasis relay didelegasikan ke gateway tertentu tersebut.
- Aplikasi meneruskan registrasi berbasis relay itu ke gateway yang dipair dengan `push.apns.register`.
- Gateway menggunakan handle relay yang tersimpan itu untuk `push.test`, wake latar belakang, dan wake nudge.
- Base URL relay gateway harus cocok dengan URL relay yang ditanamkan ke build iOS resmi/TestFlight.
- Jika aplikasi kemudian terhubung ke gateway lain atau build dengan base URL relay yang berbeda, aplikasi menyegarkan registrasi relay alih-alih menggunakan ulang binding lama.

Yang **tidak** dibutuhkan gateway untuk jalur ini:

- Tidak ada token relay tingkat deployment.
- Tidak ada key APNs langsung untuk pengiriman berbasis relay resmi/TestFlight.

Alur operator yang diharapkan:

1. Pasang build iOS resmi/TestFlight.
2. Atur `gateway.push.apns.relay.baseUrl` pada gateway.
3. Pair aplikasi ke gateway dan biarkan selesai terhubung.
4. Aplikasi memublikasikan `push.apns.register` secara otomatis setelah memiliki token APNs, sesi operator terhubung, dan registrasi relay berhasil.
5. Setelah itu, `push.test`, reconnect wake, dan wake nudge dapat menggunakan registrasi berbasis relay yang tersimpan.

Catatan kompatibilitas:

- `OPENCLAW_APNS_RELAY_BASE_URL` masih berfungsi sebagai override env sementara untuk gateway.

## Alur autentikasi dan kepercayaan

Relay ada untuk menegakkan dua kendala yang tidak dapat diberikan APNs-langsung-di-gateway untuk
build iOS resmi:

- Hanya build iOS OpenClaw asli yang didistribusikan melalui Apple yang dapat menggunakan relay yang di-host.
- Gateway dapat mengirim push berbasis relay hanya untuk perangkat iOS yang dipair dengan gateway tertentu tersebut.

Per hop:

1. `iOS app -> gateway`
   - Aplikasi pertama-tama dipair dengan gateway melalui alur auth Gateway normal.
   - Ini memberi aplikasi sesi node yang terautentikasi plus sesi operator yang terautentikasi.
   - Sesi operator digunakan untuk memanggil `gateway.identity.get`.

2. `iOS app -> relay`
   - Aplikasi memanggil endpoint registrasi relay melalui HTTPS.
   - Registrasi mencakup bukti App Attest plus receipt aplikasi.
   - Relay memvalidasi bundle ID, bukti App Attest, dan receipt Apple, serta mewajibkan
     jalur distribusi resmi/produksi.
   - Inilah yang memblokir build Xcode/dev lokal dari penggunaan relay yang di-host. Build lokal mungkin
     ditandatangani, tetapi tidak memenuhi bukti distribusi Apple resmi yang diharapkan relay.

3. `delegasi identitas gateway`
   - Sebelum registrasi relay, aplikasi mengambil identitas gateway yang dipair dari
     `gateway.identity.get`.
   - Aplikasi menyertakan identitas gateway tersebut dalam payload registrasi relay.
   - Relay mengembalikan handle relay dan grant kirim yang dicakup ke registrasi yang didelegasikan ke
     identitas gateway tersebut.

4. `gateway -> relay`
   - Gateway menyimpan handle relay dan grant kirim dari `push.apns.register`.
   - Pada `push.test`, reconnect wake, dan wake nudge, gateway menandatangani permintaan kirim dengan
     identitas perangkatnya sendiri.
   - Relay memverifikasi grant kirim yang tersimpan dan tanda tangan gateway terhadap identitas
     gateway yang didelegasikan dari registrasi.
   - Gateway lain tidak dapat menggunakan ulang registrasi tersimpan tersebut, bahkan jika somehow memperoleh handlenya.

5. `relay -> APNs`
   - Relay memiliki kredensial APNs produksi dan token APNs mentah untuk build resmi.
   - Gateway tidak pernah menyimpan token APNs mentah untuk build resmi berbasis relay.
   - Relay mengirim push akhir ke APNs atas nama gateway yang dipair.

Mengapa desain ini dibuat:

- Untuk menjaga kredensial APNs produksi tetap berada di luar gateway pengguna.
- Untuk menghindari penyimpanan token APNs build resmi mentah di gateway.
- Untuk mengizinkan penggunaan relay yang di-host hanya untuk build resmi/TestFlight OpenClaw.
- Untuk mencegah satu gateway mengirim wake push ke perangkat iOS yang dimiliki gateway lain.

Build lokal/manual tetap menggunakan APNs langsung. Jika Anda menguji build tersebut tanpa relay, gateway
tetap memerlukan kredensial APNs langsung:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ini adalah env var runtime host gateway, bukan pengaturan Fastlane. `apps/ios/fastlane/.env` hanya menyimpan
auth App Store Connect / TestFlight seperti `ASC_KEY_ID` dan `ASC_ISSUER_ID`; file itu tidak mengonfigurasi
pengiriman APNs langsung untuk build iOS lokal.

Penyimpanan host gateway yang direkomendasikan:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Jangan commit file `.p8` atau menempatkannya di bawah checkout repo.

## Jalur penemuan

### Bonjour (LAN)

Aplikasi iOS menelusuri `_openclaw-gw._tcp` di `local.` dan, bila dikonfigurasi, domain penemuan DNS-SD area luas yang sama. Gateway dalam LAN yang sama muncul secara otomatis dari `local.`; penemuan lintas jaringan dapat menggunakan domain area luas yang dikonfigurasi tanpa mengubah jenis beacon.

### Tailnet (lintas jaringan)

Jika mDNS diblokir, gunakan zona DNS-SD unicast (pilih domain; contoh:
`openclaw.internal.`) dan split DNS Tailscale.
Lihat [Bonjour](/id/gateway/bonjour) untuk contoh CoreDNS.

### Host/port manual

Di Settings, aktifkan **Manual Host** dan masukkan host + port gateway (default `18789`).

## Canvas + A2UI

Node iOS merender canvas WKWebView. Gunakan `node.invoke` untuk mengendalikannya:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Catatan:

- Host canvas Gateway melayani `/__openclaw__/canvas/` dan `/__openclaw__/a2ui/`.
- Ini dilayani dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).
- Node iOS otomatis menavigasi ke A2UI saat terhubung ketika URL host canvas diiklankan.
- Kembali ke scaffold bawaan dengan `canvas.navigate` dan `{"url":""}`.

### Eval / snapshot canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + mode Talk

- Voice wake dan mode Talk tersedia di Settings.
- iOS dapat menangguhkan audio latar belakang; perlakukan fitur suara sebagai best-effort saat aplikasi tidak aktif.

## Error umum

- `NODE_BACKGROUND_UNAVAILABLE`: bawa aplikasi iOS ke foreground (perintah canvas/camera/screen memerlukannya).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway tidak mengiklankan URL host canvas; periksa `canvasHost` di [Konfigurasi Gateway](/id/gateway/configuration).
- Prompt pairing tidak pernah muncul: jalankan `openclaw devices list` dan setujui secara manual.
- Reconnect gagal setelah instal ulang: token pairing Keychain telah dibersihkan; pair ulang node.

## Dokumentasi terkait

- [Pairing](/id/channels/pairing)
- [Discovery](/id/gateway/discovery)
- [Bonjour](/id/gateway/bonjour)
