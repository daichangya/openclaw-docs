---
read_when:
    - Görselleri aracı üzerinden oluşturma
    - Görsel oluşturma sağlayıcılarını ve modellerini yapılandırma
    - '`image_generate` aracı parametrelerini anlama'
summary: Yapılandırılmış sağlayıcıları (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI) kullanarak görseller oluşturun ve düzenleyin
title: Görsel Oluşturma
x-i18n:
    generated_at: "2026-04-23T13:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fbd8eda2cb0867d1426b9349f6778c231051d600ebe451534efbee0e215c871
    source_path: tools/image-generation.md
    workflow: 15
---

# Görsel Oluşturma

`image_generate` aracı, aracının yapılandırılmış sağlayıcılarınızı kullanarak görseller oluşturmasına ve düzenlemesine olanak tanır. Oluşturulan görseller, aracının yanıtında otomatik olarak medya ekleri olarak teslim edilir.

<Note>
Araç yalnızca en az bir görsel oluşturma sağlayıcısı mevcut olduğunda görünür. Aracınızın araçlarında `image_generate` görmüyorsanız, `agents.defaults.imageGenerationModel` yapılandırın veya bir sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

1. En az bir sağlayıcı için bir API anahtarı ayarlayın (örneğin `OPENAI_API_KEY` veya `GEMINI_API_KEY`).
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

3. Aracıya şunu sorun: _"Dost canlısı bir ıstakoz maskotunun görselini oluştur."_

Aracı `image_generate` aracını otomatik olarak çağırır. Araç izin listesi gerekmez — bir sağlayıcı mevcut olduğunda varsayılan olarak etkindir.

## Desteklenen sağlayıcılar

| Sağlayıcı | Varsayılan model                | Düzenleme desteği                  | API anahtarı                                          |
| --------- | ------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI    | `gpt-image-2`                   | Evet (en fazla 5 görsel)           | `OPENAI_API_KEY`                                      |
| Google    | `gemini-3.1-flash-image-preview`| Evet                               | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                |
| fal       | `fal-ai/flux/dev`               | Evet                               | `FAL_KEY`                                             |
| MiniMax   | `image-01`                      | Evet (özne referansı)              | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |
| ComfyUI   | `workflow`                      | Evet (1 görsel, iş akışı yapılandırmalı) | bulut için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| Vydra     | `grok-imagine`                  | Hayır                              | `VYDRA_API_KEY`                                       |
| xAI       | `grok-imagine-image`            | Evet (en fazla 5 görsel)           | `XAI_API_KEY`                                         |

Çalışma zamanında kullanılabilir sağlayıcıları ve modelleri incelemek için `action: "list"` kullanın:

```
/tool image_generate action=list
```

## Araç parametreleri

| Parametre    | Tür      | Açıklama                                                                            |
| ------------ | -------- | ----------------------------------------------------------------------------------- |
| `prompt`     | string   | Görsel oluşturma istemi (`action: "generate"` için gereklidir)                      |
| `action`     | string   | Sağlayıcıları incelemek için `"generate"` (varsayılan) veya `"list"`                |
| `model`      | string   | Sağlayıcı/model geçersiz kılması, ör. `openai/gpt-image-2`                          |
| `image`      | string   | Düzenleme modu için tek referans görsel yolu veya URL                               |
| `images`     | string[] | Düzenleme modu için birden çok referans görsel (en fazla 5)                         |
| `size`       | string   | Boyut ipucu: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`        |
| `aspectRatio`| string   | En-boy oranı: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution` | string   | Çözünürlük ipucu: `1K`, `2K` veya `4K`                                              |
| `count`      | number   | Oluşturulacak görsel sayısı (1–4)                                                   |
| `filename`   | string   | Çıktı dosya adı ipucu                                                               |

Tüm sağlayıcılar tüm parametreleri desteklemez. Bir yedek sağlayıcı tam istenen seçenek yerine yakın bir geometri seçeneğini desteklediğinde, OpenClaw göndermeden önce en yakın desteklenen boyuta, en-boy oranına veya çözünürlüğe yeniden eşler. Gerçekten desteklenmeyen geçersiz kılmalar yine de araç sonucunda bildirilir.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw, sağlayıcı yedeğine geçiş sırasında geometriyi yeniden eşlediğinde, döndürülen `size`, `aspectRatio` ve `resolution` değerleri gerçekte gönderileni yansıtır ve `details.normalization` istekten uygulanan değere yapılan çeviriyi yakalar.

## Yapılandırma

### Model seçimi

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Sağlayıcı seçim sırası

Bir görsel oluşturulurken OpenClaw sağlayıcıları şu sırayla dener:

1. Araç çağrısındaki **`model` parametresi** (araç belirtiyorsa)
2. Yapılandırmadaki **`imageGenerationModel.primary`**
3. Sırayla **`imageGenerationModel.fallbacks`**
4. **Otomatik algılama** — yalnızca kimlik doğrulama destekli sağlayıcı varsayılanlarını kullanır:
   - önce geçerli varsayılan sağlayıcı
   - ardından sağlayıcı kimliği sırasına göre kalan kayıtlı görsel oluşturma sağlayıcıları

Bir sağlayıcı başarısız olursa (kimlik doğrulama hatası, hız sınırı vb.), sıradaki aday otomatik olarak denenir. Tümü başarısız olursa, hata her denemeye ilişkin ayrıntıları içerir.

Notlar:

- Otomatik algılama kimlik doğrulama farkındadır. Bir sağlayıcı varsayılanı yalnızca
  OpenClaw o sağlayıcı için gerçekten kimlik doğrulaması yapabildiğinde aday listesine girer.
- Otomatik algılama varsayılan olarak etkindir. Görsel oluşturmanın yalnızca açıkça belirtilen `model`, `primary` ve `fallbacks`
  girdilerini kullanmasını istiyorsanız `agents.defaults.mediaGenerationAutoProviderFallback: false`
  ayarlayın.
- Şu anda kayıtlı sağlayıcıları, bunların varsayılan modellerini ve kimlik doğrulama ortam değişkeni ipuçlarını incelemek için `action: "list"` kullanın.

### Görsel düzenleme

OpenAI, Google, fal, MiniMax, ComfyUI ve xAI referans görselleri düzenlemeyi destekler. Bir referans görsel yolu veya URL'si verin:

```
"Bu fotoğrafın suluboya sürümünü oluştur" + image: "/path/to/photo.jpg"
```

OpenAI, Google ve xAI `images` parametresi üzerinden en fazla 5 referans görseli destekler. fal, MiniMax ve ComfyUI 1 görsel destekler.

### OpenAI `gpt-image-2`

OpenAI görsel oluşturma varsayılan olarak `openai/gpt-image-2` kullanır. Eski
`openai/gpt-image-1` modeli hâlâ açıkça seçilebilir, ancak yeni OpenAI
görsel oluşturma ve görsel düzenleme istekleri `gpt-image-2` kullanmalıdır.

`gpt-image-2`, aynı `image_generate` aracı üzerinden hem metinden görsel oluşturmayı hem de
referans görsel düzenlemeyi destekler. OpenClaw `prompt`,
`count`, `size` ve referans görselleri OpenAI'ye iletir. OpenAI doğrudan
`aspectRatio` veya `resolution` almaz; mümkün olduğunda OpenClaw bunları desteklenen bir
`size` değerine eşler, aksi takdirde araç bunları yok sayılan geçersiz kılmalar olarak bildirir.

Bir adet 4K yatay görsel oluşturun:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw görsel oluşturma için temiz bir editoryal afiş" size=3840x2160 count=1
```

İki kare görsel oluşturun:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Sakin bir üretkenlik uygulaması simgesi için iki görsel yön" size=1024x1024 count=2
```

Bir yerel referans görseli düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Özneyi koru, arka planı aydınlık bir stüdyo düzeniyle değiştir" image=/path/to/reference.png size=1024x1536
```

Birden çok referansla düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="İlk görseldeki karakter kimliğini ikinci görseldeki renk paletiyle birleştir" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

OpenAI görsel oluşturmayı `api.openai.com` yerine bir Azure OpenAI dağıtımı
üzerinden yönlendirmek için OpenAI sağlayıcı belgelerindeki
[Azure OpenAI endpoints](/tr/providers/openai#azure-openai-endpoints) bölümüne bakın.

MiniMax görsel oluşturma, paketlenmiş her iki MiniMax kimlik doğrulama yolu üzerinden de kullanılabilir:

- API anahtarı kurulumları için `minimax/image-01`
- OAuth kurulumları için `minimax-portal/image-01`

## Sağlayıcı yetenekleri

| Yetenek               | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Oluşturma             | Evet (en fazla 4)    | Evet (en fazla 4)    | Evet (en fazla 4)   | Evet (en fazla 9)          | Evet (iş akışı tanımlı çıktılar)   | Evet (1)| Evet (en fazla 4)    |
| Düzenleme/referans    | Evet (en fazla 5 görsel) | Evet (en fazla 5 görsel) | Evet (1 görsel) | Evet (1 görsel, özne ref.) | Evet (1 görsel, iş akışı yapılandırmalı) | Hayır | Evet (en fazla 5 görsel) |
| Boyut denetimi        | Evet (4K'ye kadar)   | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   | Hayır                |
| En-boy oranı          | Hayır                | Evet                 | Evet (yalnızca oluşturma) | Evet                   | Hayır                              | Hayır   | Evet                 |
| Çözünürlük (1K/2K/4K) | Hayır                | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   | Evet (1K/2K)         |

### xAI `grok-imagine-image`

Paketlenmiş xAI sağlayıcısı, yalnızca istem içeren istekler için `/v1/images/generations`
ve `image` veya `images` mevcut olduğunda `/v1/images/edits` kullanır.

- Modeller: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Sayı: en fazla 4
- Referanslar: bir `image` veya en fazla beş `images`
- En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Çözünürlükler: `1K`, `2K`
- Çıktılar: OpenClaw tarafından yönetilen görsel ekleri olarak döndürülür

OpenClaw, bu denetimler paylaşılan
sağlayıcılar arası `image_generate` sözleşmesinde yer alana kadar xAI'ye özgü `quality`, `mask`, `user` veya
ek yalnızca yerel en-boy oranlarını kasıtlı olarak kullanıma sunmaz.

## İlgili

- [Tools Overview](/tr/tools) — kullanılabilir tüm aracı araçları
- [fal](/tr/providers/fal) — fal görsel ve video sağlayıcısı kurulumu
- [ComfyUI](/tr/providers/comfy) — yerel ComfyUI ve Comfy Cloud iş akışı kurulumu
- [Google (Gemini)](/tr/providers/google) — Gemini görsel sağlayıcısı kurulumu
- [MiniMax](/tr/providers/minimax) — MiniMax görsel sağlayıcısı kurulumu
- [OpenAI](/tr/providers/openai) — OpenAI Images sağlayıcısı kurulumu
- [Vydra](/tr/providers/vydra) — Vydra görsel, video ve konuşma kurulumu
- [xAI](/tr/providers/xai) — Grok görsel, video, arama, kod yürütme ve TTS kurulumu
- [Configuration Reference](/tr/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` yapılandırması
- [Models](/tr/concepts/models) — model yapılandırması ve yedek geçişi
