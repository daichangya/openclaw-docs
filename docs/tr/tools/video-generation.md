---
read_when:
    - Agent aracılığıyla video oluşturma
    - Video oluşturma sağlayıcılarını ve modellerini yapılandırma
    - '`video_generate` aracının parametrelerini anlama'
summary: 14 sağlayıcı arka ucunu kullanarak metin, görseller veya mevcut videolardan videolar oluşturun
title: Video Oluşturma
x-i18n:
    generated_at: "2026-04-15T08:54:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c182f24b25e44f157a820e82a1f7422247f26125956944b5eb98613774268cfe
    source_path: tools/video-generation.md
    workflow: 15
---

# Video Oluşturma

OpenClaw agent’ları metin prompt’larından, referans görsellerden veya mevcut videolardan video oluşturabilir. On dört sağlayıcı arka ucu desteklenir; her birinin farklı model seçenekleri, giriş modları ve özellik setleri vardır. Agent, yapılandırmanıza ve kullanılabilir API anahtarlarına göre doğru sağlayıcıyı otomatik olarak seçer.

<Note>
`video_generate` aracı yalnızca en az bir video oluşturma sağlayıcısı kullanılabilir olduğunda görünür. Agent araçlarınızda bunu görmüyorsanız bir sağlayıcı API anahtarı ayarlayın veya `agents.defaults.videoGenerationModel` yapılandırmasını yapın.
</Note>

OpenClaw video oluşturmayı üç çalışma zamanı modu olarak ele alır:

- referans medya içermeyen metinden videoya istekler için `generate`
- istek bir veya daha fazla referans görsel içerdiğinde `imageToVideo`
- istek bir veya daha fazla referans video içerdiğinde `videoToVideo`

Sağlayıcılar bu modların herhangi bir alt kümesini destekleyebilir. Araç, gönderimden önce etkin modu doğrular ve `action=list` içinde desteklenen modları bildirir.

## Hızlı başlangıç

1. Desteklenen herhangi bir sağlayıcı için bir API anahtarı ayarlayın:

```bash
export GEMINI_API_KEY="your-key"
```

2. İsteğe bağlı olarak varsayılan bir modeli sabitleyin:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Agent’a isteğinizi söyleyin:

> Gün batımında sörf yapan dost canlısı bir ıstakozun 5 saniyelik sinematik videosunu oluştur.

Agent `video_generate` aracını otomatik olarak çağırır. Araç izin listesine alma gerekmez.

## Video oluşturduğunuzda ne olur

Video oluşturma eşzamansızdır. Agent bir oturumda `video_generate` çağırdığında:

1. OpenClaw isteği sağlayıcıya gönderir ve hemen bir görev kimliği döndürür.
2. Sağlayıcı işi arka planda işler (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ile 5 dakika arasında).
3. Video hazır olduğunda OpenClaw aynı oturumu dahili bir tamamlanma olayıyla uyandırır.
4. Agent tamamlanan videoyu özgün konuşmaya geri gönderir.

Bir iş devam ederken, aynı oturumdaki yinelenen `video_generate` çağrıları başka bir oluşturma başlatmak yerine mevcut görev durumunu döndürür. CLI üzerinden ilerlemeyi kontrol etmek için `openclaw tasks list` veya `openclaw tasks show <taskId>` kullanın.

Oturum destekli agent çalıştırmalarının dışında (örneğin doğrudan araç çağrıları), araç satır içi oluşturmaya geri döner ve son medya yolunu aynı tur içinde döndürür.

### Görev yaşam döngüsü

Her `video_generate` isteği dört durumdan geçer:

1. **queued** -- görev oluşturuldu, sağlayıcının kabul etmesi bekleniyor.
2. **running** -- sağlayıcı işliyor (genellikle sağlayıcıya ve çözünürlüğe bağlı olarak 30 saniye ile 5 dakika arasında).
3. **succeeded** -- video hazır; agent uyanır ve videoyu konuşmaya gönderir.
4. **failed** -- sağlayıcı hatası veya zaman aşımı; agent hata ayrıntılarıyla uyanır.

CLI üzerinden durumu kontrol edin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Yinelenmeyi önleme: geçerli oturum için bir video görevi zaten `queued` veya `running` durumundaysa, `video_generate` yeni bir görev başlatmak yerine mevcut görev durumunu döndürür. Yeni bir oluşturmayı tetiklemeden açıkça kontrol etmek için `action: "status"` kullanın.

## Desteklenen sağlayıcılar

| Sağlayıcı             | Varsayılan model                | Metin | Görsel ref                                          | Video ref        | API anahtarı                             |
| --------------------- | ------------------------------- | ----- | --------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Evet  | Evet (uzak URL)                                     | Evet (uzak URL)  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Evet  | En fazla 2 görsel (yalnızca I2V modelleri; ilk + son kare) | Hayır            | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Evet  | En fazla 2 görsel (rol aracılığıyla ilk + son kare) | Hayır            | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Evet  | En fazla 9 referans görsel                          | En fazla 3 video | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Evet  | 1 görsel                                            | Hayır            | `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Evet  | 1 görsel                                            | Hayır            | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Evet  | 1 görsel                                            | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Evet  | 1 görsel                                            | Hayır            | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Evet  | 1 görsel                                            | 1 video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Evet  | Evet (uzak URL)                                     | Evet (uzak URL)  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Evet  | 1 görsel                                            | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Evet  | 1 görsel                                            | Hayır            | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Evet  | 1 görsel (`kling`)                                  | Hayır            | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Evet  | 1 görsel                                            | 1 video          | `XAI_API_KEY`                            |

Bazı sağlayıcılar ek veya alternatif API anahtarı ortam değişkenlerini kabul eder. Ayrıntılar için ilgili [sağlayıcı sayfalarına](#related) bakın.

Çalışma zamanında kullanılabilir sağlayıcıları, modelleri ve çalışma zamanı modlarını incelemek için `video_generate action=list` çalıştırın.

### Bildirilmiş yetenek matrisi

Bu, `video_generate`, sözleşme testleri ve paylaşılan canlı tarama tarafından kullanılan açık mod sözleşmesidir.

| Sağlayıcı | `generate` | `imageToVideo` | `videoToVideo` | Bugünkü paylaşılan canlı şeritler                                                                                                       |
| --------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba   | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL’leri gerektirir                         |
| BytePlus  | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI   | Evet       | Evet           | Hayır          | Paylaşılan taramada yok; iş akışına özgü kapsam Comfy testlerinde yer alır                                                              |
| fal       | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| Google    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü mevcut tampon destekli Gemini/Veo taraması bu girdiyi kabul etmez  |
| MiniMax   | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| OpenAI    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; paylaşılan `videoToVideo` atlanır çünkü bu kuruluş/girdi yolu şu anda sağlayıcı tarafı inpaint/remix erişimi gerektirir |
| Qwen      | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı uzak `http(s)` video URL’leri gerektirir                         |
| Runway    | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` yalnızca seçilen model `runway/gen4_aleph` olduğunda çalışır                                |
| Together  | Evet       | Evet           | Hayır          | `generate`, `imageToVideo`                                                                                                               |
| Vydra     | Evet       | Evet           | Hayır          | `generate`; paylaşılan `imageToVideo` atlanır çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak bir görsel URL’si gerektirir |
| xAI       | Evet       | Evet           | Evet           | `generate`, `imageToVideo`; `videoToVideo` atlanır çünkü bu sağlayıcı şu anda uzak bir MP4 URL’si gerektirir                           |

## Araç parametreleri

### Gerekli

| Parametre | Tür    | Açıklama                                                                    |
| --------- | ------ | --------------------------------------------------------------------------- |
| `prompt`  | string | Oluşturulacak videonun metin açıklaması (`action: "generate"` için gereklidir) |

### İçerik girdileri

| Parametre   | Tür      | Açıklama                                                                                                                           |
| ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `image`     | string   | Tek referans görseli (yol veya URL)                                                                                               |
| `images`    | string[] | Birden çok referans görseli (en fazla 9)                                                                                          |
| `imageRoles`| string[] | Birleştirilmiş görsel listesine paralel isteğe bağlı konuma göre rol ipuçları. Kanonik değerler: `first_frame`, `last_frame`, `reference_image` |
| `video`     | string   | Tek referans videosu (yol veya URL)                                                                                               |
| `videos`    | string[] | Birden çok referans videosu (en fazla 4)                                                                                          |
| `videoRoles`| string[] | Birleştirilmiş video listesine paralel isteğe bağlı konuma göre rol ipuçları. Kanonik değer: `reference_video`                   |
| `audioRef`  | string   | Tek referans sesi (yol veya URL). Sağlayıcının ses girdilerini desteklediği durumlarda örneğin arka plan müziği veya ses referansı için kullanılır |
| `audioRefs` | string[] | Birden çok referans sesi (en fazla 3)                                                                                             |
| `audioRoles`| string[] | Birleştirilmiş ses listesine paralel isteğe bağlı konuma göre rol ipuçları. Kanonik değer: `reference_audio`                     |

Rol ipuçları sağlayıcıya olduğu gibi iletilir. Kanonik değerler
`VideoGenerationAssetRole` birleşiminden gelir ancak sağlayıcılar ek
rol string’lerini kabul edebilir. `*Roles` dizileri, karşılık gelen
referans listesinden daha fazla öğe içermemelidir; bir eksik bir fazla
hataları açık bir hata ile başarısız olur.
Bir yuvayı ayarsız bırakmak için boş string kullanın.

### Stil denetimleri

| Parametre         | Tür     | Açıklama                                                                                 |
| ----------------- | ------- | ---------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` veya `adaptive` |
| `resolution`      | string  | `480P`, `720P`, `768P` veya `1080P`                                                      |
| `durationSeconds` | number  | Hedef süre, saniye cinsinden (sağlayıcının desteklediği en yakın değere yuvarlanır)     |
| `size`            | string  | Sağlayıcı destekliyorsa boyut ipucu                                                      |
| `audio`           | boolean | Destekleniyorsa çıktıdaki üretilmiş sesi etkinleştirir. `audioRef*` (girdiler) ile farklıdır |
| `watermark`       | boolean | Destekleniyorsa sağlayıcı filigranını açar/kapatır                                       |

`adaptive`, sağlayıcıya özgü bir sentinel değeridir: yeteneklerinde
`adaptive` bildiren sağlayıcılara olduğu gibi iletilir (örneğin BytePlus
Seedance bunu, giriş görselinin boyutlarından oranı otomatik algılamak için
kullanır). Bunu bildirmeyen sağlayıcılar değeri araç sonucundaki
`details.ignoredOverrides` üzerinden gösterir; böylece yok sayıldığı görünür olur.

### Gelişmiş

| Parametre         | Tür    | Açıklama                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `action`          | string | `"generate"` (varsayılan), `"status"` veya `"list"`                                                                                                                                                                                                                                                                                             |
| `model`           | string | Sağlayıcı/model geçersiz kılması (ör. `runway/gen4.5`)                                                                                                                                                                                                                                                                                         |
| `filename`        | string | Çıktı dosya adı ipucu                                                                                                                                                                                                                                                                                                                           |
| `providerOptions` | object | JSON nesnesi olarak sağlayıcıya özgü seçenekler (ör. `{"seed": 42, "draft": true}`). Türlü şema bildiren sağlayıcılar anahtarları ve türleri doğrular; bilinmeyen anahtarlar veya uyuşmazlıklar, fallback sırasında adayın atlanmasına neden olur. Bildirilmiş şeması olmayan sağlayıcılar seçenekleri olduğu gibi alır. Her sağlayıcının ne kabul ettiğini görmek için `video_generate action=list` çalıştırın |

Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw zaten süreyi sağlayıcının desteklediği en yakın değere normalize eder ve ayrıca bir fallback sağlayıcı farklı bir denetim yüzeyi sunduğunda boyuttan en-boy oranına gibi çevrilmiş geometri ipuçlarını yeniden eşler. Gerçekten desteklenmeyen geçersiz kılmalar en iyi çabayla yok sayılır ve araç sonucunda uyarı olarak bildirilir. Kesin yetenek sınırları (örneğin çok fazla referans girdisi) gönderimden önce başarısız olur.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw sağlayıcı fallback’i sırasında süreyi veya geometriyi yeniden eşlediğinde, döndürülen `durationSeconds`, `size`, `aspectRatio` ve `resolution` değerleri gönderilen hali yansıtır; `details.normalization` ise istenenden uygulanana yapılan çeviriyi kaydeder.

Referans girdileri ayrıca çalışma zamanı modunu da seçer:

- Referans medya yok: `generate`
- Herhangi bir görsel referansı: `imageToVideo`
- Herhangi bir video referansı: `videoToVideo`
- Referans ses girdileri çözümlenen modu değiştirmez; görsel/video referanslarının seçtiği modun üzerine uygulanırlar ve yalnızca `maxInputAudios` bildiren sağlayıcılarla çalışırlar

Karışık görsel ve video referansları, kararlı bir paylaşılan yetenek yüzeyi değildir.
İstek başına tek bir referans türü tercih edin.

#### Fallback ve türlü seçenekler

Bazı yetenek kontrolleri, fallback katmanında uygulanır; araç sınırında değil.
Böylece birincil sağlayıcının sınırlarını aşan bir istek, yine de bunu
destekleyen bir fallback üzerinde çalışabilir:

- Etkin aday `maxInputAudios` bildirmiyorsa (veya bunu `0` olarak
  bildiriyorsa), istek ses referansları içerdiğinde aday atlanır ve
  sonraki aday denenir.
- Etkin adayın `maxDurationSeconds` değeri istenen
  `durationSeconds` değerinden düşükse ve aday bir
  `supportedDurationSeconds` listesi bildirmiyorsa, aday atlanır.
- İstek `providerOptions` içeriyorsa ve etkin aday açıkça türlü bir
  `providerOptions` şeması bildiriyorsa, sağlanan anahtarlar şemada yoksa
  veya değer türleri eşleşmiyorsa aday atlanır. Henüz şema bildirmemiş
  sağlayıcılar seçenekleri olduğu gibi alır (geriye dönük uyumlu geçiş).
  Bir sağlayıcı, boş bir şema bildirerek
  (`capabilities.providerOptions: {}`) tüm sağlayıcı seçeneklerinden açıkça
  vazgeçebilir; bu da tür uyuşmazlığındakiyle aynı atlamaya neden olur.

Bir istekteki ilk atlama nedeni `warn` düzeyinde günlüğe yazılır; böylece
operatörler birincil sağlayıcılarının neden pas geçildiğini görür.
Sonraki atlamalar, uzun fallback zincirlerini sessiz tutmak için
`debug` düzeyinde günlüğe yazılır. Her aday atlanırsa, toplanmış hata
her biri için atlama nedenini içerir.

## Eylemler

- **generate** (varsayılan) -- verilen prompt ve isteğe bağlı referans girdilerinden bir video oluşturur.
- **status** -- başka bir oluşturma başlatmadan geçerli oturum için işlemde olan video görevinin durumunu kontrol eder.
- **list** -- kullanılabilir sağlayıcıları, modelleri ve yeteneklerini gösterir.

## Model seçimi

Bir video oluşturulurken OpenClaw modeli şu sırayla çözümler:

1. **`model` araç parametresi** -- agent çağrıda bunu belirtirse.
2. **`videoGenerationModel.primary`** -- config içinden.
3. **`videoGenerationModel.fallbacks`** -- sırayla denenir.
4. **Otomatik algılama** -- geçerli kimlik doğrulaması olan sağlayıcıları kullanır; önce mevcut varsayılan sağlayıcı, ardından kalan sağlayıcılar alfabetik sırayla.

Bir sağlayıcı başarısız olursa, sonraki aday otomatik olarak denenir. Tüm adaylar başarısız olursa hata, her denemeden ayrıntılar içerir.

Video oluşturmanın yalnızca açık `model`, `primary` ve `fallbacks`
girdilerini kullanmasını istiyorsanız
`agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

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

| Sağlayıcı             | Notlar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba               | DashScope/Model Studio eşzamansız uç noktasını kullanır. Referans görseller ve videolar uzak `http(s)` URL’leri olmalıdır.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| BytePlus (1.0)        | Sağlayıcı kimliği `byteplus`. Modeller: `seedance-1-0-pro-250528` (varsayılan), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`. T2V modelleri (`*-t2v-*`) görsel girdilerini kabul etmez; I2V modelleri ve genel `*-pro-*` modelleri tek bir referans görseli (ilk kare) destekler. Görseli konumsal olarak geçin veya `role: "first_frame"` ayarlayın. Bir görsel sağlandığında T2V model kimlikleri otomatik olarak karşılık gelen I2V varyantına geçirilir. Desteklenen `providerOptions` anahtarları: `seed` (number), `draft` (boolean, 480p’yi zorlar), `camera_fixed` (boolean). |
| BytePlus Seedance 1.5 | [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin gerektirir. Sağlayıcı kimliği `byteplus-seedance15`. Model: `seedance-1-5-pro-251215`. Birleşik `content[]` API’sini kullanır. En fazla 2 giriş görseli destekler (first_frame + last_frame). Tüm girdiler uzak `https://` URL’leri olmalıdır. Her görselde `role: "first_frame"` / `"last_frame"` ayarlayın veya görselleri konumsal olarak geçin. `aspectRatio: "adaptive"` oranı giriş görselinden otomatik algılar. `audio: true`, `generate_audio` değerine eşlenir. `providerOptions.seed` (number) iletilir.                                                                                                  |
| BytePlus Seedance 2.0 | [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin gerektirir. Sağlayıcı kimliği `byteplus-seedance2`. Modeller: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`. Birleşik `content[]` API’sini kullanır. En fazla 9 referans görseli, 3 referans videosu ve 3 referans sesi destekler. Tüm girdiler uzak `https://` URL’leri olmalıdır. Her varlık için `role` ayarlayın — desteklenen değerler: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`. `aspectRatio: "adaptive"` oranı giriş görselinden otomatik algılar. `audio: true`, `generate_audio` değerine eşlenir. `providerOptions.seed` (number) iletilir. |
| ComfyUI               | İş akışı odaklı yerel veya bulut yürütme. Yapılandırılan grafik üzerinden metinden videoya ve görselden videoya desteği sunar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| fal                   | Uzun süren işler için kuyruk destekli akış kullanır. Yalnızca tek görsel referansı.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Google                | Gemini/Veo kullanır. Bir görsel veya bir video referansını destekler.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| MiniMax               | Yalnızca tek görsel referansı.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| OpenAI                | Yalnızca `size` geçersiz kılması iletilir. Diğer stil geçersiz kılmaları (`aspectRatio`, `resolution`, `audio`, `watermark`) bir uyarıyla yok sayılır.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Qwen                  | Alibaba ile aynı DashScope arka ucunu kullanır. Referans girdileri uzak `http(s)` URL’leri olmalıdır; yerel dosyalar daha başta reddedilir.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Runway                | Data URI’leri üzerinden yerel dosyaları destekler. Videodan videoya için `runway/gen4_aleph` gerekir. Yalnızca metinli çalıştırmalar `16:9` ve `9:16` en-boy oranlarını sunar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Together              | Yalnızca tek görsel referansı.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Vydra                 | Kimlik doğrulamayı düşüren yönlendirmelerden kaçınmak için doğrudan `https://www.vydra.ai/api/v1` kullanır. `veo3` paketli olarak yalnızca metinden videoya sunulur; `kling` uzak bir görsel URL’si gerektirir.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| xAI                   | Metinden videoya, görselden videoya ve uzak video düzenleme/uzatma akışlarını destekler.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Sağlayıcı yetenek modları

Paylaşılan video oluşturma sözleşmesi artık sağlayıcıların yalnızca düz toplu sınırlar yerine moda özgü yetenekler bildirmesine izin veriyor. Yeni sağlayıcı uygulamaları açık mod bloklarını tercih etmelidir:

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

`maxInputImages` ve `maxInputVideos` gibi düz toplu alanlar, dönüşüm modu desteğini bildirmek için yeterli değildir. Sağlayıcılar `generate`, `imageToVideo` ve `videoToVideo` modlarını açıkça bildirmelidir; böylece canlı testler, sözleşme testleri ve paylaşılan `video_generate` aracı mod desteğini deterministik olarak doğrulayabilir.

## Canlı testler

Paylaşılan paketli sağlayıcılar için isteğe bağlı canlı kapsam:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo wrapper:

```bash
pnpm test:live:media video
```

Bu canlı dosya, eksik sağlayıcı ortam değişkenlerini `~/.profile` içinden yükler, varsayılan olarak kayıtlı kimlik doğrulama profilleri yerine canlı/env API anahtarlarını tercih eder ve varsayılan olarak sürüm açısından güvenli bir smoke çalıştırır:

- taramadaki FAL dışı her sağlayıcı için `generate`
- bir saniyelik ıstakoz prompt’u
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı
  (varsayılan olarak `180000`)

FAL isteğe bağlıdır çünkü sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın çıkabilir:

```bash
pnpm test:live:media video --video-providers fal
```

Paylaşılan taramanın yerel medya ile güvenli şekilde çalıştırabildiği bildirilmiş dönüşüm modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:

- `capabilities.imageToVideo.enabled` olduğunda `imageToVideo`
- `capabilities.videoToVideo.enabled` olduğunda ve sağlayıcı/model paylaşılan taramada tampon destekli yerel video girdisini kabul ettiğinde `videoToVideo`

Bugün paylaşılan `videoToVideo` canlı şeridi şunları kapsar:

- yalnızca `runway/gen4_aleph` seçildiğinde `runway`

## Yapılandırma

Varsayılan video oluşturma modelini OpenClaw yapılandırmanızda ayarlayın:

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

- [Araçlara Genel Bakış](/tr/tools)
- [Arka Plan Görevleri](/tr/automation/tasks) -- eşzamansız video oluşturma için görev takibi
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
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agent-defaults)
- [Modeller](/tr/concepts/models)
