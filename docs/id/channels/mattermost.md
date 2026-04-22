---
read_when:
    - Menyiapkan Mattermost
    - Men-debug routing Mattermost
summary: Penyiapan bot Mattermost dan konfigurasi OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T04:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: plugin bawaan (token bot + event WebSocket). Channel, grup, dan DM didukung.
Mattermost adalah platform perpesanan tim yang dapat di-host sendiri; lihat situs resmi di
[mattermost.com](https://mattermost.com) untuk detail produk dan unduhan.

## Plugin bawaan

Mattermost tersedia sebagai plugin bawaan di rilis OpenClaw saat ini, jadi build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Mattermost,
instal secara manual:

Instal melalui CLI (registri npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat

1. Pastikan plugin Mattermost tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun bot Mattermost dan salin **token bot**.
3. Salin **URL dasar** Mattermost (misalnya, `https://chat.example.com`).
4. Konfigurasikan OpenClaw dan mulai gateway.

Konfigurasi minimal:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Perintah slash native

Perintah slash native bersifat opt-in. Saat diaktifkan, OpenClaw mendaftarkan perintah slash `oc_*` melalui
API Mattermost dan menerima callback POST di server HTTP gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Gunakan saat Mattermost tidak dapat langsung menjangkau gateway (reverse proxy/URL publik).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Catatan:

- `native: "auto"` secara default dinonaktifkan untuk Mattermost. Tetapkan `native: true` untuk mengaktifkan.
- Jika `callbackUrl` dihilangkan, OpenClaw menurunkannya dari host/port gateway + `callbackPath`.
- Untuk penyiapan multi-akun, `commands` dapat diatur di level atas atau di bawah
  `channels.mattermost.accounts.<id>.commands` (nilai akun menimpa field level atas).
- Callback perintah divalidasi dengan token per-perintah yang dikembalikan oleh
  Mattermost saat OpenClaw mendaftarkan perintah `oc_*`.
- Callback slash gagal tertutup saat pendaftaran gagal, startup bersifat parsial, atau
  token callback tidak cocok dengan salah satu perintah yang terdaftar.
- Persyaratan keterjangkauan: endpoint callback harus dapat dijangkau dari server Mattermost.
  - Jangan tetapkan `callbackUrl` ke `localhost` kecuali Mattermost berjalan pada host/network namespace yang sama dengan OpenClaw.
  - Jangan tetapkan `callbackUrl` ke URL dasar Mattermost Anda kecuali URL tersebut me-reverse-proxy `/api/channels/mattermost/command` ke OpenClaw.
  - Pemeriksaan cepat adalah `curl https://<gateway-host>/api/channels/mattermost/command`; permintaan GET seharusnya mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.
- Persyaratan allowlist egress Mattermost:
  - Jika callback Anda menargetkan alamat private/tailnet/internal, tetapkan Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` agar menyertakan host/domain callback.
  - Gunakan entri host/domain, bukan URL lengkap.
    - Baik: `gateway.tailnet-name.ts.net`
    - Buruk: `https://gateway.tailnet-name.ts.net`

## Variabel lingkungan (akun default)

Tetapkan ini pada host gateway jika Anda lebih memilih env vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Env vars hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai konfigurasi.

## Mode chat

Mattermost merespons DM secara otomatis. Perilaku channel dikendalikan oleh `chatmode`:

- `oncall` (default): hanya merespons saat di-@mention di channel.
- `onmessage`: merespons setiap pesan channel.
- `onchar`: merespons saat pesan dimulai dengan prefiks pemicu.

Contoh konfigurasi:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Catatan:

- `onchar` tetap merespons @mention eksplisit.
- `channels.mattermost.requireMention` tetap dihormati untuk konfigurasi lama, tetapi `chatmode` lebih disarankan.

## Threading dan sesi

Gunakan `channels.mattermost.replyToMode` untuk mengontrol apakah balasan channel dan grup tetap di
channel utama atau memulai thread di bawah post pemicu.

- `off` (default): hanya membalas dalam thread saat post masuk memang sudah berada di thread.
- `first`: untuk post channel/grup level atas, mulai thread di bawah post tersebut dan arahkan
  percakapan ke sesi dengan cakupan thread.
- `all`: perilakunya sama seperti `first` untuk Mattermost saat ini.
- Pesan langsung mengabaikan pengaturan ini dan tetap non-threaded.

Contoh konfigurasi:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Catatan:

- Sesi dengan cakupan thread menggunakan id post pemicu sebagai root thread.
- `first` dan `all` saat ini setara karena setelah Mattermost memiliki root thread,
  chunk lanjutan dan media terus berlanjut di thread yang sama.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim yang tidak dikenal mendapatkan kode pairing).
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Channel (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dibatasi mention).
- Allowlist pengirim dengan `channels.mattermost.groupAllowFrom` (ID pengguna disarankan).
- Override mention per-channel berada di bawah `channels.mattermost.groups.<channelId>.requireMention`
  atau `channels.mattermost.groups["*"].requireMention` untuk default.
- Pencocokan `@username` bersifat dapat berubah dan hanya diaktifkan saat `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Channel terbuka: `channels.mattermost.groupPolicy="open"` (dibatasi mention).
- Catatan runtime: jika `channels.mattermost` sama sekali tidak ada, runtime kembali ke `groupPolicy="allowlist"` untuk pemeriksaan grup (meskipun `channels.defaults.groupPolicy` diatur).

Contoh:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Target untuk pengiriman keluar

Gunakan format target ini dengan `openclaw message send` atau Cron/Webhook:

- `channel:<id>` untuk sebuah channel
- `user:<id>` untuk sebuah DM
- `@username` untuk sebuah DM (di-resolve melalui API Mattermost)

ID buram polos (seperti `64ifufp...`) **ambigu** di Mattermost (ID pengguna vs ID channel).

OpenClaw me-resolve-nya dengan **mengutamakan pengguna**:

- Jika ID tersebut ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan me-resolve channel langsung melalui `/api/v4/channels/direct`.
- Jika tidak, ID tersebut diperlakukan sebagai **ID channel**.

Jika Anda membutuhkan perilaku yang deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).

## Retry channel DM

Saat OpenClaw mengirim ke target DM Mattermost dan perlu me-resolve channel langsung terlebih dahulu, ia
secara default mencoba ulang kegagalan pembuatan direct-channel yang bersifat sementara.

Gunakan `channels.mattermost.dmChannelRetry` untuk menyetel perilaku itu secara global untuk plugin Mattermost,
atau `channels.mattermost.accounts.<id>.dmChannelRetry` untuk satu akun.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Catatan:

- Ini hanya berlaku untuk pembuatan channel DM (`/api/v4/channels/direct`), bukan setiap panggilan API Mattermost.
- Retry berlaku untuk kegagalan sementara seperti rate limit, respons 5xx, serta error jaringan atau timeout.
- Error klien 4xx selain `429` diperlakukan sebagai permanen dan tidak dicoba ulang.

## Streaming pratinjau

Mattermost melakukan streaming pemikiran, aktivitas alat, dan teks balasan parsial ke dalam satu **post pratinjau draf** yang diselesaikan di tempat saat jawaban akhir aman untuk dikirim. Pratinjau diperbarui pada id post yang sama alih-alih membanjiri channel dengan pesan per-chunk. Hasil akhir media/error membatalkan edit pratinjau yang tertunda dan menggunakan pengiriman normal alih-alih membuang post pratinjau sekali pakai.

Aktifkan melalui `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Catatan:

- `partial` adalah pilihan yang umum: satu post pratinjau yang diedit saat balasan bertambah, lalu diselesaikan dengan jawaban lengkap.
- `block` menggunakan chunk draf bergaya append di dalam post pratinjau.
- `progress` menampilkan pratinjau status saat menghasilkan dan hanya mem-posting jawaban akhir saat selesai.
- `off` menonaktifkan streaming pratinjau.
- Jika stream tidak dapat diselesaikan di tempat (misalnya post dihapus di tengah stream), OpenClaw akan kembali mengirim post akhir baru agar balasan tidak pernah hilang.
- Lihat [Streaming](/id/concepts/streaming#preview-streaming-modes) untuk matriks pemetaan channel.

## Reaksi (alat message)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah id post Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (tanda titik dua opsional).
- Tetapkan `remove=true` (boolean) untuk menghapus reaksi.
- Event tambah/hapus reaksi diteruskan sebagai event sistem ke sesi agent yang diarahkan.

Contoh:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfigurasi:

- `channels.mattermost.actions.reactions`: aktifkan/nonaktifkan aksi reaksi (default true).
- Override per-akun: `channels.mattermost.accounts.<id>.actions.reactions`.

## Tombol interaktif (alat message)

Kirim pesan dengan tombol yang dapat diklik. Saat pengguna mengklik tombol, agent menerima
pilihan tersebut dan dapat merespons.

Aktifkan tombol dengan menambahkan `inlineButtons` ke kapabilitas channel:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Gunakan `message action=send` dengan parameter `buttons`. Tombol adalah array 2D (baris tombol):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Field tombol:

- `text` (wajib): label tampilan.
- `callback_data` (wajib): nilai yang dikirim kembali saat diklik (digunakan sebagai ID aksi).
- `style` (opsional): `"default"`, `"primary"`, atau `"danger"`.

Saat pengguna mengklik tombol:

1. Semua tombol diganti dengan baris konfirmasi (misalnya, "✓ **Yes** selected by @user").
2. Agent menerima pilihan tersebut sebagai pesan masuk dan merespons.

Catatan:

- Callback tombol menggunakan verifikasi HMAC-SHA256 (otomatis, tidak perlu konfigurasi).
- Mattermost menghapus callback data dari respons API-nya (fitur keamanan), sehingga semua tombol
  dihapus saat diklik — penghapusan parsial tidak dimungkinkan.
- ID aksi yang berisi tanda hubung atau garis bawah disanitasi secara otomatis
  (keterbatasan routing Mattermost).

Konfigurasi:

- `channels.mattermost.capabilities`: array string kapabilitas. Tambahkan `"inlineButtons"` untuk
  mengaktifkan deskripsi alat tombol dalam prompt sistem agent.
- `channels.mattermost.interactions.callbackBaseUrl`: URL dasar eksternal opsional untuk callback
  tombol (misalnya `https://gateway.example.com`). Gunakan ini saat Mattermost tidak dapat
  menjangkau gateway langsung pada bind host-nya.
- Dalam penyiapan multi-akun, Anda juga dapat menetapkan field yang sama di bawah
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Jika `interactions.callbackBaseUrl` dihilangkan, OpenClaw menurunkan URL callback dari
  `gateway.customBindHost` + `gateway.port`, lalu fallback ke `http://localhost:<port>`.
- Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost.
  `localhost` hanya berfungsi saat Mattermost dan OpenClaw berjalan pada host/network namespace yang sama.
- Jika target callback Anda bersifat private/tailnet/internal, tambahkan host/domain-nya ke
  `ServiceSettings.AllowedUntrustedInternalConnections` Mattermost.

### Integrasi API langsung (skrip eksternal)

Skrip eksternal dan Webhook dapat mem-posting tombol secara langsung melalui REST API Mattermost
alih-alih melalui alat `message` milik agent. Gunakan `buildButtonAttachments()` dari
extension jika memungkinkan; jika mem-posting JSON mentah, ikuti aturan ini:

**Struktur payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Pilih sebuah opsi:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // hanya alfanumerik — lihat di bawah
            type: "button", // wajib, atau klik akan diabaikan tanpa pemberitahuan
            name: "Setujui", // label tampilan
            style: "primary", // opsional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // harus cocok dengan id tombol (untuk lookup nama)
                action: "approve",
                // ... field kustom apa pun ...
                _token: "<hmac>", // lihat bagian HMAC di bawah
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Aturan penting:**

1. Attachment ditempatkan di `props.attachments`, bukan `attachments` level atas (jika tidak akan diabaikan tanpa pemberitahuan).
2. Setiap action memerlukan `type: "button"` — tanpa itu, klik akan ditelan tanpa pemberitahuan.
3. Setiap action memerlukan field `id` — Mattermost mengabaikan action tanpa ID.
4. `id` action harus **hanya alfanumerik** (`[a-zA-Z0-9]`). Tanda hubung dan garis bawah merusak
   routing action sisi server Mattermost (mengembalikan 404). Hapus karakter tersebut sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol agar pesan konfirmasi menampilkan
   nama tombol (misalnya, "Setujui") alih-alih ID mentah.
6. `context.action_id` wajib — handler interaksi mengembalikan 400 tanpa itu.

**Pembuatan token HMAC:**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus membuat token
yang cocok dengan logika verifikasi gateway:

1. Turunkan secret dari token bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Bangun objek context dengan semua field **kecuali** `_token`.
3. Serialisasikan dengan **key yang diurutkan** dan **tanpa spasi** (gateway menggunakan `JSON.stringify`
   dengan key yang diurutkan, yang menghasilkan output ringkas).
4. Tanda tangani: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Tambahkan hex digest yang dihasilkan sebagai `_token` dalam context.

Contoh Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Jebakan HMAC yang umum:

- `json.dumps` Python menambahkan spasi secara default (`{"key": "val"}`). Gunakan
  `separators=(",", ":")` agar sesuai dengan output ringkas JavaScript (`{"key":"val"}`).
- Selalu tanda tangani **semua** field context (tanpa `_token`). Gateway menghapus `_token` lalu
  menandatangani semua yang tersisa. Menandatangani subset menyebabkan kegagalan verifikasi tanpa pemberitahuan.
- Gunakan `sort_keys=True` — gateway mengurutkan key sebelum menandatangani, dan Mattermost dapat
  mengurutkan ulang field context saat menyimpan payload.
- Turunkan secret dari token bot (deterministik), bukan byte acak. Secret tersebut
  harus sama di seluruh proses yang membuat tombol dan gateway yang memverifikasi.

## Adapter direktori

Plugin Mattermost menyertakan adapter direktori yang me-resolve nama channel dan pengguna
melalui API Mattermost. Ini mengaktifkan target `#channel-name` dan `@username` di
`openclaw message send` serta pengiriman Cron/Webhook.

Tidak diperlukan konfigurasi — adapter menggunakan token bot dari konfigurasi akun.

## Multi-akun

Mattermost mendukung banyak akun di bawah `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Utama", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Peringatan", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Pemecahan masalah

- Tidak ada balasan di channel: pastikan bot ada di channel dan mention bot tersebut (oncall), gunakan prefiks pemicu (onchar), atau tetapkan `chatmode: "onmessage"`.
- Error autentikasi: periksa token bot, URL dasar, dan apakah akun diaktifkan.
- Masalah multi-akun: env vars hanya berlaku untuk akun `default`.
- Perintah slash native mengembalikan `Unauthorized: invalid command token.`: OpenClaw
  tidak menerima token callback. Penyebab umum:
  - pendaftaran perintah slash gagal atau hanya selesai sebagian saat startup
  - callback mengarah ke gateway/akun yang salah
  - Mattermost masih memiliki perintah lama yang mengarah ke target callback sebelumnya
  - gateway dimulai ulang tanpa mengaktifkan kembali perintah slash
- Jika perintah slash native berhenti berfungsi, periksa log untuk
  `mattermost: failed to register slash commands` atau
  `mattermost: native slash commands enabled but no commands could be registered`.
- Jika `callbackUrl` dihilangkan dan log memperingatkan bahwa callback di-resolve ke
  `http://127.0.0.1:18789/...`, URL tersebut kemungkinan hanya dapat dijangkau saat
  Mattermost berjalan pada host/network namespace yang sama dengan OpenClaw. Tetapkan
  `commands.callbackUrl` eksplisit yang dapat dijangkau secara eksternal sebagai gantinya.
- Tombol muncul sebagai kotak putih: agent mungkin mengirim data tombol yang malformed. Periksa bahwa setiap tombol memiliki field `text` dan `callback_data`.
- Tombol dirender tetapi klik tidak melakukan apa pun: verifikasi `AllowedUntrustedInternalConnections` di konfigurasi server Mattermost menyertakan `127.0.0.1 localhost`, dan bahwa `EnablePostActionIntegration` adalah `true` di ServiceSettings.
- Tombol mengembalikan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau garis bawah. Router action Mattermost rusak pada ID non-alfanumerik. Gunakan hanya `[a-zA-Z0-9]`.
- Log gateway `invalid _token`: HMAC tidak cocok. Periksa bahwa Anda menandatangani semua field context (bukan subset), menggunakan key yang diurutkan, dan menggunakan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
- Log gateway `missing _token in context`: field `_token` tidak ada dalam context tombol. Pastikan field itu disertakan saat membangun payload integration.
- Konfirmasi menampilkan ID mentah alih-alih nama tombol: `context.action_id` tidak cocok dengan `id` tombol. Tetapkan keduanya ke nilai tersanitasi yang sama.
- Agent tidak mengetahui tombol: tambahkan `capabilities: ["inlineButtons"]` ke konfigurasi channel Mattermost.

## Terkait

- [Channels Overview](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Channel Routing](/id/channels/channel-routing) — routing sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
