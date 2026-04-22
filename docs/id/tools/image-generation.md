---
read_when:
    - Menghasilkan gambar melalui agent
    - Mengonfigurasi provider dan model pembuatan gambar
    - Memahami parameter tool `image_generate`
summary: Hasilkan dan edit gambar menggunakan provider yang dikonfigurasi (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Pembuatan Gambar
x-i18n:
    generated_at: "2026-04-22T04:27:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e365cd23f4f8d8c9ce88d57e65f06ac5ae5285b8b7f9ea37f0b08ab5f6ff7235
    source_path: tools/image-generation.md
    workflow: 15
---

# Pembuatan Gambar

Tool `image_generate` memungkinkan agent membuat dan mengedit gambar menggunakan provider yang Anda konfigurasi. Gambar yang dihasilkan dikirim secara otomatis sebagai lampiran media dalam balasan agent.

<Note>
Tool ini hanya muncul ketika setidaknya satu provider pembuatan gambar tersedia. Jika Anda tidak melihat `image_generate` di tool agent Anda, konfigurasi `agents.defaults.imageGenerationModel` atau siapkan API key provider.
</Note>

## Mulai cepat

1. Setel API key untuk setidaknya satu provider (misalnya `OPENAI_API_KEY` atau `GEMINI_API_KEY`).
2. Secara opsional setel model pilihan Anda:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

3. Minta ke agent: _"Buat gambar maskot lobster yang ramah."_

Agent akan memanggil `image_generate` secara otomatis. Tidak perlu allow-listing tool — tool ini aktif secara default saat provider tersedia.

## Provider yang didukung

| Provider | Model default                    | Dukungan edit                       | API key                                               |
| -------- | -------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | Ya (hingga 5 gambar)                | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | Ya                                  | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                |
| fal      | `fal-ai/flux/dev`                | Ya                                  | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | Ya (referensi subjek)               | `MINIMAX_API_KEY` atau OAuth MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Ya (1 gambar, dikonfigurasi workflow) | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk cloud |
| Vydra    | `grok-imagine`                   | Tidak                               | `VYDRA_API_KEY`                                       |

Gunakan `action: "list"` untuk memeriksa provider dan model yang tersedia saat runtime:

```
/tool image_generate action=list
```

## Parameter tool

| Parameter     | Tipe     | Deskripsi                                                                            |
| ------------- | -------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string   | Prompt pembuatan gambar (wajib untuk `action: "generate"`)                           |
| `action`      | string   | `"generate"` (default) atau `"list"` untuk memeriksa provider                        |
| `model`       | string   | Override provider/model, mis. `openai/gpt-image-2`                                   |
| `image`       | string   | Jalur atau URL gambar referensi tunggal untuk mode edit                              |
| `images`      | string[] | Beberapa gambar referensi untuk mode edit (hingga 5)                                 |
| `size`        | string   | Petunjuk ukuran: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`     |
| `aspectRatio` | string   | Rasio aspek: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Petunjuk resolusi: `1K`, `2K`, atau `4K`                                             |
| `count`       | number   | Jumlah gambar yang akan dihasilkan (1–4)                                             |
| `filename`    | string   | Petunjuk nama file output                                                            |

Tidak semua provider mendukung semua parameter. Saat provider fallback mendukung opsi geometri yang mendekati alih-alih yang diminta secara persis, OpenClaw memetakan ulang ke ukuran, rasio aspek, atau resolusi terdekat yang didukung sebelum pengiriman. Override yang benar-benar tidak didukung tetap dilaporkan dalam hasil tool.

Hasil tool melaporkan pengaturan yang diterapkan. Saat OpenClaw memetakan ulang geometri selama fallback provider, nilai `size`, `aspectRatio`, dan `resolution` yang dikembalikan mencerminkan apa yang benar-benar dikirim, dan `details.normalization` mencatat terjemahan dari permintaan ke yang diterapkan.

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Urutan pemilihan provider

Saat menghasilkan gambar, OpenClaw mencoba provider dalam urutan ini:

1. Parameter **`model`** dari pemanggilan tool (jika agent menentukannya)
2. **`imageGenerationModel.primary`** dari config
3. **`imageGenerationModel.fallbacks`** sesuai urutan
4. **Deteksi otomatis** — hanya menggunakan default provider yang didukung auth:
   - provider default saat ini terlebih dahulu
   - sisa provider pembuatan gambar yang terdaftar menurut urutan provider-id

Jika provider gagal (error auth, rate limit, dll.), kandidat berikutnya dicoba secara otomatis. Jika semuanya gagal, error akan menyertakan detail dari setiap percobaan.

Catatan:

- Deteksi otomatis bersifat sadar-auth. Default provider hanya masuk ke daftar kandidat
  saat OpenClaw benar-benar dapat mengautentikasi provider tersebut.
- Deteksi otomatis aktif secara default. Setel
  `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin pembuatan gambar
  hanya menggunakan entri `model`, `primary`, dan `fallbacks`
  yang eksplisit.
- Gunakan `action: "list"` untuk memeriksa provider yang saat ini terdaftar, model
  defaultnya, dan petunjuk env-var auth.

### Pengeditan gambar

OpenAI, Google, fal, MiniMax, dan ComfyUI mendukung pengeditan gambar referensi. Berikan jalur atau URL gambar referensi:

```
"Buat versi cat air dari foto ini" + image: "/path/to/photo.jpg"
```

OpenAI dan Google mendukung hingga 5 gambar referensi melalui parameter `images`. fal, MiniMax, dan ComfyUI mendukung 1.

### OpenAI `gpt-image-2`

Pembuatan gambar OpenAI default ke `openai/gpt-image-2`. Model
`openai/gpt-image-1` yang lebih lama masih dapat dipilih secara eksplisit, tetapi permintaan
pembuatan dan pengeditan gambar OpenAI baru sebaiknya menggunakan `gpt-image-2`.

`gpt-image-2` mendukung pembuatan gambar dari teks ke gambar dan
pengeditan gambar referensi melalui tool `image_generate` yang sama. OpenClaw meneruskan `prompt`,
`count`, `size`, dan gambar referensi ke OpenAI. OpenAI tidak menerima
`aspectRatio` atau `resolution` secara langsung; bila memungkinkan OpenClaw memetakan itu ke
`size` yang didukung, jika tidak tool akan melaporkannya sebagai override yang diabaikan.

Hasilkan satu gambar lanskap 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Poster editorial yang bersih untuk pembuatan gambar OpenClaw" size=3840x2160 count=1
```

Hasilkan dua gambar persegi:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Dua arah visual untuk ikon aplikasi produktivitas yang tenang" size=1024x1024 count=2
```

Edit satu gambar referensi lokal:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Pertahankan subjek, ganti latar belakang dengan setup studio yang terang" image=/path/to/reference.png size=1024x1536
```

Edit dengan beberapa referensi:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Gabungkan identitas karakter dari gambar pertama dengan palet warna dari gambar kedua" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Pembuatan gambar MiniMax tersedia melalui kedua jalur auth MiniMax bawaan:

- `minimax/image-01` untuk penyiapan API-key
- `minimax-portal/image-01` untuk penyiapan OAuth

## Kapabilitas provider

| Kapabilitas           | OpenAI               | Google               | fal                 | MiniMax                     | ComfyUI                             | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | --------------------------- | ----------------------------------- | ------- |
| Hasilkan              | Ya (hingga 4)        | Ya (hingga 4)        | Ya (hingga 4)       | Ya (hingga 9)               | Ya (output ditentukan workflow)     | Ya (1)  |
| Edit/referensi        | Ya (hingga 5 gambar) | Ya (hingga 5 gambar) | Ya (1 gambar)       | Ya (1 gambar, referensi subjek) | Ya (1 gambar, dikonfigurasi workflow) | Tidak   |
| Kontrol ukuran        | Ya (hingga 4K)       | Ya                   | Ya                  | Tidak                       | Tidak                               | Tidak   |
| Rasio aspek           | Tidak                | Ya                   | Ya (hanya generate) | Ya                          | Tidak                               | Tidak   |
| Resolusi (1K/2K/4K)   | Tidak                | Ya                   | Ya                  | Tidak                       | Tidak                               | Tidak   |

## Terkait

- [Ikhtisar Tools](/id/tools) — semua tool agent yang tersedia
- [fal](/id/providers/fal) — penyiapan provider gambar dan video fal
- [ComfyUI](/id/providers/comfy) — penyiapan workflow ComfyUI lokal dan Comfy Cloud
- [Google (Gemini)](/id/providers/google) — penyiapan provider gambar Gemini
- [MiniMax](/id/providers/minimax) — penyiapan provider gambar MiniMax
- [OpenAI](/id/providers/openai) — penyiapan provider OpenAI Images
- [Vydra](/id/providers/vydra) — penyiapan gambar, video, dan speech Vydra
- [Configuration Reference](/id/gateway/configuration-reference#agent-defaults) — konfigurasi `imageGenerationModel`
- [Models](/id/concepts/models) — konfigurasi model dan failover
