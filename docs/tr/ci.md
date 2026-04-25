---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor
    - Başarısız GitHub Actions denetimlerinde hata ayıklıyorsunuz
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-04-25T13:42:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

CI, `main` dalına yapılan her push'ta ve her pull request'te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

QA Lab, ana akıllı kapsamlı iş akışının dışında özel CI hatlarına sahiptir. `Parity gate` iş akışı eşleşen PR değişikliklerinde ve manuel tetiklemede çalışır; özel QA çalışma zamanını derler ve sahte GPT-5.4 ile Opus 4.6 agentic pack'lerini karşılaştırır. `QA-Lab - All Lanes` iş akışı `main` üzerinde her gece ve manuel tetiklemede çalışır; sahte parity gate, canlı Matrix hattı ve canlı Telegram hattını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` environment'ını kullanır ve Telegram hattı Convex lease'leri kullanır. `OpenClaw Release Checks` de sürüm onayından önce aynı QA Lab hatlarını çalıştırır.

`Duplicate PRs After Merge` iş akışı, merge sonrası yinelenen PR temizliği için bakımcıya yönelik manuel bir iş akışıdır. Varsayılan olarak dry-run modundadır ve yalnızca `apply=true` olduğunda açıkça listelenen PR'leri kapatır. GitHub üzerinde değişiklik yapmadan önce, merge edilen PR'nin gerçekten merge edildiğini ve her yinelenen PR'nin ya ortak bir referans verilen issue'ya sahip olduğunu ya da çakışan değişiklik hunk'ları içerdiğini doğrular.

`Docs Agent` iş akışı, mevcut belgeleri yakın zamanda merge edilmiş değişikliklerle uyumlu tutmak için olaya dayalı bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki bot olmayan başarılı bir push CI çalışması onu tetikleyebilir ve manuel tetikleme onu doğrudan çalıştırabilir. Workflow-run çağrıları, `main` ilerlemişse veya son bir saat içinde atlanmamış başka bir Docs Agent çalışması oluşturulmuşsa atlanır. Çalıştığında, önceki atlanmamış Docs Agent kaynak SHA'sından mevcut `main`'e kadar olan commit aralığını inceler; böylece saatlik tek bir çalışma, son docs geçişinden bu yana biriken tüm `main` değişikliklerini kapsayabilir.

`Test Performance Agent` iş akışı, yavaş testler için olaya dayalı bir Codex bakım hattıdır. Saf bir zamanlaması yoktur: `main` üzerindeki bot olmayan başarılı bir push CI çalışması onu tetikleyebilir, ancak aynı UTC gününde başka bir workflow-run çağrısı zaten çalışmış veya çalışıyorsa atlanır. Manuel tetikleme bu günlük etkinlik geçidini aşar. Bu hat tam paket, gruplanmış bir Vitest performans raporu oluşturur, Codex'in geniş çaplı refactor'lar yerine yalnızca kapsamı koruyan küçük test performansı düzeltmeleri yapmasına izin verir, ardından tam paket raporunu yeniden çalıştırır ve geçen temel test sayısını azaltan değişiklikleri reddeder. Temel durumda başarısız testler varsa Codex yalnızca bariz hataları düzeltebilir ve commit edilmeden önce agent sonrası tam paket raporunun geçmesi gerekir. Bot push'u inmeden önce `main` ilerlerse, hat doğrulanmış yamayı rebase eder, `pnpm check:changed` komutunu yeniden çalıştırır ve push'u yeniden dener; çakışan bayat yamalar atlanır. Codex action'ın docs agent ile aynı sudo-drop güvenlik duruşunu koruyabilmesi için GitHub-hosted Ubuntu kullanır.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## İş genel görünümü

| İş                               | Amaç                                                                                         | Ne zaman çalışır                     |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Yalnızca docs değişikliklerini, değişen kapsamları, değişen extension'ları algılar ve CI manifest'ini oluşturur | Her zaman, draft olmayan push ve PR'lerde |
| `security-scm-fast`              | `zizmor` üzerinden özel anahtar tespiti ve iş akışı denetimi                                | Her zaman, draft olmayan push ve PR'lerde |
| `security-dependency-audit`      | npm advisories'e karşı bağımlılıksız production lockfile denetimi                            | Her zaman, draft olmayan push ve PR'lerde |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu iş                                                  | Her zaman, draft olmayan push ve PR'lerde |
| `build-artifacts`                | `dist/`, Control UI, built-artifact denetimleri ve yeniden kullanılabilir downstream artifact'leri derler | Node ile ilgili değişiklikler        |
| `checks-fast-core`               | Paketlenmiş/plugin-contract/protocol denetimleri gibi hızlı Linux doğruluk hatları           | Node ile ilgili değişiklikler        |
| `checks-fast-contracts-channels` | Kararlı bir toplu denetim sonucu ile parçalanmış kanal sözleşmesi denetimleri                | Node ile ilgili değişiklikler        |
| `checks-node-extensions`         | Extension paketi genelinde tam paketlenmiş plugin test parçaları                             | Node ile ilgili değişiklikler        |
| `checks-node-core-test`          | Kanal, paketlenmiş, sözleşme ve extension hatları hariç çekirdek Node test parçaları         | Node ile ilgili değişiklikler        |
| `extension-fast`                 | Yalnızca değişen paketlenmiş plugin'ler için odaklı testler                                  | Extension değişiklikli pull request'ler |
| `check`                          | Parçalanmış ana yerel geçit eşdeğeri: prod type'ları, lint, guard'lar, test type'ları ve strict smoke | Node ile ilgili değişiklikler        |
| `check-additional`               | Mimari, boundary, extension-surface guard'ları, package-boundary ve gateway-watch parçaları  | Node ile ilgili değişiklikler        |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                               | Node ile ilgili değişiklikler        |
| `checks`                         | Built-artifact kanal testleri ve yalnızca push için Node 22 uyumluluğu doğrulayıcısı         | Node ile ilgili değişiklikler        |
| `check-docs`                     | Docs biçimlendirme, lint ve bozuk bağlantı denetimleri                                       | Docs değiştiğinde                    |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                    | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows'a özgü test hatları                                                                  | Windows ile ilgili değişiklikler     |
| `macos-node`                     | Paylaşılan built artifact'leri kullanan macOS TypeScript test hattı                          | macOS ile ilgili değişiklikler       |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                         | macOS ile ilgili değişiklikler       |
| `android`                        | Her iki flavor için Android birim testleri ve bir debug APK derlemesi                        | Android ile ilgili değişiklikler     |
| `test-performance-agent`         | Güvenilir etkinlik sonrası günlük Codex yavaş test optimizasyonu                             | Main CI başarısı veya manuel tetikleme |

## Fail-fast sırası

İşler, pahalı olanlar çalışmadan önce ucuz denetimler başarısız olacak şekilde sıralanır:

1. `preflight`, hangi hatların hiç var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışacak şekilde çalışır; böylece downstream tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı hatları bundan sonra paralel olarak dağılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, yalnızca PR için `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yer alır ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır.
CI iş akışı düzenlemeleri Node CI grafiğini ve iş akışı lint denetimini doğrular, ancak tek başına Windows, Android veya macOS yerel derlemelerini zorlamaz; bu platform hatları platform kaynak değişikliklerine göre kapsamlandırılmış kalır.
Yalnızca CI yönlendirme düzenlemeleri, seçili ucuz core-test fixture düzenlemeleri ve dar plugin contract yardımcı/test-routing düzenlemeleri hızlı bir yalnızca-Node manifest yolunu kullanır: preflight, security ve tek bir `checks-fast-core` görevi. Bu yol, değişen dosyalar hızlı görevin doğrudan çalıştırdığı yönlendirme veya yardımcı yüzeylerle sınırlı olduğunda build artifact'lerini, Node 22 uyumluluğunu, kanal sözleşmelerini, tam core shard'larını, paketlenmiş plugin shard'larını ve ek guard matrislerini atlar.
Windows Node denetimleri, Windows'a özgü process/path wrapper'larına, npm/pnpm/UI runner yardımcılarına, paket yöneticisi yapılandırmasına ve bu hattı çalıştıran CI iş akışı yüzeylerine göre kapsamlandırılır; ilgisiz kaynak, plugin, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır, böylece normal test shard'ları tarafından zaten kapsanan kapsama için 16-vCPU'lu bir Windows worker ayrılmaz.
Ayrı `install-smoke` iş akışı, kendi `preflight` işi üzerinden aynı kapsam betiğini yeniden kullanır. Smoke kapsamını `run_fast_install_smoke` ve `run_full_install_smoke` olarak böler. Pull request'ler Docker/package yüzeyleri, paketlenmiş plugin package/manifest değişiklikleri ve Docker smoke işlerinin çalıştırdığı core plugin/channel/gateway/Plugin SDK yüzeyleri için hızlı yolu çalıştırır. Yalnızca kaynak düzeyindeki paketlenmiş plugin değişiklikleri, yalnızca test düzenlemeleri ve yalnızca docs düzenlemeleri Docker worker'larını ayırmaz. Hızlı yol kök Dockerfile imajını bir kez derler, CLI'ı denetler, agents delete shared-workspace CLI smoke testini çalıştırır, container gateway-network e2e'yi çalıştırır, paketlenmiş bir extension build arg'ını doğrular ve her senaryonun Docker çalıştırması ayrı ayrı sınırlandırılmışken 240 saniyelik toplam komut zaman aşımı altında sınırlı paketlenmiş-plugin Docker profilini çalıştırır. Tam yol, QR package install ve installer Docker/update kapsamını gece zamanlamalı çalıştırmalar, manuel tetiklemeler, workflow-call sürüm denetimleri ve gerçekten installer/package/Docker yüzeylerine dokunan pull request'ler için korur. Merge commit'leri dahil `main` push'ları tam yolu zorlamaz; changed-scope mantığı bir push'ta tam kapsam isterse iş akışı hızlı Docker smoke'u korur ve tam install smoke'u gece veya sürüm doğrulamasına bırakır. Yavaş Bun global install image-provider smoke testi ayrı olarak `run_bun_global_install_smoke` tarafından geçitlenir; gece zamanlamasında ve release checks iş akışından çalışır, manuel `install-smoke` tetiklemeleri ise isteğe bağlı olarak bunu dahil edebilir, ancak pull request'ler ve `main` push'ları bunu çalıştırmaz. QR ve installer Docker testleri kendi install odaklı Dockerfile'larını korur. Yerel `test:docker:all`, paylaşılan bir live-test imajı ve paylaşılan bir `scripts/e2e/Dockerfile` built-app imajını önceden derler, ardından live/E2E smoke hatlarını ağırlıklı bir zamanlayıcı ve `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır; varsayılan 10'luk ana havuz slot sayısını `OPENCLAW_DOCKER_ALL_PARALLELISM` ile ve sağlayıcıya duyarlı kuyruk havuzu için varsayılan 10'luk slot sayısını `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` ile ayarlayın. Ağır hat sınırları varsayılan olarak `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` ve `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` değerlerindedir; böylece npm install ve çok servisli hatlar Docker'ı aşırı yüklemezken daha hafif hatlar mevcut slotları doldurabilir. Hat başlangıçları, yerel Docker daemon create fırtınalarını önlemek için varsayılan olarak 2 saniye aralıklıdır; `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` veya başka bir milisaniye değeriyle geçersiz kılın. Yerel toplu ön kontrol Docker'ı denetler, bayat OpenClaw E2E container'larını kaldırır, etkin hat durumunu yayımlar, en uzun önce sıralaması için hat sürelerini kalıcı hale getirir ve zamanlayıcı incelemesi için `OPENCLAW_DOCKER_ALL_DRY_RUN=1` desteği sunar. Varsayılan olarak ilk başarısızlıktan sonra yeni havuzlanmış hatlar zamanlamayı durdurur ve her hat için `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık yedek zaman aşımı vardır; seçili live/tail hatları daha sıkı hat başına sınırlar kullanır. Yeniden kullanılabilir live/E2E iş akışı, Docker matrisi öncesinde SHA etiketli tek bir GHCR Docker E2E imajı derleyip iterek aynı paylaşılan imaj desenini yansıtır, ardından matrisi `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır. Zamanlanmış live/E2E iş akışı tam sürüm yolu Docker paketini günlük çalıştırır. Paketlenmiş update matrisi update hedefine göre bölünmüştür; böylece tekrarlanan npm update ve doctor repair geçişleri diğer paketlenmiş denetimlerle shard'lanabilir.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde yer alır ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel geçit, geniş CI platform kapsamına göre mimari sınırlar konusunda daha katıdır: core production değişiklikleri core prod typecheck artı core testleri çalıştırır, yalnızca core test değişiklikleri yalnızca core test typecheck/testlerini çalıştırır, extension production değişiklikleri extension prod typecheck artı extension testlerini çalıştırır ve yalnızca extension test değişiklikleri yalnızca extension test typecheck/testlerini çalıştırır. Genel Plugin SDK veya plugin-contract değişiklikleri extension doğrulamasını genişletir çünkü extension'lar bu core sözleşmelerine bağlıdır. Yalnızca sürüm metadata'sı içeren version bump'ları hedefli version/config/root-dependency denetimleri çalıştırır. Bilinmeyen root/config değişiklikleri güvenli tarafta kalarak tüm hatlara başarısız olur.

Push'larda `checks` matrisi yalnızca push için olan `compat-node22` hattını ekler. Pull request'lerde bu hat atlanır ve matris normal test/kanal hatlarına odaklanmış kalır.

En yavaş Node test aileleri, her iş küçük kalırken runner'lar gereğinden fazla ayrılmasın diye bölünür veya dengelenir: kanal sözleşmeleri üç ağırlıklı shard olarak çalışır, paketlenmiş plugin testleri altı extension worker'ı arasında dengelenir, küçük core birim hatları eşleştirilir, auto-reply altı küçük worker yerine üç dengeli worker olarak çalışır ve agentic gateway/plugin yapılandırmaları built artifact'leri beklemek yerine mevcut yalnızca kaynak agentic Node işlerine dağıtılır. Geniş browser, QA, medya ve çeşitli plugin testleri paylaşılan plugin catch-all yerine kendi özel Vitest yapılandırmalarını kullanır. Extension shard işleri, import ağırlıklı plugin grupları ek CI işleri oluşturmadan çalışabilsin diye bir Vitest worker'ı grup başına olacak şekilde ve daha büyük bir Node heap ile aynı anda en fazla iki plugin config grubunu çalıştırır. Geniş agents hattı, tek bir yavaş test dosyasına ait olmaktan çok import/zamanlama ağırlıklı olduğu için paylaşılan Vitest dosya paralel zamanlayıcısını kullanır. `runtime-config`, paylaşılan runtime shard'ının kuyruğun sonunu sahiplenmesini önlemek için infra core-runtime shard'ı ile birlikte çalışır. `check-additional`, package-boundary derleme/canary işlerini birlikte tutar ve runtime topology mimarisini gateway watch kapsamından ayırır; boundary guard shard'ı küçük bağımsız guard'larını tek bir iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve core support-boundary shard'ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır; bu, eski denetim adlarını hafif doğrulayıcı işler olarak korurken iki ek Blacksmith worker'ı ve ikinci bir artifact-consumer kuyruğunu önler.
Android CI, hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır, ardından Play debug APK'sını derler. Third-party flavor'ın ayrı bir source set'i veya manifest'i yoktur; onun birim test hattı yine de bu flavor'ı SMS/call-log BuildConfig bayraklarıyla derlerken, her Android ile ilgili push'ta yinelenen bir debug APK paketleme işinden kaçınır.
`extension-fast` yalnızca PR içindir çünkü push çalıştırmaları zaten tam paketlenmiş plugin shard'larını yürütür. Bu, `main` üzerinde zaten `checks-node-extensions` içinde bulunan kapsam için ek bir Blacksmith worker ayırmadan incelemeler için değişen plugin geri bildirimini korur.

GitHub, aynı PR veya `main` ref'ine daha yeni bir push geldiğinde yerini alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalışma da başarısız olmadıkça bunu CI gürültüsü olarak değerlendirin. Toplu shard denetimleri `!cancelled() && always()` kullanır; böylece normal shard hatalarını yine bildirirler ancak tüm iş akışı zaten yerini daha yenisine bıraktıktan sonra kuyruğa girmezler.
CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`); böylece eski bir kuyruk grubundaki GitHub tarafı zombi süreçler yeni `main` çalışmalarını süresiz olarak engelleyemez.

## Runner'lar

| Runner                           | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplu işler (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protocol/contract/bundled denetimleri, parçalanmış kanal sözleşmesi denetimleri, lint dışındaki `check` shard'ları, `check-additional` shard'ları ve toplu işleri, Node test toplu doğrulayıcıları, docs denetimleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da Blacksmith matrisinin daha erken kuyruğa girebilmesi için GitHub-hosted Ubuntu kullanır |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard'ları, paketlenmiş plugin test shard'ları, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`; bu iş CPU'ya yeterince duyarlı kaldığı için 8 vCPU tasarruf ettiğinden daha pahalıya mal oldu; ayrıca 32-vCPU kuyruk süresinin sağladığından daha pahalıya mal olduğu install-smoke Docker derlemeleri                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest`'e geri döner                                                                                                                                                                                                                                                                                                                                                                                             |

## Yerel eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını inceleyin
pnpm check:changed   # akıllı yerel geçit: sınır hattına göre changed typecheck/lint/testler
pnpm check          # hızlı yerel geçit: production tsgo + parçalanmış lint + paralel hızlı guard'lar
pnpm check:test-types
pnpm check:timed    # aşama başına sürelerle aynı geçit
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke hatları önemliyse dist derleyin
node scripts/ci-run-timings.mjs <run-id>      # duvar süresi, kuyruk süresi ve en yavaş işleri özetleyin
node scripts/ci-run-timings.mjs --recent 10   # son başarılı main CI çalıştırmalarını karşılaştırın
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Sürüm kanalları](/tr/install/development-channels)
