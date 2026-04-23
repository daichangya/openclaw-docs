---
read_when:
    - OpenClaw ile Volcano Engine veya Doubao modellerini kullanmak istiyorsunuz.
    - Volcengine API anahtarı kurulumuna ihtiyacınız var.
summary: Volcano Engine kurulumu (Doubao modelleri, genel + coding uç noktaları)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T09:09:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Volcengine provider'ı, genel ve coding
iş yükleri için ayrı uç noktalarla Volcano Engine üzerinde barındırılan Doubao modellerine ve üçüncü taraf modellere erişim sağlar.

| Ayrıntı    | Değer                                              |
| ---------- | -------------------------------------------------- |
| Provider'lar | `volcengine` (genel) + `volcengine-plan` (coding) |
| Kimlik doğrulama | `VOLCANO_ENGINE_API_KEY`                     |
| API        | OpenAI uyumlu                                      |

## Başlangıç

<Steps>
  <Step title="API anahtarını ayarlayın">
    Etkileşimli onboarding çalıştırın:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Bu, tek bir API anahtarından hem genel (`volcengine`) hem de coding (`volcengine-plan`) provider'larını kaydeder.

  </Step>
  <Step title="Varsayılan bir model ayarlayın">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Etkileşimsiz kurulum için (CI, betik yazımı), anahtarı doğrudan geçin:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider'lar ve uç noktalar

| Provider          | Uç nokta                                 | Kullanım durumu |
| ----------------- | ---------------------------------------- | --------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Genel modeller  |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Coding modelleri |

<Note>
Her iki provider da tek bir API anahtarından yapılandırılır. Kurulum her ikisini de otomatik olarak kaydeder.
</Note>

## Kullanılabilir modeller

<Tabs>
  <Tab title="Genel (volcengine)">
    | Model ref                                    | Ad                              | Girdi       | Bağlam  |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | metin, görüntü | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | metin, görüntü | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | metin, görüntü | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | metin, görüntü | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | metin, görüntü | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Model ref                                         | Ad                       | Girdi | Bağlam  |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | metin | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | metin | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | metin | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | metin | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | metin | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | metin | 256,000 |
  </Tab>
</Tabs>

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Onboarding sonrası varsayılan model">
    `openclaw onboard --auth-choice volcengine-api-key` şu anda
    genel `volcengine` kataloğunu da kaydederken varsayılan model olarak
    `volcengine-plan/ark-code-latest` ayarlar.
  </Accordion>

  <Accordion title="Model seçici geri dönüş davranışı">
    Onboarding/configure model seçimi sırasında Volcengine auth seçimi
    hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller
    henüz yüklenmemişse OpenClaw boş bir provider kapsamlı seçici göstermek yerine
    filtresiz kataloğa geri döner.
  </Accordion>

  <Accordion title="Daemon süreçleri için ortam değişkenleri">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd),
    `VOLCANO_ENGINE_API_KEY` değerinin o süreç tarafından kullanılabilir olduğundan emin olun (örneğin
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw'u arka plan hizmeti olarak çalıştırırken, etkileşimli shell'inizde ayarladığınız ortam değişkenleri
otomatik olarak devralınmaz. Yukarıdaki daemon notuna bakın.
</Warning>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Provider'ları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Agent'lar, modeller ve provider'lar için tam yapılandırma başvurusu.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
  <Card title="SSS" href="/tr/help/faq" icon="circle-question">
    OpenClaw kurulumu hakkında sık sorulan sorular.
  </Card>
</CardGroup>
