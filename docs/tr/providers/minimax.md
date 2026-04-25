---
read_when:
    - OpenClaw içinde MiniMax modellerini istiyorsunuz
    - MiniMax kurulum rehberine ihtiyacınız var
summary: OpenClaw içinde MiniMax modellerini kullanın
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:56:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

OpenClaw'ın MiniMax provider'ı varsayılan olarak **MiniMax M2.7** kullanır.

MiniMax ayrıca şunları da sağlar:

- T2A v2 üzerinden bundled konuşma sentezi
- `MiniMax-VL-01` üzerinden bundled görsel anlama
- `music-2.6` üzerinden bundled müzik üretimi
- MiniMax Coding Plan arama API'si üzerinden bundled `web_search`

Provider ayrımı:

| Provider ID      | Kimlik doğrulama | Yetenekler                                                     |
| ---------------- | ---------------- | -------------------------------------------------------------- |
| `minimax`        | API anahtarı     | Metin, görsel üretimi, görsel anlama, konuşma, web arama       |
| `minimax-portal` | OAuth            | Metin, görsel üretimi, görsel anlama, konuşma                  |

## Yerleşik katalog

| Model                    | Tür              | Açıklama                                  |
| ------------------------ | ---------------- | ----------------------------------------- |
| `MiniMax-M2.7`           | Sohbet (akıl yürütme) | Varsayılan barındırılan akıl yürütme modeli |
| `MiniMax-M2.7-highspeed` | Sohbet (akıl yürütme) | Daha hızlı M2.7 akıl yürütme katmanı        |
| `MiniMax-VL-01`          | Vision           | Görsel anlama modeli                      |
| `image-01`               | Görsel üretimi   | Metinden görsele ve görselden görsele düzenleme |
| `music-2.6`              | Müzik üretimi    | Varsayılan müzik modeli                   |
| `music-2.5`              | Müzik üretimi    | Önceki müzik üretim katmanı               |
| `music-2.0`              | Müzik üretimi    | Eski müzik üretim katmanı                 |
| `MiniMax-Hailuo-2.3`     | Video üretimi    | Metinden videoya ve görsel referans akışları |

## Başlangıç

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Şunun için en iyisi:** OAuth üzerinden MiniMax Coding Plan ile hızlı kurulum; API anahtarı gerekmez.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="Onboarding'i çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Bu, `api.minimax.io` üzerinden kimlik doğrular.
          </Step>
          <Step title="Modelin kullanılabildiğini doğrulayın">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Çin">
        <Steps>
          <Step title="Onboarding'i çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Bu, `api.minimaxi.com` üzerinden kimlik doğrular.
          </Step>
          <Step title="Modelin kullanılabildiğini doğrulayın">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth kurulumları `minimax-portal` provider kimliğini kullanır. Model ref'leri `minimax-portal/MiniMax-M2.7` biçimini izler.
    </Note>

    <Tip>
    MiniMax Coding Plan için yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API anahtarı">
    **Şunun için en iyisi:** Anthropic uyumlu API ile barındırılan MiniMax.

    <Tabs>
      <Tab title="Uluslararası">
        <Steps>
          <Step title="Onboarding'i çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Bu, temel URL olarak `api.minimax.io` yapılandırır.
          </Step>
          <Step title="Modelin kullanılabildiğini doğrulayın">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Çin">
        <Steps>
          <Step title="Onboarding'i çalıştırın">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Bu, temel URL olarak `api.minimaxi.com` yapılandırır.
          </Step>
          <Step title="Modelin kullanılabildiğini doğrulayın">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Config örneği

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Anthropic uyumlu streaming yolunda OpenClaw, `thinking` değerini siz açıkça ayarlamadıkça MiniMax thinking özelliğini varsayılan olarak devre dışı bırakır. MiniMax'in streaming endpoint'i, yerel Anthropic thinking blokları yerine OpenAI tarzı delta parçaları içinde `reasoning_content` yayar; bu da açıkça etkin bırakıldığında iç akıl yürütmenin görünür çıktıya sızmasına neden olabilir.
    </Warning>

    <Note>
    API anahtarı kurulumları `minimax` provider kimliğini kullanır. Model ref'leri `minimax/MiniMax-M2.7` biçimini izler.
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` ile yapılandırma

JSON düzenlemeden MiniMax ayarlamak için etkileşimli config sihirbazını kullanın:

<Steps>
  <Step title="Sihirbazı başlatın">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth seçin">
    Menüden **Model/auth** seçeneğini seçin.
  </Step>
  <Step title="Bir MiniMax kimlik doğrulama seçeneği seçin">
    Kullanılabilir MiniMax seçeneklerinden birini seçin:

    | Auth choice | Açıklama |
    | --- | --- |
    | `minimax-global-oauth` | Uluslararası OAuth (Coding Plan) |
    | `minimax-cn-oauth` | Çin OAuth (Coding Plan) |
    | `minimax-global-api` | Uluslararası API anahtarı |
    | `minimax-cn-api` | Çin API anahtarı |

  </Step>
  <Step title="Varsayılan modelinizi seçin">
    İstendiğinde varsayılan modelinizi seçin.
  </Step>
</Steps>

## Yetenekler

### Görsel üretimi

MiniMax Plugin'i, `image_generate` aracı için `image-01` modelini kaydeder. Şunları destekler:

- En-boy oranı kontrolü ile **metinden görsele üretim**
- En-boy oranı kontrolü ile **görselden görsele düzenleme** (özne referansı)
- İstek başına en fazla **9 çıktı görseli**
- Düzenleme isteği başına en fazla **1 referans görsel**
- Desteklenen en-boy oranları: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

MiniMax'i görsel üretimi için kullanmak üzere, onu görsel üretimi provider'ı olarak ayarlayın:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin, metin modelleriyle aynı `MINIMAX_API_KEY` veya OAuth kimlik doğrulamasını kullanır. MiniMax zaten kurulmuşsa ek yapılandırma gerekmez.

Hem `minimax` hem de `minimax-portal`, aynı
`image-01` modeliyle `image_generate` kaydeder. API anahtarı kurulumları `MINIMAX_API_KEY` kullanır; OAuth kurulumları bunun yerine
bundled `minimax-portal` kimlik doğrulama yolunu kullanabilir.

Onboarding veya API anahtarı kurulumu açık `models.providers.minimax`
girdileri yazdığında, OpenClaw `MiniMax-M2.7` ve
`MiniMax-M2.7-highspeed` modellerini yalnızca metin tabanlı sohbet modelleri olarak somutlaştırır. Görsel anlama, Plugin'e ait `MiniMax-VL-01` medya provider'ı üzerinden ayrı olarak sunulur.

<Note>
Paylaşılan araç parametreleri, provider seçimi ve failover davranışı için [Görsel Üretimi](/tr/tools/image-generation) bölümüne bakın.
</Note>

### Metinden konuşmaya

Bundled `minimax` Plugin'i, `messages.tts` için bir konuşma provider'ı olarak MiniMax T2A v2'yi kaydeder.

- Varsayılan TTS modeli: `speech-2.8-hd`
- Varsayılan ses: `English_expressive_narrator`
- Desteklenen bundled model kimlikleri arasında `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` ve `speech-01-turbo` bulunur.
- Kimlik doğrulama çözümleme sırası `messages.tts.providers.minimax.apiKey`, sonra
  `minimax-portal` OAuth/token auth profilleri, sonra Token Plan ortam
  anahtarları (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), sonra `MINIMAX_API_KEY` şeklindedir.
- TTS host'u yapılandırılmamışsa OpenClaw, yapılandırılmış
  `minimax-portal` OAuth host'unu yeniden kullanır ve `/anthropic` gibi
  Anthropic uyumlu yol soneklerini kaldırır.
- Normal ses ekleri MP3 olarak kalır.
- Feishu ve Telegram gibi sesli not hedefleri, MiniMax
  MP3'ünden `ffmpeg` ile 48kHz Opus'a dönüştürülür, çünkü Feishu/Lark dosya API'si yerel ses mesajları için yalnızca
  `file_type: "opus"` kabul eder.
- MiniMax T2A kesirli `speed` ve `vol` kabul eder, ancak `pitch`
  tam sayı olarak gönderilir; OpenClaw API isteğinden önce kesirli `pitch` değerlerini keser.

| Ayar                                     | Env var                | Varsayılan                    | Açıklama                          |
| ---------------------------------------- | ---------------------- | ----------------------------- | --------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API host'u.           |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model kimliği.                |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Konuşma çıktısı için kullanılan ses kimliği. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Oynatma hızı, `0.5..2.0`.         |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Ses seviyesi, `(0, 10]`.          |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Tam sayı pitch kaydırması, `-12..12`. |

### Müzik üretimi

Bundled `minimax` Plugin'i ayrıca paylaşılan
`music_generate` aracı üzerinden müzik üretimini de kaydeder.

- Varsayılan müzik modeli: `minimax/music-2.6`
- Ayrıca `minimax/music-2.5` ve `minimax/music-2.0` desteklenir
- İstem denetimleri: `lyrics`, `instrumental`, `durationSeconds`
- Çıktı biçimi: `mp3`
- Session destekli çalıştırmalar, `action: "status"` dahil olmak üzere paylaşılan görev/durum akışı üzerinden ayrıştırılır

MiniMax'i varsayılan müzik provider'ı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, provider seçimi ve failover davranışı için [Müzik Üretimi](/tr/tools/music-generation) bölümüne bakın.
</Note>

### Video üretimi

Bundled `minimax` Plugin'i ayrıca paylaşılan
`video_generate` aracı üzerinden video üretimini de kaydeder.

- Varsayılan video modeli: `minimax/MiniMax-Hailuo-2.3`
- Modlar: metinden videoya ve tek görsel referans akışları
- `aspectRatio` ve `resolution` destekler

MiniMax'i varsayılan video provider'ı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, provider seçimi ve failover davranışı için [Video Üretimi](/tr/tools/video-generation) bölümüne bakın.
</Note>

### Görsel anlama

MiniMax Plugin'i, görsel anlamayı metin
kataloğundan ayrı olarak kaydeder:

| Provider ID      | Varsayılan görsel modeli |
| ---------------- | ------------------------ |
| `minimax`        | `MiniMax-VL-01`          |
| `minimax-portal` | `MiniMax-VL-01`          |

Bu nedenle, bundled metin-provider kataloğu hâlâ yalnızca metin tabanlı M2.7 sohbet ref'lerini gösterse bile otomatik medya yönlendirmesi MiniMax görsel anlamayı kullanabilir.

### Web arama

MiniMax Plugin'i ayrıca MiniMax Coding Plan
arama API'si üzerinden `web_search` kaydeder.

- Provider kimliği: `minimax`
- Yapılandırılmış sonuçlar: başlıklar, URL'ler, snippet'ler, ilgili sorgular
- Tercih edilen env var: `MINIMAX_CODE_PLAN_KEY`
- Kabul edilen env takma adı: `MINIMAX_CODING_API_KEY`
- Uyumluluk fallback'i: zaten coding-plan token'ına işaret ettiğinde `MINIMAX_API_KEY`
- Bölge yeniden kullanımı: `plugins.entries.minimax.config.webSearch.region`, sonra `MINIMAX_API_HOST`, sonra MiniMax provider temel URL'leri
- Arama provider kimliği `minimax` üzerinde kalır; OAuth CN/global kurulum yine de bölgeyi dolaylı olarak `models.providers.minimax-portal.baseUrl` üzerinden yönlendirebilir

Config, `plugins.entries.minimax.config.webSearch.*` altında bulunur.

<Note>
Tam web arama yapılandırması ve kullanımı için [MiniMax Search](/tr/tools/minimax-search) bölümüne bakın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Yapılandırma seçenekleri">
    | Seçenek | Açıklama |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` tercih edilir (Anthropic uyumlu); OpenAI uyumlu payload'lar için `https://api.minimax.io/v1` isteğe bağlıdır |
    | `models.providers.minimax.api` | `anthropic-messages` tercih edilir; OpenAI uyumlu payload'lar için `openai-completions` isteğe bağlıdır |
    | `models.providers.minimax.apiKey` | MiniMax API anahtarı (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` tanımlayın |
    | `agents.defaults.models` | Allowlist'te istediğiniz modellere takma ad verin |
    | `models.mode` | Yerleşik modellerin yanına MiniMax eklemek istiyorsanız `merge` olarak bırakın |
  </Accordion>

  <Accordion title="Thinking varsayılanları">
    `api: "anthropic-messages"` üzerinde, params/config içinde thinking zaten açıkça ayarlanmamışsa OpenClaw `thinking: { type: "disabled" }` ekler.

    Bu, MiniMax'in streaming endpoint'inin OpenAI tarzı delta parçaları içinde `reasoning_content` yaymasını önler; aksi takdirde iç akıl yürütme görünür çıktıya sızar.

  </Accordion>

  <Accordion title="Hızlı mod">
    Anthropic uyumlu akış yolunda `/fast on` veya `params.fastMode: true`, `MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
  </Accordion>

  <Accordion title="Fallback örneği">
    **Şunun için en iyisi:** en güçlü en yeni nesil modelinizi birincil olarak tutup, MiniMax M2.7'ye fallback yapmak. Aşağıdaki örnek somut bir birincil model olarak Opus kullanır; bunu tercih ettiğiniz en yeni nesil birincil modelle değiştirin.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan kullanım ayrıntıları">
    - Coding Plan kullanım API'si: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (bir coding plan anahtarı gerektirir).
    - OpenClaw, MiniMax coding-plan kullanımını diğer provider'larda kullanılan aynı `% kaldı` görünümüne normalize eder. MiniMax'in ham `usage_percent` / `usagePercent` alanları tüketilen kotayı değil, kalan kotayı ifade eder; bu nedenle OpenClaw bunları tersine çevirir. Sayı tabanlı alanlar mevcutsa önceliklidir.
    - API `model_remains` döndürdüğünde OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini `start_time` / `end_time` üzerinden türetir ve coding-plan pencerelerinin daha kolay ayırt edilebilmesi için seçilen model adını plan etiketine ekler.
    - Kullanım anlık görüntüleri `minimax`, `minimax-cn` ve `minimax-portal` değerlerini aynı MiniMax kota yüzeyi olarak ele alır ve Coding Plan anahtarı env var'larına geri dönmeden önce kaydedilmiş MiniMax OAuth'u tercih eder.
  </Accordion>
</AccordionGroup>

## Notlar

- Model ref'leri kimlik doğrulama yolunu izler:
  - API anahtarı kurulumu: `minimax/<model>`
  - OAuth kurulumu: `minimax-portal/<model>`
- Varsayılan sohbet modeli: `MiniMax-M2.7`
- Alternatif sohbet modeli: `MiniMax-M2.7-highspeed`
- Onboarding ve doğrudan API anahtarı kurulumu, her iki M2.7 varyantı için de yalnızca metin tabanlı model tanımları yazar
- Görsel anlama, Plugin'e ait `MiniMax-VL-01` medya provider'ını kullanır
- Tam maliyet takibi gerekiyorsa `models.json` içindeki fiyat değerlerini güncelleyin
- Geçerli provider kimliğini doğrulamak için `openclaw models list` kullanın, ardından `openclaw models set minimax/MiniMax-M2.7` veya `openclaw models set minimax-portal/MiniMax-M2.7` ile değiştirin

<Tip>
MiniMax Coding Plan için yönlendirme bağlantısı (%10 indirim): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Provider kuralları için [Model provider'ları](/tr/concepts/model-providers) bölümüne bakın.
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Bu genellikle **MiniMax provider'ının yapılandırılmadığı** anlamına gelir (eşleşen bir provider girdisi yoktur ve MiniMax auth profili/env anahtarı bulunamaz). Bu algılama için bir düzeltme **2026.1.12** sürümündedir. Şu yollarla düzeltebilirsiniz:

    - **2026.1.12** sürümüne yükseltin (veya kaynak koddan `main` çalıştırın), sonra Gateway'i yeniden başlatın.
    - `openclaw configure` çalıştırıp bir **MiniMax** auth seçeneği seçin veya
    - Eşleşen `models.providers.minimax` ya da `models.providers.minimax-portal` bloğunu elle ekleyin veya
    - Eşleşen provider'ın eklenebilmesi için `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ya da bir MiniMax auth profili ayarlayın.

    Model kimliğinin **büyük/küçük harfe duyarlı** olduğundan emin olun:

    - API anahtarı yolu: `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`
    - OAuth yolu: `minimax-portal/MiniMax-M2.7` veya `minimax-portal/MiniMax-M2.7-highspeed`

    Ardından şununla yeniden kontrol edin:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun Giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Provider seçme, model ref'leri ve failover davranışı.
  </Card>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve provider seçimi.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve provider seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve provider seçimi.
  </Card>
  <Card title="MiniMax Search" href="/tr/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan üzerinden web arama yapılandırması.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Genel sorun giderme ve SSS.
  </Card>
</CardGroup>
