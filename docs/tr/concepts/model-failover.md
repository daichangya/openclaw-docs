---
read_when:
    - Auth profile döndürme, cooldown'lar veya model geri düşme davranışı teşhis ediliyor
    - Auth profile'lar veya modeller için failover kuralları güncelleniyor
    - Oturum model geçersiz kılmalarının geri düşme yeniden denemeleriyle nasıl etkileştiğini anlama
summary: OpenClaw'ın auth profile'ları nasıl döndürdüğü ve modeller arasında nasıl geri düştüğü
title: Model Failover
x-i18n:
    generated_at: "2026-04-23T09:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# Model failover

OpenClaw hataları iki aşamada ele alır:

1. Geçerli sağlayıcı içinde **auth profile döndürme**.
2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model geri düşmesi**.

Bu belge, çalışma zamanı kurallarını ve bunları destekleyen verileri açıklar.

## Çalışma zamanı akışı

Normal bir metin çalıştırması için OpenClaw adayları şu sırayla değerlendirir:

1. O anda seçili oturum modeli.
2. Sırasıyla yapılandırılmış `agents.defaults.model.fallbacks`.
3. Çalıştırma bir geçersiz kılmadan başladıysa sonda yapılandırılmış birincil model.

Her adayın içinde OpenClaw, bir sonraki model adayına geçmeden önce auth-profile failover dener.

Yüksek düzey sıra:

1. Etkin oturum modelini ve auth-profile tercihini çözümleyin.
2. Model aday zincirini oluşturun.
3. Geçerli sağlayıcıyı auth-profile döndürme/cooldown kurallarıyla deneyin.
4. O sağlayıcı failover'a uygun bir hatayla tükenirse bir sonraki
   model adayına geçin.
5. Yeniden deneme başlamadan önce seçilen fallback geçersiz kılmasını kalıcılaştırın; böylece diğer
   oturum okuyucuları runner'ın kullanmak üzere olduğu aynı sağlayıcıyı/modeli görür.
6. Fallback adayı başarısız olursa yalnızca fallback'e ait oturum
   geçersiz kılma alanlarını, hâlâ o başarısız adayla eşleşiyorlarsa geri alın.
7. Her aday başarısız olursa, deneme başına
   ayrıntı ve biliniyorsa en yakın cooldown bitiş zamanı ile bir `FallbackSummaryError` fırlatın.

Bu, kasıtlı olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt
runner'ı, failover için yalnızca sahip olduğu model seçimi alanlarını kalıcılaştırır:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir fallback yeniden denemesinin, deneme çalışırken gerçekleşen
manuel `/model` değişiklikleri veya oturum rotasyonu güncellemeleri gibi daha yeni
ve ilişkisiz oturum mutasyonlarının üzerine yazmasını önler.

## Auth depolama (anahtarlar + OAuth)

OpenClaw, hem API anahtarları hem de OAuth token'ları için **auth profile** kullanır.

- Secret'lar `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde tutulur (eski: `~/.openclaw/agent/auth-profiles.json`).
- Çalışma zamanı auth-yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/auth-state.json` içinde tutulur.
- Yapılandırmadaki `auth.profiles` / `auth.order` yalnızca **meta veri + yönlendirme** içindir (secret içermez).
- Eski yalnızca-içe-aktarma OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine içe aktarılır).

Daha fazla ayrıntı: [/concepts/oauth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ bazı sağlayıcılar için `projectId`/`enterpriseUrl`)

## Profile ID'leri

OAuth girişleri, birden fazla hesabın birlikte var olabilmesi için ayrı profile'lar oluşturur.

- Varsayılan: e-posta yoksa `provider:default`.
- E-postalı OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profile'lar `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde `profiles` altında tutulur.

## Döndürme sırası

Bir sağlayıcının birden fazla profile'ı olduğunda OpenClaw şu şekilde bir sıra seçer:

1. **Açık yapılandırma**: `auth.order[provider]` (ayarlıysa).
2. **Yapılandırılmış profile'lar**: sağlayıcıya göre filtrelenmiş `auth.profiles`.
3. **Saklanan profile'lar**: sağlayıcı için `auth-profiles.json` girdileri.

Açık bir sıra yapılandırılmamışsa OpenClaw round‑robin sırası kullanır:

- **Birincil anahtar:** profile türü (**API anahtarlarından önce OAuth**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde en eski önce).
- **Cooldown/devre dışı profile'lar** sona taşınır ve en yakın bitiş zamanına göre sıralanır.

### Oturum yapışkanlığı (önbellek dostu)

OpenClaw, sağlayıcı önbelleklerini sıcak tutmak için **seçilen auth profile'ı oturum başına sabitler**.
Her istekte döndürmez. Sabitlenen profile şu zamana kadar yeniden kullanılır:

- oturum sıfırlanırsa (`/new` / `/reset`)
- bir Compaction tamamlanırsa (compaction sayısı artar)
- profile cooldown/devre dışı durumundaysa

`/model …@<profileId>` ile manuel seçim, o oturum için bir **kullanıcı geçersiz kılması** ayarlar
ve yeni bir oturum başlayana kadar otomatik döndürülmez.

Otomatik sabitlenmiş profile'lar (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak değerlendirilir:
önce bunlar denenir, ancak OpenClaw hız sınırlarında/zaman aşımlarında başka bir profile dönebilir.
Kullanıcı tarafından sabitlenen profile'lar o profile'a kilitli kalır; başarısız olursa ve model fallback'leri
yapılandırılmışsa OpenClaw profile değiştirmek yerine bir sonraki modele geçer.

### OAuth neden "kaybolmuş gibi" görünebilir

Aynı sağlayıcı için hem bir OAuth profile'ınız hem de bir API anahtarı profile'ınız varsa, round‑robin sabitlenmemiş durumlarda mesajlar arasında bunlar arasında geçiş yapabilir. Tek bir profile zorlamak için:

- `auth.order[provider] = ["provider:profileId"]` ile sabitleyin veya
- UI/sohbet yüzeyiniz destekliyorsa profile geçersiz kılmalı `/model …` ile oturum başına geçersiz kılma kullanın.

## Cooldown'lar

Bir profile auth/hız sınırı hataları nedeniyle (veya hız sınırlaması gibi görünen
bir zaman aşımı nedeniyle) başarısız olduğunda OpenClaw onu cooldown'a alır ve bir sonraki profile geçer.
Bu hız sınırı kovası yalnızca `429` ile sınırlı değildir: sağlayıcı
mesajları olarak `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` ve `weekly/monthly limit reached`
gibi dönemsel kullanım penceresi sınırlarını da içerir.
Biçim/geçersiz istek hataları (örneğin Cloud Code Assist tool call ID
doğrulama hataları) failover'a uygun kabul edilir ve aynı cooldown'ları kullanır.
`Unhandled stop reason: error`,
`stop reason: error` ve `reason: error` gibi OpenAI uyumlu stop-reason hataları
zaman aşımı/failover sinyalleri olarak sınıflandırılır.
Sağlayıcı kapsamlı genel sunucu metni de, kaynak bilinen geçici bir kalıpla eşleştiğinde bu
zaman aşımı kovasına girebilir. Örneğin Anthropic'in çıplak
`An unknown error occurred` metni ve `internal server error`, `unknown error, 520`, `upstream error`
veya `backend error` gibi geçici sunucu metni içeren JSON `api_error` payload'ları failover'a uygun zaman aşımı olarak değerlendirilir. OpenRouter'a özgü
çıplak `Provider returned error` gibi genel upstream metni de yalnızca
sağlayıcı bağlamı gerçekten OpenRouter olduğunda zaman aşımı olarak değerlendirilir. `LLM request failed with an unknown error.`
gibi genel iç fallback metni ise temkinli kalır ve tek başına failover tetiklemez.

Bazı sağlayıcı SDK'ları, denetimi OpenClaw'a geri vermeden önce uzun bir `Retry-After` penceresi boyunca uyuyabilir.
Anthropic ve OpenAI gibi Stainless tabanlı SDK'lar için OpenClaw, SDK içi `retry-after-ms` / `retry-after` beklemelerini varsayılan olarak 60
saniye ile sınırlar ve daha uzun yeniden denenebilir yanıtları hemen yüzeye çıkarır; böylece bu
failover yolu çalışabilir. Bu sınırı ayarlamak veya devre dışı bırakmak için
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` kullanın; bkz. [/concepts/retry](/tr/concepts/retry).

Hız sınırı cooldown'ları model kapsamlı da olabilir:

- OpenClaw, başarısız model kimliği bilindiğinde hız sınırı hataları için `cooldownModel` kaydeder.
- Aynı sağlayıcıdaki kardeş bir model, cooldown farklı bir modele
  kapsamlandırılmışsa yine de denenebilir.
- Faturalandırma/devre dışı pencereleri ise modeller arasında tüm profile'ı engeller.

Cooldown'lar üstel geri çekilme kullanır:

- 1 dakika
- 5 dakika
- 25 dakika
- 1 saat (üst sınır)

Durum, `auth-state.json` içinde `usageStats` altında saklanır:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Faturalandırma nedeniyle devre dışı bırakmalar

Faturalandırma/kredi hataları (örneğin “insufficient credits” / “credit balance too low”) failover'a uygun kabul edilir, ancak genellikle geçici değildir. Kısa bir cooldown yerine OpenClaw, profile'ı **disabled** olarak işaretler (daha uzun bir geri çekilme ile) ve bir sonraki profile/sağlayıcıya döner.

Her faturalandırma benzeri yanıt `402` değildir ve her HTTP `402` de bu kategoriye girmez.
OpenClaw, bir sağlayıcı bunun yerine `401` veya `403` döndürse bile açık faturalandırma metnini
faturalandırma kanalında tutar, ancak sağlayıcıya özgü eşleyiciler bunların sahibi olan
sağlayıcıya kapsamlı kalır (örneğin OpenRouter `403 Key limit
exceeded`). Bu arada geçici `402` kullanım penceresi ve
organizasyon/çalışma alanı harcama sınırı hataları, mesaj yeniden denenebilir görünüyorsa `rate_limit` olarak sınıflandırılır
(örneğin `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` veya `organization spending limit exceeded`).
Bunlar uzun
faturalandırma-devre dışı bırakma yolu yerine kısa cooldown/failover yolunda kalır.

Durum `auth-state.json` içinde saklanır:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Varsayılanlar:

- Faturalandırma geri çekilmesi **5 saat** ile başlar, her faturalandırma hatasında ikiye katlanır ve **24 saat** üst sınırına ulaşır.
- Geri çekilme sayaçları, profile **24 saat** boyunca başarısız olmadıysa sıfırlanır (yapılandırılabilir).
- Aşırı yüklü yeniden denemeler, model fallback'ten önce **aynı sağlayıcı içinde 1 auth-profile döndürmeye** izin verir.
- Aşırı yüklü yeniden denemeler varsayılan olarak **0 ms geri çekilme** kullanır.

## Model fallback

Bir sağlayıcının tüm profile'ları başarısız olursa OpenClaw,
`agents.defaults.model.fallbacks` içindeki bir sonraki modele geçer. Bu, auth hataları, hız sınırları ve
profile döndürmesini tüketen zaman aşımları için geçerlidir (diğer hatalar fallback'i ilerletmez).

Aşırı yük ve hız sınırı hataları, faturalandırma cooldown'larından daha agresif ele alınır.
Varsayılan olarak OpenClaw, aynı sağlayıcı içinde bir auth-profile yeniden denemesine izin verir,
ardından beklemeden bir sonraki yapılandırılmış model fallback'ine geçer.
`ModelNotReadyException` gibi sağlayıcı-meşgul sinyalleri bu aşırı yük
kovasına girer. Bunu `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` ve
`auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalıştırma model geçersiz kılmasıyla başladığında (hook'lar veya CLI), fallback'ler yapılandırılmış fallback'leri denedikten sonra yine `agents.defaults.model.primary` üzerinde biter.

### Aday zinciri kuralları

OpenClaw aday listesini o anda istenen `provider/model`
ile yapılandırılmış fallback'lerden oluşturur.

Kurallar:

- İstenen model her zaman ilk sıradadır.
- Açık yapılandırılmış fallback'ler yinelenenlerden arındırılır ancak model
  izin listesinden filtrelenmez. Bunlar açık operatör niyeti olarak değerlendirilir.
- Geçerli çalıştırma zaten aynı sağlayıcı ailesinde yapılandırılmış bir fallback üzerindeyse
  OpenClaw tam yapılandırılmış zinciri kullanmaya devam eder.
- Geçerli çalıştırma yapılandırmadan farklı bir sağlayıcı üzerindeyse ve bu geçerli
  model zaten yapılandırılmış fallback zincirinin parçası değilse, OpenClaw başka bir sağlayıcıdan
  ilişkisiz yapılandırılmış fallback'leri eklemez.
- Çalıştırma bir geçersiz kılmadan başladıysa, yapılandırılmış birincil model
  sonda eklenir; böylece zincir daha önceki adaylar tükendiğinde normal varsayılana geri yerleşebilir.

### Hangi hatalar fallback'i ilerletir

Model fallback şu durumlarda devam eder:

- auth hataları
- hız sınırları ve cooldown tükenmesi
- aşırı yüklü/sağlayıcı-meşgul hataları
- zaman aşımı biçimli failover hataları
- faturalandırma nedeniyle devre dışı bırakmalar
- `LiveSessionModelSwitchError`; bu bir failover yoluna normalize edilir, böylece
  bayat kalıcı model dış bir yeniden deneme döngüsü oluşturmaz
- hâlâ kalan adaylar varken diğer tanınmayan hatalar

Model fallback şu durumlarda devam etmez:

- zaman aşımı/failover biçimli olmayan açık iptaller
- compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları
  (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` veya `ollama error: context
length exceeded`)
- hiç aday kalmadığında son bir bilinmeyen hata

### Cooldown atlama ve probe davranışı

Bir sağlayıcının tüm auth profile'ları zaten cooldown durumundayken OpenClaw o sağlayıcıyı
otomatik olarak sonsuza kadar atlamaz. Aday başına bir karar verir:

- Kalıcı auth hataları tüm sağlayıcıyı hemen atlar.
- Faturalandırma nedeniyle devre dışı bırakmalar genellikle atlanır, ancak birincil aday yine de throttle ile probe edilebilir; böylece yeniden başlatmadan kurtarma mümkün olur.
- Birincil aday, cooldown bitişine yakın zamanda sağlayıcı başına throttle ile probe edilebilir.
- Aynı sağlayıcıdaki fallback kardeşleri, hata geçici görünüyorsa (`rate_limit`, `overloaded` veya bilinmeyen) cooldown'a rağmen denenebilir. Bu özellikle hız sınırının model kapsamlı olduğu ve kardeş bir modelin hemen toparlanabileceği durumlarda önemlidir.
- Geçici cooldown probe'ları, tek bir sağlayıcının sağlayıcılar arası fallback'i durdurmaması için fallback çalıştırması başına sağlayıcı başına birle sınırlıdır.

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum model değişiklikleri paylaşılan durumdur. Etkin runner, `/model` komutu,
compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin
parçalarını okur veya yazar.

Bu, fallback yeniden denemelerinin canlı model değiştirmeyle koordinasyon içinde olması gerektiği anlamına gelir:

- Yalnızca açık kullanıcı kaynaklı model değişiklikleri bekleyen bir canlı değiştirmeyi işaretler. Buna
  `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Fallback döndürmesi, Heartbeat geçersiz kılmaları
  veya Compaction gibi sistem kaynaklı model değişiklikleri kendi başlarına bekleyen bir canlı değiştirmeyi asla işaretlemez.
- Bir fallback yeniden denemesi başlamadan önce yanıt runner'ı seçilen
  fallback geçersiz kılma alanlarını oturum girdisine kalıcılaştırır.
- Canlı oturum uzlaştırması, bayat çalışma zamanı model alanları yerine kalıcı
  oturum geçersiz kılmalarını tercih eder.
- Fallback denemesi başarısız olursa runner yalnızca yazdığı geçersiz kılma alanlarını
  geri alır ve bunu yalnızca bu alanlar hâlâ o başarısız adayla eşleşiyorsa yapar.

Bu, klasik yarış durumunu önler:

1. Birincil model başarısız olur.
2. Fallback adayı bellekte seçilir.
3. Oturum deposu hâlâ eski birincil modeli gösterir.
4. Canlı oturum uzlaştırması bayat oturum durumunu okur.
5. Yeniden deneme, fallback denemesi başlamadan önce eski modele geri çekilir.

Kalıcı fallback geçersiz kılması bu pencereyi kapatır ve dar geri alma
daha yeni manuel veya çalışma zamanı oturum değişikliklerini bozulmadan tutar.

## Gözlemlenebilirlik ve başarısızlık özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya dönük cooldown mesajlarını besleyen
deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve
  benzeri failover nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Her aday başarısız olduğunda OpenClaw `FallbackSummaryError` fırlatır. Dış
yanıt runner'ı bunu, "tüm modeller geçici olarak hız sınırlı" gibi daha
belirgin bir mesaj oluşturmak ve biliniyorsa en yakın cooldown bitiş zamanını eklemek için kullanabilir.

Bu cooldown özeti model farkındalıklıdır:

- denenen sağlayıcı/model zinciri için ilişkisiz model kapsamlı hız sınırları yok sayılır
- kalan engel eşleşen bir model kapsamlı hız sınırıysa OpenClaw,
  hâlâ o modeli engelleyen son eşleşen bitiş zamanını raporlar

## İlgili yapılandırma

Şunlar için [Gateway configuration](/tr/gateway/configuration) bölümüne bakın:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` yönlendirmesi

Daha geniş model seçimi ve fallback genel bakışı için [Models](/tr/concepts/models) bölümüne bakın.
