---
read_when:
    - Yerel OpenClaw eklentileri oluşturma veya hata ayıklama
    - Eklenti yetenek modelini veya sahiplik sınırlarını anlama
    - Eklenti yükleme hattı veya kayıt sistemi üzerinde çalışma
    - Sağlayıcı çalışma zamanı kancalarını veya kanal eklentilerini uygulama
sidebarTitle: Internals
summary: 'Eklenti iç yapıları: yetenek modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Eklenti İç Yapıları
x-i18n:
    generated_at: "2026-04-12T08:32:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f4f8e6bcb14358b3aaa698d03faf456bbeebc04a6d70d1ae6451b02ab17cf09
    source_path: plugins/architecture.md
    workflow: 15
---

# Eklenti İç Yapıları

<Info>
  Bu, **derin mimari başvuru kaynağıdır**. Pratik kılavuzlar için şunlara bakın:
  - [Eklentileri yükleyin ve kullanın](/tr/tools/plugin) — kullanıcı kılavuzu
  - [Başlangıç](/tr/plugins/building-plugins) — ilk eklenti eğitimi
  - [Kanal Eklentileri](/tr/plugins/sdk-channel-plugins) — bir mesajlaşma kanalı oluşturun
  - [Sağlayıcı Eklentileri](/tr/plugins/sdk-provider-plugins) — bir model sağlayıcısı oluşturun
  - [SDK Genel Bakış](/tr/plugins/sdk-overview) — içe aktarma haritası ve kayıt API'si
</Info>

Bu sayfa, OpenClaw eklenti sisteminin iç mimarisini kapsar.

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki genel **yerel eklenti** modelidir. Her
yerel OpenClaw eklentisi bir veya daha fazla yetenek türüne kayıt olur:

| Yetenek               | Kayıt yöntemi                                   | Örnek eklentiler                     |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Metin çıkarımı        | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| CLI çıkarım arka ucu  | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Konuşma               | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Gerçek zamanlı yazıya döküm | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Görsel oluşturma      | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Müzik oluşturma       | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Video oluşturma       | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Web getirme           | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Web arama             | `api.registerWebSearchProvider(...)`            | `google`                             |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Sıfır yetenek kaydeden ancak kancalar, araçlar veya
hizmetler sağlayan bir eklenti, **eski yalnızca kanca** eklentisidir. Bu desen
hala tamamen desteklenmektedir.

### Harici uyumluluk duruşu

Yetenek modeli çekirdeğe yerleşmiştir ve bugün paketlenmiş/yerel eklentiler
tarafından kullanılmaktadır, ancak harici eklenti uyumluluğu için "dışa
aktarılmışsa dondurulmuştur" yaklaşımından daha sıkı bir çıta hâlâ gereklidir.

Geçerli rehberlik:

- **mevcut harici eklentiler:** kanca tabanlı entegrasyonları çalışır durumda
  tutun; bunu uyumluluk temel çizgisi olarak değerlendirin
- **yeni paketlenmiş/yerel eklentiler:** satıcıya özgü iç erişimler veya yeni
  yalnızca kanca tasarımları yerine açık yetenek kaydını tercih edin
- **yetenek kaydını benimseyen harici eklentiler:** izin verilir, ancak
  belgeler açıkça bir sözleşmenin kararlı olduğunu belirtmedikçe
  yeteneğe özgü yardımcı yüzeyleri gelişmekte olan yüzeyler olarak değerlendirin

Pratik kural:

- yetenek kayıt API'leri amaçlanan yöndür
- geçiş sırasında eski kancalar, harici eklentiler için en güvenli
  bozulmama yoludur
- dışa aktarılan yardımcı alt yolların hepsi eşit değildir; tesadüfi yardımcı
  dışa aktarımlarını değil, belgelenmiş dar sözleşmeyi tercih edin

### Eklenti şekilleri

OpenClaw, yüklenen her eklentiyi gerçek kayıt davranışına göre (yalnızca
statik meta veriye göre değil) bir şekle sınıflandırır:

- **plain-capability** -- tam olarak bir yetenek türü kaydeder (örneğin
  `mistral` gibi yalnızca sağlayıcı eklentisi)
- **hybrid-capability** -- birden fazla yetenek türü kaydeder (örneğin
  `openai`; metin çıkarımı, konuşma, medya anlama ve görsel
  oluşturmanın sahibidir)
- **hook-only** -- yalnızca kancalar kaydeder (türlü veya özel), yetenek,
  araç, komut veya hizmet yoktur
- **non-capability** -- yetenek olmadan araçlar, komutlar, hizmetler veya
  yollar kaydeder

Bir eklentinin şeklini ve yetenek dökümünü görmek için
`openclaw plugins inspect <id>` kullanın. Ayrıntılar için
[CLI reference](/cli/plugins#inspect) bölümüne bakın.

### Eski kancalar

`before_agent_start` kancası, yalnızca kanca kullanan eklentiler için bir
uyumluluk yolu olarak desteklenmeye devam eder. Eski gerçek dünya eklentileri
hala buna bağımlıdır.

Yön:

- çalışır durumda tutun
- bunu eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma işleri için `before_model_resolve` tercih edin
- istem değişikliği işleri için `before_prompt_build` tercih edin
- yalnızca gerçek kullanım düştükten ve fixture kapsamı geçiş güvenliğini
  kanıtladıktan sonra kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda şu
etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlamı                                                       |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Yapılandırma sorunsuz ayrıştırılır ve eklentiler çözülür     |
| **compatibility advisory** | Eklenti desteklenen ama daha eski bir desen kullanıyor (örn. `hook-only`) |
| **legacy warning**         | Eklenti `before_agent_start` kullanıyor; bu kullanım kullanımdan kaldırılmıştır |
| **hard error**             | Yapılandırma geçersizdir veya eklenti yüklenememiştir        |

Ne `hook-only` ne de `before_agent_start` bugün eklentinizi bozmaz --
`hook-only` tavsiye niteliğindedir ve `before_agent_start` yalnızca bir uyarı
tetikler. Bu sinyaller `openclaw status --all` ve `openclaw plugins doctor`
çıktılarında da görünür.

## Mimariye genel bakış

OpenClaw'ın eklenti sistemi dört katmandan oluşur:

1. **Manifest + keşif**
   OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden,
   genel uzantı köklerinden ve paketlenmiş uzantılardan aday eklentileri bulur.
   Keşif, önce yerel `openclaw.plugin.json` manifestlerini ve desteklenen
   paket manifestlerini okur.
2. **Etkinleştirme + doğrulama**
   Çekirdek, keşfedilmiş bir eklentinin etkin, devre dışı, engellenmiş veya
   bellek gibi özel bir yuva için seçilmiş olup olmadığına karar verir.
3. **Çalışma zamanı yükleme**
   Yerel OpenClaw eklentileri jiti aracılığıyla aynı süreç içinde yüklenir ve
   yetenekleri merkezi bir kayıt sistemine kaydeder. Uyumlu paketler, çalışma
   zamanı kodu içe aktarılmadan kayıt sistemi kayıtlarına normalize edilir.
4. **Yüzey tüketimi**
   OpenClaw'ın geri kalanı; araçları, kanalları, sağlayıcı kurulumunu,
   kancaları, HTTP yollarını, CLI komutlarını ve hizmetleri ortaya çıkarmak
   için kayıt sistemini okur.

Özellikle eklenti CLI için, kök komut keşfi iki aşamaya ayrılmıştır:

- ayrıştırma zamanı meta verisi `registerCli(..., { descriptors: [...] })`
  içinden gelir
- gerçek eklenti CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, eklentiye ait CLI kodunu eklentinin içinde tutarken OpenClaw'ın ayrıştırma
öncesinde kök komut adlarını ayırmasına yine de izin verir.

Önemli tasarım sınırı:

- keşif + yapılandırma doğrulaması, eklenti kodu çalıştırılmadan
  **manifest/schema meta verisi** üzerinden çalışabilmelidir
- yerel çalışma zamanı davranışı eklenti modülünün `register(api)` yolundan gelir

Bu ayrım, tam çalışma zamanı etkinleşmeden önce OpenClaw'ın yapılandırmayı
doğrulamasına, eksik/devre dışı eklentileri açıklamasına ve UI/schema ipuçları
oluşturmasına olanak tanır.

### Kanal eklentileri ve paylaşılan message aracı

Kanal eklentilerinin, normal sohbet eylemleri için ayrı bir gönder/düzenle/tepki
aracı kaydetmesi gerekmez. OpenClaw çekirdekte tek bir paylaşılan `message`
aracı tutar ve kanal eklentileri bunun arkasındaki kanala özgü keşif ve yürütmenin
sahibidir.

Geçerli sınır şöyledir:

- çekirdek; paylaşılan `message` araç barındırıcısının, istem bağlamasının,
  oturum/iş parçacığı kayıtlarının ve yürütme dağıtımının sahibidir
- kanal eklentileri; kapsamlı eylem keşfinin, yetenek keşfinin ve kanala özgü
  tüm şema parçalarının sahibidir
- kanal eklentileri; konuşma kimliklerinin iş parçacığı kimliklerini nasıl
  kodladığı veya üst konuşmalardan nasıl miras aldığı gibi, sağlayıcıya özgü
  oturum konuşma dil bilgisinin sahibidir
- kanal eklentileri son eylemi kendi eylem bağdaştırıcıları üzerinden yürütür

Kanal eklentileri için SDK yüzeyi
`ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik
keşif çağrısı, bir eklentinin görünür eylemlerini, yeteneklerini ve şema
katkılarını birlikte döndürmesine olanak tanır; böylece bu parçalar birbirinden
kopmaz.

Çekirdek, çalışma zamanı kapsamını bu keşif adımına geçirir. Önemli alanlar:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı eklentiler için önemlidir. Bir kanal, etkin hesaba,
geçerli odaya/iş parçacığına/mesaja veya güvenilir istemci kimliğine göre
mesaj eylemlerini gizleyebilir ya da gösterebilir; bunu çekirdek `message`
aracında kanala özgü dallanmaları sabit kodlamadan yapar.

Bu nedenle gömülü çalıştırıcı yönlendirme değişiklikleri hâlâ eklenti işidir:
çalıştırıcı, paylaşılan `message` aracının geçerli tur için doğru kanal sahipli
yüzeyi göstermesi amacıyla geçerli sohbet/oturum kimliğini eklenti keşif
sınırına iletmekten sorumludur.

Kanala ait yürütme yardımcıları için, paketlenmiş eklentiler yürütme çalışma
zamanını kendi uzantı modülleri içinde tutmalıdır. Çekirdek artık
`src/agents/tools` altında Discord, Slack, Telegram veya WhatsApp mesaj-eylem
çalışma zamanlarının sahibi değildir. Ayrı `plugin-sdk/*-action-runtime` alt
yolları yayımlamıyoruz ve paketlenmiş eklentiler kendi yerel çalışma zamanı
kodlarını doğrudan kendi uzantı sahipli modüllerinden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK bağlantı yüzeyleri için de geçerlidir:
çekirdek; Slack, Discord, Signal, WhatsApp veya benzeri uzantılar için kanala
özgü kolaylık barrel'larını içe aktarmamalıdır. Çekirdeğin bir davranışa
ihtiyacı varsa ya paketlenmiş eklentinin kendi `api.ts` / `runtime-api.ts`
barrel'ını tüketmeli ya da bu ihtiyacı paylaşılan SDK'da dar bir genel
yeteneğe yükseltmelidir.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel
  yoldur
- `actions.handleAction("poll")`, kanala özgü anket anlamları veya ek anket
  parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını, eklenti sahipli anket dağıtımı
eylemi reddettikten sonraya erteler; böylece eklenti sahipli anket işleyicileri
önce genel anket ayrıştırıcısı tarafından engellenmeden kanala özgü anket
alanlarını kabul edebilir.

Tam başlangıç dizisi için [Yükleme hattı](#load-pipeline) bölümüne bakın.

## Yetenek sahipliği modeli

OpenClaw, yerel bir eklentiyi ilişkisiz entegrasyonların bir karması olarak
değil, bir **şirketin** veya bir **özelliğin** sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket eklentisi, genellikle o şirketin OpenClaw'a dönük tüm
  yüzeylerinin sahibi olmalıdır
- bir özellik eklentisi, genellikle getirdiği tam özellik yüzeyinin sahibi
  olmalıdır
- kanallar, sağlayıcı davranışını plansız şekilde yeniden uygulamak yerine
  paylaşılan çekirdek yetenekleri tüketmelidir

Örnekler:

- paketlenmiş `openai` eklentisi, OpenAI model-sağlayıcı davranışının ve
  OpenAI konuşma + gerçek zamanlı ses + medya anlama + görsel oluşturma
  davranışının sahibidir
- paketlenmiş `elevenlabs` eklentisi, ElevenLabs konuşma davranışının sahibidir
- paketlenmiş `microsoft` eklentisi, Microsoft konuşma davranışının sahibidir
- paketlenmiş `google` eklentisi, Google model-sağlayıcı davranışının yanı sıra
  Google medya anlama + görsel oluşturma + web arama davranışının sahibidir
- paketlenmiş `firecrawl` eklentisi, Firecrawl web getirme davranışının sahibidir
- paketlenmiş `minimax`, `mistral`, `moonshot` ve `zai` eklentileri,
  medya anlama arka uçlarının sahibidir
- paketlenmiş `qwen` eklentisi, Qwen metin sağlayıcı davranışının yanı sıra
  medya anlama ve video oluşturma davranışının sahibidir
- `voice-call` eklentisi bir özellik eklentisidir: çağrı taşıması, araçlar,
  CLI, yollar ve Twilio medya akışı köprülemesinin sahibidir, ancak satıcı
  eklentilerini doğrudan içe aktarmak yerine paylaşılan konuşma ile gerçek
  zamanlı yazıya döküm ve gerçek zamanlı ses yeteneklerini tüketir

Amaçlanan son durum şudur:

- OpenAI, metin modellerini, konuşmayı, görselleri ve gelecekte videoyu
  kapsasa bile tek bir eklentide yer alır
- başka bir satıcı da kendi yüzey alanı için aynısını yapabilir
- kanallar, sağlayıcının sahibi olan satıcı eklentisinin hangisi olduğunu
  önemsemez; çekirdek tarafından sunulan paylaşılan yetenek sözleşmesini
  tüketirler

Temel ayrım şudur:

- **eklenti** = sahiplik sınırı
- **yetenek** = birden fazla eklentinin uygulayabildiği veya tüketebildiği
  çekirdek sözleşmesi

Dolayısıyla OpenClaw video gibi yeni bir alan eklediğinde ilk soru
"hangi sağlayıcı video işlemeyi sabit kodlamalı?" değildir. İlk soru
"çekirdeğin video yetenek sözleşmesi nedir?" olmalıdır. Bu sözleşme bir kez
var olduğunda, satıcı eklentileri buna karşı kayıt olabilir ve kanal/özellik
eklentileri bunu tüketebilir.

Yetenek henüz mevcut değilse, doğru adım genellikle şudur:

1. eksik yeteneği çekirdekte tanımlamak
2. bunu eklenti API'si/çalışma zamanı üzerinden türlenmiş şekilde sunmak
3. kanalları/özellikleri bu yeteneğe karşı bağlamak
4. satıcı eklentilerinin uygulamaları kaydetmesine izin vermek

Bu, tek bir satıcıya veya tek seferlik eklentiye özgü bir kod yoluna bağlı
çekirdek davranışlardan kaçınırken sahipliği açık tutar.

### Yetenek katmanları

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

- **çekirdek yetenek katmanı**: paylaşılan orkestrasyon, politika, geri
  dönüş, yapılandırma birleştirme kuralları, teslim semantiği ve türlenmiş
  sözleşmeler
- **satıcı eklenti katmanı**: satıcıya özgü API'ler, kimlik doğrulama, model
  katalogları, konuşma sentezi, görsel oluşturma, gelecekteki video arka
  uçları, kullanım uç noktaları
- **kanal/özellik eklenti katmanı**: Slack/Discord/voice-call/vb.
  entegrasyonu; çekirdek yetenekleri tüketir ve bunları bir yüzeyde sunar

Örneğin, TTS şu yapıyı izler:

- çekirdek, yanıt zamanındaki TTS politikasının, geri dönüş sırasının,
  tercihlerin ve kanal tesliminin sahibidir
- `openai`, `elevenlabs` ve `microsoft`, sentez uygulamalarının sahibidir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Aynı desen gelecekteki yetenekler için de tercih edilmelidir.

### Çoklu yetenekli şirket eklentisi örneği

Bir şirket eklentisi dışarıdan bakıldığında tutarlı hissettirmelidir. Eğer
OpenClaw; modeller, konuşma, gerçek zamanlı yazıya döküm, gerçek zamanlı ses,
medya anlama, görsel oluşturma, video oluşturma, web getirme ve web arama için
paylaşılan sözleşmelere sahipse, bir satıcı tüm yüzeylerinin sahibi tek bir
yerde olabilir:

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

Önemli olan yardımcı adlarının tam olarak ne olduğu değildir. Yapı önemlidir:

- tek bir eklenti satıcı yüzeyinin sahibidir
- çekirdek yine de yetenek sözleşmelerinin sahibidir
- kanallar ve özellik eklentileri, satıcı kodunu değil, `api.runtime.*`
  yardımcılarını tüketir
- sözleşme testleri, eklentinin sahibi olduğunu iddia ettiği yetenekleri
  kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw zaten görsel/ses/video anlamayı tek bir paylaşılan yetenek olarak ele
alır. Aynı sahiplik modeli burada da geçerlidir:

1. çekirdek medya-anlama sözleşmesini tanımlar
2. satıcı eklentileri uygun olduğunda `describeImage`, `transcribeAudio` ve
   `describeVideo` kaydeder
3. kanallar ve özellik eklentileri, doğrudan satıcı koduna bağlanmak yerine
   paylaşılan çekirdek davranışı tüketir

Bu, tek bir sağlayıcının video varsayımlarının çekirdeğe gömülmesini önler.
Eklenti satıcı yüzeyinin sahibidir; çekirdek ise yetenek sözleşmesinin ve geri
dönüş davranışının sahibidir.

Video oluşturma da zaten aynı diziyi kullanır: çekirdek türlenmiş yetenek
sözleşmesinin ve çalışma zamanı yardımcısının sahibidir, satıcı eklentileri de
buna karşı `api.registerVideoGenerationProvider(...)` uygulamalarını kaydeder.

Somut bir devreye alma kontrol listesine mi ihtiyacınız var? Bkz.
[Yetenek Yemek Kitabı](/tr/plugins/architecture).

## Sözleşmeler ve zorunlu kılma

Eklenti API yüzeyi, kasıtlı olarak `OpenClawPluginApi` içinde türlenmiş ve
merkezileştirilmiştir. Bu sözleşme, desteklenen kayıt noktalarını ve bir
eklentinin güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun önemi:

- eklenti yazarları tek bir kararlı dahili standart elde eder
- çekirdek, aynı sağlayıcı kimliğini iki eklentinin kaydetmesi gibi yinelenen
  sahipliği reddedebilir
- başlangıç süreci, hatalı biçimlendirilmiş kayıtlar için uygulanabilir
  tanılar sunabilir
- sözleşme testleri, paketlenmiş eklenti sahipliğini zorunlu kılabilir ve sessiz
  sapmayı önleyebilir

İki katmanlı bir zorunlu kılma vardır:

1. **çalışma zamanı kayıt zorunlu kılma**
   Eklenti kayıt sistemi, eklentiler yüklenirken kayıtları doğrular.
   Örnekler: yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcı
   kimlikleri ve hatalı kayıtlar tanımsız davranış yerine eklenti tanıları
   üretir.
2. **sözleşme testleri**
   Paketlenmiş eklentiler, test çalıştırmaları sırasında sözleşme kayıt
   sistemlerinde yakalanır; böylece OpenClaw sahipliği açıkça doğrulayabilir.
   Bu bugün model sağlayıcıları, konuşma sağlayıcıları, web arama
   sağlayıcıları ve paketlenmiş kayıt sahipliği için kullanılır.

Pratik etkisi şudur: OpenClaw, hangi eklentinin hangi yüzeye sahip olduğunu
baştan bilir. Bu, sahiplik örtük değil beyan edilmiş, türlenmiş ve test
edilebilir olduğundan çekirdeğin ve kanalların sorunsuz şekilde birleştirilmesini
sağlar.

### Bir sözleşmeye ne aittir

İyi eklenti sözleşmeleri:

- türlenmiştir
- küçüktür
- yeteneğe özgüdür
- çekirdeğe aittir
- birden fazla eklenti tarafından yeniden kullanılabilir
- satıcı bilgisi olmadan kanallar/özellikler tarafından tüketilebilir

Kötü eklenti sözleşmeleri:

- çekirdekte gizlenmiş satıcıya özgü politika
- kayıt sistemini atlayan tek seferlik eklenti kaçış delikleri
- bir satıcı uygulamasına doğrudan erişen kanal kodu
- `OpenClawPluginApi` veya `api.runtime` parçası olmayan plansız çalışma zamanı
  nesneleri

Kararsız kaldığınızda soyutlama seviyesini yükseltin: önce yeteneği tanımlayın,
sonra eklentilerin buna bağlanmasına izin verin.

## Yürütme modeli

Yerel OpenClaw eklentileri, Gateway ile **aynı süreç içinde** çalışır. Korumalı
alan içinde değildirler. Yüklenmiş yerel bir eklenti, çekirdek kodla aynı
süreç düzeyi güven sınırına sahiptir.

Sonuçları:

- yerel bir eklenti araçlar, ağ işleyicileri, kancalar ve hizmetler
  kaydedebilir
- yerel bir eklenti hatası gateway'i çökertebilir veya kararsızlaştırabilir
- kötü amaçlı bir yerel eklenti, OpenClaw süreci içinde rastgele kod
  yürütmeye eşdeğerdir

Uyumlu paketler varsayılan olarak daha güvenlidir çünkü OpenClaw şu anda onları
meta veri/içerik paketleri olarak ele alır. Geçerli sürümlerde bu çoğunlukla
paketlenmiş Skills anlamına gelir.

Paketlenmemiş eklentiler için izin listeleri ve açık kurulum/yükleme yolları
kullanın. Çalışma alanı eklentilerini üretim varsayılanları değil, geliştirme
zamanı kodu olarak değerlendirin.

Paketlenmiş çalışma alanı paket adları için, eklenti kimliğini npm adına bağlı
tutun: varsayılan olarak `@openclaw/<id>` veya paket bilinçli olarak daha dar bir
eklenti rolü sunuyorsa `-provider`, `-plugin`, `-speech`, `-sandbox` ya da
`-media-understanding` gibi onaylı türlenmiş son eklerden biri.

Önemli güven notu:

- `plugins.allow`, **eklenti kimliklerine** güvenir; kaynak kökenine değil.
- Paketlenmiş bir eklentiyle aynı kimliğe sahip bir çalışma alanı eklentisi,
  o çalışma alanı eklentisi etkinse/izin listesindeyse paketlenmiş kopyayı
  bilinçli olarak gölgeler.
- Bu normaldir ve yerel geliştirme, yama testi ve hızlı düzeltmeler için
  kullanışlıdır.

## Dışa aktarma sınırı

OpenClaw, uygulama kolaylıklarını değil, yetenekleri dışa aktarır.

Yetenek kaydını genel tutun. Sözleşme dışı yardımcı dışa aktarımları azaltın:

- paketlenmiş eklentiye özgü yardımcı alt yollar
- genel API olarak amaçlanmamış çalışma zamanı altyapısı alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/ilk katılım yardımcıları

Bazı paketlenmiş eklenti yardımcı alt yolları, uyumluluk ve paketlenmiş eklenti
bakımı için oluşturulmuş SDK dışa aktarma haritasında hâlâ kalmaktadır. Güncel
örnekler arasında `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` ve birkaç `plugin-sdk/matrix*`
bağlantı yüzeyi yer alır. Bunları, yeni üçüncü taraf eklentiler için önerilen
SDK deseni olarak değil, ayrılmış uygulama ayrıntısı dışa aktarımları olarak
değerlendirin.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday eklenti köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. eklenti yapılandırmasını normalize eder (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirme kararını verir
6. etkin yerel modülleri jiti aracılığıyla yükler
7. yerel `register(api)` (veya `activate(api)` — eski bir takma ad) kancalarını çağırır ve kayıtları eklenti kayıt sisteminde toplar
8. kayıt sistemini komutlara/çalışma zamanı yüzeylerine sunar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici mevcut olanı (`def.register ?? def.activate`) çözümler ve aynı noktada çağırır. Tüm paketlenmiş eklentiler `register` kullanır; yeni eklentiler için `register` tercih edin.
</Note>

Güvenlik kapıları **çalışma zamanı yürütmesinden önce** gerçekleşir. Girdi
eklenti kökünün dışına çıkarsa, yol dünya tarafından yazılabilirse veya
paketlenmemiş eklentiler için yol sahipliği şüpheli görünüyorsa adaylar
engellenir.

### Önce manifest davranışı

Manifest, kontrol düzleminin doğruluk kaynağıdır. OpenClaw bunu şunlar için
kullanır:

- eklentiyi tanımlamak
- beyan edilmiş kanalları/Skills/yapılandırma şemasını veya paket
  yeteneklerini keşfetmek
- `plugins.entries.<id>.config` doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- eklenti çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum
  tanımlayıcılarını korumak

Yerel eklentiler için, çalışma zamanı modülü veri düzlemi parçasıdır. Kancalar,
araçlar, komutlar veya sağlayıcı akışları gibi gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde
kalır. Bunlar, etkinleştirme planlaması ve kurulum keşfi için yalnızca meta
veri tanımlayıcılarıdır; çalışma zamanı kaydının, `register(...)` veya
`setupEntry`'nin yerini almazlar. İlk etkinleştirme tüketicisi artık, birincil
bir komut bilindiğinde her zaman tüm CLI özellikli eklentileri önden yüklemek
yerine CLI eklenti yüklemeyi daraltmak için manifest komut ipuçlarını kullanır.

Kurulum keşfi artık, kurulum zamanında çalışma zamanı kancalarına hâlâ ihtiyaç
duyan eklentiler için `setup-api`'ye geri dönmeden önce aday eklentileri
daraltmak amacıyla `setup.providers` ve `setup.cliBackends` gibi tanımlayıcı
sahipli kimlikleri tercih eder. Keşfedilen birden fazla eklenti aynı normalize
edilmiş kurulum sağlayıcısı veya CLI arka uç kimliğini talep ederse, kurulum
araması keşif sırasına güvenmek yerine belirsiz sahibi reddeder.

### Yükleyicinin önbelleğe aldığı şeyler

OpenClaw süreç içinde kısa ömürlü önbellekler tutar:

- keşif sonuçları
- manifest kayıt sistemi verileri
- yüklenmiş eklenti kayıt sistemleri

Bu önbellekler, ani başlangıç yükünü ve yinelenen komut ek yükünü azaltır.
Bunları kalıcılık olarak değil, kısa ömürlü performans önbellekleri olarak
düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için
  `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek pencerelerini `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt sistemi modeli

Yüklenen eklentiler rastgele çekirdek genel durumlarını doğrudan değiştirmez.
Merkezi bir eklenti kayıt sistemine kaydolurlar.

Kayıt sistemi şunları izler:

- eklenti kayıtları (kimlik, kaynak, köken, durum, tanılar)
- araçlar
- eski kancalar ve türlenmiş kancalar
- kanallar
- sağlayıcılar
- gateway RPC işleyicileri
- HTTP yolları
- CLI kaydedicileri
- arka plan hizmetleri
- eklenti sahipli komutlar

Çekirdek özellikler daha sonra eklenti modülleriyle doğrudan konuşmak yerine bu
kayıt sisteminden okur. Bu, yüklemeyi tek yönlü tutar:

- eklenti modülü -> kayıt sistemi kaydı
- çekirdek çalışma zamanı -> kayıt sistemi tüketimi

Bu ayrım bakım yapılabilirlik için önemlidir. Çekirdek yüzeylerin çoğunun
yalnızca tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir:
"her eklenti modülü için özel durum yaz" değil, "kayıt sistemini oku".

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan eklentiler, bir onay çözümlendiğinde tepki verebilir.

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

Geri çağrı yükü alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanan istekler için çözümlenmiş bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderici kimliği ve
  konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlamasına izin
verildiğini değiştirmez ve çekirdeğin onay işleme süreci tamamlandıktan sonra
çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı eklentilerinin artık iki katmanı vardır:

- manifest meta verileri: çalışma zamanı yüklenmeden önce ucuz sağlayıcı
  ortam-kimlik doğrulama araması için `providerAuthEnvVars`, kimlik
  doğrulamayı paylaşan sağlayıcı varyantları için `providerAuthAliases`,
  çalışma zamanı yüklenmeden önce ucuz kanal ortam/kurulum araması için
  `channelEnvVars`, ayrıca çalışma zamanı yüklenmeden önce ucuz ilk katılım /
  kimlik doğrulama seçimi etiketleri ve CLI bayrak meta verileri için
  `providerAuthChoices`
- yapılandırma zamanı kancaları: `catalog` / eski `discovery` ve
  `applyConfigDefaults`
- çalışma zamanı kancaları: `normalizeModelId`, `normalizeTransport`,
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw hâlâ genel ajan döngüsünün, yük devretmenin, transkript işlemenin ve
araç politikasının sahibidir. Bu kancalar, tümüyle özel bir çıkarım taşımasına
gerek olmadan sağlayıcıya özgü davranışlar için uzantı yüzeyidir.

Sağlayıcının, genel kimlik doğrulama/durum/model seçici yollarının eklenti
çalışma zamanını yüklemeden görmesi gereken ortam tabanlı kimlik bilgileri
varsa manifest `providerAuthEnvVars` kullanın. Bir sağlayıcı kimliği başka bir
sağlayıcı kimliğinin ortam değişkenlerini, kimlik doğrulama profillerini,
yapılandırma tabanlı kimlik doğrulamayı ve API anahtarı ilk katılım seçimini
yeniden kullanacaksa manifest `providerAuthAliases` kullanın. İlk katılım /
kimlik doğrulama seçimi CLI yüzeylerinin, sağlayıcının seçim kimliğini, grup
etiketlerini ve basit tek bayraklı kimlik doğrulama bağlantısını sağlayıcı
çalışma zamanını yüklemeden bilmesi gerekiyorsa manifest `providerAuthChoices`
kullanın. Sağlayıcı çalışma zamanı `envVars` alanını, ilk katılım etiketleri
veya OAuth istemci kimliği/istemci gizli anahtarı kurulum değişkenleri gibi
operatöre dönük ipuçları için saklayın.

Bir kanalın, genel kabuk ortamı geri dönüşünün, yapılandırma/durum
denetimlerinin veya kurulum istemlerinin çalışma zamanı yüklenmeden görmesi
gereken ortam güdümlü kimlik doğrulaması ya da kurulumu varsa manifest
`channelEnvVars` kullanın.

### Kanca sırası ve kullanım

Model/sağlayıcı eklentileri için OpenClaw kancaları kabaca şu sırayla çağırır.
"Ne zaman kullanılır" sütunu hızlı karar kılavuzudur.

| #   | Kanca                             | Ne yapar                                                                                                       | Ne zaman kullanılır                                                                                                                         |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` oluşturma sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                | Sağlayıcı bir kataloğun veya temel URL varsayılanlarının sahibiyse                                                                          |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel yapılandırma varsayılanlarını uygular            | Varsayılanlar kimlik doğrulama moduna, ortama veya sağlayıcının model ailesi semantiğine bağlıysa                                          |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt sistemi/katalog yolunu dener                                                       | _(bir eklenti kancası değil)_                                                                                                               |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalize eder                                  | Sağlayıcı, kurallı model çözümlemesinden önce takma ad temizliğinin sahibiyse                                                               |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesine ait `api` / `baseUrl` değerlerini normalize eder           | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğinin sahibiyse                                            |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalize eder                | Sağlayıcı, eklentiyle birlikte yaşaması gereken yapılandırma temizliğine ihtiyaç duyuyorsa; paketlenmiş Google ailesi yardımcıları da desteklenen Google yapılandırma girdilerini burada destekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanım uyumluluğu yeniden yazımlarını uygular                       | Sağlayıcı, uç nokta güdümlü yerel akış kullanım meta verisi düzeltmelerine ihtiyaç duyuyorsa                                               |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı kimlik doğrulaması yüklenmeden önce yapılandırma sağlayıcıları için ortam işaretleyici kimlik doğrulamasını çözer | Sağlayıcının, sağlayıcı sahipli ortam işaretleyici API anahtarı çözümlemesi varsa; `amazon-bedrock` burada yerleşik bir AWS ortam işaretleyici çözücüsüne de sahiptir |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcılaştırmadan yerel/kendi barındırılan veya yapılandırma destekli kimlik doğrulamayı yüzeye çıkarır | Sağlayıcı, sentetik/yerel bir kimlik bilgisi işaretleyicisiyle çalışabiliyorsa                                                             |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcı sahipli harici kimlik doğrulama profillerini kaplar; varsayılan `persistence`, CLI/uygulama sahipli kimlik bilgileri için `runtime-only` olur | Sağlayıcı, kopyalanmış yenileme belirteçlerini kalıcılaştırmadan harici kimlik doğrulama bilgilerini yeniden kullanıyorsa                 |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını ortam/yapılandırma destekli kimlik doğrulamanın altına indirir     | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profiller saklıyorsa                                                             |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıt sisteminde olmayan sağlayıcı sahipli model kimlikleri için eşzamanlı geri dönüş sağlar      | Sağlayıcı, keyfi yukarı akış model kimliklerini kabul ediyorsa                                                                              |
| 12  | `prepareDynamicModel`             | Eşzamansız hazırlık yapar, ardından `resolveDynamicModel` yeniden çalışır                                      | Sağlayıcı, bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyaç duyuyorsa                                                       |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözülmüş modeli kullanmadan önce son yeniden yazımı yapar                                  | Sağlayıcı, taşıma yeniden yazımlarına ihtiyaç duyuyor ama yine de çekirdek taşımasını kullanıyorsa                                         |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları katkısı yapar              | Sağlayıcı, sağlayıcıyı devralmadan kendi modellerini ara sunucu taşımalarında tanıyorsa                                                    |
| 15  | `capabilities`                    | Paylaşılan çekirdek mantığı tarafından kullanılan sağlayıcı sahipli transkript/araç meta verisi               | Sağlayıcının transkript/sağlayıcı ailesi farklılıklarına ihtiyacı varsa                                                                     |
| 16  | `normalizeToolSchemas`            | Gömülü çalıştırıcı bunları görmeden önce araç şemalarını normalize eder                                       | Sağlayıcı, taşıma ailesi şema temizliğine ihtiyaç duyuyorsa                                                                                 |
| 17  | `inspectToolSchemas`              | Normalize etmeden sonra sağlayıcı sahipli şema tanılarını yüzeye çıkarır                                      | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları istiyorsa                                               |
| 18  | `resolveReasoningOutputMode`      | Yerel ve etiketli akıl yürütme-çıktısı sözleşmesi arasında seçim yapar                                        | Sağlayıcı, yerel alanlar yerine etiketli akıl yürütme/nihai çıktı istiyorsa                                                                |
| 19  | `prepareExtraParams`              | Genel akış seçenek sarmalayıcılarından önce istek parametresi normalizasyonu yapar                            | Sağlayıcı, varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyaç duyuyorsa                                  |
| 20  | `createStreamFn`                  | Normal akış yolunu özel bir taşımayla tamamen değiştirir                                                       | Sağlayıcının yalnızca bir sarmalayıcıya değil, özel bir tel protokolüne ihtiyacı varsa                                                     |
| 21  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akışı sarar                                                          | Sağlayıcı, özel taşıma olmadan istek üstbilgileri/gövdesi/model uyumluluk sarmalayıcılarına ihtiyaç duyuyorsa                             |
| 22  | `resolveTransportTurnState`       | Yerel tur başına taşıma üstbilgilerini veya meta veriyi ekler                                                  | Sağlayıcı, genel taşımaların sağlayıcıya özgü tur kimliğini göndermesini istiyorsa                                                         |
| 23  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket üstbilgilerini veya oturum soğuma politikasını ekler                                           | Sağlayıcı, genel WS taşımalarının oturum üstbilgilerini veya geri dönüş politikasını ayarlamasını istiyorsa                               |
| 24  | `formatApiKey`                    | Kimlik doğrulama profili biçimlendiricisi: saklanan profil, çalışma zamanı `apiKey` dizesi olur              | Sağlayıcı ek kimlik doğrulama meta verisi saklıyor ve özel bir çalışma zamanı belirteç biçimine ihtiyaç duyuyorsa                         |
| 25  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme başarısızlığı politikası için OAuth yenileme geçersiz kılması       | Sağlayıcı, paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                   |
| 26  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenen onarım ipucunu oluşturur                                         | Sağlayıcının yenileme başarısızlığından sonra sağlayıcı sahipli kimlik doğrulama onarım rehberliğine ihtiyacı varsa                       |
| 27  | `matchesContextOverflowError`     | Sağlayıcı sahipli bağlam penceresi taşması eşleyicisi                                                          | Sağlayıcının, genel sezgisel yöntemlerin kaçıracağı ham taşma hataları varsa                                                               |
| 28  | `classifyFailoverReason`          | Sağlayıcı sahipli yük devretme nedeni sınıflandırması                                                          | Sağlayıcı, ham API/taşıma hatalarını hız sınırı/aşırı yük/vb. olarak eşleyebiliyorsa                                                       |
| 29  | `isCacheTtlEligible`              | Ara sunucu/geri taşıma sağlayıcıları için istem önbelleği politikası                                           | Sağlayıcı, ara sunucuya özgü önbellek TTL kapılamasına ihtiyaç duyuyorsa                                                                   |
| 30  | `buildMissingAuthMessage`         | Genel eksik kimlik doğrulama kurtarma iletisinin yerine geçer                                                  | Sağlayıcının sağlayıcıya özgü bir eksik kimlik doğrulama kurtarma ipucuna ihtiyacı varsa                                                   |
| 31  | `suppressBuiltInModel`            | Eski yukarı akış model bastırması ve isteğe bağlı kullanıcıya dönük hata ipucu                                | Sağlayıcının eski yukarı akış satırlarını gizlemesi veya bunları satıcı ipucuyla değiştirmesi gerekiyorsa                                 |
| 32  | `augmentModelCatalog`             | Keşiften sonra eklenen sentetik/nihai katalog satırları                                                       | Sağlayıcının `models list` ve seçicilerde sentetik ileri uyumluluk satırlarına ihtiyacı varsa                                             |
| 33  | `isBinaryThinking`                | İkili düşünme sağlayıcıları için açık/kapalı akıl yürütme geçişi                                               | Sağlayıcı yalnızca ikili düşünme aç/kapat sunuyorsa                                                                                        |
| 34  | `supportsXHighThinking`           | Seçili modeller için `xhigh` akıl yürütme desteği                                                              | Sağlayıcı `xhigh` özelliğini yalnızca modellerin bir alt kümesinde istiyorsa                                                               |
| 35  | `resolveDefaultThinkingLevel`     | Belirli bir model ailesi için varsayılan `/think` düzeyi                                                      | Sağlayıcı, bir model ailesi için varsayılan `/think` politikasının sahibiyse                                                               |
| 36  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleyicisi                                          | Sağlayıcı, canlı/smoke tercih edilen model eşlemesinin sahibiyse                                                                            |
| 37  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı belirtecine/anahtarına dönüştürür | Sağlayıcının belirteç değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı varsa                                                    |
| 38  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözer                          | Sağlayıcının özel kullanım/kota belirteci ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı varsa                         |
| 39  | `fetchUsageSnapshot`              | Kimlik doğrulama çözüldükten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getirir ve normalize eder | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı varsa                                           |
| 40  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcı sahipli bir embedding bağdaştırıcısı oluşturur                                    | Bellek embedding davranışı sağlayıcı eklentisine aitse                                                                                      |
| 41  | `buildReplayPolicy`               | Sağlayıcı için transkript işlemeyi kontrol eden bir replay politikası döndürür                                | Sağlayıcının özel transkript politikasına ihtiyacı varsa (örneğin düşünme bloğu çıkarma)                                                  |
| 42  | `sanitizeReplayHistory`           | Genel transkript temizliğinden sonra replay geçmişini yeniden yazar                                           | Sağlayıcının, paylaşılan sıkıştırma yardımcılarının ötesinde sağlayıcıya özgü replay yeniden yazımlarına ihtiyacı varsa                  |
| 43  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son replay turu doğrulamasını veya yeniden şekillendirmesini yapar                | Sağlayıcı taşımasının, genel temizlemeden sonra daha sıkı tur doğrulamasına ihtiyacı varsa                                                |
| 44  | `onModelSelected`                 | Sağlayıcı sahipli seçim sonrası yan etkileri çalıştırır                                                       | Bir model etkin olduğunda sağlayıcının telemetriye veya sağlayıcı sahipli duruma ihtiyacı varsa                                           |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı eklentisini denetler, ardından model kimliğini veya taşıma/yapılandırmayı
gerçekten değiştiren biri bulunana kadar kanca destekli diğer sağlayıcı
eklentilerine düşer. Bu, çağıranın hangi paketlenmiş eklentinin yeniden yazımın
sahibi olduğunu bilmesini gerektirmeden takma ad/uyumluluk sağlayıcı sarmalayıcılarını
çalışır tutar. Hiçbir sağlayıcı kancası desteklenen bir Google ailesi
yapılandırma girdisini yeniden yazmazsa, paketlenmiş Google yapılandırma
normalize edicisi yine de bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir tel protokolüne veya özel istek yürütücüsüne
ihtiyacı varsa, bu farklı bir uzantı sınıfıdır. Bu kancalar, OpenClaw'ın normal
çıkarım döngüsünde çalışmaya devam eden sağlayıcı davranışları içindir.

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

- Anthropic; Claude 4.6 ileri uyumluluğunun, sağlayıcı ailesi ipuçlarının,
  kimlik doğrulama onarım rehberliğinin, kullanım uç noktası entegrasyonunun,
  istem önbelleği uygunluğunun, kimlik doğrulama farkındalıklı yapılandırma
  varsayılanlarının, Claude varsayılan/uyarlamalı düşünme politikasının ve beta
  üstbilgileri, `/fast` / `serviceTier` ve `context1m` için Anthropic'e özgü
  akış şekillendirmenin sahibi olduğu için `resolveDynamicModel`,
  `capabilities`, `buildAuthDoctorHint`, `resolveUsageAuth`,
  `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  ve `wrapStreamFn` kullanır.
- Anthropic'in Claude'a özgü akış yardımcıları şimdilik paketlenmiş
  eklentinin kendi genel `api.ts` / `contract-api.ts` bağlantı yüzeyinde
  kalır. Bu paket yüzeyi, genel SDK'yı tek bir sağlayıcının beta-üstbilgi
  kuralları etrafında genişletmek yerine `wrapAnthropicProviderStream`,
  `resolveAnthropicBetas`, `resolveAnthropicFastMode`,
  `resolveAnthropicServiceTier` ve daha alt düzey Anthropic sarmalayıcı
  oluşturucularını dışa aktarır.
- OpenAI; GPT-5.4 ileri uyumluluğunun, doğrudan OpenAI
  `openai-completions` -> `openai-responses` normalizasyonunun, Codex farkındalıklı
  kimlik doğrulama ipuçlarının, Spark bastırmasının, sentetik OpenAI liste
  satırlarının ve GPT-5 düşünme / canlı model politikasının sahibi olduğu için
  `resolveDynamicModel`, `normalizeResolvedModel` ve `capabilities` ile birlikte
  `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` ve `isModernModelRef`
  kullanır; `openai-responses-defaults` akış ailesi ise ilişkilendirme
  üstbilgileri, `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web
  araması, akıl yürütme uyumluluk yük şekillendirmesi ve Responses bağlam
  yönetimi için paylaşılan yerel OpenAI Responses sarmalayıcılarının sahibidir.
- OpenRouter; sağlayıcı geçişli olduğu ve OpenClaw'ın statik kataloğu
  güncellenmeden önce yeni model kimlikleri sunabildiği için `catalog` ile
  birlikte `resolveDynamicModel` ve `prepareDynamicModel` kullanır; ayrıca
  sağlayıcıya özgü istek üstbilgilerini, yönlendirme meta verilerini, akıl
  yürütme yamalarını ve istem önbelleği politikasını çekirdek dışında tutmak
  için `capabilities`, `wrapStreamFn` ve `isCacheTtlEligible` de kullanır.
  Replay politikası `passthrough-gemini` ailesinden gelirken,
  `openrouter-thinking` akış ailesi ara sunucu akıl yürütme eklemesinin ve
  desteklenmeyen model / `auto` atlamalarının sahibidir.
- GitHub Copilot; sağlayıcı sahipli cihaz oturum açmasına, model geri dönüş
  davranışına, Claude transkript farklılıklarına, GitHub belirteci -> Copilot
  belirteci değişimine ve sağlayıcı sahipli kullanım uç noktasına ihtiyaç
  duyduğu için `catalog`, `auth`, `resolveDynamicModel` ve `capabilities` ile
  birlikte `prepareRuntimeAuth` ve `fetchUsageSnapshot` kullanır.
- OpenAI Codex; hâlâ çekirdek OpenAI taşımaları üzerinde çalışmasına rağmen
  taşıma/temel URL normalizasyonunun, OAuth yenileme geri dönüş politikasının,
  varsayılan taşıma seçiminin, sentetik Codex katalog satırlarının ve ChatGPT
  kullanım uç noktası entegrasyonunun sahibi olduğu için `catalog`,
  `resolveDynamicModel`, `normalizeResolvedModel`, `refreshOAuth` ve
  `augmentModelCatalog` ile birlikte `prepareExtraParams`,
  `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır; doğrudan OpenAI ile aynı
  `openai-responses-defaults` akış ailesini paylaşır.
- Google AI Studio ve Gemini CLI OAuth; `google-gemini` replay ailesi Gemini 3.1
  ileri uyumluluk geri dönüşünün, yerel Gemini replay doğrulamasının, önyükleme
  replay temizliğinin, etiketli akıl yürütme-çıktısı modunun ve modern-model
  eşlemenin sahibi olduğu için `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` ve `isModernModelRef`
  kullanır; `google-thinking` akış ailesi ise Gemini düşünme yükü
  normalizasyonunun sahibidir; Gemini CLI OAuth ayrıca belirteç biçimlendirme,
  belirteç ayrıştırma ve kota uç noktası bağlantısı için `formatApiKey`,
  `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır.
- Anthropic Vertex, Claude'a özgü replay temizliği her
  `anthropic-messages` taşımasına değil yalnızca Claude kimliklerine özel
  kalsın diye `anthropic-by-model` replay ailesi üzerinden `buildReplayPolicy`
  kullanır.
- Amazon Bedrock; Anthropic-on-Bedrock trafiği için Bedrock'a özgü
  throttling/hazır değil/bağlam taşması hata sınıflandırmasının sahibi olduğu
  için `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` ve `resolveDefaultThinkingLevel` kullanır; replay
  politikası yine de aynı yalnızca-Claude `anthropic-by-model` korumasını
  paylaşır.
- OpenRouter, Kilocode, Opencode ve Opencode Go; Gemini modellerini
  OpenAI uyumlu taşımalar üzerinden ara sunucuya koydukları ve yerel Gemini
  replay doğrulaması veya önyükleme yeniden yazımları olmadan Gemini
  thought-signature temizliğine ihtiyaç duydukları için `passthrough-gemini`
  replay ailesi üzerinden `buildReplayPolicy` kullanır.
- MiniMax; bir sağlayıcı hem Anthropic-message hem de OpenAI uyumlu
  semantiklerin sahibi olduğu için `hybrid-anthropic-openai` replay ailesi
  üzerinden `buildReplayPolicy` kullanır; Anthropic tarafında yalnızca-Claude
  thinking-block bırakmayı sürdürürken akıl yürütme çıktı modunu yeniden yerel
  moda geçersiz kılar ve `minimax-fast-mode` akış ailesi, paylaşılan akış
  yolunda fast-mode model yeniden yazımlarının sahibidir.
- Moonshot; hâlâ paylaşılan OpenAI taşımasını kullanmasına rağmen sağlayıcı
  sahipli düşünme yükü normalizasyonuna ihtiyaç duyduğu için `catalog` ile
  birlikte `wrapStreamFn` kullanır; `moonshot-thinking` akış ailesi yapılandırma
  ile `/think` durumunu kendi yerel ikili düşünme yüküne eşler.
- Kilocode; sağlayıcı sahipli istek üstbilgilerine, akıl yürütme yükü
  normalizasyonuna, Gemini transkript ipuçlarına ve Anthropic önbellek-TTL
  kapılamasına ihtiyaç duyduğu için `catalog`, `capabilities`, `wrapStreamFn`
  ve `isCacheTtlEligible` kullanır; `kilocode-thinking` akış ailesi ise açık
  akıl yürütme yüklerini desteklemeyen `kilo/auto` ve diğer ara sunucu model
  kimliklerini atlarken paylaşılan ara sunucu akış yolunda Kilo düşünme
  eklemesini tutar.
- Z.AI; GLM-5 geri dönüşünün, `tool_stream` varsayılanlarının, ikili düşünme UX'inin,
  modern model eşlemesinin ve hem kullanım kimlik doğrulaması hem kota getirme
  davranışının sahibi olduğu için `resolveDynamicModel`, `prepareExtraParams`,
  `wrapStreamFn`, `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır; `tool-stream-default-on`
  akış ailesi varsayılan açık `tool_stream` sarmalayıcısını sağlayıcı başına
  el yazımı yapıştırıcı koddan uzak tutar.
- xAI; yerel xAI Responses taşıma normalizasyonunun, Grok fast-mode takma ad
  yeniden yazımlarının, varsayılan `tool_stream` davranışının, strict-tool /
  reasoning-payload temizliğinin, eklenti sahipli araçlar için geri dönüş kimlik
  doğrulama yeniden kullanımının, ileri uyumlu Grok model çözümlemesinin ve
  xAI araç-şema profili, desteklenmeyen şema anahtar sözcükleri, yerel
  `web_search` ve HTML varlığı araç çağrısı bağımsız değişkeni çözme gibi
  sağlayıcı sahipli uyumluluk yamalarının sahibi olduğu için
  `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` ve `isModernModelRef`
  kullanır.
- Mistral, OpenCode Zen ve OpenCode Go, transkript/araç farklılıklarını
  çekirdek dışında tutmak için yalnızca `capabilities` kullanır.
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
  `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve
  `volcengine` gibi yalnızca katalog kullanan paketlenmiş sağlayıcılar
  yalnızca `catalog` kullanır.
- Qwen, metin sağlayıcısı için `catalog` ile birlikte çok kipli yüzeyleri için
  paylaşılan medya-anlama ve video-oluşturma kayıtları kullanır.
- MiniMax ve Xiaomi, çıkarım hâlâ paylaşılan taşımalar üzerinden çalışsa da
  `/usage` davranışları eklenti sahipli olduğu için `catalog` ile birlikte
  kullanım kancaları kullanır.

## Çalışma zamanı yardımcıları

Eklentiler, seçili çekirdek yardımcılarına `api.runtime` aracılığıyla
erişebilir. TTS için:

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

- `textToSpeech`, dosya/sesli not yüzeyleri için normal çekirdek TTS çıktı
  yükünü döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses arabelleği + örnekleme hızı döndürür. Eklentiler sağlayıcılar için
  yeniden örnekleme/kodlama yapmalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Bunu satıcı sahipli ses
  seçicileri veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkındalıklı seçiciler için yerel ayar,
  cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefon desteği sunar. Microsoft sunmaz.

Eklentiler ayrıca `api.registerSpeechProvider(...)` aracılığıyla konuşma
sağlayıcıları da kaydedebilir.

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

- TTS politikasını, geri dönüşü ve yanıt teslimini çekirdekte tutun.
- Satıcı sahipli sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalize edilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: tek bir satıcı eklentisi,
  OpenClaw bu yetenek sözleşmelerini ekledikçe metin, konuşma, görsel ve
  gelecekteki medya sağlayıcılarının sahibi olabilir.

Görsel/ses/video anlama için eklentiler genel bir anahtar/değer torbası yerine
tek bir türlenmiş medya-anlama sağlayıcısı kaydeder:

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

- Orkestrasyonu, geri dönüşü, yapılandırmayı ve kanal bağlantılarını
  çekirdekte tutun.
- Satıcı davranışını sağlayıcı eklentisinde tutun.
- Toplamsal genişleme türlenmiş kalmalıdır: yeni isteğe bağlı yöntemler, yeni
  isteğe bağlı sonuç alanları, yeni isteğe bağlı yetenekler.
- Video oluşturma zaten aynı deseni izler:
  - çekirdek yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir
  - satıcı eklentileri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal eklentileri `api.runtime.videoGeneration.*` tüketir

Medya-anlama çalışma zamanı yardımcıları için eklentiler şunları çağırabilir:

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

Ses yazıya dökümü için eklentiler ya medya-anlama çalışma zamanını ya da eski
STT takma adını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`, görsel/ses/video anlama için tercih edilen
  paylaşılan yüzeydir.
- Çekirdek medya-anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı
  geri dönüş sırasını kullanır.
- Yazıya döküm çıktısı üretilmediğinde `{ text: undefined }` döndürür
  (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)` bir uyumluluk takma adı olarak
  kalır.

Eklentiler ayrıca `api.runtime.subagent` aracılığıyla arka plan alt ajan
çalıştırmaları başlatabilir:

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

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalışma başına
  geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için
  dikkate alır.
- Eklenti sahipli geri dönüş çalıştırmaları için operatörlerin
  `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça izin
  vermesi gerekir.
- Güvenilir eklentileri belirli kurallı `provider/model` hedefleriyle
  sınırlamak için `plugins.entries.<id>.subagent.allowedModels` veya herhangi
  bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen eklenti alt ajan çalıştırmaları yine de çalışır, ancak geçersiz
  kılma istekleri sessizce geri düşmek yerine reddedilir.

Web arama için eklentiler, ajan araç bağlantısına erişmek yerine paylaşılan
çalışma zamanı yardımcısını tüketebilir:

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

Eklentiler ayrıca `api.registerWebSearchProvider(...)` aracılığıyla web arama
sağlayıcıları da kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek
  semantiğini çekirdekte tutun.
- Satıcıya özgü arama taşımaları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, ajan araç sarmalayıcısına bağımlı olmadan arama
  davranışına ihtiyaç duyan özellik/kanal eklentileri için tercih edilen
  paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış görsel oluşturma sağlayıcı zincirini
  kullanarak bir görsel oluşturur.
- `listProviders(...)`: kullanılabilir görsel oluşturma sağlayıcılarını ve
  yeteneklerini listeler.

## Gateway HTTP yolları

Eklentiler `api.registerHttpRoute(...)` ile HTTP uç noktaları sunabilir.

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

Yol alanları:

- `path`: gateway HTTP sunucusu altındaki yol yolu.
- `auth`: zorunlu. Normal gateway kimlik doğrulaması gerektirmek için `"gateway"`
  veya eklenti tarafından yönetilen kimlik doğrulama/webhook doğrulaması için
  `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı eklentinin kendi mevcut yol kaydını
  değiştirmesine izin verir.
- `handler`: yol isteği işlediğinde `true` döndürün.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve eklenti yükleme hatasına neden
  olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Eklenti yolları `auth` alanını açıkça beyan etmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadıkça reddedilir
  ve bir eklenti başka bir eklentinin yolunu değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan yollar reddedilir. `exact`/`prefix`
  art arda düşme zincirlerini yalnızca aynı kimlik doğrulama düzeyinde tutun.
- `auth: "plugin"` yolları operatör çalışma zamanı kapsamlarını otomatik olarak
  almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, eklenti
  tarafından yönetilen webhook/imza doğrulaması içindir.
- `auth: "gateway"` yolları bir Gateway istek çalışma zamanı kapsamı içinde
  çalışır, ancak bu kapsam bilinçli olarak tutucudur:
  - paylaşılan gizli bearer kimlik doğrulaması (`gateway.auth.mode = "token"` /
    `"password"`) eklenti-yolu çalışma zamanı kapsamlarını, çağıran
    `x-openclaw-scopes` gönderse bile `operator.write` düzeyine sabitler
  - güvenilir kimlik taşıyan HTTP modları (örneğin `trusted-proxy` veya özel
    bir girişte `gateway.auth.mode = "none"`) `x-openclaw-scopes` başlığını
    yalnızca başlık açıkça mevcut olduğunda dikkate alır
  - kimlik taşıyan bu eklenti-yolu isteklerinde `x-openclaw-scopes` yoksa,
    çalışma zamanı kapsamı `operator.write` düzeyine geri düşer
- Pratik kural: gateway-kimlik doğrulamalı bir eklenti yolunun örtük bir yönetici
  yüzeyi olduğunu varsaymayın. Yolunuz yöneticiye özel davranış gerektiriyorsa,
  kimlik taşıyan bir kimlik doğrulama modu zorunlu kılın ve açık
  `x-openclaw-scopes` başlık sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Eklenti yazarken tek parça `openclaw/plugin-sdk` içe aktarımı yerine SDK alt
yollarını kullanın:

- Eklenti kayıt ilkel öğeleri için `openclaw/plugin-sdk/plugin-entry`.
- Genel paylaşılan eklentiye dönük sözleşme için `openclaw/plugin-sdk/core`.
- Kök `openclaw.json` Zod şema dışa aktarımı (`OpenClawSchema`) için
  `openclaw/plugin-sdk/config-schema`.
- Paylaşılan kurulum/kimlik doğrulama/yanıt/webhook bağlantıları için
  `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress` gibi kararlı kanal ilkel öğeleri.
  `channel-inbound`; debounce, mention eşleme, gelen mention-policy
  yardımcıları, zarf biçimlendirme ve gelen zarf bağlam yardımcıları için
  paylaşılan ana bölümdür.
  `channel-setup`, dar isteğe bağlı kurulum bağlantı yüzeyidir.
  `setup-runtime`, içe aktarma açısından güvenli kurulum yama bağdaştırıcıları
  dahil olmak üzere `setupEntry` / ertelenmiş başlangıç tarafından kullanılan
  çalışma zamanı açısından güvenli kurulum yüzeyidir.
  `setup-adapter-runtime`, ortam farkındalıklı hesap kurulum bağdaştırıcısı
  bağlantı yüzeyidir.
  `setup-tools`, küçük CLI/arşiv/belge yardımcısı bağlantı yüzeyidir
  (`formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Paylaşılan çalışma zamanı/yapılandırma yardımcıları için
  `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` gibi alan alt yolları.
  `telegram-command-config`, Telegram özel komut normalizasyonu/doğrulaması için
  dar genel bağlantı yüzeyidir ve paketlenmiş Telegram sözleşme yüzeyi geçici
  olarak kullanılamasa bile erişilebilir kalır.
  `text-runtime`, yardımcıya görünür metin temizleme, markdown işleme/parçalama
  yardımcıları, sansürleme yardımcıları, directive-tag yardımcıları ve güvenli
  metin yardımcıları dahil olmak üzere paylaşılan metin/markdown/loglama
  bağlantı yüzeyidir.
- Onaya özgü kanal bağlantı yüzeyleri, eklenti üzerinde tek bir
  `approvalCapability` sözleşmesini tercih etmelidir. Böylece çekirdek; onay
  kimlik doğrulamasını, teslimi, işlemeyi, yerel yönlendirmeyi ve tembel yerel
  işleyici davranışını ilgisiz eklenti alanlarına karıştırmak yerine bu tek
  yetenek üzerinden okur.
- `openclaw/plugin-sdk/channel-runtime` kullanımdan kaldırılmıştır ve yalnızca
  eski eklentiler için bir uyumluluk sarmalayıcısı olarak kalır. Yeni kod bunun
  yerine daha dar genel ilkel öğeleri içe aktarmalıdır ve depo kodu sarmalayıcıya
  yeni içe aktarımlar eklememelidir.
- Paketlenmiş uzantı iç yapıları gizli kalır. Harici eklentiler yalnızca
  `openclaw/plugin-sdk/*` alt yollarını kullanmalıdır. OpenClaw çekirdek/test
  kodu, bir eklenti paket kökü altındaki `index.js`, `api.js`, `runtime-api.js`,
  `setup-entry.js` ve `login-qr-api.js` gibi dar kapsamlı dosyalar gibi depo
  genel giriş noktalarını kullanabilir. Çekirdekten veya başka bir uzantıdan
  bir eklenti paketinin `src/*` yolunu asla içe aktarmayın.
- Depo giriş noktası ayrımı:
  `<plugin-package-root>/api.js` yardımcı/tür barrel'ıdır,
  `<plugin-package-root>/runtime-api.js` yalnızca çalışma zamanı barrel'ıdır,
  `<plugin-package-root>/index.js` paketlenmiş eklenti girişidir
  ve `<plugin-package-root>/setup-entry.js` kurulum eklentisi girişidir.
- Geçerli paketlenmiş sağlayıcı örnekleri:
  - Anthropic, `wrapAnthropicProviderStream`, beta-header yardımcıları ve
    `service_tier` ayrıştırması gibi Claude akış yardımcıları için
    `api.js` / `contract-api.js` kullanır.
  - OpenAI, sağlayıcı oluşturucuları, varsayılan model yardımcıları ve gerçek
    zamanlı sağlayıcı oluşturucuları için `api.js` kullanır.
  - OpenRouter, sağlayıcı oluşturucusu ile ilk katılım/yapılandırma yardımcıları
    için `api.js` kullanırken `register.runtime.js` depo içi kullanım için hâlâ
    genel `plugin-sdk/provider-stream` yardımcılarını yeniden dışa aktarabilir.
- Facade ile yüklenen genel giriş noktaları, biri varsa etkin çalışma zamanı
  yapılandırma anlık görüntüsünü tercih eder; OpenClaw henüz bir çalışma zamanı
  anlık görüntüsü sunmuyorsa diskteki çözümlenmiş yapılandırma dosyasına geri
  düşer.
- Genel paylaşılan ilkel öğeler tercih edilen genel SDK sözleşmesi olmaya devam
  eder. Paketlenmiş kanallara markalanmış küçük bir ayrılmış uyumluluk kümesi
  hâlâ vardır. Bunları yeni üçüncü taraf içe aktarma hedefleri değil,
  paketlenmiş bakım/uyumluluk bağlantı yüzeyleri olarak değerlendirin; yeni
  kanallar arası sözleşmeler yine de genel `plugin-sdk/*` alt yollarına veya
  eklenti yerel `api.js` / `runtime-api.js` barrel'larına eklenmelidir.

Uyumluluk notu:

- Yeni kod için kök `openclaw/plugin-sdk` barrel'ını kullanmaktan kaçının.
- Önce dar ve kararlı ilkel öğeleri tercih edin. Daha yeni
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool alt yolları, yeni paketlenmiş ve harici eklenti
  çalışmaları için amaçlanan sözleşmedir.
  Hedef ayrıştırma/eşleme `openclaw/plugin-sdk/channel-targets` üzerinde yer
  almalıdır.
  Mesaj eylemi kapıları ve tepki mesaj-kimliği yardımcıları
  `openclaw/plugin-sdk/channel-actions` üzerinde yer almalıdır.
- Paketlenmiş uzantıya özgü yardımcı barrel'lar varsayılan olarak kararlı
  değildir. Bir yardımcı yalnızca paketlenmiş bir uzantı tarafından
  gerekiyorsa, bunu `openclaw/plugin-sdk/<extension>` içine yükseltmek yerine
  uzantının yerel `api.js` veya `runtime-api.js` bağlantı yüzeyinin arkasında
  tutun.
- Yeni paylaşılan yardımcı bağlantı yüzeyleri kanala markalanmış değil, genel
  olmalıdır. Paylaşılan hedef ayrıştırma
  `openclaw/plugin-sdk/channel-targets` üzerinde yer alır; kanala özgü iç
  yapılar ise sahibi olan eklentinin yerel `api.js` veya `runtime-api.js`
  bağlantı yüzeyinin arkasında kalır.
- `image-generation`, `media-understanding` ve `speech` gibi yeteneğe özgü alt
  yollar vardır çünkü paketlenmiş/yerel eklentiler bugün bunları kullanır. Bu
  yolların varlığı tek başına dışa aktarılan her yardımcının uzun vadeli olarak
  dondurulmuş bir harici sözleşme olduğu anlamına gelmez.

## Message araç şemaları

Eklentiler kanala özgü `describeMessageTool(...)` şema katkılarının sahibi
olmalıdır. Sağlayıcıya özgü alanları paylaşılan çekirdekte değil, eklentide
tutun.

Paylaşılan taşınabilir şema parçaları için,
`openclaw/plugin-sdk/channel-actions` üzerinden dışa aktarılan genel
yardımcıları yeniden kullanın:

- düğme ızgarası tarzı yükler için `createMessageToolButtonsSchema()`
- yapılandırılmış kart yükleri için `createMessageToolCardSchema()`

Bir şema şekli yalnızca bir sağlayıcı için anlamlıysa, bunu paylaşılan SDK'ya
yükseltmek yerine o eklentinin kendi kaynağında tanımlayın.

## Kanal hedef çözümleme

Kanal eklentileri kanala özgü hedef semantiğinin sahibi olmalıdır. Paylaşılan
giden barındırıcıyı genel tutun ve sağlayıcı kuralları için mesajlaşma
bağdaştırıcı yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, dizin aramasından önce normalize
  edilmiş bir hedefin `direct`, `group` veya `channel` olarak ele alınıp
  alınmayacağına karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin dizin
  araması yerine doğrudan kimlik benzeri çözümlemeye geçip geçmemesi
  gerektiğini çekirdeğe bildirir.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin normalizasyondan
  sonra veya dizin kaçırmasından sonra son sağlayıcı sahipli çözümlemeye
  ihtiyaç duyması durumunda eklenti geri dönüşüdür.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra
  sağlayıcıya özgü oturum rota oluşturmanın sahibidir.

Önerilen ayrım:

- Eşler/gruplar aranmadan önce gerçekleşmesi gereken kategori kararları için
  `inferTargetChatType` kullanın.
- "Bunu açık/yerel hedef kimliği olarak ele al" denetimleri için `looksLikeId`
  kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalizasyon geri dönüşü
  için `resolveTarget` kullanın.
- Sohbet kimlikleri, iş parçacığı kimlikleri, JID'ler, tutamaçlar ve oda
  kimlikleri gibi sağlayıcı yerel kimlikleri genel SDK alanlarında değil,
  `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten eklentiler bu mantığı eklentide tutmalı
ve `openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları
yeniden kullanmalıdır.

Bir kanalın şu tür yapılandırma destekli eşlere/gruplara ihtiyaç duyduğunda
bunu kullanın:

- izin listesi güdümlü DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesap kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri
işler:

- sorgu filtreleme
- sınır uygulama
- tekilleştirme/normalizasyon yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap denetimi ve kimlik normalizasyonu eklenti uygulamasında
kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı eklentileri çıkarım için model kataloglarını
`registerProvider({ catalog: { run(...) { ... } } })` ile tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın `models.providers` içine yazdığıyla aynı şekli
döndürür:

- bir sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Eklenti sağlayıcıya özgü model kimliklerinin, temel URL varsayılanlarının veya
kimlik doğrulama kapılı model meta verilerinin sahibi olduğunda `catalog`
kullanın.

`catalog.order`, bir eklentinin kataloğunun OpenClaw'ın yerleşik örtük
sağlayıcılarına göre ne zaman birleştirileceğini kontrol eder:

- `simple`: düz API anahtarı veya ortam güdümlü sağlayıcılar
- `profile`: kimlik doğrulama profilleri var olduğunda görünen sağlayıcılar
- `paired`: birbiriyle ilişkili birden çok sağlayıcı girdisini sentezleyen
  sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra, son geçiş

Daha sonraki sağlayıcılar anahtar çakışmasında kazanır; böylece eklentiler aynı
sağlayıcı kimliğine sahip yerleşik bir sağlayıcı girdisini bilinçli olarak
geçersiz kılabilir.

Uyumluluk:

- `discovery` eski bir takma ad olarak hâlâ çalışır
- hem `catalog` hem de `discovery` kaydedilmişse OpenClaw `catalog` kullanır

## Salt okunur kanal inceleme

Eklentiniz bir kanal kaydediyorsa, `resolveAccount(...)` yanında
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin tamamen
  somutlaştırıldığını varsaymasına izin verilir ve gerekli sırlar eksikse hızlı
  başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yolları, yalnızca yapılandırmayı
  açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırmaya ihtiyaç
  duymamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda kimlik bilgisi kaynağı/durumu alanlarını ekleyin, örneğin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği bildirmek için ham belirteç değerlerini
  döndürmeniz gerekmez. Durum tarzı komutlar için `tokenStatus: "available"`
  (ve eşleşen kaynak alanı) döndürmek yeterlidir.
- Bir kimlik bilgisi SecretRef aracılığıyla yapılandırılmış ancak geçerli komut
  yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların yapılandırılmamış olarak çökmek veya yanlış rapor
etmek yerine "yapılandırılmış ama bu komut yolunda kullanılamıyor" bilgisini
raporlamasını sağlar.

## Paket paketleri

Bir eklenti dizini, `openclaw.extensions` içeren bir `package.json`
barındırabilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her girdi bir eklenti olur. Paket birden çok uzantı listeliyorsa eklenti kimliği
`name/<fileBase>` olur.

Eklentiniz npm bağımlılıkları içe aktarıyorsa, `node_modules` kullanılabilir
olsun diye bunları o dizine yükleyin (`npm install` / `pnpm install`).

Güvenlik korkuluğu: her `openclaw.extensions` girdisi, sembolik bağ çözümlemesinden
sonra eklenti dizini içinde kalmalıdır. Paket dizininden çıkan girdiler
reddedilir.

Güvenlik notu: `openclaw plugins install`, eklenti bağımlılıklarını
`npm install --omit=dev --ignore-scripts` ile yükler (yaşam döngüsü betikleri
yok, çalışma zamanında geliştirme bağımlılıkları yok). Eklenti bağımlılık
ağaçlarını "saf JS/TS" tutun ve `postinstall` derlemeleri gerektiren
paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry` hafif bir yalnızca kurulum modülünü
işaret edebilir. OpenClaw, devre dışı bir kanal eklentisi için kurulum
yüzeylerine ihtiyaç duyduğunda veya bir kanal eklentisi etkin ama henüz
yapılandırılmamış olduğunda, tam eklenti girişi yerine `setupEntry` yükler.
Bu, ana eklenti girişiniz araçlar, kancalar veya diğer yalnızca çalışma zamanı
kodlarını da bağlıyorsa başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı:
`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`, kanal zaten
yapılandırılmış olsa bile bir kanal eklentisini gateway'in dinleme öncesi
başlangıç aşamasında aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, gateway dinlemeye başlamadan önce var olması gereken
başlangıç yüzeyini tamamen kapsıyorsa kullanın. Pratikte bu, kurulum girişinin
başlangıcın bağımlı olduğu her kanal sahipli yeteneği kaydetmesi gerektiği
anlamına gelir; örneğin:

- kanal kaydının kendisi
- gateway dinlemeye başlamadan önce kullanılabilir olması gereken HTTP yolları
- aynı pencere sırasında var olması gereken herhangi bir gateway yöntemi,
  aracı veya hizmeti

Tam girişiniz hâlâ gerekli bir başlangıç yeteneğinin sahibiyse bu bayrağı
etkinleştirmeyin. Eklentiyi varsayılan davranışta bırakın ve OpenClaw'ın tam
girişi başlangıç sırasında yüklemesine izin verin.

Paketlenmiş kanallar ayrıca çekirdeğin tam kanal çalışma zamanı yüklenmeden
önce danışabileceği yalnızca kurulum sözleşme-yüzeyi yardımcıları
yayımlayabilir. Geçerli kurulum yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, eski tek hesaplı kanal yapılandırmasını tam eklenti girişini
yüklemeden `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu yüzeyi
kullanır. Matrix şu anki paketlenmiş örnektir: adlandırılmış hesaplar zaten
varsa yalnızca kimlik doğrulama/önyükleme anahtarlarını adlandırılmış yükseltilmiş
bir hesaba taşır ve her zaman `accounts.default` oluşturmak yerine
yapılandırılmış kurallı olmayan bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama bağdaştırıcıları, paketlenmiş sözleşme-yüzeyi keşfini tembel
tutar. İçe aktarma zamanı hafif kalır; yükseltme yüzeyi modül içe aktarımı
sırasında paketlenmiş kanal başlangıcına yeniden girmek yerine yalnızca ilk
kullanımda yüklenir.

Bu başlangıç yüzeyleri gateway RPC yöntemleri içerdiğinde, bunları eklentiye
özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir eklenti daha
dar bir kapsam istese bile her zaman `operator.admin` olarak çözülür.

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

### Kanal katalog meta verileri

Kanal eklentileri, `openclaw.channel` aracılığıyla kurulum/keşif meta verileri
ve `openclaw.install` aracılığıyla kurulum ipuçları duyurabilir. Bu, çekirdek
kataloğu veriden bağımsız tutar.

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

En düşük örneğin ötesinde kullanışlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: belgeler bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin geride bırakması gereken daha düşük
  öncelikli eklenti/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim
  yüzeyi kopya denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown
  destekli olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında yapılandırılmış kanal
  listeleme yüzeylerinden kanalı gizler
- `exposure.setup`: `false` olarak ayarlandığında etkileşimli kurulum/
  yapılandırma seçicilerinden kanalı gizler
- `exposure.docs`: belgeler gezinme yüzeyleri için kanalı dahili/özel olarak
  işaretler
- `showConfigured` / `showInSetup`: eski takma adlar uyumluluk için hâlâ kabul
  edilir; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına
  dahil eder
- `forceAccountBinding`: yalnızca tek bir hesap olsa bile açık hesap bağlaması
  gerektirir
- `preferSessionLookupForAnnounceTarget`: duyuru hedeflerini çözümlerken oturum
  aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin bir
MPM kayıt dışa aktarımı). Şu konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) ile bir
veya daha fazla JSON dosyasını işaret edin (virgül/noktalı virgül/`PATH`
ayrılmış). Her dosya şu yapıyı içermelidir:
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`.
Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya
`"plugins"` değerlerini de kabul eder.

## Bağlam motoru eklentileri

Bağlam motoru eklentileri; alma, birleştirme ve sıkıştırma için oturum bağlamı
orkestrasyonunun sahibidir. Bunları eklentinizden
`api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, eklentiniz yalnızca bellek araması veya kancalar eklemek yerine varsayılan
bağlam hattını değiştirmek ya da genişletmek istediğinde kullanın.

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

Motorunuz sıkıştırma algoritmasının sahibi **değilse**, `compact()` yöntemini
uygulamaya devam edin ve bunu açıkça devredin:

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

Bir eklenti mevcut API'ye uymayan bir davranışa ihtiyaç duyduğunda, eklenti
sistemini özel bir iç erişimle atlamayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi paylaşılan davranışın sahibi olması gerektiğine karar verin:
   politika, geri dönüş, yapılandırma birleştirme, yaşam döngüsü, kanala dönük
   semantik ve çalışma zamanı yardımcı şekli.
2. türlenmiş eklenti kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` öğelerini en küçük yararlı
   türlenmiş yetenek yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik eklentileri, yeni yeteneği bir satıcı uygulamasını
   doğrudan içe aktararak değil çekirdek üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Satıcı eklentileri daha sonra arka uçlarını bu yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt şekli zaman içinde açık kalsın diye testler ekleyin.

OpenClaw böylece tek bir sağlayıcının dünya görüşüne sabit kodlanmadan görüş
sahibi kalır. Somut bir dosya kontrol listesi ve çalışılmış örnek için
[Yetenek Yemek Kitabı](/tr/plugins/architecture) bölümüne bakın.

### Yetenek kontrol listesi

Yeni bir yetenek eklediğinizde, uygulama genellikle bu yüzeylere birlikte
dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme türleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki eklenti API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki eklenti kayıt sistemi bağlantısı
- özellik/kanal eklentilerinin bunu tüketmesi gerektiğinde
  `src/plugins/runtime/*` içindeki eklenti çalışma zamanı sunumu
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/eklenti belgeleri

Bu yüzeylerden biri eksikse, bu genellikle yeteneğin henüz tam olarak entegre
edilmediğinin işaretidir.

### Yetenek şablonu

En küçük desen:

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

Sözleşme testi deseni:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu, kuralı basit tutar:

- çekirdek yetenek sözleşmesinin + orkestrasyonun sahibidir
- satıcı eklentileri satıcı uygulamalarının sahibidir
- özellik/kanal eklentileri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar
