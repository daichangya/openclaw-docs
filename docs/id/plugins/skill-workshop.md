---
read_when:
    - Anda ingin agent mengubah koreksi atau prosedur yang dapat digunakan ulang menjadi Skills workspace
    - Anda sedang mengonfigurasi memori prosedural Skills
    - Anda sedang men-debug perilaku alat `skill_workshop`
    - Anda sedang memutuskan apakah akan mengaktifkan pembuatan Skills otomatis
summary: Pengambilan eksperimental prosedur yang dapat digunakan ulang sebagai Skills workspace dengan peninjauan, persetujuan, karantina, dan refresh hot skill
title: Plugin Skill Workshop
x-i18n:
    generated_at: "2026-04-22T04:25:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Plugin Skill Workshop

Skill Workshop bersifat **eksperimental**. Ini dinonaktifkan secara default, heuristik capture
dan prompt reviewer-nya dapat berubah antar rilis, dan penulisan otomatis
sebaiknya hanya digunakan di workspace tepercaya setelah meninjau output mode pending terlebih dahulu.

Skill Workshop adalah memori prosedural untuk Skills workspace. Ini memungkinkan agent mengubah
workflow yang dapat digunakan ulang, koreksi pengguna, perbaikan yang susah didapat, dan jebakan yang berulang
menjadi file `SKILL.md` di bawah:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Ini berbeda dari memori jangka panjang:

- **Memory** menyimpan fakta, preferensi, entitas, dan konteks masa lalu.
- **Skills** menyimpan prosedur yang dapat digunakan ulang yang harus diikuti agent pada tugas di masa depan.
- **Skill Workshop** adalah jembatan dari satu giliran yang berguna menjadi Skill
  workspace yang tahan lama, dengan pemeriksaan keamanan dan persetujuan opsional.

Skill Workshop berguna saat agent mempelajari prosedur seperti:

- cara memvalidasi aset GIF animasi yang bersumber dari luar
- cara mengganti aset screenshot dan memverifikasi dimensinya
- cara menjalankan skenario QA khusus repo
- cara men-debug kegagalan provider yang berulang
- cara memperbaiki catatan workflow lokal yang basi

Ini tidak dimaksudkan untuk:

- fakta seperti “pengguna menyukai warna biru”
- memori autobiografis yang luas
- pengarsipan transkrip mentah
- secret, kredensial, atau teks prompt tersembunyi
- instruksi sekali pakai yang tidak akan berulang

## Status Default

Plugin bawaan ini bersifat **eksperimental** dan **dinonaktifkan secara default** kecuali
diaktifkan secara eksplisit di `plugins.entries.skill-workshop`.

Manifest plugin tidak menetapkan `enabledByDefault: true`. Default `enabled: true`
di dalam skema konfigurasi plugin hanya berlaku setelah entri plugin
sudah dipilih dan dimuat.

Eksperimental berarti:

- plugin cukup didukung untuk pengujian opt-in dan dogfooding
- penyimpanan proposal, ambang reviewer, dan heuristik capture dapat berkembang
- persetujuan pending adalah mode awal yang direkomendasikan
- auto apply untuk penyiapan personal/workspace tepercaya, bukan lingkungan bersama atau
  lingkungan yang banyak menerima input tidak tepercaya

## Aktifkan

Konfigurasi aman minimal:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Dengan konfigurasi ini:

- alat `skill_workshop` tersedia
- koreksi eksplisit yang dapat digunakan ulang dimasukkan ke antrean sebagai proposal pending
- reviewer berbasis ambang dapat mengusulkan pembaruan Skill
- tidak ada file Skill yang ditulis sampai proposal pending diterapkan

Gunakan penulisan otomatis hanya di workspace tepercaya:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` tetap menggunakan scanner dan path karantina yang sama. Ini
tidak menerapkan proposal dengan temuan kritis.

## Konfigurasi

| Key                  | Default     | Rentang / nilai                              | Arti                                                                 |
| -------------------- | ----------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                      | Mengaktifkan plugin setelah entri plugin dimuat.                     |
| `autoCapture`        | `true`      | boolean                                      | Mengaktifkan capture/review pasca-giliran pada giliran agent yang berhasil. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                        | Mengantrekan proposal atau menulis proposal aman secara otomatis.    |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`  | Memilih capture koreksi eksplisit, reviewer LLM, keduanya, atau tidak keduanya. |
| `reviewInterval`     | `15`        | `1..200`                                     | Jalankan reviewer setelah sejumlah giliran berhasil ini.             |
| `reviewMinToolCalls` | `8`         | `1..500`                                     | Jalankan reviewer setelah sebanyak ini panggilan tool teramati.      |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                               | Timeout untuk proses reviewer embedded.                              |
| `maxPending`         | `50`        | `1..200`                                     | Maks proposal pending/karantina yang disimpan per workspace.         |
| `maxSkillBytes`      | `40000`     | `1024..200000`                               | Ukuran maksimum file Skill/pendukung yang dihasilkan.                |

Profil yang direkomendasikan:

```json5
// Konservatif: hanya penggunaan alat eksplisit, tanpa capture otomatis.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Tinjau dulu: capture otomatis, tetapi memerlukan persetujuan.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Otomatisasi tepercaya: tulis proposal aman segera.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Biaya rendah: tanpa panggilan reviewer LLM, hanya frasa koreksi eksplisit.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Path Capture

Skill Workshop memiliki tiga path capture.

### Saran alat

Model dapat memanggil `skill_workshop` secara langsung saat melihat prosedur yang dapat digunakan ulang
atau saat pengguna memintanya untuk menyimpan/memperbarui Skill.

Ini adalah path yang paling eksplisit dan tetap berfungsi bahkan dengan `autoCapture: false`.

### Capture heuristik

Saat `autoCapture` diaktifkan dan `reviewMode` adalah `heuristic` atau `hybrid`, plugin
memindai giliran yang berhasil untuk frasa koreksi pengguna yang eksplisit:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Heuristik membuat proposal dari instruksi pengguna terbaru yang cocok. Ini
menggunakan petunjuk topik untuk memilih nama Skill bagi workflow umum:

- tugas GIF animasi -> `animated-gif-workflow`
- tugas screenshot atau aset -> `screenshot-asset-workflow`
- tugas QA atau skenario -> `qa-scenario-workflow`
- tugas GitHub PR -> `github-pr-workflow`
- fallback -> `learned-workflows`

Capture heuristik sengaja dibuat sempit. Ini untuk koreksi yang jelas dan
catatan proses yang dapat diulang, bukan untuk ringkasan transkrip umum.

### Reviewer LLM

Saat `autoCapture` diaktifkan dan `reviewMode` adalah `llm` atau `hybrid`, plugin
menjalankan reviewer embedded ringkas setelah ambang tercapai.

Reviewer menerima:

- teks transkrip terbaru, dibatasi hingga 12.000 karakter terakhir
- hingga 12 Skills workspace yang ada
- hingga 2.000 karakter dari setiap Skill yang ada
- instruksi hanya-JSON

Reviewer tidak memiliki tool:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Reviewer dapat mengembalikan:

```json
{ "action": "none" }
```

atau satu proposal Skill:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Workflow penerimaan media animasi yang dapat digunakan ulang",
  "description": "Validasi media animasi yang bersumber dari luar sebelum digunakan dalam produk.",
  "body": "## Workflow\n\n- Verifikasi animasi yang benar.\n- Catat atribusi.\n- Simpan salinan lokal yang disetujui.\n- Verifikasi di UI produk sebelum balasan akhir."
}
```

Reviewer juga dapat menambahkan ke Skill yang sudah ada:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "QA media animasi membutuhkan pemeriksaan yang dapat digunakan ulang",
  "description": "Workflow skenario QA.",
  "section": "Workflow",
  "body": "- Untuk tugas GIF animasi, verifikasi jumlah frame dan atribusi sebelum meneruskan."
}
```

Atau mengganti teks yang persis sama di Skill yang sudah ada:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Validasi lama melewatkan optimasi gambar",
  "oldText": "- Ganti aset screenshot.",
  "newText": "- Ganti aset screenshot, pertahankan dimensi, optimalkan PNG, dan jalankan gate validasi yang relevan."
}
```

Pilih `append` atau `replace` saat Skill yang relevan sudah ada. Gunakan `create`
hanya saat tidak ada Skill yang cocok.

## Siklus hidup proposal

Setiap pembaruan yang dihasilkan menjadi proposal dengan:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- opsional `agentId`
- opsional `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end`, atau `reviewer`
- `status`
- `change`
- opsional `scanFindings`
- opsional `quarantineReason`

Status proposal:

- `pending` - menunggu persetujuan
- `applied` - ditulis ke `<workspace>/skills`
- `rejected` - ditolak oleh operator/model
- `quarantined` - diblokir oleh temuan scanner kritis

Status disimpan per workspace di bawah direktori status Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Proposal pending dan karantina dideduplikasi berdasarkan nama Skill dan payload
perubahan. Penyimpanan mempertahankan proposal pending/karantina terbaru hingga
`maxPending`.

## Referensi alat

Plugin mendaftarkan satu alat agent:

```text
skill_workshop
```

### `status`

Hitung proposal berdasarkan status untuk workspace aktif.

```json
{ "action": "status" }
```

Bentuk hasil:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Daftar proposal pending.

```json
{ "action": "list_pending" }
```

Untuk menampilkan status lain:

```json
{ "action": "list_pending", "status": "applied" }
```

Nilai `status` yang valid:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Daftar proposal yang dikarantina.

```json
{ "action": "list_quarantine" }
```

Gunakan ini saat capture otomatis tampak tidak melakukan apa-apa dan log menyebut
`skill-workshop: quarantined <skill>`.

### `inspect`

Ambil proposal berdasarkan id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Buat proposal. Dengan `approvalPolicy: "pending"`, ini secara default akan masuk antrean.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "Pengguna menetapkan aturan validasi GIF yang dapat digunakan ulang.",
  "description": "Validasi aset GIF animasi sebelum menggunakannya.",
  "body": "## Workflow\n\n- Verifikasi URL me-resolve ke image/gif.\n- Konfirmasi bahwa ia memiliki beberapa frame.\n- Catat atribusi dan lisensi.\n- Hindari hotlinking saat aset lokal diperlukan."
}
```

Paksa penulisan aman:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validasi aset GIF animasi sebelum menggunakannya.",
  "body": "## Workflow\n\n- Verifikasi animasi yang benar.\n- Catat atribusi."
}
```

Paksa pending bahkan dalam `approvalPolicy: "auto"`:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Workflow penggantian screenshot.",
  "body": "## Workflow\n\n- Verifikasi dimensi.\n- Optimalkan PNG.\n- Jalankan gate yang relevan."
}
```

Tambahkan ke section:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "Workflow skenario QA.",
  "body": "- Untuk QA media, verifikasi aset yang dihasilkan dirender dan lolos assertion akhir."
}
```

Ganti teks yang persis sama:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Periksa PR.",
  "newText": "- Periksa thread review yang belum terselesaikan, status CI, issue terkait, dan file yang berubah sebelum memutuskan."
}
```

### `apply`

Terapkan proposal pending.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` menolak proposal karantina:

```text
proposal yang dikarantina tidak dapat diterapkan
```

### `reject`

Tandai proposal sebagai ditolak.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Tulis file pendukung di dalam direktori Skill yang sudah ada atau yang diusulkan.

Direktori pendukung tingkat atas yang diizinkan:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Contoh:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Daftar Periksa Rilis\n\n- Jalankan docs rilis.\n- Verifikasi changelog.\n"
}
```

File pendukung berskala workspace, diperiksa path-nya, dibatasi byte oleh
`maxSkillBytes`, dipindai, dan ditulis secara atomik.

## Penulisan Skill

Skill Workshop hanya menulis di bawah:

```text
<workspace>/skills/<normalized-skill-name>/
```

Nama Skill dinormalisasi:

- huruf kecil semua
- rangkaian karakter selain `[a-z0-9_-]` menjadi `-`
- karakter non-alfanumerik di awal/akhir dihapus
- panjang maksimum 80 karakter
- nama akhir harus cocok dengan `[a-z0-9][a-z0-9_-]{1,79}`

Untuk `create`:

- jika Skill belum ada, Skill Workshop menulis `SKILL.md` baru
- jika sudah ada, Skill Workshop menambahkan body ke `## Workflow`

Untuk `append`:

- jika Skill ada, Skill Workshop menambahkan ke section yang diminta
- jika belum ada, Skill Workshop membuat Skill minimal lalu menambahkan

Untuk `replace`:

- Skill harus sudah ada
- `oldText` harus ada secara persis
- hanya kecocokan persis pertama yang diganti

Semua penulisan bersifat atomik dan segera me-refresh snapshot Skills dalam memori, sehingga
Skill baru atau yang diperbarui dapat terlihat tanpa restart Gateway.

## Model keamanan

Skill Workshop memiliki scanner keamanan pada konten `SKILL.md` yang dihasilkan dan file
pendukung.

Temuan kritis mengarantina proposal:

| ID aturan                              | Memblokir konten yang...                                                |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | menyuruh agent mengabaikan instruksi sebelumnya/yang lebih tinggi        |
| `prompt-injection-system`              | merujuk ke system prompt, developer message, atau instruksi tersembunyi |
| `prompt-injection-tool`                | mendorong bypass izin/persetujuan tool                                  |
| `shell-pipe-to-shell`                  | menyertakan `curl`/`wget` yang dipipe ke `sh`, `bash`, atau `zsh`       |
| `secret-exfiltration`                  | tampak mengirim data env/process env melalui jaringan                   |

Temuan peringatan dipertahankan tetapi tidak memblokir dengan sendirinya:

| ID aturan            | Memperingatkan tentang...             |
| -------------------- | ------------------------------------- |
| `destructive-delete` | perintah bergaya `rm -rf` yang luas   |
| `unsafe-permissions` | penggunaan izin bergaya `chmod 777`   |

Proposal yang dikarantina:

- menyimpan `scanFindings`
- menyimpan `quarantineReason`
- muncul di `list_quarantine`
- tidak dapat diterapkan melalui `apply`

Untuk memulihkan proposal yang dikarantina, buat proposal aman baru dengan
konten tidak aman dihapus. Jangan edit JSON store secara manual.

## Panduan prompt

Saat diaktifkan, Skill Workshop menyuntikkan section prompt singkat yang memberi tahu agent
untuk menggunakan `skill_workshop` bagi memori prosedural yang tahan lama.

Panduan tersebut menekankan:

- prosedur, bukan fakta/preferensi
- koreksi pengguna
- prosedur berhasil yang tidak jelas
- jebakan yang berulang
- perbaikan Skill yang basi/tipis/salah melalui append/replace
- menyimpan prosedur yang dapat digunakan ulang setelah loop tool yang panjang atau perbaikan sulit
- teks Skill imperatif yang singkat
- tanpa dump transkrip

Teks mode penulisan berubah sesuai `approvalPolicy`:

- mode pending: antrekan saran; terapkan hanya setelah persetujuan eksplisit
- mode auto: terapkan pembaruan Skill workspace yang aman saat jelas dapat digunakan ulang

## Biaya dan perilaku runtime

Capture heuristik tidak memanggil model.

Review LLM menggunakan proses embedded pada model agent aktif/default. Ini
berbasis ambang sehingga secara default tidak berjalan pada setiap giliran.

Reviewer:

- menggunakan konteks provider/model yang sama saat tersedia
- fallback ke default agent runtime
- memiliki `reviewTimeoutMs`
- menggunakan konteks bootstrap ringan
- tidak memiliki tool
- tidak menulis apa pun secara langsung
- hanya dapat menghasilkan proposal yang melewati scanner normal dan
  path persetujuan/karantina

Jika reviewer gagal, timeout, atau mengembalikan JSON tidak valid, plugin mencatat
pesan warning/debug dan melewati pass review tersebut.

## Pola operasi

Gunakan Skill Workshop saat pengguna mengatakan:

- “lain kali, lakukan X”
- “mulai sekarang, pilih Y”
- “pastikan untuk memverifikasi Z”
- “simpan ini sebagai workflow”
- “ini memakan waktu; ingat prosesnya”
- “perbarui Skill lokal untuk ini”

Teks Skill yang baik:

```markdown
## Workflow

- Verifikasi URL GIF me-resolve ke `image/gif`.
- Konfirmasi file memiliki beberapa frame.
- Catat URL sumber, lisensi, dan atribusi.
- Simpan salinan lokal saat aset akan dikirim bersama produk.
- Verifikasi aset lokal dirender di UI target sebelum balasan akhir.
```

Teks Skill yang buruk:

```markdown
Pengguna bertanya tentang GIF dan saya mencari di dua situs web. Lalu salah satunya diblokir oleh
Cloudflare. Jawaban akhirnya mengatakan untuk memeriksa atribusi.
```

Alasan versi buruk tidak boleh disimpan:

- berbentuk transkrip
- tidak imperatif
- menyertakan detail sekali pakai yang berisik
- tidak memberi tahu agent berikutnya apa yang harus dilakukan

## Debugging

Periksa apakah plugin dimuat:

```bash
openclaw plugins list --enabled
```

Periksa jumlah proposal dari konteks agent/tool:

```json
{ "action": "status" }
```

Periksa proposal pending:

```json
{ "action": "list_pending" }
```

Periksa proposal yang dikarantina:

```json
{ "action": "list_quarantine" }
```

Gejala umum:

| Gejala                                | Penyebab yang mungkin                                                               | Pemeriksaan                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool tidak tersedia                   | Entri plugin tidak diaktifkan                                                       | `plugins.entries.skill-workshop.enabled` dan `openclaw plugins list` |
| Tidak ada proposal otomatis muncul    | `autoCapture: false`, `reviewMode: "off"`, atau ambang belum tercapai               | Konfigurasi, status proposal, log Gateway                            |
| Heuristik tidak menangkap             | Kata-kata pengguna tidak cocok dengan pola koreksi                                  | Gunakan `skill_workshop.suggest` eksplisit atau aktifkan reviewer LLM |
| Reviewer tidak membuat proposal       | Reviewer mengembalikan `none`, JSON tidak valid, atau timeout                       | Log Gateway, `reviewTimeoutMs`, ambang                               |
| Proposal tidak diterapkan             | `approvalPolicy: "pending"`                                                         | `list_pending`, lalu `apply`                                         |
| Proposal hilang dari pending          | Proposal duplikat digunakan ulang, pruning max pending, atau sudah applied/rejected/quarantined | `status`, `list_pending` dengan filter status, `list_quarantine` |
| File Skill ada tetapi model tidak melihatnya | Snapshot Skill tidak di-refresh atau pembatasan Skill mengecualikannya         | status `openclaw skills` dan kelayakan Skill workspace               |

Log yang relevan:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Skenario QA

Skenario QA berbasis repo:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Jalankan cakupan deterministik:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Jalankan cakupan reviewer:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Skenario reviewer sengaja dipisahkan karena mengaktifkan
`reviewMode: "llm"` dan menguji pass reviewer embedded.

## Kapan Tidak Mengaktifkan Auto Apply

Hindari `approvalPolicy: "auto"` saat:

- workspace berisi prosedur sensitif
- agent bekerja pada input yang tidak tepercaya
- Skills dibagikan ke tim yang luas
- Anda masih menyetel prompt atau aturan scanner
- model sering menangani konten web/email yang bermusuhan

Gunakan mode pending terlebih dahulu. Beralih ke mode auto hanya setelah meninjau jenis
Skills yang diusulkan agent di workspace tersebut.

## Dokumen terkait

- [Skills](/id/tools/skills)
- [Plugins](/id/tools/plugin)
- [Testing](/id/reference/test)
