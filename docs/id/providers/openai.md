---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda ingin auth langganan Codex alih-alih API key
    - Anda memerlukan perilaku eksekusi agent GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui API key atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-22T04:26:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692615b77885c0387d339d47c02ff056ba95d3608aa681882893a46d2a0f723f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI menyediakan API developer untuk model GPT. OpenClaw mendukung dua jalur auth:

- **API key** — akses OpenAI Platform langsung dengan penagihan berbasis penggunaan (model `openai/*`)
- **Langganan Codex** — sign-in ChatGPT/Codex dengan akses langganan (model `openai-codex/*`)

OpenAI secara eksplisit mendukung penggunaan OAuth langganan dalam tool eksternal dan alur kerja seperti OpenClaw.

## Memulai

Pilih metode auth yang Anda inginkan dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Terbaik untuk:** akses API langsung dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan API key Anda">
        Buat atau salin API key dari [dashboard OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Atau berikan key secara langsung:

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
    | `openai/gpt-5.4` | OpenAI Platform API langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | OpenAI Platform API langsung | `OPENAI_API_KEY` |

    <Note>
    Sign-in ChatGPT/Codex dirutekan melalui `openai-codex/*`, bukan `openai/*`.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark` pada jalur API langsung. Permintaan OpenAI API live menolak model itu. Spark hanya untuk Codex.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Terbaik untuk:** menggunakan langganan ChatGPT/Codex Anda alih-alih API key terpisah. Codex cloud memerlukan sign-in ChatGPT.

    <Steps>
      <Step title="Jalankan Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Setel model default">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
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
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Sign-in Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Sign-in Codex (bergantung pada entitlement) |

    <Note>
    Rute ini sengaja dipisahkan dari `openai/gpt-5.4`. Gunakan `openai/*` dengan API key untuk akses Platform langsung, dan `openai-codex/*` untuk akses langganan Codex.
    </Note>

    ### Contoh konfigurasi

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Jika onboarding menggunakan ulang login Codex CLI yang sudah ada, kredensial tersebut tetap dikelola oleh Codex CLI. Saat kedaluwarsa, OpenClaw akan membaca ulang sumber Codex eksternal terlebih dahulu dan menulis kembali kredensial yang telah diperbarui ke penyimpanan Codex.
    </Tip>

    ### Batas jendela konteks

    OpenClaw memperlakukan metadata model dan batas konteks runtime sebagai dua nilai yang terpisah.

    Untuk `openai-codex/gpt-5.4`:

    - `contextWindow` native: `1050000`
    - Batas `contextTokens` runtime default: `272000`

    Batas default yang lebih kecil memiliki karakteristik latensi dan kualitas yang lebih baik dalam praktik. Override dengan `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Gunakan `contextWindow` untuk mendeklarasikan metadata model native. Gunakan `contextTokens` untuk membatasi anggaran konteks runtime.
    </Note>

  </Tab>
</Tabs>

## Pembuatan gambar

Plugin `openai` bawaan mendaftarkan pembuatan gambar melalui tool `image_generate`.

| Kapabilitas               | Nilai                              |
| ------------------------- | ---------------------------------- |
| Model default             | `openai/gpt-image-2`               |
| Maks gambar per permintaan| 4                                  |
| Mode edit                 | Diaktifkan (hingga 5 gambar referensi) |
| Override ukuran           | Didukung, termasuk ukuran 2K/4K    |
| Aspect ratio / resolution | Tidak diteruskan ke OpenAI Images API |

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
Lihat [Image Generation](/id/tools/image-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

`gpt-image-2` adalah default untuk pembuatan gambar dari teks ke gambar OpenAI dan pengeditan gambar. `gpt-image-1` tetap dapat digunakan sebagai override model eksplisit, tetapi alur kerja gambar OpenAI baru sebaiknya menggunakan `openai/gpt-image-2`.

Hasilkan:

```
/tool image_generate model=openai/gpt-image-2 prompt="Poster peluncuran yang rapi untuk OpenClaw di macOS" size=3840x2160 count=1
```

Edit:

```
/tool image_generate model=openai/gpt-image-2 prompt="Pertahankan bentuk objek, ubah materialnya menjadi kaca transparan" image=/path/to/reference.png size=1024x1536
```

## Pembuatan video

Plugin `openai` bawaan mendaftarkan pembuatan video melalui tool `video_generate`.

| Kapabilitas       | Nilai                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Model default     | `openai/sora-2`                                                                   |
| Mode              | Teks ke video, gambar ke video, edit video tunggal                                |
| Input referensi   | 1 gambar atau 1 video                                                             |
| Override ukuran   | Didukung                                                                          |
| Override lainnya  | `aspectRatio`, `resolution`, `audio`, `watermark` diabaikan dengan peringatan tool |

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
Lihat [Video Generation](/id/tools/video-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 khusus OpenAI untuk run keluarga GPT-5 `openai/*` dan `openai-codex/*`. Ini berada di plugin OpenAI bawaan, berlaku untuk model id seperti `gpt-5`, `gpt-5.2`, `gpt-5.4`, dan `gpt-5.4-mini`, dan tidak berlaku untuk model GPT-4.x yang lebih lama.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keamanan eksekusi, disiplin tool, bentuk output, pemeriksaan penyelesaian, dan verifikasi. Perilaku balasan khusus channel dan perilaku silent-message tetap berada di system prompt OpenClaw bersama dan kebijakan pengiriman outbound. Panduan GPT-5 selalu diaktifkan untuk model yang cocok. Lapisan gaya interaksi yang ramah terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                        |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (default) | Aktifkan lapisan gaya interaksi yang ramah  |
| `"on"`                 | Alias untuk `"friendly"`                    |
| `"off"`                | Nonaktifkan hanya lapisan gaya ramah        |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Nilai tidak peka huruf besar/kecil saat runtime, jadi `"Off"` dan `"off"` sama-sama menonaktifkan lapisan gaya ramah.
</Tip>

## Suara dan speech

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` bawaan mendaftarkan sintesis ucapan untuk surface `messages.tts`.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Suara | `messages.tts.providers.openai.voice` | `coral` |
    | Kecepatan | `messages.tts.providers.openai.speed` | (tidak disetel) |
    | Instruksi | `messages.tts.providers.openai.instructions` | (tidak disetel, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk catatan suara, `mp3` untuk file |
    | API key | `messages.tts.providers.openai.apiKey` | Fallback ke `OPENAI_API_KEY` |
    | URL dasar | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Setel `OPENAI_TTS_BASE_URL` untuk mengoverride URL dasar TTS tanpa memengaruhi endpoint API chat.
    </Note>

  </Accordion>

  <Accordion title="Transkripsi realtime">
    Plugin `openai` bawaan mendaftarkan transkripsi realtime untuk plugin Voice Call.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Durasi hening | `...openai.silenceDurationMs` | `800` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="Suara realtime">
    Plugin `openai` bawaan mendaftarkan suara realtime untuk plugin Voice Call.

    | Pengaturan | Jalur konfigurasi | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Suara | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Durasi hening | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Mendukung Azure OpenAI melalui kunci konfigurasi `azureEndpoint` dan `azureDeployment`. Mendukung pemanggilan tool dua arah. Menggunakan format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw menggunakan WebSocket-first dengan fallback SSE (`"auto"`) untuk `openai/*` dan `openai-codex/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan awal WebSocket sebelum fallback ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai degraded selama ~60 detik dan menggunakan SSE selama cool-down
    - Menempelkan header identitas sesi dan giliran yang stabil untuk retry dan reconnect
    - Menormalkan penghitung penggunaan (`input_tokens` / `prompt_tokens`) di seluruh varian transport

    | Nilai | Perilaku |
    |-------|----------|
    | `"auto"` (default) | WebSocket lebih dulu, fallback SSE |
    | `"sse"` | Paksa SSE saja |
    | `"websocket"` | Paksa WebSocket saja |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Docs OpenAI terkait:
    - [Realtime API dengan WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respons API streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw mengaktifkan warm-up WebSocket secara default untuk `openai/*` guna mengurangi latensi giliran pertama.

    ```json5
    // Nonaktifkan warm-up
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
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Override sesi lebih diutamakan daripada config. Menghapus override sesi di UI Sessions mengembalikan sesi ke default yang dikonfigurasi.
    </Note>

  </Accordion>

  <Accordion title="Pemrosesan prioritas (service_tier)">
    API OpenAI mengekspos pemrosesan prioritas melalui `service_tier`. Setel per model di OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Nilai yang didukung: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` hanya diteruskan ke endpoint OpenAI native (`api.openai.com`) dan endpoint Codex native (`chatgpt.com/backend-api`). Jika Anda merutekan salah satu provider melalui proxy, OpenClaw membiarkan `service_tier` tetap apa adanya.
    </Warning>

  </Accordion>

  <Accordion title="Compaction sisi server (Responses API)">
    Untuk model Responses OpenAI langsung (`openai/*` di `api.openai.com`), OpenClaw otomatis mengaktifkan Compaction sisi server:

    - Memaksa `store: true` (kecuali kompat model menetapkan `supportsStore: false`)
    - Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Default `compact_threshold`: 70% dari `contextWindow` (atau `80000` saat tidak tersedia)

    <Tabs>
      <Tab title="Aktifkan secara eksplisit">
        Berguna untuk endpoint yang kompatibel seperti Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
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
    `responsesServerCompaction` hanya mengontrol injeksi `context_management`. Model Responses OpenAI langsung tetap memaksa `store: true` kecuali kompat menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT strict-agentic">
    Untuk run keluarga GPT-5 pada `openai/*` dan `openai-codex/*`, OpenClaw dapat menggunakan kontrak eksekusi tersemat yang lebih ketat:

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
    - Tidak lagi menganggap giliran yang hanya berisi rencana sebagai kemajuan yang berhasil saat tindakan tool tersedia
    - Mencoba ulang giliran dengan arahan act-now
    - Mengaktifkan `update_plan` secara otomatis untuk pekerjaan yang substansial
    - Menampilkan state blocked yang eksplisit jika model terus membuat rencana tanpa bertindak

    <Note>
    Cakupannya hanya untuk run keluarga GPT-5 OpenAI dan Codex. Provider lain dan keluarga model yang lebih lama tetap menggunakan perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs yang kompatibel dengan OpenAI">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proxy `/v1` generik yang kompatibel dengan OpenAI:

    **Rute native** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Menyimpan `reasoning: { effort: "none" }` hanya untuk model yang mendukung effort OpenAI `none`
    - Menghilangkan reasoning nonaktif untuk model atau proxy yang menolak `reasoning.effort: "none"`
    - Menjadikan skema tool default ke mode strict
    - Menempelkan header atribusi tersembunyi hanya pada host native yang terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, reasoning-compat, petunjuk prompt-cache)

    **Rute proxy/kompatibel:**
    - Menggunakan perilaku compat yang lebih longgar
    - Tidak memaksa skema tool strict atau header khusus native

    Azure OpenAI menggunakan transport native dan perilaku compat tetapi tidak menerima header atribusi tersembunyi.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, model ref, dan perilaku failover.
  </Card>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Parameter tool gambar bersama dan pemilihan provider.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Parameter tool video bersama dan pemilihan provider.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
