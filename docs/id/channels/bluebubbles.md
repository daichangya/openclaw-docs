---
read_when:
    - Menyiapkan channel BlueBubbles
    - Memecahkan masalah pairing Webhook
    - Mengonfigurasi iMessage di macOS
summary: iMessage melalui server BlueBubbles macOS (REST kirim/terima, mengetik, reaksi, pairing, tindakan lanjutan).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-23T09:16:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1c1670bb453a1f78bb8e35e4b7065ceeba46ce93180e1288745621f8c4179c9
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Status: plugin bawaan yang berkomunikasi dengan server BlueBubbles macOS melalui HTTP. **Direkomendasikan untuk integrasi iMessage** karena API-nya lebih kaya dan penyiapannya lebih mudah dibandingkan channel imsg lama.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan BlueBubbles, jadi build paket normal tidak
memerlukan langkah `openclaw plugins install` terpisah.

## Ringkasan

- Berjalan di macOS melalui aplikasi helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Direkomendasikan/diuji: macOS Sequoia (15). macOS Tahoe (26) berfungsi; edit saat ini rusak di Tahoe, dan pembaruan ikon grup mungkin melaporkan berhasil tetapi tidak tersinkron.
- OpenClaw berkomunikasi dengannya melalui REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Pesan masuk diterima melalui webhook; balasan keluar, indikator mengetik, tanda baca, dan tapback adalah panggilan REST.
- Lampiran dan stiker dimasukkan sebagai media masuk (dan ditampilkan ke agent jika memungkinkan).
- Pairing/allowlist bekerja dengan cara yang sama seperti channel lain (`/channels/pairing` dll.) dengan `channels.bluebubbles.allowFrom` + kode pairing.
- Reaksi ditampilkan sebagai peristiwa sistem seperti Slack/Telegram sehingga agent dapat "menyebutnya" sebelum membalas.
- Fitur lanjutan: edit, batalkan kirim, threading balasan, efek pesan, manajemen grup.

## Mulai cepat

1. Instal server BlueBubbles di Mac Anda (ikuti petunjuk di [bluebubbles.app/install](https://bluebubbles.app/install)).
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

4. Arahkan webhook BlueBubbles ke Gateway Anda (contoh: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Mulai Gateway; Gateway akan mendaftarkan handler webhook dan memulai pairing.

Catatan keamanan:

- Selalu tetapkan kata sandi webhook.
- Autentikasi webhook selalu diperlukan. OpenClaw menolak permintaan webhook BlueBubbles kecuali permintaan tersebut menyertakan password/guid yang cocok dengan `channels.bluebubbles.password` (misalnya `?password=<password>` atau `x-password`), terlepas dari topologi loopback/proxy.
- Autentikasi kata sandi diperiksa sebelum membaca/mengurai seluruh isi webhook.

## Menjaga Messages.app tetap aktif (VM / penyiapan headless)

Beberapa penyiapan VM macOS / always-on dapat berakhir dengan Messages.app menjadi “idle” (peristiwa masuk berhenti sampai aplikasi dibuka/dibawa ke depan). Solusi sederhananya adalah **menyenggol Messages setiap 5 menit** menggunakan AppleScript + LaunchAgent.

### 1) Simpan AppleScript

Simpan ini sebagai:

- `~/Scripts/poke-messages.scpt`

Contoh skrip (non-interaktif; tidak mengambil fokus):

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
- Proses pertama kali mungkin memicu prompt **Automation** macOS (`osascript` → Messages). Setujui prompt tersebut di sesi pengguna yang sama yang menjalankan LaunchAgent.

Muat:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles tersedia di onboarding interaktif:

```
openclaw onboard
```

Wizard akan meminta:

- **Server URL** (wajib): alamat server BlueBubbles (misalnya, `http://192.168.1.100:1234`)
- **Password** (wajib): kata sandi API dari pengaturan BlueBubbles Server
- **Webhook path** (opsional): default ke `/bluebubbles-webhook`
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
- Pencarian hanya berjalan setelah akses grup, otorisasi perintah, dan pembatasan mention telah mengizinkan pesan untuk lolos.
- Hanya peserta telepon tanpa nama yang diperkaya.
- Nomor telepon mentah tetap digunakan sebagai fallback saat tidak ada kecocokan lokal yang ditemukan.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Pembatasan mention (grup)

BlueBubbles mendukung pembatasan mention untuk chat grup, selaras dengan perilaku iMessage/WhatsApp:

- Menggunakan `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`) untuk mendeteksi mention.
- Saat `requireMention` diaktifkan untuk sebuah grup, agent hanya merespons saat disebut.
- Perintah kontrol dari pengirim yang berwenang melewati pembatasan mention.

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

### Pembatasan perintah

- Perintah kontrol (misalnya, `/config`, `/model`) memerlukan otorisasi.
- Menggunakan `allowFrom` dan `groupAllowFrom` untuk menentukan otorisasi perintah.
- Pengirim yang berwenang dapat menjalankan perintah kontrol bahkan tanpa mention di grup.

### System prompt per grup

Setiap entri di bawah `channels.bluebubbles.groups.*` menerima string `systemPrompt` opsional. Nilai ini disuntikkan ke system prompt agent pada setiap giliran yang menangani pesan di grup tersebut, sehingga Anda dapat menetapkan persona atau aturan perilaku per grup tanpa mengedit prompt agent:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Jaga respons di bawah 3 kalimat. Cerminkan nada santai grup.",
        },
      },
    },
  },
}
```

Kuncinya cocok dengan apa pun yang BlueBubbles laporkan sebagai `chatGuid` / `chatIdentifier` / `chatId` numerik untuk grup tersebut, dan entri wildcard `"*"` menyediakan default untuk setiap grup tanpa kecocokan tepat (pola yang sama digunakan oleh `requireMention` dan kebijakan tool per grup). Kecocokan tepat selalu menang atas wildcard. DM mengabaikan bidang ini; gunakan kustomisasi prompt tingkat agent atau tingkat akun sebagai gantinya.

#### Contoh praktis: balasan berutas dan reaksi tapback (Private API)

Dengan BlueBubbles Private API diaktifkan, pesan masuk datang dengan ID pesan pendek (misalnya `[[reply_to:5]]`) dan agent dapat memanggil `action=reply` untuk membuat utas ke pesan tertentu atau `action=react` untuk menambahkan tapback. `systemPrompt` per grup adalah cara yang andal untuk menjaga agent memilih tool yang tepat:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Saat membalas di grup ini, selalu panggil action=reply dengan",
            "messageId [[reply_to:N]] dari konteks agar respons Anda berutas",
            "di bawah pesan pemicu. Jangan pernah mengirim pesan baru yang tidak terhubung.",
            "",
            "Untuk pengakuan singkat ('ok', 'mengerti', 'siap'), gunakan",
            "action=react dengan emoji tapback yang sesuai (❤️, 👍, 😂, ‼️, ❓)",
            "alih-alih mengirim balasan teks.",
          ].join(" "),
        },
      },
    },
  },
}
```

Reaksi tapback dan balasan berutas sama-sama memerlukan BlueBubbles Private API; lihat [Tindakan lanjutan](#advanced-actions) dan [ID Pesan](#message-ids-short-vs-full) untuk mekanisme dasarnya.

## Binding percakapan ACP

Chat BlueBubbles dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah lapisan transport.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM atau chat grup yang diizinkan.
- Pesan berikutnya dalam percakapan BlueBubbles yang sama dirutekan ke sesi ACP yang dibuat.
- `/new` dan `/reset` mereset sesi ACP yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Binding persisten yang dikonfigurasi juga didukung melalui entri tingkat atas `bindings[]` dengan `type: "acp"` dan `match.channel: "bluebubbles"`.

`match.peer.id` dapat menggunakan bentuk target BlueBubbles apa pun yang didukung:

- handle DM yang dinormalisasi seperti `+15555550123` atau `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Untuk binding grup yang stabil, pilih `chat_id:*` atau `chat_identifier:*`.

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
- **Indikator mengetik**: OpenClaw mengirim peristiwa mulai mengetik; BlueBubbles membersihkan status mengetik secara otomatis saat mengirim atau saat timeout (penghentian manual melalui DELETE tidak andal).

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
        setGroupIcon: true, // atur ikon/foto chat grup (kurang andal di macOS 26 Tahoe)
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

- **react**: Tambahkan/hapus reaksi tapback (`messageId`, `emoji`, `remove`). Set tapback asli iMessage adalah `love`, `like`, `dislike`, `laugh`, `emphasize`, dan `question`. Saat agent memilih emoji di luar set tersebut (misalnya `👀`), tool reaksi akan fallback ke `love` sehingga tapback tetap dirender alih-alih seluruh permintaan gagal. Reaksi ack yang dikonfigurasi tetap divalidasi secara ketat dan menghasilkan error pada nilai yang tidak dikenal.
- **edit**: Edit pesan terkirim (`messageId`, `text`)
- **unsend**: Batalkan kirim pesan (`messageId`)
- **reply**: Balas pesan tertentu (`messageId`, `text`, `to`)
- **sendWithEffect**: Kirim dengan efek iMessage (`text`, `to`, `effectId`)
- **renameGroup**: Ganti nama chat grup (`chatGuid`, `displayName`)
- **setGroupIcon**: Atur ikon/foto chat grup (`chatGuid`, `media`) — kurang andal di macOS 26 Tahoe (API mungkin mengembalikan sukses tetapi ikon tidak tersinkron).
- **addParticipant**: Tambahkan seseorang ke grup (`chatGuid`, `address`)
- **removeParticipant**: Hapus seseorang dari grup (`chatGuid`, `address`)
- **leaveGroup**: Keluar dari chat grup (`chatGuid`)
- **upload-file**: Kirim media/file (`to`, `buffer`, `filename`, `asVoice`)
  - Memo suara: tetapkan `asVoice: true` dengan audio **MP3** atau **CAF** untuk mengirim sebagai pesan suara iMessage. BlueBubbles mengonversi MP3 → CAF saat mengirim memo suara.
- Alias lama: `sendAttachment` masih berfungsi, tetapi `upload-file` adalah nama tindakan kanonis.

### ID Pesan (pendek vs penuh)

OpenClaw dapat menampilkan ID pesan _pendek_ (misalnya, `1`, `2`) untuk menghemat token.

- `MessageSid` / `ReplyToId` dapat berupa ID pendek.
- `MessageSidFull` / `ReplyToIdFull` berisi ID penuh provider.
- ID pendek berada di memori; ID tersebut dapat kedaluwarsa saat restart atau pengosongan cache.
- Tindakan menerima `messageId` pendek atau penuh, tetapi ID pendek akan menghasilkan error jika tidak lagi tersedia.

Gunakan ID penuh untuk otomasi dan penyimpanan yang tahan lama:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Konteks: `MessageSidFull` / `ReplyToIdFull` dalam payload masuk

Lihat [Configuration](/id/gateway/configuration) untuk variabel template.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Menggabungkan split-send DM (perintah + URL dalam satu komposisi)

Saat pengguna mengetik perintah dan URL bersama di iMessage — misalnya `Dump https://example.com/article` — Apple membagi pengiriman menjadi **dua pengiriman webhook terpisah**:

1. Pesan teks (`"Dump"`).
2. Balon pratinjau URL (`"https://..."`) dengan gambar pratinjau OG sebagai lampiran.

Kedua webhook tiba di OpenClaw dengan selang ~0,8-2,0 dtk pada sebagian besar penyiapan. Tanpa penggabungan, agent menerima perintah saja pada giliran 1, membalas (sering kali "kirim URL-nya"), dan baru melihat URL pada giliran 2 — ketika konteks perintah sudah hilang.

`channels.bluebubbles.coalesceSameSenderDms` mengikutsertakan DM agar webhook berurutan dari pengirim yang sama digabungkan menjadi satu giliran agent. Chat grup tetap menggunakan kunci per pesan sehingga struktur giliran multi-pengguna tetap terjaga.

### Kapan diaktifkan

Aktifkan ketika:

- Anda menyediakan Skills yang mengharapkan `perintah + payload` dalam satu pesan (dump, paste, save, queue, dll.).
- Pengguna Anda menempelkan URL, gambar, atau konten panjang bersama perintah.
- Anda dapat menerima latensi giliran DM tambahan (lihat di bawah).

Biarkan nonaktif ketika:

- Anda memerlukan latensi perintah minimum untuk pemicu DM satu kata.
- Semua alur Anda adalah perintah sekali jalan tanpa payload lanjutan.

### Mengaktifkan

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // ikut serta (default: false)
    },
  },
}
```

Dengan flag aktif dan tanpa `messages.inbound.byChannel.bluebubbles` yang eksplisit, jendela debounce melebar menjadi **2500 md** (default untuk non-penggabungan adalah 500 md). Jendela yang lebih lebar ini diperlukan — ritme split-send Apple sebesar 0,8-2,0 dtk tidak muat dalam default yang lebih sempit.

Untuk menyesuaikan jendela sendiri:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 md bekerja untuk sebagian besar penyiapan; naikkan ke 4000 md jika Mac Anda lambat
        // atau berada di bawah tekanan memori (selang yang diamati bisa melewati 2 dtk saat itu).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Trade-off

- **Latensi tambahan untuk perintah kontrol DM.** Dengan flag aktif, pesan perintah kontrol DM (seperti `Dump`, `Save`, dll.) sekarang menunggu hingga jendela debounce sebelum dikirim, untuk berjaga-jaga jika webhook payload akan datang. Perintah chat grup tetap dikirim seketika.
- **Output gabungan memiliki batas** — teks gabungan dibatasi hingga 4000 karakter dengan penanda `…[truncated]` yang eksplisit; lampiran dibatasi hingga 20; entri sumber dibatasi hingga 10 (entri pertama-plus-terbaru dipertahankan setelah itu). Setiap `messageId` sumber tetap masuk ke inbound-dedupe sehingga replay MessagePoller berikutnya dari peristiwa individual apa pun dikenali sebagai duplikat.
- **Opt-in, per channel.** Channel lain (Telegram, WhatsApp, Slack, …) tidak terpengaruh.

### Skenario dan apa yang dilihat agent

| Yang disusun pengguna                                             | Yang dikirim Apple         | Flag mati (default)                     | Flag aktif + jendela 2500 md                                            |
| ----------------------------------------------------------------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (satu kali kirim)                      | 2 webhook selang ~1 dtk    | Dua giliran agent: "Dump" saja, lalu URL | Satu giliran: teks gabungan `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (lampiran + teks)                 | 2 webhook                  | Dua giliran                             | Satu giliran: teks + gambar                                              |
| `/status` (perintah mandiri)                                      | 1 webhook                  | Langsung dikirim                        | **Menunggu hingga jendela, lalu dikirim**                                |
| URL ditempelkan sendiri                                           | 1 webhook                  | Langsung dikirim                        | Langsung dikirim (hanya satu entri di bucket)                            |
| Teks + URL dikirim sebagai dua pesan terpisah yang disengaja, selang beberapa menit | 2 webhook di luar jendela  | Dua giliran                             | Dua giliran (jendela kedaluwarsa di antaranya)                           |
| Banjir cepat (>10 DM kecil dalam jendela)                         | N webhook                  | N giliran                               | Satu giliran, output dibatasi (pertama + terbaru, batas teks/lampiran diterapkan) |

### Pemecahan masalah penggabungan split-send

Jika flag aktif dan split-send masih tiba sebagai dua giliran, periksa setiap lapisan:

1. **Konfigurasi benar-benar dimuat.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Lalu `openclaw gateway restart` — flag dibaca saat pembuatan registri debouncer.

2. **Jendela debounce cukup lebar untuk penyiapan Anda.** Lihat log server BlueBubbles di `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Ukur selang antara pengiriman teks bergaya `"Dump"` dan pengiriman `"https://..."; Attachments:` yang mengikutinya. Naikkan `messages.inbound.byChannel.bluebubbles` agar cukup menutupi selang tersebut.

3. **Stempel waktu JSONL sesi ≠ kedatangan webhook.** Stempel waktu peristiwa sesi (`~/.openclaw/agents/<id>/sessions/*.jsonl`) mencerminkan kapan Gateway menyerahkan pesan ke agent, **bukan** kapan webhook tiba. Pesan kedua yang antre dengan tag `[Queued messages while agent was busy]` berarti giliran pertama masih berjalan saat webhook kedua tiba — bucket penggabungan sudah lebih dulu flush. Sesuaikan jendela berdasarkan log server BB, bukan log sesi.

4. **Tekanan memori memperlambat pengiriman balasan.** Pada mesin yang lebih kecil (8 GB), giliran agent dapat memakan waktu cukup lama sehingga bucket penggabungan flush sebelum balasan selesai, dan URL masuk sebagai giliran kedua yang antre. Periksa `memory_pressure` dan `ps -o rss -p $(pgrep openclaw-gateway)`; jika Gateway berada di atas ~500 MB RSS dan compressor aktif, tutup proses berat lainnya atau pindah ke host yang lebih besar.

5. **Pengiriman kutipan balasan adalah jalur yang berbeda.** Jika pengguna mengetuk `Dump` sebagai **balasan** ke balon URL yang ada (iMessage menampilkan badge "1 Reply" pada gelembung Dump), URL berada di `replyToBody`, bukan di webhook kedua. Penggabungan tidak berlaku — itu adalah urusan skill/prompt, bukan urusan debouncer.

## Streaming blok

Kontrol apakah respons dikirim sebagai satu pesan atau di-stream dalam blok:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // aktifkan streaming blok (mati secara default)
    },
  },
}
```

## Media + batas

- Lampiran masuk diunduh dan disimpan di cache media.
- Batas media melalui `channels.bluebubbles.mediaMaxMb` untuk media masuk dan keluar (default: 8 MB).
- Teks keluar dipotong menjadi `channels.bluebubbles.textChunkLimit` (default: 4000 karakter).

## Referensi konfigurasi

Konfigurasi lengkap: [Configuration](/id/gateway/configuration)

Opsi provider:

- `channels.bluebubbles.enabled`: Aktifkan/nonaktifkan channel.
- `channels.bluebubbles.serverUrl`: URL dasar REST API BlueBubbles.
- `channels.bluebubbles.password`: Kata sandi API.
- `channels.bluebubbles.webhookPath`: Jalur endpoint Webhook (default: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (default: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlist DM (handle, email, nomor E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (default: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlist pengirim grup.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Di macOS, secara opsional perkaya peserta grup tanpa nama dari Contacts lokal setelah gating lolos. Default: `false`.
- `channels.bluebubbles.groups`: Konfigurasi per grup (`requireMention`, dll.).
- `channels.bluebubbles.sendReadReceipts`: Kirim tanda baca (default: `true`).
- `channels.bluebubbles.blockStreaming`: Aktifkan streaming blok (default: `false`; diperlukan untuk balasan streaming).
- `channels.bluebubbles.textChunkLimit`: Ukuran chunk keluar dalam karakter (default: 4000).
- `channels.bluebubbles.sendTimeoutMs`: Timeout per permintaan dalam md untuk pengiriman teks keluar melalui `/api/v1/message/text` (default: 30000). Naikkan pada penyiapan macOS 26 tempat pengiriman iMessage Private API dapat macet selama 60+ detik di dalam framework iMessage; misalnya `45000` atau `60000`. Probe, pencarian chat, reaksi, edit, dan pemeriksaan kesehatan saat ini tetap menggunakan default 10 dtk yang lebih pendek; perluasan cakupan ke reaksi dan edit direncanakan sebagai tindak lanjut. Override per akun: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (default) hanya membagi saat melebihi `textChunkLimit`; `newline` membagi pada baris kosong (batas paragraf) sebelum chunking berdasarkan panjang.
- `channels.bluebubbles.mediaMaxMb`: Batas media masuk/keluar dalam MB (default: 8).
- `channels.bluebubbles.mediaLocalRoots`: allowlist eksplisit direktori lokal absolut yang diizinkan untuk jalur media lokal keluar. Pengiriman jalur lokal ditolak secara default kecuali ini dikonfigurasi. Override per akun: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Gabungkan webhook DM berurutan dari pengirim yang sama menjadi satu giliran agent sehingga split-send teks+URL Apple tiba sebagai satu pesan (default: `false`). Lihat [Menggabungkan split-send DM](#coalescing-split-send-dms-command--url-in-one-composition) untuk skenario, penyesuaian jendela, dan trade-off. Memperlebar jendela debounce masuk default dari 500 md menjadi 2500 md saat diaktifkan tanpa `messages.inbound.byChannel.bluebubbles` yang eksplisit.
- `channels.bluebubbles.historyLimit`: Maksimum pesan grup untuk konteks (0 menonaktifkan).
- `channels.bluebubbles.dmHistoryLimit`: Batas riwayat DM.
- `channels.bluebubbles.actions`: Aktifkan/nonaktifkan tindakan tertentu.
- `channels.bluebubbles.accounts`: Konfigurasi multi-akun.

Opsi global terkait:

- `agents.list[].groupChat.mentionPatterns` (atau `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Pengalamatan / target pengiriman

Pilih `chat_guid` untuk perutean yang stabil:

- `chat_guid:iMessage;-;+15555550123` (disarankan untuk grup)
- `chat_id:123`
- `chat_identifier:...`
- Handle langsung: `+15555550123`, `user@example.com`
  - Jika handle langsung tidak memiliki chat DM yang sudah ada, OpenClaw akan membuatnya melalui `POST /api/v1/chat/new`. Ini memerlukan BlueBubbles Private API diaktifkan.

### Perutean iMessage vs SMS

Saat handle yang sama memiliki chat iMessage dan chat SMS di Mac (misalnya nomor telepon yang terdaftar di iMessage tetapi juga menerima fallback gelembung hijau), OpenClaw memilih chat iMessage dan tidak pernah diam-diam menurunkan ke SMS. Untuk memaksa chat SMS, gunakan prefiks target `sms:` yang eksplisit (misalnya `sms:+15555550123`). Handle tanpa chat iMessage yang cocok tetap mengirim melalui chat apa pun yang dilaporkan BlueBubbles.

## Keamanan

- Permintaan Webhook diautentikasi dengan membandingkan parameter kueri atau header `guid`/`password` terhadap `channels.bluebubbles.password`.
- Jaga kerahasiaan kata sandi API dan endpoint webhook (perlakukan seperti kredensial).
- Tidak ada bypass localhost untuk autentikasi webhook BlueBubbles. Jika Anda mem-proxy trafik webhook, pertahankan kata sandi BlueBubbles pada permintaan secara end-to-end. `gateway.trustedProxies` tidak menggantikan `channels.bluebubbles.password` di sini. Lihat [Keamanan Gateway](/id/gateway/security#reverse-proxy-configuration).
- Aktifkan HTTPS + aturan firewall pada server BlueBubbles jika mengeksposnya di luar LAN Anda.

## Pemecahan masalah

- Jika peristiwa mengetik/baca berhenti berfungsi, periksa log webhook BlueBubbles dan verifikasi jalur Gateway cocok dengan `channels.bluebubbles.webhookPath`.
- Kode pairing kedaluwarsa setelah satu jam; gunakan `openclaw pairing list bluebubbles` dan `openclaw pairing approve bluebubbles <code>`.
- Reaksi memerlukan BlueBubbles private API (`POST /api/v1/message/react`); pastikan versi server mengeksposnya.
- Edit/batalkan kirim memerlukan macOS 13+ dan versi server BlueBubbles yang kompatibel. Di macOS 26 (Tahoe), edit saat ini rusak karena perubahan private API.
- Pembaruan ikon grup dapat kurang andal di macOS 26 (Tahoe): API mungkin mengembalikan sukses tetapi ikon baru tidak tersinkron.
- OpenClaw otomatis menyembunyikan tindakan yang diketahui rusak berdasarkan versi macOS server BlueBubbles. Jika edit masih muncul di macOS 26 (Tahoe), nonaktifkan secara manual dengan `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` diaktifkan tetapi split-send (misalnya `Dump` + URL) masih tiba sebagai dua giliran: lihat checklist [pemecahan masalah penggabungan split-send](#split-send-coalescing-troubleshooting) — penyebab umumnya adalah jendela debounce yang terlalu sempit, stempel waktu log sesi yang salah dibaca sebagai kedatangan webhook, atau pengiriman reply-quote (yang menggunakan `replyToBody`, bukan webhook kedua).
- Untuk info status/kesehatan: `openclaw status --all` atau `openclaw status --deep`.

Untuk referensi alur kerja channel umum, lihat panduan [Channels](/id/channels) dan [Plugins](/id/tools/plugin).

## Terkait

- [Ringkasan Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
