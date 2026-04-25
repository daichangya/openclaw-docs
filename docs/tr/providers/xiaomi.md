---
read_when:
    - OpenClaw içinde Xiaomi MiMo modellerini istiyorsunuz
    - '`XIAOMI_API_KEY` ayarını yapmanız gerekir'
summary: Xiaomi MiMo modellerini OpenClaw ile kullanın
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T13:56:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo, **MiMo** modelleri için API platformudur. OpenClaw, API anahtarı kimlik doğrulamasıyla Xiaomi'nin
OpenAI uyumlu uç noktasını kullanır.

| Özellik  | Değer                          |
| -------- | ------------------------------ |
| Sağlayıcı | `xiaomi`                       |
| Kimlik doğrulama | `XIAOMI_API_KEY`       |
| API      | OpenAI uyumlu                 |
| Temel URL | `https://api.xiaomimimo.com/v1` |

## Başlarken

<Steps>
  <Step title="Bir API anahtarı alın">
    [Xiaomi MiMo konsolunda](https://platform.xiaomimimo.com/#/console/api-keys) bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Veya anahtarı doğrudan geçin:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Modelin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Yerleşik katalog

| Model ref              | Girdi       | Bağlam    | Maks çıktı | Reasoning | Notlar        |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192      | Hayır     | Varsayılan model |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000     | Evet      | Geniş bağlam  |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000     | Evet      | Çok modlu     |

<Tip>
Varsayılan model ref'i `xiaomi/mimo-v2-flash` değeridir. `XIAOMI_API_KEY` ayarlandığında veya bir kimlik doğrulama profili mevcut olduğunda sağlayıcı otomatik olarak eklenir.
</Tip>

## Metinden konuşmaya

Paketle birlikte gelen `xiaomi` Plugin'i ayrıca Xiaomi MiMo'yu
`messages.tts` için bir konuşma sağlayıcısı olarak kaydeder. Metni
bir `assistant` mesajı ve isteğe bağlı stil yönlendirmesini bir `user` mesajı olarak
kullanarak Xiaomi'nin chat-completions TTS sözleşmesini çağırır.

| Özellik  | Değer                                   |
| -------- | --------------------------------------- |
| TTS kimliği | `xiaomi` (`mimo` takma adı)           |
| Kimlik doğrulama | `XIAOMI_API_KEY`                |
| API      | `audio` ile `POST /v1/chat/completions` |
| Varsayılan | `mimo-v2.5-tts`, ses `mimo_default`   |
| Çıktı    | Varsayılan olarak MP3; yapılandırıldığında WAV |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Desteklenen yerleşik sesler arasında `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` ve `Dean` bulunur. `mimo-v2-tts`, daha eski MiMo
TTS hesapları için desteklenir; varsayılan olarak güncel MiMo-V2.5 TTS modeli kullanılır. Sesli not
hedefleri, örneğin Feishu ve Telegram için OpenClaw, teslimattan önce Xiaomi çıktısını `ffmpeg` ile 48kHz
Opus biçimine dönüştürür.

## Yapılandırma örneği

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Otomatik ekleme davranışı">
    `xiaomi` sağlayıcısı, ortamınızda `XIAOMI_API_KEY` ayarlandığında veya bir kimlik doğrulama profili mevcut olduğunda otomatik olarak eklenir. Model meta verilerini veya temel URL'yi geçersiz kılmak istemediğiniz sürece sağlayıcıyı manuel olarak yapılandırmanız gerekmez.
  </Accordion>

  <Accordion title="Model ayrıntıları">
    - **mimo-v2-flash** — hafif ve hızlıdır, genel amaçlı metin görevleri için idealdir. Reasoning desteği yoktur.
    - **mimo-v2-pro** — uzun belge iş yükleri için 1M token bağlam penceresiyle Reasoning destekler.
    - **mimo-v2-omni** — hem metin hem de görsel girdilerini kabul eden, Reasoning özellikli çok modlu modeldir.

    <Note>
    Tüm modeller `xiaomi/` önekini kullanır (örneğin `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Sorun giderme">
    - Modeller görünmüyorsa `XIAOMI_API_KEY` değerinin ayarlandığını ve geçerli olduğunu doğrulayın.
    - Gateway bir daemon olarak çalışıyorsa anahtarın bu süreç için erişilebilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).

    <Warning>
    Yalnızca etkileşimli kabuğunuzda ayarlanan anahtarlar, daemon tarafından yönetilen Gateway süreçleri tarafından görülemez. Kalıcı erişilebilirlik için `~/.openclaw/.env` veya `env.shellEnv` yapılandırmasını kullanın.
    </Warning>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    OpenClaw için tam yapılandırma başvurusu.
  </Card>
  <Card title="Xiaomi MiMo konsolu" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo panosu ve API anahtarı yönetimi.
  </Card>
</CardGroup>
