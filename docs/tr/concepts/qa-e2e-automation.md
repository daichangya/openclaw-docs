---
read_when:
    - qa-lab veya qa-channel genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçiliğe sahip QA otomasyonu oluşturma
summary: qa-lab, qa-channel, önceden hazırlanmış senaryolar ve protokol raporları için özel QA otomasyonu yapısı
title: QA uçtan uca otomasyonu
x-i18n:
    generated_at: "2026-04-23T13:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA Uçtan Uca Otomasyonu

Özel QA yığını, OpenClaw’ı tek bir birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, ileti dizisi, tepki,
  düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: dökümü gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı UI’si ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli tohum varlıklar.

Mevcut QA operatörü akışı iki panelli bir QA sitesidir:

- Sol: ajanla birlikte Gateway panosu (Kontrol UI’si).
- Sağ: Slack benzeri dökümü ve senaryo planını gösteren QA Lab.

Bunu şu komutla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün ajana bir QA
görevi verebildiği, gerçek kanal davranışını gözlemleyebildiği ve neyin işe yaradığını,
neyin başarısız olduğunu veya neyin engelli kaldığını kaydedebildiği QA Lab sayfasını açığa çıkarır.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab UI geliştirmesi için,
yığını bind-mount edilen bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` konteynerine bind-mount eder. `qa:lab:watch`
bu paketi değişiklik olduğunda yeniden derler ve QA Lab varlık karması değiştiğinde
tarayıcı otomatik olarak yeniden yüklenir.

Taşıma katmanı açısından gerçek bir Matrix duman testi hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu hat, Docker içinde atılabilir bir Tuwunel homeserver kurar, geçici
sürücü, SUT ve gözlemci kullanıcılarını kaydeder, bir özel oda oluşturur, ardından
gerçek Matrix plugin’ini bir QA gateway alt süreci içinde çalıştırır. Canlı taşıma hattı,
alt süreç yapılandırmasını test edilen taşımayla sınırlı tutar; bu nedenle Matrix,
alt süreç yapılandırmasında `qa-channel` olmadan çalışır. Yapılandırılmış rapor çıktılarını ve
birleştirilmiş stdout/stderr günlüğünü seçilen Matrix QA çıktı dizinine yazar.
Dıştaki `scripts/run-node.mjs` derleme/başlatıcı çıktısını da yakalamak için,
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` değerini depo içi bir günlük dosyasına ayarlayın.

Taşıma katmanı açısından gerçek bir Telegram duman testi hattı için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu hat, atılabilir bir sunucu kurmak yerine tek bir gerçek özel Telegram grubunu hedefler.
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir; ayrıca aynı
özel grupta iki farklı bot gerekir. SUT botunun bir Telegram kullanıcı adına sahip olması gerekir ve
botlar arası gözlem, her iki botta da
`@BotFather` içinde Bot-to-Bot Communication Mode etkin olduğunda en iyi şekilde çalışır.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan bir çıkış koduyla sonlanır.
Başarısız çıkış kodu olmadan çıktı almak istediğinizde `--allow-failures` kullanın.
Telegram raporu ve özeti, kanaryadan başlayarak sürücü mesajı
gönderme isteğinden gözlemlenen SUT yanıtına kadar her yanıt için RTT’yi içerir.

Canlı taşıma hatları artık her birinin kendi senaryo listesi biçimini icat etmesi yerine
tek bir daha küçük sözleşmeyi paylaşır:

`qa-channel`, geniş sentetik ürün davranışı paketi olarak kalır ve
canlı taşıma kapsam matrisinin parçası değildir.

| Hat      | Kanarya | Mention gating | İzin listesi engeli | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | İleti dizisi devamı | İleti dizisi yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------- | -------------- | ------------------- | --------------- | --------------------------------- | ------------------- | --------------------- | ------------- | ------------- |
| Matrix   | x       | x              | x                   | x               | x                                 | x                   | x                     | x             |               |
| Telegram | x       |                |                     |                 |                                   |                     |                       |               | x            |

Bu, `qa-channel`ı geniş ürün davranışı paketi olarak tutarken Matrix,
Telegram ve gelecekteki canlı taşımaların açık bir taşıma sözleşmesi kontrol listesini paylaşmasını sağlar.

Docker’ı QA yoluna dahil etmeden atılabilir bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass konuğu başlatır, bağımlılıkları kurar, OpenClaw’ı konuğun içinde derler,
`qa suite` çalıştırır, ardından normal QA raporunu ve
özetini ana makinede `.artifacts/qa-e2e/...` içine geri kopyalar.
Bu, ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Ana makine ve Multipass paket çalıştırmaları, varsayılan olarak yalıtılmış gateway çalışanlarıyla
birden fazla seçili senaryoyu paralel olarak yürütür. `qa-channel` varsayılan olarak
4 eşzamanlılığa sahiptir ve seçilen senaryo sayısıyla sınırlandırılır. Çalışan sayısını ayarlamak için
`--concurrency <count>` veya seri yürütme için `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan bir çıkış koduyla sonlanır.
Başarısız çıkış kodu olmadan çıktı almak istediğinizde `--allow-failures` kullanın.
Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
ortam değişkeni tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
varsa `CODEX_HOME`. Konuğun bağlanan çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini depo kökü altında tutun.

## Depo destekli tohumlar

Tohum varlıklar `qa/` altında bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar kasıtlı olarak git içinde tutulur; böylece QA planı hem insanlar hem de
ajan tarafından görünür olur.

`qa-lab` genel amaçlı bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası,
tek bir test çalıştırmasının doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verileri
- isteğe bağlı kategori, yetenek, hat ve risk meta verileri
- belge ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı gateway yapılandırma yaması
- yürütülebilir `qa-flow`

`qa-flow`u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel amaçlı ve
yatay kesen bir yapıda kalmasına izin verilir. Örneğin markdown senaryoları,
özel durumlu bir çalıştırıcı eklemeden, gömülü Kontrol UI’sini
Gateway `browser.request` bağlantı noktası üzerinden süren tarayıcı tarafı yardımcılarla birlikte
taşıma tarafı yardımcıları birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörüne göre değil, ürün yeteneğine göre gruplandırılmalıdır.
Dosyalar taşındığında senaryo kimliklerini sabit tutun; uygulama izlenebilirliği için
`docsRefs` ve `codeRefs` kullanın.

Temel liste, aşağıdakileri kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- ileti dizisi davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellekten geri çağırma
- model değiştirme
- alt ajan devri
- depo okuma ve belge okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı sahte hatları

`qa suite` iki yerel sağlayıcı sahte hattına sahiptir:

- `mock-openai`, senaryo farkındalığı olan OpenClaw sahtesidir. Depo destekli QA ve eşlik denetimleri için
  varsayılan deterministik sahte hat olmaya devam eder.
- `aimock`, deneysel protokol,
  fixture, kayıt/yeniden oynatma ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır. Bu ek niteliğindedir ve
  `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, gateway model yapılandırmasına,
auth-profile hazırlık gereksinimlerine ve canlı/sahte yetenek işaretlerine sahiptir. Paylaşılan paket ve
gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirme yapmalıdır.

## Taşıma bağdaştırıcıları

`qa-lab`, markdown QA senaryoları için genel amaçlı bir taşıma bağlantı noktası sahibi olur.
`qa-channel` bu bağlantı noktasındaki ilk bağdaştırıcıdır, ancak tasarım hedefi daha geniştir:
gelecekteki gerçek veya sentetik kanallar, taşımaya özgü bir QA çalıştırıcısı eklemek yerine
aynı paket çalıştırıcısına takılmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütme, çalışan eşzamanlılığı, çıktı yazımı ve raporlamanın sahibidir.
- taşıma bağdaştırıcısı, gateway yapılandırması, hazır olma durumu, gelen ve giden gözlem, taşıma eylemleri ve normalize edilmiş taşıma durumunun sahibidir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab`, bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

Yeni kanal bağdaştırıcıları için bakımcı odaklı benimseme rehberi
[Testing](/tr/help/testing#adding-a-channel-to-qa) içinde yer alır.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu sorulara yanıt vermelidir:

- Ne işe yaradı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemek faydalı olur

Karakter ve stil kontrolleri için, aynı senaryoyu birden fazla canlı model
referansı üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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

Komut, Docker değil, yerel QA gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları personayı `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi sıradan kullanıcı dönüşlerini çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut, her tam dökümü korur,
temel çalışma istatistiklerini kaydeder, ardından değerlendirme modellerinden hızlı modda
`xhigh` muhakeme ile doğal olma, hava ve mizaha göre çalıştırmaları sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirme istemi yine de
her dökümü ve çalışma durumunu alır, ancak aday referansları `candidate-01` gibi
nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek referanslara geri eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünme düzeyini kullanır; bunu destekleyen OpenAI modelleri için
`xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` yine de
genel bir yedek ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday referansları varsayılan olarak hızlı mod kullanır; böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Tek bir adayın veya değerlendiricinin geçersiz kılınması gerektiğinde
satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu
her aday model için zorla açmak istediğinizde yalnızca `--fast` geçin. Kıyaslama analizi için
aday ve değerlendirici süreleri rapora kaydedilir, ancak değerlendirme istemleri açıkça
hıza göre sıralama yapılmamasını söyler.
Aday ve değerlendirici model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı sınırları
veya yerel gateway yükü bir çalıştırmayı fazla gürültülü hale getiriyorsa
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Aday `--model` geçirilmediğinde, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Değerlendirici `--judge-model` geçirilmediğinde, değerlendiriciler varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili belgeler

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Dashboard](/tr/web/dashboard)
