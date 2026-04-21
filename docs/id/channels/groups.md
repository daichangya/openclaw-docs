---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan penyebutan
summary: Perilaku obrolan grup di berbagai permukaan (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-04-21T09:15:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbcdebd340a2ebb5898fe1eaf52258f65ba434bcf3be010d81b0e74af728aad4
    source_path: channels/groups.md
    workflow: 15
---

# Grup

OpenClaw menangani obrolan grup secara konsisten di berbagai permukaan: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw “hidup” di akun pesan Anda sendiri. Tidak ada pengguna bot WhatsApp yang terpisah.
Jika **Anda** berada di sebuah grup, OpenClaw dapat melihat grup itu dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan penyebutan kecuali Anda secara eksplisit menonaktifkan pembatasan penyebutan.

Terjemahannya: pengirim yang ada dalam allowlist dapat memicu OpenClaw dengan menyebutnya.

> TL;DR
>
> - **Akses DM** dikendalikan oleh `*.allowFrom`.
> - **Akses grup** dikendalikan oleh `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
> - **Pemicu balasan** dikendalikan oleh pembatasan penyebutan (`requireMention`, `/activation`).

Alur singkat (apa yang terjadi pada pesan grup):

```
groupPolicy? disabled -> abaikan
groupPolicy? allowlist -> grup diizinkan? tidak -> abaikan
requireMention? ya -> disebut? tidak -> simpan hanya untuk konteks
selain itu -> balas
```

## Visibilitas konteks dan allowlist

Ada dua kontrol berbeda yang terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist khusus channel).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat thread, metadata terusan).

Secara default, OpenClaw memprioritaskan perilaku obrolan normal dan menjaga konteks sebagian besar tetap seperti yang diterima. Ini berarti allowlist terutama menentukan siapa yang dapat memicu tindakan, bukan batas penyuntingan universal untuk setiap kutipan atau potongan riwayat.

Perilaku saat ini bersifat khusus per channel:

- Beberapa channel sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan pada jalur tertentu (misalnya seeding thread Slack, lookup balasan/thread Matrix).
- Channel lain masih meneruskan konteks kutipan/balasan/terusan sebagaimana diterima.

Arah penguatan (direncanakan):

- `contextVisibility: "all"` (default) mempertahankan perilaku saat ini sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang ada dalam allowlist.
- `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

Sampai model penguatan ini diterapkan secara konsisten di seluruh channel, perkirakan ada perbedaan antar permukaan.

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                       | Yang perlu disetel                                         |
| -------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @mention | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup               | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                          | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"`)    |
| Hanya Anda yang dapat memicu di grup         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (room/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Obrolan langsung menggunakan sesi utama (atau per-pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (agen tunggal)

Ya — ini bekerja dengan baik jika lalu lintas “pribadi” Anda adalah **DM** dan lalu lintas “publik” Anda adalah **grup**.

Alasannya: dalam mode agen tunggal, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan dalam backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap berjalan di host. Docker adalah backend default jika Anda tidak memilih salah satu.

Ini memberi Anda satu “otak” agen (ruang kerja + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat penuh (host)
- **Grup**: sandbox + alat terbatas

> Jika Anda memerlukan ruang kerja/persona yang benar-benar terpisah (“pribadi” dan “publik” tidak boleh pernah bercampur), gunakan agen kedua + bindings. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent).

Contoh (DM di host, grup disandbox + alat khusus pesan saja):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // grup/channel adalah non-main -> disandbox
        scope: "session", // isolasi terkuat (satu container per grup/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Jika allow tidak kosong, semua yang lain diblokir (deny tetap menang).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Ingin “grup hanya bisa melihat folder X” alih-alih “tidak ada akses host”? Tetap gunakan `workspaceAccess: "none"` dan mount hanya path yang ada dalam allowlist ke dalam sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Terkait:

- Kunci konfigurasi dan default: [Konfigurasi Gateway](/id/gateway/configuration-reference#agentsdefaultssandbox)
- Men-debug mengapa sebuah alat diblokir: [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` jika tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk room/channel; obrolan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

## Kebijakan grup

Kendalikan bagaimana pesan grup/room ditangani per channel:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id pengguna Telegram numerik (wizard dapat me-resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Kebijakan      | Perilaku                                                     |
| -------------- | ------------------------------------------------------------ |
| `"open"`       | Grup melewati allowlist; pembatasan penyebutan tetap berlaku. |
| `"disabled"`   | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"`  | Hanya izinkan grup/room yang cocok dengan allowlist yang dikonfigurasi. |

Catatan:

- `groupPolicy` terpisah dari pembatasan penyebutan (yang memerlukan @mention).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
- Persetujuan pairing DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit pada allowlist grup.
- Discord: allowlist menggunakan `channels.discord.guilds.<id>.channels`.
- Slack: allowlist menggunakan `channels.slack.channels`.
- Matrix: allowlist menggunakan `channels.matrix.groups`. Gunakan id room atau alias jika memungkinkan; lookup nama room yang diikuti bersifat best-effort, dan nama yang tidak ter-resolve diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; allowlist `users` per-room juga didukung.
- DM grup dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Allowlist Telegram dapat mencocokkan id pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau username (`"@alice"` atau `"alice"`); prefix tidak peka huruf besar/kecil.
- Default adalah `groupPolicy: "allowlist"`; jika allowlist grup Anda kosong, pesan grup diblokir.
- Keamanan runtime: ketika sebuah blok provider sama sekali tidak ada (`channels.<provider>` tidak ada), kebijakan grup fallback ke mode fail-closed (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

Model mental singkat (urutan evaluasi untuk pesan grup):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlist grup (`*.groups`, `*.groupAllowFrom`, allowlist khusus channel)
3. pembatasan penyebutan (`requireMention`, `/activation`)

## Pembatasan penyebutan (default)

Pesan grup memerlukan penyebutan kecuali ditimpa per grup. Default berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai penyebutan implisit ketika channel
mendukung metadata balasan. Mengutip pesan bot juga dapat dihitung sebagai penyebutan implisit
pada channel yang mengekspos metadata kutipan. Kasus bawaan saat ini mencakup
Telegram, WhatsApp, Slack, Discord, Microsoft Teams, dan ZaloUser.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Catatan:

- `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar/kecil; pola yang tidak valid dan bentuk pengulangan bertingkat yang tidak aman akan diabaikan.
- Permukaan yang menyediakan mention eksplisit tetap lolos; pola adalah fallback.
- Penimpaan per-agen: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi satu grup).
- Pembatasan penyebutan hanya diterapkan ketika deteksi penyebutan memungkinkan (mention bawaan atau `mentionPatterns` dikonfigurasi).
- Default Discord berada di `channels.discord.guilds."*"` (dapat ditimpa per guild/channel).
- Konteks riwayat grup dibungkus secara seragam di seluruh channel dan bersifat **hanya pending** (pesan yang dilewati karena pembatasan penyebutan); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk penimpaan. Setel `0` untuk menonaktifkan.

## Pembatasan alat grup/channel (opsional)

Beberapa konfigurasi channel mendukung pembatasan alat mana yang tersedia **di dalam grup/room/channel tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup.
- `toolsBySender`: penimpaan per-pengirim di dalam grup.
  Gunakan prefix kunci eksplisit:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`.
  Kunci lama tanpa prefix masih diterima dan hanya dicocokkan sebagai `id:`.

Urutan resolusi (yang paling spesifik menang):

1. kecocokan `toolsBySender` grup/channel
2. `tools` grup/channel
3. kecocokan `toolsBySender` default (`"*"`)
4. `tools` default (`"*"`)

Contoh (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Catatan:

- Pembatasan alat grup/channel diterapkan sebagai tambahan terhadap kebijakan alat global/agen (deny tetap menang).
- Beberapa channel menggunakan nesting berbeda untuk room/channel (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlist grup

Saat `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kunci-kuncinya berfungsi sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku penyebutan default.

Kebingungan umum: persetujuan pairing DM tidak sama dengan otorisasi grup.
Untuk channel yang mendukung pairing DM, penyimpanan pairing hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup yang eksplisit dari allowlist konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi yang didokumentasikan untuk channel tersebut.

Maksud umum (copy/paste):

1. Nonaktifkan semua balasan grup

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Izinkan hanya grup tertentu (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Izinkan semua grup tetapi wajibkan penyebutan (eksplisit)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Hanya pemilik yang dapat memicu di grup (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Aktivasi (khusus pemilik)

Pemilik grup dapat mengubah aktivasi per grup:

- `/activation mention`
- `/activation always`

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 bot itu sendiri jika tidak disetel). Kirim perintah sebagai pesan mandiri. Permukaan lain saat ini mengabaikan `/activation`.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pembatasan penyebutan)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Catatan khusus channel:

- BlueBubbles secara opsional dapat memperkaya peserta grup macOS yang tidak bernama dari basis data Kontak lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah pembatasan grup normal lolos.

Prompt sistem agen menyertakan pengantar grup pada giliran pertama sesi grup baru. Prompt ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi obrolan normal, serta menghindari mengetik urutan literal `\n`.

## Hal khusus iMessage

- Gunakan `chat_id:<id>` jika memungkinkan saat merutekan atau membuat allowlist.
- Daftar obrolan: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Hal khusus WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan penyebutan).
