---
read_when:
    - Anda ingin memahami bagaimana TaskFlow berhubungan dengan tugas latar belakang
    - Anda menemukan Task Flow atau alur tugas openclaw di catatan rilis atau dokumentasi
    - Anda ingin memeriksa atau mengelola status alur yang persisten
summary: lapisan orkestrasi alur Task Flow di atas tugas latar belakang
title: TaskFlow
x-i18n:
    generated_at: "2026-04-25T13:41:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlow adalah substrat orkestrasi alur yang berada di atas [tugas latar belakang](/id/automation/tasks). Ini mengelola alur multilangkah yang persisten dengan statusnya sendiri, pelacakan revisi, dan semantik sinkronisasi, sementara masing-masing tugas tetap menjadi unit kerja terlepas.

## Kapan menggunakan TaskFlow

Gunakan TaskFlow ketika pekerjaan mencakup beberapa langkah berurutan atau bercabang dan Anda memerlukan pelacakan progres yang persisten di seluruh restart gateway. Untuk operasi latar belakang tunggal, [tugas](/id/automation/tasks) biasa sudah cukup.

| Skenario                              | Gunakan                |
| ------------------------------------- | ---------------------- |
| Pekerjaan latar belakang tunggal      | Tugas biasa            |
| Pipeline multilangkah (A lalu B lalu C) | TaskFlow (dikelola)    |
| Mengamati tugas yang dibuat secara eksternal | TaskFlow (dicerminkan) |
| Pengingat sekali jalan                | Pekerjaan Cron         |

## Pola alur kerja terjadwal yang andal

Untuk alur kerja berulang seperti briefing intelijen pasar, perlakukan penjadwalan, orkestrasi, dan pemeriksaan keandalan sebagai lapisan yang terpisah:

1. Gunakan [Scheduled Tasks](/id/automation/cron-jobs) untuk pengaturan waktu.
2. Gunakan sesi cron persisten ketika alur kerja harus dibangun di atas konteks sebelumnya.
3. Gunakan [Lobster](/id/tools/lobster) untuk langkah-langkah deterministik, gerbang persetujuan, dan token lanjutkan.
4. Gunakan TaskFlow untuk melacak proses multilangkah di seluruh tugas turunan, penantian, percobaan ulang, dan restart gateway.

Contoh bentuk cron:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Gunakan `session:<id>` alih-alih `isolated` ketika alur kerja berulang memerlukan riwayat yang disengaja, ringkasan proses sebelumnya, atau konteks tetap. Gunakan `isolated` ketika setiap proses harus dimulai dari awal dan semua status yang diperlukan dinyatakan secara eksplisit dalam alur kerja.

Di dalam alur kerja, letakkan pemeriksaan keandalan sebelum langkah ringkasan LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Pemeriksaan pra-penerbangan yang direkomendasikan:

- Ketersediaan browser dan pilihan profil, misalnya `openclaw` untuk status yang dikelola atau `user` ketika sesi Chrome yang sudah masuk diperlukan. Lihat [Browser](/id/tools/browser).
- Kredensial API dan kuota untuk setiap sumber.
- Keterjangkauan jaringan untuk endpoint yang diperlukan.
- Alat yang diperlukan diaktifkan untuk agen, seperti `lobster`, `browser`, dan `llm-task`.
- Tujuan kegagalan dikonfigurasi untuk cron agar kegagalan pra-penerbangan terlihat. Lihat [Scheduled Tasks](/id/automation/cron-jobs#delivery-and-output).

Kolom provenance data yang direkomendasikan untuk setiap item yang dikumpulkan:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Mintalah alur kerja menolak atau menandai item usang sebelum peringkasan. Langkah LLM hanya boleh menerima JSON terstruktur dan harus diminta untuk mempertahankan `sourceUrl`, `retrievedAt`, dan `asOf` dalam outputnya. Gunakan [LLM Task](/id/tools/llm-task) ketika Anda memerlukan langkah model yang divalidasi skema di dalam alur kerja.

Untuk alur kerja tim atau komunitas yang dapat digunakan kembali, kemas CLI, file `.lobster`, dan catatan penyiapan apa pun sebagai skill atau plugin lalu publikasikan melalui [ClawHub](/id/tools/clawhub). Simpan guardrail khusus alur kerja di dalam paket tersebut kecuali API plugin tidak memiliki kemampuan generik yang diperlukan.

## Mode sinkronisasi

### Mode dikelola

TaskFlow memiliki siklus hidup secara menyeluruh. Ini membuat tugas sebagai langkah alur, mendorongnya hingga selesai, dan memajukan status alur secara otomatis.

Contoh: alur laporan mingguan yang (1) mengumpulkan data, (2) menghasilkan laporan, dan (3) mengirimkannya. TaskFlow membuat setiap langkah sebagai tugas latar belakang, menunggu penyelesaiannya, lalu berpindah ke langkah berikutnya.

```
Alur: weekly-report
  Langkah 1: gather-data     → tugas dibuat → berhasil
  Langkah 2: generate-report → tugas dibuat → berhasil
  Langkah 3: deliver         → tugas dibuat → berjalan
```

### Mode dicerminkan

TaskFlow mengamati tugas yang dibuat secara eksternal dan menjaga status alur tetap sinkron tanpa mengambil alih pembuatan tugas. Ini berguna ketika tugas berasal dari pekerjaan cron, perintah CLI, atau sumber lain dan Anda menginginkan tampilan terpadu atas progresnya sebagai sebuah alur.

Contoh: tiga pekerjaan cron independen yang bersama-sama membentuk rutinitas "operasi pagi". Alur yang dicerminkan melacak progres kolektifnya tanpa mengendalikan kapan atau bagaimana mereka berjalan.

## Status persisten dan pelacakan revisi

Setiap alur mempertahankan statusnya sendiri dan melacak revisi agar progres tetap bertahan melewati restart gateway. Pelacakan revisi memungkinkan deteksi konflik ketika beberapa sumber mencoba memajukan alur yang sama secara bersamaan.

## Perilaku pembatalan

`openclaw tasks flow cancel` menetapkan niat pembatalan yang melekat pada alur. Tugas aktif di dalam alur dibatalkan, dan tidak ada langkah baru yang dimulai. Niat pembatalan tetap bertahan setelah restart, sehingga alur yang dibatalkan tetap dibatalkan meskipun gateway restart sebelum semua tugas turunan berhenti.

## Perintah CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Perintah                           | Deskripsi                                       |
| ---------------------------------- | ----------------------------------------------- |
| `openclaw tasks flow list`         | Menampilkan alur yang dilacak dengan status dan mode sinkronisasi |
| `openclaw tasks flow show <id>`    | Periksa satu alur berdasarkan id alur atau kunci pencarian |
| `openclaw tasks flow cancel <id>`  | Batalkan alur yang sedang berjalan dan tugas aktifnya |

## Bagaimana alur berhubungan dengan tugas

Alur mengoordinasikan tugas, bukan menggantikannya. Satu alur dapat menggerakkan beberapa tugas latar belakang selama masa hidupnya. Gunakan `openclaw tasks` untuk memeriksa catatan tugas individual dan `openclaw tasks flow` untuk memeriksa alur orkestrasi.

## Terkait

- [Background Tasks](/id/automation/tasks) — ledger pekerjaan terlepas yang dikoordinasikan oleh alur
- [CLI: tasks](/id/cli/tasks) — referensi perintah CLI untuk `openclaw tasks flow`
- [Automation Overview](/id/automation) — semua mekanisme otomatisasi secara ringkas
- [Cron Jobs](/id/automation/cron-jobs) — pekerjaan terjadwal yang dapat menjadi masukan ke alur
