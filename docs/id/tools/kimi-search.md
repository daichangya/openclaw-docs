---
read_when:
    - Anda ingin menggunakan Kimi untuk `web_search`
    - Anda memerlukan `KIMI_API_KEY` atau `MOONSHOT_API_KEY`
summary: Kimi web search melalui Moonshot web search
title: Pencarian Kimi
x-i18n:
    generated_at: "2026-04-21T09:24:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Pencarian Kimi

OpenClaw mendukung Kimi sebagai provider `web_search`, menggunakan Moonshot web search
untuk menghasilkan jawaban yang disintesis AI dengan sitasi.

## Dapatkan API key

<Steps>
  <Step title="Buat key">
    Dapatkan API key dari [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Simpan key">
    Setel `KIMI_API_KEY` atau `MOONSHOT_API_KEY` di environment Gateway, atau
    konfigurasi melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Saat Anda memilih **Kimi** selama `openclaw onboard` atau
`openclaw configure --section web`, OpenClaw juga dapat meminta:

- region API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- model web-search Kimi default (default ke `kimi-k2.6`)

## Config

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opsional jika KIMI_API_KEY atau MOONSHOT_API_KEY disetel
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Jika Anda menggunakan host API China untuk chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw menggunakan kembali host yang sama itu untuk
`web_search` Kimi saat `tools.web.search.kimi.baseUrl` dihilangkan, sehingga key dari
[platform.moonshot.cn](https://platform.moonshot.cn/) tidak salah mengenai
endpoint internasional (yang sering mengembalikan HTTP 401). Override
dengan `tools.web.search.kimi.baseUrl` saat Anda memerlukan base URL pencarian yang berbeda.

**Alternatif environment:** setel `KIMI_API_KEY` atau `MOONSHOT_API_KEY` di
environment Gateway. Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

Jika Anda menghilangkan `baseUrl`, OpenClaw default ke `https://api.moonshot.ai/v1`.
Jika Anda menghilangkan `model`, OpenClaw default ke `kimi-k2.6`.

## Cara kerjanya

Kimi menggunakan Moonshot web search untuk mensintesis jawaban dengan sitasi inline,
mirip dengan pendekatan respons berpijak milik Gemini dan Grok.

## Parameter yang didukung

Pencarian Kimi mendukung `query`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi Kimi tetap
mengembalikan satu jawaban tersintesis dengan sitasi alih-alih daftar N hasil.

Filter khusus provider saat ini belum didukung.

## Terkait

- [Web Search overview](/id/tools/web) -- semua provider dan deteksi otomatis
- [Moonshot AI](/id/providers/moonshot) -- dokumentasi provider model Moonshot + Kimi Coding
- [Gemini Search](/id/tools/gemini-search) -- jawaban yang disintesis AI melalui grounding Google
- [Grok Search](/id/tools/grok-search) -- jawaban yang disintesis AI melalui grounding xAI
