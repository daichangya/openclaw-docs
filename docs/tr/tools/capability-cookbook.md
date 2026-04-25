---
read_when:
    - Yeni bir çekirdek yeteneği ve Plugin kayıt yüzeyi ekleme
    - Kodun çekirdeğe, bir sağlayıcı Plugin’ine veya bir özellik Plugin’ine ait olup olmadığını belirleme
    - Kanallar veya araçlar için yeni bir çalışma zamanı yardımcısını bağlama
sidebarTitle: Adding Capabilities
summary: OpenClaw Plugin sistemine yeni bir paylaşılan yetenek eklemeye yönelik katkıda bulunan kılavuzu
title: Yetenek ekleme (katkıda bulunan kılavuzu)
x-i18n:
    generated_at: "2026-04-25T13:58:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Bu, OpenClaw çekirdek geliştiricileri için bir **katkıda bulunan kılavuzudur**. Harici bir plugin geliştiriyorsanız bunun yerine [Building Plugins](/tr/plugins/building-plugins) bölümüne bakın.
</Info>

OpenClaw’ın görsel üretimi, video üretimi veya gelecekte sağlayıcı destekli başka bir özellik alanı gibi yeni bir etki alanına ihtiyacı olduğunda bunu kullanın.

Kural:

- plugin = sahiplik sınırı
- capability = paylaşılan çekirdek sözleşmesi

Bu, bir sağlayıcıyı doğrudan bir kanala veya araca bağlayarak başlamamanız gerektiği anlamına gelir. Yeteneği tanımlayarak başlayın.

## Ne zaman bir yetenek oluşturulmalı

Aşağıdakilerin tümü doğruysa yeni bir yetenek oluşturun:

1. birden fazla sağlayıcı bunu makul şekilde uygulayabilir
2. kanallar, araçlar veya özellik Plugin’leri sağlayıcıyı önemsemeden bunu tüketebilmelidir
3. geri dönüş, politika, yapılandırma veya teslim davranışı çekirdek tarafından sahiplenilmelidir

Çalışma yalnızca sağlayıcıya özgüyse ve henüz paylaşılan bir sözleşme yoksa durun ve önce sözleşmeyi tanımlayın.

## Standart sıra

1. Türlendirilmiş çekirdek sözleşmesini tanımlayın.
2. Bu sözleşme için Plugin kaydını ekleyin.
3. Paylaşılan bir çalışma zamanı yardımcısı ekleyin.
4. Kanıt olarak bir gerçek sağlayıcı Plugin’i bağlayın.
5. Özellik/kanal tüketicilerini çalışma zamanı yardımcısına taşıyın.
6. Sözleşme testlerini ekleyin.
7. Operatörlere yönelik yapılandırmayı ve sahiplik modelini belgelendirin.

## Ne nereye gider

Çekirdek:

- istek/yanıt türleri
- sağlayıcı kaydı + çözümleme
- geri dönüş davranışı
- yapılandırma şeması ile iç içe nesne, wildcard, dizi öğesi ve composition düğümlerinde yayılan `title` / `description` belge meta verileri
- çalışma zamanı yardımcı yüzeyi

Sağlayıcı Plugin’i:

- sağlayıcı API çağrıları
- sağlayıcı kimlik doğrulama işleme
- sağlayıcıya özgü istek normalleştirme
- yetenek uygulamasının kaydı

Özellik/kanal Plugin’i:

- `api.runtime.*` veya eşleşen `plugin-sdk/*-runtime` yardımcısını çağırır
- asla doğrudan bir sağlayıcı uygulamasını çağırmaz

## Sağlayıcı ve harness sınırları

Davranış, genel ajan döngüsünden ziyade model sağlayıcı sözleşmesine aitse sağlayıcı hook’larını kullanın. Buna, taşıma seçimi sonrası sağlayıcıya özgü istek parametreleri, auth-profile tercihi, prompt katmanları ve model/profile failover sonrası takip eden fallback yönlendirmesi örnek verilebilir.

Davranış, bir dönüşü çalıştıran çalışma zamanına aitse ajan harness hook’larını kullanın. Harness’ler, başarılı ancak kullanılamaz deneme sonuçlarını; örneğin boş, yalnızca muhakeme içeren veya yalnızca planlama içeren yanıtları sınıflandırabilir, böylece dış model fallback politikası yeniden deneme kararını verebilir.

Her iki sınırı da dar tutun:

- çekirdek yeniden deneme/fallback politikasına sahiptir
- sağlayıcı Plugin’leri sağlayıcıya özgü istek/kimlik doğrulama/yönlendirme ipuçlarına sahiptir
- harness Plugin’leri çalışma zamanına özgü deneme sınıflandırmasına sahiptir
- üçüncü taraf Plugin’leri çekirdek durumu doğrudan değiştirmek yerine ipuçları döndürür

## Dosya kontrol listesi

Yeni bir yetenek için şu alanlara dokunmayı bekleyin:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- bir veya daha fazla paketlenmiş Plugin paketi
- yapılandırma/belgeler/testler

## Örnek: görsel üretimi

Görsel üretimi standart yapıyı izler:

1. çekirdek `ImageGenerationProvider` tanımlar
2. çekirdek `registerImageGenerationProvider(...)` sunar
3. çekirdek `runtime.imageGeneration.generate(...)` sunar
4. `openai`, `google`, `fal` ve `minimax` Plugin’leri sağlayıcı destekli uygulamaları kaydeder
5. gelecekteki sağlayıcılar kanalları/araçları değiştirmeden aynı sözleşmeyi kaydedebilir

Yapılandırma anahtarı, vision-analysis yönlendirmesinden ayrıdır:

- `agents.defaults.imageModel` = görselleri analiz et
- `agents.defaults.imageGenerationModel` = görsel üret

Geri dönüş ve politikanın açık kalması için bunları ayrı tutun.

## Gözden geçirme kontrol listesi

Yeni bir yeteneği yayımlamadan önce şunları doğrulayın:

- hiçbir kanal/araç sağlayıcı kodunu doğrudan içe aktarmıyor
- paylaşılan yol çalışma zamanı yardımcısıdır
- en az bir sözleşme testi paketlenmiş sahipliği doğruluyor
- yapılandırma belgeleri yeni model/yapılandırma anahtarını adlandırıyor
- Plugin belgeleri sahiplik sınırını açıklıyor

Bir PR yetenek katmanını atlarsa ve sağlayıcı davranışını bir kanal/araca sabit kodlarsa, geri gönderin ve önce sözleşmeyi tanımlayın.

## İlgili

- [Plugin](/tr/tools/plugin)
- [Skills oluşturma](/tr/tools/creating-skills)
- [Araçlar ve Plugin’ler](/tr/tools)
