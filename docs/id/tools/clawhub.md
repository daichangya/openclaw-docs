---
read_when:
    - Memperkenalkan ClawHub kepada pengguna baru
    - Menginstal, mencari, atau menerbitkan Skills atau plugin
    - Menjelaskan flag CLI ClawHub dan perilaku sinkronisasi
summary: 'Panduan ClawHub: registri publik, alur instalasi OpenClaw native, dan alur kerja CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:27:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub adalah registri publik untuk **Skills dan plugin OpenClaw**.

- Gunakan perintah `openclaw` native untuk mencari/menginstal/memperbarui Skills dan menginstal
  plugin dari ClawHub.
- Gunakan CLI `clawhub` terpisah saat Anda memerlukan auth registri, publish, delete,
  undelete, atau workflow sync.

Situs: [clawhub.ai](https://clawhub.ai)

## Alur OpenClaw native

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Spesifikasi plugin bare yang aman untuk npm juga dicoba terhadap ClawHub sebelum npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Perintah `openclaw` native menginstal ke workspace aktif Anda dan mempersistenkan metadata
sumber agar panggilan `update` berikutnya dapat tetap menggunakan ClawHub.

Instalasi plugin memvalidasi kompatibilitas `pluginApi` dan `minGatewayVersion` yang diiklankan
sebelum instalasi arsip berjalan, sehingga host yang tidak kompatibel gagal tertutup lebih awal
alih-alih menginstal paket sebagian.

`openclaw plugins install clawhub:...` hanya menerima keluarga plugin yang dapat diinstal.
Jika paket ClawHub ternyata sebenarnya adalah Skill, OpenClaw berhenti dan mengarahkan Anda ke
`openclaw skills install <slug>`.

## Apa itu ClawHub

- Registri publik untuk Skills dan plugin OpenClaw.
- Penyimpanan berversi untuk bundle Skill dan metadata.
- Permukaan discovery untuk pencarian, tag, dan sinyal penggunaan.

## Cara kerjanya

1. Pengguna menerbitkan bundle Skill (file + metadata).
2. ClawHub menyimpan bundle, mengurai metadata, dan menetapkan versi.
3. Registri mengindeks Skill untuk pencarian dan discovery.
4. Pengguna menelusuri, mengunduh, dan menginstal Skills di OpenClaw.

## Yang dapat Anda lakukan

- Menerbitkan Skills baru dan versi baru dari Skills yang sudah ada.
- Menemukan Skills berdasarkan nama, tag, atau pencarian.
- Mengunduh bundle Skill dan memeriksa file-nya.
- Melaporkan Skills yang abusif atau tidak aman.
- Jika Anda moderator, menyembunyikan, menampilkan kembali, menghapus, atau memblokir.

## Untuk siapa ini (ramah pemula)

Jika Anda ingin menambahkan kemampuan baru ke agent OpenClaw Anda, ClawHub adalah cara termudah untuk menemukan dan menginstal Skills. Anda tidak perlu mengetahui cara kerja backend. Anda dapat:

- Mencari Skills dengan bahasa biasa.
- Menginstal Skill ke workspace Anda.
- Memperbarui Skills nanti dengan satu perintah.
- Mencadangkan Skills Anda sendiri dengan menerbitkannya.

## Mulai cepat (non-teknis)

1. Cari sesuatu yang Anda butuhkan:
   - `openclaw skills search "calendar"`
2. Instal Skill:
   - `openclaw skills install <skill-slug>`
3. Mulai sesi OpenClaw baru agar ia memuat Skill baru.
4. Jika Anda ingin menerbitkan atau mengelola auth registri, instal juga
   CLI `clawhub` terpisah.

## Instal CLI ClawHub

Anda hanya memerlukan ini untuk workflow yang diautentikasi registri seperti publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Bagaimana ini cocok dengan OpenClaw

`openclaw skills install` native menginstal ke direktori `skills/` workspace aktif. `openclaw plugins install clawhub:...` mencatat instalasi plugin terkelola normal plus metadata sumber ClawHub untuk update.

Instalasi plugin ClawHub anonim juga gagal tertutup untuk paket privat.
Channel komunitas atau channel tidak resmi lainnya tetap dapat menginstal, tetapi OpenClaw memberi peringatan
agar operator dapat meninjau sumber dan verifikasi sebelum mengaktifkannya.

CLI `clawhub` terpisah juga menginstal Skills ke `./skills` di bawah direktori kerja saat ini. Jika workspace OpenClaw dikonfigurasi, `clawhub`
fallback ke workspace tersebut kecuali Anda menimpa `--workdir` (atau
`CLAWHUB_WORKDIR`). OpenClaw memuat Skills workspace dari `<workspace>/skills`
dan akan memuatnya pada sesi **berikutnya**. Jika Anda sudah menggunakan
`~/.openclaw/skills` atau Skills bawaan, Skills workspace memiliki prioritas lebih tinggi.

Untuk detail lebih lanjut tentang bagaimana Skills dimuat, dibagikan, dan dibatasi, lihat
[Skills](/id/tools/skills).

## Ikhtisar sistem Skill

Skill adalah bundle file berversi yang mengajarkan OpenClaw cara melakukan
tugas tertentu. Setiap publish membuat versi baru, dan registri menyimpan
riwayat versi agar pengguna dapat mengaudit perubahan.

Skill yang umum meliputi:

- File `SKILL.md` dengan deskripsi utama dan penggunaan.
- Konfigurasi, skrip, atau file pendukung opsional yang digunakan oleh Skill.
- Metadata seperti tag, ringkasan, dan persyaratan instalasi.

ClawHub menggunakan metadata untuk mendukung discovery dan mengekspos kemampuan Skill secara aman.
Registri juga melacak sinyal penggunaan (seperti bintang dan unduhan) untuk meningkatkan
peringkat dan visibilitas.

## Yang disediakan layanan ini (fitur)

- **Penelusuran publik** atas Skills dan konten `SKILL.md`-nya.
- **Pencarian** yang didukung embeddings (vector search), bukan hanya kata kunci.
- **Versioning** dengan semver, changelog, dan tag (termasuk `latest`).
- **Unduhan** sebagai zip per versi.
- **Bintang dan komentar** untuk umpan balik komunitas.
- **Hook moderasi** untuk persetujuan dan audit.
- **API yang ramah CLI** untuk otomatisasi dan scripting.

## Keamanan dan moderasi

ClawHub terbuka secara default. Siapa pun dapat mengunggah Skills, tetapi akun GitHub harus
berusia setidaknya satu minggu untuk dapat menerbitkan. Ini membantu memperlambat penyalahgunaan tanpa memblokir
kontributor yang sah.

Pelaporan dan moderasi:

- Pengguna yang login dapat melaporkan Skill.
- Alasan laporan wajib dan dicatat.
- Setiap pengguna dapat memiliki hingga 20 laporan aktif sekaligus.
- Skills dengan lebih dari 3 laporan unik disembunyikan otomatis secara default.
- Moderator dapat melihat Skills yang disembunyikan, menampilkannya kembali, menghapusnya, atau memblokir pengguna.
- Penyalahgunaan fitur laporan dapat mengakibatkan pemblokiran akun.

Tertarik menjadi moderator? Tanyakan di Discord OpenClaw dan hubungi
moderator atau maintainer.

## Perintah dan parameter CLI

Opsi global (berlaku untuk semua perintah):

- `--workdir <dir>`: Direktori kerja (default: direktori saat ini; fallback ke workspace OpenClaw).
- `--dir <dir>`: Direktori Skills, relatif terhadap workdir (default: `skills`).
- `--site <url>`: URL dasar situs (login browser).
- `--registry <url>`: URL dasar API registri.
- `--no-input`: Nonaktifkan prompt (non-interaktif).
- `-V, --cli-version`: Cetak versi CLI.

Auth:

- `clawhub login` (alur browser) atau `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opsi:

- `--token <token>`: Tempel token API.
- `--label <label>`: Label yang disimpan untuk token login browser (default: `CLI token`).
- `--no-browser`: Jangan buka browser (memerlukan `--token`).

Pencarian:

- `clawhub search "query"`
- `--limit <n>`: Hasil maksimum.

Instal:

- `clawhub install <slug>`
- `--version <version>`: Instal versi tertentu.
- `--force`: Timpa jika folder sudah ada.

Update:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Update ke versi tertentu (hanya satu slug).
- `--force`: Timpa saat file lokal tidak cocok dengan versi yang pernah dipublikasikan.

Daftar:

- `clawhub list` (membaca `.clawhub/lock.json`)

Publikasikan Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug Skill.
- `--name <name>`: Nama tampilan.
- `--version <version>`: Versi semver.
- `--changelog <text>`: Teks changelog (dapat kosong).
- `--tags <tags>`: Tag dipisahkan koma (default: `latest`).

Publikasikan plugin:

- `clawhub package publish <source>`
- `<source>` dapat berupa folder lokal, `owner/repo`, `owner/repo@ref`, atau URL GitHub.
- `--dry-run`: Bangun rencana publish yang tepat tanpa mengunggah apa pun.
- `--json`: Keluarkan output yang dapat dibaca mesin untuk CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Override opsional saat deteksi otomatis tidak cukup.

Delete/undelete (hanya owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (pindai Skills lokal + publikasikan yang baru/diperbarui):

- `clawhub sync`
- `--root <dir...>`: Root pemindaian tambahan.
- `--all`: Unggah semuanya tanpa prompt.
- `--dry-run`: Tampilkan apa yang akan diunggah.
- `--bump <type>`: `patch|minor|major` untuk update (default: `patch`).
- `--changelog <text>`: Changelog untuk update non-interaktif.
- `--tags <tags>`: Tag dipisahkan koma (default: `latest`).
- `--concurrency <n>`: Pemeriksaan registri (default: 4).

## Workflow umum untuk agent

### Cari Skills

```bash
clawhub search "postgres backups"
```

### Unduh Skills baru

```bash
clawhub install my-skill-pack
```

### Perbarui Skills yang diinstal

```bash
clawhub update --all
```

### Cadangkan Skills Anda (publish atau sync)

Untuk satu folder Skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Untuk memindai dan mencadangkan banyak Skills sekaligus:

```bash
clawhub sync --all
```

### Publikasikan plugin dari GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Plugin kode harus menyertakan metadata OpenClaw yang diperlukan di `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Paket yang dipublikasikan sebaiknya mengirim JavaScript hasil build dan mengarahkan `runtimeExtensions`
ke output tersebut. Instalasi checkout git tetap dapat fallback ke source TypeScript
saat tidak ada file hasil build, tetapi entri runtime hasil build menghindari kompilasi TypeScript runtime pada path startup, doctor, dan pemuatan plugin.

## Detail lanjutan (teknis)

### Versioning dan tag

- Setiap publish membuat `SkillVersion` **semver** baru.
- Tag (seperti `latest`) menunjuk ke sebuah versi; memindahkan tag memungkinkan Anda melakukan rollback.
- Changelog dilampirkan per versi dan dapat kosong saat sync atau menerbitkan update.

### Perubahan lokal vs versi registri

Update membandingkan isi Skill lokal dengan versi registri menggunakan hash konten. Jika file lokal tidak cocok dengan versi yang pernah dipublikasikan, CLI akan bertanya sebelum menimpa (atau memerlukan `--force` pada run non-interaktif).

### Pemindaian sync dan fallback root

`clawhub sync` memindai workdir saat ini terlebih dahulu. Jika tidak ada Skills yang ditemukan, ia fallback ke lokasi legacy yang diketahui (misalnya `~/openclaw/skills` dan `~/.openclaw/skills`). Ini dirancang untuk menemukan instalasi Skill yang lebih lama tanpa flag tambahan.

### Penyimpanan dan lockfile

- Skills yang diinstal dicatat di `.clawhub/lock.json` di bawah workdir Anda.
- Token auth disimpan di file konfigurasi CLI ClawHub (timpa melalui `CLAWHUB_CONFIG_PATH`).

### Telemetri (jumlah instalasi)

Saat Anda menjalankan `clawhub sync` dalam keadaan login, CLI mengirim snapshot minimal untuk menghitung jumlah instalasi. Anda dapat menonaktifkan ini sepenuhnya:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variabel lingkungan

- `CLAWHUB_SITE`: Timpa URL situs.
- `CLAWHUB_REGISTRY`: Timpa URL API registri.
- `CLAWHUB_CONFIG_PATH`: Timpa lokasi penyimpanan token/konfigurasi oleh CLI.
- `CLAWHUB_WORKDIR`: Timpa workdir default.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Nonaktifkan telemetri pada `sync`.
