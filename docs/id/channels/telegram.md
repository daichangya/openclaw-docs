---
read_when:
    - Mengerjakan fitur Telegram atau webhook
summary: Status dukungan bot Telegram, kapabilitas, dan konfigurasi
title: Telegram
x-i18n:
    generated_at: "2026-04-23T09:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: siap produksi untuk DM bot + grup melalui grammY. Long polling adalah mode default; mode webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pairing.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran dan playbook perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi saluran lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Buat token bot di BotFather">
    Buka Telegram dan chat dengan **@BotFather** (pastikan handle-nya tepat `@BotFather`).

    Jalankan `/newbot`, ikuti petunjuk, lalu simpan token-nya.

  </Step>

  <Step title="Konfigurasikan token dan kebijakan DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Fallback env: `TELEGRAM_BOT_TOKEN=...` (hanya akun default).
    Telegram **tidak** menggunakan `openclaw channels login telegram`; konfigurasikan token di config/env, lalu mulai gateway.

  </Step>

  <Step title="Mulai gateway dan setujui DM pertama">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Kode pairing kedaluwarsa setelah 1 jam.

  </Step>

  <Step title="Tambahkan bot ke grup">
    Tambahkan bot ke grup Anda, lalu atur `channels.telegram.groups` dan `groupPolicy` agar sesuai dengan model akses Anda.
  </Step>
</Steps>

<Note>
Urutan resolusi token bersifat account-aware. Dalam praktiknya, nilai config menang atas fallback env, dan `TELEGRAM_BOT_TOKEN` hanya berlaku untuk akun default.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Mode privasi dan visibilitas grup">
    Bot Telegram secara default menggunakan **Privacy Mode**, yang membatasi pesan grup yang mereka terima.

    Jika bot harus melihat semua pesan grup, lakukan salah satu hal berikut:

    - nonaktifkan privacy mode melalui `/setprivacy`, atau
    - jadikan bot sebagai admin grup.

    Saat mengubah privacy mode, hapus + tambahkan kembali bot di setiap grup agar Telegram menerapkan perubahan.

  </Accordion>

  <Accordion title="Izin grup">
    Status admin dikendalikan di pengaturan grup Telegram.

    Bot admin menerima semua pesan grup, yang berguna untuk perilaku grup yang selalu aktif.

  </Accordion>

  <Accordion title="Toggle BotFather yang berguna">

    - `/setjoingroups` untuk mengizinkan/menolak penambahan ke grup
    - `/setprivacy` untuk perilaku visibilitas grup

  </Accordion>
</AccordionGroup>

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.telegram.dmPolicy` mengendalikan akses pesan langsung:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu sender ID di `allowFrom`)
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` menerima user ID Telegram numerik. Prefiks `telegram:` / `tg:` diterima dan dinormalisasi.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi config.
    Penyiapan hanya meminta user ID numerik.
    Jika Anda melakukan upgrade dan config Anda berisi entri allowlist `@username`, jalankan `openclaw doctor --fix` untuk menyelesaikannya (best-effort; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file allowlist pairing-store, `openclaw doctor --fix` dapat memulihkan entri ke `channels.telegram.allowFrom` dalam alur allowlist (misalnya saat `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot dengan satu pemilik, gunakan `dmPolicy: "allowlist"` dengan `allowFrom` numerik eksplisit agar kebijakan akses tetap tahan lama di config (alih-alih bergantung pada persetujuan pairing sebelumnya).

    Kebingungan yang umum: persetujuan pairing DM tidak berarti "pengirim ini diotorisasi di mana-mana".
    Pairing hanya memberikan akses DM. Otorisasi pengirim grup tetap berasal dari allowlist config yang eksplisit.
    Jika Anda ingin "saya diotorisasi sekali dan DM serta perintah grup keduanya berfungsi", masukkan user ID Telegram numerik Anda ke `channels.telegram.allowFrom`.

    ### Menemukan user ID Telegram Anda

    Lebih aman (tanpa bot pihak ketiga):

    1. Kirim DM ke bot Anda.
    2. Jalankan `openclaw logs --follow`.
    3. Baca `from.id`.

    Metode resmi Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metode pihak ketiga (kurang privat): `@userinfobot` atau `@getidsbot`.

  </Tab>

  <Tab title="Kebijakan grup dan allowlist">
    Dua kontrol berlaku bersama:

    1. **Grup mana yang diizinkan** (`channels.telegram.groups`)
       - tanpa config `groups`:
         - dengan `groupPolicy: "open"`: grup mana pun dapat lolos pemeriksaan group-ID
         - dengan `groupPolicy: "allowlist"` (default): grup diblokir sampai Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai allowlist (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan di grup** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` digunakan untuk pemfilteran pengirim grup. Jika tidak diatur, Telegram akan fallback ke `allowFrom`.
    Entri `groupAllowFrom` harus berupa user ID Telegram numerik (`telegram:` / `tg:` dinormalisasi).
    Jangan masukkan chat ID grup atau supergrup Telegram ke `groupAllowFrom`. Chat ID negatif harus ditempatkan di `channels.telegram.groups`.
    Entri nonnumerik diabaikan untuk otorisasi pengirim.
    Batas keamanan (`2026.2.25+`): auth pengirim grup **tidak** mewarisi persetujuan pairing-store DM.
    Pairing tetap khusus untuk DM. Untuk grup, atur `groupAllowFrom` atau `allowFrom` per grup/per topik.
    Jika `groupAllowFrom` tidak diatur, Telegram fallback ke `allowFrom` config, bukan pairing store.
    Pola praktis untuk bot dengan satu pemilik: atur user ID Anda di `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak diatur, dan izinkan grup target di bawah `channels.telegram.groups`.
    Catatan runtime: jika `channels.telegram` tidak ada sama sekali, default runtime adalah fail-closed `groupPolicy="allowlist"` kecuali `channels.defaults.groupPolicy` diatur secara eksplisit.

    Contoh: izinkan anggota mana pun di satu grup tertentu:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Contoh: izinkan hanya pengguna tertentu di dalam satu grup tertentu:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Kesalahan umum: `groupAllowFrom` bukanlah allowlist grup Telegram.

      - Tempatkan chat ID grup atau supergrup Telegram negatif seperti `-1001234567890` di bawah `channels.telegram.groups`.
      - Tempatkan user ID Telegram seperti `8734062810` di bawah `groupAllowFrom` saat Anda ingin membatasi siapa saja di dalam grup yang diizinkan dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya saat Anda ingin anggota mana pun dari grup yang diizinkan dapat berbicara dengan bot.
    </Warning>

  </Tab>

  <Tab title="Perilaku mention">
    Balasan grup secara default memerlukan mention.

    Mention dapat berasal dari:

    - mention `@botusername` native, atau
    - pola mention di:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Toggle perintah tingkat sesi:

    - `/activation always`
    - `/activation mention`

    Ini hanya memperbarui status sesi. Gunakan config untuk persistensi.

    Contoh config persisten:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Mendapatkan ID chat grup:

    - teruskan pesan grup ke `@userinfobot` / `@getidsbot`
    - atau baca `chat.id` dari `openclaw logs --follow`
    - atau periksa `getUpdates` Bot API

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram dimiliki oleh proses gateway.
- Routing bersifat deterministik: balasan masuk Telegram dikembalikan ke Telegram (model tidak memilih saluran).
- Pesan masuk dinormalisasi ke envelope saluran bersama dengan metadata balasan dan placeholder media.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>` agar topik tetap terisolasi.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw merutekannya dengan session key yang sadar thread dan mempertahankan thread ID untuk balasan.
- Long polling menggunakan runner grammY dengan sequencing per-chat/per-thread. Konkurensi sink runner secara keseluruhan menggunakan `agents.defaults.maxConcurrent`.
- Restart watchdog long polling dipicu setelah 120 detik tanpa liveness `getUpdates` yang selesai secara default. Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya jika deployment Anda masih mengalami restart false polling-stall selama pekerjaan yang berjalan lama. Nilai ini dalam milidetik dan diizinkan dari `30000` hingga `600000`; override per akun didukung.
- Telegram Bot API tidak memiliki dukungan tanda terima baca (`sendReadReceipts` tidak berlaku).

## Referensi fitur

<AccordionGroup>
  <Accordion title="Pratinjau stream live (edit pesan)">
    OpenClaw dapat melakukan streaming balasan parsial secara real time:

    - chat langsung: pesan pratinjau + `editMessageText`
    - grup/topik: pesan pratinjau + `editMessageText`

    Persyaratan:

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - `progress` dipetakan ke `partial` di Telegram (kompatibel dengan penamaan lintas saluran)
    - `streaming.preview.toolProgress` mengontrol apakah pembaruan alat/progres menggunakan kembali pesan pratinjau edit yang sama (default: `true`). Atur `false` untuk mempertahankan pesan alat/progres yang terpisah.
    - `channels.telegram.streamMode` lama dan nilai boolean `streaming` dipetakan otomatis

    Untuk balasan teks saja:

    - DM: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit akhir di tempat (tidak ada pesan kedua)
    - grup/topik: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit akhir di tempat (tidak ada pesan kedua)

    Untuk balasan kompleks (misalnya payload media), OpenClaw fallback ke pengiriman akhir normal lalu membersihkan pesan pratinjau.

    Streaming pratinjau terpisah dari block streaming. Saat block streaming diaktifkan secara eksplisit untuk Telegram, OpenClaw melewati stream pratinjau untuk menghindari streaming ganda.

    Jika transport draft native tidak tersedia/ditolak, OpenClaw otomatis fallback ke `sendMessage` + `editMessageText`.

    Stream reasoning khusus Telegram:

    - `/reasoning stream` mengirim reasoning ke pratinjau live saat menghasilkan
    - jawaban akhir dikirim tanpa teks reasoning

  </Accordion>

  <Accordion title="Pemformatan dan fallback HTML">
    Teks keluar menggunakan Telegram `parse_mode: "HTML"`.

    - Teks bergaya Markdown dirender ke HTML aman Telegram.
    - HTML mentah dari model di-escape untuk mengurangi kegagalan parse Telegram.
    - Jika Telegram menolak HTML yang telah diparse, OpenClaw mencoba ulang sebagai teks biasa.

    Pratinjau tautan diaktifkan secara default dan dapat dinonaktifkan dengan `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Perintah native dan perintah kustom">
    Registrasi menu perintah Telegram ditangani saat startup dengan `setMyCommands`.

    Default perintah native:

    - `commands.native: "auto"` mengaktifkan perintah native untuk Telegram

    Tambahkan entri menu perintah kustom:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Buat gambar" },
      ],
    },
  },
}
```

    Aturan:

    - nama dinormalisasi (hapus `/` di depan, huruf kecil)
    - pola valid: `a-z`, `0-9`, `_`, panjang `1..32`
    - perintah kustom tidak dapat menggantikan perintah native
    - konflik/duplikat dilewati dan dicatat dalam log

    Catatan:

    - perintah kustom hanya berupa entri menu; perintah tersebut tidak otomatis mengimplementasikan perilaku
    - perintah Plugin/Skills tetap dapat berfungsi saat diketik meskipun tidak ditampilkan di menu Telegram

    Jika perintah native dinonaktifkan, perintah bawaan akan dihapus. Perintah kustom/Plugin mungkin tetap didaftarkan jika dikonfigurasi.

    Kegagalan penyiapan yang umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu Telegram masih meluap setelah pemangkasan; kurangi perintah Plugin/Skills/kustom atau nonaktifkan `channels.telegram.commands.native`.
    - `setMyCommands failed` dengan kesalahan network/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah pairing perangkat (Plugin `device-pair`)

    Saat Plugin `device-pair` terinstal:

    1. `/pair` menghasilkan kode penyiapan
    2. tempelkan kode di aplikasi iOS
    3. `/pair pending` menampilkan daftar permintaan yang tertunda (termasuk role/scopes)
    4. setujui permintaan:
       - `/pair approve <requestId>` untuk persetujuan eksplisit
       - `/pair approve` saat hanya ada satu permintaan yang tertunda
       - `/pair approve latest` untuk yang paling baru

    Kode penyiapan membawa token bootstrap berumur singkat. Handoff bootstrap bawaan menjaga token node primary pada `scopes: []`; token operator yang diserahkan tetap dibatasi pada `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`. Pemeriksaan scope bootstrap memakai prefiks role, sehingga allowlist operator tersebut hanya memenuhi permintaan operator; role non-operator tetap memerlukan scope di bawah prefiks role mereka sendiri.

    Jika perangkat mencoba lagi dengan detail auth yang berubah (misalnya role/scopes/public key), permintaan tertunda sebelumnya akan digantikan dan permintaan baru menggunakan `requestId` yang berbeda. Jalankan ulang `/pair pending` sebelum menyetujui.

    Detail selengkapnya: [Pairing](/id/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Tombol inline">
    Konfigurasikan cakupan inline keyboard:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Override per akun:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Cakupan:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (default)

    `capabilities: ["inlineButtons"]` lama dipetakan ke `inlineButtons: "all"`.

    Contoh aksi pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Klik callback diteruskan ke agen sebagai teks:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Aksi pesan Telegram untuk agen dan otomatisasi">
    Aksi alat Telegram meliputi:

    - `sendMessage` (`to`, `content`, opsional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opsional `iconColor`, `iconCustomEmojiId`)

    Aksi pesan saluran mengekspos alias yang ergonomis (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrol gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (default: disabled)

    Catatan: `edit` dan `topic-create` saat ini diaktifkan secara default dan tidak memiliki toggle `channels.telegram.actions.*` terpisah.
    Pengiriman runtime menggunakan snapshot config/secrets yang aktif (startup/reload), sehingga jalur aksi tidak melakukan resolusi ulang SecretRef ad hoc per pengiriman.

    Semantik penghapusan reaksi: [/tools/reactions](/id/tools/reactions)

  </Accordion>

  <Accordion title="Tag threading balasan">
    Telegram mendukung tag threading balasan eksplisit pada output yang dihasilkan:

    - `[[reply_to_current]]` membalas pesan yang memicu
    - `[[reply_to:<id>]]` membalas ID pesan Telegram tertentu

    `channels.telegram.replyToMode` mengontrol penanganan:

    - `off` (default)
    - `first`
    - `all`

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.

  </Accordion>

  <Accordion title="Topik forum dan perilaku thread">
    Supergrup forum:

    - session key topik menambahkan `:topic:<threadId>`
    - balasan dan typing menargetkan thread topik
    - path config topik:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Kasus khusus topik umum (`threadId=1`):

    - pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)`)
    - aksi typing tetap menyertakan `message_thread_id`

    Pewarisan topik: entri topik mewarisi pengaturan grup kecuali dioverride (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` khusus topik dan tidak mewarisi dari default grup.

    **Routing agen per topik**: Setiap topik dapat merutekan ke agen yang berbeda dengan mengatur `agentId` di config topik. Ini memberi setiap topik workspace, memori, dan sesi terisolasi sendiri. Contoh:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Topik umum → agen main
                "3": { agentId: "zu" },        // Topik dev → agen zu
                "5": { agentId: "coder" }      // Code review → agen coder
              }
            }
          }
        }
      }
    }
    ```

    Setiap topik kemudian memiliki session key sendiri: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding topik ACP persisten**: Topik forum dapat menyematkan sesi harness ACP melalui binding ACP bertipe top-level (`bindings[]` dengan `type: "acp"` dan `match.channel: "telegram"`, `peer.kind: "group"`, serta id berkualifikasi topik seperti `-1001234567890:topic:42`). Saat ini dicakup untuk topik forum di grup/supergrup. Lihat [ACP Agents](/id/tools/acp-agents).

    **Spawn ACP terikat thread dari chat**: `/acp spawn <agent> --thread here|auto` mengikat topik saat ini ke sesi ACP baru; tindak lanjut diarahkan langsung ke sana. OpenClaw menyematkan konfirmasi spawn di dalam topik. Memerlukan `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Konteks template mengekspos `MessageThreadId` dan `IsForum`. Chat DM dengan `message_thread_id` tetap mempertahankan routing DM tetapi menggunakan session key yang sadar thread.

  </Accordion>

  <Accordion title="Audio, video, dan stiker">
    ### Pesan audio

    Telegram membedakan voice note dan file audio.

    - default: perilaku file audio
    - tag `[[audio_as_voice]]` di balasan agen untuk memaksa pengiriman voice note

    Contoh aksi pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Pesan video

    Telegram membedakan file video dan video note.

    Contoh aksi pesan:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video note tidak mendukung caption; teks pesan yang diberikan dikirim secara terpisah.

    ### Stiker

    Penanganan stiker masuk:

    - WEBP statis: diunduh dan diproses (placeholder `<media:sticker>`)
    - TGS animasi: dilewati
    - WEBM video: dilewati

    Field konteks stiker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File cache stiker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Stiker dideskripsikan satu kali (jika memungkinkan) dan di-cache untuk mengurangi panggilan vision berulang.

    Aktifkan aksi stiker:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Aksi kirim stiker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cari stiker yang di-cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifikasi reaksi">
    Reaksi Telegram datang sebagai pembaruan `message_reaction` (terpisah dari payload pesan).

    Saat diaktifkan, OpenClaw mengantrikan peristiwa sistem seperti:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Konfigurasi:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    Catatan:

    - `own` berarti hanya reaksi pengguna terhadap pesan yang dikirim bot (best-effort melalui cache pesan terkirim).
    - Peristiwa reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim yang tidak sah dibuang.
    - Telegram tidak menyediakan thread ID dalam pembaruan reaksi.
      - grup non-forum diarahkan ke sesi chat grup
      - grup forum diarahkan ke sesi topik umum grup (`:topic:1`), bukan topik asal yang tepat

    `allowed_updates` untuk polling/webhook otomatis menyertakan `message_reaction`.

  </Accordion>

  <Accordion title="Reaksi ack">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

    Urutan resolusi:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

    Catatan:

    - Telegram mengharapkan emoji unicode (misalnya "👀").
    - Gunakan `""` untuk menonaktifkan reaksi bagi saluran atau akun.

  </Accordion>

  <Accordion title="Penulisan config dari peristiwa dan perintah Telegram">
    Penulisan config saluran diaktifkan secara default (`configWrites !== false`).

    Penulisan yang dipicu Telegram meliputi:

    - peristiwa migrasi grup (`migrate_to_chat_id`) untuk memperbarui `channels.telegram.groups`
    - `/config set` dan `/config unset` (memerlukan pengaktifan perintah)

    Nonaktifkan:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs webhook">
    Default-nya adalah long polling. Untuk mode webhook atur `channels.telegram.webhookUrl` dan `channels.telegram.webhookSecret`; opsional `webhookPath`, `webhookHost`, `webhookPort` (default `/telegram-webhook`, `127.0.0.1`, `8787`).

    Listener lokal melakukan bind ke `127.0.0.1:8787`. Untuk ingress publik, tempatkan reverse proxy di depan port lokal atau atur `webhookHost: "0.0.0.0"` secara sengaja.

  </Accordion>

  <Accordion title="Batas, retry, dan target CLI">
    - default `channels.telegram.textChunkLimit` adalah 4000.
    - `channels.telegram.chunkMode="newline"` mengutamakan batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (default 100) membatasi ukuran media Telegram masuk dan keluar.
    - `channels.telegram.timeoutSeconds` menggantikan timeout klien API Telegram (jika tidak diatur, default grammY berlaku).
    - `channels.telegram.pollingStallThresholdMs` default-nya `120000`; sesuaikan antara `30000` dan `600000` hanya untuk restart polling-stall false-positive.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (default 50); `0` menonaktifkan.
    - konteks tambahan reply/quote/forward saat ini diteruskan sebagaimana diterima.
    - allowlist Telegram terutama membatasi siapa yang dapat memicu agen, bukan batas redaksi konteks tambahan yang lengkap.
    - kontrol riwayat DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - konfigurasi `channels.telegram.retry` berlaku untuk helper pengiriman Telegram (CLI/tools/actions) pada kesalahan API keluar yang dapat dipulihkan.

    Target kirim CLI dapat berupa chat ID numerik atau username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Poll Telegram menggunakan `openclaw message poll` dan mendukung topik forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag poll khusus Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` untuk topik forum (atau gunakan target `:topic:`)

    Pengiriman Telegram juga mendukung:

    - `--presentation` dengan blok `buttons` untuk inline keyboard ketika `channels.telegram.capabilities.inlineButtons` mengizinkannya
    - `--pin` atau `--delivery '{"pin":true}'` untuk meminta pengiriman yang disematkan ketika bot dapat menyematkan di chat tersebut
    - `--force-document` untuk mengirim gambar dan GIF keluar sebagai dokumen, bukan unggahan foto terkompresi atau media animasi

    Gating aksi:

    - `channels.telegram.actions.sendMessage=false` menonaktifkan pesan Telegram keluar, termasuk poll
    - `channels.telegram.actions.poll=false` menonaktifkan pembuatan poll Telegram sambil tetap mengaktifkan pengiriman biasa

  </Accordion>

  <Accordion title="Persetujuan exec di Telegram">
    Telegram mendukung persetujuan exec di DM approver dan secara opsional dapat memposting prompt di chat atau topik asal. Approver harus berupa user ID Telegram numerik.

    Path config:

    - `channels.telegram.execApprovals.enabled` (aktif otomatis ketika setidaknya satu approver dapat diselesaikan)
    - `channels.telegram.execApprovals.approvers` (fallback ke owner ID numerik dari `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (default) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    Pengiriman ke saluran menampilkan teks perintah di chat; aktifkan `channel` atau `both` hanya di grup/topik tepercaya. Saat prompt masuk ke topik forum, OpenClaw mempertahankan topik tersebut untuk prompt persetujuan dan tindak lanjut. Persetujuan exec kedaluwarsa setelah 30 menit secara default.

    Tombol persetujuan inline juga memerlukan `channels.telegram.capabilities.inlineButtons` untuk mengizinkan permukaan target (`dm`, `group`, atau `all`). ID persetujuan yang diawali `plugin:` diselesaikan melalui persetujuan Plugin; yang lainnya diselesaikan melalui persetujuan exec terlebih dahulu.

    Lihat [Persetujuan exec](/id/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Kontrol balasan kesalahan

Saat agen mengalami kesalahan pengiriman atau provider, Telegram dapat membalas dengan teks kesalahan atau menekannya. Dua kunci config mengontrol perilaku ini:

| Kunci                               | Nilai             | Default | Deskripsi                                                                                           |
| ----------------------------------- | ----------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` mengirim pesan kesalahan yang ramah ke chat. `silent` menekan seluruh balasan kesalahan. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Waktu minimum antar balasan kesalahan ke chat yang sama. Mencegah spam kesalahan saat terjadi gangguan.        |

Override per akun, per grup, dan per topik didukung (pewarisan sama seperti kunci config Telegram lainnya).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // tekan kesalahan di grup ini
        },
      },
    },
  },
}
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bot tidak merespons pesan grup yang tidak menyebut mention">

    - Jika `requireMention=false`, privacy mode Telegram harus mengizinkan visibilitas penuh.
      - BotFather: `/setprivacy` -> Disable
      - lalu hapus + tambahkan kembali bot ke grup
    - `openclaw channels status` memberi peringatan ketika config mengharapkan pesan grup tanpa mention.
    - `openclaw channels status --probe` dapat memeriksa group ID numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - uji sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot sama sekali tidak melihat pesan grup">

    - saat `channels.telegram.groups` ada, grup harus terdaftar (atau menyertakan `"*"`)
    - verifikasi keanggotaan bot di grup
    - tinjau log: `openclaw logs --follow` untuk alasan dilewati

  </Accordion>

  <Accordion title="Perintah hanya berfungsi sebagian atau tidak sama sekali">

    - otorisasi identitas pengirim Anda (pairing dan/atau `allowFrom` numerik)
    - otorisasi perintah tetap berlaku meskipun kebijakan grup adalah `open`
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu native memiliki terlalu banyak entri; kurangi perintah Plugin/Skills/kustom atau nonaktifkan menu native
    - `setMyCommands failed` dengan kesalahan network/fetch biasanya menunjukkan masalah keterjangkauan DNS/HTTPS ke `api.telegram.org`

  </Accordion>

  <Accordion title="Polling atau ketidakstabilan jaringan">

    - Node 22+ + fetch/proxy kustom dapat memicu perilaku abort langsung jika tipe AbortSignal tidak cocok.
    - Beberapa host me-resolve `api.telegram.org` ke IPv6 terlebih dahulu; egress IPv6 yang rusak dapat menyebabkan kegagalan API Telegram yang intermiten.
    - Jika log menyertakan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!`, OpenClaw kini mencoba ulang ini sebagai kesalahan jaringan yang dapat dipulihkan.
    - Jika log menyertakan `Polling stall detected`, OpenClaw memulai ulang polling dan membangun ulang transport Telegram setelah 120 detik tanpa liveness long-poll yang selesai secara default.
    - Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya ketika pemanggilan `getUpdates` yang berjalan lama sehat tetapi host Anda masih melaporkan restart polling-stall palsu. Stall yang persisten biasanya menunjukkan masalah proxy, DNS, IPv6, atau TLS egress antara host dan `api.telegram.org`.
    - Pada host VPS dengan egress/TLS langsung yang tidak stabil, arahkan pemanggilan API Telegram melalui `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Default Node 22+ adalah `autoSelectFamily=true` (kecuali WSL2) dan `dnsResultOrder=ipv4first`.
    - Jika host Anda adalah WSL2 atau secara eksplisit bekerja lebih baik dengan perilaku IPv4-only, paksa pemilihan family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang benchmark RFC 2544 (`198.18.0.0/15`) sudah diizinkan
      untuk unduhan media Telegram secara default. Jika fake-IP atau
      proxy transparan tepercaya menulis ulang `api.telegram.org` ke
      alamat private/internal/special-use lain selama unduhan media, Anda dapat memilih
      bypass khusus Telegram ini:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Opsi yang sama juga tersedia per akun di
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proxy Anda me-resolve host media Telegram ke `198.18.x.x`, biarkan
      flag berbahaya ini mati terlebih dahulu. Media Telegram sudah mengizinkan rentang benchmark RFC 2544
      secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` memperlemah perlindungan SSRF media Telegram. Gunakan ini hanya untuk lingkungan proxy tepercaya yang dikendalikan operator
      seperti routing fake-IP Clash, Mihomo, atau Surge ketika mereka
      mensintesis jawaban private atau special-use di luar rentang benchmark RFC 2544. Biarkan nonaktif untuk akses Telegram internet publik normal.
    </Warning>

    - Override env (sementara):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Validasi jawaban DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Bantuan lebih lanjut: [Pemecahan masalah saluran](/id/channels/troubleshooting).

## Pointer referensi config Telegram

Referensi utama:

- `channels.telegram.enabled`: aktifkan/nonaktifkan startup saluran.
- `channels.telegram.botToken`: token bot (BotFather).
- `channels.telegram.tokenFile`: baca token dari path file reguler. Symlink ditolak.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing).
- `channels.telegram.allowFrom`: allowlist DM (user ID Telegram numerik). `allowlist` memerlukan setidaknya satu sender ID. `open` memerlukan `"*"`. `openclaw doctor --fix` dapat menyelesaikan entri `@username` lama ke ID dan dapat memulihkan entri allowlist dari file pairing-store dalam alur migrasi allowlist.
- `channels.telegram.actions.poll`: aktifkan atau nonaktifkan pembuatan poll Telegram (default: aktif; tetap memerlukan `sendMessage`).
- `channels.telegram.defaultTo`: target Telegram default yang digunakan oleh CLI `--deliver` saat tidak ada `--reply-to` eksplisit.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (default: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist pengirim grup (user ID Telegram numerik). `openclaw doctor --fix` dapat menyelesaikan entri `@username` lama ke ID. Entri nonnumerik diabaikan saat auth. Auth grup tidak menggunakan fallback pairing-store DM (`2026.2.25+`).
- Prioritas multi-akun:
  - Saat dua atau lebih account ID dikonfigurasi, atur `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) agar routing default eksplisit.
  - Jika keduanya tidak diatur, OpenClaw akan fallback ke account ID ternormalisasi pertama dan `openclaw doctor` akan memberi peringatan.
  - `channels.telegram.accounts.default.allowFrom` dan `channels.telegram.accounts.default.groupAllowFrom` hanya berlaku untuk akun `default`.
  - Akun bernama mewarisi `channels.telegram.allowFrom` dan `channels.telegram.groupAllowFrom` saat nilai tingkat akun tidak diatur.
  - Akun bernama tidak mewarisi `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: default per grup + allowlist (gunakan `"*"` untuk default global).
  - `channels.telegram.groups.<id>.groupPolicy`: override per grup untuk groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: default gating mention.
  - `channels.telegram.groups.<id>.skills`: filter Skills (hilangkan = semua Skills, kosong = tidak ada).
  - `channels.telegram.groups.<id>.allowFrom`: override allowlist pengirim per grup.
  - `channels.telegram.groups.<id>.systemPrompt`: system prompt tambahan untuk grup.
  - `channels.telegram.groups.<id>.enabled`: nonaktifkan grup saat `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: override per topik (field grup + `agentId` khusus topik).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: rute topik ini ke agen tertentu (menggantikan routing tingkat grup dan binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: override per topik untuk groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: override gating mention per topik.
- `bindings[]` top-level dengan `type: "acp"` dan id topik kanonis `chatId:topic:topicId` di `match.peer.id`: field binding topik ACP persisten (lihat [ACP Agents](/id/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: rute topik DM ke agen tertentu (perilaku sama seperti topik forum).
- `channels.telegram.execApprovals.enabled`: aktifkan Telegram sebagai klien persetujuan exec berbasis chat untuk akun ini.
- `channels.telegram.execApprovals.approvers`: user ID Telegram yang diizinkan untuk menyetujui atau menolak permintaan exec. Opsional saat `channels.telegram.allowFrom` atau `channels.telegram.defaultTo` langsung sudah mengidentifikasi pemilik.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (default: `dm`). `channel` dan `both` mempertahankan topik Telegram asal jika ada.
- `channels.telegram.execApprovals.agentFilter`: filter agent ID opsional untuk prompt persetujuan yang diteruskan.
- `channels.telegram.execApprovals.sessionFilter`: filter session key opsional (substring atau regex) untuk prompt persetujuan yang diteruskan.
- `channels.telegram.accounts.<account>.execApprovals`: override per akun untuk routing persetujuan exec Telegram dan otorisasi approver.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (default: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: override per akun.
- `channels.telegram.commands.nativeSkills`: aktifkan/nonaktifkan perintah Skills native Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (default: `off`).
- `channels.telegram.textChunkLimit`: ukuran chunk keluar (karakter).
- `channels.telegram.chunkMode`: `length` (default) atau `newline` untuk memisahkan pada baris kosong (batas paragraf) sebelum chunking berdasarkan panjang.
- `channels.telegram.linkPreview`: toggle pratinjau tautan untuk pesan keluar (default: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (pratinjau stream live; default: `partial`; `progress` dipetakan ke `partial`; `block` adalah kompatibilitas mode pratinjau lama). Streaming pratinjau Telegram menggunakan satu pesan pratinjau yang diedit di tempat.
- `channels.telegram.streaming.preview.toolProgress`: gunakan kembali pesan pratinjau live untuk pembaruan alat/progres saat streaming pratinjau aktif (default: `true`). Atur `false` untuk mempertahankan pesan alat/progres yang terpisah.
- `channels.telegram.mediaMaxMb`: batas media Telegram masuk/keluar (MB, default: 100).
- `channels.telegram.retry`: kebijakan retry untuk helper pengiriman Telegram (CLI/tools/actions) pada kesalahan API keluar yang dapat dipulihkan (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: override `autoSelectFamily` Node (true=aktifkan, false=nonaktifkan). Default aktif pada Node 22+, dengan default nonaktif pada WSL2.
- `channels.telegram.network.dnsResultOrder`: override urutan hasil DNS (`ipv4first` atau `verbatim`). Default `ipv4first` pada Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: opt-in berbahaya untuk lingkungan fake-IP atau proxy transparan tepercaya tempat unduhan media Telegram me-resolve `api.telegram.org` ke alamat private/internal/special-use di luar rentang benchmark RFC 2544 default yang diizinkan.
- `channels.telegram.proxy`: URL proxy untuk pemanggilan Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: aktifkan mode webhook (memerlukan `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: secret webhook (wajib saat webhookUrl diatur).
- `channels.telegram.webhookPath`: path webhook lokal (default `/telegram-webhook`).
- `channels.telegram.webhookHost`: host bind webhook lokal (default `127.0.0.1`).
- `channels.telegram.webhookPort`: port bind webhook lokal (default `8787`).
- `channels.telegram.actions.reactions`: gating reaksi alat Telegram.
- `channels.telegram.actions.sendMessage`: gating pengiriman pesan alat Telegram.
- `channels.telegram.actions.deleteMessage`: gating penghapusan pesan alat Telegram.
- `channels.telegram.actions.sticker`: gating aksi stiker Telegram — kirim dan cari (default: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kontrol reaksi mana yang memicu peristiwa sistem (default: `own` saat tidak diatur).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kontrol kapabilitas reaksi agen (default: `minimal` saat tidak diatur).
- `channels.telegram.errorPolicy`: `reply | silent` — kontrol perilaku balasan kesalahan (default: `reply`). Override per akun/grup/topik didukung.
- `channels.telegram.errorCooldownMs`: ms minimum antar balasan kesalahan ke chat yang sama (default: `60000`). Mencegah spam kesalahan saat terjadi gangguan.

- [Referensi konfigurasi - Telegram](/id/gateway/configuration-reference#telegram)

Field Telegram spesifik dengan sinyal tinggi:

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` harus menunjuk ke file reguler; symlink ditolak)
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` top-level (`type: "acp"`)
- persetujuan exec: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/balasan: `replyToMode`
- streaming: `streaming` (pratinjau), `streaming.preview.toolProgress`, `blockStreaming`
- pemformatan/pengiriman: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaksi: `reactionNotifications`, `reactionLevel`
- kesalahan: `errorPolicy`, `errorCooldownMs`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Terkait

- [Pairing](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Keamanan](/id/gateway/security)
- [Routing saluran](/id/channels/channel-routing)
- [Routing multi-agen](/id/concepts/multi-agent)
- [Pemecahan masalah](/id/channels/troubleshooting)
