---
read_when:
    - Yerel OpenClaw Plugin’leri oluşturma veya hata ayıklama
    - Plugin capability modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme hattı veya kayıt sistemi üzerinde çalışma
    - Sağlayıcı çalışma zamanı hook’larını veya kanal Plugin’lerini uygulama
sidebarTitle: Internals
summary: 'Plugin iç yapıları: capability modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Plugin İç Yapıları
x-i18n:
    generated_at: "2026-04-21T09:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin İç Yapıları

<Info>
  Bu, **derin mimari başvurusudur**. Pratik kılavuzlar için bkz.:
  - [Plugin’leri kurun ve kullanın](/tr/tools/plugin) — kullanıcı kılavuzu
  - [Başlangıç](/tr/plugins/building-plugins) — ilk Plugin eğitimi
  - [Kanal Plugin’leri](/tr/plugins/sdk-channel-plugins) — bir mesajlaşma kanalı oluşturun
  - [Sağlayıcı Plugin’leri](/tr/plugins/sdk-provider-plugins) — bir model sağlayıcısı oluşturun
  - [SDK Genel Görünümü](/tr/plugins/sdk-overview) — import eşlemi ve kayıt API’si
</Info>

Bu sayfa, OpenClaw Plugin sisteminin iç mimarisini kapsar.

## Public capability modeli

Capabilities, OpenClaw içindeki genel **yerel Plugin** modelidir. Her
yerel OpenClaw Plugin’i bir veya daha fazla capability türüne kayıt olur:

| Capability             | Kayıt yöntemi                                   | Örnek Plugin’ler                     |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Metin çıkarımı         | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| CLI çıkarım arka ucu   | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Konuşma                | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Gerçek zamanlı transkripsiyon | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                      |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Görüntü oluşturma      | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Müzik oluşturma        | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Video oluşturma        | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Web getirme            | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Web araması            | `api.registerWebSearchProvider(...)`            | `google`                             |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Sıfır capability kaydeden ama hook, araç veya
hizmet sağlayan bir Plugin, **eski hook-only** Plugin’dir. Bu örüntü hâlâ tam olarak desteklenir.

### Dış uyumluluk duruşu

Capability modeli çekirdeğe yerleşti ve bugün paketlenmiş/yerel Plugin’ler
tarafından kullanılıyor, ancak dış Plugin uyumluluğu için hâlâ
“dışa aktarılmışsa donmuştur” ölçütünden daha sıkı bir çıta gerekir.

Geçerli yönlendirme:

- **mevcut dış Plugin’ler:** hook tabanlı entegrasyonları çalışır tutun; bunu
  uyumluluk tabanı olarak değerlendirin
- **yeni paketlenmiş/yerel Plugin’ler:** satıcıya özgü içe uzanmalar veya yeni hook-only tasarımlar yerine
  açık capability kaydını tercih edin
- **capability kaydını benimseyen dış Plugin’ler:** izin verilir, ancak
  capability’ye özgü yardımcı yüzeyleri, belgeler açıkça
  bir sözleşmenin kararlı olduğunu işaretlemedikçe gelişen yüzeyler olarak değerlendirin

Pratik kural:

- capability kayıt API’leri hedeflenen yöndür
- geçiş sırasında eski hook’lar dış Plugin’ler için
  bozulmama açısından en güvenli yol olmaya devam eder
- dışa aktarılan yardımcı alt yolların hepsi eşit değildir; tesadüfi yardımcı dışa aktarımlar yerine
  dar belgelenmiş sözleşmeyi tercih edin

### Plugin biçimleri

OpenClaw, yüklenen her Plugin’i gerçek
kayıt davranışına göre bir biçime sınıflandırır (yalnızca statik meta veriye göre değil):

- **plain-capability** -- tam olarak bir capability türü kaydeder (örneğin
  `mistral` gibi yalnızca sağlayıcı Plugin’i)
- **hybrid-capability** -- birden çok capability türü kaydeder (örneğin
  `openai`, metin çıkarımı, konuşma, medya anlama ve görüntü
  oluşturmaya sahiptir)
- **hook-only** -- yalnızca hook kaydeder (typed veya custom), capability,
  araç, komut veya hizmet kaydetmez
- **non-capability** -- capability olmadan araç, komut, hizmet veya route
  kaydeder

Bir Plugin’in biçimini ve capability
dökümünü görmek için `openclaw plugins inspect <id>` kullanın. Ayrıntılar için bkz. [CLI başvurusu](/cli/plugins#inspect).

### Eski hook’lar

`before_agent_start` hook’u, hook-only Plugin’ler için
uyumluluk yolu olarak desteklenmeye devam eder. Gerçek dünyadaki eski Plugin’ler hâlâ buna bağlıdır.

Yön:

- çalışır tutun
- eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma işleri için `before_model_resolve` tercih edin
- istem değişikliği işleri için `before_prompt_build` tercih edin
- yalnızca gerçek kullanım düştükten ve fixture kapsamı geçiş güvenliğini kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda
şu etiketlerden birini görebilirsiniz:

| Sinyal                    | Anlamı                                                       |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | Yapılandırma düzgün ayrıştırılır ve Plugin’ler çözülür       |
| **compatibility advisory** | Plugin desteklenen ama daha eski bir örüntü kullanır (örn. `hook-only`) |
| **legacy warning**        | Plugin artık önerilmeyen `before_agent_start` kullanır       |
| **hard error**            | Yapılandırma geçersizdir veya Plugin yüklenememiştir         |

Ne `hook-only` ne de `before_agent_start` bugün Plugin’inizi bozmaz --
`hook-only` tavsiye niteliğindedir ve `before_agent_start` yalnızca bir uyarı tetikler. Bu
sinyaller `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimariye genel bakış

OpenClaw’ın Plugin sistemi dört katmandan oluşur:

1. **Manifest + keşif**
   OpenClaw, yapılandırılmış yollar, çalışma alanı kökleri,
   genel uzantı kökleri ve paketlenmiş uzantılardan aday Plugin’leri bulur. Keşif,
   önce yerel `openclaw.plugin.json` manifestlerini ve desteklenen bundle manifestlerini okur.
2. **Etkinleştirme + doğrulama**
   Çekirdek, keşfedilen bir Plugin’in etkin, devre dışı, engellenmiş veya
   bellek gibi özel bir yuva için seçilmiş olup olmadığına karar verir.
3. **Çalışma zamanı yükleme**
   Yerel OpenClaw Plugin’leri, jiti aracılığıyla süreç içinde yüklenir ve
   capability’leri merkezi bir kayıt sistemine kaydeder. Uyumlu bundle’lar, çalışma zamanı kodu içe aktarılmadan
   kayıt sistemine dönüştürülür.
4. **Yüzey tüketimi**
   OpenClaw’ın geri kalanı, araçları, kanalları, sağlayıcı
   kurulumunu, hook’ları, HTTP route’larını, CLI komutlarını ve hizmetleri göstermek için kayıt sistemini okur.

Özellikle Plugin CLI için, kök komut keşfi iki aşamaya bölünür:

- ayrıştırma zamanı meta verisi `registerCli(..., { descriptors: [...] })` üzerinden gelir
- gerçek Plugin CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, Plugin’e ait CLI kodunu Plugin içinde tutarken OpenClaw’ın
ayrıştırmadan önce kök komut adlarını ayırmasına olanak tanır.

Önemli tasarım sınırı:

- keşif + yapılandırma doğrulaması, Plugin kodu çalıştırılmadan
  **manifest/schema meta verisinden** çalışmalıdır
- yerel çalışma zamanı davranışı, Plugin modülünün `register(api)` yolundan gelir

Bu ayrım, tam çalışma zamanı etkinleşmeden önce OpenClaw’ın yapılandırmayı doğrulamasını,
eksik/devre dışı Plugin’leri açıklamasını ve UI/schema ipuçları oluşturmasını sağlar.

### Kanal Plugin’leri ve paylaşılan mesaj aracı

Kanal Plugin’lerinin, normal sohbet eylemleri için ayrı bir gönder/düzenle/tepki aracı kaydetmesi gerekmez.
OpenClaw çekirdekte tek bir paylaşılan `message` aracını tutar ve
kanala özgü keşif ile yürütmeye Kanal Plugin’leri sahip olur.

Geçerli sınır şudur:

- çekirdek, paylaşılan `message` araç host’una, istem bağlamasına, oturum/thread
  kayıt tutmasına ve yürütme dağıtımına sahiptir
- Kanal Plugin’leri, kapsamlı eylem keşfine, capability keşfine ve
  kanala özgü tüm şema parçalarına sahiptir
- Kanal Plugin’leri, konuşma kimliklerinin thread kimliklerini nasıl kodladığı
  veya üst konuşmalardan nasıl miras aldığı gibi sağlayıcıya özgü oturum konuşma dilbilgisine sahiptir
- Kanal Plugin’leri son eylemi kendi action adapter’ları üzerinden yürütür

Kanal Plugin’leri için SDK yüzeyi
`ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif
çağrısı, bir Plugin’in görünür eylemleri, capability’leri ve şema
katkılarını birlikte döndürmesini sağlar; böylece bu parçalar birbirinden kopmaz.

Kanala özgü bir message-tool parametresi yerel yol veya uzak medya URL’si gibi
bir medya kaynağı taşıdığında, Plugin ayrıca
`describeMessageTool(...)` içinden `mediaSourceParams` döndürmelidir. Çekirdek bu açık
listeyi, Plugin’e ait parametre adlarını sabit kodlamadan sandbox yol normalizasyonu ve
giden medya erişim ipuçları uygulamak için kullanır.
Burada kanal genelinde tek düz liste yerine eylem kapsamlı eşlemleri
tercih edin; böylece yalnızca profile’a ait bir medya parametresi `send` gibi ilgisiz eylemlerde
normalize edilmez.

Çekirdek, çalışma zamanı kapsamını bu keşif adımına geçirir. Önemli alanlar şunlardır:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı Plugin’ler için önemlidir. Bir kanal,
çekirdekte kanala özgü dallar sabit kodlamadan etkin hesap, mevcut oda/thread/mesaj veya
güvenilir istekçi kimliğine göre mesaj eylemlerini gizleyebilir veya gösterebilir.

Bu nedenle gömülü çalıştırıcı yönlendirme değişiklikleri hâlâ Plugin işidir: çalıştırıcı,
paylaşılan `message` aracının mevcut tur için doğru kanala ait
yüzeyi göstermesi amacıyla mevcut sohbet/oturum kimliğini Plugin
keşif sınırına iletmekten sorumludur.

Kanala ait yürütme yardımcıları için, paketlenmiş Plugin’ler yürütme
çalışma zamanını kendi uzantı modülleri içinde tutmalıdır. Çekirdek artık Discord,
Slack, Telegram veya WhatsApp mesaj eylemi çalışma zamanlarına `src/agents/tools` altında sahip değildir.
Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş
Plugin’ler kendi yerel çalışma zamanı kodlarını doğrudan uzantılarına ait
modüllerden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK yüzeyleri için de geçerlidir: çekirdek,
Slack, Discord, Signal, WhatsApp veya benzeri uzantılar için kanala özgü kolaylık barrel’larını içe aktarmamalıdır.
Çekirdeğin bir davranışa ihtiyacı varsa, ya paketlenmiş Plugin’in kendi
`api.ts` / `runtime-api.ts` barrel’ını tüketin ya da ihtiyacı
paylaşılan SDK içinde dar bir genel capability’ye yükseltin.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak
  anket modeline uyan kanallar için paylaşılan temel çizgidir
- `actions.handleAction("poll")`, kanala özgü
  anket anlamları veya ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını, Plugin anket dağıtımı eylemi reddettikten sonrasına erteler; böylece
Plugin’e ait anket işleyicileri, genel anket ayrıştırıcısı önce engel olmadan
kanala özgü anket alanlarını kabul edebilir.

Tam başlangıç sırası için bkz. [Yükleme hattı](#load-pipeline).

## Capability sahiplik modeli

OpenClaw, yerel bir Plugin’i ilişkisiz entegrasyonlardan oluşan bir torba olarak değil,
bir **şirket** veya bir **özellik** için sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket Plugin’i genellikle o şirketin OpenClaw’a bakan
  tüm yüzeylerine sahip olmalıdır
- bir özellik Plugin’i genellikle tanıttığı tam özellik yüzeyine sahip olmalıdır
- kanallar, sağlayıcı davranışını ad hoc biçimde yeniden uygulamak yerine
  paylaşılan çekirdek capability’leri tüketmelidir

Örnekler:

- paketlenmiş `openai` Plugin’i, OpenAI model-sağlayıcı davranışına ve OpenAI
  konuşma + gerçek zamanlı ses + medya anlama + görüntü oluşturma davranışına sahiptir
- paketlenmiş `elevenlabs` Plugin’i, ElevenLabs konuşma davranışına sahiptir
- paketlenmiş `microsoft` Plugin’i, Microsoft konuşma davranışına sahiptir
- paketlenmiş `google` Plugin’i, Google model-sağlayıcı davranışına ek olarak Google
  medya anlama + görüntü oluşturma + web araması davranışına sahiptir
- paketlenmiş `firecrawl` Plugin’i, Firecrawl web getirme davranışına sahiptir
- paketlenmiş `minimax`, `mistral`, `moonshot` ve `zai` Plugin’leri kendi
  medya anlama arka uçlarına sahiptir
- paketlenmiş `qwen` Plugin’i, Qwen metin-sağlayıcı davranışına ek olarak
  medya anlama ve video oluşturma davranışına sahiptir
- `voice-call` Plugin’i bir özellik Plugin’idir: çağrı transport’una, araçlara,
  CLI’ye, route’lara ve Twilio medya akışı köprülemesine sahiptir, ancak satıcı Plugin’lerini doğrudan
  içe aktarmak yerine paylaşılan konuşma
  ile gerçek zamanlı transkripsiyon ve gerçek zamanlı ses capability’lerini tüketir

Hedeflenen nihai durum şudur:

- OpenAI, metin modelleri, konuşma, görüntüler ve
  gelecekte video kapsasa bile tek bir Plugin’de yaşar
- başka bir satıcı da aynı şeyi kendi yüzey alanı için yapabilir
- kanallar, sağlayıcının hangi satıcı Plugin’ine ait olduğunu umursamaz; çekirdeğin açığa çıkardığı
  paylaşılan capability sözleşmesini tüketir

Temel ayrım şudur:

- **Plugin** = sahiplik sınırı
- **capability** = birden çok Plugin’in uygulayabildiği veya tüketebildiği çekirdek sözleşmesi

Dolayısıyla OpenClaw video gibi yeni bir alan eklerse, ilk soru
“hangi sağlayıcı video işlemeyi sabit kodlayacak?” değildir. İlk soru “çekirdek video capability sözleşmesi nedir?”
olmalıdır. Bu sözleşme var olduğunda satıcı Plugin’leri
ona kayıt olabilir ve kanal/özellik Plugin’leri bunu tüketebilir.

Capability henüz mevcut değilse, doğru adım genellikle şudur:

1. eksik capability’yi çekirdekte tanımlayın
2. bunu Plugin API’si/çalışma zamanı üzerinden typed biçimde açığa çıkarın
3. kanalları/özellikleri bu capability’ye bağlayın
4. satıcı Plugin’lerinin uygulamaları kaydetmesine izin verin

Bu, sahipliği açık tutarken tek bir satıcıya veya tek seferlik Plugin’e özgü kod yoluna
bağlı çekirdek davranıştan kaçınır.

### Capability katmanlaması

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

- **çekirdek capability katmanı**: paylaşılan orkestrasyon, ilke, fallback, yapılandırma
  birleştirme kuralları, teslim semantiği ve typed sözleşmeler
- **satıcı Plugin katmanı**: satıcıya özgü API’ler, auth, model katalogları, konuşma
  sentezi, görüntü oluşturma, gelecekteki video arka uçları, kullanım uç noktaları
- **kanal/özellik Plugin katmanı**: çekirdek capability’leri tüketen ve bunları bir yüzeyde sunan
  Slack/Discord/voice-call/vb. entegrasyonu

Örneğin TTS şu yapıyı izler:

- çekirdek, yanıt zamanındaki TTS ilkesine, fallback sırasına, tercihlere ve kanal teslimine sahiptir
- `openai`, `elevenlabs` ve `microsoft`, sentez uygulamalarına sahiptir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Gelecekteki capability’ler için de aynı örüntü tercih edilmelidir.

### Çok capability’li şirket Plugin’i örneği

Bir şirket Plugin’i dışarıdan bakıldığında tutarlı hissettirmelidir. OpenClaw’ın
modeller, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses, medya
anlama, görüntü oluşturma, video oluşturma, web getirme ve web araması için paylaşılan
sözleşmeleri varsa, bir satıcı tüm yüzeylerine tek yerde sahip olabilir:

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
      // vendor speech config — implement the SpeechProviderPlugin interface directly
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

Önemli olan tam yardımcı adları değildir. Yapı önemlidir:

- tek bir Plugin satıcı yüzeyine sahiptir
- çekirdek yine de capability sözleşmelerine sahiptir
- kanallar ve özellik Plugin’leri satıcı kodunu değil `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, Plugin’in
  sahip olduğunu iddia ettiği capability’leri kaydettiğini doğrulayabilir

### Capability örneği: video anlama

OpenClaw, görüntü/ses/video anlamayı zaten tek bir paylaşılan
capability olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

1. çekirdek medya anlama sözleşmesini tanımlar
2. satıcı Plugin’leri uygun olduğu şekilde `describeImage`, `transcribeAudio` ve
   `describeVideo` kaydeder
3. kanal ve özellik Plugin’leri, doğrudan satıcı koduna bağlanmak yerine
   paylaşılan çekirdek davranışı tüketir

Bu, bir sağlayıcının video varsayımlarını çekirdeğe gömmekten kaçınır. Plugin,
satıcı yüzeyine sahiptir; çekirdek ise capability sözleşmesine ve fallback davranışına sahiptir.

Video oluşturma zaten aynı diziyi kullanır: çekirdek typed
capability sözleşmesine ve çalışma zamanı yardımcısına sahiptir ve satıcı Plugin’leri
bunlara karşı `api.registerVideoGenerationProvider(...)` uygulamaları kaydeder.

Somut bir yaygınlaştırma kontrol listesine mi ihtiyacınız var? Bkz.
[Capability Cookbook](/tr/plugins/architecture).

## Sözleşmeler ve uygulama

Plugin API yüzeyi, bilerek typed ve
`OpenClawPluginApi` içinde merkezileştirilmiştir. Bu sözleşme, desteklenen kayıt noktalarını ve
bir Plugin’in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun önemi:

- Plugin yazarları tek bir kararlı iç standart elde eder
- çekirdek, aynı sağlayıcı kimliğini iki Plugin’in kaydetmesi gibi yinelenen sahipliği reddedebilir
- başlangıç, hatalı biçimlendirilmiş kayıtlar için uygulanabilir tanılar gösterebilir
- sözleşme testleri paketlenmiş Plugin sahipliğini zorlayabilir ve sessiz kaymayı önleyebilir

İki uygulama katmanı vardır:

1. **çalışma zamanı kayıt uygulaması**
   Plugin kayıt sistemi, Plugin’ler yüklenirken kayıtları doğrular. Örnekler:
   yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcı kimlikleri ve hatalı
   kayıtlar tanımsız davranış yerine Plugin tanıları üretir.
2. **sözleşme testleri**
   Paketlenmiş Plugin’ler test çalıştırmaları sırasında sözleşme kayıt sistemlerinde yakalanır; böylece
   OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu,
   model sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt
   sahipliği için kullanılır.

Pratik sonuç, OpenClaw’ın hangi
yüzeyin hangi Plugin’e ait olduğunu en baştan bilmesidir. Bu, çekirdeğin ve kanalların sorunsuz
bileşim kurmasına olanak tanır; çünkü sahiplik örtük değil, beyan edilmiş, typed ve test edilebilirdir.

### Bir sözleşmede ne yer almalı

İyi Plugin sözleşmeleri şunlardır:

- typed
- küçük
- capability’ye özgü
- çekirdeğe ait
- birden çok Plugin tarafından yeniden kullanılabilir
- satıcı bilgisi olmadan kanal/özellikler tarafından tüketilebilir

Kötü Plugin sözleşmeleri şunlardır:

- çekirdekte gizlenmiş satıcıya özgü ilke
- kayıt sistemini atlayan tek seferlik Plugin kaçış kapıları
- doğrudan satıcı uygulamasına uzanan kanal kodu
- `OpenClawPluginApi` veya
  `api.runtime` parçası olmayan ad hoc çalışma zamanı nesneleri

Kararsız kaldığınızda soyutlama düzeyini yükseltin: önce capability’yi tanımlayın, sonra
Plugin’lerin buna bağlanmasına izin verin.

## Yürütme modeli

Yerel OpenClaw Plugin’leri Gateway ile **aynı süreç içinde** çalışır. Bunlar
sandbox içine alınmaz. Yüklenmiş bir yerel Plugin, çekirdek kodla aynı süreç düzeyi güven sınırına sahiptir.

Sonuçlar:

- yerel bir Plugin araçlar, ağ işleyicileri, hook’lar ve hizmetler kaydedebilir
- yerel bir Plugin hatası Gateway’i çökertebilir veya kararsızlaştırabilir
- kötü amaçlı bir yerel Plugin, OpenClaw süreci içinde keyfi kod yürütmeyle eşdeğerdir

Uyumlu bundle’lar varsayılan olarak daha güvenlidir; çünkü OpenClaw şu anda bunları
meta veri/içerik paketleri olarak ele alır. Güncel sürümlerde bu çoğunlukla paketlenmiş
Skills anlamına gelir.

Paketlenmemiş Plugin’ler için izin listeleri ve açık kurulum/yükleme yolları kullanın. Çalışma alanı Plugin’lerini üretim varsayılanı değil,
geliştirme zamanı kodu olarak değerlendirin.

Paketlenmiş çalışma alanı paket adları için, Plugin kimliğini varsayılan olarak npm
adına sabitli tutun: `@openclaw/<id>` veya
paketin bilerek daha dar bir Plugin rolü sunduğu durumlarda onaylı typed soneklerden biri olan
`-provider`, `-plugin`, `-speech`, `-sandbox` ya da `-media-understanding`.

Önemli güven notu:

- `plugins.allow`, kaynak kökenine değil **Plugin kimliklerine** güvenir.
- Paketlenmiş bir Plugin ile aynı kimliğe sahip bir çalışma alanı Plugin’i, etkinleştirildiğinde/izin listesine alındığında
  paketlenmiş kopyayı bilerek gölgeler.
- Bu normaldir ve yerel geliştirme, yama testi ve hotfix’ler için kullanışlıdır.

## Dışa aktarma sınırı

OpenClaw, uygulama kolaylıklarını değil capability’leri dışa aktarır.

Capability kaydını genel tutun. Sözleşme dışı yardımcı dışa aktarımları azaltın:

- paketlenmiş Plugin’e özgü yardımcı alt yollar
- genel API olması amaçlanmayan çalışma zamanı tesisat alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/onboarding yardımcıları

Bazı paketlenmiş Plugin yardımcı alt yolları uyumluluk ve paketlenmiş Plugin bakımı için
üretilmiş SDK dışa aktarma eşleminde hâlâ kalır. Güncel örnekler arasında
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve çeşitli `plugin-sdk/matrix*` yüzeyleri bulunur. Bunları
uygulanması önerilen SDK örüntüsü olarak değil, ayrılmış uygulama ayrıntısı dışa aktarımları olarak değerlendirin
yeni üçüncü taraf Plugin’ler için.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu bundle manifestlerini ve paket meta verilerini okur
3. güvensiz adayları reddeder
4. Plugin yapılandırmasını normalize eder (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri jiti aracılığıyla yükler
7. yerel `register(api)` (veya eski bir takma ad olan `activate(api)`) hook’larını çağırır ve kayıtları Plugin kayıt sistemine toplar
8. kayıt sistemini komutlara/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici mevcut olanı çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketlenmiş Plugin’ler `register` kullanır; yeni Plugin’ler için `register` tercih edin.
</Note>

Güvenlik kapıları çalışma zamanı yürütmesinden **önce** gerçekleşir. Adaylar,
girdi Plugin kökünün dışına çıkıyorsa, yol world-writable ise veya
paketlenmemiş Plugin’ler için yol sahipliği şüpheli görünüyorsa engellenir.

### Önce manifest davranışı

Manifest, kontrol düzleminin doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- Plugin’i tanımlamak
- bildirilen kanalları/Skills/yapılandırma şemasını veya bundle capability’lerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verisini göstermek
- Plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum descriptor’larını korumak

Yerel Plugin’ler için, çalışma zamanı modülü veri düzlemi kısmıdır. Bu,
hook’lar, araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar, etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri descriptor’larıdır;
çalışma zamanı kaydının, `register(...)` veya `setupEntry`’nin yerini almazlar.
İlk canlı etkinleştirme tüketicileri artık daha geniş kayıt sistemi somutlaştırmasından önce
Plugin yüklemeyi daraltmak için manifest komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yükleme, istenen birincil komuta sahip Plugin’lere daralır
- kanal kurulumu/Plugin çözümleme, istenen
  kanal kimliğine sahip Plugin’lere daralır
- açık sağlayıcı kurulumu/çalışma zamanı çözümleme, istenen
  sağlayıcı kimliğine sahip Plugin’lere daralır

Kurulum keşfi artık, kurulum zamanında çalışma zamanı hook’larına hâlâ ihtiyaç duyan Plugin’ler için `setup-api`’ye geri dönmeden önce aday Plugin’leri daraltmak amacıyla `setup.providers` ve
`setup.cliBackends` gibi descriptor’a ait kimlikleri tercih eder. Keşfedilen
birden fazla Plugin aynı normalize edilmiş kurulum sağlayıcısı veya CLI arka uç
kimliğini talep ederse, kurulum araması keşif sırasına güvenmek yerine
belirsiz sahibi reddeder.

### Yükleyicinin önbelleğe aldıkları

OpenClaw şu öğeler için kısa süreli süreç içi önbellekler tutar:

- keşif sonuçları
- manifest kayıt sistemi verileri
- yüklenmiş Plugin kayıt sistemleri

Bu önbellekler, ani başlangıç yükünü ve yinelenen komut ek yükünü azaltır. Bunları
kalıcılık değil, kısa ömürlü performans önbellekleri olarak düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek pencerelerini `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt sistemi modeli

Yüklenmiş Plugin’ler rastgele çekirdek global’leri doğrudan değiştirmez. Bunlar
merkezi bir Plugin kayıt sistemine kaydolur.

Kayıt sistemi şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılar)
- araçlar
- eski hook’lar ve typed hook’lar
- kanallar
- sağlayıcılar
- Gateway RPC işleyicileri
- HTTP route’ları
- CLI kaydedicileri
- arka plan hizmetleri
- Plugin’e ait komutlar

Ardından çekirdek özellikler, doğrudan Plugin modülleriyle konuşmak yerine bu kayıt
sisteminden okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt sistemine kayıt
- çekirdek çalışma zamanı -> kayıt sistemini tüketme

Bu ayrım bakım kolaylığı için önemlidir. Çekirdek yüzeylerin çoğunun
tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: “kayıt sistemini oku”,
“her Plugin modülünü özel durum yap” değil.

## Konuşma bağlama geri çağrıları

Bir konuşma bağlayan Plugin’ler, onay çözümlendiğinde tepki verebilir.

Bir bağlama isteği onaylandıktan veya reddedildikten sonra geri çağrı almak için
`api.onConversationBindingResolved(...)` kullanın:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Geri çağrı yük alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanmış istekler için çözümlenen bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderici kimliği ve
  konuşma meta verisi

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlayabileceğini
değiştirmez ve çekirdek onay işlemi bittikten sonra çalışır.

## Sağlayıcı çalışma zamanı hook’ları

Sağlayıcı Plugin’leri artık iki katmana sahiptir:

- manifest meta verisi: çalışma zamanı yüklenmeden önce
  ucuz sağlayıcı env-auth araması için `providerAuthEnvVars`, auth paylaşan sağlayıcı varyantları için
  `providerAuthAliases`, çalışma zamanı yüklenmeden önce ucuz kanal env/kurulum araması için
  `channelEnvVars`, ayrıca çalışma zamanı yüklenmeden önce
  ucuz onboarding/auth-choice etiketleri ve CLI bayrak meta verisi için `providerAuthChoices`
- yapılandırma zamanı hook’ları: `catalog` / eski `discovery` artı `applyConfigDefaults`
- çalışma zamanı hook’ları: `normalizeModelId`, `normalizeTransport`,
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

OpenClaw yine de genel aracı döngüsüne, failover’a, transcript işlemeye ve
araç ilkesine sahiptir. Bu hook’lar, tam özel bir çıkarım transport’una
ihtiyaç duymadan sağlayıcıya özgü davranış için uzantı yüzeyidir.

Sağlayıcının, genel auth/status/model-picker yollarının Plugin
çalışma zamanını yüklemeden görebilmesi gereken env tabanlı kimlik bilgileri varsa manifest `providerAuthEnvVars`
kullanın. Bir sağlayıcı kimliği, başka bir sağlayıcı kimliğinin env değişkenlerini,
auth profillerini, yapılandırma destekli auth’unu ve API anahtarı onboarding seçeneğini yeniden kullanacaksa
manifest `providerAuthAliases` kullanın. Onboarding/auth-choice
CLI yüzeylerinin sağlayıcının seçim kimliğini, grup etiketlerini ve basit
tek bayraklı auth kablolamasını sağlayıcı çalışma zamanını yüklemeden bilmesi gerektiğinde manifest `providerAuthChoices`
kullanın. Sağlayıcı çalışma zamanı
`envVars` değerini onboarding etiketleri veya OAuth
client-id/client-secret kurulum değişkenleri gibi operatör odaklı ipuçları için tutun.

Bir kanalın, genel kabuk env yedeğinin, yapılandırma/durum denetimlerinin veya kurulum istemlerinin
kanal çalışma zamanını yüklemeden görmesi gereken env güdümlü auth veya kurulumu varsa
manifest `channelEnvVars` kullanın.

### Hook sırası ve kullanım

Model/sağlayıcı Plugin’leri için OpenClaw, hook’ları kabaca bu sırada çağırır.
“Ne zaman kullanılmalı” sütunu hızlı karar kılavuzudur.

| #   | Hook                              | Ne yapar                                                                                                       | Ne zaman kullanılmalı                                                                                                                       |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` oluşturulurken sağlayıcı yapılandırmasını `models.providers` içine yayımlar                     | Sağlayıcı bir kataloğa veya varsayılan base URL değerlerine sahipse                                                                         |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel yapılandırma varsayılanlarını uygular            | Varsayılanlar auth moduna, env’e veya sağlayıcı model-aile semantiğine bağlıysa                                                            |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal registry/catalog yolunu dener                                                            | _(bir Plugin hook’u değildir)_                                                                                                              |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model-id takma adlarını normalize eder                                       | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğine sahipse                                                                  |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı-aile `api` / `baseUrl` değerlerini normalize eder                   | Sağlayıcı, aynı transport ailesindeki özel sağlayıcı kimlikleri için transport temizliğine sahipse                                         |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalize eder                | Sağlayıcının, Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyacı varsa; paketlenmiş Google ailesi yardımcıları da desteklenen Google yapılandırma girdilerini geriden destekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel streaming-usage uyumluluk yeniden yazımlarını uygular                     | Sağlayıcının, uç nokta güdümlü yerel streaming usage meta veri düzeltmelerine ihtiyacı varsa                                               |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı auth yüklenmeden önce yapılandırma sağlayıcıları için env-marker auth’u çözer                 | Sağlayıcı, sağlayıcıya ait env-marker API anahtarı çözümlemesine sahipse; `amazon-bedrock` ayrıca burada yerleşik bir AWS env-marker çözücüsüne de sahiptir |
| 8   | `resolveSyntheticAuth`            | Düz metin kalıcılaştırmadan yerel/self-hosted veya yapılandırma destekli auth’u görünür kılar               | Sağlayıcı, sentetik/yerel bir kimlik bilgisi işaretçisiyle çalışabiliyorsa                                                                  |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici auth profillerini bindirir; CLI/uygulama sahibi kimlik bilgileri için varsayılan `persistence` değeri `runtime-only`’dir | Sağlayıcı, kopyalanmış yenileme token’larını kalıcılaştırmadan harici auth kimlik bilgilerini yeniden kullanıyorsa                         |
| 10  | `shouldDeferSyntheticProfileAuth` | Kayıtlı sentetik profil yer tutucularını env/yapılandırma destekli auth’un gerisine düşürür                 | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profiller saklıyorsa                                                             |
| 11  | `resolveDynamicModel`             | Yerel registry’de henüz olmayan sağlayıcıya ait model kimlikleri için eşzamanlı fallback sağlar             | Sağlayıcı, keyfi upstream model kimliklerini kabul ediyorsa                                                                                 |
| 12  | `prepareDynamicModel`             | Eşzamansız hazırlık yapar, ardından `resolveDynamicModel` yeniden çalışır                                    | Sağlayıcının, bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyacı varsa                                                      |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözümlenen modeli kullanmadan önce son yeniden yazımı yapar                              | Sağlayıcının transport yeniden yazımlarına ihtiyacı varsa ama yine de çekirdek transport kullanıyorsa                                      |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu transport arkasındaki satıcı modelleri için uyumluluk bayrakları katkısı sağlar            | Sağlayıcı, sağlayıcıyı devralmadan proxy transport’larda kendi modellerini tanıyorsa                                                        |
| 15  | `capabilities`                    | Paylaşılan çekirdek mantık tarafından kullanılan sağlayıcıya ait transcript/tooling meta verisi             | Sağlayıcının transcript/sağlayıcı-aile farklılıklarına ihtiyacı varsa                                                                       |
| 16  | `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalize eder                                              | Sağlayıcının transport-aile şema temizliğine ihtiyacı varsa                                                                                 |
| 17  | `inspectToolSchemas`              | Normalizasyondan sonra sağlayıcıya ait şema tanılarını görünür kılar                                         | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları vermek istiyorsa                                        |
| 18  | `resolveReasoningOutputMode`      | Yerel veya etiketlenmiş reasoning-output sözleşmesini seçer                                                  | Sağlayıcının yerel alanlar yerine etiketlenmiş reasoning/final output’a ihtiyacı varsa                                                      |
| 19  | `prepareExtraParams`              | Genel stream seçenek sarmalayıcılarından önce istek parametresi normalizasyonu yapar                        | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı varsa                                   |
| 20  | `createStreamFn`                  | Normal stream yolunu tamamen özel bir transport ile değiştirir                                               | Sağlayıcının yalnızca bir sarmalayıcı değil, özel bir kablo protokolüne ihtiyacı varsa                                                      |
| 21  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra stream sarmalayıcısı uygular                                        | Sağlayıcının özel transport olmadan istek başlığı/gövdesi/model uyumluluk sarmalayıcılarına ihtiyacı varsa                                |
| 22  | `resolveTransportTurnState`       | Yerel tur başına transport başlıkları veya meta veri ekler                                                   | Sağlayıcı, genel transport’ların sağlayıcıya özgü tur kimliğini göndermesini istiyorsa                                                     |
| 23  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket başlıkları veya oturum cooldown ilkesi ekler                                                 | Sağlayıcı, genel WS transport’ların oturum başlıklarını veya fallback ilkesini ayarlamasını istiyorsa                                      |
| 24  | `formatApiKey`                    | Auth-profile biçimlendiricisi: kayıtlı profil çalışma zamanı `apiKey` dizgesine dönüşür                     | Sağlayıcı ek auth meta verisi saklıyorsa ve özel bir çalışma zamanı token biçimine ihtiyaç duyuyorsa                                       |
| 25  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme başarısızlığı ilkesi için OAuth yenileme geçersiz kılma            | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                     |
| 26  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenecek onarım ipucunu oluşturur                                      | Sağlayıcının yenileme başarısızlığı sonrası sağlayıcıya ait auth onarım yönlendirmesine ihtiyacı varsa                                     |
| 27  | `matchesContextOverflowError`     | Sağlayıcıya ait context-window taşması eşleştiricisi                                                         | Sağlayıcının, genel sezgilerin kaçıracağı ham taşma hataları varsa                                                                          |
| 28  | `classifyFailoverReason`          | Sağlayıcıya ait failover nedeni sınıflandırması                                                              | Sağlayıcı ham API/transport hatalarını hız sınırı/aşırı yük/vb. durumlara eşleyebiliyorsa                                                  |
| 29  | `isCacheTtlEligible`              | Proxy/backhaul sağlayıcıları için prompt-cache ilkesi                                                        | Sağlayıcının proxy’ye özgü cache TTL geçitlemesine ihtiyacı varsa                                                                           |
| 30  | `buildMissingAuthMessage`         | Genel eksik-auth kurtarma mesajının yerine geçer                                                             | Sağlayıcının sağlayıcıya özgü eksik-auth kurtarma ipucuna ihtiyacı varsa                                                                    |
| 31  | `suppressBuiltInModel`            | Eski upstream model bastırma artı isteğe bağlı kullanıcıya dönük hata ipucu                                 | Sağlayıcının eski upstream satırlarını gizlemesi veya bunları bir satıcı ipucuyla değiştirmesi gerekiyorsa                                 |
| 32  | `augmentModelCatalog`             | Keşiften sonra sentetik/nihai katalog satırları ekler                                                        | Sağlayıcının `models list` ve seçiciler içinde sentetik ileri uyumluluk satırlarına ihtiyacı varsa                                         |
| 33  | `resolveThinkingProfile`          | Modele özgü `/think` düzey kümesi, görünen etiketler ve varsayılanı belirler                                | Sağlayıcı, seçili modeller için özel bir düşünme merdiveni veya ikili etiket sunuyorsa                                                     |
| 34  | `isBinaryThinking`                | Açık/kapalı reasoning geçişi için uyumluluk hook’u                                                           | Sağlayıcı yalnızca ikili düşünme açık/kapalı sunuyorsa                                                                                      |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning desteği uyumluluk hook’u                                                                   | Sağlayıcı, `xhigh` değerini yalnızca modellerin bir alt kümesinde istiyorsa                                                                 |
| 36  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk hook’u                                                                  | Sağlayıcı, bir model ailesi için varsayılan `/think` ilkesine sahipse                                                                       |
| 37  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                      | Sağlayıcı, live/smoke tercih edilen model eşleştirmesine sahipse                                                                            |
| 38  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı token’ı/anahtarına dönüştürür | Sağlayıcının bir token değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı varsa                                                   |
| 39  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözer                          | Sağlayıcının özel kullanım/kota token ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı varsa                              |
| 40  | `fetchUsageSnapshot`              | Auth çözümlendikten sonra sağlayıcıya özgü kullanım/kota snapshot’larını getirir ve normalize eder            | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya payload ayrıştırıcısına ihtiyacı varsa                                       |
| 41  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcıya ait bir embedding adaptörü oluşturur                                             | Bellek embedding davranışı sağlayıcı Plugin’iyle birlikte bulunmalıysa                                                                      |
| 42  | `buildReplayPolicy`               | Sağlayıcı için transcript işlemeyi kontrol eden bir replay ilkesi döndürür                                    | Sağlayıcının özel transcript ilkesine ihtiyacı varsa (örneğin, düşünme bloklarının çıkarılması)                                            |
| 43  | `sanitizeReplayHistory`           | Genel transcript temizliğinden sonra replay geçmişini yeniden yazar                                            | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü replay yeniden yazımlarına ihtiyacı varsa                    |
| 44  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son replay-turn doğrulamasını veya yeniden şekillendirmeyi yapar                  | Sağlayıcı transport’unun genel temizlemeden sonra daha katı tur doğrulamasına ihtiyacı varsa                                               |
| 45  | `onModelSelected`                 | Sağlayıcıya ait seçim sonrası yan etkileri çalıştırır                                                          | Bir model etkin olduğunda sağlayıcının telemetriye veya sağlayıcıya ait duruma ihtiyacı varsa                                              |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin’ini denetler, ardından model kimliğini veya transport/yapılandırmayı gerçekten değiştiren
bir tane bulunana kadar hook destekli diğer sağlayıcı Plugin’lerine düşer. Bu,
çağıranın hangi paketlenmiş Plugin’in yeniden yazıma sahip olduğunu bilmesini gerektirmeden
takma ad/uyumluluk sağlayıcı shim’lerinin çalışmasını sağlar.
Desteklenen bir Google ailesi yapılandırma girdisini hiçbir sağlayıcı hook’u yeniden yazmazsa,
paketlenmiş Google yapılandırma normalleştiricisi yine de bu
uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir kablo protokolüne veya özel bir istek yürütücüsüne ihtiyacı varsa,
bu farklı bir uzantı sınıfıdır. Bu hook’lar, hâlâ OpenClaw’ın
normal çıkarım döngüsü üzerinde çalışan sağlayıcı davranışları içindir.

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

- Anthropic, `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  ve `wrapStreamFn` kullanır; çünkü Claude 4.6 ileri uyumluluğa,
  sağlayıcı-aile ipuçlarına, auth onarım yönlendirmesine, kullanım uç noktası entegrasyonuna,
  prompt-cache uygunluğuna, auth farkındalıklı yapılandırma varsayılanlarına, Claude
  varsayılan/uyarlanabilir düşünme ilkesine ve beta başlıkları,
  `/fast` / `serviceTier` ile `context1m` için Anthropic’e özgü stream şekillendirmesine sahiptir.
- Anthropic’in Claude’a özgü stream yardımcıları şimdilik paketlenmiş Plugin’in kendi
  genel `api.ts` / `contract-api.ts` yüzeyinde kalır. Bu paket yüzeyi,
  genel SDK’yı tek bir sağlayıcının beta-header kuralları etrafında genişletmek yerine
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha alt düzey
  Anthropic sarmalayıcı kurucularını dışa aktarır.
- OpenAI, `resolveDynamicModel`, `normalizeResolvedModel` ve
  `capabilities` ile birlikte `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` ve `isModernModelRef`
  kullanır; çünkü GPT-5.4 ileri uyumluluğuna, doğrudan OpenAI
  `openai-completions` -> `openai-responses` normalizasyonuna, Codex farkındalıklı auth
  ipuçlarına, Spark bastırmaya, sentetik OpenAI liste satırlarına ve GPT-5 düşünme /
  canlı-model ilkesine sahiptir; `openai-responses-defaults` stream ailesi ise
  atıf başlıkları, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web araması,
  reasoning-compat payload şekillendirmesi ve Responses bağlam yönetimi için
  paylaşılan yerel OpenAI Responses sarmalayıcılarına sahiptir.
- OpenRouter, sağlayıcının doğrudan geçişli olması ve
  OpenClaw’ın statik kataloğu güncellenmeden önce yeni model kimlikleri sunabilmesi nedeniyle `catalog` ile birlikte `resolveDynamicModel` ve
  `prepareDynamicModel` kullanır; ayrıca sağlayıcıya özgü
  istek başlıklarını, yönlendirme meta verisini, reasoning yamalarını ve
  prompt-cache ilkesini çekirdeğin dışında tutmak için `capabilities`, `wrapStreamFn` ve `isCacheTtlEligible`
  kullanır. Replay ilkesi
  `passthrough-gemini` ailesinden gelirken, `openrouter-thinking` stream ailesi
  proxy reasoning enjeksiyonuna ve desteklenmeyen model / `auto` atlamalarına sahiptir.
- GitHub Copilot, sağlayıcıya ait cihaz girişi, model fallback davranışı, Claude transcript
  farklılıkları, GitHub token -> Copilot token değişimi ve sağlayıcıya ait kullanım
  uç noktası gerektirdiği için `catalog`, `auth`, `resolveDynamicModel` ve
  `capabilities` ile birlikte `prepareRuntimeAuth` ve `fetchUsageSnapshot` kullanır.
- OpenAI Codex, çekirdek OpenAI transport’ları üzerinde çalışmaya devam ettiği halde kendi transport/base URL
  normalizasyonuna, OAuth yenileme fallback ilkesine, varsayılan transport seçimine,
  sentetik Codex katalog satırlarına ve ChatGPT kullanım uç noktası entegrasyonuna sahip olduğu için
  `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` ve `augmentModelCatalog` ile birlikte
  `prepareExtraParams`, `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır;
  doğrudan OpenAI ile aynı `openai-responses-defaults` stream ailesini paylaşır.
- Google AI Studio ve Gemini CLI OAuth, `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` ve `isModernModelRef` kullanır; çünkü
  `google-gemini` replay ailesi Gemini 3.1 ileri uyumluluk fallback’ına,
  yerel Gemini replay doğrulamasına, bootstrap replay temizliğine, etiketlenmiş
  reasoning-output moduna ve modern model eşleştirmesine sahiptir; `google-thinking`
  stream ailesi ise Gemini thinking payload normalizasyonuna sahiptir;
  Gemini CLI OAuth ayrıca token biçimlendirme, token ayrıştırma ve kota uç noktası
  kablolaması için `formatApiKey`, `resolveUsageAuth` ve
  `fetchUsageSnapshot` kullanır.
- Anthropic Vertex, `buildReplayPolicy` değerini
  `anthropic-by-model` replay ailesi üzerinden kullanır; böylece Claude’a özgü replay temizliği
  her `anthropic-messages` transport’u yerine Claude kimlikleriyle sınırlı kalır.
- Amazon Bedrock, Anthropic-on-Bedrock trafiği için
  Bedrock’a özgü throttle/not-ready/context-overflow hata sınıflandırmasına sahip olduğu için
  `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` ve `resolveThinkingProfile` kullanır;
  replay ilkesi yine aynı yalnızca Claude `anthropic-by-model` guard’ını paylaşır.
- OpenRouter, Kilocode, Opencode ve Opencode Go,
  Gemini modellerini OpenAI uyumlu transport’lar üzerinden proxy’ledikleri ve
  yerel Gemini replay doğrulaması veya
  bootstrap yeniden yazımları olmadan Gemini thought-signature temizliğine ihtiyaç duydukları için
  `buildReplayPolicy` değerini `passthrough-gemini` replay ailesi üzerinden kullanır.
- MiniMax, tek bir sağlayıcı hem
  Anthropic-message hem de OpenAI uyumlu semantiğe sahip olduğu için
  `buildReplayPolicy` değerini `hybrid-anthropic-openai` replay ailesi üzerinden kullanır;
  Anthropic tarafında yalnızca Claude düşünme bloğu düşürmeyi korurken reasoning
  output modunu yeniden yerel duruma geçirir ve `minimax-fast-mode` stream ailesi
  paylaşılan stream yolunda fast-mode model yeniden yazımlarına sahiptir.
- Moonshot, paylaşılan
  OpenAI transport’unu kullanmaya devam ettiği halde sağlayıcıya ait thinking payload normalizasyonuna ihtiyaç duyduğu için `catalog`, `resolveThinkingProfile` ve `wrapStreamFn` kullanır;
  `moonshot-thinking` stream ailesi, yapılandırma artı `/think` durumunu kendi
  yerel ikili düşünme payload’ına eşler.
- Kilocode, sağlayıcıya ait istek başlıklarına,
  reasoning payload normalizasyonuna, Gemini transcript ipuçlarına ve Anthropic
  cache-TTL geçitlemesine ihtiyaç duyduğu için `catalog`, `capabilities`, `wrapStreamFn` ve
  `isCacheTtlEligible` kullanır; `kilocode-thinking` stream ailesi Kilo thinking
  enjeksiyonunu paylaşılan proxy stream yolunda tutarken `kilo/auto` ve
  açık reasoning payload’larını desteklemeyen diğer proxy model kimliklerini atlar.
- Z.AI, GLM-5 fallback’ına,
  `tool_stream` varsayılanlarına, ikili düşünme UX’ine, modern model eşleştirmesine ve hem
  kullanım auth’una hem de kota getirmeye sahip olduğu için `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır; `tool-stream-default-on` stream ailesi ise
  varsayılan açık `tool_stream` sarmalayıcısını sağlayıcı başına el yazımı glue kodunun dışında tutar.
- xAI, yerel xAI Responses transport normalizasyonuna, Grok fast-mode
  takma ad yeniden yazımlarına, varsayılan `tool_stream` değerine, katı araç / reasoning-payload
  temizliğine, Plugin’e ait araçlar için fallback auth yeniden kullanımına, ileri uyumlu Grok
  model çözümlemesine ve xAI tool-schema
  profili, desteklenmeyen şema anahtar sözcükleri, yerel `web_search` ve HTML entity
  araç çağrısı argüman çözümleme gibi sağlayıcıya ait uyumluluk yamalarına sahip olduğu için
  `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` ve `isModernModelRef`
  kullanır.
- Mistral, OpenCode Zen ve OpenCode Go,
  transcript/tooling farklılıklarını çekirdeğin dışında tutmak için yalnızca `capabilities` kullanır.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve `volcengine` gibi yalnızca katalog sağlayan paketlenmiş sağlayıcılar
  yalnızca `catalog` kullanır.
- Qwen, metin sağlayıcısı için `catalog` ile birlikte çok kipli yüzeyleri için paylaşılan medya anlama ve
  video oluşturma kayıtlarını kullanır.
- MiniMax ve Xiaomi, çıkarım hâlâ paylaşılan
  transport’lar üzerinden çalışsa da `/usage`
  davranışları Plugin’e ait olduğu için `catalog` ile birlikte kullanım hook’larını kullanır.

## Çalışma zamanı yardımcıları

Plugin’ler, `api.runtime` üzerinden seçili çekirdek yardımcılarına erişebilir. TTS için:

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

- `textToSpeech`, dosya/sesli not yüzeyleri için normal çekirdek TTS çıktı payload’ını döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses arabelleği + örnekleme oranı döndürür. Plugin’ler sağlayıcılar için yeniden örnekleme/kodlama yapmalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Satıcıya ait ses seçicileri veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkındalıklı seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefon desteği sunar. Microsoft sunmaz.

Plugin’ler ayrıca `api.registerSpeechProvider(...)` aracılığıyla konuşma sağlayıcıları kaydedebilir.

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

- TTS ilkesini, fallback’ı ve yanıt teslimini çekirdekte tutun.
- Satıcıya ait sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalize edilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: bir satıcı Plugin’i,
  OpenClaw bu capability sözleşmelerini ekledikçe metin, konuşma, görüntü ve gelecekteki medya sağlayıcılarına sahip olabilir.

Görüntü/ses/video anlama için, Plugin’ler genel bir anahtar/değer torbası yerine
typed bir medya anlama sağlayıcısı kaydeder:

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

- Orkestrasyonu, fallback’ı, yapılandırmayı ve kanal bağlamasını çekirdekte tutun.
- Satıcı davranışını sağlayıcı Plugin’inde tutun.
- Eklemeli genişleme typed kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı capability’ler.
- Video oluşturma zaten aynı örüntüyü izler:
  - çekirdek capability sözleşmesine ve çalışma zamanı yardımcısına sahiptir
  - satıcı Plugin’leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Plugin’leri `api.runtime.videoGeneration.*` değerini tüketir

Medya anlama çalışma zamanı yardımcıları için, Plugin’ler şunları çağırabilir:

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

Ses transkripsiyonu için, Plugin’ler medya anlama çalışma zamanını
veya eski STT takma adını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`,
  görüntü/ses/video anlama için tercih edilen paylaşılan yüzeydir.
- Çekirdek medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı fallback sırasını kullanır.
- Transkripsiyon çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk takma adı olarak kalır.

Plugin’ler ayrıca `api.runtime.subagent` aracılığıyla arka planda alt aracı çalıştırmaları başlatabilir:

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

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalıştırma başına isteğe bağlı geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin’e ait fallback çalıştırmaları için, operatörlerin `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça izin vermesi gerekir.
- Güvenilir Plugin’leri belirli kanonik `provider/model` hedefleriyle sınırlamak için `plugins.entries.<id>.subagent.allowedModels`, herhangi bir hedefe açıkça izin vermek için ise `"*"` kullanın.
- Güvenilmeyen Plugin alt aracı çalıştırmaları yine de çalışır, ancak geçersiz kılma istekleri sessizce fallback yapmak yerine reddedilir.

Web araması için, Plugin’ler aracı araç bağlamasına
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

Plugin’ler ayrıca
`api.registerWebSearchProvider(...)` aracılığıyla web arama sağlayıcıları kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek semantiğini çekirdekte tutun.
- Satıcıya özgü arama transport’ları için web arama sağlayıcıları kullanın.
- `api.runtime.webSearch.*`, arama davranışına aracı araç sarmalayıcısına bağımlı olmadan ihtiyaç duyan özellik/kanal Plugin’leri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış görüntü oluşturma sağlayıcı zincirini kullanarak görüntü oluşturur.
- `listProviders(...)`: kullanılabilir görüntü oluşturma sağlayıcılarını ve capability’lerini listeler.

## Gateway HTTP route’ları

Plugin’ler `api.registerHttpRoute(...)` ile HTTP uç noktaları açığa çıkarabilir.

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

Route alanları:

- `path`: Gateway HTTP sunucusu altındaki route yolu.
- `auth`: zorunlu. Normal Gateway auth gerektirmek için `"gateway"`, Plugin yönetimli auth/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin’in kendi mevcut route kaydını değiştirmesine izin verir.
- `handler`: route isteği işlediğinde `true` döndürmelidir.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin route’ları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadıkça reddedilir ve bir Plugin başka bir Plugin’in route’unu değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan route’lar reddedilir. `exact`/`prefix` fallthrough zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` route’ları otomatik olarak operatör çalışma zamanı kapsamları almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin yönetimli Webhook’lar/imza doğrulaması içindir.
- `auth: "gateway"` route’ları bir Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam bilerek muhafazakârdır:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile Plugin-route çalışma zamanı kapsamlarını `operator.write` değerine sabitler
  - güvenilir kimlik taşıyan HTTP kipleri (örneğin `trusted-proxy` veya özel bir girişte `gateway.auth.mode = "none"`) yalnızca başlık açıkça mevcutsa `x-openclaw-scopes` değerini dikkate alır
  - bu kimlik taşıyan Plugin-route isteklerinde `x-openclaw-scopes` yoksa çalışma zamanı kapsamı `operator.write` değerine fallback yapar
- Pratik kural: Gateway-auth bir Plugin route’unun örtük yönetici yüzeyi olduğunu varsaymayın. Route’unuz yalnızca yönetici davranışına ihtiyaç duyuyorsa, kimlik taşıyan bir auth modu gerektirin ve açık `x-openclaw-scopes` başlığı sözleşmesini belgelendirin.

## Plugin SDK import yolları

Plugin geliştirirken tek parça `openclaw/plugin-sdk` import’u yerine
SDK alt yollarını kullanın:

- Plugin kayıt ilkeləri için `openclaw/plugin-sdk/plugin-entry`.
- Genel paylaşılan Plugin’e dönük sözleşme için `openclaw/plugin-sdk/core`.
- Kök `openclaw.json` Zod şema
  dışa aktarımı (`OpenClawSchema`) için `openclaw/plugin-sdk/config-schema`.
- `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` ve
  `openclaw/plugin-sdk/webhook-ingress` gibi kararlı kanal ilkeləri; paylaşılan kurulum/auth/yanıt/Webhook
  bağlaması içindir. `channel-inbound`, debounce, mention eşleştirme,
  gelen mention-policy yardımcıları, zarf biçimlendirmesi ve gelen zarf
  bağlam yardımcıları için paylaşılan ana yerdir.
  `channel-setup`, dar isteğe bağlı kurulum yüzeyidir.
  `setup-runtime`, `setupEntry` /
  ertelenmiş başlangıç tarafından kullanılan çalışma zamanı güvenli kurulum yüzeyidir; import güvenli kurulum yama adaptörlerini de içerir.
  `setup-adapter-runtime`, env farkındalıklı hesap kurulum adaptörü yüzeyidir.
  `setup-tools`, küçük CLI/arşiv/dokümantasyon yardımcı yüzeyidir (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` ve
  `openclaw/plugin-sdk/directory-runtime` gibi alan alt yolları; paylaşılan çalışma zamanı/yapılandırma yardımcıları içindir.
  `telegram-command-config`, Telegram özel
  komut normalizasyonu/doğrulaması için dar genel yüzeydir ve paketlenmiş
  Telegram sözleşme yüzeyi geçici olarak kullanılamasa bile erişilebilir kalır.
  `text-runtime`, assistant-visible-text ayıklama,
  markdown oluşturma/parçalama yardımcıları, redaksiyon
  yardımcıları, directive-tag yardımcıları ve safe-text araçları dâhil
  paylaşılan metin/Markdown/loglama yüzeyidir.
- Onaya özgü kanal yüzeyleri, Plugin üzerinde tek bir `approvalCapability`
  sözleşmesini tercih etmelidir. Böylece çekirdek, onay auth’unu, teslimi, oluşturmeyi,
  yerel yönlendirmeyi ve tembel yerel işleyici davranışını,
  onay davranışını ilgisiz Plugin alanlarına karıştırmak yerine bu tek capability üzerinden okur.
- `openclaw/plugin-sdk/channel-runtime` artık önerilmez ve yalnızca
  eski Plugin’ler için uyumluluk shim’i olarak kalır. Yeni kod bunun yerine daha dar
  genel ilkeləri içe aktarmalıdır ve depo kodu shim’e yeni import’lar eklememelidir.
- Paketlenmiş uzantı iç yapıları özel kalır. Dış Plugin’ler yalnızca
  `openclaw/plugin-sdk/*` alt yollarını kullanmalıdır. OpenClaw çekirdek/test kodu,
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` ve
  `login-qr-api.js` gibi dar kapsamlı dosyalar gibi bir Plugin paket kökü altındaki depo
  genel giriş noktalarını kullanabilir. Çekirdekten veya başka bir uzantıdan bir Plugin paketinin `src/*` yolunu asla içe aktarmayın.
- Depo giriş noktası ayrımı:
  `<plugin-package-root>/api.js` yardımcı/tip barrel’ıdır,
  `<plugin-package-root>/runtime-api.js` yalnızca çalışma zamanı barrel’ıdır,
  `<plugin-package-root>/index.js` paketlenmiş Plugin girişidir,
  `<plugin-package-root>/setup-entry.js` ise kurulum Plugin girişidir.
- Güncel paketlenmiş sağlayıcı örnekleri:
  - Anthropic, `wrapAnthropicProviderStream`, beta-header yardımcıları ve `service_tier`
    ayrıştırması gibi Claude stream yardımcıları için `api.js` / `contract-api.js` kullanır.
  - OpenAI, sağlayıcı oluşturucular, varsayılan model yardımcıları ve
    gerçek zamanlı sağlayıcı oluşturucular için `api.js` kullanır.
  - OpenRouter, sağlayıcı oluşturucusu ile onboarding/yapılandırma
    yardımcıları için `api.js` kullanır; `register.runtime.js` ise depo içi kullanım için genel
    `plugin-sdk/provider-stream` yardımcılarını yine dışa aktarabilir.
- Facade ile yüklenen genel giriş noktaları, varsa etkin çalışma zamanı yapılandırma snapshot’ını
  tercih eder; OpenClaw henüz çalışma zamanı snapshot’ı sunmuyorsa, diskte çözülmüş yapılandırma dosyasına fallback yapar.
- Genel paylaşılan ilkelər tercih edilen genel SDK sözleşmesi olarak kalır. Paketlenmiş kanal markalı yardımcı yüzeylerden oluşan küçük bir ayrılmış uyumluluk kümesi hâlâ vardır. Bunları yeni
  üçüncü taraf import hedefleri olarak değil, paketlenmiş bakım/uyumluluk yüzeyleri olarak değerlendirin; yeni kanallar arası sözleşmeler yine genel `plugin-sdk/*` alt yollarına veya Plugin’e özgü yerel `api.js` /
  `runtime-api.js` barrel’larına inmelidir.

Uyumluluk notu:

- Yeni kod için kök `openclaw/plugin-sdk` barrel’ından kaçının.
- Önce dar ve kararlı ilkeləri tercih edin. Daha yeni setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool alt yolları, yeni paketlenmiş ve dış Plugin çalışmaları için
  hedeflenen sözleşmedir.
  Hedef ayrıştırma/eşleştirme `openclaw/plugin-sdk/channel-targets` üzerinde yer almalıdır.
  Mesaj eylemi geçitleri ve reaction message-id yardımcıları ise
  `openclaw/plugin-sdk/channel-actions` üzerinde yer almalıdır.
- Paketlenmiş uzantıya özgü yardımcı barrel’lar varsayılan olarak kararlı değildir. Bir
  yardımcı yalnızca paketlenmiş bir uzantı tarafından gerekiyorsa, bunu
  `openclaw/plugin-sdk/<extension>` içine yükseltmek yerine uzantının yerel
  `api.js` veya `runtime-api.js` yüzeyinin arkasında tutun.
- Yeni paylaşılan yardımcı yüzeyler kanala markalı değil, genel olmalıdır. Paylaşılan hedef
  ayrıştırma `openclaw/plugin-sdk/channel-targets` üzerinde yer alır; kanala özgü
  iç yapılar ise sahibi olan Plugin’in yerel `api.js` veya `runtime-api.js`
  yüzeyinin arkasında kalır.
- `image-generation`,
  `media-understanding` ve `speech` gibi capability’ye özgü alt yollar, paketlenmiş/yerel Plugin’ler bugün
  bunları kullandığı için vardır. Bunların varlığı tek başına dışa aktarılan her yardımcının
  uzun vadeli donmuş bir dış sözleşme olduğu anlamına gelmez.

## Mesaj aracı şemaları

Plugin’ler kanala özgü `describeMessageTool(...)` şema
katkılarına sahip olmalıdır. Sağlayıcıya özgü alanları paylaşılan çekirdekte değil, Plugin içinde tutun.

Paylaşılan taşınabilir şema parçaları için,
`openclaw/plugin-sdk/channel-actions` üzerinden dışa aktarılan genel yardımcıları yeniden kullanın:

- Düğme ızgarası tarzı payload’lar için `createMessageToolButtonsSchema()`
- Yapılandırılmış kart payload’ları için `createMessageToolCardSchema()`

Bir şema biçimi yalnızca tek bir sağlayıcı için anlamlıysa, bunu paylaşılan SDK’ya yükseltmek yerine
o Plugin’in kendi kaynağında tanımlayın.

## Kanal hedef çözümleme

Kanal Plugin’leri kanala özgü hedef semantiğine sahip olmalıdır. Paylaşılan
giden host’u genel tutun ve sağlayıcı kuralları için mesajlaşma adaptörü yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalize edilmiş bir hedefin
  dizin aramasından önce `direct`, `group` veya `channel` olarak mı ele alınacağını belirler.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir
  girdinin dizin araması yerine doğrudan kimlik benzeri çözümlemeye atlayıp atlamaması gerektiğini çekirdeğe söyler.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalizasyondan sonra veya
  dizin ıskasından sonra sağlayıcıya ait son çözümlemeye ihtiyaç duyduğunda Plugin fallback’idir.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra sağlayıcıya özgü oturum
  yol yapısına sahiptir.

Önerilen ayrım:

- Eşler/gruplar aranmeden önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- “Buna açık/yerel hedef kimliği gibi davran” denetimleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalizasyon fallback’i için `resolveTarget` kullanın.
- Sohbet kimlikleri, thread kimlikleri, JID’ler, handle’lar ve oda
  kimlikleri gibi sağlayıcıya özgü yerel kimlikleri genel SDK
  alanlarında değil, `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten Plugin’ler, bu mantığı
Plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, bir kanalın şu tür yapılandırma destekli eşlere/gruplara ihtiyaç duyduğu durumlarda kullanın:

- izin listesi güdümlü DM eşleri
- yapılandırılmış kanal/grup eşlemleri
- hesap kapsamlı statik dizin fallback’leri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulama
- tekrar kaldırma/normalizasyon yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalizasyonu,
Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin’leri, çıkarım için
`registerProvider({ catalog: { run(...) { ... } } })` ile model katalogları tanımlayabilir.

`catalog.run(...)`, OpenClaw’ın
`models.providers` içine yazdığıyla aynı biçimi döndürür:

- tek sağlayıcı girdisi için `{ provider }`
- çoklu sağlayıcı girdileri için `{ providers }`

Plugin, sağlayıcıya özgü model kimliklerine, varsayılan base URL
değerlerine veya auth ile kapatılmış model meta verisine sahipse `catalog` kullanın.

`catalog.order`, bir Plugin’in kataloğunun OpenClaw’ın
yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarı veya env güdümlü sağlayıcılar
- `profile`: auth profilleri mevcut olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Daha sonraki sağlayıcılar anahtar çakışmasında kazanır; böylece Plugin’ler aynı sağlayıcı kimliğine sahip
yerleşik bir sağlayıcı girdisini bilerek geçersiz kılabilir.

Uyumluluk:

- `discovery` hâlâ eski bir takma ad olarak çalışır
- hem `catalog` hem `discovery` kayıtlıysa, OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin’iniz bir kanal kaydediyorsa,
`resolveAccount(...)` ile birlikte `plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin
  tamamen somutlaştığını varsayabilir ve gerekli sırlar eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yollarının, yapılandırmayı açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırmasına gerek olmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- Gerekli olduğunda aşağıdaki gibi kimlik bilgisi kaynağı/durum alanlarını ekleyin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği bildirmek için ham token değerlerini
  döndürmeniz gerekmez. `tokenStatus: "available"` (ve eşleşen kaynak
  alanı) döndürmek, durum tarzı komutlar için yeterlidir.
- Bir kimlik bilgisi SecretRef ile yapılandırılmışsa ama mevcut komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların çökmeden veya hesabın yapılandırılmadığını yanlış bildirmeden
“yapılandırılmış ama bu komut yolunda kullanılamıyor” şeklinde rapor vermesini sağlar.

## Paket paketleri

Bir Plugin dizini `openclaw.extensions` içeren bir `package.json` içerebilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her girdi bir Plugin olur. Paket birden çok uzantı listeliyorsa Plugin kimliği
`name/<fileBase>` olur.

Plugin’iniz npm bağımlılıkları içe aktarıyorsa,
`node_modules` erişilebilir olsun diye bunları o dizinde kurun (`npm install` / `pnpm install`).

Güvenlik korkuluğu: her `openclaw.extensions` girdisi symlink çözümlemesinden sonra
Plugin dizini içinde kalmalıdır. Paket dizininden kaçan girdiler
reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını
`npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betiği yok, çalışma zamanında dev bağımlılıkları yok). Plugin bağımlılık
ağaçlarını “salt JS/TS” tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülünü gösterebilir.
OpenClaw devre dışı bir kanal Plugin’i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal Plugin’i etkin ama hâlâ yapılandırılmamış olduğunda, tam Plugin girişi yerine `setupEntry`
yükler. Bu, ana Plugin girdiniz araçlar, hook’lar veya diğer yalnızca çalışma zamanı
kodlarını da bağlıyorsa başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
kanal zaten yapılandırılmış olsa bile bir kanal Plugin’ini Gateway’in
dinleme öncesi başlangıç aşamasında aynı `setupEntry` yoluna alabilir.

Bunu yalnızca `setupEntry`, Gateway dinlemeye başlamadan
önce var olması gereken başlangıç yüzeyini tam olarak kapsıyorsa kullanın. Pratikte bu, kurulum girişinin
başlangıcın bağlı olduğu her kanala ait capability’yi kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- Gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP route’ları
- aynı pencere sırasında var olması gereken tüm Gateway yöntemleri, araçlar veya hizmetler

Tam girişiniz hâlâ gerekli bir başlangıç capability’sine sahipse bu bayrağı etkinleştirmeyin.
Plugin’i varsayılan davranışta bırakın ve OpenClaw’ın başlangıç sırasında
tam girişi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca, çekirdeğin tam kanal çalışma zamanı yüklenmeden önce
danışabileceği yalnızca kurulum sözleşme yüzeyi yardımcıları da yayımlayabilir. Geçerli kurulum
yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, tam Plugin girişini yüklemeden eski tek hesaplı kanal
yapılandırmasını `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu yüzeyi kullanır.
Matrix, mevcut paketlenmiş örnektir: adlandırılmış hesaplar zaten varsa yalnızca auth/bootstrap anahtarlarını
adlandırılmış yükseltilmiş bir hesaba taşır ve her zaman
`accounts.default` oluşturmak yerine yapılandırılmış kanonik olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama adaptörleri, paketlenmiş sözleşme yüzeyi keşfini tembel tutar. İçe aktarma
zamanı hafif kalır; yükseltme yüzeyi modül içe aktarımında paketlenmiş kanal başlangıcına yeniden girmek yerine
yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri Gateway RPC yöntemleri içerdiğinde,
bunları Plugin’e özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve
bir Plugin daha dar kapsam isterse istesin her zaman `operator.admin` olarak çözülür.

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

Kanal Plugin’leri, `openclaw.channel` aracılığıyla kurulum/keşif meta verisi ve
`openclaw.install` aracılığıyla kurulum ipuçları ilan edebilir. Bu, çekirdek kataloğu verisiz tutar.

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

En düşük örneğin ötesinde yararlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: dokümantasyon bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi kopya denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı Markdown yetenekli olarak işaretler
- `exposure.configured`: `false` ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: kanalı dokümantasyon gezinme yüzeyleri için iç/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için eski takma adlar hâlâ kabul edilir; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart quickstart `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlaması gerektirir
- `preferSessionLookupForAnnounceTarget`: duyuru hedeflerini çözümlerken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin bir MPM
registry dışa aktarımı). Şu konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değerini
bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı ayrıca `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` anahtarlarını da kabul eder.

## Bağlam motoru Plugin’leri

Bağlam motoru Plugin’leri, alım, birleştirme
ve Compaction için oturum bağlamı orkestrasyonuna sahiptir. Bunları Plugin’inizden
`api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, Plugin’inizin yalnızca bellek araması veya hook’lar eklemek yerine varsayılan bağlam
hattını değiştirmesi veya genişletmesi gerektiğinde kullanın.

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

Motorunuz Compaction algoritmasına **sahip değilse**, `compact()`
uygulamasını koruyun ve bunu açıkça devredin:

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

## Yeni bir capability ekleme

Bir Plugin mevcut API’ye uymayan davranışa ihtiyaç duyduğunda, özel bir içe uzanmayla
Plugin sistemini atlamayın. Eksik capability’yi ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi paylaşılan davranışa sahip olması gerektiğine karar verin: ilke, fallback, yapılandırma birleştirme,
   yaşam döngüsü, kanal odaklı semantik ve çalışma zamanı yardımcısı biçimi.
2. typed Plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` değerini en küçük yararlı
   typed capability yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik Plugin’leri yeni capability’yi doğrudan bir satıcı uygulamasını içe aktararak değil,
   çekirdek üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Ardından satıcı Plugin’leri arka uçlarını capability’ye karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Zaman içinde sahiplik ve kayıt biçimi açık kalsın diye testler ekleyin.

OpenClaw bu şekilde tek bir sağlayıcının dünya görüşüne sabit kodlanmadan
görüş sahibi kalır. Somut dosya kontrol listesi ve uygulanmış örnek için bkz. [Capability Cookbook](/tr/plugins/architecture).

### Capability kontrol listesi

Yeni bir capability eklediğinizde, uygulama genellikle şu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme tipleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki Plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki Plugin kayıt sistemi bağlaması
- özellik/kanal Plugin’lerinin bunu tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki Plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/Plugin belgeleri

Bu yüzeylerden biri eksikse, bu genellikle capability’nin
henüz tam entegre edilmediğinin işaretidir.

### Capability şablonu

En küçük örüntü:

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

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Sözleşme test örüntüsü:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- çekirdek capability sözleşmesine + orkestrasyona sahiptir
- satıcı Plugin’leri satıcı uygulamalarına sahiptir
- özellik/kanal Plugin’leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar
