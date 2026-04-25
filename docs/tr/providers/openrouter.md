---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
    - OpenRouter'ı görsel üretimi için kullanmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanma
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T13:56:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter, istekleri tek bir
uç nokta ve API anahtarı arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı base URL değiştirilerek çalışır.

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [openrouter.ai/keys](https://openrouter.ai/keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(İsteğe bağlı) Belirli bir modele geçin">
    İlk kurulum varsayılan olarak `openrouter/auto` kullanır. Daha sonra somut bir model seçin:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Yapılandırma örneği

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

## Model başvuruları

<Note>
Model başvuruları `openrouter/<provider>/<model>` desenini izler. Kullanılabilir
sağlayıcıların ve modellerin tam listesi için bkz. [/concepts/model-providers](/tr/concepts/model-providers).
</Note>

Paketlenmiş geri dönüş örnekleri:

| Model başvurusu                     | Notlar                         |
| ----------------------------------- | ------------------------------ |
| `openrouter/auto`                   | OpenRouter otomatik yönlendirme |
| `openrouter/moonshotai/kimi-k2.6`   | MoonshotAI üzerinden Kimi K2.6 |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha yolu  |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha yolu  |

## Görsel üretimi

OpenRouter, `image_generate` aracını da destekleyebilir. `agents.defaults.imageGenerationModel` altında bir OpenRouter görsel modelini kullanın:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw, görsel isteklerini `modalities: ["image", "text"]` ile OpenRouter'ın sohbet tamamlama görsel API'sine gönderir. Gemini görsel modelleri, OpenRouter'ın `image_config` yapısı üzerinden desteklenen `aspectRatio` ve `resolution` ipuçlarını alır.

## Metinden konuşmaya

OpenRouter, OpenAI uyumlu
`/audio/speech` uç noktası üzerinden TTS sağlayıcısı olarak da kullanılabilir.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

`messages.tts.providers.openrouter.apiKey` boş bırakılırsa TTS,
önce `models.providers.openrouter.apiKey`, sonra `OPENROUTER_API_KEY` değerini yeniden kullanır.

## Kimlik doğrulama ve başlıklar

OpenRouter, perde arkasında API anahtarınızla birlikte bir Bearer token kullanır.

Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca
OpenRouter'ın belgelenmiş uygulama ilişkilendirme başlıklarını da ekler:

| Başlık                    | Değer                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter sağlayıcısını başka bir proxy'ye veya başka bir base URL'ye yeniden yönlendirirseniz, OpenClaw bu OpenRouter'a özgü başlıkları veya Anthropic önbellek işaretleyicilerini **eklemez**.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Anthropic önbellek işaretleyicileri">
    Doğrulanmış OpenRouter yollarında, Anthropic model başvuruları
    sistem/geliştirici istem bloklarında daha iyi istem önbelleği yeniden kullanımı için
    OpenClaw'ın kullandığı OpenRouter'a özgü Anthropic `cache_control` işaretleyicilerini korur.
  </Accordion>

  <Accordion title="Thinking / reasoning ekleme">
    Desteklenen `auto` olmayan yollarda OpenClaw, seçilen thinking seviyesini
    OpenRouter proxy reasoning payload'larına eşler. Desteklenmeyen model ipuçları ve
    `openrouter/auto` bu reasoning eklemesini atlar.
  </Accordion>

  <Accordion title="Yalnızca OpenAI isteği şekillendirme">
    OpenRouter yine proxy tarzı OpenAI uyumlu yol üzerinden çalıştığı için
    `serviceTier`, Responses `store`,
    OpenAI reasoning uyumluluk payload'ları ve istem önbelleği ipuçları gibi yalnızca yerel OpenAI istek şekillendirmeleri iletilmez.
  </Accordion>

  <Accordion title="Gemini destekli yollar">
    Gemini destekli OpenRouter başvuruları proxy-Gemini yolunda kalır: OpenClaw
    orada Gemini thought-signature temizliğini korur, ancak yerel Gemini
    yeniden oynatma doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez.
  </Accordion>

  <Accordion title="Sağlayıcı yönlendirme meta verisi">
    Model parametreleri altında OpenRouter sağlayıcı yönlendirmesini iletirseniz, OpenClaw bunu
    paylaşılan akış sarmalayıcıları çalışmadan önce OpenRouter yönlendirme meta verisi olarak iletir.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve hata durumunda devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Ajanlar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
