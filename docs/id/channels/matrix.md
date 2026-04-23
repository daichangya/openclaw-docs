---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matrix
x-i18n:
    generated_at: "2026-04-23T14:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e9d4d656b47aca2dacb00e591378cb26631afc5b634074bc26e21741b418b47
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix adalah plugin channel bawaan untuk OpenClaw.
Plugin ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaksi, polling, lokasi, dan E2EE.

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
   - Rilis OpenClaw dalam paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun Matrix di homeserver Anda.
3. Konfigurasikan `channels.matrix` dengan salah satu dari:
   - `homeserver` + `accessToken`, atau
   - `homeserver` + `userId` + `password`.
4. Mulai ulang Gateway.
5. Mulai DM dengan bot atau undang bot ke room.
   - Undangan Matrix baru hanya berfungsi jika `channels.matrix.autoJoin` mengizinkannya.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

Wizard Matrix meminta:

- URL homeserver
- metode autentikasi: access token atau kata sandi
- ID pengguna (hanya autentikasi kata sandi)
- nama perangkat opsional
- apakah E2EE akan diaktifkan
- apakah akan mengonfigurasi akses room dan auto-join undangan

Perilaku utama wizard:

- Jika variabel lingkungan autentikasi Matrix sudah ada dan akun tersebut belum memiliki autentikasi yang disimpan di config, wizard menawarkan pintasan env agar autentikasi tetap berada di variabel lingkungan.
- Nama akun dinormalisasi ke ID akun. Misalnya, `Ops Bot` menjadi `ops-bot`.
- Entri allowlist DM menerima `@user:server` secara langsung; nama tampilan hanya berfungsi jika pencarian direktori live menemukan satu kecocokan yang tepat.
- Entri allowlist room menerima ID room dan alias secara langsung. Sebaiknya gunakan `!room:server` atau `#alias:server`; nama yang tidak terselesaikan diabaikan saat runtime oleh resolusi allowlist.
- Dalam mode allowlist auto-join undangan, gunakan hanya target undangan yang stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama room biasa ditolak.
- Untuk menyelesaikan nama room sebelum menyimpan, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` secara default bernilai `off`.

Jika Anda membiarkannya tidak disetel, bot tidak akan bergabung ke room yang mengundangnya atau undangan gaya DM baru, sehingga bot tidak akan muncul di grup baru atau DM undangan kecuali Anda bergabung secara manual terlebih dahulu.

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

Penyiapan berbasis kata sandi (token di-cache setelah login):

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
Saat kredensial cache ada di sana, OpenClaw menganggap Matrix telah dikonfigurasi untuk penyiapan, doctor, dan penemuan status channel meskipun autentikasi saat ini tidak disetel langsung di config.

Padanan variabel lingkungan (digunakan saat kunci config tidak disetel):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Untuk akun non-default, gunakan variabel lingkungan dengan cakupan akun:

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

Matrix meng-escape tanda baca dalam ID akun agar variabel lingkungan berscope tetap bebas benturan.
Misalnya, `-` menjadi `_X2D_`, sehingga `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan env-var ketika variabel lingkungan autentikasi tersebut sudah ada dan akun yang dipilih belum memiliki autentikasi Matrix yang disimpan di config.

`MATRIX_HOMESERVER` tidak dapat disetel dari workspace `.env`; lihat [File `.env` workspace](/id/gateway/security).

## Contoh konfigurasi

Ini adalah config dasar yang praktis dengan pairing DM, allowlist room, dan E2EE diaktifkan:

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

`autoJoin` berlaku untuk semua undangan Matrix, termasuk undangan bergaya DM. OpenClaw tidak dapat secara andal mengklasifikasikan room yang diundang sebagai DM atau grup pada saat undangan, sehingga semua undangan terlebih dahulu melewati `autoJoin`. `dm.policy` berlaku setelah bot bergabung dan room diklasifikasikan sebagai DM.

## Pratinjau streaming

Streaming balasan Matrix bersifat opt-in.

Setel `channels.matrix.streaming` ke `"partial"` saat Anda ingin OpenClaw mengirim satu balasan pratinjau live, mengedit pratinjau tersebut di tempat saat model sedang menghasilkan teks, lalu memfinalkannya saat balasan selesai:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` adalah default. OpenClaw menunggu balasan akhir dan mengirimkannya satu kali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok asisten saat ini menggunakan pesan teks Matrix normal. Ini mempertahankan perilaku notifikasi lama Matrix yang mengutamakan pratinjau, sehingga klien bawaan dapat memberi notifikasi pada teks pratinjau streaming pertama alih-alih blok yang sudah selesai.
- `streaming: "quiet"` membuat satu notifikasi pratinjau senyap yang dapat diedit untuk blok asisten saat ini. Gunakan ini hanya jika Anda juga mengonfigurasi push rule penerima untuk edit pratinjau yang telah difinalkan.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan pratinjau streaming diaktifkan, Matrix mempertahankan draf live untuk blok saat ini dan menyimpan blok yang sudah selesai sebagai pesan terpisah.
- Saat pratinjau streaming aktif dan `blockStreaming` nonaktif, Matrix mengedit draf live di tempat dan memfinalkan event yang sama saat blok atau giliran selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan pratinjau streaming dan kembali ke pengiriman akhir normal.
- Balasan media tetap mengirim lampiran secara normal. Jika pratinjau usang tidak lagi bisa digunakan ulang dengan aman, OpenClaw akan me-redact-nya sebelum mengirim balasan media akhir.
- Edit pratinjau menimbulkan panggilan API Matrix tambahan. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate-limit yang paling konservatif.

`blockStreaming` tidak mengaktifkan pratinjau draf dengan sendirinya.
Gunakan `streaming: "partial"` atau `streaming: "quiet"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok asisten yang telah selesai tetap terlihat sebagai pesan progres terpisah.

Jika Anda memerlukan notifikasi Matrix bawaan tanpa push rule kustom, gunakan `streaming: "partial"` untuk perilaku yang mengutamakan pratinjau atau biarkan `streaming` nonaktif untuk pengiriman final saja. Dengan `streaming: "off"`:

- `blockStreaming: true` mengirim setiap blok yang sudah selesai sebagai pesan Matrix normal yang memicu notifikasi.
- `blockStreaming: false` hanya mengirim balasan akhir yang sudah lengkap sebagai pesan Matrix normal yang memicu notifikasi.

### Push rule self-hosted untuk pratinjau final yang senyap

Streaming senyap (`streaming: "quiet"`) hanya memberi notifikasi kepada penerima setelah sebuah blok atau giliran difinalkan — push rule per pengguna harus cocok dengan penanda pratinjau yang sudah difinalkan. Lihat [Push rule Matrix untuk pratinjau senyap](/id/channels/matrix-push-rules) untuk penyiapan lengkapnya (token penerima, pemeriksaan pusher, instalasi rule, catatan per homeserver).

## Room bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang telah dikonfigurasi diabaikan.

Gunakan `allowBots` saat Anda memang menginginkan lalu lintas Matrix antargen:

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

- `allowBots: true` menerima pesan dari akun bot Matrix terkonfigurasi lainnya di room dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya saat pesan itu secara terlihat menyebut bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` menimpa pengaturan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balasan diri.
- Matrix tidak mengekspos flag bot native di sini; OpenClaw menganggap "ditulis bot" sebagai "dikirim oleh akun Matrix terkonfigurasi lain pada Gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di room bersama.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), event gambar keluar menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran penuh. Room yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak diperlukan konfigurasi — plugin mendeteksi status E2EE secara otomatis.

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

Perintah verifikasi (semuanya menerima `--verbose` untuk diagnostik dan `--json` untuk output yang dapat dibaca mesin):

| Perintah                                                       | Tujuan                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | Memeriksa status cross-signing dan verifikasi perangkat                             |
| `openclaw matrix verify status --include-recovery-key --json`  | Menyertakan recovery key yang tersimpan                                             |
| `openclaw matrix verify bootstrap`                             | Mem-bootstrap cross-signing dan verifikasi (lihat di bawah)                         |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Membuang identitas cross-signing saat ini dan membuat yang baru                     |
| `openclaw matrix verify device "<recovery-key>"`               | Memverifikasi perangkat ini dengan recovery key                                     |
| `openclaw matrix verify backup status`                         | Memeriksa kesehatan backup room-key                                                 |
| `openclaw matrix verify backup restore`                        | Memulihkan room key dari backup server                                              |
| `openclaw matrix verify backup reset --yes`                    | Menghapus backup saat ini dan membuat baseline baru (dapat membuat ulang secret storage) |

Dalam penyiapan multi-akun, perintah CLI Matrix menggunakan akun default Matrix implisit kecuali Anda meneruskan `--account <id>`.
Jika Anda mengonfigurasi beberapa akun bernama, setel `channels.matrix.defaultAccount` terlebih dahulu atau operasi CLI implisit tersebut akan berhenti dan meminta Anda memilih akun secara eksplisit.
Gunakan `--account` kapan pun Anda ingin operasi verifikasi atau perangkat menargetkan akun bernama secara eksplisit:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Saat enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan kesalahan verifikasi mengarah ke kunci config akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Apa arti verified">
    OpenClaw menganggap perangkat sebagai verified hanya ketika identitas cross-signing Anda sendiri menandatanganinya. `verify status --verbose` mengekspos tiga sinyal kepercayaan:

    - `Locally trusted`: hanya dipercaya oleh klien ini
    - `Cross-signing verified`: SDK melaporkan verifikasi melalui cross-signing
    - `Signed by owner`: ditandatangani oleh kunci self-signing Anda sendiri

    `Verified by owner` menjadi `yes` hanya ketika cross-signing atau owner-signing ada. Kepercayaan lokal saja tidak cukup.

  </Accordion>

  <Accordion title="Apa yang dilakukan bootstrap">
    `verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun terenkripsi. Secara berurutan, perintah ini:

    - mem-bootstrap secret storage, dengan menggunakan kembali recovery key yang ada bila memungkinkan
    - mem-bootstrap cross-signing dan mengunggah kunci cross-signing publik yang belum ada
    - menandai dan me-cross-sign perangkat saat ini
    - membuat backup room-key sisi server jika belum ada

    Jika homeserver memerlukan UIA untuk mengunggah kunci cross-signing, OpenClaw mencoba tanpa autentikasi terlebih dahulu, lalu `m.login.dummy`, lalu `m.login.password` (memerlukan `channels.matrix.password`). Gunakan `--force-reset-cross-signing` hanya saat dengan sengaja membuang identitas saat ini.

  </Accordion>

  <Accordion title="Baseline backup baru">
    Jika Anda ingin mempertahankan agar pesan terenkripsi di masa mendatang tetap berfungsi dan menerima hilangnya riwayat lama yang tidak dapat dipulihkan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Tambahkan `--account <id>` untuk menargetkan akun bernama. Ini juga dapat membuat ulang secret storage jika secret backup saat ini tidak dapat dimuat dengan aman.

  </Accordion>

  <Accordion title="Perilaku saat startup">
    Dengan `encryption: true`, `startupVerification` secara default bernilai `"if-unverified"`. Saat startup, perangkat yang belum diverifikasi meminta verifikasi mandiri di klien Matrix lain, melewati duplikasi dan menerapkan cooldown. Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Saat startup juga dijalankan pass bootstrap crypto yang konservatif yang menggunakan kembali secret storage saat ini dan identitas cross-signing. Jika status bootstrap rusak, OpenClaw mencoba perbaikan yang dijaga bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan UIA kata sandi, startup mencatat peringatan dan tetap non-fatal. Perangkat yang sudah ditandatangani pemilik tetap dipertahankan.

    Lihat [Migrasi Matrix](/id/install/migrating-matrix) untuk alur upgrade lengkap.

  </Accordion>

  <Accordion title="Notifikasi verifikasi">
    Matrix memposting notifikasi siklus hidup verifikasi ke room DM verifikasi ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verify by emoji"), mulai/selesai, dan detail SAS (emoji/desimal) bila tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima secara otomatis. Untuk verifikasi mandiri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia — Anda tetap perlu membandingkan dan mengonfirmasi "They match" di klien Matrix Anda.

    Notifikasi sistem verifikasi tidak diteruskan ke pipeline chat agen.

  </Accordion>

  <Accordion title="Kebersihan perangkat">
    Perangkat lama yang dikelola OpenClaw dapat menumpuk. Daftar dan pangkas:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE menggunakan jalur crypto Rust `matrix-js-sdk` resmi dengan `fake-indexeddb` sebagai shim IndexedDB. Status crypto dipertahankan ke `crypto-idb-snapshot.json` (izin file ketat).

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup sync store, crypto store, recovery key, snapshot IDB, binding thread, dan status verifikasi startup. Saat token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang ada agar status sebelumnya tetap terlihat.

  </Accordion>
</AccordionGroup>

## Manajemen profil

Perbarui self-profile Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` saat Anda ingin secara eksplisit menargetkan akun Matrix bernama.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda meneruskan URL avatar `http://` atau `https://`, OpenClaw akan mengunggahnya ke Matrix terlebih dahulu dan menyimpan kembali URL `mxc://` yang telah diselesaikan ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Thread

Matrix mendukung thread Matrix native untuk balasan otomatis maupun pengiriman message-tool.

- `dm.sessionScope: "per-user"` (default) menjaga routing DM Matrix tetap berscope pengirim, sehingga beberapa room DM dapat berbagi satu sesi saat semuanya mengarah ke rekan yang sama.
- `dm.sessionScope: "per-room"` mengisolasi setiap room DM Matrix ke kunci sesinya sendiri sambil tetap menggunakan autentikasi DM normal dan pemeriksaan allowlist.
- Binding percakapan Matrix eksplisit tetap lebih diutamakan daripada `dm.sessionScope`, sehingga room dan thread yang sudah dibind tetap menggunakan sesi target yang dipilih.
- `threadReplies: "off"` menjaga balasan tetap di tingkat atas dan mempertahankan pesan berulir masuk pada sesi induk.
- `threadReplies: "inbound"` membalas di dalam thread hanya jika pesan masuk memang sudah berada di thread tersebut.
- `threadReplies: "always"` menjaga balasan room tetap di thread yang berakar pada pesan pemicu dan merutekan percakapan tersebut melalui sesi berscope thread yang cocok dari pesan pemicu pertama.
- `dm.threadReplies` menimpa pengaturan tingkat atas hanya untuk DM. Misalnya, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan berulir masuk menyertakan pesan akar thread sebagai konteks agen tambahan.
- Pengiriman message-tool secara otomatis mewarisi thread Matrix saat ini ketika targetnya adalah room yang sama, atau target pengguna DM yang sama, kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM dengan sesi yang sama hanya aktif ketika metadata sesi saat ini membuktikan rekan DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke routing normal berscope pengguna.
- Saat OpenClaw melihat room DM Matrix bertabrakan dengan room DM lain pada sesi DM Matrix bersama yang sama, OpenClaw memposting `m.notice` satu kali di room tersebut dengan jalur keluar `/focus` saat binding thread diaktifkan dan petunjuk `dm.sessionScope`.
- Binding thread runtime didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat thread berfungsi di room dan DM Matrix.
- `/focus` tingkat atas pada room/DM Matrix membuat thread Matrix baru dan membind-nya ke sesi target saat `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang sudah ada akan membind thread saat ini tersebut.

## Binding percakapan ACP

Room, DM, dan thread Matrix yang sudah ada dapat diubah menjadi workspace ACP yang persisten tanpa mengubah permukaan chat.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM Matrix, room, atau thread yang sudah ada yang ingin terus Anda gunakan.
- Di DM atau room Matrix tingkat atas, DM/room saat ini tetap menjadi permukaan chat dan pesan berikutnya dirutekan ke sesi ACP yang di-spawn.
- Di dalam thread Matrix yang sudah ada, `--bind here` membind thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat child thread Matrix.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, saat OpenClaw perlu membuat atau membind child thread Matrix.

### Config binding thread

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per-channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn terikat thread Matrix bersifat opt-in:

- Setel `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` tingkat atas membuat dan membind thread Matrix baru.
- Setel `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` membind sesi ACP ke thread Matrix.

## Reaksi

Matrix mendukung aksi reaksi keluar, notifikasi reaksi masuk, dan reaksi ack masuk.

- Tooling reaksi keluar dikendalikan oleh `channels["matrix"].actions.reactions`.
- `react` menambahkan reaksi ke event Matrix tertentu.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix tertentu.
- `emoji=""` menghapus reaksi milik akun bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari akun bot.

Cakupan reaksi ack diselesaikan dalam urutan standar OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen

Cakupan reaksi ack diselesaikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Mode notifikasi reaksi diselesaikan dalam urutan ini:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Perilaku:

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan saat menargetkan pesan Matrix yang ditulis bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaksi.
- Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkan itu sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` saat pesan room Matrix memicu agen. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- Riwayat room Matrix hanya untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix hanya untuk yang tertunda: OpenClaw membuffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela tersebut saat mention atau pemicu lain datang.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan itu tetap berada di body inbound utama untuk giliran tersebut.
- Percobaan ulang pada event Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser maju ke pesan room yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol `contextVisibility` bersama untuk konteks room tambahan seperti teks balasan yang diambil, akar thread, dan riwayat tertunda.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist room/pengguna yang aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Pengaturan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan inbound itu sendiri dapat memicu balasan.
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

Jika pengguna Matrix yang belum disetujui terus mengirimi Anda pesan sebelum persetujuan, OpenClaw menggunakan kembali kode pairing tertunda yang sama dan dapat mengirim balasan pengingat lagi setelah cooldown singkat alih-alih mencetak kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Perbaikan direct room

Jika status direct-message tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` usang yang menunjuk ke room solo lama alih-alih DM live. Periksa pemetaan saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Alur perbaikan:

- mengutamakan DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat mana pun yang saat ini sudah joined dengan pengguna tersebut
- membuat direct room baru dan menulis ulang `m.direct` jika tidak ada DM sehat

Alur perbaikan tidak otomatis menghapus room lama. Alur ini hanya memilih DM yang sehat dan memperbarui pemetaan agar pengiriman Matrix baru, notifikasi verifikasi, dan alur direct-message lainnya kembali menargetkan room yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native untuk akun Matrix. Pengaturan routing DM/channel native tetap berada di bawah config persetujuan exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; fallback ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Approver harus berupa ID pengguna Matrix seperti `@owner:example.org`. Matrix otomatis mengaktifkan persetujuan native saat `enabled` tidak disetel atau bernilai `"auto"` dan setidaknya satu approver dapat diselesaikan. Persetujuan exec menggunakan `execApprovals.approvers` terlebih dahulu dan dapat fallback ke `channels.matrix.dm.allowFrom`. Persetujuan plugin mengotorisasi melalui `channels.matrix.dm.allowFrom`. Setel `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan native secara eksplisit. Jika tidak, permintaan persetujuan akan fallback ke rute persetujuan lain yang dikonfigurasi atau kebijakan fallback persetujuan.

Routing native Matrix mendukung kedua jenis persetujuan:

- `channels.matrix.execApprovals.*` mengontrol mode fanout DM/channel native untuk prompt persetujuan Matrix.
- Persetujuan exec menggunakan set approver exec dari `execApprovals.approvers` atau `channels.matrix.dm.allowFrom`.
- Persetujuan plugin menggunakan allowlist DM Matrix dari `channels.matrix.dm.allowFrom`.
- Pintasan reaksi Matrix dan pembaruan pesan berlaku untuk persetujuan exec maupun plugin.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM approver
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM approver dan room atau DM Matrix asal

Prompt persetujuan Matrix menanam pintasan reaksi pada pesan persetujuan utama:

- `✅` = izinkan sekali
- `❌` = tolak
- `♾️` = selalu izinkan bila keputusan tersebut diizinkan oleh kebijakan exec yang efektif

Approver dapat bereaksi pada pesan tersebut atau menggunakan perintah slash fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya approver yang dapat diselesaikan yang bisa menyetujui atau menolak. Untuk persetujuan exec, pengiriman channel menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Override per akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumentasi terkait: [Persetujuan exec](/id/tools/exec-approvals)

## Perintah slash

Perintah slash Matrix (misalnya `/new`, `/reset`, `/model`) bekerja langsung di DM. Di room, OpenClaw juga mengenali perintah slash yang diawali dengan mention Matrix bot itu sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa memerlukan regex mention kustom. Ini membuat bot tetap responsif terhadap kiriman bergaya room `@mention /command` yang dipancarkan oleh Element dan klien serupa saat pengguna melengkapi tab bot sebelum mengetik perintah.

Aturan otorisasi tetap berlaku: pengirim perintah harus memenuhi kebijakan allowlist/owner DM atau room seperti halnya pesan biasa.

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
Anda dapat memberi scope entri room turunan ke satu akun Matrix dengan `groups.<room>.account`.
Entri tanpa `account` tetap dibagikan di semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi saat akun default dikonfigurasi langsung pada `channels.matrix.*` tingkat atas.
Default autentikasi bersama parsial tidak dengan sendirinya membuat akun default implisit terpisah. OpenClaw hanya mensintesis akun `default` tingkat atas saat default tersebut memiliki autentikasi baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama masih dapat tetap dapat ditemukan dari `homeserver` plus `userId` ketika kredensial cache nantinya memenuhi autentikasi.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke kunci akun bernama yang ada, promosi perbaikan/penyiapan dari akun tunggal ke multi-akun mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru. Hanya kunci autentikasi/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan itu; kunci kebijakan pengiriman bersama tetap di tingkat atas.
Setel `defaultAccount` saat Anda ingin OpenClaw mengutamakan satu akun Matrix bernama untuk routing implisit, probing, dan operasi CLI.
Jika beberapa akun Matrix dikonfigurasi dan salah satu ID akun adalah `default`, OpenClaw menggunakan akun tersebut secara implisit bahkan saat `defaultAccount` tidak disetel.
Jika Anda mengonfigurasi beberapa akun bernama, setel `defaultAccount` atau teruskan `--account <id>` untuk perintah CLI yang mengandalkan pemilihan akun implisit.
Teruskan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` saat Anda ingin menimpa pemilihan implisit tersebut untuk satu perintah.

Lihat [Referensi konfigurasi](/id/gateway/configuration-reference#multi-account-all-channels) untuk pola multi-akun bersama.

## Homeserver privat/LAN

Secara default, OpenClaw memblokir homeserver Matrix privat/internal untuk perlindungan SSRF kecuali Anda
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

Opt-in ini hanya mengizinkan target privat/internal tepercaya. Homeserver cleartext publik seperti
`http://matrix.example.org:8008` tetap diblokir. Sebaiknya gunakan `https://` bila memungkinkan.

## Proxy traffic Matrix

Jika deployment Matrix Anda memerlukan proxy HTTP(S) keluar yang eksplisit, setel `channels.matrix.proxy`:

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
OpenClaw menggunakan pengaturan proxy yang sama untuk traffic Matrix runtime dan probe status akun.

## Resolusi target

Matrix menerima bentuk target ini di mana pun OpenClaw meminta target room atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

Pencarian direktori live menggunakan akun Matrix yang sedang login:

- Pencarian pengguna mengueri direktori pengguna Matrix di homeserver tersebut.
- Pencarian room menerima ID room dan alias eksplisit secara langsung, lalu fallback ke pencarian nama room yang sudah joined untuk akun tersebut.
- Pencarian nama room yang sudah joined bersifat best-effort. Jika nama room tidak dapat diselesaikan ke ID atau alias, nama tersebut diabaikan oleh resolusi allowlist runtime.

## Referensi konfigurasi

- `enabled`: mengaktifkan atau menonaktifkan channel.
- `name`: label opsional untuk akun.
- `defaultAccount`: ID akun yang diutamakan saat beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: mengizinkan akun Matrix ini terhubung ke homeserver privat/internal. Aktifkan ini ketika homeserver mengarah ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk traffic Matrix. Akun bernama dapat menimpa default tingkat atas dengan `proxy` miliknya sendiri.
- `userId`: ID pengguna Matrix lengkap, misalnya `@bot:example.org`.
- `accessToken`: access token untuk autentikasi berbasis token. Nilai plaintext dan nilai SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` di seluruh provider env/file/exec. Lihat [Secrets Management](/id/gateway/secrets).
- `password`: kata sandi untuk login berbasis kata sandi. Nilai plaintext dan nilai SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat untuk login kata sandi.
- `avatarUrl`: URL avatar mandiri yang disimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum event yang diambil selama sinkronisasi startup.
- `encryption`: mengaktifkan E2EE.
- `allowlistOnly`: saat `true`, meningkatkan kebijakan room `open` menjadi `allowlist`, dan memaksa semua kebijakan DM aktif kecuali `disabled` (termasuk `pairing` dan `open`) menjadi `allowlist`. Tidak memengaruhi kebijakan `disabled`.
- `allowBots`: mengizinkan pesan dari akun Matrix OpenClaw terkonfigurasi lainnya (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID pengguna untuk traffic room. ID pengguna Matrix lengkap paling aman; kecocokan direktori yang tepat diselesaikan saat startup dan saat allowlist berubah ketika monitor sedang berjalan. Nama yang tidak terselesaikan diabaikan.
- `historyLimit`: jumlah maksimum pesan room yang disertakan sebagai konteks riwayat grup. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, `all`, atau `batched`.
- `markdown`: config rendering Markdown opsional untuk teks Matrix keluar.
- `streaming`: `off` (default), `"partial"`, `"quiet"`, `true`, atau `false`. `"partial"` dan `true` mengaktifkan pembaruan draf yang mengutamakan pratinjau dengan pesan teks Matrix normal. `"quiet"` menggunakan notifikasi pratinjau tanpa notifikasi untuk penyiapan push rule self-hosted. `false` setara dengan `"off"`.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok asisten yang telah selesai saat streaming pratinjau draf aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per-channel untuk routing dan siklus hidup sesi yang terikat thread.
- `startupVerification`: mode permintaan verifikasi mandiri otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba lagi permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran chunk pesan keluar dalam karakter (berlaku saat `chunkMode` adalah `length`).
- `chunkMode`: `length` memisahkan pesan berdasarkan jumlah karakter; `newline` memisahkan pada batas baris.
- `responsePrefix`: string opsional yang ditambahkan di depan semua balasan keluar untuk channel ini.
- `ackReaction`: override reaksi ack opsional untuk channel/akun ini.
- `ackReactionScope`: override cakupan reaksi ack opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode notifikasi reaksi masuk (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman keluar dan pemrosesan media masuk.
- `autoJoin`: kebijakan auto-join undangan (`always`, `allowlist`, `off`). Default: `off`. Berlaku untuk semua undangan Matrix, termasuk undangan bergaya DM.
- `autoJoinAllowlist`: room/alias yang diizinkan saat `autoJoin` adalah `allowlist`. Entri alias diselesaikan ke ID room selama penanganan undangan; OpenClaw tidak mempercayai status alias yang diklaim oleh room yang mengundang.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: mengontrol akses DM setelah OpenClaw bergabung ke room dan mengklasifikasikannya sebagai DM. Ini tidak mengubah apakah undangan di-auto-join.
- `dm.allowFrom`: allowlist ID pengguna untuk traffic DM. ID pengguna Matrix lengkap paling aman; kecocokan direktori yang tepat diselesaikan saat startup dan saat allowlist berubah ketika monitor sedang berjalan. Nama yang tidak terselesaikan diabaikan.
- `dm.sessionScope`: `per-user` (default) atau `per-room`. Gunakan `per-room` saat Anda ingin setiap room DM Matrix mempertahankan konteks terpisah meskipun peer-nya sama.
- `dm.threadReplies`: override kebijakan thread khusus DM (`off`, `inbound`, `always`). Ini menimpa pengaturan `threadReplies` tingkat atas untuk penempatan balasan maupun isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec native Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui permintaan exec. Opsional jika `dm.allowFrom` sudah mengidentifikasi para approver.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override bernama per akun. Nilai `channels.matrix` tingkat atas bertindak sebagai default untuk entri ini.
- `groups`: peta kebijakan per-room. Sebaiknya gunakan ID room atau alias; nama room yang tidak terselesaikan diabaikan saat runtime. Identitas sesi/grup menggunakan ID room stabil setelah resolusi.
- `groups.<room>.account`: membatasi satu entri room turunan ke akun Matrix tertentu dalam penyiapan multi-akun.
- `groups.<room>.allowBots`: override tingkat room untuk pengirim bot terkonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per-room.
- `groups.<room>.tools`: override izinkan/tolak tool per-room.
- `groups.<room>.autoReply`: override gating mention tingkat room. `true` menonaktifkan persyaratan mention untuk room tersebut; `false` memaksanya aktif kembali.
- `groups.<room>.skills`: filter skill tingkat room opsional.
- `groups.<room>.systemPrompt`: cuplikan system prompt tingkat room opsional.
- `rooms`: alias lama untuk `groups`.
- `actions`: gating tool per aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan gating mention
- [Channel Routing](/id/channels/channel-routing) — routing sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
