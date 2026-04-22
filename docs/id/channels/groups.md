---
read_when:
    - Mengubah perilaku obrolan grup atau pemfilteran penyebutan
summary: Perilaku obrolan grup di berbagai permukaan (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-04-22T04:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86e202c7e990e040eb092aaef46bc856ee8d39b2e5fe1c733e24f1b35faa824
    source_path: channels/groups.md
    workflow: 15
---

# Grup

OpenClaw menangani obrolan grup secara konsisten di berbagai permukaan: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw “hidup” di akun perpesanan Anda sendiri. Tidak ada pengguna bot WhatsApp yang terpisah.
Jika **Anda** berada dalam sebuah grup, OpenClaw dapat melihat grup itu dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan penyebutan kecuali Anda secara eksplisit menonaktifkan pemfilteran penyebutan.

Artinya: pengirim yang diizinkan dapat memicu OpenClaw dengan menyebutnya.

> Singkatnya
>
> - **Akses DM** dikendalikan oleh `*.allowFrom`.
> - **Akses grup** dikendalikan oleh `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
> - **Pemicu balasan** dikendalikan oleh pemfilteran penyebutan (`requireMention`, `/activation`).

Alur singkat (apa yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Visibilitas konteks dan allowlist

Dua kontrol yang berbeda terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist khusus kanal).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat thread, metadata terusan).

Secara default, OpenClaw memprioritaskan perilaku obrolan normal dan menjaga konteks sebagian besar tetap seperti diterima. Ini berarti allowlist terutama menentukan siapa yang dapat memicu tindakan, bukan batas penyuntingan universal untuk setiap kutipan atau cuplikan riwayat.

Perilaku saat ini bersifat khusus per kanal:

- Beberapa kanal sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan pada jalur tertentu (misalnya penyemaian thread Slack, lookup balasan/thread Matrix).
- Kanal lain masih meneruskan konteks kutipan/balasan/terusan sebagaimana diterima.

Arah penguatan (direncanakan):

- `contextVisibility: "all"` (default) mempertahankan perilaku saat ini sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan.
- `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

Sampai model penguatan ini diterapkan secara konsisten di semua kanal, perkirakan akan ada perbedaan antar permukaan.

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                       | Yang perlu diatur                                         |
| -------------------------------------------- | --------------------------------------------------------- |
| Mengizinkan semua grup tetapi hanya membalas pada @mention | `groups: { "*": { requireMention: true } }`               |
| Menonaktifkan semua balasan grup             | `groupPolicy: "disabled"`                                 |
| Hanya grup tertentu                          | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"`)   |
| Hanya Anda yang dapat memicu di grup         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (room/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Obrolan langsung menggunakan sesi utama (atau per-pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (agen tunggal)

Ya — ini bekerja dengan baik jika lalu lintas “pribadi” Anda adalah **DM** dan lalu lintas “publik” Anda adalah **grup**.

Alasannya: dalam mode agen tunggal, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap berjalan di host. Docker adalah backend default jika Anda tidak memilihnya.

Ini memberi Anda satu “otak” agen (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat penuh (host)
- **Grup**: sandbox + alat terbatas

> Jika Anda memerlukan workspace/persona yang benar-benar terpisah (“pribadi” dan “publik” tidak boleh pernah bercampur), gunakan agen kedua + binding. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent).

Contoh (DM di host, grup disandbox + alat khusus perpesanan):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Ingin “grup hanya dapat melihat folder X” alih-alih “tidak ada akses host”? Tetap gunakan `workspaceAccess: "none"` dan mount hanya path yang diizinkan ke dalam sandbox:

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

Kendalikan bagaimana pesan grup/room ditangani per kanal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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

| Kebijakan    | Perilaku                                                     |
| ------------ | ------------------------------------------------------------ |
| `"open"`     | Grup melewati allowlist; pemfilteran penyebutan tetap berlaku. |
| `"disabled"` | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"` | Hanya izinkan grup/room yang cocok dengan allowlist yang dikonfigurasi. |

Catatan:

- `groupPolicy` terpisah dari pemfilteran penyebutan (yang mengharuskan @mention).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (cadangan: `allowFrom` eksplisit).
- Persetujuan pairing DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit ke allowlist grup.
- Discord: allowlist menggunakan `channels.discord.guilds.<id>.channels`.
- Slack: allowlist menggunakan `channels.slack.channels`.
- Matrix: allowlist menggunakan `channels.matrix.groups`. Utamakan ID room atau alias; lookup nama room yang diikuti bersifat best-effort, dan nama yang tidak terselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; allowlist `users` per-room juga didukung.
- DM grup dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Allowlist Telegram dapat mencocokkan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau nama pengguna (`"@alice"` atau `"alice"`); prefix tidak peka huruf besar/kecil.
- Default adalah `groupPolicy: "allowlist"`; jika allowlist grup Anda kosong, pesan grup diblokir.
- Keamanan runtime: ketika sebuah blok penyedia benar-benar tidak ada (`channels.<provider>` tidak ada), kebijakan grup kembali ke mode fail-closed (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

Model mental singkat (urutan evaluasi untuk pesan grup):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlist grup (`*.groups`, `*.groupAllowFrom`, allowlist khusus kanal)
3. pemfilteran penyebutan (`requireMention`, `/activation`)

## Pemfilteran penyebutan (default)

Pesan grup memerlukan penyebutan kecuali dioverride per grup. Default berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai penyebutan implisit ketika kanal
mendukung metadata balasan. Mengutip pesan bot juga dapat dihitung sebagai
penyebutan implisit pada kanal yang mengekspos metadata kutipan. Kasus bawaan saat ini mencakup
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

- `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar/kecil; pola yang tidak valid dan bentuk nested-repetition yang tidak aman diabaikan.
- Permukaan yang menyediakan penyebutan eksplisit tetap lolos; pola adalah cadangan.
- Override per agen: `agents.list[].groupChat.mentionPatterns` (berguna saat beberapa agen berbagi satu grup).
- Pemfilteran penyebutan hanya diberlakukan ketika deteksi penyebutan dimungkinkan (penyebutan native atau `mentionPatterns` dikonfigurasi).
- Default Discord berada di `channels.discord.guilds."*"` (dapat dioverride per guild/channel).
- Konteks riwayat grup dibungkus secara seragam di semua kanal dan bersifat **pending-only** (pesan yang dilewati karena pemfilteran penyebutan); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk override. Setel `0` untuk menonaktifkan.

## Pembatasan alat grup/channel (opsional)

Beberapa konfigurasi kanal mendukung pembatasan alat mana yang tersedia **di dalam grup/room/channel tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup.
- `toolsBySender`: override per-pengirim di dalam grup.
  Gunakan prefix kunci eksplisit:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`.
  Kunci lama tanpa prefix masih diterima dan dicocokkan sebagai `id:` saja.

Urutan resolusi (yang paling spesifik menang):

1. kecocokan `toolsBySender` grup/channel
2. `tools` grup/channel
3. kecocokan `toolsBySender` default (`"*"` )
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

- Pembatasan alat grup/channel diterapkan sebagai tambahan terhadap kebijakan alat global/agen (penolakan tetap menang).
- Beberapa kanal menggunakan nesting yang berbeda untuk room/channel (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlist grup

Saat `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kuncinya bertindak sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku penyebutan default.

Kebingungan yang umum: persetujuan pairing DM tidak sama dengan otorisasi grup.
Untuk kanal yang mendukung pairing DM, penyimpanan pairing hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup yang eksplisit dari allowlist konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi yang terdokumentasi untuk kanal tersebut.

Tujuan umum (salin/tempel):

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

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri jika tidak disetel). Kirim perintah sebagai pesan mandiri. Permukaan lain saat ini mengabaikan `/activation`.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pemfilteran penyebutan)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Catatan khusus kanal:

- BlueBubbles secara opsional dapat memperkaya peserta grup macOS yang tidak bernama dari basis data Kontak lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah pemfilteran grup normal lolos.

System prompt agen menyertakan pengantar grup pada giliran pertama sesi grup baru. Ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi obrolan normal, serta menghindari mengetik urutan literal `\n`.

## Spesifik iMessage

- Utamakan `chat_id:<id>` saat merutekan atau menambahkan ke allowlist.
- Daftar obrolan: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## System prompt WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan system prompt WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, dan semantik override akun.

## Spesifik WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan penyebutan).
