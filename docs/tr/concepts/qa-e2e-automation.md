---
read_when:
    - qa-lab veya qa-channel genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway dashboard çevresinde daha yüksek gerçekçiliğe sahip QA otomasyonu oluşturma
summary: qa-lab, qa-channel, tohumlanmış senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA E2E otomasyonu
x-i18n:
    generated_at: "2026-04-25T13:45:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Özel QA yığını, OpenClaw'ı tek birim testin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Geçerli parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı,
  tepki, düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: dökümü gözlemlemek,
  gelen mesajlar enjekte etmek ve Markdown raporu dışa aktarmak için hata ayıklayıcı UI ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli tohum varlıkları.

Geçerli QA operatör akışı iki panelli bir QA sitesidir:

- Sol: aracıyla birlikte Gateway dashboard (Control UI).
- Sağ: Slack benzeri dökümü ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway şeridini başlatır ve
bir operatörün veya otomasyon döngüsünün aracıya bir QA
görevi verebildiği, gerçek kanal davranışını gözlemleyebildiği ve neyin çalıştığını, neyin başarısız olduğunu veya neyin takılı kaldığını
kaydedebildiği QA Lab sayfasını açar.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab UI yinelemesi için,
yığını bind-mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container'ına bind-mount eder. `qa:lab:watch`
bu paketi değişiklikte yeniden derler ve QA Lab
varlık hash'i değiştiğinde tarayıcı otomatik yeniden yüklenir.

Gerçek aktarım kullanan bir Matrix smoke şeridi için şunu çalıştırın:

```bash
pnpm openclaw qa matrix
```

Bu şerit, Docker içinde geçici bir Tuwunel homeserver sağlar, geçici
sürücü, SUT ve gözlemci kullanıcılarını kaydeder, bir özel oda oluşturur, ardından
gerçek Matrix Plugin'ini bir QA gateway alt süreci içinde çalıştırır. Canlı aktarım şeridi,
alt süreç config'ini test edilen aktarımla sınırlı tutar; böylece Matrix,
alt süreç config'inde `qa-channel` olmadan çalışır. Yapılandırılmış rapor varlıklarını ve
birleştirilmiş stdout/stderr günlüğünü seçilen Matrix QA çıktı dizinine yazar. Dış
`scripts/run-node.mjs` derleme/başlatıcı çıktısını da yakalamak için
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` değerini depo içi bir günlük dosyasına ayarlayın.
Matrix ilerlemesi varsayılan olarak yazdırılır. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` tüm çalıştırmayı,
`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` ise temizlemeyi sınırlar; böylece takılmış bir Docker kapatma işlemi
askıda kalmak yerine tam kurtarma komutunu bildirir.

Gerçek aktarım kullanan bir Telegram smoke şeridi için şunu çalıştırın:

```bash
pnpm openclaw qa telegram
```

Bu şerit, geçici bir sunucu sağlamak yerine tek bir gerçek özel Telegram grubunu hedefler. Bunun için
`OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` ile
aynı özel grupta iki farklı bot gerekir. SUT botunun bir Telegram kullanıcı adı olmalıdır ve
botlar arası gözlem, her iki botta da `@BotFather` içinde
Bot-to-Bot Communication Mode etkin olduğunda en iyi çalışır.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan çıkış koduyla biter.
Başarısız çıkış kodu olmadan varlıklar istiyorsanız `--allow-failures` kullanın.
Telegram raporu ve özeti, kanaryadan başlayarak
sürücü mesajı gönderme isteğinden gözlenen SUT yanıtına kadar her yanıt için RTT içerir.

Havuzlanmış canlı kimlik bilgilerini kullanmadan önce şunu çalıştırın:

```bash
pnpm openclaw qa credentials doctor
```

Doctor, Convex broker env değerlerini kontrol eder, uç nokta ayarlarını doğrular ve
maintainer secret mevcut olduğunda admin/list erişilebilirliğini doğrular. Secret'lar için
yalnızca ayarlı/eksik durumunu bildirir.

Gerçek aktarım kullanan bir Discord smoke şeridi için şunu çalıştırın:

```bash
pnpm openclaw qa discord
```

Bu şerit, iki botlu tek bir gerçek özel Discord sunucu kanalını hedefler: harness tarafından
denetlenen bir sürücü botu ve paketlenmiş Discord Plugin'i aracılığıyla alt OpenClaw gateway tarafından
başlatılan bir SUT botu. Bunun için
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
ve env kimlik bilgileri kullanılırken `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` gerekir.
Bu şerit kanal mention işleme davranışını doğrular ve SUT botunun
yerel `/help` komutunu Discord'a kaydettiğini kontrol eder.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan çıkış koduyla biter.
Başarısız çıkış kodu olmadan varlıklar istiyorsanız `--allow-failures` kullanın.

Canlı aktarım şeritleri artık her birinin kendi senaryo listesi biçimini icat etmesi yerine
tek ve daha küçük bir sözleşmeyi paylaşıyor:

`qa-channel`, geniş sentetik ürün davranışı paketi olarak kalır ve
canlı aktarım kapsama matrisinin bir parçası değildir.

| Şerit   | Kanarya | Mention kapılaması | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | İş parçacığı devamı | İş parçacığı yalıtımı | Tepki gözlemi | Help komutu | Yerel komut kaydı |
| ------- | ------- | ------------------ | ---------------- | --------------- | --------------------------------- | ------------------- | -------------------- | ------------- | ----------- | ----------------- |
| Matrix   | x      | x                  | x                | x               | x                                 | x                   | x                    | x             |             |                   |
| Telegram | x      | x                  |                  |                 |                                   |                     |                      |               | x           |                   |
| Discord  | x      | x                  |                  |                 |                                   |                     |                      |               |             | x                 |

Bu, `qa-channel`ı geniş ürün davranışı paketi olarak korurken Matrix,
Telegram ve gelecekteki canlı aktarımların tek bir açık aktarım-sözleşmesi kontrol listesini paylaşmasını sağlar.

QA yoluna Docker katmadan geçici bir Linux VM şeridi için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass guest başlatır, bağımlılıkları kurar, guest içinde
OpenClaw'ı derler, `qa suite` çalıştırır, ardından normal QA raporu ve
özetini ana makinedeki `.artifacts/qa-e2e/...` içine geri kopyalar.
Ana makinede `qa suite` ile aynı senaryo seçme davranışını yeniden kullanır.
Ana makine ve Multipass paket çalıştırmaları, seçilen birden çok senaryoyu varsayılan olarak
yalıtılmış gateway worker'larıyla paralel yürütür. `qa-channel` için varsayılan eşzamanlılık 4'tür
ve seçilen senaryo sayısıyla sınırlandırılır. Worker sayısını ayarlamak için `--concurrency <count>`,
seri yürütme içinse `--concurrency 1` kullanın.
Herhangi bir senaryo başarısız olduğunda komut sıfır olmayan çıkış koduyla biter.
Başarısız çıkış kodu olmadan varlıklar istiyorsanız `--allow-failures` kullanın.
Canlı çalıştırmalar, guest için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı config yolu ve
varsa `CODEX_HOME`. Guest'in bağlanmış çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini depo kökü altında tutun.

## Depo destekli tohumlar

Tohum varlıkları `qa/` altında yaşar:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Bunlar kasıtlı olarak git içindedir; böylece QA planı hem insanlar hem de
aracı tarafından görülebilir.

`qa-lab`, genel amaçlı bir markdown çalıştırıcısı olarak kalmalıdır. Her senaryo markdown dosyası
tek bir test çalıştırmasının doğruluk kaynağıdır ve şunları tanımlamalıdır:

- senaryo meta verisi
- isteğe bağlı kategori, yetenek, şerit ve risk meta verisi
- belge ve kod referansları
- isteğe bağlı Plugin gereksinimleri
- isteğe bağlı gateway config yaması
- yürütülebilir `qa-flow`

`qa-flow`u destekleyen yeniden kullanılabilir çalışma zamanı yüzeyinin genel amaçlı
ve kesitler arası kalmasına izin verilir. Örneğin, markdown senaryoları
özel durumlu bir çalıştırıcı eklemeden, gömülü Control UI'ı
Gateway `browser.request` bağlantı yüzeyi üzerinden süren tarayıcı tarafı yardımcılarla birlikte
aktarım tarafı yardımcılarını birleştirebilir.

Senaryo dosyaları, kaynak ağaç klasörüne göre değil ürün yeteneğine göre gruplanmalıdır.
Dosyalar taşındığında senaryo kimliklerini sabit tutun; uygulama izlenebilirliği için `docsRefs` ve `codeRefs` kullanın.

Temel liste, şunları kapsayacak kadar geniş kalmalıdır:

- DM ve kanal sohbeti
- iş parçacığı davranışı
- mesaj eylemi yaşam döngüsü
- Cron geri çağrıları
- bellek geri çağırma
- model değiştirme
- alt aracı devretme
- depo okuma ve belge okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Sağlayıcı sahte şeritleri

`qa suite` iki yerel sağlayıcı sahte şeridine sahiptir:

- `mock-openai`, senaryo farkında OpenClaw sahte sağlayıcısıdır. Depo destekli QA ve parity gate'ler için
  varsayılan deterministik sahte şerit olmaya devam eder.
- `aimock`, deneysel protokol,
  fixture, kayıt/yeniden oynatma ve kaos kapsaması için AIMock destekli bir sağlayıcı sunucusu başlatır. Ekleyicidir ve
  `mock-openai` senaryo dağıtıcısının yerini almaz.

Sağlayıcı şeridi uygulaması `extensions/qa-lab/src/providers/` altında yaşar.
Her sağlayıcı kendi varsayılanlarına, yerel sunucu başlatmasına, gateway model config'ine,
auth-profile hazırlama gereksinimlerine ve canlı/sahte yetenek bayraklarına sahiptir. Paylaşılan paket ve
gateway kodu, sağlayıcı adlarına göre dallanmak yerine sağlayıcı kayıt defteri üzerinden yönlendirme yapmalıdır.

## Aktarım bağdaştırıcıları

`qa-lab`, markdown QA senaryoları için genel bir aktarım bağlantı yüzeyine sahiptir.
`qa-channel`, bu bağlantı yüzeyindeki ilk bağdaştırıcıdır, ancak tasarım hedefi daha geniştir:
gelecekteki gerçek veya sentetik kanallar, aktarıma özel bir QA çalıştırıcısı eklemek yerine
aynı paket çalıştırıcısına bağlanmalıdır.

Mimari düzeyde ayrım şöyledir:

- `qa-lab`, genel senaryo yürütmeyi, worker eşzamanlılığını, varlık yazmayı ve raporlamayı sahiplenir.
- aktarım bağdaştırıcısı, gateway config'ini, hazır olma durumunu, gelen ve giden gözlemi, aktarım eylemlerini ve normalize edilmiş aktarım durumunu sahiplenir.
- `qa/scenarios/` altındaki markdown senaryo dosyaları test çalıştırmasını tanımlar; `qa-lab`, bunları yürüten yeniden kullanılabilir çalışma zamanı yüzeyini sağlar.

Yeni kanal bağdaştırıcıları için maintainer odaklı benimseme rehberi
[Testing](/tr/help/testing#adding-a-channel-to-qa) sayfasında yer alır.

## Raporlama

`qa-lab`, gözlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu sorulara yanıt vermelidir:

- Ne çalıştı
- Ne başarısız oldu
- Ne takılı kaldı
- Hangi takip senaryolarını eklemek faydalı olur

Karakter ve stil kontrolleri için aynı senaryoyu birden çok canlı model
referansı üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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

Komut, Docker değil, yerel QA gateway alt süreçlerini çalıştırır. Character eval
senaryoları kişiliği `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi normal kullanıcı turlarını çalıştırmalıdır. Aday modele
değerlendirildiği söylenmemelidir. Komut her tam dökümü korur, temel çalıştırma
istatistiklerini kaydeder, ardından desteklendiği yerlerde hızlı modda
`xhigh` akıl yürütme ile değerlendirme modellerinden çalıştırmaları doğallık, hava ve mizaha göre sıralamalarını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirme prompt'u yine
her dökümü ve çalıştırma durumunu alır, ancak aday referansları `candidate-01` gibi
nötr etiketlerle değiştirilir; rapor sıralamaları ayrıştırmadan sonra gerçek referanslara geri eşler.
Aday çalıştırmaları varsayılan olarak `high` düşünme düzeyini kullanır; GPT-5.4 için `medium`,
bunu destekleyen eski OpenAI değerlendirme referansları içinse `xhigh` kullanılır. Belirli bir adayı
`--model provider/model,thinking=<level>` ile satır içinde geçersiz kılın. `--thinking <level>`
hâlâ genel bir geri dönüş değeri ayarlar ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday referansları varsayılan olarak hızlı modu kullanır; böylece sağlayıcının
desteklediği yerlerde öncelikli işleme kullanılır. Tek bir aday veya değerlendirme modeli için geçersiz kılma gerektiğinde
satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu her aday model için zorla açmak istediğinizde yalnızca `--fast` verin.
Aday ve değerlendirme süreleri kıyaslama analizi için rapora kaydedilir, ancak değerlendirme prompt'ları açıkça
hıza göre sıralama yapılmamasını söyler.
Aday ve değerlendirme modeli çalıştırmalarının ikisi de varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı sınırları veya yerel gateway
yükü çalıştırmayı fazla gürültülü hâle getiriyorsa `--concurrency` veya `--judge-concurrency` değerlerini düşürün.
Hiç aday `--model` verilmediğinde, character eval varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` modellerini kullanır.
Hiç `--judge-model` verilmediğinde, değerlendirme modelleri varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili belgeler

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Dashboard](/tr/web/dashboard)
