---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulamasını istiyorsunuz
    - Daha katı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da OpenAI'yi API anahtarları veya Codex aboneliği üzerinden kullanma
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T09:09:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d847e53c2faee5363071dfdcb1f4150b64577674161e000844f579482198d1
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI, GPT modelleri için geliştirici API'leri sağlar. OpenClaw iki kimlik doğrulama yolunu destekler:

  - **API anahtarı** — kullanım bazlı faturalandırma ile doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
  - **Codex aboneliği** — abonelik erişimi ile ChatGPT/Codex oturumu açma (`openai-codex/*` modelleri)

  OpenAI, OpenClaw gibi harici araçlar ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

  ## OpenClaw özellik kapsamı

  | OpenAI yeteneği          | OpenClaw yüzeyi                          | Durum                                                    |
  | ------------------------ | ---------------------------------------- | -------------------------------------------------------- |
  | Sohbet / Responses       | `openai/<model>` model sağlayıcısı       | Evet                                                     |
  | Codex abonelik modelleri | `openai-codex/<model>` model sağlayıcısı | Evet                                                     |
  | Sunucu taraflı web arama | Yerel OpenAI Responses aracı             | Evet, web arama etkin olduğunda ve sağlayıcı sabitlenmediğinde |
  | Görseller                | `image_generate`                         | Evet                                                     |
  | Videolar                 | `video_generate`                         | Evet                                                     |
  | Metinden konuşmaya       | `messages.tts.provider: "openai"` / `tts` | Evet                                                    |
  | Toplu konuşmadan metne   | `tools.media.audio` / medya anlama       | Evet                                                     |
  | Akış konuşmadan metne    | Voice Call `streaming.provider: "openai"` | Evet                                                    |
  | Gerçek zamanlı ses       | Voice Call `realtime.provider: "openai"` | Evet                                                     |
  | Embeddings               | bellek embedding sağlayıcısı             | Evet                                                     |

  ## Başlarken

  Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

  <Tabs>
  <Tab title="API anahtarı (OpenAI Platform)">
    **En uygun:** doğrudan API erişimi ve kullanım bazlı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform panosundan](https://platform.openai.com/api-keys) bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
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

    ### Rota özeti

    | Model başvurusu | Rota | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex oturum açma işlemi `openai/*` değil, `openai-codex/*` üzerinden yönlendirilir.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw, doğrudan API yolunda `openai/gpt-5.3-codex-spark` sunmaz. Canlı OpenAI API istekleri bu modeli reddeder. Spark yalnızca Codex içindir.
    </Warning>

  </Tab>

  <Tab title="Codex aboneliği">
    **En uygun:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi kullanmak. Codex bulutu ChatGPT oturumu açmayı gerektirir.

    <Steps>
      <Step title="Codex OAuth'u çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Veya OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Başsız veya callback'e elverişsiz kurulumlar için, localhost tarayıcı callback'i yerine ChatGPT cihaz kodu akışıyla oturum açmak üzere `--device-code` ekleyin:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
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

    ### Rota özeti

    | Model başvurusu | Rota | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex oturumu açma |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex oturumu açma (hak kazanımına bağlı) |

    <Note>
    Bu rota kasıtlı olarak `openai/gpt-5.4` yolundan ayrıdır. Doğrudan Platform erişimi için API anahtarıyla `openai/*`, Codex abonelik erişimi için `openai-codex/*` kullanın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    İlk kurulum artık OAuth materyalini `~/.codex` içinden içe aktarmıyor. Tarayıcı OAuth'u (varsayılan) veya yukarıdaki cihaz kodu akışı ile oturum açın — OpenClaw oluşan kimlik bilgilerini kendi ajan auth deposunda yönetir.
    </Note>

    ### Bağlam penceresi sınırı

    OpenClaw model meta verisini ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

    `openai-codex/gpt-5.4` için:

    - Yerel `contextWindow`: `1050000`
    - Varsayılan çalışma zamanı `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır pratikte daha iyi gecikme ve kalite özelliklerine sahiptir. Bunu `contextTokens` ile geçersiz kılın:

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
    Yerel model meta verisini bildirmek için `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

  </Tab>
</Tabs>

## Görsel üretimi

Paketli `openai` Plugin'i, görsel üretimini `image_generate` aracı üzerinden kaydeder.

| Yetenek                  | Değer                               |
| ------------------------ | ----------------------------------- |
| Varsayılan model         | `openai/gpt-image-2`                |
| İstek başına azami görsel | 4                                   |
| Düzenleme modu           | Etkin (en fazla 5 başvuru görseli)  |
| Boyut geçersiz kılmaları | Desteklenir, 2K/4K boyutlar dahil   |
| En boy oranı / çözünürlük | OpenAI Images API'ye iletilmez     |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Görsel Üretimi](/tr/tools/image-generation).
</Note>

`gpt-image-2`, hem OpenAI metinden görsel üretimi hem de görsel düzenleme için varsayılandır. `gpt-image-1` açık model geçersiz kılması olarak kullanılabilir olmaya devam eder, ancak yeni OpenAI görsel iş akışları `openai/gpt-image-2` kullanmalıdır.

Üret:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Video üretimi

Paketli `openai` Plugin'i, video üretimini `video_generate` aracı üzerinden kaydeder.

| Yetenek          | Değer                                                                               |
| ---------------- | ----------------------------------------------------------------------------------- |
| Varsayılan model | `openai/sora-2`                                                                     |
| Modlar           | Metinden videoya, görselden videoya, tek video düzenleme                           |
| Başvuru girdileri | 1 görsel veya 1 video                                                              |
| Boyut geçersiz kılmaları | Desteklenir                                                                 |
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Video Üretimi](/tr/tools/video-generation).
</Note>

## GPT-5 istem katkısı

OpenClaw, sağlayıcılar arasında GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 istem katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` ve diğer uyumlu GPT-5 başvuruları aynı katmanı alır. Daha eski GPT-4.x modelleri almaz.

Paketli yerel Codex harness sağlayıcısı (`codex/*`), Codex uygulama sunucusu geliştirici yönergeleri üzerinden aynı GPT-5 davranışını ve Heartbeat katmanını kullanır; böylece `codex/gpt-5.x` oturumları, istemin geri kalanına Codex sahip olsa bile aynı takip etme ve proaktif Heartbeat rehberliğini korur.

GPT-5 katkısı; persona sürekliliği, yürütme güvenliği, araç disiplini, çıktı biçimi, tamamlama denetimleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı paylaşılan OpenClaw sistem isteminde ve giden teslimat ilkesinde kalır. GPT-5 rehberliği eşleşen modeller için her zaman etkindir. Dostça etkileşim tarzı katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                        |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (varsayılan) | Dostça etkileşim tarzı katmanını etkinleştir |
| `"on"`                 | `"friendly"` için takma ad                  |
| `"off"`                | Yalnızca dostça tarz katmanını devre dışı bırak |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Değerler çalışma zamanında büyük/küçük harf duyarsızdır; bu nedenle `"Off"` ve `"off"` her ikisi de dostça tarz katmanını devre dışı bırakır.
</Tip>

<Note>
Eski `plugins.entries.openai.config.personality`, paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı yapılmadığında uyumluluk geri dönüşü olarak hâlâ okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketli `openai` Plugin'i, konuşma sentezini `messages.tts` yüzeyi için kaydeder.

    | Ayar | Config yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarsız) |
    | Yönergeler | `messages.tts.providers.openai.instructions` | (ayarsız, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | sesli notlar için `opus`, dosyalar için `mp3` |
    | API anahtarı | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Sohbet API uç noktasını etkilemeden TTS base URL'sini geçersiz kılmak için `OPENAI_TTS_BASE_URL` ayarlayın.
    </Note>

  </Accordion>

  <Accordion title="Konuşmadan metne">
    Paketli `openai` Plugin'i, toplu konuşmadan metne desteğini
    OpenClaw'un medya anlama transkripsiyon yüzeyi üzerinden kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Girdi yolu: multipart ses dosyası yükleme
    - OpenClaw'da gelen ses transkripsiyonunun
      `tools.media.audio` kullandığı her yerde desteklenir; buna Discord ses kanalı segmentleri ve kanal
      ses ekleri dahildir

    Gelen ses transkripsiyonu için OpenAI'yi zorlamak üzere:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Dil ve istem ipuçları, paylaşılan ses medya config'i veya çağrı başına transkripsiyon isteği tarafından sağlandığında OpenAI'ye iletilir.

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Paketli `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı transkripsiyon kaydeder.

    | Ayar | Config yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarsız) |
    | İstem | `...openai.prompt` | (ayarsız) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    `wss://api.openai.com/v1/realtime` adresine G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile bir WebSocket bağlantısı kullanır. Bu akış sağlayıcısı Voice Call'un gerçek zamanlı transkripsiyon yolu içindir; Discord ses şu anda kısa segmentler kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketli `openai` Plugin'i, Voice Call Plugin'i için gerçek zamanlı ses kaydeder.

    | Ayar | Config yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    `azureEndpoint` ve `azureDeployment` config anahtarları üzerinden Azure OpenAI'yi destekler. Çift yönlü araç çağrısını destekler. G.711 u-law ses biçimini kullanır.
    </Note>

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Taşıma (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için WebSocket öncelikli ve SSE geri dönüşlü (`"auto"`) kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce erken bir WebSocket hatasını bir kez yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve soğuma süresince SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve dönüş kimliği başlıkları ekler
    - Taşıma varyantları arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalize eder

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE geri dönüşü |
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
    - [WebSocket ile Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Akış API yanıtları (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket hazırlığı">
    OpenClaw, ilk dönüş gecikmesini azaltmak için `openai/*` için WebSocket hazırlığını varsayılan olarak etkinleştirir.

    ```json5
    // Hazırlığı devre dışı bırak
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

<a id="openai-fast-mode"></a>

  <Accordion title="Hızlı mod">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için paylaşılan bir hızlı mod anahtarı sunar:

    - **Sohbet/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işlemeye eşler (`service_tier = "priority"`). Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz.

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
    Oturum geçersiz kılmaları config'i geçer. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana geri döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI API'si, `service_tier` üzerinden öncelikli işlemeyi açığa çıkarır. Bunu OpenClaw'da model başına ayarlayın:

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
    `serviceTier`, yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Sağlayıcılardan herhangi birini bir proxy üzerinden yönlendirirseniz OpenClaw `service_tier` değerine dokunmaz.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu taraflı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerindeki `openai/*`), OpenClaw sunucu taraflı Compaction'ı otomatik etkinleştirir:

    - `store: true` zorlar (`supportsStore: false` ayarlayan model uyumluluğu yoksa)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` ekler
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya mevcut değilse `80000`)

    <Tabs>
      <Tab title="Açıkça etkinleştir">
        Azure OpenAI Responses gibi uyumlu uç noktalar için yararlıdır:

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
    `responsesServerCompaction`, yalnızca `context_management` eklemesini denetler. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadığı sürece yine de `store: true` zorlar.
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
    - Bir araç eylemi mevcut olduğunda artık yalnızca plan içeren bir dönüşü başarılı ilerleme olarak değerlendirmez
    - Dönüşü şimdi-harekete-geç yönlendirmesiyle yeniden dener
    - Önemli işler için `update_plan` özelliğini otomatik etkinleştirir
    - Model hareket etmeden planlamaya devam ederse açık bir engelli durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmaları için kapsamlandırılmıştır. Diğer sağlayıcılar ve daha eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu rotalar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı ele alır:

    **Yerel rotalar** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` effort'u destekleyen modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı reasoning'i çıkarır
    - Araç şemalarını varsayılan olarak katı moda alır
    - Gizli ilişkilendirme başlıklarını yalnızca doğrulanmış yerel ana makinelere ekler
    - OpenAI'ye özgü istek biçimlendirmesini korur (`service_tier`, `store`, reasoning-compat, prompt-cache ipuçları)

    **Proxy/uyumlu rotalar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Katı araç şemalarını veya yalnızca yerel başlıkları zorlamaz

    Azure OpenAI yerel taşıma ve uyumluluk davranışını kullanır ancak gizli ilişkilendirme başlıklarını almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
