---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulaması istiyorsunuz
    - Daha katı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da OpenAI'ı API anahtarları veya Codex aboneliği üzerinden kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T09:05:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172beb28b099e3d71998458408c9a6b32b03790d2b016351f724bc3f0d9d3245
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI, GPT modelleri için geliştirici API'leri sunar. OpenClaw iki kimlik doğrulama yolunu destekler:

- **API anahtarı** — kullanım tabanlı faturalandırma ile doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
- **Codex aboneliği** — abonelik erişimiyle ChatGPT/Codex oturum açma (`openai-codex/*` modelleri)

OpenAI, OpenClaw gibi dış araçlar ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı (OpenAI Platform)">
    **En iyi kullanım:** doğrudan API erişimi ve kullanım tabanlı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) üzerinden bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Veya anahtarı doğrudan geçin:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Yol özeti

    | Model ref | Yol | Kimlik doğrulama |
    |-----------|-----|------------------|
    | `openai/gpt-5.4` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex oturum açma, `openai/*` değil `openai-codex/*` üzerinden yönlendirilir.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw, doğrudan API yolunda `openai/gpt-5.3-codex-spark` modelini **sunmaz**. Canlı OpenAI API istekleri bu modeli reddeder. Spark yalnızca Codex içindir.
    </Warning>

  </Tab>

  <Tab title="Codex aboneliği">
    **En iyi kullanım:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi kullanmak. Codex cloud, ChatGPT oturum açmayı gerektirir.

    <Steps>
      <Step title="Codex OAuth çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Veya OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Varsayılan modeli ayarlayın">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Yol özeti

    | Model ref | Yol | Kimlik doğrulama |
    |-----------|-----|------------------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex oturum açma |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex oturum açma (yetki durumuna bağlı) |

    <Note>
    Bu yol kasıtlı olarak `openai/gpt-5.4` yolundan ayrıdır. Doğrudan Platform erişimi için API anahtarıyla `openai/*`, Codex abonelik erişimi için `openai-codex/*` kullanın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Onboarding mevcut bir Codex CLI oturum açmasını yeniden kullanırsa, bu kimlik bilgileri Codex CLI tarafından yönetilmeye devam eder. Süresi dolduğunda OpenClaw önce harici Codex kaynağını yeniden okur ve yenilenen kimlik bilgisini tekrar Codex deposuna yazar.
    </Tip>

    ### Bağlam penceresi sınırı

    OpenClaw, model meta verilerini ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

    `openai-codex/gpt-5.4` için:

    - Yerel `contextWindow`: `1050000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır, pratikte daha iyi gecikme ve kalite özelliklerine sahiptir. Bunu `contextTokens` ile geçersiz kılın:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Yerel model meta verilerini bildirmek için `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

  </Tab>
</Tabs>

## Görsel üretimi

Paketle gelen `openai` plugin'i, `image_generate` aracı üzerinden görsel üretimini kaydeder.

| Yetenek                  | Değer                              |
| ------------------------ | ---------------------------------- |
| Varsayılan model         | `openai/gpt-image-1`               |
| İstek başına en fazla görsel | 4                              |
| Düzenleme modu           | Etkin (en fazla 5 referans görsel) |
| Boyut geçersiz kılmaları | Desteklenir                        |
| En-boy oranı / çözünürlük | OpenAI Images API'ye iletilmez    |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Image Generation](/tr/tools/image-generation) bölümüne bakın.
</Note>

## Video üretimi

Paketle gelen `openai` plugin'i, `video_generate` aracı üzerinden video üretimini kaydeder.

| Yetenek          | Değer                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Varsayılan model | `openai/sora-2`                                                                  |
| Modlar           | Metinden videoya, görselden videoya, tek video düzenleme                         |
| Referans girdileri | 1 görsel veya 1 video                                                          |
| Boyut geçersiz kılmaları | Desteklenir                                                             |
| Diğer geçersiz kılmalar | `aspectRatio`, `resolution`, `audio`, `watermark` bir araç uyarısıyla yok sayılır |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
</Note>

## GPT-5 prompt katkısı

OpenClaw, `openai/*` ve `openai-codex/*` GPT-5 ailesi çalıştırmaları için OpenAI'ya özgü bir GPT-5 prompt katkısı ekler. Bu katkı paketle gelen OpenAI plugin'inde bulunur, `gpt-5`, `gpt-5.2`, `gpt-5.4` ve `gpt-5.4-mini` gibi model kimliklerine uygulanır ve daha eski GPT-4.x modellerine uygulanmaz.

GPT-5 katkısı; persona sürekliliği, yürütme güvenliği, araç disiplini, çıktı biçimi, tamamlama kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem prompt'unda ve giden teslim ilkesinde kalır. GPT-5 yönergeleri eşleşen modeller için her zaman etkindir. Dostça etkileşim stili katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (varsayılan) | Dostça etkileşim stili katmanını etkinleştirir |
| `"on"`                 | `"friendly"` için takma ad                |
| `"off"`                | Yalnızca dostça stil katmanını devre dışı bırakır |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Değerler çalışma anında büyük/küçük harfe duyarsızdır; bu nedenle `"Off"` ve `"off"` değerlerinin ikisi de dostça stil katmanını devre dışı bırakır.
</Tip>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketle gelen `openai` plugin'i, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Config yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarlı değil) |
    | Yönergeler | `messages.tts.providers.openai.instructions` | (ayarlı değil, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | ses notları için `opus`, dosyalar için `mp3` |
    | API anahtarı | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |
    | Temel URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Kullanılabilir modeller: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Kullanılabilir sesler: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Sohbet API uç noktasını etkilemeden TTS temel URL'sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarlayın.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Paketle gelen `openai` plugin'i, Voice Call plugin'i için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Config yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    `wss://api.openai.com/v1/realtime` adresine G.711 u-law ses ile bir WebSocket bağlantısı kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketle gelen `openai` plugin'i, Voice Call plugin'i için gerçek zamanlı sesi kaydeder.

    | Ayar | Config yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    `azureEndpoint` ve `azureDeployment` config anahtarları üzerinden Azure OpenAI'yi destekler. Çift yönlü araç çağırmayı destekler. G.711 u-law ses biçimini kullanır.
    </Note>

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Taşıma (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem `openai-codex/*` için SSE fallback'li WebSocket-önce (`"auto"`) kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce erken bir WebSocket hatasını bir kez yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve bekleme süresi boyunca SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve dönüş kimliği başlıkları ekler
    - Taşıma varyantları arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalize eder

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE fallback |
    | `"sse"` | Yalnızca SSE'yi zorla |
    | `"websocket"` | Yalnızca WebSocket'i zorla |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    İlgili OpenAI belgeleri:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ısındırma">
    OpenClaw, ilk dönüş gecikmesini azaltmak için `openai/*` için WebSocket ısındırmayı varsayılan olarak etkinleştirir.

    ```json5
    // Isındırmayı devre dışı bırak
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Hızlı mod">
    OpenClaw, hem `openai/*` hem `openai-codex/*` için paylaşılan bir hızlı mod anahtarı sunar:

    - **Sohbet/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw hızlı modu OpenAI öncelikli işlemeye (`service_tier = "priority"`) eşler. Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Oturum geçersiz kılmaları config'e üstün gelir. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana geri döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API, `service_tier` üzerinden öncelikli işlemeyi sunar. Bunu OpenClaw'da model başına ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Desteklenen değerler: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier`, yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Herhangi bir sağlayıcıyı proxy üzerinden yönlendirirseniz, OpenClaw `service_tier` değerine dokunmaz.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri (`api.openai.com` üzerindeki `openai/*`) için OpenClaw sunucu tarafı Compaction'ı otomatik olarak etkinleştirir:

    - `store: true` değerini zorlar (`supportsStore: false` olarak model uyumluluğu ayarlanmadıkça)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` ekler
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya kullanılamıyorsa `80000`)

    <Tabs>
      <Tab title="Açıkça etkinleştir">
        Azure OpenAI Responses gibi uyumlu uç noktalar için kullanışlıdır:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Özel eşik">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Devre dışı bırak">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` yalnızca `context_management` eklemeyi kontrol eder. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadıkça yine de `store: true` değerini zorlar.
    </Note>

  </Accordion>

  <Accordion title="Katı ajan odaklı GPT modu">
    `openai/*` ve `openai-codex/*` üzerindeki GPT-5 ailesi çalıştırmaları için OpenClaw daha katı bir gömülü yürütme sözleşmesi kullanabilir:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` ile OpenClaw:
    - Bir araç eylemi kullanılabiliyorsa yalnızca plan içeren dönüşü artık başarılı ilerleme olarak değerlendirmez
    - Dönüşü hemen-eyleme-geç steer ile yeniden dener
    - Kayda değer işler için `update_plan` özelliğini otomatik olarak etkinleştirir
    - Model eyleme geçmeden planlamaya devam ederse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmaları için kapsamlıdır. Diğer sağlayıcılar ve eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu yollar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı şekilde ele alır:

    **Yerel yollar** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` effort desteği olan modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı reasoning'i atlar
    - Araç şemalarını varsayılan olarak strict modda tutar
    - Gizli attribution başlıklarını yalnızca doğrulanmış yerel host'lara ekler
    - OpenAI'ya özgü istek şekillendirmesini korur (`service_tier`, `store`, reasoning uyumluluğu, prompt-cache ipuçları)

    **Proxy/uyumlu yollar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Strict araç şemalarını veya yalnızca yerlilere özgü başlıkları zorlamaz

    Azure OpenAI yerel taşıma ve uyumluluk davranışını kullanır ancak gizli attribution başlıklarını almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Image generation" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth and auth" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
