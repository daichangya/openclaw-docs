---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan kunci API atau alur autentikasi OAuth
summary: Penyiapan Google Gemini (kunci API + OAuth, pembuatan gambar, pemahaman media, TTS, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-16T09:14:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2d62855f5e80efda758aad71bcaa95c38b1e41761fa1100d47a06c62881419
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Plugin Google menyediakan akses ke model Gemini melalui Google AI Studio, serta
pembuatan gambar, pemahaman media (gambar/audio/video), text-to-speech, dan pencarian web melalui
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` atau `GOOGLE_API_KEY`
- API: Google Gemini API
- Provider alternatif: `google-gemini-cli` (OAuth)

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapan.

<Tabs>
  <Tab title="Kunci API">
    **Terbaik untuk:** akses API Gemini standar melalui Google AI Studio.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Atau berikan kunci secara langsung:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Tetapkan model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Variabel lingkungan `GEMINI_API_KEY` dan `GOOGLE_API_KEY` keduanya didukung. Gunakan mana saja yang sudah Anda konfigurasi.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Terbaik untuk:** menggunakan kembali login Gemini CLI yang sudah ada melalui PKCE OAuth alih-alih kunci API terpisah.

    <Warning>
    Provider `google-gemini-cli` adalah integrasi tidak resmi. Beberapa pengguna
    melaporkan pembatasan akun saat menggunakan OAuth dengan cara ini. Gunakan dengan risiko Anda sendiri.
    </Warning>

    <Steps>
      <Step title="Instal Gemini CLI">
        Perintah lokal `gemini` harus tersedia di `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # atau npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw mendukung instalasi Homebrew dan instalasi npm global, termasuk
        tata letak umum Windows/npm.
      </Step>
      <Step title="Masuk melalui OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Model default: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Variabel lingkungan:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Atau varian `GEMINI_CLI_*`.)

    <Note>
    Jika permintaan OAuth Gemini CLI gagal setelah login, tetapkan `GOOGLE_CLOUD_PROJECT` atau
    `GOOGLE_CLOUD_PROJECT_ID` pada host Gateway lalu coba lagi.
    </Note>

    <Note>
    Jika login gagal sebelum alur browser dimulai, pastikan perintah lokal `gemini`
    terinstal dan ada di `PATH`.
    </Note>

    Provider `google-gemini-cli` yang hanya mendukung OAuth adalah
    surface inferensi teks terpisah. Pembuatan gambar, pemahaman media, dan Gemini Grounding tetap berada pada
    id provider `google`.

  </Tab>
</Tabs>

## Kemampuan

| Kemampuan              | Didukung          |
| ---------------------- | ----------------- |
| Penyelesaian chat      | Ya                |
| Pembuatan gambar       | Ya                |
| Pembuatan musik        | Ya                |
| Text-to-speech         | Ya                |
| Pemahaman gambar       | Ya                |
| Transkripsi audio      | Ya                |
| Pemahaman video        | Ya                |
| Pencarian web (Grounding) | Ya             |
| Thinking/reasoning     | Ya (Gemini 3.1+)  |
| Model Gemma 4          | Ya                |

<Tip>
Model Gemma 4 (misalnya `gemma-4-26b-a4b-it`) mendukung mode thinking. OpenClaw
menulis ulang `thinkingBudget` menjadi `thinkingLevel` Google yang didukung untuk Gemma 4.
Menetapkan thinking ke `off` akan mempertahankan thinking dalam keadaan nonaktif alih-alih memetakannya ke
`MINIMAL`.
</Tip>

## Pembuatan gambar

Provider pembuatan gambar `google` bawaan secara default menggunakan
`google/gemini-3.1-flash-image-preview`.

- Juga mendukung `google/gemini-3-pro-image-preview`
- Hasilkan: hingga 4 gambar per permintaan
- Mode edit: diaktifkan, hingga 5 gambar masukan
- Kontrol geometri: `size`, `aspectRatio`, dan `resolution`

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

<Note>
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
</Note>

## Pembuatan video

Plugin `google` bawaan juga mendaftarkan pembuatan video melalui alat bersama
`video_generate`.

- Model video default: `google/veo-3.1-fast-generate-preview`
- Mode: text-to-video, image-to-video, dan alur referensi satu video
- Mendukung `aspectRatio`, `resolution`, dan `audio`
- Batas durasi saat ini: **4 hingga 8 detik**

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

<Note>
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
</Note>

## Pembuatan musik

Plugin `google` bawaan juga mendaftarkan pembuatan musik melalui alat bersama
`music_generate`.

- Model musik default: `google/lyria-3-clip-preview`
- Juga mendukung `google/lyria-3-pro-preview`
- Kontrol prompt: `lyrics` dan `instrumental`
- Format keluaran: `mp3` secara default, ditambah `wav` pada `google/lyria-3-pro-preview`
- Masukan referensi: hingga 10 gambar
- Proses berbasis sesi dilepas melalui alur tugas/status bersama, termasuk `action: "status"`

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

<Note>
Lihat [Pembuatan Musik](/id/tools/music-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
</Note>

## Text-to-speech

Provider ucapan `google` bawaan menggunakan jalur TTS Google Gemini API dengan
`gemini-3.1-flash-tts-preview`.

- Suara default: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY`
- Keluaran: WAV untuk lampiran TTS biasa, PCM untuk Talk/teleponi
- Keluaran catatan suara native: tidak didukung pada jalur Gemini API ini karena API mengembalikan PCM, bukan Opus

Untuk menggunakan Google sebagai provider TTS default:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Gemini API TTS menerima tag audio ekspresif dalam tanda kurung siku di dalam teks, seperti
`[whispers]` atau `[laughs]`. Agar tag tidak muncul di balasan chat yang terlihat sambil
tetap mengirimkannya ke TTS, letakkan tag tersebut di dalam blok `[[tts:text]]...[[/tts:text]]`:

```text
Berikut adalah teks balasan yang bersih.

[[tts:text]][whispers] Berikut adalah versi yang diucapkan.[[/tts:text]]
```

<Note>
Kunci API Google Cloud Console yang dibatasi untuk Gemini API valid untuk
provider ini. Ini bukan jalur Cloud Text-to-Speech API yang terpisah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penggunaan ulang cache Gemini langsung">
    Untuk proses Gemini API langsung (`api: "google-generative-ai"`), OpenClaw
    meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

    - Konfigurasikan parameter per model atau global dengan
      `cachedContent` atau `cached_content` lama
    - Jika keduanya ada, `cachedContent` yang diprioritaskan
    - Contoh nilai: `cachedContents/prebuilt-context`
    - Penggunaan cache-hit Gemini dinormalisasi menjadi `cacheRead` OpenClaw dari
      `cachedContentTokenCount` upstream

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

  </Accordion>

  <Accordion title="Catatan penggunaan JSON Gemini CLI">
    Saat menggunakan provider OAuth `google-gemini-cli`, OpenClaw menormalisasi
    keluaran JSON CLI sebagai berikut:

    - Teks balasan berasal dari field `response` pada JSON CLI.
    - Penggunaan akan menggunakan `stats` jika CLI membiarkan `usage` kosong.
    - `stats.cached` dinormalisasi menjadi `cacheRead` OpenClaw.
    - Jika `stats.input` tidak ada, OpenClaw menurunkan token masukan dari
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Penyiapan lingkungan dan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `GEMINI_API_KEY`
    tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter alat gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Parameter alat musik bersama dan pemilihan provider.
  </Card>
</CardGroup>
