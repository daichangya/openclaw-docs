---
read_when:
    - Aracı üzerinden video üretme
    - Video üretim sağlayıcılarını ve modellerini yapılandırma
    - video_generate araç parametrelerini anlama
summary: 14 sağlayıcı arka ucu kullanarak metinden, görsellerden veya mevcut videolardan video üretin
title: Video üretimi
x-i18n:
    generated_at: "2026-04-25T14:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a16c56939967a6268e62a267598fe03d2eb3195384ad805652498004fdaf886
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw aracılar metin prompt'larından, referans görsellerden veya mevcut videolardan video üretebilir. On dört sağlayıcı arka ucu desteklenir; her biri farklı model seçenekleri, girdi modları ve özellik kümeleri sunar. Aracı, yapılandırmanıza ve kullanılabilir API anahtarlarına göre doğru sağlayıcıyı otomatik olarak seçer.

<Note>
`video_generate` aracı yalnızca en az bir video üretim sağlayıcısı kullanılabilir olduğunda görünür. Aracı araçlarınızda bunu görmüyorsanız bir sağlayıcı API anahtarı ayarlayın veya `agents.defaults.videoGenerationModel` yapılandırın.
</Note>

OpenClaw video üretimini üç çalışma zamanı modu olarak ele alır:

- Referans medya içermeyen metinden videoya istekler için `generate`
- İstek bir veya daha fazla referans görsel içerdiğinde `imageToVideo`
- İstek bir veya daha fazla referans video içerdiğinde `videoToVideo`

Sağlayıcılar bu modların herhangi bir alt kümesini destekleyebilir. Araç, gönderimden önce etkin
modu doğrular ve desteklenen modları `action=list` içinde bildirir.

## Hızlı başlangıç

1. Desteklenen herhangi bir sağlayıcı için bir API anahtarı ayarlayın:

```bash
export GEMINI_API_KEY="your-key"
```

2. İsteğe bağlı olarak bir varsayılan model sabitleyin:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Aracıya sorun:

> Gün batımında sörf yapan sevimli bir ıstakozun 5 saniyelik sinematik bir videosunu üret.

Aracı `video_generate` aracını otomatik olarak çağırır. Araç izin listesi gerekmez.

## Video ürettiğinizde ne olur

Video üretimi asenkrondur. Aracı bir oturum içinde `video_generate` çağırdığında:

1. OpenClaw isteği sağlayıcıya gönderir ve hemen bir görev kimliği döndürür.
2. Sağlayıcı işi arka planda işler (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ila 5 dakika).
3. Video hazır olduğunda OpenClaw aynı oturumu dahili bir tamamlama olayıyla uyandırır.
4. Aracı tamamlanmış videoyu özgün konuşmaya geri gönderir.

Bir iş çalışırken, aynı oturumdaki yinelenen `video_generate` çağrıları başka bir üretim başlatmak yerine geçerli görev durumunu döndürür. CLI üzerinden ilerlemeyi kontrol etmek için `openclaw tasks list` veya `openclaw tasks show <taskId>` kullanın.

Oturum destekli aracı çalıştırmaları dışında (örneğin doğrudan araç çağrıları), araç satır içi üretime geri döner ve son medya yolunu aynı turda döndürür.

Sağlayıcı bayt döndürdüğünde üretilen video dosyaları OpenClaw tarafından yönetilen medya depolaması altında kaydedilir. Varsayılan üretilen-video kaydetme üst sınırı video medya sınırını izler ve `agents.defaults.mediaMaxMb` bunu daha büyük render'lar için yükseltir.
Bir sağlayıcı ayrıca barındırılan bir çıktı URL'si de döndürdüğünde, yerel kalıcılık aşırı büyük bir dosyayı reddederse OpenClaw görevi başarısız yapmak yerine bu URL'yi teslim edebilir.

### Görev yaşam döngüsü

Her `video_generate` isteği dört durumdan geçer:

1. **queued** -- görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.
2. **running** -- sağlayıcı işliyor (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ila 5 dakika).
3. **succeeded** -- video hazır; aracı uyanır ve bunu konuşmaya gönderir.
4. **failed** -- sağlayıcı hatası veya zaman aşımı; aracı hata ayrıntılarıyla uyanır.

CLI'dan durumu kontrol edin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Yineleme önleme: geçerli oturum için bir video görevi zaten `queued` veya `running` durumundaysa, `video_generate` yeni bir üretim başlatmak yerine mevcut görev durumunu döndürür. Yeni üretim tetiklemeden açıkça kontrol etmek için `action: "status"` kullanın.

## Desteklenen sağlayıcılar

| Sağlayıcı             | Varsayılan model                | Metin | Görsel referansı                                       | Video referansı  | API anahtarı                             |
| --------------------- | ------------------------------- | ----- | ------------------------------------------------------ | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Evet  | Evet (uzak URL)                                        | Evet (uzak URL)  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Evet  | En fazla 2 görsel (yalnızca I2V modelleri; ilk + son kare) | Hayır        | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Evet  | En fazla 2 görsel (rol üzerinden ilk + son kare)       | Hayır            | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Evet  | En fazla 9 referans görseli                            | En fazla 3 video | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Evet  | 1 görsel                                               | Hayır            | `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Evet  | 1 görsel                                               | Hayır            | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Evet  | 1 görsel                                               | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Evet  | 1 görsel                                               | Hayır            | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Evet  | 1 görsel                                               | 1 video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Evet  | Evet (uzak URL)                                        | Evet (uzak URL)  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Evet  | 1 görsel                                               | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Evet  | 1 görsel                                               | Hayır            | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Evet  | 1 görsel (`kling`)                                     | Hayır            | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Evet  | 1 görsel                                               | 1 video          | `XAI_API_KEY`                            |

Bazı sağlayıcılar ek veya alternatif API anahtarı env değişkenleri kabul eder. Ayrıntılar için ilgili [sağlayıcı sayfalarına](#related) bakın.

Çalışma zamanında kullanılabilir sağlayıcıları, modelleri ve
çalışma zamanı modlarını incelemek için `video_generate action=list` çalıştırın.

### Bildirilmiş yetenek matrisi

Bu, `video_generate`, sözleşme testleri
ve paylaşılan canlı tarama tarafından kullanılan açık mod sözleşmesidir.

| Sağlayıcı | `generate` | `imageToVideo` | `videoToVideo` | Güncel paylaşılan canlı şeritler                                                                                                         |
| --------- | ---------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL'leri gerektirir                          |
| BytePlus  | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI   | Evet       | Evet           | Hayır          | Paylaşılan taramada yok; iş akışına özgü kapsama Comfy testleriyle birlikte yaşar                                                        |
| fal       | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                                |
| Google    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü geçerli arabellek destekli Gemini/Veo taraması bu girdiyi kabul etmez |
| MiniMax   | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                                |
| OpenAI    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü bu kuruluş/girdi yolu şu anda sağlayıcı taraflı inpaint/remix erişimi gerektirir |
| Qwen      | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL'leri gerektirir                          |
| Runway    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` yalnızca seçili model `runway/gen4_aleph` olduğunda çalışır                                 |
| Together  | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                                |
| Vydra     | Evet       | Evet           | Hayır          | `generate`; paylaşılan `imageToVideo` atlanır çünkü paketlenmiş `veo3` yalnızca metin desteklidir ve paketlenmiş `kling` uzak görsel URL'si gerektirir |
| xAI       | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı şu anda uzak bir MP4 URL'si gerektirir                            |

## Araç parametreleri

### Gerekli

| Parametre | Tür    | Açıklama                                                                       |
| --------- | ------ | ------------------------------------------------------------------------------ |
| `prompt`  | string | Üretilecek videonun metinsel açıklaması (`action: "generate"` için gereklidir) |

### İçerik girdileri

| Parametre    | Tür      | Açıklama                                                                                                                           |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Tek referans görsel (yol veya URL)                                                                                                 |
| `images`     | string[] | Birden çok referans görseli (en fazla 9)                                                                                           |
| `imageRoles` | string[] | Birleştirilmiş görsel listesine paralel, isteğe bağlı konum başına rol ipuçları. Kanonik değerler: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Tek referans video (yol veya URL)                                                                                                  |
| `videos`     | string[] | Birden çok referans video (en fazla 4)                                                                                             |
| `videoRoles` | string[] | Birleştirilmiş video listesine paralel, isteğe bağlı konum başına rol ipuçları. Kanonik değer: `reference_video`                 |
| `audioRef`   | string   | Tek referans ses (yol veya URL). Sağlayıcı ses girdilerini desteklediğinde ör. arka plan müziği veya ses referansı için kullanılır |
| `audioRefs`  | string[] | Birden çok referans ses (en fazla 3)                                                                                               |
| `audioRoles` | string[] | Birleştirilmiş ses listesine paralel, isteğe bağlı konum başına rol ipuçları. Kanonik değer: `reference_audio`                  |

Rol ipuçları sağlayıcıya aynen iletilir. Kanonik değerler
`VideoGenerationAssetRole` birleşiminden gelir ancak sağlayıcılar ek
rol dizelerini kabul edebilir. `*Roles` dizileri ilgili
referans listesinden daha fazla giriş içeremez; bir eksik-bir-fazla hataları açık bir hatayla başarısız olur.
Bir yuvayı ayarsız bırakmak için boş dize kullanın.

### Stil denetimleri

| Parametre         | Tür     | Açıklama                                                                             |
| ----------------- | ------- | ------------------------------------------------------------------------------------ |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` veya `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P` veya `1080P`                                                  |
| `durationSeconds` | number  | Hedef süre saniye cinsinden (sağlayıcının desteklediği en yakın değere yuvarlanır)  |
| `size`            | string  | Sağlayıcı desteklediğinde boyut ipucu                                                |
| `audio`           | boolean | Desteklendiğinde çıktıda üretilmiş sesi etkinleştirir. `audioRef*` ile aynı şey değildir (girdiler) |
| `watermark`       | boolean | Desteklendiğinde sağlayıcı filigranını açar/kapatır                                  |

`adaptive`, sağlayıcıya özgü bir sentinel'dir: bunu yeteneklerinde
`adaptive` bildiren sağlayıcılara aynen iletilir (örneğin BytePlus
Seedance bunu giriş görseli boyutlarından oranı otomatik algılamak için
kullanır). Bunu bildirmeyen sağlayıcılar, düşürmenin görünür olması için
araç sonucunda değeri `details.ignoredOverrides` üzerinden gösterir.

### Gelişmiş

| Parametre         | Tür    | Açıklama                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (varsayılan), `"status"` veya `"list"`                                                                                                                                                                                                                                                                                               |
| `model`           | string | Sağlayıcı/model geçersiz kılması (örn. `runway/gen4.5`)                                                                                                                                                                                                                                                                                           |
| `filename`        | string | Çıktı dosya adı ipucu                                                                                                                                                                                                                                                                                                                             |
| `timeoutMs`       | number | Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı                                                                                                                                                                                                                                                                                     |
| `providerOptions` | object | JSON nesnesi olarak sağlayıcıya özgü seçenekler (örn. `{"seed": 42, "draft": true}`). Türlenmiş bir şema bildiren sağlayıcılar anahtarları ve türleri doğrular; bilinmeyen anahtarlar veya eşleşmeyen türler geri dönüş sırasında adayın atlanmasına neden olur. Bildirilmiş şeması olmayan sağlayıcılar seçenekleri aynen alır. Her sağlayıcının ne kabul ettiğini görmek için `video_generate action=list` çalıştırın |

Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw zaten süreyi en yakın sağlayıcı destekli değere normalize eder ve ayrıca bir geri dönüş sağlayıcısı farklı bir kontrol yüzeyi sunduğunda boyuttan en-boy oranına gibi çevrilmiş geometri ipuçlarını yeniden eşler. Gerçekten desteklenmeyen geçersiz kılmalar en iyi çabayla yok sayılır ve araç sonucunda uyarı olarak bildirilir. Kesin yetenek sınırları (çok fazla referans girdisi gibi) gönderimden önce başarısız olur.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw sağlayıcı geri dönüşü sırasında süreyi veya geometrileri yeniden eşlediğinde, dönen `durationSeconds`, `size`, `aspectRatio` ve `resolution` değerleri gönderilen şeyi yansıtır; `details.normalization` ise istenenden uygulanana çeviriyi yakalar.

Referans girdileri çalışma zamanı modunu da seçer:

- Referans medya yok: `generate`
- Herhangi bir görsel referansı: `imageToVideo`
- Herhangi bir video referansı: `videoToVideo`
- Referans ses girdileri çözümlenen modu değiştirmez; görsel/video referanslarının seçtiği modun üstüne uygulanır ve yalnızca `maxInputAudios` bildiren sağlayıcılarla çalışır

Karışık görsel ve video referansları kararlı bir paylaşılan yetenek yüzeyi değildir.
İstek başına tek referans türünü tercih edin.

#### Geri dönüş ve türlenmiş seçenekler

Bazı yetenek kontrolleri araç sınırında değil
geri dönüş katmanında uygulanır; böylece birincil sağlayıcının sınırlarını aşan bir istek
yine de bunu yapabilen bir geri dönüş sağlayıcısında çalışabilir:

- Etkin aday `maxInputAudios` bildirmiyorsa (veya bunu
  `0` olarak bildiriyorsa), istek ses referansları içerdiğinde aday atlanır ve
  sonraki aday denenir.
- Etkin adayın `maxDurationSeconds` değeri istenen
  `durationSeconds` değerinin altındaysa ve aday bir
  `supportedDurationSeconds` listesi bildirmiyorsa atlanır.
- İstek `providerOptions` içeriyorsa ve etkin aday
  açıkça türlenmiş bir `providerOptions` şeması bildiriyorsa, sağlanan
  anahtarlar şemada değilse veya değer türleri eşleşmiyorsa aday
  atlanır. Henüz şema bildirmemiş sağlayıcılar
  seçenekleri aynen alır (geriye dönük uyumlu geçiş). Bir sağlayıcı,
  boş bir şema bildirerek tüm sağlayıcı seçeneklerinden açıkça vazgeçebilir
  (`capabilities.providerOptions: {}`); bu da
  tür uyumsuzluğuyla aynı atlamaya neden olur.

Bir istekteki ilk atlama nedeni `warn` düzeyinde günlüğe kaydedilir; böylece operatörler
birincil sağlayıcının ne zaman atlandığını görür; sonraki atlamalar,
uzun geri dönüş zincirlerini sessiz tutmak için `debug` düzeyinde kaydedilir. Her aday atlanırsa,
birleştirilmiş hata her biri için atlama nedenini içerir.

## Eylemler

- **generate** (varsayılan) -- verilen prompt ve isteğe bağlı referans girdileriyle bir video oluşturur.
- **status** -- başka bir üretim başlatmadan geçerli oturum için çalışmakta olan video görevinin durumunu kontrol eder.
- **list** -- kullanılabilir sağlayıcıları, modelleri ve yeteneklerini gösterir.

## Model seçimi

Bir video üretilirken OpenClaw modeli şu sırayla çözümler:

1. **`model` araç parametresi** -- aracı çağrıda bir tane belirtirse.
2. **`videoGenerationModel.primary`** -- config'ten.
3. **`videoGenerationModel.fallbacks`** -- sırayla denenir.
4. **Otomatik algılama** -- geçerli kimlik doğrulamaya sahip sağlayıcıları kullanır; önce geçerli varsayılan sağlayıcıdan, sonra kalan sağlayıcılardan alfabetik sırayla başlar.

Bir sağlayıcı başarısız olursa sonraki aday otomatik olarak denenir. Tüm adaylar başarısız olursa hata, her denemeden ayrıntılar içerir.

Video üretiminin yalnızca açık `model`, `primary` ve `fallbacks`
girdilerini kullanmasını istiyorsanız `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Sağlayıcı notları

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio asenkron uç noktasını kullanır. Referans görseller ve videolar uzak `http(s)` URL'leri olmalıdır.
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    Sağlayıcı kimliği: `byteplus`.

    Modeller: `seedance-1-0-pro-250528` (varsayılan), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    T2V modelleri (`*-t2v-*`) görsel girdilerini kabul etmez; I2V modelleri ve genel `*-pro-*` modelleri tek bir referans görseli (ilk kare) destekler. Görseli konumsal olarak geçin veya `role: "first_frame"` ayarlayın. Bir görsel sağlandığında T2V model kimlikleri otomatik olarak karşılık gelen I2V varyantına geçirilir.

    Desteklenen `providerOptions` anahtarları: `seed` (number), `draft` (boolean — 480p'yi zorlar), `camera_fixed` (boolean).

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin'ini gerektirir. Sağlayıcı kimliği: `byteplus-seedance15`. Model: `seedance-1-5-pro-251215`.

    Birleşik `content[]` API'sini kullanır. En fazla 2 giriş görselini destekler (`first_frame` + `last_frame`). Tüm girdiler uzak `https://` URL'leri olmalıdır. Her görsel üzerinde `role: "first_frame"` / `"last_frame"` ayarlayın veya görselleri konumsal olarak geçin.

    `aspectRatio: "adaptive"` giriş görselinden oranı otomatik algılar. `audio: true`, `generate_audio`ya eşlenir. `providerOptions.seed` (number) iletilir.

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin'ini gerektirir. Sağlayıcı kimliği: `byteplus-seedance2`. Modeller: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`.

    Birleşik `content[]` API'sini kullanır. En fazla 9 referans görseli, 3 referans videosu ve 3 referans sesi destekler. Tüm girdiler uzak `https://` URL'leri olmalıdır. Her varlıkta `role` ayarlayın — desteklenen değerler: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` giriş görselinden oranı otomatik algılar. `audio: true`, `generate_audio`ya eşlenir. `providerOptions.seed` (number) iletilir.

  </Accordion>

  <Accordion title="ComfyUI">
    İş akışı odaklı yerel veya bulut yürütme. Yapılandırılmış grafik üzerinden metinden videoya ve görselden videoya desteği sunar.
  </Accordion>

  <Accordion title="fal">
    Uzun süren işler için kuyruk destekli bir akış kullanır. Yalnızca tek görsel referansı.
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    Bir görsel veya bir video referansını destekler.
  </Accordion>

  <Accordion title="MiniMax">
    Yalnızca tek görsel referansı.
  </Accordion>

  <Accordion title="OpenAI">
    Yalnızca `size` geçersiz kılması iletilir. Diğer stil geçersiz kılmaları (`aspectRatio`, `resolution`, `audio`, `watermark`) uyarıyla yok sayılır.
  </Accordion>

  <Accordion title="Qwen">
    Alibaba ile aynı DashScope arka ucunu kullanır. Referans girdileri uzak `http(s)` URL'leri olmalıdır; yerel dosyalar baştan reddedilir.
  </Accordion>

  <Accordion title="Runway">
    Data URI'ler üzerinden yerel dosyaları destekler. Videodan videoya için `runway/gen4_aleph` gerekir. Yalnızca metinle çalışan çalıştırmalar `16:9` ve `9:16` en-boy oranlarını açığa çıkarır.
  </Accordion>

  <Accordion title="Together">
    Yalnızca tek görsel referansı.
  </Accordion>

  <Accordion title="Vydra">
    Kimlik doğrulamayı düşüren yönlendirmelerden kaçınmak için doğrudan `https://www.vydra.ai/api/v1` kullanır. `veo3` paketlenmiş olarak yalnızca metinden videoya sunulur; `kling` uzak görsel URL'si gerektirir.
  </Accordion>

  <Accordion title="xAI">
    Metinden videoya, görselden videoya ve uzak video düzenleme/genişletme akışlarını destekler.
  </Accordion>
</AccordionGroup>

## Sağlayıcı yetenek modları

Paylaşılan video üretim sözleşmesi artık sağlayıcıların yalnızca düz toplu sınırlar yerine mod başına
yetenekler bildirmesine izin veriyor. Yeni sağlayıcı
uygulamaları açık mod bloklarını tercih etmelidir:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

`maxInputImages` ve `maxInputVideos` gibi düz toplu alanlar
dönüştürme modu desteğini duyurmak için yeterli değildir. Sağlayıcılar
`generate`, `imageToVideo` ve `videoToVideo` modlarını açıkça bildirmelidir; böylece canlı testler,
sözleşme testleri ve paylaşılan `video_generate` aracı mod desteğini
deterministik olarak doğrulayabilir.

## Canlı testler

Paylaşılan paketlenmiş sağlayıcılar için isteğe bağlı canlı kapsama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Depo sarmalayıcısı:

```bash
pnpm test:live:media video
```

Bu canlı dosya eksik sağlayıcı env değişkenlerini `~/.profile` içinden yükler, varsayılan olarak
canlı/env API anahtarlarını saklanan auth profillerinin önünde tercih eder ve
varsayılan olarak sürüm açısından güvenli bir smoke testi çalıştırır:

- taramadaki FAL dışı her sağlayıcı için `generate`
- bir saniyelik ıstakoz prompt'u
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  üzerinden sağlayıcı başına işlem üst sınırı (`varsayılan 180000`)

FAL isteğe bağlıdır çünkü sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın gelebilir:

```bash
pnpm test:live:media video --video-providers fal
```

Paylaşılan taramanın yerel medya ile güvenli biçimde çalıştırabildiği bildirilmiş dönüştürme modlarını da
çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:

- `capabilities.imageToVideo.enabled` olduğunda `imageToVideo`
- `capabilities.videoToVideo.enabled` olduğunda ve sağlayıcı/model
  paylaşılan taramada arabellek destekli yerel video girdisini kabul ettiğinde `videoToVideo`

Bugün paylaşılan `videoToVideo` canlı şeridi şunu kapsar:

- yalnızca `runway/gen4_aleph` seçtiğinizde `runway`

## Yapılandırma

Varsayılan video üretim modelini OpenClaw config'inizde ayarlayın:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Veya CLI üzerinden:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## İlgili

- [Tools Overview](/tr/tools)
- [Background Tasks](/tr/automation/tasks) -- asenkron video üretimi için görev izleme
- [Alibaba Model Studio](/tr/providers/alibaba)
- [BytePlus](/tr/concepts/model-providers#byteplus-international)
- [ComfyUI](/tr/providers/comfy)
- [fal](/tr/providers/fal)
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [OpenAI](/tr/providers/openai)
- [Qwen](/tr/providers/qwen)
- [Runway](/tr/providers/runway)
- [Together AI](/tr/providers/together)
- [Vydra](/tr/providers/vydra)
- [xAI](/tr/providers/xai)
- [Configuration Reference](/tr/gateway/config-agents#agent-defaults)
- [Models](/tr/concepts/models)
