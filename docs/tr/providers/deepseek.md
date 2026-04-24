---
read_when:
    - OpenClaw ile DeepSeek kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçimine ihtiyacınız var
summary: DeepSeek kurulumu (kimlik doğrulama + model seçimi)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:21:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com), OpenAI uyumlu bir API ile güçlü yapay zeka modelleri sunar.

| Özellik | Değer                     |
| -------- | ------------------------- |
| Sağlayıcı | `deepseek`                |
| Kimlik Doğrulama | `DEEPSEEK_API_KEY`        |
| API      | OpenAI uyumlu             |
| Temel URL | `https://api.deepseek.com` |

## Başlangıç

<Steps>
  <Step title="API anahtarınızı alın">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Bu işlem API anahtarınızı isteme istemi gösterir ve varsayılan model olarak `deepseek/deepseek-v4-flash` ayarlar.

  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Etkileşimsiz kurulum">
    Betikli veya başsız kurulumlar için tüm bayrakları doğrudan geçin:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `DEEPSEEK_API_KEY`
değişkeninin bu süreç için kullanılabilir olduğundan emin olun (örneğin, `~/.openclaw/.env` içinde veya
`env.shellEnv` aracılığıyla).
</Warning>

## Yerleşik katalog

| Model ref                    | Ad              | Girdi | Bağlam    | Maksimum çıktı | Notlar                                     |
| ---------------------------- | --------------- | ----- | --------- | -------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000        | Varsayılan model; V4 düşünme destekli yüzey |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000        | V4 düşünme destekli yüzey                  |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192          | DeepSeek V3.2 düşünmesiz yüzey             |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536         | Akıl yürütme etkin V3.2 yüzeyi             |

<Tip>
V4 modelleri, DeepSeek'in `thinking` denetimini destekler. OpenClaw ayrıca
takip eden dönüşlerde DeepSeek `reasoning_content` içeriğini yeniden oynatır; böylece araç
çağrılarına sahip düşünme oturumları devam edebilir.
</Tip>

## Yapılandırma örneği

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
