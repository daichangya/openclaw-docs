---
read_when:
    - Anda ingin memahami cara kerja memori
    - Anda ingin mengetahui file memori apa yang harus ditulis
summary: Bagaimana OpenClaw mengingat hal-hal di berbagai sesi
title: Ikhtisar Memori
x-i18n:
    generated_at: "2026-04-09T01:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fe47910f5bf1c44be379e971c605f1cb3a29befcf2a7ee11fb3833cbe3b9059
    source_path: concepts/memory.md
    workflow: 15
---

# Ikhtisar Memori

OpenClaw mengingat berbagai hal dengan menulis **file Markdown biasa** di workspace agen Anda. Model hanya "mengingat" apa yang disimpan ke disk -- tidak ada status tersembunyi.

## Cara kerjanya

Agen Anda memiliki tiga file terkait memori:

- **`MEMORY.md`** -- memori jangka panjang. Fakta, preferensi, dan keputusan yang tahan lama. Dimuat saat awal setiap sesi DM.
- **`memory/YYYY-MM-DD.md`** -- catatan harian. Konteks berjalan dan pengamatan. Catatan hari ini dan kemarin dimuat secara otomatis.
- **`DREAMS.md`** (eksperimental, opsional) -- Dream Diary dan ringkasan penyapuan dreaming untuk ditinjau manusia, termasuk entri backfill historis yang berlandaskan data.

File-file ini berada di workspace agen (default `~/.openclaw/workspace`).

<Tip>
Jika Anda ingin agen Anda mengingat sesuatu, cukup minta: "Ingat bahwa saya
lebih menyukai TypeScript." Agen akan menuliskannya ke file yang sesuai.
</Tip>

## Tool memori

Agen memiliki dua tool untuk bekerja dengan memori:

- **`memory_search`** -- menemukan catatan yang relevan menggunakan pencarian semantik, bahkan ketika susunan katanya berbeda dari aslinya.
- **`memory_get`** -- membaca file memori tertentu atau rentang baris tertentu.

Kedua tool disediakan oleh plugin memori yang aktif (default: `memory-core`).

## Plugin pendamping Memory Wiki

Jika Anda ingin memori tahan lama berfungsi lebih seperti basis pengetahuan yang dipelihara daripada sekadar catatan mentah, gunakan plugin bawaan `memory-wiki`.

`memory-wiki` mengompilasi pengetahuan tahan lama ke dalam vault wiki dengan:

- struktur halaman yang deterministik
- klaim dan bukti yang terstruktur
- pelacakan kontradiksi dan kebaruan
- dasbor yang dihasilkan
- ringkasan terkompilasi untuk konsumen agen/runtime
- tool native wiki seperti `wiki_search`, `wiki_get`, `wiki_apply`, dan `wiki_lint`

Plugin ini tidak menggantikan plugin memori yang aktif. Plugin memori yang aktif tetap memiliki kendali atas recall, promosi, dan dreaming. `memory-wiki` menambahkan lapisan pengetahuan kaya provenance di sampingnya.

Lihat [Memory Wiki](/id/plugins/memory-wiki).

## Pencarian memori

Ketika penyedia embedding dikonfigurasi, `memory_search` menggunakan **pencarian hibrida** -- menggabungkan kemiripan vektor (makna semantik) dengan pencocokan kata kunci (istilah persis seperti ID dan simbol kode). Ini berfungsi langsung tanpa konfigurasi tambahan setelah Anda memiliki API key untuk penyedia yang didukung.

<Info>
OpenClaw mendeteksi otomatis penyedia embedding Anda dari API key yang tersedia. Jika Anda memiliki key OpenAI, Gemini, Voyage, atau Mistral yang dikonfigurasi, pencarian memori akan diaktifkan secara otomatis.
</Info>

Untuk detail tentang cara kerja pencarian, opsi penyetelan, dan penyiapan penyedia, lihat
[Memory Search](/id/concepts/memory-search).

## Backend memori

<CardGroup cols={3}>
<Card title="Bawaan (default)" icon="database" href="/id/concepts/memory-builtin">
Berbasis SQLite. Berfungsi langsung dengan pencarian kata kunci, kemiripan vektor, dan pencarian hibrida. Tanpa dependensi tambahan.
</Card>
<Card title="QMD" icon="search" href="/id/concepts/memory-qmd">
Sidecar local-first dengan reranking, perluasan kueri, dan kemampuan untuk mengindeks direktori di luar workspace.
</Card>
<Card title="Honcho" icon="brain" href="/id/concepts/memory-honcho">
Memori lintas sesi yang AI-native dengan pemodelan pengguna, pencarian semantik, dan kesadaran multi-agen. Instal plugin.
</Card>
</CardGroup>

## Lapisan wiki pengetahuan

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/id/plugins/memory-wiki">
Mengompilasi memori tahan lama menjadi vault wiki kaya provenance dengan klaim, dasbor, mode bridge, dan alur kerja yang ramah Obsidian.
</Card>
</CardGroup>

## Flush memori otomatis

Sebelum [compaction](/id/concepts/compaction) merangkum percakapan Anda, OpenClaw menjalankan giliran diam-diam yang mengingatkan agen untuk menyimpan konteks penting ke file memori. Ini aktif secara default -- Anda tidak perlu mengonfigurasi apa pun.

<Tip>
Flush memori mencegah hilangnya konteks selama compaction. Jika agen Anda memiliki fakta penting dalam percakapan yang belum ditulis ke file, fakta tersebut akan disimpan secara otomatis sebelum peringkasan terjadi.
</Tip>

## Dreaming (eksperimental)

Dreaming adalah proses konsolidasi latar belakang opsional untuk memori. Sistem ini mengumpulkan sinyal jangka pendek, memberi skor pada kandidat, dan hanya mempromosikan item yang memenuhi syarat ke memori jangka panjang (`MEMORY.md`).

Sistem ini dirancang untuk menjaga memori jangka panjang tetap bernilai tinggi:

- **Opt-in**: dinonaktifkan secara default.
- **Terjadwal**: ketika diaktifkan, `memory-core` mengelola otomatis satu cron job berulang untuk penyapuan dreaming penuh.
- **Berambang**: promosi harus melewati gerbang skor, frekuensi recall, dan keragaman kueri.
- **Dapat ditinjau**: ringkasan fase dan entri buku harian ditulis ke `DREAMS.md` untuk ditinjau manusia.

Untuk perilaku fase, sinyal penilaian, dan detail Dream Diary, lihat
[Dreaming (experimental)](/id/concepts/dreaming).

## Grounded backfill dan promosi langsung

Sistem dreaming sekarang memiliki dua jalur tinjauan yang sangat terkait:

- **Live dreaming** bekerja dari penyimpanan dreaming jangka pendek di bawah
  `memory/.dreams/` dan inilah yang digunakan fase mendalam normal saat memutuskan apa yang dapat lulus ke `MEMORY.md`.
- **Grounded backfill** membaca catatan historis `memory/YYYY-MM-DD.md` sebagai file harian mandiri dan menulis keluaran tinjauan terstruktur ke `DREAMS.md`.

Grounded backfill berguna saat Anda ingin memutar ulang catatan lama dan memeriksa apa yang menurut sistem bersifat tahan lama tanpa mengedit `MEMORY.md` secara manual.

Saat Anda menggunakan:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

kandidat tahan lama yang berlandaskan data tidak dipromosikan secara langsung. Kandidat tersebut dipentaskan ke penyimpanan dreaming jangka pendek yang sama yang sudah digunakan oleh fase mendalam normal. Artinya:

- `DREAMS.md` tetap menjadi permukaan tinjauan manusia.
- penyimpanan jangka pendek tetap menjadi permukaan pemeringkatan yang berhadapan dengan mesin.
- `MEMORY.md` tetap hanya ditulis oleh promosi mendalam.

Jika Anda memutuskan pemutaran ulang itu tidak berguna, Anda dapat menghapus artefak yang dipentaskan tanpa menyentuh entri buku harian biasa atau status recall normal:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Periksa status indeks dan penyedia
openclaw memory search "query"  # Cari dari baris perintah
openclaw memory index --force   # Bangun ulang indeks
```

## Bacaan lanjutan

- [Builtin Memory Engine](/id/concepts/memory-builtin) -- backend SQLite default
- [QMD Memory Engine](/id/concepts/memory-qmd) -- sidecar local-first tingkat lanjut
- [Honcho Memory](/id/concepts/memory-honcho) -- memori lintas sesi AI-native
- [Memory Wiki](/id/plugins/memory-wiki) -- vault pengetahuan terkompilasi dan tool native wiki
- [Memory Search](/id/concepts/memory-search) -- pipeline pencarian, penyedia, dan
  penyetelan
- [Dreaming (experimental)](/id/concepts/dreaming) -- promosi latar belakang
  dari recall jangka pendek ke memori jangka panjang
- [Memory configuration reference](/id/reference/memory-config) -- semua opsi konfigurasi
- [Compaction](/id/concepts/compaction) -- bagaimana compaction berinteraksi dengan memori
