---
read_when:
    - Anda memerlukan semantik konfigurasi tingkat field atau nilai default yang tepat
    - Anda sedang memvalidasi blok konfigurasi channel, model, gateway, atau tool
summary: Referensi konfigurasi Gateway untuk kunci inti OpenClaw, nilai default, dan tautan ke referensi subsistem khusus
title: Referensi Konfigurasi
x-i18n:
    generated_at: "2026-04-09T01:32:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9d6d0c542b9874809491978fdcf8e1a7bb35a4873db56aa797963d03af4453c
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Referensi Konfigurasi

Referensi konfigurasi inti untuk `~/.openclaw/openclaw.json`. Untuk ringkasan berbasis tugas, lihat [Configuration](/id/gateway/configuration).

Halaman ini mencakup permukaan konfigurasi utama OpenClaw dan menautkan ke referensi lain ketika suatu subsistem memiliki referensi lebih mendalam sendiri. Halaman ini **tidak** berupaya menyisipkan setiap katalog perintah milik channel/plugin atau setiap knob memori/QMD mendalam dalam satu halaman.

Sumber kebenaran kode:

- `openclaw config schema` mencetak JSON Schema live yang digunakan untuk validasi dan UI Kontrol, dengan metadata bundled/plugin/channel digabungkan saat tersedia
- `config.schema.lookup` mengembalikan satu node schema yang dibatasi path untuk tool penelusuran detail
- `pnpm config:docs:check` / `pnpm config:docs:gen` memvalidasi hash baseline dokumen konfigurasi terhadap permukaan schema saat ini

Referensi mendalam khusus:

- [Referensi konfigurasi memori](/id/reference/memory-config) untuk `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, dan konfigurasi dreaming di bawah `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/id/tools/slash-commands) untuk katalog perintah built-in + bundled saat ini
- halaman channel/plugin pemilik untuk permukaan perintah spesifik channel

Format konfigurasi adalah **JSON5** (komentar + trailing comma diperbolehkan). Semua field bersifat opsional — OpenClaw menggunakan default aman saat dihilangkan.

---

## Channel

Setiap channel dimulai secara otomatis saat bagian konfigurasinya ada (kecuali `enabled: false`).

### Akses DM dan grup

Semua channel mendukung kebijakan DM dan kebijakan grup:

| Kebijakan DM        | Perilaku                                                      |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (default) | Pengirim tidak dikenal mendapat kode pairing sekali pakai; pemilik harus menyetujui |
| `allowlist`         | Hanya pengirim di `allowFrom` (atau paired allow store)       |
| `open`              | Izinkan semua DM masuk (memerlukan `allowFrom: ["*"]`)        |
| `disabled`          | Abaikan semua DM masuk                                        |

| Kebijakan grup        | Perilaku                                             |
| --------------------- | ---------------------------------------------------- |
| `allowlist` (default) | Hanya grup yang cocok dengan allowlist terkonfigurasi |
| `open`                | Lewati allowlist grup (mention-gating tetap berlaku) |
| `disabled`            | Blokir semua pesan grup/room                         |

<Note>
`channels.defaults.groupPolicy` menetapkan default saat `groupPolicy` suatu provider tidak disetel.
Kode pairing kedaluwarsa setelah 1 jam. Permintaan pairing DM yang tertunda dibatasi hingga **3 per channel**.
Jika blok provider tidak ada sama sekali (`channels.<provider>` tidak ada), kebijakan grup runtime fallback ke `allowlist` (fail-closed) dengan peringatan saat startup.
</Note>

### Override model channel

Gunakan `channels.modelByChannel` untuk menetapkan ID channel tertentu ke model tertentu. Nilai menerima `provider/model` atau alias model yang dikonfigurasi. Pemetaan channel diterapkan saat sesi belum memiliki override model (misalnya, disetel melalui `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Default channel dan heartbeat

Gunakan `channels.defaults` untuk perilaku group-policy dan heartbeat bersama di seluruh provider:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: kebijakan grup fallback saat `groupPolicy` tingkat provider tidak disetel.
- `channels.defaults.contextVisibility`: mode visibilitas konteks tambahan default untuk semua channel. Nilai: `all` (default, sertakan semua konteks kutipan/thread/riwayat), `allowlist` (hanya sertakan konteks dari pengirim dalam allowlist), `allowlist_quote` (sama seperti allowlist tetapi mempertahankan konteks kutipan/balasan eksplisit). Override per-channel: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sertakan status channel yang sehat dalam output heartbeat.
- `channels.defaults.heartbeat.showAlerts`: sertakan status degraded/error dalam output heartbeat.
- `channels.defaults.heartbeat.useIndicator`: render output heartbeat bergaya indikator yang ringkas.

### WhatsApp

WhatsApp berjalan melalui channel web gateway (Baileys Web). Channel ini dimulai secara otomatis saat sesi tertaut ada.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // centang biru (false dalam mode self-chat)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp multi-akun">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Perintah outbound default ke akun `default` jika ada; jika tidak, ke id akun terkonfigurasi pertama (diurutkan).
- `channels.whatsapp.defaultAccount` opsional menggantikan fallback pemilihan akun default itu bila cocok dengan id akun yang dikonfigurasi.
- Direktori auth Baileys single-account lama dimigrasikan oleh `openclaw doctor` ke `whatsapp/default`.
- Override per-akun: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Token bot: `channels.telegram.botToken` atau `channels.telegram.tokenFile` (hanya file biasa; symlink ditolak), dengan `TELEGRAM_BOT_TOKEN` sebagai fallback untuk akun default.
- `channels.telegram.defaultAccount` opsional menggantikan pemilihan akun default bila cocok dengan id akun yang dikonfigurasi.
- Dalam setup multi-akun (2+ id akun), set default eksplisit (`channels.telegram.defaultAccount` atau `channels.telegram.accounts.default`) untuk menghindari routing fallback; `openclaw doctor` memberi peringatan bila ini hilang atau tidak valid.
- `configWrites: false` memblokir penulisan konfigurasi yang dipicu Telegram (migrasi ID supergroup, `/config set|unset`).
- Entri `bindings[]` level atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk topik forum (gunakan `chatId:topic:topicId` kanonis di `match.peer.id`). Semantik field dibagikan di [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- Pratinjau stream Telegram menggunakan `sendMessage` + `editMessageText` (berfungsi di chat langsung dan grup).
- Kebijakan retry: lihat [Retry policy](/id/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, dengan `DISCORD_BOT_TOKEN` sebagai fallback untuk akun default.
- Panggilan outbound langsung yang menyediakan `token` Discord eksplisit menggunakan token itu untuk panggilan; pengaturan retry/kebijakan akun tetap berasal dari akun terpilih dalam snapshot runtime aktif.
- `channels.discord.defaultAccount` opsional menggantikan pemilihan akun default bila cocok dengan id akun yang dikonfigurasi.
- Gunakan `user:<id>` (DM) atau `channel:<id>` (channel guild) untuk target pengiriman; ID numerik polos ditolak.
- Slug guild huruf kecil dengan spasi diganti `-`; kunci channel menggunakan nama yang sudah di-slug (tanpa `#`). Sebaiknya gunakan ID guild.
- Pesan yang ditulis bot diabaikan secara default. `allowBots: true` mengaktifkannya; gunakan `allowBots: "mentions"` untuk hanya menerima pesan bot yang menyebut bot (pesan sendiri tetap difilter).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (dan override channel) membuang pesan yang menyebut pengguna atau peran lain tetapi tidak menyebut bot (tidak termasuk @everyone/@here).
- `maxLinesPerMessage` (default 17) membagi pesan tinggi bahkan saat di bawah 2000 karakter.
- `channels.discord.threadBindings` mengontrol routing yang terikat thread Discord:
  - `enabled`: override Discord untuk fitur sesi terikat thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan pengiriman/routing terikat)
  - `idleHours`: override Discord untuk auto-unfocus karena inaktivitas dalam jam (`0` menonaktifkan)
  - `maxAgeHours`: override Discord untuk usia maksimum keras dalam jam (`0` menonaktifkan)
  - `spawnSubagentSessions`: sakelar opt-in untuk pembuatan/pengikatan thread otomatis `sessions_spawn({ thread: true })`
- Entri `bindings[]` level atas dengan `type: "acp"` mengonfigurasi binding ACP persisten untuk channel dan thread (gunakan id channel/thread di `match.peer.id`). Semantik field dibagikan di [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` menetapkan warna aksen untuk kontainer komponen Discord v2.
- `channels.discord.voice` mengaktifkan percakapan channel suara Discord dan override auto-join + TTS opsional.
- `channels.discord.voice.daveEncryption` dan `channels.discord.voice.decryptionFailureTolerance` diteruskan ke opsi DAVE `@discordjs/voice` (`true` dan `24` secara default).
- OpenClaw juga mencoba pemulihan penerimaan suara dengan keluar/bergabung ulang ke sesi suara setelah kegagalan dekripsi berulang.
- `channels.discord.streaming` adalah kunci mode stream kanonis. Nilai lama `streamMode` dan boolean `streaming` dimigrasikan otomatis.
- `channels.discord.autoPresence` memetakan ketersediaan runtime ke presence bot (healthy => online, degraded => idle, exhausted => dnd) dan memungkinkan override teks status opsional.
- `channels.discord.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan nama/tag yang dapat berubah (mode kompatibilitas break-glass).
- `channels.discord.execApprovals`: pengiriman persetujuan exec native Discord dan otorisasi penyetuju.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif saat penyetuju dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Discord yang diizinkan menyetujui permintaan exec. Fallback ke `commands.ownerAllowFrom` bila dihilangkan.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan untuk semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default) mengirim ke DM penyetuju, `"channel"` mengirim ke channel asal, `"both"` mengirim ke keduanya. Saat target mencakup `"channel"`, tombol hanya dapat digunakan oleh penyetuju yang berhasil di-resolve.
  - `cleanupAfterResolve`: saat `true`, menghapus DM persetujuan setelah disetujui, ditolak, atau timeout.

**Mode notifikasi reaksi:** `off` (tidak ada), `own` (pesan bot, default), `all` (semua pesan), `allowlist` (dari `guilds.<id>.users` pada semua pesan).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- JSON service account: inline (`serviceAccount`) atau berbasis file (`serviceAccountFile`).
- SecretRef service account juga didukung (`serviceAccountRef`).
- Fallback env: `GOOGLE_CHAT_SERVICE_ACCOUNT` atau `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Gunakan `spaces/<spaceId>` atau `users/<userId>` untuk target pengiriman.
- `channels.googlechat.dangerouslyAllowNameMatching` mengaktifkan kembali pencocokan email principal yang dapat berubah (mode kompatibilitas break-glass).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket mode** memerlukan `botToken` dan `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` untuk fallback env akun default).
- **HTTP mode** memerlukan `botToken` plus `signingSecret` (di root atau per-akun).
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string
  plaintext atau objek SecretRef.
- Snapshot akun Slack menampilkan field sumber/status per-kredensial seperti
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, dan, dalam mode HTTP,
  `signingSecretStatus`. `configured_unavailable` berarti akun
  dikonfigurasi melalui SecretRef tetapi path perintah/runtime saat ini tidak dapat
  me-resolve nilai secret.
- `configWrites: false` memblokir penulisan konfigurasi yang dipicu Slack.
- `channels.slack.defaultAccount` opsional menggantikan pemilihan akun default bila cocok dengan id akun yang dikonfigurasi.
- `channels.slack.streaming.mode` adalah kunci mode stream Slack kanonis. `channels.slack.streaming.nativeTransport` mengontrol transport streaming native Slack. Nilai lama `streamMode`, boolean `streaming`, dan `nativeStreaming` dimigrasikan otomatis.
- Gunakan `user:<id>` (DM) atau `channel:<id>` untuk target pengiriman.

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

**Isolasi sesi thread:** `thread.historyScope` bersifat per-thread (default) atau dibagikan di seluruh channel. `thread.inheritParent` menyalin transkrip channel induk ke thread baru.

- Streaming native Slack plus status thread gaya asisten Slack "is typing..." memerlukan target thread balasan. DM tingkat atas secara default tetap di luar thread, sehingga mereka menggunakan `typingReaction` atau pengiriman normal alih-alih pratinjau gaya thread.
- `typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat balasan sedang berjalan, lalu menghapusnya saat selesai. Gunakan shortcode emoji Slack seperti `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: pengiriman persetujuan exec native Slack dan otorisasi penyetuju. Schema sama seperti Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID pengguna Slack), `agentFilter`, `sessionFilter`, dan `target` (`"dm"`, `"channel"`, atau `"both"`).

| Grup aksi    | Default | Catatan                |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | React + daftar reaksi  |
| messages     | enabled | Baca/kirim/edit/hapus  |
| pins         | enabled | Sematkan/lepas/list    |
| memberInfo   | enabled | Info anggota           |
| emojiList    | enabled | Daftar emoji kustom    |

### Mattermost

Mattermost dikirim sebagai plugin: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Mode chat: `oncall` (merespons pada @-mention, default), `onmessage` (setiap pesan), `onchar` (pesan yang diawali prefiks pemicu).

Saat perintah native Mattermost diaktifkan:

- `commands.callbackPath` harus berupa path (misalnya `/api/channels/mattermost/command`), bukan URL penuh.
- `commands.callbackUrl` harus me-resolve ke endpoint Gateway OpenClaw dan dapat dijangkau dari server Mattermost.
- Callback slash native diautentikasi dengan token per-perintah yang dikembalikan
  Mattermost saat pendaftaran slash command. Jika pendaftaran gagal atau tidak ada
  perintah yang diaktifkan, OpenClaw menolak callback dengan
  `Unauthorized: invalid command token.`
- Untuk host callback private/tailnet/internal, Mattermost mungkin memerlukan
  `ServiceSettings.AllowedUntrustedInternalConnections` agar mencakup host/domain callback.
  Gunakan nilai host/domain, bukan URL penuh.
- `channels.mattermost.configWrites`: izinkan atau tolak penulisan konfigurasi yang dipicu Mattermost.
- `channels.mattermost.requireMention`: mewajibkan `@mention` sebelum membalas di channel.
- `channels.mattermost.groups.<channelId>.requireMention`: override mention-gating per-channel (`"*"` untuk default).
- `channels.mattermost.defaultAccount` opsional menggantikan pemilihan akun default bila cocok dengan id akun yang dikonfigurasi.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Mode notifikasi reaksi:** `off`, `own` (default), `all`, `allowlist` (dari `reactionAllowlist`).

- `channels.signal.account`: sematkan startup channel ke identitas akun Signal tertentu.
- `channels.signal.configWrites`: izinkan atau tolak penulisan konfigurasi yang dipicu Signal.
- `channels.signal.defaultAccount` opsional menggantikan pemilihan akun default bila cocok dengan id akun yang dikonfigurasi.

### BlueBubbles

BlueBubbles adalah jalur iMessage yang direkomendasikan (didukung plugin, dikonfigurasi di bawah `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Path kunci inti yang dibahas di sini: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- `channels.bluebubbles.defaultAccount` opsional menggantikan pemilihan akun default bila cocok dengan id akun yang dikonfigurasi.
- Entri `bindings[]` level atas dengan `type: "acp"` dapat mengikat percakapan BlueBubbles ke sesi ACP persisten. Gunakan string handle atau target BlueBubbles (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik field bersama: [ACP Agents](/id/tools/acp-agents#channel-specific-settings).
- Konfigurasi channel BlueBubbles lengkap didokumentasikan di [BlueBubbles](/id/channels/bluebubbles).

### iMessage

OpenClaw menjalankan `imsg rpc` (JSON-RPC melalui stdio). Tidak memerlukan daemon atau port.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- `channels.imessage.defaultAccount` opsional menggantikan pemilihan akun default bila cocok dengan id akun yang dikonfigurasi.

- Memerlukan Full Disk Access ke DB Messages.
- Sebaiknya gunakan target `chat_id:<id>`. Gunakan `imsg chats --limit 20` untuk mencantumkan chat.
- `cliPath` dapat menunjuk ke pembungkus SSH; set `remoteHost` (`host` atau `user@host`) untuk pengambilan lampiran via SCP.
- `attachmentRoots` dan `remoteAttachmentRoots` membatasi path lampiran masuk (default: `/Users/*/Library/Messages/Attachments`).
- SCP menggunakan pemeriksaan host-key ketat, jadi pastikan host key relay sudah ada di `~/.ssh/known_hosts`.
- `channels.imessage.configWrites`: izinkan atau tolak penulisan konfigurasi yang dipicu iMessage.
- Entri `bindings[]` level atas dengan `type: "acp"` dapat mengikat percakapan iMessage ke sesi ACP persisten. Gunakan handle yang dinormalisasi atau target chat eksplisit (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) di `match.peer.id`. Semantik field bersama: [ACP Agents](/id/tools/acp-agents#channel-specific-settings).

<Accordion title="Contoh pembungkus SSH iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix didukung extension dan dikonfigurasi di bawah `channels.matrix`.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Auth token menggunakan `accessToken`; auth password menggunakan `userId` + `password`.
- `channels.matrix.proxy` merutekan trafik HTTP Matrix melalui proxy HTTP(S) eksplisit. Akun bernama dapat meng-override dengan `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` mengizinkan homeserver private/internal. `proxy` dan opt-in jaringan ini adalah kontrol independen.
- `channels.matrix.defaultAccount` memilih akun yang disukai dalam setup multi-akun.
- `channels.matrix.autoJoin` default ke `off`, jadi room undangan dan undangan bergaya DM baru diabaikan sampai Anda menyetel `autoJoin: "allowlist"` dengan `autoJoinAllowlist` atau `autoJoin: "always"`.
- `channels.matrix.execApprovals`: pengiriman persetujuan exec native Matrix dan otorisasi penyetuju.
  - `enabled`: `true`, `false`, atau `"auto"` (default). Dalam mode auto, persetujuan exec aktif saat penyetuju dapat di-resolve dari `approvers` atau `commands.ownerAllowFrom`.
  - `approvers`: ID pengguna Matrix (mis. `@owner:example.org`) yang diizinkan menyetujui permintaan exec.
  - `agentFilter`: allowlist ID agen opsional. Hilangkan untuk meneruskan persetujuan untuk semua agen.
  - `sessionFilter`: pola kunci sesi opsional (substring atau regex).
  - `target`: tempat mengirim prompt persetujuan. `"dm"` (default), `"channel"` (room asal), atau `"both"`.
  - Override per-akun: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` mengontrol bagaimana DM Matrix dikelompokkan ke dalam sesi: `per-user` (default) berbagi berdasarkan peer yang dirutekan, sedangkan `per-room` mengisolasi tiap room DM.
- Probe status Matrix dan pencarian direktori live menggunakan kebijakan proxy yang sama seperti trafik runtime.
- Konfigurasi Matrix lengkap, aturan penargetan, dan contoh setup didokumentasikan di [Matrix](/id/channels/matrix).

### Microsoft Teams

Microsoft Teams didukung extension dan dikonfigurasi di bawah `channels.msteams`.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Path kunci inti yang dibahas di sini: `channels.msteams`, `channels.msteams.configWrites`.
- Konfigurasi Teams lengkap (kredensial, webhook, kebijakan DM/grup, override per-team/per-channel) didokumentasikan di [Microsoft Teams](/id/channels/msteams).

### IRC

IRC didukung extension dan dikonfigurasi di bawah `channels.irc`.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Path kunci inti yang dibahas di sini: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` opsional menggantikan pemilihan akun default bila cocok dengan id akun yang dikonfigurasi.
- Konfigurasi channel IRC lengkap (host/port/TLS/channel/allowlist/mention gating) didokumentasikan di [IRC](/id/channels/irc).

### Multi-akun (semua channel)

Jalankan beberapa akun per channel (masing-masing dengan `accountId` sendiri):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` digunakan saat `accountId` dihilangkan (CLI + routing).
- Token env hanya berlaku untuk akun **default**.
- Pengaturan channel dasar berlaku untuk semua akun kecuali di-override per akun.
- Gunakan `bindings[].match.accountId` untuk merutekan setiap akun ke agen berbeda.
- Jika Anda menambahkan akun non-default melalui `openclaw channels add` (atau onboarding channel) saat masih menggunakan konfigurasi channel top-level single-account, OpenClaw terlebih dahulu mempromosikan nilai single-account top-level yang bersifat account-scoped ke peta akun channel agar akun asli tetap berfungsi. Sebagian besar channel memindahkannya ke `channels.<channel>.accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada.
- Binding channel-only yang ada (tanpa `accountId`) tetap cocok dengan akun default; binding account-scoped tetap opsional.
- `openclaw doctor --fix` juga memperbaiki shape campuran dengan memindahkan nilai single-account top-level yang bersifat account-scoped ke akun yang dipromosikan yang dipilih untuk channel tersebut. Sebagian besar channel menggunakan `accounts.default`; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada.

### Channel extension lain

Banyak channel extension dikonfigurasi sebagai `channels.<id>` dan didokumentasikan di halaman channel khusus mereka (misalnya Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, dan Twitch).
Lihat indeks channel lengkap: [Channels](/id/channels).

### Mention gating chat grup

Pesan grup default ke **require mention** (metadata mention atau pola regex aman). Berlaku untuk chat grup WhatsApp, Telegram, Discord, Google Chat, dan iMessage.

**Jenis mention:**

- **Metadata mentions**: @-mention native platform. Diabaikan dalam mode self-chat WhatsApp.
- **Text patterns**: pola regex aman di `agents.list[].groupChat.mentionPatterns`. Pola tidak valid dan nested repetition yang tidak aman diabaikan.
- Mention gating hanya diterapkan saat deteksi memungkinkan (mention native atau setidaknya satu pola).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` menetapkan default global. Channel dapat meng-override dengan `channels.<channel>.historyLimit` (atau per-akun). Set `0` untuk menonaktifkan.

#### Batas riwayat DM

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Resolusi: override per-DM → default provider → tanpa batas (semua dipertahankan).

Didukung: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Mode self-chat

Sertakan nomor Anda sendiri di `allowFrom` untuk mengaktifkan mode self-chat (mengabaikan @-mention native, hanya merespons pola teks):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Commands (penanganan perintah chat)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Detail perintah">

- Blok ini mengonfigurasi permukaan perintah. Untuk katalog perintah built-in + bundled saat ini, lihat [Slash Commands](/id/tools/slash-commands).
- Halaman ini adalah **referensi kunci konfigurasi**, bukan katalog perintah lengkap. Perintah milik channel/plugin seperti QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone`, dan Talk `/voice` didokumentasikan di halaman channel/plugin masing-masing plus [Slash Commands](/id/tools/slash-commands).
- Perintah teks harus berupa pesan **mandiri** dengan awalan `/`.
- `native: "auto"` menyalakan perintah native untuk Discord/Telegram, membiarkan Slack nonaktif.
- `nativeSkills: "auto"` menyalakan perintah skill native untuk Discord/Telegram, membiarkan Slack nonaktif.
- Override per channel: `channels.discord.commands.native` (bool atau `"auto"`). `false` menghapus perintah yang sebelumnya terdaftar.
- Override pendaftaran skill native per channel dengan `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` menambahkan entri menu bot Telegram ekstra.
- `bash: true` mengaktifkan `! <cmd>` untuk shell host. Memerlukan `tools.elevated.enabled` dan pengirim ada di `tools.elevated.allowFrom.<channel>`.
- `config: true` mengaktifkan `/config` (membaca/menulis `openclaw.json`). Untuk klien `chat.send` gateway, penulisan persisten `/config set|unset` juga memerlukan `operator.admin`; `/config show` hanya-baca tetap tersedia untuk klien operator write-scoped normal.
- `mcp: true` mengaktifkan `/mcp` untuk konfigurasi server MCP yang dikelola OpenClaw di bawah `mcp.servers`.
- `plugins: true` mengaktifkan `/plugins` untuk discovery, install, dan kontrol enable/disable plugin.
- `channels.<provider>.configWrites` mengontrol mutasi konfigurasi per channel (default: true).
- Untuk channel multi-akun, `channels.<provider>.accounts.<id>.configWrites` juga mengontrol penulisan yang menargetkan akun itu (misalnya `/allowlist --config --account <id>` atau `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` menonaktifkan `/restart` dan aksi tool restart gateway. Default: `true`.
- `ownerAllowFrom` adalah allowlist pemilik eksplisit untuk perintah/tool khusus pemilik. Ini terpisah dari `allowFrom`.
- `ownerDisplay: "hash"` meng-hash ID pemilik dalam system prompt. Set `ownerDisplaySecret` untuk mengontrol hashing.
- `allowFrom` bersifat per-provider. Saat disetel, inilah **satu-satunya** sumber otorisasi (allowlist/pairing channel dan `useAccessGroups` diabaikan).
- `useAccessGroups: false` mengizinkan perintah melewati kebijakan access-group saat `allowFrom` tidak disetel.
- Peta dokumentasi perintah:
  - katalog built-in + bundled: [Slash Commands](/id/tools/slash-commands)
  - permukaan perintah spesifik channel: [Channels](/id/channels)
  - perintah QQ Bot: [QQ Bot](/id/channels/qqbot)
  - perintah pairing: [Pairing](/id/channels/pairing)
  - perintah card LINE: [LINE](/id/channels/line)
  - memory dreaming: [Dreaming](/id/concepts/dreaming)

</Accordion>

---

## Default agen

### `agents.defaults.workspace`

Default: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root repositori opsional yang ditampilkan di baris Runtime system prompt. Jika tidak disetel, OpenClaw mendeteksi otomatis dengan berjalan ke atas dari workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist Skills default opsional untuk agen yang tidak menyetel
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Hilangkan `agents.defaults.skills` agar Skills tidak dibatasi secara default.
- Hilangkan `agents.list[].skills` untuk mewarisi default.
- Set `agents.list[].skills: []` untuk tanpa Skills.
- Daftar `agents.list[].skills` yang tidak kosong adalah set akhir untuk agen itu; tidak digabung dengan default.

### `agents.defaults.skipBootstrap`

Menonaktifkan pembuatan otomatis file bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Mengontrol kapan file bootstrap workspace disisipkan ke system prompt. Default: `"always"`.

- `"continuation-skip"`: giliran lanjutan yang aman (setelah respons asisten selesai) melewati penyisipan ulang bootstrap workspace, sehingga mengurangi ukuran prompt. Proses heartbeat dan retry pasca-compaction tetap membangun ulang konteks.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Jumlah karakter maksimum per file bootstrap workspace sebelum dipotong. Default: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Jumlah total karakter maksimum yang disisipkan di semua file bootstrap workspace. Default: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Mengontrol teks peringatan yang terlihat oleh agen saat konteks bootstrap dipotong.
Default: `"once"`.

- `"off"`: jangan pernah menyisipkan teks peringatan ke system prompt.
- `"once"`: sisipkan peringatan sekali per signature truncation unik (direkomendasikan).
- `"always"`: sisipkan peringatan pada setiap run saat truncation ada.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Ukuran piksel maksimum untuk sisi gambar terpanjang dalam blok gambar transcript/tool sebelum panggilan provider.
Default: `1200`.

Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload permintaan untuk run yang banyak tangkapan layar.
Nilai yang lebih tinggi mempertahankan lebih banyak detail visual.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Timezone untuk konteks system prompt (bukan timestamp pesan). Fallback ke timezone host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format waktu dalam system prompt. Default: `auto` (preferensi OS).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Bentuk string hanya menyetel model utama.
  - Bentuk objek menyetel model utama plus model failover berurutan.
- `imageModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh path tool `image` sebagai konfigurasi vision-model.
  - Juga digunakan sebagai routing fallback ketika model yang dipilih/default tidak dapat menerima input gambar.
- `imageGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas generasi gambar bersama dan setiap permukaan tool/plugin masa depan yang menghasilkan gambar.
  - Nilai umum: `google/gemini-3.1-flash-image-preview` untuk generasi gambar Gemini native, `fal/fal-ai/flux/dev` untuk fal, atau `openai/gpt-image-1` untuk OpenAI Images.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan auth/API key provider yang sesuai juga (misalnya `GEMINI_API_KEY` atau `GOOGLE_API_KEY` untuk `google/*`, `OPENAI_API_KEY` untuk `openai/*`, `FAL_KEY` untuk `fal/*`).
  - Jika dihilangkan, `image_generate` tetap dapat menginfer provider default yang didukung auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider generasi gambar terdaftar lainnya dalam urutan provider-id.
- `musicGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas generasi musik bersama dan tool built-in `music_generate`.
  - Nilai umum: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, atau `minimax/music-2.5+`.
  - Jika dihilangkan, `music_generate` tetap dapat menginfer provider default yang didukung auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider generasi musik terdaftar lainnya dalam urutan provider-id.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan auth/API key provider yang sesuai juga.
- `videoGenerationModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh kapabilitas generasi video bersama dan tool built-in `video_generate`.
  - Nilai umum: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, atau `qwen/wan2.7-r2v`.
  - Jika dihilangkan, `video_generate` tetap dapat menginfer provider default yang didukung auth. Tool ini mencoba provider default saat ini terlebih dahulu, lalu provider generasi video terdaftar lainnya dalam urutan provider-id.
  - Jika Anda memilih provider/model secara langsung, konfigurasikan auth/API key provider yang sesuai juga.
  - Provider generasi video Qwen bundled mendukung hingga 1 video output, 1 gambar input, 4 video input, durasi 10 detik, dan opsi tingkat provider `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`.
- `pdfModel`: menerima string (`"provider/model"`) atau objek (`{ primary, fallbacks }`).
  - Digunakan oleh tool `pdf` untuk routing model.
  - Jika dihilangkan, tool PDF fallback ke `imageModel`, lalu ke model sesi/default yang ter-resolve.
- `pdfMaxBytesMb`: batas ukuran PDF default untuk tool `pdf` saat `maxBytesMb` tidak diberikan pada waktu panggilan.
- `pdfMaxPages`: jumlah halaman maksimum default yang dipertimbangkan oleh mode fallback ekstraksi dalam tool `pdf`.
- `verboseDefault`: tingkat verbose default untuk agen. Nilai: `"off"`, `"on"`, `"full"`. Default: `"off"`.
- `elevatedDefault`: tingkat output elevated default untuk agen. Nilai: `"off"`, `"on"`, `"ask"`, `"full"`. Default: `"on"`.
- `model.primary`: format `provider/model` (mis. `openai/gpt-5.4`). Jika Anda menghilangkan provider, OpenClaw mencoba alias terlebih dahulu, lalu pencocokan configured-provider unik untuk model id yang tepat, dan baru kemudian fallback ke default provider yang dikonfigurasi (perilaku kompatibilitas lama yang deprecated, jadi sebaiknya gunakan `provider/model` eksplisit). Jika provider itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw fallback ke provider/model pertama yang dikonfigurasi alih-alih menampilkan default provider lama yang sudah dihapus.
- `models`: katalog model terkonfigurasi dan allowlist untuk `/model`. Tiap entri dapat mencakup `alias` (shortcut) dan `params` (spesifik provider, misalnya `temperature`, `maxTokens`, `cacheRetention`, `context1m`).
- `params`: parameter provider default global yang diterapkan ke semua model. Set di `agents.defaults.params` (mis. `{ cacheRetention: "long" }`).
- Precedensi penggabungan `params` (konfigurasi): `agents.defaults.params` (basis global) dioverride oleh `agents.defaults.models["provider/model"].params` (per-model), lalu `agents.list[].params` (id agen yang cocok) override berdasarkan kunci. Lihat [Prompt Caching](/id/reference/prompt-caching) untuk detail.
- Penulis konfigurasi yang memutasi field ini (misalnya `/models set`, `/models set-image`, dan perintah tambah/hapus fallback) menyimpan bentuk objek kanonis dan mempertahankan daftar fallback yang ada bila memungkinkan.
- `maxConcurrent`: jumlah maksimum run agen paralel di seluruh sesi (setiap sesi tetap diserialisasi). Default: 4.

**Shorthand alias built-in** (hanya berlaku saat model ada di `agents.defaults.models`):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Alias yang Anda konfigurasikan selalu menang atas default.

Model Z.AI GLM-4.x otomatis mengaktifkan mode thinking kecuali Anda menyetel `--thinking off` atau mendefinisikan `agents.defaults.models["zai/<model>"].params.thinking` sendiri.
Model Z.AI mengaktifkan `tool_stream` secara default untuk streaming panggilan tool. Set `agents.defaults.models["zai/<model>"].params.tool_stream` ke `false` untuk menonaktifkannya.
Model Anthropic Claude 4.6 default ke thinking `adaptive` ketika tidak ada tingkat thinking eksplisit yang disetel.

### `agents.defaults.cliBackends`

Backend CLI opsional untuk run fallback teks saja (tanpa panggilan tool). Berguna sebagai cadangan ketika provider API gagal.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backend CLI berfokus pada teks; tool selalu dinonaktifkan.
- Sesi didukung ketika `sessionArg` disetel.
- Pass-through gambar didukung saat `imageArg` menerima path file.

### `agents.defaults.systemPromptOverride`

Ganti seluruh system prompt rakitan OpenClaw dengan string tetap. Set di level default (`agents.defaults.systemPromptOverride`) atau per agen (`agents.list[].systemPromptOverride`). Nilai per-agen mendapat prioritas; nilai kosong atau hanya whitespace diabaikan. Berguna untuk eksperimen prompt terkontrol.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

Run heartbeat berkala.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: string durasi (ms/s/m/h). Default: `30m` (auth API-key) atau `1h` (auth OAuth). Set ke `0m` untuk menonaktifkan.
- `includeSystemPromptSection`: saat false, menghilangkan bagian Heartbeat dari system prompt dan melewati penyisipan `HEARTBEAT.md` ke konteks bootstrap. Default: `true`.
- `suppressToolErrorWarnings`: saat true, menekan payload peringatan error tool selama run heartbeat.
- `directPolicy`: kebijakan pengiriman langsung/DM. `allow` (default) mengizinkan pengiriman target langsung. `block` menekan pengiriman target langsung dan menghasilkan `reason=dm-blocked`.
- `lightContext`: saat true, run heartbeat menggunakan konteks bootstrap ringan dan hanya mempertahankan `HEARTBEAT.md` dari file bootstrap workspace.
- `isolatedSession`: saat true, setiap run heartbeat berjalan dalam sesi baru tanpa riwayat percakapan sebelumnya. Pola isolasi sama seperti cron `sessionTarget: "isolated"`. Mengurangi biaya token per-heartbeat dari ~100K menjadi ~2-5K token.
- Per-agen: set `agents.list[].heartbeat`. Saat agen mana pun mendefinisikan `heartbeat`, **hanya agen tersebut** yang menjalankan heartbeat.
- Heartbeat menjalankan giliran agen penuh — interval yang lebih pendek membakar lebih banyak token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send a brief notice when compaction starts (default: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` atau `safeguard` (ringkasan terpotong per-bagian untuk riwayat panjang). Lihat [Compaction](/id/concepts/compaction).
- `provider`: id plugin provider compaction terdaftar. Saat disetel, `summarize()` milik provider dipanggil alih-alih ringkasan LLM built-in. Fallback ke built-in saat gagal. Menyetel provider memaksa `mode: "safeguard"`. Lihat [Compaction](/id/concepts/compaction).
- `timeoutSeconds`: jumlah detik maksimum yang diizinkan untuk satu operasi compaction sebelum OpenClaw membatalkannya. Default: `900`.
- `identifierPolicy`: `strict` (default), `off`, atau `custom`. `strict` menambahkan panduan retensi identifier opak built-in selama summarization compaction.
- `identifierInstructions`: teks pelestarian identifier kustom opsional yang digunakan saat `identifierPolicy=custom`.
- `postCompactionSections`: nama bagian H2/H3 AGENTS.md opsional yang disisipkan ulang setelah compaction. Default ke `["Session Startup", "Red Lines"]`; set `[]` untuk menonaktifkan reinjection. Saat tidak disetel atau secara eksplisit disetel ke pasangan default itu, heading lama `Every Session`/`Safety` juga diterima sebagai fallback lama.
- `model`: override `provider/model-id` opsional hanya untuk summarization compaction. Gunakan ini saat sesi utama harus tetap memakai satu model tetapi ringkasan compaction harus berjalan pada model lain; saat tidak disetel, compaction menggunakan model utama sesi.
- `notifyUser`: saat `true`, mengirim pemberitahuan singkat ke pengguna saat compaction dimulai (misalnya, "Compacting context..."). Dinonaktifkan secara default agar compaction tetap senyap.
- `memoryFlush`: giliran agentic senyap sebelum auto-compaction untuk menyimpan memori yang tahan lama. Dilewati saat workspace read-only.

### `agents.defaults.contextPruning`

Memangkas **hasil tool lama** dari konteks dalam memori sebelum dikirim ke LLM. **Tidak** memodifikasi riwayat sesi di disk.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Perilaku mode cache-ttl">

- `mode: "cache-ttl"` mengaktifkan pass pruning.
- `ttl` mengontrol seberapa sering pruning dapat dijalankan lagi (setelah sentuhan cache terakhir).
- Pruning terlebih dahulu melakukan soft-trim pada hasil tool yang terlalu besar, lalu hard-clear pada hasil tool yang lebih lama bila diperlukan.

**Soft-trim** mempertahankan awal + akhir dan menyisipkan `...` di tengah.

**Hard-clear** mengganti seluruh hasil tool dengan placeholder.

Catatan:

- Blok gambar tidak pernah dipotong/dikosongkan.
- Rasio berbasis karakter (perkiraan), bukan hitungan token yang tepat.
- Jika ada kurang dari `keepLastAssistants` pesan asisten, pruning dilewati.

</Accordion>

Lihat [Session Pruning](/id/concepts/session-pruning) untuk detail perilaku.

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Channel non-Telegram memerlukan `*.blockStreaming: true` eksplisit untuk mengaktifkan balasan blok.
- Override channel: `channels.<channel>.blockStreamingCoalesce` (dan varian per-akun). Signal/Slack/Discord/Google Chat default `minChars: 1500`.
- `humanDelay`: jeda acak antar balasan blok. `natural` = 800–2500ms. Override per-agen: `agents.list[].humanDelay`.

Lihat [Streaming](/id/concepts/streaming) untuk perilaku + detail chunking.

### Indikator mengetik

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Default: `instant` untuk chat langsung/mention, `message` untuk chat grup tanpa mention.
- Override per-sesi: `session.typingMode`, `session.typingIntervalSeconds`.

Lihat [Typing Indicators](/id/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing opsional untuk agen tersemat. Lihat [Sandboxing](/id/gateway/sandboxing) untuk panduan lengkap.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Detail sandbox">

**Backend:**

- `docker`: runtime Docker lokal (default)
- `ssh`: runtime jarak jauh berbasis SSH generik
- `openshell`: runtime OpenShell

Saat `backend: "openshell"` dipilih, pengaturan khusus runtime dipindahkan ke
`plugins.entries.openshell.config`.

**Konfigurasi backend SSH:**

- `target`: target SSH dalam bentuk `user@host[:port]`
- `command`: perintah klien SSH (default: `ssh`)
- `workspaceRoot`: root jarak jauh absolut yang digunakan untuk workspace per-scope
- `identityFile` / `certificateFile` / `knownHostsFile`: file lokal yang ada yang diteruskan ke OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: konten inline atau SecretRef yang dimaterialisasikan OpenClaw ke file sementara saat runtime
- `strictHostKeyChecking` / `updateHostKeys`: knob kebijakan host-key OpenSSH

**Precedensi auth SSH:**

- `identityData` menang atas `identityFile`
- `certificateData` menang atas `certificateFile`
- `knownHostsData` menang atas `knownHostsFile`
- Nilai `*Data` berbasis SecretRef di-resolve dari snapshot runtime secrets aktif sebelum sesi sandbox dimulai

**Perilaku backend SSH:**

- menanam workspace jarak jauh sekali setelah create atau recreate
- lalu mempertahankan workspace SSH jarak jauh sebagai yang kanonis
- merutekan `exec`, file tools, dan path media melalui SSH
- tidak menyinkronkan perubahan jarak jauh kembali ke host secara otomatis
- tidak mendukung kontainer browser sandbox

**Akses workspace:**

- `none`: workspace sandbox per-scope di bawah `~/.openclaw/sandboxes`
- `ro`: workspace sandbox di `/workspace`, workspace agen di-mount read-only di `/agent`
- `rw`: workspace agen di-mount read/write di `/workspace`

**Scope:**

- `session`: kontainer + workspace per-sesi
- `agent`: satu kontainer + workspace per agen (default)
- `shared`: kontainer dan workspace bersama (tanpa isolasi lintas sesi)

**Konfigurasi plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Mode OpenShell:**

- `mirror`: tanam remote dari lokal sebelum exec, sinkronkan balik setelah exec; workspace lokal tetap kanonis
- `remote`: tanam remote sekali saat sandbox dibuat, lalu pertahankan workspace remote sebagai yang kanonis

Dalam mode `remote`, edit lokal host yang dibuat di luar OpenClaw tidak disinkronkan ke sandbox secara otomatis setelah langkah seed.
Transport menggunakan SSH ke sandbox OpenShell, tetapi plugin memiliki lifecycle sandbox dan sinkronisasi mirror opsional.

**`setupCommand`** berjalan sekali setelah pembuatan kontainer (melalui `sh -lc`). Memerlukan egress jaringan, root yang dapat ditulis, pengguna root.

**Kontainer default ke `network: "none"`** — set ke `"bridge"` (atau jaringan bridge kustom) jika agen memerlukan akses keluar.
`"host"` diblokir. `"container:<id>"` diblokir secara default kecuali Anda secara eksplisit menyetel
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Lampiran masuk** ditempatkan ke `media/inbound/*` dalam workspace aktif.

**`docker.binds`** me-mount direktori host tambahan; bind global dan per-agen digabung.

**Browser sandbox** (`sandbox.browser.enabled`): Chromium + CDP dalam kontainer. URL noVNC disisipkan ke system prompt. Tidak memerlukan `browser.enabled` di `openclaw.json`.
Akses pengamat noVNC secara default menggunakan auth VNC dan OpenClaw mengeluarkan URL token jangka pendek (alih-alih mengekspos password dalam URL bersama).

- `allowHostControl: false` (default) memblokir sesi sandbox menargetkan browser host.
- `network` default ke `openclaw-sandbox-browser` (jaringan bridge khusus). Set ke `bridge` hanya bila Anda secara eksplisit menginginkan konektivitas bridge global.
- `cdpSourceRange` secara opsional membatasi ingress CDP pada tepi kontainer ke rentang CIDR (misalnya `172.21.0.1/32`).
- `sandbox.browser.binds` me-mount direktori host tambahan hanya ke kontainer browser sandbox. Saat disetel (termasuk `[]`), ini menggantikan `docker.binds` untuk kontainer browser.
- Default peluncuran didefinisikan di `scripts/sandbox-browser-entrypoint.sh` dan disetel untuk host kontainer:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (default aktif)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, dan `--disable-gpu`
    diaktifkan secara default dan dapat dinonaktifkan dengan
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` jika penggunaan WebGL/3D memerlukannya.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` mengaktifkan kembali extension jika alur kerja Anda
    bergantung padanya.
  - `--renderer-process-limit=2` dapat diubah dengan
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; set `0` untuk menggunakan
    batas proses default Chromium.
  - ditambah `--no-sandbox` dan `--disable-setuid-sandbox` saat `noSandbox` diaktifkan.
  - Default adalah baseline image kontainer; gunakan image browser kustom dengan
    entrypoint kustom untuk mengubah default kontainer.

</Accordion>

Browser sandboxing dan `sandbox.docker.binds` hanya untuk Docker.

Build image:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (override per-agen)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id agen stabil (wajib).
- `default`: saat beberapa disetel, yang pertama menang (peringatan dicatat). Jika tidak ada yang disetel, entri daftar pertama menjadi default.
- `model`: bentuk string hanya meng-override `primary`; bentuk objek `{ primary, fallbacks }` meng-override keduanya (`[]` menonaktifkan fallback global). Job cron yang hanya meng-override `primary` tetap mewarisi fallback default kecuali Anda menyetel `fallbacks: []`.
- `params`: parameter stream per-agen yang digabung di atas entri model terpilih di `agents.defaults.models`. Gunakan ini untuk override spesifik agen seperti `cacheRetention`, `temperature`, atau `maxTokens` tanpa menduplikasi seluruh katalog model.
- `skills`: allowlist Skills per-agen opsional. Jika dihilangkan, agen mewarisi `agents.defaults.skills` bila disetel; daftar eksplisit menggantikan default alih-alih digabung, dan `[]` berarti tanpa Skills.
- `thinkingDefault`: default tingkat thinking per-agen opsional (`off | minimal | low | medium | high | xhigh | adaptive`). Meng-override `agents.defaults.thinkingDefault` untuk agen ini saat tidak ada override per-pesan atau per-sesi.
- `reasoningDefault`: default visibilitas reasoning per-agen opsional (`on | off | stream`). Berlaku saat tidak ada override reasoning per-pesan atau per-sesi.
- `fastModeDefault`: default mode cepat per-agen opsional (`true | false`). Berlaku saat tidak ada override mode cepat per-pesan atau per-sesi.
- `runtime`: descriptor runtime per-agen opsional. Gunakan `type: "acp"` dengan default `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) saat agen harus default ke sesi harness ACP.
- `identity.avatar`: path relatif workspace, URL `http(s)`, atau URI `data:`.
- `identity` menurunkan default: `ackReaction` dari `emoji`, `mentionPatterns` dari `name`/`emoji`.
- `subagents.allowAgents`: allowlist id agen untuk `sessions_spawn` (`["*"]` = apa pun; default: hanya agen yang sama).
- Guard pewarisan sandbox: jika sesi peminta disandbox, `sessions_spawn` menolak target yang akan berjalan tanpa sandbox.
- `subagents.requireAgentId`: saat true, blokir panggilan `sessions_spawn` yang menghilangkan `agentId` (memaksa pemilihan profil eksplisit; default: false).

---

## Routing multi-agen

Jalankan beberapa agen terisolasi dalam satu Gateway. Lihat [Multi-Agent](/id/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Field kecocokan binding

- `type` (opsional): `route` untuk routing normal (tanpa type default ke route), `acp` untuk binding percakapan ACP persisten.
- `match.channel` (wajib)
- `match.accountId` (opsional; `*` = akun apa pun; dihilangkan = akun default)
- `match.peer` (opsional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opsional; spesifik channel)
- `acp` (opsional; hanya untuk entri `type: "acp"`): `{ mode, label, cwd, backend }`

**Urutan pencocokan deterministik:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (persis, tanpa peer/guild/team)
5. `match.accountId: "*"` (cakupan channel)
6. Agen default

Dalam tiap tingkat, entri `bindings` pertama yang cocok akan menang.

Untuk entri `type: "acp"`, OpenClaw me-resolve berdasarkan identitas percakapan yang persis (`match.channel` + akun + `match.peer.id`) dan tidak menggunakan urutan tingkat binding route di atas.

### Profil akses per-agen

<Accordion title="Akses penuh (tanpa sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Tool + workspace read-only">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Tanpa akses filesystem (hanya messaging)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Lihat [Multi-Agent Sandbox & Tools](/id/tools/multi-agent-sandbox-tools) untuk detail precedensi.

---

## Sesi

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Detail field sesi">

- **`scope`**: strategi pengelompokan sesi dasar untuk konteks chat grup.
  - `per-sender` (default): tiap pengirim mendapat sesi terisolasi dalam konteks channel.
  - `global`: semua peserta dalam konteks channel berbagi satu sesi (gunakan hanya bila konteks bersama memang diinginkan).
- **`dmScope`**: bagaimana DM dikelompokkan.
  - `main`: semua DM berbagi sesi utama.
  - `per-peer`: isolasi berdasarkan id pengirim lintas channel.
  - `per-channel-peer`: isolasi per channel + pengirim (direkomendasikan untuk inbox multi-pengguna).
  - `per-account-channel-peer`: isolasi per akun + channel + pengirim (direkomendasikan untuk multi-akun).
- **`identityLinks`**: peta id kanonis ke peer berprefiks provider untuk berbagi sesi lintas channel.
- **`reset`**: kebijakan reset utama. `daily` mereset pada `atHour` waktu lokal; `idle` mereset setelah `idleMinutes`. Saat keduanya dikonfigurasi, yang kedaluwarsa lebih dulu menang.
- **`resetByType`**: override per-tipe (`direct`, `group`, `thread`). `dm` lama diterima sebagai alias untuk `direct`.
- **`parentForkMaxTokens`**: `totalTokens` sesi induk maksimum yang diizinkan saat membuat sesi thread yang di-fork (default `100000`).
  - Jika `totalTokens` induk di atas nilai ini, OpenClaw memulai sesi thread baru alih-alih mewarisi riwayat transkrip induk.
  - Set `0` untuk menonaktifkan guard ini dan selalu mengizinkan forking induk.
- **`mainKey`**: field lama. Runtime selalu menggunakan `"main"` untuk bucket chat langsung utama.
- **`agentToAgent.maxPingPongTurns`**: jumlah maksimum giliran balas-balik antar agen selama pertukaran agent-to-agent (integer, rentang: `0`–`5`). `0` menonaktifkan rantai ping-pong.
- **`sendPolicy`**: cocokkan berdasarkan `channel`, `chatType` (`direct|group|channel`, dengan alias lama `dm`), `keyPrefix`, atau `rawKeyPrefix`. Penolakan pertama menang.
- **`maintenance`**: kontrol pembersihan + retensi penyimpanan sesi.
  - `mode`: `warn` hanya mengeluarkan peringatan; `enforce` menerapkan pembersihan.
  - `pruneAfter`: batas usia untuk entri basi (default `30d`).
  - `maxEntries`: jumlah maksimum entri dalam `sessions.json` (default `500`).
  - `rotateBytes`: rotasi `sessions.json` saat melampaui ukuran ini (default `10mb`).
  - `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>`. Default ke `pruneAfter`; set `false` untuk menonaktifkan.
  - `maxDiskBytes`: anggaran disk direktori sesi keras opsional. Dalam mode `warn` akan mencatat peringatan; dalam mode `enforce` akan menghapus artefak/sesi tertua terlebih dahulu.
  - `highWaterBytes`: target opsional setelah pembersihan anggaran. Default ke `80%` dari `maxDiskBytes`.
- **`threadBindings`**: default global untuk fitur sesi terikat thread.
  - `enabled`: sakelar default utama (provider dapat meng-override; Discord menggunakan `channels.discord.threadBindings.enabled`)
  - `idleHours`: default auto-unfocus karena inaktivitas dalam jam (`0` menonaktifkan; provider dapat meng-override)
  - `maxAgeHours`: default usia maksimum keras dalam jam (`0` menonaktifkan; provider dapat meng-override)

</Accordion>

---

## Pesan

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks respons

Override per-channel/akun: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Resolusi (yang paling spesifik menang): akun → channel → global. `""` menonaktifkan dan menghentikan cascade. `"auto"` menurunkan `[{identity.name}]`.

**Variabel template:**

| Variabel          | Deskripsi             | Contoh                      |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | Nama model pendek     | `claude-opus-4-6`           |
| `{modelFull}`     | Identifier model penuh| `anthropic/claude-opus-4-6` |
| `{provider}`      | Nama provider         | `anthropic`                 |
| `{thinkingLevel}` | Tingkat thinking saat ini | `high`, `low`, `off`    |
| `{identity.name}` | Nama identitas agen   | (sama seperti `"auto"`)     |

Variabel tidak peka huruf besar/kecil. `{think}` adalah alias untuk `{thinkingLevel}`.

### Reaksi ack

- Default ke `identity.emoji` agen aktif, jika tidak `"👀"`. Set `""` untuk menonaktifkan.
- Override per-channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Urutan resolusi: akun → channel → `messages.ackReaction` → fallback identitas.
- Scope: `group-mentions` (default), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: menghapus ack setelah balasan di Slack, Discord, dan Telegram.
- `messages.statusReactions.enabled`: mengaktifkan reaksi status lifecycle di Slack, Discord, dan Telegram.
  Di Slack dan Discord, jika tidak disetel maka status reactions tetap aktif ketika ack reactions aktif.
  Di Telegram, set secara eksplisit ke `true` untuk mengaktifkan lifecycle status reactions.

### Debounce inbound

Mengelompokkan pesan teks cepat dari pengirim yang sama menjadi satu giliran agen. Media/lampiran langsung mem-flush. Perintah kontrol melewati debouncing.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` mengontrol mode auto-TTS default: `off`, `always`, `inbound`, atau `tagged`. `/tts on|off` dapat meng-override preferensi lokal, dan `/tts status` menampilkan status efektif.
- `summaryModel` meng-override `agents.defaults.model.primary` untuk auto-summary.
- `modelOverrides` aktif secara default; `modelOverrides.allowProvider` default ke `false` (opt-in).
- API key fallback ke `ELEVENLABS_API_KEY`/`XI_API_KEY` dan `OPENAI_API_KEY`.
- `openai.baseUrl` meng-override endpoint OpenAI TTS. Urutan resolusi adalah konfigurasi, lalu `OPENAI_TTS_BASE_URL`, lalu `https://api.openai.com/v1`.
- Saat `openai.baseUrl` menunjuk ke endpoint non-OpenAI, OpenClaw memperlakukannya sebagai server TTS yang kompatibel dengan OpenAI dan melonggarkan validasi model/voice.

---

## Talk

Default untuk mode Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` harus cocok dengan kunci di `talk.providers` saat beberapa provider Talk dikonfigurasi.
- Kunci Talk flat lama (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) hanya untuk kompatibilitas dan dimigrasikan otomatis ke `talk.providers.<provider>`.
- Voice ID fallback ke `ELEVENLABS_VOICE_ID` atau `SAG_VOICE_ID`.
- `providers.*.apiKey` menerima string plaintext atau objek SecretRef.
- Fallback `ELEVENLABS_API_KEY` hanya berlaku ketika tidak ada API key Talk yang dikonfigurasi.
- `providers.*.voiceAliases` memungkinkan directive Talk menggunakan nama yang ramah.
- `silenceTimeoutMs` mengontrol berapa lama mode Talk menunggu setelah pengguna diam sebelum mengirim transkrip. Jika tidak disetel, jeda default platform tetap dipakai (`700 ms di macOS dan Android, 900 ms di iOS`).

---

## Tool

### Profil tool

`tools.profile` menetapkan allowlist dasar sebelum `tools.allow`/`tools.deny`:

Onboarding lokal default mengatur konfigurasi lokal baru ke `tools.profile: "coding"` saat tidak disetel (profil eksplisit yang sudah ada dipertahankan).

| Profil      | Mencakup                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | hanya `session_status`                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                    |
| `full`      | Tanpa pembatasan (sama seperti tidak disetel)                                                                                 |

### Grup tool

| Grup               | Tool                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` diterima sebagai alias untuk `exec`)                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Semua tool built-in (tidak termasuk plugin provider)                                                                    |

### `tools.allow` / `tools.deny`

Kebijakan allow/deny tool global (deny menang). Tidak peka huruf besar/kecil, mendukung wildcard `*`. Diterapkan bahkan saat sandbox Docker mati.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Batasi lebih lanjut tool untuk provider atau model tertentu. Urutan: profil dasar → profil provider → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Mengontrol akses exec elevated di luar sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Override per-agen (`agents.list[].tools.elevated`) hanya dapat membatasi lebih lanjut.
- `/elevated on|off|ask|full` menyimpan state per sesi; directive inline berlaku untuk satu pesan.
- `exec` elevated melewati sandboxing dan menggunakan jalur escape yang dikonfigurasi (`gateway` secara default, atau `node` saat target exec adalah `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Pemeriksaan keamanan loop tool **nonaktif secara default**. Set `enabled: true` untuk mengaktifkan deteksi.
Pengaturan dapat didefinisikan secara global di `tools.loopDetection` dan dioverride per-agen di `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: riwayat panggilan tool maksimum yang dipertahankan untuk analisis loop.
- `warningThreshold`: ambang pola berulang tanpa kemajuan untuk peringatan.
- `criticalThreshold`: ambang berulang yang lebih tinggi untuk memblokir loop kritis.
- `globalCircuitBreakerThreshold`: ambang penghentian keras untuk run tanpa kemajuan apa pun.
- `detectors.genericRepeat`: peringatkan pada panggilan tool yang sama/argumen yang sama berulang.
- `detectors.knownPollNoProgress`: peringatkan/blokir pada tool poll yang dikenal (`process.poll`, `command_status`, dll.).
- `detectors.pingPong`: peringatkan/blokir pada pola pasangan tanpa kemajuan yang bergantian.
- Jika `warningThreshold >= criticalThreshold` atau `criticalThreshold >= globalCircuitBreakerThreshold`, validasi gagal.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Mengonfigurasi pemahaman media masuk (gambar/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Field entri model media">

**Entri provider** (`type: "provider"` atau dihilangkan):

- `provider`: id provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, dll.)
- `model`: override model id
- `profile` / `preferredProfile`: pemilihan profil `auth-profiles.json`

**Entri CLI** (`type: "cli"`):

- `command`: executable yang dijalankan
- `args`: arg templat (mendukung `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, dll.)

**Field umum:**

- `capabilities`: daftar opsional (`image`, `audio`, `video`). Default: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per-entri.
- Kegagalan fallback ke entri berikutnya.

Auth provider mengikuti urutan standar: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**Field penyelesaian async:**

- `asyncCompletion.directSend`: saat `true`, tugas `music_generate`
  dan `video_generate` async yang selesai mencoba pengiriman channel langsung terlebih dahulu. Default: `false`
  (jalur wake/model-delivery sesi peminta lama).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Mengontrol sesi mana yang dapat ditargetkan oleh session tools (`sessions_list`, `sessions_history`, `sessions_send`).

Default: `tree` (sesi saat ini + sesi yang dibuat olehnya, seperti subagen).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Catatan:

- `self`: hanya kunci sesi saat ini.
- `tree`: sesi saat ini + sesi yang dibuat oleh sesi saat ini (subagen).
- `agent`: sesi apa pun milik id agen saat ini (dapat mencakup pengguna lain jika Anda menjalankan sesi per-pengirim di bawah id agen yang sama).
- `all`: sesi apa pun. Penargetan lintas agen tetap memerlukan `tools.agentToAgent`.
- Clamp sandbox: saat sesi saat ini disandbox dan `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibilitas dipaksa ke `tree` walaupun `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Mengontrol dukungan lampiran inline untuk `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Catatan:

- Lampiran hanya didukung untuk `runtime: "subagent"`. Runtime ACP menolaknya.
- File dimaterialisasikan ke workspace child di `.openclaw/attachments/<uuid>/` dengan `.manifest.json`.
- Konten lampiran otomatis disensor dari persistensi transkrip.
- Input base64 divalidasi dengan pemeriksaan alfabet/padding ketat dan guard ukuran sebelum decode.
- Izin file adalah `0700` untuk direktori dan `0600` untuk file.
- Pembersihan mengikuti kebijakan `cleanup`: `delete` selalu menghapus lampiran; `keep` mempertahankannya hanya jika `retainOnSessionKeep: true`.

### `tools.experimental`

Flag tool built-in eksperimental. Default nonaktif kecuali aturan auto-enable khusus runtime berlaku.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Catatan:

- `planTool`: mengaktifkan tool `update_plan` terstruktur eksperimental untuk pelacakan pekerjaan multi-langkah yang tidak sepele.
- Default: `false` untuk provider non-OpenAI. Run OpenAI dan OpenAI Codex mengaktifkannya otomatis saat tidak disetel; set `false` untuk menonaktifkan auto-enable itu.
- Saat diaktifkan, system prompt juga menambahkan panduan penggunaan agar model hanya menggunakannya untuk pekerjaan substansial dan mempertahankan paling banyak satu langkah `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: model default untuk sub-agen yang dibuat. Jika dihilangkan, sub-agen mewarisi model pemanggil.
- `allowAgents`: allowlist default id agen target untuk `sessions_spawn` saat agen peminta tidak menyetel `subagents.allowAgents` sendiri (`["*"]` = apa pun; default: hanya agen yang sama).
- `runTimeoutSeconds`: timeout default (detik) untuk `sessions_spawn` saat panggilan tool menghilangkan `runTimeoutSeconds`. `0` berarti tanpa timeout.
- Kebijakan tool per-subagen: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider kustom dan base URL

OpenClaw menggunakan katalog model built-in. Tambahkan provider kustom melalui `models.providers` di konfigurasi atau `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Gunakan `authHeader: true` + `headers` untuk kebutuhan auth kustom.
- Override root konfigurasi agen dengan `OPENCLAW_AGENT_DIR` (atau `PI_CODING_AGENT_DIR`, alias environment variable lama).
- Precedensi penggabungan untuk provider ID yang cocok:
  - Nilai `baseUrl` agen `models.json` yang tidak kosong menang.
  - Nilai `apiKey` agen yang tidak kosong menang hanya bila provider itu tidak dikelola SecretRef dalam konteks konfigurasi/auth-profile saat ini.
  - Nilai `apiKey` provider yang dikelola SecretRef disegarkan dari penanda sumber (`ENV_VAR_NAME` untuk env ref, `secretref-managed` untuk file/exec ref) alih-alih menyimpan secret yang sudah di-resolve.
  - Nilai header provider yang dikelola SecretRef disegarkan dari penanda sumber (`secretref-env:ENV_VAR_NAME` untuk env ref, `secretref-managed` untuk file/exec ref).
  - `apiKey`/`baseUrl` agen yang kosong atau hilang fallback ke `models.providers` di konfigurasi.
  - `contextWindow`/`maxTokens` model yang cocok menggunakan nilai yang lebih tinggi antara konfigurasi eksplisit dan nilai katalog implisit.
  - `contextTokens` model yang cocok mempertahankan batas runtime eksplisit saat ada; gunakan ini untuk membatasi konteks efektif tanpa mengubah metadata model native.
  - Gunakan `models.mode: "replace"` saat Anda ingin konfigurasi menulis ulang `models.json` sepenuhnya.
  - Persistensi marker bersifat source-authoritative: marker ditulis dari snapshot konfigurasi sumber aktif (pra-resolusi), bukan dari nilai secret runtime yang sudah di-resolve.

### Detail field provider

- `models.mode`: perilaku katalog provider (`merge` atau `replace`).
- `models.providers`: peta provider kustom yang dikunci dengan provider id.
- `models.providers.*.api`: adapter permintaan (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, dll).
- `models.providers.*.apiKey`: kredensial provider (sebaiknya SecretRef/substitusi env).
- `models.providers.*.auth`: strategi auth (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: untuk Ollama + `openai-completions`, sisipkan `options.num_ctx` ke permintaan (default: `true`).
- `models.providers.*.authHeader`: paksa transport kredensial di header `Authorization` saat diperlukan.
- `models.providers.*.baseUrl`: base URL API upstream.
- `models.providers.*.headers`: header statis tambahan untuk routing proxy/tenant.
- `models.providers.*.request`: override transport untuk permintaan HTTP model-provider.
  - `request.headers`: header tambahan (digabung dengan default provider). Nilai menerima SecretRef.
  - `request.auth`: override strategi auth. Mode: `"provider-default"` (gunakan auth built-in provider), `"authorization-bearer"` (dengan `token`), `"header"` (dengan `headerName`, `value`, `prefix` opsional).
  - `request.proxy`: override proxy HTTP. Mode: `"env-proxy"` (gunakan env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (dengan `url`). Kedua mode menerima sub-objek `tls` opsional.
  - `request.tls`: override TLS untuk koneksi langsung. Field: `ca`, `cert`, `key`, `passphrase` (semua menerima SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: entri katalog model provider eksplisit.
- `models.providers.*.models.*.contextWindow`: metadata context window model native.
- `models.providers.*.models.*.contextTokens`: batas konteks runtime opsional. Gunakan ini saat Anda menginginkan anggaran konteks efektif yang lebih kecil daripada `contextWindow` native model.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: petunjuk kompatibilitas opsional. Untuk `api: "openai-completions"` dengan `baseUrl` non-native yang tidak kosong (host bukan `api.openai.com`), OpenClaw memaksa ini menjadi `false` saat runtime. `baseUrl` kosong/tidak ada mempertahankan perilaku default OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: petunjuk kompatibilitas opsional untuk endpoint chat string-only yang kompatibel dengan OpenAI. Saat `true`, OpenClaw meratakan array `messages[].content` teks murni menjadi string biasa sebelum mengirim permintaan.
- `plugins.entries.amazon-bedrock.config.discovery`: root pengaturan auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: aktifkan/nonaktifkan implicit discovery.
- `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS untuk discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter provider-id opsional untuk discovery yang ditargetkan.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interval polling untuk penyegaran discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: context window fallback untuk model yang ditemukan.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token output maksimum fallback untuk model yang ditemukan.

### Contoh provider

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Gunakan `cerebras/zai-glm-4.7` untuk Cerebras; `zai/glm-4.7` untuk Z.AI direct.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Set `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`). Gunakan referensi `opencode/...` untuk katalog Zen atau referensi `opencode-go/...` untuk katalog Go. Shortcut: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Set `ZAI_API_KEY`. `z.ai/*` dan `z-ai/*` diterima sebagai alias. Shortcut: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint umum: `https://api.z.ai/api/paas/v4`
- Endpoint coding (default): `https://api.z.ai/api/coding/paas/v4`
- Untuk endpoint umum, definisikan provider kustom dengan override base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Untuk endpoint China: `baseUrl: "https://api.moonshot.cn/v1"` atau `openclaw onboard --auth-choice moonshot-api-key-cn`.

Endpoint Moonshot native mengiklankan kompatibilitas penggunaan streaming pada
transport bersama `openai-completions`, dan OpenClaw mengacu pada kapabilitas endpoint itu
bukan hanya provider id built-in.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Kompatibel dengan Anthropic, provider built-in. Shortcut: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (kompatibel dengan Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL harus menghilangkan `/v1` (klien Anthropic menambahkannya). Shortcut: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Set `MINIMAX_API_KEY`. Shortcut:
`openclaw onboard --auth-choice minimax-global-api` atau
`openclaw onboard --auth-choice minimax-cn-api`.
Katalog model default hanya ke M2.7.
Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking MiniMax
secara default kecuali Anda secara eksplisit menyetel `thinking` sendiri. `/fast on` atau
`params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Model lokal (LM Studio)">

Lihat [Local Models](/id/gateway/local-models). Singkatnya: jalankan model lokal besar melalui LM Studio Responses API pada perangkat keras serius; pertahankan model hosted tetap digabung untuk fallback.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opsional hanya untuk Skills bundled (Skills managed/workspace tidak terpengaruh).
- `load.extraDirs`: root Skills bersama tambahan (precedensi terendah).
- `install.preferBrew`: saat true, prioritaskan installer Homebrew saat `brew`
  tersedia sebelum fallback ke jenis installer lain.
- `install.nodeManager`: preferensi installer node untuk spesifikasi `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` menonaktifkan sebuah skill meskipun bundled/terinstal.
- `entries.<skillKey>.apiKey`: field kenyamanan API key tingkat skill (bila didukung skill tersebut).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Dimuat dari `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, plus `plugins.load.paths`.
- Discovery menerima plugin OpenClaw native plus bundle Codex yang kompatibel dan bundle Claude, termasuk bundle Claude default-layout tanpa manifest.
- **Perubahan konfigurasi memerlukan restart gateway.**
- `allow`: allowlist opsional (hanya plugin yang tercantum yang dimuat). `deny` menang.
- `plugins.entries.<id>.apiKey`: field kenyamanan API key tingkat plugin (saat didukung plugin).
- `plugins.entries.<id>.env`: peta env var yang dicakup plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: saat `false`, inti memblokir `before_prompt_build` dan mengabaikan field legacy `before_agent_start` yang memutasi prompt, sambil mempertahankan `modelOverride` dan `providerOverride` lama. Berlaku pada hook plugin native dan direktori hook yang disediakan bundle yang didukung.
- `plugins.entries.<id>.subagent.allowModelOverride`: secara eksplisit mempercayai plugin ini untuk meminta override `provider` dan `model` per-run untuk run subagen latar belakang.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opsional target `provider/model` kanonis untuk override subagen tepercaya. Gunakan `"*"` hanya bila Anda memang ingin mengizinkan model apa pun.
- `plugins.entries.<id>.config`: objek konfigurasi yang ditentukan plugin (divalidasi oleh schema plugin OpenClaw native bila tersedia).
- `plugins.entries.firecrawl.config.webFetch`: pengaturan provider web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (menerima SecretRef). Fallback ke `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` lama, atau env var `FIRECRAWL_API_KEY`.
  - `baseUrl`: base URL API Firecrawl (default: `https://api.firecrawl.dev`).
  - `onlyMainContent`: ekstrak hanya konten utama dari halaman (default: `true`).
  - `maxAgeMs`: usia cache maksimum dalam milidetik (default: `172800000` / 2 hari).
  - `timeoutSeconds`: timeout permintaan scrape dalam detik (default: `60`).
- `plugins.entries.xai.config.xSearch`: pengaturan xAI X Search (pencarian web Grok).
  - `enabled`: aktifkan provider X Search.
  - `model`: model Grok yang digunakan untuk pencarian (mis. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: pengaturan memory dreaming (eksperimental). Lihat [Dreaming](/id/concepts/dreaming) untuk fase dan ambang.
  - `enabled`: sakelar dreaming utama (default `false`).
  - `frequency`: cadence cron untuk tiap sweep dreaming penuh (`"0 3 * * *"` secara default).
  - kebijakan fase dan ambang adalah detail implementasi (bukan kunci konfigurasi yang dihadapkan ke pengguna).
- Konfigurasi memori lengkap ada di [Referensi konfigurasi memori](/id/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin bundle Claude yang aktif juga dapat menyumbang default Pi tersemat dari `settings.json`; OpenClaw menerapkannya sebagai pengaturan agen yang disanitasi, bukan sebagai patch konfigurasi OpenClaw mentah.
- `plugins.slots.memory`: pilih id plugin memori aktif, atau `"none"` untuk menonaktifkan plugin memori.
- `plugins.slots.contextEngine`: pilih id plugin context engine aktif; default ke `"legacy"` kecuali Anda menginstal dan memilih engine lain.
- `plugins.installs`: metadata instalasi yang dikelola CLI yang digunakan oleh `openclaw plugins update`.
  - Mencakup `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Perlakukan `plugins.installs.*` sebagai state terkelola; sebaiknya gunakan perintah CLI alih-alih edit manual.

Lihat [Plugins](/id/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` menonaktifkan `act:evaluate` dan `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` default ke `true` saat tidak disetel (model trusted-network).
- Set `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` untuk navigasi browser publik-saja yang ketat.
- Dalam mode ketat, endpoint profil CDP remote (`profiles.*.cdpUrl`) tunduk pada pemblokiran private-network yang sama selama pemeriksaan reachability/discovery.
- `ssrfPolicy.allowPrivateNetwork` tetap didukung sebagai alias lama.
- Dalam mode ketat, gunakan `ssrfPolicy.hostnameAllowlist` dan `ssrfPolicy.allowedHostnames` untuk pengecualian eksplisit.
- Profil remote bersifat attach-only (start/stop/reset dinonaktifkan).
- `profiles.*.cdpUrl` menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) saat Anda ingin OpenClaw menemukan `/json/version`; gunakan WS(S)
  saat provider Anda memberi URL WebSocket DevTools langsung.
- Profil `existing-session` hanya untuk host dan menggunakan Chrome MCP alih-alih CDP.
- Profil `existing-session` dapat menyetel `userDataDir` untuk menargetkan profil browser
  berbasis Chromium tertentu seperti Brave atau Edge.
- Profil `existing-session` mempertahankan batas rute Chrome MCP saat ini:
  aksi berbasis snapshot/ref alih-alih penargetan CSS selector, hook upload satu file,
  tanpa override timeout dialog, tanpa `wait --load networkidle`, dan tanpa
  `responsebody`, ekspor PDF, intersepsi unduhan, atau aksi batch.
- Profil `openclaw` yang dikelola lokal menetapkan otomatis `cdpPort` dan `cdpUrl`; hanya
  set `cdpUrl` secara eksplisit untuk CDP remote.
- Urutan auto-detect: browser default bila berbasis Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Layanan kontrol: hanya loopback (port diturunkan dari `gateway.port`, default `18791`).
- `extraArgs` menambahkan flag peluncuran tambahan ke startup Chromium lokal (misalnya
  `--disable-gpu`, ukuran jendela, atau flag debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: warna aksen untuk chrome UI aplikasi native (warna bubble Talk Mode, dll.).
- `assistant`: override identitas UI Kontrol. Fallback ke identitas agen aktif.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detail field Gateway">

- `mode`: `local` (jalankan gateway) atau `remote` (hubungkan ke gateway jarak jauh). Gateway menolak start kecuali `local`.
- `port`: satu port multipleks untuk WS + HTTP. Precedensi: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (default), `lan` (`0.0.0.0`), `tailnet` (hanya IP Tailscale), atau `custom`.
- **Alias bind lama**: gunakan nilai mode bind di `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), bukan alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Catatan Docker**: bind default `loopback` mendengarkan pada `127.0.0.1` di dalam kontainer. Dengan jaringan bridge Docker (`-p 18789:18789`), trafik tiba di `eth0`, sehingga gateway tidak dapat dijangkau. Gunakan `--network host`, atau set `bind: "lan"` (atau `bind: "custom"` dengan `customBindHost: "0.0.0.0"`) untuk mendengarkan di semua interface.
- **Auth**: diwajibkan secara default. Bind non-loopback memerlukan auth gateway. Dalam praktiknya ini berarti token/password bersama atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`. Wizard onboarding menghasilkan token secara default.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRef), set `gateway.auth.mode` secara eksplisit ke `token` atau `password`. Startup dan alur install/perbaikan layanan gagal bila keduanya dikonfigurasi dan mode tidak disetel.
- `gateway.auth.mode: "none"`: mode tanpa auth eksplisit. Gunakan hanya untuk setup loopback lokal tepercaya; ini sengaja tidak ditawarkan oleh prompt onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delegasikan auth ke reverse proxy yang sadar identitas dan percayai header identitas dari `gateway.trustedProxies` (lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)). Mode ini mengharapkan sumber proxy **non-loopback**; reverse proxy loopback pada host yang sama tidak memenuhi trusted-proxy auth.
- `gateway.auth.allowTailscale`: saat `true`, header identitas Tailscale Serve dapat memenuhi auth UI Kontrol/WebSocket (diverifikasi via `tailscale whois`). Endpoint HTTP API **tidak** menggunakan auth header Tailscale itu; mereka mengikuti mode auth HTTP normal gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Default ke `true` saat `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limiter gagal-auth opsional. Berlaku per IP klien dan per scope auth (shared-secret dan device-token dilacak secara independen). Upaya yang diblokir mengembalikan `429` + `Retry-After`.
  - Pada jalur UI Kontrol async Tailscale Serve, upaya gagal untuk `{scope, clientIp}` yang sama diserialisasi sebelum penulisan kegagalan. Upaya buruk serentak dari klien yang sama karena itu dapat memicu limiter pada permintaan kedua alih-alih keduanya lolos begitu saja sebagai mismatch biasa.
  - `gateway.auth.rateLimit.exemptLoopback` default ke `true`; set `false` bila Anda sengaja ingin trafik localhost juga terkena rate-limit (untuk setup pengujian atau deployment proxy ketat).
- Upaya auth WS asal browser selalu dibatasi dengan pengecualian loopback dinonaktifkan (pertahanan berlapis terhadap brute force localhost berbasis browser).
- Pada loopback, lockout asal browser itu diisolasi per nilai `Origin`
  yang dinormalisasi, sehingga kegagalan berulang dari satu origin localhost tidak otomatis
  mengunci origin lain.
- `tailscale.mode`: `serve` (hanya tailnet, loopback bind) atau `funnel` (publik, memerlukan auth).
- `controlUi.allowedOrigins`: allowlist browser-origin eksplisit untuk koneksi WebSocket Gateway. Diperlukan saat klien browser diharapkan berasal dari origin non-loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: mode berbahaya yang mengaktifkan fallback origin berbasis Host-header untuk deployment yang sengaja bergantung pada kebijakan origin Host-header.
- `remote.transport`: `ssh` (default) atau `direct` (ws/wss). Untuk `direct`, `remote.url` harus `ws://` atau `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass sisi klien yang mengizinkan `ws://` plaintext ke IP private-network tepercaya; default tetap loopback-only untuk plaintext.
- `gateway.remote.token` / `.password` adalah field kredensial remote-client. Field ini tidak mengonfigurasi auth gateway dengan sendirinya.
- `gateway.push.apns.relay.baseUrl`: base HTTPS URL untuk relay APNs eksternal yang digunakan build iOS official/TestFlight setelah mereka mempublikasikan registrasi berbasis relay ke gateway. URL ini harus cocok dengan URL relay yang dikompilasi ke dalam build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout pengiriman gateway-ke-relay dalam milidetik. Default ke `10000`.
- Registrasi berbasis relay didelegasikan ke identitas gateway tertentu. Aplikasi iOS yang dipasangkan mengambil `gateway.identity.get`, menyertakan identitas itu dalam registrasi relay, dan meneruskan grant pengiriman yang dibatasi registrasi ke gateway. Gateway lain tidak dapat menggunakan ulang registrasi tersimpan itu.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env sementara untuk konfigurasi relay di atas.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch hanya untuk pengembangan bagi URL relay HTTP loopback. URL relay produksi sebaiknya tetap HTTPS.
- `gateway.channelHealthCheckMinutes`: interval pemantau kesehatan channel dalam menit. Set `0` untuk menonaktifkan restart health-monitor secara global. Default: `5`.
- `gateway.channelStaleEventThresholdMinutes`: ambang stale-socket dalam menit. Pertahankan ini lebih besar dari atau sama dengan `gateway.channelHealthCheckMinutes`. Default: `30`.
- `gateway.channelMaxRestartsPerHour`: jumlah maksimum restart health-monitor per channel/akun dalam satu jam bergulir. Default: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per-channel untuk restart health-monitor sambil tetap mempertahankan monitor global aktif.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per-akun untuk channel multi-akun. Saat disetel, ini mengalahkan override tingkat channel.
- Jalur panggilan gateway