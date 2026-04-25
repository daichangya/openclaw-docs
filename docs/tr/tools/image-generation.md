---
read_when:
    - Ajan aracılığıyla görsel üretme
    - Görsel üretim sağlayıcılarını ve modellerini yapılandırma
    - image_generate araç parametrelerini anlama
summary: Yapılandırılmış sağlayıcıları kullanarak görseller oluşturun ve düzenleyin (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Görsel üretimi
x-i18n:
    generated_at: "2026-04-25T13:58:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` aracı, ajanın yapılandırılmış sağlayıcılarınızı kullanarak görseller oluşturmasına ve düzenlemesine izin verir. Oluşturulan görseller, ajanın yanıtında medya eki olarak otomatik şekilde teslim edilir.

<Note>
Bu araç yalnızca en az bir görsel üretim sağlayıcısı kullanılabilir olduğunda görünür. Ajanınızın araçlarında `image_generate` görünmüyorsa `agents.defaults.imageGenerationModel` yapılandırın, bir sağlayıcı API anahtarı ayarlayın veya OpenAI Codex OAuth ile oturum açın.
</Note>

## Hızlı başlangıç

1. En az bir sağlayıcı için bir API anahtarı ayarlayın (örneğin `OPENAI_API_KEY`, `GEMINI_API_KEY` veya `OPENROUTER_API_KEY`) ya da OpenAI Codex OAuth ile oturum açın.
2. İsteğe bağlı olarak tercih ettiğiniz modeli ayarlayın:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth aynı `openai/gpt-image-2` model başvurusunu kullanır. Bir
`openai-codex` OAuth profili yapılandırıldığında OpenClaw görsel isteklerini
önce `OPENAI_API_KEY` denemek yerine aynı OAuth profili üzerinden yönlendirir.
API anahtarı veya özel/Azure base URL gibi açık özel `models.providers.openai`
görsel yapılandırmaları yeniden doğrudan OpenAI Images API yoluna katılım sağlar.
LocalAI gibi OpenAI uyumlu LAN uç noktaları için özel
`models.providers.openai.baseUrl` değerini koruyun ve
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ile açıkça katılım sağlayın; özel/dahili
görsel uç noktaları varsayılan olarak engellenmiş kalır.

3. Ajana şunu söyleyin: _"Dost canlısı bir robot maskotunun görselini üret."_

Ajan `image_generate` aracını otomatik olarak çağırır. Araç izin listesi gerekmez — sağlayıcı mevcut olduğunda varsayılan olarak etkindir.

## Yaygın yollar

| Amaç                                                  | Model başvurusu                                   | Kimlik doğrulama                    |
| ----------------------------------------------------- | ------------------------------------------------- | ----------------------------------- |
| API faturalandırmasıyla OpenAI görsel üretimi         | `openai/gpt-image-2`                              | `OPENAI_API_KEY`                    |
| Codex abonelik kimlik doğrulamasıyla OpenAI görsel üretimi | `openai/gpt-image-2`                          | OpenAI Codex OAuth                  |
| OpenRouter görsel üretimi                             | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`              |
| Google Gemini görsel üretimi                          | `google/gemini-3.1-flash-image-preview`           | `GEMINI_API_KEY` veya `GOOGLE_API_KEY` |

Aynı `image_generate` aracı hem metinden görsele hem de referans görsel
düzenlemeye hizmet eder. Tek bir referans için `image`, birden fazla referans için
`images` kullanın. `quality`, `outputFormat` ve
OpenAI'ye özgü `background` gibi sağlayıcı destekli çıktı ipuçları, mevcut olduğunda iletilir ve
bir sağlayıcı bunları desteklemediğinde yok sayıldı olarak raporlanır.

## Desteklenen sağlayıcılar

| Sağlayıcı  | Varsayılan model                         | Düzenleme desteği                  | Kimlik doğrulama                                      |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | Evet (en fazla 4 görsel)           | `OPENAI_API_KEY` veya OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Evet (en fazla 5 giriş görseli)    | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`        | Evet                               | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                |
| fal        | `fal-ai/flux/dev`                       | Evet                               | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | Evet (özne referansı)              | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | Evet (1 görsel, iş akışı yapılandırmalı) | bulut için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| Vydra      | `grok-imagine`                          | Hayır                              | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Evet (en fazla 5 görsel)           | `XAI_API_KEY`                                         |

Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```
/tool image_generate action=list
```

## Araç parametreleri

<ParamField path="prompt" type="string" required>
Görsel üretim istemi. `action: "generate"` için gereklidir.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `"list"` kullanın.
</ParamField>

<ParamField path="model" type="string">
Sağlayıcı/model geçersiz kılması, örneğin `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Düzenleme modu için tek referans görsel yolu veya URL'si.
</ParamField>

<ParamField path="images" type="string[]">
Düzenleme modu için birden fazla referans görsel (en fazla 5).
</ParamField>

<ParamField path="size" type="string">
Boyut ipucu: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
En-boy oranı: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Çözünürlük ipucu.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Sağlayıcı bunu desteklediğinde kalite ipucu.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Sağlayıcı bunu desteklediğinde çıktı biçimi ipucu.
</ParamField>

<ParamField path="count" type="number">
Üretilecek görsel sayısı (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı.
</ParamField>

<ParamField path="filename" type="string">
Çıktı dosya adı ipucu.
</ParamField>

<ParamField path="openai" type="object">
Yalnızca OpenAI ipuçları: `background`, `moderation`, `outputCompression` ve `user`.
</ParamField>

Tüm sağlayıcılar tüm parametreleri desteklemez. Bir geri dönüş sağlayıcısı tam istenen geometri yerine yakın bir geometri seçeneğini desteklediğinde OpenClaw, gönderimden önce en yakın desteklenen boyut, en-boy oranı veya çözünürlüğe yeniden eşler. `quality` veya `outputFormat` gibi desteklenmeyen çıktı ipuçları, bunları desteklediğini bildirmeyen sağlayıcılar için düşürülür ve araç sonucunda raporlanır.

Araç sonuçları uygulanan ayarları raporlar. OpenClaw sağlayıcı geri dönüşü sırasında geometriyi yeniden eşlediğinde döndürülen `size`, `aspectRatio` ve `resolution` değerleri gerçekten gönderileni yansıtır ve `details.normalization` istekten uygulanan ayara çeviriyi yakalar.

## Yapılandırma

### Model seçimi

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Sağlayıcı seçim sırası

Bir görsel üretilirken OpenClaw sağlayıcıları şu sırayla dener:

1. Araç çağrısından gelen **`model` parametresi** (ajan bir tane belirtirse)
2. Yapılandırmadaki **`imageGenerationModel.primary`**
3. Sırasıyla **`imageGenerationModel.fallbacks`**
4. **Otomatik algılama** — yalnızca auth destekli sağlayıcı varsayılanlarını kullanır:
   - önce mevcut varsayılan sağlayıcı
   - sonra kalan kayıtlı görsel üretim sağlayıcıları sağlayıcı kimliği sırasıyla

Bir sağlayıcı başarısız olursa (auth hatası, hız sınırı vb.), sonraki yapılandırılmış aday otomatik olarak denenir. Hepsi başarısız olursa hata her denemeden ayrıntılar içerir.

Notlar:

- Çağrı başına `model` geçersiz kılması kesindir: OpenClaw yalnızca o sağlayıcı/modeli dener
  ve yapılandırılmış birincil/geri dönüş veya otomatik algılanan
  sağlayıcılara devam etmez.
- Otomatik algılama auth farkındalıklıdır. Bir sağlayıcı varsayılanı, aday listesine yalnızca
  OpenClaw bu sağlayıcı için gerçekten kimlik doğrulaması yapabildiğinde girer.
- Otomatik algılama varsayılan olarak etkindir. Görsel
  üretimin yalnızca açık `model`, `primary` ve `fallbacks`
  girdilerini kullanmasını istiyorsanız `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.
- O anda kayıtlı sağlayıcıları,
  varsayılan modellerini ve auth env-var ipuçlarını incelemek için `action: "list"` kullanın.

### Görsel düzenleme

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI ve xAI referans görselleri düzenlemeyi destekler. Bir referans görsel yolu veya URL'si verin:

```
"Bu fotoğrafın suluboya sürümünü üret" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google ve xAI, `images` parametresi aracılığıyla en fazla 5 referans görseli destekler. fal, MiniMax ve ComfyUI 1 görsel destekler.

### OpenRouter görsel modelleri

OpenRouter görsel üretimi aynı `OPENROUTER_API_KEY` değerini kullanır ve OpenRouter'ın sohbet tamamlama görsel API'si üzerinden yönlendirilir. OpenRouter görsel modellerini `openrouter/` önekiyle seçin:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw `prompt`, `count`, referans görseller ve Gemini uyumlu `aspectRatio` / `resolution` ipuçlarını OpenRouter'a iletir. Mevcut yerleşik OpenRouter görsel model kısayolları arasında `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` ve `openai/gpt-5.4-image-2` bulunur; yapılandırdığınız Plugin'in neyi açığa çıkardığını görmek için `action: "list"` kullanın.

### OpenAI `gpt-image-2`

OpenAI görsel üretimi varsayılan olarak `openai/gpt-image-2` kullanır. Bir
`openai-codex` OAuth profili yapılandırılmışsa OpenClaw, Codex abonelik sohbet modelleri tarafından kullanılan aynı OAuth
profilini yeniden kullanır ve görsel isteğini
Codex Responses arka ucu üzerinden gönderir. `https://chatgpt.com/backend-api` gibi
eski Codex base URL'leri, görsel istekleri için
`https://chatgpt.com/backend-api/codex` biçimine kanonikleştirilir. Bu istek için
sessizce `OPENAI_API_KEY` değerine geri düşmez. Doğrudan OpenAI
Images API yönlendirmesini zorlamak için `models.providers.openai` değerini açıkça bir API
anahtarı, özel base URL veya Azure uç noktasıyla yapılandırın. Eski
`openai/gpt-image-1` modeli hâlâ açıkça seçilebilir, ancak yeni OpenAI
görsel üretim ve görsel düzenleme istekleri `gpt-image-2` kullanmalıdır.

`gpt-image-2`, aynı `image_generate` aracı üzerinden hem metinden görsel
üretimi hem de referans görsel düzenlemeyi destekler. OpenClaw `prompt`,
`count`, `size`, `quality`, `outputFormat` ve referans görselleri OpenAI'a iletir.
OpenAI `aspectRatio` veya `resolution` değerlerini doğrudan almaz; mümkün olduğunda
OpenClaw bunları desteklenen bir `size` değerine eşler, aksi takdirde araç bunları
yok sayılmış geçersiz kılmalar olarak raporlar.

OpenAI'ye özgü seçenekler `openai` nesnesi altında bulunur:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background`, `transparent`, `opaque` veya `auto` kabul eder; şeffaf
çıktılar `outputFormat` olarak `png` veya `webp` gerektirir. `openai.outputCompression`
JPEG/WebP çıktıları için geçerlidir.

Bir adet 4K yatay görsel üretin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

İki adet kare görsel üretin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Bir yerel referans görselini düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Birden fazla referansla düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

OpenAI görsel üretimini `api.openai.com` yerine bir Azure OpenAI dağıtımı üzerinden yönlendirmek için OpenAI sağlayıcı belgelerindeki [Azure OpenAI uç noktaları](/tr/providers/openai#azure-openai-endpoints) bölümüne bakın.

MiniMax görsel üretimi, paketlenmiş her iki MiniMax auth yolu üzerinden de kullanılabilir:

- API anahtarı kurulumları için `minimax/image-01`
- OAuth kurulumları için `minimax-portal/image-01`

## Sağlayıcı yetenekleri

| Yetenek               | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Üretim                | Evet (en fazla 4)    | Evet (en fazla 4)    | Evet (en fazla 4)   | Evet (en fazla 9)          | Evet (iş akışı tanımlı çıktılar)   | Evet (1) | Evet (en fazla 4)    |
| Düzenleme/referans    | Evet (en fazla 5 görsel) | Evet (en fazla 5 görsel) | Evet (1 görsel) | Evet (1 görsel, özne referansı) | Evet (1 görsel, iş akışı yapılandırmalı) | Hayır | Evet (en fazla 5 görsel) |
| Boyut denetimi        | Evet (4K'ya kadar)   | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   | Hayır                |
| En-boy oranı          | Hayır                | Evet                 | Evet (yalnızca üretim) | Evet                     | Hayır                              | Hayır   | Evet                 |
| Çözünürlük (1K/2K/4K) | Hayır                | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   | Evet (1K/2K)         |

### xAI `grok-imagine-image`

Paketlenmiş xAI sağlayıcısı, yalnızca istem içeren istekler için `/v1/images/generations`,
`image` veya `images` mevcut olduğunda ise `/v1/images/edits` kullanır.

- Modeller: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Sayı: en fazla 4
- Referanslar: bir `image` veya en fazla beş `images`
- En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Çözünürlükler: `1K`, `2K`
- Çıktılar: OpenClaw tarafından yönetilen görsel ekleri olarak döndürülür

OpenClaw, bu denetimler paylaşılan
sağlayıcılar arası `image_generate` sözleşmesinde yer alana kadar xAI'ye özgü `quality`, `mask`, `user` veya
ek yalnızca yerel en-boy oranlarını bilerek açığa çıkarmaz.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — kullanılabilir tüm ajan araçları
- [fal](/tr/providers/fal) — fal görsel ve video sağlayıcı kurulumu
- [ComfyUI](/tr/providers/comfy) — yerel ComfyUI ve Comfy Cloud iş akışı kurulumu
- [Google (Gemini)](/tr/providers/google) — Gemini görsel sağlayıcı kurulumu
- [MiniMax](/tr/providers/minimax) — MiniMax görsel sağlayıcı kurulumu
- [OpenAI](/tr/providers/openai) — OpenAI Images sağlayıcı kurulumu
- [Vydra](/tr/providers/vydra) — Vydra görsel, video ve konuşma kurulumu
- [xAI](/tr/providers/xai) — Grok görsel, video, arama, kod yürütme ve TTS kurulumu
- [Yapılandırma Başvurusu](/tr/gateway/config-agents#agent-defaults) — `imageGenerationModel` yapılandırması
- [Modeller](/tr/concepts/models) — model yapılandırması ve hata durumunda devretme
