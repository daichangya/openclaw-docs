---
read_when:
    - Testleri yerel olarak veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - Gateway + ajan davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/live paketleri, Docker çalıştırıcıları ve her testin kapsadığı alanlar'
title: Test etme
x-i18n:
    generated_at: "2026-04-23T14:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbec4996699577321116c94f60c01d205d7594ed41aca27c821f1c3d65a7dca3
    source_path: help/testing.md
    workflow: 15
---

# Test etme

OpenClaw’ın üç Vitest paketi (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcı kümesi vardır.

Bu doküman bir “nasıl test ediyoruz” rehberidir:

- Her paketin neyi kapsadığı (ve özellikle neyi _kapsamadığı_)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Live testlerin kimlik bilgilerini nasıl bulduğu ve model/sağlayıcıları nasıl seçtiği
- Gerçek dünya model/sağlayıcı sorunları için regresyonların nasıl ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenen): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Güçlü bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendiriyor: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yaparken önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ekstra güven istediğinizde:

- Kapsama kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri ayıklarken (gerçek kimlik bilgileri gerekir):

- Live paketi (modeller + Gateway araç/görüntü probları): `pnpm test:live`
- Tek bir live dosyasını sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model taraması: `pnpm test:docker:live-models`
  - Artık seçilen her model bir metin dönüşü ve küçük bir dosya-okuma tarzı prob çalıştırır.
    Meta verileri `image` girdisini duyuran modeller ayrıca küçük bir görüntü dönüşü de çalıştırır.
    Sağlayıcı hatalarını izole ederken ek probları `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` veya
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ile devre dışı bırakın.
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve manuel
    `OpenClaw Release Checks`, her ikisi de yeniden kullanılabilir live/E2E iş akışını
    `include_live_suites: true` ile çağırır; bu, sağlayıcıya göre shard edilmiş
    ayrı Docker live model matris işlerini içerir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)`
    iş akışını `include_live_suites: true` ve `live_models_only: true` ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh` dosyasına,
    ayrıca `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ve onun
    zamanlanmış/sürüm çağırıcılarına ekleyin.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıyken,
  `openclaw models list --provider moonshot --json` çalıştırın, ardından
  `moonshot/kimi-k2.6` karşısında izole bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırın. JSON’un Moonshot/K2.6 raporladığını ve
  yardımcı transkriptinin normalize edilmiş `usage.cost` sakladığını doğrulayın.

İpucu: yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, aşağıda açıklanan allowlist env değişkenleriyle live testleri daraltmayı tercih edin.

## QA’ya özel çalıştırıcılar

Bu komutlar, QA-lab gerçekçiliğine ihtiyaç duyduğunuzda ana test paketlerinin yanında yer alır:

CI, QA Lab’ı ayrılmış iş akışlarında çalıştırır. `Parity gate`, eşleşen PR’lerde ve
manuel tetiklemede sahte sağlayıcılarla çalışır. `QA-Lab - All Lanes`, her gece
`main` üzerinde ve manuel tetiklemede sahte parity gate, live Matrix hattı ve
Convex tarafından yönetilen live Telegram hattını paralel işler olarak çalıştırır. `OpenClaw Release Checks`
yayın onayı öncesinde aynı hatları çalıştırır.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan host üzerinde çalıştırır.
  - Varsayılan olarak izole Gateway worker’ları ile birden fazla seçili senaryoyu paralel çalıştırır.
    `qa-channel` varsayılan olarak eşzamanlılık 4 kullanır (seçilen senaryo sayısıyla sınırlıdır).
    Worker sayısını ayarlamak için `--concurrency <count>`, eski seri hat içinse `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olursa sıfır olmayan çıkış koduyla biter. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, deneysel fixture ve protokol-sahteleme kapsamı için yerel bir AIMock destekli sağlayıcı sunucusu başlatır; ancak senaryo farkındalıklı `mock-openai` hattının yerini almaz.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini geçici bir Multipass Linux VM içinde çalıştırır.
  - Host üzerindeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Live çalıştırmalar, misafir için pratik olan desteklenen QA auth girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA live sağlayıcı yapılandırma yolu ve varsa `CODEX_HOME`.
  - Çıktı dizinleri depo kökü altında kalmalıdır; böylece misafir bağlanmış çalışma alanı üzerinden geri yazabilir.
  - Normal QA raporu + özeti ve Multipass günlüklerini `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışması için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout’tan bir npm tarball oluşturur, bunu Docker içinde global olarak kurar,
    etkileşimsiz OpenAI API anahtarı onboarding’i çalıştırır, varsayılan olarak Telegram’ı yapılandırır,
    Plugin etkinleştirmenin çalışma zamanı bağımlılıklarını ihtiyaç üzerine kurduğunu doğrular,
    doctor çalıştırır ve sahte bir OpenAI uç noktasına karşı bir yerel ajan dönüşü çalıştırır.
  - Aynı paketlenmiş-kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI yapılandırılmış şekilde Gateway’i başlatır,
    ardından paketlenmiş channel/plugin’leri yapılandırma düzenlemeleriyle etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış plugin çalışma zamanı bağımlılıklarını yok durumda bıraktığını,
    ilk yapılandırılmış Gateway veya doctor çalıştırmasının her paketlenmiş Plugin’in çalışma zamanı bağımlılıklarını ihtiyaç üzerine kurduğunu
    ve ikinci bir yeniden başlatmanın zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen eski bir npm temel sürümünü kurar, `openclaw update --tag <candidate>` çalıştırmadan önce Telegram’ı etkinleştirir
    ve aday sürümün güncelleme sonrası doctor adımının, harness tarafı bir postinstall onarımı olmadan paketlenmiş channel çalışma zamanı bağımlılıklarını onardığını doğrular.
- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Geçici Docker destekli bir Tuwunel homeserver’a karşı Matrix live QA hattını çalıştırır.
  - Bu QA host’u bugün yalnızca repo/geliştirme içindir. Paketlenmiş OpenClaw kurulumları `qa-lab` göndermez,
    dolayısıyla `openclaw qa` sunmaz.
  - Repo checkout’ları paketlenmiş çalıştırıcıyı doğrudan yükler; ayrı bir Plugin kurulum adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ve bir özel oda sağlar, ardından gerçek Matrix Plugin’i SUT taşıması olarak kullanan bir QA Gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel görüntüsü `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir görüntüyü test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, hattın yerel olarak geçici kullanıcılar sağlaması nedeniyle paylaşılan kimlik bilgisi kaynağı bayraklarını açığa çıkarmaz.
  - `.artifacts/qa-e2e/...` altında bir Matrix QA raporu, özet, gözlemlenen olaylar artifact’i ve birleşik stdout/stderr çıktı günlüğü yazar.
- `pnpm openclaw qa telegram`
  - Ortamdaki driver ve SUT bot token’larını kullanarak gerçek bir özel gruba karşı Telegram live QA hattını çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış kiralamalara geçmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olursa sıfır olmayan çıkış koduyla biter. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
  - Aynı özel grupta iki farklı bot gerekir; SUT botunun bir Telegram kullanıcı adını açığa çıkarması gerekir.
  - Kararlı bottan-bota gözlem için `@BotFather` içinde her iki bot için de Bot-to-Bot Communication Mode’u etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - `.artifacts/qa-e2e/...` altında bir Telegram QA raporu, özet ve gözlemlenen mesajlar artifact’i yazar. Yanıtlanan senaryolar, driver gönderim isteğinden gözlemlenen SUT yanıtına kadar RTT içerir.

Live taşıma hatları, yeni taşımaların sapmaması için tek bir standart sözleşme paylaşır:

`qa-channel`, geniş sentetik QA paketi olarak kalır ve live
taşıma kapsama matrisinin parçası değildir.

| Hat      | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde,
QA lab, Convex destekli bir havuzdan özel bir kira alır, hat çalışırken
bu kiraya Heartbeat gönderir ve kapanışta kirayı serbest bırakır.

Referans Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli env değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçili rol için bir sır:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Varsayılan env: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI’da varsayılan `ci`, diğer durumlarda `maintainer`)

İsteğe bağlı env değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı izleme kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL’lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal kullanımda `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekleme/kaldırma/listeleme) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer’lar için CLI yardımcıları:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Betiklerde ve CI yardımcılarında makine tarafından okunabilir çıktı için `--json` kullanın.

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
- `POST /admin/add` (yalnızca maintainer sırrı)
  - İstek: `{ kind, actorId, payload, note?, status? }`
  - Başarı: `{ status: "ok", credential }`
- `POST /admin/remove` (yalnızca maintainer sırrı)
  - İstek: `{ credentialId, actorId }`
  - Başarı: `{ status: "ok", changed, credential }`
  - Etkin kira koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer sırrı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için payload şekli:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş payload’ları reddeder.

### QA’ya bir channel ekleme

Bir channel’ı markdown QA sistemine eklemek tam olarak iki şey gerektirir:

1. Channel için bir taşıma bağdaştırıcısı.
2. Channel sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` host’u akışı sahiplenebiliyorken yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan host mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- worker eşzamanlılığı
- artifact yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Runner Plugin’leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- Gateway’in bu taşıma için nasıl yapılandırıldığı
- hazır oluşun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transkriptlerin ve normalize edilmiş taşıma durumunun nasıl açığa çıkarıldığı
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir channel için minimum benimseme çıtası şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`’ı koruyun.
2. Taşıma runner’ını paylaşılan `qa-lab` host seam’i üzerinde uygulayın.
3. Taşımaya özgü mekanikleri runner Plugin’i veya channel harness’i içinde tutun.
4. Runner’ı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın.
   Runner Plugin’leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` dosyasından eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` dosyasını hafif tutun; tembel CLI ve runner yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo bilinçli bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir channel taşımasına bağlıysa, onu o runner Plugin’i veya Plugin harness’i içinde tutun.
- Bir senaryo birden fazla channel’ın kullanabileceği yeni bir yetenek gerektiriyorsa, `suite.ts` içinde channel’a özgü bir dal yerine genel bir yardımcı ekleyin.
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

Mevcut senaryolar için uyumluluk takma adları kullanılabilir olmaya devam eder; bunlara şunlar dahildir:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni channel çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları, modelin
yeni senaryo yazımı için örnek olması amacıyla değil, bayrak günü tarzı bir geçişi önlemek için vardır.

## Test paketleri (ne nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan kararsızlık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: hedefsiz çalıştırmalar `vitest.full-*.config.ts` shard kümesini kullanır ve paralel planlama için çok projeli shard’ları proje başına yapılandırmalara genişletebilir
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki core/unit envanterleri ve `vitest.unit.config.ts` tarafından kapsanan allowlist’e alınmış `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi integration testleri (Gateway auth, yönlendirme, araç kullanımı, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI’da çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projeler notu:
  - Hedefsiz `pnpm test` artık tek bir devasa yerel kök-proje süreci yerine on iki daha küçük shard yapılandırması (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS’yi düşürür ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch`, çok shard’lı bir izleme döngüsü pratik olmadığından hâlâ yerel kök `vitest.config.ts` proje grafiğini kullanır.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`, tam kök proje başlatma vergisini ödemez.
  - `pnpm test:changed`, diff yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa değişen git yollarını aynı kapsamlı hatlara genişletir; yapılandırma/kurulum düzenlemeleri ise yine de geniş kök-proje yeniden çalıştırmasına geri döner.
  - `pnpm check:changed`, dar kapsamlı işler için normal akıllı yerel kapıdır. Diff’i core, core testleri, extensions, extension testleri, uygulamalar, dokümanlar, sürüm meta verisi ve araçlama olarak sınıflandırır, ardından eşleşen typecheck/lint/test hatlarını çalıştırır. Public Plugin SDK ve plugin-contract değişiklikleri, extension’lar bu core sözleşmelerine bağlı olduğu için extension doğrulamasını içerir. Yalnızca sürüm meta verisi içeren version bump’lar, tam paket yerine hedefli version/config/root-dependency denetimleri çalıştırır; üst düzey version alanı dışında paket değişikliklerini reddeden bir koruma ile.
  - Ajanlar, komutlar, Plugin’ler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan import açısından hafif unit testleri, `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattı üzerinden yönlendirilir; durumlu/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
  - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık sibling testlere eşler; böylece yardımcı düzenlemeleri bu dizin için tam ağır paketin yeniden çalışmasını gerektirmez.
  - `auto-reply` artık üç ayrılmış kovaya sahiptir: üst düzey core yardımcıları, üst düzey `reply.*` integration testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır reply harness işini ucuz status/chunk/token testlerinden uzak tutar.
- Gömülü runner notu:
  - Mesaj-aracı keşif girdilerini veya Compaction çalışma zamanı bağlamını değiştirdiğinizde,
    her iki kapsama düzeyini de koruyun.
  - Saf yönlendirme/normalleştirme sınırları için odaklı yardımcı regresyonları ekleyin.
  - Ayrıca gömülü runner integration paketlerini de sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının hâlâ
    gerçek `run.ts` / `compact.ts` yolları üzerinden aktığını doğrular; yalnızca yardımcı testleri
    bu integration yolları için yeterli bir ikame değildir.
- Havuz notu:
  - Temel Vitest yapılandırması artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest yapılandırması ayrıca `isolate: false` değerini sabitler ve kök projeler, e2e ve live yapılandırmaları arasında izole olmayan runner’ı kullanır.
  - Kök UI hattı kendi `jsdom` kurulumu ve optimizer’ını korur, ancak artık paylaşılan izole olmayan runner üzerinde de çalışır.
  - Her `pnpm test` shard’ı, paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalarda V8 derleme churn’ünü azaltmak için Vitest alt Node süreçlerine varsayılan olarak `--no-maglev` de ekler. Varsayılan V8 davranışıyla karşılaştırma yapmanız gerekiyorsa `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel yineleme notu:
  - `pnpm changed:lanes`, bir diff’in hangi mimari hatları tetiklediğini gösterir.
  - Pre-commit hook’u, aşamalı biçimlendirme/lint işleminden sonra `pnpm check:changed --staged` çalıştırır; bu nedenle yalnızca core commit’leri, public extension’a dönük sözleşmelere dokunmadıkça extension test maliyetini ödemez. Yalnızca sürüm meta verisi commit’leri hedefli version/config/root-dependency hattında kalır.
  - Değişikliğin tam aşamalı kümesi eşit veya daha güçlü kapılarla zaten doğrulandıysa, yalnızca changed-scope hook yeniden çalıştırmasını atlamak için `scripts/committer --fast "<message>" <files...>` kullanın. Aşamalı format/lint yine çalışır. Tamamlanan kapıları handoff’unuzda belirtin. Bu ayrıca izole edilmiş kararsız bir hook hatası yeniden çalıştırılıp kapsamlı kanıtla geçtiğinde de kabul edilebilir.
  - `pnpm test:changed`, değişen yollar temiz biçimde daha küçük bir pakete eşlenebildiğinde kapsamlı hatlar üzerinden yönlendirilir.
  - `pnpm test:max` ve `pnpm test:changed:max`, yalnızca daha yüksek worker sınırıyla aynı yönlendirme davranışını korur.
  - Yerel worker otomatik ölçekleme artık bilerek daha muhafazakârdır ve host yük ortalaması zaten yüksek olduğunda da geri çekilir; böylece birden fazla eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest yapılandırması, changed-mode yeniden çalıştırmalarının test bağlama değiştiğinde doğru kalması için proje/yapılandırma dosyalarını `forceRerunTriggers` olarak işaretler.
  - Yapılandırma, desteklenen host’larda `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profil çıkarma için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Performans hata ayıklama notu:
  - `pnpm test:perf:imports`, Vitest import-süresi raporlamasını ve import dökümü çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profil çıkarma görünümünü `origin/main` sonrasındaki değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, yönlendirilmiş `test:changed` çalıştırmasını bu commit edilmiş diff için yerel kök-proje yoluyla karşılaştırır ve duvar saati süresini artı macOS azami RSS’yi yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini `scripts/test-projects.mjs` ve kök Vitest yapılandırması üzerinden yönlendirerek geçerli kirli çalışma ağacını benchmark eder.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve dönüştürme yükü için bir ana iş parçacığı CPU profili yazar.
  - `pnpm test:perf:profile:runner`, dosya paralelliği devre dışıyken unit paketi için runner CPU+heap profilleri yazar.

### Stabilite (Gateway)

- Komut: `pnpm test:stability:gateway`
- Yapılandırma: `vitest.gateway.config.ts`, tek worker’a zorlanmış
- Kapsam:
  - Varsayılan olarak tanılama etkin gerçek bir loopback Gateway başlatır
  - Tanılama olay yolu üzerinden sentetik Gateway mesajı, bellek ve büyük payload churn’ü sürer
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama stabilite paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin baskı bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra indiğini doğrular
- Beklentiler:
  - CI için güvenli ve anahtarsız
  - Stabilite regresyonu takibi için dar bir hat; tam Gateway paketinin yerine geçmez

### E2E (Gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketlenmiş Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` ile `isolate: false` kullanır.
  - Uyarlamalı worker’lar kullanır (CI: en fazla 2, yerel: varsayılan olarak 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli Gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirmesi ve daha ağır ağ iletişimi
- Beklentiler:
  - CI’da çalışır (iş hattında etkinleştirildiğinde)
  - Gerçek anahtar gerekmez
  - Unit testlerinden daha fazla hareketli parça içerir (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Host üzerinde Docker aracılığıyla izole bir OpenShell Gateway başlatır
  - Geçici bir yerel Dockerfile’dan bir sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw’ın OpenShell backend’ini çalıştırır
  - Sandbox fs bridge üzerinden uzak-kanonik dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test Gateway’ini ve sandbox’ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikilisine veya wrapper betiğine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketlenmiş Plugin live testleri
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçekten _çalışıyor mu_?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, auth sorunlarını ve hız sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI’da kararlı değildir (gerçek ağlar, gerçek sağlayıcı politikaları, kotalar, kesintiler)
  - Paraya mal olur / hız sınırlarını kullanır
  - “Her şeyi” çalıştırmak yerine daraltılmış alt kümeler çalıştırmayı tercih edin
- Live çalıştırmalar, eksik API anahtarlarını almak için `~/.profile` dosyasını kaynak alır.
- Varsayılan olarak live çalıştırmalar yine de `HOME` dizinini izole eder ve yapılandırma/auth materyalini geçici bir test home dizinine kopyalar; böylece unit fixture’ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Live testlerin gerçek home dizininizi kullanmasını bilerek istediğinizde yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık daha sessiz bir modu varsayılan yapar: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve Gateway bootstrap günlükleri/Bonjour gürültüsünü susturur. Tam başlatma günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da live başına geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Live paketleri artık ilerleme satırlarını stderr’e yazar; böylece Vitest konsol yakalaması sessizken bile uzun sağlayıcı çağrılarının etkin olduğu görünür.
  - `vitest.live.config.ts`, sağlayıcı/Gateway ilerleme satırlarının live çalıştırmalar sırasında hemen akması için Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model Heartbeat’lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/prob Heartbeat’lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (ve çok şey değiştirdiyseniz `pnpm test:coverage`)
- Gateway ağ iletişimi / WS protokolü / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum çalışmıyor” / sağlayıcıya özgü başarısızlıklar / araç çağırma hatalarını ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Live: Android Node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android Node tarafından şu anda duyurulan **her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/elle kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçili Android Node için komut komut Gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten bağlı + Gateway ile eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Başarılı olmasını beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android Uygulaması](/tr/platforms/android)

## Live: model smoke (profil anahtarları)

Live testler, hataları izole edebilmemiz için iki katmana ayrılır:

- “Doğrudan model”, sağlayıcının/modelin verilen anahtarla en azından yanıt verebildiğini söyler.
- “Gateway smoke”, bu model için tam Gateway+ajan hattının çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox politikası vb.).

### Katman 1: Doğrudan model tamamlama (Gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri listelemek
  - Kimlik bilgileriniz olan modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest’i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi halde `pnpm test:live` komutunu Gateway smoke’a odaklı tutmak için atlanır
- Modeller nasıl seçilir:
  - Modern allowlist’i çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern allowlist’in takma adıdır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle allowlist)
  - Modern/all taramaları varsayılan olarak seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle allowlist)
- Anahtarlar nereden gelir:
  - Varsayılan olarak: profil deposu ve env geri dönüşleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “Sağlayıcı API’si bozuk / anahtar geçersiz” ile “Gateway ajan hattı bozuk” durumlarını ayırır
  - Küçük, izole regresyonlar içerir (örnek: OpenAI Responses/Codex Responses akıl yürütme tekrar oynatma + araç çağrısı akışları)

### Katman 2: Gateway + dev ajan smoke (`@openclaw` gerçekte ne yapar)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir Gateway ayağa kaldırmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılma)
  - Anahtarlı modelleri yinelemek ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısı çalışıyor (`read` probu)
    - isteğe bağlı ek araç probları (`exec+read` probu)
    - OpenAI regresyon yolları (yalnızca araç çağrısı → takip) çalışmaya devam ediyor
- Prob ayrıntıları (böylece başarısızlıkları hızlıca açıklayabilirsiniz):
  - `read` probu: test çalışma alanına bir nonce dosyası yazar ve ajandan bunu `read` ile okuyup nonce’u geri yansıtmasını ister.
  - `exec+read` probu: test ajandan `exec` ile geçici bir dosyaya nonce yazmasını, ardından bunu `read` ile geri okumasını ister.
  - görüntü probu: test oluşturulmuş bir PNG’yi (kedi + rastgele kod) ekler ve modelden `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest’i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Modeller nasıl seçilir:
  - Varsayılan: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern allowlist’in takma adıdır
  - Veya daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all Gateway taramaları varsayılan olarak seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir (“her şey OpenRouter” olmasın diye):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle allowlist)
- Araç + görüntü probları bu live testte her zaman açıktır:
  - `read` probu + `exec+read` probu (araç stresi)
  - görüntü probu, model görüntü girdi desteği duyurduğunda çalışır
  - Akış (üst düzey):
    - Test “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü ajan modele çok kipli bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke (Claude, Codex, Gemini veya diğer yerel CLI’lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan, yerel bir CLI backend kullanarak Gateway + ajan hattını doğrulamak.
- Backend’e özgü smoke varsayılanları, sahibi olan extension’ın `cli-backend.ts` tanımında bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest’i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görüntü davranışı, sahibi olan CLI backend Plugin meta verisinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir görüntü eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt içine enjekte edilir).
  - Görüntü dosyası yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlı olduğunda görüntü argümanlarının nasıl geçirileceğini kontrol etmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir dönüş göndermek ve resume akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı oturum süreklilik probunu devre dışı bırakmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçili model bir geçiş hedefini desteklediğinde bunu zorla açmak için `1` ayarlayın).

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
- Canlı CLI-backend smoke testini depo Docker görüntüsü içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- Sahibi olan extension’dan CLI smoke meta verisini çözümler, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` altında önbelleklenmiş yazılabilir bir öneke kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, ya `~/.claude/.credentials.json` içindeki `claudeAiOauth.subscriptionType` aracılığıyla ya da `claude setup-token` içinden `CLAUDE_CODE_OAUTH_TOKEN` aracılığıyla taşınabilir Claude Code abonelik OAuth’u gerektirir. Önce Docker içinde doğrudan `claude -p` çalıştığını kanıtlar, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI-backend dönüşü çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı sınırları yerine ek kullanım faturalandırmasına yönlendirdiği için Claude MCP/tool ve görüntü problarını varsayılan olarak devre dışı bırakır.
- Live CLI-backend smoke artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin dönüşü, görüntü sınıflandırma dönüşü, ardından Gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude’un varsayılan smoke testi ayrıca oturumu Sonnet’ten Opus’a yamalar ve devam ettirilen oturumun daha önceki bir notu hâlâ hatırladığını doğrular.

## Live: ACP bağlama smoke testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: live bir ACP ajanıyla gerçek ACP konuşma-bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir message-channel konuşmasını yerinde bağla
  - aynı konuşma üzerinde normal bir takip mesajı gönder
  - takibin bağlı ACP oturum transkriptine düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP ajanları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP ajanı: `claude`
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
  - Bu hat, testlerin message-channel bağlamını dışarıya teslim ediyormuş gibi yapmadan ekleyebilmesi için yalnızca yöneticiye açık sentetik originating-route alanlarıyla Gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlı olmadığında test, seçilen ACP harness ajanı için gömülü `acpx` Plugin’inin yerleşik ajan kaydını kullanır.

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

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` konumundadır.
- Varsayılan olarak ACP bağlama smoke testini desteklenen tüm live CLI ajanlarına sırayla karşı çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` dosyasını kaynak alır, eşleşen CLI auth materyalini container içine hazırlar, yazılabilir bir npm önekine `acpx` kurar, ardından eksikse istenen live CLI’ı (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) kurar.
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar; böylece acpx, kaynak alınan profildeki sağlayıcı env değişkenlerini alt harness CLI için kullanılabilir tutar.

## Live: Codex app-server harness smoke

- Amaç: Plugin’in sahibi olduğu Codex harness’i normal Gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin’ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - `codex/gpt-5.4` için ilk Gateway ajan dönüşünü gönder
  - aynı OpenClaw oturumuna ikinci dönüşü gönder ve app-server
    thread’inin devam edebildiğini doğrula
  - aynı Gateway komut
    yolu üzerinden `/codex status` ve `/codex models` çalıştır
  - isteğe bağlı olarak Guardian tarafından incelenen iki yükseltilmiş shell probu çalıştır:
    onaylanması gereken bir zararsız komut ve ajanın geri sorması için
    reddedilmesi gereken sahte bir sır yükleme denemesi
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı görüntü probu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç probu: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian probu: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness’i sessizce PI’ye geri düşerek başarılı olamaz.
- Auth: shell/profilden `OPENAI_API_KEY`, ayrıca isteğe bağlı kopyalanmış
  `~/.codex/auth.json` ve `~/.codex/config.toml`

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
- Bağlanmış `~/.profile` dosyasını kaynak alır, `OPENAI_API_KEY` geçirir, varsa Codex CLI
  auth dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlanmış bir npm
  önekine kurar, kaynak ağacını hazırlar, ardından yalnızca Codex-harness live testini çalıştırır.
- Docker, görüntü, MCP/araç ve Guardian problarını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama
  çalıştırmasına ihtiyaç duyduğunuzda `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu, live
  test yapılandırmasıyla eşleşir, böylece `openai-codex/*` veya PI geri dönüşü bir Codex harness
  regresyonunu gizleyemez.

### Önerilen live tarifleri

Dar, açık allowlist’ler en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (Gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birden fazla sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...`, Gemini API’sini kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı ajan uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI’ı kullanır (ayrı auth + araçlama tuhaflıkları).
- Gemini API ile Gemini CLI farkı:
  - API: OpenClaw, Google’ın barındırılan Gemini API’sini HTTP üzerinden çağırır (API anahtarı / profil auth); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw, yerel bir `gemini` ikilisini shell üzerinden çağırır; bunun kendi auth’u vardır ve farklı davranabilir (akış, araç desteği, sürüm kayması).

## Live: model matrisi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (live isteğe bağlıdır), ancak bunlar anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modellerdir.

### Modern smoke kümesi (araç çağırma + görüntü)

Çalışır durumda kalmasını beklediğimiz “yaygın modeller” çalıştırması budur:

- OpenAI (Codex dışı): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + görüntü ile Gateway smoke testi çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel seviye: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesi için en az bir tane seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olsa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en güncel sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API moduna bağlıdır)

### Vision: görüntü gönderimi (ek → çok kipli mesaj)

Görüntü probunu çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir görüntü yetenekli model ekleyin (Claude/Gemini/OpenAI’nin görüntü destekli varyantları vb.).

### Toplayıcılar / alternatif Gateway’ler

Anahtarlarınız etkinse, şunlar üzerinden test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+görüntü yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...`, Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile auth)

Live matrisine dahil edebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), ayrıca herhangi bir OpenAI/Anthropic uyumlu proxy (LM Studio, vLLM, LiteLLM vb.)

İpucu: dokümanlarda “tüm modelleri” sabit kodlamaya çalışmayın. Otoritatif liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Live testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçları:

- CLI çalışıyorsa, live testler de aynı anahtarları bulmalıdır.
- Bir live test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimini nasıl hata ayıklıyorsanız aynı şekilde ayıklayın.

- Ajan başına auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (live testlerde “profil anahtarları” denirken kastedilen budur)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanmış live home dizinine kopyalanır, ancak ana profil-anahtarı deposu değildir)
- Live yerel çalıştırmalar varsayılan olarak etkin yapılandırmayı, ajan başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI auth dizinlerini geçici bir test home dizinine kopyalar; hazırlanmış live home dizinleri `workspace/` ve `sandboxes/` öğelerini atlar, ayrıca probların gerçek host çalışma alanınızdan uzak kalması için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları temizlenir.

Env anahtarlarına güvenmek istiyorsanız (örneğin `~/.profile` içinde dışa aktarılmışsa), `source ~/.profile` sonrasında yerel testleri çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram live (ses transkripsiyonu)

- Test: `extensions/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus kodlama planı live

- Test: `extensions/byteplus/live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- İsteğe bağlı model geçersiz kılma: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI iş akışı medya live

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy görüntü, video ve `music_generate` yollarını çalıştırır
  - `models.providers.comfy.<capability>` yapılandırılmadıkça her yeteneği atlar
  - Comfy iş akışı gönderimi, yoklama, indirmeler veya Plugin kaydı değiştirildikten sonra kullanışlıdır

## Görüntü üretimi live

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı tüm görüntü üretimi sağlayıcı Plugin’lerini listeler
  - Problamadan önce eksik sağlayıcı env değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Paylaşılan çalışma zamanı yeteneği üzerinden stok görüntü üretimi varyantlarını çalıştırır:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Şu anda kapsanan paketlenmiş sağlayıcılar:
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
  - Profil deposu auth’unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Müzik üretimi live

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş müzik üretimi sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax’ı kapsar
  - Problamadan önce sağlayıcı env değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Mevcut olduğunda bildirilen her iki çalışma zamanı modunu da çalıştırır:
    - yalnızca prompt girdili `generate`
    - sağlayıcı `capabilities.edit.enabled` bildirdiğinde `edit`
  - Mevcut paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy live dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth’unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video üretimi live

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video üretimi sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik ıstakoz prompt’u ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` üzerinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın çıkabildiği için FAL’i varsayılan olarak atlar; bunu açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` geçin
  - Problamadan önce sağlayıcı env değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Mevcut olduğunda bildirilen dönüşüm modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model, paylaşılan taramada buffer destekli yerel görüntü girdisini kabul ettiğinde `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçilen sağlayıcı/model, paylaşılan taramada buffer destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak bir görüntü URL’si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak bir `veo3` text-to-video hattı ve uzak görüntü URL fixture’ı kullanan bir `kling` hattı çalıştırır
  - Mevcut `videoToVideo` live kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL’leri gerektirir
    - `google`, çünkü mevcut paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullanır ve bu yol paylaşılan taramada kabul edilmez
    - `openai`, çünkü mevcut paylaşılan hat org’a özgü video inpaint/remix erişim garantilerinden yoksundur
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramadaki FAL dâhil her sağlayıcıyı eklemek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için sağlayıcı başına işlem sınırını düşürmek üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth’unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya live harness

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan görüntü, müzik ve video live paketlerini depo-yerel tek bir giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` dosyasından otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir auth’a sahip sağlayıcılara otomatik daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı “Linux’ta çalışıyor” denetimleri)

Bu Docker çalıştırıcıları iki kovaya ayrılır:

- Live-model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, depo Docker görüntüsü içinde yalnızca eşleşen profil-anahtarı live dosyasını çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel yapılandırma dizininizi ve çalışma alanınızı bağlar (ve bağlanmışsa `~/.profile` dosyasını kaynak alır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker live çalıştırıcıları varsayılan olarak daha küçük bir smoke üst sınırı kullanır; böylece tam Docker taraması pratik kalır:
  `test:docker:live-models`, varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway`, varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı açıkça istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, `test:docker:live-build` ile live Docker görüntüsünü bir kez derler, sonra bunu iki live Docker hattı için yeniden kullanır. Ayrıca `test:docker:e2e-build` üzerinden bir paylaşılan `scripts/e2e/Dockerfile` görüntüsü derler ve bunu derlenmiş uygulamayı çalıştıran E2E container smoke çalıştırıcıları için yeniden kullanır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload`, bir veya daha fazla gerçek container başlatır ve daha üst düzey integration yollarını doğrular.

Live-model Docker çalıştırıcıları ayrıca yalnızca gereken CLI auth home dizinlerini bağlayıp bağlar (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü), sonra harici CLI OAuth’un host auth deposunu değiştirmeden token yenileyebilmesi için bunları çalıştırma öncesinde container home dizinine kopyalar:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev ajan: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskelet oluşturma): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball’unu Docker içinde global olarak kurar, varsayılan olarak env-ref onboarding artı Telegram üzerinden OpenAI yapılandırır, Plugin’i etkinleştirmenin çalışma zamanı bağımlılıklarını ihtiyaç üzerine kurduğunu doğrular, doctor çalıştırır ve sahte bir OpenAI ajan dönüşü çalıştırır. Önceden derlenmiş bir tarball’u `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, host yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya channel’ı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Gateway ağ iletişimi (iki container, WS auth + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses `web_search` minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`), Gateway üzerinden sahte bir OpenAI sunucusu çalıştırır, `web_search` işleminin `reasoning.effort` değerini `minimal`den `low`a yükselttiğini doğrular, ardından sağlayıcı şemasını reddetmeye zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP channel köprüsü (tohumlanmış Gateway + stdio köprüsü + ham Claude bildirim-frame smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP araçları (gerçek stdio MCP sunucusu + gömülü Pi profili izin/verme-engelleme smoke testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + izole Cron ve tek seferlik subagent çalıştırmaları sonrasında stdio MCP alt süreci kapatma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin’ler (kurulum smoke testi + `/plugin` takma adı + Claude-bundle yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
- Plugin güncelleme değişmedi smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config yeniden yükleme meta veri smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Paketlenmiş Plugin çalışma zamanı bağımlılıkları: `pnpm test:docker:bundled-channel-deps`, varsayılan olarak küçük bir Docker çalıştırıcı görüntüsü derler, OpenClaw’ı host üzerinde bir kez derleyip paketler, ardından bu tarball’u her Linux kurulum senaryosuna bağlar. Görüntüyü `OPENCLAW_SKIP_DOCKER_BUILD=1` ile yeniden kullanın, yeni bir yerel derlemeden sonra host yeniden derlemesini `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ile atlayın veya mevcut bir tarball’u `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile gösterin.
- Yineleme sırasında ilgisiz senaryoları devre dışı bırakarak paketlenmiş Plugin çalışma zamanı bağımlılıklarını daraltın, örneğin:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Paylaşılan derlenmiş-uygulama görüntüsünü elle önceden derlemek ve yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi pakete özgü görüntü geçersiz kılmaları ayarlandığında yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1`, uzak paylaşılan bir görüntüye işaret ettiğinde betikler görüntü yerelde zaten yoksa onu çeker. QR ve yükleyici Docker testleri kendi Dockerfile’larını korur; çünkü bunlar paylaşılan derlenmiş-uygulama çalışma zamanı yerine paket/kurulum davranışını doğrular.

Live-model Docker çalıştırıcıları ayrıca mevcut checkout’u salt okunur olarak bağlar ve
bunu container içinde geçici bir çalışma dizinine hazırlar. Bu, çalışma zamanı
görüntüsünü ince tutarken yine de Vitest’i tam olarak yerel kaynak/yapılandırmanıza karşı çalıştırır.
Hazırlama adımı, Docker live çalıştırmalarının
makineye özgü artifact’ları kopyalamak için dakikalar harcamaması adına `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya özgü `.build` veya
Gradle çıktı dizinleri gibi büyük yalnızca yerel önbellekleri ve uygulama derleme çıktılarını atlar.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece Gateway live probları
container içinde gerçek Telegram/Discord/vb. channel worker’larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; dolayısıyla
o Docker hattında Gateway
live kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de iletin.
`test:docker:openwebui`, daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkin
bir OpenClaw Gateway container’ı başlatır,
bu Gateway’e karşı sabitlenmiş bir Open WebUI container’ı başlatır, Open WebUI üzerinden
oturum açar, `/api/models` içinde `openclaw/default` değerinin açığa çıktığını doğrular, ardından
Open WebUI’nin `/api/chat/completions` proxy’si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma gözle görülür biçimde daha yavaş olabilir; çünkü Docker’ın
Open WebUI görüntüsünü çekmesi gerekebilir ve Open WebUI’nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir live model anahtarı bekler ve Docker’lı çalıştırmalarda
bunu sağlamak için birincil yol `OPENCLAW_PROFILE_FILE`
(varsayılan olarak `~/.profile`) değişkenidir.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazdırır.
`test:docker:mcp-channels`, kasıtlı olarak deterministiktir ve
gerçek bir Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Tohumlanmış bir Gateway
container’ı başlatır, `openclaw mcp serve` oluşturan ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verilerini,
live olay kuyruğu davranışını, giden gönderim yönlendirmesini ve Claude tarzı channel +
izin bildirimlerini gerçek stdio MCP köprüsü üzerinden doğrular. Bildirim denetimi
ham stdio MCP frame’lerini doğrudan inceler; böylece smoke testi yalnızca belirli bir istemci SDK’sının
yansıttığını değil, köprünün gerçekte ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve live
model anahtarı gerektirmez. Depo Docker görüntüsünü derler, container içinde gerçek bir stdio MCP probe sunucusu başlatır,
bu sunucuyu gömülü Pi bundle MCP çalışma zamanı üzerinden somutlaştırır,
aracı çalıştırır, ardından `coding` ve `messaging` profillerinin
`bundle-mcp` araçlarını koruduğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` ayarlarının ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve live model
anahtarı gerektirmez. Gerçek bir stdio MCP probe sunucusuna sahip tohumlanmış bir Gateway başlatır,
izole bir Cron dönüşü ve `/subagents spawn` tek seferlik alt süreç dönüşü çalıştırır, ardından
MCP alt sürecinin her çalıştırmadan sonra kapandığını doğrular.

Elle ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için koruyun. ACP thread yönlendirme doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı env değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`) `/home/node/.openclaw` konumuna bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` konumuna bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`) `/home/node/.profile` konumuna bağlanır ve testler çalıştırılmadan önce kaynak alınır
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, geçici config/workspace dizinleri ve harici CLI auth bağları olmadan yalnızca `OPENCLAW_PROFILE_FILE` içinden kaynak alınan env değişkenlerini doğrulamak için
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`) Docker içindeki önbellekli CLI kurulumları için `/home/node/.npm-global` konumuna bağlanır
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur bağlanır, ardından testler başlamadan önce `/home/node/...` içine kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - Elle geçersiz kılmak için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalarda mevcut `openclaw:local-live` görüntüsünü yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env’den değil profil deposundan gelmesini sağlamak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için Gateway tarafından açığa çıkarılan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testinde kullanılan nonce-kontrol prompt’unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI görüntü etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Doküman sağlama

Doküman düzenlemelerinden sonra doküman denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI için güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek hat” regresyonlarıdır:

- Gateway araç çağırma (sahte OpenAI, gerçek Gateway + ajan döngüsü): `src/gateway/gateway.test.ts` (durum: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway sihirbazı (WS `wizard.start`/`wizard.next`, config + auth yazımı zorunlu): `src/gateway/gateway.test.ts` (durum: "runs wizard over ws and writes auth token config")

## Ajan güvenilirliği değerlendirmeleri (Skills)

CI için güvenli “ajan güvenilirliği değerlendirmeleri” gibi davranan birkaç testimiz zaten var:

- Gerçek Gateway + ajan döngüsü üzerinden sahte araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum bağlamasını ve config etkilerini doğrulayan uçtan uca sihirbaz akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** prompt içinde Skills listelendiğinde ajan doğru Skill’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** ajan kullanımdan önce `SKILL.md` okuyor mu ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi taşınmasını ve sandbox sınırlarını doğrulayan çok dönüşlü senaryolar.

Gelecekteki değerlendirmeler öncelikle deterministik kalmalıdır:

- Araç çağrılarını + sırasını, Skill dosyası okumalarını ve oturum bağlamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, kapılama, prompt injection).
- İsteğe bağlı live değerlendirmeler (isteğe bağlı, env ile kapılı) yalnızca CI için güvenli paket yerleştirildikten sonra.

## Sözleşme testleri (Plugin ve channel şekli)

Sözleşme testleri, kayıtlı her Plugin ve channel’ın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin’leri yineleyip
şekil ve davranış doğrulamalarından oluşan bir paket çalıştırırlar. Varsayılan `pnpm test` unit hattı
bu paylaşılan seam ve smoke dosyalarını bilerek atlar; paylaşılan channel veya sağlayıcı yüzeylerine dokunduğunuzda
sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca channel sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Channel sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, name, capabilities)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Channel eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup politikası zorlama

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Channel durum probları
- **registry** - Plugin kayıt şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akış sözleşmesi
- **auth-choice** - Auth seçimi/seçimleme
- **catalog** - Model katalog API’si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- Plugin-sdk dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir channel veya sağlayıcı Plugin’i ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehber)

Live’da keşfedilen bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI için güvenli bir regresyon ekleyin (sahte/stub sağlayıcı veya tam istek-şekli dönüşümünü yakalayın)
- Doğası gereği yalnızca live ise (hız sınırları, auth politikaları), live testi dar ve env değişkenleriyle isteğe bağlı tutun
- Hatanın yakalandığı en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/yeniden oynatma hatası → doğrudan modeller testi
  - Gateway oturum/geçmiş/araç hattı hatası → Gateway live smoke testi veya CI için güvenli Gateway sahte testi
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından traversal-segment exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testte `classifyTargetClass` işlevini güncelleyin. Test, yeni sınıfların sessizce atlanamaması için sınıflandırılmamış hedef kimliklerinde bilerek başarısız olur.
