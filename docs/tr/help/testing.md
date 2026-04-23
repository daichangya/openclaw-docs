---
read_when:
    - Testleri yerelde veya CI'da çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - Gateway + agent davranışını ayıklama
summary: 'Test kiti: unit/e2e/live paketleri, Docker çalıştırıcıları ve her testin kapsadıkları'
title: Test etme
x-i18n:
    generated_at: "2026-04-23T09:04:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 647367fd0c3ea81bc3e8a7702c4a462cf4b9634989818f53153558edcf2218c1
    source_path: help/testing.md
    workflow: 15
---

# Test etme

OpenClaw'da üç Vitest paketi (unit/integration, e2e, live) ve küçük bir Docker çalıştırıcı kümesi vardır.

Bu belge bir “nasıl test ediyoruz” kılavuzudur:

- Her paketin neleri kapsadığı (ve kasıtlı olarak neleri kapsamadığı)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Live testlerin kimlik bilgilerini nasıl bulduğu ve model/sağlayıcıları nasıl seçtiği
- Gerçek dünya model/sağlayıcı sorunları için nasıl regresyon ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam geçit (push öncesi beklenir): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yapıyorsanız önce hedeflenmiş çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama geçidi: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri ayıklarken (gerçek kimlik bilgileri gerekir):

- Live paketi (modeller + gateway tool/image probe'ları): `pnpm test:live`
- Tek bir live dosyasını sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model taraması: `pnpm test:docker:live-models`
  - CI kapsamı: günlük `OpenClaw Scheduled Live And E2E Checks` ve elle
    çalıştırılan `OpenClaw Release Checks`, ikisi de
    `include_live_suites: true` ile yeniden kullanılabilir live/E2E iş akışını çağırır; buna
    sağlayıcıya göre shard edilmiş ayrı Docker live model
    matrix işleri dahildir.
  - Odaklı CI yeniden çalıştırmaları için `OpenClaw Live And E2E Checks (Reusable)`
    iş akışını `include_live_suites: true` ve `live_models_only: true`
    ile tetikleyin.
  - Yeni yüksek sinyalli sağlayıcı sırlarını `scripts/ci-hydrate-live-auth.sh`
    dosyasına ve `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ile onun
    schedule/release çağıranlarına ekleyin.
- Moonshot/Kimi maliyet smoke testi: `MOONSHOT_API_KEY` ayarlıysa
  `openclaw models list --provider moonshot --json` çalıştırın, ardından
  `moonshot/kimi-k2.6` üzerinde yalıtılmış bir
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  çalıştırması yapın. JSON çıktısının Moonshot/K2.6 bildirdiğini ve
  assistant transkriptinin normalize edilmiş `usage.cost` depoladığını
  doğrulayın.

İpucu: yalnızca tek bir başarısız olguya ihtiyacınız varsa, aşağıda açıklanan allowlist env değişkenleriyle live testleri daraltmayı tercih edin.

## QA'ya özgü çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

CI, QA Lab'ı ayrılmış iş akışlarında çalıştırır. `Parity gate`, eşleşen PR'lerde ve
mock sağlayıcılarla elle tetiklemede çalışır. `QA-Lab - All Lanes`, geceleyin
`main` üzerinde ve mock parity gate, live Matrix hattı ve
Convex tarafından yönetilen live Telegram hattı paralel işler olarak elle tetiklemede çalışır. `OpenClaw Release Checks`
yayın onayından önce aynı hatları çalıştırır.

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Varsayılan olarak birden çok seçili senaryoyu yalıtılmış
    gateway worker'ları ile paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılık 4 kullanır (seçilen senaryo sayısıyla sınırlıdır). Worker
    sayısını ayarlamak için `--concurrency <count>`, eski seri hat içinse
    `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır dışı kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı modlarını destekler.
    `aimock`, deneysel fixture ve protocol-mock kapsamı için yerel bir AIMock destekli
    sağlayıcı sunucusu başlatır; bu, senaryo farkındalıklı
    `mock-openai` hattının yerini almaz.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini geçici bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçimi davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Live çalıştırmalar, misafir için pratik olan desteklenen QA auth girdilerini iletir:
    env tabanlı sağlayıcı anahtarları, QA live sağlayıcı config yolu ve varsa `CODEX_HOME`.
  - Çıktı dizinleri depo kökünün altında kalmalıdır ki misafir
    bağlanmış çalışma alanı üzerinden geri yazabilsin.
  - Normal QA raporunu + özeti ve Multipass günlüklerini
    `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Geçerli checkout'tan bir npm tarball oluşturur, bunu Docker içinde global kurar,
    etkileşimsiz OpenAI API anahtarı onboarding çalıştırır, varsayılan olarak Telegram
    yapılandırır, Plugin etkinleştirmenin çalışma zamanı bağımlılıklarını gerektiğinde kurduğunu doğrular,
    doctor çalıştırır ve mock bir OpenAI
    uç noktasına karşı bir yerel agent turu çalıştırır.
  - Aynı paketlenmiş-kurulum hattını Discord ile çalıştırmak için `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` kullanın.
- `pnpm test:docker:bundled-channel-deps`
  - Geçerli OpenClaw derlemesini Docker içinde paketler ve kurar, OpenAI
    yapılandırılmış halde Gateway'i başlatır, sonra paketlenmiş kanal/Plugin'leri config
    düzenlemeleriyle etkinleştirir.
  - Kurulum keşfinin yapılandırılmamış Plugin çalışma zamanı bağımlılıklarını
    yok durumda bıraktığını, ilk yapılandırılmış Gateway veya doctor çalıştırmasının her paketlenmiş
    Plugin'in çalışma zamanı bağımlılıklarını gerektiğinde kurduğunu ve ikinci bir yeniden başlatmanın
    zaten etkinleştirilmiş bağımlılıkları yeniden kurmadığını doğrular.
  - Ayrıca bilinen daha eski bir npm temelini kurar, Telegram'ı etkinleştirip
    sonra `openclaw update --tag <candidate>` çalıştırır ve adayın
    güncelleme sonrası doctor onarımının paketlenmiş kanal çalışma zamanı bağımlılıklarını
    harness tarafında bir postinstall onarımı olmadan düzelttiğini doğrular.
- `pnpm openclaw qa aimock`
  - Doğrudan protocol smoke
    testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix live QA hattını geçici Docker destekli bir Tuwunel homeserver'a karşı çalıştırır.
  - Bu QA ana makinesi şu anda yalnızca repo/dev içindir. Paketlenmiş OpenClaw kurulumları
    `qa-lab` göndermez, bu yüzden `openclaw qa` sunmaz.
  - Repo checkout'ları paketlenmiş çalıştırıcıyı doğrudan yükler; ayrı bir Plugin kurulum adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ve bir özel oda sağlar, ardından gerçek Matrix Plugin'i SUT taşıma katmanı olarak kullanan bir QA gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel imajı `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir imajı test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, hat geçici kullanıcıları yerelde sağladığı için paylaşılan kimlik bilgisi kaynağı bayrakları sunmaz.
  - Bir Matrix QA raporu, özet, gözlemlenen olaylar artifact'ı ve birleştirilmiş stdout/stderr çıktı günlüğünü `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram live QA hattını, env içindeki driver ve SUT bot token'larını kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env modunu kullanın veya havuzlanmış kiralamalara katılmak için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır dışı kodla çıkar. Başarısız çıkış kodu olmadan artifact istiyorsanız `--allow-failures` kullanın.
  - Aynı özel grupta iki farklı bot gerektirir; SUT botu bir Telegram kullanıcı adı sunmalıdır.
  - Kararlı bottan-bota gözlem için her iki botta da `@BotFather` içinde Bot-to-Bot Communication Mode'u etkinleştirin ve driver botun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Bir Telegram QA raporu, özet ve gözlemlenen mesajlar artifact'ını `.artifacts/qa-e2e/...` altına yazar.

Live taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşıma katmanları sapmaz:

`qa-channel` geniş sentetik QA paketi olarak kalır ve live
taşıma kapsam matriksinin parçası değildir.

| Hat     | Canary | Mention geçitleme | Allowlist engeli | Üst düzey yanıt | Yeniden başlatma sonrası sürdürme | Thread takibi | Thread yalıtımı | Tepki gözlemi | Yardım komutu |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex ile paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde QA lab, Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken bu kiralamaya Heartbeat gönderir ve kapanışta kiralamayı bırakır.

Başvuru Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli env değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir sır:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Env varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI'da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı env değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı iz kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için local loopback `http://` Convex URL'lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal kullanımda `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekle/kaldır/listele) özellikle
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` gerektirir.

Maintainer'lar için CLI yardımcıları:

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
  - Etkin kiralama koruması: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (yalnızca maintainer sırrı)
  - İstek: `{ kind?, status?, includePayload?, limit? }`
  - Başarı: `{ status: "ok", credentials, count }`

Telegram türü için payload biçimi:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId`, sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu biçimi doğrular ve bozuk payload'ları reddeder.

### QA'ya bir kanal ekleme

Markdown QA sistemine bir kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` ana makinesi akışın sahibi olabiliyorsa yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan ana makine mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- worker eşzamanlılığı
- artifact yazımı
- rapor üretimi
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı Plugin'leri taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` komutunun paylaşılan `qa` kökü altına nasıl bağlandığı
- gateway'in o taşıma için nasıl yapılandırıldığı
- hazır olma durumunun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transkriptlerin ve normalize edilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşıma özel sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için asgari benimseme eşiği şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`'ı koruyun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine dikişi üzerinde uygulayın.
3. Taşıma özel mekanikleri çalıştırıcı Plugin veya kanal harness'i içinde tutun.
4. Rekabet eden bir kök komut kaydetmek yerine çalıştırıcıyı `openclaw qa <runner>` olarak bağlayın.
   Çalıştırıcı Plugin'leri `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` dosyasından eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` dosyasını hafif tutun; tembel CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo kasıtlı bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır durumda tutun.

Karar kuralı katıdır:

- Davranış `qa-lab` içinde tek seferde ifade edilebiliyorsa onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımaya bağlıysa onu o çalıştırıcı Plugin veya Plugin harness'i içinde tutun.
- Bir senaryo birden fazla kanalın kullanabileceği yeni bir yeteneğe ihtiyaç duyuyorsa `suite.ts` içinde kanala özel bir dal yerine genel bir yardımcı ekleyin.
- Bir davranış yalnızca tek bir taşıma için anlamlıysa senaryoyu taşıma özel tutun ve bunu senaryo sözleşmesinde açık hale getirin.

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

Mevcut senaryolar için uyumluluk takma adları kullanılabilir kalır, bunlar arasında:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları bayrak günü geçişini önlemek içindir, yeni senaryo yazımı için model değildir.

## Test paketleri (ne nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan oynaklık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Config: mevcut kapsamlı Vitest projeleri üzerinde on sıralı shard çalıştırması (`vitest.full-*.config.ts`)
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki çekirdek/unit envanterleri ve `vitest.unit.config.ts` tarafından kapsanan izinli `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi integration testleri (gateway auth, routing, tooling, parsing, config)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI içinde çalışır
  - Gerçek anahtar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projeler notu:
  - Hedeflenmemiş `pnpm test` artık tek bir devasa yerel kök-proje süreci yerine on bir küçük shard config'i (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS'i azaltır ve auto-reply/extension işlerinin ilişkisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch`, çoklu shard izleme döngüsü pratik olmadığı için yine yerel kök `vitest.config.ts` proje grafiğini kullanır.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlardan yönlendirir; bu yüzden `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam kök proje başlatma vergisini ödemez.
  - `pnpm test:changed`, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunduğunda değişen git yollarını aynı kapsamlı hatlara genişletir; config/setup düzenlemeleri yine geniş kök-proje yeniden çalıştırmasına fallback yapar.
  - `pnpm check:changed`, dar işler için normal akıllı yerel geçittir. Farkı çekirdek, çekirdek testleri, extensions, extension testleri, uygulamalar, belgeler, yayın meta verisi ve tooling olarak sınıflandırır, sonra eşleşen typecheck/lint/test hatlarını çalıştırır. Genel Plugin SDK ve plugin-contract değişiklikleri extension doğrulamasını içerir çünkü extension'lar bu çekirdek sözleşmelere bağlıdır. Yalnızca yayın meta verisi sürüm artırımları, üst düzey sürüm alanı dışındaki paket değişikliklerini reddeden bir koruma ile tam paket yerine hedeflenmiş sürüm/config/kök-bağımlılık denetimleri çalıştırır.
  - Agent'lar, komutlar, Plugin'ler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan hafif import'lu unit testler `unit-fast` hattına yönlendirilir; bu hat `test/setup-openclaw-runtime.ts` dosyasını atlar; durumlu/çalışma zamanı ağır dosyalar mevcut hatlarda kalır.
  - Seçilmiş `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır paketi yeniden çalıştırmaz.
  - `auto-reply` artık üç ayrılmış bölüme sahiptir: üst düzey çekirdek yardımcılar, üst düzey `reply.*` integration testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır yanıt harness işini ucuz status/chunk/token testlerinden uzak tutar.
- Gömülü çalıştırıcı notu:
  - Message-tool keşif girdilerini veya Compaction çalışma zamanı bağlamını değiştirdiğinizde kapsamın iki düzeyini de koruyun.
  - Saf routing/normalization sınırları için odaklı yardımcı regresyonları ekleyin.
  - Ayrıca gömülü çalıştırıcı integration paketlerini sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler kapsamlı kimliklerin ve Compaction davranışının gerçek `run.ts` / `compact.ts` yollarından hâlâ aktığını doğrular; yalnızca yardımcı testleri bu integration yolları için yeterli bir ikame değildir.
- Havuz notu:
  - Temel Vitest config artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest config ayrıca `isolate: false` düzeltmesi yapar ve kök projeler, e2e ve live config'ler boyunca yalıtılmamış çalıştırıcı kullanır.
  - Kök UI hattı `jsdom` kurulumu ve optimizer'ını korur, ancak artık o da paylaşılan yalıtılmamış çalıştırıcı üzerinde çalışır.
  - Her `pnpm test` shard'ı paylaşılan Vitest config'den aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalar sırasında V8 derleme çalkantısını azaltmak için varsayılan olarak Vitest alt Node süreçlerine `--no-maglev` de ekler. Stok V8 davranışıyla karşılaştırmanız gerekirse `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel yineleme notu:
  - `pnpm changed:lanes`, bir farkın hangi mimari hatları tetiklediğini gösterir.
  - Pre-commit hook, aşamalı biçimlendirme/lint işleminden sonra `pnpm check:changed --staged` çalıştırır; böylece yalnızca çekirdek commit'ler, genel extension yüzlü sözleşmelere dokunmadıkça extension test maliyetini ödemez. Yalnızca yayın meta verisi commit'leri hedeflenmiş sürüm/config/kök-bağımlılık hattında kalır.
  - Tam olarak aynı aşamalı değişiklik kümesi eşit veya daha güçlü geçitlerle zaten doğrulandıysa, yalnızca changed-scope hook yeniden çalıştırmasını atlamak için `scripts/committer --fast "<message>" <files...>` kullanın. Aşamalı format/lint yine çalışır. Tamamlanan geçitleri el tesliminde belirtin. Bu, yalıtılmış oynak bir hook hatası yeniden çalıştırılıp kapsamlı kanıtla geçtiğinde de kabul edilir.
  - `pnpm test:changed`, değişen yollar daha küçük bir pakete temiz şekilde eşleniyorsa kapsamlı hatlar üzerinden yönlenir.
  - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur, yalnızca daha yüksek worker sınırıyla.
  - Yerel worker otomatik ölçekleme artık kasıtlı olarak daha muhafazakârdır ve ana makine yük ortalaması zaten yüksekse geri çekilir; böylece birden fazla eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest config, changed-mode yeniden çalıştırmalarının test bağlantısı değiştiğinde doğru kalması için projeleri/config dosyalarını `forceRerunTriggers` olarak işaretler.
  - Config, desteklenen ana makinelerde `OPENCLAW_VITEST_FS_MODULE_CACHE` özelliğini etkin tutar; doğrudan profil çıkarma için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Perf-debug notu:
  - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve import dökümü çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profil görünümünü `origin/main` sonrası değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, o commit edilmiş fark için yönlendirilmiş `test:changed` ile yerel kök-proje yolunu karşılaştırır ve duvar saati ile macOS azami RSS'i yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini `scripts/test-projects.mjs` ve kök Vitest config üzerinden yönlendirerek geçerli kirli çalışma ağacını kıyaslar.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform yükü için ana iş parçacığı CPU profili yazar.
  - `pnpm test:perf:profile:runner`, unit paketi için dosya paralelliği devre dışı bırakılmış halde çalıştırıcı CPU+heap profilleri yazar.

### Kararlılık (gateway)

- Komut: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, tek worker'a zorlanır
- Kapsam:
  - Varsayılan olarak tanılama etkin gerçek bir loopback Gateway başlatır
  - Tanılama olay yolu üzerinden sentetik gateway mesajı, bellek ve büyük payload çalkantısı yürütür
  - Gateway WS RPC üzerinden `diagnostics.stability` sorgular
  - Tanılama kararlılık paketi kalıcılık yardımcılarını kapsar
  - Kaydedicinin sınırlı kaldığını, sentetik RSS örneklerinin basınç bütçesinin altında kaldığını ve oturum başına kuyruk derinliklerinin yeniden sıfıra indiğini doğrular
- Beklentiler:
  - CI-güvenli ve anahtarsız
  - Kararlılık regresyonu takibi için dar hat, tam Gateway paketinin yerine geçmez

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` ve `extensions/` altındaki paketlenmiş-Plugin E2E testleri
- Çalışma zamanı varsayılanları:
  - Depodaki geri kalanla eşleşecek şekilde Vitest `threads` ve `isolate: false` kullanır.
  - Uyarlanabilir worker'lar kullanır (CI: en çok 2, yerelde varsayılan 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz modda çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (16 ile sınırlı).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, Node eşleştirme ve daha ağır ağ davranışı
- Beklentiler:
  - Pipeline içinde etkinleştirildiğinde CI'da çalışır
  - Gerçek anahtar gerekmez
  - Unit testlerinden daha fazla hareketli parçaya sahiptir (daha yavaş olabilir)

### E2E: OpenShell arka uç smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `extensions/openshell/src/backend.e2e.test.ts`
- Kapsam:
  - Ana makinede Docker aracılığıyla yalıtılmış bir OpenShell gateway başlatır
  - Geçici yerel bir Dockerfile'dan bir sandbox oluşturur
  - OpenClaw'ın OpenShell arka ucunu gerçek `sandbox ssh-config` + SSH exec üzerinden çalıştırır
  - Uzak-kanonik dosya sistemi davranışını sandbox fs köprüsü üzerinden doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - Yalıtılmış `HOME` / `XDG_CONFIG_HOME` kullanır, sonra test gateway'ini ve sandbox'ı yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikili dosyasını veya sarmalayıcı betiği işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` ve `extensions/` altındaki paketlenmiş-Plugin live testleri
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçekten gerçek kimlik bilgileriyle çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, tool-calling tuhaflıklarını, auth sorunlarını ve hız sınırı davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı ilkeleri, kotalar, kesintiler)
  - Para harcar / hız sınırlarını kullanır
  - “her şeyi” çalıştırmak yerine daraltılmış alt kümeler çalıştırmayı tercih edin
- Live çalıştırmalar eksik API anahtarlarını almak için `~/.profile` dosyasını kaynaklar.
- Varsayılan olarak live çalıştırmalar yine de `HOME` dizinini yalıtır ve config/auth malzemesini geçici bir test ana dizinine kopyalar; böylece unit fixture'ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Live testlerin gerçek ana dizininizi kullanmasını bilerek istediğinizde yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir mod kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap günlükleri/Bonjour gürültüsünü susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı döndürme (sağlayıcıya özgü): virgül/noktalı virgül biçimiyle `*_API_KEYS` ya da `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) veya live başına geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler hız sınırı yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Live paketleri artık uzun sağlayıcı çağrıları Vitest konsol yakalaması sessizken bile görünür biçimde etkin olsun diye stderr'e ilerleme satırları yazar.
  - `vitest.live.config.ts`, sağlayıcı/gateway ilerleme satırları live çalıştırmalar sırasında anında aksın diye Vitest konsol yakalamasını devre dışı bırakır.
  - Doğrudan model Heartbeat'lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/probe Heartbeat'lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (çok şey değiştirdiyseniz `pnpm test:coverage` de)
- Gateway ağı / WS protokolü / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “botum kapalı” / sağlayıcıya özgü hatalar / tool calling ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Live: Android Node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android Node tarafından şu anda duyurulan **her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/elle kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android Node için komut-komut gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten gateway'e bağlı + eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Başarılı olmasını beklediğiniz yetenekler için izinler/yakalama izni verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tam Android kurulum ayrıntıları: [Android App](/tr/platforms/android)

## Live: model smoke (profil anahtarları)

Live testler, hataları yalıtabilmek için iki katmana ayrılmıştır:

- “Doğrudan model”, sağlayıcı/modelin verilen anahtarla en azından yanıt verebildiğini söyler.
- “Gateway smoke”, tam gateway+agent hattının o model için çalıştığını söyler (oturumlar, geçmiş, tools, sandbox ilkesi vb.).

### Katman 1: Doğrudan model tamamlama (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgilerinizin bulunduğu modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir tamamlama çalıştırmak (ve gerekirse hedefli regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya modern için takma ad olan `all`) ayarlayın; aksi halde `pnpm test:live` çıktısını gateway smoke üzerinde odaklı tutmak için atlanır
- Modeller nasıl seçilir:
  - Modern allowlist'i çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern allowlist için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle allowlist)
  - Modern/all taramaları varsayılan olarak seçilmiş yüksek sinyalli bir üst sınıra sahiptir; kapsamlı modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif sayı ayarlayın.
- Sağlayıcılar nasıl seçilir:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle allowlist)
- Anahtarlar nereden gelir:
  - Varsayılan olarak: profil deposu ve env fallback'leri
  - Yalnızca **profil deposunu** zorlamak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “sağlayıcı API'si bozuk / anahtar geçersiz” ile “gateway agent hattı bozuk” durumlarını ayırır
  - Küçük, yalıtılmış regresyonları içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + tool-call akışları)

### Katman 2: Gateway + geliştirme agent'ı smoke testi (`@openclaw`'ın gerçekten yaptığı şey)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamamak (çalıştırma başına model geçersiz kılması)
  - Anahtarları olan modeller üzerinde yineleyip şunları doğrulamak:
    - “anlamlı” yanıt (tools yok)
    - gerçek bir tool çağrısı çalışıyor (read probe)
    - isteğe bağlı ek tool probe'ları (exec+read probe)
    - OpenAI regresyon yolları (yalnızca tool-call → takip) çalışmaya devam ediyor
- Probe ayrıntıları (hataları hızlı açıklayabilmeniz için):
  - `read` probe: test çalışma alanına bir nonce dosyası yazar ve agent'tan bunu `read` ile okuyup nonce'u geri yankılamasını ister.
  - `exec+read` probe: test agent'tan bir nonce'u geçici dosyaya `exec` ile yazmasını, sonra `read` ile geri okumasını ister.
  - image probe: test üretilmiş bir PNG (kedi + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
- Modeller nasıl seçilir:
  - Varsayılan: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern allowlist için bir takma addır
  - Ya da daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgüllü liste) ayarlayın
  - Modern/all gateway taramaları varsayılan olarak seçilmiş yüksek sinyalli bir üst sınıra sahiptir; kapsamlı modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif sayı ayarlayın.
- Sağlayıcılar nasıl seçilir (“OpenRouter her şey” durumundan kaçınmak için):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle allowlist)
- Tool + image probe'ları bu live testte her zaman açıktır:
  - `read` probe + `exec+read` probe (tool baskı testi)
  - image probe, model görsel girdi desteği duyurduğunda çalışır
  - Akış (yüksek seviye):
    - Test “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Gömülü agent multimodal bir kullanıcı mesajını modele iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: makinenizde neyi test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI arka uç smoke testi (Claude, Codex, Gemini veya başka yerel CLI'ler)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan config'inize dokunmadan, yerel bir CLI arka ucu kullanarak Gateway + agent hattını doğrulamak.
- Arka uca özgü smoke varsayılanları, sahibi olan extension'ın `cli-backend.ts` tanımıyla birlikte yaşar.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest'i doğrudan çağırıyorsanız `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/görsel davranışı sahibi olan CLI arka uç Plugin meta verisinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek görsel eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt içine enjekte edilir).
  - Görsel dosya yollarını prompt enjekte etmek yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlı olduğunda görsel argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci tur göndermek ve resume akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı-oturum süreklilik probe'unu devre dışı bırakmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçilen model bir geçiş hedefini desteklediğinde zorla açmak için `1` ayarlayın).

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
- Live CLI arka uç smoke testini depo Docker imajı içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- CLI smoke meta verisini sahibi olan extension'dan çözümler, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) `OPENCLAW_DOCKER_CLI_TOOLS_DIR` içinde önbelleğe alınmış yazılabilir bir öneke kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, `~/.claude/.credentials.json` içindeki `claudeAiOauth.subscriptionType` veya `claude setup-token` içinden `CLAUDE_CODE_OAUTH_TOKEN` aracılığıyla taşınabilir Claude Code abonelik OAuth'u gerektirir. Önce Docker içinde doğrudan `claude -p` komutunu kanıtlar, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI arka uç turu çalıştırır. Bu abonelik hattı, Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik plan sınırları yerine ek kullanım faturalandırmasına yönlendirdiği için Claude MCP/tool ve image probe'larını varsayılan olarak devre dışı bırakır.
- Live CLI arka uç smoke testi artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin turu, görsel sınıflandırma turu, ardından gateway CLI üzerinden doğrulanan MCP `cron` tool çağrısı.
- Claude'un varsayılan smoke testi ayrıca oturumu Sonnet'ten Opus'a yamalar ve sürdürülmüş oturumun önceki notu hâlâ hatırladığını doğrular.

## Live: ACP bağlama smoke testi (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: canlı bir ACP agent ile gerçek ACP konuşma-bağlama akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir message-channel konuşmasını yerinde bağla
  - aynı konuşma üzerinde normal bir takip mesajı gönder
  - takibin bağlı ACP oturumu transkriptine düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP agent'ları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP agent'ı: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP arka ucu: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Notlar:
  - Bu hat, testlerin dışarıya teslim ediyormuş gibi yapmadan message-channel bağlamı ekleyebilmesi için yöneticiye özel sentetik originating-route alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmamışsa test, seçilen ACP harness agent için gömülü `acpx` Plugin'inin yerleşik agent kayıt defterini kullanır.

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

Tek agent'lı Docker tarifleri:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker notları:

- Docker çalıştırıcısı `scripts/test-live-acp-bind-docker.sh` konumunda bulunur.
- Varsayılan olarak ACP bağlama smoke testini tüm desteklenen canlı CLI agent'larına sırayla karşı çalıştırır: `claude`, `codex`, sonra `gemini`.
- Matrix'i daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` dosyasını kaynaklar, eşleşen CLI auth malzemesini container'a hazırlar, `acpx`'i yazılabilir bir npm önekine kurar, sonra eksikse istenen canlı CLI'yi (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) kurar.
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar; böylece acpx, kaynaklanmış profildeki sağlayıcı env değişkenlerini alt harness CLI için kullanılabilir tutar.

## Live: Codex app-server harness smoke testi

- Amaç: Plugin'e ait Codex harness'ini normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin'ini yükle
  - `OPENCLAW_AGENT_RUNTIME=codex` seç
  - `codex/gpt-5.4` için ilk gateway agent turunu gönder
  - aynı OpenClaw oturumuna ikinci turu gönder ve app-server
    thread'inin resume edebildiğini doğrula
  - `/codex status` ve `/codex models` komutlarını aynı gateway komut
    yolu üzerinden çalıştır
  - isteğe bağlı olarak Guardian tarafından gözden geçirilen iki yükseltilmiş shell probe'u çalıştır: onaylanması gereken zararsız bir
    komut ve agent'ın geri sorması için reddedilmesi gereken sahte-gizli yükleme
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- İsteğe bağlı Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke testi `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar; böylece bozuk bir Codex
  harness'i sessizce PI'ye fallback yaparak geçemez.
- Auth: shell/profile içinden `OPENAI_API_KEY`, artı isteğe bağlı kopyalanmış
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

- Docker çalıştırıcısı `scripts/test-live-codex-harness-docker.sh` konumunda bulunur.
- Bağlanmış `~/.profile` dosyasını kaynaklar, `OPENAI_API_KEY` geçirir, varsa Codex CLI
  auth dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlanmış npm
  önekine kurar, kaynak ağacını hazırlar, sonra yalnızca Codex-harness live testini çalıştırır.
- Docker varsayılan olarak image, MCP/tool ve Guardian probe'larını etkinleştirir.
  Daha dar bir hata ayıklama
  çalıştırmasına ihtiyaç duyduğunuzda `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`,
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu live
  test config'i ile eşleşir, böylece `openai-codex/*` veya PI fallback bir Codex harness
  regresyonunu gizleyemez.

### Önerilen live tarifleri

Dar, açık allowlist'ler en hızlı ve en az oynaktır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birkaç sağlayıcı arasında tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...` Gemini API'sini kullanır (API anahtarı).
- `google-antigravity/...` Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı agent uç noktası).
- `google-gemini-cli/...` makinenizdeki yerel Gemini CLI'yi kullanır (ayrı auth + tooling tuhaflıkları).
- Gemini API ile Gemini CLI:
  - API: OpenClaw, Google'ın barındırılan Gemini API'sini HTTP üzerinden çağırır (API anahtarı / profil auth); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw yerel `gemini` ikili dosyasını shell üzerinden çağırır; bunun kendi auth'u vardır ve farklı davranabilir (streaming/tool desteği/sürüm kayması).

## Live: model matriksi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (live isteğe bağlıdır), ancak bunlar anahtarları olan bir geliştirme makinesinde düzenli kapsanması **önerilen** modellerdir.

### Modern smoke kümesi (tool calling + image)

Bu, çalışmaya devam etmesini beklediğimiz “yaygın modeller” çalıştırmasıdır:

- OpenAI (Codex olmayan): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Tools + image ile gateway smoke testi çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel: tool calling (Read + isteğe bağlı Exec)

Sağlayıcı ailesi başına en az bir tane seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olsa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en yeni)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” yetenekli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; tool calling API moduna bağlıdır)

### Vision: image send (ek → multimodal mesaj)

Image probe'unu çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir image-capable model ekleyin (Claude/Gemini/OpenAI vision-capable varyantları vb.).

### Aggregator'lar / alternatif gateway'ler

Anahtarlarınız etkinse şunlar üzerinden test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; tools+image yetenekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...`, Go için `opencode-go/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` ile auth)

Kimlik bilgileriniz/config'iniz varsa live matrikse dahil edebileceğiniz daha fazla sağlayıcı:

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` üzerinden (özel uç noktalar): `minimax` (bulut/API), artı herhangi bir OpenAI/Anthropic uyumlu proxy (LM Studio, vLLM, LiteLLM vb.)

İpucu: belgelerde “tüm modelleri” sabit kodlamaya çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar kullanılabiliyorsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Live testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçlar:

- CLI çalışıyorsa live testler aynı anahtarları bulmalıdır.
- Bir live test “kimlik bilgisi yok” diyorsa bunu `openclaw models list` / model seçimini ayıklayacağınız şekilde ayıklayın.

- Agent başına auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (live testlerde “profil anahtarları” denilen budur)
- Config: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanan live ana dizinine kopyalanır, ancak ana profil-anahtarı deposu değildir)
- Live yerel çalıştırmalar etkin config'i, agent başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI auth dizinlerini varsayılan olarak geçici bir test ana dizinine kopyalar; hazırlanan live ana dizinleri `workspace/` ve `sandboxes/` dizinlerini atlar ve probe'ların gerçek ana makine çalışma alanınıza gitmemesi için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları temizlenir.

Env anahtarlarına güvenmek istiyorsanız (örneğin `~/.profile` içinde export edilmişse), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram live (ses yazıya çevirme)

- Test: `extensions/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `extensions/byteplus/live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI iş akışı medya live

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy image, video ve `music_generate` yollarını çalıştırır
  - `models.providers.comfy.<capability>` yapılandırılmadıkça her yeteneği atlar
  - Comfy iş akışı gönderimi, polling, indirme veya Plugin kaydını değiştirdikten sonra yararlıdır

## Image generation live

- Test: `test/image-generation.runtime.live.test.ts`
- Komut: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her image-generation sağlayıcı Plugin'ini numaralandırır
  - Probe'dan önce eksik sağlayıcı env değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Stok image-generation varyantlarını paylaşılan çalışma zamanı yeteneği üzerinden çalıştırır:
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
  - Yalnızca profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Music generation live

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş music-generation sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax'ı kapsar
  - Probe'dan önce sağlayıcı env değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Kullanılabilir olduğunda her iki bildirilmiş çalışma zamanı modunu da çalıştırır:
    - prompt-only girdi ile `generate`
    - sağlayıcı `capabilities.edit.enabled` bildirirse `edit`
  - Geçerli paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy live dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı auth davranışı:
  - Yalnızca profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video generation live

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video-generation sağlayıcı yolunu çalıştırır
  - Yayına güvenli smoke yolunu varsayılan alır: FAL olmayan sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik ıstakoz prompt'u ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` içinden sağlayıcı başına işlem sınırı (varsayılan `180000`)
  - Yayın süresine sağlayıcı tarafı kuyruk gecikmesi baskın gelebileceği için varsayılan olarak FAL'ı atlar; bunu açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` geçin
  - Probe'dan önce sağlayıcı env değişkenlerini giriş kabuğunuzdan (`~/.profile`) yükler
  - Varsayılan olarak saklanan auth profillerinden önce live/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek kabuk kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/modeli olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Kullanılabilir olduğunda bildirilen dönüşüm modlarını da çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - Sağlayıcı `capabilities.imageToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel görsel girdisini kabul ediyorsa `imageToVideo`
    - Sağlayıcı `capabilities.videoToVideo.enabled` bildiriyorsa ve seçilen sağlayıcı/model paylaşılan taramada buffer destekli yerel video girdisini kabul ediyorsa `videoToVideo`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metindir ve paketlenmiş `kling` uzak bir görsel URL'si gerektirir
  - Sağlayıcıya özel Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak `veo3` text-to-video artı uzak görsel URL fixture'ı kullanan bir `kling` hattı çalıştırır
  - Geçerli `videoToVideo` live kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda bildirilmiş ama atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL'leri gerektiriyor
    - `google`, çünkü geçerli paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullanıyor ve bu yol paylaşılan taramada kabul edilmiyor
    - `openai`, çünkü geçerli paylaşılan hatta org'a özgü video inpaint/remix erişim garantileri yok
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramada FAL dahil her sağlayıcıyı dahil etmek için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için sağlayıcı başına işlem sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı auth davranışı:
  - Yalnızca profil deposu auth'unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya live harness

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan image, music ve video live paketlerini depo yerel tek bir giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` içinden otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir auth'a sahip sağlayıcılara otomatik daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz mod davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı “Linux'ta çalışıyor” denetimleri)

Bu Docker çalıştırıcıları iki kümeye ayrılır:

- Live-model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, eşleşen profile-key live dosyalarını yalnızca depo Docker imajı içinde çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel config dizininizi ve çalışma alanınızı bağlar (ve bağlanmışsa `~/.profile` dosyasını kaynaklar). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles`'tır.
- Docker live çalıştırıcıları varsayılan olarak daha küçük bir smoke üst sınırına sahiptir ki tam Docker taraması pratik kalsın:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12`,
  `test:docker:live-gateway` ise varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Özellikle daha büyük kapsamlı taramayı istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, live Docker imajını bir kez `test:docker:live-build` ile oluşturur, sonra bunu iki live Docker hattı için yeniden kullanır. Ayrıca `test:docker:e2e-build` ile tek bir paylaşılan `scripts/e2e/Dockerfile` imajı oluşturur ve derlenmiş uygulamayı çalıştıran E2E container smoke çalıştırıcıları için bunu yeniden kullanır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` ve `test:docker:config-reload`, bir veya daha fazla gerçek container başlatır ve daha üst seviye integration yollarını doğrular.

Live-model Docker çalıştırıcıları ayrıca yalnızca gereken CLI auth ana dizinlerini bağlar (veya çalıştırma daraltılmamışsa desteklenenlerin tümünü), sonra çalıştırmadan önce bunları container ana dizinine kopyalar; böylece harici-CLI OAuth, ana makine auth deposunu değiştirmeden token yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bağlama smoke testi: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI arka uç smoke testi: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke testi: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme agent'ı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke testi: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding sihirbazı (TTY, tam iskele): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke testi: `pnpm test:docker:npm-onboard-channel-agent`, paketlenmiş OpenClaw tarball'unu Docker içinde global kurar, env-ref onboarding artı varsayılan Telegram ile OpenAI yapılandırır, Plugin etkinleştirmenin çalışma zamanı bağımlılıklarını gerektiğinde kurduğunu doğrular, doctor çalıştırır ve mock bir OpenAI agent turu çalıştırır. Önceden derlenmiş bir tarball'u `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile yeniden kullanın, ana makine yeniden derlemesini `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ile atlayın veya kanalı `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` ile değiştirin.
- Gateway ağı (iki container, WS auth + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI Responses web_search minimal reasoning regresyonu: `pnpm test:docker:openai-web-search-minimal` (betik: `scripts/e2e/openai-web-search-minimal-docker.sh`) mock bir OpenAI sunucusunu Gateway üzerinden çalıştırır, `web_search`'ün `reasoning.effort` değerini `minimal`'den `low`'a yükselttiğini doğrular, sonra sağlayıcı şema reddini zorlar ve ham ayrıntının Gateway günlüklerinde göründüğünü denetler.
- MCP kanal köprüsü (tohumlanmış Gateway + stdio köprüsü + ham Claude bildirim-çerçevesi smoke testi): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Pi paket MCP tools'ları (gerçek stdio MCP sunucusu + gömülü Pi profil izin/verme reddetme smoke testi): `pnpm test:docker:pi-bundle-mcp-tools` (betik: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP temizliği (gerçek Gateway + yalıtılmış Cron ve tek seferlik subagent çalıştırmaları sonrası stdio MCP alt süreci kapatma): `pnpm test:docker:cron-mcp-cleanup` (betik: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (kurulum smoke testi + `/plugin` takma adı + Claude-paket yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)
- Plugin update unchanged smoke testi: `pnpm test:docker:plugin-update` (betik: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke testi: `pnpm test:docker:config-reload` (betik: `scripts/e2e/config-reload-source-docker.sh`)
- Paketlenmiş Plugin çalışma zamanı bağımlılıkları: `pnpm test:docker:bundled-channel-deps`, varsayılan olarak küçük bir Docker çalıştırıcı imajı oluşturur, OpenClaw'ı ana makinede bir kez derleyip paketler, sonra o tarball'u her Linux kurulum senaryosuna bağlar. İmajı `OPENCLAW_SKIP_DOCKER_BUILD=1` ile yeniden kullanın, yeni bir yerel derlemeden sonra ana makine yeniden derlemesini `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ile atlayın veya mevcut bir tarball'u `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` ile işaret edin.
- Yineleme yaparken ilişkisiz senaryoları devre dışı bırakarak paketlenmiş Plugin çalışma zamanı bağımlılıklarını daraltın, örneğin:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Paylaşılan derlenmiş uygulama imajını elle önceden oluşturup yeniden kullanmak için:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` gibi pakete özgü imaj geçersiz kılmaları ayarlıysa yine önceliklidir. `OPENCLAW_SKIP_DOCKER_BUILD=1`, uzak bir paylaşılan imaja işaret ettiğinde betikler imaj yerelde yoksa onu çeker. QR ve installer Docker testleri, paylaşılan derlenmiş-uygulama çalışma zamanını değil paket/kurulum davranışını doğruladıkları için kendi Dockerfile'larını korur.

Live-model Docker çalıştırıcıları ayrıca geçerli checkout'u salt okunur bağlar ve
onu container içinde geçici bir workdir'e hazırlar. Bu, çalışma zamanı
imajını ince tutarken yine de Vitest'i tam yerel kaynak/config'inize karşı çalıştırır.
Hazırlama adımı `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya özgü `.build` veya
Gradle çıktı dizinleri gibi büyük yerel-only önbellekleri ve uygulama derleme çıktılarını atlar; böylece Docker live çalıştırmaları
makineye özgü artifact'ları kopyalamaya dakikalar harcamaz.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlarlar; böylece gateway live probe'ları
container içinde gerçek Telegram/Discord vb. kanal worker'larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle
o Docker hattındaki gateway
live kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de geçirin.
`test:docker:openwebui`, daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkin bir
OpenClaw gateway container'ı başlatır,
o gateway'e karşı sabitlenmiş bir Open WebUI container'ı başlatır, Open WebUI üzerinden oturum açar,
`/api/models` uç noktasının `openclaw/default` sunduğunu doğrular, ardından
Open WebUI'nin `/api/chat/completions` proxy'si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin biçimde daha yavaş olabilir çünkü Docker'ın
Open WebUI imajını çekmesi gerekebilir ve Open WebUI'nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir live model anahtarı bekler ve Docker'lı çalıştırmalarda bunu sağlamak için
birincil yol `OPENCLAW_PROFILE_FILE`
(varsayılan `~/.profile`) değişkenidir.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON payload yazar.
`test:docker:mcp-channels` kasıtlı olarak deterministiktir ve
gerçek bir Telegram, Discord veya iMessage hesabına ihtiyaç duymaz. Tohumlanmış bir Gateway
container'ı başlatır, `openclaw mcp serve` oluşturan ikinci bir container başlatır, ardından
yönlendirilmiş konuşma keşfini, transkript okumalarını, ek meta verisini,
canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal +
izin bildirimlerini doğrular. Bildirim denetimi
ham stdio MCP çerçevelerini doğrudan inceler; böylece smoke testi yalnızca belirli bir istemci SDK'sının ne sunduğunu değil,
köprünün gerçekte ne yaydığını doğrular.
`test:docker:pi-bundle-mcp-tools` deterministiktir ve canlı bir
model anahtarına ihtiyaç duymaz. Repo Docker imajını oluşturur, container içinde gerçek bir stdio MCP probe sunucusu başlatır,
o sunucuyu gömülü Pi paket MCP çalışma zamanı üzerinden somutlaştırır,
tool'u çalıştırır, sonra `coding` ve `messaging` yapılandırmalarının
`bundle-mcp` tools'larını koruduğunu, `minimal` ve `tools.deny: ["bundle-mcp"]` yapılandırmalarının ise bunları filtrelediğini doğrular.
`test:docker:cron-mcp-cleanup` deterministiktir ve canlı bir modele
ihtiyaç duymaz. Gerçek bir stdio MCP probe sunucusuna sahip tohumlanmış bir Gateway başlatır, yalıtılmış bir
Cron turu ve bir `/subagents spawn` tek seferlik alt süreç turu çalıştırır, ardından
MCP alt sürecinin her çalıştırmadan sonra çıktığını doğrular.

Elle ACP düz dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için koruyun. ACP thread yönlendirme doğrulaması için yine gerekebilir, bu yüzden silmeyin.

Yararlı env değişkenleri:

- `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`), `/home/node/.openclaw` dizinine bağlanır
- `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`), `/home/node/.openclaw/workspace` dizinine bağlanır
- `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`), `/home/node/.profile` dizinine bağlanır ve testler çalışmadan önce kaynaklanır
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, yalnızca `OPENCLAW_PROFILE_FILE` içinden kaynaklanan env değişkenlerini doğrulamak için; geçici config/workspace dizinleri ve harici CLI auth bağları olmadan kullanılır
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`), Docker içinde önbelleğe alınmış CLI kurulumları için `/home/node/.npm-global` dizinine bağlanır
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur bağlanır, sonra testler başlamadan önce `/home/node/...` altına kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` içinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - Elle geçersiz kılmak için `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgüllü liste kullanın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içinde sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerekmeyen yeniden çalıştırmalarda mevcut `openclaw:local-live` imajını yeniden kullanmak için `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env'den değil profil deposundan geldiğinden emin olmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway'in sunduğu modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testinde kullanılan nonce denetim prompt'unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI imaj etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Belgeler için sağduyu denetimi

Belge düzenlemelerinden sonra docs denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimleri de gerektiğinde tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI-güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek hat” regresyonlarıdır:

- Gateway tool calling (mock OpenAI, gerçek gateway + agent döngüsü): `src/gateway/gateway.test.ts` (olgu: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config + auth yazımı zorunlu): `src/gateway/gateway.test.ts` (olgu: "runs wizard over ws and writes auth token config")

## Agent güvenilirlik değerlendirmeleri (Skills)

Zaten “agent güvenilirlik değerlendirmeleri” gibi davranan birkaç CI-güvenli testimiz var:

- Gerçek gateway + agent döngüsü üzerinden mock tool-calling (`src/gateway/gateway.test.ts`).
- Oturum bağlantısını ve config etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar ([Skills](/tr/tools/skills) sayfasına bakın):

- **Karar verme:** Skills prompt içinde listelendiğinde agent doğru Skill'i seçiyor mu (veya alakasız olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** tool sırasını, oturum geçmişi taşınmasını ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Tool çağrılarını + sırasını, Skill dosya okumalarını ve oturum bağlantısını doğrulamak için mock sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullanma vs kaçınma, geçitleme, prompt injection).
- İsteğe bağlı live değerlendirmeler (env ile kapılanmış) ancak CI-güvenli paket yerleştirildikten sonra.

## Sözleşme testleri (Plugin ve kanal şekli)

Sözleşme testleri her kayıtlı Plugin ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin'ler üzerinde yinelenir ve bir
şekil ile davranış doğrulama paketi çalıştırırlar. Varsayılan `pnpm test` unit hattı
kasıtlı olarak bu paylaşılan seam ve smoke dosyalarını atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça
çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, name, capabilities)
- **setup** - Kurulum sihirbazı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Thread ID işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup ilkesi uygulama

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum probe'ları
- **registry** - Plugin kayıt defteri şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akışı sözleşmesi
- **auth-choice** - Auth seçimi/seçim davranışı
- **catalog** - Model katalog API'si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı çalışma zamanı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum sihirbazı

### Ne zaman çalıştırılmalı

- Plugin-sdk dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin'i ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI içinde çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehberlik)

Live ortamda keşfettiğiniz bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI-güvenli bir regresyon ekleyin (mock/stub sağlayıcı veya tam istek-şekli dönüşümünü yakalama)
- Sorun doğası gereği yalnızca live ise (hız sınırları, auth ilkeleri), live testi dar ve env değişkenleriyle isteğe bağlı tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüşümü/replay hatası → doğrudan model testi
  - gateway oturum/geçmiş/tool hattı hatası → gateway live smoke testi veya CI-güvenli gateway mock testi
- SecretRef geçiş koruması:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt defteri meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, sonra geçiş-segmenti exec kimliklerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içine yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, o testte `classifyTargetClass` güncelleyin. Yeni sınıflar sessizce atlanamasın diye test, sınıflandırılmamış hedef kimliklerinde kasıtlı olarak başarısız olur.
