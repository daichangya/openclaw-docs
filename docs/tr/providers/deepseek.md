---
read_when:
    - OpenClaw ile DeepSeek kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: DeepSeek kurulumu (kimlik doğrulama + model seçimi)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:55:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com), OpenAI uyumlu bir API ile güçlü AI modelleri sunar.

| Özellik | Değer                     |
| -------- | ------------------------- |
| Sağlayıcı | `deepseek`                |
| Kimlik doğrulama | `DEEPSEEK_API_KEY`        |
| API      | OpenAI uyumlu             |
| Temel URL | `https://api.deepseek.com` |

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Bu işlem API anahtarınızı ister ve varsayılan model olarak `deepseek/deepseek-v4-flash` ayarlar.

  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider deepseek
    ```

    Çalışan bir Gateway gerektirmeden paketlenmiş statik kataloğu incelemek için şunu kullanın:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Etkileşimsiz kurulum">
    Betikli veya başsız kurulumlar için tüm bayrakları doğrudan iletin:

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
Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `DEEPSEEK_API_KEY` değerinin o süreç tarafından kullanılabildiğinden emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).
</Warning>

## Yerleşik katalog

| Model başvurusu             | Ad               | Girdi | Bağlam    | Maksimum çıktı | Notlar                                     |
| --------------------------- | ---------------- | ----- | --------- | -------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000        | Varsayılan model; V4 thinking destekli yüzey |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000        | V4 thinking destekli yüzey                 |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192          | DeepSeek V3.2 thinking olmayan yüzey       |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536         | Akıl yürütme etkin V3.2 yüzeyi             |

<Tip>
V4 modelleri DeepSeek'in `thinking` denetimini destekler. OpenClaw ayrıca takip turlarında DeepSeek `reasoning_content` içeriğini yeniden oynatır; böylece araç çağrılı thinking oturumları devam edebilir.
</Tip>

## Thinking ve araçlar

DeepSeek V4 thinking oturumları, çoğu OpenAI uyumlu sağlayıcıdan daha katı bir yeniden oynatma sözleşmesine sahiptir: thinking etkin bir yardımcı mesaj araç çağrıları içerdiğinde DeepSeek, takip isteğinde önceki yardımcı `reasoning_content` içeriğinin geri gönderilmesini bekler. OpenClaw bunu DeepSeek plugin'i içinde ele alır; böylece normal çok turlu araç kullanımı `deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro` ile çalışır.

Mevcut bir oturumu başka bir OpenAI uyumlu sağlayıcıdan DeepSeek V4 modeline geçirirseniz, eski yardımcı araç çağrısı turlarında yerel DeepSeek `reasoning_content` bulunmayabilir. OpenClaw, sağlayıcının `/new` gerektirmeden yeniden oynatılan araç çağrısı geçmişini kabul edebilmesi için eksik alanı DeepSeek V4 thinking isteklerinde doldurur.

OpenClaw'da thinking devre dışı olduğunda (UI'deki **None** seçimi dahil), OpenClaw DeepSeek'e `thinking: { type: "disabled" }` gönderir ve giden geçmişten yeniden oynatılan `reasoning_content` içeriğini kaldırır. Bu, thinking devre dışı oturumları DeepSeek'in thinking olmayan yolunda tutar.

Varsayılan hızlı yol için `deepseek/deepseek-v4-flash` kullanın. Daha güçlü V4 modeli istediğinizde ve daha yüksek maliyet veya gecikmeyi kabul edebildiğinizde `deepseek/deepseek-v4-pro` kullanın.

## Canlı test

Doğrudan canlı model paketi, modern model kümesinde DeepSeek V4'ü içerir. Yalnızca DeepSeek V4 doğrudan model kontrollerini çalıştırmak için:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Bu canlı kontrol, hem V4 modellerinin tamamlanabildiğini hem de thinking/araç takip turlarının DeepSeek'in gerektirdiği yeniden oynatma yükünü koruduğunu doğrular.

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
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Agent'lar, modeller ve sağlayıcılar için tam yapılandırma başvurusu.
  </Card>
</CardGroup>
