---
read_when:
    - Mengubah perutean saluran atau perilaku kotak masuk
summary: Aturan perutean per saluran (WhatsApp, Telegram, Discord, Slack) dan konteks bersama
title: Perutean Saluran
x-i18n:
    generated_at: "2026-04-23T09:16:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad1101d9d3411d9e9f48efd14c0dab09d76e83a6bd93c713d38efc01a14c8391
    source_path: channels/channel-routing.md
    workflow: 15
---

# Saluran & perutean

OpenClaw merutekan balasan **kembali ke saluran asal pesan masuk**. Model
tidak memilih saluran; perutean bersifat deterministik dan dikendalikan oleh
konfigurasi host.

## Istilah kunci

- **Saluran**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, ditambah saluran Plugin. `webchat` adalah saluran UI WebChat internal dan bukan saluran keluar yang dapat dikonfigurasi.
- **AccountId**: instans akun per saluran (jika didukung).
- Akun default saluran opsional: `channels.<channel>.defaultAccount` memilih
  akun mana yang digunakan ketika jalur keluar tidak menentukan `accountId`.
  - Dalam penyiapan multi-akun, tetapkan default eksplisit (`defaultAccount` atau `accounts.default`) saat dua atau lebih akun dikonfigurasi. Tanpanya, perutean fallback dapat memilih ID akun ternormalisasi pertama.
- **AgentId**: workspace + penyimpanan sesi terisolasi (“otak”).
- **SessionKey**: kunci bucket yang digunakan untuk menyimpan konteks dan mengendalikan konkurensi.

## Bentuk kunci sesi (contoh)

Pesan langsung diciutkan ke sesi **main** agent secara default:

- `agent:<agentId>:<mainKey>` (default: `agent:main:main`)

Bahkan ketika riwayat percakapan pesan langsung dibagikan dengan main, sandbox dan
kebijakan tool menggunakan kunci runtime obrolan langsung per-akun turunan untuk DM eksternal
agar pesan yang berasal dari saluran tidak diperlakukan seperti eksekusi sesi main lokal.

Grup dan saluran tetap terisolasi per saluran:

- Grup: `agent:<agentId>:<channel>:group:<id>`
- Saluran/ruang: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- Thread Slack/Discord menambahkan `:thread:<threadId>` ke kunci dasar.
- Topik forum Telegram menyematkan `:topic:<topicId>` dalam kunci grup.

Contoh:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Penyematan rute DM main

Saat `session.dmScope` adalah `main`, pesan langsung dapat berbagi satu sesi main.
Untuk mencegah `lastRoute` sesi ditimpa oleh DM non-pemilik,
OpenClaw menyimpulkan pemilik yang disematkan dari `allowFrom` jika semua kondisi berikut benar:

- `allowFrom` memiliki tepat satu entri non-wildcard.
- Entri tersebut dapat dinormalisasi menjadi ID pengirim konkret untuk saluran itu.
- Pengirim DM masuk tidak cocok dengan pemilik yang disematkan itu.

Dalam kasus ketidakcocokan tersebut, OpenClaw tetap mencatat metadata sesi masuk, tetapi
melewati pembaruan `lastRoute` sesi main.

## Aturan perutean (bagaimana agent dipilih)

Perutean memilih **satu agent** untuk setiap pesan masuk:

1. **Kecocokan peer persis** (`bindings` dengan `peer.kind` + `peer.id`).
2. **Kecocokan peer induk** (pewarisan thread).
3. **Kecocokan guild + role** (Discord) melalui `guildId` + `roles`.
4. **Kecocokan guild** (Discord) melalui `guildId`.
5. **Kecocokan tim** (Slack) melalui `teamId`.
6. **Kecocokan akun** (`accountId` pada saluran).
7. **Kecocokan saluran** (akun apa pun pada saluran itu, `accountId: "*"`).
8. **Agent default** (`agents.list[].default`, jika tidak maka entri daftar pertama, fallback ke `main`).

Saat sebuah binding menyertakan beberapa field kecocokan (`peer`, `guildId`, `teamId`, `roles`), **semua field yang diberikan harus cocok** agar binding tersebut berlaku.

Agent yang cocok menentukan workspace dan penyimpanan sesi mana yang digunakan.

## Grup siaran (jalankan beberapa agent)

Grup siaran memungkinkan Anda menjalankan **beberapa agent** untuk peer yang sama **ketika OpenClaw biasanya akan membalas** (misalnya: dalam grup WhatsApp, setelah penyebutan/gating aktivasi).

Konfigurasi:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Lihat: [Grup Siaran](/id/channels/broadcast-groups).

## Ikhtisar konfigurasi

- `agents.list`: definisi agent bernama (workspace, model, dll.).
- `bindings`: memetakan saluran/akun/peer masuk ke agent.

Contoh:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Penyimpanan sesi

Penyimpanan sesi berada di bawah direktori state (default `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip JSONL berada berdampingan dengan penyimpanan

Anda dapat mengganti jalur penyimpanan melalui `session.store` dan templating `{agentId}`.

Penemuan sesi Gateway dan ACP juga memindai penyimpanan agent berbasis disk di bawah
root `agents/` default dan di bawah root `session.store` bertemplate. Penyimpanan yang ditemukan
harus tetap berada di dalam root agent yang telah di-resolve tersebut dan menggunakan file
`sessions.json` biasa. Symlink dan jalur di luar root diabaikan.

## Perilaku WebChat

WebChat terpasang ke **agent yang dipilih** dan secara default ke
sesi main agent. Karena itu, WebChat memungkinkan Anda melihat konteks lintas saluran untuk
agent tersebut di satu tempat.

## Konteks balasan

Balasan masuk mencakup:

- `ReplyToId`, `ReplyToBody`, dan `ReplyToSender` jika tersedia.
- Konteks kutipan ditambahkan ke `Body` sebagai blok `[Replying to ...]`.

Ini konsisten di seluruh saluran.
