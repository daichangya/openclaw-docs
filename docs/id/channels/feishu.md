---
read_when:
    - Anda ingin menghubungkan bot Feishu/Lark
    - Anda sedang mengonfigurasi saluran Feishu
summary: Ikhtisar bot Feishu, fitur, dan konfigurasi
title: Feishu
x-i18n:
    generated_at: "2026-04-25T13:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark adalah platform kolaborasi all-in-one tempat tim mengobrol, berbagi dokumen, mengelola kalender, dan menyelesaikan pekerjaan bersama.

**Status:** siap produksi untuk DM bot + obrolan grup. WebSocket adalah mode default; mode webhook bersifat opsional.

---

## Mulai cepat

> **Memerlukan OpenClaw 2026.4.25 atau yang lebih baru.** Jalankan `openclaw --version` untuk memeriksa. Tingkatkan dengan `openclaw update`.

<Steps>
  <Step title="Jalankan wizard penyiapan saluran">
  ```bash
  openclaw channels login --channel feishu
  ```
  Pindai kode QR dengan aplikasi seluler Feishu/Lark Anda untuk membuat bot Feishu/Lark secara otomatis.
  </Step>
  
  <Step title="Setelah penyiapan selesai, mulai ulang gateway untuk menerapkan perubahan">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kontrol akses

### Pesan langsung

Konfigurasikan `dmPolicy` untuk mengontrol siapa yang dapat mengirim DM ke bot:

- `"pairing"` — pengguna yang tidak dikenal menerima kode pairing; setujui melalui CLI
- `"allowlist"` — hanya pengguna yang tercantum di `allowFrom` yang dapat mengobrol (default: hanya pemilik bot)
- `"open"` — izinkan semua pengguna
- `"disabled"` — nonaktifkan semua DM

**Setujui permintaan pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Obrolan grup

**Kebijakan grup** (`channels.feishu.groupPolicy`):

| Value         | Perilaku                                   |
| ------------- | ------------------------------------------ |
| `"open"`      | Merespons semua pesan di grup              |
| `"allowlist"` | Hanya merespons grup di `groupAllowFrom`   |
| `"disabled"`  | Menonaktifkan semua pesan grup             |

Default: `allowlist`

**Persyaratan mention** (`channels.feishu.requireMention`):

- `true` — memerlukan @mention (default)
- `false` — merespons tanpa @mention
- Override per grup: `channels.feishu.groups.<chat_id>.requireMention`

---

## Contoh konfigurasi grup

### Izinkan semua grup, tidak memerlukan @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Izinkan semua grup, tetap memerlukan @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Hanya izinkan grup tertentu

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // ID grup terlihat seperti: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Batasi pengirim dalam grup

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // open_id pengguna terlihat seperti: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Mendapatkan ID grup/pengguna

### ID grup (`chat_id`, format: `oc_xxx`)

Buka grup di Feishu/Lark, klik ikon menu di sudut kanan atas, lalu buka **Pengaturan**. ID grup (`chat_id`) tercantum di halaman pengaturan.

![Get Group ID](/images/feishu-get-group-id.png)

### ID pengguna (`open_id`, format: `ou_xxx`)

Mulai gateway, kirim DM ke bot, lalu periksa log:

```bash
openclaw logs --follow
```

Cari `open_id` dalam output log. Anda juga dapat memeriksa permintaan pairing yang tertunda:

```bash
openclaw pairing list feishu
```

---

## Perintah umum

| Command   | Deskripsi                     |
| --------- | ----------------------------- |
| `/status` | Tampilkan status bot          |
| `/reset`  | Atur ulang sesi saat ini      |
| `/model`  | Tampilkan atau ganti model AI |

> Feishu/Lark tidak mendukung menu slash-command native, jadi kirim ini sebagai pesan teks biasa.

---

## Pemecahan masalah

### Bot tidak merespons di obrolan grup

1. Pastikan bot ditambahkan ke grup
2. Pastikan Anda @mention bot (diperlukan secara default)
3. Verifikasi `groupPolicy` bukan `"disabled"`
4. Periksa log: `openclaw logs --follow`

### Bot tidak menerima pesan

1. Pastikan bot dipublikasikan dan disetujui di Feishu Open Platform / Lark Developer
2. Pastikan langganan event menyertakan `im.message.receive_v1`
3. Pastikan **persistent connection** (WebSocket) dipilih
4. Pastikan semua cakupan izin yang diperlukan telah diberikan
5. Pastikan gateway berjalan: `openclaw gateway status`
6. Periksa log: `openclaw logs --follow`

### App Secret bocor

1. Reset App Secret di Feishu Open Platform / Lark Developer
2. Perbarui nilainya di konfigurasi Anda
3. Mulai ulang gateway: `openclaw gateway restart`

---

## Konfigurasi lanjutan

### Banyak akun

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Bot utama",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot cadangan",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` mengontrol akun mana yang digunakan saat API outbound tidak menentukan `accountId`.

### Batas pesan

- `textChunkLimit` — ukuran chunk teks outbound (default: `2000` karakter)
- `mediaMaxMb` — batas unggah/unduh media (default: `30` MB)

### Streaming

Feishu/Lark mendukung balasan streaming melalui kartu interaktif. Saat diaktifkan, bot memperbarui kartu secara real time saat menghasilkan teks.

```json5
{
  channels: {
    feishu: {
      streaming: true, // aktifkan output kartu streaming (default: true)
      blockStreaming: true, // aktifkan streaming tingkat blok (default: true)
    },
  },
}
```

Setel `streaming: false` untuk mengirim balasan lengkap dalam satu pesan.

### Optimisasi kuota

Kurangi jumlah panggilan API Feishu/Lark dengan dua flag opsional:

- `typingIndicator` (default `true`): setel ke `false` untuk melewati panggilan reaksi mengetik
- `resolveSenderNames` (default `true`): setel ke `false` untuk melewati lookup profil pengirim

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sesi ACP

Feishu/Lark mendukung ACP untuk DM dan pesan thread grup. ACP Feishu/Lark digerakkan oleh perintah teks — tidak ada menu slash-command native, jadi gunakan pesan `/acp ...` langsung dalam percakapan.

#### Binding ACP persisten

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
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Spawn ACP dari obrolan

Dalam DM atau thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` berfungsi untuk DM dan pesan thread Feishu/Lark. Pesan tindak lanjut dalam percakapan yang terikat akan dirutekan langsung ke sesi ACP tersebut.

### Perutean multi-agent

Gunakan `bindings` untuk merutekan DM atau grup Feishu/Lark ke agent yang berbeda.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Field perutean:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) atau `"group"` (obrolan grup)
- `match.peer.id`: Open ID pengguna (`ou_xxx`) atau ID grup (`oc_xxx`)

Lihat [Mendapatkan ID grup/pengguna](#get-groupuser-ids) untuk tips pencarian.

---

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi Gateway](/id/gateway/configuration)

| Setting                                           | Deskripsi                                 | Default          |
| ------------------------------------------------- | ----------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Aktifkan/nonaktifkan saluran              | `true`           |
| `channels.feishu.domain`                          | Domain API (`feishu` atau `lark`)         | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport event (`websocket` atau `webhook`) | `websocket`   |
| `channels.feishu.defaultAccount`                  | Akun default untuk perutean outbound      | `default`        |
| `channels.feishu.verificationToken`               | Diperlukan untuk mode webhook             | —                |
| `channels.feishu.encryptKey`                      | Diperlukan untuk mode webhook             | —                |
| `channels.feishu.webhookPath`                     | Jalur rute webhook                        | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host bind webhook                         | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port bind webhook                         | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                    | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                | —                |
| `channels.feishu.accounts.<id>.domain`            | Override domain per akun                  | `feishu`         |
| `channels.feishu.dmPolicy`                        | Kebijakan DM                              | `allowlist`      |
| `channels.feishu.allowFrom`                       | allowlist DM (daftar `open_id`)           | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Kebijakan grup                            | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | allowlist grup                            | —                |
| `channels.feishu.requireMention`                  | Memerlukan @mention di grup               | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Override @mention per grup                | diwariskan       |
| `channels.feishu.groups.<chat_id>.enabled`        | Aktifkan/nonaktifkan grup tertentu        | `true`           |
| `channels.feishu.textChunkLimit`                  | Ukuran chunk pesan                        | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Batas ukuran media                        | `30`             |
| `channels.feishu.streaming`                       | Output kartu streaming                    | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming tingkat blok                    | `true`           |
| `channels.feishu.typingIndicator`                 | Kirim reaksi mengetik                     | `true`           |
| `channels.feishu.resolveSenderNames`              | Resolusikan nama tampilan pengirim        | `true`           |

---

## Jenis pesan yang didukung

### Terima

- ✅ Teks
- ✅ Teks kaya (post)
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Stiker

### Kirim

- ✅ Teks
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Kartu interaktif (termasuk pembaruan streaming)
- ⚠️ Teks kaya (pemformatan gaya post; tidak mendukung seluruh kemampuan authoring Feishu/Lark)

Bubble audio Feishu/Lark native menggunakan jenis pesan Feishu `audio` dan memerlukan media unggahan Ogg/Opus (`file_type: "opus"`). Media `.opus` dan `.ogg` yang sudah ada dikirim langsung sebagai audio native. MP3/WAV/M4A dan format audio lain yang mungkin akan ditranskode ke Ogg/Opus 48kHz dengan `ffmpeg` hanya saat balasan meminta pengiriman suara (`audioAsVoice` / message tool `asVoice`, termasuk balasan voice-note TTS). Lampiran MP3 biasa tetap menjadi file reguler. Jika `ffmpeg` tidak ada atau konversi gagal, OpenClaw akan kembali ke lampiran file dan mencatat alasannya.

### Thread dan balasan

- ✅ Balasan inline
- ✅ Balasan thread
- ✅ Balasan media tetap sadar-thread saat membalas pesan thread

Untuk `groupSessionScope: "group_topic"` dan `"group_topic_sender"`, grup topik Feishu/Lark native menggunakan event `thread_id` (`omt_*`) sebagai kunci sesi topik kanonis. Balasan grup normal yang diubah OpenClaw menjadi thread tetap menggunakan ID pesan akar balasan (`om_*`) sehingga giliran pertama dan giliran lanjutan tetap berada dalam sesi yang sama.

---

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
