---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matrix
x-i18n:
    generated_at: "2026-04-07T09:15:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d53baa2ea5916cd00a99cae0ded3be41ffa13c9a69e8ea8461eb7baa6a99e13c
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix adalah plugin channel Matrix bawaan untuk OpenClaw.
Plugin ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaction, polling, lokasi, dan E2EE.

## Plugin bawaan

Matrix dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket normal
tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Matrix, instal
secara manual:

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
5. Mulai DM dengan bot atau undang bot ke room.
   - Undangan Matrix baru hanya berfungsi saat `channels.matrix.autoJoin` mengizinkannya.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

Yang benar-benar ditanyakan wizard Matrix:

- URL homeserver
- metode auth: access token atau password
- ID pengguna hanya saat Anda memilih auth password
- nama perangkat opsional
- apakah akan mengaktifkan E2EE
- apakah akan mengonfigurasi akses room Matrix sekarang
- apakah akan mengonfigurasi auto-join undangan Matrix sekarang
- saat auto-join undangan diaktifkan, apakah seharusnya `allowlist`, `always`, atau `off`

Perilaku wizard yang penting:

- Jika env var auth Matrix sudah ada untuk akun yang dipilih, dan akun itu belum memiliki auth yang tersimpan di config, wizard menawarkan pintasan env agar penyiapan dapat menyimpan auth di env vars alih-alih menyalin rahasia ke config.
- Saat Anda menambahkan akun Matrix lain secara interaktif, nama akun yang dimasukkan dinormalisasi menjadi ID akun yang digunakan di config dan env vars. Sebagai contoh, `Ops Bot` menjadi `ops-bot`.
- Prompt allowlist DM langsung menerima nilai `@user:server` lengkap. Nama tampilan hanya berfungsi saat pencarian direktori live menemukan satu kecocokan persis; jika tidak, wizard meminta Anda mencoba lagi dengan ID Matrix lengkap.
- Prompt allowlist room langsung menerima ID room dan alias. Prompt ini juga dapat me-resolve nama room yang sudah tergabung secara live, tetapi nama yang tidak ter-resolve hanya disimpan seperti yang diketik selama penyiapan dan diabaikan nanti oleh resolusi allowlist runtime. Gunakan `!room:server` atau `#alias:server`.
- Wizard sekarang menampilkan peringatan eksplisit sebelum langkah auto-join undangan karena `channels.matrix.autoJoin` default-nya `off`; agen tidak akan bergabung ke room yang diundang atau undangan gaya DM baru kecuali Anda mengaturnya.
- Dalam mode allowlist auto-join undangan, gunakan hanya target undangan yang stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama room biasa ditolak.
- Identitas room/sesi runtime menggunakan ID room Matrix yang stabil. Alias yang dideklarasikan room hanya digunakan sebagai input pencarian, bukan sebagai kunci sesi jangka panjang atau identitas grup yang stabil.
- Untuk me-resolve nama room sebelum menyimpannya, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` default-nya `off`.

Jika Anda membiarkannya tidak diatur, bot tidak akan bergabung ke room yang diundang atau undangan gaya DM baru, sehingga bot tidak akan muncul di grup baru atau DM yang diundang kecuali Anda bergabung secara manual terlebih dahulu.

Atur `autoJoin: "allowlist"` bersama `autoJoinAllowlist` untuk membatasi undangan mana yang diterimanya, atau atur `autoJoin: "always"` jika Anda ingin bot bergabung ke setiap undangan.

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
Saat kredensial cache ada di sana, OpenClaw memperlakukan Matrix sebagai telah dikonfigurasi untuk penyiapan, doctor, dan penemuan status channel meskipun auth saat ini tidak diatur langsung di config.

Padanan environment variable (digunakan saat kunci config tidak diatur):

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

Untuk ID akun yang dinormalisasi `ops-bot`, gunakan:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix melakukan escape pada tanda baca di ID akun agar env vars berskala akun bebas tabrakan.
Sebagai contoh, `-` menjadi `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan env-var saat env vars auth tersebut sudah ada dan akun yang dipilih belum memiliki auth Matrix yang tersimpan di config.

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

`autoJoin` berlaku untuk undangan Matrix secara umum, bukan hanya undangan room/grup.
Itu termasuk undangan gaya DM baru. Pada saat undangan, OpenClaw tidak dapat mengetahui secara andal apakah
room yang diundang nantinya akan diperlakukan sebagai DM atau grup, jadi semua undangan melewati keputusan
`autoJoin` yang sama terlebih dahulu. `dm.policy` tetap berlaku setelah bot bergabung dan room tersebut
diklasifikasikan sebagai DM, jadi `autoJoin` mengendalikan perilaku bergabung sementara `dm.policy` mengendalikan perilaku
balasan/akses.

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in.

Atur `channels.matrix.streaming` ke `"partial"` saat Anda ingin OpenClaw mengirim satu balasan pratinjau live,
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

- `streaming: "off"` adalah default. OpenClaw menunggu balasan final dan mengirimkannya satu kali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok asisten saat ini menggunakan pesan teks Matrix normal. Ini mempertahankan perilaku notifikasi lama Matrix yang mengutamakan pratinjau, sehingga klien bawaan dapat memberi notifikasi pada teks pratinjau streaming pertama alih-alih blok yang telah selesai.
- `streaming: "quiet"` membuat satu pemberitahuan pratinjau senyap yang dapat diedit untuk blok asisten saat ini. Gunakan ini hanya jika Anda juga mengonfigurasi aturan push penerima untuk edit pratinjau yang telah difinalkan.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan streaming pratinjau diaktifkan, Matrix mempertahankan draf live untuk blok saat ini dan menyimpan blok yang sudah selesai sebagai pesan terpisah.
- Saat streaming pratinjau aktif dan `blockStreaming` nonaktif, Matrix mengedit draf live di tempat dan memfinalkan event yang sama saat blok atau giliran selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan streaming pratinjau dan kembali ke pengiriman final normal.
- Balasan media tetap mengirim lampiran secara normal. Jika pratinjau usang tidak lagi aman untuk digunakan ulang, OpenClaw akan meredaksinya sebelum mengirim balasan media final.
- Edit pratinjau menimbulkan panggilan API Matrix tambahan. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate limit yang paling konservatif.

`blockStreaming` tidak mengaktifkan draf pratinjau dengan sendirinya.
Gunakan `streaming: "partial"` atau `streaming: "quiet"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok asisten yang telah selesai tetap terlihat sebagai pesan progres terpisah.

Jika Anda memerlukan notifikasi Matrix bawaan tanpa aturan push kustom, gunakan `streaming: "partial"` untuk perilaku pratinjau-terlebih-dahulu atau biarkan `streaming` nonaktif untuk pengiriman final-saja. Dengan `streaming: "off"`:

- `blockStreaming: true` mengirim setiap blok yang telah selesai sebagai pesan Matrix normal yang memberi notifikasi.
- `blockStreaming: false` hanya mengirim balasan final yang lengkap sebagai pesan Matrix normal yang memberi notifikasi.

### Aturan push self-hosted untuk pratinjau final yang senyap

Jika Anda menjalankan infrastruktur Matrix Anda sendiri dan ingin pratinjau senyap memberi notifikasi hanya saat sebuah blok atau
balasan final selesai, atur `streaming: "quiet"` dan tambahkan aturan push per pengguna untuk edit pratinjau yang telah difinalkan.

Biasanya ini adalah penyiapan pengguna penerima, bukan perubahan config global homeserver:

Peta cepat sebelum memulai:

- pengguna penerima = orang yang seharusnya menerima notifikasi
- pengguna bot = akun Matrix OpenClaw yang mengirim balasan
- gunakan access token pengguna penerima untuk panggilan API di bawah ini
- cocokkan `sender` di aturan push dengan MXID lengkap pengguna bot

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

2. Pastikan akun penerima sudah menerima notifikasi push Matrix normal. Aturan
   pratinjau senyap hanya berfungsi jika pengguna itu sudah memiliki pusher/perangkat yang berfungsi.

3. Dapatkan access token pengguna penerima.
   - Gunakan token pengguna penerima, bukan token bot.
   - Menggunakan ulang token sesi klien yang sudah ada biasanya yang paling mudah.
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

Jika ini mengembalikan tidak ada pusher/perangkat aktif, perbaiki notifikasi Matrix normal terlebih dahulu sebelum menambahkan
aturan OpenClaw di bawah.

OpenClaw menandai edit pratinjau final hanya-teks dengan:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Buat aturan push override untuk setiap akun penerima yang seharusnya menerima notifikasi ini:

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

Ganti nilai berikut sebelum Anda menjalankan perintah:

- `https://matrix.example.org`: URL dasar homeserver Anda
- `$USER_ACCESS_TOKEN`: access token pengguna penerima
- `openclaw-finalized-preview-botname`: ID aturan yang unik untuk bot ini bagi pengguna penerima ini
- `@bot:example.org`: MXID bot Matrix OpenClaw Anda, bukan MXID pengguna penerima

Penting untuk penyiapan multi-bot:

- Aturan push diberi kunci berdasarkan `ruleId`. Menjalankan ulang `PUT` terhadap ID aturan yang sama akan memperbarui aturan tersebut.
- Jika satu pengguna penerima harus memberi notifikasi untuk beberapa akun bot Matrix OpenClaw, buat satu aturan per bot dengan ID aturan unik untuk setiap kecocokan pengirim.
- Pola sederhana adalah `openclaw-finalized-preview-<botname>`, seperti `openclaw-finalized-preview-ops` atau `openclaw-finalized-preview-support`.

Aturan ini dievaluasi terhadap pengirim event:

- autentikasi dengan token pengguna penerima
- cocokkan `sender` dengan MXID bot OpenClaw

6. Verifikasi bahwa aturan tersebut ada:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Uji balasan yang di-stream. Dalam mode senyap, room seharusnya menampilkan pratinjau draf senyap dan edit final
   di tempat seharusnya memberi notifikasi setelah blok atau giliran selesai.

Jika Anda perlu menghapus aturan nanti, hapus ID aturan yang sama itu dengan token pengguna penerima:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Catatan:

- Buat aturan dengan access token pengguna penerima, bukan token bot.
- Aturan `override` baru yang ditentukan pengguna disisipkan di depan aturan suppress default, jadi tidak diperlukan parameter pengurutan tambahan.
- Ini hanya memengaruhi edit pratinjau hanya-teks yang dapat difinalkan OpenClaw secara aman di tempat. Fallback media dan fallback pratinjau usang tetap menggunakan pengiriman Matrix normal.
- Jika `GET /_matrix/client/v3/pushers` tidak menunjukkan pusher, pengguna tersebut belum memiliki pengiriman push Matrix yang berfungsi untuk akun/perangkat ini.

#### Synapse

Untuk Synapse, penyiapan di atas biasanya sudah cukup dengan sendirinya:

- Tidak diperlukan perubahan `homeserver.yaml` khusus untuk notifikasi pratinjau OpenClaw yang telah difinalkan.
- Jika deployment Synapse Anda sudah mengirim notifikasi push Matrix normal, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utama.
- Jika Anda menjalankan Synapse di belakang reverse proxy atau workers, pastikan `/_matrix/client/.../pushrules/` menjangkau Synapse dengan benar.
- Jika Anda menjalankan Synapse workers, pastikan pusher sehat. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / worker pusher yang dikonfigurasi.

#### Tuwunel

Untuk Tuwunel, gunakan alur penyiapan dan panggilan API aturan push yang sama seperti ditunjukkan di atas:

- Tidak diperlukan config khusus Tuwunel untuk penanda pratinjau final itu sendiri.
- Jika notifikasi Matrix normal sudah berfungsi untuk pengguna itu, token pengguna + panggilan `pushrules` di atas adalah langkah penyiapan utama.
- Jika notifikasi tampak menghilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini di Tuwunel 1.4.2 pada 12 September 2025, dan ini dapat secara sengaja menekan push ke perangkat lain saat satu perangkat aktif.

## Enkripsi dan verifikasi

Dalam room terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar terenkripsi bersama lampiran lengkapnya. Room yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — plugin mendeteksi status E2EE secara otomatis.

### Room bot ke bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang telah dikonfigurasi diabaikan.

Gunakan `allowBots` saat Anda memang ingin lalu lintas Matrix antar agen:

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

- `allowBots: true` menerima pesan dari akun bot Matrix terkonfigurasi lain di room dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya saat mereka secara terlihat menyebut bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` menggantikan pengaturan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balas diri.
- Matrix tidak mengekspos penanda bot bawaan di sini; OpenClaw memperlakukan "ditulis bot" sebagai "dikirim oleh akun Matrix terkonfigurasi lain pada gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di room bersama.

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

Sertakan recovery key tersimpan dalam output yang dapat dibaca mesin:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Bootstrap cross-signing dan status verifikasi:

```bash
openclaw matrix verify bootstrap
```

Dukungan multi-akun: gunakan `channels.matrix.accounts` dengan kredensial per akun dan `name` opsional. Lihat [Referensi konfigurasi](/id/gateway/configuration-reference#multi-account-all-channels) untuk pola bersama.

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

Hapus backup server saat ini dan buat baseline backup baru. Jika kunci backup yang tersimpan
tidak dapat dimuat dengan bersih, reset ini juga dapat membuat ulang secret storage sehingga
cold start di masa depan dapat memuat kunci backup yang baru:

```bash
openclaw matrix verify backup reset --yes
```

Semua perintah `verify` ringkas secara default (termasuk logging SDK internal yang senyap) dan hanya menampilkan diagnostik terperinci dengan `--verbose`.
Gunakan `--json` untuk output lengkap yang dapat dibaca mesin saat membuat skrip.

Dalam penyiapan multi-akun, perintah CLI Matrix menggunakan akun default Matrix implisit kecuali Anda meneruskan `--account <id>`.
Jika Anda mengonfigurasi beberapa akun bernama, atur `channels.matrix.defaultAccount` terlebih dahulu atau operasi CLI implisit tersebut akan berhenti dan meminta Anda memilih akun secara eksplisit.
Gunakan `--account` kapan pun Anda ingin operasi verifikasi atau perangkat menargetkan akun bernama secara eksplisit:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Saat enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan error verifikasi menunjuk ke kunci config akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

### Arti "verified"

OpenClaw memperlakukan perangkat Matrix ini sebagai terverifikasi hanya saat perangkat ini diverifikasi oleh identitas cross-signing Anda sendiri.
Dalam praktiknya, `openclaw matrix verify status --verbose` mengekspos tiga sinyal kepercayaan:

- `Locally trusted`: perangkat ini dipercaya hanya oleh klien saat ini
- `Cross-signing verified`: SDK melaporkan perangkat ini sebagai terverifikasi melalui cross-signing
- `Signed by owner`: perangkat ini ditandatangani oleh self-signing key Anda sendiri

`Verified by owner` menjadi `yes` hanya saat verifikasi cross-signing atau owner-signing ada.
Kepercayaan lokal saja tidak cukup bagi OpenClaw untuk memperlakukan perangkat sebagai sepenuhnya terverifikasi.

### Yang dilakukan bootstrap

`openclaw matrix verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun Matrix terenkripsi.
Perintah ini melakukan semua hal berikut secara berurutan:

- melakukan bootstrap secret storage, menggunakan kembali recovery key yang ada bila memungkinkan
- melakukan bootstrap cross-signing dan mengunggah public cross-signing key yang belum ada
- mencoba menandai dan men-cross-sign perangkat saat ini
- membuat backup room-key sisi server baru jika belum ada

Jika homeserver memerlukan auth interaktif untuk mengunggah kunci cross-signing, OpenClaw mencoba unggahan tanpa auth terlebih dahulu, lalu dengan `m.login.dummy`, lalu dengan `m.login.password` saat `channels.matrix.password` dikonfigurasi.

Gunakan `--force-reset-cross-signing` hanya jika Anda memang ingin membuang identitas cross-signing saat ini dan membuat yang baru.

Jika Anda memang ingin membuang backup room-key saat ini dan memulai baseline backup
baru untuk pesan di masa depan, gunakan `openclaw matrix verify backup reset --yes`.
Lakukan ini hanya jika Anda menerima bahwa riwayat terenkripsi lama yang tidak dapat dipulihkan akan tetap
tidak tersedia dan bahwa OpenClaw dapat membuat ulang secret storage jika secret backup saat ini
tidak dapat dimuat dengan aman.

### Baseline backup baru

Jika Anda ingin menjaga pesan terenkripsi di masa depan tetap berfungsi dan menerima kehilangan riwayat lama yang tidak dapat dipulihkan, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Tambahkan `--account <id>` ke setiap perintah saat Anda ingin menargetkan akun Matrix bernama secara eksplisit.

### Perilaku saat startup

Saat `encryption: true`, Matrix menetapkan default `startupVerification` ke `"if-unverified"`.
Saat startup, jika perangkat ini masih belum terverifikasi, Matrix akan meminta self-verification di klien Matrix lain,
melewati permintaan duplikat saat satu permintaan sudah tertunda, dan menerapkan cooldown lokal sebelum mencoba lagi setelah restart.
Percobaan permintaan yang gagal secara default dicoba ulang lebih cepat daripada pembuatan permintaan yang berhasil.
Atur `startupVerification: "off"` untuk menonaktifkan permintaan startup otomatis, atau sesuaikan `startupVerificationCooldownHours`
jika Anda ingin jendela percobaan ulang yang lebih pendek atau lebih panjang.

Startup juga melakukan pass bootstrap crypto konservatif secara otomatis.
Pass tersebut mencoba menggunakan kembali secret storage dan identitas cross-signing saat ini terlebih dahulu, dan menghindari reset cross-signing kecuali Anda menjalankan alur perbaikan bootstrap eksplisit.

Jika startup menemukan status bootstrap rusak dan `channels.matrix.password` dikonfigurasi, OpenClaw dapat mencoba jalur perbaikan yang lebih ketat.
Jika perangkat saat ini sudah ditandatangani pemilik, OpenClaw mempertahankan identitas itu alih-alih meresetnya secara otomatis.

Meningkatkan dari plugin Matrix publik sebelumnya:

- OpenClaw secara otomatis menggunakan kembali akun Matrix, access token, dan identitas perangkat yang sama bila memungkinkan.
- Sebelum perubahan migrasi Matrix yang dapat ditindaklanjuti dijalankan, OpenClaw membuat atau menggunakan kembali snapshot pemulihan di `~/Backups/openclaw-migrations/`.
- Jika Anda menggunakan beberapa akun Matrix, atur `channels.matrix.defaultAccount` sebelum meningkatkan dari tata letak flat-store lama agar OpenClaw tahu akun mana yang harus menerima state lama bersama tersebut.
- Jika plugin sebelumnya menyimpan kunci dekripsi backup room-key Matrix secara lokal, startup atau `openclaw doctor --fix` akan mengimpornya ke alur recovery-key baru secara otomatis.
- Jika access token Matrix berubah setelah migrasi disiapkan, startup sekarang memindai root penyimpanan hash-token sibling untuk state pemulihan lama yang tertunda sebelum menyerah pada pemulihan backup otomatis.
- Jika access token Matrix berubah nanti untuk akun, homeserver, dan pengguna yang sama, OpenClaw sekarang lebih memilih menggunakan ulang root penyimpanan hash-token yang paling lengkap yang sudah ada alih-alih memulai dari direktori state Matrix kosong.
- Pada startup gateway berikutnya, room key yang telah dibackup dipulihkan secara otomatis ke crypto store baru.
- Jika plugin lama memiliki room key lokal-saja yang tidak pernah dibackup, OpenClaw akan memberi peringatan dengan jelas. Kunci tersebut tidak dapat diekspor secara otomatis dari rust crypto store sebelumnya, jadi sebagian riwayat terenkripsi lama mungkin tetap tidak tersedia sampai dipulihkan secara manual.
- Lihat [Migrasi Matrix](/id/install/migrating-matrix) untuk alur peningkatan lengkap, batasan, perintah pemulihan, dan pesan migrasi umum.

State runtime terenkripsi diatur di bawah root hash-token per akun, per pengguna di
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Direktori itu berisi sync store (`bot-storage.json`), crypto store (`crypto/`),
file recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
binding thread (`thread-bindings.json`), dan state verifikasi startup (`startup-verification.json`)
saat fitur-fitur tersebut digunakan.
Saat token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan ulang root terbaik yang ada
untuk tuple akun/homeserver/pengguna tersebut sehingga state sync sebelumnya, state crypto, binding thread,
dan state verifikasi startup tetap terlihat.

### Model crypto store Node

E2EE Matrix di plugin ini menggunakan jalur Rust crypto `matrix-js-sdk` resmi di Node.
Jalur tersebut mengharapkan persistensi berbasis IndexedDB saat Anda ingin state crypto tetap bertahan setelah restart.

OpenClaw saat ini menyediakannya di Node dengan:

- menggunakan `fake-indexeddb` sebagai shim API IndexedDB yang diharapkan SDK
- memulihkan isi IndexedDB Rust crypto dari `crypto-idb-snapshot.json` sebelum `initRustCrypto`
- mem-persist isi IndexedDB yang diperbarui kembali ke `crypto-idb-snapshot.json` setelah init dan selama runtime
- membuat serialisasi pemulihan dan persist snapshot terhadap `crypto-idb-snapshot.json` dengan advisory file lock agar persistensi runtime gateway dan pemeliharaan CLI tidak berlomba pada file snapshot yang sama

Ini adalah plumbing kompatibilitas/penyimpanan, bukan implementasi crypto kustom.
File snapshot adalah state runtime sensitif dan disimpan dengan izin file yang ketat.
Dalam model keamanan OpenClaw, host gateway dan direktori state OpenClaw lokal sudah berada di dalam batas operator tepercaya, jadi ini terutama merupakan persoalan ketahanan operasional, bukan batas kepercayaan jarak jauh yang terpisah.

Peningkatan yang direncanakan:

- menambahkan dukungan SecretRef untuk material kunci Matrix persisten sehingga recovery key dan rahasia enkripsi store terkait dapat diambil dari penyedia rahasia OpenClaw alih-alih hanya dari file lokal

## Manajemen profil

Perbarui self-profile Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` saat Anda ingin menargetkan akun Matrix bernama secara eksplisit.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda meneruskan URL avatar `http://` atau `https://`, OpenClaw akan mengunggahnya ke Matrix terlebih dahulu dan menyimpan URL `mxc://` yang telah di-resolve kembali ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Pemberitahuan verifikasi otomatis

Matrix sekarang memposting pemberitahuan siklus hidup verifikasi langsung ke room verifikasi DM ketat sebagai pesan `m.notice`.
Itu termasuk:

- pemberitahuan permintaan verifikasi
- pemberitahuan verifikasi siap (dengan panduan eksplisit "Verify by emoji")
- pemberitahuan mulai dan selesai verifikasi
- detail SAS (emoji dan desimal) saat tersedia

Permintaan verifikasi masuk dari klien Matrix lain dilacak dan diterima otomatis oleh OpenClaw.
Untuk alur self-verification, OpenClaw juga memulai alur SAS secara otomatis saat verifikasi emoji tersedia dan mengonfirmasi sisinya sendiri.
Untuk permintaan verifikasi dari pengguna/perangkat Matrix lain, OpenClaw menerima permintaan secara otomatis lalu menunggu alur SAS berjalan normal.
Anda tetap perlu membandingkan emoji atau desimal SAS di klien Matrix Anda dan mengonfirmasi "They match" di sana untuk menyelesaikan verifikasi.

OpenClaw tidak menerima otomatis alur duplikat yang dimulai sendiri secara membabi buta. Startup melewati pembuatan permintaan baru saat permintaan self-verification sudah tertunda.

Pemberitahuan protokol/sistem verifikasi tidak diteruskan ke pipeline chat agen, sehingga tidak menghasilkan `NO_REPLY`.

### Kebersihan perangkat

Perangkat Matrix yang dikelola OpenClaw lama dapat menumpuk di akun dan membuat kepercayaan room terenkripsi lebih sulit dipahami.
Daftarkan dengan:

```bash
openclaw matrix devices list
```

Hapus perangkat lama yang dikelola OpenClaw dengan:

```bash
openclaw matrix devices prune-stale
```

### Perbaikan Direct Room

Jika state direct-message tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke room solo lama alih-alih DM yang aktif. Periksa pemetaan saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Perbaikan menjaga logika khusus Matrix tetap di dalam plugin:

- perbaikan lebih memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- jika tidak, perbaikan kembali ke DM 1:1 ketat mana pun yang saat ini sudah tergabung dengan pengguna tersebut
- jika tidak ada DM yang sehat, perbaikan membuat direct room baru dan menulis ulang `m.direct` agar menunjuk ke sana

Alur perbaikan tidak menghapus room lama secara otomatis. Alur ini hanya memilih DM yang sehat dan memperbarui pemetaan agar pengiriman Matrix baru, pemberitahuan verifikasi, dan alur direct-message lainnya kembali menargetkan room yang benar.

## Thread

Matrix mendukung thread Matrix native baik untuk balasan otomatis maupun pengiriman message-tool.

- `dm.sessionScope: "per-user"` (default) menjaga perutean DM Matrix berbasis pengirim, sehingga beberapa room DM dapat berbagi satu sesi saat semuanya ter-resolve ke peer yang sama.
- `dm.sessionScope: "per-room"` mengisolasi setiap room DM Matrix ke kunci sesi masing-masing sambil tetap menggunakan pemeriksaan auth dan allowlist DM normal.
- Binding percakapan Matrix eksplisit tetap diutamakan daripada `dm.sessionScope`, sehingga room dan thread yang dibinding tetap mempertahankan sesi target yang dipilih.
- `threadReplies: "off"` menjaga balasan tetap di level atas dan menjaga pesan thread masuk tetap pada sesi induk.
- `threadReplies: "inbound"` membalas di dalam thread hanya saat pesan masuk memang sudah berada di thread tersebut.
- `threadReplies: "always"` menjaga balasan room tetap di thread yang berakar pada pesan pemicu dan merutekan percakapan itu melalui sesi cakupan-thread yang cocok sejak pesan pemicu pertama.
- `dm.threadReplies` menggantikan pengaturan tingkat atas hanya untuk DM. Sebagai contoh, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan thread masuk menyertakan pesan root thread sebagai konteks agen tambahan.
- Pengiriman message-tool sekarang otomatis mewarisi thread Matrix saat ini ketika targetnya room yang sama, atau target pengguna DM yang sama, kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM pada sesi yang sama hanya aktif saat metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean berbasis pengguna normal.
- Saat OpenClaw melihat room DM Matrix bertabrakan dengan room DM lain pada sesi DM Matrix bersama yang sama, OpenClaw memposting `m.notice` satu kali di room itu dengan escape hatch `/focus` saat binding thread diaktifkan dan petunjuk `dm.sessionScope`.
- Binding thread runtime didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat thread sekarang berfungsi di room dan DM Matrix.
- `/focus` room/DM Matrix level atas membuat thread Matrix baru dan membindingnya ke sesi target saat `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada akan membinding thread saat ini tersebut.

## Binding percakapan ACP

Room, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang tahan lama tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM, room, atau thread Matrix yang sudah ada yang ingin terus Anda gunakan.
- Di DM atau room Matrix level atas, DM/room saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang di-spawn.
- Di dalam thread Matrix yang sudah ada, `--bind here` membinding thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat child thread Matrix.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, saat OpenClaw perlu membuat atau membinding child thread Matrix.

### Config Binding Thread

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn terikat-thread Matrix bersifat opt-in:

- Atur `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` level atas membuat dan membinding thread Matrix baru.
- Atur `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` membinding sesi ACP ke thread Matrix.

## Reaction

Matrix mendukung aksi reaction keluar, notifikasi reaction masuk, dan reaction ack masuk.

- Tool reaction keluar dikendalikan oleh `channels["matrix"].actions.reactions`.
- `react` menambahkan reaction ke event Matrix tertentu.
- `reactions` mencantumkan ringkasan reaction saat ini untuk event Matrix tertentu.
- `emoji=""` menghapus reaction milik akun bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaction emoji yang ditentukan dari akun bot.

Cakupan reaction ack di-resolve dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen

Cakupan reaction ack di-resolve dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Mode notifikasi reaction di-resolve dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Perilaku saat ini:

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan saat event tersebut menargetkan pesan Matrix yang ditulis bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaction.
- Penghapusan reaction masih belum disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` saat pesan room Matrix memicu agen.
- Pengaturan ini fallback ke `messages.groupChat.historyLimit`. Jika keduanya tidak diatur, default efektifnya adalah `0`, jadi pesan room yang dikendalikan mention tidak di-buffer. Atur `0` untuk menonaktifkan.
- Riwayat room Matrix hanya untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix bersifat pending-only: OpenClaw mem-buffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela tersebut saat mention atau pemicu lain datang.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan itu tetap berada di badan inbound utama untuk giliran tersebut.
- Percobaan ulang event Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser maju ke pesan room yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol bersama `contextVisibility` untuk konteks room tambahan seperti teks balasan yang diambil, root thread, dan riwayat tertunda.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist room/pengguna aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Pengaturan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan inbound itu sendiri dapat memicu balasan.
Otorisasi pemicu tetap berasal dari pengaturan `groupPolicy`, `groups`, `groupAllowFrom`, dan kebijakan DM.

## Contoh kebijakan DM dan room

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

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan exec untuk akun Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; fallback ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Approver harus berupa ID pengguna Matrix seperti `@owner:example.org`. Matrix otomatis mengaktifkan persetujuan exec native saat `enabled` tidak diatur atau `"auto"` dan setidaknya satu approver dapat di-resolve, baik dari `execApprovals.approvers` maupun dari `channels.matrix.dm.allowFrom`. Atur `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan native secara eksplisit. Permintaan persetujuan selain itu akan fallback ke rute persetujuan lain yang dikonfigurasi atau kebijakan fallback persetujuan exec.

Perutean native Matrix saat ini hanya untuk exec:

- `channels.matrix.execApprovals.*` mengontrol perutean DM/channel native untuk persetujuan exec saja.
- Persetujuan plugin tetap menggunakan `/approve` same-chat bersama plus penerusan `approvals.plugin` yang dikonfigurasi.
- Matrix masih dapat menggunakan ulang `channels.matrix.dm.allowFrom` untuk otorisasi persetujuan plugin saat dapat menyimpulkan approver dengan aman, tetapi tidak mengekspos jalur fanout DM/channel persetujuan plugin native yang terpisah.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM approver
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM approver dan room atau DM Matrix asal

Prompt persetujuan Matrix menanamkan pintasan reaction pada pesan persetujuan utama:

- `✅` = izinkan sekali
- `❌` = tolak
- `♾️` = izinkan selalu saat keputusan tersebut diizinkan oleh kebijakan exec efektif

Approver dapat memberi reaction pada pesan itu atau menggunakan slash command fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya approver yang telah di-resolve yang dapat menyetujui atau menolak. Pengiriman channel menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Prompt persetujuan Matrix menggunakan ulang planner persetujuan inti bersama. Permukaan native khusus Matrix hanyalah transport untuk persetujuan exec: perutean room/DM dan perilaku kirim/perbarui/hapus pesan.

Override per akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumen terkait: [Persetujuan exec](/id/tools/exec-approvals)

## Contoh multi-akun

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

Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk akun bernama kecuali akun tersebut menggantinya.
Anda dapat membatasi entri room turunan ke satu akun Matrix dengan `groups.<room>.account` (atau `rooms.<room>.account` lama).
Entri tanpa `account` tetap dibagikan di semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi saat akun default dikonfigurasi langsung di `channels.matrix.*` tingkat atas.
Default auth bersama parsial tidak dengan sendirinya membuat akun default implisit terpisah. OpenClaw hanya mensintesis akun `default` tingkat atas saat default tersebut memiliki auth baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama masih dapat tetap dapat ditemukan dari `homeserver` plus `userId` saat kredensial cache memenuhi auth nanti.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke kunci akun bernama yang ada, promosi perbaikan/penyiapan dari akun tunggal ke multi-akun mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru. Hanya kunci auth/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan itu; kunci kebijakan pengiriman bersama tetap berada di tingkat atas.
Atur `defaultAccount` saat Anda ingin OpenClaw lebih memilih satu akun Matrix bernama untuk perutean, probing, dan operasi CLI implisit.
Jika Anda mengonfigurasi beberapa akun bernama, atur `defaultAccount` atau teruskan `--account <id>` untuk perintah CLI yang bergantung pada pemilihan akun implisit.
Teruskan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` saat Anda ingin mengganti pemilihan implisit tersebut untuk satu perintah.

## Homeserver private/LAN

Secara default, OpenClaw memblokir homeserver Matrix private/internal untuk perlindungan SSRF kecuali Anda
secara eksplisit melakukan opt-in per akun.

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

Opt-in ini hanya mengizinkan target private/internal tepercaya. Homeserver cleartext publik seperti
`http://matrix.example.org:8008` tetap diblokir. Sebisa mungkin gunakan `https://`.

## Mem-proxy lalu lintas Matrix

Jika deployment Matrix Anda membutuhkan proxy HTTP(S) keluar eksplisit, atur `channels.matrix.proxy`:

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

Akun bernama dapat mengganti default tingkat atas dengan `channels.matrix.accounts.<id>.proxy`.
OpenClaw menggunakan pengaturan proxy yang sama untuk lalu lintas runtime Matrix dan probe status akun.

## Resolusi target

Matrix menerima bentuk target ini di mana pun OpenClaw meminta target room atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

Pencarian direktori live menggunakan akun Matrix yang sedang login:

- Pencarian pengguna mengkueri direktori pengguna Matrix di homeserver tersebut.
- Pencarian room menerima ID room dan alias eksplisit secara langsung, lalu fallback ke pencarian nama room yang tergabung untuk akun tersebut.
- Pencarian nama joined-room bersifat best-effort. Jika nama room tidak dapat di-resolve ke ID atau alias, nama itu diabaikan oleh resolusi allowlist runtime.

## Referensi konfigurasi

- `enabled`: aktifkan atau nonaktifkan channel.
- `name`: label opsional untuk akun.
- `defaultAccount`: ID akun pilihan saat beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun Matrix ini terhubung ke homeserver private/internal. Aktifkan ini saat homeserver di-resolve ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Akun bernama dapat mengganti default tingkat atas dengan `proxy` mereka sendiri.
- `userId`: ID pengguna Matrix lengkap, misalnya `@bot:example.org`.
- `accessToken`: access token untuk auth berbasis token. Nilai plaintext dan SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` di seluruh penyedia env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).
- `password`: password untuk login berbasis password. Nilai plaintext dan SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat untuk login password.
- `avatarUrl`: URL self-avatar tersimpan untuk sinkronisasi profil dan pembaruan `set-profile`.
- `initialSyncLimit`: batas event sync saat startup.
- `encryption`: aktifkan E2EE.
- `allowlistOnly`: paksa perilaku allowlist-saja untuk DM dan room.
- `allowBots`: izinkan pesan dari akun Matrix OpenClaw terkonfigurasi lain (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID pengguna untuk lalu lintas room.
- Entri `groupAllowFrom` harus berupa ID pengguna Matrix lengkap. Nama yang tidak ter-resolve diabaikan saat runtime.
- `historyLimit`: jumlah maksimum pesan room yang disertakan sebagai konteks riwayat grup. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak diatur, default efektifnya `0`. Atur `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, `all`, atau `batched`.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks Matrix keluar.
- `streaming`: `off` (default), `partial`, `quiet`, `true`, atau `false`. `partial` dan `true` mengaktifkan pembaruan draf pratinjau-terlebih-dahulu dengan pesan teks Matrix normal. `quiet` menggunakan pemberitahuan pratinjau tanpa notifikasi untuk penyiapan aturan push self-hosted.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok asisten yang telah selesai saat streaming draf pratinjau aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per channel untuk perutean sesi terikat-thread dan siklus hidupnya.
- `startupVerification`: mode permintaan self-verification otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba ulang permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran chunk pesan keluar.
- `chunkMode`: `length` atau `newline`.
- `responsePrefix`: prefix pesan opsional untuk balasan keluar.
- `ackReaction`: override reaction ack opsional untuk channel/akun ini.
- `ackReactionScope`: override cakupan reaction ack opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode notifikasi reaction masuk (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk penanganan media Matrix. Ini berlaku untuk pengiriman keluar dan pemrosesan media masuk.
- `autoJoin`: kebijakan auto-join undangan (`always`, `allowlist`, `off`). Default: `off`. Ini berlaku untuk undangan Matrix secara umum, termasuk undangan gaya DM, bukan hanya undangan room/grup. OpenClaw membuat keputusan ini pada saat undangan, sebelum dapat mengklasifikasikan room yang digabungkan secara andal sebagai DM atau grup.
- `autoJoinAllowlist`: room/alias yang diizinkan saat `autoJoin` adalah `allowlist`. Entri alias di-resolve menjadi ID room selama penanganan undangan; OpenClaw tidak memercayai state alias yang diklaim oleh room yang mengundang.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: mengontrol akses DM setelah OpenClaw bergabung ke room dan mengklasifikasikannya sebagai DM. Ini tidak mengubah apakah undangan di-auto-join.
- Entri `dm.allowFrom` harus berupa ID pengguna Matrix lengkap kecuali Anda sudah me-resolve-nya melalui pencarian direktori live.
- `dm.sessionScope`: `per-user` (default) atau `per-room`. Gunakan `per-room` saat Anda ingin setiap room DM Matrix mempertahankan konteks terpisah meskipun peer-nya sama.
- `dm.threadReplies`: override kebijakan thread khusus DM (`off`, `inbound`, `always`). Ini menggantikan pengaturan `threadReplies` tingkat atas untuk penempatan balasan dan isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec native Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui permintaan exec. Opsional saat `dm.allowFrom` sudah mengidentifikasi approver.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override per akun bernama. Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk entri ini.
- `groups`: peta kebijakan per room. Gunakan ID room atau alias; nama room yang tidak ter-resolve diabaikan saat runtime. Identitas sesi/grup menggunakan ID room yang stabil setelah resolusi, sementara label yang dapat dibaca manusia tetap berasal dari nama room.
- `groups.<room>.account`: batasi satu entri room turunan ke akun Matrix tertentu dalam penyiapan multi-akun.
- `groups.<room>.allowBots`: override tingkat room untuk pengirim bot terkonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per room.
- `groups.<room>.tools`: override allow/deny tool per room.
- `groups.<room>.autoReply`: override mention-gating tingkat room. `true` menonaktifkan persyaratan mention untuk room itu; `false` memaksanya aktif kembali.
- `groups.<room>.skills`: filter Skills tingkat room opsional.
- `groups.<room>.systemPrompt`: cuplikan system prompt tingkat room opsional.
- `rooms`: alias lama untuk `groups`.
- `actions`: gating tool per aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Channels Overview](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — auth DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku obrolan grup dan mention gating
- [Channel Routing](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
