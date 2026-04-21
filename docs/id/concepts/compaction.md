---
read_when:
    - Anda ingin memahami Compaction otomatis dan `/compact`
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Cara OpenClaw merangkum percakapan panjang agar tetap berada dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-04-21T09:17:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Setiap model memiliki jendela konteks -- jumlah token maksimum yang dapat diprosesnya.
Ketika percakapan mendekati batas itu, OpenClaw akan **melakukan Compaction** pada pesan-pesan lama
menjadi sebuah ringkasan agar chat dapat terus berlanjut.

## Cara kerjanya

1. Giliran percakapan yang lebih lama diringkas menjadi entri compact.
2. Ringkasan disimpan dalam transkrip sesi.
3. Pesan-pesan terbaru tetap dipertahankan utuh.

Saat OpenClaw membagi riwayat menjadi chunk Compaction, OpenClaw menjaga agar tool
call asisten tetap dipasangkan dengan entri `toolResult` yang sesuai. Jika titik
pemisahan jatuh di dalam blok tool, OpenClaw memindahkan batasnya agar pasangan itu tetap bersama dan
bagian akhir saat ini yang belum diringkas tetap dipertahankan.

Seluruh riwayat percakapan tetap tersimpan di disk. Compaction hanya mengubah apa yang
dilihat model pada giliran berikutnya.

## Compaction otomatis

Compaction otomatis aktif secara bawaan. Ini berjalan saat sesi mendekati batas
konteks, atau saat model mengembalikan error context-overflow (dalam hal ini
OpenClaw melakukan Compaction dan mencoba ulang). Tanda overflow yang umum meliputi
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, dan `ollama error: context length
exceeded`.

<Info>
Sebelum melakukan Compaction, OpenClaw secara otomatis mengingatkan agen untuk menyimpan
catatan penting ke file [memory](/id/concepts/memory). Ini mencegah kehilangan konteks.
</Info>

Gunakan pengaturan `agents.defaults.compaction` dalam `openclaw.json` Anda untuk mengonfigurasi perilaku Compaction (mode, token target, dll.).
Ringkasan Compaction mempertahankan identifier opak secara bawaan (`identifierPolicy: "strict"`). Anda dapat menggantinya dengan `identifierPolicy: "off"` atau memberikan teks kustom dengan `identifierPolicy: "custom"` dan `identifierInstructions`.

Anda dapat secara opsional menentukan model berbeda untuk ringkasan Compaction melalui `agents.defaults.compaction.model`. Ini berguna saat model utama Anda adalah model lokal atau kecil dan Anda ingin ringkasan Compaction dihasilkan oleh model yang lebih mampu. Override ini menerima string `provider/model-id` apa pun:

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

Ini juga berfungsi dengan model lokal, misalnya model Ollama kedua yang didedikasikan untuk peringkasan atau spesialis Compaction yang telah di-fine-tune:

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

Jika tidak disetel, Compaction menggunakan model utama agen.

## Provider Compaction yang dapat dipasang

Plugin dapat mendaftarkan provider Compaction kustom melalui `registerCompactionProvider()` pada API plugin. Saat provider terdaftar dan dikonfigurasi, OpenClaw mendelegasikan peringkasan kepadanya alih-alih ke pipeline LLM bawaan.

Untuk menggunakan provider yang terdaftar, setel ID provider dalam config Anda:

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

Menyetel `provider` secara otomatis memaksa `mode: "safeguard"`. Provider menerima instruksi Compaction dan kebijakan preservasi identifier yang sama seperti jalur bawaan, dan OpenClaw tetap mempertahankan konteks sufiks giliran terbaru dan giliran terpisah setelah output provider. Jika provider gagal atau mengembalikan hasil kosong, OpenClaw kembali ke peringkasan LLM bawaan.

## Compaction otomatis (aktif secara bawaan)

Saat sesi mendekati atau melampaui jendela konteks model, OpenClaw memicu Compaction otomatis dan dapat mencoba ulang permintaan asli menggunakan konteks yang sudah di-compact.

Anda akan melihat:

- `🧹 Auto-compaction complete` dalam mode verbose
- `/status` menampilkan `🧹 Compactions: <count>`

Sebelum Compaction, OpenClaw dapat menjalankan giliran **memory flush diam-diam** untuk menyimpan
catatan tahan lama ke disk. Lihat [Memory](/id/concepts/memory) untuk detail dan config.

## Compaction manual

Ketik `/compact` di chat mana pun untuk memaksa Compaction. Tambahkan instruksi untuk memandu
ringkasan:

```
/compact Fokus pada keputusan desain API
```

## Menggunakan model yang berbeda

Secara bawaan, Compaction menggunakan model utama agen Anda. Anda dapat menggunakan model yang lebih
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

## Notifikasi Compaction

Secara bawaan, Compaction berjalan secara diam-diam. Untuk menampilkan notifikasi singkat saat Compaction
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

Saat diaktifkan, pengguna akan melihat pesan status singkat di sekitar setiap eksekusi Compaction
(misalnya, "Memadatkan konteks..." dan "Compaction selesai").

## Compaction vs pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Apa fungsinya** | Merangkum percakapan lama     | Memangkas hasil tool lama        |
| **Disimpan?**    | Ya (dalam transkrip sesi)     | Tidak (hanya in-memory, per permintaan) |
| **Cakupan**      | Seluruh percakapan            | Hanya hasil tool                 |

[Session pruning](/id/concepts/session-pruning) adalah pelengkap yang lebih ringan yang
memangkas output tool tanpa melakukan peringkasan.

## Pemecahan masalah

**Terlalu sering melakukan Compaction?** Jendela konteks model mungkin kecil, atau output
tool mungkin besar. Coba aktifkan
[session pruning](/id/concepts/session-pruning).

**Konteks terasa usang setelah Compaction?** Gunakan `/compact Fokus pada <topic>` untuk
memandu ringkasan, atau aktifkan [memory flush](/id/concepts/memory) agar catatan
tetap tersimpan.

**Butuh mulai bersih?** `/new` memulai sesi baru tanpa melakukan Compaction.

Untuk konfigurasi lanjutan (reserve token, preservasi identifier, engine
konteks kustom, Compaction sisi server OpenAI), lihat
[Pendalaman Manajemen Sesi](/id/reference/session-management-compaction).

## Terkait

- [Session](/id/concepts/session) — manajemen dan siklus hidup sesi
- [Session Pruning](/id/concepts/session-pruning) — memangkas hasil tool
- [Context](/id/concepts/context) — cara konteks dibangun untuk giliran agen
- [Hooks](/id/automation/hooks) — hook siklus hidup Compaction (before_compaction, after_compaction)
