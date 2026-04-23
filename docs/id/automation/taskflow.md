---
read_when:
    - Anda ingin memahami bagaimana Alur Tugas berhubungan dengan tugas latar belakang
    - Anda menemukan Task Flow atau alur tugas openclaw di catatan rilis atau dokumentasi
    - Anda ingin memeriksa atau mengelola status alur yang tahan lama
summary: Lapisan orkestrasi alur Alur Tugas di atas tugas latar belakang
title: Alur Tugas
x-i18n:
    generated_at: "2026-04-23T09:16:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# Alur Tugas

Alur Tugas adalah substrat orkestrasi alur yang berada di atas [tugas latar belakang](/id/automation/tasks). Ini mengelola alur multi-langkah yang tahan lama dengan status, pelacakan revisi, dan semantik sinkronisasinya sendiri, sementara tugas individual tetap menjadi unit kerja yang terlepas.

## Kapan menggunakan Alur Tugas

Gunakan Alur Tugas ketika pekerjaan mencakup beberapa langkah berurutan atau bercabang dan Anda memerlukan pelacakan progres yang tahan lama di seluruh restart Gateway. Untuk operasi latar belakang tunggal, [tugas](/id/automation/tasks) biasa sudah cukup.

| Skenario                              | Gunakan              |
| ------------------------------------- | -------------------- |
| Satu pekerjaan latar belakang         | Tugas biasa          |
| Pipeline multi-langkah (A lalu B lalu C) | Alur Tugas (dikelola)  |
| Mengamati tugas yang dibuat secara eksternal | Alur Tugas (dicerminkan) |
| Pengingat sekali pakai                | Pekerjaan Cron       |

## Mode sinkronisasi

### Mode dikelola

Alur Tugas memiliki siklus hidup secara menyeluruh dari awal hingga akhir. Ini membuat tugas sebagai langkah alur, mendorongnya hingga selesai, dan memajukan status alur secara otomatis.

Contoh: alur laporan mingguan yang (1) mengumpulkan data, (2) menghasilkan laporan, dan (3) mengirimkannya. Alur Tugas membuat setiap langkah sebagai tugas latar belakang, menunggu hingga selesai, lalu berpindah ke langkah berikutnya.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mode dicerminkan

Alur Tugas mengamati tugas yang dibuat secara eksternal dan menjaga status alur tetap sinkron tanpa mengambil alih pembuatan tugas. Ini berguna ketika tugas berasal dari pekerjaan Cron, perintah CLI, atau sumber lain dan Anda menginginkan tampilan terpadu atas progresnya sebagai sebuah alur.

Contoh: tiga pekerjaan Cron independen yang bersama-sama membentuk rutinitas "operasi pagi". Alur yang dicerminkan melacak progres kolektifnya tanpa mengendalikan kapan atau bagaimana mereka berjalan.

## Status tahan lama dan pelacakan revisi

Setiap alur mempertahankan statusnya sendiri dan melacak revisi sehingga progres tetap bertahan saat Gateway direstart. Pelacakan revisi memungkinkan deteksi konflik ketika beberapa sumber mencoba memajukan alur yang sama secara bersamaan.

## Perilaku pembatalan

`openclaw tasks flow cancel` menetapkan niat pembatalan lekat pada alur. Tugas aktif di dalam alur dibatalkan, dan tidak ada langkah baru yang dimulai. Niat pembatalan tetap bertahan setelah restart, sehingga alur yang dibatalkan tetap dibatalkan bahkan jika Gateway direstart sebelum semua tugas anak berhenti.

## Perintah CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Perintah                         | Deskripsi                                     |
| -------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Menampilkan alur yang dilacak beserta status dan mode sinkronisasi |
| `openclaw tasks flow show <id>`   | Memeriksa satu alur berdasarkan id alur atau kunci lookup |
| `openclaw tasks flow cancel <id>` | Membatalkan alur yang sedang berjalan dan tugas aktifnya |

## Bagaimana alur berhubungan dengan tugas

Alur mengoordinasikan tugas, bukan menggantikannya. Satu alur dapat menjalankan beberapa tugas latar belakang selama masa hidupnya. Gunakan `openclaw tasks` untuk memeriksa catatan tugas individual dan `openclaw tasks flow` untuk memeriksa alur orkestrasi.

## Terkait

- [Tugas Latar Belakang](/id/automation/tasks) — ledger kerja terlepas yang dikoordinasikan oleh alur
- [CLI: tasks](/id/cli/tasks) — referensi perintah CLI untuk `openclaw tasks flow`
- [Ringkasan Automation](/id/automation) — semua mekanisme otomasi secara sekilas
- [Pekerjaan Cron](/id/automation/cron-jobs) — pekerjaan terjadwal yang dapat menjadi masukan ke alur
