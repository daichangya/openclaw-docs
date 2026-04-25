---
read_when:
    - Sağlayıcı çalışma zamanı kancalarını, kanal yaşam döngüsünü veya paket paketlerini uygulama
    - Plugin yükleme sırasını veya kayıt defteri durumunu hata ayıklama
    - Yeni bir Plugin yeteneği veya bağlam motoru Plugin'i ekleme
summary: 'Plugin mimarisi iç yapıları: yükleme hattı, kayıt defteri, çalışma zamanı kancaları, HTTP rotaları ve başvuru tabloları'
title: Plugin mimarisi iç yapıları
x-i18n:
    generated_at: "2026-04-25T13:51:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Genel yetenek modeli, Plugin biçimleri ve sahiplik/yürütme
sözleşmeleri için [Plugin architecture](/tr/plugins/architecture) bölümüne bakın. Bu sayfa,
iç mekanikler için başvurudur: yükleme hattı, kayıt defteri, çalışma zamanı kancaları,
Gateway HTTP rotaları, içe aktarma yolları ve şema tabloları.

## Yükleme hattı

Başlangıçta OpenClaw kabaca şunu yapar:

1. aday Plugin köklerini keşfeder
2. yerel veya uyumlu paket manifest'lerini ve paket meta verilerini okur
3. güvenli olmayan adayları reddeder
4. Plugin yapılandırmasını normalleştirir (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. her aday için etkinliği belirler
6. etkin yerel modülleri yükler: derlenmiş paketlenmiş modüller yerel bir yükleyici kullanır;
   derlenmemiş yerel Plugin'ler jiti kullanır
7. yerel `register(api)` kancalarını çağırır ve kayıtları Plugin kayıt defterinde toplar
8. kayıt defterini komut/çalışma zamanı yüzeylerine açar

<Note>
`activate`, `register` için eski bir takma addır — yükleyici hangisi varsa onu çözümler (`def.register ?? def.activate`) ve aynı noktada çağırır. Tüm paketlenmiş Plugin'ler `register` kullanır; yeni Plugin'ler için `register` tercih edin.
</Note>

Güvenlik geçitleri çalışma zamanı yürütmesinden **önce** gerçekleşir. Adaylar,
giriş Plugin kökünden kaçtığında, yol dünya tarafından yazılabilir olduğunda veya
paketlenmemiş Plugin'ler için yol sahipliği şüpheli göründüğünde engellenir.

### Manifest öncelikli davranış

Manifest, kontrol düzlemi için doğru kaynaktır. OpenClaw bunu şunlar için kullanır:

- Plugin'i tanımlamak
- bildirilen kanalları/Skills/yapılandırma şemasını veya paket yeteneklerini keşfetmek
- `plugins.entries.<id>.config` değerini doğrulamak
- Control UI etiketlerini/yer tutucularını zenginleştirmek
- kurulum/katalog meta verilerini göstermek
- Plugin çalışma zamanını yüklemeden ucuz etkinleştirme ve kurulum tanımlayıcılarını korumak

Yerel Plugin'lerde çalışma zamanı modülü veri düzlemi parçasıdır. Kancalar, araçlar, komutlar veya sağlayıcı akışları gibi
gerçek davranışları kaydeder.

İsteğe bağlı manifest `activation` ve `setup` blokları kontrol düzleminde kalır.
Bunlar etkinleştirme planlaması ve kurulum keşfi için yalnızca meta veri tanımlayıcılarıdır;
çalışma zamanı kaydının, `register(...)` çağrısının veya `setupEntry`'nin yerini almazlar.
İlk canlı etkinleştirme tüketicileri artık daha geniş kayıt defteri somutlaştırmasından önce
Plugin yüklemesini daraltmak için manifest komut, kanal ve sağlayıcı ipuçlarını kullanır:

- CLI yüklemesi, istenen birincil komuta sahip olan Plugin'lere daralır
- kanal kurulumu/Plugin çözümlemesi, istenen
  kanal kimliğine sahip olan Plugin'lere daralır
- açık sağlayıcı kurulumu/çalışma zamanı çözümlemesi, istenen
  sağlayıcı kimliğine sahip olan Plugin'lere daralır

Etkinleştirme planlayıcısı hem mevcut çağıranlar için yalnızca kimlikli API'yi hem de
yeni tanılamalar için plan API'sini açığa çıkarır. Plan girdileri, bir Plugin'in neden seçildiğini bildirir
ve açık `activation.*` planlayıcı ipuçlarını
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` ve kancalar gibi manifest sahipliği fallback'lerinden ayırır. Bu neden ayrımı uyumluluk sınırıdır:
mevcut Plugin meta verileri çalışmaya devam ederken, yeni kod çalışma zamanı yükleme semantiğini değiştirmeden geniş ipuçlarını
veya fallback davranışını algılayabilir.

Kurulum keşfi artık daha geniş adaylara düşmeden önce
aday Plugin'leri daraltmak için `setup.providers` ve
`setup.cliBackends` gibi tanımlayıcı sahipli kimlikleri tercih eder; yalnızca hâlâ kurulum zamanı çalışma zamanı kancalarına ihtiyaç duyan Plugin'ler için `setup-api` fallback'ine döner. Sağlayıcı
kurulum akışı önce manifest `providerAuthChoices` kullanır, sonra uyumluluk için
çalışma zamanı sihirbazı seçimlerine ve kurulum katalogu seçimlerine geri döner. Açık
`setup.requiresRuntime: false`, yalnızca tanımlayıcı düzeyinde bir kesimdir; atlanmış
`requiresRuntime`, uyumluluk için eski setup-api fallback'ini korur. Keşfedilen
birden fazla Plugin aynı normalize edilmiş kurulum sağlayıcısı veya CLI
arka uç kimliğini sahiplenirse, kurulum araması keşif sırasına güvenmek yerine
belirsiz sahipliği reddeder. Kurulum çalışma zamanı gerçekten yürütüldüğünde, kayıt defteri tanılamaları
`setup.providers` / `setup.cliBackends` ile setup-api tarafından kaydedilen sağlayıcılar veya CLI
arka uçları arasındaki kaymayı, eski Plugin'leri engellemeden bildirir.

### Yükleyicinin önbelleğe aldığı şeyler

OpenClaw süreç içinde kısa ömürlü önbellekler tutar:

- keşif sonuçları
- manifest kayıt defteri verileri
- yüklenmiş Plugin kayıt defterleri

Bu önbellekler, patlamalı başlangıcı ve yinelenen komut yükünü azaltır. Bunları
kalıcılık değil, kısa ömürlü performans önbellekleri olarak düşünmek güvenlidir.

Performans notu:

- Bu önbellekleri devre dışı bırakmak için `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` veya
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` ayarlayın.
- Önbellek pencerelerini `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` ve
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` ile ayarlayın.

## Kayıt defteri modeli

Yüklenen Plugin'ler rastgele çekirdek global durumlarını doğrudan değiştirmez. Bunun yerine merkezi bir
Plugin kayıt defterine kaydolurlar.

Kayıt defteri şunları izler:

- Plugin kayıtları (kimlik, kaynak, köken, durum, tanılamalar)
- araçlar
- eski kancalar ve tipli kancalar
- kanallar
- sağlayıcılar
- gateway RPC işleyicileri
- HTTP rotaları
- CLI registrar'ları
- arka plan servisleri
- Plugin sahipliğindeki komutlar

Çekirdek özellikler daha sonra doğrudan Plugin modülleriyle konuşmak yerine
bu kayıt defterinden okur. Bu, yüklemeyi tek yönlü tutar:

- Plugin modülü -> kayıt defteri kaydı
- çekirdek çalışma zamanı -> kayıt defteri tüketimi

Bu ayrım bakım yapılabilirlik için önemlidir. Çekirdek yüzeylerin çoğunun
yalnızca tek bir entegrasyon noktasına ihtiyaç duyması anlamına gelir: "kayıt defterini oku",
"her Plugin modülünü özel durum yap" değil.

## Konuşma bağlama geri çağrımları

Bir konuşmayı bağlayan Plugin'ler, bir onay çözümlendiğinde tepki verebilir.

Bağlama isteği onaylandıktan veya reddedildikten sonra geri çağırım almak için
`api.onConversationBindingResolved(...)` kullanın:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Bu plugin + conversation için artık bir bağ mevcut.
        console.log(event.binding?.conversationId);
        return;
      }

      // İstek reddedildi; yerel bekleyen durumu temizleyin.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Geri çağırım payload alanları:

- `status`: `"approved"` veya `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` veya `"deny"`
- `binding`: onaylanan istekler için çözümlenmiş bağ
- `request`: özgün istek özeti, ayırma ipucu, gönderen kimliği ve
  konuşma meta verileri

Bu geri çağırım yalnızca bildirim içindir. Kimin bir konuşmayı bağlamasına izin verildiğini değiştirmez ve çekirdek onay işleme bittikten sonra çalışır.

## Sağlayıcı çalışma zamanı kancaları

Sağlayıcı Plugin'lerinde üç katman vardır:

- Ucuz çalışma zamanı öncesi arama için **manifest meta verileri**:
  `setup.providers[].envVars`, kullanımdan kaldırılmış uyumluluk `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` ve `channelEnvVars`.
- **Yapılandırma zamanı kancaları**: `catalog` (eski `discovery`) ve
  `applyConfigDefaults`.
- **Çalışma zamanı kancaları**: kimlik doğrulama, model çözümleme,
  akış sarmalama, düşünme düzeyleri, replay ilkesi ve kullanım uç noktalarını kapsayan 40'tan fazla isteğe bağlı kanca. Tam liste için
  [Kanca sırası ve kullanım](#hook-order-and-usage) bölümüne bakın.

OpenClaw yine de genel ajan döngüsünün, failover'ın, transcript işlemenin ve
araç ilkesinin sahibidir. Bu kancalar, tümüyle özel bir çıkarım taşımasına ihtiyaç duymadan sağlayıcıya özgü
davranışlar için uzantı yüzeyidir.

Sağlayıcının, genel auth/status/model seçici yollarının sağlayıcı çalışma zamanını yüklemeden görebileceği env tabanlı
kimlik bilgileri varsa manifest `setup.providers[].envVars` kullanın.
Kullanımdan kaldırılmış `providerAuthEnvVars`, kullanımdan kaldırma penceresi boyunca yine uyumluluk bağdaştırıcısı tarafından okunur ve bunu kullanan paketlenmemiş Plugin'ler
bir manifest tanılaması alır. Bir sağlayıcı kimliğinin başka bir sağlayıcının env değişkenlerini, auth profillerini,
yapılandırma destekli auth'u ve API anahtarı onboarding seçimini yeniden kullanması gerektiğinde manifest `providerAuthAliases` kullanın. Onboarding/auth-choice CLI yüzeylerinin
sağlayıcının seçim kimliğini, grup etiketlerini ve basit tek bayraklı auth bağlantısını çalışma zamanı yüklemeden bilmesi gerektiğinde manifest
`providerAuthChoices` kullanın. Sağlayıcı çalışma zamanı
`envVars` değerlerini, onboarding etiketleri veya OAuth
client-id/client-secret kurulum değişkenleri gibi operatöre dönük ipuçları için tutun.

Bir kanalın, genel shell-env fallback'inin, yapılandırma/durum denetimlerinin veya kurulum istemlerinin kanal çalışma zamanını yüklemeden görmesi gereken env odaklı auth veya kurulumları varsa manifest `channelEnvVars` kullanın.

### Kanca sırası ve kullanım

Model/sağlayıcı Plugin'leri için OpenClaw kancaları kabaca şu sırayla çağırır.
"When to use" sütunu hızlı karar kılavuzudur.

| #   | Kanca                             | Ne yapar                                                                                                       | Ne zaman kullanılır                                                                                                                           |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` oluşturulurken sağlayıcı yapılandırmasını `models.providers` içine yayımlar                     | Sağlayıcı bir kataloga veya temel URL varsayılanlarına sahipse                                                                                |
| 2   | `applyConfigDefaults`             | Yapılandırma somutlaştırma sırasında sağlayıcı sahipli genel yapılandırma varsayılanlarını uygular            | Varsayılanlar auth modu, env veya sağlayıcı model ailesi semantiğine bağlıysa                                                                 |
| --  | _(yerleşik model araması)_        | OpenClaw önce normal kayıt defteri/katalog yolunu dener                                                        | _(Plugin kancası değildir)_                                                                                                                   |
| 3   | `normalizeModelId`                | Aramadan önce eski veya önizleme model kimliği takma adlarını normalleştirir                                  | Sağlayıcı, kanonik model çözümlemesinden önce takma ad temizliğine sahip olmalıdır                                                            |
| 4   | `normalizeTransport`              | Genel model derlemesinden önce sağlayıcı ailesi `api` / `baseUrl` değerlerini normalleştirir                 | Sağlayıcı, aynı taşıma ailesindeki özel sağlayıcı kimlikleri için taşıma temizliğine sahipse                                                  |
| 5   | `normalizeConfig`                 | Çalışma zamanı/sağlayıcı çözümlemesinden önce `models.providers.<id>` değerini normalleştirir                | Sağlayıcının Plugin ile birlikte yaşaması gereken yapılandırma temizliği gerekiyorsa; paketlenmiş Google ailesi yardımcıları da desteklenen Google yapılandırma girdileri için arka duraktır |
| 6   | `applyNativeStreamingUsageCompat` | Yapılandırma sağlayıcılarına yerel akış kullanımı uyumluluk yeniden yazımlarını uygular                       | Sağlayıcının uç nokta güdümlü yerel akış kullanım meta verisi düzeltmelerine ihtiyacı varsa                                                  |
| 7   | `resolveConfigApiKey`             | Çalışma zamanı auth yüklemesinden önce yapılandırma sağlayıcıları için env-marker auth'u çözümler            | Sağlayıcının sağlayıcı sahipli env-marker API anahtarı çözümlemesi varsa; `amazon-bedrock` da burada yerleşik AWS env-marker çözümleyicisine sahiptir |
| 8   | `resolveSyntheticAuth`            | Düz metin kalıcılaştırmadan yerel/self-hosted veya yapılandırma destekli auth'u açığa çıkarır                | Sağlayıcı sentetik/yerel kimlik bilgisi işaretçisiyle çalışabiliyorsa                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Sağlayıcı sahipli harici auth profillerini bindirir; varsayılan `persistence`, CLI/uygulama sahipli kimlik bilgileri için `runtime-only` olur | Sağlayıcı kopyalanmış refresh token'ları kalıcılaştırmadan harici auth kimlik bilgilerini yeniden kullanıyorsa; manifest'te `contracts.externalAuthProviders` bildirin |
| 10  | `shouldDeferSyntheticProfileAuth` | Saklanan sentetik profil yer tutucularını env/yapılandırma destekli auth'un arkasına düşürür                 | Sağlayıcı öncelik kazanmaması gereken sentetik yer tutucu profiller saklıyorsa                                                                |
| 11  | `resolveDynamicModel`             | Henüz yerel kayıt defterinde olmayan sağlayıcı sahipli model kimlikleri için eşzamanlı fallback              | Sağlayıcı rastgele üst akış model kimliklerini kabul ediyorsa                                                                                 |
| 12  | `prepareDynamicModel`             | Eşzamansız ısınma yapar, sonra `resolveDynamicModel` yeniden çalışır                                          | Sağlayıcı bilinmeyen kimlikleri çözmeden önce ağ meta verisine ihtiyaç duyuyorsa                                                              |
| 13  | `normalizeResolvedModel`          | Paketlenmiş çalıştırıcı çözümlenmiş modeli kullanmadan önce son yeniden yazımı yapar                          | Sağlayıcı taşıma yeniden yazımlarına ihtiyaç duyuyor ama yine de çekirdek bir taşıma kullanıyorsa                                             |
| 14  | `contributeResolvedModelCompat`   | Başka bir uyumlu taşıma arkasındaki satıcı modeller için uyumluluk bayrakları ekler                           | Sağlayıcı, sağlayıcıyı devralmadan vekil taşımalardaki kendi modellerini tanıyorsa                                                            |
| 15  | `capabilities`                    | Paylaşılan çekirdek mantık tarafından kullanılan sağlayıcı sahipli transcript/araç meta verisi               | Sağlayıcının transcript/sağlayıcı ailesi farklılıklarına ihtiyacı varsa                                                                       |
| 16  | `normalizeToolSchemas`            | Paketlenmiş çalıştırıcı görmeden önce araç şemalarını normalleştirir                                          | Sağlayıcı taşıma ailesi şema temizliğine ihtiyaç duyuyorsa                                                                                   |
| 17  | `inspectToolSchemas`              | Normalleştirmeden sonra sağlayıcı sahipli şema tanılamalarını açığa çıkarır                                   | Sağlayıcı, çekirdeğe sağlayıcıya özgü kuralları öğretmeden anahtar sözcük uyarıları istiyorsa                                                |
| 18  | `resolveReasoningOutputMode`      | Yerel veya etiketli reasoning-output sözleşmesini seçer                                                       | Sağlayıcı yerel alanlar yerine etiketli reasoning/final çıktı istiyorsa                                                                       |
| 19  | `prepareExtraParams`              | Genel akış seçenek sarmalayıcılarından önce istek parametresi normalleştirme                                  | Sağlayıcının varsayılan istek parametrelerine veya sağlayıcı başına parametre temizliğine ihtiyacı varsa                                     |
| 20  | `createStreamFn`                  | Normal akış yolunu özel bir taşıma ile tamamen değiştirir                                                     | Sağlayıcı yalnızca sarmalayıcı değil, özel bir tel protokolüne ihtiyaç duyuyorsa                                                             |
| 21  | `wrapStreamFn`                    | Genel sarmalayıcılar uygulandıktan sonra akış sarmalayıcısı                                                   | Sağlayıcının özel taşıma olmadan istek üst bilgisi/gövdesi/model uyumluluk sarmalayıcılarına ihtiyacı varsa                                  |
| 22  | `resolveTransportTurnState`       | Yerel dönüş başına taşıma üst bilgileri veya meta veri ekler                                                  | Sağlayıcı genel taşımaların sağlayıcı yerel dönüş kimliğini göndermesini istiyorsa                                                            |
| 23  | `resolveWebSocketSessionPolicy`   | Yerel WebSocket üst bilgileri veya oturum cooldown ilkesi ekler                                               | Sağlayıcı genel WS taşımalarının oturum üst bilgilerini veya fallback ilkesini ayarlamasını istiyorsa                                        |
| 24  | `formatApiKey`                    | Auth-profile biçimlendiricisi: saklanan profil çalışma zamanı `apiKey` dizesine dönüşür                       | Sağlayıcı ek auth meta verisi saklıyor ve özel bir çalışma zamanı token biçimine ihtiyaç duyuyorsa                                           |
| 25  | `refreshOAuth`                    | Özel yenileme uç noktaları veya yenileme başarısızlığı ilkesi için OAuth yenileme geçersiz kılması           | Sağlayıcı paylaşılan `pi-ai` yenileyicilerine uymuyorsa                                                                                       |
| 26  | `buildAuthDoctorHint`             | OAuth yenilemesi başarısız olduğunda eklenen onarım ipucu                                                     | Sağlayıcının yenileme başarısızlığından sonra sağlayıcı sahipli auth onarım kılavuzuna ihtiyacı varsa                                        |
| 27  | `matchesContextOverflowError`     | Sağlayıcı sahipli bağlam penceresi taşması eşleştiricisi                                                      | Sağlayıcının genel sezgisellerin kaçıracağı ham taşma hataları varsa                                                                          |
| 28  | `classifyFailoverReason`          | Sağlayıcı sahipli failover neden sınıflandırması                                                              | Sağlayıcı ham API/taşıma hatalarını oran sınırı/aşırı yük vb. durumlara eşleyebiliyorsa                                                      |
| 29  | `isCacheTtlEligible`              | Vekil/backhaul sağlayıcılar için istem önbelleği ilkesi                                                       | Sağlayıcının vekile özgü önbellek TTL geçidine ihtiyacı varsa                                                                                 |
| 30  | `buildMissingAuthMessage`         | Genel eksik auth kurtarma mesajının yerine geçer                                                              | Sağlayıcının sağlayıcıya özgü eksik auth kurtarma ipucuna ihtiyacı varsa                                                                      |
| 31  | `suppressBuiltInModel`            | Eski üst akış model bastırma ve isteğe bağlı kullanıcıya dönük hata ipucu                                     | Sağlayıcının eski üst akış satırlarını gizlemesi veya bunları satıcı ipucuyla değiştirmesi gerekiyorsa                                       |
| 32  | `augmentModelCatalog`             | Keşiften sonra sentetik/nihai katalog satırları eklenir                                                       | Sağlayıcının `models list` ve seçicilerde sentetik ileri uyumluluk satırlarına ihtiyacı varsa                                                |
| 33  | `resolveThinkingProfile`          | Modele özgü `/think` düzeyi kümesi, gösterim etiketleri ve varsayılan                                          | Sağlayıcı seçilen modeller için özel bir düşünme merdiveni veya ikili etiket açığa çıkarıyorsa                                              |
| 34  | `isBinaryThinking`                | Açık/kapalı reasoning geçişi uyumluluk kancası                                                                | Sağlayıcı yalnızca ikili düşünme açık/kapalı sunuyorsa                                                                                        |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning desteği uyumluluk kancası                                                                   | Sağlayıcı yalnızca modellerin bir alt kümesinde `xhigh` istiyorsa                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | Varsayılan `/think` düzeyi uyumluluk kancası                                                                  | Sağlayıcı bir model ailesi için varsayılan `/think` ilkesinin sahibiyse                                                                       |
| 37  | `isModernModelRef`                | Canlı profil filtreleri ve smoke seçimi için modern model eşleştiricisi                                        | Sağlayıcı canlı/smoke için tercih edilen model eşleştirmesinin sahibiyse                                                                     |
| 38  | `prepareRuntimeAuth`              | Çıkarımdan hemen önce yapılandırılmış bir kimlik bilgisini gerçek çalışma zamanı token/anahtarına dönüştürür | Sağlayıcının token değişimi veya kısa ömürlü istek kimlik bilgisine ihtiyacı varsa                                                           |
| 39  | `resolveUsageAuth`                | `/usage` ve ilgili durum yüzeyleri için kullanım/faturalama kimlik bilgilerini çözümler                       | Sağlayıcının özel kullanım/kota token ayrıştırmasına veya farklı bir kullanım kimlik bilgisine ihtiyacı varsa                                |
| 40  | `fetchUsageSnapshot`              | Auth çözümlendikten sonra sağlayıcıya özgü kullanım/kota anlık görüntülerini getirir ve normalleştirir        | Sağlayıcının sağlayıcıya özgü kullanım uç noktasına veya payload ayrıştırıcısına ihtiyacı varsa                                              |
| 41  | `createEmbeddingProvider`         | Bellek/arama için sağlayıcı sahipli bir embedding bağdaştırıcısı oluşturur                                     | Bellek embedding davranışı sağlayıcı Plugin ile birlikte bulunmalıdır                                                                         |
| 42  | `buildReplayPolicy`               | Sağlayıcı için transcript işlemeyi denetleyen bir replay ilkesi döndürür                                       | Sağlayıcının özel transcript ilkesine (örneğin thinking-block çıkarma) ihtiyacı varsa                                                        |
| 43  | `sanitizeReplayHistory`           | Genel transcript temizliğinden sonra replay geçmişini yeniden yazar                                            | Sağlayıcının paylaşılan Compaction yardımcılarının ötesinde sağlayıcıya özgü replay yeniden yazımlarına ihtiyacı varsa                      |
| 44  | `validateReplayTurns`             | Paketlenmiş çalıştırıcıdan önce son replay-turn doğrulaması veya yeniden şekillendirmesi yapar                | Sağlayıcı taşımasının genel temizlemeden sonra daha katı dönüş doğrulamasına ihtiyacı varsa                                                  |
| 45  | `onModelSelected`                 | Sağlayıcı sahipli seçim sonrası yan etkileri çalıştırır                                                        | Bir model etkin olduğunda sağlayıcının telemetriye veya sağlayıcı sahipli duruma ihtiyacı varsa                                              |

`normalizeModelId`, `normalizeTransport` ve `normalizeConfig` önce eşleşen
sağlayıcı Plugin'ini denetler, sonra model kimliğini veya taşıma/yapılandırmayı gerçekten değiştiren biri çıkana kadar
diğer kanca destekli sağlayıcı Plugin'lerine düşer. Bu, arayanın hangi
paketlenmiş Plugin'in yeniden yazımın sahibi olduğunu bilmesini gerektirmeden
takma ad/uyumluluk sağlayıcısı shim'lerinin çalışmasını sağlar. Hiçbir sağlayıcı kancası desteklenen bir
Google ailesi yapılandırma girdisini yeniden yazmazsa, paketlenmiş Google yapılandırma normalleştiricisi yine
bu uyumluluk temizliğini uygular.

Sağlayıcının tamamen özel bir tel protokolüne veya özel bir istek yürütücüsüne ihtiyacı varsa
bu farklı bir uzantı sınıfıdır. Bu kancalar, yine de OpenClaw'ın normal çıkarım döngüsünde çalışan
sağlayıcı davranışları içindir.

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

Paketlenmiş sağlayıcı Plugin'leri, her satıcının katalog,
auth, düşünme, replay ve kullanım gereksinimlerine uymak için yukarıdaki kancaları birleştirir. Yetkili kanca kümesi
`extensions/` altında her Plugin ile birlikte bulunur; bu sayfa listeyi
yansıtmaktan çok biçimleri gösterir.

<AccordionGroup>
  <Accordion title="Geçişli katalog sağlayıcıları">
    OpenRouter, Kilocode, Z.AI, xAI; üst akış
    model kimliklerini OpenClaw'ın statik kataloğunun önünde gösterebilmeleri için `catalog` ile birlikte
    `resolveDynamicModel` / `prepareDynamicModel` kaydeder.
  </Accordion>
  <Accordion title="OAuth ve kullanım uç noktası sağlayıcıları">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai;
    token değişimini ve `/usage` entegrasyonunu sahiplenmek için `prepareRuntimeAuth` veya `formatApiKey` ile
    `resolveUsageAuth` + `fetchUsageSnapshot` eşleştirir.
  </Accordion>
  <Accordion title="Replay ve transcript temizleme aileleri">
    Paylaşılan adlandırılmış aileler (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) sağlayıcıların her Plugin'in
    temizlemeyi yeniden uygulaması yerine `buildReplayPolicy` üzerinden
    transcript ilkesine katılmasını sağlar.
  </Accordion>
  <Accordion title="Yalnızca katalog sağlayıcıları">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` ve
    `volcengine` yalnızca `catalog` kaydeder ve paylaşılan çıkarım döngüsünü kullanır.
  </Accordion>
  <Accordion title="Anthropic'e özgü akış yardımcıları">
    Beta üst bilgileri, `/fast` / `serviceTier` ve `context1m`, genel SDK içinde
    değil, Anthropic Plugin'inin genel `api.ts` / `contract-api.ts` sınırında
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) bulunur.
  </Accordion>
</AccordionGroup>

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

- `textToSpeech`, dosya/sesli not yüzeyleri için normal çekirdek TTS çıktı payload'unu döndürür.
- Çekirdek `messages.tts` yapılandırmasını ve sağlayıcı seçimini kullanır.
- PCM ses arabelleği + örnekleme oranı döndürür. Plugin'ler sağlayıcılar için yeniden örneklemeli/kodlamalıdır.
- `listVoices`, sağlayıcı başına isteğe bağlıdır. Bunu satıcı sahipli ses seçicileri veya kurulum akışları için kullanın.
- Ses listeleri; sağlayıcı farkında seçiciler için yerel ayar, cinsiyet ve kişilik etiketleri gibi daha zengin meta veriler içerebilir.
- Bugün telephony desteği OpenAI ve ElevenLabs'te vardır. Microsoft'ta yoktur.

Plugin'ler ayrıca `api.registerSpeechProvider(...)` ile konuşma sağlayıcıları da kaydedebilir.

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

- TTS ilkesi, fallback ve yanıt teslimatını çekirdekte tutun.
- Satıcı sahipli sentez davranışı için konuşma sağlayıcılarını kullanın.
- Eski Microsoft `edge` girdisi `microsoft` sağlayıcı kimliğine normalleştirilir.
- Tercih edilen sahiplik modeli şirket odaklıdır: OpenClaw bu
  yetenek sözleşmelerini ekledikçe tek bir satıcı Plugin'i metin, konuşma, görsel ve gelecekteki medya sağlayıcılarının sahibi olabilir.

Görsel/ses/video anlama için Plugin'ler genel bir anahtar/değer torbası yerine tek bir tipli
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

- Düzenleme, fallback, yapılandırma ve kanal bağlantısını çekirdekte tutun.
- Satıcı davranışını sağlayıcı Plugin'inde tutun.
- Toplayıcı genişleme tipli kalmalıdır: yeni isteğe bağlı yöntemler, yeni isteğe bağlı
  sonuç alanları, yeni isteğe bağlı yetenekler.
- Video oluşturma zaten aynı kalıbı izler:
  - çekirdek yetenek sözleşmesine ve çalışma zamanı yardımcısına sahiptir
  - satıcı Plugin'leri `api.registerVideoGenerationProvider(...)` kaydeder
  - özellik/kanal Plugin'leri `api.runtime.videoGeneration.*` tüketir

Medya anlama çalışma zamanı yardımcıları için Plugin'ler şunları çağırabilir:

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

Ses transkripsiyonu için Plugin'ler medya anlama çalışma zamanını
veya eski STT takma adını kullanabilir:

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
- Çekirdek medya anlama ses yapılandırmasını (`tools.media.audio`) ve sağlayıcı fallback sırasını kullanır.
- Transkripsiyon çıktısı üretilmezse `{ text: undefined }` döndürür (örneğin atlanan/desteklenmeyen girdi).
- `api.runtime.stt.transcribeAudioFile(...)`, uyumluluk takma adı olarak kalır.

Plugin'ler ayrıca `api.runtime.subagent` üzerinden arka plan alt ajan çalıştırmaları başlatabilir:

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
- OpenClaw bu geçersiz kılma alanlarını yalnızca güvenilen çağıranlar için dikkate alır.
- Plugin sahipli fallback çalıştırmaları için operatörler `plugins.entries.<id>.subagent.allowModelOverride: true` ile açıkça katılmalıdır.
- Güvenilen Plugin'leri belirli kanonik `provider/model` hedefleriyle sınırlamak veya açıkça herhangi bir hedefe izin vermek için `"*"` kullanmak üzere `plugins.entries.<id>.subagent.allowedModels` kullanın.
- Güvenilmeyen Plugin alt ajan çalıştırmaları yine çalışır, ancak geçersiz kılma istekleri sessizce fallback yapmak yerine reddedilir.

Web araması için Plugin'ler,
ajan araç bağlantısına girmek yerine paylaşılan çalışma zamanı yardımcısını tüketebilir:

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
`api.registerWebSearchProvider(...)` üzerinden web arama sağlayıcıları da kaydedebilir.

Notlar:

- Sağlayıcı seçimi, kimlik bilgisi çözümleme ve paylaşılan istek semantiğini çekirdekte tutun.
- Satıcıya özgü arama taşımaları için web arama sağlayıcıları kullanın.
- `api.runtime.webSearch.*`, ajan araç sarmalayıcısına bağlı kalmadan arama davranışına ihtiyaç duyan özellik/kanal Plugin'leri için tercih edilen paylaşılan yüzeydir.

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

- `generate(...)`: yapılandırılmış görsel oluşturma sağlayıcı zincirini kullanarak görsel üretir.
- `listProviders(...)`: kullanılabilir görsel oluşturma sağlayıcılarını ve yeteneklerini listeler.

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
- `auth`: zorunlu. Normal gateway auth için `"gateway"`, Plugin tarafından yönetilen auth/Webhook doğrulaması için `"plugin"` kullanın.
- `match`: isteğe bağlı. `"exact"` (varsayılan) veya `"prefix"`.
- `replaceExisting`: isteğe bağlı. Aynı Plugin'in kendi mevcut rota kaydını değiştirmesine izin verir.
- `handler`: rota isteği işlediğinde `true` döndürür.

Notlar:

- `api.registerHttpHandler(...)` kaldırıldı ve Plugin yükleme hatasına neden olur. Bunun yerine `api.registerHttpRoute(...)` kullanın.
- Plugin rotaları `auth` değerini açıkça bildirmelidir.
- Tam `path + match` çakışmaları, `replaceExisting: true` olmadıkça reddedilir ve bir Plugin başka bir Plugin'in rotasını değiştiremez.
- Farklı `auth` düzeylerine sahip çakışan rotalar reddedilir. `exact`/`prefix` fallthrough zincirlerini yalnızca aynı auth düzeyinde tutun.
- `auth: "plugin"` rotaları operatör çalışma zamanı kapsamlarını otomatik almaz. Bunlar ayrıcalıklı Gateway yardımcı çağrıları için değil, Plugin tarafından yönetilen Webhook'lar/imza doğrulaması içindir.
- `auth: "gateway"` rotaları Gateway istek çalışma zamanı kapsamı içinde çalışır, ancak bu kapsam kasıtlı olarak tutucudur:
  - paylaşılan gizli bearer auth (`gateway.auth.mode = "token"` / `"password"`), çağıran `x-openclaw-scopes` gönderse bile Plugin rota çalışma zamanı kapsamlarını `operator.write` üzerinde sabit tutar
  - güvenilen kimlik taşıyan HTTP modları (örneğin `trusted-proxy` veya özel bir girişte `gateway.auth.mode = "none"`), `x-openclaw-scopes` değerini yalnızca üst bilgi açıkça mevcut olduğunda dikkate alır
  - kimlik taşıyan bu Plugin rota isteklerinde `x-openclaw-scopes` yoksa çalışma zamanı kapsamı `operator.write` değerine geri döner
- Pratik kural: gateway-auth kullanılan bir Plugin rotasının örtük bir yönetici yüzeyi olduğunu varsaymayın. Rotanızın yalnızca yönetici davranışına ihtiyacı varsa kimlik taşıyan bir auth modu gerektirin ve açık `x-openclaw-scopes` üst bilgi sözleşmesini belgeleyin.

## Plugin SDK içe aktarma yolları

Yeni Plugin'ler yazarken tek parça `openclaw/plugin-sdk` kök
barrel'ı yerine dar SDK alt yollarını kullanın. Çekirdek alt yollar:

| Alt yol                             | Amaç                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin kayıt ilkelikleri                           |
| `openclaw/plugin-sdk/channel-core`  | Kanal giriş/oluşturma yardımcıları                 |
| `openclaw/plugin-sdk/core`          | Genel paylaşılan yardımcılar ve şemsiye sözleşme   |
| `openclaw/plugin-sdk/config-schema` | Kök `openclaw.json` Zod şeması (`OpenClawSchema`)  |

Kanal Plugin'leri dar sınırların bir ailesinden seçim yapar — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` ve `channel-actions`. Onay davranışı, ilgisiz
Plugin alanları arasında karışmak yerine tek bir `approvalCapability` sözleşmesinde toplanmalıdır.
Bkz. [Channel plugins](/tr/plugins/sdk-channel-plugins).

Çalışma zamanı ve yapılandırma yardımcıları eşleşen `*-runtime` alt yolları
altında bulunur (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` vb.).

<Info>
`openclaw/plugin-sdk/channel-runtime` kullanımdan kaldırılmıştır — eski Plugin'ler için bir uyumluluk shim'idir. Yeni kod daraltılmış genel ilkelikleri içe aktarmalıdır.
</Info>

Repo içi giriş noktaları (paketlenmiş Plugin paket kökü başına):

- `index.js` — paketlenmiş Plugin girişi
- `api.js` — yardımcı/türler barrel'ı
- `runtime-api.js` — yalnızca çalışma zamanı barrel'ı
- `setup-entry.js` — kurulum Plugin girişi

Harici Plugin'ler yalnızca `openclaw/plugin-sdk/*` alt yollarını içe aktarmalıdır.
Çekirdekten veya başka bir Plugin'den asla başka bir Plugin paketinin `src/*` yolunu içe aktarmayın.
Facade ile yüklenen giriş noktaları, varsa etkin çalışma zamanı yapılandırma anlık görüntüsünü tercih eder,
yoksa disk üzerindeki çözümlenmiş yapılandırma dosyasına geri döner.

`image-generation`, `media-understanding`
ve `speech` gibi yeteneğe özgü alt yollar bugün paketlenmiş Plugin'ler tarafından kullanıldıkları için vardır. Bunlar
otomatik olarak uzun vadede dondurulmuş harici sözleşmeler değildir — onlara güvenmeden önce
ilgili SDK başvuru sayfasını denetleyin.

## Mesaj aracı şemaları

Plugin'ler, tepkiler, okumalar ve anketler gibi mesaj dışı ilkelikler için kanala özgü `describeMessageTool(...)` şema
katkılarının sahibi olmalıdır.
Paylaşılan gönderim sunumu, sağlayıcıya özgü düğme, bileşen, blok veya kart alanları yerine
genel `MessagePresentation` sözleşmesini kullanmalıdır.
Sözleşme, fallback kuralları, sağlayıcı eşlemesi ve Plugin yazarı denetim listesi için
[Message Presentation](/tr/plugins/message-presentation) bölümüne bakın.

Gönderim yapabilen Plugin'ler, mesaj yetenekleri üzerinden ne işleyebileceklerini bildirir:

- anlamsal sunum blokları için `presentation` (`text`, `context`, `divider`, `buttons`, `select`)
- sabitlenmiş teslimat istekleri için `delivery-pin`

Sunumun yerel olarak mı işleneceğine yoksa metne mi indirgeneceğine çekirdek karar verir.
Genel mesaj aracından sağlayıcıya özgü UI kaçış kapıları açmayın.
Eski yerel şemalar için kullanımdan kaldırılmış SDK yardımcıları mevcut
üçüncü taraf Plugin'ler için yine dışa aktarılır, ancak yeni Plugin'ler bunları kullanmamalıdır.

## Kanal hedef çözümleme

Kanal Plugin'leri kanala özgü hedef semantiğinin sahibi olmalıdır. Paylaşılan
giden ana makineyi genel tutun ve sağlayıcı kuralları için mesajlaşma bağdaştırıcı yüzeyini kullanın:

- `messaging.inferTargetChatType({ to })`, normalize edilmiş bir hedefin
  dizin aramasından önce `direct`, `group` veya `channel` olarak değerlendirilip değerlendirilmeyeceğine karar verir.
- `messaging.targetResolver.looksLikeId(raw, normalized)`, çekirdeğe bir girdinin
  dizin araması yerine doğrudan kimlik benzeri çözümlemeye atlayıp atlamaması gerektiğini söyler.
- `messaging.targetResolver.resolveTarget(...)`, çekirdek normalleştirmeden sonra veya
  dizin ıskasından sonra son sağlayıcı sahipli çözümlemeye ihtiyaç duyduğunda Plugin fallback'idir.
- `messaging.resolveOutboundSessionRoute(...)`, bir hedef çözümlendikten sonra sağlayıcıya özgü oturum
  rota kurulumunun sahibidir.

Önerilen ayrım:

- Eşler/gruplar aranmasından önce olması gereken kategori kararları için `inferTargetChatType` kullanın.
- "Bunu açık/yerel hedef kimliği olarak ele al" denetimleri için `looksLikeId` kullanın.
- Geniş dizin araması için değil, sağlayıcıya özgü normalleştirme fallback'i için `resolveTarget` kullanın.
- Sohbet kimlikleri, iş parçacığı kimlikleri, JID'ler, tutamaçlar ve oda
  kimlikleri gibi sağlayıcıya özgü kimlikleri genel SDK
  alanlarında değil, `target` değerleri veya sağlayıcıya özgü parametreler içinde tutun.

## Yapılandırma destekli dizinler

Yapılandırmadan dizin girdileri türeten Plugin'ler bu mantığı
Plugin içinde tutmalı ve
`openclaw/plugin-sdk/directory-runtime` içindeki paylaşılan yardımcıları yeniden kullanmalıdır.

Bunu bir kanal yapılandırma destekli eşlere/gruplara ihtiyaç duyduğunda kullanın, örneğin:

- izin listesi güdümlü DM eşleri
- yapılandırılmış kanal/grup eşlemeleri
- hesap kapsamlı statik dizin fallback'leri

`directory-runtime` içindeki paylaşılan yardımcılar yalnızca genel işlemleri ele alır:

- sorgu filtreleme
- limit uygulama
- tekrar kaldırma/normalleştirme yardımcıları
- `ChannelDirectoryEntry[]` oluşturma

Kanala özgü hesap incelemesi ve kimlik normalleştirme,
Plugin uygulamasında kalmalıdır.

## Sağlayıcı katalogları

Sağlayıcı Plugin'leri çıkarım için
`registerProvider({ catalog: { run(...) { ... } } })` ile model katalogları tanımlayabilir.

`catalog.run(...)`, OpenClaw'ın
`models.providers` içine yazdığıyla aynı biçimi döndürür:

- tek sağlayıcı girdisi için `{ provider }`
- birden çok sağlayıcı girdisi için `{ providers }`

Eklenti sağlayıcıya özgü model kimliklerinin, temel URL varsayılanlarının veya auth geçitli model meta verilerinin sahibiyse
`catalog` kullanın.

`catalog.order`, bir Plugin'in kataloğunun OpenClaw'ın
yerleşik örtük sağlayıcılarına göre ne zaman birleştirileceğini denetler:

- `simple`: düz API anahtarı veya env güdümlü sağlayıcılar
- `profile`: auth profilleri olduğunda görünen sağlayıcılar
- `paired`: birden çok ilişkili sağlayıcı girdisi sentezleyen sağlayıcılar
- `late`: diğer örtük sağlayıcılardan sonra son geçiş

Anahtar çakışmasında sonraki sağlayıcılar kazanır; bu yüzden Plugin'ler aynı sağlayıcı kimliğine sahip bir
yerleşik sağlayıcı girdisini bilinçli olarak geçersiz kılabilir.

Uyumluluk:

- `discovery`, eski bir takma ad olarak hâlâ çalışır
- hem `catalog` hem `discovery` kaydedilmişse OpenClaw `catalog` kullanır

## Salt okunur kanal incelemesi

Plugin'iniz bir kanal kaydediyorsa, `resolveAccount(...)` yanında
`plugin.config.inspectAccount(cfg, accountId)` uygulamayı tercih edin.

Neden:

- `resolveAccount(...)` çalışma zamanı yoludur. Kimlik bilgilerinin
  tamamen somutlaştırıldığını varsayabilir ve gerekli gizli anahtarlar eksikse hızlıca başarısız olabilir.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` ve doctor/config
  onarım akışları gibi salt okunur komut yollarının yapılandırmayı açıklamak için çalışma zamanı kimlik bilgilerini somutlaştırması gerekmez.

Önerilen `inspectAccount(...)` davranışı:

- Yalnızca açıklayıcı hesap durumunu döndürün.
- `enabled` ve `configured` değerlerini koruyun.
- Gerekli olduğunda aşağıdakiler gibi kimlik bilgisi kaynak/durum alanlarını dahil edin:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Salt okunur kullanılabilirliği bildirmek için ham token değerlerini döndürmeniz gerekmez.
  Durum tarzı komutlar için `tokenStatus: "available"` (ve eşleşen kaynak
  alanı) döndürmek yeterlidir.
- Bir kimlik bilgisi SecretRef ile yapılandırılmış ama
  geçerli komut yolunda kullanılamıyorsa `configured_unavailable` kullanın.

Bu, salt okunur komutların hesabı yapılandırılmamış gibi yanlış bildirmek veya çökermek yerine
"yapılandırılmış ama bu komut yolunda kullanılamıyor" bilgisini vermesini sağlar.

## Paket paketleri

Bir Plugin dizini `openclaw.extensions` içeren bir `package.json` barındırabilir:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Her girdi bir Plugin olur. Paket birden çok extension listeliyorsa Plugin kimliği
`name/<fileBase>` olur.

Plugin'iniz npm bağımlılıkları içe aktarıyorsa, `node_modules`
kullanılabilir olsun diye bunları o dizine yükleyin (`npm install` / `pnpm install`).

Güvenlik korkuluğu: her `openclaw.extensions` girdisi, sembolik bağlantı çözümlemesinden sonra
Plugin dizini içinde kalmalıdır. Paket dizininden kaçan girdiler
reddedilir.

Güvenlik notu: `openclaw plugins install`, Plugin bağımlılıklarını
`npm install --omit=dev --ignore-scripts` ile kurar (yaşam döngüsü betikleri yok, çalışma zamanında geliştirici bağımlılıkları yok). Plugin bağımlılık
ağaçlarını "pure JS/TS" tutun ve `postinstall` derlemeleri gerektiren paketlerden kaçının.

İsteğe bağlı: `openclaw.setupEntry`, hafif bir yalnızca kurulum modülünü işaret edebilir.
OpenClaw, devre dışı bir kanal Plugin'i için kurulum yüzeylerine ihtiyaç duyduğunda veya
kanal Plugin'i etkin ama hâlâ yapılandırılmamış olduğunda
tam Plugin girişi yerine `setupEntry` yükler. Bu, ana Plugin girişiniz ayrıca araçlar, kancalar veya yalnızca çalışma zamanına özgü
başka kodlar bağlıyorsa başlangıcı ve kurulumu daha hafif tutar.

İsteğe bağlı: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`,
bir kanal Plugin'ini Gateway'in
dinleme öncesi başlangıç aşamasında, kanal zaten yapılandırılmış olsa bile aynı `setupEntry` yoluna katılacak şekilde işaretleyebilir.

Bunu yalnızca `setupEntry`, gateway dinlemeye başlamadan
önce var olması gereken başlangıç yüzeyini tam olarak kapsıyorsa kullanın. Uygulamada bu,
kurulum girdisinin başlangıcın bağlı olduğu her kanal sahipli yeteneği kaydetmesi gerektiği anlamına gelir; örneğin:

- kanal kaydının kendisi
- gateway dinlemeye başlamadan önce kullanılabilir olması gereken herhangi bir HTTP rota
- aynı pencere içinde var olması gereken herhangi bir gateway yöntemi, araç veya servis

Tam girişiniz hâlâ gerekli herhangi bir başlangıç yeteneğinin sahibiyse,
bu bayrağı etkinleştirmeyin. Plugin'i varsayılan davranışta bırakın ve OpenClaw'ın
başlangıç sırasında tam girişi yüklemesine izin verin.

Paketlenmiş kanallar ayrıca çekirdeğin tam kanal çalışma zamanı yüklenmeden önce
danışabileceği yalnızca kurulum sözleşme yüzeyi yardımcılarını da yayımlayabilir. Geçerli kurulum
yükseltme yüzeyi şudur:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Çekirdek, eski tek hesaplı kanal
yapılandırmasını tam Plugin girişini yüklemeden `channels.<id>.accounts.*` içine yükseltmesi gerektiğinde bu yüzeyi kullanır.
Matrix mevcut paketlenmiş örnektir: adlandırılmış hesaplar zaten varken yalnızca auth/bootstrap anahtarlarını
adlandırılmış yükseltilmiş bir hesaba taşır ve her zaman
`accounts.default` oluşturmak yerine yapılandırılmış kanonik olmayan varsayılan hesap anahtarını koruyabilir.

Bu kurulum yama bağdaştırıcıları, paketlenmiş sözleşme yüzeyi keşfini tembel tutar. İçe aktarma
zamanı hafif kalır; yükseltme yüzeyi modül içe aktarmada
paketlenmiş kanal başlangıcına yeniden girmek yerine yalnızca ilk kullanımda yüklenir.

Bu başlangıç yüzeyleri gateway RPC yöntemleri içerdiğinde,
bunları Plugin'e özgü bir önekte tutun. Çekirdek yönetici ad alanları (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) ayrılmış kalır ve bir Plugin
daha dar kapsam istese bile her zaman `operator.admin` olarak çözülür.

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

Kanal Plugin'leri kurulum/keşif meta verilerini `openclaw.channel` üzerinden ve
kurulum ipuçlarını `openclaw.install` üzerinden duyurabilir. Bu, çekirdek kataloğunu verisiz tutar.

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
      "blurb": "Nextcloud Talk Webhook bot'ları üzerinden self-hosted sohbet.",
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

Asgari örneğin ötesinde yararlı `openclaw.channel` alanları:

- `detailLabel`: daha zengin katalog/durum yüzeyleri için ikincil etiket
- `docsLabel`: belgeler bağlantısının bağlantı metnini geçersiz kılar
- `preferOver`: bu katalog girdisinin önüne geçmesi gereken daha düşük öncelikli Plugin/kanal kimlikleri
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: seçim yüzeyi kopya denetimleri
- `markdownCapable`: giden biçimlendirme kararları için kanalı markdown destekli olarak işaretler
- `exposure.configured`: `false` olduğunda kanalı yapılandırılmış kanal listeleme yüzeylerinden gizler
- `exposure.setup`: `false` olduğunda kanalı etkileşimli kurulum/yapılandırma seçicilerinden gizler
- `exposure.docs`: belgeler gezinme yüzeyleri için kanalı dahili/özel olarak işaretler
- `showConfigured` / `showInSetup`: uyumluluk için eski takma adlar hâlâ kabul edilir; `exposure` tercih edin
- `quickstartAllowFrom`: kanalı standart hızlı başlangıç `allowFrom` akışına katmayı sağlar
- `forceAccountBinding`: yalnızca bir hesap olsa bile açık hesap bağlaması gerektirir
- `preferSessionLookupForAnnounceTarget`: announce hedeflerini çözümlerken oturum aramasını tercih eder

OpenClaw ayrıca **harici kanal kataloglarını** da birleştirebilir (örneğin bir MPM
kayıt defteri dışa aktarımı). Bir JSON dosyasını şunlardan birine bırakın:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Veya `OPENCLAW_PLUGIN_CATALOG_PATHS` (ya da `OPENCLAW_MPM_CATALOG_PATHS`) değerini
bir veya daha fazla JSON dosyasına yönlendirin (virgül/noktalı virgül/`PATH` ile ayrılmış). Her dosya
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }` içermelidir. Ayrıştırıcı, `"entries"` anahtarı için eski takma adlar olarak `"packages"` veya `"plugins"` değerlerini de kabul eder.

Oluşturulmuş kanal katalog girdileri ve sağlayıcı kurulum katalog girdileri,
ham `openclaw.install` bloğunun yanında normalleştirilmiş kurulum kaynağı olgularını da açığa çıkarır. Normalleştirilmiş olgular,
npm spec'in tam sürüm mü yoksa kayan bir seçici mi olduğunu,
beklenen bütünlük meta verisinin mevcut olup olmadığını ve yerel bir
kaynak yolunun da bulunup bulunmadığını tanımlar. Katalog/paket kimliği bilindiğinde,
normalleştirilmiş olgular ayrıştırılan npm paket adının bu kimlikten kayması durumunda uyarır.
Ayrıca `defaultChoice` geçersizse veya
mevcut olmayan bir kaynağı işaret ediyorsa ve npm bütünlük meta verisi
geçerli bir npm kaynağı olmadan mevcutsa da uyarırlar. Tüketiciler `installSource` değerini
eklenti niteliğinde isteğe bağlı bir alan olarak değerlendirmelidir; böylece eski elle oluşturulmuş girdiler ve uyumluluk shim'leri
bunu sentezlemek zorunda kalmaz. Bu, onboarding ve tanılamaların
Plugin çalışma zamanını içe aktarmadan kaynak düzlemi durumunu açıklamasını sağlar.

Resmî harici npm girdileri tercihen tam bir `npmSpec` ile
`expectedIntegrity` kullanmalıdır. Çıplak paket adları ve dist-tag'ler uyumluluk için yine çalışır,
ancak katalog mevcut Plugin'leri bozmadan sabitlenmiş, bütünlük denetimli kurulumlara doğru ilerleyebilsin diye
kaynak düzlemi uyarıları üretirler.
Onboarding yerel bir katalog yolundan kurulum yaptığında,
mümkün olduğunda `source: "path"` ve çalışma alanına göre göreli bir
`sourcePath` ile bir `plugins.installs` girdisi kaydeder. Mutlak işletim yükleme yolu
`plugins.load.paths` içinde kalır; kurulum kaydı yerel iş istasyonu
yollarını uzun ömürlü yapılandırmaya kopyalamaktan kaçınır. Bu, yerel geliştirme kurulumlarını
ikinci bir ham dosya sistemi yolu açıklama yüzeyi eklemeden
kaynak düzlemi tanılamalarında görünür tutar.

## Bağlam motoru Plugin'leri

Bağlam motoru Plugin'leri oturum bağlamı düzenlemesinin, ingest, assemble
ve Compaction süreçlerinin sahibidir. Bunları
`api.registerContextEngine(id, factory)` ile Plugin'inizden kaydedin, sonra etkin motoru
`plugins.slots.contextEngine` ile seçin.

Plugin'inizin varsayılan bağlam
işlem hattısını yalnızca bellek araması veya kancalar eklemek yerine değiştirmesi ya da genişletmesi gerekiyorsa bunu kullanın.

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
uygulanmış olarak tutun ve açıkça ona devredin:

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

Bir Plugin mevcut API'ye uymayan davranışa ihtiyaç duyduğunda,
Plugin sistemini özel bir içe uzanmayla atlamayın. Eksik yeteneği ekleyin.

Önerilen sıra:

1. çekirdek sözleşmeyi tanımlayın
   Çekirdeğin sahip olması gereken paylaşılan davranışın ne olduğuna karar verin: ilke, fallback, yapılandırma birleştirme,
   yaşam döngüsü, kanala dönük semantik ve çalışma zamanı yardımcı biçimi.
2. tipli Plugin kayıt/çalışma zamanı yüzeyleri ekleyin
   `OpenClawPluginApi` ve/veya `api.runtime` yüzeyini en küçük yararlı
   tipli yetenek yüzeyiyle genişletin.
3. çekirdek + kanal/özellik tüketicilerini bağlayın
   Kanallar ve özellik Plugin'leri yeni yeteneği doğrudan bir satıcı uygulamasını içe aktararak değil,
   çekirdek üzerinden tüketmelidir.
4. satıcı uygulamalarını kaydedin
   Ardından satıcı Plugin'leri arka uçlarını yeteneğe karşı kaydeder.
5. sözleşme kapsamı ekleyin
   Sahiplik ve kayıt biçimi zaman içinde açık kalsın diye testler ekleyin.

OpenClaw bu şekilde tek bir
sağlayıcının dünya görüşüne sabit kodlanmadan görüş sahibi kalır. Somut bir dosya denetim listesi ve örnek için [Capability Cookbook](/tr/plugins/architecture)
bölümüne bakın.

### Yetenek denetim listesi

Yeni bir yetenek eklediğinizde uygulama genellikle bu
yüzeylere birlikte dokunmalıdır:

- `src/<capability>/types.ts` içindeki çekirdek sözleşme türleri
- `src/<capability>/runtime.ts` içindeki çekirdek çalıştırıcı/çalışma zamanı yardımcısı
- `src/plugins/types.ts` içindeki Plugin API kayıt yüzeyi
- `src/plugins/registry.ts` içindeki Plugin kayıt defteri bağlantısı
- özellik/kanal
  Plugin'lerinin onu tüketmesi gerektiğinde `src/plugins/runtime/*` içindeki Plugin çalışma zamanı açığa çıkarımı
- `src/test-utils/plugin-registration.ts` içindeki yakalama/test yardımcıları
- `src/plugins/contracts/registry.ts` içindeki sahiplik/sözleşme doğrulamaları
- `docs/` içindeki operatör/Plugin belgeleri

Bu yüzeylerden biri eksikse bu genellikle yeteneğin
henüz tam olarak entegre edilmediğinin işaretidir.

### Yetenek şablonu

Asgari kalıp:

```ts
// çekirdek sözleşme
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

// özellik/kanal plugin'leri için paylaşılan çalışma zamanı yardımcısı
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Sözleşme test kalıbı:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Bu kuralı basit tutar:

- çekirdek yetenek sözleşmesinin + düzenlemenin sahibidir
- satıcı Plugin'leri satıcı uygulamalarının sahibidir
- özellik/kanal Plugin'leri çalışma zamanı yardımcılarını tüketir
- sözleşme testleri sahipliği açık tutar

## İlgili

- [Plugin architecture](/tr/plugins/architecture) — genel yetenek modeli ve biçimler
- [Plugin SDK subpaths](/tr/plugins/sdk-subpaths)
- [Plugin SDK setup](/tr/plugins/sdk-setup)
- [Plugin oluşturma](/tr/plugins/building-plugins)
