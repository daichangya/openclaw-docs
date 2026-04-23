---
read_when:
    - Merancang atau memfaktorkan ulang pemahaman media
    - Menyetel prapemrosesan audio/video/gambar masuk
summary: Pemahaman gambar/audio/video masuk (opsional) dengan fallback provider + CLI
title: Pemahaman Media
x-i18n:
    generated_at: "2026-04-23T09:23:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bb2d0eab59d857c2849f329435f8fad3eeff427f7984d011bd5b7d9fd7bf51c
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Pemahaman Media - Masuk (2026-01-17)

OpenClaw dapat **meringkas media masuk** (gambar/audio/video) sebelum pipeline balasan berjalan. Sistem ini mendeteksi secara otomatis saat alat lokal atau key provider tersedia, dan dapat dinonaktifkan atau dikustomisasi. Jika pemahaman dimatikan, model tetap menerima file/URL asli seperti biasa.

Perilaku media yang spesifik vendor didaftarkan oleh plugin vendor, sementara OpenClaw
core memiliki config `tools.media` bersama, urutan fallback, dan integrasi
pipeline balasan.

## Tujuan

- Opsional: mencerna media masuk lebih dulu menjadi teks singkat untuk routing yang lebih cepat + parsing perintah yang lebih baik.
- Mempertahankan pengiriman media asli ke model (selalu).
- Mendukung **API provider** dan **fallback CLI**.
- Mengizinkan beberapa model dengan fallback berurutan (error/ukuran/timeout).

## Perilaku tingkat tinggi

1. Kumpulkan lampiran masuk (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Untuk setiap capability yang diaktifkan (gambar/audio/video), pilih lampiran sesuai kebijakan (default: **pertama**).
3. Pilih entri model pertama yang memenuhi syarat (ukuran + capability + auth).
4. Jika model gagal atau media terlalu besar, **fallback ke entri berikutnya**.
5. Jika berhasil:
   - `Body` menjadi blok `[Image]`, `[Audio]`, atau `[Video]`.
   - Audio menetapkan `{{Transcript}}`; parsing perintah menggunakan teks caption jika ada,
     jika tidak menggunakan transkrip.
   - Caption dipertahankan sebagai `User text:` di dalam blok.

Jika pemahaman gagal atau dinonaktifkan, **alur balasan tetap berlanjut** dengan body + lampiran asli.

## Ringkasan config

`tools.media` mendukung **model bersama** plus override per-capability:

- `tools.media.models`: daftar model bersama (gunakan `capabilities` untuk pembatasan).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - default (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - override provider (`baseUrl`, `headers`, `providerOptions`)
  - opsi audio Deepgram melalui `tools.media.audio.providerOptions.deepgram`
  - kontrol echo transkrip audio (`echoTranscript`, default `false`; `echoFormat`)
  - daftar `models` **per-capability opsional** (diprioritaskan sebelum model bersama)
  - kebijakan `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (pembatasan opsional berdasarkan channel/chatType/session key)
- `tools.media.concurrency`: jumlah maksimum run capability serentak (default **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* daftar bersama */
      ],
      image: {
        /* override opsional */
      },
      audio: {
        /* override opsional */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* override opsional */
      },
    },
  },
}
```

### Entri model

Setiap entri `models[]` dapat berupa **provider** atau **CLI**:

```json5
{
  type: "provider", // default jika dihilangkan
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // opsional, digunakan untuk entri multi‑modal
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

Template CLI juga dapat menggunakan:

- `{{MediaDir}}` (direktori yang berisi file media)
- `{{OutputDir}}` (direktori scratch yang dibuat untuk run ini)
- `{{OutputBase}}` (path dasar file scratch, tanpa ekstensi)

## Default dan batas

Default yang direkomendasikan:

- `maxChars`: **500** untuk gambar/video (singkat, ramah perintah)
- `maxChars`: **tidak disetel** untuk audio (transkrip penuh kecuali Anda menetapkan batas)
- `maxBytes`:
  - gambar: **10MB**
  - audio: **20MB**
  - video: **50MB**

Aturan:

- Jika media melebihi `maxBytes`, model tersebut dilewati dan **model berikutnya dicoba**.
- File audio yang lebih kecil dari **1024 byte** diperlakukan sebagai kosong/rusak dan dilewati sebelum transkripsi provider/CLI.
- Jika model mengembalikan lebih dari `maxChars`, output dipangkas.
- `prompt` default ke “Describe the {media}.” yang sederhana plus panduan `maxChars` (hanya gambar/video).
- Jika model gambar utama aktif sudah mendukung vision secara native, OpenClaw
  melewati blok ringkasan `[Image]` dan langsung meneruskan gambar asli ke
  model.
- Permintaan eksplisit `openclaw infer image describe --model <provider/model>`
  berbeda: ini menjalankan provider/model yang mampu gambar tersebut secara langsung, termasuk
  ref Ollama seperti `ollama/qwen2.5vl:7b`.
- Jika `<capability>.enabled: true` tetapi tidak ada model yang dikonfigurasi, OpenClaw mencoba
  **model balasan aktif** saat providernya mendukung capability tersebut.

### Deteksi otomatis pemahaman media (default)

Jika `tools.media.<capability>.enabled` **tidak** disetel ke `false` dan Anda belum
mengonfigurasi model, OpenClaw mendeteksi otomatis dalam urutan ini dan **berhenti pada opsi pertama
yang berfungsi**:

1. **Model balasan aktif** saat providernya mendukung capability tersebut.
2. Ref primary/fallback **`agents.defaults.imageModel`** (hanya gambar).
3. **CLI lokal** (hanya audio; jika terinstal)
   - `sherpa-onnx-offline` (memerlukan `SHERPA_ONNX_MODEL_DIR` dengan encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; menggunakan `WHISPER_CPP_MODEL` atau model tiny bawaan)
   - `whisper` (CLI Python; mengunduh model secara otomatis)
4. **Gemini CLI** (`gemini`) menggunakan `read_many_files`
5. **Auth provider**
   - Entri `models.providers.*` yang dikonfigurasi dan mendukung capability tersebut
     dicoba sebelum urutan fallback bawaan.
   - Provider config khusus gambar dengan model yang mampu gambar mendaftar otomatis untuk
     pemahaman media bahkan saat mereka bukan plugin vendor bawaan.
   - Pemahaman gambar Ollama tersedia saat dipilih secara eksplisit, misalnya melalui
     `agents.defaults.imageModel` atau
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Urutan fallback bawaan:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Gambar: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Untuk menonaktifkan deteksi otomatis, setel:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Catatan: Deteksi biner bersifat best-effort di macOS/Linux/Windows; pastikan CLI ada di `PATH` (kami me-resolve `~`), atau setel model CLI eksplisit dengan path perintah lengkap.

### Dukungan lingkungan proxy (model provider)

Saat pemahaman media **audio** dan **video** berbasis provider diaktifkan, OpenClaw
menghormati variabel lingkungan proxy keluar standar untuk panggilan HTTP provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jika tidak ada env var proxy yang disetel, pemahaman media menggunakan egress langsung.
Jika nilai proxy malformed, OpenClaw mencatat peringatan dan fallback ke fetch
langsung.

## Capabilities (opsional)

Jika Anda menetapkan `capabilities`, entri hanya berjalan untuk jenis media tersebut. Untuk daftar
bersama, OpenClaw dapat menyimpulkan default:

- `openai`, `anthropic`, `minimax`: **gambar**
- `minimax-portal`: **gambar**
- `moonshot`: **gambar + video**
- `openrouter`: **gambar**
- `google` (Gemini API): **gambar + audio + video**
- `qwen`: **gambar + video**
- `mistral`: **audio**
- `zai`: **gambar**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Katalog `models.providers.<id>.models[]` apa pun dengan model yang mampu gambar:
  **gambar**

Untuk entri CLI, **setel `capabilities` secara eksplisit** agar tidak terjadi kecocokan yang mengejutkan.
Jika Anda menghilangkan `capabilities`, entri memenuhi syarat untuk daftar tempat entri tersebut muncul.

## Matriks dukungan provider (integrasi OpenClaw)

| Capability | Integrasi provider                                                                   | Catatan                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Gambar     | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provider config | Plugin vendor mendaftarkan dukungan gambar; MiniMax dan OAuth MiniMax sama-sama menggunakan `MiniMax-VL-01`; provider config yang mampu gambar mendaftar otomatis. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                              | Transkripsi provider (Whisper/Deepgram/Gemini/Voxtral).                                                                                   |
| Video      | Google, Qwen, Moonshot                                                               | Pemahaman video provider melalui plugin vendor; pemahaman video Qwen menggunakan endpoint DashScope Standard.                             |

Catatan MiniMax:

- Pemahaman gambar `minimax` dan `minimax-portal` berasal dari provider media
  `MiniMax-VL-01` milik plugin.
- Katalog teks MiniMax bawaan tetap dimulai hanya-teks; entri
  `models.providers.minimax` eksplisit mematerialisasi ref chat M2.7 yang mampu gambar.

## Panduan pemilihan model

- Pilih model generasi terbaru terkuat yang tersedia untuk setiap capability media saat kualitas dan keamanan penting.
- Untuk agen dengan alat yang menangani input tidak tepercaya, hindari model media yang lebih lama/lemah.
- Simpan setidaknya satu fallback per capability untuk ketersediaan (model berkualitas + model lebih cepat/lebih murah).
- Fallback CLI (`whisper-cli`, `whisper`, `gemini`) berguna saat API provider tidak tersedia.
- Catatan `parakeet-mlx`: dengan `--output-dir`, OpenClaw membaca `<output-dir>/<media-basename>.txt` saat format output adalah `txt` (atau tidak ditentukan); format non-`txt` fallback ke stdout.

## Kebijakan lampiran

`attachments` per-capability mengontrol lampiran mana yang diproses:

- `mode`: `first` (default) atau `all`
- `maxAttachments`: membatasi jumlah yang diproses (default **1**)
- `prefer`: `first`, `last`, `path`, `url`

Saat `mode: "all"`, output diberi label `[Image 1/2]`, `[Audio 2/2]`, dll.

Perilaku ekstraksi lampiran file:

- Teks file yang diekstrak dibungkus sebagai **konten eksternal tidak tepercaya** sebelum
  ditambahkan ke prompt media.
- Blok yang diinjeksi menggunakan penanda batas eksplisit seperti
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata
  `Source: External`.
- Jalur ekstraksi lampiran ini sengaja menghilangkan banner panjang
  `SECURITY NOTICE:` agar prompt media tidak membengkak; penanda batas
  dan metadata tetap dipertahankan.
- Jika file tidak memiliki teks yang dapat diekstrak, OpenClaw menginjeksi `[No extractable text]`.
- Jika PDF fallback ke gambar halaman yang dirender dalam jalur ini, prompt media tetap menyimpan
  placeholder `[PDF content rendered to images; images not forwarded to model]`
  karena langkah ekstraksi lampiran ini meneruskan blok teks, bukan gambar PDF hasil render.

## Contoh config

### 1) Daftar model bersama + override

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Hanya Audio + Video (gambar mati)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Pemahaman gambar opsional

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Entri tunggal multi-modal (capability eksplisit)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Output status

Saat pemahaman media berjalan, `/status` menyertakan baris ringkasan singkat:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Ini menampilkan hasil per-capability dan provider/model yang dipilih bila berlaku.

## Catatan

- Pemahaman bersifat **best-effort**. Error tidak memblokir balasan.
- Lampiran tetap diteruskan ke model bahkan saat pemahaman dinonaktifkan.
- Gunakan `scope` untuk membatasi tempat pemahaman berjalan (misalnya hanya DM).

## Dokumentasi terkait

- [Configuration](/id/gateway/configuration)
- [Dukungan Gambar & Media](/id/nodes/images)
