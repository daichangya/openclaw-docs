---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami apa yang dilakukan setiap fase Dreaming
    - Anda ingin menyesuaikan konsolidasi tanpa mengotori `MEMORY.md`
summary: Konsolidasi memori latar belakang dengan fase ringan, dalam, dan REM serta Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`.
Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori tahan lama sambil
menjaga prosesnya tetap dapat dijelaskan dan ditinjau.

Dreaming bersifat **opt-in** dan dinonaktifkan secara default.

## Apa yang ditulis oleh Dreaming

Dreaming menyimpan dua jenis output:

- **Status mesin** di `memory/.dreams/` (recall store, sinyal fase, checkpoint ingestion, lock).
- **Output yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menggunakan tiga fase kooperatif:

| Phase | Tujuan                                    | Penulisan tahan lama |
| ----- | ----------------------------------------- | -------------------- |
| Light | Menyortir dan menyiapkan materi jangka pendek terbaru | Tidak |
| Deep  | Menilai dan mempromosikan kandidat yang tahan lama | Ya (`MEMORY.md`) |
| REM   | Merefleksikan tema dan ide yang berulang  | Tidak |

Fase-fase ini adalah detail implementasi internal, bukan "mode"
terpisah yang dikonfigurasi pengguna.

### Fase Light

Fase Light mengingest sinyal memori harian terbaru dan jejak recall, menghapus duplikasi,
dan menyiapkan baris kandidat.

- Membaca dari status recall jangka pendek, file memori harian terbaru, dan transkrip sesi yang sudah disunting bila tersedia.
- Menulis blok `## Light Sleep` yang dikelola saat penyimpanan menyertakan output inline.
- Mencatat sinyal reinforcement untuk peringkat deep nanti.
- Tidak pernah menulis ke `MEMORY.md`.

### Fase Deep

Fase Deep menentukan apa yang menjadi memori jangka panjang.

- Memberi peringkat kandidat menggunakan penilaian berbobot dan threshold gate.
- Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` untuk lolos.
- Merehidrasi snippet dari file harian live sebelum menulis, sehingga snippet yang basi/dihapus dilewati.
- Menambahkan entri yang dipromosikan ke `MEMORY.md`.
- Menulis ringkasan `## Deep Sleep` ke dalam `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

Fase REM mengekstrak pola dan sinyal reflektif.

- Membangun ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
- Menulis blok `## REM Sleep` yang dikelola saat penyimpanan menyertakan output inline.
- Mencatat sinyal reinforcement REM yang digunakan oleh peringkat deep.
- Tidak pernah menulis ke `MEMORY.md`.

## Ingestion transkrip sesi

Dreaming dapat mengingest transkrip sesi yang sudah disunting ke dalam korpus dreaming. Saat
transkrip tersedia, transkrip tersebut dimasukkan ke fase light bersama
sinyal memori harian dan jejak recall. Konten pribadi dan sensitif disunting
sebelum ingestion.

## Dream Diary

Dreaming juga menyimpan **Dream Diary** naratif di `DREAMS.md`.
Setelah setiap fase memiliki materi yang cukup, `memory-core` menjalankan turn subagen latar belakang
best-effort (menggunakan model runtime default) dan menambahkan entri diary singkat.

Diary ini untuk dibaca manusia di Dreams UI, bukan sumber promosi.
Artefak diary/laporan yang dihasilkan Dreaming dikecualikan dari promosi
jangka pendek. Hanya snippet memori yang berlandaskan data yang memenuhi syarat untuk dipromosikan ke
`MEMORY.md`.

Ada juga jalur backfill historis berlandaskan data untuk pekerjaan peninjauan dan pemulihan:

- `memory rem-harness --path ... --grounded` mempratinjau output diary berlandaskan data dari catatan historis `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` menulis entri diary berlandaskan data yang dapat dibalik ke dalam `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` menyiapkan kandidat tahan lama berlandaskan data ke evidence store jangka pendek yang sama yang sudah digunakan oleh fase deep normal.
- `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak backfill yang disiapkan itu tanpa menyentuh entri diary biasa atau recall jangka pendek live.

UI Control menampilkan alur backfill/reset diary yang sama sehingga Anda dapat memeriksa
hasil di scene Dreams sebelum memutuskan apakah kandidat berlandaskan data itu
layak dipromosikan. Scene juga menampilkan jalur grounded yang terpisah sehingga Anda dapat melihat
entri jangka pendek yang disiapkan mana yang berasal dari replay historis, item yang dipromosikan
mana yang dipandu grounded, dan menghapus hanya entri yang disiapkan khusus grounded tanpa
menyentuh status jangka pendek live biasa.

## Sinyal peringkat Deep

Peringkat deep menggunakan enam sinyal dasar berbobot ditambah reinforcement fase:

| Signal              | Bobot | Deskripsi                                       |
| ------------------- | ----- | ----------------------------------------------- |
| Frequency           | 0.24  | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevance           | 0.30  | Kualitas retrieval rata-rata untuk entri        |
| Query diversity     | 0.15  | Konteks query/hari berbeda yang memunculkannya  |
| Recency             | 0.15  | Skor kesegaran yang menurun seiring waktu       |
| Consolidation       | 0.10  | Kekuatan kemunculan ulang lintas hari           |
| Conceptual richness | 0.06  | Kepadatan tag konsep dari snippet/path          |

Hit fase Light dan REM menambahkan sedikit boost yang menurun seiring waktu dari
`memory/.dreams/phase-signals.json`.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola secara otomatis satu pekerjaan Cron untuk satu sapuan dreaming penuh. Setiap sapuan menjalankan fase secara berurutan: light -> REM -> deep.

Perilaku cadence default:

| Setting              | Default     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Memulai cepat

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

`memory promote` manual menggunakan threshold fase deep secara default kecuali dioverride
dengan flag CLI.

Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Pratinjau refleksi REM, kebenaran kandidat, dan output promosi deep tanpa
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

Kebijakan fase, threshold, dan perilaku penyimpanan adalah detail implementasi
internal (bukan config yang dihadapkan ke pengguna).

Lihat [Referensi konfigurasi Memory](/id/reference/memory-config#dreaming)
untuk daftar key lengkap.

## Dreams UI

Saat diaktifkan, tab **Dreams** pada Gateway menampilkan:

- status aktif dreaming saat ini
- status tingkat fase dan keberadaan managed-sweep
- jumlah jangka pendek, grounded, sinyal, dan yang dipromosikan hari ini
- waktu eksekusi terjadwal berikutnya
- jalur Scene grounded yang terpisah untuk entri replay historis yang disiapkan
- pembaca Dream Diary yang dapat diperluas yang didukung oleh `doctor.memory.dreamDiary`

## Pemecahan masalah

### Dreaming tidak pernah berjalan (status menunjukkan blocked)

Cron dreaming terkelola menggunakan Heartbeat agen default. Jika Heartbeat tidak berjalan untuk agen tersebut, Cron akan memasukkan event sistem yang tidak dikonsumsi siapa pun dan dreaming diam-diam tidak berjalan. Baik `openclaw memory status` maupun `/dreaming status` akan melaporkan `blocked` dalam kasus itu dan menyebutkan agen yang Heartbeat-nya menjadi penghambat.

Dua penyebab umum:

- Agen lain mendeklarasikan blok `heartbeat:` eksplisit. Saat entri apa pun dalam `agents.list` memiliki blok `heartbeat` sendiri, hanya agen-agen itu yang mendapat Heartbeat — default tidak lagi berlaku untuk semua agen lain, sehingga agen default bisa menjadi diam. Pindahkan pengaturan Heartbeat ke `agents.defaults.heartbeat`, atau tambahkan blok `heartbeat` eksplisit pada agen default. Lihat [Cakupan dan prioritas](/id/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` bernilai `0`, kosong, atau tidak dapat diurai. Cron tidak memiliki interval untuk dijadwalkan, sehingga Heartbeat secara efektif dinonaktifkan. Atur `every` ke durasi positif seperti `30m`. Lihat [Default](/id/gateway/heartbeat#defaults).

## Terkait

- [Heartbeat](/id/gateway/heartbeat)
- [Memory](/id/concepts/memory)
- [Memory Search](/id/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Referensi konfigurasi Memory](/id/reference/memory-config)
