---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matrix
x-i18n:
    generated_at: "2026-04-21T09:16:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00fa6201d2ee4ac4ae5be3eb18ff687c5c2c9ef70cff12af1413b4c311484b24
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix adalah plugin channel bawaan untuk OpenClaw.
Matrix menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaksi, polling, lokasi, dan E2EE.

## Plugin bawaan

Matrix disertakan sebagai plugin bawaan dalam rilis OpenClaw saat ini, sehingga build paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Matrix, instal secara manual:

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
   - Rilis OpenClaw terkemas saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun Matrix di homeserver Anda.
3. Konfigurasikan `channels.matrix` dengan salah satu dari:
   - `homeserver` + `accessToken`, atau
   - `homeserver` + `userId` + `password`.
4. Mulai ulang Gateway.
5. Mulai DM dengan bot atau undang bot ke room.
   - Undangan Matrix baru hanya berfungsi saat `channels.matrix.autoJoin` mengizinkannya.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

Wizard Matrix meminta:

- URL homeserver
- metode auth: access token atau password
- user ID (hanya auth password)
- nama perangkat opsional
- apakah akan mengaktifkan E2EE
- apakah akan mengonfigurasi akses room dan gabung-otomatis undangan

Perilaku utama wizard:

- Jika env var auth Matrix sudah ada dan akun tersebut belum memiliki auth yang tersimpan di config, wizard menawarkan pintasan env agar auth tetap berada di env var.
- Nama akun dinormalisasi menjadi account ID. Misalnya, `Ops Bot` menjadi `ops-bot`.
- Entri allowlist DM menerima `@user:server` secara langsung; nama tampilan hanya berfungsi saat pencarian direktori live menemukan satu kecocokan yang tepat.
- Entri allowlist room menerima room ID dan alias secara langsung. Pilih `!room:server` atau `#alias:server`; nama yang tidak terselesaikan diabaikan saat runtime oleh resolusi allowlist.
- Dalam mode allowlist auto-join undangan, gunakan hanya target undangan yang stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama room biasa ditolak.
- Untuk menyelesaikan nama room sebelum menyimpan, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` secara default adalah `off`.

Jika Anda membiarkannya tidak disetel, bot tidak akan bergabung ke room yang diundang atau undangan bergaya DM baru, sehingga bot tidak akan muncul di grup baru atau DM undangan kecuali Anda bergabung secara manual terlebih dahulu.

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
Saat kredensial cache ada di sana, OpenClaw menganggap Matrix sudah dikonfigurasi untuk penyiapan, doctor, dan penemuan status channel meskipun auth saat ini tidak disetel langsung di config.

Padanan env var (digunakan saat kunci config tidak disetel):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Untuk akun non-default, gunakan env var dengan cakupan akun:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Contoh untuk akun `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Untuk account ID yang dinormalisasi `ops-bot`, gunakan:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix meng-escape tanda baca dalam account ID agar env var berscope bebas tabrakan.
Misalnya, `-` menjadi `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan env-var saat env var auth tersebut sudah ada dan akun yang dipilih belum memiliki auth Matrix yang tersimpan di config.

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

`autoJoin` berlaku untuk semua undangan Matrix, termasuk undangan bergaya DM. OpenClaw tidak dapat
mengklasifikasikan room yang diundang secara andal sebagai DM atau grup pada saat undangan, jadi semua undangan melewati `autoJoin`
terlebih dahulu. `dm.policy` berlaku setelah bot bergabung dan room diklasifikasikan sebagai DM.

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in.

Setel `channels.matrix.streaming` ke `"partial"` saat Anda ingin OpenClaw mengirim satu balasan pratinjau live,
mengedit pratinjau itu di tempat saat model sedang menghasilkan teks, lalu memfinalkannya saat
balasan selesai:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` adalah default. OpenClaw menunggu balasan final dan mengirimkannya sekali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok asisten saat ini menggunakan pesan teks Matrix normal. Ini mempertahankan perilaku notifikasi legacy Matrix yang mengutamakan pratinjau, sehingga klien bawaan dapat memberi notifikasi pada teks pratinjau streaming pertama alih-alih blok yang sudah selesai.
- `streaming: "quiet"` membuat satu pemberitahuan pratinjau senyap yang dapat diedit untuk blok asisten saat ini. Gunakan ini hanya jika Anda juga mengonfigurasi aturan push penerima untuk edit pratinjau yang telah difinalkan.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan streaming pratinjau diaktifkan, Matrix mempertahankan draf live untuk blok saat ini dan menjaga blok yang sudah selesai sebagai pesan terpisah.
- Saat streaming pratinjau aktif dan `blockStreaming` nonaktif, Matrix mengedit draf live di tempat dan memfinalkan event yang sama saat blok atau giliran selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan streaming pratinjau dan kembali ke pengiriman final normal.
- Balasan media tetap mengirim lampiran seperti biasa. Jika pratinjau usang tidak lagi dapat digunakan ulang dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media final.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate limit yang paling konservatif.

`blockStreaming` tidak mengaktifkan pratinjau draf dengan sendirinya.
Gunakan `streaming: "partial"` atau `streaming: "quiet"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok asisten yang telah selesai tetap terlihat sebagai pesan progres terpisah.

Jika Anda memerlukan notifikasi Matrix bawaan tanpa aturan push kustom, gunakan `streaming: "partial"` untuk perilaku mengutamakan pratinjau atau biarkan `streaming` nonaktif untuk pengiriman final saja. Dengan `streaming: "off"`:

- `blockStreaming: true` mengirim setiap blok yang selesai sebagai pesan Matrix normal yang memicu notifikasi.
- `blockStreaming: false` hanya mengirim balasan akhir yang telah selesai sebagai pesan Matrix normal yang memicu notifikasi.

### Aturan push self-hosted untuk pratinjau final yang senyap

Jika Anda menjalankan infrastruktur Matrix Anda sendiri dan ingin pratinjau senyap hanya memberi notifikasi saat sebuah blok atau
balasan final selesai, setel `streaming: "quiet"` dan tambahkan aturan push per pengguna untuk edit pratinjau yang telah difinalkan.

Biasanya ini adalah penyiapan pengguna penerima, bukan perubahan config global homeserver:

Pemetaan cepat sebelum memulai:

- pengguna penerima = orang yang seharusnya menerima notifikasi
- pengguna bot = akun Matrix OpenClaw yang mengirim balasan
- gunakan access token pengguna penerima untuk panggilan API di bawah
- cocokkan `sender` dalam aturan push dengan MXID lengkap pengguna bot

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

2. Pastikan akun penerima sudah menerima notifikasi push Matrix normal. Aturan pratinjau senyap
   hanya berfungsi jika pengguna tersebut sudah memiliki pusher/perangkat yang berfungsi.

3. Dapatkan access token pengguna penerima.
   - Gunakan token pengguna penerima, bukan token bot.
   - Menggunakan ulang token sesi klien yang sudah ada biasanya paling mudah.
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

Jika ini tidak mengembalikan pusher/perangkat aktif, perbaiki notifikasi Matrix normal terlebih dahulu sebelum menambahkan
aturan OpenClaw di bawah.

OpenClaw menandai edit pratinjau final khusus teks dengan:

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
- `openclaw-finalized-preview-botname`: rule ID yang unik untuk bot ini bagi pengguna penerima ini
- `@bot:example.org`: MXID bot Matrix OpenClaw Anda, bukan MXID pengguna penerima

Penting untuk penyiapan multi-bot:

- Aturan push dikunci dengan `ruleId`. Menjalankan ulang `PUT` terhadap rule ID yang sama akan memperbarui aturan tersebut.
- Jika satu pengguna penerima harus menerima notifikasi untuk beberapa akun bot Matrix OpenClaw, buat satu aturan per bot dengan rule ID unik untuk setiap kecocokan sender.
- Pola sederhana adalah `openclaw-finalized-preview-<botname>`, seperti `openclaw-finalized-preview-ops` atau `openclaw-finalized-preview-support`.

Aturan dievaluasi terhadap pengirim event:

- autentikasi dengan token pengguna penerima
- cocokkan `sender` dengan MXID bot OpenClaw

6. Verifikasi bahwa aturannya ada:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Uji balasan streaming. Dalam mode quiet, room harus menampilkan pratinjau draf senyap dan edit final
   di tempat harus memberi notifikasi setelah blok atau giliran selesai.

Jika Anda perlu menghapus aturan nanti, hapus rule ID yang sama itu dengan token pengguna penerima:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Catatan:

- Buat aturan dengan access token pengguna penerima, bukan token bot.
- Aturan `override` baru yang ditentukan pengguna dimasukkan sebelum aturan suppress default, jadi tidak perlu parameter pengurutan tambahan.
- Ini hanya memengaruhi edit pratinjau khusus teks yang dapat difinalkan dengan aman oleh OpenClaw di tempat. Fallback media dan fallback pratinjau usang tetap menggunakan pengiriman Matrix normal.
- Jika `GET /_matrix/client/v3/pushers` tidak menampilkan pusher, pengguna tersebut belum memiliki pengiriman push Matrix yang berfungsi untuk akun/perangkat ini.

#### Synapse

Untuk Synapse, penyiapan di atas biasanya sudah cukup dengan sendirinya:

- Tidak diperlukan perubahan `homeserver.yaml` khusus untuk notifikasi pratinjau OpenClaw final.
- Jika deployment Synapse Anda sudah mengirim notifikasi push Matrix normal, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utama.
- Jika Anda menjalankan Synapse di belakang reverse proxy atau workers, pastikan `/_matrix/client/.../pushrules/` mencapai Synapse dengan benar.
- Jika Anda menjalankan Synapse workers, pastikan pusher sehat. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / pusher worker yang dikonfigurasi.

#### Tuwunel

Untuk Tuwunel, gunakan alur penyiapan yang sama dan panggilan API `pushrules` yang ditunjukkan di atas:

- Tidak diperlukan config khusus Tuwunel untuk penanda pratinjau final itu sendiri.
- Jika notifikasi Matrix normal sudah berfungsi untuk pengguna tersebut, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utama.
- Jika notifikasi tampak menghilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini di Tuwunel 1.4.2 pada 12 September 2025, dan opsi ini dapat sengaja menekan push ke perangkat lain saat satu perangkat sedang aktif.

## Room bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang dikonfigurasi akan diabaikan.

Gunakan `allowBots` saat Anda memang ingin lalu lintas Matrix antar-agent:

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
- `allowBots: "mentions"` menerima pesan tersebut hanya saat pesan itu secara terlihat menyebut bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa pengaturan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari user ID Matrix yang sama untuk menghindari loop balas-diri.
- Matrix tidak mengekspos tanda bot bawaan di sini; OpenClaw menganggap "ditulis bot" sebagai "dikirim oleh akun Matrix lain yang dikonfigurasi pada Gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di room bersama.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran penuh. Room tak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — plugin mendeteksi status E2EE secara otomatis.

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

Bootstrap status cross-signing dan verifikasi:

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

Hapus backup server saat ini dan buat baseline backup baru. Jika backup key yang tersimpan
tidak dapat dimuat dengan bersih, reset ini juga dapat membuat ulang secret storage agar
cold start di masa mendatang dapat memuat backup key yang baru:

```bash
openclaw matrix verify backup reset --yes
```

Semua perintah `verify` ringkas secara default (termasuk logging SDK internal yang tenang) dan hanya menampilkan diagnostik terperinci dengan `--verbose`.
Gunakan `--json` untuk output lengkap yang dapat dibaca mesin saat membuat skrip.

Dalam penyiapan multi-akun, perintah CLI Matrix menggunakan akun default Matrix implisit kecuali Anda memberikan `--account <id>`.
Jika Anda mengonfigurasi beberapa akun bernama, setel `channels.matrix.defaultAccount` terlebih dahulu atau operasi CLI implisit tersebut akan berhenti dan meminta Anda memilih akun secara eksplisit.
Gunakan `--account` kapan pun Anda ingin operasi verifikasi atau perangkat menargetkan akun bernama secara eksplisit:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Saat enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan error verifikasi mengarah ke kunci config akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

### Apa arti "verified"

OpenClaw menganggap perangkat Matrix ini sebagai terverifikasi hanya jika perangkat ini diverifikasi oleh identitas cross-signing Anda sendiri.
Dalam praktiknya, `openclaw matrix verify status --verbose` mengekspos tiga sinyal kepercayaan:

- `Locally trusted`: perangkat ini dipercaya hanya oleh klien saat ini
- `Cross-signing verified`: SDK melaporkan perangkat ini sebagai terverifikasi melalui cross-signing
- `Signed by owner`: perangkat ini ditandatangani oleh self-signing key Anda sendiri

`Verified by owner` menjadi `yes` hanya saat verifikasi cross-signing atau owner-signing tersedia.
Kepercayaan lokal saja tidak cukup bagi OpenClaw untuk menganggap perangkat ini sepenuhnya terverifikasi.

### Apa yang dilakukan bootstrap

`openclaw matrix verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun Matrix terenkripsi.
Perintah ini melakukan semua hal berikut secara berurutan:

- melakukan bootstrap secret storage, menggunakan kembali recovery key yang ada bila memungkinkan
- melakukan bootstrap cross-signing dan mengunggah public cross-signing key yang belum ada
- mencoba menandai dan melakukan cross-sign pada perangkat saat ini
- membuat backup room-key sisi server baru jika belum ada

Jika homeserver memerlukan interactive auth untuk mengunggah cross-signing key, OpenClaw mencoba unggahan tanpa auth terlebih dahulu, lalu dengan `m.login.dummy`, lalu dengan `m.login.password` saat `channels.matrix.password` dikonfigurasi.

Gunakan `--force-reset-cross-signing` hanya saat Anda memang ingin membuang identitas cross-signing saat ini dan membuat yang baru.

Jika Anda memang ingin membuang backup room-key saat ini dan memulai baseline backup baru
untuk pesan mendatang, gunakan `openclaw matrix verify backup reset --yes`.
Lakukan ini hanya jika Anda menerima bahwa riwayat terenkripsi lama yang tidak dapat dipulihkan akan tetap
tidak tersedia dan bahwa OpenClaw dapat membuat ulang secret storage jika secret backup saat ini
tidak dapat dimuat dengan aman.

### Baseline backup baru

Jika Anda ingin menjaga agar pesan terenkripsi di masa mendatang tetap berfungsi dan menerima kehilangan riwayat lama yang tidak dapat dipulihkan, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Tambahkan `--account <id>` ke setiap perintah saat Anda ingin menargetkan akun Matrix bernama secara eksplisit.

### Perilaku startup

Saat `encryption: true`, Matrix secara default menetapkan `startupVerification` ke `"if-unverified"`.
Saat startup, jika perangkat ini masih belum terverifikasi, Matrix akan meminta verifikasi diri di klien Matrix lain,
melewati permintaan duplikat saat sudah ada yang tertunda, dan menerapkan cooldown lokal sebelum mencoba lagi setelah restart.
Percobaan permintaan yang gagal secara default mencoba lagi lebih cepat daripada pembuatan permintaan yang berhasil.
Setel `startupVerification: "off"` untuk menonaktifkan permintaan startup otomatis, atau sesuaikan `startupVerificationCooldownHours`
jika Anda ingin jendela percobaan ulang yang lebih pendek atau lebih panjang.

Startup juga secara otomatis melakukan pass bootstrap crypto yang konservatif.
Pass itu mencoba menggunakan kembali secret storage dan identitas cross-signing saat ini terlebih dahulu, serta menghindari reset cross-signing kecuali Anda menjalankan alur perbaikan bootstrap eksplisit.

Jika startup masih menemukan status bootstrap yang rusak, OpenClaw dapat mencoba jalur perbaikan yang dijaga bahkan saat `channels.matrix.password` tidak dikonfigurasi.
Jika homeserver memerlukan UIA berbasis password untuk perbaikan itu, OpenClaw mencatat peringatan dan menjaga startup tetap non-fatal alih-alih membatalkan bot.
Jika perangkat saat ini sudah ditandatangani owner, OpenClaw mempertahankan identitas itu alih-alih meresetnya secara otomatis.

Lihat [Matrix migration](/id/install/migrating-matrix) untuk alur upgrade lengkap, batasan, perintah pemulihan, dan pesan migrasi umum.

### Pemberitahuan verifikasi

Matrix memposting pemberitahuan siklus hidup verifikasi langsung ke room verifikasi DM ketat sebagai pesan `m.notice`.
Itu mencakup:

- pemberitahuan permintaan verifikasi
- pemberitahuan verifikasi siap (dengan panduan eksplisit "Verify by emoji")
- pemberitahuan mulai dan selesai verifikasi
- detail SAS (emoji dan desimal) bila tersedia

Permintaan verifikasi masuk dari klien Matrix lain dilacak dan diterima otomatis oleh OpenClaw.
Untuk alur verifikasi diri, OpenClaw juga memulai alur SAS secara otomatis saat verifikasi emoji tersedia dan mengonfirmasi sisinya sendiri.
Untuk permintaan verifikasi dari pengguna/perangkat Matrix lain, OpenClaw menerima permintaan secara otomatis lalu menunggu alur SAS berjalan normal.
Anda tetap perlu membandingkan emoji atau SAS desimal di klien Matrix Anda dan mengonfirmasi "They match" di sana untuk menyelesaikan verifikasi.

OpenClaw tidak menerima otomatis alur duplikat yang dimulai sendiri secara membabi buta. Startup melewati pembuatan permintaan baru saat permintaan verifikasi diri sudah tertunda.

Pemberitahuan protokol/sistem verifikasi tidak diteruskan ke pipeline chat agent, sehingga tidak menghasilkan `NO_REPLY`.

### Kebersihan perangkat

Perangkat Matrix yang dikelola OpenClaw lama dapat menumpuk di akun dan membuat kepercayaan room terenkripsi lebih sulit dipahami.
Daftarkan dengan:

```bash
openclaw matrix devices list
```

Hapus perangkat yang dikelola OpenClaw yang sudah usang dengan:

```bash
openclaw matrix devices prune-stale
```

### Penyimpanan crypto

Matrix E2EE menggunakan jalur crypto Rust `matrix-js-sdk` resmi di Node, dengan `fake-indexeddb` sebagai shim IndexedDB. Status crypto dipertahankan ke file snapshot (`crypto-idb-snapshot.json`) dan dipulihkan saat startup. File snapshot adalah status runtime sensitif yang disimpan dengan izin file yang ketat.

Status runtime terenkripsi berada di bawah root per-akun, per-pengguna, per-hash token di
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Direktori itu berisi sync store (`bot-storage.json`), crypto store (`crypto/`),
file recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
binding thread (`thread-bindings.json`), dan status verifikasi startup (`startup-verification.json`).
Saat token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang sudah ada
untuk tuple akun/homeserver/pengguna tersebut sehingga status sync sebelumnya, status crypto, binding thread,
dan status verifikasi startup tetap terlihat.

## Manajemen profil

Perbarui profil mandiri Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` saat Anda ingin menargetkan akun Matrix bernama secara eksplisit.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda memberikan URL avatar `http://` atau `https://`, OpenClaw akan mengunggahnya ke Matrix terlebih dahulu dan menyimpan kembali URL `mxc://` yang telah diselesaikan ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis maupun pengiriman message-tool.

- `dm.sessionScope: "per-user"` (default) menjaga perutean DM Matrix tetap berdasarkan pengirim, sehingga beberapa room DM dapat berbagi satu sesi saat semuanya terurai ke peer yang sama.
- `dm.sessionScope: "per-room"` mengisolasi setiap room DM Matrix ke kunci sesinya sendiri sambil tetap menggunakan auth DM normal dan pemeriksaan allowlist.
- Binding percakapan Matrix eksplisit tetap lebih diutamakan daripada `dm.sessionScope`, sehingga room dan thread yang terikat tetap mempertahankan sesi target yang dipilih.
- `threadReplies: "off"` menjaga balasan tetap di level atas dan menjaga pesan thread masuk tetap pada sesi induk.
- `threadReplies: "inbound"` membalas di dalam thread hanya ketika pesan masuk memang sudah berada di thread tersebut.
- `threadReplies: "always"` menjaga balasan room tetap di thread yang berakar pada pesan pemicu dan merutekan percakapan itu melalui sesi berscope thread yang cocok dari pesan pemicu pertama.
- `dm.threadReplies` menimpa pengaturan tingkat atas hanya untuk DM. Misalnya, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan thread masuk menyertakan pesan akar thread sebagai konteks agent tambahan.
- Pengiriman message-tool otomatis mewarisi thread Matrix saat ini ketika targetnya adalah room yang sama, atau target pengguna DM yang sama, kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM untuk sesi yang sama hanya aktif saat metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean normal berbasis pengguna.
- Saat OpenClaw melihat room DM Matrix berbenturan dengan room DM lain pada sesi DM Matrix bersama yang sama, OpenClaw memposting `m.notice` satu kali di room itu dengan escape hatch `/focus` saat binding thread diaktifkan dan petunjuk `dm.sessionScope`.
- Binding thread runtime didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat thread berfungsi di room dan DM Matrix.
- `/focus` level atas di room/DM Matrix membuat thread Matrix baru dan mengikatnya ke sesi target saat `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada akan mengikat thread saat ini itu.

## Binding percakapan ACP

Room, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM, room, atau thread Matrix yang sudah ada dan ingin terus Anda gunakan.
- Di DM atau room Matrix level atas, DM/room saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang di-spawn.
- Di dalam thread Matrix yang sudah ada, `--bind here` mengikat thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat thread Matrix anak.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, saat OpenClaw perlu membuat atau mengikat thread Matrix anak.

### Konfigurasi binding thread

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per-channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn yang terikat thread Matrix bersifat opt-in:

- Setel `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` level atas membuat dan mengikat thread Matrix baru.
- Setel `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` mengikat sesi ACP ke thread Matrix.

## Reaksi

Matrix mendukung aksi reaksi keluar, notifikasi reaksi masuk, dan reaksi ack masuk.

- Tooling reaksi keluar dikendalikan oleh `channels["matrix"].actions.reactions`.
- `react` menambahkan reaksi ke event Matrix tertentu.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix tertentu.
- `emoji=""` menghapus reaksi akun bot sendiri pada event itu.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari akun bot.

Cakupan reaksi ack diselesaikan dalam urutan standar OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agent

Cakupan reaksi ack diselesaikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Mode notifikasi reaksi diselesaikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Perilaku:

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan saat event itu menargetkan pesan Matrix yang ditulis bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaksi.
- Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` tersendiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` saat pesan room Matrix memicu agent. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- Riwayat room Matrix hanya untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix bersifat pending-only: OpenClaw membuffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela itu saat mention atau pemicu lain datang.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan itu tetap berada di body inbound utama untuk giliran tersebut.
- Retry dari event Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser maju ke pesan room yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol `contextVisibility` bersama untuk konteks room tambahan seperti teks balasan yang diambil, akar thread, dan riwayat pending.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist room/pengguna yang aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Pengaturan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan masuk itu sendiri dapat memicu balasan.
Otorisasi pemicu tetap berasal dari pengaturan `groupPolicy`, `groups`, `groupAllowFrom`, dan kebijakan DM.

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

Lihat [Groups](/id/channels/groups) untuk perilaku gating mention dan allowlist.

Contoh pairing untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirim pesan kepada Anda sebelum persetujuan, OpenClaw menggunakan kembali kode pairing pending yang sama dan dapat mengirim balasan pengingat lagi setelah cooldown singkat alih-alih membuat kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Perbaikan room direct

Jika status direct-message tidak sinkron, OpenClaw dapat berakhir dengan mapping `m.direct` usang yang menunjuk ke room solo lama alih-alih DM live. Periksa mapping saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Alur perbaikan:

- mengutamakan DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat mana pun yang saat ini sudah diikuti dengan pengguna itu
- membuat room direct baru dan menulis ulang `m.direct` jika tidak ada DM sehat

Alur perbaikan tidak otomatis menghapus room lama. Alur ini hanya memilih DM yang sehat dan memperbarui mapping agar pengiriman Matrix baru, pemberitahuan verifikasi, dan alur direct-message lain kembali menargetkan room yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native untuk akun Matrix. Tombol
perutean DM/channel native tetap berada di bawah config persetujuan exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; fallback ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Approver harus berupa user ID Matrix seperti `@owner:example.org`. Matrix otomatis mengaktifkan persetujuan native saat `enabled` tidak disetel atau `"auto"` dan setidaknya satu approver dapat diselesaikan. Persetujuan exec menggunakan `execApprovals.approvers` terlebih dahulu dan dapat fallback ke `channels.matrix.dm.allowFrom`. Persetujuan Plugin mengotorisasi melalui `channels.matrix.dm.allowFrom`. Setel `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan native secara eksplisit. Jika tidak, permintaan persetujuan akan fallback ke rute persetujuan lain yang dikonfigurasi atau ke kebijakan fallback persetujuan.

Perutean native Matrix mendukung kedua jenis persetujuan:

- `channels.matrix.execApprovals.*` mengontrol mode fanout DM/channel native untuk prompt persetujuan Matrix.
- Persetujuan exec menggunakan set approver exec dari `execApprovals.approvers` atau `channels.matrix.dm.allowFrom`.
- Persetujuan Plugin menggunakan allowlist DM Matrix dari `channels.matrix.dm.allowFrom`.
- Pintasan reaksi Matrix dan pembaruan pesan berlaku untuk persetujuan exec maupun Plugin.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM approver
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM approver dan room atau DM Matrix asal

Prompt persetujuan Matrix menanam pintasan reaksi pada pesan persetujuan utama:

- `✅` = izinkan sekali
- `❌` = tolak
- `♾️` = selalu izinkan saat keputusan itu diizinkan oleh kebijakan exec yang efektif

Approver dapat bereaksi pada pesan itu atau menggunakan perintah slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya approver yang berhasil diselesaikan yang dapat menyetujui atau menolak. Untuk persetujuan exec, pengiriman channel menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Override per-akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumentasi terkait: [Exec approvals](/id/tools/exec-approvals)

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
Anda dapat membatasi entri room turunan ke satu akun Matrix dengan `groups.<room>.account`.
Entri tanpa `account` tetap dibagikan di semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi saat akun default dikonfigurasi langsung di `channels.matrix.*` tingkat atas.
Default auth bersama parsial tidak dengan sendirinya membuat akun default implisit yang terpisah. OpenClaw hanya mensintesis akun `default` tingkat atas saat default tersebut memiliki auth baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama tetap dapat ditemukan dari `homeserver` plus `userId` saat kredensial cache memenuhi auth nanti.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke kunci akun bernama yang sudah ada, promosi perbaikan/penyiapan dari satu akun ke multi-akun mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru. Hanya kunci auth/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan itu; kunci kebijakan pengiriman bersama tetap berada di tingkat atas.
Setel `defaultAccount` saat Anda ingin OpenClaw memprioritaskan satu akun Matrix bernama untuk perutean implisit, probing, dan operasi CLI.
Jika beberapa akun Matrix dikonfigurasi dan salah satu account id adalah `default`, OpenClaw menggunakan akun itu secara implisit bahkan saat `defaultAccount` tidak disetel.
Jika Anda mengonfigurasi beberapa akun bernama, setel `defaultAccount` atau berikan `--account <id>` untuk perintah CLI yang bergantung pada pemilihan akun implisit.
Berikan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` saat Anda ingin menimpa pemilihan implisit itu untuk satu perintah.

Lihat [Configuration reference](/id/gateway/configuration-reference#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda
secara eksplisit mengaktifkannya per akun.

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
`http://matrix.example.org:8008` tetap diblokir. Gunakan `https://` bila memungkinkan.

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
OpenClaw menggunakan pengaturan proxy yang sama untuk lalu lintas runtime Matrix dan probe status akun.

## Resolusi target

Matrix menerima bentuk target berikut di mana pun OpenClaw meminta target room atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

Pencarian direktori live menggunakan akun Matrix yang sedang login:

- Pencarian pengguna melakukan kueri ke direktori pengguna Matrix di homeserver tersebut.
- Pencarian room menerima room ID dan alias eksplisit secara langsung, lalu fallback ke pencarian nama room yang sudah diikuti untuk akun tersebut.
- Pencarian nama room yang sudah diikuti bersifat best-effort. Jika nama room tidak dapat diselesaikan menjadi ID atau alias, nama itu diabaikan oleh resolusi allowlist runtime.

## Referensi konfigurasi

- `enabled`: aktifkan atau nonaktifkan channel.
- `name`: label opsional untuk akun.
- `defaultAccount`: account ID pilihan saat beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun Matrix ini terhubung ke homeserver privat/internal. Aktifkan ini saat homeserver diselesaikan ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Akun bernama dapat menimpa default tingkat atas dengan `proxy` mereka sendiri.
- `userId`: Matrix user ID lengkap, misalnya `@bot:example.org`.
- `accessToken`: access token untuk auth berbasis token. Nilai plaintext dan nilai SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` di seluruh provider env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).
- `password`: password untuk login berbasis password. Nilai plaintext dan nilai SecretRef didukung.
- `deviceId`: Matrix device ID eksplisit.
- `deviceName`: nama tampilan perangkat untuk login password.
- `avatarUrl`: URL avatar mandiri yang disimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum event yang diambil selama sync startup.
- `encryption`: aktifkan E2EE.
- `allowlistOnly`: saat `true`, menaikkan kebijakan room `open` menjadi `allowlist`, dan memaksa semua kebijakan DM aktif kecuali `disabled` (termasuk `pairing` dan `open`) menjadi `allowlist`. Tidak memengaruhi kebijakan `disabled`.
- `allowBots`: izinkan pesan dari akun Matrix OpenClaw lain yang dikonfigurasi (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist user ID untuk lalu lintas room. Matrix user ID lengkap paling aman; kecocokan direktori persis diselesaikan saat startup dan saat allowlist berubah ketika monitor berjalan. Nama yang tidak terselesaikan diabaikan.
- `historyLimit`: jumlah maksimal pesan room yang disertakan sebagai konteks riwayat grup. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, `all`, atau `batched`.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks Matrix keluar.
- `streaming`: `off` (default), `"partial"`, `"quiet"`, `true`, atau `false`. `"partial"` dan `true` mengaktifkan pembaruan draf mengutamakan pratinjau dengan pesan teks Matrix normal. `"quiet"` menggunakan pemberitahuan pratinjau tanpa notifikasi untuk penyiapan aturan push self-hosted. `false` setara dengan `"off"`.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok asisten yang telah selesai saat streaming pratinjau draf aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per-channel untuk perutean dan siklus hidup sesi yang terikat thread.
- `startupVerification`: mode permintaan verifikasi diri otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba lagi permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran chunk pesan keluar dalam karakter (berlaku saat `chunkMode` adalah `length`).
- `chunkMode`: `length` membagi pesan berdasarkan jumlah karakter; `newline` membagi pada batas baris.
- `responsePrefix`: string opsional yang diawali ke semua balasan keluar untuk channel ini.
- `ackReaction`: override reaksi ack opsional untuk channel/akun ini.
- `ackReactionScope`: override cakupan reaksi ack opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan media masuk.
- `autoJoin`: kebijakan gabung-otomatis undangan (`always`, `allowlist`, `off`). Default: `off`. Berlaku untuk semua undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: room/alias yang diizinkan saat `autoJoin` adalah `allowlist`. Entri alias diselesaikan menjadi room ID selama penanganan undangan; OpenClaw tidak mempercayai status alias yang diklaim oleh room yang mengundang.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: mengontrol akses DM setelah OpenClaw bergabung ke room dan mengklasifikasikannya sebagai DM. Ini tidak mengubah apakah undangan digabung secara otomatis.
- `dm.allowFrom`: allowlist user ID untuk lalu lintas DM. Matrix user ID lengkap paling aman; kecocokan direktori persis diselesaikan saat startup dan saat allowlist berubah ketika monitor berjalan. Nama yang tidak terselesaikan diabaikan.
- `dm.sessionScope`: `per-user` (default) atau `per-room`. Gunakan `per-room` saat Anda ingin setiap room DM Matrix mempertahankan konteks terpisah meskipun peer-nya sama.
- `dm.threadReplies`: override kebijakan thread hanya untuk DM (`off`, `inbound`, `always`). Ini menimpa pengaturan `threadReplies` tingkat atas untuk penempatan balasan dan isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec native Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix user ID yang diizinkan menyetujui permintaan exec. Opsional saat `dm.allowFrom` sudah mengidentifikasi approver.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override bernama per-akun. Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk entri ini.
- `groups`: peta kebijakan per-room. Pilih room ID atau alias; nama room yang tidak terselesaikan diabaikan saat runtime. Identitas sesi/grup menggunakan room ID stabil setelah resolusi.
- `groups.<room>.account`: batasi satu entri room turunan ke akun Matrix tertentu dalam penyiapan multi-akun.
- `groups.<room>.allowBots`: override tingkat room untuk pengirim bot yang dikonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per-room.
- `groups.<room>.tools`: override allow/deny tool per-room.
- `groups.<room>.autoReply`: override gating mention tingkat room. `true` menonaktifkan persyaratan mention untuk room itu; `false` memaksanya aktif kembali.
- `groups.<room>.skills`: filter skill tingkat room opsional.
- `groups.<room>.systemPrompt`: potongan system prompt tingkat room opsional.
- `rooms`: alias lama untuk `groups`.
- `actions`: gating tool per-aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Channels Overview](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — auth DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan gating mention
- [Channel Routing](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
