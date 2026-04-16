---
read_when:
    - qa-lab veya qa-channel genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha gerçekçi QA otomasyonu oluşturma
summary: qa-lab, qa-channel, seeded senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA Uçtan Uca Otomasyonu
x-i18n:
    generated_at: "2026-04-16T21:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7deefda1c90a0d2e21e2155ffd8b585fb999e7416bdbaf0ff57eb33ccc063afc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA Uçtan Uca Otomasyonu

Özel QA yığını, OpenClaw’ı tek birim testinin sağlayabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, ileti dizisi, tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek, gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı arayüzü ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA senaryoları için depo destekli tohum varlıkları.

Mevcut QA operatörü akışı iki panelli bir QA sitesidir:

- Sol: ajanla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri transkript ve senaryo planını gösteren QA Lab.

Bunu şu komutla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli Gateway şeridini başlatır ve bir operatörün
veya otomasyon döngüsünün ajana bir QA görevi verebildiği, gerçek kanal davranışını
gözlemleyebildiği ve neyin çalıştığını, neyin başarısız olduğunu veya neyin engelli
kaldığını kaydedebildiği QA Lab sayfasını açığa çıkarır.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab UI yinelemesi için,
yığını bind-mounted bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` kapsayıcısına bind-mount eder. `qa:lab:watch`
bu paketi değişikliklerde yeniden derler ve QA Lab varlık karması değiştiğinde tarayıcı
otomatik olarak yeniden yüklenir.

Taşıma açısından gerçek bir Matrix smoke şeridi için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu şerit, Docker’da tek kullanımlık bir Tuwunel homeserver hazırlar, geçici sürücü, SUT
ve gözlemci kullanıcılarını kaydeder, bir özel oda oluşturur ve ardından gerçek Matrix
Plugin’ini bir QA Gateway alt süreci içinde çalıştırır. Canlı taşıma şeridi, alt süreç
yapılandırmasını test edilen taşımaya göre kapsamlandırılmış tutar; böylece Matrix, alt
süreç yapılandırmasında `qa-channel` olmadan çalışır. Yapılandırılmış rapor çıktılarını
ve birleşik stdout/stderr günlüğünü seçilen Matrix QA çıktı dizinine yazar. Dıştaki
`scripts/run-node.mjs` derleme/başlatıcı çıktısını da yakalamak için,
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` değişkenini depo içi bir günlük dosyasına ayarlayın.

Taşıma açısından gerçek bir Telegram smoke şeridi için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu şerit, tek kullanımlık bir sunucu hazırlamak yerine bir gerçek özel Telegram grubunu
hedefler. `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir; ayrıca aynı özel grupta iki farklı bot
bulunmalıdır. SUT botunun bir Telegram kullanıcı adı olmalıdır ve bottan-bota gözlem,
her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode etkin olduğunda en iyi
şekilde çalışır.

Canlı taşıma şeritleri artık her birinin kendi senaryo listesi biçimini icat etmesi yerine
tek ve daha küçük bir sözleşmeyi paylaşır:

`qa-channel`, geniş sentetik ürün davranışı paketidir ve canlı taşıma kapsama matrisinin
bir parçası değildir.

| Şerit    | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatmada sürdürme | İleti dizisi takibi | İleti dizisi yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | --------------------------- | ------------------- | --------------------- | ------------- | ------------- |
| Matrix   | x      | x              | x               | x               | x                           | x                   | x                     | x             |               |
| Telegram | x      |                |                 |                 |                             |                     |                       |               | x             |

Bu, `qa-channel`’ı geniş ürün davranışı paketi olarak korurken Matrix,
Telegram ve gelecekteki canlı taşıma türlerinin tek bir açık taşıma sözleşmesi
kontrol listesini paylaşmasını sağlar.

QA yoluna Docker katmadan tek kullanımlık bir Linux VM şeridi için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass konuğunu başlatır, bağımlılıkları kurar, konuğun içinde
OpenClaw’ı derler, `qa suite` çalıştırır, ardından normal QA raporunu ve özeti
ana makinedeki `.artifacts/qa-e2e/...` içine geri kopyalar.
Ana makinedeki `qa suite` ile aynı senaryo seçme davranışını yeniden kullanır.
Ana makine ve Multipass paket çalıştırmaları, varsayılan olarak yalıtılmış Gateway
çalışanlarıyla birden fazla seçili senaryoyu paralel çalıştırır; üst sınır 64 çalışan
veya seçilen senaryo sayısıdır. Çalışan sayısını ayarlamak için `--concurrency <count>`,
seri yürütme içinse `--concurrency 1` kullanın.
Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini
iletir: ortam değişkeni tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu
ve mevcutsa `CODEX_HOME`. Konuğun bağlanmış çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini depo kökü altında tutun.

## Depo destekli tohumlar

Tohum varlıkları `qa/` altında bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Bunlar, QA planının hem insanlar hem de ajan tarafından görülebilmesi için bilerek git içinde tutulur.

`qa-lab` genel amaçlı bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown
dosyası tek bir test çalıştırmasının doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- belge ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı Gateway yapılandırma yaması
- çalıştırılabilir `qa-flow`

`qa-flow`’u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel ve farklı
alanları kesen yapıda kalmasına izin verilir. Örneğin markdown senaryoları, özel amaçlı
bir çalıştırıcı eklemeden, gömülü Control UI’yi Gateway `browser.request` bağlantı yüzeyi
üzerinden süren tarayıcı tarafı yardımcılarla taşıma tarafı yardımcılarını birleştirebilir.

Temel liste, şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- ileti dizisi davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellekten geri çağırma
- model değiştirme
- alt ajan devri
- depoyu okuma ve belgeleri okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Taşıma bağdaştırıcıları

`qa-lab`, markdown QA senaryoları için genel bir taşıma bağlantı yüzeyine sahiptir.
`qa-channel` bu bağlantı yüzeyindeki ilk bağdaştırıcıdır, ancak tasarım hedefi daha geniştir:
gelecekteki gerçek veya sentetik kanallar, taşıma özelinde bir QA çalıştırıcısı eklemek yerine
aynı paket çalıştırıcıya takılmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab` genel senaryo yürütme, çalışan eşzamanlılığı, çıktı yazma ve raporlamaya sahiptir.
- taşıma bağdaştırıcısı Gateway yapılandırması, hazır olma durumu, gelen ve giden gözlem, taşıma eylemleri ve normalleştirilmiş taşıma durumuna sahiptir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab` ise bunu yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

Yeni kanal bağdaştırıcıları için bakım sorumlularına yönelik uyarlama rehberi
[Testing](/tr/help/testing#adding-a-channel-to-qa) bölümünde bulunur.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu sorulara yanıt vermelidir:

- Ne çalıştı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemek değerlidir

Karakter ve stil kontrolleri için aynı senaryoyu birden fazla canlı model ref’i üzerinde
çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Komut, Docker değil, yerel QA Gateway alt süreçleri çalıştırır. Karakter değerlendirme
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi normal kullanıcı dönüşlerini çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam transkripti korur, temel çalışma istatistiklerini
kaydeder, ardından doğal olma, hava ve mizah açısından çalıştırmaları sıralamaları için
değerlendirici modellere hızlı modda ve `xhigh` akıl yürütmeyle sorar.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirme istemi yine her
transkripti ve çalışma durumunu alır, ancak aday ref’leri `candidate-01` gibi nötr etiketlerle
değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek ref’lere geri eşler.
Aday çalıştırmaları varsayılan olarak `high` düşünme düzeyi kullanır; bunu destekleyen OpenAI
modelleri için `xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ genel
bir yedek değer ayarlar ve eski `--model-thinking <provider/model=level>` biçimi uyumluluk için
korunur.
OpenAI aday ref’leri varsayılan olarak hızlı mod kullanır; böylece sağlayıcının desteklediği
yerlerde öncelikli işleme kullanılır. Tek bir aday veya değerlendirici için geçersiz kılma
gerekiyorsa satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu her aday model
için zorla açmak istediğinizde yalnızca `--fast` geçin. Aday ve değerlendirici süreleri kıyaslama
analizi için rapora kaydedilir, ancak değerlendirici istemleri açıkça hıza göre sıralama
yapılmamasını söyler.
Hem aday hem de değerlendirici model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır.
Sağlayıcı sınırları veya yerel Gateway yükü çalıştırmayı fazla gürültülü hale getiriyorsa
`--concurrency` veya `--judge-concurrency` değerlerini düşürün.
Aday `--model` geçirilmediğinde karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Değerlendirici `--judge-model` geçirilmediğinde değerlendiriciler varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili belgeler

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Dashboard](/web/dashboard)
