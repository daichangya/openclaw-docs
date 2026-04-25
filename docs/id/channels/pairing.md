---
read_when:
    - Menyiapkan kontrol akses DM
    - Memasangkan Node iOS/Android baru
    - Meninjau postur keamanan OpenClaw
summary: 'Ringkasan pairing: setujui siapa yang dapat mengirimi Anda DM + node mana yang dapat bergabung'
title: Pairing
x-i18n:
    generated_at: "2026-04-25T13:41:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f11c992f7cbde12f8c6963279dbaea420941e2fc088179d3fd259e4aa007e34
    source_path: channels/pairing.md
    workflow: 15
---

“Pairing” adalah langkah **persetujuan pemilik** eksplisit di OpenClaw.
Ini digunakan di dua tempat:

1. **DM pairing** (siapa yang diizinkan berbicara dengan bot)
2. **Node pairing** (perangkat/node mana yang diizinkan bergabung ke jaringan gateway)

Konteks keamanan: [Security](/id/gateway/security)

## 1) DM pairing (akses chat masuk)

Saat sebuah channel dikonfigurasi dengan kebijakan DM `pairing`, pengirim yang tidak dikenal akan mendapatkan kode singkat dan pesan mereka **tidak diproses** sampai Anda menyetujuinya.

Kebijakan DM default didokumentasikan di: [Security](/id/gateway/security)

Kode pairing:

- 8 karakter, huruf besar, tanpa karakter ambigu (`0O1I`).
- **Kedaluwarsa setelah 1 jam**. Bot hanya mengirim pesan pairing saat permintaan baru dibuat (kurang lebih sekali per jam per pengirim).
- Permintaan DM pairing yang tertunda dibatasi hingga **3 per channel** secara default; permintaan tambahan diabaikan sampai salah satunya kedaluwarsa atau disetujui.

### Menyetujui pengirim

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Channel yang didukung: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Lokasi status disimpan

Disimpan di `~/.openclaw/credentials/`:

- Permintaan tertunda: `<channel>-pairing.json`
- Penyimpanan allowlist yang disetujui:
  - Akun default: `<channel>-allowFrom.json`
  - Akun non-default: `<channel>-<accountId>-allowFrom.json`

Perilaku cakupan akun:

- Akun non-default hanya membaca/menulis file allowlist yang dicakup untuk akun tersebut.
- Akun default menggunakan file allowlist tak bercakupan yang dicakup per channel.

Anggap file-file ini sensitif (karena mengendalikan akses ke asisten Anda).

Penting: penyimpanan ini untuk akses DM. Otorisasi grup terpisah.
Menyetujui kode DM pairing tidak otomatis mengizinkan pengirim tersebut menjalankan perintah grup atau mengendalikan bot di grup. Untuk akses grup, konfigurasikan allowlist grup eksplisit milik channel tersebut (misalnya `groupAllowFrom`, `groups`, atau override per grup/per topik tergantung channel).

## 2) Node device pairing (node iOS/Android/macOS/headless)

Node terhubung ke Gateway sebagai **device** dengan `role: node`. Gateway
membuat permintaan pairing device yang harus disetujui.

### Pair melalui Telegram (disarankan untuk iOS)

Jika Anda menggunakan plugin `device-pair`, Anda dapat melakukan pairing device pertama kali sepenuhnya dari Telegram:

1. Di Telegram, kirim pesan ke bot Anda: `/pair`
2. Bot membalas dengan dua pesan: pesan instruksi dan pesan **kode penyiapan** terpisah (mudah untuk disalin/ditempel di Telegram).
3. Di ponsel Anda, buka aplikasi OpenClaw iOS → Settings → Gateway.
4. Tempel kode penyiapan dan hubungkan.
5. Kembali di Telegram: `/pair pending` (tinjau ID permintaan, role, dan scope), lalu setujui.

Kode penyiapan adalah payload JSON berkode base64 yang berisi:

- `url`: URL WebSocket Gateway (`ws://...` atau `wss://...`)
- `bootstrapToken`: token bootstrap single-device berumur pendek yang digunakan untuk handshake pairing awal

Token bootstrap tersebut membawa profil bootstrap pairing bawaan:

- token `node` utama yang diserahkan tetap `scopes: []`
- token `operator` apa pun yang diserahkan tetap dibatasi pada allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- pemeriksaan scope bootstrap diberi prefiks role, bukan satu kumpulan scope datar:
  entri scope operator hanya memenuhi permintaan operator, dan role non-operator
  tetap harus meminta scope di bawah prefiks role mereka sendiri

Perlakukan kode penyiapan seperti kata sandi selama masih berlaku.

### Menyetujui Node device

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Jika device yang sama mencoba lagi dengan detail auth yang berbeda (misalnya
role/scope/public key yang berbeda), permintaan tertunda sebelumnya akan digantikan dan
`requestId` baru akan dibuat.

Penting: device yang sudah dipasangkan tidak akan diam-diam mendapatkan akses yang lebih luas. Jika device tersebut
terhubung kembali dengan meminta scope yang lebih banyak atau role yang lebih luas, OpenClaw akan mempertahankan
persetujuan yang ada sebagaimana adanya dan membuat permintaan upgrade tertunda yang baru. Gunakan
`openclaw devices list` untuk membandingkan akses yang saat ini disetujui dengan akses
baru yang diminta sebelum Anda menyetujuinya.

### Auto-approve Node trusted-CIDR opsional

Node device pairing tetap manual secara default. Untuk jaringan node yang dikendalikan ketat,
Anda dapat memilih untuk mengaktifkan auto-approval Node pertama kali dengan CIDR eksplisit atau IP persis:

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

Ini hanya berlaku untuk permintaan pairing `role: node` baru tanpa scope yang diminta.
Klien operator, browser, Control UI, dan WebChat tetap memerlukan
persetujuan manual. Perubahan role, scope, metadata, dan public key tetap memerlukan
persetujuan manual.

### Penyimpanan status Node pairing

Disimpan di `~/.openclaw/devices/`:

- `pending.json` (berumur pendek; permintaan tertunda kedaluwarsa)
- `paired.json` (device yang dipasangkan + token)

### Catatan

- API `node.pair.*` lama (CLI: `openclaw nodes pending|approve|reject|rename`) adalah
  penyimpanan pairing terpisah milik gateway. Node WS tetap memerlukan device pairing.
- Catatan pairing adalah sumber kebenaran tahan lama untuk role yang disetujui. Token device aktif
  tetap dibatasi pada kumpulan role yang disetujui tersebut; entri token yang menyimpang
  di luar role yang disetujui tidak menciptakan akses baru.

## Dokumen terkait

- Model keamanan + prompt injection: [Security](/id/gateway/security)
- Memperbarui dengan aman (jalankan doctor): [Updating](/id/install/updating)
- Konfigurasi channel:
  - Telegram: [Telegram](/id/channels/telegram)
  - WhatsApp: [WhatsApp](/id/channels/whatsapp)
  - Signal: [Signal](/id/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/id/channels/bluebubbles)
  - iMessage (lama): [iMessage](/id/channels/imessage)
  - Discord: [Discord](/id/channels/discord)
  - Slack: [Slack](/id/channels/slack)
