---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model cloud atau lokal melalui Ollama
    - Anda memerlukan panduan penyiapan dan konfigurasi Ollama
    - Anda ingin model vision Ollama untuk pemahaman gambar
summary: Jalankan OpenClaw dengan Ollama (model cloud dan lokal)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:26:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw terintegrasi dengan API native Ollama (`/api/chat`) untuk model cloud yang di-host dan server Ollama lokal/self-hosted. Anda dapat menggunakan Ollama dalam tiga mode: `Cloud + Local` melalui host Ollama yang dapat dijangkau, `Cloud only` terhadap `https://ollama.com`, atau `Local only` terhadap host Ollama yang dapat dijangkau.

<Warning>
**Pengguna Ollama jarak jauh**: Jangan gunakan URL kompatibel OpenAI `/v1` (`http://host:11434/v1`) dengan OpenClaw. Ini merusak tool calling dan model dapat mengeluarkan JSON alat mentah sebagai teks biasa. Gunakan URL API native Ollama sebagai gantinya: `baseUrl: "http://host:11434"` (tanpa `/v1`).
</Warning>

## Memulai

Pilih metode penyiapan dan mode yang Anda sukai.

<Tabs>
  <Tab title="Onboarding (direkomendasikan)">
    **Terbaik untuk:** jalur tercepat menuju penyiapan Ollama cloud atau lokal yang berfungsi.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        ```

        Pilih **Ollama** dari daftar penyedia.
      </Step>
      <Step title="Pilih mode Anda">
        - **Cloud + Local** — host Ollama lokal plus model cloud yang dirutekan melalui host tersebut
        - **Cloud only** — model Ollama yang di-host melalui `https://ollama.com`
        - **Local only** — hanya model lokal
      </Step>
      <Step title="Pilih model">
        `Cloud only` meminta `OLLAMA_API_KEY` dan menyarankan default cloud yang di-host. `Cloud + Local` dan `Local only` meminta base URL Ollama, menemukan model yang tersedia, dan otomatis menarik model lokal yang dipilih jika belum tersedia. `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah sign in untuk akses cloud.
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Mode non-interaktif

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Secara opsional tentukan base URL atau model kustom:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Penyiapan manual">
    **Terbaik untuk:** kontrol penuh atas penyiapan cloud atau lokal.

    <Steps>
      <Step title="Pilih cloud atau lokal">
        - **Cloud + Local**: pasang Ollama, lakukan sign in dengan `ollama signin`, dan rutekan permintaan cloud melalui host tersebut
        - **Cloud only**: gunakan `https://ollama.com` dengan `OLLAMA_API_KEY`
        - **Local only**: pasang Ollama dari [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Tarik model lokal (khusus lokal)">
        ```bash
        ollama pull gemma4
        # atau
        ollama pull gpt-oss:20b
        # atau
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Aktifkan Ollama untuk OpenClaw">
        Untuk `Cloud only`, gunakan `OLLAMA_API_KEY` asli Anda. Untuk penyiapan berbasis host, nilai placeholder apa pun dapat digunakan:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Hanya lokal
        export OLLAMA_API_KEY="ollama-local"

        # Atau konfigurasikan di file config Anda
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Periksa dan setel model Anda">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Atau setel default di config:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Model cloud

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` menggunakan host Ollama yang dapat dijangkau sebagai titik kontrol untuk model lokal dan cloud. Ini adalah alur hibrida yang disukai Ollama.

    Gunakan **Cloud + Local** selama penyiapan. OpenClaw meminta base URL Ollama, menemukan model lokal dari host tersebut, dan memeriksa apakah host sudah sign in untuk akses cloud dengan `ollama signin`. Saat host sudah sign in, OpenClaw juga menyarankan default cloud yang di-host seperti `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, dan `glm-5.1:cloud`.

    Jika host belum sign in, OpenClaw mempertahankan penyiapan hanya-lokal sampai Anda menjalankan `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` berjalan terhadap API yang di-host Ollama di `https://ollama.com`.

    Gunakan **Cloud only** selama penyiapan. OpenClaw meminta `OLLAMA_API_KEY`, menetapkan `baseUrl: "https://ollama.com"`, dan mengisi daftar model cloud yang di-host. Jalur ini **tidak** memerlukan server Ollama lokal atau `ollama signin`.

    Daftar model cloud yang ditampilkan selama `openclaw onboard` diisi secara live dari `https://ollama.com/api/tags`, dibatasi hingga 500 entri, sehingga pemilih mencerminkan katalog yang di-host saat ini alih-alih seed statis. Jika `ollama.com` tidak dapat dijangkau atau tidak mengembalikan model pada saat penyiapan, OpenClaw menggunakan fallback ke saran hardcoded sebelumnya agar onboarding tetap selesai.

  </Tab>

  <Tab title="Local only">
    Dalam mode hanya-lokal, OpenClaw menemukan model dari instance Ollama yang dikonfigurasi. Jalur ini ditujukan untuk server Ollama lokal atau self-hosted.

    OpenClaw saat ini menyarankan `gemma4` sebagai default lokal.

  </Tab>
</Tabs>

## Penemuan model (penyedia implisit)

Saat Anda menetapkan `OLLAMA_API_KEY` (atau profil auth) dan **tidak** mendefinisikan `models.providers.ollama`, OpenClaw menemukan model dari instance Ollama lokal di `http://127.0.0.1:11434`.

| Perilaku             | Detail                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query katalog        | Men-query `/api/tags`                                                                                                                                                |
| Deteksi kapabilitas  | Menggunakan lookup `/api/show` best-effort untuk membaca `contextWindow` dan mendeteksi kapabilitas (termasuk vision)                                              |
| Model vision         | Model dengan kapabilitas `vision` yang dilaporkan oleh `/api/show` ditandai sebagai mampu gambar (`input: ["text", "image"]`), sehingga OpenClaw otomatis menyuntikkan gambar ke prompt |
| Deteksi reasoning    | Menandai `reasoning` dengan heuristik nama model (`r1`, `reasoning`, `think`)                                                                                       |
| Batas token          | Menetapkan `maxTokens` ke batas max-token Ollama default yang digunakan oleh OpenClaw                                                                                |
| Biaya                | Menetapkan semua biaya ke `0`                                                                                                                                        |

Ini menghindari entri model manual sambil menjaga katalog tetap selaras dengan instance Ollama lokal.

```bash
# Lihat model apa saja yang tersedia
ollama list
openclaw models list
```

Untuk menambahkan model baru, cukup tarik dengan Ollama:

```bash
ollama pull mistral
```

Model baru akan otomatis ditemukan dan tersedia untuk digunakan.

<Note>
Jika Anda menetapkan `models.providers.ollama` secara eksplisit, penemuan otomatis dilewati dan Anda harus mendefinisikan model secara manual. Lihat bagian config eksplisit di bawah.
</Note>

## Vision dan deskripsi gambar

Plugin Ollama bawaan mendaftarkan Ollama sebagai penyedia media-understanding yang mampu menangani gambar. Ini memungkinkan OpenClaw merutekan permintaan deskripsi gambar eksplisit dan default model gambar yang dikonfigurasi melalui model vision Ollama lokal atau yang di-host.

Untuk vision lokal, tarik model yang mendukung gambar:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Lalu verifikasi dengan CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` harus berupa referensi penuh `<provider/model>`. Saat disetel, `openclaw infer image describe` menjalankan model itu secara langsung alih-alih melewati deskripsi karena model mendukung vision native.

Untuk menjadikan Ollama sebagai model image-understanding default untuk media masuk, konfigurasikan `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Jika Anda mendefinisikan `models.providers.ollama.models` secara manual, tandai model vision dengan dukungan input gambar:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw menolak permintaan deskripsi gambar untuk model yang tidak ditandai mampu gambar. Dengan penemuan implisit, OpenClaw membaca ini dari Ollama saat `/api/show` melaporkan kapabilitas vision.

## Konfigurasi

<Tabs>
  <Tab title="Dasar (penemuan implisit)">
    Jalur aktivasi paling sederhana untuk hanya-lokal adalah melalui variabel environment:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jika `OLLAMA_API_KEY` disetel, Anda dapat menghilangkan `apiKey` di entri penyedia dan OpenClaw akan mengisinya untuk pemeriksaan ketersediaan.
    </Tip>

  </Tab>

  <Tab title="Eksplisit (model manual)">
    Gunakan config eksplisit saat Anda menginginkan penyiapan cloud yang di-host, Ollama berjalan di host/port lain, Anda ingin memaksa context window atau daftar model tertentu, atau Anda ingin definisi model sepenuhnya manual.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Base URL kustom">
    Jika Ollama berjalan di host atau port yang berbeda (config eksplisit menonaktifkan penemuan otomatis, jadi definisikan model secara manual):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Tanpa /v1 - gunakan URL API native Ollama
            api: "ollama", // Setel secara eksplisit untuk menjamin perilaku tool-calling native
          },
        },
      },
    }
    ```

    <Warning>
    Jangan tambahkan `/v1` ke URL. Path `/v1` menggunakan mode yang kompatibel dengan OpenAI, di mana tool calling tidak andal. Gunakan base URL Ollama tanpa suffix path.
    </Warning>

  </Tab>
</Tabs>

### Pemilihan model

Setelah dikonfigurasi, semua model Ollama Anda tersedia:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

OpenClaw mendukung **Ollama Web Search** sebagai penyedia `web_search` bawaan.

| Properti    | Detail                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Host        | Menggunakan host Ollama yang dikonfigurasi (`models.providers.ollama.baseUrl` jika disetel, jika tidak `http://127.0.0.1:11434`) |
| Auth        | Tanpa key                                                                                                           |
| Persyaratan | Ollama harus berjalan dan sudah sign in dengan `ollama signin`                                                      |

Pilih **Ollama Web Search** saat `openclaw onboard` atau `openclaw configure --section web`, atau setel:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
Untuk detail penyiapan dan perilaku lengkap, lihat [Ollama Web Search](/id/tools/ollama-search).
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode kompatibel OpenAI lama">
    <Warning>
    **Tool calling tidak andal dalam mode kompatibel OpenAI.** Gunakan mode ini hanya jika Anda memerlukan format OpenAI untuk proxy dan tidak bergantung pada perilaku tool calling native.
    </Warning>

    Jika Anda perlu menggunakan endpoint yang kompatibel dengan OpenAI sebagai gantinya (misalnya di balik proxy yang hanya mendukung format OpenAI), setel `api: "openai-completions"` secara eksplisit:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Mode ini mungkin tidak mendukung streaming dan tool calling secara bersamaan. Anda mungkin perlu menonaktifkan streaming dengan `params: { streaming: false }` di config model.

    Saat `api: "openai-completions"` digunakan dengan Ollama, OpenClaw secara default menyuntikkan `options.num_ctx` agar Ollama tidak diam-diam kembali ke context window 4096. Jika proxy/upstream Anda menolak field `options` yang tidak dikenal, nonaktifkan perilaku ini:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Context window">
    Untuk model yang ditemukan otomatis, OpenClaw menggunakan context window yang dilaporkan oleh Ollama saat tersedia, jika tidak maka kembali ke context window default Ollama yang digunakan oleh OpenClaw.

    Anda dapat mengoverride `contextWindow` dan `maxTokens` di config penyedia eksplisit:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Model reasoning">
    OpenClaw memperlakukan model dengan nama seperti `deepseek-r1`, `reasoning`, atau `think` sebagai model yang mampu reasoning secara default.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Tidak diperlukan konfigurasi tambahan -- OpenClaw menandainya secara otomatis.

  </Accordion>

  <Accordion title="Biaya model">
    Ollama gratis dan berjalan secara lokal, sehingga semua biaya model disetel ke $0. Ini berlaku baik untuk model yang ditemukan otomatis maupun yang didefinisikan secara manual.
  </Accordion>

  <Accordion title="Embedding memori">
    Plugin Ollama bawaan mendaftarkan penyedia embedding memori untuk
    [pencarian memori](/id/concepts/memory). Ini menggunakan base URL Ollama
    dan API key yang dikonfigurasi.

    | Properti      | Nilai              |
    | ------------- | ------------------ |
    | Model default | `nomic-embed-text` |
    | Auto-pull     | Ya — model embedding akan ditarik secara otomatis jika belum ada secara lokal |

    Untuk memilih Ollama sebagai penyedia embedding pencarian memori:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfigurasi streaming">
    Integrasi Ollama OpenClaw menggunakan **API native Ollama** (`/api/chat`) secara default, yang sepenuhnya mendukung streaming dan tool calling secara bersamaan. Tidak diperlukan konfigurasi khusus.

    <Tip>
    Jika Anda perlu menggunakan endpoint yang kompatibel dengan OpenAI, lihat bagian "Mode kompatibel OpenAI lama" di atas. Streaming dan tool calling mungkin tidak berfungsi secara bersamaan dalam mode tersebut.
    </Tip>

  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Ollama tidak terdeteksi">
    Pastikan Ollama berjalan dan Anda telah menetapkan `OLLAMA_API_KEY` (atau profil auth), serta Anda **tidak** mendefinisikan entri `models.providers.ollama` eksplisit:

    ```bash
    ollama serve
    ```

    Verifikasi bahwa API dapat diakses:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Tidak ada model yang tersedia">
    Jika model Anda tidak terdaftar, tarik model tersebut secara lokal atau definisikan secara eksplisit di `models.providers.ollama`.

    ```bash
    ollama list  # Lihat apa yang sudah terpasang
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Atau model lain
    ```

  </Accordion>

  <Accordion title="Koneksi ditolak">
    Periksa bahwa Ollama berjalan pada port yang benar:

    ```bash
    # Periksa apakah Ollama berjalan
    ps aux | grep ollama

    # Atau mulai ulang Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Bantuan lebih lanjut: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Gambaran umum semua penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
  <Card title="Ollama Web Search" href="/id/tools/ollama-search" icon="magnifying-glass">
    Detail penyiapan dan perilaku lengkap untuk pencarian web yang didukung Ollama.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi config lengkap.
  </Card>
</CardGroup>
