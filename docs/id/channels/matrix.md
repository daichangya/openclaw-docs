---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi Matrix E2EE dan verifikasi
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matrix
x-i18n:
    generated_at: "2026-04-09T01:29:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28fc13c7620c1152200315ae69c94205da6de3180c53c814dd8ce03b5cb1758f
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix adalah plugin saluran bawaan untuk OpenClaw.
Ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaksi, polling, lokasi, dan E2EE.

## Plugin bawaan

Matrix tersedia sebagai plugin bawaan di rilis OpenClaw saat ini, jadi build paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Matrix, instal secara manual:

Instal dari npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instal dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Lihat [Plugins](/id/tools/plugin) untuk perilaku plugin dan aturan instalasi.

## Penyiapan

1. Pastikan plugin Matrix tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun Matrix di homeserver Anda.
3. Konfigurasikan `channels.matrix` dengan salah satu dari:
   - `homeserver` + `accessToken`, atau
   - `homeserver` + `userId` + `password`.
4. Mulai ulang gateway.
5. Mulai DM dengan bot atau undang ke room.
   - Undangan Matrix baru hanya berfungsi jika `channels.matrix.autoJoin` mengizinkannya.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

Wizard Matrix akan meminta:

- URL homeserver
- metode autentikasi: access token atau password
- ID pengguna (hanya autentikasi password)
- nama perangkat opsional
- apakah akan mengaktifkan E2EE
- apakah akan mengonfigurasi akses room dan gabung otomatis undangan

Perilaku utama wizard:

- Jika env vars autentikasi Matrix sudah ada dan akun tersebut belum menyimpan autentikasi di config, wizard menawarkan pintasan env untuk mempertahankan autentikasi di env vars.
- Nama akun dinormalisasi menjadi ID akun. Misalnya, `Ops Bot` menjadi `ops-bot`.
- Entri allowlist DM menerima `@user:server` secara langsung; nama tampilan hanya berfungsi saat pencarian direktori live menemukan satu kecocokan yang tepat.
- Entri allowlist room menerima ID room dan alias secara langsung. Pilih `!room:server` atau `#alias:server`; nama yang tidak dapat diselesaikan diabaikan saat runtime oleh resolusi allowlist.
- Dalam mode allowlist gabung otomatis undangan, gunakan hanya target undangan yang stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama room biasa ditolak.
- Untuk menyelesaikan nama room sebelum menyimpan, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` secara default adalah `off`.

Jika Anda membiarkannya tidak diatur, bot tidak akan bergabung ke room yang diundang atau undangan gaya DM baru, jadi bot tidak akan muncul di grup baru atau DM yang diundang kecuali Anda bergabung secara manual terlebih dahulu.

Setel `autoJoin: "allowlist"` bersama `autoJoinAllowlist` untuk membatasi undangan mana yang diterima, atau setel `autoJoin: "always"` jika Anda ingin bot bergabung ke setiap undangan.

Dalam mode `allowlist`, `autoJoinAllowlist` hanya menerima `!roomId:server`, `#alias:server`, atau `*`.
</Warning>

Contoh allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Gabung ke setiap undangan:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Penyiapan minimal berbasis token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Penyiapan berbasis password (token di-cache setelah login):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix menyimpan kredensial cache di `~/.openclaw/credentials/matrix/`.
Akun default menggunakan `credentials.json`; akun bernama menggunakan `credentials-<account>.json`.
Saat kredensial cache ada di sana, OpenClaw menganggap Matrix telah dikonfigurasi untuk penyiapan, doctor, dan penemuan status saluran meskipun autentikasi saat ini tidak diatur langsung di config.

Padanan env var (digunakan saat kunci config tidak diatur):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Untuk akun non-default, gunakan env vars dengan cakupan akun:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Contoh untuk akun `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Untuk ID akun ternormalisasi `ops-bot`, gunakan:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix melakukan escape pada tanda baca di ID akun agar env vars bercakupan tetap bebas benturan.
Sebagai contoh, `-` menjadi `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan env-var saat env vars autentikasi tersebut sudah ada dan akun yang dipilih belum menyimpan autentikasi Matrix di config.

## Contoh konfigurasi

Ini adalah config dasar praktis dengan pairing DM, allowlist room, dan E2EE diaktifkan:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` berlaku untuk semua undangan Matrix, termasuk undangan bergaya DM. OpenClaw tidak dapat secara andal mengklasifikasikan room yang diundang sebagai DM atau grup pada saat undangan, jadi semua undangan diproses melalui `autoJoin` terlebih dahulu. `dm.policy` berlaku setelah bot bergabung dan room diklasifikasikan sebagai DM.

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in.

Setel `channels.matrix.streaming` ke `"partial"` saat Anda ingin OpenClaw mengirim satu balasan pratinjau live, mengedit pratinjau itu di tempat saat model sedang menghasilkan teks, lalu memfinalkannya saat balasan selesai:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` adalah default. OpenClaw menunggu balasan akhir dan mengirimnya satu kali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok asisten saat ini menggunakan pesan teks Matrix normal. Ini mempertahankan perilaku notifikasi warisan Matrix yang mengutamakan pratinjau, sehingga klien bawaan dapat memberi notifikasi pada teks pratinjau pertama yang di-stream alih-alih blok yang telah selesai.
- `streaming: "quiet"` membuat satu pemberitahuan pratinjau senyap yang dapat diedit untuk blok asisten saat ini. Gunakan ini hanya jika Anda juga mengonfigurasi aturan push penerima untuk edit pratinjau yang telah difinalkan.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan streaming pratinjau aktif, Matrix mempertahankan draf live untuk blok saat ini dan menyimpan blok yang telah selesai sebagai pesan terpisah.
- Saat streaming pratinjau aktif dan `blockStreaming` nonaktif, Matrix mengedit draf live di tempat dan memfinalkan event yang sama saat blok atau giliran selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan streaming pratinjau dan kembali ke pengiriman final normal.
- Balasan media tetap mengirim lampiran seperti biasa. Jika pratinjau basi tidak lagi dapat digunakan kembali dengan aman, OpenClaw akan meredaksinya sebelum mengirim balasan media final.
- Edit pratinjau menimbulkan panggilan API Matrix tambahan. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate-limit yang paling konservatif.

`blockStreaming` tidak mengaktifkan pratinjau draf dengan sendirinya.
Gunakan `streaming: "partial"` atau `streaming: "quiet"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok asisten yang sudah selesai tetap terlihat sebagai pesan progres terpisah.

Jika Anda memerlukan notifikasi Matrix bawaan tanpa aturan push kustom, gunakan `streaming: "partial"` untuk perilaku yang mengutamakan pratinjau atau biarkan `streaming` nonaktif untuk pengiriman final saja. Dengan `streaming: "off"`:

- `blockStreaming: true` mengirim setiap blok yang selesai sebagai pesan Matrix normal yang memicu notifikasi.
- `blockStreaming: false` hanya mengirim balasan final yang telah selesai sebagai pesan Matrix normal yang memicu notifikasi.

### Aturan push self-hosted untuk pratinjau final senyap

Jika Anda menjalankan infrastruktur Matrix sendiri dan ingin pratinjau senyap hanya memberi notifikasi saat satu blok atau balasan akhir selesai, setel `streaming: "quiet"` dan tambahkan aturan push per pengguna untuk edit pratinjau yang telah difinalkan.

Ini biasanya merupakan penyiapan pengguna penerima, bukan perubahan config global homeserver:

Pemetaan cepat sebelum memulai:

- pengguna penerima = orang yang seharusnya menerima notifikasi
- pengguna bot = akun Matrix OpenClaw yang mengirim balasan
- gunakan access token pengguna penerima untuk panggilan API di bawah
- cocokan `sender` dalam aturan push dengan MXID lengkap pengguna bot

1. Konfigurasikan OpenClaw untuk menggunakan pratinjau senyap:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Pastikan akun penerima sudah menerima notifikasi push Matrix normal. Aturan pratinjau senyap hanya berfungsi jika pengguna tersebut sudah memiliki pusher/perangkat yang berfungsi.

3. Dapatkan access token pengguna penerima.
   - Gunakan token pengguna penerima, bukan token bot.
   - Menggunakan kembali token sesi klien yang ada biasanya paling mudah.
   - Jika Anda perlu membuat token baru, Anda dapat login melalui API Client-Server Matrix standar:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Verifikasi bahwa akun penerima sudah memiliki pusher:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jika ini tidak mengembalikan pusher/perangkat aktif, perbaiki notifikasi Matrix normal terlebih dahulu sebelum menambahkan aturan OpenClaw di bawah.

OpenClaw menandai edit pratinjau teks-saja yang telah difinalkan dengan:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Buat aturan push override untuk setiap akun penerima yang harus menerima notifikasi ini:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Ganti nilai-nilai ini sebelum menjalankan perintah:

- `https://matrix.example.org`: URL dasar homeserver Anda
- `$USER_ACCESS_TOKEN`: access token pengguna penerima
- `openclaw-finalized-preview-botname`: ID aturan yang unik untuk bot ini bagi pengguna penerima ini
- `@bot:example.org`: MXID bot Matrix OpenClaw Anda, bukan MXID pengguna penerima

Penting untuk penyiapan multi-bot:

- Aturan push diindeks berdasarkan `ruleId`. Menjalankan kembali `PUT` terhadap ID aturan yang sama akan memperbarui aturan itu.
- Jika satu pengguna penerima harus memberi notifikasi untuk beberapa akun bot Matrix OpenClaw, buat satu aturan per bot dengan ID aturan unik untuk setiap kecocokan sender.
- Pola sederhana adalah `openclaw-finalized-preview-<botname>`, seperti `openclaw-finalized-preview-ops` atau `openclaw-finalized-preview-support`.

Aturan dievaluasi terhadap pengirim event:

- autentikasi dengan token pengguna penerima
- cocokan `sender` dengan MXID bot OpenClaw

6. Verifikasi bahwa aturan tersebut ada:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Uji balasan yang di-stream. Dalam mode senyap, room seharusnya menampilkan pratinjau draf senyap dan edit final di tempat seharusnya memberi notifikasi saat blok atau giliran selesai.

Jika Anda perlu menghapus aturan nanti, hapus ID aturan yang sama dengan token pengguna penerima:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Catatan:

- Buat aturan dengan access token pengguna penerima, bukan token bot.
- Aturan `override` baru yang ditentukan pengguna dimasukkan sebelum aturan penekanan default, jadi tidak diperlukan parameter pengurutan tambahan.
- Ini hanya memengaruhi edit pratinjau teks-saja yang dapat difinalkan OpenClaw dengan aman di tempat. Fallback media dan fallback pratinjau basi tetap menggunakan pengiriman Matrix normal.
- Jika `GET /_matrix/client/v3/pushers` tidak menampilkan pusher, berarti pengguna tersebut belum memiliki pengiriman push Matrix yang berfungsi untuk akun/perangkat ini.

#### Synapse

Untuk Synapse, penyiapan di atas biasanya sudah cukup dengan sendirinya:

- Tidak diperlukan perubahan `homeserver.yaml` khusus untuk notifikasi pratinjau OpenClaw yang telah difinalkan.
- Jika deployment Synapse Anda sudah mengirim notifikasi push Matrix normal, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utama.
- Jika Anda menjalankan Synapse di balik reverse proxy atau worker, pastikan `/_matrix/client/.../pushrules/` mencapai Synapse dengan benar.
- Jika Anda menjalankan worker Synapse, pastikan pusher sehat. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / worker pusher yang dikonfigurasi.

#### Tuwunel

Untuk Tuwunel, gunakan alur penyiapan dan panggilan API push-rule yang sama seperti yang ditampilkan di atas:

- Tidak diperlukan config khusus Tuwunel untuk penanda pratinjau yang telah difinalkan itu sendiri.
- Jika notifikasi Matrix normal sudah berfungsi untuk pengguna tersebut, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utama.
- Jika notifikasi tampak hilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini di Tuwunel 1.4.2 pada 12 September 2025, dan ini dapat secara sengaja menekan push ke perangkat lain saat satu perangkat aktif.

## Room bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang dikonfigurasi diabaikan.

Gunakan `allowBots` saat Anda memang menginginkan lalu lintas Matrix antar-agen:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` menerima pesan dari akun bot Matrix lain yang dikonfigurasi di room dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya saat mereka secara terlihat menyebut bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa setelan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan diri.
- Matrix tidak mengekspos penanda bot bawaan di sini; OpenClaw memperlakukan "ditulis bot" sebagai "dikirim oleh akun Matrix lain yang dikonfigurasi pada gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di room bersama.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar terenkripsi bersama lampiran penuh. Room tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — plugin mendeteksi status E2EE secara otomatis.

Aktifkan enkripsi:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Periksa status verifikasi:

```bash
openclaw matrix verify status
```

Status verbose (diagnostik lengkap):

```bash
openclaw matrix verify status --verbose
```

Sertakan recovery key yang tersimpan dalam output yang dapat dibaca mesin:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Bootstrap cross-signing dan status verifikasi:

```bash
openclaw matrix verify bootstrap
```

Diagnostik bootstrap verbose:

```bash
openclaw matrix verify bootstrap --verbose
```

Paksa reset identitas cross-signing baru sebelum bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verifikasi perangkat ini dengan recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Detail verifikasi perangkat verbose:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Periksa kesehatan backup room-key:

```bash
openclaw matrix verify backup status
```

Diagnostik kesehatan backup verbose:

```bash
openclaw matrix verify backup status --verbose
```

Pulihkan room key dari backup server:

```bash
openclaw matrix verify backup restore
```

Diagnostik pemulihan verbose:

```bash
openclaw matrix verify backup restore --verbose
```

Hapus backup server saat ini dan buat baseline backup baru. Jika key backup yang tersimpan tidak dapat dimuat dengan bersih, reset ini juga dapat membuat ulang secret storage sehingga cold start mendatang dapat memuat key backup baru:

```bash
openclaw matrix verify backup reset --yes
```

Semua perintah `verify` ringkas secara default (termasuk logging SDK internal yang senyap) dan hanya menampilkan diagnostik terperinci dengan `--verbose`.
Gunakan `--json` untuk output lengkap yang dapat dibaca mesin saat membuat skrip.

Dalam penyiapan multi-akun, perintah CLI Matrix menggunakan akun default Matrix implisit kecuali Anda memberikan `--account <id>`.
Jika Anda mengonfigurasi beberapa akun bernama, setel `channels.matrix.defaultAccount` terlebih dahulu atau operasi CLI implisit tersebut akan berhenti dan meminta Anda memilih akun secara eksplisit.
Gunakan `--account` kapan pun Anda ingin operasi verifikasi atau perangkat menargetkan akun bernama secara eksplisit:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Saat enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan error verifikasi menunjuk ke kunci config akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

### Arti "verified"

OpenClaw memperlakukan perangkat Matrix ini sebagai terverifikasi hanya jika perangkat tersebut diverifikasi oleh identitas cross-signing Anda sendiri.
Dalam praktiknya, `openclaw matrix verify status --verbose` mengekspos tiga sinyal kepercayaan:

- `Locally trusted`: perangkat ini dipercaya hanya oleh klien saat ini
- `Cross-signing verified`: SDK melaporkan perangkat sebagai terverifikasi melalui cross-signing
- `Signed by owner`: perangkat ditandatangani oleh self-signing key Anda sendiri

`Verified by owner` menjadi `yes` hanya saat verifikasi cross-signing atau owner-signing ada.
Kepercayaan lokal saja tidak cukup bagi OpenClaw untuk memperlakukan perangkat sebagai sepenuhnya terverifikasi.

### Fungsi bootstrap

`openclaw matrix verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun Matrix terenkripsi.
Perintah ini melakukan semua hal berikut secara berurutan:

- mem-bootstrap secret storage, menggunakan kembali recovery key yang ada bila memungkinkan
- mem-bootstrap cross-signing dan mengunggah public cross-signing keys yang hilang
- mencoba menandai dan men-cross-sign perangkat saat ini
- membuat backup room-key sisi server baru jika belum ada

Jika homeserver memerlukan autentikasi interaktif untuk mengunggah cross-signing keys, OpenClaw mencoba unggah tanpa autentikasi terlebih dahulu, lalu dengan `m.login.dummy`, lalu dengan `m.login.password` saat `channels.matrix.password` dikonfigurasi.

Gunakan `--force-reset-cross-signing` hanya saat Anda memang ingin membuang identitas cross-signing saat ini dan membuat yang baru.

Jika Anda memang ingin membuang backup room-key saat ini dan memulai baseline backup baru untuk pesan mendatang, gunakan `openclaw matrix verify backup reset --yes`.
Lakukan ini hanya jika Anda menerima bahwa riwayat terenkripsi lama yang tidak dapat dipulihkan akan tetap tidak tersedia dan bahwa OpenClaw dapat membuat ulang secret storage jika rahasia backup saat ini tidak dapat dimuat dengan aman.

### Baseline backup baru

Jika Anda ingin menjaga agar pesan terenkripsi mendatang tetap berfungsi dan menerima kehilangan riwayat lama yang tidak dapat dipulihkan, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Tambahkan `--account <id>` ke setiap perintah jika Anda ingin secara eksplisit menargetkan akun Matrix bernama.

### Perilaku startup

Saat `encryption: true`, Matrix secara default mengatur `startupVerification` ke `"if-unverified"`.
Saat startup, jika perangkat ini masih belum terverifikasi, Matrix akan meminta self-verification di klien Matrix lain, melewati permintaan duplikat saat satu sudah tertunda, dan menerapkan cooldown lokal sebelum mencoba lagi setelah restart.
Secara default, upaya permintaan yang gagal dicoba ulang lebih cepat daripada pembuatan permintaan yang berhasil.
Setel `startupVerification: "off"` untuk menonaktifkan permintaan startup otomatis, atau sesuaikan `startupVerificationCooldownHours` jika Anda ingin jendela percobaan ulang yang lebih pendek atau lebih panjang.

Startup juga melakukan pass bootstrap crypto konservatif secara otomatis.
Pass itu mencoba menggunakan kembali secret storage dan identitas cross-signing saat ini terlebih dahulu, dan menghindari reset cross-signing kecuali Anda menjalankan alur perbaikan bootstrap eksplisit.

Jika startup menemukan status bootstrap yang rusak dan `channels.matrix.password` dikonfigurasi, OpenClaw dapat mencoba jalur perbaikan yang lebih ketat.
Jika perangkat saat ini sudah ditandatangani owner, OpenClaw mempertahankan identitas itu alih-alih meresetnya secara otomatis.

Lihat [Migrasi Matrix](/id/install/migrating-matrix) untuk alur upgrade lengkap, batasan, perintah pemulihan, dan pesan migrasi umum.

### Pemberitahuan verifikasi

Matrix memposting pemberitahuan siklus hidup verifikasi langsung ke room verifikasi DM ketat sebagai pesan `m.notice`.
Itu mencakup:

- pemberitahuan permintaan verifikasi
- pemberitahuan verifikasi siap (dengan panduan eksplisit "Verify by emoji")
- mulai dan selesai verifikasi
- detail SAS (emoji dan desimal) saat tersedia

Permintaan verifikasi masuk dari klien Matrix lain dilacak dan diterima otomatis oleh OpenClaw.
Untuk alur self-verification, OpenClaw juga memulai alur SAS secara otomatis saat verifikasi emoji tersedia dan mengonfirmasi sisinya sendiri.
Untuk permintaan verifikasi dari pengguna/perangkat Matrix lain, OpenClaw menerima permintaan secara otomatis lalu menunggu alur SAS berjalan seperti biasa.
Anda tetap perlu membandingkan emoji atau SAS desimal di klien Matrix Anda dan mengonfirmasi "They match" di sana untuk menyelesaikan verifikasi.

OpenClaw tidak serta-merta menerima otomatis alur duplikat yang dimulai sendiri secara buta. Startup melewati pembuatan permintaan baru saat permintaan self-verification sudah tertunda.

Pemberitahuan protokol/sistem verifikasi tidak diteruskan ke pipeline chat agen, jadi tidak menghasilkan `NO_REPLY`.

### Kebersihan perangkat

Perangkat Matrix yang dikelola OpenClaw lama dapat menumpuk di akun dan membuat kepercayaan room terenkripsi lebih sulit dipahami.
Daftarkan dengan:

```bash
openclaw matrix devices list
```

Hapus perangkat basi yang dikelola OpenClaw dengan:

```bash
openclaw matrix devices prune-stale
```

### Penyimpanan crypto

Matrix E2EE menggunakan jalur Rust crypto `matrix-js-sdk` resmi di Node, dengan `fake-indexeddb` sebagai shim IndexedDB. Status crypto dipertahankan ke file snapshot (`crypto-idb-snapshot.json`) dan dipulihkan saat startup. File snapshot adalah status runtime sensitif yang disimpan dengan izin file yang ketat.

Status runtime terenkripsi berada di bawah root per-akun, per-pengguna, per-hash-token di
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Direktori itu berisi sync store (`bot-storage.json`), crypto store (`crypto/`),
file recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
binding thread (`thread-bindings.json`), dan status verifikasi startup (`startup-verification.json`).
Saat token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang ada
untuk tupel akun/homeserver/pengguna tersebut sehingga status sinkronisasi sebelumnya, status crypto, binding thread,
dan status verifikasi startup tetap terlihat.

## Manajemen profil

Perbarui self-profile Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` jika Anda ingin secara eksplisit menargetkan akun Matrix bernama.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda memberikan URL avatar `http://` atau `https://`, OpenClaw terlebih dahulu mengunggahnya ke Matrix dan menyimpan kembali URL `mxc://` yang telah diselesaikan ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Thread

Matrix mendukung thread Matrix asli untuk balasan otomatis maupun pengiriman message-tool.

- `dm.sessionScope: "per-user"` (default) menjaga routing DM Matrix tetap berbasis pengirim, sehingga beberapa room DM dapat berbagi satu sesi saat semuanya mengarah ke peer yang sama.
- `dm.sessionScope: "per-room"` mengisolasi setiap room DM Matrix ke dalam kunci sesinya sendiri sambil tetap menggunakan pemeriksaan autentikasi DM dan allowlist normal.
- Binding percakapan Matrix eksplisit tetap menang atas `dm.sessionScope`, sehingga room dan thread yang terikat mempertahankan sesi target yang dipilih.
- `threadReplies: "off"` menjaga balasan tetap level atas dan menjaga pesan thread masuk tetap pada sesi induk.
- `threadReplies: "inbound"` membalas di dalam thread hanya jika pesan masuk sudah berada di thread tersebut.
- `threadReplies: "always"` menjaga balasan room dalam thread yang berakar pada pesan pemicu dan merutekan percakapan itu melalui sesi bercakupan thread yang cocok dari pesan pemicu pertama.
- `dm.threadReplies` menimpa setelan tingkat atas hanya untuk DM. Misalnya, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan thread masuk menyertakan pesan akar thread sebagai konteks agen tambahan.
- Pengiriman message-tool otomatis mewarisi thread Matrix saat ini ketika target adalah room yang sama, atau target pengguna DM yang sama, kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM dengan sesi yang sama hanya berlaku saat metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke routing normal dengan cakupan pengguna.
- Saat OpenClaw melihat room DM Matrix bertabrakan dengan room DM lain pada sesi DM Matrix bersama yang sama, OpenClaw memposting `m.notice` satu kali di room itu dengan escape hatch `/focus` saat binding thread diaktifkan dan petunjuk `dm.sessionScope`.
- Binding thread runtime didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat thread berfungsi di room dan DM Matrix.
- `/focus` level atas pada room/DM Matrix membuat thread Matrix baru dan mengikatnya ke sesi target saat `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada akan mengikat thread saat ini.

## Binding percakapan ACP

Room, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM, room, atau thread Matrix yang sudah ada yang ingin terus Anda gunakan.
- Di DM atau room Matrix level atas, DM/room saat ini tetap menjadi permukaan chat dan pesan mendatang dirutekan ke sesi ACP yang dibuat.
- Di dalam thread Matrix yang sudah ada, `--bind here` mengikat thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat thread Matrix anak.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, saat OpenClaw perlu membuat atau mengikat thread Matrix anak.

### Config binding thread

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per-saluran:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag pembuatan thread-bound Matrix bersifat opt-in:

- Setel `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` level atas membuat dan mengikat thread Matrix baru.
- Setel `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` mengikat sesi ACP ke thread Matrix.

## Reaksi

Matrix mendukung aksi reaksi keluar, notifikasi reaksi masuk, dan reaksi ack masuk.

- Tooling reaksi keluar dibatasi oleh `channels["matrix"].actions.reactions`.
- `react` menambahkan reaksi ke event Matrix tertentu.
- `reactions` menampilkan ringkasan reaksi saat ini untuk event Matrix tertentu.
- `emoji=""` menghapus reaksi milik akun bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari akun bot.

Cakupan reaksi ack diselesaikan dengan urutan resolusi OpenClaw standar:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen

Cakupan ack reaction diselesaikan dengan urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Mode notifikasi reaksi diselesaikan dengan urutan ini:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Perilaku:

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan saat menargetkan pesan Matrix yang ditulis bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaksi.
- Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkan itu sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` saat pesan room Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- Riwayat room Matrix hanya berlaku untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix bersifat pending-only: OpenClaw membuffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela itu saat mention atau pemicu lain tiba.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di body masuk utama untuk giliran itu.
- Pengulangan event Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser maju ke pesan room yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks room tambahan seperti teks balasan yang diambil, akar thread, dan riwayat tertunda.

- `contextVisibility: "all"` adalah default. Konteks tambahan disimpan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist room/pengguna yang aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Setelan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan.
Otorisasi pemicu tetap berasal dari `groupPolicy`, `groups`, `groupAllowFrom`, dan setelan kebijakan DM.

## Kebijakan DM dan room

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Lihat [Groups](/id/channels/groups) untuk perilaku mention-gating dan allowlist.

Contoh pairing untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirimi Anda pesan sebelum persetujuan, OpenClaw menggunakan kembali kode pairing tertunda yang sama dan dapat mengirim balasan pengingat lagi setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Perbaikan direct room

Jika status direct-message tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` basi yang menunjuk ke room solo lama alih-alih DM live. Periksa pemetaan saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Alur perbaikan:

- memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat yang saat ini telah bergabung dengan pengguna tersebut
- membuat direct room baru dan menulis ulang `m.direct` jika tidak ada DM sehat

Alur perbaikan tidak menghapus room lama secara otomatis. Ini hanya memilih DM yang sehat dan memperbarui pemetaan sehingga pengiriman Matrix baru, pemberitahuan verifikasi, dan alur direct-message lainnya kembali menargetkan room yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan asli untuk akun Matrix. Tombol
routing DM/saluran asli tetap berada di bawah config persetujuan exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; fallback ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Pemberi persetujuan harus berupa ID pengguna Matrix seperti `@owner:example.org`. Matrix mengaktifkan persetujuan asli secara otomatis saat `enabled` tidak diatur atau `"auto"` dan setidaknya satu pemberi persetujuan dapat diselesaikan. Persetujuan exec menggunakan `execApprovals.approvers` terlebih dahulu dan dapat fallback ke `channels.matrix.dm.allowFrom`. Persetujuan plugin memberi otorisasi melalui `channels.matrix.dm.allowFrom`. Setel `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan asli secara eksplisit. Permintaan persetujuan jika tidak akan fallback ke rute persetujuan lain yang dikonfigurasi atau kebijakan fallback persetujuan.

Routing asli Matrix mendukung kedua jenis persetujuan:

- `channels.matrix.execApprovals.*` mengontrol mode fanout DM/saluran asli untuk prompt persetujuan Matrix.
- Persetujuan exec menggunakan kumpulan approver exec dari `execApprovals.approvers` atau `channels.matrix.dm.allowFrom`.
- Persetujuan plugin menggunakan allowlist DM Matrix dari `channels.matrix.dm.allowFrom`.
- Pintasan reaksi Matrix dan pembaruan pesan berlaku untuk persetujuan exec maupun plugin.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM approver
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM approver dan room atau DM Matrix asal

Prompt persetujuan Matrix menanamkan pintasan reaksi pada pesan persetujuan utama:

- `✅` = izinkan sekali
- `❌` = tolak
- `♾️` = izinkan selalu bila keputusan tersebut diizinkan oleh kebijakan exec efektif

Approver dapat bereaksi pada pesan itu atau menggunakan fallback slash command: `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya approver yang telah diselesaikan yang dapat menyetujui atau menolak. Untuk persetujuan exec, pengiriman saluran menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Override per-akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumentasi terkait: [Persetujuan exec](/id/tools/exec-approvals)

## Multi-akun

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali suatu akun menimpanya.
Anda dapat memberi cakupan entri room turunan ke satu akun Matrix dengan `groups.<room>.account`.
Entri tanpa `account` tetap dibagikan ke semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi saat akun default dikonfigurasi langsung di `channels.matrix.*` tingkat atas.
Default autentikasi bersama parsial tidak dengan sendirinya membuat akun default implisit terpisah. OpenClaw hanya mensintesis akun `default` tingkat atas saat default tersebut memiliki autentikasi baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama tetap dapat ditemukan dari `homeserver` plus `userId` saat kredensial cache memenuhi autentikasi nanti.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke kunci akun bernama yang ada, promosi perbaikan/penyiapan dari satu akun ke multi-akun mempertahankan akun itu alih-alih membuat entri `accounts.default` baru. Hanya kunci autentikasi/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan itu; kunci kebijakan pengiriman bersama tetap berada di tingkat atas.
Setel `defaultAccount` saat Anda ingin OpenClaw memilih satu akun Matrix bernama untuk routing implisit, probing, dan operasi CLI.
Jika Anda mengonfigurasi beberapa akun bernama, setel `defaultAccount` atau berikan `--account <id>` untuk perintah CLI yang bergantung pada pemilihan akun implisit.
Berikan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` saat Anda ingin menimpa pemilihan implisit itu untuk satu perintah.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda secara eksplisit memilih untuk mengizinkannya per akun.

Jika homeserver Anda berjalan di localhost, IP LAN/Tailscale, atau hostname internal, aktifkan
`network.dangerouslyAllowPrivateNetwork` untuk akun Matrix tersebut:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Contoh penyiapan CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Opt-in ini hanya mengizinkan target privat/internal tepercaya. Homeserver cleartext publik seperti
`http://matrix.example.org:8008` tetap diblokir. Pilih `https://` bila memungkinkan.

## Proxy lalu lintas Matrix

Jika deployment Matrix Anda memerlukan proxy HTTP(S) keluar eksplisit, setel `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Akun bernama dapat menimpa default tingkat atas dengan `channels.matrix.accounts.<id>.proxy`.
OpenClaw menggunakan setelan proxy yang sama untuk lalu lintas Matrix runtime dan probe status akun.

## Resolusi target

Matrix menerima bentuk target ini di mana pun OpenClaw meminta target room atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

Pencarian direktori live menggunakan akun Matrix yang sedang login:

- Pencarian pengguna mengueri direktori pengguna Matrix pada homeserver tersebut.
- Pencarian room menerima ID room dan alias eksplisit secara langsung, lalu fallback ke pencarian nama room yang sudah digabung untuk akun tersebut.
- Pencarian nama room yang sudah digabung bersifat best-effort. Jika nama room tidak dapat diselesaikan menjadi ID atau alias, nama itu diabaikan oleh resolusi allowlist runtime.

## Referensi konfigurasi

- `enabled`: aktifkan atau nonaktifkan saluran.
- `name`: label opsional untuk akun.
- `defaultAccount`: ID akun pilihan saat beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun Matrix ini terhubung ke homeserver privat/internal. Aktifkan ini saat homeserver mengarah ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Akun bernama dapat menimpa default tingkat atas dengan `proxy` mereka sendiri.
- `userId`: ID pengguna Matrix lengkap, misalnya `@bot:example.org`.
- `accessToken`: access token untuk autentikasi berbasis token. Nilai plaintext dan nilai SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` di seluruh provider env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).
- `password`: password untuk login berbasis password. Nilai plaintext dan nilai SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat untuk login password.
- `avatarUrl`: URL avatar diri yang tersimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum event yang diambil selama sinkronisasi startup.
- `encryption`: aktifkan E2EE.
- `allowlistOnly`: saat `true`, meningkatkan kebijakan room `open` menjadi `allowlist`, dan memaksa semua kebijakan DM aktif kecuali `disabled` (termasuk `pairing` dan `open`) menjadi `allowlist`. Tidak memengaruhi kebijakan `disabled`.
- `allowBots`: izinkan pesan dari akun Matrix OpenClaw lain yang dikonfigurasi (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID pengguna untuk lalu lintas room. Entri sebaiknya berupa ID pengguna Matrix lengkap; nama yang tidak dapat diselesaikan diabaikan saat runtime.
- `historyLimit`: jumlah maksimum pesan room yang disertakan sebagai konteks riwayat grup. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, `all`, atau `batched`.
- `markdown`: config rendering Markdown opsional untuk teks Matrix keluar.
- `streaming`: `off` (default), `"partial"`, `"quiet"`, `true`, atau `false`. `"partial"` dan `true` mengaktifkan pembaruan draf yang mengutamakan pratinjau dengan pesan teks Matrix normal. `"quiet"` menggunakan pemberitahuan pratinjau tanpa notifikasi untuk penyiapan push-rule self-hosted. `false` setara dengan `"off"`.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok asisten yang telah selesai saat streaming pratinjau draf aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per-saluran untuk routing dan siklus hidup sesi yang terikat thread.
- `startupVerification`: mode permintaan self-verification otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba lagi permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran chunk pesan keluar dalam karakter (berlaku saat `chunkMode` adalah `length`).
- `chunkMode`: `length` memecah pesan berdasarkan jumlah karakter; `newline` memecah di batas baris.
- `responsePrefix`: string opsional yang ditambahkan di depan semua balasan keluar untuk saluran ini.
- `ackReaction`: override ack reaction opsional untuk saluran/akun ini.
- `ackReactionScope`: override cakupan ack reaction opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan media masuk.
- `autoJoin`: kebijakan gabung otomatis undangan (`always`, `allowlist`, `off`). Default: `off`. Berlaku untuk semua undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: room/alias yang diizinkan saat `autoJoin` adalah `allowlist`. Entri alias diselesaikan ke ID room selama penanganan undangan; OpenClaw tidak mempercayai status alias yang diklaim oleh room yang diundang.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: mengontrol akses DM setelah OpenClaw bergabung ke room dan mengklasifikasikannya sebagai DM. Ini tidak mengubah apakah undangan otomatis digabung.
- `dm.allowFrom`: entri sebaiknya berupa ID pengguna Matrix lengkap kecuali Anda sudah menyelesaikannya melalui pencarian direktori live.
- `dm.sessionScope`: `per-user` (default) atau `per-room`. Gunakan `per-room` saat Anda ingin setiap room DM Matrix mempertahankan konteks terpisah meskipun peer-nya sama.
- `dm.threadReplies`: override kebijakan thread khusus DM (`off`, `inbound`, `always`). Ini menimpa setelan `threadReplies` tingkat atas untuk penempatan balasan maupun isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec asli Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui permintaan exec. Opsional jika `dm.allowFrom` sudah mengidentifikasi para approver.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override per-akun bernama. Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk entri ini.
- `groups`: peta kebijakan per-room. Pilih ID room atau alias; nama room yang tidak dapat diselesaikan diabaikan saat runtime. Identitas sesi/grup menggunakan ID room stabil setelah resolusi.
- `groups.<room>.account`: batasi satu entri room turunan ke akun Matrix tertentu dalam penyiapan multi-akun.
- `groups.<room>.allowBots`: override tingkat room untuk pengirim bot yang dikonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per-room.
- `groups.<room>.tools`: override allow/deny tool per-room.
- `groups.<room>.autoReply`: override mention-gating tingkat room. `true` menonaktifkan persyaratan mention untuk room itu; `false` memaksanya aktif kembali.
- `groups.<room>.skills`: filter skill tingkat room opsional.
- `groups.<room>.systemPrompt`: cuplikan system prompt tingkat room opsional.
- `rooms`: alias lama untuk `groups`.
- `actions`: pembatasan tool per-aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku group chat dan mention gating
- [Routing Saluran](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
