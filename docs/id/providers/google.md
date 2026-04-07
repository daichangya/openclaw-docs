---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan alur autentikasi kunci API atau OAuth
summary: Penyiapan Google Gemini (kunci API + OAuth, pembuatan gambar, pemahaman media, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-07T09:18:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36cc7c7d8d19f6d4a3fb223af36c8402364fc309d14ffe922bd004203ceb1754
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, serta pembuatan gambar, pemahaman media (gambar/audio/video), dan pencarian web melalui Gemini Grounding.

- Provider: `google`
- Autentikasi: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Provider alternatif: `google-gemini-cli` (OAuth)

## Mulai cepat

1. Tetapkan kunci API:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Tetapkan model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Provider alternatif `google-gemini-cli` menggunakan PKCE OAuth alih-alih kunci API. Ini adalah integrasi tidak resmi; beberapa pengguna melaporkan pembatasan akun. Gunakan dengan risiko Anda sendiri.

- Model default: `google-gemini-cli/gemini-3.1-pro-preview`
- Alias: `gemini-cli`
- Prasyarat instalasi: Gemini CLI lokal tersedia sebagai `gemini`
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Login:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Variabel lingkungan:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Atau varian `GEMINI_CLI_*`.)

Jika permintaan OAuth Gemini CLI gagal setelah login, tetapkan `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` di host gateway lalu coba lagi.

Jika login gagal sebelum alur browser dimulai, pastikan perintah `gemini` lokal sudah terinstal dan ada di `PATH`. OpenClaw mendukung instalasi Homebrew dan instalasi npm global, termasuk tata letak Windows/npm yang umum.

Catatan penggunaan JSON Gemini CLI:

- Teks balasan berasal dari field JSON CLI `response`.
- Penggunaan akan menggunakan fallback ke `stats` saat CLI membiarkan `usage` kosong.
- `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
- Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari `stats.input_tokens - stats.cached`.

## Kemampuan

| Kemampuan              | Didukung          |
| ---------------------- | ----------------- |
| Penyelesaian chat      | Ya                |
| Pembuatan gambar       | Ya                |
| Pembuatan musik        | Ya                |
| Pemahaman gambar       | Ya                |
| Transkripsi audio      | Ya                |
| Pemahaman video        | Ya                |
| Pencarian web (Grounding) | Ya             |
| Thinking/reasoning     | Ya (Gemini 3.1+)  |

## Penggunaan ulang cache Gemini langsung

Untuk menjalankan Gemini API langsung (`api: "google-generative-ai"`), OpenClaw kini meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

- Konfigurasikan per model atau parameter global dengan `cachedContent` atau `cached_content` lama
- Jika keduanya ada, `cachedContent` yang diprioritaskan
- Contoh nilai: `cachedContents/prebuilt-context`
- Penggunaan cache-hit Gemini dinormalisasi menjadi OpenClaw `cacheRead` dari `cachedContentTokenCount` upstream

Contoh:

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## Pembuatan gambar

Provider pembuatan gambar `google` bawaan secara default menggunakan
`google/gemini-3.1-flash-image-preview`.

- Juga mendukung `google/gemini-3-pro-image-preview`
- Generate: hingga 4 gambar per permintaan
- Mode edit: diaktifkan, hingga 5 gambar input
- Kontrol geometri: `size`, `aspectRatio`, dan `resolution`

Provider `google-gemini-cli` yang hanya mendukung OAuth adalah permukaan inferensi teks yang terpisah. Pembuatan gambar, pemahaman media, dan Gemini Grounding tetap berada pada id provider `google`.

Untuk menggunakan Google sebagai provider gambar default:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

Lihat [Image Generation](/id/tools/image-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.

## Pembuatan video

Plugin `google` bawaan juga mendaftarkan pembuatan video melalui tool bersama `video_generate`.

- Model video default: `google/veo-3.1-fast-generate-preview`
- Mode: text-to-video, image-to-video, dan alur referensi satu video
- Mendukung `aspectRatio`, `resolution`, dan `audio`
- Clamp durasi saat ini: **4 hingga 8 detik**

Untuk menggunakan Google sebagai provider video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

Lihat [Video Generation](/id/tools/video-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.

## Pembuatan musik

Plugin `google` bawaan juga mendaftarkan pembuatan musik melalui tool bersama `music_generate`.

- Model musik default: `google/lyria-3-clip-preview`
- Juga mendukung `google/lyria-3-pro-preview`
- Kontrol prompt: `lyrics` dan `instrumental`
- Format output: default `mp3`, serta `wav` pada `google/lyria-3-pro-preview`
- Input referensi: hingga 10 gambar
- Proses yang didukung sesi dilepas melalui alur tugas/status bersama, termasuk `action: "status"`

Untuk menggunakan Google sebagai provider musik default:

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

Lihat [Music Generation](/id/tools/music-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.

## Catatan lingkungan

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GEMINI_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).
