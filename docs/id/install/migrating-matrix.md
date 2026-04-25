---
read_when:
    - Meng-upgrade instalasi Matrix yang sudah ada
    - Memigrasikan riwayat Matrix terenkripsi dan state perangkat
summary: Cara OpenClaw meng-upgrade Plugin Matrix sebelumnya di tempat, termasuk batas pemulihan state terenkripsi dan langkah pemulihan manual.
title: Migrasi Matrix
x-i18n:
    generated_at: "2026-04-25T13:48:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

Halaman ini membahas upgrade dari plugin `matrix` publik sebelumnya ke implementasi saat ini.

Bagi sebagian besar pengguna, upgrade dilakukan di tempat:

- plugin tetap `@openclaw/matrix`
- channel tetap `matrix`
- konfigurasi Anda tetap di bawah `channels.matrix`
- kredensial cache tetap di bawah `~/.openclaw/credentials/matrix/`
- state runtime tetap di bawah `~/.openclaw/matrix/`

Anda tidak perlu mengganti nama kunci konfigurasi atau menginstal ulang plugin dengan nama baru.

## Apa yang dilakukan migrasi secara otomatis

Saat gateway dimulai, dan saat Anda menjalankan [`openclaw doctor --fix`](/id/gateway/doctor), OpenClaw mencoba memperbaiki state Matrix lama secara otomatis.
Sebelum langkah migrasi Matrix yang dapat ditindaklanjuti mengubah state di disk, OpenClaw membuat atau menggunakan kembali snapshot pemulihan yang terfokus.

Saat Anda menggunakan `openclaw update`, pemicu pastinya bergantung pada cara OpenClaw diinstal:

- instalasi source menjalankan `openclaw doctor --fix` selama alur pembaruan, lalu me-restart gateway secara default
- instalasi package-manager memperbarui paket, menjalankan doctor pass non-interaktif, lalu mengandalkan restart gateway default agar startup dapat menyelesaikan migrasi Matrix
- jika Anda menggunakan `openclaw update --no-restart`, migrasi Matrix berbasis startup ditunda sampai nanti Anda menjalankan `openclaw doctor --fix` dan me-restart gateway

Migrasi otomatis mencakup:

- membuat atau menggunakan kembali snapshot pra-migrasi di bawah `~/Backups/openclaw-migrations/`
- menggunakan kembali kredensial Matrix cache Anda
- mempertahankan pemilihan akun dan konfigurasi `channels.matrix` yang sama
- memindahkan sync store Matrix datar tertua ke lokasi saat ini dengan cakupan akun
- memindahkan crypto store Matrix datar tertua ke lokasi saat ini dengan cakupan akun saat akun target dapat di-resolve dengan aman
- mengekstrak kunci dekripsi cadangan room-key Matrix yang sebelumnya disimpan dari rust crypto store lama, saat kunci itu ada secara lokal
- menggunakan kembali root penyimpanan hash-token yang paling lengkap untuk akun Matrix, homeserver, dan pengguna yang sama saat access token berubah di kemudian hari
- memindai root penyimpanan hash-token sibling untuk metadata pemulihan state terenkripsi yang tertunda saat access token Matrix berubah tetapi identitas akun/perangkat tetap sama
- memulihkan room key yang telah dicadangkan ke crypto store baru pada startup Matrix berikutnya

Detail snapshot:

- OpenClaw menulis file marker di `~/.openclaw/matrix/migration-snapshot.json` setelah snapshot berhasil sehingga pass startup dan perbaikan berikutnya dapat menggunakan kembali arsip yang sama.
- Snapshot migrasi Matrix otomatis ini hanya mencadangkan konfigurasi + state (`includeWorkspace: false`).
- Jika Matrix hanya memiliki state migrasi berupa peringatan saja, misalnya karena `userId` atau `accessToken` masih hilang, OpenClaw belum membuat snapshot karena belum ada mutasi Matrix yang dapat ditindaklanjuti.
- Jika langkah snapshot gagal, OpenClaw melewati migrasi Matrix untuk eksekusi itu alih-alih mengubah state tanpa titik pemulihan.

Tentang upgrade multi-akun:

- store Matrix datar tertua (`~/.openclaw/matrix/bot-storage.json` dan `~/.openclaw/matrix/crypto/`) berasal dari layout single-store, jadi OpenClaw hanya dapat memigrasikannya ke satu target akun Matrix yang berhasil di-resolve
- store Matrix lama yang sudah memiliki cakupan akun dideteksi dan disiapkan per akun Matrix yang dikonfigurasi

## Apa yang tidak dapat dilakukan migrasi secara otomatis

Plugin Matrix publik sebelumnya **tidak** secara otomatis membuat cadangan room-key Matrix. Plugin itu mempertahankan state crypto lokal dan meminta verifikasi perangkat, tetapi tidak menjamin bahwa room key Anda dicadangkan ke homeserver.

Artinya, beberapa instalasi terenkripsi hanya dapat dimigrasikan sebagian.

OpenClaw tidak dapat memulihkan secara otomatis:

- room key khusus-lokal yang tidak pernah dicadangkan
- state terenkripsi saat akun Matrix target belum dapat di-resolve karena `homeserver`, `userId`, atau `accessToken` masih belum tersedia
- migrasi otomatis satu store Matrix datar bersama saat beberapa akun Matrix dikonfigurasi tetapi `channels.matrix.defaultAccount` tidak disetel
- instalasi path plugin kustom yang dipin ke path repo alih-alih paket Matrix standar
- recovery key yang hilang saat store lama memiliki key yang dicadangkan tetapi tidak menyimpan kunci dekripsinya secara lokal

Cakupan peringatan saat ini:

- instalasi path plugin Matrix kustom ditampilkan baik oleh startup gateway maupun `openclaw doctor`

Jika instalasi lama Anda memiliki riwayat terenkripsi khusus-lokal yang tidak pernah dicadangkan, beberapa pesan terenkripsi lama mungkin tetap tidak dapat dibaca setelah upgrade.

## Alur upgrade yang direkomendasikan

1. Perbarui OpenClaw dan plugin Matrix seperti biasa.
   Sebaiknya gunakan `openclaw update` biasa tanpa `--no-restart` agar startup dapat segera menyelesaikan migrasi Matrix.
2. Jalankan:

   ```bash
   openclaw doctor --fix
   ```

   Jika Matrix memiliki pekerjaan migrasi yang dapat ditindaklanjuti, doctor akan membuat atau menggunakan kembali snapshot pra-migrasi terlebih dahulu dan mencetak path arsipnya.

3. Mulai atau restart gateway.
4. Periksa status verifikasi dan cadangan saat ini:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Jika OpenClaw memberi tahu Anda bahwa recovery key diperlukan, jalankan:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Jika perangkat ini masih belum diverifikasi, jalankan:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   Jika recovery key diterima dan cadangan dapat digunakan, tetapi `Cross-signing verified`
   masih `no`, selesaikan verifikasi mandiri dari klien Matrix lain:

   ```bash
   openclaw matrix verify self
   ```

   Terima permintaan tersebut di klien Matrix lain, bandingkan emoji atau desimalnya,
   dan ketik `yes` hanya jika keduanya cocok. Perintah hanya keluar dengan sukses
   setelah `Cross-signing verified` menjadi `yes`.

7. Jika Anda memang sengaja meninggalkan riwayat lama yang tidak dapat dipulihkan dan menginginkan baseline cadangan baru untuk pesan mendatang, jalankan:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Jika belum ada cadangan key di sisi server, buat satu untuk pemulihan di masa mendatang:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Cara kerja migrasi terenkripsi

Migrasi terenkripsi adalah proses dua tahap:

1. Startup atau `openclaw doctor --fix` membuat atau menggunakan kembali snapshot pra-migrasi jika migrasi terenkripsi dapat ditindaklanjuti.
2. Startup atau `openclaw doctor --fix` memeriksa crypto store Matrix lama melalui instalasi plugin Matrix aktif.
3. Jika kunci dekripsi cadangan ditemukan, OpenClaw menuliskannya ke alur recovery key baru dan menandai pemulihan room-key sebagai tertunda.
4. Pada startup Matrix berikutnya, OpenClaw memulihkan room key yang dicadangkan ke crypto store baru secara otomatis.

Jika store lama melaporkan room key yang tidak pernah dicadangkan, OpenClaw memberikan peringatan alih-alih berpura-pura bahwa pemulihan berhasil.

## Pesan umum dan artinya

### Pesan upgrade dan deteksi

`Matrix plugin upgraded in place.`

- Arti: state Matrix lama di disk terdeteksi dan dimigrasikan ke layout saat ini.
- Yang harus dilakukan: tidak ada kecuali output yang sama juga menyertakan peringatan.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Arti: OpenClaw membuat arsip pemulihan sebelum mengubah state Matrix.
- Yang harus dilakukan: simpan path arsip yang dicetak sampai Anda mengonfirmasi migrasi berhasil.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Arti: OpenClaw menemukan marker snapshot migrasi Matrix yang sudah ada dan menggunakan kembali arsip itu alih-alih membuat cadangan duplikat.
- Yang harus dilakukan: simpan path arsip yang dicetak sampai Anda mengonfirmasi migrasi berhasil.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Arti: state Matrix lama ada, tetapi OpenClaw tidak dapat memetakannya ke akun Matrix saat ini karena Matrix belum dikonfigurasi.
- Yang harus dilakukan: konfigurasikan `channels.matrix`, lalu jalankan kembali `openclaw doctor --fix` atau restart gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: OpenClaw menemukan state lama, tetapi masih belum dapat menentukan root akun/perangkat saat ini yang tepat.
- Yang harus dilakukan: mulai gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial cache ada.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu store Matrix datar bersama, tetapi menolak menebak akun Matrix bernama mana yang harus menerimanya.
- Yang harus dilakukan: setel `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan kembali `openclaw doctor --fix` atau restart gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Arti: lokasi baru dengan cakupan akun sudah memiliki store sync atau crypto, jadi OpenClaw tidak menimpanya secara otomatis.
- Yang harus dilakukan: verifikasi bahwa akun saat ini adalah akun yang benar sebelum menghapus atau memindahkan target yang konflik secara manual.

`Failed migrating Matrix legacy sync store (...)` atau `Failed migrating Matrix legacy crypto store (...)`

- Arti: OpenClaw mencoba memindahkan state Matrix lama tetapi operasi filesystem gagal.
- Yang harus dilakukan: periksa izin filesystem dan kondisi disk, lalu jalankan kembali `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Arti: OpenClaw menemukan store Matrix terenkripsi lama, tetapi tidak ada konfigurasi Matrix saat ini untuk menempelkannya.
- Yang harus dilakukan: konfigurasikan `channels.matrix`, lalu jalankan kembali `openclaw doctor --fix` atau restart gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Arti: store terenkripsi ada, tetapi OpenClaw tidak dapat memutuskan dengan aman akun/perangkat saat ini mana yang memilikinya.
- Yang harus dilakukan: mulai gateway sekali dengan login Matrix yang berfungsi, atau jalankan ulang `openclaw doctor --fix` setelah kredensial cache tersedia.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Arti: OpenClaw menemukan satu crypto store lama bersama yang datar, tetapi menolak menebak akun Matrix bernama mana yang harus menerimanya.
- Yang harus dilakukan: setel `channels.matrix.defaultAccount` ke akun yang dimaksud, lalu jalankan kembali `openclaw doctor --fix` atau restart gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Arti: OpenClaw mendeteksi state Matrix lama, tetapi migrasi masih terblokir oleh data identitas atau kredensial yang hilang.
- Yang harus dilakukan: selesaikan login Matrix atau penyiapan konfigurasi, lalu jalankan kembali `openclaw doctor --fix` atau restart gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Arti: OpenClaw menemukan state Matrix terenkripsi lama, tetapi tidak dapat memuat entrypoint helper dari plugin Matrix yang biasanya memeriksa store tersebut.
- Yang harus dilakukan: instal ulang atau perbaiki plugin Matrix (`openclaw plugins install @openclaw/matrix`, atau `openclaw plugins install ./path/to/local/matrix-plugin` untuk checkout repo), lalu jalankan kembali `openclaw doctor --fix` atau restart gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Arti: OpenClaw menemukan path file helper yang keluar dari root plugin atau gagal dalam pemeriksaan batas plugin, sehingga OpenClaw menolak untuk mengimpornya.
- Yang harus dilakukan: instal ulang plugin Matrix dari path tepercaya, lalu jalankan kembali `openclaw doctor --fix` atau restart gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Arti: OpenClaw menolak mengubah state Matrix karena tidak dapat membuat snapshot pemulihan terlebih dahulu.
- Yang harus dilakukan: selesaikan error cadangan, lalu jalankan kembali `openclaw doctor --fix` atau restart gateway.

`Failed migrating legacy Matrix client storage: ...`

- Arti: fallback sisi-klien Matrix menemukan penyimpanan datar lama, tetapi pemindahan gagal. OpenClaw sekarang membatalkan fallback tersebut alih-alih diam-diam memulai dengan store baru.
- Yang harus dilakukan: periksa izin filesystem atau konflik, pertahankan state lama tetap utuh, dan coba lagi setelah memperbaiki error.

`Matrix is installed from a custom path: ...`

- Arti: Matrix dipin ke instalasi path, sehingga pembaruan mainline tidak otomatis menggantinya dengan paket Matrix standar repo.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix` saat Anda ingin kembali ke plugin Matrix default.

### Pesan pemulihan state terenkripsi

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Arti: room key yang dicadangkan berhasil dipulihkan ke crypto store baru.
- Yang harus dilakukan: biasanya tidak ada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Arti: beberapa room key lama hanya ada di store lokal lama dan tidak pernah diunggah ke cadangan Matrix.
- Yang harus dilakukan: perkirakan sebagian riwayat terenkripsi lama tetap tidak tersedia kecuali Anda dapat memulihkan key tersebut secara manual dari klien lain yang telah diverifikasi.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Arti: cadangan ada, tetapi OpenClaw tidak dapat memulihkan recovery key secara otomatis.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Arti: OpenClaw menemukan store terenkripsi lama, tetapi tidak dapat memeriksanya dengan cukup aman untuk menyiapkan pemulihan.
- Yang harus dilakukan: jalankan kembali `openclaw doctor --fix`. Jika terulang, pertahankan direktori state lama tetap utuh dan pulihkan menggunakan klien Matrix lain yang telah diverifikasi ditambah `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Arti: OpenClaw mendeteksi konflik backup key dan menolak menimpa file recovery-key saat ini secara otomatis.
- Yang harus dilakukan: verifikasi recovery key mana yang benar sebelum mencoba ulang perintah pemulihan apa pun.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Arti: ini adalah batas keras dari format penyimpanan lama.
- Yang harus dilakukan: key yang dicadangkan masih dapat dipulihkan, tetapi riwayat terenkripsi khusus-lokal mungkin tetap tidak tersedia.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Arti: plugin baru mencoba melakukan pemulihan tetapi Matrix mengembalikan error.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup status`, lalu coba lagi dengan `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` bila perlu.

### Pesan pemulihan manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Arti: OpenClaw tahu Anda seharusnya memiliki backup key, tetapi key itu tidak aktif di perangkat ini.
- Yang harus dilakukan: jalankan `openclaw matrix verify backup restore`, atau tambahkan `--recovery-key` bila diperlukan.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Arti: perangkat ini saat ini belum menyimpan recovery key.
- Yang harus dilakukan: verifikasi perangkat dengan recovery key Anda terlebih dahulu, lalu pulihkan cadangannya.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Arti: key yang tersimpan tidak cocok dengan cadangan Matrix yang aktif.
- Yang harus dilakukan: jalankan ulang `openclaw matrix verify device "<your-recovery-key>"` dengan key yang benar.

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan, Anda dapat mereset
baseline cadangan saat ini dengan `openclaw matrix verify backup reset --yes`. Saat
secret cadangan yang tersimpan rusak, reset itu juga dapat membuat ulang secret storage agar
backup key baru dapat dimuat dengan benar setelah restart.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Arti: cadangan ada, tetapi perangkat ini belum cukup kuat memercayai rantai cross-signing.
- Yang harus dilakukan: jalankan ulang `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Arti: Anda mencoba langkah pemulihan tanpa memberikan recovery key saat key tersebut diperlukan.
- Yang harus dilakukan: jalankan ulang perintah dengan recovery key Anda.

`Invalid Matrix recovery key: ...`

- Arti: key yang diberikan tidak dapat di-parse atau tidak cocok dengan format yang diharapkan.
- Yang harus dilakukan: coba lagi dengan recovery key persis dari klien Matrix atau file recovery-key Anda.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Arti: OpenClaw dapat menerapkan recovery key, tetapi Matrix masih belum
  membangun kepercayaan identitas cross-signing penuh untuk perangkat ini. Periksa
  output perintah untuk `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified`, dan `Device verified by owner`.
- Yang harus dilakukan: jalankan `openclaw matrix verify self`, terima permintaan di
  klien Matrix lain, bandingkan SAS, dan ketik `yes` hanya jika cocok. Perintah
  menunggu kepercayaan identitas Matrix penuh sebelum melaporkan keberhasilan. Gunakan
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  hanya saat Anda memang ingin mengganti identitas cross-signing saat ini.

`Matrix key backup is not active on this device after loading from secret storage.`

- Arti: secret storage tidak menghasilkan sesi cadangan aktif di perangkat ini.
- Yang harus dilakukan: verifikasi perangkat terlebih dahulu, lalu periksa ulang dengan `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Arti: perangkat ini tidak dapat memulihkan dari secret storage sampai verifikasi perangkat selesai.
- Yang harus dilakukan: jalankan `openclaw matrix verify device "<your-recovery-key>"` terlebih dahulu.

### Pesan instalasi plugin kustom

`Matrix is installed from a custom path that no longer exists: ...`

- Arti: catatan instalasi plugin Anda menunjuk ke path lokal yang sudah tidak ada.
- Yang harus dilakukan: instal ulang dengan `openclaw plugins install @openclaw/matrix`, atau jika Anda menjalankan dari checkout repo, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Jika riwayat terenkripsi masih tidak kembali

Jalankan pemeriksaan ini secara berurutan:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Jika cadangan berhasil dipulihkan tetapi beberapa room lama masih kehilangan riwayat, key yang hilang itu kemungkinan memang tidak pernah dicadangkan oleh plugin sebelumnya.

## Jika Anda ingin memulai dari awal untuk pesan mendatang

Jika Anda menerima kehilangan riwayat terenkripsi lama yang tidak dapat dipulihkan dan hanya menginginkan baseline cadangan yang bersih untuk ke depannya, jalankan perintah ini secara berurutan:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Jika perangkat masih belum diverifikasi setelah itu, selesaikan verifikasi dari klien Matrix Anda dengan membandingkan emoji SAS atau kode desimal dan mengonfirmasi bahwa keduanya cocok.

## Halaman terkait

- [Matrix](/id/channels/matrix)
- [Doctor](/id/gateway/doctor)
- [Migrating](/id/install/migrating)
- [Plugins](/id/tools/plugin)
