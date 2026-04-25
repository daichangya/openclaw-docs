---
read_when:
    - Melakukan pairing atau menyambungkan ulang node Android
    - Men-debug penemuan gateway atau auth Android
    - Memverifikasi paritas riwayat chat di seluruh klien
summary: 'Aplikasi Android (node): runbook koneksi + permukaan perintah Connect/Chat/Voice/Canvas'
title: Aplikasi Android
x-i18n:
    generated_at: "2026-04-25T13:50:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **Catatan:** Aplikasi Android belum dirilis secara publik. Kode sumber tersedia di [repositori OpenClaw](https://github.com/openclaw/openclaw) di bawah `apps/android`. Anda dapat membangunnya sendiri menggunakan Java 17 dan Android SDK (`./gradlew :app:assemblePlayDebug`). Lihat [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) untuk instruksi build.

## Snapshot dukungan

- Peran: aplikasi node pendamping (Android tidak meng-host Gateway).
- Gateway diperlukan: ya (jalankan di macOS, Linux, atau Windows melalui WSL2).
- Instalasi: [Getting Started](/id/start/getting-started) + [Pairing](/id/channels/pairing).
- Gateway: [Runbook](/id/gateway) + [Configuration](/id/gateway/configuration).
  - Protokol: [Gateway protocol](/id/gateway/protocol) (node + control plane).

## Kontrol sistem

Kontrol sistem (launchd/systemd) berada di host Gateway. Lihat [Gateway](/id/gateway).

## Runbook koneksi

Aplikasi node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android terhubung langsung ke WebSocket Gateway dan menggunakan device pairing (`role: node`).

Untuk Tailscale atau host publik, Android memerlukan endpoint aman:

- Disarankan: Tailscale Serve / Funnel dengan `https://<magicdns>` / `wss://<magicdns>`
- Juga didukung: URL Gateway `wss://` lain apa pun dengan endpoint TLS nyata
- `ws://` plaintext tetap didukung pada alamat LAN privat / host `.local`, serta `localhost`, `127.0.0.1`, dan bridge emulator Android (`10.0.2.2`)

### Prasyarat

- Anda dapat menjalankan Gateway di mesin “master”.
- Perangkat/emulator Android dapat menjangkau WebSocket gateway:
  - LAN yang sama dengan mDNS/NSD, **atau**
  - Tailnet Tailscale yang sama menggunakan Wide-Area Bonjour / unicast DNS-SD (lihat di bawah), **atau**
  - Host/port gateway manual (fallback)
- Pairing mobile tailnet/publik **tidak** menggunakan endpoint `ws://` IP tailnet mentah. Gunakan Tailscale Serve atau URL `wss://` lain sebagai gantinya.
- Anda dapat menjalankan CLI (`openclaw`) di mesin gateway (atau melalui SSH).

### 1) Mulai Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Konfirmasikan di log bahwa Anda melihat sesuatu seperti:

- `listening on ws://0.0.0.0:18789`

Untuk akses Android remote melalui Tailscale, gunakan Serve/Funnel daripada bind tailnet mentah:

```bash
openclaw gateway --tailscale serve
```

Ini memberi Android endpoint `wss://` / `https://` yang aman. Penyiapan `gateway.bind: "tailnet"` biasa saja tidak cukup untuk pairing Android remote pertama kali kecuali Anda juga mengakhiri TLS secara terpisah.

### 2) Verifikasi discovery (opsional)

Dari mesin gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Catatan debug lebih lanjut: [Bonjour](/id/gateway/bonjour).

Jika Anda juga mengonfigurasi domain discovery wide-area, bandingkan dengan:

```bash
openclaw gateway discover --json
```

Itu menampilkan `local.` plus domain wide-area yang dikonfigurasi dalam satu proses dan menggunakan endpoint layanan yang telah di-resolve
alih-alih petunjuk TXT saja.

#### Discovery tailnet (Vienna ⇄ London) melalui unicast DNS-SD

Discovery NSD/mDNS Android tidak akan melintasi jaringan. Jika node Android dan gateway Anda berada di jaringan berbeda tetapi terhubung melalui Tailscale, gunakan Wide-Area Bonjour / unicast DNS-SD.

Discovery saja tidak cukup untuk pairing Android tailnet/publik. Rute yang ditemukan tetap memerlukan endpoint aman (`wss://` atau Tailscale Serve):

1. Siapkan zona DNS-SD (contoh `openclaw.internal.`) di host gateway dan publikasikan record `_openclaw-gw._tcp`.
2. Konfigurasikan Tailscale split DNS untuk domain pilihan Anda yang menunjuk ke server DNS tersebut.

Detail dan contoh konfigurasi CoreDNS: [Bonjour](/id/gateway/bonjour).

### 3) Hubungkan dari Android

Di aplikasi Android:

- Aplikasi mempertahankan koneksi gateway melalui **layanan foreground** (notifikasi persisten).
- Buka tab **Connect**.
- Gunakan mode **Setup Code** atau **Manual**.
- Jika discovery terblokir, gunakan host/port manual di **Advanced controls**. Untuk host LAN privat, `ws://` tetap berfungsi. Untuk host Tailscale/publik, aktifkan TLS dan gunakan endpoint `wss://` / Tailscale Serve.

Setelah pairing pertama berhasil, Android otomatis menyambung ulang saat diluncurkan:

- Endpoint manual (jika diaktifkan), jika tidak
- Gateway yang terakhir ditemukan (best-effort).

### 4) Setujui pairing (CLI)

Di mesin gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detail pairing: [Pairing](/id/channels/pairing).

Opsional: jika node Android selalu terhubung dari subnet yang dikendalikan ketat,
Anda dapat memilih untuk auto-approval Node pertama kali dengan CIDR eksplisit atau IP persis:

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
tanpa scope yang diminta. Pairing operator/browser dan perubahan role, scope, metadata, atau
public key apa pun tetap memerlukan persetujuan manual.

### 5) Verifikasi bahwa node terhubung

- Melalui status node:

  ```bash
  openclaw nodes status
  ```

- Melalui Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + riwayat

Tab Chat Android mendukung pemilihan sesi (default `main`, ditambah sesi lain yang sudah ada):

- Riwayat: `chat.history` (dinormalisasi untuk tampilan; tag directive inline dihapus dari teks yang terlihat, payload XML pemanggilan tool plaintext (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan tool yang dipotong) serta token kontrol model ASCII/full-width yang bocor dihapus, baris asisten token-senyap murni seperti `NO_REPLY` / `no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder)
- Kirim: `chat.send`
- Push update (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + kamera

#### Gateway Canvas Host (disarankan untuk konten web)

Jika Anda ingin node menampilkan HTML/CSS/JS nyata yang dapat diedit agen di disk, arahkan node ke host canvas Gateway.

Catatan: node memuat canvas dari server HTTP Gateway (port yang sama dengan `gateway.port`, default `18789`).

1. Buat `~/.openclaw/workspace/canvas/index.html` di host gateway.

2. Arahkan node ke sana (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opsional): jika kedua perangkat berada di Tailscale, gunakan nama MagicDNS atau IP tailnet alih-alih `.local`, misalnya `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Server ini menyisipkan klien live-reload ke HTML dan memuat ulang saat file berubah.
Host A2UI berada di `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Perintah Canvas (hanya foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gunakan `{"url":""}` atau `{"url":"/"}` untuk kembali ke scaffold default). `canvas.snapshot` mengembalikan `{ format, base64 }` (default `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias lama `canvas.a2ui.pushJSONL`)

Perintah kamera (hanya foreground; dikendalikan izin):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Lihat [Camera node](/id/nodes/camera) untuk parameter dan helper CLI.

### 8) Voice + permukaan perintah Android yang diperluas

- Voice: Android menggunakan satu alur mic on/off di tab Voice dengan penangkapan transkrip dan playback `talk.speak`. TTS sistem lokal hanya digunakan saat `talk.speak` tidak tersedia. Voice berhenti saat aplikasi keluar dari foreground.
- Toggle voice wake/talk-mode saat ini dihapus dari UX/runtime Android.
- Keluarga perintah Android tambahan (ketersediaan bergantung pada perangkat + izin):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (lihat [Notification forwarding](#notification-forwarding) di bawah)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Titik masuk asisten

Android mendukung peluncuran OpenClaw dari pemicu asisten sistem (Google
Assistant). Saat dikonfigurasi, menahan tombol home atau mengatakan "Hey Google, ask
OpenClaw..." akan membuka aplikasi dan meneruskan prompt ke composer chat.

Ini menggunakan metadata **App Actions** Android yang dideklarasikan di manifest aplikasi. Tidak
ada konfigurasi tambahan yang diperlukan di sisi gateway -- intent asisten
ditangani sepenuhnya oleh aplikasi Android dan diteruskan sebagai pesan chat normal.

<Note>
Ketersediaan App Actions bergantung pada perangkat, versi Google Play Services,
dan apakah pengguna telah menetapkan OpenClaw sebagai aplikasi asisten default.
</Note>

## Penerusan notifikasi

Android dapat meneruskan notifikasi perangkat ke gateway sebagai peristiwa. Beberapa kontrol memungkinkan Anda membatasi notifikasi mana yang diteruskan dan kapan.

| Key                              | Tipe           | Deskripsi                                                                                           |
| -------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Hanya teruskan notifikasi dari nama paket ini. Jika disetel, semua paket lain diabaikan.           |
| `notifications.denyPackages`     | string[]       | Jangan pernah teruskan notifikasi dari nama paket ini. Diterapkan setelah `allowPackages`.         |
| `notifications.quietHours.start` | string (HH:mm) | Awal jendela jam tenang (waktu lokal perangkat). Notifikasi ditekan selama jendela ini.            |
| `notifications.quietHours.end`   | string (HH:mm) | Akhir jendela jam tenang.                                                                           |
| `notifications.rateLimit`        | number         | Jumlah maksimum notifikasi yang diteruskan per paket per menit. Notifikasi berlebih dibuang.       |

Pemilih notifikasi juga menggunakan perilaku yang lebih aman untuk peristiwa notifikasi yang diteruskan, mencegah penerusan notifikasi sistem sensitif secara tidak sengaja.

Contoh konfigurasi:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Penerusan notifikasi memerlukan izin Android Notification Listener. Aplikasi akan meminta izin ini selama penyiapan.
</Note>

## Terkait

- [Aplikasi iOS](/id/platforms/ios)
- [Nodes](/id/nodes)
- [Pemecahan masalah node Android](/id/nodes/troubleshooting)
