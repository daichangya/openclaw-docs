---
read_when:
    - Geniş kapsamlı bir OpenClaw uygulama modernizasyon geçişi planlama
    - Uygulama veya Control UI çalışmaları için ön uç uygulama standartlarını güncelleme
    - Geniş bir ürün kalite incelemesini aşamalı mühendislik çalışmasına dönüştürme
summary: Ön uç teslim yeteneği güncellemeleriyle kapsamlı uygulama modernizasyon planı
title: Uygulama modernizasyon planı
x-i18n:
    generated_at: "2026-04-25T13:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667a133cb867bb1d4d09e097925704c8b77d20ca6117a62a4c60d29ab1097283
    source_path: reference/application-modernization-plan.md
    workflow: 15
---

# Uygulama modernizasyon planı

## Hedef

Uygulamayı, mevcut iş akışlarını bozmadan veya riski geniş çaplı yeniden düzenlemelerde gizlemeden daha temiz, daha hızlı, daha bakımı kolay bir ürüne doğru taşımak. Çalışma, dokunulan her yüzey için kanıtla birlikte küçük, gözden geçirilebilir dilimler halinde teslim edilmelidir.

## İlkeler

- Bir sınırın açıkça karmaşa, performans maliyeti veya kullanıcıya görünür hatalara neden olduğu gösterilmedikçe mevcut mimariyi koruyun.
- Her sorun için mümkün olan en küçük doğru yamayı tercih edin, sonra bunu tekrarlayın.
- Gerekli düzeltmeleri isteğe bağlı cilalamadan ayırın; böylece sorumlular yüksek değerli işleri öznel kararları beklemeden teslim edebilir.
- Plugin'e yönelik davranışı belgelenmiş ve geriye uyumlu tutun.
- Bir regresyonun düzeltildiğini iddia etmeden önce gönderilmiş davranışı, bağımlılık sözleşmelerini ve testleri doğrulayın.
- Önce ana kullanıcı yolunu iyileştirin: ilk kurulum, kimlik doğrulama, sohbet, sağlayıcı kurulumu, Plugin yönetimi ve tanılama.

## Aşama 1: Temel denetim

Değişiklik yapmadan önce mevcut uygulamanın envanterini çıkarın.

- En önemli kullanıcı iş akışlarını ve bunların sahibi olan kod yüzeylerini belirleyin.
- Ölü affordance'ları, yinelenen ayarları, belirsiz hata durumlarını ve pahalı render yollarını listeleyin.
- Her yüzey için geçerli doğrulama komutlarını yakalayın.
- Sorunları gerekli, önerilen veya isteğe bağlı olarak işaretleyin.
- Özellikle API, güvenlik, sürüm ve Plugin sözleşmesi değişiklikleri olmak üzere sahip incelemesi gerektiren bilinen engelleri belgeleyin.

Tamamlanma tanımı:

- Repo kökü dosya başvurularıyla tek bir sorun listesi.
- Her sorunda önem derecesi, sahibi olan yüzey, beklenen kullanıcı etkisi ve önerilen doğrulama yolu bulunur.
- Spekülatif temizlik öğeleri gerekli düzeltmelerle karıştırılmaz.

## Aşama 2: Ürün ve UX temizliği

Görünür iş akışlarını önceliklendirin ve kafa karışıklığını kaldırın.

- Model kimlik doğrulaması, gateway durumu ve Plugin kurulumu etrafındaki ilk kurulum metinlerini ve boş durumları sıkılaştırın.
- Eylem mümkün değilse ölü affordance'ları kaldırın veya devre dışı bırakın.
- Önemli eylemleri kırılgan yerleşim varsayımlarının arkasına gizlemek yerine duyarlı genişlikler boyunca görünür tutun.
- Hataların tek bir doğruluk kaynağına sahip olması için yinelenen durum dilini birleştirin.
- Gelişmiş ayarlar için aşamalı görünürlük eklerken çekirdek kurulumu hızlı tutun.

Önerilen doğrulama:

- İlk çalıştırma kurulumu ve mevcut kullanıcı başlangıcı için el ile mutlu yol.
- Herhangi bir yönlendirme, yapılandırma kalıcılığı veya durum türetme mantığı için odaklı testler.
- Değişen duyarlı yüzeyler için browser ekran görüntüleri.

## Aşama 3: Ön uç mimarisini sıkılaştırma

Geniş bir yeniden yazım olmadan bakımı kolaylaştırın.

- Yinelenen UI durum dönüşümlerini dar tipli yardımcı fonksiyonlara taşıyın.
- Veri getirme, kalıcılık ve sunum sorumluluklarını ayrı tutun.
- Yeni soyutlamalar yerine mevcut hook'ları, store'ları ve bileşen desenlerini tercih edin.
- Aşırı büyük bileşenleri yalnızca bağlılığı azaltıyor veya testleri netleştiriyorsa bölün.
- Yerel panel etkileşimleri için geniş kapsamlı genel durum eklemekten kaçının.

Gerekli korumalar:

- Dosya bölmenin yan etkisi olarak genel davranışı değiştirmeyin.
- Menüler, iletişim kutuları, sekmeler ve klavye gezinmesi için erişilebilirlik davranışını koruyun.
- Yükleme, boş, hata ve iyimser durumların hâlâ render edildiğini doğrulayın.

## Aşama 4: Performans ve güvenilirlik

Geniş teorik optimizasyondan ziyade ölçülmüş acı noktalarını hedefleyin.

- Başlangıç, rota geçişi, büyük liste ve sohbet transcript maliyetlerini ölçün.
- Profil çıkarma değerini kanıtladığında yinelenen pahalı türetilmiş verileri memoized selector'lar veya önbellekli yardımcılarla değiştirin.
- Sıcak yollardaki kaçınılabilir ağ veya dosya sistemi taramalarını azaltın.
- Model payload oluşturulmadan önce istem, kayıt defteri, dosya, Plugin ve ağ girdileri için deterministik sıralamayı koruyun.
- Sıcak yardımcılar ve sözleşme sınırları için hafif regresyon testleri ekleyin.

Tamamlanma tanımı:

- Her performans değişikliği temel durumu, beklenen etkiyi, gerçek etkiyi ve kalan açığı kaydeder.
- Ucuz ölçüm mevcutken hiçbir performans yaması yalnızca sezgiye dayanarak gönderilmez.

## Aşama 5: Tür, sözleşme ve test sıkılaştırma

Kullanıcıların ve Plugin yazarlarının bağımlı olduğu sınır noktalarında doğruluğu artırın.

- Gevşek çalışma zamanı dizelerini discriminated union'lar veya kapalı kod listeleriyle değiştirin.
- Harici girdileri mevcut şema yardımcıları veya zod ile doğrulayın.
- Plugin manifest'leri, sağlayıcı katalogları, gateway protokol mesajları ve yapılandırma geçiş davranışı etrafında sözleşme testleri ekleyin.
- Uyumluluk yollarını başlangıç zamanı gizli geçişler yerine doctor veya onarım akışlarında tutun.
- Plugin iç yapılarına yalnızca test amaçlı bağlılıktan kaçının; SDK facade'larını ve belgelenmiş barrel'ları kullanın.

Önerilen doğrulama:

- `pnpm check:changed`
- Değiştirilen her sınır için hedefli testler.
- Lazy sınırlar, paketleme veya yayımlanmış yüzeyler değiştiğinde `pnpm build`.

## Aşama 6: Belgeler ve sürüme hazırlık

Kullanıcıya dönük belgeleri davranışla uyumlu tutun.

- Davranış, API, yapılandırma, ilk kurulum veya Plugin değişiklikleriyle birlikte belgeleri güncelleyin.
- Changelog girdilerini yalnızca kullanıcıya görünür değişiklikler için ekleyin.
- Kullanıcıya dönük alanda Plugin terminolojisini koruyun; dahili paket adlarını yalnızca katkı verenler için gerektiğinde kullanın.
- Sürüm ve kurulum talimatlarının hâlâ geçerli komut yüzeyiyle eşleştiğini doğrulayın.

Tamamlanma tanımı:

- İlgili belgeler, davranış değişiklikleriyle aynı dalda güncellenir.
- Dokunulduğunda üretilmiş belge veya API kayması denetimleri geçer.
- Devir notunda atlanan doğrulamalar ve neden atlandıkları belirtilir.

## Önerilen ilk dilim

Kapsamlı bir Control UI ve ilk kurulum geçişiyle başlayın:

- İlk çalıştırma kurulumu, sağlayıcı auth hazırlığı, gateway durumu ve Plugin kurulum yüzeylerini denetleyin.
- Ölü eylemleri kaldırın ve hata durumlarını netleştirin.
- Durum türetme ve yapılandırma kalıcılığı için odaklı testler ekleyin veya güncelleyin.
- `pnpm check:changed` çalıştırın.

Bu, sınırlı mimari riskle yüksek kullanıcı değeri sağlar.

## Ön uç skill güncellemesi

Modernizasyon göreviyle birlikte verilen ön uç odaklı `SKILL.md` dosyasını güncellemek için bu bölümü kullanın. Bu kılavuzu depo yerel bir OpenClaw skill'i olarak benimserken önce `.agents/skills/openclaw-frontend/SKILL.md` oluşturun, hedef skill'e ait frontmatter'ı koruyun, sonra aşağıdaki içerikle gövde kılavuzunu ekleyin veya değiştirin.

```markdown
# Ön Uç Teslim Standartları

Bu skill'i kullanıcıya dönük React, Next.js,
masaüstü webview veya uygulama UI çalışmasını uygularken ya da incelerken kullanın.

## Çalışma kuralları

- Mevcut ürün iş akışından ve kod kurallarından başlayın.
- Geçerli kullanıcı yolunu iyileştiren mümkün olan en küçük doğru yamayı tercih edin.
- Devir notunda gerekli düzeltmeleri isteğe bağlı cilalamadan ayırın.
- İstek bir uygulama yüzeyi içinken pazarlama sayfaları oluşturmayın.
- Desteklenen viewport boyutlarında eylemleri görünür ve kullanılabilir tutun.
- İşlev görmeyen denetimleri bırakmak yerine ölü affordance'ları kaldırın.
- Yükleme, boş, hata, başarı ve izin durumlarını koruyun.
- Yeni ilkelere eklemeden önce mevcut tasarım sistemi bileşenlerini, hook'ları, store'ları ve simgeleri kullanın.

## Uygulama kontrol listesi

1. Birincil kullanıcı görevini ve ona sahip olan bileşeni veya rotayı belirleyin.
2. Düzenlemeden önce yerel bileşen desenlerini okuyun.
3. Sorunu çözen en dar yüzeyi yamalayın.
4. Metin ve hover durumlarının yerleşimi beklenmedik şekilde yeniden boyutlandıramaması için sabit biçimli denetimler, araç çubukları, ızgaralar ve sayaçlar için duyarlı kısıtlamalar ekleyin.
5. Veri yükleme, durum türetme ve render sorumluluklarını net tutun.
6. Mantık, kalıcılık, yönlendirme, izinler veya paylaşılan yardımcılar değiştiğinde test ekleyin.
7. Ana mutlu yolu ve en ilgili uç durumu doğrulayın.

## Görsel kalite kapıları

- Metin mobilde ve masaüstünde kapsayıcısına sığmalıdır.
- Araç çubukları sarılabilir, ancak denetimler erişilebilir kalmalıdır.
- Simge metinden daha açıksa düğmeler tanıdık simgeler kullanmalıdır.
- Kartlar tekrarlanan öğeler, modallar ve çerçeveli araçlar için kullanılmalı, her sayfa bölümü için değil.
- Operasyonel içerikle yarışan tek notalı renk paletlerinden ve dekoratif arka planlardan kaçının.
- Yoğun ürün yüzeyleri tarama, karşılaştırma ve tekrar eden kullanım için optimize edilmelidir.

## Devir biçimi

Şunları bildirin:

- Ne değişti.
- Hangi kullanıcı davranışının değiştiği.
- Geçen gerekli doğrulama.
- Atlanan doğrulamalar ve somut nedenleri.
- Gerekli düzeltmelerden açıkça ayrılmış isteğe bağlı takip çalışmaları.
```
