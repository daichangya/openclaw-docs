---
read_when:
    - Anda sedang memilih antara PI, Codex, ACP, atau runtime agen native lainnya
    - Anda bingung dengan label penyedia/model/runtime di status atau konfigurasi
    - Anda sedang mendokumentasikan paritas dukungan untuk harness native
summary: Bagaimana OpenClaw memisahkan penyedia model, model, saluran, dan runtime agen
title: runtime agen
x-i18n:
    generated_at: "2026-04-25T13:44:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Sebuah **runtime agen** adalah komponen yang memiliki satu loop model yang sudah disiapkan: runtime ini
menerima prompt, menjalankan output model, menangani panggilan alat native, dan mengembalikan
giliran yang selesai ke OpenClaw.

Runtime mudah tertukar dengan penyedia karena keduanya muncul di dekat konfigurasi
model. Namun, keduanya adalah lapisan yang berbeda:

| Lapisan       | Contoh                                | Artinya                                                             |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Penyedia      | `openai`, `anthropic`, `openai-codex` | Cara OpenClaw melakukan autentikasi, menemukan model, dan menamai referensi model. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Model yang dipilih untuk giliran agen.                              |
| Runtime agen  | `pi`, `codex`, runtime berbasis ACP   | Loop tingkat rendah yang mengeksekusi giliran yang telah disiapkan. |
| Saluran       | Telegram, Discord, Slack, WhatsApp    | Tempat pesan masuk dan keluar dari OpenClaw.                        |

Anda juga akan melihat kata **harness** di kode dan konfigurasi. Harness adalah
implementasi yang menyediakan runtime agen. Misalnya, harness Codex bawaan
mengimplementasikan runtime `codex`. Kunci konfigurasi tetap bernama
`embeddedHarness` demi kompatibilitas, tetapi dokumentasi yang menghadap pengguna dan output status
umumnya sebaiknya menggunakan istilah runtime.

Penyiapan Codex yang umum menggunakan penyedia `openai` dengan runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Artinya OpenClaw memilih referensi model OpenAI, lalu meminta runtime
server aplikasi Codex untuk menjalankan giliran agen tertanam. Ini tidak berarti saluran,
katalog penyedia model, atau penyimpanan sesi OpenClaw berubah menjadi Codex.

Untuk pemisahan prefiks keluarga OpenAI, lihat [OpenAI](/id/providers/openai) dan
[Penyedia model](/id/concepts/model-providers). Untuk kontrak dukungan runtime Codex,
lihat [Codex harness](/id/plugins/codex-harness#v1-support-contract).

## Kepemilikan runtime

Runtime yang berbeda memiliki bagian loop yang berbeda.

| Permukaan                    | Pi embedded OpenClaw                    | Server aplikasi Codex                                                       |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Pemilik loop model          | OpenClaw melalui runner Pi embedded     | Server aplikasi Codex                                                       |
| Status thread kanonis       | Transkrip OpenClaw                      | Thread Codex, ditambah mirror transkrip OpenClaw                            |
| Alat dinamis OpenClaw       | Loop alat native OpenClaw               | Dijembatani melalui adapter Codex                                           |
| Alat shell dan file native  | Jalur Pi/OpenClaw                       | Alat native Codex, dijembatani melalui hook native jika didukung            |
| Mesin konteks               | Perakitan konteks native OpenClaw       | Konteks proyek OpenClaw dirakit ke dalam giliran Codex                      |
| Compaction                  | OpenClaw atau mesin konteks yang dipilih | Compaction native Codex, dengan notifikasi OpenClaw dan pemeliharaan mirror |
| Pengiriman saluran          | OpenClaw                                | OpenClaw                                                                    |

Pemisahan kepemilikan ini adalah aturan desain utama:

- Jika OpenClaw memiliki permukaannya, OpenClaw dapat menyediakan perilaku hook Plugin normal.
- Jika runtime native memiliki permukaannya, OpenClaw memerlukan event runtime atau hook native.
- Jika runtime native memiliki status thread kanonis, OpenClaw harus melakukan mirror dan memproyeksikan konteks, bukan menulis ulang internal yang tidak didukung.

## Pemilihan runtime

OpenClaw memilih runtime tertanam setelah resolusi penyedia dan model:

1. Runtime yang tercatat pada sesi akan diutamakan. Perubahan konfigurasi tidak melakukan hot-switch pada
   transkrip yang sudah ada ke sistem thread native lain.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa runtime tersebut untuk sesi baru atau sesi yang di-reset.
3. `agents.defaults.embeddedHarness.runtime` atau
   `agents.list[].embeddedHarness.runtime` dapat menetapkan `auto`, `pi`, atau id runtime
   terdaftar seperti `codex`.
4. Dalam mode `auto`, runtime Plugin yang terdaftar dapat mengklaim pasangan penyedia/model yang didukung.
5. Jika tidak ada runtime yang mengklaim suatu giliran dalam mode `auto` dan `fallback: "pi"` diatur
   (default), OpenClaw menggunakan Pi sebagai fallback kompatibilitas. Atur
   `fallback: "none"` agar pemilihan mode `auto` yang tidak cocok gagal.

Runtime Plugin eksplisit gagal tertutup secara default. Misalnya,
`runtime: "codex"` berarti Codex atau error pemilihan yang jelas kecuali Anda menetapkan
`fallback: "pi"` dalam cakupan override yang sama. Override runtime tidak mewarisi
pengaturan fallback yang lebih luas, jadi `runtime: "codex"` pada level agen tidak diam-diam
dirutekan kembali ke Pi hanya karena default menggunakan `fallback: "pi"`.

## Kontrak kompatibilitas

Saat runtime bukan Pi, runtime tersebut harus mendokumentasikan permukaan OpenClaw yang didukungnya.
Gunakan bentuk ini untuk dokumentasi runtime:

| Pertanyaan                             | Mengapa ini penting                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Siapa yang memiliki loop model?        | Menentukan di mana retry, kelanjutan alat, dan keputusan jawaban akhir terjadi.                 |
| Siapa yang memiliki riwayat thread kanonis? | Menentukan apakah OpenClaw dapat mengedit riwayat atau hanya melakukan mirror.              |
| Apakah alat dinamis OpenClaw berfungsi? | Pesan, sesi, cron, dan alat milik OpenClaw bergantung pada ini.                               |
| Apakah hook alat dinamis berfungsi?    | Plugin mengharapkan `before_tool_call`, `after_tool_call`, dan middleware di sekitar alat milik OpenClaw. |
| Apakah hook alat native berfungsi?     | Shell, patch, dan alat milik runtime memerlukan dukungan hook native untuk kebijakan dan observasi. |
| Apakah siklus hidup mesin konteks berjalan? | Plugin memori dan konteks bergantung pada siklus hidup perakitan, ingest, setelah giliran, dan Compaction. |
| Data Compaction apa yang diekspos?     | Beberapa Plugin hanya membutuhkan notifikasi, sementara yang lain membutuhkan metadata kept/dropped. |
| Apa yang memang tidak didukung?        | Pengguna tidak boleh mengasumsikan kesetaraan dengan Pi ketika runtime native memiliki lebih banyak status. |

Kontrak dukungan runtime Codex didokumentasikan dalam
[Codex harness](/id/plugins/codex-harness#v1-support-contract).

## Label status

Output status dapat menampilkan label `Execution` dan `Runtime`. Bacalah keduanya sebagai
diagnostik, bukan sebagai nama penyedia.

- Referensi model seperti `openai/gpt-5.5` memberi tahu Anda penyedia/model yang dipilih.
- Id runtime seperti `codex` memberi tahu Anda loop mana yang mengeksekusi giliran.
- Label saluran seperti Telegram atau Discord memberi tahu Anda tempat percakapan berlangsung.

Jika sesi masih menampilkan Pi setelah konfigurasi runtime diubah, mulai sesi baru
dengan `/new` atau hapus sesi saat ini dengan `/reset`. Sesi yang sudah ada mempertahankan runtime
yang tercatat agar transkrip tidak diputar ulang melalui dua sistem sesi native yang tidak kompatibel.

## Terkait

- [Codex harness](/id/plugins/codex-harness)
- [OpenAI](/id/providers/openai)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Loop agen](/id/concepts/agent-loop)
- [Model](/id/concepts/models)
- [Status](/id/cli/status)
