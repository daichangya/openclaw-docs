---
read_when:
    - Moonshot K2 (Moonshot Open Platform) ile Kimi Coding kurulumunu istiyorsunuz
    - Ayrı uç noktaları, anahtarları ve model başvurularını anlamanız gerekiyor
    - Her iki sağlayıcı için de kopyala/yapıştır yapılandırma istiyorsunuz
summary: Moonshot K2 ve Kimi Coding yapılandırması (ayrı sağlayıcılar + anahtarlar)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T09:09:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e143632de7aff050f32917e379e21ace5f4a5f9857618ef720f885f2f298ca72
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot, OpenAI uyumlu uç noktalarla Kimi API'yi sağlar. Sağlayıcıyı yapılandırın
ve varsayılan modeli `moonshot/kimi-k2.6` olarak ayarlayın veya
Kimi Coding'i `kimi/kimi-code` ile kullanın.

<Warning>
Moonshot ve Kimi Coding **ayrı sağlayıcılardır**. Anahtarlar birbirinin yerine kullanılamaz, uç noktalar farklıdır ve model başvuruları farklıdır (`moonshot/...` ile `kimi/...`).
</Warning>

## Yerleşik model kataloğu

[//]: # "moonshot-kimi-k2-ids:start"

| Model başvurusu                  | Ad                     | Akıl yürütme | Girdi       | Bağlam  | Maks çıktı |
| -------------------------------- | ---------------------- | ------------ | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`             | Kimi K2.6              | Hayır        | metin, görsel | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`             | Kimi K2.5              | Hayır        | metin, görsel | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`      | Kimi K2 Thinking       | Evet         | metin       | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo`| Kimi K2 Thinking Turbo | Evet         | metin       | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`         | Kimi K2 Turbo          | Hayır        | metin       | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Mevcut Moonshot tarafından barındırılan K2 modelleri için bundled maliyet tahminleri, Moonshot'ın
yayınlanmış kullandıkça öde oranlarını kullanır: Kimi K2.6 için $0.16/MTok önbellek isabeti,
$0.95/MTok girdi ve $4.00/MTok çıktı; Kimi K2.5 için $0.10/MTok önbellek isabeti,
$0.60/MTok girdi ve $3.00/MTok çıktı. Diğer eski katalog girdileri,
bunları yapılandırmada geçersiz kılmadığınız sürece sıfır maliyet yer tutucularını korur.

## Başlarken

Sağlayıcınızı seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Moonshot API">
    **Şunlar için en uygunu:** Moonshot Open Platform üzerinden Kimi K2 modelleri.

    <Steps>
      <Step title="Uç nokta bölgenizi seçin">
        | Kimlik doğrulama seçimi | Uç nokta                     | Bölge         |
        | ----------------------- | ---------------------------- | ------------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1` | Uluslararası  |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1` | Çin           |
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
      <Step title="Canlı smoke test çalıştırın">
        Model erişimini ve maliyet
        takibini normal oturumlarınıza dokunmadan doğrulamak istediğinizde yalıtılmış bir durum dizini kullanın:

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
        `model: "kimi-k2.6"` bildirmelidir. Assistant transkript girdisi, Moonshot kullanım üst verisi döndürdüğünde
        `usage.cost` altında normalize edilmiş
        token kullanımını ve tahmini maliyeti depolar.
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
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
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
    **Şunlar için en uygunu:** Kimi Coding uç noktası üzerinden kod odaklı görevler.

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

## Kimi web araması

OpenClaw ayrıca Moonshot web
araması tarafından desteklenen bir `web_search` sağlayıcısı olarak **Kimi** ile birlikte gelir.

<Steps>
  <Step title="Etkileşimli web arama kurulumunu çalıştırın">
    ```bash
    openclaw configure --section web
    ```

    `plugins.entries.moonshot.config.webSearch.*`
    değerlerini depolamak için web-search bölümünde **Kimi**'yi seçin.

  </Step>
  <Step title="Web arama bölgesini ve modelini yapılandırın">
    Etkileşimli kurulum şunları sorar:

    | Ayar                | Seçenekler                                                            |
    | ------------------- | --------------------------------------------------------------------- |
    | API bölgesi         | `https://api.moonshot.ai/v1` (uluslararası) veya `https://api.moonshot.cn/v1` (Çin) |
    | Web arama modeli    | Varsayılan olarak `kimi-k2.6`                                        |

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

## Gelişmiş

<AccordionGroup>
  <Accordion title="Yerel thinking kipi">
    Moonshot Kimi, ikili yerel thinking desteği sunar:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Bunu model başına `agents.defaults.models.<provider/model>.params` ile yapılandırın:

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

    OpenClaw ayrıca çalışma zamanı `/think` düzeylerini Moonshot için eşler:

    | `/think` düzeyi     | Moonshot davranışı         |
    | ------------------- | -------------------------- |
    | `/think off`        | `thinking.type=disabled`   |
    | Off olmayan herhangi bir düzey | `thinking.type=enabled`    |

    <Warning>
    Moonshot thinking etkin olduğunda `tool_choice`, `auto` veya `none` olmalıdır. OpenClaw, uyumluluk için uyumsuz `tool_choice` değerlerini `auto` olarak normalleştirir.
    </Warning>

    Kimi K2.6 ayrıca `reasoning_content` değerinin
    çok dönüşlü tutulmasını denetleyen isteğe bağlı bir `thinking.keep` alanını kabul eder. Dönüşler boyunca tam
    akıl yürütmeyi korumak için `"all"` olarak ayarlayın; sunucu
    varsayılan stratejisini kullanmak için bunu vermeyin (veya `null` bırakın). OpenClaw yalnızca
    `moonshot/kimi-k2.6` için `thinking.keep` iletir ve diğer modellerden
    bunu kaldırır.

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

  <Accordion title="Tool call id temizleme">
    Moonshot Kimi, `functions.<name>:<index>` biçiminde tool_call kimlikleri sunar. OpenClaw, çok dönüşlü tool call'ların çalışmaya devam etmesi için bunları değiştirmeden korur.

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

  <Accordion title="Akışlı kullanım uyumluluğu">
    Yerel Moonshot uç noktaları (`https://api.moonshot.ai/v1` ve
    `https://api.moonshot.cn/v1`), paylaşılan `openai-completions` taşımasında
    akışlı kullanım uyumluluğunu bildirir. OpenClaw bunu uç nokta
    yeteneklerine göre belirler; bu nedenle aynı yerel
    Moonshot sunucularını hedefleyen uyumlu özel sağlayıcı kimlikleri de aynı akışlı kullanım davranışını devralır.

    Bundled K2.6 fiyatlandırmasıyla, girdi, çıktı
    ve önbellek okuma token'larını içeren akışlı kullanım ayrıca `/status`, `/usage full`, `/usage cost` ve transkript destekli oturum
    muhasebesi için yerel tahmini USD maliyetine dönüştürülür.

  </Accordion>

  <Accordion title="Uç nokta ve model başvurusu başvurusu">
    | Sağlayıcı    | Model başvurusu öneki | Uç nokta                     | Kimlik doğrulama env değişkeni |
    | ------------ | --------------------- | ---------------------------- | ------------------------------ |
    | Moonshot     | `moonshot/`           | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`             |
    | Moonshot CN  | `moonshot/`           | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`             |
    | Kimi Coding  | `kimi/`               | Kimi Coding uç noktası       | `KIMI_API_KEY`                 |
    | Web araması  | N/A                   | Moonshot API bölgesi ile aynı | `KIMI_API_KEY` veya `MOONSHOT_API_KEY` |

    - Kimi web araması `KIMI_API_KEY` veya `MOONSHOT_API_KEY` kullanır ve varsayılan olarak `https://api.moonshot.ai/v1` ile `kimi-k2.6` modelini kullanır.
    - Gerekirse fiyatlandırma ve bağlam üst verisini `models.providers` içinde geçersiz kılın.
    - Moonshot bir model için farklı bağlam sınırları yayınlarsa `contextWindow` değerini buna göre ayarlayın.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Web araması" href="/tr/tools/web" icon="magnifying-glass">
    Kimi dahil web arama sağlayıcılarını yapılandırma.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Sağlayıcılar, modeller ve Plugin'ler için tam yapılandırma şeması.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API anahtarı yönetimi ve belgeleri.
  </Card>
</CardGroup>
