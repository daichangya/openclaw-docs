---
read_when:
    - Anda ingin memahami bagaimana OpenClaw merakit konteks model
    - Anda sedang beralih antara engine lama dan engine Plugin
    - Anda sedang membangun Plugin mesin konteks
summary: 'Mesin konteks: perakitan konteks yang dapat dipasang, Compaction, dan siklus hidup subagen'
title: Mesin konteks
x-i18n:
    generated_at: "2026-04-25T13:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

Sebuah **mesin konteks** mengontrol bagaimana OpenClaw membangun konteks model untuk setiap eksekusi:
pesan mana yang harus disertakan, bagaimana merangkum riwayat lama, dan bagaimana mengelola
konteks melintasi batas subagen.

OpenClaw dikirim dengan mesin bawaan `legacy` dan menggunakannya secara default — sebagian besar
pengguna tidak pernah perlu mengubah ini. Instal dan pilih mesin Plugin hanya saat
Anda menginginkan perilaku perakitan, Compaction, atau recall lintas sesi yang berbeda.

## Mulai cepat

Periksa mesin mana yang aktif:

```bash
openclaw doctor
# atau periksa config secara langsung:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Menginstal Plugin mesin konteks

Plugin mesin konteks diinstal seperti Plugin OpenClaw lainnya. Instal
terlebih dahulu, lalu pilih mesin di slot:

```bash
# Instal dari npm
openclaw plugins install @martian-engineering/lossless-claw

# Atau instal dari path lokal (untuk pengembangan)
openclaw plugins install -l ./my-context-engine
```

Lalu aktifkan Plugin dan pilih sebagai mesin aktif di konfigurasi Anda:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // harus cocok dengan id mesin terdaftar milik plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Config khusus Plugin ditempatkan di sini (lihat dokumen plugin)
      },
    },
  },
}
```

Mulai ulang gateway setelah instalasi dan konfigurasi.

Untuk beralih kembali ke mesin bawaan, setel `contextEngine` ke `"legacy"` (atau
hapus kunci sepenuhnya — `"legacy"` adalah default).

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada
empat titik siklus hidup:

1. **Ingest** — dipanggil saat pesan baru ditambahkan ke sesi. Mesin
   dapat menyimpan atau mengindeks pesan ke penyimpanan datanya sendiri.
2. **Assemble** — dipanggil sebelum setiap eksekusi model. Mesin mengembalikan
   kumpulan pesan yang terurut (dan `systemPromptAddition` opsional) yang muat
   di dalam anggaran token.
3. **Compact** — dipanggil saat jendela konteks penuh, atau saat pengguna menjalankan
   `/compact`. Mesin merangkum riwayat lama untuk membebaskan ruang.
4. **After turn** — dipanggil setelah eksekusi selesai. Mesin dapat mempertahankan state,
   memicu Compaction latar belakang, atau memperbarui indeks.

Untuk harness Codex non-ACP bawaan, OpenClaw menerapkan siklus hidup yang sama dengan
memproyeksikan konteks yang dirakit ke instruksi developer Codex dan prompt giliran
saat ini. Codex tetap memiliki riwayat thread native dan compactor native-nya.

### Siklus hidup subagen (opsional)

OpenClaw memanggil dua hook siklus hidup subagen opsional:

- **prepareSubagentSpawn** — menyiapkan state konteks bersama sebelum eksekusi anak
  dimulai. Hook menerima kunci sesi induk/anak, `contextMode`
  (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional.
  Jika hook mengembalikan handle rollback, OpenClaw akan memanggilnya saat spawn gagal setelah
  persiapan berhasil.
- **onSubagentEnded** — membersihkan saat sesi subagen selesai atau disapu.

### Penambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw
menambahkan ini di depan prompt sistem untuk eksekusi. Ini memungkinkan mesin menyuntikkan
panduan recall dinamis, instruksi retrieval, atau petunjuk sadar konteks
tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin bawaan `legacy` mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (pengelola sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang sudah ada
  di runtime menangani perakitan konteks).
- **Compact**: mendelegasikan ke Compaction peringkasan bawaan, yang membuat
  satu ringkasan pesan lama dan mempertahankan pesan terbaru tetap utuh.
- **After turn**: no-op.

Mesin legacy tidak mendaftarkan tool atau menyediakan `systemPromptAddition`.

Saat tidak ada `plugins.slots.contextEngine` yang disetel (atau disetel ke `"legacy"`), mesin ini
digunakan secara otomatis.

## Mesin Plugin

Sebuah Plugin dapat mendaftarkan mesin konteks menggunakan API plugin:

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
      // Simpan pesan di penyimpanan data Anda
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Kembalikan pesan yang muat dalam anggaran
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
      // Ringkas konteks lama
      return { ok: true, compacted: true };
    },
  }));
}
```

Lalu aktifkan di config:

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

### Interface ContextEngine

Anggota yang wajib:

| Anggota           | Jenis    | Tujuan                                                   |
| ----------------- | -------- | -------------------------------------------------------- |
| `info`            | Properti | Id, nama, versi mesin, dan apakah mesin memiliki Compaction |
| `ingest(params)`  | Metode   | Menyimpan satu pesan                                     |
| `assemble(params)`| Metode   | Membangun konteks untuk eksekusi model (mengembalikan `AssembleResult`) |
| `compact(params)` | Metode   | Merangkum/mengurangi konteks                             |

`assemble` mengembalikan `AssembleResult` dengan:

- `messages` — pesan terurut yang akan dikirim ke model.
- `estimatedTokens` (wajib, `number`) — estimasi mesin atas total
  token dalam konteks yang dirakit. OpenClaw menggunakan ini untuk keputusan
  ambang Compaction dan pelaporan diagnostik.
- `systemPromptAddition` (opsional, `string`) — ditambahkan di depan prompt sistem.

Anggota opsional:

| Anggota                      | Jenis  | Tujuan                                                                                                           |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`          | Metode | Menginisialisasi state mesin untuk sesi. Dipanggil sekali saat mesin pertama kali melihat sesi (misalnya, impor riwayat). |
| `ingestBatch(params)`        | Metode | Meng-ingest satu giliran yang telah selesai sebagai batch. Dipanggil setelah eksekusi selesai, dengan semua pesan dari giliran itu sekaligus. |
| `afterTurn(params)`          | Metode | Pekerjaan siklus hidup pasca-eksekusi (mempertahankan state, memicu Compaction latar belakang).                 |
| `prepareSubagentSpawn(params)` | Metode | Menyiapkan state bersama untuk sesi anak sebelum dimulai.                                                       |
| `onSubagentEnded(params)`    | Metode | Membersihkan setelah subagen berakhir.                                                                          |
| `dispose()`                  | Metode | Melepaskan resource. Dipanggil saat gateway shutdown atau reload Plugin — bukan per sesi.                       |

### ownsCompaction

`ownsCompaction` mengontrol apakah auto-Compaction bawaan Pi di dalam percobaan tetap
diaktifkan untuk eksekusi:

- `true` — mesin memiliki perilaku Compaction. OpenClaw menonaktifkan
  auto-Compaction bawaan Pi untuk eksekusi itu, dan implementasi `compact()` milik mesin
  bertanggung jawab atas `/compact`, Compaction pemulihan overflow, dan Compaction proaktif
  apa pun yang ingin dilakukan di `afterTurn()`. OpenClaw masih dapat menjalankan
  perlindungan overflow pra-prompt; saat memperkirakan seluruh transkrip akan
  overflow, jalur pemulihan memanggil `compact()` milik mesin aktif sebelum
  mengirim prompt lain.
- `false` atau tidak disetel — auto-Compaction bawaan Pi masih dapat berjalan selama eksekusi
  prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk
  `/compact` dan pemulihan overflow.

`ownsCompaction: false` **tidak** berarti OpenClaw secara otomatis menggunakan fallback ke
jalur Compaction mesin legacy.

Artinya ada dua pola Plugin yang valid:

- **Mode owning** — implementasikan algoritme Compaction Anda sendiri dan setel
  `ownsCompaction: true`.
- **Mode delegating** — setel `ownsCompaction: false` dan buat `compact()` memanggil
  `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan
  perilaku Compaction bawaan OpenClaw.

`compact()` no-op tidak aman untuk mesin aktif non-owning karena itu
menonaktifkan jalur normal `/compact` dan Compaction pemulihan overflow untuk
slot mesin tersebut.

## Referensi konfigurasi

```json5
{
  plugins: {
    slots: {
      // Pilih mesin konteks aktif. Default: "legacy".
      // Setel ke id plugin untuk menggunakan mesin Plugin.
      contextEngine: "legacy",
    },
  },
}
```

Slot ini eksklusif pada saat runtime — hanya satu mesin konteks terdaftar yang
di-resolve untuk eksekusi atau operasi Compaction tertentu. Plugin lain yang diaktifkan
dengan `kind: "context-engine"` tetap dapat dimuat dan menjalankan kode
registrasinya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar mana yang
di-resolve OpenClaw saat memerlukan mesin konteks.

## Hubungan dengan Compaction dan memory

- **Compaction** adalah salah satu tanggung jawab mesin konteks. Mesin legacy
  mendelegasikan ke peringkasan bawaan OpenClaw. Mesin Plugin dapat mengimplementasikan
  strategi Compaction apa pun (ringkasan DAG, vector retrieval, dan sebagainya).
- **Plugin memory** (`plugins.slots.memory`) terpisah dari mesin konteks.
  Plugin memory menyediakan pencarian/retrieval; mesin konteks mengontrol apa yang
  dilihat model. Keduanya dapat bekerja bersama — mesin konteks mungkin menggunakan data
  Plugin memory selama perakitan. Mesin Plugin yang menginginkan jalur prompt
  Active Memory sebaiknya menggunakan `buildMemorySystemPromptAddition(...)` dari
  `openclaw/plugin-sdk/core`, yang mengubah bagian prompt memory aktif
  menjadi `systemPromptAddition` siap-tempel. Jika mesin memerlukan kontrol
  tingkat lebih rendah, mesin tetap dapat menarik baris mentah dari
  `openclaw/plugin-sdk/memory-host-core` melalui
  `buildActiveMemoryPromptSection(...)`.
- **Pemangkasan sesi** (memangkas hasil tool lama di memori) tetap berjalan
  tanpa memedulikan mesin konteks mana yang aktif.

## Tips

- Gunakan `openclaw doctor` untuk memverifikasi bahwa mesin Anda dimuat dengan benar.
- Jika berganti mesin, sesi yang ada melanjutkan riwayatnya saat ini.
  Mesin baru mengambil alih untuk eksekusi berikutnya.
- Error mesin dicatat ke log dan ditampilkan dalam diagnostik. Jika mesin Plugin
  gagal mendaftar atau id mesin yang dipilih tidak dapat di-resolve, OpenClaw
  tidak otomatis menggunakan fallback; eksekusi gagal sampai Anda memperbaiki Plugin atau
  mengembalikan `plugins.slots.contextEngine` ke `"legacy"`.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan
  direktori Plugin lokal tanpa menyalin.

Lihat juga: [Compaction](/id/concepts/compaction), [Context](/id/concepts/context),
[Plugins](/id/tools/plugin), [Plugin manifest](/id/plugins/manifest).

## Terkait

- [Context](/id/concepts/context) — bagaimana konteks dibangun untuk giliran agen
- [Plugin Architecture](/id/plugins/architecture) — mendaftarkan Plugin mesin konteks
- [Compaction](/id/concepts/compaction) — merangkum percakapan panjang
