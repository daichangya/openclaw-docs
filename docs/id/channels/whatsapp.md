---
read_when:
    - Mengerjakan perilaku channel WhatsApp/web atau perutean inbox
summary: Dukungan channel WhatsApp, kontrol akses, perilaku pengiriman, dan operasi
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway memiliki sesi tertaut.

## Instalasi (sesuai kebutuhan)

- Onboarding (`openclaw onboard`) dan `openclaw channels add --channel whatsapp`
  meminta instalasi Plugin WhatsApp saat pertama kali Anda memilihnya.
- `openclaw channels login --channel whatsapp` juga menawarkan alur instalasi saat
  Plugin belum tersedia.
- Channel dev + checkout git: default ke path Plugin lokal.
- Stable/Beta: default ke paket npm `@openclaw/whatsapp`.

Instalasi manual tetap tersedia:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Kebijakan DM default adalah pairing untuk pengirim yang tidak dikenal.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas-channel dan playbook perbaikan.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh config channel lengkap.
  </Card>
</CardGroup>

## Setup cepat

<Steps>
  <Step title="Konfigurasikan kebijakan akses WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Tautkan WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Untuk akun tertentu:

```bash
openclaw channels login --channel whatsapp --account work
```

    Untuk memasang direktori auth WhatsApp Web yang sudah ada/kustom sebelum login:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Mulai gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Setujui permintaan pairing pertama (jika menggunakan mode pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Permintaan pairing kedaluwarsa setelah 1 jam. Permintaan tertunda dibatasi maksimal 3 per channel.

  </Step>
</Steps>

<Note>
OpenClaw merekomendasikan menjalankan WhatsApp pada nomor terpisah jika memungkinkan. (Metadata channel dan alur setup dioptimalkan untuk setup tersebut, tetapi setup nomor pribadi juga didukung.)
</Note>

## Pola deployment

<AccordionGroup>
  <Accordion title="Nomor khusus (disarankan)">
    Ini adalah mode operasional yang paling bersih:

    - identitas WhatsApp terpisah untuk OpenClaw
    - allowlist DM dan batas perutean yang lebih jelas
    - kemungkinan lebih rendah terjadinya kebingungan chat dengan diri sendiri

    Pola kebijakan minimal:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback nomor pribadi">
    Onboarding mendukung mode nomor pribadi dan menulis baseline yang ramah chat diri sendiri:

    - `dmPolicy: "allowlist"`
    - `allowFrom` mencakup nomor pribadi Anda
    - `selfChatMode: true`

    Pada runtime, proteksi chat diri sendiri bergantung pada nomor diri tertaut dan `allowFrom`.

  </Accordion>

  <Accordion title="Cakupan channel WhatsApp Web-only">
    Channel platform pesan berbasis WhatsApp Web (`Baileys`) dalam arsitektur channel OpenClaw saat ini.

    Tidak ada channel pesan Twilio WhatsApp terpisah dalam registry chat-channel bawaan.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway memiliki socket WhatsApp dan loop reconnect.
- Pengiriman outbound memerlukan listener WhatsApp aktif untuk akun target.
- Chat status dan broadcast diabaikan (`@status`, `@broadcast`).
- Chat langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke sesi utama agen).
- Sesi grup diisolasi (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web mematuhi variabel environment proxy standar pada host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varian huruf kecil). Utamakan config proxy tingkat host daripada pengaturan proxy WhatsApp khusus channel.

## Hook Plugin dan privasi

Pesan masuk WhatsApp dapat berisi konten pesan pribadi, nomor telepon,
identifier grup, nama pengirim, dan field korelasi sesi. Karena itu,
WhatsApp tidak menyiarkan payload hook `message_received` masuk ke Plugin
kecuali Anda secara eksplisit mengaktifkannya:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Anda dapat membatasi opt-in ke satu akun:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Aktifkan ini hanya untuk Plugin yang Anda percayai untuk menerima konten
pesan masuk WhatsApp dan identifier.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy` mengontrol akses chat langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal).

    Override multi-akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `allowFrom`) diprioritaskan daripada default tingkat channel untuk akun tersebut.

    Detail perilaku runtime:

    - pairing disimpan dalam allow-store channel dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - jika tidak ada allowlist yang dikonfigurasi, nomor diri tertaut diizinkan secara default
    - OpenClaw tidak pernah melakukan auto-pair pada DM outbound `fromMe` (pesan yang Anda kirim ke diri sendiri dari perangkat tertaut)

  </Tab>

  <Tab title="Kebijakan grup + allowlist">
    Akses grup memiliki dua lapisan:

    1. **Allowlist keanggotaan grup** (`channels.whatsapp.groups`)
       - jika `groups` dihilangkan, semua grup memenuhi syarat
       - jika `groups` ada, itu berfungsi sebagai allowlist grup (`"*"` diizinkan)

    2. **Kebijakan pengirim grup** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist pengirim dilewati
       - `allowlist`: pengirim harus cocok dengan `groupAllowFrom` (atau `*`)
       - `disabled`: blokir semua pesan masuk grup

    Fallback allowlist pengirim:

    - jika `groupAllowFrom` tidak disetel, runtime fallback ke `allowFrom` jika tersedia
    - allowlist pengirim dievaluasi sebelum aktivasi mention/balasan

    Catatan: jika sama sekali tidak ada blok `channels.whatsapp`, fallback kebijakan grup runtime adalah `allowlist` (dengan log peringatan), bahkan jika `channels.defaults.groupPolicy` disetel.

  </Tab>

  <Tab title="Mention + /activation">
    Balasan grup secara default memerlukan mention.

    Deteksi mention mencakup:

    - mention WhatsApp eksplisit terhadap identitas bot
    - pola regex mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - deteksi reply-to-bot implisit (pengirim balasan cocok dengan identitas bot)

    Catatan keamanan:

    - quote/reply hanya memenuhi gating mention; itu **tidak** memberikan otorisasi pengirim
    - dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada di allowlist tetap diblokir meskipun mereka membalas pesan pengguna yang ada di allowlist

    Perintah aktivasi tingkat sesi:

    - `/activation mention`
    - `/activation always`

    `activation` memperbarui status sesi (bukan config global). Ini dibatasi untuk owner.

  </Tab>
</Tabs>

## Perilaku nomor pribadi dan chat diri sendiri

Ketika nomor diri tertaut juga ada dalam `allowFrom`, perlindungan chat diri sendiri WhatsApp diaktifkan:

- lewati read receipt untuk giliran chat diri sendiri
- abaikan perilaku auto-trigger mention-JID yang jika tidak akan mem-ping diri sendiri
- jika `messages.responsePrefix` tidak disetel, balasan chat diri sendiri default ke `[{identity.name}]` atau `[openclaw]`

## Normalisasi pesan dan konteks

<AccordionGroup>
  <Accordion title="Envelope masuk + konteks balasan">
    Pesan WhatsApp yang masuk dibungkus dalam envelope masuk bersama.

    Jika ada balasan kutipan, konteks ditambahkan dalam bentuk berikut:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Field metadata balasan juga diisi jika tersedia (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan masuk hanya-media dinormalisasi dengan placeholder seperti:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Body lokasi menggunakan teks koordinat singkat. Label/komentar lokasi dan detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt inline.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Untuk grup, pesan yang belum diproses dapat dibuffer dan diinjeksi sebagai konteks saat bot akhirnya dipicu.

    - batas default: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Penanda injeksi:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipt">
    Read receipt diaktifkan secara default untuk pesan masuk WhatsApp yang diterima.

    Nonaktifkan secara global:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Override per akun:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Giliran chat diri sendiri melewati read receipt meskipun diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, chunking, dan media

<AccordionGroup>
  <Accordion title="Chunking teks">
    - batas chunk default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - mode `newline` mengutamakan batas paragraf (baris kosong), lalu fallback ke chunking aman berdasarkan panjang
  </Accordion>

  <Accordion title="Perilaku media outbound">
    - mendukung payload gambar, video, audio (voice-note PTT), dan dokumen
    - payload balasan mempertahankan `audioAsVoice`; WhatsApp mengirim media audio sebagai voice note PTT Baileys
    - audio non-Ogg, termasuk output MP3/WebM TTS Microsoft Edge, ditranskode ke Ogg/Opus sebelum pengiriman PTT
    - audio Ogg/Opus native dikirim dengan `audio/ogg; codecs=opus` untuk kompatibilitas voice-note
    - pemutaran GIF animasi didukung melalui `gifPlayback: true` pada pengiriman video
    - caption diterapkan ke item media pertama saat mengirim payload balasan multi-media
    - sumber media dapat berupa HTTP(S), `file://`, atau path lokal
  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas penyimpanan media masuk: `channels.whatsapp.mediaMaxMb` (default `50`)
    - batas pengiriman media outbound: `channels.whatsapp.mediaMaxMb` (default `50`)
    - override per akun menggunakan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - gambar dioptimalkan otomatis (resize/sweep kualitas) agar sesuai batas
    - saat pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih diam-diam membuang respons
  </Accordion>
</AccordionGroup>

## Kutipan balasan

WhatsApp mendukung kutipan balasan native, di mana balasan outbound secara visual mengutip pesan masuk. Kendalikan dengan `channels.whatsapp.replyToMode`.

| Nilai      | Perilaku                                                             |
| ---------- | -------------------------------------------------------------------- |
| `"off"`     | Jangan pernah mengutip; kirim sebagai pesan biasa                   |
| `"first"`   | Kutip hanya chunk balasan outbound pertama                          |
| `"all"`     | Kutip setiap chunk balasan outbound                                 |
| `"batched"` | Kutip balasan batch dalam antrean sambil membiarkan balasan langsung tanpa kutipan |

Default adalah `"off"`. Override per akun menggunakan `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Tingkat reaksi

`channels.whatsapp.reactionLevel` mengontrol seberapa luas agen menggunakan reaksi emoji di WhatsApp:

| Tingkat       | Reaksi ack | Reaksi yang dimulai agen | Deskripsi                                         |
| ------------- | ---------- | ------------------------ | ------------------------------------------------- |
| `"off"`       | Tidak      | Tidak                    | Tidak ada reaksi sama sekali                      |
| `"ack"`       | Ya         | Tidak                    | Hanya reaksi ack (tanda terima sebelum balasan)   |
| `"minimal"`   | Ya         | Ya (konservatif)         | Ack + reaksi agen dengan panduan konservatif      |
| `"extensive"` | Ya         | Ya (didorong)            | Ack + reaksi agen dengan panduan yang didorong    |

Default: `"minimal"`.

Override per akun menggunakan `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reaksi acknowledgment

WhatsApp mendukung reaksi ack langsung saat pesan masuk diterima melalui `channels.whatsapp.ackReaction`.
Reaksi ack dibatasi oleh `reactionLevel` — reaksi ini ditekan ketika `reactionLevel` adalah `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Catatan perilaku:

- dikirim segera setelah pesan masuk diterima (sebelum balasan)
- kegagalan dicatat dalam log tetapi tidak menghalangi pengiriman balasan normal
- mode grup `mentions` bereaksi pada giliran yang dipicu mention; aktivasi grup `always` bertindak sebagai bypass untuk pemeriksaan ini
- WhatsApp menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` lama tidak digunakan di sini)

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan default">
    - id akun berasal dari `channels.whatsapp.accounts`
    - pemilihan akun default: `default` jika ada, jika tidak id akun pertama yang dikonfigurasi (diurutkan)
    - id akun dinormalisasi secara internal untuk lookup
  </Accordion>

  <Accordion title="Path kredensial dan kompatibilitas lama">
    - path auth saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file cadangan: `creds.json.bak`
    - auth default lama di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default
  </Accordion>

  <Accordion title="Perilaku logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status auth WhatsApp untuk akun tersebut.

    Dalam direktori auth lama, `oauth.json` dipertahankan sementara file auth Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, aksi, dan penulisan config

- Dukungan alat agen mencakup aksi reaksi WhatsApp (`react`).
- Pembatas aksi:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Penulisan config yang dimulai channel diaktifkan secara default (nonaktifkan melalui `channels.whatsapp.configWrites=false`).

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Belum tertaut (memerlukan QR)">
    Gejala: status channel melaporkan belum tertaut.

    Perbaikan:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Tertaut tetapi terputus / loop reconnect">
    Gejala: akun tertaut dengan disconnect berulang atau upaya reconnect berulang.

    Perbaikan:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Jika perlu, tautkan ulang dengan `channels login`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman outbound gagal cepat ketika tidak ada listener gateway aktif untuk akun target.

    Pastikan gateway berjalan dan akun sudah tertaut.

  </Accordion>

  <Accordion title="Pesan grup diabaikan secara tidak terduga">
    Periksa dalam urutan ini:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entri allowlist `groups`
    - gating mention (`requireMention` + pola mention)
    - key duplikat di `openclaw.json` (JSON5): entri yang belakangan menimpa entri sebelumnya, jadi pertahankan hanya satu `groupPolicy` per scope

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime gateway WhatsApp harus menggunakan Node. Bun ditandai tidak kompatibel untuk operasi gateway WhatsApp/Telegram stable.
  </Accordion>
</AccordionGroup>

## System prompt

WhatsApp mendukung system prompt bergaya Telegram untuk grup dan chat langsung melalui map `groups` dan `direct`.

Hierarki resolusi untuk pesan grup:

Map `groups` yang efektif ditentukan terlebih dahulu: jika akun mendefinisikan `groups` sendiri, itu sepenuhnya menggantikan map `groups` root (tanpa deep merge). Lookup prompt kemudian berjalan pada map tunggal yang dihasilkan:

1. **System prompt khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan ketika entri grup spesifik ada di map **dan** key `systemPrompt`-nya terdefinisi. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada system prompt yang diterapkan.
2. **System prompt wildcard grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup spesifik tidak ada sama sekali di map, atau ketika entri tersebut ada tetapi tidak mendefinisikan key `systemPrompt`.

Hierarki resolusi untuk direct message:

Map `direct` yang efektif ditentukan terlebih dahulu: jika akun mendefinisikan `direct` sendiri, itu sepenuhnya menggantikan map `direct` root (tanpa deep merge). Lookup prompt kemudian berjalan pada map tunggal yang dihasilkan:

1. **System prompt khusus direct** (`direct["<peerId>"].systemPrompt`): digunakan ketika entri peer spesifik ada di map **dan** key `systemPrompt`-nya terdefinisi. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada system prompt yang diterapkan.
2. **System prompt wildcard direct** (`direct["*"].systemPrompt`): digunakan ketika entri peer spesifik tidak ada sama sekali di map, atau ketika entri tersebut ada tetapi tidak mendefinisikan key `systemPrompt`.

Catatan: `dms` tetap menjadi bucket override riwayat ringan per-DM (`dms.<id>.historyLimit`); override prompt berada di bawah `direct`.

**Perbedaan dari perilaku multi-akun Telegram:** Di Telegram, `groups` root sengaja ditekan untuk semua akun dalam setup multi-akun — bahkan akun yang tidak mendefinisikan `groups` sendiri — untuk mencegah bot menerima pesan grup untuk grup yang bukan anggotanya. WhatsApp tidak menerapkan pengaman ini: `groups` root dan `direct` root selalu diwariskan oleh akun yang tidak mendefinisikan override tingkat akun, terlepas dari berapa banyak akun yang dikonfigurasi. Dalam setup WhatsApp multi-akun, jika Anda menginginkan prompt grup atau direct per akun, definisikan map lengkap di bawah setiap akun secara eksplisit alih-alih mengandalkan default tingkat root.

Perilaku penting:

- `channels.whatsapp.groups` adalah map config per grup sekaligus allowlist grup tingkat chat. Pada scope root maupun akun, `groups["*"]` berarti "semua grup diterima" untuk scope tersebut.
- Tambahkan wildcard `systemPrompt` grup hanya jika Anda memang ingin scope tersebut menerima semua grup. Jika Anda tetap ingin hanya sekumpulan tetap id grup yang memenuhi syarat, jangan gunakan `groups["*"]` untuk default prompt. Sebagai gantinya, ulangi prompt pada setiap entri grup yang secara eksplisit ada di allowlist.
- Penerimaan grup dan otorisasi pengirim adalah pemeriksaan yang terpisah. `groups["*"]` memperluas set grup yang dapat mencapai penanganan grup, tetapi itu sendiri tidak mengotorisasi setiap pengirim dalam grup tersebut. Akses pengirim tetap dikendalikan secara terpisah oleh `channels.whatsapp.groupPolicy` dan `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang sama untuk DM. `direct["*"]` hanya menyediakan config chat langsung default setelah DM sudah diterima oleh `dmPolicy` ditambah aturan `allowFrom` atau pairing-store.

Contoh:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Gunakan hanya jika semua grup harus diterima pada scope root.
        // Berlaku untuk semua akun yang tidak mendefinisikan map groups sendiri.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Berlaku untuk semua akun yang tidak mendefinisikan map direct sendiri.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // Akun ini mendefinisikan groups sendiri, jadi groups root sepenuhnya
            // digantikan. Untuk mempertahankan wildcard, definisikan "*" secara eksplisit di sini juga.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Gunakan hanya jika semua grup harus diterima di akun ini.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // Akun ini mendefinisikan map direct sendiri, jadi entri direct root
            // sepenuhnya digantikan. Untuk mempertahankan wildcard, definisikan "*" secara eksplisit di sini juga.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Pointer referensi konfigurasi

Referensi utama:

- [Configuration reference - WhatsApp](/id/gateway/config-channels#whatsapp)

Field WhatsApp bernilai tinggi:

- akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-akun: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override tingkat akun
- operasi: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- perilaku sesi: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Terkait

- [Pairing](/id/channels/pairing)
- [Groups](/id/channels/groups)
- [Security](/id/gateway/security)
- [Channel routing](/id/channels/channel-routing)
- [Multi-agent routing](/id/concepts/multi-agent)
- [Troubleshooting](/id/channels/troubleshooting)
