---
read_when:
    - Anda ingin mengonfigurasi penyedia pencarian memori atau model embedding
    - Anda ingin menyiapkan backend QMD
    - Anda ingin menyetel pencarian hibrida, MMR, atau peluruhan temporal
    - Anda ingin mengaktifkan pengindeksan memori multimodal
summary: Semua opsi konfigurasi untuk pencarian memori, penyedia embedding, QMD, pencarian hibrida, dan pengindeksan multimodal
title: Referensi konfigurasi Memori
x-i18n:
    generated_at: "2026-04-10T09:13:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9076bdfad95b87bd70625821bf401326f8eaeb53842b70823881419dbe43cb
    source_path: reference/memory-config.md
    workflow: 15
---

# Referensi konfigurasi Memori

Halaman ini mencantumkan setiap opsi konfigurasi untuk pencarian memori OpenClaw. Untuk gambaran konseptual, lihat:

- [Ikhtisar Memori](/id/concepts/memory) -- cara kerja memori
- [Mesin Bawaan](/id/concepts/memory-builtin) -- backend SQLite bawaan
- [Mesin QMD](/id/concepts/memory-qmd) -- sidecar yang mengutamakan lokal
- [Pencarian Memori](/id/concepts/memory-search) -- alur pencarian dan penyetelan
- [Memori Aktif](/id/concepts/active-memory) -- mengaktifkan sub-agen memori untuk sesi interaktif

Semua pengaturan pencarian memori berada di bawah `agents.defaults.memorySearch` dalam `openclaw.json` kecuali dinyatakan lain.

Jika Anda mencari toggle fitur **memori aktif** dan konfigurasi sub-agen, itu berada di bawah `plugins.entries.active-memory`, bukan `memorySearch`.

Memori aktif menggunakan model dua gerbang:

1. plugin harus diaktifkan dan menargetkan id agen saat ini
2. permintaan harus berupa sesi obrolan persisten interaktif yang memenuhi syarat

Lihat [Memori Aktif](/id/concepts/active-memory) untuk model aktivasi, konfigurasi yang dimiliki plugin, persistensi transkrip, dan pola rollout yang aman.

---

## Pemilihan penyedia

| Kunci      | Tipe      | Default          | Deskripsi                                                                                   |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `provider` | `string`  | terdeteksi otomatis | ID adaptor embedding: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | default penyedia | Nama model embedding                                                                        |
| `fallback` | `string`  | `"none"`         | ID adaptor fallback saat adaptor utama gagal                                                |
| `enabled`  | `boolean` | `true`           | Mengaktifkan atau menonaktifkan pencarian memori                                            |

### Urutan deteksi otomatis

Ketika `provider` tidak ditetapkan, OpenClaw memilih yang pertama tersedia:

1. `local` -- jika `memorySearch.local.modelPath` dikonfigurasi dan file ada.
2. `openai` -- jika kunci OpenAI dapat diurai.
3. `gemini` -- jika kunci Gemini dapat diurai.
4. `voyage` -- jika kunci Voyage dapat diurai.
5. `mistral` -- jika kunci Mistral dapat diurai.
6. `bedrock` -- jika rantai kredensial AWS SDK terurai (instance role, access key, profile, SSO, web identity, atau shared config).

`ollama` didukung tetapi tidak dideteksi otomatis (tetapkan secara eksplisit).

### Resolusi kunci API

Embedding jarak jauh memerlukan kunci API. Bedrock menggunakan rantai kredensial default AWS SDK sebagai gantinya (instance role, SSO, access key).

| Penyedia | Variabel env                  | Kunci konfigurasi                |
| -------- | ----------------------------- | -------------------------------- |
| OpenAI   | `OPENAI_API_KEY`              | `models.providers.openai.apiKey` |
| Gemini   | `GEMINI_API_KEY`              | `models.providers.google.apiKey` |
| Voyage   | `VOYAGE_API_KEY`              | `models.providers.voyage.apiKey` |
| Mistral  | `MISTRAL_API_KEY`             | `models.providers.mistral.apiKey` |
| Bedrock  | rantai kredensial AWS         | Tidak memerlukan kunci API       |
| Ollama   | `OLLAMA_API_KEY` (placeholder) | --                              |

Codex OAuth hanya mencakup chat/completions dan tidak memenuhi permintaan embedding.

---

## Konfigurasi endpoint jarak jauh

Untuk endpoint kustom yang kompatibel dengan OpenAI atau mengganti default penyedia:

| Kunci            | Tipe     | Deskripsi                                       |
| ---------------- | -------- | ----------------------------------------------- |
| `remote.baseUrl` | `string` | URL basis API kustom                            |
| `remote.apiKey`  | `string` | Mengganti kunci API                             |
| `remote.headers` | `object` | Header HTTP tambahan (digabung dengan default penyedia) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Konfigurasi khusus Gemini

| Kunci                  | Tipe     | Default                | Deskripsi                                 |
| ---------------------- | -------- | ---------------------- | ----------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | Juga mendukung `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Untuk Embedding 2: 768, 1536, atau 3072   |

<Warning>
Mengubah model atau `outputDimensionality` memicu pengindeksan ulang penuh secara otomatis.
</Warning>

---

## Konfigurasi embedding Bedrock

Bedrock menggunakan rantai kredensial default AWS SDK -- tidak memerlukan kunci API.
Jika OpenClaw berjalan di EC2 dengan instance role yang mendukung Bedrock, cukup tetapkan
penyedia dan model:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Kunci                  | Tipe     | Default                        | Deskripsi                    |
| ---------------------- | -------- | ------------------------------ | ---------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID model embedding Bedrock apa pun |
| `outputDimensionality` | `number` | default model                  | Untuk Titan V2: 256, 512, atau 1024 |

### Model yang didukung

Model berikut didukung (dengan deteksi keluarga dan default dimensi):

| ID Model                                   | Penyedia   | Default Dim | Dim yang dapat dikonfigurasi |
| ------------------------------------------ | ---------- | ----------- | ---------------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024        | 256, 512, 1024               |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536        | --                           |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536        | --                           |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024        | --                           |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024        | 256, 384, 1024, 3072         |
| `cohere.embed-english-v3`                  | Cohere     | 1024        | --                           |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024        | --                           |
| `cohere.embed-v4:0`                        | Cohere     | 1536        | 256-1536                     |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512         | --                           |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024        | --                           |

Varian dengan sufiks throughput (misalnya, `amazon.titan-embed-text-v1:2:8k`) mewarisi konfigurasi model dasar.

### Autentikasi

Autentikasi Bedrock menggunakan urutan resolusi kredensial AWS SDK standar:

1. Variabel lingkungan (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Cache token SSO
3. Kredensial token web identity
4. File kredensial dan konfigurasi bersama
5. Kredensial metadata ECS atau EC2

Region diurai dari `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` penyedia
`amazon-bedrock`, atau default ke `us-east-1`.

### Izin IAM

Role atau pengguna IAM memerlukan:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Untuk hak akses minimum, batasi `InvokeModel` ke model tertentu:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Konfigurasi embedding lokal

| Kunci                 | Tipe     | Default                | Deskripsi                      |
| --------------------- | -------- | ---------------------- | ------------------------------ |
| `local.modelPath`     | `string` | terunduh otomatis      | Jalur ke file model GGUF       |
| `local.modelCacheDir` | `string` | default node-llama-cpp | Direktori cache untuk model yang diunduh |

Model default: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, diunduh otomatis).
Memerlukan build native: `pnpm approve-builds` lalu `pnpm rebuild node-llama-cpp`.

---

## Konfigurasi pencarian hibrida

Semua berada di bawah `memorySearch.query.hybrid`:

| Kunci                 | Tipe      | Default | Deskripsi                           |
| --------------------- | --------- | ------- | ----------------------------------- |
| `enabled`             | `boolean` | `true`  | Aktifkan pencarian hibrida BM25 + vektor |
| `vectorWeight`        | `number`  | `0.7`   | Bobot untuk skor vektor (0-1)       |
| `textWeight`          | `number`  | `0.3`   | Bobot untuk skor BM25 (0-1)         |
| `candidateMultiplier` | `number`  | `4`     | Pengali ukuran kumpulan kandidat    |

### MMR (keragaman)

| Kunci         | Tipe      | Default | Deskripsi                             |
| ------------- | --------- | ------- | ------------------------------------- |
| `mmr.enabled` | `boolean` | `false` | Aktifkan pemeringkatan ulang MMR      |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = keragaman maksimum, 1 = relevansi maksimum |

### Peluruhan temporal (keterkinian)

| Kunci                        | Tipe      | Default | Deskripsi                    |
| ---------------------------- | --------- | ------- | ---------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Aktifkan dorongan keterkinian |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | Skor menjadi setengah setiap N hari |

File permanen (`MEMORY.md`, file non-tanggal di `memory/`) tidak pernah dikenai peluruhan.

### Contoh lengkap

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Jalur memori tambahan

| Kunci        | Tipe       | Deskripsi                               |
| ------------ | ---------- | --------------------------------------- |
| `extraPaths` | `string[]` | Direktori atau file tambahan untuk diindeks |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Jalur dapat berupa absolut atau relatif terhadap workspace. Direktori dipindai
secara rekursif untuk file `.md`. Penanganan symlink bergantung pada backend aktif:
mesin bawaan mengabaikan symlink, sedangkan QMD mengikuti perilaku pemindai QMD
yang mendasarinya.

Untuk pencarian transkrip lintas agen yang dicakup per agen, gunakan
`agents.list[].memorySearch.qmd.extraCollections` alih-alih `memory.qmd.paths`.
Koleksi tambahan tersebut mengikuti bentuk `{ path, name, pattern? }` yang sama, tetapi
digabung per agen dan dapat mempertahankan nama bersama yang eksplisit ketika jalurnya
mengarah ke luar workspace saat ini.
Jika jalur hasil resolusi yang sama muncul di `memory.qmd.paths` dan
`memorySearch.qmd.extraCollections`, QMD mempertahankan entri pertama dan melewati duplikat.

---

## Memori multimodal (Gemini)

Indeks gambar dan audio bersama Markdown menggunakan Gemini Embedding 2:

| Kunci                     | Tipe       | Default    | Deskripsi                               |
| ------------------------- | ---------- | ---------- | --------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Aktifkan pengindeksan multimodal        |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, atau `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Ukuran file maksimum untuk pengindeksan |

Hanya berlaku untuk file di `extraPaths`. Root memori default tetap hanya Markdown.
Memerlukan `gemini-embedding-2-preview`. `fallback` harus `"none"`.

Format yang didukung: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(gambar); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache embedding

| Kunci              | Tipe      | Default | Deskripsi                     |
| ------------------ | --------- | ------- | ----------------------------- |
| `cache.enabled`    | `boolean` | `false` | Cache embedding potongan di SQLite |
| `cache.maxEntries` | `number`  | `50000` | Jumlah maksimum embedding yang di-cache |

Mencegah embedding ulang pada teks yang tidak berubah selama pengindeksan ulang atau pembaruan transkrip.

---

## Pengindeksan batch

| Kunci                         | Tipe      | Default | Deskripsi                    |
| ----------------------------- | --------- | ------- | ---------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Aktifkan API embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`     | Pekerjaan batch paralel      |
| `remote.batch.wait`           | `boolean` | `true`  | Tunggu penyelesaian batch    |
| `remote.batch.pollIntervalMs` | `number`  | --      | Interval polling             |
| `remote.batch.timeoutMinutes` | `number`  | --      | Batas waktu batch            |

Tersedia untuk `openai`, `gemini`, dan `voyage`. Batch OpenAI biasanya
paling cepat dan paling murah untuk backfill berukuran besar.

---

## Pencarian memori sesi (eksperimental)

Indeks transkrip sesi dan tampilkan melalui `memory_search`:

| Kunci                         | Tipe       | Default      | Deskripsi                              |
| ----------------------------- | ---------- | ------------ | -------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Aktifkan pengindeksan sesi             |
| `sources`                     | `string[]` | `["memory"]` | Tambahkan `"sessions"` untuk menyertakan transkrip |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ambang byte untuk pengindeksan ulang   |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ambang pesan untuk pengindeksan ulang  |

Pengindeksan sesi bersifat opt-in dan berjalan secara asinkron. Hasilnya dapat sedikit
tidak mutakhir. Log sesi berada di disk, jadi perlakukan akses filesystem sebagai batas
kepercayaan.

---

## Akselerasi vektor SQLite (sqlite-vec)

| Kunci                        | Tipe      | Default | Deskripsi                          |
| ---------------------------- | --------- | ------- | ---------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Gunakan sqlite-vec untuk kueri vektor |
| `store.vector.extensionPath` | `string`  | bundled | Ganti jalur sqlite-vec             |

Ketika sqlite-vec tidak tersedia, OpenClaw secara otomatis beralih ke
similaritas kosinus dalam proses.

---

## Penyimpanan indeks

| Kunci               | Tipe     | Default                               | Deskripsi                                   |
| ------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokasi indeks (mendukung token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Tokenizer FTS5 (`unicode61` atau `trigram`) |

---

## Konfigurasi backend QMD

Tetapkan `memory.backend = "qmd"` untuk mengaktifkan. Semua pengaturan QMD berada di bawah
`memory.qmd`:

| Kunci                    | Tipe      | Default  | Deskripsi                                  |
| ------------------------ | --------- | -------- | ------------------------------------------ |
| `command`                | `string`  | `qmd`    | Jalur executable QMD                       |
| `searchMode`             | `string`  | `search` | Perintah pencarian: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Indeks otomatis `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | Jalur tambahan: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`  | Indeks transkrip sesi                      |
| `sessions.retentionDays` | `number`  | --       | Retensi transkrip                          |
| `sessions.exportDir`     | `string`  | --       | Direktori ekspor                           |

OpenClaw lebih memilih bentuk kueri koleksi QMD dan MCP saat ini, tetapi tetap
mendukung rilis QMD yang lebih lama dengan beralih ke flag koleksi `--mask` lama
dan nama tool MCP lama saat diperlukan.

Override model QMD tetap berada di sisi QMD, bukan di konfigurasi OpenClaw. Jika Anda perlu
mengganti model QMD secara global, tetapkan variabel lingkungan seperti
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, dan `QMD_GENERATE_MODEL` di lingkungan runtime
gateway.

### Jadwal pembaruan

| Kunci                     | Tipe      | Default | Deskripsi                              |
| ------------------------- | --------- | ------- | -------------------------------------- |
| `update.interval`         | `string`  | `5m`    | Interval penyegaran                    |
| `update.debounceMs`       | `number`  | `15000` | Debounce perubahan file                |
| `update.onBoot`           | `boolean` | `true`  | Segarkan saat startup                  |
| `update.waitForBootSync`  | `boolean` | `false` | Blokir startup sampai penyegaran selesai |
| `update.embedInterval`    | `string`  | --      | Cadence embedding terpisah             |
| `update.commandTimeoutMs` | `number`  | --      | Batas waktu untuk perintah QMD         |
| `update.updateTimeoutMs`  | `number`  | --      | Batas waktu untuk operasi update QMD   |
| `update.embedTimeoutMs`   | `number`  | --      | Batas waktu untuk operasi embedding QMD |

### Batas

| Kunci                     | Tipe     | Default | Deskripsi                      |
| ------------------------- | -------- | ------- | ------------------------------ |
| `limits.maxResults`       | `number` | `6`     | Jumlah maksimum hasil pencarian |
| `limits.maxSnippetChars`  | `number` | --      | Batasi panjang cuplikan        |
| `limits.maxInjectedChars` | `number` | --      | Batasi total karakter yang disisipkan |
| `limits.timeoutMs`        | `number` | `4000`  | Batas waktu pencarian          |

### Cakupan

Mengontrol sesi mana yang dapat menerima hasil pencarian QMD. Skemanya sama seperti
[`session.sendPolicy`](/id/gateway/configuration-reference#session):

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

Default-nya hanya DM. `match.keyPrefix` cocok dengan kunci sesi yang dinormalisasi;
`match.rawKeyPrefix` cocok dengan kunci mentah termasuk `agent:<id>:`.

### Sitasi

`memory.citations` berlaku untuk semua backend:

| Nilai            | Perilaku                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (default) | Sertakan footer `Source: <path#line>` dalam cuplikan |
| `on`             | Selalu sertakan footer                              |
| `off`            | Hilangkan footer (jalur tetap diteruskan ke agen secara internal) |

### Contoh QMD lengkap

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming (eksperimental)

Dreaming dikonfigurasi di bawah `plugins.entries.memory-core.config.dreaming`,
bukan di bawah `agents.defaults.memorySearch`.

Dreaming berjalan sebagai satu sweep terjadwal dan menggunakan fase internal light/deep/REM sebagai
detail implementasi.

Untuk perilaku konseptual dan slash command, lihat [Dreaming](/id/concepts/dreaming).

### Pengaturan pengguna

| Kunci       | Tipe      | Default     | Deskripsi                                      |
| ----------- | --------- | ----------- | ---------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Aktifkan atau nonaktifkan dreaming sepenuhnya  |
| `frequency` | `string`  | `0 3 * * *` | Cadence cron opsional untuk sweep dreaming penuh |

### Contoh

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Catatan:

- Dreaming menulis status mesin ke `memory/.dreams/`.
- Dreaming menulis output naratif yang dapat dibaca manusia ke `DREAMS.md` (atau `dreams.md` yang sudah ada).
- Kebijakan dan ambang fase light/deep/REM adalah perilaku internal, bukan konfigurasi yang menghadap pengguna.
