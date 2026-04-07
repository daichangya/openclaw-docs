---
read_when:
    - Membuat gambar melalui agen
    - Mengonfigurasi provider dan model pembuatan gambar
    - Memahami parameter tool image_generate
summary: Membuat dan mengedit gambar menggunakan provider yang dikonfigurasi (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Pembuatan Gambar
x-i18n:
    generated_at: "2026-04-07T09:20:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f7303c199d46e63e88f5f9567478a1025631afb03cb35f44344c12370365e57
    source_path: tools/image-generation.md
    workflow: 15
---

# Pembuatan Gambar

Tool `image_generate` memungkinkan agen membuat dan mengedit gambar menggunakan provider yang telah Anda konfigurasi. Gambar yang dihasilkan dikirimkan secara otomatis sebagai lampiran media dalam balasan agen.

<Note>
Tool ini hanya muncul ketika setidaknya satu provider pembuatan gambar tersedia. Jika Anda tidak melihat `image_generate` di daftar tool agen Anda, konfigurasikan `agents.defaults.imageGenerationModel` atau siapkan kunci API provider.
</Note>

## Mulai cepat

1. Atur kunci API untuk setidaknya satu provider (misalnya `OPENAI_API_KEY` atau `GEMINI_API_KEY`).
2. Secara opsional atur model pilihan Anda:

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

3. Minta agen: _"Buat gambar maskot lobster yang ramah."_

Agen memanggil `image_generate` secara otomatis. Tidak perlu allow-list tool — tool ini aktif secara default ketika provider tersedia.

## Provider yang didukung

| Provider | Model default                    | Dukungan edit                       | Kunci API                                              |
| -------- | -------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-1`                    | Ya (hingga 5 gambar)                | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Ya                                  | `GEMINI_API_KEY` atau `GOOGLE_API_KEY`                 |
| fal      | `fal-ai/flux/dev`                | Ya                                  | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Ya (referensi subjek)               | `MINIMAX_API_KEY` atau OAuth MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Ya (1 gambar, dikonfigurasi workflow) | `COMFY_API_KEY` atau `COMFY_CLOUD_API_KEY` untuk cloud |
| Vydra    | `grok-imagine`                   | Tidak                               | `VYDRA_API_KEY`                                        |

Gunakan `action: "list"` untuk memeriksa provider dan model yang tersedia saat runtime:

```
/tool image_generate action=list
```

## Parameter tool

| Parameter     | Tipe     | Deskripsi                                                                            |
| ------------- | -------- | ------------------------------------------------------------------------------------ |
| `prompt`      | string   | Prompt pembuatan gambar (wajib untuk `action: "generate"`)                           |
| `action`      | string   | `"generate"` (default) atau `"list"` untuk memeriksa provider                        |
| `model`       | string   | Override provider/model, misalnya `openai/gpt-image-1`                               |
| `image`       | string   | Path atau URL gambar referensi tunggal untuk mode edit                               |
| `images`      | string[] | Beberapa gambar referensi untuk mode edit (hingga 5)                                 |
| `size`        | string   | Petunjuk ukuran: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`     |
| `aspectRatio` | string   | Rasio aspek: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Petunjuk resolusi: `1K`, `2K`, atau `4K`                                             |
| `count`       | number   | Jumlah gambar yang akan dibuat (1–4)                                                 |
| `filename`    | string   | Petunjuk nama file output                                                            |

Tidak semua provider mendukung semua parameter. Ketika provider fallback mendukung opsi geometri yang mirip alih-alih yang diminta secara persis, OpenClaw memetakan ulang ke ukuran, rasio aspek, atau resolusi terdekat yang didukung sebelum pengiriman. Override yang benar-benar tidak didukung tetap dilaporkan dalam hasil tool.

Hasil tool melaporkan pengaturan yang diterapkan. Ketika OpenClaw memetakan ulang geometri selama fallback provider, nilai `size`, `aspectRatio`, dan `resolution` yang dikembalikan mencerminkan apa yang benar-benar dikirim, dan `details.normalization` menangkap penerjemahan dari yang diminta ke yang diterapkan.

## Konfigurasi

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Urutan pemilihan provider

Saat membuat gambar, OpenClaw mencoba provider dalam urutan ini:

1. **Parameter `model`** dari pemanggilan tool (jika agen menentukannya)
2. **`imageGenerationModel.primary`** dari konfigurasi
3. **`imageGenerationModel.fallbacks`** sesuai urutan
4. **Deteksi otomatis** — hanya menggunakan default provider yang didukung autentikasi:
   - provider default saat ini terlebih dahulu
   - provider pembuatan gambar terdaftar lainnya yang tersisa dalam urutan provider-id

Jika sebuah provider gagal (kesalahan autentikasi, rate limit, dll.), kandidat berikutnya dicoba secara otomatis. Jika semuanya gagal, kesalahan akan menyertakan detail dari setiap percobaan.

Catatan:

- Deteksi otomatis sadar autentikasi. Default provider hanya masuk ke daftar kandidat
  ketika OpenClaw benar-benar dapat mengautentikasi provider tersebut.
- Deteksi otomatis aktif secara default. Atur
  `agents.defaults.mediaGenerationAutoProviderFallback: false` jika Anda ingin pembuatan gambar
  hanya menggunakan entri `model`, `primary`, dan `fallbacks`
  yang eksplisit.
- Gunakan `action: "list"` untuk memeriksa provider yang saat ini terdaftar, model
  default mereka, dan petunjuk env-var autentikasi.

### Pengeditan gambar

OpenAI, Google, fal, MiniMax, dan ComfyUI mendukung pengeditan gambar referensi. Berikan path atau URL gambar referensi:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI dan Google mendukung hingga 5 gambar referensi melalui parameter `images`. fal, MiniMax, dan ComfyUI mendukung 1.

Pembuatan gambar MiniMax tersedia melalui kedua jalur autentikasi MiniMax bawaan:

- `minimax/image-01` untuk penyiapan kunci API
- `minimax-portal/image-01` untuk penyiapan OAuth

## Kapabilitas provider

| Kapabilitas          | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Membuat              | Ya (hingga 4)        | Ya (hingga 4)        | Ya (hingga 4)       | Ya (hingga 9)              | Ya (output ditentukan workflow)    | Ya (1)  |
| Edit/referensi       | Ya (hingga 5 gambar) | Ya (hingga 5 gambar) | Ya (1 gambar)       | Ya (1 gambar, ref subjek)  | Ya (1 gambar, dikonfigurasi workflow) | Tidak |
| Kontrol ukuran       | Ya                   | Ya                   | Ya                  | Tidak                      | Tidak                              | Tidak   |
| Rasio aspek          | Tidak                | Ya                   | Ya (hanya membuat)  | Ya                         | Tidak                              | Tidak   |
| Resolusi (1K/2K/4K)  | Tidak                | Ya                   | Ya                  | Tidak                      | Tidak                              | Tidak   |

## Terkait

- [Ikhtisar Tools](/id/tools) — semua tool agen yang tersedia
- [fal](/id/providers/fal) — penyiapan provider gambar dan video fal
- [ComfyUI](/id/providers/comfy) — penyiapan workflow ComfyUI lokal dan Comfy Cloud
- [Google (Gemini)](/id/providers/google) — penyiapan provider gambar Gemini
- [MiniMax](/id/providers/minimax) — penyiapan provider gambar MiniMax
- [OpenAI](/id/providers/openai) — penyiapan provider OpenAI Images
- [Vydra](/id/providers/vydra) — penyiapan gambar, video, dan speech Vydra
- [Referensi Konfigurasi](/id/gateway/configuration-reference#agent-defaults) — konfigurasi `imageGenerationModel`
- [Model](/id/concepts/models) — konfigurasi model dan failover
