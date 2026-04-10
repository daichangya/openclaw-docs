---
read_when:
    - qa-lab veya qa-channel genişletme
    - Depo destekli QA senaryoları ekleme
    - Gateway panosu etrafında daha yüksek gerçekçilikte QA otomasyonu oluşturma
summary: qa-lab, qa-channel, tohumlanmış senaryolar ve protokol raporları için özel QA otomasyon yapısı
title: QA E2E Otomasyonu
x-i18n:
    generated_at: "2026-04-10T08:50:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 357d6698304ff7a8c4aa8a7be97f684d50f72b524740050aa761ac0ee68266de
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E Otomasyonu

Özel QA yığını, OpenClaw’u tek birim testinin yapabileceğinden daha gerçekçi,
kanal biçimli bir şekilde çalıştırmak için tasarlanmıştır.

Mevcut parçalar:

- `extensions/qa-channel`: DM, kanal, iş parçacığı, tepki,
  düzenleme ve silme yüzeylerine sahip sentetik mesaj kanalı.
- `extensions/qa-lab`: transkripti gözlemlemek,
  gelen mesajları enjekte etmek ve bir Markdown raporu dışa aktarmak için
  hata ayıklayıcı arayüzü ve QA veri yolu.
- `qa/`: başlangıç görevi ve temel QA
  senaryoları için depo destekli tohum varlıkları.

Mevcut QA operatörü akışı iki panelli bir QA sitesidir:

- Sol: ajan ile Gateway panosu (Control UI).
- Sağ: Slack benzeri transkripti ve senaryo planını gösteren QA Lab.

Şununla çalıştırın:

```bash
pnpm qa:lab:up
```

Bu, QA sitesini derler, Docker destekli gateway hattını başlatır ve
bir operatörün veya otomasyon döngüsünün ajana bir QA görevi verebildiği,
gerçek kanal davranışını gözlemleyebildiği ve neyin çalıştığını, neyin başarısız olduğunu
veya neyin engelli kaldığını kaydedebildiği QA Lab sayfasını erişime açar.

Docker imajını her seferinde yeniden derlemeden daha hızlı QA Lab arayüzü yinelemesi için,
yığını bind-mount edilmiş bir QA Lab paketiyle başlatın:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast`, Docker hizmetlerini önceden derlenmiş bir imaj üzerinde tutar ve
`extensions/qa-lab/web/dist` dizinini `qa-lab` container’ına bind-mount eder. `qa:lab:watch`
bu paketi değişiklikte yeniden derler ve QA Lab varlık karması değiştiğinde
tarayıcı otomatik olarak yeniden yüklenir.

QA yoluna Docker’ı dahil etmeden tek kullanımlık bir Linux VM hattı için şunu çalıştırın:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Bu, yeni bir Multipass konuğu başlatır, bağımlılıkları kurar, konuğun içinde OpenClaw’u derler,
`qa suite` çalıştırır, ardından normal QA raporunu ve
özetini ana makinedeki `.artifacts/qa-e2e/...` içine geri kopyalar.
Ana makinedeki `qa suite` ile aynı senaryo seçme davranışını yeniden kullanır.
Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
env tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve
varsa `CODEX_HOME`. Konuğun bağlı çalışma alanı üzerinden geri yazabilmesi için
`--output-dir` değerini depo kökü altında tutun.

## Depo destekli tohumlar

Tohum varlıkları `qa/` içinde bulunur:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Bunlar kasıtlı olarak git içinde tutulur; böylece QA planı hem insanlar hem de
ajan tarafından görünür olur. Temel listenin, şu alanları kapsayacak kadar geniş kalması gerekir:

- DM ve kanal sohbeti
- iş parçacığı davranışı
- mesaj eylemi yaşam döngüsü
- cron geri çağrıları
- bellek geri çağırma
- model değiştirme
- alt ajan devri
- depo okuma ve dokümantasyon okuma
- Lobster Invaders gibi küçük bir derleme görevi

## Raporlama

`qa-lab`, gözlemlenen veri yolu zaman çizelgesinden bir Markdown protokol raporu dışa aktarır.
Rapor şu sorulara yanıt vermelidir:

- Neler çalıştı
- Neler başarısız oldu
- Neler engelli kaldı
- Hangi takip senaryolarını eklemeye değer

Karakter ve stil kontrolleri için, aynı senaryoyu birden fazla canlı model
başvurusu üzerinde çalıştırın ve değerlendirilmiş bir Markdown raporu yazın:

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

Komut Docker değil, yerel QA gateway alt süreçlerini çalıştırır. Karakter değerlendirme
senaryoları personayı `SOUL.md` üzerinden ayarlamalı, ardından sohbet, çalışma alanı yardımı
ve küçük dosya görevleri gibi sıradan kullanıcı turlarını çalıştırmalıdır. Aday modele,
değerlendirildiği söylenmemelidir. Komut her tam transkripti korur, temel çalışma istatistiklerini kaydeder,
ardından değerlendirme modellerinden `xhigh` akıl yürütmeli hızlı modda
doğallık, hava ve mizaha göre çalıştırmaları sıralamasını ister.
Sağlayıcıları karşılaştırırken `--blind-judge-models` kullanın: değerlendirme istemi yine de
her transkripti ve çalışma durumunu alır, ancak aday başvurular
`candidate-01` gibi nötr etiketlerle değiştirilir; rapor, ayrıştırmadan sonra sıralamaları gerçek başvurularla eşler.
Aday çalıştırmalar varsayılan olarak `high` düşünme kullanır; bunu destekleyen OpenAI modelleri için
`xhigh` kullanılır. Belirli bir adayı satır içinde
`--model provider/model,thinking=<level>` ile geçersiz kılın. `--thinking <level>` hâlâ
genel bir yedek ayar belirler ve eski `--model-thinking <provider/model=level>` biçimi
uyumluluk için korunur.
OpenAI aday başvuruları varsayılan olarak hızlı modu kullanır; böylece sağlayıcının desteklediği yerlerde
öncelikli işleme kullanılır. Tek bir aday veya değerlendirici için geçersiz kılma gerektiğinde
satır içinde `,fast`, `,no-fast` veya `,fast=false` ekleyin. Hızlı modu
her aday model için zorla açmak istediğinizde yalnızca `--fast` geçin. Aday ve değerlendirici süreleri
karşılaştırmalı analiz için rapora kaydedilir, ancak değerlendirici istemleri açıkça
hıza göre sıralama yapılmamasını söyler.
Aday ve değerlendirici model çalıştırmaları varsayılan olarak 16 eşzamanlılık kullanır. Sağlayıcı sınırları
veya yerel gateway yükü bir çalıştırmayı fazla gürültülü hâle getiriyorsa
`--concurrency` veya `--judge-concurrency` değerini düşürün.
Hiç aday `--model` geçirilmezse, karakter değerlendirmesi varsayılan olarak
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` ve
`google/gemini-3.1-pro-preview` kullanır.
Hiç `--judge-model` geçirilmezse, değerlendiriciler varsayılan olarak
`openai/gpt-5.4,thinking=xhigh,fast` ve
`anthropic/claude-opus-4-6,thinking=high` olur.

## İlgili dokümanlar

- [Testing](/tr/help/testing)
- [QA Channel](/tr/channels/qa-channel)
- [Dashboard](/web/dashboard)
