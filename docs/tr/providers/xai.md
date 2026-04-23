---
read_when:
    - OpenClaw'da Grok modellerini kullanmak istiyorsunuz
    - xAI kimlik doğrulamasını veya model kimliklerini yapılandırıyorsunuz
summary: OpenClaw'da xAI Grok modellerini kullanın
title: xAI
x-i18n:
    generated_at: "2026-04-23T09:10:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw, Grok modelleri için paketle birlikte gelen `xai` sağlayıcı plugin'i sunar.

## Başlarken

<Steps>
  <Step title="Bir API anahtarı oluşturun">
    [xAI konsolunda](https://console.x.ai/) bir API anahtarı oluşturun.
  </Step>
  <Step title="API anahtarınızı ayarlayın">
    `XAI_API_KEY` ayarlayın veya şunu çalıştırın:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Bir model seçin">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw, paketle birlikte gelen xAI aktarımı olarak xAI Responses API'sini kullanır. Aynı
`XAI_API_KEY`, Grok destekli `web_search`, birinci sınıf `x_search`
ve uzak `code_execution` için de kullanılabilir.
Bir xAI anahtarını `plugins.entries.xai.config.webSearch.apiKey` altında saklarsanız,
paketle birlikte gelen xAI model sağlayıcısı bu anahtarı geri dönüş olarak da yeniden kullanır.
`code_execution` ayarlamaları `plugins.entries.xai.config.codeExecution` altında bulunur.
</Note>

## Paketle birlikte gelen model kataloğu

OpenClaw şu xAI model ailelerini hazır olarak içerir:

| Aile          | Model kimlikleri                                                         |
| ------------- | ------------------------------------------------------------------------ |
| Grok 3        | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`              |
| Grok 4        | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast   | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta| `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code     | `grok-code-fast-1`                                                       |

Plugin ayrıca daha yeni `grok-4*` ve `grok-code-fast*` kimliklerini,
aynı API şeklini izlediklerinde ileri çözümleme ile destekler.

<Tip>
`grok-4-fast`, `grok-4-1-fast` ve `grok-4.20-beta-*` varyantları,
paketle birlikte gelen katalogdaki mevcut görsel destekli Grok başvurularıdır.
</Tip>

## OpenClaw özellik kapsamı

Paketle birlikte gelen plugin, davranışın temiz biçimde uyduğu yerlerde xAI'ın mevcut ortak API yüzeyini OpenClaw'ın paylaşılan
sağlayıcı ve araç sözleşmelerine eşler.

| xAI yeteneği                | OpenClaw yüzeyi                           | Durum                                                               |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Sohbet / Responses         | `xai/<model>` model sağlayıcısı           | Evet                                                                |
| Sunucu tarafı web search   | `web_search` sağlayıcısı `grok`           | Evet                                                                |
| Sunucu tarafı X search     | `x_search` aracı                          | Evet                                                                |
| Sunucu tarafı code execution | `code_execution` aracı                  | Evet                                                                |
| Görseller                  | `image_generate`                          | Evet                                                                |
| Videolar                   | `video_generate`                          | Evet                                                                |
| Toplu text-to-speech       | `messages.tts.provider: "xai"` / `tts`    | Evet                                                                |
| Akışlı TTS                 | —                                         | Sunulmaz; OpenClaw'ın TTS sözleşmesi tam ses tamponları döndürür    |
| Toplu speech-to-text       | `tools.media.audio` / medya anlama        | Evet                                                                |
| Akışlı speech-to-text      | Voice Call `streaming.provider: "xai"`    | Evet                                                                |
| Gerçek zamanlı ses         | —                                         | Henüz sunulmuyor; farklı oturum/WebSocket sözleşmesi                |
| Dosyalar / batch'ler       | Yalnızca genel model API uyumluluğu       | Birinci sınıf OpenClaw aracı değil                                  |

<Note>
OpenClaw; medya üretimi, konuşma ve toplu transkripsiyon için xAI'ın REST görsel/video/TTS/STT API'lerini,
canlı Voice Call transkripsiyonu için xAI'ın akışlı STT WebSocket'ini
ve model, arama ve code-execution araçları için Responses API'sini kullanır. Gerçek zamanlı ses oturumları gibi
farklı OpenClaw sözleşmeleri gerektiren özellikler, gizli plugin davranışı yerine
yukarı akış yetenekleri olarak burada belgelenir.
</Note>

### Hızlı kip eşlemeleri

`/fast on` veya `agents.defaults.models["xai/<model>"].params.fastMode: true`
yerel xAI isteklerini aşağıdaki gibi yeniden yazar:

| Kaynak model  | Hızlı kip hedefi  |
| ------------- | ----------------- |
| `grok-3`      | `grok-3-fast`     |
| `grok-3-mini` | `grok-3-mini-fast`|
| `grok-4`      | `grok-4-fast`     |
| `grok-4-0709` | `grok-4-fast`     |

### Eski uyumluluk takma adları

Eski takma adlar hâlâ kanonik paketlenmiş kimliklere normalize edilir:

| Eski takma ad             | Kanonik kimlik                        |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Özellikler

<AccordionGroup>
  <Accordion title="Web search">
    Paketle birlikte gelen `grok` web-search sağlayıcısı da `XAI_API_KEY` kullanır:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video üretimi">
    Paketle birlikte gelen `xai` plugin'i, paylaşılan
    `video_generate` aracı üzerinden video üretimi kaydeder.

    - Varsayılan video modeli: `xai/grok-imagine-video`
    - Kipler: text-to-video, image-to-video, uzak video düzenleme ve uzak video uzatma
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Çözünürlükler: `480P`, `720P`
    - Süre: üretim/image-to-video için 1-15 saniye, uzatma için 2-10 saniye

    <Warning>
    Yerel video tamponları kabul edilmez. Video düzenleme/uzatma girdileri için
    uzak `http(s)` URL'leri kullanın. Image-to-video yerel görsel tamponlarını kabul eder çünkü
    OpenClaw bunları xAI için data URL olarak kodlayabilir.
    </Warning>

    xAI'ı varsayılan video sağlayıcısı olarak kullanmak için:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Paylaşılan araç parametreleri,
    sağlayıcı seçimi ve devralma davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
    </Note>

  </Accordion>

  <Accordion title="Görsel üretimi">
    Paketle birlikte gelen `xai` plugin'i, paylaşılan
    `image_generate` aracı üzerinden görsel üretimi kaydeder.

    - Varsayılan görsel modeli: `xai/grok-imagine-image`
    - Ek model: `xai/grok-imagine-image-pro`
    - Kipler: text-to-image ve referans görselli düzenleme
    - Referans girdileri: bir `image` veya en fazla beş `images`
    - En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Çözünürlükler: `1K`, `2K`
    - Sayı: en fazla 4 görsel

    OpenClaw, üretilen medyanın normal kanal ek yoluyla
    saklanabilmesi ve teslim edilebilmesi için xAI'dan `b64_json` görsel yanıtları ister. Yerel
    referans görseller data URL'lere dönüştürülür; uzak `http(s)` referansları ise
    doğrudan geçirilir.

    xAI'ı varsayılan görsel sağlayıcısı olarak kullanmak için:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI ayrıca `quality`, `mask`, `user` ve
    `1:2`, `2:1`, `9:20`, `20:9` gibi ek yerel oranları da belgeler. OpenClaw bugün yalnızca
    sağlayıcılar arası paylaşılan görsel denetimlerini iletir; desteklenmeyen yalnızca-yerel düğmeler
    bilinçli olarak `image_generate` üzerinden sunulmaz.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Paketle birlikte gelen `xai` plugin'i, paylaşılan `tts`
    sağlayıcı yüzeyi üzerinden text-to-speech kaydeder.

    - Sesler: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Varsayılan ses: `eve`
    - Biçimler: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Dil: BCP-47 kodu veya `auto`
    - Hız: sağlayıcıya özgü hız geçersiz kılması
    - Yerel Opus sesli not biçimi desteklenmez

    xAI'ı varsayılan TTS sağlayıcısı olarak kullanmak için:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw, xAI'ın toplu `/v1/tts` uç noktasını kullanır. xAI ayrıca WebSocket üzerinden akışlı TTS de sunar,
    ancak OpenClaw konuşma sağlayıcısı sözleşmesi şu anda
    yanıt tesliminden önce tam bir ses tamponu bekler.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Paketle birlikte gelen `xai` plugin'i, toplu speech-to-text'i OpenClaw'ın
    medya anlama transkripsiyon yüzeyi üzerinden kaydeder.

    - Varsayılan model: `grok-stt`
    - Uç nokta: xAI REST `/v1/stt`
    - Girdi yolu: çok parçalı ses dosyası yükleme
    - OpenClaw içinde, gelen ses transkripsiyonunun
      `tools.media.audio` kullandığı her yerde desteklenir; buna Discord ses kanalı segmentleri ve
      kanal ses ekleri dahildir

    Gelen ses transkripsiyonu için xAI'ı zorlamak için:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Dil, paylaşılan ses medya yapılandırması veya çağrı başına
    transkripsiyon isteği üzerinden sağlanabilir. İstem ipuçları paylaşılan OpenClaw
    yüzeyi tarafından kabul edilir, ancak xAI REST STT entegrasyonu yalnızca dosya, model ve
    dili iletir; çünkü bunlar mevcut genel xAI uç noktasına temiz biçimde eşlenir.

  </Accordion>

  <Accordion title="Akışlı speech-to-text">
    Paketle birlikte gelen `xai` plugin'i ayrıca
    canlı Voice Call sesi için gerçek zamanlı bir transkripsiyon sağlayıcısı da kaydeder.

    - Uç nokta: xAI WebSocket `wss://api.x.ai/v1/stt`
    - Varsayılan kodlama: `mulaw`
    - Varsayılan örnekleme oranı: `8000`
    - Varsayılan endpointing: `800ms`
    - Ara transcript'ler: varsayılan olarak etkindir

    Voice Call'ın Twilio medya akışı G.711 µ-law ses kareleri gönderir, bu nedenle
    xAI sağlayıcısı bu kareleri dönüştürme yapmadan doğrudan iletebilir:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Sağlayıcıya ait yapılandırma
    `plugins.entries.voice-call.config.streaming.providers.xai` altında bulunur. Desteklenen
    anahtarlar `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` veya
    `alaw`), `interimResults`, `endpointingMs` ve `language` değerleridir.

    <Note>
    Bu akışlı sağlayıcı, Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir.
    Discord ses özelliği şu anda kısa segmentler kaydeder ve bunun yerine toplu
    `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="x_search yapılandırması">
    Paketle birlikte gelen xAI plugin'i, Grok üzerinden
    X (eski adıyla Twitter) içeriğinde arama yapmak için `x_search` aracını OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.xSearch`

    | Anahtar           | Tür      | Varsayılan         | Açıklama                             |
    | ----------------- | -------- | ------------------ | ------------------------------------ |
    | `enabled`         | boolean  | —                  | x_search özelliğini etkinleştirir veya devre dışı bırakır |
    | `model`           | string   | `grok-4-1-fast`    | x_search istekleri için kullanılan model |
    | `inlineCitations` | boolean  | —                  | Sonuçlara satır içi alıntıları dahil eder |
    | `maxTurns`        | number   | —                  | En fazla konuşma turu                |
    | `timeoutSeconds`  | number   | —                  | Saniye cinsinden istek zaman aşımı   |
    | `cacheTtlMinutes` | number   | —                  | Dakika cinsinden önbellek yaşam süresi |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Code execution yapılandırması">
    Paketle birlikte gelen xAI plugin'i,
    xAI'ın sandbox ortamında uzak kod yürütme için `code_execution` aracını bir OpenClaw aracı olarak sunar.

    Yapılandırma yolu: `plugins.entries.xai.config.codeExecution`

    | Anahtar          | Tür      | Varsayılan                 | Açıklama                                  |
    | ---------------- | -------- | -------------------------- | ----------------------------------------- |
    | `enabled`        | boolean  | `true` (anahtar mevcutsa)  | Code execution özelliğini etkinleştirir veya devre dışı bırakır |
    | `model`          | string   | `grok-4-1-fast`            | Code execution istekleri için kullanılan model |
    | `maxTurns`       | number   | —                          | En fazla konuşma turu                     |
    | `timeoutSeconds` | number   | —                          | Saniye cinsinden istek zaman aşımı        |

    <Note>
    Bu, yerel [`exec`](/tr/tools/exec) değil, uzak xAI sandbox yürütmesidir.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bilinen sınırlar">
    - Kimlik doğrulama bugün yalnızca API anahtarıyla yapılır. OpenClaw'da henüz xAI OAuth veya device-code akışı yoktur.
    - `grok-4.20-multi-agent-experimental-beta-0304`, standart OpenClaw xAI aktarımından farklı bir yukarı akış API yüzeyi gerektirdiği için
      normal xAI sağlayıcı yolunda desteklenmez.
    - xAI Realtime voice henüz bir OpenClaw sağlayıcısı olarak kaydedilmemiştir. Toplu STT veya
      akışlı transkripsiyondan farklı çift yönlü bir ses oturumu sözleşmesine ihtiyaç duyar.
    - xAI görsel `quality`, görsel `mask` ve ek yalnızca-yerel en-boy oranları,
      paylaşılan `image_generate` aracı karşılık gelen
      sağlayıcılar arası denetimlere sahip olana kadar sunulmaz.
  </Accordion>

  <Accordion title="Gelişmiş notlar">
    - OpenClaw, paylaşılan çalıştırıcı yolunda xAI'ya özgü araç şeması ve araç çağrısı uyumluluk düzeltmelerini
      otomatik olarak uygular.
    - Yerel xAI istekleri varsayılan olarak `tool_stream: true` kullanır. Bunu
      devre dışı bırakmak için
      `agents.defaults.models["xai/<model>"].params.tool_stream` değerini `false` yapın.
    - Paketle birlikte gelen xAI sarmalayıcı, yerel xAI isteklerini göndermeden önce
      desteklenmeyen katı araç-şeması bayraklarını ve reasoning payload anahtarlarını ayıklar.
    - `web_search`, `x_search` ve `code_execution`, OpenClaw
      araçları olarak sunulur. OpenClaw, her araç
      isteğinde ihtiyaç duyduğu belirli xAI yerleşik özelliğini etkinleştirir; her sohbet turuna tüm yerel araçları eklemez.
    - `x_search` ve `code_execution`, çekirdek model çalışma zamanına
      sabit kodlanmak yerine paketle birlikte gelen xAI plugin'ine aittir.
    - `code_execution`, yerel
      [`exec`](/tr/tools/exec) değil, uzak xAI sandbox yürütmesidir.
  </Accordion>
</AccordionGroup>

## Canlı test

xAI medya yolları birim testleri ve isteğe bağlı canlı paketlerle kapsanır. Canlı
komutlar, `XAI_API_KEY` araştırmasından önce
`~/.profile` dahil oturum açma shell'inizden gizli bilgileri yükler.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Sağlayıcıya özgü canlı dosya; normal TTS, telefon dostu PCM
TTS üretir, sesi xAI toplu STT üzerinden yazıya döker, aynı PCM'i xAI
gerçek zamanlı STT üzerinden akıtır, text-to-image çıktısı üretir ve referans bir görseli düzenler. Paylaşılan
görsel canlı dosyası ise aynı xAI sağlayıcısını OpenClaw'ın
çalışma zamanı seçimi, devralma, normalizasyon ve medya ek yolu üzerinden doğrular.

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıların, model başvurularının ve devralma davranışının seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Tüm sağlayıcılar" href="/tr/providers/index" icon="grid-2">
    Daha geniş sağlayıcı genel bakışı.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve çözümler.
  </Card>
</CardGroup>
