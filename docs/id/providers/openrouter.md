---
read_when:
    - Anda menginginkan satu API key untuk banyak LLM
    - Anda ingin menjalankan model melalui OpenRouter di OpenClaw
summary: Gunakan API terpadu OpenRouter untuk mengakses banyak model di OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:26:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter menyediakan **API terpadu** yang merutekan permintaan ke banyak model di balik satu
endpoint dan API key. OpenRouter kompatibel dengan OpenAI, jadi sebagian besar SDK OpenAI dapat digunakan hanya dengan mengganti base URL.

## Memulai

<Steps>
  <Step title="Dapatkan API key Anda">
    Buat API key di [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opsional) Beralih ke model tertentu">
    Onboarding menggunakan default `openrouter/auto`. Pilih model konkret nanti:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Contoh konfigurasi

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Referensi model

<Note>
Ref model mengikuti pola `openrouter/<provider>/<model>`. Untuk daftar lengkap
provider dan model yang tersedia, lihat [/concepts/model-providers](/id/concepts/model-providers).
</Note>

Contoh fallback bawaan:

| Model ref                            | Notes                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | Routing otomatis OpenRouter   |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 melalui MoonshotAI  |
| `openrouter/openrouter/healer-alpha` | Rute OpenRouter Healer Alpha  |
| `openrouter/openrouter/hunter-alpha` | Rute OpenRouter Hunter Alpha  |

## Autentikasi dan header

OpenRouter menggunakan token Bearer dengan API key Anda di balik layar.

Pada permintaan OpenRouter nyata (`https://openrouter.ai/api/v1`), OpenClaw juga menambahkan
header atribusi aplikasi yang didokumentasikan OpenRouter:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Jika Anda mengarahkan ulang provider OpenRouter ke proxy atau base URL lain, OpenClaw
**tidak** menyuntikkan header khusus OpenRouter tersebut atau marker cache Anthropic.
</Warning>

## Catatan lanjutan

<AccordionGroup>
  <Accordion title="Marker cache Anthropic">
    Pada rute OpenRouter yang terverifikasi, ref model Anthropic mempertahankan
    marker `cache_control` Anthropic khusus OpenRouter yang digunakan OpenClaw untuk
    pemakaian ulang prompt-cache yang lebih baik pada blok prompt system/developer.
  </Accordion>

  <Accordion title="Injeksi thinking / reasoning">
    Pada rute non-`auto` yang didukung, OpenClaw memetakan tingkat thinking yang dipilih ke
    payload reasoning proxy OpenRouter. Hint model yang tidak didukung dan
    `openrouter/auto` melewati injeksi reasoning tersebut.
  </Accordion>

  <Accordion title="Pembentukan permintaan khusus OpenAI">
    OpenRouter tetap berjalan melalui jalur kompatibel OpenAI bergaya proxy, jadi
    pembentukan permintaan khusus OpenAI native seperti `serviceTier`, Responses `store`,
    payload kompatibilitas reasoning OpenAI, dan hint prompt-cache tidak diteruskan.
  </Accordion>

  <Accordion title="Rute berbasis Gemini">
    Ref OpenRouter berbasis Gemini tetap berada pada jalur proxy-Gemini: OpenClaw mempertahankan
    sanitasi thought-signature Gemini di sana, tetapi tidak mengaktifkan validasi replay Gemini native
    atau penulisan ulang bootstrap.
  </Accordion>

  <Accordion title="Metadata routing provider">
    Jika Anda meneruskan routing provider OpenRouter di bawah parameter model, OpenClaw meneruskannya
    sebagai metadata routing OpenRouter sebelum wrapper stream bersama berjalan.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, model ref, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Referensi konfigurasi lengkap untuk agen, model, dan provider.
  </Card>
</CardGroup>
