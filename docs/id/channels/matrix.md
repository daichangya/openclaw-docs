---
read_when:
    - Menyiapkan Matrix di OpenClaw
    - Mengonfigurasi E2EE dan verifikasi Matrix
summary: Status dukungan Matrix, penyiapan, dan contoh konfigurasi
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

Matrix adalah Plugin saluran bawaan untuk OpenClaw.
Ini menggunakan `matrix-js-sdk` resmi dan mendukung DM, room, thread, media, reaksi, polling, lokasi, dan E2EE.

## Plugin bawaan

Matrix dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Matrix, instal secara manual:

Instal dari npm:

```bash
openclaw plugins install @openclaw/matrix
```

Instal dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Lihat [Plugins](/id/tools/plugin) untuk perilaku Plugin dan aturan instalasi.

## Penyiapan

1. Pastikan Plugin Matrix tersedia.
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

Wizard Matrix akan meminta:

- URL homeserver
- metode autentikasi: access token atau password
- ID pengguna (khusus autentikasi password)
- nama perangkat opsional
- apakah akan mengaktifkan E2EE
- apakah akan mengonfigurasi akses room dan auto-join undangan

Perilaku utama wizard:

- Jika env vars autentikasi Matrix sudah ada dan akun tersebut belum memiliki autentikasi yang disimpan di konfigurasi, wizard menawarkan pintasan env agar autentikasi tetap berada di env vars.
- Nama akun dinormalisasi menjadi ID akun. Misalnya, `Ops Bot` menjadi `ops-bot`.
- Entri allowlist DM menerima `@user:server` secara langsung; nama tampilan hanya berfungsi saat lookup direktori live menemukan satu kecocokan yang tepat.
- Entri allowlist room menerima ID room dan alias secara langsung. Gunakan `!room:server` atau `#alias:server`; nama yang tidak terselesaikan diabaikan saat runtime oleh resolusi allowlist.
- Dalam mode allowlist auto-join undangan, gunakan hanya target undangan yang stabil: `!roomId:server`, `#alias:server`, atau `*`. Nama room biasa ditolak.
- Untuk menyelesaikan nama room sebelum menyimpan, gunakan `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` secara default adalah `off`.

Jika Anda membiarkannya tidak disetel, bot tidak akan bergabung ke room yang diundang atau undangan gaya DM baru, jadi bot tidak akan muncul di grup baru atau DM undangan kecuali Anda bergabung secara manual terlebih dahulu.

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
      deviceName: "Gateway OpenClaw",
    },
  },
}
```

Matrix menyimpan kredensial yang di-cache di `~/.openclaw/credentials/matrix/`.
Akun default menggunakan `credentials.json`; akun bernama menggunakan `credentials-<account>.json`.
Saat kredensial yang di-cache ada di sana, OpenClaw menganggap Matrix telah dikonfigurasi untuk penyiapan, doctor, dan penemuan status saluran meskipun autentikasi saat ini tidak disetel langsung di konfigurasi.

Padanan env var (digunakan saat kunci konfigurasi tidak disetel):

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

Untuk ID akun yang dinormalisasi `ops-bot`, gunakan:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix melakukan escape tanda baca dalam ID akun agar env var bercakupan tetap bebas benturan.
Misalnya, `-` menjadi `_X2D_`, jadi `ops-prod` dipetakan ke `MATRIX_OPS_X2D_PROD_*`.

Wizard interaktif hanya menawarkan pintasan env-var saat env var autentikasi tersebut sudah ada dan akun yang dipilih belum memiliki autentikasi Matrix yang disimpan di konfigurasi.

`MATRIX_HOMESERVER` tidak dapat disetel dari workspace `.env`; lihat [File `.env` workspace](/id/gateway/security).

## Contoh konfigurasi

Ini adalah konfigurasi dasar praktis dengan pairing DM, allowlist room, dan E2EE diaktifkan:

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

`autoJoin` berlaku untuk semua undangan Matrix, termasuk undangan gaya DM. OpenClaw tidak dapat secara andal
mengklasifikasikan room yang diundang sebagai DM atau grup pada saat undangan, jadi semua undangan melewati `autoJoin`
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

- `streaming: "off"` adalah default. OpenClaw menunggu balasan akhir dan mengirimkannya sekali.
- `streaming: "partial"` membuat satu pesan pratinjau yang dapat diedit untuk blok assistant saat ini menggunakan pesan teks Matrix biasa. Ini mempertahankan perilaku notifikasi lawas Matrix yang mengutamakan pratinjau, sehingga klien bawaan dapat memberi notifikasi pada teks pratinjau streaming pertama alih-alih blok yang sudah selesai.
- `streaming: "quiet"` membuat satu pemberitahuan pratinjau senyap yang dapat diedit untuk blok assistant saat ini. Gunakan ini hanya jika Anda juga mengonfigurasi aturan push penerima untuk edit pratinjau yang telah difinalkan.
- `blockStreaming: true` mengaktifkan pesan progres Matrix terpisah. Dengan pratinjau streaming diaktifkan, Matrix mempertahankan draft live untuk blok saat ini dan mempertahankan blok yang sudah selesai sebagai pesan terpisah.
- Saat pratinjau streaming aktif dan `blockStreaming` nonaktif, Matrix mengedit draft live di tempat dan memfinalkan event yang sama saat blok atau giliran selesai.
- Jika pratinjau tidak lagi muat dalam satu event Matrix, OpenClaw menghentikan pratinjau streaming dan kembali ke pengiriman akhir normal.
- Balasan media tetap mengirim lampiran secara normal. Jika pratinjau stale tidak lagi dapat digunakan ulang dengan aman, OpenClaw meredaksinya sebelum mengirim balasan media akhir.
- Edit pratinjau memerlukan panggilan API Matrix tambahan. Biarkan streaming nonaktif jika Anda menginginkan perilaku rate-limit yang paling konservatif.

`blockStreaming` tidak dengan sendirinya mengaktifkan pratinjau draft.
Gunakan `streaming: "partial"` atau `streaming: "quiet"` untuk edit pratinjau; lalu tambahkan `blockStreaming: true` hanya jika Anda juga ingin blok assistant yang sudah selesai tetap terlihat sebagai pesan progres terpisah.

Jika Anda memerlukan notifikasi Matrix bawaan tanpa aturan push kustom, gunakan `streaming: "partial"` untuk perilaku mengutamakan pratinjau atau biarkan `streaming` nonaktif untuk pengiriman final saja. Dengan `streaming: "off"`:

- `blockStreaming: true` mengirim setiap blok yang selesai sebagai pesan Matrix biasa yang memicu notifikasi.
- `blockStreaming: false` hanya mengirim balasan akhir yang sudah selesai sebagai pesan Matrix biasa yang memicu notifikasi.

### Aturan push self-hosted untuk pratinjau final senyap

Streaming senyap (`streaming: "quiet"`) hanya memberi notifikasi kepada penerima setelah blok atau giliran difinalkan — aturan push per pengguna harus cocok dengan penanda pratinjau yang telah difinalkan. Lihat [Aturan push Matrix untuk pratinjau senyap](/id/channels/matrix-push-rules) untuk penyiapan lengkapnya (token penerima, pemeriksaan pusher, instalasi aturan, catatan per-homeserver).

## Room bot-ke-bot

Secara default, pesan Matrix dari akun Matrix OpenClaw lain yang telah dikonfigurasi akan diabaikan.

Gunakan `allowBots` saat Anda memang menginginkan lalu lintas Matrix antar-agent:

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

- `allowBots: true` menerima pesan dari akun bot Matrix lain yang telah dikonfigurasi di room dan DM yang diizinkan.
- `allowBots: "mentions"` menerima pesan tersebut hanya saat secara terlihat me-mention bot ini di room. DM tetap diizinkan.
- `groups.<room>.allowBots` meng-override setelan tingkat akun untuk satu room.
- OpenClaw tetap mengabaikan pesan dari ID pengguna Matrix yang sama untuk menghindari loop balas-diri.
- Matrix tidak mengekspos penanda bot native di sini; OpenClaw menganggap "ditulis bot" sebagai "dikirim oleh akun Matrix lain yang telah dikonfigurasi pada gateway OpenClaw ini".

Gunakan allowlist room yang ketat dan persyaratan mention saat mengaktifkan lalu lintas bot-ke-bot di room bersama.

## Enkripsi dan verifikasi

Di room terenkripsi (E2EE), event gambar outbound menggunakan `thumbnail_file` sehingga pratinjau gambar dienkripsi bersama lampiran lengkap. Room yang tidak terenkripsi tetap menggunakan `thumbnail_url` biasa. Tidak perlu konfigurasi — Plugin mendeteksi status E2EE secara otomatis.

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

Bootstrap status verifikasi dan cross-signing:

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

Perintah ini melaporkan tiga status terpisah:

- `Recovery key accepted`: Matrix menerima recovery key untuk penyimpanan secret atau kepercayaan perangkat.
- `Backup usable`: backup room-key dapat dimuat dengan material recovery tepercaya.
- `Device verified by owner`: perangkat OpenClaw saat ini memiliki kepercayaan identitas cross-signing Matrix penuh.

`Signed by owner` dalam output verbose atau JSON hanya bersifat diagnostik. OpenClaw tidak
menganggap itu cukup kecuali `Cross-signing verified` juga `yes`.

Perintah ini tetap keluar dengan status non-zero saat kepercayaan identitas Matrix penuh belum lengkap,
meskipun recovery key dapat membuka material backup. Dalam kasus tersebut, selesaikan
verifikasi mandiri dari klien Matrix lain:

```bash
openclaw matrix verify self
```

Terima permintaan tersebut di klien Matrix lain, bandingkan emoji atau angka SAS,
dan ketik `yes` hanya jika cocok. Perintah ini menunggu hingga Matrix melaporkan
`Cross-signing verified: yes` sebelum keluar dengan sukses.

Gunakan `verify bootstrap --force-reset-cross-signing` hanya jika Anda memang
ingin mengganti identitas cross-signing saat ini.

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

Alur verifikasi mandiri interaktif:

```bash
openclaw matrix verify self
```

Untuk permintaan verifikasi level lebih rendah atau masuk, gunakan:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Gunakan `openclaw matrix verify cancel <id>` untuk membatalkan permintaan.

Diagnostik pemulihan verbose:

```bash
openclaw matrix verify backup restore --verbose
```

Hapus backup server saat ini dan buat baseline backup baru. Jika backup key yang tersimpan
tidak dapat dimuat dengan bersih, reset ini juga dapat membuat ulang secret storage sehingga
cold start di masa mendatang dapat memuat backup key yang baru:

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

Saat enkripsi dinonaktifkan atau tidak tersedia untuk akun bernama, peringatan Matrix dan error verifikasi menunjuk ke kunci konfigurasi akun tersebut, misalnya `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Apa arti verified">
    OpenClaw memperlakukan perangkat sebagai terverifikasi hanya ketika identitas cross-signing Anda sendiri menandatanganinya. `verify status --verbose` menampilkan tiga sinyal kepercayaan:

    - `Locally trusted`: dipercaya hanya oleh klien ini
    - `Cross-signing verified`: SDK melaporkan verifikasi melalui cross-signing
    - `Signed by owner`: ditandatangani oleh self-signing key Anda sendiri

    `Verified by owner` menjadi `yes` hanya ketika verifikasi cross-signing ada.
    Kepercayaan lokal atau tanda tangan pemilik saja tidak cukup bagi OpenClaw untuk memperlakukan
    perangkat sebagai sepenuhnya terverifikasi.

  </Accordion>

  <Accordion title="Apa yang dilakukan bootstrap">
    `verify bootstrap` adalah perintah perbaikan dan penyiapan untuk akun terenkripsi. Secara berurutan, perintah ini:

    - mem-bootstrap secret storage, menggunakan kembali recovery key yang ada jika memungkinkan
    - mem-bootstrap cross-signing dan mengunggah public cross-signing key yang belum ada
    - menandai dan menandatangani silang perangkat saat ini
    - membuat backup room-key sisi server jika belum ada

    Jika homeserver memerlukan UIA untuk mengunggah cross-signing key, OpenClaw mencoba tanpa autentikasi terlebih dahulu, lalu `m.login.dummy`, lalu `m.login.password` (memerlukan `channels.matrix.password`). Gunakan `--force-reset-cross-signing` hanya saat memang ingin membuang identitas saat ini.

  </Accordion>

  <Accordion title="Baseline backup baru">
    Jika Anda ingin menjaga agar pesan terenkripsi di masa depan tetap berfungsi dan menerima kehilangan riwayat lama yang tidak dapat dipulihkan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Tambahkan `--account <id>` untuk menargetkan akun bernama. Ini juga dapat membuat ulang secret storage jika secret backup saat ini tidak dapat dimuat dengan aman.

  </Accordion>

  <Accordion title="Perilaku startup">
    Dengan `encryption: true`, `startupVerification` default ke `"if-unverified"`. Saat startup, perangkat yang belum terverifikasi meminta verifikasi mandiri di klien Matrix lain, melewati duplikat dan menerapkan cooldown. Sesuaikan dengan `startupVerificationCooldownHours` atau nonaktifkan dengan `startupVerification: "off"`.

    Startup juga menjalankan proses bootstrap crypto konservatif yang menggunakan kembali secret storage dan identitas cross-signing saat ini. Jika status bootstrap rusak, OpenClaw mencoba perbaikan terjaga bahkan tanpa `channels.matrix.password`; jika homeserver memerlukan UIA password, startup mencatat peringatan dan tetap tidak fatal. Perangkat yang sudah ditandatangani pemilik tetap dipertahankan.

    Lihat [Migrasi Matrix](/id/install/migrating-matrix) untuk alur upgrade lengkap.

  </Accordion>

  <Accordion title="Pemberitahuan verifikasi">
    Matrix memposting pemberitahuan siklus hidup verifikasi ke room verifikasi DM ketat sebagai pesan `m.notice`: permintaan, siap (dengan panduan "Verifikasi dengan emoji"), mulai/selesai, dan detail SAS (emoji/angka) jika tersedia.

    Permintaan masuk dari klien Matrix lain dilacak dan diterima otomatis. Untuk verifikasi mandiri, OpenClaw memulai alur SAS secara otomatis dan mengonfirmasi sisinya sendiri setelah verifikasi emoji tersedia — Anda tetap perlu membandingkan dan mengonfirmasi "They match" di klien Matrix Anda.

    Pemberitahuan sistem verifikasi tidak diteruskan ke pipeline obrolan agent.

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

    Status runtime terenkripsi berada di bawah `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` dan mencakup sync store, crypto store, recovery key, snapshot IDB, binding thread, dan status verifikasi startup. Saat token berubah tetapi identitas akun tetap sama, OpenClaw menggunakan kembali root terbaik yang ada sehingga status sebelumnya tetap terlihat.

  </Accordion>
</AccordionGroup>

## Manajemen profil

Perbarui profil mandiri Matrix untuk akun yang dipilih dengan:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Tambahkan `--account <id>` saat Anda ingin secara eksplisit menargetkan akun Matrix bernama.

Matrix menerima URL avatar `mxc://` secara langsung. Saat Anda memberikan URL avatar `http://` atau `https://`, OpenClaw akan mengunggahnya ke Matrix terlebih dahulu dan menyimpan kembali URL `mxc://` yang telah diselesaikan ke `channels.matrix.avatarUrl` (atau override akun yang dipilih).

## Thread

Matrix mendukung thread Matrix native baik untuk balasan otomatis maupun pengiriman message-tool.

- `dm.sessionScope: "per-user"` (default) mempertahankan perutean DM Matrix berbasis pengirim, sehingga beberapa room DM dapat berbagi satu sesi saat semuanya terselesaikan ke peer yang sama.
- `dm.sessionScope: "per-room"` mengisolasi setiap room DM Matrix ke dalam kunci sesinya sendiri sambil tetap menggunakan autentikasi DM normal dan pemeriksaan allowlist.
- Binding percakapan Matrix eksplisit tetap mengungguli `dm.sessionScope`, sehingga room dan thread yang terikat tetap mempertahankan sesi target yang dipilih.
- `threadReplies: "off"` menjaga balasan tetap di level teratas dan mempertahankan pesan thread masuk pada sesi induk.
- `threadReplies: "inbound"` membalas di dalam thread hanya jika pesan masuk memang sudah berada di thread tersebut.
- `threadReplies: "always"` mempertahankan balasan room di thread yang berakar pada pesan pemicu dan merutekan percakapan itu melalui sesi bercakupan thread yang cocok sejak pesan pemicu pertama.
- `dm.threadReplies` meng-override setelan level atas khusus untuk DM. Misalnya, Anda dapat menjaga thread room tetap terisolasi sambil menjaga DM tetap datar.
- Pesan thread masuk menyertakan pesan akar thread sebagai konteks agent tambahan.
- Pengiriman message-tool otomatis mewarisi thread Matrix saat ini ketika targetnya adalah room yang sama, atau target pengguna DM yang sama, kecuali `threadId` eksplisit diberikan.
- Penggunaan ulang target pengguna DM dalam sesi yang sama hanya aktif ketika metadata sesi saat ini membuktikan peer DM yang sama pada akun Matrix yang sama; jika tidak, OpenClaw kembali ke perutean normal bercakupan pengguna.
- Saat OpenClaw melihat room DM Matrix bertabrakan dengan room DM lain pada sesi DM Matrix bersama yang sama, ia memposting `m.notice` satu kali di room tersebut dengan escape hatch `/focus` saat binding thread diaktifkan dan petunjuk `dm.sessionScope`.
- Binding thread runtime didukung untuk Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, dan `/acp spawn` yang terikat thread berfungsi di room dan DM Matrix.
- `/focus` Matrix room/DM level atas membuat thread Matrix baru dan mengikatnya ke sesi target saat `threadBindings.spawnSubagentSessions=true`.
- Menjalankan `/focus` atau `/acp spawn --thread here` di dalam thread Matrix yang ada akan mengikat thread saat itu.

## Binding percakapan ACP

Room Matrix, DM, dan thread Matrix yang ada dapat diubah menjadi workspace ACP tahan lama tanpa mengubah permukaan obrolan.

Alur operator cepat:

- Jalankan `/acp spawn codex --bind here` di dalam DM, room, atau thread Matrix yang ada dan ingin terus digunakan.
- Di Matrix DM atau room level atas, DM/room saat ini tetap menjadi permukaan obrolan dan pesan selanjutnya dirutekan ke sesi ACP yang di-spawn.
- Di dalam thread Matrix yang ada, `--bind here` mengikat thread saat ini di tempat.
- `/new` dan `/reset` mereset sesi ACP terikat yang sama di tempat.
- `/acp close` menutup sesi ACP dan menghapus binding.

Catatan:

- `--bind here` tidak membuat thread Matrix anak.
- `threadBindings.spawnAcpSessions` hanya diperlukan untuk `/acp spawn --thread auto|here`, saat OpenClaw perlu membuat atau mengikat thread Matrix anak.

### Konfigurasi binding thread

Matrix mewarisi default global dari `session.threadBindings`, dan juga mendukung override per saluran:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flag spawn terikat thread Matrix bersifat opt-in:

- Setel `threadBindings.spawnSubagentSessions: true` untuk mengizinkan `/focus` level atas membuat dan mengikat thread Matrix baru.
- Setel `threadBindings.spawnAcpSessions: true` untuk mengizinkan `/acp spawn --thread auto|here` mengikat sesi ACP ke thread Matrix.

## Reaksi

Matrix mendukung aksi reaksi outbound, notifikasi reaksi inbound, dan reaksi ack inbound.

- Tooling reaksi outbound dibatasi oleh `channels["matrix"].actions.reactions`.
- `react` menambahkan reaksi ke event Matrix tertentu.
- `reactions` mencantumkan ringkasan reaksi saat ini untuk event Matrix tertentu.
- `emoji=""` menghapus reaksi milik akun bot sendiri pada event tersebut.
- `remove: true` hanya menghapus reaksi emoji yang ditentukan dari akun bot.

Cakupan resolusi reaksi ack menggunakan urutan standar OpenClaw:

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

- `reactionNotifications: "own"` meneruskan event `m.reaction` yang ditambahkan saat event tersebut menargetkan pesan Matrix yang ditulis bot.
- `reactionNotifications: "off"` menonaktifkan event sistem reaksi.
- Penghapusan reaksi tidak disintesis menjadi event sistem karena Matrix menampilkannya sebagai redaksi, bukan sebagai penghapusan `m.reaction` mandiri.

## Konteks riwayat

- `channels.matrix.historyLimit` mengontrol berapa banyak pesan room terbaru yang disertakan sebagai `InboundHistory` saat pesan room Matrix memicu agent. Ini fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- Riwayat room Matrix hanya untuk room. DM tetap menggunakan riwayat sesi normal.
- Riwayat room Matrix hanya untuk pending: OpenClaw membuffer pesan room yang belum memicu balasan, lalu mengambil snapshot jendela tersebut saat mention atau pemicu lain datang.
- Pesan pemicu saat ini tidak disertakan dalam `InboundHistory`; pesan tersebut tetap berada di body inbound utama untuk giliran itu.
- Retry event Matrix yang sama menggunakan kembali snapshot riwayat asli alih-alih bergeser maju ke pesan room yang lebih baru.

## Visibilitas konteks

Matrix mendukung kontrol `contextVisibility` bersama untuk konteks room tambahan seperti teks balasan yang diambil, akar thread, dan riwayat pending.

- `contextVisibility: "all"` adalah default. Konteks tambahan dipertahankan sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang diizinkan oleh pemeriksaan allowlist room/pengguna yang aktif.
- `contextVisibility: "allowlist_quote"` berperilaku seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Setelan ini memengaruhi visibilitas konteks tambahan, bukan apakah pesan inbound itu sendiri dapat memicu balasan.
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

Lihat [Grup](/id/channels/groups) untuk perilaku pembatasan mention dan allowlist.

Contoh pairing untuk DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Jika pengguna Matrix yang belum disetujui terus mengirim pesan kepada Anda sebelum disetujui, OpenClaw menggunakan kembali kode pairing pending yang sama dan mungkin mengirim balasan pengingat lagi setelah cooldown singkat alih-alih mencetak kode baru.

Lihat [Pairing](/id/channels/pairing) untuk alur pairing DM bersama dan tata letak penyimpanan.

## Perbaikan room direct

Jika status direct-message tidak sinkron, OpenClaw dapat berakhir dengan pemetaan `m.direct` basi yang menunjuk ke room solo lama alih-alih DM yang aktif. Periksa pemetaan saat ini untuk peer dengan:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Perbaiki dengan:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Alur perbaikan:

- lebih memilih DM 1:1 ketat yang sudah dipetakan di `m.direct`
- fallback ke DM 1:1 ketat yang saat ini sudah diikuti dengan pengguna tersebut
- membuat room direct baru dan menulis ulang `m.direct` jika tidak ada DM sehat

Alur perbaikan tidak menghapus room lama secara otomatis. Alur ini hanya memilih DM yang sehat dan memperbarui pemetaan agar pengiriman Matrix baru, pemberitahuan verifikasi, dan alur direct-message lain kembali menargetkan room yang benar.

## Persetujuan exec

Matrix dapat bertindak sebagai klien persetujuan native untuk akun Matrix. Tombol perutean
DM/saluran native tetap berada di bawah konfigurasi persetujuan exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opsional; fallback ke `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Pemberi persetujuan harus berupa ID pengguna Matrix seperti `@owner:example.org`. Matrix otomatis mengaktifkan persetujuan native saat `enabled` tidak disetel atau `"auto"` dan setidaknya satu pemberi persetujuan dapat diselesaikan. Persetujuan exec menggunakan `execApprovals.approvers` terlebih dahulu dan dapat fallback ke `channels.matrix.dm.allowFrom`. Persetujuan Plugin mengotorisasi melalui `channels.matrix.dm.allowFrom`. Setel `enabled: false` untuk menonaktifkan Matrix sebagai klien persetujuan native secara eksplisit. Jika tidak, permintaan persetujuan akan fallback ke rute persetujuan lain yang dikonfigurasi atau kebijakan fallback persetujuan.

Perutean native Matrix mendukung kedua jenis persetujuan:

- `channels.matrix.execApprovals.*` mengontrol mode fanout DM/saluran native untuk prompt persetujuan Matrix.
- Persetujuan exec menggunakan kumpulan pemberi persetujuan exec dari `execApprovals.approvers` atau `channels.matrix.dm.allowFrom`.
- Persetujuan Plugin menggunakan allowlist DM Matrix dari `channels.matrix.dm.allowFrom`.
- Pintasan reaksi Matrix dan pembaruan pesan berlaku untuk persetujuan exec maupun Plugin.

Aturan pengiriman:

- `target: "dm"` mengirim prompt persetujuan ke DM pemberi persetujuan
- `target: "channel"` mengirim prompt kembali ke room atau DM Matrix asal
- `target: "both"` mengirim ke DM pemberi persetujuan dan room atau DM Matrix asal

Prompt persetujuan Matrix menanam pintasan reaksi pada pesan persetujuan utama:

- `✅` = izinkan sekali
- `❌` = tolak
- `♾️` = selalu izinkan saat keputusan tersebut diizinkan oleh kebijakan exec efektif

Pemberi persetujuan dapat bereaksi pada pesan tersebut atau menggunakan slash command fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, atau `/approve <id> deny`.

Hanya pemberi persetujuan yang telah diselesaikan yang dapat menyetujui atau menolak. Untuk persetujuan exec, pengiriman saluran menyertakan teks perintah, jadi aktifkan `channel` atau `both` hanya di room tepercaya.

Override per akun:

- `channels.matrix.accounts.<account>.execApprovals`

Dokumentasi terkait: [Persetujuan exec](/id/tools/exec-approvals)

## Slash command

Slash command Matrix (misalnya `/new`, `/reset`, `/model`) berfungsi langsung di DM. Di room, OpenClaw juga mengenali slash command yang diawali dengan mention Matrix bot itu sendiri, sehingga `@bot:server /new` memicu jalur perintah tanpa memerlukan regex mention kustom. Ini menjaga bot tetap responsif terhadap posting gaya room `@mention /command` yang dipancarkan oleh Element dan klien serupa saat pengguna melakukan tab-complete pada bot sebelum mengetik perintah.

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

Nilai `channels.matrix` level atas bertindak sebagai default untuk akun bernama kecuali suatu akun meng-override-nya.
Anda dapat memberi cakupan entri room yang diwariskan ke satu akun Matrix dengan `groups.<room>.account`.
Entri tanpa `account` tetap dibagikan di semua akun Matrix, dan entri dengan `account: "default"` tetap berfungsi saat akun default dikonfigurasi langsung di `channels.matrix.*` level atas.
Default autentikasi bersama parsial tidak dengan sendirinya membuat akun default implisit terpisah. OpenClaw hanya mensintesis akun `default` level atas saat default tersebut memiliki autentikasi baru (`homeserver` plus `accessToken`, atau `homeserver` plus `userId` dan `password`); akun bernama tetap dapat ditemukan dari `homeserver` plus `userId` saat kredensial yang di-cache memenuhi autentikasi nantinya.
Jika Matrix sudah memiliki tepat satu akun bernama, atau `defaultAccount` menunjuk ke kunci akun bernama yang sudah ada, promosi perbaikan/penyiapan dari akun tunggal ke multi-akun akan mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru. Hanya kunci autentikasi/bootstrap Matrix yang dipindahkan ke akun yang dipromosikan itu; kunci kebijakan pengiriman bersama tetap di level atas.
Setel `defaultAccount` saat Anda ingin OpenClaw lebih memilih satu akun Matrix bernama untuk perutean implisit, probing, dan operasi CLI.
Jika beberapa akun Matrix dikonfigurasi dan satu id akun adalah `default`, OpenClaw menggunakan akun tersebut secara implisit bahkan saat `defaultAccount` tidak disetel.
Jika Anda mengonfigurasi beberapa akun bernama, setel `defaultAccount` atau berikan `--account <id>` untuk perintah CLI yang mengandalkan pemilihan akun implisit.
Berikan `--account <id>` ke `openclaw matrix verify ...` dan `openclaw matrix devices ...` saat Anda ingin meng-override pemilihan implisit itu untuk satu perintah.

Lihat [Referensi konfigurasi](/id/gateway/config-channels#multi-account-all-channels) untuk pola multi-akun bersama.

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
`http://matrix.example.org:8008` tetap diblokir. Sebisa mungkin, gunakan `https://`.

## Proxy lalu lintas Matrix

Jika deployment Matrix Anda memerlukan proxy HTTP(S) outbound eksplisit, setel `channels.matrix.proxy`:

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

Akun bernama dapat meng-override default level atas dengan `channels.matrix.accounts.<id>.proxy`.
OpenClaw menggunakan setelan proxy yang sama untuk lalu lintas Matrix runtime dan probe status akun.

## Resolusi target

Matrix menerima bentuk target ini di mana pun OpenClaw meminta target room atau pengguna:

- Pengguna: `@user:server`, `user:@user:server`, atau `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, atau `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, atau `matrix:channel:#alias:server`

Lookup direktori live menggunakan akun Matrix yang sedang login:

- Lookup pengguna menanyakan direktori pengguna Matrix pada homeserver tersebut.
- Lookup room menerima ID room dan alias eksplisit secara langsung, lalu fallback ke pencarian nama room yang diikuti untuk akun tersebut.
- Lookup nama joined-room bersifat best-effort. Jika nama room tidak dapat diselesaikan menjadi ID atau alias, nama tersebut diabaikan oleh resolusi allowlist runtime.

## Referensi konfigurasi

- `enabled`: aktifkan atau nonaktifkan saluran.
- `name`: label opsional untuk akun.
- `defaultAccount`: ID akun pilihan saat beberapa akun Matrix dikonfigurasi.
- `homeserver`: URL homeserver, misalnya `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: izinkan akun Matrix ini terhubung ke homeserver private/internal. Aktifkan ini saat homeserver diselesaikan ke `localhost`, IP LAN/Tailscale, atau host internal seperti `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opsional untuk lalu lintas Matrix. Akun bernama dapat meng-override default level atas dengan `proxy` miliknya sendiri.
- `userId`: ID pengguna Matrix lengkap, misalnya `@bot:example.org`.
- `accessToken`: access token untuk autentikasi berbasis token. Nilai plaintext dan nilai SecretRef didukung untuk `channels.matrix.accessToken` dan `channels.matrix.accounts.<id>.accessToken` pada provider env/file/exec. Lihat [Manajemen Secrets](/id/gateway/secrets).
- `password`: password untuk login berbasis password. Nilai plaintext dan nilai SecretRef didukung.
- `deviceId`: ID perangkat Matrix eksplisit.
- `deviceName`: nama tampilan perangkat untuk login password.
- `avatarUrl`: URL avatar mandiri yang disimpan untuk sinkronisasi profil dan pembaruan `profile set`.
- `initialSyncLimit`: jumlah maksimum event yang diambil selama sinkronisasi startup.
- `encryption`: aktifkan E2EE.
- `allowlistOnly`: saat `true`, meningkatkan kebijakan room `open` menjadi `allowlist`, dan memaksa semua kebijakan DM aktif kecuali `disabled` (termasuk `pairing` dan `open`) menjadi `allowlist`. Tidak memengaruhi kebijakan `disabled`.
- `allowBots`: izinkan pesan dari akun Matrix OpenClaw lain yang telah dikonfigurasi (`true` atau `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, atau `disabled`.
- `contextVisibility`: mode visibilitas konteks room tambahan (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID pengguna untuk lalu lintas room. ID pengguna Matrix lengkap adalah yang paling aman; kecocokan direktori yang tepat diselesaikan saat startup dan saat allowlist berubah ketika monitor berjalan. Nama yang tidak terselesaikan diabaikan.
- `historyLimit`: jumlah maksimum pesan room yang disertakan sebagai konteks riwayat grup. Fallback ke `messages.groupChat.historyLimit`; jika keduanya tidak disetel, default efektifnya adalah `0`. Setel `0` untuk menonaktifkan.
- `replyToMode`: `off`, `first`, `all`, atau `batched`.
- `markdown`: konfigurasi rendering Markdown opsional untuk teks Matrix outbound.
- `streaming`: `off` (default), `"partial"`, `"quiet"`, `true`, atau `false`. `"partial"` dan `true` mengaktifkan pembaruan draft yang mengutamakan pratinjau dengan pesan teks Matrix biasa. `"quiet"` menggunakan pemberitahuan pratinjau tanpa notifikasi untuk penyiapan aturan push self-hosted. `false` setara dengan `"off"`.
- `blockStreaming`: `true` mengaktifkan pesan progres terpisah untuk blok assistant yang sudah selesai saat streaming pratinjau draft aktif.
- `threadReplies`: `off`, `inbound`, atau `always`.
- `threadBindings`: override per saluran untuk perutean sesi dan siklus hidup yang terikat thread.
- `startupVerification`: mode permintaan verifikasi mandiri otomatis saat startup (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown sebelum mencoba lagi permintaan verifikasi startup otomatis.
- `textChunkLimit`: ukuran chunk pesan outbound dalam karakter (berlaku saat `chunkMode` adalah `length`).
- `chunkMode`: `length` membagi pesan berdasarkan jumlah karakter; `newline` membaginya di batas baris.
- `responsePrefix`: string opsional yang ditambahkan di depan semua balasan outbound untuk saluran ini.
- `ackReaction`: override reaksi ack opsional untuk saluran/akun ini.
- `ackReactionScope`: override cakupan reaksi ack opsional (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: mode notifikasi reaksi inbound (`own`, `off`).
- `mediaMaxMb`: batas ukuran media dalam MB untuk pengiriman outbound dan pemrosesan media inbound.
- `autoJoin`: kebijakan auto-join undangan (`always`, `allowlist`, `off`). Default: `off`. Berlaku untuk semua undangan Matrix, termasuk undangan gaya DM.
- `autoJoinAllowlist`: room/alias yang diizinkan saat `autoJoin` adalah `allowlist`. Entri alias diselesaikan ke ID room selama penanganan undangan; OpenClaw tidak memercayai status alias yang diklaim oleh room undangan.
- `dm`: blok kebijakan DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: mengontrol akses DM setelah OpenClaw bergabung ke room dan mengklasifikasikannya sebagai DM. Ini tidak mengubah apakah undangan di-auto-join.
- `dm.allowFrom`: allowlist ID pengguna untuk lalu lintas DM. ID pengguna Matrix lengkap adalah yang paling aman; kecocokan direktori yang tepat diselesaikan saat startup dan saat allowlist berubah ketika monitor berjalan. Nama yang tidak terselesaikan diabaikan.
- `dm.sessionScope`: `per-user` (default) atau `per-room`. Gunakan `per-room` saat Anda ingin setiap room DM Matrix mempertahankan konteks terpisah meskipun peer-nya sama.
- `dm.threadReplies`: override kebijakan thread khusus DM (`off`, `inbound`, `always`). Ini meng-override setelan `threadReplies` level atas untuk penempatan balasan dan isolasi sesi di DM.
- `execApprovals`: pengiriman persetujuan exec native Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID pengguna Matrix yang diizinkan menyetujui permintaan exec. Opsional saat `dm.allowFrom` sudah mengidentifikasi pemberi persetujuan.
- `execApprovals.target`: `dm | channel | both` (default: `dm`).
- `accounts`: override bernama per akun. Nilai `channels.matrix` level atas bertindak sebagai default untuk entri ini.
- `groups`: peta kebijakan per room. Utamakan ID room atau alias; nama room yang tidak terselesaikan diabaikan saat runtime. Identitas sesi/grup menggunakan ID room stabil setelah resolusi.
- `groups.<room>.account`: batasi satu entri room yang diwariskan ke akun Matrix tertentu dalam penyiapan multi-akun.
- `groups.<room>.allowBots`: override level room untuk pengirim bot yang dikonfigurasi (`true` atau `"mentions"`).
- `groups.<room>.users`: allowlist pengirim per room.
- `groups.<room>.tools`: override izinkan/tolak tool per room.
- `groups.<room>.autoReply`: override pembatasan mention level room. `true` menonaktifkan persyaratan mention untuk room tersebut; `false` memaksanya aktif kembali.
- `groups.<room>.skills`: filter skill level room opsional.
- `groups.<room>.systemPrompt`: cuplikan system prompt level room opsional.
- `rooms`: alias lama untuk `groups`.
- `actions`: pembatasan tool per aksi (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
