---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda menginginkan autentikasi langganan Codex alih-alih API key
summary: Gunakan OpenAI melalui API key atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-07T09:19:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a2ce1ce5f085fe55ec50b8d20359180b9002c9730820cd5b0e011c3bf807b64
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI menyediakan API pengembang untuk model GPT. Codex mendukung **masuk dengan ChatGPT** untuk akses
langganan atau **masuk dengan API key** untuk akses berbasis penggunaan. Codex cloud memerlukan masuk dengan ChatGPT.
OpenAI secara eksplisit mendukung penggunaan OAuth langganan di alat/alur kerja eksternal seperti OpenClaw.

## Gaya interaksi default

OpenClaw dapat menambahkan overlay prompt kecil khusus OpenAI untuk eksekusi `openai/*` dan
`openai-codex/*`. Secara default, overlay ini membuat asisten tetap hangat,
kolaboratif, ringkas, langsung, dan sedikit lebih ekspresif secara emosional
tanpa menggantikan prompt sistem dasar OpenClaw. Overlay yang ramah ini juga
mengizinkan emoji sesekali ketika terasa alami, sambil tetap menjaga
output secara keseluruhan tetap ringkas.

Kunci config:

`plugins.entries.openai.config.personality`

Nilai yang diizinkan:

- `"friendly"`: default; aktifkan overlay khusus OpenAI.
- `"on"`: alias untuk `"friendly"`.
- `"off"`: nonaktifkan overlay dan gunakan hanya prompt dasar OpenClaw.

Cakupan:

- Berlaku untuk model `openai/*`.
- Berlaku untuk model `openai-codex/*`.
- Tidak memengaruhi provider lain.

Perilaku ini aktif secara default. Tetap gunakan `"friendly"` secara eksplisit jika Anda ingin itu
bertahan dari perubahan config lokal di masa mendatang:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Nonaktifkan overlay prompt OpenAI

Jika Anda menginginkan prompt dasar OpenClaw yang tidak dimodifikasi, set overlay ke `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Anda juga dapat menyetelnya langsung dengan config CLI:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

OpenClaw menormalisasi pengaturan ini secara case-insensitive saat runtime, sehingga nilai seperti
`"Off"` tetap menonaktifkan overlay ramah.

## Opsi A: API key OpenAI (OpenAI Platform)

**Paling cocok untuk:** akses API langsung dan penagihan berbasis penggunaan.
Dapatkan API key Anda dari dashboard OpenAI.

Ringkasan rute:

- `openai/gpt-5.4` = rute API OpenAI Platform langsung
- Memerlukan `OPENAI_API_KEY` (atau config provider OpenAI yang setara)
- Di OpenClaw, masuk ChatGPT/Codex dirutekan melalui `openai-codex/*`, bukan `openai/*`

### Setup CLI

```bash
openclaw onboard --auth-choice openai-api-key
# atau non-interaktif
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Cuplikan config

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

Dokumentasi model API OpenAI saat ini mencantumkan `gpt-5.4` dan `gpt-5.4-pro` untuk penggunaan
API OpenAI langsung. OpenClaw meneruskan keduanya melalui jalur `openai/*` Responses.
OpenClaw dengan sengaja menyembunyikan baris `openai/gpt-5.3-codex-spark` yang sudah usang,
karena panggilan API OpenAI langsung menolaknya dalam traffic langsung.

OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark` pada jalur API OpenAI
langsung. `pi-ai` masih mengirimkan baris bawaan untuk model itu, tetapi permintaan API OpenAI langsung
saat ini menolaknya. Spark diperlakukan hanya untuk Codex di OpenClaw.

## Pembuatan gambar

Plugin `openai` bawaan juga mendaftarkan pembuatan gambar melalui tool bersama
`image_generate`.

- Model gambar default: `openai/gpt-image-1`
- Hasilkan: hingga 4 gambar per permintaan
- Mode edit: aktif, hingga 5 gambar referensi
- Mendukung `size`
- Catatan khusus OpenAI saat ini: OpenClaw belum meneruskan override `aspectRatio` atau
  `resolution` ke OpenAI Images API saat ini

Untuk menggunakan OpenAI sebagai provider gambar default:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Lihat [Image Generation](/id/tools/image-generation) untuk parameter
tool bersama, pemilihan provider, dan perilaku failover.

## Pembuatan video

Plugin `openai` bawaan juga mendaftarkan pembuatan video melalui tool bersama
`video_generate`.

- Model video default: `openai/sora-2`
- Mode: text-to-video, image-to-video, dan alur referensi/edit video tunggal
- Batas saat ini: 1 gambar atau 1 input referensi video
- Catatan khusus OpenAI saat ini: OpenClaw saat ini hanya meneruskan override `size`
  untuk pembuatan video OpenAI native. Override opsional yang tidak didukung
  seperti `aspectRatio`, `resolution`, `audio`, dan `watermark` diabaikan
  dan dilaporkan kembali sebagai peringatan tool.

Untuk menggunakan OpenAI sebagai provider video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Lihat [Video Generation](/id/tools/video-generation) untuk parameter
tool bersama, pemilihan provider, dan perilaku failover.

## Opsi B: langganan OpenAI Code (Codex)

**Paling cocok untuk:** menggunakan akses langganan ChatGPT/Codex alih-alih API key.
Codex cloud memerlukan masuk dengan ChatGPT, sedangkan Codex CLI mendukung masuk dengan ChatGPT atau API key.

Ringkasan rute:

- `openai-codex/gpt-5.4` = rute OAuth ChatGPT/Codex
- Menggunakan masuk dengan ChatGPT/Codex, bukan API key OpenAI Platform langsung
- Batas di sisi provider untuk `openai-codex/*` dapat berbeda dari pengalaman web/aplikasi ChatGPT

### Setup CLI (Codex OAuth)

```bash
# Jalankan Codex OAuth di wizard
openclaw onboard --auth-choice openai-codex

# Atau jalankan OAuth secara langsung
openclaw models auth login --provider openai-codex
```

### Cuplikan config (langganan Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

Dokumentasi Codex OpenAI saat ini mencantumkan `gpt-5.4` sebagai model Codex saat ini. OpenClaw
memetakan itu ke `openai-codex/gpt-5.4` untuk penggunaan OAuth ChatGPT/Codex.

Rute ini sengaja dipisahkan dari `openai/gpt-5.4`. Jika Anda ingin jalur API OpenAI Platform
langsung, gunakan `openai/*` dengan API key. Jika Anda ingin
masuk dengan ChatGPT/Codex, gunakan `openai-codex/*`.

Jika onboarding menggunakan kembali login Codex CLI yang sudah ada, kredensial tersebut tetap
dikelola oleh Codex CLI. Saat kedaluwarsa, OpenClaw membaca ulang sumber Codex eksternal
terlebih dahulu dan, ketika provider dapat menyegarkannya, menulis kembali kredensial yang disegarkan
ke penyimpanan Codex alih-alih mengambil alih kepemilikan dalam salinan terpisah khusus OpenClaw.

Jika akun Codex Anda memiliki hak atas Codex Spark, OpenClaw juga mendukung:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw memperlakukan Codex Spark sebagai khusus Codex. OpenClaw tidak mengekspos jalur API key langsung
`openai/gpt-5.3-codex-spark`.

OpenClaw juga mempertahankan `openai-codex/gpt-5.3-codex-spark` ketika `pi-ai`
menemukannya. Perlakukan ini sebagai bergantung pada entitlement dan eksperimental: Codex Spark terpisah
dari GPT-5.4 `/fast`, dan ketersediaannya bergantung pada akun Codex /
ChatGPT yang sedang masuk.

### Batas jendela konteks Codex

OpenClaw memperlakukan metadata model Codex dan batas konteks runtime sebagai nilai
yang terpisah.

Untuk `openai-codex/gpt-5.4`:

- `contextWindow` native: `1050000`
- batas `contextTokens` runtime default: `272000`

Ini menjaga metadata model tetap akurat sambil mempertahankan jendela runtime default yang lebih kecil
yang dalam praktiknya memiliki karakteristik latensi dan kualitas yang lebih baik.

Jika Anda menginginkan batas efektif yang berbeda, set `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Gunakan `contextWindow` hanya ketika Anda mendeklarasikan atau mengganti metadata model
native. Gunakan `contextTokens` ketika Anda ingin membatasi anggaran konteks runtime.

### Default transport

OpenClaw menggunakan `pi-ai` untuk streaming model. Untuk `openai/*` dan
`openai-codex/*`, transport default adalah `"auto"` (WebSocket-first, lalu fallback
SSE).

Dalam mode `"auto"`, OpenClaw juga mencoba ulang satu kegagalan WebSocket awal yang dapat dicoba ulang
sebelum fallback ke SSE. Mode `"websocket"` yang dipaksakan tetap menampilkan error transport
secara langsung alih-alih menyembunyikannya di balik fallback.

Setelah kegagalan WebSocket saat koneksi atau giliran awal dalam mode `"auto"`, OpenClaw menandai
jalur WebSocket sesi itu sebagai terdegradasi selama sekitar 60 detik dan mengirim
giliran berikutnya melalui SSE selama masa cooldown alih-alih terus berpindah
antartransport.

Untuk endpoint keluarga OpenAI native (`openai/*`, `openai-codex/*`, dan Azure
OpenAI Responses), OpenClaw juga melampirkan status identitas sesi dan giliran yang stabil
ke permintaan agar retry, reconnect, dan fallback SSE tetap selaras dengan
identitas percakapan yang sama. Pada rute keluarga OpenAI native ini, hal ini mencakup
header identitas permintaan sesi/giliran yang stabil plus metadata transport yang sesuai.

OpenClaw juga menormalisasi penghitung penggunaan OpenAI di seluruh varian transport sebelum
mencapai permukaan sesi/status. Traffic Responses OpenAI/Codex native dapat
melaporkan penggunaan sebagai `input_tokens` / `output_tokens` atau
`prompt_tokens` / `completion_tokens`; OpenClaw memperlakukan keduanya sebagai penghitung input
dan output yang sama untuk `/status`, `/usage`, dan log sesi. Ketika traffic
WebSocket native tidak menyertakan `total_tokens` (atau melaporkan `0`), OpenClaw fallback ke
total input + output yang telah dinormalisasi agar tampilan sesi/status tetap terisi.

Anda dapat menyetel `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: paksa SSE
- `"websocket"`: paksa WebSocket
- `"auto"`: coba WebSocket, lalu fallback ke SSE

Untuk `openai/*` (Responses API), OpenClaw juga mengaktifkan warm-up WebSocket secara default
(`openaiWsWarmup: true`) saat transport WebSocket digunakan.

Dokumentasi OpenAI terkait:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Warm-up WebSocket OpenAI

Dokumentasi OpenAI menjelaskan warm-up sebagai opsional. OpenClaw mengaktifkannya secara default untuk
`openai/*` guna mengurangi latensi giliran pertama saat menggunakan transport WebSocket.

### Nonaktifkan warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Aktifkan warm-up secara eksplisit

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Pemrosesan prioritas OpenAI dan Codex

API OpenAI mengekspos pemrosesan prioritas melalui `service_tier=priority`. Di
OpenClaw, set `agents.defaults.models["<provider>/<model>"].params.serviceTier`
untuk meneruskan field tersebut pada endpoint Responses OpenAI/Codex native.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Nilai yang didukung adalah `auto`, `default`, `flex`, dan `priority`.

OpenClaw meneruskan `params.serviceTier` ke permintaan Responses `openai/*`
langsung dan permintaan Codex Responses `openai-codex/*` ketika model tersebut mengarah
ke endpoint OpenAI/Codex native.

Perilaku penting:

- `openai/*` langsung harus menargetkan `api.openai.com`
- `openai-codex/*` harus menargetkan `chatgpt.com/backend-api`
- jika Anda merutekan salah satu provider melalui base URL atau proxy lain, OpenClaw membiarkan `service_tier` apa adanya

### Mode cepat OpenAI

OpenClaw mengekspos toggle mode cepat bersama untuk sesi `openai/*` dan
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Config: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Saat mode cepat diaktifkan, OpenClaw memetakannya ke pemrosesan prioritas OpenAI:

- panggilan Responses `openai/*` langsung ke `api.openai.com` mengirim `service_tier = "priority"`
- panggilan Responses `openai-codex/*` ke `chatgpt.com/backend-api` juga mengirim `service_tier = "priority"`
- nilai `service_tier` payload yang sudah ada dipertahankan
- mode cepat tidak menulis ulang `reasoning` atau `text.verbosity`

Khusus untuk GPT 5.4, setup yang paling umum adalah:

- kirim `/fast on` dalam sesi yang menggunakan `openai/gpt-5.4` atau `openai-codex/gpt-5.4`
- atau set `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- jika Anda juga menggunakan Codex OAuth, set `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true` juga

Contoh:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Override sesi lebih diutamakan daripada config. Menghapus override sesi di UI Sessions
mengembalikan sesi ke default yang dikonfigurasi.

### OpenAI native versus rute yang kompatibel dengan OpenAI

OpenClaw memperlakukan endpoint OpenAI, Codex, dan Azure OpenAI langsung secara berbeda
dari proxy `/v1` generik yang kompatibel dengan OpenAI:

- rute `openai/*`, `openai-codex/*`, dan Azure OpenAI native mempertahankan
  `reasoning: { effort: "none" }` apa adanya saat Anda secara eksplisit menonaktifkan reasoning
- rute keluarga OpenAI native menggunakan mode strict untuk skema tool secara default
- header atribusi OpenClaw tersembunyi (`originator`, `version`, dan
  `User-Agent`) hanya dilampirkan pada host OpenAI native yang terverifikasi
  (`api.openai.com`) dan host Codex native (`chatgpt.com/backend-api`)
- rute OpenAI/Codex native mempertahankan pembentukan permintaan khusus OpenAI seperti
  `service_tier`, Responses `store`, payload kompatibilitas reasoning OpenAI, dan
  petunjuk prompt-cache
- rute bergaya proxy yang kompatibel dengan OpenAI mempertahankan perilaku kompatibilitas yang lebih longgar dan
  tidak memaksakan skema tool strict, pembentukan permintaan khusus native, atau header atribusi OpenAI/Codex tersembunyi

Azure OpenAI tetap berada dalam kelompok perutean native untuk perilaku transport dan kompatibilitas,
tetapi tidak menerima header atribusi OpenAI/Codex tersembunyi.

Ini mempertahankan perilaku OpenAI Responses native saat ini tanpa memaksakan shim kompatibilitas
OpenAI yang lebih lama ke backend `/v1` pihak ketiga.

### Pemadatan sisi server OpenAI Responses

Untuk model OpenAI Responses langsung (`openai/*` menggunakan `api: "openai-responses"` dengan
`baseUrl` pada `api.openai.com`), OpenClaw sekarang secara otomatis mengaktifkan petunjuk payload
pemadatan sisi server OpenAI:

- Memaksa `store: true` (kecuali kompatibilitas model menetapkan `supportsStore: false`)
- Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`

Secara default, `compact_threshold` adalah `70%` dari `contextWindow` model (atau `80000`
jika tidak tersedia).

### Aktifkan pemadatan sisi server secara eksplisit

Gunakan ini ketika Anda ingin memaksa injeksi `context_management` pada model
Responses yang kompatibel, misalnya Azure OpenAI Responses:

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Aktifkan dengan ambang kustom

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Nonaktifkan pemadatan sisi server

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` hanya mengontrol injeksi `context_management`.
Model OpenAI Responses langsung tetap memaksa `store: true` kecuali kompatibilitas menetapkan
`supportsStore: false`.

## Catatan

- Referensi model selalu menggunakan `provider/model` (lihat [/concepts/models](/id/concepts/models)).
- Detail auth + aturan penggunaan ulang ada di [/concepts/oauth](/id/concepts/oauth).
