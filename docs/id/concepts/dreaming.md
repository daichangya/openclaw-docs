---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami apa yang dilakukan setiap fase Dreaming
    - Anda ingin menyetel konsolidasi tanpa mengotori MEMORY.md
summary: Konsolidasi memori latar belakang dengan fase ringan, dalam, dan REM serta Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T09:20:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming adalah sistem konsolidasi memori latar belakang di `memory-core`.
Sistem ini membantu OpenClaw memindahkan sinyal jangka pendek yang kuat ke memori tahan lama sambil menjaga prosesnya tetap dapat dijelaskan dan ditinjau.

Dreaming bersifat **opt-in** dan dinonaktifkan secara default.

## Apa yang ditulis oleh dreaming

Dreaming menyimpan dua jenis output:

- **Status mesin** di `memory/.dreams/` (recall store, sinyal fase, checkpoint ingestion, lock).
- **Output yang dapat dibaca manusia** di `DREAMS.md` (atau `dreams.md` yang sudah ada) dan file laporan fase opsional di bawah `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Promosi jangka panjang tetap hanya menulis ke `MEMORY.md`.

## Model fase

Dreaming menggunakan tiga fase kooperatif:

| Fase | Tujuan                                  | Penulisan tahan lama |
| ----- | --------------------------------------- | -------------------- |
| Light | Mengurutkan dan menyiapkan materi jangka pendek terbaru | Tidak |
| Deep  | Menilai dan mempromosikan kandidat tahan lama | Ya (`MEMORY.md`) |
| REM   | Merefleksikan tema dan ide berulang     | Tidak                |

Fase-fase ini adalah detail implementasi internal, bukan "mode" terpisah yang dikonfigurasi pengguna.

### Fase Light

Fase Light mengingest sinyal memori harian terbaru dan jejak recall, menghapus duplikasi, lalu menyiapkan baris kandidat.

- Membaca dari status recall jangka pendek, file memori harian terbaru, dan transkrip sesi yang telah disunting bila tersedia.
- Menulis blok `## Light Sleep` yang dikelola saat penyimpanan mencakup output inline.
- Mencatat sinyal penguatan untuk pemeringkatan deep berikutnya.
- Tidak pernah menulis ke `MEMORY.md`.

### Fase Deep

Fase Deep menentukan apa yang menjadi memori jangka panjang.

- Memberi peringkat pada kandidat menggunakan penilaian berbobot dan ambang batas.
- Mengharuskan `minScore`, `minRecallCount`, dan `minUniqueQueries` untuk lolos.
- Menghidrasi ulang snippet dari file harian live sebelum menulis, sehingga snippet yang basi/dihapus dilewati.
- Menambahkan entri yang dipromosikan ke `MEMORY.md`.
- Menulis ringkasan `## Deep Sleep` ke `DREAMS.md` dan secara opsional menulis `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

Fase REM mengekstrak pola dan sinyal reflektif.

- Membangun ringkasan tema dan refleksi dari jejak jangka pendek terbaru.
- Menulis blok `## REM Sleep` yang dikelola saat penyimpanan mencakup output inline.
- Mencatat sinyal penguatan REM yang digunakan oleh pemeringkatan deep.
- Tidak pernah menulis ke `MEMORY.md`.

## Ingestion transkrip sesi

Dreaming dapat mengingest transkrip sesi yang telah disunting ke dalam korpus dreaming. Saat transkrip tersedia, transkrip tersebut dimasukkan ke fase light bersama sinyal memori harian dan jejak recall. Konten pribadi dan sensitif disunting sebelum ingestion.

## Dream Diary

Dreaming juga menyimpan **Dream Diary** naratif di `DREAMS.md`.
Setelah setiap fase memiliki materi yang cukup, `memory-core` menjalankan giliran subagen latar belakang secara best-effort (menggunakan model runtime default) dan menambahkan entri diary singkat.

Diary ini untuk dibaca manusia di UI Dreams, bukan sebagai sumber promosi.
Artefak diary/laporan yang dihasilkan dreaming dikecualikan dari
promosi jangka pendek. Hanya snippet memori yang berlandaskan bukti yang
layak dipromosikan ke `MEMORY.md`.

Ada juga jalur backfill historis yang berlandaskan bukti untuk pekerjaan tinjauan dan pemulihan:

- `memory rem-harness --path ... --grounded` mempratinjau output diary berlandaskan bukti dari catatan historis `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` menulis entri diary berlandaskan bukti yang dapat dibalik ke `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` menyiapkan kandidat tahan lama berlandaskan bukti ke penyimpanan bukti jangka pendek yang sama yang sudah digunakan fase deep normal.
- `memory rem-backfill --rollback` dan `--rollback-short-term` menghapus artefak backfill yang telah disiapkan tersebut tanpa menyentuh entri diary biasa atau recall jangka pendek live.

UI Control mengekspos alur backfill/reset diary yang sama sehingga Anda dapat memeriksa hasilnya di scene Dreams sebelum memutuskan apakah kandidat berlandaskan bukti tersebut layak dipromosikan. Scene juga menampilkan jalur grounded yang berbeda sehingga Anda dapat melihat entri jangka pendek yang disiapkan yang berasal dari pemutaran ulang historis, item yang dipromosikan yang dipimpin grounded, dan menghapus hanya entri yang disiapkan khusus grounded tanpa menyentuh status jangka pendek live biasa.

## Sinyal pemeringkatan Deep

Pemeringkatan deep menggunakan enam sinyal dasar berbobot ditambah penguatan fase:

| Sinyal             | Bobot | Deskripsi                                         |
| ------------------ | ----- | ------------------------------------------------- |
| Frekuensi          | 0.24  | Berapa banyak sinyal jangka pendek yang dikumpulkan entri |
| Relevansi          | 0.30  | Kualitas retrieval rata-rata untuk entri tersebut |
| Keragaman kueri    | 0.15  | Konteks kueri/hari berbeda yang memunculkannya    |
| Keterkinian        | 0.15  | Skor kesegaran dengan peluruhan waktu             |
| Konsolidasi        | 0.10  | Kekuatan kemunculan berulang lintas hari          |
| Kekayaan konseptual | 0.06 | Kepadatan concept-tag dari snippet/path           |

Hit fase Light dan REM menambahkan peningkatan kecil dengan peluruhan keterkinian dari
`memory/.dreams/phase-signals.json`.

## Penjadwalan

Saat diaktifkan, `memory-core` mengelola secara otomatis satu pekerjaan cron untuk sweep dreaming penuh. Setiap sweep menjalankan fase secara berurutan: light -> REM -> deep.

Perilaku cadence default:

| Pengaturan            | Default     |
| --------------------- | ----------- |
| `dreaming.frequency`  | `0 3 * * *` |

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

Aktifkan dreaming dengan cadence sweep kustom:

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

## Slash command

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

`memory promote` manual menggunakan ambang fase deep secara default kecuali dioverride dengan flag CLI.

Jelaskan mengapa kandidat tertentu akan atau tidak akan dipromosikan:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Pratinjau refleksi REM, kebenaran kandidat, dan output promosi deep tanpa menulis apa pun:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Default utama

Semua pengaturan berada di bawah `plugins.entries.memory-core.config.dreaming`.

| Kunci      | Default     |
| ---------- | ----------- |
| `enabled`  | `false`     |
| `frequency`| `0 3 * * *` |

Kebijakan fase, ambang batas, dan perilaku penyimpanan adalah detail implementasi internal (bukan config yang ditujukan untuk pengguna).

Lihat [Referensi konfigurasi Memory](/id/reference/memory-config#dreaming)
untuk daftar lengkap kunci.

## UI Dreams

Saat diaktifkan, tab **Dreams** pada Gateway menampilkan:

- status dreaming aktif saat ini
- status tingkat fase dan keberadaan sweep terkelola
- jumlah jangka pendek, grounded, sinyal, dan yang dipromosikan hari ini
- waktu eksekusi terjadwal berikutnya
- jalur Scene grounded terpisah untuk entri replay historis yang disiapkan
- pembaca Dream Diary yang dapat diperluas yang didukung oleh `doctor.memory.dreamDiary`

## Pemecahan masalah

### Dreaming tidak pernah berjalan (status menunjukkan blocked)

Cron dreaming terkelola menumpang pada heartbeat agen default. Jika heartbeat tidak berjalan untuk agen tersebut, cron akan mengantrikan peristiwa sistem yang tidak dikonsumsi siapa pun dan dreaming diam-diam tidak berjalan. Baik `openclaw memory status` maupun `/dreaming status` akan melaporkan `blocked` dalam kasus tersebut dan menyebutkan agen yang heartbeat-nya menjadi penghambat.

Dua penyebab umum:

- Agen lain mendeklarasikan blok `heartbeat:` eksplisit. Saat entri mana pun di `agents.list` memiliki blok `heartbeat` sendiri, hanya agen-agen tersebut yang heartbeat — default tidak lagi berlaku untuk semua agen lain, sehingga agen default bisa menjadi diam. Pindahkan pengaturan heartbeat ke `agents.defaults.heartbeat`, atau tambahkan blok `heartbeat` eksplisit pada agen default. Lihat [Cakupan dan prioritas](/id/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` bernilai `0`, kosong, atau tidak dapat diurai. Cron tidak memiliki interval untuk dijadwalkan, sehingga heartbeat secara efektif dinonaktifkan. Atur `every` ke durasi positif seperti `30m`. Lihat [Default](/id/gateway/heartbeat#defaults).

## Terkait

- [Heartbeat](/id/gateway/heartbeat)
- [Memory](/id/concepts/memory)
- [Pencarian Memory](/id/concepts/memory-search)
- [CLI memory](/id/cli/memory)
- [Referensi konfigurasi Memory](/id/reference/memory-config)
