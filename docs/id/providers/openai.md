---
read_when:
    - Anda ingin menggunakan model OpenAI di OpenClaw
    - Anda menginginkan auth langganan Codex alih-alih API key
    - Anda memerlukan perilaku eksekusi agent GPT-5 yang lebih ketat
summary: Gunakan OpenAI melalui API key atau langganan Codex di OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T09:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d847e53c2faee5363071dfdcb1f4150b64577674161e000844f579482198d1
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI menyediakan API pengembang untuk model GPT. OpenClaw mendukung dua jalur auth:

  - **API key** — akses OpenAI Platform langsung dengan penagihan berbasis penggunaan (model `openai/*`)
  - **Langganan Codex** — login ChatGPT/Codex dengan akses langganan (model `openai-codex/*`)

  OpenAI secara eksplisit mendukung penggunaan OAuth langganan dalam tool eksternal dan alur kerja seperti OpenClaw.

  ## Cakupan fitur OpenClaw

  | Kapabilitas OpenAI       | Permukaan OpenClaw                        | Status                                                 |
  | ------------------------ | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses         | provider model `openai/<model>`           | Ya                                                     |
  | Model langganan Codex    | provider model `openai-codex/<model>`     | Ya                                                     |
  | Pencarian web sisi server| Tool OpenAI Responses native              | Ya, saat pencarian web diaktifkan dan tidak ada provider yang disematkan |
  | Gambar                   | `image_generate`                          | Ya                                                     |
  | Video                    | `video_generate`                          | Ya                                                     |
  | Text-to-speech           | `messages.tts.provider: "openai"` / `tts` | Ya                                                     |
  | Batch speech-to-text     | `tools.media.audio` / pemahaman media     | Ya                                                     |
  | Streaming speech-to-text | Voice Call `streaming.provider: "openai"` | Ya                                                     |
  | Suara realtime           | Voice Call `realtime.provider: "openai"`  | Ya                                                     |
  | Embedding                | provider embedding memori                 | Ya                                                     |

  ## Mulai

  Pilih metode auth pilihan Anda dan ikuti langkah penyiapannya.

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
    |-----------|------|------|
    | `openai/gpt-5.4` | API OpenAI Platform langsung | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API OpenAI Platform langsung | `OPENAI_API_KEY` |

    <Note>
    Login ChatGPT/Codex dirutekan melalui `openai-codex/*`, bukan `openai/*`.
    </Note>

    ### Contoh config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **tidak** mengekspos `openai/gpt-5.3-codex-spark` pada jalur API langsung. Permintaan API OpenAI live menolak model tersebut. Spark hanya untuk Codex.
    </Warning>

  </Tab>

  <Tab title="Langganan Codex">
    **Terbaik untuk:** menggunakan langganan ChatGPT/Codex Anda alih-alih API key terpisah. Codex cloud memerlukan login ChatGPT.

    <Steps>
      <Step title="Jalankan OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Atau jalankan OAuth secara langsung:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Untuk penyiapan headless atau yang bermusuhan dengan callback, tambahkan `--device-code` untuk login menggunakan alur device-code ChatGPT alih-alih callback browser localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
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
    |-----------|------|------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | Login Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | Login Codex (bergantung entitlement) |

    <Note>
    Rute ini secara sengaja terpisah dari `openai/gpt-5.4`. Gunakan `openai/*` dengan API key untuk akses Platform langsung, dan `openai-codex/*` untuk akses langganan Codex.
    </Note>

    ### Contoh config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Onboarding tidak lagi mengimpor materi OAuth dari `~/.codex`. Login dengan OAuth browser (default) atau alur device-code di atas — OpenClaw mengelola kredensial yang dihasilkan di penyimpanan auth agent miliknya sendiri.
    </Note>

    ### Batas context window

    OpenClaw memperlakukan metadata model dan batas konteks runtime sebagai nilai yang terpisah.

    Untuk `openai-codex/gpt-5.4`:

    - `contextWindow` native: `1050000`
    - Batas default runtime `contextTokens`: `272000`

    Batas default yang lebih kecil memiliki karakteristik latensi dan kualitas yang lebih baik dalam praktik. Timpa dengan `contextTokens`:

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

| Kapabilitas              | Nilai                              |
| ------------------------ | ---------------------------------- |
| Model default            | `openai/gpt-image-2`               |
| Maks gambar per permintaan | 4                                |
| Mode edit                | Diaktifkan (hingga 5 gambar referensi) |
| Override ukuran          | Didukung, termasuk ukuran 2K/4K    |
| Rasio aspek / resolusi   | Tidak diteruskan ke OpenAI Images API |

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
Lihat [Pembuatan Gambar](/id/tools/image-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

`gpt-image-2` adalah default untuk pembuatan text-to-image dan pengeditan gambar OpenAI. `gpt-image-1` tetap dapat digunakan sebagai override model eksplisit, tetapi alur kerja gambar OpenAI baru seharusnya menggunakan `openai/gpt-image-2`.

Buat:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Edit:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Pembuatan video

Plugin `openai` bawaan mendaftarkan pembuatan video melalui tool `video_generate`.

| Kapabilitas     | Nilai                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Model default    | `openai/sora-2`                                                                   |
| Mode            | Text-to-video, image-to-video, edit satu video                                    |
| Input referensi | 1 gambar atau 1 video                                                             |
| Override ukuran | Didukung                                                                          |
| Override lainnya | `aspectRatio`, `resolution`, `audio`, `watermark` diabaikan dengan peringatan tool |

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
Lihat [Pembuatan Video](/id/tools/video-generation) untuk parameter tool bersama, pemilihan provider, dan perilaku failover.
</Note>

## Kontribusi prompt GPT-5

OpenClaw menambahkan kontribusi prompt GPT-5 bersama untuk eksekusi keluarga GPT-5 lintas provider. Kontribusi ini berlaku berdasarkan id model, sehingga `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4`, dan ref GPT-5 kompatibel lainnya menerima overlay yang sama. Model GPT-4.x yang lebih lama tidak.

Provider harness Codex native bawaan (`codex/*`) menggunakan perilaku GPT-5 dan overlay Heartbeat yang sama melalui instruksi developer app-server Codex, sehingga sesi `codex/gpt-5.x` mempertahankan panduan tindak lanjut dan Heartbeat proaktif yang sama meskipun Codex memiliki sisa prompt harness.

Kontribusi GPT-5 menambahkan kontrak perilaku bertag untuk persistensi persona, keamanan eksekusi, disiplin tool, bentuk output, pemeriksaan penyelesaian, dan verifikasi. Perilaku balasan spesifik saluran dan silent-message tetap berada dalam system prompt OpenClaw bersama dan kebijakan pengiriman keluar. Panduan GPT-5 selalu diaktifkan untuk model yang cocok. Lapisan gaya interaksi yang ramah bersifat terpisah dan dapat dikonfigurasi.

| Nilai                  | Efek                                       |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (default) | Aktifkan lapisan gaya interaksi ramah      |
| `"on"`                 | Alias untuk `"friendly"`                   |
| `"off"`                | Nonaktifkan hanya lapisan gaya ramah       |

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
Nilai tidak peka huruf besar/kecil saat runtime, sehingga `"Off"` dan `"off"` sama-sama menonaktifkan lapisan gaya ramah.
</Tip>

<Note>
`plugins.entries.openai.config.personality` legacy masih dibaca sebagai fallback kompatibilitas saat pengaturan bersama `agents.defaults.promptOverlays.gpt5.personality` tidak disetel.
</Note>

## Suara dan ucapan

<AccordionGroup>
  <Accordion title="Sintesis ucapan (TTS)">
    Plugin `openai` bawaan mendaftarkan sintesis ucapan untuk permukaan `messages.tts`.

    | Pengaturan | Jalur config | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Suara | `messages.tts.providers.openai.voice` | `coral` |
    | Kecepatan | `messages.tts.providers.openai.speed` | (tidak disetel) |
    | Instruksi | `messages.tts.providers.openai.instructions` | (tidak disetel, hanya `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` untuk voice note, `mp3` untuk file |
    | API key | `messages.tts.providers.openai.apiKey` | Fallback ke `OPENAI_API_KEY` |
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
    Setel `OPENAI_TTS_BASE_URL` untuk menimpa base URL TTS tanpa memengaruhi endpoint API chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Plugin `openai` bawaan mendaftarkan batch speech-to-text melalui
    permukaan transkripsi pemahaman media OpenClaw.

    - Model default: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Jalur input: unggah file audio multipart
    - Didukung oleh OpenClaw di mana pun transkripsi audio masuk menggunakan
      `tools.media.audio`, termasuk segmen saluran suara Discord dan lampiran
      audio saluran

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

    Petunjuk bahasa dan prompt diteruskan ke OpenAI saat disuplai oleh
    config media audio bersama atau permintaan transkripsi per-panggilan.

  </Accordion>

  <Accordion title="Transkripsi realtime">
    Plugin `openai` bawaan mendaftarkan transkripsi realtime untuk Plugin Voice Call.

    | Pengaturan | Jalur config | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Bahasa | `...openai.language` | (tidak disetel) |
    | Prompt | `...openai.prompt` | (tidak disetel) |
    | Durasi hening | `...openai.silenceDurationMs` | `800` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Menggunakan koneksi WebSocket ke `wss://api.openai.com/v1/realtime` dengan audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Provider streaming ini ditujukan untuk jalur transkripsi realtime Voice Call; suara Discord saat ini merekam segmen pendek dan menggunakan jalur transkripsi batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Suara realtime">
    Plugin `openai` bawaan mendaftarkan suara realtime untuk Plugin Voice Call.

    | Pengaturan | Jalur config | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Suara | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Ambang VAD | `...openai.vadThreshold` | `0.5` |
    | Durasi hening | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Fallback ke `OPENAI_API_KEY` |

    <Note>
    Mendukung Azure OpenAI melalui kunci config `azureEndpoint` dan `azureDeployment`. Mendukung pemanggilan tool dua arah. Menggunakan format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw menggunakan WebSocket-first dengan fallback SSE (`"auto"`) untuk `openai/*` dan `openai-codex/*`.

    Dalam mode `"auto"`, OpenClaw:
    - Mencoba ulang satu kegagalan WebSocket awal sebelum fallback ke SSE
    - Setelah kegagalan, menandai WebSocket sebagai terdegradasi selama ~60 detik dan menggunakan SSE selama cooldown
    - Menambahkan header identitas sesi dan giliran yang stabil untuk retry dan reconnect
    - Menormalkan penghitung penggunaan (`input_tokens` / `prompt_tokens`) lintas varian transport

    | Nilai | Perilaku |
    |-------|----------|
    | `"auto"` (default) | WebSocket terlebih dahulu, fallback SSE |
    | `"sse"` | Paksa hanya SSE |
    | `"websocket"` | Paksa hanya WebSocket |

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

    Dokumentasi OpenAI terkait:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

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

<a id="openai-fast-mode"></a>

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
    Override sesi menang atas config. Menghapus override sesi di UI Sessions mengembalikan sesi ke default yang dikonfigurasi.
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
    Untuk model OpenAI Responses langsung (`openai/*` pada `api.openai.com`), OpenClaw otomatis mengaktifkan Compaction sisi server:

    - Memaksa `store: true` (kecuali compat model menetapkan `supportsStore: false`)
    - Menyuntikkan `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` default: 70% dari `contextWindow` (atau `80000` saat tidak tersedia)

    <Tabs>
      <Tab title="Aktifkan secara eksplisit">
        Berguna untuk endpoint kompatibel seperti Azure OpenAI Responses:

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
    `responsesServerCompaction` hanya mengontrol penyuntikan `context_management`. Model OpenAI Responses langsung tetap memaksa `store: true` kecuali compat menetapkan `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentik ketat">
    Untuk eksekusi keluarga GPT-5 pada `openai/*` dan `openai-codex/*`, OpenClaw dapat menggunakan kontrak eksekusi embedded yang lebih ketat:

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
    - Tidak lagi memperlakukan giliran yang hanya berisi rencana sebagai kemajuan yang berhasil saat aksi tool tersedia
    - Mencoba ulang giliran dengan pengarah bertindak-sekarang
    - Mengaktifkan `update_plan` secara otomatis untuk pekerjaan yang substansial
    - Memunculkan state terblokir eksplisit jika model terus merencanakan tanpa bertindak

    <Note>
    Hanya berlaku untuk eksekusi keluarga GPT-5 OpenAI dan Codex. Provider lain dan keluarga model yang lebih lama tetap menggunakan perilaku default.
    </Note>

  </Accordion>

  <Accordion title="Rute native vs kompatibel OpenAI">
    OpenClaw memperlakukan endpoint OpenAI langsung, Codex, dan Azure OpenAI secara berbeda dari proxy `/v1` generik yang kompatibel OpenAI:

    **Rute native** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mempertahankan `reasoning: { effort: "none" }` hanya untuk model yang mendukung effort OpenAI `none`
    - Menghilangkan reasoning yang dinonaktifkan untuk model atau proxy yang menolak `reasoning.effort: "none"`
    - Menjadikan skema tool default ke mode ketat
    - Menambahkan hidden attribution header hanya pada host native yang terverifikasi
    - Mempertahankan pembentukan permintaan khusus OpenAI (`service_tier`, `store`, reasoning-compat, petunjuk prompt-cache)

    **Rute proxy/kompatibel:**
    - Menggunakan perilaku compat yang lebih longgar
    - Tidak memaksa skema tool ketat atau header khusus native

    Azure OpenAI menggunakan transport native dan perilaku compat tetapi tidak menerima hidden attribution header.

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
