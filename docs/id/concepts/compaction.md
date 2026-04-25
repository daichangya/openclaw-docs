---
read_when:
    - Anda ingin memahami auto-Compaction dan `/compact`
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Bagaimana OpenClaw merangkum percakapan panjang agar tetap berada dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

Setiap model memiliki jendela konteks -- jumlah token maksimum yang dapat diprosesnya.
Saat percakapan mendekati batas itu, OpenClaw melakukan **Compaction** pada pesan-pesan lama
menjadi ringkasan agar chat dapat terus berlanjut.

## Cara kerjanya

1. Giliran percakapan yang lebih lama diringkas menjadi entri compact.
2. Ringkasan disimpan di transkrip sesi.
3. Pesan-pesan terbaru tetap utuh.

Saat OpenClaw membagi riwayat menjadi potongan Compaction, OpenClaw menjaga panggilan tool
assistant tetap berpasangan dengan entri `toolResult` yang cocok. Jika titik pemisah jatuh
di dalam blok tool, OpenClaw memindahkan batasnya agar pasangan tersebut tetap bersama dan
ekor saat ini yang belum diringkas tetap dipertahankan.

Riwayat percakapan lengkap tetap ada di disk. Compaction hanya mengubah apa yang
dilihat model pada giliran berikutnya.

## Auto-Compaction

Auto-Compaction aktif secara default. Ini berjalan saat sesi mendekati batas
konteks, atau saat model mengembalikan error luapan konteks (dalam hal ini
OpenClaw melakukan Compaction dan mencoba ulang). Tanda luapan yang umum mencakup
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, dan `ollama error: context length
exceeded`.

<Info>
Sebelum melakukan Compaction, OpenClaw secara otomatis mengingatkan agen untuk menyimpan catatan penting
ke file [memory](/id/concepts/memory). Ini mencegah hilangnya konteks.
</Info>

Gunakan pengaturan `agents.defaults.compaction` di `openclaw.json` Anda untuk mengonfigurasi perilaku Compaction (mode, token target, dll.).
Peringkasan Compaction secara default mempertahankan identifier opak (`identifierPolicy: "strict"`). Anda dapat menimpanya dengan `identifierPolicy: "off"` atau memberikan teks kustom dengan `identifierPolicy: "custom"` dan `identifierInstructions`.

Anda dapat secara opsional menentukan model yang berbeda untuk peringkasan Compaction melalui `agents.defaults.compaction.model`. Ini berguna saat model utama Anda adalah model lokal atau kecil dan Anda ingin ringkasan Compaction dihasilkan oleh model yang lebih mampu. Override menerima string `provider/model-id` apa pun:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Ini juga berfungsi dengan model lokal, misalnya model Ollama kedua yang didedikasikan untuk peringkasan atau spesialis Compaction yang di-fine-tune:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Jika tidak diatur, Compaction menggunakan model utama agen.

## Provider Compaction yang dapat dipasang

Plugin dapat mendaftarkan provider Compaction kustom melalui `registerCompactionProvider()` pada API plugin. Saat provider terdaftar dan dikonfigurasi, OpenClaw mendelegasikan peringkasan kepadanya alih-alih ke pipeline LLM bawaan.

Untuk menggunakan provider yang terdaftar, atur id provider di config Anda:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Mengatur `provider` secara otomatis memaksa `mode: "safeguard"`. Provider menerima instruksi Compaction dan kebijakan pelestarian identifier yang sama seperti jalur bawaan, dan OpenClaw tetap mempertahankan konteks sufiks giliran terbaru dan giliran terpisah setelah output provider. Jika provider gagal atau mengembalikan hasil kosong, OpenClaw fallback ke peringkasan LLM bawaan.

## Auto-Compaction (aktif secara default)

Saat sesi mendekati atau melampaui jendela konteks model, OpenClaw memicu auto-Compaction dan dapat mencoba ulang permintaan asli menggunakan konteks yang sudah di-compact.

Anda akan melihat:

- `🧹 Auto-compaction complete` dalam mode verbose
- `/status` menampilkan `🧹 Compactions: <count>`

Sebelum Compaction, OpenClaw dapat menjalankan giliran **memory flush** senyap untuk menyimpan
catatan tahan lama ke disk. Lihat [Memory](/id/concepts/memory) untuk detail dan config.

## Compaction manual

Ketik `/compact` di chat mana pun untuk memaksa Compaction. Tambahkan instruksi untuk memandu
ringkasan:

```
/compact Focus on the API design decisions
```

Saat `agents.defaults.compaction.keepRecentTokens` diatur, Compaction manual
menghormati titik potong Pi tersebut dan mempertahankan ekor terbaru dalam konteks yang dibangun ulang. Tanpa
anggaran keep yang eksplisit, Compaction manual berperilaku sebagai checkpoint keras dan
melanjutkan hanya dari ringkasan baru.

## Menggunakan model yang berbeda

Secara default, Compaction menggunakan model utama agen Anda. Anda dapat menggunakan model yang lebih
mampu untuk ringkasan yang lebih baik:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Pemberitahuan Compaction

Secara default, Compaction berjalan secara senyap. Untuk menampilkan pemberitahuan singkat saat Compaction
dimulai dan saat selesai, aktifkan `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Saat diaktifkan, pengguna melihat pesan status singkat di sekitar setiap proses Compaction
(misalnya, "Compacting context..." dan "Compaction complete").

## Compaction vs pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Apa yang dilakukan** | Merangkum percakapan lama | Memangkas hasil tool lama        |
| **Disimpan?**    | Ya (di transkrip sesi)        | Tidak (hanya di memori, per permintaan) |
| **Cakupan**      | Seluruh percakapan            | Hanya hasil tool                 |

[Session pruning](/id/concepts/session-pruning) adalah pelengkap yang lebih ringan yang
memangkas output tool tanpa merangkum.

## Pemecahan masalah

**Terlalu sering melakukan Compaction?** Jendela konteks model mungkin kecil, atau output tool
mungkin besar. Coba aktifkan
[session pruning](/id/concepts/session-pruning).

**Konteks terasa usang setelah Compaction?** Gunakan `/compact Focus on <topic>` untuk
memandu ringkasan, atau aktifkan [memory flush](/id/concepts/memory) agar catatan
tetap tersimpan.

**Butuh awal yang bersih?** `/new` memulai sesi baru tanpa melakukan Compaction.

Untuk konfigurasi lanjutan (reserve token, pelestarian identifier, engine
konteks kustom, Compaction sisi server OpenAI), lihat
[Pendalaman Manajemen Sesi](/id/reference/session-management-compaction).

## Terkait

- [Sesi](/id/concepts/session) — manajemen dan siklus hidup sesi
- [Session Pruning](/id/concepts/session-pruning) — memangkas hasil tool
- [Konteks](/id/concepts/context) — bagaimana konteks dibangun untuk giliran agen
- [Hooks](/id/automation/hooks) — hook siklus hidup Compaction (`before_compaction`, `after_compaction`)
