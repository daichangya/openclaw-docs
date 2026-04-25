---
read_when:
    - Aracı üzerinden müzik veya ses üretme
    - Müzik üretim sağlayıcılarını ve modellerini yapılandırma
    - music_generate araç parametrelerini anlama
summary: İş akışı destekli Plugin'ler dâhil paylaşılan sağlayıcılarla müzik üretin
title: Müzik üretimi
x-i18n:
    generated_at: "2026-04-25T13:59:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

`music_generate` aracı, aracının Google,
MiniMax ve iş akışı yapılandırılmış ComfyUI gibi sağlayıcılar üzerinden paylaşılan müzik üretim yeteneğiyle
müzik veya ses oluşturmasına olanak tanır.

Paylaşılan sağlayıcı destekli aracı oturumları için OpenClaw, müzik üretimini
arka plan görevi olarak başlatır, bunu görev defterinde izler, ardından parça hazır olduğunda
aracıyı yeniden uyandırır; böylece aracı tamamlanmış sesi özgün
kanala geri gönderebilir.

<Note>
Yerleşik paylaşılan araç yalnızca en az bir müzik üretim sağlayıcısı kullanılabilir olduğunda görünür. Aracınızın araçlarında `music_generate` görmüyorsanız `agents.defaults.musicGenerationModel` yapılandırın veya bir sağlayıcı API anahtarı ayarlayın.
</Note>

## Hızlı başlangıç

### Paylaşılan sağlayıcı destekli üretim

1. En az bir sağlayıcı için API anahtarı ayarlayın, örneğin `GEMINI_API_KEY` veya
   `MINIMAX_API_KEY`.
2. İsteğe bağlı olarak tercih ettiğiniz modeli ayarlayın:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. Aracıya şunu söyleyin: _"Neon bir şehirde gece sürüşü hakkında tempolu bir synthpop parçası üret."_

Aracı `music_generate` aracını otomatik olarak çağırır. Araç izin listesi gerekmez.

Oturum destekli aracı çalıştırması olmayan doğrudan eşzamanlı bağlamlarda, yerleşik
araç yine satır içi üretime geri döner ve son medya yolunu araç sonucunda döndürür.

Örnek prompt'lar:

```text
Vokalsiz, yumuşak yaylılarla sinematik bir piyano parçası üret.
```

```text
Gün doğumunda roket fırlatmak hakkında enerjik bir chiptune döngüsü üret.
```

### İş akışı odaklı Comfy üretimi

Paketlenmiş `comfy` Plugin'i, müzik üretim sağlayıcı kayıt defteri üzerinden paylaşılan `music_generate` aracına bağlanır.

1. Bir iş akışı JSON'u ile
   prompt/çıktı node'ları için `plugins.entries.comfy.config.music` yapılandırın.
2. Comfy Cloud kullanıyorsanız `COMFY_API_KEY` veya `COMFY_CLOUD_API_KEY` ayarlayın.
3. Aracıdan müzik isteyin veya aracı doğrudan çağırın.

Örnek:

```text
/tool music_generate prompt="Yumuşak tape dokulu sıcak ambient synth döngüsü"
```

## Paylaşılan paketlenmiş sağlayıcı desteği

| Sağlayıcı | Varsayılan model       | Referans girdileri | Desteklenen denetimler                                     | API anahtarı                            |
| --------- | ---------------------- | ------------------ | ---------------------------------------------------------- | -------------------------------------- |
| ComfyUI   | `workflow`             | En fazla 1 görsel  | İş akışıyla tanımlanan müzik veya ses                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google    | `lyria-3-clip-preview` | En fazla 10 görsel | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax   | `music-2.6`            | Yok                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`  | `MINIMAX_API_KEY`                      |

### Bildirilmiş yetenek matrisi

Bu, `music_generate`, sözleşme testleri
ve paylaşılan canlı tarama tarafından kullanılan açık mod sözleşmesidir.

| Sağlayıcı | `generate` | `edit` | Düzenleme sınırı | Paylaşılan canlı şeritler                                                     |
| --------- | ---------- | ------ | ---------------- | ----------------------------------------------------------------------------- |
| ComfyUI   | Evet       | Evet   | 1 görsel         | Paylaşılan taramada yok; `extensions/comfy/comfy.live.test.ts` ile kapsanır   |
| Google    | Evet       | Evet   | 10 görsel        | `generate`, `edit`                                                            |
| MiniMax   | Evet       | Hayır  | Yok              | `generate`                                                                    |

Çalışma zamanında kullanılabilir paylaşılan sağlayıcıları ve modelleri incelemek için
`action: "list"` kullanın:

```text
/tool music_generate action=list
```

Etkin oturum destekli müzik görevini incelemek için `action: "status"` kullanın:

```text
/tool music_generate action=status
```

Doğrudan üretim örneği:

```text
/tool music_generate prompt="Vinil dokulu ve hafif yağmurlu rüya gibi lo-fi hip hop" instrumental=true
```

## Yerleşik araç parametreleri

| Parametre         | Tür      | Açıklama                                                                                       |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Müzik üretim prompt'u (`action: "generate"` için gereklidir)                                   |
| `action`          | string   | `"generate"` (varsayılan), geçerli oturum görevi için `"status"` veya sağlayıcıları incelemek için `"list"` |
| `model`           | string   | Sağlayıcı/model geçersiz kılması, ör. `google/lyria-3-pro-preview` veya `comfy/workflow`       |
| `lyrics`          | string   | Sağlayıcı açık söz girdisini desteklediğinde isteğe bağlı şarkı sözleri                        |
| `instrumental`    | boolean  | Sağlayıcı desteklediğinde yalnızca enstrümantal çıktı isteği                                   |
| `image`           | string   | Tek referans görsel yolu veya URL'si                                                           |
| `images`          | string[] | Birden çok referans görseli (en fazla 10)                                                      |
| `durationSeconds` | number   | Sağlayıcı süre ipuçlarını desteklediğinde hedef süre saniye cinsinden                         |
| `timeoutMs`       | number   | Milisaniye cinsinden isteğe bağlı sağlayıcı istek zaman aşımı                                  |
| `format`          | string   | Sağlayıcı desteklediğinde çıktı biçimi ipucu (`mp3` veya `wav`)                               |
| `filename`        | string   | Çıktı dosya adı ipucu                                                                           |

Tüm sağlayıcılar tüm parametreleri desteklemez. OpenClaw yine de gönderimden önce
girdi sayısı gibi kesin sınırları doğrular. Sağlayıcı süreyi destekliyor ancak
istenen değerden daha kısa bir maksimum kullanıyorsa, OpenClaw otomatik olarak
desteklenen en yakın süreye sınırlar. Gerçekten desteklenmeyen isteğe bağlı ipuçları,
seçilen sağlayıcı veya model bunları karşılayamadığında uyarıyla birlikte yok sayılır.

Araç sonuçları uygulanan ayarları bildirir. OpenClaw sağlayıcı geri dönüşü sırasında süreyi sınırlandırdığında, dönen `durationSeconds` gönderilen değeri yansıtır ve `details.normalization.durationSeconds` istenenden uygulanana eşlemeyi gösterir.

## Paylaşılan sağlayıcı destekli yol için asenkron davranış

- Oturum destekli aracı çalıştırmaları: `music_generate` bir arka plan görevi oluşturur, hemen bir başlatıldı/görev yanıtı döndürür ve tamamlanan parçayı daha sonra takip aracı mesajında gönderir.
- Yineleme önleme: bu arka plan görevi aynı oturumda hâlâ `queued` veya `running` durumundaysa, sonraki `music_generate` çağrıları başka bir üretim başlatmak yerine görev durumunu döndürür.
- Durum sorgulama: yeni üretim başlatmadan etkin oturum destekli müzik görevini incelemek için `action: "status"` kullanın.
- Görev izleme: üretimin kuyruktaki, çalışan ve son durumlarını incelemek için `openclaw tasks list` veya `openclaw tasks show <taskId>` kullanın.
- Tamamlama uyandırması: OpenClaw, modelin kullanıcıya dönük takip mesajını kendisinin yazabilmesi için aynı oturuma dahili bir tamamlama olayı enjekte eder.
- Prompt ipucu: aynı oturumdaki sonraki kullanıcı/manuel turlar, bir müzik görevi zaten çalışıyorsa küçük bir çalışma zamanı ipucu alır; böylece model körlemesine yeniden `music_generate` çağırmaz.
- Oturumsuz geri dönüş: gerçek aracı oturumu olmayan doğrudan/yerel bağlamlar yine satır içinde çalışır ve aynı turda son ses sonucunu döndürür.

### Görev yaşam döngüsü

Her `music_generate` isteği dört durumdan geçer:

1. **queued** -- görev oluşturuldu, sağlayıcının bunu kabul etmesi bekleniyor.
2. **running** -- sağlayıcı işliyor (genellikle sağlayıcıya ve süreye bağlı olarak 30 saniye ile 3 dakika arası).
3. **succeeded** -- parça hazır; aracı uyanır ve konuşmaya gönderir.
4. **failed** -- sağlayıcı hatası veya zaman aşımı; aracı hata ayrıntılarıyla uyanır.

CLI'dan durumu kontrol edin:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Yineleme önleme: geçerli oturum için bir müzik görevi zaten `queued` veya `running` durumundaysa, `music_generate` yeni bir tane başlatmak yerine mevcut görev durumunu döndürür. Yeni üretim tetiklemeden açıkça kontrol etmek için `action: "status"` kullanın.

## Yapılandırma

### Model seçimi

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Sağlayıcı seçim sırası

Müzik üretilirken OpenClaw sağlayıcıları şu sırayla dener:

1. Aracı belirtirse, araç çağrısındaki `model` parametresi
2. Config'teki `musicGenerationModel.primary`
3. Sırayla `musicGenerationModel.fallbacks`
4. Yalnızca kimlik doğrulama destekli sağlayıcı varsayılanlarıyla otomatik algılama:
   - önce geçerli varsayılan sağlayıcı
   - ardından kayıtlı kalan müzik üretim sağlayıcıları sağlayıcı kimliği sırasıyla

Bir sağlayıcı başarısız olursa sonraki aday otomatik denenir. Hepsi başarısız olursa,
hata her denemeden ayrıntı içerir.

Müzik üretiminin yalnızca açık `model`, `primary` ve `fallbacks`
girdilerini kullanmasını istiyorsanız `agents.defaults.mediaGenerationAutoProviderFallback: false` ayarlayın.

## Sağlayıcı notları

- Google, Lyria 3 toplu üretimini kullanır. Geçerli paketlenmiş akış
  prompt, isteğe bağlı şarkı sözü metni ve isteğe bağlı referans görsellerini destekler.
- MiniMax, toplu `music_generation` uç noktasını kullanır. Geçerli paketlenmiş akış
  prompt, isteğe bağlı sözler, enstrümantal modu, süre yönlendirmesi ve
  mp3 çıktısını destekler.
- ComfyUI desteği iş akışı odaklıdır ve yapılandırılmış grafik ile
  prompt/çıktı alanları için node eşlemesine bağlıdır.

## Sağlayıcı yetenek modları

Paylaşılan müzik üretim sözleşmesi artık açık mod bildirimlerini destekler:

- salt prompt üretimi için `generate`
- istek bir veya daha fazla referans görsel içerdiğinde `edit`

Yeni sağlayıcı uygulamaları açık mod bloklarını tercih etmelidir:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

`maxInputImages`, `supportsLyrics` ve
`supportsFormat` gibi eski düz alanlar düzenleme desteğini duyurmak için yeterli değildir. Sağlayıcılar
`generate` ve `edit` modlarını açıkça bildirmelidir; böylece canlı testler, sözleşme testleri ve
paylaşılan `music_generate` aracı mod desteğini deterministik olarak doğrulayabilir.

## Doğru yolu seçme

- Model seçimi, sağlayıcı failover'ı ve yerleşik asenkron görev/durum akışı istediğinizde paylaşılan sağlayıcı destekli yolu kullanın.
- Özel iş akışı grafiğine veya paylaşılan paketlenmiş müzik yeteneğinin parçası olmayan bir sağlayıcıya ihtiyacınız olduğunda ComfyUI gibi bir Plugin yolunu kullanın.
- ComfyUI'ya özgü davranışta hata ayıklıyorsanız [ComfyUI](/tr/providers/comfy) sayfasına bakın. Paylaşılan sağlayıcı davranışında hata ayıklıyorsanız [Google (Gemini)](/tr/providers/google) veya [MiniMax](/tr/providers/minimax) ile başlayın.

## Canlı testler

Paylaşılan paketlenmiş sağlayıcılar için isteğe bağlı canlı kapsama:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Depo sarmalayıcısı:

```bash
pnpm test:live:media music
```

Bu canlı dosya eksik sağlayıcı env değişkenlerini `~/.profile` dosyasından yükler, varsayılan olarak
canlı/env API anahtarlarını saklanan auth profillerinin önünde tercih eder ve
sağlayıcı düzenleme modunu etkinleştirdiğinde hem `generate` hem de bildirilmiş `edit` kapsamını çalıştırır.

Bugün bunun anlamı:

- `google`: `generate` artı `edit`
- `minimax`: yalnızca `generate`
- `comfy`: paylaşılan sağlayıcı taraması değil, ayrı Comfy canlı kapsamı

Paketlenmiş ComfyUI müzik yolu için isteğe bağlı canlı kapsama:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy canlı dosyası ayrıca bu bölümler yapılandırıldığında comfy görsel ve video iş akışlarını da kapsar.

## İlgili

- [Background Tasks](/tr/automation/tasks) - ayrık `music_generate` çalıştırmaları için görev izleme
- [Configuration Reference](/tr/gateway/config-agents#agent-defaults) - `musicGenerationModel` config'i
- [ComfyUI](/tr/providers/comfy)
- [Google (Gemini)](/tr/providers/google)
- [MiniMax](/tr/providers/minimax)
- [Models](/tr/concepts/models) - model yapılandırması ve failover
- [Tools Overview](/tr/tools)
