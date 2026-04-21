---
read_when:
    - Testleri yerelde veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: birim/e2e/canlı paketler, Docker çalıştırıcıları ve her testin neyi kapsadığı'
title: Test etme
x-i18n:
    generated_at: "2026-04-21T09:00:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3290113f28dab37f4b6ceb0bda6ced70c7d2b24ad3fccac6488b6aab1ad65e52
    source_path: help/testing.md
    workflow: 15
---

# Test etme

OpenClaw'ın üç Vitest paketi (birim/entegrasyon, e2e, canlı) ve küçük bir Docker çalıştırıcı kümesi vardır.

Bu belge bir “nasıl test ediyoruz” kılavuzudur:

- Her paketin neyi kapsadığı (ve özellikle neyi _kapsamadığı)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Canlı testlerin kimlik bilgilerini nasıl bulduğu ve model/sağlayıcıları nasıl seçtiği
- Gerçek dünya model/sağlayıcı sorunları için regresyonların nasıl ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/kanal yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılar/modellerde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + gateway araç/görüntü probe'ları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıysa önce
  `openclaw models list --provider moonshot --json`, ardından
  `moonshot/kimi-k2.6` üzerinde yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON'un Moonshot/K2.6 bildirdiğini ve
  asistan transkriptinin normalize edilmiş `usage.cost` depoladığını doğrulayın.

İpucu: yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, aşağıda açıklanan izin listesi ortam değişkenleri aracılığıyla canlı testleri daraltmayı tercih edin.

## QA'ya özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan ana bilgisayarda çalıştırır.
  - Varsayılan olarak yalıtılmış
    gateway çalışanlarıyla birden çok seçili senaryoyu paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılık 4 kullanır (seçilen senaryo sayısıyla sınırlıdır).
    Çalışan sayısını ayarlamak için `--concurrency <count>`, eski seri hat için `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız
    `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, deneysel
    fixture ve protokol-mock kapsamı için yerel AIMock destekli bir sağlayıcı sunucusu başlatır; senaryo farkında
    `mock-openai` hattının yerini almaz.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini geçici bir Multipass Linux VM içinde çalıştırır.
  - Ana bilgisayardaki `qa suite` ile aynı senaryo seçme davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve mevcutsa `CODEX_HOME`.
  - Çıktı dizinleri repo kökü altında kalmalıdır ki misafir bağlanmış çalışma alanı üzerinden geri yazabilsin.
  - Normal QA raporu + özetin yanı sıra Multipass günlüklerini de
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, Gateway'i
    OpenAI yapılandırılmış şekilde başlatır, ardından Telegram ve Discord'u yapılandırma düzenlemeleriyle etkinleştirir.
  - İlk Gateway yeniden başlatmasının her paketlenmiş kanal plugin'inin çalışma zamanı bağımlılıklarını isteğe bağlı olarak kurduğunu doğrular, ikinci yeniden başlatmanın ise
    zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke
    testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını, geçici Docker destekli bir Tuwunel homeserver'a karşı çalıştırır.
  - Bu QA ana bilgisayarı bugün repo/geliştirme içindir. Paketlenmiş OpenClaw kurulumları
    `qa-lab` göndermez, dolayısıyla `openclaw qa` sunmaz.
  - Repo checkout'ları paketlenmiş çalıştırıcıyı doğrudan yükler; ayrı bir plugin kurulum
    adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ve bir özel oda provision eder, ardından gerçek Matrix plugin'iyle SUT taşıması olarak bir QA gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel imajı `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir imajı test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, hattın geçici kullanıcıları yerel olarak provision etmesi nedeniyle paylaşılan kimlik bilgisi kaynağı bayrakları sunmaz.
  - Matrix QA raporu, özet, gözlemlenen olaylar artifact'i ve birleşik stdout/stderr çıktı günlüğünü `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, ortamdan alınan driver ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak ortam modunu kullanın veya havuzlanmış kiralamalara katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız
    `--allow-failures` kullanın.
  - Aynı özel grupta iki farklı bot gerektirir ve SUT botunun bir Telegram kullanıcı adı sunması gerekir.
  - Kararlı bottan-bota gözlem için `@BotFather` içinde her iki bot için de Bot-to-Bot Communication Mode'u etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Telegram QA raporu, özet ve gözlemlenen mesajlar artifact'ini `.artifacts/qa-e2e/...` altına yazar.

Canlı taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşımalar sapmaz.

`qa-channel`, geniş sentetik QA paketi olarak kalır ve canlı
taşıma kapsam matrisinin parçası değildir.

| Hat      | Canary | Mention geçitleme | İzin listesi engeli | Üst düzey yanıt | Yeniden başlatma sonrası devam | İş parçacığı takibi | İş parçacığı yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | ----------------- | ------------------- | --------------- | ------------------------------ | ------------------- | --------------------- | ------------- | ------------- |
| Matrix   | x      | x                 | x                   | x               | x                              | x                   | x                     | x             |               |
| Telegram | x      |                   |                     |                 |                                |                     |                       |               | x            |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde,
QA lab, Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken
bu kiralamaya Heartbeat gönderir ve kapanışta kiralamayı serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir gizli anahtar:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Ortam varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, diğer durumlarda `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Betikler ve CI yardımcıları için makine tarafından okunabilir çıktı adına `--json` kullanın.

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
- `POST /admin/add` (yalnızca maintainer gizli anahtarı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer gizli anahtarı)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer gizli anahtarı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için yük şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği string'i olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı yükleri reddeder.

### QA'ya kanal ekleme

Bir kanalı markdown QA sistemine eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini kullanan bir senaryo paketi.

Paylaşılan `qa-lab` ana bilgisayarı
akışın sahibi olabiliyorken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan ana bilgisayar mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- çalışan eşzamanlılığı
- artifact yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı plugin'leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- gateway'in bu taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl kontrol edildiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transkriptlerin ve normalize edilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için asgari benimseme çıtası şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab` kalsın.
2. Paylaşılan `qa-lab` ana bilgisayar dikişinde taşıma çalıştırıcısını uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı plugin'i veya kanal harness'i içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın.
   Çalıştırıcı plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi export etmelidir.
   `runtime-api.ts` hafif kalsın; tembel CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Tematik `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Repo bilinçli bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu o çalıştırıcı plugin'inde veya plugin harness'inde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yetenek gerektiriyorsa, `suite.ts` içinde kanala özgü bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa, senaryoyu taşımaya özgü tutun ve bunu senaryo sözleşmesinde açıkça belirtin.

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

Mevcut senaryolar için uyumluluk takma adları kullanılmaya devam eder, bunlara şunlar dahildir:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları bir bayrak günü geçişinden kaçınmak içindir, yeni senaryo yazımı
için model değildir.

## Test paketleri (nerede ne çalışır)

Paketleri “artan gerçekçilik” (ve artan kararsızlık/maliyet) olarak düşünün:

### Birim / entegrasyon (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: mevcut kapsamlı Vitest projeleri üzerinde on sıralı shard çalıştırması (`vitest.full-*.config.ts`)
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki core/birim envanterleri ve `vitest.unit.config.ts` tarafından kapsanan izin listeli `ui` node testleri
- Kapsam:
  - Saf birim testleri
  - Süreç içi entegrasyon testleri (gateway kimlik doğrulama, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
- Proje notu:
  - Hedeflenmemiş `pnpm test` artık tek bir devasa yerel kök-proje süreci yerine on bir küçük shard yapılandırması (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS'yi düşürür ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch`, çok parçalı bir watch döngüsü pratik olmadığından hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
  - `pnpm test:changed`, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunduğunda değişen git yollarını aynı kapsamlı hatlara genişletir; yapılandırma/kurulum düzenlemeleri hâlâ geniş kök-proje yeniden çalıştırmasına geri döner.
  - `pnpm check:changed`, dar çalışmalar için normal akıllı yerel kapıdır. Farkı core, core testleri, extensions, extension testleri, uygulamalar, belgeler ve araçlar olarak sınıflandırır, ardından eşleşen typecheck/lint/test hatlarını çalıştırır. Açık Plugin SDK ve plugin-contract değişiklikleri, extension'lar bu core sözleşmelerine bağlı olduğu için extension doğrulamasını içerir.
  - Ajanlar, komutlar, plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzer saf yardımcı alanlardan gelen import-light birim testleri `unit-fast` hattı üzerinden yönlendirilir; bu hat `test/setup-openclaw-runtime.ts` dosyasını atlar. Durumlu/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
  - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri bu dizin için tam ağır paketi yeniden çalıştırmaktan kaçınır.
  - `auto-reply` artık üç adanmış kovaya sahiptir: üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır reply harness işini ucuz status/chunk/token testlerinden uzak tutar.
- Gömülü çalıştırıcı notu:
  - Mesaj-aracı keşif girdilerini veya Compaction çalışma zamanı bağlamını değiştirdiğinizde,
    kapsamın her iki düzeyini de koruyun.
  - Saf yönlendirme/normalleştirme sınırları için odaklı yardımcı regresyonları ekleyin.
  - Ayrıca gömülü çalıştırıcı entegrasyon paketlerini sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının gerçek `run.ts` / `compact.ts` yolları üzerinden akmaya devam ettiğini doğrular; yalnızca yardımcı testleri bu entegrasyon yollarının
    yeterli bir ikamesi değildir.
- Havuz notu:
  - Temel Vitest yapılandırması artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest yapılandırması ayrıca `isolate: false` sabitler ve kök projeler, e2e ve canlı yapılandırmalar genelinde izole olmayan çalıştırıcıyı kullanır.
  - Kök UI hattı `jsdom` kurulumunu ve optimize edicisini korur, ancak artık paylaşılan izole olmayan çalıştırıcı üzerinde de çalışır.
  - Her `pnpm test` shard'ı, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalar sırasında V8 derleme dalgalanmasını azaltmak için Vitest alt Node süreçlerine varsayılan olarak `--no-maglev` da ekler. Stok V8 davranışıyla karşılaştırmak istiyorsanız `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel yineleme notu:
  - `pnpm changed:lanes`, bir farkın hangi mimari hatları tetiklediğini gösterir.
  - Pre-commit hook, aşamalı biçimlendirme/lint işleminden sonra `pnpm check:changed --staged` çalıştırır; böylece yalnızca core commit'ler, kamuya açık extension yüzeyli sözleşmelere dokunmadıkça extension test maliyeti ödemez.
  - `pnpm test:changed`, değişen yollar daha küçük bir pakete temiz şekilde eşleniyorsa kapsamlı hatlar üzerinden yönlendirir.
  - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur, yalnızca daha yüksek çalışan sınırıyla.
  - Yerel çalışan otomatik ölçekleme artık kasıtlı olarak daha muhafazakârdır ve ana bilgisayar yük ortalaması zaten yüksek olduğunda da geri çekilir; böylece birden çok eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest yapılandırması proje/yapılandırma dosyalarını `forceRerunTriggers` olarak işaretler; böylece test kablolaması değiştiğinde changed-mode yeniden çalıştırmalar doğru kalır.
  - Yapılandırma, desteklenen ana bilgisayarlarda `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profilleme için açık bir önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Performans hata ayıklama notu:
  - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve import döküm çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profilleme görünümünü `origin/main` sonrası değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, o commit edilmiş fark için yönlendirilmiş `test:changed` ile yerel kök-proje yolunu karşılaştırır ve duvar saati artı macOS max RSS yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek geçerli kirli ağacı kıyaslar.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve dönüştürme yükü için ana iş parçacığı CPU profili yazar.
  - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışı bırakılmış şekilde birim paketi için çalıştırıcı CPU+heap profilleri yazar.

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlanabilir çalışanlar kullanır (CI: en fazla 2, yerelde: varsayılan 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Çalışan sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirme ve daha ağır ağ çalışmaları
- Beklentiler:
  - CI'da çalışır (boru hattında etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Birim testlerinden daha fazla hareketli parça vardır (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `test/openshell-sandbox.e2e.test.ts`
- Kapsam:
  - Ana bilgisayarda Docker aracılığıyla yalıtılmış bir OpenShell gateway başlatır
  - Geçici yerel Dockerfile'dan bir sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw'ın OpenShell backend'ini çalıştırır
  - Sandbox fs köprüsü üzerinden remote-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca katılımlı; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI artı çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, sonra test gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI binary'sine veya sarmalayıcı betiğe işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`
- Varsayılan: `pnpm test:live` ile **etkin** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçekten _çalışıyor mu_ ve gerçek kimlik bilgileriyle?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı ilkeleri, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - “Her şey” yerine daraltılmış alt kümeleri çalıştırmak tercih edilir
- Canlı çalıştırmalar eksik API anahtarlarını almak için `~/.profile` kaynağını yükler.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME`'u yalıtır ve yapılandırma/kimlik doğrulama materyalini geçici bir test ana dizinine kopyalar; böylece birim fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Canlı testlerin gerçek ana dizininizi kullanmasını özellikle istediğinizde yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap günlükleri/Bonjour gürültüsünü susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçiminde `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da canlıya özgü geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık uzun sağlayıcı çağrılarının Vitest konsol yakalama sessizken bile görünür şekilde etkin olmasını sağlamak için stderr'e ilerleme satırları yazar.
  - `vitest.live.config.ts`, canlı çalıştırmalar sırasında sağlayıcı/gateway ilerleme satırlarının anında akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model Heartbeat'larını `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat'larını `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` da)
- Gateway ağ yapısı / WS protokolü / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum çalışmıyor” / sağlayıcıya özgü arızalar / araç çağırma hata ayıklaması yapıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı: Android node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android node tarafından şu anda ilan edilen **her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/el ile kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android node için komut bazında gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten gateway'e bağlı ve eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Başarılı olmasını beklediğiniz yetenekler için izinler/çekim onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android App](/tr/platforms/android)

## Canlı: model smoke (profil anahtarları)

Canlı testler, hataları izole edebilmek için iki katmana ayrılmıştır:

- “Doğrudan model”, sağlayıcının/modelin verilen anahtarla en azından yanıt verip veremediğini söyler.
- “Gateway smoke”, tam gateway+ajan hattının o modelle çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgilerinizin olduğu modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi takdirde `pnpm test:live` komutunu gateway smoke üzerinde odaklı tutmak için atlanır
- Modeller nasıl seçilir:
  - Modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış izin listesi)
  - Modern/all taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış izin listesi)
- Anahtarların geldiği yer:
  - Varsayılan olarak: profil deposu ve ortam fallback'leri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “Sağlayıcı API'si bozuk / anahtar geçersiz” ile “gateway ajan hattı bozuk” ayrımını yapar
  - Küçük, yalıtılmış regresyonlar içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + araç çağrısı akışları)

### Katman 2: Gateway + geliştirme ajanı smoke (`@openclaw`'ın gerçekten yaptığı şey)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir gateway başlatmak
  - `agent:dev:*` oturumu oluşturmak/yamamak (çalıştırma başına model geçersiz kılma)
  - Anahtarlı modeller üzerinde yinelemek ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısı çalışıyor (read probe)
    - isteğe bağlı ek araç probe'ları (exec+read probe)
    - OpenAI regresyon yolları (yalnızca araç çağrısı → takip) çalışmaya devam ediyor
- Probe ayrıntıları (böylece hataları hızlı açıklayabilirsiniz):
  - `read` probe: test çalışma alanına bir nonce dosyası yazar ve ajandan onu `read` edip nonce'u geri yankılamasını ister.
  - `exec+read` probe: test ajandan geçici bir dosyaya nonce yazmak için `exec` kullanmasını, ardından onu geri `read` etmesini ister.
  - görüntü probe'u: test oluşturulmuş bir PNG (kedi + rastgele kod) ekler ve modelden `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Modeller nasıl seçilir:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir takma addır
  - Ya da daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir (“OpenRouter her şey”den kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış izin listesi)
- Araç + görüntü probe'ları bu canlı testte her zaman açıktır:
  - `read` probe + `exec+read` probe (araç stresi)
  - görüntü probe'u, model görüntü girişi desteği ilan ettiğinde çalışır
  - Akış (üst düzey):
    - Test “CAT” + rastgele kod ile küçük bir PNG oluşturur (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü ajan modele çok kipli bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Canlı: CLI backend smoke (Claude, Codex, Gemini veya diğer yerel CLI'lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan yerel bir CLI backend kullanarak Gateway + ajan hattını doğrulamak.
- Backend'e özgü smoke varsayılanları, sahibi olan extension'ın `cli-backend.ts` tanımıyla birlikte bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görüntü davranışı, sahibi olan CLI backend plugin meta verisinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek görüntü eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt'a enjekte edilir).
  - Görüntü dosyası yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlı olduğunda görüntü argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci dönüşü göndermek ve devam etme akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı oturum sürekliliği probe'unu devre dışı bırakmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçili model bir geçiş hedefini desteklediğinde bunu zorla açmak için `1` ayarlayın).

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
- Canlı CLI-backend smoke testini repo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI smoke meta verisini sahibi olan extension'dan çözümler, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) önbelleğe alınmış yazılabilir bir öneke kurar: `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, ya `~/.claude/.credentials.json` içindeki `claudeAiOauth.subscriptionType` ya da `claude setup-token` içinden `CLAUDE_CODE_OAUTH_TOKEN` aracılığıyla taşınabilir Claude Code abonelik OAuth'u gerektirir. Önce Docker içinde doğrudan `claude -p` komutunu doğrular, ardından Anthropic API anahtarı ortam değişkenlerini korumadan iki Gateway CLI-backend dönüşü çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik plan sınırları yerine ek kullanım faturalandırması üzerinden yönlendirdiği için Claude MCP/araç ve görüntü probe'larını varsayılan olarak devre dışı bırakır.
- Canlı CLI-backend smoke testi artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin dönüşü, görüntü sınıflandırma dönüşü, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a yamalar ve devam ettirilen oturumun önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: ACP bağlama smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: gerçek ACP konuşma bağlama akışını canlı bir ACP ajanıyla doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir mesaj-kanalı konuşmasını yerinde bağla
  - aynı konuşma üzerinde normal bir takip gönder
  - takibin bağlı ACP oturum transkriptine düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP ajanları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP ajanı: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP backend: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notlar:
  - Bu hat, testlerin harici teslimat yapıyormuş gibi davranmadan mesaj-kanalı bağlamını ekleyebilmesi için admin-only sentetik originating-route alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlı değilse test, seçilen ACP harness ajanı için gömülü `acpx` plugin'inin yerleşik ajan kayıt defterini kullanır.

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

Tek ajanlı Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` konumunda bulunur.
- Varsayılan olarak ACP bind smoke testini sırayla desteklenen tüm canlı CLI ajanlarına karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` kaynağını yükler, eşleşen CLI kimlik doğrulama materyalini kapsayıcıya taşır, `acpx`'i yazılabilir bir npm önekine kurar, ardından eksikse istenen canlı CLI'ı (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) kurar.
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar; böylece acpx, kaynağı yüklenen profilden gelen sağlayıcı ortam değişkenlerini alt harness CLI için erişilebilir tutar.

## Canlı: Codex app-server harness smoke

- Amaç: plugin sahipli Codex harness'ini normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - `codex/gpt-5.4` için ilk gateway ajan dönüşünü gönder
  - aynı OpenClaw oturumuna ikinci bir dönüş gönder ve app-server
    iş parçacığının devam edebildiğini doğrula
  - `/codex status` ve `/codex models` komutlarını aynı gateway komut
    yolu üzerinden çalıştır
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı görüntü probe'u: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç probe'u: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness'i sessizce PI'a geri dönerek başarılı olamaz.
- Kimlik doğrulama: kabuktan/profilden `OPENAI_API_KEY`, ayrıca isteğe bağlı olarak kopyalanmış
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
- Bağlanan `~/.profile` dosyasını yükler, `OPENAI_API_KEY` geçirir, mevcutsa Codex CLI
  kimlik doğrulama dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bir bağlanmış npm
  önekine kurar, kaynak ağacını hazırlar, sonra yalnızca Codex-harness canlı testini çalıştırır.
- Docker varsayılan olarak görüntü ve MCP/araç probe'larını etkinleştirir. Daha dar bir hata ayıklama çalıştırması gerektiğinde
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` export eder; bu canlı
  test yapılandırmasıyla eşleşir, böylece `openai-codex/*` veya PI fallback bir Codex harness
  regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar, açık izin listeleri en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...`, Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı ajan uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI'ı kullanır (ayrı kimlik doğrulama + araç kullanımı tuhaflıkları).
- Gemini API ve Gemini CLI:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil kimlik doğrulaması); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw, yerel bir `gemini` binary'sini kabuktan çalıştırır; kendi kimlik doğrulamasına sahiptir ve farklı davranabilir (akış/araç desteği/sürüm kayması).

## Canlı: model matrisi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (canlı testler isteğe bağlıdır), ancak geliştirici makinesinde anahtarlarla düzenli olarak kapsanması **önerilen** modeller bunlardır.

### Modern smoke kümesi (araç çağırma + görüntü)

Çalışmaya devam etmesini beklediğimiz “yaygın modeller” çalıştırması budur:

- OpenAI (Codex dışı): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görüntü ile gateway smoke çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel: araç çağırma (Read + isteğe bağlı Exec)

Sağlayıcı ailesi başına en az bir tane seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olsa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en yeni sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz araç yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Vision: görüntü gönderimi (ek → çok kipli mesaj)

Görüntü probe'unu çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görüntü yetenekli model ekleyin (Claude/Gemini/OpenAI vision yetenekli varyantları vb.).

### Toplayıcılar / alternatif gateway'ler

Anahtarlarınız etkinse, şu yollar üzerinden de test etmeyi destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görüntü yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...`, Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile kimlik doğrulama)

Canlı matrise ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` aracılığıyla (özel uç noktalar): `minimax` (bulut/API) ve OpenAI/Anthropic uyumlu tüm proxy'ler (LM Studio, vLLM, LiteLLM vb.)

İpucu: belgelerde “tüm modelleri” sabitlemeye çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa, canlı testler de aynı anahtarları bulmalıdır.
- Bir canlı test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimini nasıl hata ayıklıyorsanız aynı şekilde hata ayıklayın.

- Ajan başına kimlik doğrulama profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profil anahtarları” bunun anlamına gelir)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (mevcutsa hazırlanmış canlı ana dizine kopyalanır, ancak ana profil-anahtarı deposu bu değildir)
- Canlı yerel çalıştırmalar varsayılan olarak etkin yapılandırmayı, ajan başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI kimlik doğrulama dizinlerini geçici bir test ana dizinine kopyalar; hazırlanmış canlı ana dizinler `workspace/` ve `sandboxes/` dizinlerini atlar, ayrıca probe'ların gerçek ana bilgisayar çalışma alanınızdan uzak durması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları temizlenir.

Ortam anahtarlarına güvenmek istiyorsanız (örneğin `~/.profile` içinde export edilmişlerse), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyanızı kapsayıcıya bağlayabilir).

## Deepgram canlı (ses transkripsiyonu)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan canlı

- Test: `src/agents/byteplus.live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow medya canlı

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `models.providers.comfy.<capability>` yapılandırılmadıkça her yeteneği atlar
  - comfy workflow gönderimi, polling, indirmeler veya plugin kaydı değiştirildikten sonra yararlıdır

## Görüntü üretimi canlı

- Test: `src/image-generation/runtime.live.test.ts`
- Komut: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her görüntü üretimi sağlayıcı plugin'ini numaralandırır
  - Probe çalıştırmadan önce eksik sağlayıcı ortam değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak canlı/ortam API anahtarlarını depolanmış kimlik doğrulama profillerinden önce kullanır; böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Stok görüntü üretimi varyantlarını paylaşılan çalışma zamanı yeteneği üzerinden çalıştırır:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Şu anda kapsanan paketlenmiş sağlayıcılar:
  - `openai`
  - `google`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortam geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Müzik üretimi canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax'ı kapsar
  - Probe çalıştırmadan önce sağlayıcı ortam değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak canlı/ortam API anahtarlarını depolanmış kimlik doğrulama profillerinden önce kullanır; böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen her iki çalışma zamanı modunu da çalıştırır:
    - Yalnızca prompt girdili `generate`
    - Sağlayıcı `capabilities.edit.enabled` bildiriyorsa `edit`
  - Geçerli paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortam geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video üretimi canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik lobster prompt'u ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` değerinden gelen sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresini baskın hâle getirebildiği için FAL varsayılan olarak atlanır; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` verin
  - Probe çalıştırmadan önce sağlayıcı ortam değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak canlı/ortam API anahtarlarını depolanmış kimlik doğrulama profillerinden önce kullanır; böylece `auth-profiles.json` içindeki bayat test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir kimlik doğrulama/profil/model olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcutsa bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada arabellek destekli yerel görüntü girdisini kabul ediyorsa `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada arabellek destekli yerel video girdisini kabul ediyorsa `videoToVideo`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak bir görüntü URL'si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak `veo3` text-to-video ve uzak görüntü URL'si fixture'ı kullanan bir `kling` hattı çalıştırır
  - Geçerli `videoToVideo` canlı kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektiriyor
    - `google`, çünkü geçerli paylaşılan Gemini/Veo hattı yerel arabellek destekli girdi kullanıyor ve bu yol paylaşılan taramada kabul edilmiyor
    - `openai`, çünkü geçerli paylaşılan hatta kuruma özgü video inpaint/remix erişim garantileri yok
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramaya FAL dahil her sağlayıcıyı eklemek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için sağlayıcı başına işlem sınırını düşürmek üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı kimlik doğrulama davranışı:
  - Profil deposu kimlik doğrulamasını zorlamak ve yalnızca ortam geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı harness'i

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görüntü, müzik ve video canlı paketlerini tek bir repo-yerel giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı ortam değişkenlerini `~/.profile` içinden otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir kimlik doğrulaması olan sağlayıcılara otomatik olarak daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışıyor" kontrolleri)

Bu Docker çalıştırıcıları iki kovaya ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, repo Docker imajı içinde yalnızca eşleşen profil-anahtarlı canlı dosyayı çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (ve bağlandıysa `~/.profile` dosyasını yükler). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları varsayılan olarak daha küçük bir smoke üst sınırı kullanır; böylece tam bir Docker taraması pratik kalır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12`, ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı açıkça istediğinizde bu ortam değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker imajını bir kez `test:docker:live-build` ile oluşturur, sonra bunu iki canlı Docker hattında yeniden kullanır.
- Kapsayıcı smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` ve `test:docker:plugins`, bir veya daha fazla gerçek kapsayıcıyı başlatır ve üst düzey entegrasyon yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI kimlik doğrulama ana dizinlerini bağlar (veya çalışma daraltılmamışsa desteklenenlerin tümünü), sonra bunları çalıştırmadan önce kapsayıcı ana dizinine kopyalar; böylece harici CLI OAuth, ana bilgisayar kimlik doğrulama deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme ajanı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI canlı smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- İlk kurulum sihirbazı (TTY, tam iskele): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Gateway ağ yapısı (iki kapsayıcı, WS kimlik doğrulama + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- MCP kanal köprüsü (tohumlanmış Gateway + stdio bridge + ham Claude bildirim-çerçevesi smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin'ler (kurulum smoke + `/plugin` takma adı + Claude paketi yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur olarak bağlar ve
onu kapsayıcı içinde geçici bir workdir'e hazırlar. Bu, çalışma zamanı
imajını ince tutarken yine de Vitest'i tam yerel kaynak/yapılandırmanız üzerinde çalıştırır.
Hazırlama adımı, Docker canlı çalıştırmalarının makineye özgü artifact'leri kopyalamak için
dakikalar harcamamasını sağlamak amacıyla `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya özgü `.build` veya
Gradle çıktı dizinleri gibi büyük yalnızca yerel önbellekleri ve uygulama derleme çıktılarını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway canlı probe'ları
kapsayıcı içinde gerçek Telegram/Discord vb. kanal çalışanlarını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu yüzden
o Docker hattından gateway canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde
`OPENCLAW_LIVE_GATEWAY_*` değerlerini de iletin.
`test:docker:openwebui`, daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkinleştirilmiş
bir OpenClaw gateway kapsayıcısı başlatır,
bu gateway'e karşı sabitlenmiş bir Open WebUI kapsayıcısı başlatır, ardından
Open WebUI üzerinden oturum açar, `/api/models` içinde `openclaw/default` gösterildiğini doğrular, sonra
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma gözle görülür biçimde daha yavaş olabilir çünkü Docker'ın
Open WebUI imajını çekmesi gerekebilir ve Open WebUI kendi cold-start kurulumunu tamamlamak zorunda kalabilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve Docker'lı çalıştırmalarda bunu sağlamak için birincil yol
`OPENCLAW_PROFILE_FILE`'dır (varsayılan `~/.profile`).
Başarılı çalıştırmalar genellikle `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve
gerçek bir Telegram, Discord veya iMessage hesabı gerektirmez. Tohumlanmış bir Gateway
kapsayıcısı başlatır, ardından `openclaw mcp serve` çalıştıran ikinci bir kapsayıcı başlatır ve
yönlendirilmiş konuşma keşfi, transkript okumaları, ek meta verileri,
canlı olay kuyruğu davranışı, giden gönderim yönlendirmesi ve Claude tarzı kanal +
izin bildirimlerini gerçek stdio MCP köprüsü üzerinden doğrular. Bildirim kontrolü
ham stdio MCP çerçevelerini doğrudan inceler; böylece smoke testi yalnızca belirli bir istemci SDK'sının ortaya çıkardığını değil,
köprünün gerçekten ne yaydığını doğrular.

El ile ACP düz dilli iş parçacığı smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için saklayın. ACP iş parçacığı yönlendirme doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı ortam değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` dizinine bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` dizinine bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` dizinine bağlanır ve testleri çalıştırmadan önce yüklenir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, `OPENCLAW_PROFILE_FILE` içinden yüklenen yalnızca ortam değişkenlerini doğrulamak için; geçici yapılandırma/çalışma alanı dizinleri ve harici CLI kimlik doğrulama bağları olmadan kullanılır
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içinde önbellekli CLI kurulumları için `/home/node/.npm-global` dizinine bağlanır
- `$HOME` altındaki harici CLI kimlik doğrulama dizinleri/dosyaları salt okunur olarak `/host-auth...` altına bağlanır, sonra testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan yalnızca gerekli dizinleri/dosyaları bağlar
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü liste ile elle geçersiz kılın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Kapsayıcı içindeki sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalar için mevcut `openclaw:local-live` imajını yeniden kullanmak amacıyla `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` (ortamdan değil)
- Open WebUI smoke testi için gateway tarafından sunulan modeli seçmek amacıyla `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testi tarafından kullanılan nonce-kontrol prompt'unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Belge sağlık kontrolü

Belge düzenlemelerinden sonra belge kontrollerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık kontrollerine de ihtiyacınız olduğunda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI için güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek hat” regresyonlarıdır:

- Gateway araç çağırma (mock OpenAI, gerçek gateway + ajan döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, yapılandırma yazımı + kimlik doğrulama zorunlu): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Ajan güvenilirlik değerlendirmeleri (Skills)

Zaten “ajan güvenilirlik değerlendirmeleri” gibi davranan birkaç CI için güvenli testimiz var:

- Gerçek gateway + ajan döngüsü üzerinden mock araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve yapılandırma etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills prompt'ta listelendiğinde ajan doğru Skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** ajan kullanımdan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları takip ediyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi aktarımını ve sandbox sınırlarını doğrulayan çok dönüşlü senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, Skill dosyası okumalarını ve oturum kablolamasını doğrulamak için mock sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, geçitleme, prompt injection).
- İsteğe bağlı canlı değerlendirmeler (katılımlı, ortamla kapılı) yalnızca CI için güvenli paket yerleştirildikten sonra.

## Sözleşme testleri (plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her plugin ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm plugin'ler üzerinde yinelenir ve
şekil ile davranış doğrulamalarından oluşan bir paket çalıştırırlar. Varsayılan `pnpm test` birim hattı,
bu paylaşılan dikiş ve smoke dosyalarını kasıtlı olarak atlar; paylaşılan kanal veya sağlayıcı yüzeylerine
dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` konumunda bulunur:

- **plugin** - Temel plugin şekli (`id`, `name`, yetenekler)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj yükü yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - İş parçacığı kimliği işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup ilkesi uygulaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` konumunda bulunur.

- **status** - Kanal durum probe'ları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` konumunda bulunur:

- **auth** - Kimlik doğrulama akışı sözleşmesi
- **auth-choice** - Kimlik doğrulama seçimi/seçme
- **catalog** - Model katalog API'si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- plugin-sdk export'larını veya alt yolları değiştirdikten sonra
- Bir kanal veya sağlayıcı plugin'i ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (kılavuz)

Canlıda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI için güvenli bir regresyon ekleyin (mock/stub sağlayıcı veya tam istek şekli dönüşümünü yakalama)
- Sorun doğası gereği yalnızca canlıya özgüyse (hız sınırları, kimlik doğrulama ilkeleri), canlı testi dar ve ortam değişkenleriyle katılımlı tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden oynatma hatası → doğrudan modeller testi
  - gateway oturum/geçmiş/araç hattı hatası → gateway canlı smoke veya CI için güvenli gateway mock testi
- SecretRef dolaşım korkuluğu:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından dolaşım segmentli exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testte `classifyTargetClass` işlevini güncelleyin. Test, sınıflandırılmamış hedef kimliklerinde kasıtlı olarak başarısız olur; böylece yeni sınıflar sessizce atlanamaz.
