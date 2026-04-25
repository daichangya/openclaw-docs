---
read_when:
    - Yerel OpenClaw plugin'leri oluşturma veya hata ayıklama
    - Plugin yetenek modelini veya sahiplik sınırlarını anlama
    - Plugin yükleme hattı veya registry üzerinde çalışma
    - Sağlayıcı çalışma zamanı hook'larını veya kanal plugin'lerini uygulama
sidebarTitle: Internals
summary: 'Plugin iç yapıları: yetenek modeli, sahiplik, sözleşmeler, yükleme hattı ve çalışma zamanı yardımcıları'
title: Plugin iç yapıları
x-i18n:
    generated_at: "2026-04-25T13:51:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

Bu, OpenClaw plugin sistemi için **derin mimari başvurusu**dur. Pratik kılavuzlar için aşağıdaki odaklı sayfalardan biriyle başlayın.

<CardGroup cols={2}>
  <Card title="Plugin'leri kur ve kullan" icon="plug" href="/tr/tools/plugin">
    Plugin ekleme, etkinleştirme ve sorun giderme için son kullanıcı kılavuzu.
  </Card>
  <Card title="Plugin oluşturma" icon="rocket" href="/tr/plugins/building-plugins">
    En küçük çalışan manifest ile ilk plugin eğitimi.
  </Card>
  <Card title="Kanal plugin'leri" icon="comments" href="/tr/plugins/sdk-channel-plugins">
    Bir mesajlaşma kanal plugin'i oluşturun.
  </Card>
  <Card title="Sağlayıcı plugin'leri" icon="microchip" href="/tr/plugins/sdk-provider-plugins">
    Bir model sağlayıcı plugin'i oluşturun.
  </Card>
  <Card title="SDK genel bakışı" icon="book" href="/tr/plugins/sdk-overview">
    Import map ve kayıt API başvurusu.
  </Card>
</CardGroup>

## Genel yetenek modeli

Yetenekler, OpenClaw içindeki kamusal **yerel plugin** modelidir. Her
yerel OpenClaw plugin'i bir veya daha fazla yetenek türüne kaydolur:

| Yetenek                | Kayıt yöntemi                                   | Örnek plugin'ler                     |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Metin çıkarımı         | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| CLI çıkarım backend'i  | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Konuşma                | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Gerçek zamanlı transcription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Gerçek zamanlı ses     | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Medya anlama           | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Görsel üretimi         | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Müzik üretimi          | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Video üretimi          | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Web getirme            | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Web araması            | `api.registerWebSearchProvider(...)`            | `google`                             |
| Kanal / mesajlaşma     | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |
| Gateway keşfi          | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                            |

Sıfır yetenek kaydeden ama hook, araç, keşif hizmeti veya arka plan
hizmetleri sağlayan plugin, **eski tarz yalnızca hook** plugin'idir. Bu desen
hâlâ tamamen desteklenmektedir.

### Harici uyumluluk duruşu

Yetenek modeli çekirdeğe yerleşmiştir ve bugün paketlenmiş/yerel plugin'ler
tarafından kullanılmaktadır, ancak harici plugin uyumluluğu için hâlâ
"aktarılıyor, öyleyse donmuştur" yaklaşımından daha sıkı bir çıta gerekir.

| Plugin durumu                                     | Kılavuz                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mevcut harici plugin'ler                          | Hook tabanlı entegrasyonları çalışır durumda tutun; uyumluluk tabanı budur.                     |
| Yeni paketlenmiş/yerel plugin'ler                 | Satıcıya özel derin erişimler veya yeni yalnızca hook tasarımları yerine açık yetenek kaydını tercih edin. |
| Yetenek kaydını benimseyen harici plugin'ler      | İzin verilir, ancak belgeler bunları kararlı işaretlemedikçe yeteneğe özgü yardımcı yüzeyleri gelişen kabul edin. |

Yetenek kaydı hedeflenen yönelimdir. Geçiş sırasında eski hook'lar, harici plugin'ler için
hâlâ en güvenli, bozulmasız yoldur. Aktarılan yardımcı alt yolların hepsi eşit değildir —
tesadüfi yardımcı aktarımlar yerine dar belgelenmiş sözleşmeleri tercih edin.

### Plugin biçimleri

OpenClaw, yüklenen her plugin'i gerçek kayıt davranışına göre bir biçime ayırır
(yalnızca statik meta veriye göre değil):

- **plain-capability**: tam olarak bir yetenek türü kaydeder (örneğin
  `mistral` gibi yalnızca sağlayıcı plugin'i).
- **hybrid-capability**: birden fazla yetenek türü kaydeder (örneğin
  `openai`, metin çıkarımı, konuşma, medya anlama ve görsel üretimini sahiplenir).
- **hook-only**: yalnızca hook kaydeder; yetenek,
  araç, komut veya hizmet kaydetmez.
- **non-capability**: araç, komut, hizmet veya yol kaydeder ama
  yetenek kaydetmez.

Bir plugin'in biçimini ve yetenek dökümünü görmek için `openclaw plugins inspect <id>` kullanın.
Ayrıntılar için bkz. [CLI reference](/tr/cli/plugins#inspect).

### Eski hook'lar

`before_agent_start` hook'u, yalnızca hook kullanan plugin'ler için uyumluluk yolu olarak desteklenmeye devam eder. Eski gerçek dünya plugin'leri hâlâ buna bağımlıdır.

Yönelim:

- çalışır durumda tutun
- eski olarak belgeleyin
- model/sağlayıcı geçersiz kılma işleri için `before_model_resolve` tercih edin
- istem mutasyonu işleri için `before_prompt_build` tercih edin
- ancak gerçek kullanım düştüğünde ve fixture kapsamı geçiş güvenliğini kanıtladığında kaldırın

### Uyumluluk sinyalleri

`openclaw doctor` veya `openclaw plugins inspect <id>` çalıştırdığınızda
şu etiketlerden birini görebilirsiniz:

| Sinyal                     | Anlamı                                                     |
| -------------------------- | ---------------------------------------------------------- |
| **config valid**           | Yapılandırma düzgün ayrıştırılıyor ve plugin'ler çözümleniyor |
| **compatibility advisory** | Plugin desteklenen ama daha eski bir desen kullanıyor (ör. `hook-only`) |
| **legacy warning**         | Plugin, kullanımdan kaldırılmış `before_agent_start` kullanıyor |
| **hard error**             | Yapılandırma geçersiz veya plugin yüklenemedi              |

Ne `hook-only` ne de `before_agent_start` bugün plugin'inizi bozmaz:
`hook-only` yalnızca tavsiye niteliğindedir ve `before_agent_start` yalnızca bir uyarı üretir. Bu
sinyaller ayrıca `openclaw status --all` ve `openclaw plugins doctor` içinde de görünür.

## Mimari genel bakış

OpenClaw'ın plugin sistemi dört katmandan oluşur:

1. **Manifest + keşif**
   OpenClaw, yapılandırılmış yollardan, çalışma alanı köklerinden,
   genel plugin köklerinden ve paketlenmiş plugin'lerden aday plugin'leri bulur. Keşif önce yerel
   `openclaw.plugin.json` manifest dosyalarını ve desteklenen paket manifest'lerini okur.
2. **Etkinleştirme + doğrulama**
   Çekirdek, keşfedilen bir plugin'in etkin, devre dışı, engellenmiş veya
   bellek gibi münhasır bir yuva için seçilmiş olup olmadığına karar verir.
3. **Çalışma zamanı yükleme**
   Yerel OpenClaw plugin'leri jiti aracılığıyla süreç içinde yüklenir ve
   yetenekleri merkezi bir registry içine kaydeder. Uyumlu paketler, çalışma zamanı kodu içe aktarılmadan
   registry kayıtlarına normalize edilir.
4. **Yüzey tüketimi**
   OpenClaw'ın geri kalanı, araçları, kanalları, sağlayıcı
   kurulumunu, hook'ları, HTTP yollarını, CLI komutlarını ve hizmetleri ortaya çıkarmak için registry'yi okur.

Özellikle plugin CLI için, kök komut keşfi iki aşamaya ayrılır:

- ayrıştırma zamanı meta verisi `registerCli(..., { descriptors: [...] })` üzerinden gelir
- gerçek plugin CLI modülü tembel kalabilir ve ilk çağrıda kaydolabilir

Bu, plugin'e ait CLI kodunu plugin içinde tutarken yine de OpenClaw'ın
ayrıştırmadan önce kök komut adlarını ayırmasına olanak tanır.

Önemli tasarım sınırı:

- manifest/yapılandırma doğrulaması, plugin kodu çalıştırılmadan
  **manifest/şema meta verisinden** çalışabilmelidir
- yerel yetenek keşfi, etkinleştirmeyen bir registry anlık görüntüsü oluşturmak için güvenilir plugin giriş kodunu yükleyebilir
- yerel çalışma zamanı davranışı, `api.registrationMode === "full"` ile plugin modülünün
  `register(api)` yolundan gelir

Bu ayrım, OpenClaw'ın tam çalışma zamanı etkinleşmeden önce yapılandırmayı doğrulamasına,
eksik/devre dışı plugin'leri açıklamasına ve UI/şema ipuçları oluşturmasına olanak tanır.

### Etkinleştirme planlaması

Etkinleştirme planlaması kontrol düzleminin bir parçasıdır. Çağıranlar, daha geniş çalışma zamanı registry'lerini yüklemeden önce somut bir komut, sağlayıcı, kanal, yol, agent harness veya yetenek için hangi plugin'lerin ilgili olduğunu sorabilir.

Planlayıcı, mevcut manifest davranışını uyumlu tutar:

- `activation.*` alanları açık planlayıcı ipuçlarıdır
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` ve hook'lar, manifest sahipliği geri dönüşü olarak kalır
- yalnızca kimliklerden oluşan planlayıcı API'si mevcut çağıranlar için kullanılabilir kalır
- plan API'si neden etiketleri bildirir; böylece tanılama açık
  ipuçlarını sahiplik geri dönüşünden ayırt edebilir

`activation` alanını yaşam döngüsü hook'u veya `register(...)` yerine geçen bir şey olarak değerlendirmeyin. Bu, yüklemeyi daraltmak için kullanılan meta veridir. İlişkiyi zaten açıklayan sahiplik alanları varsa onları tercih edin; `activation`'ı yalnızca ek planlayıcı ipuçları için kullanın.

### Kanal plugin'leri ve paylaşılan message aracı

Kanal plugin'lerinin normal sohbet işlemleri için ayrı bir gönder/düzenle/tepki aracı kaydetmesi gerekmez. OpenClaw, çekirdekte tek bir paylaşılan `message` aracı tutar ve kanal plugin'leri bunun arkasındaki kanala özgü keşif ile yürütmeyi sahiplenir.

Geçerli sınır şudur:

- çekirdek, paylaşılan `message` araç barındırıcısını, istem bağlantısını, oturum/iş parçacığı kayıt tutumunu ve yürütme dağıtımını sahiplenir
- kanal plugin'leri kapsamlı eylem keşfini, yetenek keşfini ve kanala özgü şema parçalarını sahiplenir
- kanal plugin'leri, konuşma kimliklerinin iş parçacığı kimliklerini nasıl kodladığı veya üst konuşmalardan nasıl miras aldığı gibi sağlayıcıya özgü oturum konuşma gramerini sahiplenir
- kanal plugin'leri son eylemi kendi eylem bağdaştırıcıları üzerinden yürütür

Kanal plugin'leri için SDK yüzeyi
`ChannelMessageActionAdapter.describeMessageTool(...)` şeklindedir. Bu birleşik keşif çağrısı, bir plugin'in görünür eylemlerini, yeteneklerini ve şema katkılarını birlikte döndürmesine olanak tanır; böylece bu parçalar birbirinden kopmaz.

Kanala özgü bir message-tool parametresi yerel yol veya uzak medya URL'si gibi bir medya kaynağı taşıdığında, plugin ayrıca
`describeMessageTool(...)` içinden `mediaSourceParams` döndürmelidir. Çekirdek bu açık
listeyi kullanarak, plugin'e ait parametre adlarını sabit kodlamadan sandbox yol normalizasyonu ve giden medya erişim ipuçları uygular.
Orada kanal genelinde tek düz liste değil, eylem kapsamlı eşlemeleri tercih edin; böylece yalnızca profile ait bir medya parametresi `send` gibi ilgisiz eylemlerde normalize edilmez.

Çekirdek, çalışma zamanı kapsamını bu keşif adımına iletir. Önemli alanlar şunlardır:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- güvenilir gelen `requesterSenderId`

Bu, bağlama duyarlı plugin'ler için önemlidir. Bir kanal, çekirdekte kanala özgü dallanmaları sabit kodlamadan, etkin hesaba, geçerli odaya/iş parçacığına/mesaja veya güvenilir istekçi kimliğine göre message eylemlerini gizleyebilir ya da görünür kılabilir.

Bu nedenle embedded-runner yönlendirme değişiklikleri hâlâ plugin işidir: runner,
paylaşılan `message` aracının geçerli tur için doğru kanala ait yüzeyi açığa çıkarması için
geçerli sohbet/oturum kimliğini plugin keşif sınırına iletmekten sorumludur.

Kanala ait yürütme yardımcıları için paketlenmiş plugin'ler yürütme
çalışma zamanını kendi uzantı modülleri içinde tutmalıdır. Çekirdek artık Discord,
Slack, Telegram veya WhatsApp mesaj-eylem çalışma zamanlarını `src/agents/tools` altında sahiplenmez.
Ayrı `plugin-sdk/*-action-runtime` alt yolları yayımlamıyoruz ve paketlenmiş
plugin'ler kendi yerel çalışma zamanı kodlarını doğrudan kendi uzantı modüllerinden içe aktarmalıdır.

Aynı sınır genel olarak sağlayıcı adlı SDK yüzeyleri için de geçerlidir: çekirdek, Slack, Discord, Signal,
WhatsApp veya benzeri uzantılar için kanala özgü kolaylık barrel'larını içe aktarmamalıdır.
Çekirdeğin bir davranışa ihtiyacı varsa, ya paketlenmiş plugin'in kendi `api.ts` / `runtime-api.ts` barrel'ını tüketin ya da ihtiyacı paylaşılan SDK içinde dar ve genel bir yeteneğe yükseltin.

Özellikle anketler için iki yürütme yolu vardır:

- `outbound.sendPoll`, ortak anket modeline uyan kanallar için paylaşılan temel yoldur
- `actions.handleAction("poll")`, kanala özgü anket semantiği veya ek anket parametreleri için tercih edilen yoldur

Çekirdek artık paylaşılan anket ayrıştırmasını, plugin anket dağıtımı eylemi reddettikten sonraya erteler; böylece plugin’e ait anket işleyicileri, genel anket ayrıştırıcısı tarafından önce engellenmeden kanala özgü anket alanlarını kabul edebilir.

Tam başlangıç sırası için bkz. [Plugin architecture internals](/tr/plugins/architecture-internals).

## Yetenek sahiplik modeli

OpenClaw, yerel bir plugin’i alakasız entegrasyonların karışımı olarak değil,
bir **şirketin** veya bir **özelliğin** sahiplik sınırı olarak ele alır.

Bu şu anlama gelir:

- bir şirket plugin’i genellikle o şirketin OpenClaw’a dönük tüm yüzeylerini sahiplenmelidir
- bir özellik plugin’i genellikle getirdiği tam özellik yüzeyini sahiplenmelidir
- kanallar, sağlayıcı davranışını geçici olarak yeniden uygulamak yerine paylaşılan çekirdek yetenekleri tüketmelidir

<Accordion title="Paketlenmiş plugin'ler arasında örnek sahiplik desenleri">
  - **Satıcı çoklu yetenek**: `openai`; metin çıkarımı, konuşma, gerçek zamanlı
    ses, medya anlama ve görsel üretimini sahiplenir. `google`; metin
    çıkarımı ile birlikte medya anlama, görsel üretimi ve web aramasını sahiplenir.
    `qwen`; metin çıkarımı ile birlikte medya anlama ve video üretimini sahiplenir.
  - **Satıcı tek yetenek**: `elevenlabs` ve `microsoft` konuşmayı;
    `firecrawl` web getirmeyi; `minimax` / `mistral` / `moonshot` / `zai`
    medya anlama backend'lerini sahiplenir.
  - **Özellik plugin’i**: `voice-call`; çağrı taşıması, araçlar, CLI, yollar
    ve Twilio medya akışı köprülemesini sahiplenir, ancak doğrudan satıcı
    plugin'lerini içe aktarmak yerine paylaşılan konuşma, gerçek zamanlı
    transcription ve gerçek zamanlı ses yeteneklerini tüketir.
</Accordion>

Amaçlanan son durum şudur:

- OpenAI; metin modelleri, konuşma, görseller ve gelecekte video dahil olsa bile tek bir plugin içinde yaşar
- başka bir satıcı da kendi yüzey alanı için aynı şeyi yapabilir
- kanallar, sağlayıcının hangi satıcı plugin'ine ait olduğunu umursamaz; çekirdeğin açığa çıkardığı paylaşılan yetenek sözleşmesini tüketirler

Temel ayrım şudur:

- **plugin** = sahiplik sınırı
- **yetenek** = birden çok plugin'in uygulayabildiği veya tüketebildiği çekirdek sözleşme

Dolayısıyla OpenClaw video gibi yeni bir alan eklerse ilk soru
"hangi sağlayıcı video işlemeyi sabit kodlayacak?" değildir. İlk soru,
"çekirdekteki video yetenek sözleşmesi nedir?" olmalıdır. Bu sözleşme mevcut olduğunda,
satıcı plugin'leri buna kaydolabilir ve kanal/özellik plugin'leri de bunu tüketebilir.

Yetenek henüz yoksa doğru hareket genellikle şudur:

1. eksik yeteneği çekirdekte tanımla
2. bunu typed biçimde plugin API/çalışma zamanı üzerinden açığa çıkar
3. kanalları/özellikleri bu yeteneğe bağla
4. satıcı plugin'lerinin uygulamaları kaydetmesine izin ver

Bu, sahipliği açık tutarken tek bir satıcıya veya tek seferlik
plugin'e özgü bir kod yoluna bağlı çekirdek davranıştan kaçınır.

### Yetenek katmanlaması

Kodun nereye ait olduğuna karar verirken şu zihinsel modeli kullanın:

- **çekirdek yetenek katmanı**: paylaşılan orkestrasyon, politika, geri dönüş, config
  birleştirme kuralları, teslim semantiği ve typed sözleşmeler
- **satıcı plugin katmanı**: satıcıya özgü API'ler, auth, model katalogları, konuşma
  sentezi, görsel üretimi, gelecekteki video backend'leri, kullanım uç noktaları
- **kanal/özellik plugin katmanı**: çekirdek yetenekleri tüketen ve bunları
  bir yüzeyde sunan Slack/Discord/voice-call vb. entegrasyonlar

Örneğin TTS şu biçimi izler:

- çekirdek, yanıt zamanı TTS politikasını, geri dönüş sırasını, tercihleri ve kanal teslimini sahiplenir
- `openai`, `elevenlabs` ve `microsoft` sentez uygulamalarını sahiplenir
- `voice-call`, telefon TTS çalışma zamanı yardımcısını tüketir

Gelecekteki yetenekler için de aynı desen tercih edilmelidir.

### Çoklu yetenekli şirket plugin’i örneği

Bir şirket plugin’i dışarıdan bakıldığında tutarlı hissettirmelidir. OpenClaw;
modeller, konuşma, gerçek zamanlı transcription, gerçek zamanlı ses, medya anlama, görsel üretimi, video üretimi, web getirme ve web araması için paylaşılan sözleşmelere sahipse,
bir satıcı tüm yüzeylerini tek bir yerde sahiplenebilir:

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

Önemli olan tam yardımcı adları değildir. Önemli olan biçimdir:

- tek bir plugin satıcı yüzeyini sahiplenir
- çekirdek yine de yetenek sözleşmelerini sahiplenir
- kanallar ve özellik plugin'leri satıcı kodunu değil, `api.runtime.*` yardımcılarını tüketir
- sözleşme testleri, plugin'in sahip olduğunu iddia ettiği yetenekleri kaydettiğini doğrulayabilir

### Yetenek örneği: video anlama

OpenClaw zaten görsel/ses/video anlamayı tek bir paylaşılan
yetenek olarak ele alır. Aynı sahiplik modeli burada da geçerlidir:

1. çekirdek medya anlama sözleşmesini tanımlar
2. satıcı plugin'leri uygun olduğunda `describeImage`, `transcribeAudio` ve
   `describeVideo` kaydeder
3. kanal ve özellik plugin'leri satıcı koduna doğrudan bağlanmak yerine paylaşılan çekirdek davranışı tüketir

Bu, tek bir sağlayıcının video varsayımlarının çekirdeğe işlenmesini önler. Satıcı yüzeyini plugin sahiplenir; yetenek sözleşmesini ve geri dönüş davranışını çekirdek sahiplenir.

Video üretimi de zaten aynı diziyi kullanır: çekirdek typed
yetenek sözleşmesini ve çalışma zamanı yardımcısını sahiplenir, satıcı plugin'leri de buna karşı
`api.registerVideoGenerationProvider(...)` uygulamaları kaydeder.

Somut bir devreye alma kontrol listesine mi ihtiyacınız var? Bkz.
[Capability Cookbook](/tr/plugins/architecture).

## Sözleşmeler ve yaptırım

Plugin API yüzeyi, kasıtlı olarak typed ve
`OpenClawPluginApi` içinde merkezileştirilmiştir. Bu sözleşme, desteklenen kayıt noktalarını ve
bir plugin'in güvenebileceği çalışma zamanı yardımcılarını tanımlar.

Bunun önemi:

- plugin yazarları tek bir kararlı iç standart elde eder
- çekirdek, aynı sağlayıcı kimliğini kaydeden iki plugin gibi yinelenen sahipliği reddedebilir
- başlangıç, hatalı kayıtlar için uygulanabilir tanılama gösterebilir
- sözleşme testleri paketlenmiş plugin sahipliğini zorlayabilir ve sessiz sapmayı önleyebilir

İki yaptırım katmanı vardır:

1. **çalışma zamanı kayıt yaptırımı**
   Plugin registry, plugin'ler yüklenirken kayıtları doğrular. Örnekler:
   yinelenen sağlayıcı kimlikleri, yinelenen konuşma sağlayıcı kimlikleri ve hatalı
   kayıtlar, tanımsız davranış yerine plugin tanılaması üretir.
2. **sözleşme testleri**
   Paketlenmiş plugin'ler test çalışmaları sırasında sözleşme registry'lerinde yakalanır; böylece
   OpenClaw sahipliği açıkça doğrulayabilir. Bugün bu, model
   sağlayıcıları, konuşma sağlayıcıları, web arama sağlayıcıları ve paketlenmiş kayıt
   sahipliği için kullanılır.

Pratik sonuç, OpenClaw'ın daha en baştan hangi plugin'in hangi
yüzeye sahip olduğunu bilmesidir. Bu, çekirdek ve kanalların sorunsuz biçimde birleşmesini sağlar; çünkü
sahiplik örtük değil, bildirilmiş, typed ve test edilebilir durumdadır.

### Bir sözleşmede ne olmalı

İyi plugin sözleşmeleri şunlardır:

- typed
- küçük
- yeteneğe özgü
- çekirdeğe ait
- birden çok plugin tarafından yeniden kullanılabilir
- satıcı bilgisi olmadan kanallar/özellikler tarafından tüketilebilir

Kötü plugin sözleşmeleri şunlardır:

- çekirdekte gizlenmiş satıcıya özgü politika
- registry'yi atlayan tek seferlik plugin kaçış kapıları
- doğrudan satıcı uygulamasına ulaşan kanal kodu
- `OpenClawPluginApi` veya
  `api.runtime` parçası olmayan geçici çalışma zamanı nesneleri

Şüphe duyduğunuzda soyutlama seviyesini yükseltin: önce yeteneği tanımlayın, sonra
plugin'lerin ona bağlanmasına izin verin.

## Yürütme modeli

Yerel OpenClaw plugin'leri, Gateway ile **aynı süreç içinde** çalışır. Sandbox
içinde değillerdir. Yüklenen bir yerel plugin, çekirdek kodla aynı süreç düzeyi güven sınırına sahiptir.

Sonuçları:

- bir yerel plugin araçlar, ağ işleyicileri, hook'lar ve hizmetler kaydedebilir
- bir yerel plugin hatası Gateway'i çökertebilir veya kararsızlaştırabilir
- kötü niyetli bir yerel plugin, OpenClaw süreci içinde keyfi kod yürütmeye denktir

Uyumlu paketler varsayılan olarak daha güvenlidir; çünkü OpenClaw bunları şu anda
meta veri/içerik paketleri olarak ele alır. Mevcut sürümlerde bu çoğunlukla paketlenmiş
Skills anlamına gelir.

Paketlenmemiş plugin'ler için izin listeleri ve açık kurulum/yükleme yolları kullanın. Çalışma alanı plugin'lerini
üretim varsayılanları değil, geliştirme zamanı kodu olarak değerlendirin.

Paketlenmiş çalışma alanı paket adları için plugin kimliğini npm
adına bağlı tutun: varsayılan olarak `@openclaw/<id>` veya paket
kasıtlı olarak daha dar bir plugin rolü sunuyorsa `-provider`, `-plugin`, `-speech`, `-sandbox` ya da `-media-understanding`
gibi onaylı typed son ekler kullanın.

Önemli güven notu:

- `plugins.allow`, **kaynak kökenine** değil **plugin kimliklerine** güvenir.
- Paketlenmiş bir plugin ile aynı kimliğe sahip çalışma alanı plugin'i,
  etkinleştirildiğinde/izin listesine alındığında paketlenmiş kopyayı kasıtlı olarak gölgeler.
- Bu normaldir ve yerel geliştirme, yama testi ve acil düzeltmeler için faydalıdır.
- Paketlenmiş plugin güveni, kurulum meta verisinden değil, kaynak anlık görüntüsünden —
  yani yükleme zamanında disk üzerindeki manifest ve koddan — çözülür. Bozulmuş
  veya değiştirilmiş bir kurulum kaydı, gerçek kaynağın iddia ettiğinin ötesinde
  paketlenmiş bir plugin'in güven yüzeyini sessizce genişletemez.

## Dışa aktarma sınırı

OpenClaw, uygulama kolaylıklarını değil, yetenekleri dışa aktarır.

Yetenek kaydını kamusal tutun. Sözleşme dışı yardımcı aktarımları azaltın:

- paketlenmiş plugin'e özgü yardımcı alt yollar
- kamusal API olarak amaçlanmamış çalışma zamanı altyapı alt yolları
- satıcıya özgü kolaylık yardımcıları
- uygulama ayrıntısı olan kurulum/onboarding yardımcıları

Bazı paketlenmiş plugin yardımcı alt yolları, uyumluluk ve paketlenmiş plugin bakımı için oluşturulmuş SDK dışa aktarma eşleminde hâlâ yer almaktadır. Güncel örnekler arasında
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` ve birkaç `plugin-sdk/matrix*` yüzeyi bulunur. Bunları,
yeni üçüncü taraf plugin'ler için önerilen SDK deseni olarak değil, ayrılmış uygulama ayrıntısı aktarımları olarak değerlendirin.

## İç yapılar ve başvuru

Yükleme hattı, registry modeli, sağlayıcı çalışma zamanı hook'ları, Gateway HTTP
yolları, message tool şemaları, kanal hedef çözümleme, sağlayıcı katalogları,
bağlam motoru plugin'leri ve yeni bir yetenek ekleme kılavuzu için bkz.
[Plugin architecture internals](/tr/plugins/architecture-internals).

## İlgili

- [Plugin oluşturma](/tr/plugins/building-plugins)
- [Plugin SDK kurulumu](/tr/plugins/sdk-setup)
- [Plugin manifest](/tr/plugins/manifest)
