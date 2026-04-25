---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda ingin autentikasi langganan Codex alih-alih kunci API
    - Anda memerlukan perilaku eksekusi agen GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui kunci API atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:54:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI menyediakan API pengembang untuk model GPT. OpenClaw mendukung tiga rute keluarga OpenAI. Prefiks model memilih rute:

- **Kunci API** — akses OpenAI Platform langsung dengan penagihan berbasis penggunaan (model `openai/*`)
- **Langganan Codex melalui PI** — masuk ChatGPT/Codex dengan akses langganan (model `openai-codex/*`)
- **Harness app-server Codex** — eksekusi app-server Codex native (model `openai/*` ditambah `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI secara eksplisit mendukung penggunaan OAuth langganan di tool eksternal dan alur kerja seperti OpenClaw.

Penyedia, model, runtime, dan saluran adalah lapisan yang terpisah. Jika label-label tersebut
mulai tercampur, baca [Runtime agen](/id/concepts/agent-runtimes) sebelum
mengubah konfigurasi.

## Pilihan cepat

| Tujuan                                        | Gunakan                                                  | Catatan                                                                     |
| --------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Penagihan langsung dengan kunci API           | `openai/gpt-5.4`                                         | Atur `OPENAI_API_KEY` atau jalankan onboarding kunci API OpenAI.            |
| GPT-5.5 dengan autentikasi langganan ChatGPT/Codex | `openai-codex/gpt-5.5`                                   | Rute PI default untuk OAuth Codex. Pilihan awal terbaik untuk setup langganan. |
| GPT-5.5 dengan perilaku app-server Codex native | `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"` | Menggunakan harness app-server Codex, bukan rute API OpenAI publik.         |
| Pembuatan atau pengeditan gambar              | `openai/gpt-image-2`                                     | Berfungsi dengan `OPENAI_API_KEY` atau OpenAI Codex OAuth.                  |

<Note>
GPT-5.5 saat ini tersedia di OpenClaw melalui rute langganan/OAuth:
`openai-codex/gpt-5.5` dengan runner PI, atau `openai/gpt-5.5` dengan
harness app-server Codex. Akses langsung dengan kunci API untuk `openai/gpt-5.5`
didukung setelah OpenAI mengaktifkan GPT-5.5 di API publik; hingga saat itu gunakan
model yang diaktifkan API seperti `openai/gpt-5.4` untuk setup `OPENAI_API_KEY`.
</Note>

<Note>
Mengaktifkan plugin OpenAI, atau memilih model `openai-codex/*`, tidak
mengaktifkan plugin app-server Codex bawaan. OpenClaw mengaktifkan plugin tersebut hanya
saat Anda secara eksplisit memilih harness Codex native dengan
`embeddedHarness.runtime: "codex"` atau menggunakan referensi model lama `codex/*`.
</Note>

## Cakupan fitur OpenClaw

| Kemampuan OpenAI          | Permukaan OpenClaw                                        | Status                                                 |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | penyedia model `openai/<model>`                           | Ya                                                     |
| Model langganan Codex     | `openai-codex/<model>` dengan OAuth `openai-codex`        | Ya                                                     |
| Harness app-server Codex  | `openai/<model>` dengan `embeddedHarness.runtime: codex`  | Ya                                                     |
| Pencarian web sisi server | Tool OpenAI Responses native                              | Ya, saat pencarian web diaktifkan dan tidak ada penyedia yang dipin |
| Gambar                    | `image_generate`                                          | Ya                                                     |
| Video                     | `video_generate`                                          | Ya                                                     |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                 | Ya                                                     |
| Speech-to-text batch      | `tools.media.audio` / pemahaman media                     | Ya                                                     |
| Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`                 | Ya                                                     |
| Suara realtime            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ya                                                    |
| Embeddings                | penyedia embedding memori                                 | Ya                                                     |

## Memulai

Pilih metode autentikasi yang Anda inginkan dan ikuti langkah-langkah penyiapan.

<Tabs>
  <Tab title="Kunci API (OpenAI Platform)">
    **Terbaik untuk:** akses API langsung dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat atau salin kunci API dari [dasbor OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Atau berikan kuncinya secara langsung:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Ringkasan rute

    | Model ref | Rute | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Rute API langsung di masa depan setelah OpenAI mengaktifkan GPT-5.5 di API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` adalah rute langsung kunci API OpenAI kecuali Anda secara eksplisit memaksa
    harness app-server Codex. GPT-5.5 sendiri saat ini hanya untuk langganan/OAuth;
    gunakan `openai-codex/*` untuk OAuth Codex melalui runner PI default, atau
    gunakan `openai/gpt-5.5` dengan `embeddedHarness.runtime: "codex"` untuk eksekusi
    app-server Codex native.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark`. Permintaan API OpenAI live menolak model tersebut, dan katalog Codex saat ini juga tidak mengeksposnya.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Terbaik untuk:** menggunakan langganan ChatGPT/Codex Anda alih-alih kunci API terpisah. Cloud Codex memerlukan login ChatGPT.

    <Steps>
      <Step title="Jalankan OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Untuk setup headless atau yang tidak ramah callback, tambahkan `--device-code` untuk masuk dengan alur device-code ChatGPT alih-alih callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Atur model default">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Ringkasan rute

    | Model ref | Rute | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex melalui PI | login Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness app-server Codex | auth app-server Codex |

    <Note>
    Tetap gunakan id penyedia `openai-codex` untuk perintah auth/profil. Prefiks model
    `openai-codex/*` juga merupakan rute PI eksplisit untuk OAuth Codex.
    Itu tidak memilih atau mengaktifkan otomatis harness app-server Codex bawaan.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding tidak lagi mengimpor materi OAuth dari `~/.codex`. Masuklah dengan OAuth browser (default) atau alur device-code di atas — OpenClaw mengelola kredensial yang dihasilkan dalam penyimpanan auth agen miliknya sendiri.
    </Note>

    ### Indikator status

    Chat `/status` menampilkan runtime model mana yang aktif untuk sesi saat ini.
    Harness PI default muncul sebagai `Runtime: OpenClaw Pi Default`. Saat
    harness app-server Codex bawaan dipilih, `/status` menampilkan
    `Runtime: OpenAI Codex`. Sesi yang sudah ada tetap menyimpan id harness yang tercatat, jadi gunakan
    `/new` atau `/reset` setelah mengubah `embeddedHarness` jika Anda ingin `/status`
    mencerminkan pilihan PI/Codex yang baru.

    ### Batas jendela konteks

    OpenClaw memperlakukan metadata model dan batas konteks runtime sebagai nilai yang terpisah.

    Untuk `openai-codex/gpt-5.5` melalui OAuth Codex:

    - `contextWindow` native: `1000000`
    - Batas `contextTokens` runtime default: `272000`

    Batas default yang lebih kecil memiliki karakteristik latensi dan kualitas yang lebih baik dalam praktik. Ganti nilainya dengan `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Gunakan `contextWindow` untuk mendeklarasikan metadata model native. Gunakan `contextTokens` untuk membatasi anggaran konteks runtime.
    </Note>

    ### Pemulihan katalog

    OpenClaw menggunakan metadata katalog Codex upstream untuk `gpt-5.5` saat itu
    tersedia. Jika penemuan Codex live menghilangkan baris `openai-codex/gpt-5.5` sementara
    akun sudah diautentikasi, OpenClaw mensintesis baris model OAuth tersebut agar
    eksekusi Cron, sub-agen, dan model default yang dikonfigurasi tidak gagal dengan
    `Unknown model`.

  </Tab>
</Tabs>

## Pembuatan gambar

Plugin `openai` bawaan mendaftarkan pembuatan gambar melalui tool `image_generate`.
Ini mendukung pembuatan gambar OpenAI dengan kunci API dan pembuatan gambar
Codex OAuth melalui referensi model `openai/gpt-image-2` yang sama.

| Kemampuan                | Kunci API OpenAI                    | OAuth Codex OpenAI                    |
| ------------------------ | ----------------------------------- | ------------------------------------- |
| Model ref                | `openai/gpt-image-2`                | `openai/gpt-image-2`                  |
| Auth                     | `OPENAI_API_KEY`                    | login OpenAI Codex OAuth              |
| Transport                | OpenAI Images API                   | backend Codex Responses               |
| Maks gambar per permintaan | 4                                 | 4                                     |
| Mode edit                | Diaktifkan (hingga 5 gambar referensi) | Diaktifkan (hingga 5 gambar referensi) |
| Penggantian ukuran       | Didukung, termasuk ukuran 2K/4K     | Didukung, termasuk ukuran 2K/4K       |
| Rasio aspek / resolusi   | Tidak diteruskan ke OpenAI Images API | Dipetakan ke ukuran yang didukung bila aman |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter tool bersama, pemilihan penyedia, dan perilaku failover.
</Note>

`gpt-image-2` adalah default untuk pembuatan gambar dari teks OpenAI dan pengeditan gambar.
`gpt-image-1` tetap dapat digunakan sebagai override model eksplisit, tetapi alur kerja gambar OpenAI yang baru
harus menggunakan `openai/gpt-image-2`.

Untuk instalasi OAuth Codex, tetap gunakan ref `openai/gpt-image-2` yang sama. Saat profil OAuth `openai-codex` dikonfigurasi, OpenClaw menyelesaikan token akses OAuth yang tersimpan tersebut dan mengirim permintaan gambar melalui backend Codex Responses. OpenClaw
tidak terlebih dahulu mencoba `OPENAI_API_KEY` atau diam-diam beralih ke kunci API untuk
permintaan tersebut. Konfigurasikan `models.providers.openai` secara eksplisit dengan kunci API,
base URL kustom, atau endpoint Azure saat Anda menginginkan rute OpenAI Images API
langsung.
Jika endpoint gambar kustom tersebut berada di LAN/alamat privat tepercaya, atur juga
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw tetap memblokir
endpoint gambar OpenAI-compatible privat/internal kecuali opt-in ini
ada.

Buat:

```
/tool image_generate model=openai/gpt-image-2 prompt="Poster peluncuran yang dipoles untuk OpenClaw di macOS" size=3840x2160 count=1
```

Edit:

```
/tool image_generate model=openai/gpt-image-2 prompt="Pertahankan bentuk objek, ubah material menjadi kaca transparan" image=/path/to/reference.png size=1024x1536
```

## Pembuatan video

Plugin `openai` bawaan mendaftarkan pembuatan video melalui tool `video_generate`.

| Kemampuan       | Nilai                                                                             |
| --------------- | --------------------------------------------------------------------------------- |
| Model default   | `openai/sora-2`                                                                   |
| Mode            | Teks-ke-video, gambar-ke-video, edit satu video                                   |
| Input referensi | 1 gambar atau 1 video                                                             |
| Penggantian ukuran | Didukung                                                                      |
| Penggantian lain | `aspectRatio`, `resolution`, `audio`, `watermark` diabaikan dengan peringatan tool |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter tool bersama, pemilihan penyedia, dan perilaku failover.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk eksekusi keluarga GPT-5 di seluruh penyedia. Ini diterapkan berdasarkan id model, sehingga `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, dan ref GPT-5 kompatibel lainnya menerima overlay yang sama. Model GPT-4.x yang lebih lama tidak menerimanya.

Harness Codex native bawaan menggunakan perilaku GPT-5 dan overlay Heartbeat yang sama melalui instruksi pengembang app-server Codex, sehingga sesi `openai/gpt-5.x` yang dipaksa melalui `embeddedHarness.runtime: "codex"` tetap mempertahankan panduan tindak lanjut dan Heartbeat proaktif yang sama meskipun Codex memiliki sisa prompt harness tersebut.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keamanan eksekusi, disiplin tool, bentuk output, pemeriksaan penyelesaian, dan verifikasi. Perilaku balasan khusus saluran dan silent-message tetap berada dalam prompt sistem OpenClaw bersama dan kebijakan pengiriman keluar. Panduan GPT-5 selalu diaktifkan untuk model yang cocok. Lapisan gaya interaksi yang ramah bersifat terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                          |
| ---------------------- | --------------------------------------------- |
| `"friendly"` (default) | Aktifkan lapisan gaya interaksi yang ramah    |
| `"on"`                 | Alias untuk `"friendly"`                      |
| `"off"`                | Nonaktifkan hanya lapisan gaya ramah          |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Nilai tidak peka huruf besar/kecil saat runtime, jadi `"Off"` dan `"off"` sama-sama menonaktifkan lapisan gaya ramah.
</Tip>

<Note>
`plugins.entries.openai.config.personality` lama masih dibaca sebagai fallback kompatibilitas saat setelan bersama `agents.defaults.promptOverlays.gpt5.personality` tidak diatur.
</Note>

## Suara dan ucapan

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` bawaan mendaftarkan sintesis ucapan untuk permukaan `messages.tts`.

    | Setting | Jalur config | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Suara | `messages.tts.providers.openai.voice` | `coral` |
    | Kecepatan | `messages.tts.providers.openai.speed` | (tidak diatur) |
    | Instruksi | `messages.tts.providers.openai.instructions` | (tidak diatur, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk catatan suara, `mp3` untuk file |
    | Kunci API | `messages.tts.providers.openai.apiKey` | Fallback ke `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Model yang tersedia: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Suara yang tersedia: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Atur `OPENAI_TTS_BASE_URL` untuk mengganti base URL TTS tanpa memengaruhi endpoint API chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` bawaan mendaftarkan speech-to-text batch melalui
    permukaan transkripsi pemahaman media OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Jalur input: unggah file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen saluran suara Discord dan
      lampiran audio saluran

    Untuk memaksa OpenAI untuk transkripsi audio masuk:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Petunjuk bahasa dan prompt diteruskan ke OpenAI saat disediakan oleh
    konfigurasi media audio bersama atau permintaan transkripsi per panggilan.

  </Accordion>

  <Accordion title="Transkripsi realtime">
    Plugin `openai` bawaan mendaftarkan transkripsi realtime untuk plugin Voice Call.

    | Setting | Jalur config | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Bahasa | `...openai.language` | (tidak diatur) |
    | Prompt | `...openai.prompt` | (tidak diatur) |
    | Durasi hening | `...openai.silenceDurationMs` | `800` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Kunci API | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Penyedia streaming ini untuk jalur transkripsi realtime Voice Call; suara Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Suara realtime">
    Plugin `openai` bawaan mendaftarkan suara realtime untuk plugin Voice Call.

    | Setting | Jalur config | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Suara | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Durasi hening | `...openai.silenceDurationMs` | `500` |
    | Kunci API | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Mendukung Azure OpenAI melalui kunci config `azureEndpoint` dan `azureDeployment`. Mendukung pemanggilan tool dua arah. Menggunakan format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Penyedia `openai` bawaan dapat menargetkan resource Azure OpenAI untuk pembuatan
gambar dengan mengganti base URL. Pada jalur pembuatan gambar, OpenClaw
mendeteksi hostname Azure pada `models.providers.openai.baseUrl` dan beralih ke
bentuk permintaan Azure secara otomatis.

<Note>
Suara realtime menggunakan jalur konfigurasi terpisah
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
dan tidak dipengaruhi oleh `models.providers.openai.baseUrl`. Lihat accordion **Suara
realtime** di bawah [Suara dan ucapan](#voice-and-speech) untuk setelan
Azure-nya.
</Note>

Gunakan Azure OpenAI saat:

- Anda sudah memiliki langganan, kuota, atau perjanjian enterprise Azure OpenAI
- Anda memerlukan residensi data regional atau kontrol kepatuhan yang disediakan Azure
- Anda ingin menjaga lalu lintas tetap berada dalam tenancy Azure yang sudah ada

### Konfigurasi

Untuk pembuatan gambar Azure melalui penyedia `openai` bawaan, arahkan
`models.providers.openai.baseUrl` ke resource Azure Anda dan atur `apiKey` ke
kunci Azure OpenAI (bukan kunci OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw mengenali sufiks host Azure berikut untuk rute pembuatan gambar Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Untuk permintaan pembuatan gambar pada host Azure yang dikenali, OpenClaw:

- Mengirim header `api-key` alih-alih `Authorization: Bearer`
- Menggunakan path dengan cakupan deployment (`/openai/deployments/{deployment}/...`)
- Menambahkan `?api-version=...` ke setiap permintaan

Base URL lain (OpenAI publik, proxy yang kompatibel dengan OpenAI) tetap menggunakan
bentuk permintaan gambar OpenAI standar.

<Note>
Perutean Azure untuk jalur pembuatan gambar penyedia `openai` memerlukan
OpenClaw 2026.4.22 atau lebih baru. Versi yang lebih lama memperlakukan
`openai.baseUrl` kustom apa pun seperti endpoint OpenAI publik dan akan gagal terhadap deployment
gambar Azure.
</Note>

### Versi API

Atur `AZURE_OPENAI_API_VERSION` untuk menyematkan versi preview atau GA Azure tertentu
untuk jalur pembuatan gambar Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Default-nya adalah `2024-12-01-preview` saat variabel tidak diatur.

### Nama model adalah nama deployment

Azure OpenAI mengikat model ke deployment. Untuk permintaan pembuatan gambar Azure
yang dirutekan melalui penyedia `openai` bawaan, field `model` di OpenClaw
harus berupa **nama deployment Azure** yang Anda konfigurasikan di portal Azure, bukan
id model OpenAI publik.

Jika Anda membuat deployment bernama `gpt-image-2-prod` yang melayani `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Poster yang bersih" size=1024x1024 count=1
```

Aturan nama deployment yang sama berlaku untuk panggilan pembuatan gambar yang dirutekan melalui
penyedia `openai` bawaan.

### Ketersediaan regional

Pembuatan gambar Azure saat ini hanya tersedia di sebagian wilayah
(misalnya `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Periksa daftar wilayah Microsoft terbaru sebelum membuat
deployment, dan pastikan model spesifik tersebut ditawarkan di wilayah Anda.

### Perbedaan parameter

Azure OpenAI dan OpenAI publik tidak selalu menerima parameter gambar yang sama.
Azure dapat menolak opsi yang diizinkan oleh OpenAI publik (misalnya nilai
`background` tertentu pada `gpt-image-2`) atau hanya mengeksposnya pada versi model
tertentu. Perbedaan ini berasal dari Azure dan model yang mendasarinya, bukan
OpenClaw. Jika permintaan Azure gagal dengan kesalahan validasi, periksa
set parameter yang didukung oleh deployment dan versi API spesifik Anda di
portal Azure.

<Note>
Azure OpenAI menggunakan transport native dan perilaku kompatibel tetapi tidak menerima
header atribusi tersembunyi milik OpenClaw — lihat accordion **Rute native vs OpenAI-compatible**
di bawah [Konfigurasi lanjutan](#advanced-configuration).

Untuk lalu lintas chat atau Responses di Azure (di luar pembuatan gambar), gunakan
alur onboarding atau konfigurasi penyedia Azure khusus — `openai.baseUrl` saja
tidak mengambil bentuk API/auth Azure. Ada penyedia
`azure-openai-responses/*` terpisah; lihat
accordion Compaction sisi server di bawah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw menggunakan WebSocket terlebih dahulu dengan fallback SSE (`"auto"`) untuk `openai/*` dan `openai-codex/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan WebSocket awal sebelum beralih ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai terdegradasi selama ~60 detik dan menggunakan SSE selama masa cooldown
    - Melampirkan header identitas sesi dan giliran yang stabil untuk percobaan ulang dan penyambungan kembali
    - Menormalkan penghitung penggunaan (`input_tokens` / `prompt_tokens`) di seluruh varian transport

    | Nilai | Perilaku |
    |-------|----------|
    | `"auto"` (default) | WebSocket terlebih dahulu, fallback SSE |
    | `"sse"` | Paksa SSE saja |
    | `"websocket"` | Paksa WebSocket saja |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Dokumentasi OpenAI terkait:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Pemanasan WebSocket">
    OpenClaw mengaktifkan pemanasan WebSocket secara default untuk `openai/*` dan `openai-codex/*` guna mengurangi latensi giliran pertama.

    ```json5
    // Nonaktifkan pemanasan
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode cepat">
    OpenClaw mengekspos toggle mode cepat bersama untuk `openai/*` dan `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Saat diaktifkan, OpenClaw memetakan mode cepat ke pemrosesan prioritas OpenAI (`service_tier = "priority"`). Nilai `service_tier` yang ada dipertahankan, dan mode cepat tidak menulis ulang `reasoning` atau `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Override sesi lebih diutamakan daripada konfigurasi. Menghapus override sesi di UI Sessions akan mengembalikan sesi ke default yang dikonfigurasi.
    </Note>

  </Accordion>

  <Accordion title="Pemrosesan prioritas (service_tier)">
    API OpenAI mengekspos pemrosesan prioritas melalui `service_tier`. Atur per model di OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Nilai yang didukung: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` hanya diteruskan ke endpoint OpenAI native (`api.openai.com`) dan endpoint Codex native (`chatgpt.com/backend-api`). Jika Anda merutekan salah satu penyedia melalui proxy, OpenClaw membiarkan `service_tier` tidak tersentuh.
    </Warning>

  </Accordion>

  <Accordion title="Compaction sisi server (Responses API)">
    Untuk model Responses OpenAI langsung (`openai/*` di `api.openai.com`), pembungkus stream Pi-harness plugin OpenAI secara otomatis mengaktifkan Compaction sisi server:

    - Memaksa `store: true` (kecuali kompatibilitas model menetapkan `supportsStore: false`)
    - Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` default: 70% dari `contextWindow` (atau `80000` saat tidak tersedia)

    Ini berlaku untuk jalur harness Pi bawaan dan untuk hook penyedia OpenAI yang digunakan oleh eksekusi embedded. Harness app-server Codex native mengelola konteksnya sendiri melalui Codex dan dikonfigurasi secara terpisah dengan `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Aktifkan secara eksplisit">
        Berguna untuk endpoint yang kompatibel seperti Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Ambang kustom">
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
      </Tab>
      <Tab title="Nonaktifkan">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` hanya mengontrol injeksi `context_management`. Model Responses OpenAI langsung tetap memaksa `store: true` kecuali kompatibilitas menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentic ketat">
    Untuk eksekusi keluarga GPT-5 pada `openai/*`, OpenClaw dapat menggunakan kontrak eksekusi embedded yang lebih ketat:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Dengan `strict-agentic`, OpenClaw:
    - Tidak lagi memperlakukan giliran yang hanya berisi rencana sebagai progres yang berhasil ketika tindakan tool tersedia
    - Mencoba ulang giliran dengan arahan untuk bertindak sekarang
    - Secara otomatis mengaktifkan `update_plan` untuk pekerjaan yang substansial
    - Menampilkan status terblokir yang eksplisit jika model terus membuat rencana tanpa bertindak

    <Note>
    Cakupannya hanya untuk eksekusi keluarga GPT-5 OpenAI dan Codex. Penyedia lain dan keluarga model yang lebih lama tetap menggunakan perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs OpenAI-compatible">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proxy `/v1` OpenAI-compatible generik:

    **Rute native** (`openai/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung `none` effort OpenAI
    - Menghilangkan reasoning yang dinonaktifkan untuk model atau proxy yang menolak `reasoning.effort: "none"`
    - Menjadikan schema tool mode ketat secara default
    - Melampirkan header atribusi tersembunyi hanya pada host native yang terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, kompatibilitas reasoning, petunjuk prompt-cache)

    **Rute proxy/compatible:**
    - Menggunakan perilaku kompatibilitas yang lebih longgar
    - Menghapus `store` Completions dari payload `openai-completions` non-native
    - Menerima JSON pass-through `params.extra_body`/`params.extraBody` lanjutan untuk proxy Completions OpenAI-compatible
    - Tidak memaksa schema tool ketat atau header khusus native

    Azure OpenAI menggunakan transport native dan perilaku kompatibel tetapi tidak menerima header atribusi tersembunyi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan penyedia.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan penyedia.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
