---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - Gateway + agent davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/live paketleri, Docker çalıştırıcıları ve her testin kapsadıkları'
title: Test etme
x-i18n:
    generated_at: "2026-04-23T13:58:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# Test Etme

OpenClaw üç Vitest paketine (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcıları kümesine sahiptir.

Bu doküman, “nasıl test ediyoruz” rehberidir:

- Her paketin neyi kapsadığı (ve özellikle neyi kapsamadığı)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Live testlerin kimlik bilgilerini nasıl bulduğu ve model/sağlayıcıları nasıl seçtiği
- Gerçek dünya model/sağlayıcı sorunları için regresyonların nasıl ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesi beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yapıyorsanız önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcılar/modeller üzerinde hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Live paketi (modeller + Gateway araç/görüntü yoklamaları): `pnpm test:live`
- Tek bir live dosyasını sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model taraması: `pnpm test:docker:live-models`
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, her ikisi de yeniden kullanılabilir live/E2E iş akışını
    `include_live_suites: true` ile çağırır; buna sağlayıcıya göre parçalara ayrılmış
    ayrı Docker live model matris işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)`
    iş akışını `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh`
    dosyasına ve ayrıca `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
    ile onun zamanlanmış/sürüm çağıranlarına ekleyin.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıysa,
  `openclaw models list --provider moonshot --json` komutunu çalıştırın, ardından
  `moonshot/kimi-k2.6` üzerinde yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON çıktısının Moonshot/K2.6 bildirdiğini ve assistant dökümünün normalize edilmiş `usage.cost` sakladığını doğrulayın.

İpucu: Yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, aşağıda açıklanan allowlist ortam değişkenleriyle live testleri daraltmayı tercih edin.

## QA'ya özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

CI, QA Lab'ı özel iş akışlarında çalıştırır. `Parity gate`, eşleşen PR'lerde ve
manuel tetikleme ile sahte sağlayıcılarla çalışır. `QA-Lab - All Lanes`, `main`
üzerinde gecelik olarak ve manuel tetikleme ile sahte parity gate, live Matrix hattı
ve Convex tarafından yönetilen live Telegram hattını paralel işler olarak çalıştırır.
`OpenClaw Release Checks`, sürüm onayından önce aynı hatları çalıştırır.

- `pnpm openclaw qa suite`
  - Repo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Birden çok seçili senaryoyu varsayılan olarak yalıtılmış Gateway çalışanlarıyla paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılık 4 kullanır (seçilen senaryo sayısıyla sınırlıdır). Çalışan sayısını ayarlamak için `--concurrency <count>`, eski seri hat için ise `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan çıkış kodu verir. Başarısız çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, deneysel fixture ve protokol-mock kapsamı için yerel AIMock destekli
    bir sağlayıcı sunucusu başlatır; ancak senaryo farkındalıklı `mock-openai`
    hattının yerini almaz.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Live çalıştırmalar, konuk için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    ortam tabanlı sağlayıcı anahtarları, QA live sağlayıcı yapılandırma yolu ve
    varsa `CODEX_HOME`.
  - Çıktı dizinleri depo kökü altında kalmalıdır; böylece konuk, bağlanmış çalışma alanı üzerinden geri yazabilir.
  - Normal QA raporu + özeti ile birlikte Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, bunu Docker içinde global olarak kurar, etkileşimsiz OpenAI API anahtarı onboarding çalıştırır, varsayılan olarak Telegram yapılandırır, plugin etkinleştirmenin çalışma zamanı bağımlılıklarını gerektiğinde kurduğunu doğrular, doctor çalıştırır ve sahte bir OpenAI endpoint'ine karşı bir yerel agent dönüşü çalıştırır.
  - Aynı paketlenmiş kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw yapısını Docker içinde paketler ve kurar, OpenAI yapılandırılmış şekilde Gateway'i başlatır, ardından config düzenlemeleriyle paketlenmiş channel/plugin'leri etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış plugin çalışma zamanı bağımlılıklarını eksik bıraktığını, ilk yapılandırılmış Gateway veya doctor çalıştırmasının her paketlenmiş plugin'in çalışma zamanı bağımlılıklarını gerektiğinde kurduğunu ve ikinci yeniden başlatmanın zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen daha eski bir npm taban sürümünü kurar, Telegram'ı etkinleştirir, sonra
    `openclaw update --tag <candidate>` çalıştırır ve aday sürümün
    güncelleme sonrası doctor çalıştırmasının paketlenmiş channel çalışma zamanı
    bağımlılıklarını harness tarafı bir postinstall onarımı olmadan düzelttiğini doğrular.
- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix live QA hattını, tek kullanımlık Docker destekli bir Tuwunel homeserver'a karşı çalıştırır.
  - Bu QA ana makinesi bugün yalnızca repo/geliştirme içindir. Paketlenmiş OpenClaw kurulumları `qa-lab` göndermez, dolayısıyla `openclaw qa` sunmaz.
  - Repo checkout'ları paketlenmiş çalıştırıcıyı doğrudan yükler; ayrı bir plugin kurulum adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ile bir özel oda oluşturur, ardından gerçek Matrix plugin'ini SUT taşıması olarak kullanan bir QA gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel imajı `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir imajı test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, hat tek kullanımlık kullanıcıları yerelde oluşturduğu için paylaşılan kimlik bilgisi kaynağı bayraklarını açığa çıkarmaz.
  - Bir Matrix QA raporu, özeti, gözlemlenen olaylar artifact'i ve birleşik stdout/stderr çıktı günlüğünü `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram live QA hattını, ortamdan alınan driver ve SUT bot token'larıyla gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuz kimlik bilgileri için `--credential-source convex` desteklenir. Varsayılan olarak env modunu kullanın veya havuzlanmış kiralamalara geçmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan çıkış kodu verir. Başarısız çıkış kodu olmadan artifact istediğinizde `--allow-failures` kullanın.
  - Aynı özel grupta iki farklı bot gerektirir; SUT botu bir Telegram kullanıcı adı sunmalıdır.
  - Kararlı bottan-bota gözlem için, `@BotFather` içinde her iki bot için de Bot-to-Bot Communication Mode'u etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özeti ve gözlemlenen mesajlar artifact'i yazar. Yanıt senaryoları, driver gönderme isteğinden gözlemlenen SUT yanıtına kadar RTT'yi içerir.

Live taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşımalar sapmaz:

`qa-channel`, geniş sentetik QA paketi olarak kalır ve live taşıma kapsamı matrisinin parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Üst düzey yanıt | Yeniden başlatma sonrası devam | Thread takip yanıtı | Thread yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | ------------------------------ | ------------------- | --------------- | ------------- | ------------- |
| Matrix   | x      | x              | x               | x               | x                              | x                   | x               | x             |               |
| Telegram | x      |                |                 |                 |                                |                     |                 |               | x             |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde,
QA lab Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken bu kiralamaya Heartbeat gönderir
ve kapatma sırasında kiralamayı serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir gizli anahtar:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` `maintainer` için
  - `OPENCLAW_QA_CONVEX_SECRET_CI` `ci` için
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Varsayılan env: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, diğer durumlarda `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal çalışmada `https://` kullanmalıdır.

Bakımcı yönetici komutları (havuz ekle/kaldır/listele) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Bakımcılar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Betiklerde ve CI yardımcı araçlarında makine tarafından okunabilir çıktı için `--json` kullanın.

Varsayılan endpoint sözleşmesi (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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

Telegram türü için yük biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği dizgesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve hatalı yükleri reddeder.

### QA'ya bir channel ekleme

Markdown QA sistemine bir channel eklemek tam olarak iki şey gerektirir:

1. Channel için bir taşıma bağdaştırıcısı.
2. Channel sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` ana makinesi akışın sahibi olabiliyorken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan ana makine mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- çalışan eşzamanlılığı
- artifact yazımı
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı plugin'leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway'in o taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- dökümlerin ve normalize edilmiş taşıma durumunun nasıl açığa çıkarıldığı
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizliğin nasıl işlendiği

Yeni bir channel için en düşük benimseme çıtası şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`'ı koruyun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine sınırında uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı plugin'i veya channel harness'i içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın.
   Çalıştırıcı plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` dosyasını hafif tutun; tembel CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo kasıtlı bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış bir channel taşımasına bağlıysa, onu o çalıştırıcı plugin'inde veya plugin harness'inde tutun.
- Bir senaryo birden fazla channel'ın kullanabileceği yeni bir yetenek gerektiriyorsa, `suite.ts` içinde channel'a özgü bir dal yerine genel bir yardımcı ekleyin.
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

Aşağıdakiler dahil, mevcut senaryolar için uyumluluk takma adları kullanılabilir olmaya devam eder:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni channel çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları bir bayrak günü geçişinden kaçınmak için vardır; yeni senaryo yazımı için model olarak değil.

## Test paketleri (ne nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan kararsızlık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedeflenmemiş çalıştırmalar `vitest.full-*.config.ts` parça kümesini kullanır ve paralel zamanlama için çok projeli parçaları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki core/unit envanterleri ve `vitest.unit.config.ts` kapsamındaki izinli `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi entegrasyon testleri (Gateway kimlik doğrulama, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI'da çalışır
  - Gerçek anahtarlar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projeler notu:
  - Hedeflenmemiş `pnpm test` artık tek devasa yerel root-project süreci yerine on iki küçük parça yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS'yi azaltır ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch` hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır; çünkü çok parçalı bir izleme döngüsü pratik değildir.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports` açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma maliyetini ödemez.
  - `pnpm test:changed`, diff yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa değişen git yollarını aynı kapsamlı hatlara genişletir; config/setup düzenlemeleri ise yine geniş kök proje yeniden çalıştırmasına geri döner.
  - `pnpm check:changed`, dar çalışmalar için normal akıllı yerel geçittir. Diff'i core, core testleri, extensions, extension testleri, apps, docs, sürüm meta verisi ve araçlama olarak sınıflandırır, ardından eşleşen typecheck/lint/test hatlarını çalıştırır. Genel Plugin SDK ve plugin-contract değişiklikleri, extensions bu core sözleşmelere bağlı olduğu için extension doğrulamasını da içerir. Yalnızca sürüm meta verisi içeren version bump'ları tam paket yerine hedefli sürüm/config/root-dependency denetimleri çalıştırır ve üst düzey sürüm alanı dışındaki package değişikliklerini reddeden bir koruma içerir.
  - Agent'lar, komutlar, plugins, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardaki import hafif unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattına yönlendirilir; durum bilgili/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
  - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tüm ağır paketi yeniden çalıştırmaz.
  - `auto-reply` artık üç özel kovaya sahiptir: üst düzey core yardımcıları, üst düzey `reply.*` entegrasyon testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır reply harness işlerini ucuz status/chunk/token testlerinden uzak tutar.
- Gömülü çalıştırıcı notu:
  - Mesaj aracı keşif girdilerini veya Compaction çalışma zamanı bağlamını değiştirdiğinizde, her iki kapsam düzeyini de koruyun.
  - Saf yönlendirme/normalleştirme sınırları için odaklı yardımcı regresyonları ekleyin.
  - Ayrıca gömülü çalıştırıcı entegrasyon paketlerini sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının hâlâ gerçek
    `run.ts` / `compact.ts` yolları üzerinden aktığını doğrular; yalnızca yardımcı
    testleri bu entegrasyon yolları için yeterli bir yerine geçme değildir.
- Havuz notu:
  - Temel Vitest yapılandırması artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest yapılandırması ayrıca `isolate: false` değerini sabitler ve kök projeler, e2e ve live yapılandırmalarında yalıtımsız çalıştırıcıyı kullanır.
  - Kök UI hattı `jsdom` kurulumunu ve optimize edicisini korur, ancak artık o da paylaşılan yalıtımsız çalıştırıcı üzerinde çalışır.
  - Her `pnpm test` parçası, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalar sırasında V8 derleme dalgalanmasını azaltmak için varsayılan olarak Vitest alt Node süreçlerine `--no-maglev` de ekler. Varsayılan V8 davranışıyla karşılaştırma yapmanız gerekirse `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel yineleme notu:
  - `pnpm changed:lanes`, bir diff'in hangi mimari hatları tetiklediğini gösterir.
  - Pre-commit hook, aşamalı format/lint işleminden sonra `pnpm check:changed --staged` çalıştırır; böylece yalnızca core commit'leri, herkese açık extension taraflı sözleşmelere dokunmadıkça extension test maliyetini ödemez. Yalnızca sürüm meta verisi commit'leri hedefli sürüm/config/root-dependency hattında kalır.
  - Aynı aşamalı değişiklik kümesi eşit veya daha güçlü geçitlerle zaten doğrulandıysa, yalnızca changed-scope hook yeniden çalıştırmasını atlamak için `scripts/committer --fast "<message>" <files...>` kullanın. Aşamalı format/lint yine de çalışır. El tesliminizde tamamlanan geçitlerden bahsedin. Bu, ayrıca yalıtılmış kararsız bir hook hatası yeniden çalıştırılıp kapsamlı kanıtla geçtiyse de kabul edilebilir.
  - `pnpm test:changed`, değişen yollar daha küçük bir pakete temiz biçimde eşleniyorsa kapsamlı hatlar üzerinden yönlendirir.
  - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur, yalnızca daha yüksek bir çalışan sınırıyla.
  - Yerel çalışan otomatik ölçeklendirmesi artık kasıtlı olarak daha muhafazakârdır ve ana makine yük ortalaması zaten yüksek olduğunda da geri çekilir; böylece birden çok eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest yapılandırması, test kablolaması değiştiğinde changed-mode yeniden çalıştırmalar doğru kalsın diye projeleri/yapılandırma dosyalarını `forceRerunTriggers` olarak işaretler.
  - Yapılandırma, desteklenen ana makinelerde `OPENCLAW_VITEST_FS_MODULE_CACHE` seçeneğini etkin tutar; doğrudan profil oluşturma için açık bir önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Performans-hata ayıklama notu:
  - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve import dökümü çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profil görünümünü `origin/main` sonrasında değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş `test:changed` çalıştırmasını o commit edilmiş diff için yerel kök proje yoluyla karşılaştırır ve duvar süresi ile macOS azami RSS'yi yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek geçerli kirli çalışma ağacını kıyaslar.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve dönüşüm yükü için ana iş parçacığı CPU profili yazar.
  - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışıyken unit paketi için çalıştırıcı CPU+heap profilleri yazar.

### Kararlılık (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek çalışana zorlanmış
- Kapsam:
  - Tanılama varsayılan olarak etkinleştirilmiş gerçek bir loopback Gateway başlatır
  - Tanılama olay yolu üzerinden sentetik Gateway mesajı, bellek ve büyük yük dalgalanması üretir
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin baskı bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsızdır
  - Kararlılık regresyonu takibi için dar bir hattır; tam Gateway paketinin yerine geçmez

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketlenmiş plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` ve `isolate: false` kullanır.
  - Uyarlanabilir çalışanlar kullanır (CI: en fazla 2, yerel: varsayılan 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Çalışan sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleme ve daha ağır ağ iletişimi
- Beklentiler:
  - CI'da çalışır (pipeline'da etkinleştirildiğinde)
  - Gerçek anahtarlar gerekmez
  - Unit testlerinden daha fazla hareketli parça vardır (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Docker aracılığıyla ana makinede yalıtılmış bir OpenShell Gateway başlatır
  - Geçici bir yerel Dockerfile'dan bir sandbox oluşturur
  - OpenClaw'un OpenShell backend'ini gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Sandbox fs köprüsü üzerinden uzaktan-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikilisi veya sarmalayıcı betiğe işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketlenmiş plugin live testleri
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçek kimlik bilgileriyle gerçekten çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, kimlik doğrulama sorunlarını ve hız sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeleri çalıştırmak tercih edilir
- Live çalıştırmaları eksik API anahtarlarını almak için `~/.profile` dosyasını kaynak olarak yükler.
- Varsayılan olarak live çalıştırmaları yine de `HOME` dizinini yalıtır ve config/auth materyallerini geçici bir test ana dizinine kopyalar; böylece unit fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Live testlerin gerçek ana dizininizi kullanması bilerek isteniyorsa yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık daha sessiz bir modu varsayılan yapar: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve Gateway bootstrap günlükleri/Bonjour konuşmalarını susturur. Tam başlatma günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı döndürme (sağlayıcıya özgü): virgül/noktalı virgül biçiminde `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (`OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS` gibi) ya da live başına geçersiz kılma için `OPENCLAW_LIVE_*_KEY` kullanın; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Live paketleri artık ilerleme satırlarını stderr'e yazar; böylece Vitest konsol yakalaması sessiz olduğunda bile uzun sağlayıcı çağrılarının etkin olduğu görünür.
  - `vitest.live.config.ts`, sağlayıcı/Gateway ilerleme satırlarının live çalıştırmalar sırasında anında akmasını sağlamak için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/testler düzenleniyorsa: `pnpm test` çalıştırın (ve çok şey değiştirdiyseniz `pnpm test:coverage`)
- Gateway ağ iletişimi / WS protokolü / eşlemeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum çalışmıyor” / sağlayıcıya özgü hatalar / araç çağırma üzerinde hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Live: Android Node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android Node tarafından **şu anda ilan edilen her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/elle kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşlemez).
  - Seçilen Android Node için komut bazında Gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten Gateway'e bağlı ve eşlenmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Geçmesini beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Live: model smoke (profil anahtarları)

Live testler, hataları yalıtabilmek için iki katmana ayrılmıştır:

- “Doğrudan model”, sağlayıcı/modelin verilen anahtarla en azından yanıt verebildiğini söyler.
- “Gateway smoke”, tam gateway+agent hattının o model için çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (Gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri listelemek
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi halde `pnpm test:live` odağını gateway smoke üzerinde tutmak için atlar
- Model seçimi nasıl yapılır:
  - Modern allowlist'i çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern allowlist için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgüllü allowlist)
  - Modern/all taramaları varsayılan olarak seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçimi nasıl yapılır:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgüllü allowlist)
- Anahtarlar nereden gelir:
  - Varsayılan olarak: profil deposu ve env yedekleri
  - Yalnızca **profil deposu** zorlaması için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “Sağlayıcı API'si bozuk / anahtar geçersiz” ile “Gateway agent hattı bozuk” durumlarını ayırır
  - Küçük, yalıtılmış regresyonlar içerir (örnek: OpenAI Responses/Codex Responses muhakeme tekrar yürütme + araç çağrısı akışları)

### Katman 2: Gateway + dev agent smoke (`"@openclaw"` gerçekte ne yapıyor)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir Gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılma)
  - Anahtarlı modeller üzerinde yineleme yapmak ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısı çalışıyor (read probe)
    - isteğe bağlı ek araç probeları (exec+read probe)
    - OpenAI regresyon yolları (yalnızca araç çağrısı → takip) çalışmaya devam ediyor
- Probe ayrıntıları (başarısızlıkları hızlı açıklayabilmeniz için):
  - `read` probe: test çalışma alanına nonce dosyası yazar ve agent'tan bunu `read` ile okuyup nonce'u geri yankılamasını ister.
  - `exec+read` probe: test agent'tan temp dosyaya nonce yazmasını `exec` ile ister, ardından bunu `read` ile geri okur.
  - image probe: test oluşturulmuş bir PNG (kedi + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Model seçimi nasıl yapılır:
  - Varsayılan: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern allowlist için bir takma addır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all Gateway taramaları varsayılan olarak seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcı seçimi nasıl yapılır (“OpenRouter her şey” yaklaşımından kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgüllü allowlist)
- Araç + image probeları bu live testte her zaman açıktır:
  - `read` probe + `exec+read` probe (araç stresi)
  - image probe, model image girdi desteği ilan ettiğinde çalışır
  - Akış (üst düzey):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway, ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent, modele çok modlu bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: Makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini veya diğer yerel CLI'ler)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan config'inize dokunmadan, Gateway + agent hattını yerel bir CLI backend kullanarak doğrulamak.
- Backend'e özgü smoke varsayılanları, sahibi olan extension'ın `cli-backend.ts` tanımı içinde bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
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
  - `IMAGE_ARG` ayarlı olduğunda image argümanlarının nasıl geçirileceğini kontrol etmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir dönüş göndermek ve devam akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı-oturum sürekliliği probe'unu devre dışı bırakmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçilen model geçiş hedefini desteklediğinde zorla açmak için `1` ayarlayın).

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

- Docker çalıştırıcısı `scripts/test-live-cli-backend-docker.sh` konumundadır.
- Live CLI-backend smoke testini depo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI smoke meta verisini sahibi olan extension'dan çözümler, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` altında önbellekli yazılabilir bir öneke kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, taşınabilir Claude Code abonelik OAuth'u gerektirir; bunun için ya `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` ya da `claude setup-token` üzerinden `CLAUDE_CODE_OAUTH_TOKEN` gerekir. Önce Docker içinde doğrudan `claude -p` çalıştığını kanıtlar, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI-backend dönüşü çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı sınırları yerine ek kullanım faturalaması üzerinden yönlendirdiği için varsayılan olarak Claude MCP/tool ve image probelarını devre dışı bırakır.
- Live CLI-backend smoke artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin dönüşü, image sınıflandırma dönüşü, ardından Gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a yamalar ve devam eden oturumun hâlâ önceki bir notu hatırladığını doğrular.

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: live bir ACP agent ile gerçek ACP konuşma-bind akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir message-channel konuşmasını yerinde bağla
  - aynı konuşmada normal bir takip mesajı gönder
  - takip mesajının bağlı ACP oturum dökümüne düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP agent'ları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP agent'ı: `claude`
  - Sentetik channel: Slack DM tarzı konuşma bağlamı
  - ACP backend: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Notlar:
  - Bu hat, testlerin message-channel bağlamını haricen teslim ediyormuş gibi yapmadan ekleyebilmesi için yöneticiye özel sentetik originating-route alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlı değilse, test seçilen ACP harness agent için gömülü `acpx` plugin'inin yerleşik agent kaydını kullanır.

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

Tek-agent Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` konumundadır.
- Varsayılan olarak ACP bind smoke testini tüm desteklenen live CLI agent'larına karşı sırayla çalıştırır: `claude`, `codex`, sonra `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` dosyasını kaynak olarak yükler, eşleşen CLI auth materyalini container içine hazırlar, `acpx`'i yazılabilir bir npm öneğine kurar, ardından istenen live CLI'yi (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) eksikse kurar.
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar; böylece acpx, kaynak olarak yüklenen profildeki sağlayıcı env değişkenlerini alt harness CLI için kullanılabilir tutar.

## Live: Codex app-server harness smoke

- Amaç: plugin sahibi Codex harness'ini normal Gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - `codex/gpt-5.4` için ilk Gateway agent dönüşünü gönder
  - aynı OpenClaw oturumuna ikinci bir dönüş gönder ve app-server
    thread'inin devam edebildiğini doğrula
  - aynı Gateway komut yolu üzerinden `/codex status` ve `/codex models`
    komutlarını çalıştır
  - isteğe bağlı olarak Guardian tarafından incelenen iki yükseltilmiş shell probe'u çalıştır: onaylanması gereken zararsız bir
    komut ve agent'ın geri sorması için reddedilmesi gereken sahte bir gizli veri yükleme işlemi
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness'i sessizce PI'ye düşerek başarılı görünemez.
- Auth: shell/profile üzerinden `OPENAI_API_KEY` ve isteğe bağlı olarak kopyalanmış
  `~/.codex/auth.json` ile `~/.codex/config.toml`

Yerel tarif:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker tarifi:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` konumundadır.
- Bağlı `~/.profile` dosyasını kaynak olarak yükler, `OPENAI_API_KEY` geçirir, varsa Codex CLI
  auth dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlı bir npm
  önekine kurar, kaynak ağacı hazırlar ve ardından yalnızca Codex-harness live testini çalıştırır.
- Docker varsayılan olarak image, MCP/tool ve Guardian probelarını etkinleştirir. Daha dar bir hata ayıklama
  çalıştırması gerektiğinde `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ya da
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu da live
  test yapılandırmasıyla eşleşir, böylece `openai-codex/*` veya PI fallback bir Codex harness
  regresyonunu gizleyemez.

### Önerilen live tarifleri

Dar, açık allowlist'ler en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (Gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcı arasında araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...` Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...` Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı agent endpoint'i).
- `google-gemini-cli/...` makinenizdeki yerel Gemini CLI'yi kullanır (ayrı auth + araçlama tuhaflıkları).
- Gemini API ve Gemini CLI:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil auth); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw, yerel bir `gemini` ikilisine shell çıkışı yapar; kendi auth yapısına sahiptir ve farklı davranabilir (streaming/tool desteği/sürüm kayması).

## Live: model matrisi (neyi kapsıyoruz)

Sabit bir “CI model listesi” yoktur (live isteğe bağlıdır), ancak anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modeller bunlardır.

### Modern smoke kümesi (araç çağırma + image)

Bu, çalışır durumda tutmayı beklediğimiz “yaygın modeller” çalıştırmasıdır:

- OpenAI (Codex dışı): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + image ile Gateway smoke çalıştırması:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel çizgi: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az birini seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olsa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en yeni sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Vision: image gönderme (ek → çok modlu mesaj)

Image probe'unu çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir image yetenekli model ekleyin (Claude/Gemini/OpenAI vision yetenekli varyantları vb.).

### Toplayıcılar / alternatif Gateway'ler

Anahtarlarınız etkinse, şunlar üzerinden test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; tool+image yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (auth: `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Live matrisine ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/config'iniz varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel endpoint'ler): `minimax` (bulut/API) ve ayrıca OpenAI/Anthropic uyumlu herhangi bir proxy (LM Studio, vLLM, LiteLLM vb.)

İpucu: Dokümanlarda “tüm modelleri” sabit kodlamaya çalışmayın. Otoriter liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Live testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa, live testler de aynı anahtarları bulmalıdır.
- Bir live test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimi hata ayıklamasıyla aynı şekilde ayıklayın.

- Agent başına auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (live testlerde “profil anahtarları” denince kastedilen budur)
- Config: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanan live ana dizinine kopyalanır, ancak ana profil-anahtarı deposu değildir)
- Live yerel çalıştırmalar varsayılan olarak etkin config'i, agent başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI auth dizinlerini geçici bir test ana dizinine kopyalar; hazırlanan live ana dizinleri `workspace/` ve `sandboxes/` dizinlerini atlar ve `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır; böylece probelar gerçek ana makine çalışma alanınızdan uzak durur.

Env anahtarlarına güvenmek istiyorsanız (`~/.profile` içinde dışa aktarılmış olanlar gibi), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram live (ses transkripsiyonu)

- Test: `extensions/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `extensions/byteplus/live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- İsteğe bağlı model geçersiz kılma: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy image, video ve `music_generate` yollarını çalıştırır
  - `models.providers.comfy.<capability>` yapılandırılmamışsa her yeteneği atlar
  - Comfy workflow gönderimi, polling, indirmeler veya plugin kaydını değiştirdikten sonra kullanışlıdır

## Image generation live

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her image-generation sağlayıcı plugin'ini listeler
  - Probe çalıştırmadan önce eksik sağlayıcı env değişkenlerini giriş shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Standart image-generation varyantlarını paylaşılan runtime yeteneği üzerinden çalıştırır:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Kapsanan mevcut paketlenmiş sağlayıcılar:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Music generation live

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş music-generation sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax'ı kapsar
  - Probe çalıştırmadan önce sağlayıcı env değişkenlerini giriş shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen iki runtime modunu da çalıştırır:
    - Yalnızca prompt girdisiyle `generate`
    - Sağlayıcı `capabilities.edit.enabled` bildiriyorsa `edit`
  - Mevcut paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy live dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video generation live

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video-generation sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik ıstakoz prompt'u ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın gelebileceği için FAL varsayılan olarak atlanır; açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` verin
  - Probe çalıştırmadan önce sağlayıcı env değişkenlerini giriş shell'inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Kullanılabilir olduğunda bildirilen dönüştürme modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel image girdisini kabul ediyorsa `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel video girdisini kabul ediyorsa `videoToVideo`
  - Paylaşılan taramadaki mevcut bildirilen ama atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metin destekler ve paketlenmiş `kling` uzak image URL'si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak `veo3` text-to-video ile uzak image URL fixture kullanan bir `kling` hattı çalıştırır
  - Mevcut `videoToVideo` live kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramadaki mevcut bildirilen ama atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektiriyor
    - `google`, çünkü mevcut paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullanıyor ve bu yol paylaşılan taramada kabul edilmiyor
    - `openai`, çünkü mevcut paylaşılan hat org'a özgü video inpaint/remix erişim garantilerine sahip değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramadaki her sağlayıcıyı, FAL dahil, dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için sağlayıcı başına işlem sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Media live harness

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan image, music ve video live paketlerini tek bir depoya özgü giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` dosyasından otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir auth'a sahip sağlayıcılara otomatik olarak daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı “Linux'ta çalışıyor” denetimleri)

Bu Docker çalıştırıcıları iki kovaya ayrılır:

- Live-model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, yalnızca eşleşen profil-anahtarı live dosyalarını depo Docker imajı içinde çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel config dizininizi ve çalışma alanınızı bağlar (ve bağlıysa `~/.profile` dosyasını kaynak olarak yükler). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` öğeleridir.
- Docker live çalıştırıcıları varsayılan olarak daha küçük bir smoke sınırı kullanır; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models`, varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway`, varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı
  özellikle istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, live Docker imajını bir kez `test:docker:live-build` ile oluşturur, sonra bunu iki live Docker hattı için yeniden kullanır. Ayrıca built app'i çalıştıran E2E container smoke çalıştırıcıları için bir paylaşılan `scripts/e2e/Dockerfile` imajını `test:docker:e2e-build` ile bir kez oluşturur ve yeniden kullanır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload`, bir veya daha fazla gerçek container başlatır ve daha üst düzey entegrasyon yollarını doğrular.

Live-model Docker çalıştırıcıları ayrıca yalnızca gereken CLI auth ana dizinlerini bağlayarak mount eder (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü), ardından çalıştırma öncesinde bunları container ana dizinine kopyalar; böylece harici CLI OAuth, ana makine auth deposunu değiştirmeden token'ları yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskelet kurulum): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'ını Docker içinde global olarak kurar, varsayılan olarak env-ref onboarding artı Telegram ile OpenAI'ı yapılandırır, plugin etkinleştirmenin çalışma zamanı bağımlılıklarını gerektiğinde kurduğunu doğrular, doctor çalıştırır ve sahte bir OpenAI agent dönüşü çalıştırır. Önceden oluşturulmuş bir tarball'ı `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden yapısını `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya channel'ı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Gateway ağ iletişimi (iki container, WS auth + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses `web_search` minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) sahte bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search` öğesinin `reasoning.effort` değerini `minimal`'dan `low`'a yükselttiğini doğrular, ardından sağlayıcı şema reddini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP channel bridge (tohumlanmış Gateway + stdio bridge + ham Claude bildirim-frame smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profil allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (yalıtılmış Cron ve tek seferlik subagent çalıştırmalarından sonra gerçek Gateway + stdio MCP alt süreç kapatma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin'ler (kurulum smoke + `/plugin` takma adı + Claude-bundle yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload meta veri smoke: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Paketlenmiş plugin çalışma zamanı bağımlılıkları: `pnpm test:docker:bundled-channel-deps`, varsayılan olarak küçük bir Docker çalıştırıcı imajı oluşturur, OpenClaw'u ana makinede bir kez oluşturup paketler, ardından bu tarball'ı her Linux kurulum senaryosuna mount eder. İmajı `OPENCLAW_SKIP_DOCKER_BUILD=1` ile yeniden kullanın, yeni bir yerel yapıdan sonra ana makine yeniden yapısını `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ile atlayın veya mevcut bir tarball'a `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile işaret edin.
- Yineleme sırasında ilgisiz senaryoları devre dışı bırakarak paketlenmiş plugin çalışma zamanı bağımlılıklarını daraltın, örneğin:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Paylaşılan built-app imajını elle önceden oluşturup yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi pakete özgü image geçersiz kılmaları ayarlandığında hâlâ önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1` uzak bir paylaşılan image'a işaret ettiğinde, betikler image yerelde yoksa onu çeker. QR ve installer Docker testleri kendi Dockerfile'larını korur; çünkü bunlar paylaşılan built-app runtime'ı yerine package/install davranışını doğrular.

Live-model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur olarak bind-mount eder ve
container içinde geçici bir workdir'a hazırlar. Bu, runtime
image'ını ince tutarken yine de Vitest'i tam olarak yerel kaynak/config'inize karşı çalıştırır.
Hazırlama adımı, Docker live çalıştırmalarının
makineye özgü artifact'leri kopyalamak için dakikalar harcamaması adına `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve app'e özgü `.build` veya
Gradle çıktı dizinleri gibi büyük yalnızca-yerel önbellekleri ve uygulama build çıktılarını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway live probeları
container içinde gerçek Telegram/Discord vb. channel çalışanlarını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle
o Docker hattından gateway
live kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de geçirin.
`test:docker:openwebui`, daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP endpoint'leri etkin bir
OpenClaw gateway container'ı başlatır,
bu gateway'e karşı sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI
üzerinden oturum açar, `/api/models` endpoint'inin `openclaw/default` sunduğunu doğrular, sonra
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir
sohbet isteği gönderir.
İlk çalıştırma belirgin biçimde daha yavaş olabilir; çünkü Docker'ın
Open WebUI image'ını çekmesi gerekebilir ve Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir live model anahtarı bekler ve Dockerize çalıştırmalarda bunu sağlamak için birincil yol
`OPENCLAW_PROFILE_FILE`'dır
(varsayılan `~/.profile`).
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazar.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabı gerektirmez. Tohumlanmış bir Gateway
container'ı başlatır, `openclaw mcp serve` çalıştıran ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transcript okumalarını, attachment meta verisini,
live olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı channel +
izin bildirimlerini gerçek stdio MCP bridge üzerinden doğrular. Bildirim denetimi
ham stdio MCP frame'lerini doğrudan inceler; böylece smoke testi yalnızca belirli bir istemci SDK'sının
yüzeye çıkardıklarını değil, bridge'in gerçekten ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve live
model anahtarı gerektirmez. Depo Docker image'ını oluşturur, container içinde gerçek bir stdio MCP probe sunucusu başlatır,
bu sunucuyu gömülü Pi bundle
MCP runtime üzerinden somutlaştırır, aracı çalıştırır, sonra `coding` ve `messaging` öğelerinin
`bundle-mcp` araçlarını koruduğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` ayarlarının ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve live model
anahtarı gerektirmez. Gerçek bir stdio MCP probe sunucusuyla tohumlanmış bir Gateway başlatır,
yalıtılmış bir Cron dönüşü ve `/subagents spawn` tek seferlik bir alt süreç dönüşü çalıştırır, ardından
her çalıştırmadan sonra MCP alt sürecinin çıktığını doğrular.

Elle ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için koruyun. ACP thread yönlendirme doğrulaması için tekrar gerekebilir, bu yüzden silmeyin.

Yararlı env değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` içine mount edilir
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` içine mount edilir
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` içine mount edilir ve testler çalıştırılmadan önce kaynak olarak yüklenir
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, `OPENCLAW_PROFILE_FILE` içinden kaynak olarak yüklenen yalnızca env değişkenlerini doğrulamak için kullanılır; geçici config/workspace dizinleri ve harici CLI auth mount'ları olmadan
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içindeki önbellekli CLI kurulumları için `/home/node/.npm-global` içine mount edilir
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altına salt okunur olarak mount edilir, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları, `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan yalnızca gerekli dizinleri/dosyaları mount eder
  - Elle geçersiz kılmak için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü bir liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden build gerektirmeyen tekrar çalıştırmalar için mevcut `openclaw:local-live` image'ını yeniden kullanmak üzere `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env'den değil profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testinin kullandığı nonce kontrol prompt'unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI image etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Doküman doğruluğu

Doküman düzenlemelerinden sonra doküman denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI için güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek pipeline” regresyonlarıdır:

- Gateway araç çağırma (sahte OpenAI, gerçek Gateway + agent döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, config + auth enforced yazar): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik eval'ları (Skills)

CI için güvenli, “agent güvenilirlik eval'ları” gibi davranan birkaç testimiz zaten var:

- Gerçek Gateway + agent döngüsü üzerinden sahte araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve config etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** Skills prompt içinde listelendiğinde, agent doğru Skill'i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanımdan önce `SKILL.md` dosyasını okuyor mu ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi devrini ve sandbox sınırlarını doğrulayan çok dönüşlü senaryolar.

Gelecekteki eval'lar önce deterministik kalmalıdır:

- Araç çağrılarını + sırasını, Skill dosyası okumalarını ve oturum kablolamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, geçitleme, prompt injection).
- CI için güvenli paket yerleşmeden önce değil, yalnızca sonrasında isteğe bağlı live eval'lar (opt-in, env geçitli).

## Sözleşme testleri (plugin ve channel şekli)

Sözleşme testleri, kayıtlı her plugin ve channel'ın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm plugin'ler üzerinde yineleme yapar
ve şekil ile davranış doğrulamaları paketi çalıştırır. Varsayılan `pnpm test` unit hattı
kasıtlı olarak bu paylaşılan sınır ve smoke dosyalarını atlar; paylaşılan channel veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça
çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca channel sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Channel sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel plugin şekli (id, ad, yetenekler)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Channel eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup politikası uygulama

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Channel durum probeları
- **registry** - Plugin kayıt şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akışı sözleşmesi
- **auth-choice** - Auth seçimi/tercihi
- **catalog** - Model katalog API
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı runtime
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- Plugin SDK dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir channel veya sağlayıcı plugin'i ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI'da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehber)

Live ortamda keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI için güvenli bir regresyon ekleyin (sahte/stub sağlayıcı veya tam istek-şekli dönüşümünü yakalayın)
- Sorun doğası gereği yalnızca live ise (hız sınırları, auth politikaları), live testi dar ve env değişkenleri üzerinden opt-in tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden oynatma hatası → doğrudan modeller testi
  - Gateway oturum/geçmiş/araç hattı hatası → Gateway live smoke veya CI için güvenli Gateway mock testi
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından traversal-segment exec id'lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içine yeni bir `includeInPlan` SecretRef hedef ailesi ekliyorsanız, o testteki `classifyTargetClass` öğesini güncelleyin. Test, yeni sınıfların sessizce atlanamaması için kasıtlı olarak sınıflandırılmamış hedef kimliklerinde başarısız olur.
