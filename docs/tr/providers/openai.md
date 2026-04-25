---
read_when:
    - OpenClaw'da OpenAI modellerini kullanmak istiyorsunuz
    - API anahtarları yerine Codex abonelik kimlik doğrulamasını istiyorsunuz
    - Daha sıkı GPT-5 agent yürütme davranışına ihtiyacınız var
summary: OpenClaw'da OpenAI'ı API anahtarları veya Codex aboneliği ile kullanın
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:56:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI, GPT modelleri için geliştirici API'leri sağlar. OpenClaw, OpenAI ailesi için üç yolu destekler. Model öneki yolu seçer:

- **API anahtarı** — kullanıma dayalı faturalandırmayla doğrudan OpenAI Platform erişimi (`openai/*` modelleri)
- **PI üzerinden Codex aboneliği** — abonelik erişimiyle ChatGPT/Codex oturum açma (`openai-codex/*` modelleri)
- **Codex app-server harness** — yerel Codex app-server yürütmesi (`openai/*` modelleri ve ayrıca `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI, OpenClaw gibi harici araçlar ve iş akışlarında abonelik OAuth kullanımını açıkça destekler.

Sağlayıcı, model, runtime ve kanal ayrı katmanlardır. Bu etiketler karışıyorsa yapılandırmayı değiştirmeden önce [Agent runtimes](/tr/concepts/agent-runtimes) sayfasını okuyun.

## Hızlı seçim

| Hedef                                         | Kullanım                                                 | Notlar                                                                       |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Doğrudan API anahtarı faturalandırması        | `openai/gpt-5.4`                                         | `OPENAI_API_KEY` ayarlayın veya OpenAI API anahtarı onboarding'ini çalıştırın. |
| ChatGPT/Codex abonelik kimlik doğrulamasıyla GPT-5.5 | `openai-codex/gpt-5.5`                                   | Codex OAuth için varsayılan PI yolu. Abonelik kurulumları için en iyi ilk seçim. |
| Yerel Codex app-server davranışıyla GPT-5.5   | `openai/gpt-5.5` artı `embeddedHarness.runtime: "codex"` | Genel OpenAI API yolunu değil, Codex app-server harness'ını kullanır.        |
| Görüntü üretimi veya düzenleme                | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` veya OpenAI Codex OAuth ile çalışır.                        |

<Note>
GPT-5.5 şu anda OpenClaw'da abonelik/OAuth yolları üzerinden kullanılabilir:
PI çalıştırıcısıyla `openai-codex/gpt-5.5` veya Codex app-server harness ile
`openai/gpt-5.5`. `openai/gpt-5.5` için doğrudan API anahtarı erişimi,
OpenAI GPT-5.5'i genel API'de etkinleştirdiğinde desteklenir; o zamana kadar
`OPENAI_API_KEY` kurulumları için `openai/gpt-5.4` gibi API etkin bir model kullanın.
</Note>

<Note>
OpenAI plugin'ini etkinleştirmek veya bir `openai-codex/*` modeli seçmek,
paketlenmiş Codex app-server plugin'ini etkinleştirmez. OpenClaw bu plugin'i
yalnızca yerel Codex harness'ını açıkça
`embeddedHarness.runtime: "codex"` ile seçtiğinizde veya eski bir `codex/*` model başvurusu kullandığınızda etkinleştirir.
</Note>

## OpenClaw özellik kapsamı

| OpenAI yeteneği            | OpenClaw yüzeyi                                           | Durum                                                  |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Sohbet / Responses         | `openai/<model>` model sağlayıcısı                        | Evet                                                   |
| Codex abonelik modelleri   | `openai-codex/<model>` ile `openai-codex` OAuth          | Evet                                                   |
| Codex app-server harness   | `embeddedHarness.runtime: codex` ile `openai/<model>`     | Evet                                                   |
| Sunucu tarafı web araması  | Yerel OpenAI Responses aracı                              | Evet, web araması etkin olduğunda ve sağlayıcı sabitlenmediğinde |
| Görüntüler                 | `image_generate`                                          | Evet                                                   |
| Videolar                   | `video_generate`                                          | Evet                                                   |
| Metinden konuşmaya         | `messages.tts.provider: "openai"` / `tts`                 | Evet                                                   |
| Toplu konuşmadan metne     | `tools.media.audio` / medya anlama                        | Evet                                                   |
| Akışlı konuşmadan metne    | Voice Call `streaming.provider: "openai"`                 | Evet                                                   |
| Gerçek zamanlı ses         | Voice Call `realtime.provider: "openai"` / Control UI Talk | Evet                                                  |
| Embeddings                 | bellek embedding sağlayıcısı                              | Evet                                                   |

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **En uygunu:** doğrudan API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [OpenAI Platform panosundan](https://platform.openai.com/api-keys) bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Veya anahtarı doğrudan iletin:

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

    | Model başvurusu | Yol | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Doğrudan OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | OpenAI GPT-5.5'i API'de etkinleştirdiğinde gelecekteki doğrudan API yolu | `OPENAI_API_KEY` |

    <Note>
    `openai/*`, Codex app-server harness'ını açıkça zorlamadığınız sürece
    doğrudan OpenAI API anahtarı yoludur. GPT-5.5'in kendisi şu anda yalnızca abonelik/OAuth
    yoluyla kullanılabilir; varsayılan PI çalıştırıcısı üzerinden Codex OAuth için `openai-codex/*`
    kullanın veya yerel
    Codex app-server yürütmesi için `embeddedHarness.runtime: "codex"` ile `openai/gpt-5.5` kullanın.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw, `openai/gpt-5.3-codex-spark` modelini **dışa açmaz**. Canlı OpenAI API istekleri bu modeli reddeder ve mevcut Codex kataloğu da bunu dışa açmaz.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **En uygunu:** ayrı bir API anahtarı yerine ChatGPT/Codex aboneliğinizi kullanmak. Codex bulutu ChatGPT oturum açmayı gerektirir.

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
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Yol özeti

    | Model başvurusu | Yol | Kimlik doğrulama |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | PI üzerinden ChatGPT/Codex OAuth | Codex oturum açma |
    | `embeddedHarness.runtime: "codex"` ile `openai/gpt-5.5` | Codex app-server harness | Codex app-server kimlik doğrulaması |

    <Note>
    Kimlik doğrulama/profil komutları için `openai-codex` sağlayıcı kimliğini
    kullanmaya devam edin. `openai-codex/*` model öneki, Codex OAuth için açık PI yoludur.
    Paketlenmiş Codex app-server harness'ını seçmez veya otomatik etkinleştirmez.
    </Note>

    ### Yapılandırma örneği

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding artık OAuth materyalini `~/.codex` içinden içe aktarmıyor. Tarayıcı OAuth (varsayılan) veya yukarıdaki cihaz kodu akışıyla oturum açın — OpenClaw ortaya çıkan kimlik bilgilerini kendi agent kimlik doğrulama deposunda yönetir.
    </Note>

    ### Durum göstergesi

    Sohbet `/status`, geçerli oturum için hangi model runtime'ının etkin olduğunu gösterir.
    Varsayılan PI harness'ı `Runtime: OpenClaw Pi Default` olarak görünür. Paketlenmiş
    Codex app-server harness'ı seçildiğinde `/status`,
    `Runtime: OpenAI Codex` gösterir. Mevcut oturumlar kaydedilmiş harness kimliğini korur; bu nedenle `/status` içinde yeni bir PI/Codex seçimini yansıtmasını istiyorsanız `embeddedHarness` değiştirdikten sonra `/new` veya `/reset` kullanın.

    ### Bağlam penceresi sınırı

    OpenClaw, model meta verilerini ve runtime bağlam sınırını ayrı değerler olarak ele alır.

    Codex OAuth üzerinden `openai-codex/gpt-5.5` için:

    - Yerel `contextWindow`: `1000000`
    - Varsayılan runtime `contextTokens` sınırı: `272000`

    Daha küçük varsayılan sınır pratikte daha iyi gecikme ve kalite özelliklerine sahiptir. Bunu `contextTokens` ile geçersiz kılın:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Yerel model meta verilerini bildirmek için `contextWindow` kullanın. Runtime bağlam bütçesini sınırlamak için `contextTokens` kullanın.
    </Note>

    ### Katalog kurtarma

    OpenClaw, mevcut olduğunda `gpt-5.5` için yukarı akış Codex katalog meta verilerini kullanır. Canlı Codex keşfi, hesap kimliği doğrulanmışken `openai-codex/gpt-5.5` satırını atlıyorsa, OpenClaw bu OAuth model satırını sentezler; böylece Cron, alt agent ve yapılandırılmış varsayılan model çalıştırmaları `Unknown model` ile başarısız olmaz.

  </Tab>
</Tabs>

## Görüntü üretimi

Paketlenmiş `openai` plugin'i, `image_generate` aracı üzerinden görüntü üretimini kaydeder.
Aynı `openai/gpt-image-2` model başvurusu üzerinden hem OpenAI API anahtarıyla görüntü üretimini hem de Codex OAuth görüntü üretimini destekler.

| Yetenek                  | OpenAI API anahtarı               | Codex OAuth                         |
| ------------------------ | --------------------------------- | ----------------------------------- |
| Model başvurusu          | `openai/gpt-image-2`              | `openai/gpt-image-2`                |
| Kimlik doğrulama         | `OPENAI_API_KEY`                  | OpenAI Codex OAuth oturum açma      |
| Taşıma                   | OpenAI Images API                 | Codex Responses backend             |
| İstek başına maks. görüntü | 4                               | 4                                   |
| Düzenleme modu           | Etkin (en fazla 5 başvuru görüntüsü) | Etkin (en fazla 5 başvuru görüntüsü) |
| Boyut geçersiz kılmaları | 2K/4K boyutlar dahil desteklenir  | 2K/4K boyutlar dahil desteklenir    |
| En-boy oranı / çözünürlük | OpenAI Images API'ye iletilmez   | Güvenli olduğunda desteklenen bir boyuta eşlenir |

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Image Generation](/tr/tools/image-generation) sayfasına bakın.
</Note>

`gpt-image-2`, hem OpenAI metinden görüntü üretimi hem de görüntü düzenleme için varsayılandır. `gpt-image-1`, açık bir model geçersiz kılması olarak kullanılmaya devam eder, ancak yeni OpenAI görüntü iş akışları `openai/gpt-image-2` kullanmalıdır.

Codex OAuth kurulumlarında aynı `openai/gpt-image-2` başvurusunu koruyun. Bir `openai-codex` OAuth profili yapılandırıldığında OpenClaw, depolanan OAuth erişim token'ını çözümler ve görüntü isteklerini Codex Responses backend üzerinden gönderir. Bu istek için önce `OPENAI_API_KEY` denemez veya sessizce API anahtarına geri dönmez. Bunun yerine doğrudan OpenAI Images API yolunu istediğinizde `models.providers.openai` alanını bir API anahtarı, özel base URL veya Azure uç noktası ile açıkça yapılandırın.
Bu özel görüntü uç noktası güvenilir bir LAN/özel adresteyse ayrıca `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ayarlayın; OpenClaw bu açık onay yoksa özel/iç OpenAI uyumlu görüntü uç noktalarını engelli tutar.

Üret:

```
/tool image_generate model=openai/gpt-image-2 prompt="macOS üzerinde OpenClaw için cilalı bir lansman posteri" size=3840x2160 count=1
```

Düzenle:

```
/tool image_generate model=openai/gpt-image-2 prompt="Nesnenin şeklini koru, malzemeyi yarı saydam cam olarak değiştir" image=/path/to/reference.png size=1024x1536
```

## Video oluşturma

Paketlenmiş `openai` plugin'i, `video_generate` aracı üzerinden video oluşturmayı kaydeder.

| Yetenek         | Değer                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Varsayılan model | `openai/sora-2`                                                                  |
| Modlar           | Metinden videoya, görüntüden videoya, tek video düzenleme                        |
| Referans girdileri | 1 görüntü veya 1 video                                                         |
| Boyut geçersiz kılmaları | Desteklenir                                                               |
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Generation](/tr/tools/video-generation) sayfasına bakın.
</Note>

## GPT-5 istem katkısı

OpenClaw, sağlayıcılar genelinde GPT-5 ailesi çalıştırmaları için paylaşılan bir GPT-5 istem katkısı ekler. Model kimliğine göre uygulanır; bu nedenle `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` ve diğer uyumlu GPT-5 başvuruları aynı katmanı alır. Eski GPT-4.x modelleri almaz.

Paketlenmiş yerel Codex harness'ı, Codex app-server geliştirici talimatları aracılığıyla aynı GPT-5 davranışını ve Heartbeat katmanını kullanır; böylece `embeddedHarness.runtime: "codex"` üzerinden zorlanan `openai/gpt-5.x` oturumları, istemin geri kalanına Codex sahip olsa bile aynı takip etme ve proaktif Heartbeat yönlendirmesini korur.

GPT-5 katkısı; persona sürekliliği, yürütme güvenliği, araç disiplini, çıktı şekli, tamamlama kontrolleri ve doğrulama için etiketli bir davranış sözleşmesi ekler. Kanala özgü yanıt ve sessiz mesaj davranışı, paylaşılan OpenClaw sistem isteminde ve giden teslim ilkesinde kalır. GPT-5 yönlendirmesi eşleşen modeller için her zaman etkindir. Dostça etkileşim tarzı katmanı ayrıdır ve yapılandırılabilir.

| Değer                  | Etki                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (varsayılan) | Dostça etkileşim tarzı katmanını etkinleştirir |
| `"on"`                 | `"friendly"` için takma ad                |
| `"off"`                | Yalnızca dostça tarz katmanını devre dışı bırakır |

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
Değerler çalışma zamanında büyük/küçük harfe duyarsızdır; bu nedenle `"Off"` ve `"off"` her ikisi de dostça tarz katmanını devre dışı bırakır.
</Tip>

<Note>
Eski `plugins.entries.openai.config.personality`, paylaşılan `agents.defaults.promptOverlays.gpt5.personality` ayarı yapılmadığında geriye dönük uyumluluk yedeği olarak hâlâ okunur.
</Note>

## Ses ve konuşma

<AccordionGroup>
  <Accordion title="Konuşma sentezi (TTS)">
    Paketlenmiş `openai` plugin'i, `messages.tts` yüzeyi için konuşma sentezini kaydeder.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Ses | `messages.tts.providers.openai.voice` | `coral` |
    | Hız | `messages.tts.providers.openai.speed` | (ayarlanmamış) |
    | Talimatlar | `messages.tts.providers.openai.instructions` | (ayarlanmamış, yalnızca `gpt-4o-mini-tts`) |
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
    Paketlenmiş `openai` plugin'i, OpenClaw'ın medya anlama yazıya dökme yüzeyi üzerinden toplu konuşmadan metne kaydı yapar.

    - Varsayılan model: `gpt-4o-transcribe`
    - Uç nokta: OpenAI REST `/v1/audio/transcriptions`
    - Girdi yolu: çok parçalı ses dosyası yükleme
    - OpenClaw'da, gelen ses yazıya dökümü `tools.media.audio` kullanan her yerde desteklenir; buna Discord ses kanalı parçaları ve kanal ses ekleri dahildir

    Gelen ses yazıya dökümü için OpenAI'ı zorunlu kılmak üzere:

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

    Ortak ses medya yapılandırması veya çağrı başına yazıya dökme isteği tarafından sağlandığında dil ve istem ipuçları OpenAI'a iletilir.

  </Accordion>

  <Accordion title="Gerçek zamanlı yazıya dökme">
    Paketlenmiş `openai` plugin'i, Voice Call plugin'i için gerçek zamanlı yazıya dökme kaydı yapar.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dil | `...openai.language` | (ayarlanmamış) |
    | İstem | `...openai.prompt` | (ayarlanmamış) |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `800` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ses ile `wss://api.openai.com/v1/realtime` adresine bir WebSocket bağlantısı kullanır. Bu akış sağlayıcısı Voice Call'ın gerçek zamanlı yazıya dökme yolu içindir; Discord sesi şu anda kısa parçalar kaydeder ve bunun yerine toplu `tools.media.audio` yazıya dökme yolunu kullanır.
    </Note>

  </Accordion>

  <Accordion title="Gerçek zamanlı ses">
    Paketlenmiş `openai` plugin'i, Voice Call plugin'i için gerçek zamanlı ses kaydı yapar.

    | Ayar | Yapılandırma yolu | Varsayılan |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Ses | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD eşiği | `...openai.vadThreshold` | `0.5` |
    | Sessizlik süresi | `...openai.silenceDurationMs` | `500` |
    | API anahtarı | `...openai.apiKey` | `OPENAI_API_KEY` değerine geri döner |

    <Note>
    `azureEndpoint` ve `azureDeployment` yapılandırma anahtarları üzerinden Azure OpenAI'ı destekler. Çift yönlü araç çağrımını destekler. G.711 u-law ses biçimini kullanır.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI uç noktaları

Paketlenmiş `openai` sağlayıcısı, base URL'yi geçersiz kılarak görüntü oluşturma için bir Azure OpenAI kaynağını hedefleyebilir. Görüntü oluşturma yolunda OpenClaw, `models.providers.openai.baseUrl` üzerindeki Azure host adlarını algılar ve otomatik olarak Azure'un istek şekline geçer.

<Note>
Gerçek zamanlı ses ayrı bir yapılandırma yolu kullanır
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ve `models.providers.openai.baseUrl` değerinden etkilenmez. Azure
ayarları için [Ses ve konuşma](#voice-and-speech) altındaki **Gerçek zamanlı
ses** accordion'una bakın.
</Note>

Azure OpenAI'ı şu durumlarda kullanın:

- Zaten bir Azure OpenAI aboneliğiniz, kotanız veya kurumsal anlaşmanız varsa
- Azure'un sağladığı bölgesel veri yerleşimi veya uyumluluk denetimlerine ihtiyacınız varsa
- Trafiği mevcut bir Azure kiracılığı içinde tutmak istiyorsanız

### Yapılandırma

Paketlenmiş `openai` sağlayıcısı üzerinden Azure görüntü oluşturma için
`models.providers.openai.baseUrl` alanını Azure kaynağınıza yönlendirin ve
`apiKey` değerini Azure OpenAI anahtarı olarak ayarlayın (OpenAI Platform anahtarı değil):

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

OpenClaw, Azure görüntü oluşturma yolu için şu Azure host son eklerini tanır:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Tanınan bir Azure host üzerindeki görüntü oluşturma isteklerinde OpenClaw:

- `Authorization: Bearer` yerine `api-key` üst bilgisini gönderir
- Deployment kapsamlı yolları kullanır (`/openai/deployments/{deployment}/...`)
- Her isteğe `?api-version=...` ekler

Diğer base URL'ler (genel OpenAI, OpenAI uyumlu proxy'ler) standart
OpenAI görüntü istek şeklini korur.

<Note>
`openai` sağlayıcısının görüntü oluşturma yolu için Azure yönlendirmesi
OpenClaw 2026.4.22 veya daha yenisini gerektirir. Daha eski sürümler herhangi bir özel
`openai.baseUrl` değerini genel OpenAI uç noktası gibi ele alır ve Azure
görüntü deployment'larında başarısız olur.
</Note>

### API sürümü

Azure görüntü oluşturma yolu için belirli bir Azure önizleme veya GA sürümünü sabitlemek üzere `AZURE_OPENAI_API_VERSION` ayarlayın:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Değişken ayarlanmamışsa varsayılan `2024-12-01-preview` olur.

### Model adları deployment adlarıdır

Azure OpenAI, modelleri deployment'lara bağlar. Paketlenmiş `openai` sağlayıcısı üzerinden yönlendirilen Azure görüntü oluşturma isteklerinde OpenClaw içindeki `model` alanı, genel OpenAI model kimliği değil, Azure portalında yapılandırdığınız **Azure deployment adı** olmalıdır.

`gpt-image-2` sunan `gpt-image-2-prod` adlı bir deployment oluşturursanız:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Temiz bir poster" size=1024x1024 count=1
```

Aynı deployment adı kuralı, paketlenmiş `openai` sağlayıcısı üzerinden yönlendirilen görüntü oluşturma çağrıları için de geçerlidir.

### Bölgesel kullanılabilirlik

Azure görüntü oluşturma şu anda yalnızca bölgelerin bir alt kümesinde kullanılabilir
(örneğin `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Bir deployment oluşturmadan önce Microsoft'un güncel bölge listesini kontrol edin ve belirli modelin bölgenizde sunulduğunu doğrulayın.

### Parametre farkları

Azure OpenAI ve genel OpenAI her zaman aynı görüntü parametrelerini kabul etmez.
Azure, genel OpenAI'ın izin verdiği seçenekleri reddedebilir (örneğin
`gpt-image-2` üzerindeki belirli `background` değerleri) veya bunları yalnızca belirli model
sürümlerinde sunabilir. Bu farklılıklar OpenClaw'dan değil, Azure'dan ve temel modelden kaynaklanır. Bir Azure isteği doğrulama hatasıyla başarısız olursa, Azure portalında belirli deployment ve API sürümünüzün desteklediği parametre kümesini kontrol edin.

<Note>
Azure OpenAI yerel taşıma ve uyumluluk davranışını kullanır ancak
OpenClaw'ın gizli atıf üst bilgilerini almaz — [Gelişmiş yapılandırma](#advanced-configuration) altındaki **Yerel ve OpenAI uyumlu
yollar** accordion'una bakın.

Azure üzerindeki sohbet veya Responses trafiği için (görüntü oluşturmanın ötesinde),
onboarding akışını veya ayrılmış bir Azure sağlayıcı yapılandırmasını kullanın — yalnızca
`openai.baseUrl`, Azure API/kimlik doğrulama şeklini almaz. Ayrı bir
`azure-openai-responses/*` sağlayıcısı vardır; aşağıdaki
Sunucu tarafı Compaction accordion'una bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Taşıma (WebSocket ve SSE)">
    OpenClaw, hem `openai/*` hem de `openai-codex/*` için SSE geri dönüşlü (`"auto"`) WebSocket-first kullanır.

    `"auto"` modunda OpenClaw:
    - SSE'ye geri dönmeden önce bir erken WebSocket hatasını yeniden dener
    - Bir hatadan sonra WebSocket'i yaklaşık 60 saniye boyunca bozulmuş olarak işaretler ve bekleme süresinde SSE kullanır
    - Yeniden denemeler ve yeniden bağlantılar için kararlı oturum ve tur kimliği üst bilgileri ekler
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
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
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

  <Accordion title="WebSocket ön hazırlığı">
    OpenClaw, ilk tur gecikmesini azaltmak için `openai/*` ve `openai-codex/*` için varsayılan olarak WebSocket ön hazırlığını etkinleştirir.

    ```json5
    // Ön hazırlığı devre dışı bırak
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
    OpenClaw, `openai/*` ve `openai-codex/*` için paylaşılan bir hızlı mod anahtarı sunar:

    - **Chat/UI:** `/fast status|on|off`
    - **Yapılandırma:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Etkinleştirildiğinde OpenClaw, hızlı modu OpenAI öncelikli işleme (`service_tier = "priority"`) olarak eşler. Mevcut `service_tier` değerleri korunur ve hızlı mod `reasoning` veya `text.verbosity` değerlerini yeniden yazmaz.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Oturum geçersiz kılmaları yapılandırmaya üstün gelir. Sessions UI içinde oturum geçersiz kılmasını temizlemek, oturumu yapılandırılmış varsayılana geri döndürür.
    </Note>

  </Accordion>

  <Accordion title="Öncelikli işleme (`service_tier`)">
    OpenAI'ın API'si, `service_tier` aracılığıyla öncelikli işlemeyi sunar. OpenClaw'da model başına ayarlayın:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Desteklenen değerler: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` yalnızca yerel OpenAI uç noktalarına (`api.openai.com`) ve yerel Codex uç noktalarına (`chatgpt.com/backend-api`) iletilir. Her iki sağlayıcıyı da bir proxy üzerinden yönlendirirseniz OpenClaw `service_tier` değerine dokunmaz.
    </Warning>

  </Accordion>

  <Accordion title="Sunucu tarafı Compaction (Responses API)">
    Doğrudan OpenAI Responses modelleri (`api.openai.com` üzerindeki `openai/*`) için OpenAI plugin'inin Pi-harness akış sarmalayıcısı sunucu tarafı Compaction'ı otomatik etkinleştirir:

    - `store: true` zorlar (`supportsStore: false` ayarlayan model uyumluluğu yoksa)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` enjekte eder
    - Varsayılan `compact_threshold`: `contextWindow` değerinin %70'i (veya kullanılamadığında `80000`)

    Bu, yerleşik Pi harness yolu ve gömülü çalıştırmalar tarafından kullanılan OpenAI sağlayıcı hook'ları için geçerlidir. Yerel Codex app-server harness kendi bağlamını Codex üzerinden yönetir ve ayrı olarak `agents.defaults.embeddedHarness.runtime` ile yapılandırılır.

    <Tabs>
      <Tab title="Açıkça etkinleştir">
        Azure OpenAI Responses gibi uyumlu uç noktalar için kullanışlıdır:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
    `responsesServerCompaction` yalnızca `context_management` enjeksiyonunu denetler. Doğrudan OpenAI Responses modelleri, uyumluluk `supportsStore: false` ayarlamadığı sürece yine de `store: true` zorlar.
    </Note>

  </Accordion>

  <Accordion title="Sıkı agentic GPT modu">
    `openai/*` üzerindeki GPT-5 ailesi çalıştırmaları için OpenClaw daha sıkı bir gömülü yürütme sözleşmesi kullanabilir:

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
    - Araç eylemi kullanılabilirken artık yalnızca plan içeren bir turu başarılı ilerleme olarak kabul etmez
    - Turu hemen eyleme geç yönlendirmesiyle yeniden dener
    - Kapsamlı işler için `update_plan` özelliğini otomatik etkinleştirir
    - Model eyleme geçmeden planlamaya devam ederse açık bir engellenmiş durum gösterir

    <Note>
    Yalnızca OpenAI ve Codex GPT-5 ailesi çalıştırmaları için kapsamlıdır. Diğer sağlayıcılar ve eski model aileleri varsayılan davranışı korur.
    </Note>

  </Accordion>

  <Accordion title="Yerel ve OpenAI uyumlu yollar">
    OpenClaw; doğrudan OpenAI, Codex ve Azure OpenAI uç noktalarını genel OpenAI uyumlu `/v1` proxy'lerinden farklı ele alır:

    **Yerel yollar** (`openai/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` değerini yalnızca OpenAI `none` effort desteği olan modeller için korur
    - `reasoning.effort: "none"` değerini reddeden modeller veya proxy'ler için devre dışı reasoning bilgisini atlar
    - Araç şemalarını varsayılan olarak strict moduna alır
    - Gizli atıf üst bilgilerini yalnızca doğrulanmış yerel host'lara ekler
    - OpenAI'ya özgü istek şekillendirmeyi korur (`service_tier`, `store`, reasoning uyumluluğu, istem önbelleği ipuçları)

    **Proxy/uyumlu yollar:**
    - Daha gevşek uyumluluk davranışı kullanır
    - Yerel olmayan `openai-completions` yüklerinden Completions `store` alanını çıkarır
    - OpenAI uyumlu Completions proxy'leri için gelişmiş `params.extra_body`/`params.extraBody` JSON geçişini kabul eder
    - Strict araç şemalarını veya yalnızca yerel üst bilgileri zorlamaz

    Azure OpenAI yerel taşıma ve uyumluluk davranışını kullanır ancak gizli atıf üst bilgilerini almaz.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Image generation" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="OAuth and auth" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
