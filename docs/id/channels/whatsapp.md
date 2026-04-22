---
read_when:
    - Mengerjakan perilaku channel WhatsApp/web atau routing kotak masuk
summary: Dukungan channel WhatsApp, kontrol akses, perilaku pengiriman, dan operasi
title: WhatsApp
x-i18n:
    generated_at: "2026-04-22T04:20:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c527b9f7f58f4bb7272a6d1c0f9a435d7d46a9b99790243594afb5c305606b3
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (channel Web)

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway memiliki sesi tertaut.

## Instal (sesuai kebutuhan)

- Onboarding (`openclaw onboard`) dan `openclaw channels add --channel whatsapp`
  akan meminta instalasi plugin WhatsApp saat pertama kali Anda memilihnya.
- `openclaw channels login --channel whatsapp` juga menawarkan alur instalasi saat
  plugin belum tersedia.
- Channel dev + checkout git: secara default menggunakan path plugin lokal.
- Stable/Beta: secara default menggunakan paket npm `@openclaw/whatsapp`.

Instal manual tetap tersedia:

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
    Pola dan contoh konfigurasi channel lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

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

    Permintaan pairing kedaluwarsa setelah 1 jam. Permintaan tertunda dibatasi hingga 3 per channel.

  </Step>
</Steps>

<Note>
OpenClaw merekomendasikan menjalankan WhatsApp pada nomor terpisah jika memungkinkan. (Metadata channel dan alur penyiapan dioptimalkan untuk penyiapan tersebut, tetapi penyiapan nomor pribadi juga didukung.)
</Note>

## Pola deployment

<AccordionGroup>
  <Accordion title="Nomor khusus (direkomendasikan)">
    Ini adalah mode operasional yang paling bersih:

    - identitas WhatsApp terpisah untuk OpenClaw
    - allowlist DM dan batas routing yang lebih jelas
    - kemungkinan kebingungan chat dengan diri sendiri lebih rendah

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
    Onboarding mendukung mode nomor pribadi dan menulis baseline yang ramah self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` menyertakan nomor pribadi Anda
    - `selfChatMode: true`

    Pada runtime, proteksi self-chat dikunci pada nomor diri tertaut dan `allowFrom`.

  </Accordion>

  <Accordion title="Cakupan channel khusus WhatsApp Web">
    Channel platform perpesanan berbasis WhatsApp Web (`Baileys`) dalam arsitektur channel OpenClaw saat ini.

    Tidak ada channel perpesanan WhatsApp Twilio terpisah dalam registri chat-channel bawaan.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway memiliki socket WhatsApp dan loop reconnect.
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun target.
- Chat status dan broadcast diabaikan (`@status`, `@broadcast`).
- Chat langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke sesi utama agent).
- Sesi grup diisolasi (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web mematuhi variabel lingkungan proxy standar pada host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varian huruf kecil). Pilih konfigurasi proxy tingkat host daripada pengaturan proxy WhatsApp khusus channel.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy` mengontrol akses chat langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal).

    Override multi-akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `allowFrom`) diutamakan daripada default tingkat channel untuk akun tersebut.

    Detail perilaku runtime:

    - pairing dipersistenkan di allow-store channel dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - jika tidak ada allowlist yang dikonfigurasi, nomor diri tertaut diizinkan secara default
    - DM `fromMe` keluar tidak pernah di-pairing secara otomatis

  </Tab>

  <Tab title="Kebijakan grup + allowlist">
    Akses grup memiliki dua lapisan:

    1. **Allowlist keanggotaan grup** (`channels.whatsapp.groups`)
       - jika `groups` dihilangkan, semua grup memenuhi syarat
       - jika `groups` ada, itu bertindak sebagai allowlist grup (`"*"` diizinkan)

    2. **Kebijakan pengirim grup** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist pengirim dilewati
       - `allowlist`: pengirim harus cocok dengan `groupAllowFrom` (atau `*`)
       - `disabled`: blokir semua pesan masuk grup

    Fallback allowlist pengirim:

    - jika `groupAllowFrom` tidak ditetapkan, runtime fallback ke `allowFrom` jika tersedia
    - allowlist pengirim dievaluasi sebelum aktivasi mention/balasan

    Catatan: jika tidak ada blok `channels.whatsapp` sama sekali, fallback kebijakan grup runtime adalah `allowlist` (dengan log peringatan), meskipun `channels.defaults.groupPolicy` diatur.

  </Tab>

  <Tab title="Mention + /activation">
    Balasan grup secara default memerlukan mention.

    Deteksi mention mencakup:

    - mention WhatsApp eksplisit atas identitas bot
    - pola regex mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - deteksi balas-ke-bot implisit (pengirim balasan cocok dengan identitas bot)

    Catatan keamanan:

    - kutip/balas hanya memenuhi pembatasan mention; itu **tidak** memberikan otorisasi pengirim
    - dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada di allowlist tetap diblokir meskipun mereka membalas pesan pengguna yang ada di allowlist

    Perintah aktivasi tingkat sesi:

    - `/activation mention`
    - `/activation always`

    `activation` memperbarui status sesi (bukan konfigurasi global). Ini dibatasi untuk owner.

  </Tab>
</Tabs>

## Perilaku nomor pribadi dan self-chat

Saat nomor diri tertaut juga ada di `allowFrom`, perlindungan self-chat WhatsApp aktif:

- lewati read receipt untuk giliran self-chat
- abaikan perilaku pemicu otomatis mention-JID yang sebaliknya akan mem-ping diri Anda sendiri
- jika `messages.responsePrefix` tidak diatur, balasan self-chat secara default menjadi `[{identity.name}]` atau `[openclaw]`

## Normalisasi pesan dan konteks

<AccordionGroup>
  <Accordion title="Envelope masuk + konteks balasan">
    Pesan WhatsApp masuk dibungkus dalam envelope masuk bersama.

    Jika ada balasan kutipan, konteks ditambahkan dalam bentuk ini:

    ```text
    [Membalas ke <sender> id:<stanzaId>]
    <isi kutipan atau placeholder media>
    [/Membalas]
    ```

    Field metadata balasan juga diisi jika tersedia (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan masuk yang hanya berisi media dinormalisasi dengan placeholder seperti:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Payload lokasi dan kontak dinormalisasi menjadi konteks tekstual sebelum routing.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Untuk grup, pesan yang belum diproses dapat di-buffer dan diinjeksi sebagai konteks saat bot akhirnya dipicu.

    - batas default: `50`
    - konfigurasi: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Marker injeksi:

    - `[Pesan chat sejak balasan terakhir Anda - untuk konteks]`
    - `[Pesan saat ini - respons untuk ini]`

  </Accordion>

  <Accordion title="Read receipt">
    Read receipt diaktifkan secara default untuk pesan WhatsApp masuk yang diterima.

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

    Override per-akun:

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

    Giliran self-chat melewati read receipt meskipun diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, chunking, dan media

<AccordionGroup>
  <Accordion title="Chunking teks">
    - batas chunk default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - mode `newline` mengutamakan batas paragraf (baris kosong), lalu fallback ke chunking aman berdasarkan panjang
  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (voice-note PTT), dan dokumen
    - `audio/ogg` ditulis ulang menjadi `audio/ogg; codecs=opus` untuk kompatibilitas voice-note
    - pemutaran GIF animasi didukung melalui `gifPlayback: true` pada pengiriman video
    - caption diterapkan pada item media pertama saat mengirim payload balasan multi-media
    - sumber media dapat berupa HTTP(S), `file://`, atau path lokal
  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas simpan media masuk: `channels.whatsapp.mediaMaxMb` (default `50`)
    - batas kirim media keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - override per-akun menggunakan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - gambar dioptimalkan otomatis (sweep resize/kualitas) agar sesuai batas
    - saat pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih membuang respons secara diam-diam
  </Accordion>
</AccordionGroup>

## Tingkat reaksi

`channels.whatsapp.reactionLevel` mengontrol seberapa luas agent menggunakan reaksi emoji di WhatsApp:

| Tingkat       | Reaksi ack | Reaksi yang dimulai agent | Deskripsi                                        |
| ------------- | ---------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Tidak      | Tidak                     | Tidak ada reaksi sama sekali                     |
| `"ack"`       | Ya         | Tidak                     | Hanya reaksi ack (tanda terima pra-balasan)      |
| `"minimal"`   | Ya         | Ya (konservatif)          | Ack + reaksi agent dengan panduan konservatif    |
| `"extensive"` | Ya         | Ya (didorong)             | Ack + reaksi agent dengan panduan yang didorong  |

Default: `"minimal"`.

Override per-akun menggunakan `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp mendukung reaksi ack langsung saat tanda terima pesan masuk melalui `channels.whatsapp.ackReaction`.
Reaksi ack dibatasi oleh `reactionLevel` — reaksi ini ditekan saat `reactionLevel` adalah `"off"`.

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

- dikirim segera setelah pesan masuk diterima (pra-balasan)
- kegagalan dicatat ke log tetapi tidak memblokir pengiriman balasan normal
- mode grup `mentions` bereaksi pada giliran yang dipicu mention; aktivasi grup `always` bertindak sebagai bypass untuk pemeriksaan ini
- WhatsApp menggunakan `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` tidak digunakan di sini)

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan default">
    - id akun berasal dari `channels.whatsapp.accounts`
    - pemilihan akun default: `default` jika ada, jika tidak id akun pertama yang dikonfigurasi (diurutkan)
    - id akun dinormalisasi secara internal untuk lookup
  </Accordion>

  <Accordion title="Path kredensial dan kompatibilitas legacy">
    - path auth saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file cadangan: `creds.json.bak`
    - auth default legacy di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default
  </Accordion>

  <Accordion title="Perilaku logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status auth WhatsApp untuk akun tersebut.

    Di direktori auth legacy, `oauth.json` dipertahankan sementara file auth Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, aksi, dan penulisan konfigurasi

- Dukungan alat agent mencakup aksi reaksi WhatsApp (`react`).
- Pembatas aksi:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Penulisan konfigurasi yang dimulai dari channel diaktifkan secara default (nonaktifkan melalui `channels.whatsapp.configWrites=false`).

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Belum tertaut (QR diperlukan)">
    Gejala: status channel melaporkan belum tertaut.

    Perbaikan:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Tertaut tetapi terputus / loop reconnect">
    Gejala: akun tertaut dengan pemutusan berulang atau percobaan reconnect berulang.

    Perbaikan:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Jika diperlukan, tautkan ulang dengan `channels login`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman keluar gagal cepat saat tidak ada listener gateway aktif untuk akun target.

    Pastikan gateway berjalan dan akun sudah tertaut.

  </Accordion>

  <Accordion title="Pesan grup diabaikan secara tidak terduga">
    Periksa dalam urutan ini:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entri allowlist `groups`
    - pembatasan mention (`requireMention` + pola mention)
    - key duplikat di `openclaw.json` (JSON5): entri yang lebih akhir menimpa entri sebelumnya, jadi pertahankan satu `groupPolicy` per cakupan

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime gateway WhatsApp sebaiknya menggunakan Node. Bun ditandai tidak kompatibel untuk operasi gateway WhatsApp/Telegram yang stabil.
  </Accordion>
</AccordionGroup>

## Prompt sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan chat langsung melalui map `groups` dan `direct`.

Hierarki resolusi untuk pesan grup:

Map `groups` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `groups` miliknya sendiri, itu sepenuhnya menggantikan map `groups` root (tanpa deep merge). Lookup prompt kemudian berjalan pada map tunggal hasil tersebut:

1. **Prompt sistem khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan jika entri grup tertentu mendefinisikan `systemPrompt`.
2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan saat entri grup tertentu tidak ada atau tidak mendefinisikan `systemPrompt`.

Hierarki resolusi untuk pesan langsung:

Map `direct` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `direct` miliknya sendiri, itu sepenuhnya menggantikan map `direct` root (tanpa deep merge). Lookup prompt kemudian berjalan pada map tunggal hasil tersebut:

1. **Prompt sistem khusus direct** (`direct["<peerId>"].systemPrompt`): digunakan jika entri peer tertentu mendefinisikan `systemPrompt`.
2. **Prompt sistem wildcard direct** (`direct["*"].systemPrompt`): digunakan saat entri peer tertentu tidak ada atau tidak mendefinisikan `systemPrompt`.

Catatan: `dms` tetap menjadi bucket override riwayat per-DM yang ringan (`dms.<id>.historyLimit`); override prompt berada di bawah `direct`.

**Perbedaan dari perilaku multi-akun Telegram:** Di Telegram, `groups` root sengaja ditekan untuk semua akun dalam penyiapan multi-akun — bahkan akun yang tidak mendefinisikan `groups` miliknya sendiri — untuk mencegah bot menerima pesan grup dari grup yang bukan anggotanya. WhatsApp tidak menerapkan guard ini: `groups` root dan `direct` root selalu diwariskan oleh akun yang tidak mendefinisikan override tingkat akun, terlepas dari berapa banyak akun yang dikonfigurasi. Dalam penyiapan WhatsApp multi-akun, jika Anda menginginkan prompt grup atau direct per-akun, definisikan map lengkap di bawah setiap akun secara eksplisit alih-alih bergantung pada default tingkat root.

Perilaku penting:

- `channels.whatsapp.groups` adalah map konfigurasi per-grup sekaligus allowlist grup tingkat chat. Pada cakupan root maupun akun, `groups["*"]` berarti "semua grup diterima" untuk cakupan tersebut.
- Tambahkan `systemPrompt` grup wildcard hanya jika Anda memang ingin cakupan tersebut menerima semua grup. Jika Anda tetap ingin hanya sekumpulan ID grup tetap yang memenuhi syarat, jangan gunakan `groups["*"]` untuk default prompt. Sebagai gantinya, ulangi prompt pada setiap entri grup yang secara eksplisit ada di allowlist.
- Penerimaan grup dan otorisasi pengirim adalah pemeriksaan terpisah. `groups["*"]` memperluas kumpulan grup yang dapat mencapai penanganan grup, tetapi itu sendiri tidak mengotorisasi setiap pengirim di grup tersebut. Akses pengirim tetap dikontrol secara terpisah oleh `channels.whatsapp.groupPolicy` dan `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang sama untuk DM. `direct["*"]` hanya menyediakan konfigurasi chat langsung default setelah DM sudah diterima oleh `dmPolicy` plus aturan `allowFrom` atau pairing-store.

Contoh:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Gunakan hanya jika semua grup harus diterima pada cakupan root.
        // Berlaku untuk semua akun yang tidak mendefinisikan map groups mereka sendiri.
        "*": { systemPrompt: "Prompt default untuk semua grup." },
      },
      direct: {
        // Berlaku untuk semua akun yang tidak mendefinisikan map direct mereka sendiri.
        "*": { systemPrompt: "Prompt default untuk semua chat langsung." },
      },
      accounts: {
        work: {
          groups: {
            // Akun ini mendefinisikan groups miliknya sendiri, jadi groups root
            // diganti sepenuhnya. Untuk mempertahankan wildcard, definisikan "*" secara eksplisit di sini juga.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Fokus pada manajemen proyek.",
            },
            // Gunakan hanya jika semua grup harus diterima dalam akun ini.
            "*": { systemPrompt: "Prompt default untuk grup kerja." },
          },
          direct: {
            // Akun ini mendefinisikan map direct miliknya sendiri, jadi entri direct root
            // diganti sepenuhnya. Untuk mempertahankan wildcard, definisikan "*" secara eksplisit di sini juga.
            "+15551234567": { systemPrompt: "Prompt untuk chat langsung kerja tertentu." },
            "*": { systemPrompt: "Prompt default untuk chat langsung kerja." },
          },
        },
      },
    },
  },
}
```

## Penunjuk referensi konfigurasi

Referensi utama:

- [Configuration reference - WhatsApp](/id/gateway/configuration-reference#whatsapp)

Field WhatsApp dengan sinyal tinggi:

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
