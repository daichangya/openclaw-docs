---
read_when:
    - Anda ingin menggunakan CLI memory-wiki
    - Anda sedang mendokumentasikan atau mengubah `openclaw wiki`
summary: Referensi CLI untuk `openclaw wiki` (status vault memory-wiki, search, compile, lint, apply, bridge, dan helper Obsidian)
title: wiki
x-i18n:
    generated_at: "2026-04-23T09:20:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Periksa dan pelihara vault `memory-wiki`.

Disediakan oleh Plugin `memory-wiki` bawaan.

Terkait:

- [Plugin Memory Wiki](/id/plugins/memory-wiki)
- [Ikhtisar Memori](/id/concepts/memory)
- [CLI: memory](/id/cli/memory)

## Fungsinya

Gunakan `openclaw wiki` saat Anda menginginkan vault pengetahuan terkompilasi dengan:

- pencarian native wiki dan pembacaan halaman
- sintesis kaya provenance
- laporan kontradiksi dan kesegaran
- impor bridge dari Plugin memori aktif
- helper CLI Obsidian opsional

## Perintah umum

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Perintah

### `wiki status`

Periksa mode vault saat ini, kesehatan, dan ketersediaan CLI Obsidian.

Gunakan ini terlebih dahulu saat Anda tidak yakin apakah vault sudah diinisialisasi, mode bridge
dalam keadaan sehat, atau integrasi Obsidian tersedia.

### `wiki doctor`

Jalankan pemeriksaan kesehatan wiki dan tampilkan masalah konfigurasi atau vault.

Masalah umum meliputi:

- mode bridge diaktifkan tanpa artefak memori publik
- tata letak vault tidak valid atau hilang
- CLI Obsidian eksternal tidak ada saat mode Obsidian diharapkan

### `wiki init`

Buat tata letak vault wiki dan halaman awal.

Ini menginisialisasi struktur root, termasuk indeks tingkat atas dan direktori cache.

### `wiki ingest <path-or-url>`

Impor konten ke lapisan sumber wiki.

Catatan:

- ingest URL dikontrol oleh `ingest.allowUrlIngest`
- halaman sumber yang diimpor menyimpan provenance di frontmatter
- auto-compile dapat berjalan setelah ingest jika diaktifkan

### `wiki compile`

Bangun ulang indeks, blok terkait, dasbor, dan digest terkompilasi.

Ini menulis artefak stabil yang menghadap mesin di bawah:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Jika `render.createDashboards` diaktifkan, compile juga menyegarkan halaman laporan.

### `wiki lint`

Lint vault dan laporkan:

- masalah struktural
- celah provenance
- kontradiksi
- pertanyaan terbuka
- halaman/klaim berkepercayaan rendah
- halaman/klaim usang

Jalankan ini setelah pembaruan wiki yang bermakna.

### `wiki search <query>`

Cari konten wiki.

Perilaku bergantung pada config:

- `search.backend`: `shared` atau `local`
- `search.corpus`: `wiki`, `memory`, atau `all`

Gunakan `wiki search` saat Anda menginginkan peringkat khusus wiki atau detail provenance.
Untuk satu lintasan recall bersama yang luas, gunakan `openclaw memory search` saat
Plugin memori aktif mengekspos pencarian bersama.

### `wiki get <lookup>`

Baca halaman wiki berdasarkan id atau path relatif.

Contoh:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Terapkan mutasi sempit tanpa operasi bebas pada halaman.

Alur yang didukung meliputi:

- membuat/memperbarui halaman sintesis
- memperbarui metadata halaman
- melampirkan source id
- menambahkan pertanyaan
- menambahkan kontradiksi
- memperbarui confidence/status
- menulis klaim terstruktur

Perintah ini ada agar wiki dapat berkembang dengan aman tanpa mengedit manual
blok yang dikelola.

### `wiki bridge import`

Impor artefak memori publik dari Plugin memori aktif ke halaman sumber berbasis bridge.

Gunakan ini dalam mode `bridge` saat Anda ingin artefak memori terbaru yang diekspor
ditarik ke vault wiki.

### `wiki unsafe-local import`

Impor dari path lokal yang dikonfigurasi secara eksplisit dalam mode `unsafe-local`.

Ini sengaja bersifat eksperimental dan hanya untuk mesin yang sama.

### `wiki obsidian ...`

Perintah helper Obsidian untuk vault yang berjalan dalam mode ramah Obsidian.

Subperintah:

- `status`
- `search`
- `open`
- `command`
- `daily`

Semua ini memerlukan CLI `obsidian` resmi di `PATH` saat
`obsidian.useOfficialCli` diaktifkan.

## Panduan penggunaan praktis

- Gunakan `wiki search` + `wiki get` saat provenance dan identitas halaman penting.
- Gunakan `wiki apply` alih-alih mengedit manual bagian terkelola yang dihasilkan.
- Gunakan `wiki lint` sebelum mempercayai konten yang kontradiktif atau berkepercayaan rendah.
- Gunakan `wiki compile` setelah impor massal atau perubahan sumber saat Anda menginginkan
  dasbor dan digest terkompilasi yang segar segera.
- Gunakan `wiki bridge import` saat mode bridge bergantung pada artefak memori
  yang baru diekspor.

## Keterkaitan config

Perilaku `openclaw wiki` dibentuk oleh:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Lihat [Plugin Memory Wiki](/id/plugins/memory-wiki) untuk model config lengkap.
