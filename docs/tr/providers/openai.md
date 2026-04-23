---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulamasını istiyorsunuz
    - Daha sıkı GPT-5 ajan yürütme davranışına ihtiyacınız var
summary: OpenClaw'da API anahtarları veya Codex aboneliği üzerinden OpenAI kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T13:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI, GPT modelleri için geliştirici API'leri sağlar. OpenClaw iki kimlik doğrulama yolunu destekler:

  - **API anahtarı** — kullanım bazlı faturalandırmayla doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
  - **Codex aboneliği** — abonelik erişimiyle ChatGPT/Codex oturumu açma (`openai-codex/*` modelleri)

  OpenAI, OpenClaw gibi harici araçlarda ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

  ## OpenClaw özellik kapsamı

  | OpenAI yeteneği           | OpenClaw yüzeyi                           | Durum                                                  |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | Sohbet / Yanıtlar         | `openai/<model>` model sağlayıcısı        | Evet                                                   |
  | Codex abonelik modelleri  | `openai-codex/<model>` model sağlayıcısı  | Evet                                                   |
  | Sunucu taraflı web arama  | Yerel OpenAI Responses aracı              | Evet, web arama etkin olduğunda ve hiçbir sağlayıcı sabitlenmediğinde |
  | Görseller                 | `image_generate`                          | Evet                                                   |
  | Videolar                  | `video_generate`                          | Evet                                                   |
  | Metinden konuşmaya        | `messages.tts.provider: "openai"` / `tts` | Evet                                                   |
  | Toplu konuşmadan metne    | `tools.media.audio` / medya anlama        | Evet                                                   |
  | Akışlı konuşmadan metne   | Voice Call `streaming.provider: "openai"` | Evet                                                   |
  | Gerçek zamanlı ses        | Voice Call `realtime.provider: "openai"`  | Evet                                                   |
  | Embeddings                | bellek embedding sağlayıcısı              | Evet                                                   |

  ## Başlarken

  Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

  <Tabs>
  <Tab title="API anahtarı (OpenAI Platform)">
    **Şunun için en iyisi:** doğrudan API erişimi ve kullanım bazlı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform panosundan](https://platform.openai.com/api-keys) bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding'i çalıştırın">
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
    |-----------|-------|------|
    | `openai/gpt-5.4` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex oturum açma `openai/*` üzerinden değil, `openai-codex/*` üzerinden yönlendirilir.
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
    **Şunun için en iyisi:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi kullanmak. Codex cloud, ChatGPT oturumu açmayı gerektirir.

    <Steps>
      <Step title="Codex OAuth'u çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Veya OAuth'u doğrudan çalıştırın:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Başsız veya callback'e elverişsiz kurulumlar için, localhost tarayıcı callback'i yerine ChatGPT device-code akışıyla oturum açmak üzere `--device-code` ekleyin:

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

    ### Yol özeti

    | Model ref | Yol | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex oturum açma |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex oturum açma (hak sahipliğine bağlı) |

    <Note>
    Bu yol, bilerek `openai/gpt-5.4` yolundan ayrı tutulur. Doğrudan Platform erişimi için API anahtarıyla `openai/*`, Codex abonelik erişimi için `openai-codex/*` kullanın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Onboarding artık OAuth materyalini `~/.codex` içinden içe aktarmıyor. Varsayılan olarak tarayıcı OAuth ile veya yukarıdaki device-code akışıyla oturum açın — OpenClaw oluşan kimlik bilgilerini kendi ajan kimlik doğrulama deposunda yönetir.
    </Note>

    ### Bağlam penceresi sınırı

    OpenClaw, model metadata'sını ve çalışma zamanı bağlam sınırını ayrı değerler olarak ele alır.

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
    Yerel model metadata'sını belirtmek için `contextWindow` kullanın. Çalışma zamanı bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

  </Tab>
</Tabs>

## Görsel oluşturma

Paketlenmiş `openai` Plugin, `image_generate` aracı üzerinden görsel oluşturmayı kaydeder.

| Yetenek                  | Değer                              |
| ------------------------ | ---------------------------------- |
| Varsayılan model         | `openai/gpt-image-2`               |
| İstek başına en fazla görsel | 4                              |
| Düzenleme modu           | Etkin (en fazla 5 referans görsel) |
| Boyut geçersiz kılmaları | Desteklenir, 2K/4K boyutları dahil |
| En-boy oranı / çözünürlük | OpenAI Images API'ye iletilmez    |

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Görsel Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

`gpt-image-2`, hem OpenAI metinden görsel oluşturma hem de görsel düzenleme için varsayılandır. `gpt-image-1` açık bir model geçersiz kılması olarak kullanılabilir olmaya devam eder, ancak yeni OpenAI görsel iş akışları `openai/gpt-image-2` kullanmalıdır.

Oluştur:

```
/tool image_generate model=openai/gpt-image-2 prompt="macOS üzerinde OpenClaw için cilalı bir lansman posteri" size=3840x2160 count=1
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Nesnenin şeklini koru, malzemeyi yarı saydam cama dönüştür" image=/path/to/reference.png size=1024x1536
```

## Video oluşturma

Paketlenmiş `openai` Plugin, `video_generate` aracı üzerinden video oluşturmayı kaydeder.

| Yetenek         | Değer                                                                             |
| --------------- | --------------------------------------------------------------------------------- |
| Varsayılan model | `openai/sora-2`                                                                  |
| Modlar          | Metinden videoya, görselden videoya, tek video düzenleme                         |
| Referans girdileri | 1 görsel veya 1 video                                                         |
| Boyut geçersiz kılmaları | Desteklenir                                                            |
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
</Note>

## GPT-5 istem katkısı

OpenClaw, sağlayıcılar genelinde GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 istem katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` ve uyumlu diğer GPT-5 ref'leri aynı katmanı alır. Daha eski GPT-4.x modelleri almaz.

Paketlenmiş yerel Codex harness sağlayıcısı (`codex/*`), Codex uygulama sunucusu geliştirici talimatları üzerinden aynı GPT-5 davranışını ve Heartbeat katmanını kullanır; bu nedenle `codex/gpt-5.x` oturumları, Codex harness isteminin geri kalanına sahip olsa da aynı takip etme ve proaktif Heartbeat rehberliğini korur.

GPT-5 katkısı; persona sürekliliği, yürütme güvenliği, araç disiplini, çıktı şekli, tamamlanma kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem isteminde ve giden teslim politikası içinde kalır. GPT-5 rehberliği eşleşen modeller için her zaman etkindir. Dostça etkileşim stili katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                        |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (varsayılan) | Dostça etkileşim stili katmanını etkinleştirir |
| `"on"`                 | `"friendly"` için takma ad                  |
| `"off"`                | Yalnızca dostça stil katmanını devre dışı bırakır |

<Tabs>
  <Tab title="Yapılandırma">
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
Değerler çalışma zamanında büyük/küçük harfe duyarsızdır; bu nedenle `"Off"` ve `"off"` her ikisi de dostça stil katmanını devre dışı bırakır.
</Tip>

<Note>
Eski `plugins.entries.openai.config.personality`, paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı belirlenmediğinde uyumluluk için geri dönüş olarak hâlâ okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketlenmiş `openai` Plugin, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarlanmadı) |
    | Talimatlar | `messages.tts.providers.openai.instructions` | (ayarlanmadı, yalnızca `gpt-4o-mini-tts`) |
    | Biçim | `messages.tts.providers.openai.responseFormat` | sesli notlar için `opus`, dosyalar için `mp3` |
    | API anahtarı | `messages.tts.providers.openai.apiKey` | Geri dönüş olarak `OPENAI_API_KEY` kullanır |
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

  <Accordion title="Konuşmadan metne">
    Paketlenmiş `openai` Plugin, OpenClaw'ın medya anlama transkripsiyon yüzeyi üzerinden toplu konuşmadan metne dönüştürmeyi kaydeder.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Girdi yolu: multipart ses dosyası yükleme
    - OpenClaw'da, gelen ses transkripsiyonu `tools.media.audio` kullandığı her yerde desteklenir; buna Discord ses kanalı segmentleri ve kanal ses ekleri dahildir

    Gelen ses transkripsiyonu için OpenAI'ı zorunlu kılmak için:

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

    Dil ve istem ipuçları, paylaşılan ses medya yapılandırması veya çağrı başına transkripsiyon isteği tarafından sağlandığında OpenAI'a iletilir.

  </Accordion>

  <Accordion title="Gerçek zamanlı transkripsiyon">
    Paketlenmiş `openai` Plugin, Voice Call Plugin için gerçek zamanlı transkripsiyonu kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmadı) |
    | İstem | `...openai.prompt` | (ayarlanmadı) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | Geri dönüş olarak `OPENAI_API_KEY` kullanır |

    <Note>
    `wss://api.openai.com/v1/realtime` adresine G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile bir WebSocket bağlantısı kullanır. Bu akış sağlayıcısı, Voice Call'ın gerçek zamanlı transkripsiyon yolu içindir; Discord voice ise şu anda kısa segmentler kaydeder ve bunun yerine toplu `tools.media.audio` transkripsiyon yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketlenmiş `openai` Plugin, Voice Call Plugin için gerçek zamanlı sesi kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Ses | `...openai.voice` | `alloy` |
    | Sıcaklık | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API anahtarı | `...openai.apiKey` | Geri dönüş olarak `OPENAI_API_KEY` kullanır |

    <Note>
    `azureEndpoint` ve `azureDeployment` yapılandırma anahtarları üzerinden Azure OpenAI'ı destekler. Çift yönlü araç çağrımını destekler. G.711 u-law ses biçimini kullanır.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Paketlenmiş `openai` sağlayıcısı, temel URL'yi geçersiz kılarak görsel oluşturma için bir Azure OpenAI kaynağını hedefleyebilir. Görsel oluşturma yolunda OpenClaw, `models.providers.openai.baseUrl` üzerindeki Azure ana makine adlarını algılar ve otomatik olarak Azure'ın istek şekline geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu kullanır
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ve `models.providers.openai.baseUrl` değerinden etkilenmez. Azure
ayarları için [Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı
ses** accordion bölümüne bakın.
</Note>

Azure OpenAI'ı şu durumlarda kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'ın sağladığı bölgesel veri yerleşimi veya uyumluluk kontrollerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracılığı içinde tutmak istiyorsanız

### Yapılandırma

Paketlenmiş `openai` sağlayıcısı üzerinden Azure görsel oluşturma için
`models.providers.openai.baseUrl` değerini Azure kaynağınıza yönlendirin ve
`apiKey` değerini Azure OpenAI anahtarına ayarlayın (OpenAI Platform anahtarı değil):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw, Azure görsel oluşturma yolu için şu Azure ana makine soneklerini tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure ana makinesindeki görsel oluşturma istekleri için OpenClaw:

- `Authorization: Bearer` yerine `api-key` üstbilgisini gönderir
- Deployment kapsamlı yollar kullanır (`/openai/deployments/{deployment}/...`)
- Her isteğe `?api-version=...` ekler

Diğer temel URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart
OpenAI görsel istek şeklini korur.

<Note>
`openai` sağlayıcısının görsel oluşturma yolu için Azure yönlendirme
OpenClaw 2026.4.22 veya sonrasını gerektirir. Daha eski sürümler herhangi bir özel
`openai.baseUrl` değerini genel OpenAI uç noktası gibi ele alır ve Azure
görsel deployment'larında başarısız olur.
</Note>

### API sürümü

Azure görsel oluşturma yolu için belirli bir Azure preview veya GA sürümünü sabitlemek üzere
`AZURE_OPENAI_API_VERSION` ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmadığında varsayılan `2024-12-01-preview` olur.

### Model adları deployment adlarıdır

Azure OpenAI, modelleri deployment'lara bağlar. Paketlenmiş `openai` sağlayıcısı üzerinden yönlendirilen
Azure görsel oluşturma istekleri için OpenClaw'daki `model` alanı, genel
OpenAI model kimliği değil, Azure portalında yapılandırdığınız **Azure deployment adı**
olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir deployment oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Temiz bir poster" size=1024x1024 count=1
```

Aynı deployment-adı kuralı, paketlenmiş `openai` sağlayıcısı üzerinden yönlendirilen
görsel oluşturma çağrıları için de geçerlidir.

### Bölgesel kullanılabilirlik

Azure görsel oluşturma şu anda yalnızca bazı bölgelerde kullanılabilir
(örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Bir deployment oluşturmadan önce Microsoft'un güncel bölge
listesini kontrol edin ve belirli modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farkları

Azure OpenAI ve genel OpenAI her zaman aynı görsel parametrelerini kabul etmez.
Azure, genel OpenAI'ın izin verdiği seçenekleri reddedebilir (örneğin belirli
`background` değerleri `gpt-image-2` üzerinde) veya bunları yalnızca belirli model
sürümlerinde sunabilir. Bu farklar OpenClaw'dan değil, Azure'dan ve alttaki modelden gelir.
Bir Azure isteği doğrulama hatasıyla başarısız olursa, Azure portalında
belirli deployment'ınız ve API sürümünüz tarafından desteklenen parametre
kümesini kontrol edin.

<Note>
Azure OpenAI yerel taşıma ve uyumluluk davranışı kullanır ancak
OpenClaw'ın gizli atıf üstbilgilerini almaz. Ayrıntılar için
[Gelişmiş yapılandırma](#advanced-configuration) altındaki **Yerel ve OpenAI-compatible
yollar** accordion bölümüne bakın.
</Note>

<Tip>
`openai` sağlayıcısından ayrı bir Azure OpenAI Responses sağlayıcısı için,
[Sunucu taraflı Compaction](#server-side-compaction-responses-api) accordion bölümündeki
`azure-openai-responses/*` model ref'lerine bakın.
</Tip>

<Note>
Azure sohbet ve Responses trafiği, temel URL geçersiz kılmasına ek olarak
Azure'a özgü sağlayıcı/API yapılandırması gerektirir. Görsel oluşturmanın ötesinde
Azure model çağrıları istiyorsanız, yalnızca `openai.baseUrl` değerinin yeterli
olduğunu varsaymak yerine onboarding akışını veya uygun Azure API/kimlik doğrulama
şeklini ayarlayan bir sağlayıcı yapılandırmasını kullanın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Taşıma (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için WebSocket öncelikli ve SSE geri dönüşlü (`"auto"`) kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce bir erken WebSocket hatasını yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve soğuma süresinde SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve sıra kimliği üstbilgileri ekler
    - Taşıma varyantları arasında kullanım sayaçlarını (`input_tokens` / `prompt_tokens`) normalize eder

    | Değer | Davranış |
    |-------|----------|
    | `"auto"` (varsayılan) | Önce WebSocket, SSE geri dönüşü |
    | `"sse"` | Yalnızca SSE'yi zorunlu kıl |
    | `"websocket"` | Yalnızca WebSocket'i zorunlu kıl |

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
    - [Akışlı API yanıtları (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw, ilk sıra gecikmesini azaltmak için `openai/*` için varsayılan olarak WebSocket warm-up özelliğini etkinleştirir.

    ```json5
    // Warm-up'ı devre dışı bırak
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
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için paylaşılan bir hızlı mod düğmesi sunar:

    - **Sohbet/UI:** `/fast status|on|off`
    - **Yapılandırma:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

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
    Oturum geçersiz kılmaları yapılandırmaya üstün gelir. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana geri döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (service_tier)">
    OpenAI'ın API'si, `service_tier` aracılığıyla öncelikli işleme sunar. Bunu OpenClaw'da model başına ayarlayın:

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
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Her iki sağlayıcıyı da bir proxy üzerinden yönlendirirseniz OpenClaw, `service_tier` değerini değiştirmeden bırakır.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu taraflı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri için (`api.openai.com` üzerindeki `openai/*`), OpenClaw sunucu taraflı Compaction özelliğini otomatik etkinleştirir:

    - `store: true` zorunlu kılınır (`supportsStore: false` ayarlayan model compat durumu hariç)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` eklenir
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
    `responsesServerCompaction` yalnızca `context_management` eklemesini kontrol eder. Doğrudan OpenAI Responses modelleri, compat `supportsStore: false` ayarlamadığı sürece yine de `store: true` zorunlu kılar.
    </Note>

  </Accordion>

  <Accordion title="Sıkı ajan odaklı GPT modu">
    `openai/*` ve `openai-codex/*` üzerindeki GPT-5 ailesi çalıştırmaları için OpenClaw, daha sıkı bir gömülü yürütme sözleşmesi kullanabilir:

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
    - Artık bir araç eylemi mevcut olduğunda yalnızca plan içeren bir sırayı başarılı ilerleme olarak değerlendirmez
    - Sırayı hemen harekete geç yönlendirmesiyle yeniden dener
    - Önemli işler için `update_plan` özelliğini otomatik olarak etkinleştirir
    - Model eyleme geçmeden plan yapmaya devam ederse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmalarıyla sınırlıdır. Diğer sağlayıcılar ve daha eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI-compatible yollar">
    OpenClaw, doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI-compatible `/v1` proxy'lerinden farklı ele alır:

    **Yerel yollar** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` effort desteği olan modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı reasoning'i atlar
    - Araç şemalarını varsayılan olarak sıkı moda ayarlar
    - Gizli atıf üstbilgilerini yalnızca doğrulanmış yerel ana makinelerde ekler
    - OpenAI'ya özgü istek şekillendirmesini korur (`service_tier`, `store`, reasoning-compat, istem önbelleği ipuçları)

    **Proxy/compatible yollar:**
    - Daha gevşek compat davranışı kullanır
    - Sıkı araç şemalarını veya yalnızca yerel üstbilgileri zorunlu kılmaz

    Azure OpenAI, yerel taşıma ve compat davranışı kullanır ancak gizli atıf üstbilgilerini almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref'lerini ve failover davranışını seçme.
  </Card>
  <Card title="Görsel oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
