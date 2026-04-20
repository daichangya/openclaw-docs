---
read_when:
    - qa-lab veya qa-channel’ı genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçiliğe sahip QA otomasyonu oluşturma
summary: qa-lab, qa-channel, tohumlu senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA Uçtan Uca Otomasyonu
x-i18n:
    generated_at: "2026-04-20T09:03:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA Uçtan Uca Otomasyonu

Özel QA yığını, OpenClaw’ı tek birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, ileti dizisi,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için hata ayıklayıcı arayüzü ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli tohum varlıklar.

Mevcut QA operatörü akışı iki panelli bir QA sitesidir:

- Sol: aracıyla birlikte Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Bunu şu komutla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün aracıya bir QA
görevi verebildiği, gerçek kanal davranışını gözlemleyebildiği ve neyin işe yaradığını,
neyin başarısız olduğunu veya neyin engelli kaldığını kaydedebildiği QA Lab sayfasını açığa çıkarır.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab UI yinelemesi için,
yığını bağlama ile bağlanmış bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker servislerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` konteynerine bağlama ile bağlar. `qa:lab:watch`
bu paketi değişikliklerde yeniden derler ve QA Lab
varlık karması değiştiğinde tarayıcı otomatik olarak yeniden yüklenir.

Taşıma katmanında gerçek bir Matrix smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu hat, Docker içinde tek kullanımlık bir Tuwunel homeserver sağlar,
geçici sürücü, SUT ve gözlemci kullanıcılarını kaydeder, bir özel oda oluşturur,
ardından gerçek Matrix Plugin’i bir QA gateway alt süreci içinde çalıştırır. Canlı taşıma hattı,
alt süreç yapılandırmasını test edilen taşıma ile sınırlı tutar; böylece Matrix,
alt süreç yapılandırmasında `qa-channel` olmadan çalışır. Yapılandırılmış rapor çıktılarını ve
birleşik stdout/stderr günlüğünü seçilen Matrix QA çıktı dizinine yazar. Dıştaki
`scripts/run-node.mjs` derleme/başlatıcı çıktısını da yakalamak için
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` değerini depo içindeki bir günlük dosyasına ayarlayın.

Taşıma katmanında gerçek bir Telegram smoke hattı için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu hat, tek kullanımlık bir sunucu sağlamak yerine bir gerçek özel Telegram grubunu hedefler.
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir; ayrıca aynı
özel grupta iki farklı bot gerekir. SUT botunun bir Telegram kullanıcı adı olmalıdır ve
bottan bota gözlem, her iki botta da Bot-to-Bot Communication Mode
özelliği `@BotFather` içinde etkinleştirildiğinde en iyi şekilde çalışır.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan bir kodla çıkar. Başarısız çıkan bir kod olmadan
çıktı almak istediğinizde `--allow-failures` kullanın.

Canlı taşıma hatları artık her birinin kendi senaryo listesi biçimini icat etmesi yerine
tek ve daha küçük bir sözleşmeyi paylaşır:

`qa-channel`, geniş sentetik ürün davranışı paketidir ve canlı taşıma kapsama matrisinin
bir parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | İleti dizisi takibi | İleti dizisi yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | --------------------------------- | ------------------- | -------------------- | ------------- | ------------- |
| Matrix   | x      | x              | x               | x               | x                                 | x                   | x                    | x             |               |
| Telegram | x      |                |                 |                 |                                   |                     |                      |               | x             |

Bu, `qa-channel`’ı geniş ürün davranışı paketi olarak korurken Matrix,
Telegram ve gelecekteki canlı taşıma katmanlarının tek bir açık taşıma-sözleşmesi
kontrol listesini paylaşmasını sağlar.

QA yoluna Docker’ı dahil etmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass konuğunu başlatır, bağımlılıkları kurar, konuğun içinde OpenClaw’ı derler,
`qa suite` komutunu çalıştırır, ardından normal QA raporunu ve
özeti konuğun içinden ana makinedeki `.artifacts/qa-e2e/...` dizinine geri kopyalar.
Bu, ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını yeniden kullanır.
Ana makine ve Multipass suite çalıştırmaları, varsayılan olarak yalıtılmış gateway worker’ları ile
seçilen birden fazla senaryoyu paralel olarak yürütür. `qa-channel` için varsayılan eşzamanlılık 4’tür
ve seçilen senaryo sayısıyla sınırlandırılır. Worker sayısını ayarlamak için
`--concurrency <count>`, seri yürütme için ise `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan bir kodla çıkar. Başarısız çıkan bir kod olmadan
çıktı almak istediğinizde `--allow-failures` kullanın.
Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
ortam değişkeni tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
mevcutsa `CODEX_HOME`. Konuğun bağlanmış çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini depo kökü altında tutun.

## Depo destekli tohumlar

Tohum varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar kasıtlı olarak git içinde tutulur; böylece QA planı hem insanlar hem de
aracı tarafından görülebilir.

`qa-lab` genel amaçlı bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası,
tek bir test çalıştırmasının kaynak doğrusu olmalı ve şunları tanımlamalıdır:

- senaryo meta verileri
- isteğe bağlı kategori, yetenek, hat ve risk meta verileri
- doküman ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı gateway yapılandırma yaması
- yürütülebilir `qa-flow`

`qa-flow`’u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyi,
genel ve kesitler arası kalabilir. Örneğin markdown senaryoları,
özel durumlu bir çalıştırıcı eklemeden, gömülü Control UI’ı
Gateway `browser.request` sınırı üzerinden yöneten tarayıcı tarafı yardımcılarla
taşıma tarafı yardımcılarını birleştirebilir.

Senaryo dosyaları kaynak ağacı klasörüne göre değil, ürün yeteneğine göre gruplanmalıdır.
Dosyalar taşındığında senaryo kimliklerini sabit tutun; uygulama izlenebilirliği için
`docsRefs` ve `codeRefs` kullanın.

Temel liste aşağıdakileri kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- ileti dizisi davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellekten geri çağırma
- model değiştirme
- alt aracı devri
- depoyu okuma ve doküman okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı sahte hatları

`qa suite` iki yerel sağlayıcı sahte hattına sahiptir:

- `mock-openai`, senaryo farkındalığına sahip OpenClaw sahtesidir. Depo destekli QA ve
  eşdeğerlik kapıları için varsayılan deterministik sahte hat olarak kalır.
- `aimock`, deneysel protokol,
  fikstür, kaydet/yeniden oynat ve kaos kapsamı için AIMock destekli bir sağlayıcı sunucusu başlatır.
  Bu ek niteliğindedir ve `mock-openai` senaryo yönlendiricisinin yerini almaz.

Sağlayıcı hattı uygulaması `extensions/qa-lab/src/providers/` altında bulunur.
Her sağlayıcı; varsayılanlarına, yerel sunucu başlatmasına, gateway model yapılandırmasına,
auth-profile hazırlama gereksinimlerine ve canlı/sahte yetenek işaretlerine sahiptir. Ortak suite ve
gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirme yapmalıdır.

## Taşıma bağdaştırıcıları

`qa-lab`, markdown QA senaryoları için genel bir taşıma sınırına sahiptir.
`qa-channel`, bu sınırdaki ilk bağdaştırıcıdır; ancak tasarım hedefi daha geniştir:
gelecekteki gerçek veya sentetik kanallar, taşıma katmanına özgü bir QA çalıştırıcısı eklemek yerine
aynı suite çalıştırıcısına takılabilmelidir.

Mimari düzeyde ayrım şu şekildedir:

- `qa-lab`, genel senaryo yürütme, worker eşzamanlılığı, çıktı yazma ve raporlamadan sorumludur.
- taşıma bağdaştırıcısı; gateway yapılandırması, hazır olma durumu, gelen ve giden gözlem, taşıma eylemleri ve normalize edilmiş taşıma durumundan sorumludur.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini `qa-lab` sağlar.

Yeni kanal bağdaştırıcıları için bakımcıya yönelik benimseme yönergeleri
[Testing](/tr/help/testing#adding-a-channel-to-qa) bölümünde bulunur.

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu sorulara yanıt vermelidir:

- Ne işe yaradı
- Ne başarısız oldu
- Ne engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Karakter ve üslup kontrolleri için, aynı senaryoyu birden çok canlı model
referansı üzerinde çalıştırın ve değerlendirilen bir Markdown raporu yazın:

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
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet,
çalışma alanı yardımı ve küçük dosya görevleri gibi sıradan kullanıcı turlarını yürütmelidir. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam transkripti korur,
temel çalışma istatistiklerini kaydeder, ardından değerlendirme modellerinden hızlı modda
`xhigh` akıl yürütme ile çalıştırmaları doğallık, hava ve mizaha göre sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirme istemi yine de
her transkripti ve çalışma durumunu alır, ancak aday referansları
`candidate-01` gibi nötr etiketlerle değiştirilir; rapor ayrıştırma sonrasında sıralamaları gerçek referanslarla eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünme düzeyini kullanır; bunu destekleyen OpenAI modelleri için
`xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ genel
yedek değeri ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday referansları varsayılan olarak hızlı modu kullanır; böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Tek bir aday veya değerlendirici için geçersiz kılma gerektiğinde
satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Yalnızca her aday model için
hızlı modu zorla açmak istediğinizde `--fast` geçin. Aday ve değerlendirici süreleri
kıyaslama analizi için rapora kaydedilir, ancak değerlendirici istemleri açıkça
hıza göre sıralama yapılmamasını söyler.
Aday ve değerlendirici model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır.
Sağlayıcı sınırları veya yerel gateway baskısı bir çalıştırmayı çok gürültülü hâle getiriyorsa
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Aday `--model` geçirilmediğinde karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Değerlendirici `--judge-model` geçirilmediğinde değerlendiriciler varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` kullanır.

## İlgili dokümanlar

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Dashboard](/web/dashboard)
