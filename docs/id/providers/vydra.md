---
read_when:
    - Anda menginginkan pembuatan media Vydra di OpenClaw
    - Anda memerlukan panduan penyiapan API key Vydra
summary: Gunakan gambar, video, dan speech Vydra di OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-07T09:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24006a687ed6f9792e7b2b10927cc7ad71c735462a92ce03d5fa7c2b2ee2fcc2
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Plugin Vydra bawaan menambahkan:

- pembuatan gambar melalui `vydra/grok-imagine`
- pembuatan video melalui `vydra/veo3` dan `vydra/kling`
- sintesis speech melalui rute TTS Vydra yang didukung ElevenLabs

OpenClaw menggunakan `VYDRA_API_KEY` yang sama untuk ketiga kapabilitas tersebut.

## URL dasar penting

Gunakan `https://www.vydra.ai/api/v1`.

Host apex Vydra (`https://vydra.ai/api/v1`) saat ini mengalihkan ke `www`. Beberapa klien HTTP menghapus `Authorization` pada pengalihan lintas host tersebut, yang membuat API key yang valid tampak seperti kegagalan auth yang menyesatkan. Plugin bawaan menggunakan URL dasar `www` secara langsung untuk menghindari hal itu.

## Penyiapan

Onboarding interaktif:

```bash
openclaw onboard --auth-choice vydra-api-key
```

Atau set env var secara langsung:

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## Pembuatan gambar

Model gambar default:

- `vydra/grok-imagine`

Set sebagai penyedia gambar default:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "vydra/grok-imagine",
      },
    },
  },
}
```

Dukungan bawaan saat ini hanya untuk text-to-image. Rute edit yang dihosting Vydra mengharapkan URL gambar jarak jauh, dan OpenClaw belum menambahkan bridge upload khusus Vydra di plugin bawaan.

Lihat [Image Generation](/id/tools/image-generation) untuk perilaku alat bersama.

## Pembuatan video

Model video yang terdaftar:

- `vydra/veo3` untuk text-to-video
- `vydra/kling` untuk image-to-video

Set Vydra sebagai penyedia video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "vydra/veo3",
      },
    },
  },
}
```

Catatan:

- `vydra/veo3` dibundel hanya sebagai text-to-video.
- `vydra/kling` saat ini memerlukan referensi URL gambar jarak jauh. Upload file lokal ditolak di awal.
- Rute HTTP `kling` Vydra saat ini tidak konsisten mengenai apakah memerlukan `image_url` atau `video_url`; penyedia bawaan memetakan URL gambar jarak jauh yang sama ke kedua field tersebut.
- Plugin bawaan tetap konservatif dan tidak meneruskan knob style yang tidak terdokumentasi seperti aspect ratio, resolution, watermark, atau audio yang dihasilkan.

Cakupan live khusus penyedia:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_VYDRA_VIDEO=1 \
pnpm test:live -- extensions/vydra/vydra.live.test.ts
```

File live Vydra bawaan sekarang mencakup:

- `vydra/veo3` text-to-video
- `vydra/kling` image-to-video menggunakan URL gambar jarak jauh

Override fixture gambar jarak jauh bila diperlukan:

```bash
export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
```

Lihat [Video Generation](/id/tools/video-generation) untuk perilaku alat bersama.

## Sintesis speech

Set Vydra sebagai penyedia speech:

```json5
{
  messages: {
    tts: {
      provider: "vydra",
      providers: {
        vydra: {
          apiKey: "${VYDRA_API_KEY}",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
      },
    },
  },
}
```

Default:

- model: `elevenlabs/tts`
- id suara: `21m00Tcm4TlvDq8ikWAM`

Plugin bawaan saat ini mengekspos satu suara default yang sudah teruji baik dan mengembalikan file audio MP3.

## Terkait

- [Provider Directory](/id/providers/index)
- [Image Generation](/id/tools/image-generation)
- [Video Generation](/id/tools/video-generation)
