---
read_when:
    - Anda ingin memahami bagaimana OpenClaw merakit konteks model
    - Anda sedang beralih antara mesin lama dan mesin plugin
    - Anda sedang membangun plugin mesin konteks
summary: 'Mesin konteks: perakitan konteks yang dapat dipasangi plugin, pemadatan, dan siklus hidup subagen'
title: Mesin Konteks
x-i18n:
    generated_at: "2026-04-07T09:13:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8290ac73272eee275bce8e481ac7959b65386752caa68044d0c6f3e450acfb1
    source_path: concepts/context-engine.md
    workflow: 15
---

# Mesin Konteks

**Mesin konteks** mengontrol bagaimana OpenClaw membangun konteks model untuk setiap proses.
Mesin ini menentukan pesan mana yang disertakan, bagaimana merangkum riwayat lama, dan bagaimana
mengelola konteks melintasi batas subagen.

OpenClaw dilengkapi dengan mesin `legacy` bawaan. Plugin dapat mendaftarkan
mesin alternatif yang menggantikan siklus hidup context-engine aktif.

## Mulai cepat

Periksa mesin mana yang aktif:

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Menginstal plugin mesin konteks

Plugin mesin konteks diinstal seperti plugin OpenClaw lainnya. Instal
terlebih dahulu, lalu pilih mesin di slot:

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

Lalu aktifkan plugin dan pilih sebagai mesin aktif di konfigurasi Anda:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // must match the plugin's registered engine id
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin-specific config goes here (see the plugin's docs)
      },
    },
  },
}
```

Mulai ulang gateway setelah instalasi dan konfigurasi.

Untuk beralih kembali ke mesin bawaan, setel `contextEngine` ke `"legacy"` (atau
hapus kuncinya sepenuhnya — `"legacy"` adalah nilai default).

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada
empat titik siklus hidup:

1. **Ingest** — dipanggil ketika pesan baru ditambahkan ke sesi. Mesin
   dapat menyimpan atau mengindeks pesan dalam penyimpanan datanya sendiri.
2. **Assemble** — dipanggil sebelum setiap proses model. Mesin mengembalikan
   sekumpulan pesan terurut (dan `systemPromptAddition` opsional) yang muat dalam
   anggaran token.
3. **Compact** — dipanggil saat jendela konteks penuh, atau ketika pengguna menjalankan
   `/compact`. Mesin merangkum riwayat lama untuk membebaskan ruang.
4. **After turn** — dipanggil setelah sebuah proses selesai. Mesin dapat mempertahankan status,
   memicu pemadatan latar belakang, atau memperbarui indeks.

### Siklus hidup subagen (opsional)

OpenClaw saat ini memanggil satu hook siklus hidup subagen:

- **onSubagentEnded** — bersihkan saat sesi subagen selesai atau disapu.

Hook `prepareSubagentSpawn` adalah bagian dari antarmuka untuk penggunaan mendatang, tetapi
runtime belum memanggilnya.

### Penambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw
menambahkan ini ke awal prompt sistem untuk proses tersebut. Ini memungkinkan mesin menyisipkan
panduan pemanggilan dinamis, instruksi pengambilan, atau petunjuk yang sadar konteks
tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin `legacy` bawaan mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (manajer sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang sudah ada
  di runtime menangani perakitan konteks).
- **Compact**: mendelegasikan ke pemadatan peringkasan bawaan, yang membuat
  satu ringkasan pesan lama dan menjaga pesan terbaru tetap utuh.
- **After turn**: no-op.

Mesin legacy tidak mendaftarkan alat atau menyediakan `systemPromptAddition`.

Saat tidak ada `plugins.slots.contextEngine` yang disetel (atau disetel ke `"legacy"`), mesin ini
digunakan secara otomatis.

## Mesin plugin

Plugin dapat mendaftarkan mesin konteks menggunakan API plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Lalu aktifkan di konfigurasi:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Antarmuka ContextEngine

Anggota yang wajib:

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | ID, nama, versi mesin, dan apakah mesin memiliki pemadatan |
| `ingest(params)`   | Method   | Menyimpan satu pesan                                   |
| `assemble(params)` | Method   | Membangun konteks untuk proses model (mengembalikan `AssembleResult`) |
| `compact(params)`  | Method   | Merangkum/mengurangi konteks                                 |

`assemble` mengembalikan `AssembleResult` dengan:

- `messages` — pesan terurut yang akan dikirim ke model.
- `estimatedTokens` (wajib, `number`) — perkiraan mesin untuk total
  token dalam konteks yang dirakit. OpenClaw menggunakan ini untuk ambang pemadatan
  dan pelaporan diagnostik.
- `systemPromptAddition` (opsional, `string`) — ditambahkan ke awal prompt sistem.

Anggota opsional:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Menginisialisasi status mesin untuk sebuah sesi. Dipanggil sekali saat mesin pertama kali melihat sebuah sesi (misalnya, mengimpor riwayat). |
| `ingestBatch(params)`          | Method | Mengingest satu giliran yang selesai sebagai batch. Dipanggil setelah sebuah proses selesai, dengan semua pesan dari giliran itu sekaligus.     |
| `afterTurn(params)`            | Method | Pekerjaan siklus hidup setelah proses (mempertahankan status, memicu pemadatan latar belakang).                                         |
| `prepareSubagentSpawn(params)` | Method | Menyiapkan status bersama untuk sesi anak.                                                                        |
| `onSubagentEnded(params)`      | Method | Membersihkan setelah subagen berakhir.                                                                                 |
| `dispose()`                    | Method | Melepaskan sumber daya. Dipanggil selama shutdown gateway atau pemuatan ulang plugin — bukan per sesi.                           |

### ownsCompaction

`ownsCompaction` mengontrol apakah auto-compaction bawaan Pi di dalam percobaan tetap
diaktifkan untuk proses tersebut:

- `true` — mesin memiliki perilaku pemadatan. OpenClaw menonaktifkan auto-compaction bawaan Pi
  untuk proses itu, dan implementasi `compact()` milik mesin bertanggung jawab atas `/compact`,
  pemadatan pemulihan luapan, dan pemadatan proaktif apa pun
  yang ingin dilakukannya di `afterTurn()`.
- `false` atau tidak disetel — auto-compaction bawaan Pi masih dapat berjalan selama
  eksekusi prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk
  `/compact` dan pemulihan luapan.

`ownsCompaction: false` **tidak** berarti OpenClaw secara otomatis kembali ke
jalur pemadatan mesin legacy.

Artinya ada dua pola plugin yang valid:

- **Mode owning** — implementasikan algoritma pemadatan Anda sendiri dan setel
  `ownsCompaction: true`.
- **Mode delegating** — setel `ownsCompaction: false` dan buat `compact()` memanggil
  `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan
  perilaku pemadatan bawaan OpenClaw.

`compact()` no-op tidak aman untuk mesin aktif non-owning karena hal itu
menonaktifkan jalur normal `/compact` dan pemadatan pemulihan luapan untuk
slot mesin tersebut.

## Referensi konfigurasi

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

Slot ini eksklusif saat runtime — hanya satu mesin konteks terdaftar yang
diresolusikan untuk proses atau operasi pemadatan tertentu. Plugin lain yang diaktifkan
dengan `kind: "context-engine"` tetap dapat dimuat dan menjalankan kode
pendaftarannya; `plugins.slots.contextEngine` hanya memilih ID mesin terdaftar mana yang
diresolusikan OpenClaw saat membutuhkan mesin konteks.

## Hubungan dengan pemadatan dan memori

- **Pemadatan** adalah salah satu tanggung jawab mesin konteks. Mesin legacy
  mendelegasikan ke peringkasan bawaan OpenClaw. Mesin plugin dapat mengimplementasikan
  strategi pemadatan apa pun (ringkasan DAG, pengambilan vektor, dll.).
- **Plugin memori** (`plugins.slots.memory`) terpisah dari mesin konteks.
  Plugin memori menyediakan pencarian/pengambilan; mesin konteks mengontrol apa yang
  dilihat model. Keduanya dapat bekerja bersama — mesin konteks mungkin menggunakan data plugin
  memori selama perakitan. Mesin plugin yang menginginkan jalur prompt memori aktif
  sebaiknya menggunakan `buildMemorySystemPromptAddition(...)` dari
  `openclaw/plugin-sdk/core`, yang mengubah bagian prompt memori aktif
  menjadi `systemPromptAddition` yang siap ditambahkan di awal. Jika sebuah mesin memerlukan kontrol
  tingkat lebih rendah, mesin itu tetap dapat mengambil baris mentah dari
  `openclaw/plugin-sdk/memory-host-core` melalui
  `buildActiveMemoryPromptSection(...)`.
- **Pemangkasan sesi** (memotong hasil alat lama di memori) tetap berjalan
  terlepas dari mesin konteks mana yang aktif.

## Tips

- Gunakan `openclaw doctor` untuk memverifikasi bahwa mesin Anda dimuat dengan benar.
- Jika beralih mesin, sesi yang ada akan tetap menggunakan riwayatnya saat ini.
  Mesin baru akan mengambil alih untuk proses-proses berikutnya.
- Kesalahan mesin dicatat dalam log dan ditampilkan dalam diagnostik. Jika mesin plugin
  gagal didaftarkan atau ID mesin yang dipilih tidak dapat diresolusikan, OpenClaw
  tidak secara otomatis melakukan fallback; proses akan gagal sampai Anda memperbaiki plugin atau
  mengubah `plugins.slots.contextEngine` kembali ke `"legacy"`.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan
  direktori plugin lokal tanpa menyalin.

Lihat juga: [Pemadatan](/id/concepts/compaction), [Konteks](/id/concepts/context),
[Plugins](/id/tools/plugin), [Manifest plugin](/id/plugins/manifest).

## Terkait

- [Konteks](/id/concepts/context) — bagaimana konteks dibangun untuk giliran agen
- [Arsitektur Plugin](/id/plugins/architecture) — mendaftarkan plugin mesin konteks
- [Pemadatan](/id/concepts/compaction) — merangkum percakapan yang panjang
