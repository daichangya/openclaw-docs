---
read_when:
    - Menyiapkan Mattermost
    - Men-debug routing Mattermost
summary: Penyiapan bot Mattermost dan konfigurasi OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-23T09:16:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9421ae903caed5c9dc3b19ca8558725f11bbe553a20bd4d3f0fb6e7eecccd92
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: plugin bawaan (token bot + event WebSocket). Channel, grup, dan DM didukung.
Mattermost adalah platform pesan tim yang dapat di-host sendiri; lihat situs resmi di
[mattermost.com](https://mattermost.com) untuk detail produk dan unduhan.

## Plugin bawaan

Mattermost disertakan sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build
terpaket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Mattermost,
instal secara manual:

Instal melalui CLI (registry npm):

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
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun bot Mattermost dan salin **token bot**.
3. Salin **URL dasar** Mattermost (misalnya, `https://chat.example.com`).
4. Konfigurasikan OpenClaw dan mulai Gateway.

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

## Slash command native

Slash command native bersifat opt-in. Saat diaktifkan, OpenClaw mendaftarkan slash command `oc_*` melalui
API Mattermost dan menerima POST callback pada server HTTP gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Gunakan ketika Mattermost tidak dapat menjangkau gateway secara langsung (reverse proxy/URL publik).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Catatan:

- `native: "auto"` secara default dinonaktifkan untuk Mattermost. Tetapkan `native: true` untuk mengaktifkannya.
- Jika `callbackUrl` dihilangkan, OpenClaw menurunkannya dari host/port gateway + `callbackPath`.
- Untuk penyiapan multi-akun, `commands` dapat ditetapkan di level teratas atau di bawah
  `channels.mattermost.accounts.<id>.commands` (nilai akun menimpa field level teratas).
- Callback perintah divalidasi dengan token per-perintah yang dikembalikan oleh
  Mattermost saat OpenClaw mendaftarkan perintah `oc_*`.
- Callback slash gagal tertutup saat pendaftaran gagal, startup bersifat parsial, atau
  token callback tidak cocok dengan salah satu perintah yang terdaftar.
- Persyaratan keterjangkauan: endpoint callback harus dapat dijangkau dari server Mattermost.
  - Jangan tetapkan `callbackUrl` ke `localhost` kecuali Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw.
  - Jangan tetapkan `callbackUrl` ke URL dasar Mattermost Anda kecuali URL tersebut me-reverse-proxy `/api/channels/mattermost/command` ke OpenClaw.
  - Pemeriksaan cepatnya adalah `curl https://<gateway-host>/api/channels/mattermost/command`; GET harus mengembalikan `405 Method Not Allowed` dari OpenClaw, bukan `404`.
- Persyaratan allowlist egress Mattermost:
  - Jika callback Anda menargetkan alamat private/tailnet/internal, tetapkan Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` agar menyertakan host/domain callback.
  - Gunakan entri host/domain, bukan URL lengkap.
    - Benar: `gateway.tailnet-name.ts.net`
    - Salah: `https://gateway.tailnet-name.ts.net`

## Variabel lingkungan (akun default)

Tetapkan ini pada host gateway jika Anda lebih memilih env var:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Env var hanya berlaku untuk akun **default** (`default`). Akun lain harus menggunakan nilai konfigurasi.

`MATTERMOST_URL` tidak dapat ditetapkan dari workspace `.env`; lihat [file workspace `.env`](/id/gateway/security).

## Mode chat

Mattermost merespons DM secara otomatis. Perilaku channel dikendalikan oleh `chatmode`:

- `oncall` (default): hanya merespons saat di-@mention di channel.
- `onmessage`: merespons setiap pesan channel.
- `onchar`: merespons saat sebuah pesan dimulai dengan prefiks pemicu.

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

Gunakan `channels.mattermost.replyToMode` untuk mengontrol apakah balasan channel dan grup tetap berada di
channel utama atau memulai thread di bawah post pemicu.

- `off` (default): hanya membalas dalam thread ketika post masuk sudah berada di thread.
- `first`: untuk post channel/grup level atas, mulai thread di bawah post tersebut dan rute-kan
  percakapan ke sesi berskala thread.
- `all`: perilaku yang sama dengan `first` untuk Mattermost saat ini.
- Direct message mengabaikan pengaturan ini dan tetap tanpa thread.

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

- Sesi berskala thread menggunakan id post pemicu sebagai akar thread.
- `first` dan `all` saat ini setara karena setelah Mattermost memiliki akar thread,
  chunk tindak lanjut dan media akan tetap berlanjut di thread yang sama.

## Kontrol akses (DM)

- Default: `channels.mattermost.dmPolicy = "pairing"` (pengirim yang tidak dikenal mendapatkan kode pairing).
- Setujui melalui:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publik: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Channel (grup)

- Default: `channels.mattermost.groupPolicy = "allowlist"` (dibatasi mention).
- Allowlist pengirim dengan `channels.mattermost.groupAllowFrom` (id pengguna disarankan).
- Override mention per-channel ada di bawah `channels.mattermost.groups.<channelId>.requireMention`
  atau `channels.mattermost.groups["*"].requireMention` sebagai default.
- Pencocokan `@username` dapat berubah dan hanya diaktifkan saat `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Channel terbuka: `channels.mattermost.groupPolicy="open"` (dibatasi mention).
- Catatan runtime: jika `channels.mattermost` sama sekali tidak ada, runtime akan fallback ke `groupPolicy="allowlist"` untuk pemeriksaan grup (bahkan jika `channels.defaults.groupPolicy` disetel).

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

Gunakan format target ini dengan `openclaw message send` atau cron/webhook:

- `channel:<id>` untuk channel
- `user:<id>` untuk DM
- `@username` untuk DM (di-resolve melalui API Mattermost)

ID opak polos (seperti `64ifufp...`) **ambigu** di Mattermost (id pengguna vs id channel).

OpenClaw me-resolve-nya dengan **prioritas pengguna terlebih dahulu**:

- Jika ID ada sebagai pengguna (`GET /api/v4/users/<id>` berhasil), OpenClaw mengirim **DM** dengan me-resolve channel langsung melalui `/api/v4/channels/direct`.
- Jika tidak, ID diperlakukan sebagai **id channel**.

Jika Anda memerlukan perilaku yang deterministik, selalu gunakan prefiks eksplisit (`user:<id>` / `channel:<id>`).

## Retry channel DM

Saat OpenClaw mengirim ke target DM Mattermost dan perlu me-resolve channel langsung terlebih dahulu, ia
secara default me-retry kegagalan pembuatan channel langsung yang bersifat sementara.

Gunakan `channels.mattermost.dmChannelRetry` untuk menyesuaikan perilaku itu secara global untuk plugin Mattermost,
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
- Retry berlaku untuk kegagalan sementara seperti rate limit, respons 5xx, dan error jaringan atau timeout.
- Error klien 4xx selain `429` diperlakukan sebagai permanen dan tidak di-retry.

## Streaming pratinjau

Mattermost men-stream pemikiran, aktivitas alat, dan teks balasan parsial ke dalam satu **post pratinjau draf** yang difinalisasi di tempat ketika jawaban akhir aman untuk dikirim. Pratinjau diperbarui pada id post yang sama alih-alih membanjiri channel dengan pesan per-chunk. Final media/error membatalkan edit pratinjau yang tertunda dan menggunakan pengiriman normal alih-alih membuang post pratinjau sementara.

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

- `partial` adalah pilihan yang umum: satu post pratinjau yang diedit seiring balasan bertambah, lalu difinalisasi dengan jawaban lengkap.
- `block` menggunakan chunk draf gaya append di dalam post pratinjau.
- `progress` menampilkan pratinjau status saat menghasilkan dan hanya mem-post jawaban akhir saat selesai.
- `off` menonaktifkan streaming pratinjau.
- Jika stream tidak dapat difinalisasi di tempat (misalnya post dihapus di tengah stream), OpenClaw akan fallback ke mengirim post final baru sehingga balasan tidak pernah hilang.
- Payload yang hanya berisi reasoning disembunyikan dari post channel, termasuk teks yang datang sebagai blockquote `> Reasoning:`. Tetapkan `/reasoning on` untuk melihat pemikiran di surface lain; post final Mattermost hanya menyimpan jawabannya.
- Lihat [Streaming](/id/concepts/streaming#preview-streaming-modes) untuk matriks pemetaan channel.

## Reaksi (alat pesan)

- Gunakan `message action=react` dengan `channel=mattermost`.
- `messageId` adalah id post Mattermost.
- `emoji` menerima nama seperti `thumbsup` atau `:+1:` (titik dua opsional).
- Tetapkan `remove=true` (boolean) untuk menghapus reaksi.
- Event penambahan/penghapusan reaksi diteruskan sebagai event sistem ke sesi agen yang dirutekan.

Contoh:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Konfigurasi:

- `channels.mattermost.actions.reactions`: aktifkan/nonaktifkan aksi reaksi (default true).
- Override per-akun: `channels.mattermost.accounts.<id>.actions.reactions`.

## Tombol interaktif (alat pesan)

Kirim pesan dengan tombol yang dapat diklik. Saat pengguna mengklik tombol, agen menerima
pilihan tersebut dan dapat merespons.

Aktifkan tombol dengan menambahkan `inlineButtons` ke capability channel:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Gunakan `message action=send` dengan parameter `buttons`. Tombol berupa array 2D (baris tombol):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Field tombol:

- `text` (wajib): label tampilan.
- `callback_data` (wajib): nilai yang dikirim balik saat diklik (digunakan sebagai id aksi).
- `style` (opsional): `"default"`, `"primary"`, atau `"danger"`.

Saat pengguna mengklik tombol:

1. Semua tombol diganti dengan baris konfirmasi (misalnya, "✓ **Yes** selected by @user").
2. Agen menerima pilihan tersebut sebagai pesan masuk dan merespons.

Catatan:

- Callback tombol menggunakan verifikasi HMAC-SHA256 (otomatis, tidak memerlukan konfigurasi).
- Mattermost menghapus callback data dari respons API-nya (fitur keamanan), sehingga semua tombol
  dihapus saat diklik — penghapusan parsial tidak dimungkinkan.
- ID aksi yang berisi tanda hubung atau underscore dibersihkan secara otomatis
  (keterbatasan routing Mattermost).

Konfigurasi:

- `channels.mattermost.capabilities`: array string capability. Tambahkan `"inlineButtons"` untuk
  mengaktifkan deskripsi alat tombol di system prompt agen.
- `channels.mattermost.interactions.callbackBaseUrl`: URL dasar eksternal opsional untuk callback
  tombol (misalnya `https://gateway.example.com`). Gunakan ini saat Mattermost tidak dapat
  menjangkau gateway pada host bind-nya secara langsung.
- Dalam penyiapan multi-akun, Anda juga dapat menetapkan field yang sama di bawah
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Jika `interactions.callbackBaseUrl` dihilangkan, OpenClaw menurunkan URL callback dari
  `gateway.customBindHost` + `gateway.port`, lalu fallback ke `http://localhost:<port>`.
- Aturan keterjangkauan: URL callback tombol harus dapat dijangkau dari server Mattermost.
  `localhost` hanya berfungsi saat Mattermost dan OpenClaw berjalan pada host/namespace jaringan yang sama.
- Jika target callback Anda adalah private/tailnet/internal, tambahkan host/domain-nya ke Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`.

### Integrasi API langsung (skrip eksternal)

Skrip eksternal dan webhook dapat mem-post tombol secara langsung melalui REST API Mattermost
alih-alih melalui alat `message` milik agen. Gunakan `buildButtonAttachments()` dari
plugin jika memungkinkan; jika mem-post JSON mentah, ikuti aturan ini:

**Struktur payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // hanya alfanumerik — lihat di bawah
            type: "button", // wajib, atau klik akan diabaikan secara diam-diam
            name: "Approve", // label tampilan
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

1. Attachment ditempatkan di `props.attachments`, bukan `attachments` level atas (akan diabaikan secara diam-diam).
2. Setiap aksi memerlukan `type: "button"` — tanpanya, klik akan tertelan secara diam-diam.
3. Setiap aksi memerlukan field `id` — Mattermost mengabaikan aksi tanpa ID.
4. `id` aksi harus **hanya alfanumerik** (`[a-zA-Z0-9]`). Tanda hubung dan underscore merusak
   routing aksi sisi server Mattermost (mengembalikan 404). Hapus karakter tersebut sebelum digunakan.
5. `context.action_id` harus cocok dengan `id` tombol agar pesan konfirmasi menampilkan
   nama tombol (misalnya, "Approve") alih-alih ID mentah.
6. `context.action_id` wajib — handler interaksi mengembalikan 400 tanpanya.

**Pembuatan token HMAC:**

Gateway memverifikasi klik tombol dengan HMAC-SHA256. Skrip eksternal harus membuat token
yang cocok dengan logika verifikasi gateway:

1. Turunkan secret dari token bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Bangun objek context dengan semua field **kecuali** `_token`.
3. Serialisasikan dengan **key terurut** dan **tanpa spasi** (gateway menggunakan `JSON.stringify`
   dengan key terurut, yang menghasilkan output ringkas).
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

Jebakan umum HMAC:

- `json.dumps` Python menambahkan spasi secara default (`{"key": "val"}`). Gunakan
  `separators=(",", ":")` agar cocok dengan output ringkas JavaScript (`{"key":"val"}`).
- Selalu tanda tangani **semua** field context (tanpa `_token`). Gateway menghapus `_token` lalu
  menandatangani semua yang tersisa. Menandatangani subset menyebabkan kegagalan verifikasi diam-diam.
- Gunakan `sort_keys=True` — gateway mengurutkan key sebelum menandatangani, dan Mattermost dapat
  mengurutkan ulang field context saat menyimpan payload.
- Turunkan secret dari token bot (deterministik), bukan byte acak. Secret tersebut
  harus sama di seluruh proses yang membuat tombol dan gateway yang memverifikasi.

## Adapter direktori

Plugin Mattermost menyertakan adapter direktori yang me-resolve nama channel dan pengguna
melalui API Mattermost. Ini memungkinkan target `#channel-name` dan `@username` dalam
`openclaw message send` serta pengiriman cron/webhook.

Tidak diperlukan konfigurasi — adapter menggunakan token bot dari konfigurasi akun.

## Multi-akun

Mattermost mendukung beberapa akun di bawah `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Pemecahan masalah

- Tidak ada balasan di channel: pastikan bot ada di channel dan mention bot tersebut (`oncall`), gunakan prefiks pemicu (`onchar`), atau tetapkan `chatmode: "onmessage"`.
- Error auth: periksa token bot, URL dasar, dan apakah akun diaktifkan.
- Masalah multi-akun: env var hanya berlaku untuk akun `default`.
- Slash command native mengembalikan `Unauthorized: invalid command token.`: OpenClaw
  tidak menerima token callback. Penyebab umum:
  - pendaftaran slash command gagal atau hanya selesai sebagian saat startup
  - callback menuju gateway/akun yang salah
  - Mattermost masih memiliki perintah lama yang mengarah ke target callback sebelumnya
  - gateway direstart tanpa mengaktifkan ulang slash command
- Jika slash command native berhenti berfungsi, periksa log untuk
  `mattermost: failed to register slash commands` atau
  `mattermost: native slash commands enabled but no commands could be registered`.
- Jika `callbackUrl` dihilangkan dan log memperingatkan bahwa callback di-resolve ke
  `http://127.0.0.1:18789/...`, URL tersebut kemungkinan hanya dapat dijangkau saat
  Mattermost berjalan pada host/namespace jaringan yang sama dengan OpenClaw. Tetapkan
  `commands.callbackUrl` eksplisit yang dapat dijangkau secara eksternal sebagai gantinya.
- Tombol muncul sebagai kotak putih: agen mungkin mengirim data tombol yang malformed. Periksa bahwa setiap tombol memiliki field `text` dan `callback_data`.
- Tombol tampil tetapi klik tidak melakukan apa pun: verifikasi `AllowedUntrustedInternalConnections` dalam konfigurasi server Mattermost mencakup `127.0.0.1 localhost`, dan `EnablePostActionIntegration` adalah `true` di ServiceSettings.
- Tombol mengembalikan 404 saat diklik: `id` tombol kemungkinan berisi tanda hubung atau underscore. Router aksi Mattermost rusak pada ID non-alfanumerik. Gunakan hanya `[a-zA-Z0-9]`.
- Log gateway `invalid _token`: HMAC tidak cocok. Periksa bahwa Anda menandatangani semua field context (bukan subset), menggunakan key terurut, dan menggunakan JSON ringkas (tanpa spasi). Lihat bagian HMAC di atas.
- Log gateway `missing _token in context`: field `_token` tidak ada dalam context tombol. Pastikan field itu disertakan saat membangun payload integrasi.
- Konfirmasi menampilkan ID mentah alih-alih nama tombol: `context.action_id` tidak cocok dengan `id` tombol. Tetapkan keduanya ke nilai yang sama dan telah dibersihkan.
- Agen tidak mengetahui tombol: tambahkan `capabilities: ["inlineButtons"]` ke konfigurasi channel Mattermost.

## Terkait

- [Ringkasan Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Channel Routing](/id/channels/channel-routing) — routing sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
