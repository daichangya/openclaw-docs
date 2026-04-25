---
read_when:
    - Anda ingin menyiapkan QMD sebagai backend memori Anda
    - Anda menginginkan fitur memori lanjutan seperti reranking atau jalur yang diindeks tambahan
summary: Sidecar pencarian local-first dengan BM25, vektor, reranking, dan ekspansi kueri
title: Mesin memori QMD
x-i18n:
    generated_at: "2026-04-25T13:44:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e6a5e0c8f5fb8507dffd08975fec0ca6fda03883079a27c2a28a1d09e95368
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) adalah sidecar pencarian local-first yang berjalan
bersama OpenClaw. QMD menggabungkan BM25, pencarian vektor, dan reranking dalam satu
biner, serta dapat mengindeks konten di luar file memori workspace Anda.

## Apa yang ditambahkan dibanding bawaan

- **Reranking dan ekspansi kueri** untuk recall yang lebih baik.
- **Indeks direktori tambahan** -- dokumentasi proyek, catatan tim, apa pun di disk.
- **Indeks transkrip sesi** -- mengingat percakapan sebelumnya.
- **Sepenuhnya lokal** -- berjalan dengan paket runtime node-llama-cpp opsional dan
  mengunduh model GGUF secara otomatis.
- **Fallback otomatis** -- jika QMD tidak tersedia, OpenClaw fallback ke
  mesin bawaan secara mulus.

## Memulai

### Prasyarat

- Instal QMD: `npm install -g @tobilu/qmd` atau `bun install -g @tobilu/qmd`
- Build SQLite yang mengizinkan extension (`brew install sqlite` di macOS).
- QMD harus ada di `PATH` gateway.
- macOS dan Linux berfungsi langsung. Windows paling didukung melalui WSL2.

### Aktifkan

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw membuat home QMD mandiri di bawah
`~/.openclaw/agents/<agentId>/qmd/` dan mengelola lifecycle sidecar
secara otomatis -- collection, pembaruan, dan eksekusi embedding ditangani untuk Anda.
Sistem ini lebih memilih bentuk collection dan kueri MCP QMD saat ini, tetapi tetap fallback ke
flag collection `--mask` lama dan nama tool MCP lama bila diperlukan.
Rekonsiliasi saat boot juga membuat ulang collection terkelola usang kembali ke
pola kanonisnya saat collection QMD lama dengan nama yang sama masih ada.

## Cara kerja sidecar

- OpenClaw membuat collection dari file memori workspace Anda dan
  `memory.qmd.paths` apa pun yang dikonfigurasi, lalu menjalankan `qmd update` + `qmd embed` saat boot
  dan secara berkala (default setiap 5 menit).
- Collection workspace default melacak `MEMORY.md` serta tree `memory/`.
  `memory.md` huruf kecil tidak diindeks sebagai file memori root.
- Refresh saat boot berjalan di latar belakang agar startup chat tidak terblokir.
- Pencarian menggunakan `searchMode` yang dikonfigurasi (default: `search`; juga mendukung
  `vsearch` dan `query`). Jika sebuah mode gagal, OpenClaw mencoba ulang dengan `qmd query`.
- Jika QMD gagal sepenuhnya, OpenClaw fallback ke mesin SQLite bawaan.

<Info>
Pencarian pertama mungkin lambat -- QMD mengunduh model GGUF (~2 GB) secara otomatis untuk
reranking dan ekspansi kueri pada eksekusi pertama `qmd query`.
</Info>

## Override model

Variabel env model QMD diteruskan tanpa perubahan dari proses gateway,
sehingga Anda dapat menyetel QMD secara global tanpa menambahkan konfigurasi OpenClaw baru:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Setelah mengubah model embedding, jalankan ulang embedding agar indeks cocok dengan
ruang vektor baru.

## Mengindeks jalur tambahan

Arahkan QMD ke direktori tambahan agar dapat dicari:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Cuplikan dari jalur tambahan muncul sebagai `qmd/<collection>/<relative-path>` dalam
hasil pencarian. `memory_get` memahami prefiks ini dan membaca dari root collection yang benar.

## Mengindeks transkrip sesi

Aktifkan pengindeksan sesi untuk mengingat percakapan sebelumnya:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkrip diekspor sebagai giliran User/Assistant yang telah disanitasi ke collection QMD khusus
di bawah `~/.openclaw/agents/<id>/qmd/sessions/`.

## Cakupan pencarian

Secara default, hasil pencarian QMD ditampilkan dalam sesi langsung dan channel
(bukan grup). Konfigurasikan `memory.qmd.scope` untuk mengubah ini:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Saat cakupan menolak pencarian, OpenClaw mencatat peringatan dengan channel dan
jenis chat yang diturunkan agar hasil kosong lebih mudah di-debug.

## Sitasi

Saat `memory.citations` adalah `auto` atau `on`, cuplikan pencarian menyertakan
footer `Source: <path#line>`. Tetapkan `memory.citations = "off"` untuk menghilangkan footer
sambil tetap meneruskan jalurnya ke agen secara internal.

## Kapan digunakan

Pilih QMD saat Anda memerlukan:

- Reranking untuk hasil dengan kualitas lebih tinggi.
- Mencari dokumentasi proyek atau catatan di luar workspace.
- Mengingat percakapan sesi sebelumnya.
- Pencarian sepenuhnya lokal tanpa API key.

Untuk pengaturan yang lebih sederhana, [mesin bawaan](/id/concepts/memory-builtin) bekerja dengan baik
tanpa dependensi tambahan.

## Pemecahan masalah

**QMD tidak ditemukan?** Pastikan biner ada di `PATH` gateway. Jika OpenClaw
berjalan sebagai layanan, buat symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Pencarian pertama sangat lambat?** QMD mengunduh model GGUF saat pertama digunakan. Pre-warm
dengan `qmd query "test"` menggunakan direktori XDG yang sama seperti yang digunakan OpenClaw.

**Pencarian timeout?** Tingkatkan `memory.qmd.limits.timeoutMs` (default: 4000 ms).
Tetapkan ke `120000` untuk perangkat keras yang lebih lambat.

**Hasil kosong di chat grup?** Periksa `memory.qmd.scope` -- default hanya
mengizinkan sesi langsung dan channel.

**Pencarian memori root tiba-tiba jadi terlalu luas?** Mulai ulang gateway atau tunggu hingga
rekonsiliasi startup berikutnya. OpenClaw membuat ulang collection terkelola usang
kembali ke pola kanonis `MEMORY.md` dan `memory/` saat mendeteksi konflik
nama yang sama.

**Repo temp yang terlihat oleh workspace menyebabkan `ENAMETOOLONG` atau pengindeksan rusak?**
Traversal QMD saat ini mengikuti perilaku pemindai QMD yang mendasarinya, bukan
aturan symlink bawaan OpenClaw. Simpan checkout monorepo sementara di bawah
direktori tersembunyi seperti `.tmp/` atau di luar root QMD yang diindeks sampai QMD menyediakan
traversal aman terhadap siklus atau kontrol pengecualian eksplisit.

## Konfigurasi

Untuk seluruh permukaan konfigurasi (`memory.qmd.*`), mode pencarian, interval pembaruan,
aturan cakupan, dan semua pengaturan lainnya, lihat
[Referensi konfigurasi Memory](/id/reference/memory-config).

## Terkait

- [Ringkasan Memory](/id/concepts/memory)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Memory Honcho](/id/concepts/memory-honcho)
