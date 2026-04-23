---
read_when:
    - Yerel OpenClaw plugin'lerini oluşturuyorsunuz veya hata ayıklıyorsunuz
    - Plugin yetenek modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme hattı veya kayıt sistemi üzerinde çalışıyorsunuz
    - Sağlayıcı çalışma zamanı hook'ları veya kanal plugin'leri uyguluyorsunuz
sidebarTitle: Internals
summary: 'Plugin iç yapıları: yetenek modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Plugin İç Yapıları
x-i18n:
    generated_at: "2026-04-23T09:05:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin İç Yapıları

<Info>
  Bu, **derin mimari başvurusudur**. Pratik kılavuzlar için bkz.:
  - [Plugin yükleme ve kullanma](/tr/tools/plugin) — kullanıcı kılavuzu
  - [Başlangıç](/tr/plugins/building-plugins) — ilk plugin eğitimi
  - [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — bir mesajlaşma kanalı oluşturun
  - [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — bir model sağlayıcısı oluşturun
  - [SDK Genel Bakışı](/tr/plugins/sdk-overview) — import map ve kayıt API'si
</Info>

Bu sayfa, OpenClaw plugin sisteminin iç mimarisini kapsar.

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki genel **yerel plugin** modelidir. Her
yerel OpenClaw plugin'i bir veya daha fazla yetenek türüne kayıt olur:

| Yetenek               | Kayıt yöntemi                                    | Örnek plugin'ler                    |
| --------------------- | ------------------------------------------------ | ----------------------------------- |
| Metin çıkarımı        | `api.registerProvider(...)`                      | `openai`, `anthropic`               |
| CLI çıkarım backend'i | `api.registerCliBackend(...)`                    | `openai`, `anthropic`               |
| Konuşma               | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                    |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`         | `openai`                            |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                  |
| Görsel üretimi        | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Müzik üretimi         | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                 |
| Video üretimi         | `api.registerVideoGenerationProvider(...)`       | `qwen`                              |
| Web getirme           | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Web arama             | `api.registerWebSearchProvider(...)`             | `google`                            |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                       | `msteams`, `matrix`                 |

Sıfır yetenek kaydeden ancak hook'lar, araçlar veya
hizmetler sağlayan bir plugin, **eski yalnızca-hook** plugin'idir. Bu kalıp hâlâ tamamen desteklenir.

### Harici uyumluluk yaklaşımı

Yetenek modeli core'a yerleştirildi ve bugün paketlenmiş/yerel plugin'ler
tarafından kullanılıyor, ancak harici plugin uyumluluğu yine de
"dışa aktarılıyor, öyleyse donmuştur" yaklaşımından daha sıkı bir çıtaya ihtiyaç duyar.

Mevcut yönerge:

- **mevcut harici plugin'ler:** hook tabanlı entegrasyonları çalışır halde tutun; bunu
  uyumluluk tabanı olarak değerlendirin
- **yeni paketlenmiş/yerel plugin'ler:** satıcıya özgü iç erişimler veya yeni yalnızca-hook tasarımları yerine
  açık yetenek kaydını tercih edin
- **yetenek kaydını benimseyen harici plugin'ler:** izin verilir, ancak
  dokümanlar bir sözleşmeyi açıkça kararlı olarak işaretlemedikçe yeteneğe özgü yardımcı yüzeyleri gelişmekte olan yapılar olarak değerlendirin

Pratik kural:

- yetenek kayıt API'leri hedeflenen yöndür
- geçiş sırasında eski hook'lar, harici plugin'ler için hâlâ en güvenli
  bozulmasız yoldur
- dışa aktarılan yardımcı alt yolların hepsi eşit değildir; tesadüfi yardımcı dışa aktarımlarını değil,
  dar ve belgelenmiş sözleşmeyi tercih edin

### Plugin şekilleri

OpenClaw, yüklenen her plugin'i gerçek
kayıt davranışına göre bir şekle sınıflandırır (yalnızca statik meta veriye göre değil):

- **plain-capability** -- tam olarak bir yetenek türü kaydeder (örneğin
  `mistral` gibi yalnızca sağlayıcı plugin'i)
- **hybrid-capability** -- birden fazla yetenek türü kaydeder (örneğin
  `openai`, metin çıkarımı, konuşma, medya anlama ve görsel
  üretiminin sahibidir)
- **hook-only** -- yalnızca hook kaydeder (türlü veya özel), yetenek,
  araç, komut veya hizmet kaydetmez
- **non-capability** -- araçlar, komutlar, hizmetler veya rotalar kaydeder ama
  yetenek kaydetmez

Bir plugin'in şeklini ve yetenek dökümünü görmek için `openclaw plugins inspect <id>` kullanın. Ayrıntılar için [CLI başvurusu](/tr/cli/plugins#inspect) bölümüne bakın.

### Eski hook'lar

`before_agent_start` hook'u, yalnızca-hook plugin'leri için bir uyumluluk yolu olarak desteklenmeye devam eder. Gerçek dünyadaki eski plugin'ler hâlâ buna bağımlıdır.

Yön:

- çalışır halde tutun
- eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma işleri için `before_model_resolve` tercih edin
- prompt mutasyonu işleri için `before_prompt_build` tercih edin
- yalnızca gerçek kullanım düştükten ve fixture kapsamı geçiş güvenliğini kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda
şu etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlamı                                                       |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Yapılandırma düzgün ayrıştırılır ve plugin'ler çözülür       |
| **compatibility advisory** | Plugin desteklenen ama daha eski bir kalıp kullanıyor (ör. `hook-only`) |
| **legacy warning**         | Plugin kullanımdan kaldırılmış `before_agent_start` kullanıyor |
| **hard error**             | Yapılandırma geçersiz veya plugin yüklenemedi                |

Bugün ne `hook-only` ne de `before_agent_start` plugin'inizi bozmaz --
`hook-only` yalnızca bilgilendiricidir ve `before_agent_start` yalnızca bir uyarı tetikler. Bu
sinyaller `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimariye genel bakış

OpenClaw'ın plugin sistemi dört katmandan oluşur:

1. **Manifest + keşif**
   OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden,
   genel plugin köklerinden ve paketlenmiş plugin'lerden aday plugin'leri bulur. Keşif önce yerel
   `openclaw.plugin.json` manifest'lerini ve desteklenen bundle manifest'lerini okur.
2. **Etkinleştirme + doğrulama**
   Core, keşfedilmiş bir plugin'in etkin, devre dışı, engelli veya
   bellek gibi özel bir slot için seçilmiş olup olmadığına karar verir.
3. **Çalışma zamanı yükleme**
   Yerel OpenClaw plugin'leri jiti aracılığıyla süreç içinde yüklenir ve
   yetenekleri merkezi bir kayıt sistemine kaydeder. Uyumlu bundle'lar
   çalışma zamanı kodu içe aktarılmadan kayıt girdilerine normalize edilir.
4. **Yüzey tüketimi**
   OpenClaw'ın geri kalanı, araçları, kanalları, sağlayıcı
   kurulumunu, hook'ları, HTTP rotalarını, CLI komutlarını ve hizmetleri ortaya çıkarmak için kayıt sistemini okur.

Özellikle plugin CLI için, kök komut keşfi iki aşamaya bölünmüştür:

- ayrıştırma zamanı meta verisi `registerCli(..., { descriptors: [...] })` üzerinden gelir
- gerçek plugin CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, OpenClaw'ın ayrıştırmadan önce kök komut adlarını ayırmasına izin verirken plugin'e ait CLI kodunu plugin içinde tutar.

Önemli tasarım sınırı:

- keşif + yapılandırma doğrulaması, plugin kodu yürütülmeden
  **manifest/şema meta verisinden**
  çalışabilmelidir
- yerel çalışma zamanı davranışı plugin modülünün `register(api)` yolundan gelir

Bu ayrım, OpenClaw'ın tam çalışma zamanı etkin olmadan önce yapılandırmayı doğrulamasına,
eksik/devre dışı plugin'leri açıklamasına ve UI/şema ipuçları oluşturmasına olanak tanır.

### Kanal plugin'leri ve paylaşılan message aracı

Kanal plugin'lerinin normal sohbet eylemleri için ayrı bir gönder/düzenle/tepki aracı kaydetmesi gerekmez. OpenClaw bir paylaşılan `message` aracını core içinde tutar ve kanal plugin'leri bunun arkasındaki kanala özgü keşif ve yürütmenin sahibidir.

Mevcut sınır şudur:

- core, paylaşılan `message` araç host'unun, prompt kablolamasının, oturum/thread
  muhasebesinin ve yürütme dispatch'inin sahibidir
- kanal plugin'leri, kapsamlı eylem keşfinin, yetenek keşfinin ve kanala özgü
  tüm şema parçacıklarının sahibidir
- kanal plugin'leri, konuşma kimliklerinin thread kimliklerini nasıl kodladığı veya
  üst konuşmalardan nasıl miras aldığı gibi sağlayıcıya özgü oturum konuşma dilbilgisinin sahibidir
- kanal plugin'leri son eylemi kendi eylem adaptörleri üzerinden yürütür

Kanal plugin'leri için SDK yüzeyi
`ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif
çağrısı, bir plugin'in görünür eylemlerini, yeteneklerini ve şema
katkılarını birlikte döndürmesine olanak tanır; böylece bu parçalar birbirinden kopmaz.

Kanala özgü bir message-tool parametresi, yerel yol veya uzak medya URL'si gibi
bir medya kaynağı taşıdığında plugin ayrıca
`describeMessageTool(...)` içinden `mediaSourceParams` döndürmelidir. Core bu açık
listeyi, plugin'e ait parametre adlarını sabit kodlamadan sandbox yol normalizasyonu ve
giden medya erişim ipuçları uygulamak için kullanır.
Orada kanal genelinde tek düz liste değil, eylem kapsamlı eşlemeler tercih edin; böylece
yalnızca profile'a ait bir medya parametresi `send` gibi ilişkisiz eylemlerde normalleştirilmez.

Core, çalışma zamanı kapsamını bu keşif adımına geçirir. Önemli alanlar şunları içerir:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı plugin'ler için önemlidir. Bir kanal, aktif hesap, mevcut oda/thread/mesaj veya
güvenilir istemci kimliğine göre mesaj eylemlerini gizleyebilir veya açığa çıkarabilir; bunun için core `message` aracında kanala özgü dallar sabit kodlanmaz.

Bu yüzden gömülü runner yönlendirme değişiklikleri hâlâ plugin işidir: runner,
paylaşılan `message` aracının geçerli dönüş için doğru kanala ait
yüzeyi açığa çıkarması amacıyla mevcut sohbet/oturum kimliğini plugin
keşif sınırına iletmekten sorumludur.

Kanala ait yürütme yardımcıları için paketlenmiş plugin'ler, yürütme
çalışma zamanını kendi extension modülleri içinde tutmalıdır. Core artık
`src/agents/tools` altında Discord,
Slack, Telegram veya WhatsApp message-action çalışma zamanlarının sahibi değildir.
Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş
plugin'ler kendi yerel çalışma zamanı kodlarını doğrudan
extension sahibi modüllerinden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK seam'leri için de geçerlidir: core,
Slack, Discord, Signal,
WhatsApp veya benzeri extension'lar için kanala özgü kolaylık barrel'larını içe aktarmamalıdır. Core bir davranışa ihtiyaç duyuyorsa ya
paketlenmiş plugin'in kendi `api.ts` / `runtime-api.ts` barrel'ını tüketmeli ya da ihtiyacı
paylaşılan SDK içinde dar bir genel yeteneğe yükseltmelidir.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel yoldur
- `actions.handleAction("poll")`, kanala özgü anket semantiği veya ek anket parametreleri için tercih edilen yoldur

Core artık paylaşılan anket ayrıştırmasını, plugin anket dispatch'i eylemi reddettikten sonraya erteler; böylece plugin'e ait anket işleyicileri, önce genel anket ayrıştırıcısı tarafından engellenmeden kanala özgü anket alanlarını kabul edebilir.

Tam başlangıç sırası için [Yükleme hattı](#load-pipeline) bölümüne bakın.

## Yetenek sahipliği modeli

OpenClaw, yerel bir plugin'i ilişkisiz entegrasyonların bir toplamı olarak değil,
bir **şirketin** veya bir **özelliğin** sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket plugin'i genellikle o şirketin OpenClaw'a dönük
  tüm yüzeylerinin sahibi olmalıdır
- bir özellik plugin'i genellikle sunduğu tam özellik yüzeyinin sahibi olmalıdır
- kanallar, sağlayıcı davranışını ad hoc yeniden uygulamak yerine paylaşılan core yeteneklerini tüketmelidir

Örnekler:

- paketlenmiş `openai` plugin'i OpenAI model-sağlayıcı davranışının ve OpenAI
  konuşma + gerçek zamanlı ses + medya anlama + görsel üretim davranışının sahibidir
- paketlenmiş `elevenlabs` plugin'i ElevenLabs konuşma davranışının sahibidir
- paketlenmiş `microsoft` plugin'i Microsoft konuşma davranışının sahibidir
- paketlenmiş `google` plugin'i Google model-sağlayıcı davranışının yanı sıra Google
  medya anlama + görsel üretim + web arama davranışının sahibidir
- paketlenmiş `firecrawl` plugin'i Firecrawl web-getirme davranışının sahibidir
- paketlenmiş `minimax`, `mistral`, `moonshot` ve `zai` plugin'leri kendi
  medya anlama backend'lerinin sahibidir
- paketlenmiş `qwen` plugin'i Qwen metin-sağlayıcı davranışının yanı sıra
  medya anlama ve video üretim davranışının sahibidir
- `voice-call` plugin'i bir özellik plugin'idir: çağrı taşıma, araçlar,
  CLI, rotalar ve Twilio medya-akışı köprülemesinin sahibidir, ancak satıcı plugin'lerini doğrudan
  içe aktarmak yerine paylaşılan konuşma ile
  gerçek zamanlı transkripsiyon ve gerçek zamanlı ses yeteneklerini tüketir

Hedeflenen son durum şudur:

- OpenAI, metin modelleri, konuşma, görseller ve
  gelecekte video'yu kapsasa bile tek bir plugin içinde yaşar
- başka bir satıcı da kendi yüzey alanı için aynısını yapabilir
- kanallar, sağlayıcının hangi satıcı plugin'ine ait olduğunu umursamaz; core tarafından açığa çıkarılan
  paylaşılan yetenek sözleşmesini tüketir

Bu temel ayrımdır:

- **plugin** = sahiplik sınırı
- **capability** = birden fazla plugin'in uygulayabileceği veya tüketebileceği core sözleşmesi

Dolayısıyla OpenClaw video gibi yeni bir alan eklerse ilk soru
"hangi sağlayıcı video işlemeyi sabit kodlamalı?" değildir. İlk soru "core video yetenek sözleşmesi
nedir?" olmalıdır. Bu sözleşme bir kez var olduğunda satıcı plugin'leri buna kayıt olabilir ve kanal/özellik plugin'leri bunu tüketebilir.

Yetenek henüz yoksa doğru adım genellikle şudur:

1. eksik yeteneği core'da tanımlayın
2. bunu plugin API/çalışma zamanı üzerinden türlü biçimde açığa çıkarın
3. kanalları/özellikleri bu yeteneğe bağlayın
4. satıcı plugin'lerinin uygulama kaydetmesine izin verin

Bu, sahipliği açık tutarken tek bir satıcıya veya tek seferlik bir plugin'e
özgü kod yoluna bağlı core davranışını önler.

### Yetenek katmanlaması

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

- **core yetenek katmanı**: paylaşılan orkestrasyon, ilke, fallback, yapılandırma
  birleştirme kuralları, teslimat semantiği ve türlü sözleşmeler
- **satıcı plugin katmanı**: satıcıya özgü API'ler, auth, model katalogları, konuşma
  sentezi, görsel üretimi, gelecekteki video backend'leri, kullanım uç noktaları
- **kanal/özellik plugin katmanı**: core yeteneklerini tüketen ve
  bunları bir yüzeyde sunan Slack/Discord/voice-call/vb. entegrasyonu

Örneğin TTS şu yapıyı izler:

- core, yanıt zamanı TTS ilkesinin, fallback sırasının, tercihlerin ve kanal teslimatının sahibidir
- `openai`, `elevenlabs` ve `microsoft`, sentez uygulamalarının sahibidir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Aynı kalıp gelecekteki yetenekler için de tercih edilmelidir.

### Çok yetenekli şirket plugin'i örneği

Bir şirket plugin'i dışarıdan bakıldığında tutarlı hissettirmelidir. OpenClaw, modeller, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya
anlama, görsel üretimi, video üretimi, web getirme ve web arama için paylaşılan
sözleşmelere sahipse, bir satıcı tüm yüzeylerinin sahibini tek yerde olabilir:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — SpeechProviderPlugin arayüzünü doğrudan uygulayın
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Önemli olan tam yardımcı adları değildir. Şekil önemlidir:

- tek bir plugin satıcı yüzeyinin sahibidir
- core hâlâ yetenek sözleşmelerinin sahibidir
- kanallar ve özellik plugin'leri satıcı kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, plugin'in
  sahibi olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw zaten görsel/ses/video anlamayı tek bir paylaşılan
yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

1. core medya anlama sözleşmesini tanımlar
2. satıcı plugin'leri uygulanabildiği yerde `describeImage`, `transcribeAudio` ve
   `describeVideo` kaydeder
3. kanal ve özellik plugin'leri, doğrudan satıcı koduna
   bağlanmak yerine paylaşılan core davranışını tüketir

Bu, bir sağlayıcının video varsayımlarını core'a bake etmeyi önler. Plugin
satıcı yüzeyinin sahibidir; core ise yetenek sözleşmesinin ve fallback davranışının sahibidir.

Video üretimi zaten aynı sıralamayı kullanır: core türlü
yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir ve satıcı plugin'leri
bunlara karşı `api.registerVideoGenerationProvider(...)` uygulamaları kaydeder.

Somut bir devreye alma kontrol listesine mi ihtiyacınız var? Bkz.
[Capability Cookbook](/tr/plugins/architecture).

## Sözleşmeler ve yaptırım

Plugin API yüzeyi kasıtlı olarak türlüdür ve
`OpenClawPluginApi` içinde merkezileştirilmiştir. Bu sözleşme desteklenen kayıt noktalarını ve
bir plugin'in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun neden önemli olduğu:

- plugin yazarları tek bir kararlı dahili standart elde eder
- core, aynı
  sağlayıcı kimliğini iki plugin'in kaydetmesi gibi yinelenen sahipliği reddedebilir
- başlangıç, bozuk kayıt için eyleme geçirilebilir tanılar sunabilir
- sözleşme testleri paketlenmiş plugin sahipliğini zorlayabilir ve sessiz kaymayı önleyebilir

İki yaptırım katmanı vardır:

1. **çalışma zamanı kayıt yaptırımı**
   Plugin kayıt sistemi, plugin'ler yüklenirken kayıtları doğrular. Örnekler:
   yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcı kimlikleri ve bozuk
   kayıtlar, tanımsız davranış yerine plugin tanıları üretir.
2. **sözleşme testleri**
   Paketlenmiş plugin'ler test çalıştırmaları sırasında sözleşme kayıtlarında yakalanır; böylece
   OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu, model
   sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt
   sahipliği için kullanılır.

Pratik etki şudur: OpenClaw, hangi
yüzeyin hangi plugin'e ait olduğunu en baştan bilir. Bu da core ve kanalların sorunsuz bileşim kurmasını sağlar çünkü sahiplik örtük olmak yerine
beyan edilmiş, türlü ve test edilebilirdir.

### Bir sözleşmede ne yer almalıdır

İyi plugin sözleşmeleri:

- türlüdür
- küçüktür
- yeteneğe özgüdür
- core'a aittir
- birden fazla plugin tarafından yeniden kullanılabilir
- satıcı bilgisi olmadan kanallar/özellikler tarafından tüketilebilir

Kötü plugin sözleşmeleri:

- core içinde gizlenmiş satıcıya özgü ilke
- kayıt sistemini atlayan tek seferlik plugin kaçış kapıları
- doğrudan satıcı uygulamasına uzanan kanal kodu
- `OpenClawPluginApi` veya
  `api.runtime` parçası olmayan ad hoc çalışma zamanı nesneleri

Emin olmadığınızda soyutlama seviyesini yükseltin: önce yeteneği tanımlayın, ardından plugin'lerin buna takılmasına izin verin.

## Yürütme modeli

Yerel OpenClaw plugin'leri Gateway ile **aynı süreçte** çalışır. Bunlar
sandbox içine alınmaz. Yüklenen bir yerel plugin, core koduyla aynı süreç düzeyi güven sınırına sahiptir.

Sonuçları:

- bir yerel plugin araçlar, ağ işleyicileri, hook'lar ve hizmetler kaydedebilir
- yerel bir plugin hatası gateway'i çökertebilir veya kararsızlaştırabilir
- kötü niyetli bir yerel plugin, OpenClaw süreci içinde keyfi kod yürütmeye eşdeğerdir

Uyumlu bundle'lar varsayılan olarak daha güvenlidir çünkü OpenClaw şu anda bunları
meta veri/içerik paketleri olarak ele alır. Mevcut sürümlerde bu çoğunlukla paketlenmiş
Skills anlamına gelir.

Paketlenmemiş plugin'ler için izin listeleri ve açık kurulum/yükleme yolları kullanın. Çalışma alanı plugin'lerini üretim varsayılanları olarak değil, geliştirme zamanı kodu olarak değerlendirin.

Paketlenmiş çalışma alanı paket adları için, plugin kimliğini npm
adına sabitli tutun: varsayılan olarak `@openclaw/<id>` veya
paket kasıtlı olarak daha dar bir plugin rolünü açığa çıkarıyorsa
`-provider`, `-plugin`, `-speech`, `-sandbox` veya `-media-understanding` gibi onaylı türlü sonekler kullanın.

Önemli güven notu:

- `plugins.allow`, **kaynak kökenine** değil **plugin kimliklerine** güvenir.
- Paketlenmiş bir plugin ile aynı kimliğe sahip bir çalışma alanı plugin'i, bu çalışma alanı plugin'i etkinleştirildiğinde/izin listesine alındığında
  paketlenmiş kopyayı kasıtlı olarak gölgeler.
- Bu normaldir ve yerel geliştirme, yama testi ve hotfix'ler için kullanışlıdır.
- Paketlenmiş plugin güveni, kurulum meta verisinden değil yükleme anındaki
  kaynak anlık görüntüsünden — manifest ve diskteki koddan — çözülür. Bozulmuş
  veya değiştirilmiş bir kurulum kaydı, gerçek kaynağın iddia ettiğinin ötesinde
  bir paketlenmiş plugin'in güven yüzeyini sessizce genişletemez.

## Dışa aktarma sınırı

OpenClaw uygulama kolaylıklarını değil, yetenekleri dışa aktarır.

Yetenek kaydını genel tutun. Sözleşme olmayan yardımcı dışa aktarımlarını budayın:

- paketlenmiş plugin'e özgü yardımcı alt yollar
- genel API olarak amaçlanmayan çalışma zamanı borulama alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/onboarding yardımcıları

Bazı paketlenmiş plugin yardımcı alt yolları, uyumluluk ve paketlenmiş plugin bakımı için
oluşturulmuş SDK dışa aktarma
haritasında hâlâ kalmaktadır. Güncel örnekler arasında
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve birkaç `plugin-sdk/matrix*` seam bulunur. Bunları,
yeni üçüncü taraf plugin'ler için önerilen SDK kalıbı olarak değil,
ayrılmış uygulama ayrıntısı dışa aktarımları olarak değerlendirin.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunu yapar:

1. aday plugin köklerini keşfeder
2. yerel veya uyumlu bundle manifest'lerini ve paket meta verisini okur
3. güvensiz adayları reddeder
4. plugin yapılandırmasını normalize eder (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri yükler: build edilmiş paketlenmiş modüller yerel bir yükleyici kullanır;
   build edilmemiş yerel plugin'ler jiti kullanır
7. yerel `register(api)` hook'larını çağırır ve kayıtları plugin kayıt sistemine toplar
8. kayıt sistemini komutlara/çalışma zamanı yüzeylerine açığa çıkarır

<Note>
`activate`, `register` için eski bir takma addır — yükleyici hangisi varsa onu çözümler (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketlenmiş plugin'ler `register` kullanır; yeni plugin'ler için `register` tercih edin.
</Note>

Güvenlik geçitleri çalışma zamanı yürütmesinden **önce** gerçekleşir. Adaylar
giriş plugin kökünden dışarı taşıyorsa, yol herkes tarafından yazılabiliyorsa veya
paketlenmemiş plugin'ler için yol sahipliği şüpheli görünüyorsa engellenir.

### Manifest-first davranış

Manifest, kontrol düzleminin doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- plugin'i tanımlamak
- beyan edilmiş kanalları/Skills'i/yapılandırma şemasını veya bundle yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verisini göstermek
- plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel plugin'ler için çalışma zamanı modülü veri düzlemi parçasıdır. Hook'lar, araçlar, komutlar veya sağlayıcı akışları gibi
gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)` veya `setupEntry`'nin yerini almazlar.
İlk canlı etkinleştirme tüketicileri artık manifest komut, kanal ve sağlayıcı ipuçlarını
daha geniş kayıt sistemi somutlaştırmasından önce plugin yüklemeyi daraltmak için kullanır:

- CLI yükleme, istenen birincil komutun sahibi olan plugin'lere daraltılır
- kanal kurulumu/plugin çözümlemesi, istenen
  kanal kimliğinin sahibi olan plugin'lere daraltılır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen
  sağlayıcı kimliğinin sahibi olan plugin'lere daraltılır

Kurulum keşfi artık, kurulum zamanı çalışma zamanı hook'larına hâlâ ihtiyaç duyan plugin'ler için
`setup-api`'ye geri düşmeden önce aday plugin'leri daraltmak üzere `setup.providers` ve
`setup.cliBackends` gibi tanımlayıcıya ait kimlikleri tercih eder. Keşfedilen birden fazla plugin aynı normalize edilmiş kurulum sağlayıcısı veya CLI backend
kimliğini iddia ederse, kurulum araması keşif sırasına güvenmek yerine belirsiz sahibini reddeder.

### Yükleyicinin önbelleğe aldıkları

OpenClaw süreç içinde kısa ömürlü önbellekleri şunlar için tutar:

- keşif sonuçları
- manifest kayıt verileri
- yüklenmiş plugin kayıt sistemleri

Bu önbellekler ani başlangıç yükünü ve tekrar eden komut maliyetini azaltır. Bunları
kalıcılık değil, kısa ömürlü performans önbellekleri olarak düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek pencerelerini `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt sistemi modeli

Yüklenen plugin'ler rastgele core global'lerini doğrudan mutasyona uğratmaz. Bunlar
merkezi bir plugin kayıt sistemine kayıt olur.

Kayıt sistemi şunları izler:

- plugin kayıtları (kimlik, kaynak, origin, durum, tanılar)
- araçlar
- eski hook'lar ve türlü hook'lar
- kanallar
- sağlayıcılar
- gateway RPC işleyicileri
- HTTP rotaları
- CLI kaydedicileri
- arka plan hizmetleri
- plugin'e ait komutlar

Core özellikler daha sonra plugin modülleriyle doğrudan konuşmak yerine bu kayıt sisteminden okur.
Bu, yüklemeyi tek yönlü tutar:

- plugin modülü -> kayıt sistemi kaydı
- core çalışma zamanı -> kayıt sistemi tüketimi

Bu ayrım bakım yapılabilirlik için önemlidir. Çoğu core yüzeyin
tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "kayıt sistemini oku", "her plugin modülü için özel durum yaz" değil.

## Konuşma bağlama callback'leri

Bir konuşmayı bağlayan plugin'ler, bir onay çözümlendiğinde tepki verebilir.

Bir bağlama isteği onaylandıktan veya reddedildikten sonra callback almak için
`api.onConversationBindingResolved(...)` kullanın:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Bu plugin + konuşma için artık bir bağlama var.
        console.log(event.binding?.conversationId);
        return;
      }

      // İstek reddedildi; yerel bekleyen durumu temizleyin.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Callback payload alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanan istekler için çözümlenen bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderen kimliği ve
  konuşma meta verisi

Bu callback yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlayabileceğini değiştirmez
ve core onay işlemi tamamlandıktan sonra çalışır.

## Sağlayıcı çalışma zamanı hook'ları

Sağlayıcı plugin'lerinin artık iki katmanı vardır:

- manifest meta verisi: çalışma zamanı yüklenmeden önce ucuz sağlayıcı env-auth araması için `providerAuthEnvVars`,
  auth paylaşan sağlayıcı varyantları için `providerAuthAliases`,
  çalışma zamanı yüklenmeden önce ucuz kanal env/kurulum araması için `channelEnvVars`,
  ayrıca çalışma zamanı yüklenmeden önce ucuz onboarding/auth-choice etiketleri ve
  CLI bayrak meta verisi için `providerAuthChoices`
- yapılandırma zamanı hook'ları: `catalog` / eski `discovery` ile `applyConfigDefaults`
- çalışma zamanı hook'ları: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw hâlâ genel agent döngüsünün, failover'ın, transkript işlemenin ve
araç ilkesinin sahibidir. Bu hook'lar, tam bir özel çıkarım taşımasına ihtiyaç duymadan sağlayıcıya özgü davranış için extension yüzeyidir.

Genel auth/durum/model-picker yollarının plugin
çalışma zamanını yüklemeden görmesi gereken env tabanlı kimlik bilgileri varsa manifest `providerAuthEnvVars` kullanın.
Bir sağlayıcı kimliği başka bir sağlayıcı kimliğinin env değişkenlerini, auth profile'larını, yapılandırma destekli auth'unu ve API-key onboarding seçimini yeniden kullanacaksa manifest `providerAuthAliases` kullanın. Onboarding/auth-choice
CLI yüzeylerinin sağlayıcının choice kimliğini, grup etiketlerini ve basit
tek bayraklı auth bağlantısını sağlayıcı çalışma zamanını yüklemeden bilmesi gerektiğinde manifest `providerAuthChoices` kullanın. Operatöre dönük onboarding etiketleri veya OAuth
client-id/client-secret kurulum değişkenleri gibi ipuçları için sağlayıcı çalışma zamanı
`envVars` alanını koruyun.

Bir kanalın, genel shell-env fallback'i, yapılandırma/durum kontrolleri veya kurulum istemlerinin kanal çalışma zamanını yüklemeden görmesi gereken env güdümlü auth veya kurulumu varsa
manifest `channelEnvVars` kullanın.

### Hook sırası ve kullanım

Model/sağlayıcı plugin'leri için OpenClaw, hook'ları kabaca şu sırayla çağırır.
"Ne zaman kullanılır" sütunu hızlı karar kılavuzudur.

| #   | Hook                              | Ne yapar                                                                                                       | Ne zaman kullanılır                                                                                                                            |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` üretimi sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                  | Sağlayıcı bir katalogun veya temel URL varsayılanlarının sahibiyse                                                                             |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel yapılandırma varsayılanlarını uygular            | Varsayılanlar auth modu, env veya sağlayıcı model ailesi semantiğine bağlıysa                                                                  |
| --  | _(yerleşik model lookup)_         | OpenClaw önce normal registry/katalog yolunu dener                                                            | _(bir plugin hook'u değildir)_                                                                                                                 |
| 3   | `normalizeModelId`                | Lookup öncesi eski veya preview model-id takma adlarını normalize eder                                        | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğinin sahibiyse                                                                  |
| 4   | `normalizeTransport`              | Genel model birleştirmesinden önce sağlayıcı ailesi `api` / `baseUrl` değerlerini normalize eder             | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğinin sahibiyse                                               |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalize eder                | Sağlayıcının plugin ile birlikte yaşaması gereken bir yapılandırma temizliğine ihtiyacı varsa; paketlenmiş Google ailesi yardımcıları da desteklenen Google yapılandırma girdileri için geri dayanak sağlar |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel streaming-usage uyumluluk yeniden yazımlarını uygular                      | Sağlayıcının uç nokta güdümlü yerel streaming usage meta veri düzeltmelerine ihtiyacı varsa                                                   |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı auth yüklemesinden önce yapılandırma sağlayıcıları için env-marker auth'u çözümler            | Sağlayıcının, sağlayıcıya ait env-marker API-key çözümlemesine ihtiyacı varsa; burada `amazon-bedrock` için yerleşik bir AWS env-marker çözücü de vardır |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/self-hosted veya yapılandırma destekli auth'u yüzeye çıkarır               | Sağlayıcı sentetik/yerel bir kimlik bilgisi işaretleyicisiyle çalışabiliyorsa                                                                  |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici auth profile'larını bindirir; varsayılan `persistence`, CLI/uygulama sahipli kimlik bilgileri için `runtime-only` değeridir | Sağlayıcı kopyalanmış refresh token'ları kalıcılaştırmadan harici auth kimlik bilgilerini yeniden kullanıyorsa; manifest içinde `contracts.externalAuthProviders` beyan edin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profile yer tutucularını env/yapılandırma destekli auth'un arkasına düşürür               | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profile'lar saklıyorsa                                                              |
| 11  | `resolveDynamicModel`             | Henüz yerel registry'de olmayan sağlayıcıya ait model kimlikleri için eşzamanlı fallback sağlar             | Sağlayıcı keyfi upstream model kimliklerini kabul ediyorsa                                                                                     |
| 12  | `prepareDynamicModel`             | Eşzamansız ısınma yapar, ardından `resolveDynamicModel` tekrar çalışır                                        | Sağlayıcının bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyacı varsa                                                           |
| 13  | `normalizeResolvedModel`          | Gömülü runner çözümlenmiş modeli kullanmadan önce son yeniden yazımı yapar                                   | Sağlayıcının taşıma yeniden yazımlarına ihtiyacı varsa ama yine de bir core taşıma kullanıyorsa                                                |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları katkısı yapar            | Sağlayıcı, sağlayıcıyı devralmadan kendi modellerini proxy taşımalarda tanıyorsa                                                               |
| 15  | `capabilities`                    | Paylaşılan core mantığı tarafından kullanılan sağlayıcıya ait transkript/araç meta verisi                    | Sağlayıcının transkript/sağlayıcı ailesi tuhaflıklarına ihtiyacı varsa                                                                         |
| 16  | `normalizeToolSchemas`            | Gömülü runner görmeden önce araç şemalarını normalize eder                                                   | Sağlayıcının taşıma ailesi şema temizliğine ihtiyacı varsa                                                                                     |
| 17  | `inspectToolSchemas`              | Normalizasyondan sonra sağlayıcıya ait şema tanılarını yüzeye çıkarır                                        | Sağlayıcı, core'a sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları istiyorsa                                                      |
| 18  | `resolveReasoningOutputMode`      | Yerel ve etiketli reasoning-output sözleşmesi arasında seçim yapar                                            | Sağlayıcının yerel alanlar yerine etiketli reasoning/final çıktıya ihtiyacı varsa                                                              |
| 19  | `prepareExtraParams`              | Genel akış seçenek sarmalayıcılarından önce istek parametresi normalizasyonu yapar                          | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı varsa                                       |
| 20  | `createStreamFn`                  | Normal akış yolunu tamamen özel bir taşıma ile değiştirir                                                     | Sağlayıcının yalnızca bir sarmalayıcıya değil, özel bir tel protokolüne ihtiyacı varsa                                                         |
| 21  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı                                                   | Sağlayıcının özel taşıma olmadan istek header/gövde/model uyumluluk sarmalayıcılarına ihtiyacı varsa                                           |
| 22  | `resolveTransportTurnState`       | Yerel dönüş başına taşıma header'larını veya meta veriyi ekler                                                | Sağlayıcı, genel taşımaların sağlayıcıya özgü dönüş kimliği göndermesini istiyorsa                                                             |
| 23  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket header'larını veya oturum cooldown ilkesini ekler                                             | Sağlayıcı, genel WS taşımalarının oturum header'larını veya fallback ilkesini ayarlamasını istiyorsa                                           |
| 24  | `formatApiKey`                    | Auth-profile biçimlendiricisi: saklanan profile çalışma zamanı `apiKey` dizesine dönüşür                    | Sağlayıcı ek auth meta verisi saklıyor ve özel bir çalışma zamanı token biçimine ihtiyaç duyuyorsa                                              |
| 25  | `refreshOAuth`                    | Özel refresh uç noktaları veya refresh-başarısızlık ilkesi için OAuth refresh geçersiz kılması             | Sağlayıcı, paylaşılan `pi-ai` refresh mekanizmalarına uymuyorsa                                                                                |
| 26  | `buildAuthDoctorHint`             | OAuth refresh başarısız olduğunda eklenen onarım ipucu                                                        | Sağlayıcının refresh başarısızlığından sonra sağlayıcıya ait auth onarım yönergesine ihtiyacı varsa                                            |
| 27  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleyicisi                                                           | Sağlayıcının, genel sezgilerin kaçıracağı ham taşma hataları varsa                                                                             |
| 28  | `classifyFailoverReason`          | Sağlayıcıya ait failover nedeni sınıflandırması                                                               | Sağlayıcı, ham API/taşıma hatalarını hız sınırı/aşırı yük/vb. olarak eşleyebiliyorsa                                                           |
| 29  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için prompt-cache ilkesi                                                         | Sağlayıcının proxy'ye özgü önbellek TTL geçitlemesine ihtiyacı varsa                                                                            |
| 30  | `buildMissingAuthMessage`         | Genel eksik-auth kurtarma mesajının yerine geçer                                                              | Sağlayıcının sağlayıcıya özgü eksik-auth kurtarma ipucuna ihtiyacı varsa                                                                        |
| 31  | `suppressBuiltInModel`            | Eski upstream model bastırması ve isteğe bağlı kullanıcıya dönük hata ipucu                                  | Sağlayıcının eski upstream satırlarını gizlemesi veya bunları satıcı ipucuyla değiştirmesi gerekiyorsa                                         |
| 32  | `augmentModelCatalog`             | Keşiften sonra sentetik/nihai katalog satırları ekler                                                         | Sağlayıcının `models list` ve seçicilerde sentetik ileri uyum satırlarına ihtiyacı varsa                                                       |
| 33  | `resolveThinkingProfile`          | Modele özgü `/think` düzeyi kümesi, görüntü etiketleri ve varsayılan                                          | Sağlayıcı seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunuyorsa                                                          |
| 34  | `isBinaryThinking`                | Açık/kapalı reasoning geçişi uyumluluk hook'u                                                                 | Sağlayıcı yalnızca ikili düşünme açık/kapalı sunuyorsa                                                                                          |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning desteği uyumluluk hook'u                                                                    | Sağlayıcı `xhigh` desteğini yalnızca modellerin bir alt kümesinde istiyorsa                                                                     |
| 36  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk hook'u                                                                    | Sağlayıcı bir model ailesi için varsayılan `/think` ilkesinin sahibiyse                                                                         |
| 37  | `isModernModelRef`                | Canlı profile filtreleri ve smoke seçimi için modern model eşleyicisi                                         | Sağlayıcı, canlı/smoke tercih edilen model eşleştirmesinin sahibiyse                                                                          |
| 38  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı token'ına/anahtarına dönüştürür | Sağlayıcının bir token değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı varsa                                                     |
| 39  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalandırma kimlik bilgilerini çözümler                  | Sağlayıcının özel kullanım/kota token ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı varsa                                |
| 40  | `fetchUsageSnapshot`              | Auth çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getirir ve normalize eder       | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya payload ayrıştırıcısına ihtiyacı varsa                                          |
| 41  | `createEmbeddingProvider`         | bellek/arama için sağlayıcıya ait bir embedding adaptörü oluşturur                                            | Bellek embedding davranışı sağlayıcı plugin'ine ait olmalıdır                                                                                 |
| 42  | `buildReplayPolicy`               | Sağlayıcı için transkript işlemeyi kontrol eden bir replay ilkesi döndürür                                    | Sağlayıcının özel bir transkript ilkesine ihtiyacı varsa (örneğin, thinking bloklarını çıkarma)                                              |
| 43  | `sanitizeReplayHistory`           | Genel transkript temizliğinden sonra replay geçmişini yeniden yazar                                           | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü replay yeniden yazımlarına ihtiyacı varsa                       |
| 44  | `validateReplayTurns`             | Gömülü runner'dan önce son replay dönüşü doğrulaması veya yeniden şekillendirme                              | Sağlayıcı taşımasının, genel temizlemeden sonra daha sıkı dönüş doğrulamasına ihtiyacı varsa                                                  |
| 45  | `onModelSelected`                 | Sağlayıcıya ait seçim sonrası yan etkileri çalıştırır                                                         | Bir model etkin olduğunda sağlayıcının telemetriye veya sağlayıcıya ait duruma ihtiyacı varsa                                                |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig`, önce eşleşen
sağlayıcı plugin'ini kontrol eder; ardından model kimliğini veya taşıma/yapılandırmayı gerçekten değiştirene kadar
hook destekli diğer sağlayıcı plugin'lerine düşer. Bu, alias/uyumluluk sağlayıcı shim'lerinin
çağıranın hangi paketlenmiş plugin'in yeniden yazmanın sahibi olduğunu bilmesini gerektirmeden çalışmasını sağlar. Hiçbir sağlayıcı hook'u desteklenen bir
Google ailesi yapılandırma girdisini yeniden yazmazsa paketlenmiş Google yapılandırma normalleştiricisi yine de
o uyumluluk temizliğini uygular.

Sağlayıcının tam özel bir tel protokolüne veya özel bir istek yürütücüsüne ihtiyacı varsa,
bu farklı bir extension sınıfıdır. Bu hook'lar, yine de OpenClaw'ın normal çıkarım döngüsünde çalışan sağlayıcı davranışı içindir.

### Sağlayıcı örneği

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Yerleşik örnekler

Paketlenmiş sağlayıcı plugin'leri, yukarıdaki hook'ları her
satıcının katalog, auth, düşünme, replay ve kullanım izleme gereksinimlerine göre uyarlanmış birleşimlerle kullanır. Sağlayıcı başına tam
hook kümesi `extensions/` altındaki plugin kaynak kodunda yaşar;
bunu burada yansıtmak yerine yetkili liste olarak değerlendirin.

Örnek kalıplar:

- **Pass-through katalog sağlayıcıları** (OpenRouter, Kilocode, Z.AI, xAI),
  OpenClaw'ın statik kataloğundan önce
  upstream model kimliklerini yüzeye çıkarabilmek için `catalog` ile birlikte `resolveDynamicModel`/`prepareDynamicModel` kaydeder.
- **OAuth + kullanım uç noktası sağlayıcıları** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai), token değişimi ve
  `/usage` entegrasyonunun sahibi olmak için `prepareRuntimeAuth` veya `formatApiKey`
  ile `resolveUsageAuth` + `fetchUsageSnapshot` eşleşmesini kullanır.
- **Replay / transkript temizliği**, adlandırılmış aileler üzerinden paylaşılır:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. Sağlayıcılar, her biri kendi transkript temizliğini uygulamak yerine `buildReplayPolicy`
  aracılığıyla buna katılır.
- **Yalnızca katalog** paketlenmiş sağlayıcılar (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) yalnızca `catalog` kaydeder ve
  paylaşılan çıkarım döngüsünü kullanır.
- **Anthropic'e özgü akış yardımcıları** (beta header'ları, `/fast`/`serviceTier`,
  `context1m`), genel SDK'da değil Anthropic paketlenmiş plugin'inin genel `api.ts` /
  `contract-api.ts` seam'inde (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) yaşar.

## Çalışma zamanı yardımcıları

Plugin'ler `api.runtime` aracılığıyla seçilmiş core yardımcılarına erişebilir. TTS için:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Notlar:

- `textToSpeech`, dosya/sesli not yüzeyleri için normal core TTS çıktı payload'unu döndürür.
- Core `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses tamponu + örnekleme hızı döndürür. Plugin'ler bunu sağlayıcılar için yeniden örneklemeli/kodlamalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Bunu satıcıya ait ses seçicileri veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkındalıklı seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefon desteği sunar. Microsoft sunmaz.

Plugin'ler ayrıca `api.registerSpeechProvider(...)` aracılığıyla konuşma sağlayıcıları kaydedebilir.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Notlar:

- TTS ilkesini, fallback'i ve yanıt teslimatını core içinde tutun.
- Satıcıya ait sentez davranışı için konuşma sağlayıcıları kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalize edilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu
  yetenek sözleşmelerini ekledikçe tek bir satıcı plugin'i metin, konuşma, görsel ve gelecekteki medya sağlayıcılarının sahibi olabilir.

Görsel/ses/video anlama için plugin'ler, genel bir anahtar/değer çantası yerine tek bir türlü
medya anlama sağlayıcısı kaydeder:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Notlar:

- Orkestrasyonu, fallback'i, yapılandırmayı ve kanal bağlantısını core içinde tutun.
- Satıcı davranışını sağlayıcı plugin'inde tutun.
- Eklemeli genişleme türlü kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı yetenekler.
- Video üretimi zaten aynı kalıbı izler:
  - core, yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir
  - satıcı plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal plugin'leri `api.runtime.videoGeneration.*` tüketir

Medya anlama çalışma zamanı yardımcıları için plugin'ler şunları çağırabilir:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Ses transkripsiyonu için plugin'ler ya medya anlama çalışma zamanını
ya da eski STT takma adını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME güvenilir biçimde çıkarılamadığında isteğe bağlı:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`, görsel/ses/video anlama için
  tercih edilen paylaşılan yüzeydir.
- Core medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı fallback sırasını kullanır.
- Hiçbir transkripsiyon çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk takma adı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` aracılığıyla arka plan subagent çalıştırmaları başlatabilir:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notlar:

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalışma başına isteğe bağlı geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilen çağıranlar için uygular.
- Plugin'e ait fallback çalıştırmaları için operatörler `plugins.entries.<id>.subagent.allowModelOverride: true` ile katılmalıdır.
- Güvenilen plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen plugin subagent çalıştırmaları yine çalışır, ancak geçersiz kılma istekleri sessizce fallback yapmak yerine reddedilir.

Web arama için plugin'ler, agent tool bağlantılarına
doğrudan uzanmak yerine paylaşılan çalışma zamanı yardımcısını tüketebilir:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin'ler ayrıca
`api.registerWebSearchProvider(...)` aracılığıyla web arama sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini core içinde tutun.
- Satıcıya özgü arama taşımaları için web arama sağlayıcıları kullanın.
- `api.runtime.webSearch.*`, agent tool sarmalayıcısına bağımlı olmadan arama davranışına ihtiyaç duyan özellik/kanal plugin'leri için tercih edilen paylaşılan yüzeydir.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: yapılandırılmış görsel üretim sağlayıcı zincirini kullanarak bir görsel üretir.
- `listProviders(...)`: kullanılabilir görsel üretim sağlayıcılarını ve yeteneklerini listeler.

## Gateway HTTP rotaları

Plugin'ler `api.registerHttpRoute(...)` ile HTTP uç noktaları açığa çıkarabilir.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Rota alanları:

- `path`: Gateway HTTP sunucusu altındaki rota yolu.
- `auth`: zorunlu. Normal Gateway auth gerektirmek için `"gateway"` veya plugin tarafından yönetilen auth/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı plugin'in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediyse `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça beyan etmelidir.
- Tam `path + match` çakışmaları `replaceExisting: true` olmadıkça reddedilir ve bir plugin başka bir plugin'in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip örtüşen rotalar reddedilir. `exact`/`prefix` fallthrough zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları operatör çalışma zamanı kapsamlarını otomatik olarak **almaz**. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, plugin tarafından yönetilen Webhook'lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam kasıtlı olarak ihtiyatlıdır:
  - paylaşılan sır bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile plugin-rotası çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilir kimlik taşıyan HTTP modları (`trusted-proxy` veya özel bir girişte `gateway.auth.mode = "none"` gibi), yalnızca header açıkça mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - bu kimlik taşıyan plugin-rotası isteklerinde `x-openclaw-scopes` yoksa çalışma zamanı kapsamı `operator.write` değerine geri düşer
- Pratik kural: gateway-auth plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yalnızca yönetici davranışı gerektiriyorsa, kimlik taşıyan bir auth modu isteyin ve açık `x-openclaw-scopes` header sözleşmesini belgelendirin.

## Plugin SDK import yolları

Yeni plugin'ler yazarken tek parça `openclaw/plugin-sdk` kök
barrel'ı yerine dar SDK alt yollarını kullanın. Core alt yolları:

| Alt yol                             | Amaç                                                |
| ----------------------------------- | --------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt ilkel bileşenleri                      |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/build yardımcıları                      |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve şemsiye sözleşme    |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`)   |

Kanal plugin'leri, dar seam'lerden oluşan bir aileden seçim yapar — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı, ilişkisiz
plugin alanları arasında karışmak yerine tek bir `approvalCapability` sözleşmesi üzerinde birleşmelidir.
Bkz. [Kanal plugin'leri](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve yapılandırma yardımcıları, eşleşen `*-runtime` alt yolları altında yaşar
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` vb.).

<Info>
`openclaw/plugin-sdk/channel-runtime` kullanımdan kaldırılmıştır — eski plugin'ler için bir uyumluluk shim'idir.
Yeni kod bunun yerine daha dar genel ilkel bileşenler içe aktarmalıdır.
</Info>

Depo içi giriş noktaları (paketlenmiş plugin paket kökü başına):

- `index.js` — paketlenmiş plugin girişi
- `api.js` — yardımcı/türler barrel'ı
- `runtime-api.js` — yalnızca çalışma zamanı barrel'ı
- `setup-entry.js` — kurulum plugin girişi

Harici plugin'ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır. Asla
core'dan veya başka bir plugin'den başka bir plugin paketinin `src/*` yolunu içe aktarmayın.
Facade yüklü giriş noktaları, varsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder,
ardından diskteki çözülmüş yapılandırma dosyasına geri düşer.

`image-generation`, `media-understanding`
ve `speech` gibi yeteneğe özgü alt yollar, paketlenmiş plugin'ler bunları bugün kullandığı için vardır. Bunlar
otomatik olarak uzun vadeli donmuş harici sözleşmeler değildir — bunlara güvenmeden önce ilgili SDK
başvuru sayfasını kontrol edin.

## Message tool şemaları

Plugin'ler, tepkiler, okuma bilgileri ve anketler gibi mesaj olmayan ilkel bileşenler için
kanala özgü `describeMessageTool(...)` şema
katkılarının sahibi olmalıdır. Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme,
bileşen, blok veya kart alanları yerine genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme,
fallback kuralları, sağlayıcı eşlemesi ve plugin yazarı kontrol listesi için [Message Presentation](/tr/plugins/message-presentation)
bölümüne bakın.

Gönderim yapabilen plugin'ler, neyi render edebileceklerini mesaj yetenekleri aracılığıyla beyan eder:

- anlamsal sunum blokları için `presentation` (`text`, `context`, `divider`, `buttons`, `select`)
- sabitlenmiş teslimat istekleri için `delivery-pin`

Core, sunumu yerel olarak mı render edeceğine yoksa metne mi düşüreceğine karar verir.
Genel message aracından sağlayıcıya özgü UI kaçış kapıları açığa çıkarmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut
üçüncü taraf plugin'ler için dışa aktarılmış olarak kalır, ancak yeni plugin'ler bunları kullanmamalıdır.

## Kanal hedef çözümleme

Kanal plugin'leri kanala özgü hedef semantiğinin sahibi olmalıdır. Paylaşılan
giden host'u genel tutun ve sağlayıcı kuralları için mesajlaşma adaptör yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalize edilmiş bir hedefin
  dizin lookup'undan önce `direct`, `group` veya `channel` olarak ele alınıp alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, core'a bir
  girdinin dizin araması yerine doğrudan id benzeri çözümlemeye atlayıp atlamaması gerektiğini söyler.
- `messaging.targetResolver.resolveTarget(...)`, core'un normalizasyondan sonra veya
  dizin ıskasından sonra son bir sağlayıcıya ait çözümlemeye ihtiyaç duyduğunda plugin fallback'idir.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra
  sağlayıcıya özgü oturum rota oluşturmanın sahibidir.

Önerilen ayrım:

- Eşler/gruplar aranmadan önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- "Bunu açık/yerel hedef kimliği olarak ele al" denetimleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalizasyon fallback'i için `resolveTarget` kullanın.
- Sohbet kimlikleri, thread kimlikleri, JID'ler, handle'lar ve oda
  kimlikleri gibi sağlayıcıya özgü kimlikleri genel SDK alanlarında değil, `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten plugin'ler bu mantığı
plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu bir kanal şu tür yapılandırma destekli eşlere/gruplara ihtiyaç duyduğunda kullanın:

- izin listesi güdümlü DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesap kapsamlı statik dizin fallback'leri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulama
- tekrar kaldırma/normalizasyon yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalizasyonu
plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı plugin'leri, çıkarım için
`registerProvider({ catalog: { run(...) { ... } } })` ile model katalogları tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın
`models.providers` içine yazdığı aynı şekli döndürür:

- bir sağlayıcı girdisi için `{ provider }`
- birden fazla sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model kimliklerinin, temel URL varsayılanlarının veya
auth geçitli model meta verisinin sahibiyse `catalog` kullanın.

`catalog.order`, bir plugin'in kataloğunun OpenClaw'ın
yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini kontrol eder:

- `simple`: düz API-key veya env güdümlü sağlayıcılar
- `profile`: auth profile'ları mevcut olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Daha sonraki sağlayıcılar anahtar çakışmasında kazanır; böylece plugin'ler aynı sağlayıcı kimliğine sahip
yerleşik bir sağlayıcı girdisini kasıtlı olarak geçersiz kılabilir.

Uyumluluk:

- `discovery`, eski bir takma ad olarak hâlâ çalışır
- hem `catalog` hem `discovery` kaydedilmişse OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin'iniz bir kanal kaydediyorsa
`resolveAccount(...)` ile birlikte `plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin
  tamamen somutlaştırıldığını varsayabilir ve gerekli secret'lar eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yolları, yalnızca
  yapılandırmayı açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırmaya ihtiyaç duymamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda kimlik bilgisi kaynağı/durumu alanlarını dahil edin, örneğin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham token değerlerini döndürmeniz gerekmez.
  `tokenStatus: "available"` (ve eşleşen kaynak
  alanı) döndürmek, durum tarzı komutlar için yeterlidir.
- Bir kimlik bilgisi SecretRef ile yapılandırılmış ama
  mevcut komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların hesabı yapılandırılmamış gibi yanlış raporlamak veya çökmek yerine
"yapılandırılmış ama bu komut yolunda kullanılamıyor" demesini sağlar.

## Paket pack'leri

Bir plugin dizini, `openclaw.extensions` içeren bir `package.json` barındırabilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her girdi bir plugin olur. Pack birden fazla extension listeliyorsa plugin kimliği
`name/<fileBase>` olur.

Plugin'iniz npm bağımlılıkları içe aktarıyorsa
`node_modules` kullanılabilir olsun diye bunları o dizinde kurun (`npm install` / `pnpm install`).

Güvenlik koruması: her `openclaw.extensions` girdisi symlink çözümlemesinden sonra plugin
dizini içinde kalmalıdır. Paket dizininden dışarı taşan girdiler
reddedilir.

Güvenlik notu: `openclaw plugins install`, plugin bağımlılıklarını
`npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yok, çalışma zamanında dev bağımlılıkları yok). Plugin bağımlılık
ağaçlarını "saf JS/TS" tutun ve `postinstall` build'leri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca-kurulum modülüne işaret edebilir.
OpenClaw, devre dışı bir kanal plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal plugin'i etkin ama hâlâ yapılandırılmamış olduğunda tam plugin girişi yerine
`setupEntry` yükler. Bu, ana plugin girişiniz
araçları, hook'ları veya diğer yalnızca çalışma zamanı
kodlarını da bağladığında başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
bir kanal plugin'ini Gateway'in
dinleme öncesi başlangıç aşamasında, kanal zaten yapılandırılmış olsa bile, aynı `setupEntry` yoluna alabilir.

Bunu yalnızca `setupEntry`, Gateway dinlemeye başlamadan önce
var olması gereken başlangıç yüzeyini tam olarak kapsıyorsa kullanın. Pratikte bu,
kurulum girişinin başlangıcın bağımlı olduğu her kanal sahibi yeteneği kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- Gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı pencere sırasında var olması gereken tüm gateway yöntemleri, araçlar veya hizmetler

Tam girişiniz hâlâ gerekli bir başlangıç yeteneğinin sahibiyse bu
bayrağı etkinleştirmeyin. Plugin'i varsayılan davranışta bırakın ve OpenClaw'ın
başlangıç sırasında tam girişi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca core'un
tam kanal çalışma zamanı yüklenmeden önce danışabileceği yalnızca-kurulum sözleşme yüzeyi yardımcıları yayımlayabilir. Geçerli kurulum
yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core bu yüzeyi, eski bir tek hesaplı kanal
yapılandırmasını tam plugin girişini yüklemeden `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde kullanır.
Matrix mevcut paketlenmiş örnektir: adlandırılmış hesaplar zaten varken yalnızca auth/bootstrap anahtarlarını
adlandırılmış yükseltilmiş bir hesaba taşır ve her zaman
`accounts.default` oluşturmak yerine yapılandırılmış kanonik olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum patch adaptörleri, paketlenmiş sözleşme yüzeyi keşfini tembel tutar. İçe aktarma
zamanı hafif kalır; yükseltme yüzeyi modül içe aktarımında paketlenmiş kanal başlangıcına
yeniden girmek yerine yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri Gateway RPC yöntemleri içerdiğinde bunları
plugin'e özgü bir önek üzerinde tutun. Core yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir plugin
daha dar bir kapsam istese bile her zaman `operator.admin` olarak çözülür.

Örnek:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Kanal katalog meta verisi

Kanal plugin'leri `openclaw.channel` aracılığıyla kurulum/keşif meta verisi ve
`openclaw.install` aracılığıyla kurulum ipuçları yayımlayabilir. Bu, core katalogunu veriden bağımsız tutar.

Örnek:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Yararlı `openclaw.channel` alanları, minimum örneğin ötesinde şunlardır:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: doküman bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi kopya denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: doküman gezinme yüzeyleri için kanalı dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: eski takma adlar uyumluluk için hâlâ kabul edilir; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap mevcut olsa bile açık hesap bağlama gerektirir
- `preferSessionLookupForAnnounceTarget`: duyuru hedeflerini çözümlerken oturum lookup'unu tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin, bir MPM
registry dışa aktarımı). Şu yollardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değişkenini
bir veya daha fazla JSON dosyasına yöneltin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı ayrıca `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

## Bağlam motoru plugin'leri

Bağlam motoru plugin'leri, alma, derleme
ve Compaction için oturum bağlamı orkestrasyonunun sahibidir. Bunları plugin'inizden
`api.registerContextEngine(id, factory)` ile kaydedin, sonra etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, plugin'inizin varsayılan bağlam
hattını yalnızca bellek araması veya hook eklemek yerine değiştirmesi ya da genişletmesi gerektiğinde kullanın.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Motorunuz Compaction algoritmasının sahibi **değilse**, `compact()`
uygulamasını koruyun ve bunu açıkça delege edin:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Yeni bir yetenek ekleme

Bir plugin, mevcut API'ye uymayan davranışa ihtiyaç duyduğunda
özel bir iç erişimle plugin sistemini atlamayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. core sözleşmesini tanımlayın
   Core'un hangi paylaşılan davranışın sahibi olması gerektiğine karar verin: ilke, fallback, yapılandırma birleştirme,
   yaşam döngüsü, kanala dönük semantik ve çalışma zamanı yardımcı şekli.
2. türlü plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` yüzeyini en küçük yararlı
   türlü yetenek yüzeyiyle genişletin.
3. core + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik plugin'leri yeni yeteneği core üzerinden tüketmeli,
   bir satıcı uygulamasını doğrudan içe aktararak değil.
4. satıcı uygulamalarını kaydedin
   Satıcı plugin'leri daha sonra backend'lerini bu yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahipliğin ve kayıt şeklinin zaman içinde açık kalması için testler ekleyin.

OpenClaw'ın, bir
sağlayıcının dünya görüşüne sabit kodlanmadan fikir sahibi kalması bu şekilde sağlanır. Somut dosya kontrol listesi ve işlenmiş örnek için [Capability Cookbook](/tr/plugins/architecture)
bölümüne bakın.

### Yetenek kontrol listesi

Yeni bir yetenek eklediğinizde uygulama genellikle bu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki core sözleşme türleri
- `src/<capability>/runtime.ts` içindeki core runner/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki plugin kayıt sistemi bağlantısı
- özellik/kanal
  plugin'lerinin tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki capture/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/plugin dokümanları

Bu yüzeylerden biri eksikse, bu genellikle yeteneğin
henüz tam entegre olmadığının işaretidir.

### Yetenek şablonu

Minimum kalıp:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// feature/channel plugin'leri için paylaşılan çalışma zamanı yardımcısı
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Sözleşme test kalıbı:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- core yetenek sözleşmesinin + orkestrasyonun sahibidir
- satıcı plugin'leri satıcı uygulamalarının sahibidir
- özellik/kanal plugin'leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar
