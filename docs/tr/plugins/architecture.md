---
read_when:
    - Yerel OpenClaw Plugin'leri oluşturma veya hata ayıklama
    - Plugin yetenek modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme ardışık düzeni veya kayıt sistemi üzerinde çalışma
    - Sağlayıcı çalışma zamanı kancalarını veya kanal Plugin'lerini uygulama
sidebarTitle: Internals
summary: 'Plugin iç bileşenleri: yetenek modeli, sahiplik, sözleşmeler, yükleme ardışık düzeni ve çalışma zamanı yardımcıları'
title: Plugin İç Bileşenleri
x-i18n:
    generated_at: "2026-04-15T08:53:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86798b5d2b0ad82d2397a52a6c21ed37fe6eee1dd3d124a9e4150c4f630b841
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin İç Bileşenleri

<Info>
  Bu, **derin mimari başvuru** sayfasıdır. Pratik kılavuzlar için şunlara bakın:
  - [Plugin'leri kurun ve kullanın](/tr/tools/plugin) — kullanıcı kılavuzu
  - [Başlangıç](/tr/plugins/building-plugins) — ilk Plugin öğreticisi
  - [Kanal Plugin'leri](/tr/plugins/sdk-channel-plugins) — bir mesajlaşma kanalı oluşturun
  - [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) — bir model sağlayıcısı oluşturun
  - [SDK Genel Bakış](/tr/plugins/sdk-overview) — içe aktarma eşlemesi ve kayıt API'si
</Info>

Bu sayfa, OpenClaw Plugin sisteminin iç mimarisini kapsar.

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki genel **yerel Plugin** modelidir. Her
yerel OpenClaw Plugin'i bir veya daha fazla yetenek türüne karşı kayıt olur:

| Yetenek               | Kayıt yöntemi                                   | Örnek Plugin'ler                    |
| --------------------- | ----------------------------------------------- | ----------------------------------- |
| Metin çıkarımı        | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| CLI çıkarım arka ucu  | `api.registerCliBackend(...)`                   | `openai`, `anthropic`               |
| Konuşma               | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Gerçek zamanlı deşifre| `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Gerçek zamanlı ses    | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Medya anlama          | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| Görüntü oluşturma     | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Müzik oluşturma       | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Video oluşturma       | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Web getirme           | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Web arama             | `api.registerWebSearchProvider(...)`            | `google`                            |
| Kanal / mesajlaşma    | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |

Sıfır yetenek kaydeden ancak kancalar, araçlar veya
hizmetler sağlayan bir Plugin, **eski yalnızca kanca** Plugin'idir. Bu desen hâlâ tamamen desteklenir.

### Harici uyumluluk duruşu

Yetenek modeli çekirdeğe yerleşmiştir ve bugün paketlenmiş/yerel Plugin'ler
tarafından kullanılmaktadır, ancak harici Plugin uyumluluğu için "dışa aktarılmışsa,
o hâlde sabitlenmiştir" yaklaşımından daha sıkı bir eşik gerekir.

Güncel yönlendirme:

- **mevcut harici Plugin'ler:** kanca tabanlı entegrasyonları çalışır durumda tutun; bunu
  uyumluluk taban çizgisi olarak değerlendirin
- **yeni paketlenmiş/yerel Plugin'ler:** satıcıya özgü iç erişimler veya yeni yalnızca kanca tasarımları yerine
  açık yetenek kaydını tercih edin
- **yetenek kaydını benimseyen harici Plugin'ler:** buna izin verilir, ancak belgeler bir
  sözleşmeyi açıkça kararlı olarak işaretlemedikçe yeteneğe özgü yardımcı yüzeyleri gelişen yüzeyler olarak değerlendirin

Pratik kural:

- yetenek kayıt API'leri amaçlanan yöndür
- eski kancalar, geçiş sırasında harici Plugin'ler için en güvenli
  bozulmasız yol olmaya devam eder
- dışa aktarılan yardımcı alt yolların hepsi eşdeğer değildir; tesadüfi yardımcı dışa aktarımları değil,
  belgelenmiş dar sözleşmeyi tercih edin

### Plugin biçimleri

OpenClaw, yüklenen her Plugin'i gerçek kayıt davranışına göre
(yalnızca statik meta verilere göre değil) bir biçime sınıflandırır:

- **plain-capability** -- tam olarak bir yetenek türü kaydeder (örneğin
  `mistral` gibi yalnızca sağlayıcı olan bir Plugin)
- **hybrid-capability** -- birden fazla yetenek türü kaydeder (örneğin
  `openai`, metin çıkarımı, konuşma, medya anlama ve görüntü
  oluşturma için sahiplik üstlenir)
- **hook-only** -- yalnızca kancaları kaydeder (türlendirilmiş veya özel), yetenek,
  araç, komut veya hizmet kaydetmez
- **non-capability** -- yetenek kaydetmeden araçlar, komutlar, hizmetler veya rotalar kaydeder

Bir Plugin'in biçimini ve yetenek
dökümünü görmek için `openclaw plugins inspect <id>` kullanın. Ayrıntılar için [CLI başvurusu](/cli/plugins#inspect) bölümüne bakın.

### Eski kancalar

`before_agent_start` kancası, yalnızca kanca kullanan Plugin'ler için bir uyumluluk yolu olarak desteklenmeye devam eder. Gerçek dünyadaki eski Plugin'ler hâlâ buna bağımlıdır.

Yön:

- çalışır durumda tutun
- eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma çalışmaları için `before_model_resolve` tercih edin
- istem mutasyonu çalışmaları için `before_prompt_build` tercih edin
- gerçek kullanım azalmadan ve demirbaş kapsamı geçiş güvenliğini kanıtlamadan kaldırmayın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda,
şu etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlamı                                                      |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Yapılandırma sorunsuz ayrıştırılır ve Plugin'ler çözülür    |
| **compatibility advisory** | Plugin desteklenen ama daha eski bir desen kullanıyor (örn. `hook-only`) |
| **legacy warning**         | Plugin kullanımdan kaldırılmış olan `before_agent_start` kullanıyor |
| **hard error**             | Yapılandırma geçersiz veya Plugin yüklenemedi               |

Bugün ne `hook-only` ne de `before_agent_start` Plugin'inizi bozmaz --
`hook-only` tavsiye niteliğindedir ve `before_agent_start` yalnızca bir uyarı tetikler. Bu
sinyaller `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimariye genel bakış

OpenClaw'ın Plugin sistemi dört katmandan oluşur:

1. **Manifest + keşif**
   OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden,
   genel uzantı köklerinden ve paketlenmiş uzantılardan aday Plugin'leri bulur. Keşif önce
   yerel `openclaw.plugin.json` manifestlerini ve desteklenen paket manifestlerini okur.
2. **Etkinleştirme + doğrulama**
   Çekirdek, keşfedilen bir Plugin'in etkin, devre dışı, engellenmiş
   veya bellek gibi özel bir yuva için seçilmiş olup olmadığına karar verir.
3. **Çalışma zamanı yükleme**
   Yerel OpenClaw Plugin'leri `jiti` aracılığıyla süreç içinde yüklenir ve
   yetenekleri merkezi bir kayıt sistemine kaydeder. Uyumlu paketler, çalışma zamanı kodu içe aktarılmadan
   kayıt sistemi kayıtlarına normalize edilir.
4. **Yüzey tüketimi**
   OpenClaw'ın geri kalanı, araçları, kanalları, sağlayıcı
   kurulumunu, kancaları, HTTP rotalarını, CLI komutlarını ve hizmetleri açığa çıkarmak için kayıt sistemini okur.

Özellikle Plugin CLI için, kök komut keşfi iki aşamaya ayrılır:

- ayrıştırma zamanı meta verileri `registerCli(..., { descriptors: [...] })` içinden gelir
- gerçek Plugin CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, Plugin'e ait CLI kodunu Plugin içinde tutarken OpenClaw'ın
ayrıştırmadan önce kök komut adlarını ayırmasını sağlar.

Önemli tasarım sınırı:

- keşif + yapılandırma doğrulaması, Plugin kodu çalıştırılmadan
  **manifest/schema metadata** üzerinden çalışabilmelidir
- yerel çalışma zamanı davranışı, Plugin modülünün `register(api)` yolundan gelir

Bu ayrım, OpenClaw'ın yapılandırmayı doğrulamasını, eksik/devre dışı Plugin'leri açıklamasını ve
tam çalışma zamanı etkinleşmeden önce kullanıcı arayüzü/schema ipuçları
oluşturmasını sağlar.

### Kanal Plugin'leri ve paylaşılan mesaj aracı

Kanal Plugin'lerinin normal sohbet eylemleri için ayrı bir gönder/düzenle/tepki aracı kaydetmesi gerekmez. OpenClaw, çekirdekte tek bir paylaşılan `message` aracını tutar ve
kanala özgü keşif ile yürütmenin sahipliği bunun arkasında kanal Plugin'lerindedir.

Güncel sınır şudur:

- çekirdek, paylaşılan `message` araç ana makinesinin, istem kablolamasının, oturum/konu
  kayıtlarının ve yürütme sevkinin sahibidir
- kanal Plugin'leri kapsamlı eylem keşfinin, yetenek keşfinin ve
  kanala özgü tüm şema parçalarının sahibidir
- kanal Plugin'leri, konu kimliklerinin ileti dizisi kimliklerini nasıl kodladığı veya
  üst konuşmalardan nasıl miras aldığı gibi sağlayıcıya özgü oturum konuşma dil bilgisinin sahibidir
- kanal Plugin'leri son eylemi kendi eylem bağdaştırıcıları üzerinden yürütür

Kanal Plugin'leri için SDK yüzeyi
`ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif
çağrısı, bir Plugin'in görünür eylemleri, yetenekleri ve şema
katkılarını birlikte döndürmesine olanak tanır; böylece bu parçalar birbirinden kopmaz.

Kanala özgü bir mesaj-aracı parametresi yerel yol veya uzak medya URL'si gibi
bir medya kaynağı taşıdığında, Plugin ayrıca
`describeMessageTool(...)` içinden `mediaSourceParams` da döndürmelidir. Çekirdek, korumalı alan yol normalizasyonu ve giden medya erişim ipuçlarını
Plugin'e ait parametre adlarını sabit kodlamadan uygulamak için bu açık
listeyi kullanır.
Burada kanal geneline ait tek bir düz liste yerine eylem kapsamlı eşlemeleri
tercih edin; böylece yalnızca profile özgü bir medya parametresi
`send` gibi ilgisiz eylemlerde normalize edilmez.

Çekirdek, çalışma zamanı kapsamını bu keşif adımına geçirir. Önemli alanlar şunları içerir:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı Plugin'ler için önemlidir. Bir kanal, etkin hesap,
geçerli oda/ileti dizisi/mesaj veya güvenilir istek sahibi kimliğine göre
mesaj eylemlerini, çekirdekte `message` aracında kanala özgü dallar sabit kodlamadan gizleyebilir veya açığa çıkarabilir.

Bu nedenle gömülü çalıştırıcı yönlendirme değişiklikleri hâlâ Plugin işidir: çalıştırıcı,
paylaşılan `message` aracının
geçerli dönüş için doğru kanala ait yüzeyi açığa çıkarması amacıyla geçerli sohbet/oturum kimliğini Plugin
keşif sınırına iletmekten sorumludur.

Kanala ait yürütme yardımcıları için, paketlenmiş Plugin'ler yürütme
çalışma zamanını kendi uzantı modüllerinin içinde tutmalıdır. Çekirdek artık
`src/agents/tools` altında Discord,
Slack, Telegram veya WhatsApp mesaj-eylemi çalışma zamanlarının sahibi değildir.
Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş
Plugin'ler kendi yerel çalışma zamanı kodlarını doğrudan
uzantıya ait modüllerinden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK sınırları için de geçerlidir: çekirdek,
Slack, Discord, Signal,
WhatsApp veya benzeri uzantılar için kanala özgü kolaylık varillerini içe aktarmamalıdır. Çekirdek bir davranışa ihtiyaç duyarsa ya
paketlenmiş Plugin'in kendi `api.ts` / `runtime-api.ts` varilini kullanmalı
ya da ihtiyacı paylaşılan SDK içinde dar bir genel yeteneğe yükseltmelidir.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel yoldur
- `actions.handleAction("poll")`, kanala özgü anket anlambilimi veya ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını, Plugin anket sevki
eylemi reddettikten sonraya erteler; böylece Plugin'e ait anket işleyicileri,
önce genel anket ayrıştırıcısı tarafından engellenmeden kanala özgü anket
alanlarını kabul edebilir.

Tam başlatma sırası için [Yükleme ardışık düzeni](#load-pipeline) bölümüne bakın.

## Yetenek sahipliği modeli

OpenClaw, yerel bir Plugin'i ilgisiz
entegrasyonlardan oluşan bir torba olarak değil, bir **şirketin** veya bir
**özelliğin** sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket Plugin'i genellikle o şirketin OpenClaw'a dönük
  tüm yüzeylerinin sahibi olmalıdır
- bir özellik Plugin'i genellikle sunduğu özelliğin tüm yüzeyinin
  sahibi olmalıdır
- kanallar, sağlayıcı davranışını gelişigüzel yeniden uygulamak yerine paylaşılan çekirdek yetenekleri tüketmelidir

Örnekler:

- paketlenmiş `openai` Plugin'i, OpenAI model-sağlayıcı davranışının ve OpenAI
  konuşma + gerçek zamanlı ses + medya-anlama + görüntü-oluşturma davranışının sahibidir
- paketlenmiş `elevenlabs` Plugin'i, ElevenLabs konuşma davranışının sahibidir
- paketlenmiş `microsoft` Plugin'i, Microsoft konuşma davranışının sahibidir
- paketlenmiş `google` Plugin'i, Google model-sağlayıcı davranışının yanı sıra Google
  medya-anlama + görüntü-oluşturma + web-arama davranışının sahibidir
- paketlenmiş `firecrawl` Plugin'i, Firecrawl web-getirme davranışının sahibidir
- paketlenmiş `minimax`, `mistral`, `moonshot` ve `zai` Plugin'leri,
  medya-anlama arka uçlarının sahibidir
- paketlenmiş `qwen` Plugin'i, Qwen metin-sağlayıcı davranışının yanı sıra
  medya-anlama ve video-oluşturma davranışının sahibidir
- `voice-call` Plugin'i bir özellik Plugin'idir: çağrı taşımasını, araçları,
  CLI'yi, rotaları ve Twilio medya-akışı köprülemesini sahiplenir, ancak satıcı Plugin'lerini
  doğrudan içe aktarmak yerine paylaşılan konuşma ile gerçek zamanlı deşifre ve gerçek zamanlı ses
  yeteneklerini tüketir

Hedeflenen son durum şudur:

- OpenAI, metin modellerini, konuşmayı, görüntüleri ve
  gelecekte videoyu kapsasa bile tek bir Plugin içinde yaşar
- başka bir satıcı da kendi yüzey alanı için aynısını yapabilir
- kanallar, hangi satıcı Plugin'inin sağlayıcının sahibi olduğunu önemsemez; çekirdek tarafından açığa çıkarılan
  paylaşılan yetenek sözleşmesini tüketir

Ana ayrım şudur:

- **plugin** = sahiplik sınırı
- **capability** = birden çok Plugin'in uygulayabileceği veya tüketebileceği çekirdek sözleşme

Dolayısıyla OpenClaw video gibi yeni bir alan eklerse, ilk soru
"hangi sağlayıcı video işlemeyi sabit kodlamalı?" değildir. İlk soru "çekirdek
video yetenek sözleşmesi nedir?" olmalıdır. Bu sözleşme bir kez var olduğunda, satıcı Plugin'leri
ona karşı kayıt olabilir ve kanal/özellik Plugin'leri onu tüketebilir.

Yetenek henüz yoksa, doğru hareket genellikle şudur:

1. çekirdekte eksik yeteneği tanımlayın
2. bunu türlendirilmiş bir şekilde Plugin API'si/çalışma zamanı üzerinden açığa çıkarın
3. kanalları/özellikleri bu yeteneğe göre bağlayın
4. satıcı Plugin'lerinin uygulamaları kaydetmesine izin verin

Bu, çekirdek davranışın tek bir satıcıya veya tek seferlik Plugin'e özgü
bir kod yoluna bağlı olmasını önlerken sahipliği açık tutar.

### Yetenek katmanlaması

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

- **çekirdek yetenek katmanı**: paylaşılan orkestrasyon, ilke, geri dönüş, yapılandırma
  birleştirme kuralları, teslim anlambilimi ve türlendirilmiş sözleşmeler
- **satıcı Plugin katmanı**: satıcıya özgü API'ler, kimlik doğrulama, model katalogları, konuşma
  sentezi, görüntü oluşturma, gelecekteki video arka uçları, kullanım uç noktaları
- **kanal/özellik Plugin katmanı**: çekirdek yetenekleri tüketen ve
  bunları bir yüzeyde sunan Slack/Discord/voice-call/vb. entegrasyonu

Örneğin TTS şu biçimi izler:

- çekirdek, yanıt zamanındaki TTS ilkesinin, geri dönüş sırasının, tercihlerin ve kanal tesliminin sahibidir
- `openai`, `elevenlabs` ve `microsoft`, sentez uygulamalarının sahibidir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Aynı desen gelecekteki yetenekler için de tercih edilmelidir.

### Çok yetenekli şirket Plugin örneği

Bir şirket Plugin'i dışarıdan bakıldığında tutarlı hissettirmelidir. OpenClaw'ta
modeller, konuşma, gerçek zamanlı deşifre, gerçek zamanlı ses, medya
anlama, görüntü oluşturma, video oluşturma, web getirme ve web arama için paylaşılan
sözleşmeler varsa, bir satıcı tüm yüzeylerinin sahibi tek bir yerde olabilir:

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

Önemli olan tam yardımcı adları değildir. Biçim önemlidir:

- tek bir Plugin satıcı yüzeyinin sahibidir
- çekirdek hâlâ yetenek sözleşmelerinin sahibidir
- kanallar ve özellik Plugin'leri satıcı kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, Plugin'in
  sahip olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw, görüntü/ses/video anlamayı zaten tek bir paylaşılan
yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

1. çekirdek medya-anlama sözleşmesini tanımlar
2. satıcı Plugin'leri, uygun olduğu şekilde `describeImage`, `transcribeAudio` ve
   `describeVideo` kaydeder
3. kanal ve özellik Plugin'leri, doğrudan satıcı koduna
   bağlanmak yerine paylaşılan çekirdek davranışı tüketir

Bu, bir sağlayıcının video varsayımlarının çekirdeğe gömülmesini önler. Satıcı yüzeyinin sahibi
Plugin'dir; yetenek sözleşmesinin ve geri dönüş davranışının sahibi çekirdektir.

Video oluşturma zaten aynı diziyi kullanır: çekirdek, türlendirilmiş
yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir; satıcı Plugin'leri de
`api.registerVideoGenerationProvider(...)` uygulamalarını buna karşı kaydeder.

Somut bir dağıtım denetim listesine mi ihtiyacınız var? Bkz.
[Capability Cookbook](/tr/plugins/architecture).

## Sözleşmeler ve zorunlu kılma

Plugin API yüzeyi kasıtlı olarak türlendirilmiştir ve
`OpenClawPluginApi` içinde merkezileştirilmiştir. Bu sözleşme, desteklenen kayıt noktalarını ve
bir Plugin'in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun önemi:

- Plugin yazarları tek bir kararlı iç standart elde eder
- çekirdek, iki Plugin'in aynı
  sağlayıcı kimliğini kaydetmesi gibi yinelenen sahipliği reddedebilir
- başlatma, hatalı biçimlendirilmiş kayıtlar için eyleme geçirilebilir tanılar gösterebilir
- sözleşme testleri, paketlenmiş Plugin sahipliğini zorunlu kılabilir ve sessiz kaymayı önleyebilir

İki zorunlu kılma katmanı vardır:

1. **çalışma zamanı kayıt zorunlu kılma**
   Plugin kayıt sistemi, Plugin'ler yüklenirken kayıtları doğrular. Örnekler:
   yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcı kimlikleri ve hatalı biçimlendirilmiş
   kayıtlar tanımsız davranış yerine Plugin tanıları üretir.
2. **sözleşme testleri**
   Paketlenmiş Plugin'ler test çalışmaları sırasında sözleşme kayıtlarına alınır; böylece
   OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu; model
   sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt
   sahipliği için kullanılmaktadır.

Pratik etki şudur: OpenClaw, hangi yüzeyin hangi Plugin'e ait olduğunu
önceden bilir. Bu, çekirdeğin ve kanalların sorunsuzca bileşmesine olanak tanır;
çünkü sahiplik örtük değil, bildirilmiş, türlendirilmiş ve test edilebilirdir.

### Bir sözleşmede ne bulunmalıdır

İyi Plugin sözleşmeleri şunlardır:

- türlendirilmiş
- küçük
- yeteneğe özgü
- çekirdeğe ait
- birden çok Plugin tarafından yeniden kullanılabilir
- satıcı bilgisi olmadan kanallar/özellikler tarafından tüketilebilir

Kötü Plugin sözleşmeleri şunlardır:

- çekirdekte gizlenmiş satıcıya özgü ilke
- kayıt sistemini baypas eden tek seferlik Plugin kaçış yolları
- kanal kodunun doğrudan bir satıcı uygulamasına erişmesi
- `OpenClawPluginApi` veya
  `api.runtime` parçası olmayan gelişigüzel çalışma zamanı nesneleri

Şüphede kalırsanız, soyutlama düzeyini yükseltin: önce yeteneği tanımlayın, sonra
Plugin'lerin buna takılmasına izin verin.

## Yürütme modeli

Yerel OpenClaw Plugin'leri, Gateway ile **aynı süreç içinde** çalışır. Korumalı
değildirler. Yüklenmiş bir yerel Plugin, çekirdek kod ile aynı süreç düzeyinde
güven sınırına sahiptir.

Sonuçlar:

- yerel bir Plugin araçlar, ağ işleyicileri, kancalar ve hizmetler kaydedebilir
- yerel bir Plugin hatası gateway'i çökertebilir veya kararsızlaştırabilir
- kötü niyetli bir yerel Plugin, OpenClaw süreci içinde keyfi kod yürütmeye denktir

Uyumlu paketler varsayılan olarak daha güvenlidir; çünkü OpenClaw şu anda onları
meta veri/içerik paketleri olarak ele alır. Güncel sürümlerde bu çoğunlukla paketlenmiş
Skills anlamına gelir.

Paketlenmemiş Plugin'ler için izin listeleri ve açık kurulum/yükleme yolları kullanın.
Çalışma alanı Plugin'lerini üretim varsayılanları değil, geliştirme zamanı kodu olarak değerlendirin.

Paketlenmiş çalışma alanı paket adları için, Plugin kimliğini npm
adına sabitleyin: varsayılan olarak `@openclaw/<id>` veya
paketin kasıtlı olarak daha dar bir Plugin rolünü açığa çıkardığı durumlarda
`-provider`, `-plugin`, `-speech`, `-sandbox` veya `-media-understanding` gibi
onaylı türlendirilmiş bir son ek kullanın.

Önemli güven notu:

- `plugins.allow`, **plugin ids**'ye güvenir; kaynak kökenine değil.
- Paketlenmiş bir Plugin ile aynı kimliğe sahip bir çalışma alanı Plugin'i,
  bu çalışma alanı Plugin'i etkinleştirildiğinde/izin listesine alındığında
  paketlenmiş kopyayı kasıtlı olarak gölgeler.
- Bu normaldir ve yerel geliştirme, yama testi ve düzeltmeler için faydalıdır.

## Dışa aktarma sınırı

OpenClaw, uygulama kolaylıklarını değil, yetenekleri dışa aktarır.

Yetenek kaydını genel tutun. Sözleşme dışı yardımcı dışa aktarımları azaltın:

- paketlenmiş Plugin'e özgü yardımcı alt yollar
- genel API olması amaçlanmayan çalışma zamanı tesisatı alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/ilk katılım yardımcıları

Bazı paketlenmiş Plugin yardımcı alt yolları, uyumluluk ve paketlenmiş Plugin bakımı için
oluşturulmuş SDK dışa aktarma eşlemesinde hâlâ durmaktadır. Güncel örnekler arasında
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve çeşitli `plugin-sdk/matrix*` sınırları bulunur. Bunları,
yeni üçüncü taraf Plugin'ler için önerilen SDK deseni olarak değil,
uygulama ayrıntısına ait ayrılmış dışa aktarımlar olarak değerlendirin.

## Yükleme ardışık düzeni

Başlangıçta OpenClaw kabaca şunları yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu paket manifestlerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinleştirmeye karar verir
6. etkin yerel modülleri `jiti` aracılığıyla yükler
7. yerel `register(api)` (veya `activate(api)` — eski bir takma ad) kancalarını çağırır ve kayıtları Plugin kayıt sisteminde toplar
8. kayıt sistemini komutlara/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici mevcut olanı çözer (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketlenmiş Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik geçitleri **çalışma zamanı yürütmesinden önce** gerçekleşir. Giriş Plugin kökünden
kaçtığında, yol herkes tarafından yazılabilir olduğunda veya paketlenmemiş Plugin'ler için
yol sahipliği şüpheli göründüğünde adaylar engellenir.

### Önce manifest davranışı

Manifest, denetim düzleminin doğruluk kaynağıdır. OpenClaw bunu şunlar için kullanır:

- Plugin'i tanımlamak
- bildirilen kanalları/Skills/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Plugin'ler için çalışma zamanı modülü veri düzlemi kısmıdır. Kancalar, araçlar, komutlar veya sağlayıcı akışları gibi
gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları denetim düzleminde kalır.
Bunlar, etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)`'ın veya `setupEntry`'nin yerine geçmezler.
İlk canlı etkinleştirme tüketicileri artık daha geniş kayıt sistemi somutlaştırmasından önce
Plugin yüklemeyi daraltmak için manifest komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yüklemesi, istenen birincil komutun sahibi olan Plugin'lere daraltılır
- kanal kurulumu/Plugin çözümlemesi, istenen
  kanal kimliğinin sahibi olan Plugin'lere daraltılır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen
  sağlayıcı kimliğinin sahibi olan Plugin'lere daraltılır

Kurulum keşfi artık `setup.providers` ve
`setup.cliBackends` gibi tanımlayıcıya ait kimlikleri tercih ederek
aday Plugin'leri, hâlâ kurulum zamanı çalışma zamanı kancalarına ihtiyaç duyan Plugin'ler için
`setup-api`'ye geri dönmeden önce daraltır. Keşfedilen birden fazla Plugin aynı
normalize edilmiş kurulum sağlayıcısı veya CLI arka uç kimliğini talep ederse,
kurulum araması keşif sırasına güvenmek yerine belirsiz sahibini reddeder.

### Yükleyicinin önbelleğe aldığı şeyler

OpenClaw süreç içinde kısa ömürlü önbellekler tutar:

- keşif sonuçları
- manifest kayıt sistemi verileri
- yüklenmiş Plugin kayıt sistemleri

Bu önbellekler ani başlangıç yükünü ve tekrarlanan komut maliyetini azaltır. Bunları
kalıcılık değil, kısa ömürlü performans önbellekleri olarak düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek pencerelerini `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt sistemi modeli

Yüklenen Plugin'ler rastgele çekirdek küresellerini doğrudan değiştirmez. Merkezi bir
Plugin kayıt sistemine kaydolurlar.

Kayıt sistemi şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılar)
- araçlar
- eski kancalar ve türlendirilmiş kancalar
- kanallar
- sağlayıcılar
- Gateway RPC işleyicileri
- HTTP rotaları
- CLI kaydedicileri
- arka plan hizmetleri
- Plugin'e ait komutlar

Daha sonra çekirdek özellikler doğrudan Plugin modülleriyle konuşmak yerine bu kayıt
sisteminden okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt sistemine kayıt
- çekirdek çalışma zamanı -> kayıt sistemi tüketimi

Bu ayrım bakım kolaylığı açısından önemlidir. Çoğu çekirdek yüzeyin yalnızca
tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "kayıt sistemini oku",
"her Plugin modülü için özel durum yaz" değil.

## Konuşma bağlama geri çağrıları

Bir konuşmayı bağlayan Plugin'ler, onay çözüldüğünde tepki verebilir.

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
- `binding`: onaylanan istekler için çözülmüş bağlama
- `request`: özgün istek özeti, ayırma ipucu, gönderen kimliği ve
  konuşma meta verileri

Bu geri çağrı yalnızca bildirim amaçlıdır. Bir konuşmayı kimin bağlayabileceğini değiştirmez
ve çekirdek onay işleme tamamlandıktan sonra çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı Plugin'lerinin artık iki katmanı vardır:

- manifest meta verileri: çalışma zamanı yüklemesinden önce ucuz sağlayıcı ortam kimlik doğrulama araması için `providerAuthEnvVars`,
  kimlik doğrulamayı paylaşan sağlayıcı varyantları için `providerAuthAliases`,
  çalışma zamanı yüklemesinden önce ucuz kanal ortam/kurulum araması için `channelEnvVars`,
  ayrıca çalışma zamanı yüklemesinden önce ucuz ilk katılım/kimlik doğrulama seçimi etiketleri ve
  CLI bayrağı meta verileri için `providerAuthChoices`
- yapılandırma zamanı kancaları: `catalog` / eski `discovery` ile `applyConfigDefaults`
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

OpenClaw yine de genel aracı döngüsünün, yük devretmenin, döküm işleme sürecinin ve
araç ilkesinin sahibidir. Bu kancalar, tamamen özel bir çıkarım taşımasına gerek kalmadan
sağlayıcıya özgü davranış için uzantı yüzeyidir.

Sağlayıcının, genel kimlik doğrulama/durum/model seçici yollarının Plugin
çalışma zamanını yüklemeden görmesi gereken ortam tabanlı kimlik bilgileri varsa manifest `providerAuthEnvVars` kullanın.
Bir sağlayıcı kimliği, başka bir sağlayıcı kimliğinin ortam değişkenlerini, kimlik doğrulama profillerini,
yapılandırma destekli kimlik doğrulamayı ve API anahtarı ilk katılım seçimini yeniden kullanacaksa
manifest `providerAuthAliases` kullanın. İlk katılım/kimlik doğrulama seçimi
CLI yüzeylerinin, sağlayıcının seçim kimliğini, grup etiketlerini ve basit
tek bayraklı kimlik doğrulama kablolamasını sağlayıcı çalışma zamanını yüklemeden bilmesi gerektiğinde
manifest `providerAuthChoices` kullanın. Sağlayıcı çalışma zamanı
`envVars` değerlerini, ilk katılım etiketleri veya OAuth
client-id/client-secret kurulum değişkenleri gibi operatöre dönük ipuçları için koruyun.

Bir kanalın genel kabuk-ortam geri dönüşü, yapılandırma/durum denetimleri
veya kurulum istemlerinin kanal çalışma zamanını yüklemeden görmesi gereken ortam odaklı kimlik doğrulaması veya kurulumu varsa
manifest `channelEnvVars` kullanın.

### Kanca sırası ve kullanım

Model/sağlayıcı Plugin'leri için OpenClaw kancaları kabaca şu sırayla çağırır.
"Kullanım zamanı" sütunu hızlı karar kılavuzudur.

| #   | Kanca                             | Ne yapar                                                                                                       | Ne zaman kullanılır                                                                                                                          |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` oluşturma sırasında sağlayıcı yapılandırmasını `models.providers` içine yayımlar                | Sağlayıcının bir kataloğu veya temel URL varsayılanları vardır                                                                               |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırması sırasında sağlayıcıya ait genel yapılandırma varsayılanlarını uygular            | Varsayılanlar kimlik doğrulama kipine, ortama veya sağlayıcı model ailesi anlambilimine bağlıdır                                            |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt sistemi/katalog yolunu dener                                                       | _(bir Plugin kancası değildir)_                                                                                                              |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalize eder                                  | Sağlayıcı, standart model çözümlemesinden önce takma ad temizliğinin sahibidir                                                               |
| 4   | `normalizeTransport`              | Genel model birleştirmesinden önce sağlayıcı ailesine ait `api` / `baseUrl` değerlerini normalize eder       | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğinin sahibidir                                             |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalize eder                | Sağlayıcının Plugin ile birlikte yaşaması gereken yapılandırma temizliğine ihtiyacı vardır; paketlenmiş Google ailesi yardımcıları da desteklenen Google yapılandırma girdilerini arka planda destekler |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanımı uyumluluk yeniden yazımlarını uygular                       | Sağlayıcının uç nokta odaklı yerel akış kullanımı meta verisi düzeltmelerine ihtiyacı vardır                                                |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı kimlik doğrulaması yüklenmeden önce yapılandırma sağlayıcıları için ortam işaretleyicili kimlik doğrulamayı çözümler | Sağlayıcının sağlayıcıya ait ortam işaretleyicili API anahtarı çözümlemesine ihtiyacı vardır; `amazon-bedrock` da burada yerleşik bir AWS ortam işaretleyicisi çözümleyicisine sahiptir |
| 8   | `resolveSyntheticAuth`            | Düz metni kalıcı hâle getirmeden yerel/kendi kendine barındırılan veya yapılandırma destekli kimlik doğrulamayı ortaya çıkarır | Sağlayıcı sentetik/yerel bir kimlik bilgisi işaretleyicisi ile çalışabilir                                                                   |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcıya ait harici kimlik doğrulama profillerini üst üste bindirir; CLI/uygulamaya ait kimlik bilgileri için varsayılan `persistence` değeri `runtime-only` olur | Sağlayıcı, kopyalanmış yenileme belirteçlerini kalıcı hâle getirmeden harici kimlik doğrulama kimlik bilgilerini yeniden kullanır         |
| 10  | `shouldDeferSyntheticProfileAuth` | Depolanmış sentetik profil yer tutucularını ortam/yapılandırma destekli kimlik doğrulamanın arkasına düşürür | Sağlayıcı, öncelik kazanmaması gereken sentetik yer tutucu profilleri depolar                                                                |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıt sisteminde olmayan sağlayıcıya ait model kimlikleri için eşzamanlı geri dönüş sağlar        | Sağlayıcı keyfi yukarı akış model kimliklerini kabul eder                                                                                    |
| 12  | `prepareDynamicModel`             | Eşzamansız ısınma yapar, sonra `resolveDynamicModel` yeniden çalışır                                           | Sağlayıcının bilinmeyen kimlikleri çözümlemeden önce ağ meta verisine ihtiyacı vardır                                                        |
| 13  | `normalizeResolvedModel`          | Gömülü çalıştırıcı çözülmüş modeli kullanmadan önce son yeniden yazımı yapar                                  | Sağlayıcının taşıma yeniden yazımlarına ihtiyacı vardır ancak yine de çekirdek taşıma kullanır                                               |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşımanın arkasındaki satıcı modelleri için uyumluluk bayrakları katkısında bulunur         | Sağlayıcı, sağlayıcıyı devralmadan vekil taşımalarda kendi modellerini tanır                                                                 |
| 15  | `capabilities`                    | Paylaşılan çekirdek mantığı tarafından kullanılan sağlayıcıya ait döküm/araç meta verileri                    | Sağlayıcının döküm/sağlayıcı ailesi tuhaflıklarına ihtiyacı vardır                                                                           |
| 16  | `normalizeToolSchemas`            | Gömülü çalıştırıcı görmeden önce araç şemalarını normalize eder                                               | Sağlayıcının taşıma ailesi şema temizliğine ihtiyacı vardır                                                                                  |
| 17  | `inspectToolSchemas`              | Normalizasyondan sonra sağlayıcıya ait şema tanılarını ortaya çıkarır                                         | Sağlayıcı, çekirdeğe sağlayıcıya özgü kurallar öğretmeden anahtar sözcük uyarıları istemektedir                                             |
| 18  | `resolveReasoningOutputMode`      | Yerel ile etiketli akıl yürütme çıktısı sözleşmesi arasında seçim yapar                                       | Sağlayıcının yerel alanlar yerine etiketli akıl yürütme/nihai çıktıya ihtiyacı vardır                                                        |
| 19  | `prepareExtraParams`              | Genel akış seçeneği sarmalayıcılarından önce istek parametresi normalizasyonu yapar                           | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı vardır                                   |
| 20  | `createStreamFn`                  | Normal akış yolunu tamamen özel bir taşıma ile değiştirir                                                     | Sağlayıcının yalnızca bir sarmalayıcıya değil, özel bir tel protokolüne ihtiyacı vardır                                                      |
| 21  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı uygular                                           | Sağlayıcının özel bir taşıma olmadan istek üst bilgisi/gövdesi/model uyumluluk sarmalayıcılarına ihtiyacı vardır                           |
| 22  | `resolveTransportTurnState`       | Yerel tur başına taşıma üst bilgilerini veya meta verileri ekler                                              | Sağlayıcı, genel taşımaların sağlayıcıya özgü tur kimliğini göndermesini ister                                                               |
| 23  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket üst bilgilerini veya oturum soğuma ilkesini ekler                                             | Sağlayıcı, genel WS taşımalarının oturum üst bilgilerini veya geri dönüş ilkesini ayarlamasını ister                                        |
| 24  | `formatApiKey`                    | Kimlik doğrulama profili biçimlendiricisi: depolanan profil çalışma zamanı `apiKey` dizesine dönüşür         | Sağlayıcı ek kimlik doğrulama meta verileri depolar ve özel bir çalışma zamanı belirteci biçimine ihtiyaç duyar                            |
| 25  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme başarısızlığı ilkesi için OAuth yenileme geçersiz kılması            | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymaz                                                                                          |
| 26  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenen onarım ipucu                                                     | Sağlayıcının yenileme başarısızlığından sonra sağlayıcıya ait kimlik doğrulama onarım yönlendirmesine ihtiyacı vardır                      |
| 27  | `matchesContextOverflowError`     | Sağlayıcıya ait bağlam penceresi taşması eşleyicisi                                                           | Sağlayıcının genel sezgisel yöntemlerin kaçıracağı ham taşma hataları vardır                                                                 |
| 28  | `classifyFailoverReason`          | Sağlayıcıya ait yük devretme nedeni sınıflandırması                                                           | Sağlayıcı ham API/taşıma hatalarını hız sınırı/aşırı yük/vb. nedenlere eşleyebilir                                                          |
| 29  | `isCacheTtlEligible`              | Vekil/geri taşıma sağlayıcıları için istem önbelleği ilkesi                                                   | Sağlayıcının vekile özgü önbellek TTL geçitlemesine ihtiyacı vardır                                                                          |
| 30  | `buildMissingAuthMessage`         | Genel eksik kimlik doğrulama kurtarma iletisinin yerine geçer                                                 | Sağlayıcının sağlayıcıya özgü bir eksik kimlik doğrulama kurtarma ipucuna ihtiyacı vardır                                                   |
| 31  | `suppressBuiltInModel`            | Eski yukarı akış modelini bastırma ve isteğe bağlı kullanıcıya dönük hata ipucu                              | Sağlayıcının eski yukarı akış satırlarını gizlemesi veya bunları bir satıcı ipucuyla değiştirmesi gerekir                                   |
| 32  | `augmentModelCatalog`             | Keşiften sonra sentetik/nihai katalog satırları eklenir                                                       | Sağlayıcının `models list` ve seçicilerde sentetik ileriye dönük uyumluluk satırlarına ihtiyacı vardır                                     |
| 33  | `isBinaryThinking`                | İkili düşünme sağlayıcıları için aç/kapat akıl yürütme geçişi                                                 | Sağlayıcı yalnızca ikili düşünmeyi aç/kapat olarak sunar                                                                                     |
| 34  | `supportsXHighThinking`           | Seçili modeller için `xhigh` akıl yürütme desteği                                                             | Sağlayıcı yalnızca belirli bir model alt kümesinde `xhigh` ister                                                                             |
| 35  | `resolveDefaultThinkingLevel`     | Belirli bir model ailesi için varsayılan `/think` düzeyi                                                      | Sağlayıcı, bir model ailesi için varsayılan `/think` ilkesinin sahibidir                                                                    |
| 36  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleyicisi                                          | Sağlayıcı, canlı/smoke tercih edilen model eşleştirmesinin sahibidir                                                                        |
| 37  | `prepareRuntimeAuth`              | Yapılandırılmış bir kimlik bilgisini çıkarımdan hemen önce gerçek çalışma zamanı belirtecine/anahtarına dönüştürür | Sağlayıcının bir belirteç değişimine veya kısa ömürlü istek kimlik bilgisine ihtiyacı vardır                                               |
| 38  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözümler                       | Sağlayıcının özel kullanım/kota belirteci ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı vardır                         |
| 39  | `fetchUsageSnapshot`              | Kimlik doğrulama çözüldükten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini alır ve normalize eder | Sağlayıcının sağlayıcıya özgü bir kullanım uç noktasına veya yük ayrıştırıcısına ihtiyacı vardır                                          |
| 40  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcıya ait bir gömme bağdaştırıcısı oluşturur                                          | Bellek gömme davranışı sağlayıcı Plugin'i ile birlikte bulunmalıdır                                                                         |
| 41  | `buildReplayPolicy`               | Sağlayıcı için döküm işlemesini denetleyen bir yeniden oynatma ilkesi döndürür                                | Sağlayıcının özel döküm ilkesine ihtiyacı vardır (örneğin, düşünme bloklarını çıkarma)                                                     |
| 42  | `sanitizeReplayHistory`           | Genel döküm temizliğinden sonra yeniden oynatma geçmişini yeniden yazar                                       | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü yeniden oynatma yeniden yazımlarına ihtiyacı vardır          |
| 43  | `validateReplayTurns`             | Gömülü çalıştırıcıdan önce son yeniden oynatma turu doğrulaması veya yeniden şekillendirmesi yapar           | Sağlayıcı taşımasının genel temizlemeden sonra daha sıkı tur doğrulamasına ihtiyacı vardır                                                 |
| 44  | `onModelSelected`                 | Sağlayıcıya ait seçim sonrası yan etkileri çalıştırır                                                         | Sağlayıcının, bir model etkin olduğunda telemetriye veya sağlayıcıya ait duruma ihtiyacı vardır                                           |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin'ini denetler, ardından model kimliğini veya taşıma/yapılandırmayı gerçekten değiştiren biri bulunana kadar
kanca yeteneğine sahip diğer sağlayıcı Plugin'lerine düşer. Bu, çağıranın
hangi paketlenmiş Plugin'in yeniden yazımın sahibi olduğunu bilmesini gerektirmeden takma ad/uyumluluk
sağlayıcı şimlerinin çalışmasını sürdürür. Hiçbir sağlayıcı kancası desteklenen bir
Google ailesi yapılandırma girdisini yeniden yazmazsa, paketlenmiş Google yapılandırma normalleştiricisi yine de
bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir tel protokolüne veya özel bir istek yürütücüsüne ihtiyacı varsa,
bu farklı bir uzantı sınıfıdır. Bu kancalar, hâlâ
OpenClaw'ın normal çıkarım döngüsünde çalışan sağlayıcı davranışı içindir.

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

- Anthropic; Claude 4.6 ileriye dönük uyumluluğun, sağlayıcı ailesi ipuçlarının,
  kimlik doğrulama onarım yönlendirmesinin, kullanım uç noktası entegrasyonunun,
  istem önbelleği uygunluğunun, kimlik doğrulama farkında yapılandırma varsayılanlarının, Claude
  varsayılan/uyarlanabilir düşünme ilkesinin ve beta üst bilgileri,
  `/fast` / `serviceTier` ve `context1m` için Anthropic'e özgü akış şekillendirmenin
  sahibi olduğu için `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  ve `wrapStreamFn` kullanır.
- Anthropic'in Claude'a özgü akış yardımcıları şimdilik paketlenmiş Plugin'in kendi
  genel `api.ts` / `contract-api.ts` sınırında kalır. Bu paket yüzeyi,
  genel SDK'yı tek bir sağlayıcının beta üst bilgisi kuralları etrafında genişletmek yerine
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ve daha alt düzey
  Anthropic sarmalayıcı oluşturucularını dışa aktarır.
- OpenAI; GPT-5.4 ileriye dönük uyumluluğunun, doğrudan OpenAI
  `openai-completions` -> `openai-responses` normalizasyonunun, Codex farkında kimlik doğrulama
  ipuçlarının, Spark bastırmasının, sentetik OpenAI liste satırlarının ve GPT-5 düşünme /
  canlı model ilkesinin sahibi olduğu için `resolveDynamicModel`, `normalizeResolvedModel` ve
  `capabilities` ile birlikte `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` ve `isModernModelRef`
  kullanır; `openai-responses-defaults` akış ailesi ise atıf üst bilgileri,
  `/fast`/`serviceTier`, metin ayrıntı düzeyi, yerel Codex web arama,
  akıl yürütme uyumluluğu yük şekillendirmesi ve Responses bağlam yönetimi için
  paylaşılan yerel OpenAI Responses sarmalayıcılarının sahibidir.
- OpenRouter; sağlayıcı geçişli olduğu ve OpenClaw'ın statik kataloğu güncellenmeden önce
  yeni model kimlikleri açığa çıkarabileceği için `catalog` ile birlikte
  `resolveDynamicModel` ve `prepareDynamicModel` kullanır; ayrıca sağlayıcıya özgü
  istek üst bilgilerini, yönlendirme meta verilerini, akıl yürütme yamalarını ve
  istem önbelleği ilkesini çekirdek dışında tutmak için `capabilities`, `wrapStreamFn` ve
  `isCacheTtlEligible` de kullanır. Yeniden oynatma ilkesi
  `passthrough-gemini` ailesinden gelirken, `openrouter-thinking` akış ailesi
  vekil akıl yürütme eklemesinin ve desteklenmeyen model / `auto` atlamalarının sahibidir.
- GitHub Copilot; sağlayıcıya ait cihaz oturumu açma, model geri dönüş davranışı, Claude döküm
  tuhaflıkları, GitHub belirteci -> Copilot belirteci değişimi ve sağlayıcıya ait bir kullanım
  uç noktasına ihtiyaç duyduğu için `catalog`, `auth`, `resolveDynamicModel` ve
  `capabilities` ile birlikte `prepareRuntimeAuth` ve `fetchUsageSnapshot` kullanır.
- OpenAI Codex; hâlâ çekirdek OpenAI taşımalarında çalışmasına rağmen kendi taşıma/temel URL
  normalizasyonunun, OAuth yenileme geri dönüş ilkesinin, varsayılan taşıma seçiminin,
  sentetik Codex katalog satırlarının ve ChatGPT kullanım uç noktası entegrasyonunun sahibi olduğu için
  `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` ve `augmentModelCatalog` ile birlikte
  `prepareExtraParams`, `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır;
  doğrudan OpenAI ile aynı `openai-responses-defaults` akış ailesini paylaşır.
- Google AI Studio ve Gemini CLI OAuth; `google-gemini`
  yeniden oynatma ailesi Gemini 3.1 ileriye dönük uyumluluk geri dönüşünün,
  yerel Gemini yeniden oynatma doğrulamasının, önyükleme yeniden oynatma temizliğinin, etiketli
  akıl yürütme çıktısı kipinin ve modern model eşleştirmenin sahibi olduğu; `google-thinking`
  akış ailesi ise Gemini düşünme yükü normalizasyonunun sahibi olduğu için
  `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` ve `isModernModelRef` kullanır;
  Gemini CLI OAuth ayrıca belirteç biçimlendirme, belirteç ayrıştırma ve kota uç noktası
  bağlama için `formatApiKey`, `resolveUsageAuth` ve
  `fetchUsageSnapshot` kullanır.
- Anthropic Vertex; Claude'a özgü yeniden oynatma temizliğinin her `anthropic-messages`
  taşıması yerine Claude kimlikleriyle sınırlı kalması için
  `anthropic-by-model` yeniden oynatma ailesi üzerinden `buildReplayPolicy` kullanır.
- Amazon Bedrock; Anthropic-on-Bedrock trafiği için
  Bedrock'a özgü daraltma/hazır değil/bağlam taşması hata sınıflandırmasının sahibi olduğu için
  `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` ve `resolveDefaultThinkingLevel` kullanır;
  yeniden oynatma ilkesi hâlâ aynı yalnızca Claude `anthropic-by-model` korumasını paylaşır.
- OpenRouter, Kilocode, Opencode ve Opencode Go;
  Gemini modellerini OpenAI uyumlu taşımalar üzerinden vekil ettikleri ve
  yerel Gemini yeniden oynatma doğrulaması veya önyükleme yeniden yazımları olmadan
  Gemini düşünce imzası temizliğine ihtiyaç duydukları için
  `passthrough-gemini` yeniden oynatma ailesi üzerinden `buildReplayPolicy` kullanır.
- MiniMax; bir sağlayıcı hem Anthropic iletileri hem de OpenAI uyumlu anlambilimin
  sahibi olduğu için `hybrid-anthropic-openai` yeniden oynatma ailesi üzerinden
  `buildReplayPolicy` kullanır; Anthropic tarafında yalnızca Claude düşünme bloğu
  düşürmesini korurken akıl yürütme çıktı kipini yeniden yerel hâle getirir ve
  `minimax-fast-mode` akış ailesi paylaşılan akış yolunda hızlı kip model yeniden yazımlarının
  sahibidir.
- Moonshot; hâlâ paylaşılan OpenAI taşımasını kullanmasına rağmen sağlayıcıya ait düşünme yükü
  normalizasyonuna ihtiyaç duyduğu için `catalog` ile birlikte `wrapStreamFn` kullanır;
  `moonshot-thinking` akış ailesi yapılandırma ile `/think` durumunu
  kendi yerel ikili düşünme yüküne eşler.
- Kilocode; sağlayıcıya ait istek üst bilgilerine,
  akıl yürütme yükü normalizasyonuna, Gemini döküm ipuçlarına ve Anthropic
  önbellek TTL geçitlemesine ihtiyaç duyduğu için `catalog`, `capabilities`, `wrapStreamFn` ve
  `isCacheTtlEligible` kullanır; `kilocode-thinking` akış ailesi ise
  açık akıl yürütme yüklerini desteklemeyen `kilo/auto` ve diğer vekil model kimliklerini atlayarak
  paylaşılan vekil akış yolunda Kilo düşünme eklemesini tutar.
- Z.AI; GLM-5 geri dönüşünün,
  `tool_stream` varsayılanlarının, ikili düşünme kullanıcı deneyiminin, modern model eşleştirmenin ve hem
  kullanım kimlik doğrulaması + kota getirme işlemlerinin sahibi olduğu için `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` ve `fetchUsageSnapshot` kullanır; `tool-stream-default-on` akış ailesi ise
  varsayılan açık `tool_stream` sarmalayıcısını sağlayıcı başına el yazımı yapıştırıcıdan uzak tutar.
- xAI; yerel xAI Responses taşıma normalizasyonunun, Grok hızlı kip
  takma ad yeniden yazımlarının, varsayılan `tool_stream` değerinin, katı araç / akıl yürütme yükü
  temizliğinin, Plugin'e ait araçlar için geri dönüş kimlik doğrulama yeniden kullanımının, ileriye dönük uyumlu Grok
  model çözümlemesinin ve xAI araç şema profili,
  desteklenmeyen şema anahtar sözcükleri, yerel `web_search` ve HTML varlık
  araç çağrısı argüman çözümleme gibi sağlayıcıya ait uyumluluk yamalarının sahibi olduğu için
  `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` ve `isModernModelRef`
  kullanır.
- Mistral, OpenCode Zen ve OpenCode Go; döküm/araç tuhaflıklarını çekirdekten uzak tutmak için
  yalnızca `capabilities` kullanır.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve `volcengine` gibi
  yalnızca katalog içeren paketlenmiş sağlayıcılar sadece `catalog` kullanır.
- Qwen; metin sağlayıcısı için `catalog` ile birlikte, çok kipli yüzeyleri için
  paylaşılan medya-anlama ve video-oluşturma kayıtlarını kullanır.
- MiniMax ve Xiaomi, çıkarım hâlâ paylaşılan
  taşımalar üzerinden çalışsa bile `/usage` davranışları Plugin'e ait olduğu için
  `catalog` ile birlikte kullanım kancaları kullanır.

## Çalışma zamanı yardımcıları

Plugin'ler seçili çekirdek yardımcılarına `api.runtime` üzerinden erişebilir. TTS için:

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

- `textToSpeech`, dosya/sesli not yüzeyleri için normal çekirdek TTS çıktı yükünü döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses arabelleği + örnekleme hızı döndürür. Plugin'ler sağlayıcılar için yeniden örnekleme/kodlama yapmalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Satıcıya ait ses seçiciler veya kurulum akışları için kullanın.
- Ses listeleri, sağlayıcı farkında seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- OpenAI ve ElevenLabs bugün telefonu destekler. Microsoft desteklemez.

Plugin'ler ayrıca `api.registerSpeechProvider(...)` aracılığıyla konuşma sağlayıcıları da kaydedebilir.

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

- TTS ilkesini, geri dönüşü ve yanıt teslimini çekirdekte tutun.
- Satıcıya ait sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalize edilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu
  yetenek sözleşmelerini ekledikçe tek bir satıcı Plugin'i metin, konuşma, görüntü ve gelecekteki medya sağlayıcılarının
  sahibi olabilir.

Görüntü/ses/video anlama için, Plugin'ler genel bir anahtar/değer torbası yerine
türlendirilmiş tek bir medya-anlama sağlayıcısı kaydeder:

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

- Orkestrasyonu, geri dönüşü, yapılandırmayı ve kanal kablolamasını çekirdekte tutun.
- Satıcı davranışını sağlayıcı Plugin'inde tutun.
- Toplamalı genişleme türlendirilmiş kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı yetenekler.
- Video oluşturma zaten aynı deseni izler:
  - çekirdek yetenek sözleşmesinin ve çalışma zamanı yardımcısının sahibidir
  - satıcı Plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Plugin'leri `api.runtime.videoGeneration.*` tüketir

Medya-anlama çalışma zamanı yardımcıları için Plugin'ler şunları çağırabilir:

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

Ses deşifresi için Plugin'ler ya medya-anlama çalışma zamanını
ya da eski STT takma adını kullanabilir:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notlar:

- `api.runtime.mediaUnderstanding.*`, görüntü/ses/video anlama için
  tercih edilen paylaşılan yüzeydir.
- Çekirdek medya-anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı geri dönüş sırasını kullanır.
- Deşifre çıktısı üretilmediğinde `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk takma adı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` aracılığıyla arka plan alt aracı çalıştırmaları başlatabilir:

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

- `provider` ve `model`, kalıcı oturum değişiklikleri değil, çalışma başına geçersiz kılmalardır.
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilir çağıranlar için dikkate alır.
- Plugin'e ait geri dönüş çalıştırmaları için operatörlerin `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça izin vermesi gerekir.
- Güvenilir Plugin'leri belirli standart `provider/model` hedefleriyle sınırlandırmak için `plugins.entries.<id>.subagent.allowedModels` kullanın veya herhangi bir hedefe açıkça izin vermek için `"*"` kullanın.
- Güvenilmeyen Plugin alt aracı çalıştırmaları yine de çalışır, ancak geçersiz kılma istekleri sessizce geri dönmek yerine reddedilir.

Web arama için Plugin'ler, aracı araç kablolamasına erişmek yerine
paylaşılan çalışma zamanı yardımcısını tüketebilir:

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
`api.registerWebSearchProvider(...)` aracılığıyla web arama sağlayıcıları da kaydedebilir.

Notlar:

- Sağlayıcı seçimini, kimlik bilgisi çözümlemesini ve paylaşılan istek anlambilimini çekirdekte tutun.
- Satıcıya özgü arama taşımaları için web arama sağlayıcılarını kullanın.
- `api.runtime.webSearch.*`, arama davranışına aracı araç sarmalayıcısına bağımlı olmadan ihtiyaç duyan özellik/kanal Plugin'leri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış görüntü oluşturma sağlayıcı zincirini kullanarak bir görüntü oluşturur.
- `listProviders(...)`: kullanılabilir görüntü oluşturma sağlayıcılarını ve yeteneklerini listeler.

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

- `path`: gateway HTTP sunucusu altındaki rota yolu.
- `auth`: zorunlu. Normal gateway kimlik doğrulaması gerektirmek için `"gateway"` veya Plugin tarafından yönetilen kimlik doğrulama/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin'in mevcut kendi rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürmelidir.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- `replaceExisting: true` olmadığı sürece tam `path + match` çakışmaları reddedilir ve bir Plugin başka bir Plugin'in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip örtüşen rotalar reddedilir. `exact`/`prefix` düşüş zincirlerini yalnızca aynı kimlik doğrulama düzeyinde tutun.
- `auth: "plugin"` rotaları operatör çalışma zamanı kapsamlarını otomatik olarak **almaz**. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook/imza doğrulaması içindir.
- `auth: "gateway"` rotaları bir Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam kasıtlı olarak tutucudur:
  - paylaşılan gizli taşıyıcı kimlik doğrulaması (`gateway.auth.mode = "token"` / `"password"`) Plugin rota çalışma zamanı kapsamlarını, çağıran `x-openclaw-scopes` gönderse bile `operator.write` üzerine sabitler
  - güvenilir kimlik taşıyan HTTP kipleri (örneğin `trusted-proxy` veya özel girişte `gateway.auth.mode = "none"`) `x-openclaw-scopes` değerini yalnızca üst bilgi açıkça mevcutsa dikkate alır
  - bu kimlik taşıyan Plugin rota isteklerinde `x-openclaw-scopes` yoksa çalışma zamanı kapsamı `operator.write` değerine geri döner
- Pratik kural: Gateway kimlik doğrulamalı bir Plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanız yöneticiye özel davranış gerektiriyorsa, kimlik taşıyan bir kimlik doğrulama kipi zorunlu kılın ve açık `x-openclaw-scopes` üst bilgisi sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Plugin yazarken tek parça `openclaw/plugin-sdk` içe aktarımı yerine
SDK alt yollarını kullanın:

- Plugin kayıt ilkel öğeleri için `openclaw/plugin-sdk/plugin-entry`.
- Genel paylaşılan Plugin'e dönük sözleşme için `openclaw/plugin-sdk/core`.
- Kök `openclaw.json` Zod şeması
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
  `openclaw/plugin-sdk/webhook-ingress` gibi kararlı kanal ilkel öğeleri, paylaşılan kurulum/kimlik doğrulama/yanıt/Webhook
  kablolaması içindir. `channel-inbound`, debounce, mention eşleştirme,
  gelen mention ilkesi yardımcıları, zarf biçimlendirme ve gelen zarf
  bağlam yardımcıları için paylaşılan yuvadır.
  `channel-setup`, dar isteğe bağlı kurulum sınırıdır.
  `setup-runtime`, `setupEntry` /
  ertelenmiş başlangıç tarafından kullanılan, içe aktarma açısından güvenli kurulum yama bağdaştırıcıları dahil çalışma zamanı açısından güvenli kurulum yüzeyidir.
  `setup-adapter-runtime`, ortam farkında hesap kurulum bağdaştırıcı sınırıdır.
  `setup-tools`, küçük CLI/arşiv/belgeler yardımcısı sınırıdır (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` gibi alan alt yolları, paylaşılan çalışma zamanı/yapılandırma yardımcıları içindir.
  `telegram-command-config`, Telegram özel
  komut normalizasyonu/doğrulaması için dar genel sınırdır ve paketlenmiş
  Telegram sözleşme yüzeyi geçici olarak kullanılamaz olsa bile kullanılabilir kalır.
  `text-runtime`, yardımcı tarafından görülebilen metin temizleme,
  markdown işleme/parçalama yardımcıları, redaksiyon
  yardımcıları, directive etiketi yardımcıları ve güvenli metin yardımcıları dahil
  paylaşılan metin/markdown/günlükleme sınırıdır.
- Onaya özgü kanal sınırları, Plugin üzerinde tek bir `approvalCapability`
  sözleşmesini tercih etmelidir. Çekirdek daha sonra onay kimlik doğrulamasını, teslimini, işlemeyi,
  yerel yönlendirmeyi ve tembel yerel işleyici davranışını, onay davranışını ilgisiz Plugin alanlarına karıştırmak yerine
  bu tek yetenek üzerinden okur.
- `openclaw/plugin-sdk/channel-runtime` kullanımdan kaldırılmıştır ve yalnızca eski
  Plugin'ler için uyumluluk şimi olarak kalır. Yeni kod bunun yerine daha dar
  genel ilkel öğeleri içe aktarmalıdır ve depo kodu şim için yeni içe aktarımlar eklememelidir.
- Paketlenmiş uzantı iç bileşenleri özel kalır. Harici Plugin'ler yalnızca
  `openclaw/plugin-sdk/*` alt yollarını kullanmalıdır. OpenClaw çekirdek/test kodu,
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` ve
  `login-qr-api.js` gibi dar kapsamlı dosyalar gibi bir Plugin paket kökü altındaki depo
  genel giriş noktalarını kullanabilir. Çekirdekten veya başka bir uzantıdan
  asla bir Plugin paketinin `src/*` yolunu içe aktarmayın.
- Depo giriş noktası ayrımı:
  `<plugin-package-root>/api.js` yardımcı/tür varilidir,
  `<plugin-package-root>/runtime-api.js` yalnızca çalışma zamanı varilidir,
  `<plugin-package-root>/index.js` paketlenmiş Plugin girişidir,
  ve `<plugin-package-root>/setup-entry.js` kurulum Plugin girişidir.
- Güncel paketlenmiş sağlayıcı örnekleri:
  - Anthropic, `wrapAnthropicProviderStream`, beta üst bilgisi yardımcıları ve `service_tier`
    ayrıştırması gibi Claude akış yardımcıları için `api.js` / `contract-api.js` kullanır.
  - OpenAI, sağlayıcı oluşturucular, varsayılan model yardımcıları ve
    gerçek zamanlı sağlayıcı oluşturucular için `api.js` kullanır.
  - OpenRouter, kendi sağlayıcı oluşturucusu ile ilk katılım/yapılandırma
    yardımcıları için `api.js` kullanırken `register.runtime.js` depo içi kullanım için hâlâ genel
    `plugin-sdk/provider-stream` yardımcılarını yeniden dışa aktarabilir.
- Yüzey yüklü genel giriş noktaları, mevcutsa etkin çalışma zamanı yapılandırma anlık görüntüsünü
  tercih eder; ardından OpenClaw henüz bir çalışma zamanı anlık görüntüsü sunmuyorsa
  diskteki çözülmüş yapılandırma dosyasına geri döner.
- Genel paylaşılan ilkel öğeler tercih edilen genel SDK sözleşmesi olmaya devam eder. Paketlenmiş kanal markalı yardımcı sınırlarının küçük
  bir ayrılmış uyumluluk kümesi hâlâ vardır. Bunları yeni
  üçüncü taraf içe aktarma hedefleri olarak değil, paketlenmiş bakım/uyumluluk sınırları olarak değerlendirin; yeni kanal arası sözleşmeler yine de
  genel `plugin-sdk/*` alt yollarına veya Plugin'e yerel `api.js` /
  `runtime-api.js` varillerine gelmelidir.

Uyumluluk notu:

- Yeni kod için kök `openclaw/plugin-sdk` varilinden kaçının.
- Önce dar ve kararlı ilkel öğeleri tercih edin. Daha yeni kurulum/eşleştirme/yanıt/
  geri bildirim/sözleşme/gelen/iş parçacığı/komut/secret-input/Webhook/altyapı/
  izin listesi/durum/message-tool alt yolları, yeni
  paketlenmiş ve harici Plugin çalışmaları için amaçlanan sözleşmedir.
  Hedef ayrıştırma/eşleştirme `openclaw/plugin-sdk/channel-targets` üzerinde yer almalıdır.
  Mesaj eylemi geçitleri ve tepki mesaj-kimliği yardımcıları ise
  `openclaw/plugin-sdk/channel-actions` üzerinde yer almalıdır.
- Paketlenmiş uzantıya özgü yardımcı variller varsayılan olarak kararlı değildir. Bir
  yardımcı yalnızca paketlenmiş bir uzantı tarafından gerekiyorsa, onu
  `openclaw/plugin-sdk/<extension>` içine yükseltmek yerine uzantının yerel
  `api.js` veya `runtime-api.js` sınırının arkasında tutun.
- Yeni paylaşılan yardımcı sınırları kanal markalı değil, genel olmalıdır. Paylaşılan hedef
  ayrıştırma `openclaw/plugin-sdk/channel-targets` üzerinde yer almalıdır; kanala özgü
  iç bileşenler ise sahip olan Plugin'in yerel `api.js` veya `runtime-api.js`
  sınırının arkasında kalmalıdır.
- `image-generation`,
  `media-understanding` ve `speech` gibi yeteneğe özgü alt yollar bugün paketlenmiş/yerel Plugin'ler
  tarafından kullanıldığı için vardır. Bunların varlığı tek başına dışa aktarılan her yardımcının
  uzun vadeli olarak dondurulmuş bir harici sözleşme olduğu anlamına gelmez.

## Mesaj aracı şemaları

Plugin'ler kanala özgü `describeMessageTool(...)` şema
katkılarının sahibi olmalıdır. Sağlayıcıya özgü alanları paylaşılan çekirdekte değil, Plugin'de tutun.

Paylaşılan taşınabilir şema parçaları için,
`openclaw/plugin-sdk/channel-actions` üzerinden dışa aktarılan genel yardımcıları yeniden kullanın:

- düğme ızgarası tarzı yükler için `createMessageToolButtonsSchema()`
- yapılandırılmış kart yükleri için `createMessageToolCardSchema()`

Bir şema biçimi yalnızca tek bir sağlayıcı için anlamlıysa, onu paylaşılan SDK'ya
yükseltmek yerine o Plugin'in kendi kaynağında tanımlayın.

## Kanal hedef çözümleme

Kanal Plugin'leri kanala özgü hedef anlambiliminin sahibi olmalıdır. Paylaşılan
giden ana makineyi genel tutun ve sağlayıcı kuralları için mesajlaşma bağdaştırıcı yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalize edilmiş bir hedefin
  dizin aramasından önce `direct`, `group` veya `channel` olarak değerlendirilip değerlendirilmeyeceğine karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, bir girdinin
  dizin araması yerine doğrudan kimlik benzeri çözümlemeye geçip geçmemesi gerektiğini çekirdeğe bildirir.
- `messaging.targetResolver.resolveTarget(...)`, çekirdeğin
  normalizasyondan sonra veya dizin başarısızlığından sonra sağlayıcıya ait son bir çözümlemeye ihtiyaç duyduğunda kullandığı Plugin geri dönüş yoludur.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözüldüğünde sağlayıcıya özgü oturum
  rota oluşturmanın sahibidir.

Önerilen ayrım:

- eşler/gruplar aranmasından önce gerçekleşmesi gereken kategori kararları için `inferTargetChatType` kullanın.
- "buna açık/yerel hedef kimliği gibi davran" denetimleri için `looksLikeId` kullanın.
- geniş dizin araması için değil, sağlayıcıya özgü normalizasyon geri dönüşü için `resolveTarget` kullanın.
- sohbet kimlikleri, ileti dizisi kimlikleri, JID'ler, tutamaçlar ve oda
  kimlikleri gibi sağlayıcıya özgü yerel kimlikleri genel SDK alanlarında değil,
  `target` değerlerinin veya sağlayıcıya özgü parametrelerin içinde tutun.

## Yapılandırma destekli dizinler

Dizin girdilerini yapılandırmadan türeten Plugin'ler bu mantığı
Plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu, bir kanalın aşağıdakiler gibi yapılandırma destekli eşlere/gruplara ihtiyaç duyduğu durumlarda kullanın:

- izin listesi odaklı DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesap kapsamlı statik dizin geri dönüşleri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- sınır uygulama
- tekrarları kaldırma/normalizasyon yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalizasyonu Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin'leri,
`registerProvider({ catalog: { run(...) { ... } } })` ile çıkarım için model katalogları tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın
`models.providers` içine yazdığı aynı biçimi döndürür:

- tek bir sağlayıcı girdisi için `{ provider }`
- birden fazla sağlayıcı girdisi için `{ providers }`

Plugin sağlayıcıya özgü model kimliklerinin, temel URL
varsayılanlarının veya kimlik doğrulama geçitli model meta verilerinin sahibi olduğunda `catalog` kullanın.

`catalog.order`, bir Plugin'in kataloğunun OpenClaw'ın
yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarı veya ortam odaklı sağlayıcılar
- `profile`: kimlik doğrulama profilleri var olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Daha sonraki sağlayıcılar anahtar çakışmalarında kazanır; böylece Plugin'ler aynı sağlayıcı kimliğine sahip
yerleşik bir sağlayıcı girdisini bilinçli olarak geçersiz kılabilir.

Uyumluluk:

- `discovery`, eski bir takma ad olarak hâlâ çalışır
- hem `catalog` hem de `discovery` kaydedilmişse, OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin'iniz bir kanal kaydediyorsa, `resolveAccount(...)` yanında
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin
  tamamen somutlaştırıldığını varsayabilir ve gerekli sırlar eksik olduğunda hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yolları, yapılandırmayı açıklamak için yalnızca
  çalışma zamanı kimlik bilgilerini somutlaştırmak zorunda kalmamalıdır.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- İlgili olduğunda aşağıdakiler gibi kimlik bilgisi kaynağı/durumu alanlarını ekleyin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği raporlamak için ham belirteç değerlerini döndürmeniz gerekmez.
  `tokenStatus: "available"` (ve eşleşen kaynak
  alanı) döndürmek, durum tarzı komutlar için yeterlidir.
- Bir kimlik bilgisi SecretRef aracılığıyla yapılandırılmış ancak
  geçerli komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların çökmeden veya hesabı yanlış biçimde yapılandırılmamış olarak raporlamadan
"bu komut yolunda yapılandırılmış ama kullanılamıyor" bilgisini vermesini sağlar.

## Paket paketleri

Bir Plugin dizini, `openclaw.extensions` içeren bir `package.json` barındırabilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her girdi bir Plugin olur. Paket birden fazla uzantı listeliyorsa, Plugin kimliği
`name/<fileBase>` olur.

Plugin'iniz npm bağımlılıkları içe aktarıyorsa, `node_modules`
mevcut olsun diye bunları o dizinde kurun (`npm install` / `pnpm install`).

Güvenlik korkuluğu: her `openclaw.extensions` girdisi, sembolik bağ çözümlemesinden sonra Plugin
dizininin içinde kalmalıdır. Paket dizininden kaçan girdiler
reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını
`npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yok, çalışma zamanında geliştirme bağımlılığı yok). Plugin bağımlılık
ağaçlarını "saf JS/TS" olarak tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülünü işaret edebilir.
OpenClaw, devre dışı bir kanal Plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya
bir kanal Plugin'i etkin ama hâlâ yapılandırılmamış olduğunda, tam Plugin girdisi yerine
`setupEntry` yükler. Bu, ana Plugin girdiniz araçlar, kancalar veya diğer yalnızca çalışma zamanı
kodlarını da bağlıyorsa başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
bir kanal Plugin'ini gateway'in
dinleme öncesi başlangıç aşamasında, kanal zaten yapılandırılmış olsa bile, aynı `setupEntry` yoluna dahil edebilir.

Bunu yalnızca `setupEntry`, gateway dinlemeye başlamadan
önce var olması gereken başlangıç yüzeyini tamamen kapsıyorsa kullanın. Pratikte bu, kurulum girdisinin
başlangıcın bağlı olduğu kanala ait her yeteneği kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- gateway dinlemeye başlamadan önce kullanılabilir olması gereken tüm HTTP rotaları
- aynı pencere sırasında var olması gereken tüm gateway yöntemleri, araçlar veya hizmetler

Tam girdiniz hâlâ gerekli bir başlangıç yeteneğinin sahibiyse bu bayrağı etkinleştirmeyin.
Plugin'i varsayılan davranışta bırakın ve OpenClaw'ın başlangıç sırasında
tam girdiyi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca, çekirdeğin tam kanal çalışma zamanı yüklenmeden önce
danışabileceği yalnızca kurulum sözleşme yüzeyi yardımcıları da yayımlayabilir. Güncel kurulum
yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek bu yüzeyi, tam Plugin girdisini yüklemeden eski bir tek hesaplı kanal
yapılandırmasını `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde kullanır.
Matrix güncel paketlenmiş örnektir: adlandırılmış hesaplar zaten varsa yalnızca auth/bootstrap anahtarlarını
adlandırılmış bir yükseltilmiş hesaba taşır ve her zaman
`accounts.default` oluşturmaktansa yapılandırılmış standart dışı bir varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama bağdaştırıcıları, paketlenmiş sözleşme yüzeyi keşfini tembel tutar. İçe aktarma
zamanı hafif kalır; yükseltme yüzeyi modül içe aktarmada yeniden paketlenmiş kanal başlangıcına girmek yerine
yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri gateway RPC yöntemleri içerdiğinde, bunları
Plugin'e özgü bir önek üzerinde tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve her zaman
Plugin daha dar bir kapsam istese bile `operator.admin` değerine çözülür.

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

Kanal Plugin'leri `openclaw.channel` aracılığıyla kurulum/keşif meta verileri ve
`openclaw.install` aracılığıyla kurulum ipuçları sunabilir. Bu, çekirdek katalog verilerini veri içermeyen durumda tutar.

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

Asgari örneğin ötesindeki kullanışlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: belgeler bağlantısı için bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin geride bırakması gereken daha düşük öncelikli Plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi kopya denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown yetenekli olarak işaretler
- `exposure.configured`: `false` olarak ayarlandığında kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olarak ayarlandığında kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: belge gezinme yüzeyleri için kanalı dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: eski takma adlar uyumluluk için hâlâ kabul edilir; `exposure` tercih edilir
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına dahil eder
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlaması gerektirir
- `preferSessionLookupForAnnounceTarget`: duyuru hedefleri çözülürken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da (örneğin bir MPM
kayıt dışa aktarımı) birleştirebilir. Şu konumlardan birine bir JSON dosyası bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değişkenini
bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış).
Her dosya şu biçimi içermelidir: `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` anahtarlarını da kabul eder.

## Bağlam motoru Plugin'leri

Bağlam motoru Plugin'leri, alma, birleştirme
ve Compaction için oturum bağlamı orkestrasyonunun sahibidir. Bunları Plugin'inizden
`api.registerContextEngine(id, factory)` ile kaydedin, ardından etkin motoru
`plugins.slots.contextEngine` ile seçin.

Bunu, Plugin'inizin yalnızca bellek araması veya kancalar eklemek yerine varsayılan bağlam
ardışık düzenini değiştirmesi ya da genişletmesi gerektiğinde kullanın.

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
uygulamasını koruyun ve açıkça ona devredin:

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

Bir Plugin mevcut API'ye uymayan bir davranışa ihtiyaç duyduğunda,
özel bir iç erişimle Plugin sistemini baypas etmeyin. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin hangi paylaşılan davranışın sahibi olması gerektiğine karar verin: ilke, geri dönüş, yapılandırma birleştirme,
   yaşam döngüsü, kanala dönük anlambilim ve çalışma zamanı yardımcısı biçimi.
2. türlendirilmiş Plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` yüzeyini kullanılabilir en küçük
   türlendirilmiş yetenek yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik Plugin'leri yeni yeteneği, doğrudan bir satıcı uygulamasını içe aktararak değil,
   çekirdek üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Satıcı Plugin'leri daha sonra arka uçlarını bu yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt biçiminin zaman içinde açık kalması için testler ekleyin.

OpenClaw bu şekilde belirgin bir görüşe sahip olurken tek bir
sağlayıcının dünya görüşüne sabit kodlanmış hâle gelmez. Somut bir dosya denetim listesi ve uygulanmış örnek için [Capability Cookbook](/tr/plugins/architecture)
bölümüne bakın.

### Yetenek denetim listesi

Yeni bir yetenek eklediğinizde, uygulama genellikle şu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme türleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki Plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki Plugin kayıt sistemi bağlantısı
- özellik/kanal
  Plugin'lerinin bunu tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki Plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/Plugin belgeleri

Bu yüzeylerden biri eksikse, bu genellikle yeteneğin
henüz tam olarak entegre edilmediğinin işaretidir.

### Yetenek şablonu

Asgari desen:

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

- çekirdek, yetenek sözleşmesinin + orkestrasyonun sahibidir
- satıcı Plugin'leri satıcı uygulamalarının sahibidir
- özellik/kanal Plugin'leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar
