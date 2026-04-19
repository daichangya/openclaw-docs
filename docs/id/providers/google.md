---
read_when:
    - Anda ingin menggunakan model Google Gemini dengan OpenClaw
    - Anda memerlukan alur autentikasi kunci API atau OAuth
summary: Penyiapan Google Gemini (kunci API + OAuth, pembuatan gambar, pemahaman media, TTS, pencarian web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-19T01:11:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
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

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapannya.

<Tabs>
  <Tab title="API key">
    **Paling cocok untuk:** akses API Gemini standar melalui Google AI Studio.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Atau berikan key secara langsung:

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
    Variabel lingkungan `GEMINI_API_KEY` dan `GOOGLE_API_KEY` keduanya didukung. Gunakan mana pun yang sudah Anda konfigurasi.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Paling cocok untuk:** menggunakan kembali login Gemini CLI yang sudah ada melalui PKCE OAuth alih-alih key API terpisah.

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
        tata letak Windows/npm yang umum.
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
    sudah terinstal dan ada di `PATH`.
    </Note>

    Provider `google-gemini-cli` yang hanya OAuth adalah surface inferensi teks
    yang terpisah. Pembuatan gambar, pemahaman media, dan Gemini Grounding tetap berada pada
    id provider `google`.

  </Tab>
</Tabs>

## Kemampuan

| Capability             | Supported                     |
| ---------------------- | ----------------------------- |
| Chat completions       | Ya                            |
| Image generation       | Ya                            |
| Music generation       | Ya                            |
| Text-to-speech         | Ya                            |
| Image understanding    | Ya                            |
| Audio transcription    | Ya                            |
| Video understanding    | Ya                            |
| Web search (Grounding) | Ya                            |
| Thinking/reasoning     | Ya (Gemini 2.5+ / Gemini 3+)  |
| Gemma 4 models         | Ya                            |

<Tip>
Model Gemini 3 menggunakan `thinkingLevel` alih-alih `thinkingBudget`. OpenClaw memetakan
kontrol penalaran untuk alias Gemini 3, Gemini 3.1, dan `gemini-*-latest` ke
`thinkingLevel` sehingga eksekusi default/latensi-rendah tidak mengirim
nilai `thinkingBudget` yang dinonaktifkan.

Model Gemma 4 (misalnya `gemma-4-26b-a4b-it`) mendukung mode thinking. OpenClaw
menulis ulang `thinkingBudget` menjadi `thinkingLevel` Google yang didukung untuk Gemma 4.
Mengatur thinking ke `off` mempertahankan thinking tetap dinonaktifkan alih-alih memetakannya ke
`MINIMAL`.
</Tip>

## Pembuatan gambar

Provider pembuatan gambar `google` bawaan secara default menggunakan
`google/gemini-3.1-flash-image-preview`.

- Juga mendukung `google/gemini-3-pro-image-preview`
- Generate: hingga 4 gambar per permintaan
- Mode edit: diaktifkan, hingga 5 gambar input
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
Lihat [Image Generation](/id/tools/image-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Pembuatan video

Plugin `google` bawaan juga mendaftarkan pembuatan video melalui tool bersama
`video_generate`.

- Model video default: `google/veo-3.1-fast-generate-preview`
- Mode: text-to-video, image-to-video, dan alur referensi video tunggal
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
Lihat [Video Generation](/id/tools/video-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Pembuatan musik

Plugin `google` bawaan juga mendaftarkan pembuatan musik melalui tool bersama
`music_generate`.

- Model musik default: `google/lyria-3-clip-preview`
- Juga mendukung `google/lyria-3-pro-preview`
- Kontrol prompt: `lyrics` dan `instrumental`
- Format output: `mp3` secara default, serta `wav` pada `google/lyria-3-pro-preview`
- Input referensi: hingga 10 gambar
- Eksekusi berbasis sesi dipisahkan melalui alur task/status bersama, termasuk `action: "status"`

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
Lihat [Music Generation](/id/tools/music-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Text-to-speech

Provider speech `google` bawaan menggunakan jalur Gemini API TTS dengan
`gemini-3.1-flash-tts-preview`.

- Suara default: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, atau `GOOGLE_API_KEY`
- Output: WAV untuk lampiran TTS biasa, PCM untuk Talk/telephony
- Output voice note native: tidak didukung pada jalur Gemini API ini karena API mengembalikan PCM, bukan Opus

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

Gemini API TTS menerima tag audio ekspresif dalam tanda kurung siku di teks, seperti
`[whispers]` atau `[laughs]`. Untuk menjaga agar tag tidak muncul di balasan chat yang terlihat sambil
tetap mengirimkannya ke TTS, letakkan tag tersebut di dalam blok `[[tts:text]]...[[/tts:text]]`:

```text
Berikut adalah teks balasan yang bersih.

[[tts:text]][whispers] Berikut adalah versi yang diucapkan.[[/tts:text]]
```

<Note>
Key API Google Cloud Console yang dibatasi ke Gemini API valid untuk
provider ini. Ini bukan jalur Cloud Text-to-Speech API yang terpisah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penggunaan ulang cache Gemini langsung">
    Untuk eksekusi Gemini API langsung (`api: "google-generative-ai"`), OpenClaw
    meneruskan handle `cachedContent` yang dikonfigurasi ke permintaan Gemini.

    - Konfigurasikan parameter per model atau global dengan
      `cachedContent` atau `cached_content` lama
    - Jika keduanya ada, `cachedContent` akan diprioritaskan
    - Contoh nilai: `cachedContents/prebuilt-context`
    - Penggunaan cache-hit Gemini dinormalisasi ke OpenClaw `cacheRead` dari
      upstream `cachedContentTokenCount`

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
    output JSON CLI sebagai berikut:

    - Teks balasan berasal dari field CLI JSON `response`.
    - Usage menggunakan fallback ke `stats` saat CLI membiarkan `usage` kosong.
    - `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.
    - Jika `stats.input` tidak ada, OpenClaw menurunkan token input dari
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
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Parameter tool musik bersama dan pemilihan provider.
  </Card>
</CardGroup>
