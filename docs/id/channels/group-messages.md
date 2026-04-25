---
read_when:
    - Mengubah aturan pesan grup atau penyebutan
summary: Perilaku dan konfigurasi untuk penanganan pesan grup WhatsApp (`mentionPatterns` dibagikan di seluruh surface)
title: Pesan grup
x-i18n:
    generated_at: "2026-04-25T13:41:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

Tujuan: biarkan Clawd berada di grup WhatsApp, aktif hanya saat dipanggil, dan pisahkan thread itu dari sesi DM pribadi.

Catatan: `agents.list[].groupChat.mentionPatterns` sekarang juga digunakan oleh Telegram/Discord/Slack/iMessage; dokumen ini berfokus pada perilaku khusus WhatsApp. Untuk pengaturan multi-agen, setel `agents.list[].groupChat.mentionPatterns` per agen (atau gunakan `messages.groupChat.mentionPatterns` sebagai fallback global).

## Implementasi saat ini (2025-12-03)

- Mode aktivasi: `mention` (default) atau `always`. `mention` memerlukan ping (penyebutan @ WhatsApp nyata melalui `mentionedJids`, pola regex aman, atau E.164 bot di mana saja dalam teks). `always` membangunkan agen pada setiap pesan tetapi agen hanya boleh membalas saat dapat memberikan nilai yang bermakna; jika tidak, agen mengembalikan token senyap yang persis `NO_REPLY` / `no_reply`. Default dapat diatur di konfigurasi (`channels.whatsapp.groups`) dan dioverride per grup melalui `/activation`. Saat `channels.whatsapp.groups` diatur, ini juga berfungsi sebagai allowlist grup (sertakan `"*"` untuk mengizinkan semua).
- Kebijakan grup: `channels.whatsapp.groupPolicy` mengontrol apakah pesan grup diterima (`open|disabled|allowlist`). `allowlist` menggunakan `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` yang eksplisit). Default-nya adalah `allowlist` (diblokir sampai Anda menambahkan pengirim).
- Sesi per grup: kunci sesi terlihat seperti `agent:<agentId>:whatsapp:group:<jid>` sehingga perintah seperti `/verbose on`, `/trace on`, atau `/think high` (dikirim sebagai pesan mandiri) dibatasi ke grup tersebut; status DM pribadi tidak tersentuh. Heartbeat dilewati untuk thread grup.
- Injeksi konteks: pesan grup **pending-only** (default 50) yang _tidak_ memicu eksekusi diawali di bawah `[Chat messages since your last reply - for context]`, dengan baris pemicu di bawah `[Current message - respond to this]`. Pesan yang sudah ada di sesi tidak disuntikkan ulang.
- Penampilan pengirim: setiap batch grup sekarang diakhiri dengan `[from: Sender Name (+E164)]` sehingga Pi tahu siapa yang sedang berbicara.
- Ephemeral/view-once: kami membuka bungkusnya sebelum mengekstrak teks/penyebutan, sehingga ping di dalamnya tetap memicu.
- Prompt sistem grup: pada giliran pertama sesi grup (dan setiap kali `/activation` mengubah mode) kami menyuntikkan blurb singkat ke prompt sistem seperti `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Jika metadata tidak tersedia, kami tetap memberi tahu agen bahwa ini adalah chat grup.

## Contoh konfigurasi (WhatsApp)

Tambahkan blok `groupChat` ke `~/.openclaw/openclaw.json` agar ping nama tampilan berfungsi bahkan saat WhatsApp menghapus `@` visual di badan teks:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Catatan:

- Regex tersebut tidak peka huruf besar/kecil dan menggunakan guardrail safe-regex yang sama seperti surface regex konfigurasi lainnya; pola yang tidak valid dan pengulangan bertingkat yang tidak aman diabaikan.
- WhatsApp tetap mengirim penyebutan kanonis melalui `mentionedJids` saat seseorang mengetuk kontak, jadi fallback nomor jarang dibutuhkan tetapi tetap merupakan jaring pengaman yang berguna.

### Perintah aktivasi (khusus pemilik)

Gunakan perintah chat grup:

- `/activation mention`
- `/activation always`

Hanya nomor pemilik (dari `channels.whatsapp.allowFrom`, atau E.164 bot sendiri jika tidak diatur) yang dapat mengubah ini. Kirim `/status` sebagai pesan mandiri di grup untuk melihat mode aktivasi saat ini.

## Cara menggunakan

1. Tambahkan akun WhatsApp Anda (yang menjalankan OpenClaw) ke grup.
2. Ucapkan `@openclaw …` (atau sertakan nomornya). Hanya pengirim yang ada di allowlist yang dapat memicunya kecuali Anda menetapkan `groupPolicy: "open"`.
3. Prompt agen akan menyertakan konteks grup terbaru ditambah penanda `[from: …]` di bagian akhir sehingga agen dapat menyapa orang yang tepat.
4. Direktif tingkat sesi (`/verbose on`, `/trace on`, `/think high`, `/new` atau `/reset`, `/compact`) hanya berlaku untuk sesi grup tersebut; kirim sebagai pesan mandiri agar terdaftar. Sesi DM pribadi Anda tetap independen.

## Pengujian / verifikasi

- Smoke manual:
  - Kirim ping `@openclaw` di grup dan konfirmasikan ada balasan yang merujuk nama pengirim.
  - Kirim ping kedua dan verifikasi bahwa blok riwayat disertakan lalu dibersihkan pada giliran berikutnya.
- Periksa log gateway (jalankan dengan `--verbose`) untuk melihat entri `inbound web message` yang menampilkan `from: <groupJid>` dan sufiks `[from: …]`.

## Pertimbangan yang diketahui

- Heartbeat memang sengaja dilewati untuk grup agar tidak menimbulkan broadcast yang berisik.
- Penekanan echo menggunakan string batch gabungan; jika Anda mengirim teks identik dua kali tanpa penyebutan, hanya yang pertama yang akan mendapat respons.
- Entri penyimpanan sesi akan muncul sebagai `agent:<agentId>:whatsapp:group:<jid>` di session store (`~/.openclaw/agents/<agentId>/sessions/sessions.json` secara default); entri yang tidak ada hanya berarti grup tersebut belum memicu eksekusi.
- Indikator mengetik di grup mengikuti `agents.defaults.typingMode` (default: `message` saat tidak disebut).

## Terkait

- [Groups](/id/channels/groups)
- [Channel routing](/id/channels/channel-routing)
- [Broadcast groups](/id/channels/broadcast-groups)
