---
read_when:
    - Anda ingin menginstal atau mengelola plugin Gateway atau bundel yang kompatibel
    - Anda ingin men-debug kegagalan pemuatan plugin
summary: Referensi CLI untuk `openclaw plugins` (daftar, instal, marketplace, uninstall, aktifkan/nonaktifkan, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-23T09:19:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Kelola plugin Gateway, hook pack, dan bundel yang kompatibel.

Terkait:

- Sistem plugin: [Plugins](/id/tools/plugin)
- Kompatibilitas bundel: [Plugin bundles](/id/plugins/bundles)
- Manifest plugin + schema: [Plugin manifest](/id/plugins/manifest)
- Penguatan keamanan: [Security](/id/gateway/security)

## Perintah

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Plugin bawaan dikirim bersama OpenClaw. Sebagian diaktifkan secara default (misalnya
provider model bawaan, provider speech bawaan, dan plugin browser
bawaan); yang lain memerlukan `plugins enable`.

Plugin OpenClaw native harus menyertakan `openclaw.plugin.json` dengan JSON
Schema inline (`configSchema`, meskipun kosong). Bundel yang kompatibel menggunakan
manifest bundel mereka sendiri.

`plugins list` menampilkan `Format: openclaw` atau `Format: bundle`. Output
list/info verbose juga menampilkan subtipe bundel (`codex`, `claude`, atau `cursor`) beserta kemampuan bundel
yang terdeteksi.

### Instal

```bash
openclaw plugins install <package>                      # ClawHub terlebih dahulu, lalu npm
openclaw plugins install clawhub:<package>              # hanya ClawHub
openclaw plugins install <package> --force              # timpa instalasi yang sudah ada
openclaw plugins install <package> --pin                # pin versi
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # path lokal
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (eksplisit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Nama package polos diperiksa terhadap ClawHub terlebih dahulu, lalu npm. Catatan keamanan:
perlakukan instalasi plugin seperti menjalankan kode. Sebaiknya gunakan versi yang di-pin.

Jika bagian `plugins` Anda didukung oleh `$include` file tunggal, `plugins install/update/enable/disable/uninstall` menulis langsung ke file yang di-include tersebut dan membiarkan `openclaw.json` tetap tidak berubah. Include root, array include, dan include dengan override sibling gagal secara fail-closed alih-alih diratakan. Lihat [Config includes](/id/gateway/configuration) untuk bentuk yang didukung.

Jika konfigurasi tidak valid, `plugins install` biasanya gagal secara fail-closed dan memberi tahu Anda untuk
menjalankan `openclaw doctor --fix` terlebih dahulu. Satu-satunya pengecualian yang didokumentasikan adalah jalur pemulihan plugin bawaan yang sempit
untuk plugin yang secara eksplisit memilih
`openclaw.install.allowInvalidConfigRecovery`.

`--force` menggunakan kembali target instalasi yang ada dan menimpa plugin
atau hook pack yang sudah terinstal di tempat. Gunakan ini saat Anda memang sengaja menginstal ulang
id yang sama dari path lokal baru, arsip, package ClawHub, atau artefak npm.
Untuk upgrade rutin plugin npm yang sudah dilacak, sebaiknya gunakan
`openclaw plugins update <id-or-npm-spec>`.

Jika Anda menjalankan `plugins install` untuk id plugin yang sudah terinstal, OpenClaw
berhenti dan mengarahkan Anda ke `plugins update <id-or-npm-spec>` untuk upgrade normal,
atau ke `plugins install <package> --force` saat Anda benar-benar ingin menimpa
instalasi saat ini dari sumber lain.

`--pin` hanya berlaku untuk instalasi npm. Opsi ini tidak didukung dengan `--marketplace`,
karena instalasi marketplace menyimpan metadata sumber marketplace, bukan
spec npm.

`--dangerously-force-unsafe-install` adalah opsi break-glass untuk false positive
di scanner kode berbahaya bawaan. Opsi ini memungkinkan instalasi tetap berlanjut meskipun
scanner bawaan melaporkan temuan `critical`, tetapi **tidak**
melewati blok kebijakan hook plugin `before_install` dan **tidak** melewati kegagalan scan.

Flag CLI ini berlaku untuk alur install/update plugin. Instalasi dependensi Skills
yang didukung Gateway menggunakan override permintaan `dangerouslyForceUnsafeInstall` yang sesuai, sementara `openclaw skills install` tetap menjadi alur unduh/install Skills ClawHub
yang terpisah.

`plugins install` juga merupakan surface instalasi untuk hook pack yang mengekspos
`openclaw.hooks` di `package.json`. Gunakan `openclaw hooks` untuk visibilitas hook
yang difilter dan pengaktifan per-hook, bukan untuk instalasi package.

Spec npm bersifat **khusus registry** (nama package + **versi exact** opsional atau
**dist-tag**). Spec git/URL/file dan rentang semver ditolak. Instalasi dependensi berjalan dengan `--ignore-scripts` demi keamanan.

Spec polos dan `@latest` tetap berada di jalur stabil. Jika npm menyelesaikan salah satunya ke prerelease, OpenClaw berhenti dan meminta Anda memilih secara eksplisit dengan
tag prerelease seperti `@beta`/`@rc` atau versi prerelease exact seperti
`@1.2.3-beta.4`.

Jika spec instalasi polos cocok dengan id plugin bawaan (misalnya `diffs`), OpenClaw
menginstal plugin bawaan itu secara langsung. Untuk menginstal package npm dengan
nama yang sama, gunakan spec berscope eksplisit (misalnya `@scope/diffs`).

Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Instalasi marketplace Claude juga didukung.

Instalasi ClawHub menggunakan locator eksplisit `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw kini juga lebih mengutamakan ClawHub untuk spec plugin polos yang aman untuk npm. OpenClaw hanya kembali
ke npm jika ClawHub tidak memiliki package atau versi tersebut:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw mengunduh arsip package dari ClawHub, memeriksa kompatibilitas
API plugin / Gateway minimum yang diiklankan, lalu menginstalnya melalui jalur
arsip normal. Instalasi yang tercatat menyimpan metadata sumber ClawHub mereka untuk update selanjutnya.

Gunakan shorthand `plugin@marketplace` ketika nama marketplace ada di cache registry
lokal Claude pada `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Gunakan `--marketplace` saat Anda ingin memberikan sumber marketplace secara eksplisit:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Sumber marketplace dapat berupa:

- nama marketplace yang dikenal Claude dari `~/.claude/plugins/known_marketplaces.json`
- root marketplace lokal atau path `marketplace.json`
- shorthand repo GitHub seperti `owner/repo`
- URL repo GitHub seperti `https://github.com/owner/repo`
- URL git

Untuk marketplace jarak jauh yang dimuat dari GitHub atau git, entri plugin harus tetap berada
di dalam repo marketplace yang di-clone. OpenClaw menerima sumber path relatif dari
repo itu dan menolak sumber plugin HTTP(S), absolute-path, git, GitHub, dan sumber non-path lain dari manifest jarak jauh.

Untuk path lokal dan arsip, OpenClaw mendeteksi secara otomatis:

- plugin OpenClaw native (`openclaw.plugin.json`)
- bundel kompatibel Codex (`.codex-plugin/plugin.json`)
- bundel kompatibel Claude (`.claude-plugin/plugin.json` atau tata letak komponen Claude default)
- bundel kompatibel Cursor (`.cursor-plugin/plugin.json`)

Bundel yang kompatibel diinstal ke root plugin normal dan berpartisipasi dalam
alur list/info/enable/disable yang sama. Saat ini, bundle Skills, Claude
command-skills, default Claude `settings.json`, default Claude `.lsp.json` /
`lspServers` yang dideklarasikan manifest, Cursor command-skills, dan direktori hook Codex yang kompatibel didukung; kemampuan bundel lain yang terdeteksi
ditampilkan dalam diagnostik/info tetapi belum terhubung ke eksekusi runtime.

### Daftar

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gunakan `--enabled` untuk menampilkan hanya plugin yang dimuat. Gunakan `--verbose` untuk beralih dari
tampilan tabel ke baris detail per-plugin dengan metadata sumber/asal/versi/aktivasi. Gunakan `--json` untuk inventaris yang dapat dibaca mesin beserta
diagnostik registry.

Gunakan `--link` untuk menghindari menyalin direktori lokal (menambahkan ke `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` tidak didukung dengan `--link` karena instalasi tertaut menggunakan kembali
path sumber alih-alih menyalin ke target instalasi terkelola.

Gunakan `--pin` pada instalasi npm untuk menyimpan spec exact yang sudah diselesaikan (`name@version`) di
`plugins.installs` sambil mempertahankan perilaku default tanpa pin.

### Uninstall

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` menghapus catatan plugin dari `plugins.entries`, `plugins.installs`,
allowlist plugin, dan entri `plugins.load.paths` tertaut bila berlaku.
Untuk plugin Active Memory, slot memory direset ke `memory-core`.

Secara default, uninstall juga menghapus direktori instalasi plugin di bawah
root plugin state-dir aktif. Gunakan
`--keep-files` untuk mempertahankan file di disk.

`--keep-config` didukung sebagai alias deprecated untuk `--keep-files`.

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Update diterapkan ke instalasi yang dilacak di `plugins.installs` dan instalasi hook-pack
yang dilacak di `hooks.internal.installs`.

Saat Anda memberikan id plugin, OpenClaw menggunakan kembali spec instalasi tercatat untuk
plugin itu. Ini berarti dist-tag yang sebelumnya disimpan seperti `@beta` dan versi pinned exact akan tetap digunakan pada eksekusi `update <id>` berikutnya.

Untuk instalasi npm, Anda juga dapat memberikan spec package npm eksplisit dengan dist-tag
atau versi exact. OpenClaw menyelesaikan nama package itu kembali ke catatan plugin yang dilacak,
memperbarui plugin terinstal itu, dan mencatat spec npm baru untuk update berbasis
id di masa mendatang.

Memberikan nama package npm tanpa versi atau tag juga akan diselesaikan kembali ke
catatan plugin yang dilacak. Gunakan ini ketika sebuah plugin di-pin ke versi exact dan
Anda ingin memindahkannya kembali ke jalur rilis default registry.

Sebelum update npm langsung, OpenClaw memeriksa versi package yang terinstal terhadap
metadata registry npm. Jika versi terinstal dan identitas artefak tercatat
sudah cocok dengan target yang diselesaikan, update dilewati tanpa
mengunduh, menginstal ulang, atau menulis ulang `openclaw.json`.

Saat hash integritas tersimpan ada dan hash artefak yang diambil berubah,
OpenClaw memperlakukan ini sebagai drift artefak npm. Perintah interaktif
`openclaw plugins update` mencetak hash yang diharapkan dan aktual lalu meminta
konfirmasi sebelum melanjutkan. Helper update non-interaktif gagal secara fail-closed
kecuali pemanggil menyediakan kebijakan kelanjutan yang eksplisit.

`--dangerously-force-unsafe-install` juga tersedia pada `plugins update` sebagai
override break-glass untuk false positive scan kode berbahaya bawaan selama
update plugin. Opsi ini tetap tidak melewati blok kebijakan plugin `before_install`
atau pemblokiran karena kegagalan scan, dan hanya berlaku untuk update plugin, bukan update hook-pack.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspeksi mendalam untuk satu plugin. Menampilkan identitas, status muat, sumber,
kapabilitas terdaftar, hook, tool, perintah, layanan, metode Gateway,
rute HTTP, flag kebijakan, diagnostik, metadata instalasi, kemampuan bundel,
dan dukungan MCP atau server LSP yang terdeteksi.

Setiap plugin diklasifikasikan berdasarkan apa yang benar-benar didaftarkannya saat runtime:

- **plain-capability** — satu jenis kapabilitas (misalnya plugin khusus provider)
- **hybrid-capability** — beberapa jenis kapabilitas (misalnya teks + speech + gambar)
- **hook-only** — hanya hook, tanpa kapabilitas atau surface
- **non-capability** — tool/perintah/layanan tetapi tanpa kapabilitas

Lihat [Plugin shapes](/id/plugins/architecture#plugin-shapes) untuk informasi lebih lanjut tentang model kapabilitas.

Flag `--json` menghasilkan laporan yang dapat dibaca mesin dan cocok untuk scripting serta
audit.

`inspect --all` merender tabel seluruh armada dengan kolom shape, jenis kapabilitas,
catatan kompatibilitas, kemampuan bundel, dan ringkasan hook.

`info` adalah alias untuk `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` melaporkan error pemuatan plugin, diagnostik manifest/penemuan, dan
catatan kompatibilitas. Saat semuanya bersih, perintah ini mencetak `No plugin issues
detected.`

Untuk kegagalan bentuk modul seperti ekspor `register`/`activate` yang hilang, jalankan ulang
dengan `OPENCLAW_PLUGIN_LOAD_DEBUG=1` agar menyertakan ringkasan bentuk ekspor yang ringkas dalam
output diagnostik.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Daftar marketplace menerima path marketplace lokal, path `marketplace.json`,
shorthand GitHub seperti `owner/repo`, URL repo GitHub, atau URL git. `--json`
mencetak label sumber yang sudah diselesaikan beserta manifest marketplace yang telah di-parse dan
entri plugin.
