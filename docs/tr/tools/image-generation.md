---
read_when:
    - Agent aracılığıyla görüntü oluşturma
    - Görüntü oluşturma provider'larını ve modellerini yapılandırma
    - '`image_generate` aracı parametrelerini anlama'
summary: Yapılandırılmış provider'ları kullanarak görüntüler oluşturun ve düzenleyin (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Görüntü Oluşturma
x-i18n:
    generated_at: "2026-04-23T09:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 228049c74dd3437544cda6418da665aed375c0494ef36a6927d15c28d7783bbd
    source_path: tools/image-generation.md
    workflow: 15
---

# Görüntü Oluşturma

`image_generate` aracı, agent'ın yapılandırılmış provider'larınızı kullanarak görüntüler oluşturmasına ve düzenlemesine izin verir. Oluşturulan görüntüler, agent yanıtında otomatik olarak medya eki olarak teslim edilir.

<Note>
Araç yalnızca en az bir görüntü oluşturma provider'ı kullanılabilir olduğunda görünür. Agent araçlarınızda `image_generate` görünmüyorsa `agents.defaults.imageGenerationModel` yapılandırın veya bir provider API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

1. En az bir provider için API anahtarı ayarlayın (örneğin `OPENAI_API_KEY` veya `GEMINI_API_KEY`).
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

3. Agent'a şunu sorun: _"Dost canlısı bir ıstakoz maskotu görüntüsü oluştur."_

Agent `image_generate` aracını otomatik olarak çağırır. Araç allowlist'e ekleme gerekmez — bir provider kullanılabilir olduğunda varsayılan olarak etkindir.

## Desteklenen provider'lar

| Provider | Varsayılan model                | Düzenleme desteği                  | API anahtarı                                           |
| -------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                    | Evet (en fazla 5 görüntü)          | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Evet                               | `GEMINI_API_KEY` veya `GOOGLE_API_KEY`                 |
| fal      | `fal-ai/flux/dev`                | Evet                               | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Evet (özne referansı)              | `MINIMAX_API_KEY` veya MiniMax OAuth (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Evet (1 görüntü, workflow tarafından yapılandırılır) | bulut için `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| Vydra    | `grok-imagine`                   | Hayır                              | `VYDRA_API_KEY`                                        |
| xAI      | `grok-imagine-image`             | Evet (en fazla 5 görüntü)          | `XAI_API_KEY`                                          |

Çalışma zamanında kullanılabilir provider'ları ve modelleri incelemek için `action: "list"` kullanın:

```
/tool image_generate action=list
```

## Araç parametreleri

| Parametre    | Tür      | Açıklama                                                                          |
| ------------ | -------- | --------------------------------------------------------------------------------- |
| `prompt`     | string   | Görüntü oluşturma istemi (`action: "generate"` için gereklidir)                   |
| `action`     | string   | Provider'ları incelemek için `"generate"` (varsayılan) veya `"list"`              |
| `model`      | string   | Provider/model geçersiz kılması, örn. `openai/gpt-image-2`                        |
| `image`      | string   | Düzenleme modu için tek referans görüntü yolu veya URL'si                         |
| `images`     | string[] | Düzenleme modu için birden çok referans görüntü (en fazla 5)                      |
| `size`       | string   | Boyut ipucu: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`      |
| `aspectRatio`| string   | En-boy oranı: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution` | string   | Çözünürlük ipucu: `1K`, `2K` veya `4K`                                            |
| `count`      | number   | Oluşturulacak görüntü sayısı (1–4)                                                |
| `filename`   | string   | Çıktı dosya adı ipucu                                                             |

Tüm provider'lar tüm parametreleri desteklemez. Bir geri dönüş provider'ı tam istenen geometri yerine yakın bir geometri seçeneğini desteklediğinde OpenClaw, gönderimden önce en yakın desteklenen boyuta, en-boy oranına veya çözünürlüğe yeniden eşler. Gerçekten desteklenmeyen geçersiz kılmalar ise yine araç sonucunda raporlanır.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw provider geri dönüşü sırasında geometriyi yeniden eşlediğinde, döndürülen `size`, `aspectRatio` ve `resolution` değerleri gerçekten gönderileni yansıtır; `details.normalization` ise istenenden uygulanana yapılan çeviriyi yakalar.

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

### Provider seçim sırası

Bir görüntü oluşturulurken OpenClaw provider'ları şu sırayla dener:

1. Araç çağrısından gelen **`model` parametresi** (agent bir tane belirtirse)
2. Yapılandırmadan **`imageGenerationModel.primary`**
3. Sırayla **`imageGenerationModel.fallbacks`**
4. **Otomatik algılama** — yalnızca auth destekli provider varsayılanlarını kullanır:
   - önce geçerli varsayılan provider
   - sonra provider-id sırasına göre kayıtlı kalan görüntü oluşturma provider'ları

Bir provider başarısız olursa (kimlik doğrulama hatası, hız sınırı vb.), sonraki aday otomatik olarak denenir. Hepsi başarısız olursa, hata her denemeden ayrıntıları içerir.

Notlar:

- Otomatik algılama auth farkındalığına sahiptir. Bir provider varsayılanı ancak
  OpenClaw o provider için gerçekten kimlik doğrulaması yapabiliyorsa aday listesine girer.
- Otomatik algılama varsayılan olarak etkindir. Görüntü oluşturmanın yalnızca açık `model`, `primary` ve `fallbacks`
  girdilerini kullanmasını istiyorsanız
  `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.
- Şu anda kayıtlı provider'ları, bunların
  varsayılan modellerini ve auth env-var ipuçlarını incelemek için `action: "list"` kullanın.

### Görüntü düzenleme

OpenAI, Google, fal, MiniMax, ComfyUI ve xAI referans görüntüleri düzenlemeyi destekler. Bir referans görüntü yolu veya URL'si geçin:

```
"Bu fotoğrafın suluboya sürümünü oluştur" + image: "/path/to/photo.jpg"
```

OpenAI, Google ve xAI, `images` parametresi üzerinden en fazla 5 referans görüntüyü destekler. fal, MiniMax ve ComfyUI 1 tane destekler.

### OpenAI `gpt-image-2`

OpenAI görüntü oluşturma varsayılan olarak `openai/gpt-image-2` kullanır. Daha eski
`openai/gpt-image-1` modeli hâlâ açıkça seçilebilir, ancak yeni OpenAI
görüntü oluşturma ve görüntü düzenleme istekleri `gpt-image-2` kullanmalıdır.

`gpt-image-2`, aynı `image_generate` aracı üzerinden hem metinden görüntü üretimini hem de referans görüntü
düzenlemeyi destekler. OpenClaw `prompt`,
`count`, `size` ve referans görüntüleri OpenAI'ye iletir. OpenAI
`aspectRatio` veya `resolution` değerlerini doğrudan almaz; mümkün olduğunda OpenClaw bunları desteklenen bir
`size` içine eşler, aksi halde araç bunları yok sayılan geçersiz kılmalar olarak raporlar.

Bir adet 4K yatay görüntü oluşturun:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw görüntü oluşturma için temiz bir editoryal poster" size=3840x2160 count=1
```

İki kare görüntü oluşturun:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Sakin bir üretkenlik uygulaması simgesi için iki görsel yön" size=1024x1024 count=2
```

Bir yerel referans görüntüyü düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Özneyi koru, arka planı parlak bir stüdyo düzeniyle değiştir" image=/path/to/reference.png size=1024x1536
```

Birden çok referansla düzenleyin:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="İlk görüntüdeki karakter kimliğini ikinci görüntüdeki renk paletiyle birleştir" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

MiniMax görüntü oluşturma, her iki paketli MiniMax auth yolu üzerinden de kullanılabilir:

- API anahtarlı kurulumlar için `minimax/image-01`
- OAuth kurulumları için `minimax-portal/image-01`

## Provider yetenekleri

| Yetenek               | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Oluşturma             | Evet (en fazla 4)    | Evet (en fazla 4)    | Evet (en fazla 4)   | Evet (en fazla 9)          | Evet (workflow tanımlı çıktılar)   | Evet (1) | Evet (en fazla 4)    |
| Düzenleme/referans    | Evet (en fazla 5 görüntü) | Evet (en fazla 5 görüntü) | Evet (1 görüntü) | Evet (1 görüntü, özne referansı) | Evet (1 görüntü, workflow tarafından yapılandırılır) | Hayır | Evet (en fazla 5 görüntü) |
| Boyut denetimi        | Evet (4K'ya kadar)   | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   | Hayır                |
| En-boy oranı          | Hayır                | Evet                 | Evet (yalnızca oluşturma) | Evet                  | Hayır                              | Hayır   | Evet                 |
| Çözünürlük (1K/2K/4K) | Hayır                | Evet                 | Evet                | Hayır                      | Hayır                              | Hayır   | Evet (1K/2K)         |

### xAI `grok-imagine-image`

Paketli xAI provider'ı yalnızca istem içeren istekler için `/v1/images/generations`
ve `image` veya `images` mevcut olduğunda `/v1/images/edits` kullanır.

- Modeller: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Sayı: en fazla 4
- Referanslar: bir `image` veya en fazla beş `images`
- En-boy oranları: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Çözünürlükler: `1K`, `2K`
- Çıktılar: OpenClaw tarafından yönetilen görüntü ekleri olarak döndürülür

OpenClaw, bu denetimler paylaşılan
çapraz-provider `image_generate` sözleşmesinde var olana kadar xAI'ye özgü `quality`, `mask`, `user` veya
ek yalnızca yerel en-boy oranlarını kasıtlı olarak sunmaz.

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — kullanılabilir tüm agent araçları
- [fal](/tr/providers/fal) — fal görüntü ve video provider kurulumu
- [ComfyUI](/tr/providers/comfy) — yerel ComfyUI ve Comfy Cloud workflow kurulumu
- [Google (Gemini)](/tr/providers/google) — Gemini görüntü provider kurulumu
- [MiniMax](/tr/providers/minimax) — MiniMax görüntü provider kurulumu
- [OpenAI](/tr/providers/openai) — OpenAI Images provider kurulumu
- [Vydra](/tr/providers/vydra) — Vydra görüntü, video ve konuşma kurulumu
- [xAI](/tr/providers/xai) — Grok görüntü, video, arama, kod yürütme ve TTS kurulumu
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` yapılandırması
- [Modeller](/tr/concepts/models) — model yapılandırması ve failover
