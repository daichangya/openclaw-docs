---
read_when:
    - OpenClaw'ı yerel bir SGLang sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu `/v1` uç noktaları istiyorsunuz
summary: OpenClaw'ı SGLang ile çalıştırın (OpenAI uyumlu self-hosted sunucu)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T09:09:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang, **OpenAI uyumlu** bir HTTP API aracılığıyla açık kaynak modeller sunabilir.
OpenClaw, `openai-completions` API'sini kullanarak SGLang'a bağlanabilir.

OpenClaw ayrıca, `SGLANG_API_KEY` ile katıldığınızda
(kimlik doğrulama zorunlu değilse herhangi bir değer çalışır)
ve açık bir `models.providers.sglang` girdisi tanımlamadığınızda SGLang'daki mevcut modelleri **otomatik keşfedebilir**.

OpenClaw, `sglang` sağlayıcısını yerel bir OpenAI uyumlu sağlayıcı olarak ele alır ve streamed usage accounting desteğiyle birlikte
durum/bağlam token sayıları `stream_options.include_usage` yanıtlarından güncellenebilir.

## Başlangıç

<Steps>
  <Step title="SGLang'ı başlatın">
    SGLang'ı OpenAI uyumlu bir sunucuyla başlatın. Temel URL'niz
    `/v1` uç noktalarını göstermelidir (örneğin `/v1/models`, `/v1/chat/completions`). SGLang
    yaygın olarak şu adreste çalışır:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Bir API anahtarı ayarlayın">
    Sunucunuzda kimlik doğrulama yapılandırılmamışsa herhangi bir değer çalışır:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Onboarding'i çalıştırın veya doğrudan bir model ayarlayın">
    ```bash
    openclaw onboard
    ```

    Veya modeli manuel olarak yapılandırın:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Model keşfi (örtük sağlayıcı)

`SGLANG_API_KEY` ayarlandığında (veya bir auth profile mevcut olduğunda) ve siz
`models.providers.sglang` tanımlamadığınızda, OpenClaw şunu sorgular:

- `GET http://127.0.0.1:30000/v1/models`

ve dönen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.sglang` değerini açıkça ayarlarsanız otomatik keşif atlanır ve
modelleri manuel olarak tanımlamanız gerekir.
</Note>

## Açık yapılandırma (manuel modeller)

Açık yapılandırmayı şu durumlarda kullanın:

- SGLang farklı bir host/port üzerinde çalışıyorsa.
- `contextWindow`/`maxTokens` değerlerini sabitlemek istiyorsanız.
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya header'ları kontrol etmek istiyorsanız).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Proxy tarzı davranış">
    SGLang, yerel bir
    OpenAI uç noktası değil, proxy tarzı OpenAI uyumlu bir `/v1` backend olarak değerlendirilir.

    | Davranış | SGLang |
    |----------|--------|
    | Yalnızca OpenAI istek şekillendirme | Uygulanmaz |
    | `service_tier`, Responses `store`, prompt-cache ipuçları | Gönderilmez |
    | Reasoning uyumluluk payload şekillendirme | Uygulanmaz |
    | Gizli attribution header'ları (`originator`, `version`, `User-Agent`) | Özel SGLang temel URL'lerinde eklenmez |

  </Accordion>

  <Accordion title="Sorun giderme">
    **Sunucuya ulaşılamıyor**

    Sunucunun çalıştığını ve yanıt verdiğini doğrulayın:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Auth hataları**

    İstekler auth hatalarıyla başarısız oluyorsa, sunucu yapılandırmanızla eşleşen gerçek bir `SGLANG_API_KEY` ayarlayın
    veya sağlayıcıyı açıkça
    `models.providers.sglang` altında yapılandırın.

    <Tip>
    SGLang'ı kimlik doğrulama olmadan çalıştırıyorsanız,
    model keşfine katılmak için `SGLANG_API_KEY` için boş olmayan herhangi bir değer
    yeterlidir.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcı girdileri dahil tam yapılandırma şeması.
  </Card>
</CardGroup>
