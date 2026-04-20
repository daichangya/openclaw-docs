---
read_when:
    - Testleri yerelde veya CI’da çalıştırma
    - Model/sağlayıcı hataları için regresyonlar ekleme
    - Gateway + agent davranışında hata ayıklama
summary: 'Test kiti: unit/e2e/canlı paketler, Docker çalıştırıcıları ve her testin neleri kapsadığı'
title: Test etme
x-i18n:
    generated_at: "2026-04-20T09:03:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88457038e2e2c7940d0348762d0ece187111a8c61fa9bad54b39eade4217ddbc
    source_path: help/testing.md
    workflow: 15
---

# Test etme

OpenClaw üç Vitest paketine (unit/integration, e2e, canlı) ve küçük bir Docker çalıştırıcıları kümesine sahiptir.

Bu belge bir “nasıl test ediyoruz” kılavuzudur:

- Her paketin neleri kapsadığı (ve özellikle neleri kapsamadığı)
- Yaygın iş akışları için hangi komutların çalıştırılacağı (yerel, push öncesi, hata ayıklama)
- Canlı testlerin kimlik bilgilerini nasıl bulduğu ve model/sağlayıcıları nasıl seçtiği
- Gerçek dünya model/sağlayıcı sorunları için regresyonların nasıl ekleneceği

## Hızlı başlangıç

Çoğu gün:

- Tam kapı (push öncesinde beklenir): `pnpm build && pnpm check && pnpm test`
- Geniş kaynaklı bir makinede daha hızlı yerel tam paket çalıştırması: `pnpm test:max`
- Doğrudan Vitest izleme döngüsü: `pnpm test:watch`
- Doğrudan dosya hedefleme artık extension/channel yollarını da yönlendirir: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Tek bir hata üzerinde yineleme yapıyorsanız önce hedefli çalıştırmaları tercih edin.
- Docker destekli QA sitesi: `pnpm qa:lab:up`
- Linux VM destekli QA hattı: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Testlere dokunduğunuzda veya ek güven istediğinizde:

- Kapsama kapısı: `pnpm test:coverage`
- E2E paketi: `pnpm test:e2e`

Gerçek sağlayıcıları/modelleri hata ayıklarken (gerçek kimlik bilgileri gerekir):

- Canlı paket (modeller + gateway araç/görüntü yoklamaları): `pnpm test:live`
- Tek bir canlı dosyayı sessizce hedefleyin: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

İpucu: yalnızca tek bir başarısız duruma ihtiyacınız olduğunda, aşağıda açıklanan izin listesi ortam değişkenleriyle canlı testleri daraltmayı tercih edin.

## QA’ye özel çalıştırıcılar

QA-lab gerçekçiliğine ihtiyaç duyduğunuzda bu komutlar ana test paketlerinin yanında yer alır:

- `pnpm openclaw qa suite`
  - Depo destekli QA senaryolarını doğrudan ana makinede çalıştırır.
  - Varsayılan olarak izole gateway worker’ları ile birden çok seçili senaryoyu paralel çalıştırır. `qa-channel` varsayılan olarak eşzamanlılık 4 kullanır (seçilen senaryo sayısıyla sınırlıdır). Worker sayısını ayarlamak için `--concurrency <count>`, eski seri hat için ise `--concurrency 1` kullanın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız bir çıkış kodu olmadan artifact almak istiyorsanız `--allow-failures` kullanın.
  - `live-frontier`, `mock-openai` ve `aimock` sağlayıcı kiplerini destekler.
    `aimock`, senaryo farkında `mock-openai` hattının yerini almadan deneysel fixture ve protokol sahte kapsamı için yerel AIMock destekli bir sağlayıcı sunucusu başlatır.
- `pnpm openclaw qa suite --runner multipass`
  - Aynı QA paketini tek kullanımlık bir Multipass Linux VM içinde çalıştırır.
  - Ana makinedeki `qa suite` ile aynı senaryo seçim davranışını korur.
  - `qa suite` ile aynı sağlayıcı/model seçim bayraklarını yeniden kullanır.
  - Canlı çalıştırmalar, misafir için pratik olan desteklenen QA kimlik doğrulama girdilerini iletir:
    ortam tabanlı sağlayıcı anahtarları, QA canlı sağlayıcı yapılandırma yolu ve varsa `CODEX_HOME`.
  - Çıktı dizinleri depo kökünün altında kalmalıdır ki misafir, bağlı çalışma alanı üzerinden geri yazabilsin.
  - Normal QA raporu + özetin yanı sıra Multipass günlüklerini `.artifacts/qa-e2e/...` altına yazar.
- `pnpm qa:lab:up`
  - Operatör tarzı QA çalışmaları için Docker destekli QA sitesini başlatır.
- `pnpm openclaw qa aimock`
  - Doğrudan protokol smoke testi için yalnızca yerel AIMock sağlayıcı sunucusunu başlatır.
- `pnpm openclaw qa matrix`
  - Matrix canlı QA hattını, Docker destekli tek kullanımlık bir Tuwunel homeserver’a karşı çalıştırır.
  - Bu QA ana makinesi şu anda yalnızca depo/geliştirme içindir. Paketlenmiş OpenClaw kurulumları `qa-lab` göndermez; bu nedenle `openclaw qa` sunmazlar.
  - Depo checkout’ları paketlenmiş çalıştırıcıyı doğrudan yükler; ayrı bir Plugin kurulum adımı gerekmez.
  - Üç geçici Matrix kullanıcısı (`driver`, `sut`, `observer`) ve bir özel oda sağlar, ardından gerçek Matrix Plugin ile SUT taşıması olarak bir QA gateway alt süreci başlatır.
  - Varsayılan olarak sabitlenmiş kararlı Tuwunel görüntüsü `ghcr.io/matrix-construct/tuwunel:v1.5.1` kullanılır. Farklı bir görüntüyü test etmeniz gerektiğinde `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ile geçersiz kılın.
  - Matrix, paylaşılan kimlik bilgisi kaynağı bayraklarını sunmaz çünkü bu hat tek kullanımlık kullanıcıları yerelde sağlar.
  - Matrix QA raporu, özet, gözlemlenen olaylar artifact’i ve birleştirilmiş stdout/stderr çıktı günlüğünü `.artifacts/qa-e2e/...` altına yazar.
- `pnpm openclaw qa telegram`
  - Telegram canlı QA hattını, ortamdaki driver ve SUT bot token’larını kullanarak gerçek bir özel gruba karşı çalıştırır.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` ve `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` gerektirir. Grup kimliği sayısal Telegram sohbet kimliği olmalıdır.
  - Paylaşılan havuzlanmış kimlik bilgileri için `--credential-source convex` destekler. Varsayılan olarak env kipini kullanın veya havuzlanmış kiralamaları seçmek için `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` ayarlayın.
  - Herhangi bir senaryo başarısız olduğunda sıfır olmayan kodla çıkar. Başarısız bir çıkış kodu olmadan artifact almak istiyorsanız `--allow-failures` kullanın.
  - Aynı özel grupta iki farklı bot gerekir ve SUT botunun bir Telegram kullanıcı adını göstermesi gerekir.
  - Kararlı botlar arası gözlem için, `@BotFather` içinde her iki bot için de Bot-to-Bot Communication Mode’u etkinleştirin ve driver botunun grup bot trafiğini gözlemleyebildiğinden emin olun.
  - Telegram QA raporu, özet ve gözlemlenen mesajlar artifact’ini `.artifacts/qa-e2e/...` altına yazar.

Canlı taşıma hatları tek bir standart sözleşmeyi paylaşır; böylece yeni taşımalar sapma göstermez:

`qa-channel` geniş sentetik QA paketi olarak kalır ve canlı taşıma kapsam matrisi içinde yer almaz.

| Hat | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)

`openclaw qa telegram` için `--credential-source convex` (veya `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) etkinleştirildiğinde, QA lab Convex destekli bir havuzdan özel bir kiralama alır, hat çalışırken bu kiralamaya Heartbeat gönderir ve kapanışta kiralamayı serbest bırakır.

Başvuru Convex proje iskeleti:

- `qa/convex-credential-broker/`

Gerekli ortam değişkenleri:

- `OPENCLAW_QA_CONVEX_SITE_URL` (örneğin `https://your-deployment.convex.site`)
- Seçilen rol için bir gizli anahtar:
  - `maintainer` için `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` için `OPENCLAW_QA_CONVEX_SECRET_CI`
- Kimlik bilgisi rolü seçimi:
  - CLI: `--credential-role maintainer|ci`
  - Ortam varsayılanı: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI’da varsayılan `ci`, aksi halde `maintainer`)

İsteğe bağlı ortam değişkenleri:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (varsayılan `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (varsayılan `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (varsayılan `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (varsayılan `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (varsayılan `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (isteğe bağlı iz kimliği)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1`, yalnızca yerel geliştirme için loopback `http://` Convex URL’lerine izin verir.

`OPENCLAW_QA_CONVEX_SITE_URL`, normal çalışmada `https://` kullanmalıdır.

Maintainer yönetici komutları (havuz ekle/kaldır/listele) özellikle
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
- `groupId`, sayısal bir Telegram sohbet kimliği dizesi olmalıdır.
- `admin/add`, `kind: "telegram"` için bu şekli doğrular ve hatalı biçimlendirilmiş yükleri reddeder.

### QA’ye bir kanal ekleme

Markdown QA sistemine bir kanal eklemek tam olarak iki şey gerektirir:

1. Kanal için bir taşıma bağdaştırıcısı.
2. Kanal sözleşmesini çalıştıran bir senaryo paketi.

Paylaşılan `qa-lab` ana makinesi akışı sahiplenebiliyorsa, yeni bir üst düzey QA komut kökü eklemeyin.

`qa-lab`, paylaşılan ana makine mekaniklerinin sahibidir:

- `openclaw qa` komut kökü
- paket başlatma ve kapatma
- worker eşzamanlılığı
- artifact yazımı
- rapor oluşturma
- senaryo yürütme
- eski `qa-channel` senaryoları için uyumluluk takma adları

Çalıştırıcı Plugin’ler taşıma sözleşmesinin sahibidir:

- `openclaw qa <runner>` öğesinin paylaşılan `qa` kökü altına nasıl bağlandığı
- gateway’in bu taşıma için nasıl yapılandırıldığı
- hazır oluşun nasıl denetlendiği
- gelen olayların nasıl enjekte edildiği
- giden mesajların nasıl gözlemlendiği
- transcript’lerin ve normalize edilmiş taşıma durumunun nasıl sunulduğu
- taşıma destekli eylemlerin nasıl yürütüldüğü
- taşımaya özgü sıfırlama veya temizliğin nasıl ele alındığı

Yeni bir kanal için asgari benimseme çıtası şudur:

1. Paylaşılan `qa` kökünün sahibi olarak `qa-lab`’ı koruyun.
2. Taşıma çalıştırıcısını paylaşılan `qa-lab` ana makine dikişinde uygulayın.
3. Taşımaya özgü mekanikleri çalıştırıcı Plugin veya kanal harness’i içinde tutun.
4. Çalıştırıcıyı rakip bir kök komut kaydetmek yerine `openclaw qa <runner>` olarak bağlayın.
   Çalıştırıcı Plugin’ler `openclaw.plugin.json` içinde `qaRunners` bildirmeli ve `runtime-api.ts` içinden eşleşen bir `qaRunnerCliRegistrations` dizisi dışa aktarmalıdır.
   `runtime-api.ts` dosyasını hafif tutun; tembel CLI ve çalıştırıcı yürütmesi ayrı giriş noktalarının arkasında kalmalıdır.
5. Temalı `qa/scenarios/` dizinleri altında markdown senaryoları yazın veya uyarlayın.
6. Yeni senaryolar için genel senaryo yardımcılarını kullanın.
7. Depo kasıtlı bir geçiş yapmıyorsa mevcut uyumluluk takma adlarını çalışır halde tutun.

Karar kuralı kesindir:

- Davranış `qa-lab` içinde bir kez ifade edilebiliyorsa, onu `qa-lab` içine koyun.
- Davranış tek bir kanal taşımasına bağlıysa, onu o çalıştırıcı Plugin veya Plugin harness’i içinde tutun.
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

Mevcut senaryolar için uyumluluk takma adları kullanılabilir olmaya devam eder, şunlar dahil:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Yeni kanal çalışmaları genel yardımcı adlarını kullanmalıdır.
Uyumluluk takma adları, tek seferlik bir geçişi önlemek için vardır; yeni senaryo yazımı için model olarak değil.

## Test paketleri (ne nerede çalışır)

Paketleri “artan gerçekçilik” (ve artan kararsızlık/maliyet) olarak düşünün:

### Unit / integration (varsayılan)

- Komut: `pnpm test`
- Yapılandırma: mevcut kapsamlı Vitest projeleri üzerinde on sıralı shard çalıştırması (`vitest.full-*.config.ts`)
- Dosyalar: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` altındaki core/unit envanterleri ve `vitest.unit.config.ts` tarafından kapsanan izinli `ui` node testleri
- Kapsam:
  - Saf unit testleri
  - Süreç içi integration testleri (gateway auth, yönlendirme, araçlar, ayrıştırma, yapılandırma)
  - Bilinen hatalar için deterministik regresyonlar
- Beklentiler:
  - CI’da çalışır
  - Gerçek anahtarlar gerekmez
  - Hızlı ve kararlı olmalıdır
- Projeler notu:
  - Hedeflenmemiş `pnpm test` artık tek bir devasa yerel root-project süreci yerine on bir daha küçük shard yapılandırması (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) çalıştırır. Bu, yüklü makinelerde tepe RSS değerini azaltır ve auto-reply/extension işlerinin ilgisiz paketleri aç bırakmasını önler.
  - `pnpm test --watch` hâlâ yerel root `vitest.config.ts` proje grafiğini kullanır, çünkü çok parçalı bir watch döngüsü pratik değildir.
  - `pnpm test`, `pnpm test:watch` ve `pnpm test:perf:imports`, açık dosya/dizin hedeflerini önce kapsamlı hatlar üzerinden yönlendirir; böylece `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tam root proje başlatma maliyetini ödemez.
  - `pnpm test:changed`, fark yalnızca yönlendirilebilir kaynak/test dosyalarına dokunuyorsa değişen git yollarını aynı kapsamlı hatlara genişletir; config/setup düzenlemeleri yine geniş root-project yeniden çalıştırmasına geri döner.
  - Agent’lar, komutlar, plugin’ler, auto-reply yardımcıları, `plugin-sdk` ve benzeri saf yardımcı alanlardan import’u hafif unit testleri `test/setup-openclaw-runtime.ts` dosyasını atlayan `unit-fast` hattı üzerinden yönlendirilir; durum bilgili/runtime-ağır dosyalar mevcut hatlarda kalır.
  - Seçili `plugin-sdk` ve `commands` yardımcı kaynak dosyaları da changed-mode çalıştırmalarını bu hafif hatlardaki açık kardeş testlere eşler; böylece yardımcı düzenlemeleri o dizin için tam ağır paketi yeniden çalıştırmaktan kaçınır.
  - `auto-reply` artık üç ayrı kovaya sahiptir: üst düzey core yardımcıları, üst düzey `reply.*` integration testleri ve `src/auto-reply/reply/**` alt ağacı. Bu, en ağır reply harness işini ucuz status/chunk/token testlerinden uzak tutar.
- Embedded runner notu:
  - Mesaj-aracı keşif girdilerini veya Compaction runtime bağlamını değiştirdiğinizde kapsamanın her iki düzeyini de koruyun.
  - Saf yönlendirme/normalleştirme sınırları için odaklı yardımcı regresyonlar ekleyin.
  - Ayrıca embedded runner integration paketlerini de sağlıklı tutun:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` ve
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Bu paketler, kapsamlı kimliklerin ve Compaction davranışının hâlâ gerçek `run.ts` / `compact.ts` yollarından aktığını doğrular; yalnızca yardımcı testleri bu integration yolları için yeterli bir ikame değildir.
- Havuz notu:
  - Temel Vitest yapılandırması artık varsayılan olarak `threads` kullanır.
  - Paylaşılan Vitest yapılandırması ayrıca `isolate: false` ayarlar ve root projeler, e2e ve canlı yapılandırmalar boyunca izole olmayan çalıştırıcıyı kullanır.
  - Root UI hattı `jsdom` kurulumunu ve optimizer’ını korur, ancak artık o da paylaşılan izole olmayan çalıştırıcı üzerinde çalışır.
  - Her `pnpm test` shard’ı paylaşılan Vitest yapılandırmasından aynı `threads` + `isolate: false` varsayılanlarını devralır.
  - Paylaşılan `scripts/run-vitest.mjs` başlatıcısı artık büyük yerel çalıştırmalarda V8 derleme karmaşasını azaltmak için Vitest alt Node süreçlerine varsayılan olarak `--no-maglev` da ekler. Varsayılan V8 davranışıyla karşılaştırmak istiyorsanız `OPENCLAW_VITEST_ENABLE_MAGLEV=1` ayarlayın.
- Hızlı yerel yineleme notu:
  - `pnpm test:changed`, değişen yollar daha küçük bir pakete temiz biçimde eşleniyorsa kapsamlı hatlar üzerinden yönlendirilir.
  - `pnpm test:max` ve `pnpm test:changed:max` aynı yönlendirme davranışını korur; sadece daha yüksek bir worker sınırıyla.
  - Yerel worker otomatik ölçeklendirmesi artık bilerek daha muhafazakâr ve ana makine load average zaten yüksek olduğunda da geri çekilir; böylece birden çok eşzamanlı Vitest çalıştırması varsayılan olarak daha az zarar verir.
  - Temel Vitest yapılandırması proje/config dosyalarını `forceRerunTriggers` olarak işaretler; böylece changed-mode yeniden çalıştırmaları test kablolaması değiştiğinde doğru kalır.
  - Yapılandırma, desteklenen ana makinelerde `OPENCLAW_VITEST_FS_MODULE_CACHE` seçeneğini etkin tutar; doğrudan profilleme için tek bir açık önbellek konumu istiyorsanız `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` ayarlayın.
- Performans hata ayıklama notu:
  - `pnpm test:perf:imports`, Vitest import süresi raporlamasını ve import döküm çıktısını etkinleştirir.
  - `pnpm test:perf:imports:changed`, aynı profilleme görünümünü `origin/main` sonrasındaki değişen dosyalarla sınırlar.
- `pnpm test:perf:changed:bench -- --ref <git-ref>`, o commit edilmiş fark için yönlendirilmiş `test:changed` ile yerel root-project yolunu karşılaştırır ve duvar saati süresini artı macOS max RSS’yi yazdırır.
- `pnpm test:perf:changed:bench -- --worktree`, değişen dosya listesini `scripts/test-projects.mjs` ve root Vitest yapılandırması üzerinden yönlendirerek mevcut kirli ağacı kıyaslar.
  - `pnpm test:perf:profile:main`, Vitest/Vite başlatma ve transform yükü için bir ana iş parçacığı CPU profili yazar.
  - `pnpm test:perf:profile:runner`, unit paketi için dosya paralelliği devre dışı bırakılmış halde runner CPU+heap profilleri yazar.

### E2E (gateway smoke)

- Komut: `pnpm test:e2e`
- Yapılandırma: `vitest.e2e.config.ts`
- Dosyalar: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Runtime varsayılanları:
  - Deponun geri kalanıyla eşleşecek şekilde Vitest `threads` ve `isolate: false` kullanır.
  - Uyarlanabilir worker’lar kullanır (CI: en fazla 2, yerel: varsayılan 1).
  - Konsol G/Ç yükünü azaltmak için varsayılan olarak sessiz kipte çalışır.
- Yararlı geçersiz kılmalar:
  - Worker sayısını zorlamak için `OPENCLAW_E2E_WORKERS=<n>` (üst sınır 16).
  - Ayrıntılı konsol çıktısını yeniden etkinleştirmek için `OPENCLAW_E2E_VERBOSE=1`.
- Kapsam:
  - Çok örnekli gateway uçtan uca davranışı
  - WebSocket/HTTP yüzeyleri, node eşleştirmesi ve daha ağır ağ iletişimi
- Beklentiler:
  - CI’da çalışır (boru hattında etkinleştirildiğinde)
  - Gerçek anahtarlar gerekmez
  - Unit testlerinden daha fazla hareketli parça vardır (daha yavaş olabilir)

### E2E: OpenShell backend smoke

- Komut: `pnpm test:e2e:openshell`
- Dosya: `test/openshell-sandbox.e2e.test.ts`
- Kapsam:
  - Ana makinede Docker üzerinden izole bir OpenShell gateway başlatır
  - Geçici bir yerel Dockerfile’dan sandbox oluşturur
  - Gerçek `sandbox ssh-config` + SSH exec üzerinden OpenClaw’ın OpenShell backend’ini çalıştırır
  - Sandbox fs bridge üzerinden uzak-canonical dosya sistemi davranışını doğrular
- Beklentiler:
  - Yalnızca isteğe bağlıdır; varsayılan `pnpm test:e2e` çalıştırmasının parçası değildir
  - Yerel bir `openshell` CLI ve çalışan bir Docker daemon gerektirir
  - İzole `HOME` / `XDG_CONFIG_HOME` kullanır, ardından test gateway ve sandbox’ını yok eder
- Yararlı geçersiz kılmalar:
  - Daha geniş e2e paketini elle çalıştırırken testi etkinleştirmek için `OPENCLAW_E2E_OPENSHELL=1`
  - Varsayılan olmayan bir CLI ikili dosyası veya wrapper betiğine işaret etmek için `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Canlı (gerçek sağlayıcılar + gerçek modeller)

- Komut: `pnpm test:live`
- Yapılandırma: `vitest.live.config.ts`
- Dosyalar: `src/**/*.live.test.ts`
- Varsayılan: `pnpm test:live` tarafından **etkinleştirilir** (`OPENCLAW_LIVE_TEST=1` ayarlar)
- Kapsam:
  - “Bu sağlayıcı/model bugün gerçekten gerçek kimlik bilgileriyle çalışıyor mu?”
  - Sağlayıcı biçim değişikliklerini, araç çağırma tuhaflıklarını, auth sorunlarını ve rate limit davranışını yakalar
- Beklentiler:
  - Tasarım gereği CI-kararlı değildir (gerçek ağlar, gerçek sağlayıcı ilkeleri, kotalar, kesintiler)
  - Para harcar / rate limit kullanır
  - “Hepsi” yerine daraltılmış alt kümeleri çalıştırmak tercih edilir
- Canlı çalıştırmalar eksik API anahtarlarını almak için `~/.profile` kaynağını kullanır.
- Varsayılan olarak canlı çalıştırmalar yine de `HOME` dizinini izole eder ve config/auth materyalini geçici bir test home dizinine kopyalar; böylece unit fixture’ları gerçek `~/.openclaw` dizininizi değiştiremez.
- Canlı testlerin gerçek home dizininizi kullanmasını özellikle istiyorsanız yalnızca `OPENCLAW_LIVE_USE_REAL_HOME=1` ayarlayın.
- `pnpm test:live` artık varsayılan olarak daha sessiz bir kip kullanır: `[live] ...` ilerleme çıktısını korur, ancak ek `~/.profile` bildirimini bastırır ve gateway bootstrap günlükleri/Bonjour gürültüsünü susturur. Tam başlangıç günlüklerini geri istiyorsanız `OPENCLAW_LIVE_TEST_QUIET=0` ayarlayın.
- API anahtarı rotasyonu (sağlayıcıya özgü): virgül/noktalı virgül biçiminde `*_API_KEYS` veya `*_API_KEY_1`, `*_API_KEY_2` ayarlayın (örneğin `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ya da canlıya özel geçersiz kılma için `OPENCLAW_LIVE_*_KEY`; testler rate limit yanıtlarında yeniden dener.
- İlerleme/Heartbeat çıktısı:
  - Canlı paketler artık uzun sağlayıcı çağrıları, Vitest konsol yakalaması sessiz olsa bile görünür biçimde etkin olsun diye stderr’e ilerleme satırları yazar.
  - `vitest.live.config.ts`, sağlayıcı/gateway ilerleme satırlarının canlı çalıştırmalar sırasında anında akması için Vitest konsol müdahalesini devre dışı bırakır.
  - Doğrudan model Heartbeat’lerini `OPENCLAW_LIVE_HEARTBEAT_MS` ile ayarlayın.
  - Gateway/yoklama Heartbeat’lerini `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ile ayarlayın.

## Hangi paketi çalıştırmalıyım?

Bu karar tablosunu kullanın:

- Mantık/test düzenliyorsanız: `pnpm test` çalıştırın (çok değişiklik yaptıysanız `pnpm test:coverage` da)
- Gateway ağ iletişimi / WS protokolü / eşleştirmeye dokunuyorsanız: `pnpm test:e2e` ekleyin
- “Botum çalışmıyor” / sağlayıcıya özgü arızalar / araç çağırma sorunlarında hata ayıklıyorsanız: daraltılmış bir `pnpm test:live` çalıştırın

## Canlı: Android node yetenek taraması

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Betik: `pnpm android:test:integration`
- Amaç: bağlı bir Android node tarafından şu anda duyurulan **her komutu** çağırmak ve komut sözleşmesi davranışını doğrulamak.
- Kapsam:
  - Ön koşullu/elle kurulum (paket uygulamayı kurmaz/çalıştırmaz/eşleştirmez).
  - Seçilen Android node için komut komut gateway `node.invoke` doğrulaması.
- Gerekli ön kurulum:
  - Android uygulaması zaten gateway’e bağlanmış ve eşleştirilmiş olmalı.
  - Uygulama ön planda tutulmalı.
  - Başarılı olmasını beklediğiniz yetenekler için izinler/yakalama onayı verilmiş olmalı.
- İsteğe bağlı hedef geçersiz kılmaları:
  - `OPENCLAW_ANDROID_NODE_ID` veya `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Tüm Android kurulum ayrıntıları: [Android App](/tr/platforms/android)

## Canlı: model smoke (profil anahtarları)

Canlı testler, arızaları izole edebilmek için iki katmana ayrılmıştır:

- “Doğrudan model”, verilen anahtarla sağlayıcının/modelin en azından yanıt verebildiğini söyler.
- “Gateway smoke”, tam gateway+agent işlem hattının o model için çalıştığını söyler (oturumlar, geçmiş, araçlar, sandbox ilkesi vb.).

### Katman 1: Doğrudan model completion (gateway yok)

- Test: `src/agents/models.profiles.live.test.ts`
- Amaç:
  - Keşfedilen modelleri numaralandırmak
  - Kimlik bilgilerinizin olduğu modelleri seçmek için `getApiKeyForModel` kullanmak
  - Model başına küçük bir completion çalıştırmak (ve gerektiğinde hedefli regresyonlar)
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Bu paketi gerçekten çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (veya `all`, `modern` için takma ad) ayarlayın; aksi halde `pnpm test:live` komutunu gateway smoke üzerinde odaklı tutmak için atlanır
- Modeller nasıl seçilir:
  - Modern izin listesini çalıştırmak için `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all`, modern izin listesi için bir takma addır
  - veya `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (virgülle ayrılmış izin listesi)
  - Modern/tüm taramalar varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (virgülle ayrılmış izin listesi)
- Anahtarlar nereden gelir:
  - Varsayılan olarak: profil deposu ve env yedekleri
  - Yalnızca **profil deposunu** zorunlu kılmak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` ayarlayın
- Bunun var olma nedeni:
  - “Sağlayıcı API bozuk / anahtar geçersiz” ile “gateway agent işlem hattı bozuk” durumlarını ayırır
  - Küçük, izole regresyonlar içerir (örnek: OpenAI Responses/Codex Responses reasoning replay + tool-call akışları)

### Katman 2: Gateway + geliştirme agent smoke (`"@openclaw"` gerçekte ne yapar)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Amaç:
  - Süreç içi bir gateway başlatmak
  - Bir `agent:dev:*` oturumu oluşturmak/yamalamak (çalıştırma başına model geçersiz kılma)
  - Anahtarlı modeller üzerinde dönmek ve şunları doğrulamak:
    - “anlamlı” yanıt (araç yok)
    - gerçek bir araç çağrısının çalışması (`read` probe)
    - isteğe bağlı ek araç probe’ları (`exec+read` probe)
    - OpenAI regresyon yollarının (yalnızca tool-call → takip) çalışmaya devam etmesi
- Probe ayrıntıları (böylece hataları hızlıca açıklayabilirsiniz):
  - `read` probe: test çalışma alanına bir nonce dosyası yazar ve agent’tan bunu `read` ile okuyup nonce’u geri yankılamasını ister.
  - `exec+read` probe: test agent’tan bir nonce’u geçici bir dosyaya `exec` ile yazmasını, sonra da `read` ile geri okumasını ister.
  - image probe: test oluşturulmuş bir PNG (kedi + rastgele kod) ekler ve modelin `cat <CODE>` döndürmesini bekler.
  - Uygulama başvurusu: `src/gateway/gateway-models.profiles.live.test.ts` ve `src/gateway/live-image-probe.ts`.
- Nasıl etkinleştirilir:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
- Modeller nasıl seçilir:
  - Varsayılan: modern izin listesi (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`, modern izin listesi için bir takma addır
  - Ya da daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (veya virgülle ayrılmış liste) ayarlayın
  - Modern/tüm gateway taramaları varsayılan olarak özenle seçilmiş yüksek sinyalli bir üst sınır kullanır; kapsamlı bir modern tarama için `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, daha küçük bir üst sınır için pozitif bir sayı ayarlayın.
- Sağlayıcılar nasıl seçilir (“OpenRouter her şey” yaklaşımından kaçının):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (virgülle ayrılmış izin listesi)
- Araç + image probe’ları bu canlı testte her zaman açıktır:
  - `read` probe + `exec+read` probe (araç yük testi)
  - model image girişi desteği duyuruyorsa image probe çalışır
  - Akış (üst düzey):
    - Test, “CAT” + rastgele kod içeren küçük bir PNG üretir (`src/gateway/live-image-probe.ts`)
    - Bunu `agent` üzerinden `attachments: [{ mimeType: "image/png", content: "<base64>" }]` ile gönderir
    - Gateway ekleri `images[]` içine ayrıştırır (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent modele çok kipli bir kullanıcı mesajı iletir
    - Doğrulama: yanıt `cat` + kodu içerir (OCR toleransı: küçük hatalara izin verilir)

İpucu: makinenizde neleri test edebileceğinizi (ve tam `provider/model` kimliklerini) görmek için şunu çalıştırın:

```bash
openclaw models list
openclaw models list --json
```

## Canlı: CLI backend smoke (Claude, Codex, Gemini veya diğer yerel CLI’lar)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Amaç: varsayılan yapılandırmanıza dokunmadan Gateway + agent işlem hattını yerel bir CLI backend kullanarak doğrulamak.
- Backend’e özgü smoke varsayılanları, sahibi olan extension’ın `cli-backend.ts` tanımıyla birlikte bulunur.
- Etkinleştirme:
  - `pnpm test:live` (veya Vitest doğrudan çağrılıyorsa `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Varsayılanlar:
  - Varsayılan sağlayıcı/model: `claude-cli/claude-sonnet-4-6`
  - Komut/argüman/image davranışı, sahibi olan CLI backend Plugin meta verisinden gelir.
- Geçersiz kılmalar (isteğe bağlı):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - Gerçek bir image eki göndermek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` (yollar prompt içine enjekte edilir).
  - Image dosya yollarını prompt enjeksiyonu yerine CLI argümanları olarak geçirmek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`.
  - `IMAGE_ARG` ayarlandığında image argümanlarının nasıl geçirileceğini denetlemek için `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (veya `"list"`).
  - İkinci bir tur gönderip devam akışını doğrulamak için `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`.
  - Varsayılan Claude Sonnet -> Opus aynı oturum süreklilik probe’unu kapatmak için `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` (seçilen model bir geçiş hedefini desteklediğinde zorla açmak için `1` ayarlayın).

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
- Canlı CLI-backend smoke testini depo Docker görüntüsü içinde root olmayan `node` kullanıcısı olarak çalıştırır.
- Sahibi olan extension’dan CLI smoke meta verisini çözer, ardından eşleşen Linux CLI paketini (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) önbellekli yazılabilir `OPENCLAW_DOCKER_CLI_TOOLS_DIR` öneki altına kurar (varsayılan: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription`, taşınabilir Claude Code abonelik OAuth’unu ya `claudeAiOauth.subscriptionType` içeren `~/.claude/.credentials.json` üzerinden ya da `claude setup-token` içinden gelen `CLAUDE_CODE_OAUTH_TOKEN` ile gerektirir. Önce Docker içinde doğrudan `claude -p` komutunu doğrular, ardından Anthropic API anahtarı env değişkenlerini korumadan iki Gateway CLI-backend turu çalıştırır. Claude şu anda üçüncü taraf uygulama kullanımını normal abonelik planı sınırları yerine ek kullanım faturalandırmasına yönlendirdiği için bu abonelik hattı varsayılan olarak Claude MCP/araç ve image probe’larını kapatır.
- Canlı CLI-backend smoke artık Claude, Codex ve Gemini için aynı uçtan uca akışı çalıştırır: metin turu, image sınıflandırma turu, ardından gateway CLI üzerinden doğrulanan MCP `cron` araç çağrısı.
- Claude’un varsayılan smoke testi ayrıca oturumu Sonnet’ten Opus’a yamalar ve devam ettirilen oturumun önceki bir notu hâlâ hatırladığını doğrular.

## Canlı: ACP bind smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Amaç: gerçek bir ACP agent ile gerçek ACP konuşma-bind akışını doğrulamak:
  - `/acp spawn <agent> --bind here` gönder
  - sentetik bir message-channel konuşmasını yerinde bağla
  - aynı konuşma üzerinde normal bir takip mesajı gönder
  - takibin bağlı ACP oturum transcript’ine düştüğünü doğrula
- Etkinleştirme:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Varsayılanlar:
  - Docker içindeki ACP agent’ları: `claude,codex,gemini`
  - Doğrudan `pnpm test:live ...` için ACP agent’ı: `claude`
  - Sentetik kanal: Slack DM tarzı konuşma bağlamı
  - ACP backend: `acpx`
- Geçersiz kılmalar:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notlar:
  - Bu hat, testlerin dışarıya teslim ediyormuş gibi davranmadan message-channel bağlamı ekleyebilmesi için admin-only sentetik originating-route alanlarıyla gateway `chat.send` yüzeyini kullanır.
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` ayarlanmadığında test, seçilen ACP harness agent’ı için gömülü `acpx` Plugin’in yerleşik agent kaydını kullanır.

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
- Varsayılan olarak ACP bind smoke testini desteklenen tüm canlı CLI agent’larına karşı sırayla çalıştırır: `claude`, `codex`, ardından `gemini`.
- Matrisi daraltmak için `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` veya `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` kullanın.
- `~/.profile` kaynağını alır, eşleşen CLI auth materyalini container içine hazırlar, `acpx`’i yazılabilir bir npm öneki içine kurar, ardından eksikse istenen canlı CLI’ı (`@anthropic-ai/claude-code`, `@openai/codex` veya `@google/gemini-cli`) kurar.
- Docker içinde çalıştırıcı `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` ayarlar; böylece acpx, kaynağı alınan profilden gelen sağlayıcı env değişkenlerini alt harness CLI için kullanılabilir tutar.

## Canlı: Codex app-server harness smoke

- Amaç: Plugin sahibi Codex harness’ini normal gateway
  `agent` yöntemi üzerinden doğrulamak:
  - paketlenmiş `codex` Plugin’ini yüklemek
  - `OPENCLAW_AGENT_RUNTIME=codex` seçmek
  - `codex/gpt-5.4` modeline ilk gateway agent turunu göndermek
  - aynı OpenClaw oturumuna ikinci bir tur göndermek ve app-server
    iş parçacığının devam edebildiğini doğrulamak
  - aynı gateway komut
    yolu üzerinden `/codex status` ve `/codex models` çalıştırmak
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Varsayılan model: `codex/gpt-5.4`
- İsteğe bağlı image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- İsteğe bağlı MCP/araç probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke testi, bozuk bir Codex
  harness’inin sessizce PI’ye geri düşerek geçememesi için `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlar.
- Auth: shell/profilden `OPENAI_API_KEY`, artı isteğe bağlı olarak kopyalanan
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
- Bağlanan `~/.profile` dosyasını kaynak olarak alır, `OPENAI_API_KEY` geçirir, varsa Codex CLI
  auth dosyalarını kopyalar, `@openai/codex` paketini yazılabilir bağlı bir npm
  öneki içine kurar, kaynak ağacını hazırlar ve ardından yalnızca Codex-harness canlı testini çalıştırır.
- Docker, image ve MCP/araç probe’larını varsayılan olarak etkinleştirir. Daha dar bir hata ayıklama çalıştırmasına ihtiyaç duyduğunuzda
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` veya
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ayarlayın.
- Docker ayrıca `OPENCLAW_AGENT_HARNESS_FALLBACK=none` dışa aktarır; bu, canlı
  test yapılandırmasıyla eşleşir, böylece `openai-codex/*` veya PI fallback bir Codex harness
  regresyonunu gizleyemez.

### Önerilen canlı tarifler

Dar ve açık izin listeleri en hızlı ve en az kararsız olanlardır:

- Tek model, doğrudan (gateway yok):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Tek model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Birden fazla sağlayıcıda araç çağırma:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google odağı (Gemini API anahtarı + Antigravity):
  - Gemini (API anahtarı): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notlar:

- `google/...`, Gemini API’yi kullanır (API anahtarı).
- `google-antigravity/...`, Antigravity OAuth köprüsünü kullanır (Cloud Code Assist tarzı agent uç noktası).
- `google-gemini-cli/...`, makinenizdeki yerel Gemini CLI’ı kullanır (ayrı auth + araçlama tuhaflıkları).
- Gemini API ile Gemini CLI karşılaştırması:
  - API: OpenClaw, Google’ın barındırılan Gemini API’sini HTTP üzerinden çağırır (API anahtarı / profil auth); çoğu kullanıcının “Gemini” derken kastettiği budur.
  - CLI: OpenClaw, yerel bir `gemini` ikili dosyasını shell üzerinden çağırır; bunun kendi auth yapısı vardır ve farklı davranabilir (akış/araç desteği/sürüm kayması).

## Canlı: model matrisi (neleri kapsıyoruz)

Sabit bir “CI model listesi” yoktur (canlı testler isteğe bağlıdır), ancak bunlar anahtarları olan bir geliştirme makinesinde düzenli olarak kapsanması **önerilen** modellerdir.

### Modern smoke kümesi (araç çağırma + image)

Bu, çalışır durumda tutmayı beklediğimiz “yaygın modeller” çalıştırmasıdır:

- OpenAI (Codex dışı): `openai/gpt-5.4` (isteğe bağlı: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` ve `google/gemini-3-flash-preview` (eski Gemini 2.x modellerinden kaçının)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` ve `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Araçlar + image ile gateway smoke çalıştırın:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Temel: araç çağırma (Read + isteğe bağlı Exec)

Her sağlayıcı ailesinden en az bir tane seçin:

- OpenAI: `openai/gpt-5.4` (veya `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (veya `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (veya `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

İsteğe bağlı ek kapsam (olsa iyi olur):

- xAI: `xai/grok-4` (veya mevcut en güncel sürüm)
- Mistral: `mistral/`… (etkinleştirdiğiniz “tools” özellikli bir model seçin)
- Cerebras: `cerebras/`… (erişiminiz varsa)
- LM Studio: `lmstudio/`… (yerel; araç çağırma API kipine bağlıdır)

### Vision: image gönderimi (ek → çok kipli mesaj)

Image probe’unu çalıştırmak için `OPENCLAW_LIVE_GATEWAY_MODELS` içine en az bir image destekli model ekleyin (Claude/Gemini/OpenAI’nin vision destekli varyantları vb.).

### Aggregator’lar / alternatif gateway’ler

Anahtarlarınız etkinse, şu yollarla test etmeyi de destekliyoruz:

- OpenRouter: `openrouter/...` (yüzlerce model; araç+image destekli adayları bulmak için `openclaw models scan` kullanın)
- OpenCode: Zen için `opencode/...` ve Go için `opencode-go/...` (auth: `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Canlı matrise ekleyebileceğiniz daha fazla sağlayıcı (kimlik bilgileriniz/yapılandırmanız varsa):

- Yerleşik: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` aracılığıyla (özel uç noktalar): `minimax` (bulut/API), artı OpenAI/Anthropic uyumlu herhangi bir proxy (LM Studio, vLLM, LiteLLM vb.)

İpucu: belgelere “tüm modelleri” sabit kodlamaya çalışmayın. Yetkili liste, makinenizde `discoverModels(...)` ne döndürüyorsa ve hangi anahtarlar mevcutsa odur.

## Kimlik bilgileri (asla commit etmeyin)

Canlı testler kimlik bilgilerini CLI ile aynı şekilde keşfeder. Pratik sonuçları:

- CLI çalışıyorsa, canlı testler de aynı anahtarları bulmalıdır.
- Bir canlı test “kimlik bilgisi yok” diyorsa, bunu `openclaw models list` / model seçimini nasıl hata ayıklıyorsanız öyle hata ayıklayın.

- Agent başına auth profilleri: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (canlı testlerde “profil anahtarları” denen şey budur)
- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Eski durum dizini: `~/.openclaw/credentials/` (varsa hazırlanan canlı home dizinine kopyalanır, ancak ana profil-anahtarı deposu değildir)
- Canlı yerel çalıştırmalar varsayılan olarak etkin yapılandırmayı, agent başına `auth-profiles.json` dosyalarını, eski `credentials/` dizinini ve desteklenen harici CLI auth dizinlerini geçici bir test home dizinine kopyalar; hazırlanan canlı home dizinleri `workspace/` ve `sandboxes/` dizinlerini atlar ve probe’ların gerçek ana makine çalışma alanınıza gitmemesi için `agents.*.workspace` / `agentDir` yol geçersiz kılmaları kaldırılır.

Env anahtarlarına güvenmek istiyorsanız (`~/.profile` içinde dışa aktarılmış olanlar gibi), yerel testleri `source ~/.profile` sonrasında çalıştırın veya aşağıdaki Docker çalıştırıcılarını kullanın (bunlar `~/.profile` dosyasını container içine bağlayabilir).

## Deepgram canlı (ses transkripsiyonu)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Etkinleştirme: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan canlı

- Test: `src/agents/byteplus.live.test.ts`
- Etkinleştirme: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- İsteğe bağlı model geçersiz kılması: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media canlı

- Test: `extensions/comfy/comfy.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Kapsam:
  - Paketlenmiş comfy image, video ve `music_generate` yollarını çalıştırır
  - `models.providers.comfy.<capability>` yapılandırılmamışsa her yeteneği atlar
  - Comfy workflow gönderimi, yoklama, indirmeler veya Plugin kaydı değiştirildikten sonra yararlıdır

## Image generation canlı

- Test: `src/image-generation/runtime.live.test.ts`
- Komut: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Kapsam:
  - Kayıtlı her image-generation sağlayıcı Plugin’ini numaralandırır
  - Yoklama yapmadan önce eksik sağlayıcı env değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak depolanmış auth profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Stok image-generation varyantlarını paylaşılan runtime yeteneği üzerinden çalıştırır:
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
- İsteğe bağlı auth davranışı:
  - Profil deposu auth’unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Music generation canlı

- Test: `extensions/music-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Kapsam:
  - Paylaşılan paketlenmiş music-generation sağlayıcı yolunu çalıştırır
  - Şu anda Google ve MiniMax’ı kapsar
  - Yoklama yapmadan önce sağlayıcı env değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak depolanmış auth profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Mevcut olduğunda her iki bildirilen runtime kipini de çalıştırır:
    - yalnızca prompt girdili `generate`
    - sağlayıcı `capabilities.edit.enabled` bildirdiğinde `edit`
  - Şu anki paylaşılan hat kapsamı:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ayrı Comfy canlı dosyası, bu paylaşılan tarama değil
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth’unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video generation canlı

- Test: `extensions/video-generation-providers.live.test.ts`
- Etkinleştirme: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Kapsam:
  - Paylaşılan paketlenmiş video-generation sağlayıcı yolunu çalıştırır
  - Varsayılan olarak sürüm için güvenli smoke yolunu kullanır: FAL dışı sağlayıcılar, sağlayıcı başına bir text-to-video isteği, bir saniyelik lobster prompt’u ve `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` içinden gelen sağlayıcı başına işlem üst sınırı (varsayılan `180000`)
  - Sağlayıcı tarafı kuyruk gecikmesi sürüm süresine baskın gelebileceği için FAL varsayılan olarak atlanır; bunu açıkça çalıştırmak için `--video-providers fal` veya `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` verin
  - Yoklama yapmadan önce sağlayıcı env değişkenlerini giriş shell’inizden (`~/.profile`) yükler
  - Varsayılan olarak depolanmış auth profillerinden önce canlı/env API anahtarlarını kullanır; böylece `auth-profiles.json` içindeki eski test anahtarları gerçek shell kimlik bilgilerini maskelemez
  - Kullanılabilir auth/profil/model olmayan sağlayıcıları atlar
  - Varsayılan olarak yalnızca `generate` çalıştırır
  - Kullanılabiliyorsa bildirilen dönüşüm kiplerini de çalıştırmak için `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` ayarlayın:
    - sağlayıcı `capabilities.imageToVideo.enabled` bildirdiğinde ve seçili sağlayıcı/model paylaşılan taramada buffer destekli yerel image girdisini kabul ettiğinde `imageToVideo`
    - sağlayıcı `capabilities.videoToVideo.enabled` bildirdiğinde ve seçili sağlayıcı/model paylaşılan taramada buffer destekli yerel video girdisini kabul ettiğinde `videoToVideo`
  - Paylaşılan taramada şu anda bildirilmiş ancak atlanan `imageToVideo` sağlayıcıları:
    - `vydra`, çünkü paketlenmiş `veo3` yalnızca metin desteklidir ve paketlenmiş `kling` uzak bir image URL’si gerektirir
  - Sağlayıcıya özgü Vydra kapsamı:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - bu dosya varsayılan olarak uzak bir image URL fixture’ı kullanan `kling` hattıyla birlikte `veo3` text-to-video çalıştırır
  - Geçerli `videoToVideo` canlı kapsamı:
    - yalnızca seçilen model `runway/gen4_aleph` olduğunda `runway`
  - Paylaşılan taramada şu anda bildirilmiş ancak atlanan `videoToVideo` sağlayıcıları:
    - `alibaba`, `qwen`, `xai`, çünkü bu yollar şu anda uzak `http(s)` / MP4 referans URL’leri gerektiriyor
    - `google`, çünkü mevcut paylaşılan Gemini/Veo hattı yerel buffer destekli girdi kullanıyor ve bu yol paylaşılan taramada kabul edilmiyor
    - `openai`, çünkü mevcut paylaşılan hatta kuruma özgü video inpaint/remix erişim garantileri yok
- İsteğe bağlı daraltma:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - Varsayılan taramaya FAL dahil her sağlayıcıyı katmak için `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - Agresif bir smoke çalıştırması için sağlayıcı başına işlem üst sınırını azaltmak üzere `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- İsteğe bağlı auth davranışı:
  - Profil deposu auth’unu zorlamak ve yalnızca env geçersiz kılmalarını yok saymak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Medya canlı harness’i

- Komut: `pnpm test:live:media`
- Amaç:
  - Paylaşılan image, music ve video canlı paketlerini depo yereline özgü tek bir giriş noktası üzerinden çalıştırır
  - Eksik sağlayıcı env değişkenlerini `~/.profile` içinden otomatik yükler
  - Varsayılan olarak her paketi şu anda kullanılabilir auth’a sahip sağlayıcılara otomatik olarak daraltır
  - `scripts/test-live.mjs` dosyasını yeniden kullanır; böylece Heartbeat ve sessiz kip davranışı tutarlı kalır
- Örnekler:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker çalıştırıcıları (isteğe bağlı “Linux’ta çalışıyor” kontrolleri)

Bu Docker çalıştırıcıları iki kovaya ayrılır:

- Canlı model çalıştırıcıları: `test:docker:live-models` ve `test:docker:live-gateway`, yalnızca eşleşen profil anahtarlı canlı dosyalarını depo Docker görüntüsü içinde çalıştırır (`src/agents/models.profiles.live.test.ts` ve `src/gateway/gateway-models.profiles.live.test.ts`), yerel config dizininizi ve çalışma alanınızı bağlar (ve bağlıysa `~/.profile` kaynağını alır). Eşleşen yerel giriş noktaları `test:live:models-profiles` ve `test:live:gateway-profiles` şeklindedir.
- Docker canlı çalıştırıcıları, tam bir Docker taramasının pratik kalması için varsayılan olarak daha küçük bir smoke üst sınırı kullanır:
  `test:docker:live-models` varsayılan olarak `OPENCLAW_LIVE_MAX_MODELS=12` kullanır ve
  `test:docker:live-gateway` varsayılan olarak `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` ve
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` kullanır. Daha büyük kapsamlı taramayı açıkça istediğinizde bu env değişkenlerini geçersiz kılın.
- `test:docker:all`, canlı Docker görüntüsünü bir kez `test:docker:live-build` ile oluşturur, sonra bunu iki canlı Docker hattı için yeniden kullanır.
- Container smoke çalıştırıcıları: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` ve `test:docker:plugins`, bir veya daha fazla gerçek container başlatır ve daha üst düzey integration yollarını doğrular.

Canlı model Docker çalıştırıcıları ayrıca yalnızca gerekli CLI auth home dizinlerini (veya çalışma daraltılmamışsa desteklenenlerin tümünü) bind-mount eder, sonra çalıştırmadan önce bunları container home dizinine kopyalar; böylece harici CLI OAuth host auth deposunu değiştirmeden token yenileyebilir:

- Doğrudan modeller: `pnpm test:docker:live-models` (betik: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (betik: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (betik: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (betik: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + geliştirme agent’ı: `pnpm test:docker:live-gateway` (betik: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI canlı smoke: `pnpm test:docker:openwebui` (betik: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard’ı (TTY, tam scaffolding): `pnpm test:docker:onboard` (betik: `scripts/e2e/onboard-docker.sh`)
- Gateway ağ iletişimi (iki container, WS auth + sağlık): `pnpm test:docker:gateway-network` (betik: `scripts/e2e/gateway-network-docker.sh`)
- MCP kanal köprüsü (tohumlanmış Gateway + stdio bridge + ham Claude bildirim-frame smoke): `pnpm test:docker:mcp-channels` (betik: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin’ler (install smoke + `/plugin` takma adı + Claude bundle yeniden başlatma semantiği): `pnpm test:docker:plugins` (betik: `scripts/e2e/plugins-docker.sh`)

Canlı model Docker çalıştırıcıları ayrıca geçerli checkout’u yalnızca okuma modunda bind-mount eder ve bunu container içinde geçici bir workdir içine hazırlar. Bu, runtime görüntüsünü ince tutarken yine de Vitest’i tam yerel kaynak/config’inize karşı çalıştırır.
Hazırlama adımı `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` ve uygulamaya özgü `.build` veya Gradle çıktı dizinleri gibi büyük yerel önbellekleri ve uygulama derleme çıktılarını atlar; böylece Docker canlı çalıştırmaları makineye özgü artifact’leri kopyalamak için dakikalar harcamaz.
Ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlar; böylece gateway canlı probe’ları container içinde gerçek Telegram/Discord vb. kanal worker’larını başlatmaz.
`test:docker:live-models` yine de `pnpm test:live` çalıştırır; bu nedenle bu Docker hattındaki gateway canlı kapsamını daraltmanız veya hariç tutmanız gerektiğinde `OPENCLAW_LIVE_GATEWAY_*` değişkenlerini de iletin.
`test:docker:openwebui` daha üst düzey bir uyumluluk smoke testidir: OpenAI uyumlu HTTP uç noktaları etkin bir OpenClaw gateway container’ı başlatır, bu gateway’e karşı sabitlenmiş bir Open WebUI container’ı başlatır, Open WebUI üzerinden oturum açar, `/api/models` içinde `openclaw/default` modelinin sunulduğunu doğrular, ardından Open WebUI’nin `/api/chat/completions` proxy’si üzerinden gerçek bir sohbet isteği gönderir.
İlk çalıştırma belirgin biçimde daha yavaş olabilir çünkü Docker’ın Open WebUI görüntüsünü çekmesi gerekebilir ve Open WebUI’nin kendi soğuk başlangıç kurulumunu tamamlaması gerekebilir.
Bu hat kullanılabilir bir canlı model anahtarı bekler ve `OPENCLAW_PROFILE_FILE`
(Docker ile çalıştırmalarda varsayılan olarak `~/.profile`) bunu sağlamak için birincil yoldur.
Başarılı çalıştırmalar `{ "ok": true, "model":
"openclaw/default", ... }` gibi küçük bir JSON yükü yazdırır.
`test:docker:mcp-channels` bilerek deterministiktir ve gerçek bir
Telegram, Discord veya iMessage hesabı gerektirmez. Tohumlanmış bir Gateway
container’ı başlatır, `openclaw mcp serve` üreten ikinci bir container başlatır, ardından yönlendirilmiş konuşma keşfini, transcript okumalarını, ek meta verisini, canlı olay kuyruğu davranışını, giden gönderim yönlendirmesini ve gerçek stdio MCP köprüsü üzerinden Claude tarzı kanal +
izin bildirimlerini doğrular. Bildirim denetimi ham stdio MCP frame’lerini doğrudan inceler; böylece smoke testi yalnızca belirli bir istemci SDK’sının göstermeye denk geldiklerini değil, köprünün gerçekte ne yaydığını doğrular.

Elle ACP sade dil thread smoke testi (CI değil):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Bu betiği regresyon/hata ayıklama iş akışları için saklayın. ACP thread yönlendirme doğrulaması için yeniden gerekebilir, bu yüzden silmeyin.

Yararlı env değişkenleri:

- `/home/node/.openclaw` dizinine bağlanan `OPENCLAW_CONFIG_DIR=...` (varsayılan: `~/.openclaw`)
- `/home/node/.openclaw/workspace` dizinine bağlanan `OPENCLAW_WORKSPACE_DIR=...` (varsayılan: `~/.openclaw/workspace`)
- `/home/node/.profile` dizinine bağlanan ve testler çalıştırılmadan önce kaynağı alınan `OPENCLAW_PROFILE_FILE=...` (varsayılan: `~/.profile`)
- Geçici config/workspace dizinleri ve harici CLI auth bağları olmadan yalnızca `OPENCLAW_PROFILE_FILE` içinden kaynaklanan env değişkenlerini doğrulamak için `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`
- Docker içindeki önbellekli CLI kurulumları için `/home/node/.npm-global` dizinine bağlanan `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (varsayılan: `~/.cache/openclaw/docker-cli-tools`)
- `$HOME` altındaki harici CLI auth dizinleri/dosyaları `/host-auth...` altında salt okunur bağlanır, ardından testler başlamadan önce `/home/node/...` altına kopyalanır
  - Varsayılan dizinler: `.minimax`
  - Varsayılan dosyalar: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Daraltılmış sağlayıcı çalıştırmaları yalnızca `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` üzerinden çıkarılan gerekli dizinleri/dosyaları bağlar
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` veya `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` gibi virgülle ayrılmış liste ile elle geçersiz kılın
- Çalıştırmayı daraltmak için `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- Container içindeki sağlayıcıları filtrelemek için `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- Yeniden derleme gerektirmeyen tekrar çalıştırmalar için mevcut `openclaw:local-live` görüntüsünü yeniden kullanmak üzere `OPENCLAW_SKIP_DOCKER_BUILD=1`
- Kimlik bilgilerinin env’den değil profil deposundan gelmesini sağlamak için `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke testi için gateway tarafından sunulan modeli seçmek üzere `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke testi tarafından kullanılan nonce denetimi prompt’unu geçersiz kılmak için `OPENCLAW_OPENWEBUI_PROMPT=...`
- Sabitlenmiş Open WebUI görüntü etiketini geçersiz kılmak için `OPENWEBUI_IMAGE=...`

## Belgeler için temel kontrol

Belge düzenlemelerinden sonra belge denetimlerini çalıştırın: `pnpm check:docs`.
Sayfa içi başlık denetimlerine de ihtiyaç duyduğunuzda tam Mintlify anchor doğrulamasını çalıştırın: `pnpm docs:check-links:anchors`.

## Çevrimdışı regresyon (CI için güvenli)

Bunlar gerçek sağlayıcılar olmadan “gerçek işlem hattı” regresyonlarıdır:

- Gateway araç çağırma (sahte OpenAI, gerçek gateway + agent döngüsü): `src/gateway/gateway.test.ts` (durum: "sahte bir OpenAI araç çağrısını gateway agent döngüsü üzerinden uçtan uca çalıştırır")
- Gateway wizard’ı (WS `wizard.start`/`wizard.next`, config + auth enforced yazar): `src/gateway/gateway.test.ts` (durum: "wizard’ı ws üzerinden çalıştırır ve auth token config yazar")

## Agent güvenilirlik değerlendirmeleri (Skills)

CI için güvenli, “agent güvenilirlik değerlendirmeleri” gibi davranan birkaç testimiz zaten var:

- Gerçek gateway + agent döngüsü üzerinden sahte araç çağırma (`src/gateway/gateway.test.ts`).
- Oturum kablolamasını ve config etkilerini doğrulayan uçtan uca wizard akışları (`src/gateway/gateway.test.ts`).

Skills için hâlâ eksik olanlar (bkz. [Skills](/tr/tools/skills)):

- **Karar verme:** prompt içinde Skills listelendiğinde, agent doğru Skill’i seçiyor mu (veya ilgisiz olanlardan kaçınıyor mu)?
- **Uyumluluk:** agent kullanmadan önce `SKILL.md` dosyasını okuyor ve gerekli adımları/argümanları izliyor mu?
- **İş akışı sözleşmeleri:** araç sırasını, oturum geçmişi devrini ve sandbox sınırlarını doğrulayan çok turlu senaryolar.

Gelecekteki değerlendirmeler önce deterministik kalmalıdır:

- Araç çağrılarını + sıralarını, Skill dosyası okumalarını ve oturum kablolamasını doğrulamak için sahte sağlayıcılar kullanan bir senaryo çalıştırıcısı.
- Skill odaklı küçük bir senaryo paketi (kullan vs kaçın, kapılama, prompt injection).
- İsteğe bağlı canlı değerlendirmeler (isteğe bağlı, env kapılı) yalnızca CI için güvenli paket yerleştirildikten sonra.

## Sözleşme testleri (Plugin ve kanal şekli)

Sözleşme testleri, kayıtlı her Plugin ve kanalın kendi
arayüz sözleşmesine uyduğunu doğrular. Keşfedilen tüm Plugin’ler üzerinde dolaşır ve bir dizi şekil ve davranış doğrulaması çalıştırır. Varsayılan `pnpm test` unit hattı bu paylaşılan seam ve smoke dosyalarını bilerek
atlar; paylaşılan kanal veya sağlayıcı yüzeylerine dokunduğunuzda sözleşme komutlarını açıkça çalıştırın.

### Komutlar

- Tüm sözleşmeler: `pnpm test:contracts`
- Yalnızca kanal sözleşmeleri: `pnpm test:contracts:channels`
- Yalnızca sağlayıcı sözleşmeleri: `pnpm test:contracts:plugins`

### Kanal sözleşmeleri

`src/channels/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **plugin** - Temel Plugin şekli (id, ad, yetenekler)
- **setup** - Kurulum wizard’ı sözleşmesi
- **session-binding** - Oturum bağlama davranışı
- **outbound-payload** - Mesaj payload yapısı
- **inbound** - Gelen mesaj işleme
- **actions** - Kanal eylem işleyicileri
- **threading** - Thread kimliği işleme
- **directory** - Dizin/roster API
- **group-policy** - Grup ilkesi uygulaması

### Sağlayıcı durum sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur.

- **status** - Kanal durum yoklamaları
- **registry** - Plugin kayıt şekli

### Sağlayıcı sözleşmeleri

`src/plugins/contracts/*.contract.test.ts` içinde bulunur:

- **auth** - Auth akışı sözleşmesi
- **auth-choice** - Auth seçimi/tercihi
- **catalog** - Model katalog API’si
- **discovery** - Plugin keşfi
- **loader** - Plugin yükleme
- **runtime** - Sağlayıcı runtime’ı
- **shape** - Plugin şekli/arayüzü
- **wizard** - Kurulum wizard’ı

### Ne zaman çalıştırılmalı

- plugin-sdk dışa aktarımlarını veya alt yollarını değiştirdikten sonra
- Bir kanal veya sağlayıcı Plugin ekledikten ya da değiştirdikten sonra
- Plugin kaydı veya keşfini yeniden düzenledikten sonra

Sözleşme testleri CI’da çalışır ve gerçek API anahtarları gerektirmez.

## Regresyon ekleme (rehber)

Canlı ortamda keşfedilmiş bir sağlayıcı/model sorununu düzelttiğinizde:

- Mümkünse CI için güvenli bir regresyon ekleyin (sahte/stub sağlayıcı veya tam istek-şekli dönüşümünü yakalayın)
- Sorun doğası gereği yalnızca canlıysa (rate limit, auth ilkeleri), canlı testi dar ve env değişkenleriyle isteğe bağlı tutun
- Hatayı yakalayan en küçük katmanı hedeflemeyi tercih edin:
  - sağlayıcı istek dönüştürme/replay hatası → doğrudan modeller testi
  - gateway oturum/geçmiş/araç işlem hattı hatası → gateway canlı smoke veya CI için güvenli gateway sahte testi
- SecretRef geçiş korkuluğu:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`, kayıt meta verisinden (`listSecretTargetRegistryEntries()`) SecretRef sınıfı başına örneklenmiş bir hedef türetir, ardından geçiş segmenti exec id’lerinin reddedildiğini doğrular.
  - `src/secrets/target-registry-data.ts` içinde yeni bir `includeInPlan` SecretRef hedef ailesi eklerseniz, bu testte `classifyTargetClass` işlevini güncelleyin. Test, sınıflandırılmamış hedef kimliklerinde bilerek başarısız olur; böylece yeni sınıflar sessizce atlanamaz.
