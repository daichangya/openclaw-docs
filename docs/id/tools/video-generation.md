---
read_when:
    - Membuat video melalui agen
    - Mengonfigurasi penyedia dan model pembuatan video
    - Memahami parameter alat video_generate
summary: Buat video dari teks, gambar, atau video yang sudah ada menggunakan 12 backend penyedia
title: Pembuatan Video
x-i18n:
    generated_at: "2026-04-07T09:20:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf1224c59a5f1217f56cf2001870aca710a09268677dcd12aad2efbe476e47b7
    source_path: tools/video-generation.md
    workflow: 15
---

# Pembuatan Video

Agen OpenClaw dapat membuat video dari prompt teks, gambar referensi, atau video yang sudah ada. Dua belas backend penyedia didukung, masing-masing dengan opsi model, mode input, dan kumpulan fitur yang berbeda. Agen memilih penyedia yang tepat secara otomatis berdasarkan konfigurasi Anda dan API key yang tersedia.

<Note>
Alat `video_generate` hanya muncul ketika setidaknya satu penyedia pembuatan video tersedia. Jika Anda tidak melihatnya di alat agen Anda, atur API key penyedia atau konfigurasikan `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw memperlakukan pembuatan video sebagai tiga mode runtime:

- `generate` untuk permintaan text-to-video tanpa media referensi
- `imageToVideo` ketika permintaan menyertakan satu atau lebih gambar referensi
- `videoToVideo` ketika permintaan menyertakan satu atau lebih video referensi

Penyedia dapat mendukung subset mana pun dari mode tersebut. Alat memvalidasi
mode aktif sebelum pengiriman dan melaporkan mode yang didukung dalam `action=list`.

## Mulai cepat

1. Atur API key untuk penyedia yang didukung:

```bash
export GEMINI_API_KEY="your-key"
```

2. Secara opsional pin model default:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Minta agen:

> Buat video sinematik berdurasi 5 detik tentang lobster ramah yang berselancar saat matahari terbenam.

Agen memanggil `video_generate` secara otomatis. Tidak diperlukan allowlist alat.

## Apa yang terjadi saat Anda membuat video

Pembuatan video bersifat asynchronous. Saat agen memanggil `video_generate` dalam sebuah sesi:

1. OpenClaw mengirimkan permintaan ke penyedia dan segera mengembalikan ID tugas.
2. Penyedia memproses pekerjaan di latar belakang (biasanya 30 detik hingga 5 menit tergantung penyedia dan resolusi).
3. Ketika video siap, OpenClaw membangunkan sesi yang sama dengan event penyelesaian internal.
4. Agen memposting video yang sudah selesai kembali ke percakapan asli.

Saat sebuah pekerjaan sedang berjalan, panggilan `video_generate` duplikat dalam sesi yang sama mengembalikan status tugas saat ini alih-alih memulai pembuatan baru. Gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk memeriksa progres dari CLI.

Di luar run agen berbasis sesi (misalnya, pemanggilan alat langsung), alat akan menggunakan fallback ke pembuatan inline dan mengembalikan path media akhir dalam giliran yang sama.

### Siklus hidup tugas

Setiap permintaan `video_generate` bergerak melalui empat status:

1. **queued** -- tugas dibuat, menunggu penyedia menerimanya.
2. **running** -- penyedia sedang memproses (biasanya 30 detik hingga 5 menit tergantung penyedia dan resolusi).
3. **succeeded** -- video siap; agen bangun dan mempostingnya ke percakapan.
4. **failed** -- error penyedia atau timeout; agen bangun dengan detail error.

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Pencegahan duplikasi: jika tugas video sudah `queued` atau `running` untuk sesi saat ini, `video_generate` mengembalikan status tugas yang ada alih-alih memulai yang baru. Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu pembuatan baru.

## Penyedia yang didukung

| Penyedia | Model default                   | Teks | Referensi gambar  | Referensi video | API key                                  |
| -------- | ------------------------------- | ---- | ----------------- | --------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | Ya   | Ya (URL remote)   | Ya (URL remote) | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | Ya   | 1 gambar          | Tidak           | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | Ya   | 1 gambar          | Tidak           | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | Ya   | 1 gambar          | Tidak           | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | Ya   | 1 gambar          | 1 video         | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | Ya   | 1 gambar          | Tidak           | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | Ya   | 1 gambar          | 1 video         | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | Ya   | Ya (URL remote)   | Ya (URL remote) | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | Ya   | 1 gambar          | 1 video         | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | Ya   | 1 gambar          | Tidak           | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | Ya   | 1 gambar (`kling`) | Tidak          | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | Ya   | 1 gambar          | 1 video         | `XAI_API_KEY`                            |

Beberapa penyedia menerima env var API key tambahan atau alternatif. Lihat [halaman penyedia](#related) masing-masing untuk detail.

Jalankan `video_generate action=list` untuk memeriksa penyedia, model, dan
mode runtime yang tersedia saat runtime.

### Matriks kapabilitas yang dideklarasikan

Ini adalah kontrak mode eksplisit yang digunakan oleh `video_generate`, pengujian kontrak,
dan shared live sweep.

| Penyedia | `generate` | `imageToVideo` | `videoToVideo` | Jalur live bersama saat ini                                                                                                              |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` remote                            |
| BytePlus | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Ya         | Ya             | Tidak          | Tidak ada dalam sweep bersama; cakupan khusus workflow berada pada pengujian Comfy                                                      |
| fal      | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| Google   | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena sweep Gemini/Veo berbasis buffer saat ini tidak menerima input itu   |
| MiniMax  | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` bersama dilewati karena jalur org/input ini saat ini memerlukan akses inpaint/remix di sisi penyedia |
| Qwen     | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini memerlukan URL video `http(s)` remote                            |
| Runway   | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` hanya berjalan ketika model yang dipilih adalah `runway/gen4_aleph`                          |
| Together | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Ya         | Ya             | Tidak          | `generate`; `imageToVideo` bersama dilewati karena `veo3` bawaan hanya untuk teks dan `kling` bawaan memerlukan URL gambar remote      |
| xAI      | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` dilewati karena penyedia ini saat ini memerlukan URL MP4 remote                              |

## Parameter alat

### Wajib

| Parameter | Tipe   | Deskripsi                                                                  |
| --------- | ------ | -------------------------------------------------------------------------- |
| `prompt`  | string | Deskripsi teks video yang akan dibuat (wajib untuk `action: "generate"`)   |

### Input konten

| Parameter | Tipe     | Deskripsi                             |
| --------- | -------- | ------------------------------------- |
| `image`   | string   | Satu gambar referensi (path atau URL) |
| `images`  | string[] | Beberapa gambar referensi (hingga 5)  |
| `video`   | string   | Satu video referensi (path atau URL)  |
| `videos`  | string[] | Beberapa video referensi (hingga 4)   |

### Kontrol gaya

| Parameter         | Tipe    | Deskripsi                                                             |
| ----------------- | ------- | --------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`  |
| `resolution`      | string  | `480P`, `720P`, `768P`, atau `1080P`                                  |
| `durationSeconds` | number  | Durasi target dalam detik (dibulatkan ke nilai terdekat yang didukung penyedia) |
| `size`            | string  | Petunjuk ukuran saat penyedia mendukungnya                            |
| `audio`           | boolean | Aktifkan audio yang dihasilkan jika didukung                          |
| `watermark`       | boolean | Alihkan watermark penyedia jika didukung                              |

### Lanjutan

| Parameter  | Tipe   | Deskripsi                                      |
| ---------- | ------ | ---------------------------------------------- |
| `action`   | string | `"generate"` (default), `"status"`, atau `"list"` |
| `model`    | string | Override penyedia/model (mis. `runway/gen4.5`) |
| `filename` | string | Petunjuk nama file output                      |

Tidak semua penyedia mendukung semua parameter. OpenClaw sudah menormalkan durasi ke nilai terdekat yang didukung penyedia, dan juga memetakan ulang petunjuk geometri yang diterjemahkan seperti ukuran-ke-aspect-ratio saat penyedia fallback mengekspos permukaan kontrol yang berbeda. Override yang benar-benar tidak didukung diabaikan berdasarkan best-effort dan dilaporkan sebagai peringatan dalam hasil alat. Batas kapabilitas yang ketat (seperti terlalu banyak input referensi) gagal sebelum pengiriman.

Hasil alat melaporkan pengaturan yang diterapkan. Saat OpenClaw memetakan ulang durasi atau geometri selama fallback penyedia, nilai `durationSeconds`, `size`, `aspectRatio`, dan `resolution` yang dikembalikan mencerminkan apa yang dikirim, dan `details.normalization` menangkap terjemahan dari yang diminta ke yang diterapkan.

Input referensi juga memilih mode runtime:

- Tanpa media referensi: `generate`
- Referensi gambar apa pun: `imageToVideo`
- Referensi video apa pun: `videoToVideo`

Referensi gambar dan video campuran bukan permukaan kapabilitas bersama yang stabil.
Sebaiknya gunakan satu jenis referensi per permintaan.

## Aksi

- **generate** (default) -- membuat video dari prompt yang diberikan dan input referensi opsional.
- **status** -- memeriksa status tugas video yang sedang berjalan untuk sesi saat ini tanpa memulai pembuatan lain.
- **list** -- menampilkan penyedia, model, dan kapabilitasnya yang tersedia.

## Pemilihan model

Saat membuat video, OpenClaw me-resolve model dengan urutan berikut:

1. **Parameter alat `model`** -- jika agen menentukannya dalam pemanggilan.
2. **`videoGenerationModel.primary`** -- dari config.
3. **`videoGenerationModel.fallbacks`** -- dicoba secara berurutan.
4. **Deteksi otomatis** -- menggunakan penyedia yang memiliki auth valid, dimulai dari penyedia default saat ini, lalu penyedia lainnya dalam urutan alfabetis.

Jika sebuah penyedia gagal, kandidat berikutnya akan dicoba secara otomatis. Jika semua kandidat gagal, error akan mencakup detail dari setiap percobaan.

Set `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin
pembuatan video hanya menggunakan entri `model`, `primary`, dan `fallbacks`
yang eksplisit.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Catatan penyedia

| Penyedia | Catatan                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba  | Menggunakan endpoint asynchronous DashScope/Model Studio. Gambar dan video referensi harus berupa URL `http(s)` remote.                                     |
| BytePlus | Hanya satu gambar referensi.                                                                                                                                 |
| ComfyUI  | Eksekusi lokal atau cloud berbasis workflow. Mendukung text-to-video dan image-to-video melalui graph yang dikonfigurasi.                                  |
| fal      | Menggunakan alur berbasis queue untuk pekerjaan yang berjalan lama. Hanya satu gambar referensi.                                                            |
| Google   | Menggunakan Gemini/Veo. Mendukung satu gambar atau satu video referensi.                                                                                    |
| MiniMax  | Hanya satu gambar referensi.                                                                                                                                 |
| OpenAI   | Hanya override `size` yang diteruskan. Override gaya lain (`aspectRatio`, `resolution`, `audio`, `watermark`) diabaikan dengan peringatan.                |
| Qwen     | Backend DashScope yang sama dengan Alibaba. Input referensi harus berupa URL `http(s)` remote; file lokal ditolak di awal.                                 |
| Runway   | Mendukung file lokal melalui data URI. Video-to-video memerlukan `runway/gen4_aleph`. Run hanya teks mengekspos aspect ratio `16:9` dan `9:16`.          |
| Together | Hanya satu gambar referensi.                                                                                                                                 |
| Vydra    | Menggunakan `https://www.vydra.ai/api/v1` secara langsung untuk menghindari pengalihan yang menghapus auth. `veo3` dibundel hanya sebagai text-to-video; `kling` memerlukan URL gambar remote. |
| xAI      | Mendukung alur text-to-video, image-to-video, dan edit/extend video remote.                                                                                 |

## Mode kapabilitas penyedia

Kontrak pembuatan video bersama kini memungkinkan penyedia mendeklarasikan
kapabilitas spesifik mode alih-alih hanya batas agregat datar. Implementasi penyedia
baru sebaiknya memilih blok mode eksplisit:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Field agregat datar seperti `maxInputImages` dan `maxInputVideos` tidak
cukup untuk mengiklankan dukungan mode transformasi. Penyedia sebaiknya mendeklarasikan
`generate`, `imageToVideo`, dan `videoToVideo` secara eksplisit agar live test,
pengujian kontrak, dan alat `video_generate` bersama dapat memvalidasi dukungan mode
secara deterministik.

## Live test

Cakupan live opt-in untuk penyedia bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media video
```

File live ini memuat env var penyedia yang hilang dari `~/.profile`, lebih memilih
API key live/env daripada profil auth yang tersimpan secara default, dan menjalankan
mode yang dideklarasikan yang dapat diuji dengan aman menggunakan media lokal:

- `generate` untuk setiap penyedia dalam sweep
- `imageToVideo` saat `capabilities.imageToVideo.enabled`
- `videoToVideo` saat `capabilities.videoToVideo.enabled` dan penyedia/model
  menerima input video lokal berbasis buffer dalam sweep bersama

Saat ini jalur live `videoToVideo` bersama mencakup:

- `runway` hanya saat Anda memilih `runway/gen4_aleph`

## Konfigurasi

Atur model pembuatan video default dalam config OpenClaw Anda:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Atau melalui CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Terkait

- [Tools Overview](/id/tools)
- [Background Tasks](/id/automation/tasks) -- pelacakan tugas untuk pembuatan video asynchronous
- [Alibaba Model Studio](/id/providers/alibaba)
- [BytePlus](/id/concepts/model-providers#byteplus-international)
- [ComfyUI](/id/providers/comfy)
- [fal](/id/providers/fal)
- [Google (Gemini)](/id/providers/google)
- [MiniMax](/id/providers/minimax)
- [OpenAI](/id/providers/openai)
- [Qwen](/id/providers/qwen)
- [Runway](/id/providers/runway)
- [Together AI](/id/providers/together)
- [Vydra](/id/providers/vydra)
- [xAI](/id/providers/xai)
- [Configuration Reference](/id/gateway/configuration-reference#agent-defaults)
- [Models](/id/concepts/models)
