---
read_when:
    - Anda ingin menggunakan Qwen dengan OpenClaw
    - Anda sebelumnya menggunakan Qwen OAuth
summary: Gunakan Qwen Cloud melalui provider qwen bawaan OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-09T01:30:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4786df2cb6ec1ab29d191d012c61dcb0e5468bf0f8561fbbb50eed741efad325
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth telah dihapus.** Integrasi OAuth tingkat gratis
(`qwen-portal`) yang menggunakan endpoint `portal.qwen.ai` tidak lagi tersedia.
Lihat [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) untuk
latar belakang.

</Warning>

## Rekomendasi: Qwen Cloud

OpenClaw kini memperlakukan Qwen sebagai provider bawaan kelas satu dengan id kanonis
`qwen`. Provider bawaan ini menargetkan endpoint Qwen Cloud / Alibaba DashScope dan
Coding Plan serta menjaga id lama `modelstudio` tetap berfungsi sebagai
alias kompatibilitas.

- Provider: `qwen`
- Variabel env yang disarankan: `QWEN_API_KEY`
- Juga diterima untuk kompatibilitas: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Gaya API: kompatibel dengan OpenAI

Jika Anda ingin `qwen3.6-plus`, gunakan endpoint **Standard (pay-as-you-go)**.
Dukungan Coding Plan dapat tertinggal dari katalog publik.

```bash
# Endpoint Coding Plan Global
openclaw onboard --auth-choice qwen-api-key

# Endpoint Coding Plan China
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint Standard (pay-as-you-go) Global
openclaw onboard --auth-choice qwen-standard-api-key

# Endpoint Standard (pay-as-you-go) China
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Id `auth-choice` lama `modelstudio-*` dan ref model `modelstudio/...` masih
berfungsi sebagai alias kompatibilitas, tetapi alur setup baru sebaiknya menggunakan
id `auth-choice` kanonis `qwen-*` dan ref model `qwen/...`.

Setelah onboarding, setel model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Jenis paket dan endpoint

| Paket | Wilayah | Pilihan auth | Endpoint |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go) | China | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1` |
| Standard (pay-as-you-go) | Global | `qwen-standard-api-key` | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (langganan) | China | `qwen-api-key-cn` | `coding.dashscope.aliyuncs.com/v1` |
| Coding Plan (langganan) | Global | `qwen-api-key` | `coding-intl.dashscope.aliyuncs.com/v1` |

Provider secara otomatis memilih endpoint berdasarkan pilihan auth Anda. Pilihan kanonis
menggunakan keluarga `qwen-*`; `modelstudio-*` tetap khusus untuk kompatibilitas.
Anda dapat menimpa dengan `baseUrl` kustom di config.

Endpoint native Model Studio mengiklankan kompatibilitas penggunaan streaming pada
transport bersama `openai-completions`. OpenClaw kini mengaitkannya ke
kapabilitas endpoint, sehingga id provider kustom DashScope-compatible yang menargetkan
host native yang sama mewarisi perilaku penggunaan streaming yang sama alih-alih
secara khusus mewajibkan id provider bawaan `qwen`.

## Dapatkan API key Anda

- **Kelola key**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Dokumentasi**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Katalog bawaan

OpenClaw saat ini menyediakan katalog Qwen bawaan ini. Katalog yang dikonfigurasi
bergantung pada endpoint: config Coding Plan menghilangkan model yang hanya diketahui berfungsi pada
endpoint Standard.

| Ref model | Input | Konteks | Catatan |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus` | text, image | 1,000,000 | Model default |
| `qwen/qwen3.6-plus` | text, image | 1,000,000 | Gunakan endpoint Standard jika Anda memerlukan model ini |
| `qwen/qwen3-max-2026-01-23` | text | 262,144 | Lini Qwen Max |
| `qwen/qwen3-coder-next` | text | 262,144 | Coding |
| `qwen/qwen3-coder-plus` | text | 1,000,000 | Coding |
| `qwen/MiniMax-M2.5` | text | 1,000,000 | Reasoning diaktifkan |
| `qwen/glm-5` | text | 202,752 | GLM |
| `qwen/glm-4.7` | text | 202,752 | GLM |
| `qwen/kimi-k2.5` | text, image | 262,144 | Moonshot AI melalui Alibaba |

Ketersediaan tetap dapat bervariasi menurut endpoint dan paket penagihan meskipun suatu model
ada dalam katalog bawaan.

Kompatibilitas penggunaan native-streaming berlaku untuk host Coding Plan dan
host Standard yang kompatibel dengan DashScope:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Ketersediaan Qwen 3.6 Plus

`qwen3.6-plus` tersedia pada endpoint Model Studio Standard (pay-as-you-go):

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Jika endpoint Coding Plan mengembalikan error "unsupported model" untuk
`qwen3.6-plus`, beralihlah ke Standard (pay-as-you-go), bukan pasangan
endpoint/key Coding Plan.

## Rencana kapabilitas

Ekstensi `qwen` sedang diposisikan sebagai rumah vendor untuk seluruh permukaan Qwen
Cloud, bukan hanya model coding/text.

- Model text/chat: sudah bawaan sekarang
- Pemanggilan tool, output terstruktur, thinking: diwarisi dari transport yang kompatibel dengan OpenAI
- Pembuatan gambar: direncanakan di lapisan provider-plugin
- Pemahaman gambar/video: sudah bawaan sekarang pada endpoint Standard
- Speech/audio: direncanakan di lapisan provider-plugin
- Embedding/reranking memory: direncanakan melalui permukaan adapter embedding
- Pembuatan video: sudah bawaan sekarang melalui capability video-generation bersama

## Add-on multimodal

Ekstensi `qwen` sekarang juga mengekspos:

- Pemahaman video melalui `qwen-vl-max-latest`
- Pembuatan video Wan melalui:
  - `wan2.6-t2v` (default)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Permukaan multimodal ini menggunakan endpoint DashScope **Standard**, bukan
endpoint Coding Plan.

- Base URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Base URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Untuk pembuatan video, OpenClaw memetakan wilayah Qwen yang dikonfigurasi ke
host AIGC DashScope yang sesuai sebelum mengirimkan pekerjaan:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Itu berarti `models.providers.qwen.baseUrl` normal yang menunjuk ke salah satu
host Qwen Coding Plan atau Standard tetap menjaga pembuatan video pada endpoint video DashScope
regional yang benar.

Untuk pembuatan video, setel model default secara eksplisit:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Batas pembuatan video Qwen bawaan saat ini:

- Hingga **1** video output per permintaan
- Hingga **1** gambar input
- Hingga **4** video input
- Durasi hingga **10 detik**
- Mendukung `size`, `aspectRatio`, `resolution`, `audio`, dan `watermark`
- Mode gambar/video referensi saat ini memerlukan **URL http(s) jarak jauh**. Path file lokal
  ditolak di awal karena endpoint video DashScope tidak
  menerima buffer lokal yang diunggah untuk referensi tersebut.

Lihat [Pembuatan Video](/id/tools/video-generation) untuk
parameter tool bersama, pemilihan provider, dan perilaku failover.

## Catatan environment

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `QWEN_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).
