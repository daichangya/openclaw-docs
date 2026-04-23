---
read_when:
    - OpenClaw'ı yerel bir vLLM sunucusuna karşı çalıştırmak istiyorsunuz
    - Kendi modellerinizle OpenAI uyumlu `/v1` uç noktaları istiyorsunuz
summary: OpenClaw'ı vLLM ile çalıştırın (OpenAI uyumlu yerel sunucu)
title: vLLM
x-i18n:
    generated_at: "2026-04-23T09:09:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6c4ceeb59cc10079630e45263485747eadfc66a66267d27579f466d0c0a91a1
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM, **OpenAI uyumlu** HTTP API üzerinden açık kaynaklı (ve bazı özel) modeller sunabilir. OpenClaw, vLLM'ye `openai-completions` API'sini kullanarak bağlanır.

OpenClaw, `VLLM_API_KEY` ile katılım yaptığınızda (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır) ve açık bir `models.providers.vllm` girdisi tanımlamadığınızda, vLLM'deki kullanılabilir modelleri **otomatik keşfedebilir**.

OpenClaw, `vllm` sağlayıcısını akışlı kullanım hesaplamasını destekleyen yerel bir OpenAI uyumlu sağlayıcı olarak değerlendirir; bu nedenle durum/bağlam token sayıları
`stream_options.include_usage` yanıtlarından güncellenebilir.

| Özellik          | Değer                                    |
| ---------------- | ---------------------------------------- |
| Sağlayıcı kimliği | `vllm`                                  |
| API              | `openai-completions` (OpenAI uyumlu)     |
| Auth             | `VLLM_API_KEY` ortam değişkeni           |
| Varsayılan base URL | `http://127.0.0.1:8000/v1`            |

## Başlarken

<Steps>
  <Step title="vLLM'yi OpenAI uyumlu bir sunucuyla başlatın">
    Base URL'niz `/v1` uç noktalarını açığa çıkarmalıdır (ör. `/v1/models`, `/v1/chat/completions`). vLLM yaygın olarak şu adreste çalışır:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API anahtarı ortam değişkenini ayarlayın">
    Sunucunuz auth zorlamıyorsa herhangi bir değer çalışır:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Bir model seçin">
    Bunu vLLM model kimliklerinizden biriyle değiştirin:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Model keşfi (örtük sağlayıcı)

`VLLM_API_KEY` ayarlandığında (veya bir auth profili mevcut olduğunda) ve siz **`models.providers.vllm` tanımlamadığınızda**, OpenClaw şu sorguyu yapar:

```
GET http://127.0.0.1:8000/v1/models
```

ve döndürülen kimlikleri model girdilerine dönüştürür.

<Note>
`models.providers.vllm` değerini açıkça ayarlarsanız, otomatik keşif atlanır ve modelleri elle tanımlamanız gerekir.
</Note>

## Açık yapılandırma (elle modeller)

Şu durumlarda açık yapılandırma kullanın:

- vLLM farklı bir ana makinede veya portta çalışıyorsa
- `contextWindow` veya `maxTokens` değerlerini sabitlemek istiyorsanız
- Sunucunuz gerçek bir API anahtarı gerektiriyorsa (veya üst bilgileri denetlemek istiyorsanız)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Yerel vLLM Modeli",
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

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Proxy tarzı davranış">
    vLLM, yerel bir
    OpenAI uç noktası olarak değil, proxy tarzı OpenAI uyumlu `/v1` arka ucu olarak değerlendirilir. Bunun anlamı şudur:

    | Davranış | Uygulanır mı? |
    |----------|---------------|
    | Yerel OpenAI istek şekillendirme | Hayır |
    | `service_tier` | Gönderilmez |
    | Responses `store` | Gönderilmez |
    | Prompt-cache ipuçları | Gönderilmez |
    | OpenAI reasoning-compat yük şekillendirme | Uygulanmaz |
    | Gizli OpenClaw atıf üst bilgileri | Özel base URL'lerde enjekte edilmez |

  </Accordion>

  <Accordion title="Özel base URL">
    vLLM sunucunuz varsayılan olmayan bir ana makine veya portta çalışıyorsa, açık sağlayıcı yapılandırmasında `baseUrl` ayarlayın:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Uzak vLLM Modeli",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Sunucuya ulaşılamıyor">
    vLLM sunucusunun çalıştığını ve erişilebilir olduğunu kontrol edin:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Bağlantı hatası görüyorsanız ana makineyi, portu ve vLLM'nin OpenAI uyumlu sunucu moduyla başlatıldığını doğrulayın.

  </Accordion>

  <Accordion title="İsteklerde auth hataları">
    İstekler auth hatalarıyla başarısız oluyorsa, sunucu yapılandırmanızla eşleşen gerçek bir `VLLM_API_KEY` ayarlayın veya sağlayıcıyı `models.providers.vllm` altında açıkça yapılandırın.

    <Tip>
    vLLM sunucunuz auth zorlamıyorsa, `VLLM_API_KEY` için boş olmayan herhangi bir değer OpenClaw için katılım sinyali olarak çalışır.
    </Tip>

  </Accordion>

  <Accordion title="Hiç model keşfedilmedi">
    Otomatik keşif için `VLLM_API_KEY` ayarlanmış olmalı **ve** açık bir `models.providers.vllm` yapılandırma girdisi olmamalıdır. Sağlayıcıyı elle tanımladıysanız, OpenClaw keşfi atlar ve yalnızca bildirdiğiniz modelleri kullanır.
  </Accordion>
</AccordionGroup>

<Warning>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="OpenAI" href="/tr/providers/openai" icon="bolt">
    Yerel OpenAI sağlayıcısı ve OpenAI uyumlu rota davranışı.
  </Card>
  <Card title="OAuth ve auth" href="/tr/gateway/authentication" icon="key">
    Auth ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve bunların nasıl çözüleceği.
  </Card>
</CardGroup>
