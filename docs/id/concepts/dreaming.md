---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami fungsi setiap fase dreaming
    - Anda ingin menyetel konsolidasi tanpa mencemari MEMORY.md
summary: Konsolidasi memori latar belakang dengan fase light, deep, dan REM serta Dream Diary
title: Dreaming (eksperimental)
x-i18n:
    generated_at: "2026-04-09T01:27:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26476eddb8260e1554098a6adbb069cf7f5e284cf2e09479c6d9d8f8b93280ef
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (eksperimental)

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`.
Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori tahan lama sambil
menjaga agar prosesnya tetap dapat dijelaskan dan ditinjau.

Dreaming bersifat **opt-in** dan dinonaktifkan secara default.

## Apa yang ditulis oleh dreaming

Dreaming menyimpan dua jenis keluaran:

- **Status mesin** di `memory/.dreams/` (penyimpanan recall, sinyal fase, checkpoint ingestion, kunci).
- **Keluaran yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menggunakan tiga fase kooperatif:

| Phase | Purpose                                   | Durable write     |
| ----- | ----------------------------------------- | ----------------- |
| Light | Mengurutkan dan menyiapkan materi jangka pendek terbaru | Tidak                |
| Deep  | Menilai dan mempromosikan kandidat yang tahan lama      | Ya (`MEMORY.md`) |
| REM   | Merefleksikan tema dan gagasan yang berulang     | Tidak                |

Fase-fase ini adalah detail implementasi internal, bukan "mode" terpisah
yang dikonfigurasi pengguna.

### Fase light

Fase light mengingest sinyal memori harian terbaru dan jejak recall, menghapus duplikasi,
dan menyiapkan baris kandidat.

- Membaca dari status recall jangka pendek, file memori harian terbaru, dan transkrip sesi yang telah disunting jika tersedia.
- Menulis blok `## Light Sleep` yang dikelola ketika penyimpanan mencakup keluaran inline.
- Mencatat sinyal penguatan untuk peringkat deep berikutnya.
- Tidak pernah menulis ke `MEMORY.md`.

### Fase deep

Fase deep menentukan apa yang menjadi memori jangka panjang.

- Memberi peringkat kandidat menggunakan skor berbobot dan ambang batas.
- Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` terpenuhi.
- Melakukan rehidrasi cuplikan dari file harian aktif sebelum menulis, sehingga cuplikan yang usang/dihapus dilewati.
- Menambahkan entri yang dipromosikan ke `MEMORY.md`.
- Menulis ringkasan `## Deep Sleep` ke dalam `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

Fase REM mengekstrak pola dan sinyal reflektif.

- Membangun ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
- Menulis blok `## REM Sleep` yang dikelola ketika penyimpanan mencakup keluaran inline.
- Mencatat sinyal penguatan REM yang digunakan oleh peringkat deep.
- Tidak pernah menulis ke `MEMORY.md`.

## Ingestion transkrip sesi

Dreaming dapat mengingest transkrip sesi yang telah disunting ke dalam korpus dreaming. Ketika
transkrip tersedia, transkrip tersebut dimasukkan ke fase light bersama sinyal
memori harian dan jejak recall. Konten pribadi dan sensitif disunting
sebelum ingestion.

## Dream Diary

Dreaming juga menyimpan **Dream Diary** naratif di `DREAMS.md`.
Setelah setiap fase memiliki cukup materi, `memory-core` menjalankan giliran subagent latar belakang
best-effort (menggunakan model runtime default) dan menambahkan entri diary singkat.

Diary ini untuk dibaca manusia di UI Dreams, bukan sumber promosi.

Ada juga jalur backfill historis yang grounded untuk pekerjaan peninjauan dan pemulihan:

- `memory rem-harness --path ... --grounded` mempratinjau keluaran diary grounded dari catatan historis `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` menulis entri diary grounded yang reversibel ke dalam `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` menyiapkan kandidat tahan lama yang grounded ke dalam penyimpanan bukti jangka pendek yang sama yang sudah digunakan oleh fase deep normal.
- `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak backfill yang telah disiapkan tanpa menyentuh entri diary biasa atau recall jangka pendek aktif.

Control UI menyediakan alur backfill/reset diary yang sama sehingga Anda dapat memeriksa
hasilnya di scene Dreams sebelum memutuskan apakah kandidat grounded
layak dipromosikan. Scene juga menampilkan jalur grounded yang berbeda sehingga Anda dapat melihat
entri jangka pendek yang disiapkan mana yang berasal dari replay historis, item yang dipromosikan
mana yang dipandu grounded, dan hanya menghapus entri yang disiapkan khusus grounded tanpa
menyentuh status jangka pendek aktif biasa.

## Sinyal peringkat deep

Peringkat deep menggunakan enam sinyal dasar berbobot ditambah penguatan fase:

| Signal              | Weight | Description                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Frequency           | 0.24   | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevance           | 0.30   | Kualitas pengambilan rata-rata untuk entri           |
| Query diversity     | 0.15   | Konteks kueri/hari berbeda yang memunculkannya      |
| Recency             | 0.15   | Skor kesegaran dengan peluruhan waktu                      |
| Consolidation       | 0.10   | Kekuatan kemunculan ulang multi-hari                     |
| Conceptual richness | 0.06   | Kepadatan tag konsep dari cuplikan/path             |

Hit fase light dan REM menambahkan peningkatan kecil dengan peluruhan recency dari
`memory/.dreams/phase-signals.json`.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola secara otomatis satu cron job untuk sapuan dreaming
penuh. Setiap sapuan menjalankan fase secara berurutan: light -> REM -> deep.

Perilaku cadence default:

| Setting              | Default     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Mulai cepat

Aktifkan dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Aktifkan dreaming dengan cadence sapuan kustom:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Perintah slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Alur kerja CLI

Gunakan promosi CLI untuk pratinjau atau penerapan manual:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` manual menggunakan ambang fase deep secara default kecuali ditimpa
dengan flag CLI.

Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Pratinjau refleksi REM, candidate truths, dan keluaran promosi deep tanpa
menulis apa pun:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Default utama

Semua pengaturan berada di bawah `plugins.entries.memory-core.config.dreaming`.

| Key         | Default     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Kebijakan fase, ambang batas, dan perilaku penyimpanan adalah detail implementasi internal
(bukan konfigurasi yang ditujukan untuk pengguna).

Lihat [Referensi konfigurasi Memory](/id/reference/memory-config#dreaming-experimental)
untuk daftar kunci lengkap.

## UI Dreams

Saat diaktifkan, tab **Dreams** Gateway menampilkan:

- status dreaming aktif saat ini
- status tingkat fase dan keberadaan sapuan terkelola
- jumlah jangka pendek, grounded, sinyal, dan yang dipromosikan hari ini
- waktu eksekusi terjadwal berikutnya
- jalur Scene grounded yang berbeda untuk entri replay historis yang disiapkan
- pembaca Dream Diary yang dapat diperluas yang didukung oleh `doctor.memory.dreamDiary`

## Terkait

- [Memory](/id/concepts/memory)
- [Memory Search](/id/concepts/memory-search)
- [CLI memory](/cli/memory)
- [Referensi konfigurasi Memory](/id/reference/memory-config)
