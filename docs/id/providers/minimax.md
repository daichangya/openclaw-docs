---
read_when:
    - Anda menginginkan model MiniMax di OpenClaw
    - Anda memerlukan panduan penyiapan MiniMax
summary: Gunakan model MiniMax di OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:54:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

Penyedia MiniMax di OpenClaw secara default menggunakan **MiniMax M2.7**.

MiniMax juga menyediakan:

- Sintesis suara bawaan melalui T2A v2
- Pemahaman gambar bawaan melalui `MiniMax-VL-01`
- Pembuatan musik bawaan melalui `music-2.6`
- `web_search` bawaan melalui API pencarian MiniMax Coding Plan

Pembagian penyedia:

| Provider ID      | Auth        | Kapabilitas                                                     |
| ---------------- | ----------- | --------------------------------------------------------------- |
| `minimax`        | Kunci API   | Teks, pembuatan gambar, pemahaman gambar, suara, pencarian web |
| `minimax-portal` | OAuth       | Teks, pembuatan gambar, pemahaman gambar, suara                 |

## Katalog bawaan

| Model                    | Tipe              | Deskripsi                                |
| ------------------------ | ----------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (penalaran)  | Model penalaran hosted default           |
| `MiniMax-M2.7-highspeed` | Chat (penalaran)  | Tingkat penalaran M2.7 yang lebih cepat  |
| `MiniMax-VL-01`          | Vision            | Model pemahaman gambar                   |
| `image-01`               | Pembuatan gambar  | Teks-ke-gambar dan penyuntingan gambar-ke-gambar |
| `music-2.6`              | Pembuatan musik   | Model musik default                      |
| `music-2.5`              | Pembuatan musik   | Tingkat pembuatan musik sebelumnya       |
| `music-2.0`              | Pembuatan musik   | Tingkat pembuatan musik lama             |
| `MiniMax-Hailuo-2.3`     | Pembuatan video   | Alur teks-ke-video dan referensi gambar  |

## Memulai

Pilih metode auth yang Anda inginkan dan ikuti langkah-langkah penyiapan.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Paling cocok untuk:** penyiapan cepat dengan MiniMax Coding Plan melalui OAuth, tanpa memerlukan kunci API.

    <Tabs>
      <Tab title="Internasional">
        <Steps>
          <Step title="Jalankan onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Ini mengautentikasi ke `api.minimax.io`.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Jalankan onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Ini mengautentikasi ke `api.minimaxi.com`.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Penyiapan OAuth menggunakan id penyedia `minimax-portal`. Referensi model mengikuti format `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Tautan referral untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Kunci API">
    **Paling cocok untuk:** MiniMax hosted dengan API yang kompatibel dengan Anthropic.

    <Tabs>
      <Tab title="Internasional">
        <Steps>
          <Step title="Jalankan onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Ini mengonfigurasi `api.minimax.io` sebagai URL dasar.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Jalankan onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Ini mengonfigurasi `api.minimaxi.com` sebagai URL dasar.
          </Step>
          <Step title="Verifikasi bahwa model tersedia">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Contoh konfigurasi

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Pada jalur streaming yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking MiniMax secara default kecuali Anda secara eksplisit mengatur `thinking` sendiri. Endpoint streaming MiniMax mengeluarkan `reasoning_content` dalam potongan delta bergaya OpenAI alih-alih blok thinking Anthropic asli, yang dapat membocorkan penalaran internal ke output yang terlihat jika dibiarkan aktif secara implisit.
    </Warning>

    <Note>
    Penyiapan dengan kunci API menggunakan id penyedia `minimax`. Referensi model mengikuti format `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Konfigurasi melalui `openclaw configure`

Gunakan wizard konfigurasi interaktif untuk menyiapkan MiniMax tanpa mengedit JSON:

<Steps>
  <Step title="Luncurkan wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Pilih Model/auth">
    Pilih **Model/auth** dari menu.
  </Step>
  <Step title="Pilih salah satu opsi auth MiniMax">
    Pilih salah satu opsi MiniMax yang tersedia:

    | Pilihan auth | Deskripsi |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internasional (Coding Plan) |
    | `minimax-cn-oauth` | OAuth China (Coding Plan) |
    | `minimax-global-api` | Kunci API internasional |
    | `minimax-cn-api` | Kunci API China |

  </Step>
  <Step title="Pilih model default Anda">
    Pilih model default Anda saat diminta.
  </Step>
</Steps>

## Kapabilitas

### Pembuatan gambar

Plugin MiniMax mendaftarkan model `image-01` untuk tool `image_generate`. Model ini mendukung:

- **Pembuatan teks-ke-gambar** dengan kontrol rasio aspek
- **Penyuntingan gambar-ke-gambar** (referensi subjek) dengan kontrol rasio aspek
- Hingga **9 gambar output** per permintaan
- Hingga **1 gambar referensi** per permintaan edit
- Rasio aspek yang didukung: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Untuk menggunakan MiniMax untuk pembuatan gambar, tetapkan sebagai penyedia pembuatan gambar:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin menggunakan `MINIMAX_API_KEY` yang sama atau auth OAuth yang sama seperti model teks. Tidak diperlukan konfigurasi tambahan jika MiniMax sudah disiapkan.

Baik `minimax` maupun `minimax-portal` mendaftarkan `image_generate` dengan model `image-01` yang sama. Penyiapan dengan kunci API menggunakan `MINIMAX_API_KEY`; penyiapan OAuth dapat menggunakan jalur auth `minimax-portal` bawaan sebagai gantinya.

Saat onboarding atau penyiapan kunci API menulis entri `models.providers.minimax` yang eksplisit, OpenClaw mewujudkan `MiniMax-M2.7` dan `MiniMax-M2.7-highspeed` sebagai model chat khusus teks. Pemahaman gambar diekspos secara terpisah melalui penyedia media `MiniMax-VL-01` milik plugin.

<Note>
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter tool bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Text-to-speech

Plugin `minimax` bawaan mendaftarkan MiniMax T2A v2 sebagai penyedia suara untuk `messages.tts`.

- Model TTS default: `speech-2.8-hd`
- Suara default: `English_expressive_narrator`
- ID model bawaan yang didukung mencakup `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, dan `speech-01-turbo`.
- Resolusi auth adalah `messages.tts.providers.minimax.apiKey`, lalu
  profil auth OAuth/token `minimax-portal`, lalu kunci environment Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), lalu `MINIMAX_API_KEY`.
- Jika tidak ada host TTS yang dikonfigurasi, OpenClaw menggunakan kembali host OAuth `minimax-portal` yang dikonfigurasi dan menghapus sufiks path yang kompatibel dengan Anthropic seperti `/anthropic`.
- Lampiran audio normal tetap berupa MP3.
- Target pesan suara seperti Feishu dan Telegram ditranskode dari MP3 MiniMax ke Opus 48kHz dengan `ffmpeg`, karena API file Feishu/Lark hanya menerima `file_type: "opus"` untuk pesan audio native.
- MiniMax T2A menerima `speed` dan `vol` pecahan, tetapi `pitch` dikirim sebagai bilangan bulat; OpenClaw memotong nilai `pitch` pecahan sebelum permintaan API.

| Pengaturan                               | Variabel env           | Default                       | Deskripsi                        |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID model TTS.                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID suara yang digunakan untuk output suara. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Kecepatan pemutaran, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Perubahan pitch bilangan bulat, `-12..12`. |

### Pembuatan musik

Plugin `minimax` bawaan juga mendaftarkan pembuatan musik melalui tool bersama `music_generate`.

- Model musik default: `minimax/music-2.6`
- Juga mendukung `minimax/music-2.5` dan `minimax/music-2.0`
- Kontrol prompt: `lyrics`, `instrumental`, `durationSeconds`
- Format output: `mp3`
- Proses berbasis sesi dilepas melalui alur task/status bersama, termasuk `action: "status"`

Untuk menggunakan MiniMax sebagai penyedia musik default:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Lihat [Pembuatan Musik](/id/tools/music-generation) untuk parameter tool bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Pembuatan video

Plugin `minimax` bawaan juga mendaftarkan pembuatan video melalui tool bersama `video_generate`.

- Model video default: `minimax/MiniMax-Hailuo-2.3`
- Mode: alur teks-ke-video dan referensi gambar tunggal
- Mendukung `aspectRatio` dan `resolution`

Untuk menggunakan MiniMax sebagai penyedia video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter tool bersama, pemilihan penyedia, dan perilaku failover.
</Note>

### Pemahaman gambar

Plugin MiniMax mendaftarkan pemahaman gambar secara terpisah dari katalog teks:

| Provider ID      | Model gambar default |
| ---------------- | -------------------- |
| `minimax`        | `MiniMax-VL-01`      |
| `minimax-portal` | `MiniMax-VL-01`      |

Itulah sebabnya perutean media otomatis dapat menggunakan pemahaman gambar MiniMax bahkan ketika katalog penyedia teks bawaan masih menampilkan referensi chat M2.7 khusus teks.

### Pencarian web

Plugin MiniMax juga mendaftarkan `web_search` melalui API pencarian MiniMax Coding Plan.

- ID penyedia: `minimax`
- Hasil terstruktur: judul, URL, cuplikan, kueri terkait
- Variabel env yang disarankan: `MINIMAX_CODE_PLAN_KEY`
- Alias env yang diterima: `MINIMAX_CODING_API_KEY`
- Fallback kompatibilitas: `MINIMAX_API_KEY` saat sudah mengarah ke token coding-plan
- Penggunaan ulang region: `plugins.entries.minimax.config.webSearch.region`, lalu `MINIMAX_API_HOST`, lalu URL dasar penyedia MiniMax
- Pencarian tetap pada id penyedia `minimax`; penyiapan OAuth CN/global tetap dapat mengarahkan region secara tidak langsung melalui `models.providers.minimax-portal.baseUrl`

Konfigurasi berada di bawah `plugins.entries.minimax.config.webSearch.*`.

<Note>
Lihat [MiniMax Search](/id/tools/minimax-search) untuk konfigurasi dan penggunaan pencarian web lengkap.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Opsi konfigurasi">
    | Opsi | Deskripsi |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Gunakan `https://api.minimax.io/anthropic` (kompatibel dengan Anthropic); `https://api.minimax.io/v1` bersifat opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.api` | Gunakan `anthropic-messages`; `openai-completions` bersifat opsional untuk payload yang kompatibel dengan OpenAI |
    | `models.providers.minimax.apiKey` | Kunci API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definisikan `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias model yang Anda inginkan dalam allowlist |
    | `models.mode` | Gunakan `merge` jika Anda ingin menambahkan MiniMax di samping bawaan |
  </Accordion>

  <Accordion title="Default thinking">
    Pada `api: "anthropic-messages"`, OpenClaw menyuntikkan `thinking: { type: "disabled" }` kecuali thinking sudah ditetapkan secara eksplisit di params/config.

    Ini mencegah endpoint streaming MiniMax mengeluarkan `reasoning_content` dalam potongan delta bergaya OpenAI, yang akan membocorkan penalaran internal ke output yang terlihat.

  </Accordion>

  <Accordion title="Mode cepat">
    `/fast on` atau `params.fastMode: true` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed` pada jalur stream yang kompatibel dengan Anthropic.
  </Accordion>

  <Accordion title="Contoh fallback">
    **Paling cocok untuk:** mempertahankan model generasi terbaru terkuat Anda sebagai primary, lalu fail over ke MiniMax M2.7. Contoh di bawah menggunakan Opus sebagai primary konkret; ganti dengan model primary generasi terbaru pilihan Anda.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Detail penggunaan Coding Plan">
    - API penggunaan Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (memerlukan kunci coding plan).
    - OpenClaw menormalkan penggunaan coding-plan MiniMax ke tampilan `% tersisa` yang sama seperti penyedia lain. Field mentah `usage_percent` / `usagePercent` MiniMax adalah kuota yang tersisa, bukan kuota yang terpakai, sehingga OpenClaw membalikkannya. Field berbasis hitungan diprioritaskan jika tersedia.
    - Saat API mengembalikan `model_remains`, OpenClaw memprioritaskan entri model chat, menurunkan label jendela dari `start_time` / `end_time` bila diperlukan, dan menyertakan nama model terpilih dalam label plan agar jendela coding-plan lebih mudah dibedakan.
    - Snapshot penggunaan memperlakukan `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota MiniMax yang sama, dan memprioritaskan OAuth MiniMax yang tersimpan sebelum fallback ke variabel env kunci Coding Plan.
  </Accordion>
</AccordionGroup>

## Catatan

- Referensi model mengikuti jalur auth:
  - Penyiapan kunci API: `minimax/<model>`
  - Penyiapan OAuth: `minimax-portal/<model>`
- Model chat default: `MiniMax-M2.7`
- Model chat alternatif: `MiniMax-M2.7-highspeed`
- Onboarding dan penyiapan kunci API langsung menulis definisi model khusus teks untuk kedua varian M2.7
- Pemahaman gambar menggunakan penyedia media `MiniMax-VL-01` milik plugin
- Perbarui nilai harga di `models.json` jika Anda memerlukan pelacakan biaya yang akurat
- Gunakan `openclaw models list` untuk mengonfirmasi id penyedia saat ini, lalu beralih dengan `openclaw models set minimax/MiniMax-M2.7` atau `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Tautan referral untuk MiniMax Coding Plan (diskon 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Lihat [Penyedia model](/id/concepts/model-providers) untuk aturan penyedia.
</Note>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title='"Model tidak dikenal: minimax/MiniMax-M2.7"'>
    Ini biasanya berarti **penyedia MiniMax belum dikonfigurasi** (tidak ada entri penyedia yang cocok dan tidak ditemukan profil auth/env key MiniMax). Perbaikan untuk deteksi ini ada di **2026.1.12**. Perbaiki dengan:

    - Upgrade ke **2026.1.12** (atau jalankan dari source `main`), lalu mulai ulang gateway.
    - Menjalankan `openclaw configure` dan memilih opsi auth **MiniMax**, atau
    - Menambahkan blok `models.providers.minimax` atau `models.providers.minimax-portal` yang cocok secara manual, atau
    - Menetapkan `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, atau profil auth MiniMax agar penyedia yang cocok dapat disuntikkan.

    Pastikan id model **peka huruf besar/kecil**:

    - Jalur kunci API: `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed`
    - Jalur OAuth: `minimax-portal/MiniMax-M2.7` atau `minimax-portal/MiniMax-M2.7-highspeed`

    Lalu periksa ulang dengan:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Bantuan lebih lanjut: [Pemecahan Masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Parameter tool musik bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan penyedia.
  </Card>
  <Card title="MiniMax Search" href="/id/tools/minimax-search" icon="magnifying-glass">
    Konfigurasi pencarian web melalui MiniMax Coding Plan.
  </Card>
  <Card title="Pemecahan Masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
