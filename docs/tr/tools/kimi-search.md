---
read_when:
    - '`web_search` için Kimi kullanmak istiyorsunuz'
    - Bir `KIMI_API_KEY` veya `MOONSHOT_API_KEY` gerekiyor
summary: Moonshot web araması üzerinden Kimi web araması
title: Kimi Search
x-i18n:
    generated_at: "2026-04-21T09:06:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi Search

OpenClaw, Kimi'yi `web_search` sağlayıcısı olarak destekler; Moonshot web aramasını
alıntılarla yapay zekâ tarafından sentezlenmiş yanıtlar üretmek için kullanır.

## API anahtarı alın

<Steps>
  <Step title="Bir anahtar oluşturun">
    [Moonshot AI](https://platform.moonshot.cn/) üzerinden bir API anahtarı alın.
  </Step>
  <Step title="Anahtarı kaydedin">
    Gateway ortamında `KIMI_API_KEY` veya `MOONSHOT_API_KEY` ayarlayın ya da
    şununla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` veya
`openclaw configure --section web` sırasında **Kimi** seçtiğinizde OpenClaw ayrıca şunları da sorabilir:

- Moonshot API bölgesi:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- varsayılan Kimi web arama modeli (varsayılan `kimi-k2.6`)

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // KIMI_API_KEY veya MOONSHOT_API_KEY ayarlıysa isteğe bağlı
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

Sohbet için Çin API ana bilgisayarını kullanırsanız (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), `tools.web.search.kimi.baseUrl` atlandığında OpenClaw aynı ana bilgisayarı Kimi
`web_search` için yeniden kullanır; böylece
[platform.moonshot.cn](https://platform.moonshot.cn/) anahtarları yanlışlıkla uluslararası
uç noktaya gitmez (bu genellikle HTTP 401 döndürür). Farklı bir arama temel URL'sine ihtiyacınız olduğunda
`tools.web.search.kimi.baseUrl` ile geçersiz kılın.

**Ortam alternatifi:** Gateway ortamında `KIMI_API_KEY` veya `MOONSHOT_API_KEY` ayarlayın.
Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.

`baseUrl` alanını atlarsanız OpenClaw varsayılan olarak `https://api.moonshot.ai/v1` kullanır.
`model` alanını atlarsanız OpenClaw varsayılan olarak `kimi-k2.6` kullanır.

## Nasıl çalışır

Kimi, Gemini ve Grok'un temellendirilmiş yanıt yaklaşımına benzer şekilde,
satır içi alıntılarla yanıt sentezlemek için Moonshot web aramasını kullanır.

## Desteklenen parametreler

Kimi araması `query` desteği sunar.

Paylaşılan `web_search` uyumluluğu için `count` kabul edilir, ancak Kimi yine de
N sonuçlu bir liste yerine alıntılar içeren tek bir sentezlenmiş yanıt
döndürür.

Sağlayıcıya özgü filtreler şu anda desteklenmiyor.

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Moonshot AI](/tr/providers/moonshot) -- Moonshot modeli + Kimi Coding sağlayıcı belgeleri
- [Gemini Search](/tr/tools/gemini-search) -- Google grounding üzerinden yapay zekâ tarafından sentezlenmiş yanıtlar
- [Grok Search](/tr/tools/grok-search) -- xAI grounding üzerinden yapay zekâ tarafından sentezlenmiş yanıtlar
