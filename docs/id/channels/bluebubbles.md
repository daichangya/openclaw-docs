---
read_when:
    - Menyiapkan channel BlueBubbles
    - Pemecahan masalah pairing Webhook
    - Mengonfigurasi iMessage di macOS
summary: iMessage melalui server macOS BlueBubbles (REST kirim/terima, mengetik, reaksi, pairing, tindakan lanjutan).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-22T04:19:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Status: plugin bawaan yang berkomunikasi dengan server macOS BlueBubbles melalui HTTP. **Direkomendasikan untuk integrasi iMessage** karena API-nya lebih kaya dan penyiapannya lebih mudah dibandingkan channel imsg lama.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan BlueBubbles, jadi build paket normal tidak
memerlukan langkah `openclaw plugins install` terpisah.

## Gambaran umum

- Berjalan di macOS melalui aplikasi helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Direkomendasikan/diuji: macOS Sequoia (15). macOS Tahoe (26) berfungsi; edit saat ini rusak di Tahoe, dan pembaruan ikon grup mungkin melaporkan berhasil tetapi tidak tersinkron.
- OpenClaw berkomunikasi dengannya melalui REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Pesan masuk datang melalui Webhook; balasan keluar, indikator mengetik, tanda baca, dan tapback adalah panggilan REST.
- Lampiran dan stiker diserap sebagai media masuk (dan ditampilkan ke agent bila memungkinkan).
- Pairing/allowlist bekerja sama seperti channel lain (`/channels/pairing` dan seterusnya) dengan `channels.bluebubbles.allowFrom` + kode pairing.
- Reaksi ditampilkan sebagai event sistem seperti Slack/Telegram sehingga agent dapat "menyebut"nya sebelum membalas.
- Fitur lanjutan: edit, batalkan kirim, thread balasan, efek pesan, manajemen grup.

## Mulai cepat

1. Instal server BlueBubbles di Mac Anda (ikuti instruksi di [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Di konfigurasi BlueBubbles, aktifkan web API dan tetapkan kata sandi.
3. Jalankan `openclaw onboard` dan pilih BlueBubbles, atau konfigurasi secara manual:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Arahkan Webhook BlueBubbles ke gateway Anda (contoh: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Mulai gateway; gateway akan mendaftarkan handler Webhook dan memulai pairing.

Catatan keamanan:

- Selalu tetapkan kata sandi Webhook.
- Autentikasi Webhook selalu wajib. OpenClaw menolak permintaan Webhook BlueBubbles kecuali permintaan tersebut menyertakan password/guid yang cocok dengan `channels.bluebubbles.password` (misalnya `?password=<password>` atau `x-password`), terlepas dari topologi loopback/proxy.
- Autentikasi kata sandi diperiksa sebelum membaca/mengurai seluruh body Webhook.

## Menjaga Messages.app tetap aktif (VM / penyiapan headless)

Beberapa penyiapan macOS VM / selalu aktif dapat membuat Messages.app menjadi “idle” (event masuk berhenti sampai aplikasi dibuka/dibawa ke foreground). Solusi sederhana adalah **menyentuh Messages setiap 5 menit** menggunakan AppleScript + LaunchAgent.

### 1) Simpan AppleScript

Simpan ini sebagai:

- `~/Scripts/poke-messages.scpt`

Contoh skrip (non-interaktif; tidak mencuri fokus):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Instal LaunchAgent

Simpan ini sebagai:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Catatan:

- Ini berjalan **setiap 300 detik** dan **saat login**.
- Eksekusi pertama dapat memicu prompt **Automation** macOS (`osascript` → Messages). Setujui prompt tersebut dalam sesi pengguna yang sama yang menjalankan LaunchAgent.

Muat:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles tersedia dalam onboarding interaktif:

```
openclaw onboard
```

Wizard akan meminta:

- **URL Server** (wajib): alamat server BlueBubbles (mis., `http://192.168.1.100:1234`)
- **Password** (wajib): kata sandi API dari pengaturan BlueBubbles Server
- **Jalur Webhook** (opsional): default ke `/bluebubbles-webhook`
- **Kebijakan DM**: pairing, allowlist, open, atau disabled
- **Daftar izin**: nomor telepon, email, atau target chat

Anda juga dapat menambahkan BlueBubbles melalui CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kontrol akses (DM + grup)

DM:

- Default: `channels.bluebubbles.dmPolicy = "pairing"`.
- Pengirim yang tidak dikenal menerima kode pairing; pesan diabaikan sampai disetujui (kode kedaluwarsa setelah 1 jam).
- Setujui melalui:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Pairing adalah pertukaran token default. Detail: [Pairing](/id/channels/pairing)

Grup:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (default: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` mengontrol siapa yang dapat memicu di grup saat `allowlist` ditetapkan.

### Pengayaan nama kontak (macOS, opsional)

Webhook grup BlueBubbles sering kali hanya menyertakan alamat peserta mentah. Jika Anda ingin konteks `GroupMembers` menampilkan nama kontak lokal sebagai gantinya, Anda dapat mengaktifkan pengayaan Contacts lokal di macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` mengaktifkan pencarian. Default: `false`.
- Pencarian hanya berjalan setelah akses grup, otorisasi perintah, dan gating mention mengizinkan pesan tersebut lewat.
- Hanya peserta telepon tanpa nama yang diperkaya.
- Nomor telepon mentah tetap menjadi fallback bila tidak ditemukan kecocokan lokal.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Gating mention (grup)

BlueBubbles mendukung gating mention untuk chat grup, mengikuti perilaku iMessage/WhatsApp:

- Menggunakan `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`) untuk mendeteksi mention.
- Saat `requireMention` diaktifkan untuk sebuah grup, agent hanya merespons saat disebut.
- Perintah kontrol dari pengirim yang berwenang melewati gating mention.

Konfigurasi per grup:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default untuk semua grup
        "iMessage;-;chat123": { requireMention: false }, // override untuk grup tertentu
      },
    },
  },
}
```

### Gating perintah

- Perintah kontrol (mis., `/config`, `/model`) memerlukan otorisasi.
- Menggunakan `allowFrom` dan `groupAllowFrom` untuk menentukan otorisasi perintah.
- Pengirim yang berwenang dapat menjalankan perintah kontrol bahkan tanpa mention di grup.

### System prompt per grup

Setiap entri di bawah `channels.bluebubbles.groups.*` menerima string `systemPrompt` opsional. Nilainya disuntikkan ke system prompt agent pada setiap giliran yang menangani pesan di grup tersebut, sehingga Anda dapat menetapkan persona atau aturan perilaku per grup tanpa mengedit prompt agent:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Buat respons maksimal 3 kalimat. Samakan nada santai grup ini.",
        },
      },
    },
  },
}
```

Kuncinya cocok dengan apa pun yang dilaporkan BlueBubbles sebagai `chatGuid` / `chatIdentifier` / `chatId` numerik untuk grup tersebut, dan entri wildcard `"*"` menyediakan default untuk setiap grup tanpa kecocokan persis (pola yang sama digunakan oleh `requireMention` dan kebijakan tool per grup). Kecocokan persis selalu menang atas wildcard. DM mengabaikan field ini; gunakan penyesuaian prompt tingkat agent atau tingkat akun sebagai gantinya.

#### Contoh praktik: balasan berulir dan reaksi tapback (Private API)

Dengan BlueBubbles Private API diaktifkan, pesan masuk tiba dengan ID pesan pendek (misalnya `[[reply_to:5]]`) dan agent dapat memanggil `action=reply` untuk membuat thread ke pesan tertentu atau `action=react` untuk menambahkan tapback. `systemPrompt` per grup adalah cara andal untuk membuat agent memilih tool yang tepat:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Saat membalas di grup ini, selalu panggil action=reply dengan",
            "messageId [[reply_to:N]] dari konteks agar respons Anda berulir",
            "di bawah pesan yang memicu. Jangan pernah kirim pesan baru yang tidak tertaut.",
            "",
            "Untuk pengakuan singkat ('ok', 'paham', 'siap'), gunakan",
            "action=react dengan emoji tapback yang sesuai (❤️, 👍, 😂, ‼️, ❓)",
            "alih-alih mengirim balasan teks.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reaksi tapback dan balasan berulir sama-sama memerlukan BlueBubbles Private API; lihat [Tindakan lanjutan](#advanced-actions) dan [ID pesan](#message-ids-short-vs-full) untuk mekanisme dasarnya.

## Binding percakapan ACP

Chat BlueBubbles dapat diubah menjadi workspace ACP yang persisten tanpa mengubah lapisan transport.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan BlueBubbles yang sama diarahkan ke sesi ACP yang di-spawn.
- `/new` dan `/reset` mereset sesi ACP yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi juga didukung melalui entri `bindings[]` tingkat atas dengan `type: "acp"` dan `match.channel: "bluebubbles"`.

`match.peer.id` dapat menggunakan bentuk target BlueBubbles apa pun yang didukung:

- handle DM yang dinormalisasi seperti `+15555550123` atau `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Untuk binding grup yang stabil, gunakan `chat_id:*` atau `chat_identifier:*`.

Contoh:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Lihat [ACP Agents](/id/tools/acp-agents) untuk perilaku binding ACP bersama.

## Mengetik + tanda baca

- **Indikator mengetik**: Dikirim secara otomatis sebelum dan selama pembuatan respons.
- **Tanda baca**: Dikontrol oleh `channels.bluebubbles.sendReadReceipts` (default: `true`).
- **Indikator mengetik**: OpenClaw mengirim event mulai mengetik; BlueBubbles membersihkan status mengetik secara otomatis saat pengiriman atau timeout (stop manual melalui DELETE tidak andal).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // nonaktifkan tanda baca
    },
  },
}
```

## Tindakan lanjutan

BlueBubbles mendukung tindakan pesan lanjutan saat diaktifkan dalam konfigurasi:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback (default: true)
        edit: true, // edit pesan terkirim (macOS 13+, rusak di macOS 26 Tahoe)
        unsend: true, // batalkan kirim pesan (macOS 13+)
        reply: true, // threading balasan berdasarkan GUID pesan
        sendWithEffect: true, // efek pesan (slam, loud, dll.)
        renameGroup: true, // ganti nama chat grup
        setGroupIcon: true, // atur ikon/foto chat grup (tidak stabil di macOS 26 Tahoe)
        addParticipant: true, // tambahkan peserta ke grup
        removeParticipant: true, // hapus peserta dari grup
        leaveGroup: true, // keluar dari chat grup
        sendAttachment: true, // kirim lampiran/media
      },
    },
  },
}
```

Tindakan yang tersedia:

- **react**: Tambah/hapus reaksi tapback (`messageId`, `emoji`, `remove`). Kumpulan tapback bawaan iMessage adalah `love`, `like`, `dislike`, `laugh`, `emphasize`, dan `question`. Saat agent memilih emoji di luar kumpulan tersebut (misalnya `👀`), tool reaction akan fallback ke `love` agar tapback tetap dirender alih-alih membuat seluruh permintaan gagal. Reaksi ack yang dikonfigurasi tetap divalidasi secara ketat dan akan error pada nilai yang tidak dikenal.
- **edit**: Edit pesan terkirim (`messageId`, `text`)
- **unsend**: Batalkan kirim pesan (`messageId`)
- **reply**: Balas pesan tertentu (`messageId`, `text`, `to`)
- **sendWithEffect**: Kirim dengan efek iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Ganti nama chat grup (`chatGuid`, `displayName`)
- **setGroupIcon**: Atur ikon/foto chat grup (`chatGuid`, `media`) — tidak stabil di macOS 26 Tahoe (API dapat mengembalikan sukses tetapi ikon tidak tersinkron).
- **addParticipant**: Tambahkan seseorang ke grup (`chatGuid`, `address`)
- **removeParticipant**: Hapus seseorang dari grup (`chatGuid`, `address`)
- **leaveGroup**: Keluar dari chat grup (`chatGuid`)
- **upload-file**: Kirim media/file (`to`, `buffer`, `filename`, `asVoice`)
  - Memo suara: setel `asVoice: true` dengan audio **MP3** atau **CAF** untuk mengirim sebagai pesan suara iMessage. BlueBubbles mengonversi MP3 → CAF saat mengirim memo suara.
- Alias lama: `sendAttachment` masih berfungsi, tetapi `upload-file` adalah nama tindakan kanonis.

### ID pesan (pendek vs penuh)

OpenClaw dapat menampilkan ID pesan _pendek_ (mis., `1`, `2`) untuk menghemat token.

- `MessageSid` / `ReplyToId` dapat berupa ID pendek.
- `MessageSidFull` / `ReplyToIdFull` berisi ID penuh provider.
- ID pendek disimpan di memori; ID ini dapat kedaluwarsa saat restart atau cache eviction.
- Tindakan menerima `messageId` pendek atau penuh, tetapi ID pendek akan error jika sudah tidak tersedia.

Gunakan ID penuh untuk otomatisasi dan penyimpanan yang tahan lama:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Konteks: `MessageSidFull` / `ReplyToIdFull` dalam payload masuk

Lihat [Configuration](/id/gateway/configuration) untuk variabel template.

## Coalescing DM split-send (perintah + URL dalam satu komposisi)

Saat pengguna mengetik perintah dan URL bersama di iMessage — misalnya `Dump https://example.com/article` — Apple membagi pengiriman menjadi **dua pengiriman Webhook terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua Webhook tiba di OpenClaw dengan jeda sekitar ~0.8-2.0 dtk pada sebagian besar penyiapan. Tanpa coalescing, agent menerima perintah saja pada giliran 1, membalas (sering kali "kirim URL-nya"), dan baru melihat URL pada giliran 2 — pada titik itu konteks perintah sudah hilang.

`channels.bluebubbles.coalesceSameSenderDms` mengikutsertakan DM ke dalam penggabungan Webhook berurutan dari pengirim yang sama menjadi satu giliran agent. Chat grup tetap menggunakan kunci per pesan sehingga struktur giliran multi-pengguna tetap terjaga.

### Kapan harus diaktifkan

Aktifkan jika:

- Anda menyediakan Skills yang mengharapkan `command + payload` dalam satu pesan (dump, paste, save, queue, dll.).
- Pengguna Anda menempelkan URL, gambar, atau konten panjang bersama perintah.
- Anda dapat menerima tambahan latensi giliran DM (lihat di bawah).

Biarkan nonaktif jika:

- Anda memerlukan latensi perintah minimum untuk pemicu DM satu kata.
- Semua alur Anda berupa perintah one-shot tanpa payload lanjutan.

### Mengaktifkan

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // opt in (default: false)
    },
  },
}
```

Dengan flag ini aktif dan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit, jendela debounce melebar menjadi **2500 md** (default untuk non-coalescing adalah 500 md). Jendela yang lebih lebar ini diperlukan — ritme split-send Apple sebesar 0.8-2.0 dtk tidak muat dalam default yang lebih ketat.

Untuk menyesuaikan jendela sendiri:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 md berfungsi untuk sebagian besar penyiapan; naikkan ke 4000 md jika Mac Anda lambat
        // atau sedang di bawah tekanan memori (jeda yang diamati dapat melewati 2 dtk saat itu).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Trade-off

- **Latensi tambahan untuk perintah kontrol DM.** Saat flag ini aktif, pesan perintah kontrol DM (seperti `Dump`, `Save`, dll.) sekarang menunggu hingga jendela debounce sebelum dikirim, kalau-kalau Webhook payload akan datang. Perintah chat grup tetap dikirim seketika.
- **Output gabungan dibatasi** — teks gabungan dibatasi hingga 4000 karakter dengan penanda `…[truncated]` yang eksplisit; lampiran dibatasi hingga 20; entri sumber dibatasi hingga 10 (yang pertama-plus-terbaru dipertahankan setelah itu). Setiap `messageId` sumber tetap mencapai inbound-dedupe sehingga replay MessagePoller berikutnya dari event individual mana pun dikenali sebagai duplikat.
- **Opt-in, per channel.** Channel lain (Telegram, WhatsApp, Slack, …) tidak terpengaruh.

### Skenario dan apa yang dilihat agent

| Pengguna menulis                                                      | Apple mengirim            | Flag off (default)                      | Flag on + jendela 2500 md                                               |
| --------------------------------------------------------------------- | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (satu kali kirim)                          | 2 Webhook selisih ~1 dtk  | Dua giliran agent: "Dump" saja, lalu URL | Satu giliran: teks gabungan `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (lampiran + teks)                     | 2 Webhook                 | Dua giliran                             | Satu giliran: teks + gambar                                             |
| `/status` (perintah mandiri)                                          | 1 Webhook                 | Dikirim seketika                        | **Tunggu hingga jendela, lalu kirim**                                   |
| URL ditempel sendiri                                                  | 1 Webhook                 | Dikirim seketika                        | Dikirim seketika (hanya satu entri dalam bucket)                        |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, menit terpisah | 2 Webhook di luar jendela | Dua giliran                             | Dua giliran (jendela kedaluwarsa di antaranya)                          |
| Banjir cepat (>10 DM kecil dalam jendela)                             | N Webhook                 | N giliran                               | Satu giliran, output dibatasi (yang pertama + terbaru, batas teks/lampiran diterapkan) |

### Pemecahan masalah coalescing split-send

Jika flag aktif dan split-send masih tiba sebagai dua giliran, periksa setiap lapisan:

1. **Konfigurasi benar-benar dimuat.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Lalu `openclaw gateway restart` — flag dibaca saat pembuatan debouncer-registry.

2. **Jendela debounce cukup lebar untuk penyiapan Anda.** Lihat log server BlueBubbles di `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Ukur jeda antara pengiriman teks bergaya `"Dump"` dan pengiriman `"https://..."; Attachments:` yang mengikutinya. Naikkan `messages.inbound.byChannel.bluebubbles` agar nyaman mencakup jeda tersebut.

3. **Stempel waktu JSONL sesi ≠ kedatangan Webhook.** Stempel waktu event sesi (`~/.openclaw/agents/<id>/sessions/*.jsonl`) mencerminkan kapan gateway menyerahkan pesan ke agent, **bukan** kapan Webhook tiba. Pesan kedua yang diantrikan dan ditandai `[Queued messages while agent was busy]` berarti giliran pertama masih berjalan saat Webhook kedua tiba — bucket coalesce sudah ter-flush. Sesuaikan jendela berdasarkan log server BB, bukan log sesi.

4. **Tekanan memori memperlambat pengiriman balasan.** Pada mesin yang lebih kecil (8 GB), giliran agent dapat berlangsung cukup lama sehingga bucket coalesce ter-flush sebelum balasan selesai, dan URL masuk sebagai giliran kedua yang diantrikan. Periksa `memory_pressure` dan `ps -o rss -p $(pgrep openclaw-gateway)`; jika gateway berada di atas ~500 MB RSS dan compressor aktif, tutup proses berat lain atau pindah ke host yang lebih besar.

5. **Pengiriman reply-quote adalah jalur yang berbeda.** Jika pengguna mengetuk `Dump` sebagai **balasan** terhadap URL-balloon yang sudah ada (iMessage menampilkan lencana "1 Reply" pada bubble Dump), URL berada di `replyToBody`, bukan di Webhook kedua. Coalescing tidak berlaku — ini masalah skill/prompt, bukan masalah debouncer.

## Streaming blok

Kontrol apakah respons dikirim sebagai satu pesan atau di-stream dalam blok:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // aktifkan streaming blok (default nonaktif)
    },
  },
}
```

## Media + batas

- Lampiran masuk diunduh dan disimpan di cache media.
- Batas media melalui `channels.bluebubbles.mediaMaxMb` untuk media masuk dan keluar (default: 8 MB).
- Teks keluar dipecah ke `channels.bluebubbles.textChunkLimit` (default: 4000 karakter).

## Referensi konfigurasi

Konfigurasi lengkap: [Configuration](/id/gateway/configuration)

Opsi provider:

- `channels.bluebubbles.enabled`: Aktifkan/nonaktifkan channel.
- `channels.bluebubbles.serverUrl`: URL dasar REST API BlueBubbles.
- `channels.bluebubbles.password`: Kata sandi API.
- `channels.bluebubbles.webhookPath`: Jalur endpoint Webhook (default: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (default: `pairing`).
- `channels.bluebubbles.allowFrom`: Allowlist DM (handle, email, nomor E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (default: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Allowlist pengirim grup.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Di macOS, secara opsional memperkaya peserta grup tanpa nama dari Contacts lokal setelah gating lolos. Default: `false`.
- `channels.bluebubbles.groups`: Konfigurasi per grup (`requireMention`, dll.).
- `channels.bluebubbles.sendReadReceipts`: Kirim tanda baca (default: `true`).
- `channels.bluebubbles.blockStreaming`: Aktifkan streaming blok (default: `false`; wajib untuk balasan streaming).
- `channels.bluebubbles.textChunkLimit`: Ukuran chunk keluar dalam karakter (default: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Timeout per permintaan dalam md untuk pengiriman teks keluar melalui `/api/v1/message/text` (default: 30000). Naikkan pada penyiapan macOS 26 di mana pengiriman iMessage Private API dapat macet selama 60+ detik di dalam framework iMessage; misalnya `45000` atau `60000`. Probe, pencarian chat, reaksi, edit, dan pemeriksaan kesehatan saat ini tetap memakai default 10 dtk yang lebih pendek; perluasan cakupan ke reaksi dan edit direncanakan sebagai tindak lanjut. Override per akun: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (default) membagi hanya saat melebihi `textChunkLimit`; `newline` membagi pada baris kosong (batas paragraf) sebelum chunking berdasarkan panjang.
- `channels.bluebubbles.mediaMaxMb`: Batas media masuk/keluar dalam MB (default: 8).
- `channels.bluebubbles.mediaLocalRoots`: Allowlist eksplisit direktori lokal absolut yang diizinkan untuk jalur media lokal keluar. Pengiriman jalur lokal ditolak secara default kecuali ini dikonfigurasi. Override per akun: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Gabungkan Webhook DM berurutan dari pengirim yang sama menjadi satu giliran agent sehingga split-send teks+URL dari Apple tiba sebagai satu pesan (default: `false`). Lihat [Coalescing DM split-send](#coalescing-split-send-dms-command--url-in-one-composition) untuk skenario, penyesuaian jendela, dan trade-off. Memperlebar jendela debounce masuk default dari 500 md menjadi 2500 md saat diaktifkan tanpa `messages.inbound.byChannel.bluebubbles` eksplisit.
- `channels.bluebubbles.historyLimit`: Maks pesan grup untuk konteks (0 menonaktifkan).
- `channels.bluebubbles.dmHistoryLimit`: Batas riwayat DM.
- `channels.bluebubbles.actions`: Aktifkan/nonaktifkan tindakan tertentu.
- `channels.bluebubbles.accounts`: Konfigurasi multi-akun.

Opsi global terkait:

- `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Pengalamatan / target pengiriman

Utamakan `chat_guid` untuk routing yang stabil:

- `chat_guid:iMessage;-;+15555550123` (disarankan untuk grup)
- `chat_id:123`
- `chat_identifier:...`
- Handle langsung: `+15555550123`, `user@example.com`
  - Jika handle langsung tidak memiliki chat DM yang sudah ada, OpenClaw akan membuatnya melalui `POST /api/v1/chat/new`. Ini memerlukan BlueBubbles Private API diaktifkan.

### Routing iMessage vs SMS

Saat handle yang sama memiliki chat iMessage dan SMS di Mac (misalnya nomor telepon yang terdaftar di iMessage tetapi juga telah menerima fallback bubble hijau), OpenClaw mengutamakan chat iMessage dan tidak pernah diam-diam menurunkan ke SMS. Untuk memaksa chat SMS, gunakan prefiks target `sms:` yang eksplisit (misalnya `sms:+15555550123`). Handle tanpa chat iMessage yang cocok tetap dikirim melalui chat apa pun yang dilaporkan BlueBubbles.

## Keamanan

- Permintaan Webhook diautentikasi dengan membandingkan parameter query atau header `guid`/`password` terhadap `channels.bluebubbles.password`.
- Jaga kerahasiaan kata sandi API dan endpoint Webhook (perlakukan seperti kredensial).
- Tidak ada bypass localhost untuk autentikasi Webhook BlueBubbles. Jika Anda mem-proxy lalu lintas Webhook, pertahankan kata sandi BlueBubbles pada permintaan secara end-to-end. `gateway.trustedProxies` tidak menggantikan `channels.bluebubbles.password` di sini. Lihat [Keamanan Gateway](/id/gateway/security#reverse-proxy-configuration).
- Aktifkan HTTPS + aturan firewall pada server BlueBubbles jika diekspos di luar LAN Anda.

## Pemecahan masalah

- Jika event mengetik/baca berhenti berfungsi, periksa log Webhook BlueBubbles dan verifikasi jalur gateway cocok dengan `channels.bluebubbles.webhookPath`.
- Kode pairing kedaluwarsa setelah satu jam; gunakan `openclaw pairing list bluebubbles` dan `openclaw pairing approve bluebubbles <code>`.
- Reaksi memerlukan BlueBubbles private API (`POST /api/v1/message/react`); pastikan versi server mengeksposnya.
- Edit/unsend memerlukan macOS 13+ dan versi server BlueBubbles yang kompatibel. Pada macOS 26 (Tahoe), edit saat ini rusak karena perubahan private API.
- Pembaruan ikon grup dapat tidak stabil di macOS 26 (Tahoe): API dapat mengembalikan sukses tetapi ikon baru tidak tersinkron.
- OpenClaw secara otomatis menyembunyikan tindakan yang diketahui rusak berdasarkan versi macOS server BlueBubbles. Jika edit masih muncul di macOS 26 (Tahoe), nonaktifkan secara manual dengan `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` diaktifkan tetapi split-send (misalnya `Dump` + URL) masih tiba sebagai dua giliran: lihat checklist [pemecahan masalah coalescing split-send](#split-send-coalescing-troubleshooting) — penyebab umum adalah jendela debounce yang terlalu sempit, stempel waktu log sesi yang keliru dibaca sebagai kedatangan Webhook, atau pengiriman reply-quote (yang memakai `replyToBody`, bukan Webhook kedua).
- Untuk info status/kesehatan: `openclaw status --all` atau `openclaw status --deep`.

Untuk referensi alur kerja channel umum, lihat [Channels](/id/channels) dan panduan [Plugins](/id/tools/plugin).

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan gating mention
- [Channel Routing](/id/channels/channel-routing) — routing sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
