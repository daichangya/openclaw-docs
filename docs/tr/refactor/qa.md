---
read_when:
    - QA senaryo tanımlarını veya qa-lab harness kodunu yeniden düzenleme
    - QA davranışını Markdown senaryoları ile TypeScript harness mantığı arasında taşıma
summary: Senaryo kataloğu ve harness birleştirmesi için QA yeniden düzenleme planı
title: QA Yeniden Düzenleme
x-i18n:
    generated_at: "2026-04-23T09:10:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# QA Yeniden Düzenleme

Durum: temel geçiş tamamlandı.

## Hedef

OpenClaw QA'yı bölünmüş tanım modelinden tek bir doğruluk kaynağına taşımak:

- senaryo meta verileri
- modele gönderilen istemler
- kurulum ve teardown
- harness mantığı
- doğrulamalar ve başarı ölçütleri
- yapıtlar ve rapor ipuçları

İstenen son durum, davranışın çoğunu TypeScript içinde sabit yazmak yerine güçlü senaryo tanım dosyaları yükleyen genel bir QA harness'idir.

## Mevcut durum

Birincil doğruluk kaynağı artık `qa/scenarios/index.md` ile
`qa/scenarios/<theme>/*.md` altındaki senaryo başına bir dosyada yer alır.

Uygulananlar:

- `qa/scenarios/index.md`
  - kanonik QA paketi meta verileri
  - operatör kimliği
  - başlangıç görevi
- `qa/scenarios/<theme>/*.md`
  - senaryo başına bir Markdown dosyası
  - senaryo meta verileri
  - handler bağlamaları
  - senaryoya özgü yürütme yapılandırması
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown paket ayrıştırıcısı + zod doğrulaması
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - Markdown paketinden plan üretimi
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - oluşturulmuş uyumluluk dosyalarını ve `QA_SCENARIOS.md` dosyasını tohumlar
- `extensions/qa-lab/src/suite.ts`
  - yürütülebilir senaryoları Markdown tanımlı handler bağlamaları üzerinden seçer
- QA bus protokolü + UI
  - görsel/video/ses/dosya işleme için genel satır içi ekler

Kalan bölünmüş yüzeyler:

- `extensions/qa-lab/src/suite.ts`
  - hâlâ yürütülebilir özel handler mantığının çoğuna sahip
- `extensions/qa-lab/src/report.ts`
  - rapor yapısını hâlâ çalışma zamanı çıktılarından türetiyor

Dolayısıyla doğruluk kaynağı bölünmesi düzeltildi, ancak yürütme hâlâ tam bildirimsel olmak yerine çoğunlukla handler destekli.

## Gerçek senaryo yüzeyi nasıl görünüyor

Geçerli suite okunduğunda birkaç farklı senaryo sınıfı görülür.

### Basit etkileşim

- kanal temel çizgisi
- DM temel çizgisi
- thread'li takip
- model değiştirme
- onay tamamlama
- tepki/düzenleme/silme

### Yapılandırma ve çalışma zamanı mutasyonu

- config patch skill devre dışı bırakma
- config apply restart wake-up
- config restart yetenek değişimi
- çalışma zamanı envanter sapma denetimi

### Dosya sistemi ve depo doğrulamaları

- kaynak/belge keşif raporu
- Lobster Invaders build alma
- oluşturulmuş görsel yapıt araması

### Bellek orkestrasyonu

- bellek geri çağırma
- kanal bağlamında bellek araçları
- bellek hata geri dönüşü
- oturum belleği sıralaması
- thread bellek yalıtımı
- bellek Dreaming taraması

### Araç ve Plugin entegrasyonu

- MCP Plugin araç çağrısı
- Skills görünürlüğü
- Skills hot install
- yerel görsel oluşturma
- görsel gidiş-dönüş
- ekten görsel anlama

### Çok turlu ve çok aktörlü

- alt aracı devri
- alt aracı fanout sentezi
- yeniden başlatma kurtarma tarzı akışlar

Bu kategoriler önemlidir çünkü DSL gereksinimlerini yönlendirir. Düz bir istem + beklenen metin listesi yeterli değildir.

## Yön

### Tek doğruluk kaynağı

Yazılmış doğruluk kaynağı olarak `qa/scenarios/index.md` ile `qa/scenarios/<theme>/*.md` kullanın.

Paket şu özellikleri korumalıdır:

- incelemede insan tarafından okunabilir
- makine tarafından ayrıştırılabilir
- şunları yönlendirecek kadar zengin:
  - suite yürütmesi
  - QA çalışma alanı önyüklemesi
  - QA Lab UI meta verileri
  - belge/keşif istemleri
  - rapor üretimi

### Tercih edilen yazım biçimi

Üst düzey biçim olarak Markdown kullanın; içinde yapılandırılmış YAML olsun.

Önerilen şekil:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/sağlayıcı geçersiz kılmaları
  - prerequisites
- düz yazı bölümleri
  - objective
  - notes
  - debugging hints
- çitli YAML blokları
  - setup
  - steps
  - assertions
  - cleanup

Bu, şunları sağlar:

- dev JSON dosyalarına göre daha iyi PR okunabilirliği
- salt YAML'a göre daha zengin bağlam
- katı ayrıştırma ve zod doğrulaması

Ham JSON yalnızca ara oluşturulmuş biçim olarak kabul edilebilir.

## Önerilen senaryo dosyası şekli

Örnek:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## DSL'nin kapsaması gereken yürütücü yetenekleri

Geçerli suite'e göre, genel yürütücü yalnızca istem yürütmekten fazlasına ihtiyaç duyar.

### Ortam ve kurulum eylemleri

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Aracı turu eylemleri

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Yapılandırma ve çalışma zamanı eylemleri

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Dosya ve yapıt eylemleri

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Bellek ve Cron eylemleri

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP eylemleri

- `mcp.callTool`

### Doğrulamalar

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Değişkenler ve yapıt başvuruları

DSL, kaydedilmiş çıktıları ve daha sonraki başvuruları desteklemelidir.

Geçerli suite'ten örnekler:

- bir thread oluşturup sonra `threadId` yeniden kullanmak
- bir oturum oluşturup sonra `sessionKey` yeniden kullanmak
- bir görsel üretip sonra dosyayı sonraki turda eklemek
- bir wake işaretleyici dizesi üretip sonra bunun daha sonra göründüğünü doğrulamak

Gerekli yetenekler:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- yollar, oturum anahtarları, thread kimlikleri, işaretleyiciler, araç çıktıları için türlenmiş başvurular

Değişken desteği olmadan harness, senaryo mantığını TypeScript'e geri sızdırmaya devam edecektir.

## Kaçış kapıları olarak kalması gerekenler

Tamamen salt bildirimsel bir yürütücü, 1. aşamada gerçekçi değildir.

Bazı senaryolar doğası gereği orkestrasyon ağırlıklıdır:

- bellek Dreaming taraması
- config apply restart wake-up
- config restart yetenek değişimi
- zaman damgası/yol ile oluşturulmuş görsel yapıt çözümleme
- discovery-report değerlendirmesi

Bunlar şimdilik açık özel handler'lar kullanmalıdır.

Önerilen kural:

- %85-90 bildirimsel
- zor kalan bölüm için açık `customHandler` adımları
- yalnızca adlandırılmış ve belgelenmiş özel handler'lar
- senaryo dosyasında anonim satır içi kod yok

Bu, yine de ilerlemeye izin verirken genel motoru temiz tutar.

## Mimari değişiklik

### Mevcut

Senaryo Markdown'u hâlihazırda şu alanlar için doğruluk kaynağıdır:

- suite yürütmesi
- çalışma alanı önyükleme dosyaları
- QA Lab UI senaryo kataloğu
- rapor meta verileri
- keşif istemleri

Oluşturulmuş uyumluluk:

- tohumlanmış çalışma alanı hâlâ `QA_KICKOFF_TASK.md` içeriyor
- tohumlanmış çalışma alanı hâlâ `QA_SCENARIO_PLAN.md` içeriyor
- tohumlanmış çalışma alanı artık ayrıca `QA_SCENARIOS.md` içeriyor

## Yeniden düzenleme planı

### Aşama 1: yükleyici ve şema

Tamamlandı.

- `qa/scenarios/index.md` eklendi
- senaryolar `qa/scenarios/<theme>/*.md` dosyalarına bölündü
- adlandırılmış Markdown YAML paket içeriği için ayrıştırıcı eklendi
- zod ile doğrulandı
- tüketiciler ayrıştırılmış pakete geçirildi
- depo düzeyindeki `qa/seed-scenarios.json` ve `qa/QA_KICKOFF_TASK.md` kaldırıldı

### Aşama 2: genel motor

- `extensions/qa-lab/src/suite.ts` şu parçalara bölünsün:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- mevcut yardımcı işlevler motor işlemleri olarak korunsun

Teslimat:

- motor basit bildirimsel senaryoları yürütür

Çoğunlukla istem + bekle + doğrula olan senaryolarla başlayın:

- thread'li takip
- ekten görsel anlama
- Skills görünürlüğü ve çağrımı
- kanal temel çizgisi

Teslimat:

- genel motor üzerinden gönderilen ilk gerçek Markdown tanımlı senaryolar

### Aşama 4: orta karmaşıklıktaki senaryoları taşıyın

- görsel üretimi gidiş-dönüş
- kanal bağlamında bellek araçları
- oturum belleği sıralaması
- alt aracı devri
- alt aracı fanout sentezi

Teslimat:

- değişkenler, yapıtlar, araç doğrulamaları, request-log doğrulamaları kanıtlanmış olur

### Aşama 5: zor senaryoları özel handler'larda tutun

- bellek Dreaming taraması
- config apply restart wake-up
- config restart yetenek değişimi
- çalışma zamanı envanter sapması

Teslimat:

- aynı yazım biçimi, ancak gerektiğinde açık custom-step bloklarıyla

### Aşama 6: sabit kodlanmış senaryo eşlemesini silin

Paket kapsamı yeterince iyi olduğunda:

- `extensions/qa-lab/src/suite.ts` içindeki senaryoya özgü TypeScript dallanmasının çoğunu kaldırın

## Sahte Slack / zengin medya desteği

Geçerli QA bus metin önceliklidir.

İlgili dosyalar:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Bugün QA bus şunları destekler:

- metin
- tepkiler
- thread'ler

Henüz satır içi medya eklerini modellemiyor.

### Gerekli taşıma sözleşmesi

Genel bir QA bus ek modeli ekleyin:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Ardından `attachments?: QaBusAttachment[]` alanını şuralara ekleyin:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Neden önce genel

Yalnızca Slack'e özgü bir medya modeli oluşturmayın.

Bunun yerine:

- tek bir genel QA taşıma modeli
- bunun üzerine birden çok render edici
  - geçerli QA Lab sohbeti
  - gelecekteki sahte Slack web
  - diğer sahte taşıma görünümleri

Bu, yinelenen mantığı önler ve medya senaryolarının taşımadan bağımsız kalmasını sağlar.

### Gerekli UI çalışması

QA UI'ını şunları render edecek şekilde güncelleyin:

- satır içi görsel önizleme
- satır içi ses oynatıcı
- satır içi video oynatıcı
- dosya eki chip'i

Geçerli UI zaten thread'leri ve tepkileri render edebildiği için ek render etme işlemi aynı ileti kartı modeli üzerine katmanlanmalıdır.

### Medya taşımasının etkinleştirdiği senaryo çalışması

Ekler QA bus üzerinden akmaya başladıktan sonra daha zengin sahte sohbet senaryoları ekleyebiliriz:

- sahte Slack'te satır içi görsel yanıtı
- ses eki anlama
- video eki anlama
- karma ek sıralaması
- medyayı koruyan thread yanıtı

## Öneri

Bir sonraki uygulama parçası şunlar olmalıdır:

1. Markdown senaryo yükleyicisi + zod şeması ekle
2. geçerli kataloğu Markdown'dan üret
3. önce birkaç basit senaryoyu taşı
4. genel QA bus ek desteği ekle
5. QA UI'ında satır içi görseli render et
6. sonra ses ve videoya genişlet

Bu, her iki hedefi de kanıtlayan en küçük yoldur:

- genel Markdown tanımlı QA
- daha zengin sahte mesajlaşma yüzeyleri

## Açık sorular

- senaryo dosyalarının değişken enterpolasyonu içeren gömülü Markdown istem şablonlarına izin verip vermemesi
- kurulum/cleanup bölümlerinin adlandırılmış bölümler mi yoksa yalnızca sıralı eylem listeleri mi olması gerektiği
- yapıt başvurularının şemada güçlü biçimde türlenmiş mi yoksa dize tabanlı mı olması gerektiği
- özel handler'ların tek bir kayıt defterinde mi yoksa yüzey başına kayıt defterlerinde mi yaşaması gerektiği
- oluşturulan JSON uyumluluk dosyasının geçiş sırasında işlenmiş olarak tutulup tutulmaması gerektiği
