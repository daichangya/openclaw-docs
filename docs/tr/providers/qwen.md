---
read_when:
    - OpenClaw ile Qwen kullanmak istiyorsunuz
    - Daha önce Qwen OAuth kullandınız
summary: OpenClaw'ın paketlenmiş qwen sağlayıcısı üzerinden Qwen Cloud kullanın
title: Qwen
x-i18n:
    generated_at: "2026-04-23T09:09:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth kaldırıldı.** `portal.qwen.ai` uç noktalarını kullanan ücretsiz katman OAuth entegrasyonu
(`qwen-portal`) artık mevcut değil.
Arka plan için [Issue #49557](https://github.com/openclaw/openclaw/issues/49557)
sayfasına bakın.

</Warning>

OpenClaw artık Qwen'i kanonik kimliği
`qwen` olan birinci sınıf paketlenmiş bir sağlayıcı olarak ele alır. Paketlenmiş sağlayıcı Qwen Cloud / Alibaba DashScope ve
Coding Plan uç noktalarını hedefler ve eski `modelstudio` kimliklerini
uyumluluk takma adı olarak çalışır durumda tutar.

- Sağlayıcı: `qwen`
- Tercih edilen env değişkeni: `QWEN_API_KEY`
- Uyumluluk için ayrıca kabul edilir: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API tarzı: OpenAI uyumlu

<Tip>
`qwen3.6-plus` istiyorsanız **Standard (pay-as-you-go)** uç noktasını tercih edin.
Coding Plan desteği genel kataloğun gerisinde kalabilir.
</Tip>

## Başlarken

Plan türünüzü seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="Coding Plan (abonelik)">
    **En iyisi:** Qwen Coding Plan üzerinden abonelik tabanlı erişim için.

    <Steps>
      <Step title="API anahtarınızı alın">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) sayfasından bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding çalıştırın">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **China** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model başvuruları
    uyumluluk takma adları olarak hâlâ çalışır, ancak yeni kurulum akışları kanonik
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model başvurularını tercih etmelidir.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **En iyisi:** `qwen3.6-plus` gibi Coding Plan üzerinde bulunmayabilecek modeller dahil, Standard Model Studio uç noktası üzerinden pay-as-you-go erişimi için.

    <Steps>
      <Step title="API anahtarınızı alın">
        [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) sayfasından bir API anahtarı oluşturun veya kopyalayın.
      </Step>
      <Step title="Onboarding çalıştırın">
        **Global** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **China** uç nokta için:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Varsayılan model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Eski `modelstudio-*` auth-choice kimlikleri ve `modelstudio/...` model başvuruları
    uyumluluk takma adları olarak hâlâ çalışır, ancak yeni kurulum akışları kanonik
    `qwen-*` auth-choice kimliklerini ve `qwen/...` model başvurularını tercih etmelidir.
    </Note>

  </Tab>
</Tabs>

## Plan türleri ve uç noktalar

| Plan                       | Bölge | Auth choice                | Uç nokta                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonelik) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonelik) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Sağlayıcı, auth choice'a göre uç noktayı otomatik seçer. Kanonik
seçimler `qwen-*` ailesini kullanır; `modelstudio-*` yalnızca uyumluluk içindir.
Config içinde özel bir `baseUrl` ile geçersiz kılabilirsiniz.

<Tip>
**Anahtarları yönetin:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Belgeler:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Yerleşik katalog

OpenClaw şu anda bu paketlenmiş Qwen kataloğunu gönderir. Yapılandırılmış katalog
uç nokta farkındalıklıdır: Coding Plan config'leri yalnızca
Standard uç noktada çalıştığı bilinen modelleri çıkarır.

| Model başvurusu                   | Girdi       | Bağlam   | Notlar                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Varsayılan model                                      |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Bu modele ihtiyacınız varsa Standard uç noktaları tercih edin |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Qwen Max hattı                                      |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Kodlama                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Kodlama                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Reasoning etkin                                  |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Alibaba üzerinden Moonshot AI                            |

<Note>
Bir model paketlenmiş katalogda bulunsa bile kullanılabilirlik uç noktaya ve faturalandırma planına göre yine değişebilir.
</Note>

## Multimodal eklentiler

`qwen` Plugin'i ayrıca **Standard**
DashScope uç noktalarında (Coding Plan uç noktalarında değil) multimodal yetenekler de sunar:

- `qwen-vl-max-latest` üzerinden **Video understanding**
- `wan2.6-t2v` (varsayılan), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v` üzerinden **Wan video generation**

Qwen'i varsayılan video sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Paylaşılan tool parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Generation](/tr/tools/video-generation) sayfasına bakın.
</Note>

## Gelişmiş

<AccordionGroup>
  <Accordion title="Görsel ve video anlama">
    Paketlenmiş Qwen Plugin'i, **Standard** DashScope uç noktalarında
    (Coding Plan uç noktalarında değil) görseller ve video için medya anlama kaydeder.

    | Özellik      | Değer                 |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Desteklenen girdi | Görseller, video       |

    Medya anlama yapılandırılmış Qwen auth'tan otomatik çözülür — ek
    config gerekmez. Medya anlama desteği için Standard (pay-as-you-go)
    uç nokta kullandığınızdan emin olun.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus kullanılabilirliği">
    `qwen3.6-plus`, Standard (pay-as-you-go) Model Studio
    uç noktalarında kullanılabilir:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Coding Plan uç noktaları `qwen3.6-plus` için
    "unsupported model" hatası döndürüyorsa Coding Plan
    uç nokta/anahtar çifti yerine Standard (pay-as-you-go) kullanın.

  </Accordion>

  <Accordion title="Yetenek planı">
    `qwen` Plugin'i, yalnızca coding/text modelleri için değil,
    tam Qwen Cloud yüzeyi için satıcı evi olarak konumlandırılıyor.

    - **Text/chat modelleri:** şimdi paketlenmiş
    - **Tool calling, structured output, thinking:** OpenAI uyumlu taşıma katmanından devralınır
    - **Image generation:** sağlayıcı-Plugin katmanında planlanıyor
    - **Image/video understanding:** şimdi Standard uç noktada paketlenmiş
    - **Speech/audio:** sağlayıcı-Plugin katmanında planlanıyor
    - **Memory embeddings/reranking:** embedding adapter yüzeyi üzerinden planlanıyor
    - **Video generation:** şimdi paylaşılan video-generation yeteneği üzerinden paketlenmiş

  </Accordion>

  <Accordion title="Video generation ayrıntıları">
    Video generation için OpenClaw işi göndermeden önce yapılandırılmış Qwen bölgesini eşleşen
    DashScope AIGC ana makinesine eşler:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Bu, Coding Plan veya Standard Qwen ana makinelerinden birine işaret eden normal bir
    `models.providers.qwen.baseUrl` kullanmanın video generation'ı doğru
    bölgesel DashScope video uç noktasında tuttuğu anlamına gelir.

    Geçerli paketlenmiş Qwen video-generation sınırları:

    - İstek başına en çok **1** çıktı videosu
    - En çok **1** girdi görseli
    - En çok **4** girdi videosu
    - En çok **10 saniye** süre
    - `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` destekler
    - Referans görsel/video modu şu anda **uzak http(s) URL'leri** gerektirir. DashScope video uç noktası bu referanslar için yüklenmiş yerel buffer'ları
      kabul etmediği için yerel dosya yolları baştan reddedilir.

  </Accordion>

  <Accordion title="Streaming usage uyumluluğu">
    Yerel Model Studio uç noktaları, paylaşılan
    `openai-completions` taşıma katmanında streaming usage uyumluluğu bildirir. OpenClaw artık bunu uç nokta
    yeteneklerinden anahtarlıyor; böylece aynı yerel ana makineleri hedefleyen DashScope uyumlu özel sağlayıcı kimlikleri,
    özellikle yerleşik `qwen` sağlayıcı kimliğini gerektirmek yerine aynı streaming-usage davranışını devralır.

    Yerel-streaming usage uyumluluğu hem Coding Plan ana makineleri hem de
    Standard DashScope uyumlu ana makineler için geçerlidir:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Multimodal uç nokta bölgeleri">
    Multimodal yüzeyler (video understanding ve Wan video generation)
    Coding Plan uç noktalarını değil, **Standard** DashScope uç noktalarını kullanır:

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `QWEN_API_KEY`
    değerinin o sürece kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video tool parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/tr/providers/alibaba" icon="cloud">
    Eski ModelStudio sağlayıcısı ve geçiş notları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
