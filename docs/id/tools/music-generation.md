---
read_when:
    - Membuat musik atau audio melalui agen
    - Mengonfigurasi provider dan model pembuatan musik
    - Memahami parameter tool music_generate
summary: Hasilkan musik dengan provider bersama, termasuk plugin berbasis workflow
title: Pembuatan Musik
x-i18n:
    generated_at: "2026-04-07T09:20:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce8da8dfc188efe8593ca5cbec0927dd1d18d2861a1a828df89c8541ccf1cb25
    source_path: tools/music-generation.md
    workflow: 15
---

# Pembuatan Musik

Tool `music_generate` memungkinkan agen membuat musik atau audio melalui
kemampuan pembuatan musik bersama dengan provider yang dikonfigurasi seperti Google,
MiniMax, dan ComfyUI yang dikonfigurasi lewat workflow.

Untuk sesi agen yang didukung provider bersama, OpenClaw memulai pembuatan musik sebagai
tugas latar belakang, melacaknya di task ledger, lalu membangunkan agen lagi saat
trek sudah siap agar agen dapat memposting audio yang telah selesai kembali ke
channel asal.

<Note>
Tool bersama bawaan hanya muncul ketika setidaknya satu provider pembuatan musik tersedia. Jika Anda tidak melihat `music_generate` di tools agen Anda, konfigurasikan `agents.defaults.musicGenerationModel` atau atur kunci API provider.
</Note>

## Mulai cepat

### Pembuatan yang didukung provider bersama

1. Tetapkan kunci API untuk setidaknya satu provider, misalnya `GEMINI_API_KEY` atau
   `MINIMAX_API_KEY`.
2. Secara opsional tetapkan model pilihan Anda:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. Minta agen: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

Agen memanggil `music_generate` secara otomatis. Tidak perlu allow-list tool.

Untuk konteks sinkron langsung tanpa proses agen yang didukung sesi, tool bawaan
tetap menggunakan fallback ke pembuatan inline dan mengembalikan path media akhir di
hasil tool.

Contoh prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Pembuatan Comfy yang didorong workflow

Plugin `comfy` bawaan terhubung ke tool bersama `music_generate` melalui
registry provider pembuatan musik.

1. Konfigurasikan `models.providers.comfy.music` dengan JSON workflow dan
   node prompt/output.
2. Jika Anda menggunakan Comfy Cloud, tetapkan `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY`.
3. Minta agen membuat musik atau panggil tool secara langsung.

Contoh:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Dukungan provider bawaan bersama

| Provider | Model default          | Input referensi | Kontrol yang didukung                                     | Kunci API                               |
| -------- | ---------------------- | --------------- | --------------------------------------------------------- | --------------------------------------- |
| ComfyUI  | `workflow`             | Hingga 1 gambar | Musik atau audio yang ditentukan workflow                 | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| Google   | `lyria-3-clip-preview` | Hingga 10 gambar | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax  | `music-2.5+`           | Tidak ada       | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                       |

### Matriks kemampuan yang dideklarasikan

Ini adalah kontrak mode eksplisit yang digunakan oleh `music_generate`, contract test,
dan shared live sweep.

| Provider | `generate` | `edit` | Batas edit | Shared live lanes                                                        |
| -------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------ |
| ComfyUI  | Ya         | Ya     | 1 gambar   | Tidak dalam shared sweep; dicakup oleh `extensions/comfy/comfy.live.test.ts` |
| Google   | Ya         | Ya     | 10 gambar  | `generate`, `edit`                                                       |
| MiniMax  | Ya         | Tidak  | Tidak ada  | `generate`                                                               |

Gunakan `action: "list"` untuk memeriksa provider dan model bersama yang tersedia saat
runtime:

```text
/tool music_generate action=list
```

Gunakan `action: "status"` untuk memeriksa tugas musik aktif yang didukung sesi:

```text
/tool music_generate action=status
```

Contoh pembuatan langsung:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parameter tool bawaan

| Parameter         | Tipe     | Deskripsi                                                                                      |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt pembuatan musik (wajib untuk `action: "generate"`)                                      |
| `action`          | string   | `"generate"` (default), `"status"` untuk tugas sesi saat ini, atau `"list"` untuk memeriksa provider |
| `model`           | string   | Override provider/model, misalnya `google/lyria-3-pro-preview` atau `comfy/workflow`          |
| `lyrics`          | string   | Lirik opsional saat provider mendukung input lirik eksplisit                                   |
| `instrumental`    | boolean  | Minta output instrumental saja saat provider mendukungnya                                      |
| `image`           | string   | Path atau URL gambar referensi tunggal                                                         |
| `images`          | string[] | Beberapa gambar referensi (hingga 10)                                                          |
| `durationSeconds` | number   | Durasi target dalam detik saat provider mendukung petunjuk durasi                              |
| `format`          | string   | Petunjuk format output (`mp3` atau `wav`) saat provider mendukungnya                           |
| `filename`        | string   | Petunjuk nama file output                                                                       |

Tidak semua provider mendukung semua parameter. OpenClaw tetap memvalidasi batas keras
seperti jumlah input sebelum pengiriman. Saat provider mendukung durasi tetapi
menggunakan maksimum yang lebih pendek daripada nilai yang diminta, OpenClaw otomatis membatasi
ke durasi terdekat yang didukung. Petunjuk opsional yang benar-benar tidak didukung akan diabaikan
dengan peringatan ketika provider atau model yang dipilih tidak dapat memenuhinya.

Hasil tool melaporkan pengaturan yang diterapkan. Saat OpenClaw membatasi durasi selama fallback provider, `durationSeconds` yang dikembalikan mencerminkan nilai yang dikirim dan `details.normalization.durationSeconds` menunjukkan pemetaan dari nilai yang diminta ke nilai yang diterapkan.

## Perilaku async untuk jalur yang didukung provider bersama

- Proses agen yang didukung sesi: `music_generate` membuat tugas latar belakang, segera mengembalikan respons started/task, dan memposting trek yang telah selesai nanti dalam pesan agen lanjutan.
- Pencegahan duplikat: selama tugas latar belakang tersebut masih `queued` atau `running`, panggilan `music_generate` berikutnya dalam sesi yang sama mengembalikan status tugas alih-alih memulai pembuatan lain.
- Pencarian status: gunakan `action: "status"` untuk memeriksa tugas musik aktif yang didukung sesi tanpa memulai tugas baru.
- Pelacakan tugas: gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk memeriksa status queued, running, dan terminal untuk pembuatan tersebut.
- Completion wake: OpenClaw menyuntikkan peristiwa penyelesaian internal kembali ke sesi yang sama agar model dapat menulis tindak lanjut yang terlihat pengguna sendiri.
- Petunjuk prompt: giliran pengguna/manual berikutnya dalam sesi yang sama mendapat petunjuk runtime kecil saat tugas musik sudah sedang berjalan sehingga model tidak secara buta memanggil `music_generate` lagi.
- Fallback tanpa sesi: konteks langsung/lokal tanpa sesi agen nyata tetap berjalan inline dan mengembalikan hasil audio akhir dalam giliran yang sama.

### Siklus hidup tugas

Setiap permintaan `music_generate` bergerak melalui empat status:

1. **queued** -- tugas dibuat, menunggu provider menerimanya.
2. **running** -- provider sedang memproses (biasanya 30 detik hingga 3 menit tergantung provider dan durasi).
3. **succeeded** -- trek siap; agen bangun dan mempostingnya ke percakapan.
4. **failed** -- kesalahan provider atau timeout; agen bangun dengan detail kesalahan.

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Pencegahan duplikat: jika tugas musik sudah `queued` atau `running` untuk sesi saat ini, `music_generate` mengembalikan status tugas yang ada alih-alih memulai tugas baru. Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu pembuatan baru.

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Urutan pemilihan provider

Saat membuat musik, OpenClaw mencoba provider dalam urutan ini:

1. parameter `model` dari pemanggilan tool, jika agen menentukannya
2. `musicGenerationModel.primary` dari konfigurasi
3. `musicGenerationModel.fallbacks` sesuai urutan
4. Deteksi otomatis menggunakan hanya default provider yang didukung autentikasi:
   - provider default saat ini terlebih dahulu
   - provider pembuatan musik terdaftar lainnya dalam urutan id provider

Jika sebuah provider gagal, kandidat berikutnya dicoba secara otomatis. Jika semua gagal,
kesalahan tersebut menyertakan detail dari setiap percobaan.

Tetapkan `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin
pembuatan musik hanya menggunakan entri `model`, `primary`, dan `fallbacks` yang eksplisit.

## Catatan provider

- Google menggunakan pembuatan batch Lyria 3. Alur bawaan saat ini mendukung
  prompt, teks lirik opsional, dan gambar referensi opsional.
- MiniMax menggunakan endpoint batch `music_generation`. Alur bawaan saat ini
  mendukung prompt, lirik opsional, mode instrumental, pengaturan durasi, dan
  output mp3.
- Dukungan ComfyUI didorong workflow dan bergantung pada grafik yang dikonfigurasi plus
  pemetaan node untuk field prompt/output.

## Mode kemampuan provider

Kontrak pembuatan musik bersama kini mendukung deklarasi mode eksplisit:

- `generate` untuk pembuatan hanya dengan prompt
- `edit` ketika permintaan mencakup satu atau lebih gambar referensi

Implementasi provider baru sebaiknya memilih blok mode eksplisit:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Field datar lama seperti `maxInputImages`, `supportsLyrics`, dan
`supportsFormat` tidak cukup untuk mengiklankan dukungan edit. Provider harus
mendeklarasikan `generate` dan `edit` secara eksplisit agar live test, contract test, dan
tool bersama `music_generate` dapat memvalidasi dukungan mode secara deterministik.

## Memilih jalur yang tepat

- Gunakan jalur yang didukung provider bersama ketika Anda menginginkan pemilihan model, fallback provider, dan alur async task/status bawaan.
- Gunakan jalur plugin seperti ComfyUI ketika Anda membutuhkan grafik workflow kustom atau provider yang bukan bagian dari kemampuan musik bawaan bersama.
- Jika Anda sedang men-debug perilaku khusus ComfyUI, lihat [ComfyUI](/id/providers/comfy). Jika Anda sedang men-debug perilaku provider bersama, mulai dari [Google (Gemini)](/id/providers/google) atau [MiniMax](/id/providers/minimax).

## Live test

Cakupan live opsional untuk provider bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media music
```

File live ini memuat env var provider yang hilang dari `~/.profile`, mengutamakan
kunci API live/env dibanding auth profile tersimpan secara default, dan menjalankan
cakupan `generate` dan `edit` yang dideklarasikan saat provider mengaktifkan mode edit.

Saat ini artinya:

- `google`: `generate` plus `edit`
- `minimax`: hanya `generate`
- `comfy`: cakupan live Comfy terpisah, bukan shared provider sweep

Cakupan live opsional untuk jalur musik ComfyUI bawaan:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

File live Comfy juga mencakup workflow gambar dan video comfy ketika bagian tersebut
dikonfigurasi.

## Terkait

- [Background Tasks](/id/automation/tasks) - pelacakan tugas untuk proses `music_generate` yang dilepas
- [Configuration Reference](/id/gateway/configuration-reference#agent-defaults) - konfigurasi `musicGenerationModel`
- [ComfyUI](/id/providers/comfy)
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Models](/id/concepts/models) - konfigurasi model dan fallback
- [Tools Overview](/id/tools)
