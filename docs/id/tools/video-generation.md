---
read_when:
    - Menghasilkan video melalui agen
    - Mengonfigurasi provider dan model pembuatan video
    - Memahami parameter tool `video_generate`
summary: Hasilkan video dari teks, gambar, atau video yang sudah ada menggunakan 14 backend provider
title: Pembuatan video
x-i18n:
    generated_at: "2026-04-25T13:59:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a16c56939967a6268e62a267598fe03d2eb3195384ad805652498004fdaf886
    source_path: tools/video-generation.md
    workflow: 15
---

Agen OpenClaw dapat menghasilkan video dari prompt teks, gambar referensi, atau video yang sudah ada. Empat belas backend provider didukung, masing-masing dengan opsi model, mode input, dan kumpulan fitur yang berbeda. Agen memilih provider yang tepat secara otomatis berdasarkan konfigurasi Anda dan API key yang tersedia.

<Note>
Tool `video_generate` hanya muncul saat setidaknya satu provider pembuatan video tersedia. Jika Anda tidak melihatnya di tool agen Anda, setel API key provider atau konfigurasikan `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw memperlakukan pembuatan video sebagai tiga mode runtime:

- `generate` untuk permintaan text-to-video tanpa media referensi
- `imageToVideo` saat permintaan menyertakan satu atau lebih gambar referensi
- `videoToVideo` saat permintaan menyertakan satu atau lebih video referensi

Provider dapat mendukung subset apa pun dari mode-mode tersebut. Tool memvalidasi mode
aktif sebelum pengiriman dan melaporkan mode yang didukung dalam `action=list`.

## Memulai dengan cepat

1. Setel API key untuk provider yang didukung:

```bash
export GEMINI_API_KEY="your-key"
```

2. Opsional, sematkan model default:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Minta agen:

> Hasilkan video sinematik 5 detik tentang lobster ramah yang berselancar saat matahari terbenam.

Agen memanggil `video_generate` secara otomatis. Tidak perlu allowlisting tool.

## Apa yang terjadi saat Anda menghasilkan video

Pembuatan video bersifat asynchronous. Saat agen memanggil `video_generate` dalam suatu sesi:

1. OpenClaw mengirim permintaan ke provider dan segera mengembalikan ID task.
2. Provider memproses job di latar belakang (biasanya 30 detik hingga 5 menit tergantung provider dan resolusi).
3. Saat video siap, OpenClaw membangunkan sesi yang sama dengan event penyelesaian internal.
4. Agen memposting video yang telah selesai kembali ke percakapan asli.

Saat job sedang berjalan, pemanggilan `video_generate` duplikat dalam sesi yang sama mengembalikan status task saat ini alih-alih memulai pembuatan lain. Gunakan `openclaw tasks list` atau `openclaw tasks show <taskId>` untuk memeriksa progres dari CLI.

Di luar run agen yang didukung sesi (misalnya, pemanggilan tool langsung), tool fallback ke pembuatan inline dan mengembalikan path media final pada turn yang sama.

File video yang dihasilkan disimpan di bawah penyimpanan media yang dikelola OpenClaw saat
provider mengembalikan byte. Batas simpan video hasil default mengikuti batas media video,
dan `agents.defaults.mediaMaxMb` menaikkannya untuk render yang lebih besar.
Saat provider juga mengembalikan URL output yang di-host, OpenClaw dapat mengirim URL tersebut
alih-alih menggagalkan task jika persistensi lokal menolak file yang terlalu besar.

### Siklus hidup task

Setiap permintaan `video_generate` bergerak melalui empat state:

1. **queued** -- task dibuat, menunggu provider menerimanya.
2. **running** -- provider sedang memproses (biasanya 30 detik hingga 5 menit tergantung provider dan resolusi).
3. **succeeded** -- video siap; agen bangun dan mempostingnya ke percakapan.
4. **failed** -- error provider atau timeout; agen bangun dengan detail error.

Periksa status dari CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Pencegahan duplikasi: jika task video sudah `queued` atau `running` untuk sesi saat ini, `video_generate` mengembalikan status task yang ada alih-alih memulai yang baru. Gunakan `action: "status"` untuk memeriksa secara eksplisit tanpa memicu pembuatan baru.

## Provider yang didukung

| Provider              | Model default                   | Teks | Referensi gambar                                      | Referensi video  | API key                                  |
| --------------------- | ------------------------------- | ---- | ----------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Ya   | Ya (URL remote)                                       | Ya (URL remote)  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Ya   | Hingga 2 gambar (hanya model I2V; frame pertama + terakhir) | Tidak         | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Ya   | Hingga 2 gambar (frame pertama + terakhir via role)   | Tidak            | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Ya   | Hingga 9 gambar referensi                             | Hingga 3 video   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Ya   | 1 gambar                                              | Tidak            | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Ya   | 1 gambar                                              | Tidak            | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Ya   | 1 gambar                                              | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Ya   | 1 gambar                                              | Tidak            | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Ya   | 1 gambar                                              | 1 video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Ya   | Ya (URL remote)                                       | Ya (URL remote)  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Ya   | 1 gambar                                              | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Ya   | 1 gambar                                              | Tidak            | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Ya   | 1 gambar (`kling`)                                    | Tidak            | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Ya   | 1 gambar                                              | 1 video          | `XAI_API_KEY`                            |

Beberapa provider menerima variabel env API key tambahan atau alternatif. Lihat [halaman provider](#related) masing-masing untuk detail.

Jalankan `video_generate action=list` untuk memeriksa provider, model, dan
mode runtime yang tersedia saat runtime.

### Matriks kemampuan yang dideklarasikan

Ini adalah kontrak mode eksplisit yang digunakan oleh `video_generate`, uji kontrak,
dan shared live sweep.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Lajur live bersama saat ini                                                                                                              |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` dilewati karena provider ini memerlukan URL video remote `http(s)`                           |
| BytePlus | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Ya         | Ya             | Tidak          | Tidak ada di shared sweep; cakupan khusus workflow ada bersama uji Comfy                                                                 |
| fal      | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| Google   | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; shared `videoToVideo` dilewati karena sweep Gemini/Veo berbasis buffer saat ini tidak menerima input itu    |
| MiniMax  | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; shared `videoToVideo` dilewati karena jalur org/input ini saat ini memerlukan akses inpaint/remix sisi provider |
| Qwen     | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` dilewati karena provider ini memerlukan URL video remote `http(s)`                           |
| Runway   | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` hanya berjalan saat model yang dipilih adalah `runway/gen4_aleph`                            |
| Together | Ya         | Ya             | Tidak          | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Ya         | Ya             | Tidak          | `generate`; shared `imageToVideo` dilewati karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL gambar remote             |
| xAI      | Ya         | Ya             | Ya             | `generate`, `imageToVideo`; `videoToVideo` dilewati karena provider ini saat ini memerlukan URL MP4 remote                              |

## Parameter tool

### Wajib

| Parameter | Tipe   | Deskripsi                                                                      |
| --------- | ------ | ------------------------------------------------------------------------------ |
| `prompt`  | string | Deskripsi teks video yang akan dihasilkan (wajib untuk `action: "generate"`) |

### Input konten

| Parameter    | Tipe     | Deskripsi                                                                                                                             |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Gambar referensi tunggal (path atau URL)                                                                                              |
| `images`     | string[] | Beberapa gambar referensi (hingga 9)                                                                                                  |
| `imageRoles` | string[] | Petunjuk role opsional per posisi yang paralel dengan daftar gambar gabungan. Nilai kanonis: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Video referensi tunggal (path atau URL)                                                                                               |
| `videos`     | string[] | Beberapa video referensi (hingga 4)                                                                                                   |
| `videoRoles` | string[] | Petunjuk role opsional per posisi yang paralel dengan daftar video gabungan. Nilai kanonis: `reference_video`                        |
| `audioRef`   | string   | Audio referensi tunggal (path atau URL). Digunakan misalnya untuk musik latar atau referensi suara saat provider mendukung input audio |
| `audioRefs`  | string[] | Beberapa audio referensi (hingga 3)                                                                                                   |
| `audioRoles` | string[] | Petunjuk role opsional per posisi yang paralel dengan daftar audio gabungan. Nilai kanonis: `reference_audio`                        |

Petunjuk role diteruskan ke provider apa adanya. Nilai kanonis berasal dari
union `VideoGenerationAssetRole`, tetapi provider dapat menerima string
role tambahan. Array `*Roles` tidak boleh memiliki entri lebih banyak daripada
daftar referensi yang sesuai; kesalahan off-by-one gagal dengan error yang jelas.
Gunakan string kosong untuk membiarkan slot tidak disetel.

### Kontrol gaya

| Parameter         | Tipe    | Deskripsi                                                                             |
| ----------------- | ------- | ------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, atau `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P`, atau `1080P`                                                  |
| `durationSeconds` | number  | Durasi target dalam detik (dibulatkan ke nilai terdekat yang didukung provider)       |
| `size`            | string  | Petunjuk ukuran saat provider mendukungnya                                            |
| `audio`           | boolean | Aktifkan audio hasil di output saat didukung. Berbeda dari `audioRef*` (input)        |
| `watermark`       | boolean | Aktif/nonaktif watermark provider saat didukung                                       |

`adaptive` adalah sentinel khusus provider: nilainya diteruskan apa adanya ke
provider yang mendeklarasikan `adaptive` dalam kemampuannya (misalnya BytePlus
Seedance menggunakannya untuk mendeteksi rasio secara otomatis dari dimensi
gambar input). Provider yang tidak mendeklarasikannya akan menampilkan nilai tersebut melalui
`details.ignoredOverrides` dalam hasil tool sehingga penghapusannya terlihat.

### Lanjutan

| Parameter         | Tipe   | Deskripsi                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (default), `"status"`, atau `"list"`                                                                                                                                                                                                                                                                                                  |
| `model`           | string | Override provider/model (misalnya `runway/gen4.5`)                                                                                                                                                                                                                                                                                                 |
| `filename`        | string | Petunjuk nama file output                                                                                                                                                                                                                                                                                                                           |
| `timeoutMs`       | number | Timeout permintaan provider opsional dalam milidetik                                                                                                                                                                                                                                                                                               |
| `providerOptions` | object | Opsi khusus provider sebagai objek JSON (misalnya `{"seed": 42, "draft": true}`). Provider yang mendeklarasikan skema bertipe memvalidasi key dan tipenya; key yang tidak dikenal atau ketidaksesuaian menyebabkan kandidat dilewati selama fallback. Provider tanpa skema yang dideklarasikan menerima opsi apa adanya. Jalankan `video_generate action=list` untuk melihat apa yang diterima tiap provider |

Tidak semua provider mendukung semua parameter. OpenClaw sudah menormalkan durasi ke nilai terdekat yang didukung provider, dan juga memetakan ulang petunjuk geometri yang diterjemahkan seperti size-to-aspect-ratio ketika provider fallback mengekspos permukaan kontrol yang berbeda. Override yang benar-benar tidak didukung diabaikan dengan pendekatan best-effort dan dilaporkan sebagai peringatan dalam hasil tool. Batas kemampuan keras (seperti terlalu banyak input referensi) gagal sebelum pengiriman.

Hasil tool melaporkan pengaturan yang diterapkan. Saat OpenClaw memetakan ulang durasi atau geometri selama fallback provider, nilai `durationSeconds`, `size`, `aspectRatio`, dan `resolution` yang dikembalikan mencerminkan apa yang dikirim, dan `details.normalization` menangkap terjemahan dari nilai yang diminta ke nilai yang diterapkan.

Input referensi juga memilih mode runtime:

- Tanpa media referensi: `generate`
- Referensi gambar apa pun: `imageToVideo`
- Referensi video apa pun: `videoToVideo`
- Input audio referensi tidak mengubah mode yang diselesaikan; input tersebut diterapkan di atas mode apa pun yang dipilih oleh referensi gambar/video, dan hanya berfungsi dengan provider yang mendeklarasikan `maxInputAudios`

Referensi gambar dan video campuran bukan permukaan kemampuan bersama yang stabil.
Sebaiknya gunakan satu jenis referensi per permintaan.

#### Fallback dan opsi bertipe

Beberapa pemeriksaan kemampuan diterapkan di lapisan fallback, bukan di
batas tool, sehingga permintaan yang melebihi batas provider utama
masih dapat dijalankan pada fallback yang mampu:

- Jika kandidat aktif tidak mendeklarasikan `maxInputAudios` (atau mendeklarasikannya sebagai
  `0`), kandidat tersebut dilewati saat permintaan berisi referensi audio, dan
  kandidat berikutnya dicoba.
- Jika `maxDurationSeconds` kandidat aktif berada di bawah
  `durationSeconds` yang diminta dan kandidat tidak mendeklarasikan daftar
  `supportedDurationSeconds`, kandidat tersebut dilewati.
- Jika permintaan berisi `providerOptions` dan kandidat aktif
  secara eksplisit mendeklarasikan skema `providerOptions` bertipe, kandidat akan
  dilewati ketika key yang diberikan tidak ada dalam skema atau tipe nilainya tidak
  cocok. Provider yang belum mendeklarasikan skema menerima
  opsi apa adanya (pass-through yang kompatibel ke belakang). Provider dapat
  secara eksplisit memilih keluar dari semua opsi provider dengan mendeklarasikan skema kosong
  (`capabilities.providerOptions: {}`), yang menyebabkan skip yang sama seperti
  ketidaksesuaian tipe.

Alasan skip pertama dalam suatu permintaan dicatat di `warn` sehingga operator dapat melihat
ketika provider utama mereka dilewati; skip berikutnya dicatat di
`debug` untuk menjaga rantai fallback panjang tetap tenang. Jika setiap kandidat dilewati,
error agregat akan menyertakan alasan skip untuk masing-masing kandidat.

## Aksi

- **generate** (default) -- membuat video dari prompt yang diberikan dan input referensi opsional.
- **status** -- memeriksa state task video yang sedang berjalan untuk sesi saat ini tanpa memulai pembuatan lain.
- **list** -- menampilkan provider, model, dan kemampuannya yang tersedia.

## Pemilihan model

Saat menghasilkan video, OpenClaw menyelesaikan model dalam urutan ini:

1. **Parameter tool `model`** -- jika agen menentukannya dalam pemanggilan.
2. **`videoGenerationModel.primary`** -- dari config.
3. **`videoGenerationModel.fallbacks`** -- dicoba sesuai urutan.
4. **Deteksi otomatis** -- menggunakan provider yang memiliki auth valid, dimulai dari provider default saat ini, lalu provider yang tersisa dalam urutan alfabetis.

Jika provider gagal, kandidat berikutnya akan dicoba secara otomatis. Jika semua kandidat gagal, error akan menyertakan detail dari setiap percobaan.

Setel `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin
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

## Catatan provider

<AccordionGroup>
  <Accordion title="Alibaba">
    Menggunakan endpoint async DashScope / Model Studio. Gambar dan video referensi harus berupa URL `http(s)` remote.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    ID provider: `byteplus`.

    Model: `seedance-1-0-pro-250528` (default), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Model T2V (`*-t2v-*`) tidak menerima input gambar; model I2V dan model umum `*-pro-*` mendukung satu gambar referensi (frame pertama). Berikan gambar secara posisional atau setel `role: "first_frame"`. ID model T2V secara otomatis dialihkan ke varian I2V yang sesuai saat gambar diberikan.

    Key `providerOptions` yang didukung: `seed` (number), `draft` (boolean — memaksa 480p), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    Memerlukan Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID provider: `byteplus-seedance15`. Model: `seedance-1-5-pro-251215`.

    Menggunakan API `content[]` terpadu. Mendukung paling banyak 2 gambar input (`first_frame` + `last_frame`). Semua input harus berupa URL `https://` remote. Setel `role: "first_frame"` / `"last_frame"` pada tiap gambar, atau berikan gambar secara posisional.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar input. `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed` (number) diteruskan.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    Memerlukan Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID provider: `byteplus-seedance2`. Model: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Menggunakan API `content[]` terpadu. Mendukung hingga 9 gambar referensi, 3 video referensi, dan 3 audio referensi. Semua input harus berupa URL `https://` remote. Setel `role` pada tiap aset — nilai yang didukung: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` mendeteksi rasio secara otomatis dari gambar input. `audio: true` dipetakan ke `generate_audio`. `providerOptions.seed` (number) diteruskan.

  </Accordion>

  <Accordion title="ComfyUI">
    Eksekusi lokal atau cloud yang digerakkan workflow. Mendukung text-to-video dan image-to-video melalui graph yang dikonfigurasi.
  </Accordion>

  <Accordion title="fal">
    Menggunakan alur yang didukung antrean untuk job yang berjalan lama. Hanya satu gambar referensi.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Mendukung satu gambar atau satu video referensi.
  </Accordion>

  <Accordion title="MiniMax">
    Hanya satu gambar referensi.
  </Accordion>

  <Accordion title="OpenAI">
    Hanya override `size` yang diteruskan. Override gaya lainnya (`aspectRatio`, `resolution`, `audio`, `watermark`) diabaikan dengan peringatan.
  </Accordion>

  <Accordion title="Qwen">
    Backend DashScope yang sama seperti Alibaba. Input referensi harus berupa URL `http(s)` remote; file lokal ditolak sejak awal.
  </Accordion>

  <Accordion title="Runway">
    Mendukung file lokal melalui data URI. Video-to-video memerlukan `runway/gen4_aleph`. Run hanya teks mengekspos rasio aspek `16:9` dan `9:16`.
  </Accordion>

  <Accordion title="Together">
    Hanya satu gambar referensi.
  </Accordion>

  <Accordion title="Vydra">
    Menggunakan `https://www.vydra.ai/api/v1` secara langsung untuk menghindari redirect yang membuang auth. `veo3` bawaan hanya text-to-video; `kling` memerlukan URL gambar remote.
  </Accordion>

  <Accordion title="xAI">
    Mendukung alur text-to-video, image-to-video, dan edit/extend video remote.
  </Accordion>
</AccordionGroup>

## Mode kemampuan provider

Kontrak pembuatan video bersama kini memungkinkan provider mendeklarasikan
kemampuan khusus mode alih-alih hanya batas agregat datar. Implementasi
provider baru sebaiknya lebih memilih blok mode eksplisit:

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
cukup untuk mengiklankan dukungan mode transformasi. Provider harus mendeklarasikan
`generate`, `imageToVideo`, dan `videoToVideo` secara eksplisit agar live tests,
uji kontrak, dan tool `video_generate` bersama dapat memvalidasi dukungan mode
secara deterministik.

## Live tests

Cakupan live opt-in untuk provider bawaan bersama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper repo:

```bash
pnpm test:live:media video
```

File live ini memuat variabel env provider yang hilang dari `~/.profile`, lebih memilih
API key live/env daripada auth profile yang tersimpan secara default, dan menjalankan
smoke yang aman untuk rilis secara default:

- `generate` untuk setiap provider non-FAL dalam sweep
- prompt lobster satu detik
- batas operasi per provider dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` secara default)

FAL bersifat opt-in karena latensi antrean di sisi provider dapat mendominasi waktu rilis:

```bash
pnpm test:live:media video --video-providers fal
```

Setel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transformasi yang dideklarasikan
yang dapat dieksekusi shared sweep dengan aman menggunakan media lokal:

- `imageToVideo` saat `capabilities.imageToVideo.enabled`
- `videoToVideo` saat `capabilities.videoToVideo.enabled` dan provider/model
  menerima input video lokal berbasis buffer dalam shared sweep

Saat ini lajur live `videoToVideo` bersama mencakup:

- `runway` hanya saat Anda memilih `runway/gen4_aleph`

## Konfigurasi

Setel model pembuatan video default di config OpenClaw Anda:

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

- [Ikhtisar Tools](/id/tools)
- [Background Tasks](/id/automation/tasks) -- pelacakan task untuk pembuatan video async
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
- [Referensi Konfigurasi](/id/gateway/config-agents#agent-defaults)
- [Models](/id/concepts/models)
