---
read_when:
    - Mengerjakan fitur Telegram atau Webhook
summary: Status dukungan, kemampuan, dan konfigurasi bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-21T09:15:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c70775b55d4923a31ad8bae7f4c6e7cbae754c05c3a578180d63db2b59e39a
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Status: siap produksi untuk DM bot + grup melalui grammY. Long polling adalah mode default; mode webhook bersifat opsional.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk Telegram adalah pairing.
  </Card>
  <Card title="Pemecahan masalah channel" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas-channel dan playbook perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi channel lengkap.
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
Urutan resolusi token sadar-akun. Dalam praktiknya, nilai config mengalahkan fallback env, dan `TELEGRAM_BOT_TOKEN` hanya berlaku untuk akun default.
</Note>

## Pengaturan sisi Telegram

<AccordionGroup>
  <Accordion title="Mode privasi dan visibilitas grup">
    Bot Telegram secara default menggunakan **Privacy Mode**, yang membatasi pesan grup yang mereka terima.

    Jika bot harus melihat semua pesan grup, lakukan salah satu:

    - nonaktifkan mode privasi melalui `/setprivacy`, atau
    - jadikan bot admin grup.

    Saat mengubah mode privasi, keluarkan lalu tambahkan kembali bot di setiap grup agar Telegram menerapkan perubahan tersebut.

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
    `channels.telegram.dmPolicy` mengontrol akses direct message:

    - `pairing` (default)
    - `allowlist` (memerlukan setidaknya satu ID pengirim di `allowFrom`)
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` menerima ID pengguna Telegram numerik. Prefix `telegram:` / `tg:` diterima dan dinormalisasi.
    `dmPolicy: "allowlist"` dengan `allowFrom` kosong memblokir semua DM dan ditolak oleh validasi config.
    Penyiapan hanya meminta ID pengguna numerik.
    Jika Anda melakukan upgrade dan config Anda berisi entri allowlist `@username`, jalankan `openclaw doctor --fix` untuk menyelesaikannya (best-effort; memerlukan token bot Telegram).
    Jika sebelumnya Anda mengandalkan file allowlist pairing-store, `openclaw doctor --fix` dapat memulihkan entri ke `channels.telegram.allowFrom` dalam alur allowlist (misalnya saat `dmPolicy: "allowlist"` belum memiliki ID eksplisit).

    Untuk bot dengan satu pemilik, gunakan `dmPolicy: "allowlist"` dengan ID `allowFrom` numerik yang eksplisit agar kebijakan akses tetap tahan lama di config (alih-alih bergantung pada persetujuan pairing sebelumnya).

    Kebingungan umum: persetujuan pairing DM tidak berarti "pengirim ini diotorisasi di mana saja".
    Pairing hanya memberikan akses DM. Otorisasi pengirim grup tetap berasal dari allowlist config yang eksplisit.
    Jika Anda ingin "saya diotorisasi sekali dan DM maupun perintah grup sama-sama berfungsi", masukkan ID pengguna Telegram numerik Anda ke `channels.telegram.allowFrom`.

    ### Menemukan ID pengguna Telegram Anda

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
    Dua kontrol diterapkan bersama:

    1. **Grup mana yang diizinkan** (`channels.telegram.groups`)
       - tidak ada config `groups`:
         - dengan `groupPolicy: "open"`: grup apa pun dapat lolos pemeriksaan group-ID
         - dengan `groupPolicy: "allowlist"` (default): grup diblokir sampai Anda menambahkan entri `groups` (atau `"*"`)
       - `groups` dikonfigurasi: bertindak sebagai allowlist (ID eksplisit atau `"*"`)

    2. **Pengirim mana yang diizinkan di grup** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` digunakan untuk pemfilteran pengirim grup. Jika tidak diatur, Telegram akan fallback ke `allowFrom`.
    Entri `groupAllowFrom` harus berupa ID pengguna Telegram numerik (prefix `telegram:` / `tg:` dinormalisasi).
    Jangan masukkan chat ID grup atau supergroup Telegram ke `groupAllowFrom`. Chat ID negatif harus ditempatkan di bawah `channels.telegram.groups`.
    Entri non-numerik diabaikan untuk otorisasi pengirim.
    Batas keamanan (`2026.2.25+`): auth pengirim grup **tidak** mewarisi persetujuan pairing-store DM.
    Pairing tetap hanya untuk DM. Untuk grup, atur `groupAllowFrom` atau `allowFrom` per-grup/per-topik.
    Jika `groupAllowFrom` tidak diatur, Telegram fallback ke config `allowFrom`, bukan pairing store.
    Pola praktis untuk bot dengan satu pemilik: atur ID pengguna Anda di `channels.telegram.allowFrom`, biarkan `groupAllowFrom` tidak diatur, dan izinkan grup target di bawah `channels.telegram.groups`.
    Catatan runtime: jika `channels.telegram` benar-benar tidak ada, default runtime adalah fail-closed `groupPolicy="allowlist"` kecuali `channels.defaults.groupPolicy` diatur secara eksplisit.

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
      Kesalahan umum: `groupAllowFrom` bukan allowlist grup Telegram.

      - Tempatkan chat ID grup atau supergroup Telegram negatif seperti `-1001234567890` di bawah `channels.telegram.groups`.
      - Tempatkan ID pengguna Telegram seperti `8734062810` di bawah `groupAllowFrom` saat Anda ingin membatasi orang mana di dalam grup yang diizinkan yang dapat memicu bot.
      - Gunakan `groupAllowFrom: ["*"]` hanya saat Anda ingin anggota mana pun dari grup yang diizinkan dapat berbicara dengan bot.
    </Warning>

  </Tab>

  <Tab title="Perilaku mention">
    Balasan grup secara default memerlukan mention.

    Mention dapat berasal dari:

    - mention native `@botusername`, atau
    - pola mention di:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Toggle perintah level sesi:

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
    - atau periksa Bot API `getUpdates`

  </Tab>
</Tabs>

## Perilaku runtime

- Telegram dimiliki oleh proses gateway.
- Routing bersifat deterministik: balasan masuk dari Telegram dikembalikan ke Telegram (model tidak memilih channel).
- Pesan masuk dinormalisasi ke shared channel envelope dengan metadata balasan dan placeholder media.
- Sesi grup diisolasi berdasarkan ID grup. Topik forum menambahkan `:topic:<threadId>` agar topik tetap terisolasi.
- Pesan DM dapat membawa `message_thread_id`; OpenClaw merutekannya dengan kunci sesi yang sadar-thread dan mempertahankan thread ID untuk balasan.
- Long polling menggunakan grammY runner dengan pengurutan per-chat/per-thread. Sink concurrency runner keseluruhan menggunakan `agents.defaults.maxConcurrent`.
- Restart watchdog long-polling dipicu setelah 120 detik tanpa liveness `getUpdates` yang selesai secara default. Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya jika deployment Anda masih melihat restart polling-stall palsu selama pekerjaan yang berjalan lama. Nilainya dalam milidetik dan diizinkan dari `30000` hingga `600000`; override per-akun didukung.
- Telegram Bot API tidak memiliki dukungan tanda-terima baca (`sendReadReceipts` tidak berlaku).

## Referensi fitur

<AccordionGroup>
  <Accordion title="Pratinjau stream langsung (pengeditan pesan)">
    OpenClaw dapat melakukan streaming balasan parsial secara real time:

    - chat langsung: pesan pratinjau + `editMessageText`
    - grup/topik: pesan pratinjau + `editMessageText`

    Persyaratan:

    - `channels.telegram.streaming` adalah `off | partial | block | progress` (default: `partial`)
    - `progress` dipetakan ke `partial` di Telegram (kompatibel dengan penamaan lintas-channel)
    - nilai boolean `channels.telegram.streamMode` dan `streaming` lama dipetakan otomatis

    Untuk balasan teks saja:

    - DM: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit final di tempat (tanpa pesan kedua)
    - grup/topik: OpenClaw mempertahankan pesan pratinjau yang sama dan melakukan edit final di tempat (tanpa pesan kedua)

    Untuk balasan kompleks (misalnya payload media), OpenClaw fallback ke pengiriman final normal lalu membersihkan pesan pratinjau.

    Streaming pratinjau terpisah dari block streaming. Saat block streaming diaktifkan secara eksplisit untuk Telegram, OpenClaw melewati stream pratinjau agar tidak terjadi streaming ganda.

    Jika transport draft native tidak tersedia/ditolak, OpenClaw otomatis fallback ke `sendMessage` + `editMessageText`.

    Stream reasoning khusus Telegram:

    - `/reasoning stream` mengirim reasoning ke pratinjau langsung selama proses pembuatan
    - jawaban final dikirim tanpa teks reasoning

  </Accordion>

  <Accordion title="Pemformatan dan fallback HTML">
    Teks keluar menggunakan Telegram `parse_mode: "HTML"`.

    - Teks bergaya Markdown dirender menjadi HTML aman untuk Telegram.
    - HTML mentah dari model di-escape untuk mengurangi kegagalan parse Telegram.
    - Jika Telegram menolak HTML yang sudah di-parse, OpenClaw mencoba ulang sebagai teks biasa.

    Pratinjau tautan aktif secara default dan dapat dinonaktifkan dengan `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Perintah native dan perintah kustom">
    Pendaftaran menu perintah Telegram ditangani saat startup dengan `setMyCommands`.

    Default perintah native:

    - `commands.native: "auto"` mengaktifkan perintah native untuk Telegram

    Tambahkan entri menu perintah kustom:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Cadangan Git" },
        { command: "generate", description: "Buat gambar" },
      ],
    },
  },
}
```

    Aturan:

    - nama dinormalisasi (hapus `/` di awal, huruf kecil)
    - pola valid: `a-z`, `0-9`, `_`, panjang `1..32`
    - perintah kustom tidak dapat menimpa perintah native
    - konflik/duplikat dilewati dan dicatat ke log

    Catatan:

    - perintah kustom hanyalah entri menu; mereka tidak otomatis mengimplementasikan perilaku
    - perintah plugin/Skills tetap dapat berfungsi saat diketik meskipun tidak ditampilkan di menu Telegram

    Jika perintah native dinonaktifkan, bawaan akan dihapus. Perintah kustom/plugin mungkin tetap didaftarkan jika dikonfigurasi.

    Kegagalan penyiapan umum:

    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu Telegram masih meluap setelah dipangkas; kurangi perintah plugin/Skills/kustom atau nonaktifkan `channels.telegram.commands.native`.
    - `setMyCommands failed` dengan error jaringan/fetch biasanya berarti DNS/HTTPS keluar ke `api.telegram.org` diblokir.

    ### Perintah pairing perangkat (plugin `device-pair`)

    Saat plugin `device-pair` terpasang:

    1. `/pair` menghasilkan kode penyiapan
    2. tempelkan kode di aplikasi iOS
    3. `/pair pending` menampilkan daftar permintaan yang tertunda (termasuk role/scopes)
    4. setujui permintaan:
       - `/pair approve <requestId>` untuk persetujuan eksplisit
       - `/pair approve` saat hanya ada satu permintaan tertunda
       - `/pair approve latest` untuk yang paling baru

    Kode penyiapan membawa bootstrap token yang berlaku singkat. Built-in bootstrap handoff menjaga token node utama tetap di `scopes: []`; token operator yang diserahkan tetap dibatasi ke `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`. Pemeriksaan bootstrap scope berawalan role, sehingga allowlist operator tersebut hanya memenuhi permintaan operator; role non-operator tetap memerlukan scope di bawah prefix role mereka sendiri.

    Jika sebuah perangkat mencoba ulang dengan detail auth yang berubah (misalnya role/scopes/public key), permintaan tertunda sebelumnya akan digantikan dan permintaan baru akan menggunakan `requestId` yang berbeda. Jalankan ulang `/pair pending` sebelum menyetujui.

    Detail selengkapnya: [Pairing](/id/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Tombol inline">
    Konfigurasikan cakupan keyboard inline:

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

    Override per-akun:

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
  message: "Pilih sebuah opsi:",
  buttons: [
    [
      { text: "Ya", callback_data: "yes" },
      { text: "Tidak", callback_data: "no" },
    ],
    [{ text: "Batal", callback_data: "cancel" }],
  ],
}
```

    Klik callback diteruskan ke agent sebagai teks:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Aksi pesan Telegram untuk agent dan otomasi">
    Aksi tool Telegram meliputi:

    - `sendMessage` (`to`, `content`, opsional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opsional `iconColor`, `iconCustomEmojiId`)

    Aksi pesan channel menampilkan alias yang ergonomis (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kontrol gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (default: dinonaktifkan)

    Catatan: `edit` dan `topic-create` saat ini diaktifkan secara default dan tidak memiliki toggle `channels.telegram.actions.*` terpisah.
    Pengiriman runtime menggunakan snapshot config/secrets yang aktif (startup/reload), sehingga jalur aksi tidak melakukan re-resolve SecretRef ad hoc untuk setiap pengiriman.

    Semantik penghapusan reaksi: [/tools/reactions](/id/tools/reactions)

  </Accordion>

  <Accordion title="Tag threading balasan">
    Telegram mendukung tag threading balasan eksplisit dalam output yang dihasilkan:

    - `[[reply_to_current]]` membalas pesan yang memicu
    - `[[reply_to:<id>]]` membalas ID pesan Telegram tertentu

    `channels.telegram.replyToMode` mengontrol penanganan:

    - `off` (default)
    - `first`
    - `all`

    Catatan: `off` menonaktifkan threading balasan implisit. Tag `[[reply_to_*]]` eksplisit tetap dihormati.

  </Accordion>

  <Accordion title="Topik forum dan perilaku thread">
    Supergroup forum:

    - kunci sesi topik menambahkan `:topic:<threadId>`
    - balasan dan pengetikan menargetkan thread topik
    - jalur config topik:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Kasus khusus topik umum (`threadId=1`):

    - pengiriman pesan menghilangkan `message_thread_id` (Telegram menolak `sendMessage(...thread_id=1)`)
    - aksi mengetik tetap menyertakan `message_thread_id`

    Pewarisan topik: entri topik mewarisi pengaturan grup kecuali dioverride (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` hanya untuk topik dan tidak mewarisi dari default grup.

    **Routing agent per-topik**: Setiap topik dapat dirutekan ke agent yang berbeda dengan menetapkan `agentId` di config topik. Ini memberi setiap topik workspace, memori, dan sesi terisolasi sendiri. Contoh:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Topik umum → agent main
                "3": { agentId: "zu" },        // Topik dev → agent zu
                "5": { agentId: "coder" }      // Tinjauan kode → agent coder
              }
            }
          }
        }
      }
    }
    ```

    Setiap topik kemudian memiliki kunci sesinya sendiri: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding topik ACP persisten**: Topik forum dapat menyematkan sesi harness ACP melalui binding ACP bertipe di level atas:

    - `bindings[]` dengan `type: "acp"` dan `match.channel: "telegram"`

    Contoh:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Ini saat ini dibatasi pada topik forum di grup dan supergroup.

    **Spawn ACP terikat thread dari chat**:

    - `/acp spawn <agent> --thread here|auto` dapat mengikat topik Telegram saat ini ke sesi ACP baru.
    - Pesan topik lanjutan dirutekan langsung ke sesi ACP yang terikat (tidak perlu `/acp steer`).
    - OpenClaw menyematkan pesan konfirmasi spawn di dalam topik setelah pengikatan berhasil.
    - Memerlukan `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Konteks template mencakup:

    - `MessageThreadId`
    - `IsForum`

    Perilaku thread DM:

    - chat privat dengan `message_thread_id` tetap mempertahankan routing DM tetapi menggunakan kunci sesi/target balasan yang sadar-thread.

  </Accordion>

  <Accordion title="Audio, video, dan stiker">
    ### Pesan audio

    Telegram membedakan voice note dan file audio.

    - default: perilaku file audio
    - tag `[[audio_as_voice]]` dalam balasan agent untuk memaksa pengiriman sebagai voice note

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

    Stiker dideskripsikan satu kali (jika memungkinkan) dan di-cache untuk mengurangi panggilan vision yang berulang.

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
    Reaksi Telegram datang sebagai update `message_reaction` (terpisah dari payload pesan).

    Saat diaktifkan, OpenClaw memasukkan event sistem seperti:

    - `Reaksi Telegram ditambahkan: 👍 oleh Alice (@alice) pada pesan 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    Catatan:

    - `own` berarti reaksi pengguna hanya pada pesan yang dikirim bot (best-effort melalui cache pesan terkirim).
    - Event reaksi tetap mematuhi kontrol akses Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); pengirim yang tidak diotorisasi akan dibuang.
    - Telegram tidak menyediakan thread ID dalam update reaksi.
      - grup non-forum dirutekan ke sesi chat grup
      - grup forum dirutekan ke sesi topik umum grup (`:topic:1`), bukan ke topik asal yang tepat

    `allowed_updates` untuk polling/webhook otomatis menyertakan `message_reaction`.

  </Accordion>

  <Accordion title="Reaksi ack">
    `ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

    Urutan resolusi:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identitas agent (`agents.list[].identity.emoji`, atau "👀")

    Catatan:

    - Telegram mengharapkan emoji unicode (misalnya "👀").
    - Gunakan `""` untuk menonaktifkan reaksi bagi sebuah channel atau akun.

  </Accordion>

  <Accordion title="Penulisan config dari event dan perintah Telegram">
    Penulisan config channel diaktifkan secara default (`configWrites !== false`).

    Penulisan yang dipicu Telegram mencakup:

    - event migrasi grup (`migrate_to_chat_id`) untuk memperbarui `channels.telegram.groups`
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
    Default: long polling.

    Mode webhook:

    - atur `channels.telegram.webhookUrl`
    - atur `channels.telegram.webhookSecret` (wajib saat webhook URL diatur)
    - opsional `channels.telegram.webhookPath` (default `/telegram-webhook`)
    - opsional `channels.telegram.webhookHost` (default `127.0.0.1`)
    - opsional `channels.telegram.webhookPort` (default `8787`)

    Listener lokal default untuk mode webhook melakukan bind ke `127.0.0.1:8787`.

    Jika endpoint publik Anda berbeda, tempatkan reverse proxy di depan lalu arahkan `webhookUrl` ke URL publik.
    Atur `webhookHost` (misalnya `0.0.0.0`) saat Anda memang membutuhkan ingress eksternal.

  </Accordion>

  <Accordion title="Batas, retry, dan target CLI">
    - default `channels.telegram.textChunkLimit` adalah 4000.
    - `channels.telegram.chunkMode="newline"` mengutamakan batas paragraf (baris kosong) sebelum pemisahan berdasarkan panjang.
    - `channels.telegram.mediaMaxMb` (default 100) membatasi ukuran media Telegram masuk dan keluar.
    - `channels.telegram.timeoutSeconds` mengoverride timeout klien Telegram API (jika tidak diatur, default grammY berlaku).
    - default `channels.telegram.pollingStallThresholdMs` adalah `120000`; sesuaikan antara `30000` dan `600000` hanya untuk restart polling-stall false-positive.
    - riwayat konteks grup menggunakan `channels.telegram.historyLimit` atau `messages.groupChat.historyLimit` (default 50); `0` menonaktifkan.
    - konteks tambahan reply/quote/forward saat ini diteruskan sebagaimana diterima.
    - allowlist Telegram terutama membatasi siapa yang dapat memicu agent, bukan batas redaksi konteks tambahan penuh.
    - kontrol riwayat DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - config `channels.telegram.retry` berlaku untuk helper pengiriman Telegram (CLI/tools/actions) pada error API keluar yang dapat dipulihkan.

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

    - `--buttons` untuk keyboard inline saat `channels.telegram.capabilities.inlineButtons` mengizinkannya
    - `--force-document` untuk mengirim gambar dan GIF keluar sebagai dokumen alih-alih unggahan foto terkompresi atau media animasi

    Gating aksi:

    - `channels.telegram.actions.sendMessage=false` menonaktifkan pesan Telegram keluar, termasuk poll
    - `channels.telegram.actions.poll=false` menonaktifkan pembuatan poll Telegram sambil tetap mengaktifkan pengiriman biasa

  </Accordion>

  <Accordion title="Persetujuan exec di Telegram">
    Telegram mendukung persetujuan exec di DM approver dan secara opsional dapat memposting prompt persetujuan di chat atau topik asal.

    Jalur config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (opsional; fallback ke ID pemilik numerik yang diinferensikan dari `allowFrom` dan `defaultTo` direct message bila memungkinkan)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`

    Approver harus berupa ID pengguna Telegram numerik. Telegram otomatis mengaktifkan persetujuan exec native saat `enabled` tidak diatur atau `"auto"` dan setidaknya satu approver dapat di-resolve, baik dari `execApprovals.approvers` maupun dari config pemilik numerik akun (`allowFrom` dan `defaultTo` direct-message). Atur `enabled: false` untuk menonaktifkan Telegram sebagai klien persetujuan native secara eksplisit. Jika tidak, permintaan persetujuan akan fallback ke rute persetujuan lain yang dikonfigurasi atau ke kebijakan fallback persetujuan exec.

    Telegram juga merender tombol persetujuan bersama yang digunakan oleh channel chat lain. Adapter Telegram native terutama menambahkan routing DM approver, fanout channel/topik, dan petunjuk mengetik sebelum pengiriman.
    Saat tombol tersebut ada, itu adalah UX persetujuan utama; OpenClaw
    hanya boleh menyertakan perintah manual `/approve` saat hasil tool mengatakan
    persetujuan chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

    Aturan pengiriman:

    - `target: "dm"` mengirim prompt persetujuan hanya ke DM approver yang berhasil di-resolve
    - `target: "channel"` mengirim prompt kembali ke chat/topik Telegram asal
    - `target: "both"` mengirim ke DM approver dan chat/topik asal

    Hanya approver yang berhasil di-resolve yang dapat menyetujui atau menolak. Non-approver tidak dapat menggunakan `/approve` dan tidak dapat menggunakan tombol persetujuan Telegram.

    Perilaku resolusi persetujuan:

    - ID yang berawalan `plugin:` selalu di-resolve melalui persetujuan plugin.
    - ID persetujuan lain mencoba `exec.approval.resolve` terlebih dahulu.
    - Jika Telegram juga diotorisasi untuk persetujuan plugin dan gateway mengatakan
      persetujuan exec tidak dikenal/kedaluwarsa, Telegram mencoba ulang sekali melalui
      `plugin.approval.resolve`.
    - Penolakan/error persetujuan exec yang nyata tidak diam-diam fallback ke resolusi
      persetujuan plugin.

    Pengiriman channel menampilkan teks perintah di chat, jadi aktifkan `channel` atau `both` hanya di grup/topik tepercaya. Saat prompt mendarat di topik forum, OpenClaw mempertahankan topik tersebut baik untuk prompt persetujuan maupun tindak lanjut pasca-persetujuan. Persetujuan exec kedaluwarsa setelah 30 menit secara default.

    Tombol persetujuan inline juga bergantung pada `channels.telegram.capabilities.inlineButtons` yang mengizinkan permukaan target (`dm`, `group`, atau `all`).

    Dokumentasi terkait: [Persetujuan exec](/id/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Kontrol balasan error

Saat agent mengalami error pengiriman atau provider, Telegram dapat membalas dengan teks error atau menekannya. Dua kunci config mengontrol perilaku ini:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` mengirim pesan error yang ramah ke chat. `silent` menekan balasan error sepenuhnya. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Waktu minimum antar balasan error ke chat yang sama. Mencegah spam error saat outage.        |

Override per-akun, per-grup, dan per-topik didukung (pewarisan yang sama seperti kunci config Telegram lainnya).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // tekan error di grup ini
        },
      },
    },
  },
}
```

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Bot tidak merespons pesan grup tanpa mention">

    - Jika `requireMention=false`, mode privasi Telegram harus mengizinkan visibilitas penuh.
      - BotFather: `/setprivacy` -> Disable
      - lalu keluarkan + tambahkan kembali bot ke grup
    - `openclaw channels status` memberi peringatan saat config mengharapkan pesan grup tanpa mention.
    - `openclaw channels status --probe` dapat memeriksa group ID numerik eksplisit; wildcard `"*"` tidak dapat diperiksa keanggotaannya.
    - uji sesi cepat: `/activation always`.

  </Accordion>

  <Accordion title="Bot sama sekali tidak melihat pesan grup">

    - saat `channels.telegram.groups` ada, grup harus tercantum (atau menyertakan `"*"`)
    - verifikasi keanggotaan bot di grup
    - tinjau log: `openclaw logs --follow` untuk alasan pengabaian

  </Accordion>

  <Accordion title="Perintah bekerja sebagian atau tidak bekerja sama sekali">

    - otorisasi identitas pengirim Anda (pairing dan/atau `allowFrom` numerik)
    - otorisasi perintah tetap berlaku meskipun kebijakan grup adalah `open`
    - `setMyCommands failed` dengan `BOT_COMMANDS_TOO_MUCH` berarti menu native memiliki terlalu banyak entri; kurangi perintah plugin/Skills/kustom atau nonaktifkan menu native
    - `setMyCommands failed` dengan error jaringan/fetch biasanya menunjukkan masalah keterjangkauan DNS/HTTPS ke `api.telegram.org`

  </Accordion>

  <Accordion title="Polling atau ketidakstabilan jaringan">

    - Node 22+ + fetch/proxy kustom dapat memicu perilaku abort langsung jika tipe AbortSignal tidak cocok.
    - Beberapa host me-resolve `api.telegram.org` ke IPv6 terlebih dahulu; egress IPv6 yang rusak dapat menyebabkan kegagalan Telegram API yang intermiten.
    - Jika log menyertakan `TypeError: fetch failed` atau `Network request for 'getUpdates' failed!`, OpenClaw sekarang mencoba ulang ini sebagai error jaringan yang dapat dipulihkan.
    - Jika log menyertakan `Polling stall detected`, OpenClaw memulai ulang polling dan membangun ulang transport Telegram setelah 120 detik tanpa liveness long-poll yang selesai secara default.
    - Tingkatkan `channels.telegram.pollingStallThresholdMs` hanya saat panggilan `getUpdates` yang berjalan lama sehat tetapi host Anda masih melaporkan restart polling-stall false-positive. Stall persisten biasanya menunjuk ke masalah proxy, DNS, IPv6, atau TLS egress antara host dan `api.telegram.org`.
    - Pada host VPS dengan egress/TLS langsung yang tidak stabil, rutekan panggilan Telegram API melalui `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Default Node 22+ adalah `autoSelectFamily=true` (kecuali WSL2) dan `dnsResultOrder=ipv4first`.
    - Jika host Anda adalah WSL2 atau memang bekerja lebih baik dengan perilaku khusus IPv4, paksa pemilihan family:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Jawaban rentang benchmark RFC 2544 (`198.18.0.0/15`) sudah diizinkan
      untuk unduhan media Telegram secara default. Jika fake-IP tepercaya atau
      proxy transparan menulis ulang `api.telegram.org` ke alamat
      private/internal/special-use lain selama unduhan media, Anda dapat memilih
      bypass khusus Telegram ini:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Opt-in yang sama tersedia per akun di
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Jika proxy Anda me-resolve host media Telegram ke `198.18.x.x`, biarkan
      flag berbahaya tetap mati terlebih dahulu. Media Telegram sudah mengizinkan rentang
      benchmark RFC 2544 secara default.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` melemahkan perlindungan
      SSRF media Telegram. Gunakan ini hanya untuk lingkungan proxy tepercaya yang dikendalikan operator
      seperti routing fake-IP Clash, Mihomo, atau Surge saat mereka
      mensintesis jawaban private atau special-use di luar rentang benchmark RFC 2544.
      Biarkan tetap mati untuk akses Telegram internet publik normal.
    </Warning>

    - Override environment (sementara):
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

Bantuan lebih lanjut: [Pemecahan masalah channel](/id/channels/troubleshooting).

## Pointer referensi config Telegram

Referensi utama:

- `channels.telegram.enabled`: aktifkan/nonaktifkan startup channel.
- `channels.telegram.botToken`: token bot (BotFather).
- `channels.telegram.tokenFile`: baca token dari path file reguler. Symlink ditolak.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing).
- `channels.telegram.allowFrom`: allowlist DM (ID pengguna Telegram numerik). `allowlist` memerlukan setidaknya satu ID pengirim. `open` memerlukan `"*"`. `openclaw doctor --fix` dapat menyelesaikan entri `@username` lama menjadi ID dan dapat memulihkan entri allowlist dari file pairing-store dalam alur migrasi allowlist.
- `channels.telegram.actions.poll`: aktifkan atau nonaktifkan pembuatan poll Telegram (default: aktif; tetap memerlukan `sendMessage`).
- `channels.telegram.defaultTo`: target Telegram default yang digunakan oleh CLI `--deliver` saat tidak ada `--reply-to` eksplisit.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (default: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist pengirim grup (ID pengguna Telegram numerik). `openclaw doctor --fix` dapat menyelesaikan entri `@username` lama menjadi ID. Entri non-numerik diabaikan saat auth. Auth grup tidak menggunakan fallback pairing-store DM (`2026.2.25+`).
- Prioritas multi-akun:
  - Saat dua atau lebih account ID dikonfigurasi, atur `channels.telegram.defaultAccount` (atau sertakan `channels.telegram.accounts.default`) untuk membuat routing default eksplisit.
  - Jika keduanya tidak diatur, OpenClaw fallback ke account ID pertama yang dinormalisasi dan `openclaw doctor` akan memberi peringatan.
  - `channels.telegram.accounts.default.allowFrom` dan `channels.telegram.accounts.default.groupAllowFrom` hanya berlaku untuk akun `default`.
  - Akun bernama mewarisi `channels.telegram.allowFrom` dan `channels.telegram.groupAllowFrom` saat nilai level akun tidak diatur.
  - Akun bernama tidak mewarisi `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: default per-grup + allowlist (gunakan `"*"` untuk default global).
  - `channels.telegram.groups.<id>.groupPolicy`: override per-grup untuk groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: default gating mention.
  - `channels.telegram.groups.<id>.skills`: filter Skills (hilangkan = semua Skills, kosong = tidak ada).
  - `channels.telegram.groups.<id>.allowFrom`: override allowlist pengirim per-grup.
  - `channels.telegram.groups.<id>.systemPrompt`: system prompt tambahan untuk grup.
  - `channels.telegram.groups.<id>.enabled`: nonaktifkan grup saat `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: override per-topik (field grup + `agentId` khusus topik).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: rutekan topik ini ke agent tertentu (mengoverride routing level grup dan binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: override per-topik untuk groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: override gating mention per-topik.
- `bindings[]` level atas dengan `type: "acp"` dan ID topik kanonis `chatId:topic:topicId` di `match.peer.id`: field binding topik ACP persisten (lihat [ACP Agents](/id/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: rutekan topik DM ke agent tertentu (perilaku sama seperti topik forum).
- `channels.telegram.execApprovals.enabled`: aktifkan Telegram sebagai klien persetujuan exec berbasis chat untuk akun ini.
- `channels.telegram.execApprovals.approvers`: ID pengguna Telegram yang diizinkan menyetujui atau menolak permintaan exec. Opsional saat `channels.telegram.allowFrom` atau `channels.telegram.defaultTo` direct sudah mengidentifikasi pemilik.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (default: `dm`). `channel` dan `both` mempertahankan topik Telegram asal jika ada.
- `channels.telegram.execApprovals.agentFilter`: filter ID agent opsional untuk prompt persetujuan yang diteruskan.
- `channels.telegram.execApprovals.sessionFilter`: filter kunci sesi opsional (substring atau regex) untuk prompt persetujuan yang diteruskan.
- `channels.telegram.accounts.<account>.execApprovals`: override per-akun untuk routing persetujuan exec Telegram dan otorisasi approver.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (default: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: override per-akun.
- `channels.telegram.commands.nativeSkills`: aktifkan/nonaktifkan perintah Skills native Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (default: `off`).
- `channels.telegram.textChunkLimit`: ukuran chunk keluar (karakter).
- `channels.telegram.chunkMode`: `length` (default) atau `newline` untuk memisah pada baris kosong (batas paragraf) sebelum chunking berdasarkan panjang.
- `channels.telegram.linkPreview`: toggle pratinjau tautan untuk pesan keluar (default: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (pratinjau stream langsung; default: `partial`; `progress` dipetakan ke `partial`; `block` adalah kompatibilitas mode pratinjau lama). Streaming pratinjau Telegram menggunakan satu pesan pratinjau yang diedit di tempat.
- `channels.telegram.mediaMaxMb`: batas media Telegram masuk/keluar (MB, default: 100).
- `channels.telegram.retry`: kebijakan retry untuk helper pengiriman Telegram (CLI/tools/actions) pada error API keluar yang dapat dipulihkan (attempts, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: override Node autoSelectFamily (true=aktifkan, false=nonaktifkan). Default aktif pada Node 22+, dengan WSL2 default nonaktif.
- `channels.telegram.network.dnsResultOrder`: override urutan hasil DNS (`ipv4first` atau `verbatim`). Default `ipv4first` pada Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: opt-in berbahaya untuk lingkungan fake-IP atau proxy transparan tepercaya tempat unduhan media Telegram me-resolve `api.telegram.org` ke alamat private/internal/special-use di luar izin default rentang benchmark RFC 2544.
- `channels.telegram.proxy`: URL proxy untuk panggilan Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: aktifkan mode webhook (memerlukan `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: secret webhook (wajib saat webhookUrl diatur).
- `channels.telegram.webhookPath`: path webhook lokal (default `/telegram-webhook`).
- `channels.telegram.webhookHost`: host bind webhook lokal (default `127.0.0.1`).
- `channels.telegram.webhookPort`: port bind webhook lokal (default `8787`).
- `channels.telegram.actions.reactions`: gate reaksi tool Telegram.
- `channels.telegram.actions.sendMessage`: gate pengiriman pesan tool Telegram.
- `channels.telegram.actions.deleteMessage`: gate penghapusan pesan tool Telegram.
- `channels.telegram.actions.sticker`: gate aksi stiker Telegram — kirim dan cari (default: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — kontrol reaksi mana yang memicu event sistem (default: `own` jika tidak diatur).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — kontrol kemampuan reaksi agent (default: `minimal` jika tidak diatur).
- `channels.telegram.errorPolicy`: `reply | silent` — kontrol perilaku balasan error (default: `reply`). Override per-akun/grup/topik didukung.
- `channels.telegram.errorCooldownMs`: minimum ms antar balasan error ke chat yang sama (default: `60000`). Mencegah spam error saat outage.

- [Referensi konfigurasi - Telegram](/id/gateway/configuration-reference#telegram)

Field Telegram khusus dengan sinyal tinggi:

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` harus menunjuk ke file reguler; symlink ditolak)
- kontrol akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` level atas (`type: "acp"`)
- persetujuan exec: `execApprovals`, `accounts.*.execApprovals`
- perintah/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/balasan: `replyToMode`
- streaming: `streaming` (pratinjau), `blockStreaming`
- pemformatan/pengiriman: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/jaringan: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- aksi/kapabilitas: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaksi: `reactionNotifications`, `reactionLevel`
- error: `errorPolicy`, `errorCooldownMs`
- penulisan/riwayat: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Terkait

- [Pairing](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Keamanan](/id/gateway/security)
- [Routing channel](/id/channels/channel-routing)
- [Routing multi-agent](/id/concepts/multi-agent)
- [Pemecahan masalah](/id/channels/troubleshooting)
