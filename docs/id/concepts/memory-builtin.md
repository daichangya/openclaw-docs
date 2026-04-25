---
read_when:
    - Anda ingin memahami backend memori default
    - Anda ingin mengonfigurasi provider embedding atau pencarian hibrida
summary: Backend memori berbasis SQLite default dengan pencarian kata kunci, vektor, dan hibrida
title: Mesin memori bawaan
x-i18n:
    generated_at: "2026-04-25T13:44:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf0b70bd3ed4e2138ae1d811573f6920c95eb3f8117693b242732012779dc6
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Mesin bawaan adalah backend memori default. Mesin ini menyimpan indeks memori Anda dalam
database SQLite per agen dan tidak memerlukan dependensi tambahan untuk memulai.

## Apa yang disediakan

- **Pencarian kata kunci** melalui pengindeksan full-text FTS5 (skor BM25).
- **Pencarian vektor** melalui embedding dari provider yang didukung.
- **Pencarian hibrida** yang menggabungkan keduanya untuk hasil terbaik.
- **Dukungan CJK** melalui tokenisasi trigram untuk bahasa Tionghoa, Jepang, dan Korea.
- **Akselerasi `sqlite-vec`** untuk kueri vektor di dalam database (opsional).

## Memulai

Jika Anda memiliki API key untuk OpenAI, Gemini, Voyage, atau Mistral, mesin bawaan
akan mendeteksinya secara otomatis dan mengaktifkan pencarian vektor. Tidak perlu config.

Untuk menetapkan provider secara eksplisit:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Tanpa provider embedding, hanya pencarian kata kunci yang tersedia.

Untuk memaksa provider embedding lokal bawaan, instal paket runtime opsional
`node-llama-cpp` di samping OpenClaw, lalu arahkan `local.modelPath`
ke file GGUF:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Provider embedding yang didukung

| Provider | ID        | Terdeteksi otomatis | Catatan                             |
| -------- | --------- | ------------------- | ----------------------------------- |
| OpenAI   | `openai`  | Ya                  | Default: `text-embedding-3-small`   |
| Gemini   | `gemini`  | Ya                  | Mendukung multimodal (gambar + audio) |
| Voyage   | `voyage`  | Ya                  |                                     |
| Mistral  | `mistral` | Ya                  |                                     |
| Ollama   | `ollama`  | Tidak               | Lokal, tetapkan secara eksplisit    |
| Local    | `local`   | Ya (pertama)        | Runtime `node-llama-cpp` opsional   |

Deteksi otomatis memilih provider pertama yang API key-nya dapat di-resolve, dalam
urutan yang ditampilkan. Tetapkan `memorySearch.provider` untuk override.

## Cara kerja pengindeksan

OpenClaw mengindeks `MEMORY.md` dan `memory/*.md` menjadi potongan (~400 token dengan
tumpang tindih 80 token) dan menyimpannya dalam database SQLite per agen.

- **Lokasi indeks:** `~/.openclaw/memory/<agentId>.sqlite`
- **Pemantauan file:** perubahan pada file memori memicu pengindeksan ulang yang di-debounce (1,5 dtk).
- **Pengindeksan ulang otomatis:** saat provider embedding, model, atau config chunking
  berubah, seluruh indeks dibangun ulang secara otomatis.
- **Pengindeksan ulang sesuai permintaan:** `openclaw memory index --force`

<Info>
Anda juga dapat mengindeks file Markdown di luar workspace dengan
`memorySearch.extraPaths`. Lihat
[referensi konfigurasi](/id/reference/memory-config#additional-memory-paths).
</Info>

## Kapan digunakan

Mesin bawaan adalah pilihan yang tepat bagi sebagian besar pengguna:

- Berfungsi langsung tanpa dependensi tambahan.
- Menangani pencarian kata kunci dan vektor dengan baik.
- Mendukung semua provider embedding.
- Pencarian hibrida menggabungkan keunggulan dari kedua pendekatan retrieval.

Pertimbangkan untuk beralih ke [QMD](/id/concepts/memory-qmd) jika Anda memerlukan reranking, query
expansion, atau ingin mengindeks direktori di luar workspace.

Pertimbangkan [Honcho](/id/concepts/memory-honcho) jika Anda menginginkan memori lintas sesi dengan
pemodelan pengguna otomatis.

## Pemecahan masalah

**Pencarian memori dinonaktifkan?** Periksa `openclaw memory status`. Jika tidak ada provider yang
terdeteksi, tetapkan satu secara eksplisit atau tambahkan API key.

**Provider lokal tidak terdeteksi?** Pastikan path lokal ada dan jalankan:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Baik perintah CLI mandiri maupun Gateway menggunakan ID provider `local` yang sama.
Jika provider ditetapkan ke `auto`, embedding lokal dipertimbangkan terlebih dahulu hanya
saat `memorySearch.local.modelPath` menunjuk ke file lokal yang ada.

**Hasil usang?** Jalankan `openclaw memory index --force` untuk membangun ulang. Watcher
dapat melewatkan perubahan dalam kasus tepi yang jarang terjadi.

**`sqlite-vec` tidak dimuat?** OpenClaw otomatis fallback ke cosine similarity dalam proses.
Periksa log untuk error pemuatan yang spesifik.

## Konfigurasi

Untuk penyiapan provider embedding, penyetelan pencarian hibrida (bobot, MMR, temporal
decay), pengindeksan batch, memori multimodal, `sqlite-vec`, path tambahan, dan semua
pengaturan config lainnya, lihat
[Referensi konfigurasi memori](/id/reference/memory-config).

## Terkait

- [Gambaran umum memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Active Memory](/id/concepts/active-memory)
