---
read_when:
    - Menghasilkan musik atau audio melalui agen
    - Mengonfigurasi provider dan model pembuatan musik
    - Memahami parameter tool `music_generate`
summary: Hasilkan musik dengan provider bersama, termasuk Plugin yang didukung workflow
title: Pembuatan musik
x-i18n:
    generated_at: "2026-04-25T13:58:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

Tool `music_generate` memungkinkan agen membuat musik atau audio melalui
kemampuan pembuatan musik bersama dengan provider yang dikonfigurasi seperti Google,
MiniMax, dan ComfyUI yang dikonfigurasi dengan workflow.

Untuk sesi agen yang didukung provider bersama, OpenClaw memulai pembuatan musik sebagai
tugas latar belakang, melacaknya di task ledger, lalu membangunkan agen lagi saat
track sudah siap sehingga agen dapat memposting audio yang telah selesai kembali ke
channel asal.

<Note>
Tool bersama bawaan hanya muncul saat setidaknya satu provider pembuatan musik tersedia. Jika Anda tidak melihat `music_generate` di tool agen Anda, konfigurasikan `agents.defaults.musicGenerationModel` atau siapkan API key provider.
</Note>

## Memulai dengan cepat

### Pembuatan yang didukung provider bersama

1. Setel API key untuk setidaknya satu provider, misalnya `GEMINI_API_KEY` atau
   `MINIMAX_API_KEY`.
2. Opsional, setel model pilihan Anda:

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

Agen memanggil `music_generate` secara otomatis. Tidak perlu allow-listing tool.

Untuk context sinkron langsung tanpa run agen yang didukung sesi, tool bawaan
tetap fallback ke pembuatan inline dan mengembalikan path media final dalam
hasil tool.

Contoh prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Pembuatan Comfy berbasis workflow

Plugin `comfy` bawaan terhubung ke tool `music_generate` bersama melalui
registri provider pembuatan musik.

1. Konfigurasikan `plugins.entries.comfy.config.music` dengan workflow JSON dan
   node prompt/output.
2. Jika Anda menggunakan Comfy Cloud, setel `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY`.
3. Minta agen untuk membuat musik atau panggil tool secara langsung.

Contoh:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Dukungan provider bawaan bersama

| Provider | Model default          | Input referensi | Kontrol yang didukung                                    | API key                                |
| -------- | ---------------------- | --------------- | -------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Hingga 1 gambar | Musik atau audio yang ditentukan workflow                | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Hingga 10 gambar | `lyrics`, `instrumental`, `format`                      | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Tidak ada       | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                    |

### Matriks kemampuan yang dideklarasikan

Ini adalah kontrak mode eksplisit yang digunakan oleh `music_generate`, uji kontrak,
dan shared live sweep.

| Provider | `generate` | `edit` | Batas edit | Lajur live bersama                                                         |
| -------- | ---------- | ------ | ---------- | -------------------------------------------------------------------------- |
| ComfyUI  | Ya         | Ya     | 1 gambar   | Tidak ada di shared sweep; dicakup oleh `extensions/comfy/comfy.live.test.ts` |
| Google   | Ya         | Ya     | 10 gambar  | `generate`, `edit`                                                         |
| MiniMax  | Ya         | Tidak  | Tidak ada  | `generate`                                                                 |

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

| Parameter         | Tipe     | Deskripsi                                                                                       |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `prompt`          | string   | Prompt pembuatan musik (wajib untuk `action: "generate"`)                                       |
| `action`          | string   | `"generate"` (default), `"status"` untuk tugas sesi saat ini, atau `"list"` untuk memeriksa provider |
| `model`           | string   | Override provider/model, misalnya `google/lyria-3-pro-preview` atau `comfy/workflow`           |
| `lyrics`          | string   | Lirik opsional saat provider mendukung input lirik eksplisit                                    |
| `instrumental`    | boolean  | Meminta output instrumental saja saat provider mendukungnya                                     |
| `image`           | string   | Path atau URL gambar referensi tunggal                                                          |
| `images`          | string[] | Beberapa gambar referensi (hingga 10)                                                           |
| `durationSeconds` | number   | Durasi target dalam detik saat provider mendukung petunjuk durasi                               |
| `timeoutMs`       | number   | Timeout permintaan provider opsional dalam milidetik                                            |
| `format`          | string   | Petunjuk format output (`mp3` atau `wav`) saat provider mendukungnya                            |
| `filename`        | string   | Petunjuk nama file output                                                                       |

Tidak semua provider mendukung semua parameter. OpenClaw tetap memvalidasi batas keras
seperti jumlah input sebelum pengiriman. Saat provider mendukung durasi tetapi
menggunakan maksimum yang lebih pendek daripada nilai yang diminta, OpenClaw secara otomatis membatasi
ke durasi terdekat yang didukung. Petunjuk opsional yang benar-benar tidak didukung akan diabaikan
dengan peringatan saat provider atau model yang dipilih tidak dapat memenuhinya.

Hasil tool melaporkan pengaturan yang diterapkan. Saat OpenClaw membatasi durasi selama fallback provider, `durationSeconds` yang dikembalikan mencerminkan nilai yang dikirim dan `details.normalization.durationSeconds` menunjukkan pemetaan dari nilai yang diminta ke nilai yang diterapkan.

## Perilaku async untuk jalur yang didukung provider bersama

- Run agen yang didukung sesi: `music_generate` membuat tugas latar belakang, segera mengembalikan respons started/task, dan memposting track yang telah selesai nanti dalam pesan agen lanjutan.
- Pencegahan duplikasi: selama tugas latar belakang tersebut masih `queued` atau `running`, pemanggilan `music_generate` berikutnya dalam sesi yang sama mengembalikan status tugas alih-alih memulai pembuatan lain.
- Pencarian status: gunakan `action: "status"` untuk memeriksa tugas musik aktif yang didukung sesi tanpa memulai yang baru.
- Pelacakan tugas: gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk memeriksa status queued, running, dan terminal untuk pembuatan tersebut.
- Completion wake: OpenClaw menyuntikkan event penyelesaian internal kembali ke sesi yang sama sehingga model dapat menulis sendiri tindak lanjut yang menghadap pengguna.
- Petunjuk prompt: turn user/manual berikutnya dalam sesi yang sama mendapatkan petunjuk runtime kecil saat tugas musik sudah sedang berjalan sehingga model tidak secara membabi buta memanggil `music_generate` lagi.
- Fallback tanpa sesi: context langsung/lokal tanpa sesi agen nyata tetap berjalan inline dan mengembalikan hasil audio final pada turn yang sama.

### Siklus hidup task

Setiap permintaan `music_generate` bergerak melalui empat state:

1. **queued** -- task dibuat, menunggu provider menerimanya.
2. **running** -- provider sedang memproses (biasanya 30 detik hingga 3 menit tergantung provider dan durasi).
3. **succeeded** -- track siap; agen bangun dan mempostingnya ke percakapan.
4. **failed** -- error provider atau timeout; agen bangun dengan detail error.

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Pencegahan duplikasi: jika task musik sudah `queued` atau `running` untuk sesi saat ini, `music_generate` mengembalikan status task yang ada alih-alih memulai yang baru. Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu pembuatan baru.

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Urutan pemilihan provider

Saat menghasilkan musik, OpenClaw mencoba provider dalam urutan ini:

1. parameter `model` dari pemanggilan tool, jika agen menentukannya
2. `musicGenerationModel.primary` dari config
3. `musicGenerationModel.fallbacks` sesuai urutan
4. Deteksi otomatis hanya menggunakan default provider yang didukung auth:
   - provider default saat ini terlebih dahulu
   - provider pembuatan musik terdaftar yang tersisa dalam urutan id provider

Jika provider gagal, kandidat berikutnya akan dicoba secara otomatis. Jika semuanya gagal, error
akan menyertakan detail dari setiap percobaan.

Setel `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin
pembuatan musik hanya menggunakan entri `model`, `primary`, dan `fallbacks`
yang eksplisit.

## Catatan provider

- Google menggunakan pembuatan batch Lyria 3. Alur bawaan saat ini mendukung
  prompt, teks lirik opsional, dan gambar referensi opsional.
- MiniMax menggunakan endpoint batch `music_generation`. Alur bawaan saat ini
  mendukung prompt, lirik opsional, mode instrumental, pengarahan durasi, dan
  output mp3.
- Dukungan ComfyUI berbasis workflow dan bergantung pada graph yang dikonfigurasi serta
  pemetaan node untuk field prompt/output.

## Mode kemampuan provider

Kontrak pembuatan musik bersama sekarang mendukung deklarasi mode eksplisit:

- `generate` untuk pembuatan hanya dengan prompt
- `edit` saat permintaan menyertakan satu atau lebih gambar referensi

Implementasi provider baru sebaiknya lebih memilih blok mode eksplisit:

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
mendeklarasikan `generate` dan `edit` secara eksplisit agar live tests, uji kontrak, dan
tool `music_generate` bersama dapat memvalidasi dukungan mode secara deterministik.

## Memilih jalur yang tepat

- Gunakan jalur yang didukung provider bersama saat Anda menginginkan pemilihan model, failover provider, dan alur async task/status bawaan.
- Gunakan jalur Plugin seperti ComfyUI saat Anda membutuhkan graph workflow kustom atau provider yang bukan bagian dari kemampuan musik bawaan bersama.
- Jika Anda sedang men-debug perilaku khusus ComfyUI, lihat [ComfyUI](/id/providers/comfy). Jika Anda sedang men-debug perilaku provider bersama, mulai dari [Google (Gemini)](/id/providers/google) atau [MiniMax](/id/providers/minimax).

## Live tests

Cakupan live opt-in untuk provider bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media music
```

File live ini memuat variabel env provider yang hilang dari `~/.profile`, lebih memilih
API key live/env daripada auth profile yang tersimpan secara default, dan menjalankan cakupan
`generate` maupun `edit` yang dideklarasikan saat provider mengaktifkan mode edit.

Saat ini artinya:

- `google`: `generate` plus `edit`
- `minimax`: `generate` saja
- `comfy`: cakupan live Comfy terpisah, bukan shared provider sweep

Cakupan live opt-in untuk jalur musik ComfyUI bawaan:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

File live Comfy juga mencakup workflow gambar dan video comfy saat bagian tersebut
dikonfigurasi.

## Terkait

- [Background Tasks](/id/automation/tasks) - pelacakan task untuk run `music_generate` yang dilepas
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults) - config `musicGenerationModel`
- [ComfyUI](/id/providers/comfy)
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [Models](/id/concepts/models) - konfigurasi model dan failover
- [Ikhtisar Tools](/id/tools)
