---
read_when:
    - Moonshot K2 (Moonshot Open Platform) ile Kimi Coding kurulumunu istiyorsunuz
    - Ayrı uç noktaları, anahtarları ve model başvurularını anlamanız gerekiyor
    - Her iki sağlayıcı için de kopyala/yapıştır yapılandırma istiyorsunuz
summary: Moonshot K2 ile Kimi Coding'i yapılandırın (ayrı sağlayıcılar + anahtarlar)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-25T13:56:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 15
---

Moonshot, OpenAI uyumlu uç noktalarla Kimi API'sini sağlar. Sağlayıcıyı
yapılandırın ve varsayılan modeli `moonshot/kimi-k2.6` olarak ayarlayın veya
`kimi/kimi-code` ile Kimi Coding kullanın.

<Warning>
Moonshot ve Kimi Coding **ayrı sağlayıcılardır**. Anahtarlar birbiri yerine kullanılamaz, uç noktalar farklıdır ve model başvuruları farklıdır (`moonshot/...` ile `kimi/...`).
</Warning>

## Yerleşik model kataloğu

[//]: # "moonshot-kimi-k2-ids:start"

| Model başvurusu                  | Ad                     | Muhakeme | Girdi       | Bağlam  | Maks. çıktı |
| -------------------------------- | ---------------------- | -------- | ----------- | ------- | ----------- |
| `moonshot/kimi-k2.6`             | Kimi K2.6              | Hayır    | text, image | 262,144 | 262,144     |
| `moonshot/kimi-k2.5`             | Kimi K2.5              | Hayır    | text, image | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking`      | Kimi K2 Thinking       | Evet     | text        | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking-turbo`| Kimi K2 Thinking Turbo | Evet     | text        | 262,144 | 262,144     |
| `moonshot/kimi-k2-turbo`         | Kimi K2 Turbo          | Hayır    | text        | 256,000 | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Güncel Moonshot barındırmalı K2 modelleri için paketlenmiş maliyet tahminleri,
Moonshot'un yayımlanmış kullandıkça öde ücretlerini kullanır: Kimi K2.6 için
önbellek isabeti $0.16/MTok, girdi $0.95/MTok ve çıktı $4.00/MTok; Kimi K2.5
için önbellek isabeti $0.10/MTok, girdi $0.60/MTok ve çıktı $3.00/MTok'tur.
Diğer eski katalog girdileri, bunları yapılandırmada geçersiz kılmadığınız
sürece sıfır maliyet yer tutucularını korur.

## Başlangıç

Sağlayıcınızı seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Moonshot API">
    **Şunun için en iyisi:** Moonshot Open Platform üzerinden Kimi K2 modelleri.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçeneği | Uç nokta                     | Bölge         |
        | ------------------------- | ---------------------------- | ------------- |
        | `moonshot-api-key`        | `https://api.moonshot.ai/v1` | Uluslararası  |
        | `moonshot-api-key-cn`     | `https://api.moonshot.cn/v1` | Çin           |
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Veya Çin uç noktası için:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Canlı bir smoke test çalıştırın">
        Normal oturumlarınıza dokunmadan model erişimini ve maliyet
        takibini doğrulamak istediğinizde yalıtılmış bir durum dizini kullanın:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON yanıtı `provider: "moonshot"` ve
        `model: "kimi-k2.6"` bildirmelidir. Asistan transkript girdisi,
        Moonshot kullanım üst verilerini döndürdüğünde `usage.cost` altında
        normalleştirilmiş token kullanımını ve tahmini maliyeti saklar.
      </Step>
    </Steps>

    ### Yapılandırma örneği

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            api: "openai-completions",
            apiKey: "${MOONSHOT_API_KEY}",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Şunun için en iyisi:** Kimi Coding uç noktası üzerinden kod odaklı görevler.

    <Note>
    Kimi Coding, Moonshot'tan (`moonshot/...`) farklı bir API anahtarı ve sağlayıcı öneki (`kimi/...`) kullanır. Eski model başvurusu `kimi/k2p5`, uyumluluk kimliği olarak kabul edilmeye devam eder.
    </Note>

    <Steps>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Yapılandırma örneği

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web arama

OpenClaw ayrıca, Moonshot web arama tarafından desteklenen bir `web_search`
sağlayıcısı olarak **Kimi** ile gelir.

<Steps>
  <Step title="Etkileşimli web arama kurulumunu çalıştırın">
    ```bash
    openclaw configure --section web
    ```

    Web arama bölümünde **Kimi** seçeneğini seçerek
    `plugins.entries.moonshot.config.webSearch.*` değerlerini depolayın.

  </Step>
  <Step title="Web arama bölgesini ve modeli yapılandırın">
    Etkileşimli kurulum şunları sorar:

    | Ayar              | Seçenekler                                                           |
    | ----------------- | -------------------------------------------------------------------- |
    | API bölgesi       | `https://api.moonshot.ai/v1` (uluslararası) veya `https://api.moonshot.cn/v1` (Çin) |
    | Web arama modeli  | Varsayılan olarak `kimi-k2.6`                                        |

  </Step>
</Steps>

Yapılandırma `plugins.entries.moonshot.config.webSearch` altında bulunur:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // veya KIMI_API_KEY / MOONSHOT_API_KEY kullanın
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

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yerel düşünme modu">
    Moonshot Kimi, ikili yerel düşünmeyi destekler:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Bunu model başına `agents.defaults.models.<provider/model>.params` üzerinden yapılandırın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw, Moonshot için çalışma zamanı `/think` düzeylerini de eşler:

    | `/think` düzeyi    | Moonshot davranışı        |
    | ------------------ | ------------------------- |
    | `/think off`       | `thinking.type=disabled`  |
    | Kapalı olmayan her düzey | `thinking.type=enabled` |

    <Warning>
    Moonshot düşünmesi etkin olduğunda, `tool_choice` değeri `auto` veya `none` olmalıdır. OpenClaw, uyumluluk için uyumsuz `tool_choice` değerlerini `auto` olarak normalleştirir.
    </Warning>

    Kimi K2.6 ayrıca `reasoning_content` içeriğinin çok turlu korunmasını
    denetleyen isteğe bağlı bir `thinking.keep` alanını kabul eder. Turlar
    arasında tam muhakemeyi korumak için bunu `"all"` olarak ayarlayın; sunucu
    varsayılan stratejisini kullanmak için bunu atlayın (veya `null` bırakın).
    OpenClaw, `thinking.keep` alanını yalnızca `moonshot/kimi-k2.6` için iletir
    ve diğer modellerden kaldırır.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tool call kimliği temizleme">
    Moonshot Kimi, `functions.<name>:<index>` biçimindeki `tool_call` kimliklerini sunar. OpenClaw, çok turlu tool call işlemlerinin çalışmaya devam etmesi için bunları değiştirmeden korur.

    Özel bir OpenAI uyumlu sağlayıcıda katı temizlemeyi zorlamak için `sanitizeToolCallIds: true` ayarlayın:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Akış kullanım uyumluluğu">
    Yerel Moonshot uç noktaları (`https://api.moonshot.ai/v1` ve
    `https://api.moonshot.cn/v1`), paylaşılan `openai-completions` taşıması
    üzerinde akış kullanım uyumluluğunu bildirir. OpenClaw bunu uç nokta
    yeteneklerine göre belirler; bu nedenle aynı yerel Moonshot ana bilgisayarlarını
    hedefleyen uyumlu özel sağlayıcı kimlikleri de aynı akış-kullanım
    davranışını devralır.

    Paketlenmiş K2.6 fiyatlandırmasıyla, girdi, çıktı ve önbellek-okuma
    token'larını içeren akış kullanımı; `/status`, `/usage full`, `/usage cost`
    ve transkript destekli oturum muhasebesi için yerel tahmini USD maliyetine
    de dönüştürülür.

  </Accordion>

  <Accordion title="Uç nokta ve model başvurusu başvurusu">
    | Sağlayıcı   | Model başvurusu öneki | Uç nokta                     | Kimlik doğrulama ortam değişkeni |
    | ----------- | --------------------- | ---------------------------- | -------------------------------- |
    | Moonshot    | `moonshot/`           | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`               |
    | Moonshot CN | `moonshot/`           | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`               |
    | Kimi Coding | `kimi/`               | Kimi Coding uç noktası       | `KIMI_API_KEY`                   |
    | Web arama   | N/A                   | Moonshot API bölgesiyle aynı | `KIMI_API_KEY` veya `MOONSHOT_API_KEY` |

    - Kimi web arama, `KIMI_API_KEY` veya `MOONSHOT_API_KEY` kullanır ve varsayılan olarak `https://api.moonshot.ai/v1` ile `kimi-k2.6` modelini kullanır.
    - Gerekirse fiyatlandırma ve bağlam üst verilerini `models.providers` içinde geçersiz kılın.
    - Moonshot bir model için farklı bağlam sınırları yayımlarsa, `contextWindow` değerini buna göre ayarlayın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Web arama" href="/tr/tools/web" icon="magnifying-glass">
    Kimi dahil web arama sağlayıcılarını yapılandırma.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve Plugin'ler için tam yapılandırma şeması.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API anahtarı yönetimi ve belgeler.
  </Card>
</CardGroup>
