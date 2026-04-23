---
read_when:
    - Anda ingin menggunakan Qwen dengan OpenClaw
    - Anda sebelumnya menggunakan Qwen OAuth
summary: Gunakan Qwen Cloud melalui provider qwen bawaan OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T09:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth telah dihapus.** Integrasi OAuth tingkat gratis
(`qwen-portal`) yang menggunakan endpoint `portal.qwen.ai` sudah tidak tersedia lagi.
Lihat [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) untuk
latar belakangnya.

</Warning>

OpenClaw sekarang memperlakukan Qwen sebagai provider bawaan kelas satu dengan id kanonis
`qwen`. Provider bawaan ini menargetkan endpoint Qwen Cloud / Alibaba DashScope dan
Coding Plan serta menjaga id `modelstudio` lama tetap berfungsi sebagai
alias kompatibilitas.

- Provider: `qwen`
- Env var yang disarankan: `QWEN_API_KEY`
- Juga diterima untuk kompatibilitas: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Gaya API: kompatibel dengan OpenAI

<Tip>
Jika Anda ingin `qwen3.6-plus`, pilih endpoint **Standard (bayar sesuai pemakaian)**.
Dukungan Coding Plan dapat tertinggal dari katalog publik.
</Tip>

## Memulai

Pilih jenis paket Anda lalu ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Coding Plan (langganan)">
    **Terbaik untuk:** akses berbasis langganan melalui Qwen Coding Plan.

    <Steps>
      <Step title="Dapatkan API key Anda">
        Buat atau salin API key dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        Untuk endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Untuk endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Setel model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    id auth-choice `modelstudio-*` lama dan ref model `modelstudio/...` tetap
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya memilih
    id auth-choice `qwen-*` kanonis dan ref model `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (bayar sesuai pemakaian)">
    **Terbaik untuk:** akses bayar sesuai pemakaian melalui endpoint Model Studio Standard, termasuk model seperti `qwen3.6-plus` yang mungkin tidak tersedia pada Coding Plan.

    <Steps>
      <Step title="Dapatkan API key Anda">
        Buat atau salin API key dari [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Jalankan onboarding">
        Untuk endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Untuk endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Setel model default">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    id auth-choice `modelstudio-*` lama dan ref model `modelstudio/...` tetap
    berfungsi sebagai alias kompatibilitas, tetapi alur penyiapan baru sebaiknya memilih
    id auth-choice `qwen-*` kanonis dan ref model `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Jenis paket dan endpoint

| Paket                      | Wilayah | Auth choice                | Endpoint                                         |
| -------------------------- | ------- | -------------------------- | ------------------------------------------------ |
| Standard (bayar sesuai pemakaian) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (bayar sesuai pemakaian) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (langganan)    | China   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (langganan)    | Global  | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Provider otomatis memilih endpoint berdasarkan auth choice Anda. Pilihan kanonis
menggunakan keluarga `qwen-*`; `modelstudio-*` tetap khusus kompatibilitas.
Anda dapat menimpanya dengan `baseUrl` kustom di config.

<Tip>
**Kelola key:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentasi:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Katalog bawaan

OpenClaw saat ini mengirimkan katalog Qwen bawaan berikut. Katalog yang dikonfigurasi
bersifat sadar endpoint: config Coding Plan menghilangkan model yang hanya diketahui berfungsi pada
endpoint Standard.

| Ref model                   | Input       | Konteks   | Catatan                                            |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Model default                                      |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Pilih endpoint Standard saat Anda memerlukan model ini |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Lini Qwen Max                                      |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Reasoning diaktifkan                               |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI via Alibaba                            |

<Note>
Ketersediaan tetap dapat bervariasi menurut endpoint dan paket penagihan meskipun sebuah model
ada di katalog bawaan.
</Note>

## Add-on multimodal

Plugin `qwen` juga mengekspos capability multimodal pada endpoint DashScope
**Standard** (bukan endpoint Coding Plan):

- **Pemahaman video** melalui `qwen-vl-max-latest`
- **Generasi video Wan** melalui `wan2.6-t2v` (default), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Untuk menggunakan Qwen sebagai provider video default:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Lihat [Video Generation](/id/tools/video-generation) untuk parameter alat bersama, pemilihan provider, dan perilaku failover.
</Note>

## Lanjutan

<AccordionGroup>
  <Accordion title="Pemahaman gambar dan video">
    Plugin Qwen bawaan mendaftarkan media understanding untuk gambar dan video
    pada endpoint DashScope **Standard** (bukan endpoint Coding Plan).

    | Properti      | Nilai                |
    | ------------- | -------------------- |
    | Model         | `qwen-vl-max-latest` |
    | Input yang didukung | Gambar, video    |

    Media understanding di-resolve otomatis dari auth Qwen yang dikonfigurasi — tidak
    diperlukan config tambahan. Pastikan Anda menggunakan endpoint Standard (bayar sesuai pemakaian)
    untuk dukungan media understanding.

  </Accordion>

  <Accordion title="Ketersediaan Qwen 3.6 Plus">
    `qwen3.6-plus` tersedia pada endpoint Model Studio Standard (bayar sesuai pemakaian):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Jika endpoint Coding Plan mengembalikan error "unsupported model" untuk
    `qwen3.6-plus`, beralihlah ke Standard (bayar sesuai pemakaian), bukan ke
    pasangan endpoint/key Coding Plan.

  </Accordion>

  <Accordion title="Rencana capability">
    Plugin `qwen` sedang diposisikan sebagai rumah vendor untuk seluruh surface Qwen
    Cloud, bukan hanya model coding/teks.

    - **Model text/chat:** sudah dibundel
    - **Tool calling, output terstruktur, thinking:** diwarisi dari transport kompatibel OpenAI
    - **Generasi gambar:** direncanakan di lapisan provider-plugin
    - **Pemahaman gambar/video:** sudah dibundel pada endpoint Standard
    - **Speech/audio:** direncanakan di lapisan provider-plugin
    - **Memory embeddings/reranking:** direncanakan melalui surface adapter embedding
    - **Generasi video:** sudah dibundel melalui capability video-generation bersama

  </Accordion>

  <Accordion title="Detail generasi video">
    Untuk generasi video, OpenClaw memetakan wilayah Qwen yang dikonfigurasi ke host
    DashScope AIGC yang cocok sebelum mengirim pekerjaan:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Ini berarti `models.providers.qwen.baseUrl` normal yang menunjuk ke salah satu host
    Qwen Coding Plan atau Standard tetap menjaga generasi video pada endpoint video
    DashScope regional yang benar.

    Batas generasi video Qwen bawaan saat ini:

    - Hingga **1** video keluaran per permintaan
    - Hingga **1** gambar masukan
    - Hingga **4** video masukan
    - Hingga durasi **10 detik**
    - Mendukung `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`
    - Mode gambar/video referensi saat ini memerlukan **URL http(s) remote**. Path
      file lokal ditolak di awal karena endpoint video DashScope tidak
      menerima buffer lokal yang diunggah untuk referensi tersebut.

  </Accordion>

  <Accordion title="Kompatibilitas penggunaan streaming">
    Endpoint Model Studio native mengiklankan kompatibilitas penggunaan streaming pada
    transport bersama `openai-completions`. OpenClaw kini mengaitkannya pada capability
    endpoint, sehingga id provider kustom yang kompatibel dengan DashScope dan menargetkan host
    native yang sama mewarisi perilaku streaming-usage yang sama alih-alih
    memerlukan id provider `qwen` bawaan secara khusus.

    Kompatibilitas penggunaan native-streaming berlaku untuk host Coding Plan dan
    host kompatibel DashScope Standard:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Wilayah endpoint multimodal">
    Surface multimodal (pemahaman video dan generasi video Wan) menggunakan
    endpoint DashScope **Standard**, bukan endpoint Coding Plan:

    - URL dasar Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL dasar Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Penyiapan lingkungan dan daemon">
    Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `QWEN_API_KEY` tersedia
    untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="Generasi video" href="/id/tools/video-generation" icon="video">
    Parameter alat video bersama dan pemilihan provider.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/id/providers/alibaba" icon="cloud">
    Provider ModelStudio lama dan catatan migrasi.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Pemecahan masalah umum dan FAQ.
  </Card>
</CardGroup>
