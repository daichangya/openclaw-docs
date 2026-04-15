---
read_when:
    - Testleri yerel olarak veya CI içinde çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - Gateway + aracı davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/canlı paketleri, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test etme
x-i18n:
    generated_at: "2026-04-15T08:53:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf647a5cf13b5861a3ba0cb367dc816c57f0e9c60d3cd6320da193bfadf5609
    source_path: help/testing.md
    workflow: 15
---

# Test etme

OpenClaw’ın üç Vitest paketi vardır (unit/integration, e2e, canlı) ve küçük bir Docker çalıştırıcı kümesi bulunur.

Bu belge bir “nasıl test ediyoruz” kılavuzudur:

- Her paketin neleri kapsadığı (ve özellikle neleri _kapsamadığı_)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Canlı testlerin kimlik bilgilerini nasıl keşfettiği ve model/sağlayıcıları nasıl seçtiği
- Gerçek dünya model/sağlayıcı sorunları için regresyonların nasıl ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesinde beklenen): `pnpm build && pnpm check && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık uzantı/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hatayı iteratif olarak düzeltirken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsam geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri hata ayıklarken (gerçek kimlik bilgileri gerektirir):

- Canlı paket (modeller + Gateway araç/görsel probları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

İpucu: yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, aşağıda açıklanan allowlist ortam değişkenleriyle canlı testleri daraltmayı tercih edin.

## QA’ye özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Varsayılan olarak, yalıtılmış Gateway işçileriyle birden çok seçili senaryoyu paralel çalıştırır; en fazla 64 işçi veya seçili senaryo sayısı kullanılır. İşçi sayısını ayarlamak için `--concurrency <count>`, eski seri hat içinse `--concurrency 1` kullanın.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçme davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcutsa `CODEX_HOME`.
  - Çıktı dizinleri depo kökü altında kalmalıdır; böylece konuk, bağlanmış çalışma alanı üzerinden geri yazabilir.
  - Normal QA raporu + özetin yanı sıra Multipass günlüklerini `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını tek kullanımlık Docker destekli bir Tuwunel homeserver’a karşı çalıştırır.
  - Bu QA ana makinesi şu anda yalnızca repo/geliştirme içindir. Paketlenmiş OpenClaw kurulumları `qa-lab` göndermez, bu nedenle `openclaw qa` sunmazlar.
  - Depo checkout’ları paketli çalıştırıcıyı doğrudan yükler; ayrı bir plugin kurulum adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ile bir özel oda oluşturur, ardından gerçek Matrix plugin’i SUT taşıması olarak kullanılarak bir QA Gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel imajı `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir imajı test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, hattın yerel olarak tek kullanımlık kullanıcılar oluşturması nedeniyle paylaşılan kimlik bilgisi kaynağı bayraklarını sunmaz.
  - Matrix QA raporunu, özetini ve gözlemlenen olaylar yapıtını `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, ortamdaki sürücü ve SUT bot belirteçlerini kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği, sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış kiralamalara geçmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Aynı özel grupta iki farklı bot gerektirir; ayrıca SUT botunun bir Telegram kullanıcı adını göstermesi gerekir.
  - Kararlı botlar arası gözlem için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode’u etkinleştirin ve sürücü botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Telegram QA raporunu, özetini ve gözlemlenen mesajlar yapıtını `.artifacts/qa-e2e/...` altına yazar.

Canlı taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşımalar sapmaz:

`qa-channel`, geniş sentetik QA paketi olmaya devam eder ve canlı taşıma kapsam matrisi parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | İş parçacığı takibi | İş parçacığı yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | --------------------------------- | ------------------- | --------------------- | ------------- | ------------- |
| Matrix   | x      | x              | x               | x               | x                                 | x                   | x                     | x             |               |
| Telegram | x      |                |                 |                 |                                   |                     |                       |               | x             |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken bu kiralamaya Heartbeat gönderir ve kapanışta kiralamayı serbest bırakır.

Başvuru Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir gizli anahtar:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rol seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Varsayılan ortam: `OPENCLAW_QA_CREDENTIAL_ROLE` (varsayılan `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL’lerine izin verir.

Normal çalışmada `OPENCLAW_QA_CONVEX_SITE_URL`, `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer’lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Betiklerde ve CI yardımcı programlarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan uç nokta sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - İstek: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Başarı: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Tükenmiş/yeniden denenebilir: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /release`
  - İstek: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Başarı: `{ status: "ok" }` (veya boş `2xx`)
- `POST /admin/add` (yalnızca maintainer secret)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer secret)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer secret)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için yük şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği dizgesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı yükleri reddeder.

### QA’ye kanal ekleme

Bir kanalı markdown QA sistemine eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini uygulayan bir senaryo paketi.

Paylaşılan `qa-lab` ana makinesi akışı sahiplenebiliyorken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan ana makine mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- işçi eşzamanlılığı
- yapıt yazımı
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı plugin’leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` komutunun paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway’in bu taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- kayıt dökümlerinin ve normalleştirilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşıma-özel sıfırlama veya temizleme işlemlerinin nasıl ele alındığı

Yeni bir kanal için minimum benimseme eşiği şöyledir:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab` kalsın.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine dikişinde uygulayın.
3. Taşıma-özel mekanikleri çalıştırıcı plugin veya kanal harness’i içinde tutun.
4. Çalıştırıcıyı, rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın.
   Çalıştırıcı plugin’leri `openclaw.plugin.json` içinde `qaRunners` tanımlamalı ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` hafif kalmalıdır; tembel CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. `qa/scenarios/` altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo kasıtlı bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Bir davranış `qa-lab` içinde tek seferde ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu o çalıştırıcı plugin veya plugin harness’i içinde tutun.
- Bir senaryonun birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyacı varsa, `suite.ts` içinde kanala özgü bir dal eklemek yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşıma-özel tutun ve bunu senaryo sözleşmesinde açıkça belirtin.

Yeni senaryolar için tercih edilen genel yardımcı adları şunlardır:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Mevcut senaryolar için uyumluluk takma adları kullanılabilir olmaya devam eder, bunlar arasında şunlar vardır:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları, bayrak günü tarzı bir geçişten kaçınmak için vardır; yeni senaryo yazımı için model olarak değil.

## Test paketleri (ne nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan kararsızlık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: mevcut kapsamlı Vitest projeleri üzerinde on adet sıralı shard çalıştırması (`vitest.full-*.config.ts`)
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki çekirdek/unit envanterleri ve `vitest.unit.config.ts` tarafından kapsanan allowlist’e alınmış `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi entegrasyon testleri (Gateway kimlik doğrulama, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI’da çalışır
  - Gerçek anahtarlar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projeler notu:
  - Hedeflenmemiş `pnpm test` artık tek bir devasa yerel root-project süreci yerine on bir küçük shard yapılandırması (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS’yi azaltır ve auto-reply/uzantı işlerinin ilgisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch` hâlâ yerel root `vitest.config.ts` proje grafiğini kullanır, çünkü çok shard’lı bir izleme döngüsü pratik değildir.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam root proje başlatma maliyetini ödemez.
  - `pnpm test:changed`, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunduğunda değişen git yollarını aynı kapsamlı hatlara genişletir; config/setup düzenlemeleri ise yine geniş root-project yeniden çalıştırmasına düşer.
  - Agents, commands, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan import açısından hafif unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattı üzerinden yönlendirilir; durumlu/çalışma zamanı açısından ağır dosyalar mevcut hatlarda kalır.
  - Seçilmiş `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri, o dizin için tam ağır paketin yeniden çalıştırılmasını önler.
  - `auto-reply` artık üç özel kovaya sahiptir: üst düzey çekirdek yardımcılar, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır yanıt harness işlerini ucuz status/chunk/token testlerinden uzak tutar.
- Gömülü çalıştırıcı notu:
  - Mesaj-aracı keşif girdilerini veya Compaction çalışma zamanı bağlamını değiştirdiğinizde,
    kapsamanın her iki düzeyini de koruyun.
  - Saf yönlendirme/normalleştirme sınırları için odaklı yardımcı regresyonları ekleyin.
  - Ayrıca gömülü çalıştırıcı entegrasyon paketlerini de sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının hâlâ gerçek `run.ts` / `compact.ts` yollarından geçtiğini doğrular; yalnızca yardımcı testleri bu entegrasyon yolları için yeterli bir ikame değildir.
- Havuz notu:
  - Temel Vitest yapılandırması artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest yapılandırması ayrıca `isolate: false` değerini sabitler ve root projeleri, e2e ve canlı yapılandırmalar genelinde izole olmayan çalıştırıcıyı kullanır.
  - Root UI hattı `jsdom` kurulumunu ve optimizer’ını korur, ancak artık paylaşılan izole olmayan çalıştırıcı üzerinde çalışır.
  - Her `pnpm test` shard’ı, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalarda V8 derleme churn’ünü azaltmak için varsayılan olarak Vitest alt Node süreçlerine `--no-maglev` de ekler. Stok V8 davranışıyla karşılaştırmanız gerekiyorsa `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel iterasyon notu:
  - `pnpm test:changed`, değişen yollar daha küçük bir pakete temiz şekilde eşleniyorsa kapsamlı hatlar üzerinden yönlendirilir.
  - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur, yalnızca daha yüksek bir işçi sınırıyla.
  - Yerel işçi otomatik ölçeklendirmesi artık kasıtlı olarak daha muhafazakârdır ve ana makinenin yük ortalaması zaten yüksek olduğunda da geri çekilir; böylece birden fazla eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest yapılandırması, changed-mode yeniden çalıştırmalarının test kablolaması değiştiğinde doğru kalması için projeleri/yapılandırma dosyalarını `forceRerunTriggers` olarak işaretler.
  - Yapılandırma, desteklenen ana makinelerde `OPENCLAW_VITEST_FS_MODULE_CACHE` seçeneğini etkin tutar; doğrudan profilleme için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Perf-debug notu:
  - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve import döküm çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profilleme görünümünü `origin/main` sonrasındaki değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, bu commit edilmiş fark için yönlendirilmiş `test:changed` ile yerel root-project yolunu karşılaştırır ve duvar süresi ile macOS maksimum RSS’yi yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini `scripts/test-projects.mjs` ve root Vitest yapılandırması üzerinden yönlendirerek mevcut kirli ağacı kıyaslar.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform yükü için ana iş parçacığı CPU profilini yazar.
  - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışıyken unit paketi için çalıştırıcı CPU+heap profilleri yazar.

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` ve `isolate: false` kullanır.
  - Uyarlanabilir işçiler kullanır (CI: en fazla 2, yerel: varsayılan 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - İşçi sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirme ve daha ağır ağ iletişimi
- Beklentiler:
  - CI’da çalışır (boru hattında etkinleştirildiğinde)
  - Gerçek anahtarlar gerekmez
  - Unit testlerden daha fazla hareketli parçaya sahiptir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `test/openshell-sandbox.e2e.test.ts`
- Kapsam:
  - Docker üzerinden ana makinede yalıtılmış bir OpenShell Gateway başlatır
  - Geçici yerel bir Dockerfile’dan bir sandbox oluşturur
  - OpenClaw’ın OpenShell backend’ini gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Uzak kanonik dosya sistemi davranışını sandbox fs köprüsü üzerinden doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway’ini ve sandbox’ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary’si veya wrapper betiğine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçek kimlik bilgileriyle gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve oran sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI’da kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Paraya mal olur / oran sınırlarını kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeleri çalıştırmak tercih edilir
- Canlı çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` dosyasını kaynak olarak yükler.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` dizinini yalıtır ve config/auth materyalini geçici bir test home dizinine kopyalar; böylece unit fixture’ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Canlı testlerin gerçek home dizininizi kullanmasını bilerek istediğinizde yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve Gateway bootstrap günlükleri/Bonjour gürültüsünü susturur. Tam başlatma günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da canlıya özgü geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler oran sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık ilerleme satırlarını stderr’e gönderir; böylece Vitest konsol yakalaması sessiz olduğunda bile uzun sağlayıcı çağrılarının etkin olduğu görünür.
  - `vitest.live.config.ts`, canlı çalıştırmalarda sağlayıcı/Gateway ilerleme satırlarının anında akması için Vitest konsol engellemesini devre dışı bırakır.
  - Doğrudan model Heartbeat’lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat’lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (çok şey değiştirdiyseniz ayrıca `pnpm test:coverage`)
- Gateway ağı / WS protokolü / eşleştirme alanına dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum çalışmıyor” / sağlayıcıya özgü arızalar / araç çağırma sorunlarını hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı: Android Node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android Node tarafından şu anda duyurulan **her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Önkoşullandırılmış/manuel kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android Node için komut bazında Gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten bağlı ve Gateway ile eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Başarılı olmasını beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Android için tam kurulum ayrıntıları: [Android App](/tr/platforms/android)

## Canlı: model smoke (profil anahtarları)

Canlı testler, hataları izole edebilmek için iki katmana ayrılmıştır:

- “Doğrudan model”, sağlayıcı/modelin verilen anahtarla en azından yanıt verip veremediğini söyler.
- “Gateway smoke”, tam Gateway+agent hattının bu model için çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox politikası vb.).

### Katman 1: Doğrudan model tamamlama (Gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgisine sahip olduğunuz modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest’i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya `all`, modern için takma ad) ayarlayın; aksi halde `pnpm test:live` odağını Gateway smoke üzerinde tutmak için atlanır
- Modeller nasıl seçilir:
  - Modern allowlist’i çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern allowlist için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış allowlist)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş, yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir sınır için ise pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış allowlist)
- Anahtarlar nereden gelir:
  - Varsayılan olarak: profil deposu ve env fallback’leri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “Sağlayıcı API’si bozuk / anahtar geçersiz” ile “Gateway agent hattı bozuk” durumlarını ayırır
  - Küçük, yalıtılmış regresyonlar içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + araç çağrısı akışları)

### Katman 2: Gateway + geliştirme agent smoke (`@openclaw` gerçekte ne yapar)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içinde bir Gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılma)
  - Anahtarlı modeller üzerinde yinelemek ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısının çalışması (`read` probe)
    - isteğe bağlı ek araç probları (`exec+read` probe)
    - OpenAI regresyon yollarının (yalnızca araç çağrısı → takip) çalışmaya devam etmesi
- Probe ayrıntıları (hataları hızlı açıklayabilmeniz için):
  - `read` probe: test, çalışma alanına bir nonce dosyası yazar ve agent’tan bunu `read` etmesini ve nonce’u geri yankılamasını ister.
  - `exec+read` probe: test, agent’tan bir nonce’u geçici bir dosyaya `exec` ile yazmasını, ardından bunu geri `read` etmesini ister.
  - image probe: test, oluşturulmuş bir PNG (kedi + rastgeleleştirilmiş kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest’i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Modeller nasıl seçilir:
  - Varsayılan: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern allowlist için bir takma addır
  - Ya da daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all Gateway taramaları varsayılan olarak özenle seçilmiş, yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir sınır için ise pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir (“OpenRouter her şey” yaklaşımından kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış allowlist)
- Araç + image probe’ları bu canlı testte her zaman açıktır:
  - `read` probe + `exec+read` probe (araç stresi)
  - image probe, model image girişi desteğini duyurduğunda çalışır
  - Akış (üst düzey):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway, ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent, modele çok kipli bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Canlı: CLI backend smoke (Claude, Codex, Gemini veya diğer yerel CLI’lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan config’inize dokunmadan, yerel bir CLI backend kullanarak Gateway + agent hattını doğrulamak.
- Backend’e özgü smoke varsayılanları, sahibi olan uzantının `cli-backend.ts` tanımıyla birlikte yaşar.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest’i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/image davranışı, sahibi olan CLI backend plugin meta verisinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir image eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt içine enjekte edilir).
  - Image dosya yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında image argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur göndermek ve resume akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı oturum sürekliliği probe’unu devre dışı bırakmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçilen model bir geçiş hedefini desteklediğinde bunu zorla açmak için `1` ayarlayın).

Örnek:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-cli-backend
```

Tek sağlayıcılı Docker tarifleri:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notlar:

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` konumunda bulunur.
- Canlı CLI-backend smoke testini depo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- Sahibi olan uzantıdan CLI smoke meta verisini çözer, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` içindeki önbelleğe alınmış yazılabilir bir öneke kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, taşınabilir Claude Code abonelik OAuth’u gerektirir; bu ya `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` üzerinden ya da `claude setup-token` komutundan gelen `CLAUDE_CODE_OAUTH_TOKEN` ile sağlanır. Önce Docker içinde doğrudan `claude -p` çalışmasını doğrular, ardından Anthropic API anahtarı ortam değişkenlerini korumadan iki Gateway CLI-backend turu çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı sınırları yerine ek kullanım faturalandırması üzerinden yönlendirdiği için varsayılan olarak Claude MCP/tool ve image probe’larını devre dışı bırakır.
- Canlı CLI-backend smoke artık Claude, Codex ve Gemini için aynı uçtan uca akışı uygular: metin turu, image sınıflandırma turu, ardından Gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude’un varsayılan smoke testi ayrıca oturumu Sonnet’ten Opus’a yamalar ve yeniden başlatılan oturumun önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: ACP bind smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: canlı bir ACP agent ile gerçek ACP konuşma bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` göndermek
  - sentetik bir mesaj-kanalı konuşmasını yerinde bağlamak
  - aynı konuşmada normal bir takip mesajı göndermek
  - takibin bağlı ACP oturum kaydına düştüğünü doğrulamak
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP agent’ları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP agent: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP backend: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notlar:
  - Bu hat, testlerin harici teslim ediyormuş gibi davranmadan mesaj-kanalı bağlamı ekleyebilmesi için yöneticiye özel sentetik originating-route alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmamışsa test, seçilen ACP harness agent için gömülü `acpx` plugin’inin yerleşik agent kayıt defterini kullanır.

Örnek:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker tarifi:

```bash
pnpm test:docker:live-acp-bind
```

Tek agent’lı Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` konumunda bulunur.
- Varsayılan olarak ACP bind smoke testini desteklenen tüm canlı CLI agent’larına sırayla karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` dosyasını kaynak olarak yükler, eşleşen CLI kimlik doğrulama materyalini konteynıra hazırlar, `acpx`’i yazılabilir bir npm önekine kurar, ardından istenen canlı CLI’ı (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) eksikse kurar.
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar; böylece acpx, kaynak olarak yüklenen profildeki sağlayıcı ortam değişkenlerini alt harness CLI için kullanılabilir tutar.

## Canlı: Codex app-server harness smoke

- Amaç: plugin’e ait Codex harness’ini normal Gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketli `codex` plugin’ini yüklemek
  - `OPENCLAW_AGENT_RUNTIME=codex` seçmek
  - `codex/gpt-5.4` için ilk bir Gateway agent turu göndermek
  - aynı OpenClaw oturumuna ikinci bir tur göndermek ve app-server
    thread’inin resume yapabildiğini doğrulamak
  - aynı Gateway komut
    yolu üzerinden `/codex status` ve `/codex models` çalıştırmak
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness’i sessizce PI’ya geri düşerek testi geçemez.
- Kimlik doğrulama: shell/profile içinden `OPENAI_API_KEY`, ayrıca isteğe bağlı olarak kopyalanan
  `~/.codex/auth.json` ve `~/.codex/config.toml`

Yerel tarif:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker tarifi:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` konumunda bulunur.
- Bağlanan `~/.profile` dosyasını kaynak olarak yükler, `OPENAI_API_KEY` geçirir, varsa Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir, bağlanmış bir npm
  önekine kurar, kaynak ağacını hazırlar ve ardından yalnızca Codex-harness canlı testini çalıştırır.
- Docker, image ve MCP/tool probe’larını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama çalıştırmasına ihtiyaç duyduğunuzda
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu, canlı
  test yapılandırmasıyla eşleşir; böylece `openai-codex/*` veya PI fallback bir Codex harness
  regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar, açık allowlist’ler en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (Gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birden çok sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...`, Gemini API’yi kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı agent uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI’ı kullanır (ayrı kimlik doğrulama + araç farklılıkları).
- Gemini API ile Gemini CLI karşılaştırması:
  - API: OpenClaw, Google’ın barındırılan Gemini API’sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw, yerel bir `gemini` binary’sini shell üzerinden çağırır; kendi kimlik doğrulamasına sahiptir ve farklı davranabilir (streaming/araç desteği/sürüm kayması).

## Canlı: model matrisi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (canlı testler isteğe bağlıdır), ancak anahtarlara sahip bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modeller bunlardır.

### Modern smoke seti (araç çağırma + image)

Çalışmaya devam etmesini beklediğimiz “yaygın modeller” çalıştırması budur:

- OpenAI (Codex dışı): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + image ile Gateway smoke çalıştırması:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel seviye: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesi için en az bir tane seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olması iyi olur):

- xAI: `xai/grok-4` (veya mevcut en son sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Vision: image gönderme (ek → çok kipli mesaj)

Image probe’unu çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir image yetenekli model ekleyin (Claude/Gemini/OpenAI vision yetenekli varyantları vb.).

### Toplayıcılar / alternatif Gateway’ler

Anahtarlarınız etkinse, şu yollar üzerinden de test desteklenir:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+image yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile kimlik doğrulama)

Canlı matrise ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/config’iniz varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca OpenAI/Anthropic uyumlu herhangi bir proxy (LM Studio, vLLM, LiteLLM vb.)

İpucu: belgelerde “tüm modelleri” sabitlemeye çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler, kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçları:

- CLI çalışıyorsa, canlı testler de aynı anahtarları bulmalıdır.
- Canlı bir test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimini hata ayıklar gibi hata ayıklayın.

- Agent başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profil anahtarları” denince kastedilen budur)
- Config: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (mevcutsa hazırlanan canlı home dizinine kopyalanır, ancak ana profil-anahtar deposu değildir)
- Yerel canlı çalıştırmalar varsayılan olarak etkin config’i, agent başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini geçici bir test home dizinine kopyalar; hazırlanan canlı home dizinleri `workspace/` ve `sandboxes/` dizinlerini atlar, ayrıca probe’ların gerçek ana makine çalışma alanınıza dokunmaması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır.

Ortam anahtarlarına güvenmek istiyorsanız (örneğin `~/.profile` içinde dışa aktarılmışsa), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (`~/.profile` dosyasını konteynıra bağlayabilirler).

## Deepgram canlı (ses transkripsiyonu)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan canlı

- Test: `src/agents/byteplus.live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- İsteğe bağlı model geçersiz kılma: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media canlı

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy image, video ve `music_generate` yollarını çalıştırır
  - `models.providers.comfy.<capability>` yapılandırılmadıysa her yeteneği atlar
  - Comfy workflow gönderimi, yoklama, indirmeler veya plugin kaydı değiştirildikten sonra kullanışlıdır

## Image generation canlı

- Test: `src/image-generation/runtime.live.test.ts`
- Komut: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her image-generation sağlayıcı plugin’ini numaralandırır
  - Probe yapmadan önce eksik sağlayıcı ortam değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak canlı/env API anahtarlarını kayıtlı kimlik doğrulama profillerinin önünde kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/modeli olmayan sağlayıcıları atlar
  - Stok image-generation varyantlarını paylaşılan çalışma zamanı yeteneği üzerinden çalıştırır:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Şu anda kapsanan paketli sağlayıcılar:
  - `openai`
  - `google`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Music generation canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketli music-generation sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax’i kapsar
  - Probe yapmadan önce sağlayıcı ortam değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak canlı/env API anahtarlarını kayıtlı kimlik doğrulama profillerinin önünde kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/modeli olmayan sağlayıcıları atlar
  - Kullanılabilir olduğunda bildirilen her iki çalışma zamanı modunu da çalıştırır:
    - Yalnızca prompt girdisiyle `generate`
    - Sağlayıcı `capabilities.edit.enabled` bildiriyorsa `edit`
  - Mevcut paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video generation canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketli video-generation sağlayıcı yolunu çalıştırır
  - Varsayılan olarak release-safe smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik lobster prompt’u ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` içinden gelen sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi release süresine baskın gelebileceği için varsayılan olarak FAL’i atlar; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` verin
  - Probe yapmadan önce sağlayıcı ortam değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak canlı/env API anahtarlarını kayıtlı kimlik doğrulama profillerinin önünde kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Kullanılabilir olduğunda bildirilen dönüşüm modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada tampon destekli yerel image girdisini kabul ediyorsa `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada tampon destekli yerel video girdisini kabul ediyorsa `videoToVideo`
  - Paylaşılan taramada şu anda bildirilen ancak atlanan `imageToVideo` sağlayıcıları:
    - `vydra`; çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak bir image URL’si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak uzak image URL fixture’ı kullanan bir `kling` hattının yanı sıra `veo3` text-to-video çalıştırır
  - Şu anki `videoToVideo` canlı kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda bildirilen ancak atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`; çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL’leri gerektiriyor
    - `google`; çünkü mevcut paylaşılan Gemini/Veo hattı yerel tampon destekli girdi kullanıyor ve bu yol paylaşılan taramada kabul edilmiyor
    - `openai`; çünkü mevcut paylaşılan hat, kuruma özgü video inpaint/remix erişim garantilerine sahip değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramadaki FAL dâhil her sağlayıcıyı eklemek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için sağlayıcı başına işlem sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı harness’i

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan image, music ve video canlı paketlerini depo yerel tek bir giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı ortam değişkenlerini `~/.profile` içinden otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir kimlik doğrulamaya sahip sağlayıcılara otomatik olarak daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı “Linux’ta çalışıyor” kontrolleri)

Bu Docker çalıştırıcıları iki kovaya ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, depo Docker imajı içinde yalnızca eşleşen profil-anahtarı canlı dosyalarını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`); yerel config dizininizi ve çalışma alanınızı bağlar (ve bağlanmışsa `~/.profile` dosyasını kaynak olarak yükler). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` komutlarıdır.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırı kullanır; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12`, ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` ayarlarını kullanır. Daha büyük kapsamlı taramayı açıkça istediğinizde bu ortam değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını bir kez `test:docker:live-build` ile oluşturur, ardından bunu iki canlı Docker hattı için yeniden kullanır.
- Konteyner smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` ve `test:docker:plugins`; bir veya daha fazla gerçek konteyner başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI kimlik doğrulama home dizinlerini (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, ardından harici CLI OAuth’un ana makine kimlik doğrulama deposunu değiştirmeden belirteçleri yenileyebilmesi için bunları çalıştırma öncesinde konteyner home dizinine kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme agent’ı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI canlı smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskelet): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Gateway ağı (iki konteyner, WS kimlik doğrulama + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- MCP kanal köprüsü (seed edilmiş Gateway + stdio bridge + ham Claude bildirim-çerçevesi smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (kurulum smoke + `/plugin` takma adı + Claude bundle yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)

Canlı model Docker çalıştırıcıları ayrıca mevcut checkout’u yalnızca okunur olarak bind-mount eder ve
konteyner içinde geçici bir çalışma dizinine hazırlar. Bu, çalışma zamanı
imajını ince tutarken yine de Vitest’i tam olarak yerel kaynak/config’inize karşı çalıştırır.
Hazırlama adımı `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya özel `.build` veya
Gradle çıktı dizinleri gibi büyük yalnızca yerel önbellekleri ve uygulama derleme çıktılarını atlar; böylece Docker canlı çalıştırmaları makineye özgü yapıtları
dakikalarca kopyalamaz.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece Gateway canlı probe’ları
konteyner içinde gerçek Telegram/Discord/vb. kanal işçilerini başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle bu Docker hattında Gateway canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de iletin.
`test:docker:openwebui`, daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkin olan bir
OpenClaw Gateway konteyneri başlatır,
bu Gateway’e karşı sabitlenmiş bir Open WebUI konteyneri başlatır, Open WebUI üzerinden oturum açar,
`/api/models` yolunun `openclaw/default` değerini sunduğunu doğrular, ardından
Open WebUI’nin `/api/chat/completions` proxy’si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin şekilde daha yavaş olabilir; çünkü Docker’ın
Open WebUI imajını çekmesi gerekebilir ve Open WebUI’nin de kendi soğuk başlatma kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve Docker’laştırılmış çalıştırmalarda bunu sağlamak için birincil yol
`OPENCLAW_PROFILE_FILE` (`varsayılan olarak ~/.profile`) değeridir.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Seed edilmiş bir Gateway
konteyneri başlatır, `openclaw mcp serve` oluşturan ikinci bir konteyner başlatır, ardından
yönlendirilmiş konuşma keşfini, kayıt dökümü okumalarını, ek meta verilerini,
canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı kanal +
izin bildirimlerini gerçek stdio MCP köprüsü üzerinden doğrular. Bildirim denetimi
ham stdio MCP çerçevelerini doğrudan inceler; böylece smoke testi belirli bir istemci SDK’sının tesadüfen ortaya çıkardığını değil,
köprünün gerçekten ne yaydığını doğrular.

Manuel ACP sade dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için saklayın. ACP thread yönlendirme doğrulaması için tekrar gerekebilir, bu yüzden silmeyin.

Yararlı ortam değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` dizinine bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` dizinine bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` dosyasına bağlanır ve testler çalıştırılmadan önce kaynak olarak yüklenir
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` dizinine bağlanır
- `$HOME` altındaki harici CLI kimlik doğrulama dizinleri/dosyaları `/host-auth...` altına salt okunur olarak bağlanır, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - Elle geçersiz kılmak için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Konteyner içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalar için mevcut `openclaw:local-live` imajını yeniden kullanmak amacıyla `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env’den değil profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için Gateway tarafından sunulan modeli seçmek amacıyla `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testinin kullandığı nonce denetim prompt’unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Doküman tutarlılığı

Belge düzenlemelerinden sonra docs denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI-safe)

Bunlar gerçek sağlayıcılar olmadan “gerçek hat” regresyonlarıdır:

- Gateway araç çağırma (sahte OpenAI, gerçek Gateway + agent döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, config + auth yazımı zorunlu): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Agent güvenilirliği değerlendirmeleri (Skills)

Zaten “agent güvenilirliği değerlendirmeleri” gibi davranan birkaç CI-safe testimiz var:

- Gerçek Gateway + agent döngüsü üzerinden sahte araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve config etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar ([Skills](/tr/tools/skills) bölümüne bakın):

- **Karar verme:** Skills prompt içinde listelendiğinde, agent doğru Skill’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanımdan önce `SKILL.md` dosyasını okuyor mu ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi devralımını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, Skill dosyası okumalarını ve oturum kablolamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, geçitleme, prompt injection).
- İsteğe bağlı canlı değerlendirmeler (env ile geçitlenen), yalnızca CI-safe paket yerleştirildikten sonra.

## Sözleşme testleri (plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her plugin ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm plugin’ler üzerinde yineleme yapar ve
şekil ile davranış doğrulamalarından oluşan bir paket çalıştırır. Varsayılan `pnpm test` unit hattı bu paylaşılan dikiş ve smoke dosyalarını
özellikle atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını
açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` konumunda bulunur:

- **plugin** - Temel plugin şekli (id, name, capabilities)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj yükü yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup politikası zorlaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` konumunda bulunur.

- **status** - Kanal durum probe’ları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` konumunda bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi/tercihi
- **catalog** - Model katalog API’si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- `plugin-sdk` dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı plugin’i ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehber)

Canlı testlerde keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI-safe bir regresyon ekleyin (sahte/stub sağlayıcı ya da tam istek-şekli dönüşümünü yakalayın)
- Sorun doğası gereği yalnızca canlıysa (oran sınırları, kimlik doğrulama politikaları), canlı testi dar ve env değişkenleriyle isteğe bağlı tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/replay hatası → doğrudan modeller testi
  - Gateway oturum/geçmiş/araç hattı hatası → Gateway canlı smoke veya CI-safe Gateway mock testi
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından traversal segment exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içine yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testte `classifyTargetClass` işlevini güncelleyin. Test, sınıflandırılmamış hedef kimliklerinde kasıtlı olarak başarısız olur; böylece yeni sınıflar sessizce atlanamaz.
